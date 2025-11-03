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
import RealTimeMonitoringDashboard from '../components/alerts/RealTimeMonitoringDashboard';
import BrokerChatbot from '../components/chatbot/BrokerChatbot';
import USMCAIntelligenceDisplay from '../components/alerts/USMCAIntelligenceDisplay';
import ExecutiveSummaryDisplay from '../components/workflow/results/ExecutiveSummaryDisplay';

// Import configuration from centralized config file
import TRADE_RISK_CONFIG, {
  calculateRiskImpact,
  formatCurrency
} from '../config/trade-risk-config';

// Import alert impact analysis service
// AlertImpactAnalysisService moved to server-side API endpoint: /api/alert-impact-analysis
import { getCountryConfig } from '../lib/usmca/usmca-2026-config';
import { getWorkflowData } from '../lib/services/unified-workflow-data-service';

// ✅ HELPER: Convert usmca.qualified (boolean) to qualification_status (string)
const getQualificationStatus = (usmcaData) => {
  // Try string format first (new format)
  if (usmcaData?.qualification_status) {
    return usmcaData.qualification_status;
  }
  // Fallback: convert boolean to string (old format)
  if (usmcaData?.qualified === true) return 'QUALIFIED';
  if (usmcaData?.qualified === false) return 'NOT_QUALIFIED';
  // Default
  return 'NEEDS_REVIEW';
};

