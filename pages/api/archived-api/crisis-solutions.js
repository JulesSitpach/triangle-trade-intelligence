/**
 * CRISIS SOLUTIONS API
 * Provides partner supplier alternatives for crisis scenarios
 * Integrates with existing crisis monitoring system
 */

import { createClient } from '@supabase/supabase-js';
import { logInfo, logError } from '../../lib/utils/production-logger.js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      allowed_methods: ['POST', 'GET']
    });
  }

  const { action, ...params } = req.method === 'POST' ? req.body : req.query;
  const startTime = Date.now();

  try {
    logInfo('Crisis solutions API called', { action, method: req.method });

    switch (action) {
      case 'get_suppliers_for_hs_code':
        return await handleGetSuppliersForHSCode(req, res, params, startTime);
      
      case 'request_supplier_introduction':
        return await handleSupplierIntroductionRequest(req, res, params, startTime);
      
      case 'get_crisis_solutions':
        return await handleGetCrisisSolutions(req, res, params, startTime);
      
      case 'calculate_solution_benefits':
        return await handleCalculateSolutionBenefits(req, res, params, startTime);
      
      case 'update_supplier_performance':
        return await handleUpdateSupplierPerformance(req, res, params, startTime);
      
      case 'get_introduction_requests':
        return await handleGetIntroductionRequests(req, res, params, startTime);
      
      default:
        return res.status(400).json({
          success: false,
          error: 'Unknown action',
          available_actions: [
            'get_suppliers_for_hs_code',
            'request_supplier_introduction',
            'get_crisis_solutions',
            'calculate_solution_benefits',
            'update_supplier_performance',
            'get_introduction_requests'
          ]
        });
    }

  } catch (error) {
    logError('Crisis solutions API error', {
      error: error.message,
      action,
      processing_time_ms: Date.now() - startTime
    });

    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Service unavailable',
      processing_time_ms: Date.now() - startTime
    });
  }
}

/**
 * Get suppliers that specialize in specific HS codes
 */
async function handleGetSuppliersForHSCode(req, res, params, startTime) {
  const { hs_code, user_profile } = params;

  if (!hs_code) {
    return res.status(400).json({
      success: false,
      error: 'hs_code is required'
    });
  }

  // Extract HS chapter (first 4 digits)
  const hsChapter = hs_code.toString().substring(0, 4);
  
  logInfo('Finding suppliers for HS code', { hs_code, hsChapter });

  // Query suppliers that specialize in this HS chapter
  const { data: suppliers, error } = await supabase
    .from('partner_suppliers')
    .select(`
      id,
      company_name,
      location,
      country_code,
      contact_person,
      contact_title,
      phone,
      email,
      hs_specialties,
      usmca_qualified,
      usmca_certification_time_days,
      pricing_premium_percent,
      production_capacity,
      quality_certifications,
      broker_verified,
      broker_notes,
      introduction_count,
      successful_partnerships
    `)
    .contains('hs_specialties', [hsChapter])
    .eq('status', 'active')
    .order('broker_verified', { ascending: false })
    .order('pricing_premium_percent', { ascending: true })
    .limit(10);

  if (error) {
    throw new Error(`Database query failed: ${error.message}`);
  }

  // Calculate solution benefits for each supplier
  const suppliersWithBenefits = await Promise.all(
    suppliers.map(async (supplier) => {
      const benefits = await calculateSupplierBenefits(supplier, user_profile);
      return {
        ...supplier,
        solution_benefits: benefits,
        match_score: calculateMatchScore(supplier, hs_code, user_profile)
      };
    })
  );

  // Sort by match score (highest first)
  suppliersWithBenefits.sort((a, b) => b.match_score - a.match_score);

  return res.status(200).json({
    success: true,
    suppliers: suppliersWithBenefits,
    hs_code,
    hs_chapter: hsChapter,
    total_suppliers: suppliersWithBenefits.length,
    verified_suppliers: suppliersWithBenefits.filter(s => s.broker_verified).length,
    processing_time_ms: Date.now() - startTime
  });
}

/**
 * Handle customer requests for supplier introductions
 */
