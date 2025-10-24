/**
 * CertificateSection - Auto-generated Certificate Download
 * IF QUALIFIED: Auto-generate certificate from workflow data, show Download button
 * IF NOT QUALIFIED: Show options to get help
 */

import React, { useState } from 'react';
import { generateUSMCACertificatePDF } from '../../../lib/utils/usmca-certificate-pdf-generator';

export default function CertificateSection({ results, onDownloadCertificate }) {
  // ✅ FIX: Move useState BEFORE conditional return (React Rules of Hooks)
  const [isGenerating, setIsGenerating] = useState(false);

  if (!results?.certificate) return null;

  const certificate = results.certificate;
  const isQualified = results?.usmca?.qualified || false;

  const handleDownloadCertificate = async () => {
    setIsGenerating(true);

    try {
      // VALIDATION: Check required fields before generating certificate
      const requiredCompanyFields = [
        { field: 'name', value: results.company?.name || results.company?.company_name },
        { field: 'country', value: results.company?.country || results.company?.company_country }
      ];

      const missingFields = requiredCompanyFields.filter(f => !f.value || f.value.trim?.() === '');

      if (missingFields.length > 0) {
        const fieldNames = missingFields.map(f => f.field).join(', ');
        alert(`❌ Certificate generation failed: Missing required company information (${fieldNames}). Please go back to Step 1 and verify all company details are filled in completely.`);
        setIsGenerating(false);
        return;
      }

      // Auto-generate certificate from workflow results
      const certificateData = {
        exporter: {
          name: results.company?.name || results.company?.company_name || '',
          country: results.company?.country || results.company?.company_country || '',
          address: results.company?.address || results.company?.company_address || '',
          tax_id: results.company?.tax_id || '',
          phone: results.company?.phone || results.company?.contact_phone || '',
          email: results.company?.email || results.company?.contact_email || ''
        },
        product: {
          hs_code: results.product?.hs_code || '',
          description: results.product?.description || results.product?.product_description || '',
          // ✅ REMOVED: preference_criterion default || 'B' (line 50)
          // REASON: Defaulting to 'B' is FALSE CERTIFICATION - violates USMCA Article 5.2
          // FIX: AI must determine preference criterion, never default
          preference_criterion: certificate.preference_criterion
        },
        usmca_analysis: {
          qualified: isQualified,
          regional_content: results.usmca?.regional_content || results.usmca?.north_american_content || 0,
          rule: results.usmca?.rule || 'Regional Value Content',
          threshold: results.usmca?.threshold_applied || 60
        },
        authorization: {
          signatory_name: results.company?.name || 'Authorized Signatory',
          signatory_title: 'Exporter',
          signatory_date: new Date().toISOString()
        },
        blanket_period: {
          start_date: certificate.blanket_start || new Date().toISOString().split('T')[0],
          end_date: certificate.blanket_end || new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0]
        }
      };

      // Generate PDF
      await generateUSMCACertificatePDF(certificateData);

      // Save certificate to database
      try {
        const saveResponse = await fetch('/api/workflow-session/update-certificate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            product_description: results.product?.description || results.product?.product_description || '',
            hs_code: results.product?.hs_code || '',
            certificate_data: certificateData,
            certificate_generated: true
          })
        });

        if (saveResponse.ok) {
          console.log('✅ Certificate saved to database');
        }
      } catch (saveError) {
        console.warn('⚠️ Failed to save certificate to database:', saveError);
        // Don't block PDF download if database save fails
      }

      console.log('✅ Certificate PDF generated successfully');
    } catch (error) {
      console.error('Failed to generate certificate:', error);
      alert('Failed to generate certificate. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isQualified) {
    // NOT QUALIFIED - Show help options
    return (
      <div className="element-spacing">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Get Help to Qualify</h3>
          </div>

          <div className="alert alert-warning">
            <div className="alert-content">
              <div className="alert-title">Not Qualified for USMCA Benefits</div>
              <div className="text-body">
                Your product does not currently meet USMCA regional content requirements.
                Our team can help you restructure your supply chain to qualify.
              </div>
            </div>
          </div>

          <div className="hero-buttons">
            <button
              onClick={() => window.location.href = '/trade-risk-alternatives'}
              className="btn-secondary"
            >
              📊 View Analysis
            </button>

            <button
              onClick={() => window.location.href = '/services/logistics-support'}
              className="btn-primary"
            >
              🇲🇽 Get Help to Qualify
            </button>

            <button
              onClick={() => window.location.href = '/services/logistics-support'}
              className="btn-secondary"
            >
              🎯 Request Service
            </button>
          </div>
        </div>
      </div>
    );
  }

  // QUALIFIED - Generate and preview certificate
  const handleGenerateCertificate = () => {
    // Save current results to localStorage for certificate wizard
    localStorage.setItem('usmca_workflow_results', JSON.stringify(results));
    localStorage.setItem('certificate_qualified', 'true');

    // Navigate to certificate completion page
    window.location.href = '/usmca-certificate-completion';
  };

  return (
    <div className="element-spacing">
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">✅ Ready to Generate Certificate</h3>
        </div>

        <div className="element-spacing">
          <div className="alert alert-success">
            <div className="alert-content">
              <div className="alert-title">Your Product Qualifies for USMCA</div>
              <div className="text-body">
                Generate your certificate with complete company details, then preview before downloading.
              </div>
            </div>
          </div>

          <div className="status-grid">
            <div className="status-card">
              <div className="status-label">Qualification Status</div>
              <div className="status-value success">QUALIFIED</div>
            </div>
            <div className="status-card">
              <div className="status-label">Preference Criterion</div>
              {/* ✅ REMOVED: || 'B' default (line 186)
                  REASON: Shows FALSE data in UI if AI didn't determine criterion
                  FIX: Display null/undefined indicator instead */}
              <div className="status-value">{certificate.preference_criterion || '⚠️ Not determined'}</div>
            </div>
            <div className="status-card">
              <div className="status-label">Regional Content</div>
              <div className="status-value success">{results.usmca?.regional_content || results.usmca?.north_american_content || 0}%</div>
            </div>
            <div className="status-card">
              <div className="status-label">Validity Period</div>
              <div className="status-value">1 Year</div>
            </div>
          </div>
        </div>

        <div className="hero-buttons">
          <button
            onClick={handleGenerateCertificate}
            className="btn-primary"
          >
            📄 Generate & Preview Certificate
          </button>

          <button
            onClick={() => window.location.href = '/services/logistics-support'}
            className="btn-secondary"
          >
            🎯 Request Professional Service
          </button>
        </div>

        <div className="alert alert-info">
          <div className="alert-content">
            <div className="alert-title">What happens next?</div>
            <div className="text-body">
              1. Complete any missing company details<br />
              2. Review your certificate preview<br />
              3. Download your USMCA certificate PDF<br /><br />
              <strong>Need audit-proof certification?</strong> Request our professional service ($250) backed by a trade compliance expert.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}