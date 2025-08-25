// Real-time UI Integration - Connects agents to UI with Supabase subscriptions
window.TokenCompressor = window.TokenCompressor || {};

window.TokenCompressor.RealTimeUI = class RealTimeUI {
    constructor() {
        this.isInitialized = false;
        this.subscriptions = [];
        this.chatWindows = new Map();
        this.formHandlers = new Map();
        
        console.log('🖥️ Real-time UI initialized');
    }
    
    /**
     * Initialize real-time UI components
     */
    async initialize() {
        if (this.isInitialized) return;
        
        try {
            // Initialize chat windows
            this.initializeChatWindows();
            
            // Set up form handlers
            this.setupFormHandlers();
            
            // Set up Supabase subscriptions
            await this.setupRealtimeSubscriptions();
            
            // Initialize statistics display
            this.initializeStatistics();
            
            this.isInitialized = true;
            console.log('🖥️ Real-time UI fully initialized');
            
        } catch (error) {
            console.error('Real-time UI initialization failed:', error);
        }
    }
    
    /**
     * Initialize chat windows for agent communication
     */
    initializeChatWindows() {
        const chatWindows = [
            { id: 'discovery-chat', agent: 'Discovery Agent', element: 'discovery-chat' },
            { id: 'generation-chat', agent: 'Generation Agent', element: 'generation-chat' }, 
            { id: 'validation-chat', agent: 'Validation Agent', element: 'validation-chat' }
        ];
        
        chatWindows.forEach(window => {
            const element = document.getElementById(window.element);
            if (element) {
                this.chatWindows.set(window.id, {
                    element: element,
                    agent: window.agent,
                    messageCount: 0
                });
                
                // Clear initial content
                element.innerHTML = '<div class="chat-message">🤖 Agent starting up...</div>';
            }
        });
        
        console.log(`💬 Initialized ${this.chatWindows.size} chat windows`);
    }
    
    /**
     * Add message to specific chat window
     */
    addChatMessage(chatId, message, type = 'agent') {
        const chatWindow = this.chatWindows.get(chatId);
        if (!chatWindow) return;
        
        const messageElement = document.createElement('div');
        messageElement.className = `chat-message ${type}`;
        
        // Add timestamp
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        messageElement.innerHTML = `
            <span class="timestamp">${timestamp}</span>
            <div class="message-content">${this.sanitizeMessage(message)}</div>
        `;
        
        // Add to chat window
        chatWindow.element.appendChild(messageElement);
        chatWindow.messageCount++;
        
        // Limit message history (keep last 20 messages)
        const messages = chatWindow.element.querySelectorAll('.chat-message');
        if (messages.length > 20) {
            messages[0].remove();
        }
        
        // Auto-scroll to bottom
        chatWindow.element.scrollTop = chatWindow.element.scrollHeight;
    }
    
    /**
     * Clear chat window
     */
    clearChat(chatId) {
        const chatWindow = this.chatWindows.get(chatId);
        if (chatWindow) {
            chatWindow.element.innerHTML = '';
            chatWindow.messageCount = 0;
        }
    }
    
    /**
     * Set up form handlers for user interactions
     */
    setupFormHandlers() {
        // Human submission form
        const submissionForm = document.getElementById('compression-form');
        if (submissionForm) {
            submissionForm.addEventListener('submit', this.handleSubmissionForm.bind(this));
            this.formHandlers.set('submission', submissionForm);
        }
        
        // Test form
        const testForm = document.getElementById('test-form');
        if (testForm) {
            testForm.addEventListener('submit', this.handleTestForm.bind(this));
            this.formHandlers.set('test', testForm);
        }
        
        console.log(`📝 Set up ${this.formHandlers.size} form handlers`);
    }
    
    /**
     * Handle human submission form
     */
    async handleSubmissionForm(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const submission = {
            original: formData.get('original')?.trim(),
            compressed: formData.get('compressed')?.trim(),
            explanation: formData.get('explanation')?.trim()
        };
        
        // Validate input
        if (!submission.original || !submission.compressed) {
            this.showError('Please provide both original and compressed text');
            return;
        }
        
        try {
            // Show loading state
            this.showFormLoading('submission', true);
            
            // Submit to database
            const result = await window.TokenCompressor.SupabaseClient.submitCompression(submission);
            
            if (result.success) {
                this.showSuccess('Submission received! It will be tested in the next ceremony.');
                event.target.reset();
                
                // Update pending submissions display
                this.updatePendingSubmissions();
            } else {
                this.showError(result.error || 'Failed to submit compression');
            }
            
        } catch (error) {
            console.error('Submission error:', error);
            this.showError('Failed to submit compression. Please try again.');
        } finally {
            this.showFormLoading('submission', false);
        }
    }
    
    /**
     * Handle test form for trying compressions
     */
    async handleTestForm(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const testData = {
            original: formData.get('test-original')?.trim(),
            compressed: formData.get('test-compressed')?.trim()
        };
        
        if (!testData.original || !testData.compressed) {
            this.showError('Please provide both texts to test');
            return;
        }
        
        try {
            this.showFormLoading('test', true);
            
            // Use validation agent to test
            const result = await window.TokenCompressor.APIClient.validateCompression(
                testData.original, 
                testData.compressed
            );
            
            // Show result
            this.showTestResult(result);
            
        } catch (error) {
            console.error('Test error:', error);
            this.showError('Failed to test compression. Please try again.');
        } finally {
            this.showFormLoading('test', false);
        }
    }
    
    /**
     * Set up Supabase real-time subscriptions
     */
    async setupRealtimeSubscriptions() {
        try {
            // Subscribe to new compressions
            const compressionsSubscription = window.TokenCompressor.SupabaseClient.subscribeToCompressions(
                (payload) => this.handleNewCompression(payload)
            );
            
            if (compressionsSubscription) {
                this.subscriptions.push(compressionsSubscription);
            }
            
            // Subscribe to statistics updates
            const statsSubscription = window.TokenCompressor.SupabaseClient.subscribeToStats(
                (payload) => this.handleStatsUpdate(payload)
            );
            
            if (statsSubscription) {
                this.subscriptions.push(statsSubscription);
            }
            
            console.log(`📡 Set up ${this.subscriptions.length} real-time subscriptions`);
            
        } catch (error) {
            console.error('Failed to set up subscriptions:', error);
        }
    }
    
    /**
     * Handle new compression from real-time subscription
     */
    handleNewCompression(payload) {
        console.log('📦 New compression:', payload.new);
        
        // Update codex display
        this.updateCodexDisplay();
        
        // Show notification
        this.showNotification('New compression discovered!', 'success');
        
        // Update statistics
        this.updateStatistics();
    }
    
    /**
     * Handle statistics update
     */
    handleStatsUpdate(payload) {
        console.log('📊 Stats update:', payload.new);
        this.updateStatistics();
    }
    
    /**
     * Initialize statistics display
     */
    initializeStatistics() {
        this.updateStatistics();
        this.updateCodexDisplay();
        this.updatePendingSubmissions();
    }
    
    /**
     * Update statistics display
     */
    async updateStatistics() {
        try {
            const stats = await window.TokenCompressor.SupabaseClient.getStats();
            
            // Update current hour
            const hourElement = document.getElementById('current-hour');
            if (hourElement && stats.current_hour) {
                hourElement.textContent = stats.current_hour;
            }
            
            // Update total compressions
            const compressionsElement = document.getElementById('codex-size');
            if (compressionsElement && stats.total_compressions) {
                compressionsElement.textContent = stats.total_compressions;
            }
            
            // Update articles processed
            const articlesElement = document.getElementById('articles-processed');
            if (articlesElement && stats.total_articles_processed) {
                articlesElement.textContent = stats.total_articles_processed;
            }
            
        } catch (error) {
            console.error('Failed to update statistics:', error);
        }
    }
    
    /**
     * Update codex display
     */
    async updateCodexDisplay() {
        try {
            const compressions = await window.TokenCompressor.SupabaseClient.getCompressions(10);
            const codexElement = document.getElementById('recent-compressions');
            
            if (codexElement && compressions.length > 0) {
                codexElement.innerHTML = compressions.map(comp => `
                    <div class="compression-item">
                        <div class="original">${this.sanitizeMessage(comp.original)}</div>
                        <div class="arrow">→</div>
                        <div class="compressed">${this.sanitizeMessage(comp.compressed)}</div>
                        <div class="savings">${comp.tokens_saved || 2} tokens saved</div>
                    </div>
                `).join('');
            }
            
        } catch (error) {
            console.error('Failed to update codex display:', error);
        }
    }
    
    /**
     * Update pending submissions count
     */
    async updatePendingSubmissions() {
        try {
            const pending = await window.TokenCompressor.SupabaseClient.getUntestedSubmissions();
            const pendingElement = document.getElementById('pending-submissions');
            
            if (pendingElement) {
                pendingElement.textContent = pending.length;
            }
            
        } catch (error) {
            console.error('Failed to update pending submissions:', error);
        }
    }
    
    /**
     * Show form loading state
     */
    showFormLoading(formType, loading) {
        const form = this.formHandlers.get(formType);
        if (!form) return;
        
        const submitButton = form.querySelector('button[type="submit"]');
        if (submitButton) {
            if (loading) {
                submitButton.disabled = true;
                submitButton.textContent = 'Processing...';
            } else {
                submitButton.disabled = false;
                submitButton.textContent = formType === 'submission' ? 'Submit Compression' : 'Test Compression';
            }
        }
    }
    
    /**
     * Show test result
     */
    showTestResult(result) {
        const resultElement = document.getElementById('test-result');
        if (!resultElement) return;
        
        resultElement.style.display = 'block';
        resultElement.className = `test-result ${result.isValid ? 'success' : 'error'}`;
        resultElement.innerHTML = `
            <h4>${result.isValid ? '✅ Valid Compression' : '❌ Invalid Compression'}</h4>
            <p>${result.explanation}</p>
            ${result.tokensSaved ? `<p><strong>Tokens Saved:</strong> ${result.tokensSaved}</p>` : ''}
        `;
    }
    
    /**
     * Show success message
     */
    showSuccess(message) {
        this.showNotification(message, 'success');
    }
    
    /**
     * Show error message
     */
    showError(message) {
        this.showNotification(message, 'error');
    }
    
    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <span class="notification-message">${this.sanitizeMessage(message)}</span>
            <button class="notification-close" onclick="this.parentElement.remove()">×</button>
        `;
        
        // Add to page
        const container = document.getElementById('notifications') || document.body;
        container.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }
    
    /**
     * Sanitize message for display
     */
    sanitizeMessage(message) {
        if (typeof message !== 'string') return '';
        return message.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
    
    /**
     * Cleanup subscriptions
     */
    destroy() {
        this.subscriptions.forEach(subscription => {
            if (subscription && typeof subscription.unsubscribe === 'function') {
                subscription.unsubscribe();
            }
        });
        this.subscriptions = [];
        this.isInitialized = false;
        
        console.log('🖥️ Real-time UI destroyed');
    }
};

console.log('🖥️ Real-time UI class loaded');