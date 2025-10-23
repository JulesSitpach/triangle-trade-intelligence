/**
 * Marketplace Intelligence API
 * Mines workflow_sessions data for marketplace opportunities
 *
 * Every SaaS workflow today = Marketplace data tomorrow!
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { query } = req.query;

  try {
    switch (query) {
      case 'executive-summary':
        return await getExecutiveSummary(req, res);
      case 'hot-leads':
        return await getHotLeads(req, res);
      case 'supplier-demand':
        return await getSupplierDemand(req, res);
      case 'industry-opportunities':
        return await getIndustryOpportunities(req, res);
      case 'high-value-buyers':
        return await getHighValueBuyers(req, res);
      default:
        return res.status(400).json({ success: false, error: 'Invalid query type' });
    }
  } catch (error) {
    console.error('Marketplace intelligence error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * QUERY 9: Executive Summary
 * High-level metrics for marketplace viability
 */
async function getExecutiveSummary(req, res) {
  const { data, error } = await supabase.rpc('get_marketplace_summary');

  if (error) {
    // Fallback to manual query if RPC doesn't exist
    const { data: workflows, error: fallbackError } = await supabase
      .from('workflow_sessions')
      .select('*')
      .not('completed_at', 'is', null);

    if (fallbackError) {
      throw fallbackError;
    }

    // Calculate metrics manually
    const summary = {
      total_workflows: workflows.length,
      market_opportunity_workflows: workflows.filter(w => w.qualification_status === 'NOT_QUALIFIED').length,
      opted_in_workflows: workflows.filter(w => w.contact_consent === true).length,
      high_value_leads: workflows.filter(w => (w.estimated_annual_savings || 0) > 50000).length,
      expert_verified_workflows: workflows.filter(w => w.verified_by_expert === true).length,
      total_savings_opportunity: workflows.reduce((sum, w) => sum + (w.estimated_annual_savings || 0), 0),
      avg_opportunity_score: workflows.reduce((sum, w) => sum + (w.mexico_opportunity_score || 0), 0) / (workflows.length || 1),
      industries_covered: [...new Set(workflows.map(w => w.industry_sector).filter(Boolean))].length,
      business_types_covered: [...new Set(workflows.map(w => w.business_type).filter(Boolean))].length
    };

    return res.status(200).json({ success: true, data: summary });
  }

  return res.status(200).json({ success: true, data });
}

/**
 * QUERY 8: Hot Leads (Last 30 Days)
 * Recent workflows with high opportunity scores - strike while iron is hot!
 */
async function getHotLeads(req, res) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data, error } = await supabase
    .from('workflow_sessions')
    .select('*')
    .gt('completed_at', thirtyDaysAgo.toISOString())
    .gt('mexico_opportunity_score', 70)
    .eq('qualification_status', 'NOT_QUALIFIED')
    .order('estimated_annual_savings', { ascending: false })
    .limit(25);

  if (error) {
    throw error;
  }

  // Add days_since_completion to each record
  const enrichedData = data.map(workflow => ({
    ...workflow,
    days_since_completion: Math.floor(
      (Date.now() - new Date(workflow.completed_at).getTime()) / (1000 * 60 * 60 * 24)
    )
  }));

  return res.status(200).json({ success: true, data: enrichedData });
}

/**
 * QUERY 2: Supplier Demand Analysis
 * What products do US importers need from Mexico suppliers?
 */
