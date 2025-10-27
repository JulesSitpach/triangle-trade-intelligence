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

      console.log('🔍 [POLICYTIMELINE] Starting policy threat check:', {
        components_count: components.length,
        hs_codes: hsCodesFull,
        hs_prefixes: hsPrefixes,
        destination
      });

      if (hsPrefixes.length === 0) {
        console.log('⚠️  [POLICYTIMELINE] No HS codes found in components - skipping threat check');
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

      console.log('📡 [POLICYTIMELINE] trump_policy_events query result:', {
        records_found: allPolicyEvents?.length || 0,
        first_record: allPolicyEvents?.[0],
        error: eventsError
      });

      // Filter events that match any of the user's HS code prefixes
      const matchingEvents = allPolicyEvents?.filter(event => {
        if (!event.affected_hs_codes || event.affected_hs_codes.length === 0) {
          return false;
        }
        return event.affected_hs_codes.some(eventCode =>
          hsPrefixes.some(prefix => eventCode.startsWith(prefix))
        );
      }) || [];

      console.log('🎯 [POLICYTIMELINE] trump_policy_events filtering result:', {
        matching_events_count: matchingEvents.length,
        matching_events: matchingEvents
      });

      // Query tariff_policy_updates and filter client-side for prefix matches
      const { data: allPolicyUpdates, error: updatesError } = await supabase
        .from('tariff_policy_updates')
        .select(
          'id, title, affected_hs_codes, status, effective_date, adjustment_percentage, policy_type'
        )
        .eq('is_active', true);

      if (updatesError) throw updatesError;

      console.log('📡 [POLICYTIMELINE] tariff_policy_updates query result:', {
        records_found: allPolicyUpdates?.length || 0,
        first_record: allPolicyUpdates?.[0],
        error: updatesError
      });

      // Filter updates that match any of the user's HS code prefixes
      const matchingUpdates = allPolicyUpdates?.filter(update => {
        if (!update.affected_hs_codes || update.affected_hs_codes.length === 0) {
          return false;
        }
        return update.affected_hs_codes.some(updateCode =>
          hsPrefixes.some(prefix => updateCode.startsWith(prefix))
        );
      }) || [];

      console.log('🎯 [POLICYTIMELINE] tariff_policy_updates filtering result:', {
        matching_updates_count: matchingUpdates.length,
        matching_updates: matchingUpdates
      });

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

      console.log('✅ [POLICYTIMELINE] Final merged threats:', {
        total_threats: mergedThreats.length,
        threats: mergedThreats
      });

      setThreats(mergedThreats);
    } catch (error) {
      console.error('❌ [POLICYTIMELINE] Error fetching policy threats:', error);
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
    console.log('⚠️  [POLICYTIMELINE] No threats found - component will not display');
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
          border-left: 5px solid #dc2626;
          background: linear-gradient(135deg, #fef2f2 0%, #fff7f7 100%);
          box-shadow: 0 4px 12px rgba(220, 38, 38, 0.12);
        }

        .policy-timeline-card .card-header {
          background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
          color: white;
          border-radius: 0;
        }

        .policy-timeline-card .card-title {
          color: white;
          font-size: 1.1rem;
        }

        .timeline-container {
          position: relative;
          padding: 1rem 0;
        }

        .timeline-item {
          display: flex;
          padding: 1.75rem 0;
          position: relative;
          border-bottom: 2px solid #fee2e2;
          transition: background-color 0.2s ease;
        }

        .timeline-item:hover {
          background-color: rgba(220, 38, 38, 0.02);
        }

        .timeline-item:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .timeline-marker {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-right: 1.75rem;
          position: relative;
          min-width: 60px;
        }

        .timeline-dot {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.75rem;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3), inset 0 1px 3px rgba(255, 255, 255, 0.3);
          border: 2px solid #fee2e2;
        }

        .timeline-line {
          width: 4px;
          flex-grow: 1;
          background: linear-gradient(180deg, #fca5a5 0%, #fecaca 100%);
          margin-top: 0.75rem;
          border-radius: 2px;
        }

        .timeline-content {
          flex: 1;
          background: white;
          padding: 1.5rem;
          border-radius: 10px;
          border-left: 4px solid #dc2626;
          border-top: 1px solid #fee2e2;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          transition: all 0.2s ease;
        }

        .timeline-content:hover {
          box-shadow: 0 4px 16px rgba(220, 38, 38, 0.15);
          transform: translateY(-2px);
        }

        .timeline-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
          gap: 1rem;
        }

        .timeline-title {
          font-size: 1.15rem;
          font-weight: 800;
          color: #7f1d1d;
          margin: 0;
          flex: 1;
          line-height: 1.3;
        }

        .badge {
          display: inline-block;
          padding: 0.4rem 1rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 800;
          white-space: nowrap;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .badge-warning {
          background: linear-gradient(135deg, #fef3c7 0%, #fde047 100%);
          color: #713f12;
        }

        .badge-danger {
          background: linear-gradient(135deg, #fee2e2 0%, #fca5a5 100%);
          color: #7f1d1d;
        }

        .badge-error {
          background: linear-gradient(135deg, #fca5a5 0%, #f87171 100%);
          color: #7f1d1d;
        }

        .badge-default {
          background: linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%);
          color: #1f2937;
        }

        .timeline-date {
          font-size: 0.75rem;
          color: #991b1b;
          margin-bottom: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          display: inline-block;
          background: #fef2f2;
          padding: 0.3rem 0.75rem;
          border-radius: 4px;
        }

        .timeline-details-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.25rem;
          margin: 1.25rem 0;
          padding: 1.25rem;
          background: linear-gradient(135deg, #fef2f2 0%, #fef5f5 100%);
          border-radius: 8px;
          border: 1px solid #fee2e2;
        }

        .timeline-detail {
          font-size: 0.95rem;
          color: #374151;
        }

        .timeline-detail strong {
          display: block;
          font-size: 0.75rem;
          color: #991b1b;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          margin-bottom: 0.35rem;
          font-weight: 800;
        }

        .severity-badge {
          display: inline-block;
          padding: 0.35rem 0.75rem;
          border-radius: 5px;
          font-size: 0.85rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .severity-critical {
          background: linear-gradient(135deg, #fee2e2 0%, #fca5a5 100%);
          color: #7f1d1d;
        }

        .severity-high {
          background: linear-gradient(135deg, #fef3c7 0%, #fde047 100%);
          color: #713f12;
        }

        .severity-medium {
          background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
          color: #1e40af;
        }

        .timeline-alert {
          margin-top: 1.25rem;
          padding: 1.1rem;
          background: linear-gradient(135deg, #dbeafe 0%, #e0f2fe 100%);
          border-left: 5px solid #0284c7;
          border-top: 1px solid #7dd3fc;
          border-radius: 8px;
          font-size: 0.95rem;
          color: #0c4a6e;
          line-height: 1.5;
          font-weight: 500;
        }

        .timeline-alert.warning {
          background: linear-gradient(135deg, #fef3c7 0%, #fef9c3 100%);
          border-left-color: #ca8a04;
          border-top-color: #facc15;
          color: #713f12;
        }

        .timeline-alert.error {
          background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
          border-left-color: #dc2626;
          border-top-color: #f87171;
          color: #7f1d1d;
        }

        .timeline-recommendations {
          margin-top: 2rem;
          padding-top: 1.75rem;
          border-top: 3px solid #fee2e2;
        }

        .timeline-recommendations h4 {
          font-size: 0.95rem;
          font-weight: 800;
          color: #7f1d1d;
          margin-bottom: 1rem;
          text-transform: uppercase;
          letter-spacing: 0.6px;
        }

        .timeline-recommendations ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .timeline-recommendations li {
          font-size: 0.95rem;
          color: #374151;
          padding-left: 1.75rem;
          position: relative;
          margin-bottom: 0.85rem;
          line-height: 1.6;
        }

        .timeline-recommendations li::before {
          content: '→';
          position: absolute;
          left: 0;
          color: #dc2626;
          font-weight: 800;
          font-size: 1.2rem;
        }

        @media (max-width: 640px) {
          .timeline-details-grid {
            grid-template-columns: 1fr;
          }

          .timeline-header {
            flex-direction: column;
          }

          .timeline-dot {
            width: 50px;
            height: 50px;
            font-size: 1.5rem;
          }

          .timeline-marker {
            margin-right: 1rem;
            min-width: 50px;
          }
        }
      `}</style>
    </div>
  );
}
