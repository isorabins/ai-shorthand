// Configuration Module
window.TokenCompressor = window.TokenCompressor || {};

// Application Configuration
window.TokenCompressor.config = {
    // Supabase Configuration (public keys - safe for client-side)
    supabase: {
        url: 'https://zxpdbqkybamowbktzbku.supabase.co',
        anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4cGRicWt5YmFtb3dia3R6Ymt1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5ODY4NDUsImV4cCI6MjA3MTU2Mjg0NX0.Og82UXBXUzeJQiKIEnM2Ol_hZOJ64iZP9iIYWZCvnmA' 
    },
    
    // API Configuration (no keys - proxied through Vercel)
    api: {
        baseUrl: '/api',
        endpoints: {
            search: '/api/search',
            deepseek: '/api/deepseek', 
            groq: '/api/groq',
            twitter: '/api/twitter',
            tokenize: '/api/tokenize'
        }
    },
    
    // Agent Configuration
    agents: {
        discovery: {
            name: 'Discovery Agent',
            searchInterval: 30000, // 30 seconds
            maxArticleLength: 2000,
            minTokensToAnalyze: 5
        },
        generation: {
            name: 'Generation Agent',
            creativity: 0.7,
            maxSuggestionsPerCycle: 5,
            symbolPalette: ['~', '≈', '•', '◊', '∿', '†', '§', '¶', '♦', '★'],
            // Enhanced mathematical symbol palette for context-safe compressions
            mathematicalSymbols: {
                // Primary mathematical symbols that never precede English words
                singleToken: ['∂', '∫', '∏', '∑', 'Δ', 'Ω', 'α', 'β', 'γ', 'δ', 'ε', 'θ', 'λ', 'μ', 'π', 'ρ', 'σ', 'τ', 'φ', 'ψ', 'ω'],
                // Special symbols for suffix patterns
                suffixSymbols: ['†', '‡', '§', '¶', '◊', '♦', '♠', '♣', '♥', '♪', '♫'],
                // Currency and other unique symbols
                currencySymbols: ['¢', '£', '¥', '€', '₹', '₽', '₿'],
                // Baseline mathematical compressions (from ideas document)
                baseline: {
                    'unfortunately': '∂',
                    'implementation': '∫', 
                    'comprehensive': '∏',
                    'approximately': '≈',
                    'communication': 'Δ',
                    'infrastructure': 'Ω',
                    'database': 'Σ',
                    'customer': 'μ',
                    'analyze': 'α',
                    'however': 'λ',
                    'therefore': '∴',
                    'development': 'δ',
                    'management': 'π',
                    'performance': 'ρ',
                    'configuration': 'θ'
                }
            }
        },
        validation: {
            name: 'Validation Agent',
            testCorpusSize: 10,
            reversibilityThreshold: 1.0,
            maxTestDuration: 10000 // 10 seconds
        }
    },
    
    // Discovery Process Configuration
    discovery: {
        cycleInterval: 30000, // 30 seconds
        conversationTurns: 10,
        testingCeremonyStart: 55, // minute 55
        testingCeremonyDuration: 300000, // 5 minutes
        maxPendingCandidates: 100
    },
    
    // UI Configuration
    ui: {
        maxChatMessages: 50,
        maxTimelineItems: 20,
        updateInterval: 1000, // 1 second
        typingIndicatorDelay: 2000
    },
    
    // Search Topics for Discovery Agent
    searchTopics: [
        'artificial intelligence research 2024',
        'machine learning breakthroughs',
        'quantum computing advances', 
        'climate change scientific findings',
        'medical research discoveries',
        'software engineering innovations',
        'cryptocurrency technology updates',
        'space exploration missions',
        'renewable energy developments',
        'biotechnology progress',
        'robotics automation trends',
        'cybersecurity threat analysis',
        'data science methodologies',
        'cloud computing architecture',
        'blockchain applications business'
    ],
    
    // Search Domains for Variety
    searchDomains: [
        'site:arxiv.org',
        'site:nature.com',
        'site:techcrunch.com',
        'site:wired.com',
        'site:scientificamerican.com',
        'site:mit.edu',
        'site:stanford.edu',
        'site:medium.com',
        'site:venturebeat.com',
        'site:ycombinator.com'
    ],
    
    // Error Handling Configuration
    errorHandling: {
        maxRetries: 3,
        retryDelay: 1000, // Base delay in ms
        circuitBreakerThreshold: 5,
        circuitBreakerResetTime: 300000 // 5 minutes
    },
    
    // Rate Limiting
    rateLimiting: {
        apiCallsPerMinute: 60,
        burstLimit: 10,
        cooldownPeriod: 1000
    },
    
    // Development/Debug Flags
    debug: {
        enableLogging: true,
        simulateAPIFailures: false,
        useOfflineMode: false,
        skipAuthentication: false
    }
};

// Environment Detection - Safe for testing
window.TokenCompressor.config.environment = (() => {
    // Safe check for testing environments
    if (!window.location) {
        return 'test';
    }
    
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'development';
    } else if (window.location.hostname.includes('vercel.app')) {
        return 'staging';
    } else {
        return 'production';
    }
})();

// Update debug settings based on environment
if (window.TokenCompressor.config.environment === 'production') {
    window.TokenCompressor.config.debug.enableLogging = false;
    window.TokenCompressor.config.debug.simulateAPIFailures = false;
}

// Validation function for configuration
window.TokenCompressor.validateConfig = () => {
    const config = window.TokenCompressor.config;
    const errors = [];
    
    // Check required configuration
    if (!config.supabase.url || config.supabase.url.includes('your-project')) {
        errors.push('Supabase URL not configured');
    }
    
    if (!config.supabase.anonKey || config.supabase.anonKey.includes('your-supabase')) {
        errors.push('Supabase anon key not configured');
    }
    
    // Check intervals
    if (config.agents.discovery.searchInterval < 10000) {
        errors.push('Search interval too short (minimum 10 seconds)');
    }
    
    if (config.discovery.conversationTurns > 20) {
        errors.push('Too many conversation turns (maximum 20)');
    }
    
    return {
        valid: errors.length === 0,
        errors
    };
};

// Initialize configuration validation
// Safe DOM loading for browser environments
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
    const validation = window.TokenCompressor.validateConfig();
    if (!validation.valid) {
        console.error('Configuration validation failed:', validation.errors);
        window.TokenCompressor.ErrorHandler?.showError(
            'Configuration Error',
            'Please check console for configuration issues.'
        );
    }
    });
}

console.log(`🤖 Token Compressor Config loaded (${window.TokenCompressor.config.environment})`);