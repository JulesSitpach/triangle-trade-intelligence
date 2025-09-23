/**
 * Service Type Mapping Utility
 * Handles mismatches between expected service types and actual database values
 * Ensures frontend components can find and display actual data
 */

// Service Type Mapping Configuration
export const SERVICE_TYPE_MAPPINGS = {
  // Jorge's Mexico Services
  'supplier-sourcing': [
    'mexico-supplier-sourcing',
    'supplier-vetting',
    'supplier-sourcing',
    'supplier-introduction',
    'mexico-supplier-vetting'
  ],

  'manufacturing-feasibility': [
    'mexico-manufacturing-feasibility',
    'manufacturing-feasibility',
    'market-entry',
    'mexico-market-entry',
    'feasibility-study'
  ],

  'market-entry': [
    'mexico-market-entry',
    'market-entry',
    'partnership-intelligence',
    'business-development',
    'mexico-consulting'
  ],

  'partnership-intelligence': [
    'partnership-intelligence',
    'intelligence-services',
    'market-intelligence',
    'canada-mexico-partnerships',
    'business-intelligence'
  ],

  // Cristina's Compliance Services
  'usmca-certificate': [
    'usmca-certificate',
    'certificate-generation',
    'usmca-compliance',
    'compliance-certificate',
    'trade-certificate'
  ],

  'hs-classification': [
    'hs-classification',
    'hs-code-classification',
    'product-classification',
    'tariff-classification',
    'customs-classification'
  ],

  'document-review': [
    'document-review',
    'compliance-review',
    'documentation-validation',
    'customs-documentation',
    'trade-documentation'
  ],

  'monthly-support': [
    'monthly-support',
    'monthly-compliance-support',
    'ongoing-support',
    'consultation-support',
    'compliance-consulting'
  ],

  'crisis-response': [
    'crisis-response',
    'compliance-crisis-response',
    'emergency-response',
    'urgent-compliance',
    'crisis-management'
  ]
};

// Reverse mapping for looking up service category from specific type
export const REVERSE_SERVICE_MAPPING = {};
Object.keys(SERVICE_TYPE_MAPPINGS).forEach(category => {
  SERVICE_TYPE_MAPPINGS[category].forEach(serviceType => {
    REVERSE_SERVICE_MAPPING[serviceType] = category;
  });
});

/**
 * Filter service requests by service category
 * @param {Array} requests - Array of service request objects
 * @param {string} serviceCategory - Service category to filter by
 * @returns {Array} Filtered service requests
 */
export const filterServiceRequests = (requests, serviceCategory) => {
  if (!requests || !Array.isArray(requests)) {
    return [];
  }

  const allowedTypes = SERVICE_TYPE_MAPPINGS[serviceCategory] || [];

  return requests.filter(request =>
    allowedTypes.includes(request.service_type)
  );
};

/**
 * Get service category from specific service type
 * @param {string} serviceType - Specific service type
 * @returns {string} Service category
 */
export const getServiceCategory = (serviceType) => {
  return REVERSE_SERVICE_MAPPING[serviceType] || 'unknown';
};

/**
 * Normalize service request data for consistent display
 * @param {Object} request - Raw service request object
 * @returns {Object} Normalized service request
 */
export const normalizeServiceRequest = (request) => {
  if (!request) return null;

  return {
    id: request.id,
    clientName: request.company_name || request.client_name || 'Unknown Client',
    contactName: request.contact_name || '',
    email: request.email || '',
    phone: request.phone || '',
    industry: request.industry || '',
    serviceType: request.service_type,
    serviceCategory: getServiceCategory(request.service_type),
    status: request.status || 'pending',
    priority: request.priority || 'medium',
    timeline: request.timeline || 'standard',
    budgetRange: request.budget_range || '',
    tradeVolume: request.trade_volume || 0,
    assignedTo: request.assigned_to || '',
    createdAt: request.created_at,
    updatedAt: request.updated_at,

    // Service-specific details
    serviceDetails: {
      goals: request.service_details?.goals || '',
      challenges: request.service_details?.current_challenges || '',
      productDescription: request.service_details?.product_description || '',
      targetRegions: request.service_details?.target_regions || '',
      investmentBudget: request.service_details?.investment_budget || '',
      ...request.service_details
    },

    // Consultation info
    consultationStatus: request.consultation_status || 'pending_schedule',
    consultationDuration: request.consultation_duration || '15 minutes',
    consultationDate: request.consultation_date,
    consultationNotes: request.consultation_notes || '',
    nextSteps: request.next_steps || '',

    // Progress tracking
    currentStage: request.current_stage || 1,
    totalStages: 4,
    progress: `Stage ${request.current_stage || 1}/4`,

    // Display helpers
    displayTitle: request.service_details?.goals || request.service_details?.product_description || 'Service Request',
    displayStatus: formatStatus(request.status),
    displayPriority: formatPriority(request.priority),
    displayTimeline: formatTimeline(request.timeline),
    displayBudget: formatBudget(request.budget_range),
    displayTradeVolume: formatTradeVolume(request.trade_volume)
  };
};

