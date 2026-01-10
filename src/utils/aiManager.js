// src/utils/aiManager.js - ULTRA ADVANCED (3 APIs + عربي فصيح)

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
        specialty: 'general',
        costPerToken: 0.00001
    },
    DEEPSEEK: {
        name: 'DeepSeek',
        baseUrl: 'https://api.deepseek.com/v1/chat/completions',
        model: 'deepseek-chat',
        maxTokens: 4000,
        supportsVision: false,
        specialty: 'code',
        costPerToken: 0.000001
    },
    GEMINI: {
        name: 'Gemini',
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models',
        model: 'gemini-1.5-flash',
        visionModel: 'gemini-1.5-flash',
        maxTokens: 8000,
        supportsVision: true,
        specialty: 'vision',
        costPerToken: 0.000002
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
        
        // ✅ PRIORITY 2: Images → Groq Vision (أفضل من Gemini)
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
                temperature: 0.7,
                top_p: 0.9
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
                temperature: 0.7,
                top_p: 0.9
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
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.9,
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
    // 🧠 ENHANCED SYSTEM PROMPT (عربي فصيح!)
    // ═══════════════════════════════════════════════════════════════
    
    buildEnhancedSystemPrompt(channelMemories, sharedContext, currentUser, attachments, emojis) {
        const userName = currentUser.username || 'المستخدم';

        let prompt = `أنت **Crévion AI**، مساعد ذكي في سيرفر Crévion للمبدعين.

🎯 **هويتك:**
- الاسم: Crévion AI
- الشخصية: ذكي، مفيد، ودود
- المكان: قناة AI في Crévion Community

💬 **أسلوب الحديث:**
- استخدم اللغة العربية الفصحى بشكل طبيعي
- كن واضحاً ومباشراً في الإجابة
- أظهر الذكاء والاحترافية
- قدم معلومات دقيقة ومفيدة

🧠 **قدراتك:**
- 👁️ **رؤية الصور والملصقات** - قادر على تحليلها ووصفها بدقة
- 💻 **كتابة الأكواد** - بجودة احترافية عالية
- 📚 **شرح المفاهيم** - بطريقة واضحة ومفصلة
- 🎮 **إدارة الألعاب** - قادر على تنظيم ومتابعة الأنشطة
- 💾 **الذاكرة القوية** - أتذكر التفاصيل المهمة عن كل شخص

`;

        // Current user
        prompt += `\n👤 **المستخدم الحالي:** ${userName}\n`;

        // User memories
        if (channelMemories && Object.keys(channelMemories).length > 0) {
            prompt += `\n📝 **معلومات محفوظة:**\n`;
            for (const [uid, memory] of Object.entries(channelMemories)) {
                if (memory?.facts?.length > 0) {
                    const name = memory.name || uid;
                    const facts = memory.facts.slice(0, 3).join('، ');
                    prompt += `- ${name}: ${facts}\n`;
                }
            }
        }

        // Shared context
        if (sharedContext && sharedContext.currentGame) {
            prompt += `\n🎮 **اللعبة الحالية:**\n`;
            prompt += `- اللعبة: ${sharedContext.currentGame}\n`;
            if (sharedContext.participants && sharedContext.participants.length > 0) {
                prompt += `- عدد اللاعبين: ${sharedContext.participants.length}\n`;
            }
        }

        // Attachments
        if (attachments.length > 0) {
            prompt += `\n📎 **المرفقات:**\n`;
            attachments.forEach(att => {
                if (att.type === 'image') {
                    prompt += `- 🖼️ صورة: يجب تحليلها ووصفها بالتفصيل\n`;
                } else if (att.type === 'sticker') {
                    prompt += `- 🎭 ملصق: "${att.description || att.name}" - يجب التعليق عليه\n`;
                } else if (att.type === 'file') {
                    prompt += `- 📄 ملف: ${att.name}\n`;
                }
            });
        }

        // Emojis
        if (emojis && emojis.length > 0) {
            prompt += `\n😀 **الرموز التعبيرية المخصصة:**\n`;
            emojis.forEach(emoji => {
                prompt += `- :${emoji.name}: (من السيرفر)\n`;
            });
        }

        prompt += `\n⚠️ **قواعد صارمة:**
1. **لا تذكر اسم النموذج** أبداً (Groq/DeepSeek/Gemini)
2. **لا توقيع** في نهاية الرد
3. **رد مباشرة** على السؤال
4. **إذا وجدت صورة** - حللها بدقة
5. **إذا كان هناك كود** - اكتبه بشكل احترافي
6. **لا رموز غريبة** (صينية أو غير مفهومة)

🎯 **أمثلة على الأسلوب:**
❌ "مرحباً عزيزي المستخدم الكريم"
✅ "مرحباً، كيف يمكنني مساعدتك؟"

❌ "شكراً جزيلاً لك على السؤال"
✅ "سؤال جيد، دعني أجيبك"

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
        text = text.replace(/- (Groq|DeepSeek|Gemini|LLaMA|Crévion AI|Claude|GPT)\s*$/gim, '');
        text = text.replace(/\*\*(Groq|DeepSeek|Gemini|LLaMA|Claude|GPT)\*\*/gi, '');
        text = text.replace(/\[المساعد: (Groq|DeepSeek|Gemini|LLaMA)\]/gi, '');
        
        // Remove weird characters
        text = text.replace(/[\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF\uAC00-\uD7AF]/g, '');
        text = text.replace(/[\u0080-\u009F\u2000-\u206F]/g, '');
        
        // Clean multiple newlines
        text = text.replace(/\n{3,}/g, '\n\n');
        
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
// 📤 EXPORT
// ═══════════════════════════════════════════════════════════════

export const aiManager = new UltraAIManager();

export const SYSTEM_PROMPTS = {
    general: `You are Crévion AI, an advanced assistant.`,
    code_generation: `Generate clean, professional code with best practices.`,
    code_explanation: `Explain code clearly and thoroughly.`,
    debugging: `Debug code professionally.`,
    optimization: `Optimize code for performance.`,
    design: `Provide modern UI/UX design advice.`
};

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

    if (lower.includes('احفظ') || lower.includes('remember')) {
        const fact = message.replace(/(احفظ|remember)/gi, '').trim();
        if (!newMemory.facts) newMemory.facts = [];
        if (fact && !newMemory.facts.includes(fact)) {
            newMemory.facts.push(fact);
        }
    }

    return newMemory;
}