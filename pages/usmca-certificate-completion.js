/**
 * USMCA Certificate Completion Page
 * Uses the comprehensive CertificateCompletionWizard component
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import TriangleLayout from '../components/TriangleLayout';
import AuthorizationStep from '../components/workflow/AuthorizationStep';
import { calculateDynamicTrustScore, getFallbackTrustScore } from '../lib/utils/trust-score-calculator.js';

export default function USMCACertificateCompletion() {
  const router = useRouter();
  const [workflowData, setWorkflowData] = useState(null);
  const [dynamicTrustData, setDynamicTrustData] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [generatedPDF, setGeneratedPDF] = useState(null);
  const [certificateData, setCertificateData] = useState({
    company_info: {},
    product_details: {},
    authorization: {},
    blanket_period: {
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0]
    }
  });

  useEffect(() => {
    // Load workflow data from URL query parameters or localStorage
    try {
      let initialData = null;

      // First, try to get data from URL query parameters
      if (router.query.data) {
        try {
          initialData = JSON.parse(decodeURIComponent(router.query.data));
          console.log('Loading workflow data from URL:', initialData);
        } catch (error) {
          console.error('Failed to parse URL data:', error);
        }
      }

      // Fallback to localStorage if no URL data
      if (!initialData) {
        const storedData = localStorage.getItem('usmca_workflow_results');
        if (storedData) {
          initialData = JSON.parse(storedData);
          console.log('Loading workflow data from localStorage:', initialData);
        }
      }

      if (initialData) {
        setWorkflowData(initialData);
        
        // Calculate dynamic trust score for analysis results
        let calculatedTrustData = null;
        try {
          calculatedTrustData = calculateDynamicTrustScore(initialData);
          console.log('Dynamic trust score calculated in certificate completion:', calculatedTrustData);
          setDynamicTrustData(calculatedTrustData);
        } catch (error) {
          console.error('Failed to calculate dynamic trust score:', error);
          calculatedTrustData = getFallbackTrustScore();
          setDynamicTrustData(calculatedTrustData);
        }

        // Create single unified analysis results structure
        const analysisResults = {
          // Analysis calculations (Step 3 results) - Use actual trust score from workflow
          trust_score: initialData.trust?.score ? (initialData.trust.score / 100) : 
                      calculatedTrustData?.trust_score, // Convert percentage to decimal for API
          regional_content: initialData.usmca?.regional_content || 
                           initialData.usmca?.north_american_content || 
                           100.0,
          qualification_status: initialData.usmca?.qualified ? 'QUALIFIED' : 'NOT_QUALIFIED',
          origin_criterion: initialData.usmca?.preference_criterion || 'B',
          hs_code: initialData.product?.hs_code || '',
          manufacturing_location: initialData.usmca?.manufacturing_location || workflowData?.manufacturing_location || '',
          component_breakdown: initialData.components || [],
          calculated_at: new Date().toISOString()
        };

        console.log('🔧 UNIFIED ANALYSIS RESULTS:', analysisResults);

        // Auto-populate certificate data using unified analysis
        setCertificateData(prev => ({
          ...prev,
          analysis_results: analysisResults,
          company_info: {
            exporter_name: initialData.company?.name || initialData.company?.company_name || workflowData?.company_name || '',
            exporter_address: initialData.company?.company_address || initialData.company?.address || workflowData?.company_address || '',
            exporter_country: initialData.company?.country || initialData.company?.exporter_country || workflowData?.destination_country || '',
            exporter_tax_id: initialData.company?.tax_id || workflowData?.tax_id || '',
            exporter_phone: initialData.company?.contact_phone || initialData.company?.phone || workflowData?.contact_phone || '',
            exporter_email: initialData.company?.contact_email || initialData.company?.email || workflowData?.contact_email || '',
          },
          product_details: {
            hs_code: analysisResults.hs_code,
            commercial_description: initialData.product?.description || workflowData?.product_description || 'Product classification verified',
            manufacturing_location: analysisResults.manufacturing_location
          }
        }));
      }
    } catch (error) {
      console.error('Error loading workflow data:', error);
    }
  }, [router.query]);

  const updateCertificateData = (section, data) => {
    setCertificateData(prev => ({
      ...prev,
      [section]: { ...prev[section], ...data }
    }));
  };

  const handleGenerateCertificate = async () => {
    console.log('Generating certificate with data:', certificateData);
    
    // Save the certificate completion data to localStorage for the alerts system
    try {
      const completionData = {
        company_info: certificateData.company_info,
        product_details: certificateData.product_details,
        supply_chain: certificateData.supply_chain || {
          trust_score: workflowData?.trust?.overall_trust_score || 
                      (dynamicTrustData?.trust_score !== null ? dynamicTrustData.trust_score : null),
          regional_value_content: workflowData?.usmca?.regional_content || 100,
          component_origins: workflowData?.components || []
        },
        certificate: {
          ...certificateData,
          completion_date: new Date().toISOString(),
          trust_score: workflowData?.trust?.overall_trust_score || null // Remove hardcoded fallback
        },
        completion_date: new Date().toISOString(),
        timestamp: Date.now()
      };
      
      // Save to the same localStorage keys that alerts system reads
      localStorage.setItem('usmca_workflow_data', JSON.stringify(completionData));
      localStorage.setItem('usmca_company_data', JSON.stringify(certificateData.company_info));
      localStorage.setItem('usmca_workflow_results', JSON.stringify(completionData));
      
      console.log('🎯 Certificate completion data saved to localStorage for alerts system');
    } catch (error) {
      console.error('Failed to save completion data:', error);
    }
    
    // The AuthorizationStep will handle PDF generation
  };

  const handlePreviewCertificate = async (authData) => {
    const preview = {
      ...certificateData,
      authorization: authData,
      certificate_number: `CERT-${Date.now()}`,
      date: new Date().toLocaleDateString()
    };
    
    console.log('Generating professional certificate with data:', preview);
    
    // Debug: Check what trust score data we have
    console.log('🔍 WORKFLOW DATA DEBUG:', {
      trust_score_usmca: workflowData?.usmca?.trust_score,
      trust_score_trust: workflowData?.trust?.overall_trust_score,
      usmca_keys: Object.keys(workflowData?.usmca || {}),
      workflowData_keys: Object.keys(workflowData || {})
    });
    
    try {
      // Use the professional certificate service
      const response = await fetch('/api/trust/complete-certificate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'generate_certificate',
          certificateData: {
            company_info: {
              exporter_name: workflowData?.company?.company_name || workflowData?.company?.name || '',
              exporter_address: workflowData?.company?.company_address || workflowData?.company?.address || '',
              exporter_country: workflowData?.usmca?.manufacturing_location || workflowData?.company?.country,
              exporter_tax_id: workflowData?.company?.tax_id || '',
              exporter_phone: workflowData?.company?.contact_phone || workflowData?.company?.phone || '',
              exporter_email: workflowData?.company?.contact_email || workflowData?.company?.email || '',
              importer_name: authData.importer_name || '',
              importer_address: authData.importer_address || '',
              importer_country: authData.importer_country || '',
              importer_tax_id: authData.importer_tax_id || ''
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
              // Use unified analysis results - single source of truth
              manufacturing_location: certificateData.analysis_results.manufacturing_location,
              regional_value_content: certificateData.analysis_results.regional_content,
              component_origins: certificateData.analysis_results.component_breakdown,
              supply_chain_verified: true,
              // Pass through working analysis results to prevent recalculation
              qualified: certificateData.analysis_results.qualification_status === 'QUALIFIED',
              rule: workflowData?.usmca?.rule,
              threshold_applied: workflowData?.usmca?.threshold_applied,
              preference_criterion: certificateData.analysis_results.origin_criterion,
              trust_score: certificateData.analysis_results.trust_score, // Single source
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
        console.log('🔍 Certificate data being passed to PDF:', result.certificate);
        
        // Save the certificate completion data to localStorage for the alerts system
        try {
          const completionData = {
            company: result.certificate.exporter,
            product: result.certificate.product,
            certificate: result.certificate,
            completion_date: new Date().toISOString(),
            timestamp: Date.now(),
            trust: {
              overall_trust_score: result.certificate.trust_score || null // Remove hardcoded fallback
            },
            usmca: {
              qualified: result.certificate.usmca_analysis?.qualified || true,
              regional_content: result.certificate.usmca_analysis?.regional_content || 100,
              north_american_content: result.certificate.usmca_analysis?.regional_content || 100
            }
          };
          
          // Save to the same localStorage keys that alerts system reads  
          localStorage.setItem('usmca_workflow_data', JSON.stringify(completionData));
          localStorage.setItem('usmca_company_data', JSON.stringify(result.certificate.exporter));
          localStorage.setItem('usmca_workflow_results', JSON.stringify(completionData));
          
          console.log('🎯 Certificate completion data saved to localStorage for alerts system:', completionData.company?.name);

        // Also save to database for persistent alerts
        try {
          const workflowCompleteResponse = await fetch('/api/workflow-complete', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              step: 'certificate_generation',
              data: {
                company_name: result.certificate.exporter?.name,
                product_description: result.certificate.product?.description,
                hs_code: result.certificate.product?.hs_code,
                annual_savings: result.certificate.usmca_analysis?.annual_savings || completionData.supply_chain?.annual_savings,
                trade_volume: workflowData?.company?.trade_volume,
                signatory_name: result.certificate.authorization?.signatory_name,
                certificate_number: result.certificate.certificate_number,
                qualified: result.certificate.usmca_analysis?.qualified || true,
                regional_content: result.certificate.usmca_analysis?.regional_content || 100
              },
              sessionId: `cert-${Date.now()}`,
              userId: 'workflow-user'
            })
          });

          if (workflowCompleteResponse.ok) {
            console.log('✅ Workflow data saved to database for alerts');
          } else {
            console.warn('⚠️ Failed to save workflow to database, alerts will use localStorage only');
          }
        } catch (dbError) {
          console.warn('⚠️ Database save failed, alerts will use localStorage:', dbError);
        }
        } catch (error) {
          console.error('Failed to save completion data:', error);
        }
        
        // Store the certificate for PDF generation (will use preview data)
        // PDF generation happens when download button is clicked
        
        // Show the professional preview
        console.log('Setting previewData with certificate:', result.certificate);
        setPreviewData({
          ...preview,
          professional_certificate: result.certificate
        });
        setShowPreview(true);
        
        console.log('Certificate generated successfully with trust verification');
      } else {
        throw new Error(result.error || 'Certificate generation failed');
      }
    } catch (error) {
      console.error('Certificate generation error:', error);
      alert('Error generating certificate. Please try again.');
    }
  };

  const generatePDFFromCertificate = async (professionalCertificate) => {
    // Debug: Log the certificate data structure
    console.log('🔍 PDF Generation - Certificate Data Structure:', {
      complete_object: professionalCertificate,
      exporter: professionalCertificate.exporter,
      importer: professionalCertificate.importer,
      product: professionalCertificate.product,
      hs_classification: professionalCertificate.hs_classification
    });
    
    // Dynamic import to avoid SSR issues
    const jsPDFModule = await import('jspdf');
    const jsPDF = jsPDFModule.default || jsPDFModule;
    
    const doc = new jsPDF();
    
    // Generate EXACT same format as the preview window
    
    // Official USMCA Certificate Header
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('UNITED STATES-MEXICO-CANADA AGREEMENT', 105, 15, { align: 'center' });
    doc.text('CERTIFICATE OF ORIGIN', 105, 22, { align: 'center' });
    
    // Trust verification header
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Certificate No: ${professionalCertificate.certificate_number}`, 20, 35);
    doc.text(`Date: ${new Date(professionalCertificate.generation_info?.generated_date).toLocaleDateString()}`, 140, 35);
    
    if (professionalCertificate.trust_verification) {
      doc.setFontSize(8);
      const trustScore = (professionalCertificate.trust_verification.overall_trust_score * 100).toFixed(1);
      doc.text(`Trust Score: ${trustScore}% | ${professionalCertificate.trust_verification.trust_level?.toUpperCase()}`, 105, 40, { align: 'center' });
    }

    let yPos = 50;

    // FIELD 1 - EXPORTER
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('FIELD 1 - EXPORTER NAME AND ADDRESS:', 20, yPos);
    doc.setFont(undefined, 'normal');
    yPos += 6;
    doc.text(`${professionalCertificate.exporter?.name || 'TO BE COMPLETED'}`, 20, yPos);
    yPos += 4;
    doc.text(`${professionalCertificate.exporter?.address || 'TO BE COMPLETED'}`, 20, yPos);
    yPos += 4;
    doc.text(`Tax ID: ${professionalCertificate.exporter?.tax_id || 'TO BE COMPLETED'}`, 20, yPos);
    yPos += 4;
    doc.text(`Country: ${professionalCertificate.exporter?.country || 'TO BE COMPLETED'}`, 20, yPos);

    yPos += 10;

    // FIELD 2 - CERTIFIER
    doc.setFont(undefined, 'bold');
    doc.text('FIELD 2 - CERTIFIER:', 20, yPos);
    doc.setFont(undefined, 'normal');
    yPos += 6;
    doc.text(`Type: ${professionalCertificate.certifier?.type || 'Exporter'}`, 20, yPos);
    yPos += 4;
    doc.text(`${professionalCertificate.certifier?.name || professionalCertificate.exporter?.name}`, 20, yPos);
    
    yPos += 10;

    // FIELD 3 - PRODUCER
    doc.setFont(undefined, 'bold');
    doc.text('FIELD 3 - PRODUCER:', 20, yPos);
    doc.setFont(undefined, 'normal');
    yPos += 6;
    doc.text(`${professionalCertificate.producer?.name || 'Same as Exporter'}`, 20, yPos);
    yPos += 4;
    doc.text(`${professionalCertificate.producer?.address || 'Manufacturing Facility'}`, 20, yPos);
    yPos += 4;
    doc.text(`Country: ${professionalCertificate.producer?.country || professionalCertificate.country_of_origin}`, 20, yPos);

    yPos += 10;

    // FIELD 4 - IMPORTER  
    doc.setFont(undefined, 'bold');
    doc.text('FIELD 4 - IMPORTER NAME AND ADDRESS:', 20, yPos);
    doc.setFont(undefined, 'normal');
    yPos += 6;
    doc.text(`${professionalCertificate.importer?.name || 'TO BE COMPLETED'}`, 20, yPos);
    yPos += 4;
    doc.text(`${professionalCertificate.importer?.address || 'TO BE COMPLETED'}`, 20, yPos);
    yPos += 4;
    doc.text(`Tax ID: ${professionalCertificate.importer?.tax_id || 'TO BE COMPLETED'}`, 20, yPos);

    yPos += 10;

    // FIELD 4 - DESCRIPTION OF GOODS
    doc.setFont(undefined, 'bold');
    doc.text('FIELD 4 - DESCRIPTION OF GOOD(S):', 20, yPos);
    doc.setFont(undefined, 'normal');
    yPos += 6;
    doc.text(`HS Code: ${professionalCertificate.hs_classification?.code || professionalCertificate.product?.hs_code || workflowData?.product?.hs_code || 'TO BE VERIFIED'}`, 20, yPos);
    yPos += 4;
    doc.text(`Description: ${professionalCertificate.product?.description || 'TO BE COMPLETED'}`, 20, yPos);

    yPos += 10;

    // FIELD 5 - PREFERENCE CRITERION (now Field 6)
    doc.setFont(undefined, 'bold');
    doc.text('FIELD 6 - PREFERENCE CRITERION:', 20, yPos);
    doc.setFont(undefined, 'normal');
    yPos += 6;
    doc.text(`Criterion: ${professionalCertificate.preference_criterion || 'B'}`, 20, yPos);
    yPos += 4;
    doc.text(`Regional Value Content: ${professionalCertificate.regional_value_content || '100.0%'}`, 20, yPos);

    yPos += 10;

    // FIELD 7 - PRODUCER DECLARATION
    doc.setFont(undefined, 'bold');
    doc.text('FIELD 7 - PRODUCER DECLARATION:', 20, yPos);
    doc.setFont(undefined, 'normal');
    yPos += 6;
    doc.text(`Is Producer: ${professionalCertificate.producer_declaration?.is_producer ? 'YES' : 'NO'}`, 20, yPos);
    yPos += 4;
    doc.text(`Declaration: ${professionalCertificate.producer_declaration?.declaration || 'YES'}`, 20, yPos);

    yPos += 10;

    // FIELD 8 - HS CLASSIFICATION
    doc.setFont(undefined, 'bold');
    doc.text('FIELD 8 - HS CLASSIFICATION:', 20, yPos);
    doc.setFont(undefined, 'normal');
    yPos += 6;
    doc.text(`HS Code: ${professionalCertificate.hs_classification?.code}`, 20, yPos);
    yPos += 4;
    doc.text(`Verified: ${professionalCertificate.hs_classification?.verified ? 'Yes' : 'No'}`, 20, yPos);

    yPos += 10;

    // FIELD 9 - METHOD OF QUALIFICATION
    doc.setFont(undefined, 'bold');
    doc.text('FIELD 9 - METHOD OF QUALIFICATION:', 20, yPos);
    doc.setFont(undefined, 'normal');
    yPos += 6;
    doc.text(`Method: ${professionalCertificate.qualification_method?.method || 'NC'}`, 20, yPos);

    yPos += 10;

    // FIELD 10 - COUNTRY OF ORIGIN
    doc.setFont(undefined, 'bold');
    doc.text('FIELD 10 - COUNTRY OF ORIGIN:', 20, yPos);
    doc.setFont(undefined, 'normal');
    yPos += 6;
    doc.text(`${professionalCertificate.country_of_origin || ''}`, 20, yPos);

    yPos += 10;

    // FIELD 11 - BLANKET PERIOD
    doc.setFont(undefined, 'bold');
    doc.text('FIELD 11 - BLANKET PERIOD:', 20, yPos);
    doc.setFont(undefined, 'normal');
    yPos += 6;
    doc.text(`From: ${professionalCertificate.blanket_period?.start_date || new Date().toISOString().split('T')[0]}`, 20, yPos);
    yPos += 4;
    doc.text(`To: ${professionalCertificate.blanket_period?.end_date || new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0]}`, 20, yPos);

    yPos += 10;

    // FIELD 12 - AUTHORIZED SIGNATURE
    doc.setFont(undefined, 'bold');
    doc.text('FIELD 12 - AUTHORIZED SIGNATURE:', 20, yPos);
    doc.setFont(undefined, 'normal');
    yPos += 6;
    doc.text(`Signatory: ${professionalCertificate.authorization?.signatory_name || 'TO BE COMPLETED'}`, 20, yPos);
    yPos += 4;
    doc.text(`Title: ${professionalCertificate.authorization?.signatory_title || 'TO BE COMPLETED'}`, 20, yPos);
    yPos += 4;
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, yPos);

    // Certification statement
    yPos += 10;
    doc.setFontSize(8);
    const certStatement = 'I certify that the information on this document is true and accurate and I assume responsibility for proving such representations. I further certify that the good(s) qualify as originating under the USMCA.';
    const lines = doc.splitTextToSize(certStatement, 170);
    doc.text(lines, 20, yPos);

    // Footer with trust verification
    yPos = 280;
    doc.text(`Generated by Triangle Intelligence Platform with Trust Verification - ${new Date().toLocaleDateString()}`, 105, yPos, { align: 'center' });
    
    return doc.output('blob');
  };

  const handleDownloadCertificate = async () => {
    if (previewData?.professional_certificate) {
      try {
        // Generate PDF from the exact preview data (what's displayed on screen)
        const pdfBlob = await generatePDFFromCertificate(previewData.professional_certificate);
        
        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = url;
        const certificateNumber = previewData.professional_certificate.certificate_number || 'Certificate';
        a.download = `USMCA_Certificate_${certificateNumber}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Error generating PDF:', error);
        alert('Error downloading certificate. Please try again.');
      }
    } else {
      console.error('No certificate preview available for download');
      alert('Please generate the certificate first');
    }
  };

  const handleEmailToImporter = async (authData) => {
    if (previewData?.professional_certificate && authData?.importer_email) {
      try {
        // Generate PDF (same as download)
        const pdfBlob = await generatePDFFromCertificate(previewData.professional_certificate);
        
        // Auto-download the PDF so user can attach it
        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = url;
        const certificateNumber = previewData.professional_certificate.certificate_number || 'Certificate';
        a.download = `USMCA_Certificate_${certificateNumber}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // Open email client
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
          <div className="card">
            <h1 className="card-title">USMCA Certificate Authorization</h1>
            <div className="text-body">Loading workflow data...</div>
            <p className="text-body">Please complete the USMCA workflow first or provide data via URL parameters.</p>
          </div>
        </div>
      </TriangleLayout>
    );
  }

  return (
    <TriangleLayout>
      <div className="dashboard-container">
        <div className="element-spacing">
          <div className="card">
            <div className="card-header">
              <h1 className="card-title">USMCA Certificate Authorization</h1>
              <div className="text-body">Complete authorization details and generate your certificate</div>
            </div>
          </div>
        </div>

        <div className="card">
          <AuthorizationStep 
            formData={certificateData.authorization || {}}
            updateFormData={(field, value) => updateCertificateData('authorization', { [field]: value })}
            workflowData={workflowData}
            certificateData={certificateData}
            onGenerateCertificate={handleGenerateCertificate}
            onPreviewCertificate={handlePreviewCertificate}
            onDownloadCertificate={handleDownloadCertificate}
            onEmailToImporter={handleEmailToImporter}
            previewData={previewData}
            generatedPDF={generatedPDF}
          />
        </div>

        {/* Preview is now fully handled within AuthorizationStep */}
      </div>
    </TriangleLayout>
  );
}