# Token Compressor - Vercel API Routes Implementation Plan

## Project Overview
Refactoring the Token Compressor from a monolithic HTML file into a secure, modular architecture using Vercel API routes to hide API keys server-side and implement proper security practices.

## Context Analysis
- Current: Monolithic HTML file with client-side API keys (security risk)
- Target: Modular architecture with server-side API proxies 
- Stack: Node.js/Vercel serverless functions, following existing error handling patterns
- Security: Hide API keys, rate limiting, input validation, comprehensive error handling

## API Routes Required

### 1. `/api/search` - Brave Search API Proxy
**Purpose**: Proxy search requests to Brave Search API with topic/domain cycling
**Dependencies**: Brave Search API key
**Features**:
- Random topic selection from config.searchTopics
- Random domain cycling from config.searchDomains  
- Request validation and sanitization
- Rate limiting (60 req/min per IP)
- Error handling with circuit breaker

### 2. `/api/deepseek` - DeepSeek Chat API Proxy
**Purpose**: Proxy chat requests to DeepSeek API for Discovery and Validation agents
**Dependencies**: DeepSeek API key
**Features**:
- Request/response proxy with validation
- Token counting and usage tracking
- Temperature and model parameter validation
- Rate limiting and error handling

### 3. `/api/groq` - Groq API Proxy  
**Purpose**: Proxy chat requests to Groq API for Generation agent
**Dependencies**: Groq API key
**Features**:
- Request/response proxy with validation
- Creative compression invention support
- Model parameter validation (llama3-8b-8192)
- Rate limiting and error handling

### 4. `/api/tokenize` - tiktoken Integration
**Purpose**: Accurate token counting using tiktoken (not character estimation)
**Dependencies**: tiktoken package
**Features**:
- Accurate token counting for different models
- Support for GPT-3.5/GPT-4 tokenization
- Input validation and length limits
- Fast response times

### 5. `/api/twitter` - Twitter Bot Integration
**Purpose**: Hourly announcements of discoveries after testing ceremony
**Dependencies**: Twitter API keys
**Features**:
- Scheduled tweet capability
- Tweet content generation from discoveries
- Rate limiting compliance with Twitter
- Error handling for failed posts

## Security Requirements

### Environment Variables (All Required)
```
BRAVE_SEARCH_API_KEY=your_brave_key
DEEPSEEK_API_KEY=sk-your_deepseek_key  
GROQ_API_KEY=gsk_your_groq_key
TWITTER_API_KEY=your_twitter_key
TWITTER_API_SECRET=your_twitter_secret
TWITTER_ACCESS_TOKEN=your_access_token
TWITTER_ACCESS_TOKEN_SECRET=your_access_secret
```

### Security Measures
1. **Input Sanitization**: Validate all incoming data
2. **Rate Limiting**: 60 requests/minute per IP address
3. **CORS Headers**: Proper cross-origin configuration
4. **Error Handling**: Circuit breaker patterns from existing error-handler.js
5. **Request Logging**: Monitor for suspicious activity
6. **API Key Protection**: Server-side only, never exposed

## Implementation Details

### Shared Utilities
- `lib/rate-limiter.js` - IP-based rate limiting 
- `lib/error-handler.js` - Server-side error handling following existing patterns
- `lib/validators.js` - Input validation schemas
- `lib/logger.js` - Request/error logging

### Error Handling Strategy
Follow existing `/public/js/utils/error-handler.js` patterns:
- Circuit breaker implementation
- Exponential backoff for retries
- Error classification (API, network, validation, etc.)
- User-friendly error messages
- Monitoring and analytics

### Testing Strategy
- Unit tests for each API route
- Integration tests with mock API responses
- Rate limiting tests
- Error handling tests
- Security validation tests

## File Structure
```
/api/
├── search.js          # Brave Search proxy
├── deepseek.js        # DeepSeek Chat proxy  
├── groq.js            # Groq API proxy
├── tokenize.js        # tiktoken integration
├── twitter.js         # Twitter bot
/lib/
├── rate-limiter.js    # Rate limiting utilities
├── error-handler.js   # Server-side error handling
├── validators.js      # Input validation
├── logger.js          # Logging utilities
/test/
├── api/
│   ├── search.test.js
│   ├── deepseek.test.js
│   ├── groq.test.js
│   ├── tokenize.test.js
│   └── twitter.test.js
```

## Integration Points

### Frontend Changes Required
- Update `/public/js/config.js` to use `/api/*` endpoints
- Remove client-side API keys
- Update error handling to work with new API responses
- Modify agents to use proxied endpoints

### Database Integration
- Maintain existing Supabase integration
- Log API usage for monitoring
- Track rate limiting violations

## Implementation Tasks

### Phase 1: Core Infrastructure (Day 1)
- [ ] Set up shared utilities (rate-limiter, error-handler, validators, logger)
- [ ] Create base API route structure
- [ ] Implement environment variable configuration
- [ ] Set up basic security middleware

### Phase 2: API Routes (Day 1-2)
- [ ] Implement `/api/search` with Brave Search integration
- [ ] Implement `/api/deepseek` proxy
- [ ] Implement `/api/groq` proxy
- [ ] Implement `/api/tokenize` with tiktoken
- [ ] Implement `/api/twitter` bot functionality

### Phase 3: Security & Testing (Day 2)
- [ ] Add comprehensive input validation
- [ ] Implement rate limiting across all routes
- [ ] Add proper error handling and logging
- [ ] Write unit tests for all routes
- [ ] Security review and penetration testing

### Phase 4: Integration (Day 2-3)
- [ ] Update frontend config to use new API routes
- [ ] Test end-to-end agent functionality
- [ ] Monitor performance and error rates
- [ ] Deploy to staging/production

## Success Criteria

### Functionality
- All 5 API routes working correctly
- Agent discovery process maintains functionality
- Token counting accuracy improved
- Twitter announcements working

### Security
- All API keys hidden server-side
- Rate limiting prevents abuse
- Input validation blocks malicious requests
- Error handling doesn't leak sensitive info

### Performance
- API response times <500ms average
- Rate limiting doesn't block legitimate users
- Error recovery works automatically
- Circuit breakers prevent cascading failures

## Risk Mitigation

### API Rate Limits
- Monitor usage against provider limits
- Implement backoff strategies
- Cache responses where appropriate

### Cost Control
- Set up usage alerts for all APIs
- Implement circuit breakers to prevent runaway costs
- Monitor and optimize token usage

### Deployment
- Use Vercel environment variables for secrets
- Test all routes in staging environment
- Have rollback plan if issues arise

## Post-Implementation

### Monitoring Required
- API response times and error rates
- Rate limiting effectiveness
- API usage costs
- Security incident detection

### Maintenance Tasks
- Weekly API usage review
- Monthly security audit
- Quarterly cost optimization
- API key rotation schedule

## Next Steps After Plan Approval
1. Create shared utility libraries
2. Implement API routes one by one
3. Add comprehensive testing
4. Update frontend configuration
5. Deploy and monitor

This plan provides a secure, scalable foundation for the Token Compressor project while maintaining the existing functionality and improving security posture.