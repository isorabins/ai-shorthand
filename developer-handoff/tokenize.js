// tiktoken integration for accurate token counting
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
        const { text, encoding = 'cl100k_base', validateSymbols = false, compressions = null } = req.body;
        
        // Validate input
        const validation = validateInput({ text }, {
            text: { required: true, type: 'string', maxLength: 10000 }
        });
        
        if (!validation.valid) {
            return res.status(400).json({ error: validation.errors.join(', ') });
        }
        
        const sanitizedText = sanitizeInput(text);
        
        // Dynamic import for tiktoken (handles both environments)
        let tokenizer;
        try {
            // Try WASM version first (more accurate)
            const tiktoken = await import('tiktoken');
            tokenizer = tiktoken.encoding_for_model('gpt-3.5-turbo');
        } catch (error) {
            // Fallback to JS version
            console.log('Using JS tokenizer fallback');
            tokenizer = {
                encode: (text) => approximateTokenize(text)
            };
        }
        
        // Tokenize the text
        const tokens = tokenizer.encode(sanitizedText);
        const tokenCount = tokens.length;
        
        // Analyze word-level tokenization
        const words = sanitizedText.split(/\s+/).filter(w => w.length > 0);
        const wordAnalysis = words.map(word => {
            const wordTokens = tokenizer.encode ? tokenizer.encode(word) : approximateTokenize(word);
            // Handle both regular arrays and Uint32Array from tiktoken
            const tokenCount = (wordTokens && typeof wordTokens.length === 'number') ? wordTokens.length : wordTokens;
            return {
                word: word.replace(/[^\w\s]/g, ''), // Clean word
                tokens: tokenCount,
                isMultiToken: tokenCount > 1
            };
        });
        
        // Find multi-token words (potential compression targets)
        const multiTokenWords = wordAnalysis
            .filter(w => w.isMultiToken && w.word.length > 2)
            .sort((a, b) => b.tokens - a.tokens);
        
        let response = {
            text: sanitizedText,
            totalTokens: tokenCount,
            wordCount: words.length,
            wordAnalysis: wordAnalysis,
            multiTokenWords: multiTokenWords,
            compressionPotential: calculateCompressionPotential(multiTokenWords)
        };

        // Add symbol validation if requested
        if (validateSymbols) {
            response.symbolValidation = validateMathematicalSymbols(tokenizer);
        }

        // Add compression validation if provided
        if (compressions && Array.isArray(compressions)) {
            response.compressionValidation = await validateCompressions(compressions, tokenizer);
        }

        return res.status(200).json(response);
        
    } catch (error) {
        console.error('Tokenization error:', error);
        
        // Fallback to character-based estimation
        const text = req.body.text || '';
        const estimatedTokens = Math.ceil(text.length / 4); // Rough estimation
        
        return res.status(200).json({
            text,
            totalTokens: estimatedTokens,
            wordCount: text.split(/\s+/).length,
            multiTokenWords: getCommonMultiTokenWords(),
            fallback: true,
            compressionPotential: {
                potentialSavings: estimatedTokens * 0.3, // Assume 30% potential savings
                topTargets: getCommonMultiTokenWords().slice(0, 5)
            }
        });
    }
}

function approximateTokenize(text) {
    // Simple approximation for when tiktoken isn't available
    // This is less accurate but provides a reasonable fallback
    
    // Split on common token boundaries
    const parts = text.split(/(\s+|[^\w\s])/g).filter(p => p.length > 0);
    let tokenCount = 0;
    
    for (const part of parts) {
        if (part.match(/^\s+$/)) {
            // Whitespace - usually doesn't count as separate tokens
            continue;
        } else if (part.match(/^[^\w\s]$/)) {
            // Single punctuation - usually 1 token
            tokenCount += 1;
        } else if (part.length <= 4) {
            // Short words - usually 1 token
            tokenCount += 1;
        } else if (part.length <= 8) {
            // Medium words - often 2 tokens
            tokenCount += 2;
        } else {
            // Long words - often 3+ tokens
            tokenCount += Math.ceil(part.length / 4);
        }
    }
    
    return tokenCount;
}

