# Local Setup Guide for Token Compressor

Complete guide to set up full local testing with all AI agents working.

## Current Status

✅ **You Have:**
- Supabase project configured
- DeepSeek API key
- Anthropic/Claude API key
- Grok/xAI API key
- Resend email API key

❌ **You Need:**
- Groq API key (for Generation Agent)
- Brave Search API key (for Discovery Agent)
- Twitter API credentials (optional for announcements)

## Required API Keys to Get

### 1. Groq API Key (CRITICAL - Powers Generation Agent)

**Get it:** https://console.groq.com/
1. Sign up for Groq account
2. Navigate to API Keys section
3. Create new API key
4. Copy the key (starts with `gsk_`)

**Add to .env.local:**
```
GROQ_API_KEY=gsk_your_actual_groq_key_here
```

### 2. Brave Search API Key (CRITICAL - Powers Discovery Agent)

**Get it:** https://api.search.brave.com/
1. Sign up for Brave Search API
2. Choose the free tier (2000 queries/month)
3. Generate API key
4. Copy the key

**Add to .env.local:**
```
BRAVE_SEARCH_API_KEY=your_actual_brave_key_here
```

### 3. Twitter API Credentials (Optional - For Announcements)

**Get it:** https://developer.twitter.com/
1. Apply for Twitter Developer account
2. Create new app project
3. Generate these keys:
   - Bearer Token
   - API Key & Secret
   - Access Token & Secret

**Add to .env.local:**
```
TWITTER_BEARER_TOKEN=your_bearer_token
TWITTER_API_KEY=your_api_key
TWITTER_API_SECRET=your_api_secret
TWITTER_ACCESS_TOKEN=your_access_token
TWITTER_ACCESS_SECRET=your_access_secret
```

## Database Setup

### Fix the SQL Error First

The Supabase SQL has been fixed. Now run this in your Supabase SQL Editor:

```sql
-- Copy the entire content from /doc/supabase-setup-sql.sql
-- The INDEX syntax error has been fixed
```

### Enable Row Level Security

In Supabase dashboard:
1. Go to Authentication > Settings
2. Enable Row Level Security on all tables
3. The SQL file includes the necessary RLS policies

## Local Testing Setup

### 1. Install Vercel CLI (If Not Already)

```bash
npm install -g vercel
```

### 2. Update package.json for Local Development

```json
{
  "scripts": {
    "dev": "vercel dev --yes",
    "dev:static": "python3 -m http.server 3000 --directory public",
    "test": "node test/test-runner.js"
  }
}
```

### 3. Run with Full API Support

```bash
# This will give you full API functionality
npm run dev

# Opens at http://localhost:3000
# All API routes at http://localhost:3000/api/*
```

## Verification Checklist

### ✅ API Endpoints Working

Test each endpoint:

```bash
# 1. Test tokenize (should work immediately)
curl -X POST http://localhost:3000/api/tokenize \
  -H "Content-Type: application/json" \
  -d '{"text":"hello world","model":"gpt-4"}'

# 2. Test DeepSeek (requires DEEPSEEK_API_KEY)
curl -X POST http://localhost:3000/api/deepseek \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello"}]}'

# 3. Test Groq (requires GROQ_API_KEY)
curl -X POST http://localhost:3000/api/groq \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello"}]}'

# 4. Test Search (requires BRAVE_SEARCH_API_KEY)
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{"query":"artificial intelligence","count":5}'

# 5. Test Twitter (requires TWITTER credentials)
curl -X POST http://localhost:3000/api/twitter \
  -H "Content-Type: application/json" \
  -d '{"compressions":[],"hour":1,"humanWins":0,"aiWins":0}'
```

### ✅ Agent System Working

Check browser console after loading http://localhost:3000:

```
🎭 Orchestrator initialized
🔍 Discovery Agent ready
🎨 Generation Agent ready  
⚡ Validation Agent ready
🖥️ Real-time UI initialized
🎉 Token Compressor fully initialized
```

### ✅ Real-time Features Working

1. **Form Submissions**: Try submitting a compression
2. **Agent Chat**: Should see live messages from agents
3. **Statistics Updates**: Numbers should update in real-time
4. **Testing Ceremony**: Should trigger at minute 55 of each hour

## Troubleshooting

### API Keys Not Working

```bash
# Check environment variables are loaded
curl http://localhost:3000/api/health
# Should return status of all services
```

### Agents Not Starting

Check browser console for:
- `Failed to initialize [Agent Name]`
- Network errors on `/api/` calls
- CORS or security errors

### Database Connection Issues

1. Verify Supabase URL and keys in `.env.local`
2. Check RLS policies are enabled
3. Test direct connection to Supabase

### Rate Limiting Triggered

Wait 1 minute or restart the dev server:
```bash
# Kill current server
Ctrl+C

# Restart
npm run dev
```

## Performance Expectations

With all APIs working:

- **Discovery Cycles**: Every 30 seconds
- **Agent Response Time**: 3-8 seconds per turn
- **Testing Ceremonies**: Every hour at minute 55
- **Real-time Updates**: Instant via Supabase subscriptions

## Cost Estimates (Free Tiers)

- **Groq**: 14,400 requests/day (free)
- **Brave Search**: 2,000 searches/month (free)
- **DeepSeek**: $0.14 per 1M tokens (very cheap)
- **Supabase**: 50,000 reads/month (free)
- **Vercel**: 100GB bandwidth/month (free)

**Total cost for testing**: ~$1-5/month depending on usage

## Next Steps After Setup

1. **Verify All Systems**: Run through checklist above
2. **Monitor Performance**: Check agent response times
3. **Test Discovery Process**: Watch full 30-second cycles
4. **Submit Test Compressions**: Try the human submission form
5. **Wait for Testing Ceremony**: See hourly validation in action

## Quick Start Commands

```bash
# Complete setup
git clone [repository]
cd ai_shorthand
npm install

# Copy environment template
cp .env.local.example .env.local
# Edit .env.local with your actual API keys

# Run database setup in Supabase SQL Editor
# (copy from doc/supabase-setup-sql.sql)

# Start development server
npm run dev

# Open browser
open http://localhost:3000
```

The system should now be fully functional with all three AI agents collaborating in real-time!