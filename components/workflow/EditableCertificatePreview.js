/**
 * Editable Certificate Preview - Official USMCA Form Layout
 * Matches the official US government USMCA Certificate of Origin template
 * with light blue input boxes for easy editing and identification
 *
 * Layout matches: USMCA-Certificate-Of-Origin-Form-Template-Updated-10-21-2021.pdf
 */

import React, { useState } from 'react';

export default function EditableCertificatePreview({
  previewData,
  userTier,
  onSave,
  onCancel
}) {
  // Determine if fields should be disabled based on user tier
  const isTrialUser = userTier === 'Trial';

  const [editedCert, setEditedCert] = useState({
    // Section 1: Certifier Type
    certifier_type: previewData?.professional_certificate?.certifier?.type || 'EXPORTER',
    blanket_from: previewData?.professional_certificate?.blanket_period?.start_date || '',
    blanket_to: previewData?.professional_certificate?.blanket_period?.end_date || '',

    // Section 2: Certifier
    certifier_name: previewData?.professional_certificate?.certifier?.name || '',
    certifier_address: previewData?.professional_certificate?.certifier?.address || '',
    certifier_country: previewData?.professional_certificate?.certifier?.country || '',
    certifier_phone: previewData?.professional_certificate?.certifier?.phone || '',
    certifier_email: previewData?.professional_certificate?.certifier?.email || '',
    certifier_tax_id: previewData?.professional_certificate?.certifier?.tax_id || '',

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
  });

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
        tax_id: editedCert.producer_tax_id
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
        description: editedCert.product_description
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

    onSave(updatedData);
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

      {userTier === 'Trial' && (
        <div className="alert alert-warning" style={{ marginBottom: '16px' }}>
          <div className="alert-title">⚠️ FREE TRIAL PREVIEW - WATERMARKED</div>
          <div className="text-body">
            This is a <strong>READ-ONLY PREVIEW</strong> for free users. Download and official certificate features require a paid subscription.
            <br /><br />
            <strong>Free users can:</strong> View certificate structure, verify accuracy
            <br />
            <strong>Paid users can:</strong> Edit & download official certificates (no watermark), receive trade alerts
            <br />
            <a href="/pricing" style={{color: '#2563eb', textDecoration: 'underline'}}>Upgrade to Professional ($99/month)</a>
          </div>
        </div>
      )}

      {/* Official USMCA Certificate Form - Exact Layout from US Template */}
      <div style={{
        border: '3px solid #000',
        backgroundColor: '#fff',
        fontFamily: 'Arial, sans-serif',
        fontSize: '11px',
        maxWidth: '900px',
        margin: '0 auto',
        pageBreakInside: 'avoid',
        // Add watermark for free trial users
        position: 'relative',
        ...(userTier === 'Trial' && {
          background: 'repeating-linear-gradient(45deg, #fff, #fff 50px, rgba(239, 68, 68, 0.03) 50px, rgba(239, 68, 68, 0.03) 100px)',
          border: '3px solid #fee2e2'
        })
      }}>
        {/* WATERMARK for free users */}
        {userTier === 'Trial' && (
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
          fontSize: '12px'
        }}>
          <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '2px' }}>
            UNITED STATES MEXICO CANADA AGREEMENT (USMCA)
          </div>
          <div style={{ fontWeight: 'bold', fontSize: '12px' }}>
            CERTIFICATION OF ORIGIN
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
          <div style={{ borderRight: '1px solid #000', padding: '8px' }}></div>
          <div style={{ padding: '8px', minWidth: '140px' }}>
            <div style={labelStyle}>BLANKET PERIOD<br />(MM/DD/YYYY)</div>
            <div style={{ marginTop: '2px', fontSize: '8px' }}>FROM:</div>
            <input
              type="text"
              value={editedCert.blanket_from}
              onChange={(e) => handleFieldChange('blanket_from', e.target.value)}
              style={{ ...inputStyle, marginBottom: '3px' }}
            />
            <div style={{ fontSize: '8px' }}>TO:</div>
            <input
              type="text"
              value={editedCert.blanket_to}
              onChange={(e) => handleFieldChange('blanket_to', e.target.value)}
              style={inputStyle}
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
                  <input type="text" disabled={isTrialUser} readOnly={isTrialUser} value={editedCert.product_description} onChange={(e) => handleFieldChange('product_description', e.target.value)} style={{ ...inputStyle, minHeight: '100px', width: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} placeholder="Product description (e.g., Smartphone assembly with components including PCB, housing, etc.)" />
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
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
        <button
          onClick={onCancel}
          style={{
            padding: '12px 24px',
            fontSize: '14px',
            backgroundColor: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          ← Back to Edit Authorization
        </button>
        {userTier === 'Trial' ? (
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
            onClick={handleSave}
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