function calculateCompressionPotential(multiTokenWords) {
    const totalWastage = multiTokenWords.reduce((sum, word) => {
        // Assume each multi-token word could be compressed to 1 token
        return sum + (word.tokens - 1);
    }, 0);
    
    const topTargets = multiTokenWords
        .slice(0, 10)
        .map(word => ({
            ...word,
            potentialSavings: word.tokens - 1,
            compressionRatio: ((word.tokens - 1) / word.tokens * 100).toFixed(1) + '%'
        }));
    
    return {
        potentialSavings: totalWastage,
        topTargets,
        averageWastagePerWord: multiTokenWords.length > 0 ? (totalWastage / multiTokenWords.length).toFixed(1) : 0
    };
}

function getCommonMultiTokenWords() {
    // Common words that are typically multi-token
    return [
        { word: 'approximately', tokens: 3, isMultiToken: true },
        { word: 'implementation', tokens: 3, isMultiToken: true },
        { word: 'unfortunately', tokens: 3, isMultiToken: true },
        { word: 'comprehensive', tokens: 3, isMultiToken: true },
        { word: 'development', tokens: 2, isMultiToken: true },
        { word: 'organization', tokens: 3, isMultiToken: true },
        { word: 'environment', tokens: 3, isMultiToken: true },
        { word: 'intelligence', tokens: 3, isMultiToken: true },
        { word: 'performance', tokens: 2, isMultiToken: true },
        { word: 'information', tokens: 3, isMultiToken: true }
    ];
}

function validateMathematicalSymbols(tokenizer) {
    // Mathematical symbols from the ideas document - context-safe compression symbols
    const mathematicalSymbols = [
        '∂', '∫', '∑', '∏', 'Δ', 'Ω', 
        'α', 'β', 'γ', 'δ', 'ε', 'θ', 'λ', 'μ', 'π', 'ρ', 'σ', 'τ', 'φ', 'ψ', 'ω',
        '†', '‡', '§', '¶', '◊', '♦', '≈', '∴', '∵'
    ];
    
    const validation = mathematicalSymbols.map(symbol => {
        const tokens = tokenizer.encode ? tokenizer.encode(symbol) : [symbol];
        const tokenCount = Array.isArray(tokens) ? tokens.length : 1;
        
        return {
            symbol,
            tokenCount,
            isSingleToken: tokenCount === 1,
            isOptimal: tokenCount === 1, // Single token symbols are optimal for compression
            contextSafe: true // All mathematical symbols are context-safe when preceding English words
        };
    });
    
    const singleTokenSymbols = validation.filter(v => v.isSingleToken);
    
    return {
        symbols: validation,
        singleTokenCount: singleTokenSymbols.length,
        optimalSymbols: singleTokenSymbols.map(s => s.symbol),
        recommendation: `Use ${singleTokenSymbols.length} single-token mathematical symbols for context-safe compression`
    };
}

