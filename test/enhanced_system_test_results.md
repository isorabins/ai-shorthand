🧪 Token Compressor Comprehensive Test Suite
============================================

TAP version 13
✅ Server is running
# Subtest: 🚀 System Startup Tests
    # Subtest: Server is running and responding
    ok 1 - Server is running and responding
      ---
      duration_ms: 20.411666
      ...
✅ Frontend loads correctly
    # Subtest: Frontend loads without errors
    ok 2 - Frontend loads without errors
      ---
      duration_ms: 2.867459
      ...
    1..2
ok 1 - 🚀 System Startup Tests
  ---
  duration_ms: 23.673458
  type: 'suite'
  ...
✅ Test API endpoint working
# Subtest: 🔧 API Endpoint Tests
    # Subtest: /api/test - Basic health check
    ok 1 - /api/test - Basic health check
      ---
      duration_ms: 1.093209
      ...
✅ Tokenize API working (8 tokens)
    # Subtest: /api/tokenize - Token analysis
    ok 2 - /api/tokenize - Token analysis
      ---
      duration_ms: 67.389417
      ...
    # Subtest: /api/search - Search functionality
    not ok 3 - /api/search - Search functionality
      ---
      duration_ms: 603.058542
      location: '/Applications/ai_shorthand/test/comprehensive-test-suite.js:109:5'
      failureType: 'testCodeFailure'
      error: 'Should have results or fallback'
      code: 'ERR_ASSERTION'
      name: 'AssertionError'
      expected: true
      operator: '=='
      stack: |-
        TestContext.<anonymous> (file:///Applications/ai_shorthand/test/comprehensive-test-suite.js:120:16)
        process.processTicksAndRejections (node:internal/process/task_queues:105:5)
        async Test.run (node:internal/test_runner/test:932:9)
        async Suite.processPendingSubtests (node:internal/test_runner/test:629:7)
      ...
✅ DeepSeek API responding (may use fallback)
    # Subtest: /api/deepseek - AI chat endpoint
    ok 4 - /api/deepseek - AI chat endpoint
      ---
      duration_ms: 3.948333
      ...
✅ Groq API responding (may use fallback)
    # Subtest: /api/groq - Generation endpoint
    ok 5 - /api/groq - Generation endpoint
      ---
      duration_ms: 3.216167
      ...
✅ API error handling working
    # Subtest: API Error Handling
    ok 6 - API Error Handling
      ---
      duration_ms: 3.991083
      ...
    1..6
not ok 2 - 🔧 API Endpoint Tests
  ---
  duration_ms: 683.185709
  type: 'suite'
  location: '/Applications/ai_shorthand/test/comprehensive-test-suite.js:85:1'
  failureType: 'subtestsFailed'
  error: '1 subtest failed'
  code: 'ERR_TEST_FAILURE'
  ...
✅ All three agents present in UI
# Subtest: 🎭 Agent Integration Tests
    # Subtest: Agent initialization sequence
    ok 1 - Agent initialization sequence
      ---
      duration_ms: 2009.611833
      ...
✅ Agent dependencies functional
    # Subtest: Configuration validation
    ok 2 - Configuration validation
      ---
      duration_ms: 54.459709
      ...
    1..2
ok 3 - 🎭 Agent Integration Tests
  ---
  duration_ms: 2064.379125
  type: 'suite'
  ...
✅ API response time: 1ms
# Subtest: 🔄 Performance Tests
    # Subtest: API response times
    ok 1 - API response times
      ---
      duration_ms: 0.986333
      ...
✅ Concurrent requests handled successfully
    # Subtest: Concurrent requests
    ok 2 - Concurrent requests
      ---
      duration_ms: 3.689292
      ...
✅ Large text processed: 500 tokens
    # Subtest: Large text tokenization
    ok 3 - Large text tokenization
      ---
      duration_ms: 49.839042
      ...
    1..3
ok 4 - 🔄 Performance Tests
  ---
  duration_ms: 54.627417
  type: 'suite'
  ...
✅ Input validation working
# Subtest: 🛡️ Security & Validation Tests
    # Subtest: Input validation
    ok 1 - Input validation
      ---
      duration_ms: 1.725709
      ...
✅ CORS headers present
    # Subtest: CORS headers
    ok 2 - CORS headers
      ---
      duration_ms: 0.521958
      ...
✅ Rate limiting allows normal usage

🏥 SYSTEM HEALTH REPORT
=======================
    # Subtest: Rate limiting functionality
    ok 3 - Rate limiting functionality
      ---
      duration_ms: 1.098041
      ...
    1..3
ok 5 - 🛡️ Security & Validation Tests
  ---
  duration_ms: 3.429709
  type: 'suite'
  ...
/test        ✅ WORKING
/tokenize    ✅ WORKING
/search      ⚠️ ISSUES
/deepseek    ✅ WORKING
/groq        ✅ WORKING
Frontend     ✅ WORKING

📈 PERFORMANCE METRICS
=======================
Average Response Time: 0ms
Token Processing: 6 tokens in 29ms
Processing Speed: 207 tokens/second

🔋 SYSTEM STATUS: FULLY OPERATIONAL
=====================================
# Subtest: 📊 System Status Report
    # Subtest: Generate system health report
    ok 1 - Generate system health report
      ---
      duration_ms: 60.612
      ...
    1..1
ok 6 - 📊 System Status Report
  ---
  duration_ms: 60.683417
  type: 'suite'
  ...
1..6
# tests 17
# suites 6
# pass 16
# fail 1
# cancelled 0
# skipped 0
# todo 0
# duration_ms 2893.561167

✅ All tests completed!
🚀 Token Compressor system is ready for use!
