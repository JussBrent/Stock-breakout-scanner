-- AI Training Content table
-- Stores video transcripts and other training material that gets injected into Sean's system prompt
CREATE TABLE IF NOT EXISTS ai_training_content (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,           -- The transcript or training text
    source_type TEXT NOT NULL DEFAULT 'transcript',  -- 'transcript', 'manual', 'document'
    source_filename TEXT,            -- Original filename if uploaded
    tags TEXT[] DEFAULT '{}',        -- Tags for categorization (e.g., 'breakouts', 'risk-management')
    is_active BOOLEAN DEFAULT true,  -- Toggle on/off without deleting
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for active content lookup (used on every AI chat request)
CREATE INDEX idx_ai_training_active ON ai_training_content (is_active) WHERE is_active = true;

-- RLS policies
ALTER TABLE ai_training_content ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY "Service role full access" ON ai_training_content
    FOR ALL USING (true) WITH CHECK (true);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_ai_training_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ai_training_content_updated_at
    BEFORE UPDATE ON ai_training_content
    FOR EACH ROW
    EXECUTE FUNCTION update_ai_training_updated_at();
