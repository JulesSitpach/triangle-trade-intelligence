-- STEP 1: CREATE CORE TABLES
-- Run this first in Supabase SQL Editor

-- Partner Suppliers Table
CREATE TABLE IF NOT EXISTS partner_suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Company Information
    company_name TEXT NOT NULL,
    location TEXT,
    country_code TEXT DEFAULT 'MX',
    website TEXT,
    
    -- HS Code Specializations
    hs_specialties TEXT[],
    product_categories TEXT[],
    
    -- Contact Information  
    contact_person TEXT,
    contact_title TEXT,
    phone TEXT,
    email TEXT,
    
    -- USMCA & Compliance
    usmca_qualified BOOLEAN DEFAULT false,
    usmca_certification_time_days INTEGER,
    quality_certifications TEXT[],
    
    -- Broker Verification
    broker_verified BOOLEAN DEFAULT false,
    broker_visit_date DATE,
    broker_notes TEXT,
    verification_status TEXT DEFAULT 'pending',
    
    -- Capacity & Pricing
    production_capacity TEXT,
    pricing_premium_percent DECIMAL,
    minimum_order_quantity TEXT,
    lead_time_weeks INTEGER,
    
    -- Performance Tracking
    introduction_count INTEGER DEFAULT 0,
    successful_partnerships INTEGER DEFAULT 0,
    average_rating DECIMAL,
    last_contacted DATE,
    
    -- System Fields
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by TEXT
);

-- Crisis Solutions Junction Table
CREATE TABLE IF NOT EXISTS crisis_solutions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Crisis Alert Reference
    crisis_alert_id TEXT NOT NULL,
    hs_code TEXT NOT NULL,
    
    -- Supplier Reference
    supplier_id UUID REFERENCES partner_suppliers(id) ON DELETE CASCADE,
    
    -- Solution Analysis
    estimated_cost_savings DECIMAL,
    net_benefit_percent DECIMAL,
    tariff_savings_percent DECIMAL DEFAULT 25,
    
    -- Recommendation Priority
    recommendation_priority INTEGER DEFAULT 5,
    broker_recommendation TEXT,
    
    -- Matching Logic
    match_confidence DECIMAL DEFAULT 0.5,
    match_criteria JSONB,
    
    -- System Fields
    created_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Supplier Introduction Requests Table
CREATE TABLE IF NOT EXISTS supplier_introduction_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Customer Information
    user_email TEXT NOT NULL,
    company_name TEXT,
    user_profile JSONB,
    
    -- Request Details
    supplier_id UUID REFERENCES partner_suppliers(id),
    hs_code TEXT,
    crisis_alert_id TEXT,
    
    -- Requirements
    annual_volume TEXT,
    timeline_urgency TEXT,
    specific_requirements TEXT,
    
    -- Request Status
    status TEXT DEFAULT 'pending',
    broker_notes TEXT,
    introduction_date DATE,
    
    -- Follow-up Tracking
    customer_response TEXT,
    partnership_value DECIMAL,
    broker_fee_earned DECIMAL,
    
    -- System Fields
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    assigned_broker TEXT
);