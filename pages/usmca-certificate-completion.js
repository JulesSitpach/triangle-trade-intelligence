/**
 * USMCA Certificate Completion Page
 * Uses the AuthorizationStep component for certificate generation
 * Updated with dashboard-user.css styling for consistency
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import TriangleLayout from '../components/TriangleLayout';
import AuthorizationStep from '../components/workflow/AuthorizationStep';
import EditableCertificatePreview from '../components/workflow/EditableCertificatePreview';
import WorkflowProgress from '../components/workflow/WorkflowProgress';
import { calculateDynamicTrustScore, getFallbackTrustScore } from '../lib/utils/trust-score-calculator.js';
import { generateUSMCACertificatePDF } from '../lib/utils/usmca-certificate-pdf-generator.js';

export default function USMCACertificateCompletion() {
  const router = useRouter();
  const [workflowData, setWorkflowData] = useState(null);
  const [dynamicTrustData, setDynamicTrustData] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [generatedPDF, setGeneratedPDF] = useState(null);
  const [userTier, setUserTier] = useState('Trial'); // Default to Trial for safety
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false); // Track whether to show preview or authorization
  const [previewEditedData, setPreviewEditedData] = useState(null); // Store edits from preview
  const [certificateData, setCertificateData] = useState({
    company_info: {},
    product_details: {},
    authorization: {},
    blanket_period: {
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0]
    }
  });

  // Fetch user subscription tier on mount
  useEffect(() => {
    const fetchUserTier = async () => {
      try {
        const response = await fetch('/api/dashboard-data', {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          const tier = data.user_profile?.subscription_tier || 'Trial';
          setUserTier(tier);
          console.log('User subscription tier:', tier);
        }
      } catch (error) {
        console.error('Failed to fetch user tier:', error);
        // Default to Trial on error for safety
        setUserTier('Trial');
      }
    };
    fetchUserTier();
  }, []);

  useEffect(() => {
    // Load workflow data from localStorage
    try {
      const storedData = localStorage.getItem('usmca_workflow_results');
      if (storedData) {
        const initialData = JSON.parse(storedData);
        console.log('Loading workflow data from localStorage:', initialData);
        setWorkflowData(initialData);

        // Calculate dynamic trust score
        let calculatedTrustData = null;
        try {
          calculatedTrustData = calculateDynamicTrustScore(initialData);
          console.log('Dynamic trust score calculated:', calculatedTrustData);
          setDynamicTrustData(calculatedTrustData);
        } catch (error) {
          console.error('Failed to calculate dynamic trust score:', error);
          calculatedTrustData = getFallbackTrustScore();
          setDynamicTrustData(calculatedTrustData);
        }

        // Create unified analysis results structure
        const analysisResults = {
          trust_score: initialData.trust?.score ? (initialData.trust.score / 100) :
                      calculatedTrustData?.trust_score,
          regional_content: initialData.usmca?.regional_content ||
                           initialData.usmca?.north_american_content ||
                           100.0,
          qualification_status: initialData.usmca?.qualified ? 'QUALIFIED' : 'NOT_QUALIFIED',
          origin_criterion: initialData.usmca?.preference_criterion,
          hs_code: initialData.product?.hs_code || '',
          manufacturing_location: initialData.usmca?.manufacturing_location || '',
          component_breakdown: initialData.components || [],
          calculated_at: new Date().toISOString()
        };

        // Auto-populate certificate data
        setCertificateData(prev => ({
          ...prev,
          analysis_results: analysisResults,
          company_info: {
            exporter_name: initialData.company?.name || initialData.company?.company_name || '',
            exporter_address: initialData.company?.company_address || initialData.company?.address || '',
            exporter_country: initialData.company?.company_country || '',  // FIXED: Use company_country field
            exporter_tax_id: initialData.company?.tax_id || '',
            exporter_phone: initialData.company?.contact_phone || '',
            exporter_email: initialData.company?.contact_email || '',
          },
          product_details: {
            hs_code: analysisResults.hs_code,
            commercial_description: initialData.product?.description || '',
            manufacturing_location: analysisResults.manufacturing_location
          }
        }));
      }
    } catch (error) {
      console.error('Error loading workflow data:', error);
    }
  }, []);

  const updateCertificateData = (section, data) => {
    setCertificateData(prev => ({
      ...prev,
      [section]: { ...prev[section], ...data }
    }));
  };

  const handlePreviewCertificate = async (authData) => {
    console.log('Opening certificate preview for review and editing...');

    // Store authorization data for use in preview
    setCertificateData(prev => ({
      ...prev,
      authorization: authData
    }));

    // Show the editable preview step
    setShowPreview(true);
  };

  const handlePreviewDownload = async (editedPreviewData) => {
    // Update workflow data with any edits from preview
    if (editedPreviewData) {
      setWorkflowData(prev => ({
        ...prev,
        usmca: {
          ...prev?.usmca,
          north_american_content: editedPreviewData.rvc,
          regional_content: editedPreviewData.rvc,
          preference_criterion: editedPreviewData.preference_criterion
        },
        components: editedPreviewData.components
      }));
      setPreviewEditedData(editedPreviewData);
    }

    // Now generate the certificate with potentially updated data
    await generateAndDownloadCertificate();
  };

  const generateAndDownloadCertificate = async () => {
    const authData = certificateData.authorization || {};
    const preview = {
      ...certificateData,
      authorization: authData,
      certificate_number: `CERT-${Date.now()}`,
      date: new Date().toLocaleDateString()
    };

    console.log('Generating professional certificate with data:', preview);

    // CRITICAL DEBUG: Log what company_country value we have
    console.log('🔍 CERTIFICATE PAGE - Company Country Check:', {
      has_workflowData: !!workflowData,
      has_company: !!workflowData?.company,
      company_country_value: workflowData?.company?.company_country,
      company_country_type: typeof workflowData?.company?.company_country,
      full_company_object: workflowData?.company
    });

    try {
      const response = await fetch('/api/generate-certificate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'generate_certificate',
          certificateData: {
            // ✅ FIX #4: Get certifier_type from authData (Step 4 selection), not from company object
            // authData.certifier_type is set when user selects IMPORTER/EXPORTER/PRODUCER in AuthorizationStep
            certifier_type: authData?.certifier_type || 'EXPORTER',
            company_info: {
              exporter_name: workflowData?.company?.company_name || workflowData?.company?.name || '',
              exporter_address: workflowData?.company?.company_address || '',
              exporter_country: workflowData?.company?.company_country || '',  // FIXED: Use company's country, not manufacturing location
              exporter_tax_id: workflowData?.company?.tax_id || '',
              exporter_phone: workflowData?.company?.contact_phone || '',
              exporter_email: workflowData?.company?.contact_email || '',
              importer_name: authData.importer_name || '',
              importer_address: authData.importer_address || '',
              importer_country: authData.importer_country || '',
              importer_tax_id: authData.importer_tax_id || '',
              importer_phone: authData.importer_phone || '',
              importer_email: authData.importer_email || ''
            },
            product_details: {
              hs_code: workflowData?.product?.hs_code || '',
              product_description: workflowData?.product?.description || '',
              commercial_description: workflowData?.product?.description || '',
              manufacturing_location: workflowData?.usmca?.manufacturing_location || '',
              tariff_classification_verified: true,
              verification_source: 'Database-verified'
            },
            supply_chain: {
              manufacturing_location: certificateData.analysis_results.manufacturing_location,
              regional_value_content: certificateData.analysis_results.regional_content,
              component_origins: certificateData.analysis_results.component_breakdown,
              supply_chain_verified: true,
              qualified: certificateData.analysis_results.qualification_status === 'QUALIFIED',
              rule: workflowData?.usmca?.rule,
              threshold_applied: workflowData?.usmca?.threshold_applied,
              preference_criterion: certificateData.analysis_results.origin_criterion,
              method_of_qualification: workflowData?.method_of_qualification || 'TV',
              trust_score: certificateData.analysis_results.trust_score,
              verification_status: workflowData?.usmca?.verification_status
            },
            authorization: {
              signatory_name: authData.signatory_name || '',
              signatory_title: authData.signatory_title || '',
              signatory_email: authData.signatory_email || '',
              signatory_phone: authData.signatory_phone || '',
              signatory_date: new Date().toISOString(),
              declaration_accepted: authData.accuracy_certification && authData.authority_certification
            }
          }
        })
      });

      const result = await response.json();

      if (result.success) {
        console.log('Professional certificate generated:', result);

        // Use professional_certificate from response
        const cert = result.professional_certificate;

        // Save certificate to localStorage for alerts
        try {
          const completionData = {
            company: cert.exporter,
            product: cert.product,
            certificate: cert,
            completion_date: new Date().toISOString(),
            timestamp: Date.now(),
            trust: {
              overall_trust_score: cert.trust_verification?.overall_trust_score || null
            },
            usmca: {
              qualified: cert.usmca_analysis?.qualified || true,
              regional_content: cert.usmca_analysis?.regional_content || 100,
              north_american_content: cert.usmca_analysis?.regional_content || 100
            }
          };

          localStorage.setItem('usmca_workflow_data', JSON.stringify(completionData));
          localStorage.setItem('usmca_company_data', JSON.stringify(cert.exporter));
          localStorage.setItem('usmca_workflow_results', JSON.stringify(completionData));

          console.log('🎯 Certificate saved to localStorage for alerts');
        } catch (error) {
          console.error('Failed to save completion data:', error);
        }

        setPreviewData({
          ...preview,
          professional_certificate: cert
        });
        setShowPreview(true);

        console.log('Certificate generated successfully');
      } else {
        throw new Error(result.error || 'Certificate generation failed');
      }
    } catch (error) {
      console.error('Certificate generation error:', error);
      alert('Error generating certificate. Please try again.');
    }
  };

  const generatePDFFromCertificate = async (professionalCertificate, options = {}) => {
    // Use the official USMCA PDF generator with userTier for watermarking
    return await generateUSMCACertificatePDF(professionalCertificate, {
      userTier: userTier,
      ...options
    });
  };

  const handleDownloadCertificate = async () => {
    // Check if user is on Trial tier
    if (userTier === 'Trial') {
      setShowUpgradeModal(true);
      return;
    }

    if (previewData?.professional_certificate) {
      try {
        const pdfBlob = await generatePDFFromCertificate(previewData.professional_certificate);

        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = url;
        const certificateNumber = previewData.professional_certificate.certificate_number || 'Certificate';
        const filename = pdfBlob.filename || `USMCA_Certificate_${certificateNumber}.pdf`;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Error generating PDF:', error);
        alert('Error downloading certificate. Please try again.');
      }
    } else {
      alert('Please generate the certificate first');
    }
  };

  const handleViewCertificatePreview = async () => {
    // Allow preview for all users (including Trial)
    if (previewData?.professional_certificate) {
      try {
        const pdfBlob = await generatePDFFromCertificate(previewData.professional_certificate);

        const url = URL.createObjectURL(pdfBlob);
        window.open(url, '_blank');

        // Clean up after a delay
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } catch (error) {
        console.error('Error generating preview:', error);
        alert('Error previewing certificate. Please try again.');
      }
    } else {
      alert('Please generate the certificate first');
    }
  };

  const handleEmailToImporter = async (authData) => {
    // Check if user is on Trial tier
    if (userTier === 'Trial') {
      setShowUpgradeModal(true);
      return;
    }

    if (previewData?.professional_certificate && authData?.importer_email) {
      try {
        const pdfBlob = await generatePDFFromCertificate(previewData.professional_certificate);

        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = url;
        const certificateNumber = previewData.professional_certificate.certificate_number || 'Certificate';
        const filename = pdfBlob.filename || `USMCA_Certificate_${certificateNumber}.pdf`;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        const subject = `USMCA Certificate of Origin - ${certificateNumber}`;
        const body = `Dear Importer,\n\nPlease find attached your USMCA Certificate of Origin.\n\nCertificate Number: ${certificateNumber}\nTrust Score: ${(previewData.professional_certificate.trust_verification?.overall_trust_score * 100).toFixed(1)}%\n\nBest regards,\n${authData.signatory_name || 'Authorized Representative'}`;

        const mailtoLink = `mailto:${authData.importer_email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.location.href = mailtoLink;

        alert('Certificate PDF downloaded. Email client opened - please attach the downloaded PDF.');
      } catch (error) {
        console.error('Error generating certificate for email:', error);
        alert('Error preparing certificate for email. Please try again.');
      }
    } else {
      alert('Please provide importer email address to send certificate.');
    }
  };

  if (!workflowData) {
    return (
      <TriangleLayout>
        <div className="dashboard-container">
          <div className="form-section">
            <div className="dashboard-header">
              <h1 className="dashboard-title">USMCA Certificate Authorization</h1>
              <p className="text-body">Loading workflow data...</p>
            </div>
            <p className="text-body">Please complete the USMCA workflow first.</p>
          </div>
        </div>
      </TriangleLayout>
    );
  }

  return (
    <TriangleLayout>
      <div className="user-dashboard-page">
        <div className="dashboard-container">
          {/* Workflow Progress Indicator - Clickable Navigation */}
          <WorkflowProgress
            currentStep={4}
            isStepClickable={true}
            onStepClick={(step) => {
              if (step === 1 || step === 2) {
                // Navigate back to workflow orchestrator at specific step
                localStorage.setItem('workflow_current_step', step.toString());
                router.push('/usmca-workflow');
              } else if (step === 3) {
                // Navigate back to results
                localStorage.setItem('workflow_current_step', '3');
                router.push('/usmca-workflow');
              }
              // step 4 = current page, do nothing
            }}
          />

          <div className="form-section">
            <div className="dashboard-header">
              <h1 className="dashboard-title">
                {showPreview ? '📋 Review Your Certificate' : '✍️ USMCA Certificate Authorization'}
              </h1>
              <p className="text-body">
                {showPreview
                  ? 'Review and edit all certificate details before downloading'
                  : 'Complete authorization details to proceed with certificate generation'
                }
              </p>
            </div>
          </div>

          <div>
            {/* STEP 1: Authorization Form */}
            {!showPreview && (
              <AuthorizationStep
                formData={certificateData.authorization || {}}
                updateFormData={(field, value) => updateCertificateData('authorization', { [field]: value })}
                workflowData={workflowData}
                certificateData={certificateData}
                onPreviewCertificate={handlePreviewCertificate}
                onDownloadCertificate={handleDownloadCertificate}
                onEmailToImporter={handleEmailToImporter}
                previewData={previewData}
                generatedPDF={generatedPDF}
                userTier={userTier}
              />
            )}

            {/* STEP 2: Editable Certificate Preview */}
            {showPreview && workflowData && (
              <EditableCertificatePreview
                certificateData={certificateData}
                workflowData={workflowData}
                onEdit={(editedData) => setPreviewEditedData(editedData)}
                onDownload={() => handlePreviewDownload(previewEditedData)}
                onBack={() => setShowPreview(false)}
              />
            )}
          </div>

          {/* Upgrade Modal for Trial Users */}
          {showUpgradeModal && (
            <div className="modal-overlay" onClick={() => setShowUpgradeModal(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>🚀 Upgrade Required for Certificate Download</h2>
                  <button onClick={() => setShowUpgradeModal(false)} className="modal-close">×</button>
                </div>
                <div className="modal-body">
                  <div className="alert alert-warning">
                    <div className="alert-content">
                      <div className="alert-title">Free Trial - Preview Only</div>
                      <div className="text-body">
                        Your free trial allows you to preview the certificate with a watermark,
                        but downloading official certificates requires a paid subscription.
                      </div>
                    </div>
                  </div>

                  <p className="text-body">
                    Official USMCA certificates must be accepted by customs authorities.
                    Subscribe to download certificates that are valid for customs submissions
                    and backed by professional compliance verification.
                  </p>

                  <div style={{background: '#f3f4f6', padding: '1.5rem', borderRadius: '8px', marginBottom: '1rem'}}>
                    <h3 style={{marginTop: 0}}>Starter Plan - $99/mo</h3>
                    <ul style={{marginBottom: 0}}>
                      <li>✓ 10 USMCA analyses per month</li>
                      <li>✓ 10 components per analysis</li>
                      <li>✓ Full certificate download (no watermark)</li>
                      <li>✓ Email crisis alerts (high/critical)</li>
                      <li>✓ Valid for customs submissions</li>
                    </ul>
                  </div>

                  <div style={{background: '#ede9fe', padding: '1.5rem', borderRadius: '8px'}}>
                    <h3 style={{marginTop: 0}}>
                      Professional Plan - $299/mo
                      <span style={{background: '#8b5cf6', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '4px', marginLeft: '0.5rem', fontSize: '0.875rem'}}>POPULAR</span>
                    </h3>
                    <ul style={{marginBottom: 0}}>
                      <li>✓ Unlimited USMCA analyses</li>
                      <li>✓ 25 components per analysis</li>
                      <li>✓ Full certificate download</li>
                      <li>✓ All email alerts</li>
                      <li>✓ 15% service discounts</li>
                      <li>✓ Priority support (48hr)</li>
                    </ul>
                  </div>
                </div>
                <div className="modal-footer">
                  <button onClick={handleViewCertificatePreview} className="btn-secondary">
                    Preview with Watermark
                  </button>
                  <a href="/pricing" className="btn-primary">
                    View Plans &amp; Upgrade
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </TriangleLayout>
  );
}
