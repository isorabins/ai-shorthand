-- ============================================
-- TOKEN COMPRESSOR - SUPABASE DATABASE SETUP
-- ============================================
-- Run this entire script in your Supabase SQL Editor
-- Go to: Your Project → SQL Editor → New Query
-- ============================================

-- Drop existing tables if needed (for clean setup)
-- Uncomment these lines if you need to reset:
-- DROP TABLE IF EXISTS compressions CASCADE;
-- DROP TABLE IF EXISTS submissions CASCADE;
-- DROP TABLE IF EXISTS leaderboard CASCADE;

-- ============================================
-- CORE TABLES
-- ============================================

-- Compressions table: Stores all discovered compressions
CREATE TABLE compressions (
    id SERIAL PRIMARY KEY,
    original TEXT NOT NULL,
    compressed TEXT NOT NULL,
    source TEXT, -- 'AI' or 'Human: Name'
    hour INTEGER,
    tokens_saved INTEGER DEFAULT 0,
    frequency INTEGER DEFAULT 1, -- How often this word appears
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure no duplicate compressions
    UNIQUE(original, compressed)
);

-- Submissions table: Human suggestions awaiting testing
CREATE TABLE submissions (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    original TEXT NOT NULL,
    compressed TEXT NOT NULL,
    daily_updates BOOLEAN DEFAULT FALSE,
    tested BOOLEAN DEFAULT FALSE,
    valid BOOLEAN DEFAULT NULL, -- NULL=untested, TRUE=accepted, FALSE=rejected
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    tested_at TIMESTAMP WITH TIME ZONE
);

-- Leaderboard table: Tracks daily contributor rankings
CREATE TABLE leaderboard (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    compressions_count INTEGER DEFAULT 0,
    tokens_saved INTEGER DEFAULT 0,
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- One entry per person per day
    UNIQUE(email, date),
    
    -- Index will be created separately after table creation
);

-- Articles table: Track processed articles for diversity
CREATE TABLE articles (
    id SERIAL PRIMARY KEY,
    source_type TEXT NOT NULL, -- 'news', 'research', 'blog', etc.
    content TEXT NOT NULL,
    url TEXT,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    words_found INTEGER DEFAULT 0,
    compressions_created INTEGER DEFAULT 0
);

