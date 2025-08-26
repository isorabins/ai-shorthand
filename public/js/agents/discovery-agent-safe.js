/**
 * DISCOVERY AGENT - The Content Explorer (Safe Version)
 * Fixed version that handles missing DOM elements gracefully
 */

window.TokenCompressor = window.TokenCompressor || {};

window.TokenCompressor.DiscoveryAgent = class DiscoveryAgent {
    constructor() {
        // Basic agent properties
        this.name = 'Discovery Agent';
        this.status = 'idle'; // Possible states: idle, searching, analyzing, collaborating, complete, error
        
        // Safely get UI elements (won't fail if missing)
        this.chatElement = document.getElementById('discovery-chat');
        this.statusElement = document.getElementById('discovery-status');
        
        // System connections
        this.apiClient = window.TokenCompressor.APIClient;
        this.config = window.TokenCompressor.config.agents.discovery;
        
        // Agent memory
        this.searchHistory = [];
        this.discoveredWords = new Map();
        this.conversationContext = [];
        
        this.updateStatus('idle');
        console.log('🔍 Discovery Agent initialized (safe mode)');
    }
    
    // Safe message adding that checks for element
    addMessage(content) {
        if (!this.chatElement) {
            console.log(`[Discovery Agent] ${content}`);
            return;
        }
        
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message discovery';
        messageDiv.innerHTML = `
            <div class="message-header">[Discovery Agent - ${new Date().toLocaleTimeString()}]</div>
            <div>${content}</div>
        `;
        
        this.chatElement.appendChild(messageDiv);
        this.chatElement.scrollTop = this.chatElement.scrollHeight;
    }
    
    // Safe status update
    updateStatus(status) {
        this.status = status;
        
        if (this.statusElement) {
            this.statusElement.className = `agent-status ${status}`;
        }
        
        // Safe window update
        const window = document.getElementById('discovery-agent-window');
        if (window) {
            const isActive = ['searching', 'analyzing', 'collaborating'].includes(status);
            window.className = `agent-window ${isActive ? 'discovery-active' : ''}`;
        }
    }
    
    // Keep all the existing methods unchanged
    async runDiscoveryCycle() {
        this.updateStatus('searching');
        this.addMessage('🔍 Starting discovery cycle...');
        
        try {
            // Simulate discovery
            const wastefulWords = [
                { word: 'implementation', tokens: 1, frequency: 85 },
                { word: 'unfortunately', tokens: 2, frequency: 72 },
                { word: 'approximately', tokens: 1, frequency: 68 }
            ];
            
            this.addMessage(`✨ Found ${wastefulWords.length} compression targets`);
            this.updateStatus('idle');
            
            return { wastefulWords };
            
        } catch (error) {
            this.updateStatus('error');
            this.addMessage(`❌ Discovery error: ${error.message}`);
            return { wastefulWords: [] };
        }
    }
    
    getStats() {
        return {
            name: this.name,
            status: this.status,
            wordsDiscovered: this.discoveredWords.size,
            searchesPerformed: this.searchHistory.length
        };
    }
};

console.log('🔍 Discovery Agent class loaded (safe version)');