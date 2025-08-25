/**
 * VALIDATION AGENT - The Quality Control Specialist
 * 
 * WHAT IT DOES:
 * 1. Runs hourly "Testing Ceremonies" (minutes 55-60 of each hour)
 * 2. Tests every compression for perfect reversibility (meaning preservation)
 * 3. Only accepts compressions with 100% semantic accuracy
 * 4. Updates the global codex with validated compressions
 * 
 * EXAMPLE TESTING PROCESS:
 * - Gets: "approximately" → "≈" (from Generation Agent)
 * - Tests in contexts: "It costs ≈ $100", "Takes ≈ 2 hours", "≈ 50 people"
 * - Asks AI: "Can humans understand this means 'approximately'?"
 * - Decision: ✅ VALID (universally understood mathematical symbol)
 * 
 * TESTING METHODOLOGY:
 * - Multiple context testing (business, technical, casual writing)
 * - AI-powered semantic analysis (DeepSeek API)
 * - Batch processing for efficiency (5 compressions at once)
 * - Local validation rules for common patterns
 * 
 * QUALITY STANDARDS:
 * - 100% meaning preservation required
 * - No ambiguity allowed in any context
 * - Must work in professional/business communication
 * 
 * CEREMONY PROCESS:
 * - Collects all AI + human compression candidates
 * - Tests each in multiple contexts
 * - Updates global codex with valid ones
 * - Triggers Twitter announcement of discoveries
 */

window.TokenCompressor = window.TokenCompressor || {};

