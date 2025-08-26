// Groq API proxy for Generation agent
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
        const { messages, temperature = 0.7, max_tokens = 500 } = req.body;
        
        // Validate input
        const validation = validateInput({ messages }, {
            messages: { required: true }
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
        
        // Call Groq API
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: 'llama3-8b-8192',
                messages: sanitizedMessages,
                temperature: Math.min(Math.max(temperature, 0), 1), // Clamp between 0-1
                max_tokens: Math.min(max_tokens, 1000), // Max 1000 tokens
                stream: false
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Groq API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
        }
        
        const data = await response.json();
        
        // Extract response
        const assistantMessage = data.choices?.[0]?.message?.content;
        if (!assistantMessage) {
            throw new Error('No response from Groq API');
        }
        
        // Parse compression suggestions
        const parsedResponse = parseGenerationResponse(assistantMessage);
        
        return res.status(200).json({
            response: assistantMessage,
            parsed: parsedResponse,
            usage: data.usage
        });
        
    } catch (error) {
        console.error('Groq API error:', error);
        
        // Return creative fallback
        const fallback = getCreativeFallback();
        return res.status(200).json({
            response: fallback.message,
            parsed: fallback.parsed,
            fallback: true
        });
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