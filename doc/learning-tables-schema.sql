-- Learning System Database Schema - Phase 2 Enhancement
-- Add learning_patterns and failed_attempts tables to existing Token Compressor schema

-- Learning Patterns table: Stores successful compression patterns for agent context
CREATE TABLE learning_patterns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    pattern_type TEXT NOT NULL, -- 'greek_letter', 'symbol_prefix', 'suffix_pattern', etc.
    pattern_description TEXT NOT NULL, -- Detailed description of the pattern
    success_rate FLOAT NOT NULL DEFAULT 0.0, -- Between 0.0 and 1.0
    total_attempts INTEGER NOT NULL DEFAULT 0,
    successful_attempts INTEGER NOT NULL DEFAULT 0,
    example_original TEXT, -- Example word that worked with this pattern
    example_compressed TEXT, -- Example compression using this pattern
    domain_source TEXT, -- 'tech', 'business', 'lifestyle', 'science', etc.
    token_savings_avg FLOAT DEFAULT 0.0, -- Average tokens saved per compression
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Failed Attempts table: Stores failed compressions to avoid repeating mistakes
CREATE TABLE failed_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    original_word TEXT NOT NULL,
    attempted_compression TEXT NOT NULL,
    failure_reason TEXT NOT NULL, -- 'semantic_mismatch', 'token_count_fail', 'context_conflict', etc.
    failure_details TEXT, -- Detailed explanation of why it failed
    pattern_type TEXT, -- What pattern was attempted
    domain_source TEXT, -- Source domain where word was discovered
    token_count_original INTEGER, -- How many tokens the original word used
    token_count_compressed INTEGER, -- How many tokens the compression used
    semantic_score FLOAT, -- Semantic similarity score if available (0.0-1.0)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    agent_version TEXT DEFAULT '1.0' -- Track which agent version made the attempt
);

