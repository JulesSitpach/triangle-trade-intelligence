/**
 * Reusable Intake Form Modal Component
 * Used to display and send detailed client intake forms in Stage 1 workflows
 */

import { useState, useEffect } from 'react';

export default function IntakeFormModal({ isOpen, onClose, formConfig, clientInfo, onSendForm, onUploadResponse, initialMode = 'preview' }) {
  const [activeSection, setActiveSection] = useState(0);
  const [formData, setFormData] = useState({});
  const [mode, setMode] = useState(initialMode);

  // Editable client contact fields
  const [clientContact, setClientContact] = useState({
    email: '',
    name: '',
    company_name: ''
  });

  useEffect(() => {
    if (clientInfo && isOpen) {
      // Initialize client contact info
      setClientContact({
        email: clientInfo.email || 'triangleintel@gmail.com',
        name: clientInfo.contact_name || clientInfo.client_name || 'Client Contact',
        company_name: clientInfo.company_name || clientInfo.client_name || ''
      });

      // Pre-fill form data
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
    } else if (isOpen) {
      // Initialize with defaults when no clientInfo
      setClientContact({
        email: 'triangleintel@gmail.com',
        name: 'Client Contact',
        company_name: ''
      });
    }
  }, [clientInfo, isOpen]);

  if (!isOpen) return null;

  if (!formConfig) {
    console.error('IntakeFormModal: No formConfig provided');
    return (
      <div className="modal-overlay" style={{ zIndex: 10000 }} onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Form Not Found</h2>
            <button className="modal-close" onClick={onClose}>×</button>
          </div>
          <div style={{ padding: '20px' }}>
            <p>The requested intake form could not be found.</p>
            <button onClick={onClose} style={{ padding: '8px 16px', marginTop: '10px' }}>Close</button>
          </div>
        </div>
      </div>
    );
  }

  const handleInputChange = (fieldId, value) => {
    setFormData({ ...formData, [fieldId]: value });
  };

  const handleSendToClient = () => {
    if (onSendForm) {
      onSendForm({
        formType: formConfig.title,
        formData: formConfig,
        clientEmail: clientContact.email,
        clientName: clientContact.name,
        companyName: clientContact.company_name
      });
    }
  };

  const handleClientContactChange = (field, value) => {
    setClientContact(prev => ({
      ...prev,
      [field]: value
    }));
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
              disabled={false}
              className={hasExistingValue ? 'prefilled-field' : ''}
              style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
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
            disabled={false}
            style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', resize: 'vertical' }}
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
              disabled={false}
              className={hasSelectValue ? 'prefilled-field' : ''}
              style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
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
            disabled={false}
            style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
          />
        );

      default:
        return null;
    }
  };

  const currentSection = formConfig.sections?.[activeSection];

  return (
    <div className="modal-overlay" style={{ zIndex: 10000 }} onClick={onClose}>
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

          <div className="tab-navigation" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px', borderBottom: '1px solid #e5e7eb', paddingBottom: '10px' }}>
            {formConfig.sections?.map((section, index) => (
              <button
                key={index}
                className={`tab-button ${activeSection === index ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Tab clicked:', index, section.title);
                  setActiveSection(index);
                }}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px 6px 0 0',
                  backgroundColor: activeSection === index ? '#2563eb' : '#ffffff',
                  color: activeSection === index ? '#ffffff' : '#374151',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  transition: 'all 0.2s ease'
                }}
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

        <div className="modal-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderTop: '1px solid #e5e7eb' }}>
          <button
            className="btn-action btn-secondary"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Previous clicked, current section:', activeSection);
              setActiveSection(Math.max(0, activeSection - 1));
            }}
            disabled={activeSection === 0}
            style={{
              padding: '8px 16px',
              backgroundColor: activeSection === 0 ? '#f3f4f6' : '#ffffff',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              cursor: activeSection === 0 ? 'not-allowed' : 'pointer'
            }}
          >
            ← Previous
          </button>
          <span style={{ fontSize: '0.9rem', color: '#6b7280', fontWeight: '500' }}>
            Section {activeSection + 1} of {formConfig.sections?.length || 0}
          </span>
          <button
            className="btn-action btn-secondary"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const maxSection = (formConfig.sections?.length || 1) - 1;
              console.log('Next clicked, current section:', activeSection, 'max:', maxSection);
              setActiveSection(Math.min(maxSection, activeSection + 1));
            }}
            disabled={activeSection === (formConfig.sections?.length || 1) - 1}
            style={{
              padding: '8px 16px',
              backgroundColor: activeSection === (formConfig.sections?.length || 1) - 1 ? '#f3f4f6' : '#ffffff',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              cursor: activeSection === (formConfig.sections?.length || 1) - 1 ? 'not-allowed' : 'pointer'
            }}
          >
            Next →
          </button>
        </div>

        <div className="modal-actions">
          <div style={{ marginBottom: '15px', padding: '15px', backgroundColor: '#f3f4f6', borderRadius: '6px', border: '1px solid #d1d5db' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '0.95rem', fontWeight: '600', color: '#374151' }}>
              📧 Send Form To:
            </h4>
            <div className="form-group" style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', color: '#4b5563', marginBottom: '4px' }}>
                Email Address:
              </label>
              <input
                type="email"
                value={clientContact.email}
                onChange={(e) => handleClientContactChange('email', e.target.value)}
                style={{
                  width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px',
                  fontSize: '0.9rem', backgroundColor: '#ffffff'
                }}
                placeholder="client@company.com"
              />
            </div>
            <div className="form-group" style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', color: '#4b5563', marginBottom: '4px' }}>
                Contact Name:
              </label>
              <input
                type="text"
                value={clientContact.name}
                onChange={(e) => handleClientContactChange('name', e.target.value)}
                style={{
                  width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px',
                  fontSize: '0.9rem', backgroundColor: '#ffffff'
                }}
                placeholder="Contact Name"
              />
            </div>
            <div className="form-group">
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', color: '#4b5563', marginBottom: '4px' }}>
                Company Name:
              </label>
              <input
                type="text"
                value={clientContact.company_name}
                onChange={(e) => handleClientContactChange('company_name', e.target.value)}
                style={{
                  width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px',
                  fontSize: '0.9rem', backgroundColor: '#ffffff'
                }}
                placeholder="Company Name"
              />
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'flex-start' }}>
            <button
              className="btn-action btn-primary"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Send form clicked');
                handleSendToClient();
              }}
              style={{ padding: '10px 20px', fontSize: '0.9rem', fontWeight: '500' }}
            >
              📧 Send Form to Client
            </button>
            <button
              className="btn-action btn-secondary"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Upload mode clicked, current mode:', mode);
                setMode('upload');
              }}
              style={{ padding: '10px 20px', fontSize: '0.9rem' }}
            >
              📁 Upload Client Response
            </button>
            {mode === 'upload' && (
              <button
                className="btn-action btn-primary"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Save response clicked');
                  handleUploadClientResponse();
                }}
                style={{ padding: '10px 20px', fontSize: '0.9rem', fontWeight: '500', backgroundColor: '#16a34a' }}
              >
                ✅ Save Response & Continue
              </button>
            )}
            <button
              className="btn-action btn-secondary"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Close clicked');
                onClose();
              }}
              style={{ padding: '10px 20px', fontSize: '0.9rem' }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}