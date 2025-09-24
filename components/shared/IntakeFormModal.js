/**
 * Reusable Intake Form Modal Component
 * Used to display and send detailed client intake forms in Stage 1 workflows
 */

import { useState, useEffect } from 'react';

export default function IntakeFormModal({ isOpen, onClose, formConfig, clientInfo, onSendForm, onUploadResponse, initialMode = 'preview' }) {
  const [activeSection, setActiveSection] = useState(0);
  const [formData, setFormData] = useState({});
  const [mode, setMode] = useState(initialMode);

  useEffect(() => {
    if (clientInfo && isOpen) {
      const preFilledData = {
        company_name: clientInfo.company_name || clientInfo.client_name || '',
        contact_name: clientInfo.contact_name || '',
        email: clientInfo.email || '',
        phone: clientInfo.phone || '',
        industry: clientInfo.industry || '',

        product_description: clientInfo.service_details?.product_description || clientInfo.service_details?.product_type || '',
        product_specifications: clientInfo.service_details?.product_specifications || '',
        product_name: clientInfo.service_details?.product_description || '',
        quality_standards: clientInfo.service_details?.quality_standards || '',

        target_market: clientInfo.service_details?.target_market || '',
        target_regions: clientInfo.service_details?.target_regions || '',
        geographic_preference: clientInfo.service_details?.target_regions || '',

        goals: clientInfo.service_details?.goals || '',
        requirements: clientInfo.service_details?.requirements || '',
        current_challenges: clientInfo.service_details?.current_challenges || '',

        budget_range: clientInfo.budget_range || '',
        investment_budget: clientInfo.budget_range || clientInfo.service_details?.investment_budget || '',
        timeline: clientInfo.timeline || '',
        delivery_timeline: clientInfo.timeline || '',
        trade_volume: clientInfo.trade_volume ? `$${clientInfo.trade_volume.toLocaleString()}` : '',
        annual_volume: clientInfo.service_details?.volume || (clientInfo.trade_volume ? `${clientInfo.trade_volume.toLocaleString()} per year` : ''),
        minimum_order_quantity: clientInfo.service_details?.volume || '',

        ...clientInfo.service_details
      };
      setFormData(preFilledData);
    }
  }, [clientInfo, isOpen]);

  if (!isOpen || !formConfig) return null;

  const handleInputChange = (fieldId, value) => {
    setFormData({ ...formData, [fieldId]: value });
  };

  const handleSendToClient = () => {
    if (onSendForm) {
      onSendForm({
        formType: formConfig.title,
        formData: formConfig,
        clientEmail: clientInfo?.email,
        clientName: clientInfo?.company_name || clientInfo?.client_name
      });
    }
  };

  const handleUploadClientResponse = () => {
    if (onUploadResponse) {
      onUploadResponse({
        formType: formConfig.title,
        responseData: formData,
        clientInfo
      });
    }
  };

  const renderField = (field) => {
    switch (field.type) {
      case 'text':
        const hasExistingValue = formData[field.id] && formData[field.id] !== '';
        return (
          <div>
            <input
              type="text"
              value={formData[field.id] || ''}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              disabled={mode === 'preview'}
              className={hasExistingValue ? 'prefilled-field' : ''}
            />
            {hasExistingValue && mode === 'preview' && (
              <small style={{color: '#059669', fontSize: '0.75rem'}}>✓ From consultation form</small>
            )}
          </div>
        );

      case 'textarea':
        return (
          <textarea
            rows={field.rows || 3}
            value={formData[field.id] || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            disabled={mode === 'preview'}
          />
        );

      case 'select':
        const selectValue = formData[field.id] || '';
        const hasSelectValue = selectValue !== '' && selectValue !== field.options?.[0]?.value;
        return (
          <div>
            <select
              value={selectValue}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              disabled={mode === 'preview'}
              className={hasSelectValue ? 'prefilled-field' : ''}
            >
              {field.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {hasSelectValue && mode === 'preview' && (
              <small style={{color: '#059669', fontSize: '0.75rem'}}>✓ From consultation form</small>
            )}
          </div>
        );

      case 'date':
        return (
          <input
            type="date"
            value={formData[field.id] || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            disabled={mode === 'preview'}
          />
        );

      default:
        return null;
    }
  };

  const currentSection = formConfig.sections?.[activeSection];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>{formConfig.title}</h2>
            <p style={{margin: 0, color: '#6b7280', fontSize: '0.9rem'}}>
              {clientInfo && (
                <><strong>{clientInfo.company_name || clientInfo.client_name}</strong> · </>
              )}
              ${formConfig.service_price}
            </p>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="tab-content">

          <div className="tab-navigation" style={{flexWrap: 'wrap'}}>
            {formConfig.sections?.map((section, index) => (
              <button
                key={index}
                className={`tab-button ${activeSection === index ? 'active' : ''}`}
                onClick={() => setActiveSection(index)}
              >
                {section.title}
              </button>
            ))}
          </div>

          {currentSection && (
            <div>
              <h3>{currentSection.title}</h3>

              {currentSection.fields?.map((field) => (
                <div key={field.id} className="form-group">
                  <label>
                    {field.label}
                    {field.required && <span> *</span>}
                  </label>
                  {renderField(field)}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button
            className="btn-action btn-secondary"
            onClick={() => setActiveSection(Math.max(0, activeSection - 1))}
            disabled={activeSection === 0}
          >
            ← Previous
          </button>
          <span>
            Section {activeSection + 1} of {formConfig.sections?.length || 0}
          </span>
          <button
            className="btn-action btn-secondary"
            onClick={() => setActiveSection(Math.min((formConfig.sections?.length || 1) - 1, activeSection + 1))}
            disabled={activeSection === (formConfig.sections?.length || 1) - 1}
          >
            Next →
          </button>
        </div>

        <div className="modal-actions">
          <button className="btn-action btn-primary" onClick={handleSendToClient}>
            📧 Send Form to Client
          </button>
          <button className="btn-action btn-secondary" onClick={() => setMode('upload')}>
            📁 Upload Client Response
          </button>
          {mode === 'upload' && (
            <button className="btn-action btn-primary" onClick={handleUploadClientResponse}>
              ✅ Save Response & Continue
            </button>
          )}
          <button className="btn-action btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}