/**
 * MARKETPLACE INTELLIGENCE QUERIES
 *
 * These queries mine your workflow_sessions database for marketplace opportunities.
 * Every SaaS workflow today = Marketplace data tomorrow!
 *
 * Usage: Run these queries in Supabase SQL Editor or via MCP tool
 */

-- ========================================
-- 1. HIGH-VALUE BUYER LEADS (Jorge's Goldmine)
-- ========================================
-- Companies with big tariff savings opportunities who opted in to supplier matching
-- Jorge uses this to prioritize Mexico supplier matching outreach

SELECT
  id,
  company_name,
  business_type,
  industry_sector,
  product_description,
  trade_volume,
  estimated_annual_savings,
  mexico_opportunity_score,
  sourcing_interest,
  timeline,
  budget_range,
  qualification_status,
  created_at,
  completed_at
FROM workflow_sessions
WHERE
  qualification_status = 'NOT_QUALIFIED'  -- Not USMCA qualified yet (biggest opportunity)
  AND estimated_annual_savings > 50000    -- $50K+ savings potential (worth Jorge's time)
  AND contact_consent = true              -- Opted in to supplier matching
  AND sourcing_interest IN ('Actively looking', 'Exploring')
ORDER BY
  estimated_annual_savings DESC,          -- Highest savings first
  mexico_opportunity_score DESC
LIMIT 50;

-- EXPECTED OUTPUT:
-- Company, Product, Trade Volume, Estimated Savings, Sourcing Intent, Timeline
-- Example: "Acme Manufacturing, Hydraulic Pumps, $2M, $150K/year, Actively looking, Immediate"
--
-- ACTION: Jorge contacts these companies to offer Mexico supplier matching


-- ========================================
-- 2. SUPPLIER DEMAND ANALYSIS (Cristina's Market Intel)
-- ========================================
-- What products do US importers need from Mexico suppliers?
-- Shows market size, demand count, and average tariff pain point

SELECT
  c.hs_code,
  c.description AS component_description,
  c.origin_country AS current_supplier_country,
  COUNT(DISTINCT ws.company_name) AS demand_count,
  AVG(c.value_percentage) AS avg_component_value_pct,
  SUM(ws.trade_volume) AS total_market_size,
  AVG(c.mfn_rate) AS avg_tariff_rate,
  AVG(c.mfn_rate - c.usmca_rate) AS avg_savings_opportunity
FROM workflow_sessions ws,
     jsonb_to_recordset(ws.component_origins) AS c(
       hs_code TEXT,
       description TEXT,
       origin_country TEXT,
       value_percentage NUMERIC,
       mfn_rate NUMERIC,
       usmca_rate NUMERIC
     )
WHERE
  c.origin_country = 'CN'           -- Currently sourced from China
  AND c.mfn_rate > 20               -- High tariff (big savings opportunity)
  AND ws.completed_at IS NOT NULL   -- Only completed workflows
GROUP BY c.hs_code, c.description, c.origin_country
HAVING COUNT(DISTINCT ws.company_name) > 5  -- At least 5 companies need this
ORDER BY total_market_size DESC, demand_count DESC
LIMIT 30;

-- EXPECTED OUTPUT:
-- HS Code, Product, Current Country, # Companies, Avg Value %, Market Size, Avg Tariff
-- Example: "8542.31.00, Microcontrollers, CN, 12 companies, 35%, $8.5M, 25%"
--
-- ACTION: Cristina uses this to identify which products Mexican suppliers should focus on


-- ========================================
-- 3. MEXICO SOURCING OPPORTUNITIES BY INDUSTRY
-- ========================================
-- Shows which industries have the most Mexico sourcing potential
-- Helps prioritize vertical-specific supplier outreach

SELECT
  industry_sector,
  COUNT(*) AS workflow_count,
  COUNT(*) FILTER (WHERE qualification_status = 'NOT_QUALIFIED') AS not_qualified_count,
  AVG(mexico_opportunity_score) AS avg_opportunity_score,
  SUM(estimated_annual_savings) AS total_savings_potential,
  AVG(trade_volume) AS avg_trade_volume,
  COUNT(*) FILTER (WHERE contact_consent = true) AS opted_in_count
FROM workflow_sessions
WHERE
  completed_at IS NOT NULL
  AND industry_sector IS NOT NULL
GROUP BY industry_sector
HAVING COUNT(*) > 3  -- At least 3 workflows in this industry
ORDER BY total_savings_potential DESC, avg_opportunity_score DESC;

-- EXPECTED OUTPUT:
-- Industry, Workflow Count, Not Qualified, Avg Opportunity Score, Total Savings, Opted In
-- Example: "Electronics & Technology, 45, 32, 78, $4.2M, 18"
--
-- ACTION: Focus Mexico supplier recruitment in high-potential industries


-- ========================================
-- 4. QUALIFIED SUPPLIER CAPABILITIES (Marketplace Directory Seed)
-- ========================================
-- Build supplier capability matrix from component origins
-- Shows what USMCA suppliers are already being used (proven capabilities)

SELECT
  c.origin_country,
  c.hs_code,
  c.description AS component_description,
  COUNT(DISTINCT ws.company_name) AS buyer_count,
  AVG(c.value_percentage) AS avg_order_size_pct,
  AVG(c.confidence) AS avg_data_quality,
  MAX(ws.completed_at) AS most_recent_use
FROM workflow_sessions ws,
     jsonb_to_recordset(ws.component_origins) AS c(
       hs_code TEXT,
       description TEXT,
       origin_country TEXT,
       value_percentage NUMERIC,
       confidence INTEGER
     )
WHERE
  c.origin_country IN ('MX', 'US', 'CA')  -- USMCA suppliers only
  AND c.confidence > 70                   -- High-quality data
  AND ws.completed_at IS NOT NULL
GROUP BY c.origin_country, c.hs_code, c.description
HAVING COUNT(DISTINCT ws.company_name) > 2  -- Multiple buyers use this supplier capability
ORDER BY buyer_count DESC, most_recent_use DESC
LIMIT 100;

-- EXPECTED OUTPUT:
-- Country, HS Code, Product, Buyer Count, Avg Order Size %, Data Quality
-- Example: "MX, 7326.90.85, Cast Steel Housings, 8 buyers, 35%, 85%"
--
-- ACTION: Pre-qualified supplier capabilities based on real trade data


-- ========================================
-- 5. REPLACEMENT CANDIDATES (Smart Matching Data)
-- ========================================
-- Companies with specific components that could be replaced with Mexico suppliers
-- Shows current country, HS code, value %, and savings potential

SELECT
  ws.company_name,
  ws.product_description,
  ws.trade_volume,
  rc.hs_code,
  rc.current_country,
  rc.target_country,
  rc.value_percentage,
  rc.estimated_savings,
  ws.sourcing_interest,
  ws.timeline,
  ws.contact_consent
FROM workflow_sessions ws,
     jsonb_to_recordset(ws.replacement_candidates) AS rc(
       hs_code TEXT,
       current_country TEXT,
       target_country TEXT,
       value_percentage NUMERIC,
       estimated_savings NUMERIC
     )
WHERE
  ws.replacement_candidates IS NOT NULL
  AND rc.target_country = 'MX'
  AND ws.contact_consent = true
ORDER BY rc.estimated_savings DESC
LIMIT 50;

-- EXPECTED OUTPUT:
-- Company, Product, Trade Volume, HS Code, Current Country → Mexico, Value %, Savings
-- Example: "Acme Mfg, Pumps, $2M, 7326.90.85, CN → MX, 35%, $150K"
--
-- ACTION: Jorge reaches out with specific Mexico supplier recommendations


-- ========================================
-- 6. VERIFIED HIGH-QUALITY WORKFLOWS (Jorge/Cristina Reviewed)
-- ========================================
-- Workflows that Jorge or Cristina have reviewed and validated
-- These are marketplace-ready with expert validation

SELECT
  company_name,
  product_description,
  industry_sector,
  qualification_status,
  estimated_annual_savings,
  mexico_opportunity_score,
  data_quality_score,
  verified_by_expert,
  completed_at
FROM workflow_sessions
WHERE
  verified_by_expert = true
  AND data_quality_score > 80
ORDER BY mexico_opportunity_score DESC, estimated_annual_savings DESC
LIMIT 100;

-- EXPECTED OUTPUT:
-- Company, Product, Industry, Status, Savings, Opportunity Score, Quality Score
-- Example: "Beta Corp, Electronics, Electronics, NOT_QUALIFIED, $200K, 92, 95"
--
-- ACTION: Premium marketplace listings with expert validation badge


-- ========================================
-- 7. SUPPLIER PAIN POINTS AGGREGATION
-- ========================================
-- Most common supplier pain points across all workflows
-- Helps Jorge/Cristina understand buyer needs for supplier matching

SELECT
  unnest(supplier_pain_points) AS pain_point,
  COUNT(*) AS mention_count,
  ARRAY_AGG(DISTINCT industry_sector) AS industries_affected,
  AVG(estimated_annual_savings) AS avg_savings_for_this_pain
FROM workflow_sessions
WHERE
  supplier_pain_points IS NOT NULL
  AND completed_at IS NOT NULL
GROUP BY pain_point
ORDER BY mention_count DESC
LIMIT 20;

-- EXPECTED OUTPUT:
-- Pain Point, Mention Count, Industries, Avg Savings
-- Example: "High tariffs, 45, [Electronics, Machinery, Automotive], $125K"
--
-- ACTION: Target these pain points in supplier recruitment messaging


-- ========================================
-- 8. RECENT HIGH-INTENT WORKFLOWS (Hot Leads - Last 30 Days)
-- ========================================
-- Recent workflows with high Mexico opportunity scores
-- Jorge's daily lead list for immediate outreach

SELECT
  company_name,
  product_description,
  business_type,
  industry_sector,
  estimated_annual_savings,
  mexico_opportunity_score,
  sourcing_interest,
  timeline,
  budget_range,
  contact_consent,
  completed_at,
  AGE(NOW(), completed_at) AS days_since_completion
FROM workflow_sessions
WHERE
  completed_at > NOW() - INTERVAL '30 days'
  AND mexico_opportunity_score > 70
  AND qualification_status = 'NOT_QUALIFIED'
ORDER BY
  CASE sourcing_interest
    WHEN 'Actively looking' THEN 1
    WHEN 'Exploring' THEN 2
    ELSE 3
  END,
  estimated_annual_savings DESC,
  completed_at DESC
LIMIT 25;

-- EXPECTED OUTPUT:
-- Company, Product, Savings, Score, Intent, Timeline, Days Since Completion
-- Example: "Gamma Inc, Auto Parts, $180K, 85, Actively looking, Immediate, 2 days ago"
--
-- ACTION: Jorge's daily outreach list - strike while the iron is hot!


-- ========================================
-- 9. MARKETPLACE READINESS SUMMARY (Executive Dashboard)
-- ========================================
-- High-level metrics for marketplace viability

SELECT
  COUNT(*) AS total_workflows,
  COUNT(*) FILTER (WHERE qualification_status = 'NOT_QUALIFIED') AS market_opportunity_workflows,
  COUNT(*) FILTER (WHERE contact_consent = true) AS opted_in_workflows,
  COUNT(*) FILTER (WHERE estimated_annual_savings > 50000) AS high_value_leads,
  COUNT(*) FILTER (WHERE verified_by_expert = true) AS expert_verified_workflows,
  SUM(estimated_annual_savings) AS total_savings_opportunity,
  AVG(mexico_opportunity_score) AS avg_opportunity_score,
  COUNT(DISTINCT industry_sector) AS industries_covered,
  COUNT(DISTINCT business_type) AS business_types_covered
FROM workflow_sessions
WHERE completed_at IS NOT NULL;

-- EXPECTED OUTPUT:
-- Total Workflows, Market Opportunities, Opted In, High Value, Verified, Total Savings, Industries
-- Example: "450, 320, 180, 95, 42, $8.5M, 72, 12, 6"
--
-- ACTION: Executive decision: "Do we have enough data to launch marketplace beta?"


-- ========================================
-- 10. COMPONENT HS CODE DEMAND HEATMAP
-- ========================================
-- Which HS codes appear most frequently across workflows
-- Helps prioritize which product categories to launch marketplace with

SELECT
  c.hs_code,
  c.description AS component_description,
  COUNT(DISTINCT ws.id) AS workflow_count,
  COUNT(DISTINCT ws.company_name) AS unique_companies,
  SUM(ws.trade_volume) AS total_market_value,
  AVG(c.mfn_rate) AS avg_tariff_exposure,
  COUNT(*) FILTER (WHERE c.origin_country = 'CN') AS china_sourced_count,
  COUNT(*) FILTER (WHERE c.origin_country IN ('MX', 'US', 'CA')) AS usmca_sourced_count
FROM workflow_sessions ws,
     jsonb_to_recordset(ws.component_origins) AS c(
       hs_code TEXT,
       description TEXT,
       origin_country TEXT,
       mfn_rate NUMERIC
     )
WHERE
  ws.completed_at IS NOT NULL
  AND c.hs_code IS NOT NULL
GROUP BY c.hs_code, c.description
HAVING COUNT(DISTINCT ws.company_name) > 3
ORDER BY workflow_count DESC, total_market_value DESC
LIMIT 50;

-- EXPECTED OUTPUT:
-- HS Code, Product, Workflow Count, Companies, Market Value, Avg Tariff, CN Count, USMCA Count
-- Example: "8542.31.00, Microcontrollers, 35, 18, $12M, 25%, 28, 7"
--
-- ACTION: Launch marketplace with these high-demand HS codes first


-- ========================================
-- USAGE INSTRUCTIONS
-- ========================================

/*
HOW TO USE THESE QUERIES:

1. IN SUPABASE DASHBOARD:
   - Go to your Supabase project → SQL Editor
   - Copy/paste any query above
   - Click "Run" to see results
   - Export to CSV for Jorge/Cristina review

2. VIA MCP TOOL (from Claude Code):
   mcp__supabase__execute_sql({
     project_id: "mrwitpgbcaxgnirqtavt",
     query: "SELECT ... FROM workflow_sessions ..."
   })

3. BUILD ADMIN DASHBOARD:
   - Create `/admin/marketplace-intelligence` page
   - Use these queries via API endpoints
   - Visualize with charts (ChartJS, Recharts)
   - Real-time dashboard updates as workflows complete

4. SCHEDULE DAILY REPORTS:
   - Use Supabase Edge Functions or Vercel Cron Jobs
   - Run Query #8 (Hot Leads) daily at 8am
   - Email Jorge with top 10 leads for outreach
   - Automatic lead nurturing workflow

MARKETPLACE LAUNCH CHECKLIST:
□ Reach 500+ completed workflows (data foundation)
□ 100+ opted-in high-value leads (Query #1)
□ 30+ verified workflows (Query #6)
□ 20+ high-demand HS codes (Query #10)
□ Jorge/Cristina beta test 10 manual matches (prove concept)
□ Launch "Find Suppliers" button in workflow results
*/

-- ========================================
-- MARKETPLACE FLYWHEEL METRICS
-- ========================================

/*
TRACK THESE METRICS TO MEASURE FLYWHEEL ACCELERATION:

Week 1-4 (SaaS Launch):
- Workflows completed per week
- Average mexico_opportunity_score
- Opt-in rate for supplier matching

Week 5-12 (Soft Marketplace):
- High-value leads contacted (Jorge outreach)
- Successful supplier matches (manual)
- Average time to match (days)
- Buyer satisfaction with matches

Week 13-24 (Marketplace Beta):
- Supplier listings added
- Automated matches vs manual matches
- Match success rate (%)
- Revenue per successful match (commission)

Week 25+ (Full Marketplace):
- Two-sided growth (buyers + suppliers)
- Self-serve match rate
- Platform GMV (Gross Merchandise Value)
- Marketplace revenue vs SaaS revenue

GOAL: Marketplace revenue > SaaS revenue by Month 12
*/