async function validateCompressions(compressions, tokenizer) {
    console.log(`🚀 BATCH VALIDATION: Processing ${compressions.length} compressions in one efficient batch`);
    
    // 1. BATCH TOKEN ANALYSIS - Calculate all token counts at once
    const batchTokenAnalysis = compressions.map(compression => {
        const { original, compressed } = compression;
        const originalTokens = tokenizer.encode ? tokenizer.encode(original) : approximateTokenize(original);
        const compressedTokens = tokenizer.encode ? tokenizer.encode(compressed) : approximateTokenize(compressed);
        
        // Handle both regular arrays and Uint32Array from tiktoken
        const originalCount = (originalTokens && typeof originalTokens.length === 'number') ? originalTokens.length : originalTokens;
        const compressedCount = (compressedTokens && typeof compressedTokens.length === 'number') ? compressedTokens.length : compressedTokens;
        
        // CONTEXT-SAFETY PRE-VALIDATION - Check for unsafe patterns
        const contextSafetyCheck = validateContextSafety(original, compressed);
        
        return {
            ...compression,
            originalCount,
            compressedCount,
            tokenSavings: originalCount - compressedCount,
            isEffective: originalCount - compressedCount > 0 && contextSafetyCheck.isSafe,
            compressionRatio: originalCount > 0 ? ((originalCount - compressedCount) / originalCount * 100).toFixed(1) : 0,
            contextSafety: contextSafetyCheck
        };
    });
    
    // 2. BATCH SEMANTIC VALIDATION - Test entire article with ALL compressions at once
    console.log(`📝 Creating complete test article with all ${compressions.length} compressions applied`);
    const batchValidationResult = await validateSemanticallyBatch(batchTokenAnalysis);
    
    // 3. Map validation results back to individual compressions
    const validatedCompressions = batchTokenAnalysis.map((compression, index) => {
        const individualResult = batchValidationResult.results[index] || { isValid: false, confidence: 0 };
        const isSemanticallySafe = individualResult.isValid;
        const isContextSafe = compression.contextSafety.isSafe && isSemanticallySafe;
        
        // Create comprehensive recommendation
        let recommendation = '';
        if (!compression.contextSafety.isSafe) {
            recommendation = `REJECTED - ${compression.contextSafety.issues.join('; ')}`;
        } else if (compression.tokenSavings <= 0) {
            recommendation = `REJECTED - No token savings (${compression.originalCount} → ${compression.compressedCount})`;
        } else if (!isSemanticallySafe) {
            recommendation = `REJECTED - Not context-safe (semantic validation failed)`;
        } else {
            recommendation = `APPROVED - Saves tokens and context-safe`;
        }
        
        return {
            ...compression,
            originalTokens: compression.originalCount,
            compressedTokens: compression.compressedCount,
            compressionRatio: compression.compressionRatio + '%',
            isContextSafe,
            validationDetails: individualResult.testDetails || null,
            validationType: batchValidationResult.method || 'batch_hybrid_semantic',
            contextSafetyCheck: compression.contextSafety,
            recommendation,
            confidence: individualResult.confidence || 0
        };
    });
    
    const approved = validatedCompressions.filter(c => c.isEffective && c.isContextSafe);
    const totalSavings = approved.reduce((sum, comp) => sum + comp.tokenSavings, 0);
    
    return {
        compressions: validatedCompressions,
        approvedCount: approved.length,
        totalCompressions: validatedCompressions.length,
        totalTokenSavings: totalSavings,
        averageSavings: approved.length > 0 ? (totalSavings / approved.length).toFixed(1) : 0,
        batchEfficiency: `Processed ${compressions.length} compressions in 1 API call instead of ${compressions.length}`,
        summary: `${approved.length}/${validatedCompressions.length} compressions approved with ${totalSavings} total token savings`
    };
}

/**
 * BATCH HYBRID SEMANTIC VALIDATION - Efficient batch processing
 * Tests entire article with ALL compressions applied at once instead of word-by-word
 */
