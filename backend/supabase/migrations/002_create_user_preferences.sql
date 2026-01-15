-- Create user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- AI Preferences
  preferred_llm_provider TEXT DEFAULT 'openai', -- 'openai', 'claude', 'gemini', 'backend'
  default_answer_length TEXT DEFAULT 'medium', -- 'short', 'medium', 'long'
  tone_preference TEXT DEFAULT 'professional', -- 'professional', 'casual', 'formal'
  
  -- Extension Settings
  auto_fill_enabled BOOLEAN DEFAULT false,
  show_suggestions BOOLEAN DEFAULT true,
  
  -- API Keys (encrypted or stored securely)
  openai_api_key TEXT, -- Encrypted in production
  claude_api_key TEXT, -- Encrypted in production
  gemini_api_key TEXT, -- Encrypted in production
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- Enable Row Level Security
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own preferences"
  ON user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON user_preferences FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_user_preferences_updated_at 
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
