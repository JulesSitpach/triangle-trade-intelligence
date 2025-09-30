/**
 * Partnership Intelligence Tab - Canada-Mexico Service Delivery
 * Uses universal ServiceWorkflowTab for 4-stage service delivery
 * Converts analytics into actionable monthly intelligence service
 */

import { getServiceConfig } from '../../config/service-configurations';
import ServiceWorkflowTab from '../shared/ServiceWorkflowTab';

export default function CanadaMexicoIntelligenceTab() {
  // Get the Partnership Intelligence service configuration
  const serviceConfig = getServiceConfig('partnership-intelligence');

  const handleServiceUpdate = () => {
    // Refresh dashboard metrics when service is updated
    console.log('Partnership Intelligence service updated');
    // Could trigger dashboard refresh or other updates
  };

  return (
    <ServiceWorkflowTab
      serviceConfig={serviceConfig}
      teamMember="jorge"
      onServiceUpdate={handleServiceUpdate}
    />
  );
}