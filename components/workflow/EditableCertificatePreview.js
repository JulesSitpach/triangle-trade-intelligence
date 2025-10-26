/**
 * Editable Certificate Preview - FULLY EDITABLE
 * Professional USMCA Certificate format with complete editability
 *
 * KEY PRINCIPLE: Tool-Only Platform
 * - Users make ALL final decisions
 * - AI provides suggestions (clearly labeled)
 * - Users responsible for accuracy
 * - Platform not liable for data
 *
 * All fields editable with clear:
 * - "AI Suggested: X / User Input: Y" labeling
 * - User responsibility disclaimers
 * - Trade attorney consultation recommendations
 */

import React, { useState } from 'react';

export default function EditableCertificatePreview({
  previewData,
  userTier,
  onSave,
  onCancel
}) {
  const [editedCert, setEditedCert] = useState({
    // Company Info
    certifier_name: previewData?.professional_certificate?.certifier?.name || '',
    certifier_address: previewData?.professional_certificate?.certifier?.address || '',
    certifier_country: previewData?.professional_certificate?.certifier?.country || '',
    certifier_phone: previewData?.professional_certificate?.certifier?.phone || '',
    certifier_email: previewData?.professional_certificate?.certifier?.email || '',
    certifier_tax_id: previewData?.professional_certificate?.certifier?.tax_id || '',

    exporter_name: previewData?.professional_certificate?.exporter?.name || '',
    exporter_address: previewData?.professional_certificate?.exporter?.address || '',
    exporter_country: previewData?.professional_certificate?.exporter?.country || '',
    exporter_phone: previewData?.professional_certificate?.exporter?.phone || '',
    exporter_email: previewData?.professional_certificate?.exporter?.email || '',
    exporter_tax_id: previewData?.professional_certificate?.exporter?.tax_id || '',

    importer_name: previewData?.professional_certificate?.importer?.name || '',
    importer_address: previewData?.professional_certificate?.importer?.address || '',
    importer_country: previewData?.professional_certificate?.importer?.country || '',
    importer_phone: previewData?.professional_certificate?.importer?.phone || '',
    importer_email: previewData?.professional_certificate?.importer?.email || '',
    importer_tax_id: previewData?.professional_certificate?.importer?.tax_id || '',

    // Product Info
    product_description: previewData?.professional_certificate?.product?.description || '',
    hs_code: previewData?.professional_certificate?.hs_classification?.code || '',

    // USMCA Analysis (EDITABLE)
    rvc_percentage: previewData?.professional_certificate?.regional_value_content || 0,
    preference_criterion: previewData?.professional_certificate?.preference_criterion || 'B',
    is_producer: previewData?.professional_certificate?.producer_declaration?.is_producer || false,
    qualification_method: previewData?.professional_certificate?.qualification_method?.method || 'RVC',
    country_of_origin: previewData?.professional_certificate?.country_of_origin || '',

    // Components (EDITABLE)
    components: previewData?.professional_certificate?.components || [],

    // Authorization (EDITABLE)
    signatory_name: previewData?.professional_certificate?.authorization?.signatory_name || '',
    signatory_title: previewData?.professional_certificate?.authorization?.signatory_title || 'Authorized Signatory',
    signatory_email: previewData?.professional_certificate?.authorization?.signatory_email || '',
    signatory_phone: previewData?.professional_certificate?.authorization?.signatory_phone || '',
    signature_date: previewData?.professional_certificate?.authorization?.signature_date ?
      new Date(previewData.professional_certificate.authorization.signature_date).toISOString().split('T')[0] :
      new Date().toISOString().split('T')[0],

    // User Acceptance
    user_accepts_responsibility: false,
    user_confirms_accuracy: false
  });

  const handleFieldChange = (field, value) => {
    setEditedCert(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleComponentChange = (index, field, value) => {
    const updated = [...editedCert.components];
    updated[index] = { ...updated[index], [field]: value };
    setEditedCert(prev => ({ ...prev, components: updated }));
  };

  const handleAddComponent = () => {
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
          country_of_origin: '',
          value_percentage: 0
        }
      ]
    }));
  };

  const handleRemoveComponent = (index) => {
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
      regional_value_content: parseFloat(editedCert.rvc_percentage),
      preference_criterion: editedCert.preference_criterion,
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
        signatory_email: editedCert.signatory_email,
        signatory_phone: editedCert.signatory_phone,
        signature_date: editedCert.signature_date
      }
    };

    onSave(updatedData);
  };

  const cert = previewData?.professional_certificate;
  const rvcStatus = parseFloat(editedCert.rvc_percentage) >= 60;

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
            <strong>Triangle Intelligence provides TOOLS ONLY - you are responsible for accuracy:</strong>
          </div>
          <ul style={{ marginLeft: '20px', marginBottom: '8px' }}>
            <li>All information on this certificate is YOUR responsibility</li>
            <li>AI suggestions are just suggestions - YOU make final decisions</li>
            <li>You must verify accuracy of every field before download</li>
            <li>You must maintain supporting documentation for CBP audits</li>
            <li>Consult a trade attorney for legal validation (recommended)</li>
            <li>Platform and Triangle Intelligence are NOT liable for certificate accuracy</li>
          </ul>
          <div style={{ fontWeight: 'bold', color: '#dc2626' }}>
            YOU sign this certificate. YOU certify accuracy. YOU assume legal liability.
          </div>
        </div>
      </div>

      {/* Trial Preview Alert */}
      {userTier === 'Trial' && (
        <div className="alert alert-warning" style={{ marginBottom: '16px' }}>
          <div className="alert-title">⚠️ TRIAL PREVIEW</div>
          <div className="text-body">Not valid for customs submissions - Subscribe to download official certificate</div>
        </div>
      )}

      {/* Success Alert */}
      <div className="alert alert-success" style={{ marginBottom: '16px' }}>
        <div className="alert-content">
          <div className="alert-title">✅ USMCA Certificate - EDITABLE PREVIEW</div>
          <div className="text-body">
            All fields are editable. Make any corrections needed. AI suggestions shown for reference only.
          </div>
        </div>
      </div>

      {/* Trial Watermark Wrapper */}
      <div style={{ position: 'relative' }}>
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
            </div>
          </div>
        )}

        {/* Professional Certificate Document */}
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
              ⚠️ FREE TRIAL PREVIEW - Not valid for customs submissions
            </div>
          )}

          {/* Header */}
          <div style={{
            textAlign: 'center',
            borderBottom: '2px solid #000',
            padding: '10px',
            backgroundColor: '#ffffff'
          }}>
            <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>
              UNITED STATES MEXICO CANADA AGREEMENT (USMCA)
            </div>
            <div style={{ fontWeight: 'bold', fontSize: '13px' }}>
              CERTIFICATION OF ORIGIN
            </div>
          </div>

          {/* Section 1: Certifier Type & Blanket Period */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '60% 40%',
            borderBottom: '1px solid #000'
          }}>
            <div style={{ borderRight: '1px solid #000', padding: '8px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '10px', marginBottom: '6px' }}>
                1. CERTIFIER TYPE (INDICATE "X")
              </div>
              <div style={{ display: 'flex', gap: '20px', marginLeft: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input type="checkbox" disabled checked={cert.certifier?.type === 'IMPORTER'} />
                  IMPORTER
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input type="checkbox" disabled checked={cert.certifier?.type === 'EXPORTER'} />
                  EXPORTER
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input type="checkbox" disabled checked={cert.certifier?.type === 'PRODUCER'} />
                  PRODUCER
                </label>
              </div>
            </div>
            <div style={{ padding: '8px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '10px', marginBottom: '4px' }}>
                BLANKET PERIOD (MM/DD/YYYY)
              </div>
              <div style={{ marginLeft: '10px' }}>
                <div>FROM: {cert.blanket_period?.start_date || 'N/A'}</div>
                <div>TO: {cert.blanket_period?.end_date || 'N/A'}</div>
              </div>
            </div>
          </div>

          {/* Sections 2-5: Contact Information - FULLY EDITABLE */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            borderBottom: '1px solid #000'
          }}>
            {/* Section 2: Certifier - EDITABLE */}
            <div style={{ borderRight: '1px solid #000', borderBottom: '1px solid #000', padding: '8px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '10px', marginBottom: '4px', color: '#0066cc' }}>
                2. CERTIFIER (EDIT HERE)
              </div>
              <div style={{ marginLeft: '4px', fontSize: '9px' }}>
                <div style={{ marginBottom: '4px' }}>
                  <strong>NAME</strong><br />
                  <input
                    type="text"
                    value={editedCert.certifier_name}
                    onChange={(e) => handleFieldChange('certifier_name', e.target.value)}
                    style={{ width: '100%', fontSize: '9px', padding: '2px', border: '1px solid #0066cc' }}
                  />
                </div>
                <div style={{ marginBottom: '4px' }}>
                  <strong>ADDRESS</strong><br />
                  <input
                    type="text"
                    value={editedCert.certifier_address}
                    onChange={(e) => handleFieldChange('certifier_address', e.target.value)}
                    style={{ width: '100%', fontSize: '9px', padding: '2px', border: '1px solid #0066cc' }}
                  />
                </div>
                <div style={{ marginBottom: '4px' }}>
                  <strong>COUNTRY</strong><br />
                  <input
                    type="text"
                    value={editedCert.certifier_country}
                    onChange={(e) => handleFieldChange('certifier_country', e.target.value)}
                    style={{ width: '100%', fontSize: '9px', padding: '2px', border: '1px solid #0066cc' }}
                  />
                </div>
                <div style={{ marginBottom: '4px' }}>
                  <strong>PHONE</strong><br />
                  <input
                    type="text"
                    value={editedCert.certifier_phone}
                    onChange={(e) => handleFieldChange('certifier_phone', e.target.value)}
                    style={{ width: '100%', fontSize: '9px', padding: '2px', border: '1px solid #0066cc' }}
                  />
                </div>
                <div style={{ marginBottom: '4px' }}>
                  <strong>EMAIL</strong><br />
                  <input
                    type="text"
                    value={editedCert.certifier_email}
                    onChange={(e) => handleFieldChange('certifier_email', e.target.value)}
                    style={{ width: '100%', fontSize: '9px', padding: '2px', border: '1px solid #0066cc' }}
                  />
                </div>
                <div>
                  <strong>TAX ID</strong><br />
                  <input
                    type="text"
                    value={editedCert.certifier_tax_id}
                    onChange={(e) => handleFieldChange('certifier_tax_id', e.target.value)}
                    style={{ width: '100%', fontSize: '9px', padding: '2px', border: '1px solid #0066cc' }}
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Exporter - EDITABLE */}
            <div style={{ borderBottom: '1px solid #000', padding: '8px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '10px', marginBottom: '4px', color: '#0066cc' }}>
                3. EXPORTER (EDIT HERE)
              </div>
              <div style={{ marginLeft: '4px', fontSize: '9px' }}>
                <div style={{ marginBottom: '4px' }}>
                  <strong>NAME</strong><br />
                  <input
                    type="text"
                    value={editedCert.exporter_name}
                    onChange={(e) => handleFieldChange('exporter_name', e.target.value)}
                    style={{ width: '100%', fontSize: '9px', padding: '2px', border: '1px solid #0066cc' }}
                  />
                </div>
                <div style={{ marginBottom: '4px' }}>
                  <strong>ADDRESS</strong><br />
                  <input
                    type="text"
                    value={editedCert.exporter_address}
                    onChange={(e) => handleFieldChange('exporter_address', e.target.value)}
                    style={{ width: '100%', fontSize: '9px', padding: '2px', border: '1px solid #0066cc' }}
                  />
                </div>
                <div style={{ marginBottom: '4px' }}>
                  <strong>COUNTRY</strong><br />
                  <input
                    type="text"
                    value={editedCert.exporter_country}
                    onChange={(e) => handleFieldChange('exporter_country', e.target.value)}
                    style={{ width: '100%', fontSize: '9px', padding: '2px', border: '1px solid #0066cc' }}
                  />
                </div>
                <div style={{ marginBottom: '4px' }}>
                  <strong>PHONE</strong><br />
                  <input
                    type="text"
                    value={editedCert.exporter_phone}
                    onChange={(e) => handleFieldChange('exporter_phone', e.target.value)}
                    style={{ width: '100%', fontSize: '9px', padding: '2px', border: '1px solid #0066cc' }}
                  />
                </div>
                <div style={{ marginBottom: '4px' }}>
                  <strong>EMAIL</strong><br />
                  <input
                    type="text"
                    value={editedCert.exporter_email}
                    onChange={(e) => handleFieldChange('exporter_email', e.target.value)}
                    style={{ width: '100%', fontSize: '9px', padding: '2px', border: '1px solid #0066cc' }}
                  />
                </div>
                <div>
                  <strong>TAX ID</strong><br />
                  <input
                    type="text"
                    value={editedCert.exporter_tax_id}
                    onChange={(e) => handleFieldChange('exporter_tax_id', e.target.value)}
                    style={{ width: '100%', fontSize: '9px', padding: '2px', border: '1px solid #0066cc' }}
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Producer (Read-only but shown for completeness) */}
            <div style={{ borderRight: '1px solid #000', padding: '8px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '10px', marginBottom: '4px' }}>
                4. PRODUCER
              </div>
              <div style={{ marginLeft: '8px', fontSize: '10px' }}>
                <div><strong>NAME</strong></div>
                <div>{cert.producer?.same_as_exporter ? 'SAME AS EXPORTER' : cert.producer?.name}</div>
                <div style={{ marginTop: '4px' }}><strong>ADDRESS</strong></div>
                <div>{cert.producer?.same_as_exporter ? 'SAME AS EXPORTER' : cert.producer?.address}</div>
                <div style={{ marginTop: '4px' }}><strong>COUNTRY</strong> {cert.producer?.country || cert.exporter?.country}</div>
                <div><strong>TAX ID</strong></div>
                <div>{cert.producer?.tax_id || cert.exporter?.tax_id}</div>
              </div>
            </div>

            {/* Section 5: Importer - EDITABLE */}
            <div style={{ padding: '8px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '10px', marginBottom: '4px', color: '#0066cc' }}>
                5. IMPORTER (EDIT HERE)
              </div>
              <div style={{ marginLeft: '4px', fontSize: '9px' }}>
                <div style={{ marginBottom: '4px' }}>
                  <strong>NAME</strong><br />
                  <input
                    type="text"
                    value={editedCert.importer_name}
                    onChange={(e) => handleFieldChange('importer_name', e.target.value)}
                    style={{ width: '100%', fontSize: '9px', padding: '2px', border: '1px solid #0066cc' }}
                  />
                </div>
                <div style={{ marginBottom: '4px' }}>
                  <strong>ADDRESS</strong><br />
                  <input
                    type="text"
                    value={editedCert.importer_address}
                    onChange={(e) => handleFieldChange('importer_address', e.target.value)}
                    style={{ width: '100%', fontSize: '9px', padding: '2px', border: '1px solid #0066cc' }}
                  />
                </div>
                <div style={{ marginBottom: '4px' }}>
                  <strong>COUNTRY</strong><br />
                  <input
                    type="text"
                    value={editedCert.importer_country}
                    onChange={(e) => handleFieldChange('importer_country', e.target.value)}
                    style={{ width: '100%', fontSize: '9px', padding: '2px', border: '1px solid #0066cc' }}
                  />
                </div>
                <div style={{ marginBottom: '4px' }}>
                  <strong>PHONE</strong><br />
                  <input
                    type="text"
                    value={editedCert.importer_phone}
                    onChange={(e) => handleFieldChange('importer_phone', e.target.value)}
                    style={{ width: '100%', fontSize: '9px', padding: '2px', border: '1px solid #0066cc' }}
                  />
                </div>
                <div style={{ marginBottom: '4px' }}>
                  <strong>EMAIL</strong><br />
                  <input
                    type="text"
                    value={editedCert.importer_email}
                    onChange={(e) => handleFieldChange('importer_email', e.target.value)}
                    style={{ width: '100%', fontSize: '9px', padding: '2px', border: '1px solid #0066cc' }}
                  />
                </div>
                <div>
                  <strong>TAX ID</strong><br />
                  <input
                    type="text"
                    value={editedCert.importer_tax_id}
                    onChange={(e) => handleFieldChange('importer_tax_id', e.target.value)}
                    style={{ width: '100%', fontSize: '9px', padding: '2px', border: '1px solid #0066cc' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 6-11: Goods Description Table - FULLY EDITABLE */}
          <div style={{ borderBottom: '1px solid #000' }}>
            <div style={{ padding: '8px', backgroundColor: '#e3f2fd', borderBottom: '1px solid #000', fontSize: '10px', fontWeight: 'bold', color: '#0066cc' }}>
              📦 SECTIONS 6-11: PRODUCT & QUALIFICATION DETAILS (FULLY EDITABLE)
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px' }}>
              <tbody>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '6px', fontWeight: 'bold', width: '30%' }}>
                    6. DESCRIPTION OF GOOD(S)
                  </td>
                  <td style={{ border: '1px solid #000', padding: '6px' }}>
                    <input
                      type="text"
                      value={editedCert.product_description}
                      onChange={(e) => handleFieldChange('product_description', e.target.value)}
                      style={{ width: '100%', fontSize: '9px', padding: '2px', border: '1px solid #0066cc' }}
                    />
                  </td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '6px', fontWeight: 'bold' }}>
                    7. HTS CODE
                  </td>
                  <td style={{ border: '1px solid #000', padding: '6px' }}>
                    <input
                      type="text"
                      value={editedCert.hs_code}
                      onChange={(e) => handleFieldChange('hs_code', e.target.value)}
                      style={{ width: '100%', fontSize: '9px', padding: '2px', border: '1px solid #0066cc' }}
                    />
                  </td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '6px', fontWeight: 'bold' }}>
                    8. ORIGIN CRITERION
                  </td>
                  <td style={{ border: '1px solid #000', padding: '6px' }}>
                    <div style={{ fontSize: '8px', marginBottom: '4px', color: '#666' }}>
                      AI Suggested: {cert.preference_criterion || 'B'}
                    </div>
                    <select
                      value={editedCert.preference_criterion}
                      onChange={(e) => handleFieldChange('preference_criterion', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '4px',
                        fontSize: '9px',
                        border: '2px solid #0066cc'
                      }}
                    >
                      <option value="A">A - Wholly Obtained</option>
                      <option value="B">B - Regional Value Content</option>
                      <option value="C">C - Yarn-Forward Rule</option>
                      <option value="D">D - Special Rule</option>
                    </select>
                  </td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '6px', fontWeight: 'bold' }}>
                    9. PRODUCER (YES/NO)
                  </td>
                  <td style={{ border: '1px solid #000', padding: '6px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <input
                        type="checkbox"
                        checked={editedCert.is_producer}
                        onChange={(e) => handleFieldChange('is_producer', e.target.checked)}
                      />
                      {editedCert.is_producer ? 'YES' : 'NO'}
                    </label>
                  </td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '6px', fontWeight: 'bold' }}>
                    10. METHOD OF QUALIFICATION
                  </td>
                  <td style={{ border: '1px solid #000', padding: '6px' }}>
                    <input
                      type="text"
                      value={editedCert.qualification_method}
                      onChange={(e) => handleFieldChange('qualification_method', e.target.value)}
                      style={{ width: '100%', fontSize: '9px', padding: '2px', border: '1px solid #0066cc' }}
                      placeholder="RVC, Net Cost, etc."
                    />
                  </td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '6px', fontWeight: 'bold' }}>
                    11. COUNTRY OF ORIGIN
                  </td>
                  <td style={{ border: '1px solid #000', padding: '6px' }}>
                    <input
                      type="text"
                      value={editedCert.country_of_origin}
                      onChange={(e) => handleFieldChange('country_of_origin', e.target.value)}
                      style={{ width: '100%', fontSize: '9px', padding: '2px', border: '1px solid #0066cc' }}
                      placeholder="US, CA, MX, etc."
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* CRITICAL: RVC Percentage & Qualification Status */}
          <div style={{ borderBottom: '1px solid #000', padding: '10px', backgroundColor: '#f0f9ff' }}>
            <div style={{ fontWeight: 'bold', fontSize: '11px', marginBottom: '12px', color: '#0066cc' }}>
              📊 CRITICAL: REGIONAL VALUE CONTENT (RVC) - USER INPUT REQUIRED
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '10px', marginBottom: '4px', color: '#666' }}>
                  <strong>AI Suggested RVC:</strong> {cert.regional_value_content || 0}%
                </div>
                <label style={{ fontWeight: 'bold', fontSize: '10px', display: 'block', marginBottom: '4px' }}>
                  YOUR RVC % (You verify accuracy):
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={editedCert.rvc_percentage}
                  onChange={(e) => handleFieldChange('rvc_percentage', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    fontSize: '11px',
                    border: '2px solid #f59e0b',
                    borderRadius: '4px',
                    fontWeight: 'bold'
                  }}
                />
              </div>
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '10px', marginBottom: '4px' }}>
                  QUALIFICATION STATUS:
                </div>
                <div style={{
                  padding: '12px',
                  backgroundColor: rvcStatus ? '#d1fae5' : '#fee2e2',
                  border: `3px solid ${rvcStatus ? '#10b981' : '#ef4444'}`,
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  textAlign: 'center'
                }}>
                  {rvcStatus ? (
                    <div>
                      <div>✅ QUALIFIED</div>
                      <div style={{ fontSize: '10px', marginTop: '4px' }}>
                        {editedCert.rvc_percentage}% ≥ 60% threshold
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div>❌ NOT QUALIFIED</div>
                      <div style={{ fontSize: '10px', marginTop: '4px' }}>
                        {editedCert.rvc_percentage}% &lt; 60% threshold
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Components Section - FULLY EDITABLE */}
          <div style={{ borderBottom: '1px solid #000', padding: '10px', backgroundColor: '#fafafa' }}>
            <div style={{ fontWeight: 'bold', fontSize: '11px', marginBottom: '12px', color: '#0066cc' }}>
              📦 COMPONENT ORIGINS - FULLY EDITABLE (You verify each component)
            </div>

            {editedCert.components.length > 0 ? (
              <div style={{ marginBottom: '12px', overflow: 'auto' }}>
                <table style={{ width: '100%', fontSize: '8px', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#e5e7eb' }}>
                      <th style={{ border: '1px solid #000', padding: '4px' }}>Description</th>
                      <th style={{ border: '1px solid #000', padding: '4px' }}>HS Code</th>
                      <th style={{ border: '1px solid #000', padding: '4px' }}>Origin Country</th>
                      <th style={{ border: '1px solid #000', padding: '4px' }}>Criterion</th>
                      <th style={{ border: '1px solid #000', padding: '4px' }}>% of Value</th>
                      <th style={{ border: '1px solid #000', padding: '4px' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {editedCert.components.map((comp, idx) => (
                      <tr key={idx}>
                        <td style={{ border: '1px solid #000', padding: '4px' }}>
                          <input
                            type="text"
                            value={comp.description}
                            onChange={(e) => handleComponentChange(idx, 'description', e.target.value)}
                            style={{ width: '100%', fontSize: '8px', padding: '2px', border: '1px solid #0066cc' }}
                            placeholder="Component"
                          />
                        </td>
                        <td style={{ border: '1px solid #000', padding: '4px' }}>
                          <input
                            type="text"
                            value={comp.hs_code}
                            onChange={(e) => handleComponentChange(idx, 'hs_code', e.target.value)}
                            style={{ width: '100%', fontSize: '8px', padding: '2px', border: '1px solid #0066cc' }}
                            placeholder="HS code"
                          />
                        </td>
                        <td style={{ border: '1px solid #000', padding: '4px' }}>
                          <input
                            type="text"
                            value={comp.origin_country}
                            onChange={(e) => handleComponentChange(idx, 'origin_country', e.target.value)}
                            style={{ width: '100%', fontSize: '8px', padding: '2px', border: '1px solid #0066cc' }}
                            placeholder="Country"
                          />
                        </td>
                        <td style={{ border: '1px solid #000', padding: '4px' }}>
                          <select
                            value={comp.origin_criterion || 'B'}
                            onChange={(e) => handleComponentChange(idx, 'origin_criterion', e.target.value)}
                            style={{ width: '100%', fontSize: '8px', padding: '2px' }}
                          >
                            <option value="A">A</option>
                            <option value="B">B</option>
                            <option value="C">C</option>
                            <option value="D">D</option>
                          </select>
                        </td>
                        <td style={{ border: '1px solid #000', padding: '4px' }}>
                          <input
                            type="number"
                            value={comp.value_percentage || 0}
                            onChange={(e) => handleComponentChange(idx, 'value_percentage', parseFloat(e.target.value))}
                            min="0"
                            max="100"
                            step="0.1"
                            style={{ width: '100%', fontSize: '8px', padding: '2px' }}
                          />
                        </td>
                        <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'center' }}>
                          <button
                            onClick={() => handleRemoveComponent(idx)}
                            style={{
                              padding: '2px 4px',
                              fontSize: '8px',
                              backgroundColor: '#ef4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: '3px',
                              cursor: 'pointer'
                            }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ padding: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px', marginBottom: '12px', fontSize: '10px' }}>
                No components added. Click "Add Component" to list components and origins.
              </div>
            )}

            <button
              onClick={handleAddComponent}
              style={{
                padding: '8px 12px',
                fontSize: '10px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              + Add Component
            </button>
          </div>

          {/* Certification Statement */}
          <div style={{ borderBottom: '2px solid #000', padding: '10px', fontSize: '9px', lineHeight: '1.4' }}>
            I CERTIFY THAT THE GOODS DESCRIBED IN THIS DOCUMENT QUALIFY AS ORIGINATING AND THE INFORMATION CONTAINED IN THIS DOCUMENT IS TRUE
            AND ACCURATE. I ASSUME RESPONSIBILITY FOR PROVING SUCH REPRESENTATIONS AND AGREE TO MAINTAIN AND PRESENT UPON REQUEST OR TO MAKE
            AVAILABLE DURING A VERIFICATION VISIT, DOCUMENTATION NECESSARY TO SUPPORT THIS CERTIFICATION
          </div>

          {/* Section 12: Authorization - FULLY EDITABLE */}
          <div style={{ padding: '10px', backgroundColor: '#f0f9ff' }}>
            <div style={{ fontWeight: 'bold', fontSize: '10px', marginBottom: '8px', color: '#0066cc' }}>
              12. AUTHORIZATION (EDIT YOUR SIGNATURE INFORMATION)
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '10px',
              fontSize: '10px'
            }}>
              <div>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>12a. AUTHORIZED SIGNATURE</div>
                <div style={{ borderBottom: '2px solid #000', minHeight: '40px', marginBottom: '8px' }}></div>
              </div>
              <div>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>12b. COMPANY</div>
                <input
                  type="text"
                  value={editedCert.exporter_name}
                  onChange={(e) => handleFieldChange('exporter_name', e.target.value)}
                  style={{ width: '100%', fontSize: '9px', padding: '2px', border: '1px solid #0066cc' }}
                />
              </div>
              <div>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>12c. NAME</div>
                <input
                  type="text"
                  value={editedCert.signatory_name}
                  onChange={(e) => handleFieldChange('signatory_name', e.target.value)}
                  style={{ width: '100%', fontSize: '9px', padding: '2px', border: '1px solid #0066cc' }}
                />
              </div>
              <div>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>12d. TITLE</div>
                <input
                  type="text"
                  value={editedCert.signatory_title}
                  onChange={(e) => handleFieldChange('signatory_title', e.target.value)}
                  style={{ width: '100%', fontSize: '9px', padding: '2px', border: '1px solid #0066cc' }}
                />
              </div>
              <div>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>12e. DATE (MM/DD/YYYY)</div>
                <input
                  type="date"
                  value={editedCert.signature_date}
                  onChange={(e) => handleFieldChange('signature_date', e.target.value)}
                  style={{ width: '100%', fontSize: '9px', padding: '2px', border: '1px solid #0066cc' }}
                />
              </div>
              <div>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>12f. TELEPHONE NUMBER</div>
                <input
                  type="text"
                  value={editedCert.signatory_phone}
                  onChange={(e) => handleFieldChange('signatory_phone', e.target.value)}
                  style={{ width: '100%', fontSize: '9px', padding: '2px', border: '1px solid #0066cc' }}
                />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>12g. EMAIL</div>
                <input
                  type="text"
                  value={editedCert.signatory_email}
                  onChange={(e) => handleFieldChange('signatory_email', e.target.value)}
                  style={{ width: '100%', fontSize: '9px', padding: '2px', border: '1px solid #0066cc' }}
                />
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
            USMCA CERTIFICATE V3 - FULLY EDITABLE
          </div>
        </div>
      </div>

      {/* ⚠️ FINAL DISCLAIMER & USER ACCEPTANCE */}
      <div style={{
        backgroundColor: '#fef3c7',
        border: '3px solid #f59e0b',
        borderRadius: '8px',
        padding: '16px',
        marginTop: '20px',
        marginBottom: '20px'
      }}>
        <div style={{ fontWeight: 'bold', fontSize: '12px', color: '#92400e', marginBottom: '12px' }}>
          ⚠️ FINAL REQUIREMENTS BEFORE DOWNLOAD
        </div>

        <div style={{ fontSize: '11px', color: '#b45309', lineHeight: '1.8' }}>
          <div style={{ marginBottom: '12px', fontWeight: 'bold' }}>
            You are signing this certificate. YOU are responsible for:
          </div>

          <label style={{ display: 'flex', gap: '8px', marginBottom: '12px', alignItems: 'flex-start' }}>
            <input
              type="checkbox"
              checked={editedCert.user_accepts_responsibility}
              onChange={(e) => handleFieldChange('user_accepts_responsibility', e.target.checked)}
              style={{ marginTop: '2px' }}
            />
            <div>
              <strong>✓ I accept responsibility for accuracy</strong><br />
              <span style={{ fontSize: '10px', color: '#92400e' }}>
                All information on this certificate is my responsibility. I have verified every field and accept liability for any errors.
              </span>
            </div>
          </label>

          <label style={{ display: 'flex', gap: '8px', marginBottom: '12px', alignItems: 'flex-start' }}>
            <input
              type="checkbox"
              checked={editedCert.user_confirms_accuracy}
              onChange={(e) => handleFieldChange('user_confirms_accuracy', e.target.checked)}
              style={{ marginTop: '2px' }}
            />
            <div>
              <strong>✓ I confirm all information is accurate and complete</strong><br />
              <span style={{ fontSize: '10px', color: '#92400e' }}>
                I have reviewed all editable fields and confirmed they match my actual business records.
              </span>
            </div>
          </label>

          <div style={{
            backgroundColor: 'rgba(255,255,255,0.5)',
            padding: '8px',
            borderRadius: '4px',
            marginTop: '12px',
            borderLeft: '4px solid #dc2626'
          }}>
            <strong>✅ RECOMMENDATION:</strong> Consult with a trade attorney to validate USMCA eligibility and RVC calculations before submitting to customs.
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ marginTop: '20px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
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
          ← Back to Authorization
        </button>
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
        >
          ✓ Download Certificate
        </button>
      </div>
    </div>
  );
}
