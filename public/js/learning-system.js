/**
 * LEARNING SYSTEM - Track What Actually Works!
 * 
 * This system learns from every compression attempt:
 * - Records what actually saves tokens
 * - Identifies patterns that work
 * - Builds on successful discoveries
 * - Helps agents get smarter over time
 */

window.TokenCompressor = window.TokenCompressor || {};

window.TokenCompressor.LearningSystem = class LearningSystem {
    constructor() {
        this.discoveries = new Map(); // Track all discoveries
        this.successfulPatterns = [];  // Patterns that actually work
        this.failedAttempts = [];      // What didn't work (avoid repeating)
        this.tokenSavingsTotal = 0;    // Track total tokens saved
        
        // Load previous learnings from localStorage
        this.loadLearnings();
        
        console.log('🧠 Learning System initialized');
    }
    
    /**
     * Record a compression attempt and its result
     */
    recordAttempt(original, compressed, originalTokens, compressedTokens, worked) {
        const savings = originalTokens - compressedTokens;
        
        const attempt = {
            original,
            compressed,
            originalTokens,
            compressedTokens,
            tokenSavings: savings,
            worked,
            timestamp: Date.now(),
            pattern: this.identifyPattern(compressed)
        };
        
        if (worked && savings > 0) {
            // Success! Record it
            this.discoveries.set(`${original}->${compressed}`, attempt);
            this.tokenSavingsTotal += savings;
            
            // Learn the pattern
            this.learnPattern(attempt);
            
            console.log(`✅ LEARNED: "${original}" (${originalTokens}t) → "${compressed}" (${compressedTokens}t) saves ${savings} tokens!`);
        } else {
            // Failed - remember to avoid
            this.failedAttempts.push(attempt);
            
            console.log(`❌ FAILED: "${original}" → "${compressed}" (no savings or didn't work)`);
        }
        
        // Save learnings
        this.saveLearnings();
        
        return attempt;
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
     * Save learnings to localStorage
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
     * Load learnings from localStorage
     */
    loadLearnings() {
        const saved = localStorage.getItem('tokenCompressorLearnings');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.discoveries = new Map(data.discoveries || []);
                this.successfulPatterns = data.successfulPatterns || [];
                this.failedAttempts = data.failedAttempts || [];
                this.tokenSavingsTotal = data.tokenSavingsTotal || 0;
                
                console.log(`📚 Loaded ${this.discoveries.size} previous discoveries`);
            } catch (e) {
                console.error('Failed to load learnings:', e);
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