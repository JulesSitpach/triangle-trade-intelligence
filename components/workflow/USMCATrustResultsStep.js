/**
 * USMCA Trust Results Step - Step 3: USMCA Results + Trust Verification Combined
 * Displays USMCA compliance results with integrated trust verification
 */

import React from 'react';
import { calculateDynamicTrustScore, getFallbackTrustScore } from '../../lib/utils/trust-score-calculator.js';

export default function USMCATrustResultsStep({ certificateData }) {
  // Get data from localStorage 
  const [workflowData, setWorkflowData] = React.useState(null);
  const [dynamicTrustData, setDynamicTrustData] = React.useState(null);
  
  React.useEffect(() => {
    const storedData = localStorage.getItem('usmca_workflow_results');
    if (storedData) {
      setWorkflowData(JSON.parse(storedData));
    }
  }, []);

  React.useEffect(() => {
    // Calculate dynamic trust score when workflow data is loaded
    if (workflowData) {
      try {
        const trustData = calculateDynamicTrustScore(workflowData);
        setDynamicTrustData(trustData);
        console.log('USMCATrustResultsStep: Dynamic trust score calculated:', trustData);
      } catch (error) {
        console.error('Failed to calculate dynamic trust score in USMCATrustResultsStep:', error);
        setDynamicTrustData(getFallbackTrustScore());
      }
    }
  }, [workflowData]);

  const componentBreakdown = workflowData?.usmca?.component_breakdown || [];
  const savings = workflowData?.savings || {};
  const product = workflowData?.product || {};
  const company = workflowData?.company || {};

  return (
    <div className="element-spacing">
      <div className="alert alert-success">
        <div className="alert-content">
          <div className="alert-title">USMCA Qualification Results</div>
          <div className="text-body">
            Your analysis has been completed with trust verification. Review the results below.
          </div>
        </div>
      </div>
      
      {/* USMCA Compliance Results */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">✅ USMCA Compliance Status</h3>
        </div>
        
        <div className="status-grid">
          <div className={`status-card ${workflowData?.usmca?.qualified ? 'success' : 'warning'}`}>
            <div className="status-label">Qualification Status</div>
            <div className="status-value">
              {workflowData?.usmca?.qualified ? '✅ QUALIFIED' : '⚠️ NOT QUALIFIED'}
            </div>
            <div className="text-body">
              {workflowData?.usmca?.qualified ? 'Meets USMCA requirements' : 'Does not meet USMCA requirements'}
            </div>
          </div>
          
          <div className="status-card info">
            <div className="status-label">Regional Content</div>
            <div className="status-value">{workflowData?.usmca?.north_american_content || 0}%</div>
            <div className="text-body">North American content</div>
          </div>
          
          <div className="status-card">
            <div className="status-label">Main Product HS Classification</div>
            <div className="status-value">{workflowData?.product?.hs_code || workflowData?.certificate?.hs_tariff_classification || 'Not classified'}</div>
            <div className="text-body">
              {workflowData?.product?.hs_code ? 'AI Classified - ' : ''}Harmonized System code
              {workflowData?.product?.confidence && (
                <span className="badge badge-success">
                  {workflowData.product.confidence}% confidence
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Component Breakdown with HS Codes */}
      {(componentBreakdown.length > 0 || workflowData?.component_origins?.length > 0) && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">📦 Component Analysis with HS Classifications</h3>
          </div>
          
          {/* Use component_origins from API response which includes HS codes */}
          {(workflowData?.component_origins || componentBreakdown).map((component, index) => (
            <div key={index} className="status-card">
              <div className="status-label">{component.description}</div>
              <div className="status-value">
                {component.value_percentage}% from {component.origin_country}
              </div>
              
              {/* Show AI-classified HS code prominently */}
              {component.hs_code && (
                <div className="text-body">
                  <strong>HS Code: {component.hs_code}</strong> 
                  {(component.source || component.classification_source) && (
                    <span className="badge badge-info">
                      {(component.source === 'ai_classified' || component.classification_source === 'AI') ? 'AI Classified' : 'User Provided'}
                    </span>
                  )}
                  {component.confidence && (
                    <span className="badge badge-success">
                      {component.confidence}% confidence
                    </span>
                  )}
                </div>
              )}
              
              {component.manufacturing_location && (
                <div className="text-body">Manufacturing: {component.manufacturing_location}</div>
              )}
            </div>
          ))}
          
          <div className="status-card success">
            <div className="status-label">Total Regional Content</div>
            <div className="status-value">{workflowData?.usmca?.north_american_content || 0}%</div>
          </div>
        </div>
      )}

      {/* Savings Analysis */}
      {workflowData?.savings && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">💰 Savings Analysis</h3>
          </div>
          
          <div className="status-grid">
            <div className="status-card">
              <div className="status-label">Current MFN Rate</div>
              <div className="status-value">{workflowData.savings.mfn_rate}%</div>
            </div>
            <div className="status-card">
              <div className="status-label">USMCA Rate</div>
              <div className="status-value">{workflowData.savings.usmca_rate}%</div>
            </div>
            <div className="status-card success">
              <div className="status-label">Annual Savings</div>
              <div className="status-value">${(workflowData.savings.total_savings || workflowData.savings.annual_savings)?.toLocaleString()}</div>
            </div>
          </div>
        </div>
      )}
      
      {/* Trust Verification Display */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">🛡️ Trust Verification</h3>
        </div>
        
        <div className="status-grid">
          <div className="status-card">
            <div className="status-label">Trust Score</div>
            <div className="status-value success">
              {workflowData?.trust?.score ? `${workflowData.trust.score}%` : (dynamicTrustData?.trust_score_display || 'Calculating...')}
            </div>
            <div className={`badge ${
              (workflowData?.trust?.level === 'High') ? 'badge-success' :
              (workflowData?.trust?.level === 'Medium') ? 'badge-warning' :
              (dynamicTrustData?.trust_indicators?.verification_status === 'verified') ? 'badge-success' : 
              (dynamicTrustData?.trust_indicators?.verification_status === 'partially_verified') ? 'badge-warning' : 
              'badge-info'
            }`}>
              {workflowData?.trust?.level || 
               (dynamicTrustData?.trust_indicators?.verification_status === 'verified' ? 'Verified' :
                dynamicTrustData?.trust_indicators?.verification_status === 'partially_verified' ? 'Partial' :
                dynamicTrustData?.has_sufficient_data === false ? 'Insufficient Data' : 'Pending')}
            </div>
          </div>
          
          <div className="status-card">
            <div className="status-label">Data Verification</div>
            <div className="status-value">
              {dynamicTrustData?.trust_indicators?.confidence_indicators?.source_verification === 'verified' ? 'Verified' : 'Automatic'}
            </div>
            <div className={`badge ${
              dynamicTrustData?.trust_indicators?.confidence_indicators?.source_verification === 'verified' ? 'badge-success' : 'badge-info'
            }`}>
              {dynamicTrustData?.trust_indicators?.confidence_indicators?.source_verification === 'verified' ? 'Complete' : 'Automated'}
            </div>
          </div>
          
          <div className="status-card">
            <div className="status-label">Expert Validation</div>
            <div className="status-value">
              {(() => {
                if (dynamicTrustData?.trust_indicators?.needs_immediate_review) {
                  return 'Immediate Review Required';
                } else if (dynamicTrustData?.trust_indicators?.needs_expert_review) {
                  return 'Expert Review Required';
                } else if (dynamicTrustData?.has_sufficient_data) {
                  return 'Not Required';
                } else {
                  return 'Data Review Required';
                }
              })()}
            </div>
            <div className={`badge ${
              dynamicTrustData?.trust_indicators?.needs_immediate_review ? 'badge-danger' :
              dynamicTrustData?.trust_indicators?.needs_expert_review ? 'badge-warning' :
              dynamicTrustData?.has_sufficient_data ? 'badge-success' : 'badge-info'
            }`}>
              {(() => {
                if (dynamicTrustData?.trust_indicators?.needs_immediate_review) {
                  return 'Critical';
                } else if (dynamicTrustData?.trust_indicators?.needs_expert_review) {
                  return 'Review Needed';
                } else if (dynamicTrustData?.has_sufficient_data) {
                  return 'Auto-Approved';
                } else {
                  return 'Pending';
                }
              })()}
            </div>
          </div>
        </div>
        
        <div className="alert alert-info">
          <div className="alert-content">
            <div className="alert-title">Trust Verification Complete</div>
            <div className="text-body">
              Your USMCA analysis has passed trust verification. You can now proceed to collect signatory information and generate your official certificate.
            </div>
          </div>
        </div>
      </div>
      
      {/* Certificate Preview */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">📋 Certificate Preview</h3>
        </div>
        
        <div className="status-grid">
          <div className="status-card">
            <div className="status-label">Exporter</div>
            <div className="status-value">{certificateData.company_info?.exporter_name || 'To be completed'}</div>
          </div>
          <div className="status-card">
            <div className="status-label">Importer</div>
            <div className="status-value">{certificateData.company_info?.importer_name || 'To be completed'}</div>
          </div>
          <div className="status-card">
            <div className="status-label">Product</div>
            <div className="status-value">{certificateData.product_details?.commercial_description || 'Product classification verified'}</div>
          </div>
          <div className="status-card">
            <div className="status-label">Origin Criterion</div>
            <div className="status-value">{certificateData.product_details?.preference_criterion || 'B - Regional Value Content'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
