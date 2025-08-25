// API Client for communicating with Vercel API routes
window.TokenCompressor = window.TokenCompressor || {};

window.TokenCompressor.APIClient = {
    // Base configuration
    baseURL: '/api',
    
    /**
     * Make API request with error handling and retries
     */
    async request(endpoint, options = {}) {
        const config = window.TokenCompressor.config;
        const url = `${this.baseURL}${endpoint}`;
        
        const defaultOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            ...options
        };
        
        let lastError;
        const maxRetries = config.errorHandling.maxRetries;
        
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                const response = await fetch(url, defaultOptions);
                
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(`API Error ${response.status}: ${errorData.error || 'Unknown error'}`);
                }
                
                const data = await response.json();
                return data;
                
            } catch (error) {
                lastError = error;
                
                if (attempt === maxRetries) {
                    throw await window.TokenCompressor.ErrorHandler.handleError(error, {
                        operation: `api_${endpoint.replace('/', '_')}`,
                        retryCount: attempt
                    });
                }
                
                // Exponential backoff
                const delay = config.errorHandling.retryDelay * Math.pow(2, attempt);
                await this.sleep(delay);
            }
        }
        
        throw lastError;
    },
    
    /**
     * Search for articles using Brave Search
     */
    async search(query, domain = null) {
        return await this.request('/search', {
            method: 'POST',
            body: JSON.stringify({ query, domain })
        });
    },
    
    /**
     * Call DeepSeek API for Discovery or Validation agents
     */
    async deepseek(messages, agentType, options = {}) {
        return await this.request('/deepseek', {
            method: 'POST',
            body: JSON.stringify({
                messages,
                agent_type: agentType,
                temperature: options.temperature || 0.3,
                max_tokens: options.maxTokens || 500
            })
        });
    },
    
    /**
     * Call Groq API for Generation agent
     */
    async groq(messages, options = {}) {
        return await this.request('/groq', {
            method: 'POST',
            body: JSON.stringify({
                messages,
                temperature: options.temperature || 0.7,
                max_tokens: options.maxTokens || 500
            })
        });
    },
    
    /**
     * Tokenize text using tiktoken
     */
    async tokenize(text, encoding = 'cl100k_base') {
        return await this.request('/tokenize', {
            method: 'POST',
            body: JSON.stringify({ text, encoding })
        });
    },
    
    /**
     * Post to Twitter (for ceremony announcements)
     */
    async tweet(compressions, hour, humanWins, aiWins) {
        return await this.request('/twitter', {
            method: 'POST',
            body: JSON.stringify({
                compressions,
                hour,
                humanWins,
                aiWins
            })
        });
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