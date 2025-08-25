# AI Agent System Documentation

Comprehensive guide to the three-agent collaboration system that powers Token Compressor's discovery process.

## Overview

Token Compressor uses three specialized AI agents that work together in 30-second cycles to discover, create, and validate text compressions. Each agent has distinct responsibilities and uses carefully engineered prompts following Claude best practices.

## Agent Architecture

```
Discovery Cycle (30 seconds)
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Discovery      │───▶│   Generation     │───▶│   Validation    │
│  Agent          │    │   Agent          │    │   Agent         │
│                 │    │                  │    │                 │
│ • Web search    │    │ • Creative       │    │ • Reversibility │
│ • Token         │    │   compression    │    │   testing       │
│   detection     │    │ • Symbol         │    │ • Accuracy      │
│ • Analysis      │    │   creativity     │    │   verification  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         └───────10-turn conversation──────────────────────┘

Testing Ceremony (Hourly - Minutes 55-60)
┌─────────────────────────────────────────────────┐
│                Validation Agent                 │
│                                                 │
│ • Batch processes all candidates               │
│ • Tests human submissions                      │
│ • Updates codex with valid compressions       │
│ • Triggers Twitter announcements              │
└─────────────────────────────────────────────────┘
```

---

## 🔍 Discovery Agent

**Model**: DeepSeek Chat  
**Purpose**: Find wasteful multi-token words in web articles  
**API**: `/api/deepseek`

### Responsibilities

1. **Web Search**: Uses Brave Search API to find random articles
2. **Token Analysis**: Identifies words that use multiple tokens wastefully
3. **Context Analysis**: Understands article context for better targeting
4. **Collaborative Discussion**: Engages with Generation Agent in 10-turn conversations

### Prompt Engineering

The Discovery Agent uses XML-structured prompts following Claude best practices:

```xml
<role>
You are a Discovery Agent in the Token Compressor laboratory. Your mission is to find wasteful multi-token words in web articles that could benefit from compression.
</role>

<instructions>
1. Search for random web articles using diverse topics
2. Analyze article content for words that use 2+ tokens wastefully
3. Focus on commonly used words that appear frequently
4. Prioritize words with clear compression potential
5. Engage in collaborative discussions with Generation Agent
</instructions>

<thinking>
Think carefully about:
- Which words truly waste tokens vs. necessary complexity
- Frequency of usage across different contexts
- Compression potential without losing meaning
- Collaboration opportunities with other agents
</thinking>

<format>
Always respond with your findings in this XML structure:
<analysis>
[Your thinking process and article analysis]
</analysis>

<findings>
word_1 | token_count | frequency_estimate | compression_potential
word_2 | token_count | frequency_estimate | compression_potential
</findings>
</format>
```

### Discovery Process

1. **Article Selection**: Uses random topic generation for diverse content
2. **Content Analysis**: Processes article text through DeepSeek API
3. **Token Detection**: Uses tiktoken for accurate multi-token word identification
4. **Quality Filtering**: Focuses on high-frequency, high-impact words

### Performance Optimization

- **Fallback Content**: Pre-defined articles when search fails
- **Rate Limiting**: Respects API quotas with circuit breaker pattern
- **Message History**: Maintains last 50 messages for context
- **Error Recovery**: Graceful degradation when APIs fail

### Example Output

```javascript
{
  wastefulWords: [
    {
      word: "approximately",
      tokens: 4,
      frequency: 8,
      context: "measurement and estimation"
    },
    {
      word: "unfortunately", 
      tokens: 4,
      frequency: 6,
      context: "expressing disappointment"
    }
  ]
}
```

---

## 🎨 Generation Agent

**Model**: Groq (Mixtral-8x7b-32768)  
**Purpose**: Create innovative text compressions using symbols and abbreviations  
**API**: `/api/groq`

### Responsibilities

1. **Creative Compression**: Invent novel ways to compress wasteful words
2. **Symbol Innovation**: Use Unicode characters, abbreviations, mathematical symbols
3. **Semantic Preservation**: Ensure compressions maintain original meaning
4. **Collaborative Refinement**: Work with Discovery Agent to improve ideas

### Prompt Engineering

