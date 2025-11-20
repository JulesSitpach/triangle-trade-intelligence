/**
 * TRADE RISK & ALTERNATIVES DASHBOARD
 * Dynamic alerts based on user's actual trade profile from workflow
 * Shows current risks and diversification strategies with team solutions
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import TriangleLayout from '../components/TriangleLayout';
import { useSimpleAuth } from '../lib/contexts/SimpleAuthContext';
import SaveDataConsentModal from '../components/shared/SaveDataConsentModal';
import PersonalizedPolicyAlert from '../components/alerts/PersonalizedPolicyAlert';
import ConsolidatedPolicyAlert from '../components/alerts/ConsolidatedPolicyAlert';
import RealTimeMonitoringDashboard from '../components/alerts/RealTimeMonitoringDashboard';
import BrokerChatbot from '../components/chatbot/BrokerChatbot';
import USMCAIntelligenceDisplay from '../components/alerts/USMCAIntelligenceDisplay';
import ExecutiveSummaryDisplay from '../components/workflow/results/ExecutiveSummaryDisplay';
import PortfolioBriefingDisplay from '../components/alerts/PortfolioBriefingDisplay';
import workflowStorage from '../lib/services/workflow-storage-adapter.js';

// Import configuration from centralized config file
import TRADE_RISK_CONFIG, {
  calculateRiskImpact,
  formatCurrency
} from '../config/trade-risk-config';

// Import alert impact analysis service
// AlertImpactAnalysisService moved to server-side API endpoint: /api/alert-impact-analysis
import { getCountryConfig } from '../lib/usmca/usmca-2026-config';
import { getWorkflowData } from '../lib/services/unified-workflow-data-service';
import { VolatilityManager } from '../lib/tariff/volatility-manager';

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
  const [usageStats, setUsageStats] = useState({ used: 0, limit: 10, remaining: 10 }); // Track monthly workflow analysis usage
  const [briefingUsageStats, setBriefingUsageStats] = useState({ used: 0, limit: 50, remaining: 50 }); // Track monthly portfolio briefing usage

  // Real policy alerts state
  const [realPolicyAlerts, setRealPolicyAlerts] = useState([]);
  const [isLoadingPolicyAlerts, setIsLoadingPolicyAlerts] = useState(false);

  // Strategic alerts filtered by AI for USMCA 2026 section
  const [strategicAlerts, setStrategicAlerts] = useState([]);

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
  const [includeMarketIntelInEmail, setIncludeMarketIntelInEmail] = useState(true);

  // Portfolio Briefing state (AI-generated strategic analysis)
  const [portfolioBriefing, setPortfolioBriefing] = useState(null);

  // Timer state for analysis progress indicator
  const [analysisElapsedSeconds, setAnalysisElapsedSeconds] = useState(50);

  // Email notification preferences for each component (default: all checked)
  const [componentEmailNotifications, setComponentEmailNotifications] = useState({});

  // Alert selection mode: AI auto-select vs manual selection
  const [allowAISelectAlerts, setAllowAISelectAlerts] = useState(true); // Default: AI picks alerts
  const [selectedAlertIds, setSelectedAlertIds] = useState([]); // Manual selection (max 3)

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

  // Toggle email notifications for specific component (and save to database)
  const toggleComponentEmailNotification = async (idx) => {
    const newValue = !componentEmailNotifications[idx];

    // Update local state immediately for responsive UI
    setComponentEmailNotifications(prev => ({
      ...prev,
      [idx]: newValue
    }));

    // Save to database
    try {
      const response = await fetch('/api/user-profile/update-email-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userId: user?.id,
          preferences: {
            ...componentEmailNotifications,
            [idx]: newValue
          }
        })
      });

      if (!response.ok) {
        console.error('Failed to save email preferences');
        // Revert on error
        setComponentEmailNotifications(prev => ({
          ...prev,
          [idx]: !newValue
        }));
      } else {
        console.log(`✅ Saved email preference for component ${idx}: ${newValue}`);
      }
    } catch (error) {
      console.error('Error saving email preferences:', error);
      // Revert on error
      setComponentEmailNotifications(prev => ({
        ...prev,
        [idx]: !newValue
      }));
    }
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

  // Load email preferences from database on page load
  useEffect(() => {
    if (user?.id) {
      loadEmailPreferences();
    }
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Timer effect: Update elapsed time every second while loading
  useEffect(() => {
    let interval;

    if (isLoadingPolicyAlerts) {
      // Reset timer when loading starts (countdown from 50)
      setAnalysisElapsedSeconds(50);

      // Update timer every second (count DOWN)
      interval = setInterval(() => {
        setAnalysisElapsedSeconds(prev => Math.max(0, prev - 1));
      }, 1000);
    }

    // Cleanup interval when loading stops or component unmounts
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isLoadingPolicyAlerts]);

  // Clear old localStorage data on page load (one-time cleanup)
  useEffect(() => {
    workflowStorage.removeItem('alert_impact_analysis');
    console.log('🧹 Cleared old alert impact analysis from localStorage');
  }, []); // Run once on mount

  const loadUserData = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try{
      // Check if loading specific workflow or alert from dashboard
      const urlParams = new URLSearchParams(window.location.search);
      const workflowId = urlParams.get('workflow_id'); // ✅ NEW: Support direct workflow loading
      const analysisId = urlParams.get('analysis_id');

      console.log('🔍 Alert Page Load Context:', {
        hasWorkflowId: !!workflowId,
        workflowId: workflowId,
        hasAnalysisId: !!analysisId,
        analysisId: analysisId,
        fullURL: window.location.href,
        hasUser: !!user
      });

      // ✅ FIXED: Try DATABASE FIRST (source of truth), then localStorage (fallback)
      console.log('📊 Loading from database (source of truth)...');
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

        // Extract user subscription tier and usage stats
        setUserTier(dashboardData.user_profile?.subscription_tier || 'Trial');

        // Set usage stats for monthly limit tracking
        if (dashboardData.usage_stats) {
          setUsageStats(dashboardData.usage_stats);
        }
        if (dashboardData.briefing_usage_stats) {
          setBriefingUsageStats(dashboardData.briefing_usage_stats);
        }

        // ✅ NEW: If workflow_id provided, load that specific workflow directly
        if (workflowId) {
          console.log('📂 Loading specific workflow from database:', workflowId);
          const workflow = dashboardData.workflows?.find(w => w.id === workflowId);

          if (workflow) {
            console.log('✅ Found workflow data from database');
            const workflowData = workflow.workflow_data || {};
            const rawComponents = workflow.component_origins || [];

            // Normalize components
            const components = rawComponents.map(comp => ({
              ...comp,
              percentage: comp.value_percentage || comp.percentage || 0,
              component_type: comp.description || comp.component_type,
              annual_volume: comp.annual_volume || 0
            }));

            // Parse trade volume
            const rawTradeVolume = workflow.trade_volume || workflowData.company?.trade_volume;
            const parsedTradeVolume = rawTradeVolume
              ? (typeof rawTradeVolume === 'string' ? parseFloat(rawTradeVolume.replace(/,/g, '')) : rawTradeVolume)
              : 0;

            const profile = {
              userId: user?.id,
              workflowId: workflow.id, // ✅ Store workflow ID for Impact Analysis
              companyName: workflow.company_name || workflowData.company?.company_name,
              companyCountry: workflow.company_country || workflowData.company?.company_country || 'US',
              destinationCountry: workflow.destination_country || workflowData.company?.destination_country || 'US',
              businessType: workflow.business_type || workflowData.company?.business_type,
              industry_sector: workflow.industry_sector || workflowData.company?.industry_sector,
              hsCode: workflow.hs_code || workflowData.product?.hs_code,
              productDescription: workflow.product_description || workflowData.product?.description,
              tradeVolume: parsedTradeVolume,
              supplierCountry: components[0]?.origin_country || components[0]?.country,
              qualificationStatus: workflow.qualification_status || getQualificationStatus(workflowData.usmca),
              savings: workflow.estimated_annual_savings || workflowData.savings?.annual_savings || 0,
              componentOrigins: components,
              regionalContent: workflowData.usmca?.regional_content || 0,
              impactAnalysis: workflowData.detailed_analysis?.portfolio_briefing || null // ✅ Load cached Impact Analysis from correct path
            };

            console.log('✅ Loaded workflow from database:', {
              workflowId: workflow.id,
              companyName: profile.companyName,
              componentCount: components.length,
              hasImpactAnalysis: !!profile.impactAnalysis,
              detailedAnalysisPath: workflowData.detailed_analysis ? 'EXISTS' : 'MISSING',
              portfolioBriefingPath: workflowData.detailed_analysis?.portfolio_briefing ? 'EXISTS' : 'MISSING'
            });

            setUserProfile(profile);

            // ✅ AUTO-DISPLAY: If Impact Analysis exists, show it immediately
            if (profile.impactAnalysis) {
              console.log('✅ Found cached Impact Analysis, displaying automatically');
              setPortfolioBriefing(profile.impactAnalysis);
              setAlertsGenerated(true);
            }

            setIsLoading(false);
            return;
          } else {
            console.warn('⚠️ Workflow not found, loading most recent instead');
          }
        }

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

          // ✅ DEBUG: Check what tariff data is in rawComponents
          console.log('🔍 RAW COMPONENTS FROM DATABASE:', {
            count: rawComponents.length,
            firstComponent: rawComponents[0] ? {
              description: rawComponents[0].description,
              mfn_rate: rawComponents[0].mfn_rate,
              section_301: rawComponents[0].section_301,
              total_rate: rawComponents[0].total_rate,
              usmca_rate: rawComponents[0].usmca_rate,
              annual_savings: rawComponents[0].annual_savings,
              allKeys: Object.keys(rawComponents[0])
            } : 'No components'
          });

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
            workflowId: mostRecentWorkflow.id, // ✅ Store workflow ID for Impact Analysis
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
            regionalContent: workflowData.usmca?.regional_content || 0,
            impactAnalysis: workflowData.detailed_analysis?.portfolio_briefing || null // ✅ FIX: Load cached portfolio briefing from database
          };

          console.log('✅ Loaded user profile from database:', {
            companyName: profile.companyName,
            tradeVolume: profile.tradeVolume,
            hasTradeVolume: !!profile.tradeVolume,
            componentCount: components.length,
            componentPercentages: components.map(c => `${c.component_type}: ${c.percentage}%`),
            hasImpactAnalysis: !!profile.impactAnalysis,
            detailedAnalysisPath: workflowData.detailed_analysis ? 'EXISTS' : 'MISSING',
            portfolioBriefingPath: workflowData.detailed_analysis?.portfolio_briefing ? 'EXISTS' : 'MISSING'
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

          // ✅ AUTO-DISPLAY: If Impact Analysis exists, show it immediately
          if (profile.impactAnalysis) {
            console.log('✅ Found cached Impact Analysis, displaying automatically');
            setPortfolioBriefing(profile.impactAnalysis);
            setAlertsGenerated(true);
          }

          setIsLoading(false);
          return;
        } else {
          console.warn('⚠️ No workflows found in database - trying localStorage fallback...');
          await loadLocalStorageData();
        }
      } else {
        console.error('❌ Dashboard data fetch failed:', response.status, response.statusText);
        console.log('🔄 Falling back to localStorage due to API error');
        await loadLocalStorageData();
      }
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
    const sessionId = typeof window !== 'undefined' ? workflowStorage.getItem('workflow_session_id') : null;
    console.log(`[TradeRiskAlternatives] Looking for sessionId: ${sessionId}`);

    let userData = await getWorkflowData(sessionId);

    // ✅ FALLBACK: If no session_id in localStorage, try loading from usmca_workflow_results
    if (!userData && typeof window !== 'undefined') {
      console.log('[TradeRiskAlternatives] No session_id found, trying usmca_workflow_results...');
      const cachedResults = workflowStorage.getItem('usmca_workflow_results');
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
        workflowStorage.removeItem('usmca_workflow_results');
        workflowStorage.removeItem('triangleUserData');
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

      // ✅ DEFAULT EMAIL NOTIFICATIONS: Check all component email checkboxes by default
      if (components.length > 0) {
        const defaultNotifications = {};
        components.forEach((_, idx) => {
          defaultNotifications[idx] = true; // All checkboxes checked by default
        });
        setComponentEmailNotifications(defaultNotifications);
        console.log(`✅ Initialized ${components.length} component email notifications (all enabled by default)`);
      }

      // Show consent modal instead of automatically saving
      // Check if user is authenticated (cookie-based auth)
      const savedConsent = workflowStorage.getItem('save_data_consent');
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
    workflowStorage.setItem('save_data_consent', 'save');
    setHasSaveDataConsent(true);
    setShowSaveDataConsent(false);

    // Workflow data already saved via workflow_sessions - no additional save needed
    setPendingProfile(null);
  };

  // Handle user choosing to ERASE their data / Skip alerts
  const handleEraseDataConsent = () => {
    console.log('🔒 User chose to ERASE data / Skip alerts (privacy first)');

    // Save consent choice to not show modal again this session
    workflowStorage.setItem('save_data_consent', 'erase');
    setHasSaveDataConsent(false);
    setShowSaveDataConsent(false);
    setPendingProfile(null);

    // Clear all workflow data from localStorage (respect privacy choice)
    workflowStorage.removeItem('usmca_workflow_results');
    workflowStorage.removeItem('usmca_workflow_data');
    workflowStorage.removeItem('usmca_company_data');

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
   * Load email notification preferences from database
   */
  const loadEmailPreferences = async () => {
    try {
      const response = await fetch('/api/user-profile/get-email-preferences', {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) {
        console.warn('Could not load email preferences, using defaults (all enabled)');
        return;
      }

      const data = await response.json();
      const preferences = data.email_preferences || {};

      console.log('✅ Loaded email preferences from database:', preferences);

      // Set component email notifications
      setComponentEmailNotifications(preferences);

      // Set market intel email preference
      if (preferences.marketIntel !== undefined) {
        setIncludeMarketIntelInEmail(preferences.marketIntel);
      }
    } catch (error) {
      console.error('Error loading email preferences:', error);
      // Use defaults (all enabled)
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
      // ✅ NEW (Nov 8): Include alert selection mode and selected IDs
      const response = await fetch('/api/generate-portfolio-briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          workflow_data: workflowData,
          user_id: user?.id,
          // Alert selection mode: AI auto-select vs manual override
          allow_ai_select_alerts: allowAISelectAlerts,
          selected_alert_ids: !allowAISelectAlerts ? selectedAlertIds : null
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

        // ✅ NEW: Save strategic alerts from briefing for USMCA 2026 section
        // This avoids making a separate AI filtering call (saves $0.01/page load)
        if (data.strategic_alerts) {
          setStrategicAlerts(data.strategic_alerts);
          console.log(`🤖 Using ${data.strategic_alerts.length} strategic alerts from briefing (no separate AI call needed)`);
        }

        // ✅ AUTO-SAVE: Save portfolio briefing to database automatically
        // No manual button needed - user already consented by completing workflow
        try {
          console.log('💾 Saving portfolio briefing to database...', {
            briefingLength: data.briefing?.length,
            alertCount: data.matched_alerts?.length
          });

          const saveResponse = await fetch('/api/workflow-session/update-executive-alert', {
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

          const saveResult = await saveResponse.json();
          if (saveResponse.ok && saveResult.success) {
            console.log('✅ Portfolio briefing auto-saved to database successfully');
          } else {
            console.error('⚠️ Auto-save returned error:', saveResult);
          }
        } catch (saveError) {
          console.error('⚠️ Auto-save failed (non-critical):', saveError);
          // Don't block UI - briefing still displays from state
        }

        // ✅ FIX (Nov 7): Refresh usage stats after briefing generation
        // This updates the counter display from (0/30 used) to (1/30 used)
        try {
          const dashboardResponse = await fetch('/api/dashboard-data', {
            credentials: 'include'
          });
          if (dashboardResponse.ok) {
            const dashboardData = await dashboardResponse.json();
            if (dashboardData.briefing_usage_stats) {
              setBriefingUsageStats(dashboardData.briefing_usage_stats);
              console.log('✅ Usage stats refreshed:', dashboardData.briefing_usage_stats);
            }
          }
        } catch (statsError) {
          console.error('⚠️ Failed to refresh usage stats (non-critical):', statsError);
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

      // ✅ FIX (Nov 7): Populate strategic alerts for USMCA 2026 section
      // Filter for high-priority policy alerts (critical/high severity)
      const highPriorityAlerts = alerts.filter(alert => {
        const severity = (alert.severity || '').toLowerCase();
        return severity === 'critical' || severity === 'high';
      });

      console.log(`📊 Setting ${highPriorityAlerts.length} strategic alerts for USMCA 2026 section`);
      setStrategicAlerts(highPriorityAlerts);

      if (alerts.length > 0) {
        setProgressSteps(prev => [...prev, `Found ${alerts.length} policy alerts`]);
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

                {/* ✅ NEW (Nov 8): Alert Selection for Portfolio Briefing - Positioned above table for easy access */}
                <div style={{
                  padding: '1rem',
                  background: '#f0fdf4',
                  border: '1px solid #86efac',
                  borderRadius: '8px',
                  marginTop: '1rem',
                  marginBottom: '1.5rem'
                }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    cursor: 'pointer',
                    fontSize: '0.9375rem',
                    fontWeight: 500
                  }}>
                    <input
                      type="checkbox"
                      checked={allowAISelectAlerts}
                      onChange={(e) => {
                        setAllowAISelectAlerts(e.target.checked);
                        if (e.target.checked) {
                          setSelectedAlertIds([]); // Clear manual selection when switching to AI mode
                        }
                      }}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <span>🤖 Allow AI to choose alerts for <strong>Portfolio Briefing report</strong>, or manually select up to 3 (HIGH/CRITICAL alerts only)</span>
                  </label>

                  {/* Manual Alert Selection Summary - ONLY show when AI checkbox is unchecked */}
                  {!allowAISelectAlerts && (
                    <div style={{
                      marginTop: '1rem',
                      padding: '1rem',
                      background: 'white',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px'
                    }}>
                      <div style={{ marginBottom: '0.5rem', fontWeight: 600, color: '#111827', fontSize: '0.875rem' }}>
                        📋 Select up to 3 HIGH/CRITICAL alerts for Portfolio Briefing report
                      </div>
                      <p style={{ fontSize: '0.8125rem', color: '#6b7280', margin: '0 0 0.75rem 0' }}>
                        Choose from component alerts (🔴 CRITICAL, 🟠 HIGH, or 🆕 NEW) and/or USMCA 2026 Market Intelligence. Expand components below to see selectable alerts.
                      </p>
                      {selectedAlertIds.length === 0 ? (
                        <div style={{
                          padding: '1rem',
                          background: '#f9fafb',
                          border: '1px dashed #d1d5db',
                          borderRadius: '4px',
                          textAlign: 'center',
                          color: '#6b7280',
                          fontSize: '0.8125rem'
                        }}>
                          No alerts selected. AI will auto-select if you don't choose any.
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#059669', marginBottom: '0.25rem' }}>
                            ✅ {selectedAlertIds.length} alert{selectedAlertIds.length !== 1 ? 's' : ''} selected {selectedAlertIds.length >= 3 ? '(maximum reached)' : `(${3 - selectedAlertIds.length} more available)`}
                          </div>
                          {selectedAlertIds.map(alertId => {
                            const alert = realPolicyAlerts.find(a => a.id === alertId);
                            return alert ? (
                              <div key={alertId} style={{
                                padding: '0.75rem',
                                background: '#f0fdf4',
                                border: '1px solid #86efac',
                                borderRadius: '4px',
                                fontSize: '0.8125rem'
                              }}>
                                <div style={{ fontWeight: 600, color: '#111827', marginBottom: '0.25rem' }}>
                                  {alert.title}
                                </div>
                                <div className="text-gray-600" style={{ fontSize: '0.75rem' }}>
                                  {alert.severity_level && (
                                    <span style={{
                                      background: alert.severity_level === 'critical' ? '#fee2e2' : alert.severity_level === 'high' ? '#fef3c7' : '#dbeafe',
                                      color: alert.severity_level === 'critical' ? '#dc2626' : alert.severity_level === 'high' ? '#f59e0b' : '#3b82f6',
                                      padding: '0.125rem 0.5rem',
                                      borderRadius: '4px',
                                      marginRight: '0.5rem',
                                      fontSize: '0.6875rem'
                                    }}>
                                      {alert.severity_level.toUpperCase()}
                                    </span>
                                  )}
                                  {alert.affected_countries?.join(', ')}
                                </div>
                              </div>
                            ) : null;
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>

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
                <div className="component-table-header" style={{
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
                  <div className="font-bold text-sm text-gray-600" style={{ flex: '2', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Component
                  </div>
                  <div className="text-center font-bold text-sm text-gray-600" style={{ flex: '1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Origin
                  </div>
                  <div className="text-center font-bold text-sm text-gray-600" style={{ flex: '1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    HS Code
                  </div>
                  <div className="text-center font-bold text-sm text-gray-600" style={{ flex: '1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Value %
                  </div>
                  <div className="text-center font-bold text-sm text-gray-600" style={{ flex: '1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Alerts
                  </div>
                  <div className="text-center font-bold text-sm text-gray-600" style={{ flex: '0.75', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
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

                  // ✅ NEW: Check component volatility tier
                  const componentVolatility = VolatilityManager.getVolatilityTier(
                    comp.hs_code,
                    comp.origin_country || comp.country,
                    userProfile.destinationCountry || 'US'
                  );

                  console.log(`🔍 Component volatility check: ${comp.component_type}`, {
                    hs_code: comp.hs_code,
                    origin: comp.origin_country || comp.country,
                    destination: userProfile.destinationCountry,
                    tier: componentVolatility.tier,
                    volatility: componentVolatility.volatility,
                    reason: componentVolatility.reason
                  });

                  // ✅ COMPONENT-SPECIFIC ALERTS (Nov 12): Only show alerts directly affecting THIS component
                  // Match alerts by: (HS code match) OR (Origin country + Blanket policy)
                  // This prevents showing ALL policy alerts on every component
                  let componentAlerts = (realPolicyAlerts || consolidatedAlerts).filter(alert => {
                    const componentOrigin = (comp.origin_country || comp.country)?.toUpperCase();
                    const componentHS = comp.hs_code;
                    const userDestination = (userProfile.destinationCountry || 'US').toUpperCase();

                    console.log(`🔍 Checking alert "${alert.title?.substring(0, 50)}..." against component ${componentHS}:`, {
                      componentOrigin,
                      componentHS,
                      userDestination,
                      alert_countries: alert.affected_countries,
                      alert_hs_codes: alert.affected_hs_codes
                    });

                    // ✅ STRICT FILTER (Nov 20): Reject generic RSS news
                    // Real tariff alerts MUST have HS codes OR industries (countries alone = generic news)
                    const hasHSCodes = alert.affected_hs_codes && alert.affected_hs_codes.length > 0;
                    const hasIndustries = alert.relevant_industries && alert.relevant_industries.length > 0;

                    if (!hasHSCodes && !hasIndustries) {
                      console.log(`❌ [ALERTS DASHBOARD] Skipping generic news: "${alert.title}" (no HS codes AND no industries)`);
                      return false;
                    }

                    // ✅ CRITERION 1: Check days until impact (≤180 days)
                    if (alert.effective_date) {
                      const effectiveDate = new Date(alert.effective_date);
                      const today = new Date();
                      const daysUntilImpact = Math.ceil((effectiveDate - today) / (1000 * 60 * 60 * 24));

                      if (daysUntilImpact > 180) {
                        console.log(`⏭️ Skipping (>180 days): "${alert.title}" (${daysUntilImpact} days until impact)`);
                        return false;
                      }
                    }

                    // ❌ EXCLUDE: Operational alerts (logistics, earnings, non-policy)
                    const title = alert.title?.toLowerCase() || '';
                    const description = alert.description?.toLowerCase() || '';
                    const text = `${title} ${description}`;

                    const operationalKeywords = [
                      'earnings', 'quarterly', 'profit', 'revenue', 'stock price',
                      'freight rate', 'diesel price', 'capacity', 'carrier', 'fleet',
                      'warehouse', 'automation', 'patent', 'gaming', 'postal'
                    ];

                    const isOperational = operationalKeywords.some(kw => text.includes(kw));
                    if (isOperational) {
                      console.log(`🚫 Excluded operational: "${alert.title}"`);
                      return false;
                    }

                    // ✅ MATCH 1: HS code match (most specific - targets this exact component)
                    const validHSCodes = (alert.affected_hs_codes || []).filter(code => {
                      const normalized = String(code).replace(/\./g, '');
                      return normalized.length >= 6 && !/^20\d{2}$/.test(normalized);
                    });

                    if (validHSCodes.length > 0 && componentHS) {
                      const hsMatch = validHSCodes.some(code => {
                        const normalizedComponentHS = componentHS.replace(/\./g, '');
                        const normalizedAlertCode = String(code).replace(/\./g, '').substring(0, 6);
                        return normalizedComponentHS.startsWith(normalizedAlertCode);
                      });

                      if (hsMatch) {
                        console.log(`✅ HS CODE MATCH: ${alert.title} affects HS ${componentHS}`);
                        return true;
                      }
                    }

                    // ✅ MATCH 2: Industry + Country match (e.g., Yazaki automotive alert)
                    // Must have BOTH industry relevance AND country match
                    if (hasIndustries && alert.affected_countries?.length > 0) {
                      const countryMatch = alert.affected_countries.some(country => {
                        const normalized = country.toUpperCase();
                        return normalized === componentOrigin;
                      });

                      if (countryMatch) {
                        console.log(`✅ [ALERTS DASHBOARD] Industry + Country match: "${alert.title}" affects ${componentOrigin} (${alert.relevant_industries.join(', ')})`);
                        return true;
                      }
                    }

                    // No match - don't show this alert for this component
                    console.log(`❌ FILTERED OUT: ${alert.title} does not affect component HS ${componentHS} from ${componentOrigin}`, {
                      alert_countries: alert.affected_countries,
                      alert_hs_codes: alert.affected_hs_codes,
                      componentHS,
                      componentOrigin,
                      userDestination
                    });
                    return false;
                  });

                  // ✅ NEW: Add volatility context to each alert and sort by priority
                  componentAlerts = componentAlerts
                    .map(alert => ({
                      ...alert,
                      component_volatility_tier: componentVolatility.tier,
                      component_volatility_warning: componentVolatility.warning,
                      component_policies_applicable: componentVolatility.policies
                    }))
                    .sort((a, b) => {
                      // Priority 1: Component volatility tier (Tier 1 = super volatile, show first)
                      if (a.component_volatility_tier !== b.component_volatility_tier) {
                        return a.component_volatility_tier - b.component_volatility_tier;
                      }
                      // Priority 2: Alert severity (CRITICAL > HIGH > MEDIUM > LOW)
                      const severityOrder = { critical: 1, high: 2, medium: 3, low: 4 };
                      const aSeverity = severityOrder[(a.severity || '').toLowerCase()] || 99;
                      const bSeverity = severityOrder[(b.severity || '').toLowerCase()] || 99;
                      return aSeverity - bSeverity;
                    });

                  const isExpanded = expandedComponents[idx] || false;
                  const hasAlerts = componentAlerts.length > 0;
                  const emailEnabled = componentEmailNotifications[idx] !== undefined ? componentEmailNotifications[idx] : true; // Default to checked

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
                        className="component-table-row"
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
                        <span className="component-expand-icon" style={{
                          fontSize: '1.25rem',
                          color: hasAlerts ? '#6b7280' : '#d1d5db',
                          width: '1.25rem',
                          textAlign: 'center'
                        }}>
                          {hasAlerts ? (isExpanded ? '▼' : '▶') : '—'}
                        </span>

                        {/* Component Name */}
                        <div className="component-table-cell font-bold text-sm" data-label="Component" style={{ flex: '2', color: '#111827', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span title={comp.component_type || comp.description || `Component ${idx + 1}`}>
                            {(() => {
                              const fullName = comp.component_type || comp.description || `Component ${idx + 1}`;
                              // Take first part before comma (e.g., "Printed circuit board assembly")
                              const shortName = fullName.split(',')[0].trim();
                              return shortName;
                            })()}
                          </span>
                          {/* Volatility Badge */}
                          {comp.volatility_tier === 1 && (
                            <span
                              title={`Super Volatile: ${comp.volatility_reason || 'Rates change daily'}`}
                              style={{
                                background: '#fef3c7',
                                color: '#92400e',
                                padding: '0.125rem 0.5rem',
                                borderRadius: '8px',
                                fontSize: '0.625rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                border: '1px solid #fbbf24',
                                cursor: 'help'
                              }}
                            >
                              🔴 Volatile
                            </span>
                          )}
                          {comp.volatility_tier === 2 && (
                            <span
                              title={`Volatile: ${comp.volatility_reason || 'Rates change weekly'}`}
                              style={{
                                background: '#dbeafe',
                                color: '#1e40af',
                                padding: '0.125rem 0.5rem',
                                borderRadius: '8px',
                                fontSize: '0.625rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                border: '1px solid #93c5fd',
                                cursor: 'help'
                              }}
                            >
                              🟡 Volatile
                            </span>
                          )}
                        </div>

                        {/* Origin Country */}
                        <div className="component-table-cell text-center text-sm text-gray-600" data-label="Origin" style={{ flex: '1' }}>
                          {comp.origin_country || comp.country}
                        </div>

                        {/* HS Code */}
                        <div className="component-table-cell" data-label="HS Code" style={{ flex: '1', textAlign: 'center', fontSize: '0.875rem', color: '#6b7280' }}>
                          {comp.hs_code || '—'}
                        </div>

                        {/* Value Percentage */}
                        <div className="component-table-cell text-center font-bold text-sm" data-label="Value %" style={{ flex: '1', color: '#111827' }}>
                          {comp.percentage || comp.value_percentage}%
                        </div>

                        {/* Alert Badge */}
                        <div className="component-table-cell" data-label="Alerts" style={{ flex: '1', textAlign: 'center' }}>
                          {componentAlerts.length > 0 ? (
                            <span style={{
                              background: '#fee2e2',
                              color: '#dc2626',
                              padding: '0.25rem 0.75rem',
                              borderRadius: '12px',
                              fontSize: '0.875rem',
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
                              fontSize: '0.875rem',
                              fontWeight: 600
                            }}>
                              ✅ No alerts
                            </span>
                          )}
                        </div>

                        {/* Email Notification Checkbox - Show for ALL components (alerts might come in future) */}
                        {/* ✅ FIX (Nov 8): Default to CHECKED for better user retention */}
                        <div className="component-table-cell" data-label="Email Alerts" style={{ flex: '0.75', textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={emailEnabled ?? true}
                            onChange={(e) => {
                              e.stopPropagation(); // Prevent row expansion when clicking checkbox
                              if (userTier === 'Trial' || userTier === 'trial') {
                                alert('📧 Email alerts are available on paid plans. Upgrade to Starter ($29/mo) to receive email notifications when tariff policies change.');
                                return;
                              }
                              toggleComponentEmailNotification(idx);
                            }}
                            disabled={userTier === 'Trial' || userTier === 'trial'}
                            style={{
                              width: '18px',
                              height: '18px',
                              cursor: userTier === 'Trial' || userTier === 'trial' ? 'not-allowed' : 'pointer',
                              opacity: userTier === 'Trial' || userTier === 'trial' ? 0.5 : 1
                            }}
                            title={userTier === 'Trial' || userTier === 'trial' ? '🔒 Email alerts available on paid plans - Upgrade to enable' : 'Receive email notifications for future alerts affecting this component'}
                          />
                        </div>
                      </div>

                      {/* Expanded Content - Alerts Only */}
                      {isExpanded && (
                        <div style={{ padding: '1.5rem', borderTop: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
                          {/* ✅ NEW: Volatility Warning Banner */}
                          {componentVolatility.tier <= 2 && componentVolatility.warning && (
                            <div style={{
                              padding: '1rem',
                              marginBottom: '1rem',
                              background: componentVolatility.tier === 1 ? '#fef3c7' : '#dbeafe',
                              border: `2px solid ${componentVolatility.tier === 1 ? '#f59e0b' : '#3b82f6'}`,
                              borderRadius: '8px',
                              fontSize: '0.875rem'
                            }}>
                              <div style={{ fontWeight: 600, marginBottom: '0.5rem', color: componentVolatility.tier === 1 ? '#92400e' : '#1e3a8a' }}>
                                {componentVolatility.tier === 1 ? '🔴 Super Volatile Rate' : '🟡 Volatile Rate'}
                              </div>
                              <div style={{ color: componentVolatility.tier === 1 ? '#92400e' : '#1e40af', marginBottom: '0.5rem' }}>
                                {componentVolatility.reason}
                              </div>
                              {componentVolatility.policies && (
                                <div style={{ fontSize: '0.8125rem', color: '#6b7280', marginTop: '0.5rem' }}>
                                  <strong>Applicable Policies:</strong> {componentVolatility.policies.join(', ')}
                                </div>
                              )}
                            </div>
                          )}

                          {/* ✅ NEW: Rate Freshness Indicator */}
                          {comp.volatility_tier && (
                            <div style={{
                              padding: '0.75rem 1rem',
                              marginBottom: '1rem',
                              background: '#f0fdf4',
                              border: '1px solid #bbf7d0',
                              borderRadius: '6px',
                              fontSize: '0.8125rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem'
                            }}>
                              <span style={{ fontSize: '1rem' }}>🔄</span>
                              <div style={{ flex: 1, color: '#166534' }}>
                                {section301 > 0 && (
                                  <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                                    Section 301 Rate: {(section301 * 100).toFixed(1)}%
                                  </div>
                                )}
                                {comp.last_verified || comp.verified_date ? (
                                  <div>
                                    Verified {comp.verified_date || new Date(comp.last_verified).toISOString().split('T')[0]}
                                    {comp.verified_time && ` at ${comp.verified_time}`}
                                    {comp.cache_age_days !== undefined && comp.cache_age_days > 0 && (
                                      <span style={{ fontStyle: 'italic', marginLeft: '0.5rem' }}>
                                        ({comp.cache_age_days} day{comp.cache_age_days !== 1 ? 's' : ''} ago)
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <div>Verified today</div>
                                )}
                                <div style={{ fontSize: '0.75rem', color: '#15803d', marginTop: '0.25rem' }}>
                                  ⚠️ This rate is refreshed {comp.volatility_refresh_frequency || 'regularly'}
                                  {comp.volatility_tier === 1 && ' (daily for super-volatile components)'}
                                </div>
                              </div>
                            </div>
                          )}

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

                                  // ✅ Only allow selection of HIGH/CRITICAL severity OR NEW status alerts
                                  const isSelectableAlert = severity === 'critical' || severity === 'high' || alert.lifecycle_status === 'NEW';

                                  return (
                                  <div key={alertIdx} style={{
                                    background: 'white',
                                    border: `2px solid ${borderColor}`,
                                    borderLeft: `5px solid ${severityColor}`,
                                    borderRadius: '6px',
                                    padding: '1rem',
                                    opacity: alert.lifecycle_status === 'RESOLVED' ? 0.7 : 1
                                  }}>
                                    <div className="alert-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                                      {/* ✅ Alert selection checkbox - ONLY for HIGH/CRITICAL/NEW alerts */}
                                      {!allowAISelectAlerts && isSelectableAlert && (
                                        <div style={{ marginRight: '0.75rem', paddingTop: '0.125rem' }}>
                                          <input
                                            type="checkbox"
                                            checked={selectedAlertIds.includes(alert.id)}
                                            onChange={(e) => {
                                              e.stopPropagation();
                                              if (e.target.checked) {
                                                if (selectedAlertIds.length < 3) {
                                                  setSelectedAlertIds([...selectedAlertIds, alert.id]);
                                                } else {
                                                  alert('⚠️ Maximum 3 alerts can be selected. Uncheck an alert above to select this one.');
                                                }
                                              } else {
                                                setSelectedAlertIds(selectedAlertIds.filter(id => id !== alert.id));
                                              }
                                            }}
                                            disabled={selectedAlertIds.length >= 3 && !selectedAlertIds.includes(alert.id)}
                                            style={{
                                              width: '18px',
                                              height: '18px',
                                              cursor: selectedAlertIds.length >= 3 && !selectedAlertIds.includes(alert.id) ? 'not-allowed' : 'pointer'
                                            }}
                                            title={
                                              selectedAlertIds.includes(alert.id)
                                                ? 'Selected for Portfolio Briefing'
                                                : selectedAlertIds.length >= 3
                                                ? 'Maximum 3 alerts already selected'
                                                : 'Select this alert for Portfolio Briefing (HIGH/CRITICAL only)'
                                            }
                                          />
                                        </div>
                                      )}
                                      <div className="alert-card-title" style={{ fontWeight: 600, color: '#111827', fontSize: '0.9375rem', flex: 1 }}>
                                        {alert.consolidated_title || alert.title}
                                      </div>
                                      <div className="alert-card-badges" style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
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

                                    {/* ✅ NEW (Nov 8): Source URL link to full article */}
                                    {alert.source_url && (
                                      <div style={{ marginTop: '0.75rem' }}>
                                        <a
                                          href={alert.source_url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            color: '#3b82f6',
                                            fontSize: '0.8125rem',
                                            fontWeight: 600,
                                            textDecoration: 'none',
                                            padding: '0.5rem 0.75rem',
                                            background: '#eff6ff',
                                            border: '1px solid #bfdbfe',
                                            borderRadius: '6px',
                                            transition: 'all 0.2s'
                                          }}
                                          onMouseEnter={(e) => {
                                            e.target.style.background = '#dbeafe';
                                            e.target.style.borderColor = '#93c5fd';
                                          }}
                                          onMouseLeave={(e) => {
                                            e.target.style.background = '#eff6ff';
                                            e.target.style.borderColor = '#bfdbfe';
                                          }}
                                        >
                                          📄 Read Full Article
                                          <span style={{ fontSize: '0.75rem' }}>↗</span>
                                        </a>
                                      </div>
                                    )}

                                    {/* ❌ REMOVED (Nov 8): Mark Resolved/Archive buttons - users don't resolve policies, they respond to them */}

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

                {/* USMCA 2026 Renegotiation & Market Intelligence Row */}
                {(() => {
                  // Focus on USMCA 2026 renegotiation alerts that affect ALL users
                  // Plus general trade intelligence relevant to user's supply chain
                  const userCountries = [...new Set(
                    userProfile.componentOrigins.map(c => (c.origin_country || c.country)?.toUpperCase())
                  )].filter(Boolean);

                  const userIndustry = userProfile.industry_sector?.toLowerCase() || '';

                  // ✅ DEDUPLICATE (Nov 20): Only show alerts NOT already matched to components
                  // Avoid showing the same alert twice (once in component rows, again here)
                  const allComponentAlerts = userProfile.componentOrigins.flatMap(comp => {
                    return (realPolicyAlerts || []).filter(alert => {
                      const hasHSCodes = alert.affected_hs_codes && alert.affected_hs_codes.length > 0;
                      const hasIndustries = alert.relevant_industries && alert.relevant_industries.length > 0;
                      if (!hasHSCodes && !hasIndustries) return false;

                      // Check if this alert matches this component
                      const componentHS = comp.hs_code;
                      if (hasHSCodes && componentHS) {
                        const hsMatch = alert.affected_hs_codes.some(code => {
                          const normalizedComponentHS = componentHS.replace(/\./g, '').substring(0, 6);
                          const normalizedAlertCode = String(code).replace(/\./g, '').substring(0, 6);
                          return normalizedComponentHS === normalizedAlertCode;
                        });
                        if (hsMatch) return true;
                      }
                      return false;
                    });
                  });

                  const componentAlertIds = new Set(allComponentAlerts.map(a => a.id));

                  // ✅ STRATEGIC ALERTS ONLY: Broad policy changes affecting ALL users
                  // EXCLUDE alerts already shown in component rows
                  const marketIntelAlerts = (strategicAlerts || []).filter(alert => {
                    // Skip if already shown in component alerts
                    if (componentAlertIds.has(alert.id)) {
                      console.log(`⏭️ [USMCA 2026] Skipping "${alert.title}" (already shown in component alerts)`);
                      return false;
                    }

                    // ✅ ONLY show broad policy alerts (no specific HS codes, or very general)
                    // Example: "USMCA 2026 Renegotiation", "General tariff policy changes"
                    const title = alert.title?.toLowerCase() || '';
                    const isUSMCARenegotiation = title.includes('usmca') && (title.includes('2026') || title.includes('renegotiation'));
                    const isGeneralPolicy = title.includes('agreement') || title.includes('trade representative') || title.includes('sme dialogue');

                    if (isUSMCARenegotiation || isGeneralPolicy) {
                      console.log(`✅ [USMCA 2026] Including broad policy: "${alert.title}"`);
                      return true;
                    }

                    console.log(`⏭️ [USMCA 2026] Skipping component-specific: "${alert.title}"`);
                    return false;
                  });

                  // ✅ ALWAYS SHOW this section (even with 0 alerts) so users can opt into USMCA 2026 monitoring
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
                        className="component-table-row"
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
                        <span className="component-expand-icon" style={{
                          fontSize: '1.25rem',
                          color: '#f59e0b',
                          width: '1.25rem',
                          textAlign: 'center'
                        }}>
                          {isExpanded ? '▼' : '▶'}
                        </span>

                        {/* Name */}
                        <div className="component-table-cell font-bold text-sm" data-label="Component" style={{ flex: '2', color: '#111827', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          🇺🇸🇨🇦🇲🇽 USMCA 2026
                        </div>

                        {/* Origin */}
                        <div className="component-table-cell" data-label="Origin" style={{ flex: '1', textAlign: 'center', color: '#6b7280', fontFamily: 'monospace', fontSize: '0.875rem' }}>
                          All
                        </div>

                        {/* HS Code */}
                        <div className="component-table-cell" data-label="HS Code" style={{ flex: '1', textAlign: 'center', fontFamily: 'monospace', fontSize: '0.875rem', color: '#6b7280' }}>
                          —
                        </div>

                        {/* Value % */}
                        <div className="component-table-cell text-center font-bold text-sm" data-label="Value %" style={{ flex: '1', color: '#111827' }}>
                          N/A
                        </div>

                        {/* Alert Badge */}
                        <div className="component-table-cell" data-label="Alerts" style={{ flex: '1', textAlign: 'center' }}>
                          <span style={{
                            background: '#fef3c7',
                            color: '#92400e',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '12px',
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            border: '1px solid #f59e0b'
                          }}>
                            📌 {marketIntelAlerts.length} insights
                          </span>
                        </div>

                        {/* Email Checkbox */}
                        <div className="component-table-cell" data-label="Email Alerts" style={{ flex: '0.75', textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={includeMarketIntelInEmail}
                            onChange={async (e) => {
                              e.stopPropagation();
                              if (userTier === 'Trial' || userTier === 'trial') {
                                alert('📧 Email alerts available on paid plans. Upgrade to Starter ($29/mo) to receive email notifications.');
                                return;
                              }

                              const newValue = e.target.checked;
                              setIncludeMarketIntelInEmail(newValue);

                              // Save to database
                              try {
                                const response = await fetch('/api/user-profile/update-email-preferences', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  credentials: 'include',
                                  body: JSON.stringify({
                                    userId: user?.id,
                                    preferences: {
                                      ...componentEmailNotifications,
                                      marketIntel: newValue
                                    }
                                  })
                                });

                                if (!response.ok) {
                                  console.error('Failed to save market intel email preference');
                                  setIncludeMarketIntelInEmail(!newValue); // Revert
                                } else {
                                  console.log(`✅ Saved market intel email preference: ${newValue}`);
                                }
                              } catch (error) {
                                console.error('Error saving market intel email preference:', error);
                                setIncludeMarketIntelInEmail(!newValue); // Revert
                              }
                            }}
                            disabled={userTier === 'Trial' || userTier === 'trial'}
                            title={userTier === 'Trial' || userTier === 'trial' ? '🔒 Email alerts available on paid plans - Upgrade to enable' : 'Include market intelligence in email alerts (AI always uses these for analysis)'}
                            style={{
                              width: '18px',
                              height: '18px',
                              cursor: userTier === 'Trial' || userTier === 'trial' ? 'not-allowed' : 'pointer',
                              opacity: userTier === 'Trial' || userTier === 'trial' ? 0.5 : 1
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
                            <strong>📅 USMCA 2026 Renegotiation:</strong> The USMCA agreement is up for review in 2026, affecting ALL North American supply chains. This section tracks trade policy shifts, negotiation updates, and strategic preparation guidance. Enable email to stay informed about developments that could impact your business.
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {marketIntelAlerts.map((alert, idx) => {
                              // ✅ Generate portfolio-specific context for this alert
                              const alertText = `${alert.title} ${alert.description}`.toLowerCase();
                              const affectedComponents = userProfile.componentOrigins.filter(comp => {
                                const origin = (comp.origin_country || comp.country)?.toUpperCase();
                                const countryNames = {
                                  'CN': ['china', 'chinese', 'beijing'],
                                  'MX': ['mexico', 'mexican'],
                                  'CA': ['canada', 'canadian'],
                                  'US': ['united states', 'u.s.', 'usa', 'american']
                                };
                                return (countryNames[origin] || []).some(name => alertText.includes(name));
                              });

                              const portfolioContext = affectedComponents.length > 0
                                ? `Affects your ${affectedComponents.map(c => c.component_type || c.description).join(', ')} sourcing`
                                : 'General supply chain intelligence';

                              return (
                                <div key={idx} style={{
                                  padding: '1rem',
                                  background: 'white',
                                  borderRadius: '8px',
                                  border: '1px solid #e5e7eb'
                                }}>
                                  {/* Portfolio Context Badge */}
                                  {affectedComponents.length > 0 && (
                                    <div style={{
                                      display: 'inline-block',
                                      background: '#eff6ff',
                                      color: '#1e40af',
                                      padding: '0.25rem 0.5rem',
                                      borderRadius: '6px',
                                      fontSize: '0.75rem',
                                      fontWeight: 600,
                                      marginBottom: '0.5rem'
                                    }}>
                                      🎯 {portfolioContext}
                                    </div>
                                  )}

                                  <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'start',
                                    marginBottom: '0.5rem'
                                  }}>
                                    {/* ✅ NEW (Nov 8): Alert selection checkbox for USMCA 2026 insights */}
                                    {!allowAISelectAlerts && (
                                      <div style={{ marginRight: '0.75rem', paddingTop: '0.125rem' }}>
                                        <input
                                          type="checkbox"
                                          checked={selectedAlertIds.includes(alert.id)}
                                          onChange={(e) => {
                                            e.stopPropagation();
                                            if (e.target.checked) {
                                              if (selectedAlertIds.length < 3) {
                                                setSelectedAlertIds([...selectedAlertIds, alert.id]);
                                              } else {
                                                alert('⚠️ Maximum 3 alerts can be selected. Uncheck an alert to select this one.');
                                              }
                                            } else {
                                              setSelectedAlertIds(selectedAlertIds.filter(id => id !== alert.id));
                                            }
                                          }}
                                          disabled={selectedAlertIds.length >= 3 && !selectedAlertIds.includes(alert.id)}
                                          style={{
                                            width: '18px',
                                            height: '18px',
                                            cursor: selectedAlertIds.length >= 3 && !selectedAlertIds.includes(alert.id) ? 'not-allowed' : 'pointer'
                                          }}
                                          title={
                                            selectedAlertIds.includes(alert.id)
                                              ? 'Selected for Portfolio Briefing'
                                              : selectedAlertIds.length >= 3
                                              ? 'Maximum 3 alerts already selected'
                                              : 'Select this alert for Portfolio Briefing (max 3)'
                                          }
                                        />
                                      </div>
                                    )}
                                    <div style={{ fontWeight: 600, color: '#111827', fontSize: '0.9375rem', flex: 1 }}>
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
                              );
                            })}
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
                      <Link href="/usmca-workflow" className="btn-primary" style={{ display: 'inline-block', marginTop: '0.5rem' }}>
                        🚀 Start USMCA Workflow
                      </Link>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="hero-buttons">
                    <button
                      onClick={() => {
                        console.log('🔵 USMCA 2026 button clicked!', {
                          userProfile,
                          allowAISelectAlerts,
                          selectedAlertIds: !allowAISelectAlerts ? selectedAlertIds : 'AI_AUTO_SELECT'
                        });
                        loadPortfolioBriefing(userProfile);
                      }}
                      className={briefingUsageStats.limit_reached ? "btn-secondary" : "btn-primary"}
                      disabled={isLoadingPolicyAlerts || briefingUsageStats.limit_reached}
                      style={briefingUsageStats.limit_reached ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
                    >
                      {isLoadingPolicyAlerts
                        ? `⏳ Analyzing... ${analysisElapsedSeconds}s`
                        : briefingUsageStats.limit_reached
                        ? `🔒 Monthly Limit Reached (${briefingUsageStats.used}/${briefingUsageStats.limit})`
                        : portfolioBriefing
                        ? `🔄 Regenerate Analysis (${briefingUsageStats.used}/${briefingUsageStats.limit === null ? '∞' : briefingUsageStats.limit} used)`
                        : `📊 USMCA 2026 Impact Analysis (${briefingUsageStats.used}/${briefingUsageStats.limit === null ? '∞' : briefingUsageStats.limit} used)`}
                    </button>

                    {/* Show upgrade CTA when limit reached */}
                    {briefingUsageStats.limit_reached && (
                      <Link href="/subscription" className="btn-primary">
                        Upgrade for More Briefings
                      </Link>
                    )}
                  </div>

                  {/* Display Portfolio Briefing with Collapsible Structure */}
                  {portfolioBriefing && (
                    <PortfolioBriefingDisplay
                      briefingContent={portfolioBriefing}
                      userTier={userTier}
                    />
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Next Steps - ALWAYS show after analysis runs (even if 0 alerts) */}
        {alertsGenerated && (
          <div className="form-section" style={{ marginTop: '2rem' }}>
            <h2 className="form-section-title">Next Steps</h2>
            <p className="text-body" style={{ marginBottom: '1rem' }}>
              ✅ Analysis complete and automatically saved to your dashboard. Access from any device or download as PDF.
            </p>

            <div className="hero-buttons">
              {/* Download PDF of Strategic Analysis */}
              <button
                onClick={async () => {
                  if (userTier === 'Trial') {
                    alert('PDF download is available for paying subscribers. Upgrade to download your strategic analysis.');
                    window.location.href = '/pricing';
                    return;
                  }

                  if (!portfolioBriefing) {
                    alert('Please generate the strategic analysis first.');
                    return;
                  }

                  try {
                    const { jsPDF } = await import('jspdf');

                    const doc = new jsPDF({
                      orientation: 'portrait',
                      unit: 'mm',
                      format: 'letter'
                    });

                    // Page dimensions
                    const PAGE = {
                      width: 216,
                      height: 279,
                      margin: 15
                    };

                    const contentWidth = PAGE.width - (PAGE.margin * 2);
                    let y = PAGE.margin;

                    // Helper function to parse markdown sections
                    const parseSections = (content) => {
                      if (!content) return [];
                      const sections = [];
                      const lines = content.split('\n');
                      let currentSection = { title: '', content: '' };

                      lines.forEach(line => {
                        if (line.startsWith('## ')) {
                          if (currentSection.title) sections.push(currentSection);
                          currentSection = { title: line.replace('## ', '').trim(), content: '' };
                        } else if (line.startsWith('# ')) {
                          return; // Skip main title
                        } else {
                          currentSection.content += line + '\n';
                        }
                      });

                      if (currentSection.title) sections.push(currentSection);
                      return sections;
                    };

                    // Helper function to add text with wrapping
                    const addText = (text, fontSize = 10, isBold = false) => {
                      doc.setFontSize(fontSize);
                      doc.setFont(undefined, isBold ? 'bold' : 'normal');
                      const lines = doc.splitTextToSize(text, contentWidth);

                      lines.forEach(line => {
                        if (y > PAGE.height - PAGE.margin) {
                          doc.addPage();
                          y = PAGE.margin;
                        }
                        doc.text(line, PAGE.margin, y);
                        y += fontSize * 0.5;
                      });
                      y += 2;
                    };

                    // Header
                    doc.setFillColor(59, 130, 246); // Blue color
                    doc.rect(0, 0, PAGE.width, 35, 'F');

                    doc.setTextColor(255, 255, 255);
                    doc.setFontSize(18);
                    doc.setFont(undefined, 'bold');
                    doc.text('STRATEGIC PORTFOLIO ANALYSIS', PAGE.width / 2, 15, { align: 'center' });

                    doc.setFontSize(11);
                    doc.setFont(undefined, 'normal');
                    doc.text('USMCA 2026 Impact & Trade Risk Assessment', PAGE.width / 2, 23, { align: 'center' });

                    doc.setFontSize(9);
                    doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, PAGE.width / 2, 30, { align: 'center' });

                    // Reset text color for content
                    doc.setTextColor(0, 0, 0);
                    y = 45;

                    // Parse and add sections
                    const briefingContent = typeof portfolioBriefing === 'string' ? portfolioBriefing : '';
                    const sections = parseSections(briefingContent);

                    sections.forEach((section) => {
                      // Section title
                      if (section.title) {
                        doc.setFontSize(14);
                        doc.setFont(undefined, 'bold');
                        doc.setTextColor(59, 130, 246);

                        if (y > PAGE.height - 30) {
                          doc.addPage();
                          y = PAGE.margin;
                        }

                        doc.text(section.title, PAGE.margin, y);
                        y += 8;

                        // Underline
                        doc.setDrawColor(59, 130, 246);
                        doc.setLineWidth(0.5);
                        doc.line(PAGE.margin, y - 2, PAGE.width - PAGE.margin, y - 2);
                        y += 3;
                      }

                      // Section content
                      doc.setTextColor(31, 41, 55);
                      const paragraphs = section.content.split('\n\n');

                      paragraphs.forEach(paragraph => {
                        if (!paragraph.trim() || paragraph.trim() === '---') return;

                        // Handle bullet points
                        if (paragraph.trim().startsWith('•') || paragraph.trim().startsWith('-')) {
                          const bullets = paragraph.split('\n').filter(b => b.trim());
                          bullets.forEach(bullet => {
                            const cleanBullet = bullet.replace(/^[•\-]\s*/, '').trim();
                            doc.setFontSize(10);
                            doc.setFont(undefined, 'normal');
                            const bulletLines = doc.splitTextToSize('• ' + cleanBullet, contentWidth - 5);

                            bulletLines.forEach((line, idx) => {
                              if (y > PAGE.height - PAGE.margin) {
                                doc.addPage();
                                y = PAGE.margin;
                              }
                              doc.text(line, PAGE.margin + (idx > 0 ? 5 : 0), y);
                              y += 5;
                            });
                          });
                          y += 2;
                        } else {
                          // Regular paragraph - remove bold markdown
                          const cleanParagraph = paragraph.replace(/\*\*(.*?)\*\*/g, '$1');
                          addText(cleanParagraph.trim(), 10, false);
                        }
                      });

                      y += 3;
                    });

                    // Disclaimer footer
                    if (y > PAGE.height - 50) {
                      doc.addPage();
                      y = PAGE.margin;
                    }

                    y = Math.max(y, PAGE.height - 40);
                    doc.setFillColor(254, 243, 199);
                    doc.rect(PAGE.margin, y, contentWidth, 30, 'F');

                    doc.setTextColor(146, 64, 14);
                    doc.setFontSize(9);
                    doc.setFont(undefined, 'bold');
                    doc.text('DISCLAIMER', PAGE.margin + 3, y + 6);

                    doc.setFont(undefined, 'normal');
                    doc.setFontSize(8);
                    const disclaimerText = 'This is a research tool, not professional advice. All tariff calculations, savings estimates, and compliance guidance must be independently verified by licensed customs brokers or trade attorneys before making business decisions.';
                    const disclaimerLines = doc.splitTextToSize(disclaimerText, contentWidth - 6);

                    let disclaimerY = y + 11;
                    disclaimerLines.forEach(line => {
                      doc.text(line, PAGE.margin + 3, disclaimerY);
                      disclaimerY += 4;
                    });

                    // Save the PDF
                    const fileName = `Strategic_Portfolio_Analysis_${new Date().toISOString().split('T')[0]}.pdf`;
                    doc.save(fileName);

                  } catch (error) {
                    console.error('Failed to generate PDF:', error);
                    alert('Failed to generate PDF. Please try again.');
                  }
                }}
                className="btn-primary"
                disabled={userTier === 'Trial' || !portfolioBriefing}
                title={userTier === 'Trial' ? 'Upgrade to download PDF' : !portfolioBriefing ? 'Generate analysis first' : ''}
              >
                {userTier === 'Trial' ? '🔒 Download PDF (Upgrade)' : '📄 Download PDF'}
              </button>

              {/* New Analysis */}
              <button
                onClick={() => {
                  if (confirm('Start a new analysis? Your current alerts will be cleared.')) {
                    // Clear alert data
                    workflowStorage.removeItem('alert_impact_analysis');
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