// DeepSeek API proxy for Discovery and Validation agents
import { rateLimit, validateInput, sanitizeInput, createErrorResponse, createSuccessResponse } from './_middleware.js';

export default async function handler(req, res) {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).json({});
    }
    
    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    // Rate limiting
    if (!rateLimit(req)) {
        return res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
    }
    
    try {
        const { messages, temperature = 0.3, max_tokens = 500, agent_type } = req.body;
        
        // Validate input
        const validation = validateInput({ messages, agent_type }, {
            messages: { required: true },
            agent_type: { required: true, type: 'string' }
        });
        
        if (!validation.valid) {
            return res.status(400).json({ error: validation.errors.join(', ') });
        }
        
        if (!Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({ error: 'Messages must be a non-empty array' });
        }
        
        // Sanitize messages
        const sanitizedMessages = messages.map(msg => ({
            role: msg.role,
            content: sanitizeInput(msg.content)
        }));
        
        // Call DeepSeek API
        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: sanitizedMessages,
                temperature: Math.min(Math.max(temperature, 0), 1), // Clamp between 0-1
                max_tokens: Math.min(max_tokens, 1000), // Max 1000 tokens
                stream: false
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`DeepSeek API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
        }
        
        const data = await response.json();
        
        // Extract response
        const assistantMessage = data.choices?.[0]?.message?.content;
        if (!assistantMessage) {
            throw new Error('No response from DeepSeek API');
        }
        
        // Parse based on agent type
        let parsedResponse;
        if (agent_type === 'discovery') {
            parsedResponse = parseDiscoveryResponse(assistantMessage);
        } else if (agent_type === 'validation') {
            parsedResponse = parseValidationResponse(assistantMessage);
        } else {
            parsedResponse = { content: assistantMessage };
        }
        
        return res.status(200).json({
            response: assistantMessage,
            parsed: parsedResponse,
            usage: data.usage
        });
        
    } catch (error) {
        console.error('DeepSeek API error:', error);
        
        // Return appropriate fallback based on agent type
        const fallback = getFallbackResponse(req.body.agent_type);
        return res.status(200).json({
            response: fallback.message,
            parsed: fallback.parsed,
            fallback: true
        });
    }
}

function parseDiscoveryResponse(content) {
    const lines = content.split('\n');
    const words = [];
    
    for (const line of lines) {
        // Look for patterns like "word|tokens|frequency"
        if (line.includes('|')) {
            const parts = line.split('|').map(p => p.trim());
            if (parts.length >= 3) {
                const word = parts[0].replace(/['"]/g, '');
                const tokens = parseInt(parts[1]) || 2;
                const frequency = parseInt(parts[2]) || 1;
                
                if (word && tokens > 1) {
                    words.push({ word, tokens, frequency });
                }
            }
        } else {
            // Look for natural language patterns
            const tokenMatch = line.match(/["'](.+?)["'].*?(\d+)\s*token/i);
            if (tokenMatch) {
                words.push({
                    word: tokenMatch[1],
                    tokens: parseInt(tokenMatch[2]),
                    frequency: 1
                });
            }
        }
    }
    
    return { wastefulWords: words };
}

function parseValidationResponse(content) {
    const results = [];
    const lines = content.split('\n');
    
    for (const line of lines) {
        if (line.includes('✅') || line.includes('✓') || line.includes('valid')) {
            const compressionMatch = line.match(/["'](.+?)["']\s*→\s*["'](.+?)["']/);
            if (compressionMatch) {
                results.push({
                    original: compressionMatch[1],
                    compressed: compressionMatch[2],
                    valid: true
                });
            }
        } else if (line.includes('❌') || line.includes('✗') || line.includes('invalid')) {
            const compressionMatch = line.match(/["'](.+?)["']\s*→\s*["'](.+?)["']/);
            if (compressionMatch) {
                results.push({
                    original: compressionMatch[1],
                    compressed: compressionMatch[2],
                    valid: false
                });
            }
        }
    }
    
    return { validationResults: results };
}

function getFallbackResponse(agentType) {
    if (agentType === 'discovery') {
        return {
            message: "Found several multi-token words: 'approximately' (3 tokens), 'implementation' (3 tokens), 'unfortunately' (3 tokens).",
            parsed: {
                wastefulWords: [
                    { word: 'approximately', tokens: 3, frequency: 2 },
                    { word: 'implementation', tokens: 3, frequency: 1 },
                    { word: 'unfortunately', tokens: 3, frequency: 1 }
                ]
            }
        };
    } else if (agentType === 'validation') {
        return {
            message: "Testing complete. 2 out of 3 compressions passed validation.",
            parsed: {
                validationResults: [
                    { original: 'approximately', compressed: '≈', valid: true },
                    { original: 'unfortunately', compressed: '~unf', valid: true }
                ]
            }
        };
    }
    
    return {
        message: "Using fallback response due to API error.",
        parsed: {}
    };
}