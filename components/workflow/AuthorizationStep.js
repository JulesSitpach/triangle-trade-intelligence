/**
 * Authorization Step - Step 4: Authorization and Certificate Generation
 * Collects authorized signatory information and importer details
 * Enhanced with AI agent validation at submission point
 */

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { getCountryFullName } from '../../config/country-classifications.js';

export default function AuthorizationStep({ formData, updateFormData, workflowData, certificateData, onPreviewCertificate, userTier = 'Trial', showPreview = false }) {
  const router = useRouter();

  // ✅ DEBUG: Log showPreview value to understand button color
  console.log('🎨 [AuthorizationStep] showPreview value:', showPreview, 'Button will be:', showPreview ? 'GREEN (btn-success)' : 'BLUE (btn-primary)');
  // ✅ Removed previewRef - old certificate preview system removed
  const [authData, setAuthData] = useState(() => {
    // ✅ FIXED (Nov 7): Start with EMPTY state - wait for workflowData to auto-fill
    // DO NOT initialize from formData - it may contain stale localStorage data
    // The useEffects below will auto-fill from workflowData.company when it loads
    return {
      // Authorized Signatory Information (will be auto-filled from Step 1)
      signatory_name: '',
      signatory_title: '',
      signatory_email: '',
      signatory_phone: '',

      // Authorization checkboxes
      accuracy_certification: false,
      authority_certification: false,

      // Other fields start empty - will be auto-filled by useEffects
      certifier_type: '',
      exporter_same_as_company: false,
      importer_same_as_company: false,
      producer_same_as_exporter: false
    };
  });

  // 🎯 Collapsible sections state
  const [expandedSections, setExpandedSections] = useState({
    exporter: false,
    importer: false,
    producer: false
  });

  // Agent orchestration removed - was causing excessive AI calls on every field change

  // ✅ FIX (Nov 9): Use refs to prevent infinite loops in useEffects
  const prevCertifierTypeRef = useRef();
  const prevWorkflowDataRef = useRef();
  const hasAutoFilledExporterRef = useRef(false);
  const hasAutoFilledImporterRef = useRef(false);
  const hasAutoFilledProducerRef = useRef(false);

  // 🚀 AUTO-FILL EXPORTER DATA BASED ON CERTIFIER TYPE (Nov 6, 2025)
  // Only auto-check "Exporter is my company" when certifier is EXPORTER or PRODUCER
  // For IMPORTER, the exporter is their SUPPLIER (not their company)
  // ✅ FIX (Nov 9): Don't auto-fill if we're loading saved authorization data from dashboard
  useEffect(() => {
    // Skip auto-fill if we have saved authorization data (loading from dashboard)
    const hasSavedAuth = workflowData?.authorization && Object.keys(workflowData.authorization).length > 0;

    // Only run if certifier_type actually changed (not just re-render)
    const certifierTypeChanged = prevCertifierTypeRef.current !== authData.certifier_type;

    if (workflowData?.company && authData.certifier_type && !hasSavedAuth && certifierTypeChanged && !hasAutoFilledExporterRef.current) {
      const shouldAutoFillExporter = authData.certifier_type === 'EXPORTER' || authData.certifier_type === 'PRODUCER';

      console.log('📋 Certifier type changed:', authData.certifier_type, '→ Auto-fill exporter?', shouldAutoFillExporter);

      if (shouldAutoFillExporter && !authData.exporter_same_as_company) {
        console.log('✅ Auto-filling exporter data from company (certifier is EXPORTER or PRODUCER)');

        // ✅ FIX: Convert ISO country codes (US/CA/MX) to full names (United States/Canada/Mexico)
        const countryCode = workflowData.company.company_country || '';
        const fullCountryName = getCountryFullName(countryCode);

        console.log('🌍 useEffect auto-fill - Country conversion:', {
          iso_code: countryCode,
          full_name: fullCountryName
        });

        console.log('📋 useEffect auto-fill - Company data being used:', {
          name: workflowData.company.name || workflowData.company.company_name,
          address: workflowData.company.company_address || workflowData.company.address,
          tax_id: workflowData.company.tax_id,
          contact_person: workflowData.company.contact_person,
          phone: workflowData.company.contact_phone,
          email: workflowData.company.contact_email,
          country: fullCountryName
        });

        setAuthData(prev => ({
          ...prev,
          exporter_same_as_company: true,  // Check the box automatically
          exporter_name: workflowData.company.name || workflowData.company.company_name || '',
          exporter_address: workflowData.company.company_address || workflowData.company.address || '',
          exporter_tax_id: workflowData.company.tax_id || '',
          exporter_contact_person: workflowData.company.contact_person || '',
          exporter_phone: workflowData.company.contact_phone || '',
          exporter_email: workflowData.company.contact_email || '',
          exporter_country: fullCountryName
        }));
        hasAutoFilledExporterRef.current = true;
      } else if (!shouldAutoFillExporter && authData.exporter_same_as_company) {
        console.log('❌ Un-checking exporter auto-fill (certifier is IMPORTER - exporter is their supplier)');
        setAuthData(prev => ({
          ...prev,
          exporter_same_as_company: false  // Uncheck the box for IMPORTER
        }));
      }

      prevCertifierTypeRef.current = authData.certifier_type;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authData.certifier_type, workflowData]); // Run when certifier type or workflow data changes

  // 🎯 AUTO-SELECT CERTIFIER TYPE BASED ON BUSINESS TYPE (Nov 6, 2025)
  // If business_type is "Manufacturer", auto-select "PRODUCER" certifier type
  useEffect(() => {
    if (workflowData?.company?.business_type && !authData.certifier_type) {
      const businessType = workflowData.company.business_type;

      console.log('🎯 Auto-selecting certifier type based on business_type:', businessType);

      if (businessType === 'Manufacturer') {
        console.log('✅ Business type is Manufacturer → Auto-selecting PRODUCER');
        setAuthData(prev => ({
          ...prev,
          certifier_type: 'PRODUCER'
        }));
      } else if (businessType === 'Importer') {
        console.log('✅ Business type is Importer → Auto-selecting IMPORTER');
        setAuthData(prev => ({
          ...prev,
          certifier_type: 'IMPORTER'
        }));
      } else if (businessType === 'Exporter') {
        console.log('✅ Business type is Exporter → Auto-selecting EXPORTER');
        setAuthData(prev => ({
          ...prev,
          certifier_type: 'EXPORTER'
        }));
      }
      // For other business types (Distributor, Retailer, etc.), don't auto-select
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workflowData?.company?.business_type]); // Only run when business_type changes

  // 📝 AUTO-FILL SIGNATORY INFORMATION FROM STEP 1 CONTACT DATA (Nov 6, 2025)
  // The person who completed the workflow is usually the person who will sign the certificate
  useEffect(() => {
    if (workflowData?.company && !authData.signatory_name && !authData.signatory_email) {
      const contactPerson = workflowData.company.contact_person;
      const contactEmail = workflowData.company.contact_email;
      const contactPhone = workflowData.company.contact_phone;

      if (contactPerson || contactEmail || contactPhone) {
        console.log('📝 Auto-filling signatory info from Step 1 contact data:', {
          name: contactPerson,
          email: contactEmail,
          phone: contactPhone
        });

        setAuthData(prev => ({
          ...prev,
          signatory_name: contactPerson || '',
          signatory_email: contactEmail || '',
          signatory_phone: contactPhone || ''
          // Note: signatory_title remains empty (user must select their title)
        }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workflowData?.company?.contact_person, workflowData?.company?.contact_email, workflowData?.company?.contact_phone]); // Run when contact data changes

  // 📥 AUTO-FILL IMPORTER DATA BASED ON CERTIFIER TYPE (Nov 6, 2025)
  // Only auto-fill "Importer is my company" when user is IMPORTER
  // If user is EXPORTER or PRODUCER, the importer is their CUSTOMER (not their company)
  // ✅ FIX (Nov 9): Don't auto-fill if we're loading saved authorization data from dashboard
  useEffect(() => {
    // Skip auto-fill if we have saved authorization data (loading from dashboard)
    const hasSavedAuth = workflowData?.authorization && Object.keys(workflowData.authorization).length > 0;

    // Only run if certifier_type actually changed (not just re-render)
    const certifierTypeChanged = prevCertifierTypeRef.current !== authData.certifier_type;

    if (workflowData?.company && authData.certifier_type && !hasSavedAuth && certifierTypeChanged && !hasAutoFilledImporterRef.current) {
      const shouldAutoFillImporter = authData.certifier_type === 'IMPORTER';

      console.log('📥 Certifier type changed:', authData.certifier_type, '→ Auto-fill importer?', shouldAutoFillImporter);

      if (shouldAutoFillImporter && !authData.importer_same_as_company) {
        console.log('✅ Auto-filling importer data from company (certifier is IMPORTER)');

        // ✅ FIX: Convert ISO country codes (US/CA/MX) to full names (United States/Canada/Mexico)
        const countryCode = workflowData.company.company_country || '';
        const fullCountryName = getCountryFullName(countryCode);

        console.log('🌍 useEffect auto-fill (importer) - Country conversion:', {
          iso_code: countryCode,
          full_name: fullCountryName
        });

        console.log('📥 useEffect auto-fill (importer) - Company data being used:', {
          name: workflowData.company.name || workflowData.company.company_name,
          address: workflowData.company.company_address || workflowData.company.address,
          tax_id: workflowData.company.tax_id,
          contact_person: workflowData.company.contact_person,
          phone: workflowData.company.contact_phone,
          email: workflowData.company.contact_email,
          country: fullCountryName
        });

        setAuthData(prev => ({
          ...prev,
          importer_same_as_company: true,  // Check the box automatically
          importer_name: workflowData.company.name || workflowData.company.company_name || '',
          importer_address: workflowData.company.company_address || workflowData.company.address || '',
          importer_tax_id: workflowData.company.tax_id || '',
          importer_contact_person: workflowData.company.contact_person || '',
          importer_phone: workflowData.company.contact_phone || '',
          importer_email: workflowData.company.contact_email || '',
          importer_country: fullCountryName
        }));
        hasAutoFilledImporterRef.current = true;
      } else if (!shouldAutoFillImporter && authData.importer_same_as_company) {
        console.log('❌ Un-checking importer auto-fill (certifier is EXPORTER/PRODUCER - importer is their customer)');
        setAuthData(prev => ({
          ...prev,
          importer_same_as_company: false  // Uncheck the box for EXPORTER/PRODUCER
        }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authData.certifier_type, workflowData]); // Run when certifier type or workflow data changes

  // 🏭 AUTO-FILL PRODUCER DATA BASED ON CERTIFIER TYPE (Nov 6, 2025)
  // Auto-check "Producer is my company" when user is PRODUCER
  // For EXPORTER, they can manually check if they also manufacture
  // For IMPORTER, producer is a third party (not their company)
  // ✅ FIX (Nov 9): Don't auto-fill if we're loading saved authorization data from dashboard
  useEffect(() => {
    // Skip auto-fill if we have saved authorization data (loading from dashboard)
    const hasSavedAuth = workflowData?.authorization && Object.keys(workflowData.authorization).length > 0;

    // Only run if certifier_type actually changed (not just re-render)
    const certifierTypeChanged = prevCertifierTypeRef.current !== authData.certifier_type;

    if (workflowData?.company && authData.certifier_type && !hasSavedAuth && certifierTypeChanged && !hasAutoFilledProducerRef.current) {
      const shouldAutoFillProducer = authData.certifier_type === 'PRODUCER';

      console.log('🏭 Certifier type changed:', authData.certifier_type, '→ Auto-fill producer?', shouldAutoFillProducer);

      if (shouldAutoFillProducer && !authData.producer_same_as_company) {
        console.log('✅ Auto-filling producer data from company (certifier is PRODUCER)');

        // ✅ FIX: Convert ISO country codes (US/CA/MX) to full names (United States/Canada/Mexico)
        const countryCode = workflowData.company.company_country || '';
        const fullCountryName = getCountryFullName(countryCode);

        console.log('🌍 useEffect auto-fill (producer) - Country conversion:', {
          iso_code: countryCode,
          full_name: fullCountryName
        });

        console.log('🏭 useEffect auto-fill (producer) - Company data being used:', {
          name: workflowData.company.name || workflowData.company.company_name,
          address: workflowData.company.company_address || workflowData.company.address,
          tax_id: workflowData.company.tax_id,
          phone: workflowData.company.contact_phone,
          email: workflowData.company.contact_email,
          country: fullCountryName
        });

        setAuthData(prev => ({
          ...prev,
          producer_same_as_company: true,  // Check the box automatically
          producer_name: workflowData.company.name || workflowData.company.company_name || '',
          producer_address: workflowData.company.company_address || workflowData.company.address || '',
          producer_tax_id: workflowData.company.tax_id || '',
          producer_phone: workflowData.company.contact_phone || '',
          producer_email: workflowData.company.contact_email || '',
          producer_country: fullCountryName
        }));
        hasAutoFilledProducerRef.current = true;
      } else if (!shouldAutoFillProducer && authData.producer_same_as_company) {
        console.log('❌ Un-checking producer auto-fill (certifier is EXPORTER/IMPORTER - may need manual entry)');
        setAuthData(prev => ({
          ...prev,
          producer_same_as_company: false  // Uncheck for non-PRODUCER certifiers
        }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authData.certifier_type, workflowData]); // Run when certifier type or workflow data changes

  // 📥 LOAD SAVED AUTHORIZATION DATA (when loading from dashboard)
  // This restores checkbox states (importer_same_as_company, etc.) from saved workflows
  useEffect(() => {
    if (workflowData?.authorization && Object.keys(workflowData.authorization).length > 0) {
      console.log('📥 Loading saved authorization data from workflow:', workflowData.authorization);

      setAuthData(prev => ({
        ...prev,
        ...workflowData.authorization,
        // Preserve certifier_type from auto-fill logic (don't overwrite)
        certifier_type: prev.certifier_type || workflowData.authorization.certifier_type
      }));
    } else if (certificateData?.authorization && Object.keys(certificateData.authorization).length > 0) {
      console.log('📥 Loading saved authorization data from certificateData:', certificateData.authorization);

      setAuthData(prev => ({
        ...prev,
        ...certificateData.authorization,
        // Preserve certifier_type from auto-fill logic (don't overwrite)
        certifier_type: prev.certifier_type || certificateData.authorization.certifier_type
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workflowData?.authorization, certificateData?.authorization]); // Run when saved authorization data arrives

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
  const prevAuthDataRef = useRef();
  useEffect(() => {
    // Only save if authData actually changed (deep comparison on key fields)
    const authDataChanged = JSON.stringify(authData) !== JSON.stringify(prevAuthDataRef.current);

    if (typeof window !== 'undefined' && authDataChanged) {
      localStorage.setItem('usmca_authorization_data', JSON.stringify(authData));
      console.log('💾 Saved authorization data to localStorage');
      prevAuthDataRef.current = authData;
    }
  }, [authData]);

  // Update parent when authData changes - use ref to avoid infinite loop
  // Only update on initial mount and when certifications are confirmed
  const hasUpdatedParentRef = useRef(false);
  useEffect(() => {
    if (authData.accuracy_certification && authData.authority_certification && !hasUpdatedParentRef.current) {
      // Only update parent when both certifications are checked AND we haven't updated yet
      Object.keys(authData).forEach(key => {
        updateFormData(key, authData[key]);
      });
      hasUpdatedParentRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authData.accuracy_certification, authData.authority_certification]); // Only depend on certification flags

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

        {/* DOCUMENTATION FIRST ON MOBILE */}
        <div style={{
          padding: '1rem',
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          marginTop: '1rem',
          marginBottom: '1rem'
        }}>
          <div style={{marginBottom: '0.75rem'}}>
            <div style={{fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem'}}>
              Documentation You Need
            </div>
            <div style={{fontSize: '0.75rem', color: '#6b7280'}}>
              {authData.certifier_type ? 'Gather these before completing:' : 'Select your role to see required documents'}
            </div>
          </div>

          {authData.certifier_type === 'IMPORTER' && (
            <ul style={{margin: 0, paddingLeft: '1.25rem', fontSize: '0.8125rem', color: '#4b5563', lineHeight: '1.5'}}>
              <li>Purchase order</li>
              <li>Commercial invoice</li>
              <li>Bill of lading</li>
              <li>Packing list</li>
              <li>Supplier USMCA certificate</li>
            </ul>
          )}

          {authData.certifier_type === 'EXPORTER' && (
            <ul style={{margin: 0, paddingLeft: '1.25rem', fontSize: '0.8125rem', color: '#4b5563', lineHeight: '1.5'}}>
              <li>Commercial invoice</li>
              <li>Packing list</li>
              <li>Export permit (if required)</li>
              <li>Bill of materials (BOM)</li>
              <li>Supplier origin declarations</li>
            </ul>
          )}

          {authData.certifier_type === 'PRODUCER' && (
            <ul style={{margin: 0, paddingLeft: '1.25rem', fontSize: '0.8125rem', color: '#4b5563', lineHeight: '1.5'}}>
              <li>Manufacturing records</li>
              <li>Bill of materials (BOM)</li>
              <li>Supplier declarations</li>
              <li>RVC calculation worksheets</li>
              <li>Component origin certificates</li>
            </ul>
          )}

          {!authData.certifier_type && (
            <div style={{fontSize: '0.8125rem', color: '#9ca3af', fontStyle: 'italic', padding: '0.5rem 0'}}>
              Choose your role below
            </div>
          )}
        </div>

        {/* ROLE SELECTION */}
        <div style={{marginTop: '1rem'}}>
          <div style={{display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
            <label className="checkbox-item" style={{display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.75rem', border: '2px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer', backgroundColor: authData.certifier_type === 'IMPORTER' ? '#eff6ff' : 'transparent'}}>
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

            {!authData.certifier_type && (
              <div style={{padding: '1rem', backgroundColor: '#fef3c7', borderRadius: '6px', marginTop: '1rem'}}>
                <strong>⚠️ Required:</strong> Please select who is completing this certificate before continuing.
              </div>
            )}
          </div>
        </div>
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
        <div className="form-group mb-6">
          <label className="checkbox-item" style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
            <input
              type="checkbox"
              checked={authData.exporter_same_as_company || false}
              onChange={(e) => {
                handleFieldChange('exporter_same_as_company', e.target.checked);
                // Auto-populate exporter fields from company data if checked
                if (e.target.checked) {
                  // ✅ FIX: Convert ISO country codes to full names before auto-filling
                  const countryCode = workflowData?.company?.company_country || '';
                  const fullCountryName = getCountryFullName(countryCode);

                  console.log('🌍 Checkbox auto-fill - Country conversion:', {
                    iso_code: countryCode,
                    full_name: fullCountryName
                  });

                  // ✅ CONSISTENT MAPPING (Nov 6): Use same field mapping as useEffect auto-fill
                  handleFieldChange('exporter_name', workflowData?.company?.name || workflowData?.company?.company_name || '');
                  handleFieldChange('exporter_address', workflowData?.company?.company_address || workflowData?.company?.address || '');
                  handleFieldChange('exporter_tax_id', workflowData?.company?.tax_id || '');
                  handleFieldChange('exporter_contact_person', workflowData?.company?.contact_person || '');
                  handleFieldChange('exporter_phone', workflowData?.company?.contact_phone || '');
                  handleFieldChange('exporter_email', workflowData?.company?.contact_email || '');
                  handleFieldChange('exporter_country', fullCountryName);
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
        <div className="form-group mb-6">
          <label className="checkbox-item" style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
            <input
              type="checkbox"
              checked={authData.importer_same_as_company || false}
              onChange={(e) => {
                handleFieldChange('importer_same_as_company', e.target.checked);
                // Auto-populate importer fields from company data if checked
                if (e.target.checked) {
                  // ✅ FIX: Convert ISO country codes to full names before auto-filling
                  const countryCode = workflowData?.company?.company_country || '';
                  const fullCountryName = getCountryFullName(countryCode);

                  console.log('🌍 Checkbox auto-fill (importer) - Country conversion:', {
                    iso_code: countryCode,
                    full_name: fullCountryName
                  });

                  // ✅ CONSISTENT MAPPING (Nov 6): Use same field mapping as useEffect auto-fill
                  handleFieldChange('importer_name', workflowData?.company?.name || workflowData?.company?.company_name || '');
                  handleFieldChange('importer_address', workflowData?.company?.company_address || workflowData?.company?.address || '');
                  handleFieldChange('importer_tax_id', workflowData?.company?.tax_id || '');
                  handleFieldChange('importer_contact_person', workflowData?.company?.contact_person || '');
                  handleFieldChange('importer_phone', workflowData?.company?.contact_phone || '');
                  handleFieldChange('importer_email', workflowData?.company?.contact_email || '');
                  handleFieldChange('importer_country', fullCountryName);
                } else {
                  // Clear fields if unchecked
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
              Importer is my company (auto-fill with company information from Step 1)
            </span>
          </label>
        </div>

        <CollapsibleSectionHeader
          title="Importer Details"
          description={authData.certifier_type === 'IMPORTER'
            ? "Information about your company (you are the importer)"
            : "Information about your customer (the importing company)"}
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
        <div className="form-group mb-6">
          <label className="checkbox-item" style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
            <input
              type="checkbox"
              checked={authData.producer_same_as_company || false}
              onChange={(e) => {
                handleFieldChange('producer_same_as_company', e.target.checked);
                // Auto-populate producer fields from company data if checked
                if (e.target.checked) {
                  // ✅ FIX: Convert ISO country codes to full names before auto-filling
                  const countryCode = workflowData?.company?.company_country || '';
                  const fullCountryName = getCountryFullName(countryCode);

                  console.log('🌍 Checkbox auto-fill (producer) - Country conversion:', {
                    iso_code: countryCode,
                    full_name: fullCountryName
                  });

                  // ✅ CONSISTENT MAPPING (Nov 6): Use same field mapping as useEffect auto-fill
                  handleFieldChange('producer_name', workflowData?.company?.name || workflowData?.company?.company_name || '');
                  handleFieldChange('producer_address', workflowData?.company?.company_address || workflowData?.company?.address || '');
                  handleFieldChange('producer_tax_id', workflowData?.company?.tax_id || '');
                  handleFieldChange('producer_phone', workflowData?.company?.contact_phone || '');
                  handleFieldChange('producer_email', workflowData?.company?.contact_email || '');
                  handleFieldChange('producer_country', fullCountryName);
                } else {
                  // Clear fields if unchecked
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
              Producer is my company (auto-fill with company information from Step 1)
            </span>
          </label>
        </div>

        <CollapsibleSectionHeader
          title="Producer Details"
          description={authData.certifier_type === 'PRODUCER'
            ? "Information about your company (you are the producer/manufacturer)"
            : "Information about the company that manufactures/produces the goods"}
          sectionKey="producer"
          icon="🏭"
        />

        {expandedSections.producer && (
          <>
            {/* Only show producer fields if NOT same as company */}
            {!authData.producer_same_as_company && (
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

            {authData.producer_same_as_company && (
              <div className="alert alert-info">
                <div className="alert-content">
                  <div className="text-body">
                    ✓ Producer information will be automatically filled with your company details.
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

        <div className="checkbox-group mb-6">
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

        <div className="alert alert-info mb-6">
          <div className="alert-content">
            <div className="alert-title">Certification Statement</div>
            <div className="text-body">
              &quot;I certify that the goods described in this certificate qualify as originating goods
              under the USMCA and that the information contained herein is true and accurate.&quot;
            </div>
          </div>
        </div>

        <button
          className={showPreview ? "btn-success" : "btn-primary"}
          disabled={!authData.importer_name || !authData.accuracy_certification || !authData.authority_certification}
          onClick={() => {
            // ✅ P1-3 FIX: Validate required authorization fields before proceeding
            const missingFields = [];
            if (!authData.signatory_name || authData.signatory_name.trim() === '') {
              missingFields.push('Signatory Name');
            }
            if (!authData.signatory_title || authData.signatory_title.trim() === '') {
              missingFields.push('Signatory Title');
            }
            if (!authData.accuracy_certification) {
              missingFields.push('Accuracy Certification (checkbox)');
            }
            if (!authData.authority_certification) {
              missingFields.push('Authority Certification (checkbox)');
            }

            if (missingFields.length > 0) {
              alert(`❌ Authorization Incomplete\n\nPlease complete the following required fields:\n${missingFields.map(f => `• ${f}`).join('\n')}\n\nThese are required for a valid USMCA certificate.`);
              return;
            }

            // All validations passed - proceed to certificate generation
            onPreviewCertificate && onPreviewCertificate(authData);
          }}
        >
          📄 Generate & Preview Certificate
        </button>
      </div>

      {/* ✅ REMOVED: Old black/white certificate preview section (lines 799-1182)
          New system uses EditableCertificatePreview component on separate page */}
    </div>
  );
}