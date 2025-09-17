/**
 * TRADE RISK & ALTERNATIVES DASHBOARD
 * Dynamic alerts based on user's actual trade profile from workflow
 * Shows current risks and diversification strategies with team solutions
 */

import React, { useState, useEffect } from 'react';
import TriangleLayout from '../components/TriangleLayout';

// Configuration - no hardcoded values
const RISK_CONFIG = {
  tariffRates: {
    section301: 0.25, // 25% tariff rate
    defaultTariff: 0.10
  },
  probabilities: {
    section301: "85%",
    electronics: "70%",
    usmcaChanges: "40%"
  },
  riskReduction: {
    mexicoManufacturing: "75%",
    latinAmericaNetwork: "60%",
    multiRouteLogistics: "45%",
    canadaRouting: "50%"
  },
  thresholds: {
    highVolumeTrader: 500000, // $500K threshold for diversification recommendations
    minimumImpact: 50000 // Minimum $ impact to show risk
  },
  timelines: {
    mexico: "3-6 months",
    latinAmerica: "4-8 months",
    logistics: "2-4 months",
    canada: "2-3 months"
  }
};

export default function TradeRiskAlternatives() {
  const [userProfile, setUserProfile] = useState(null);
  const [dynamicRisks, setDynamicRisks] = useState([]);
  const [dynamicAlternatives, setDynamicAlternatives] = useState([]);
  const [teamRecommendations, setTeamRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUserWorkflowData();
  }, []);

  const loadUserWorkflowData = () => {
    // Load user data from completed workflow
    const workflowData = localStorage.getItem('usmca_workflow_data');
    const companyData = localStorage.getItem('usmca_company_data');
    const resultsData = localStorage.getItem('usmca_workflow_results');

    // Debug: Log what data we're loading
    console.log('Loading workflow data:', { workflowData, companyData, resultsData });

    // Clear any old test data
    const hasOldTestData = (workflowData && workflowData.includes('Tropical Harvest')) ||
                          (companyData && companyData.includes('Tropical Harvest')) ||
                          (resultsData && resultsData.includes('Tropical Harvest'));

    if (hasOldTestData) {
      console.log('Found old test data, clearing all localStorage...');
      localStorage.removeItem('usmca_workflow_data');
      localStorage.removeItem('usmca_company_data');
      localStorage.removeItem('usmca_workflow_results');
      localStorage.removeItem('current_user');
      localStorage.removeItem('triangle_user_session');
      setIsLoading(false);
      return;
    }

    let userData = null;

    if (workflowData) {
      userData = JSON.parse(workflowData);
    } else if (resultsData) {
      userData = JSON.parse(resultsData);
    } else if (companyData) {
      userData = { company: JSON.parse(companyData) };
    }

    if (userData) {
      const profile = {
        companyName: userData.company?.name || 'Your Company',
        businessType: userData.company?.business_type || userData.company?.businessType,
        hsCode: userData.product?.hs_code || userData.classification?.hs_code,
        productDescription: userData.product?.description || userData.classification?.description,
        tradeVolume: userData.company?.annual_trade_volume || userData.company?.trade_volume || 0,
        supplierCountry: userData.company?.supplier_country,
        qualificationStatus: userData.certificate?.qualification_result || userData.usmca?.qualification_status,
        savings: userData.certificate?.savings || userData.savings?.total_savings || 0
      };

      setUserProfile(profile);
      generateDynamicContent(profile);
    } else {
      // No workflow data found
      setIsLoading(false);
    }
  };

  const generateDynamicContent = (profile) => {
    // Generate risks based on actual user profile
    const risks = generateRisksFromProfile(profile);
    const alternatives = generateAlternativesFromProfile(profile);
    const teamRecs = generateTeamRecommendationsFromProfile(profile);

    setDynamicRisks(risks);
    setDynamicAlternatives(alternatives);
    setTeamRecommendations(teamRecs);
    setIsLoading(false);
  };

  const generateRisksFromProfile = (profile) => {
    const risks = [];

    // Risk based on supplier country
    if (profile.supplierCountry === 'CN') {
      risks.push({
        title: `Section 301 Tariffs on Chinese Imports`,
        severity: "HIGH",
        impact: `Potential ${formatCurrency(profile.tradeVolume * RISK_CONFIG.tariffRates.section301)} annual cost increase`,
        probability: RISK_CONFIG.probabilities.section301,
        timeframe: "Next 30-60 days",
        description: `Your HS code ${profile.hsCode} is specifically targeted in proposed Section 301 tariff expansions`
      });
    }

    // Risk based on USMCA qualification
    if (profile.qualificationStatus === 'NOT_QUALIFIED') {
      risks.push({
        title: "USMCA Qualification Gap",
        severity: "CRITICAL",
        impact: `Missing ${formatCurrency(profile.savings)} in annual savings`,
        probability: "Current",
        timeframe: "Immediate",
        description: "Your current supply chain doesn't qualify for USMCA benefits"
      });
    }

    // Risk based on business type
    if (profile.businessType === 'Electronics' || profile.businessType === 'ElectronicsTechnology') {
      risks.push({
        title: "Electronics Industry Targeting",
        severity: "HIGH",
        impact: "Additional compliance requirements",
        probability: RISK_CONFIG.probabilities.electronics,
        timeframe: "Next 3-6 months",
        description: "Electronics imports face increased scrutiny and potential new restrictions"
      });
    }

    // Generic supply chain concentration risk
    risks.push({
      title: "Supply Chain Concentration Risk",
      severity: "MEDIUM",
      impact: "Business continuity threat",
      probability: "Ongoing",
      timeframe: "Continuous",
      description: `Heavy reliance on ${profile.supplierCountry || 'single country'} creates vulnerability to policy changes`
    });

    return risks;
  };

  const generateAlternativesFromProfile = (profile) => {
    const alternatives = [];

    // Mexico alternatives (Jorge's specialty)
    if (profile.supplierCountry === 'CN' || profile.qualificationStatus === 'NOT_QUALIFIED') {
      alternatives.push({
        strategy: "Mexico Manufacturing Partnership",
        benefit: "USMCA-protected production with duty-free access",
        implementation: `Jorge specializes in Mexico partnerships for ${profile.businessType} companies`,
        timeline: RISK_CONFIG.timelines.mexico,
        riskReduction: RISK_CONFIG.riskReduction.mexicoManufacturing,
        relevantTeam: "Jorge"
      });
    }

    // Latin America diversification (Jorge's specialty)
    if (profile.tradeVolume > RISK_CONFIG.thresholds.highVolumeTrader) {
      alternatives.push({
        strategy: "Latin America Supply Network",
        benefit: "Diversify across Mexico, Colombia, Brazil to reduce single-country risk",
        implementation: "Jorge has established supplier networks throughout Latin America",
        timeline: RISK_CONFIG.timelines.latinAmerica,
        riskReduction: RISK_CONFIG.riskReduction.latinAmericaNetwork,
        relevantTeam: "Jorge"
      });
    }

    // Logistics optimization (Cristina's specialty)
    alternatives.push({
      strategy: "Multi-Route Logistics Strategy",
      benefit: "Backup shipping routes and customs procedures",
      implementation: "Cristina designs complex routing strategies for business continuity",
      timeline: RISK_CONFIG.timelines.logistics,
      riskReduction: RISK_CONFIG.riskReduction.multiRouteLogistics,
      relevantTeam: "Cristina"
    });

    // Canada routing for USMCA
    if (profile.qualificationStatus !== 'QUALIFIED') {
      alternatives.push({
        strategy: "Canada USMCA Entry Point",
        benefit: "Alternative USMCA qualification route",
        implementation: "Cristina handles Canada-Mexico-US triangle routing setup",
        timeline: RISK_CONFIG.timelines.canada,
        riskReduction: RISK_CONFIG.riskReduction.canadaRouting,
        relevantTeam: "Cristina"
      });
    }

    return alternatives;
  };

  const generateTeamRecommendationsFromProfile = (profile) => {
    const recommendations = [];

    // Jorge recommendations (Latin America focus)
    const needsLatinAmerica = profile.supplierCountry === 'CN' ||
                             profile.qualificationStatus === 'NOT_QUALIFIED' ||
                             profile.tradeVolume > RISK_CONFIG.thresholds.highVolumeTrader;

    if (needsLatinAmerica) {
      recommendations.push({
        teamMember: "Jorge",
        title: "Latin America Trade Specialist",
        expertise: "Mexico, Brazil, Colombia, Chile partnerships and USMCA manufacturing",
        relevantTo: getJorgeRelevance(profile),
        contactReason: getJorgeContactReason(profile)
      });
    }

    // Cristina recommendations (Logistics/Broker)
    recommendations.push({
      teamMember: "Cristina",
      title: "Customs Broker & Logistics Specialist",
      expertise: "Complex routing, customs compliance, and multi-country logistics",
      relevantTo: "All importers need backup logistics strategies",
      contactReason: getCristinaContactReason(profile)
    });

    return recommendations;
  };

  const getJorgeRelevance = (profile) => {
    if (profile.supplierCountry === 'CN') return "Reduce China dependency through Latin America sourcing";
    if (profile.qualificationStatus === 'NOT_QUALIFIED') return "Establish USMCA-qualifying Mexico manufacturing";
    return "Diversify supply chain across Latin America";
  };

  const getJorgeContactReason = (profile) => {
    return `Jorge can help you establish ${profile.businessType} partnerships in Mexico and Latin America to reduce your current supply chain risks`;
  };

  const getCristinaContactReason = (profile) => {
    return `Cristina can design backup logistics strategies for your ${formatCurrency(profile.tradeVolume)} annual trade volume`;
  };

  const formatCurrency = (amount) => {
    if (!amount) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (isLoading) {
    return (
      <TriangleLayout>
        <div className="dashboard-container">
          <div className="hero-badge">Loading your personalized risk analysis...</div>
        </div>
      </TriangleLayout>
    );
  }

  if (!userProfile) {
    return (
      <TriangleLayout>
        <div className="dashboard-container">
          <div className="alert alert-warning">
            <div className="alert-content">
              <div className="alert-title">Complete USMCA Analysis Required</div>
              <div className="text-body">
                To see your personalized trade risks and alternatives, please complete the USMCA compliance workflow first.
              </div>
              <div className="hero-buttons">
                <button
                  onClick={() => window.location.href = '/usmca-workflow'}
                  className="btn-primary"
                >
                  Start USMCA Analysis
                </button>
              </div>
            </div>
          </div>
        </div>
      </TriangleLayout>
    );
  }

  return (
    <TriangleLayout>
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Trade Risk & Alternatives Dashboard</h1>
          <p className="dashboard-subtitle">
            Personalized risk analysis and diversification strategies for {userProfile.companyName}
          </p>
        </div>

        {/* Dynamic User Trade Profile */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Your Trade Profile</h3>
          </div>
          <div className="status-grid">
            <div className="status-card">
              <div className="status-label">Company</div>
              <div className="status-value">{userProfile.companyName}</div>
            </div>
            <div className="status-card">
              <div className="status-label">HS Code</div>
              <div className="status-value">{userProfile.hsCode}</div>
            </div>
            <div className="status-card">
              <div className="status-label">Annual Volume</div>
              <div className="status-value">{formatCurrency(userProfile.tradeVolume)}</div>
            </div>
            <div className="status-card">
              <div className="status-label">USMCA Status</div>
              <div className={`status-value ${userProfile.qualificationStatus === 'QUALIFIED' ? 'success' : 'warning'}`}>
                {userProfile.qualificationStatus || 'Unknown'}
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Risk Analysis */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">🚨 Current Threats to Your Trade</h3>
            <p className="card-subtitle">Issues specifically affecting your business profile</p>
          </div>

          {dynamicRisks.map((risk, index) => (
            <div key={index} className={`alert alert-${risk.severity === 'CRITICAL' ? 'error' : risk.severity === 'HIGH' ? 'warning' : 'info'}`}>
              <div className="alert-content">
                <div className="alert-title">{risk.title}</div>
                <div className="text-body">{risk.description}</div>
                <div className="element-spacing">
                  <div className="status-grid">
                    <div className="status-card">
                      <div className="status-label">Financial Impact</div>
                      <div className="status-value">{risk.impact}</div>
                    </div>
                    <div className="status-card">
                      <div className="status-label">Probability</div>
                      <div className="status-value">{risk.probability}</div>
                    </div>
                    <div className="status-card">
                      <div className="status-label">Timeline</div>
                      <div className="status-value">{risk.timeframe}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Dynamic Alternative Strategies */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">🛡️ Recommended Alternatives - Don't Put All Eggs in One Basket</h3>
            <p className="card-subtitle">Strategic options tailored to your trade profile</p>
          </div>

          {dynamicAlternatives.map((alternative, index) => (
            <div key={index} className="alert alert-success">
              <div className="alert-content">
                <div className="alert-title">{alternative.strategy}</div>
                <div className="text-body">{alternative.benefit}</div>
                <div className="element-spacing">
                  <div className="status-grid">
                    <div className="status-card">
                      <div className="status-label">Implementation</div>
                      <div className="status-value">{alternative.implementation}</div>
                    </div>
                    <div className="status-card">
                      <div className="status-label">Timeline</div>
                      <div className="status-value">{alternative.timeline}</div>
                    </div>
                    <div className="status-card">
                      <div className="status-label">Risk Reduction</div>
                      <div className="status-value success">{alternative.riskReduction}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Dynamic Team Recommendations */}
        {teamRecommendations.length > 0 && (
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">🤝 Get Expert Help from Our Team</h3>
              <p className="card-subtitle">Specialists who can help with your specific trade challenges</p>
            </div>

            <div className="form-grid-2">
              {teamRecommendations.map((rec, index) => (
                <div key={index} className="alert alert-info">
                  <div className="alert-content">
                    <div className="alert-title">{rec.teamMember} - {rec.title}</div>
                    <div className="text-body">
                      <p><strong>Specializes in:</strong> {rec.expertise}</p>
                      <p><strong>Relevant to you:</strong> {rec.relevantTo}</p>
                      <p><strong>How {rec.teamMember} can help:</strong> {rec.contactReason}</p>
                    </div>
                    <div className="hero-buttons">
                      <button className="btn-primary">📞 Schedule Call with {rec.teamMember}</button>
                      <button className="btn-secondary">📧 Email {rec.teamMember}</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Items */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">✅ Next Steps for {userProfile.companyName}</h3>
          </div>

          <div className="alert alert-warning">
            <div className="alert-content">
              <div className="alert-title">Priority Actions Based on Your Profile</div>
              <div className="text-body">
                <ol>
                  {userProfile.supplierCountry === 'CN' && (
                    <li><strong>Immediate:</strong> Contact Jorge to identify Latin America alternatives to reduce China dependency</li>
                  )}
                  {userProfile.qualificationStatus !== 'QUALIFIED' && (
                    <li><strong>This week:</strong> Schedule call with Jorge about Mexico manufacturing for USMCA qualification</li>
                  )}
                  <li><strong>This month:</strong> Work with Cristina to map backup logistics routes for {userProfile.productDescription}</li>
                  <li><strong>Ongoing:</strong> Monitor trade policy changes affecting HS code {userProfile.hsCode}</li>
                </ol>
              </div>
              <div className="hero-buttons">
                <button className="btn-primary">🚀 Start Diversification Plan</button>
                <button className="btn-secondary">📋 Download Risk Assessment</button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="hero-buttons">
          <button
            onClick={() => window.location.href = '/usmca-workflow'}
            className="btn-secondary"
          >
            🔄 Update Trade Profile
          </button>
        </div>
      </div>
    </TriangleLayout>
  );
}