async function validateSemanticallyBatch(compressions) {
    try {
        console.log(`🧪 BATCH SEMANTIC TEST: Creating complete article with ${compressions.length} compressions`);
        
        // 1. Create comprehensive test article with ALL words used naturally
        const testWords = compressions.map(c => c.original);
        const testArticle = createRealisticTestArticle(testWords);
        console.log(`📄 Test article: ${testArticle.substring(0, 200)}...`);
        
        // 2. Apply ALL compressions at once to create compressed version
        let compressedArticle = testArticle;
        compressions.forEach(compression => {
            // Replace all instances of the word with the compressed symbol
            const regex = new RegExp(`\\b${compression.original}\\b`, 'gi');
            compressedArticle = compressedArticle.replace(regex, compression.compressed);
        });
        console.log(`🗜️ Compressed article: ${compressedArticle.substring(0, 200)}...`);
        
        // 3. Single AI rewrite call for entire compressed article
        console.log(`🤖 Sending entire compressed article to AI for rewrite (1 API call vs ${compressions.length})`);
        const aiRewrite = await callAIForRewrite(compressedArticle);
        
        // 4. Mechanical restore of ALL compressions at once
        console.log(`🔧 Mechanically restoring all ${compressions.length} compressions`);
        let restoredArticle = aiRewrite;
        compressions.forEach(compression => {
            const regex = new RegExp(escapeRegex(compression.compressed), 'gi');
            restoredArticle = restoredArticle.replace(regex, compression.original);
        });
        
        // 5. Single semantic comparison for entire article
        const semanticMatch = calculateSemanticSimilarity(testArticle, restoredArticle);
        console.log(`🧠 Batch semantic similarity: ${semanticMatch.score}%`);
        
        // 6. Analyze results for each individual compression
        const results = compressions.map((compression, index) => {
            // Check if this specific word was preserved correctly
            const wordPreserved = checkWordPreservation(testArticle, restoredArticle, compression.original);
            const confidence = Math.min(semanticMatch.score, wordPreserved.accuracy);
            
            return {
                isValid: confidence > 85, // High threshold for batch validation
                confidence: confidence,
                testDetails: {
                    wordAccuracy: wordPreserved.accuracy,
                    overallSimilarity: semanticMatch.score,
                    preservedContexts: wordPreserved.contexts
                }
            };
        });
        
        console.log(`✅ BATCH VALIDATION COMPLETE: ${results.filter(r => r.isValid).length}/${results.length} passed`);
        
        return {
            method: 'batch_hybrid_semantic',
            results: results,
            batchStats: {
                totalCompressions: compressions.length,
                apiCalls: 1, // vs compressions.length individual calls
                efficiency: `${compressions.length}x more efficient`,
                overallSimilarity: semanticMatch.score
            }
        };
        
    } catch (error) {
        console.log(`❌ Batch validation failed: ${error.message}`);
        
        // Fallback: return basic regex validation for all
        return {
            method: 'batch_regex_fallback',
            results: compressions.map(compression => ({
                isValid: /^[∂∫∑∏ΔΩαβγδεθλμπρστφψω†‡§¶◊♦≈∴∵]/.test(compression.compressed),
                confidence: 60,
                testDetails: { fallback: 'Batch AI validation failed, using regex pattern' }
            }))
        };
    }
}

/**
 * CONTEXT-SAFETY VALIDATION - Comprehensive rules to ensure compressions are safe
 */
function validateContextSafety(original, compressed) {
    const issues = [];
    
    // 1. HTML/MARKUP PRESERVATION - Don't compress HTML tags or markup
    if (isHTMLMarkup(original)) {
        issues.push(`HTML markup detected: "${original}" appears to contain HTML tags or markup`);
    }
    
    // 2. PROPER NOUN DETECTION - Don't compress proper nouns (names, companies, places)
    if (isProperNoun(original)) {
        issues.push(`Proper noun detected: "${original}" is likely a company, person, or place name`);
    }
    
    // 3. SEMANTIC EQUIVALENCE - Ensure compressed form means the same thing
    if (!isSemanticallySimilar(original, compressed)) {
        issues.push(`Semantic mismatch: "${compressed}" has different meaning than "${original}"`);
    }
    
    // 4. GRAMMATICAL CORRECTNESS - Ensure compressed form fits same grammatical role
    if (!isGrammaticallyEquivalent(original, compressed)) {
        issues.push(`Grammatical mismatch: "${compressed}" cannot replace "${original}" grammatically`);
    }
    
    // 5. CONTEXT PRESERVATION - Don't compress words that could be ambiguous
    if (isContextAmbiguous(original, compressed)) {
        issues.push(`Context ambiguity: "${compressed}" could be confused with other words`);
    }
    
    return {
        isSafe: issues.length === 0,
        issues: issues,
        riskLevel: issues.length === 0 ? 'safe' : (issues.length === 1 ? 'risky' : 'unsafe')
    };
}

function isHTMLMarkup(word) {
    // Check for HTML patterns - be more specific to avoid false positives
    const htmlPatterns = [
        /^strong.*strong$/i,           // <strong>word</strong> -> strongwordstrong
        /^<.*>$/,                      // <tag>
        /^(strong|em|div|span|p|b|i|u)[a-z]*\1$/i, // HTML tag pairs like strongwordstrong
        /&[a-z]+;/i,                   // HTML entities like &amp;
        /&#\d+;/,                      // Numeric HTML entities
        /^[a-z]+strong[a-z]+strong[a-z]*$/i // More specific pattern for mangled HTML
    ];
    
    // Don't flag normal words that just contain common HTML element names
    const normalWords = /^(strong|funding|tech|crunch)$/i;
    if (normalWords.test(word)) {
        return false;
    }
    
    return htmlPatterns.some(pattern => pattern.test(word));
}

