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
            const tokenCount = Array.isArray(wordTokens) ? wordTokens.length : wordTokens;
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
            response.compressionValidation = validateCompressions(compressions, tokenizer);
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

function validateCompressions(compressions, tokenizer) {
    const validatedCompressions = compressions.map(compression => {
        const { original, compressed } = compression;
        
        // Get actual token counts
        const originalTokens = tokenizer.encode ? tokenizer.encode(original) : approximateTokenize(original);
        const compressedTokens = tokenizer.encode ? tokenizer.encode(compressed) : approximateTokenize(compressed);
        
        const originalCount = Array.isArray(originalTokens) ? originalTokens.length : originalTokens;
        const compressedCount = Array.isArray(compressedTokens) ? compressedTokens.length : compressedTokens;
        
        const tokenSavings = originalCount - compressedCount;
        const isEffective = tokenSavings > 0;
        const compressionRatio = originalCount > 0 ? (tokenSavings / originalCount * 100).toFixed(1) : 0;
        
        // Context-safety check: mathematical symbol + space + letter = compression
        const isContextSafe = /^[∂∫∑∏ΔΩαβγδεθλμπρστφψω†‡§¶◊♦≈∴∵]/.test(compressed);
        
        return {
            ...compression,
            originalTokens: originalCount,
            compressedTokens: compressedCount,
            tokenSavings,
            compressionRatio: compressionRatio + '%',
            isEffective,
            isContextSafe,
            recommendation: isEffective && isContextSafe ? 
                'APPROVED - Saves tokens and context-safe' : 
                !isEffective ? `REJECTED - No token savings (${originalCount} → ${compressedCount})` : 'REJECTED - Not context-safe'
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
        summary: `${approved.length}/${validatedCompressions.length} compressions approved with ${totalSavings} total token savings`
    };
}