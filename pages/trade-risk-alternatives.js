/**
 * TRADE RISK & ALTERNATIVES DASHBOARD
 * Dynamic alerts based on user's actual trade profile from workflow
 * Shows current risks and diversification strategies with team solutions
 */

import React, { useState, useEffect } from 'react';
import TriangleLayout from '../components/TriangleLayout';
import { useSimpleAuth } from '../lib/contexts/SimpleAuthContext';
import SaveDataConsentModal from '../components/shared/SaveDataConsentModal';
import BrokerChatbot from '../components/chatbot/BrokerChatbot';
import USMCAIntelligenceDisplay from '../components/alerts/USMCAIntelligenceDisplay';

// Import configuration from centralized config file
import TRADE_RISK_CONFIG, {
  calculateRiskImpact,
  formatCurrency
} from '../config/trade-risk-config';

export default function TradeRiskAlternatives() {
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userTier, setUserTier] = useState('Trial'); // Track subscription tier

  // Executive trade alert state
  const [executiveAlert, setExecutiveAlert] = useState(null);
  const [isLoadingAlert, setIsLoadingAlert] = useState(false);
  const [alertsGenerated, setAlertsGenerated] = useState(false);

  // PREMIUM CONTENT: USMCA Intelligence from workflow
  const [workflowIntelligence, setWorkflowIntelligence] = useState(null);

  // Email alert preferences
  const [emailPreferences, setEmailPreferences] = useState({
    section301_changes: true,
    usmca_policy_changes: true,
    new_tariffs: true,
    frequency: 'IMMEDIATE'
  });

  // Save data consent modal state
  const [showSaveDataConsent, setShowSaveDataConsent] = useState(false);
  const [, setHasSaveDataConsent] = useState(false);
  const [pendingProfile, setPendingProfile] = useState(null);

  const { user } = useSimpleAuth();

  useEffect(() => {
    loadUserData();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadUserData = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try{
      // Check if loading specific alert from dashboard
      const urlParams = new URLSearchParams(window.location.search);
      const analysisId = urlParams.get('analysis_id');

      console.log('🔍 Alert Page Load Context:', {
        hasAnalysisId: !!analysisId,
        analysisId: analysisId,
        fullURL: window.location.href,
        hasUser: !!user
      });

      // Load workflow data from database
      console.log('📊 Loading workflow data from database...');
      const response = await fetch('/api/dashboard-data', {
        credentials: 'include'
      });

      if (response.ok) {
        const dashboardData = await response.json();

        console.log('📦 Dashboard data received:', {
          alertsCount: dashboardData.alerts?.length || 0,
          workflowsCount: dashboardData.workflows?.length || 0,
          tier: dashboardData.user_profile?.subscription_tier
        });

        // Extract user subscription tier
        setUserTier(dashboardData.user_profile?.subscription_tier || 'Trial');

        // If analysis_id provided, load that specific alert
        if (analysisId) {
          console.log('🔍 Looking for specific alert:', analysisId);
          const alert = dashboardData.alerts?.find(a => a.id === analysisId);

          if (alert) {
            console.log('✅ Found alert data from database');
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
              savings: 0,
              componentOrigins: components,
              recommendedAlternatives: alert.recommendations?.diversification_strategies || [],
              vulnerabilities: alert.primary_vulnerabilities || []
            };

            // ✅ CRITICAL FIX: Also set workflowIntelligence from alert data (for executive alert API)
            const workflowData = alert.workflow_data || {};
            setWorkflowIntelligence({
              usmca: workflowData.usmca || {},
              savings: workflowData.savings || {},
              component_origins: components,
              recommendations: workflowData.recommendations || [],
              detailed_analysis: workflowData.detailed_analysis || {},
              compliance_roadmap: workflowData.compliance_roadmap || {},
              confidence_score: workflowData.confidence_score || 0
            });

            setUserProfile(profile);
            setIsLoading(false);
            return;
          }
        }

        // ✅ NEW: If no analysis_id OR alert not found, load most recent workflow
        if (dashboardData.workflows?.length > 0) {
          const mostRecentWorkflow = dashboardData.workflows[0];
          console.log('✅ Loading most recent workflow from database:', {
            id: mostRecentWorkflow.id,
            companyName: mostRecentWorkflow.company_name,
            hasWorkflowData: !!mostRecentWorkflow.workflow_data
          });

          // Extract workflow data
          const workflowData = mostRecentWorkflow.workflow_data || {};
          const components = mostRecentWorkflow.component_origins || [];

          const profile = {
            userId: user?.id,
            companyName: mostRecentWorkflow.company_name,
            businessType: mostRecentWorkflow.business_type,
            industry_sector: mostRecentWorkflow.industry_sector,
            hsCode: mostRecentWorkflow.hs_code,
            productDescription: mostRecentWorkflow.product_description,
            tradeVolume: mostRecentWorkflow.trade_volume,
            supplierCountry: components[0]?.origin_country || components[0]?.country,
            qualificationStatus: mostRecentWorkflow.qualification_status,
            savings: mostRecentWorkflow.estimated_annual_savings || 0,
            componentOrigins: components
          };

          // ✅ FIXED: Always extract workflow intelligence with correct structure for executive alert API
          // AI returns: usmca, savings, recommendations, detailed_analysis, confidence_score
          console.log('✅ Extracting workflow intelligence from database');
          setWorkflowIntelligence({
            usmca: workflowData.usmca || {},
            savings: workflowData.savings || {},
            component_origins: components,
            recommendations: workflowData.recommendations || [],
            detailed_analysis: workflowData.detailed_analysis || {},
            compliance_roadmap: workflowData.compliance_roadmap || {},
            confidence_score: workflowData.confidence_score || 0
          });

          setUserProfile(profile);
          setIsLoading(false);
          return;
        } else {
          console.warn('⚠️ No workflows found in database - falling back to localStorage');
        }
      } else {
        console.error('❌ Dashboard data fetch failed:', response.status, response.statusText);
      }

      // Fallback to localStorage (current session)
      console.log('🔄 Falling back to localStorage data');
      loadLocalStorageData();
    } catch (error) {
      console.error('Error loading trade profile:', error);
      loadLocalStorageData();
    }
  };


  const loadLocalStorageData = async () => {
    // Fetch user subscription tier
    try {
      const authResponse = await fetch('/api/auth/me', { credentials: 'include' });
      if (authResponse.ok) {
        const authData = await authResponse.json();
        setUserTier(authData.user?.subscription_tier || 'Trial');
      }
    } catch (error) {
      console.error('Failed to fetch user tier:', error);
    }

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

      // NO FALLBACKS - Expose missing data as dev issue
      // CRITICAL FIX: Components are saved under usmca.component_breakdown (not top-level "components")
      const components = userData.usmca?.component_breakdown || userData.components || [];

      const profile = {
        userId: user?.id,  // Include userId for workflow intelligence lookup
        companyName: userData.company?.company_name || userData.company?.name,
        businessType: userData.company?.business_type,
        industry_sector: userData.company?.industry_sector,
        hsCode: userData.product?.hs_code,
        productDescription: userData.product?.description,
        tradeVolume: parsedTradeVolume,
        supplierCountry: components[0]?.origin_country || components[0]?.country,  // Try both keys
        qualificationStatus: userData.usmca?.qualification_status,
        savings: userData.savings?.annual_savings || 0,
        componentOrigins: components  // Fixed: use usmca.component_breakdown
      };

      // 🎯 ALWAYS EXTRACT RICH WORKFLOW INTELLIGENCE
      // This is the GOLD that subscribers pay $99-599/month for! AI provides: usmca, savings, recommendations, detailed_analysis
      console.log('✅ Extracting workflow intelligence from localStorage');
      setWorkflowIntelligence({
        usmca: userData.usmca || {},
        savings: userData.savings || {},
        component_origins: components,
        recommendations: userData.recommendations || [],
        detailed_analysis: userData.detailed_analysis || {},
        compliance_roadmap: userData.compliance_roadmap || {},
        confidence_score: userData.confidence_score || 0
      });

      // Log missing data to admin dashboard
      const missingFields = [];
      if (!profile.companyName) missingFields.push('company_name');
      if (!profile.businessType) missingFields.push('business_type');
      if (!profile.industry_sector) missingFields.push('industry_sector');
      if (!profile.hsCode) missingFields.push('hs_code');
      if (!profile.productDescription) missingFields.push('product_description');
      if (!profile.supplierCountry && components.length > 0) missingFields.push('component origin_country');
      if (!profile.qualificationStatus) missingFields.push('qualification_status');
      if (profile.componentOrigins.length === 0) missingFields.push('component_origins array');

      if (missingFields.length > 0) {
        console.error('🚨 DEV ISSUE: Missing workflow data in alerts page', {
          missing_fields: missingFields,
          userData_keys: Object.keys(userData),
          company_keys: userData.company ? Object.keys(userData.company) : [],
          product_keys: userData.product ? Object.keys(userData.product) : [],
          usmca_keys: userData.usmca ? Object.keys(userData.usmca) : [],
          components_count: userData.components?.length || 0
        });

        // Log to admin dashboard (non-blocking)
        fetch('/api/admin/log-dev-issue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            issue_type: 'missing_data',
            severity: 'high',
            component: 'trade_alerts_page',
            message: `Missing ${missingFields.length} required fields in alerts page data flow`,
            context_data: {
              missing_fields: missingFields,
              userData_structure: {
                company_keys: userData.company ? Object.keys(userData.company) : [],
                product_keys: userData.product ? Object.keys(userData.product) : [],
                usmca_keys: userData.usmca ? Object.keys(userData.usmca) : [],
                components_count: userData.components?.length || 0
              }
            }
          })
        }).catch(err => console.error('Failed to log dev issue:', err));
      }

      setUserProfile(profile);

      // Show consent modal instead of automatically saving
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

  /**
   * Load executive trade alert - ONE cohesive summary
   * Uses workflow intelligence + personalized alerts
   */
  const loadExecutiveAlert = async (profile) => {
    setIsLoadingAlert(true);

    try {
      console.log('🎯 Generating executive trade alert for:', profile.companyName);

      // Step 1: Get personalized policy alerts for context
      console.log('📊 Fetching policy alerts...');
      const alertsResponse = await fetch('/api/generate-personalized-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_profile: profile
        })
      });

      if (!alertsResponse.ok) {
        throw new Error(`Failed to fetch policy alerts: ${alertsResponse.status}`);
      }

      const alertsData = await alertsResponse.json();
      const rawAlerts = alertsData.alerts || [];

      console.log(`📨 Got ${rawAlerts.length} policy alerts for context`);

      // Step 2: Generate ONE executive summary using all the data
      console.log('✍️ Generating executive summary...');
      console.log('📊 Request data:', {
        user_profile_keys: Object.keys(profile || {}),
        workflow_intelligence_keys: Object.keys(workflowIntelligence || {}),
        alerts_count: rawAlerts.length
      });

      const executiveResponse = await fetch('/api/executive-trade-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_profile: profile,
          workflow_intelligence: workflowIntelligence,
          raw_alerts: rawAlerts
        })
      });

      if (!executiveResponse.ok) {
        throw new Error(`Failed to generate executive alert: ${executiveResponse.status}`);
      }

      const executiveData = await executiveResponse.json();

      if (executiveData.success && executiveData.alert) {
        console.log(`✅ Executive alert generated: ${executiveData.alert.headline}`);
        setExecutiveAlert(executiveData.alert);
        setAlertsGenerated(true);

        // Save email preference from alert config
        if (executiveData.alert.email_trigger_config) {
          const emailConfig = executiveData.alert.email_trigger_config;
          setEmailPreferences({
            should_email: emailConfig.should_email,
            trigger_level: emailConfig.trigger_level,
            frequency: emailConfig.frequency
          });
        }
      } else {
        console.log('⚠️ No executive alert generated');
        setExecutiveAlert(null);
        setAlertsGenerated(true);
      }
    } catch (error) {
      console.error('❌ Error generating executive alert:', error);
      setExecutiveAlert(null);
      setAlertsGenerated(true);
    } finally {
      setIsLoadingAlert(false);
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

  return (
    <TriangleLayout>
      <div className="dashboard-container">

        <div className="dashboard-header">
          <h1 className="dashboard-title">Trade Risk & Alternatives Dashboard</h1>
          <p className="dashboard-subtitle">
            Personalized risk analysis and diversification strategies for {userProfile.companyName}
          </p>
        </div>

        {/* Compact Monitoring Notification - At Top for Reassurance */}
        <div className="alert alert-info" style={{ marginBottom: '2rem' }}>
          <div className="alert-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div className="alert-title">📡 We're Monitoring For You</div>
                <p className="text-body">
                  Real-time surveillance of Section 301 tariffs, USMCA changes, HS code updates, and port fees affecting your {userProfile.componentOrigins?.length || 0} components.
                </p>
              </div>
              <button
                onClick={() => window.location.href = '/account/settings'}
                className="btn-secondary"
                style={{ whiteSpace: 'nowrap' }}
              >
                ⚙️ Email Preferences
              </button>
            </div>
          </div>
        </div>

        {/* 🎯 PREMIUM CONTENT: Rich USMCA Intelligence */}
        {workflowIntelligence && (
          <USMCAIntelligenceDisplay workflowIntelligence={workflowIntelligence} />
        )}

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
                      <th style={{ textAlign: 'left', padding: '0.5rem' }}>Component</th>
                      <th style={{ textAlign: 'center', padding: '0.5rem' }}>Origin</th>
                      <th style={{ textAlign: 'center', padding: '0.5rem' }}>Value %</th>
                      <th style={{ textAlign: 'center', padding: '0.5rem' }}>HS Code</th>
                      <th style={{ textAlign: 'right', padding: '0.5rem' }}>Base MFN</th>
                      <th style={{ textAlign: 'right', padding: '0.5rem', backgroundColor: '#fef3c7' }}>Section 301</th>
                      <th style={{ textAlign: 'right', padding: '0.5rem', fontWeight: '700' }}>Total Rate</th>
                      <th style={{ textAlign: 'right', padding: '0.5rem' }}>USMCA Rate</th>
                      <th style={{ textAlign: 'right', padding: '0.5rem', backgroundColor: '#dcfce7' }}>Net After USMCA</th>
                      <th style={{ textAlign: 'right', padding: '0.5rem' }}>Actual Savings</th>
                      <th style={{ textAlign: 'center', padding: '0.5rem' }}>AI Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userProfile.componentOrigins.map((comp, idx) => {
                      const baseMFN = comp.mfn_rate || comp.tariff_rates?.mfn_rate || 0;
                      const section301 = comp.section_301 || comp.tariff_rates?.section_301 || 0;
                      const totalRate = comp.total_rate || comp.tariff_rates?.total_rate || baseMFN;
                      const usmcaRate = comp.usmca_rate || comp.tariff_rates?.usmca_rate || 0;
                      const netAfterUSMCA = totalRate - (baseMFN - usmcaRate);
                      const actualSavings = baseMFN - usmcaRate;

                      return (
                        <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                          <td style={{ padding: '0.5rem' }}>
                            {comp.component_type || comp.description || `Component ${idx + 1}`}
                          </td>
                          <td style={{ textAlign: 'center', padding: '0.5rem' }}>
                            {comp.origin_country || comp.country}
                          </td>
                          <td style={{ textAlign: 'center', padding: '0.5rem' }}>
                            {comp.percentage || comp.value_percentage}%
                          </td>
                          <td style={{ textAlign: 'center', padding: '0.5rem', fontFamily: 'monospace' }}>
                            {comp.hs_code || '—'}
                          </td>

                          {/* Base MFN Rate */}
                          <td style={{ textAlign: 'right', padding: '0.5rem' }}>
                            {baseMFN > 0 ? `${baseMFN.toFixed(1)}%` : '—'}
                          </td>

                          {/* Section 301 Tariff - HIGHLIGHTED */}
                          <td style={{ textAlign: 'right', padding: '0.5rem', backgroundColor: section301 > 0 ? '#fef3c7' : 'transparent' }}>
                            {section301 > 0 ? (
                              <span style={{ color: '#92400e', fontWeight: '700', fontSize: '0.9375rem' }}>
                                +{section301.toFixed(1)}%
                              </span>
                            ) : (
                              <span style={{ color: '#9ca3af' }}>—</span>
                            )}
                          </td>

                          {/* Total Rate (Base + Section 301) - BOLD */}
                          <td style={{ textAlign: 'right', padding: '0.5rem' }}>
                            <span style={{ color: '#dc2626', fontWeight: '700', fontSize: '0.9375rem' }}>
                              {totalRate > 0 ? `${totalRate.toFixed(1)}%` : '—'}
                            </span>
                          </td>

                          {/* USMCA Rate */}
                          <td style={{ textAlign: 'right', padding: '0.5rem' }}>
                            <span style={{ color: '#059669' }}>
                              {usmcaRate.toFixed(1)}%
                            </span>
                          </td>

                          {/* Net After USMCA (what you actually pay) - HIGHLIGHTED */}
                          <td style={{ textAlign: 'right', padding: '0.5rem', backgroundColor: '#dcfce7' }}>
                            <span style={{ color: section301 > 0 ? '#dc2626' : '#059669', fontWeight: '700' }}>
                              {netAfterUSMCA > 0 ? `${netAfterUSMCA.toFixed(1)}%` : '0%'}
                            </span>
                            {section301 > 0 && (
                              <div style={{ fontSize: '0.6875rem', color: '#92400e', marginTop: '0.125rem' }}>
                                ⚠️ S301 remains
                              </div>
                            )}
                          </td>

                          {/* Actual Savings (USMCA saves base MFN only) */}
                          <td style={{ textAlign: 'right', padding: '0.5rem' }}>
                            {actualSavings > 0 ? (
                              <span style={{ color: '#059669', fontWeight: '600' }}>
                                {actualSavings.toFixed(1)}%
                              </span>
                            ) : (
                              <span style={{ color: '#9ca3af' }}>—</span>
                            )}
                          </td>

                          {/* AI Confidence */}
                          <td style={{ textAlign: 'center', padding: '0.5rem' }}>
                            {comp.ai_confidence ? (
                              <span style={{ color: comp.ai_confidence < 80 ? '#dc2626' : '#059669' }}>
                                {comp.ai_confidence}%
                                {comp.ai_confidence < 80 && ' ⚠️'}
                              </span>
                            ) : (
                              <span style={{ color: '#9ca3af' }}>N/A</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Compact insights - only show if actionable */}
              <div style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>
                {userProfile.componentOrigins.some(c => c.ai_confidence && c.ai_confidence < 80) && (
                  <span style={{ marginRight: '1.5rem' }}>
                    ⚠️ {userProfile.componentOrigins.filter(c => c.ai_confidence && c.ai_confidence < 80).length} component(s) flagged for expert review
                  </span>
                )}
                {userProfile.componentOrigins.some(c => c.savings_percentage > 5) && (
                  <span>
                    💰 Avg savings: {(userProfile.componentOrigins.reduce((sum, c) => sum + (c.savings_percentage || 0), 0) / userProfile.componentOrigins.length).toFixed(1)}%
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Executive Trade Alert Summary - ONE cohesive narrative */}
        <div className="form-section">
          <h2 className="form-section-title">Executive Trade Risk Summary</h2>

          {!alertsGenerated && (
            <div className="alert alert-info">
              <div className="alert-content">
                <div className="alert-title">Generate Your Trade Risk Analysis</div>
                <div className="text-body">
                  We'll analyze your components, trade policies, tariff exposure, and create ONE strategic recommendation backed by your real data.
                </div>
                <div className="hero-buttons" style={{ marginTop: '1rem' }}>
                  <button
                    onClick={() => loadExecutiveAlert(userProfile)}
                    className="btn-primary"
                    disabled={isLoadingAlert}
                  >
                    {isLoadingAlert ? 'Analyzing...' : 'Generate Strategic Analysis'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {isLoadingAlert && (
            <div className="alert alert-info">
              <div className="alert-content">
                <div className="alert-title">Analyzing your trade profile...</div>
                <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#4b5563' }}>
                  ⏳ Fetching policy alerts...<br/>
                  ⏳ Analyzing your components...<br/>
                  ⏳ Generating strategic recommendations...<br/>
                </div>
              </div>
            </div>
          )}

          {!isLoadingAlert && alertsGenerated && !executiveAlert && (
            <div className="alert alert-success">
              <div className="alert-content">
                <div className="alert-title">No Immediate Trade Risks Detected</div>
                <div className="text-body">
                  Your components are not currently affected by government-announced tariff changes. We monitor official sources continuously and will notify you when relevant policies are announced.
                </div>
                <div className="hero-buttons" style={{ marginTop: '1rem' }}>
                  <button
                    onClick={() => setAlertsGenerated(false)}
                    className="btn-secondary"
                  >
                    Run Analysis Again
                  </button>
                </div>
              </div>
            </div>
          )}

          {!isLoadingAlert && alertsGenerated && executiveAlert && (
            <div className="element-spacing">
              {/* Executive Alert Card */}
              <div style={{ backgroundColor: '#fff', border: '2px solid #dc2626', borderRadius: '0.75rem', padding: '2rem' }}>

                {/* Headline */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: 700, color: '#dc2626' }}>
                    {executiveAlert.headline}
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.9375rem', color: '#6b7280', fontStyle: 'italic' }}>
                    {executiveAlert.situation_brief}
                  </p>
                </div>

                {/* Executive Summary */}
                {executiveAlert.executive_summary && (
                  <div style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #e5e7eb' }}>
                    <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem', fontWeight: 600, color: '#1f2937' }}>
                      The Situation
                    </h4>
                    <div style={{ fontSize: '0.9375rem', color: '#374151', lineHeight: 1.6 }}>
                      <p style={{ margin: '0 0 0.5rem 0' }}>
                        <strong>Problem:</strong> {executiveAlert.executive_summary.problem}
                      </p>
                      <p style={{ margin: '0 0 0.5rem 0' }}>
                        <strong>Root Cause:</strong> {executiveAlert.executive_summary.root_cause}
                      </p>
                      <p style={{ margin: '0 0 0.5rem 0' }}>
                        <strong>Annual Impact:</strong> ${executiveAlert.executive_summary.impact?.toLocaleString() || 'TBD'}
                      </p>
                      <p style={{ margin: 0 }}>
                        <strong>Why Now:</strong> {executiveAlert.executive_summary.urgency}
                      </p>
                    </div>
                  </div>
                )}

                {/* Financial Impact */}
                {executiveAlert.financial_snapshot && (
                  <div style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #e5e7eb', backgroundColor: '#fef2f2', padding: '1rem', borderRadius: '0.5rem' }}>
                    <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem', fontWeight: 600, color: '#991b1b' }}>
                      💰 Financial Impact
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '0.75rem' }}>
                      <div>
                        <div style={{ fontSize: '0.8125rem', color: '#6b7280', fontWeight: 500 }}>Current Annual Burden</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#dc2626' }}>
                          ${executiveAlert.financial_snapshot.current_burden?.toLocaleString() || '0'}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.8125rem', color: '#6b7280', fontWeight: 500 }}>Potential Annual Savings</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#059669' }}>
                          ${executiveAlert.financial_snapshot.potential_savings?.toLocaleString() || '0'}
                        </div>
                      </div>
                    </div>
                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#6b7280' }}>
                      <strong>Payback Period:</strong> {executiveAlert.financial_snapshot.payback_period}
                    </p>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#6b7280' }}>
                      <strong>Confidence:</strong> {executiveAlert.financial_snapshot.confidence}
                    </p>
                  </div>
                )}

                {/* Strategic Roadmap */}
                {executiveAlert.strategic_roadmap && executiveAlert.strategic_roadmap.length > 0 && (
                  <div style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #e5e7eb' }}>
                    <h4 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 600, color: '#1f2937' }}>
                      📋 Strategic Roadmap
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {executiveAlert.strategic_roadmap.map((phase, idx) => (
                        <div key={idx} style={{ paddingLeft: '1rem', borderLeft: '3px solid #3b82f6', backgroundColor: '#f0f9ff', padding: '1rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <div>
                              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#3b82f6' }}>Phase {phase.phase}</span>
                              <h5 style={{ margin: '0.25rem 0 0 0', fontSize: '1rem', fontWeight: 600, color: '#1f2937' }}>
                                {phase.title}
                              </h5>
                            </div>
                            <span style={{ fontSize: '0.8125rem', color: '#6b7280', whiteSpace: 'nowrap', marginLeft: '1rem' }}>
                              {phase.timeline}
                            </span>
                          </div>
                          <p style={{ margin: '0.5rem 0', fontSize: '0.875rem', color: '#6b7280' }}>
                            {phase.why_matters}
                          </p>
                          {phase.actions && phase.actions.length > 0 && (
                            <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem', fontSize: '0.875rem', color: '#374151' }}>
                              {phase.actions.map((action, aIdx) => (
                                <li key={aIdx} style={{ marginBottom: '0.25rem' }}>
                                  {action}
                                </li>
                              ))}
                            </ul>
                          )}
                          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8125rem', color: '#059669', fontWeight: 600 }}>
                            Impact: {phase.impact}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action This Week */}
                {executiveAlert.action_this_week && executiveAlert.action_this_week.length > 0 && (
                  <div style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #e5e7eb', backgroundColor: '#fef3c7', padding: '1rem', borderRadius: '0.5rem' }}>
                    <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem', fontWeight: 600, color: '#92400e' }}>
                      ⚡ Action This Week
                    </h4>
                    <ul style={{ margin: 0, paddingLeft: '1.5rem', fontSize: '0.9375rem', color: '#374151' }}>
                      {executiveAlert.action_this_week.map((action, idx) => (
                        <li key={idx} style={{ marginBottom: '0.5rem' }}>
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* What Impacts Them */}
                {executiveAlert.what_impacts_them && executiveAlert.what_impacts_them.length > 0 && (
                  <div style={{ marginBottom: '1rem' }}>
                    <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem', fontWeight: 600, color: '#1f2937' }}>
                      🎯 Policies Affecting You
                    </h4>
                    <ul style={{ margin: 0, paddingLeft: '1.5rem', fontSize: '0.9375rem', color: '#374151' }}>
                      {executiveAlert.what_impacts_them.map((policy, idx) => (
                        <li key={idx} style={{ marginBottom: '0.5rem' }}>
                          {policy}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Broker Notes */}
                {executiveAlert.broker_notes && (
                  <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb', backgroundColor: '#f9fafb', padding: '1rem', borderRadius: '0.5rem', fontStyle: 'italic', fontSize: '0.9375rem', color: '#6b7280', lineHeight: 1.6 }}>
                    <strong style={{ color: '#374151' }}>From Your Broker:</strong><br/>
                    {executiveAlert.broker_notes}
                  </div>
                )}
              </div>

              {/* Email Alert Configuration */}
              {executiveAlert.email_trigger_config && (
                <div style={{ marginTop: '2rem', padding: '1.5rem', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '0.75rem' }}>
                  <h4 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 600, color: '#166534' }}>
                    📧 Email Alert Configuration
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', fontSize: '0.9375rem', color: '#374151', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={emailPreferences.should_email || false}
                        onChange={(e) => setEmailPreferences({ ...emailPreferences, should_email: e.target.checked })}
                        style={{ marginRight: '0.5rem', width: '1rem', height: '1rem', cursor: 'pointer' }}
                      />
                      Email me when {executiveAlert.email_trigger_config.trigger_level} policy changes occur
                    </label>
                    <select
                      value={emailPreferences.frequency || 'IMMEDIATE'}
                      onChange={(e) => setEmailPreferences({ ...emailPreferences, frequency: e.target.value })}
                      style={{
                        padding: '0.5rem',
                        borderRadius: '0.375rem',
                        border: '1px solid #d1d5db',
                        fontSize: '0.875rem',
                        backgroundColor: '#fff'
                      }}
                    >
                      <option value="IMMEDIATE">Send immediately</option>
                      <option value="WEEKLY_DIGEST">Weekly digest</option>
                      <option value="NEVER">Don't email</option>
                    </select>
                  </div>
                  <p style={{ margin: '0.75rem 0 0 0', fontSize: '0.8125rem', color: '#6b7280' }}>
                    We'll monitor for changes and notify you based on your preferences.
                  </p>
                </div>
              )}

              {/* Run Again */}
              <div style={{ marginTop: '1.5rem' }}>
                <button
                  onClick={() => {
                    setAlertsGenerated(false);
                    setExecutiveAlert(null);
                  }}
                  className="btn-secondary"
                >
                  Run Analysis Again
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Next Steps - After Reviewing Alerts */}
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
                  className="btn-secondary"
                  onClick={() => {
                    if (userTier === 'Trial') {
                      alert('Risk assessment download is available for paying subscribers. Upgrade to access detailed reports.');
                      window.location.href = '/pricing';
                    }
                  }}
                  disabled={userTier === 'Trial'}
                  title={userTier === 'Trial' ? 'Upgrade to download risk assessments' : ''}
                >
                  {userTier === 'Trial' ? '🔒 Download Risk Assessment (Upgrade)' : '📋 Download Risk Assessment'}
                </button>
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

        {/* Save Data Consent Modal - Privacy First with Alerts Context */}
        <SaveDataConsentModal
          isOpen={showSaveDataConsent}
          onSave={handleSaveDataConsent}
          onErase={handleEraseDataConsent}
          userProfile={pendingProfile}
          context="alerts"
        />
      </div>

      {/* Global Broker Chatbot - Available on Alerts Page */}
      <BrokerChatbot
        currentFormField="trade_alerts"
        sessionId={user ? `alerts_${user.id}` : `alerts_guest_${Date.now()}`}
      />
    </TriangleLayout>
  );
}