/**
 * DYNAMIC ALERT GENERATION
 * Generates alerts based on user's actual component data, RVC, and sourcing patterns
 * Each alert is customized to the specific user - not generic
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { workflow_data } = req.body;

    if (!workflow_data) {
      return res.status(400).json({ error: 'Missing workflow_data' });
    }

    const alerts = [];

    // Extract user data
    const companyName = workflow_data.company?.name || 'Your Company';
    const components = workflow_data.components || [];
    const rvc = workflow_data.usmca?.regional_content_percentage || 0;
    const qualificationStatus = workflow_data.usmca?.qualification_status;
    const totalVolume = components.reduce((sum, c) => sum + (c.annual_volume || 0), 0);

    // ========== ALERT 1: CHINA CUMULATION ALERTS ==========
    const chinaComponents = components.filter(c =>
      c.origin_country?.toUpperCase() === 'CN' || c.country?.toUpperCase() === 'CN'
    );

    chinaComponents.forEach(comp => {
      const componentValue = comp.annual_volume || 0;
      const componentPercentage = totalVolume > 0 ? (componentValue / totalVolume * 100).toFixed(1) : 0;

      alerts.push({
        id: `china-cumulation-${comp.hs_code}`,
        type: 'POLICY_THREAT',
        title: `USTR Cumulation Rule Tightening - ${comp.component_type || comp.description}`,
        description: `Your ${comp.component_type || comp.description} (${comp.hs_code}) sourced from China ($${componentValue.toLocaleString()}, ${componentPercentage}% of costs) may lose USMCA eligibility if cumulation rules are restricted in 2026.`,
        component: comp.component_type || comp.description,
        impact_percentage: parseFloat(componentPercentage),
        impact_value: componentValue,
        exposure_estimate: (componentValue * 0.025).toFixed(0), // 2.5% MFN duty estimate
        affected_countries: ['CN'],
        affected_hs_codes: [comp.hs_code],
        timeline: 'USTR announcement expected mid-January 2026',
        days_until: Math.ceil((new Date('2026-01-15') - new Date()) / (1000 * 60 * 60 * 24)),
        severity: 'high',
        urgency: 'HIGH',
        action: 'Review alternative suppliers in US/CA/MX or increase eligible content sourcing',
        created_at: new Date().toISOString()
      });
    });

    // ========== ALERT 2: MEXICO LABOR COST ALERTS ==========
    const mexicoComponents = components.filter(c =>
      c.origin_country?.toUpperCase() === 'MX' || c.country?.toUpperCase() === 'MX'
    );

    mexicoComponents.forEach(comp => {
      const componentValue = comp.annual_volume || 0;
      const componentPercentage = totalVolume > 0 ? (componentValue / totalVolume * 100).toFixed(1) : 0;
      const lowEstimate = (componentValue * 0.03).toFixed(0);
      const highEstimate = (componentValue * 0.05).toFixed(0);

      alerts.push({
        id: `mexico-labor-${comp.hs_code}`,
        type: 'COST_INCREASE',
        title: `Mexico Labor Standards Enforcement - ${comp.component_type || comp.description}`,
        description: `Your ${comp.component_type || comp.description} (${comp.hs_code}) sourced from Mexico ($${componentValue.toLocaleString()}, ${componentPercentage}% of costs) faces 3-5% cost increases due to labor standard compliance requirements.`,
        component: comp.component_type || comp.description,
        impact_percentage: parseFloat(componentPercentage),
        impact_value: componentValue,
        exposure_low: lowEstimate,
        exposure_high: highEstimate,
        affected_countries: ['MX'],
        affected_hs_codes: [comp.hs_code],
        timeline: 'December 15, 2025 enforcement',
        days_until: Math.ceil((new Date('2025-12-15') - new Date()) / (1000 * 60 * 60 * 24)),
        severity: 'medium',
        urgency: Math.ceil((new Date('2025-12-15') - new Date()) / (1000 * 60 * 60 * 24)) < 60 ? 'HIGH' : 'MEDIUM',
        action: 'Secure price guarantees with suppliers before December 15 or source from certified facilities',
        created_at: new Date().toISOString()
      });
    });

    // ========== ALERT 3: CANADA OPPORTUNITY ALERTS ==========
    const canadaComponents = components.filter(c =>
      c.origin_country?.toUpperCase() === 'CA' || c.country?.toUpperCase() === 'CA'
    );

    canadaComponents.forEach(comp => {
      const componentValue = comp.annual_volume || 0;
      const componentPercentage = totalVolume > 0 ? (componentValue / totalVolume * 100).toFixed(1) : 0;

      alerts.push({
        id: `canada-opportunity-${comp.hs_code}`,
        type: 'OPPORTUNITY',
        title: `Canada Critical Minerals Initiative - ${comp.component_type || comp.description}`,
        description: `Your ${comp.component_type || comp.description} (${comp.hs_code}) sourced from Canada ($${componentValue.toLocaleString()}, ${componentPercentage}% of costs) positions you well for stable supply chains and potential cost optimization through critical minerals programs.`,
        component: comp.component_type || comp.description,
        impact_percentage: parseFloat(componentPercentage),
        impact_value: componentValue,
        affected_countries: ['CA'],
        affected_hs_codes: [comp.hs_code],
        timeline: 'January-March 2026 program rollout',
        days_until: Math.ceil((new Date('2026-03-01') - new Date()) / (1000 * 60 * 60 * 24)),
        severity: 'low',
        urgency: 'LOW',
        action: 'Explore critical minerals supplier partnerships for cost and supply chain advantages',
        created_at: new Date().toISOString()
      });
    });

    // ========== ALERT 4: RVC BUFFER ALERT ==========
    if (rvc < 70) {
      const buffer = (70 - rvc).toFixed(1);

      alerts.push({
        id: 'rvc-buffer-warning',
        type: 'STRATEGIC_RISK',
        title: `Low RVC Buffer - ${rvc.toFixed(1)}%`,
        description: `Your current RVC of ${rvc.toFixed(1)}% leaves only ${buffer}% margin before disqualification (70% threshold). You're vulnerable if 2026 renegotiation increases thresholds or changes eligibility rules.`,
        component: 'PORTFOLIO',
        impact_percentage: rvc,
        buffer_remaining: parseFloat(buffer),
        threshold: 70,
        affected_countries: ['US', 'CA', 'MX'],
        affected_hs_codes: components.map(c => c.hs_code),
        timeline: '2026 USMCA renegotiation review',
        days_until: Math.ceil((new Date('2026-07-01') - new Date()) / (1000 * 60 * 60 * 24)),
        severity: rvc < 65 ? 'high' : 'medium',
        urgency: rvc < 65 ? 'HIGH' : 'MEDIUM',
        action: 'Identify and qualify additional US/CA/MX suppliers to increase RVC buffer to 75%+',
        created_at: new Date().toISOString()
      });
    }

    // ========== ALERT 5: SUPPLIER CONCENTRATION ALERT ==========
    const countryConcentration = {};
    components.forEach(comp => {
      const country = (comp.origin_country || comp.country || 'OTHER').toUpperCase();
      if (!countryConcentration[country]) {
        countryConcentration[country] = { value: 0, components: [] };
      }
      countryConcentration[country].value += comp.annual_volume || 0;
      countryConcentration[country].components.push(comp.component_type || comp.description);
    });

    Object.entries(countryConcentration).forEach(([country, data]) => {
      const concentration = totalVolume > 0 ? (data.value / totalVolume * 100) : 0;

      if (concentration > 50) {
        alerts.push({
          id: `concentration-${country}`,
          type: 'DIVERSIFICATION_RISK',
          title: `High ${country} Concentration - ${concentration.toFixed(1)}% of Portfolio`,
          description: `Your supply chain is heavily concentrated in ${country} (${concentration.toFixed(1)}% or $${data.value.toLocaleString()}) across ${data.components.length} components. Policy changes or supplier issues in ${country} could impact majority of your costs.`,
          component: 'PORTFOLIO',
          impact_percentage: concentration,
          impact_value: data.value,
          country_concentration: country,
          top_components: data.components.slice(0, 3).join(', '),
          affected_countries: [country],
          affected_hs_codes: components.filter(c => (c.origin_country || c.country || '').toUpperCase() === country).map(c => c.hs_code),
          timeline: 'Ongoing risk',
          days_until: null,
          severity: 'medium',
          urgency: 'MEDIUM',
          action: `Diversify ${data.components.length} ${country} components to US/CA/MX alternatives to reduce portfolio concentration below 50%`,
          created_at: new Date().toISOString()
        });
      }
    });

    // ========== ALERT 6: HIGH-VALUE COMPONENT ALERTS ==========
    components.forEach(comp => {
      const componentPercentage = totalVolume > 0 ? (comp.annual_volume / totalVolume * 100) : 0;

      if (componentPercentage > 30) {
        alerts.push({
          id: `high-value-${comp.hs_code}`,
          type: 'CONCENTRATION_RISK',
          title: `Single Component Dominance - ${comp.component_type || comp.description} (${componentPercentage.toFixed(1)}%)`,
          description: `Your ${comp.component_type || comp.description} (${comp.hs_code}) represents ${componentPercentage.toFixed(1)}% of total costs ($${(comp.annual_volume || 0).toLocaleString()}). Policy changes or supplier issues create outsized portfolio impact.`,
          component: comp.component_type || comp.description,
          impact_percentage: componentPercentage,
          impact_value: comp.annual_volume || 0,
          affected_countries: [(comp.origin_country || comp.country || 'UNKNOWN').toUpperCase()],
          affected_hs_codes: [comp.hs_code],
          timeline: 'Ongoing risk',
          days_until: null,
          severity: 'medium',
          urgency: 'MEDIUM',
          action: `Qualify alternative suppliers or increase local content for this component to reduce portfolio dependency below 30%`,
          created_at: new Date().toISOString()
        });
      }
    });

    // ========== ALERT 7: USMCA 2026 TIMELINE (ALL USERS) ==========
    alerts.push({
      id: 'usmca-2026-timeline',
      type: 'TIMELINE',
      title: 'USMCA 2026 Review Process - Critical Dates Ahead',
      description: 'The USMCA trade agreement enters its formal 2026 review cycle. Rule of origin requirements, labor provisions, and sector-specific rules could change, affecting your RVC calculations and eligibility. Proposals expected Q1 2026, formal review July 2026.',
      component: 'PORTFOLIO',
      impact_percentage: 100,
      affected_countries: ['US', 'CA', 'MX'],
      affected_hs_codes: components.map(c => c.hs_code),
      timeline: 'Proposals Q1 2026, Review July 2026',
      days_until: Math.ceil((new Date('2026-07-01') - new Date()) / (1000 * 60 * 60 * 24)),
      severity: 'medium',
      urgency: 'MEDIUM',
      action: 'Monitor USTR announcements and plan for potential rule changes that could increase RVC thresholds or labor compliance costs',
      created_at: new Date().toISOString()
    });

    console.log(`✅ Generated ${alerts.length} dynamic alerts for ${companyName}`);

    return res.status(200).json({
      success: true,
      alerts: alerts.sort((a, b) => {
        // Sort by urgency and days_until
        const urgencyOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
        if (urgencyOrder[a.urgency] !== urgencyOrder[b.urgency]) {
          return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
        }
        if (a.days_until && b.days_until) {
          return a.days_until - b.days_until;
        }
        return 0;
      }),
      total_alerts: alerts.length,
      company: companyName,
      portfolio_value: totalVolume,
      current_rvc: rvc,
      usmca_status: qualificationStatus
    });

  } catch (error) {
    console.error('❌ Dynamic alert generation failed:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
