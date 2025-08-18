-- Priority 2: User Similarity Tables for "Companies like yours..." Features
-- Enables social proof and pattern matching with minimal interface impact

-- User Similarity Matrix (Core Network Effects Engine)
CREATE TABLE IF NOT EXISTS user_similarity_matrix (
    id SERIAL PRIMARY KEY,
    user_id_1 INTEGER NOT NULL,
    user_id_2 INTEGER NOT NULL,
    
    -- Similarity Scores (0-100)
    business_type_similarity INTEGER DEFAULT 0,
    import_volume_similarity INTEGER DEFAULT 0,
    geographic_similarity INTEGER DEFAULT 0,
    product_similarity INTEGER DEFAULT 0,
    route_preference_similarity INTEGER DEFAULT 0,
    
    -- Overall Similarity Score (weighted average)
    overall_similarity_score DECIMAL(5,2) NOT NULL,
    similarity_confidence INTEGER DEFAULT 85, -- How confident we are in this match
    
    -- Context for Similarity
    shared_attributes JSONB, -- What specifically makes them similar
    key_differences JSONB,   -- Important differences to note
    
    -- Performance Tracking
    calculated_at TIMESTAMP DEFAULT NOW(),
    last_updated TIMESTAMP DEFAULT NOW(),
    calculation_method VARCHAR(50) DEFAULT 'weighted_attributes', -- Algorithm used
    
    -- Usage Analytics
    times_used_for_recommendations INTEGER DEFAULT 0,
    recommendation_effectiveness DECIMAL(3,2), -- How often this similarity leads to action
    
    UNIQUE(user_id_1, user_id_2),
    CHECK (user_id_1 != user_id_2),
    CHECK (overall_similarity_score BETWEEN 0 AND 100)
);

-- User Pattern Matches (What Similar Users Actually Did)
CREATE TABLE IF NOT EXISTS user_pattern_matches (
    id SERIAL PRIMARY KEY,
    base_user_profile JSONB NOT NULL, -- Anonymous profile template
    
    -- Pattern Description
    pattern_name VARCHAR(255) NOT NULL,
    pattern_description TEXT NOT NULL,
    pattern_category VARCHAR(100), -- 'route_choice', 'product_optimization', 'savings_strategy'
    
    -- Statistical Evidence
    total_matching_users INTEGER NOT NULL,
    successful_implementations INTEGER NOT NULL,
    average_savings_achieved INTEGER,
    success_rate DECIMAL(5,2), -- % who achieved expected results
    
    -- Behavioral Patterns
    typical_stage_progression JSONB, -- How users typically move through stages
    common_decision_points JSONB,   -- Where they make key choices
    frequent_concerns TEXT[],       -- Common questions/concerns
    
    -- Outcome Data
    typical_timeline_weeks INTEGER,
    risk_factors TEXT[],
    success_indicators TEXT[],
    
    -- Evidence Quality
    data_points_count INTEGER NOT NULL, -- How many users this is based on
    confidence_level INTEGER DEFAULT 80,
    last_pattern_update TIMESTAMP DEFAULT NOW(),
    
    -- Usage Optimization
    display_priority INTEGER DEFAULT 50, -- Higher = show first
    user_engagement_rate DECIMAL(5,2),  -- How often users click/read this
    conversion_influence DECIMAL(5,2),  -- How much this influences final decisions
    
    -- Metadata
    created_from_analysis_date TIMESTAMP DEFAULT NOW(),
    analyst_notes TEXT,
    tags TEXT[]
);

-- Individual Intelligence Tracking (Personalized Insights)
CREATE TABLE IF NOT EXISTS individual_intelligence_tracking (
    id SERIAL PRIMARY KEY,
    user_session_id VARCHAR(255) UNIQUE NOT NULL,
    
    -- User Profile Summary (Anonymous)
    business_type VARCHAR(100),
    import_volume_range VARCHAR(50),
    geographic_region VARCHAR(50),
    primary_supplier_country VARCHAR(2),
    
    -- Similarity Matching Results
    top_similar_users INTEGER[], -- Array of user IDs most similar to this user
    similarity_based_predictions JSONB, -- What we predict they'll choose
    pattern_matches INTEGER[], -- user_pattern_matches.id that apply to them
    
    -- Personalized Insights
    customized_recommendations TEXT[],
    predicted_savings_range VARCHAR(50), -- "$150K-$250K annually"
    risk_assessment TEXT,
    timeline_prediction VARCHAR(50), -- "8-12 weeks implementation"
    
    -- Learning Adaptation
    recommendation_accuracy_score DECIMAL(3,2), -- How accurate our predictions were
    user_feedback_score INTEGER, -- 1-5 rating of recommendation quality
    actual_vs_predicted_outcome JSONB, -- What actually happened vs prediction
    
    -- Behavioral Intelligence
    engagement_pattern VARCHAR(50), -- 'thorough_researcher', 'quick_decider', 'cautious_evaluator'
    decision_making_style VARCHAR(50), -- 'data_driven', 'consultant_dependent', 'intuitive'
    information_preference VARCHAR(50), -- 'detailed_analysis', 'summary_focused', 'visual_learner'
    
    -- Journey Tracking
    stages_completed INTEGER DEFAULT 0,
    time_between_stages JSONB, -- How long they spend on each stage
    areas_of_highest_interest TEXT[], -- Which sections they spend most time on
    questions_asked_pattern JSONB, -- What they're most curious about
    
    -- Prediction Performance
    predictions_made INTEGER DEFAULT 0,
    predictions_accurate INTEGER DEFAULT 0,
    learning_improvement_rate DECIMAL(5,2), -- How much better our predictions get
    
    -- Metadata
    tracking_started TIMESTAMP DEFAULT NOW(),
    last_activity TIMESTAMP DEFAULT NOW(),
    intelligence_level DECIMAL(3,1) DEFAULT 1.0, -- Current AI intelligence level for this user
    data_collection_consent BOOLEAN DEFAULT true
);

