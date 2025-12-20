// src/utils/aiManager.js - DUAL AI SYSTEM (DeepSeek + Groq)

import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

// AI Models Configuration
const AI_MODELS = {
    GROQ: {
        name: 'Groq',
        baseUrl: 'https://api.groq.com/openai/v1/chat/completions',
        model: 'mixtral-8x7b-32768', // Fast and powerful
        strengths: ['code_generation', 'problem_solving', 'speed'],
        maxTokens: 8000
    },
    DEEPSEEK: {
        name: 'DeepSeek',
        baseUrl: 'https://api.deepseek.com/v1/chat/completions',
        model: 'deepseek-chat', // Best for coding
        strengths: ['code_explanation', 'debugging', 'optimization'],
        maxTokens: 4000
    }
};

// Task types and their best AI
const TASK_AI_MAP = {
    code_generation: 'GROQ',      // Groq faster for generation
    code_explanation: 'DEEPSEEK', // DeepSeek better at explaining
    code_review: 'DEEPSEEK',      // DeepSeek more detailed
    debugging: 'DEEPSEEK',        // DeepSeek better at finding bugs
    optimization: 'DEEPSEEK',     // DeepSeek better at optimization
    general: 'GROQ',              // Groq for general questions
    design: 'GROQ',               // Groq for design advice
    quick_answer: 'GROQ'          // Groq is faster
};

class DualAIManager {
    constructor() {
        this.groqAvailable = !!GROQ_API_KEY;
        this.deepseekAvailable = !!DEEPSEEK_API_KEY;
        
        if (!this.groqAvailable && !this.deepseekAvailable) {
            console.error('❌ No AI APIs configured!');
        } else {
            console.log(`✅ AI System: ${this.groqAvailable ? 'Groq✓' : ''} ${this.deepseekAvailable ? 'DeepSeek✓' : ''}`);
        }
    }

    // Select best AI for task
    selectAI(taskType) {
        const preferredAI = TASK_AI_MAP[taskType] || 'GROQ';
        
        // Fallback logic
        if (preferredAI === 'GROQ' && this.groqAvailable) return AI_MODELS.GROQ;
        if (preferredAI === 'DEEPSEEK' && this.deepseekAvailable) return AI_MODELS.DEEPSEEK;
        
        // Fallback to available AI
        if (this.groqAvailable) return AI_MODELS.GROQ;
        if (this.deepseekAvailable) return AI_MODELS.DEEPSEEK;
        
        return null;
    }

