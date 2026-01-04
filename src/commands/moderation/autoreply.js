// src/commands/moderation/autoreply.js - FIXED

import { SlashCommandBuilder } from 'discord.js';
import { PermissionLevels } from '../../utils/permissions.js';
import { autoReply } from '../../utils/autoreply.js';
import { config } from '../../config/config.js';

export default {
    data: new SlashCommandBuilder()
        .setName('autoreply')
        .setDescription('Manage auto reply system (Admin only)')
        .addSubcommand(sub =>
            sub.setName('add')
                .setDescription('Add a new auto reply')
                .addStringOption(opt => opt
                    .setName('trigger')
                    .setDescription('The trigger message')
                    .setRequired(true))
                .addStringOption(opt => opt
                    .setName('response')
                    .setDescription('The bot response')
                    .setRequired(true))
                .addBooleanOption(opt => opt
                    .setName('mention')
                    .setDescription('Mention the user in response')
                    .setRequired(false))
                .addBooleanOption(opt => opt
                    .setName('reply')
                    .setDescription('Reply to the message (default: true)')
                    .setRequired(false))
                .addBooleanOption(opt => opt
                    .setName('exact')
                    .setDescription('Exact match only (default: false)')
                    .setRequired(false))
        )
        .addSubcommand(sub =>
            sub.setName('remove')
                .setDescription('Remove an auto reply')
                .addStringOption(opt => opt
                    .setName('trigger')
                    .setDescription('The trigger to remove')
                    .setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('list')
                .setDescription('List all auto replies')
        )
        .addSubcommand(sub =>
            sub.setName('clear')
                .setDescription('Remove all auto replies')
        )
        .addSubcommand(sub =>
            sub.setName('refresh')
                .setDescription('Force refresh auto replies from database')
        ),

    permission: PermissionLevels.ADMIN,

    async execute(interaction, client) {
        const subcommand = interaction.options.getSubcommand();

        switch (subcommand) {
            case 'add':
                await handleAdd(interaction);
                break;
            case 'remove':
                await handleRemove(interaction);
                break;
            case 'list':
                await handleList(interaction);
                break;
            case 'clear':
                await handleClear(interaction);
                break;
            case 'refresh':
                await handleRefresh(interaction);
                break;
        }
    }
};

// ═══════════════════════════════════════════════════════════════
// ➕ ADD AUTO REPLY
// ═══════════════════════════════════════════════════════════════

async function handleAdd(interaction) {
    await interaction.deferReply({ ephemeral: true });

    try {
        const trigger = interaction.options.getString('trigger');
        const response = interaction.options.getString('response');
        const mention = interaction.options.getBoolean('mention') || false;
        const reply = interaction.options.getBoolean('reply') !== false;
        const exact = interaction.options.getBoolean('exact') || false;

        const result = await autoReply.add(
            trigger, 
            response, 
            { mention, reply, exact },
            interaction.user.id
        );

        if (!result.success) {
            return await interaction.editReply({
                embeds: [{
                    color: config.settings.errorColor,
                    title: '❌ Failed',
                    description: result.message || 'Could not add auto reply'
                }]
            });
        }

        await interaction.editReply({
            embeds: [{
                color: config.settings.successColor,
                title: '✅ Auto Reply Added',
                fields: [
                    { name: '📝 Trigger', value: `\`${trigger}\``, inline: true },
                    { name: '💬 Response', value: response, inline: true },
                    { name: '⚙️ Options', value: [
                        `Mention: ${mention ? '✅' : '❌'}`,
                        `Reply: ${reply ? '✅' : '❌'}`,
                        `Exact Match: ${exact ? '✅' : '❌'}`
                    ].join('\n'), inline: false }
                ],
                footer: {
                    text: `Added by ${interaction.user.tag} | Saved to MongoDB`,
                    icon_url: interaction.user.displayAvatarURL()
                },
                timestamp: new Date()
            }]
        });

    } catch (error) {
        console.error('❌ Error in autoreply add:', error);
        await interaction.editReply({
            embeds: [{
                color: config.settings.errorColor,
                description: '❌ An error occurred while adding auto reply'
            }]
        });
    }
}

// ═══════════════════════════════════════════════════════════════
// 🗑️ REMOVE AUTO REPLY
// ═══════════════════════════════════════════════════════════════

async function handleRemove(interaction) {
    await interaction.deferReply({ ephemeral: true });

    try {
        const trigger = interaction.options.getString('trigger');
        const result = await autoReply.remove(trigger);

        if (!result.success) {
            return await interaction.editReply({
                embeds: [{
                    color: config.settings.errorColor,
                    description: `❌ No auto reply found for: \`${trigger}\``
                }]
            });
        }

        await interaction.editReply({
            embeds: [{
                color: config.settings.successColor,
                description: `✅ Removed auto reply for: \`${trigger}\``,
                footer: { text: 'Updated in MongoDB' }
            }]
        });

    } catch (error) {
        console.error('❌ Error in autoreply remove:', error);
        await interaction.editReply({
            embeds: [{
                color: config.settings.errorColor,
                description: '❌ An error occurred while removing auto reply'
            }]
        });
    }
}

// ═══════════════════════════════════════════════════════════════
// 📋 LIST AUTO REPLIES
// ═══════════════════════════════════════════════════════════════

async function handleList(interaction) {
    await interaction.deferReply({ ephemeral: true });

    try {
        const replies = await autoReply.getAll();
        const count = replies.length;

        if (count === 0) {
            return await interaction.editReply({
                embeds: [{
                    color: config.settings.warningColor,
                    description: '⚠️ No auto replies configured'
                }]
            });
        }

        const fields = replies.map(data => ({
            name: `📝 ${data.trigger}`,
            value: [
                `**Response:** ${data.response}`,
                `**Options:** ${data.mention ? 'Mention' : ''} ${data.reply ? 'Reply' : ''} ${data.exact ? 'Exact' : 'Contains'}`,
                `**Uses:** ${data.uses || 0}`,
                `**Added:** <t:${Math.floor(new Date(data.createdAt).getTime() / 1000)}:R>`
            ].join('\n'),
            inline: false
        }));

        // Split into multiple embeds if too many
        const chunkedFields = [];
        for (let i = 0; i < fields.length; i += 10) {
            chunkedFields.push(fields.slice(i, i + 10));
        }

        const embeds = chunkedFields.map((chunk, index) => ({
            color: config.settings.defaultColor,
            title: index === 0 ? '📋 Auto Replies List' : undefined,
            description: index === 0 ? `Total: **${count}** auto replies (from MongoDB)` : undefined,
            fields: chunk,
            footer: {
                text: `${config.settings.embedFooter} | Page ${index + 1}/${chunkedFields.length}`,
                icon_url: config.settings.embedFooterIcon
            },
            timestamp: index === 0 ? new Date() : undefined
        }));

        await interaction.editReply({ embeds: embeds.slice(0, 10) });

    } catch (error) {
        console.error('❌ Error in autoreply list:', error);
        await interaction.editReply({
            embeds: [{
                color: config.settings.errorColor,
                description: '❌ An error occurred while listing auto replies'
            }]
        });
    }
}

// ═══════════════════════════════════════════════════════════════
// 🧹 CLEAR ALL
// ═══════════════════════════════════════════════════════════════

async function handleClear(interaction) {
    await interaction.deferReply({ ephemeral: true });

    try {
        const count = await autoReply.count();
        
        if (count === 0) {
            return await interaction.editReply({
                embeds: [{
                    color: config.settings.warningColor,
                    description: '⚠️ No auto replies to clear'
                }]
            });
        }

        await autoReply.clear();

        await interaction.editReply({
            embeds: [{
                color: config.settings.successColor,
                title: '✅ Auto Replies Cleared',
                description: `Removed **${count}** auto replies from MongoDB`,
                footer: {
                    text: `Cleared by ${interaction.user.tag}`,
                    icon_url: interaction.user.displayAvatarURL()
                },
                timestamp: new Date()
            }]
        });

    } catch (error) {
        console.error('❌ Error in autoreply clear:', error);
        await interaction.editReply({
            embeds: [{
                color: config.settings.errorColor,
                description: '❌ An error occurred while clearing auto replies'
            }]
        });
    }
}

// ═══════════════════════════════════════════════════════════════
// 🔄 REFRESH FROM DATABASE
// ═══════════════════════════════════════════════════════════════

async function handleRefresh(interaction) {
    await interaction.deferReply({ ephemeral: true });

    try {
        await autoReply.refresh();
        const count = await autoReply.count();

        await interaction.editReply({
            embeds: [{
                color: config.settings.successColor,
                title: '🔄 Auto Replies Refreshed',
                description: `Loaded **${count}** auto replies from MongoDB`,
                footer: { text: 'Cache updated' },
                timestamp: new Date()
            }]
        });

    } catch (error) {
        console.error('❌ Error in autoreply refresh:', error);
        await interaction.editReply({
            embeds: [{
                color: config.settings.errorColor,
                description: '❌ An error occurred while refreshing'
            }]
        });
    }
}