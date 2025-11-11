/**
 * WorkflowResults - Step 3 results display
 * Focused component displaying USMCA compliance results
 * Includes trust indicators and professional disclaimers
 */

import React, { useEffect, useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useRouter } from 'next/router';
import USMCAQualification from './results/USMCAQualification';
import RecommendedActions from './results/RecommendedActions';
import PolicyTimeline from './PolicyTimeline';
import ExecutiveSummaryDisplay from './results/ExecutiveSummaryDisplay';
import { normalizeComponent, logComponentValidation } from '../../lib/schemas/component-schema.js';
import { logDevIssue, DevIssue } from '../../lib/utils/logDevIssue.js';
import workflowStorage from '../../lib/services/workflow-storage-adapter.js';

export default function WorkflowResults({
  results,
  workflowSessionId,
  onReset,
  onDownloadCertificate,
  trustIndicators,
  viewMode = 'normal' // 'normal', 'read-only', 'edit', or 'refresh'
}) {
  const router = useRouter();
  const [dataSentToAlerts, setDataSentToAlerts] = useState(false);
  const [certificateGenerated, setCertificateGenerated] = useState(false);
  const [userSubscriptionTier, setUserSubscriptionTier] = useState(null);
  const [loadingTier, setLoadingTier] = useState(true);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [executiveSummary, setExecutiveSummary] = useState(null);
  const [showSummary, setShowSummary] = useState(false);
  // ✅ REMOVED: showSaveConsentModal, userMadeChoice, modalChoice state (data auto-saves via API)

  useEffect(() => {
    // Fetch user's subscription tier for tier-based UI gating
    const fetchUserSubscriptionTier = async () => {
      try {
        const response = await fetch('/api/auth/me', { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          const tier = data.user?.subscription_tier;
          if (!tier) throw new Error('subscription_tier missing from auth response');
          setUserSubscriptionTier(tier);
          console.log('✅ User subscription tier:', tier, '(for results page gating)');
        } else {
          throw new Error(`Auth check failed: ${response.status}`);
        }
      } catch (error) {
        console.error('❌ FAILED: Cannot determine subscription tier:', error);
        setUserSubscriptionTier(null);
        throw error;
      } finally {
        setLoadingTier(false);
      }
    };

    fetchUserSubscriptionTier();
  }, []);

  // ✅ SIMPLIFIED: No need for complex state - just check if data exists in results
  // Executive summary displays if EITHER:
  // 1. Freshly generated (executiveSummary state)
  // 2. Loaded from database (results.detailed_analysis)
  const hasExecutiveSummary = !!results?.detailed_analysis?.situation_brief || !!executiveSummary;

  useEffect(() => {
    // Check if user already generated certificate for this session
    const certGenerated = sessionStorage.getItem('certificate_generated');
    if (certGenerated === 'true') {
      setCertificateGenerated(true);
      console.log('✅ Certificate already generated this session');
    }
    // ✅ REMOVED: save_data_consent check (data auto-saves via API)
  }, []);

  // DISABLED: Auto-modal removed - users now use manual "Save to Dashboard" button
  // useEffect(() => {
  //   // Show save consent modal after results are displayed (only once)
  //   if (results && !userMadeChoice && !modalShownRef.current && !isProcessingRef.current) {
  //     const timeSinceClose = Date.now() - modalClosedTimeRef.current;
  //     // Only show if modal hasn't been closed recently
  //     if (timeSinceClose > 2000 || modalClosedTimeRef.current === 0) {
  //       // Small delay to let results render first
  //       const timer = setTimeout(() => {
  //         if (!isProcessingRef.current && !userMadeChoice) {
  //           setShowSaveConsentModal(true);
  //           modalShownRef.current = true;
  //         }
  //       }, 1500);
  //       return () => clearTimeout(timer);
  //     }
  //   }
  // }, [results, userMadeChoice]);

  useEffect(() => {
    // Auto-send certificate completion data to alerts dashboard (data auto-saves via API)
    if (results && results.certificate && !dataSentToAlerts) {
      sendCertificateDataToAlerts(results);
    }
  }, [results, dataSentToAlerts]);

  const sendCertificateDataToAlerts = async (completionResults) => {
    try {
      // Prepare certificate completion data for alerts dashboard
      const certificateData = {
        company: {
          name: completionResults.company?.name,
          business_type: completionResults.company?.business_type,
          industry_sector: completionResults.company?.industry_sector,
          trade_volume: completionResults.company?.trade_volume
        },
        product: {
          hs_code: completionResults.product?.hs_code,
          description: completionResults.product?.description
        },
        certificate: {
          id: completionResults.certificate.id,
          status: 'completed',
          qualification_result: completionResults.qualification?.qualified ? 'QUALIFIED' : 'NOT_QUALIFIED',
          savings: completionResults.savings?.total_savings
        },
        workflow_path: 'certificate',
        completion_timestamp: new Date().toISOString()
      };

      // Save to localStorage for alerts dashboard pickup
      // ✅ FIXED: Removed duplicate keys - only use usmca_workflow_results

      console.log('Certificate completion data sent to alerts system:', certificateData);
      setDataSentToAlerts(true);

    } catch (error) {
      console.error('Failed to send certificate data to alerts system:', error);
      await DevIssue.apiError('workflow_component', 'sendCertificateDataToAlerts', error, {
        company: completionResults.company?.name,
        product: completionResults.product?.description
      });
    }
  };

  // ✅ REMOVED: handleSaveConsent function (data auto-saves via API)

  const handleSetUpAlerts = async () => {
    // ✅ SIMPLIFIED: Data auto-saves via API, no consent check needed
    console.log('🚨 ========== SETTING UP TRADE ALERTS ==========');
    console.log('📊 Results object structure:', {
      has_component_origins: !!(results.component_origins),
      has_components: !!(results.components),
      component_origins_length: (results.component_origins || []).length,
      components_length: (results.components || []).length,
      component_origins_data: results.component_origins || results.components
    });

    // CRITICAL: Normalize all components to preserve enrichment data
    let rawComponents = results.component_origins || results.components || [];

    // AUTOMATIC FIX: If components are empty or missing enrichment
    if (rawComponents.length === 0 || !rawComponents[0]?.hs_code) {
      console.log('⚠️ Components missing or not enriched - attempting to recover...');

      // ✅ SIMPLIFIED: Data auto-saves via API, always try database fetch
      console.log('🔄 Fetching enriched components from database...');
        try {
          const response = await fetch('/api/dashboard-data', { credentials: 'include' });
          if (response.ok) {
            const data = await response.json();
            const latestWorkflow = data.workflows?.[0];
            if (latestWorkflow && latestWorkflow.component_origins) {
              console.log('✅ Fetched enriched components from database:', latestWorkflow.component_origins.length);
              rawComponents = latestWorkflow.component_origins;

              // Update results object so future operations use enriched data
              results.component_origins = rawComponents;
              results.components = rawComponents;
            } else {
              console.error('❌ No workflow found in database');
              await DevIssue.missingData('workflow_results', 'enriched_components_from_db', {
                attemptedFetch: true
              });
              alert('⚠️ Component data not found in database. Please complete the workflow again to set up alerts.');
              return;
            }
          } else {
            console.error('❌ Failed to fetch from database');
            await DevIssue.apiError('workflow_results', 'dashboard-data-fetch', new Error(`HTTP ${response.status}`), {
              status: response.status
            });
            alert('⚠️ Unable to fetch component data from database. Please try again or redo the workflow.');
            return;
          }
        } catch (error) {
          console.error('❌ Database fetch error:', error);
          await DevIssue.apiError('workflow_results', 'dashboard-data-api', error);
          alert('⚠️ Error fetching component data. Please complete the workflow again.');
          return;
        }
    }

    const normalizedComponents = rawComponents.map(c => normalizeComponent(c));

    // Validate enrichment is preserved
    const validation = logComponentValidation(normalizedComponents, 'Alerts Setup');
    if (validation.invalid > 0) {
      console.error(`❌ DATA LOSS: ${validation.invalid} components missing enrichment for alerts!`);
      await DevIssue.unexpectedBehavior('workflow_results', `${validation.invalid} components missing enrichment for alert setup`, {
        totalComponents: normalizedComponents.length,
        invalidCount: validation.invalid,
        validation
      });
    }

    // Prepare complete workflow data for AI vulnerability analysis
    const alertData = {
      company: {
        name: results.company?.name || results.company?.company_name,
        company_name: results.company?.name || results.company?.company_name,
        business_type: results.company?.business_type,
        industry_sector: results.company?.industry_sector,
        trade_volume: results.company?.trade_volume
      },
      product: {
        hs_code: results.product?.hs_code,
        description: results.product?.description || results.product?.product_description,
        product_description: results.product?.description || results.product?.product_description
      },
      usmca: {
        qualified: results.usmca?.qualified,
        qualification_status: results.usmca?.qualified ? 'QUALIFIED' : 'NOT_QUALIFIED',
        north_american_content: results.usmca?.north_american_content || results.usmca?.regional_content,
        threshold_applied: results.usmca?.threshold_applied,
        gap: results.usmca?.gap || 0
      },
      component_origins: normalizedComponents, // CRITICAL: Use normalized components
      components: normalizedComponents,        // CRITICAL: Use normalized components
      savings: results.savings,  // ✅ SAVE FULL SAVINGS OBJECT (includes section_301_exposure for alert impact analysis)
      workflow_path: 'alerts',
      timestamp: new Date().toISOString()
    };

    // Save to localStorage for alerts page
    workflowStorage.setItem('usmca_workflow_results', JSON.stringify(alertData));
    // ✅ FIXED: Removed duplicate keys - only use usmca_workflow_results

    console.log('✅ Alert data prepared and saved to localStorage:', {
      company: alertData.company?.name,
      component_origins_count: alertData.component_origins?.length,
      component_origins: alertData.component_origins,
      qualified: alertData.usmca?.qualified,
      localStorage_keys: Object.keys(localStorage).filter(k => k.includes('usmca'))
    });

    // Navigate to alerts page
    console.log('🔄 Navigating to /trade-risk-alternatives...');
    router.push('/trade-risk-alternatives');
  };

  if (!results) return null;

  // Determine if user is a paid subscriber (Starter, Professional, Premium, Enterprise)
  const isPaidUser = userSubscriptionTier &&
    !['trial', 'free'].includes((userSubscriptionTier || '').toLowerCase());

  // ✅ REMOVED: modalContent JSX (save consent modal removed)

  const generateExecutiveSummary = async () => {
    try {
      setLoadingSummary(true);
      console.log('🎯 Loading Executive Summary...');

      // Check 1: Try localStorage first (most recent, from fresh workflow or RecommendedActions)
      let workflowResults = {};
      try {
        const storedData = workflowStorage.getItem('usmca_workflow_results');
        if (storedData) {
          workflowResults = JSON.parse(storedData);
        }
      } catch (parseError) {
        console.error('Error parsing localStorage:', parseError);
      }
      const detailed_analysis = workflowResults.detailed_analysis || {};

      // Try to find the data in any available source
      const executiveData = detailed_analysis.situation_brief
        ? detailed_analysis
        : results?.detailed_analysis?.situation_brief
          ? results.detailed_analysis
          : null;

      console.log('🔍 Executive alert data check (DETAILED):', {
        localStorage_keys: Object.keys(localStorage),
        localStorage_has_usmca_workflow_results: !!workflowStorage.getItem('usmca_workflow_results'),
        workflowResults_keys: Object.keys(workflowResults),
        workflowResults_has_detailed_analysis: !!workflowResults.detailed_analysis,
        detailed_analysis_keys: Object.keys(detailed_analysis),
        detailed_analysis_has_situation_brief: !!detailed_analysis.situation_brief,
        detailed_analysis_sample: JSON.stringify(detailed_analysis).substring(0, 200),
        results_has_detailed_analysis: !!results?.detailed_analysis,
        results_detailed_analysis_sample: results?.detailed_analysis ? JSON.stringify(results.detailed_analysis).substring(0, 200) : 'N/A',
        executiveData: executiveData,
        foundInLocalStorage: !!detailed_analysis.situation_brief,
        foundInResults: !!results?.detailed_analysis?.situation_brief
      });

      if (executiveData && executiveData.situation_brief) {
        console.log('✅ Loaded executive summary from cache:', executiveData);
        setExecutiveSummary(executiveData);
        setShowSummary(true);
        setLoadingSummary(false);
        return;
      }

      // ✅ FIX (Nov 7): Check if detailed_analysis exists in results prop (from database)
      if (results?.detailed_analysis && results.detailed_analysis.situation_brief) {
        console.log('✅ Loaded executive summary from results prop:', results.detailed_analysis);
        setExecutiveSummary(results.detailed_analysis);
        setShowSummary(true);
        setLoadingSummary(false);
        return;
      }

      // Check 2: Try loading from database (if coming from dashboard)
      const urlParams = new URLSearchParams(window.location.search);
      const sessionId = urlParams.get('session') || urlParams.get('sessionId');

      if (sessionId) {
        console.log('🔍 Checking database for executive alert data (session:', sessionId, ')');
        try {
          const dbResponse = await fetch(`/api/workflow-session?sessionId=${sessionId}`, {
            credentials: 'include'
          });

          if (dbResponse.ok) {
            const dbData = await dbResponse.json();
            console.log('📦 Database workflow data:', dbData);

            const dbExecutiveData = dbData.workflow_data?.detailed_analysis?.situation_brief
              ? dbData.workflow_data.detailed_analysis
              : null;

            if (dbExecutiveData && dbExecutiveData.situation_brief) {
              console.log('✅ Loaded executive summary from database:', dbExecutiveData);
              setExecutiveSummary(dbExecutiveData);
              setShowSummary(true);
              setLoadingSummary(false);
              return;
            }
          }
        } catch (dbError) {
          console.warn('⚠️ Could not load from database:', dbError);
        }
      }

      // No cached data - generate fresh executive summary via API
      console.log('🎯 No cached data found - generating fresh Executive Summary for:', results.company?.name);

      // ✅ DEBUG: Log the complete results object structure
      console.log('📊 RESULTS OBJECT DEBUG:', {
        has_company: !!results.company,
        company_keys: results.company ? Object.keys(results.company) : [],
        company_data: results.company,
        has_industry_sector: !!results.company?.industry_sector,
        industry_sector_value: results.company?.industry_sector,
        has_destination_country: !!results.company?.destination_country,
        destination_country_value: results.company?.destination_country
      });

      // Validate all required fields for executive summary
      if (!userSubscriptionTier) {
        alert('⚠️ Unable to load subscription tier. Please refresh the page and try again.');
        throw new Error('subscription_tier missing - failed to load user tier');
      }
      if (!results.company?.industry_sector) {
        console.error('❌ MISSING industry_sector - Full results object:', JSON.stringify(results, null, 2));
        alert('⚠️ Missing required field: industry_sector. Please complete your company profile.');
        throw new Error('industry_sector required for executive summary');
      }
      if (!results.company?.destination_country) {
        alert('⚠️ Missing required field: destination_country. Please restart the analysis.');
        throw new Error('destination_country required for executive summary');
      }
      const components = results.component_origins || results.components;
      if (!components || components.length === 0) {
        alert('⚠️ No components found. Please add components to your analysis.');
        throw new Error('components required for executive summary');
      }
      if (results.usmca?.north_american_content === undefined || results.usmca?.north_american_content === null) {
        alert('⚠️ USMCA qualification data missing. Please restart the analysis.');
        throw new Error('north_american_content required for executive summary');
      }
      if (!results.company?.trade_volume && results.company?.trade_volume !== 0) {
        alert('⚠️ Missing trade volume. Please provide your annual trade volume.');
        throw new Error('trade_volume required for executive summary');
      }
      if (results.usmca?.qualified === undefined || results.usmca?.qualified === null) {
        alert('⚠️ USMCA qualification status missing. Please restart the analysis.');
        throw new Error('usmca_qualified status required for executive summary');
      }

      // Prepare payload for the executive trade alert API
      const payload = {
        workflow_session_id: workflowSessionId,  // ✅ FIX (Nov 9): SINGLE SOURCE OF TRUTH - pass session ID to save to correct workflow
        user_profile: {
          company_name: results.company?.name || null,  // ✅ FIX (Oct 30): AI needs company name for personalized output
          contact_person: results.company?.contact_person || null,  // ✅ More personal addressing
          business_type: results.company?.business_type || null,  // ✅ Manufacturer vs Importer changes advice
          company_country: results.company?.country || null,  // ✅ Company location context
          supplier_country: results.company?.supplier_country || null,  // ✅ Primary supplier location
          subscription_tier: userSubscriptionTier,
          industry_sector: results.company.industry_sector,
          destination_country: results.company.destination_country,
          trade_volume: results.company.trade_volume  // ✅ FIX: AI needs this for ROI calculations
        },
        workflow_intelligence: {
          product_description: results.product?.description || null,  // ✅ Specific product context
          components: components,
          north_american_content: results.usmca.north_american_content,
          threshold_applied: results.usmca?.threshold_applied || null,  // ✅ Required RVC threshold
          trade_volume: results.company.trade_volume,
          usmca_qualified: results.usmca.qualified,
          preference_criterion: results.usmca?.preference_criterion || null,
          current_annual_savings: results.savings?.annual_savings || null,  // ✅ Current USMCA savings
          monthly_savings: results.savings?.monthly_savings || null,  // ✅ Monthly breakdown
          strategic_insights: results.detailed_analysis?.strategic_insights || null  // ✅ Context from main analysis
        }
      };

      console.log('📊 Executive Summary payload:', {
        ...payload,
        frontend_tier_check: {
          userSubscriptionTier,
          isPaidUser,
          tierCheck: !['trial', 'free'].includes((userSubscriptionTier || '').toLowerCase())
        }
      });

      // Call the executive trade alert API
      const response = await fetch('/api/executive-trade-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        // ✅ FIX (Oct 28): Handle tier-gated 403 errors specially
        if (response.status === 403) {
          const errorData = await response.json();
          if (errorData.code === 'ALERTS_REQUIRE_PAID_SUBSCRIPTION') {
            alert(`⚠️ Upgrade Required\n\n${errorData.message}\n\nVisit the Pricing page to upgrade your subscription.`);
            return;
          }
        }
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Executive Summary API response (RAW):', data);

      // Extract the alert - API returns { success: true, alert: {...} }
      const rawAlert = data.data || data.alert || data;
      console.log('✅ Extracted raw alert:', rawAlert);

      // FLATTEN nested structure for component compatibility
      const alertData = {
        situation_brief: rawAlert.situation_brief,
        problem: rawAlert.the_situation?.problem,
        root_cause: rawAlert.the_situation?.root_cause,
        annual_impact: rawAlert.the_situation?.annual_impact,
        why_now: rawAlert.the_situation?.why_now,
        current_burden: rawAlert.financial_impact?.current_annual_burden,
        potential_savings: rawAlert.financial_impact?.potential_annual_savings,
        payback_period: rawAlert.financial_impact?.payback_period,
        action_items: rawAlert.action_this_week || [],
        strategic_roadmap: rawAlert.strategic_roadmap || [],
        broker_insights: rawAlert.from_your_broker,
        professional_disclaimer: rawAlert.professional_disclaimer,
        save_reminder: rawAlert.save_reminder  // ✅ FIX: Extract save_reminder from AI response
      };
      console.log('✅ Flattened for display:', alertData);

      // Save alert to localStorage for persistence (data is already in correct format)
      const savedWorkflowResults = JSON.parse(workflowStorage.getItem('usmca_workflow_results') || '{}');
      savedWorkflowResults.detailed_analysis = alertData;
      workflowStorage.setItem('usmca_workflow_results', JSON.stringify(savedWorkflowResults));
      console.log('✅ Saved executive alert to localStorage');

      // Display the executive summary (data is already in correct format)
      setExecutiveSummary(alertData);
      setShowSummary(true);
    } catch (error) {
      console.error('❌ Failed to generate Executive Summary:', error);
      console.error('❌ Error stack:', error.stack);
      console.error('❌ Error message:', error.message);
      alert('Failed to generate summary. Please try again.');
    } finally {
      setLoadingSummary(false);
    }
  };

  return (
    <div className="dashboard-container workflow-results-container">
      {/* ✅ REMOVED: Portal modal for save consent (data auto-saves via API) */}

      {/* QUALIFICATION RESULT */}
      <div className={results.usmca?.qualified ? 'alert-success' : 'alert-warning'}>
        <div className="alert-content">
          <h2 className="alert-title-success">
            {results.usmca?.qualified ? '✓ USMCA Qualified' : '✗ Not Qualified'}
            {results.product?.hs_code && (
              <span style={{
                marginLeft: '1rem',
                fontSize: '1.25rem',
                fontWeight: '600',
                color: results.usmca?.qualified ? '#059669' : '#d97706',
                backgroundColor: results.usmca?.qualified ? '#ecfdf5' : '#fffbeb',
                padding: '0.375rem 0.75rem',
                borderRadius: '0.375rem',
                border: `1px solid ${results.usmca?.qualified ? '#10b981' : '#f59e0b'}`
              }}>
                HS {results.product.hs_code}
              </span>
            )}
          </h2>
          <p className="alert-text-success">
            {results.usmca?.qualified
              ? 'Your product meets all requirements for preferential tariff treatment'
              : 'Your product does not meet USMCA regional content requirements'}
          </p>

          {/* TOP ROW - Priority Alerts & Savings */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '0.75rem',
            marginTop: '1rem',
            marginBottom: '0.75rem'
          }}>
            {/* Current Savings Card */}
            {results.usmca?.qualified && results.savings && (results.savings.annual_savings || 0) > 0 && (
              <div style={{
                padding: '0.75rem',
                backgroundColor: '#ecfdf5',
                borderRadius: '6px',
                border: '1px solid #059669'
              }}>
                <div style={{ fontSize: '0.6875rem', color: '#065f46', fontWeight: '500', marginBottom: '0.25rem' }}>
                  💰 Current Annual Savings
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#059669' }}>
                  ${(results.savings.annual_savings || 0).toLocaleString()}
                </div>
                <div style={{ fontSize: '0.6875rem', color: '#047857', marginTop: '0.25rem' }}>
                  ${Math.round((results.savings.annual_savings || 0) / 12).toLocaleString()}/mo
                </div>
                <div style={{
                  marginTop: '0.5rem',
                  paddingTop: '0.5rem',
                  borderTop: '1px solid #d1fae5',
                  fontSize: '0.625rem',
                  color: '#065f46'
                }}>
                  USMCA {((results.savings.usmca_rate || 0) * 100).toFixed(1)}% vs {((results.savings.mfn_rate || 0) * 100).toFixed(1)}% MFN
                </div>
              </div>
            )}

            {/* Potential Savings Card */}
            {results.usmca?.qualified && results.savings?.section_301_exposure?.is_exposed && (
              <div style={{
                padding: '0.75rem',
                backgroundColor: '#fffbeb',
                borderRadius: '6px',
                border: '1px solid #f59e0b'
              }}>
                <div style={{ fontSize: '0.6875rem', color: '#92400e', fontWeight: '500', marginBottom: '0.25rem' }}>
                  💡 Potential Additional
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#d97706' }}>
                  ${(results.savings.section_301_exposure.annual_cost_burden || 0).toLocaleString()}
                </div>
                <div style={{ fontSize: '0.6875rem', color: '#b45309', marginTop: '0.25rem' }}>
                  ${Math.round((results.savings.section_301_exposure.annual_cost_burden || 0) / 12).toLocaleString()}/mo
                </div>
                <div style={{
                  marginTop: '0.5rem',
                  paddingTop: '0.5rem',
                  borderTop: '1px solid #fed7aa',
                  fontSize: '0.625rem',
                  color: '#92400e'
                }}>
                  Nearshore to MX/CA/US
                </div>
              </div>
            )}

            {/* Policy Risk Alert Card */}
            {results.usmca?.qualified && results.savings?.section_301_exposure?.is_exposed && (
              <div style={{
                padding: '0.75rem',
                backgroundColor: '#fef2f2',
                borderRadius: '6px',
                border: '1px solid #ef4444'
              }}>
                <div style={{ fontSize: '0.6875rem', fontWeight: '500', color: '#991b1b', marginBottom: '0.25rem' }}>
                  🚨 POLICY RISK ({results.savings.section_301_exposure.affected_components?.length || 0})
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#dc2626' }}>
                  {(() => {
                    const exposedComponents = (results.usmca?.component_breakdown || []).filter(c => {
                      const origin = (c.origin_country || '').toUpperCase();
                      return !['US', 'MX', 'CA'].includes(origin);
                    });
                    const exposedPercentage = exposedComponents.reduce((sum, c) => sum + (c.value_percentage || 0), 0);
                    return exposedPercentage.toFixed(0);
                  })()}% exposed
                </div>
                <div style={{ fontSize: '0.6875rem', color: '#991b1b', marginTop: '0.25rem' }}>
                  ${(results.savings.section_301_exposure.annual_cost_burden || 0).toLocaleString()} opportunity
                </div>
              </div>
            )}

            {/* Buffer Warning Card */}
            {results.usmca?.qualified && (() => {
              const margin = results.usmca.north_american_content - results.usmca.threshold_applied;
              if (margin >= 0 && margin < 5) {
                return (
                  <div style={{
                    padding: '0.75rem',
                    backgroundColor: '#fffbeb',
                    borderRadius: '6px',
                    border: '1px solid #f59e0b'
                  }}>
                    <div style={{ fontSize: '0.6875rem', fontWeight: '500', color: '#92400e', marginBottom: '0.25rem' }}>
                      ⚠️ BUFFER
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#d97706' }}>
                      {margin.toFixed(1)}% margin
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: '#b45309', marginTop: '0.25rem' }}>
                      Consider 70%+
                    </div>
                  </div>
                );
              }
              return null;
            })()}
          </div>

          {/* BOTTOM ROW - RVC Metrics */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '0.75rem',
            marginBottom: '0.75rem'
          }}>
            {/* Required Card */}
            <div style={{
              padding: '0.75rem',
              backgroundColor: '#f9fafb',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.6875rem', color: '#6b7280', fontWeight: '500', marginBottom: '0.25rem' }}>
                Required
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937' }}>
                {results.usmca?.threshold_applied || 60}%
              </div>
            </div>

            {/* Your Content Card */}
            <div style={{
              padding: '0.75rem',
              backgroundColor: '#f9fafb',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              textAlign: 'center',
              cursor: results.usmca?.labor_credit > 0 ? 'help' : 'default'
            }}
            title={results.usmca?.labor_credit > 0
              ? `Breakdown: ${(results.usmca?.component_rvc || 0).toFixed(1)}% components + ${(results.usmca?.labor_credit || 0).toFixed(1)}% ${results.manufacturing_location || 'US'} labor credit`
              : undefined}>
              <div style={{ fontSize: '0.6875rem', color: '#6b7280', fontWeight: '500', marginBottom: '0.25rem' }}>
                Your Content
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937' }}>
                {(results.usmca?.north_american_content || 0).toFixed(0)}%
              </div>
              {results.usmca?.labor_credit > 0 && (
                <div style={{ fontSize: '0.625rem', color: '#059669', marginTop: '0.25rem', fontWeight: '500' }}>
                  +{(results.usmca?.labor_credit || 0).toFixed(0)}% labor
                </div>
              )}
            </div>

            {/* Margin Card */}
            <div style={{
              padding: '0.75rem',
              backgroundColor: '#f9fafb',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.6875rem', color: '#6b7280', fontWeight: '500', marginBottom: '0.25rem' }}>
                {results.usmca?.qualified ? 'Margin' : 'Gap'}
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937' }}>
                {results.usmca?.qualified
                  ? `+${(results.usmca.north_american_content - results.usmca.threshold_applied).toFixed(0)}%`
                  : `${(results.usmca.north_american_content - results.usmca.threshold_applied).toFixed(0)}%`}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* POLICY TIMELINE - Show announced tariff threats affecting user's components */}
      <PolicyTimeline
        components={results.component_origins || []}
        destination={results.destination_country || results.company?.destination_country || 'US'}
      />

      {/* CLEAN BUSINESS IMPACT SUMMARY - For All Users */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">💼 Your USMCA Impact</h3>
        </div>

        <div className="element-spacing">
          {/* Plain text explanation of what this means */}
          <div style={{lineHeight: '1.8', color: '#374151', fontSize: '0.95rem'}}>
            <p>
              <strong>Your qualification means:</strong> {results.usmca?.qualified
                ? 'You meet USMCA requirements and can pay preferential tariff rates instead of standard tariffs.'
                : 'You do NOT meet USMCA requirements. You must pay standard (MFN) tariff rates instead of preferential rates.'}
            </p>

            <p>
              <strong>Your Regional Value Content: {(results.usmca?.north_american_content || 0).toFixed(1)}%</strong><br/>
              {(() => {
                const totalRVC = results.usmca?.north_american_content || 0;
                const componentRVC = results.usmca?.component_rvc || 0;
                const laborCredit = results.usmca?.labor_credit || 0;
                const threshold = results.usmca?.threshold_applied || 60;
                const gap = totalRVC - threshold;

                // Show breakdown if there's labor credit
                if (laborCredit > 0) {
                  return (
                    <>
                      Your product qualifies with {totalRVC.toFixed(1)}% total North American content:
                      <br/>
                      <span style={{ marginLeft: '1rem', display: 'block', marginTop: '0.5rem', color: '#059669' }}>
                        • USMCA Components: {componentRVC.toFixed(1)}% (Mexico + Canada + US parts)
                      </span>
                      <span style={{ marginLeft: '1rem', display: 'block', color: '#059669' }}>
                        • Manufacturing Labor Credit: +{laborCredit.toFixed(1)}% ({results.manufacturing_location || 'US'} manufacturing)
                      </span>
                      <br/>
                      You need at least {threshold}%, so you have a <strong style={{ color: gap >= 0 ? '#059669' : '#dc2626' }}>{gap >= 0 ? '+' : ''}{gap.toFixed(1)}%</strong> {gap >= 0 ? 'safety buffer' : 'gap to close'}.
                    </>
                  );
                } else {
                  return `Your product is ${totalRVC.toFixed(1)}% made in the US, Canada, or Mexico. You need at least ${threshold}%, so you have a ${gap.toFixed(1)}% ${gap >= 0 ? 'safety buffer' : 'gap to close'}.`;
                }
              })()}
            </p>

            {results.savings && (results.savings.annual_savings || 0) > 0 && (
              <p>
                <strong>💰 Potential Savings: ${(results.savings.annual_savings || 0).toLocaleString()}/year</strong><br/>
                That's ${Math.round((results.savings.annual_savings || 0) / 12).toLocaleString()} per month by using USMCA rates instead of standard tariffs ({(results.savings.savings_percentage || 0).toFixed(1)}% savings).
              </p>
            )}

            <p style={{fontSize: '0.9rem', color: '#6b7280', marginTop: '1rem', fontStyle: 'italic'}}>
              📋 Product: {results.product?.hs_code} - {results.product?.description || 'Product'}
            </p>
          </div>

        </div>
      </div>

      {/* Show full analysis to ALL users */}
      <USMCAQualification results={results} />

      {/* PAID ONLY: Executive Summary Button + Strategic Recommendations */}
      {isPaidUser && (
        <>
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">🎯 Executive Summary</h3>
            </div>

            <div className="element-spacing">
              {/* ✅ DEBUG: Log what we're checking */}
              {console.log('🔍 Executive Summary Check:', {
                has_detailed_analysis: !!results?.detailed_analysis,
                has_situation_brief: !!results?.detailed_analysis?.situation_brief,
                detailed_analysis_keys: results?.detailed_analysis ? Object.keys(results.detailed_analysis) : 'none',
                will_disable_button: !!results?.detailed_analysis?.situation_brief
              })}

              {/* Show banner if summary already exists */}
              {hasExecutiveSummary && (
                <div style={{
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #86efac',
                  borderRadius: '4px',
                  padding: '1rem',
                  marginBottom: '1rem'
                }}>
                  <p style={{fontSize: '0.95rem', color: '#15803d', margin: 0}}>
                    ✅ <strong>Executive Summary Available</strong> - Your saved analysis is displayed below
                  </p>
                </div>
              )}

              {/* Generate button - HIDDEN in read-only mode */}
              {viewMode === 'normal' && (
                <button
                  onClick={() => generateExecutiveSummary()}
                  className={hasExecutiveSummary ? "btn-secondary" : "btn-primary"}
                  style={{
                    width: '100%',
                    marginBottom: '1.5rem',
                    backgroundColor: hasExecutiveSummary ? '#9ca3af' : undefined,
                    borderColor: hasExecutiveSummary ? '#9ca3af' : undefined,
                    color: hasExecutiveSummary ? '#ffffff' : undefined,
                    cursor: hasExecutiveSummary ? 'not-allowed' : 'pointer'
                  }}
                  disabled={loadingSummary || hasExecutiveSummary}
                  title={hasExecutiveSummary ? 'Executive summary already generated for this workflow (1 per workflow included)' : ''}
                >
                  {loadingSummary ? '⏳ Generating Summary...' :
                   hasExecutiveSummary ? '✓ Executive Summary Generated (1 per workflow)' :
                   '📊 Generate Business Impact Summary (1 per workflow included)'}
                </button>
              )}

              {viewMode === 'normal' && !hasExecutiveSummary && (
                <p style={{fontSize: '0.9rem', color: '#6b7280'}}>
                  Get a personalized analysis of how USMCA qualification affects your business, including supply chain risks and sourcing opportunities. Each workflow includes one complimentary executive summary.
                </p>
              )}

              {/* Executive Summary Display Section - Dynamic Component */}
            </div>
          </div>

          {/* RECOMMENDED ACTIONS - Show detailed executive guidance (PAID ONLY) */}
          <RecommendedActions results={results} onDownloadCertificate={onDownloadCertificate} trustIndicators={trustIndicators} />
        </>
      )}

      {/* Executive Summary Display - SIMPLIFIED: Just show if data exists */}
      {hasExecutiveSummary && (
        <ExecutiveSummaryDisplay
          data={executiveSummary || results?.detailed_analysis}
          onClose={() => setShowSummary(false)}
        />
      )}

      {/* NOTE: Recommendations moved to CollapsibleSection "Recommended Actions" above */}

      {/* NEXT STEPS */}
      <div className="form-section">
        <h2 className="form-section-title">Next Steps</h2>
        <p className="text-body" style={{ marginBottom: '1rem' }}>
          Analysis complete! Your results are automatically saved. Generate your certificate, set up alerts, or start a new analysis.
        </p>
        <div>

          <div className="hero-buttons">
            {/* ✅ REMOVED: "Save to Database" button (data auto-saves via API) */}

            {/* Button 1: Generate Certificate (if qualified) - ALWAYS visible ($0 cost) */}
            {results.usmca?.qualified && (
              <button
                onClick={() => {
                  // ✅ SIMPLIFIED: Data auto-saves via API, just proceed to certificate
                  workflowStorage.setItem('usmca_workflow_results', JSON.stringify(results));

                  // ✅ Clear old triangleUserData to prevent old company info from leaking into certificate
                  // The certificate page will use results.company data only
                  workflowStorage.removeItem('triangleUserData');
                  workflowStorage.removeItem('usmca_authorization_data'); // Also clear any old authorization data

                  sessionStorage.setItem('certificate_generated', 'true');
                  setCertificateGenerated(true);
                  console.log('✅ Proceeding to certificate generation...');
                  router.push('/usmca-certificate-completion');
                }}
                className="btn-primary"
              >
                {certificateGenerated ? '✓ Certificate Generated' : '📄 Generate Certificate'}
              </button>
            )}

            {/* Button 2: Set Up Alerts - ALWAYS visible */}
            <button
              onClick={handleSetUpAlerts}
              className="btn-primary"
            >
              🔔 Set Up Alerts
            </button>

            {/* Button 3: New Analysis - ALWAYS visible */}
            <button
              onClick={() => {
                // ✅ SIMPLIFIED: Data auto-saves via API
                const message = 'Start a new analysis? Your current results remain saved in your dashboard.';

                if (confirm(message)) {
                  // Clear localStorage for fresh start
                  workflowStorage.removeItem('workflow_current_step');
                  workflowStorage.removeItem('usmca_workflow_results');
                  sessionStorage.removeItem('certificate_generated');
                  // Trigger reset and go to step 1
                  onReset && onReset();
                  router.push('/usmca-workflow?reset=true');
                }
              }}
              className="btn-primary"
            >
              🔄 New Analysis
            </button>
          </div>
        </div>
      </div>

      {/* Simple disclaimer footer */}
      <div className="results-footer">
        AI-powered analysis • For production use, verify with customs authorities
      </div>
    </div>
  );
}