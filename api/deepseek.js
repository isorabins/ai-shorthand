// DeepSeek API proxy for Discovery and Validation agents
import { rateLimit, validateInput, sanitizeInput, createErrorResponse, createSuccessResponse } from './_middleware.js';

export default async function handler(req, res) {
    const timestamp = new Date().toISOString();
    const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`🔵 [DEEPSEEK-API] [${timestamp}] [${requestId}] ========== INCOMING REQUEST ==========`);
    console.log(`🔵 [DEEPSEEK-API] [${timestamp}] [${requestId}] Method: ${req.method}`);
    console.log(`🔵 [DEEPSEEK-API] [${timestamp}] [${requestId}] URL: ${req.url}`);
    console.log(`🔵 [DEEPSEEK-API] [${timestamp}] [${requestId}] Headers:`, JSON.stringify(req.headers, null, 2));
    console.log(`🔵 [DEEPSEEK-API] [${timestamp}] [${requestId}] Body:`, JSON.stringify(req.body, null, 2));
    
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        console.log(`🔵 [DEEPSEEK-API] [${timestamp}] [${requestId}] Handling CORS preflight - returning 200`);
        return res.status(200).json({});
    }
    
    // Only allow POST
    if (req.method !== 'POST') {
        console.log(`❌ [DEEPSEEK-API] [${timestamp}] [${requestId}] Method not allowed: ${req.method}`);
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    // Rate limiting
    console.log(`🔵 [DEEPSEEK-API] [${timestamp}] [${requestId}] Checking rate limit for IP: ${req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'localhost'}`);
    if (!rateLimit(req)) {
        console.log(`❌ [DEEPSEEK-API] [${timestamp}] [${requestId}] Rate limit exceeded`);
        return res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
    }
    console.log(`✅ [DEEPSEEK-API] [${timestamp}] [${requestId}] Rate limit check passed`);
    
    try {
        const { messages, temperature = 0.3, max_tokens = 500, agent_type } = req.body;
        
        console.log(`🔵 [DEEPSEEK-API] [${timestamp}] [${requestId}] Extracted request parameters:`);
        console.log(`🔵 [DEEPSEEK-API] [${timestamp}] [${requestId}] - messages: ${messages ? messages.length : 0} messages`);
        console.log(`🔵 [DEEPSEEK-API] [${timestamp}] [${requestId}] - temperature: ${temperature}`);
        console.log(`🔵 [DEEPSEEK-API] [${timestamp}] [${requestId}] - max_tokens: ${max_tokens}`);
        console.log(`🔵 [DEEPSEEK-API] [${timestamp}] [${requestId}] - agent_type: ${agent_type}`);
        
        // Validate input
        console.log(`🔵 [DEEPSEEK-API] [${timestamp}] [${requestId}] Starting input validation...`);
        const validation = validateInput({ messages, agent_type }, {
            messages: { required: true },
            agent_type: { required: true, type: 'string' }
        });
        
        if (!validation.valid) {
            console.log(`❌ [DEEPSEEK-API] [${timestamp}] [${requestId}] Input validation failed:`, validation.errors);
            return res.status(400).json({ error: validation.errors.join(', ') });
        }
        console.log(`✅ [DEEPSEEK-API] [${timestamp}] [${requestId}] Input validation passed`);
        
        if (!Array.isArray(messages) || messages.length === 0) {
            console.log(`❌ [DEEPSEEK-API] [${timestamp}] [${requestId}] Messages validation failed: not array or empty`);
            return res.status(400).json({ error: 'Messages must be a non-empty array' });
        }
        console.log(`✅ [DEEPSEEK-API] [${timestamp}] [${requestId}] Messages array validation passed`);
        
        // Sanitize messages
        console.log(`🔵 [DEEPSEEK-API] [${timestamp}] [${requestId}] Sanitizing ${messages.length} messages...`);
        const sanitizedMessages = messages.map((msg, index) => {
            console.log(`🔵 [DEEPSEEK-API] [${timestamp}] [${requestId}] Message ${index}: role="${msg.role}", content_length=${msg.content ? msg.content.length : 0}`);
            return {
                role: msg.role,
                content: sanitizeInput(msg.content)
            };
        });
        console.log(`✅ [DEEPSEEK-API] [${timestamp}] [${requestId}] Messages sanitized successfully`);
        
        // Call DeepSeek API
        const clampedTemperature = Math.min(Math.max(temperature, 0), 1);
        const clampedMaxTokens = Math.min(max_tokens, 1000);
        
        const apiPayload = {
            model: 'deepseek-chat',
            messages: sanitizedMessages,
            temperature: clampedTemperature,
            max_tokens: clampedMaxTokens,
            stream: false
        };
        
        console.log(`🔵 [DEEPSEEK-API] [${timestamp}] [${requestId}] Calling DeepSeek API...`);
        console.log(`🔵 [DEEPSEEK-API] [${timestamp}] [${requestId}] API Payload:`, JSON.stringify(apiPayload, null, 2));
        console.log(`🔵 [DEEPSEEK-API] [${timestamp}] [${requestId}] API Key exists: ${!!process.env.DEEPSEEK_API_KEY}`);
        console.log(`🔵 [DEEPSEEK-API] [${timestamp}] [${requestId}] API Key length: ${process.env.DEEPSEEK_API_KEY ? process.env.DEEPSEEK_API_KEY.length : 0}`);
        
        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
            },
            body: JSON.stringify(apiPayload)
        });
        
        console.log(`🔵 [DEEPSEEK-API] [${timestamp}] [${requestId}] DeepSeek API Response Status: ${response.status}`);
        console.log(`🔵 [DEEPSEEK-API] [${timestamp}] [${requestId}] DeepSeek API Response Headers:`, JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2));
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.log(`❌ [DEEPSEEK-API] [${timestamp}] [${requestId}] DeepSeek API Error Response:`, JSON.stringify(errorData, null, 2));
            throw new Error(`DeepSeek API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
        }
        
        const data = await response.json();
        console.log(`✅ [DEEPSEEK-API] [${timestamp}] [${requestId}] DeepSeek API Response Data:`, JSON.stringify(data, null, 2));
        
        // Extract response
        console.log(`🔵 [DEEPSEEK-API] [${timestamp}] [${requestId}] Extracting response from API data...`);
        const assistantMessage = data.choices?.[0]?.message?.content;
        
        console.log(`🔵 [DEEPSEEK-API] [${timestamp}] [${requestId}] Assistant message extracted: ${assistantMessage ? assistantMessage.length : 0} characters`);
        console.log(`🔵 [DEEPSEEK-API] [${timestamp}] [${requestId}] Full assistant message:`, assistantMessage);
        
        if (!assistantMessage) {
            console.log(`❌ [DEEPSEEK-API] [${timestamp}] [${requestId}] No response from DeepSeek API - choices data:`, JSON.stringify(data.choices, null, 2));
            throw new Error('No response from DeepSeek API');
        }
        
        // Parse based on agent type
        console.log(`🔵 [DEEPSEEK-API] [${timestamp}] [${requestId}] Parsing response for agent type: ${agent_type}`);
        let parsedResponse;
        if (agent_type === 'discovery') {
            console.log(`🔵 [DEEPSEEK-API] [${timestamp}] [${requestId}] Parsing as discovery agent response...`);
            parsedResponse = parseDiscoveryResponse(assistantMessage);
            console.log(`🔵 [DEEPSEEK-API] [${timestamp}] [${requestId}] Discovery parsing result:`, JSON.stringify(parsedResponse, null, 2));
        } else if (agent_type === 'validation') {
            console.log(`🔵 [DEEPSEEK-API] [${timestamp}] [${requestId}] Parsing as validation agent response...`);
            parsedResponse = parseValidationResponse(assistantMessage);
            console.log(`🔵 [DEEPSEEK-API] [${timestamp}] [${requestId}] Validation parsing result:`, JSON.stringify(parsedResponse, null, 2));
        } else {
            console.log(`🔵 [DEEPSEEK-API] [${timestamp}] [${requestId}] No specific parsing for agent type: ${agent_type}`);
            parsedResponse = { content: assistantMessage };
        }
        
        const finalResponse = {
            response: assistantMessage,
            parsed: parsedResponse,
            usage: data.usage
        };
        
        console.log(`✅ [DEEPSEEK-API] [${timestamp}] [${requestId}] Final response prepared:`, JSON.stringify(finalResponse, null, 2));
        console.log(`✅ [DEEPSEEK-API] [${timestamp}] [${requestId}] ========== REQUEST COMPLETE ==========`);
        
        return res.status(200).json(finalResponse);
        
    } catch (error) {
        console.log(`❌ [DEEPSEEK-API] [${timestamp}] [${requestId}] ========== ERROR OCCURRED ==========`);
        console.error(`❌ [DEEPSEEK-API] [${timestamp}] [${requestId}] Error details:`, error);
        console.error(`❌ [DEEPSEEK-API] [${timestamp}] [${requestId}] Error message:`, error.message);
        console.error(`❌ [DEEPSEEK-API] [${timestamp}] [${requestId}] Error stack:`, error.stack);
        
        // Return appropriate fallback based on agent type
        console.log(`🔵 [DEEPSEEK-API] [${timestamp}] [${requestId}] Getting fallback response for agent type: ${req.body.agent_type}`);
        const fallback = getFallbackResponse(req.body.agent_type);
        console.log(`🔵 [DEEPSEEK-API] [${timestamp}] [${requestId}] Fallback response:`, JSON.stringify(fallback, null, 2));
        
        const fallbackResponse = {
            response: fallback.message,
            parsed: fallback.parsed,
            fallback: true
        };
        
        console.log(`⚠️ [DEEPSEEK-API] [${timestamp}] [${requestId}] Returning fallback response:`, JSON.stringify(fallbackResponse, null, 2));
        console.log(`⚠️ [DEEPSEEK-API] [${timestamp}] [${requestId}] ========== FALLBACK RESPONSE SENT ==========`);
        
        return res.status(200).json(fallbackResponse);
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