/**
 * Normalize multiple service requests
 * @param {Array} requests - Array of raw service request objects
 * @returns {Array} Array of normalized service requests
 */
export const normalizeServiceRequests = (requests) => {
  if (!requests || !Array.isArray(requests)) {
    return [];
  }

  return requests.map(normalizeServiceRequest).filter(Boolean);
};

/**
 * Get service requests for specific team member and service category
 * @param {Array} requests - Array of service request objects
 * @param {string} teamMember - Team member name (jorge, cristina)
 * @param {string} serviceCategory - Service category to filter by
 * @returns {Array} Filtered and normalized service requests
 */
export const getServiceRequestsForMember = (requests, teamMember, serviceCategory) => {
  if (!requests || !Array.isArray(requests)) {
    return [];
  }

  // Filter by team member assignment
  const memberRequests = requests.filter(request =>
    request.assigned_to &&
    request.assigned_to.toLowerCase().includes(teamMember.toLowerCase())
  );

  // Filter by service category
  const categoryRequests = filterServiceRequests(memberRequests, serviceCategory);

  // Normalize and return
  return normalizeServiceRequests(categoryRequests);
};

// Display formatting helpers
function formatStatus(status) {
  if (!status) return 'Pending';

  const statusMap = {
    'consultation_scheduled': 'Consultation Scheduled',
    'in_progress': 'In Progress',
    'research_in_progress': 'Research In Progress',
    'proposal_sent': 'Proposal Sent',
    'completed': 'Completed',
    'on_hold': 'On Hold',
    'cancelled': 'Cancelled'
  };

  return statusMap[status] || status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function formatPriority(priority) {
  if (!priority) return 'Medium';

  const priorityMap = {
    'urgent': 'Urgent',
    'high': 'High',
    'medium': 'Medium',
    'low': 'Low'
  };

  return priorityMap[priority] || priority.charAt(0).toUpperCase() + priority.slice(1);
}

function formatTimeline(timeline) {
  if (!timeline) return 'Standard';

  const timelineMap = {
    'immediate': 'Immediate (24-48 hours)',
    'short': 'Short Term (1-2 weeks)',
    'medium': 'Medium Term (2-4 weeks)',
    'long': 'Long Term (1-3 months)',
    'extended': 'Extended (3+ months)'
  };

  return timelineMap[timeline] || timeline.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function formatBudget(budgetRange) {
  if (!budgetRange) return 'TBD';

  const budgetMap = {
    'under-25k': 'Under $25k',
    '25k-100k': '$25k - $100k',
    '100k-500k': '$100k - $500k',
    '500k-plus': '$500k+',
    'custom': 'Custom Pricing'
  };

  return budgetMap[budgetRange] || budgetRange;
}

function formatTradeVolume(tradeVolume) {
  if (!tradeVolume || tradeVolume === 0) return 'Not specified';

  const volume = parseInt(tradeVolume);

  if (volume >= 1000000) {
    return `$${(volume / 1000000).toFixed(1)}M`;
  } else if (volume >= 1000) {
    return `$${(volume / 1000).toFixed(0)}k`;
  } else {
    return `$${volume.toLocaleString()}`;
  }
}

/**
 * Get team member configuration
 * @param {string} teamMember - Team member name
 * @returns {Object} Team member configuration
 */
export const getTeamMemberConfig = (teamMember) => {
  const configs = {
    jorge: {
      name: 'Jorge Martinez',
      title: 'Mexico Trade Specialist',
      services: ['supplier-sourcing', 'manufacturing-feasibility', 'market-entry', 'partnership-intelligence'],
      specialties: ['Mexico Market Entry', 'Supplier Sourcing', 'Manufacturing Feasibility', 'Partnership Intelligence'],
      location: 'Mexico',
      languages: ['Spanish', 'English'],
      avatar: '🇲🇽'
    },
    cristina: {
      name: 'Cristina Rodriguez',
      title: 'Trade Compliance Specialist',
      services: ['usmca-certificate', 'hs-classification', 'document-review', 'monthly-support', 'crisis-response'],
      specialties: ['USMCA Compliance', 'HS Classification', 'Document Review', 'Crisis Response', 'Trade Compliance'],
      location: 'United States',
      languages: ['English', 'Spanish'],
      avatar: '🇺🇸'
    }
  };

  return configs[teamMember.toLowerCase()] || configs.jorge;
};

export default {
  SERVICE_TYPE_MAPPINGS,
  REVERSE_SERVICE_MAPPING,
  filterServiceRequests,
  getServiceCategory,
  normalizeServiceRequest,
  normalizeServiceRequests,
  getServiceRequestsForMember,
  getTeamMemberConfig
};