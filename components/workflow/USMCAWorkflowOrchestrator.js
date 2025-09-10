/**
 * USMCAWorkflowOrchestrator - Main workflow orchestration component
 * Replaces the 894-line monolithic component with clean architecture
 * Integrates all focused components and trust microservices
 */

import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useWorkflowState } from '../../hooks/useWorkflowState';
import { useTrustIndicators } from '../../hooks/useTrustIndicators';
import { trustVerifiedCertificateFormatter } from '../../lib/utils/trust-verified-certificate-formatter';
import WorkflowProgress from './WorkflowProgress';
import CompanyInformationStep from './CompanyInformationStep';
import ComponentOriginsStepEnhanced from './ComponentOriginsStepEnhanced';
import SupplyChainStep from './SupplyChainStep';
import WorkflowResults from './WorkflowResults';
import WorkflowLoading from './WorkflowLoading';
import WorkflowError from './WorkflowError';
import CrisisCalculatorResults from './CrisisCalculatorResults';
import WorkflowPathSelection from './WorkflowPathSelection';

export default function USMCAWorkflowOrchestrator() {
  const router = useRouter();
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
    clearError
  } = useWorkflowState();

  const { trustIndicators } = useTrustIndicators();

  // Handle "New Analysis" reset trigger
  useEffect(() => {
    if (router.query.reset === 'true') {
      console.log('🔄 New Analysis triggered - resetting workflow');
      resetWorkflow();
      // Clean up the URL by removing the reset parameter
      router.replace('/usmca-workflow', undefined, { shallow: true });
    }
  }, [router.query.reset, resetWorkflow, router]);

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
PREFERENCE CRITERION: ${certificate.preference_criterion || 'B'}

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

  // Crisis Calculator handlers
  const handleViewAlertsFromCrisisCalc = () => {
    console.log('User navigating to alerts dashboard from crisis calculator');
  };

  const handleUpgradeToCertificate = () => {
    console.log('User upgrading from crisis calculator to certificate path');
    // Switch to certificate path and go to step 2
    nextStep('certificate');
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

  return (
    <div className="workflow-container">
      {/* Enterprise Header */}
      <section className="main-content hero-section">
        <div className="container-app">
          <div className="section-header">
            <h1 className="page-title">
              USMCA Compliance Analysis
            </h1>
            <h2 className="page-subtitle">
              Enterprise Trade Classification & Certificate Generation Platform
            </h2>
            <p className="page-description">
              AI-powered compliance analysis with government-verified data. Generate audit-ready certificates 
              and optimize tariff savings through professional USMCA qualification assessment.
            </p>
            
            {/* Professional Status Dashboard */}
            <div className="status-grid">
              <div className="status-card">
                <div className="status-value success">34,476</div>
                <div className="status-label">Government Records</div>
                <div className="badge badge-success">Verified</div>
              </div>
              <div className="status-card">
                <div className="status-value info">99.9%</div>
                <div className="status-label">System Uptime</div>
                <div className="badge badge-info">Operational</div>
              </div>
              <div className="status-card">
                <div className="status-value primary">Licensed</div>
                <div className="status-label">Customs Brokers</div>
                <div className="badge badge-info">Expert Network</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Progress Indicator */}
      <WorkflowProgress 
        currentStep={currentStep}
        trustIndicators={trustIndicators}
        onStepClick={goToStep}
        isStepClickable={currentStep === 3} // Allow navigation only from results
      />

      {/* Error Display */}
      <WorkflowError 
        error={error}
        onDismiss={clearError}
        onRetry={currentStep === 3 ? handleRetryProcessing : undefined}
      />

      {/* Workflow Content */}
      <section className="main-content">
        <div className="container-app">
          <div className="content-card">
        {/* Step Components */}
        {currentStep === 1 && (
          <CompanyInformationStep
            formData={formData}
            updateFormData={updateFormData}
            dropdownOptions={dropdownOptions}
            isLoadingOptions={isLoadingOptions}
            onNext={nextStep}
            isStepValid={() => isStepValid(1)}
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
            onProcessWorkflow={processWorkflow}
            isFormValid={isFormValid}
            isLoading={isLoading}
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
        {currentStep === 3 && workflowPath === 'certificate' && (
          <div>
            <SupplyChainStep
              data={formData}
              onChange={updateFormData}
              validation={{ errors: [] }}
            />
            <div className="hero-buttons">
              <button onClick={previousStep} className="btn-secondary">
                ← Previous Step
              </button>
              <button onClick={() => nextStep()} className="btn-primary">
                Continue to Authorization →
              </button>
            </div>
          </div>
        )}
        {currentStep === 4 && workflowPath === 'certificate' && (
          <div>
            <AuthorizationStep
              formData={formData}
              updateFormData={updateFormData}
            />
            <div className="hero-buttons">
              <button onClick={previousStep} className="btn-secondary">
                ← Previous Step
              </button>
              <button onClick={() => nextStep()} className="btn-primary">
                Continue to Review & Generate →
              </button>
            </div>
          </div>
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
            onReset={resetWorkflow}
            onDownloadCertificate={handleCertificateFormatSelection}
            onDownloadSimpleCertificate={handleDownloadSimpleCertificate}
            trustIndicators={trustIndicators}
          />
        )}
        {currentStep === 5 && results && (
          <WorkflowResults
            results={results}
            onReset={resetWorkflow}
            onDownloadCertificate={handleCertificateFormatSelection}
            onDownloadSimpleCertificate={handleDownloadSimpleCertificate}
            trustIndicators={trustIndicators}
          />
        )}
          </div>
        </div>
      </section>

      {/* Loading Overlay */}
      <WorkflowLoading isVisible={isLoading} />
    </div>
  );
}

// Authorization Step Component
function AuthorizationStep({ formData, updateFormData }) {
  return (
    <div className="element-spacing">
      <div className="alert alert-info">
        <div className="alert-content">
          <div className="alert-title">Authorization & Digital Signature</div>
          <div className="text-body">
            Complete authorized signatory information for official USMCA certificate generation.
          </div>
        </div>
      </div>

      <div className="form-section">
        <h3 className="form-section-title">Authorized Signatory Information</h3>
        
        <div className="form-grid-2">
          <div className="form-group">
            <label className="form-label required">Authorized Signatory Name</label>
            <input
              type="text"
              value={formData.signatory_name || ''}
              onChange={(e) => updateFormData('signatory_name', e.target.value)}
              className="form-input"
              placeholder="Full name of authorized person"
              required
            />
          </div>
          
          <div className="form-group">
            <label className="form-label required">Title/Position</label>
            <input
              type="text"
              value={formData.signatory_title || ''}
              onChange={(e) => updateFormData('signatory_title', e.target.value)}
              className="form-input"
              placeholder="e.g., President, Export Manager"
              required
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input
              type="tel"
              value={formData.signatory_phone || ''}
              onChange={(e) => updateFormData('signatory_phone', e.target.value)}
              className="form-input"
              placeholder="Contact phone number"
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              value={formData.signatory_email || ''}
              onChange={(e) => updateFormData('signatory_email', e.target.value)}
              className="form-input"
              placeholder="signatory@company.com"
            />
          </div>
        </div>
        
        <div className="alert alert-warning">
          <div className="alert-content">
            <div className="alert-title">Authorization Declaration</div>
            <div className="text-body">
              By completing this section, the authorized signatory certifies that the goods described 
              qualify as originating under the USMCA and that the information is true and accurate.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}