-- Stats table: Global statistics and metrics
CREATE TABLE stats (
    id SERIAL PRIMARY KEY,
    metric_name TEXT UNIQUE NOT NULL,
    metric_value INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial stats
INSERT INTO stats (metric_name, metric_value) VALUES
    ('total_compressions', 0),
    ('total_tokens_saved', 0),
    ('total_articles_processed', 0),
    ('total_human_submissions', 0),
    ('total_ai_discoveries', 0),
    ('current_hour', 1)
ON CONFLICT (metric_name) DO NOTHING;

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE compressions ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stats ENABLE ROW LEVEL SECURITY;

-- ============================================
-- SECURITY POLICIES
-- ============================================

-- Compressions policies
CREATE POLICY "Anyone can read compressions" ON compressions
    FOR SELECT USING (true);

CREATE POLICY "Anyone can insert compressions" ON compressions
    FOR INSERT WITH CHECK (true);

-- Submissions policies
CREATE POLICY "Anyone can read submissions" ON submissions
    FOR SELECT USING (true);

CREATE POLICY "Anyone can insert submissions" ON submissions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update submissions" ON submissions
    FOR UPDATE USING (true);

-- Leaderboard policies
CREATE POLICY "Anyone can read leaderboard" ON leaderboard
    FOR SELECT USING (true);

CREATE POLICY "Anyone can insert to leaderboard" ON leaderboard
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update leaderboard" ON leaderboard
    FOR UPDATE USING (true);

-- Articles policies
CREATE POLICY "Anyone can read articles" ON articles
    FOR SELECT USING (true);

CREATE POLICY "Anyone can insert articles" ON articles
    FOR INSERT WITH CHECK (true);

-- Stats policies
CREATE POLICY "Anyone can read stats" ON stats
    FOR SELECT USING (true);

CREATE POLICY "Anyone can update stats" ON stats
    FOR UPDATE USING (true);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to update leaderboard when compression is accepted
CREATE OR REPLACE FUNCTION update_leaderboard_on_compression()
RETURNS TRIGGER AS $$
DECLARE
    user_name TEXT;
    user_email TEXT;
BEGIN
    -- Only process human submissions
    IF NEW.source LIKE 'Human:%' THEN
        -- Extract name from source
        user_name := SUBSTRING(NEW.source FROM 'Human: (.+)');
        
        -- Try to find email from recent submission
        SELECT email INTO user_email
        FROM submissions
        WHERE name = user_name
        ORDER BY created_at DESC
        LIMIT 1;
        
        -- If we found an email, update leaderboard
        IF user_email IS NOT NULL THEN
            INSERT INTO leaderboard (name, email, compressions_count, tokens_saved, date)
            VALUES (user_name, user_email, 1, NEW.tokens_saved, CURRENT_DATE)
            ON CONFLICT (email, date) DO UPDATE
            SET 
                compressions_count = leaderboard.compressions_count + 1,
                tokens_saved = leaderboard.tokens_saved + NEW.tokens_saved,
                updated_at = NOW();
        END IF;
    END IF;
    
    -- Update global stats
    UPDATE stats SET 
        metric_value = metric_value + 1,
        updated_at = NOW()
    WHERE metric_name = 'total_compressions';
    
    UPDATE stats SET 
        metric_value = metric_value + NEW.tokens_saved,
        updated_at = NOW()
    WHERE metric_name = 'total_tokens_saved';
    
    IF NEW.source = 'AI' THEN
        UPDATE stats SET 
            metric_value = metric_value + 1,
            updated_at = NOW()
        WHERE metric_name = 'total_ai_discoveries';
    ELSE
        UPDATE stats SET 
            metric_value = metric_value + 1,
            updated_at = NOW()
        WHERE metric_name = 'total_human_submissions';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for leaderboard updates
CREATE TRIGGER update_leaderboard_trigger
AFTER INSERT ON compressions
FOR EACH ROW
EXECUTE FUNCTION update_leaderboard_on_compression();

-- Function to clean old data (optional, for maintenance)
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
BEGIN
    -- Delete articles older than 30 days
    DELETE FROM articles WHERE processed_at < NOW() - INTERVAL '30 days';
    
    -- Delete old leaderboard entries (keep last 30 days)
    DELETE FROM leaderboard WHERE date < CURRENT_DATE - INTERVAL '30 days';
    
    -- Mark old untested submissions as expired
    UPDATE submissions 
    SET tested = true, valid = false 
    WHERE tested = false AND created_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- VIEWS FOR EASIER QUERYING
-- ============================================

-- Today's leaderboard view
CREATE OR REPLACE VIEW today_leaderboard AS
SELECT 
    ROW_NUMBER() OVER (ORDER BY tokens_saved DESC) as rank,
    name,
    email,
    compressions_count,
    tokens_saved
FROM leaderboard
WHERE date = CURRENT_DATE
ORDER BY tokens_saved DESC
LIMIT 10;

-- Recent compressions view
CREATE OR REPLACE VIEW recent_compressions AS
SELECT 
    original,
    compressed,
    source,
    tokens_saved,
    created_at
FROM compressions
ORDER BY created_at DESC
LIMIT 50;

-- Compression efficiency view
CREATE OR REPLACE VIEW compression_efficiency AS
SELECT 
    original,
    compressed,
    LENGTH(original) as original_length,
    LENGTH(compressed) as compressed_length,
    ROUND(((LENGTH(original) - LENGTH(compressed))::numeric / LENGTH(original)) * 100, 2) as reduction_percent,
    tokens_saved,
    frequency
FROM compressions
ORDER BY tokens_saved DESC;

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX idx_compressions_created_at ON compressions(created_at DESC);
CREATE INDEX idx_compressions_original ON compressions(original);
CREATE INDEX idx_compressions_compressed ON compressions(compressed);
CREATE INDEX idx_submissions_tested ON submissions(tested);
CREATE INDEX idx_submissions_created_at ON submissions(created_at DESC);
CREATE INDEX idx_leaderboard_date ON leaderboard(date DESC);
CREATE INDEX idx_articles_processed_at ON articles(processed_at DESC);

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================

-- Uncomment to add sample compressions for testing
/*
INSERT INTO compressions (original, compressed, source, tokens_saved) VALUES
    ('approximately', '≈', 'AI', 2000),
    ('implementation', '~impl', 'Human: TestUser', 1500),
    ('customer', '~cst', 'AI', 1000),
    ('unfortunately', '~unf', 'Human: SampleUser', 800);

INSERT INTO leaderboard (name, email, compressions_count, tokens_saved) VALUES
    ('TestUser', 'test@example.com', 2, 3000),
    ('SampleUser', 'sample@example.com', 1, 800);
*/

-- ============================================
-- REALTIME SUBSCRIPTIONS SETUP
-- ============================================

-- Enable realtime for specific tables
-- Go to Supabase Dashboard → Database → Replication
-- Enable replication for: compressions, leaderboard, stats

-- ============================================
-- STORED PROCEDURES FOR COMMON OPERATIONS
-- ============================================

-- Procedure to get hourly stats
CREATE OR REPLACE FUNCTION get_hourly_stats(hour_number INTEGER)
RETURNS TABLE (
    compressions_found INTEGER,
    tokens_saved_total INTEGER,
    human_wins INTEGER,
    ai_wins INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as compressions_found,
        COALESCE(SUM(tokens_saved), 0)::INTEGER as tokens_saved_total,
        COUNT(*) FILTER (WHERE source LIKE 'Human:%')::INTEGER as human_wins,
        COUNT(*) FILTER (WHERE source = 'AI')::INTEGER as ai_wins
    FROM compressions
    WHERE hour = hour_number;
END;
$$ LANGUAGE plpgsql;

-- Procedure to test compression reversibility
CREATE OR REPLACE FUNCTION test_compression(
    test_original TEXT,
    test_compressed TEXT,
    test_corpus TEXT[]
)
RETURNS BOOLEAN AS $$
DECLARE
    test_text TEXT;
    compressed_text TEXT;
    expanded_text TEXT;
BEGIN
    FOREACH test_text IN ARRAY test_corpus
    LOOP
        -- Apply compression
        compressed_text := REPLACE(test_text, test_original, test_compressed);
        -- Apply expansion
        expanded_text := REPLACE(compressed_text, test_compressed, test_original);
        
        -- Check if perfectly reversible
        IF expanded_text != test_text THEN
            RETURN FALSE;
        END IF;
    END LOOP;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FINAL SETUP MESSAGE
-- ============================================

DO $$
BEGIN
    RAISE NOTICE 'Token Compressor database setup complete!';
    RAISE NOTICE 'Tables created: compressions, submissions, leaderboard, articles, stats';
    RAISE NOTICE 'Security policies: Enabled';
    RAISE NOTICE 'Helper functions: Installed';
    RAISE NOTICE 'Views: Created';
    RAISE NOTICE 'Indexes: Built';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Enable Realtime in Dashboard → Database → Replication';
    RAISE NOTICE '2. Copy your project URL and anon key from Settings → API';
    RAISE NOTICE '3. Update the CONFIG object in your HTML file';
    RAISE NOTICE '4. Deploy and start discovering compressions!';
END $$;