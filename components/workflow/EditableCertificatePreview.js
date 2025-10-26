/**
 * EDITABLE CERTIFICATE PREVIEW
 * Shows certificate data with full editing capability before download
 * User can review and adjust all fields including RVC, preference criterion, components
 */

import React, { useState } from 'react';

export default function EditableCertificatePreview({
  certificateData,
  workflowData,
  onEdit,
  onDownload,
  onBack
}) {
  const [editedData, setEditedData] = useState({
    rvc: workflowData?.usmca?.north_american_content || workflowData?.usmca?.regional_content || 0,
    preference_criterion: workflowData?.usmca?.preference_criterion || 'B',
    components: workflowData?.components || workflowData?.component_origins || []
  });

  const handleFieldChange = (field, value) => {
    setEditedData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleComponentEdit = (index, field, value) => {
    const updatedComponents = [...editedData.components];
    updatedComponents[index] = {
      ...updatedComponents[index],
      [field]: value
    };
    setEditedData(prev => ({
      ...prev,
      components: updatedComponents
    }));
  };

  const handleDownload = () => {
    // Pass edited data to parent before downloading
    onEdit?.(editedData);
    onDownload?.();
  };

  return (
    <div className="certificate-preview-container">
      <div className="form-section">
        <h2 className="form-section-title">📋 Review Certificate Before Download</h2>
        <p className="form-section-description">
          Review and edit certificate details below. You can adjust RVC percentage, preference criterion, and component origins before downloading.
        </p>
      </div>

      {/* COMPANY INFORMATION (Read-Only) */}
      <div className="form-section">
        <h3 className="form-section-title" style={{ fontSize: '1.1rem' }}>Exporter Information (Read-Only)</h3>
        <div className="form-group">
          <label className="form-label">Company Name</label>
          <div className="read-only-field">{certificateData?.company_info?.exporter_name || workflowData?.company?.name || 'N/A'}</div>
        </div>
        <div className="form-group">
          <label className="form-label">Country</label>
          <div className="read-only-field">{certificateData?.company_info?.exporter_country || workflowData?.company?.country || 'N/A'}</div>
        </div>
        <div className="form-group">
          <label className="form-label">Address</label>
          <div className="read-only-field">{certificateData?.company_info?.exporter_address || workflowData?.company?.address || 'N/A'}</div>
        </div>
      </div>

      {/* PRODUCT INFORMATION (Read-Only) */}
      <div className="form-section">
        <h3 className="form-section-title" style={{ fontSize: '1.1rem' }}>Product Information (Read-Only)</h3>
        <div className="form-group">
          <label className="form-label">HS Code</label>
          <div className="read-only-field">{certificateData?.product_details?.hs_code || workflowData?.product?.hs_code || 'N/A'}</div>
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <div className="read-only-field">{certificateData?.product_details?.product_description || workflowData?.product?.description || 'N/A'}</div>
        </div>
      </div>

      {/* EDITABLE: RVC AND PREFERENCE CRITERION */}
      <div className="form-section">
        <h3 className="form-section-title" style={{ fontSize: '1.1rem', color: '#2563eb' }}>✎ Editable: USMCA Qualification</h3>

        <div className="form-group">
          <label className="form-label">
            Regional Value Content (RVC) %
            <span style={{ fontSize: '0.875rem', color: '#666', marginLeft: '0.5rem' }}>
              {editedData.rvc >= 65 ? '✓ Qualifies' : '✗ Does not qualify'}
            </span>
          </label>
          <input
            type="number"
            min="0"
            max="100"
            value={editedData.rvc}
            onChange={(e) => handleFieldChange('rvc', parseFloat(e.target.value))}
            className="form-input"
            style={{ padding: '0.75rem', border: '1px solid #ccc', borderRadius: '4px' }}
          />
          <small style={{ color: '#666', display: 'block', marginTop: '0.25rem' }}>
            Minimum 65% required for USMCA qualification
          </small>
        </div>

        <div className="form-group">
          <label className="form-label">Preference Criterion</label>
          <select
            value={editedData.preference_criterion}
            onChange={(e) => handleFieldChange('preference_criterion', e.target.value)}
            className="form-input"
            style={{ padding: '0.75rem', border: '1px solid #ccc', borderRadius: '4px' }}
          >
            <option value="A">A - Wholly Obtained in USMCA Territory</option>
            <option value="B">B - Regional Value Content (RVC)</option>
            <option value="C">C - Special Processing Operations</option>
            <option value="D">D - Special Manufacturing Processes</option>
          </select>
          <small style={{ color: '#666', display: 'block', marginTop: '0.25rem' }}>
            {editedData.preference_criterion === 'B' ? 'RVC method - requires ≥65% North American content' : ''}
          </small>
        </div>
      </div>

      {/* EDITABLE: COMPONENT ORIGINS */}
      <div className="form-section">
        <h3 className="form-section-title" style={{ fontSize: '1.1rem', color: '#2563eb' }}>✎ Editable: Component Origins</h3>

        {editedData.components && editedData.components.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.875rem',
              marginTop: '1rem'
            }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #ddd', backgroundColor: '#f5f5f5' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Component</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Origin</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>%</th>
                </tr>
              </thead>
              <tbody>
                {editedData.components.map((comp, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '0.75rem' }}>
                      <input
                        type="text"
                        value={comp.description || comp.name || ''}
                        onChange={(e) => handleComponentEdit(idx, 'description', e.target.value)}
                        placeholder="Component name"
                        className="form-input"
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '3px' }}
                      />
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <input
                        type="text"
                        value={comp.origin_country || comp.origin || ''}
                        onChange={(e) => handleComponentEdit(idx, 'origin_country', e.target.value)}
                        placeholder="Country code"
                        maxLength="2"
                        className="form-input"
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '3px' }}
                      />
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={comp.value_percentage || comp.percentage || 0}
                        onChange={(e) => handleComponentEdit(idx, 'value_percentage', parseFloat(e.target.value))}
                        className="form-input"
                        style={{ width: '80px', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '3px' }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '4px', textAlign: 'center', color: '#666' }}>
            No components found
          </div>
        )}
      </div>

      {/* AUTHORIZATION (Read-Only) */}
      <div className="form-section">
        <h3 className="form-section-title" style={{ fontSize: '1.1rem' }}>Authorization (Read-Only)</h3>
        <div className="form-group">
          <label className="form-label">Signatory Name</label>
          <div className="read-only-field">{certificateData?.authorization?.signatory_name || 'N/A'}</div>
        </div>
        <div className="form-group">
          <label className="form-label">Signatory Title</label>
          <div className="read-only-field">{certificateData?.authorization?.signatory_title || 'N/A'}</div>
        </div>
        <div className="form-group">
          <label className="form-label">Certificate Period</label>
          <div className="read-only-field">
            {certificateData?.blanket_period?.start_date} to {certificateData?.blanket_period?.end_date}
          </div>
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div className="form-section" style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid #ddd' }}>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'space-between' }}>
          <button
            onClick={onBack}
            className="btn-secondary"
            style={{ flex: 1 }}
          >
            ← Back to Authorization
          </button>
          <button
            onClick={handleDownload}
            className="btn-primary"
            style={{ flex: 1 }}
          >
            Download Certificate →
          </button>
        </div>
      </div>

      <style jsx>{`
        .certificate-preview-container {
          max-width: 900px;
        }

        .read-only-field {
          background-color: #f5f5f5;
          border: 1px solid #ddd;
          padding: 0.75rem;
          border-radius: 4px;
          font-family: monospace;
          word-break: break-word;
        }

        .form-input {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 1rem;
          font-family: inherit;
        }

        .form-input:focus {
          outline: none;
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        .form-label {
          display: block;
          font-weight: 500;
          margin-bottom: 0.5rem;
          color: #1a1a1a;
        }

        .form-group {
          margin-bottom: 1rem;
        }
      `}</style>
    </div>
  );
}
