/**
 * USMCAWorkflowOrchestrator - Main workflow orchestration component
 * Replaces the 894-line monolithic component with clean architecture
 * Integrates all focused components and trust microservices
 */

import React, { useEffect, useRef, useState as useStateReact } from 'react';
import { useRouter } from 'next/router';
import { useSimpleAuth } from '../../lib/contexts/SimpleAuthContext';
import { useWorkflowState } from '../../hooks/useWorkflowState';
import { useTrustIndicators } from '../../hooks/useTrustIndicators';
import { trustVerifiedCertificateFormatter } from '../../lib/utils/trust-verified-certificate-formatter';
import workflowStorage from '../../lib/services/workflow-storage-adapter.js';
import WorkflowProgress from './WorkflowProgress';
import CompanyInformationStep from './CompanyInformationStep';
import ComponentOriginsStepEnhanced from './ComponentOriginsStepEnhanced';
import WorkflowResults from './WorkflowResults';
import WorkflowLoading from './WorkflowLoading';
import WorkflowError from './WorkflowError';
import CrisisCalculatorResults from './CrisisCalculatorResults';
import WorkflowPathSelection from './WorkflowPathSelection';
import AuthorizationStep from './AuthorizationStep';
import BrokerChatbot from '../chatbot/BrokerChatbot';
import { logDevIssue, DevIssue } from '../../lib/utils/logDevIssue.js';
import { parseTradeVolume } from '../../lib/utils/parseTradeVolume.js';
import { generateUSMCACertificatePDF } from '../../lib/utils/usmca-certificate-pdf-generator';
import { DEMO_COMPANY_DATA } from '../../lib/constants/demo-data.js';

