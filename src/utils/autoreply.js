// src/utils/autoreply.js

import { getConfig, updateConfig } from '../models/index.js';

class AutoReplySystem {
    constructor() {
        this.cache = null;
        this.lastSync = 0;
        this.SYNC_INTERVAL = 30000; // تحديث كل 30 ثانية
    }

    // ═══════════════════════════════════════════════════════════════
    // 📥 LOAD FROM DATABASE
    // ═══════════════════════════════════════════════════════════════
    async load() {
        try {
            const now = Date.now();
            
            // لو الـ cache لسه جديد، استخدمه
            if (this.cache && (now - this.lastSync < this.SYNC_INTERVAL)) {
                return this.cache;
            }

            const dbConfig = await getConfig();
            this.cache = dbConfig?.autoReplies || [];
            this.lastSync = now;
            
            return this.cache;
        } catch (error) {
            console.error('❌ Error loading auto replies:', error);
            return [];
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // ➕ ADD AUTO REPLY
    // ═══════════════════════════════════════════════════════════════
    async add(trigger, response, options = {}, userId = '') {
        try {
            const replies = await this.load();
            const triggerLower = trigger.toLowerCase();

            // تحقق لو موجود قبل كده
            const exists = replies.find(r => r.trigger.toLowerCase() === triggerLower);
            if (exists) {
                return { success: false, message: 'Trigger already exists' };
            }

            // إضافة رد جديد
            const newReply = {
                trigger: triggerLower,
                response: response,
                mention: options.mention || false,
                reply: options.reply !== false,
                exact: options.exact || false,
                createdAt: new Date(),
                createdBy: userId,
                uses: 0
            };

            replies.push(newReply);

            // حفظ في الداتابيز
            await updateConfig({ autoReplies: replies });
            
            // تحديث الـ cache
            this.cache = replies;
            this.lastSync = Date.now();

            console.log(`✅ Auto reply added: ${trigger}`);
            return { success: true, data: newReply };

        } catch (error) {
            console.error('❌ Error adding auto reply:', error);
            return { success: false, message: error.message };
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // 🗑️ REMOVE AUTO REPLY
    // ═══════════════════════════════════════════════════════════════
    async remove(trigger) {
        try {
            const replies = await this.load();
            const triggerLower = trigger.toLowerCase();

            const filtered = replies.filter(r => r.trigger.toLowerCase() !== triggerLower);

            if (filtered.length === replies.length) {
                return { success: false, message: 'Trigger not found' };
            }

            await updateConfig({ autoReplies: filtered });
            
            this.cache = filtered;
            this.lastSync = Date.now();

            console.log(`✅ Auto reply removed: ${trigger}`);
            return { success: true };

        } catch (error) {
            console.error('❌ Error removing auto reply:', error);
            return { success: false, message: error.message };
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // 🔍 GET SINGLE AUTO REPLY
    // ═══════════════════════════════════════════════════════════════
    async get(trigger) {
        try {
            const replies = await this.load();
            const triggerLower = trigger.toLowerCase();
            return replies.find(r => r.trigger.toLowerCase() === triggerLower) || null;
        } catch (error) {
            console.error('❌ Error getting auto reply:', error);
            return null;
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // 📋 GET ALL AUTO REPLIES
    // ═══════════════════════════════════════════════════════════════
    async getAll() {
        try {
            return await this.load();
        } catch (error) {
            console.error('❌ Error getting all auto replies:', error);
            return [];
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // ✅ CHECK MESSAGE FOR TRIGGERS
    // ═══════════════════════════════════════════════════════════════
    async check(message) {
        try {
            const replies = await this.load();
            
            if (!replies || replies.length === 0) {
                return null;
            }

            const content = message.content.toLowerCase().trim();

            for (const replyData of replies) {
                let matched = false;

                if (replyData.exact) {
                    // مطابقة تامة
                    matched = content === replyData.trigger;
                } else {
                    // يحتوي على
                    matched = content.includes(replyData.trigger);
                }

                if (matched) {
                    // ✅ زيادة عداد الاستخدام
                    await this.incrementUse(replyData.trigger);
                    
                    console.log(`🤖 Auto reply triggered: "${replyData.trigger}" by ${message.author.tag}`);
                    
                    return replyData;
                }
            }

            return null;

        } catch (error) {
            console.error('❌ Error checking auto reply:', error);
            return null;
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // 📈 INCREMENT USE COUNT
    // ═══════════════════════════════════════════════════════════════
    async incrementUse(trigger) {
        try {
            const replies = await this.load();
            const triggerLower = trigger.toLowerCase();

            const reply = replies.find(r => r.trigger.toLowerCase() === triggerLower);
            if (reply) {
                reply.uses = (reply.uses || 0) + 1;
                
                await updateConfig({ autoReplies: replies });
                
                this.cache = replies;
            }
        } catch (error) {
            console.error('❌ Error incrementing use count:', error);
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // 🧹 CLEAR ALL
    // ═══════════════════════════════════════════════════════════════
    async clear() {
        try {
            await updateConfig({ autoReplies: [] });
            
            this.cache = [];
            this.lastSync = Date.now();
            
            console.log('✅ All auto replies cleared');
            return { success: true };
        } catch (error) {
            console.error('❌ Error clearing auto replies:', error);
            return { success: false, message: error.message };
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // 📊 GET COUNT
    // ═══════════════════════════════════════════════════════════════
    async count() {
        try {
            const replies = await this.load();
            return replies.length;
        } catch (error) {
            console.error('❌ Error getting count:', error);
            return 0;
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // 🔄 FORCE REFRESH CACHE
    // ═══════════════════════════════════════════════════════════════
    async refresh() {
        this.lastSync = 0;
        return await this.load();
    }
}

export const autoReply = new AutoReplySystem();