async function getSupplierDemand(req, res) {
  const { data: workflows, error } = await supabase
    .from('workflow_sessions')
    .select('company_name, trade_volume, component_origins')
    .not('completed_at', 'is', null)
    .not('component_origins', 'is', null);

  if (error) {
    throw error;
  }

  // Aggregate component demand
  const demandMap = new Map();

  workflows.forEach(workflow => {
    const components = workflow.component_origins || [];
    components.forEach(component => {
      if (!component.hs_code || component.origin_country !== 'CN') return;
      if ((component.mfn_rate || 0) <= 20) return; // Only high tariff items

      const key = `${component.hs_code}|${component.description}`;
      if (!demandMap.has(key)) {
        demandMap.set(key, {
          hs_code: component.hs_code,
          component_description: component.description,
          current_supplier_country: component.origin_country,
          demand_count: 0,
          companies: new Set(),
          total_value_percentage: 0,
          total_market_size: 0,
          total_tariff_rate: 0,
          total_savings_opportunity: 0
        });
      }

      const entry = demandMap.get(key);
      entry.companies.add(workflow.company_name);
      entry.demand_count++;
      entry.total_value_percentage += component.value_percentage || 0;
      entry.total_market_size += parseFloat(workflow.trade_volume || 0);
      entry.total_tariff_rate += component.mfn_rate || 0;
      entry.total_savings_opportunity += (component.mfn_rate || 0) - (component.usmca_rate || 0);
    });
  });

  // Convert to array and calculate averages
  const demandData = Array.from(demandMap.values())
    .map(entry => ({
      ...entry,
      demand_count: entry.companies.size,
      companies: undefined, // Remove Set
      avg_component_value_pct: entry.total_value_percentage / entry.demand_count,
      avg_tariff_rate: entry.total_tariff_rate / entry.demand_count,
      avg_savings_opportunity: entry.total_savings_opportunity / entry.demand_count
    }))
    .filter(entry => entry.demand_count >= 3) // At least 3 companies need this
    .sort((a, b) => b.total_market_size - a.total_market_size)
    .slice(0, 30);

  return res.status(200).json({ success: true, data: demandData });
}

/**
 * QUERY 3: Industry Opportunities
 * Shows which industries have the most Mexico sourcing potential
 */
async function getIndustryOpportunities(req, res) {
  const { data: workflows, error } = await supabase
    .from('workflow_sessions')
    .select('*')
    .not('completed_at', 'is', null)
    .not('industry_sector', 'is', null);

  if (error) {
    throw error;
  }

  // Aggregate by industry
  const industryMap = new Map();

  workflows.forEach(workflow => {
    const industry = workflow.industry_sector;
    if (!industryMap.has(industry)) {
      industryMap.set(industry, {
        industry_sector: industry,
        workflow_count: 0,
        not_qualified_count: 0,
        total_opportunity_score: 0,
        total_savings_potential: 0,
        total_trade_volume: 0,
        opted_in_count: 0
      });
    }

    const entry = industryMap.get(industry);
    entry.workflow_count++;
    if (workflow.qualification_status === 'NOT_QUALIFIED') {
      entry.not_qualified_count++;
    }
    entry.total_opportunity_score += workflow.mexico_opportunity_score || 0;
    entry.total_savings_potential += workflow.estimated_annual_savings || 0;
    entry.total_trade_volume += parseFloat(workflow.trade_volume || 0);
    if (workflow.contact_consent === true) {
      entry.opted_in_count++;
    }
  });

  // Convert to array and calculate averages
  const industryData = Array.from(industryMap.values())
    .map(entry => ({
      ...entry,
      avg_opportunity_score: entry.total_opportunity_score / entry.workflow_count,
      avg_trade_volume: entry.total_trade_volume / entry.workflow_count
    }))
    .filter(entry => entry.workflow_count >= 3) // At least 3 workflows
    .sort((a, b) => b.total_savings_potential - a.total_savings_potential);

  return res.status(200).json({ success: true, data: industryData });
}

/**
 * QUERY 1: High-Value Buyer Leads
 * Companies with $50K+ savings potential who opted in to supplier matching
 */
async function getHighValueBuyers(req, res) {
  const { data, error } = await supabase
    .from('workflow_sessions')
    .select('*')
    .eq('qualification_status', 'NOT_QUALIFIED')
    .gt('estimated_annual_savings', 50000)
    .eq('contact_consent', true)
    .in('sourcing_interest', ['Actively looking', 'Exploring'])
    .order('estimated_annual_savings', { ascending: false })
    .limit(50);

  if (error) {
    throw error;
  }

  return res.status(200).json({ success: true, data });
}
