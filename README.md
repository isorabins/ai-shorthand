# Token Compressor 🤖

**AI Agent Discovery Laboratory for Token-Efficient Text Compressions**

Token Compressor is a live AI evolution laboratory where three specialized AI agents collaborate to discover text compression patterns that reduce AI API costs by 30-60%. Watch AI agents work together in real-time to find creative ways to compress common phrases while maintaining perfect semantic accuracy.

## 🎯 Value Proposition

**Problem**: AI API costs are skyrocketing due to verbose natural language
**Solution**: Discover systematic compressions that maintain meaning while reducing tokens
**Impact**: 30-60% cost reduction on AI API calls through intelligent shorthand

## 🏗️ Two-Phase Business Model

### Phase 1: Discovery Laboratory (Current)
- Live AI agent collaboration website
- Public discovery of compression patterns
- Community submissions and validation
- Real-time Twitter announcements

### Phase 2: Developer Packages (Future)
- NPM/pip packages for automatic compression
- Free tier: Top 100 compressions
- Pro ($29/month): Full codex + updates
- Enterprise: Custom domain compressions

## 🤖 How It Works

### Three-Agent Collaboration System

**🔍 Discovery Agent (DeepSeek)**
- Web search for random articles via Brave Search API
- Multi-token word detection using tiktoken
- Identifies wasteful verbose phrases

**🎨 Generation Agent (Groq)**
- Creative compression invention
- Unicode symbols and creative abbreviations
- Collaborative discussion with Discovery Agent

**⚡ Validation Agent (DeepSeek)**
- Comprehensive reversibility testing
- AI + local validation for accuracy
- Batch processing for efficiency

### Discovery Timeline

- **Minutes 0-55**: Continuous 30-second discovery cycles
- **Minutes 55-60**: Hourly "Testing Ceremony" validation
- **After ceremonies**: Twitter bot announces discoveries

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Vercel CLI
- API keys for DeepSeek, Groq, Brave Search, Supabase

### Local Development

```bash
# Clone repository
git clone [repository-url]
cd ai_shorthand

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys (see Configuration section)

# Start local development server
npm run dev
# Opens at http://localhost:3000
```

### Configuration

Create `.env` file with required environment variables:

```env
# Required API Keys
DEEPSEEK_API_KEY=your_deepseek_api_key_here
GROQ_API_KEY=your_groq_api_key_here
BRAVE_SEARCH_API_KEY=your_brave_search_api_key_here

# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional Integrations
TWITTER_BEARER_TOKEN=your_twitter_bearer_token
TWITTER_API_KEY=your_twitter_api_key
TWITTER_API_SECRET=your_twitter_api_secret
TWITTER_ACCESS_TOKEN=your_twitter_access_token
TWITTER_ACCESS_TOKEN_SECRET=your_twitter_access_token_secret

# Configuration
NODE_ENV=development
```

### Get API Keys

1. **DeepSeek**: [platform.deepseek.com](https://platform.deepseek.com) - For Discovery & Validation agents
2. **Groq**: [console.groq.com](https://console.groq.com) - For Generation agent
3. **Brave Search**: [api.search.brave.com](https://api.search.brave.com) - For web search
4. **Supabase**: [supabase.com](https://supabase.com) - For real-time database

## 📡 Deployment

### Vercel Deployment

```bash
# Deploy to Vercel
npm run deploy

# Or deploy with Vercel CLI
vercel --prod
```

### Environment Variables Setup

In Vercel dashboard, add all environment variables from your `.env` file to the project settings.

### Database Setup

1. Create Supabase project
2. Run the SQL from `doc/supabase-setup-sql.sql`
3. Enable Row Level Security on all tables
4. Configure real-time subscriptions

## 🏛️ Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Discovery      │───▶│   Generation     │───▶│   Validation    │
│  Agent          │    │   Agent          │    │   Agent         │
│  (DeepSeek)     │    │   (Groq)         │    │   (DeepSeek)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────▼───────────────────────┘
                    ┌─────────────────────┐
                    │    Orchestrator     │
                    │  (30s cycles)       │
                    └─────────────────────┘
                              │
                    ┌─────────────────────┐
                    │   Real-time UI      │
                    │  (Supabase subs)    │
                    └─────────────────────┘
```

### Key Components

- **Orchestrator**: Coordinates agent cycles and testing ceremonies
- **Real-time UI**: Live updates via Supabase subscriptions  
- **API Routes**: Secure proxy for all external API calls
- **Error Handler**: Circuit breaker patterns for reliability

## 🔒 Security Features

- **API Key Protection**: All keys hidden server-side via Vercel API routes
- **Rate Limiting**: 60 requests/minute per IP across all endpoints
- **Input Validation**: Comprehensive sanitization on all user inputs
- **Circuit Breakers**: Automatic fallback when external APIs fail
- **XSS Prevention**: Proper input escaping throughout UI

## 📊 Monitoring & Analytics

The system tracks:
- Discovery cycle completion rates
- Agent response times
- Compression validation accuracy
- User engagement metrics
- Token savings calculations

## 🎮 GameBoy Aesthetic

The entire interface uses a retro GameBoy aesthetic:
- **Font**: VT323 monospace
- **Colors**: Earth-tone green palette
- **UI**: Retro terminal styling
- **Animations**: Subtle retro transitions

## 🧪 Testing

```bash
# Run local tests (when implemented)
npm test

# Test individual API endpoints
curl http://localhost:3000/api/tokenize -d '{"text":"hello world"}'
```

## 📚 Additional Documentation

- [**API Documentation**](docs/API.md) - Complete API reference
- [**Agent System**](docs/AGENTS.md) - AI agent details and prompting
- [**Architecture**](docs/ARCHITECTURE.md) - System design and data flow  
- [**Deployment Guide**](docs/DEPLOYMENT.md) - Production deployment details

## 🐛 Troubleshooting

### Common Issues

**Agents not responding**
- Check API keys in environment variables
- Verify rate limiting hasn't been triggered
- Check browser console for JavaScript errors

**Real-time updates not working**
- Verify Supabase configuration
- Check network connectivity
- Ensure Row Level Security is properly configured

**Discovery cycles not running**
- Check orchestrator initialization in browser console
- Verify agent instantiation succeeded
- Look for API timeout errors

### Debug Mode

Enable debug logging by setting in browser console:
```javascript
window.TokenCompressor.config.debug.enableLogging = true;
```

## 🤝 Contributing

This is currently a private project in active development. 

## 📄 License

MIT License - see LICENSE file for details.

---

**Built with 💚 by the Token Compression Lab | Saving the world, one token at a time**