# Token Compressor - Product Requirements Document

## Executive Summary

Token Compressor is a live evolution laboratory where AI agents collaborate to discover token-efficient compression patterns. The discovered compressions form a "codex" that will be packaged as an NPM module (JavaScript) and pip package (Python) that developers can install to automatically reduce their AI API costs by 30-60%.

**Core Value Proposition**: We're building the data for a production-ready compression library through live AI discovery and community participation. Developers will simply `npm install token-compressor` or `pip install token-compressor` to cut their AI costs in half.

**The Product Journey**:
1. **Discovery Phase** (This website): AI agents + humans discover compressions
2. **Codex Building** (3-6 months): Accumulate 1,000+ validated compressions
3. **Module Release** (Month 6): Package codex as installable libraries
4. **Integration** (Ongoing): Developers use in production, save money

## Project Overview

### Vision
Create the world's first crowd-sourced, AI-discovered compression protocol that makes AI communication more efficient without losing meaning.

### Key Metrics
- **Target Compression**: 30-60% token reduction
- **Semantic Accuracy**: 100% reversible compression
- **Discovery Rate**: 10-20 valid compressions per day
- **User Engagement**: 100+ daily submissions within 3 months

### Success Criteria
- 1,000+ compressions in codex within 6 months
- Measurable cost savings for users (>30% reduction)
- Active community of contributors (>1,000 participants)
- NPM package with >1,000 weekly downloads within year 1

## Technical Architecture

### Frontend-Only Architecture
- **No Backend Required**: Entire application runs in browser
- **Static Hosting**: Can deploy to GitHub Pages, Netlify, Vercel
- **Direct API Calls**: Browser → AI APIs (DeepSeek, Groq)
- **Database**: Supabase (PostgreSQL as a service)

### Technology Stack
```
Frontend:
- Pure HTML/CSS/JavaScript (no framework)
- VT323 font for retro aesthetic
- Supabase JS Client v2

AI Models:
- DeepSeek Chat API (Agent 1 & Testing)
- Groq Llama 3 API (Agent 2)

Database:
- Supabase (PostgreSQL)
- Row Level Security enabled
- Real-time subscriptions available

Hosting:
- Any static host (GitHub Pages, Netlify, Vercel)
- No server costs
- No maintenance required
```

### System Components

#### 1. Discovery Agents
**Agent 1: Token Waste Detector (DeepSeek)**
- Searches web for diverse content
- Identifies multi-token words
- Analyzes token usage patterns
- Passes findings to Agent 2

**Agent 2: Compression Inventor (Groq Llama)**
- Receives wasteful words from Agent 1
- Creates unique compression symbols
- Ensures reversibility
- Considers existing codex to avoid conflicts

**Testing Agent (DeepSeek)**
- Tests all compressions for reversibility
- Validates against test corpus
- Ensures no semantic loss
- Runs hourly at :55-:00

#### 2. Discovery Process

```
CONTINUOUS PHASE (Minutes 0-55 each hour):
1. Fetch random article (news, research, blog, etc.)
2. Agent 1 identifies token-wasteful words
3. Agent 2 suggests compressions
4. 10-turn collaborative discussion
5. Queue candidates for testing
6. Repeat every 30 seconds

TESTING CEREMONY (Minutes 55-60 each hour):
1. Collect all AI suggestions
2. Collect human submissions
3. Test reversibility on corpus
4. Update codex with valid compressions
5. Update leaderboard
6. Post results to timeline
7. Tweet discoveries (optional)
```

#### 3. Compression Format

Agents discover optimal formats through evolution:
- Prefix markers: `~apx` (approximately)
- Mathematical symbols: `≈` (approximately)
- Suffix patterns: `†` (for -tion words)
- Custom symbols: `◊`, `∿`, `•`

## Database Schema

### Supabase Setup