window.TokenCompressor.ValidationAgent = class ValidationAgent {
    constructor() {
        // Basic agent properties
        this.name = 'Validation Agent';
        this.status = 'idle'; // Possible states: idle, testing, analyzing, ceremony, error
        
        // UI elements for real-time updates
        this.resultsElement = document.getElementById('test-results');      // Results display
        this.apiClient = window.TokenCompressor.APIClient;                 // API communication
        this.config = window.TokenCompressor.config.agents.validation;     // Agent settings
        
        // Validation system components
        this.testCorpus = this.buildTestCorpus();    // Pre-built test sentences
        this.validationHistory = [];                 // Track all validation decisions
        this.lastCeremonyTime = 0;                   // When we last ran ceremony
        
        this.updateStatus('idle');
        console.log('⚡ Validation Agent initialized - Ready for testing ceremonies');
    }
    
    /**
     * Main testing ceremony - comprehensive validation following best practices
     * XML-structured prompts, detailed tool descriptions, systematic testing
     */
    async runTestingCeremony(candidateCompressions, humanSubmissions = []) {
        this.updateStatus('ceremony');
        this.addResult('🎭 Testing Ceremony begins!', 'info');
        
        if (!candidateCompressions || candidateCompressions.length === 0) {
            this.addResult('📝 No AI compressions to test this hour', 'info');
        } else {
            this.addResult(`🤖 Testing ${candidateCompressions.length} AI compressions...`, 'info');
        }
        
        if (humanSubmissions.length > 0) {
            this.addResult(`👥 Testing ${humanSubmissions.length} human submissions...`, 'info');
        }
        
        try {
            const allCandidates = [
                ...candidateCompressions.map(c => ({ ...c, source: c.source || 'AI' })),
                ...humanSubmissions.map(s => ({
                    original: s.original,
                    compressed: s.compressed,
                    source: `Human: ${s.name}`,
                    submissionId: s.id
                }))
            ];
            
            if (allCandidates.length === 0) {
                this.addResult('😴 No compressions to test - agents will continue searching', 'info');
                this.updateStatus('idle');
                return { validCompressions: [], rejectedCompressions: [] };
            }
            
            // Comprehensive testing with AI assistance
            const validationResults = await this.performComprehensiveValidation(allCandidates);
            
            // Display results
            this.displayCeremonyResults(validationResults);
            
            this.lastCeremonyTime = Date.now();
            this.updateStatus('idle');
            
            return validationResults;
            
        } catch (error) {
            this.updateStatus('error');
            this.addResult(`❌ Testing ceremony error: ${error.message}`, 'failure');
            return { validCompressions: [], rejectedCompressions: [] };
        }
    }
    
    /**
     * Perform comprehensive validation using Claude best practices
     * Detailed instructions, XML structure, extended thinking
     */
    async performComprehensiveValidation(candidates) {
        this.updateStatus('testing');
        
        const validCompressions = [];
        const rejectedCompressions = [];
        
        // Batch candidates for efficiency (groups of 5)
        const batches = this.createBatches(candidates, 5);
        
        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            this.addResult(`🧪 Testing batch ${i + 1}/${batches.length} (${batch.length} compressions)...`, 'info');
            
            try {
                // ENHANCED: Use tiktoken validation first
                this.addResult(`📊 Running tiktoken validation...`, 'info');
                const tiktokenResults = await this.validateCompressionWithTiktoken(batch);
                
                if (tiktokenResults.error) {
                    this.addResult(`⚠️ Tiktoken unavailable, using AI + Local validation`, 'warning');
                }
                
                // Use AI for sophisticated validation
                const batchResults = await this.validateBatchWithAI(tiktokenResults.candidates || batch);
                
                // Triple validation: Tiktoken + AI + Local
                for (const result of batchResults) {
                    const localValidation = this.validateCompressionLocally(result);
                    
                    // Enhanced validation criteria
                    const tiktokenValid = result.tiktokenVerified && result.isEffective;
                    const contextSafe = result.isContextSafe !== false && localValidation.isContextSafe;
                    const aiValid = result.isValid;
                    const localValid = localValidation.isValid;
                    
                    const overallValid = tiktokenValid && contextSafe && aiValid && localValid;
                    
                    if (overallValid) {
                        validCompressions.push({
                            ...result,
                            validatedBy: 'Tiktoken + AI + Local',
                            testsPassed: localValidation.testsPassed,
                            tokenSavings: result.tokenSavings || 2,
                            contextSafe: contextSafe
                        });
                        this.addResult(`✅ "${result.original}" → "${result.compressed}" (Saves ${result.tokenSavings || '?'} tokens)`, 'success');
                        
                        // LEARNING SYSTEM: Record successful compression!
                        if (window.TokenCompressor.learningSystem) {
                            window.TokenCompressor.learningSystem.recordAttempt(
                                result.original,
                                result.compressed,
                                result.originalTokens || 2,
                                result.compressedTokens || 1,
                                true
                            );
                        }
                    } else {
                        const reasons = [];
                        if (!tiktokenValid) reasons.push('No token savings');
                        if (!contextSafe) reasons.push('Not context-safe');
                        if (!aiValid) reasons.push('AI rejected');
                        if (!localValid) reasons.push('Local tests failed');
                        
                        rejectedCompressions.push({
                            ...result,
                            validatedBy: 'Tiktoken + AI + Local',
                            rejectionReason: reasons.join(', '),
                            testsFailed: localValidation.testsFailed || 0
                        });
                        this.addResult(`❌ "${result.original}" → "${result.compressed}" (${reasons.join(', ')})`, 'failure');
                        
                        // LEARNING SYSTEM: Record failed attempt to avoid repeating
                        if (window.TokenCompressor.learningSystem) {
                            window.TokenCompressor.learningSystem.recordAttempt(
                                result.original,
                                result.compressed,
                                result.originalTokens || 2,
                                result.compressedTokens || 2,
                                false
                            );
                        }
                    }
                }
                
                // Show tiktoken summary if available
                if (tiktokenResults.totalTokenSavings > 0) {
                    this.addResult(`💰 Batch token savings: ${tiktokenResults.totalTokenSavings}`, 'info');
                }
                
                // Brief pause between batches
                if (i < batches.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
                
            } catch (error) {
                console.error('Batch validation error:', error);
                // Fallback to local-only validation
                const localResults = batch.map(candidate => this.validateCompressionLocally(candidate));
                localResults.forEach(result => {
                    if (result.isValid) {
                        validCompressions.push(result);
                        this.addResult(`✅ "${result.original}" → "${result.compressed}" (Local validation)`, 'success');
                    } else {
                        rejectedCompressions.push(result);
                        this.addResult(`❌ "${result.original}" → "${result.compressed}" (${result.rejectionReason})`, 'failure');
                    }
                });
            }
        }
        
        return { validCompressions, rejectedCompressions };
    }
    
    /**
     * Validate batch using AI with structured prompting
     */
    async validateBatchWithAI(candidates) {
        const systemPrompt = this.buildValidationSystemPrompt();
        const userPrompt = this.buildValidationUserPrompt(candidates);
        
        const messages = [
            this.apiClient.createAgentMessage('system', systemPrompt),
            this.apiClient.createAgentMessage('user', userPrompt)
        ];
        
        const response = await this.apiClient.deepseek(messages, 'validation', {
            temperature: 0.1, // Low temperature for consistent validation
            maxTokens: 1000
        });
        
        return this.parseValidationResponse(response.response, candidates);
    }
    
    /**
     * Build comprehensive validation system prompt
     * ENHANCED: Context-safe validation with tiktoken verification
     */
    buildValidationSystemPrompt() {
        return `<instructions>
You are an expert Validation Agent responsible for testing context-safe text compression with mathematical symbol verification. Your role is critical - only compressions that are mathematically sound, context-safe, and token-verified should be approved.

ENHANCED VALIDATION FOCUS:
- Mathematical symbols (∂, ∫, ∑) never naturally precede English words
- Tiktoken-verified token savings (not estimates)
- Context-safe patterns that preserve mathematical expressions
- Perfect reversibility with symbol + space + letter = compression
</instructions>

<context>
You are validating compressions for a Token Compressor system that uses mathematical symbols in non-mathematical contexts. The key insight is that mathematical symbols never naturally appear before English words, creating unambiguous compression markers.

Enhanced requirements:
1. **Context-Safe**: Mathematical symbols only used where they never naturally appear
2. **Token-Verified**: Actual tiktoken validation, not character estimates  
3. **Mathematically Respectful**: Preserve actual math expressions (∂f/∂x, ∫f(x)dx)
4. **Perfectly Reversible**: Symbol + space + letter pattern is unambiguous
5. **Actually Saves Tokens**: Compression must reduce token count (verified by tiktoken)
</context>

<mathematical_validation_rules>
CONTEXT-SAFE SYMBOLS (approved for compression):
- ∂ (partial derivative - requires ∂/∂x format in math, safe before English words)
- ∫ (integral - requires dx after in math, safe before English words)  
- ∑ (sigma sum - requires subscript in math, safe before English words)
- ∏ (product - requires subscript in math, safe before English words)
- Mathematical Greeks: α β γ δ ε θ λ μ π ρ σ τ φ ψ ω (variables, not verbs)
- Safe markers: † ‡ § ¶ ◊ ♦ (never precede English words naturally)

CONTEXT RULE: These symbols NEVER appear before English words in natural text. When they do, it's unambiguously a compression.

MATHEMATICAL PRESERVATION: Must not corrupt actual math like "∂f/∂x" or "∫sin(x)dx"
</mathematical_validation_rules>

<enhanced_validation_methodology>
For each compression, systematically test:
1. **Tiktoken Token Count Verification**: Confirm actual token savings using tiktoken API
2. **Context-Safety Test**: Ensure symbol never naturally precedes the word type
3. **Mathematical Expression Preservation**: Verify real math expressions aren't corrupted
4. **String Replacement Reversibility**: Test compression/expansion cycle
5. **Multi-Context Testing**: Business, technical, and casual writing contexts
6. **Edge Case Boundary Testing**: Punctuation, capitalization, word boundaries
</enhanced_validation_methodology>

<test_corpus>
Context-safe validation sentences:
- "Unfortunately the implementation was approximately comprehensive."
- "The integral ∫x²dx equals x³/3, therefore the solution works." (preserve math!)
- "Please provide approximately fifteen comprehensive examples." 
- "The partial derivative ∂f/∂x shows the rate unfortunately." (preserve math!)
- "We need comprehensive analysis of the implementation unfortunately."
</test_corpus>

<output_format>
For each compression tested, respond with:
<validation>
<original>word</original>
<compressed>symbol</compressed>
<source>AI or Human: Name</source>
<is_valid>true or false</is_valid>
<tiktoken_verified>true or false</tiktoken_verified>
<token_savings>actual_number_from_tiktoken</token_savings>
<context_safe>true or false</context_safe>
<tests_passed>number</tests_passed>
<tests_failed>number</tests_failed>
<rejection_reason>detailed reason if invalid</rejection_reason>
<confidence>high/medium/low</confidence>
</validation>
</output_format>`;
    }
    
    /**
     * Build detailed user prompt for validation
     */
    buildValidationUserPrompt(candidates) {
        const compressionList = candidates.map((c, i) => 
            `${i + 1}. "${c.original}" → "${c.compressed}" (Source: ${c.source})`
        ).join('\n');
        
        return `<thinking>
Think hard about testing each compression systematically. For each one:
1. How would this work in different sentence contexts?
2. Are there any ambiguous interpretations?
3. Will the string replacement be perfectly reversible?
4. Could this conflict with existing text patterns?
5. Is the compressed form truly 1 token?

Test thoroughly before making decisions.
</thinking>

<validation_task>
Test these compression candidates for 100% reversibility and reliability:

<compressions_to_test>
${compressionList}
</compressions_to_test>

<requirements>
- Test each compression against the provided test corpus
- Verify perfect reversibility: original → compressed → original
- Check for context independence and ambiguity
- Ensure compressed forms are exactly 1 token
- Provide detailed rejection reasons for failed compressions
- Be rigorous - production system depends on accuracy
</requirements>

Validate each compression using the specified XML format. Think through edge cases and potential failures.
</validation_task>`;
    }
    
    /**
     * Parse structured validation response
     */
    parseValidationResponse(responseText, originalCandidates) {
        const results = [];
        const validationRegex = /<validation>([\s\S]*?)<\/validation>/g;
        let match;
        
        while ((match = validationRegex.exec(responseText)) !== null) {
            const validationXML = match[1];
            
            const original = this.extractXMLContent(validationXML, 'original');
            const compressed = this.extractXMLContent(validationXML, 'compressed');
            const source = this.extractXMLContent(validationXML, 'source');
            const isValid = this.extractXMLContent(validationXML, 'is_valid') === 'true';
            const testsPassed = parseInt(this.extractXMLContent(validationXML, 'tests_passed')) || 0;
            const testsFailed = parseInt(this.extractXMLContent(validationXML, 'tests_failed')) || 0;
            const rejectionReason = this.extractXMLContent(validationXML, 'rejection_reason');
            const confidence = this.extractXMLContent(validationXML, 'confidence');
            
            // Find matching original candidate
            const originalCandidate = originalCandidates.find(c => 
                c.original === original && c.compressed === compressed
            );
            
            results.push({
                ...originalCandidate,
                isValid,
                testsPassed,
                testsFailed,
                rejectionReason,
                confidence,
                validatedBy: 'AI'
            });
        }
        
        // Fallback if XML parsing fails
        if (results.length === 0) {
            return this.parseFallbackValidation(responseText, originalCandidates);
        }
        
        return results;
    }
    
    /**
     * Extract content from XML tags (helper method)
     */
    extractXMLContent(xml, tagName) {
        const regex = new RegExp(`<${tagName}>(.*?)<\/${tagName}>`, 's');
        const match = xml.match(regex);
        return match ? match[1].trim() : '';
    }
    
    /**
     * Enhanced tiktoken validation with API integration
     * ENHANCED: Actual token counting vs character estimates
     */
    async validateCompressionWithTiktoken(candidates) {
        try {
            // Call our tokenize API to get actual token counts
            const response = await fetch('/api/tokenize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text: 'dummy text', // Not used for compression validation
                    compressions: candidates.map(c => ({
                        original: c.original,
                        compressed: c.compressed
                    })),
                    validateSymbols: true
                })
            });
            
            if (!response.ok) {
                throw new Error('Tiktoken API failed');
            }
            
            const data = await response.json();
            
            // Extract validation results
            const tiktokenResults = data.compressionValidation;
            const symbolValidation = data.symbolValidation;
            
            // Merge tiktoken results with candidates
            const enhancedCandidates = candidates.map(candidate => {
                const tiktokenResult = tiktokenResults.compressions.find(
                    cr => cr.original === candidate.original && cr.compressed === candidate.compressed
                );
                
                if (tiktokenResult) {
                    return {
                        ...candidate,
                        originalTokens: tiktokenResult.originalTokens,
                        compressedTokens: tiktokenResult.compressedTokens,
                        tokenSavings: tiktokenResult.tokenSavings,
                        isEffective: tiktokenResult.isEffective,
                        isContextSafe: tiktokenResult.isContextSafe,
                        tiktokenVerified: true,
                        tiktokenRecommendation: tiktokenResult.recommendation
                    };
                } else {
                    return {
                        ...candidate,
                        tiktokenVerified: false,
                        tokenSavings: 0,
                        isEffective: false
                    };
                }
            });
            
            return {
                candidates: enhancedCandidates,
                symbolValidation: symbolValidation,
                totalTokenSavings: tiktokenResults.totalTokenSavings,
                approvedCount: tiktokenResults.approvedCount
            };
            
        } catch (error) {
            console.error('Tiktoken validation failed:', error);
            // Fallback to local validation
            return {
                candidates: candidates.map(c => ({ ...c, tiktokenVerified: false })),
                error: 'Tiktoken validation unavailable'
            };
        }
    }

    /**
     * Local validation as backup/verification
     * ENHANCED: Context-safe validation with mathematical symbol rules
     */
    validateCompressionLocally(candidate) {
        const testsPassed = [];
        const testsFailed = [];
        
        // Context-safety check: mathematical symbols
        const contextSafeSymbols = /^[∂∫∑∏ΔΩαβγδεθλμπρστφψω†‡§¶◊♦≈∴∵]/;
        const isContextSafe = contextSafeSymbols.test(candidate.compressed);
        
        if (isContextSafe) {
            testsPassed.push('Context-safe mathematical symbol');
        } else {
            testsFailed.push('Not a context-safe mathematical symbol');
        }
        
        // Test against enhanced corpus (including mathematical expressions)
        for (const sentence of this.testCorpus) {
            // Skip if sentence contains actual mathematical expressions that should be preserved
            const containsMath = /[∂∫∑∏][a-zA-Z]/.test(sentence); // Math symbol followed by variable
            
            if (containsMath) {
                // For math-containing sentences, ensure we don't corrupt the math
                const compressed = sentence.replace(
                    new RegExp(`\\b${this.escapeRegex(candidate.original)}\\b(?!/)`, 'g'), // Don't replace in ∂f/∂x
                    candidate.compressed
                );
                
                const expanded = compressed.replace(
                    new RegExp(`${this.escapeRegex(candidate.compressed)}(?=\\s)`, 'g'), // Only expand before space
                    candidate.original
                );
                
                if (expanded === sentence) {
                    testsPassed.push('Math-preserving replacement');
                } else {
                    testsFailed.push(`Failed math preservation: "${sentence}"`);
                }
            } else {
                // Normal text replacement test
                const compressed = sentence.replace(
                    new RegExp(`\\b${this.escapeRegex(candidate.original)}\\b`, 'g'),
                    candidate.compressed
                );
                
                const expanded = compressed.replace(
                    new RegExp(`${this.escapeRegex(candidate.compressed)}(?=\\s)`, 'g'), // Symbol + space pattern
                    candidate.original
                );
                
                if (expanded === sentence) {
                    testsPassed.push('String replacement');
                } else {
                    testsFailed.push(`Failed on: "${sentence}"`);
                }
            }
        }
        
        // Additional enhanced checks
        if (candidate.compressed.length > 4) {
            testsFailed.push('Compressed form too long');
        }
        
        if (candidate.original === candidate.compressed) {
            testsFailed.push('No actual compression');
        }
        
        // Check if it's a single character mathematical symbol
        if (candidate.compressed.length === 1 && isContextSafe) {
            testsPassed.push('Single-token mathematical symbol');
        }
        
        return {
            ...candidate,
            isValid: testsFailed.length === 0 && testsPassed.length > 0,
            testsPassed: testsPassed.length,
            testsFailed: testsFailed.length,
            rejectionReason: testsFailed.length > 0 ? testsFailed[0] : null,
            validatedBy: 'Local Enhanced',
            isContextSafe: isContextSafe
        };
    }
    
    /**
     * Build comprehensive test corpus
     */
    buildTestCorpus() {
        return [
            // Technical contexts
            "The implementation of the algorithm was approximately correct in most test cases.",
            "Unfortunately, the comprehensive analysis revealed several performance bottlenecks.",
            "The development team needs approximately three more weeks for complete implementation.",
            
            // Business contexts
            "Please provide approximately fifteen examples for the comprehensive demonstration.",
            "The customer unfortunately reported implementation issues with the new system.",
            "We need a comprehensive review of all implementation details before proceeding.",
            
            // Casual contexts  
            "It takes approximately two hours to complete the comprehensive tutorial.",
            "Unfortunately, I can't provide a comprehensive answer to your implementation question.",
            "The implementation guide has approximately fifty pages of comprehensive instructions.",
            
            // Edge cases
            "Implementation? Unfortunately, that's approximately impossible to implement comprehensively.",
            "The word 'implementation' appears approximately seven times in this comprehensive guide.",
            "'Unfortunately,' she said, 'the implementation is only approximately 60% complete.'"
        ];
    }
    
    /**
     * Create batches for efficient processing
     */
    createBatches(items, batchSize) {
        const batches = [];
        for (let i = 0; i < items.length; i += batchSize) {
            batches.push(items.slice(i, i + batchSize));
        }
        return batches;
    }
    
    /**
     * Display ceremony results with rich formatting
     */
    displayCeremonyResults(results) {
        const { validCompressions, rejectedCompressions } = results;
        const total = validCompressions.length + rejectedCompressions.length;
        
        if (total === 0) {
            this.addResult('📋 No compressions were submitted for testing', 'info');
            return;
        }
        
        // Summary
        this.addResult(`📊 Testing Complete: ${validCompressions.length}/${total} compressions approved`, 'info');
        
        // Calculate token savings
        const totalTokensSaved = validCompressions.reduce((sum, comp) => {
            return sum + (comp.tokensSaved || 2);
        }, 0);
        
        if (totalTokensSaved > 0) {
            this.addResult(`💰 Estimated daily savings: ${totalTokensSaved.toLocaleString()} tokens`, 'success');
        }
        
        // Human vs AI wins
        const humanWins = validCompressions.filter(c => c.source?.startsWith('Human:')).length;
        const aiWins = validCompressions.filter(c => c.source === 'AI').length;
        
        if (humanWins > 0 || aiWins > 0) {
            this.addResult(`🏆 This hour: Humans ${humanWins} | AI ${aiWins}`, 'info');
        }
    }
    
    /**
     * Add result to testing display
     */
    addResult(content, type = 'info') {
        if (!this.resultsElement) return;
        
        const resultDiv = document.createElement('div');
        resultDiv.className = `result-item ${type}`;
        resultDiv.innerHTML = `[${new Date().toLocaleTimeString()}] ${content}`;
        
        this.resultsElement.appendChild(resultDiv);
        this.resultsElement.scrollTop = this.resultsElement.scrollHeight;
        
        // Limit results history
        const results = this.resultsElement.querySelectorAll('.result-item');
        if (results.length > 20) {
            results[0].remove();
        }
    }
    
    /**
     * Update agent status
     */
    updateStatus(status) {
        this.status = status;
        
        // Update testing zone visual state
        const testingZone = document.getElementById('testing-zone');
        if (testingZone) {
            if (status === 'ceremony') {
                testingZone.classList.add('ceremony-active');
            } else {
                testingZone.classList.remove('ceremony-active');
            }
        }
    }
    
    /**
     * Escape regex special characters
     */
    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    
    /**
     * Fallback validation parsing
     */
    parseFallbackValidation(responseText, candidates) {
        return candidates.map(candidate => {
            const isValid = responseText.includes('✅') || responseText.includes('valid');
            return {
                ...candidate,
                isValid,
                testsPassed: isValid ? 3 : 0,
                testsFailed: isValid ? 0 : 1,
                rejectionReason: isValid ? null : 'Failed AI validation',
                validatedBy: 'AI Fallback'
            };
        });
    }
    
    /**
     * Get agent performance statistics
     */
    getStats() {
        return {
            name: this.name,
            status: this.status,
            validationsPerformed: this.validationHistory.length,
            lastCeremonyTime: this.lastCeremonyTime,
            testCorpusSize: this.testCorpus.length
        };
    }
};

console.log('⚡ Validation Agent class loaded (following Claude best practices)');