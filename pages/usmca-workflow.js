/**
 * USMCA Workflow - Refactored microservices architecture
 * Transforms 894-line monolithic component into clean orchestration
 * Uses trust-verified microservices and focused components
 * PROTECTED: Requires authentication
 */

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSimpleAuth } from '../lib/contexts/SimpleAuthContext';
import Head from 'next/head';
import Link from 'next/link';
import TriangleLayout from '../components/TriangleLayout';
import USMCAWorkflowOrchestrator from '../components/workflow/USMCAWorkflowOrchestrator';

export default function USMCAWorkflow() {
  const router = useRouter();
  const { view_results } = router.query; // ✅ Check if viewing read-only results
  const [usageLimitReached, setUsageLimitReached] = useState(false);
  const [usageStats, setUsageStats] = useState(null);
  const [checkingLimit, setCheckingLimit] = useState(true);

  // Use shared auth context instead of redundant API call
  const { user, loading } = useSimpleAuth();

  // Redirect if not authenticated (only runs after auth check completes)
  useEffect(() => {
    if (!loading && !user) {
      console.log('❌ No valid session, redirecting to login');
      router.push('/login?redirect=/usmca-workflow');
    }
  }, [loading, user, router]);

  // ✅ NEW: Check subscription limit BEFORE allowing workflow access
  // Prevents frustration of filling forms only to be blocked at analysis step
  useEffect(() => {
    if (!user || loading) {
      setCheckingLimit(false);
      return;
    }

    const checkUsageLimit = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) {
          setCheckingLimit(false);
          return;
        }

        const response = await fetch('/api/check-usage-limit', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          console.log('[WORKFLOW-PAGE] Usage limit check:', data);
          setUsageStats(data.usage);
          // ✅ FIX: API returns usage.limit_reached (not data.limitReached)
          setUsageLimitReached(data.usage?.limit_reached || false);
        } else {
          console.error('[WORKFLOW-PAGE] Failed to check usage limit:', response.status);
        }
      } catch (error) {
        console.error('[WORKFLOW-PAGE] Error checking usage limit:', error);
      } finally {
        setCheckingLimit(false);
      }
    };

    checkUsageLimit();
  }, [user, loading]);

  // Show loading while checking authentication or usage limits
  if (loading || checkingLimit) {
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
                {loading ? 'Checking access...' : 'Checking usage limit...'}
              </div>
            </div>
          </div>
        </TriangleLayout>
      </>
    );
  }

  // ✅ NEW: Block workflow access if usage limit reached
  // This prevents users from wasting time filling forms only to be blocked at analysis
  if (usageLimitReached && usageStats) {
    const tier = usageStats.tier || 'Trial';
    const used = usageStats.used || 0;
    const limit = usageStats.limit || 1;

    return (
      <>
        <Head>
          <title>Usage Limit Reached | Upgrade Required</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </Head>

        <TriangleLayout>
          <div className="main-content">
            <div className="container-app">
              <div className="content-card" style={{ maxWidth: '600px', margin: '50px auto', padding: '40px' }}>
                <div className="text-center" style={{ marginBottom: '30px' }}>
                  <div style={{ fontSize: '64px', marginBottom: '10px' }}>🔒</div>
                  <h2 className="content-card-title text-red" style={{ marginBottom: '10px' }}>
                    Monthly Analysis Limit Reached
                  </h2>
                  <p className="text-body text-lg text-gray-600">
                    You&apos;ve used <strong>{used} of {limit}</strong> analyses this month
                  </p>
                </div>

                <div className="form-section" style={{ backgroundColor: '#FEF2F2', border: '2px solid #FCA5A5', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
                  <p className="text-body" style={{ marginBottom: '15px' }}>
                    <strong>Current Plan:</strong> {tier}
                    <br />
                    <strong>Usage:</strong> {used}/{limit} analyses used
                    <br />
                    <strong>Status:</strong> <span className="text-red font-bold">Limit Reached</span>
                  </p>
                  <p className="text-body">
                    To create more USMCA workflows, upgrade to a paid plan with higher monthly limits.
                  </p>
                </div>

                <div className="grid-2-cols" style={{ gap: '15px', marginBottom: '20px' }}>
                  <div style={{ padding: '20px', border: '2px solid #10b981', borderRadius: '8px', backgroundColor: '#F0FDF4' }}>
                    <h3 className="font-bold" style={{ fontSize: '16px', marginBottom: '10px', color: '#065f46' }}>
                      Starter
                    </h3>
                    <p className="font-bold" style={{ fontSize: '24px', marginBottom: '5px', color: '#047857' }}>
                      $99/mo
                    </p>
                    <p style={{ fontSize: '14px', color: '#047857', marginBottom: '10px' }}>
                      15 analyses/month
                    </p>
                    <p className="text-sm text-gray-600">
                      Perfect for small importers
                    </p>
                  </div>

                  <div style={{ padding: '20px', border: '2px solid #3b82f6', borderRadius: '8px', backgroundColor: '#EFF6FF' }}>
                    <h3 className="font-bold" style={{ fontSize: '16px', marginBottom: '10px', color: '#1e40af' }}>
                      Professional
                    </h3>
                    <p className="font-bold" style={{ fontSize: '24px', marginBottom: '5px', color: '#2563eb' }}>
                      $299/mo
                    </p>
                    <p style={{ fontSize: '14px', color: '#2563eb', marginBottom: '10px' }}>
                      100 analyses/month
                    </p>
                    <p className="text-sm text-gray-600">
                      For growing businesses
                    </p>
                  </div>
                </div>

                <div className="hero-button-group" style={{ flexDirection: 'column', gap: '10px' }}>
                  <Link href="/pricing" className="btn-primary btn-lg text-center" style={{ width: '100%' }}>
                    🚀 Upgrade Now
                  </Link>
                  <Link href="/dashboard" className="btn-secondary text-center" style={{ width: '100%' }}>
                    ← Back to Dashboard
                  </Link>
                </div>

                <p className="text-body text-center text-sm" style={{ color: '#9ca3af', marginTop: '20px' }}>
                  Your usage resets on the 1st of each month
                </p>
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
        <USMCAWorkflowOrchestrator readOnly={!!view_results} workflowId={view_results} />
      </TriangleLayout>
    </>
  );
}
