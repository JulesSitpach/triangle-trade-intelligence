/**
 * WORKFLOW STATUS ENUMS
 * Centralized status strings for flexible workflow management
 *
 * Benefits:
 * - Single source of truth
 * - Prevents typos
 * - Easy to add new statuses
 * - TypeScript-friendly
 *
 * Updated: October 15, 2025
 */

/**
 * Service Request Statuses
 * Used across admin dashboards and service processing
 */
export const SERVICE_REQUEST_STATUSES = {
  // Payment Flow
  PENDING_PAYMENT: 'pending_payment',

  // Active Processing
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  RESEARCH_IN_PROGRESS: 'research_in_progress',
  PROPOSAL_SENT: 'proposal_sent',

  // Completion States
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',

  // Consultation States
  CONSULTATION_PENDING: 'pending_schedule',
  CONSULTATION_SCHEDULED: 'scheduled',
  CONSULTATION_COMPLETED: 'consultation_completed'
};

/**
 * Workflow Completion Statuses
 * Used for USMCA analysis workflows
 */
export const WORKFLOW_STATUSES = {
  DRAFT: 'draft',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  ARCHIVED: 'archived'
};

/**
 * Supplier Verification Statuses
 * Used in supplier discovery workflows
 */
export const SUPPLIER_STATUSES = {
  PENDING: 'pending',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
  IN_REVIEW: 'in_review'
};

/**
 * Helper function to get human-readable status label
 */
export function getStatusLabel(status, context = 'service_request') {
  const labels = {
    service_request: {
      'pending_payment': 'Awaiting Payment',
      'pending': 'Pending Review',
      'in_progress': 'In Progress',
      'research_in_progress': 'Research In Progress',
      'proposal_sent': 'Proposal Sent',
      'completed': 'Completed',
      'cancelled': 'Cancelled',
      'pending_schedule': 'Consultation Pending',
      'scheduled': 'Consultation Scheduled',
      'consultation_completed': 'Consultation Completed'
    },
    workflow: {
      'draft': 'Draft',
      'in_progress': 'In Progress',
      'completed': 'Completed',
      'archived': 'Archived'
    },
    supplier: {
      'pending': 'Pending Verification',
      'verified': 'Verified',
      'rejected': 'Rejected',
      'in_review': 'Under Review'
    }
  };

  return labels[context]?.[status] || status;
}

/**
 * Helper function to get status color class
 */
export function getStatusColor(status) {
  const colors = {
    // Green - Success states
    'completed': 'text-green',
    'verified': 'text-green',
    'consultation_completed': 'text-green',

    // Blue - In progress states
    'in_progress': 'text-blue',
    'research_in_progress': 'text-blue',
    'scheduled': 'text-blue',
    'in_review': 'text-blue',

    // Yellow - Pending states
    'pending': 'text-amber',
    'pending_payment': 'text-amber',
    'pending_schedule': 'text-amber',
    'proposal_sent': 'text-amber',

    // Red - Cancelled/Rejected states
    'cancelled': 'text-red',
    'rejected': 'text-red',

    // Gray - Draft/Archived
    'draft': 'text-gray',
    'archived': 'text-gray'
  };

  return colors[status] || 'text-body';
}

export default {
  SERVICE_REQUEST_STATUSES,
  WORKFLOW_STATUSES,
  SUPPLIER_STATUSES,
  getStatusLabel,
  getStatusColor
};
