// Brave Search API proxy
import { rateLimit, validateInput, sanitizeInput, createErrorResponse, createSuccessResponse, corsHeaders } from './_middleware.js';

export default async function handler(req, res) {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).json({});
    }
    
    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    // Rate limiting
    if (!rateLimit(req)) {
        return res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
    }
    
    try {
        const { query, domain } = req.body;
        
        // Validate input
        const validation = validateInput({ query }, {
            query: { required: true, type: 'string', maxLength: 200 }
        });
        
        if (!validation.valid) {
            return res.status(400).json({ error: validation.errors.join(', ') });
        }
        
        // Sanitize input
        const sanitizedQuery = sanitizeInput(query);
        const searchQuery = domain ? `${sanitizedQuery} ${domain}` : sanitizedQuery;
        
        // Call Brave Search API
        const response = await fetch('https://api.search.brave.com/res/v1/web/search', {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'X-Subscription-Token': process.env.BRAVE_SEARCH_API_KEY
            },
            params: new URLSearchParams({
                q: searchQuery,
                count: 3,
                offset: 0,
                mkt: 'en-US',
                safesearch: 'moderate',
                textDecorations: false,
                textFormat: 'Raw'
            })
        });
        
        if (!response.ok) {
            throw new Error(`Brave Search API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Extract and format results
        const results = data.web?.results || [];
        const articles = results.map(result => ({
            title: result.title,
            content: result.description || result.snippet || '',
            url: result.url,
            published: result.age || 'recent'
        }));
        
        // If no results, return fallback
        if (articles.length === 0) {
            return res.status(200).json({
                articles: [{
                    title: 'Fallback Article',
                    content: getFallbackArticle(),
                    url: 'https://example.com/fallback',
                    published: 'recent'
                }]
            });
        }
        
        return res.status(200).json({ articles });
        
    } catch (error) {
        console.error('Search API error:', error);
        
        // Return fallback on any error
        return res.status(200).json({
            articles: [{
                title: 'Fallback Content',
                content: getFallbackArticle(),
                url: 'https://example.com/fallback',
                published: 'recent'
            }]
        });
    }
}

function getFallbackArticle() {
    const fallbackArticles = [
        `Recent developments in artificial intelligence have demonstrated remarkable progress in natural language processing capabilities. The implementation of transformer architectures has revolutionized how machines understand and generate human-like text. Researchers are approximately certain that these advances will continue to accelerate. Unfortunately, computational requirements remain substantial, requiring significant infrastructure investments.`,
        
        `Machine learning algorithms are increasingly being deployed across various industries to optimize business processes. The implementation of automated decision-making systems has shown approximately 40% improvement in operational efficiency. Companies are leveraging comprehensive data analysis to gain competitive advantages. Unfortunately, the complexity of these systems often requires specialized expertise for proper implementation.`,
        
        `Scientific research into renewable energy technologies continues to yield promising results. The development of more efficient solar panels and wind turbines represents approximately 60% improvement over previous generations. Comprehensive environmental impact assessments demonstrate substantial benefits. Unfortunately, the initial costs for implementation remain challenging for many organizations.`
    ];
    
    return fallbackArticles[Math.floor(Math.random() * fallbackArticles.length)];
}