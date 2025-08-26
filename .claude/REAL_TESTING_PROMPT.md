# REAL TESTING PROMPT - No Theater, No Workarounds

Use this prompt when asking Claude to write tests that actually verify functionality:

---

## TESTING REQUIREMENTS - MANDATORY

You must write tests that **actually verify the real system works end-to-end**. Follow these requirements strictly:

### ❌ BANNED PRACTICES (Testing Theater)
- **NO MOCK DATA** - Don't use hardcoded sample data that bypasses real logic
- **NO WORKAROUNDS** - Don't create "safe" versions that avoid real functionality  
- **NO ASSUMPTIONS** - Don't assume APIs work without actually calling them
- **NO THEATER** - Don't create tests that look comprehensive but test nothing real
- **NO DIFFERENT CODE PATHS** - Test the exact same path the user will trigger
- **NO "SHOULD WORK" LOGIC** - If you didn't verify it works, it doesn't work

### ✅ REQUIRED PRACTICES (Real Testing)
- **USE ACTUAL APIS** - Call real endpoints with real credentials
- **TEST USER PATHS** - Follow exact steps a user would take (click buttons, use UI)
- **VERIFY REAL DATA FLOW** - Ensure data moves through the actual system
- **CHECK REAL RESPONSES** - Verify actual API responses, not mock responses
- **TEST ERROR SCENARIOS** - What happens when APIs fail, networks timeout, etc.
- **VALIDATE END RESULTS** - Confirm the final output is what users would see

### 🔍 VERIFICATION CHECKLIST
Before claiming a test "passes," prove:

1. **Real API Calls**: Show actual HTTP requests hitting real endpoints
2. **Real Data Processing**: Demonstrate actual data transformation, not samples  
3. **Real User Interface**: Test buttons/forms users actually interact with
4. **Real Error Handling**: Trigger actual failures and verify graceful degradation
5. **Real Performance**: Measure actual response times under realistic load
6. **Real Integration**: Verify all components work together, not in isolation

### 📊 TEST EVIDENCE REQUIREMENTS
Every test must provide:

- **Network Traffic Logs**: Show actual API requests/responses
- **Console Output**: Real system logs during test execution  
- **UI Screenshots/Video**: Actual interface behavior during testing
- **Database State**: Real data changes if applicable
- **Error Logs**: Actual error messages and stack traces
- **Timing Measurements**: Real performance under actual conditions

### 🎯 SPECIFIC TESTING APPROACH

#### For Web Applications:
1. **Open real browser** (Playwright/Selenium) 
2. **Navigate to actual URL** (not localhost mock)
3. **Click actual buttons** user would click
4. **Fill actual forms** with realistic data
5. **Verify actual API calls** in network tab
6. **Confirm actual results** appear in UI

#### For APIs:
1. **Call actual endpoints** with real credentials
2. **Send realistic payloads** not minimal test data
3. **Verify actual response structure** and content
4. **Test actual rate limits** and authentication
5. **Trigger actual error conditions** (bad auth, malformed data)
6. **Measure actual performance** under load

#### For Integrations:
1. **Use real external services** (not mocks/stubs)
2. **Test with real API keys** and credentials
3. **Handle real rate limits** and quotas
4. **Verify real data synchronization** 
5. **Test real failure modes** (service down, timeout)

### 🚨 RED FLAGS - If You See These, The Test Is Fake
- "Mock", "stub", "fake", "simulate" in test descriptions
- Tests that run too fast (real APIs have latency)
- Perfect success rates (real systems have failures)
- Tests that never hit external dependencies
- Hardcoded expected values that match sample data
- Tests that skip authentication or authorization
- "Safe" or "demo" modes that bypass real logic

### 🎪 COMMON TESTING THEATER PATTERNS TO AVOID

**Theater**: "Let's test the search with mock results"
**Real**: "Let's call the actual search API and verify it returns diverse results"

**Theater**: "I'll create a safe test that won't hit rate limits"  
**Real**: "I'll test with real API calls and handle actual rate limits"

**Theater**: "The code looks correct, so the test should pass"
**Real**: "I executed the test and verified the actual output matches expectations"

**Theater**: "I'll test a simpler version to avoid complexity"
**Real**: "I'll test the exact production code path with all its complexity"

### 📋 TEST COMPLETION CRITERIA

A test is only complete when:
- [ ] Actual production code path executed
- [ ] Real external dependencies called
- [ ] Realistic data processed end-to-end  
- [ ] Actual error conditions tested
- [ ] Performance measured under realistic load
- [ ] Results verified in actual user interface
- [ ] All edge cases covered with real scenarios

### 🔄 ITERATIVE TESTING APPROACH

1. **Start Simple**: One real end-to-end path
2. **Add Complexity**: More realistic data and scenarios  
3. **Add Edge Cases**: Real error conditions and failures
4. **Add Load**: Real performance under stress
5. **Add Integration**: Real multi-component workflows

### 💡 TESTING MINDSET

Ask these questions for every test:
- "Would this test catch the bug a real user would encounter?"
- "Am I testing the same code path the user will trigger?"  
- "If this test passes, can I guarantee the feature works for users?"
- "Am I using real data that reflects actual usage patterns?"
- "Have I verified this works with real external dependencies?"

---

## EXAMPLE USAGE

**BAD PROMPT**: "Write tests for the user authentication system"

**GOOD PROMPT**: "Write tests for the user authentication system that:
1. Actually attempt login with real credentials via the actual login form
2. Call the real authentication API endpoints  
3. Verify real session cookies are set
4. Test actual password validation rules
5. Handle real API errors (wrong password, account locked)
6. Measure actual login performance
7. Verify real user redirection after successful login
Use this REAL_TESTING_PROMPT requirements."

Remember: **If the test doesn't prove it works for real users in the real system, it's not a real test.**