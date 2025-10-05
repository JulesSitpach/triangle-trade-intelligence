/**
 * CertificateSection - Auto-generated Certificate Download
 * IF QUALIFIED: Auto-generate certificate from workflow data, show Download button
 * IF NOT QUALIFIED: Show options to get help
 */

import React, { useState } from 'react';
import { generateUSMCACertificatePDF } from '../../../lib/utils/usmca-certificate-pdf-generator';

export default function CertificateSection({ results, onDownloadCertificate }) {

  if (!results?.certificate) return null;

  const [isGenerating, setIsGenerating] = useState(false);
  const certificate = results.certificate;
  const isQualified = results?.usmca?.qualified || false;

  const handleDownloadCertificate = async () => {
    setIsGenerating(true);

    try {
      // Auto-generate certificate from workflow results
      const certificateData = {
        exporter: {
          name: results.company?.name || results.company?.company_name || '',
          address: results.company?.address || results.company?.company_address || '',
          tax_id: results.company?.tax_id || '',
          phone: results.company?.phone || results.company?.contact_phone || '',
          email: results.company?.email || results.company?.contact_email || ''
        },
        product: {
          hs_code: results.product?.hs_code || '',
          description: results.product?.description || results.product?.product_description || '',
          preference_criterion: certificate.preference_criterion || 'B'
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

  // QUALIFIED - Auto-generate and download certificate
  return (
    <div className="element-spacing">
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">✅ USMCA Certificate Ready</h3>
        </div>

        <div className="element-spacing">
          <div className="alert alert-success">
            <div className="alert-content">
              <div className="alert-title">Your Certificate is Ready to Download</div>
              <div className="text-body">
                Your product qualifies for USMCA benefits. Download your certificate now.
              </div>
            </div>
          </div>

          <div className="status-grid">
            <div className="status-card">
              <div className="status-label">Valid From</div>
              <div className="status-value">
                {new Date(certificate.blanket_start).toLocaleDateString()}
              </div>
            </div>
            <div className="status-card">
              <div className="status-label">Valid Until</div>
              <div className="status-value">
                {new Date(certificate.blanket_end).toLocaleDateString()}
              </div>
            </div>
            <div className="status-card">
              <div className="status-label">Preference Criterion</div>
              <div className="status-value">{certificate.preference_criterion}</div>
            </div>
            <div className="status-card">
              <div className="status-label">Regional Content</div>
              <div className="status-value">{results.usmca?.regional_content || 0}%</div>
            </div>
          </div>
        </div>

        <div className="hero-buttons">
          <button
            onClick={handleDownloadCertificate}
            className="btn-primary"
            disabled={isGenerating}
          >
            {isGenerating ? '⏳ Generating PDF...' : '📥 Download Certificate'}
          </button>

          <button
            onClick={() => window.location.href = '/services/logistics-support'}
            className="btn-secondary"
          >
            🎯 Request Service
          </button>
        </div>

        <div className="alert alert-info">
          <div className="alert-content">
            <div className="alert-title">Need Professional Certification?</div>
            <div className="text-body">
              For audit-proof certificates backed by a licensed customs broker, request our professional service ($250).
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}