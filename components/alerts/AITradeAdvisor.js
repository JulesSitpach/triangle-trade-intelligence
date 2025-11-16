/**
 * AI Trade Advisor Component
 * Displays conversational, strategic guidance from AI advisor
 * Tier-gated: Better insights for higher tiers
 */

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

export default function AITradeAdvisor({ userProfile, subscriptionTier = 'Trial' }) {
  const [advisorInsights, setAdvisorInsights] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAdvisorInsights = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai-trade-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          user_profile: userProfile,
          subscription_tier: subscriptionTier
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch advisor insights: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setAdvisorInsights(data.advisor_insights);
      } else {
        throw new Error(data.message || 'Failed to generate insights');
      }
    } catch (err) {
      console.error('❌ Error fetching advisor insights:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [userProfile, subscriptionTier]);

  useEffect(() => {
    if (userProfile?.componentOrigins && userProfile.componentOrigins.length > 0) {
      fetchAdvisorInsights();
    } else {
      setIsLoading(false);
    }
  }, [userProfile, subscriptionTier, fetchAdvisorInsights]);

  if (isLoading) {
    return (
      <div className="form-section">
        <h2 className="form-section-title">🧠 AI Trade Intelligence Advisor</h2>
        <div className="alert alert-info">
          <div className="alert-content">
            <div className="alert-title">Analyzing your supply chain...</div>
            <div className="text-body">
              Our AI is reviewing your {userProfile?.componentOrigins?.length || 0} components and generating strategic insights.
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="form-section">
        <h2 className="form-section-title">🧠 AI Trade Intelligence Advisor</h2>
        <div className="alert alert-warning">
          <div className="alert-content">
            <div className="alert-title">Unable to Generate Insights</div>
            <div className="text-body">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  if (!advisorInsights) {
    return null;
  }

  // Render based on tier
  if (subscriptionTier === 'Trial') {
    return <TrialAdvisor insights={advisorInsights} />;
  } else if (subscriptionTier === 'Starter') {
    return <StarterAdvisor insights={advisorInsights} />;
  } else if (subscriptionTier === 'Professional') {
    return <ProfessionalAdvisor insights={advisorInsights} />;
  } else if (subscriptionTier === 'Premium') {
    return <PremiumAdvisor insights={advisorInsights} />;
  }

  return null;
}

// Trial tier - teaser
function TrialAdvisor({ insights }) {
  return (
    <div className="form-section">
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '2rem',
        borderRadius: '8px',
        marginBottom: '1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
          <span style={{ fontSize: '2rem', marginRight: '1rem' }}>🧠</span>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>
            AI Trade Intelligence Advisor
          </h2>
        </div>
        <p style={{ fontSize: '1rem', lineHeight: '1.6', margin: 0, opacity: 0.95 }}>
          {insights.welcome}
        </p>
      </div>

      <div className="card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
        <p className="text-body" style={{ fontSize: '1rem', lineHeight: '1.7', marginBottom: '1rem' }}>
          {insights.snapshot}
        </p>
        <div style={{
          background: '#f0fdf4',
          border: '1px solid #86efac',
          borderRadius: '6px',
          padding: '1rem',
          marginTop: '1rem'
        }}>
          <p className="text-body" style={{ fontSize: '1rem', lineHeight: '1.7', margin: 0 }}>
            💡 <strong>Sample Insight:</strong> {insights.teaser_insight}
          </p>
        </div>
      </div>

      <div className="alert alert-info">
        <div className="alert-content">
          <div className="alert-title">🚀 Unlock Full AI Advisory</div>
          <div className="text-body">
            <p>{insights.upgrade_value}</p>
          </div>
          <div className="hero-buttons" style={{ marginTop: '1rem' }}>
            <Link href="/pricing" className="btn-primary">
              View Plans & Pricing
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// Starter tier - brief guidance
function StarterAdvisor({ insights }) {
  return (
    <div className="form-section">
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '2rem',
        borderRadius: '8px',
        marginBottom: '1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
          <span style={{ fontSize: '2rem', marginRight: '1rem' }}>🧠</span>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>
            Your AI Trade Advisor
          </h2>
        </div>
        <p style={{ fontSize: '1rem', lineHeight: '1.6', margin: 0, opacity: 0.95 }}>
          {insights.greeting}
        </p>
      </div>

      <div className="card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: '#059669' }}>
          ✅ What You&apos;re Doing Well
        </h3>
        <p className="text-body" style={{ fontSize: '1rem', lineHeight: '1.7' }}>
          {insights.current_position}
        </p>
      </div>

      <div className="card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: '#dc2626' }}>
          💡 Key Opportunity to Explore
        </h3>
        <p className="text-body" style={{ fontSize: '1rem', lineHeight: '1.7' }}>
          {insights.high_level_opportunity}
        </p>
      </div>

      <div className="alert alert-info">
        <div className="alert-content">
          <div className="alert-title">🔓 Unlock Deeper Insights</div>
          <div className="text-body">
            <p>{insights.tier_limitation}</p>
            <p style={{ marginTop: '0.5rem' }}>{insights.closing}</p>
          </div>
          <div className="hero-buttons" style={{ marginTop: '1rem' }}>
            <Link href="/pricing" className="btn-primary">
              Upgrade to Professional
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// Professional tier - strategic guidance
function ProfessionalAdvisor({ insights }) {
  return (
    <div className="form-section">
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '2rem',
        borderRadius: '8px',
        marginBottom: '1.5rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: '2rem', marginRight: '1rem' }}>🧠</span>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>
              Your AI Trade Strategist
            </h2>
          </div>
          <span style={{
            background: 'rgba(255,255,255,0.2)',
            padding: '0.25rem 0.75rem',
            borderRadius: '12px',
            fontSize: '0.875rem',
            fontWeight: 500
          }}>
            PROFESSIONAL TIER
          </span>
        </div>
        <p style={{ fontSize: '1.1rem', lineHeight: '1.6', margin: 0, opacity: 0.95 }}>
          {insights.strategic_assessment}
        </p>
      </div>

      <div className="card" style={{ padding: '1.5rem', marginBottom: '1rem', borderLeft: '4px solid #dc2626' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: '#dc2626' }}>
          🎯 Your Immediate Priority
        </h3>
        <p className="text-body" style={{ fontSize: '1rem', lineHeight: '1.7' }}>
          {insights.immediate_priorities}
        </p>
      </div>

      <div className="card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: '#059669' }}>
          💰 Optimization Opportunity
        </h3>
        <div style={{ marginBottom: '1rem' }}>
          <p className="text-body" style={{ fontSize: '1rem', lineHeight: '1.7', marginBottom: '1rem' }}>
            <strong>The Opportunity:</strong> {insights.optimization_opportunity?.what}
          </p>
          <p className="text-body" style={{ fontSize: '1rem', lineHeight: '1.7', marginBottom: '1rem' }}>
            <strong>Why It Matters:</strong> {insights.optimization_opportunity?.why_it_matters}
          </p>
          <p className="text-body" style={{ fontSize: '1rem', lineHeight: '1.7', marginBottom: '1rem' }}>
            <strong>How to Approach It:</strong> {insights.optimization_opportunity?.how_to_approach}
          </p>
          <div style={{
            background: '#f0fdf4',
            border: '1px solid #86efac',
            borderRadius: '6px',
            padding: '1rem',
            marginTop: '1rem'
          }}>
            <p className="text-body" style={{ fontSize: '1rem', lineHeight: '1.7', margin: 0 }}>
              <strong>Expected Outcome:</strong> {insights.optimization_opportunity?.expected_outcome}
            </p>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '1.5rem', marginBottom: '1rem', background: '#fef3c7', border: '1px solid #fbbf24' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: '#92400e' }}>
          ⚠️ Risk Perspective
        </h3>
        <p className="text-body" style={{ fontSize: '1rem', lineHeight: '1.7', color: '#78350f' }}>
          {insights.risk_perspective}
        </p>
      </div>

      <div className="card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: '#6366f1' }}>
          📅 Next 90 Days Roadmap
        </h3>
        <p className="text-body" style={{ fontSize: '1rem', lineHeight: '1.7' }}>
          {insights.next_quarter_roadmap}
        </p>
      </div>
    </div>
  );
}

// Premium tier - executive insights
function PremiumAdvisor({ insights }) {
  return (
    <div className="form-section">
      <div style={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #7c3aed 50%, #ec4899 100%)',
        color: 'white',
        padding: '2.5rem',
        borderRadius: '8px',
        marginBottom: '1.5rem',
        boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: '2.5rem', marginRight: '1rem' }}>👔</span>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700 }}>
                Executive Trade Intelligence
              </h2>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', opacity: 0.9 }}>
                Your Dedicated AI Strategist
              </p>
            </div>
          </div>
          <span style={{
            background: 'rgba(236,72,153,0.3)',
            padding: '0.5rem 1rem',
            borderRadius: '12px',
            fontSize: '0.875rem',
            fontWeight: 600,
            border: '1px solid rgba(255,255,255,0.3)'
          }}>
            ⭐ PREMIUM
          </span>
        </div>
        <p style={{ fontSize: '1.2rem', lineHeight: '1.7', margin: 0, opacity: 0.95, fontWeight: 500 }}>
          {insights.executive_summary}
        </p>
      </div>

      {/* Strategic Position */}
      <div className="card" style={{ padding: '2rem', marginBottom: '1rem', border: '2px solid #6366f1' }}>
        <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', color: '#1e40af' }}>
          📊 Strategic Position Analysis
        </h3>

        <div className="mb-6">
          <h4 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>
            Competitive Standing
          </h4>
          <p className="text-body" style={{ fontSize: '1rem', lineHeight: '1.7' }}>
            {insights.strategic_position?.competitive_standing}
          </p>
        </div>

        <div style={{
          background: '#f0fdf4',
          border: '1px solid #86efac',
          borderRadius: '6px',
          padding: '1.25rem',
          marginBottom: '1.5rem'
        }}>
          <h4 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem', color: '#059669' }}>
            ✨ Hidden Advantages
          </h4>
          <p className="text-body" style={{ fontSize: '1rem', lineHeight: '1.7', margin: 0 }}>
            {insights.strategic_position?.hidden_advantages}
          </p>
        </div>

        <div style={{
          background: '#fef3c7',
          border: '1px solid #fbbf24',
          borderRadius: '6px',
          padding: '1.25rem'
        }}>
          <h4 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem', color: '#92400e' }}>
            🛡️ Vulnerability Assessment
          </h4>
          <p className="text-body" style={{ fontSize: '1rem', lineHeight: '1.7', margin: 0, color: '#78350f' }}>
            {insights.strategic_position?.vulnerability_exposure}
          </p>
        </div>
      </div>

      {/* Strategic Guidance */}
      <div className="card" style={{ padding: '2rem', marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', color: '#7c3aed' }}>
          🎯 Strategic Action Plan
        </h3>

        <div className="mb-6">
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{
              background: '#dc2626',
              color: 'white',
              padding: '0.25rem 0.75rem',
              borderRadius: '12px',
              fontSize: '0.75rem',
              fontWeight: 600,
              marginRight: '0.75rem'
            }}>
              NEXT 30 DAYS
            </span>
            <h4 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600, color: '#374151' }}>
              Immediate Actions
            </h4>
          </div>
          <p className="text-body" style={{ fontSize: '1rem', lineHeight: '1.7' }}>
            {insights.strategic_guidance?.short_term_actions}
          </p>
        </div>

        <div className="mb-6">
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{
              background: '#f59e0b',
              color: 'white',
              padding: '0.25rem 0.75rem',
              borderRadius: '12px',
              fontSize: '0.75rem',
              fontWeight: 600,
              marginRight: '0.75rem'
            }}>
              NEXT 6 MONTHS
            </span>
            <h4 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600, color: '#374151' }}>
              Competitive Positioning
            </h4>
          </div>
          <p className="text-body" style={{ fontSize: '1rem', lineHeight: '1.7' }}>
            {insights.strategic_guidance?.medium_term_positioning}
          </p>
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{
              background: '#6366f1',
              color: 'white',
              padding: '0.25rem 0.75rem',
              borderRadius: '12px',
              fontSize: '0.75rem',
              fontWeight: 600,
              marginRight: '0.75rem'
            }}>
              12+ MONTHS
            </span>
            <h4 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600, color: '#374151' }}>
              Long-term Strategy
            </h4>
          </div>
          <p className="text-body" style={{ fontSize: '1rem', lineHeight: '1.7' }}>
            {insights.strategic_guidance?.long_term_strategy}
          </p>
        </div>
      </div>

      {/* Financial Perspective */}
      <div className="card" style={{ padding: '2rem', marginBottom: '1rem', background: 'linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 100%)' }}>
        <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', color: '#059669' }}>
          💰 Financial Analysis
        </h3>

        <div style={{ marginBottom: '1.25rem' }}>
          <h4 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>
            Current Exposure
          </h4>
          <p className="text-body" style={{ fontSize: '1rem', lineHeight: '1.7' }}>
            {insights.financial_perspective?.current_exposure}
          </p>
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <h4 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>
            ROI on Optimization
          </h4>
          <p className="text-body" style={{ fontSize: '1rem', lineHeight: '1.7' }}>
            {insights.financial_perspective?.optimization_roi}
          </p>
        </div>

        <div>
          <h4 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>
            Investment Priorities
          </h4>
          <p className="text-body" style={{ fontSize: '1rem', lineHeight: '1.7' }}>
            {insights.financial_perspective?.investment_priorities}
          </p>
        </div>
      </div>

      {/* Early Warning */}
      <div className="card" style={{ padding: '2rem', marginBottom: '1rem', background: '#fef3c7', border: '2px solid #f59e0b' }}>
        <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem', color: '#92400e' }}>
          🔮 Early Warning Intelligence
        </h3>
        <p className="text-body" style={{ fontSize: '1rem', lineHeight: '1.7', color: '#78350f' }}>
          {insights.early_warning_insights}
        </p>
      </div>

      {/* Executive Recommendation */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #7c3aed 100%)',
        color: 'white',
        padding: '2rem',
        borderRadius: '8px'
      }}>
        <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>
          💼 Executive Recommendation
        </h3>
        <p style={{ fontSize: '1.1rem', lineHeight: '1.7', margin: 0, opacity: 0.95 }}>
          {insights.executive_recommendation}
        </p>
      </div>
    </div>
  );
}
