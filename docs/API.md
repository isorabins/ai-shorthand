# Token Compressor API Documentation

Complete reference for all API endpoints in the Token Compressor system.

## Base URL

- **Local Development**: `http://localhost:3000/api`
- **Production**: `https://your-vercel-app.vercel.app/api`

## Authentication

All API endpoints are publicly accessible. API keys are handled server-side via environment variables for security.

## Rate Limiting

All endpoints are rate-limited to **60 requests per minute per IP address**.

Rate limit headers included in all responses:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
X-RateLimit-Reset: 1640995200
```

## Error Handling

All endpoints return consistent error format:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "timestamp": "2025-01-23T12:00:00Z"
}
```

Common error codes:
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `INVALID_INPUT`: Malformed request data
- `EXTERNAL_API_ERROR`: Upstream API failure
- `INTERNAL_ERROR`: Server-side error

---

## Endpoints

### 1. Search API

Search the web for articles using Brave Search API.

**Endpoint**: `POST /api/search`

**Purpose**: Used by Discovery Agent to find random articles for token analysis.

#### Request

```json
{
  "query": "artificial intelligence trends 2024",
  "count": 10
}
```

**Parameters**:
- `query` (string, required): Search query
- `count` (integer, optional): Number of results (default: 10, max: 20)

#### Response

```json
{
  "success": true,
  "results": {
    "articles": [
      {
        "title": "AI Trends in 2024",
        "url": "https://example.com/article",
        "snippet": "Artificial intelligence continues to evolve...",
        "published": "2024-01-15"
      }
    ],
    "query": "artificial intelligence trends 2024",
    "total": 42
  }
}
```

#### Error Response

```json
{
  "success": false,
  "error": "Search API unavailable",
  "fallbackContent": {
    "articles": [
      {
        "title": "Fallback Article",
        "snippet": "Pre-defined content when search fails..."
      }
    ]
  }
}
```

#### Example Usage

```javascript
const response = await fetch('/api/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'machine learning applications',
    count: 5
  })
});

const data = await response.json();
```

---

### 2. DeepSeek API

Interface to DeepSeek Chat API for Discovery and Validation agents.

**Endpoint**: `POST /api/deepseek`

**Purpose**: Powers Discovery Agent (article analysis) and Validation Agent (compression testing).

#### Request

```json
{
  "messages": [
    {
      "role": "system",
      "content": "You are a Discovery Agent..."
    },
    {
      "role": "user", 
      "content": "Analyze this article for wasteful words..."
    }
  ],
  "temperature": 0.7,
  "max_tokens": 1500
}
```

**Parameters**:
- `messages` (array, required): OpenAI-format conversation messages
- `temperature` (float, optional): Creativity level (0.0-1.0, default: 0.7)
- `max_tokens` (integer, optional): Response length limit (default: 1500)

#### Response

```json
{
  "success": true,
  "response": "Based on the article analysis, I found these wasteful words:\n\n<analysis>...",
  "usage": {
    "prompt_tokens": 245,
    "completion_tokens": 156,
    "total_tokens": 401
  },
  "model": "deepseek-chat"
}
```

#### Example Usage

```javascript
const response = await fetch('/api/deepseek', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [
      {
        role: "system",
        content: "You are an AI agent that finds wasteful words in text."
      },
      {
        role: "user",
        content: "Find words that use too many tokens: 'approximately seven thousand'"
      }
    ],
    temperature: 0.3
  })
});
```

---

### 3. Groq API

Interface to Groq API for Generation Agent creative compressions.

**Endpoint**: `POST /api/groq`

**Purpose**: Powers Generation Agent to create innovative text compressions.

#### Request

```json
{
  "messages": [
    {
      "role": "system",
      "content": "You are a creative Generation Agent..."
    },
    {
      "role": "user",
      "content": "Create compressions for these wasteful words..."
    }
  ],
  "temperature": 0.9,
  "max_tokens": 1000
}
```

**Parameters**:
- `messages` (array, required): Conversation messages
- `temperature` (float, optional): Creativity level (default: 0.9 for creative responses)
- `max_tokens` (integer, optional): Response length limit (default: 1000)

#### Response

```json
{
  "success": true,
  "response": "<thinking>I need to create creative compressions...</thinking>\n\n<compression>...",
  "usage": {
    "prompt_tokens": 189,
    "completion_tokens": 234,
    "total_tokens": 423
  },
  "model": "mixtral-8x7b-32768"
}
```

#### Example Usage

```javascript
const response = await fetch('/api/groq', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [
      {
        role: "system", 
        content: "You create innovative text compressions using symbols and abbreviations."
      },
      {
        role: "user",
        content: "Compress: 'approximately' (uses 4 tokens)"
      }
    ],
    temperature: 0.9
  })
});
```

