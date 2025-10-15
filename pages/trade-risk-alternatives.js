/**
 * TRADE RISK & ALTERNATIVES DASHBOARD
 * Dynamic alerts based on user's actual trade profile from workflow
 * Shows current risks and diversification strategies with team solutions
 */

import React, { useState, useEffect } from 'react';
import TriangleLayout from '../components/TriangleLayout';
import { useSimpleAuth } from '../lib/contexts/SimpleAuthContext';
import SaveDataConsentModal from '../components/shared/SaveDataConsentModal';

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
  const [aiVulnerabilityAnalysis, setAiVulnerabilityAnalysis] = useState(null);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [subscriptionTier, setSubscriptionTier] = useState(null);

  // Real policy alerts state (NEW - fetched from database)
  const [realPolicyAlerts, setRealPolicyAlerts] = useState([]);
  const [isLoadingPolicyAlerts, setIsLoadingPolicyAlerts] = useState(false);

  // Save data consent modal state
  const [showSaveDataConsent, setShowSaveDataConsent] = useState(false);
  const [, setHasSaveDataConsent] = useState(false); // hasSaveDataConsent not used, only setter
  const [pendingProfile, setPendingProfile] = useState(null);

  const { user } = useSimpleAuth();

  useEffect(() => {
    loadUserData();
    // Check if user has given detailed consent before
    const consent = localStorage.getItem('detailed_alerts_consent');
    setHasDetailedConsent(consent === 'true');
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load real policy alerts when user profile is available
  useEffect(() => {
    if (userProfile && userProfile.componentOrigins) {
      loadRealPolicyAlerts(userProfile);
    }
  }, [userProfile]);

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

    // Load user's subscription tier
    try {
      const response = await fetch('/api/dashboard-data', {
        credentials: 'include'
      });

      if (response.ok) {
        const dashboardData = await response.json();
        const tier = dashboardData.user_profile?.subscription_tier;
        setSubscriptionTier(tier);
        console.log('✅ Subscription tier loaded:', tier);
      }
    } catch (error) {
      console.error('Failed to load subscription tier:', error);
    }

    try {
      // Check if loading specific alert from dashboard
      const urlParams = new URLSearchParams(window.location.search);
      const analysisId = urlParams.get('analysis_id');

      if (analysisId) {
        console.log('📊 Loading specific alert:', analysisId);
        // Load alert from database
        const response = await fetch('/api/dashboard-data', {
          credentials: 'include'
        });

        if (response.ok) {
          const dashboardData = await response.json();
          const alert = dashboardData.alerts?.find(a => a.id === analysisId);

          if (alert) {
            console.log('✅ Found alert data:', alert);

            // Get supplier country from component origins
            const components = alert.component_origins || [];
            const primarySupplier = components.length > 0
              ? (components[0].origin_country || components[0].country)
              : 'Not specified';

            const profile = {
              companyName: alert.company_name || 'Your Company',
              businessType: alert.business_type || 'Not specified',
              hsCode: alert.hs_code || 'Not classified',
              productDescription: alert.product_description || 'Product',
              tradeVolume: alert.annual_trade_volume || 0,
              supplierCountry: primarySupplier,
              qualificationStatus: alert.qualification_status || 'NEEDS_REVIEW',
              savings: 0, // Not stored in vulnerability_analyses table
              componentOrigins: components,
              recommendedAlternatives: alert.recommendations?.diversification_strategies || [],
              vulnerabilities: alert.primary_vulnerabilities || []
            };

            setUserProfile(profile);

            // Set alternatives from database if available
            if (alert.recommendations?.diversification_strategies && alert.recommendations.diversification_strategies.length > 0) {
              setDynamicAlternatives(alert.recommendations.diversification_strategies);
            }

            // Set risks from database if available
            if (alert.alerts && alert.alerts.length > 0) {
              const aiRisks = alert.alerts.map(a => ({
                title: a.title,
                severity: a.severity,
                generalImpact: a.description,
                detailedImpact: a.potential_impact,
                probability: 'AI-Analyzed',
                timeframe: 'Real-time monitoring',
                description: a.description,
                detailedInfo: a.monitoring_guidance,
                aiGenerated: true
              }));
              setDynamicRisks(aiRisks);
            }

            generateDynamicContent(profile);
            setIsLoading(false);
            return;
          }
        }
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
      // Parse trade volume - handle string with commas like "12,000,000"
      const rawTradeVolume = userData.company?.annual_trade_volume || userData.company?.trade_volume || 0;
      const parsedTradeVolume = typeof rawTradeVolume === 'string'
        ? parseFloat(rawTradeVolume.replace(/,/g, ''))
        : rawTradeVolume;

      const profile = {
        companyName: userData.company?.name || userData.company?.company_name || 'Your Company',
        businessType: userData.company?.business_type || userData.company?.businessType,
        hsCode: userData.product?.hs_code || userData.classification?.hs_code,
        productDescription: userData.product?.description || userData.product?.product_description || userData.classification?.description,
        tradeVolume: parsedTradeVolume,
        supplierCountry: userData.component_origins?.[0]?.origin_country || userData.components?.[0]?.country || userData.company?.supplier_country,
        qualificationStatus: userData.certificate?.qualification_result || userData.usmca?.qualification_status || userData.usmca?.qualified === true ? 'QUALIFIED' : 'NOT_QUALIFIED',
        savings: userData.certificate?.savings || userData.savings?.total_savings || userData.savings?.annual_savings || 0,
        componentOrigins: userData.component_origins || userData.components || []
      };

      setUserProfile(profile);
      generateDynamicContent(profile);

      // NEW: Show consent modal instead of automatically saving
      // Check if user is authenticated (cookie-based auth)
      const savedConsent = localStorage.getItem('save_data_consent');
      const isAuthenticated = !!user; // Simple check - user exists means authenticated

      console.log('🔐 Auth check:', {
        isAuthenticated,
        hasUser: !!user,
        userEmail: user?.email,
        savedConsent
      });

      if (isAuthenticated && !savedConsent) {
        // User is logged in but hasn't chosen save/erase yet
        console.log('💾 Showing save data consent modal');
        setPendingProfile(profile);
        setShowSaveDataConsent(true);
      } else if (isAuthenticated && savedConsent === 'save') {
        // User previously chose to save - honor that choice
        console.log('✅ User previously consented to save - saving to database');
        setHasSaveDataConsent(true); // Used to control detailed consent display
        saveTradeProfile(profile);
      } else if (isAuthenticated && savedConsent === 'erase') {
        // User chose to erase - respect that choice
        console.log('🔒 User previously chose to erase - respecting privacy choice');
        setHasSaveDataConsent(false);
      } else if (!isAuthenticated) {
        // User not authenticated - just use localStorage (no modal)
        console.log('ℹ️ User not authenticated - data stored in browser only');
      }
      // If savedConsent === 'erase', do nothing (privacy first)
    }

    setIsLoading(false);
  };

  const saveTradeProfile = async (profile) => {
    if (!user || !profile.hsCode || profile.hsCode === 'Not classified') {
      console.log('⚠️ Cannot save to database: User not authenticated or no HS code');
      return false;
    }

    try {
      // Use cookie-based authentication (credentials: 'include')
      const response = await fetch('/api/trade-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // Use cookie authentication
        body: JSON.stringify({
          hs_codes: [profile.hsCode],
          business_types: profile.businessType ? [profile.businessType] : [],
          origin_countries: profile.supplierCountry ? [profile.supplierCountry] : [],
          usmca_qualification_status: profile.qualificationStatus,
          qualified_products: profile.qualificationStatus === 'QUALIFIED' ? 1 : 0,
          total_products: 1
        })
      });

      if (response.ok) {
        console.log('✅ Trade profile saved to database via cookie auth');
        return true;
      } else {
        console.warn(`⚠️ Database save failed: ${response.status} ${response.statusText}`);
        return false;
      }
    } catch (error) {
      console.error('❌ Error saving trade profile:', error);
      return false;
    }
  };

  // Handle user choosing to SAVE their data
  const handleSaveDataConsent = async () => {
    console.log('✅ User chose to SAVE data for alerts and services');

    // Save consent choice
    localStorage.setItem('save_data_consent', 'save');
    setHasSaveDataConsent(true);
    setShowSaveDataConsent(false);

    // Save the pending profile to database
    if (pendingProfile) {
      await saveTradeProfile(pendingProfile);
      setPendingProfile(null);
    }
  };

  // Handle user choosing to ERASE their data / Skip alerts
  const handleEraseDataConsent = () => {
    console.log('🔒 User chose to ERASE data / Skip alerts (privacy first)');

    // Save consent choice to not show modal again this session
    localStorage.setItem('save_data_consent', 'erase');
    setHasSaveDataConsent(false);
    setShowSaveDataConsent(false);
    setPendingProfile(null);

    // Clear all workflow data from localStorage (respect privacy choice)
    localStorage.removeItem('usmca_workflow_results');
    localStorage.removeItem('usmca_workflow_data');
    localStorage.removeItem('usmca_company_data');

    // Show user feedback and redirect
    alert('✅ No data saved. You can set up alerts anytime from your dashboard.');

    // Redirect to dashboard
    setTimeout(() => {
      window.location.href = '/dashboard';
    }, 1000);
  };

  const generateDynamicContent = async (profile) => {
    // Try to get AI-powered vulnerability analysis if we have workflow results
    const resultsData = localStorage.getItem('usmca_workflow_results');

    console.log('📥 ========== LOADING WORKFLOW DATA FOR ALERTS ==========');
    console.log('localStorage keys:', Object.keys(localStorage).filter(k => k.includes('usmca')));
    console.log('usmca_workflow_results exists:', !!resultsData);

    if (resultsData) {
      try {
        const workflowResults = JSON.parse(resultsData);

        console.log('📊 Workflow data parsed:', {
          has_component_origins: !!(workflowResults.component_origins),
          has_components: !!(workflowResults.components),
          component_origins_length: (workflowResults.component_origins || []).length,
          components_length: (workflowResults.components || []).length,
          data_sample: workflowResults.component_origins || workflowResults.components
        });

        // Check if we have component origins data for AI analysis
        if (workflowResults.component_origins || workflowResults.components) {
          console.log('🤖 ========== AI VULNERABILITY ANALYSIS STARTING ==========');
          console.log('Component origins found, requesting AI vulnerability analysis...');

          const aiSucceeded = await generateAIVulnerabilityAlerts(workflowResults);

          if (aiSucceeded) {
            console.log('✅ AI analysis succeeded - using AI-generated alerts');
            // AI set the dynamic risks, alternatives, and recommendations
            // No need to set generic ones
            setIsLoading(false);
            return; // Exit early - AI has set everything
          } else {
            console.log('⚠️ AI analysis failed - falling back to rule-based alerts');
          }
        } else {
          console.log('⚠️ No component origins found in workflow data - using rule-based alerts');
          console.log('Workflow data keys:', Object.keys(workflowResults));
        }
      } catch (error) {
        console.error('❌ Error checking for AI analysis capability:', error);
      }
    } else {
      console.log('⚠️ No workflow results data in localStorage');
    }

    // Generate traditional risks based on profile (ONLY as fallback if AI didn't work)
    console.log('📊 Using fallback rule-based alerts');
    const risks = generateRisksFromProfile(profile);
    const alternatives = generateAlternativesFromProfile(profile);
    const teamRecs = generateTeamRecommendationsFromProfile(profile);

    setDynamicRisks(risks);
    setDynamicAlternatives(alternatives);
    setTeamRecommendations(teamRecs);
    setIsLoading(false);
  };

  const generateAIVulnerabilityAlerts = async (workflowResults) => {
    setIsAiAnalyzing(true);

    try {
      console.log('📤 Sending workflow data to AI vulnerability endpoint...');

      const response = await fetch('/api/ai-vulnerability-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workflowResults)
      });

      if (!response.ok) {
        throw new Error(`AI analysis failed: ${response.status}`);
      }

      const aiAnalysis = await response.json();

      console.log('✅ AI vulnerability analysis received:', {
        alert_count: aiAnalysis.alerts?.length,
        risk_level: aiAnalysis.vulnerability_analysis?.overall_risk_level,
        confidence: aiAnalysis.trust?.confidence_score
      });

      setAiVulnerabilityAnalysis(aiAnalysis);

      // Replace dynamic risks with AI-generated alerts
      if (aiAnalysis.alerts && aiAnalysis.alerts.length > 0) {
        const aiRisks = aiAnalysis.alerts.map(alert => ({
          title: alert.title,
          severity: alert.severity,
          generalImpact: alert.description,
          detailedImpact: alert.potential_impact,
          probability: 'AI-Analyzed',
          timeframe: 'Real-time monitoring',
          description: alert.description,
          detailedInfo: `${alert.description}\n\nAffected Components: ${alert.affected_components?.join(', ') || 'Multiple'}\n\nRecommended Action: ${alert.recommended_action}\n\nMonitoring Guidance: ${alert.monitoring_guidance}`,
          aiGenerated: true,
          alertTriggers: alert.alert_triggers || []
        }));

        console.log('🚨 Setting AI-generated risks to replace generic ones:', {
          ai_risk_count: aiRisks.length,
          ai_risk_titles: aiRisks.map(r => r.title)
        });
        setDynamicRisks(aiRisks);
        setIsAiAnalyzing(false);
        return true; // Success - AI alerts set
      }

      setIsAiAnalyzing(false);
      return false; // No alerts generated

    } catch (error) {
      console.error('❌ AI vulnerability analysis failed:', error);
      setIsAiAnalyzing(false);
      return false; // Failed - fall back to rule-based alerts
    }
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

  /**
   * Load REAL tariff policy alerts from database
   * Filters by user's component origins and HS codes for relevance
   */
  const loadRealPolicyAlerts = async (profile) => {
    setIsLoadingPolicyAlerts(true);

    try {
      console.log('🚨 Fetching real tariff policy alerts from government sources...');

      const response = await fetch('/api/tariff-policy-alerts', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch policy alerts: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.alerts) {
        console.log(`✅ Loaded ${data.alerts.length} total policy alerts`);

        // Extract user's component countries and HS codes for filtering
        const userCountries = profile.componentOrigins
          ?.map(c => c.origin_country || c.country)
          .filter(Boolean) || [];

        const userHSCodes = profile.componentOrigins
          ?.map(c => c.hs_code)
          .filter(Boolean) || [];

        console.log('🔍 User trade profile:', {
          countries: userCountries,
          hs_codes: userHSCodes
        });

        // Filter alerts relevant to user's trade profile
        const relevantAlerts = data.alerts.filter(alert => {
          // Check if alert affects user's origin countries
          const affectsUserCountry = alert.affected_countries?.some(country =>
            userCountries.includes(country)
          );

          // Check if alert affects user's HS codes
          const affectsUserHSCode = alert.affected_hs_codes?.some(hsCode =>
            userHSCodes.some(userHS => userHS && userHS.startsWith(hsCode.substring(0, 4)))
          );

          // Always show CRITICAL alerts (priority 1-3) regardless of specifics
          const isCritical = alert.severity === 'CRITICAL';

          return affectsUserCountry || affectsUserHSCode || isCritical;
        });

        console.log(`🎯 ${relevantAlerts.length} alerts relevant to your trade profile`);
        setRealPolicyAlerts(relevantAlerts);
      }
    } catch (error) {
      console.error('❌ Error loading real policy alerts:', error);
      setRealPolicyAlerts([]);
    } finally {
      setIsLoadingPolicyAlerts(false);
    }
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

  // Check tier-based alert access
  // Don't show upgrade message while subscription tier is still loading
  const isTrialUser = subscriptionTier === 'Trial';
  const isStarterUser = subscriptionTier === 'Starter';
  const hasPremiumAccess = subscriptionTier === 'Professional' || subscriptionTier === 'Premium' || subscriptionTier === 'Enterprise';

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
        <div className="form-section">
          <h2 className="form-section-title">Your Trade Profile</h2>
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
                {userProfile.tradeVolume && !isNaN(userProfile.tradeVolume) && userProfile.tradeVolume > 0
                  ? formatCurrency(userProfile.tradeVolume)
                  : 'Not specified'}
              </div>
            </div>
            <div className="status-card">
              <div className="status-label">USMCA Status</div>
              <div className={`status-value ${userProfile.qualificationStatus === 'QUALIFIED' ? 'success' : 'warning'}`}>
                {userProfile.qualificationStatus || 'Unknown'}
              </div>
            </div>
          </div>

          {/* Component Intelligence Table - Show enriched component data if available */}
          {userProfile.componentOrigins && userProfile.componentOrigins.length > 0 && (
            <div className="element-spacing">
              <h3 className="card-title">Component Tariff Intelligence</h3>
              <p className="text-body">
                Detailed tariff analysis for each component in your product:
              </p>

              <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
                <table className="component-table">
                  <thead>
                    <tr>
                      <th>Component</th>
                      <th>Origin</th>
                      <th>% of Product</th>
                      <th>HS Code</th>
                      <th>MFN Rate</th>
                      <th>USMCA Rate</th>
                      <th>Savings</th>
                      <th>AI Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userProfile.componentOrigins.map((comp, idx) => (
                      <tr key={idx} className={comp.ai_confidence && comp.ai_confidence < 80 ? 'low-confidence' : ''}>
                        <td>{comp.component_type || comp.description || 'Component ' + (idx + 1)}</td>
                        <td>{comp.origin_country || comp.country}</td>
                        <td>{comp.percentage || comp.value_percentage}%</td>
                        <td className="hs-code-cell">
                          {comp.hs_code || <span className="text-muted">Not classified</span>}
                        </td>
                        <td className={comp.mfn_rate ? 'text-danger' : 'text-muted'}>
                          {comp.mfn_rate !== undefined ? `${comp.mfn_rate.toFixed(1)}%` : 'N/A'}
                        </td>
                        <td className={comp.usmca_rate !== undefined ? 'text-success' : 'text-muted'}>
                          {comp.usmca_rate !== undefined ? `${comp.usmca_rate.toFixed(1)}%` : 'N/A'}
                        </td>
                        <td className={comp.savings_percentage > 0 ? 'savings-positive' : 'text-muted'}>
                          {comp.savings_percentage > 0 ? `${comp.savings_percentage.toFixed(1)}%` : '-'}
                        </td>
                        <td>
                          {comp.ai_confidence ? (
                            <span className={comp.ai_confidence < 80 ? 'confidence-low' : 'confidence-high'}>
                              {comp.ai_confidence}%
                              {comp.ai_confidence < 80 && ' ⚠️'}
                            </span>
                          ) : (
                            <span className="text-muted">N/A</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Insights from Component Data */}
              {userProfile.componentOrigins.some(c => c.ai_confidence && c.ai_confidence < 80) && (
                <div className="alert alert-warning" style={{ marginTop: '1rem' }}>
                  <div className="alert-content">
                    <div className="alert-title">⚠️ Low Confidence Classifications Detected</div>
                    <div className="text-body">
                      Some components have low AI confidence scores. Consider requesting professional verification for accurate tariff calculations.
                    </div>
                  </div>
                </div>
              )}

              {userProfile.componentOrigins.some(c => c.savings_percentage > 5) && (
                <div className="alert alert-success" style={{ marginTop: '1rem' }}>
                  <div className="alert-content">
                    <div className="alert-title">💰 Significant Tariff Savings Identified</div>
                    <div className="text-body">
                      Your components show strong tariff savings potential through USMCA qualification.
                      {userProfile.qualificationStatus !== 'QUALIFIED' && ' Consider supply chain optimization to unlock these savings.'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* AI Vulnerability Analysis Status */}
        {isAiAnalyzing && (
          <div className="alert alert-info">
            <div className="alert-content">
              <div className="alert-title">
                🤖 AI Analyzing Your Supply Chain...
                <span className="spinner-inline"></span>
              </div>
              <p className="text-body">Claude is analyzing your component origins for geopolitical and tariff vulnerabilities...</p>
            </div>
          </div>
        )}

        {/* We're Monitoring For You */}
        <div className="form-section">
          <h2 className="form-section-title">📡 We're Monitoring For You</h2>
          <p className="text-body">
            Real-time surveillance of trade policy changes affecting your specific components and supply chain.
          </p>

          <div className="status-grid">
            <div className="status-card">
              <div className="status-label">Section 301 Tariffs</div>
              <div className="status-value">✓ Checking Daily</div>
              <p className="form-help">Monitoring USTR announcements affecting {userProfile.componentOrigins?.filter(c => c.origin_country === 'CN' || c.country === 'CN').length || 0} Chinese components</p>
            </div>
            <div className="status-card">
              <div className="status-label">USMCA Renegotiations</div>
              <div className="status-value">✓ Checking Daily</div>
              <p className="form-help">Tracking bilateral trade deal proposals and USMCA changes</p>
            </div>
            <div className="status-card">
              <div className="status-label">HS Code Changes</div>
              <div className="status-value">✓ Checking Weekly</div>
              <p className="form-help">Federal Register CBP monitoring for HS {userProfile.hsCode} reclassifications</p>
            </div>
            <div className="status-card">
              <div className="status-label">Port Fee Updates</div>
              <div className="status-value">✓ Checking Monthly</div>
              <p className="form-help">Commerce ITA tracking port fees and shipping cost changes</p>
            </div>
          </div>

          {/* Email Notification Preferences */}
          <div className="alert alert-info" style={{ marginTop: '1rem' }}>
            <div className="alert-content">
              <div className="alert-title">📧 Email Notification Settings</div>
              <div className="text-body">
                <p>Choose how you want to receive alerts about changes affecting <strong>{userProfile.companyName}</strong>&apos;s trade profile:</p>

                <div style={{ marginTop: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      defaultChecked={true}
                      style={{ marginRight: '0.5rem' }}
                    />
                    <span>Email me when government policy alerts affect my components</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      defaultChecked={true}
                      style={{ marginRight: '0.5rem' }}
                    />
                    <span>Email me when tariff rates change for my HS codes</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      defaultChecked={false}
                      style={{ marginRight: '0.5rem' }}
                    />
                    <span>Email me weekly summary of all monitored sources</span>
                  </label>
                </div>

                <p className="form-help" style={{ marginTop: '1rem' }}>
                  💡 Tip: You can update these preferences anytime in your account settings. We only send alerts relevant to your specific trade profile.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Risk Analysis */}
        <div className="form-section">
          <h2 className="form-section-title">
            🚨 Current Threats to Your Trade
            {aiVulnerabilityAnalysis && <span> (AI-Powered)</span>}
          </h2>
          <p className="text-body">
            {aiVulnerabilityAnalysis
              ? 'AI-generated alerts specific to your component origins and supply chain'
              : 'Issues specifically affecting your business profile'}
          </p>

          {dynamicRisks.map((risk, index) => (
            <div key={index} className={`alert alert-${risk.severity === 'CRITICAL' ? 'error' : risk.severity === 'HIGH' ? 'warning' : 'info'}`}>
              <div className="alert-content">
                <div className="alert-title">
                  {risk.title}
                  {risk.category && (
                    <span className="form-help"> • {risk.category.toUpperCase()}</span>
                  )}
                </div>
                <div className="text-body">{risk.description}</div>

                {/* Enhanced Component Details - HS Codes and Tariff Exposure */}
                {(risk.affected_hs_codes || risk.tariff_exposure || risk.ai_confidence || risk.rvc_details) && (
                  <div className="element-spacing">
                    <div className="status-grid">
                      {/* HS Codes for Affected Components */}
                      {risk.affected_hs_codes && risk.affected_hs_codes.length > 0 && (
                        <div className="status-card">
                          <div className="status-label">Affected HS Codes</div>
                          <div className="status-value" style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                            {risk.affected_hs_codes.join(', ')}
                          </div>
                        </div>
                      )}

                      {/* Tariff Rate Exposure */}
                      {risk.tariff_exposure && (
                        <>
                          <div className="status-card">
                            <div className="status-label">MFN Rate</div>
                            <div className="status-value" style={{ color: '#dc2626' }}>
                              {risk.tariff_exposure.mfn_rate?.toFixed(1)}%
                            </div>
                          </div>
                          <div className="status-card">
                            <div className="status-label">USMCA Rate</div>
                            <div className="status-value" style={{ color: '#059669' }}>
                              {risk.tariff_exposure.usmca_rate?.toFixed(1)}%
                            </div>
                          </div>
                          {risk.tariff_exposure.savings_potential > 0 && (
                            <div className="status-card">
                              <div className="status-label">Tariff Savings</div>
                              <div className="status-value" style={{ color: '#059669' }}>
                                {risk.tariff_exposure.savings_potential?.toFixed(1)}%
                              </div>
                            </div>
                          )}
                          {hasDetailedConsent && risk.tariff_exposure.annual_dollar_impact && (
                            <div className="status-card">
                              <div className="status-label">Annual Dollar Impact</div>
                              <div className="status-value">
                                ${risk.tariff_exposure.annual_dollar_impact.toLocaleString()}
                              </div>
                            </div>
                          )}
                        </>
                      )}

                      {/* AI Confidence Warning */}
                      {risk.ai_confidence && (
                        <div className="status-card">
                          <div className="status-label">AI Classification Confidence</div>
                          <div className="status-value" style={{ color: risk.ai_confidence < 80 ? '#f59e0b' : '#059669' }}>
                            {risk.ai_confidence}%
                            {risk.ai_confidence < 80 && ' ⚠️ Low Confidence'}
                          </div>
                        </div>
                      )}

                      {/* RVC Optimization Details */}
                      {risk.rvc_details && (
                        <>
                          <div className="status-card">
                            <div className="status-label">Current RVC</div>
                            <div className="status-value">
                              {risk.rvc_details.current_rvc?.toFixed(1)}%
                            </div>
                          </div>
                          <div className="status-card">
                            <div className="status-label">RVC Threshold</div>
                            <div className="status-value">
                              {risk.rvc_details.threshold?.toFixed(1)}%
                            </div>
                          </div>
                          {risk.rvc_details.potential_rvc && (
                            <div className="status-card">
                              <div className="status-label">Potential RVC</div>
                              <div className="status-value" style={{ color: '#059669' }}>
                                {risk.rvc_details.potential_rvc?.toFixed(1)}%
                                {risk.rvc_details.safety_margin && ` (+${risk.rvc_details.safety_margin?.toFixed(1)}% margin)`}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Original Status Grid */}
                <div className="element-spacing">
                  <div className="status-grid">
                    <div className="status-card">
                      <div className="status-label">Financial Impact</div>
                      <div className="status-value">
                        {hasDetailedConsent && expandedDetails[index]
                          ? (risk.detailedImpact || risk.generalImpact)
                          : (risk.generalImpact || 'Not specified')}
                      </div>
                    </div>
                    <div className="status-card">
                      <div className="status-label">Probability</div>
                      <div className="status-value">{risk.probability || 'Unknown'}</div>
                    </div>
                    <div className="status-card">
                      <div className="status-label">Timeline</div>
                      <div className="status-value">{risk.timeframe || 'Unknown'}</div>
                    </div>
                  </div>

                  {/* See More Details Button */}
                  <div className="element-spacing">
                    <button
                      onClick={() => handleSeeMoreDetails(index)}
                      className="btn-secondary"
                    >
                      {hasDetailedConsent && expandedDetails[index] ?
                        '▲ Show Less Details' :
                        '▼ See More Details'
                      }
                    </button>
                  </div>

                  {/* Detailed Information */}
                  {hasDetailedConsent && expandedDetails[index] && risk.detailedInfo && (
                    <div className="form-section">
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


        {/* Action Items */}
        <div className="form-section">
          <h2 className="form-section-title">✅ Next Steps for {userProfile.companyName}</h2>

          <div className="alert alert-warning">
            <div className="alert-content">
              <div className="alert-title">Priority Actions Based on Your Profile</div>
              <div className="text-body">
                <ol>
                  {userProfile.supplierCountry === 'CN' && (
                    <li><strong>Immediate:</strong> Identify alternative suppliers to reduce single-country dependency</li>
                  )}
                  {userProfile.qualificationStatus !== 'QUALIFIED' && (
                    <li><strong>This week:</strong> Explore Mexico manufacturing options for USMCA qualification</li>
                  )}
                  <li><strong>This month:</strong> Map backup logistics routes for {userProfile.productDescription}</li>
                  <li><strong>Ongoing:</strong> Monitor trade policy changes affecting HS code {userProfile.hsCode}</li>
                </ol>
              </div>
              <div className="hero-buttons">
                <button
                  className="btn-primary"
                  onClick={() => window.location.href = '/services/request-form'}
                >
                  🎯 Request Expert Consultation
                </button>
                <button className="btn-secondary">📋 Download Risk Assessment</button>
              </div>
            </div>
          </div>
        </div>

        {/* REAL Government Policy Alerts - Relevant to User's Trade Profile */}
        <div className="form-section">
          <h2 className="form-section-title">🚨 Government Policy Alerts Affecting Your Trade</h2>
          <p className="text-body">
            Real tariff and trade policy changes from official U.S. government sources that directly impact your components and supply chain.
            {realPolicyAlerts.length > 0 && ` Showing ${realPolicyAlerts.length} alerts relevant to your trade profile.`}
          </p>

          {isLoadingPolicyAlerts && (
            <div className="alert alert-info">
              <div className="alert-content">
                <div className="alert-title">
                  Loading government policy alerts...
                  <span className="spinner-inline"></span>
                </div>
              </div>
            </div>
          )}

          {!isLoadingPolicyAlerts && realPolicyAlerts.length === 0 && (
            <div className="alert alert-success">
              <div className="alert-content">
                <div className="alert-title">✅ No Critical Policy Changes Affecting Your Trade</div>
                <div className="text-body">
                  Great news! There are currently no government-announced tariff or policy changes that directly impact your component origins or HS codes. We monitor official sources 24/7 and will alert you immediately when relevant changes occur.
                </div>
              </div>
            </div>
          )}

          {!isLoadingPolicyAlerts && realPolicyAlerts.length > 0 && (
            <div className="element-spacing">
              {realPolicyAlerts.map((alert, idx) => (
                <div
                  key={idx}
                  className={`alert alert-${alert.severity === 'CRITICAL' ? 'error' : alert.severity === 'HIGH' ? 'warning' : 'info'}`}
                >
                  <div className="alert-content">
                    <div className="alert-title">
                      {alert.title}
                      <span className="form-help"> • {alert.severity}</span>
                    </div>

                    <div className="text-body">
                      <p><strong>{alert.description}</strong></p>
                    </div>

                    {/* Policy Details Grid */}
                    <div className="element-spacing">
                      <div className="status-grid">
                        {alert.category && (
                          <div className="status-card">
                            <div className="status-label">Policy Type</div>
                            <div className="status-value">{alert.category}</div>
                          </div>
                        )}

                        {alert.effective_date && (
                          <div className="status-card">
                            <div className="status-label">Effective Date</div>
                            <div className="status-value">
                              {new Date(alert.effective_date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </div>
                          </div>
                        )}

                        {alert.tariff_adjustment && (
                          <div className="status-card">
                            <div className="status-label">Tariff Change</div>
                            <div className="status-value" style={{ color: '#dc2626', fontWeight: 'bold' }}>
                              {alert.tariff_adjustment}
                            </div>
                          </div>
                        )}

                        {alert.adjustment_percentage && (
                          <div className="status-card">
                            <div className="status-label">Rate Increase</div>
                            <div className="status-value" style={{ color: '#dc2626' }}>
                              +{alert.adjustment_percentage}%
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Affected Countries */}
                    {alert.affected_countries && alert.affected_countries.length > 0 && (
                      <div className="element-spacing">
                        <div className="text-body">
                          <strong>Affected Countries:</strong>{' '}
                          {alert.affected_countries.map((country, i) => (
                            <span key={i} className="form-help" style={{ marginRight: '8px' }}>
                              🌍 {country}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Affected HS Codes */}
                    {alert.affected_hs_codes && alert.affected_hs_codes.length > 0 && (
                      <div className="element-spacing">
                        <div className="text-body">
                          <strong>Affected HS Codes:</strong>{' '}
                          {alert.affected_hs_codes.map((code, i) => (
                            <span key={i} style={{ fontFamily: 'monospace', marginRight: '8px', fontSize: '0.9rem' }}>
                              {code}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Impact Summary */}
                    {alert.impact_summary && (
                      <div className="element-spacing">
                        <div className="text-body">
                          <strong>Impact on Your Trade:</strong>
                          <p>{alert.impact_summary}</p>
                        </div>
                      </div>
                    )}

                    {/* Source Link */}
                    {alert.source_url && (
                      <div className="element-spacing">
                        <div className="text-body">
                          <strong>Official Source:</strong>{' '}
                          <a href={alert.source_url} target="_blank" rel="noopener noreferrer" className="nav-link">
                            {alert.source_feed || 'View Government Announcement'} →
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Last Updated */}
                    {alert.last_updated && (
                      <div className="form-help">
                        Last updated: {new Date(alert.last_updated).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="hero-buttons">
                      <button
                        onClick={() => window.location.href = '/services/request-form'}
                        className="btn-primary"
                      >
                        🎯 Get Expert Help with This Policy Change
                      </button>
                      {alert.source_url && (
                        <button
                          onClick={() => window.open(alert.source_url, '_blank')}
                          className="btn-secondary"
                        >
                          📄 Read Official Announcement
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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

        {/* Save Data Consent Modal - Privacy First with Alerts Context */}
        <SaveDataConsentModal
          isOpen={showSaveDataConsent}
          onSave={handleSaveDataConsent}
          onErase={handleEraseDataConsent}
          userProfile={pendingProfile}
          context="alerts"
        />
      </div>
    </TriangleLayout>
  );
}