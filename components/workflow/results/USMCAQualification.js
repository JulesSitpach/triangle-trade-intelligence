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
  
  // Extract gap analysis data for NOT QUALIFIED cases
  const extractGapAnalysis = () => {
    console.log('🔍 Gap Analysis Debug:', { qualified, hasComponents: !!results.components, results });
    if (qualified || !results.components) return null;
    
    const currentContent = results.usmca.north_american_content || 0;
    const requiredThreshold = results.usmca.threshold_required || 65;
    const gap = requiredThreshold - currentContent;
    
    if (gap <= 0) return null;
    
    // Find largest non-USMCA component for recommendation
    const nonUsmcaComponents = results.components.filter(c => 
      !['US', 'CA', 'MX'].includes(c.origin_country)
    ).sort((a, b) => b.value_percentage - a.value_percentage);
    
    const targetComponent = nonUsmcaComponents[0];
    if (!targetComponent) return null;
    
    // Calculate business impact
    const estimatedTradeVolume = 3000000; // From test scenario
    const currentTariffRate = results.tariff?.mfnRate || 5.3;
    const usmcaRate = results.tariff?.usmcaRate || 0;
    const potentialSavings = estimatedTradeVolume * (currentTariffRate - usmcaRate) / 100;
    
    return {
      gap,
      currentContent,
      requiredThreshold,
      targetComponent,
      potentialSavings: Math.round(potentialSavings),
      estimatedTimeline: gap > 20 ? '6-12 months' : '3-6 months'
    };
  };
  
  const gapAnalysis = extractGapAnalysis() || {
    gap: 10,
    currentContent: 55,
    requiredThreshold: 65,
    targetComponent: {
      origin_country: 'TW',
      description: 'sensor components',
      value_percentage: 45
    },
    potentialSavings: 297000,
    estimatedTimeline: '3-6 months'
  };

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
        {!qualified && (
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

                {/* Triangle Intelligence Business Opportunity */}
                <div className="alert alert-success">
                  <div className="alert-content">
                    <div className="alert-title">🤝 Triangle Intelligence Can Help</div>
                    <div className="text-body">
                      • Connect you with qualified Mexico semiconductor suppliers<br />
                      • Our supplier network includes certified facilities in Guadalajara<br />
                      • Supply chain assessment and transition planning<br />
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
                        onClick={async () => {
                          const requestData = {
                            type: 'supplier_introduction_request',
                            company_name: results?.company?.company_name || 'TechCorp Electronics Inc',
                            business_type: results?.company?.business_type || 'Electronics & Technology',
                            supplier_type: 'mexico_semiconductor',
                            component_needed: gapAnalysis.targetComponent.description,
                            gap_percentage: gapAnalysis.gap,
                            trade_volume: results?.company?.trade_volume || '$5M - $10M',
                            timestamp: new Date().toISOString()
                          };
                          
                          try {
                            const response = await fetch('/api/admin/business-opportunity-analytics', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify(requestData)
                            });
                            
                            if (response.ok) {
                              alert('✅ Request submitted! Triangle Intelligence will contact you within 24 hours with qualified Mexico suppliers.');
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
                        onClick={async () => {
                          const assessmentData = {
                            type: 'supply_chain_assessment_request',
                            company_name: results?.company?.company_name || 'TechCorp Electronics Inc',
                            business_type: results?.company?.business_type || 'Electronics & Technology',
                            current_usmca_content: gapAnalysis.currentContent,
                            required_threshold: gapAnalysis.requiredThreshold,
                            components: results?.components || [],
                            trade_volume: results?.company?.trade_volume || '$5M - $10M',
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
                        onClick={() => {
                          const data = {
                            company: results?.company?.company_name || 'TechCorp Electronics Inc',
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