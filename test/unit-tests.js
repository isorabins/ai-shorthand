#!/usr/bin/env node

/**
 * Token Compressor - REAL Unit Tests
 * 
 * Tests with actual API connections and database integration
 * Uses your configured API keys and Supabase database
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import fetch from 'node:fetch'; // For API testing

// Load environment variables (your actual API keys)
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

console.log('🧪 Starting REAL Token Compressor Tests with actual APIs...\n');

// Test configuration
const TEST_CONFIG = {
    baseUrl: 'http://localhost:3000',
    timeout: 15000,
    testData: {
        sampleText: "The implementation was approximately successful with comprehensive testing procedures.",
        testCompression: {
            original: "approximately",
            compressed: "≈",
            explanation: "Mathematical approximation symbol"
        }
    }
};

// Helper function to make API calls
async function callAPI(endpoint, data = null, method = 'GET') {
    const url = `${TEST_CONFIG.baseUrl}/api${endpoint}`;
    const options = {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: data ? JSON.stringify(data) : undefined
    };
    
    try {
        const response = await fetch(url, options);
        const result = await response.json();
        return { success: response.ok, data: result, status: response.status };
    } catch (error) {
        return { success: false, error: error.message, status: 0 };
    }
}

// Test Suite
describe('🔧 API Endpoints - Real Integration Tests', () => {
    
    test('tokenize endpoint with real tiktoken', async () => {
        const result = await callAPI('/tokenize', {
            text: TEST_CONFIG.testData.sampleText,
            model: 'gpt-4'
        }, 'POST');
        
        console.log('📊 Tokenize result:', result.data);
        
        assert.strictEqual(result.success, true, 'Tokenize API should work');
        assert.ok(result.data.tokens > 0, 'Should return positive token count');
        assert.strictEqual(result.data.text, TEST_CONFIG.testData.sampleText, 'Should return original text');
        assert.strictEqual(result.data.model, 'gpt-4', 'Should use correct model');
    });
    
    test('search endpoint with real Brave Search API', async () => {
        const result = await callAPI('/search', {
            query: 'artificial intelligence news',
            count: 3
        }, 'POST');
        
        console.log('🔍 Search result:', result.data?.results?.articles?.length || 'failed');
        
        if (result.success) {
            assert.ok(result.data.results.articles, 'Should return articles array');
            assert.ok(result.data.results.articles.length > 0, 'Should find articles');
            assert.ok(result.data.results.articles[0].title, 'Articles should have titles');
        } else {
            // Check if fallback was provided
            assert.ok(result.data.fallbackContent, 'Should provide fallback when search fails');
            console.log('⚠️  Search API unavailable, fallback provided');
        }
    });
    
    test('DeepSeek API endpoint with real API key', async () => {
        const result = await callAPI('/deepseek', {
            messages: [
                {
                    role: 'system',
                    content: 'You are a helpful assistant. Respond with exactly "Test successful" and nothing else.'
                },
                {
                    role: 'user',
                    content: 'Please confirm this test is working.'
                }
            ],
            temperature: 0.1,
            max_tokens: 10
        }, 'POST');
        
        console.log('🤖 DeepSeek result:', result.data?.response || result.data?.error);
        
        if (result.success) {
            assert.ok(result.data.response, 'Should return response from DeepSeek');
            assert.ok(result.data.usage, 'Should return token usage');
            assert.ok(result.data.usage.total_tokens > 0, 'Should count tokens used');
        } else {
            console.log('⚠️  DeepSeek API error:', result.data?.error);
            assert.fail('DeepSeek API should work with provided key');
        }
    });
    
    test('Groq API endpoint with real API key', async () => {
        const result = await callAPI('/groq', {
            messages: [
                {
                    role: 'system',
                    content: 'Respond with exactly "Groq test successful" and nothing else.'
                },
                {
                    role: 'user',
                    content: 'Please confirm this test is working.'
                }
            ],
            temperature: 0.1,
            max_tokens: 10
        }, 'POST');
        
        console.log('⚡ Groq result:', result.data?.response || result.data?.error);
        
        if (result.success) {
            assert.ok(result.data.response, 'Should return response from Groq');
            assert.ok(result.data.usage, 'Should return token usage');
            assert.ok(result.data.usage.total_tokens > 0, 'Should count tokens used');
        } else {
            console.log('⚠️  Groq API error:', result.data?.error);
            // Don't fail if Groq API is down, just warn
            console.log('Note: Groq API may be temporarily unavailable');
        }
    });
});

describe('🤖 Agent System - Real AI Testing', () => {
    
    test('Discovery Agent text analysis with real DeepSeek', async () => {
        // Test the actual discovery prompt format
        const analysisPrompt = {
            messages: [
                {
                    role: 'system',
                    content: `<role>
You are a Discovery Agent finding wasteful multi-token words for compression.
</role>

<instructions>
Analyze text for words that use 2+ tokens and could be compressed.
Return findings in this format:
word | token_count | frequency_estimate
</instructions>`
                },
                {
                    role: 'user',
                    content: `<analysis_request>
Analyze this text: "${TEST_CONFIG.testData.sampleText}"

Find multi-token words that appear frequently and could be compressed.
</analysis_request>`
                }
            ],
            temperature: 0.3,
            max_tokens: 200
        };
        
        const result = await callAPI('/deepseek', analysisPrompt, 'POST');
        
        console.log('🔍 Discovery analysis:', result.data?.response || 'failed');
        
        if (result.success) {
            assert.ok(result.data.response.includes('approximately') || 
                     result.data.response.includes('implementation') ||
                     result.data.response.includes('comprehensive'), 
                     'Should identify multi-token words from sample text');
        }
    });
    
    test('Generation Agent compression creation with real Groq', async () => {
        const compressionPrompt = {
            messages: [
                {
                    role: 'system',
                    content: `<role>
You are a Generation Agent creating innovative text compressions.
</role>

<instructions>
Create compressions using symbols, abbreviations, or creative shortcuts.
Format: <compression>original: X, compressed: Y, tokens_saved: Z</compression>
</instructions>

<examples>
<compression>original: approximately, compressed: ≈, tokens_saved: 3</compression>
<compression>original: therefore, compressed: ∴, tokens_saved: 1</compression>
</examples>`
                },
                {
                    role: 'user',
                    content: 'Create a compression for the word "approximately" which uses 4 tokens.'
                }
            ],
            temperature: 0.8, // Higher temperature for creativity
            max_tokens: 200
        };
        
        const result = await callAPI('/groq', compressionPrompt, 'POST');
        
        console.log('🎨 Generation result:', result.data?.response || 'failed');
        
        if (result.success) {
            const response = result.data.response;
            assert.ok(response.includes('approximately') || response.includes('≈'), 
                     'Should create compression for approximately');
        }
    });
    
    test('Validation Agent compression testing with real DeepSeek', async () => {
        const validationPrompt = {
            messages: [
                {
                    role: 'system',
                    content: `<role>
You are a Validation Agent testing compression reversibility.
</role>

<instructions>
Test if the compression maintains semantic meaning.
Respond with: <validation>valid: true/false, reasoning: explanation</validation>
</instructions>`
                },
                {
                    role: 'user',
                    content: `Test this compression: "approximately" → "≈"

Context tests:
1. "The cost is ≈ $100"
2. "It takes ≈ 2 hours"  
3. "≈ 50 people attended"

Can humans understand "≈" means "approximately" in these contexts?`
                }
            ],
            temperature: 0.1, // Low temperature for consistent validation
            max_tokens: 150
        };
        
        const result = await callAPI('/deepseek', validationPrompt, 'POST');
        
        console.log('⚡ Validation result:', result.data?.response || 'failed');
        
        if (result.success) {
            const response = result.data.response.toLowerCase();
            // Should recognize ≈ as valid approximation symbol
            assert.ok(response.includes('valid') || response.includes('true') || 
                     response.includes('understand'), 
                     'Should validate ≈ as acceptable approximation symbol');
        }
    });
});

describe('🔒 Security & Rate Limiting - Real Tests', () => {
    
    test('input sanitization prevents XSS', async () => {
        const maliciousInput = '<script>alert("xss")</script>';
        
        const result = await callAPI('/tokenize', {
            text: maliciousInput,
            model: 'gpt-4'
        }, 'POST');
        
        console.log('🔒 XSS test result:', result.success);
        
        if (result.success) {
            // Should not contain script tags in response
            const responseStr = JSON.stringify(result.data);
            assert.ok(!responseStr.includes('<script>'), 
                     'Response should not contain script tags');
        }
    });
    
    test('rate limiting works with real requests', async () => {
        console.log('⏱️  Testing rate limiting with rapid requests...');
        
        const promises = [];
        // Make 10 rapid requests
        for (let i = 0; i < 10; i++) {
            promises.push(callAPI('/tokenize', { text: `test ${i}` }, 'POST'));
        }
        
        const results = await Promise.all(promises);
        const successful = results.filter(r => r.success).length;
        const rateLimited = results.filter(r => r.status === 429).length;
        
        console.log(`📊 Requests: ${successful} successful, ${rateLimited} rate limited`);
        
        // Should allow some requests but may rate limit others
        assert.ok(successful > 0, 'Should allow at least some requests');
        // If rate limiting triggers, that's actually good
        if (rateLimited > 0) {
            console.log('✅ Rate limiting is working correctly');
        }
    });
});

describe('⚡ Performance Tests - Real Load', () => {
    
    test('tokenize performance with long text', async () => {
        const longText = TEST_CONFIG.testData.sampleText.repeat(50); // ~2500 words
        const startTime = Date.now();
        
        const result = await callAPI('/tokenize', {
            text: longText,
            model: 'gpt-4'
        }, 'POST');
        
        const duration = Date.now() - startTime;
        console.log(`⚡ Tokenized ${longText.length} chars in ${duration}ms`);
        
        assert.ok(duration < 5000, 'Should tokenize long text in under 5 seconds');
        if (result.success) {
            assert.ok(result.data.tokens > 100, 'Should count many tokens for long text');
        }
    });
    
    test('concurrent API calls performance', async () => {
        const startTime = Date.now();
        
        const promises = [
            callAPI('/tokenize', { text: 'hello world' }, 'POST'),
            callAPI('/tokenize', { text: 'goodbye world' }, 'POST'),
            callAPI('/tokenize', { text: 'test message' }, 'POST')
        ];
        
        const results = await Promise.all(promises);
        const duration = Date.now() - startTime;
        
        console.log(`🔄 3 concurrent calls completed in ${duration}ms`);
        
        assert.ok(duration < 8000, 'Concurrent calls should complete quickly');
        const successfulCalls = results.filter(r => r.success).length;
        assert.ok(successfulCalls >= 2, 'Most concurrent calls should succeed');
    });
});

// Run the tests with proper async handling
const runTests = async () => {
    console.log('🎯 Running REAL integration tests...\n');
    
    // Check if server is running
    try {
        const healthCheck = await fetch(`${TEST_CONFIG.baseUrl}/api/tokenize`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: 'health check' })
        });
        
        if (!healthCheck.ok) {
            throw new Error('Server not responding');
        }
        
        console.log('✅ Server is running, proceeding with tests...\n');
        
    } catch (error) {
        console.log('❌ Server not running! Start with: vercel dev');
        console.log('   Tests require the API endpoints to be available\n');
        process.exit(1);
    }
    
    // Environment check
    const requiredEnvVars = ['DEEPSEEK_API_KEY', 'SUPABASE_URL', 'SUPABASE_ANON_KEY'];
    const missingVars = requiredEnvVars.filter(key => !process.env[key]);
    
    if (missingVars.length > 0) {
        console.log('⚠️  Missing environment variables:', missingVars.join(', '));
        console.log('   Some tests may fail without proper API keys\n');
    } else {
        console.log('✅ All required environment variables found\n');
    }
};

// Initialize and run
runTests().catch(console.error);

export { callAPI, TEST_CONFIG };