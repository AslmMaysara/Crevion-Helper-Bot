// src/models/aiConversation.js - FIXED EXPORTS!

import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
    channelId: { 
        type: String, 
        required: true, 
        index: true 
    },
    channelName: { 
        type: String, 
        default: 'AI Chat' 
    },
    
    conversationHistory: [{
        role: { 
            type: String, 
            enum: ['user', 'assistant', 'system'],
            required: true 
        },
        content: { 
            type: String, 
            required: true 
        },
        userId: String,
        username: String,
        mentions: [String],
        timestamp: { 
            type: Date, 
            default: Date.now 
        },
        attachments: [{
            type: { type: String },
            url: String,
            name: String,
            description: String,
            analyzed: Boolean
        }]
    }],
    
    userMemories: {
        type: Map,
        of: {
            name: String,
            nickname: String,
            preferences: { type: Map, of: String },
            facts: [String],
            importantInfo: [String]
        }
    },
    
    sharedContext: {
        currentGame: String,
        gameState: mongoose.Schema.Types.Mixed,
        participants: [String],
        lastActivity: Date
    },
    
    lastInteraction: { 
        type: Date, 
        default: Date.now 
    },
    messageCount: { 
        type: Number, 
        default: 0 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

conversationSchema.index({ channelId: 1, lastInteraction: -1 });

export const AIConversation = mongoose.model('AIConversation', conversationSchema);

// ═══════════════════════════════════════════════════════════════
// ✅ ALL EXPORTS - FIXED!
// ═══════════════════════════════════════════════════════════════

export async function getOrCreateConversation(channelId, channelName = 'AI Chat') {
    let conversation = await AIConversation.findOne({ channelId });
    
    if (!conversation) {
        conversation = new AIConversation({
            channelId,
            channelName,
            conversationHistory: [],
            userMemories: new Map(),
            sharedContext: {
                participants: []
            }
        });
        await conversation.save();
    }
    
    return conversation;
}

// ✅ ALIAS (for backward compatibility)
export const getOrCreateChannelConversation = getOrCreateConversation;

export async function addChannelMessage(channelId, role, content, userId = null, username = null, mentions = [], attachments = []) {
    const conversation = await AIConversation.findOne({ channelId });
    
    if (conversation) {
        conversation.conversationHistory.push({
            role,
            content,
            userId,
            username,
            mentions,
            timestamp: new Date(),
            attachments
        });
        
        // Keep only last 100 messages
        if (conversation.conversationHistory.length > 100) {
            conversation.conversationHistory = conversation.conversationHistory.slice(-100);
        }
        
        conversation.lastInteraction = new Date();
        conversation.messageCount += 1;
        
        await conversation.save();
    }
}

export async function getConversationHistory(channelId, limit = 30) {
    const conversation = await AIConversation.findOne({ channelId });
    
    if (!conversation) return [];
    
    const history = conversation.conversationHistory.slice(-limit);
    
    // Format for AI
    return history.map(msg => {
        let content = msg.content;
        
        // Add user context
        if (msg.username && msg.role === 'user') {
            content = `[${msg.username}]: ${content}`;
        }
        
        // Add mentions context
        if (msg.mentions && msg.mentions.length > 0) {
            content += ` (mentioned: ${msg.mentions.join(', ')})`;
        }
        
        return {
            role: msg.role,
            content: content
        };
    });
}

// ✅ ALIAS
export const getChannelHistory = getConversationHistory;

export async function updateUserMemoryInChannel(channelId, userId, memoryUpdate) {
    const conversation = await AIConversation.findOne({ channelId });
    
    if (conversation) {
        if (!conversation.userMemories) {
            conversation.userMemories = new Map();
        }
        
        conversation.userMemories.set(userId, memoryUpdate);
        await conversation.save();
    }
}

export async function updateSharedContext(channelId, contextUpdate) {
    await AIConversation.findOneAndUpdate(
        { channelId },
        { $set: { sharedContext: contextUpdate } }
    );
}

export async function getSharedContext(channelId) {
    const conversation = await AIConversation.findOne({ channelId });
    return conversation?.sharedContext || {};
}

export async function clearChannelHistory(channelId) {
    await AIConversation.findOneAndUpdate(
        { channelId },
        { 
            $set: { 
                conversationHistory: [],
                sharedContext: { participants: [] }
            } 
        }
    );
}