// src/events/aiAssistant.js - Complete OpenAI System

import { Events } from 'discord.js';
import OpenAI from 'openai';

const AI_CHANNEL_ID = '1437119111221084261';

// Initialize OpenAI
let openai = null;

// Store conversations per user
const conversations = new Map();

// System prompts for different use cases
const SYSTEM_PROMPTS = {
    general: `You are Crevion AI, an elite AI assistant for creative developers and designers.

**Core Expertise:**
- 💻 Programming: JavaScript, TypeScript, Python, React, Node.js, Discord.js
- 🎨 Design: UI/UX, Color Theory, Figma, Adobe Suite, Branding
- ✂️ Video Editing: Premiere Pro, After Effects
- 🤖 AI/ML: APIs, Automation, GPT models

**Response Style:**
- Be extremely helpful and precise
- Provide working code examples
- Use emojis for clarity
- Keep responses focused and actionable
- Be encouraging and supportive`,

    code: `You are an expert programmer. Provide clean, well-commented, production-ready code.

**Guidelines:**
- Always include proper error handling
- Follow best practices and design patterns
- Explain complex logic with comments
- Suggest optimizations when relevant
- Use modern syntax and features`,

    design: `You are an expert UI/UX designer. Provide actionable design advice.

**Guidelines:**
- Focus on user experience and accessibility
- Suggest color schemes with hex codes
- Provide typography recommendations
- Consider modern design trends
- Give practical implementation tips`,

    explain: `You are a patient teacher. Explain concepts clearly and thoroughly.

**Guidelines:**
- Start with simple explanations
- Use analogies and examples
- Break down complex topics
- Provide step-by-step guides
- Encourage questions and learning`
};

export default {
    name: Events.MessageCreate,
    
    async execute(message, client) {
        // Only work in AI channel
        if (message.channel.id !== AI_CHANNEL_ID) return;
        if (message.author.bot) return;

        const userId = message.author.id;

        try {
            // Initialize OpenAI if not done
            if (!openai) {
                const apiKey = process.env.OPEN_AI_API_KEY;
                if (!apiKey) {
                    return await message.reply({
                        embeds: [{
                            color: 0xED4245,
                            title: '⚠️ AI Not Configured',
                            description: '**OpenAI API key missing!**\n\nAdd to `.env`:\n```\nOPEN_AI_API_KEY=sk-proj-...\n```',
                            footer: { text: 'Crévion AI' }
                        }],
                        allowedMentions: { repliedUser: false }
                    });
                }
                
                openai = new OpenAI({ apiKey });
                console.log('✅ OpenAI initialized');
            }

            await message.channel.sendTyping();

            // Initialize or get conversation history
            if (!conversations.has(userId)) {
                conversations.set(userId, []);
            }
            const history = conversations.get(userId);

            // Limit history to last 10 messages
            if (history.length > 10) {
                history.splice(0, 2);
            }

            const userMessage = message.content.trim();

            console.log(`🤖 [AI] Processing: ${message.author.tag}`);

            // Call OpenAI API
            const completion = await openai.chat.completions.create({
                model: "gpt-4o-mini", // Fast and cheap
                messages: [
                    { role: "system", content: SYSTEM_PROMPTS.general },
                    ...history,
                    { role: "user", content: userMessage }
                ],
                max_tokens: 2000,
                temperature: 0.7
            });

            const aiResponse = completion.choices[0].message.content;

            if (!aiResponse) {
                throw new Error('No response from AI');
            }

            // Update history
            history.push(
                { role: "user", content: userMessage },
                { role: "assistant", content: aiResponse }
            );

            console.log(`✅ [AI] Response: ${aiResponse.length} chars`);

            // Send response (split if too long)
            if (aiResponse.length > 2000) {
                const chunks = aiResponse.match(/[\s\S]{1,1900}/g) || [];
                for (let i = 0; i < Math.min(chunks.length, 3); i++) {
                    await message.reply({
                        content: chunks[i],
                        allowedMentions: { repliedUser: false }
                    });
                    if (i < chunks.length - 1) {
                        await new Promise(r => setTimeout(r, 1000));
                    }
                }
            } else {
                await message.reply({
                    content: aiResponse,
                    allowedMentions: { repliedUser: false }
                });
            }

        } catch (error) {
            console.error('❌ [AI] Error:', error);
            
            let errorMsg = 'Something went wrong. Please try again.';
            
            if (error.code === 'insufficient_quota') {
                errorMsg = '⚠️ **API Quota Exceeded**\n\nThe OpenAI API quota has been reached. Please check your billing at [platform.openai.com](https://platform.openai.com/account/billing)';
            } else if (error.status === 401) {
                errorMsg = '🔑 **Invalid API Key**\n\nThe OpenAI API key is invalid. Please check your `.env` file.';
            } else if (error.status === 429) {
                errorMsg = '⏰ **Rate Limit**\n\nToo many requests. Please wait a moment.';
            }

            await message.reply({
                embeds: [{
                    color: 0xED4245,
                    title: '❌ AI Error',
                    description: errorMsg,
                    footer: { text: 'Crévion AI' }
                }],
                allowedMentions: { repliedUser: false }
            }).catch(() => {});
        }
    }
};

// Helper function for slash commands
export async function callOpenAI(systemPrompt, userMessage, conversationHistory = []) {
    try {
        if (!openai) {
            const apiKey = process.env.OPEN_AI_API_KEY;
            if (!apiKey) throw new Error('OpenAI API key not configured');
            openai = new OpenAI({ apiKey });
        }

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                ...conversationHistory,
                { role: "user", content: userMessage }
            ],
            max_tokens: 2000,
            temperature: 0.7
        });

        return completion.choices[0].message.content;
    } catch (error) {
        console.error('❌ OpenAI Error:', error);
        throw error;
    }
}

export { SYSTEM_PROMPTS };