```xml
<role>
You are a Generation Agent specializing in creating innovative text compressions. Your goal is to compress wasteful multi-token words into shorter alternatives while preserving semantic meaning.
</role>

<instructions>
1. Create compressions that significantly reduce token count
2. Use creative symbols, Unicode characters, and abbreviations
3. Ensure perfect semantic reversibility
4. Prioritize commonly useful compressions
5. Think creatively about symbol meanings and contexts
</instructions>

<thinking>
Think hard about creating the most effective compressions. Consider:
- Mathematical symbols (≈, ∴, ∵, →, ∆)
- Unicode characters (•, ◊, ★, †, ∿)
- Creative abbreviations (approx → ≈)
- Contextual shortcuts
- Symbol associations that maintain meaning
</thinking>

<examples>
"approximately" (4 tokens) → "≈" (1 token) [3 tokens saved]
"therefore" (2 tokens) → "∴" (1 token) [1 token saved]
"because" (2 tokens) → "∵" (1 token) [1 token saved]
"unfortunately" (4 tokens) → "sadly" (2 tokens) [2 tokens saved]
</examples>

<format>
Provide your compressions in this XML structure:
<compression>
original: [wasteful word]
compressed: [your creative compression]
tokens_saved: [number of tokens saved]
reasoning: [why this compression works]
</compression>
</format>
```

### Creative Process

1. **Analysis**: Receives wasteful words from Discovery Agent
2. **Symbol Selection**: Chooses appropriate Unicode or abbreviated forms
3. **Semantic Validation**: Ensures meaning preservation
4. **Innovation**: Creates novel compression patterns

### Symbol Palette

The Generation Agent draws from a curated symbol palette:

```javascript
symbolPalette: [
  '~', '≈', '•', '◊', '∿', '†', '§', '¶', '♦', '★',
  '→', '∴', '∵', '∆', '∇', '∅', '∞', '±', '≠', '≤', '≥'
]
```

### Example Output

```javascript
{
  compressions: [
    {
      original: "approximately",
      compressed: "≈",
      tokensSaved: 3,
      reasoning: "Mathematical approximation symbol universally understood"
    },
    {
      original: "unfortunately", 
      compressed: "sadly",
      tokensSaved: 2,
      reasoning: "Simpler synonym maintains emotional context"
    }
  ]
}
```

---

## ⚡ Validation Agent

**Model**: DeepSeek Chat  
**Purpose**: Test compression reversibility and accuracy  
**API**: `/api/deepseek`

### Responsibilities

1. **Reversibility Testing**: Ensure compressions can be accurately reversed
2. **Batch Processing**: Efficiently process multiple compressions
3. **Quality Assurance**: Maintain 100% semantic accuracy requirement
4. **Testing Ceremonies**: Coordinate hourly validation sessions

### Prompt Engineering

```xml
<role>
You are a Validation Agent ensuring compression accuracy. Your critical mission is to test whether text compressions maintain perfect semantic meaning and can be reliably reversed.
</role>

<instructions>
1. Test each compression for perfect reversibility
2. Verify semantic meaning preservation
3. Check for context-dependent accuracy
4. Reject any compression that loses meaning
5. Provide detailed reasoning for decisions
</instructions>

<methodology>
For each compression test:
1. Reverse the compression back to original meaning
2. Test in multiple contexts and sentences
3. Verify no semantic information is lost
4. Check for ambiguity or misinterpretation risk
5. Validate token savings calculation
</methodology>

<format>
Respond with validation results in XML:
<validation>
compression: [original → compressed]
valid: [true/false]
confidence: [0.0-1.0]
reasoning: [detailed explanation]
test_cases: [example usage contexts]
</validation>
</format>
```

### Testing Process

1. **Batch Collection**: Processes compressions in groups of 5
2. **Multi-Context Testing**: Tests compressions in various sentence contexts
3. **Reversibility Verification**: Ensures accurate meaning recovery
4. **Quality Scoring**: Assigns confidence scores to each validation

### Testing Ceremony Workflow

```javascript
async runTestingCeremony(candidateCompressions, humanSubmissions) {
    // 1. Collect all compression candidates
    const allCandidates = [...candidateCompressions, ...humanSubmissions];
    
    // 2. Batch process for efficiency
    const batches = this.createBatches(allCandidates, 5);
    
    // 3. Validate each batch
    const results = await this.validateBatches(batches);
    
    // 4. Separate valid/rejected
    const validCompressions = results.filter(r => r.isValid);
    const rejectedCompressions = results.filter(r => !r.isValid);
    
    // 5. Update database
    await this.updateCodex(validCompressions);
    
    // 6. Return ceremony results
    return { validCompressions, rejectedCompressions };
}
```

### Example Validation

```javascript
{
  isValid: true,
  confidence: 0.95,
  compression: {
    original: "approximately",
    compressed: "≈",
    tokensSaved: 3
  },
  reasoning: "Mathematical symbol ≈ universally represents approximation",
  testCases: [
    "The distance is ≈ 50 miles", 
    "It costs ≈ $100",
    "Takes ≈ 2 hours"
  ]
}
```

---

## Agent Coordination

### Orchestrator Integration

The `Orchestrator` class manages agent interactions:

