/**
 * USMCA Intelligence Display Component
 * Shows rich personalized analysis from user's workflow
 * This is the PREMIUM content for Professional/Premium tier subscribers ($99-599/month)
 */

import React, { useState } from 'react';

export default function USMCAIntelligenceDisplay({ workflowIntelligence }) {
  const [expandedSections, setExpandedSections] = useState({
    recommendations: true, // Start expanded
    savings: false,
    compliance: false,
    strategic: false,
    risk: false
  });

  if (!workflowIntelligence) {
    return null;
  }

  const {
    recommendations = [],
    detailed_analysis = {},
    compliance_roadmap = {},
    risk_mitigation = {}
  } = workflowIntelligence;

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const CollapsibleSection = ({ title, icon, sectionKey, count, children }) => (
    <div className="card" style={{ marginBottom: '1rem' }}>
      <div
        onClick={() => toggleSection(sectionKey)}
        style={{
          cursor: 'pointer',
          padding: '1rem',
          backgroundColor: expandedSections[sectionKey] ? '#eff6ff' : '#f9fafb',
          borderBottom: expandedSections[sectionKey] ? '2px solid #3b82f6' : 'none',
          borderRadius: expandedSections[sectionKey] ? '8px 8px 0 0' : '8px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.5rem' }}>{icon}</span>
            <div>
              <h3 className="form-section-title" style={{ margin: 0, fontSize: '1.1rem' }}>
                {title}
              </h3>
              {count && (
                <p className="form-section-description" style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem' }}>
                  {count} {count === 1 ? 'item' : 'items'}
                </p>
              )}
            </div>
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#6b7280' }}>
            {expandedSections[sectionKey] ? '▼' : '▶'}
          </div>
        </div>
      </div>

      {expandedSections[sectionKey] && (
        <div style={{ padding: '1.5rem' }}>
          {children}
        </div>
      )}
    </div>
  );

  const ActionItem = ({ text, index }) => {
    // Parse emoji and category from text like "✅ IMMEDIATE: File USMCA..."
    const match = text.match(/^([^\s]+)\s+([A-Z\s]+):\s*(.+)$/);
    if (match) {
      const [, emoji, category, description] = match;
      return (
        <div className="alert alert-info" style={{ marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>{emoji}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 'bold', color: '#1e40af', marginBottom: '0.25rem' }}>
                {category}
              </div>
              <div className="text-body">{description}</div>
            </div>
          </div>
        </div>
      );
    }

    // Fallback for non-matching format
    return (
      <div className="alert alert-info" style={{ marginBottom: '0.75rem' }}>
        <div className="text-body">{text}</div>
      </div>
    );
  };

  return (
    <div style={{ marginTop: '2rem' }}>
      {/* Immediate Action Items */}
      {recommendations.length > 0 && (
        <CollapsibleSection
          title="Immediate Action Items"
          icon="🚀"
          sectionKey="recommendations"
          count={recommendations.length}
        >
          <p className="form-section-description" style={{ marginBottom: '1rem' }}>
            Prioritized recommendations based on your specific trade profile
          </p>
          {recommendations.map((rec, idx) => (
            <ActionItem key={idx} text={rec} index={idx} />
          ))}
        </CollapsibleSection>
      )}

      {/* Detailed Savings Analysis */}
      {detailed_analysis.savings_analysis && (
        <CollapsibleSection
          title="Component-by-Component Savings Breakdown"
          icon="💰"
          sectionKey="savings"
        >
          <div style={{
            background: '#f0fdf4',
            border: '2px solid #86efac',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1rem'
          }}>
            <pre style={{
              whiteSpace: 'pre-wrap',
              fontFamily: 'inherit',
              margin: 0,
              lineHeight: 1.6
            }}>
              {detailed_analysis.savings_analysis}
            </pre>
          </div>
        </CollapsibleSection>
      )}

      {/* Compliance Roadmap */}
      {(compliance_roadmap.immediate_actions?.length > 0 || compliance_roadmap.ongoing_requirements?.length > 0) && (
        <CollapsibleSection
          title="Compliance Roadmap"
          icon="📋"
          sectionKey="compliance"
          count={(compliance_roadmap.immediate_actions?.length || 0) + (compliance_roadmap.ongoing_requirements?.length || 0)}
        >
          {compliance_roadmap.immediate_actions?.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ margin: '0 0 0.75rem 0', color: '#dc2626' }}>🔥 Immediate Actions (Next 4 Weeks)</h4>
              <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                {compliance_roadmap.immediate_actions.map((action, idx) => (
                  <li key={idx} className="mb-2">{action}</li>
                ))}
              </ul>
            </div>
          )}

          {compliance_roadmap.ongoing_requirements?.length > 0 && (
            <div>
              <h4 style={{ margin: '0 0 0.75rem 0', color: '#2563eb' }}>🔄 Ongoing Requirements</h4>
              <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                {compliance_roadmap.ongoing_requirements.map((req, idx) => (
                  <li key={idx} style={{ marginBottom: '0.5rem' }}>{req}</li>
                ))}
              </ul>
            </div>
          )}
        </CollapsibleSection>
      )}


      {/* Risk Mitigation */}
      {(risk_mitigation.audit_triggers?.length > 0 || risk_mitigation.protection_strategies?.length > 0) && (
        <CollapsibleSection
          title="Audit Risk & Protection Strategies"
          icon="🛡️"
          sectionKey="risk"
          count={(risk_mitigation.audit_triggers?.length || 0) + (risk_mitigation.protection_strategies?.length || 0)}
        >
          {risk_mitigation.audit_triggers?.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ margin: '0 0 0.75rem 0', color: '#dc2626' }}>⚠️ Audit Triggers to Monitor</h4>
              <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                {risk_mitigation.audit_triggers.map((trigger, idx) => (
                  <li key={idx} style={{ marginBottom: '0.5rem' }}>{trigger}</li>
                ))}
              </ul>
            </div>
          )}

          {risk_mitigation.protection_strategies?.length > 0 && (
            <div>
              <h4 style={{ margin: '0 0 0.75rem 0', color: '#059669' }}>✅ Protection Strategies</h4>
              <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                {risk_mitigation.protection_strategies.map((strategy, idx) => (
                  <li key={idx} style={{ marginBottom: '0.5rem' }}>{strategy}</li>
                ))}
              </ul>
            </div>
          )}
        </CollapsibleSection>
      )}

    </div>
  );
}
