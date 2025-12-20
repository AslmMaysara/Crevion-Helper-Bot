// src/commands/owner/line.js - FIXED VERSION WITH DISCORD CDN SUPPORT

import { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } from 'discord.js';
import { PermissionFlagsBits } from 'discord.js';
import { PermissionLevels } from '../../utils/permissions.js';
import { getConfig, updateConfig } from '../../models/index.js';
import fetch from 'node-fetch';

export default {
    data: new SlashCommandBuilder()
        .setName('line')
        .setDescription('Manage server line/divider image')
        .addSubcommand(subcommand =>
            subcommand
                .setName('set')
                .setDescription('Set the line image URL')
                .addStringOption(option =>
                    option
                        .setName('url')
                        .setDescription('Direct image URL (Discord CDN, Imgur, etc)')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription('View current line configuration')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('test')
                .setDescription('Test the current line image')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove the line image')
        ),

    permission: PermissionLevels.ADMIN,
    prefixAlias: 'line',

    async execute(interaction, client) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'set') {
            await handleSetLine(interaction);
        } else if (subcommand === 'view') {
            await handleViewLine(interaction);
        } else if (subcommand === 'test') {
            await handleTestLine(interaction);
        } else if (subcommand === 'remove') {
            await handleRemoveLine(interaction);
        }
    },

    async executePrefix(message, args, client) {
        if (args.length === 0) {
            return await message.reply({
                embeds: [{
                    color: 0xFEE75C,
                    title: '📏 Line System',
                    description: '**Usage:**\n`-line set <url>` - Set line image\n`-line view` - View current line\n`-line test` - Test line\n`-line remove` - Remove line',
                    footer: { text: 'Crévion' }
                }],
                allowedMentions: { repliedUser: false }
            });
        }

        const subcommand = args[0].toLowerCase();

        if (subcommand === 'set' && args[1]) {
            await handleSetLinePrefix(message, args[1]);
        } else if (subcommand === 'view') {
            await handleViewLinePrefix(message);
        } else if (subcommand === 'test') {
            await handleTestLinePrefix(message);
        } else if (subcommand === 'remove') {
            await handleRemoveLinePrefix(message);
        }
    }
};

// ✅ Set line URL - FIXED TO ACCEPT DISCORD CDN
async function handleSetLine(interaction) {
    try {
        await interaction.deferReply({ ephemeral: true });

        const url = interaction.options.getString('url');

        // ✅ FIXED: Accept Discord CDN URLs and any image URL
        if (!url.match(/^https?:\/\/.+/i)) {
            return await interaction.editReply({
                embeds: [{
                    color: 0xED4245,
                    title: '❌ Invalid URL',
                    description: 'Please provide a valid HTTP/HTTPS URL',
                    footer: { text: 'Crévion' }
                }]
            });
        }

        // ✅ Test the URL by fetching it
        try {
            const response = await fetch(url, { method: 'HEAD', timeout: 5000 });
            
            if (!response.ok) {
                throw new Error('Failed to fetch image');
            }
            
            const contentType = response.headers.get('content-type');
            
            // ✅ FIXED: Accept Discord CDN (which may not return proper content-type)
            const isDiscordCDN = url.includes('cdn.discordapp.com') || url.includes('media.discordapp.net');
            const isImage = contentType && contentType.startsWith('image/');
            
            if (!isImage && !isDiscordCDN) {
                return await interaction.editReply({
                    embeds: [{
                        color: 0xED4245,
                        title: '❌ Not an Image',
                        description: 'The URL must point to an image file.\n\n**Supported:** PNG, JPG, GIF, WebP, or Discord CDN links',
                        footer: { text: 'Crévion' }
                    }]
                });
            }
            
        } catch (error) {
            return await interaction.editReply({
                embeds: [{
                    color: 0xED4245,
                    title: '❌ Invalid Image URL',
                    description: `Could not load the image from this URL.\n\n**Error:** ${error.message}\n\n**Tips:**\n• Make sure the URL is accessible\n• Try uploading to Discord and copying the link\n• Use Imgur or other image hosting`,
                    footer: { text: 'Crévion' }
                }]
            });
        }

        // ✅ Save to database
        await updateConfig({
            'lineConfig.url': url
        });

        const embed = new EmbedBuilder()
            .setColor(0x57F287)
            .setTitle('✅ Line Image Set Successfully!')
            .setDescription('Line image has been updated and saved to database.')
            .addFields(
                { name: '🔗 URL', value: `[Click to view](${url})`, inline: false },
                { name: '👤 Set By', value: interaction.user.tag, inline: true },
                { name: '💡 Usage', value: 'Type `خط` or `line` in chat to send', inline: true }
            )
            .setImage(url)
            .setFooter({ text: 'Saved to crevion_db' })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });

        console.log(`📏 Line image set to: ${url} by ${interaction.user.tag}`);

    } catch (error) {
        console.error('❌ Error setting line:', error);
        await interaction.editReply({
            embeds: [{
                color: 0xED4245,
                title: '❌ Error',
                description: 'Failed to set line image. Check console for details.',
                footer: { text: 'Crévion' }
            }]
        }).catch(() => {});
    }
}