```sql
-- Create tables
CREATE TABLE compressions (
    id SERIAL PRIMARY KEY,
    original TEXT NOT NULL,
    compressed TEXT NOT NULL,
    source TEXT,
    hour INTEGER,
    tokens_saved INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE submissions (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    original TEXT NOT NULL,
    compressed TEXT NOT NULL,
    daily_updates BOOLEAN DEFAULT FALSE,
    tested BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE leaderboard (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    compressions_count INTEGER DEFAULT 0,
    tokens_saved INTEGER DEFAULT 0,
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE compressions ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

-- Create public access policies
CREATE POLICY "Public read compressions" ON compressions
    FOR SELECT USING (true);

CREATE POLICY "Public insert compressions" ON compressions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Public read submissions" ON submissions
    FOR SELECT USING (true);

CREATE POLICY "Public insert submissions" ON submissions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Public update submissions" ON submissions
    FOR UPDATE USING (true);

CREATE POLICY "Public all leaderboard" ON leaderboard
    FOR ALL USING (true);

-- Create indexes for performance
CREATE INDEX idx_compressions_created_at ON compressions(created_at DESC);
CREATE INDEX idx_submissions_tested ON submissions(tested);
CREATE INDEX idx_leaderboard_date ON leaderboard(date, tokens_saved DESC);

-- Optional: Trigger to update leaderboard automatically
CREATE OR REPLACE FUNCTION update_leaderboard()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO leaderboard (name, email, compressions_count, tokens_saved, date)
    SELECT 
        SUBSTRING(NEW.source FROM 'Human: (.+)') as name,
        'unknown@email.com' as email,
        1 as compressions_count,
        NEW.tokens_saved,
        CURRENT_DATE
    WHERE NEW.source LIKE 'Human:%'
    ON CONFLICT (email, date) DO UPDATE
    SET 
        compressions_count = leaderboard.compressions_count + 1,
        tokens_saved = leaderboard.tokens_saved + EXCLUDED.tokens_saved;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_leaderboard_trigger
AFTER INSERT ON compressions
FOR EACH ROW
EXECUTE FUNCTION update_leaderboard();
```

## API Integration

### Required API Keys

#### DeepSeek API
- **Purpose**: Agent 1 (waste detection) & Testing
- **Pricing**: ~$0.14 per 1M tokens
- **Endpoint**: `https://api.deepseek.com/v1/chat/completions`
- **Model**: `deepseek-chat`
- **Get Key**: https://platform.deepseek.com/

#### Groq API
- **Purpose**: Agent 2 (compression invention)
- **Pricing**: Free tier available (limited requests)
- **Endpoint**: `https://api.groq.com/openai/v1/chat/completions`
- **Model**: `llama3-8b-8192`
- **Get Key**: https://console.groq.com/

#### Supabase
- **Purpose**: Database and real-time updates
- **Pricing**: Free tier includes 500MB database, 2GB bandwidth
- **Setup**: https://supabase.com/

### API Call Patterns

```javascript
// DeepSeek Pattern
const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
    },
    body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [...],
        temperature: 0.3,
        max_tokens: 500
    })
});

// Groq Pattern
const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
    },
    body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: [...],
        temperature: 0.7,
        max_tokens: 500
    })
});
```

## User Interface

### Design Principles
- **Aesthetic**: GameBoy Color / GeoCities retro
- **Font**: VT323 (monospace pixel font)
- **Colors**: Earth tones (greens, tans, browns)
- **Layout**: Terminal-style scrolling, square dialogue boxes
- **No Modern UI**: Avoid gradients, rounded corners, glassmorphism

### Page Components

#### Header
- Title: "~TokenCompressor"
- Tagline: "AI Agents Discovering Shorthand Through Evolution"
- Scrolling marquee with live stats

#### Stats Bar
- Current hour counter
- Codex size
- Articles processed
- Active users
- Total tokens saved

#### Agent Windows (2 columns)
- Agent 1: Token Waste Detector
- Agent 2: Compression Inventor
- Terminal-style scrolling
- Timestamped messages
- Live status indicators

#### Testing Zone
- Testing Agent status
- Countdown to next ceremony
- Results display
- Success/failure indicators

#### Submission Form
- Name field
- Email field
- Original word field
- Compressed suggestion field
- Daily updates opt-in checkbox
- Submit button

