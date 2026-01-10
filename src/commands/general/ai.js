// src/commands/general/ai.js - FIXED

import { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } from 'discord.js';
import { PermissionLevels } from '../../utils/permissions.js';
import { aiManager } from '../../utils/aiManager.js';
import { 
    getOrCreateConversation, 
    addChannelMessage, // ✅ FIXED!
    getConversationHistory 
} from '../../models/aiConversation.js';

const AI_CHANNEL_ID = '1437119111221084261';

export default {
    data: new SlashCommandBuilder()
        .setName('ai')
        .setDescription('🤖 AI commands')
        .addSubcommand(sub =>
            sub
                .setName('ask')
                .setDescription('Ask AI')
                .addStringOption(opt =>
                    opt
                        .setName('question')
                        .setDescription('Your question')
                        .setRequired(true)
                )
        )
        .addSubcommand(sub =>
            sub
                .setName('code')
                .setDescription('Generate code')
                .addStringOption(opt =>
                    opt
                        .setName('request')
                        .setDescription('What code?')
                        .setRequired(true)
                )
                .addStringOption(opt =>
                    opt
                        .setName('language')
                        .setDescription('Language')
                        .addChoices(
                            { name: 'JavaScript', value: 'javascript' },
                            { name: 'Python', value: 'python' },
                            { name: 'Java', value: 'java' },
                            { name: 'C++', value: 'cpp' }
                        )
                )
        )
        .addSubcommand(sub =>
            sub
                .setName('clear')
                .setDescription('Clear history')
        ),

    permission: PermissionLevels.EVERYONE,

    async execute(interaction, client) {
        if (interaction.channel.id !== AI_CHANNEL_ID) {
            return await interaction.reply({
                embeds: [{
                    color: 0xFEE75C,
                    title: '⚠️ قناة خاطئة',
                    description: `هذا الأمر يعمل فقط في <#${AI_CHANNEL_ID}>`,
                }],
                ephemeral: true
            });
        }

        const subcommand = interaction.options.getSubcommand();

        if (!aiManager.isAvailable()) {
            return await interaction.reply({
                embeds: [{
                    color: 0xED4245,
                    title: '⚠️ AI Not Available',
                    description: 'No AI configured.',
                }],
                ephemeral: true
            });
        }

        if (subcommand === 'ask') {
            await handleAsk(interaction);
        } else if (subcommand === 'code') {
            await handleCode(interaction);
        } else if (subcommand === 'clear') {
            await handleClear(interaction);
        }
    }
};

async function handleAsk(interaction) {
    try {
        await interaction.deferReply();

        const question = interaction.options.getString('question');
        const userId = interaction.user.id;
        const username = interaction.user.username;
        const channelId = interaction.channel.id;

        const conversation = await getOrCreateConversation(channelId, interaction.channel.name);
        const history = await getConversationHistory(channelId, 15);

        const response = await aiManager.chat(
            question, 
            history, 
            conversation.userMemories || {}, 
            {}, 
            [], 
            [], 
            { id: userId, username }
        );

        await addChannelMessage(channelId, 'user', question, userId, username);
        await addChannelMessage(channelId, 'assistant', response.content);

        const embed = new EmbedBuilder()
            .setColor(0x370080)
            .setAuthor({
                name: `${username}`,
                iconURL: interaction.user.displayAvatarURL()
            })
            .setDescription(response.content.substring(0, 4000))
            .setFooter({ text: `Crévion AI • ${response.model}` })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });

    } catch (error) {
        console.error('❌ AI Ask Error:', error);
        await interaction.editReply({
            embeds: [{
                color: 0xED4245,
                description: '❌ فشل الرد'
            }]
        }).catch(() => {});
    }
}

async function handleCode(interaction) {
    try {
        await interaction.deferReply();

        const request = interaction.options.getString('request');
        const language = interaction.options.getString('language') || 'javascript';
        const userId = interaction.user.id;
        const username = interaction.user.username;
        const channelId = interaction.channel.id;

        const conversation = await getOrCreateConversation(channelId, interaction.channel.name);
        const history = await getConversationHistory(channelId, 10);

        const prompt = `اكتب كود ${language} لـ: ${request}\n\nالمطلوب:\n- كود نظيف\n- تعليقات واضحة\n- معالجة الأخطاء`;

        const response = await aiManager.chat(
            prompt, 
            history, 
            conversation.userMemories || {}, 
            {}, 
            [], 
            [], 
            { id: userId, username }
        );

        await addChannelMessage(channelId, 'user', request, userId, username);
        await addChannelMessage(channelId, 'assistant', response.content);

        const embed = new EmbedBuilder()
            .setColor(0x370080)
            .setTitle(`💻 ${language} Code`)
            .setDescription(response.content.substring(0, 4000))
            .setFooter({ text: `Crévion AI • ${response.model}` })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });

        if (response.content.length > 4000) {
            const buffer = Buffer.from(response.content, 'utf-8');
            const ext = language === 'javascript' ? 'js' : language === 'python' ? 'py' : 'txt';
            const attachment = new AttachmentBuilder(buffer, { name: `code.${ext}` });
            await interaction.followUp({ 
                content: '📎 **Full code:**', 
                files: [attachment] 
            });
        }

    } catch (error) {
        console.error('❌ AI Code Error:', error);
        await interaction.editReply({
            embeds: [{
                color: 0xED4245,
                description: '❌ فشل توليد الكود'
            }]
        }).catch(() => {});
    }
}

async function handleClear(interaction) {
    try {
        const channelId = interaction.channel.id;
        
        const { AIConversation } = await import('../../models/aiConversation.js');
        await AIConversation.findOneAndDelete({ channelId });

        await interaction.reply({
            embeds: [{
                color: 0x57F287,
                title: '✅ تم المسح',
                description: 'تم مسح سجل المحادثات.',
            }],
            ephemeral: true
        });

    } catch (error) {
        console.error('❌ Clear Error:', error);
        await interaction.reply({
            embeds: [{
                color: 0xED4245,
                description: '❌ فشل المسح'
            }],
            ephemeral: true
        });
    }
}