    // Make AI request
    async request(taskType, systemPrompt, userMessage, conversationHistory = []) {
        const ai = this.selectAI(taskType);
        
        if (!ai) {
            throw new Error('No AI available');
        }

        const apiKey = ai.name === 'Groq' ? GROQ_API_KEY : DEEPSEEK_API_KEY;

        try {
            console.log(`🤖 Using ${ai.name} for ${taskType}`);

            const response = await fetch(ai.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: ai.model,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        ...conversationHistory,
                        { role: 'user', content: userMessage }
                    ],
                    max_tokens: ai.maxTokens,
                    temperature: 0.7,
                    top_p: 0.9
                }),
                timeout: 30000
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`${ai.name} API error: ${error}`);
            }

            const data = await response.json();
            const content = data.choices[0].message.content;

            console.log(`✅ ${ai.name} responded: ${content.length} chars`);

            return {
                content,
                model: ai.name,
                tokensUsed: data.usage?.total_tokens || 0
            };

        } catch (error) {
            console.error(`❌ ${ai.name} error:`, error.message);
            
            // Auto-fallback to other AI
            if (ai.name === 'Groq' && this.deepseekAvailable) {
                console.log('🔄 Falling back to DeepSeek...');
                return await this.request('general', systemPrompt, userMessage, conversationHistory);
            } else if (ai.name === 'DeepSeek' && this.groqAvailable) {
                console.log('🔄 Falling back to Groq...');
                return await this.request('general', systemPrompt, userMessage, conversationHistory);
            }
            
            throw error;
        }
    }

    // ✨ NEW: Get best response by trying both AIs (for critical tasks)
    async getBestResponse(taskType, systemPrompt, userMessage) {
        if (!this.groqAvailable || !this.deepseekAvailable) {
            // If only one available, use that
            return await this.request(taskType, systemPrompt, userMessage);
        }

        try {
            // Try both in parallel for critical tasks
            const [groqResponse, deepseekResponse] = await Promise.allSettled([
                this.makeRequest(AI_MODELS.GROQ, GROQ_API_KEY, systemPrompt, userMessage),
                this.makeRequest(AI_MODELS.DEEPSEEK, DEEPSEEK_API_KEY, systemPrompt, userMessage)
            ]);

            // Return the first successful response
            if (groqResponse.status === 'fulfilled') {
                return { content: groqResponse.value, model: 'Groq' };
            }
            if (deepseekResponse.status === 'fulfilled') {
                return { content: deepseekResponse.value, model: 'DeepSeek' };
            }

            throw new Error('Both AIs failed');

        } catch (error) {
            console.error('❌ Both AIs failed:', error.message);
            throw error;
        }
    }

    // Helper: Make single API request
    async makeRequest(ai, apiKey, systemPrompt, userMessage) {
        const response = await fetch(ai.baseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: ai.model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userMessage }
                ],
                max_tokens: ai.maxTokens,
                temperature: 0.7
            }),
            timeout: 30000
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    // Check availability
    isAvailable() {
        return this.groqAvailable || this.deepseekAvailable;
    }

    // Get status
    getStatus() {
        return {
            groq: this.groqAvailable,
            deepseek: this.deepseekAvailable,
            preferred: this.groqAvailable ? 'Groq' : (this.deepseekAvailable ? 'DeepSeek' : 'None')
        };
    }
}

// Export singleton
export const aiManager = new DualAIManager();

// System prompts for different tasks
export const SYSTEM_PROMPTS = {
    general: `You are Crevion AI, an elite assistant for developers and designers.

**Expertise:**
- Programming: JS, TS, Python, React, Node.js, Discord.js
- Design: UI/UX, Color Theory, Web Design
- Problem Solving: Algorithms, Data Structures

**Style:**
- Be helpful and precise
- Use emojis for clarity
- Provide working examples
- Be encouraging`,

    code_generation: `You are an expert programmer. Generate clean, production-ready code.

**Requirements:**
- Include proper error handling
- Follow best practices
- Add clear comments
- Use modern syntax
- Optimize performance`,

    code_explanation: `You are a patient teacher. Explain code clearly and thoroughly.

**Guidelines:**
- Start with simple explanations
- Use analogies and examples
- Break down complex topics step-by-step
- Highlight important concepts
- Encourage questions`,

    debugging: `You are a debugging expert. Find issues and provide solutions.

**Approach:**
- Identify all potential bugs
- Explain why they occur
- Provide fixed code
- Suggest prevention tips
- Test edge cases`,

    optimization: `You are a performance optimization expert.

**Focus:**
- Identify bottlenecks
- Suggest optimizations
- Provide benchmarks
- Explain trade-offs
- Show before/after code`,

    design: `You are a UI/UX design expert.

**Provide:**
- Modern design principles
- Color schemes (hex codes)
- Typography suggestions
- Layout ideas
- Accessibility tips`
};

// Helper: Detect task type from message
export function detectTaskType(message) {
    const lower = message.toLowerCase();
    
    if (lower.includes('write') || lower.includes('create') || lower.includes('generate')) {
        return 'code_generation';
    }
    if (lower.includes('explain') || lower.includes('what is') || lower.includes('how does')) {
        return 'code_explanation';
    }
    if (lower.includes('review') || lower.includes('check')) {
        return 'code_review';
    }
    if (lower.includes('debug') || lower.includes('fix') || lower.includes('error')) {
        return 'debugging';
    }
    if (lower.includes('optimize') || lower.includes('performance')) {
        return 'optimization';
    }
    if (lower.includes('design') || lower.includes('ui') || lower.includes('ux')) {
        return 'design';
    }
    
    return 'general';
}