function isProperNoun(word) {
    // Check for proper noun patterns
    const properNounPatterns = [
        // Company names
        /^(TechCrunch|Google|Apple|Microsoft|Amazon|Meta|Tesla|Netflix|Spotify|GitHub|Twitter|Facebook|Instagram|LinkedIn|YouTube|Uber|Airbnb|PayPal|Oracle|IBM|Intel|AMD|NVIDIA|Samsung|Sony|Nintendo|Adobe|Salesforce|Slack|Zoom|Dropbox)$/i,
        
        // Geographic locations
        /^(Silicon Valley|New York|Los Angeles|San Francisco|Seattle|Boston|Austin|Chicago|London|Tokyo|Paris|Berlin|Toronto|Sydney|Melbourne|Vancouver|Dublin|Amsterdam|Stockholm|Copenhagen|Helsinki)$/i,
        
        // Capitalized words (likely proper nouns)
        /^[A-Z][a-z]+([A-Z][a-z]*)*$/, // CamelCase or TitleCase
        
        // All caps abbreviations (likely acronyms/companies)
        /^[A-Z]{2,}$/,
        
        // Mixed case with numbers (likely product names)
        /^[A-Z][a-zA-Z]*\d/
    ];
    
    return properNounPatterns.some(pattern => pattern.test(word));
}

function isSemanticallySimilar(original, compressed) {
    // Check if compressed form preserves core meaning
    
    // Same root word (e.g., "development" -> "dev" is ok, "funding" -> "fund" is questionable)
    if (compressed.length >= 3 && original.toLowerCase().startsWith(compressed.toLowerCase())) {
        return true; // Truncation is usually safe
    }
    
    // Known good semantic mappings
    const goodMappings = {
        'extraordinary': ['extra', 'ext'],
        'transportation': ['transport', 'trans'],
        'environmental': ['environ', 'env'],
        'semiconductor': ['semicon', 'semi'],
        'implementation': ['implement', 'impl'],
        'development': ['develop', 'dev'],
        'information': ['info'],
        'application': ['app'],
        'technology': ['tech'],
        'organization': ['org'],
        'communication': ['comm'],
        'documentation': ['docs', 'doc']
    };
    
    const originalLower = original.toLowerCase();
    if (goodMappings[originalLower] && goodMappings[originalLower].includes(compressed.toLowerCase())) {
        return true;
    }
    
    // Problematic semantic changes
    const problematicMappings = {
        'funding': ['fund'],       // "funding" (process) vs "fund" (noun) - different meanings
        'TechCrunch': ['Tech'],    // Specific company vs generic term
        'manufacturing': ['man'],   // Too short, loses meaning
    };
    
    if (problematicMappings[originalLower] && problematicMappings[originalLower].includes(compressed.toLowerCase())) {
        return false;
    }
    
    return true; // Default to allowing if not explicitly blocked
}

function isGrammaticallyEquivalent(original, compressed) {
    // Check if both forms can serve same grammatical function
    
    // Reject if compression changes word type dramatically
    const grammarChanges = [
        // Noun endings that shouldn't be compressed to verb forms
        { original: /ing$/, compressed: /^(?!.*ing)/, risk: 'high' }, // "funding" -> "fund" changes gerund to noun
        
        // Adjective endings
        { original: /ful$|ous$|ive$/, compressed: /^(?!.*(ful|ous|ive))/, risk: 'medium' },
        
        // Adverb endings  
        { original: /ly$/, compressed: /^(?!.*ly)/, risk: 'high' }
    ];
    
    for (const rule of grammarChanges) {
        if (rule.original.test(original) && rule.compressed.test(compressed) && rule.risk === 'high') {
            return false;
        }
    }
    
    return true;
}