-- Success Pattern Library Enhancement (Building on existing table)
CREATE TABLE IF NOT EXISTS user_success_correlations (
    id SERIAL PRIMARY KEY,
    
    -- Success Pattern Reference
    success_pattern_id INTEGER REFERENCES success_pattern_library(id),
    
    -- User Characteristics That Correlate With This Success
    business_type_correlation VARCHAR(100),
    volume_range_correlation VARCHAR(50),
    geographic_correlation VARCHAR(50),
    
    -- Correlation Strength
    correlation_strength DECIMAL(3,2), -- -1.0 to 1.0
    statistical_significance DECIMAL(3,2), -- 0.0 to 1.0
    sample_size INTEGER NOT NULL,
    
    -- Predictive Value
    success_prediction_accuracy DECIMAL(3,2), -- How often this correlation predicts success
    false_positive_rate DECIMAL(3,2), -- How often it's wrong
    
    -- Context
    correlation_discovered_date TIMESTAMP DEFAULT NOW(),
    correlation_method VARCHAR(100), -- 'statistical_analysis', 'ml_clustering', etc.
    validation_status VARCHAR(50) DEFAULT 'pending', -- 'validated', 'pending', 'rejected'
    
    -- Performance
    times_used_in_recommendations INTEGER DEFAULT 0,
    user_satisfaction_with_correlation DECIMAL(3,2)
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_similarity_matrix_score ON user_similarity_matrix(overall_similarity_score DESC);
CREATE INDEX IF NOT EXISTS idx_similarity_matrix_users ON user_similarity_matrix(user_id_1, user_id_2);
CREATE INDEX IF NOT EXISTS idx_pattern_matches_profile ON user_pattern_matches USING GIN (base_user_profile);
CREATE INDEX IF NOT EXISTS idx_pattern_matches_category ON user_pattern_matches(pattern_category, success_rate DESC);
CREATE INDEX IF NOT EXISTS idx_individual_tracking_session ON individual_intelligence_tracking(user_session_id);
CREATE INDEX IF NOT EXISTS idx_individual_tracking_profile ON individual_intelligence_tracking(business_type, import_volume_range);
CREATE INDEX IF NOT EXISTS idx_success_correlations_pattern ON user_success_correlations(success_pattern_id, correlation_strength DESC);

-- Views for Easy Querying
CREATE OR REPLACE VIEW user_similarity_insights AS
SELECT 
    utm.user_id_1,
    utm.overall_similarity_score,
    utm.shared_attributes,
    COUNT(upm.id) as matching_patterns,
    AVG(upm.average_savings_achieved) as avg_similar_user_savings
FROM user_similarity_matrix utm
LEFT JOIN user_pattern_matches upm ON 
    (utm.shared_attributes->>'business_type') = (upm.base_user_profile->>'business_type')
WHERE utm.overall_similarity_score >= 70
GROUP BY utm.user_id_1, utm.overall_similarity_score, utm.shared_attributes;

-- Comments
COMMENT ON TABLE user_similarity_matrix IS 'Core engine for "Companies like yours" features';
COMMENT ON TABLE user_pattern_matches IS 'Statistical patterns for similar user behavior';
COMMENT ON TABLE individual_intelligence_tracking IS 'Personalized AI learning for each user';
COMMENT ON TABLE user_success_correlations IS 'What user traits predict success patterns';

-- Sample Data Insert Functions
CREATE OR REPLACE FUNCTION insert_sample_similarity_data()
RETURNS void AS $$
BEGIN
    -- Insert sample pattern matches for common business types
    INSERT INTO user_pattern_matches (
        base_user_profile, pattern_name, pattern_description, pattern_category,
        total_matching_users, successful_implementations, average_savings_achieved, success_rate
    ) VALUES 
    (
        '{"business_type": "Electronics", "import_volume": "$1M-$5M", "geographic_region": "West_Coast"}',
        'Electronics Mexico Route Preference',
        'Companies like yours typically choose Mexico triangle routing for 15-25% savings',
        'route_choice',
        23, 19, 185000, 82.6
    ),
    (
        '{"business_type": "Manufacturing", "import_volume": "$5M-$25M", "geographic_region": "Midwest"}',
        'Manufacturing Dual Route Strategy',
        'Similar manufacturers use both Mexico and Canada routes depending on product type',
        'savings_strategy',
        31, 27, 320000, 87.1
    );
    
    RAISE NOTICE 'Sample similarity data inserted successfully';
END;
$$ LANGUAGE plpgsql;