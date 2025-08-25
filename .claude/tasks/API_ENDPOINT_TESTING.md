# API Endpoint Testing - Comprehensive Plan

## Task Overview
Test all API endpoints for the Token Compressor project running on http://localhost:3000, create comprehensive tests, and implement unit tests for automatic validation.

## API Endpoints Analysis

### 1. `/api/test` - Basic Test Endpoint
- **Method**: GET/POST
- **Purpose**: Simple health check
- **Response**: `{"message":"Hello from test API!"}`
- **Testing Priority**: High (foundation test)

### 2. `/api/search` - Brave Search Proxy
- **Method**: POST
- **Purpose**: Proxy requests to Brave Search API with fallback content
- **Input**: `{query: string, domain?: string}`
- **Features**: Rate limiting, input validation, sanitization, fallback content
- **Testing Priority**: Critical (core functionality)

### 3. `/api/deepseek` - DeepSeek Chat API
- **Method**: POST
- **Purpose**: DeepSeek API proxy for Discovery and Validation agents
- **Input**: `{messages: array, temperature?: number, max_tokens?: number, agent_type: string}`
- **Features**: Agent-specific parsing, rate limiting, fallback responses
- **Testing Priority**: Critical (AI agent core)

### 4. `/api/groq` - Groq API for Generation Agent
- **Method**: POST
- **Purpose**: Groq API proxy for creative compression generation
- **Input**: `{messages: array, temperature?: number, max_tokens?: number}`
- **Features**: Creative parsing, symbol palette, fallback responses
- **Testing Priority**: Critical (AI agent core)

### 5. `/api/tokenize` - Token Counting with tiktoken
- **Method**: POST
- **Purpose**: Accurate token counting and multi-token word analysis
- **Input**: `{text: string, encoding?: string}`
- **Features**: tiktoken integration, compression analysis, fallback approximation
- **Testing Priority**: High (core feature)

### 6. `/api/twitter` - Twitter Bot Integration
- **Method**: POST
- **Purpose**: Tweet generation for hourly discovery announcements
- **Input**: `{compressions?: array, hour: string, humanWins?: number, aiWins?: number}`
- **Features**: Tweet formatting, simulation mode, statistics
- **Testing Priority**: Medium (nice-to-have feature)

## Comprehensive Testing Strategy

### Phase 1: Manual Testing with curl
Test each endpoint individually with sample requests to verify:
1. **Basic functionality** - Endpoint responds correctly
2. **Input validation** - Proper error handling for invalid inputs
3. **Rate limiting** - 60 requests/minute limit enforcement
4. **CORS headers** - Proper cross-origin support
5. **Error handling** - Graceful fallbacks and error messages
6. **Security** - XSS prevention and input sanitization

### Phase 2: Load and Performance Testing
1. **Concurrent request testing** - Multiple simultaneous calls
2. **Rate limit boundary testing** - Exactly 60 requests in 1 minute
3. **Large payload testing** - Maximum input sizes
4. **Response time validation** - Sub-second response requirements

### Phase 3: Integration Testing
1. **Agent workflow testing** - End-to-end discovery→generation→validation
2. **Database integration** - Supabase connectivity (where applicable)
3. **API key validation** - Verify external API connections
4. **Fallback behavior** - Test when external APIs are unavailable

### Phase 4: Automated Unit Tests
Create `npm test` compatible unit test suite with:
1. **API endpoint coverage** - All 6 endpoints tested
2. **Input validation tests** - Edge cases and error conditions
3. **Response format validation** - Ensure consistent API contracts
4. **Mock external APIs** - Test without hitting real API limits
5. **Performance benchmarks** - Response time validation

## Test Data Preparation

### Sample Requests for Each Endpoint

**Search API:**
```json
{
  "query": "artificial intelligence token compression",
  "domain": "research"
}
```

**DeepSeek API:**
```json
{
  "messages": [
    {"role": "user", "content": "Analyze this text for multi-token words: 'The implementation was approximately comprehensive.'"}
  ],
  "agent_type": "discovery"
}
```

**Groq API:**
```json
{
  "messages": [
    {"role": "user", "content": "Create compression for: approximately, implementation, comprehensive"}
  ],
  "temperature": 0.7
}
```

**Tokenize API:**
```json
{
  "text": "The implementation was approximately comprehensive and unfortunately complex."
}
```

**Twitter API:**
```json
{
  "hour": "12",
  "compressions": [
    {"original": "approximately", "compressed": "≈", "tokens_saved": 100}
  ],
  "humanWins": 5,
  "aiWins": 8
}
```

## Expected Outcomes

### Success Criteria
1. **All endpoints respond correctly** - 200 status codes for valid requests
2. **Proper error handling** - 400/429/500 codes for invalid/rate-limited requests
3. **CORS headers present** - Allow cross-origin requests from frontend
4. **Rate limiting functional** - 429 after 60 requests/minute
5. **Input sanitization working** - XSS attacks blocked
6. **Fallback responses available** - Graceful degradation when APIs fail
7. **Unit test suite passes** - `npm test` runs successfully with 100% pass rate

### Performance Targets
- **Response time**: < 2 seconds for all endpoints
- **Concurrent handling**: Support 10+ simultaneous requests
- **Rate limit accuracy**: Exactly 60 requests per minute window
- **Memory usage**: Stable under load testing

## Test Implementation Details

### Unit Test Framework
- Use Node.js built-in testing capabilities (no external deps)
- Mock external API calls to avoid hitting real API limits
- Test both success and error scenarios
- Validate response schemas and formats
- Include performance benchmarks

### Test Organization
```
test/
├── api-endpoint-tests.js     # Manual testing script
├── unit-tests-enhanced.js    # Enhanced unit test suite
├── load-tests.js            # Performance and load testing
└── integration-tests.js     # End-to-end workflow testing
```

### Test Execution Strategy
1. **Development testing**: Run tests frequently during development
2. **Pre-deployment testing**: Full test suite before any deployment
3. **Continuous monitoring**: Periodic health checks in production
4. **Load testing**: Simulate real-world usage patterns

## Risk Mitigation

### Potential Issues and Solutions
1. **API key rate limits** - Use fallback responses and careful test sequencing
2. **External API downtime** - Comprehensive fallback testing
3. **Local server instability** - Test server restart procedures
4. **Memory leaks** - Monitor resource usage during testing
5. **CORS issues** - Validate headers in all test scenarios

## Implementation Timeline

1. **Phase 1 (Manual Testing)**: 2-3 hours
2. **Phase 2 (Load Testing)**: 1-2 hours  
3. **Phase 3 (Integration)**: 2-3 hours
4. **Phase 4 (Unit Tests)**: 3-4 hours
5. **Documentation & Cleanup**: 1 hour

**Total Estimated Time**: 9-13 hours

## Deliverables

1. **Comprehensive test results** - Detailed report of all endpoint testing
2. **Enhanced unit test suite** - Automated testing with `npm test`
3. **Performance benchmarks** - Response time and load handling metrics
4. **API endpoint documentation** - Updated with test findings
5. **Recommendations** - Any improvements or optimizations identified

This plan ensures thorough testing of all API endpoints with both manual validation and automated test coverage for ongoing quality assurance.