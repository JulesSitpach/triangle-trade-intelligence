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
import AlertImpactAnalysisService from '../lib/services/alert-impact-analysis-service';
import { getCountryConfig } from '../lib/usmca/usmca-2026-config';

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

  // Restore alert impact analysis from localStorage on page load
  useEffect(() => {
    try {
      const storedAnalysis = localStorage.getItem('alert_impact_analysis');
      if (storedAnalysis) {
        const parsed = JSON.parse(storedAnalysis);
        if (parsed.alert_impact_summary || parsed.updated_priorities) {
          console.log('✅ Restoring alert impact analysis from localStorage on page load');
          setAlertImpactAnalysis(parsed);
        }
      }
    } catch (e) {
      console.error('Failed to restore alert impact analysis:', e);
    }
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
              companyCountry: alert.company_country || 'US',
              destinationCountry: alert.destination_country || 'US',
              businessType: alert.business_type || 'Not specified',
              hsCode: alert.hs_code || 'Not classified',
              productDescription: alert.product_description || 'Product',
              tradeVolume: alert.annual_trade_volume || 0,
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

          const profile = {
            userId: user?.id,
            companyName: mostRecentWorkflow.company_name,
            companyCountry: mostRecentWorkflow.company_country || workflowData.company?.company_country || 'US',
            destinationCountry: mostRecentWorkflow.destination_country || workflowData.company?.destination_country || 'US',
            businessType: mostRecentWorkflow.business_type,
            industry_sector: mostRecentWorkflow.industry_sector,
            hsCode: mostRecentWorkflow.hs_code,
            productDescription: mostRecentWorkflow.product_description,
            tradeVolume: mostRecentWorkflow.trade_volume,
            supplierCountry: components[0]?.origin_country || components[0]?.country,
            qualificationStatus: mostRecentWorkflow.qualification_status,
            savings: mostRecentWorkflow.estimated_annual_savings || 0,
            componentOrigins: components,
            regionalContent: workflowData.usmca?.regional_content || 0
          };

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
        companyCountry: userData.company?.company_country || userData.company?.country || 'US',
        destinationCountry: userData.company?.destination_country || userData.destination_country || 'US',
        businessType: userData.company?.business_type,
        industry_sector: userData.company?.industry_sector,
        hsCode: userData.product?.hs_code,
        productDescription: userData.product?.description,
        tradeVolume: parsedTradeVolume,
        supplierCountry: components[0]?.origin_country || components[0]?.country,  // Try both keys
        qualificationStatus: userData.usmca?.qualification_status,
        savings: userData.savings?.annual_savings || 0,
        componentOrigins: components,  // Fixed: use usmca.component_breakdown
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
      }
    } catch (error) {
      console.error('⚠️ Failed to load saved alerts:', error);
    }
  };

  /**
   * Save generated alerts to database for fast loading on future visits
   */
  const saveAlertsToDatabase = async (alerts) => {
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

      // Extract existing analysis from workflow results
      const existingAnalysis = {
        situation_brief: workflowIntelligence.detailed_analysis?.situation_brief || '',
        current_burden: workflowIntelligence.detailed_analysis?.current_burden || '',
        potential_savings: workflowIntelligence.detailed_analysis?.potential_savings || '',
        strategic_roadmap: workflowIntelligence.recommendations || [],
        action_items: workflowIntelligence.detailed_analysis?.action_items || [],
        payback_period: workflowIntelligence.detailed_analysis?.payback_period || ''
      };

      // Build user profile for analysis
      const analysisProfile = {
        companyCountry: userProfile.companyCountry || 'US',
        business_type: userProfile.businessType,
        industry_sector: userProfile.industry_sector,
        destination_country: userProfile.destinationCountry || 'US',
        componentOrigins: userProfile.componentOrigins || [],
        regionalContent: userProfile.regionalContent || 0,
        annualTradeVolume: userProfile.tradeVolume || 0
      };

      // Call alert impact analysis service
      const rawAnalysis = await AlertImpactAnalysisService.generateAlertImpact(
        existingAnalysis,
        consolidatedAlerts,
        analysisProfile
      );

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

  // Auto-generate alert impact analysis when consolidatedAlerts are loaded
  useEffect(() => {
    if (consolidatedAlerts && consolidatedAlerts.length > 0 && workflowIntelligence && !alertImpactAnalysis) {
      generateAlertImpactAnalysis();
    }
  }, [consolidatedAlerts, workflowIntelligence]); // eslint-disable-line react-hooks/exhaustive-deps

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

        {/* 📊 EXECUTIVE TRADE ADVISORY: Strategic consulting letter */}
        {workflowIntelligence?.detailed_analysis?.situation_brief && (
          <ExecutiveSummaryDisplay
            data={workflowIntelligence.detailed_analysis}
            onClose={() => console.log('Executive summary closed')}
          />
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

          {/* Component Intelligence - Collapsible rows with component-specific alerts */}
          {userProfile.componentOrigins && userProfile.componentOrigins.length > 0 && (
            <div className="element-spacing">
                <h3 className="card-title">Component Tariff Intelligence</h3>
                <p className="text-body">
                  Click any component with alerts to see tariff details and policy impacts:
                </p>

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
                  const componentAlerts = consolidatedAlerts.filter(alert => {
                    // Match by HS code
                    const hsMatch = alert.affected_hs_codes?.some(code =>
                      comp.hs_code?.startsWith(code.replace(/\./g, '').substring(0, 6))
                    );
                    // Match by origin country
                    const originMatch = alert.affected_countries?.some(country =>
                      (comp.origin_country || comp.country)?.toUpperCase() === country.toUpperCase()
                    );

                    // Debug logging for first component
                    if (idx === 0 && consolidatedAlerts.length > 0) {
                      console.log('🔍 Alert Matching Debug for component:', {
                        componentName: comp.component_type || comp.description,
                        componentHS: comp.hs_code,
                        componentOrigin: comp.origin_country || comp.country,
                        totalAlerts: consolidatedAlerts.length,
                        alertTitle: alert.title || alert.consolidated_title,
                        alertHS: alert.affected_hs_codes,
                        alertCountries: alert.affected_countries,
                        hsMatch,
                        originMatch,
                        finalMatch: hsMatch || originMatch
                      });
                    }

                    return hsMatch || originMatch;
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

                      {/* Expanded Content - Tariff Details + Alerts */}
                      {isExpanded && (
                        <div style={{ padding: '1.5rem', borderTop: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
                          {/* Tariff Details Grid */}
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: '1rem',
                            marginBottom: componentAlerts.length > 0 ? '1.5rem' : 0
                          }}>
                            {/* Base MFN */}
                            <div>
                              <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Base MFN</div>
                              <div style={{ fontSize: '1.125rem', fontWeight: 600 }}>
                                {baseMFN > 0 ? `${baseMFN.toFixed(1)}%` : '—'}
                              </div>
                            </div>

                            {/* Section 301 */}
                            <div style={{ backgroundColor: section301 > 0 ? '#fef3c7' : 'transparent', padding: '0.5rem', borderRadius: '6px' }}>
                              <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Section 301</div>
                              <div style={{ fontSize: '1.125rem', fontWeight: 600, color: section301 > 0 ? '#92400e' : '#9ca3af' }}>
                                {section301 > 0 ? `+${section301.toFixed(1)}%` : '—'}
                              </div>
                            </div>

                            {/* Total Rate */}
                            <div>
                              <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Total Rate</div>
                              <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#dc2626' }}>
                                {totalRate > 0 ? `${totalRate.toFixed(1)}%` : '—'}
                              </div>
                            </div>

                            {/* USMCA Rate */}
                            <div>
                              <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>USMCA Rate</div>
                              <div style={{ fontSize: '1.125rem', fontWeight: 600, color: '#059669' }}>
                                {usmcaRate.toFixed(1)}%
                              </div>
                            </div>

                            {/* Net After USMCA */}
                            <div style={{ backgroundColor: '#dcfce7', padding: '0.5rem', borderRadius: '6px' }}>
                              <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Net After USMCA</div>
                              <div style={{ fontSize: '1.125rem', fontWeight: 700, color: section301 > 0 ? '#dc2626' : '#059669' }}>
                                {netAfterUSMCA > 0 ? `${netAfterUSMCA.toFixed(1)}%` : '0%'}
                              </div>
                              {section301 > 0 && (
                                <div style={{ fontSize: '0.6875rem', color: '#92400e', marginTop: '0.125rem' }}>
                                  ⚠️ S301 remains
                                </div>
                              )}
                            </div>

                            {/* Actual Savings */}
                            <div>
                              <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Actual Savings</div>
                              <div style={{ fontSize: '1.125rem', fontWeight: 600, color: actualSavings > 0 ? '#059669' : '#9ca3af' }}>
                                {actualSavings > 0 ? `${actualSavings.toFixed(1)}%` : '—'}
                              </div>
                            </div>
                          </div>

                          {/* Component-Specific Alerts */}
                          {componentAlerts.length > 0 && (
                            <div style={{ marginTop: '1.5rem' }}>
                              <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '0.75rem', color: '#111827' }}>
                                🚨 Alerts for This Component ({componentAlerts.length})
                              </h4>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {componentAlerts.map((alert, alertIdx) => (
                                  <div key={alertIdx} style={{
                                    background: 'white',
                                    border: '2px solid #fee2e2',
                                    borderRadius: '6px',
                                    padding: '1rem'
                                  }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                                      <div style={{ fontWeight: 600, color: '#111827', fontSize: '0.9375rem' }}>
                                        {alert.consolidated_title || alert.title}
                                      </div>
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
                                    <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                                      {alert.explanation || alert.description}
                                    </div>
                                    {alert.broker_summary && (
                                      <div style={{ fontSize: '0.875rem', color: '#374151', fontWeight: 500 }}>
                                        💡 {alert.broker_summary}
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

        {/* Alert Impact Analysis Section - Professional Display Component */}
        {alertImpactAnalysis && consolidatedAlerts.length > 0 && (
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
          <div className="form-section" style={{ marginTop: '2rem' }}>
            <div className="alert alert-info">
              <div className="alert-content">
                <div className="alert-title">Analyzing Strategic Impact...</div>
                <div className="text-body">
                  Generating additive analysis based on your existing workflow results and new alerts.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* REAL Government Policy Alerts - Relevant to User's Trade Profile */}
        <div className="form-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 className="form-section-title" style={{ margin: 0 }}>Government Policy Alerts</h2>
            {consolidatedAlerts.length > 0 && originalAlertCount > consolidatedAlerts.length && (
              <span style={{ fontSize: '0.875rem', color: '#059669', fontWeight: 500 }}>
                Consolidated {originalAlertCount} policies → {consolidatedAlerts.length} alert{consolidatedAlerts.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {!alertsGenerated && (
            <div className="alert alert-info">
              <div className="alert-content">
                <div className="alert-title">Generate Personalized Risk Analysis</div>
                <div className="text-body">
                  Click below to analyze your components for applicable trade policies and tariff risks.
                </div>
                <div className="hero-buttons" style={{ marginTop: '1rem' }}>
                  <button
                    onClick={() => loadRealPolicyAlerts(userProfile)}
                    className="btn-primary"
                    disabled={isLoadingPolicyAlerts}
                  >
                    {isLoadingPolicyAlerts ? 'Analyzing...' : 'Generate Alert Analysis'}
                  </button>
                </div>
              </div>
            </div>
          )}


          {(isLoadingPolicyAlerts || isConsolidating) && (
            <div className="alert alert-info">
              <div className="alert-content">
                <div className="alert-title">Analyzing your trade profile...</div>
                <div style={{ marginTop: '0.75rem' }}>
                  {progressSteps.map((step, idx) => (
                    <div key={idx} style={{ fontSize: '0.875rem', color: '#4b5563', marginBottom: '0.5rem' }}>
                      {idx < progressSteps.length - 1 ? '✓' : '→'} {step}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {!isLoadingPolicyAlerts && !isConsolidating && alertsGenerated && realPolicyAlerts.length === 0 && (
            <div className="alert alert-success">
              <div className="alert-content">
                <div className="alert-title">No Critical Policy Changes Affecting Your Trade</div>
                <div className="text-body">
                  Your components are not currently affected by government-announced tariff or policy changes. We monitor official sources continuously and will alert you when relevant changes occur.
                </div>
                <div className="hero-buttons" style={{ marginTop: '1rem' }}>
                  <button
                    onClick={() => {
                      setAlertsGenerated(false);
                      setRealPolicyAlerts([]);
                      setConsolidatedAlerts([]);
                    }}
                    className="btn-secondary"
                  >
                    Run Analysis Again
                  </button>
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
                  userTier={userTier}
                />
              ))}
            </div>
          )}

          {/* Fallback: Show individual alerts if consolidation failed */}
          {!isLoadingPolicyAlerts && !isConsolidating && consolidatedAlerts.length === 0 && realPolicyAlerts.length > 0 && (
            <div className="element-spacing">
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

              {/* Generate Final Report */}
              <button
                onClick={() => {
                  if (userTier === 'Trial') {
                    alert('Final report generation is available for paying subscribers. Upgrade to access detailed reports.');
                    window.location.href = '/pricing';
                  } else {
                    window.print();
                  }
                }}
                className="btn-primary"
                disabled={userTier === 'Trial'}
                title={userTier === 'Trial' ? 'Upgrade to generate final reports' : ''}
              >
                {userTier === 'Trial' ? '🔒 Generate Final Report (Upgrade)' : '📊 Generate Final Report'}
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