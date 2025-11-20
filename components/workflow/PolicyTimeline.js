'use client';

/**
 * POLICY TIMELINE - WORKFLOW RESULTS PAGE (Immediate Threats)
 *
 * PURPOSE: Show URGENT, ACTIONABLE threats for THIS specific workflow
 * SCOPE: ONLY critical/high severity alerts matching user's components
 * USE CASE: Results page showing immediate risks to current product analysis
 *
 * DISTINCTION from Alerts Dashboard (/api/get-crisis-alerts):
 * - Alerts Dashboard: Shows ALL active alerts for strategic planning
 * - PolicyTimeline: Shows ONLY critical/high alerts for THIS workflow
 *
 * FILTERING:
 * - Severity: CRITICAL and HIGH only (medium/low excluded)
 * - Matching: Filters to user's specific HS codes
 * - Focus: Immediate action required (not long-term planning)
 */

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
  const [sectionExpanded, setSectionExpanded] = useState(false); // Collapsed by default on mobile

  // Expand on desktop by default
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth > 768) {
      setSectionExpanded(true);
    }
  }, []);

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

      // ✅ FIXED (Nov 7): NO HARDCODED FILTERING - Check ALL components for alerts
      // Get ALL component countries and HS codes (not just "volatile" ones)
      const allComponents = components.filter(c => c.hs_code && c.origin_country);

      console.log('🔍 [POLICYTIMELINE] Checking ALL components for alerts:', {
        total_components: components.length,
        valid_components: allComponents.length,
        component_details: allComponents.map(c => ({
          description: c.description || c.component_type,
          hs_code: c.hs_code,
          origin: c.origin_country
        }))
      });

      // Get ALL unique countries from user's components
      const affectedCountries = [...new Set(allComponents.map(c => normalizeCountry(c.origin_country)))];

      console.log('🌍 [POLICYTIMELINE] Checking crisis_alerts for countries:', affectedCountries);

      // Query crisis_alerts table (REAL RSS-detected policies)
      // ✅ FETCH ALL HS CODES from user components for matching
      const allHSCodes = [...new Set(allComponents.map(c => c.hs_code).filter(Boolean))];

      // ✅ SCHEMA COMPATIBILITY: Query only fields that ACTUALLY exist in database
      // Database column names (verified Nov 8, 2025):
      // - severity (NOT severity_level)
      // - relevant_industries (NOT affected_industries)
      // - detection_source (NOT source_type)
      // - NO business_impact, keywords_matched, or crisis_score columns
      const { data: crisisAlerts, error: alertsError } = await supabase
        .from('crisis_alerts')
        .select('id, title, severity, affected_hs_codes, relevant_industries, affected_countries, created_at, description, source_url, detection_source, impact_percentage')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(50);

      if (alertsError) throw alertsError;

      console.log('📡 [POLICYTIMELINE] Crisis alerts fetched:', {
        total_alerts: crisisAlerts?.length || 0,
        user_hs_codes: allHSCodes,
        sample_alerts: crisisAlerts?.slice(0, 3).map(a => ({
          title: a.title,
          severity: a.severity,
          hs_codes: a.affected_hs_codes,
          industries: a.relevant_industries // Database has 'relevant_industries'
        }))
      });

      // ✅ SCHEMA NORMALIZATION: Map 'severity' (database field) to 'severity_level' (code expects this)
      const normalizedAlerts = crisisAlerts?.map(alert => ({
        ...alert,
        severity_level: alert.severity // Database has 'severity', code expects 'severity_level'
      })) || [];

      // ✅ AGE-BASED FILTERING: Keep alerts based on severity (prevent clutter)
      // CRITICAL/HIGH: 30 days, MEDIUM: 14 days, LOW: 7 days
      const now = new Date();
      const ageFilteredAlerts = normalizedAlerts.filter(alert => {
        const alertAge = (now - new Date(alert.created_at)) / (1000 * 60 * 60 * 24); // days
        const severity = (alert.severity || '').toUpperCase();

        if (severity === 'CRITICAL' || severity === 'HIGH') {
          return alertAge <= 30; // Keep for 30 days
        } else if (severity === 'MEDIUM') {
          return alertAge <= 14; // Keep for 14 days
        } else {
          return alertAge <= 7; // LOW/unknown: 7 days
        }
      });

      console.log('📅 [POLICYTIMELINE] Age-filtered alerts:', {
        before: normalizedAlerts.length,
        after: ageFilteredAlerts.length,
        removed: normalizedAlerts.length - ageFilteredAlerts.length
      });

      // ✅ SEVERITY FILTER: Only show critical/high severity (filter in JS for schema compatibility)
      const highSeverityAlerts = ageFilteredAlerts.filter(alert => {
        const severity = (alert.severity_level || '').toLowerCase();
        return severity === 'critical' || severity === 'high';
      });

      console.log('🎯 [POLICYTIMELINE] After severity filter:', {
        before: normalizedAlerts.length,
        after: highSeverityAlerts.length,
        filtered_severities: highSeverityAlerts.map(a => a.severity_level)
      });

      // ✅ IMMEDIATE THREATS ONLY: Filter to alerts affecting THIS workflow
      // ONLY show alerts that have DIRECT relevance to user's components
      const relevantAlerts = highSeverityAlerts?.filter(alert => {
        // ✅ STRICT FILTER (Nov 20 #3): Reject generic RSS news
        // Real tariff alerts MUST have HS codes OR industries (countries alone = generic news)
        const hasHSCodes = alert.affected_hs_codes && alert.affected_hs_codes.length > 0;
        const hasIndustries = alert.relevant_industries && alert.relevant_industries.length > 0;

        if (!hasHSCodes && !hasIndustries) {
          console.log(`❌ [POLICYTIMELINE] Skipping generic news: "${alert.title}" (no HS codes AND no industries - just country names)`);
          return false;
        }

        let matched = false;

        // ✅ CRITERION 1: HS Code match (alert specifically affects user's components)
        if (hasHSCodes) {
          const normalizedAlertHS = alert.affected_hs_codes.map(hs => (hs || '').replace(/\./g, '').substring(0, 6));
          const normalizedUserHS = allHSCodes.map(hs => (hs || '').replace(/\./g, '').substring(0, 6));
          const hasHSMatch = normalizedAlertHS.some(alertHS => normalizedUserHS.includes(alertHS));
          if (hasHSMatch) {
            console.log(`✅ [POLICYTIMELINE] HS code match: "${alert.title}" matches user HS codes`);
            matched = true;
          }
        }

        // ✅ CRITERION 2: Industry + Country match (e.g., Yazaki automotive alert)
        // Must have BOTH industry relevance AND country match
        if (!matched && hasIndustries && alert.affected_countries?.length > 0) {
          const alertCountries = alert.affected_countries.map(c => normalizeCountry(c));
          const hasCountryMatch = alertCountries.some(alertCountry => affectedCountries.includes(alertCountry));
          if (hasCountryMatch) {
            console.log(`✅ [POLICYTIMELINE] Industry + Country match: "${alert.title}" affects user's supply chain (${alert.relevant_industries.join(', ')} in ${alertCountries.join(', ')})`);
            matched = true;
          }
        }

        if (!matched) {
          console.log(`❌ [POLICYTIMELINE] No match: "${alert.title}" does not affect user's components`);
        }

        return matched;
      }) || [];

      console.log(`🤖 PolicyTimeline alert matching: ${relevantAlerts.length}/${highSeverityAlerts.length} high/critical alerts matched user components (${crisisAlerts?.length || 0} total alerts in DB)`);

      console.log('✅ [POLICYTIMELINE] Relevant alerts filtered:', {
        relevant_count: relevantAlerts.length,
        alerts: relevantAlerts.map(a => ({
          title: a.title,
          severity: a.severity_level, // Normalized from 'severity'
          hs_codes: a.affected_hs_codes,
          industries: a.relevant_industries // Database has 'relevant_industries'
        }))
      });

      // Map to threat format (using ACTUAL crisis_alerts database schema)
      const mappedThreats = relevantAlerts.map(alert => ({
        id: alert.id,
        title: alert.title,
        date: alert.created_at,
        type: 'announced', // All RSS alerts are announcements
        severity: alert.severity_level, // Normalized from 'severity'
        crisis_score: null, // Column doesn't exist in database
        description: alert.description,
        source_url: alert.source_url,
        detection_source: alert.detection_source, // Database has 'detection_source' not 'source_type'
        keywords: [], // Column doesn't exist (keywords_matched)
        percentage: alert.impact_percentage,
        source: 'crisis_alerts'
      }));

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

  // ✅ ALWAYS show the component, even with 0 threats (user wants to see empty state)
  // Removed: if (threats.length === 0) return null;

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

  const handleToggleSection = () => {
    const wasExpanded = sectionExpanded;
    setSectionExpanded(!sectionExpanded);

    // If collapsing, scroll to next section after a brief delay (let animation start)
    if (wasExpanded) {
      setTimeout(() => {
        const nextSection = document.querySelector('.policy-threats-card')?.nextElementSibling;
        if (nextSection) {
          const elementTop = nextSection.getBoundingClientRect().top;
          const offset = 100; // Keep some spacing from top

          window.scrollTo({
            top: window.pageYOffset + elementTop - offset,
            behavior: 'smooth'
          });
        }
      }, 100);
    }
  };

  return (
    <div className="policy-threats-card">
      <div
        className="threats-header"
        onClick={handleToggleSection}
        style={{ cursor: 'pointer' }}
      >
        <h3 className="threats-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{
            display: 'inline-block',
            transition: 'transform 0.2s',
            transform: sectionExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
            fontSize: '0.875rem'
          }}>
            ▶
          </span>
          ⚠️ Tariff Policy Threats ({threats.length})
        </h3>
        <p className="threats-subtitle">Active policies affecting your volatile components</p>
      </div>

      {sectionExpanded && (
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
      )}

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
