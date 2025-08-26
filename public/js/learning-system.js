/**
 * LEARNING SYSTEM - Track What Actually Works!
 * ENHANCED: Database integration for agent context loading
 * 
 * This system learns from every compression attempt:
 * - Records what actually saves tokens in database
 * - Identifies patterns that work across sessions
 * - Builds on successful discoveries from all 686 existing compressions
 * - Helps agents get smarter over time with persistent learning
 * - Provides context to agents before they start generating
 */

window.TokenCompressor = window.TokenCompressor || {};

window.TokenCompressor.LearningSystem = class LearningSystem {
    constructor() {
        this.discoveries = new Map(); // Track all discoveries
        this.successfulPatterns = [];  // Patterns that actually work
        this.failedAttempts = [];      // What didn't work (avoid repeating)
        this.tokenSavingsTotal = 0;    // Track total tokens saved
        
        // Database integration
        this.supabase = window.TokenCompressor.SupabaseClient;
        this.agentContextCache = new Map(); // Cache for agent context
        
        // Load learnings from both database and localStorage
        this.initializeLearnings();
        
        console.log('🧠 Learning System initialized with database integration');
    }
    
    /**
     * Initialize learnings from database and localStorage - ENHANCED
     */
    async initializeLearnings() {
        console.log(`🔵 [LEARNING-SYSTEM] initializeLearnings() started`);
        
        try {
            console.log(`🔵 [LEARNING-SYSTEM] Loading existing compressions from database...`);
            await this.loadExistingCompressions();
            
            console.log(`🔵 [LEARNING-SYSTEM] Loading learning patterns from database...`);
            await this.loadLearningPatterns();
            
            console.log(`🔵 [LEARNING-SYSTEM] Loading failed attempts from database...`);
            await this.loadFailedAttempts();
            
            console.log(`🔵 [LEARNING-SYSTEM] Loading localStorage backup...`);
            this.loadLocalLearnings();
            
            console.log(`✅ [LEARNING-SYSTEM] Initialized with ${this.discoveries.size} discoveries, ${this.successfulPatterns.length} patterns`);
        } catch (error) {
            console.error(`❌ [LEARNING-SYSTEM] Database learning initialization failed:`, error);
            console.log(`🔵 [LEARNING-SYSTEM] Falling back to localStorage only...`);
            this.loadLocalLearnings();
        }
    }
    
    /**
     * Load existing compressions for agent context - NEW
     */
    async loadExistingCompressions() {
        try {
            const { data: compressions, error } = await this.supabase.supabase
                .from('compressions')
                .select('original, compressed, tokens_saved, created_at, source')
                .order('created_at', { ascending: false });
                
            if (error) throw error;
            
            // Convert to internal format for agent context
            compressions.forEach(comp => {
                const key = `${comp.original}->${comp.compressed}`;
                this.discoveries.set(key, {
                    original: comp.original,
                    compressed: comp.compressed,
                    tokenSavings: comp.tokens_saved,
                    worked: true,
                    timestamp: new Date(comp.created_at).getTime(),
                    pattern: this.identifyPattern(comp.compressed),
                    source: comp.source
                });
                this.tokenSavingsTotal += comp.tokens_saved;
            });
            
            console.log(`💾 Loaded ${compressions.length} existing compressions from database`);
        } catch (error) {
            console.warn('Failed to load existing compressions:', error);
        }
    }
    
    /**
     * Load learning patterns from database - NEW
     */
    async loadLearningPatterns() {
        try {
            const { data: patterns, error } = await this.supabase.supabase
                .from('learning_patterns')
                .select('*')
                .order('success_rate', { ascending: false });
                
            if (error) throw error;
            
            // Convert to internal format
            this.successfulPatterns = patterns.map(p => ({
                type: p.pattern_type,
                count: p.successful_attempts,
                totalSavings: p.successful_attempts * p.token_savings_avg,
                successRate: p.success_rate,
                domain: p.domain_source,
                examples: [{
                    original: p.example_original,
                    compressed: p.example_compressed,
                    savings: p.token_savings_avg
                }].filter(ex => ex.original) // Filter out null examples
            }));
            
            console.log(`🎯 Loaded ${patterns.length} learning patterns from database`);
        } catch (error) {
            console.warn('Failed to load learning patterns:', error);
        }
    }
    
    /**
     * Load failed attempts from database - NEW
     */
    async loadFailedAttempts() {
        try {
            const { data: failures, error } = await this.supabase.supabase
                .from('failed_attempts')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(100); // Only recent failures
                
            if (error) throw error;
            
            // Convert to internal format
            this.failedAttempts = failures.map(f => ({
                original: f.original_word,
                compressed: f.attempted_compression,
                originalTokens: f.token_count_original,
                compressedTokens: f.token_count_compressed,
                tokenSavings: f.token_count_original - f.token_count_compressed,
                worked: false,
                timestamp: new Date(f.created_at).getTime(),
                pattern: f.pattern_type,
                failureReason: f.failure_reason,
                domain: f.domain_source
            }));
            
            console.log(`❌ Loaded ${failures.length} failed attempts from database`);
        } catch (error) {
            console.warn('Failed to load failed attempts:', error);
        }
    }
    
    /**
     * Get agent context - loads all relevant data for agents before they start
     * This is the KEY method that prevents agents from repeating work!
     */
    async getAgentContext() {
        const context = {
            existingCompressions: {},
            learningPatterns: {},
            recentFailures: [],
            recommendations: {},
            totalTokensSaved: this.tokenSavingsTotal
        };
        
        // All existing compressions (don't repeat these!)
        for (const [key, discovery] of this.discoveries) {
            context.existingCompressions[discovery.original] = discovery.compressed;
        }
        
        // Successful patterns by type
        this.successfulPatterns.forEach(pattern => {
            context.learningPatterns[pattern.type] = {
                successRate: pattern.successRate || (pattern.count > 0 ? pattern.totalSavings / pattern.count : 0),
                examples: pattern.examples,
                count: pattern.count
            };
        });
        
        // Recent failures (avoid these patterns)
        context.recentFailures = this.failedAttempts
            .slice(-20) // Last 20 failures
            .map(f => ({
                original: f.original,
                attempted: f.compressed,
                reason: f.failureReason
            }));
            
        return context;
    }
    
    /**
     * Record a compression attempt and its result - ENHANCED with database
     */
    async recordAttempt(original, compressed, originalTokens, compressedTokens, worked, failureReason = null, domain = 'general') {
        const savings = originalTokens - compressedTokens;
        
        const attempt = {
            original,
            compressed,
            originalTokens,
            compressedTokens,
            tokenSavings: savings,
            worked,
            timestamp: Date.now(),
            pattern: this.identifyPattern(compressed),
            domain
        };
        
        if (worked && savings > 0) {
            // Success! Record it locally
            this.discoveries.set(`${original}->${compressed}`, attempt);
            this.tokenSavingsTotal += savings;
            
            // Learn the pattern
            this.learnPattern(attempt);
            
            console.log(`✅ LEARNED: "${original}" (${originalTokens}t) → "${compressed}" (${compressedTokens}t) saves ${savings} tokens!`);
            
            // Note: Successful compressions should be saved to 'compressions' table by validation agent
            // Learning patterns will be updated automatically by database trigger
            
        } else {
            // Failed - remember to avoid
            this.failedAttempts.push(attempt);
            
            console.log(`❌ FAILED: "${original}" → "${compressed}" (${failureReason || 'no savings or didn\'t work'})`);
            
            // Save failure to database
            await this.recordFailedAttempt(original, compressed, originalTokens, compressedTokens, failureReason, attempt.pattern, domain);
        }
        
        // Save learnings locally (backup)
        this.saveLearnings();
        
        return attempt;
    }
    
    /**
     * Record failed attempt to database - NEW
     */
    async recordFailedAttempt(original, compressed, originalTokens, compressedTokens, failureReason, patternType, domain) {
        try {
            const { error } = await this.supabase.supabase
                .from('failed_attempts')
                .insert({
                    original_word: original,
                    attempted_compression: compressed,
                    failure_reason: failureReason || 'token_count_fail',
                    failure_details: `Original: ${originalTokens} tokens, Compressed: ${compressedTokens} tokens, Savings: ${originalTokens - compressedTokens}`,
                    pattern_type: patternType,
                    domain_source: domain,
                    token_count_original: originalTokens,
                    token_count_compressed: compressedTokens,
                    semantic_score: null, // Could be added later with semantic validation
                    agent_version: '1.0'
                });
                
            if (error) throw error;
            
        } catch (error) {
            console.warn('Failed to record failed attempt to database:', error);
        }
    }
    
    /**
     * Identify what pattern was used
     */
    identifyPattern(compressed) {
        // Greek letter
        if (/^[αβγδεθλμπρστφψω]$/.test(compressed)) {
            return 'greek_letter';
        }
        
        // Symbol prefix
        if (/^[~@#$%^&*]/.test(compressed)) {
            return 'symbol_prefix';
        }
        
        // Three letter abbreviation
        if (/^[a-z]{3}$/i.test(compressed)) {
            return 'three_letter_abbrev';
        }
        
        // All caps
        if (/^[A-Z]+$/.test(compressed)) {
            return 'all_caps';
        }
        
        // Symbol only
        if (/^[^a-zA-Z0-9]+$/.test(compressed)) {
            return 'symbol_only';
        }
        
        // Phonetic/number mix
        if (/[0-9]/.test(compressed)) {
            return 'phonetic_number';
        }
        
        // Consonants only
        if (/^[bcdfghjklmnpqrstvwxyz]+$/i.test(compressed)) {
            return 'consonants_only';
        }
        
        return 'other';
    }
    
    /**
     * Learn from successful patterns
     */
    learnPattern(attempt) {
        const pattern = attempt.pattern;
        
        // Find or create pattern record
        let patternRecord = this.successfulPatterns.find(p => p.type === pattern);
        if (!patternRecord) {
            patternRecord = {
                type: pattern,
                count: 0,
                totalSavings: 0,
                examples: []
            };
            this.successfulPatterns.push(patternRecord);
        }
        
        // Update pattern stats
        patternRecord.count++;
        patternRecord.totalSavings += attempt.tokenSavings;
        patternRecord.examples.push({
            original: attempt.original,
            compressed: attempt.compressed,
            savings: attempt.tokenSavings
        });
        
        // Keep only best examples
        patternRecord.examples.sort((a, b) => b.savings - a.savings);
        patternRecord.examples = patternRecord.examples.slice(0, 5);
    }
    
    /**
     * Get recommendations based on learnings
     */
    getRecommendations(word, currentTokens) {
        const recommendations = [];
        
        // Sort patterns by success rate
        const sortedPatterns = [...this.successfulPatterns]
            .sort((a, b) => b.totalSavings - a.totalSavings);
        
        // Generate recommendations based on successful patterns
        for (const pattern of sortedPatterns) {
            const suggestion = this.generateSuggestion(word, pattern);
            if (suggestion) {
                recommendations.push({
                    pattern: pattern.type,
                    suggestion,
                    confidence: pattern.totalSavings / pattern.count,
                    examples: pattern.examples
                });
            }
        }
        
        return recommendations;
    }
    
    /**
     * Generate a suggestion based on a pattern
     */
    generateSuggestion(word, pattern) {
        switch (pattern.type) {
            case 'three_letter_abbrev':
                return word.substring(0, 3).toLowerCase();
                
            case 'greek_letter':
                // Use next available Greek letter
                const greekLetters = 'αβγδεθλμπρστφψω'.split('');
                const usedLetters = Array.from(this.discoveries.values())
                    .filter(d => d.pattern === 'greek_letter')
                    .map(d => d.compressed);
                return greekLetters.find(l => !usedLetters.includes(l));
                
            case 'symbol_prefix':
                return '~' + word.substring(0, 3);
                
            case 'all_caps':
                return word.substring(0, 3).toUpperCase();
                
            case 'consonants_only':
                return word.replace(/[aeiou]/gi, '');
                
            default:
                return null;
        }
    }
    
    /**
     * Get learning statistics
     */
    getStats() {
        return {
            totalDiscoveries: this.discoveries.size,
            totalTokensSaved: this.tokenSavingsTotal,
            successfulPatterns: this.successfulPatterns
                .map(p => ({
                    type: p.type,
                    count: p.count,
                    avgSavings: (p.totalSavings / p.count).toFixed(1)
                }))
                .sort((a, b) => b.count - a.count),
            failureCount: this.failedAttempts.length,
            topCompressions: Array.from(this.discoveries.values())
                .sort((a, b) => b.tokenSavings - a.tokenSavings)
                .slice(0, 10)
                .map(d => ({
                    original: d.original,
                    compressed: d.compressed,
                    savings: d.tokenSavings
                }))
        };
    }
    
    /**
     * Save learnings to localStorage (backup method)
     */
    saveLearnings() {
        const data = {
            discoveries: Array.from(this.discoveries.entries()),
            successfulPatterns: this.successfulPatterns,
            failedAttempts: this.failedAttempts.slice(-100), // Keep last 100 failures
            tokenSavingsTotal: this.tokenSavingsTotal
        };
        
        localStorage.setItem('tokenCompressorLearnings', JSON.stringify(data));
    }
    
    /**
     * Load learnings from localStorage (fallback method)
     */
    loadLocalLearnings() {
        const saved = localStorage.getItem('tokenCompressorLearnings');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                
                // Only add if not already loaded from database
                if (this.discoveries.size === 0) {
                    this.discoveries = new Map(data.discoveries || []);
                }
                if (this.successfulPatterns.length === 0) {
                    this.successfulPatterns = data.successfulPatterns || [];
                }
                if (this.failedAttempts.length === 0) {
                    this.failedAttempts = data.failedAttempts || [];
                }
                if (this.tokenSavingsTotal === 0) {
                    this.tokenSavingsTotal = data.tokenSavingsTotal || 0;
                }
                
                console.log(`📚 Loaded ${data.discoveries?.length || 0} discoveries from localStorage backup`);
            } catch (e) {
                console.error('Failed to load learnings from localStorage:', e);
            }
        }
    }
    
    /**
     * Clear all learnings (for fresh start)
     */
    clearLearnings() {
        this.discoveries.clear();
        this.successfulPatterns = [];
        this.failedAttempts = [];
        this.tokenSavingsTotal = 0;
        localStorage.removeItem('tokenCompressorLearnings');
        console.log('🧹 Cleared all learnings');
    }
};

// Initialize learning system
window.TokenCompressor.learningSystem = new window.TokenCompressor.LearningSystem();

console.log('🧠 Learning System ready to track discoveries!');