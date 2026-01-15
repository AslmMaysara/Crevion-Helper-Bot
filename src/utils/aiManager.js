// src/utils/aiManager.js - COMPLETE VERSION (كامل مع كل المميزات)

import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// ═══════════════════════════════════════════════════════════════
// 🤖 AI MODELS CONFIGURATION
// ═══════════════════════════════════════════════════════════════

const AI_MODELS = {
    GROQ: {
        name: 'Groq',
        baseUrl: 'https://api.groq.com/openai/v1/chat/completions',
        model: 'llama-3.3-70b-versatile',
        visionModel: 'llama-3.2-11b-vision-preview',
        maxTokens: 8000,
        supportsVision: true,
        specialty: 'general'
    },
    DEEPSEEK: {
        name: 'DeepSeek',
        baseUrl: 'https://api.deepseek.com/v1/chat/completions',
        model: 'deepseek-chat',
        maxTokens: 4000,
        supportsVision: false,
        specialty: 'code'
    },
    GEMINI: {
        name: 'Gemini',
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models',
        model: 'gemini-1.5-flash',
        visionModel: 'gemini-1.5-flash',
        maxTokens: 8000,
        supportsVision: true,
        specialty: 'vision'
    }
};

// ═══════════════════════════════════════════════════════════════
// 🧠 ULTRA AI MANAGER CLASS
// ═══════════════════════════════════════════════════════════════

class UltraAIManager {
    constructor() {
        this.groqAvailable = !!GROQ_API_KEY;
        this.deepseekAvailable = !!DEEPSEEK_API_KEY;
        this.geminiAvailable = !!GEMINI_API_KEY;
        
        console.log(`\n🤖 AI Status:`);
        console.log(`   Groq: ${this.groqAvailable ? '✅ (General + Vision)' : '❌'}`);
        console.log(`   DeepSeek: ${this.deepseekAvailable ? '✅ (Code Specialist)' : '❌'}`);
        console.log(`   Gemini: ${this.geminiAvailable ? '✅ (Vision Master)' : '❌'}\n`);
    }

    // ═══════════════════════════════════════════════════════════════
    // 🎯 SMART AI SELECTION
    // ═══════════════════════════════════════════════════════════════
    