#### Leaderboard
- Daily reset at midnight
- Top 10 contributors
- Compressions count
- Tokens saved
- Rank indicators (#1 gold, #2 silver, #3 bronze)

#### Evolution Timeline
- Chronological discovery feed
- Shows compression, source, savings
- Maximum 20 recent items
- Newest first

## Deployment Guide

### Step 1: Supabase Setup
1. Create account at https://supabase.com
2. Create new project
3. Go to SQL Editor
4. Run the complete schema SQL (provided above)
5. Go to Settings → API
6. Copy Project URL and anon key

### Step 2: Get AI API Keys
1. **DeepSeek**: Register at https://platform.deepseek.com/
2. **Groq**: Register at https://console.groq.com/
3. Save both API keys

### Step 3: Configure Application
1. Open the HTML file
2. Update CONFIG object:
```javascript
const CONFIG = {
    SUPABASE_URL: 'https://YOUR_PROJECT.supabase.co',
    SUPABASE_ANON_KEY: 'eyJ...',  // Your anon key
    DEEPSEEK_API_KEY: 'sk-...',   // Your DeepSeek key
    GROQ_API_KEY: 'gsk_...'        // Your Groq key
};
```

### Step 4: Deploy
**Option A: GitHub Pages**
1. Create GitHub repository
2. Upload HTML file as `index.html`
3. Enable GitHub Pages in Settings
4. Access at `https://username.github.io/repo-name`

**Option B: Netlify**
1. Drag and drop HTML file to Netlify
2. Get instant URL
3. Optional: Connect GitHub for auto-deploy

**Option C: Vercel**
1. Import GitHub repository
2. Deploy with one click
3. Get production URL

### Step 5: Monitor & Maintain
- Check Supabase dashboard for database growth
- Monitor API usage (DeepSeek/Groq dashboards)
- Review discovered compressions weekly
- Export codex for NPM module creation

## Cost Analysis

### Monthly Costs (Estimated)
```
Hosting: $0 (static site)
Supabase: $0 (free tier covers <50K compressions)
DeepSeek API: ~$5-10 (depends on traffic)
Groq API: $0-5 (free tier + minimal overages)
Domain (optional): $12/year

Total: ~$10-15/month
```

### Cost Per Discovery
- Average tokens per discovery cycle: ~2,000
- DeepSeek cost: ~$0.0003
- Groq cost: ~$0.0001
- **Total per compression discovered: ~$0.0004**

## Final Product: The Module

### NPM Module (JavaScript)
```javascript
// Installation
npm install token-compressor

// Usage
import { compress, expand } from 'token-compressor';

// Before sending to AI
const compressed = compress("Please analyze the customer database approximately");
// Result: "plz ~ax the ~cst ~db ≈"

// After receiving from AI
const original = expand("I'll ~ax the ~cst ~db for you");
// Result: "I'll analyze the customer database for you"

// With OpenAI
import OpenAI from 'openai';
import { compress, expand } from 'token-compressor';

const openai = new OpenAI();

// Automatically compress all inputs and expand outputs
const response = await openai.chat.completions.create({
  messages: [{ 
    role: 'user', 
    content: compress("Analyze the implementation of customer database") 
  }],
  model: 'gpt-4'
});

const result = expand(response.choices[0].message.content);
```

### Python Package (pip)
```python
# Installation
pip install token-compressor

# Usage
from token_compressor import compress, expand
import openai

# Compress before sending
user_input = "Please analyze the customer database approximately"
compressed = compress(user_input)  # "plz ~ax the ~cst ~db ≈"

# Send to AI (uses fewer tokens)
response = openai.ChatCompletion.create(
    model="gpt-4",
    messages=[{"role": "user", "content": compressed}]
)

# Expand the response
result = expand(response.choices[0].message.content)
```

### The Codex Inside
The module contains a JSON codex discovered through evolution:
```json
{
  "version": "1.0.0",
  "compressions": {
    "approximately": "≈",
    "implementation": "~impl",
    "customer": "~cst",
    "database": "~db",
    "analyze": "~ax",
    "unfortunately": "~unf",
    "comprehensive": "~comp",
    // ... 1,000+ more discovered compressions
  },
  "patterns": {
    "suffix_tion": "†",  // implementation → implement†
    "prefix_un": "¬",    // unfortunately → ¬fortunately
    // ... discovered patterns
  },
  "stats": {
    "average_compression": 0.42,
    "total_discoveries": 1247,
    "hours_evolved": 4320
  }
}
```

### Module Features
- **Zero Configuration**: Works immediately after install
- **Framework Agnostic**: Works with any AI library
- **Reversible**: 100% accurate compression/expansion
- **Lightweight**: <50KB total size
- **Auto-Updates**: Optional codex updates as new compressions discovered
- **TypeScript Support**: Full type definitions included

### Integration Examples

**LangChain Integration**:
```python
from langchain import LLMChain
from token_compressor import CompressedLLM

# Wrap any LLM with compression
compressed_llm = CompressedLLM(
    llm=OpenAI(),
    compression_level="aggressive"  # or "balanced", "light"
)
```

**AutoGPT/Agent Systems**:
```javascript
import { middleware } from 'token-compressor';

// Add as middleware to any agent system
agent.use(middleware.compress());
```

### Pricing Model for Module

**Open Source Core**:
- Basic codex (top 100 compressions): Free
- Community edition: MIT License
- Manual updates via npm/pip

**Pro Version** ($29/month):
- Full codex (1,000+ compressions)
- Auto-updates with new discoveries
- Advanced patterns and rules
- Priority support
- Analytics dashboard

**Enterprise** (Custom pricing):
- Custom compressions for domain
- Private codex development
- SLA guarantees
- Training and integration support

## Security Considerations

### API Key Security
- Keys are client-side (visible to users)
- Use rate limiting on API provider side
- Consider proxy server for production
- Monitor usage for abuse

### Database Security
- Row Level Security enabled
- Public access policies (no auth required)
- Rate limiting via Supabase
- Regular backups recommended

### Input Validation
- Sanitize user submissions
- Length limits on compressions
- Prevent SQL injection (Supabase handles)
- Block offensive content

## Project Phases

### Phase 1: Discovery Laboratory (Months 1-3) - CURRENT
**The Website**: What we're building now
- AI agents discover compressions 24/7
- Community submits ideas
- Hourly testing ceremonies validate compressions
- Codex grows from 0 to 500+ compressions
- **Purpose**: Generate the data for the module

### Phase 2: Module Development (Months 4-6)
**Package Creation**:
- Export codex from database
- Build NPM package with compression/expansion functions
- Create pip package for Python users
- Write comprehensive documentation
- Set up automated testing

### Phase 3: Launch & Adoption (Months 6-9)
**Go to Market**:
- Release on NPM and PyPI
- Launch on Product Hunt
- Write blog posts showing 50% cost savings
- Create integration guides for popular frameworks
- Build community around the module

### Phase 4: Continuous Evolution (Ongoing)
**Living Product**:
- Website continues discovering new compressions
- Module updates monthly with new discoveries
- Community votes on controversial compressions
- Enterprise customers request domain-specific compressions

## Why This Approach?

**Traditional Approach**: Manually create compression rules → Limited, static
**Our Approach**: AI+Human evolution discovers compressions → Dynamic, comprehensive

The website isn't the product - it's the **factory that builds the product**. The module is the product that developers will actually use and pay for.

## Revenue Model

### Discovery Phase (Current)
- **Cost**: ~$10-15/month in API calls
- **Revenue**: $0 (building the dataset)

### Module Phase (Month 6+)
- **Free Tier**: Basic 100 compressions
- **Pro**: $29/month for full codex + updates
- **Enterprise**: $500-5000/month for custom compressions

### Projections
- Month 6: 100 free users, 10 pro = $290/mo
- Month 12: 1,000 free users, 100 pro, 5 enterprise = $5,400/mo
- Year 2: 10,000 free users, 1,000 pro, 50 enterprise = $54,000/mo

## Launch Strategy

### Soft Launch (Week 1)
- Deploy to production
- Test with small group
- Fix critical bugs
- Optimize API calls

### Public Launch (Week 2)
- Post on Hacker News
- Share on AI communities
- Create launch video
- Enable Twitter bot

### Growth Phase (Weeks 3-12)
- Weekly progress reports
- Community challenges
- Compression contests
- Academic paper draft

## Support & Maintenance

### Daily Tasks
- Monitor API usage
- Check error logs
- Review submissions queue
- Update leaderboard

### Weekly Tasks
- Export codex backup
- Analyze discovery patterns
- Community update post
- Cost analysis

### Monthly Tasks
- Database optimization
- API key rotation
- Performance review
- Feature planning

## Conclusion

Token Compressor represents a unique convergence of AI research, community gaming, and practical utility. By leveraging simple architecture (frontend-only), cheap AI models, and crowd-sourced discovery, we can build a valuable compression codex that saves real money for AI applications.

The system is designed to be:
- **Self-sustaining**: Runs automatically 24/7
- **Self-improving**: Gets better through evolution
- **Community-driven**: Engages users in discovery
- **Commercially viable**: Clear path to monetization

Success depends on consistent execution, community engagement, and maintaining the delicate balance between compression efficiency and semantic accuracy.