-- Agent Context Cache table: Pre-computed context for faster agent startup
CREATE TABLE agent_context_cache (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    context_type TEXT NOT NULL, -- 'existing_compressions', 'patterns_summary', 'failures_summary'
    context_data JSONB NOT NULL, -- Structured data for agent consumption
    cache_key TEXT NOT NULL UNIQUE, -- For efficient lookups
    expires_at TIMESTAMPTZ NOT NULL, -- Cache expiration
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE learning_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE failed_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_context_cache ENABLE ROW LEVEL SECURITY;

-- Learning patterns: Public read for transparency, service role can manage
CREATE POLICY "Allow public read access to learning patterns" ON learning_patterns
    FOR SELECT USING (true);

CREATE POLICY "Allow service role to manage learning patterns" ON learning_patterns
    FOR ALL USING (true);

-- Failed attempts: Only service role access (contains sensitive failure data)
CREATE POLICY "Allow service role to manage failed attempts" ON failed_attempts
    FOR ALL USING (true);

-- Agent context cache: Public read for real-time UI updates, service role manages
CREATE POLICY "Allow public read access to agent context cache" ON agent_context_cache
    FOR SELECT USING (true);

CREATE POLICY "Allow service role to manage agent context cache" ON agent_context_cache
    FOR ALL USING (true);

-- Indexes for performance
CREATE INDEX idx_learning_patterns_type ON learning_patterns(pattern_type);
CREATE INDEX idx_learning_patterns_success_rate ON learning_patterns(success_rate DESC);
CREATE INDEX idx_learning_patterns_updated ON learning_patterns(last_updated DESC);
CREATE INDEX idx_learning_patterns_domain ON learning_patterns(domain_source);

CREATE INDEX idx_failed_attempts_word ON failed_attempts(original_word);
CREATE INDEX idx_failed_attempts_pattern ON failed_attempts(pattern_type);
CREATE INDEX idx_failed_attempts_domain ON failed_attempts(domain_source);
CREATE INDEX idx_failed_attempts_created ON failed_attempts(created_at DESC);

CREATE INDEX idx_agent_context_cache_key ON agent_context_cache(cache_key);
CREATE INDEX idx_agent_context_cache_type ON agent_context_cache(context_type);
CREATE INDEX idx_agent_context_cache_expires ON agent_context_cache(expires_at);

-- Function to update learning patterns when compression is successful
CREATE OR REPLACE FUNCTION update_learning_patterns_on_success()
RETURNS TRIGGER AS $$
DECLARE
    pattern_type_detected TEXT;
    domain_type TEXT := 'general';
BEGIN
    -- Detect pattern type based on compression characteristics
    IF NEW.compressed ~ '^[∂∫∏∑ΔΩ]' THEN
        pattern_type_detected := 'mathematical_symbol';
    ELSIF NEW.compressed ~ '^[αβγδεθλμπρστφψω]' THEN
        pattern_type_detected := 'greek_letter';
    ELSIF NEW.compressed ~ '^[†‡§¶◊♦]' THEN
        pattern_type_detected := 'special_symbol';
    ELSIF LENGTH(NEW.compressed) = 1 THEN
        pattern_type_detected := 'single_character';
    ELSE
        pattern_type_detected := 'multi_character';
    END IF;
    
    -- Determine domain based on original word characteristics
    IF NEW.original ~ '(technology|implementation|software|algorithm|database|configuration)' THEN
        domain_type := 'tech';
    ELSIF NEW.original ~ '(business|management|organization|strategy|performance)' THEN
        domain_type := 'business';
    ELSIF NEW.original ~ '(unfortunately|approximately|comprehensive|development)' THEN
        domain_type := 'common';
    END IF;
    
    -- Update or insert learning pattern
    INSERT INTO learning_patterns (
        pattern_type, 
        pattern_description,
        total_attempts,
        successful_attempts,
        success_rate,
        example_original,
        example_compressed,
        domain_source,
        token_savings_avg,
        last_updated
    ) VALUES (
        pattern_type_detected,
        'Pattern detected from successful compression: ' || pattern_type_detected,
        1,
        1,
        1.0,
        NEW.original,
        NEW.compressed,
        domain_type,
        NEW.tokens_saved::FLOAT,
        NOW()
    )
    ON CONFLICT (pattern_type, domain_source) DO UPDATE SET
        total_attempts = learning_patterns.total_attempts + 1,
        successful_attempts = learning_patterns.successful_attempts + 1,
        success_rate = (learning_patterns.successful_attempts + 1)::FLOAT / (learning_patterns.total_attempts + 1)::FLOAT,
        token_savings_avg = ((learning_patterns.token_savings_avg * learning_patterns.successful_attempts) + NEW.tokens_saved::FLOAT) / (learning_patterns.successful_attempts + 1),
        last_updated = NOW()
    WHERE learning_patterns.pattern_type = pattern_type_detected AND learning_patterns.domain_source = domain_type;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: This creates a constraint that might need adjustment if pattern_type + domain_source isn't unique
-- In practice, we might want a different unique constraint or handle duplicates differently

-- Trigger to update learning patterns on successful compressions
CREATE TRIGGER compression_learning_update
    AFTER INSERT ON compressions
    FOR EACH ROW
    EXECUTE FUNCTION update_learning_patterns_on_success();

-- Function to clean expired context cache
CREATE OR REPLACE FUNCTION clean_expired_context_cache()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM agent_context_cache 
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Add to real-time subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE learning_patterns;
ALTER PUBLICATION supabase_realtime ADD TABLE failed_attempts;
ALTER PUBLICATION supabase_realtime ADD TABLE agent_context_cache;

-- Insert initial learning patterns from baseline compressions (from config.js)
INSERT INTO learning_patterns (pattern_type, pattern_description, total_attempts, successful_attempts, success_rate, example_original, example_compressed, domain_source, token_savings_avg) VALUES
    ('mathematical_symbol', 'Single mathematical symbol compressions', 5, 5, 1.0, 'unfortunately', '∂', 'common', 2.0),
    ('mathematical_symbol', 'Integration symbol for implementation words', 3, 3, 1.0, 'implementation', '∫', 'tech', 2.0),
    ('mathematical_symbol', 'Product symbol for comprehensive terms', 2, 2, 1.0, 'comprehensive', '∏', 'business', 2.0),
    ('special_symbol', 'Approximation symbol for approximate terms', 4, 4, 1.0, 'approximately', '≈', 'common', 2.0),
    ('greek_letter', 'Greek letters for technical terms', 8, 7, 0.875, 'database', 'Σ', 'tech', 2.0),
    ('greek_letter', 'Mu for customer-related terms', 2, 2, 1.0, 'customer', 'μ', 'business', 2.0);

-- Add initial context cache entries for faster agent startup
INSERT INTO agent_context_cache (context_type, context_data, cache_key, expires_at) VALUES
    ('patterns_summary', 
     '{"mathematical_symbol": {"success_rate": 0.9, "examples": ["∂", "∫", "∏"]}, "greek_letter": {"success_rate": 0.85, "examples": ["α", "μ", "Σ"]}}',
     'patterns_summary_v1',
     NOW() + INTERVAL '1 hour'),
    ('baseline_compressions',
     '{"unfortunately": "∂", "implementation": "∫", "comprehensive": "∏", "approximately": "≈", "database": "Σ", "customer": "μ"}',
     'baseline_compressions_v1',
     NOW() + INTERVAL '6 hours');

COMMENT ON TABLE learning_patterns IS 'Stores successful compression patterns for agent learning and context';
COMMENT ON TABLE failed_attempts IS 'Tracks failed compression attempts to avoid repeating mistakes';
COMMENT ON TABLE agent_context_cache IS 'Pre-computed context data for faster agent initialization';