/**
 * Authorization Step - Step 4: Authorization and Certificate Generation
 * Collects authorized signatory information and importer details
 * Enhanced with AI agent validation at submission point
 */

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';

export default function AuthorizationStep({ formData, updateFormData, workflowData, certificateData, onPreviewCertificate, userTier = 'Trial' }) {
  const router = useRouter();
  // ✅ Removed previewRef - old certificate preview system removed
  const [authData, setAuthData] = useState(() => {
    // ✅ RESTORE from localStorage on mount (prevent data loss on refresh)
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('usmca_authorization_data');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          console.log('✅ Restored authorization data from localStorage');
          return {
            ...parsed,
            ...formData // Merge with formData to get latest workflow data
          };
        } catch (e) {
          console.error('Failed to restore authorization data:', e);
        }
      }
    }

    // Default initial state
    return {
      // Authorized Signatory Information (NEW DATA COLLECTION)
      signatory_name: '',
      signatory_title: '',
      signatory_email: '',
      signatory_phone: '',

      // Authorization checkboxes
      accuracy_certification: false,
      authority_certification: false,
      ...formData
    };
  });

  // 🎯 Collapsible sections state
  const [expandedSections, setExpandedSections] = useState({
    exporter: false,
    importer: false,
    producer: false
  });

  // Agent orchestration removed - was causing excessive AI calls on every field change

  // 🚀 AUTO-FILL COMPANY DATA ON MOUNT (so user doesn't have to manually check box)
  // ✅ FIX (Oct 30): Removed authData.exporter_same_as_company from dependencies to prevent re-check loop
  // This useEffect should ONLY run once on mount to auto-fill, not every time checkbox changes
  useEffect(() => {
    if (workflowData?.company && !authData.exporter_same_as_company) {
      console.log('📋 Auto-filling company data from workflow:', workflowData.company);
      setAuthData(prev => ({
        ...prev,
        exporter_same_as_company: true,  // Check the box automatically
        exporter_name: workflowData.company.name || workflowData.company.company_name || '',
        exporter_address: workflowData.company.company_address || workflowData.company.address || '',
        exporter_tax_id: workflowData.company.tax_id || '',
        exporter_contact_person: workflowData.company.contact_person || '',  // ✅ FIX (Oct 30): Added contact person
        exporter_phone: workflowData.company.contact_phone || '',
        exporter_email: workflowData.company.contact_email || '',
        exporter_country: workflowData.company.company_country || ''
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workflowData]); // Only run when workflowData changes (on mount), NOT when checkbox changes

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

  // ✅ SAVE to localStorage whenever authData changes (prevent data loss on refresh)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('usmca_authorization_data', JSON.stringify(authData));
      console.log('💾 Saved authorization data to localStorage');
    }
  }, [authData]);

  // Update parent when authData changes - use ref to avoid infinite loop
  // Only update on initial mount and when certifications are confirmed
  useEffect(() => {
    if (authData.accuracy_certification && authData.authority_certification) {
      // Only update parent when both certifications are checked
      Object.keys(authData).forEach(key => {
        updateFormData(key, authData[key]);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authData]); // Only depend on authData, NOT updateFormData (prevents infinite loop)

  // ✅ REMOVED: Old useEffects for previewData auto-check and auto-scroll
  // New system uses EditableCertificatePreview component which handles its own state

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
      component_origins: workflowData?.component_origins || workflowData?.components || certificateData?.analysis_results?.component_breakdown
    });

    // Prepare complete workflow data for AI vulnerability analysis
    const alertData = {
      company: {
        name: workflowData?.company?.name || workflowData?.company?.company_name || '',
        company_name: workflowData?.company?.name || workflowData?.company?.company_name || '',
        business_type: workflowData?.company?.business_type,
        trade_volume: (() => {
          const tv = workflowData?.company?.trade_volume;
          if (!tv) {
            console.error('❌ [FORM SCHEMA] Missing company.trade_volume in AuthorizationStep alerts data');
          }
          return tv || 0;
        })(),
        company_country: workflowData?.company?.company_country  // FIX: Include country for certificate generation
      },
      product: {
        hs_code: workflowData?.product?.hs_code || '',
        description: workflowData?.product?.description || workflowData?.product?.product_description || '',
        product_description: workflowData?.product?.description || workflowData?.product?.product_description || ''
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
        {/* Checkbox OUTSIDE the collapsed section - always visible */}
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
                  handleFieldChange('exporter_address', workflowData?.company?.company_address || workflowData?.company?.address || '');
                  handleFieldChange('exporter_tax_id', workflowData?.company?.tax_id || '');
                  handleFieldChange('exporter_contact_person', workflowData?.company?.contact_person || '');  // ✅ FIX (Oct 30): Added contact person
                  handleFieldChange('exporter_phone', workflowData?.company?.contact_phone || '');
                  handleFieldChange('exporter_email', workflowData?.company?.contact_email || '');
                  handleFieldChange('exporter_country', workflowData?.company?.company_country || '');
                } else {
                  // Clear fields if unchecked
                  handleFieldChange('exporter_name', '');
                  handleFieldChange('exporter_address', '');
                  handleFieldChange('exporter_tax_id', '');
                  handleFieldChange('exporter_contact_person', '');
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

        <CollapsibleSectionHeader
          title="Exporter Details"
          description="Information about the company sending/exporting the goods"
          sectionKey="exporter"
          icon="📤"
        />

        {expandedSections.exporter && (
          <>

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
                />
              </div>

              <div className="form-group">
                <label className="form-label required">Country</label>
                <select
                  className="form-select"
                  value={authData.exporter_country || ''}
                  onChange={(e) => handleFieldChange('exporter_country', e.target.value)}
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

      {/* 3. Importer Information */}
      <div className="form-section">
        {/* Checkbox OUTSIDE the collapsed section - always visible */}
        <div className="form-group" style={{marginBottom: '1.5rem'}}>
          <label className="checkbox-item" style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
            <input
              type="checkbox"
              checked={authData.importer_not_yet_available || false}
              onChange={(e) => {
                handleFieldChange('importer_not_yet_available', e.target.checked);
                // Clear importer fields if not yet available
                if (e.target.checked) {
                  handleFieldChange('importer_name', '');
                  handleFieldChange('importer_address', '');
                  handleFieldChange('importer_tax_id', '');
                  handleFieldChange('importer_contact_person', '');
                  handleFieldChange('importer_phone', '');
                  handleFieldChange('importer_email', '');
                  handleFieldChange('importer_country', '');
                }
              }}
            />
            <span className="checkbox-text">
              Importer information not yet available (can be added later)
            </span>
          </label>
        </div>

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

      {/* 4. Producer Information - NEW SECTION PER CRISTINA'S FEEDBACK */}
      <div className="form-section">
        {/* Checkbox OUTSIDE the collapsed section - always visible */}
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

        <CollapsibleSectionHeader
          title="Producer Details"
          description="Information about the company that manufactures/produces the goods"
          sectionKey="producer"
          icon="🏭"
        />

        {expandedSections.producer && (
          <>
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

      {/* 5. Digital Signature & Certification */}
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

      {/* ✅ REMOVED: Old black/white certificate preview section (lines 799-1182)
          New system uses EditableCertificatePreview component on separate page */}
    </div>
  );
}