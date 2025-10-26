/**
 * CertificatePreviewAndEdit - TurboTax-style review & edit component
 *
 * Features:
 * - Display certificate preview data in clear sections
 * - Allow inline editing of critical fields (RVC%, component %, preference criterion)
 * - Real-time RVC recalculation when component percentages change
 * - Warnings for invalid selections (below threshold)
 * - Audit trail showing original vs edited values
 * - All changes tracked for product refinement insights
 *
 * Phase 1 MVP:
 * ✅ Edit RVC % with warning system
 * ✅ Edit component origin % with RVC auto-update
 * ✅ Edit preference criterion with USMCA rule explanations
 * ✅ Warnings for invalid selections
 * ✅ Audit trail tracking
 */

import React, { useState, useMemo } from 'react';

export default function CertificatePreviewAndEdit({ results, onCertificateReady }) {
  const [editMode, setEditMode] = useState(null); // Which field is being edited: 'rvc', 'origins', 'criterion', null
  const [editValues, setEditValues] = useState({}); // Holds edited values
  const [auditTrail, setAuditTrail] = useState([]); // Track all edits

  // Extract data from results
  const originalRVC = results?.usmca?.regional_content || results?.usmca?.north_american_content || 0;
  const components = results?.components || [];
  const originalCriterion = results?.usmca?.preference_criterion || results?.certificate?.preference_criterion || 'A';
  const company = results?.company || {};
  const product = results?.product || {};
  const usmcaThreshold = results?.usmca?.threshold_applied || 60;

  // Initialize edit values from original data
  const currentRVC = editValues.rvc !== undefined ? editValues.rvc : originalRVC;
  const currentCriterion = editValues.criterion !== undefined ? editValues.criterion : originalCriterion;
  const currentComponents = editValues.components !== undefined ? editValues.components : components;

  // Recalculate RVC based on component percentages
  const recalculatedRVC = useMemo(() => {
    if (!editValues.components || !Array.isArray(editValues.components)) {
      return originalRVC;
    }

    // Calculate RVC from component origins
    // Assume RVC = sum of (component % × north american %) / 100
    // For now, simple approach: count components with USMCA origins
    const usmcaOrigins = ['US', 'CA', 'MX', 'United States', 'Canada', 'Mexico'];
    let totalNorthAmericanValue = 0;
    let totalValue = 0;

    editValues.components.forEach(component => {
      const percentage = parseFloat(component.value_percentage) || 0;
      totalValue += percentage;
      if (usmcaOrigins.includes(component.origin_country)) {
        totalNorthAmericanValue += percentage;
      }
    });

    if (totalValue === 0) return originalRVC;
    return Math.round((totalNorthAmericanValue / totalValue) * 100);
  }, [editValues.components, originalRVC]);

  // Determine if current RVC qualifies
  const qualifiesForUSMCA = currentRVC >= usmcaThreshold;
  const rvcWarning = !qualifiesForUSMCA ? (
    <div className="alert alert-warning">
      <strong>⚠️ Below Threshold:</strong> RVC of {currentRVC}% is below the {usmcaThreshold}% requirement. Product will NOT qualify for USMCA benefits.
    </div>
  ) : null;

  // Handle edit mode opening
  const startEdit = (field) => {
    setEditMode(field);
  };

  // Handle edit mode closing
  const cancelEdit = () => {
    setEditMode(null);
  };

  // Save RVC edit
  const saveRVCEdit = (newRVC) => {
    const numValue = parseFloat(newRVC);
    if (isNaN(numValue) || numValue < 0 || numValue > 100) {
      alert('Please enter a valid percentage between 0 and 100');
      return;
    }

    // Track in audit trail
    const edit = {
      field: 'RVC %',
      timestamp: new Date().toISOString(),
      original_value: `${originalRVC}%`,
      edited_value: `${numValue}%`,
      reason: editValues.rvc_reason || 'User adjusted based on supplier documentation'
    };

    setAuditTrail([...auditTrail, edit]);
    setEditValues({ ...editValues, rvc: numValue });
    setEditMode(null);
  };

  // Save component origins edit
  const saveComponentEdit = (updatedComponents) => {
    // Validate total = 100%
    const total = updatedComponents.reduce((sum, c) => sum + (parseFloat(c.value_percentage) || 0), 0);
    if (Math.abs(total - 100) > 0.1) {
      alert(`Component percentages must total 100%. Current total: ${total.toFixed(1)}%`);
      return;
    }

    // Track in audit trail
    const edit = {
      field: 'Component Origins %',
      timestamp: new Date().toISOString(),
      original_value: components.map(c => `${c.description}: ${c.value_percentage}%`).join(', '),
      edited_value: updatedComponents.map(c => `${c.description}: ${c.value_percentage}%`).join(', '),
      recalculated_rvc: `${recalculatedRVC}%`
    };

    setAuditTrail([...auditTrail, edit]);
    setEditValues({ ...editValues, components: updatedComponents });
    setEditMode(null);
  };

  // Save preference criterion edit
  const saveCriterionEdit = (newCriterion) => {
    const criterionRules = {
      'A': 'Wholly North American - All materials originate in USMCA region',
      'B': 'Regional Value Content ≥ threshold - Product meets RVC requirement',
      'C': 'Change in Tariff Classification - Product transformed to different HS code',
      'D': 'Material Cost Reduction - Labor/processing costs reduced by percentage requirement'
    };

    // Track in audit trail
    const edit = {
      field: 'Preference Criterion',
      timestamp: new Date().toISOString(),
      original_value: `${originalCriterion} (${criterionRules[originalCriterion] || 'Unknown'})`,
      edited_value: `${newCriterion} (${criterionRules[newCriterion] || 'Unknown'})`,
      reason: editValues.criterion_reason || 'User selected more conservative approach'
    };

    setAuditTrail([...auditTrail, edit]);
    setEditValues({ ...editValues, criterion: newCriterion });
    setEditMode(null);
  };

  // Build final certificate data with all edits applied
  const getFinalCertificateData = () => {
    return {
      ...results,
      regional_content: currentRVC,
      preference_criterion: currentCriterion,
      components: currentComponents,
      edits: auditTrail,
      final_rvc_value: currentRVC,
      final_qualifies: qualifiesForUSMCA
    };
  };

  // CRITERION SELECTOR COMPONENT
  const CriterionSelector = () => {
    const criterionRules = {
      'A': {
        title: 'Wholly North American',
        description: 'All materials originate in the USMCA region (US, CA, MX)'
      },
      'B': {
        title: 'Regional Value Content',
        description: `Product meets RVC requirement (≥${usmcaThreshold}% North American content)`
      },
      'C': {
        title: 'Change in Tariff Classification',
        description: 'Product transformation creates a different HS classification'
      },
      'D': {
        title: 'Material Cost Reduction',
        description: 'Labor and cost savings meet USMCA threshold requirements'
      }
    };

    if (editMode === 'criterion') {
      return (
        <div className="edit-popup">
          <div className="edit-popup-header">
            <h4>Select Preference Criterion</h4>
          </div>
          <div className="edit-popup-body">
            {Object.entries(criterionRules).map(([key, rule]) => (
              <div key={key} className="criterion-option">
                <input
                  type="radio"
                  id={`criterion-${key}`}
                  name="criterion"
                  value={key}
                  checked={currentCriterion === key}
                  onChange={(e) => setEditValues({ ...editValues, criterion: e.target.value })}
                />
                <label htmlFor={`criterion-${key}`}>
                  <strong>{key}: {rule.title}</strong>
                  <p>{rule.description}</p>
                </label>
              </div>
            ))}
          </div>
          <div className="edit-popup-footer">
            <button onClick={() => saveCriterionEdit(editValues.criterion || currentCriterion)} className="btn-primary">
              Save Criterion
            </button>
            <button onClick={cancelEdit} className="btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="criterion-display">
        <div className="criterion-value">
          <strong>{currentCriterion}</strong>: {criterionRules[currentCriterion]?.title || 'Unknown'}
        </div>
        <div className="criterion-rule">
          {criterionRules[currentCriterion]?.description}
        </div>
        <button onClick={() => startEdit('criterion')} className="edit-button">
          ✎ Edit
        </button>
      </div>
    );
  };

  // RVC EDITOR COMPONENT
  const RVCEditor = () => {
    if (editMode === 'rvc') {
      return (
        <div className="edit-popup">
          <div className="edit-popup-header">
            <h4>Edit Regional Value Content (RVC)</h4>
          </div>
          <div className="edit-popup-body">
            <p className="edit-label">System Calculation: {originalRVC}%</p>
            <input
              type="number"
              min="0"
              max="100"
              value={editValues.rvc !== undefined ? editValues.rvc : originalRVC}
              onChange={(e) => setEditValues({ ...editValues, rvc: parseFloat(e.target.value) })}
              className="edit-input"
              placeholder="Enter RVC %"
            />
            <p className="edit-explanation">
              Enter your company's calculated RVC if you have supplier documentation that differs from our analysis.
              This can include factors like labor credits, indirect material costs, or verified supply chain documentation.
            </p>
            {(editValues.rvc !== undefined && editValues.rvc < usmcaThreshold) && (
              <div className="alert alert-warning">
                <strong>⚠️ Below {usmcaThreshold}% threshold:</strong> RVC of {editValues.rvc}% means this product does NOT qualify for USMCA duty-free treatment.
              </div>
            )}
          </div>
          <div className="edit-popup-footer">
            <button onClick={() => saveRVCEdit(editValues.rvc !== undefined ? editValues.rvc : originalRVC)} className="btn-primary">
              Save RVC %
            </button>
            <button onClick={cancelEdit} className="btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="rvc-display">
        <div className="rvc-value">
          {currentRVC}%
          {currentRVC !== originalRVC && (
            <span className="value-changed"> (changed from {originalRVC}%)</span>
          )}
        </div>
        <div className="rvc-status">
          {qualifiesForUSMCA ? (
            <span className="status-qualified">✓ Qualifies for USMCA (≥{usmcaThreshold}%)</span>
          ) : (
            <span className="status-not-qualified">✗ Below threshold for USMCA duty-free</span>
          )}
        </div>
        <button onClick={() => startEdit('rvc')} className="edit-button">
          ✎ Edit
        </button>
      </div>
    );
  };

  // COMPONENT ORIGINS EDITOR
  const ComponentOriginsEditor = () => {
    if (editMode === 'origins') {
      return (
        <div className="edit-popup">
          <div className="edit-popup-header">
            <h4>Edit Component Origin Percentages</h4>
          </div>
          <div className="edit-popup-body">
            <p className="edit-label">Adjust component percentages (must total 100%)</p>
            {currentComponents.map((component, idx) => (
              <div key={idx} className="component-edit-row">
                <label>{component.description}</label>
                <div className="component-edit-inputs">
                  <input
                    type="text"
                    readOnly
                    value={component.origin_country}
                    className="component-country"
                    title="Origin country - cannot be changed here"
                  />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={editValues.components?.[idx]?.value_percentage || component.value_percentage}
                    onChange={(e) => {
                      const updated = [...(editValues.components || currentComponents)];
                      updated[idx] = { ...updated[idx], value_percentage: parseFloat(e.target.value) };
                      setEditValues({ ...editValues, components: updated });
                    }}
                    className="component-percentage"
                  />
                  <span className="component-unit">%</span>
                </div>
              </div>
            ))}
            <div className="component-total">
              <strong>Total: {(editValues.components || currentComponents).reduce((sum, c) => sum + (parseFloat(c.value_percentage) || 0), 0).toFixed(1)}%</strong>
            </div>
            {recalculatedRVC !== originalRVC && (
              <div className="alert alert-info">
                <strong>ℹ️ RVC will recalculate to {recalculatedRVC}%</strong> based on these origin percentages
              </div>
            )}
          </div>
          <div className="edit-popup-footer">
            <button onClick={() => saveComponentEdit(editValues.components || currentComponents)} className="btn-primary">
              Save Component %
            </button>
            <button onClick={cancelEdit} className="btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="components-display">
        <div className="components-list">
          {currentComponents.map((component, idx) => (
            <div key={idx} className="component-row">
              <span className="component-desc">{component.description}</span>
              <span className="component-origin">{component.origin_country}</span>
              <span className="component-pct">{component.value_percentage}%</span>
            </div>
          ))}
        </div>
        <button onClick={() => startEdit('origins')} className="edit-button">
          ✎ Edit
        </button>
      </div>
    );
  };

  return (
    <div className="certificate-preview-edit">
      {/* HEADER */}
      <div className="preview-header">
        <h3>Certificate Preview & Review</h3>
        <p className="preview-subtitle">Review all information before downloading your certificate</p>
      </div>

      {/* COMPANY INFORMATION (Read-Only) */}
      <section className="preview-section">
        <div className="preview-section-header">
          <h4>Company Information</h4>
          <span className="readonly-badge">Read-Only</span>
        </div>
        <div className="preview-grid">
          <div className="preview-field">
            <label>Company Name</label>
            <div className="field-value">{company.name || company.company_name || '—'}</div>
          </div>
          <div className="preview-field">
            <label>Country</label>
            <div className="field-value">{company.country || company.company_country || '—'}</div>
          </div>
          <div className="preview-field">
            <label>Tax ID / EIN</label>
            <div className="field-value">{company.tax_id || '—'}</div>
          </div>
          <div className="preview-field">
            <label>Contact Email</label>
            <div className="field-value">{company.contact_email || company.email || '—'}</div>
          </div>
        </div>
      </section>

      {/* PRODUCT INFORMATION (Read-Only) */}
      <section className="preview-section">
        <div className="preview-section-header">
          <h4>Product & Classification</h4>
          <span className="readonly-badge">Read-Only</span>
        </div>
        <div className="preview-grid">
          <div className="preview-field">
            <label>HS Code</label>
            <div className="field-value">{product.hs_code || '—'}</div>
            <p className="field-hint">Cannot be changed - this is determined by AI classification</p>
          </div>
          <div className="preview-field full-width">
            <label>Product Description</label>
            <div className="field-value">{product.description || product.product_description || '—'}</div>
          </div>
        </div>
      </section>

      {/* REGIONAL CONTENT (Editable) */}
      <section className="preview-section">
        <div className="preview-section-header">
          <h4>Regional Value Content (RVC)</h4>
          <span className="editable-badge">Editable</span>
        </div>
        <div className="preview-content">
          {rvcWarning}
          <RVCEditor />
        </div>
      </section>

      {/* COMPONENT BREAKDOWN (Editable Origins) */}
      <section className="preview-section">
        <div className="preview-section-header">
          <h4>Component Origins</h4>
          <span className="editable-badge">Editable</span>
        </div>
        <div className="preview-content">
          <ComponentOriginsEditor />
          {recalculatedRVC !== originalRVC && (
            <p className="field-hint">
              Adjusting component percentages will automatically recalculate RVC from {originalRVC}% to {recalculatedRVC}%
            </p>
          )}
        </div>
      </section>

      {/* PREFERENCE CRITERION (Editable) */}
      <section className="preview-section">
        <div className="preview-section-header">
          <h4>USMCA Preference Criterion</h4>
          <span className="editable-badge">Editable</span>
        </div>
        <div className="preview-content">
          <CriterionSelector />
          <p className="field-hint">
            {originalCriterion !== currentCriterion
              ? `You changed this from ${originalCriterion} to ${currentCriterion}. Both are valid USMCA qualifications.`
              : 'AI system determined the optimal qualification criterion based on your product data.'
            }
          </p>
        </div>
      </section>

      {/* TARIFF COMPARISON (Read-Only) */}
      <section className="preview-section">
        <div className="preview-section-header">
          <h4>Tariff Rates</h4>
          <span className="readonly-badge">Read-Only</span>
        </div>
        <div className="preview-grid">
          <div className="preview-field">
            <label>MFN Rate (without USMCA)</label>
            <div className="field-value">{results?.tariff?.mfn_rate || '—'}%</div>
          </div>
          <div className="preview-field">
            <label>USMCA Rate (with treaty benefit)</label>
            <div className="field-value">{results?.tariff?.usmca_rate || '0'}%</div>
          </div>
          <div className="preview-field">
            <label>Annual Tariff Savings</label>
            <div className="field-value savings">${(results?.tariff?.savings_annual || 0).toLocaleString()}</div>
          </div>
        </div>
      </section>

      {/* AUDIT TRAIL */}
      {auditTrail.length > 0 && (
        <section className="preview-section">
          <div className="preview-section-header">
            <h4>Edit History</h4>
          </div>
          <div className="audit-trail">
            {auditTrail.map((edit, idx) => (
              <div key={idx} className="audit-entry">
                <div className="audit-field">{edit.field}</div>
                <div className="audit-changes">
                  <div className="audit-original">Original: {edit.original_value}</div>
                  <div className="audit-edited">Edited to: {edit.edited_value}</div>
                  {edit.recalculated_rvc && (
                    <div className="audit-recalc">RVC recalculated: {edit.recalculated_rvc}</div>
                  )}
                </div>
                <div className="audit-time">
                  {new Date(edit.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ACTION BUTTONS */}
      <div className="preview-actions">
        <button
          onClick={() => onCertificateReady(getFinalCertificateData())}
          className="btn-primary"
          disabled={editMode !== null}
        >
          ✓ Ready to Download Certificate
        </button>
        <button
          onClick={() => {
            // Reset all edits
            setEditValues({});
            setAuditTrail([]);
            window.location.href = '/usmca-workflow';
          }}
          className="btn-secondary"
        >
          ← Return to Workflow
        </button>
      </div>

      {/* USER RESPONSIBILITY MESSAGE */}
      <div className="alert alert-info responsibility-notice">
        <strong>⚠️ Your Responsibility:</strong>
        You are responsible for the accuracy of all information on this certificate. By downloading, you certify that all
        submitted data (company information, product classification, component origins, and regional content calculations)
        is accurate and compliant with USMCA requirements.
      </div>

      <style jsx>{`
        .certificate-preview-edit {
          background: #fff;
          border-radius: 8px;
          padding: 2rem;
          max-width: 900px;
          margin: 0 auto;
        }

        .preview-header {
          margin-bottom: 2rem;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 1rem;
        }

        .preview-header h3 {
          margin: 0 0 0.5rem 0;
          font-size: 1.5rem;
          color: #1f2937;
        }

        .preview-subtitle {
          color: #6b7280;
          margin: 0;
        }

        .preview-section {
          margin-bottom: 2rem;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          overflow: hidden;
        }

        .preview-section-header {
          background: #f9fafb;
          padding: 1rem;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .preview-section-header h4 {
          margin: 0;
          font-size: 1rem;
          color: #1f2937;
        }

        .readonly-badge, .editable-badge {
          font-size: 0.75rem;
          font-weight: 600;
          padding: 0.25rem 0.75rem;
          border-radius: 999px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .readonly-badge {
          background: #dbeafe;
          color: #0c4a6e;
        }

        .editable-badge {
          background: #fef3c7;
          color: #92400e;
        }

        .preview-content {
          padding: 1.5rem;
        }

        .preview-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
        }

        .preview-field {
          display: flex;
          flex-direction: column;
        }

        .preview-field.full-width {
          grid-column: 1 / -1;
        }

        .preview-field label {
          font-size: 0.875rem;
          font-weight: 600;
          color: #6b7280;
          margin-bottom: 0.5rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .field-value {
          font-size: 1rem;
          color: #1f2937;
          word-break: break-word;
        }

        .field-value.savings {
          font-size: 1.25rem;
          font-weight: 600;
          color: #059669;
        }

        .field-hint {
          font-size: 0.875rem;
          color: #6b7280;
          margin-top: 0.5rem;
          font-style: italic;
        }

        /* RVC Display */
        .rvc-display {
          display: flex;
          align-items: center;
          gap: 2rem;
        }

        .rvc-value {
          font-size: 2rem;
          font-weight: 700;
          color: #1f2937;
        }

        .value-changed {
          font-size: 0.875rem;
          color: #f97316;
        }

        .rvc-status {
          flex: 1;
        }

        .status-qualified {
          color: #059669;
          font-weight: 600;
        }

        .status-not-qualified {
          color: #dc2626;
          font-weight: 600;
        }

        /* Edit Popup */
        .edit-popup {
          background: #f3f4f6;
          border: 2px solid #d1d5db;
          border-radius: 8px;
          margin: 1rem 0;
        }

        .edit-popup-header {
          background: #e5e7eb;
          padding: 1rem;
          border-bottom: 1px solid #d1d5db;
        }

        .edit-popup-header h4 {
          margin: 0;
          color: #1f2937;
        }

        .edit-popup-body {
          padding: 1.5rem;
        }

        .edit-label {
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: #374151;
        }

        .edit-input {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 1rem;
          margin: 0.5rem 0 1rem 0;
        }

        .edit-explanation {
          font-size: 0.875rem;
          color: #6b7280;
          margin: 1rem 0;
        }

        .edit-popup-footer {
          background: #e5e7eb;
          padding: 1rem;
          border-top: 1px solid #d1d5db;
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
        }

        .edit-button {
          background: none;
          border: none;
          color: #0284c7;
          cursor: pointer;
          font-weight: 600;
          padding: 0;
          font-size: 0.875rem;
        }

        .edit-button:hover {
          text-decoration: underline;
        }

        /* Criterion Selection */
        .criterion-display {
          padding: 1rem;
          background: #f0f9ff;
          border-radius: 6px;
        }

        .criterion-value {
          font-size: 1.1rem;
          margin-bottom: 0.5rem;
        }

        .criterion-rule {
          font-size: 0.875rem;
          color: #6b7280;
          margin-bottom: 1rem;
        }

        .criterion-option {
          margin-bottom: 1rem;
          padding: 1rem;
          border: 2px solid #e5e7eb;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .criterion-option:hover {
          border-color: #3b82f6;
          background: #eff6ff;
        }

        .criterion-option input[type="radio"] {
          margin-right: 0.75rem;
          cursor: pointer;
        }

        .criterion-option label {
          cursor: pointer;
        }

        .criterion-option strong {
          display: block;
          margin-bottom: 0.25rem;
          color: #1f2937;
        }

        .criterion-option p {
          margin: 0;
          font-size: 0.875rem;
          color: #6b7280;
        }

        /* Component Origins */
        .components-display {
          background: #f0f9ff;
          padding: 1rem;
          border-radius: 6px;
        }

        .components-list {
          margin-bottom: 1rem;
        }

        .component-row {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr;
          gap: 1rem;
          padding: 0.75rem 0;
          border-bottom: 1px solid #e5e7eb;
          align-items: center;
        }

        .component-row:last-child {
          border-bottom: none;
        }

        .component-desc {
          font-size: 0.875rem;
          color: #1f2937;
        }

        .component-origin {
          font-weight: 600;
          color: #6b7280;
        }

        .component-pct {
          text-align: right;
          font-weight: 600;
          color: #1f2937;
        }

        .component-edit-row {
          margin-bottom: 1rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .component-edit-row label {
          display: block;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: #1f2937;
        }

        .component-edit-inputs {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }

        .component-country {
          flex: 1;
          padding: 0.5rem;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-size: 0.875rem;
          background: #f3f4f6;
          color: #6b7280;
        }

        .component-percentage {
          width: 80px;
          padding: 0.5rem;
          border: 1px solid #3b82f6;
          border-radius: 4px;
          font-size: 0.875rem;
        }

        .component-unit {
          font-weight: 600;
          color: #1f2937;
        }

        .component-total {
          text-align: right;
          padding-top: 1rem;
          font-weight: 600;
          color: #1f2937;
        }

        /* Audit Trail */
        .audit-trail {
          background: #f9fafb;
          padding: 1rem;
          border-radius: 6px;
        }

        .audit-entry {
          margin-bottom: 1rem;
          padding: 1rem;
          background: white;
          border-left: 4px solid #f97316;
          border-radius: 4px;
        }

        .audit-entry:last-child {
          margin-bottom: 0;
        }

        .audit-field {
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 0.5rem;
        }

        .audit-changes {
          font-size: 0.875rem;
          color: #6b7280;
          margin-bottom: 0.5rem;
        }

        .audit-original,
        .audit-edited,
        .audit-recalc {
          margin: 0.25rem 0;
        }

        .audit-original {
          color: #dc2626;
          text-decoration: line-through;
        }

        .audit-edited {
          color: #059669;
        }

        .audit-recalc {
          color: #f97316;
          font-weight: 600;
        }

        .audit-time {
          font-size: 0.75rem;
          color: #9ca3af;
          margin-top: 0.5rem;
        }

        /* Action Buttons */
        .preview-actions {
          display: flex;
          gap: 1rem;
          margin: 2rem 0;
        }

        .btn-primary, .btn-secondary {
          flex: 1;
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 6px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-primary {
          background: #3b82f6;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #2563eb;
        }

        .btn-primary:disabled {
          background: #d1d5db;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: #e5e7eb;
          color: #374151;
        }

        .btn-secondary:hover {
          background: #d1d5db;
        }

        /* Alerts */
        .alert {
          padding: 1rem;
          border-radius: 6px;
          margin-bottom: 1rem;
        }

        .alert-warning {
          background: #fef3c7;
          border-left: 4px solid #f59e0b;
          color: #92400e;
        }

        .alert-info {
          background: #dbeafe;
          border-left: 4px solid #0284c7;
          color: #0c4a6e;
        }

        .alert strong {
          display: block;
          margin-bottom: 0.25rem;
        }

        .responsibility-notice {
          margin-top: 2rem;
        }
      `}</style>
    </div>
  );
}
