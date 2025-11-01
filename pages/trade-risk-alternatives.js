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
import AlertImpactAnalysisDisplay from '../components/alerts/AlertImpactAnalysisDisplay';

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

  // Email notification preferences for each component
  const [componentEmailNotifications, setComponentEmailNotifications] = useState({});

  // Alert Impact Analysis state (ADDITIVE - reuses workflow analysis)
  const [alertImpactAnalysis, setAlertImpactAnalysis] = useState(null);
  const [isLoadingAlertImpact, setIsLoadingAlertImpact] = useState(false);

  // Executive Alert state (strategic consulting letter)
  const [executiveAlertData, setExecutiveAlertData] = useState(null);
  const [showExecutiveAlert, setShowExecutiveAlert] = useState(false);

  // Alert Lifecycle Management state
  const [alertHistoricalContext, setAlertHistoricalContext] = useState(null);
  const [recentAlertActivity, setRecentAlertActivity] = useState([]);

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

  // REMOVED: Auto-restore from localStorage
  // Strategic analysis should ONLY display when user explicitly clicks the button
  // Users found it confusing to see generic analysis auto-display on page load

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
          const components = mostRecentWorkflow.component_origins || [];

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
            hasTradeVolume: !!profile.tradeVolume
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
        qualificationStatus: getQualificationStatus(userData.usmca),
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
   * Save alert impact analysis to database (with user consent)
   */
  const handleSaveAlertAnalysis = async () => {
    if (!user) {
      alert('⚠️ Please sign in to save alert analysis to your dashboard.');
      return;
    }

    if (!alertImpactAnalysis) {
      alert('⚠️ No alert analysis to save. Please generate the analysis first.');
      return;
    }

    // Check for user consent
    const savedConsent = localStorage.getItem('save_data_consent');
    if (savedConsent !== 'save') {
      alert('⚠️ You must consent to save data before saving alert analysis. Please use the consent modal at the top of the page.');
      return;
    }

    try {
      console.log('💾 Saving alert impact analysis to database...');

      // Save alert impact analysis to workflow detailed_analysis
      const response = await fetch('/api/workflow-session/update-executive-alert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          detailed_analysis: {
            alert_impact_analysis: {
              alert_impact_summary: alertImpactAnalysis.alert_impact_summary || '',
              updated_priorities: alertImpactAnalysis.updated_priorities || [],
              updated_timeline: alertImpactAnalysis.updated_timeline || [],
              contingency_scenarios: alertImpactAnalysis.contingency_scenarios || [],
              next_step_this_week: alertImpactAnalysis.next_step_this_week || ''
            },
            analysis_generated_at: new Date().toISOString()
          }
        })
      });

      if (response.ok) {
        console.log('✅ Alert impact analysis saved to database');
        alert('✅ Alert analysis saved to your dashboard!\n\nYou can view it anytime from your workflow history.');
      } else {
        const errorData = await response.json();
        console.error('❌ Failed to save alert analysis:', errorData);
        alert('⚠️ Failed to save alert analysis. Please try again or contact support.');
      }
    } catch (error) {
      console.error('❌ Error saving alert analysis:', error);
      alert('⚠️ Failed to save alert analysis. Please try again or contact support.');
    }
  };

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

        // ✅ ALERT LIFECYCLE: Load historical context and recent activity
        if (data.alert_historical_context) {
          console.log('✅ Loaded alert historical context:', data.alert_historical_context);
          setAlertHistoricalContext(data.alert_historical_context);
        }

        if (data.recent_alert_activity && data.recent_alert_activity.length > 0) {
          console.log(`✅ Loaded ${data.recent_alert_activity.length} recent alert activities`);
          setRecentAlertActivity(data.recent_alert_activity);
        }
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
  const loadRealPolicyAlerts = async (profile) => {
    setIsLoadingPolicyAlerts(true);
    setProgressSteps([]);

    try {
      // Step 1: Analyze component origins
      setProgressSteps(prev => [...prev, 'Analyzing component origins...']);
      console.log('Analyzing component origins for:', profile.companyName);
      await new Promise(resolve => setTimeout(resolve, 500)); // Small delay for UX

      // Step 2: Checking trade policies
      setProgressSteps(prev => [...prev, 'Checking applicable trade policies...']);
      console.log('Checking trade policies...');

      const response = await fetch('/api/generate-personalized-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_profile: profile
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to generate personalized alerts: ${response.status}`);
      }

      // Step 3: Generating personalized alerts
      setProgressSteps(prev => [...prev, 'Generating personalized alerts...']);
      const data = await response.json();

      if (data.success && data.alerts) {
        console.log(`Generated ${data.alerts.length} personalized alerts for ${profile.companyName}`);

        const personalizedAlerts = data.alerts;

        setRealPolicyAlerts(personalizedAlerts);
        setOriginalAlertCount(personalizedAlerts.length);

        // Step 4: Consolidating related alerts
        setProgressSteps(prev => [...prev, 'Consolidating related alerts...']);
        if (personalizedAlerts.length > 0) {
          await consolidateAlerts(personalizedAlerts, profile);
        }

        setProgressSteps(prev => [...prev, 'Analysis complete']);
        setAlertsGenerated(true);
      } else {
        console.log('No personalized alerts generated');
        setRealPolicyAlerts([]);
        setProgressSteps(prev => [...prev, 'No alerts found']);
        setAlertsGenerated(true);
      }
    } catch (error) {
      console.error('Error generating personalized alerts:', error);
      setRealPolicyAlerts([]);
      setProgressSteps(prev => [...prev, 'Error generating alerts']);
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

  /**
   * Generate additive alert impact analysis
   * Reuses existing workflow analysis from results page to avoid re-computation
   * Only analyzes NEW threats and how they impact existing strategic plan
   */
  const generateAlertImpactAnalysis = async () => {
    if (!consolidatedAlerts || consolidatedAlerts.length === 0) {
      console.log('⏭️ No alerts to analyze');
      return;
    }

    if (!workflowIntelligence) {
      console.warn('⚠️ No workflow intelligence available - cannot generate additive analysis');
      return;
    }

    setIsLoadingAlertImpact(true);

    try {
      console.log('🔍 Generating additive alert impact analysis...');

      // Pass FULL detailed_analysis to AI for complete strategic context
      // This includes: situation_brief, problem, root_cause, annual_impact, why_now,
      // current_burden, potential_savings, payback_period, strategic_roadmap, action_items, broker_insights
      const existingAnalysis = workflowIntelligence.detailed_analysis || {};

      // Build user profile for analysis
      const analysisProfile = {
        companyCountry: userProfile.companyCountry || 'US',
        companyName: userProfile.companyName,
        business_type: userProfile.businessType,
        industry_sector: userProfile.industry_sector,
        destination_country: userProfile.destinationCountry || 'US',
        componentOrigins: userProfile.componentOrigins || [],
        regionalContent: userProfile.regionalContent || 0,
        tradeVolume: userProfile.tradeVolume || 0,
        trade_volume: userProfile.tradeVolume || 0 // Alias for compatibility
      };

      // Call alert impact analysis API endpoint (server-side)
      const response = await fetch('/api/alert-impact-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          existingAnalysis,
          consolidatedAlerts,
          userProfile: analysisProfile
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate analysis');
      }

      const rawAnalysis = await response.json();

      console.log('✅ Alert impact analysis complete (RAW):', rawAnalysis);

      // ✅ UNWRAP if response has wrapper (like {success: true, data: {...}})
      let analysis = rawAnalysis;
      if (rawAnalysis && typeof rawAnalysis === 'object') {
        if (rawAnalysis.success && rawAnalysis.data) {
          console.log('🔓 Unwrapping response data');
          analysis = rawAnalysis.data;
        } else if (rawAnalysis.data && !rawAnalysis.alert_impact_summary) {
          // If data exists but no alert_impact_summary at top level, might be wrapped
          console.log('🔓 Found nested data structure');
          analysis = rawAnalysis.data;
        }
      }

      console.log('✅ Final alert impact analysis:', analysis);
      setAlertImpactAnalysis(analysis);

      // Save to localStorage for persistence
      try {
        localStorage.setItem('alert_impact_analysis', JSON.stringify(analysis));
        console.log('💾 Saved alert impact analysis to localStorage');
      } catch (e) {
        console.error('Failed to save to localStorage:', e);
      }
    } catch (error) {
      console.error('❌ Alert impact analysis failed:', error);
      setAlertImpactAnalysis(null);
    } finally {
      setIsLoadingAlertImpact(false);
    }
  };

  // REMOVED AUTO-TRIGGER: User must manually click button to generate analysis (saves API costs on page reload)

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

          {/* ✅ ALERT LIFECYCLE: Historical Context - Show Past Successes */}
          {alertHistoricalContext && alertHistoricalContext.total_resolved > 0 && (
            <div style={{
              marginTop: '2rem',
              padding: '1.5rem',
              background: 'linear-gradient(135deg, #dcfce7 0%, #f0fdf4 100%)',
              borderRadius: '12px',
              border: '2px solid #059669'
            }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#065f46', marginBottom: '1rem' }}>
                📊 Your Alert Resolution History
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 700, color: '#059669' }}>
                    {alertHistoricalContext.total_resolved}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#065f46', fontWeight: 500 }}>
                    Total Alerts Resolved
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 700, color: '#059669' }}>
                    ${Math.round(alertHistoricalContext.total_cost_impact_prevented || 0).toLocaleString()}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#065f46', fontWeight: 500 }}>
                    Cost Impact Prevented
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 700, color: '#059669' }}>
                    {alertHistoricalContext.resolved_last_30d}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#065f46', fontWeight: 500 }}>
                    Resolved Last 30 Days
                  </div>
                </div>
              </div>
              {alertHistoricalContext.most_recent_resolution && (
                <div style={{ marginTop: '0.75rem', fontSize: '0.8125rem', color: '#065f46', textAlign: 'center' }}>
                  Most Recent: {new Date(alertHistoricalContext.most_recent_resolution).toLocaleDateString()}
                </div>
              )}
            </div>
          )}

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
                    totalAlerts: consolidatedAlerts.length,
                    alertsGenerated,
                    alertsArray: consolidatedAlerts.map(a => ({
                      title: a.title || a.consolidated_title,
                      affectedHS: a.affected_hs_codes,
                      affectedCountries: a.affected_countries,
                      relevantIndustries: a.relevant_industries,
                      source: a.source || a.alert_type
                    })),
                    componentsArray: userProfile.componentOrigins.map(c => ({
                      name: c.component_type || c.description,
                      hs: c.hs_code,
                      origin: c.origin_country || c.country,
                      industry: c.industry || userProfile.industry_sector
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
                  const componentAlerts = consolidatedAlerts.filter(alert => {
                    const componentOrigin = (comp.origin_country || comp.country)?.toUpperCase();
                    const componentHS = comp.hs_code;
                    const componentIndustry = comp.industry || userProfile.industry_sector;

                    // Check origin match
                    const originMatch = alert.affected_countries?.some(country =>
                      componentOrigin === country.toUpperCase()
                    );

                    // Check HS code match (NULL = matches all)
                    const hsMatch = alert.affected_hs_codes === null || alert.affected_hs_codes === undefined
                      ? true
                      : alert.affected_hs_codes?.some(code =>
                          componentHS?.startsWith(code.replace(/\./g, '').substring(0, 6))
                        );

                    // Check industry match (NULL = matches all)
                    const industryMatch = alert.relevant_industries === null || alert.relevant_industries === undefined
                      ? true
                      : alert.relevant_industries?.some(industry =>
                          componentIndustry?.toLowerCase().includes(industry.toLowerCase())
                        );

                    // TYPE 1: Blanket country tariff (NULL HS codes + origin match)
                    if ((alert.affected_hs_codes === null || alert.affected_hs_codes === undefined) && originMatch) {
                      return true;
                    }

                    // TYPE 2: Industry tariff (industry match + origin match)
                    if (industryMatch && originMatch) {
                      return true;
                    }

                    // TYPE 3: Specific tariff (HS + origin match)
                    return hsMatch && originMatch;
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
                                {componentAlerts.map((alert, alertIdx) => (
                                  <div key={alertIdx} style={{
                                    background: 'white',
                                    border: alert.lifecycle_status === 'RESOLVED' ? '2px solid #dcfce7' : '2px solid #fee2e2',
                                    borderRadius: '6px',
                                    padding: '1rem',
                                    opacity: alert.lifecycle_status === 'RESOLVED' ? 0.7 : 1
                                  }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                                      <div style={{ fontWeight: 600, color: '#111827', fontSize: '0.9375rem', flex: 1 }}>
                                        {alert.consolidated_title || alert.title}
                                      </div>
                                      <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                                        {/* ✅ LIFECYCLE STATUS BADGE */}
                                        <span style={{
                                          background: alert.lifecycle_status === 'NEW' ? '#3b82f6' :
                                                      alert.lifecycle_status === 'UPDATED' ? '#f59e0b' :
                                                      alert.lifecycle_status === 'RESOLVED' ? '#059669' : '#6b7280',
                                          color: 'white',
                                          padding: '0.125rem 0.5rem',
                                          borderRadius: '10px',
                                          fontSize: '0.6875rem',
                                          fontWeight: 600,
                                          textTransform: 'uppercase'
                                        }}>
                                          {alert.lifecycle_status || 'NEW'}
                                        </span>
                                        {/* URGENCY BADGE */}
                                        <span style={{
                                          background: alert.urgency === 'CRITICAL' ? '#dc2626' : alert.urgency === 'HIGH' ? '#f59e0b' : '#6b7280',
                                          color: 'white',
                                          padding: '0.125rem 0.5rem',
                                          borderRadius: '10px',
                                          fontSize: '0.6875rem',
                                          fontWeight: 600,
                                          textTransform: 'uppercase'
                                        }}>
                                          {alert.urgency || 'MEDIUM'}
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
                                ))}
                              </div>
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

        {/* Alert Impact Analysis Section - ALWAYS show after analysis runs (alert or no alert) */}
        {alertImpactAnalysis && alertsGenerated && (
          <div>
            <AlertImpactAnalysisDisplay
              data={alertImpactAnalysis}
              consolidatedAlertsCount={consolidatedAlerts.length}
              onClose={null}
            />

            {/* Save Alert Analysis to Database Button */}
            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
              <button
                onClick={handleSaveAlertAnalysis}
                className="btn-primary"
                style={{
                  padding: '0.875rem 2rem',
                  fontSize: '1rem',
                  fontWeight: 600
                }}
              >
                ✅ Save Alert Analysis to Database
              </button>
              <p style={{
                marginTop: '0.75rem',
                fontSize: '0.875rem',
                color: '#6b7280'
              }}>
                Save this strategic analysis to your dashboard for future reference
              </p>
            </div>
          </div>
        )}

        {/* Loading indicator for alert impact analysis */}
        {isLoadingAlertImpact && consolidatedAlerts.length > 0 && (
          <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
            Analyzing Strategic Impact...
          </div>
        )}

        {/* Strategic Analysis Section - Clean Rebuild */}
        <div className="form-section">
          <h2 className="form-section-title">📊 Strategic Analysis</h2>
          <p className="text-body" style={{ marginBottom: '1.5rem' }}>
            Comprehensive business intelligence including USMCA 2026 contingency planning, scenario analysis, and government resource guidance.
          </p>

          {!alertsGenerated && (
            <button
              onClick={() => loadRealPolicyAlerts(userProfile)}
              className="btn-primary"
              disabled={isLoadingPolicyAlerts}
            >
              {isLoadingPolicyAlerts ? 'Analyzing...' : 'Generate Alert Analysis'}
            </button>
          )}

          {alertsGenerated && !alertImpactAnalysis && (
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
                <div className="hero-buttons">
                  <button
                    onClick={generateAlertImpactAnalysis}
                    className="btn-primary"
                  >
                    📊 Generate Strategic Analysis
                  </button>
                  <button
                    onClick={() => {
                      setAlertsGenerated(false);
                      setRealPolicyAlerts([]);
                      setConsolidatedAlerts([]);
                    }}
                    className="btn-secondary"
                  >
                    🔄 Run Analysis Again
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Next Steps - ALWAYS show after analysis runs (even if 0 alerts) */}
        {alertsGenerated && (
          <div className="form-section">
            <h2 className="form-section-title">Next Steps</h2>
            <p className="text-body" style={{ marginBottom: '1rem' }}>
              Analysis complete. Save to enable alerts and cross-device access. Or proceed without saving (data stays in browser only).
            </p>

            <div className="hero-buttons">
              {/* Save Alert Analysis to Database */}
              <button
                onClick={handleSaveAlertAnalysis}
                className="btn-primary"
              >
                💾 Save Alert to Database
              </button>

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

        {/* ✅ ALERT LIFECYCLE: Recent Activity Timeline (30-Day History) */}
        {recentAlertActivity && recentAlertActivity.length > 0 && (
          <div className="form-section">
            <h2 className="form-section-title">📅 Recent Alert Activity (Last 30 Days)</h2>
            <p className="text-body" style={{ marginBottom: '1rem' }}>
              Timeline of your alert management activities, showing when alerts appeared and how you resolved them.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {recentAlertActivity.map((activity, idx) => {
                const statusColor = activity.status === 'RESOLVED' ? '#059669' :
                                   activity.status === 'ARCHIVED' ? '#6b7280' :
                                   activity.status === 'NEW' ? '#3b82f6' : '#f59e0b';

                return (
                  <div key={idx} style={{
                    display: 'flex',
                    gap: '1rem',
                    padding: '1rem',
                    background: 'white',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    alignItems: 'start'
                  }}>
                    {/* Timeline Dot */}
                    <div style={{ flexShrink: 0, paddingTop: '0.25rem' }}>
                      <div style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: statusColor
                      }} />
                    </div>

                    {/* Activity Content */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                        <div style={{ fontWeight: 600, color: '#111827', fontSize: '0.9375rem' }}>
                          {activity.alert_title}
                        </div>
                        <span style={{
                          background: statusColor,
                          color: 'white',
                          padding: '0.125rem 0.5rem',
                          borderRadius: '10px',
                          fontSize: '0.6875rem',
                          fontWeight: 600,
                          textTransform: 'uppercase'
                        }}>
                          {activity.status}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.8125rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                        <span style={{ fontWeight: 500 }}>First Seen:</span> {new Date(activity.first_seen_at).toLocaleDateString()}
                        {activity.resolved_at && (
                          <span style={{ marginLeft: '1rem' }}>
                            <span style={{ fontWeight: 500 }}>Resolved:</span> {new Date(activity.resolved_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      {activity.resolution_notes && (
                        <div style={{
                          padding: '0.75rem',
                          background: '#f9fafb',
                          borderRadius: '6px',
                          fontSize: '0.8125rem',
                          color: '#374151'
                        }}>
                          <span style={{ fontWeight: 600 }}>Resolution:</span> {activity.resolution_notes}
                        </div>
                      )}

                      {activity.estimated_cost_impact && (
                        <div style={{
                          marginTop: '0.5rem',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: '#059669'
                        }}>
                          💰 Cost Impact Prevented: ${activity.estimated_cost_impact.toLocaleString()}
                        </div>
                      )}

                      {activity.actions_taken && activity.actions_taken.length > 0 && (
                        <div style={{ marginTop: '0.5rem' }}>
                          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', marginBottom: '0.25rem' }}>
                            Actions Taken:
                          </div>
                          <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.8125rem', color: '#374151' }}>
                            {activity.actions_taken.map((action, actionIdx) => (
                              <li key={actionIdx}>{action}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {recentAlertActivity.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '2rem',
                color: '#6b7280',
                fontSize: '0.875rem'
              }}>
                No alert activity in the last 30 days. New alerts will appear here as they're detected.
              </div>
            )}
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

      {/* Global Broker Chatbot - Available on Alerts Page */}
      <BrokerChatbot
        currentFormField="trade_alerts"
        sessionId={user ? `alerts_${user.id}` : `alerts_guest_${Date.now()}`}
      />
    </TriangleLayout>
  );
}