    selectBestAI(userMessage, attachments = []) {
        const hasImages = attachments.some(a => a.type === 'image' || a.type === 'sticker');
        const hasCodeKeywords = /```|code|function|برمجة|كود|script|javascript|python|java|c\+\+|c#/i.test(userMessage);
        
        // ✅ PRIORITY 1: Code → DeepSeek
        if (hasCodeKeywords && this.deepseekAvailable) {
            console.log('   🎯 Selected: DeepSeek (Code)');
            return AI_MODELS.DEEPSEEK;
        }
        
        // ✅ PRIORITY 2: Images → Groq Vision
        if (hasImages && this.groqAvailable) {
            console.log('   🎯 Selected: Groq Vision');
            return AI_MODELS.GROQ;
        }
        
        // ✅ PRIORITY 3: General → Groq
        if (this.groqAvailable) {
            console.log('   🎯 Selected: Groq (General)');
            return AI_MODELS.GROQ;
        }
        
        // ✅ Fallback chain
        if (hasImages && this.geminiAvailable) {
            console.log('   🎯 Fallback: Gemini Vision');
            return AI_MODELS.GEMINI;
        }
        
        if (this.geminiAvailable) {
            console.log('   🎯 Fallback: Gemini');
            return AI_MODELS.GEMINI;
        }
        
        if (this.deepseekAvailable) {
            console.log('   🎯 Fallback: DeepSeek');
            return AI_MODELS.DEEPSEEK;
        }
        
        throw new Error('No AI available');
    }

    // ═══════════════════════════════════════════════════════════════
    // 💬 MAIN CHAT FUNCTION
    // ═══════════════════════════════════════════════════════════════
    
    async chat(userMessage, conversationHistory = [], channelMemories = {}, sharedContext = {}, attachments = [], emojis = [], currentUser = {}) {
        const ai = this.selectBestAI(userMessage, attachments);
        
        try {
            const systemPrompt = this.buildEnhancedSystemPrompt(
                channelMemories, 
                sharedContext, 
                currentUser, 
                attachments, 
                emojis
            );

            const messages = [
                { role: 'system', content: systemPrompt },
                ...conversationHistory.slice(-30),
                this.buildUserMessage(userMessage, attachments, currentUser, ai)
            ];

            const hasImages = attachments.some(a => a.type === 'image' || a.type === 'sticker');
            const selectedModel = (hasImages && ai.supportsVision) ? ai.visionModel : ai.model;

            console.log(`   📡 Using: ${ai.name} - ${selectedModel}`);

            let response;
            if (ai.name === 'Gemini') {
                response = await this.callGemini(messages, selectedModel, hasImages, attachments);
            } else if (ai.name === 'Groq') {
                response = await this.callGroq(messages, selectedModel);
            } else if (ai.name === 'DeepSeek') {
                response = await this.callDeepSeek(messages, selectedModel);
            }

            if (!response?.content) {
                throw new Error('No response from AI');
            }

            let content = this.cleanResponse(response.content);

            return {
                content,
                model: ai.name,
                usedVision: hasImages && ai.supportsVision,
                tokensUsed: response.tokensUsed || 0
            };

        } catch (error) {
            console.error(`❌ ${ai.name} failed:`, error.message);
            return await this.tryFallback(userMessage, conversationHistory, channelMemories, sharedContext, attachments, emojis, currentUser, ai);
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // 🔄 FALLBACK MECHANISM
    // ═══════════════════════════════════════════════════════════════
    
    async tryFallback(userMessage, conversationHistory, channelMemories, sharedContext, attachments, emojis, currentUser, failedAI) {
        const hasImages = attachments.some(a => a.type === 'image' || a.type === 'sticker');
        
        console.log(`   🔄 Trying fallback...`);
        
        let fallbackOrder = [];
        
        if (failedAI.name === 'Groq') {
            fallbackOrder = hasImages 
                ? [AI_MODELS.GEMINI, AI_MODELS.DEEPSEEK] 
                : [AI_MODELS.DEEPSEEK, AI_MODELS.GEMINI];
        } else if (failedAI.name === 'DeepSeek') {
            fallbackOrder = [AI_MODELS.GROQ, AI_MODELS.GEMINI];
        } else if (failedAI.name === 'Gemini') {
            fallbackOrder = hasImages 
                ? [AI_MODELS.GROQ, AI_MODELS.DEEPSEEK] 
                : [AI_MODELS.DEEPSEEK, AI_MODELS.GROQ];
        }
        
        for (const fallbackAI of fallbackOrder) {
            if (!this.isAIAvailable(fallbackAI.name)) continue;
            
            try {
                console.log(`   ➡️ Trying: ${fallbackAI.name}`);
                
                const systemPrompt = this.buildEnhancedSystemPrompt(channelMemories, sharedContext, currentUser, attachments, emojis);
                const messages = [
                    { role: 'system', content: systemPrompt },
                    ...conversationHistory.slice(-30),
                    this.buildUserMessage(userMessage, attachments, currentUser, fallbackAI)
                ];
                
                const selectedModel = (hasImages && fallbackAI.supportsVision) ? fallbackAI.visionModel : fallbackAI.model;
                
                let response;
                if (fallbackAI.name === 'Gemini') {
                    response = await this.callGemini(messages, selectedModel, hasImages, attachments);
                } else if (fallbackAI.name === 'Groq') {
                    response = await this.callGroq(messages, selectedModel);
                } else if (fallbackAI.name === 'DeepSeek') {
                    response = await this.callDeepSeek(messages, selectedModel);
                }
                
                if (response?.content) {
                    console.log(`   ✅ Fallback success: ${fallbackAI.name}`);
                    return {
                        content: this.cleanResponse(response.content),
                        model: `${fallbackAI.name}`,
                        usedVision: hasImages && fallbackAI.supportsVision,
                        tokensUsed: response.tokensUsed || 0
                    };
                }
            } catch (err) {
                console.error(`   ❌ ${fallbackAI.name} fallback failed:`, err.message);
            }
        }
        
        throw new Error('All AI models failed');
    }

    // ═══════════════════════════════════════════════════════════════
    // 🟢 GROQ API CALL
    // ═══════════════════════════════════════════════════════════════
    
    async callGroq(messages, model) {
        const response = await fetch(AI_MODELS.GROQ.baseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: model,
                messages: messages,
                max_tokens: AI_MODELS.GROQ.maxTokens,
                temperature: 0.85,
                top_p: 0.95
            }),
            timeout: 35000
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Groq error ${response.status}: ${error}`);
        }

        const data = await response.json();
        return {
            content: data.choices[0].message.content,
            tokensUsed: data.usage?.total_tokens || 0
        };
    }

    // ═══════════════════════════════════════════════════════════════
    // 🔵 DEEPSEEK API CALL
    // ═══════════════════════════════════════════════════════════════
    
    async callDeepSeek(messages, model) {
        const response = await fetch(AI_MODELS.DEEPSEEK.baseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
            },
            body: JSON.stringify({
                model: model,
                messages: messages,
                max_tokens: AI_MODELS.DEEPSEEK.maxTokens,
                temperature: 0.85,
                top_p: 0.95
            }),
            timeout: 35000
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`DeepSeek error ${response.status}: ${error}`);
        }

        const data = await response.json();
        return {
            content: data.choices[0].message.content,
            tokensUsed: data.usage?.total_tokens || 0
        };
    }

    // ═══════════════════════════════════════════════════════════════
    // 🔴 GEMINI API CALL
    // ═══════════════════════════════════════════════════════════════
    
    async callGemini(messages, model, hasImages = false, attachments = []) {
        const contents = await this.convertToGeminiFormat(messages, hasImages, attachments);
        
        const url = `${AI_MODELS.GEMINI.baseUrl}/${model}:generateContent?key=${GEMINI_API_KEY}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: contents,
                generationConfig: {
                    temperature: 0.85,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 8192
                }
            }),
            timeout: 40000
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Gemini error ${response.status}: ${error}`);
        }

        const data = await response.json();
        
        if (!data.candidates || !data.candidates[0]?.content?.parts) {
            throw new Error('Invalid Gemini response');
        }
        
        const content = data.candidates[0].content.parts
            .map(p => p.text)
            .filter(Boolean)
            .join('\n');
        
        return {
            content: content,
            tokensUsed: data.usageMetadata?.totalTokenCount || 0
        };
    }

    // ═══════════════════════════════════════════════════════════════
    // 🔄 CONVERT TO GEMINI FORMAT
    // ═══════════════════════════════════════════════════════════════
    
    async convertToGeminiFormat(messages, hasImages, attachments) {
        const contents = [];
        
        for (const msg of messages) {
            if (msg.role === 'system') continue;
            
            const role = msg.role === 'assistant' ? 'model' : 'user';
            
            if (Array.isArray(msg.content)) {
                const parts = [];
                
                for (const item of msg.content) {
                    if (item.type === 'text') {
                        parts.push({ text: item.text });
                    } else if (item.type === 'image_url') {
                        try {
                            const imageUrl = item.image_url.url;
                            const imageResponse = await fetch(imageUrl);
                            const imageBuffer = await imageResponse.arrayBuffer();
                            const base64Image = Buffer.from(imageBuffer).toString('base64');
                            
                            parts.push({
                                inlineData: {
                                    mimeType: 'image/jpeg',
                                    data: base64Image
                                }
                            });
                        } catch (err) {
                            console.error('Failed to fetch image:', err.message);
                        }
                    }
                }
                
                contents.push({ role, parts });
            } else {
                contents.push({
                    role,
                    parts: [{ text: msg.content }]
                });
            }
        }
        
        const systemMsg = messages.find(m => m.role === 'system');
        if (systemMsg && contents.length > 0 && contents[0].role === 'user') {
            contents[0].parts.unshift({ text: systemMsg.content });
        }
        
        return contents;
    }

    // ═══════════════════════════════════════════════════════════════
    // 🧠 ENHANCED SYSTEM PROMPT (يفهم عامية - يرد فصحى)
    // ═══════════════════════════════════════════════════════════════
    
    buildEnhancedSystemPrompt(channelMemories, sharedContext, currentUser, attachments, emojis) {
        const userName = currentUser.username || 'المستخدم';

        let prompt = `أنت **Crévion AI**، مساعد ذكي متطور في سيرفر Crevion للمبدعين العرب.

🎯 **هويتك:**
- الاسم: **Crévion AI** (اسمك الرسمي)
- الشخصية: ذكي، محترف، ودود، خفيف الظل
- المكان: سيرفر Crevion Community للمبدعين
- المهمة: مساعدة المبدعين وتقديم معلومات دقيقة

💬 **أسلوب التواصل:**

**افهم:**
- ✅ العربية الفصحى
- ✅ العامية المصرية
- ✅ الإنجليزية
- ✅ الإيموجيات والملصقات

**رد بـ:**
- ✅ عربية فصحى واضحة ومباشرة
- ✅ أسلوب ودود ومحترم
- ✅ معلومات دقيقة ومفيدة

**ممنوع:**
- ❌ الرد بالعامية (افهمها بس لا ترد بيها)
- ❌ قول "لا أستطيع الاستجابة"
- ❌ التوقيع باسمك في نهاية الرد
- ❌ ذكر اسم النموذج (Groq/DeepSeek/Gemini)

🧠 **قدراتك:**
- 👁️ **رؤية وتحليل الصور** - وصف دقيق وتفصيلي
- 😊 **فهم الإيموجيات** - تفهم معنى كل إيموجي وتستخدمها بحكمة
- 💻 **كتابة أكواد احترافية** - بأعلى جودة
- 📚 **شرح المفاهيم** - بطريقة واضحة
- 🎮 **إدارة الألعاب** - تنظيم الأنشطة
- 💾 **ذاكرة قوية** - تذكر التفاصيل

`;

        // Current user
        prompt += `\n👤 **المستخدم الحالي:** ${userName}\n`;

        // User memories
        if (channelMemories && Object.keys(channelMemories).length > 0) {
            prompt += `\n📝 **معلومات محفوظة:**\n`;
            for (const [uid, memory] of Object.entries(channelMemories)) {
                if (memory?.facts?.length > 0) {
                    const name = memory.name || memory.nickname || uid;
                    const facts = memory.facts.slice(0, 3).join('، ');
                    prompt += `- **${name}:** ${facts}\n`;
                }
            }
        }

        // Shared context
        if (sharedContext && sharedContext.currentGame) {
            prompt += `\n🎮 **اللعبة الحالية:**\n`;
            prompt += `- النوع: ${sharedContext.currentGame}\n`;
            if (sharedContext.participants && sharedContext.participants.length > 0) {
                prompt += `- اللاعبون: ${sharedContext.participants.length}\n`;
            }
        }

        // Attachments
        if (attachments.length > 0) {
            prompt += `\n📎 **المرفقات:**\n`;
            attachments.forEach(att => {
                if (att.type === 'image') {
                    prompt += `- 🖼️ صورة: حللها ووصفها بالتفصيل\n`;
                } else if (att.type === 'sticker') {
                    prompt += `- 🎭 ملصق: "${att.description || att.name}" - علق عليه\n`;
                } else if (att.type === 'file') {
                    prompt += `- 📄 ملف: ${att.name}\n`;
                }
            });
        }

        // Emojis
        if (emojis && emojis.length > 0) {
            prompt += `\n😀 **الإيموجيات في الرسالة:**\n`;
            emojis.forEach(emoji => {
                prompt += `- :${emoji.name}: (إيموجي مخصص من السيرفر)\n`;
            });
        }

        prompt += `\n🎯 **أمثلة على الأسلوب الصحيح:**

**مثال 1 - فهم العامية:**
👤 المستخدم: "ازيك يا صاحبي؟"
🤖 أنت: "مرحباً! 😊 أنا بخير، شكراً لسؤالك. كيف يمكنني مساعدتك اليوم؟"

**مثال 2 - فهم الإيموجيات:**
👤 المستخدم: "انت اسمك ايه؟ 🤔"
🤖 أنت: "أنا **Crévion AI**، المساعد الذكي في سيرفر Crevion للمبدعين العرب! 🤖✨"

**مثال 3 - طلب كود:**
👤 المستخدم: "عايز كود يعمل كذا"
🤖 أنت: "بالتأكيد! إليك الكود المطلوب:"

**مثال 4 - فهم النكات:**
👤 المستخدم: "انا عندك بتاع 😂"
🤖 أنت: "هههه 😄 أهلاً بك! كيف يمكنني مساعدتك؟"

⚠️ **تذكر:**
- أنت **Crévion AI** وهذا اسمك الرسمي
- افهم كل اللغات لكن رد بالفصحى فقط
- استخدم الإيموجيات بحكمة لتكون ودوداً
- لا تقل "لا أستطيع" - بل حاول المساعدة دائماً

الآن، قدم إجابة واضحة ومفيدة:`;

        return prompt;
    }

    // ═══════════════════════════════════════════════════════════════
    // 📝 BUILD USER MESSAGE
    // ═══════════════════════════════════════════════════════════════
    
    buildUserMessage(message, attachments, currentUser, ai) {
        const content = [];
        const userText = message || '[أرسل مرفقات]';
        
        content.push({
            type: 'text',
            text: `[${currentUser.username}]: ${userText}`
        });

        if (ai.supportsVision) {
            attachments.forEach(att => {
                if (att.type === 'image' || att.type === 'sticker') {
                    content.push({
                        type: 'image_url',
                        image_url: {
                            url: att.url,
                            detail: 'high'
                        }
                    });
                }
            });
        }

        return {
            role: 'user',
            content: content.length === 1 ? content[0].text : content
        };
    }

    // ═══════════════════════════════════════════════════════════════
    // 🧹 CLEAN RESPONSE
    // ═══════════════════════════════════════════════════════════════
    
    cleanResponse(text) {
        // Remove AI signatures
        text = text.replace(/- (Groq|DeepSeek|Gemini|LLaMA|Claude|GPT|Assistant)\s*$/gim, '');
        text = text.replace(/\*\*(Groq|DeepSeek|Gemini|LLaMA|Claude|GPT)\*\*/gi, '');
        
        // Remove foreign characters
        text = text.replace(/[\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF\uAC00-\uD7AF]/g, '');
        
        // Clean spacing
        text = text.replace(/\n{3,}/g, '\n\n');
        text = text.replace(/  +/g, ' ');
        
        return text.trim();
    }

    // ═══════════════════════════════════════════════════════════════
    // ✅ CHECK AVAILABILITY
    // ═══════════════════════════════════════════════════════════════
    
    isAvailable() {
        return this.groqAvailable || this.deepseekAvailable || this.geminiAvailable;
    }

    isAIAvailable(aiName) {
        if (aiName === 'Groq') return this.groqAvailable;
        if (aiName === 'DeepSeek') return this.deepseekAvailable;
        if (aiName === 'Gemini') return this.geminiAvailable;
        return false;
    }

    supportsVision() {
        return this.groqAvailable || this.geminiAvailable;
    }
}

// ═══════════════════════════════════════════════════════════════
// 📤 EXPORTS
// ═══════════════════════════════════════════════════════════════

export const aiManager = new UltraAIManager();

export function extractMemoryFromMessage(message, currentMemory = {}) {
    const lower = message.toLowerCase();
    const newMemory = { ...currentMemory };

    if (lower.includes('اسمي') || lower.includes('my name is')) {
        const nameMatch = message.match(/اسمي\s+(\S+)/i) || message.match(/my name is\s+(\S+)/i);
        if (nameMatch) {
            newMemory.name = nameMatch[1];
        }
    }

    if (lower.includes('ناديني') || lower.includes('call me')) {
        const nickMatch = message.match(/ناديني\s+(\S+)/i) || message.match(/call me\s+(\S+)/i);
        if (nickMatch) {
            newMemory.nickname = nickMatch[1];
        }
    }

    if (lower.includes('احفظ') || lower.includes('تذكر') || lower.includes('remember')) {
        const fact = message.replace(/(احفظ|تذكر|remember)/gi, '').trim();
        if (!newMemory.facts) newMemory.facts = [];
        if (fact && !newMemory.facts.includes(fact)) {
            newMemory.facts.push(fact);
        }
    }

    return newMemory;
}