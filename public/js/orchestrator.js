// Agent Orchestrator - Coordinates 30-second cycles and testing ceremonies
window.TokenCompressor = window.TokenCompressor || {};

window.TokenCompressor.Orchestrator = class Orchestrator {
    constructor() {
        this.isInitialized = false;
        this.isRunning = false;
        this.currentCycle = 0;
        this.currentHour = 1;
        
        // Agent instances
        this.discoveryAgent = null;
        this.generationAgent = null; 
        this.validationAgent = null;
        
        // State management
        this.pendingCandidates = [];
        this.activeConversation = null;
        this.lastCeremonyTime = 0;
        
        // Configuration
        this.config = window.TokenCompressor.config.discovery;
        this.cycleInterval = null;
        this.ceremonyTimeout = null;
        
        // Statistics
        this.stats = {
            cyclesCompleted: 0,
            ceremoniesCompleted: 0,
            totalCompressions: 0,
            humanWins: 0,
            aiWins: 0
        };
        
        console.log('🎭 Orchestrator initialized');
    }
    
    /**
     * Initialize orchestrator and start discovery process
     */
    async initialize() {
        if (this.isInitialized) return;
        
        try {
            // Initialize required services
            if (!window.TokenCompressor.SupabaseClient.init()) {
                throw new Error('Failed to initialize Supabase client');
            }
            
            // Create agent instances
            this.discoveryAgent = new window.TokenCompressor.DiscoveryAgent();
            this.generationAgent = new window.TokenCompressor.GenerationAgent();
            this.validationAgent = new window.TokenCompressor.ValidationAgent();
            
            // Load initial stats
            await this.loadInitialStats();
            
            // Start the discovery process
            this.startDiscoveryProcess();
            
            this.isInitialized = true;
            console.log('🎭 Orchestrator fully initialized and running');
            
        } catch (error) {
            console.error('Orchestrator initialization failed:', error);
            window.TokenCompressor.ErrorHandler.showError(
                'Initialization Error',
                'Failed to start the discovery lab. Please refresh the page.'
            );
        }
    }
    
    /**
     * Start the continuous discovery process
     */
    startDiscoveryProcess() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        console.log('🚀 Starting discovery process');
        
        // Start discovery cycles
        this.scheduleNextCycle();
        
        // Schedule ceremony check
        this.scheduleCeremonyCheck();
        
        // Update UI periodically
        this.startUIUpdates();
    }
    
    /**
     * Schedule the next discovery cycle
     */
    scheduleNextCycle() {
        if (!this.isRunning) return;
        
        const now = new Date();
        const currentMinute = now.getMinutes();
        
        // Only run cycles during minutes 0-54 (ceremony at 55-60)
        if (currentMinute >= 55) {
            console.log('⏸️ Pausing cycles for testing ceremony');
            // Schedule after ceremony
            setTimeout(() => this.scheduleNextCycle(), 60000);
            return;
        }
        
        this.cycleInterval = setTimeout(async () => {
            await this.runDiscoveryCycle();
            this.scheduleNextCycle();
        }, this.config.cycleInterval);
    }
    
    /**
     * Run a single discovery cycle with agent collaboration
     */
    async runDiscoveryCycle() {
        if (!this.isRunning) return;
        
        try {
            this.currentCycle++;
            console.log(`🔄 Starting discovery cycle ${this.currentCycle}`);
            
            // Step 1: Discovery Agent searches and analyzes
            const discoveryResult = await this.discoveryAgent.runDiscoveryCycle();
            
            if (!discoveryResult || discoveryResult.wastefulWords.length === 0) {
                console.log('📭 No wasteful words found this cycle');
                return;
            }
            
            // Step 2: Generation Agent creates compressions
            const generationResult = await this.generationAgent.generateCompressions(
                discoveryResult.wastefulWords,
                await this.getCurrentCodex()
            );
            
            if (generationResult.compressions.length === 0) {
                console.log('🎨 No compressions generated this cycle');
                return;
            }
            
            // Step 3: Multi-turn collaboration
            await this.runCollaborativeDiscussion(discoveryResult, generationResult);
            
            // Step 4: Queue candidates for testing
            this.queueCandidatesForTesting(generationResult.compressions);
            
            this.stats.cyclesCompleted++;
            
        } catch (error) {
            console.error('Discovery cycle error:', error);
            // Continue running despite errors
        }
    }
    
    /**
     * Run collaborative discussion between agents
     */
    async runCollaborativeDiscussion(discoveryResult, generationResult) {
        const maxTurns = this.config.conversationTurns;
        
        console.log(`💬 Starting ${maxTurns}-turn collaborative discussion`);
        
        for (let turn = 0; turn < maxTurns; turn++) {
            try {
                if (turn % 2 === 0) {
                    // Discovery Agent turn
                    const response = await this.discoveryAgent.addMessage(
                        `💡 Turn ${turn + 1}: Found "${discoveryResult.wastefulWords[0]?.word}" using ${discoveryResult.wastefulWords[0]?.tokens} tokens. What's your compression idea?`
                    );
                } else {
                    // Generation Agent turn  
                    const compression = generationResult.compressions[Math.floor(turn / 2)];
                    if (compression) {
                        await this.generationAgent.collaborateOnFindings(discoveryResult.wastefulWords, turn);
                    }
                }
                
                // Brief pause between turns
                await new Promise(resolve => setTimeout(resolve, 1500));
                
            } catch (error) {
                console.error(`Collaboration turn ${turn + 1} error:`, error);
                // Continue with remaining turns
            }
        }
        
        console.log('💬 Collaborative discussion completed');
    }
    
    /**
     * Queue compression candidates for testing
     */
    queueCandidatesForTesting(compressions) {
        compressions.forEach(compression => {
            this.pendingCandidates.push({
                ...compression,
                queuedAt: new Date().toISOString(),
                hour: this.currentHour
            });
        });
        
        console.log(`📋 Queued ${compressions.length} candidates (${this.pendingCandidates.length} total pending)`);
        
        // Limit pending queue size
        if (this.pendingCandidates.length > this.config.maxPendingCandidates) {
            this.pendingCandidates = this.pendingCandidates.slice(-this.config.maxPendingCandidates);
        }
    }
    
    /**
     * Check for and run testing ceremony
     */
    scheduleCeremonyCheck() {
        setInterval(() => {
            const now = new Date();
            const currentMinute = now.getMinutes();
            
            // Run ceremony at minute 55
            if (currentMinute === 55 && !this.isCeremonyRunning) {
                this.runTestingCeremony();
            }
        }, 30000); // Check every 30 seconds
    }
    
    /**
     * Run the hourly testing ceremony
     */
    async runTestingCeremony() {
        if (this.isCeremonyRunning) return;
        
        this.isCeremonyRunning = true;
        console.log('🎭 Testing ceremony begins!');
        
        try {
            // Get human submissions
            const humanSubmissions = await window.TokenCompressor.SupabaseClient.getUntestedSubmissions();
            
            // Run validation
            const results = await this.validationAgent.runTestingCeremony(
                this.pendingCandidates,
                humanSubmissions
            );
            
            // Process results
            await this.processCeremonyResults(results, humanSubmissions);
            
            // Clear pending candidates
            this.pendingCandidates = [];
            
            // Update statistics
            this.stats.ceremoniesCompleted++;
            this.currentHour++;
            
            // Post to Twitter
            await this.announceDiscoveries(results);
            
            this.lastCeremonyTime = Date.now();
            
        } catch (error) {
            console.error('Testing ceremony error:', error);
        } finally {
            this.isCeremonyRunning = false;
            console.log('🎭 Testing ceremony completed');
        }
    }
    
    /**
     * Process ceremony results and update database
     */
    async processCeremonyResults(results, humanSubmissions) {
        const { validCompressions, rejectedCompressions } = results;
        
        // Save valid compressions to database
        for (const compression of validCompressions) {
            await window.TokenCompressor.SupabaseClient.saveCompression({
                original: compression.original,
                compressed: compression.compressed,
                source: compression.source,
                hour: this.currentHour,
                tokensSaved: compression.tokensSaved || 2
            });
            
            // Update statistics
            if (compression.source?.startsWith('Human:')) {
                this.stats.humanWins++;
            } else {
                this.stats.aiWins++;
            }
            this.stats.totalCompressions++;
        }
        
        // Mark human submissions as tested
        if (humanSubmissions.length > 0) {
            const testedIds = humanSubmissions.map(s => s.id);
            await window.TokenCompressor.SupabaseClient.markSubmissionsTested(testedIds, true);
        }
        
        // Update global stats
        await this.updateGlobalStats();
    }
    
    /**
     * Announce discoveries via Twitter bot
     */
    async announceDiscoveries(results) {
        const { validCompressions } = results;
        
        try {
            const response = await window.TokenCompressor.APIClient.tweet(
                validCompressions,
                this.currentHour,
                this.stats.humanWins,
                this.stats.aiWins
            );
            
            if (response.success) {
                console.log('📱 Discovery announced on Twitter');
            }
            
        } catch (error) {
            console.error('Twitter announcement failed:', error);
            // Continue without Twitter - not critical
        }
    }
    
    /**
     * Load initial statistics from database
     */
    async loadInitialStats() {
        try {
            const dbStats = await window.TokenCompressor.SupabaseClient.getStats();
            
            if (dbStats.current_hour) {
                this.currentHour = dbStats.current_hour;
            }
            
            if (dbStats.total_compressions) {
                this.stats.totalCompressions = dbStats.total_compressions;
            }
            
            // Update UI
            this.updateStatsDisplay();
            
        } catch (error) {
            console.error('Failed to load initial stats:', error);
        }
    }
    
    /**
     * Update global statistics in database
     */
    async updateGlobalStats() {
        const updates = [
            { metric: 'current_hour', value: this.currentHour },
            { metric: 'total_compressions', value: this.stats.totalCompressions },
            { metric: 'total_articles_processed', value: this.stats.cyclesCompleted }
        ];
        
        for (const update of updates) {
            await window.TokenCompressor.SupabaseClient.updateStat(update.metric, update.value);
        }
    }
    
    /**
     * Get current codex for agents
     */
    async getCurrentCodex() {
        try {
            const compressions = await window.TokenCompressor.SupabaseClient.getCompressions(100);
            const codex = {};
            
            compressions.forEach(comp => {
                codex[comp.original] = comp.compressed;
            });
            
            return codex;
            
        } catch (error) {
            console.error('Failed to load codex:', error);
            return {};
        }
    }
    
    /**
     * Start periodic UI updates
     */
    startUIUpdates() {
        setInterval(() => {
            this.updateStatsDisplay();
            this.updateCountdowns();
        }, this.config.ui?.updateInterval || 1000);
    }
    
    /**
     * Update statistics display
     */
    updateStatsDisplay() {
        // Update hour counter
        const hourElement = document.getElementById('current-hour');
        if (hourElement) {
            hourElement.textContent = this.currentHour;
        }
        
        // Update cycles completed
        const articlesElement = document.getElementById('articles-processed');
        if (articlesElement) {
            articlesElement.textContent = this.stats.cyclesCompleted;
        }
        
        // Update codex size
        const codexElement = document.getElementById('codex-size');
        if (codexElement) {
            codexElement.textContent = this.stats.totalCompressions;
        }
    }
    
    /**
     * Update countdown timers
     */
    updateCountdowns() {
        const now = new Date();
        const currentMinute = now.getMinutes();
        const currentSecond = now.getSeconds();
        
        // Countdown to next ceremony
        const minutesToCeremony = currentMinute >= 55 ? (60 - currentMinute) : (55 - currentMinute);
        const secondsToCeremony = 60 - currentSecond;
        
        const countdownText = `${minutesToCeremony.toString().padStart(2, '0')}:${secondsToCeremony.toString().padStart(2, '0')}`;
        
        // Update countdown displays
        const countdownElement = document.getElementById('countdown');
        const marqueeCountdownElement = document.getElementById('marquee-countdown');
        
        if (countdownElement) {
            countdownElement.textContent = `Next test in: ${countdownText}`;
        }
        
        if (marqueeCountdownElement) {
            marqueeCountdownElement.textContent = countdownText;
        }
    }
    
    /**
     * Stop orchestrator
     */
    stop() {
        this.isRunning = false;
        
        if (this.cycleInterval) {
            clearTimeout(this.cycleInterval);
            this.cycleInterval = null;
        }
        
        if (this.ceremonyTimeout) {
            clearTimeout(this.ceremonyTimeout);
            this.ceremonyTimeout = null;
        }
        
        console.log('🛑 Orchestrator stopped');
    }
    
    /**
     * Get orchestrator status and statistics
     */
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            isRunning: this.isRunning,
            currentCycle: this.currentCycle,
            currentHour: this.currentHour,
            pendingCandidates: this.pendingCandidates.length,
            stats: { ...this.stats },
            agents: {
                discovery: this.discoveryAgent?.getStats(),
                generation: this.generationAgent?.getStats(), 
                validation: this.validationAgent?.getStats()
            }
        };
    }
};

console.log('🎭 Orchestrator class loaded');