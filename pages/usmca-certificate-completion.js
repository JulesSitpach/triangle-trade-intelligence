/**
 * USMCA Certificate Completion Page
 * Dedicated page for professional certificate completion with global styling
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import CompanyInfoStep from '../components/workflow/CompanyInfoStep';
import ProductDetailsStep from '../components/workflow/ProductDetailsStep';
import SupplyChainStep from '../components/workflow/SupplyChainStep';
// Icons removed - using text alternatives

const CERTIFICATE_STEPS = [
  {
    id: 'company_info',
    title: 'Company Information',
    description: 'Complete exporter and importer details',
    required: true
  },
  {
    id: 'product_details', 
    title: 'Product Details',
    description: 'Verify HS classification and product description',
    required: true
  },
  {
    id: 'supply_chain',
    title: 'Supply Chain',
    description: 'Interactive component origin calculator',
    required: true
  },
  {
    id: 'authorization',
    title: 'Authorization',
    description: 'Digital signature and authorized signatory',
    required: true
  },
  {
    id: 'review_generate',
    title: 'Review & Generate',
    description: 'Final review and PDF certificate generation',
    required: true
  }
];

export default function USMCACertificateCompletion() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [certificateData, setCertificateData] = useState({
    company_info: {},
    product_details: {},
    supply_chain: {},
    authorization: {},
    blanket_period: {
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0]
    }
  });
  
  const [stepValidation, setStepValidation] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);

  // Load initial data from URL params or session storage
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const dataParam = urlParams.get('data');
    
    if (dataParam) {
      try {
        const initialData = JSON.parse(decodeURIComponent(dataParam));
        setCertificateData(prev => ({
          ...prev,
          ...initialData,
          // Map workflow results to certificate format
          product_details: {
            hs_code: initialData.product?.hs_code || '',
            commercial_description: initialData.product?.product_description || '',
            preference_criterion: initialData.certificate?.preference_criterion || 'B'
          },
          company_info: {
            exporter_name: initialData.company?.name || '',
            exporter_business_type: initialData.company?.business_type || ''
          }
        }));
      } catch (error) {
        console.error('Error parsing initial data:', error);
      }
    }
  }, []);

  const updateCertificateData = (section, data) => {
    setCertificateData(prev => ({
      ...prev,
      [section]: { ...prev[section], ...data }
    }));
  };

  const validateStep = (stepIndex) => {
    const step = CERTIFICATE_STEPS[stepIndex];
    let isValid = false;
    let errors = [];

    switch (step.id) {
      case 'company_info':
        isValid = certificateData.company_info?.exporter_name && 
                 certificateData.company_info?.importer_name;
        if (!isValid) errors.push('Exporter and importer information required');
        break;
      case 'product_details':
        isValid = certificateData.product_details?.hs_code && 
                 certificateData.product_details?.commercial_description;
        if (!isValid) errors.push('HS code and product description required');
        break;
      case 'supply_chain':
        isValid = certificateData.supply_chain?.manufacturing_location;
        if (!isValid) errors.push('Manufacturing location required');
        break;
      case 'authorization':
        isValid = certificateData.authorization?.signatory_name && 
                 certificateData.authorization?.signatory_title;
        if (!isValid) errors.push('Authorized signatory information required');
        break;
      default:
        isValid = true;
    }

    setStepValidation(prev => ({
      ...prev,
      [stepIndex]: { valid: isValid, errors }
    }));

    return isValid;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, CERTIFICATE_STEPS.length - 1));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleGenerateCertificate = async () => {
    setIsGenerating(true);
    try {
      // Generate PDF certificate
      const pdfBlob = await generatePDFCertificate(certificateData);
      
      // Download the PDF
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `USMCA_Certificate_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      // Redirect back to results or dashboard
      router.push('/dashboard?success=certificate-generated');
      
    } catch (error) {
      console.error('Certificate generation error:', error);
      alert('Error generating certificate. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const generatePDFCertificate = async (certificateData) => {
    // Dynamic import to avoid SSR issues
    const jsPDFModule = await import('jspdf');
    const jsPDF = jsPDFModule.default || jsPDFModule;
    
    const doc = new jsPDF();
    
    // Set document properties
    doc.setProperties({
      title: 'USMCA Certificate of Origin',
      subject: 'Official USMCA Certificate of Origin',
      author: 'Triangle Intelligence Platform'
    });

    // Header
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('UNITED STATES-MEXICO-CANADA AGREEMENT', 105, 20, { align: 'center' });
    doc.text('CERTIFICATE OF ORIGIN', 105, 30, { align: 'center' });
    
    // Certificate details
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Certificate Number: ${new Date().getTime()}`, 20, 45);
    doc.text(`Issue Date: ${new Date().toLocaleDateString()}`, 20, 52);
    doc.text(`Valid From: ${certificateData.blanket_period?.start_date}`, 20, 59);
    doc.text(`Valid Until: ${certificateData.blanket_period?.end_date}`, 20, 66);

    // Add certificate fields with actual data
    let yPos = 80;
    
    // Field 1 - Exporter Information
    doc.setFont(undefined, 'bold');
    doc.text('FIELD 1 - EXPORTER INFORMATION', 20, yPos);
    doc.setFont(undefined, 'normal');
    yPos += 8;
    doc.text(`Name: ${certificateData.company_info?.exporter_name}`, 20, yPos);
    yPos += 6;
    doc.text(`Address: ${certificateData.company_info?.exporter_address || 'Not provided'}`, 20, yPos);
    yPos += 6;
    doc.text(`Tax ID: ${certificateData.company_info?.exporter_tax_id || 'Not provided'}`, 20, yPos);

    // Field 2 - Importer Information
    yPos += 15;
    doc.setFont(undefined, 'bold');
    doc.text('FIELD 2 - IMPORTER INFORMATION', 20, yPos);
    doc.setFont(undefined, 'normal');
    yPos += 8;
    doc.text(`Name: ${certificateData.company_info?.importer_name}`, 20, yPos);
    yPos += 6;
    doc.text(`Address: ${certificateData.company_info?.importer_address || 'Not provided'}`, 20, yPos);

    // Field 3 - Product Information
    yPos += 15;
    doc.setFont(undefined, 'bold');
    doc.text('FIELD 3 - PRODUCT INFORMATION', 20, yPos);
    doc.setFont(undefined, 'normal');
    yPos += 8;
    doc.text(`HS Code: ${certificateData.product_details?.hs_code}`, 20, yPos);
    yPos += 6;
    const description = certificateData.product_details?.commercial_description;
    const splitDescription = doc.splitTextToSize(description, 170);
    doc.text(splitDescription, 20, yPos);
    yPos += splitDescription.length * 6;
    doc.text(`Origin Criterion: ${certificateData.product_details?.preference_criterion}`, 20, yPos);

    // Authorization
    yPos += 20;
    doc.setFont(undefined, 'bold');
    doc.text('FIELD 5 - AUTHORIZED SIGNATURE', 20, yPos);
    doc.setFont(undefined, 'normal');
    yPos += 8;
    doc.text(`Signatory: ${certificateData.authorization?.signatory_name}`, 20, yPos);
    yPos += 6;
    doc.text(`Title: ${certificateData.authorization?.signatory_title}`, 20, yPos);
    yPos += 6;
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, yPos);

    // Footer
    doc.setFontSize(8);
    doc.text('Generated by Triangle Intelligence Platform', 105, 280, { align: 'center' });
    
    return doc.output('blob');
  };

  const renderStepContent = () => {
    const step = CERTIFICATE_STEPS[currentStep];
    
    switch (step.id) {
      case 'company_info':
        return (
          <CompanyInfoStep
            data={certificateData.company_info || {}}
            onChange={(field, value) => updateCertificateData('company_info', { [field]: value })}
            validation={{ errors: [] }}
          />
        );
      case 'product_details':
        return (
          <ProductDetailsStep
            data={certificateData.product_details || {}}
            onChange={(field, value) => updateCertificateData('product_details', { [field]: value })}
            validation={{ errors: [] }}
          />
        );
      case 'supply_chain':
        return (
          <SupplyChainStep
            data={certificateData.supply_chain || {}}
            onChange={(field, value) => updateCertificateData('supply_chain', { [field]: value })}
            validation={{ errors: [] }}
          />
        );
      case 'authorization':
        return <AuthorizationStep 
          formData={certificateData.authorization || {}}
          updateFormData={(field, value) => updateCertificateData('authorization', { [field]: value })}
        />;
      case 'review_generate':
        return <ReviewStep certificateData={certificateData} onGenerate={handleGenerateCertificate} isGenerating={isGenerating} />;
      default:
        return <div>Step content</div>;
    }
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="element-spacing">
        <div className="card">
          <div className="card-header">
            <div className="header-actions">
              <span className="text-body">🛡️</span>
              <h1 className="card-title">USMCA Certificate Completion</h1>
            </div>
            <button 
              onClick={() => router.back()}
              className="btn-secondary"
            >
              ← Back to Results
            </button>
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="element-spacing">
        <div className="card">
          <div className="status-grid">
            {CERTIFICATE_STEPS.map((step, index) => {
              const isCompleted = stepValidation[index]?.valid;
              const isCurrent = index === currentStep;
              
              return (
                <div key={step.id} className={`status-card ${isCurrent ? 'success' : isCompleted ? 'info' : ''}`}>
                  <div className="header-actions">
                    <div>
                      <div className="status-label">{step.title}</div>
                      <div className="text-body">{step.description}</div>
                    </div>
                    {isCompleted && <span className="status-label">✓</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="element-spacing">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">{CERTIFICATE_STEPS[currentStep].title}</h2>
          </div>
          
          {stepValidation[currentStep]?.errors?.length > 0 && (
            <div className="alert alert-error">
              <div className="alert-content">
                <div className="alert-title">Please complete required fields:</div>
                <ul>
                  {stepValidation[currentStep].errors.map((error, idx) => (
                    <li key={idx} className="text-body">• {error}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          
          <div className="element-spacing">
            {renderStepContent()}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="element-spacing">
        <div className="card">
          <div className="hero-buttons">
            <button 
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="btn-secondary"
            >
              ← Previous
            </button>
            
            {currentStep < CERTIFICATE_STEPS.length - 1 ? (
              <button 
                onClick={handleNext}
                className="btn-primary"
              >
                Next →
              </button>
            ) : (
              <button 
                onClick={handleGenerateCertificate}
                disabled={isGenerating}
                className="btn-primary"
              >
                {isGenerating ? 'Generating...' : 'Generate Certificate'}
                <span className="text-body">📄</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Authorization Step Component
function AuthorizationStep({ formData, updateFormData }) {
  return (
    <div className="form-section">
      <div className="form-grid-2">
        <div className="form-group">
          <label className="form-label">Authorized Signatory Name *</label>
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
          <label className="form-label">Title/Position *</label>
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
      
      <div className="alert alert-info">
        <div className="alert-content">
          <div className="alert-title">Authorization Declaration</div>
          <div className="text-body">
            By completing this section, the authorized signatory certifies that the goods described 
            qualify as originating under the USMCA and that the information is true and accurate.
          </div>
        </div>
      </div>
    </div>
  );
}

// Review Step Component
function ReviewStep({ certificateData, onGenerate, isGenerating }) {
  return (
    <div className="element-spacing">
      <div className="alert alert-success">
        <div className="alert-content">
          <div className="alert-title">Certificate Ready for Generation</div>
          <div className="text-body">
            Review the information below and click "Generate Certificate" to create your official USMCA Certificate of Origin.
          </div>
        </div>
      </div>
      
      <div className="status-grid">
        <div className="status-card">
          <div className="status-label">Exporter</div>
          <div className="status-value">{certificateData.company_info?.exporter_name}</div>
        </div>
        <div className="status-card">
          <div className="status-label">Importer</div>
          <div className="status-value">{certificateData.company_info?.importer_name}</div>
        </div>
        <div className="status-card">
          <div className="status-label">HS Code</div>
          <div className="status-value">{certificateData.product_details?.hs_code}</div>
        </div>
        <div className="status-card">
          <div className="status-label">Signatory</div>
          <div className="status-value">{certificateData.authorization?.signatory_name}</div>
        </div>
      </div>
      
      <div className="alert alert-warning">
        <div className="alert-content">
          <div className="alert-title">Important Notice</div>
          <div className="text-body">
            This certificate is generated based on the information provided. Please ensure all details 
            are accurate before submitting to customs authorities.
          </div>
        </div>
      </div>
    </div>
  );
}