// Token Compressor - Main initialization and coordination
window.TokenCompressor = window.TokenCompressor || {};

/**
 * Main application class that initializes and coordinates all components
 */
window.TokenCompressor.App = class App {
    constructor() {
        this.isInitialized = false;
        this.components = new Map();
        this.startTime = Date.now();
        
        console.log('🚀 Token Compressor App starting...');
    }
    
    /**
     * Initialize the entire application
     */
    async initialize() {
        if (this.isInitialized) return;
        
        try {
            console.log('🔧 Initializing Token Compressor...');
            
            // Step 1: Initialize error handler first
            if (window.TokenCompressor.ErrorHandler) {
                // ErrorHandler is a simple object, doesn't need initialization
                this.components.set('errorHandler', window.TokenCompressor.ErrorHandler);
                console.log('✅ Error handler ready');
            }
            
            // Step 2: Initialize configuration
            if (window.TokenCompressor.config) {
                console.log('⚙️ Configuration loaded');
            }
            
            // Step 3: Initialize Supabase client
            if (window.TokenCompressor.SupabaseClient) {
                const supabaseInit = window.TokenCompressor.SupabaseClient.init();
                if (!supabaseInit) {
                    throw new Error('Failed to initialize Supabase client');
                }
                this.components.set('supabaseClient', window.TokenCompressor.SupabaseClient);
                console.log('📊 Supabase client initialized');
            }
            
            // Step 4: Initialize API client
            if (window.TokenCompressor.APIClient) {
                this.components.set('apiClient', window.TokenCompressor.APIClient);
                console.log('🔌 API client initialized');
            }
            
            // Step 5: Initialize Real-time UI
            if (window.TokenCompressor.RealTimeUI) {
                const realTimeUI = new window.TokenCompressor.RealTimeUI();
                await realTimeUI.initialize();
                this.components.set('realTimeUI', realTimeUI);
                console.log('🖥️ Real-time UI initialized');
            }
            
            // Step 6: Initialize and start Orchestrator
            if (window.TokenCompressor.Orchestrator) {
                const orchestrator = new window.TokenCompressor.Orchestrator();
                await orchestrator.initialize();
                this.components.set('orchestrator', orchestrator);
                console.log('🎭 Orchestrator initialized and running');
            }
            
            // Step 7: Set up global event handlers
            this.setupGlobalEventHandlers();
            
            // Step 8: Set up periodic health checks
            this.startHealthMonitoring();
            
            // Step 9: Show initialization complete
            this.showInitializationComplete();
            
            this.isInitialized = true;
            console.log(`🎉 Token Compressor fully initialized in ${Date.now() - this.startTime}ms`);
            
        } catch (error) {
            console.error('💥 Token Compressor initialization failed:', error);
            this.showInitializationError(error);
        }
    }
    
    /**
     * Set up global event handlers
     */
    setupGlobalEventHandlers() {
        // Handle visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                console.log('📱 App hidden - pausing non-essential updates');
                this.pauseBackgroundTasks();
            } else {
                console.log('📱 App visible - resuming updates');
                this.resumeBackgroundTasks();
            }
        });
        
        // Handle page unload
        window.addEventListener('beforeunload', () => {
            this.cleanup();
        });
        
        // Handle errors
        window.addEventListener('error', (event) => {
            console.error('🚨 Global error:', event.error);
            const errorHandler = this.components.get('errorHandler');
            if (errorHandler) {
                errorHandler.handleError(event.error, 'Global Error');
            }
        });
        
        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            console.error('🚨 Unhandled promise rejection:', event.reason);
            const errorHandler = this.components.get('errorHandler');
            if (errorHandler) {
                errorHandler.handleError(event.reason, 'Promise Rejection');
            }
        });
        
        console.log('🎯 Global event handlers set up');
    }
    
    /**
     * Start health monitoring
     */
    startHealthMonitoring() {
        // Check system health every 30 seconds
        setInterval(() => {
            this.performHealthCheck();
        }, 30000);
        
        console.log('🩺 Health monitoring started');
    }
    
    /**
     * Perform health check on all components
     */
    performHealthCheck() {
        try {
            const orchestrator = this.components.get('orchestrator');
            const realTimeUI = this.components.get('realTimeUI');
            
            // Check if orchestrator is running
            if (orchestrator && !orchestrator.isRunning) {
                console.warn('⚠️ Orchestrator not running - attempting restart');
                orchestrator.startDiscoveryProcess();
            }
            
            // Check API connectivity
            this.checkAPIHealth();
            
        } catch (error) {
            console.error('Health check error:', error);
        }
    }
    
    /**
     * Check API health
     */
    async checkAPIHealth() {
        try {
            const apiClient = this.components.get('apiClient');
            if (apiClient) {
                // Simple health check - tokenize a small string
                await apiClient.tokenize('health check');
            }
        } catch (error) {
            console.warn('⚠️ API health check failed:', error);
        }
    }
    
    /**
     * Pause background tasks when app is hidden
     */
    pauseBackgroundTasks() {
        const realTimeUI = this.components.get('realTimeUI');
        if (realTimeUI) {
            // Reduce subscription activity
            console.log('⏸️ Pausing background UI updates');
        }
    }
    
    /**
     * Resume background tasks when app becomes visible
     */
    resumeBackgroundTasks() {
        const realTimeUI = this.components.get('realTimeUI');
        if (realTimeUI) {
            // Resume full activity
            console.log('▶️ Resuming background UI updates');
            realTimeUI.updateStatistics();
        }
    }
    
    /**
     * Show initialization complete message
     */
    showInitializationComplete() {
        // Update status indicator
        const statusElement = document.getElementById('status-indicator');
        if (statusElement) {
            statusElement.textContent = 'ONLINE';
            statusElement.className = 'status online';
        }
        
        // Show welcome message in discovery chat
        const realTimeUI = this.components.get('realTimeUI');
        if (realTimeUI) {
            realTimeUI.addChatMessage('discovery-chat', '🎭 Discovery Lab is now ONLINE! Agents are searching for wasteful words...', 'system');
        }
        
        // Hide loading indicator
        const loadingElement = document.getElementById('loading');
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
    }
    
    /**
     * Show initialization error
     */
    showInitializationError(error) {
        const statusElement = document.getElementById('status-indicator');
        if (statusElement) {
            statusElement.textContent = 'ERROR';
            statusElement.className = 'status error';
        }
        
        // Show error message
        const errorMessage = document.createElement('div');
        errorMessage.className = 'error-banner';
        errorMessage.innerHTML = `
            <h3>⚠️ Initialization Failed</h3>
            <p>The Token Compressor failed to start. Please refresh the page.</p>
            <button onclick="location.reload()">Refresh Page</button>
        `;
        
        document.body.insertBefore(errorMessage, document.body.firstChild);
    }
    
    /**
     * Get application status
     */
    getStatus() {
        const orchestrator = this.components.get('orchestrator');
        const realTimeUI = this.components.get('realTimeUI');
        
        return {
            initialized: this.isInitialized,
            uptime: Date.now() - this.startTime,
            components: {
                orchestrator: orchestrator?.getStatus() || null,
                realTimeUI: realTimeUI?.isInitialized || false,
                apiClient: !!this.components.get('apiClient'),
                supabaseClient: !!this.components.get('supabaseClient')
            }
        };
    }
    
    /**
     * Cleanup resources
     */
    cleanup() {
        console.log('🧹 Cleaning up Token Compressor...');
        
        // Stop orchestrator
        const orchestrator = this.components.get('orchestrator');
        if (orchestrator) {
            orchestrator.stop();
        }
        
        // Cleanup real-time UI
        const realTimeUI = this.components.get('realTimeUI');
        if (realTimeUI) {
            realTimeUI.destroy();
        }
        
        this.components.clear();
        this.isInitialized = false;
    }
};

/**
 * Initialize application when DOM is loaded
 */
document.addEventListener('DOMContentLoaded', async () => {
    console.log('📄 DOM loaded - starting Token Compressor...');
    
    // Create and initialize app
    window.TokenCompressor.app = new window.TokenCompressor.App();
    await window.TokenCompressor.app.initialize();
});

/**
 * Debug helper - expose status to console
 */
window.getTokenCompressorStatus = () => {
    if (window.TokenCompressor.app) {
        return window.TokenCompressor.app.getStatus();
    }
    return { error: 'App not initialized' };
};

console.log('🚀 Token Compressor main initialization loaded');