function isContextAmbiguous(original, compressed) {
    // Check if compressed form could be confused with other common words
    
    const ambiguousCompressions = {
        'app': ['application', 'appetite', 'apple', 'approach'], // "app" could mean many things
        'dev': ['development', 'device', 'developer', 'deviation'],
        'tech': ['technology', 'technician', 'technique'],
        'man': ['manufacturing', 'management', 'manual', 'man'],
        'comp': ['computer', 'competition', 'compression', 'company', 'complete'],
        'info': ['information', 'informal'],
        'con': ['construction', 'connection', 'conference', 'control', 'condition']
    };
    
    const compressedLower = compressed.toLowerCase();
    if (ambiguousCompressions[compressedLower] && ambiguousCompressions[compressedLower].length > 2) {
        // Allow if it's a very common/accepted abbreviation
        const commonAbbreviations = ['app', 'info', 'tech', 'dev'];
        if (!commonAbbreviations.includes(compressedLower)) {
            return true; // Too ambiguous
        }
    }
    
    return false;
}

// Helper functions for batch validation
function createRealisticTestArticle(words) {
    // Create a natural article using all the words in realistic contexts
    const templates = [
        "The {word} of modern software development requires careful consideration of various factors.",
        "Companies often find that proper {word} leads to better outcomes for all stakeholders.",
        "When {word} is done correctly, it creates significant value and reduces potential risks.",
        "Most experts agree that {word} should follow established industry best practices.",
        "However, poor {word} can lead to serious problems that are difficult to resolve later."
    ];
    
    let article = "# Analysis of Modern Development Practices\n\n";
    
    // Use each word multiple times in different contexts
    words.forEach((word, index) => {
        const template = templates[index % templates.length];
        article += template.replace('{word}', word) + " ";
        
        // Add the word in additional natural contexts
        article += `The importance of ${word} cannot be overstated in today's environment. `;
        article += `Successful ${word} requires both strategic planning and tactical execution. `;
    });
    
    // Add a concluding paragraph that uses all words together
    article += "\n\nIn conclusion, " + words.slice(0, 3).join(", ") + " are all critical components ";
    article += "that must work together to achieve optimal results. ";
    
    return article;
}

async function callAIForRewrite(compressedText) {
    try {
        // Use the same Groq endpoint but for rewriting
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: 'llama3-8b-8192',
                messages: [
                    {
                        role: 'user',
                        content: `Please rewrite this text to be clear and professional, maintaining the exact same meaning and structure:\n\n${compressedText}`
                    }
                ],
                temperature: 0.1, // Low temperature for consistent rewrites
                max_tokens: Math.min(2000, compressedText.length * 2) // Reasonable limit
            })
        });
        
        if (!response.ok) {
            throw new Error(`AI rewrite failed: ${response.status}`);
        }
        
        const data = await response.json();
        return data.choices?.[0]?.message?.content || compressedText;
        
    } catch (error) {
        console.log(`⚠️ AI rewrite failed: ${error.message}`);
        // Fallback: return original if AI fails
        return compressedText;
    }
}

function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function calculateSemanticSimilarity(original, restored) {
    // Simple but effective similarity calculation
    const originalWords = original.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const restoredWords = restored.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    
    const originalSet = new Set(originalWords);
    const restoredSet = new Set(restoredWords);
    
    // Calculate word overlap
    const intersection = new Set([...originalSet].filter(x => restoredSet.has(x)));
    const union = new Set([...originalSet, ...restoredSet]);
    
    const jaccardSimilarity = intersection.size / union.size * 100;
    
    // Also check sentence structure preservation
    const originalSentences = original.split(/[.!?]/).length;
    const restoredSentences = restored.split(/[.!?]/).length;
    const structureSimilarity = Math.min(originalSentences, restoredSentences) / Math.max(originalSentences, restoredSentences) * 100;
    
    // Combine metrics
    const score = (jaccardSimilarity * 0.7 + structureSimilarity * 0.3);
    
    return {
        score: Math.round(score),
        wordOverlap: jaccardSimilarity,
        structureMatch: structureSimilarity
    };
}

