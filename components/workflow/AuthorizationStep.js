/**
 * Authorization Step - Step 4: Authorization and Certificate Generation
 * Collects authorized signatory information and importer details
 * Enhanced with AI agent validation at submission point
 */

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';

export default function AuthorizationStep({ formData, updateFormData, workflowData, certificateData, onGenerateCertificate, onPreviewCertificate, onDownloadCertificate, onEmailToImporter, previewData, generatedPDF, userTier = 'Trial' }) {
  const router = useRouter();
  const previewRef = useRef(null);
  const [authData, setAuthData] = useState({
    // Authorized Signatory Information (NEW DATA COLLECTION)
    signatory_name: '',
    signatory_title: '',
    signatory_email: '',
    signatory_phone: '',

    // Authorization checkboxes
    accuracy_certification: false,
    authority_certification: false,
    ...formData
  });

  // 🎯 Collapsible sections state
  const [expandedSections, setExpandedSections] = useState({
    exporter: false,
    importer: false,
    producer: false
  });

  // Agent orchestration removed - was causing excessive AI calls on every field change

  // 🚀 AUTO-FILL COMPANY DATA ON MOUNT (so user doesn't have to manually check box)
  useEffect(() => {
    if (workflowData?.company && !authData.exporter_same_as_company) {
      console.log('📋 Auto-filling company data from workflow:', workflowData.company);
      setAuthData(prev => ({
        ...prev,
        exporter_same_as_company: true,  // Check the box automatically
        exporter_name: workflowData.company.name || workflowData.company.company_name || '',
        exporter_address: workflowData.company.company_address || '',
        exporter_tax_id: workflowData.company.tax_id || '',
        exporter_phone: workflowData.company.contact_phone || '',
        exporter_email: workflowData.company.contact_email || '',
        exporter_country: workflowData.company.company_country || ''
      }));
    }
  }, [workflowData]); // Run when workflowData is available

  // 🎯 AUTO-EXPAND SECTIONS BASED ON CERTIFIER TYPE
  useEffect(() => {
    if (authData.certifier_type) {
      console.log('🎯 Auto-expanding sections for certifier type:', authData.certifier_type);

      // Collapse all first
      const newExpanded = {
        exporter: false,
        importer: false,
        producer: false
      };

      // Expand relevant sections based on certifier type
      if (authData.certifier_type === 'IMPORTER') {
        // IMPORTER certificate: Only need importer info (you're the buyer)
        newExpanded.importer = true;
      } else if (authData.certifier_type === 'EXPORTER') {
        // EXPORTER certificate: Only need importer (your customer)
        // Exporter fields auto-filled from Step 1 company data (no UI needed)
        newExpanded.importer = true;
      } else if (authData.certifier_type === 'PRODUCER') {
        // PRODUCER certificate: Only need importer (your customer)
        // Exporter + Producer fields auto-filled from Step 1 company data (no UI needed)
        newExpanded.importer = true;
      }

      setExpandedSections(newExpanded);
    }
  }, [authData.certifier_type]); // Run when certifier type changes

  // Update parent when authData changes
  useEffect(() => {
    Object.keys(authData).forEach(key => {
      updateFormData(key, authData[key]);
    });
  }, [authData]);

  // Auto-check certification boxes when certificate is generated
  useEffect(() => {
    if (previewData && previewData.professional_certificate) {
      // Automatically check both certification boxes once certificate is successfully generated
      if (!authData.accuracy_certification || !authData.authority_certification) {
        setAuthData(prev => ({
          ...prev,
          accuracy_certification: true,
          authority_certification: true
        }));
      }
    }
  }, [previewData]);

  // Auto-scroll to certificate preview when generated
  useEffect(() => {
    if (previewData && previewData.professional_certificate && previewRef.current) {
      // Scroll to preview with smooth animation
      previewRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }, [previewData]);

  const handleFieldChange = (field, value) => {
    setAuthData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSetUpAlerts = () => {
    console.log('🚨 ========== SETTING UP TRADE ALERTS FROM CERTIFICATE ==========');
    console.log('📊 Certificate data structure:', {
      has_workflow_data: !!workflowData,
      has_certificate_data: !!certificateData,
      has_preview_data: !!previewData,
      component_origins: workflowData?.component_origins || workflowData?.components || certificateData?.analysis_results?.component_breakdown
    });

    // Prepare complete workflow data for AI vulnerability analysis
    const alertData = {
      company: {
        name: workflowData?.company?.name || workflowData?.company?.company_name || previewData?.professional_certificate?.exporter?.name,
        company_name: workflowData?.company?.name || workflowData?.company?.company_name || previewData?.professional_certificate?.exporter?.name,
        business_type: workflowData?.company?.business_type,
        trade_volume: workflowData?.company?.trade_volume,
        annual_trade_volume: workflowData?.company?.trade_volume,
        company_country: workflowData?.company?.company_country  // FIX: Include country for certificate generation
      },
      product: {
        hs_code: workflowData?.product?.hs_code || previewData?.professional_certificate?.hs_classification?.code,
        description: workflowData?.product?.description || workflowData?.product?.product_description || previewData?.professional_certificate?.product?.description,
        product_description: workflowData?.product?.description || workflowData?.product?.product_description || previewData?.professional_certificate?.product?.description
      },
      usmca: {
        qualified: workflowData?.usmca?.qualified || certificateData?.analysis_results?.qualification_status === 'QUALIFIED',
        qualification_status: workflowData?.usmca?.qualified || certificateData?.analysis_results?.qualification_status === 'QUALIFIED' ? 'QUALIFIED' : 'NOT_QUALIFIED',
        north_american_content: workflowData?.usmca?.north_american_content || workflowData?.usmca?.regional_content || certificateData?.analysis_results?.regional_content,
        threshold_applied: workflowData?.usmca?.threshold_applied,
        gap: workflowData?.usmca?.gap || 0
      },
      component_origins: workflowData?.component_origins || workflowData?.components || certificateData?.analysis_results?.component_breakdown || [],
      components: workflowData?.component_origins || workflowData?.components || certificateData?.analysis_results?.component_breakdown || [],
      savings: {
        total_savings: workflowData?.savings?.annual_savings || 0,
        annual_savings: workflowData?.savings?.annual_savings || 0
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

  const titleOptions = [
    'President',
    'Export Manager', 
    'Compliance Officer',
    'Trade Director',
    'Supply Chain Manager',
    'Operations Manager',
    'General Manager',
    'Director of Trade',
    'Customs Manager'
  ];

  // Get company name from workflow data for certification text
  const companyName = workflowData?.company?.name || 'this company';

  // Toggle section expansion
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Collapsible Section Header Component
  const CollapsibleSectionHeader = ({ title, description, sectionKey, icon }) => (
    <div
      onClick={() => toggleSection(sectionKey)}
      style={{
        cursor: 'pointer',
        padding: '1rem',
        backgroundColor: expandedSections[sectionKey] ? '#eff6ff' : '#f9fafb',
        border: '2px solid' + (expandedSections[sectionKey] ? '#3b82f6' : '#e5e7eb'),
        borderRadius: '8px',
        marginBottom: expandedSections[sectionKey] ? '1rem' : '0',
        transition: 'all 0.2s'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 className="form-section-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {icon} {title}
          </h2>
          <p className="form-section-description" style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem' }}>
            {description}
          </p>
        </div>
        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#6b7280' }}>
          {expandedSections[sectionKey] ? '▼' : '▶'}
        </div>
      </div>
    </div>
  );

  return (
    <div className="element-spacing">
      {/* 0. Certifier Type Selection - CRITICAL FOR USMCA CERTIFICATE */}
      <div className="form-section">
        <h2 className="form-section-title">🎯 Who is Completing This Certificate?</h2>
        <p className="form-section-description">
          Select your role in this transaction. This determines which fields appear on the USMCA certificate.
        </p>

        <div className="form-group">
          <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
            <label className="checkbox-item" style={{display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '1rem', border: '2px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer', backgroundColor: authData.certifier_type === 'IMPORTER' ? '#eff6ff' : 'transparent'}}>
              <input
                type="radio"
                name="certifier_type"
                value="IMPORTER"
                checked={authData.certifier_type === 'IMPORTER'}
                onChange={(e) => handleFieldChange('certifier_type', e.target.value)}
                style={{marginTop: '0.25rem'}}
              />
              <div>
                <div style={{fontWeight: '600', marginBottom: '0.25rem'}}>IMPORTER</div>
                <div style={{fontSize: '0.875rem', color: '#6b7280'}}>
                  I am the company receiving these goods (the buyer/importing company)
                </div>
              </div>
            </label>

            <label className="checkbox-item" style={{display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '1rem', border: '2px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer', backgroundColor: authData.certifier_type === 'EXPORTER' ? '#eff6ff' : 'transparent'}}>
              <input
                type="radio"
                name="certifier_type"
                value="EXPORTER"
                checked={authData.certifier_type === 'EXPORTER'}
                onChange={(e) => handleFieldChange('certifier_type', e.target.value)}
                style={{marginTop: '0.25rem'}}
              />
              <div>
                <div style={{fontWeight: '600', marginBottom: '0.25rem'}}>EXPORTER</div>
                <div style={{fontSize: '0.875rem', color: '#6b7280'}}>
                  I am the company sending these goods (the seller/exporting company)
                </div>
              </div>
            </label>

            <label className="checkbox-item" style={{display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '1rem', border: '2px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer', backgroundColor: authData.certifier_type === 'PRODUCER' ? '#eff6ff' : 'transparent'}}>
              <input
                type="radio"
                name="certifier_type"
                value="PRODUCER"
                checked={authData.certifier_type === 'PRODUCER'}
                onChange={(e) => handleFieldChange('certifier_type', e.target.value)}
                style={{marginTop: '0.25rem'}}
              />
              <div>
                <div style={{fontWeight: '600', marginBottom: '0.25rem'}}>PRODUCER</div>
                <div style={{fontSize: '0.875rem', color: '#6b7280'}}>
                  I am the company that manufactures these goods (the producer/manufacturer)
                </div>
              </div>
            </label>
          </div>
        </div>

        {!authData.certifier_type && (
          <div style={{padding: '1rem', backgroundColor: '#fef3c7', borderRadius: '6px', marginTop: '1rem'}}>
            <strong>⚠️ Required:</strong> Please select who is completing this certificate before continuing.
          </div>
        )}
      </div>

      {/* 1. Authorization Section - NEW DATA COLLECTION */}
      <div className="form-section">
        <h2 className="form-section-title">📝 Certificate Authorization</h2>
        <p className="form-section-description">Authorized Signatory Information</p>

        <div className="form-grid-2">
          <div className="form-group">
            <label className="form-label required">Full Name</label>
            <input
              type="text"
              className="form-input"
              value={authData.signatory_name}
              onChange={(e) => handleFieldChange('signatory_name', e.target.value)}
              placeholder="Enter full name of authorized signatory"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label required">Title/Position</label>
            <select
              className="form-select"
              value={authData.signatory_title}
              onChange={(e) => handleFieldChange('signatory_title', e.target.value)}
              required
            >
              <option value="">Select title/position</option>
              {titleOptions.map(title => (
                <option key={title} value={title}>{title}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label required">Email</label>
            <input
              type="email"
              className="form-input"
              value={authData.signatory_email}
              onChange={(e) => handleFieldChange('signatory_email', e.target.value)}
              placeholder="signatory@company.com"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label required">Phone</label>
            <input
              type="tel"
              className="form-input"
              value={authData.signatory_phone}
              onChange={(e) => handleFieldChange('signatory_phone', e.target.value)}
              placeholder="(555) 123-4567"
              required
            />
          </div>
        </div>
      </div>

      {/* 2. Exporter Information */}
      <div className="form-section">
        <CollapsibleSectionHeader
          title="Exporter Details"
          description="Information about the company sending/exporting the goods"
          sectionKey="exporter"
          icon="📤"
        />

        {expandedSections.exporter && (
          <>
        {/* Checkbox to indicate if Exporter is same as your company */}
        <div className="form-group" style={{marginBottom: '1.5rem'}}>
          <label className="checkbox-item" style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
            <input
              type="checkbox"
              checked={authData.exporter_same_as_company || false}
              onChange={(e) => {
                handleFieldChange('exporter_same_as_company', e.target.checked);
                // Auto-populate exporter fields from company data if checked
                if (e.target.checked) {
                  handleFieldChange('exporter_name', workflowData?.company?.name || '');
                  handleFieldChange('exporter_address', workflowData?.company?.company_address || '');
                  handleFieldChange('exporter_tax_id', workflowData?.company?.tax_id || '');
                  handleFieldChange('exporter_phone', workflowData?.company?.contact_phone || '');
                  handleFieldChange('exporter_email', workflowData?.company?.contact_email || '');
                  handleFieldChange('exporter_country', workflowData?.company?.company_country || '');
                } else {
                  // Clear fields if unchecked
                  handleFieldChange('exporter_name', '');
                  handleFieldChange('exporter_address', '');
                  handleFieldChange('exporter_tax_id', '');
                  handleFieldChange('exporter_phone', '');
                  handleFieldChange('exporter_email', '');
                  handleFieldChange('exporter_country', '');
                }
              }}
            />
            <span className="checkbox-text">
              Exporter is my company (auto-fill with company information from Step 1)
            </span>
          </label>
        </div>

        <div className="form-grid-2">
          <div className="form-group">
            <label className="form-label required">Company Name</label>
            <input
              type="text"
              className="form-input"
              value={authData.exporter_name || ''}
              onChange={(e) => handleFieldChange('exporter_name', e.target.value)}
              placeholder="Enter exporting company name"
              required
              disabled={authData.exporter_same_as_company}
            />
          </div>

          <div className="form-group">
            <label className="form-label required">Address</label>
            <textarea
              className="form-input"
              value={authData.exporter_address || ''}
              onChange={(e) => handleFieldChange('exporter_address', e.target.value)}
              placeholder="Complete address including street, city, state/province, postal code"
              rows="3"
              required
              disabled={authData.exporter_same_as_company}
            />
          </div>

          <div className="form-group">
            <label className="form-label required">Tax ID/EIN</label>
            <input
              type="text"
              className="form-input"
              value={authData.exporter_tax_id || ''}
              onChange={(e) => handleFieldChange('exporter_tax_id', e.target.value)}
              placeholder="Enter exporter's tax identification number"
              required
              disabled={authData.exporter_same_as_company}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Contact Person</label>
            <input
              type="text"
              className="form-input"
              value={authData.exporter_contact_person || ''}
              onChange={(e) => handleFieldChange('exporter_contact_person', e.target.value)}
              placeholder="Primary contact at exporting company"
              disabled={authData.exporter_same_as_company}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Phone</label>
            <input
              type="tel"
              className="form-input"
              value={authData.exporter_phone || ''}
              onChange={(e) => handleFieldChange('exporter_phone', e.target.value)}
              placeholder="(555) 123-4567"
              disabled={authData.exporter_same_as_company}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              value={authData.exporter_email || ''}
              onChange={(e) => handleFieldChange('exporter_email', e.target.value)}
              placeholder="contact@exporter.com"
              disabled={authData.exporter_same_as_company}
            />
          </div>

          <div className="form-group">
            <label className="form-label required">Country</label>
            <select
              className="form-select"
              value={authData.exporter_country || ''}
              onChange={(e) => handleFieldChange('exporter_country', e.target.value)}
              required
              disabled={authData.exporter_same_as_company}
            >
              <option value="">Select country</option>
              <option value="United States">United States</option>
              <option value="Canada">Canada</option>
              <option value="Mexico">Mexico</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
          </>
        )}
      </div>

      {/* 3. Importer Information */}
      <div className="form-section">
        <CollapsibleSectionHeader
          title="Importer Details"
          description="Information about your customer (the importing company)"
          sectionKey="importer"
          icon="📥"
        />

        {expandedSections.importer && (
          <>

        <div className="form-grid-2">
          <div className="form-group">
            <label className="form-label required">Company Name</label>
            <input
              type="text"
              className="form-input"
              value={authData.importer_name || ''}
              onChange={(e) => handleFieldChange('importer_name', e.target.value)}
              placeholder="Enter importing company name"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label required">Address</label>
            <textarea
              className="form-input"
              value={authData.importer_address || ''}
              onChange={(e) => handleFieldChange('importer_address', e.target.value)}
              placeholder="Complete address including street, city, state/province, postal code"
              rows="3"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label required">Tax ID/EIN</label>
            <input
              type="text"
              className="form-input"
              value={authData.importer_tax_id || ''}
              onChange={(e) => handleFieldChange('importer_tax_id', e.target.value)}
              placeholder="Enter importer's tax identification number"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Contact Person</label>
            <input
              type="text"
              className="form-input"
              value={authData.importer_contact_person || ''}
              onChange={(e) => handleFieldChange('importer_contact_person', e.target.value)}
              placeholder="Primary contact at importing company"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Phone</label>
            <input
              type="tel"
              className="form-input"
              value={authData.importer_phone || ''}
              onChange={(e) => handleFieldChange('importer_phone', e.target.value)}
              placeholder="(555) 123-4567"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              value={authData.importer_email || ''}
              onChange={(e) => handleFieldChange('importer_email', e.target.value)}
              placeholder="contact@importer.com"
            />
          </div>

          <div className="form-group">
            <label className="form-label required">Country</label>
            <select
              className="form-select"
              value={authData.importer_country || ''}
              onChange={(e) => handleFieldChange('importer_country', e.target.value)}
              required
            >
              <option value="">Select country</option>
              <option value="United States">United States</option>
              <option value="Canada">Canada</option>
              <option value="Mexico">Mexico</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
          </>
        )}
      </div>

      {/* 3. Producer Information - NEW SECTION PER CRISTINA'S FEEDBACK */}
      <div className="form-section">
        <CollapsibleSectionHeader
          title="Producer Details"
          description="Information about the company that manufactures/produces the goods"
          sectionKey="producer"
          icon="🏭"
        />

        {expandedSections.producer && (
          <>
        {/* Checkbox to indicate if Producer is same as Exporter */}
        <div className="form-group" style={{marginBottom: '1.5rem'}}>
          <label className="checkbox-item" style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
            <input
              type="checkbox"
              checked={authData.producer_same_as_exporter || false}
              onChange={(e) => {
                handleFieldChange('producer_same_as_exporter', e.target.checked);
                // Clear producer fields if same as exporter
                if (e.target.checked) {
                  handleFieldChange('producer_name', '');
                  handleFieldChange('producer_address', '');
                  handleFieldChange('producer_tax_id', '');
                  handleFieldChange('producer_phone', '');
                  handleFieldChange('producer_email', '');
                  handleFieldChange('producer_country', '');
                }
              }}
            />
            <span className="checkbox-text">
              Producer is the same as Exporter (check this if your company manufactures the goods)
            </span>
          </label>
        </div>

        {/* Only show producer fields if NOT same as exporter */}
        {!authData.producer_same_as_exporter && (
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label required">Producer Company Name</label>
              <input
                type="text"
                className="form-input"
                value={authData.producer_name || ''}
                onChange={(e) => handleFieldChange('producer_name', e.target.value)}
                placeholder="Enter manufacturing company name"
                required={!authData.producer_same_as_exporter}
              />
            </div>

            <div className="form-group">
              <label className="form-label required">Producer Address</label>
              <textarea
                className="form-input"
                value={authData.producer_address || ''}
                onChange={(e) => handleFieldChange('producer_address', e.target.value)}
                placeholder="Complete address including street, city, state/province, postal code"
                rows="3"
                required={!authData.producer_same_as_exporter}
              />
            </div>

            <div className="form-group">
              <label className="form-label required">Producer Tax ID</label>
              <input
                type="text"
                className="form-input"
                value={authData.producer_tax_id || ''}
                onChange={(e) => handleFieldChange('producer_tax_id', e.target.value)}
                placeholder="Enter producer's tax identification number"
                required={!authData.producer_same_as_exporter}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Producer Phone</label>
              <input
                type="tel"
                className="form-input"
                value={authData.producer_phone || ''}
                onChange={(e) => handleFieldChange('producer_phone', e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Producer Email</label>
              <input
                type="email"
                className="form-input"
                value={authData.producer_email || ''}
                onChange={(e) => handleFieldChange('producer_email', e.target.value)}
                placeholder="contact@producer.com"
              />
            </div>

            <div className="form-group">
              <label className="form-label required">Producer Country</label>
              <select
                className="form-select"
                value={authData.producer_country || ''}
                onChange={(e) => handleFieldChange('producer_country', e.target.value)}
                required={!authData.producer_same_as_exporter}
              >
                <option value="">Select country</option>
                <option value="United States">United States</option>
                <option value="Canada">Canada</option>
                <option value="Mexico">Mexico</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        )}

        {authData.producer_same_as_exporter && (
          <div className="alert alert-info">
            <div className="alert-content">
              <div className="text-body">
                ✓ Producer information will be automatically filled with your company (exporter) details.
              </div>
            </div>
          </div>
        )}
          </>
        )}
      </div>

      {/* 4. Digital Signature & Certification */}
      <div className="form-section">
        <h2 className="form-section-title">✍️ Digital Signature</h2>
        <p className="form-section-description">
          Please certify the accuracy of the information before generating your certificate
        </p>

        <div className="checkbox-group" style={{marginBottom: '1.5rem'}}>
          <label className="checkbox-item" style={{display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '1rem'}}>
            <input
              type="checkbox"
              checked={authData.accuracy_certification}
              onChange={(e) => handleFieldChange('accuracy_certification', e.target.checked)}
              required
              style={{marginTop: '0.25rem'}}
            />
            <span className="checkbox-text" style={{flex: 1}}>
              I certify that the information provided is true and accurate
            </span>
          </label>

          <label className="checkbox-item" style={{display: 'flex', alignItems: 'flex-start', gap: '0.75rem'}}>
            <input
              type="checkbox"
              checked={authData.authority_certification}
              onChange={(e) => handleFieldChange('authority_certification', e.target.checked)}
              required
              style={{marginTop: '0.25rem'}}
            />
            <span className="checkbox-text" style={{flex: 1}}>
              I am authorized to sign this certificate on behalf of {companyName}
            </span>
          </label>
        </div>

        <div className="alert alert-info" style={{marginBottom: '1.5rem'}}>
          <div className="alert-content">
            <div className="alert-title">Certification Statement</div>
            <div className="text-body">
              "I certify that the goods described in this certificate qualify as originating goods
              under the USMCA and that the information contained herein is true and accurate."
            </div>
          </div>
        </div>

        <button
          className="btn-primary"
          disabled={!authData.importer_name || !authData.accuracy_certification || !authData.authority_certification}
          onClick={() => onPreviewCertificate && onPreviewCertificate(authData)}
        >
          📄 Generate & Preview Certificate
        </button>
      </div>

      {/* 4. Certificate Preview */}
      <div className="form-section">
        <h2 className="form-section-title">📋 Certificate Preview</h2>
        <p className="form-section-description">
          Review the information that will appear on your USMCA Certificate of Origin
        </p>

        {/* Certificate Preview Window - Shows professional certificate when generated */}
        {previewData && previewData.professional_certificate ? (
            <div className="element-spacing" ref={previewRef}>
              <div className="alert alert-success">
                <div className="alert-content">
                  <div className="alert-title">✅ Official USMCA Certificate Generated</div>
                  <div className="text-body">
                    Certificate #{previewData.professional_certificate.certificate_number} | Trust Score: {(previewData.professional_certificate.trust_verification?.overall_trust_score * 100).toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Official USMCA Certificate - Matching PDF Template */}
              <div style={{position: 'relative'}}>
                {/* Watermark Overlay for Trial Users */}
                {userTier === 'Trial' && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'none',
                    zIndex: 10
                  }}>
                    <div style={{
                      transform: 'rotate(-45deg)',
                      fontSize: '72px',
                      fontWeight: 'bold',
                      color: 'rgba(220, 38, 38, 0.15)',
                      textAlign: 'center',
                      userSelect: 'none'
                    }}>
                      TRIAL PREVIEW
                      <div style={{fontSize: '36px', marginTop: '10px'}}>
                        SUBSCRIBE TO DOWNLOAD
                      </div>
                    </div>
                  </div>
                )}

                <div style={{
                  border: '3px solid #000',
                  backgroundColor: '#ffffff',
                  fontFamily: 'Arial, sans-serif',
                  fontSize: '11px',
                  maxWidth: '850px',
                  margin: '0 auto'
                }}>
                {/* Trial Banner */}
                {userTier === 'Trial' && (
                  <div style={{
                    backgroundColor: '#dc2626',
                    color: '#ffffff',
                    textAlign: 'center',
                    padding: '8px',
                    fontWeight: 'bold',
                    fontSize: '12px'
                  }}>
                    ⚠️ FREE TRIAL PREVIEW - Not valid for customs submissions - Subscribe to download official certificate
                  </div>
                )}

                {/* Header */}
                <div style={{
                  textAlign: 'center',
                  borderBottom: '2px solid #000',
                  padding: '10px',
                  backgroundColor: '#ffffff'
                }}>
                  <div style={{fontWeight: 'bold', fontSize: '14px', marginBottom: '4px'}}>
                    UNITED STATES MEXICO CANADA AGREEMENT (USMCA)
                  </div>
                  <div style={{fontWeight: 'bold', fontSize: '13px'}}>
                    CERTIFICATION OF ORIGIN
                  </div>
                </div>

                {/* Section 1: Certifier Type & Blanket Period */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '60% 40%',
                  borderBottom: '1px solid #000'
                }}>
                  <div style={{borderRight: '1px solid #000', padding: '8px'}}>
                    <div style={{fontWeight: 'bold', fontSize: '10px', marginBottom: '6px'}}>
                      1. CERTIFIER TYPE (INDICATE "X")
                    </div>
                    <div style={{display: 'flex', gap: '20px', marginLeft: '10px'}}>
                      <label style={{display: 'flex', alignItems: 'center', gap: '4px'}}>
                        <input type="checkbox" disabled checked={previewData.professional_certificate.certifier?.type === 'IMPORTER'} />
                        IMPORTER
                      </label>
                      <label style={{display: 'flex', alignItems: 'center', gap: '4px'}}>
                        <input type="checkbox" disabled checked={previewData.professional_certificate.certifier?.type === 'EXPORTER'} />
                        EXPORTER
                      </label>
                      <label style={{display: 'flex', alignItems: 'center', gap: '4px'}}>
                        <input type="checkbox" disabled checked={previewData.professional_certificate.certifier?.type === 'PRODUCER'} />
                        PRODUCER
                      </label>
                    </div>
                  </div>
                  <div style={{padding: '8px'}}>
                    <div style={{fontWeight: 'bold', fontSize: '10px', marginBottom: '4px'}}>
                      BLANKET PERIOD (MM/DD/YYYY)
                    </div>
                    <div style={{marginLeft: '10px'}}>
                      <div>FROM: {previewData.professional_certificate.blanket_period?.start_date || 'N/A'}</div>
                      <div>TO: {previewData.professional_certificate.blanket_period?.end_date || 'N/A'}</div>
                    </div>
                  </div>
                </div>

                {/* Sections 2-5: Contact Information Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  borderBottom: '1px solid #000'
                }}>
                  {/* Section 2: Certifier */}
                  <div style={{borderRight: '1px solid #000', borderBottom: '1px solid #000', padding: '8px'}}>
                    <div style={{fontWeight: 'bold', fontSize: '10px', marginBottom: '4px'}}>
                      2. CERTIFIER NAME, ADDRESS, PHONE, AND EMAIL
                    </div>
                    <div style={{marginLeft: '8px', fontSize: '10px'}}>
                      <div><strong>NAME</strong></div>
                      <div>{previewData.professional_certificate.certifier?.name || previewData.professional_certificate.exporter?.name}</div>
                      <div style={{marginTop: '4px'}}><strong>ADDRESS</strong></div>
                      <div>{previewData.professional_certificate.certifier?.address || previewData.professional_certificate.exporter?.address}</div>
                      <div style={{marginTop: '4px'}}><strong>COUNTRY</strong> {previewData.professional_certificate.certifier?.country || previewData.professional_certificate.exporter?.country}</div>
                      <div><strong>PHONE</strong> {previewData.professional_certificate.certifier?.phone || 'N/A'}</div>
                      <div><strong>EMAIL</strong> {previewData.professional_certificate.certifier?.email || 'N/A'}</div>
                      <div style={{marginTop: '4px'}}><strong>TAX IDENTIFICATION NUMBER</strong></div>
                      <div>{previewData.professional_certificate.certifier?.tax_id || previewData.professional_certificate.exporter?.tax_id}</div>
                    </div>
                  </div>

                  {/* Section 3: Exporter */}
                  <div style={{borderBottom: '1px solid #000', padding: '8px'}}>
                    <div style={{fontWeight: 'bold', fontSize: '10px', marginBottom: '4px'}}>
                      3. EXPORTER NAME, ADDRESS, PHONE, AND EMAIL
                    </div>
                    <div style={{marginLeft: '8px', fontSize: '10px'}}>
                      <div><strong>NAME</strong></div>
                      <div>{previewData.professional_certificate.exporter?.name}</div>
                      <div style={{marginTop: '4px'}}><strong>ADDRESS</strong></div>
                      <div>{previewData.professional_certificate.exporter?.address}</div>
                      <div style={{marginTop: '4px'}}><strong>COUNTRY</strong> {previewData.professional_certificate.exporter?.country}</div>
                      <div><strong>PHONE</strong> {previewData.professional_certificate.exporter?.phone || 'N/A'}</div>
                      <div><strong>EMAIL</strong> {previewData.professional_certificate.exporter?.email || 'N/A'}</div>
                      <div style={{marginTop: '4px'}}><strong>TAX IDENTIFICATION NUMBER</strong></div>
                      <div>{previewData.professional_certificate.exporter?.tax_id}</div>
                    </div>
                  </div>

                  {/* Section 4: Producer */}
                  <div style={{borderRight: '1px solid #000', padding: '8px'}}>
                    <div style={{fontWeight: 'bold', fontSize: '10px', marginBottom: '4px'}}>
                      4. PRODUCER NAME, ADDRESS, PHONE, AND EMAIL
                    </div>
                    <div style={{marginLeft: '8px', fontSize: '10px'}}>
                      <div><strong>NAME</strong></div>
                      <div>{previewData.professional_certificate.producer?.same_as_exporter ? 'SAME AS EXPORTER' : previewData.professional_certificate.producer?.name}</div>
                      <div style={{marginTop: '4px'}}><strong>ADDRESS</strong></div>
                      <div>{previewData.professional_certificate.producer?.same_as_exporter ? 'SAME AS EXPORTER' : previewData.professional_certificate.producer?.address}</div>
                      <div style={{marginTop: '4px'}}><strong>COUNTRY</strong> {previewData.professional_certificate.producer?.country || previewData.professional_certificate.exporter?.country}</div>
                      <div><strong>PHONE</strong> {previewData.professional_certificate.producer?.phone || 'N/A'}</div>
                      <div><strong>EMAIL</strong> {previewData.professional_certificate.producer?.email || 'N/A'}</div>
                      <div style={{marginTop: '4px'}}><strong>TAX IDENTIFICATION NUMBER</strong></div>
                      <div>{previewData.professional_certificate.producer?.tax_id || previewData.professional_certificate.exporter?.tax_id}</div>
                    </div>
                  </div>

                  {/* Section 5: Importer */}
                  <div style={{padding: '8px'}}>
                    <div style={{fontWeight: 'bold', fontSize: '10px', marginBottom: '4px'}}>
                      5. IMPORTER NAME, ADDRESS, PHONE, AND EMAIL
                    </div>
                    <div style={{marginLeft: '8px', fontSize: '10px'}}>
                      <div><strong>NAME</strong></div>
                      <div>{previewData.professional_certificate.importer?.name}</div>
                      <div style={{marginTop: '4px'}}><strong>ADDRESS</strong></div>
                      <div>{previewData.professional_certificate.importer?.address}</div>
                      <div style={{marginTop: '4px'}}><strong>COUNTRY</strong> {previewData.professional_certificate.importer?.country}</div>
                      <div><strong>PHONE</strong> {previewData.professional_certificate.importer?.phone || 'N/A'}</div>
                      <div><strong>EMAIL</strong> {previewData.professional_certificate.importer?.email || 'N/A'}</div>
                      <div style={{marginTop: '4px'}}><strong>TAX IDENTIFICATION NUMBER</strong></div>
                      <div>{previewData.professional_certificate.importer?.tax_id}</div>
                    </div>
                  </div>
                </div>

                {/* Section 6: Goods Description Table */}
                <div style={{borderBottom: '1px solid #000'}}>
                  <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '10px'}}>
                    <thead>
                      <tr style={{backgroundColor: '#f5f5f5'}}>
                        <th style={{border: '1px solid #000', padding: '6px', textAlign: 'left', fontWeight: 'bold', width: '30%'}}>
                          6. DESCRIPTION OF GOOD(S)
                        </th>
                        <th style={{border: '1px solid #000', padding: '6px', textAlign: 'center', fontWeight: 'bold', width: '12%'}}>
                          7. HTS
                        </th>
                        <th style={{border: '1px solid #000', padding: '6px', textAlign: 'center', fontWeight: 'bold', width: '15%'}}>
                          8. ORIGIN CRITERION
                        </th>
                        <th style={{border: '1px solid #000', padding: '6px', textAlign: 'center', fontWeight: 'bold', width: '12%'}}>
                          9. PRODUCER (YES/NO)
                        </th>
                        <th style={{border: '1px solid #000', padding: '6px', textAlign: 'center', fontWeight: 'bold', width: '18%'}}>
                          10. METHOD OF QUALIFICATION
                        </th>
                        <th style={{border: '1px solid #000', padding: '6px', textAlign: 'center', fontWeight: 'bold', width: '13%'}}>
                          11. COUNTRY OF ORIGIN
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{border: '1px solid #000', padding: '6px', verticalAlign: 'top'}}>
                          {previewData.professional_certificate.product?.description}
                        </td>
                        <td style={{border: '1px solid #000', padding: '6px', textAlign: 'center', verticalAlign: 'top'}}>
                          {previewData.professional_certificate.hs_classification?.code}
                        </td>
                        <td style={{border: '1px solid #000', padding: '6px', textAlign: 'center', verticalAlign: 'top'}}>
                          {previewData.professional_certificate.preference_criterion || 'B'}
                        </td>
                        <td style={{border: '1px solid #000', padding: '6px', textAlign: 'center', verticalAlign: 'top'}}>
                          {previewData.professional_certificate.producer_declaration?.is_producer ? 'YES' : 'NO'}
                        </td>
                        <td style={{border: '1px solid #000', padding: '6px', textAlign: 'center', verticalAlign: 'top'}}>
                          {previewData.professional_certificate.qualification_method?.method || 'RVC'}
                        </td>
                        <td style={{border: '1px solid #000', padding: '6px', textAlign: 'center', verticalAlign: 'top'}}>
                          {previewData.professional_certificate.country_of_origin}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Certification Statement */}
                <div style={{borderBottom: '2px solid #000', padding: '10px', fontSize: '9px', lineHeight: '1.4'}}>
                  I CERTIFY THAT THE GOODS DESCRIBED IN THIS DOCUMENT QUALIFY AS ORIGINATING AND THE INFORMATION CONTAINED IN THIS DOCUMENT IS TRUE
                  AND ACCURATE. I ASSUME RESPONSIBILITY FOR PROVING SUCH REPRESENTATIONS AND AGREE TO MAINTAIN AND PRESENT UPON REQUEST OR TO MAKE
                  AVAILABLE DURING A VERIFICATION VISIT, DOCUMENTATION NECESSARY TO SUPPORT THIS CERTIFICATION
                </div>

                {/* Section 12: Authorization */}
                <div style={{padding: '10px'}}>
                  <div style={{fontWeight: 'bold', fontSize: '10px', marginBottom: '8px'}}>
                    THIS CERTIFICATE CONSISTS OF _____ PAGES, INCLUDING ALL ATTACHMENTS.
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '10px',
                    fontSize: '10px'
                  }}>
                    <div>
                      <div style={{fontWeight: 'bold', marginBottom: '4px'}}>12a. AUTHORIZED SIGNATURE</div>
                      <div style={{borderBottom: '1px solid #000', minHeight: '30px', marginBottom: '8px'}}></div>
                    </div>
                    <div>
                      <div style={{fontWeight: 'bold', marginBottom: '4px'}}>12b. COMPANY</div>
                      <div>{previewData.professional_certificate.exporter?.name}</div>
                    </div>
                    <div>
                      <div style={{fontWeight: 'bold', marginBottom: '4px'}}>12c. NAME</div>
                      <div>{previewData.professional_certificate.authorization?.signatory_name}</div>
                    </div>
                    <div>
                      <div style={{fontWeight: 'bold', marginBottom: '4px'}}>12d. TITLE</div>
                      <div>{previewData.professional_certificate.authorization?.signatory_title}</div>
                    </div>
                    <div>
                      <div style={{fontWeight: 'bold', marginBottom: '4px'}}>12e. DATE (MM/DD/YYYY)</div>
                      <div>{previewData.professional_certificate.authorization?.signature_date
                        ? new Date(previewData.professional_certificate.authorization.signature_date).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })
                        : new Date().toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })}</div>
                    </div>
                    <div>
                      <div style={{fontWeight: 'bold', marginBottom: '4px'}}>12f. TELEPHONE NUMBER</div>
                      <div>{previewData.professional_certificate.authorization?.phone || 'N/A'}</div>
                    </div>
                    <div style={{gridColumn: '1 / -1'}}>
                      <div style={{fontWeight: 'bold', marginBottom: '4px'}}>12g. EMAIL</div>
                      <div>{previewData.professional_certificate.authorization?.email || 'N/A'}</div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div style={{
                  textAlign: 'right',
                  padding: '8px',
                  fontSize: '9px',
                  borderTop: '1px solid #000'
                }}>
                  USMCA CERTIFICATE V3
                </div>
              </div>
              </div>

              {/* Platform Disclaimer - Below certificate preview */}
              <div className="alert alert-info" style={{marginTop: '1.5rem', marginBottom: '1.5rem'}}>
                <div className="alert-content">
                  <div className="alert-title">⚖️ Platform Disclaimer</div>
                  <div className="text-body" style={{fontSize: '11px', lineHeight: '1.5'}}>
                    This certificate was prepared by the signatory identified above using Triangle Trade Intelligence tools.
                    Triangle Trade Intelligence provides software tools only and assumes no legal responsibility for the accuracy,
                    completeness, or compliance of this certificate. The signatory assumes full legal responsibility for all
                    information contained herein and certifies compliance with all applicable regulations.
                  </div>
                </div>
              </div>

              {/* Certificate Actions - Below Preview */}
              <div style={{marginTop: '2rem'}}>
                <div className="hero-buttons">
                  <button
                    className="btn-primary"
                    onClick={() => onDownloadCertificate && onDownloadCertificate()}
                    disabled={!authData.accuracy_certification || !authData.authority_certification || userTier === 'Trial'}
                    title={userTier === 'Trial' ? 'Upgrade to download certificates' : ''}
                  >
                    {userTier === 'Trial' ? '🔒 Download (Upgrade Required)' : '💾 Download PDF Certificate'}
                  </button>

                  <button
                    className="btn-primary"
                    onClick={handleSetUpAlerts}
                    disabled={userTier === 'Trial'}
                    title={userTier === 'Trial' ? 'Upgrade to set up trade alerts' : ''}
                  >
                    {userTier === 'Trial' ? '🔒 Set Up Trade Alerts (Upgrade Required)' : '🚨 Set Up Trade Alerts'}
                  </button>
                </div>

                {userTier === 'Trial' && (
                  <div className="alert alert-warning" style={{marginTop: '1rem'}}>
                    <div className="alert-content">
                      <div className="alert-title">🚀 Free Trial - Preview Only</div>
                      <div className="text-body">
                        Upgrade to download certificates and access trade alerts. Starting at $99/month.
                      </div>
                      <button
                        className="btn-primary"
                        style={{marginTop: '0.5rem'}}
                        onClick={() => router.push('/pricing')}
                      >
                        View Pricing Plans
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="alert alert-info">
              <div className="alert-content">
                <div className="text-body">
                  ℹ️ Complete the Digital Signature section above and click "Generate & Preview Certificate" to view your certificate.
                </div>
              </div>
            </div>
          )}
      </div>
    </div>
  );
}