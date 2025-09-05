/**
 * USMCA Workflow - Refactored microservices architecture
 * Transforms 894-line monolithic component into clean orchestration
 * Uses trust-verified microservices and focused components
 */

import React from 'react';
import TriangleLayout from '../components/TriangleLayout';
import USMCAWorkflowOrchestrator from '../components/workflow/USMCAWorkflowOrchestrator';

export default function USMCAWorkflow() {
  return (
    <TriangleLayout>
      <USMCAWorkflowOrchestrator />
    </TriangleLayout>
  );
}