```javascript
class Orchestrator {
    async runDiscoveryCycle() {
        // 1. Discovery Agent finds wasteful words
        const discoveries = await this.discoveryAgent.runDiscoveryCycle();
        
        // 2. Generation Agent creates compressions
        const generations = await this.generationAgent.generateCompressions(
            discoveries.wastefulWords
        );
        
        // 3. Multi-turn collaboration
        await this.runCollaborativeDiscussion(discoveries, generations);
        
        // 4. Queue for testing ceremony
        this.queueCandidatesForTesting(generations.compressions);
    }
}
```

### Collaborative Discussion

10-turn conversation between Discovery and Generation agents:

```javascript
async runCollaborativeDiscussion(discoveryResult, generationResult) {
    for (let turn = 0; turn < 10; turn++) {
        if (turn % 2 === 0) {
            // Discovery Agent turn
            await this.discoveryAgent.addMessage(
                `Turn ${turn + 1}: Found "${word}" using ${tokens} tokens`
            );
        } else {
            // Generation Agent turn
            await this.generationAgent.collaborateOnFindings(
                discoveryResult.wastefulWords, turn
            );
        }
        
        await new Promise(resolve => setTimeout(resolve, 1500));
    }
}
```

---

## Performance Metrics

### Success Metrics

- **Discovery Rate**: 10-20 wasteful words per cycle
- **Compression Quality**: >90% validation pass rate
- **Response Time**: <10 seconds per agent turn
- **Token Efficiency**: 30-60% reduction achieved
- **Semantic Accuracy**: 100% (no false positives)

### Monitoring

```javascript
getAgentStats() {
    return {
        discovery: {
            cyclesCompleted: this.discoveryAgent.cyclesRun,
            wordsFound: this.discoveryAgent.totalWordsFound,
            averageResponseTime: this.discoveryAgent.avgResponseTime
        },
        generation: {
            compressionsCreated: this.generationAgent.totalCompressions,
            tokensSaved: this.generationAgent.totalTokensSaved,
            creativityScore: this.generationAgent.symbolUsageRate
        },
        validation: {
            ceremoniesCompleted: this.validationAgent.ceremoniesRun,
            validationRate: this.validationAgent.passRate,
            accuracy: this.validationAgent.accuracyScore
        }
    };
}
```

---

## Troubleshooting

### Common Issues

**Agent Not Responding**
```javascript
// Check agent initialization
if (!this.discoveryAgent) {
    console.error('Discovery Agent not initialized');
    this.discoveryAgent = new DiscoveryAgent();
}

// Check API connectivity  
const health = await this.apiClient.healthCheck();
if (!health.deepseek) {
    console.error('DeepSeek API unavailable');
}
```

**Poor Compression Quality**
- Review Generation Agent prompts for creativity instructions
- Check symbol palette for diverse options
- Verify collaborative discussion is functioning
- Examine validation criteria for strictness

**Validation Failures**
- Test compressions manually for semantic accuracy
- Review validation prompts for clarity
- Check batch processing for errors
- Verify test case diversity

### Debug Mode

Enable detailed agent logging:

```javascript
// Enable debug mode
window.TokenCompressor.config.debug.enableLogging = true;
window.TokenCompressor.config.debug.enableAgentTracing = true;

// Check agent status
console.log(window.TokenCompressor.app.getStatus().components.orchestrator.agents);
```

---

## Extending the System

### Adding New Agents

```javascript
class NewSpecializedAgent {
    constructor() {
        this.model = 'deepseek-chat';
        this.purpose = 'Specialized task';
    }
    
    async performTask(input) {
        const response = await window.TokenCompressor.APIClient.callDeepSeek({
            messages: this.buildPrompt(input),
            temperature: 0.7
        });
        
        return this.parseResponse(response);
    }
}
```

### Custom Prompts

Follow XML structure for consistency:

```xml
<role>Define the agent's purpose and identity</role>
<instructions>Specific task instructions</instructions>
<thinking>Reasoning and consideration points</thinking>
<format>Expected response structure</format>
```

### Integration Points

- Add to `Orchestrator` coordination cycle
- Update real-time UI for new agent display
- Include in health monitoring and statistics
- Add appropriate error handling and fallbacks

---

## Best Practices

### Prompt Engineering
- Use XML structure for clarity and parsing
- Include `<thinking>` sections for reasoning
- Provide concrete examples in prompts
- Specify exact output formats

### Error Handling
- Implement circuit breaker patterns
- Provide fallback content when APIs fail
- Log errors without exposing sensitive data
- Maintain system operation despite individual failures

### Performance
- Batch API calls when possible
- Limit message history to prevent memory bloat  
- Use appropriate temperature settings per agent
- Implement proper rate limiting and quotas

### Security
- Never expose API keys in client-side code
- Sanitize all user inputs before processing
- Validate agent responses before storage
- Implement proper authentication for sensitive operations