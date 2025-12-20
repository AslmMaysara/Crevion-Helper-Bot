// src/commands/general/ai.js - AI Slash Commands

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { PermissionLevels } from '../../utils/permissions.js';
import { callOpenAI, SYSTEM_PROMPTS } from '../../events/aiAssistant.js';

export default {
    data: new SlashCommandBuilder()
        .setName('ai')
        .setDescription('AI-powered assistance for developers, designers, and creators')
        .addSubcommand(sub =>
            sub
                .setName('code')
                .setDescription('Get help writing code')
                .addStringOption(opt =>
                    opt
                        .setName('request')
                        .setDescription('What do you need? (e.g., "create a discord bot command")')
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
                .setDescription('Explain a programming concept or code')
                .addStringOption(opt =>
                    opt
                        .setName('topic')
                        .setDescription('What do you want explained?')
                        .setRequired(true)
                )
        )
        .addSubcommand(sub =>
            sub
                .setName('debug')
                .setDescription('Help debug code or fix errors')
                .addStringOption(opt =>
                    opt
                        .setName('code')
                        .setDescription('Paste your code or describe the error')
                        .setRequired(true)
                )
        )
        .addSubcommand(sub =>
            sub
                .setName('design')
                .setDescription('Get UI/UX design advice')
                .addStringOption(opt =>
                    opt
                        .setName('request')
                        .setDescription('What design help do you need?')
                        .setRequired(true)
                )
        )
        .addSubcommand(sub =>
            sub
                .setName('review')
                .setDescription('Get code review and suggestions')
                .addStringOption(opt =>
                    opt
                        .setName('code')
                        .setDescription('Paste your code for review')
                        .setRequired(true)
                )
        )
        .addSubcommand(sub =>
            sub
                .setName('optimize')
                .setDescription('Optimize code for better performance')
                .addStringOption(opt =>
                    opt
                        .setName('code')
                        .setDescription('Code to optimize')
                        .setRequired(true)
                )
        ),

    permission: PermissionLevels.EVERYONE,

    async execute(interaction, client) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'code') {
            await handleCode(interaction);
        } else if (subcommand === 'explain') {
            await handleExplain(interaction);
        } else if (subcommand === 'debug') {
            await handleDebug(interaction);
        } else if (subcommand === 'design') {
            await handleDesign(interaction);
        } else if (subcommand === 'review') {
            await handleReview(interaction);
        } else if (subcommand === 'optimize') {
            await handleOptimize(interaction);
        }
    }
};

// Write Code
async function handleCode(interaction) {
    try {
        await interaction.deferReply();

        const request = interaction.options.getString('request');
        const language = interaction.options.getString('language') || 'javascript';

        const prompt = `Write ${language} code for: ${request}

Requirements:
- Production-ready code
- Proper error handling
- Clear comments
- Best practices
- Modern syntax`;

        const response = await callOpenAI(SYSTEM_PROMPTS.code, prompt);

        const embed = new EmbedBuilder()
            .setColor(0x370080)
            .setTitle('💻 Code Generated')
            .setDescription(response.substring(0, 4000))
            .addFields(
                { name: '🔤 Language', value: language, inline: true },
                { name: '📝 Request', value: request.substring(0, 100), inline: true }
            )
            .setFooter({ text: 'Crévion AI • Powered by OpenAI' })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });

        // If response is too long, send as file
        if (response.length > 4000) {
            const buffer = Buffer.from(response, 'utf-8');
            const attachment = new AttachmentBuilder(buffer, { 
                name: `code.${getFileExtension(language)}` 
            });
            await interaction.followUp({ 
                content: '📎 **Full code attached:**', 
                files: [attachment] 
            });
        }

    } catch (error) {
        console.error('❌ AI Code Error:', error);
        await interaction.editReply({
            embeds: [{
                color: 0xED4245,
                title: '❌ Error',
                description: 'Failed to generate code. Please try again.',
                footer: { text: 'Crévion AI' }
            }]
        }).catch(() => {});
    }
}

// Explain Concept
async function handleExplain(interaction) {
    try {
        await interaction.deferReply();

        const topic = interaction.options.getString('topic');

        const prompt = `Explain this programming concept clearly and thoroughly: ${topic}

Include:
- Simple explanation
- Code examples
- Common use cases
- Best practices
- Common pitfalls`;

        const response = await callOpenAI(SYSTEM_PROMPTS.explain, prompt);

        const embed = new EmbedBuilder()
            .setColor(0x57F287)
            .setTitle(`📚 Explaining: ${topic}`)
            .setDescription(response.substring(0, 4000))
            .setFooter({ text: 'Crévion AI • Powered by OpenAI' })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });

    } catch (error) {
        console.error('❌ AI Explain Error:', error);
        await interaction.editReply({
            embeds: [{
                color: 0xED4245,
                title: '❌ Error',
                description: 'Failed to explain. Please try again.',
                footer: { text: 'Crévion AI' }
            }]
        }).catch(() => {});
    }
}