async function handleSupplierIntroductionRequest(req, res, params, startTime) {
  const { 
    user_profile, 
    supplier_id, 
    hs_code, 
    crisis_alert_id,
    timeline_urgency = '30_days',
    specific_requirements = ''
  } = params;

  if (!user_profile?.email || !supplier_id) {
    return res.status(400).json({
      success: false,
      error: 'user_profile.email and supplier_id are required'
    });
  }

  logInfo('Processing supplier introduction request', {
    user_email: user_profile.email,
    supplier_id,
    hs_code
  });

  // Insert introduction request
  const { data: request, error } = await supabase
    .from('supplier_introduction_requests')
    .insert({
      user_email: user_profile.email,
      company_name: user_profile.companyName || user_profile.company_name,
      user_profile: user_profile,
      supplier_id,
      hs_code,
      crisis_alert_id,
      annual_volume: user_profile.annualTradeVolume ? 
        `$${(user_profile.annualTradeVolume / 1000000).toFixed(1)}M` : 'Not specified',
      timeline_urgency,
      specific_requirements,
      status: 'pending',
      assigned_broker: 'primary_broker' // Assign to main broker
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create introduction request: ${error.message}`);
  }

  // Update supplier introduction count
  await supabase
    .from('partner_suppliers')
    .update({ 
      introduction_count: supabase.raw('introduction_count + 1'),
      last_contacted: new Date().toISOString()
    })
    .eq('id', supplier_id);

  // TODO: Send notification to broker (email, Slack, etc.)
  // await notifyBrokerOfNewRequest(request);

  return res.status(200).json({
    success: true,
    request_id: request.id,
    message: 'Introduction request submitted successfully',
    next_steps: 'Broker will contact you within 24 hours to arrange introduction',
    broker_contact: 'Licensed customs broker will facilitate the connection',
    processing_time_ms: Date.now() - startTime
  });
}

/**
 * Get comprehensive crisis solutions for specific alerts
 */
async function handleGetCrisisSolutions(req, res, params, startTime) {
  const { crisis_alert_id, hs_code, user_profile } = params;

  if (!crisis_alert_id && !hs_code) {
    return res.status(400).json({
      success: false,
      error: 'Either crisis_alert_id or hs_code is required'
    });
  }

  // Get existing crisis solutions or generate new ones
  let solutions = [];
  
  if (crisis_alert_id) {
    // Check for pre-configured solutions
    const { data: existingSolutions } = await supabase
      .from('crisis_solutions')
      .select(`
        *,
        supplier:partner_suppliers(*)
      `)
      .eq('crisis_alert_id', crisis_alert_id)
      .eq('is_active', true)
      .order('recommendation_priority');

    solutions = existingSolutions || [];
  }

  // If no existing solutions, generate them dynamically
  if (solutions.length === 0 && hs_code) {
    const suppliersResponse = await handleGetSuppliersForHSCode(
      req, 
      { status: () => ({ json: () => {} }) }, // Mock response object
      { hs_code, user_profile }, 
      startTime
    );
    
    // Convert suppliers to solution format
    solutions = suppliersResponse.suppliers?.slice(0, 5).map((supplier, index) => ({
      id: `dynamic-${supplier.id}`,
      supplier: supplier,
      recommendation_priority: index + 1,
      estimated_cost_savings: supplier.solution_benefits?.annual_savings,
      net_benefit_percent: supplier.solution_benefits?.net_benefit_percent,
      broker_recommendation: generateBrokerRecommendation(supplier)
    })) || [];
  }

  return res.status(200).json({
    success: true,
    crisis_alert_id,
    hs_code,
    solutions,
    total_solutions: solutions.length,
    solution_summary: {
      average_savings: solutions.reduce((acc, s) => acc + (s.estimated_cost_savings || 0), 0) / solutions.length,
      fastest_certification: Math.min(...solutions.map(s => s.supplier?.usmca_certification_time_days || 30)),
      broker_verified_count: solutions.filter(s => s.supplier?.broker_verified).length
    },
    processing_time_ms: Date.now() - startTime
  });
}

/**
 * Calculate financial benefits of switching to a supplier
 */
async function handleCalculateSolutionBenefits(req, res, params, startTime) {
  const { supplier_id, user_profile } = params;

  if (!supplier_id || !user_profile) {
    return res.status(400).json({
      success: false,
      error: 'supplier_id and user_profile are required'
    });
  }

  const { data: supplier } = await supabase
    .from('partner_suppliers')
    .select('*')
    .eq('id', supplier_id)
    .single();

  if (!supplier) {
    return res.status(404).json({
      success: false,
      error: 'Supplier not found'
    });
  }

  const benefits = await calculateSupplierBenefits(supplier, user_profile);

  return res.status(200).json({
    success: true,
    supplier_id,
    benefits,
    processing_time_ms: Date.now() - startTime
  });
}

/**
 * Get pending introduction requests (for broker admin)
 */
async function handleGetIntroductionRequests(req, res, params, startTime) {
  const { status = 'pending', limit = 50 } = params;

  const { data: requests, error } = await supabase
    .from('supplier_introduction_requests')
    .select(`
      *,
      supplier:partner_suppliers(company_name, location, contact_person)
    `)
    .eq('status', status)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch introduction requests: ${error.message}`);
  }

  return res.status(200).json({
    success: true,
    requests,
    total_requests: requests.length,
    processing_time_ms: Date.now() - startTime
  });
}

