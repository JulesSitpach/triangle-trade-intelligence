/**
 * WorkflowResults - Step 3 results display
 * Focused component displaying USMCA compliance results
 * Includes trust indicators and professional disclaimers
 */

import React, { useEffect, useState, useRef } from 'react';
import ReactDOM from 'react-dom';
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
  const [showSaveConsentModal, setShowSaveConsentModal] = useState(false);
  const [userMadeChoice, setUserMadeChoice] = useState(false);
  const [modalChoice, setModalChoice] = useState('save'); // Default to save
  const modalShownRef = useRef(false);
  const modalClosedTimeRef = useRef(0);
  const isProcessingRef = useRef(false);
  const buttonClickLockRef = useRef(false);

  // DEBUG: Log when modal state changes only
  useEffect(() => {
    console.log('🔄 Modal state changed:', { showSaveConsentModal, userMadeChoice });
  }, [showSaveConsentModal, userMadeChoice]);

  useEffect(() => {
    // Check if user has already made a save choice
    const savedChoice = localStorage.getItem('save_data_consent');
    if (savedChoice) {
      setUserMadeChoice(true);
      console.log('✅ User previously chose:', savedChoice);
    }
  }, []);

  // DISABLED: Auto-modal removed - users now use manual "Save to Dashboard" button
  // useEffect(() => {
  //   // Show save consent modal after results are displayed (only once)
  //   if (results && !userMadeChoice && !modalShownRef.current && !isProcessingRef.current) {
  //     const timeSinceClose = Date.now() - modalClosedTimeRef.current;
  //     // Only show if modal hasn't been closed recently
  //     if (timeSinceClose > 2000 || modalClosedTimeRef.current === 0) {
  //       // Small delay to let results render first
  //       const timer = setTimeout(() => {
  //         if (!isProcessingRef.current && !userMadeChoice) {
  //           setShowSaveConsentModal(true);
  //           modalShownRef.current = true;
  //         }
  //       }, 1500);
  //       return () => clearTimeout(timer);
  //     }
  //   }
  // }, [results, userMadeChoice]);

  useEffect(() => {
    // Auto-send certificate completion data to alerts dashboard if user chose to save
    const savedChoice = localStorage.getItem('save_data_consent');
    if (results && results.certificate && savedChoice === 'save' && !dataSentToAlerts) {
      sendCertificateDataToAlerts(results);
    }
  }, [results, dataSentToAlerts]);

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

  const handleSaveConsent = async (shouldSave) => {
    console.log('🎯 handleSaveConsent called with shouldSave:', shouldSave);
    console.log('📍 isProcessingRef.current:', isProcessingRef.current);

    // Prevent multiple rapid calls
    if (isProcessingRef.current) {
      console.log('⏸️ Already processing consent - ignoring duplicate call');
      return;
    }

    isProcessingRef.current = true;

    // Close modal IMMEDIATELY - no delays
    setShowSaveConsentModal(false);
    console.log('✅ Modal closed immediately');

    // Save user's choice to localStorage
    localStorage.setItem('save_data_consent', shouldSave ? 'save' : 'erase');
    setUserMadeChoice(true);
    modalClosedTimeRef.current = Date.now();

    if (shouldSave) {
      console.log('✅ User chose to SAVE data for alerts and services');
      console.log('📊 Saving workflow to database...');
      // If user chose to save, prepare data for alerts
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
        timestamp: new Date().toISOString()
      };

      // Save to localStorage for alerts and services
      localStorage.setItem('usmca_workflow_results', JSON.stringify(alertData));
      localStorage.setItem('usmca_workflow_data', JSON.stringify(alertData));
      localStorage.setItem('usmca_company_data', JSON.stringify(alertData.company));

      // **NEW: Save workflow to database with certificate data**
      try {
        // Generate certificate data structure for storage
        const certificateData = {
          certificate_number: `USMCA-${Date.now()}`,
          exporter: {
            name: results.company?.name || results.company?.company_name || 'Company',
            address: results.company?.company_address || '',
            tax_id: results.company?.tax_id || '',
            phone: results.company?.contact_phone || '',
            email: results.company?.contact_email || ''
          },
          product: {
            hs_code: results.product?.hs_code || '',
            description: results.product?.description || results.product?.product_description || '',
            preference_criterion: 'B'
          },
          usmca_analysis: {
            qualified: results.usmca?.qualified,
            regional_content: results.usmca?.north_american_content || results.usmca?.regional_content || 0,
            rule: 'Regional Value Content',
            threshold: results.usmca?.threshold_applied || 60
          },
          authorization: {
            signatory_name: results.company?.contact_person || results.company?.name || 'Authorized Signatory',
            signatory_title: 'Exporter',
            signatory_date: new Date().toISOString()
          },
          blanket_period: {
            start_date: new Date().toISOString().split('T')[0],
            end_date: new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0]
          },
          country_of_origin: results.usmca?.manufacturing_location || 'MX'
        };

        const workflowData = {
          sessionId: `workflow_${Date.now()}`,
          workflowData: {
            id: `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            workflow_type: 'usmca_compliance',
            product_description: results.product?.description || results.workflow_data?.product_description || 'USMCA Analysis',
            hs_code: results.product?.hs_code || '',
            classification_confidence: results.product?.confidence || 0.95,
            usmca: results.usmca,
            company: results.company,
            product: {
              ...results.product,
              description: results.product?.description || results.workflow_data?.product_description
            },
            components: results.component_origins || results.components || [],
            savings: results.savings,
            steps_completed: 4,
            total_steps: 4,
            certificate_generated: true,
            certificate: certificateData,
            completion_time_seconds: 180
          },
          action: 'complete'
        };

        console.log('💾 Saving workflow to database:', workflowData);

        const response = await fetch('/api/workflow-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify(workflowData)
        });

        if (response.ok) {
          const result = await response.json();
          if (result.data?.saved === false) {
            console.log('ℹ️ Workflow not saved to database (developer testing - not signed in)');
          } else {
            console.log('✅ Workflow saved to database successfully');
            // Success message handled by button click handler
          }
        } else {
          console.error('⚠️ Failed to save workflow to database:', await response.text());
        }
      } catch (error) {
        console.error('❌ Error saving workflow to database:', error);
      }

      // Check if user was trying to set up alerts
      const pendingAlertSetup = localStorage.getItem('pending_alert_setup');
      if (pendingAlertSetup === 'true') {
        localStorage.removeItem('pending_alert_setup');
        console.log('🚨 User consented - redirecting to alerts...');
        // Call handleSetUpAlerts again now that consent is granted
        setTimeout(() => handleSetUpAlerts(), 500);
      }

    } else {
      console.log('🔒 User chose NOT to save data - privacy first');
      // Don't save any workflow data
      localStorage.removeItem('usmca_workflow_results');
      localStorage.removeItem('usmca_workflow_data');
      localStorage.removeItem('usmca_company_data');
      localStorage.removeItem('pending_alert_setup');
    }

    // Reset processing flag after a short delay
    setTimeout(() => {
      isProcessingRef.current = false;
    }, 1000);
  };

  const handleSetUpAlerts = () => {
    // Check if user has consented to save data
    const savedChoice = localStorage.getItem('save_data_consent');
    if (savedChoice !== 'save') {
      console.log('⚠️ User has not consented to save data - showing consent modal');
      // Prevent re-opening if modal was just closed (within 1 second)
      const timeSinceClose = Date.now() - modalClosedTimeRef.current;
      if (timeSinceClose > 1000) {
        setShowSaveConsentModal(true);
        // Store pending action so we can redirect after consent
        localStorage.setItem('pending_alert_setup', 'true');
      }
      return;
    }

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

  const modalContent = showSaveConsentModal && (
    <div style={{
      position: 'fixed',
      top: '100px',
      left: 'calc(50% - 250px)',
      width: '500px',
      backgroundColor: 'white',
      padding: '40px',
      borderRadius: '8px',
      boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      zIndex: 999999
    }}>
      <h2 style={{ marginBottom: '10px', fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>
        Save to Dashboard?
      </h2>
      <p style={{ marginBottom: '30px', fontSize: '14px', color: '#6b7280' }}>
        Choose how you'd like to use this analysis
      </p>

      <div style={{ marginBottom: '30px' }}>
        {/* SAVE Option */}
        <div
          onClick={() => setModalChoice('save')}
          style={{
            padding: '20px',
            border: modalChoice === 'save' ? '3px solid #2563eb' : '1px solid #d1d5db',
            marginBottom: '15px',
            cursor: 'pointer',
            backgroundColor: modalChoice === 'save' ? '#eff6ff' : 'white',
            borderRadius: '8px'
          }}
        >
          <div style={{ marginBottom: '10px', fontWeight: 'bold', fontSize: '16px', color: '#1f2937' }}>
            <input
              type="radio"
              checked={modalChoice === 'save'}
              onChange={() => setModalChoice('save')}
              style={{ marginRight: '10px' }}
            />
            SAVE - Enable alerts and services
          </div>
          <div style={{ marginLeft: '30px', fontSize: '14px', color: '#4b5563' }}>
            • Get real-time trade alerts for your product<br/>
            • Access professional services later<br/>
            • View analysis history in your dashboard<br/>
            • Store this analysis for future reference
          </div>
        </div>

        {/* DON'T SAVE Option */}
        <div
          onClick={() => setModalChoice('dont-save')}
          style={{
            padding: '20px',
            border: modalChoice === 'dont-save' ? '3px solid #2563eb' : '1px solid #d1d5db',
            cursor: 'pointer',
            backgroundColor: modalChoice === 'dont-save' ? '#eff6ff' : 'white',
            borderRadius: '8px'
          }}
        >
          <div style={{ marginBottom: '10px', fontWeight: 'bold', fontSize: '16px', color: '#1f2937' }}>
            <input
              type="radio"
              checked={modalChoice === 'dont-save'}
              onChange={() => setModalChoice('dont-save')}
              style={{ marginRight: '10px' }}
            />
            DON'T SAVE - View only
          </div>
          <div style={{ marginLeft: '30px', fontSize: '14px', color: '#4b5563' }}>
            • No alerts or notifications<br/>
            • No professional services access<br/>
            • No data storage<br/>
            • This analysis will not be saved
          </div>
        </div>
      </div>

      <button
        onClick={() => {
          handleSaveConsent(modalChoice === 'save');
        }}
        style={{
          width: '100%',
          padding: '15px',
          backgroundColor: '#2563eb',
          color: 'white',
          border: 'none',
          fontSize: '18px',
          fontWeight: 'bold',
          cursor: 'pointer',
          borderRadius: '8px'
        }}
      >
        CONFIRM {modalChoice === 'save' ? 'SAVE' : "DON'T SAVE"}
      </button>

      <p style={{
        marginTop: '20px',
        fontSize: '12px',
        textAlign: 'center',
        color: '#9ca3af',
        lineHeight: '1.5'
      }}>
        <strong>Privacy Notice:</strong> You can delete all saved data anytime from Account Settings.
        We never share your data with third parties.
      </p>
    </div>
  );

  return (
    <div className="dashboard-container workflow-results-container">
      {/* PORTAL MODAL - RENDERED OUTSIDE THIS COMPONENT */}
      {typeof window !== 'undefined' && modalContent && ReactDOM.createPortal(
        modalContent,
        document.body
      )}

      {/* QUALIFICATION RESULT */}
      <div className={results.usmca?.qualified ? 'alert alert-success' : 'alert alert-warning'} style={{ marginBottom: '2rem' }}>
        <div className="alert-content">
          <h2 style={{ color: '#134e4a', marginBottom: '0.5rem', fontSize: '1.75rem', fontWeight: 'bold' }}>
            {results.usmca?.qualified ? '✓ USMCA Qualified' : '✗ Not Qualified'}
          </h2>
          <p style={{ color: '#064e3b', marginBottom: '1.5rem' }}>
            {results.usmca?.qualified
              ? 'Your product meets all requirements for preferential tariff treatment'
              : 'Your product does not meet USMCA regional content requirements'}
          </p>

          {/* Key Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#064e3b', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Required</div>
              <div style={{ color: '#134e4a', fontSize: '1.5rem', fontWeight: 'bold' }}>
                {results.usmca?.threshold_applied || 60}%
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#064e3b', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Your Content</div>
              <div style={{ color: '#134e4a', fontSize: '1.5rem', fontWeight: 'bold' }}>
                {(results.usmca?.north_american_content || 0).toFixed(0)}%
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#064e3b', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                {results.usmca?.qualified ? 'Margin' : 'Gap'}
              </div>
              <div style={{ color: '#134e4a', fontSize: '1.5rem', fontWeight: 'bold' }}>
                {results.usmca?.qualified
                  ? `+${(results.usmca.north_american_content - results.usmca.threshold_applied).toFixed(0)}%`
                  : `${(results.usmca.north_american_content - results.usmca.threshold_applied).toFixed(0)}%`}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PRODUCT INFORMATION */}
      <div className="form-section">
        <h2 className="form-section-title">Product Classification</h2>
        <ProductClassification results={results} />
      </div>

      {/* COMPLIANCE ANALYSIS */}
      <div className="form-section">
        <h2 className="form-section-title">Component & Regional Content Analysis</h2>
        <USMCAQualification results={results} />
      </div>

      {/* FINANCIAL IMPACT */}
      {results.savings && results.savings.annual_savings > 0 && (
        <div className="form-section">
          <h2 className="form-section-title">Financial Impact</h2>
          <TariffSavings results={results} />
        </div>
      )}

      {/* RECOMMENDATIONS */}
      {results.recommendations && results.recommendations.length > 0 && (
        <div className="form-section">
          <h2 className="form-section-title">Strategic Recommendations</h2>
          <div>
            {results.recommendations.map((rec, idx) => (
              <div key={idx} className="text-body" style={{
                marginBottom: '0.75rem',
                paddingLeft: '1.5rem',
                position: 'relative'
              }}>
                <span style={{ position: 'absolute', left: 0 }}>•</span>
                {rec}
              </div>
            ))}

            {/* Professional Services CTA */}
            <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#f0fdf4', borderRadius: '4px', textAlign: 'center' }}>
              <div style={{ fontWeight: '600', color: '#166534', marginBottom: '0.5rem' }}>Need Expert Help?</div>
              <div style={{ fontSize: '0.875rem', color: '#166534', marginBottom: '1rem' }}>
                Licensed customs brokers in Mexico • Audit-proof certification • Supplier sourcing
              </div>
              <button
                onClick={() => router.push('/services/logistics-support')}
                className="btn-primary"
              >
                View Professional Services
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEXT STEPS */}
      <div className="form-section">
        <h2 className="form-section-title">Next Steps</h2>
        <p className="text-body">
          Save your analysis to access it later, set up alerts, and request professional services
        </p>
        <div>
          {/* Privacy & Save Information Card - Always show with checkbox */}
          <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <input
                type="checkbox"
                id="saveConsent"
                checked={userMadeChoice}
                readOnly
                style={{ marginTop: '0.25rem', width: '18px', height: '18px', cursor: 'default', pointerEvents: 'none' }}
              />
              <label htmlFor="saveConsent" style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', color: '#1e40af', marginBottom: '0.5rem' }}>💾 Save to Dashboard</div>
                <div style={{ fontSize: '0.875rem', color: '#1e40af', marginBottom: '0.5rem' }}>
                  Save this analysis to:
                  <ul style={{ marginTop: '0.5rem', marginLeft: '1.5rem', marginBottom: '0.5rem' }}>
                    <li>Access your results anytime from your dashboard</li>
                    <li>Set up automated trade risk alerts</li>
                    <li>Request professional services later</li>
                  </ul>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#3730a3', fontStyle: 'italic' }}>
                  Privacy: You can delete all saved data anytime from Account Settings
                </div>
              </label>
            </div>
          </div>

          <div className="hero-buttons">
            {/* Button 1: Save to Dashboard (ALWAYS AVAILABLE) */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setModalChoice('save'); // Reset to default
                setShowSaveConsentModal(true);
              }}
              className="btn-primary"
              style={{ minWidth: '200px' }}
            >
              {userMadeChoice ? '✅ Saved to Dashboard (Change)' : '☐ Save to Dashboard'}
            </button>

            {/* Button 2: Generate Certificate (if qualified) */}
            {results.usmca?.qualified && (
              <button
                onClick={() => {
                  localStorage.setItem('usmca_workflow_results', JSON.stringify(results));
                  router.push('/usmca-certificate-completion');
                }}
                className={userMadeChoice ? 'btn-primary' : 'btn-secondary'}
              >
                📄 Generate Certificate
              </button>
            )}

            {/* Button 3: Request Professional Service */}
            <button
              onClick={() => router.push('/services/logistics-support')}
              className="btn-secondary"
            >
              🎯 Request Professional Service
            </button>

            {/* Button 4: Print Analysis */}
            <button
              onClick={() => window.print()}
              className="btn-secondary"
            >
              🖨️ Print Analysis
            </button>

            {/* Button 5: New Analysis */}
            <button
              onClick={() => {
                if (confirm('Start a new analysis? Your current results will remain saved in your dashboard.')) {
                  // Clear localStorage for fresh start
                  localStorage.removeItem('workflow_current_step');
                  localStorage.removeItem('usmca_workflow_results');
                  // Trigger reset and go to step 1
                  onReset && onReset();
                  router.push('/usmca-workflow?reset=true');
                }
              }}
              className="btn-secondary"
            >
              🔄 New Analysis
            </button>
          </div>
        </div>
      </div>

      {/* Simple disclaimer footer */}
      <div className="text-body" style={{ textAlign: 'center', color: '#6b7280', fontSize: '0.875rem', marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid #e5e7eb' }}>
        AI-powered analysis • For production use, verify with customs authorities
      </div>
    </div>
  );
}