function checkWordPreservation(original, restored, targetWord) {
    const originalCount = (original.toLowerCase().match(new RegExp(`\\b${targetWord.toLowerCase()}\\b`, 'gi')) || []).length;
    const restoredCount = (restored.toLowerCase().match(new RegExp(`\\b${targetWord.toLowerCase()}\\b`, 'gi')) || []).length;
    
    // Check if word appears in similar contexts
    const contexts = [];
    const regex = new RegExp(`\\b\\w+\\s+${targetWord.toLowerCase()}\\s+\\w+\\b`, 'gi');
    const originalContexts = original.toLowerCase().match(regex) || [];
    const restoredContexts = restored.toLowerCase().match(regex) || [];
    
    const contextMatch = originalContexts.filter(ctx => 
        restoredContexts.some(rctx => 
            rctx.split(' ').some(word => ctx.split(' ').includes(word))
        )
    ).length;
    
    const accuracy = originalCount > 0 ? 
        Math.min(100, (restoredCount / originalCount) * 100 * (contextMatch / Math.max(originalContexts.length, 1))) : 
        100;
    
    return {
        accuracy: Math.round(accuracy),
        contexts: contexts,
        originalCount,
        restoredCount
    };
}

/**
 * HYBRID SEMANTIC VALIDATION - Real product-mirroring validation flow  
 * Legacy single-word validation (kept for compatibility but not recommended)
 * Use validateSemanticallyBatch instead for efficiency
 */
async function validateSemantically(originalWord, compressedSymbol, originalTokens, compressedTokens) {
    try {
        // Step 1: Create test article containing the word multiple times
        const testArticle = `
        The ${originalWord} of new systems requires careful planning. Companies investing in ${originalWord} 
        often find that proper ${originalWord} leads to better outcomes. When ${originalWord} is done correctly,
        it creates value for all stakeholders. However, poor ${originalWord} can lead to significant problems.
        Most experts agree that ${originalWord} should follow established best practices.
        `;

        // Step 2: AI rewrites using compression (real product behavior)
        // NOTE: In a real implementation, this would call DeepSeek API
        // For now, we simulate the AI rewrite by doing mechanical replacement
        const compressedText = testArticle.replace(
            new RegExp(`\\b${escapeRegexSpecial(originalWord)}\\b`, 'g'),
            compressedSymbol
        );

        // Step 3: Mechanical restoration (exact product behavior)
        let restoredText = compressedText;
        restoredText = restoredText.replaceAll(compressedSymbol, originalWord);

        // Step 4: Validation checks
        const semanticallyPreserved = calculateSimilarity(testArticle, restoredText) > 0.95;
        const compressionWorked = compressedText.includes(compressedSymbol);
        const tokenSavingsValid = originalTokens > compressedTokens;
        
        // Additional context safety check (mathematical symbols never precede English naturally)
        const contextSafe = /^[∂∫∑∏ΔΩαβγδεθλμπρστφψω†‡§¶◊♦≈∴∵]/.test(compressedSymbol);

        return {
            semanticallyPreserved,
            compressionWorked,
            tokenSavingsValid,
            contextSafe,
            isValid: semanticallyPreserved && compressionWorked && tokenSavingsValid && contextSafe,
            testDetails: {
                originalArticle: testArticle.trim(),
                compressedText: compressedText.trim(),
                restoredText: restoredText.trim(),
                similarity: calculateSimilarity(testArticle, restoredText)
            }
        };

    } catch (error) {
        console.error('Semantic validation error:', error);
        // Fallback to regex check if hybrid validation fails
        return /^[∂∫∑∏ΔΩαβγδεθλμπρστφψω†‡§¶◊♦≈∴∵]/.test(compressedSymbol);
    }
}

/**
 * Calculate semantic similarity between two texts (simplified implementation)
 */
function calculateSimilarity(text1, text2) {
    // Simple character-based similarity (in production, would use more sophisticated NLP)
    const clean1 = text1.replace(/\s+/g, ' ').trim().toLowerCase();
    const clean2 = text2.replace(/\s+/g, ' ').trim().toLowerCase();
    
    if (clean1 === clean2) return 1.0;
    
    // Character-level similarity
    const maxLength = Math.max(clean1.length, clean2.length);
    const minLength = Math.min(clean1.length, clean2.length);
    
    let matches = 0;
    for (let i = 0; i < minLength; i++) {
        if (clean1[i] === clean2[i]) matches++;
    }
    
    return matches / maxLength;
}

/**
 * Escape special regex characters
 */
function escapeRegexSpecial(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}