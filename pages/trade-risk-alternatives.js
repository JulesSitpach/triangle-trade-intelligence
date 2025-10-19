/**
 * TRADE RISK & ALTERNATIVES DASHBOARD
 * Dynamic alerts based on user's actual trade profile from workflow
 * Shows current risks and diversification strategies with team solutions
 */

import React, { useState, useEffect } from 'react';
import TriangleLayout from '../components/TriangleLayout';
import { useSimpleAuth } from '../lib/contexts/SimpleAuthContext';
import SaveDataConsentModal from '../components/shared/SaveDataConsentModal';
import PersonalizedPolicyAlert from '../components/alerts/PersonalizedPolicyAlert';
import ConsolidatedPolicyAlert from '../components/alerts/ConsolidatedPolicyAlert';
import BrokerChatbot from '../components/chatbot/BrokerChatbot';

// Import configuration from centralized config file
import TRADE_RISK_CONFIG, {
  calculateRiskImpact,
  formatCurrency
} from '../config/trade-risk-config';

export default function TradeRiskAlternatives() {
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Real policy alerts state
  const [realPolicyAlerts, setRealPolicyAlerts] = useState([]);
  const [isLoadingPolicyAlerts, setIsLoadingPolicyAlerts] = useState(false);

  // Consolidated alerts state (intelligent alert grouping)
  const [consolidatedAlerts, setConsolidatedAlerts] = useState([]);
  const [isConsolidating, setIsConsolidating] = useState(false);
  const [originalAlertCount, setOriginalAlertCount] = useState(0);

  // Save data consent modal state
  const [showSaveDataConsent, setShowSaveDataConsent] = useState(false);
  const [, setHasSaveDataConsent] = useState(false);
  const [pendingProfile, setPendingProfile] = useState(null);

  const { user } = useSimpleAuth();

  useEffect(() => {
    loadUserData();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (userProfile && userProfile.componentOrigins) {
      loadRealPolicyAlerts(userProfile);
    }
  }, [userProfile]);

  const loadUserData = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try{
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
            console.log('✅ Found alert data from database:', alert);

            // Get supplier country from component origins
            const components = alert.component_origins || [];

            // Check for schema mismatches in database data
            const hasOriginCountry = components.length > 0 && components[0].origin_country;
            const hasCountryFallback = components.length > 0 && components[0].country;

            if (components.length > 0 && !hasOriginCountry && hasCountryFallback) {
              console.warn('⚠️ Database schema mismatch: component has "country" but not "origin_country"', components[0]);

              // Log to admin dashboard (non-blocking)
              fetch('/api/admin/log-dev-issue', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  issue_type: 'schema_mismatch',
                  severity: 'medium',
                  component: 'alerts_database_loader',
                  message: 'Database component uses "country" field instead of "origin_country"',
                  context_data: {
                    alert_id: analysisId,
                    component_sample: components[0],
                    expected_field: 'origin_country',
                    found_field: 'country'
                  }
                })
              }).catch(err => console.error('Failed to log dev issue:', err));
            }

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

      // NO FALLBACKS - Expose missing data as dev issue
      const profile = {
        companyName: userData.company?.company_name || userData.company?.name,
        businessType: userData.company?.business_type,
        hsCode: userData.product?.hs_code,
        productDescription: userData.product?.description,
        tradeVolume: parsedTradeVolume,
        supplierCountry: userData.components?.[0]?.origin_country,  // Match saved key: "components"
        qualificationStatus: userData.usmca?.qualification_status,
        savings: userData.savings?.annual_savings || 0,
        componentOrigins: userData.components || []  // Match saved key: "components"
      };

      // Log missing data to admin dashboard
      const missingFields = [];
      if (!profile.companyName) missingFields.push('company_name');
      if (!profile.businessType) missingFields.push('business_type');
      if (!profile.hsCode) missingFields.push('hs_code');
      if (!profile.productDescription) missingFields.push('product_description');
      if (!profile.supplierCountry && userData.components?.length > 0) missingFields.push('component origin_country');
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
        setOriginalAlertCount(relevantAlerts.length);

        // Consolidate alerts intelligently (group related issues)
        if (relevantAlerts.length > 0) {
          await consolidateAlerts(relevantAlerts, profile);
        }
      }
    } catch (error) {
      console.error('❌ Error loading real policy alerts:', error);
      setRealPolicyAlerts([]);
    } finally {
      setIsLoadingPolicyAlerts(false);
    }
  };

  /**
   * Consolidate related alerts into intelligent groups
   * Example: 3 alerts about Chinese components → 1 consolidated "China Risk"
   */
  const consolidateAlerts = async (alerts, profile) => {
    setIsConsolidating(true);

    try {
      console.log(`🧠 Consolidating ${alerts.length} alerts...`);

      const response = await fetch('/api/consolidate-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alerts: alerts,
          user_profile: profile
        })
      });

      if (!response.ok) {
        throw new Error(`Consolidation failed: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.consolidated_alerts) {
        console.log(`✅ Consolidated ${data.original_count} alerts → ${data.consolidated_count} groups`);
        setConsolidatedAlerts(data.consolidated_alerts);
      }
    } catch (error) {
      console.error('❌ Alert consolidation failed:', error);
      // Fallback: show individual alerts if consolidation fails
      setConsolidatedAlerts([]);
    } finally {
      setIsConsolidating(false);
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

        {/* Compact Monitoring Notification */}
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

        {/* REAL Government Policy Alerts - Relevant to User's Trade Profile */}
        <div className="form-section">
          <h2 className="form-section-title">🚨 Government Policy Alerts Affecting Your Trade</h2>
          <p className="text-body">
            Real tariff and trade policy changes from official U.S. government sources that directly impact your components and supply chain.
            {consolidatedAlerts.length > 0 && originalAlertCount > consolidatedAlerts.length && (
              <span style={{ color: '#059669', fontWeight: 500 }}>
                {' '}Consolidated {originalAlertCount} related policies → {consolidatedAlerts.length} actionable alerts
              </span>
            )}
          </p>

          {(isLoadingPolicyAlerts || isConsolidating) && (
            <div className="alert alert-info">
              <div className="alert-content">
                <div className="alert-title">
                  {isConsolidating ? '🧠 Consolidating related alerts...' : 'Loading government policy alerts...'}
                  <span className="spinner-inline"></span>
                </div>
                {isConsolidating && (
                  <div className="text-body">
                    Grouping related policies and calculating consolidated impact...
                  </div>
                )}
              </div>
            </div>
          )}

          {!isLoadingPolicyAlerts && !isConsolidating && realPolicyAlerts.length === 0 && (
            <div className="alert alert-success">
              <div className="alert-content">
                <div className="alert-title">✅ No Critical Policy Changes Affecting Your Trade</div>
                <div className="text-body">
                  Great news! There are currently no government-announced tariff or policy changes that directly impact your component origins or HS codes. We monitor official sources 24/7 and will alert you immediately when relevant changes occur.
                </div>
              </div>
            </div>
          )}

          {!isLoadingPolicyAlerts && !isConsolidating && consolidatedAlerts.length > 0 && (
            <div className="element-spacing">
              {consolidatedAlerts.map((alert, idx) => (
                <ConsolidatedPolicyAlert
                  key={idx}
                  consolidatedAlert={alert}
                  userProfile={userProfile}
                />
              ))}
            </div>
          )}

          {/* Fallback: Show individual alerts if consolidation failed */}
          {!isLoadingPolicyAlerts && !isConsolidating && consolidatedAlerts.length === 0 && realPolicyAlerts.length > 0 && (
            <div className="element-spacing">
              <div className="alert alert-warning" style={{ marginBottom: '1rem' }}>
                <div className="alert-content">
                  <div className="alert-title">⚠️ Alert Consolidation Unavailable</div>
                  <div className="text-body">
                    Showing individual alerts. Smart consolidation temporarily unavailable.
                  </div>
                </div>
              </div>
              {realPolicyAlerts.map((alert, idx) => (
                <PersonalizedPolicyAlert
                  key={idx}
                  alert={alert}
                  userProfile={userProfile}
                />
              ))}
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