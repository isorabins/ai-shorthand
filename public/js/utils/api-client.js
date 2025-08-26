// API Client for communicating with Vercel API routes
window.TokenCompressor = window.TokenCompressor || {};

window.TokenCompressor.APIClient = {
    // Base configuration
    baseURL: '/api',
    
    /**
     * Make API request with error handling and retries
     */
    async request(endpoint, options = {}) {
        const timestamp = new Date().toISOString();
        const requestId = `api-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        console.log(`🔵 [API-CLIENT] [${timestamp}] [${requestId}] ========== API REQUEST START ==========`);
        console.log(`🔵 [API-CLIENT] [${timestamp}] [${requestId}] Endpoint: ${endpoint}`);
        console.log(`🔵 [API-CLIENT] [${timestamp}] [${requestId}] Method: ${options.method || 'POST'}`);
        console.log(`🔵 [API-CLIENT] [${timestamp}] [${requestId}] Options:`, JSON.stringify(options, null, 2));
        
        const config = window.TokenCompressor.config;
        const url = `${this.baseURL}${endpoint}`;
        
        console.log(`🔵 [API-CLIENT] [${timestamp}] [${requestId}] Full URL: ${url}`);
        
        const defaultOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            ...options
        };
        
        console.log(`🔵 [API-CLIENT] [${timestamp}] [${requestId}] Final options:`, JSON.stringify(defaultOptions, null, 2));
        
        let lastError;
        const maxRetries = config.errorHandling.maxRetries;
        console.log(`🔵 [API-CLIENT] [${timestamp}] [${requestId}] Max retries configured: ${maxRetries}`);
        
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            console.log(`🔵 [API-CLIENT] [${timestamp}] [${requestId}] Attempt ${attempt + 1}/${maxRetries + 1}`);
            
            try {
                console.log(`🔵 [API-CLIENT] [${timestamp}] [${requestId}] Making fetch request...`);
                const response = await fetch(url, defaultOptions);
                
                console.log(`🔵 [API-CLIENT] [${timestamp}] [${requestId}] Response status: ${response.status}`);
                console.log(`🔵 [API-CLIENT] [${timestamp}] [${requestId}] Response headers:`, JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2));
                
                if (!response.ok) {
                    console.log(`❌ [API-CLIENT] [${timestamp}] [${requestId}] Response not OK, parsing error...`);
                    const errorData = await response.json().catch(() => ({}));
                    console.log(`❌ [API-CLIENT] [${timestamp}] [${requestId}] Error data:`, JSON.stringify(errorData, null, 2));
                    throw new Error(`API Error ${response.status}: ${errorData.error || 'Unknown error'}`);
                }
                
                console.log(`🔵 [API-CLIENT] [${timestamp}] [${requestId}] Parsing successful response...`);
                const data = await response.json();
                console.log(`✅ [API-CLIENT] [${timestamp}] [${requestId}] Response data:`, JSON.stringify(data, null, 2));
                console.log(`✅ [API-CLIENT] [${timestamp}] [${requestId}] ========== API REQUEST SUCCESS ==========`);
                return data;
                
            } catch (error) {
                console.log(`❌ [API-CLIENT] [${timestamp}] [${requestId}] Error on attempt ${attempt + 1}:`, error);
                console.log(`❌ [API-CLIENT] [${timestamp}] [${requestId}] Error message:`, error.message);
                console.log(`❌ [API-CLIENT] [${timestamp}] [${requestId}] Error stack:`, error.stack);
                
                lastError = error;
                
                if (attempt === maxRetries) {
                    console.log(`❌ [API-CLIENT] [${timestamp}] [${requestId}] Max retries exceeded, calling error handler`);
                    throw await window.TokenCompressor.ErrorHandler.handleError(error, {
                        operation: `api_${endpoint.replace('/', '_')}`,
                        retryCount: attempt
                    });
                }
                
                // Exponential backoff
                const delay = config.errorHandling.retryDelay * Math.pow(2, attempt);
                console.log(`🔵 [API-CLIENT] [${timestamp}] [${requestId}] Waiting ${delay}ms before retry...`);
                await this.sleep(delay);
            }
        }
        
        console.log(`❌ [API-CLIENT] [${timestamp}] [${requestId}] ========== API REQUEST FAILED ==========`);
        throw lastError;
    },
    
    /**
     * Search for articles using Brave Search
     */
    async search(query, domain = null) {
        console.log(`🔍 [API-CLIENT] search() called with query: "${query}", domain: "${domain}"`);
        const result = await this.request('/search', {
            method: 'POST',
            body: JSON.stringify({ query, domain })
        });
        console.log(`🔍 [API-CLIENT] search() result:`, result?.articles ? `${result.articles.length} articles found` : 'no articles');
        return result;
    },
    
    /**
     * Call DeepSeek API for Discovery or Validation agents
     */
    async deepseek(messages, agentType, options = {}) {
        console.log(`🤖 [API-CLIENT] deepseek() called for agent: ${agentType}`);
        console.log(`🤖 [API-CLIENT] deepseek() messages: ${messages.length} messages`);
        console.log(`🤖 [API-CLIENT] deepseek() options:`, options);
        const result = await this.request('/deepseek', {
            method: 'POST',
            body: JSON.stringify({
                messages,
                agent_type: agentType,
                temperature: options.temperature || 0.3,
                max_tokens: options.maxTokens || 500
            })
        });
        console.log(`🤖 [API-CLIENT] deepseek() result:`, result?.response ? `${result.response.length} chars` : 'no response');
        return result;
    },
    
    /**
     * Call Groq API for Generation agent
     */
    async groq(messages, options = {}) {
        console.log(`🎨 [API-CLIENT] groq() called with ${messages.length} messages`);
        console.log(`🎨 [API-CLIENT] groq() options:`, options);
        const result = await this.request('/groq', {
            method: 'POST',
            body: JSON.stringify({
                messages,
                temperature: options.temperature || 0.7,
                max_tokens: options.maxTokens || 500
            })
        });
        console.log(`🎨 [API-CLIENT] groq() result:`, result?.response ? `${result.response.length} chars` : 'no response');
        return result;
    },
    
    /**
     * Tokenize text using tiktoken
     */
    async tokenize(text, encoding = 'cl100k_base') {
        console.log(`🔢 [API-CLIENT] tokenize() called with text: ${text.length} chars, encoding: ${encoding}`);
        const result = await this.request('/tokenize', {
            method: 'POST',
            body: JSON.stringify({ text, encoding })
        });
        console.log(`🔢 [API-CLIENT] tokenize() result:`, result?.tokens ? `${result.tokens} tokens` : 'no token count');
        return result;
    },
    
    /**
     * Post to Twitter (for ceremony announcements)
     */
    async tweet(compressions, hour, humanWins, aiWins) {
        console.log(`🐦 [API-CLIENT] tweet() called for hour ${hour}: ${compressions.length} compressions, H:${humanWins} vs AI:${aiWins}`);
        const result = await this.request('/twitter', {
            method: 'POST',
            body: JSON.stringify({
                compressions,
                hour,
                humanWins,
                aiWins
            })
        });
        console.log(`🐦 [API-CLIENT] tweet() result:`, result?.success ? 'SUCCESS' : 'FAILED');
        return result;
    },
    
    /**
     * Sleep utility for delays
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },
    
    /**
     * Check if we're online
     */
    isOnline() {
        return navigator.onLine;
    },
    
    /**
     * Get random search query from config
     */
    getRandomSearchTopic() {
        const topics = window.TokenCompressor.config.searchTopics;
        return topics[Math.floor(Math.random() * topics.length)];
    },
    
    /**
     * Get random search domain from config
     */
    getRandomSearchDomain() {
        const domains = window.TokenCompressor.config.searchDomains;
        return domains[Math.floor(Math.random() * domains.length)];
    },
    
    /**
     * Create agent message for API calls
     */
    createAgentMessage(role, content) {
        return {
            role: role, // 'system', 'user', 'assistant'
            content: content
        };
    },
    
    /**
     * Create system prompt for different agent types
     */
    getSystemPrompt(agentType) {
        switch (agentType) {
            case 'discovery':
                return `<instructions>
You are a Discovery Agent specializing in finding token-inefficient words in text. 
Your job is to identify words that use multiple tokens when they could potentially be compressed to single tokens.
</instructions>

<context>
You're analyzing text content to find opportunities for token compression. 
Multi-token words are those that tokenizers split into multiple pieces, costing more in API calls.
Focus on common words that appear frequently and use 2-3+ tokens.
</context>

<output_format>
For each multi-token word found, respond with:
"word"|tokens|frequency

Example:
"approximately"|3|2
"implementation"|3|1
"unfortunately"|3|1
</output_format>`;

            case 'generation':
                return `<instructions>
You are a Generation Agent that creates innovative compression symbols for multi-token words.
Be creative and inventive - use mathematical symbols, Unicode characters, and short abbreviations.
Each compression MUST result in exactly 1 token when processed by tokenizers.
</instructions>

<context>
You receive lists of wasteful multi-token words and must invent creative compressions.
Consider: mathematical symbols (≈, ∿, †), short prefixes (~, •), and memorable abbreviations.
Avoid conflicts with existing compressions and ensure reversibility.
</context>

<output_format>
For each word, suggest a compression:
"original" → "compressed"

Example:
"approximately" → "≈"
"implementation" → "~impl"
"unfortunately" → "†unf"
</output_format>`;

            case 'validation':
                return `<instructions>
You are a Validation Agent that tests compression reversibility with 100% accuracy.
Test each compression by applying it to sentences, then reversing it.
Only approve compressions that maintain perfect semantic meaning.
</instructions>

<context>
You test compressions on diverse text samples to ensure they work in all contexts.
A compression is valid only if: original → compressed → original produces identical text.
Reject compressions that create ambiguity or context-dependent interpretations.
</context>

<output_format>
For each tested compression:
✅ "original" → "compressed" (valid)
❌ "original" → "compressed" (invalid: reason)

Example:
✅ "approximately" → "≈" (valid)
❌ "the" → "†" (invalid: conflicts with other uses)
</output_format>`;

            default:
                return 'You are a helpful AI assistant working on text compression tasks.';
        }
    }
};

console.log('🔗 API Client initialized');