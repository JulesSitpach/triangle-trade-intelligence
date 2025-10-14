/**
 * USMCA Workflow - Refactored microservices architecture
 * Transforms 894-line monolithic component into clean orchestration
 * Uses trust-verified microservices and focused components
 * PROTECTED: Requires authentication
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import TriangleLayout from '../components/TriangleLayout';
import USMCAWorkflowOrchestrator from '../components/workflow/USMCAWorkflowOrchestrator';

export default function USMCAWorkflow() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check cookie-based session via API
    fetch('/api/auth/me', {
      credentials: 'include'
    })
    .then(r => r.json())
    .then(data => {
      if (data.authenticated && data.user) {
        setUser(data.user);
        setLoading(false);
      } else {
        // Not authenticated - redirect to login
        router.push('/login?redirect=/usmca-workflow');
      }
    })
    .catch(error => {
      console.error('Auth check failed:', error);
      router.push('/login?redirect=/usmca-workflow');
    });
  }, []);

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
