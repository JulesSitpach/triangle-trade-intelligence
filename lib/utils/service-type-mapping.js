/**
 * Service Type Mapping Utility
 * Handles inconsistent service_type values in database
 */

export const SERVICE_TYPE_MAPPINGS = {
  'trade-health-check': [
    'trade-health-check',
    'trade_health_check',
    'Trade Health Check'
  ],
  'usmca-advantage': [
    'usmca-advantage',
    'usmca_advantage_sprint',
    'usmca-advantage-sprint',
    'USMCA Advantage Sprint',
    'USMCA Advantage'
  ],
  'supply-chain-optimization': [
    'supply-chain-optimization',
    'supply_chain_optimization',
    'Supply Chain Optimization'
  ],
  'pathfinder': [
    'pathfinder',
    'pathfinder_market_entry',
    'pathfinder-market-entry',
    'Pathfinder Market Entry',
    'Market Entry'
  ],
  'supply-chain-resilience': [
    'supply-chain-resilience',
    'supply_chain_resilience',
    'Supply Chain Resilience'
  ],
  'crisis-navigator': [
    'crisis-navigator',
    'crisis_navigator',
    'Crisis Navigator',
    'Crisis Response'
  ]
};

/**
 * Check if a service request matches a service type
 */
export function matchesServiceType(request, serviceKey) {
  const variations = SERVICE_TYPE_MAPPINGS[serviceKey];
  if (!variations) return false;

  return variations.some(variation =>
    request.service_type === variation ||
    request.service_type?.toLowerCase() === variation.toLowerCase()
  );
}

/**
 * Filter requests by service type
 */
export function filterByServiceType(requests, serviceKey) {
  return requests.filter(req => matchesServiceType(req, serviceKey));
}

/**
 * Get canonical service type for storage
 */
export function getCanonicalServiceType(serviceKey) {
  return serviceKey; // Return kebab-case version
}