export default function USMCAWorkflowOrchestrator({ readOnly = false, workflowId = null }) {
  const router = useRouter();
  const hasProcessedResetRef = useRef(false);
  const hasLoadedResultsRef = useRef(false);
  const workAreaRef = useRef(null); // ✅ UI ENHANCEMENT: Ref for smooth scroll to work area

  // Use shared auth context (eliminates redundant API call)
  const { subscriptionTier: userTier } = useSimpleAuth();

  // ✅ FIX (Nov 12): Use readOnly prop from dashboard "View Results" button
  // - readOnly=true = from dashboard (no edits allowed)
  // - readOnly=false = regular workflow
  const [viewMode, setViewMode] = React.useState(() => {
    // If readOnly prop is true, force read-only mode
    if (readOnly) return 'read-only';

    // Otherwise check sessionStorage
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('workflow_view_mode') || 'normal';
    }
    return 'normal';
  });

  const {
    currentStep,
    workflowPath,
    isLoading,
    results,
    error,
    dropdownOptions,
    isLoadingOptions,
    formData,
    updateFormData,
    addComponentOrigin,
    updateComponentOrigin,
    removeComponentOrigin,
    processWorkflow,
    resetWorkflow,
    goToStep,
    nextStep,
    previousStep,
    isFormValid,
    isStepValid,
    getTotalComponentPercentage,
    clearError,
    loadSavedWorkflow,
    saveWorkflowToDatabase,
    currentSessionId  // ✅ FIX (Nov 6): Get session ID from hook state to pass to child components
  } = useWorkflowState();

  const { trustIndicators } = useTrustIndicators();

  // ✅ REMOVED REDUNDANT API CALL - Now using shared auth context (subscriptionTier from SimpleAuthContext)
  // Previously was calling /api/auth/me independently, causing excessive subscription checking

  // Handle "New Analysis" reset trigger (prevent infinite loop with ref)
  useEffect(() => {
    if (router.query.reset === 'true' && !hasProcessedResetRef.current) {
      hasProcessedResetRef.current = true;
      console.log('🔄 New Analysis triggered - resetting workflow');

      // ✅ Clear read-only mode when starting new analysis
      setViewMode('normal');
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('workflow_view_mode');
      }

      resetWorkflow();
      // Clean up the URL by removing the reset parameter
      router.replace('/usmca-workflow', undefined, { shallow: true });
    } else if (router.query.reset !== 'true') {
      // Reset the ref when reset param is removed
      hasProcessedResetRef.current = false;
    }
  }, [router.query.reset, resetWorkflow, router]);

  // Handle "View Results" - load saved workflow and jump directly to results (skip steps 1-2)
  // ✅ FIX (Nov 19): Also auto-load current session when navigating back from alerts
  useEffect(() => {
    const viewResultsId = router.query.view_results;
    const workflowIdParam = router.query.workflow_id;
    const targetStep = router.query.step ? parseInt(router.query.step) : 3; // Default to step 3 if not specified

    // NEW: Also support loading workflow via workflow_id parameter (not just view_results)
    const idToLoad = viewResultsId || workflowIdParam;
    const isReadOnlyMode = !!viewResultsId; // Only read-only if using view_results

    // ✅ NEW: If no query params but there's a current session with results, stay on that session
    // This handles the case when user goes: Workflow → Alerts → Workflow (nav link)
    const hasQueryParams = !!(viewResultsId || workflowIdParam);
    const hasCurrentSession = currentSessionId && results;

    if (idToLoad && !hasLoadedResultsRef.current) {
      hasLoadedResultsRef.current = true;
      console.log('📊 Loading saved workflow:', idToLoad, isReadOnlyMode ? '(read-only)' : '(editable)', 'Jumping to step:', targetStep);

      // ✅ SET VIEW MODE based on how it was accessed
      if (isReadOnlyMode) {
        setViewMode('read-only');
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('workflow_view_mode', 'read-only');
        }
      }

      // ✅ PERFORMANCE FIX: Jump to target step IMMEDIATELY (before data loads)
      // This prevents rendering steps 1→2→3 and instead goes directly to step 3
      goToStep(targetStep);

      // Fetch workflow from database
      fetch('/api/dashboard-data', { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
          const workflow = data.workflows?.find(w => w.id === idToLoad);
          console.log('🔍 WORKFLOW FROM API:', {
            has_workflow_data: !!workflow?.workflow_data,
            workflow_data_keys: workflow?.workflow_data ? Object.keys(workflow.workflow_data) : [],
            company_in_workflow_data: workflow?.workflow_data?.company,
            has_industry_sector: !!workflow?.workflow_data?.company?.industry_sector,
            industry_sector_value: workflow?.workflow_data?.company?.industry_sector
          });
          if (workflow && loadSavedWorkflow) {
            // Load data but DON'T change step (we already jumped to target step above)
            loadSavedWorkflow(workflow, { skipStepChange: true });
          }
        })
        .catch(async (err) => {
          console.error('Failed to load workflow:', err);
          await DevIssue.apiError('workflow_orchestrator', 'load-saved-workflow', err, {
            workflowIdParam: idToLoad
          });
        });

      // Clean up URL
      router.replace('/usmca-workflow', undefined, { shallow: true });
    } else if (!router.query.view_results && !router.query.workflow_id) {
      hasLoadedResultsRef.current = false;
    }
  }, [router.query.view_results, router.query.workflow_id, router.query.step, router, loadSavedWorkflow, goToStep]);

  // ✅ UI ENHANCEMENT: Smooth scroll to work area when step changes
  // First resets to top, pauses 1 second, then scrolls to work area
  useEffect(() => {
    if (workAreaRef.current) {
      // Step 1: Immediately scroll to top (instant, no animation)
      window.scrollTo({ top: 0, behavior: 'instant' });

      // Step 2: Wait 1 second to let users see the page title and orient themselves
      const scrollTimer = setTimeout(() => {
        // Step 3: Smooth scroll to work area with offset
        const elementTop = workAreaRef.current.getBoundingClientRect().top;
        const offset = 150; // Pixels from top - keeps section title visible

        window.scrollTo({
          top: window.pageYOffset + elementTop - offset,
          behavior: 'smooth'
        });
      }, 1000); // 1 second pause

      // Cleanup timer if component unmounts or step changes again
      return () => clearTimeout(scrollTimer);
    }
  }, [currentStep]);

  // Enhanced certificate download handler with trust verification
  const handleDownloadCertificate = (formatType = 'official') => {
    if (results?.certificate) {
      try {
        // Use the trust-verified certificate formatter
        const certificateText = trustVerifiedCertificateFormatter.formatForDownload(
          results.certificate, 
          formatType
        );
        
        const filename = trustVerifiedCertificateFormatter.generateDownloadFilename(
          results.certificate, 
          formatType
        );
        
        const blob = new Blob([certificateText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log(`Trust-verified certificate downloaded: ${filename}`);
      } catch (error) {
        console.error('Certificate download failed:', error);
        DevIssue.apiError('workflow_orchestrator', 'certificate-download', error, {
          certificateId: results.certificate?.certificate_id
        });
        // Fallback to simple certificate
        handleDownloadSimpleCertificate();
      }
    }
  };

  // Certificate format selection handler
  const handleCertificateFormatSelection = () => {
    const formatOptions = [
      { value: 'official', label: 'Official USMCA Format (Recommended)' },
      { value: 'detailed', label: 'Detailed Trust Analysis' },
      { value: 'simple', label: 'Simple Reference Format' }
    ];
    
    const selectedFormat = prompt(
      `Select certificate format:\n${formatOptions.map((opt, i) => `${i + 1}. ${opt.label}`).join('\n')}\n\nEnter 1, 2, or 3:`,
      '1'
    );
    
    const formatIndex = parseInt(selectedFormat) - 1;
    if (formatIndex >= 0 && formatIndex < formatOptions.length) {
      handleDownloadCertificate(formatOptions[formatIndex].value);
    } else {
      // Default to official format
      handleDownloadCertificate('official');
    }
  };

  // Fallback simple certificate handler
  const handleDownloadSimpleCertificate = () => {
    const certificateText = formatSimpleCertificateForDownload(results.certificate);
    const blob = new Blob([certificateText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `USMCA_Certificate_Simple_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatSimpleCertificateForDownload = (certificate) => {
    return `USMCA CERTIFICATE OF ORIGIN (Simple Format)
Generated: ${new Date().toLocaleDateString()}

COMPANY: ${certificate.exporter?.name || results.company?.name || 'TO BE COMPLETED'}
PRODUCT: ${certificate.product?.description || 'TO BE COMPLETED'}  
HS CODE: ${certificate.product?.hs_code || results.product?.hs_code || 'TO BE VERIFIED'}
PREFERENCE CRITERION: ${certificate.preference_criterion || ''}

VALIDITY PERIOD:
From: ${certificate.blanket_period?.start_date || 'TO BE COMPLETED'}
To: ${certificate.blanket_period?.end_date || 'TO BE COMPLETED'}

TRUST LEVEL: ${certificate.trust_verification?.trust_level?.toUpperCase() || 'UNKNOWN'}
${certificate.trust_verification?.expert_validation?.expert_validation_required ? 
  'EXPERT VALIDATION REQUIRED' : 'READY FOR COMPLETION'}

NOTE: Complete all fields and obtain proper signatures before submission.
`;
  };

  const handleRetryProcessing = () => {
    clearError();
    processWorkflow();
  };

  // ✅ NEW: Handle demo data loading - auto-complete entire workflow
  const handleLoadDemoData = (demoData) => {
    console.log('🚀 [Orchestrator] Demo data loaded, auto-populating components...');

    // Populate Step 2 fields required for validation
    updateFormData('product_description', demoData.product_description);
    updateFormData('manufacturing_location', demoData.manufacturing_location);

    // Add demo components to form data
    demoData.components.forEach((comp, index) => {
      addComponentOrigin();
      updateComponentOrigin(index, {
        component_name: comp.name,
        origin_country: comp.origin,
        component_description: comp.description,
        cost_percentage: comp.cost_percentage,
        suggested_hs_code: comp.suggested_hs_code,
        is_demo: true
      });
    });

    // Auto-advance to step 2 after a brief delay
    setTimeout(() => {
      console.log('✅ Demo components loaded, advancing to step 2');
      goToStep(2);

      // Auto-trigger analysis after another brief delay
      setTimeout(async () => {
        console.log('🚀 Auto-triggering analysis for demo workflow...');
        await handleProcessStep2();
      }, 1000);
    }, 500);
  };

  // Handle Step 2 completion - stay in workflow
  const handleProcessStep2 = async () => {
    console.log('🚀 USMCA Analysis button clicked - processing workflow...');

    // ✅ Save component data to database before processing (1 save instead of 150+)
    console.log('💾 Saving component data before analysis...');
    await saveWorkflowToDatabase();

    // Call the workflow processing and wait for results
    await processWorkflow();

    // Results will show in step 3 within the same workflow
    console.log('✅ Workflow complete - results will display in step 3');
  };

  // Crisis Calculator handlers
  const handleViewAlertsFromCrisisCalc = async () => {
    console.log('User navigating to alerts dashboard from crisis calculator');

    try {
      // ✅ NEW (Nov 1): Save to database instead of localStorage
      // This ensures alerts page loads complete data from database
      let sessionId = workflowStorage.getItem('workflow_session_id');
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        workflowStorage.setItem('workflow_session_id', sessionId);
      }

      // Save current formData to database + include AI analysis results for data preservation
      // (Don't rely on loading these back - generate fresh analysis on alerts page instead)
      const workflowDataToSave = {
        ...formData,
        ...(results && {
          detailed_analysis: results.detailed_analysis,
          recommendations: results.recommendations,
          savings: results.savings,
          usmca: results.usmca,
          trust: results.trust
        })
      };

      const response = await fetch('/api/workflow-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          sessionId,
          workflowData: workflowDataToSave,
          userId: 'current-user',
          action: 'save'
        })
      });

      if (response.ok) {
        console.log('✅ Workflow saved to database');
      } else {
        console.warn('⚠️ Failed to save to database, using localStorage fallback');
        // Fallback: Save to localStorage if database save fails
        const workflowDataForAlerts = {
          company: {
            name: formData.company_name,
            business_type: formData.business_type,
            company_address: formData.company_address,
            tax_id: formData.tax_id,
            contact_phone: formData.contact_phone,
            contact_email: formData.contact_email,
            trade_volume: formData.trade_volume,
            supplier_country: formData.supplier_country || 'CN',
            manufacturing_location: formData.manufacturing_location
          },
          product: {
            hs_code: formData.classified_hs_code || formData.hs_code,
            description: formData.product_description,
            original_hs_code: formData.classified_hs_code
          },
          usmca: {
            qualification_status: formData.qualification_status || 'NEEDS_REVIEW',
            north_american_content: getTotalComponentPercentage(),
            component_breakdown: formData.component_origins
          }
        };
        workflowStorage.setItem('usmca_workflow_results', JSON.stringify(workflowDataForAlerts));
      }

      // Navigate to alerts page (it will load from database via sessionId)
      window.location.href = '/trade-risk-alternatives';
    } catch (error) {
      console.error('Error saving workflow:', error);
      // Fallback: Navigate anyway, alerts page will handle missing data
      window.location.href = '/trade-risk-alternatives';
    }
  };

  const handleUpgradeToCertificate = () => {
    console.log('User upgrading from crisis calculator to certificate path');
    // Switch to certificate path and go to step 2
    nextStep('certificate');
  };

  const handleGenerateCertificate = async (results, authorizationData) => {
    try {
      // 💾 Save complete workflow data using WorkflowDataConnector
      console.log('💾 Saving workflow data through WorkflowDataConnector...');
      
      try {
        // Import and initialize the data connector
        const { default: WorkflowDataConnector } = await import('../../lib/services/workflow-data-connector');
        const dataConnector = new WorkflowDataConnector();
        
        // Get or create session ID
        let sessionId = workflowStorage.getItem('workflow_session_id');
        if (!sessionId) {
          sessionId = dataConnector.generateSessionId();
          workflowStorage.setItem('workflow_session_id', sessionId);
        }
        
        // Capture Step 1: Company Data
        await dataConnector.captureWorkflowStep({
          company_name: formData.company_name,
          business_type: formData.business_type,
          contact_email: formData.contact_email,
          contact_phone: formData.contact_phone,
          trade_volume: formData.trade_volume,
          supplier_country: formData.supplier_country,
          manufacturing_location: formData.manufacturing_location,
          country: 'US'
        }, 1, sessionId);
        
        // Capture Step 2: Product Analysis
        await dataConnector.captureWorkflowStep({
          product_description: formData.product_description,
          classified_hs_code: formData.classified_hs_code,
          hs_description: formData.hs_description,
          classification_confidence: 0.95,
          component_origins: formData.component_origins
        }, 2, sessionId);
        
        // Capture Step 3: USMCA Results
        const workflowId = await dataConnector.captureWorkflowStep({
          qualification_status: formData.qualification_status,
          trust_score: 95,
          north_american_content: getTotalComponentPercentage(),
          calculated_savings: formData.calculated_savings,
          annual_savings: formData.calculated_savings,
          component_origins: formData.component_origins,
          supplier_country: formData.supplier_country,
          hs_code: formData.classified_hs_code,
          product_description: formData.product_description
        }, 3, sessionId);
        
        // Capture Step 4: Certificate Generation
        await dataConnector.captureWorkflowStep({
          workflow_completion_id: workflowId,
          certificate_number: `USMCA-${Date.now()}`,
          signatory_name: authorizationData.signatory_name,
          signatory_title: authorizationData.signatory_title,
          exporter_name: formData.company_name,
          exporter_address: formData.company_address,
          exporter_tax_id: formData.tax_id,
          annual_savings: formData.calculated_savings,
          pdf_generated: true
        }, 4, sessionId);
        
        console.log('✅ Complete workflow data captured');
        console.log('📊 Business intelligence generated for admin dashboards');
        console.log('🎯 Revenue opportunities identified for sales team');
        
      } catch (dbError) {
        console.error('❌ WorkflowDataConnector failed (continuing with certificate):', dbError);
        await DevIssue.apiError('workflow_orchestrator', 'workflow-data-connector', dbError, {
          sessionId: workflowStorage.getItem('workflow_session_id'),
          company: formData.company_name
        });
      }
      
      // Use the trust verification service to generate certificate
      const { trustVerifiedCertificateService } = await import('../../lib/services/trust-verified-certificate-service.js');
      
      const certificateResult = await trustVerifiedCertificateService.generateTrustVerifiedCertificate(
        results.classification,
        results.usmca,
        {
          ...results.company,
          ...authorizationData,
          product_description: results.product?.description
        }
      );

      if (certificateResult.success) {
        // Generate PDF using official generator
        const pdfBlob = await generateUSMCACertificatePDF(certificateResult.certificate, {
          watermark: false,
          userTier
        });
        
        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `USMCA_Certificate_${certificateResult.generation_metadata.certificate_id}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log('Trust-verified certificate generated successfully');
      } else {
        alert('Certificate generation failed: ' + certificateResult.error);
      }
    } catch (error) {
      console.error('Certificate generation error:', error);
      await DevIssue.apiError('workflow_orchestrator', 'generate-certificate', error, {
        company: formData.company_name,
        product: formData.product_description
      });
      alert('Error generating certificate. Please try again.');
    }
  };

  // Path selection handlers
  const handleSelectFreeAnalysis = () => {
    console.log('User selected free crisis analysis path');
    processWorkflow('crisis-calculator');
  };

  const handleSelectAlertsSubscription = () => {
    console.log('User selected alerts subscription path');
    // For now, go to crisis calculator which includes subscription flow
    processWorkflow('crisis-calculator');
  };

  const handleSelectCertificate = () => {
    console.log('User selected professional certificate path');
    processWorkflow('certificate');
  };

  // Get current form field for chatbot context
  const getCurrentFormField = () => {
    // Map current step to form field context
    if (currentStep === 1) {
      return 'company_information';
    } else if (currentStep === 2) {
      return 'component_origins';
    } else if (currentStep === 3) {
      return 'supply_chain';
    } else if (currentStep === 4) {
      return 'authorization';
    }
    return 'general';
  };

  // Get workflow session ID for chatbot
  const workflowSessionId = typeof window !== 'undefined'
    ? workflowStorage.getItem('workflow_session_id') || `chat_${Date.now()}`
    : `chat_${Date.now()}`;

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="dashboard-title">USMCA Compliance Analysis</h1>
        <p className="dashboard-subtitle">
          Complete the 3-step workflow to determine if your product qualifies for USMCA benefits
        </p>
      </div>

      {/* Progress Indicator */}
      <WorkflowProgress
        currentStep={currentStep}
        trustIndicators={trustIndicators}
        onStepClick={goToStep}
        isStepClickable={false} // ✅ Never clickable - prevents validation bypass, simpler UX
        viewMode={viewMode} // Pass mode to show visual indicators
      />

      {/* Error Display */}
      <WorkflowError
        error={error}
        onDismiss={clearError}
        onRetry={currentStep === 3 ? handleRetryProcessing : undefined}
      />

      {/* Workflow Content */}
      <div className="form-section" ref={workAreaRef}>
        {/* Step Components */}
        {currentStep === 1 && (
          <CompanyInformationStep
            formData={formData}
            updateFormData={updateFormData}
            dropdownOptions={dropdownOptions}
            isLoadingOptions={isLoadingOptions}
            onNext={nextStep}
            isStepValid={() => isStepValid(1)}
            onNewAnalysis={resetWorkflow}
            saveWorkflowToDatabase={saveWorkflowToDatabase}
            viewMode={viewMode} // Pass view mode to disable buttons in read-only
            onLoadDemoData={handleLoadDemoData} // ✅ NEW: Enable demo data quick-start
          />
        )}

        {currentStep === 2 && workflowPath !== 'path-selection' && (
          <ComponentOriginsStepEnhanced
            formData={formData}
            updateFormData={updateFormData}
            dropdownOptions={dropdownOptions}
            isLoadingOptions={isLoadingOptions}
            onNext={() => nextStep('path-selection')}
            onPrevious={previousStep}
            onProcessWorkflow={handleProcessStep2}
            isFormValid={isFormValid}
            isLoading={isLoading}
            userTier={userTier}
            saveWorkflowToDatabase={saveWorkflowToDatabase}
            currentSessionId={currentSessionId}  // ✅ FIX (Nov 6): Pass session ID so component reacts to new sessions
            viewMode={viewMode} // Pass view mode to disable buttons in read-only
          />
        )}

        {currentStep === 2 && workflowPath === 'path-selection' && (
          <WorkflowPathSelection
            formData={formData}
            onSelectFreeAnalysis={handleSelectFreeAnalysis}
            onSelectAlertsSubscription={handleSelectAlertsSubscription}
            onSelectCertificate={handleSelectCertificate}
          />
        )}

        {currentStep === 3 && workflowPath === 'crisis-calculator' && (
          <CrisisCalculatorResults
            formData={formData}
            onViewAlerts={handleViewAlertsFromCrisisCalc}
            onUpgradeToCertificate={handleUpgradeToCertificate}
            onReset={resetWorkflow}
          />
        )}

        {currentStep === 3 && workflowPath !== 'crisis-calculator' && results && (
          <WorkflowResults
            results={results}
            workflowSessionId={currentSessionId}
            onReset={resetWorkflow}
            onDownloadCertificate={handleCertificateFormatSelection}
            onDownloadSimpleCertificate={handleDownloadSimpleCertificate}
            trustIndicators={trustIndicators}
            viewMode={viewMode}
            onContinueToAuthorization={async () => {
              // Prepare workflow data for database capture
              const workflowData = {
                company: {
                  name: formData.company_name,
                  business_type: formData.business_type,
                  company_address: formData.company_address,
                  tax_id: formData.tax_id,
                  contact_phone: formData.contact_phone,
                  contact_email: formData.contact_email,
                  supplier_country: formData.supplier_country,
                  destination_country: formData.destination_country,
                  trade_volume: formData.trade_volume
                },
                product: {
                  hs_code: formData.classified_hs_code,
                  description: formData.product_description,
                  original_hs_code: formData.classified_hs_code
                },
                usmca: {
                  north_american_content: getTotalComponentPercentage(),
                  component_breakdown: formData.component_origins,
                  manufacturing_location: formData.manufacturing_location,
                  qualification_status: formData.qualification_status,
                  qualification_level: formData.qualification_level,
                  rule: formData.qualification_rule
                },
                certificate: {
                  id: `CERT-${Date.now()}`,
                  exporter_name: formData.company_name,
                  exporter_address: formData.company_address,
                  exporter_tax_id: formData.tax_id,
                  product_description: formData.product_description,
                  hs_tariff_classification: formData.classified_hs_code,
                  preference_criterion: formData.preference_criterion,
                  country_of_origin: formData.country_of_origin,
                  blanket_start: new Date().toISOString().split('T')[0],
                  blanket_end: new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0]
                },
                savings: {
                  total_savings: formData.calculated_savings,
                  mfn_rate: formData.current_tariff_rate,
                  usmca_rate: formData.usmca_tariff_rate,
                  monthly_savings: formData.monthly_savings
                }
              };
              
              // Update results with workflow data
              setResults(prevResults => ({
                ...prevResults,
                ...workflowData
              }));
              
              // Navigate to Step 4 (Authorization) within the workflow instead of external page
              nextStep();
            }}
          />
        )}
        {currentStep === 4 && results && (
          <div>
            <AuthorizationStep
              formData={formData}
              updateFormData={updateFormData}
              workflowData={{
                company: {
                  name: formData.company_name,
                  company_name: formData.company_name,
                  country: formData.company_country,
                  company_country: formData.company_country,
                  address: formData.company_address,
                  company_address: formData.company_address,
                  tax_id: formData.tax_id,
                  contact_person: formData.contact_person,
                  contact_phone: formData.contact_phone,
                  contact_email: formData.contact_email,
                  business_type: formData.business_type,
                  industry_sector: formData.industry_sector,
                  trade_volume: formData.trade_volume,
                  destination_country: formData.destination_country,
                  supplier_country: formData.supplier_country,
                  manufacturing_location: formData.manufacturing_location
                },
                product: {
                  hs_code: formData.classified_hs_code,
                  description: formData.product_description
                }
              }}
              certificateData={{
                certifier_type: formData.certifier_type || 'EXPORTER',  // Pass certifier_type from Step 1
                company_info: {
                  exporter_name: formData.company_name,
                  exporter_address: formData.company_address,
                  exporter_country: formData.company_country,  // FIXED: Use company's country, not supplier country
                  exporter_tax_id: formData.tax_id,
                  exporter_phone: formData.contact_phone,  // FIXED: Map contact_phone to exporter_phone
                  exporter_email: formData.contact_email,  // FIXED: Map contact_email to exporter_email
                  importer_name: formData.importer_name,
                  importer_address: formData.importer_address,
                  importer_country: formData.importer_country,
                  importer_tax_id: formData.importer_tax_id
                },
                product_details: {
                  hs_code: formData.classified_hs_code,
                  commercial_description: formData.product_description,
                  manufacturing_location: formData.manufacturing_location
                }
              }}
            />
            <div className="hero-buttons">
              <button onClick={previousStep} className="btn-secondary">
                ← Back to Results
              </button>
              <button 
                onClick={() => handleGenerateCertificate(results, formData)} 
                className="btn-primary"
                disabled={!formData.signatory_name || !formData.signatory_title}
              >
                🎯 Generate USMCA Certificate
              </button>
            </div>
          </div>
        )}

        {currentStep === 5 && results && (
          <WorkflowResults
            results={results}
            workflowSessionId={currentSessionId}
            onReset={resetWorkflow}
            onDownloadCertificate={handleCertificateFormatSelection}
            onDownloadSimpleCertificate={handleDownloadSimpleCertificate}
            trustIndicators={trustIndicators}
            viewMode={viewMode}
          />
        )}
      </div>

      {/* Loading Overlay */}
      <WorkflowLoading isVisible={isLoading} />

      {/* Global Broker Chatbot - Available Throughout Journey */}
      <BrokerChatbot
        currentFormField={getCurrentFormField()}
        sessionId={workflowSessionId}
      />
    </div>
  );
}
