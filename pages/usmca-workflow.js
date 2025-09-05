/**
 * USMCA Workflow - Refactored microservices architecture
 * Transforms 894-line monolithic component into clean orchestration
 * Uses trust-verified microservices and focused components
 */

import React from 'react';
import Head from 'next/head';
import TriangleLayout from '../components/TriangleLayout';
import USMCAWorkflowOrchestrator from '../components/workflow/USMCAWorkflowOrchestrator';

export default function USMCAWorkflow() {
  return (
    <>
      <Head>
        <title>USMCA Compliance Analysis | Professional Trade Classification</title>
        <meta name="description" content="Professional USMCA compliance analysis with AI-powered classification, qualification assessment, and certificate generation." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <TriangleLayout>
        <USMCAWorkflowOrchestrator />
      </TriangleLayout>
    </>
  );
}
