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
import SubscriptionContext, { AgentIntelligenceBadges } from '../shared/SubscriptionContext';

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
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="dashboard-title">USMCA Compliance Results</h1>
        <p className="dashboard-subtitle">Professional certificate analysis and tariff savings assessment</p>
      </div>
      
      <CompanyProfile results={results} />

      {/* Subscription Context and Agent Intelligence */}
      {results.subscription_context && (
        <SubscriptionContext
          subscriptionContext={results.subscription_context}
          agentIntelligence={results.enhanced_features}
          className="workflow-subscription-context"
        />
      )}

      <ProductClassification results={results} />

      {/* Agent Intelligence Badges */}
      {results.enhanced_features && results.subscription_context && (
        <AgentIntelligenceBadges
          agentIntelligence={results.enhanced_features}
          subscriptionContext={results.subscription_context}
          className="workflow-intelligence-badges"
        />
      )}

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
        <div className="alert alert-success">
          <div className="alert-icon">✅</div>
          <div className="alert-content">
            <div className="alert-title">Integration Complete</div>
            <p>Get ongoing crisis alerts and unlimited analysis with a paid subscription</p>
            <p>Choose from <a href="/pricing" target="_blank">Starter ($99/month), Professional ($299/month), or Business ($599/month)</a> plans</p>
          </div>
        </div>
      )}
      
      <div className="dashboard-actions">
        <div className="dashboard-actions-left">
          <RecommendedActions results={results} />
        </div>
        <div className="dashboard-actions-right">
          <button 
            onClick={onReset}
            className="btn-secondary"
          >
            🔄 Start New Analysis
          </button>
        </div>
      </div>
    </div>
  );
}