---

### 4. Tokenize API

Accurate token counting using tiktoken library.

**Endpoint**: `POST /api/tokenize`

**Purpose**: Provides precise token counts for GPT-family models (not character estimates).

#### Request

```json
{
  "text": "Hello, this is a sample text to tokenize for accurate counting.",
  "model": "gpt-4"
}
```

**Parameters**:
- `text` (string, required): Text to tokenize
- `model` (string, optional): Model for tokenization (default: "gpt-4")

Supported models:
- `gpt-4` (default)
- `gpt-3.5-turbo`
- `text-davinci-003`

#### Response

```json
{
  "success": true,
  "tokens": 15,
  "text": "Hello, this is a sample text to tokenize for accurate counting.",
  "model": "gpt-4",
  "tokenDetails": {
    "encoding": "cl100k_base",
    "tokensPerWord": 1.25
  }
}
```

#### Example Usage

```javascript
const response = await fetch('/api/tokenize', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: 'approximately seven thousand people',
    model: 'gpt-4'
  })
});

const data = await response.json();
console.log(`Token count: ${data.tokens}`); // Token count: 4
```

---

### 5. Twitter API

Post discovery announcements to Twitter after testing ceremonies.

**Endpoint**: `POST /api/twitter`

**Purpose**: Announces validated compressions hourly via Twitter bot.

#### Request

```json
{
  "compressions": [
    {
      "original": "approximately",
      "compressed": "≈",
      "tokensSaved": 3,
      "source": "AI-Discovery"
    }
  ],
  "hour": 15,
  "humanWins": 2,
  "aiWins": 3
}
```

**Parameters**:
- `compressions` (array, required): Validated compressions from ceremony
- `hour` (integer, required): Current discovery hour
- `humanWins` (integer, required): Human-submitted compressions count
- `aiWins` (integer, required): AI-discovered compressions count

#### Response

```json
{
  "success": true,
  "tweetId": "1750123456789012345",
  "tweetUrl": "https://twitter.com/TokenCompressor/status/1750123456789012345",
  "message": "🤖 Hour 15 Discovery Results:\n≈ 3 tokens saved\n\n🏆 AI: 3 | Human: 2\n#TokenCompression #AI"
}
```

#### Example Usage

```javascript
const response = await fetch('/api/twitter', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    compressions: [
      {
        original: "approximately",
        compressed: "≈", 
        tokensSaved: 3,
        source: "AI-Discovery"
      }
    ],
    hour: 15,
    humanWins: 2,
    aiWins: 3
  })
});
```

---

## Security Considerations

### Input Sanitization

All endpoints sanitize input using:
```javascript
function sanitizeInput(input) {
    if (typeof input !== 'string') return '';
    return input
        .replace(/[<>]/g, '') // Remove potential HTML
        .replace(/javascript:/gi, '') // Remove javascript: URLs
        .trim()
        .slice(0, 10000); // Limit length
}
```

### Rate Limiting Implementation

```javascript
const rateLimit = new Map();

function checkRateLimit(ip) {
    const key = `rate_limit:${ip}`;
    const current = rateLimit.get(key) || { count: 0, resetTime: Date.now() + 60000 };
    
    if (Date.now() > current.resetTime) {
        current.count = 0;
        current.resetTime = Date.now() + 60000;
    }
    
    current.count++;
    rateLimit.set(key, current);
    
    return current.count <= 60;
}
```

### Error Response Security

Errors never expose:
- API keys or sensitive configuration
- Internal file paths or stack traces
- Database connection details
- External API response details

---

## Development & Testing

### Local Testing

```bash
# Test tokenize endpoint
curl -X POST http://localhost:3000/api/tokenize \
  -H "Content-Type: application/json" \
  -d '{"text":"hello world","model":"gpt-4"}'

# Test search endpoint  
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{"query":"AI news","count":5}'
```

### Environment Variables Required

```env
DEEPSEEK_API_KEY=your_deepseek_key
GROQ_API_KEY=your_groq_key
BRAVE_SEARCH_API_KEY=your_brave_key
TWITTER_BEARER_TOKEN=your_twitter_token
```

### Monitoring

Track these metrics for API health:
- Response time per endpoint
- Error rate by endpoint
- Rate limit trigger frequency
- External API failure rates
- Token usage and costs

---

## Changelog

- **v1.0.0**: Initial API implementation with all 5 endpoints
- Security: Rate limiting and input sanitization
- Integration: DeepSeek, Groq, Brave Search, Twitter APIs
- Testing: Comprehensive error handling and fallbacks