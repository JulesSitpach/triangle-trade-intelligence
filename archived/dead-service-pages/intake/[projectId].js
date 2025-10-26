/**
 * Client Intake Form - Real USMCA Certificate Data Collection
 *
 * This form collects actual client data for certificate generation
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function ClientIntakeForm() {
  const router = useRouter();
  const { projectId } = router.query;

  const [formData, setFormData] = useState({
    // Company Information
    company_name: '',
    company_address: '',
    tax_id: '',
    contact_person: '',
    contact_email: '',
    contact_phone: '',

    // Product Information
    product_description: '',
    hs_code: '',
    product_value: '',

    // Manufacturing Information
    manufacturing_location: '',
    manufacturing_process: '',

    // Component Origins
    component_origins: [
      { component: '', country: '', value: '', percentage: '' }
    ],

    // Trade Information
    destination_country: '',
    annual_trade_volume: '',
    primary_markets: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleComponentChange = (index, field, value) => {
    const newComponents = [...formData.component_origins];
    newComponents[index][field] = value;
    setFormData(prev => ({
      ...prev,
      component_origins: newComponents
    }));
  };

  const addComponent = () => {
    setFormData(prev => ({
      ...prev,
      component_origins: [
        ...prev.component_origins,
        { component: '', country: '', value: '', percentage: '' }
      ]
    }));
  };

  const removeComponent = (index) => {
    if (formData.component_origins.length > 1) {
      const newComponents = formData.component_origins.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        component_origins: newComponents
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/real-usmca-workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'process_client_data',
          projectId,
          clientData: formData
        })
      });

      if (response.ok) {
        setSubmitSuccess(true);
      } else {
        throw new Error('Submission failed');
      }
    } catch (error) {
      alert('Error submitting form: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="container">
        <div className="form-container success">
          <h2>✅ Information Submitted Successfully</h2>
          <p>Thank you for providing your USMCA certificate information.</p>
          <p>We will review your data and generate your certificate. You'll receive an email when it's ready.</p>
          <p><strong>Project ID:</strong> {projectId}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="form-container">
        <h1>USMCA Certificate - Information Form</h1>
        <p>Please provide accurate information for your USMCA certificate generation.</p>

        <form onSubmit={handleSubmit}>
          {/* Company Information */}
          <section>
            <h3>Company Information</h3>

            <div className="form-group">
              <label>Company Name *</label>
              <input
                type="text"
                required
                value={formData.company_name}
                onChange={(e) => handleChange('company_name', e.target.value)}
                placeholder="Enter your company's legal name"
              />
            </div>

            <div className="form-group">
              <label>Company Address *</label>
              <textarea
                required
                value={formData.company_address}
                onChange={(e) => handleChange('company_address', e.target.value)}
                placeholder="Enter complete company address"
                rows={3}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Tax ID / EIN *</label>
                <input
                  type="text"
                  required
                  value={formData.tax_id}
                  onChange={(e) => handleChange('tax_id', e.target.value)}
                  placeholder="Tax identification number"
                />
              </div>

              <div className="form-group">
                <label>Contact Person *</label>
                <input
                  type="text"
                  required
                  value={formData.contact_person}
                  onChange={(e) => handleChange('contact_person', e.target.value)}
                  placeholder="Primary contact name"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Contact Email *</label>
                <input
                  type="email"
                  required
                  value={formData.contact_email}
                  onChange={(e) => handleChange('contact_email', e.target.value)}
                  placeholder="contact@company.com"
                />
              </div>

              <div className="form-group">
                <label>Contact Phone</label>
                <input
                  type="tel"
                  value={formData.contact_phone}
                  onChange={(e) => handleChange('contact_phone', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>
          </section>

          {/* Product Information */}
          <section>
            <h3>Product Information</h3>

            <div className="form-group">
              <label>Product Description *</label>
              <textarea
                required
                value={formData.product_description}
                onChange={(e) => handleChange('product_description', e.target.value)}
                placeholder="Detailed description of the product for USMCA classification"
                rows={3}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>HS Code</label>
                <input
                  type="text"
                  value={formData.hs_code}
                  onChange={(e) => handleChange('hs_code', e.target.value)}
                  placeholder="e.g., 8517.62.00"
                />
              </div>

              <div className="form-group">
                <label>Product Value (USD) *</label>
                <input
                  type="number"
                  required
                  value={formData.product_value}
                  onChange={(e) => handleChange('product_value', e.target.value)}
                  placeholder="Total product value"
                />
              </div>
            </div>
          </section>

          {/* Manufacturing Information */}
          <section>
            <h3>Manufacturing Information</h3>

            <div className="form-group">
              <label>Manufacturing Location *</label>
              <input
                type="text"
                required
                value={formData.manufacturing_location}
                onChange={(e) => handleChange('manufacturing_location', e.target.value)}
                placeholder="Country and city where product is manufactured"
              />
            </div>

            <div className="form-group">
              <label>Manufacturing Process</label>
              <textarea
                value={formData.manufacturing_process}
                onChange={(e) => handleChange('manufacturing_process', e.target.value)}
                placeholder="Brief description of manufacturing process"
                rows={3}
              />
            </div>
          </section>

          {/* Component Origins */}
          <section>
            <h3>Component Origins</h3>
            <p>List all major components and their countries of origin:</p>

            {formData.component_origins.map((component, index) => (
              <div key={index} className="component-row">
                <div className="form-row">
                  <div className="form-group">
                    <label>Component Name</label>
                    <input
                      type="text"
                      value={component.component}
                      onChange={(e) => handleComponentChange(index, 'component', e.target.value)}
                      placeholder="e.g., Circuit board, Housing"
                    />
                  </div>

                  <div className="form-group">
                    <label>Country of Origin</label>
                    <input
                      type="text"
                      value={component.country}
                      onChange={(e) => handleComponentChange(index, 'country', e.target.value)}
                      placeholder="e.g., Mexico, USA, Canada"
                    />
                  </div>

                  <div className="form-group">
                    <label>Value (USD)</label>
                    <input
                      type="number"
                      value={component.value}
                      onChange={(e) => handleComponentChange(index, 'value', e.target.value)}
                      placeholder="Component value"
                    />
                  </div>

                  {formData.component_origins.length > 1 && (
                    <button
                      type="button"
                      className="btn-remove"
                      onClick={() => removeComponent(index)}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}

            <button type="button" className="btn-add" onClick={addComponent}>
              + Add Another Component
            </button>
          </section>

          {/* Trade Information */}
          <section>
            <h3>Trade Information</h3>

            <div className="form-row">
              <div className="form-group">
                <label>Destination Country *</label>
                <input
                  type="text"
                  required
                  value={formData.destination_country}
                  onChange={(e) => handleChange('destination_country', e.target.value)}
                  placeholder="Where will this product be exported to?"
                />
              </div>

              <div className="form-group">
                <label>Annual Trade Volume (USD)</label>
                <input
                  type="number"
                  value={formData.annual_trade_volume}
                  onChange={(e) => handleChange('annual_trade_volume', e.target.value)}
                  placeholder="Estimated annual volume"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Primary Markets</label>
              <textarea
                value={formData.primary_markets}
                onChange={(e) => handleChange('primary_markets', e.target.value)}
                placeholder="List your primary export markets"
                rows={2}
              />
            </div>
          </section>

          <div className="form-actions">
            <button
              type="submit"
              className="btn-submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Information'}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .container {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          font-family: 'Inter', sans-serif;
        }

        .form-container {
          background: white;
          padding: 40px;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        .form-container.success {
          text-align: center;
          color: #16a34a;
        }

        h1 {
          color: #134169;
          margin-bottom: 10px;
        }

        h3 {
          color: #134169;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 8px;
          margin: 30px 0 20px 0;
        }

        section {
          margin-bottom: 30px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        label {
          display: block;
          font-weight: 500;
          color: #374151;
          margin-bottom: 5px;
        }

        input, textarea, select {
          width: 100%;
          padding: 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
        }

        input:focus, textarea:focus {
          outline: none;
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        .component-row {
          background: #f9fafb;
          padding: 15px;
          border-radius: 6px;
          margin-bottom: 15px;
        }

        .btn-add, .btn-remove {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }

        .btn-add {
          background: #e5e7eb;
          color: #374151;
        }

        .btn-remove {
          background: #fef2f2;
          color: #dc2626;
        }

        .form-actions {
          text-align: center;
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
        }

        .btn-submit {
          background: #2563eb;
          color: white;
          padding: 15px 40px;
          border: none;
          border-radius: 6px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
        }

        .btn-submit:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        .btn-submit:hover:not(:disabled) {
          background: #1d4ed8;
        }

        @media (max-width: 768px) {
          .form-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}