export default function TradeRiskAlternatives() {
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userTier, setUserTier] = useState('Trial'); // Track subscription tier

  // Real policy alerts state
  const [realPolicyAlerts, setRealPolicyAlerts] = useState([]);
  const [isLoadingPolicyAlerts, setIsLoadingPolicyAlerts] = useState(false);

  // Consolidated alerts state (intelligent alert grouping)
  const [consolidatedAlerts, setConsolidatedAlerts] = useState([]);
  const [isConsolidating, setIsConsolidating] = useState(false);
  const [originalAlertCount, setOriginalAlertCount] = useState(0);

  // PREMIUM CONTENT: USMCA Intelligence from workflow
  const [workflowIntelligence, setWorkflowIntelligence] = useState(null);

  // Progress tracking for alert generation
  const [alertsGenerated, setAlertsGenerated] = useState(false);
  const [progressSteps, setProgressSteps] = useState([]);

  // Save data consent modal state
  const [showSaveDataConsent, setShowSaveDataConsent] = useState(false);
  const [, setHasSaveDataConsent] = useState(false);
  const [pendingProfile, setPendingProfile] = useState(null);

  // Collapsible component state (must be at component level for React hooks rules)
  const [expandedComponents, setExpandedComponents] = useState({});

  // Market Intelligence email preference (AI always uses these, user controls emails)
  const [includeMarketIntelInEmail, setIncludeMarketIntelInEmail] = useState(false);

  // Portfolio Briefing state (AI-generated strategic analysis)
  const [portfolioBriefing, setPortfolioBriefing] = useState(null);

  // Email notification preferences for each component
  const [componentEmailNotifications, setComponentEmailNotifications] = useState({});

  // Executive Alert state (strategic consulting letter)
  const [executiveAlertData, setExecutiveAlertData] = useState(null);
  const [showExecutiveAlert, setShowExecutiveAlert] = useState(false);

  // ❌ REMOVED: Alert Lifecycle Management state variables (alertHistoricalContext, recentAlertActivity)
  // These were used for unauthorized sections that displayed alerts outside Component Tariff Intelligence table

  // Toggle function for component expansion (only if alerts exist)
  const toggleExpanded = (idx, hasAlerts) => {
    if (!hasAlerts) return; // Don't expand if no alerts
    setExpandedComponents(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  // Toggle email notifications for specific component
  const toggleComponentEmailNotification = (idx) => {
    setComponentEmailNotifications(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const { user } = useSimpleAuth();

  useEffect(() => {
    loadUserData();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-load saved alerts from database on page load
  useEffect(() => {
    if (userProfile?.userId) {
      loadSavedAlerts();
    }
  }, [userProfile?.userId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-load crisis alerts from database on page load
  useEffect(() => {
    if (userProfile?.componentOrigins && userProfile.componentOrigins.length > 0) {
      console.log('📡 Auto-loading crisis alerts on page load...');
      loadRealPolicyAlerts(userProfile);
    }
  }, [userProfile?.componentOrigins?.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // ✅ DISABLED: Auto-load portfolio briefing on page load
  // Reason: Users found it confusing to see analysis auto-generate without clicking button
  // Strategic analysis should ONLY display when user explicitly clicks "Generate Analysis" button
  // This saves API costs and respects user intent
  /*
  useEffect(() => {
    if (userProfile?.companyName && userProfile?.componentOrigins?.length > 0) {
      console.log('📡 Generating portfolio briefing based on real data:', {
        companyName: userProfile.companyName,
        componentCount: userProfile.componentOrigins?.length,
        rvc: userProfile.regionalContent,
        origins: userProfile.componentOrigins?.map(c => c.origin_country)
      });

      // Load real portfolio briefing (NOT fake templates)
      loadPortfolioBriefing(userProfile);
    }
  }, [userProfile?.companyName, userProfile?.componentOrigins?.length]);
  */

  // Clear old localStorage data on page load (one-time cleanup)
  useEffect(() => {
    localStorage.removeItem('alert_impact_analysis');
    console.log('🧹 Cleared old alert impact analysis from localStorage');
  }, []); // Run once on mount

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

      // ✅ FIXED: Try localStorage FIRST (immediate), then database (backup)
      console.log('📊 Trying localStorage first...');
      await loadLocalStorageData();  // ✅ FIX: Must await async function!

      // Only load from database if localStorage failed
      if (!userProfile) {
        console.log('📊 localStorage empty, loading from database...');
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
              companyCountry: alert.company_country || 'US',
              destinationCountry: alert.destination_country || 'US',
              businessType: alert.business_type || 'Not specified',
              hsCode: alert.hs_code || 'Not classified',
              productDescription: alert.product_description || 'Product',
              tradeVolume: alert.trade_volume || 0,
              supplierCountry: primarySupplier,
              qualificationStatus: alert.qualification_status || 'NEEDS_REVIEW',
              savings: 0,
              componentOrigins: components,
              regionalContent: 0,
              recommendedAlternatives: alert.recommendations?.diversification_strategies || [],
              vulnerabilities: alert.primary_vulnerabilities || []
            };

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
          const rawComponents = mostRecentWorkflow.component_origins || [];

          // ✅ NORMALIZE: Map value_percentage → percentage for consistent access
          const components = rawComponents.map(comp => ({
            ...comp,
            percentage: comp.value_percentage || comp.percentage || 0,
            component_type: comp.description || comp.component_type,
            annual_volume: comp.annual_volume || 0
          }));

          // ✅ FIX: Fallback to JSONB workflow_data when top-level columns are NULL
          // Parse trade_volume (comes as string from database)
          const rawTradeVolume = mostRecentWorkflow.trade_volume || workflowData.company?.trade_volume;
          const parsedTradeVolume = rawTradeVolume
            ? (typeof rawTradeVolume === 'string' ? parseFloat(rawTradeVolume.replace(/,/g, '')) : rawTradeVolume)
            : 0;

          const profile = {
            userId: user?.id,
            companyName: mostRecentWorkflow.company_name || workflowData.company?.company_name,
            companyCountry: mostRecentWorkflow.company_country || workflowData.company?.company_country || 'US',
            destinationCountry: mostRecentWorkflow.destination_country || workflowData.company?.destination_country || 'US',
            businessType: mostRecentWorkflow.business_type || workflowData.company?.business_type,
            industry_sector: mostRecentWorkflow.industry_sector || workflowData.company?.industry_sector,
            hsCode: mostRecentWorkflow.hs_code || workflowData.product?.hs_code,
            productDescription: mostRecentWorkflow.product_description || workflowData.product?.description,
            tradeVolume: parsedTradeVolume,
            supplierCountry: components[0]?.origin_country || components[0]?.country,
            qualificationStatus: mostRecentWorkflow.qualification_status || getQualificationStatus(workflowData.usmca),
            savings: mostRecentWorkflow.estimated_annual_savings || workflowData.savings?.annual_savings || 0,
            componentOrigins: components,
            regionalContent: workflowData.usmca?.regional_content || 0
          };

          console.log('✅ Loaded user profile from database:', {
            companyName: profile.companyName,
            tradeVolume: profile.tradeVolume,
            hasTradeVolume: !!profile.tradeVolume,
            componentCount: components.length,
            componentPercentages: components.map(c => `${c.component_type}: ${c.percentage}%`)
          });

          // Extract rich workflow intelligence if available
          if (workflowData.recommendations || workflowData.detailed_analysis) {
            console.log('✅ Found rich workflow intelligence in database');
            setWorkflowIntelligence({
              recommendations: workflowData.recommendations || [],
              detailed_analysis: workflowData.detailed_analysis || {},
              compliance_roadmap: workflowData.compliance_roadmap || {},
              risk_mitigation: workflowData.risk_mitigation || {},
              confidence_score: workflowData.confidence_score || 0,
              confidence_factors: workflowData.confidence_factors || {}
            });
          }

          setUserProfile(profile);
          setIsLoading(false);
          return;
        } else {
          console.warn('⚠️ No workflows found in database');
        }
      } else {
        console.error('❌ Dashboard data fetch failed:', response.status, response.statusText);
      }
    }  // Close if (!userProfile) block
    } catch (error) {
      console.error('Error loading trade profile:', error);
      // Fallback to localStorage (current session)
      console.log('🔄 Falling back to localStorage data');
      loadLocalStorageData();
    }
  };


  const loadLocalStorageData = async () => {
    // Fetch user subscription tier
    // Get authenticated user ID for database lookup
    let userId = null;
    try {
      const authResponse = await fetch('/api/auth/me', { credentials: 'include' });
      if (authResponse.ok) {
        const authData = await authResponse.json();
        userId = authData.user?.id;
        setUserTier(authData.user?.subscription_tier || 'Trial');
      }
    } catch (error) {
      console.error('Failed to fetch user tier:', error);
    }

    // 🔄 UNIFIED DATA ACCESS: Get workflow data (database-first, localStorage fallback)
    // ✅ FIX: Get actual session_id from localStorage, not userId
    const sessionId = typeof window !== 'undefined' ? localStorage.getItem('workflow_session_id') : null;
    console.log(`[TradeRiskAlternatives] Looking for sessionId: ${sessionId}`);

    let userData = await getWorkflowData(sessionId);

    // ✅ FALLBACK: If no session_id in localStorage, try loading from usmca_workflow_results
    if (!userData && typeof window !== 'undefined') {
      console.log('[TradeRiskAlternatives] No session_id found, trying usmca_workflow_results...');
      const cachedResults = localStorage.getItem('usmca_workflow_results');
      if (cachedResults) {
        try {
          userData = JSON.parse(cachedResults);
          userData.source = 'localStorage_cache';
          console.log('[TradeRiskAlternatives] ✅ Loaded from usmca_workflow_results cache');
        } catch (e) {
          console.error('[TradeRiskAlternatives] Failed to parse cached results:', e);
        }
      }
    }

    if (!userData) {
      console.log('[TradeRiskAlternatives] No workflow data found (checked DB + localStorage)');
      setIsLoading(false);
      return;
    }

    console.log(`[TradeRiskAlternatives] Loaded workflow data from ${userData.source || 'database'}`);

    // ✅ CRITICAL FIX: Normalize database row structure vs localStorage structure
    // Database returns: { id, user_id, data: { company, components, ... } }
    // localStorage returns: { company, components, ... }
    if (userData.data && typeof userData.data === 'object') {
      console.log('[TradeRiskAlternatives] Normalizing database row structure - extracting userData.data');
      userData = {
        ...userData.data,  // Spread the nested workflow data
        source: 'database'
      };
    }

    // Clear old test data if found
    if (userData.company?.name?.includes('Tropical Harvest')) {
      console.log('Found old test data, clearing...');
      if (typeof window !== 'undefined') {
        localStorage.removeItem('usmca_workflow_results');
        localStorage.removeItem('triangleUserData');
      }
      setIsLoading(false);
      return;
    }

    if (userData) {
      // Parse trade volume - handle string with commas like "12,000,000"
      // ✅ FIX: Handle BOTH nested (userData.company.trade_volume) and flat (userData.trade_volume) structures
      const rawTradeVolume = userData.company?.trade_volume || userData.trade_volume || 0;
      const parsedTradeVolume = typeof rawTradeVolume === 'string'
        ? parseFloat(rawTradeVolume.replace(/,/g, ''))
        : rawTradeVolume;

      // NO FALLBACKS - Expose missing data as dev issue
      // CRITICAL FIX: Components are saved under BOTH structures depending on source
      // - Database: usmca.component_breakdown
      // - localStorage (flat): component_origins
      const components = userData.usmca?.component_breakdown || userData.component_origins || userData.components || [];

      // ✅ FIX: Map BOTH nested (userData.company.*) AND flat (userData.*) data structures
      // This handles data from database (nested) and localStorage (flat) equivalently
      const profile = {
        userId: user?.id,  // Include userId for workflow intelligence lookup
        // Try nested structure first (database), then flat structure (localStorage)
        companyName: userData.company?.company_name || userData.company_name || userData.company?.name,
        companyCountry: userData.company?.company_country || userData.company_country || 'US',
        destinationCountry: userData.company?.destination_country || userData.destination_country || 'US',
        businessType: userData.company?.business_type || userData.business_type,
        industry_sector: userData.company?.industry_sector || userData.industry_sector,
        hsCode: userData.product?.hs_code || userData.hs_code,
        productDescription: userData.product?.description || userData.product_description,
        tradeVolume: parsedTradeVolume,
        supplierCountry: components[0]?.origin_country || components[0]?.country,  // Try both keys
        qualificationStatus:
          userData.qualification_status ||      // Flat: from database column
          getQualificationStatus(userData.usmca) || // Nested: from usmca object
          'NEEDS_REVIEW',                         // Default
        savings: userData.savings?.annual_savings || 0,
        componentOrigins: components,  // Fixed: use usmca.component_breakdown or component_origins
        regionalContent: userData.usmca?.regional_content || 0
      };

      // 🎯 EXTRACT RICH WORKFLOW INTELLIGENCE (Premium content for Professional/Premium tiers)
      // This is the GOLD that subscribers pay $99-599/month for!
      if (userData.recommendations || userData.detailed_analysis || userData.compliance_roadmap) {
        console.log('✅ Found rich workflow intelligence - setting premium content');
        setWorkflowIntelligence({
          recommendations: userData.recommendations || [],
          detailed_analysis: userData.detailed_analysis || {},
          compliance_roadmap: userData.compliance_roadmap || {},
          risk_mitigation: userData.risk_mitigation || {},
          confidence_score: userData.confidence_score || 0,
          confidence_factors: userData.confidence_factors || {}
        });
      } else {
        console.log('⚠️ No workflow intelligence found in localStorage - user may need to re-run workflow');
      }

      // ✅ SMART VALIDATION: Only log errors if data exists but is incomplete
      // If userData is completely empty, that's expected (user hasn't completed workflow yet)
      const hasAnyData = !!profile.companyName || !!profile.hsCode || components.length > 0;

      if (hasAnyData) {
        // Data exists but might be incomplete - log missing CRITICAL fields only
        const missingCriticalFields = [];
        if (!profile.companyName) missingCriticalFields.push('company_name');
        if (!profile.hsCode) missingCriticalFields.push('hs_code');
        if (profile.componentOrigins.length === 0) missingCriticalFields.push('component_origins');

        if (missingCriticalFields.length > 0) {
          console.warn('⚠️ INCOMPLETE WORKFLOW DATA: User started workflow but missing critical fields', {
            missing_critical_fields: missingCriticalFields,
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
              issue_type: 'incomplete_workflow_data',
              severity: 'warning',
              component: 'trade_alerts_page',
              message: `User started workflow but missing ${missingCriticalFields.length} critical fields`,
              context_data: {
                missing_critical_fields: missingCriticalFields,
                userData_structure: {
                  company_keys: userData.company ? Object.keys(userData.company) : [],
                  product_keys: userData.product ? Object.keys(userData.product) : [],
                  usmca_keys: userData.usmca ? Object.keys(userData.usmca) : [],
                  components_count: userData.components?.length || 0
                }
              }
            })
          }).catch(err => console.error('Failed to log dev issue:', err));
        } else {
          console.log('✅ Complete workflow data loaded for alerts page');
        }
      } else {
        // No data at all - this is expected for new users
        console.log('ℹ️ No workflow data found - user needs to complete workflow first');
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
        console.log('✅ User previously consented to save - data already in workflow_sessions');
        setHasSaveDataConsent(true); // Used to control detailed consent display
        // Removed saveTradeProfile() - workflow data already saved via workflow_sessions
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

  // Handle user choosing to SAVE their data
  const handleSaveDataConsent = async () => {
    console.log('✅ User chose to SAVE data for alerts and services');

    // Save consent choice
    localStorage.setItem('save_data_consent', 'save');
    setHasSaveDataConsent(true);
    setShowSaveDataConsent(false);

    // Workflow data already saved via workflow_sessions - no additional save needed
    setPendingProfile(null);
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
   * REMOVED: handleSaveAlertAnalysis function
   * Portfolio briefing now auto-saves after generation (no manual button needed)
   * See loadPortfolioBriefing() line 847-866 for auto-save implementation
   */

  /**
   * Load saved alerts from database (fast, no AI calls)
   * NOW INCLUDES: Alert lifecycle status, historical context, recent activity
   */
  const loadSavedAlerts = async () => {
    try {
      const response = await fetch('/api/dashboard-data', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();

        if (data.alerts && data.alerts.length > 0) {
          console.log(`✅ Loaded ${data.alerts.length} saved alerts from database`);
          setConsolidatedAlerts(data.alerts);
          setOriginalAlertCount(data.alerts.length);
          setAlertsGenerated(true);
        } else {
          console.log('ℹ️ No saved alerts found - user needs to generate');
        }

        // ❌ REMOVED: Loading alert lifecycle data (recentAlertActivity, alertHistoricalContext)
        // These sections were removed per user request - alerts should ONLY appear in Component Tariff Intelligence table
      }
    } catch (error) {
      console.error('⚠️ Failed to load saved alerts:', error);
    }
  };

  /**
   * DEAD CODE: Disabled - dashboard_notifications table doesn't exist
   * Alerts are already loaded from crisis_alerts + user_alert_tracking
   */
  const saveAlertsToDatabase = async (alerts) => {
    // Table doesn't exist - this was an optimization that's no longer needed
    return;
    /* DEAD CODE BELOW
    try {
      const response = await fetch('/api/save-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          alerts: alerts,
          user_profile: userProfile
        })
      });

      if (response.ok) {
        console.log('✅ Alerts saved to database for future visits');
      } else {
        console.warn('⚠️ Failed to save alerts to database:', response.status);
      }
    } catch (error) {
      console.error('❌ Error saving alerts:', error);
    }
    */
  };

  /**
   * ✅ ALERT LIFECYCLE: Update alert status (RESOLVED, ARCHIVED, etc.)
   */
  const updateAlertStatus = async (alertId, status, resolutionData = {}) => {
    try {
      const response = await fetch('/api/alert-status-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          crisis_alert_id: alertId,
          status,
          ...resolutionData  // resolution_notes, estimated_cost_impact, actions_taken
        })
      });

      if (response.ok) {
        console.log(`✅ Alert ${alertId} status updated to ${status}`);

        // Reload alerts to reflect new status
        await loadSavedAlerts();

        return true;
      } else {
        console.error('⚠️ Failed to update alert status:', response.status);
        return false;
      }
    } catch (error) {
      console.error('❌ Error updating alert status:', error);
      return false;
    }
  };

  /**
   * ✅ ALERT LIFECYCLE: Mark alert as resolved (with user confirmation)
   */
  const handleResolveAlert = async (alert) => {
    const confirmed = confirm(`Mark this alert as RESOLVED?\n\n"${alert.title || alert.consolidated_title}"\n\nOptionally, add resolution notes on the next screen.`);

    if (!confirmed) return;

    // Prompt for optional resolution details
    const notes = prompt('Resolution notes (optional):\nHow did you address this alert?');
    const costImpact = prompt('Estimated cost prevented (optional):\nEnter dollar amount (e.g., 5000)');

    const resolutionData = {};
    if (notes) resolutionData.resolution_notes = notes;
    if (costImpact && !isNaN(parseFloat(costImpact))) {
      resolutionData.estimated_cost_impact = parseFloat(costImpact);
    }

    const success = await updateAlertStatus(alert.id, 'RESOLVED', resolutionData);

    if (success) {
      alert('✅ Alert marked as RESOLVED!\n\nIt will be moved to your resolution history.');
    }
  };

  /**
   * ✅ ALERT LIFECYCLE: Archive alert (hide from view)
   */
  const handleArchiveAlert = async (alert) => {
    const confirmed = confirm(`Archive this alert?\n\n"${alert.title || alert.consolidated_title}"\n\nArchived alerts are hidden from your dashboard but can be viewed in Recent Activity.`);

    if (!confirmed) return;

    const success = await updateAlertStatus(alert.id, 'ARCHIVED');

    if (success) {
      alert('✅ Alert archived!\n\nIt will no longer appear in your active alerts.');
    }
  };

  /**
   * Load REAL tariff policy alerts from database
   * Filters by user's component origins and HS codes for relevance
   * Now called on-demand with progress tracking
   */

  /**
   * Load real portfolio briefing based on actual workflow data + real policy alerts
   * Analyzes supply chain against USMCA 2026 renegotiation
   * Matches to real policy announcements from crisis_alerts (not templates)
   */
  const loadPortfolioBriefing = async (profile) => {
    setIsLoadingPolicyAlerts(true);
    setProgressSteps([]);

    try {
      setProgressSteps(prev => [...prev, 'Analyzing your portfolio...']);
      console.log('🔄 Loading real portfolio briefing with actual data...');

      // STEP 1: Fetch all active crisis alerts from database
      setProgressSteps(prev => [...prev, 'Loading active policy alerts...']);
      console.log('📡 Fetching crisis alerts from /api/get-crisis-alerts...');

      const alertsResponse = await fetch('/api/get-crisis-alerts', {
        method: 'GET',
        credentials: 'include'
      });

      console.log('📊 Crisis alerts fetch response:', {
        ok: alertsResponse.ok,
        status: alertsResponse.status,
        statusText: alertsResponse.statusText
      });

      let crisisAlerts = [];
      if (alertsResponse.ok) {
        const alertsData = await alertsResponse.json();
        crisisAlerts = alertsData.alerts || [];
        console.log(`✅ Fetched ${crisisAlerts.length} active crisis alerts:`, crisisAlerts.map(a => ({
          title: a.title,
          countries: a.affected_countries,
          hs_codes: a.affected_hs_codes
        })));

        // Store alerts in state so component table can match them
        setRealPolicyAlerts(crisisAlerts);
      } else {
        const errorText = await alertsResponse.text();
        console.error('❌ Crisis alerts fetch failed:', errorText);
        console.warn('⚠️ Could not fetch crisis alerts, will proceed without them');
      }

      // Build workflow data structure - components already normalized with percentage field
      const workflowData = {
        company: {
          name: profile.companyName,
          country: profile.companyCountry || 'US'
        },
        components: (profile.componentOrigins || []).map(comp => ({
          component_type: comp.component_type || comp.description,
          description: comp.description || comp.component_type,
          hs_code: comp.hs_code,
          origin_country: comp.origin_country || comp.country,
          country: comp.origin_country || comp.country,
          annual_volume: comp.annual_volume || 0,
          percentage: comp.percentage || 0  // Already normalized from value_percentage
        }))
      };

      console.log('📤 Sending to API:', {
        company: workflowData.company.name,
        componentCount: workflowData.components.length,
        components: workflowData.components.map(c => ({
          name: c.component_type,
          origin: c.origin_country,
          percentage: c.percentage
        }))
      });

      setProgressSteps(prev => [...prev, 'Generating portfolio briefing...']);

      // STEP 2: Call portfolio briefing API with component data
      const response = await fetch('/api/generate-portfolio-briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          workflow_data: workflowData,
          user_id: user?.id
        })
      });

      if (!response.ok) {
        throw new Error(`Portfolio briefing failed: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.briefing) {
        console.log(`✅ Portfolio briefing generated (${data.real_alerts_matched} real alerts matched)`);
        setProgressSteps(prev => [...prev, 'Briefing complete']);

        // Save the AI-generated briefing to state for display
        setPortfolioBriefing(data.briefing);

        // ✅ AUTO-SAVE: Save portfolio briefing to database automatically
        // No manual button needed - user already consented by completing workflow
        try {
          await fetch('/api/workflow-session/update-executive-alert', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              detailed_analysis: {
                portfolio_briefing: data.briefing,
                policy_alerts: data.matched_alerts || [],
                generated_at: new Date().toISOString()
              }
            })
          });
          console.log('✅ Portfolio briefing auto-saved to database');
        } catch (saveError) {
          console.error('⚠️ Auto-save failed (non-critical):', saveError);
          // Don't block UI - briefing still displays from state
        }

        console.log('📚 Portfolio briefing loaded and ready for user to view');
        setAlertsGenerated(true);
      } else {
        console.log('❌ Failed to generate briefing');
        setProgressSteps(prev => [...prev, 'Briefing generation failed']);
        setPortfolioBriefing(null);
        setAlertsGenerated(true);
      }
    } catch (error) {
      console.error('❌ Portfolio briefing failed:', error);
      setProgressSteps(prev => [...prev, 'Error generating briefing']);
      setAlertsGenerated(true);
    } finally {
      setIsLoadingPolicyAlerts(false);
    }
  };

  const loadRealPolicyAlerts = async (profile) => {
    setIsLoadingPolicyAlerts(true);
    setProgressSteps([]);

    try {
      // Fetch crisis alerts directly from database
      setProgressSteps(prev => [...prev, 'Loading active policy alerts...']);

      const response = await fetch('/api/get-crisis-alerts', {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch crisis alerts: ${response.status}`);
      }

      const data = await response.json();
      const alerts = data.alerts || [];

      console.log(`✅ Fetched ${alerts.length} crisis alerts:`, alerts.map(a => ({
        title: a.title,
        countries: a.affected_countries,
        hs_codes: a.affected_hs_codes
      })));

      setRealPolicyAlerts(alerts);
      setOriginalAlertCount(alerts.length);

      if (alerts.length > 0) {
        setProgressSteps(prev => [...prev, `Found ${alerts.length} policy alerts`]);
        // ✅ DISABLED AUTO-CONSOLIDATION: Don't generate broker summaries automatically
        // User found this annoying - only consolidate when they explicitly click button
        // await consolidateAlerts(alerts, profile);
      } else {
        setProgressSteps(prev => [...prev, 'No active policy alerts']);
      }

      setProgressSteps(prev => [...prev, 'Analysis complete']);
      setAlertsGenerated(true);
    } catch (error) {
      console.error('Error loading crisis alerts:', error);
      setRealPolicyAlerts([]);
      setProgressSteps(prev => [...prev, 'Error loading alerts']);
      setAlertsGenerated(true);
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

        // Save alerts to database for fast loading on future visits
        await saveAlertsToDatabase(data.consolidated_alerts);
      }
    } catch (error) {
      console.error('❌ Alert consolidation failed:', error);
      // Fallback: show individual alerts if consolidation fails
      setConsolidatedAlerts([]);
    } finally {
      setIsConsolidating(false);
    }
  };

  // REMOVED: generatePersonalizedUSMCA2026Analysis function
  // This was redundant with loadPortfolioBriefing API (/api/generate-portfolio-briefing)
  // Both endpoints generated the same analysis. Consolidated to single unified API.
  // Button now calls loadPortfolioBriefing instead (same functionality, one endpoint)

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

        {/* Real-Time Monitoring Dashboard - Shows what's being monitored */}
        <RealTimeMonitoringDashboard userProfile={userProfile} />

        {/* 🎯 PREMIUM CONTENT: Rich USMCA Intelligence */}
        {workflowIntelligence && (
          <USMCAIntelligenceDisplay workflowIntelligence={workflowIntelligence} />
        )}

        {/* 📊 EXECUTIVE TRADE ADVISORY: Removed auto-display - user must click button to view */}

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

          {/* ❌ REMOVED: "Alert Resolution History" Stats Section
              - Alerts should ONLY appear in Component Tariff Intelligence table
              - Per user: "romove that table and place the alerts in the proper componetn that it might affect"
          */}

          {/* Component Intelligence - Collapsible rows with component-specific alerts */}
          {userProfile.componentOrigins && userProfile.componentOrigins.length > 0 && (
            <div className="element-spacing">
                <h3 className="card-title">Component Tariff Intelligence</h3>
                <p className="text-body">
                  Click any component with alerts to see tariff details and policy impacts:
                </p>

                {/* DEBUG: Alert Matching Status */}
                {(() => {
                  console.log('🔍 COMPONENT TABLE DEBUG:', {
                    realPolicyAlerts: realPolicyAlerts?.length || 0,
                    consolidatedAlerts: consolidatedAlerts.length,
                    alertsGenerated,
                    realAlertsData: realPolicyAlerts?.map(a => ({
                      title: a.title,
                      affected_countries: a.affected_countries,
                      affected_hs_codes: a.affected_hs_codes,
                      severity: a.severity
                    })),
                    componentsArray: userProfile.componentOrigins.map(c => ({
                      name: c.component_type || c.description,
                      hs: c.hs_code,
                      origin: c.origin_country || c.country
                    }))
                  });
                  return null;
                })()}

                {/* Table Header */}
                <div style={{
                  marginTop: '1rem',
                  padding: '0.75rem 1rem',
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px 8px 0 0',
                  border: '1px solid #e5e7eb',
                  borderBottom: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem'
                }}>
                  <div style={{ width: '1.25rem' }}></div> {/* Spacer for expand icon */}
                  <div style={{ flex: '2', fontWeight: 600, fontSize: '0.8125rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Component
                  </div>
                  <div style={{ flex: '1', textAlign: 'center', fontWeight: 600, fontSize: '0.8125rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Origin
                  </div>
                  <div style={{ flex: '1', textAlign: 'center', fontWeight: 600, fontSize: '0.8125rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    HS Code
                  </div>
                  <div style={{ flex: '1', textAlign: 'center', fontWeight: 600, fontSize: '0.8125rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Value %
                  </div>
                  <div style={{ flex: '1', textAlign: 'center', fontWeight: 600, fontSize: '0.8125rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Alerts
                  </div>
                  <div style={{ flex: '0.75', textAlign: 'center', fontWeight: 600, fontSize: '0.8125rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Email
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                  {userProfile.componentOrigins.map((comp, idx) => {
                  const baseMFN = comp.mfn_rate || comp.tariff_rates?.mfn_rate || 0;
                  const section301 = comp.section_301 || comp.tariff_rates?.section_301 || 0;
                  const totalRate = comp.total_rate || comp.tariff_rates?.total_rate || baseMFN;
                  const usmcaRate = comp.usmca_rate || comp.tariff_rates?.usmca_rate || 0;
                  const netAfterUSMCA = totalRate - (baseMFN - usmcaRate);
                  const actualSavings = baseMFN - usmcaRate;

                  // Filter alerts for this specific component
                  // BROADER MATCHING: Every component gets tagged with ALL applicable alerts
                  // - Blanket country tariffs (NULL HS codes + origin match)
                  // - Industry-wide tariffs (industry match + origin match)
                  // - Specific tariffs (HS code + origin match)
                  // ✅ Use realPolicyAlerts (raw database alerts) not consolidatedAlerts (reformatted)
                  // because consolidation changes the alert structure and loses the matching fields
                  const componentAlerts = (realPolicyAlerts || consolidatedAlerts).filter(alert => {
                    const componentOrigin = (comp.origin_country || comp.country)?.toUpperCase();
                    const componentHS = comp.hs_code;
                    const componentIndustry = comp.industry || userProfile.industry_sector;

                    // Check origin match
                    const originMatch = alert.affected_countries?.some(country =>
                      componentOrigin === country.toUpperCase()
                    );

                    // Check HS code match (NULL or EMPTY ARRAY = matches all)
                    const isBlanketHS = !alert.affected_hs_codes ||
                                       alert.affected_hs_codes.length === 0;

                    const hsMatch = isBlanketHS
                      ? true
                      : alert.affected_hs_codes?.some(code => {
                          const normalizedComponentHS = componentHS?.replace(/\./g, '');
                          const normalizedAlertCode = code.replace(/\./g, '').substring(0, 6);
                          return normalizedComponentHS?.startsWith(normalizedAlertCode);
                        });

                    // Check industry match (NULL or EMPTY ARRAY = matches all)
                    const isBlanketIndustry = !alert.relevant_industries ||
                                             alert.relevant_industries.length === 0;

                    const industryMatch = isBlanketIndustry
                      ? true
                      : alert.relevant_industries?.some(industry =>
                          componentIndustry?.toLowerCase().includes(industry.toLowerCase())
                        );

                    // TYPE 1: Blanket country tariff (EMPTY/NULL HS codes + origin match)
                    if (isBlanketHS && originMatch) {
                      console.log(`✅ BLANKET ALERT MATCH: ${alert.title} affects ${comp.component_type || comp.description} from ${componentOrigin}`);
                      return true;
                    }

                    // TYPE 2: Industry tariff (industry match + origin match)
                    if (industryMatch && originMatch && !isBlanketIndustry) {
                      console.log(`✅ INDUSTRY ALERT MATCH: ${alert.title} affects ${comp.component_type || comp.description}`);
                      return true;
                    }

                    // TYPE 3: Specific tariff (HS + origin match)
                    if (hsMatch && originMatch && !isBlanketHS) {
                      console.log(`✅ HS CODE ALERT MATCH: ${alert.title} affects ${comp.component_type || comp.description}`);
                      return true;
                    }

                    return false;
                  });

                  const isExpanded = expandedComponents[idx] || false;
                  const hasAlerts = componentAlerts.length > 0;
                  const emailEnabled = componentEmailNotifications[idx] || false;

                  const isLastRow = idx === userProfile.componentOrigins.length - 1;

                  return (
                    <div key={idx} style={{
                      border: '1px solid #e5e7eb',
                      borderTop: idx === 0 ? 'none' : '1px solid #e5e7eb',
                      borderRadius: isLastRow && !isExpanded ? '0 0 8px 8px' : '0',
                      backgroundColor: 'white',
                      overflow: 'hidden'
                    }}>
                      {/* Collapsed Header - Always visible */}
                      <div
                        onClick={() => toggleExpanded(idx, hasAlerts)}
                        style={{
                          padding: '1rem',
                          cursor: hasAlerts ? 'pointer' : 'not-allowed',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1rem',
                          backgroundColor: isExpanded ? '#f9fafb' : 'white',
                          transition: 'background-color 0.2s',
                          opacity: hasAlerts ? 1 : 0.6
                        }}
                      >
                        {/* Expand/Collapse Icon */}
                        <span style={{
                          fontSize: '1.25rem',
                          color: hasAlerts ? '#6b7280' : '#d1d5db',
                          width: '1.25rem',
                          textAlign: 'center'
                        }}>
                          {hasAlerts ? (isExpanded ? '▼' : '▶') : '—'}
                        </span>

                        {/* Component Name */}
                        <div style={{ flex: '2', fontWeight: 600, color: '#111827' }}>
                          {comp.component_type || comp.description || `Component ${idx + 1}`}
                        </div>

                        {/* Origin Country */}
                        <div style={{ flex: '1', textAlign: 'center', color: '#6b7280', fontFamily: 'monospace' }}>
                          {comp.origin_country || comp.country}
                        </div>

                        {/* HS Code */}
                        <div style={{ flex: '1', textAlign: 'center', fontFamily: 'monospace', fontSize: '0.875rem', color: '#6b7280' }}>
                          {comp.hs_code || '—'}
                        </div>

                        {/* Value Percentage */}
                        <div style={{ flex: '1', textAlign: 'center', fontWeight: 600, color: '#111827' }}>
                          {comp.percentage || comp.value_percentage}%
                        </div>

                        {/* Alert Badge */}
                        <div style={{ flex: '1', textAlign: 'center' }}>
                          {componentAlerts.length > 0 ? (
                            <span style={{
                              background: '#fee2e2',
                              color: '#dc2626',
                              padding: '0.25rem 0.75rem',
                              borderRadius: '12px',
                              fontSize: '0.8125rem',
                              fontWeight: 600
                            }}>
                              🚨 {componentAlerts.length} alert{componentAlerts.length !== 1 ? 's' : ''}
                            </span>
                          ) : (
                            <span style={{
                              background: '#dcfce7',
                              color: '#059669',
                              padding: '0.25rem 0.75rem',
                              borderRadius: '12px',
                              fontSize: '0.8125rem',
                              fontWeight: 600
                            }}>
                              ✅ No alerts
                            </span>
                          )}
                        </div>

                        {/* Email Notification Checkbox - Show for ALL components (alerts might come in future) */}
                        <div style={{ flex: '0.75', textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={emailEnabled}
                            onChange={(e) => {
                              e.stopPropagation(); // Prevent row expansion when clicking checkbox
                              toggleComponentEmailNotification(idx);
                            }}
                            style={{
                              width: '18px',
                              height: '18px',
                              cursor: 'pointer'
                            }}
                            title="Receive email notifications for future alerts affecting this component"
                          />
                        </div>
                      </div>

                      {/* Expanded Content - Alerts Only */}
                      {isExpanded && (
                        <div style={{ padding: '1.5rem', borderTop: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
                          {/* Component-Specific Alerts */}
                          {componentAlerts.length > 0 && (
                            <div>
                              <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '0.75rem', color: '#111827' }}>
                                🚨 Alerts for This Component ({componentAlerts.length})
                              </h4>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {componentAlerts.map((alert, alertIdx) => {
                                  // Determine severity color
                                  const severity = alert.severity || alert.urgency || 'medium';
                                  const severityColor =
                                    severity === 'critical' ? '#dc2626' :
                                    severity === 'high' ? '#ea580c' :
                                    severity === 'medium' ? '#f59e0b' :
                                    severity === 'low' ? '#059669' : '#6b7280';

                                  const borderColor =
                                    severity === 'critical' ? '#fecaca' :
                                    severity === 'high' ? '#fed7aa' :
                                    severity === 'medium' ? '#fef3c7' :
                                    severity === 'low' ? '#dcfce7' : '#e5e7eb';

                                  return (
                                  <div key={alertIdx} style={{
                                    background: 'white',
                                    border: `2px solid ${borderColor}`,
                                    borderLeft: `5px solid ${severityColor}`,
                                    borderRadius: '6px',
                                    padding: '1rem',
                                    opacity: alert.lifecycle_status === 'RESOLVED' ? 0.7 : 1
                                  }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                                      <div style={{ fontWeight: 600, color: '#111827', fontSize: '0.9375rem', flex: 1 }}>
                                        {alert.consolidated_title || alert.title}
                                      </div>
                                      <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                                        {/* ✅ STATUS BADGE - NEW/UPDATED/RESOLVED */}
                                        <span style={{
                                          background: alert.lifecycle_status === 'NEW' ? '#3b82f6' :
                                                      alert.lifecycle_status === 'UPDATED' ? '#8b5cf6' :
                                                      alert.lifecycle_status === 'RESOLVED' ? '#059669' : '#3b82f6',
                                          color: 'white',
                                          padding: '0.25rem 0.75rem',
                                          borderRadius: '12px',
                                          fontSize: '0.75rem',
                                          fontWeight: 700,
                                          textTransform: 'uppercase'
                                        }}>
                                          {alert.lifecycle_status === 'NEW' ? '🆕 NEW' :
                                           alert.lifecycle_status === 'UPDATED' ? '🔄 UPDATED' :
                                           alert.lifecycle_status === 'RESOLVED' ? '✅ RESOLVED' : '🆕 NEW'}
                                        </span>
                                        {/* SEVERITY BADGE - CRITICAL/HIGH/MEDIUM/LOW */}
                                        <span style={{
                                          background: severityColor,
                                          color: 'white',
                                          padding: '0.25rem 0.75rem',
                                          borderRadius: '12px',
                                          fontSize: '0.75rem',
                                          fontWeight: 700,
                                          textTransform: 'uppercase'
                                        }}>
                                          {severity === 'critical' ? '🔴 CRITICAL' :
                                           severity === 'high' ? '🟠 HIGH' :
                                           severity === 'medium' ? '🟡 MEDIUM' :
                                           severity === 'low' ? '🟢 LOW' : '⚪ UNKNOWN'}
                                        </span>
                                      </div>
                                    </div>
                                    <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                                      {alert.explanation || alert.description}
                                    </div>
                                    {alert.broker_summary && (
                                      <div style={{ fontSize: '0.875rem', color: '#374151', fontWeight: 500, marginBottom: '0.75rem' }}>
                                        💡 {alert.broker_summary}
                                      </div>
                                    )}

                                    {/* ✅ ALERT ACTION BUTTONS (Resolve/Archive) */}
                                    {alert.lifecycle_status !== 'RESOLVED' && alert.lifecycle_status !== 'ARCHIVED' && (
                                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleResolveAlert(alert);
                                          }}
                                          style={{
                                            background: '#059669',
                                            color: 'white',
                                            border: 'none',
                                            padding: '0.375rem 0.75rem',
                                            borderRadius: '6px',
                                            fontSize: '0.75rem',
                                            fontWeight: 600,
                                            cursor: 'pointer'
                                          }}
                                        >
                                          ✅ Mark Resolved
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleArchiveAlert(alert);
                                          }}
                                          style={{
                                            background: '#6b7280',
                                            color: 'white',
                                            border: 'none',
                                            padding: '0.375rem 0.75rem',
                                            borderRadius: '6px',
                                            fontSize: '0.75rem',
                                            fontWeight: 600,
                                            cursor: 'pointer'
                                          }}
                                        >
                                          📦 Archive
                                        </button>
                                      </div>
                                    )}

                                    {/* Show resolution notes if resolved */}
                                    {alert.lifecycle_status === 'RESOLVED' && alert.resolution_notes && (
                                      <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#dcfce7', borderRadius: '6px' }}>
                                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#059669', marginBottom: '0.25rem' }}>
                                          ✅ Resolution Notes:
                                        </div>
                                        <div style={{ fontSize: '0.8125rem', color: '#166534' }}>
                                          {alert.resolution_notes}
                                        </div>
                                        {alert.estimated_cost_impact && (
                                          <div style={{ fontSize: '0.75rem', color: '#059669', marginTop: '0.25rem', fontWeight: 600 }}>
                                            Cost Impact Prevented: ${alert.estimated_cost_impact.toLocaleString()}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Market Intelligence Row - Strategic context for AI (always used, user controls email) */}
                {(() => {
                  // Filter for market intelligence alerts (UNSPECIFIED country or general context)
                  // BUT only include if relevant to user's business (country mentions, industry, trade keywords)
                  const userCountries = [...new Set(
                    userProfile.componentOrigins.map(c => (c.origin_country || c.country)?.toUpperCase())
                  )].filter(Boolean);

                  const userIndustry = userProfile.industry_sector?.toLowerCase() || '';

                  const marketIntelAlerts = (realPolicyAlerts || []).filter(alert => {
                    // Must be general/UNSPECIFIED
                    const isGeneral = alert.affected_countries?.includes('UNSPECIFIED') ||
                                     (!alert.affected_countries || alert.affected_countries.length === 0);

                    if (!isGeneral) return false;

                    // Filter for relevance to user's business
                    const title = alert.title?.toLowerCase() || '';
                    const description = alert.description?.toLowerCase() || '';
                    const text = `${title} ${description}`;

                    // RELEVANT: Mentions user's sourcing countries
                    const mentionsUserCountry = userCountries.some(country => {
                      const countryNames = {
                        'CN': ['china', 'chinese', 'beijing'],
                        'MX': ['mexico', 'mexican'],
                        'CA': ['canada', 'canadian'],
                        'US': ['united states', 'u.s.', 'usa', 'american']
                      };
                      return (countryNames[country] || []).some(name => text.includes(name));
                    });

                    // RELEVANT: Trade/supply chain keywords
                    const tradeKeywords = [
                      'tariff', 'trade', 'import', 'export', 'supply chain',
                      'manufacturing', 'freight', 'shipping', 'customs',
                      'usmca', 'nafta', 'trade war', 'sourcing', 'logistics'
                    ];
                    const hasTradeKeywords = tradeKeywords.some(kw => text.includes(kw));

                    // RELEVANT: Industry match
                    const industryMatch = userIndustry && alert.relevant_industries?.some(ind =>
                      ind.toLowerCase().includes(userIndustry) || userIndustry.includes(ind.toLowerCase())
                    );

                    // Include if any relevance criteria met
                    return mentionsUserCountry || hasTradeKeywords || industryMatch;
                  });

                  if (marketIntelAlerts.length === 0) return null;

                  const isExpanded = expandedComponents['market_intel'] || false;

                  return (
                    <div style={{
                      border: '1px solid #e5e7eb',
                      borderTop: '1px solid #e5e7eb',
                      borderRadius: '0 0 8px 8px',
                      backgroundColor: 'white',
                      overflow: 'hidden'
                    }}>
                      {/* Collapsed Header */}
                      <div
                        onClick={() => setExpandedComponents(prev => ({
                          ...prev,
                          'market_intel': !prev['market_intel']
                        }))}
                        style={{
                          padding: '1rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1rem',
                          backgroundColor: isExpanded ? '#f0f9ff' : '#fef3c7',
                          transition: 'background-color 0.2s',
                          borderTop: '2px solid #f59e0b'
                        }}
                      >
                        {/* Expand Icon */}
                        <span style={{
                          fontSize: '1.25rem',
                          color: '#f59e0b',
                          width: '1.25rem',
                          textAlign: 'center'
                        }}>
                          {isExpanded ? '▼' : '▶'}
                        </span>

                        {/* Name */}
                        <div style={{ flex: '2', fontWeight: 600, color: '#92400e' }}>
                          📰 Market Intelligence & Strategic Context
                        </div>

                        {/* Origin */}
                        <div style={{ flex: '1', textAlign: 'center', color: '#92400e', fontFamily: 'monospace', fontSize: '0.875rem' }}>
                          Global
                        </div>

                        {/* HS Code */}
                        <div style={{ flex: '1', textAlign: 'center', fontFamily: 'monospace', fontSize: '0.875rem', color: '#92400e' }}>
                          —
                        </div>

                        {/* Value % */}
                        <div style={{ flex: '1', textAlign: 'center', fontWeight: 600, color: '#92400e' }}>
                          N/A
                        </div>

                        {/* Alert Badge */}
                        <div style={{ flex: '1', textAlign: 'center' }}>
                          <span style={{
                            background: '#fef3c7',
                            color: '#92400e',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '12px',
                            fontSize: '0.8125rem',
                            fontWeight: 600,
                            border: '1px solid #f59e0b'
                          }}>
                            📌 {marketIntelAlerts.length} insight{marketIntelAlerts.length !== 1 ? 's' : ''}
                          </span>
                        </div>

                        {/* Email Checkbox */}
                        <div style={{ flex: '0.75', textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={includeMarketIntelInEmail}
                            onChange={(e) => {
                              e.stopPropagation();
                              setIncludeMarketIntelInEmail(e.target.checked);
                            }}
                            title="Include market intelligence in email alerts (AI always uses these for analysis)"
                            style={{
                              width: '18px',
                              height: '18px',
                              cursor: 'pointer'
                            }}
                          />
                        </div>
                      </div>

                      {/* Expanded View - Market Intelligence Alerts */}
                      {isExpanded && (
                        <div style={{
                          padding: '1.5rem',
                          background: '#fffbeb',
                          borderTop: '1px solid #fde68a'
                        }}>
                          <div style={{
                            fontSize: '0.875rem',
                            color: '#92400e',
                            marginBottom: '1rem',
                            padding: '0.75rem',
                            background: '#fef3c7',
                            borderRadius: '6px',
                            border: '1px solid #fde68a'
                          }}>
                            <strong>ℹ️ About Market Intelligence:</strong> AI always uses these alerts for strategic context in your briefing. Enable email to receive updates about general trade trends (no component-specific action required).
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {marketIntelAlerts.map((alert, idx) => (
                              <div key={idx} style={{
                                padding: '1rem',
                                background: 'white',
                                borderRadius: '8px',
                                border: '1px solid #e5e7eb'
                              }}>
                                <div style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'start',
                                  marginBottom: '0.5rem'
                                }}>
                                  <div style={{ fontWeight: 600, color: '#111827', fontSize: '0.9375rem' }}>
                                    {alert.title}
                                  </div>
                                  <span style={{
                                    background: alert.severity === 'high' ? '#fee2e2' :
                                              alert.severity === 'medium' ? '#fef3c7' : '#dbeafe',
                                    color: alert.severity === 'high' ? '#dc2626' :
                                          alert.severity === 'medium' ? '#f59e0b' : '#3b82f6',
                                    padding: '0.125rem 0.5rem',
                                    borderRadius: '10px',
                                    fontSize: '0.6875rem',
                                    fontWeight: 600,
                                    textTransform: 'uppercase',
                                    whiteSpace: 'nowrap'
                                  }}>
                                    {alert.severity}
                                  </span>
                                </div>

                                {alert.description && (
                                  <div style={{
                                    fontSize: '0.8125rem',
                                    color: '#6b7280',
                                    marginBottom: '0.5rem',
                                    lineHeight: '1.5'
                                  }}>
                                    {alert.description}
                                  </div>
                                )}

                                <div style={{
                                  fontSize: '0.75rem',
                                  color: '#9ca3af',
                                  display: 'flex',
                                  gap: '1rem'
                                }}>
                                  <span>🗓 {new Date(alert.created_at).toLocaleDateString()}</span>
                                  {alert.source_url && (
                                    <a
                                      href={alert.source_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{ color: '#3b82f6', textDecoration: 'none' }}
                                    >
                                      🔗 Source
                                    </a>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

            </div>
          )}
        </div>

        {/* Strategic Analysis Section - Clean Rebuild */}
        <div className="form-section">
          <h2 className="form-section-title">📊 Strategic Analysis</h2>
          <p className="text-body" style={{ marginBottom: '1.5rem' }}>
            Comprehensive business intelligence including USMCA 2026 contingency planning, scenario analysis, and government resource guidance.
          </p>

          {/* Alerts load automatically on page load */}

          {alertsGenerated && (
            <div>
              {/* ✅ FIXED: Check for workflow data (components), NOT optional executive summary */}
              {!userProfile || !userProfile.componentOrigins || userProfile.componentOrigins.length === 0 ? (
                <div className="alert alert-warning" style={{ marginBottom: '1rem' }}>
                  <div className="alert-content">
                    <div className="alert-title">⚠️ Complete USMCA Workflow First</div>
                    <div className="text-body">
                      Strategic Analysis requires your USMCA qualification data. Please complete the USMCA workflow first to generate your strategic intelligence report.
                      <br /><br />
                      <a href="/usmca-workflow" className="btn-primary" style={{ display: 'inline-block', marginTop: '0.5rem' }}>
                        🚀 Start USMCA Workflow
                      </a>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="hero-buttons">
                    <button
                      onClick={() => {
                        console.log('🔵 USMCA 2026 button clicked!', { userProfile });
                        loadPortfolioBriefing(userProfile);
                      }}
                      className="btn-primary"
                      disabled={isLoadingPolicyAlerts}
                    >
                      {isLoadingPolicyAlerts ? '⏳ Analyzing...' : '📊 USMCA 2026 Impact Analysis'}
                    </button>
                    <button
                      onClick={() => {
                        setAlertsGenerated(false);
                        setRealPolicyAlerts([]);
                        setConsolidatedAlerts([]);
                        setPortfolioBriefing(null);
                      }}
                      className="btn-secondary"
                    >
                      🔄 Run Analysis Again
                    </button>
                  </div>

                  {/* Display Portfolio Briefing */}
                  {portfolioBriefing && (
                    <div style={{
                      marginTop: '2rem',
                      padding: '2rem',
                      background: 'white',
                      borderRadius: '12px',
                      border: '2px solid #3b82f6',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}>
                      <h3 style={{
                        fontSize: '1.5rem',
                        fontWeight: 700,
                        color: '#111827',
                        marginBottom: '1.5rem',
                        borderBottom: '2px solid #e5e7eb',
                        paddingBottom: '0.75rem'
                      }}>
                        📊 Your USMCA 2026 Strategic Briefing
                      </h3>

                      {/* Render structured JSON briefing */}
                      <div style={{ fontSize: '0.9375rem', color: '#374151', lineHeight: '1.7' }}>
                        {/* Business Overview */}
                        <div style={{ marginBottom: '1.5rem' }}>
                          <h4 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#3b82f6', marginTop: '1rem', marginBottom: '0.75rem' }}>
                            What This Means for Your Business
                          </h4>
                          <p style={{ margin: 0 }}>{portfolioBriefing.business_overview}</p>
                        </div>

                        {/* Component Analysis */}
                        <div style={{ marginBottom: '1.5rem' }}>
                          <h4 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#3b82f6', marginTop: '1.5rem', marginBottom: '0.75rem' }}>
                            Component Risk Breakdown
                          </h4>
                          <p style={{ margin: 0 }}>{portfolioBriefing.component_analysis}</p>
                        </div>

                        {/* Strategic Trade-offs */}
                        <div style={{ marginBottom: '1.5rem' }}>
                          <h4 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#3b82f6', marginTop: '1.5rem', marginBottom: '0.75rem' }}>
                            Strategic Considerations
                          </h4>
                          <p style={{ margin: 0 }}>{portfolioBriefing.strategic_trade_offs}</p>
                        </div>

                        {/* Monitoring Plan */}
                        <div>
                          <h4 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#3b82f6', marginTop: '1.5rem', marginBottom: '0.75rem' }}>
                            What We're Monitoring for You
                          </h4>
                          <p style={{ margin: 0 }}>{portfolioBriefing.monitoring_plan}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Next Steps - ALWAYS show after analysis runs (even if 0 alerts) */}
        {alertsGenerated && (
          <div className="form-section">
            <h2 className="form-section-title">Next Steps</h2>
            <p className="text-body" style={{ marginBottom: '1rem' }}>
              ✅ Analysis complete and automatically saved to your dashboard. Access from any device or download as PDF.
            </p>

            <div className="hero-buttons">
              {/* Download PDF of Strategic Analysis */}
              <button
                onClick={() => {
                  if (userTier === 'Trial') {
                    alert('PDF download is available for paying subscribers. Upgrade to download your strategic analysis.');
                    window.location.href = '/pricing';
                  } else {
                    window.print();
                  }
                }}
                className="btn-primary"
                disabled={userTier === 'Trial'}
                title={userTier === 'Trial' ? 'Upgrade to download PDF' : ''}
              >
                {userTier === 'Trial' ? '🔒 Download PDF (Upgrade)' : '📄 Download PDF'}
              </button>

              {/* New Analysis */}
              <button
                onClick={() => {
                  if (confirm('Start a new analysis? Your current alerts will be cleared.')) {
                    // Clear alert data
                    localStorage.removeItem('alert_impact_analysis');
                    setAlertImpactAnalysis(null);
                    setConsolidatedAlerts([]);
                    setRealPolicyAlerts([]);
                    setAlertsGenerated(false);
                    // Go back to dashboard
                    window.location.href = '/dashboard';
                  }
                }}
                className="btn-secondary"
              >
                🔄 New Analysis
              </button>
            </div>
          </div>
        )}

        {/* ❌ REMOVED: "Recent Alert Activity" Timeline Section
            - User never requested this feature
            - Alerts should ONLY appear in Component Tariff Intelligence table
            - This section was displaying alerts in wrong place with wrong data (recentAlertActivity instead of realPolicyAlerts)
            - Per user: "i never asked for anthe table for them to appear in"
        */}

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