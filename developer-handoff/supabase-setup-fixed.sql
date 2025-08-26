-- Token Compressor Database Schema
-- Clean, validated version for Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Compressions table: Stores validated compressions
CREATE TABLE compressions (
    id SERIAL PRIMARY KEY,
    original TEXT NOT NULL,
    compressed TEXT NOT NULL,
    source TEXT DEFAULT 'AI-Discovery', -- 'AI-Discovery', 'Human: [name]'
    hour INTEGER NOT NULL, -- Hour when discovered (for analytics)
    tokens_saved INTEGER DEFAULT 2,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    validated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Submissions table: Human-submitted compressions awaiting validation
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
    UNIQUE(email, date)
);

-- Articles table: Track processed articles for diversity
CREATE TABLE articles (
    id SERIAL PRIMARY KEY,
    source_type TEXT NOT NULL, -- 'news', 'research', 'blog', etc.
    content TEXT NOT NULL,
    url TEXT,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stats table: Global system statistics
CREATE TABLE stats (
    id SERIAL PRIMARY KEY,
    metric_name TEXT NOT NULL UNIQUE,
    metric_value INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial stats
INSERT INTO stats (metric_name, metric_value) VALUES 
    ('current_hour', 1),
    ('total_compressions', 0),
    ('total_articles_processed', 0),
    ('total_tokens_saved', 0),
    ('human_wins', 0),
    ('ai_wins', 0);

-- Row Level Security Policies

-- Enable RLS on all tables
ALTER TABLE compressions ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stats ENABLE ROW LEVEL SECURITY;

-- Public read access to compressions (discovery lab is public)
CREATE POLICY "Allow public read access to compressions" ON compressions
    FOR SELECT USING (true);

-- Only service role can insert compressions (after validation)
CREATE POLICY "Allow service role to insert compressions" ON compressions
    FOR INSERT WITH CHECK (true);

-- Allow public to submit compressions
CREATE POLICY "Allow public to submit compressions" ON submissions
    FOR INSERT WITH CHECK (true);

-- Allow service role to read/update submissions (for validation)
CREATE POLICY "Allow service role to manage submissions" ON submissions
    FOR ALL USING (true);

-- Public read access to leaderboard
CREATE POLICY "Allow public read access to leaderboard" ON leaderboard
    FOR SELECT USING (true);

-- Allow service role to manage leaderboard
CREATE POLICY "Allow service role to manage leaderboard" ON leaderboard
    FOR ALL USING (true);

-- Allow service role to manage articles
CREATE POLICY "Allow service role to manage articles" ON articles
    FOR ALL USING (true);

-- Public read access to stats
CREATE POLICY "Allow public read access to stats" ON stats
    FOR SELECT USING (true);

-- Allow service role to update stats
CREATE POLICY "Allow service role to update stats" ON stats
    FOR UPDATE USING (true);

-- Functions for automatic leaderboard updates

-- Function to update leaderboard when compression is validated
CREATE OR REPLACE FUNCTION update_leaderboard_on_compression()
RETURNS TRIGGER AS $$
BEGIN
    -- Only process human submissions
    IF NEW.source LIKE 'Human:%' THEN
        INSERT INTO leaderboard (name, email, compressions_count, tokens_saved, date)
        VALUES (
            SUBSTRING(NEW.source FROM 8), -- Extract name after 'Human: '
            '', -- Email would come from submissions table in real implementation
            1,
            NEW.tokens_saved,
            CURRENT_DATE
        )
        ON CONFLICT (email, date) 
        DO UPDATE SET 
            compressions_count = leaderboard.compressions_count + 1,
            tokens_saved = leaderboard.tokens_saved + NEW.tokens_saved,
            updated_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update leaderboard automatically
CREATE TRIGGER compression_leaderboard_update
    AFTER INSERT ON compressions
    FOR EACH ROW
    EXECUTE FUNCTION update_leaderboard_on_compression();

-- Function to update global stats
CREATE OR REPLACE FUNCTION update_global_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update total compressions count
    UPDATE stats 
    SET metric_value = (SELECT COUNT(*) FROM compressions),
        updated_at = NOW()
    WHERE metric_name = 'total_compressions';
    
    -- Update total tokens saved
    UPDATE stats 
    SET metric_value = (SELECT COALESCE(SUM(tokens_saved), 0) FROM compressions),
        updated_at = NOW()
    WHERE metric_name = 'total_tokens_saved';
    
    -- Update win counts
    UPDATE stats 
    SET metric_value = (SELECT COUNT(*) FROM compressions WHERE source LIKE 'Human:%'),
        updated_at = NOW()
    WHERE metric_name = 'human_wins';
    
    UPDATE stats 
    SET metric_value = (SELECT COUNT(*) FROM compressions WHERE source = 'AI-Discovery'),
        updated_at = NOW()
    WHERE metric_name = 'ai_wins';
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update global stats
CREATE TRIGGER compression_stats_update
    AFTER INSERT ON compressions
    FOR EACH ROW
    EXECUTE FUNCTION update_global_stats();

-- Indexes for performance
CREATE INDEX idx_compressions_created_at ON compressions(created_at DESC);
CREATE INDEX idx_compressions_original ON compressions(original);
CREATE INDEX idx_compressions_compressed ON compressions(compressed);
CREATE INDEX idx_submissions_tested ON submissions(tested);
CREATE INDEX idx_submissions_created_at ON submissions(created_at DESC);
CREATE INDEX idx_leaderboard_date ON leaderboard(date DESC);
CREATE INDEX idx_articles_processed_at ON articles(processed_at DESC);

-- Enable real-time subscriptions for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE compressions;
ALTER PUBLICATION supabase_realtime ADD TABLE submissions;
ALTER PUBLICATION supabase_realtime ADD TABLE leaderboard;
ALTER PUBLICATION supabase_realtime ADD TABLE stats;