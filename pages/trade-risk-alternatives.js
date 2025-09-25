/**
 * TRADE RISK & ALTERNATIVES DASHBOARD
 * Dynamic alerts based on user's actual trade profile from workflow
 * Shows current risks and diversification strategies with team solutions
 */

import React, { useState, useEffect } from 'react';
import TriangleLayout from '../components/TriangleLayout';
import { useAuth } from '../lib/contexts/ProductionAuthContext';

// Import configuration from centralized config file
import TRADE_RISK_CONFIG, {
  calculateRiskImpact,
  formatCurrency
} from '../config/trade-risk-config';

export default function TradeRiskAlternatives() {
  const [userProfile, setUserProfile] = useState(null);
  const [dynamicRisks, setDynamicRisks] = useState([]);
  const [dynamicAlternatives, setDynamicAlternatives] = useState([]);
  const [teamRecommendations, setTeamRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDetailedConsent, setShowDetailedConsent] = useState(false);
  const [hasDetailedConsent, setHasDetailedConsent] = useState(false);
  const [expandedDetails, setExpandedDetails] = useState({});
  const { user } = useAuth();

  useEffect(() => {
    loadUserData();
    // Check if user has given detailed consent before
    const consent = localStorage.getItem('detailed_alerts_consent');
    setHasDetailedConsent(consent === 'true');
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSeeMoreDetails = (riskIndex) => {
    if (!hasDetailedConsent) {
      setShowDetailedConsent(true);
      return;
    }

    setExpandedDetails(prev => ({
      ...prev,
      [riskIndex]: !prev[riskIndex]
    }));
  };

  const handleDetailedConsent = (granted) => {
    setHasDetailedConsent(granted);
    localStorage.setItem('detailed_alerts_consent', granted.toString());

    if (granted) {
      setShowDetailedConsent(false);
      // Show details for all risks
      const allExpanded = {};
      dynamicRisks.forEach((_, index) => {
        allExpanded[index] = true;
      });
      setExpandedDetails(allExpanded);
    } else {
      setShowDetailedConsent(false);
    }
  };

  const loadUserData = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      // Try to load from database first (persistent trade profile)
      const { data: tradeProfile } = await fetch('/api/trade-profile', {
        headers: {
          'Authorization': `Bearer ${user.session?.access_token}`
        }
      }).then(res => res.json()).catch(() => ({ data: null }));

      if (tradeProfile) {
        // User has a persistent trade profile
        const profile = {
          companyName: 'Your Company', // Never show company names from database
          businessType: tradeProfile.business_types?.[0] || 'Not specified',
          hsCode: tradeProfile.hs_codes?.[0] || 'Not classified',
          productDescription: `${tradeProfile.business_types?.[0] || 'Products'}`,
          tradeVolume: 'Not specified', // Never show trade volumes
          supplierCountry: tradeProfile.origin_countries?.[0] || 'Not specified',
          qualificationStatus: tradeProfile.usmca_qualification_status || 'NEEDS_REVIEW',
          savings: 0 // Never show actual savings amounts
        };

        setUserProfile(profile);
        generateDynamicContent(profile);
        setIsLoading(false);
        return;
      }

      // Fallback to localStorage (current session)
      loadLocalStorageData();
    } catch (error) {
      console.error('Error loading trade profile:', error);
      loadLocalStorageData();
    }
  };


  const loadLocalStorageData = () => {
    // Load user data from completed workflow
    const workflowData = localStorage.getItem('usmca_workflow_data');
    const companyData = localStorage.getItem('usmca_company_data');
    const resultsData = localStorage.getItem('usmca_workflow_results');

    // Clear any old test data
    const hasOldTestData = (workflowData && workflowData.includes('Tropical Harvest')) ||
                          (companyData && companyData.includes('Tropical Harvest')) ||
                          (resultsData && resultsData.includes('Tropical Harvest'));

    if (hasOldTestData) {
      console.log('Found old test data, clearing all localStorage...');
      localStorage.removeItem('usmca_workflow_data');
      localStorage.removeItem('usmca_company_data');
      localStorage.removeItem('usmca_workflow_results');
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

      // Save trade profile to database for future visits (if user is logged in)
      if (user) {
        saveTradeProfile(profile);
      }
    }

    setIsLoading(false);
  };

  const saveTradeProfile = async (profile) => {
    if (!user || !profile.hsCode || profile.hsCode === 'Not classified') return;

    try {
      await fetch('/api/trade-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.session?.access_token}`
        },
        body: JSON.stringify({
          hs_codes: [profile.hsCode],
          business_types: profile.businessType ? [profile.businessType] : [],
          origin_countries: profile.supplierCountry ? [profile.supplierCountry] : [],
          usmca_qualification_status: profile.qualificationStatus,
          qualified_products: profile.qualificationStatus === 'QUALIFIED' ? 1 : 0,
          total_products: 1
        })
      });
    } catch (error) {
      console.error('Error saving trade profile:', error);
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
        generalImpact: "Up to 25% additional tariffs on your imports",
        detailedImpact: `Potential ${formatCurrency(calculateRiskImpact(profile.tradeVolume, TRADE_RISK_CONFIG.tariffRates.section301))} annual cost increase`,
        probability: TRADE_RISK_CONFIG.probabilities.section301,
        timeframe: "Next 30-60 days",
        description: `Your HS code ${profile.hsCode} is specifically targeted in proposed Section 301 tariff expansions`,
        detailedInfo: `Based on your annual trade volume of ${formatCurrency(profile.tradeVolume)}, a 25% tariff would cost you ${formatCurrency(profile.tradeVolume * TRADE_RISK_CONFIG.tariffRates.section301)} per year. This calculation assumes your current import pattern continues.`
      });
    }

    // Risk based on USMCA qualification
    if (profile.qualificationStatus === 'NOT_QUALIFIED') {
      risks.push({
        title: "USMCA Qualification Gap",
        severity: "CRITICAL",
        generalImpact: "Missing significant USMCA savings opportunities",
        detailedImpact: `Missing ${formatCurrency(profile.savings)} in annual savings`,
        probability: "Current",
        timeframe: "Immediate",
        description: "Your current supply chain doesn't qualify for USMCA benefits",
        detailedInfo: `USMCA qualification could save you ${formatCurrency(profile.savings)} annually through duty-free access. Mexico manufacturing partnership is typically the fastest path to qualification for ${profile.businessType} companies.`
      });
    }

    // Risk based on business type
    if (profile.businessType === 'Electronics' || profile.businessType === 'ElectronicsTechnology') {
      risks.push({
        title: "Electronics Industry Targeting",
        severity: "HIGH",
        generalImpact: "Additional compliance requirements and potential restrictions",
        detailedImpact: "Additional compliance requirements and potential restrictions",
        probability: TRADE_RISK_CONFIG.probabilities.electronics,
        timeframe: "Next 3-6 months",
        description: "Electronics imports face increased scrutiny and potential new restrictions",
        detailedInfo: "Electronics companies are seeing increased audits, longer customs processing times, and new documentation requirements. Consider establishing USMCA-compliant manufacturing to avoid these restrictions."
      });
    }

    // Generic supply chain concentration risk
    risks.push({
      title: "Supply Chain Concentration Risk",
      severity: "MEDIUM",
      generalImpact: "Business continuity threat",
      detailedImpact: "Business continuity threat and potential supply disruptions",
      probability: "Ongoing",
      timeframe: "Continuous",
      description: `Heavy reliance on ${profile.supplierCountry || 'single country'} creates vulnerability to policy changes`,
      detailedInfo: `Single-country sourcing creates vulnerability to trade policy changes, natural disasters, and geopolitical tensions. Diversifying across multiple countries reduces these risks significantly.`
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
        timeline: TRADE_RISK_CONFIG.timelines.mexico,
        riskReduction: TRADE_RISK_CONFIG.riskReduction.mexicoManufacturing,
        relevantTeam: "Jorge"
      });
    }

    // Latin America diversification (Jorge's specialty)
    if (profile.tradeVolume > TRADE_RISK_CONFIG.thresholds.highVolumeTrader) {
      alternatives.push({
        strategy: "Latin America Supply Network",
        benefit: "Diversify across Mexico, Colombia, Brazil to reduce single-country risk",
        implementation: "Jorge has established supplier networks throughout Latin America",
        timeline: TRADE_RISK_CONFIG.timelines.latinAmerica,
        riskReduction: TRADE_RISK_CONFIG.riskReduction.latinAmericaNetwork,
        relevantTeam: "Jorge"
      });
    }

    // Logistics optimization (Cristina's specialty)
    alternatives.push({
      strategy: "Multi-Route Logistics Strategy",
      benefit: "Backup shipping routes and customs procedures",
      implementation: "Cristina designs complex routing strategies for business continuity",
      timeline: TRADE_RISK_CONFIG.timelines.logistics,
      riskReduction: TRADE_RISK_CONFIG.riskReduction.multiRouteLogistics,
      relevantTeam: "Cristina"
    });

    // Canada routing for USMCA
    if (profile.qualificationStatus !== 'QUALIFIED') {
      alternatives.push({
        strategy: "Canada USMCA Entry Point",
        benefit: "Alternative USMCA qualification route",
        implementation: "Cristina handles Canada-Mexico-US triangle routing setup",
        timeline: TRADE_RISK_CONFIG.timelines.canada,
        riskReduction: TRADE_RISK_CONFIG.riskReduction.canadaRouting,
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
                             profile.tradeVolume > TRADE_RISK_CONFIG.thresholds.highVolumeTrader;

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
        {/* Alert Access Gate */}
        <div className="alert alert-info">
          <div className="alert-content">
            <div className="alert-title">📊 Trade Risk Alert Dashboard</div>
            <div className="text-body">
              Monitor your personalized trade risk alerts and crisis notifications.
              <br />• Real-time tariff change alerts based on your trade profile
              <br />• Supply chain disruption notifications
              <br />• Alternative routing recommendations
            </div>
            <div className="hero-buttons">
              <button
                onClick={() => window.location.href = '/pricing'}
                className="btn-primary"
              >
                Upgrade for Full Alert Access
              </button>
            </div>
          </div>
        </div>

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
              <div className="status-value">
                {hasDetailedConsent ? formatCurrency(userProfile.tradeVolume) : 'Not specified'}
              </div>
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
                      <div className="status-value">
                        {hasDetailedConsent && expandedDetails[index] ? risk.detailedImpact : risk.generalImpact}
                      </div>
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

                  {/* See More Details Button */}
                  <div className="element-spacing">
                    <button
                      onClick={() => handleSeeMoreDetails(index)}
                      className="text-body"
                    >
                      {hasDetailedConsent && expandedDetails[index] ?
                        'Show Less Details' :
                        'See More Details 💰'
                      }
                    </button>
                  </div>

                  {/* Detailed Information */}
                  {hasDetailedConsent && expandedDetails[index] && risk.detailedInfo && (
                    <div className="card" style={{marginTop: '12px', padding: '12px'}}>
                      <div className="text-body">
                        <strong>Detailed Analysis:</strong> {risk.detailedInfo}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Dynamic Alternative Strategies */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">🛡️ Recommended Alternatives - Don&apos;t Put All Eggs in One Basket</h3>
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
                      {rec.teamMember === 'Jorge' ? (
                        <button
                          className="btn-primary"
                          onClick={() => window.location.href = '/services/mexico-trade-services'}
                        >
                          🇲🇽 Request Jorge Consultation
                        </button>
                      ) : (
                        <button
                          className="btn-primary"
                          onClick={() => window.location.href = '/services/logistics-support'}
                        >
                          📦 Request Cristina Consultation
                        </button>
                      )}
                      <button
                        className="btn-secondary"
                        onClick={() => window.location.href = `mailto:${rec.teamMember.toLowerCase()}@triangleintelligence.com`}
                      >
                        📧 Email {rec.teamMember}
                      </button>
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
                <button
                  className="btn-primary"
                  onClick={() => window.location.href = '/services/mexico-trade-services'}
                >
                  🇲🇽 Get Jorge&apos;s Help Now
                </button>
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

        {/* Detailed Consent Modal */}
        {showDetailedConsent && (
          <div className="modal-overlay" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div className="content-card" style={{
              maxWidth: '500px',
              margin: '20px',
              maxHeight: '80vh',
              overflow: 'auto'
            }}>
              <div className="section-header">
                <h2 className="section-title">💰 See Detailed Financial Impact?</h2>
                <p className="text-body">
                  We can show you specific dollar amounts and volume-based recommendations, but this requires temporarily storing your business data.
                </p>
              </div>

              <div className="card">
                <h3 className="card-title">Our Transparency Promise</h3>
                <div className="text-body">
                  <p><strong>What we&apos;ll store:</strong></p>
                  <ul>
                    <li>Your trade volume amounts</li>
                    <li>Calculated savings figures</li>
                    <li>Volume-based recommendations</li>
                  </ul>

                  <p><strong>How we protect it:</strong></p>
                  <ul>
                    <li>🔒 Encrypted in secure database</li>
                    <li>👤 Only you can access it</li>
                    <li>🗑️ Delete anytime in account settings</li>
                    <li>⏰ Auto-deleted after 90 days of inactivity</li>
                  </ul>

                  <p><strong>Your control:</strong></p>
                  <ul>
                    <li>✅ Say &quot;Yes&quot; - See detailed dollar impacts</li>
                    <li>❌ Say &quot;No&quot; - Keep seeing general percentages</li>
                    <li>🔄 Change your mind anytime</li>
                  </ul>
                </div>
              </div>

              <div className="hero-buttons">
                <button
                  onClick={() => handleDetailedConsent(true)}
                  className="btn-primary"
                >
                  Yes, Show Me Details
                </button>
                <button
                  onClick={() => handleDetailedConsent(false)}
                  className="btn-secondary"
                >
                  No Thanks, Keep It General
                </button>
              </div>

              <div className="element-spacing">
                <button
                  onClick={() => setShowDetailedConsent(false)}
                  className="text-body"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </TriangleLayout>
  );
}