// View current line
async function handleViewLine(interaction) {
    try {
        const dbConfig = await getConfig();
        const lineUrl = dbConfig?.lineConfig?.url;

        if (!lineUrl) {
            return await interaction.reply({
                embeds: [{
                    color: 0xFEE75C,
                    title: '⚠️ No Line Set',
                    description: 'No line image is currently configured.\n\nUse `/line set <url>` to set one.',
                    footer: { text: 'Crévion' }
                }],
                ephemeral: true
            });
        }

        const embed = new EmbedBuilder()
            .setColor(0x370080)
            .setTitle('📏 Current Line Configuration')
            .setDescription('This is the current line image:')
            .addFields(
                { name: '🔗 URL', value: `[Click to view](${lineUrl})`, inline: false }
            )
            .setImage(lineUrl)
            .setFooter({ text: 'Stored in crevion_db' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });

    } catch (error) {
        console.error('❌ Error viewing line:', error);
        await interaction.reply({
            embeds: [{
                color: 0xED4245,
                title: '❌ Error',
                description: 'Failed to load line configuration.',
                footer: { text: 'Crévion' }
            }],
            ephemeral: true
        });
    }
}

// Test line
async function handleTestLine(interaction) {
    try {
        await interaction.deferReply();

        const dbConfig = await getConfig();
        const lineUrl = dbConfig?.lineConfig?.url;

        if (!lineUrl) {
            return await interaction.editReply({
                embeds: [{
                    color: 0xFEE75C,
                    title: '⚠️ No Line Set',
                    description: 'No line image to test.\n\nUse `/line set <url>` first.',
                    footer: { text: 'Crévion' }
                }]
            });
        }

        const response = await fetch(lineUrl);
        if (!response.ok) {
            throw new Error('Failed to fetch image');
        }

        const buffer = await response.arrayBuffer();
        const attachment = new AttachmentBuilder(Buffer.from(buffer), { name: 'line.png' });

        await interaction.editReply({
            content: '✅ **Line Test Successful!**\nThis is how the line will appear:',
            files: [attachment]
        });

    } catch (error) {
        console.error('❌ Error testing line:', error);
        await interaction.editReply({
            embeds: [{
                color: 0xED4245,
                title: '❌ Test Failed',
                description: 'Could not load the line image. The URL might be invalid or inaccessible.',
                footer: { text: 'Crévion' }
            }]
        }).catch(() => {});
    }
}

// Remove line
async function handleRemoveLine(interaction) {
    try {
        await updateConfig({
            'lineConfig.url': null
        });

        const embed = new EmbedBuilder()
            .setColor(0x57F287)
            .setTitle('✅ Line Removed')
            .setDescription('Line image has been removed from configuration.')
            .addFields(
                { name: '👤 Removed By', value: interaction.user.tag, inline: true }
            )
            .setFooter({ text: 'Updated in crevion_db' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });

        console.log(`📏 Line image removed by ${interaction.user.tag}`);

    } catch (error) {
        console.error('❌ Error removing line:', error);
        await interaction.reply({
            embeds: [{
                color: 0xED4245,
                title: '❌ Error',
                description: 'Failed to remove line image.',
                footer: { text: 'Crévion' }
            }],
            ephemeral: true
        });
    }
}

// Prefix versions
async function handleSetLinePrefix(message, url) {
    try {
        if (!url.match(/^https?:\/\/.+/i)) {
            return await message.reply({
                embeds: [{
                    color: 0xED4245,
                    title: '❌ Invalid URL',
                    description: 'Please provide a valid HTTP/HTTPS URL',
                    footer: { text: 'Crévion' }
                }],
                allowedMentions: { repliedUser: false }
            });
        }

        await updateConfig({ 'lineConfig.url': url });

        await message.reply({
            embeds: [{
                color: 0x57F287,
                title: '✅ Line Image Set',
                description: `Line updated successfully!\n\n**URL:** [View](${url})`,
                image: { url: url },
                footer: { text: 'Saved to crevion_db' }
            }],
            allowedMentions: { repliedUser: false }
        });

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

async function handleViewLinePrefix(message) {
    const dbConfig = await getConfig();
    const lineUrl = dbConfig?.lineConfig?.url;

    if (!lineUrl) {
        return await message.reply({
            content: '⚠️ No line image set.',
            allowedMentions: { repliedUser: false }
        });
    }

    await message.reply({
        embeds: [{
            color: 0x370080,
            title: '📏 Current Line',
            image: { url: lineUrl }
        }],
        allowedMentions: { repliedUser: false }
    });
}

async function handleTestLinePrefix(message) {
    const dbConfig = await getConfig();
    const lineUrl = dbConfig?.lineConfig?.url;

    if (!lineUrl) {
        return await message.reply({
            content: '⚠️ No line to test.',
            allowedMentions: { repliedUser: false }
        });
    }

    const response = await fetch(lineUrl);
    const buffer = await response.arrayBuffer();
    const attachment = new AttachmentBuilder(Buffer.from(buffer), { name: 'line.png' });

    await message.reply({
        content: '✅ Line test:',
        files: [attachment],
        allowedMentions: { repliedUser: false }
    });
}

async function handleRemoveLinePrefix(message) {
    await updateConfig({ 'lineConfig.url': null });
    await message.reply({
        content: '✅ Line removed.',
        allowedMentions: { repliedUser: false }
    });
}