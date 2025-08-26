// Shared middleware and utilities for API routes
export const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Rate limiting store (in-memory for simplicity)
const rateLimitStore = new Map();

export function rateLimit(req) {
    const ip = req.headers['x-forwarded-for'] || req.connection?.remoteAddress || req.socket?.remoteAddress || 'localhost';
    const key = `rate_limit_${ip}`;
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute
    const maxRequests = 60;
    
    const requests = rateLimitStore.get(key) || [];
    
    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < windowMs);
    
    if (validRequests.length >= maxRequests) {
        return false; // Rate limit exceeded
    }
    
    // Add current request
    validRequests.push(now);
    rateLimitStore.set(key, validRequests);
    
    return true; // Allow request
}

export function validateInput(data, schema) {
    const errors = [];
    
    for (const [field, rules] of Object.entries(schema)) {
        const value = data[field];
        
        if (rules.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
            errors.push(`${field} is required`);
            continue;
        }
        
        if (value && rules.type === 'string' && typeof value !== 'string') {
            errors.push(`${field} must be a string`);
        }
        
        if (value && rules.maxLength && value.length > rules.maxLength) {
            errors.push(`${field} must be less than ${rules.maxLength} characters`);
        }
        
        if (value && rules.pattern && !rules.pattern.test(value)) {
            errors.push(`${field} format is invalid`);
        }
    }
    
    return { valid: errors.length === 0, errors };
}

export function sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    // Remove potentially dangerous patterns
    return input
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .trim();
}

export function createErrorResponse(message, status = 500) {
    return new Response(
        JSON.stringify({ error: message }),
        { 
            status, 
            headers: { 
                'Content-Type': 'application/json',
                ...corsHeaders 
            }
        }
    );
}

export function createSuccessResponse(data) {
    return new Response(
        JSON.stringify(data),
        {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                ...corsHeaders
            }
        }
    );
}