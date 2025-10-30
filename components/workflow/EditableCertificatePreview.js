/**
 * Editable Certificate Preview - Official USMCA Form Layout
 * Matches the official US government USMCA Certificate of Origin template
 * with light blue input boxes for easy editing and identification
 *
 * Layout matches: USMCA-Certificate-Of-Origin-Form-Template-Updated-10-21-2021.pdf
 */

import React, { useState, useEffect } from 'react';
import { generateUSMCACertificatePDF } from '../../lib/utils/usmca-certificate-pdf-generator.js';

export default function EditableCertificatePreview({
  previewData,
  userTier,
  onSave,
  onCancel
}) {
  // Determine if fields should be disabled based on user tier
  // Only 'trial' or 'free' tier users have read-only access
  // Starter, Professional, and Premium users can edit and download
  const isTrialUser = userTier === 'trial' || userTier === 'free' || userTier === 'Free';

  const [editedCert, setEditedCert] = useState(() => {
    // ✅ Generate unique certificate number: USMCA-{YEAR}-{6-CHAR-ID}
    // Use existing certificate number if available, otherwise generate new one
    const generateCertificateNumber = () => {
      const year = new Date().getFullYear();
      const timestamp = Date.now().toString(36).toUpperCase(); // Base-36 timestamp
      const random = Math.random().toString(36).substring(2, 6).toUpperCase(); // 4 random chars
      return `USMCA-${year}-${timestamp.slice(-2)}${random}`;
    };

    const certificateNumber = previewData?.professional_certificate?.certificate_number ||
                             generateCertificateNumber();

    // Get certifier type to determine which company info to use for Box 2
    const certifierType = previewData?.professional_certificate?.certifier?.type ||
                         previewData?.professional_certificate?.certifier_type ||
                         'EXPORTER';

    // ✅ FIX Box 2: Use company information based on certifier_type, NOT signatory name
    // Box 2 should ALWAYS show company info (exporter/importer/producer), never the individual signer's name
    let certifierInfo = {};
    if (certifierType === 'IMPORTER') {
      certifierInfo = {
        certifier_name: previewData?.professional_certificate?.importer?.name || '',
        certifier_address: previewData?.professional_certificate?.importer?.address || '',
        certifier_country: previewData?.professional_certificate?.importer?.country || '',
        certifier_phone: previewData?.professional_certificate?.importer?.phone || '',
        certifier_email: previewData?.professional_certificate?.importer?.email || '',
        certifier_tax_id: previewData?.professional_certificate?.importer?.tax_id || ''
      };
    } else if (certifierType === 'PRODUCER') {
      certifierInfo = {
        certifier_name: previewData?.professional_certificate?.producer?.name || '',
        certifier_address: previewData?.professional_certificate?.producer?.address || '',
        certifier_country: previewData?.professional_certificate?.producer?.country || '',
        certifier_phone: previewData?.professional_certificate?.producer?.phone || '',
        certifier_email: previewData?.professional_certificate?.producer?.email || '',
        certifier_tax_id: previewData?.professional_certificate?.producer?.tax_id || ''
      };
    } else {
      // Default: EXPORTER
      certifierInfo = {
        certifier_name: previewData?.professional_certificate?.exporter?.name || '',
        certifier_address: previewData?.professional_certificate?.exporter?.address || '',
        certifier_country: previewData?.professional_certificate?.exporter?.country || '',
        certifier_phone: previewData?.professional_certificate?.exporter?.phone || '',
        certifier_email: previewData?.professional_certificate?.exporter?.email || '',
        certifier_tax_id: previewData?.professional_certificate?.exporter?.tax_id || ''
      };
    }

    return {
      // ✅ CRITICAL: Unique Certificate Number (primary key for legal compliance)
      certificate_number: certificateNumber,

      // Section 1: Certifier Type
      certifier_type: certifierType,
      blanket_from: previewData?.professional_certificate?.blanket_period?.start_date || '',
      blanket_to: previewData?.professional_certificate?.blanket_period?.end_date || '',

      // Section 2: Certifier (COMPANY info based on certifier_type)
      ...certifierInfo,

      // Section 3: Exporter
      exporter_name: previewData?.professional_certificate?.exporter?.name || '',
      exporter_address: previewData?.professional_certificate?.exporter?.address || '',
      exporter_country: previewData?.professional_certificate?.exporter?.country || '',
      exporter_phone: previewData?.professional_certificate?.exporter?.phone || '',
      exporter_email: previewData?.professional_certificate?.exporter?.email || '',
      exporter_tax_id: previewData?.professional_certificate?.exporter?.tax_id || '',

      // Section 4: Producer
      producer_name: previewData?.professional_certificate?.producer?.name || '',
      producer_address: previewData?.professional_certificate?.producer?.address || '',
      producer_country: previewData?.professional_certificate?.producer?.country || '',
      producer_phone: previewData?.professional_certificate?.producer?.phone || '',
      producer_email: previewData?.professional_certificate?.producer?.email || '',
      producer_tax_id: previewData?.professional_certificate?.producer?.tax_id || '',

      // Section 5: Importer
      importer_name: previewData?.professional_certificate?.importer?.name || '',
      importer_address: previewData?.professional_certificate?.importer?.address || '',
      importer_country: previewData?.professional_certificate?.importer?.country || '',
      importer_phone: previewData?.professional_certificate?.importer?.phone || '',
      importer_email: previewData?.professional_certificate?.importer?.email || '',
      importer_tax_id: previewData?.professional_certificate?.importer?.tax_id || '',

      // Section 6-11: Product Details
      product_description: previewData?.professional_certificate?.product?.description || '',
      hs_code: previewData?.professional_certificate?.hs_classification?.code || '',
      origin_criterion: previewData?.professional_certificate?.preference_criterion || 'B',
      is_producer: previewData?.professional_certificate?.producer_declaration?.is_producer || false,
      qualification_method: previewData?.professional_certificate?.qualification_method?.method || 'RVC',
      country_of_origin: previewData?.professional_certificate?.country_of_origin || '',

      // Components
      components: previewData?.professional_certificate?.components || [],

      // Section 12: Authorization
      signatory_name: previewData?.professional_certificate?.authorization?.signatory_name || '',
      signatory_title: previewData?.professional_certificate?.authorization?.signatory_title || '',
      signature_date: previewData?.professional_certificate?.authorization?.signature_date ?
        new Date(previewData.professional_certificate.authorization.signature_date).toISOString().split('T')[0] :
        new Date().toISOString().split('T')[0],
      signatory_phone: previewData?.professional_certificate?.authorization?.signatory_phone || '',
      signatory_email: previewData?.professional_certificate?.authorization?.signatory_email || '',

      // User Acceptance
      user_accepts_responsibility: false,
      user_confirms_accuracy: false
    };
  });

  // ✅ FIX: Update editedCert when previewData changes (async data arrives after mount)
  useEffect(() => {
    console.log('🔍 [DEBUG] useEffect triggered');
    console.log('🔍 [DEBUG] previewData:', previewData);
    console.log('🔍 [DEBUG] previewData?.professional_certificate:', previewData?.professional_certificate);

    if (!previewData?.professional_certificate) {
      console.log('❌ [DEBUG] No professional_certificate data - exiting useEffect');
      return;
    }

    console.log('🔄 Updating certificate state with preview data');
    console.log('🔍 [DEBUG] Exporter data:', previewData.professional_certificate.exporter);
    console.log('🔍 [DEBUG] Importer data:', previewData.professional_certificate.importer);
    console.log('🔍 [DEBUG] Product data:', previewData.professional_certificate.product);
    console.log('🔍 [DEBUG] Authorization data:', previewData.professional_certificate.authorization);

    // Get certifier type to determine which company info to use for Box 2
    const certifierType = previewData?.professional_certificate?.certifier?.type ||
                         previewData?.professional_certificate?.certifier_type ||
                         'EXPORTER';

    // Box 2: Use company information based on certifier_type
    let certifierInfo = {};
    if (certifierType === 'IMPORTER') {
      certifierInfo = {
        certifier_name: previewData?.professional_certificate?.importer?.name || '',
        certifier_address: previewData?.professional_certificate?.importer?.address || '',
        certifier_country: previewData?.professional_certificate?.importer?.country || '',
        certifier_phone: previewData?.professional_certificate?.importer?.phone || '',
        certifier_email: previewData?.professional_certificate?.importer?.email || '',
        certifier_tax_id: previewData?.professional_certificate?.importer?.tax_id || ''
      };
    } else if (certifierType === 'PRODUCER') {
      certifierInfo = {
        certifier_name: previewData?.professional_certificate?.producer?.name || '',
        certifier_address: previewData?.professional_certificate?.producer?.address || '',
        certifier_country: previewData?.professional_certificate?.producer?.country || '',
        certifier_phone: previewData?.professional_certificate?.producer?.phone || '',
        certifier_email: previewData?.professional_certificate?.producer?.email || '',
        certifier_tax_id: previewData?.professional_certificate?.producer?.tax_id || ''
      };
    } else {
      // Default: EXPORTER
      certifierInfo = {
        certifier_name: previewData?.professional_certificate?.exporter?.name || '',
        certifier_address: previewData?.professional_certificate?.exporter?.address || '',
        certifier_country: previewData?.professional_certificate?.exporter?.country || '',
        certifier_phone: previewData?.professional_certificate?.exporter?.phone || '',
        certifier_email: previewData?.professional_certificate?.exporter?.email || '',
        certifier_tax_id: previewData?.professional_certificate?.exporter?.tax_id || ''
      };
    }

    // ✅ Generate certificate number if not already present
    const generateCertificateNumber = () => {
      const year = new Date().getFullYear();
      const timestamp = Date.now().toString(36).toUpperCase();
      const random = Math.random().toString(36).substring(2, 6).toUpperCase();
      return `USMCA-${year}-${timestamp.slice(-2)}${random}`;
    };

    const certificateNumber = previewData?.professional_certificate?.certificate_number ||
                             generateCertificateNumber();

    setEditedCert({
      // ✅ CRITICAL: Preserve certificate number across updates
      certificate_number: certificateNumber,

      certifier_type: certifierType,
      blanket_from: previewData?.professional_certificate?.blanket_period?.start_date || '',
      blanket_to: previewData?.professional_certificate?.blanket_period?.end_date || '',
      ...certifierInfo,
      exporter_name: previewData?.professional_certificate?.exporter?.name || '',
      exporter_address: previewData?.professional_certificate?.exporter?.address || '',
      exporter_country: previewData?.professional_certificate?.exporter?.country || '',
      exporter_phone: previewData?.professional_certificate?.exporter?.phone || '',
      exporter_email: previewData?.professional_certificate?.exporter?.email || '',
      exporter_tax_id: previewData?.professional_certificate?.exporter?.tax_id || '',
      producer_name: previewData?.professional_certificate?.producer?.name || '',
      producer_address: previewData?.professional_certificate?.producer?.address || '',
      producer_country: previewData?.professional_certificate?.producer?.country || '',
      producer_phone: previewData?.professional_certificate?.producer?.phone || '',
      producer_email: previewData?.professional_certificate?.producer?.email || '',
      producer_tax_id: previewData?.professional_certificate?.producer?.tax_id || '',
      importer_name: previewData?.professional_certificate?.importer?.name || '',
      importer_address: previewData?.professional_certificate?.importer?.address || '',
      importer_country: previewData?.professional_certificate?.importer?.country || '',
      importer_phone: previewData?.professional_certificate?.importer?.phone || '',
      importer_email: previewData?.professional_certificate?.importer?.email || '',
      importer_tax_id: previewData?.professional_certificate?.importer?.tax_id || '',
      product_description: previewData?.professional_certificate?.product?.description || '',
      hs_code: previewData?.professional_certificate?.hs_classification?.code || '',
      origin_criterion: previewData?.professional_certificate?.preference_criterion || 'B',
      is_producer: previewData?.professional_certificate?.producer_declaration?.is_producer || false,
      qualification_method: previewData?.professional_certificate?.qualification_method?.method || 'RVC',
      country_of_origin: previewData?.professional_certificate?.country_of_origin || '',
      components: previewData?.professional_certificate?.components || [],
      signatory_name: previewData?.professional_certificate?.authorization?.signatory_name || '',
      signatory_title: previewData?.professional_certificate?.authorization?.signatory_title || '',
      signature_date: previewData?.professional_certificate?.authorization?.signature_date ?
        new Date(previewData.professional_certificate.authorization.signature_date).toISOString().split('T')[0] :
        new Date().toISOString().split('T')[0],
      signatory_phone: previewData?.professional_certificate?.authorization?.signatory_phone || '',
      signatory_email: previewData?.professional_certificate?.authorization?.signatory_email || '',
      user_accepts_responsibility: false,
      user_confirms_accuracy: false
    });

    console.log('✅ Certificate state updated with all fields');
  }, [previewData]);

  const handleFieldChange = (field, value) => {
    // Prevent editing for Trial users
    if (isTrialUser && field !== 'user_accepts_responsibility' && field !== 'user_confirms_accuracy') {
      console.log('⚠️ Trial users cannot edit certificate fields. Please upgrade to Professional.');
      return;
    }
    setEditedCert(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleComponentChange = (index, field, value) => {
    // Prevent editing for Trial users
    if (isTrialUser) {
      console.log('⚠️ Trial users cannot edit certificate fields. Please upgrade to Professional.');
      return;
    }
    const updated = [...editedCert.components];
    updated[index] = { ...updated[index], [field]: value };
    setEditedCert(prev => ({ ...prev, components: updated }));
  };

  const handleAddComponent = () => {
    if (isTrialUser) {
      console.log('⚠️ Trial users cannot add components. Please upgrade to Professional.');
      return;
    }
    setEditedCert(prev => ({
      ...prev,
      components: [
        ...prev.components,
        {
          description: '',
          hs_code: '',
          origin_criterion: 'B',
          is_producer: false,
          qualification_method: 'RVC',
          country_of_origin: ''
        }
      ]
    }));
  };

  const handleRemoveComponent = (index) => {
    if (isTrialUser) {
      console.log('⚠️ Trial users cannot remove components. Please upgrade to Professional.');
      return;
    }
    setEditedCert(prev => ({
      ...prev,
      components: prev.components.filter((_, i) => i !== index)
    }));
  };

  const handleSave = () => {
    if (!editedCert.user_accepts_responsibility) {
      alert('❌ You must confirm that you accept responsibility for the accuracy of this certificate');
      return;
    }
    if (!editedCert.user_confirms_accuracy) {
      alert('❌ You must confirm that all information is accurate and complete');
      return;
    }

    const updatedData = {
      ...previewData.professional_certificate,
      // ✅ CRITICAL: Include certificate number for audit trail
      certificate_number: editedCert.certificate_number,

      // ✅ Certifier type and blanket period (Section 1)
      certifier_type: editedCert.certifier_type,
      blanket_period: {
        start_date: editedCert.blanket_from,
        end_date: editedCert.blanket_to,
        from: editedCert.blanket_from,  // Keep for backward compatibility
        to: editedCert.blanket_to       // Keep for backward compatibility
      },

      // Section 2: Certifier
      certifier: {
        type: editedCert.certifier_type,
        name: editedCert.certifier_name,
        address: editedCert.certifier_address,
        country: editedCert.certifier_country,
        phone: editedCert.certifier_phone,
        email: editedCert.certifier_email,
        tax_id: editedCert.certifier_tax_id
      },

      // Section 3: Exporter
      exporter: {
        name: editedCert.exporter_name,
        address: editedCert.exporter_address,
        country: editedCert.exporter_country,
        phone: editedCert.exporter_phone,
        email: editedCert.exporter_email,
        tax_id: editedCert.exporter_tax_id
      },

      // Section 4: Producer
      producer: {
        name: editedCert.producer_name,
        address: editedCert.producer_address,
        country: editedCert.producer_country,
        phone: editedCert.producer_phone,
        email: editedCert.producer_email,
        tax_id: editedCert.producer_tax_id,
        same_as_exporter: editedCert.producer_same_as_exporter
      },

      // Section 5: Importer
      importer: {
        name: editedCert.importer_name,
        address: editedCert.importer_address,
        country: editedCert.importer_country,
        phone: editedCert.importer_phone,
        email: editedCert.importer_email,
        tax_id: editedCert.importer_tax_id
      },

      // Sections 6-11: Product information
      product: {
        description: editedCert.product_description,
        hs_code: editedCert.hs_code
      },
      hs_classification: {
        code: editedCert.hs_code
      },
      preference_criterion: editedCert.origin_criterion,
      producer_declaration: {
        is_producer: editedCert.is_producer
      },
      qualification_method: {
        method: editedCert.qualification_method
      },
      country_of_origin: editedCert.country_of_origin,

      // Components (if multiple products)
      components: editedCert.components,

      // Section 12: Authorization
      authorization: {
        signatory_name: editedCert.signatory_name,
        signatory_title: editedCert.signatory_title,
        signature_date: editedCert.signature_date,
        signatory_phone: editedCert.signatory_phone,
        signatory_email: editedCert.signatory_email
      }
    };

    console.log('💾 Saving ALL certificate edits to database...');
    onSave(updatedData);
    console.log('✅ Certificate edits saved successfully');
  };

  const handleDownloadPDF = async () => {
    // First validate
    if (!editedCert.user_accepts_responsibility) {
      alert('❌ You must confirm that you accept responsibility for the accuracy of this certificate');
      return;
    }
    if (!editedCert.user_confirms_accuracy) {
      alert('❌ You must confirm that all information is accurate and complete');
      return;
    }

    console.log('📄 PDF DOWNLOAD STARTING - Using working PDF generator with measured coordinates...');

    try {
      // ✅ STEP 1: Save all edits to database BEFORE generating PDF
      const updatedData = {
        ...previewData.professional_certificate,
        certificate_number: editedCert.certificate_number,
        certifier_type: editedCert.certifier_type,
        blanket_period: {
          start_date: editedCert.blanket_from,
          end_date: editedCert.blanket_to,
          from: editedCert.blanket_from,  // Keep for backward compatibility
          to: editedCert.blanket_to       // Keep for backward compatibility
        },
        certifier: {
          type: editedCert.certifier_type,
          name: editedCert.certifier_name,
          address: editedCert.certifier_address,
          country: editedCert.certifier_country,
          phone: editedCert.certifier_phone,
          email: editedCert.certifier_email,
          tax_id: editedCert.certifier_tax_id
        },
        exporter: {
          name: editedCert.exporter_name,
          address: editedCert.exporter_address,
          country: editedCert.exporter_country,
          phone: editedCert.exporter_phone,
          email: editedCert.exporter_email,
          tax_id: editedCert.exporter_tax_id
        },
        producer: {
          name: editedCert.producer_name,
          address: editedCert.producer_address,
          country: editedCert.producer_country,
          phone: editedCert.producer_phone,
          email: editedCert.producer_email,
          tax_id: editedCert.producer_tax_id,
          same_as_exporter: editedCert.producer_same_as_exporter
        },
        importer: {
          name: editedCert.importer_name,
          address: editedCert.importer_address,
          country: editedCert.importer_country,
          phone: editedCert.importer_phone,
          email: editedCert.importer_email,
          tax_id: editedCert.importer_tax_id
        },
        product: {
          description: editedCert.product_description,
          hs_code: editedCert.hs_code
        },
        hs_classification: {
          code: editedCert.hs_code
        },
        preference_criterion: editedCert.origin_criterion,
        producer_declaration: {
          is_producer: editedCert.is_producer
        },
        qualification_method: {
          method: editedCert.qualification_method
        },
        country_of_origin: editedCert.country_of_origin,
        components: editedCert.components,
        authorization: {
          signatory_name: editedCert.signatory_name,
          signatory_title: editedCert.signatory_title,
          signature_date: editedCert.signature_date,
          signatory_phone: editedCert.signatory_phone,
          signatory_email: editedCert.signatory_email
        }
      };

      console.log('💾 Saving ALL edits to database before PDF generation...');
      onSave(updatedData);

      // ✅ STEP 2: Prepare certificate data for PDF generator
      const certificateData = {
        certificate_number: editedCert.certificate_number,
        certifier: {
          type: editedCert.certifier_type,
          name: editedCert.certifier_name,
          address: editedCert.certifier_address,
          country: editedCert.certifier_country,
          phone: editedCert.certifier_phone,
          email: editedCert.certifier_email,
          tax_id: editedCert.certifier_tax_id
        },
        exporter: {
          name: editedCert.exporter_name,
          address: editedCert.exporter_address,
          country: editedCert.exporter_country,
          phone: editedCert.exporter_phone,
          email: editedCert.exporter_email,
          tax_id: editedCert.exporter_tax_id
        },
        producer: {
          name: editedCert.producer_name,
          address: editedCert.producer_address,
          country: editedCert.producer_country,
          phone: editedCert.producer_phone,
          email: editedCert.producer_email,
          tax_id: editedCert.producer_tax_id,
          same_as_exporter: editedCert.producer_same_as_exporter
        },
        importer: {
          name: editedCert.importer_name,
          address: editedCert.importer_address,
          country: editedCert.importer_country,
          phone: editedCert.importer_phone,
          email: editedCert.importer_email,
          tax_id: editedCert.importer_tax_id
        },
        product: {
          description: editedCert.product_description,
          hs_code: editedCert.hs_code
        },
        preference_criterion: editedCert.origin_criterion,
        producer_declaration: {
          is_producer: editedCert.is_producer
        },
        qualification_method: {
          method: editedCert.qualification_method
        },
        country_of_origin: editedCert.country_of_origin,
        blanket_period: {
          start_date: editedCert.blanket_from,
          end_date: editedCert.blanket_to,
          from: editedCert.blanket_from,  // Keep for backward compatibility
          to: editedCert.blanket_to       // Keep for backward compatibility
        },
        authorization: {
          signatory_name: editedCert.signatory_name,
          signatory_title: editedCert.signatory_title,
          signature_date: editedCert.signature_date,
          phone: editedCert.signatory_phone,
          email: editedCert.signatory_email
        }
      };

      console.log('📄 Generating PDF with working generator (measured coordinates)...');

      // ✅ STEP 3: Generate PDF using working generator with measured coordinates (async)
      const blob = await generateUSMCACertificatePDF(certificateData, {
        watermark: isTrialUser,
        userTier: userTier
      });

      // ✅ STEP 4: Download the PDF blob
      const filename = `USMCA-Certificate-${editedCert.certificate_number}-${new Date().toISOString().split('T')[0]}.pdf`;

      // Create download link for blob
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log(`✅ PDF downloaded successfully: ${filename}`);
    } catch (error) {
      console.error('❌ PDF download failed:', error);
      alert('Failed to download PDF. Please try again.');
    }
  };

  const inputStyle = {
    backgroundColor: '#e8f4f8',
    border: '1px solid #999',
    padding: '4px 6px',
    fontSize: '10px',
    fontFamily: 'Arial, sans-serif',
    width: '100%',
    boxSizing: 'border-box',
    whiteSpace: 'pre-wrap',
    wordWrap: 'break-word',
    overflowWrap: 'break-word'
  };

  const labelStyle = {
    fontSize: '8px',
    fontWeight: 'bold',
    color: '#333'
  };

  return (
    <div className="element-spacing">
      {/* ⚠️ CRITICAL: USER RESPONSIBILITY DISCLAIMER - TOP */}
      <div style={{
        backgroundColor: '#fef3c7',
        border: '3px solid #f59e0b',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '20px'
      }}>
        <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#92400e', marginBottom: '8px' }}>
          ⚠️ CRITICAL: TOOL-ONLY PLATFORM - USER RESPONSIBILITY REQUIRED
        </div>
        <div style={{ fontSize: '12px', color: '#b45309', lineHeight: '1.6' }}>
          <div style={{ marginBottom: '8px' }}>
            <strong>You are responsible for the accuracy of every field on this certificate:</strong>
          </div>
          <ul style={{ marginLeft: '20px', marginBottom: '8px' }}>
            <li>Edit any fields that are incorrect</li>
            <li>AI suggestions are shown for reference - YOU make final decisions</li>
            <li>Verify all data matches your business records</li>
            <li>Maintain supporting documentation for CBP audits</li>
            <li>⚠️ Consult a trade attorney before submitting to customs</li>
            <li>Platform and Triangle Intelligence are NOT liable for certificate accuracy</li>
          </ul>
          <div style={{ fontWeight: 'bold', color: '#dc2626' }}>
            YOU sign this. YOU certify accuracy. YOU assume legal liability.
          </div>
        </div>
      </div>

      {isTrialUser && (
        <div className="alert alert-warning" style={{ marginBottom: '16px' }}>
          <div className="alert-title">⚠️ FREE TRIAL PREVIEW - READ-ONLY & WATERMARKED</div>
          <div className="text-body">
            This is a <strong>READ-ONLY PREVIEW</strong> for free trial users. Download and editing features require a paid subscription.
            <br /><br />
            <strong>Free Trial users can:</strong> View certificate structure, verify accuracy, preview layout
            <br />
            <strong>Paid users can:</strong> Edit all fields, download clean certificates (no watermark), manage custom components, receive crisis alerts
            <br /><br />
            <strong>Our Plans:</strong>
            <br />
            • <strong>Starter</strong> ($99/month): 10 analyses + certificate generation + basic alerts
            <br />
            • <strong>Professional</strong> ($299/month): 100 analyses + real-time alerts + priority support
            <br />
            • <strong>Premium</strong> ($599/month): Everything + quarterly strategy calls with our team
            <br /><br />
            <a href="/pricing" style={{color: '#2563eb', textDecoration: 'underline', fontWeight: 'bold'}}>👉 Upgrade to Starter Today ($99/month)</a>
          </div>
        </div>
      )}

      {/* Official USMCA Certificate Form - Exact Layout from US Template */}
      <div id="certificate-preview-for-pdf" style={{
        border: '3px solid #000',
        backgroundColor: '#fff',
        fontFamily: 'Arial, sans-serif',
        fontSize: '11px',
        maxWidth: '900px',
        margin: '0 auto',
        // Allow page breaks for long certificates
        // pageBreakInside: 'avoid', // Removed to allow multi-page PDFs
        // Add watermark for free trial users
        position: 'relative',
        ...(isTrialUser && {
          background: 'repeating-linear-gradient(45deg, #fff, #fff 50px, rgba(239, 68, 68, 0.03) 50px, rgba(239, 68, 68, 0.03) 100px)',
          border: '3px solid #fee2e2'
        })
      }}>
        {/* WATERMARK for free users */}
        {isTrialUser && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%) rotate(-45deg)',
            fontSize: '72px',
            fontWeight: 'bold',
            color: 'rgba(239, 68, 68, 0.08)',
            pointerEvents: 'none',
            zIndex: 10,
            width: '200%',
            textAlign: 'center',
            fontFamily: 'Arial, sans-serif',
            letterSpacing: '20px'
          }}>
            TRIAL - NOT OFFICIAL
          </div>
        )}
        {/* Header */}
        <div style={{
          textAlign: 'center',
          borderBottom: '2px solid #000',
          padding: '12px',
          fontSize: '12px',
          position: 'relative'
        }}>
          <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '2px' }}>
            UNITED STATES MEXICO CANADA AGREEMENT (USMCA)
          </div>
          <div style={{ fontWeight: 'bold', fontSize: '12px' }}>
            CERTIFICATION OF ORIGIN
          </div>
          {/* ✅ Certificate Number - Top Right */}
          <div style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            fontSize: '10px',
            fontWeight: 'bold',
            color: '#000',
            border: '2px solid #000',
            padding: '4px 8px',
            backgroundColor: '#fff'
          }}>
            {editedCert.certificate_number}
          </div>
        </div>

        {/* Section 1: Certifier Type & Blanket Period */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'auto 1fr auto auto auto auto',
          borderBottom: '2px solid #000',
          fontSize: '9px'
        }}>
          {/* Certifier Type */}
          <div style={{ borderRight: '1px solid #000', padding: '8px', minWidth: '180px' }}>
            <div style={labelStyle}>1. CERTIFIER TYPE (INDICATE "X")</div>
            <div style={{ marginTop: '4px' }}>
              <label style={{ display: 'flex', gap: '4px', marginBottom: '3px' }}>
                <input
                  type="checkbox"
                  checked={editedCert.certifier_type === 'IMPORTER'}
                  onChange={() => handleFieldChange('certifier_type', 'IMPORTER')}
                />
                IMPORTER
              </label>
              <label style={{ display: 'flex', gap: '4px', marginBottom: '3px' }}>
                <input
                  type="checkbox"
                  checked={editedCert.certifier_type === 'EXPORTER'}
                  onChange={() => handleFieldChange('certifier_type', 'EXPORTER')}
                />
                EXPORTER
              </label>
              <label style={{ display: 'flex', gap: '4px' }}>
                <input
                  type="checkbox"
                  checked={editedCert.certifier_type === 'PRODUCER'}
                  onChange={() => handleFieldChange('certifier_type', 'PRODUCER')}
                />
                PRODUCER
              </label>
            </div>
          </div>

          {/* Blanket Period */}
          <div style={{ borderLeft: '1px solid #999', padding: '8px', minWidth: '160px', backgroundColor: '#f9fafb' }}>
            <div style={{ ...labelStyle, marginBottom: '4px', fontSize: '9px', fontWeight: 'bold' }}>
              BLANKET PERIOD<br />(MM/DD/YYYY)
            </div>
            <div style={{ fontSize: '7px', fontWeight: 'bold', marginTop: '6px' }}>FROM:</div>
            <input
              type="text"
              placeholder="01/01/2025"
              value={editedCert.blanket_from || ''}
              onChange={(e) => handleFieldChange('blanket_from', e.target.value)}
              disabled={isTrialUser}
              style={{
                ...inputStyle,
                marginBottom: '6px',
                fontSize: '9px',
                padding: '4px',
                width: '100%'
              }}
            />
            <div style={{ fontSize: '7px', fontWeight: 'bold' }}>TO:</div>
            <input
              type="text"
              placeholder="12/31/2025"
              value={editedCert.blanket_to || ''}
              onChange={(e) => handleFieldChange('blanket_to', e.target.value)}
              disabled={isTrialUser}
              style={{
                ...inputStyle,
                fontSize: '9px',
                padding: '4px',
                width: '100%'
              }}
            />
          </div>
        </div>

        {/* Sections 2-5: Certifier, Exporter, Producer, Importer - 2x2 Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          borderBottom: '2px solid #000'
        }}>
          {/* Section 2: Certifier */}
          <div style={{ borderRight: '1px solid #000', borderBottom: '1px solid #000', padding: '8px' }}>
            <div style={labelStyle}>2. CERTIFIER NAME, ADDRESS, PHONE, AND EMAIL</div>
            <div style={{ fontSize: '8px', marginTop: '3px' }}>NAME</div>
            <input type="text" disabled={isTrialUser} readOnly={isTrialUser} value={editedCert.certifier_name} onChange={(e) => handleFieldChange('certifier_name', e.target.value)} style={{ ...inputStyle, marginBottom: '3px', opacity: isTrialUser ? 0.6 : 1, cursor: isTrialUser ? 'not-allowed' : 'text' }} />
            <div style={{ fontSize: '8px' }}>ADDRESS</div>
            <input type="text" disabled={isTrialUser} readOnly={isTrialUser} value={editedCert.certifier_address} onChange={(e) => handleFieldChange('certifier_address', e.target.value)} style={{ ...inputStyle, marginBottom: '3px' }} />
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '8px' }}>COUNTRY</div>
                <input type="text" disabled={isTrialUser} readOnly={isTrialUser} value={editedCert.certifier_country} onChange={(e) => handleFieldChange('certifier_country', e.target.value)} style={inputStyle} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '8px' }}>PHONE</div>
                <input type="text" disabled={isTrialUser} readOnly={isTrialUser} value={editedCert.certifier_phone} onChange={(e) => handleFieldChange('certifier_phone', e.target.value)} style={inputStyle} />
              </div>
            </div>
            <div style={{ fontSize: '8px', marginTop: '3px' }}>EMAIL</div>
            <input type="text" disabled={isTrialUser} readOnly={isTrialUser} value={editedCert.certifier_email} onChange={(e) => handleFieldChange('certifier_email', e.target.value)} style={{ ...inputStyle, marginBottom: '3px' }} />
            <div style={{ fontSize: '8px' }}>TAX IDENTIFICATION NUMBER</div>
            <input type="text" disabled={isTrialUser} readOnly={isTrialUser} value={editedCert.certifier_tax_id} onChange={(e) => handleFieldChange('certifier_tax_id', e.target.value)} style={inputStyle} />
          </div>

          {/* Section 3: Exporter */}
          <div style={{ borderBottom: '1px solid #000', padding: '8px' }}>
            <div style={labelStyle}>3. EXPORTER NAME, ADDRESS, PHONE, AND EMAIL</div>
            <div style={{ fontSize: '8px', marginTop: '3px' }}>NAME</div>
            <input type="text" disabled={isTrialUser} readOnly={isTrialUser} value={editedCert.exporter_name} onChange={(e) => handleFieldChange('exporter_name', e.target.value)} style={{ ...inputStyle, marginBottom: '3px' }} />
            <div style={{ fontSize: '8px' }}>ADDRESS</div>
            <input type="text" disabled={isTrialUser} readOnly={isTrialUser} value={editedCert.exporter_address} onChange={(e) => handleFieldChange('exporter_address', e.target.value)} style={{ ...inputStyle, marginBottom: '3px' }} />
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '8px' }}>COUNTRY</div>
                <input type="text" disabled={isTrialUser} readOnly={isTrialUser} value={editedCert.exporter_country} onChange={(e) => handleFieldChange('exporter_country', e.target.value)} style={inputStyle} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '8px' }}>PHONE</div>
                <input type="text" disabled={isTrialUser} readOnly={isTrialUser} value={editedCert.exporter_phone} onChange={(e) => handleFieldChange('exporter_phone', e.target.value)} style={inputStyle} />
              </div>
            </div>
            <div style={{ fontSize: '8px', marginTop: '3px' }}>EMAIL</div>
            <input type="text" disabled={isTrialUser} readOnly={isTrialUser} value={editedCert.exporter_email} onChange={(e) => handleFieldChange('exporter_email', e.target.value)} style={{ ...inputStyle, marginBottom: '3px' }} />
            <div style={{ fontSize: '8px' }}>TAX IDENTIFICATION NUMBER</div>
            <input type="text" disabled={isTrialUser} readOnly={isTrialUser} value={editedCert.exporter_tax_id} onChange={(e) => handleFieldChange('exporter_tax_id', e.target.value)} style={inputStyle} />
          </div>

          {/* Section 4: Producer */}
          <div style={{ borderRight: '1px solid #000', padding: '8px' }}>
            <div style={labelStyle}>4. PRODUCER NAME, ADDRESS, PHONE, AND EMAIL</div>
            <div style={{ fontSize: '8px', marginTop: '3px' }}>NAME</div>
            <input type="text" disabled={isTrialUser} readOnly={isTrialUser} value={editedCert.producer_name} onChange={(e) => handleFieldChange('producer_name', e.target.value)} style={{ ...inputStyle, marginBottom: '3px' }} />
            <div style={{ fontSize: '8px' }}>ADDRESS</div>
            <input type="text" disabled={isTrialUser} readOnly={isTrialUser} value={editedCert.producer_address} onChange={(e) => handleFieldChange('producer_address', e.target.value)} style={{ ...inputStyle, marginBottom: '3px' }} />
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '8px' }}>COUNTRY</div>
                <input type="text" disabled={isTrialUser} readOnly={isTrialUser} value={editedCert.producer_country} onChange={(e) => handleFieldChange('producer_country', e.target.value)} style={inputStyle} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '8px' }}>PHONE</div>
                <input type="text" disabled={isTrialUser} readOnly={isTrialUser} value={editedCert.producer_phone} onChange={(e) => handleFieldChange('producer_phone', e.target.value)} style={inputStyle} />
              </div>
            </div>
            <div style={{ fontSize: '8px', marginTop: '3px' }}>EMAIL</div>
            <input type="text" disabled={isTrialUser} readOnly={isTrialUser} value={editedCert.producer_email} onChange={(e) => handleFieldChange('producer_email', e.target.value)} style={{ ...inputStyle, marginBottom: '3px' }} />
            <div style={{ fontSize: '8px' }}>TAX IDENTIFICATION NUMBER</div>
            <input type="text" disabled={isTrialUser} readOnly={isTrialUser} value={editedCert.producer_tax_id} onChange={(e) => handleFieldChange('producer_tax_id', e.target.value)} style={inputStyle} />
          </div>

          {/* Section 5: Importer */}
          <div style={{ padding: '8px' }}>
            <div style={labelStyle}>5. IMPORTER NAME, ADDRESS, PHONE, AND EMAIL</div>
            <div style={{ fontSize: '8px', marginTop: '3px' }}>NAME</div>
            <input type="text" disabled={isTrialUser} readOnly={isTrialUser} value={editedCert.importer_name} onChange={(e) => handleFieldChange('importer_name', e.target.value)} style={{ ...inputStyle, marginBottom: '3px' }} />
            <div style={{ fontSize: '8px' }}>ADDRESS</div>
            <input type="text" disabled={isTrialUser} readOnly={isTrialUser} value={editedCert.importer_address} onChange={(e) => handleFieldChange('importer_address', e.target.value)} style={{ ...inputStyle, marginBottom: '3px' }} />
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '8px' }}>COUNTRY</div>
                <input type="text" disabled={isTrialUser} readOnly={isTrialUser} value={editedCert.importer_country} onChange={(e) => handleFieldChange('importer_country', e.target.value)} style={inputStyle} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '8px' }}>PHONE</div>
                <input type="text" disabled={isTrialUser} readOnly={isTrialUser} value={editedCert.importer_phone} onChange={(e) => handleFieldChange('importer_phone', e.target.value)} style={inputStyle} />
              </div>
            </div>
            <div style={{ fontSize: '8px', marginTop: '3px' }}>EMAIL</div>
            <input type="text" disabled={isTrialUser} readOnly={isTrialUser} value={editedCert.importer_email} onChange={(e) => handleFieldChange('importer_email', e.target.value)} style={{ ...inputStyle, marginBottom: '3px' }} />
            <div style={{ fontSize: '8px' }}>TAX IDENTIFICATION NUMBER</div>
            <input type="text" disabled={isTrialUser} readOnly={isTrialUser} value={editedCert.importer_tax_id} onChange={(e) => handleFieldChange('importer_tax_id', e.target.value)} style={inputStyle} />
          </div>
        </div>

        {/* Sections 6-11: Product Details Table */}
        <div style={{ borderBottom: '2px solid #000' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px' }}>
            <thead>
              <tr style={{ backgroundColor: '#fff' }}>
                <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'left', fontWeight: 'bold', width: '40%', fontSize: '8px' }}>6. DESCRIPTION OF GOOD(S)</th>
                <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'center', fontWeight: 'bold', width: '12%', fontSize: '8px' }}>7. HTS</th>
                <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'center', fontWeight: 'bold', width: '12%', fontSize: '8px' }}>8. ORIGIN CRITERION</th>
                <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'center', fontWeight: 'bold', width: '8%', fontSize: '8px' }}>9. PRODUCER (YES/NO)</th>
                <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'center', fontWeight: 'bold', width: '15%', fontSize: '8px' }}>10. METHOD OF QUALIFICATION</th>
                <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'center', fontWeight: 'bold', width: '13%', fontSize: '8px' }}>11. COUNTRY OF ORIGIN</th>
              </tr>
            </thead>
            <tbody>
              {/* Only ONE product row per official USMCA certificate form (Field 6-11) */}
              {/* Components are reference data only, not displayed as separate rows on the main certificate */}
              <tr style={{ height: '120px' }}>
                <td style={{ border: '1px solid #000', padding: '6px', verticalAlign: 'top', overflow: 'auto' }}>
                  <textarea disabled={isTrialUser} readOnly={isTrialUser} value={editedCert.product_description} onChange={(e) => handleFieldChange('product_description', e.target.value)} style={{ ...inputStyle, minHeight: '100px', width: '100%', whiteSpace: 'pre-wrap', overflow: 'auto', resize: 'vertical', fontFamily: 'inherit' }} placeholder="Product description (e.g., Smartphone assembly with components including PCB, housing, etc.)" />
                </td>
                <td style={{ border: '1px solid #000', padding: '6px', verticalAlign: 'top' }}>
                  <input type="text" disabled={isTrialUser} readOnly={isTrialUser} value={editedCert.hs_code} onChange={(e) => handleFieldChange('hs_code', e.target.value)} style={inputStyle} placeholder="e.g., 8517.62" />
                </td>
                <td style={{ border: '1px solid #000', padding: '6px', verticalAlign: 'top' }}>
                  <select value={editedCert.origin_criterion} onChange={(e) => handleFieldChange('origin_criterion', e.target.value)} style={{ ...inputStyle, height: '24px' }}>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                  </select>
                </td>
                <td style={{ border: '1px solid #000', padding: '6px', verticalAlign: 'top', textAlign: 'center' }}>
                  <input type="text" disabled={isTrialUser} readOnly={isTrialUser} value={editedCert.is_producer ? "YES" : "NO"} onChange={(e) => handleFieldChange('is_producer', e.target.value.toUpperCase() === 'YES')} style={{ ...inputStyle, textAlign: 'center', width: '100%' }} placeholder="YES/NO" />
                </td>
                <td style={{ border: '1px solid #000', padding: '6px', verticalAlign: 'top' }}>
                  <input type="text" value={editedCert.qualification_method} onChange={(e) => handleFieldChange('qualification_method', e.target.value)} style={inputStyle} placeholder="TV/NC/TS/NO" />
                </td>
                <td style={{ border: '1px solid #000', padding: '6px', verticalAlign: 'top' }}>
                  <input type="text" value={editedCert.country_of_origin} onChange={(e) => handleFieldChange('country_of_origin', e.target.value)} style={inputStyle} placeholder="e.g., MX" />
                </td>
              </tr>
            </tbody>
          </table>
          <div style={{ padding: '8px', fontSize: '8px', fontStyle: 'italic', color: '#666', borderTop: '1px solid #000' }}>
            💡 NOTE: Only ONE product description and HS code per USMCA certificate form (per official US government template). Components are reference/backing data for compliance verification.
          </div>
        </div>

        {/* Certification Statement */}
        <div style={{ borderBottom: '2px solid #000', padding: '10px', fontSize: '9px', lineHeight: '1.4', minHeight: '50px' }}>
          I CERTIFY THAT THE GOODS DESCRIBED IN THIS DOCUMENT QUALIFY AS ORIGINATING AND THE INFORMATION CONTAINED IN THIS DOCUMENT IS TRUE AND ACCURATE. I ASSUME RESPONSIBILITY FOR PROVING SUCH REPRESENTATIONS AND AGREE TO MAINTAIN AND PRESENT UPON REQUEST OR TO MAKE AVAILABLE DURING A VERIFICATION VISIT, DOCUMENTATION NECESSARY TO SUPPORT THIS CERTIFICATION
        </div>

        {/* Section 12: Authorization */}
        <div style={{ borderBottom: '2px solid #000', padding: '8px' }}>
          <div style={{ fontSize: '9px', fontWeight: 'bold', marginBottom: '8px' }}>
            THIS CERTIFICATE CONSISTS OF <input type="text" style={{ width: '30px', ...inputStyle }} /> PAGES, INCLUDING ALL ATTACHMENTS.
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '8px' }}>
            <div style={{ borderRight: '1px solid #000', paddingRight: '8px' }}>
              <div style={labelStyle}>12a. AUTHORIZED SIGNATURE</div>
              <div style={{ border: '1px solid #000', minHeight: '40px', marginBottom: '8px', backgroundColor: '#fff' }}></div>
            </div>
            <div>
              <div style={labelStyle}>12b. COMPANY</div>
              <input type="text" disabled={isTrialUser} readOnly={isTrialUser} value={editedCert.exporter_name} onChange={(e) => handleFieldChange('exporter_name', e.target.value)} style={inputStyle} />
            </div>
            <div style={{ borderRight: '1px solid #000', paddingRight: '8px' }}>
              <div style={labelStyle}>12c. NAME</div>
              <input type="text" disabled={isTrialUser} readOnly={isTrialUser} value={editedCert.signatory_name} onChange={(e) => handleFieldChange('signatory_name', e.target.value)} style={inputStyle} />
            </div>
            <div>
              <div style={labelStyle}>12d. TITLE</div>
              <input type="text" disabled={isTrialUser} readOnly={isTrialUser} value={editedCert.signatory_title} onChange={(e) => handleFieldChange('signatory_title', e.target.value)} style={inputStyle} />
            </div>
            <div style={{ borderRight: '1px solid #000', paddingRight: '8px' }}>
              <div style={labelStyle}>12e. DATE (MM/DD/YYYY)</div>
              <input type="date" disabled={isTrialUser} readOnly={isTrialUser} value={editedCert.signature_date} onChange={(e) => handleFieldChange('signature_date', e.target.value)} style={inputStyle} />
            </div>
            <div>
              <div style={labelStyle}>12f. TELEPHONE NUMBER</div>
              <input type="text" disabled={isTrialUser} readOnly={isTrialUser} value={editedCert.signatory_phone} onChange={(e) => handleFieldChange('signatory_phone', e.target.value)} style={inputStyle} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={labelStyle}>12g. EMAIL</div>
              <input type="text" disabled={isTrialUser} readOnly={isTrialUser} value={editedCert.signatory_email} onChange={(e) => handleFieldChange('signatory_email', e.target.value)} style={inputStyle} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'right', padding: '8px', fontSize: '8px', fontWeight: 'bold' }}>
          USMCA CERTIFICATE V3
        </div>
      </div>

      {/* User Responsibility Checkboxes */}
      <div style={{
        backgroundColor: '#fef3c7',
        border: '3px solid #f59e0b',
        borderRadius: '8px',
        padding: '16px',
        marginTop: '20px',
        marginBottom: '20px'
      }}>
        <div style={{ fontWeight: 'bold', fontSize: '12px', color: '#92400e', marginBottom: '12px' }}>
          ⚠️ BEFORE YOU DOWNLOAD - FINAL CONFIRMATION REQUIRED
        </div>

        <label style={{ display: 'flex', gap: '8px', marginBottom: '12px', alignItems: 'flex-start' }}>
          <input
            type="checkbox"
            checked={editedCert.user_accepts_responsibility}
            onChange={(e) => handleFieldChange('user_accepts_responsibility', e.target.checked)}
            style={{ marginTop: '2px' }}
          />
          <div style={{ fontSize: '11px', color: '#b45309' }}>
            <strong>✓ I accept responsibility for accuracy</strong><br />
            <span style={{ fontSize: '10px' }}>All information on this certificate is my responsibility. I have verified every field.</span>
          </div>
        </label>

        <label style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
          <input
            type="checkbox"
            checked={editedCert.user_confirms_accuracy}
            onChange={(e) => handleFieldChange('user_confirms_accuracy', e.target.checked)}
            style={{ marginTop: '2px' }}
          />
          <div style={{ fontSize: '11px', color: '#b45309' }}>
            <strong>✓ All information matches my business records</strong><br />
            <span style={{ fontSize: '10px' }}>I confirm this certificate accurately represents my product and origin details.</span>
          </div>
        </label>
      </div>

      {/* Action Buttons */}
      <div style={{
        display: 'flex',
        gap: '12px',
        justifyContent: 'flex-end',
        marginTop: '20px',
        padding: '20px',
        backgroundColor: '#f3f4f6',
        borderRadius: '8px',
        border: '2px solid #3b82f6'
      }}>
        {/* Save to Database Button */}
        <button
          onClick={async () => {
            try {
              // Save certificate to database via workflow-session endpoint
              const response = await fetch('/api/workflow-session/update-certificate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                  certificate_data: editedCert,
                  professional_certificate: previewData.professional_certificate
                })
              });

              if (response.ok) {
                alert('✅ Certificate saved to database successfully!');
              } else {
                alert('⚠️ Failed to save certificate. Please try again.');
              }
            } catch (error) {
              console.error('Save error:', error);
              alert('❌ Error saving certificate. Please check your connection.');
            }
          }}
          style={{
            padding: '12px 24px',
            fontSize: '14px',
            backgroundColor: '#8b5cf6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          💾 Save to Database
        </button>

        {/* Set Up Alerts Button */}
        <button
          onClick={() => {
            // Save workflow data to localStorage for alerts page
            const alertData = {
              company: previewData.professional_certificate?.exporter || {},
              product: previewData.professional_certificate?.product || {},
              usmca: {
                qualified: true,
                regional_content: previewData.professional_certificate?.usmca_analysis?.regional_content || 100
              },
              component_origins: previewData.professional_certificate?.supply_chain?.component_origins || [],
              components: previewData.professional_certificate?.supply_chain?.component_origins || []
            };

            localStorage.setItem('usmca_workflow_results', JSON.stringify(alertData));
            localStorage.setItem('usmca_workflow_data', JSON.stringify(alertData));

            // Navigate to alerts page
            window.location.href = '/trade-risk-alternatives';
          }}
          style={{
            padding: '12px 24px',
            fontSize: '14px',
            backgroundColor: '#f59e0b',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          🔔 Set Up Alerts
        </button>

        <button
          onClick={handleSave}
          disabled={!editedCert.user_accepts_responsibility || !editedCert.user_confirms_accuracy}
          style={{
            padding: '12px 24px',
            fontSize: '14px',
            backgroundColor: editedCert.user_accepts_responsibility && editedCert.user_confirms_accuracy ? '#3b82f6' : '#cccccc',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: editedCert.user_accepts_responsibility && editedCert.user_confirms_accuracy ? 'pointer' : 'not-allowed',
            fontWeight: 'bold'
          }}
          title={!editedCert.user_accepts_responsibility || !editedCert.user_confirms_accuracy ? 'Accept responsibility and confirm accuracy to save' : 'Save all edits to database'}
        >
          💾 Save Changes
        </button>

        {isTrialUser ? (
          <a
            href="/pricing"
            style={{
              padding: '12px 24px',
              fontSize: '14px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold',
              textDecoration: 'none',
              display: 'inline-block'
            }}
            title="Upgrade to Professional to download official certificates"
          >
            🔒 Upgrade to Download
          </a>
        ) : (
          <button
            onClick={handleDownloadPDF}
            disabled={!editedCert.user_accepts_responsibility || !editedCert.user_confirms_accuracy}
            style={{
              padding: '12px 24px',
              fontSize: '14px',
              backgroundColor: editedCert.user_accepts_responsibility && editedCert.user_confirms_accuracy ? '#10b981' : '#cccccc',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: editedCert.user_accepts_responsibility && editedCert.user_confirms_accuracy ? 'pointer' : 'not-allowed',
              fontWeight: 'bold'
            }}
            title={!editedCert.user_accepts_responsibility || !editedCert.user_confirms_accuracy ? 'Accept responsibility and confirm accuracy to download' : ''}
          >
            ✓ Download Certificate
          </button>
        )}
      </div>
    </div>
  );
}
