import { Events } from 'discord.js';
import { config } from '../config/config.js';
import { PermissionLevels, getPermissionLevelName } from '../utils/permissions.js';

export default {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
        // Handle Select Menu
        if (interaction.isStringSelectMenu()) {
            await handleSelectMenu(interaction, client);
        }
        
        // Handle Buttons
        if (interaction.isButton()) {
            await handleButton(interaction, client);
        }
    }
};

// 🎨 Handle Select Menu Interactions
async function handleSelectMenu(interaction, client) {
    if (interaction.customId === 'help_category') {
        const category = interaction.values[0];
        const member = await interaction.guild.members.fetch(interaction.user.id);
        
        // Get commands in this category
        const commands = Array.from(client.commands.values()).filter(cmd => {
            const cmdCategory = getCommandCategory(cmd);
            return cmdCategory === category;
        });

        if (commands.length === 0) {
            return await interaction.reply({
                embeds: [{
                    color: config.settings.warningColor,
                    description: '⚠️ No commands found in this category'
                }],
                ephemeral: true
            });
        }

        const categoryEmbed = {
            color: config.settings.defaultColor,
            title: `${getCategoryEmoji(category)} ${getCategoryName(category)}`,
            description: `Here are all commands in the **${getCategoryName(category)}** category:`,
            fields: commands.map(cmd => ({
                name: `/${cmd.data.name}`,
                value: `${cmd.data.description}\n**Permission:** ${getPermissionLevelName(cmd.permission || PermissionLevels.EVERYONE)}`,
                inline: true
            })),
            thumbnail: { url: config.settings.embedThumbnail },
            footer: {
                text: `${config.settings.embedFooter} | Use /help [command] for details`,
                icon_url: config.settings.embedFooterIcon
            },
            timestamp: new Date()
        };

        await interaction.reply({ embeds: [categoryEmbed], ephemeral: true });
    }
}

// 🔘 Handle Button Interactions
async function handleButton(interaction, client) {
    if (interaction.customId === 'bot_info') {
        const infoEmbed = {
            color: config.settings.defaultColor,
            author: {
                name: config.about.name,
                icon_url: config.settings.embedThumbnail
            },
            title: `✨ ${config.about.tagline}`,
            description: config.about.description,
            fields: [
                {
                    name: '🎯 Features',
                    value: config.about.features.join('\n'),
                    inline: false
                },
                {
                    name: '📊 Statistics',
                    value: [
                        `**Servers:** ${client.guilds.cache.size}`,
                        `**Users:** ${client.users.cache.size}`,
                        `**Commands:** ${client.commands.size}`,
                        `**Uptime:** ${formatUptime(client.stats.startTime)}`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: 'ℹ️ Info',
                    value: [
                        `**Version:** ${config.about.version}`,
                        `**Developer:** ${config.about.developer}`,
                        `**Prefix:** \`${config.settings.prefix || '/'}\``
                    ].join('\n'),
                    inline: true
                }
            ],
            thumbnail: { url: config.settings.embedThumbnail },
            footer: {
                text: config.settings.embedFooter,
                icon_url: config.settings.embedFooterIcon
            },
            timestamp: new Date()
        };

        await interaction.reply({ embeds: [infoEmbed], ephemeral: true });
    }
}

// Helper functions
function getCommandCategory(cmd) {
    const level = cmd.permission || PermissionLevels.EVERYONE;
    
    if (level >= PermissionLevels.OWNER) return 'owner';
    if (level >= PermissionLevels.MODERATOR) return 'moderation';
    if (level >= PermissionLevels.HELPER) return 'creator';
    return 'general';
}

function getCategoryEmoji(category) {
    const emojis = {
        general: '📂',
        moderation: '🛡️',
        creator: '🎨',
        owner: '👑'
    };
    return emojis[category] || '📁';
}

function getCategoryName(category) {
    const names = {
        general: 'General Commands',
        moderation: 'Moderation',
        creator: 'Creator Tools',
        owner: 'Owner Only'
    };
    return names[category] || category;
}

function formatUptime(startTime) {
    const uptime = Date.now() - startTime;
    const days = Math.floor(uptime / 86400000);
    const hours = Math.floor((uptime % 86400000) / 3600000);
    const minutes = Math.floor((uptime % 3600000) / 60000);
    return `${days}d ${hours}h ${minutes}m`;
}