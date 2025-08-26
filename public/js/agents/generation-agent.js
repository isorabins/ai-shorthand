/**
 * GENERATION AGENT - The Creative Compression Inventor
 * 
 * WHAT IT DOES:
 * 1. Takes wasteful words from Discovery Agent
 * 2. Invents creative ways to compress them (symbols, abbreviations)
 * 3. Uses advanced AI prompting to maintain creativity and meaning
 * 
 * EXAMPLE PROCESS:
 * - Gets: "approximately" (4 tokens)
 * - Thinks: "Mathematical approximation symbol..."
 * - Creates: "approximately" → "≈" (1 token, saves 3 tokens)
 * 
 * CREATIVITY TECHNIQUES:
 * - Unicode symbols (≈, ∴, ∵, →, ∆)
 * - Creative abbreviations 
 * - Context-aware shortcuts
 * - Extended thinking with <thinking> tags
 * 
 * KEY TECHNOLOGIES:
 * - Groq API (fast, creative responses)
 * - XML-structured prompts (Claude best practices)
 * - Symbol palette for consistent creativity
 */

window.TokenCompressor = window.TokenCompressor || {};

window.TokenCompressor.GenerationAgent = class GenerationAgent {
    constructor() {
        // Basic agent properties
        this.name = 'Generation Agent';
        this.status = 'idle'; // Possible states: idle, thinking, generating, collaborating, error
        
        // UI elements for real-time updates
        this.chatElement = document.getElementById('generation-chat');      // Chat window
        this.statusElement = document.getElementById('generation-status');  // Status indicator
        
        // System connections
        this.apiClient = window.TokenCompressor.APIClient;                 // API communication
        this.config = window.TokenCompressor.config.agents.generation;     // Agent settings
        
        // Agent memory and context
        this.currentCodex = new Map();        // Track existing compressions to avoid duplicates
        this.conversationContext = [];        // Remember conversation with Discovery Agent
        this.compressionHistory = [];         // All compressions this session
        
        this.updateStatus('idle');
        console.log('🎨 Generation Agent initialized');
    }
    
    /**
     * Generate compressions for wasteful words with creative thinking
     * ENHANCED: Load full agent context including 686 existing compressions
     */
    async generateCompressions(wastefulWords, existingCodex = {}) {
        if (!wastefulWords || wastefulWords.length === 0) {
            this.addMessage('🤔 No wasteful words to compress');
            return { compressions: [] };
        }
        
        this.updateStatus('thinking');
        this.addMessage(`🎨 Received ${wastefulWords.length} words for compression...`);
        this.addMessage('🧠 Loading agent context from learning system...');
        
        try {
            // PHASE 4: Load comprehensive agent context (prevents repeating work!)
            const agentContext = await this.loadAgentContext();
            
            this.addMessage(`📚 Loaded ${Object.keys(agentContext.existingCompressions).length} existing compressions`);
            this.addMessage(`🎯 Found ${Object.keys(agentContext.learningPatterns).length} successful patterns`);
            this.addMessage(`❌ Avoiding ${agentContext.recentFailures.length} recent failures`);
            
            // Update current codex knowledge with comprehensive context
            this.currentCodex = new Map(Object.entries({
                ...existingCodex,
                ...agentContext.existingCompressions
            }));
            this.agentContext = agentContext;
            
            // Filter out words that already have compressions (avoid duplicate work!)
            const newWords = wastefulWords.filter(word => 
                !this.currentCodex.has(word.word.toLowerCase()) && 
                !agentContext.existingCompressions[word.word.toLowerCase()]
            );
            
            if (newWords.length < wastefulWords.length) {
                const filtered = wastefulWords.length - newWords.length;
                this.addMessage(`⚡ Filtered out ${filtered} words that already have compressions`);
            }
            
            if (newWords.length === 0) {
                this.addMessage('✅ All words already have compressions! No new work needed.');
                return { compressions: [] };
            }
            
            this.addMessage(`🎯 Processing ${newWords.length} new words for compression...`);
            
            // Create comprehensive prompt following best practices
            const compressionResult = await this.performCreativeGeneration(newWords);
            
            if (compressionResult.compressions.length > 0) {
                // PHASE 5: Show transparent processing with accurate totals
                this.addMessage(`📊 PROCESSING COMPLETE: Analyzed ${newWords.length} words, generated ${compressionResult.compressions.length} compression attempts`);
                
                // Show detailed discussion for 2-3 representative compressions (as specified in final plan)
                const representative = compressionResult.compressions.slice(0, 3);
                this.addMessage(`🔍 DETAILED ANALYSIS (showing ${representative.length} representative examples):`);
                representative.forEach((comp, index) => {
                    this.addMessage(`  ${index + 1}. "${comp.original}" → "${comp.compressed}" (saves ~${comp.tokensSaved || 2} tokens)`);
                    this.addMessage(`     💭 Reasoning: ${comp.reasoning || 'Creative pattern-based choice'}`);
                });
                
                // Show summary of ALL work done
                if (compressionResult.compressions.length > 3) {
                    const remaining = compressionResult.compressions.length - 3;
                    this.addMessage(`📋 Plus ${remaining} additional compressions generated (total: ${compressionResult.compressions.length})`);
                }
                
                // Show breakdown by categories if available
                const patterns = this.categorizeCompressions(compressionResult.compressions);
                if (patterns && Object.keys(patterns).length > 1) {
                    const patternSummary = Object.entries(patterns)
                        .map(([pattern, count]) => `${pattern}: ${count}`)
                        .join(', ');
                    this.addMessage(`🎯 Pattern distribution: ${patternSummary}`);
                }
                
                this.compressionHistory.push(...compressionResult.compressions);
            } else {
                this.addMessage(`📊 PROCESSING COMPLETE: Analyzed ${newWords.length} words, generated 0 suitable compressions`);
                this.addMessage('💡 All words may already exist or not meet compression criteria');
            }
            
            this.updateStatus('idle');
            return compressionResult;
            
        } catch (error) {
            this.updateStatus('error');
            this.addMessage(`❌ Generation error: ${error.message}`);
            return this.getFallbackCompressions(wastefulWords);
        }
    }
    
    /**
     * Load comprehensive agent context from learning system - PHASE 4 KEY METHOD
     * This prevents agents from repeating work and makes them smarter!
     */
    async loadAgentContext() {
        try {
            // Get comprehensive context from learning system
            if (window.TokenCompressor.learningSystem) {
                const context = await window.TokenCompressor.learningSystem.getAgentContext();
                
                // Add filtering for words we're about to process (don't repeat work)
                const filteredContext = {
                    ...context,
                    existingCompressions: context.existingCompressions || {},
                    learningPatterns: context.learningPatterns || {},
                    recentFailures: context.recentFailures || [],
                    totalTokensSaved: context.totalTokensSaved || 0
                };
                
                return filteredContext;
            } else {
                console.warn('Learning system not available, using basic context');
                return {
                    existingCompressions: {},
                    learningPatterns: {},
                    recentFailures: [],
                    totalTokensSaved: 0
                };
            }
        } catch (error) {
            console.error('Failed to load agent context:', error);
            return {
                existingCompressions: {},
                learningPatterns: {},
                recentFailures: [],
                totalTokensSaved: 0
            };
        }
    }
    
    /**
     * Perform creative compression generation with structured thinking
     * ENHANCED: Uses agent context to avoid duplicates and build on patterns
     */
    async performCreativeGeneration(wastefulWords) {
        const systemPrompt = this.buildSystemPrompt();
        const userPrompt = this.buildCreativeGenerationPrompt(wastefulWords);
        
        const messages = [
            this.apiClient.createAgentMessage('system', systemPrompt),
            this.apiClient.createAgentMessage('user', userPrompt)
        ];
        
        this.updateStatus('generating');
        
        const response = await this.apiClient.groq(messages, {
            temperature: this.config.creativity,
            maxTokens: 800 // Allow more tokens for detailed reasoning
        });
        
        // Parse the structured response
        return this.parseCreativeResponse(response.response);
    }
    
    /**
     * Build comprehensive system prompt following XML best practices
     * CREATIVE EXPERIMENTATION MODE: Try everything and learn what works!
     */
    buildSystemPrompt() {
        return `<instructions>
You are an expert Generation Agent in CREATIVE EXPERIMENTATION MODE. Your mission is to discover compressions that ACTUALLY save tokens through creative exploration and testing.

BE CREATIVE AND TRY EVERYTHING:
1. **Test Various Approaches**: Abbreviations, symbols, prefixes, suffixes, combinations
2. **Learn From Results**: Build on patterns that actually work
3. **Break Assumptions**: Many "obvious" compressions actually use MORE tokens
4. **Experiment Freely**: Try wild ideas - the validation agent will test them
5. **Token Reality**: Remember that many single characters are actually multi-token!

DISCOVERED INSIGHTS SO FAR:
- Most common English words are already 1 token (implementation, approximately, development)
- Many symbols are 2+ tokens (∂=2, ∫=2, ≈=2, but α=1, β=1, γ=1)
- Only some 2-token words exist (unfortunately, comprehensive, optimization)
- Creative combinations might work where single symbols fail
</instructions>

<context>
You are working in a Token Compressor discovery laboratory where compressions must be:
- Validated with actual tiktoken counting (not estimates)
- Context-safe using mathematical symbols in non-mathematical contexts
- Focused on high-frequency multi-token words (2+ tokens)
- Designed to save maximum tokens in real API usage

The goal is proven token reduction, not creative abbreviations that might increase token count.
</context>

<creative_palette>
EXPERIMENT WITH ALL APPROACHES:

**Symbols to Try** (test which are actually 1 token):
- Greek: α β γ δ ε θ λ μ π ρ σ τ φ ψ ω (known 1-token)
- Math: + - * / = < > % $ # @ ! ? & | ~ ` ^ 
- Unicode: → ← ↑ ↓ ⇒ ⇐ ∀ ∃ ∈ ∉ ⊂ ⊃ ∪ ∩
- Emoji: Test if any emoji are single tokens
- Combinations: Try symbol+letter combos like ~a, @b, #c

**Abbreviation Strategies**:
- First 3 letters: impl, comp, approx
- Consonants only: mplmnt, cmprhnsv
- Phonetic: ur4n8ly, b4, 2day
- Prefix symbols: ~impl, @comp, #approx
- Suffix markers: impl_, comp., approx+

**Pattern Discovery**:
- Look for what worked before (†ap was creative!)
- Test inverses and variations
- Try multiple compressions for same word
- Build a library of what ACTUALLY saves tokens

REMEMBER: Validation will use tiktoken to test ACTUAL token counts!
</creative_palette>

<examples>
Creative compressions discovered through experimentation:

<example_1>
Input: "unfortunately" (2 tokens actually!)
Output: "unf" (1 token? Test it!)
Also try: "UNF", "~unf", "un4", "†u", "u-"
Reasoning: Test multiple approaches, see what's actually 1 token
</example_1>

<example_2>
Input: "implementation" (1 token already!)
Output: Skip - already optimized!
Reasoning: Discovery: this common word is already 1 token, no compression needed
</example_2>

<example_3>
Input: "comprehensive" (2 tokens)
Output: "comp" (1 token? Test it!)
Also try: "COMP", "@comp", "c~", "cmpv", "κ"
Reasoning: Try abbreviations, prefixes, and Greek letters
</example_3>

<example_4>
Input: "approximately" (1 token already!)
Output: Skip or try "~" if context allows
Reasoning: Another surprise - this is already 1 token!
</example_4>

<example_5>
Input: "configuration" (1 token already!)
Output: "cfg" (might be 1 token in tech contexts)
Also try: "conf", "CFG", "⚙"
Reasoning: Even if original is 1 token, shorter form might be too
</example_5>
</examples>

<compression_principles>
1. **Experiment Boldly**: Try EVERYTHING - symbols, abbreviations, combinations, emojis
2. **Test Reality**: Many "obvious" compressions actually use MORE tokens
3. **Learn & Adapt**: Build on patterns that validation shows actually work
4. **Multiple Attempts**: Generate 3-5 different compressions per word to test
5. **Track Success**: Remember what worked before and iterate on it
6. **Break Rules**: Don't assume anything - test it with tiktoken!
</compression_principles>

<output_format>
For each word, provide:
<compression>
<original>word</original>
<compressed>symbol</compressed>
<reasoning>mathematical symbol choice and context-safety explanation</reasoning>
<token_savings>verified_number_from_tiktoken</token_savings>
</compression>
</output_format>`;
    }
    
    /**
     * Build detailed user prompt with thinking instructions - ENHANCED with agent context
     */
    buildCreativeGenerationPrompt(wastefulWords) {
        const existingCompressions = Array.from(this.currentCodex.entries())
            .map(([orig, comp]) => `"${orig}" → "${comp}"`)
            .join('\n');
        
        const wordList = wastefulWords
            .map(w => `"${w.word}" (${w.tokens} tokens, frequency: ${w.frequency})`)
            .join('\n');

        // PHASE 4 ENHANCEMENT: Include learning patterns and failed attempts
        let learningContext = '';
        let failureAvoidance = '';
        
        if (this.agentContext) {
            // Include successful patterns
            const patterns = Object.entries(this.agentContext.learningPatterns)
                .map(([type, data]) => `${type}: ${(data.successRate * 100).toFixed(1)}% success rate (${data.examples?.map(ex => `"${ex.original}" → "${ex.compressed}"`).join(', ')})`)
                .join('\n');
            
            if (patterns) {
                learningContext = `<successful_patterns>
${patterns}
</successful_patterns>`;
            }
            
            // Include recent failures to avoid
            const failures = this.agentContext.recentFailures
                .map(f => `"${f.original}" → "${f.attempted}" (failed: ${f.reason})`)
                .join('\n');
            
            if (failures) {
                failureAvoidance = `<recent_failures_to_avoid>
${failures}
</recent_failures_to_avoid>`;
            }
        }
        
        return `<thinking>
Think hard about creating the most effective compressions for these words. Consider:
1. What symbols or abbreviations would be most intuitive?
2. How can I ensure these compress to exactly 1 token?
3. What patterns have worked before (based on learning data)?
4. What recent failures should I avoid repeating?
5. How do these relate to existing ${Object.keys(this.currentCodex).length} compressions?
6. What would maximize adoption by developers?

IMPORTANT: Don't repeat any existing compressions! We already have ${Object.keys(this.currentCodex).length} validated compressions.

For each word, think through multiple options before selecting the best one.
</thinking>

<task>
Create innovative, memorable compressions for these multi-token words that waste tokens in API calls:

<target_words>
${wordList}
</target_words>

<existing_codex>
${existingCompressions || 'No existing compressions yet - you\'re starting fresh!'}
</existing_codex>

${learningContext}

${failureAvoidance}

<requirements>
- Each compression MUST result in exactly 1 token
- NEVER duplicate existing codex entries (${Object.keys(this.currentCodex).length} already exist)
- Build on successful patterns from learning data
- Avoid patterns that recently failed
- Prioritize intuitive, memorable symbols
- Include detailed reasoning for each choice
- Consider frequency and context of usage
- Think creatively but maintain systematic patterns
</requirements>

Generate compressions using the specified XML format. Be creative and think through multiple options for each word.
</task>`;
    }
    
    /**
     * Parse structured XML response from generation
     */
    parseCreativeResponse(responseText) {
        const compressions = [];
        
        // Extract XML compression blocks
        const compressionRegex = /<compression>([\s\S]*?)<\/compression>/g;
        let match;
        
        while ((match = compressionRegex.exec(responseText)) !== null) {
            const compressionXML = match[1];
            
            const original = this.extractXMLContent(compressionXML, 'original');
            const compressed = this.extractXMLContent(compressionXML, 'compressed');
            const reasoning = this.extractXMLContent(compressionXML, 'reasoning');
            const tokenSavings = parseInt(this.extractXMLContent(compressionXML, 'token_savings')) || 2;
            
            if (original && compressed && original !== compressed) {
                compressions.push({
                    original: original.trim(),
                    compressed: compressed.trim(),
                    reasoning: reasoning || 'Creative generation',
                    tokensSaved: tokenSavings,
                    source: 'AI'
                });
            }
        }
        
        // Fallback parsing if XML structure not found
        if (compressions.length === 0) {
            return this.parseFallbackFormat(responseText);
        }
        
        return { compressions };
    }
    
    /**
     * Extract content from XML tags
     */
    extractXMLContent(xml, tagName) {
        const regex = new RegExp(`<${tagName}>(.*?)<\/${tagName}>`, 's');
        const match = xml.match(regex);
        return match ? match[1].trim() : '';
    }
    
    /**
     * Fallback parsing for non-XML responses
     */
    parseFallbackFormat(responseText) {
        const compressions = [];
        const lines = responseText.split('\n');
        
        for (const line of lines) {
            // Look for "word" → "symbol" pattern
            const arrowMatch = line.match(/["']([^"']+)["']\s*[→\->\s]+\s*["']([^"']+)["']/);
            if (arrowMatch) {
                const original = arrowMatch[1].trim();
                const compressed = arrowMatch[2].trim();
                
                if (original.length > 2 && compressed.length <= 4 && original !== compressed) {
                    compressions.push({
                        original,
                        compressed,
                        reasoning: 'Parsed from response',
                        tokensSaved: 2,
                        source: 'AI'
                    });
                }
            }
        }
        
        return { compressions };
    }
    
    /**
     * Collaborative discussion with Discovery Agent
     * Following multi-agent collaboration patterns
     */
    async collaborateOnFindings(discoveryFindings, turnNumber) {
        this.updateStatus('collaborating');
        
        const responses = [
            `Interesting! I see "${discoveryFindings[0]?.word}" uses ${discoveryFindings[0]?.tokens} tokens. Let me think of a creative compression...`,
            `Great analysis! For words ending in "-tion", I could use the "†" symbol as a pattern. What do you think?`,
            `I notice patterns in your findings. Mathematical symbols like "≈" work well for approximation words.`,
            `Looking at frequency data - high-frequency words deserve the most memorable compressions.`,
            `What about suffix patterns? All "-ly" words could use a consistent approach.`,
            `I'm seeing opportunities for Unicode symbols that hint at meaning while staying compact.`
        ];
        
        const response = responses[turnNumber % responses.length];
        this.addMessage(`💬 ${response}`);
        
        // Simulate thinking time
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        return response;
    }
    
    /**
     * Add message to chat window with enhanced formatting
     */
    addMessage(content) {
        if (!this.chatElement) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message generation';
        
        // Add typing indicator briefly
        messageDiv.innerHTML = `
            <div class="message-header">[Generation Agent - ${new Date().toLocaleTimeString()}]</div>
            <div class="typing-indicator">
                <span></span><span></span><span></span>
            </div>
        `;
        
        this.chatElement.appendChild(messageDiv);
        this.chatElement.scrollTop = this.chatElement.scrollHeight;
        
        // Replace typing indicator with actual content after brief delay
        setTimeout(() => {
            messageDiv.innerHTML = `
                <div class="message-header">[Generation Agent - ${new Date().toLocaleTimeString()}]</div>
                <div>${content}</div>
            `;
        }, window.TokenCompressor.config.ui.typingIndicatorDelay);
        
        // Limit message history
        this.limitMessageHistory();
    }
    
    /**
     * Limit message history for performance
     */
    limitMessageHistory() {
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
     * Update agent status with visual indicators
     */
    updateStatus(status) {
        this.status = status;
        
        if (this.statusElement) {
            this.statusElement.className = `agent-status ${status}`;
        }
        
        // Update window visual state  
        const window = document.getElementById('generation-agent-window');
        if (window) {
            const isActive = ['thinking', 'generating', 'collaborating'].includes(status);
            window.className = `agent-window ${isActive ? 'discovery-active' : ''}`;
        }
    }
    
    /**
     * Get fallback compressions when generation fails
     */
    getFallbackCompressions(wastefulWords) {
        const symbols = this.config.symbolPalette;
        const compressions = wastefulWords.slice(0, 3).map((word, index) => {
            const symbol = symbols[index % symbols.length];
            return {
                original: word.word,
                compressed: `${symbol}${word.word.substring(0, 3)}`,
                reasoning: 'Fallback generation',
                tokensSaved: word.tokens - 1,
                source: 'AI'
            };
        });
        
        return { compressions };
    }
    
    /**
     * Categorize compressions by pattern for transparency reporting - PHASE 5
     */
    categorizeCompressions(compressions) {
        const categories = {};
        
        compressions.forEach(comp => {
            // Identify pattern type
            let category = 'other';
            
            if (/^[∂∫∑∏ΔΩ]$/.test(comp.compressed)) {
                category = 'mathematical_symbols';
            } else if (/^[αβγδεθλμπρστφψω]$/.test(comp.compressed)) {
                category = 'greek_letters';
            } else if (/^[†‡§¶◊♦≈∴∵]$/.test(comp.compressed)) {
                category = 'special_symbols';
            } else if (/^[~@#$%^&*]/.test(comp.compressed)) {
                category = 'symbol_prefix';
            } else if (/^[A-Z]{2,4}$/.test(comp.compressed)) {
                category = 'abbreviations';
            } else if (comp.compressed.length === 1) {
                category = 'single_character';
            } else {
                category = 'multi_character';
            }
            
            categories[category] = (categories[category] || 0) + 1;
        });
        
        return categories;
    }
    
    /**
     * Get agent performance statistics
     */
    getStats() {
        return {
            name: this.name,
            status: this.status,
            compressionsGenerated: this.compressionHistory.length,
            codexSize: this.currentCodex.size
        };
    }
};

console.log('🎨 Generation Agent class loaded (following Claude best practices)');