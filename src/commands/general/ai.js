// src/commands/general/ai.js - CLEAN VERSION (3 أوامر فقط)

import { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } from 'discord.js';
import { PermissionLevels } from '../../utils/permissions.js';
import { aiManager } from '../../utils/aiManager.js';
import { 
    getOrCreateConversation, 
    addChannelMessage, 
    getConversationHistory 
} from '../../models/aiConversation.js';

const AI_CHANNEL_ID = '1437119111221084261';

export default {
    data: new SlashCommandBuilder()
        .setName('ai')
        .setDescription('🤖 مساعد ذكاء اصطناعي')
        .addSubcommand(sub =>
            sub
                .setName('ask')
                .setDescription('اسأل أي سؤال')
                .addStringOption(opt =>
                    opt
                        .setName('question')
                        .setDescription('سؤالك')
                        .setRequired(true)
                )
        )
        .addSubcommand(sub =>
            sub
                .setName('code')
                .setDescription('توليد كود برمجي')
                .addStringOption(opt =>
                    opt
                        .setName('request')
                        .setDescription('ماذا تريد؟')
                        .setRequired(true)
                )
                .addStringOption(opt =>
                    opt
                        .setName('language')
                        .setDescription('لغة البرمجة')
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
                .setDescription('مسح السجل')
        ),

    permission: PermissionLevels.EVERYONE,

    async execute(interaction, client) {
        if (interaction.channel.id !== AI_CHANNEL_ID) {
            return await interaction.reply({
                embeds: [{
                    color: 0xFEE75C,
                    title: '⚠️ قناة خاطئة',
                    description: `هذا الأمر يعمل في <#${AI_CHANNEL_ID}> فقط`,
                }],
                ephemeral: true
            });
        }

        if (!aiManager.isAvailable()) {
            return await interaction.reply({
                embeds: [{
                    color: 0xED4245,
                    title: '⚠️ غير متوفر',
                    description: 'الذكاء الاصطناعي غير مُفعّل حالياً.',
                }],
                ephemeral: true
            });
        }

        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'ask') {
            await handleAsk(interaction);
        } else if (subcommand === 'code') {
            await handleCode(interaction);
        } else if (subcommand === 'clear') {
            await handleClear(interaction);
        }
    }
};

// ═══════════════════════════════════════════════════════════════
// 💬 ASK
// ═══════════════════════════════════════════════════════════════

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
                name: username,
                iconURL: interaction.user.displayAvatarURL()
            })
            .setDescription(response.content.substring(0, 4000))
            .setFooter({ text: `Crévion AI • ${response.model}` })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });

    } catch (error) {
        console.error('❌ Ask error:', error);
        await interaction.editReply({
            embeds: [{
                color: 0xED4245,
                description: '❌ حدث خطأ'
            }]
        }).catch(() => {});
    }
}

// ═══════════════════════════════════════════════════════════════
// 💻 CODE
// ═══════════════════════════════════════════════════════════════

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

        const prompt = `اكتب كوداً بلغة ${language} للمهمة التالية:

${request}

المطلوب:
- كود نظيف ومرتب
- تعليقات واضحة
- أفضل الممارسات

ضع الكود داخل \`\`\`${language}`;

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
            .setTitle(`💻 ${language.toUpperCase()} Code`)
            .setDescription(response.content.substring(0, 4000))
            .setFooter({ text: `Crévion AI • ${response.model}` })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });

        if (response.content.length > 4000) {
            const buffer = Buffer.from(response.content, 'utf-8');
            const ext = language === 'javascript' ? 'js' : language === 'python' ? 'py' : 'txt';
            const attachment = new AttachmentBuilder(buffer, { name: `code.${ext}` });
            await interaction.followUp({ content: '📎 **الكود الكامل:**', files: [attachment] });
        }

    } catch (error) {
        console.error('❌ Code error:', error);
        await interaction.editReply({
            embeds: [{
                color: 0xED4245,
                description: '❌ حدث خطأ'
            }]
        }).catch(() => {});
    }
}

// ═══════════════════════════════════════════════════════════════
// 🗑️ CLEAR
// ═══════════════════════════════════════════════════════════════

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
        console.error('❌ Clear error:', error);
        await interaction.reply({
            embeds: [{
                color: 0xED4245,
                description: '❌ فشل المسح'
            }],
            ephemeral: true
        });
    }
}