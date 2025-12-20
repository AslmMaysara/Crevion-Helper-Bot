// src/events/aiAssistant.js - UPDATED with Dual AI System

import { Events } from 'discord.js';
import { aiManager, SYSTEM_PROMPTS, detectTaskType } from '../utils/aiManager.js';

const AI_CHANNEL_ID = '1437119111221084261';

// Store conversations per user
const conversations = new Map();
const MAX_HISTORY = 10; // Keep last 10 messages

export default {
    name: Events.MessageCreate,
    
    async execute(message, client) {
        // Only work in AI channel
        if (message.channel.id !== AI_CHANNEL_ID) return;
        if (message.author.bot) return;

        const userId = message.author.id;

        try {
            // Check if AI is available
            if (!aiManager.isAvailable()) {
                return await message.reply({
                    embeds: [{
                        color: 0xED4245,
                        title: '⚠️ AI Not Configured',
                        description: '**No AI APIs configured!**\n\nAdd to `.env`:\n```\nGROQ_API_KEY=your_key\nDEEPSEEK_API_KEY=your_key\n```',
                        footer: { text: 'Crévion AI' }
                    }],
                    allowedMentions: { repliedUser: false }
                });
            }

            await message.channel.sendTyping();

            // Initialize or get conversation history
            if (!conversations.has(userId)) {
                conversations.set(userId, []);
            }
            const history = conversations.get(userId);

            // Limit history
            if (history.length > MAX_HISTORY) {
                history.splice(0, 2);
            }

            const userMessage = message.content.trim();

            console.log(`🤖 [AI] ${message.author.tag}: ${userMessage.substring(0, 50)}...`);

            // Detect task type
            const taskType = detectTaskType(userMessage);
            console.log(`🎯 Task type detected: ${taskType}`);

            // Get appropriate system prompt
            const systemPrompt = SYSTEM_PROMPTS[taskType] || SYSTEM_PROMPTS.general;

            // Make AI request
            const response = await aiManager.request(
                taskType,
                systemPrompt,
                userMessage,
                history
            );

            if (!response.content) {
                throw new Error('No response from AI');
            }

            // Update history
            history.push(
                { role: "user", content: userMessage },
                { role: "assistant", content: response.content }
            );

            console.log(`✅ [AI] ${response.model} responded: ${response.content.length} chars`);

            // Send response (split if too long)
            if (response.content.length > 2000) {
                const chunks = response.content.match(/[\s\S]{1,1900}/g) || [];
                for (let i = 0; i < Math.min(chunks.length, 3); i++) {
                    await message.reply({
                        content: chunks[i],
                        allowedMentions: { repliedUser: false }
                    });
                    if (i < chunks.length - 1) {
                        await new Promise(r => setTimeout(r, 1000));
                    }
                }
                
                // Add footer with AI model used
                if (chunks.length > 3) {
                    await message.channel.send({
                        content: `*... response truncated. Powered by ${response.model} 🤖*`,
                        allowedMentions: { repliedUser: false }
                    });
                }
            } else {
                await message.reply({
                    content: response.content + `\n\n*- ${response.model} 🤖*`,
                    allowedMentions: { repliedUser: false }
                });
            }

        } catch (error) {
            console.error('❌ [AI] Error:', error);
            
            let errorMsg = 'Something went wrong. Please try again.';
            
            if (error.message.includes('API error')) {
                errorMsg = '⚠️ **AI Service Unavailable**\n\nThe AI service is temporarily unavailable. Try again in a moment.';
            } else if (error.message.includes('timeout')) {
                errorMsg = '⏰ **Request Timeout**\n\nThe AI took too long to respond. Try a simpler question.';
            } else if (error.message.includes('Both AIs failed')) {
                errorMsg = '❌ **All AI Services Failed**\n\nBoth Groq and DeepSeek are unavailable. Try again later.';
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

// Helper for slash commands
export async function callAI(taskType, systemPrompt, userMessage, conversationHistory = []) {
    try {
        if (!aiManager.isAvailable()) {
            throw new Error('No AI APIs configured');
        }

        const response = await aiManager.request(
            taskType,
            systemPrompt,
            userMessage,
            conversationHistory
        );

        return response.content;
    } catch (error) {
        console.error('❌ AI Error:', error);
        throw error;
    }
}

export { SYSTEM_PROMPTS };