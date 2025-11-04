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

      // Build component volatility analysis using VolatilityManager logic
      const volatileComponents = components
        .filter(c => c.hs_code && c.origin_country)
        .map(c => {
          const origin = normalizeCountry(c.origin_country);
          const dest = normalizeCountry(destination);

          // Check if this is a volatile combination
          const volatilityTier = getVolatilityTier(c.hs_code, origin, dest);

          return {
            hs_code: c.hs_code,
            origin_country: origin,
            destination: dest,
            volatility: volatilityTier,
            description: c.description || c.component_type || 'Component'
          };
        })
        .filter(c => c.volatility.tier <= 2); // Only Tier 1 (super volatile) and Tier 2 (volatile)

      console.log('🔍 [POLICYTIMELINE] Volatile components detected:', {
        total_components: components.length,
        volatile_count: volatileComponents.length,
        volatile_details: volatileComponents.map(c => ({
          hs_code: c.hs_code,
          origin: c.origin_country,
          tier: c.volatility.tier,
          reason: c.volatility.reason
        }))
      });

      if (volatileComponents.length === 0) {
        console.log('✅ [POLICYTIMELINE] No volatile components - all stable');
        setThreats([]);
        setLoading(false);
        return;
      }

      // Get affected countries from volatile components
      const affectedCountries = [...new Set(volatileComponents.map(c => c.origin_country))];

      console.log('🌍 [POLICYTIMELINE] Checking crisis_alerts for countries:', affectedCountries);

      // Query crisis_alerts table (REAL RSS-detected policies)
      const { data: crisisAlerts, error: alertsError } = await supabase
        .from('crisis_alerts')
        .select('id, title, alert_type, severity, affected_countries, impact_percentage, detection_source, created_at, description, source_url')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(20);

      if (alertsError) throw alertsError;

      console.log('📡 [POLICYTIMELINE] Crisis alerts fetched:', {
        total_alerts: crisisAlerts?.length || 0,
        sample: crisisAlerts?.slice(0, 3).map(a => ({ title: a.title, countries: a.affected_countries }))
      });

      // Filter alerts to show:
      // 1. Alerts matching affected countries
      // 2. Alerts with no countries specified (global/US trade policy)
      // 3. Alerts mentioning "tariff", "trade", "China", etc. in title
      const relevantAlerts = crisisAlerts?.filter(alert => {
        // Match 1: Country-specific alerts
        if (alert.affected_countries && alert.affected_countries.length > 0) {
          const hasMatchingCountry = alert.affected_countries.some(country =>
            affectedCountries.includes(normalizeCountry(country))
          );
          if (hasMatchingCountry) return true;
        }

        // Match 2: Global trade policy alerts (no specific country)
        if (!alert.affected_countries || alert.affected_countries.length === 0) {
          const tradeKeywords = ['tariff', 'trade', 'import', 'duty', 'section 301', 'section 232', 'usmca', 'customs'];
          const titleLower = (alert.title || '').toLowerCase();
          const hasTradeKeyword = tradeKeywords.some(keyword => titleLower.includes(keyword));

          // Also include if mentions China and we have Chinese components
          const mentionsChina = titleLower.includes('china') && affectedCountries.includes('CN');

          return hasTradeKeyword || mentionsChina;
        }

        return false;
      }) || [];

      console.log('✅ [POLICYTIMELINE] Relevant alerts filtered:', {
        relevant_count: relevantAlerts.length,
        alerts: relevantAlerts.map(a => ({ title: a.title, severity: a.severity, countries: a.affected_countries }))
      });

      // Map to threat format
      const mappedThreats = relevantAlerts.map(alert => ({
        id: alert.id,
        title: alert.title,
        date: alert.created_at,
        type: mapAlertTypeToStatus(alert.alert_type),
        severity: alert.severity,
        percentage: alert.impact_percentage,
        description: alert.description,
        source_url: alert.source_url,
        detection_source: alert.detection_source,
        source: 'crisis_alerts'
      }));

      // Add volatility warnings as synthetic "threats"
      volatileComponents.forEach((comp, index) => {
        if (comp.volatility.tier === 1) { // Super volatile only
          mappedThreats.push({
            id: `volatility-${index}`,
            title: `${comp.description} (${comp.origin_country} → ${comp.destination})`,
            date: new Date().toISOString(),
            type: 'volatility_warning',
            severity: 'high',
            percentage: null,
            description: comp.volatility.reason,
            policies: comp.volatility.policies,
            warning: comp.volatility.warning,
            source: 'volatility_manager'
          });
        }
      });

      // Sort by date (newest first)
      mappedThreats.sort((a, b) => new Date(b.date) - new Date(a.date));

      console.log('✅ [POLICYTIMELINE] Final threats with volatility warnings:', {
        total_threats: mappedThreats.length,
        crisis_alerts: relevantAlerts.length,
        volatility_warnings: mappedThreats.filter(t => t.source === 'volatility_manager').length
      });

      setThreats(mappedThreats);
    } catch (error) {
      console.error('❌ [POLICYTIMELINE] Error fetching policy threats:', error);
      setThreats([]);
    } finally {
      setLoading(false);
    }
  };

  // VolatilityManager logic (inline to avoid import issues in browser)
  const getVolatilityTier = (hsCode, origin, dest) => {
    const hsChapter = hsCode ? hsCode.replace(/\./g, '').substring(0, 2) : null;
    const hs4 = hsCode ? hsCode.replace(/\./g, '').substring(0, 4) : null;

    // TIER 1: Super Volatile (24h cache, bypass database)

    // 1. China → USA: Semiconductor/Electronics (HS 85)
    if (origin === 'CN' && dest === 'US' && hsChapter === '85') {
      return {
        tier: 1,
        volatility: 'super_volatile',
        reason: 'China semiconductors/electronics to USA - Section 301 + CHIPS Act restrictions (rates change monthly)',
        policies: ['Section 301 (volatile)', 'CHIPS Act', 'Reciprocal Tariffs', 'IEEPA'],
        warning: '⚠️ VOLATILE RATE: This tariff rate changes frequently. Using fresh AI research.'
      };
    }

    // 2. China → USA: Strategic goods
    const strategicHS = ['8541', '8542', '8507', '8504', '8703', '8708', '8544'];
    if (origin === 'CN' && dest === 'US' && strategicHS.includes(hs4)) {
      return {
        tier: 1,
        volatility: 'super_volatile',
        reason: 'China strategic goods to USA - Multiple overlapping tariffs (Section 301 + reciprocal + IEEPA)',
        policies: ['Section 301', 'Reciprocal Tariffs', 'IEEPA', 'Strategic Trade Controls'],
        warning: '⚠️ VOLATILE RATE: This tariff rate changes frequently.'
      };
    }

    // 3. Any → USA: Steel/Aluminum
    const metalChapters = ['72', '73', '76'];
    if (dest === 'US' && metalChapters.includes(hsChapter)) {
      return {
        tier: 1,
        volatility: 'super_volatile',
        reason: 'Steel/aluminum to USA - Section 232 rates and exemptions change by country/product',
        policies: ['Section 232', 'Country-specific exemptions', 'Reciprocal adjustments'],
        warning: '⚠️ VOLATILE RATE: Section 232 rates change frequently.'
      };
    }

    // 4. China → USA: Any product
    if (origin === 'CN' && dest === 'US') {
      return {
        tier: 1,
        volatility: 'super_volatile',
        reason: 'China to USA - Active trade policy environment with frequent tariff changes',
        policies: ['Section 301 (baseline)', 'Reciprocal Tariffs', 'IEEPA emergency powers'],
        warning: '⚠️ VOLATILE RATE: China tariffs change frequently.'
      };
    }

    // TIER 2: Volatile (7-day cache)

    // China → Canada/Mexico
    if (origin === 'CN' && (dest === 'CA' || dest === 'MX')) {
      return {
        tier: 2,
        volatility: 'volatile',
        reason: 'China to USMCA countries - Circumvention monitoring, rates may change',
        policies: ['Circumvention rules', 'Origin verification', 'Transshipment enforcement'],
        warning: '⚠️ Policy-sensitive rate. Verifying current tariff.'
      };
    }

    // Vietnam/Thailand/India/Indonesia/Malaysia → USA
    const emergingOrigins = ['VN', 'TH', 'IN', 'ID', 'MY'];
    if (emergingOrigins.includes(origin) && dest === 'US') {
      return {
        tier: 2,
        volatility: 'volatile',
        reason: 'Emerging Asia to USA - Potential reciprocal tariff targets',
        policies: ['Base MFN', 'Possible reciprocal tariffs', 'Trade monitoring'],
        warning: '⚠️ Policy-sensitive rate.'
      };
    }

    // TIER 3: Stable (90-day cache)
    return {
      tier: 3,
      volatility: 'stable',
      reason: 'Standard tariff rates (stable)',
      policies: ['Standard MFN', 'USMCA']
    };
  };

  const normalizeCountry = (country) => {
    if (!country) return null;
    const COUNTRY_MAP = {
      'China': 'CN', 'United States': 'US', 'USA': 'US', 'US': 'US',
      'Mexico': 'MX', 'MX': 'MX', 'Canada': 'CA', 'CA': 'CA',
      'Vietnam': 'VN', 'VN': 'VN', 'Thailand': 'TH', 'TH': 'TH',
      'India': 'IN', 'IN': 'IN', 'Indonesia': 'ID', 'ID': 'ID',
      'Malaysia': 'MY', 'MY': 'MY'
    };
    return COUNTRY_MAP[country] || country.toUpperCase().substring(0, 2);
  };

  const mapAlertTypeToStatus = (alertType) => {
    const typeMap = {
      'tariff_change': 'implemented',
      'tariff_announcement': 'announced',
      'policy_update': 'confirmed',
      'trade_dispute': 'announcement'
    };
    return typeMap[alertType] || 'announced';
  };

  if (loading) {
    return (
      <div className="policy-threats-card">
        <div className="threats-header">
          <h3 className="threats-title">⚠️ Policy Threats</h3>
        </div>
        <div className="loading">Checking for policy alerts...</div>
      </div>
    );
  }

  if (threats.length === 0) {
    console.log('✅ [POLICYTIMELINE] No threats found - component will not display');
    return null;
  }

  const getStatusBadge = (type) => {
    switch (type) {
      case 'announcement':
      case 'announced':
        return <span className="badge badge-warning">Announced</span>;
      case 'confirmed':
        return <span className="badge badge-danger">Confirmed</span>;
      case 'implemented':
        return <span className="badge badge-error">Active</span>;
      case 'volatility_warning':
        return <span className="badge badge-volatile">Volatile Rate</span>;
      default:
        return <span className="badge badge-default">{type}</span>;
    }
  };

  const getSeverityIcon = (severity) => {
    if (!severity) return '📍';
    const severityLower = severity.toLowerCase();
    if (severityLower.includes('high') || severityLower.includes('critical')) return '🔴';
    if (severityLower.includes('medium')) return '🟠';
    return '🟡';
  };

  return (
    <div className="policy-threats-card">
      <div className="threats-header">
        <h3 className="threats-title">⚠️ Tariff Policy Threats ({threats.length})</h3>
        <p className="threats-subtitle">Active policies affecting your volatile components</p>
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
                  {threat.detection_source && ` • ${threat.detection_source}`}
                </div>
              </div>

              <div className="expand-icon">{expandedId === threat.id ? '▼' : '▶'}</div>
            </div>

            {expandedId === threat.id && (
              <div className="threat-details">
                {threat.description && <div className="detail-item">{threat.description}</div>}
                {threat.percentage && <div className="detail-item"><strong>Rate Change:</strong> +{threat.percentage}%</div>}
                {threat.policies && (
                  <div className="detail-item">
                    <strong>Applicable Policies:</strong> {threat.policies.join(', ')}
                  </div>
                )}
                {threat.source_url && (
                  <div className="detail-item">
                    <a href={threat.source_url} target="_blank" rel="noopener noreferrer" className="source-link">
                      View Source →
                    </a>
                  </div>
                )}

                {threat.type === 'volatility_warning' && (
                  <div className="detail-alert warning">
                    ⚠️ {threat.warning || 'This component uses volatile tariff rates that change frequently. Verify current rates before shipment.'}
                  </div>
                )}
                {threat.type === 'announced' && threat.source === 'crisis_alerts' && (
                  <div className="detail-alert info">💡 Detected via RSS monitoring. Monitor for implementation updates.</div>
                )}
                {threat.type === 'confirmed' && <div className="detail-alert warning">⚠️ Confirmed policy change. Review impact on your supply chain.</div>}
                {threat.type === 'implemented' && <div className="detail-alert error">🚨 Policy is now active. Verify current tariff rates.</div>}
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

        .source-link {
          color: #2563eb;
          text-decoration: none;
          font-weight: 500;
        }

        .source-link:hover {
          text-decoration: underline;
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

        .badge-volatile {
          background: #fde68a;
          color: #92400e;
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
