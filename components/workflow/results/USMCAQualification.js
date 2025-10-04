/**
 * USMCAQualification - USMCA qualification status display
 * Shows qualification status with detailed reasoning
 */

import React from 'react';
import { Shield, CheckCircle, XCircle } from '../../Icons';

export default function USMCAQualification({ results }) {
  console.log('🚨 USMCAQualification component called with:', results);
  if (!results?.usmca) return null;

  const { qualified, rule, reason, documentation_required } = results.usmca;
  
  // Extract gap analysis data from API response
  const extractGapAnalysis = () => {
    console.log('🔍 Gap Analysis Debug:', { qualified, results });

    // Don't show for qualified products
    if (qualified) return null;

    // Get threshold from API response (from config file via our hybrid approach)
    const currentContent = results.usmca.north_american_content || 0;
    const requiredThreshold = results.usmca.threshold_applied || results.usmca.threshold_required || 62.5;
    const gap = requiredThreshold - currentContent;

    console.log('📊 Threshold Data:', {
      currentContent,
      requiredThreshold,
      gap,
      source: 'API response (config file)'
    });

    if (gap <= 0) return null;

    // Get component data from usmca.component_breakdown (from API)
    const components = results.usmca.component_breakdown || [];

    // Find largest non-USMCA component
    const nonUsmcaComponents = components.filter(c =>
      !c.is_usmca_member && c.value_percentage > 0
    ).sort((a, b) => b.value_percentage - a.value_percentage);

    const targetComponent = nonUsmcaComponents[0];
    if (!targetComponent) return null;

    // Get savings from API if available
    const potentialSavings = results.savings?.annual_savings || 0;

    return {
      gap,
      currentContent,
      requiredThreshold,
      targetComponent,
      potentialSavings,
      estimatedTimeline: gap > 20 ? '6-12 months' : '3-6 months'
    };
  };
  
  const gapAnalysis = extractGapAnalysis();

  // If no gap analysis available, don't show the qualification path section
  if (!gapAnalysis) {
    // Component will render basic qualification status only
  }

  return (
    <div className="element-spacing">
      <div className={qualified ? 'alert alert-success' : 'alert alert-warning'}>
        <div className="alert-content">
          <div className="header-actions">
            <div className="header-actions">
              <Shield className="icon-sm" />
              <h3 className="card-title">USMCA Qualification Status</h3>
            </div>
            <div className="header-actions">
              {qualified ? 
                <CheckCircle className="icon-sm" /> : 
                <XCircle className="icon-sm" />
              }
              <span className={qualified ? 'status-value success' : 'status-value warning'}>
                {qualified ? 'QUALIFIED' : 'NOT QUALIFIED'}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="card">
        <div className="status-grid">
          <div className="header-actions">
            <span className="form-label">Rule Applied:</span>
            <span className="status-value">{rule}</span>
          </div>
          <div className="header-actions">
            <span className="form-label">Reason:</span>
            <span className="status-value">{reason}</span>
          </div>
        </div>
        {documentation_required && documentation_required.length > 0 && (
          <div className="element-spacing">
            <div className="alert alert-info">
              <div className="alert-content">
                <div className="alert-title">Documentation Required:</div>
                <ul className="element-spacing">
                  {documentation_required.map((doc, index) => (
                    <li key={index} className="text-body">• {doc}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
        
        {/* Business Intelligence: Gap Analysis & Recommendations */}
        {!qualified && gapAnalysis && (
          <div className="element-spacing">
            <div className="card">
              <div className="card-header">
                <h4 className="card-title">📈 Qualification Path Available</h4>
                <div className="text-body">Transform this "NOT QUALIFIED" into business opportunity</div>
              </div>
              <div className="card-content">
                
                {/* Gap Analysis */}
                <div className="status-grid">
                  <div className="header-actions">
                    <span className="form-label">Gap to Close:</span>
                    <span className="status-value warning">{gapAnalysis.gap.toFixed(1)}%</span>
                  </div>
                  <div className="header-actions">
                    <span className="form-label">Current USMCA Content:</span>
                    <span className="status-value">{gapAnalysis.currentContent.toFixed(1)}%</span>
                  </div>
                  <div className="header-actions">
                    <span className="form-label">Required Threshold:</span>
                    <span className="status-value">{gapAnalysis.requiredThreshold}%</span>
                  </div>
                </div>

                {/* Strategic Recommendation */}
                <div className="alert alert-info">
                  <div className="alert-content">
                    <div className="alert-title">🎯 Strategic Recommendation</div>
                    <div className="text-body">
                      <strong>Replace {gapAnalysis.targetComponent.origin_country} supplier ({gapAnalysis.targetComponent.description})</strong>
                      <br />Switch from {gapAnalysis.targetComponent.origin_country} to Mexico alternative for {gapAnalysis.targetComponent.value_percentage}% component
                    </div>
                  </div>
                </div>

                {/* Business Impact */}
                <div className="status-grid">
                  <div className="header-actions">
                    <span className="form-label">Estimated Annual Savings:</span>
                    <span className="status-value success">${gapAnalysis.potentialSavings.toLocaleString()}</span>
                  </div>
                  <div className="header-actions">
                    <span className="form-label">Timeline:</span>
                    <span className="status-value">{gapAnalysis.estimatedTimeline}</span>
                  </div>
                </div>

                {/* Triangle Trade Intelligence Business Opportunity */}
                <div className="alert alert-success">
                  <div className="alert-content">
                    <div className="alert-title">🤝 Triangle Trade Intelligence Can Help</div>
                    <div className="text-body">
                      • Connect you with qualified Mexico suppliers for your industry<br />
                      • Supply chain assessment and transition planning<br />
                      • Expert guidance for USMCA qualification<br />
                      • Crisis-resistant USMCA-compliant sourcing strategies
                    </div>
                  </div>
                </div>

                {/* Next Steps */}
                <div className="card">
                  <div className="card-header">
                    <h5 className="card-title">⚡ Immediate Actions</h5>
                  </div>
                  <div className="card-content">
                    <div className="button-group">
                      <button
                        className="btn btn-primary"
                        disabled={!results?.company?.company_name || !gapAnalysis?.targetComponent}
                        onClick={async () => {
                          if (!results?.company?.company_name || !gapAnalysis?.targetComponent) {
                            alert('❌ Missing required data. Please complete the workflow first.');
                            return;
                          }

                          const requestData = {
                            type: 'supplier_introduction_request',
                            company_name: results.company.company_name,
                            business_type: results.company.business_type,
                            supplier_type: 'mexico_supplier',
                            component_needed: gapAnalysis.targetComponent.description,
                            gap_percentage: gapAnalysis.gap,
                            trade_volume: results.company.trade_volume,
                            timestamp: new Date().toISOString()
                          };
                          
                          try {
                            const response = await fetch('/api/admin/business-opportunity-analytics', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify(requestData)
                            });
                            
                            if (response.ok) {
                              alert('✅ Request submitted! Triangle Trade Intelligence will contact you within 24 hours with qualified Mexico suppliers.');
                            } else {
                              alert('❌ Request failed. Please try again or contact support.');
                            }
                          } catch (error) {
                            alert('❌ Request failed. Please try again or contact support.');
                          }
                        }}
                      >
                        Request Mexico Supplier Introduction
                      </button>
                      <button
                        className="btn btn-secondary"
                        disabled={!results?.company?.company_name || !gapAnalysis}
                        onClick={async () => {
                          if (!results?.company?.company_name || !gapAnalysis) {
                            alert('❌ Missing required data. Please complete the workflow first.');
                            return;
                          }

                          const assessmentData = {
                            type: 'supply_chain_assessment_request',
                            company_name: results.company.company_name,
                            business_type: results.company.business_type,
                            current_usmca_content: gapAnalysis.currentContent,
                            required_threshold: gapAnalysis.requiredThreshold,
                            components: results?.components || [],
                            trade_volume: results.company.trade_volume,
                            timestamp: new Date().toISOString()
                          };
                          
                          try {
                            const response = await fetch('/api/admin/business-opportunity-analytics', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify(assessmentData)
                            });
                            
                            if (response.ok) {
                              alert('✅ Assessment scheduled! Our supply chain experts will contact you within 48 hours to schedule your consultation.');
                            } else {
                              alert('❌ Request failed. Please try again or contact support.');
                            }
                          } catch (error) {
                            alert('❌ Request failed. Please try again or contact support.');
                          }
                        }}
                      >
                        Schedule Supply Chain Assessment
                      </button>
                      <button
                        className="btn btn-secondary"
                        disabled={!results?.company?.company_name || !gapAnalysis}
                        onClick={() => {
                          if (!results?.company?.company_name || !gapAnalysis) {
                            alert('❌ Missing required data. Please complete the workflow first.');
                            return;
                          }

                          const data = {
                            company: results.company.company_name,
                            currentContent: gapAnalysis.currentContent,
                            requiredThreshold: gapAnalysis.requiredThreshold,
                            gap: gapAnalysis.gap,
                            timeline: gapAnalysis.estimatedTimeline,
                            targetComponent: gapAnalysis.targetComponent
                          };
                          const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `${data.company}-transition-timeline.json`;
                          a.click();
                          URL.revokeObjectURL(url);
                        }}
                      >
                        Download Transition Timeline
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}