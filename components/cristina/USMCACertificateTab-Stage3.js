// Stage 3: Final Professional Delivery - Complete Service Delivery with Liability Coverage
function FinalProfessionalDeliveryStage({ request, subscriberData, serviceDetails, stageData, onComplete, loading }) {
  const [deliveryPackage, setDeliveryPackage] = useState({
    // Final Certificate Package
    final_certificate_delivered: false,
    certificate_validity_confirmed: false,

    // Professional Documentation
    professional_liability_statement: '',
    ongoing_support_notes: '',
    compliance_monitoring_setup: false,

    // Service Completion
    client_satisfaction_confirmed: false,
    followup_schedule_set: false,
    service_completion_date: '',

    // Professional Backing
    cristina_professional_signature: false,
    license_backing_applied: false
  });

  const workflowData = request?.workflow_data || request?.service_details || {};
  const stage1Data = stageData?.stage1 || {};
  const stage2Data = stageData?.stage2 || {};

  const handleDeliveryChange = (field, value) => {
    setDeliveryPackage(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    const finalStageData = {
      delivery_package: deliveryPackage,
      professional_completion: {
        cristina_license_number: '4601913',
        service_completion_timestamp: new Date().toISOString(),
        professional_liability_coverage: 'Active',
        client_deliverables: 'Complete certificate package with ongoing support'
      }
    };

    onComplete(finalStageData);
  };

  const isDeliveryComplete =
    deliveryPackage.final_certificate_delivered &&
    deliveryPackage.certificate_validity_confirmed &&
    deliveryPackage.client_satisfaction_confirmed &&
    deliveryPackage.cristina_professional_signature &&
    deliveryPackage.license_backing_applied;

  return (
    <div className="workflow-stage">
      <div className="workflow-stage-header">
        <h3>Stage 3: Final Professional Delivery</h3>
        <p><strong>Complete Service:</strong> Professional certificate delivery with Cristina's liability backing</p>
        <div className="expert-credentials">
          📋 Final Certificate | 🛡️ Professional Liability | 📞 Ongoing Support
        </div>
      </div>

      <div className="delivery-summary">
        <h4>📊 Service Completion Summary</h4>
        <div className="completion-highlights">
          <div className="completion-item">
            <strong>Stage 1 Result:</strong> {stage1Data?.compliance_confidence_level?.replace('_', ' ') || 'Professional review completed'}
          </div>
          <div className="completion-item">
            <strong>Stage 2 Corrections:</strong> {stage2Data?.regeneration_status === 'completed' ? 'Certificate regenerated and validated' : 'Standard certificate approved'}
          </div>
          <div className="completion-item">
            <strong>Product:</strong> {workflowData.product_description || serviceDetails.product_description || 'Product reviewed'}
          </div>
          <div className="completion-item">
            <strong>USMCA Status:</strong> {workflowData.qualification_status || serviceDetails.qualification_status || 'Professionally assessed'}
          </div>
        </div>
      </div>

      <div className="final-delivery-section">
        <h4>📋 Certificate Delivery Package</h4>

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={deliveryPackage.final_certificate_delivered}
              onChange={(e) => handleDeliveryChange('final_certificate_delivered', e.target.checked)}
            />
            <strong>Final Certificate Delivered to Client</strong>
          </label>
          <div className="delivery-note">
            Professional USMCA certificate with Cristina's customs broker validation
          </div>
        </div>

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={deliveryPackage.certificate_validity_confirmed}
              onChange={(e) => handleDeliveryChange('certificate_validity_confirmed', e.target.checked)}
            />
            <strong>Certificate Validity Confirmed</strong>
          </label>
          <div className="delivery-note">
            Verified compliance with current USMCA regulations and CBP requirements
          </div>
        </div>

        <div className="form-group">
          <label><strong>Professional Liability Statement</strong></label>
          <textarea
            value={deliveryPackage.professional_liability_statement}
            onChange={(e) => handleDeliveryChange('professional_liability_statement', e.target.value)}
            placeholder="Professional backing statement and liability coverage details..."
            className="form-input"
            rows="3"
          />
          <div className="professional-note">
            Include license coverage and professional responsibility for this certificate
          </div>
        </div>

        <div className="form-group">
          <label><strong>Ongoing Support Notes</strong></label>
          <textarea
            value={deliveryPackage.ongoing_support_notes}
            onChange={(e) => handleDeliveryChange('ongoing_support_notes', e.target.value)}
            placeholder="Follow-up support, monitoring schedule, and additional services available..."
            className="form-input"
            rows="2"
          />
        </div>
      </div>

      <div className="professional-backing-section">
        <h4>🛡️ Professional Liability & Backing</h4>

        <div className="professional-credentials-display">
          <div className="credential-item">
            <strong>Licensed Customs Broker:</strong> License #4601913 (Active)
          </div>
          <div className="credential-item">
            <strong>Professional Experience:</strong> 17 years in customs compliance
          </div>
          <div className="credential-item">
            <strong>Liability Coverage:</strong> Professional errors and omissions covered
          </div>
          <div className="credential-item">
            <strong>Service Guarantee:</strong> Certificate validity backed by professional license
          </div>
        </div>

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={deliveryPackage.compliance_monitoring_setup}
              onChange={(e) => handleDeliveryChange('compliance_monitoring_setup', e.target.checked)}
            />
            <strong>Compliance Monitoring Setup Complete</strong>
          </label>
          <div className="delivery-note">
            Client added to regulatory update notifications and compliance monitoring
          </div>
        </div>

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={deliveryPackage.followup_schedule_set}
              onChange={(e) => handleDeliveryChange('followup_schedule_set', e.target.checked)}
            />
            <strong>Follow-up Schedule Established</strong>
          </label>
          <div className="delivery-note">
            Regular check-ins scheduled for ongoing compliance support
          </div>
        </div>
      </div>

      <div className="client-satisfaction-section">
        <h4>✅ Service Completion Validation</h4>

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={deliveryPackage.client_satisfaction_confirmed}
              onChange={(e) => handleDeliveryChange('client_satisfaction_confirmed', e.target.checked)}
            />
            <strong>Client Satisfaction Confirmed</strong>
          </label>
          <div className="delivery-note">
            Client has reviewed and approved the final certificate and professional backing
          </div>
        </div>

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={deliveryPackage.cristina_professional_signature}
              onChange={(e) => handleDeliveryChange('cristina_professional_signature', e.target.checked)}
            />
            <strong>Professional Signature Applied</strong>
          </label>
          <div className="delivery-note">
            Cristina's professional endorsement and signature on final deliverables
          </div>
        </div>

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={deliveryPackage.license_backing_applied}
              onChange={(e) => handleDeliveryChange('license_backing_applied', e.target.checked)}
            />
            <strong>License Backing Applied to Certificate</strong>
          </label>
          <div className="delivery-note">
            Certificate is now professionally backed by customs broker license #4601913
          </div>
        </div>

        <div className="form-group">
          <label><strong>Service Completion Date</strong></label>
          <input
            type="date"
            value={deliveryPackage.service_completion_date}
            onChange={(e) => handleDeliveryChange('service_completion_date', e.target.value)}
            className="form-input"
          />
        </div>
      </div>

      <div className="service-value-summary">
        <div className="value-point">
          <strong>$250 Service Value Delivered:</strong> Professional USMCA certificate with customs broker backing,
          liability coverage, ongoing support, and regulatory monitoring - transforming AI-generated
          certificate into professionally guaranteed compliance documentation.
        </div>
      </div>

      <div className="workflow-stage-actions">
        <button
          className="btn-primary"
          onClick={handleSubmit}
          disabled={!isDeliveryComplete || loading}
        >
          {loading ? 'Completing Professional Service...' : 'Complete Professional Certificate Service'}
        </button>

        <div className="completion-status">
          {isDeliveryComplete ? (
            <span className="status-complete">✅ Professional service delivery completed</span>
          ) : (
            <span className="status-incomplete">⏳ Complete all delivery requirements and professional backing</span>
          )}
        </div>
      </div>
    </div>
  );
}