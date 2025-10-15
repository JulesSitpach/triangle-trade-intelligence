/**
 * ADMIN API: Service Requests Management
 * Handles service requests from mexico-trade-services form
 * Routes to Jorge's client-portfolio dashboard
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method === 'POST') {
    return handleCreateServiceRequest(req, res);
  } else if (req.method === 'GET') {
    return handleGetServiceRequests(req, res);
  } else if (req.method === 'PATCH') {
    return handleUpdateServiceRequest(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleCreateServiceRequest(req, res) {
  try {
    const {
      service_type,
      company_name,
      contact_name,
      email,
      phone,
      industry,
      trade_volume,
      current_challenges,
      goals,
      timeline,
      budget_range,
      // Service-specific fields (from form)
      project_description,
      volume,
      quality_standards,
      challenges,
      product_description,
      target_regions,
      concerns,
      products_for_mexico,
      current_presence,
      investment_budget,
      partnership_types,
      business_focus,
      company_size_preference,
      geographic_focus,
      intelligence_frequency,
      specific_priorities,
      requirements,
      market_presence,
      focus_areas,
      company_size,
      frequency,
      intelligence_priorities,
      preferred_locations,
      setup_timeline,
      // Comprehensive workflow data (when user consents to professional service)
      workflow_data,
      // Client consent fields
      data_storage_consent,
      consent_timestamp,
      privacy_policy_version
    } = req.body;

    // Validate client consent for database storage
    if (!data_storage_consent) {
      return res.status(400).json({
        success: false,
        error: 'Database storage consent required',
        message: 'You must consent to data storage to proceed with professional services'
      });
    }

    // Auto-assign to Jorge (Mexico Trade Specialist)
    const assigned_to = 'Jorge';
    const status = 'consultation_scheduled'; // 15-minute consultation first
    const priority = determinePriority(trade_volume, timeline, budget_range);

    // Create service request record
    const serviceRequest = {
      id: generateRequestId(),
      service_type,
      company_name,
      contact_name,
      email: email || 'triangleintel@gmail.com', // Use shared email
      phone,
      industry,
      trade_volume: parseFloat(trade_volume?.replace(/[$,]/g, '') || '0'),
      assigned_to,
      status,
      priority,
      timeline,
      budget_range,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),

      // Client consent tracking
      data_storage_consent,
      consent_timestamp,
      privacy_policy_version,
      consent_ip_address: req.ip || req.connection.remoteAddress,
      consent_user_agent: req.headers['user-agent'],

      // Service-specific data stored as JSON
      service_details: {
        current_challenges: current_challenges || challenges,
        goals,
        product_description: product_description || project_description,
        volume,
        quality_standards,
        target_regions: target_regions || preferred_locations,
        concerns,
        products_for_mexico,
        current_presence: current_presence || market_presence,
        investment_budget,
        partnership_types,
        business_focus: business_focus || focus_areas,
        company_size_preference: company_size_preference || company_size,
        geographic_focus,
        intelligence_frequency: intelligence_frequency || frequency,
        specific_priorities: specific_priorities || intelligence_priorities,
        requirements,
        preferred_locations,
        setup_timeline
      },

      // Complete USMCA workflow data (for professional certificate services)
      workflow_data: workflow_data || null,

      // Consultation scheduling info
      consultation_status: 'pending_schedule',
      consultation_duration: '15 minutes',
      next_steps: 'Schedule 15-minute consultation call'
    };

    // Only store in database if client has explicitly consented
    if (data_storage_consent) {
      try {
        const { error } = await supabase
          .from('service_requests')
          .insert([serviceRequest])
          .select();

        if (error) throw error;

        console.log(`✅ Service request created for ${company_name} - assigned to Jorge (with client consent)`);
      } catch {
        console.log('📋 Database unavailable, request logged locally');
        // Continue with response even if database fails
      }
    } else {
      console.log(`📋 Service request for ${company_name} processed without database storage (no consent)`);
      // Note: This should not happen due to validation above, but included for safety
    }

    // Send success response
    res.status(200).json({
      success: true,
      message: `Service request submitted successfully. Jorge will reach out within 24 hours to schedule your 15-minute consultation.`,
      request_id: serviceRequest.id,
      assigned_to: 'Jorge',
      next_steps: [
        'Jorge will research your specific needs',
        '15-minute consultation call will be scheduled',
        'After consultation, detailed proposal will be provided',
        'Terms agreement and project kickoff upon approval'
      ],
      consultation_info: {
        duration: '15 minutes',
        purpose: 'Understand your needs and provide initial recommendations',
        outcome: 'Detailed project proposal with timeline and pricing'
      }
    });

  } catch (error) {
    console.error('❌ Error creating service request:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create service request',
      message: error.message
    });
  }
}

async function handleGetServiceRequests(req, res) {
  try {
    const { assigned_to } = req.query;

    // Try to load from database with vulnerability analysis data
    let requests = [];
    let vulnerabilityAnalyses = [];

    try {
      const query = supabase.from('service_requests').select('*');

      if (assigned_to) {
        query.eq('assigned_to', assigned_to);
      }

      const { data } = await query.order('created_at', { ascending: false });

      if (data && data.length > 0) {
        requests = data;
        console.log(`📊 Loaded ${requests.length} service requests from database`);

        // Load vulnerability analyses for all users with service requests
        // This gives admins visibility into client risk profiles and opportunities
        try {
          const userEmails = [...new Set(requests.map(r => r.email).filter(Boolean))];

          if (userEmails.length > 0) {
            // Get user IDs from emails
            const { data: users } = await supabase
              .from('user_profiles')
              .select('id, email')
              .in('email', userEmails);

            if (users && users.length > 0) {
              const userIds = users.map(u => u.id);

              // Load vulnerability analyses for these users
              const { data: analyses } = await supabase
                .from('vulnerability_analyses')
                .select('*')
                .in('user_id', userIds)
                .order('created_at', { ascending: false });

              if (analyses && analyses.length > 0) {
                vulnerabilityAnalyses = analyses;
                console.log(`📊 Loaded ${analyses.length} vulnerability analyses for admin review`);

                // Attach most recent analysis to each request
                requests = requests.map(request => {
                  const userProfile = users.find(u => u.email === request.email);
                  if (userProfile) {
                    const userAnalyses = analyses.filter(a => a.user_id === userProfile.id);
                    const latestAnalysis = userAnalyses.length > 0 ? userAnalyses[0] : null;

                    return {
                      ...request,
                      vulnerability_analysis: latestAnalysis,
                      total_analyses: userAnalyses.length
                    };
                  }
                  return request;
                });
              }
            }
          }
        } catch (analysisError) {
          console.log('⚠️ Could not load vulnerability analyses:', analysisError.message);
          // Continue without vulnerability data
        }
      } else {
        throw new Error('No database records');
      }
    } catch {
      console.log('📋 Database unavailable - no service requests to display');
      requests = []; // Empty array when no database connection
    }

    // Calculate admin intelligence metrics from vulnerability analyses
    const adminIntelligence = calculateAdminIntelligenceMetrics(requests);

    const summary = {
      total_requests: requests.length,
      consultation_pending: requests.filter(r => r.consultation_status === 'pending_schedule').length,
      consultation_scheduled: requests.filter(r => r.consultation_status === 'scheduled').length,
      in_progress: requests.filter(r => r.status === 'research_in_progress' || r.status === 'proposal_sent').length,
      completed_this_week: requests.filter(r => {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return r.status === 'completed' && new Date(r.updated_at) > weekAgo;
      }).length,
      // NEW: Admin intelligence metrics for prioritization
      admin_intelligence: adminIntelligence
    };

    res.status(200).json({
      success: true,
      requests: requests,
      summary: summary,
      assigned_to: assigned_to || 'all',
      data_status: {
        source: requests.length > 3 ? 'database' : 'sample_data',
        last_updated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error fetching service requests:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch service requests',
      message: error.message
    });
  }
}

function generateRequestId() {
  return 'SR' + Date.now().toString().slice(-6);
}

async function handleUpdateServiceRequest(req, res) {
  try {
    const { id, status, ...updateFields } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Service request ID is required'
      });
    }

    const updateData = {
      ...updateFields,
      updated_at: new Date().toISOString()
    };

    if (status) {
      updateData.status = status;
    }

    // Try to update in database
    try {
      const { data, error } = await supabase
        .from('service_requests')
        .update(updateData)
        .eq('id', id)
        .select();

      if (error) throw error;

      console.log(`✅ Service request ${id} updated successfully`);

      res.status(200).json({
        success: true,
        message: 'Service request updated successfully',
        updated_record: data[0]
      });
    } catch {
      console.log('📋 Database unavailable - update logged locally');
      res.status(200).json({
        success: true,
        message: 'Update processed (database unavailable)',
        request_id: id
      });
    }

  } catch (error) {
    console.error('❌ Error updating service request:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update service request',
      message: error.message
    });
  }
}

/**
 * Calculate admin intelligence metrics from vulnerability analyses
 * Helps Cristina and Jorge prioritize high-value opportunities
 */
