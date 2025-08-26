// Groq API proxy for Generation agent
import { rateLimit, validateInput, sanitizeInput, createErrorResponse, createSuccessResponse } from './_middleware.js';

export default async function handler(req, res) {
    const timestamp = new Date().toISOString();
    const requestId = `groq-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`🟢 [GROQ-API] [${timestamp}] [${requestId}] ========== INCOMING REQUEST ==========`);
    console.log(`🟢 [GROQ-API] [${timestamp}] [${requestId}] Method: ${req.method}`);
    console.log(`🟢 [GROQ-API] [${timestamp}] [${requestId}] URL: ${req.url}`);
    console.log(`🟢 [GROQ-API] [${timestamp}] [${requestId}] Headers:`, JSON.stringify(req.headers, null, 2));
    console.log(`🟢 [GROQ-API] [${timestamp}] [${requestId}] Body:`, JSON.stringify(req.body, null, 2));
    
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        console.log(`🟢 [GROQ-API] [${timestamp}] [${requestId}] Handling CORS preflight - returning 200`);
        return res.status(200).json({});
    }
    
    // Only allow POST
    if (req.method !== 'POST') {
        console.log(`❌ [GROQ-API] [${timestamp}] [${requestId}] Method not allowed: ${req.method}`);
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    // Rate limiting
    console.log(`🟢 [GROQ-API] [${timestamp}] [${requestId}] Checking rate limit for IP: ${req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'localhost'}`);
    if (!rateLimit(req)) {
        console.log(`❌ [GROQ-API] [${timestamp}] [${requestId}] Rate limit exceeded`);
        return res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
    }
    console.log(`✅ [GROQ-API] [${timestamp}] [${requestId}] Rate limit check passed`);
    
    try {
        const { messages, temperature = 0.7, max_tokens = 500 } = req.body;
        
        console.log(`🟢 [GROQ-API] [${timestamp}] [${requestId}] Extracted request parameters:`);
        console.log(`🟢 [GROQ-API] [${timestamp}] [${requestId}] - messages: ${messages ? messages.length : 0} messages`);
        console.log(`🟢 [GROQ-API] [${timestamp}] [${requestId}] - temperature: ${temperature}`);
        console.log(`🟢 [GROQ-API] [${timestamp}] [${requestId}] - max_tokens: ${max_tokens}`);
        
        // Validate input
        console.log(`🟢 [GROQ-API] [${timestamp}] [${requestId}] Starting input validation...`);
        const validation = validateInput({ messages }, {
            messages: { required: true }
        });
        
        if (!validation.valid) {
            console.log(`❌ [GROQ-API] [${timestamp}] [${requestId}] Input validation failed:`, validation.errors);
            return res.status(400).json({ error: validation.errors.join(', ') });
        }
        console.log(`✅ [GROQ-API] [${timestamp}] [${requestId}] Input validation passed`);
        
        if (!Array.isArray(messages) || messages.length === 0) {
            console.log(`❌ [GROQ-API] [${timestamp}] [${requestId}] Messages validation failed: not array or empty`);
            return res.status(400).json({ error: 'Messages must be a non-empty array' });
        }
        console.log(`✅ [GROQ-API] [${timestamp}] [${requestId}] Messages array validation passed`);
        
        // Sanitize messages
        console.log(`🟢 [GROQ-API] [${timestamp}] [${requestId}] Sanitizing ${messages.length} messages...`);
        const sanitizedMessages = messages.map((msg, index) => {
            console.log(`🟢 [GROQ-API] [${timestamp}] [${requestId}] Message ${index}: role="${msg.role}", content_length=${msg.content ? msg.content.length : 0}`);
            console.log(`🟢 [GROQ-API] [${timestamp}] [${requestId}] Message ${index} content:`, msg.content);
            return {
                role: msg.role,
                content: sanitizeInput(msg.content)
            };
        });
        console.log(`✅ [GROQ-API] [${timestamp}] [${requestId}] Messages sanitized successfully`);
        
        // Call Groq API
        const clampedTemperature = Math.min(Math.max(temperature, 0), 1);
        const clampedMaxTokens = Math.min(max_tokens, 1000);
        
        const apiPayload = {
            model: 'llama3-8b-8192',
            messages: sanitizedMessages,
            temperature: clampedTemperature,
            max_tokens: clampedMaxTokens,
            stream: false
        };
        
        console.log(`🟢 [GROQ-API] [${timestamp}] [${requestId}] Calling Groq API...`);
        console.log(`🟢 [GROQ-API] [${timestamp}] [${requestId}] API Payload:`, JSON.stringify(apiPayload, null, 2));
        console.log(`🟢 [GROQ-API] [${timestamp}] [${requestId}] API Key exists: ${!!process.env.GROQ_API_KEY}`);
        console.log(`🟢 [GROQ-API] [${timestamp}] [${requestId}] API Key length: ${process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.length : 0}`);
        
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
            },
            body: JSON.stringify(apiPayload)
        });
        
        console.log(`🟢 [GROQ-API] [${timestamp}] [${requestId}] Groq API Response Status: ${response.status}`);
        console.log(`🟢 [GROQ-API] [${timestamp}] [${requestId}] Groq API Response Headers:`, JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2));
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.log(`❌ [GROQ-API] [${timestamp}] [${requestId}] Groq API Error Response:`, JSON.stringify(errorData, null, 2));
            throw new Error(`Groq API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
        }
        
        const data = await response.json();
        console.log(`✅ [GROQ-API] [${timestamp}] [${requestId}] Groq API Response Data:`, JSON.stringify(data, null, 2));
        
        // Extract response
        console.log(`🟢 [GROQ-API] [${timestamp}] [${requestId}] Extracting response from API data...`);
        const assistantMessage = data.choices?.[0]?.message?.content;
        
        console.log(`🟢 [GROQ-API] [${timestamp}] [${requestId}] Assistant message extracted: ${assistantMessage ? assistantMessage.length : 0} characters`);
        console.log(`🟢 [GROQ-API] [${timestamp}] [${requestId}] Full assistant message:`, assistantMessage);
        
        if (!assistantMessage) {
            console.log(`❌ [GROQ-API] [${timestamp}] [${requestId}] No response from Groq API - choices data:`, JSON.stringify(data.choices, null, 2));
            throw new Error('No response from Groq API');
        }
        
        // Parse compression suggestions
        console.log(`🟢 [GROQ-API] [${timestamp}] [${requestId}] Parsing compression suggestions from response...`);
        const parsedResponse = parseGenerationResponse(assistantMessage);
        console.log(`🟢 [GROQ-API] [${timestamp}] [${requestId}] Generation parsing result:`, JSON.stringify(parsedResponse, null, 2));
        
        const finalResponse = {
            response: assistantMessage,
            parsed: parsedResponse,
            usage: data.usage
        };
        
        console.log(`✅ [GROQ-API] [${timestamp}] [${requestId}] Final response prepared:`, JSON.stringify(finalResponse, null, 2));
        console.log(`✅ [GROQ-API] [${timestamp}] [${requestId}] ========== REQUEST COMPLETE ==========`);
        
        return res.status(200).json(finalResponse);
        
    } catch (error) {
        console.log(`❌ [GROQ-API] [${timestamp}] [${requestId}] ========== ERROR OCCURRED ==========`);
        console.error(`❌ [GROQ-API] [${timestamp}] [${requestId}] Error details:`, error);
        console.error(`❌ [GROQ-API] [${timestamp}] [${requestId}] Error message:`, error.message);
        console.error(`❌ [GROQ-API] [${timestamp}] [${requestId}] Error stack:`, error.stack);
        
        // Return creative fallback
        console.log(`🟢 [GROQ-API] [${timestamp}] [${requestId}] Getting creative fallback response...`);
        const fallback = getCreativeFallback();
        console.log(`🟢 [GROQ-API] [${timestamp}] [${requestId}] Fallback response:`, JSON.stringify(fallback, null, 2));
        
        const fallbackResponse = {
            response: fallback.message,
            parsed: fallback.parsed,
            fallback: true
        };
        
        console.log(`⚠️ [GROQ-API] [${timestamp}] [${requestId}] Returning fallback response:`, JSON.stringify(fallbackResponse, null, 2));
        console.log(`⚠️ [GROQ-API] [${timestamp}] [${requestId}] ========== FALLBACK RESPONSE SENT ==========`);
        
        return res.status(200).json(fallbackResponse);
    }
}

