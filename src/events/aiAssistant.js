// src/events/aiAssistant.js - VISION FIXED + FUNNIER AI

import { Events, AttachmentBuilder } from 'discord.js';
import { aiManager, extractMemoryFromMessage } from '../utils/aiManager.js';
import { 
    getOrCreateChannelConversation, 
    addChannelMessage, 
    getChannelHistory,
    updateUserMemoryInChannel,
    getSharedContext,
    updateSharedContext
} from '../models/aiConversation.js';

const AI_CHANNEL_ID = '1437119111221084261';

export default {
    name: Events.MessageCreate,
    
    async execute(message, client) {
        if (message.channel.id !== AI_CHANNEL_ID) return;
        if (message.author.bot) return;

        const userId = message.author.id;
        const username = message.author.username;
        const channelId = message.channel.id;

        try {
            if (!aiManager.isAvailable()) {
                return await message.reply({
                    content: '⚠️ **AI مش شغال دلوقتي**',
                    allowedMentions: { repliedUser: false }
                });
            }

            await message.channel.sendTyping();

            const conversation = await getOrCreateChannelConversation(channelId, message.channel.name);

            // ═══════════════════════════════════════════════════════════════
            // 📎 EXTRACT ATTACHMENTS (FIXED FOR VISION!)
            // ═══════════════════════════════════════════════════════════════
            const attachments = [];
            
            // 1️⃣ Regular attachments (images, files)
            message.attachments.forEach(att => {
                if (att.contentType?.startsWith('image/')) {
                    attachments.push({
                        type: 'image',
                        url: att.url,
                        name: att.name || 'image.png',
                        analyzed: false
                    });
                    console.log(`   🖼️ Image detected: ${att.url}`);
                } else {
                    attachments.push({
                        type: 'file',
                        url: att.url,
                        name: att.name
                    });
                }
            });

            // 2️⃣ Stickers (Discord stickers)
            if (message.stickers.size > 0) {
                message.stickers.forEach(sticker => {
                    const stickerUrl = `https://media.discordapp.net/stickers/${sticker.id}.png`;
                    attachments.push({
                        type: 'sticker',
                        url: stickerUrl,
                        name: sticker.name,
                        description: sticker.description || sticker.name
                    });
                    console.log(`   🎭 Sticker detected: ${sticker.name}`);
                });
            }

            // 3️⃣ Emojis (extract from message)
            const emojiRegex = /<a?:(\w+):(\d+)>/g;
            const emojiMatches = [...message.content.matchAll(emojiRegex)];
            const emojis = emojiMatches.map(match => ({
                name: match[1],
                id: match[2],
                animated: match[0].startsWith('<a:')
            }));

            // 4️⃣ Links
            const linkRegex = /(https?:\/\/[^\s]+)/g;
            const links = message.content.match(linkRegex);
            if (links) {
                links.forEach(link => {
                    // Don't add Discord CDN links (already handled)
                    if (!link.includes('cdn.discordapp.com') && !link.includes('media.discordapp.net')) {
                        attachments.push({
                            type: 'link',
                            url: link
                        });
                    }
                });
            }

            // Extract mentions
            const mentions = message.mentions.users.map(u => u.username);

            // Get conversation history
            const history = await getChannelHistory(channelId, 30);

            // Get shared context
            const sharedContext = await getSharedContext(channelId);

            // Get user memories
            const channelMemories = {};
            if (conversation.userMemories) {
                for (const [uid, memory] of conversation.userMemories) {
                    channelMemories[uid] = memory;
                }
            }

            const userMessage = message.content.trim() || '📎 [أرسل مرفقات]';

            console.log(`\n🤖 [AI Request - Enhanced]`);
            console.log(`   User: ${username} (${userId})`);
            console.log(`   Message: ${userMessage.substring(0, 100)}`);
            console.log(`   Mentions: ${mentions.length > 0 ? mentions.join(', ') : 'none'}`);
            console.log(`   Images: ${attachments.filter(a => a.type === 'image').length}`);
            console.log(`   Stickers: ${attachments.filter(a => a.type === 'sticker').length}`);
            console.log(`   Emojis: ${emojis.length}`);
            console.log(`   History: ${history.length} messages`);

            // Detect game start
            const gameDetection = detectGameStart(userMessage, mentions);
            if (gameDetection.isGame) {
                await updateSharedContext(channelId, {
                    currentGame: gameDetection.gameName,
                    participants: [userId, ...message.mentions.users.map(u => u.id)],
                    gameState: {},
                    lastActivity: new Date()
                });
                
                console.log(`   🎮 Game Started: ${gameDetection.gameName}`);
            }

            // ═══════════════════════════════════════════════════════════════
            // 🤖 MAKE AI REQUEST (WITH VISION!)
            // ═══════════════════════════════════════════════════════════════
            const response = await Promise.race([
                aiManager.chat(
                    userMessage, 
                    history, 
                    channelMemories, 
                    sharedContext, 
                    attachments,
                    emojis,
                    { id: userId, username }
                ),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('timeout')), 40000)
                )
            ]);

            if (!response?.content) {
                throw new Error('No response from AI');
            }

            // Save messages
            await addChannelMessage(
                channelId, 
                'user', 
                userMessage, 
                userId, 
                username, 
                mentions, 
                attachments
            );

            await addChannelMessage(
                channelId, 
                'assistant', 
                response.content
            );

            // Update memory
            const currentUserMemory = conversation.userMemories?.get(userId) || {};
            const updatedMemory = extractMemoryFromMessage(userMessage, currentUserMemory);
            
            if (JSON.stringify(updatedMemory) !== JSON.stringify(currentUserMemory)) {
                await updateUserMemoryInChannel(channelId, userId, updatedMemory);
                console.log(`   💾 Memory updated`);
            }

            console.log(`   ✅ Response: ${response.content.length} chars`);
            if (response.usedVision) {
                console.log(`   👁️ Vision API used!`);
            }

            // Send response
            await sendAIResponse(message, response.content);

        } catch (error) {
            console.error('\n❌ [AI Error]:', error.message);
            await handleAIError(message, error);
        }
    }
};

