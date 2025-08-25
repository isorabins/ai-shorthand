// Error Handling Utility
window.TokenCompressor = window.TokenCompressor || {};

window.TokenCompressor.ErrorHandler = {
    // Error types
    ErrorTypes: {
        API_ERROR: 'api_error',
        NETWORK_ERROR: 'network_error', 
        VALIDATION_ERROR: 'validation_error',
        AGENT_ERROR: 'agent_error',
        CONFIG_ERROR: 'config_error',
        UNKNOWN_ERROR: 'unknown_error'
    },
    
    // Circuit breaker states
    circuitBreakers: new Map(),
    
    // Error counters for monitoring
    errorCounts: new Map(),
    
    /**
     * Handle errors with retry logic and circuit breaker pattern
     */
    async handleError(error, context = {}) {
        const errorInfo = this.classifyError(error);
        const errorKey = `${context.operation || 'unknown'}_${errorInfo.type}`;
        
        // Increment error count
        const currentCount = this.errorCounts.get(errorKey) || 0;
        this.errorCounts.set(errorKey, currentCount + 1);
        
        // Log error (if enabled)
        if (window.TokenCompressor.config.debug.enableLogging) {
            console.error(`[${errorInfo.type}] ${context.operation || 'Unknown operation'}:`, {
                error: error.message || error,
                context,
                stack: error.stack
            });
        }
        
        // Check circuit breaker
        if (this.isCircuitOpen(errorKey)) {
            throw new Error(`Circuit breaker open for ${errorKey}`);
        }
        
        // Handle different error types
        switch (errorInfo.type) {
            case this.ErrorTypes.API_ERROR:
                return this.handleAPIError(error, context);
                
            case this.ErrorTypes.NETWORK_ERROR:
                return this.handleNetworkError(error, context);
                
            case this.ErrorTypes.VALIDATION_ERROR:
                return this.handleValidationError(error, context);
                
            case this.ErrorTypes.AGENT_ERROR:
                return this.handleAgentError(error, context);
                
            default:
                return this.handleUnknownError(error, context);
        }
    },
    
    /**
     * Classify error based on error object
     */
    classifyError(error) {
        if (!error) return { type: this.ErrorTypes.UNKNOWN_ERROR, recoverable: false };
        
        const message = error.message || String(error);
        const status = error.status || error.statusCode;
        
        // API errors
        if (status >= 400 && status < 500) {
            return { type: this.ErrorTypes.API_ERROR, recoverable: status !== 429 }; // Don't retry rate limits
        }
        
        if (status >= 500) {
            return { type: this.ErrorTypes.API_ERROR, recoverable: true };
        }
        
        // Network errors
        if (message.includes('fetch') || message.includes('network') || message.includes('timeout')) {
            return { type: this.ErrorTypes.NETWORK_ERROR, recoverable: true };
        }
        
        // Validation errors
        if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
            return { type: this.ErrorTypes.VALIDATION_ERROR, recoverable: false };
        }
        
        // Agent errors
        if (message.includes('agent') || message.includes('compression') || message.includes('discovery')) {
            return { type: this.ErrorTypes.AGENT_ERROR, recoverable: true };
        }
        
        return { type: this.ErrorTypes.UNKNOWN_ERROR, recoverable: true };
    },
    
    /**
     * Handle API errors with exponential backoff
     */
    async handleAPIError(error, context) {
        const maxRetries = window.TokenCompressor.config.errorHandling.maxRetries;
        const retryCount = context.retryCount || 0;
        
        if (retryCount >= maxRetries) {
            this.showError('API Error', 'Maximum retries exceeded. Please try again later.');
            throw error;
        }
        
        // Exponential backoff
        const delay = window.TokenCompressor.config.errorHandling.retryDelay * Math.pow(2, retryCount);
        await this.sleep(delay);
        
        // Trigger circuit breaker if too many failures
        this.updateCircuitBreaker(context.operation, false);
        
        throw { ...error, retryAfter: delay, retryCount: retryCount + 1 };
    },
    
    /**
     * Handle network errors
     */
    async handleNetworkError(error, context) {
        // Check if we're offline
        if (!navigator.onLine) {
            this.showError('Network Error', 'You appear to be offline. Please check your connection.');
            return this.getOfflineFallback(context);
        }
        
        // Same retry logic as API errors
        return this.handleAPIError(error, context);
    },
    
    /**
     * Handle validation errors (no retry)
     */
    handleValidationError(error, context) {
        const userMessage = this.getUserFriendlyMessage(error, context);
        this.showError('Validation Error', userMessage);
        
        // Highlight problematic form fields
        if (context.formField) {
            this.highlightFormError(context.formField);
        }
        
        throw error;
    },
    
    /**
     * Handle agent-specific errors
     */
    async handleAgentError(error, context) {
        // Agent errors are often recoverable with fallback behavior
        if (context.agentName) {
            console.warn(`Agent ${context.agentName} encountered error, using fallback:`, error.message);
            return this.getAgentFallback(context);
        }
        
        return this.handleAPIError(error, context);
    },
    
    /**
     * Handle unknown errors
     */
    handleUnknownError(error, context) {
        this.showError('Unexpected Error', 'Something went wrong. Please refresh the page and try again.');
        
        // Report to monitoring service in production
        if (window.TokenCompressor.config.environment === 'production') {
            this.reportError(error, context);
        }
        
        throw error;
    },
    
    /**
     * Circuit breaker pattern implementation
     */
    isCircuitOpen(key) {
        const breaker = this.circuitBreakers.get(key);
        if (!breaker) return false;
        
        const now = Date.now();
        const threshold = window.TokenCompressor.config.errorHandling.circuitBreakerThreshold;
        const resetTime = window.TokenCompressor.config.errorHandling.circuitBreakerResetTime;
        
        // Check if circuit should reset
        if (now - breaker.lastFailure > resetTime) {
            this.circuitBreakers.delete(key);
            return false;
        }
        
        return breaker.failureCount >= threshold;
    },
    
    /**
     * Update circuit breaker state
     */
    updateCircuitBreaker(operation, success) {
        if (!operation) return;
        
        const key = operation;
        const breaker = this.circuitBreakers.get(key) || { failureCount: 0, lastFailure: 0 };
        
        if (success) {
            breaker.failureCount = Math.max(0, breaker.failureCount - 1);
        } else {
            breaker.failureCount++;
            breaker.lastFailure = Date.now();
        }
        
        this.circuitBreakers.set(key, breaker);
    },
    
    /**
     * Show error to user
     */
    showError(title, message) {
        const errorBoundary = document.getElementById('error-boundary');
        const errorMessage = document.getElementById('error-message');
        
        if (errorBoundary && errorMessage) {
            errorMessage.textContent = message;
            errorBoundary.style.display = 'flex';
            
            // Auto-hide after 10 seconds for non-critical errors
            if (!title.includes('Configuration')) {
                setTimeout(() => {
                    errorBoundary.style.display = 'none';
                }, 10000);
            }
        } else {
            // Fallback to alert
            alert(`${title}: ${message}`);
        }
    },
    
    /**
     * Hide error display
     */
    hideError() {
        const errorBoundary = document.getElementById('error-boundary');
        if (errorBoundary) {
            errorBoundary.style.display = 'none';
        }
    },
    
    /**
     * Get user-friendly error message
     */
    getUserFriendlyMessage(error, context) {
        const message = error.message || String(error);
        
        if (message.includes('required')) {
            return 'Please fill in all required fields.';
        }
        
        if (message.includes('email')) {
            return 'Please enter a valid email address.';
        }
        
        if (message.includes('compression')) {
            return 'Please check your compression format.';
        }
        
        if (message.includes('rate limit')) {
            return 'Too many requests. Please wait a moment and try again.';
        }
        
        return 'Please check your input and try again.';
    },
    
    /**
     * Highlight form field with error
     */
    highlightFormError(fieldId) {
        const field = document.getElementById(fieldId);
        const formGroup = field?.closest('.form-group');
        
        if (formGroup) {
            formGroup.classList.add('error');
            
            // Remove error styling after 5 seconds
            setTimeout(() => {
                formGroup.classList.remove('error');
            }, 5000);
        }
    },
    
    /**
     * Get offline fallback data
     */
    getOfflineFallback(context) {
        if (context.operation === 'search') {
            return {
                title: 'Offline Mode',
                content: 'Using cached article for analysis...',
                url: 'offline://cached-content'
            };
        }
        
        return null;
    },
    
    /**
     * Get agent fallback behavior
     */
    getAgentFallback(context) {
        const agentName = context.agentName;
        
        if (agentName === 'Discovery Agent') {
            return {
                wastefulWords: [
                    { word: 'approximately', tokens: 3, frequency: 1 },
                    { word: 'implementation', tokens: 3, frequency: 1 }
                ]
            };
        }
        
        if (agentName === 'Generation Agent') {
            return {
                compressions: [
                    { original: 'approximately', compressed: '≈' },
                    { original: 'implementation', compressed: '~impl' }
                ]
            };
        }
        
        return null;
    },
    
    /**
     * Report error to monitoring service
     */
    reportError(error, context) {
        // In production, send to monitoring service (Sentry, LogRocket, etc.)
        // For now, just log structured error data
        const errorReport = {
            timestamp: new Date().toISOString(),
            error: {
                message: error.message,
                stack: error.stack,
                name: error.name
            },
            context,
            userAgent: navigator.userAgent,
            url: window.location.href,
            userId: this.getUserId()
        };
        
        console.error('Error Report:', errorReport);
    },
    
    /**
     * Get anonymous user ID for error tracking
     */
    getUserId() {
        let userId = localStorage.getItem('token_compressor_user_id');
        if (!userId) {
            userId = 'anon_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('token_compressor_user_id', userId);
        }
        return userId;
    },
    
    /**
     * Sleep utility for delays
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },
    
    /**
     * Get error statistics for monitoring
     */
    getErrorStats() {
        const stats = {};
        for (const [key, count] of this.errorCounts.entries()) {
            stats[key] = count;
        }
        return stats;
    },
    
    /**
     * Reset error counters (for testing or maintenance)
     */
    resetErrorStats() {
        this.errorCounts.clear();
        this.circuitBreakers.clear();
    }
};

// Global error handler
window.addEventListener('error', (event) => {
    window.TokenCompressor.ErrorHandler.handleError(event.error, {
        operation: 'global_error',
        filename: event.filename,
        lineno: event.lineno
    });
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
    window.TokenCompressor.ErrorHandler.handleError(event.reason, {
        operation: 'unhandled_promise'
    });
    event.preventDefault(); // Prevent browser console error
});

console.log('🛡️ Error Handler initialized');