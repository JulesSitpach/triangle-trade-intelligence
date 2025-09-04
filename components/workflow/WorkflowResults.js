/**
 * WorkflowResults - Step 3 results display
 * Focused component displaying USMCA compliance results
 * Includes trust indicators and professional disclaimers
 */

import React, { useEffect, useState } from 'react';
import CompanyProfile from './results/CompanyProfile';
import ProductClassification from './results/ProductClassification';
import DataSourceAttribution from './results/DataSourceAttribution';
import USMCAQualification from './results/USMCAQualification';
import TariffSavings from './results/TariffSavings';
import CertificateSection from './results/CertificateSection';
import RecommendedActions from './results/RecommendedActions';

export default function WorkflowResults({
  results,
  onReset,
  onDownloadCertificate,
  trustIndicators
}) {
  const [dataSentToAlerts, setDataSentToAlerts] = useState(false);

  useEffect(() => {
    // Auto-send certificate completion data to alerts dashboard
    if (results && results.certificate) {
      sendCertificateDataToAlerts(results);
    }
  }, [results]);

  const sendCertificateDataToAlerts = async (completionResults) => {
    try {
      // Prepare certificate completion data for alerts dashboard
      const certificateData = {
        company: {
          name: completionResults.company?.name || 'Certificate Holder',
          business_type: completionResults.company?.business_type || 'manufacturing',
          annual_trade_volume: completionResults.company?.annual_trade_volume || 1000000
        },
        product: {
          hs_code: completionResults.product?.hs_code || completionResults.classification?.hs_code,
          description: completionResults.product?.description || completionResults.classification?.description
        },
        certificate: {
          id: completionResults.certificate.id || 'CERT-' + Date.now(),
          status: 'completed',
          qualification_result: completionResults.qualification?.qualified ? 'QUALIFIED' : 'NOT_QUALIFIED',
          savings: completionResults.savings?.total_savings || 0
        },
        workflow_path: 'certificate',
        completion_timestamp: new Date().toISOString()
      };

      // Save to localStorage for alerts dashboard pickup
      localStorage.setItem('usmca_workflow_data', JSON.stringify(certificateData));
      localStorage.setItem('usmca_company_data', JSON.stringify(certificateData.company));

      console.log('Certificate completion data sent to alerts system:', certificateData);
      setDataSentToAlerts(true);

    } catch (error) {
      console.error('Failed to send certificate data to alerts system:', error);
    }
  };

  if (!results) return null;

  return (
    <div className="card">
      <h2 className="page-title section-spacing">
        USMCA Compliance Results
      </h2>
      
      <CompanyProfile results={results} />
      
      <ProductClassification results={results} />
      
      <DataSourceAttribution results={results} trustIndicators={trustIndicators} />
      
      <USMCAQualification results={results} />
      
      {results.savings && (
        <TariffSavings results={results} />
      )}
      
      {results.certificate && (
        <CertificateSection 
          results={results} 
          onDownloadCertificate={onDownloadCertificate} 
        />
      )}

      {/* Data Integration Status */}
      {dataSentToAlerts && (
        <div className="status-success section-spacing" style={{display: 'block', padding: '16px', borderRadius: '8px'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px'}}>
            <div style={{width: '8px', height: '8px', backgroundColor: 'var(--sage-500)', borderRadius: '50%'}}></div>
            <p className="text-body" style={{fontWeight: '500'}}>
              ✅ Certificate data automatically added to crisis alerts monitoring system
            </p>
          </div>
          <p className="text-body" style={{fontSize: '12px', marginTop: '4px'}}>
            Visit <a href="/trump-tariff-alerts" target="_blank" style={{textDecoration: 'underline'}}>Crisis Alerts Dashboard</a> to see your personalized monitoring
          </p>
        </div>
      )}
      
      <div className="section-divider" style={{textAlign: 'center', paddingTop: '24px'}}>
        <button 
          onClick={onReset}
          className="btn-secondary element-spacing"
        >
          🔄 Start New Analysis
        </button>
        
        <RecommendedActions results={results} />
      </div>
    </div>
  );
}