// ═══════════════════════════════════════════════════════════════
// 🎮 GAME DETECTION
// ═══════════════════════════════════════════════════════════════

function detectGameStart(message, mentions) {
    const lower = message.toLowerCase();
    
    const games = [
        { keywords: ['حجرة ورقة مقص', 'حجرة ورق مقص', 'rock paper scissors', 'حجره ورقه مقص'], name: 'Rock Paper Scissors' },
        { keywords: ['xo', 'اكس او', 'x o', 'إكس أو'], name: 'XO' },
        { keywords: ['تخمين رقم', 'guess number', 'خمن'], name: 'Number Guess' }
    ];
    
    for (const game of games) {
        for (const keyword of game.keywords) {
            if (lower.includes(keyword) && mentions.length > 0) {
                return { isGame: true, gameName: game.name };
            }
        }
    }
    
    return { isGame: false };
}

// ═══════════════════════════════════════════════════════════════
// 📤 SEND RESPONSE
// ═══════════════════════════════════════════════════════════════

async function sendAIResponse(message, content) {
    try {
        const maxLength = 1950;

        if (content.length <= maxLength) {
            await message.reply({
                content: content,
                allowedMentions: { repliedUser: false }
            });
            return;
        }

        const chunks = splitIntelligently(content, maxLength);

        await message.reply({
            content: chunks[0],
            allowedMentions: { repliedUser: false }
        });

        for (let i = 1; i < Math.min(chunks.length, 5); i++) {
            await new Promise(r => setTimeout(r, 1000));
            await message.channel.send(chunks[i]);
        }

        if (chunks.length > 5) {
            const fullText = chunks.join('\n\n---\n\n');
            const buffer = Buffer.from(fullText, 'utf-8');
            const attachment = new AttachmentBuilder(buffer, { 
                name: `ai-response-${Date.now()}.txt` 
            });

            await message.channel.send({
                content: `📎 **الرد طويل! حمّل الملف:**`,
                files: [attachment]
            });
        }

    } catch (error) {
        console.error('❌ Send error:', error);
    }
}

function splitIntelligently(text, maxLength) {
    const chunks = [];
    let current = '';

    const paragraphs = text.split(/\n\n+/);

    for (const para of paragraphs) {
        if (current.length + para.length + 2 > maxLength) {
            if (current) {
                chunks.push(current.trim());
                current = '';
            }

            if (para.length > maxLength) {
                const sentences = para.match(/[^.!?]+[.!?]+/g) || [para];
                
                for (const sentence of sentences) {
                    if (current.length + sentence.length + 1 > maxLength) {
                        if (current) chunks.push(current.trim());
                        current = sentence;
                    } else {
                        current += ' ' + sentence;
                    }
                }
            } else {
                current = para;
            }
        } else {
            current += (current ? '\n\n' : '') + para;
        }
    }

    if (current) chunks.push(current.trim());

    return chunks;
}

// ═══════════════════════════════════════════════════════════════
// ❌ ERROR HANDLER
// ═══════════════════════════════════════════════════════════════

async function handleAIError(message, error) {
    const errorMsg = error.message.toLowerCase();

    let userMessage = '❌ **حصل حاجة غلط**\n\n';

    if (errorMsg.includes('timeout')) {
        userMessage += 'الـ AI خد وقت كتير. جرب تاني بكلام أقل.';
    } else if (errorMsg.includes('api') || errorMsg.includes('model')) {
        userMessage += 'الـ AI مش شغال دلوقتي. جرب بعد شوية.';
    } else {
        userMessage += 'في مشكلة حصلت. حاول تاني.';
    }

    await message.reply({
        content: userMessage,
        allowedMentions: { repliedUser: false }
    }).catch(() => {});
}