function parseGenerationResponse(content) {
    const lines = content.split('\n');
    const compressions = [];
    
    for (const line of lines) {
        // Look for patterns like "word → symbol" or "word|symbol"
        const arrowMatch = line.match(/["']?([^"'→|]+)["']?\s*[→|]\s*["']?([^"']+)["']?/);
        if (arrowMatch) {
            const original = arrowMatch[1].trim();
            const compressed = arrowMatch[2].trim();
            
            // Validate it's a reasonable compression
            if (original.length > 2 && compressed.length <= 4 && original !== compressed) {
                compressions.push({ original, compressed });
            }
        }
        
        // Also look for structured suggestions
        if (line.includes(':') && line.length < 100) {
            const colonMatch = line.match(/([^:]+):\s*(.+)/);
            if (colonMatch) {
                const original = colonMatch[1].trim().replace(/['"]/g, '');
                const compressed = colonMatch[2].trim().replace(/['"]/g, '');
                
                if (original.length > 2 && compressed.length <= 4 && original !== compressed) {
                    compressions.push({ original, compressed });
                }
            }
        }
    }
    
    return { compressions };
}

function getCreativeFallback() {
    const symbolPalette = ['~', '≈', '•', '◊', '∿', '†', '§', '¶', '♦', '★'];
    const commonWords = ['approximately', 'implementation', 'unfortunately', 'comprehensive', 'development'];
    
    const compressions = commonWords.map(word => {
        const symbol = symbolPalette[Math.floor(Math.random() * symbolPalette.length)];
        return {
            original: word,
            compressed: `${symbol}${word.substring(0, 2)}`
        };
    });
    
    return {
        message: `Creative compression ideas: ${compressions.map(c => `"${c.original}" → "${c.compressed}"`).join(', ')}`,
        parsed: { compressions: compressions.slice(0, 3) } // Return first 3
    };
}