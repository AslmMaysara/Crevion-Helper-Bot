import { Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { config } from '../config/config.js';
import fetch from 'node-fetch';

const COLOR_CHANNEL_ID = '1437116837228843168';

export default {
    name: Events.MessageCreate,
    async execute(message, client) {
        if (message.channel.id !== COLOR_CHANNEL_ID) return;
        if (message.author.bot) return;
        
        const images = message.attachments.filter(att => 
            att.contentType?.startsWith('image/')
        );

        if (images.size === 0) return;

        const image = images.first();
        
        try {
            await message.channel.sendTyping();

            // Use color extraction API
            const apiUrl = `https://api.color.pizza/v1/?uri=${encodeURIComponent(image.url)}`;
            const response = await fetch(apiUrl);
            const data = await response.json();

            if (!data.colors || data.colors.length === 0) {
                throw new Error('No colors found');
            }

            // Get top 8 colors and calculate percentages properly
            const colors = data.colors.slice(0, 8);
            const totalPopulation = colors.reduce((sum, c) => sum + (c.population || 1), 0);
            
            // Calculate percentages
            const colorsWithPercent = colors.map(color => ({
                ...color,
                percentage: Math.round((color.population / totalPopulation) * 100)
            }));

            // Sort by percentage
            colorsWithPercent.sort((a, b) => b.percentage - a.percentage);

            const dominantColor = parseInt(colorsWithPercent[0].hex.replace('#', ''), 16);

            const embed = new EmbedBuilder()
                .setColor(config.settings.defaultColor) // لون السيرفر
                .setAuthor({
                    name: `${message.author.username}'s Color Palette`,
                    iconURL: message.author.displayAvatarURL()
                })
                .setTitle('🎨 Color Palette Analysis')
                .setThumbnail(image.url)
                .setDescription(`Extracted **${colorsWithPercent.length}** dominant colors from your image`);

            // Add each color with visual indicator
            let colorFields = '';
            colorsWithPercent.forEach((color, index) => {
                const bar = createColorBar(color.percentage);
                const colorSquare = '⬛'; // Will show as colored square
                colorFields += `${index + 1}. **${color.name}**\n`;
                colorFields += `   ${createColorBlock(color.hex)} \`${color.hex}\` ${bar} **${color.percentage}%**\n\n`;
            });

            embed.addFields({
                name: '🎨 Color Breakdown',
                value: colorFields,
                inline: false
            });

            // Quick copy section
            const hexCodes = colorsWithPercent.map(c => `\`${c.hex}\``).join(' ');
            embed.addFields({
                name: '📋 Quick Copy (HEX)',
                value: hexCodes,
                inline: false
            });

            // RGB values
            const rgbCodes = colorsWithPercent.slice(0, 4).map(c => {
                const rgb = hexToRgb(c.hex);
                return `\`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})\``;
            }).join(' ');
            
            embed.addFields({
                name: '🔢 RGB Values (Top 4)',
                value: rgbCodes,
                inline: false
            });

            embed.setFooter({
                text: `${config.settings.embedFooter} | Powered by Color Pizza API`,
                icon_url: config.settings.embedFooterIcon
            });
            embed.setTimestamp();

            // Buttons for actions
            const buttons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setLabel('View Image')
                        .setStyle(ButtonStyle.Link)
                        .setURL(image.url)
                        .setEmoji('🖼️'),
                    new ButtonBuilder()
                        .setLabel('Download Palette')
                        .setStyle(ButtonStyle.Secondary)
                        .setCustomId(`palette_${Date.now()}`)
                        .setEmoji('💾'),
                    new ButtonBuilder()
                        .setLabel('Share Palette')
                        .setStyle(ButtonStyle.Secondary)
                        .setCustomId(`share_${Date.now()}`)
                        .setEmoji('📤')
                );

            await message.reply({ embeds: [embed], components: [buttons] });

        } catch (error) {
            console.error('❌ Color extraction error:', error);
            await message.reply({
                embeds: [{
                    color: config.settings.errorColor,
                    title: '❌ Extraction Failed',
                    description: 'Failed to analyze colors. Please try a different image.',
                    footer: {
                        text: config.settings.embedFooter,
                        icon_url: config.settings.embedFooterIcon
                    }
                }]
            }).catch(() => {});
        }
    }
};

function createColorBar(percentage) {
    const filled = Math.round(percentage / 10);
    const empty = 10 - filled;
    return '█'.repeat(Math.max(0, filled)) + '░'.repeat(Math.max(0, empty));
}

function createColorBlock(hex) {
    // Convert hex to RGB
    const rgb = hexToRgb(hex);
    // Create colored indicator using regional indicators as visual blocks
    return `🟦`; // Discord will show this, or use custom emoji
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
}