// src/utils/aiManager.js - ULTRA ADVANCED VERSION

import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

const AI_MODELS = {
    GROQ: {
        name: 'Groq',
        baseUrl: 'https://api.groq.com/openai/v1/chat/completions',
        model: 'llama-3.3-70b-versatile',
        visionModel: 'llama-3.2-90b-vision-preview', // ✅ Vision support!
        maxTokens: 8000,
        supportsVision: true
    },
    DEEPSEEK: {
        name: 'DeepSeek',
        baseUrl: 'https://api.deepseek.com/v1/chat/completions',
        model: 'deepseek-chat',
        maxTokens: 4000,
        supportsVision: false
    }
};

class UltraAIManager {
    constructor() {
        this.groqAvailable = !!GROQ_API_KEY;
        this.deepseekAvailable = !!DEEPSEEK_API_KEY;
        
        console.log(`✅ AI: ${this.groqAvailable ? 'Groq✓(Vision✓)' : ''} ${this.deepseekAvailable ? 'DeepSeek✓' : ''}`);
    }

    async chat(userMessage, conversationHistory = [], channelMemories = {}, sharedContext = {}, attachments = [], emojis = [], currentUser = {}) {
        // Select AI with vision if images present
        const hasImages = attachments.some(a => a.type === 'image');
        const ai = (hasImages && this.groqAvailable) ? AI_MODELS.GROQ : 
                   (this.groqAvailable ? AI_MODELS.GROQ : AI_MODELS.DEEPSEEK);
        
        if (!ai) throw new Error('No AI available');

        const apiKey = ai.name === 'Groq' ? GROQ_API_KEY : DEEPSEEK_API_KEY;

        // Build enhanced system prompt
        const systemPrompt = this.buildEnhancedSystemPrompt(channelMemories, sharedContext, currentUser, attachments, emojis);

        // Build messages with vision support
        const messages = [
            { role: 'system', content: systemPrompt },
            ...conversationHistory.slice(-30),
            this.buildUserMessageWithVision(userMessage, attachments, currentUser)
        ];

        // Select model (vision if needed)
        const selectedModel = (hasImages && ai.supportsVision) ? ai.visionModel : ai.model;

        try {
            const response = await fetch(ai.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: selectedModel,
                    messages: messages,
                    max_tokens: ai.maxTokens,
                    temperature: 0.85,
                    top_p: 0.95
                }),
                timeout: 35000
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();
            let content = data.choices[0].message.content;

            content = this.cleanResponse(content);

            return {
                content,
                model: ai.name,
                usedVision: hasImages && ai.supportsVision,
                tokensUsed: data.usage?.total_tokens || 0
            };

        } catch (error) {
            console.error(`❌ ${ai.name} error:`, error.message);
            throw error;
        }
    }

    buildEnhancedSystemPrompt(channelMemories, sharedContext, currentUser, attachments, emojis) {
        const userName = currentUser.username || 'المستخدم';
        const userId = currentUser.id;

        let prompt = `أنت **Crévion AI**، مساعد ذكي عفوي ومضحك في سيرفر Crévion Community.

🎯 **هويتك:**
- اسمك: Crévion AI (لكن متقولش اسمك كل مرة!)
- شخصيتك: **عفوي، طريف، ذكي، صديق حميمي**
- مكانك: قناة AI في Crévion Community
- السيرفر: مجتمع للمبدعين في البرمجة والتصميم

😎 **شخصيتك الجديدة:**
- **عفوي جداً:** رد براحتك زي ما لو بتكلم صاحبك
- **مضحك شوية:** استخدم دعابات خفيفة لما يكون المكان مناسب
- **طبيعي:** مش كل كلامك لازم يكون رسمي
- **تفاعلي:** لو حد بعت ستيكر مضحك، رد عليه بطريقة طريفة
- **متواضع:** لو غلطت، اعترف واضحك على نفسك

🧠 **قدراتك الخارقة:**
- 👁️ **رؤية الصور والستيكرز:** تقدر تشوف الصور والستيكرز وتعلق عليها بطريقة طريفة
- 😀 **فهم الإيموجيات:** تفهم الإيموجيات المخصصة وتستخدمها برضو
- 👥 **محادثات جماعية:** تقدر تتابع محادثات بين ناس كتير
- 🎮 **ألعاب:** تحكم ألعاب وتبقى طريف في التعليق
- 💾 **ذاكرة قوية:** تفتكر كل حاجة عن كل واحد
- 📚 **تعلّم:** كل ما الناس تكلمك أكتر، تبقى أذكى

💬 **أسلوبك الجديد:**
- متبقاش جامد أوي في الكلام
- استخدم تعبيرات عربية عادية زي "يعني"، "بس"، "خالص"
- لو حد بعت حاجة مضحكة، اضحك معاه
- لو حد سألك سؤال غريب، رد بطريقة طريفة
- **بدون رموز غريبة** أو أحرف صينية أبداً
- **بدون توقيع** في النهاية خالص
- **بدون emojis كتير** (واحد أو اتنين كفاية)

`;

        // Current user
        prompt += `\n👤 **بتكلم دلوقتي:**\n- ${userName}\n`;

        // User memories
        if (channelMemories && Object.keys(channelMemories).length > 0) {
            prompt += `\n📝 **اللي فاكره عن الناس:**\n`;
            
            for (const [uid, memory] of Object.entries(channelMemories)) {
                if (memory && (memory.name || memory.facts?.length > 0)) {
                    const name = memory.name || uid;
                    const facts = memory.facts?.slice(0, 3).join(', ') || '';
                    if (facts) {
                        prompt += `- ${name}: ${facts}\n`;
                    }
                }
            }
        }

        // Shared context
        if (sharedContext && sharedContext.currentGame) {
            prompt += `\n🎮 **اللعبة الحالية:**\n`;
            prompt += `- اللعبة: ${sharedContext.currentGame}\n`;
            
            if (sharedContext.participants && sharedContext.participants.length > 0) {
                prompt += `- اللاعبين: ${sharedContext.participants.length} لاعب\n`;
            }
        }

        // Attachments (ENHANCED)
        if (attachments.length > 0) {
            prompt += `\n📎 **المستخدم بعت:**\n`;
            attachments.forEach(att => {
                if (att.type === 'image') {
                    prompt += `- 🖼️ صورة: ${att.name}\n`;
                    prompt += `  ✅ **أنت بتشوف الصورة دي!** وصفها بالتفصيل وعلق عليها بطريقة طريفة لو كانت مضحكة.\n`;
                } else if (att.type === 'sticker') {
                    prompt += `- 🎭 ستيكر: "${att.description || att.name}"\n`;
                    prompt += `  ✅ **أنت بتشوف الستيكر ده!** علق عليه بطريقة طبيعية ومضحكة.\n`;
                } else if (att.type === 'file') {
                    prompt += `- 📄 ملف: ${att.name}\n`;
                } else if (att.type === 'link') {
                    prompt += `- 🔗 رابط: ${att.url}\n`;
                }
            });
        }

        // Emojis (NEW!)
        if (emojis && emojis.length > 0) {
            prompt += `\n😀 **الإيموجيات المستخدمة:**\n`;
            emojis.forEach(emoji => {
                prompt += `- :${emoji.name}: (إيموجي مخصص من السيرفر)\n`;
            });
            prompt += `**تقدر تستخدم نفس الإيموجيات في ردك!**\n`;
        }

        prompt += `\n⚠️ **قواعد صارمة:**
1. **لا تذكر اسم الموديل** أبداً (Groq/DeepSeek/LLaMA)
2. **لا تكتب توقيع** في آخر الرد
3. **رد مباشرة** زي ما لو بتكلم صاحبك
4. **لو شفت صورة/ستيكر:** وصفها واتكلم عنها بعفوية
5. **لو في لعبة:** كن حيادي لكن اتكلم بطريقة مرحة
6. **متكررش نفسك:** كل رد يكون مختلف

🎯 **أمثلة على أسلوبك:**
- مش "أهلاً بك عزيزي المستخدم" → **"إيه يا معلم، عامل إيه؟"**
- مش "شكراً لك على السؤال" → **"تمام، ده سؤال حلو"**
- مش "أنا مساعد ذكي" → **"أنا هنا، قول محتاج إيه"**

الآن، رد بعفوية وذكاء!`;

        return prompt;
    }

    buildUserMessageWithVision(message, attachments, currentUser) {
        const content = [];

        // Add text
        const userText = message || '📎 [بعت حاجة]';
        content.push({
            type: 'text',
            text: `[${currentUser.username}]: ${userText}`
        });

        // Add images/stickers for vision
        attachments.forEach(att => {
            if (att.type === 'image' || att.type === 'sticker') {
                content.push({
                    type: 'image_url',
                    image_url: {
                        url: att.url,
                        detail: 'high' // ✅ High detail for better analysis
                    }
                });
            }
        });

        return {
            role: 'user',
            content: content.length === 1 ? content[0].text : content
        };
    }

    cleanResponse(text) {
        // Remove AI model signatures
        text = text.replace(/- (Groq|DeepSeek|LLaMA|Crévion AI|Claude|GPT)\s*$/gim, '');
        text = text.replace(/\*\*(Groq|DeepSeek|LLaMA|Claude|GPT)\*\*/gi, '');
        
        // Remove weird characters
        text = text.replace(/[\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF]/g, '');
        
        // Remove multiple newlines
        text = text.replace(/\n{3,}/g, '\n\n');
        
        return text.trim();
    }

    isAvailable() {
        return this.groqAvailable || this.deepseekAvailable;
    }

    supportsVision() {
        return this.groqAvailable;
    }
}

export const aiManager = new UltraAIManager();

// ═══════════════════════════════════════════════════════════════
// 📚 SYSTEM PROMPTS (للتوافق)
// ═══════════════════════════════════════════════════════════════

export const SYSTEM_PROMPTS = {
    general: `You are Crévion AI, an advanced assistant.`,
    code_generation: `Generate clean code with best practices.`,
    code_explanation: `Explain code clearly and thoroughly.`,
    debugging: `Debug code professionally.`,
    optimization: `Optimize code for performance.`,
    design: `Provide modern UI/UX design advice.`
};

// Memory extraction
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