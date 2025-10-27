'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function PolicyTimeline({ components = [], destination = 'US' }) {
  const [threats, setThreats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!components || components.length === 0) {
      setLoading(false);
      return;
    }

    fetchPolicyThreats();
  }, [components, destination]);

  const fetchPolicyThreats = async () => {
    try {
      setLoading(true);

      // Extract HS codes from components
      const hsCodes = components
        .map(c => c.hs_code)
        .filter(Boolean);

      if (hsCodes.length === 0) {
        setThreats([]);
        setLoading(false);
        return;
      }

      // Query trump_policy_events for announced threats
      const { data: policyEvents, error: eventsError } = await supabase
        .from('trump_policy_events')
        .select(
          'id, event_date, policy_title, affected_hs_codes, impact_severity, implementation_timeline, implementation_probability'
        )
        .overlaps('affected_hs_codes', hsCodes)
        .order('event_date', { ascending: false });

      if (eventsError) throw eventsError;

      // Query tariff_policy_updates for implementation status
      const { data: policyUpdates, error: updatesError } = await supabase
        .from('tariff_policy_updates')
        .select(
          'id, title, affected_hs_codes, status, effective_date, adjustment_percentage, policy_type'
        )
        .overlaps('affected_hs_codes', hsCodes)
        .eq('is_active', true);

      if (updatesError) throw updatesError;

      // Merge and deduplicate threats
      const mergedThreats = [];
      const seenTitles = new Set();

      // Add events first (announcements)
      policyEvents?.forEach(event => {
        if (!seenTitles.has(event.policy_title)) {
          mergedThreats.push({
            id: event.id,
            title: event.policy_title,
            date: event.event_date,
            type: 'announcement',
            severity: event.impact_severity,
            timeline: event.implementation_timeline,
            probability: event.implementation_probability,
            source: 'trump_policy_events'
          });
          seenTitles.add(event.policy_title);
        }
      });

      // Add updates (confirmation/implementation)
      policyUpdates?.forEach(update => {
        if (!seenTitles.has(update.title)) {
          mergedThreats.push({
            id: update.id,
            title: update.title,
            date: update.effective_date,
            type: update.status,
            severity: update.policy_type,
            percentage: update.adjustment_percentage,
            source: 'tariff_policy_updates'
          });
          seenTitles.add(update.title);
        }
      });

      // Sort by date (newest first)
      mergedThreats.sort((a, b) => new Date(b.date) - new Date(a.date));

      setThreats(mergedThreats);
    } catch (error) {
      console.error('Error fetching policy threats:', error);
      setThreats([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">⚠️ Policy Threats</h3>
        </div>
        <div className="element-spacing">Loading policy alerts...</div>
      </div>
    );
  }

  if (threats.length === 0) {
    return null; // Don't show component if no threats
  }

  const getStatusBadge = (type) => {
    switch (type) {
      case 'announcement':
        return <span className="badge badge-warning">Announced</span>;
      case 'confirmed':
        return <span className="badge badge-danger">Confirmed</span>;
      case 'implemented':
        return <span className="badge badge-error">Implemented</span>;
      default:
        return <span className="badge badge-default">{type}</span>;
    }
  };

  const getSeverityIcon = (severity) => {
    if (!severity) return '📍';
    if (severity.toLowerCase().includes('high')) return '🔴';
    if (severity.toLowerCase().includes('medium')) return '🟠';
    return '🟡';
  };

  return (
    <div className="card policy-timeline-card">
      <div className="card-header">
        <h3 className="card-title">⚠️ Tariff Policy Threats</h3>
        <p className="card-subtitle">
          These policy changes could affect your product's tariff rates
        </p>
      </div>

      <div className="element-spacing">
        <div className="timeline-container">
          {threats.map((threat, index) => (
            <div key={threat.id} className="timeline-item">
              <div className="timeline-marker">
                <div className="timeline-dot">
                  {getSeverityIcon(threat.severity)}
                </div>
                {index < threats.length - 1 && <div className="timeline-line"></div>}
              </div>

              <div className="timeline-content">
                <div className="timeline-header">
                  <h4 className="timeline-title">{threat.title}</h4>
                  {getStatusBadge(threat.type)}
                </div>

                <div className="timeline-date">
                  {new Date(threat.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </div>

                {threat.severity && (
                  <div className="timeline-detail">
                    <strong>Severity:</strong> {threat.severity}
                  </div>
                )}

                {threat.timeline && (
                  <div className="timeline-detail">
                    <strong>Timeline:</strong> {threat.timeline}
                  </div>
                )}

                {threat.probability && (
                  <div className="timeline-detail">
                    <strong>Probability:</strong> {Math.round(threat.probability * 100)}%
                  </div>
                )}

                {threat.percentage && (
                  <div className="timeline-detail">
                    <strong>Potential Impact:</strong> {threat.percentage}% adjustment
                  </div>
                )}

                {threat.type === 'announcement' && (
                  <div className="timeline-alert">
                    💡 <strong>This threat has not yet been confirmed.</strong> Monitor announcements for implementation status.
                  </div>
                )}

                {threat.type === 'confirmed' && (
                  <div className="timeline-alert warning">
                    ⚠️ <strong>This threat has been confirmed</strong> and is pending implementation.
                  </div>
                )}

                {threat.type === 'implemented' && (
                  <div className="timeline-alert error">
                    🚨 <strong>This policy is now active.</strong> Your tariff rates may be affected.
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="timeline-recommendations">
          <h4>Next Steps:</h4>
          <ul>
            <li>Monitor announced policies for confirmation</li>
            <li>Review strategic alternatives (e.g., Mexico sourcing)</li>
            <li>Update supplier agreements if implementation is likely</li>
          </ul>
        </div>
      </div>

      <style jsx>{`
        .policy-timeline-card {
          border-left: 4px solid #dc2626;
        }

        .timeline-container {
          position: relative;
          padding: 0;
        }

        .timeline-item {
          display: flex;
          padding: 1rem 0;
          position: relative;
        }

        .timeline-marker {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-right: 1.5rem;
          position: relative;
          min-width: 40px;
        }

        .timeline-dot {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: white;
          border: 3px solid #dc2626;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          flex-shrink: 0;
        }

        .timeline-line {
          width: 3px;
          flex-grow: 1;
          background: #fca5a5;
          margin-top: 0.5rem;
        }

        .timeline-content {
          flex: 1;
          background: #fef2f2;
          padding: 1rem;
          border-radius: 6px;
          border-left: 2px solid #dc2626;
        }

        .timeline-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 0.5rem;
          gap: 1rem;
        }

        .timeline-title {
          font-size: 1rem;
          font-weight: 600;
          color: #111827;
          margin: 0;
        }

        .badge {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 600;
          white-space: nowrap;
        }

        .badge-warning {
          background: #fef3c7;
          color: #92400e;
        }

        .badge-danger {
          background: #fee2e2;
          color: #991b1b;
        }

        .badge-error {
          background: #fecaca;
          color: #7f1d1d;
        }

        .badge-default {
          background: #e5e7eb;
          color: #374151;
        }

        .timeline-date {
          font-size: 0.875rem;
          color: #6b7280;
          margin-bottom: 0.5rem;
        }

        .timeline-detail {
          font-size: 0.875rem;
          color: #374151;
          margin: 0.25rem 0;
        }

        .timeline-alert {
          margin-top: 0.75rem;
          padding: 0.75rem;
          background: #dbeafe;
          border-left: 3px solid #0284c7;
          border-radius: 4px;
          font-size: 0.875rem;
          color: #0c4a6e;
        }

        .timeline-alert.warning {
          background: #fef3c7;
          border-left-color: #ca8a04;
          color: #78350f;
        }

        .timeline-alert.error {
          background: #fee2e2;
          border-left-color: #dc2626;
          color: #7f1d1d;
        }

        .timeline-recommendations {
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid #e5e7eb;
        }

        .timeline-recommendations h4 {
          font-size: 0.95rem;
          font-weight: 600;
          color: #111827;
          margin-bottom: 0.75rem;
        }

        .timeline-recommendations ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .timeline-recommendations li {
          font-size: 0.875rem;
          color: #374151;
          padding-left: 1.5rem;
          position: relative;
          margin-bottom: 0.5rem;
        }

        .timeline-recommendations li::before {
          content: '→';
          position: absolute;
          left: 0;
          color: #dc2626;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}
