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
  const [expandedId, setExpandedId] = useState(null);

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

      // Build component lookup map with all details
      const componentMap = components
        .filter(c => c.hs_code)
        .map(c => ({
          hs_code: c.hs_code,
          hs_prefix: c.hs_code.replace(/\./g, '').substring(0, 4),
          origin_country: c.origin_country || 'Unknown',
          industry: c.industry || c.product_classification?.industry || 'Unknown',
          description: c.description || ''
        }));

      console.log('🔍 [POLICYTIMELINE] Starting policy threat check:', {
        components_count: components.length,
        component_details: componentMap.map(c => ({
          hs_code: c.hs_code,
          origin: c.origin_country,
          industry: c.industry
        })),
        destination
      });

      if (componentMap.length === 0) {
        console.log('⚠️  [POLICYTIMELINE] No HS codes found in components - skipping threat check');
        setThreats([]);
        setLoading(false);
        return;
      }

      // Query ALL trump_policy_events with affected_countries and affected_industries
      const { data: allPolicyEvents, error: eventsError } = await supabase
        .from('trump_policy_events')
        .select(
          'id, event_date, policy_title, affected_hs_codes, affected_countries, affected_industries, impact_severity, implementation_timeline, implementation_probability'
        )
        .order('event_date', { ascending: false });

      if (eventsError) throw eventsError;

      // Filter events that match origin country AND HS code AND industry
      const matchingEvents = allPolicyEvents?.filter(event => {
        if (!event.affected_hs_codes || event.affected_hs_codes.length === 0) {
          return false;
        }

        // Check if ANY component matches this policy on all three criteria
        return componentMap.some(comp => {
          // 1. Check if component's origin country is in affected_countries
          const countryMatches = event.affected_countries &&
            event.affected_countries.some(country =>
              country.toLowerCase() === comp.origin_country.toLowerCase()
            );

          // 2. Check if component's HS code matches affected_hs_codes
          const hsMatches = event.affected_hs_codes.some(eventCode =>
            eventCode.startsWith(comp.hs_prefix)
          );

          // 3. Check if component's industry matches affected_industries
          const industryMatches = !event.affected_industries ||
            event.affected_industries.length === 0 ||
            event.affected_industries.some(industry =>
              industry.toLowerCase() === comp.industry.toLowerCase()
            );

          return countryMatches && hsMatches && industryMatches;
        });
      }) || [];

      // Query tariff_policy_updates
      const { data: allPolicyUpdates, error: updatesError } = await supabase
        .from('tariff_policy_updates')
        .select(
          'id, title, affected_hs_codes, affected_countries, affected_industries, status, effective_date, adjustment_percentage, policy_type'
        )
        .eq('is_active', true);

      if (updatesError) throw updatesError;

      // Filter updates that match origin country AND HS code AND industry
      const matchingUpdates = allPolicyUpdates?.filter(update => {
        if (!update.affected_hs_codes || update.affected_hs_codes.length === 0) {
          return false;
        }

        // Check if ANY component matches this policy on all three criteria
        return componentMap.some(comp => {
          // 1. Check if component's origin country is in affected_countries
          const countryMatches = update.affected_countries &&
            update.affected_countries.some(country =>
              country.toLowerCase() === comp.origin_country.toLowerCase()
            );

          // 2. Check if component's HS code matches affected_hs_codes
          const hsMatches = update.affected_hs_codes.some(updateCode =>
            updateCode.startsWith(comp.hs_prefix)
          );

          // 3. Check if component's industry matches affected_industries
          const industryMatches = !update.affected_industries ||
            update.affected_industries.length === 0 ||
            update.affected_industries.some(industry =>
              industry.toLowerCase() === comp.industry.toLowerCase()
            );

          return countryMatches && hsMatches && industryMatches;
        });
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
      <div className="policy-threats-card">
        <div className="threats-header">
          <h3 className="threats-title">⚠️ Policy Threats</h3>
        </div>
        <div className="loading">Loading policy alerts...</div>
      </div>
    );
  }

  if (threats.length === 0) {
    console.log('⚠️  [POLICYTIMELINE] No threats found - component will not display');
    return null;
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
    <div className="policy-threats-card">
      <div className="threats-header">
        <h3 className="threats-title">⚠️ Tariff Policy Threats ({threats.length})</h3>
        <p className="threats-subtitle">Active policies affecting your products</p>
      </div>

      <div className="threats-list">
        {threats.map((threat) => (
          <div
            key={threat.id}
            className={`threat-item ${expandedId === threat.id ? 'expanded' : ''}`}
            onClick={() => setExpandedId(expandedId === threat.id ? null : threat.id)}
          >
            <div className="threat-summary">
              <div className="threat-icon">{getSeverityIcon(threat.severity)}</div>

              <div className="threat-main">
                <div className="threat-row">
                  <span className="threat-name">{threat.title}</span>
                  {getStatusBadge(threat.type)}
                </div>
                <div className="threat-meta">
                  {new Date(threat.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                  {threat.severity && ` • ${threat.severity}`}
                  {threat.probability && ` • ${Math.round(threat.probability * 100)}% likely`}
                </div>
              </div>

              <div className="expand-icon">{expandedId === threat.id ? '▼' : '▶'}</div>
            </div>

            {expandedId === threat.id && (
              <div className="threat-details">
                {threat.timeline && <div className="detail-item"><strong>Implementation:</strong> {threat.timeline}</div>}
                {threat.percentage && <div className="detail-item"><strong>Rate Change:</strong> +{threat.percentage}%</div>}

                {threat.type === 'announcement' && <div className="detail-alert info">💡 Not yet confirmed. Monitor for updates.</div>}
                {threat.type === 'confirmed' && <div className="detail-alert warning">⚠️ Confirmed and pending implementation.</div>}
                {threat.type === 'implemented' && <div className="detail-alert error">🚨 Policy is now active. Review impact.</div>}
              </div>
            )}
          </div>
        ))}
      </div>

      <style jsx>{`
        .policy-threats-card {
          border: 1px solid #fee2e2;
          border-radius: 10px;
          background: white;
          overflow: hidden;
        }

        .threats-header {
          background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
          color: white;
          padding: 0.9rem 1.2rem;
        }

        .threats-title {
          font-size: 1rem;
          font-weight: 700;
          margin: 0;
          line-height: 1.2;
        }

        .threats-subtitle {
          font-size: 0.8rem;
          color: rgba(255,255,255, 0.9);
          margin: 0.3rem 0 0 0;
          font-weight: 400;
        }

        .loading {
          padding: 1rem;
          color: #666;
          text-align: center;
          font-size: 0.9rem;
        }

        .threats-list {
          padding: 0;
        }

        .threat-item {
          border-bottom: 1px solid #fee2e2;
          transition: all 0.2s ease;
        }

        .threat-item:last-child {
          border-bottom: none;
        }

        .threat-item:hover {
          background-color: #fef5f5;
        }

        .threat-summary {
          display: flex;
          align-items: center;
          gap: 0.8rem;
          padding: 0.6rem 1rem;
          cursor: pointer;
          user-select: none;
        }

        .threat-icon {
          font-size: 1.3rem;
          flex-shrink: 0;
        }

        .threat-main {
          flex: 1;
          min-width: 0;
        }

        .threat-row {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          margin-bottom: 0.2rem;
          flex-wrap: wrap;
        }

        .threat-name {
          font-size: 0.95rem;
          font-weight: 600;
          color: #111827;
          flex: 1;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .threat-meta {
          font-size: 0.8rem;
          color: #666;
        }

        .expand-icon {
          font-size: 0.8rem;
          color: #999;
          flex-shrink: 0;
          transition: transform 0.2s ease;
          width: 16px;
          text-align: center;
        }

        .threat-item.expanded .expand-icon {
          transform: rotate(90deg);
        }

        .threat-details {
          padding: 0.6rem 1rem 0.8rem calc(1rem + 1.3rem + 0.8rem);
          background: #fef9f9;
          border-top: 1px solid #fee2e2;
          font-size: 0.85rem;
          color: #374151;
        }

        .detail-item {
          margin-bottom: 0.4rem;
          line-height: 1.4;
        }

        .detail-item strong {
          color: #7f1d1d;
          font-weight: 600;
        }

        .detail-alert {
          margin-top: 0.6rem;
          padding: 0.5rem;
          border-left: 3px solid;
          border-radius: 4px;
          font-size: 0.8rem;
          line-height: 1.3;
        }

        .detail-alert.info {
          border-left-color: #0284c7;
          background: #dbeafe;
          color: #0c4a6e;
        }

        .detail-alert.warning {
          border-left-color: #ca8a04;
          background: #fef3c7;
          color: #713f12;
        }

        .detail-alert.error {
          border-left-color: #dc2626;
          background: #fee2e2;
          color: #7f1d1d;
        }

        .badge {
          display: inline-block;
          padding: 0.2rem 0.65rem;
          border-radius: 999px;
          font-size: 0.65rem;
          font-weight: 700;
          white-space: nowrap;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }

        .badge-warning {
          background: #fef3c7;
          color: #713f12;
        }

        .badge-danger {
          background: #fee2e2;
          color: #7f1d1d;
        }

        .badge-error {
          background: #fca5a5;
          color: #7f1d1d;
        }

        .badge-default {
          background: #e5e7eb;
          color: #374151;
        }

        @media (max-width: 640px) {
          .threat-summary {
            padding: 0.5rem 0.8rem;
            gap: 0.6rem;
          }

          .threat-details {
            padding: 0.5rem 0.8rem 0.6rem calc(0.8rem + 1rem + 0.6rem);
          }

          .threat-name {
            font-size: 0.9rem;
          }
        }
      `}</style>
    </div>
  );
}
