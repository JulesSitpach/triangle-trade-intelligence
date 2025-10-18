/**
 * USMCA Workflow - Refactored microservices architecture
 * Transforms 894-line monolithic component into clean orchestration
 * Uses trust-verified microservices and focused components
 * PROTECTED: Requires authentication
 */

import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSimpleAuth } from '../lib/contexts/SimpleAuthContext';
import Head from 'next/head';
import Link from 'next/link';
import TriangleLayout from '../components/TriangleLayout';
import USMCAWorkflowOrchestrator from '../components/workflow/USMCAWorkflowOrchestrator';

export default function USMCAWorkflow() {
  const router = useRouter();

  // Use shared auth context instead of redundant API call
  const { user, loading } = useSimpleAuth();

  // Redirect if not authenticated (only runs after auth check completes)
  useEffect(() => {
    if (!loading && !user) {
      console.log('❌ No valid session, redirecting to login');
      router.push('/login?redirect=/usmca-workflow');
    }
  }, [loading, user, router]);

  // Show loading while checking authentication
  if (loading) {
    return (
      <>
        <Head>
          <title>USMCA Compliance Analysis | Professional Trade Classification</title>
          <meta name="description" content="Professional USMCA compliance analysis with AI-powered classification, qualification assessment, and certificate generation." />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </Head>

        <TriangleLayout>
          <div className="main-content">
            <div className="container-app">
              <div className="hero-badge">
                Checking access...
              </div>
            </div>
          </div>
        </TriangleLayout>
      </>
    );
  }

  // If no user found, show subscription required message
  if (!user) {
    return (
      <>
        <Head>
          <title>USMCA Compliance Analysis | Subscription Required</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </Head>

        <TriangleLayout>
          <div className="main-content">
            <div className="container-app">
              <div className="content-card">
                <h2 className="card-title">Subscription Required</h2>
                <p className="text-body">
                  USMCA Compliance Analysis is available to subscribers only.
                </p>
                <div className="hero-button-group">
                  <Link href="/pricing" className="btn-primary">
                    View Pricing
                  </Link>
                  <Link href="/login" className="btn-secondary">
                    Sign In
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </TriangleLayout>
      </>
    );
  }

  // User is authenticated - show the workflow
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