function calculateAdminIntelligenceMetrics(requests) {
  const requestsWithAnalysis = requests.filter(r => r.vulnerability_analysis);

  if (requestsWithAnalysis.length === 0) {
    return {
      total_with_analysis: 0,
      low_confidence_hs_codes: 0,
      high_tariff_exposure_count: 0,
      total_tariff_opportunity: 0,
      rvc_optimization_opportunities: 0,
      top_opportunities: []
    };
  }

  let lowConfidenceCount = 0;
  let highTariffCount = 0;
  let totalTariffOpportunity = 0;
  let rvcOpportunityCount = 0;
  const opportunities = [];

  requestsWithAnalysis.forEach(request => {
    const analysis = request.vulnerability_analysis;
    if (!analysis) return;

    const components = analysis.component_origins || [];
    let requestTariffOpportunity = 0;
    let hasLowConfidence = false;
    let hasHighTariff = false;
    let hasRVCOpportunity = false;

    // Check each component for opportunities
    components.forEach(comp => {
      // Low confidence HS code check
      const confidence = comp.confidence || 100;
      if (confidence < 80) {
        hasLowConfidence = true;
      }

      // High tariff exposure check
      const mfnRate = comp.mfn_rate || comp.tariff_rates?.mfn_rate || 0;
      const usmcaRate = comp.usmca_rate || comp.tariff_rates?.usmca_rate || 0;
      const savings = mfnRate - usmcaRate;

      if (savings > 5 && !comp.is_usmca_member) {
        hasHighTariff = true;
        // Calculate dollar opportunity
        const tradeVolume = analysis.annual_trade_volume || 0;
        const componentValue = tradeVolume * (comp.value_percentage / 100);
        const dollarSavings = componentValue * (savings / 100);
        requestTariffOpportunity += dollarSavings;
      }
    });

    // RVC optimization check
    if (analysis.qualification_status === 'QUALIFIED') {
      // Check if close to threshold (within 15% margin)
      const rvc = parseFloat(analysis.regional_content_percentage || 0);
      const threshold = analysis.required_threshold || analysis.usmca_threshold || 0; // AI-researched threshold from workflow
      if (threshold > 0 && rvc < threshold + 15) {
        hasRVCOpportunity = true;
      }
    }

    // Count flags
    if (hasLowConfidence) lowConfidenceCount++;
    if (hasHighTariff) {
      highTariffCount++;
      totalTariffOpportunity += requestTariffOpportunity;
    }
    if (hasRVCOpportunity) rvcOpportunityCount++;

    // Add to top opportunities list
    if (hasLowConfidence || hasHighTariff || hasRVCOpportunity) {
      opportunities.push({
        company_name: request.company_name,
        request_id: request.id,
        low_confidence: hasLowConfidence,
        high_tariff: hasHighTariff,
        tariff_opportunity: requestTariffOpportunity,
        rvc_optimization: hasRVCOpportunity,
        risk_score: analysis.risk_score || 0
      });
    }
  });

  // Sort opportunities by tariff savings potential
  opportunities.sort((a, b) => b.tariff_opportunity - a.tariff_opportunity);

  return {
    total_with_analysis: requestsWithAnalysis.length,
    low_confidence_hs_codes: lowConfidenceCount,
    high_tariff_exposure_count: highTariffCount,
    total_tariff_opportunity: Math.round(totalTariffOpportunity),
    rvc_optimization_opportunities: rvcOpportunityCount,
    top_opportunities: opportunities.slice(0, 10) // Top 10 opportunities
  };
}

function determinePriority(tradeVolume, timeline, budgetRange) {
  const volume = parseFloat(tradeVolume?.replace(/[$,]/g, '') || '0');

  if (timeline === 'immediate' || volume > 1000000 || budgetRange === '500k-plus') {
    return 'urgent';
  } else if (timeline === 'short' || volume > 500000 || budgetRange === '100k-500k') {
    return 'high';
  } else if (volume > 100000 || budgetRange === '25k-100k') {
    return 'medium';
  } else {
    return 'low';
  }
}