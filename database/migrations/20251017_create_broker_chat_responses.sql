-- Broker Chat Responses Table
-- Friendly, conversational trade terminology help for SMB users
-- "Ask Your Broker" - database-driven chatbot (no external AI calls)

CREATE TABLE IF NOT EXISTS broker_chat_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Search & matching
  term TEXT NOT NULL,                    -- Main term (e.g., "Origin Criterion")
  keywords TEXT[] NOT NULL,              -- Search keywords ["origin criterion", "field 8", "criterion A B C"]
  category TEXT NOT NULL,                -- "certificate", "tariff", "workflow", "general"

  -- Friendly broker response content
  broker_response TEXT NOT NULL,         -- Main conversational answer (friendly, encouraging)
  quick_tip TEXT,                        -- "Pro tip:" style practical advice
  real_example TEXT,                     -- "Had a client last week..." real-world story
  encouragement TEXT,                    -- "You've got this!" motivational message

  -- Follow-up & engagement
  related_questions TEXT[],              -- ["What does 'transformed' mean?", "How do I know my criterion?"]
  next_steps TEXT[],                     -- ["Fill out components", "Skip to next field"]

  -- Metadata
  difficulty_level TEXT DEFAULT 'beginner', -- "beginner", "intermediate", "advanced"
  form_field TEXT,                       -- Which form field this helps with (for context-aware suggestions)
  helpful_votes INTEGER DEFAULT 0,       -- User feedback tracking
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast keyword search
CREATE INDEX idx_broker_chat_keywords ON broker_chat_responses USING GIN(keywords);
CREATE INDEX idx_broker_chat_category ON broker_chat_responses(category);
CREATE INDEX idx_broker_chat_form_field ON broker_chat_responses(form_field);

-- Full-text search index for term matching
CREATE INDEX idx_broker_chat_term_search ON broker_chat_responses USING GIN(to_tsvector('english', term));

-- Track user interactions with chatbot
CREATE TABLE IF NOT EXISTS broker_chat_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT,
  question TEXT NOT NULL,
  response_id UUID REFERENCES broker_chat_responses(id),
  matched_term TEXT,                     -- Which term AI matched (for AI agent approach)
  was_helpful BOOLEAN,
  form_context TEXT,                     -- Which form/page user was on
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for analytics
CREATE INDEX idx_broker_chat_interactions_user ON broker_chat_interactions(user_id);
CREATE INDEX idx_broker_chat_interactions_response ON broker_chat_interactions(response_id);
CREATE INDEX idx_broker_chat_interactions_date ON broker_chat_interactions(created_at);

COMMENT ON TABLE broker_chat_responses IS 'Friendly broker chatbot responses - helps SMB users understand trade terminology without external AI calls';
COMMENT ON TABLE broker_chat_interactions IS 'Track user questions and chatbot helpfulness for continuous improvement';
