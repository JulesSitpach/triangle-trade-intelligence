/**
 * WorkflowResults - Step 3 results display
 * Focused component displaying USMCA compliance results
 * Includes trust indicators and professional disclaimers
 */

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
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
  const router = useRouter();
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

  const handleSetUpAlerts = () => {
    console.log('🚨 ========== SETTING UP TRADE ALERTS ==========');
    console.log('📊 Results object structure:', {
      has_component_origins: !!(results.component_origins),
      has_components: !!(results.components),
      component_origins_length: (results.component_origins || []).length,
      components_length: (results.components || []).length,
      component_origins_data: results.component_origins || results.components
    });

    // Prepare complete workflow data for AI vulnerability analysis
    const alertData = {
      company: {
        name: results.company?.name || results.company?.company_name,
        company_name: results.company?.name || results.company?.company_name,
        business_type: results.company?.business_type,
        trade_volume: results.company?.trade_volume,
        annual_trade_volume: results.company?.trade_volume
      },
      product: {
        hs_code: results.product?.hs_code,
        description: results.product?.description || results.product?.product_description,
        product_description: results.product?.description || results.product?.product_description
      },
      usmca: {
        qualified: results.usmca?.qualified,
        qualification_status: results.usmca?.qualified ? 'QUALIFIED' : 'NOT_QUALIFIED',
        north_american_content: results.usmca?.north_american_content || results.usmca?.regional_content,
        threshold_applied: results.usmca?.threshold_applied,
        gap: results.usmca?.gap || 0
      },
      component_origins: results.component_origins || results.components || [],
      components: results.component_origins || results.components || [],
      savings: {
        total_savings: results.savings?.annual_savings || 0,
        annual_savings: results.savings?.annual_savings || 0
      },
      workflow_path: 'alerts',
      timestamp: new Date().toISOString()
    };

    // Save to localStorage for alerts page
    localStorage.setItem('usmca_workflow_results', JSON.stringify(alertData));
    localStorage.setItem('usmca_workflow_data', JSON.stringify(alertData));
    localStorage.setItem('usmca_company_data', JSON.stringify(alertData.company));

    console.log('✅ Alert data prepared and saved to localStorage:', {
      company: alertData.company?.name,
      component_origins_count: alertData.component_origins?.length,
      component_origins: alertData.component_origins,
      qualified: alertData.usmca?.qualified,
      localStorage_keys: Object.keys(localStorage).filter(k => k.includes('usmca'))
    });

    // Navigate to alerts page
    console.log('🔄 Navigating to /trade-risk-alternatives...');
    router.push('/trade-risk-alternatives');
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

      {/* AI-Powered Trade Alerts CTA - Primary placement */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">🚨 AI-Powered Trade Risk Monitoring</h3>
        </div>
        <div className="card-description">
          <p className="text-body">
            {results.usmca?.qualified
              ? 'Protect your USMCA qualification with real-time alerts about supply chain risks, tariff changes, and geopolitical events affecting your component origins.'
              : 'Monitor trade policy changes that could help you achieve USMCA qualification. Get alerts about new sourcing opportunities and tariff developments.'}
          </p>

          <p><strong>What you get:</strong></p>
          <ul>
            <li>✓ AI analyzes your {(results.component_origins || results.components || []).length} component origins</li>
            <li>✓ Personalized alerts for {results.company?.business_type || 'your industry'}</li>
            <li>✓ Real-time geopolitical risk monitoring</li>
            <li>✓ Tariff change notifications specific to your supply chain</li>
          </ul>

          <button
            onClick={handleSetUpAlerts}
            className="btn-primary"
          >
            🚨 Set Up Trade Alerts
          </button>
          <p className="text-body">Free analysis • Takes 2 minutes</p>
        </div>
      </div>

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
            onClick={handleSetUpAlerts}
            className="btn-primary"
            title="Get AI-powered alerts for your supply chain vulnerabilities"
          >
            🚨 Set Up Trade Alerts
          </button>
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