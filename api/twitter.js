// Twitter bot API for hourly discovery announcements
import { rateLimit, validateInput, sanitizeInput, createErrorResponse, createSuccessResponse } from './_middleware.js';

export default async function handler(req, res) {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).json({});
    }
    
    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    // Rate limiting (stricter for Twitter)
    if (!rateLimit(req)) {
        return res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
    }
    
    try {
        const { compressions, hour, humanWins, aiWins } = req.body;
        
        // Validate input
        const validation = validateInput({ hour }, {
            hour: { required: true, type: 'string' }
        });
        
        if (!validation.valid) {
            return res.status(400).json({ error: validation.errors.join(', ') });
        }
        
        // Create tweet content
        const tweetContent = createTweetContent({
            compressions: compressions || [],
            hour: parseInt(hour) || 1,
            humanWins: parseInt(humanWins) || 0,
            aiWins: parseInt(aiWins) || 0
        });
        
        // For now, simulate Twitter posting (replace with actual Twitter API when ready)
        const success = await simulateTwitterPost(tweetContent);
        
        if (!success) {
            throw new Error('Failed to post tweet');
        }
        
        return res.status(200).json({
            success: true,
            tweet: tweetContent,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Twitter API error:', error);
        
        return res.status(200).json({
            success: false,
            error: error.message,
            fallback: true
        });
    }
}

function createTweetContent({ compressions, hour, humanWins, aiWins }) {
    const totalDiscoveries = compressions.length;
    const humanDiscoveries = compressions.filter(c => c.source?.startsWith('Human:')).length;
    const aiDiscoveries = compressions.filter(c => c.source === 'AI').length;
    
    // Calculate token savings
    const totalSavings = compressions.reduce((sum, c) => sum + (c.tokens_saved || 0), 0);
    
    if (totalDiscoveries === 0) {
        return `⏰ Hour ${hour} Complete!

🔬 Testing ceremony finished
📊 No new compressions this hour
🤖 AI agents continue searching...
🏆 Running total - Humans: ${humanWins} | AI: ${aiWins}

Submit your ideas: tokencompressor.ai
#TokenCompressor #AI #Efficiency`;
    }
    
    // Show one featured discovery (human preferred, then AI)
    const featuredDiscovery = compressions.find(c => c.source?.startsWith('Human:')) || compressions[0];
    
    let tweet = `🎉 Hour ${hour} Discoveries!

`;
    
    if (featuredDiscovery) {
        const source = featuredDiscovery.source?.startsWith('Human:') ? 
            featuredDiscovery.source.replace('Human: ', '@') : 'AI';
        
        tweet += `🌟 Featured: "${featuredDiscovery.original}" → "${featuredDiscovery.compressed}"
💰 Saves ${(featuredDiscovery.tokens_saved || 100).toLocaleString()} tokens/day
👤 Discovered by: ${source}

`;
    }
    
    tweet += `📈 This hour: ${totalDiscoveries} compression${totalDiscoveries !== 1 ? 's' : ''}`;
    
    if (humanDiscoveries > 0 && aiDiscoveries > 0) {
        tweet += ` (${humanDiscoveries} human, ${aiDiscoveries} AI)`;
    }
    
    tweet += `
💾 Total savings: ${totalSavings.toLocaleString()} tokens
🏆 Score - Humans: ${humanWins} | AI: ${aiWins}

Beat the AI: tokencompressor.ai
#TokenCompressor #AI`;
    
    // Ensure tweet is under 280 characters
    if (tweet.length > 280) {
        // Simplified version
        tweet = `⚡ Hour ${hour}: ${totalDiscoveries} new compression${totalDiscoveries !== 1 ? 's' : ''} discovered!

Featured: "${featuredDiscovery.original}" → "${featuredDiscovery.compressed}"
By: ${featuredDiscovery.source?.startsWith('Human:') ? 'Human' : 'AI'}

Humans ${humanWins} | AI ${aiWins}

Join: tokencompressor.ai
#TokenCompressor`;
    }
    
    return tweet;
}

async function simulateTwitterPost(content) {
    // TODO: Replace with actual Twitter API integration
    // For now, just log the tweet content and return success
    
    console.log('📱 Would tweet:', content);
    console.log('📱 Tweet length:', content.length);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // For development, always return success
    // In production, implement actual Twitter API v2 posting:
    /*
    const response = await fetch('https://api.twitter.com/2/tweets', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.TWITTER_BEARER_TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            text: content
        })
    });
    
    return response.ok;
    */
    
    return true;
}

// Helper function to format numbers
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}