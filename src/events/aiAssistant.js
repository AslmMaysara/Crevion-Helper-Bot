import { Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { config } from '../config/config.js';
import fetch from 'node-fetch';

const AI_CHANNEL_ID = '1437119111221084261';

const conversations = new Map();

const SYSTEM_PROMPT = `You are Crevion AI, an elite AI assistant for the Crevion creative community.

**Core Expertise:**
- 💻 Advanced Programming (JavaScript, Python, Node.js, React, Discord.js, full-stack)
- 🎨 Professional Design (UI/UX, Color Theory, Typography, Figma, Adobe Suite)
- ✂️ Video Editing (Premiere, After Effects, DaVinci Resolve, Motion Graphics)
- 🚀 DevOps & Architecture (Docker, AWS, CI/CD, Microservices)
- 🤖 AI/ML Integration (APIs, Models, Automation)

**Your Capabilities:**
- Debug complex code and provide optimized solutions
- Write production-ready code with best practices
- Create Discord bot commands and features
- Design UI/UX mockups and provide design feedback
- Generate creative content ideas
- Explain technical concepts clearly
- Provide step-by-step tutorials

**Response Style:**
- Be extremely knowledgeable and precise
- Use code blocks for code (with proper language tags)
- Include emojis for better readability
- Keep responses under 1800 chars (split if needed)
- Provide working, tested code examples
- Be confident but acknowledge limitations

**Special Commands You Can Help With:**
- Creating Discord slash commands
- Bot feature implementation  
- Database integration
- API integrations
- Frontend/Backend code
- Design systems

Always provide **practical, actionable solutions** that users can implement immediately.`;

export default {
    name: Events.MessageCreate,
    async execute(message, client) {
        if (message.channel.id !== AI_CHANNEL_ID) return;
        if (message.author.bot) return;

        try {
            await message.channel.sendTyping();

            const userId = message.author.id;
            if (!conversations.has(userId)) {
                conversations.set(userId, []);
            }
            const history = conversations.get(userId);

            if (history.length > 12) {
                history.splice(0, 2);
            }

            const userMessage = message.content.replace(/<@!?\d+>/g, '').trim();

            const groqApiKey = process.env.GROQ_API_KEY;
            
            if (!groqApiKey) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(config.settings.errorColor)
                    .setTitle('⚠️ AI Service Not Configured')
                    .setDescription('Please add `GROQ_API_KEY` to your `.env` file.\n\n**Get Free API Key:**\n[console.groq.com](https://console.groq.com/)\n\n✨ 14,400 requests/day FREE!')
                    .setFooter({ text: config.settings.embedFooter });
                
                return await message.reply({ embeds: [errorEmbed] });
            }

            const messages = [
                { role: 'system', content: SYSTEM_PROMPT },
                ...history,
                { role: 'user', content: userMessage }
            ];

            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${groqApiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'llama-3.3-70b-versatile',
                    messages: messages,
                    max_tokens: 2048,
                    temperature: 0.8,
                    top_p: 0.9
                })
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();
            let aiResponse = data.choices[0].message.content;

            // Update history
            history.push(
                { role: 'user', content: userMessage },
                { role: 'assistant', content: aiResponse }
            );

            // Enhanced response with embed for long code
            const hasCodeBlock = aiResponse.includes('```');
            
            if (hasCodeBlock && aiResponse.length > 1500) {
                // Split code from explanation
                const parts = aiResponse.split('```');
                let explanation = parts[0];
                let codeBlocks = [];
                
                for (let i = 1; i < parts.length; i += 2) {
                    if (parts[i]) {
                        codeBlocks.push('```' + parts[i] + '```');
                    }
                    if (parts[i + 1]) {
                        explanation += '\n\n' + parts[i + 1];
                    }
                }

                // Send explanation first
                if (explanation.trim()) {
                    await message.reply(explanation.substring(0, 2000));
                }

                // Send code blocks
                for (const block of codeBlocks) {
                    if (block.length > 2000) {
                        // Code too long - offer to send as file
                        const code = block.replace(/```[\w]*\n?/g, '');
                        await message.channel.send({
                            content: '📎 Code is too long, here\'s the snippet:',
                            files: [{
                                attachment: Buffer.from(code, 'utf-8'),
                                name: 'code.txt'
                            }]
                        });
                    } else {
                        await message.channel.send(block);
                    }
                    await new Promise(r => setTimeout(r, 800));
                }
            } else {
                // Normal response
                if (aiResponse.length > 2000) {
                    const chunks = aiResponse.match(/[\s\S]{1,1900}/g) || [];
                    for (let i = 0; i < chunks.length && i < 4; i++) {
                        await message.reply(chunks[i]);
                        if (i < chunks.length - 1) {
                            await new Promise(r => setTimeout(r, 1000));
                        }
                    }
                } else {
                    await message.reply(aiResponse);
                }
            }

            // Add action buttons for code responses
            if (hasCodeBlock) {
                const buttons = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setLabel('Explain More')
                            .setStyle(ButtonStyle.Primary)
                            .setCustomId(`explain_${Date.now()}`)
                            .setEmoji('📚'),
                        new ButtonBuilder()
                            .setLabel('Optimize Code')
                            .setStyle(ButtonStyle.Secondary)
                            .setCustomId(`optimize_${Date.now()}`)
                            .setEmoji('⚡'),
                        new ButtonBuilder()
                            .setLabel('Clear Context')
                            .setStyle(ButtonStyle.Danger)
                            .setCustomId(`clear_${userId}`)
                            .setEmoji('🗑️')
                    );

                await message.channel.send({ 
                    content: '💡 **Need help with this code?**',
                    components: [buttons] 
                });
            }

        } catch (error) {
            console.error('❌ AI error:', error);
            
            let errorMsg = '❌ An error occurred. Please try again.';
            
            if (error.message.includes('401')) {
                errorMsg = '🔑 Invalid API key. Check your GROQ_API_KEY in `.env`';
            } else if (error.message.includes('429')) {
                errorMsg = '⏰ Rate limit reached. Please wait a moment and try again.';
            } else if (error.message.includes('timeout')) {
                errorMsg = '⏱️ Request timed out. Try asking a shorter question.';
            }

            await message.reply({
                embeds: [{
                    color: config.settings.errorColor,
                    description: errorMsg,
                    footer: { text: config.settings.embedFooter }
                }]
            }).catch(() => {});
        }
    }
};