// Debug Code
async function handleDebug(interaction) {
    try {
        await interaction.deferReply();

        const code = interaction.options.getString('code');

        const prompt = `Debug this code and find issues:

\`\`\`
${code}
\`\`\`

Provide:
1. Identified issues
2. Explanations
3. Fixed code
4. Prevention tips`;

        const response = await callOpenAI(SYSTEM_PROMPTS.code, prompt);

        const embed = new EmbedBuilder()
            .setColor(0xFEE75C)
            .setTitle('🔍 Debug Results')
            .setDescription(response.substring(0, 4000))
            .setFooter({ text: 'Crévion AI • Powered by OpenAI' })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });

    } catch (error) {
        console.error('❌ AI Debug Error:', error);
        await interaction.editReply({
            embeds: [{
                color: 0xED4245,
                title: '❌ Error',
                description: 'Failed to debug. Please try again.',
                footer: { text: 'Crévion AI' }
            }]
        }).catch(() => {});
    }
}

// Design Advice
async function handleDesign(interaction) {
    try {
        await interaction.deferReply();

        const request = interaction.options.getString('request');

        const prompt = `Provide UI/UX design advice for: ${request}

Include:
- Design recommendations
- Color scheme suggestions (hex codes)
- Typography suggestions
- Layout ideas
- Accessibility considerations`;

        const response = await callOpenAI(SYSTEM_PROMPTS.design, prompt);

        const embed = new EmbedBuilder()
            .setColor(0xFF6B6B)
            .setTitle('🎨 Design Advice')
            .setDescription(response.substring(0, 4000))
            .setFooter({ text: 'Crévion AI • Powered by OpenAI' })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });

    } catch (error) {
        console.error('❌ AI Design Error:', error);
        await interaction.editReply({
            embeds: [{
                color: 0xED4245,
                title: '❌ Error',
                description: 'Failed to generate design advice. Please try again.',
                footer: { text: 'Crévion AI' }
            }]
        }).catch(() => {});
    }
}

// Code Review
async function handleReview(interaction) {
    try {
        await interaction.deferReply();

        const code = interaction.options.getString('code');

        const prompt = `Review this code professionally:

\`\`\`
${code}
\`\`\`

Provide:
1. Code quality assessment
2. Best practices evaluation
3. Security considerations
4. Performance suggestions
5. Refactoring recommendations`;

        const response = await callOpenAI(SYSTEM_PROMPTS.code, prompt);

        const embed = new EmbedBuilder()
            .setColor(0x4A90E2)
            .setTitle('📋 Code Review')
            .setDescription(response.substring(0, 4000))
            .setFooter({ text: 'Crévion AI • Powered by OpenAI' })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });

    } catch (error) {
        console.error('❌ AI Review Error:', error);
        await interaction.editReply({
            embeds: [{
                color: 0xED4245,
                title: '❌ Error',
                description: 'Failed to review code. Please try again.',
                footer: { text: 'Crévion AI' }
            }]
        }).catch(() => {});
    }
}

// Optimize Code
async function handleOptimize(interaction) {
    try {
        await interaction.deferReply();

        const code = interaction.options.getString('code');

        const prompt = `Optimize this code for better performance:

\`\`\`
${code}
\`\`\`

Provide:
1. Performance analysis
2. Bottlenecks identified
3. Optimized version
4. Explanation of improvements
5. Benchmark comparisons if applicable`;

        const response = await callOpenAI(SYSTEM_PROMPTS.code, prompt);

        const embed = new EmbedBuilder()
            .setColor(0x00D9FF)
            .setTitle('⚡ Code Optimization')
            .setDescription(response.substring(0, 4000))
            .setFooter({ text: 'Crévion AI • Powered by OpenAI' })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });

    } catch (error) {
        console.error('❌ AI Optimize Error:', error);
        await interaction.editReply({
            embeds: [{
                color: 0xED4245,
                title: '❌ Error',
                description: 'Failed to optimize code. Please try again.',
                footer: { text: 'Crévion AI' }
            }]
        }).catch(() => {});
    }
}

// Helper function
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

import { AttachmentBuilder } from 'discord.js';