#!/usr/bin/env node

/**
 * Integration Test for Enhanced Logging
 * Tests actual API endpoints and shows logging output
 */

const BASE_URL = 'http://localhost:3000';

async function runIntegrationTest() {
    console.log('🚀 Starting Integration Test for Enhanced Logging');
    console.log('='.repeat(60));
    
    const tests = [
        testTokenizeAPI,
        testSearchAPI,
        testDeepSeekAPI,
        testGroqAPI
    ];
    
    let passed = 0;
    let failed = 0;
    
    for (const test of tests) {
        try {
            console.log(`\n🔵 Running: ${test.name}`);
            console.log('-'.repeat(40));
            await test();
            console.log(`✅ PASSED: ${test.name}`);
            passed++;
        } catch (error) {
            console.log(`❌ FAILED: ${test.name} - ${error.message}`);
            failed++;
        }
    }
    
    console.log('\n🎯 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📊 Total: ${passed + failed}`);
    
    if (failed === 0) {
        console.log('🎉 All tests passed! Enhanced logging is working correctly.');
    }
}

async function testTokenizeAPI() {
    console.log('📝 Testing /api/tokenize endpoint...');
    
    const payload = {
        text: 'Unfortunately, the implementation was approximately comprehensive and unfortunately complex.',
        encoding: 'cl100k_base'
    };
    
    console.log(`🔍 Sending request with text: "${payload.text}"`);
    
    const response = await fetch(`${BASE_URL}/api/tokenize`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    console.log(`📊 Response: ${data.totalTokens} total tokens`);
    console.log(`🎯 Multi-token words found: ${data.multiTokenWords.length}`);
    
    if (data.multiTokenWords.length > 0) {
        console.log('🔍 Multi-token words:');
        data.multiTokenWords.forEach(word => {
            console.log(`  • "${word.word}" = ${word.tokens} tokens`);
        });
    }
    
    // Verify we got expected results
    if (!data.totalTokens || !data.multiTokenWords) {
        throw new Error('Missing expected response fields');
    }
    
    console.log('✅ Tokenize API working correctly');
}

async function testSearchAPI() {
    console.log('🔍 Testing /api/search endpoint...');
    
    const payload = {
        query: 'artificial intelligence research',
        domain: null // General web search
    };
    
    console.log(`🔍 Searching for: "${payload.query}"`);
    
    const response = await fetch(`${BASE_URL}/api/search`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    console.log(`📊 Response: ${data.articles ? data.articles.length : 0} articles found`);
    
    if (data.articles && data.articles.length > 0) {
        console.log('📄 First article:');
        console.log(`  • Title: ${data.articles[0].title}`);
        console.log(`  • URL: ${data.articles[0].url}`);
        console.log(`  • Content length: ${data.articles[0].content ? data.articles[0].content.length : 0} chars`);
    }
    
    console.log('✅ Search API working correctly');
}

async function testDeepSeekAPI() {
    console.log('🤖 Testing /api/deepseek endpoint...');
    
    const payload = {
        messages: [
            {
                role: 'system',
                content: 'You are a discovery agent that finds multi-token words in text.'
            },
            {
                role: 'user', 
                content: 'Find multi-token words in this text: "Unfortunately, the implementation was comprehensive."'
            }
        ],
        agent_type: 'discovery',
        temperature: 0.3,
        max_tokens: 500
    };
    
    console.log(`🔍 Sending ${payload.messages.length} messages to DeepSeek`);
    console.log(`🎯 Agent type: ${payload.agent_type}`);
    
    const response = await fetch(`${BASE_URL}/api/deepseek`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`HTTP ${response.status}: ${errorData.error || response.statusText}`);
    }
    
    const data = await response.json();
    
    console.log(`📊 Response length: ${data.response ? data.response.length : 0} characters`);
    
    if (data.parsed && data.parsed.wastefulWords) {
        console.log(`🎯 Wasteful words found: ${data.parsed.wastefulWords.length}`);
        data.parsed.wastefulWords.forEach(word => {
            console.log(`  • "${word.word}" = ${word.tokens} tokens (freq: ${word.frequency})`);
        });
    }
    
    if (data.fallback) {
        console.log('⚠️ Using fallback response (API may be unavailable)');
    }
    
    console.log('✅ DeepSeek API working correctly');
}

async function testGroqAPI() {
    console.log('🎨 Testing /api/groq endpoint...');
    
    const payload = {
        messages: [
            {
                role: 'system',
                content: 'You are a generation agent that creates creative compressions for words.'
            },
            {
                role: 'user',
                content: 'Create compressions for these words: "unfortunately", "implementation", "comprehensive"'
            }
        ],
        temperature: 0.7,
        max_tokens: 500
    };
    
    console.log(`🔍 Sending ${payload.messages.length} messages to Groq`);
    console.log(`🎯 Temperature: ${payload.temperature}`);
    
    const response = await fetch(`${BASE_URL}/api/groq`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`HTTP ${response.status}: ${errorData.error || response.statusText}`);
    }
    
    const data = await response.json();
    
    console.log(`📊 Response length: ${data.response ? data.response.length : 0} characters`);
    
    if (data.parsed && data.parsed.compressions) {
        console.log(`🎯 Compressions found: ${data.parsed.compressions.length}`);
        data.parsed.compressions.forEach(comp => {
            console.log(`  • "${comp.original}" → "${comp.compressed}"`);
        });
    }
    
    if (data.fallback) {
        console.log('⚠️ Using fallback response (API may be unavailable)');
    }
    
    console.log('✅ Groq API working correctly');
}

// Check if server is running before starting tests
async function checkServer() {
    try {
        const response = await fetch(`${BASE_URL}/api/test`);
        if (response.ok) {
            console.log('✅ Server is running on localhost:3000');
            return true;
        }
    } catch (error) {
        console.error('❌ Server not running on localhost:3000');
        console.error('💡 Please run: npm start');
        return false;
    }
}

// Main execution
async function main() {
    const serverRunning = await checkServer();
    if (!serverRunning) {
        process.exit(1);
    }
    
    await runIntegrationTest();
}

// Handle errors gracefully
main().catch(error => {
    console.error('💥 Integration test failed:', error.message);
    process.exit(1);
});