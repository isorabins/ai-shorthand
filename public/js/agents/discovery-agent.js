/**
 * DISCOVERY AGENT - The Web Search & Token Analysis Specialist
 * 
 * WHAT IT DOES:
 * 1. Searches the web for random articles using Brave Search API
 * 2. Analyzes article text to find "wasteful" multi-token words
 * 3. Reports findings to the Generation Agent for compression
 * 
 * EXAMPLE PROCESS:
 * - Searches for "artificial intelligence news" 
 * - Finds article: "The implementation was approximately successful..."
 * - Detects: "implementation" (3 tokens), "approximately" (4 tokens)
 * - Reports these as compression candidates
 * 
 * KEY TECHNOLOGIES:
 * - Brave Search API (web search)
 * - tiktoken library (accurate token counting)
 * - DeepSeek AI (text analysis when needed)
 */

window.TokenCompressor = window.TokenCompressor || {};

window.TokenCompressor.DiscoveryAgent = class DiscoveryAgent {
    constructor() {
        // Basic agent properties
        this.name = 'Discovery Agent';
        this.status = 'idle'; // Possible states: idle, searching, analyzing, error
        
        // UI elements for real-time updates
        this.chatElement = document.getElementById('discovery-chat');      // Chat window
        this.statusElement = document.getElementById('discovery-status');  // Status indicator
        
        // System connections
        this.apiClient = window.TokenCompressor.APIClient;                 // API communication
        this.config = window.TokenCompressor.config.agents.discovery;      // Agent settings
        
        // Agent state tracking
        this.currentArticle = null;        // Currently analyzed article
        this.lastSearchTime = 0;           // When we last searched (rate limiting)
        this.searchTopicIndex = 0;         // Cycle through different topics
        this.domainUsageCount = {};        // Track domain usage to avoid over-representation
        this.lastUsedDomains = [];         // Recent domains to avoid repeating
        
        this.updateStatus('idle');
        console.log('🔍 Discovery Agent initialized');
    }
    
    /**
     * MAIN DISCOVERY CYCLE - The core 30-second process
     * 
     * This is called by the Orchestrator every 30 seconds to find new compression candidates.
     * 
     * PROCESS:
     * 1. Search web for random article (Brave Search API)
     * 2. Analyze article text for multi-token words (tiktoken + AI)
     * 3. Return findings to Orchestrator for Generation Agent
     * 
     * RETURNS: { wastefulWords: [{ word: "approximately", tokens: 4, frequency: 2 }] }
     */
    async runDiscoveryCycle() {
        try {
            // STEP 1: Search for article
            this.updateStatus('searching');
            
            const article = await this.searchForArticle();
            if (!article) {
                throw new Error('No article found');
            }
            
            // Show what we found
            this.addMessage(`📄 Found: "${article.title}"`);
            this.addMessage(`🔍 Analyzing ${article.content.length} characters for token waste...`);
            
            // STEP 2: Analyze article for wasteful words
            this.updateStatus('analyzing');
            
            const analysis = await this.analyzeArticle(article.content);
            
            // STEP 3: Report results
            if (analysis.wastefulWords.length > 0) {
                this.addMessage(`💡 Discovered ${analysis.wastefulWords.length} multi-token words:`);
                
                // Show top findings in chat
                const topWords = analysis.wastefulWords.slice(0, 3);
                topWords.forEach(word => {
                    this.addMessage(`  • "${word.word}" uses ${word.tokens} tokens (${word.frequency}x)`);
                });
                
                this.updateStatus('idle');
                return analysis; // Send to Generation Agent
                
            } else {
                this.addMessage(`😔 No significant multi-token words found in this article`);
                this.updateStatus('idle');
                return { wastefulWords: [] }; // Nothing found
            }
            
        } catch (error) {
            // Handle errors gracefully - system keeps running
            this.updateStatus('error');
            this.addMessage(`❌ Discovery error: ${error.message}`);
            
            // Use fallback data so system doesn't stop
            return this.getFallbackAnalysis();
        }
    }
    
    /**
     * Search for random article using Brave Search with domain balancing
     */
    async searchForArticle() {
        const searchTopic = this.apiClient.getRandomSearchTopic();
        const searchDomain = this.getBalancedSearchDomain();
        
        try {
            this.addMessage(`🔎 Searching: "${searchTopic}" ${searchDomain || '(general web)'}`);
            
            const result = await this.apiClient.search(searchTopic, searchDomain);
            
            if (result.articles && result.articles.length > 0) {
                const article = result.articles[0];
                this.currentArticle = article;
                
                // Track domain usage for balancing
                this.trackDomainUsage(searchDomain);
                
                return article;
            }
            
            throw new Error('No articles returned from search');
            
        } catch (error) {
            console.warn('Search failed, using fallback:', error.message);
            return this.getFallbackArticle();
        }
    }
    
    /**
     * Analyze article content for multi-token words
     * ENHANCED: Focus on mathematical symbol compression targets
     */
    async analyzeArticle(content) {
        try {
            // First, get accurate token analysis
            const tokenAnalysis = await this.apiClient.tokenize(content);
            
            if (tokenAnalysis.multiTokenWords && tokenAnalysis.multiTokenWords.length > 0) {
                // Calculate actual frequency in the text
                const wordFrequency = this.calculateWordFrequency(content);
                
                // Enhanced analysis focusing on mathematical symbol targets
                const enhancedWords = tokenAnalysis.multiTokenWords
                    .map(word => ({
                        word: word.word,
                        tokens: word.tokens,
                        frequency: wordFrequency[word.word.toLowerCase()] || 1,
                        isHighValue: this.isHighValueCompressionTarget(word.word, word.tokens),
                        compressionPotential: (word.tokens - 1) * (wordFrequency[word.word.toLowerCase()] || 1)
                    }))
                    .filter(w => w.word.length > 2) // Filter short words
                    .sort((a, b) => b.compressionPotential - a.compressionPotential); // Sort by potential savings
                
                this.addMessage(`📊 Found ${enhancedWords.length} multi-token words, top savings: ${enhancedWords.slice(0, 3).map(w => `${w.word}(${w.compressionPotential})`).join(', ')}`);
                
                return {
                    wastefulWords: enhancedWords.slice(0, 10), // Top 10 targets
                    symbolValidation: tokenAnalysis.symbolValidation, // Pass through symbol info
                    totalPotentialSavings: enhancedWords.reduce((sum, w) => sum + w.compressionPotential, 0)
                };
            }
            
            // Fallback: Use AI analysis with enhanced prompting
            return await this.analyzeWithAI(content);
            
        } catch (error) {
            console.warn('Tokenization failed, using AI analysis:', error.message);
            return await this.analyzeWithAI(content);
        }
    }

    /**
     * Calculate word frequency in text content
     */
    calculateWordFrequency(content) {
        const words = content.toLowerCase()
            .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
            .split(/\s+/)
            .filter(word => word.length > 2); // Filter short words
        
        const frequency = {};
        words.forEach(word => {
            frequency[word] = (frequency[word] || 0) + 1;
        });
        
        return frequency;
    }

    /**
     * Determine if a word is a high-value compression target
     */
    isHighValueCompressionTarget(word, tokens) {
        // High-value words for mathematical symbol compression
        const highValuePatterns = [
            // Long words that commonly appear
            /unfortunately|implementation|comprehensive|approximately|development|infrastructure/i,
            // Technical terms
            /configuration|optimization|initialization|documentation|integration/i,
            // Business terms  
            /organization|management|performance|environment|communication/i,
            // Suffix patterns that work well with mathematical symbols
            /.*tion$|.*ment$|.*ness$|.*able$|.*ized$/i
        ];
        
        return tokens >= 2 && highValuePatterns.some(pattern => pattern.test(word));
    }
    
    /**
     * Use AI to analyze text for token waste
     * ENHANCED: Focus on mathematical symbol compression candidates
     */
    async analyzeWithAI(content) {
        const systemPrompt = this.apiClient.getSystemPrompt('discovery');
        const userPrompt = `<analysis_request>
Analyze this text for multi-token words that are perfect candidates for mathematical symbol compression:

"${content.substring(0, 1500)}"

ENHANCED FOCUS on words that:
1. Use 2+ tokens when tokenized (verified multi-token words)
2. Are high-frequency in business/technical writing
3. Can be compressed with mathematical symbols (∂, ∫, ∑, α, β, etc.)
4. Follow context-safe patterns (never naturally preceded by math symbols)

HIGH-VALUE TARGETS include:
- Words ending in -tion, -ment, -ness, -able, -ized
- Technical terms: implementation, configuration, optimization
- Business terms: unfortunately, approximately, comprehensive
- Development terms: infrastructure, documentation, integration

MATHEMATICAL SYMBOL INSIGHT: Mathematical symbols (∂, ∫, ∑) never naturally precede English words, making them perfect unambiguous compression markers.

Provide your analysis prioritizing words with highest token savings potential.
</analysis_request>`;

        const messages = [
            this.apiClient.createAgentMessage('system', systemPrompt),
            this.apiClient.createAgentMessage('user', userPrompt)
        ];
        
        const response = await this.apiClient.deepseek(messages, 'discovery');
        
        if (response.parsed && response.parsed.wastefulWords) {
            return response.parsed;
        }
        
        // Parse manually if needed
        return this.parseDiscoveryResponse(response.response);
    }
    
    /**
     * Get balanced search domain to avoid over-representation
     */
    getBalancedSearchDomain() {
        const domains = window.TokenCompressor.config.searchDomains;
        
        // Find domains that haven't been used recently or have low usage
        const availableDomains = domains.filter(domain => {
            const usageCount = this.domainUsageCount[domain] || 0;
            const recentlyUsed = this.lastUsedDomains.includes(domain);
            
            // Prefer domains with low usage and not recently used
            return usageCount < 3 && !recentlyUsed;
        });
        
        // If all domains are overused, reset counters and use any domain
        if (availableDomains.length === 0) {
            this.domainUsageCount = {};
            this.lastUsedDomains = [];
            return domains[Math.floor(Math.random() * domains.length)];
        }
        
        // Choose randomly from available domains
        return availableDomains[Math.floor(Math.random() * availableDomains.length)];
    }
    
    /**
     * Track domain usage for balancing
     */
    trackDomainUsage(domain) {
        if (!domain) return; // Skip empty domains (general searches)
        
        // Increment usage count
        this.domainUsageCount[domain] = (this.domainUsageCount[domain] || 0) + 1;
        
        // Add to recent domains list
        this.lastUsedDomains.push(domain);
        
        // Keep only last 5 recent domains
        if (this.lastUsedDomains.length > 5) {
            this.lastUsedDomains.shift();
        }
        
        // Log for monitoring
        this.addMessage(`📊 Domain balance: ${domain} used ${this.domainUsageCount[domain]} times`);
    }
    
    /**
     * Parse AI response for multi-token words
     */
    parseDiscoveryResponse(responseText) {
        const lines = responseText.split('\n');
        const words = [];
        
        for (const line of lines) {
            // Look for format: "word"|tokens|frequency
            if (line.includes('|')) {
                const parts = line.split('|').map(p => p.trim().replace(/['"]/g, ''));
                if (parts.length >= 3) {
                    const word = parts[0];
                    const tokens = parseInt(parts[1]) || 2;
                    const frequency = parseInt(parts[2]) || 1;
                    
                    if (word && word.length > 2 && tokens > 1) {
                        words.push({ word, tokens, frequency });
                    }
                }
            }
        }
        
        return { wastefulWords: words };
    }
    
    /**
     * Add message to agent chat window
     */
    addMessage(content) {
        if (!this.chatElement) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message discovery';
        messageDiv.innerHTML = `
            <div class="message-header">[Discovery Agent - ${new Date().toLocaleTimeString()}]</div>
            <div>${content}</div>
        `;
        
        this.chatElement.appendChild(messageDiv);
        this.chatElement.scrollTop = this.chatElement.scrollHeight;
        
        // Limit message history
        const messages = this.chatElement.querySelectorAll('.message');
        const maxMessages = window.TokenCompressor.config.ui.maxChatMessages;
        
        if (messages.length > maxMessages) {
            const messagesToRemove = messages.length - maxMessages;
            for (let i = 0; i < messagesToRemove; i++) {
                messages[i].remove();
            }
        }
    }
    
    /**
     * Update agent status
     */
    updateStatus(status) {
        this.status = status;
        
        if (this.statusElement) {
            this.statusElement.className = `agent-status ${status}`;
        }
        
        // Update window visual state
        const window = document.getElementById('discovery-agent-window');
        if (window) {
            window.className = `agent-window ${status === 'searching' || status === 'analyzing' ? 'discovery-active' : ''}`;
        }
    }
    
    /**
     * Get fallback article when search fails - ENHANCED with diverse content
     */
    getFallbackArticle() {
        const articles = [
            {
                title: 'AI Research Developments',
                content: `Artificial intelligence research continues to advance rapidly, with new developments in machine learning algorithms and neural network architectures. The implementation of transformer models has revolutionized natural language processing capabilities. Researchers are approximately certain that these advances will accelerate further. Unfortunately, computational requirements remain substantial, requiring significant infrastructure investments for large-scale deployment.`,
                url: 'https://example.com/ai-research',
                published: 'recent',
                domain: 'tech'
            },
            {
                title: 'Cooking Recipe Innovation Techniques',
                content: `Professional chefs are continuously developing innovative cooking techniques to enhance flavor profiles and presentation. The implementation of molecular gastronomy has revolutionized fine dining experiences worldwide. Unfortunately, many home cooks find these techniques intimidating and complex. The development of simplified methods has made gourmet cooking more accessible to amateur enthusiasts. Comprehensive recipe databases now provide step-by-step guidance for complex preparations.`,
                url: 'https://example.com/cooking-innovation',
                published: 'recent',
                domain: 'lifestyle'
            },
            {
                title: 'Global Economic Market Analysis',
                content: `Financial markets are experiencing unprecedented volatility due to various geopolitical factors. The implementation of new regulatory frameworks has influenced trading strategies significantly. Unfortunately, market predictions remain challenging despite advanced analytical tools. Investment professionals are approximately doubling their research efforts to understand emerging patterns. Comprehensive market analysis requires examination of multiple economic indicators simultaneously.`,
                url: 'https://example.com/market-analysis',
                published: 'recent',
                domain: 'business'
            },
            {
                title: 'Travel Destination Guide Updates',
                content: `Popular travel destinations are implementing comprehensive safety protocols to accommodate international visitors. The development of sustainable tourism practices has become increasingly important for environmental conservation. Unfortunately, many popular destinations are experiencing overtourism challenges. Travel professionals are approximately seeing increased demand for authentic local experiences. Comprehensive travel guides now incorporate cultural sensitivity and environmental awareness information.`,
                url: 'https://example.com/travel-guide',
                published: 'recent',
                domain: 'lifestyle'
            },
            {
                title: 'Medical Research Breakthrough Discoveries',
                content: `Medical researchers have made significant breakthroughs in understanding complex disease mechanisms. The implementation of personalized medicine approaches has shown promising results in clinical trials. Unfortunately, many potential treatments remain years away from widespread availability. Comprehensive patient data analysis has revealed new therapeutic opportunities. The development of targeted therapies has revolutionized cancer treatment protocols significantly.`,
                url: 'https://example.com/medical-research',
                published: 'recent',
                domain: 'science'
            },
            {
                title: 'Community Organization Event Planning',
                content: `Community organizations are implementing innovative approaches to engage local residents in meaningful activities. The development of inclusive programming has strengthened neighborhood connections significantly. Unfortunately, funding challenges continue to limit program expansion opportunities. Comprehensive event planning requires coordination between multiple stakeholder groups. The implementation of digital tools has streamlined volunteer management and communication processes.`,
                url: 'https://example.com/community-events',
                published: 'recent',
                domain: 'social'
            }
        ];
        
        return articles[Math.floor(Math.random() * articles.length)];
    }
    
    /**
     * Get fallback analysis when all methods fail - Use diverse random words
     */
    getFallbackAnalysis() {
        const diverseFallbackWords = [
            { word: 'extraordinary', tokens: 2, frequency: 1 },
            { word: 'manufacturing', tokens: 2, frequency: 1 }, 
            { word: 'constitutional', tokens: 2, frequency: 1 },
            { word: 'environmental', tokens: 2, frequency: 1 },
            { word: 'international', tokens: 2, frequency: 1 },
            { word: 'transportation', tokens: 2, frequency: 1 },
            { word: 'revolutionary', tokens: 2, frequency: 1 },
            { word: 'semiconductor', tokens: 2, frequency: 1 },
            { word: 'collaboration', tokens: 2, frequency: 1 },
            { word: 'investigation', tokens: 2, frequency: 1 }
        ];
        
        // Return random selection of 3-4 words
        const shuffled = diverseFallbackWords.sort(() => 0.5 - Math.random());
        return {
            wastefulWords: shuffled.slice(0, 3 + Math.floor(Math.random() * 2))
        };
    }
    
    /**
     * Get agent performance stats
     */
    getStats() {
        return {
            name: this.name,
            status: this.status,
            lastSearchTime: this.lastSearchTime,
            currentArticle: this.currentArticle?.title || null
        };
    }
};

console.log('🔍 Discovery Agent class loaded');