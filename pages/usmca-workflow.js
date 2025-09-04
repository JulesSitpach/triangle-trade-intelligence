/**
 * USMCA Workflow - Refactored microservices architecture
 * Transforms 894-line monolithic component into clean orchestration
 * Uses trust-verified microservices and focused components
 */

import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import USMCAWorkflowOrchestrator from '../components/workflow/USMCAWorkflowOrchestrator';

export default function USMCAWorkflow() {
  return (
    <>
      <Head>
        <title>USMCA Compliance Analysis | Professional Trade Classification</title>
        <meta name="description" content="Professional USMCA compliance analysis with AI-powered classification, qualification assessment, and certificate generation." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* Fixed Navigation */}
      <nav className="nav-fixed">
        <div className="nav-container">
          <Link href="/" className="nav-logo-link">
            <div className="nav-logo-icon">T</div>
            <div>
              <div className="nav-logo-text">TradeFlow Intelligence</div>
              <div className="nav-logo-subtitle">USMCA Compliance Platform</div>
            </div>
          </Link>
          <div className="nav-menu">
            <Link href="/solutions" className="nav-menu-link">Solutions</Link>
            <Link href="/industries" className="nav-menu-link">Industries</Link>
            <Link href="/intelligence" className="nav-menu-link">Intelligence</Link>
            <Link href="/services" className="nav-menu-link">Services</Link>
            <Link href="/pricing" className="nav-menu-link">Pricing</Link>
            <Link href="/usmca-workflow" className="nav-cta-button">Start Analysis</Link>
          </div>
        </div>
      </nav>

      <USMCAWorkflowOrchestrator />
    </>
  );
}
