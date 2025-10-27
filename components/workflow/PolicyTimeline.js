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

      // Extract HS codes from components (full 10-digit codes like "8542.31.00")
      const hsCodesFull = components
        .map(c => c.hs_code)
        .filter(Boolean);

      // Extract HS code prefixes (first 4 digits for matching policy records)
      const hsPrefixes = hsCodesFull.map(code =>
        code.replace(/\./g, '').substring(0, 4)
      );

      if (hsPrefixes.length === 0) {
        setThreats([]);
        setLoading(false);
        return;
      }

      // Query ALL trump_policy_events and filter client-side for prefix matches
      // (Database array overlap doesn't support partial string matching)
      const { data: allPolicyEvents, error: eventsError } = await supabase
        .from('trump_policy_events')
        .select(
          'id, event_date, policy_title, affected_hs_codes, impact_severity, implementation_timeline, implementation_probability'
        )
        .order('event_date', { ascending: false });

      if (eventsError) throw eventsError;

      // Filter events that match any of the user's HS code prefixes
      const matchingEvents = allPolicyEvents?.filter(event => {
        if (!event.affected_hs_codes || event.affected_hs_codes.length === 0) {
          return false;
        }
        return event.affected_hs_codes.some(eventCode =>
          hsPrefixes.some(prefix => eventCode.startsWith(prefix))
        );
      }) || [];

      // Query tariff_policy_updates and filter client-side for prefix matches
      const { data: allPolicyUpdates, error: updatesError } = await supabase
        .from('tariff_policy_updates')
        .select(
          'id, title, affected_hs_codes, status, effective_date, adjustment_percentage, policy_type'
        )
        .eq('is_active', true);

      if (updatesError) throw updatesError;

      // Filter updates that match any of the user's HS code prefixes
      const matchingUpdates = allPolicyUpdates?.filter(update => {
        if (!update.affected_hs_codes || update.affected_hs_codes.length === 0) {
          return false;
        }
        return update.affected_hs_codes.some(updateCode =>
          hsPrefixes.some(prefix => updateCode.startsWith(prefix))
        );
      }) || [];

      // Merge and deduplicate threats
      const mergedThreats = [];
      const seenTitles = new Set();

      // Add events first (announcements)
      matchingEvents?.forEach(event => {
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
      matchingUpdates?.forEach(update => {
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

                <div className="timeline-details-grid">
                  {threat.severity && (
                    <div className="timeline-detail">
                      <strong>Severity:</strong>
                      <span className={`severity-badge severity-${threat.severity?.toLowerCase().replace(' ', '-')}`}>
                        {threat.severity}
                      </span>
                    </div>
                  )}

                  {threat.timeline && (
                    <div className="timeline-detail">
                      <strong>Implementation:</strong> {threat.timeline}
                    </div>
                  )}

                  {threat.probability && (
                    <div className="timeline-detail">
                      <strong>Likelihood:</strong> {Math.round(threat.probability * 100)}%
                    </div>
                  )}

                  {threat.percentage && (
                    <div className="timeline-detail">
                      <strong>Rate Change:</strong> +{threat.percentage}%
                    </div>
                  )}
                </div>

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
          background: #fef2f2;
        }

        .timeline-container {
          position: relative;
          padding: 0;
        }

        .timeline-item {
          display: flex;
          padding: 1.5rem 0;
          position: relative;
          border-bottom: 1px solid #fecaca;
        }

        .timeline-item:last-child {
          border-bottom: none;
        }

        .timeline-marker {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-right: 1.5rem;
          position: relative;
          min-width: 50px;
        }

        .timeline-dot {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: white;
          border: 3px solid #dc2626;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          flex-shrink: 0;
          box-shadow: 0 2px 8px rgba(220, 38, 38, 0.2);
        }

        .timeline-line {
          width: 3px;
          flex-grow: 1;
          background: #fca5a5;
          margin-top: 0.5rem;
        }

        .timeline-content {
          flex: 1;
          background: white;
          padding: 1.25rem;
          border-radius: 8px;
          border-left: 3px solid #dc2626;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        .timeline-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 0.75rem;
          gap: 1rem;
        }

        .timeline-title {
          font-size: 1.05rem;
          font-weight: 700;
          color: #111827;
          margin: 0;
          flex: 1;
        }

        .badge {
          display: inline-block;
          padding: 0.35rem 0.85rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 700;
          white-space: nowrap;
          text-transform: uppercase;
          letter-spacing: 0.5px;
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
          font-size: 0.8rem;
          color: #9ca3af;
          margin-bottom: 0.75rem;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .timeline-details-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
          margin: 1rem 0;
          padding: 1rem;
          background: #f9fafb;
          border-radius: 6px;
        }

        .timeline-detail {
          font-size: 0.9rem;
          color: #374151;
        }

        .timeline-detail strong {
          display: block;
          font-size: 0.8rem;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 0.25rem;
        }

        .severity-badge {
          display: inline-block;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .severity-critical {
          background: #fee2e2;
          color: #991b1b;
        }

        .severity-high {
          background: #fef3c7;
          color: #92400e;
        }

        .severity-medium {
          background: #dbeafe;
          color: #0c4a6e;
        }

        .timeline-alert {
          margin-top: 1rem;
          padding: 0.9rem;
          background: #dbeafe;
          border-left: 4px solid #0284c7;
          border-radius: 6px;
          font-size: 0.9rem;
          color: #0c4a6e;
          line-height: 1.4;
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
          margin-top: 2rem;
          padding-top: 1.5rem;
          border-top: 2px solid #fecaca;
        }

        .timeline-recommendations h4 {
          font-size: 0.95rem;
          font-weight: 700;
          color: #111827;
          margin-bottom: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .timeline-recommendations ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .timeline-recommendations li {
          font-size: 0.9rem;
          color: #374151;
          padding-left: 1.75rem;
          position: relative;
          margin-bottom: 0.75rem;
          line-height: 1.5;
        }

        .timeline-recommendations li::before {
          content: '→';
          position: absolute;
          left: 0;
          color: #dc2626;
          font-weight: 700;
          font-size: 1.1rem;
        }

        @media (max-width: 640px) {
          .timeline-details-grid {
            grid-template-columns: 1fr;
          }

          .timeline-header {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}
