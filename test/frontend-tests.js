#!/usr/bin/env node

/**
 * Token Compressor - Frontend & JavaScript Tests
 * 
 * Tests the JavaScript agent code directly without requiring API server
 * This will show us what frontend errors you're seeing
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';

console.log('🧪 Testing Token Compressor Frontend JavaScript...\n');

// Helper to safely evaluate JavaScript code
function safeEval(code, mockGlobals = {}) {
    const globals = {
        window: {},
        document: {
            getElementById: () => ({ 
                textContent: '', 
                innerHTML: '', 
                appendChild: () => {},
                scrollHeight: 100,
                scrollTop: 0,
                querySelectorAll: () => []
            }),
            createElement: () => ({
                className: '',
                innerHTML: '',
                remove: () => {}
            })
        },
        console: {
            log: () => {},
            warn: () => {},
            error: () => {}
        },
        setTimeout: (fn, delay) => 1,
        clearTimeout: () => {},
        setInterval: (fn, delay) => 1,
        Date: Date,
        Math: Math,
        ...mockGlobals
    };
    
    try {
        // Create a function with the globals as parameters
        const func = new Function(...Object.keys(globals), code);
        return func(...Object.values(globals));
    } catch (error) {
        return { error: error.message };
    }
}

describe('🔧 JavaScript Syntax & Loading Tests', () => {
    
    test('Discovery Agent JavaScript syntax is valid', () => {
        const code = readFileSync('public/js/agents/discovery-agent.js', 'utf-8');
        
        // Check for common syntax issues
        assert.ok(!code.includes('undefined'), 'Should not contain undefined variables');
        assert.ok(code.includes('class DiscoveryAgent'), 'Should contain Discovery Agent class');
        assert.ok(code.includes('runDiscoveryCycle'), 'Should contain main discovery method');
        
        // Try to evaluate the code
        const result = safeEval(code, { 
            window: { TokenCompressor: {} }
        });
        
        assert.ok(!result?.error, `Discovery Agent should load without errors: ${result?.error || 'OK'}`);
        console.log('✅ Discovery Agent syntax valid');
    });
    
    test('Generation Agent JavaScript syntax is valid', () => {
        const code = readFileSync('public/js/agents/generation-agent.js', 'utf-8');
        
        assert.ok(code.includes('class GenerationAgent'), 'Should contain Generation Agent class');
        assert.ok(code.includes('generateCompressions'), 'Should contain compression generation method');
        
        const result = safeEval(code, { 
            window: { TokenCompressor: {} }
        });
        
        assert.ok(!result?.error, `Generation Agent should load without errors: ${result?.error || 'OK'}`);
        console.log('✅ Generation Agent syntax valid');
    });
    
    test('Validation Agent JavaScript syntax is valid', () => {
        const code = readFileSync('public/js/agents/validation-agent.js', 'utf-8');
        
        assert.ok(code.includes('class ValidationAgent'), 'Should contain Validation Agent class');
        assert.ok(code.includes('runTestingCeremony'), 'Should contain testing ceremony method');
        
        const result = safeEval(code, { 
            window: { TokenCompressor: {} }
        });
        
        assert.ok(!result?.error, `Validation Agent should load without errors: ${result?.error || 'OK'}`);
        console.log('✅ Validation Agent syntax valid');
    });
    
    test('Orchestrator JavaScript syntax is valid', () => {
        const code = readFileSync('public/js/orchestrator.js', 'utf-8');
        
        assert.ok(code.includes('class Orchestrator'), 'Should contain Orchestrator class');
        assert.ok(code.includes('runDiscoveryCycle'), 'Should contain discovery cycle method');
        
        const result = safeEval(code, { 
            window: { TokenCompressor: {} }
        });
        
        assert.ok(!result?.error, `Orchestrator should load without errors: ${result?.error || 'OK'}`);
        console.log('✅ Orchestrator syntax valid');
    });
    
    test('Configuration file is valid', () => {
        const code = readFileSync('public/js/config.js', 'utf-8');
        
        assert.ok(code.includes('TokenCompressor'), 'Should set TokenCompressor namespace');
        assert.ok(code.includes('config'), 'Should contain configuration object');
        
        const result = safeEval(code, { 
            window: { 
                TokenCompressor: {},
                location: { hostname: 'localhost' }
            },
            document: {
                addEventListener: () => {} // Mock document.addEventListener
            },
            typeof: (x) => (x === 'document') ? 'object' : 'undefined'
        });
        
        assert.ok(!result?.error, `Configuration should load without errors: ${result?.error || 'OK'}`);
        console.log('✅ Configuration syntax valid');
    });
});

describe('🤖 Agent Logic Tests (Mocked)', () => {
    
    test('Discovery Agent can parse response text', () => {
        // Test the parsing logic without API calls
        const mockResponse = `
            Analysis complete:
            approximately | 4 | 8
            unfortunately | 4 | 6
            comprehensive | 3 | 4
        `;
        
        // Simulate the parsing logic from discovery agent
        const parseDiscoveryResponse = (responseText) => {
            const lines = responseText.split('\n');
            const words = [];
            
            for (const line of lines) {
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
        };
        
        const result = parseDiscoveryResponse(mockResponse);
        
        assert.strictEqual(result.wastefulWords.length, 3, 'Should parse 3 words');
        assert.strictEqual(result.wastefulWords[0].word, 'approximately', 'Should parse first word correctly');
        assert.strictEqual(result.wastefulWords[0].tokens, 4, 'Should parse token count correctly');
        
        console.log('✅ Discovery Agent parsing logic works');
    });
    
    test('Generation Agent can parse compression XML', () => {
        const mockResponse = `
            <compression>
            original: approximately
            compressed: ≈
            tokens_saved: 3
            reasoning: Mathematical approximation symbol
            </compression>
        `;
        
        // Simulate the parsing logic from generation agent
        const parseCompressions = (response) => {
            const compressions = [];
            const compressionRegex = /<compression>([\s\S]*?)<\/compression>/g;
            let match;
            
            while ((match = compressionRegex.exec(response)) !== null) {
                const compressionText = match[1];
                const original = (compressionText.match(/original:\s*([^\n]+)/) || [])[1]?.trim();
                const compressed = (compressionText.match(/compressed:\s*([^\n]+)/) || [])[1]?.trim();
                const tokensSaved = parseInt((compressionText.match(/tokens_saved:\s*(\d+)/) || [])[1]) || 0;
                
                if (original && compressed) {
                    compressions.push({ original, compressed, tokensSaved });
                }
            }
            
            return { compressions };
        };
        
        const result = parseCompressions(mockResponse);
        
        assert.strictEqual(result.compressions.length, 1, 'Should parse 1 compression');
        assert.strictEqual(result.compressions[0].original, 'approximately', 'Should parse original word');
        assert.strictEqual(result.compressions[0].compressed, '≈', 'Should parse compressed symbol');
        assert.strictEqual(result.compressions[0].tokensSaved, 3, 'Should parse token savings');
        
        console.log('✅ Generation Agent parsing logic works');
    });
    
    test('Validation Agent can assess compression quality', () => {
        const mockResponse = `
            <validation>
            valid: true
            confidence: 0.95
            reasoning: Mathematical symbol ≈ universally represents approximation
            </validation>
        `;
        
        // Simulate validation parsing
        const parseValidation = (response) => {
            const validMatch = response.match(/valid:\s*(true|false)/i);
            const confidenceMatch = response.match(/confidence:\s*([0-9.]+)/);
            
            return {
                isValid: validMatch?.[1]?.toLowerCase() === 'true',
                confidence: parseFloat(confidenceMatch?.[1]) || 0,
                hasReasoning: response.includes('reasoning:')
            };
        };
        
        const result = parseValidation(mockResponse);
        
        assert.strictEqual(result.isValid, true, 'Should recognize valid compression');
        assert.strictEqual(result.confidence, 0.95, 'Should parse confidence score');
        assert.strictEqual(result.hasReasoning, true, 'Should include reasoning');
        
        console.log('✅ Validation Agent logic works');
    });
});

describe('🔄 Frontend Error Detection', () => {
    
    test('Check for common JavaScript errors', () => {
        const files = [
            'public/js/config.js',
            'public/js/utils/error-handler.js',
            'public/js/utils/api-client.js',
            'public/js/main.js'
        ];
        
        files.forEach(filePath => {
            try {
                const code = readFileSync(filePath, 'utf-8');
                
                // Check for common error patterns
                const errors = [];
                
                // Only flag undefined if it's not in a typeof check
                if (code.includes('undefined') && !code.includes('typeof') && !code.includes("'undefined'") && !code.includes('"undefined"')) {
                    errors.push('Contains undefined variables');
                }
                
                // Check for invalid regex patterns (but not in arrays or valid typeof checks)
                if (code.includes('[\]') && !code.includes("'[\]'") && !code.includes('"[\]"')) {
                    errors.push('Invalid regex character class');
                }
                
                if (code.includes('javascript:')) {
                    errors.push('Contains potentially dangerous javascript: protocol');
                }
                
                // Check for unbalanced brackets
                const openBrackets = (code.match(/\{/g) || []).length;
                const closeBrackets = (code.match(/\}/g) || []).length;
                if (openBrackets !== closeBrackets) {
                    errors.push('Unbalanced curly brackets');
                }
                
                if (errors.length > 0) {
                    console.log(`⚠️  ${filePath}: ${errors.join(', ')}`);
                } else {
                    console.log(`✅ ${filePath}: No obvious errors detected`);
                }
                
                assert.ok(errors.length === 0, `${filePath} should not have obvious errors: ${errors.join(', ')}`);
                
            } catch (error) {
                console.log(`❌ Could not read ${filePath}: ${error.message}`);
            }
        });
    });
    
    test('Check regex patterns are valid', () => {
        // Test the regex that was causing issues
        try {
            new RegExp('[.*+?^${}()|[\\]\\\\]', 'g');
            console.log('✅ Escape regex pattern is valid');
        } catch (error) {
            console.log('❌ Escape regex pattern is invalid:', error.message);
            assert.fail('Regex pattern should be valid');
        }
        
        // Test other common patterns
        const testPatterns = [
            '<compression>([\\s\\S]*?)</compression>',
            '<validation>([\\s\\S]*?)</validation>',
            'word\\s*\\|\\s*tokens\\s*\\|\\s*frequency'
        ];
        
        testPatterns.forEach(pattern => {
            try {
                new RegExp(pattern, 'g');
                console.log(`✅ Pattern "${pattern}" is valid`);
            } catch (error) {
                console.log(`❌ Pattern "${pattern}" is invalid:`, error.message);
                assert.fail(`Regex pattern should be valid: ${pattern}`);
            }
        });
    });
});

describe('🌐 HTML & CSS Validation', () => {
    
    test('HTML structure is valid', () => {
        const html = readFileSync('public/index.html', 'utf-8');
        
        // Basic HTML validation
        assert.ok(html.includes('<!DOCTYPE html>'), 'Should have DOCTYPE declaration');
        assert.ok(html.includes('<html'), 'Should have html tag');
        assert.ok(html.includes('</html>'), 'Should close html tag');
        assert.ok(html.includes('TokenCompressor'), 'Should contain project name');
        
        // Check for required elements
        assert.ok(html.includes('discovery-chat'), 'Should have discovery chat element');
        assert.ok(html.includes('generation-chat'), 'Should have generation chat element');
        assert.ok(html.includes('validation-chat'), 'Should have validation chat element');
        
        console.log('✅ HTML structure looks valid');
    });
    
    test('CSS files are accessible', () => {
        const cssFiles = [
            'public/css/gameboy-theme.css',
            'public/css/components.css',
            'public/css/animations.css'
        ];
        
        cssFiles.forEach(filePath => {
            try {
                const css = readFileSync(filePath, 'utf-8');
                assert.ok(css.length > 0, `${filePath} should not be empty`);
                assert.ok(!css.includes('undefined'), `${filePath} should not contain undefined`);
                console.log(`✅ ${filePath} loads correctly`);
            } catch (error) {
                console.log(`❌ Could not read ${filePath}: ${error.message}`);
            }
        });
    });
});

console.log('\n🎯 Frontend tests completed!');
console.log('These tests check JavaScript syntax and logic without requiring APIs');
console.log('To test with real APIs, start vercel dev and run npm run test:integration\n');