/**
 * WorkflowResults - Step 3 results display
 * Focused component displaying USMCA compliance results
 * Includes trust indicators and professional disclaimers
 */

import React, { useEffect, useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useRouter } from 'next/router';
import CompanyProfile from './results/CompanyProfile';
import ProductClassification from './results/ProductClassification';
import DataSourceAttribution from './results/DataSourceAttribution';
import ExecutiveSummary from './results/ExecutiveSummary';
import CollapsibleSection from './results/CollapsibleSection';
import USMCAQualification from './results/USMCAQualification';
import TariffSavings from './results/TariffSavings';
import CertificateSection from './results/CertificateSection';
import RecommendedActions from './results/RecommendedActions';
import PersonalizedAlerts from './results/PersonalizedAlerts';
import TariffDataFreshness from './results/TariffDataFreshness';
import SubscriptionContext, { AgentIntelligenceBadges } from '../shared/SubscriptionContext';
import { normalizeComponent, logComponentValidation } from '../../lib/schemas/component-schema.js';
import { logDevIssue, DevIssue } from '../../lib/utils/logDevIssue.js';

export default function WorkflowResults({
  results,
  onReset,
  onDownloadCertificate,
  trustIndicators
}) {
  const router = useRouter();
  const [dataSentToAlerts, setDataSentToAlerts] = useState(false);
  const [showSaveConsentModal, setShowSaveConsentModal] = useState(false);
  const [userMadeChoice, setUserMadeChoice] = useState(false);
  const [certificateGenerated, setCertificateGenerated] = useState(false);
  const [modalChoice, setModalChoice] = useState('save'); // Default to save
  const modalShownRef = useRef(false);
  const modalClosedTimeRef = useRef(0);
  const isProcessingRef = useRef(false);
  const buttonClickLockRef = useRef(false);

  // DEBUG: Log when modal state changes only
  useEffect(() => {
    console.log('🔄 Modal state changed:', { showSaveConsentModal, userMadeChoice });
  }, [showSaveConsentModal, userMadeChoice]);

  useEffect(() => {
    // Check if user has already made a save choice
    const savedChoice = localStorage.getItem('save_data_consent');
    if (savedChoice) {
      setUserMadeChoice(true);
      console.log('✅ User previously chose:', savedChoice);
    }

    // Check if user already generated certificate for this session
    const certGenerated = sessionStorage.getItem('certificate_generated');
    if (certGenerated === 'true') {
      setCertificateGenerated(true);
      console.log('✅ Certificate already generated this session');
    }
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
    // Auto-send certificate completion data to alerts dashboard if user chose to save
    const savedChoice = localStorage.getItem('save_data_consent');
    if (results && results.certificate && savedChoice === 'save' && !dataSentToAlerts) {
      sendCertificateDataToAlerts(results);
    }
  }, [results, dataSentToAlerts]);

  const sendCertificateDataToAlerts = async (completionResults) => {
    try {
      // Prepare certificate completion data for alerts dashboard
      const certificateData = {
        company: {
          name: completionResults.company?.name || 'Certificate Holder',
          business_type: completionResults.company?.business_type || 'manufacturing',
          industry_sector: completionResults.company?.industry_sector || 'General Manufacturing',
          trade_volume: completionResults.company?.trade_volume || (() => {
            console.error('❌ [FORM SCHEMA] Missing company.trade_volume in WorkflowResults sendCertificateDataToAlerts');
            return 0;
          })()
        },
        product: {
          hs_code: completionResults.product?.hs_code || completionResults.classification?.hs_code,
          description: completionResults.product?.description || completionResults.classification?.description
        },
        certificate: {
          id: completionResults.certificate.id || 'CERT-' + Date.now(),
          status: 'completed',
          qualification_result: completionResults.qualification?.qualified ? 'QUALIFIED' : 'NOT_QUALIFIED',
          savings: completionResults.savings?.total_savings || 0
        },
        workflow_path: 'certificate',
        completion_timestamp: new Date().toISOString()
      };

      // Save to localStorage for alerts dashboard pickup
      localStorage.setItem('usmca_workflow_data', JSON.stringify(certificateData));
      localStorage.setItem('usmca_company_data', JSON.stringify(certificateData.company));

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

  const handleSaveConsent = async (shouldSave) => {
    console.log('🎯 handleSaveConsent called with shouldSave:', shouldSave);
    console.log('📍 isProcessingRef.current:', isProcessingRef.current);

    // Prevent multiple rapid calls
    if (isProcessingRef.current) {
      console.log('⏸️ Already processing consent - ignoring duplicate call');
      return;
    }

    isProcessingRef.current = true;

    // Close modal IMMEDIATELY - no delays
    setShowSaveConsentModal(false);
    console.log('✅ Modal closed immediately');

    // Save user's choice to localStorage
    localStorage.setItem('save_data_consent', shouldSave ? 'save' : 'erase');
    setUserMadeChoice(true);
    modalClosedTimeRef.current = Date.now();

    if (shouldSave) {
      console.log('✅ User chose to SAVE data for alerts and services');
      console.log('📊 Saving workflow to database...');
      // CRITICAL: Normalize all components to preserve enrichment data
      const rawComponents = results.component_origins || results.components || [];
      const normalizedComponents = rawComponents.map(c => normalizeComponent(c));

      // Validate enrichment is preserved
      const validation = logComponentValidation(normalizedComponents, 'WorkflowResults Save');
      if (validation.invalid > 0) {
        console.error(`❌ DATA LOSS: ${validation.invalid} components missing enrichment when saving to localStorage!`);
        await DevIssue.unexpectedBehavior('workflow_results', `${validation.invalid} components missing enrichment data when saving`, {
          totalComponents: normalizedComponents.length,
          invalidCount: validation.invalid,
          validation
        });
      }

      // If user chose to save, prepare data for alerts
      const alertData = {
        company: {
          name: results.company?.name || results.company?.company_name,
          company_name: results.company?.name || results.company?.company_name,
          business_type: results.company?.business_type,
          industry_sector: results.company?.industry_sector,
          trade_volume: (() => {
            const tv = results.company?.trade_volume;
            if (!tv) {
              console.error('❌ [FORM SCHEMA] Missing company.trade_volume in WorkflowResults handleSaveConsent');
            }
            return tv || 0;
          })(),
          company_country: results.company?.company_country  // FIX: Include country for certificate generation
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
        component_origins: normalizedComponents, // CRITICAL: Use normalized components with ALL fields
        components: normalizedComponents,        // CRITICAL: Use normalized components with ALL fields
        savings: {
          total_savings: results.savings?.annual_savings || 0,
          annual_savings: results.savings?.annual_savings || 0
        },
        timestamp: new Date().toISOString()
      };

      // Save to localStorage for alerts and services
      localStorage.setItem('usmca_workflow_results', JSON.stringify(alertData));
      localStorage.setItem('usmca_workflow_data', JSON.stringify(alertData));
      localStorage.setItem('usmca_company_data', JSON.stringify(alertData.company));

      // **NEW: Save workflow to database with certificate data**
      try {
        // Generate certificate data structure for storage
        const certificateData = {
          certificate_number: `USMCA-${Date.now()}`,
          exporter: {
            name: results.company?.name || results.company?.company_name || 'Company',
            address: results.company?.company_address || '',
            tax_id: results.company?.tax_id || '',
            phone: results.company?.contact_phone || '',
            email: results.company?.contact_email || ''
          },
          product: {
            hs_code: results.product?.hs_code || '',
            description: results.product?.description || results.product?.product_description || '',
            preference_criterion: 'B'
          },
          usmca_analysis: {
            qualified: results.usmca?.qualified,
            regional_content: results.usmca?.north_american_content || results.usmca?.regional_content || 0,
            rule: 'Regional Value Content',
            threshold: results.usmca?.threshold_applied || 60
          },
          authorization: {
            signatory_name: results.company?.contact_person || results.company?.name || 'Authorized Signatory',
            signatory_title: 'Exporter',
            signatory_date: new Date().toISOString()
          },
          blanket_period: {
            start_date: new Date().toISOString().split('T')[0],
            end_date: new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0]
          },
          country_of_origin: results.usmca?.manufacturing_location || 'MX'
        };

        const workflowData = {
          sessionId: `workflow_${Date.now()}`,
          workflowData: {
            id: `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            workflow_type: 'usmca_compliance',
            product_description: results.product?.description || results.workflow_data?.product_description || 'USMCA Analysis',
            hs_code: results.product?.hs_code || '',
            classification_confidence: results.product?.confidence || 0.95,
            usmca: results.usmca,
            company: results.company,
            product: {
              ...results.product,
              description: results.product?.description || results.workflow_data?.product_description
            },
            components: normalizedComponents, // FIX: Use normalized components with section_301 field
            savings: results.savings,
            steps_completed: 4,
            total_steps: 4,
            certificate_generated: true,
            certificate: certificateData,
            completion_time_seconds: 180
          },
          action: 'complete'
        };

        console.log('💾 Saving workflow to database:', workflowData);

        const response = await fetch('/api/workflow-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify(workflowData)
        });

        if (response.ok) {
          const result = await response.json();
          if (result.data?.saved === false) {
            console.log('ℹ️ Workflow not saved to database (developer testing - not signed in)');
          } else {
            console.log('✅ Workflow saved to database successfully');
            // Show success notification
            alert('✅ Analysis saved to your dashboard!\n\nYou can now:\n• View it anytime from your Dashboard\n• Set up trade risk alerts\n• Request professional services');
          }
        } else {
          const errorText = await response.text();
          console.error('⚠️ Failed to save workflow to database:', errorText);
          await DevIssue.apiError('workflow_results', 'workflow-session-save', new Error(errorText), {
            status: response.status,
            company: results.company?.name,
            product: results.product?.description
          });
          alert('⚠️ Unable to save to database. Please try again or contact support.');
        }
      } catch (error) {
        console.error('❌ Error saving workflow to database:', error);
        await DevIssue.apiError('workflow_results', 'workflow-session-api', error, {
          company: results.company?.name,
          product: results.product?.description
        });
      }

      // Check if user was trying to set up alerts
      const pendingAlertSetup = localStorage.getItem('pending_alert_setup');
      if (pendingAlertSetup === 'true') {
        localStorage.removeItem('pending_alert_setup');
        console.log('🚨 User consented - redirecting to alerts...');
        // Call handleSetUpAlerts again now that consent is granted
        setTimeout(() => handleSetUpAlerts(), 500);
      }

      // Check if user was trying to generate certificate
      const pendingCertificate = localStorage.getItem('pending_certificate_generation');
      if (pendingCertificate === 'true') {
        localStorage.removeItem('pending_certificate_generation');
        console.log('📄 User consented - redirecting to certificate generation...');
        localStorage.setItem('usmca_workflow_results', JSON.stringify(results));
        sessionStorage.setItem('certificate_generated', 'true');
        setCertificateGenerated(true);
        setTimeout(() => router.push('/usmca-certificate-completion'), 500);
      }

    } else {
      console.log('🔒 User chose NOT to save data - privacy first');
      // Don't save any workflow data
      localStorage.removeItem('usmca_workflow_results');
      localStorage.removeItem('usmca_workflow_data');
      localStorage.removeItem('usmca_company_data');
      localStorage.removeItem('pending_alert_setup');
    }

    // Reset processing flag after a short delay
    setTimeout(() => {
      isProcessingRef.current = false;
    }, 1000);
  };

  const handleSetUpAlerts = async () => {
    // Check if user has consented to save data
    const savedChoice = localStorage.getItem('save_data_consent');
    if (savedChoice !== 'save') {
      console.log('⚠️ User has not consented to save data - showing consent modal');
      // Prevent re-opening if modal was just closed (within 1 second)
      const timeSinceClose = Date.now() - modalClosedTimeRef.current;
      if (timeSinceClose > 1000) {
        setShowSaveConsentModal(true);
        // Store pending action so we can redirect after consent
        localStorage.setItem('pending_alert_setup', 'true');
      }
      return;
    }

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

      // Check if user saved to database
      const savedChoice = localStorage.getItem('save_data_consent');

      if (savedChoice === 'save') {
        // User chose to save - fetch from database
        console.log('🔄 User saved to database - fetching enriched components...');
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
                userSaved: true,
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
          await DevIssue.apiError('workflow_results', 'dashboard-data-api', error, {
            userSaved: true
          });
          alert('⚠️ Error fetching component data. Please complete the workflow again.');
          return;
        }
      } else {
        // User chose NOT to save - data should be in results prop (memory) or localStorage
        console.log('⚠️ User did NOT save to database - checking localStorage...');

        // Try to get from localStorage (might have enriched data from this session)
        const localStorageData = localStorage.getItem('usmca_workflow_results');
        if (localStorageData) {
          try {
            const parsed = JSON.parse(localStorageData);
            const localComponents = parsed.component_origins || parsed.components || [];

            if (localComponents.length > 0 && localComponents[0]?.hs_code) {
              console.log('✅ Found enriched components in localStorage:', localComponents.length);
              rawComponents = localComponents;
              results.component_origins = rawComponents;
              results.components = rawComponents;
            } else {
              console.error('❌ localStorage has components but they are not enriched');
              await DevIssue.unexpectedBehavior('workflow_results', 'Components in localStorage not enriched', {
                componentCount: localComponents.length,
                hasHsCode: !!localComponents[0]?.hs_code,
                userSaved: false
              });
              alert('⚠️ Component enrichment data is missing.\n\nTo set up alerts, you need to:\n1. Complete a new workflow analysis, OR\n2. Choose "Save to Database" to preserve enriched data\n\nWithout saving to database, enriched data is lost after closing the browser.');
              return;
            }
          } catch (e) {
            console.error('❌ Failed to parse localStorage:', e);
            await DevIssue.apiError('workflow_results', 'localStorage-parse', e, {
              userSaved: false
            });
            alert('⚠️ Unable to recover component data. Please complete the workflow again.');
            return;
          }
        } else {
          console.error('❌ No data in localStorage');
          await DevIssue.missingData('workflow_results', 'localStorage_workflow_data', {
            userSaved: false,
            attemptedAlertSetup: true
          });
          alert('⚠️ Component data not found.\n\nTo set up alerts, please:\n1. Complete the workflow analysis again, OR\n2. Choose "Save to Database" to preserve your data across sessions');
          return;
        }
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
        trade_volume: results.company?.trade_volume,
        annual_trade_volume: results.company?.trade_volume
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
      savings: {
        total_savings: results.savings?.annual_savings || 0,
        annual_savings: results.savings?.annual_savings || 0
      },
      workflow_path: 'alerts',
      timestamp: new Date().toISOString()
    };

    // Save to localStorage for alerts page
    localStorage.setItem('usmca_workflow_results', JSON.stringify(alertData));
    localStorage.setItem('usmca_workflow_data', JSON.stringify(alertData));
    localStorage.setItem('usmca_company_data', JSON.stringify(alertData.company));

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

  const modalContent = showSaveConsentModal && (
    <div className="consent-modal">
      <h2 className="consent-modal-title">
        💾 Save Analysis to Database?
      </h2>
      <p className="consent-modal-description">
        <strong>Why save?</strong> Your tariff analysis includes valuable HS code classifications, component enrichment data, and USMCA qualification results. Saving to database enables persistent alerts, pre-filled service requests, and certificate access from any device.
      </p>

      <div className="consent-modal-options">
        {/* SAVE Option */}
        <div
          onClick={() => setModalChoice('save')}
          className={`consent-option ${modalChoice === 'save' ? 'selected' : ''}`}
        >
          <div className="consent-option-title">
            <input
              type="radio"
              checked={modalChoice === 'save'}
              onChange={() => setModalChoice('save')}
            />
            SAVE TO DATABASE (Recommended)
          </div>
          <div className="consent-option-details">
            ✅ <strong>Database storage</strong> - Access from any device, anytime<br/>
            ✅ <strong>Persistent alerts</strong> - Get notified of tariff changes even after logout<br/>
            ✅ <strong>Pre-filled service requests</strong> - No re-entering company/product data<br/>
            ✅ <strong>Certificate archive</strong> - Download past certificates from dashboard<br/>
            ✅ <strong>Component enrichment preserved</strong> - HS codes, tariff rates, savings calculations
          </div>
        </div>

        {/* DON'T SAVE Option */}
        <div
          onClick={() => setModalChoice('dont-save')}
          className={`consent-option ${modalChoice === 'dont-save' ? 'selected' : ''}`}
        >
          <div className="consent-option-title">
            <input
              type="radio"
              checked={modalChoice === 'dont-save'}
              onChange={() => setModalChoice('dont-save')}
            />
            DON&apos;T SAVE (Browser only, temporary)
          </div>
          <div className="consent-option-details">
            ⚠️ <strong>Browser storage only</strong> - Lost on logout or browser clear<br/>
            ⚠️ <strong>Alerts deleted</strong> - Must set up alerts again on next visit<br/>
            ⚠️ <strong>No service pre-fill</strong> - Re-enter all data for service requests<br/>
            ⚠️ <strong>Certificate not archived</strong> - Must regenerate analysis for new certificate<br/>
            ⚠️ <strong>Component data lost</strong> - AI enrichment (HS codes, rates) not preserved
          </div>
        </div>
      </div>

      <button
        onClick={() => {
          handleSaveConsent(modalChoice === 'save');
        }}
        className="consent-modal-button"
      >
        {modalChoice === 'save' ? '💾 SAVE TO DATABASE' : "🔒 DON'T SAVE (TEMPORARY)"}
      </button>

      <p className="consent-modal-privacy">
        <strong>Privacy:</strong> Saved data is encrypted in our secure PostgreSQL database. You can delete ALL saved data anytime from Account Settings. We never share your trade data with third parties.
      </p>
    </div>
  );

  return (
    <div className="dashboard-container workflow-results-container">
      {/* PORTAL MODAL - RENDERED OUTSIDE THIS COMPONENT */}
      {typeof window !== 'undefined' && modalContent && ReactDOM.createPortal(
        modalContent,
        document.body
      )}

      {/* QUALIFICATION RESULT */}
      <div className={results.usmca?.qualified ? 'alert-success' : 'alert-warning'}>
        <div className="alert-content">
          <h2 className="alert-title-success">
            {results.usmca?.qualified ? '✓ USMCA Qualified' : '✗ Not Qualified'}
          </h2>
          <p className="alert-text-success">
            {results.usmca?.qualified
              ? 'Your product meets all requirements for preferential tariff treatment'
              : 'Your product does not meet USMCA regional content requirements'}
          </p>

          {/* Key Metrics */}
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-label">Required</div>
              <div className="metric-value">
                {results.usmca?.threshold_applied || 60}%
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Your Content</div>
              <div className="metric-value">
                {(results.usmca?.north_american_content || 0).toFixed(0)}%
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-label">
                {results.usmca?.qualified ? 'Margin' : 'Gap'}
              </div>
              <div className="metric-value">
                {results.usmca?.qualified
                  ? `+${(results.usmca.north_american_content - results.usmca.threshold_applied).toFixed(0)}%`
                  : `${(results.usmca.north_american_content - results.usmca.threshold_applied).toFixed(0)}%`}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========== PROGRESSIVE DISCLOSURE: EXECUTIVE SUMMARY AT TOP ========== */}

      {/* 1. EXECUTIVE SUMMARY - Always Visible */}
      <ExecutiveSummary results={results} />

      {/* ✅ PRODUCT CLASSIFICATION - Display final product HS code prominently */}
      {results.product && (
        <CollapsibleSection title="📦 Final Product Classification" defaultOpen={true}>
          <ProductClassification results={results} />
        </CollapsibleSection>
      )}

      {/* TARIFF DATA FRESHNESS WARNING - Displayed before detailed tariff sections */}
      <TariffDataFreshness />

      {/* 2. COLLAPSIBLE SECTIONS - Details Hidden by Default */}

      {/* CERTIFICATE FIELDS PREVIEW */}
      {(results.origin_criterion || results.method_of_qualification || results.producer_name) && (() => {
        // Validate Origin Criterion against actual analysis
        const validateOriginCriterion = () => {
          if (!results.origin_criterion) return null;

          // Determine expected criterion based on qualification results
          const hasNonUSMCA = results.usmca?.component_breakdown?.some(c => !c.is_usmca_member);
          const usesRVC = results.usmca?.rule?.toLowerCase().includes('regional value content');

          let expected = null;
          let reason = '';

          if (!hasNonUSMCA && results.usmca?.qualified) {
            // All components from USMCA countries
            expected = 'A';
            reason = 'All components originate from USMCA countries (Wholly Obtained)';
          } else if (hasNonUSMCA && usesRVC) {
            // Has non-USMCA components and uses RVC method
            expected = 'B';
            reason = 'Product uses Regional Value Content calculation with tariff shift requirement';
          }

          if (expected && results.origin_criterion !== expected) {
            return {
              mismatch: true,
              expected,
              reason,
              userSelected: results.origin_criterion
            };
          }

          return { mismatch: false };
        };

        // Validate Method of Qualification against actual calculation
        const validateMethodOfQualification = () => {
          if (!results.method_of_qualification) return null;

          // Determine expected method based on actual calculation used
          let expected = null;
          let reason = '';

          if (results.usmca?.rule?.toLowerCase().includes('regional value content')) {
            expected = 'TV'; // Transaction Value is most common for RVC
            reason = 'Analysis used Transaction Value method for Regional Value Content calculation';
          }

          if (expected && results.method_of_qualification !== expected) {
            return {
              mismatch: true,
              expected,
              reason,
              userSelected: results.method_of_qualification
            };
          }

          return { mismatch: false };
        };

        const originValidation = validateOriginCriterion();
        const methodValidation = validateMethodOfQualification();

        return (
          <div className="form-section">
            <h2 className="form-section-title">Certificate Details</h2>

            {results.origin_criterion && (
              <div style={{marginBottom: '12px'}}>
                <div className="text-body">
                  <strong>Origin Criterion:</strong> {results.origin_criterion} - {
                    results.origin_criterion === 'A' ? 'Wholly Obtained' :
                    results.origin_criterion === 'B' ? 'Tariff Shift and Regional Value Content' :
                    results.origin_criterion === 'C' ? 'Specific Processing/Value Requirement' :
                    results.origin_criterion === 'D' ? 'Specific Manufacturing Process' :
                    'Regional Value Content'
                  }
                </div>
                {originValidation?.mismatch && (
                  <div style={{
                    marginTop: '0.5rem',
                    padding: '0.75rem',
                    backgroundColor: '#fef3c7',
                    borderLeft: '3px solid #f59e0b',
                    borderRadius: '4px',
                    fontSize: '0.875rem'
                  }}>
                    <strong style={{color: '#92400e'}}>⚠️ Validation Warning:</strong>
                    <div style={{color: '#92400e', marginTop: '0.25rem'}}>
                      Based on your component analysis, the recommended Origin Criterion is <strong>{originValidation.expected}</strong>.
                    </div>
                    <div style={{color: '#78350f', marginTop: '0.25rem', fontSize: '0.8125rem'}}>
                      Reason: {originValidation.reason}
                    </div>
                  </div>
                )}
              </div>
            )}

            {results.method_of_qualification && (
              <div style={{marginBottom: '12px'}}>
                <div className="text-body">
                  <strong>Qualification Method:</strong> {results.method_of_qualification} - {
                    results.method_of_qualification === 'TS' ? 'Tariff Shift' :
                    results.method_of_qualification === 'TV' ? 'Transaction Value (RVC)' :
                    results.method_of_qualification === 'NC' ? 'Net Cost (RVC)' :
                    results.method_of_qualification === 'NO' ? 'No Requirement' :
                    'Transaction Value'
                  }
                </div>
                {methodValidation?.mismatch && (
                  <div style={{
                    marginTop: '0.5rem',
                    padding: '0.75rem',
                    backgroundColor: '#fef3c7',
                    borderLeft: '3px solid #f59e0b',
                    borderRadius: '4px',
                    fontSize: '0.875rem'
                  }}>
                    <strong style={{color: '#92400e'}}>⚠️ Validation Warning:</strong>
                    <div style={{color: '#92400e', marginTop: '0.25rem'}}>
                      Based on your qualification analysis, the recommended Method is <strong>{methodValidation.expected}</strong>.
                    </div>
                    <div style={{color: '#78350f', marginTop: '0.25rem', fontSize: '0.8125rem'}}>
                      Reason: {methodValidation.reason}
                    </div>
                  </div>
                )}
              </div>
            )}

            {results.producer_name && results.producer_name !== results.company?.name && (
              <div className="text-body">
                <strong>Producer (if different from exporter):</strong><br/>
                <div style={{marginLeft: '20px', marginTop: '8px'}}>
                  {results.producer_name}<br/>
                  {results.producer_address && <>{results.producer_address}<br/></>}
                  {results.producer_country && <>{results.producer_country}<br/></>}
                  {results.producer_phone && <>Phone: {results.producer_phone}<br/></>}
                  {results.producer_email && <>Email: {results.producer_email}</>}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* SECTION 2: Qualification Details */}
      <CollapsibleSection title="Qualification Details" icon="✓">
        <USMCAQualification results={results} />
      </CollapsibleSection>

      {/* SECTION 3: Component Breakdown */}
      {/* Hidden inside USMCAQualification - can be accessed via expanding that section */}

      {/* SECTION 4: Tariff Analysis */}
      {results.savings && results.savings.annual_savings > 0 && (
        <CollapsibleSection title="Tariff Analysis & Savings" icon="💰">
          <TariffSavings results={results} />
        </CollapsibleSection>
      )}

      {/* SECTION 5: Recommended Actions */}
      <CollapsibleSection title="Recommended Actions" icon="🎯">
        <RecommendedActions results={results} onDownloadCertificate={onDownloadCertificate} trustIndicators={trustIndicators} />
      </CollapsibleSection>

      {/* NOTE: Policy Alerts moved to dedicated /trade-risk-alternatives dashboard */}
      {/* NOTE: Certificate management moved to dedicated /dashboard */}

      {/* SECTION 6: Strategic Insights & Supply Chain Analysis */}
      {results.detailed_analysis && (results.detailed_analysis.strategic_insights || results.detailed_analysis.supply_chain_vulnerabilities || results.detailed_analysis.strategic_alternatives) && (
        <CollapsibleSection title="Strategic Analysis & Alternatives" icon="📊" defaultExpanded={true}>
          <p className="form-section-description">
            AI-powered insights on supply chain optimization and strategic opportunities
          </p>

          {/* Strategic Insights */}
          {results.detailed_analysis.strategic_insights && (
            <div className="service-request-card border-left-amber">
              <h3 className="content-card-title">💡 Strategic Insights & Next Steps</h3>
              <p className="text-body">
                {typeof results.detailed_analysis.strategic_insights === 'string'
                  ? results.detailed_analysis.strategic_insights
                  : JSON.stringify(results.detailed_analysis.strategic_insights)}
              </p>
            </div>
          )}

          {/* Savings Analysis */}
          {results.detailed_analysis.savings_analysis && (
            <div className="service-request-card border-left-green">
              <h3 className="content-card-title">💰 Financial Impact Analysis</h3>
              <p className="text-body">
                {typeof results.detailed_analysis.savings_analysis === 'string'
                  ? results.detailed_analysis.savings_analysis
                  : JSON.stringify(results.detailed_analysis.savings_analysis)}
              </p>
            </div>
          )}
        </CollapsibleSection>
      )}

      {/* NOTE: Recommendations moved to CollapsibleSection "Recommended Actions" above */}

      {/* ========== DEDICATED DASHBOARDS ========== */}
      <div className="form-section">
        <h2 className="form-section-title">📊 Explore Related Tools</h2>
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.5rem'}}>
          {/* Trade Alerts Dashboard CTA */}
          <div style={{
            padding: '1.5rem',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            backgroundColor: '#f9fafb',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}>
            <div style={{fontSize: '1.5rem'}}>🚨</div>
            <h3 style={{fontSize: '1rem', fontWeight: 600, margin: 0, color: '#111827'}}>Trade Risk Alerts</h3>
            <p style={{fontSize: '0.875rem', color: '#6b7280', margin: 0}}>
              Monitor tariff policy changes affecting your products • Set up email notifications • Review Section 301 & 232 impacts
            </p>
            <button
              onClick={() => router.push('/trade-risk-alternatives')}
              className="btn-primary"
              style={{marginTop: 'auto', alignSelf: 'flex-start', fontSize: '0.875rem'}}
            >
              View Alerts Dashboard →
            </button>
          </div>

          {/* Certificate Management CTA */}
          <div style={{
            padding: '1.5rem',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            backgroundColor: '#f9fafb',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}>
            <div style={{fontSize: '1.5rem'}}>📜</div>
            <h3 style={{fontSize: '1rem', fontWeight: 600, margin: 0, color: '#111827'}}>Certificate Dashboard</h3>
            <p style={{fontSize: '0.875rem', color: '#6b7280', margin: 0}}>
              Manage your certificates • Download certificates • View analysis history • Archive past analyses
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="btn-primary"
              style={{marginTop: 'auto', alignSelf: 'flex-start', fontSize: '0.875rem'}}
            >
              Go to Dashboard →
            </button>
          </div>
        </div>
      </div>

      {/* NEXT STEPS */}
      <div className="form-section">
        <h2 className="form-section-title">Next Steps</h2>
        <p className="text-body">
          Your USMCA analysis is complete with AI-enriched component data (HS codes, tariff rates, savings calculations). Choose how to store this valuable intelligence.
        </p>
        <div>
          {/* Privacy & Save Information Card - Always show with checkbox */}
          <div className="privacy-info-box">
            <div className="privacy-info-content">
              <input
                type="checkbox"
                id="saveConsent"
                checked={userMadeChoice}
                readOnly
                className="privacy-info-checkbox"
              />
              <label htmlFor="saveConsent" className="privacy-info-label">
                <div className="privacy-info-title">💾 Save to Database (Recommended)</div>
                <div className="privacy-info-text">
                  <strong>What gets saved:</strong> Your complete analysis including company info, product classification, AI-enriched component data (HS codes, tariff rates, savings), USMCA qualification results, and certificate data.
                  <br/><br/>
                  <strong>Why save to database:</strong>
                  <ul className="privacy-info-list">
                    <li><strong>Persistent storage</strong> - Access from any device, survives browser clears</li>
                    <li><strong>Alert monitoring</strong> - Get notified of tariff changes affecting YOUR components</li>
                    <li><strong>Service pre-fill</strong> - Request expert services without re-entering data</li>
                    <li><strong>Certificate archive</strong> - Download certificates anytime from dashboard</li>
                    <li><strong>Component enrichment preserved</strong> - HS codes, tariff rates, AI confidence scores</li>
                  </ul>
                  <strong>Not saving?</strong> Data stays in browser only (temporary) - lost on logout or browser clear.
                </div>
                <div className="privacy-info-disclaimer">
                  <strong>Privacy:</strong> Encrypted PostgreSQL database. Delete anytime from Account Settings. Never shared with third parties.
                </div>
              </label>
            </div>
          </div>

          <div className="hero-buttons">
            {/* Button 1: Save to Database (ALWAYS AVAILABLE) */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setModalChoice('save'); // Reset to default
                setShowSaveConsentModal(true);
              }}
              className="btn-primary"
            >
              {userMadeChoice ? '✅ Saved to Database (Change)' : '💾 Save to Database'}
            </button>

            {/* Button 2: Generate Certificate (if qualified) */}
            {results.usmca?.qualified && (
              <button
                onClick={() => {
                  // Check if user has made a choice (doesn't matter which one)
                  const savedChoice = localStorage.getItem('save_data_consent');

                  if (!savedChoice) {
                    // If no choice made, open modal directly
                    setShowSaveConsentModal(true);
                    localStorage.setItem('pending_certificate_generation', 'true');
                    return;
                  }

                  // Proceed to certificate generation (works either way)
                  localStorage.setItem('usmca_workflow_results', JSON.stringify(results));
                  sessionStorage.setItem('certificate_generated', 'true');
                  setCertificateGenerated(true);
                  console.log('✅ Proceeding to certificate generation...');

                  if (savedChoice !== 'save') {
                    console.log('⚠️ Certificate will NOT be saved to dashboard (user chose view-only)');
                  }

                  router.push('/usmca-certificate-completion');
                }}
                className="btn-primary"
              >
                {certificateGenerated ? '✓ Certificate Generated' : '📄 Generate Certificate'}
              </button>
            )}

            {/* Button 3: Request Professional Service */}
            <button
              onClick={() => {
                const savedChoice = localStorage.getItem('save_data_consent');
                if (!savedChoice) {
                  // Open modal directly
                  setShowSaveConsentModal(true);
                  return;
                }
                router.push('/services/logistics-support');
              }}
              className="btn-primary"
            >
              🎯 Request Professional Service
            </button>

            {/* Button 4: Set Up Alerts */}
            <button
              onClick={() => {
                const savedChoice = localStorage.getItem('save_data_consent');
                if (!savedChoice) {
                  // Open modal directly
                  setShowSaveConsentModal(true);
                  localStorage.setItem('pending_alert_setup', 'true');
                  return;
                }
                handleSetUpAlerts();
              }}
              className="btn-primary"
            >
              🔔 Set Up Alerts
            </button>

            {/* Button 5: New Analysis */}
            <button
              onClick={() => {
                const message = userMadeChoice && localStorage.getItem('save_data_consent') === 'save'
                  ? 'Start a new analysis? Your current results will remain saved in your dashboard.'
                  : 'Start a new analysis? Your current results will be cleared.';

                if (confirm(message)) {
                  // Clear localStorage for fresh start
                  localStorage.removeItem('workflow_current_step');
                  localStorage.removeItem('usmca_workflow_results');
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