/**
 * Update supplier performance metrics
 */
async function handleUpdateSupplierPerformance(req, res, params, startTime) {
  const { supplier_id, performance_data } = params;

  // Implementation placeholder - broker can update supplier performance
  return res.status(200).json({
    success: true,
    message: 'Performance update functionality coming soon',
    processing_time_ms: Date.now() - startTime
  });
}

/**
 * Calculate financial benefits of switching to a supplier
 */
async function calculateSupplierBenefits(supplier, userProfile) {
  if (!userProfile?.annualTradeVolume) {
    return {
      annual_savings: 0,
      net_benefit_percent: 0,
      pricing_impact: 0,
      tariff_savings: 0
    };
  }

  const annualVolume = userProfile.annualTradeVolume;
  const pricingPremium = supplier.pricing_premium_percent || 0;
  const tariffSavings = 25; // Assume 25% tariff avoidance with USMCA

  // Calculate costs
  const pricingIncrease = annualVolume * (pricingPremium / 100);
  const tariffSavingsAmount = annualVolume * (tariffSavings / 100);
  const netSavings = tariffSavingsAmount - pricingIncrease;
  const netBenefitPercent = (netSavings / annualVolume) * 100;

  return {
    annual_savings: Math.round(netSavings),
    net_benefit_percent: Math.round(netBenefitPercent * 100) / 100,
    pricing_impact: Math.round(pricingIncrease),
    tariff_savings: Math.round(tariffSavingsAmount),
    certification_time_days: supplier.usmca_certification_time_days || 21
  };
}

/**
 * Calculate match score for supplier relevance
 */
function calculateMatchScore(supplier, hsCode, userProfile) {
  let score = 0;

  // HS code relevance (40% weight)
  const hsChapter = hsCode.toString().substring(0, 4);
  if (supplier.hs_specialties?.includes(hsChapter)) {
    score += 40;
  }

  // Broker verification (30% weight)
  if (supplier.broker_verified) {
    score += 30;
  }

  // Pricing competitiveness (20% weight)
  const pricingPremium = supplier.pricing_premium_percent || 50;
  if (pricingPremium < 10) score += 20;
  else if (pricingPremium < 20) score += 15;
  else if (pricingPremium < 30) score += 10;

  // Track record (10% weight)
  if (supplier.successful_partnerships > 5) score += 10;
  else if (supplier.successful_partnerships > 0) score += 5;

  return score;
}

/**
 * Generate broker recommendation text
 */
function generateBrokerRecommendation(supplier) {
  const recommendations = [];
  
  if (supplier.broker_verified) {
    recommendations.push("✅ Personally verified by trade compliance expert");
  }
  
  if (supplier.pricing_premium_percent < 15) {
    recommendations.push("💰 Competitive pricing - low premium vs Chinese suppliers");
  }
  
  if (supplier.usmca_certification_time_days < 21) {
    recommendations.push("⚡ Fast USMCA certification process");
  }
  
  if (supplier.successful_partnerships > 3) {
    recommendations.push("🤝 Proven track record with successful partnerships");
  }

  return recommendations.length > 0 ? 
    recommendations.join(" • ") : 
    "Contact broker for detailed assessment";
}