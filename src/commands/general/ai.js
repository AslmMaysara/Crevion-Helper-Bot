// src/commands/general/ai.js - FIXED

import { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } from 'discord.js';
import { PermissionLevels } from '../../utils/permissions.js';
import { aiManager } from '../../utils/aiManager.js';
import { 
    getOrCreateConversation, 
    addMessage, 
    getConversationHistory 
} from '../../models/aiConversation.js';

const AI_CHANNEL_ID = '1437119111221084261';

export default {
    data: new SlashCommandBuilder()
        .setName('ai')
        .setDescription('🤖 AI commands (Use in AI channel only)')
        .addSubcommand(sub =>
            sub
                .setName('ask')
                .setDescription('Ask AI anything')
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
                        .setDescription('What code do you need?')
                        .setRequired(true)
                )
                .addStringOption(opt =>
                    opt
                        .setName('language')
                        .setDescription('Programming language')
                        .addChoices(
                            { name: 'JavaScript', value: 'javascript' },
                            { name: 'TypeScript', value: 'typescript' },
                            { name: 'Python', value: 'python' },
                            { name: 'Java', value: 'java' },
                            { name: 'C++', value: 'cpp' },
                            { name: 'C#', value: 'csharp' }
                        )
                )
        )
        .addSubcommand(sub =>
            sub
                .setName('explain')
                .setDescription('Explain code/concept')
                .addStringOption(opt =>
                    opt
                        .setName('topic')
                        .setDescription('What to explain?')
                        .setRequired(true)
                )
        )
        .addSubcommand(sub =>
            sub
                .setName('clear')
                .setDescription('Clear your AI conversation history')
        ),

    permission: PermissionLevels.EVERYONE,

    async execute(interaction, client) {
        // ✅ CHECK IF IN AI CHANNEL
        if (interaction.channel.id !== AI_CHANNEL_ID) {
            return await interaction.reply({
                embeds: [{
                    color: 0xFEE75C,
                    title: '⚠️ قناة خاطئة',
                    description: `هذا الأمر يعمل فقط في <#${AI_CHANNEL_ID}>`,
                    footer: { text: 'Crévion AI' }
                }],
                ephemeral: true
            });
        }

        const subcommand = interaction.options.getSubcommand();

        // Check AI availability
        if (!aiManager.isAvailable()) {
            return await interaction.reply({
                embeds: [{
                    color: 0xED4245,
                    title: '⚠️ AI Not Available',
                    description: 'No AI APIs configured. Contact bot owner.',
                    footer: { text: 'Crévion AI' }
                }],
                ephemeral: true
            });
        }

        if (subcommand === 'ask') {
            await handleAsk(interaction);
        } else if (subcommand === 'code') {
            await handleCode(interaction);
        } else if (subcommand === 'explain') {
            await handleExplain(interaction);
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

        const conversation = await getOrCreateConversation(userId, username);
        const history = await getConversationHistory(userId, 15);

        const response = await aiManager.chat(question, history, conversation.userMemory);

        await addMessage(userId, 'user', question);
        await addMessage(userId, 'assistant', response.content);

        const embed = new EmbedBuilder()
            .setColor(0x370080)
            .setAuthor({
                name: `${username} asked`,
                iconURL: interaction.user.displayAvatarURL()
            })
            .setDescription(response.content.substring(0, 4000))
            .setFooter({ text: `Crévion AI • Powered by ${response.model}` })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });

    } catch (error) {
        console.error('❌ AI Ask Error:', error);
        await handleError(interaction, error);
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

        const conversation = await getOrCreateConversation(userId, username);
        const history = await getConversationHistory(userId, 10);

        const prompt = `Write ${language} code for: ${request}\n\nRequirements:\n- Production-ready\n- Error handling\n- Clear comments\n- Best practices`;

        const response = await aiManager.chat(prompt, history, conversation.userMemory);

        await addMessage(userId, 'user', request);
        await addMessage(userId, 'assistant', response.content);

        const embed = new EmbedBuilder()
            .setColor(0x370080)
            .setTitle(`💻 ${language} Code`)
            .setDescription(response.content.substring(0, 4000))
            .setFooter({ text: `Crévion AI • ${response.model}` })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });

        // Send as file if too long
        if (response.content.length > 4000) {
            const buffer = Buffer.from(response.content, 'utf-8');
            const ext = getFileExtension(language);
            const attachment = new AttachmentBuilder(buffer, { name: `code.${ext}` });
            await interaction.followUp({ 
                content: '📎 **Full code:**', 
                files: [attachment] 
            });
        }

    } catch (error) {
        console.error('❌ AI Code Error:', error);
        await handleError(interaction, error);
    }
}

// ═══════════════════════════════════════════════════════════════
// 📚 EXPLAIN
// ═══════════════════════════════════════════════════════════════
async function handleExplain(interaction) {
    try {
        await interaction.deferReply();

        const topic = interaction.options.getString('topic');
        const userId = interaction.user.id;
        const username = interaction.user.username;

        const conversation = await getOrCreateConversation(userId, username);
        const history = await getConversationHistory(userId, 10);

        const prompt = `Explain clearly: ${topic}\n\nInclude:\n- Simple explanation\n- Examples\n- Use cases\n- Best practices`;

        const response = await aiManager.chat(prompt, history, conversation.userMemory);

        await addMessage(userId, 'user', topic);
        await addMessage(userId, 'assistant', response.content);

        const embed = new EmbedBuilder()
            .setColor(0x57F287)
            .setTitle(`📚 Explaining: ${topic}`)
            .setDescription(response.content.substring(0, 4000))
            .setFooter({ text: `Crévion AI • ${response.model}` })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });

    } catch (error) {
        console.error('❌ AI Explain Error:', error);
        await handleError(interaction, error);
    }
}

// ═══════════════════════════════════════════════════════════════
// 🗑️ CLEAR HISTORY
// ═══════════════════════════════════════════════════════════════
async function handleClear(interaction) {
    try {
        const userId = interaction.user.id;
        
        const { AIConversation } = await import('../../models/aiConversation.js');
        await AIConversation.findOneAndDelete({ userId });

        await interaction.reply({
            embeds: [{
                color: 0x57F287,
                title: '✅ محادثتك تم مسحها',
                description: 'تم حذف سجل المحادثة الخاص بك مع الـ AI.',
                footer: { text: 'Crévion AI' }
            }],
            ephemeral: true
        });

    } catch (error) {
        console.error('❌ Clear Error:', error);
        await interaction.reply({
            embeds: [{
                color: 0xED4245,
                description: '❌ فشل مسح المحادثة'
            }],
            ephemeral: true
        });
    }
}

// ═══════════════════════════════════════════════════════════════
// ❌ ERROR HANDLER
// ═══════════════════════════════════════════════════════════════
async function handleError(interaction, error) {
    const errorEmbed = {
        color: 0xED4245,
        title: '❌ AI Error',
        description: 'Failed to get AI response. Please try again.',
        footer: { text: 'Crévion AI' }
    };

    try {
        if (interaction.deferred) {
            await interaction.editReply({ embeds: [errorEmbed] });
        } else {
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    } catch (e) {
        console.error('Failed to send error message:', e);
    }
}

// ═══════════════════════════════════════════════════════════════
// 🛠️ HELPERS
// ═══════════════════════════════════════════════════════════════
function getFileExtension(language) {
    const extensions = {
        javascript: 'js',
        typescript: 'ts',
        python: 'py',
        java: 'java',
        cpp: 'cpp',
        csharp: 'cs'
    };
    return extensions[language] || 'txt';
}