// Supabase client for real-time database operations
window.TokenCompressor = window.TokenCompressor || {};

window.TokenCompressor.SupabaseClient = {
    client: null,
    subscriptions: new Map(),
    
    /**
     * Initialize Supabase client
     */
    init() {
        console.log(`🔵 [SUPABASE-CLIENT] init() called`);
        const config = window.TokenCompressor.config;
        
        console.log(`🔵 [SUPABASE-CLIENT] Checking for Supabase library...`);
        if (typeof window.supabase === 'undefined') {
            console.error(`❌ [SUPABASE-CLIENT] Supabase library not loaded`);
            return false;
        }
        console.log(`✅ [SUPABASE-CLIENT] Supabase library found`);
        
        console.log(`🔵 [SUPABASE-CLIENT] Creating client with URL: ${config.supabase.url}`);
        console.log(`🔵 [SUPABASE-CLIENT] Anon key length: ${config.supabase.anonKey?.length || 0}`);
        
        this.client = window.supabase.createClient(
            config.supabase.url,
            config.supabase.anonKey
        );
        
        if (!this.client) {
            console.error(`❌ [SUPABASE-CLIENT] Failed to initialize Supabase client`);
            return false;
        }
        
        console.log('✅ [SUPABASE-CLIENT] Supabase client initialized successfully');
        return true;
    },
    
    /**
     * Submit human compression idea
     */
    async submitCompression(data) {
        console.log(`📝 [SUPABASE-CLIENT] submitCompression() called`);
        console.log(`📝 [SUPABASE-CLIENT] Data:`, { 
            name: data.name, 
            email: data.email?.replace(/(.{3}).*(@.*)/, '$1***$2'), // Mask email for privacy
            original: data.original, 
            compressed: data.compressed 
        });
        
        if (!this.client) {
            console.error(`❌ [SUPABASE-CLIENT] No client available`);
            return null;
        }
        
        try {
            console.log(`🔵 [SUPABASE-CLIENT] Inserting into submissions table...`);
            const { data: result, error } = await this.client
                .from('submissions')
                .insert({
                    name: data.name,
                    email: data.email,
                    original: data.original,
                    compressed: data.compressed,
                    daily_updates: data.dailyUpdates || false,
                    tested: false
                });
            
            if (error) {
                console.error(`❌ [SUPABASE-CLIENT] Insert error:`, error);
                throw error;
            }
            
            console.log(`✅ [SUPABASE-CLIENT] Submission successful:`, result);
            return result;
            
        } catch (error) {
            console.error(`❌ [SUPABASE-CLIENT] submitCompression() failed:`, error);
            throw await window.TokenCompressor.ErrorHandler.handleError(error, {
                operation: 'submit_compression',
                formField: 'compression-form'
            });
        }
    },
    
    /**
     * Get validated compressions from codex
     */
    async getCompressions(limit = 50) {
        console.log(`📊 [SUPABASE-CLIENT] getCompressions() called with limit: ${limit}`);
        
        if (!this.client) {
            console.error(`❌ [SUPABASE-CLIENT] No client available`);
            return [];
        }
        
        try {
            console.log(`🔵 [SUPABASE-CLIENT] Querying compressions table...`);
            const { data, error } = await this.client
                .from('compressions')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(limit);
            
            if (error) {
                console.error(`❌ [SUPABASE-CLIENT] Query error:`, error);
                throw error;
            }
            
            console.log(`✅ [SUPABASE-CLIENT] Retrieved ${data?.length || 0} compressions`);
            return data || [];
            
        } catch (error) {
            console.error(`❌ [SUPABASE-CLIENT] getCompressions() failed:`, error);
            return [];
        }
    },
    
    /**
     * Save discovered compression to database
     */
    async saveCompression(compression) {
        console.log(`💾 [SUPABASE-CLIENT] saveCompression() called`);
        console.log(`💾 [SUPABASE-CLIENT] Compression:`, {
            original: compression.original,
            compressed: compression.compressed,
            source: compression.source,
            hour: compression.hour,
            tokensSaved: compression.tokensSaved || 0
        });
        
        if (!this.client) {
            console.error(`❌ [SUPABASE-CLIENT] No client available`);
            return null;
        }
        
        try {
            console.log(`🔵 [SUPABASE-CLIENT] Inserting into compressions table...`);
            const { data, error } = await this.client
                .from('compressions')
                .insert({
                    original: compression.original,
                    compressed: compression.compressed,
                    source: compression.source,
                    hour: compression.hour,
                    tokens_saved: compression.tokensSaved || 0
                });
            
            if (error) {
                console.error(`❌ [SUPABASE-CLIENT] Insert error:`, error);
                throw error;
            }
            
            console.log(`✅ [SUPABASE-CLIENT] Compression saved successfully:`, data);
            return data;
            
        } catch (error) {
            console.error(`❌ [SUPABASE-CLIENT] saveCompression() failed:`, error);
            return null;
        }
    },
    
    /**
     * Get today's leaderboard
     */
    async getLeaderboard() {
        if (!this.client) return [];
        
        try {
            const today = new Date().toISOString().split('T')[0];
            
            const { data, error } = await this.client
                .from('leaderboard')
                .select('*')
                .eq('date', today)
                .order('tokens_saved', { ascending: false })
                .limit(10);
            
            if (error) throw error;
            return data || [];
            
        } catch (error) {
            console.error('Failed to fetch leaderboard:', error);
            return [];
        }
    },
    
    /**
     * Get system statistics
     */
    async getStats() {
        console.log(`📈 [SUPABASE-CLIENT] getStats() called`);
        
        if (!this.client) {
            console.error(`❌ [SUPABASE-CLIENT] No client available`);
            return {};
        }
        
        try {
            console.log(`🔵 [SUPABASE-CLIENT] Querying stats table...`);
            const { data, error } = await this.client
                .from('stats')
                .select('*');
            
            if (error) {
                console.error(`❌ [SUPABASE-CLIENT] Query error:`, error);
                throw error;
            }
            
            // Convert to key-value object
            const stats = {};
            data?.forEach(stat => {
                stats[stat.metric_name] = stat.metric_value;
            });
            
            console.log(`✅ [SUPABASE-CLIENT] Retrieved ${Object.keys(stats).length} stats:`, stats);
            return stats;
            
        } catch (error) {
            console.error(`❌ [SUPABASE-CLIENT] getStats() failed:`, error);
            return {};
        }
    },
    
    /**
     * Update system statistics
     */
    async updateStat(metricName, value) {
        if (!this.client) return false;
        
        try {
            const { error } = await this.client
                .from('stats')
                .update({ 
                    metric_value: value,
                    updated_at: new Date().toISOString()
                })
                .eq('metric_name', metricName);
            
            if (error) throw error;
            return true;
            
        } catch (error) {
            console.error(`Failed to update stat ${metricName}:`, error);
            return false;
        }
    },
    
    /**
     * Subscribe to real-time updates
     */
    subscribeToTable(tableName, callback, filter = null) {
        if (!this.client) return null;
        
        let query = this.client
            .channel(`public:${tableName}`)
            .on('postgres_changes', 
                { 
                    event: '*', 
                    schema: 'public', 
                    table: tableName,
                    filter: filter 
                }, 
                callback
            );
        
        const subscription = query.subscribe();
        this.subscriptions.set(`${tableName}_${Date.now()}`, subscription);
        
        return subscription;
    },
    
    /**
     * Subscribe to compressions (for timeline updates)
     */
    subscribeToCompressions(callback) {
        return this.subscribeToTable('compressions', (payload) => {
            if (payload.eventType === 'INSERT') {
                callback(payload.new);
            }
        });
    },
    
    /**
     * Subscribe to leaderboard changes
     */
    subscribeToLeaderboard(callback) {
        const today = new Date().toISOString().split('T')[0];
        return this.subscribeToTable('leaderboard', callback, `date=eq.${today}`);
    },
    
    /**
     * Subscribe to statistics updates
     */
    subscribeToStats(callback) {
        return this.subscribeToTable('stats', (payload) => {
            if (payload.eventType === 'UPDATE') {
                callback({
                    metric: payload.new.metric_name,
                    value: payload.new.metric_value
                });
            }
        });
    },
    
    /**
     * Unsubscribe from all real-time updates
     */
    unsubscribeAll() {
        for (const [key, subscription] of this.subscriptions.entries()) {
            if (subscription && typeof subscription.unsubscribe === 'function') {
                subscription.unsubscribe();
            }
        }
        this.subscriptions.clear();
    },
    
    /**
     * Get submissions awaiting testing
     */
    async getUntestedSubmissions() {
        if (!this.client) return [];
        
        try {
            const { data, error } = await this.client
                .from('submissions')
                .select('*')
                .eq('tested', false)
                .order('created_at', { ascending: true });
            
            if (error) throw error;
            return data || [];
            
        } catch (error) {
            console.error('Failed to fetch untested submissions:', error);
            return [];
        }
    },
    
    /**
     * Mark submissions as tested
     */
    async markSubmissionsTested(submissionIds, valid = true) {
        if (!this.client || !submissionIds.length) return false;
        
        try {
            const { error } = await this.client
                .from('submissions')
                .update({ 
                    tested: true,
                    valid: valid,
                    tested_at: new Date().toISOString()
                })
                .in('id', submissionIds);
            
            if (error) throw error;
            return true;
            
        } catch (error) {
            console.error('Failed to mark submissions as tested:', error);
            return false;
        }
    },
    
    /**
     * Health check for database connection
     */
    async healthCheck() {
        if (!this.client) return false;
        
        try {
            const { data, error } = await this.client
                .from('stats')
                .select('count', { count: 'exact', head: true });
            
            return !error;
            
        } catch (error) {
            console.error('Database health check failed:', error);
            return false;
        }
    }
};

console.log('💾 Supabase Client initialized');