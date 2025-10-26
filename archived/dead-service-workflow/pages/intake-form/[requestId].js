import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { getIntakeFormByService } from '../../config/service-intake-forms';

export default function IntakeFormPage() {
  const router = useRouter();
  const { requestId } = router.query;
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formConfig, setFormConfig] = useState(null);
  const [requestDetails, setRequestDetails] = useState(null);
  const [formData, setFormData] = useState({});
  const [activeSection, setActiveSection] = useState(0);

  useEffect(() => {
    if (requestId) {
      fetchRequestDetails();
    }
  }, [requestId]);

  const fetchRequestDetails = async () => {
    try {
      const response = await fetch(`/api/admin/service-request-details?id=${requestId}`);
      if (response.ok) {
        const data = await response.json();
        setRequestDetails(data);

        const serviceTypeMap = {
          'Manufacturing Feasibility': 'manufacturing-feasibility',
          'Supplier Sourcing': 'supplier-sourcing',
          'Market Entry Strategy': 'market-entry',
          'USMCA Certificate': 'usmca-certificate',
          'HS Code Classification': 'hs-classification'
        };

        const serviceKey = serviceTypeMap[data.service_type];
        const config = getIntakeFormByService(serviceKey);
        setFormConfig(config);

        if (data.service_details) {
          setFormData(data.service_details);
        }
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching request details:', error);
      setLoading(false);
    }
  };

  const handleInputChange = (fieldId, value) => {
    setFormData({ ...formData, [fieldId]: value });
  };

  const handleSubmit = async () => {
    setSubmitting(true);

    try {
      const response = await fetch('/api/submit-intake-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          formData,
          formType: formConfig.title
        })
      });

      if (response.ok) {
        setSubmitted(true);
      } else {
        alert('Failed to submit form. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Error submitting form. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUploadResponse = async () => {
    console.log('📁 Upload Client Response - Testing mode');
    console.log('Form data to upload:', formData);

    try {
      const response = await fetch('/api/submit-intake-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          formData,
          formType: formConfig.title
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Form uploaded to Jorge:', result);
        setSubmitted(true);
      }
    } catch (error) {
      console.error('Error uploading form:', error);
    }
  };

  const renderField = (field) => {
    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            value={formData[field.id] || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className="form-input"
          />
        );

      case 'textarea':
        return (
          <textarea
            rows={field.rows || 3}
            value={formData[field.id] || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className="form-input"
          />
        );

      case 'select':
        return (
          <select
            value={formData[field.id] || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            className="form-input"
          >
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'date':
        return (
          <input
            type="date"
            value={formData[field.id] || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            className="form-input"
          />
        );

      case 'file':
        return (
          <div>
            <input
              type="file"
              accept={field.accept || '*'}
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  handleInputChange(field.id, file.name);
                  handleInputChange(`${field.id}_file`, file);
                }
              }}
              className="form-input"
            />
            {field.help && (
              <p className="field-help">{field.help}</p>
            )}
            {formData[field.id] && (
              <p className="file-selected">✅ Selected: {formData[field.id]}</p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="card">
          <p>Loading form...</p>
        </div>
      </div>
    );
  }

  if (!formConfig) {
    return (
      <div className="page-container">
        <div className="card">
          <h2>Form Not Found</h2>
          <p>The requested intake form could not be found.</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="page-container">
        <div className="card">
          <div style={{textAlign: 'center', padding: '2rem'}}>
            <h2 style={{color: '#16a34a', marginBottom: '1rem'}}>✅ Form Submitted Successfully!</h2>
            <p style={{marginBottom: '1rem'}}>
              Thank you for completing the {formConfig.title}.
            </p>
            <p style={{color: '#6b7280', marginBottom: '1.5rem'}}>
              Jorge will review your information and contact you shortly with the next steps.
            </p>
            <div style={{padding: '1.5rem', background: '#f3f4f6', borderRadius: '8px', marginTop: '2rem'}}>
              <h3 style={{fontSize: '1rem', marginBottom: '1rem'}}>🔔 Status Update</h3>
              <p style={{color: '#374151', marginBottom: '0.5rem'}}>
                <strong>Status:</strong> Stage 1 - Form Completed
              </p>
              <p style={{color: '#374151', marginBottom: '0.5rem'}}>
                <strong>Request ID:</strong> {requestId}
              </p>
              <p style={{color: '#6b7280', fontSize: '0.9rem', marginTop: '1rem'}}>
                Jorge can now review your responses in his dashboard and proceed to Stage 2: Supplier Research
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentSection = formConfig.sections?.[activeSection];
  const isLastSection = activeSection === (formConfig.sections?.length || 1) - 1;

  return (
    <div className="page-container">
      <div className="card">
        <div className="form-header">
          <h1>{formConfig.title}</h1>
          {requestDetails && (
            <p style={{color: '#6b7280', marginTop: '0.5rem'}}>
              <strong>{requestDetails.company_name}</strong> · ${formConfig.service_price}
            </p>
          )}
        </div>

        <div className="tab-navigation" style={{marginTop: '1.5rem', flexWrap: 'wrap'}}>
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
          <div style={{marginTop: '2rem'}}>
            <h3>{currentSection.title}</h3>

            {currentSection.fields?.map((field) => (
              <div key={field.id} className="form-group">
                <label>
                  {field.label}
                  {field.required && <span style={{color: '#dc2626'}}> *</span>}
                </label>
                {renderField(field)}
              </div>
            ))}
          </div>
        )}

        <div className="form-actions" style={{marginTop: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <button
            className="btn-action btn-secondary"
            onClick={() => setActiveSection(Math.max(0, activeSection - 1))}
            disabled={activeSection === 0}
          >
            ← Previous
          </button>
          <span style={{color: '#6b7280'}}>
            Section {activeSection + 1} of {formConfig.sections?.length || 0}
          </span>
          {!isLastSection ? (
            <button
              className="btn-action btn-secondary"
              onClick={() => setActiveSection(Math.min((formConfig.sections?.length || 1) - 1, activeSection + 1))}
            >
              Next →
            </button>
          ) : (
            <button
              className="btn-action btn-primary"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : '✅ Submit Form'}
            </button>
          )}
        </div>

        <div className="form-actions" style={{marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem'}}>
          <button
            className="btn-action btn-secondary"
            onClick={handleUploadResponse}
          >
            📁 Upload Client Response
          </button>
        </div>
      </div>

      <style jsx>{`
        .page-container {
          min-height: 100vh;
          background: #f9fafb;
          padding: 2rem;
        }

        .card {
          max-width: 900px;
          margin: 0 auto;
          background: white;
          border-radius: 8px;
          padding: 2rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .form-header h1 {
          margin: 0;
          color: #134169;
          font-size: 1.75rem;
        }

        .form-input {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 1rem;
          font-family: inherit;
        }

        .form-input:focus {
          outline: none;
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        .btn-action {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 6px;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-primary {
          background: #2563eb;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #1d4ed8;
        }

        .btn-secondary {
          background: #f3f4f6;
          color: #374151;
        }

        .btn-secondary:hover:not(:disabled) {
          background: #e5e7eb;
        }

        .btn-action:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .field-help {
          margin-top: 0.5rem;
          font-size: 0.875rem;
          color: #6b7280;
        }

        .file-selected {
          margin-top: 0.5rem;
          font-size: 0.875rem;
          color: #16a34a;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
}