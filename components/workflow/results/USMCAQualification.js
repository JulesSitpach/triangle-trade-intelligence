/**
 * USMCAQualification - Component Analysis
 * Shows component breakdown and regional content analysis
 * NO duplicate qualification status (shown in hero section)
 *
 * ⚠️ EXCEPTION TO NO-INLINE-STYLES RULE:
 * This component uses ~500 lines of inline styles for highly customized UI:
 * - Tooltip positioning (dynamic, can't use static CSS)
 * - Collapsible tariff explanations with animations
 * - Color-coded warning boxes (Section 301/232 with specific amber/red/green schemes)
 * - Mobile vs Desktop conditional layouts
 * These are production-working, component-specific styles. Do NOT refactor without user approval.
 * All other components must use classes from styles/globals.css.
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

// CRITICAL: Safe tariff rate display - distinguishes null (pending) from 0 (duty-free)
const formatTariffRate = (rate) => {
  if (rate === null || rate === undefined) {
    return { text: 'Pending', color: '#f59e0b', title: 'Tariff verification in progress' };
  }
  if (rate === 0) {
    return { text: 'Free', color: '#059669', title: 'Duty-free (0.0%)' };
  }
  return { text: `${(rate * 100).toFixed(1)}%`, color: '#dc2626', title: `${(rate * 100).toFixed(1)}% tariff rate` };
};

// Confidence badge for tariff lookup quality (inline styles to match component pattern)
const ConfidenceBadge = ({ confidence, source, size = 'sm' }) => {
  if (!confidence || confidence === undefined) return null;

  const getStyle = () => {
    if (confidence >= 95) {
      return { bg: '#d1fae5', text: '#065f46', border: '#6ee7b7', label: 'Verified', icon: '✓' };
    }
    if (confidence >= 80) {
      return { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd', label: 'Category', icon: '≈' };
    }
    if (confidence >= 65) {
      return { bg: '#fef3c7', text: '#92400e', border: '#fcd34d', label: 'Heading', icon: '~' };
    }
    if (confidence >= 40) {
      return { bg: '#fed7aa', text: '#9a3412', border: '#fdba74', label: 'Estimate', icon: '?' };
    }
    return { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5', label: 'Low', icon: '!' };
  };

  const style = getStyle();
  const padding = size === 'sm' ? '0.125rem 0.375rem' : '0.25rem 0.5rem';
  const fontSize = size === 'sm' ? '0.6875rem' : '0.75rem';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem',
        padding,
        fontSize,
        fontWeight: '600',
        borderRadius: '9999px',
        backgroundColor: style.bg,
        color: style.text,
        border: `1px solid ${style.border}`,
        whiteSpace: 'nowrap'
      }}
      title={`${confidence}% confidence - ${source || 'AI lookup'}`}
    >
      <span style={{ fontWeight: 'bold', fontSize: size === 'sm' ? '0.625rem' : '0.6875rem' }}>{style.icon}</span>
      <span>{confidence}%</span>
    </span>
  );
};

// EDUCATIONAL: Simple tooltip component for trade terminology
const Tooltip = ({ text, children }) => {
  const [show, setShow] = useState(false);

  return (
    <span className="relative" style={{ display: 'inline-block' }}>
      <span
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        style={{ borderBottom: '1px dotted #6b7280', cursor: 'help' }}
      >
        {children}
      </span>
      {show && (
        <span className="absolute" style={{
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '0.5rem',
          backgroundColor: '#1f2937',
          color: '#ffffff',
          fontSize: '0.75rem',
          borderRadius: '4px',
          whiteSpace: 'normal',
          width: '200px',
          zIndex: 1000,
          marginBottom: '0.5rem',
          lineHeight: '1.4'
        }}>
          {text}
          <span className="absolute" style={{
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '5px solid transparent',
            borderRight: '5px solid transparent',
            borderTop: '5px solid #1f2937'
          }} />
        </span>
      )}
    </span>
  );
};

export default function USMCAQualification({ results }) {
  // DEBUG: Only log in development mode (removed noisy production logs)
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 USMCAQualification rendered:', {
      has_usmca: !!results?.usmca,
      qualified: results?.usmca?.qualified,
      component_count: results?.component_origins?.length || results?.components?.length || 0
    });
  }
  const [expandedComponents, setExpandedComponents] = useState({});
  const [showTariffExplanation, setShowTariffExplanation] = useState(false);
  const [showSection232Explanation, setShowSection232Explanation] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleToggleTariffExplanation = () => {
    const wasExpanded = showTariffExplanation;
    setShowTariffExplanation(!showTariffExplanation);

    // If collapsing, scroll to next section after a brief delay
    if (wasExpanded) {
      setTimeout(() => {
        // Find the button element and its parent container
        const tariffButton = document.querySelector('button');
        if (tariffButton) {
          const container = tariffButton.closest('.card-content') || tariffButton.closest('div');
          const nextSection = container?.nextElementSibling;
          if (nextSection) {
            const elementTop = nextSection.getBoundingClientRect().top;
            const offset = 100;

            window.scrollTo({
              top: window.pageYOffset + elementTop - offset,
              behavior: 'smooth'
            });
          }
        }
      }, 100);
    }
  };

  const handleToggleSection232Explanation = () => {
    setShowSection232Explanation(!showSection232Explanation);
  };

  if (!results?.usmca) return null;

  const { qualified, rule, reason, documentation_required } = results.usmca;

  const toggleComponentDetails = (index) => {
    setExpandedComponents(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Extract gap analysis data for NOT QUALIFIED products
  const extractGapAnalysis = () => {
    console.log('🔍 Gap Analysis Debug:', { qualified, results });

    // Don't show for qualified products
    if (qualified) return null;

    const currentContent = results.usmca.north_american_content || 0;
    const requiredThreshold = results.usmca.threshold_applied || results.usmca.threshold_required || 62.5;
    const gap = requiredThreshold - currentContent;

    console.log('📊 Threshold Data:', {
      currentContent,
      requiredThreshold,
      gap,
      source: 'API response (config file)'
    });

    if (gap <= 0) return null;

    const components = results.usmca.component_breakdown || [];
    const nonUsmcaComponents = components.filter(c =>
      !c.is_usmca_member && c.value_percentage > 0
    ).sort((a, b) => b.value_percentage - a.value_percentage);

    const targetComponent = nonUsmcaComponents[0];
    if (!targetComponent) return null;

    // Calculate potential savings from trade volume and gap
    const tradeVolume = results.company?.trade_volume;
    if (!tradeVolume) {
      console.error('❌ [FORM SCHEMA] Missing company.trade_volume in USMCAQualification gap analysis (line 102)');
      return null;
    }

    // CRITICAL FIX: NO FALLBACK for MFN rate - must come from AI/database
    const avgTariffRate = results.product?.mfn_rate;
    if (!avgTariffRate) {
      console.error('❌ Missing product.mfn_rate - gap analysis requires tariff data from API');
      return null; // Don't show gap analysis without actual tariff rate
    }

    // If they close the gap, calculate savings on the additional qualifying percentage
    const potentialSavings = tradeVolume > 0 && avgTariffRate > 0
      ? Math.round((tradeVolume * (gap / 100) * avgTariffRate))
      : results.savings?.annual_savings || 0;

    return {
      gap,
      currentContent,
      requiredThreshold,
      targetComponent,
      potentialSavings,
      estimatedTimeline: gap > 20 ? '6-12 months' : '3-6 months'
    };
  };

  const gapAnalysis = extractGapAnalysis();

  // Check if we should show tariff explanation (ANY component with significant tariffs)
  const hasHighTariffComponents = results.usmca.component_breakdown?.some(c =>
    c.total_rate > 0.10 || c.section_301 > 0 || c.section_232 > 0 // 10%+ or has policy tariffs
  );

  // ✅ NEW (Nov 21, 2025): Separate check for Section 232 (applies to ALL countries)
  const hasSection232Components = (results.component_origins || results.components || []).some(c =>
    c.section_232 !== null && c.section_232 !== undefined && c.section_232 > 0
  );

  return (
    <div className="card-content">
      {/* Tariff Explanation for Components with Policy Tariffs */}
      {hasHighTariffComponents && (() => {
        // Find component with highest tariff for title
        const highTariffComponent = (results.component_origins || results.components || [])
          .filter(c => c.total_rate > 0.10 || c.section_301 > 0 || c.section_232 > 0)
          .sort((a, b) => (b.total_rate || 0) - (a.total_rate || 0))[0];

        const componentCountry = highTariffComponent?.origin_country || 'CN';
        const countryNames = { 'CN': 'China', 'CA': 'Canada', 'MX': 'Mexico', 'US': 'United States' };
        const countryName = countryNames[componentCountry] || componentCountry;

        return (
          <div style={{ marginBottom: '1.5rem' }}>
            <button
              onClick={handleToggleTariffExplanation}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                backgroundColor: '#fef3c7',
                border: '1px solid #f59e0b',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#92400e',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s'
              }}
            >
              <span style={{
                display: 'inline-block',
                transition: 'transform 0.2s',
                transform: showTariffExplanation ? 'rotate(90deg)' : 'rotate(0deg)',
                fontSize: '0.75rem'
              }}>
                ▶
              </span>
              <span>💡 Understanding {countryName} Tariff Rates</span>
            </button>

          {showTariffExplanation && (
            <div style={{
              marginTop: '0.75rem',
              padding: '1.25rem',
              backgroundColor: '#fffbeb',
              border: '1px solid #fbbf24',
              borderRadius: '6px',
              fontSize: '0.875rem',
              lineHeight: '1.7'
            }}>
              {/* ✅ DYNAMIC: Show actual AI-calculated rates for any high-tariff component */}
              {(() => {
                // Use the same high-tariff component from title
                const targetComponent = highTariffComponent;

                if (!targetComponent) return null;

                // ✅ CRITICAL FIX (Nov 14): Preserve null vs 0 distinction for Section 301
                const section301 = targetComponent.section_301 !== null && targetComponent.section_301 !== undefined
                  ? parseFloat(targetComponent.section_301)
                  : null;
                // ✅ FIX (Nov 21, 2025): Add Section 232 to tariff breakdown
                const section232 = targetComponent.section_232 !== null && targetComponent.section_232 !== undefined
                  ? parseFloat(targetComponent.section_232)
                  : null;
                const reciprocal = targetComponent.ieepa_reciprocal !== null && targetComponent.ieepa_reciprocal !== undefined
                  ? parseFloat(targetComponent.ieepa_reciprocal)
                  : null;
                const baseMfn = targetComponent.base_mfn_rate !== null && targetComponent.base_mfn_rate !== undefined
                  ? parseFloat(targetComponent.base_mfn_rate)
                  : (targetComponent.mfn_rate !== null && targetComponent.mfn_rate !== undefined ? parseFloat(targetComponent.mfn_rate) : null);
                // ✅ FIX (Nov 21, 2025): Include Section 232 in total rate calculation
                const totalRate = targetComponent.total_rate !== null && targetComponent.total_rate !== undefined
                  ? parseFloat(targetComponent.total_rate)
                  : (baseMfn !== null && section301 !== null && reciprocal !== null && section232 !== null
                      ? baseMfn + section301 + section232 + reciprocal
                      : null);
                const verifiedDate = targetComponent.verified_date || targetComponent.last_verified;
                const expiresAt = targetComponent.expires_at || targetComponent.cache_expires_at;
                const hsCode = targetComponent.hs_code || 'pending';

                return (
                  <>
                    {/* ✅ FIXED (Nov 21): Dynamic Base Rate */}
                    <div style={{ marginBottom: '1rem' }}>
                      <strong style={{ display: 'block', marginBottom: '0.5rem', color: '#92400e', fontSize: '0.9375rem' }}>
                        Base Rate: {baseMfn !== null ? `${(baseMfn * 100).toFixed(1)}%` : '⏳ Pending verification'}
                      </strong>
                      <p style={{ margin: 0, color: '#78350f' }}>
                        {componentCountry === 'CN'
                          ? `China is a WTO member (since 2001), so your product (HS code ${hsCode}) pays the standard MFN base tariff rate under normal trade relations.`
                          : `${countryName} exports (HS code ${hsCode}) pay the standard MFN base tariff rate under normal trade relations.`}
                      </p>
                    </div>

                    {section301 > 0 && (
                      <div style={{ marginBottom: '1rem' }}>
                        <strong style={{ display: 'block', marginBottom: '0.5rem', color: section301 === null ? '#f59e0b' : '#92400e', fontSize: '0.9375rem' }}>
                          Section 301 Tariff: {section301 !== null ? `+${(section301 * 100).toFixed(1)}%` : '⏳ Pending verification'}
                          {section301 !== null && verifiedDate && <span style={{ color: '#78350f', fontSize: '0.75rem', marginLeft: '0.5rem' }}>(verified {new Date(verifiedDate).toLocaleDateString()})</span>}
                        </strong>
                        <p style={{ margin: 0, color: section301 === null ? '#f59e0b' : '#78350f' }}>
                          {section301 !== null
                            ? `Additional tariffs on ${countryName} imports for your specific HS code. This rate is AI-calculated based on current USTR lists.`
                            : 'Section 301 rate verification in progress - database lookup required.'}
                        </p>
                      </div>
                    )}

                    {reciprocal !== null && reciprocal > 0 && (
                      <div style={{ marginBottom: '1rem' }}>
                        <strong style={{ display: 'block', marginBottom: '0.5rem', color: '#92400e', fontSize: '0.9375rem' }}>
                          Reciprocal Tariffs: +{(reciprocal * 100).toFixed(1)}%
                        </strong>
                        <p style={{ margin: 0, color: '#78350f' }}>
                          Additional tariffs on specific {countryName} products. Can change with 30-day notice.
                        </p>
                      </div>
                    )}

                    <div style={{
                      padding: '0.75rem',
                      backgroundColor: '#fef3c7',
                      borderRadius: '4px',
                      border: '1px solid #f59e0b',
                      marginBottom: '1rem'
                    }}>
                      <strong style={{ color: '#92400e', fontSize: '0.9375rem' }}>
                        Total Current Rate: {(totalRate * 100).toFixed(1)}%
                      </strong>
                      <p style={{ margin: '0.5rem 0 0 0', color: '#78350f', fontSize: '0.8125rem' }}>
                        Rates stack: Base ({(baseMfn * 100).toFixed(1)}%) + Section 301 ({(section301 * 100).toFixed(1)}%) {section232 > 0 ? `+ Section 232 (${(section232 * 100).toFixed(1)}%)` : ''} {reciprocal > 0 ? `+ Reciprocal (${(reciprocal * 100).toFixed(1)}%)` : ''} = {(totalRate * 100).toFixed(1)}% total
                      </p>
                      {expiresAt && new Date(expiresAt) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) && (
                        <p style={{ margin: '0.5rem 0 0 0', color: '#dc2626', fontSize: '0.75rem', fontWeight: 'bold' }}>
                          ⚠️ Rate expires {new Date(expiresAt).toLocaleDateString()} - reverify before shipment
                        </p>
                      )}
                    </div>

                    {(section301 > 0 || reciprocal > 0) && (
                      <div style={{
                        padding: '0.75rem',
                        backgroundColor: '#fef3c7',
                        borderRadius: '4px',
                        border: '1px solid #dc2626',
                        marginBottom: '1rem'
                      }}>
                        <strong style={{ color: '#7f1d1d' }}>⚠️ Rates Change Frequently</strong>
                        <p style={{ margin: '0.5rem 0 0 0', color: '#991b1b', fontSize: '0.8125rem' }}>
                          {componentCountry === 'CN'
                            ? 'China tariffs are volatile. Section 301 and reciprocal rates can change monthly with policy announcements.'
                            : `Tariffs on ${countryName} imports can change with policy announcements.`} Always verify current rates before shipment.
                        </p>
                      </div>
                    )}

                    <div style={{
                      padding: '0.75rem',
                      backgroundColor: '#d1fae5',
                      borderRadius: '4px',
                      border: '1px solid #059669'
                    }}>
                      <strong style={{ color: '#065f46' }}>
                        {['MX', 'CA'].includes(results.company?.manufacturing_location)
                          ? `💰 Your ${results.company?.manufacturing_location === 'MX' ? 'Mexico' : 'Canada'} Assembly ELIMINATES ${(totalRate * 100).toFixed(1)}% Tariffs on ${countryName} Components`
                          : `💰 Nearshoring to USMCA WOULD Eliminate ${(totalRate * 100).toFixed(1)}% Tariffs on ${countryName} Components`}
                      </strong>
                      <p style={{ margin: '0.5rem 0 0 0', color: '#047857', fontSize: '0.8125rem' }}>
                        {(() => {
                          // Build dynamic tariff breakdown (matches line 379 formula)
                          const parts = [];
                          if (baseMfn > 0) parts.push(`${(baseMfn * 100).toFixed(1)}% base`);
                          if (section301 > 0) parts.push(`${(section301 * 100).toFixed(1)}% Section 301`);
                          if (section232 > 0) parts.push(`${(section232 * 100).toFixed(1)}% Section 232`);
                          if (reciprocal > 0) parts.push(`${(reciprocal * 100).toFixed(1)}% reciprocal`);
                          const tariffBreakdown = parts.join(' + ');

                          // Build list of eliminated tariffs
                          const eliminated = [];
                          if (baseMfn > 0) eliminated.push('base rate');
                          if (section301 > 0) eliminated.push('Section 301');
                          if (section232 > 0) eliminated.push('Section 232');
                          if (reciprocal > 0) eliminated.push('reciprocal tariffs');
                          const eliminatedList = eliminated.join(', ').replace(/, ([^,]*)$/, ', AND $1');

                          return ['MX', 'CA'].includes(results.company?.manufacturing_location) ? (
                            <>
                              <strong>Before assembly in {results.company?.manufacturing_location}:</strong> Would pay {tariffBreakdown} = {((totalRate || 0) * 100).toFixed(1)}% total<br/>
                              <strong>Your current strategy:</strong> Assembling in {results.company?.manufacturing_location} = 0% total duty on finished product. Your strategy ELIMINATES {eliminatedList}.
                            </>
                          ) : (
                            <>
                              <strong>Currently:</strong> Paying {tariffBreakdown} = {((totalRate || 0) * 100).toFixed(1)}% total<br/>
                              <strong>If switched to Mexico/Canada:</strong> Would pay 0% total - eliminates {eliminatedList}. See &ldquo;Potential&rdquo; in Annual Savings column.
                            </>
                          );
                        })()}
                      </p>
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </div>
      );
    })()}

      {/* ✅ NEW (Nov 21, 2025): Section 232 Steel/Aluminum Tariff Explanation (Separate from China) */}
      {hasSection232Components && (
        <div style={{ marginBottom: '1.5rem' }}>
          <button
            onClick={handleToggleSection232Explanation}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              backgroundColor: '#fee2e2',
              border: '1px solid #dc2626',
              borderRadius: '6px',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#991b1b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s'
            }}
          >
            <span style={{
              display: 'inline-block',
              transition: 'transform 0.2s',
              transform: showSection232Explanation ? 'rotate(90deg)' : 'rotate(0deg)',
              fontSize: '0.75rem'
            }}>
              ▶
            </span>
            <span>💡 Understanding Section 232 Steel/Aluminum Tariff</span>
          </button>

          {showSection232Explanation && (
            <div style={{
              marginTop: '0.75rem',
              padding: '1.25rem',
              backgroundColor: '#fef2f2',
              border: '1px solid #fca5a5',
              borderRadius: '6px',
              fontSize: '0.875rem',
              lineHeight: '1.7'
            }}>
              {(() => {
                // Find ALL components with Section 232 (ANY country)
                const section232Components = (results.component_origins || results.components || []).filter(c =>
                  c.section_232 !== null && c.section_232 !== undefined && c.section_232 > 0
                );

                if (section232Components.length === 0) return null;

                // Separate US vs non-US components
                const usComponents = section232Components.filter(c => c.origin_country === 'US');
                const nonUSComponents = section232Components.filter(c => c.origin_country !== 'US');

                return (
                  <>
                    <div style={{ marginBottom: '1rem' }}>
                      <strong style={{ display: 'block', marginBottom: '0.5rem', color: '#991b1b', fontSize: '0.9375rem' }}>
                        Section 232 Steel/Aluminum Tariff Overview
                      </strong>
                      <p style={{ margin: 0, color: '#7f1d1d' }}>
                        Additional tariffs on steel and aluminum products from <strong>ALL countries</strong> (including China, Mexico, Canada, US). Applies to HS codes in chapters 72, 73, 76, 83, 84, 85, 87, 94.
                      </p>
                    </div>

                    {/* US Components - Can be exempt if properly documented */}
                    {usComponents.length > 0 && (
                      <div style={{
                        padding: '0.75rem',
                        backgroundColor: '#fef3c7',
                        borderRadius: '4px',
                        border: '1px solid #fcd34d',
                        marginBottom: '1rem'
                      }}>
                        <strong style={{ color: '#78350f', fontSize: '0.9375rem' }}>
                          ✅ US Components - Can Be EXEMPT (0% tariff)
                        </strong>
                        {usComponents.map((comp, idx) => (
                          <div key={idx} style={{ marginTop: '0.5rem' }}>
                            <p style={{ margin: '0.25rem 0', color: '#78350f', fontSize: '0.8125rem' }}>
                              • <strong>{comp.description || comp.component_name}</strong> from {comp.origin_country}
                            </p>
                            <p style={{ margin: '0.25rem 0 0 0.75rem', color: '#78350f', fontSize: '0.75rem', fontStyle: 'italic' }}>
                              If made from <strong>aluminum exclusively smelted and cast in the United States</strong>, or <strong>steel exclusively melted and poured in the United States</strong>, it is EXEMPT from Section 232.
                            </p>
                            <p style={{ margin: '0.25rem 0 0 0.75rem', color: '#78350f', fontSize: '0.75rem', fontWeight: 'bold' }}>
                              ✅ ACTION: Verify with your supplier{comp.material_notes ? ` (${comp.material_notes})` : ''} whether the steel/aluminum is US-smelted/melted. If yes, provide documentation to claim 0% tariff.
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Non-US Components - Cannot be exempt */}
                    {nonUSComponents.length > 0 && (
                      <div style={{
                        padding: '0.75rem',
                        backgroundColor: '#fee2e2',
                        borderRadius: '4px',
                        border: '1px solid #fca5a5',
                        marginBottom: '1rem'
                      }}>
                        <strong style={{ color: '#991b1b', fontSize: '0.9375rem' }}>
                          ❌ Non-US Components - NO Exemption Available
                        </strong>
                        {nonUSComponents.map((comp, idx) => {
                          const section232 = parseFloat(comp.section_232);
                          return (
                            <div key={idx} style={{ marginTop: '0.5rem' }}>
                              <p style={{ margin: '0.25rem 0', color: '#7f1d1d', fontSize: '0.8125rem' }}>
                                • <strong>{comp.description || comp.component_name}</strong> from {comp.origin_country}: <strong>{(section232 * 100).toFixed(1)}% tariff</strong>
                              </p>
                              <p style={{ margin: '0.25rem 0 0 0.75rem', color: '#7f1d1d', fontSize: '0.75rem' }}>
                                Section 232 applies to all steel/aluminum imports from {comp.origin_country}. No exemption available for non-US sourcing.
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {results.company?.manufacturing_location === 'MX' && results.company?.destination_country === 'US' && (
                      <div style={{
                        padding: '0.75rem',
                        backgroundColor: '#d1fae5',
                        borderRadius: '4px',
                        border: '1px solid #059669',
                        marginBottom: '1rem'
                      }}>
                        <strong style={{ color: '#065f46', fontSize: '0.9375rem' }}>
                          ✅ Your Mexico Assembly Strategy BYPASSES Section 232 on Finished Product
                        </strong>
                        <p style={{ margin: '0.5rem 0 0 0', color: '#047857', fontSize: '0.8125rem' }}>
                          • <strong>Components imported TO Mexico:</strong> Section 232 cost incurred in Mexico<br/>
                          • <strong>Finished product FROM Mexico TO US:</strong> 0% USMCA (Section 232 bypassed on finished assembly)
                        </p>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* Component Breakdown Table */}
      {results.usmca.component_breakdown && results.usmca.component_breakdown.length > 0 && (
        <>
          {/* MOBILE: Card Layout */}
          {isMobile && (
            <div className="element-spacing">
              {results.usmca.component_breakdown.map((component, index) => {
                const baseMfnRate = component.base_mfn_rate ?? component.mfn_rate ?? null;
                const section301 = component.section_301 ?? null;
                const section232 = component.section_232 ?? null;
                const totalAppliedRate = component.total_rate ?? (baseMfnRate !== null && section301 !== null && section232 !== null ? baseMfnRate + section301 + section232 : null);
                const isUSMCAOrigin = ['US', 'CA', 'MX'].includes(component.origin_country);
                const displaySavings = isUSMCAOrigin ? (component.current_annual_savings || 0) : (component.potential_annual_savings || 0);

                return (
                  <div key={index} style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '1rem',
                    marginBottom: '0.75rem',
                    backgroundColor: '#ffffff'
                  }}>
                    {/* Component Name + Origin */}
                    <div style={{ marginBottom: '0.75rem' }}>
                      <div style={{ fontWeight: '600', color: '#1f2937', fontSize: '0.95rem', marginBottom: '0.25rem' }}>
                        {component.description || ('Component ' + (index + 1))}
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Origin: <strong>{component.origin_country}</strong></span>
                        <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Value: <strong>{component.value_percentage}%</strong></span>
                        {component.volatility_tier && component.volatility_tier <= 2 && (
                          <span style={{
                            fontSize: '0.7rem',
                            fontWeight: '600',
                            padding: '0.125rem 0.5rem',
                            borderRadius: '9999px',
                            backgroundColor: component.volatility_tier === 1 ? '#fef3c7' : '#dbeafe',
                            color: component.volatility_tier === 1 ? '#92400e' : '#1e40af'
                          }}>
                            Volatile
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Tariff Rates Grid */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '0.5rem',
                      fontSize: '0.8125rem',
                      marginBottom: '0.75rem'
                    }}>
                      <div>
                        <div style={{ color: '#6b7280', fontSize: '0.75rem' }}>Total Rate</div>
                        <div style={{ fontWeight: '600', color: '#1f2937' }}>
                          {totalAppliedRate !== null ? `${(totalAppliedRate * 100).toFixed(1)}%` : 'N/A'}
                        </div>
                        {/* ✅ NEW (Nov 20, 2025): Confidence badge for tariff lookup quality */}
                        {component.lookup_confidence && (
                          <div style={{ marginTop: '0.25rem' }}>
                            <ConfidenceBadge
                              confidence={component.lookup_confidence}
                              source={component.lookup_source}
                              size="sm"
                            />
                          </div>
                        )}
                      </div>
                      <div>
                        <div style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                          {isUSMCAOrigin ? 'Current Savings' : 'Potential Savings'}
                        </div>
                        <div style={{
                          fontWeight: '600',
                          color: displaySavings > 0 ? (isUSMCAOrigin ? '#059669' : '#2563eb') : '#6b7280'
                        }}>
                          {displaySavings > 0 ? `$${displaySavings.toLocaleString()}/yr` : '$0'}
                        </div>
                      </div>
                    </div>

                    {/* Expand button for details */}
                    {(component.ai_reasoning || component.alternative_codes || component.confidence) && (
                      <button
                        onClick={() => toggleComponentDetails(index)}
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          fontSize: '0.8125rem',
                          fontWeight: '500',
                          color: '#374151',
                          backgroundColor: '#f3f4f6',
                          border: '1px solid #e5e7eb',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        {expandedComponents[index] ? '▼ Hide Details' : '▶ Show AI Details'}
                      </button>
                    )}

                    {/* Expanded Details */}
                    {expandedComponents[index] && (
                      <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #e5e7eb', fontSize: '0.8125rem' }}>
                        {component.confidence && (
                          <div style={{ marginBottom: '0.5rem' }}>
                            <strong>AI Confidence:</strong> {component.confidence}%
                          </div>
                        )}
                        {component.hs_code && (
                          <div style={{ marginBottom: '0.5rem' }}>
                            <strong>HS Code:</strong> <code style={{ backgroundColor: '#f3f4f6', padding: '0.125rem 0.25rem', borderRadius: '3px' }}>{component.hs_code}</code>
                          </div>
                        )}
                        {component.ai_reasoning && (
                          <div style={{ marginBottom: '0.5rem' }}>
                            <strong>AI Reasoning:</strong>
                            <div style={{ marginTop: '0.25rem', color: '#4b5563', fontStyle: 'italic' }}>
                              {component.ai_reasoning}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* DESKTOP: Table Layout */}
          {!isMobile && (
        <div className="element-spacing" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', tableLayout: 'fixed', minWidth: '800px' }}>
            <colgroup>
              <col style={{ width: '25%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '12%' }} />
            </colgroup>
            <thead>
              <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: '600', color: '#374151' }}>Component</th>
                <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: '600', color: '#374151' }}>Origin</th>
                <th style={{ textAlign: 'right', padding: '0.75rem', fontWeight: '600', color: '#374151' }}>Value %</th>
                <th style={{ textAlign: 'right', padding: '0.75rem', fontWeight: '600', color: '#374151' }}>
                  <Tooltip text="Most Favored Nation rate - standard import duty without trade agreement benefits">
                    MFN Rate
                  </Tooltip>
                </th>
                <th style={{ textAlign: 'right', padding: '0.75rem', fontWeight: '600', color: '#374151' }}>
                  <Tooltip text="Preferential duty rate for USMCA-qualified goods (often duty-free when your product qualifies)">
                    USMCA Rate
                  </Tooltip>
                </th>
                <th style={{ textAlign: 'right', padding: '0.75rem', fontWeight: '600', color: '#374151' }}>
                  <Tooltip text="Additional tariffs (Section 301 on China goods, Section 232 on steel/aluminum)">
                    Additional Tariffs
                  </Tooltip>
                </th>
                <th style={{ textAlign: 'right', padding: '0.75rem', fontWeight: '600', color: '#374151' }}>
                  <Tooltip text="Total duty rate including all policy adjustments (MFN + Section 301 + Section 232)">
                    Total Rate
                  </Tooltip>
                </th>
                <th style={{ textAlign: 'right', padding: '0.75rem', fontWeight: '600', color: '#374151' }}>
                  <Tooltip text="USMCA components: Current savings. Non-USMCA components: Potential savings if switched to Mexico/Canada/US supplier">
                    Savings/Potential
                  </Tooltip>
                </th>
              </tr>
            </thead>
            <tbody>
              {results.usmca.component_breakdown.map((component, index) => {
                // ✅ API returns snake_case field names (database canonical format)
                // All fields use underscore: mfn_rate, base_mfn_rate, section_301, usmca_rate, etc.
                // Note: Rates are in decimal format (0-1 range), display multiplies by 100
                // ✅ DEFENSIVE APPROACH: Handle missing data gracefully
                // If any rate is missing, show 'N/A' instead of silent 0 - helps identify pipeline breaks
                const baseMfnRate = component.base_mfn_rate ?? component.mfn_rate ?? null;
                const section301 = component.section_301 ?? null;
                const section232 = component.section_232 ?? null;
                const usmcaRate = component.usmca_rate ?? component.tariff_rates?.usmca_rate ?? null;

                const totalAppliedRate = component.total_rate ?? (baseMfnRate !== null && section301 !== null && section232 !== null ? baseMfnRate + section301 + section232 : null);

                // Savings calculation: Only base MFN is eliminated, policy tariffs remain
                const savingsPercent = (baseMfnRate !== null && usmcaRate !== null) ? (baseMfnRate - usmcaRate) : null;
                const hasCompleteRates = baseMfnRate !== null && usmcaRate !== null;

                // DEBUG: Log what we're receiving from the API - especially missing fields
                if (index === 0) {
                  console.log(`🔍 [FRONTEND] First component from API (defensive parsing):`, {
                    description: component.description,
                    origin: component.origin_country,
                    rawMfnRate: component.mfn_rate,
                    rawBaseMfnRate: component.base_mfn_rate,  // ← Should match mfn_rate for China (0.35)
                    rawUsmcaRate: component.usmca_rate,
                    rawSection301: component.section_301,
                    rawSection232: component.section_232,
                    rawTotalRate: component.total_rate,  // ← Should be 0.95 for China (0.35 + 0.60)
                    parsedBaseMfnRate: baseMfnRate,
                    parsedUsmcaRate: usmcaRate,
                    parsedSection301: section301,
                    parsedTotalRate: totalAppliedRate,
                    displayMfnRate: baseMfnRate !== null ? `${(baseMfnRate * 100).toFixed(1)}%` : 'N/A',
                    displayTotalRate: totalAppliedRate !== null ? `${(totalAppliedRate * 100).toFixed(1)}%` : 'N/A',
                    hasCompleteRates,
                    missingFields: {
                      mfn_rate: component.mfn_rate === undefined || component.mfn_rate === null,
                      base_mfn_rate: component.base_mfn_rate === undefined || component.base_mfn_rate === null,
                      usmca_rate: component.usmca_rate === undefined || component.usmca_rate === null,
                      section_301: component.section_301 === undefined || component.section_301 === null,
                      total_rate: component.total_rate === undefined || component.total_rate === null
                    },
                    allKeys: Object.keys(component)
                  });
                }

                const isExpanded = expandedComponents[index];
                const hasDetails = component.ai_reasoning || component.alternative_codes || component.ai_confidence || component.hs_description;

                // Check if component is from USMCA country (US, CA, MX)
                const isUSMCAOrigin = ['US', 'CA', 'MX'].includes(component.origin_country);

                return (
                  <React.Fragment key={index}>
                    <tr style={{ borderBottom: '1px solid #e5e7eb', cursor: hasDetails ? 'pointer' : 'default' }}>
                      {/* Column 1: Component */}
                      <td style={{ padding: '0.75rem', color: '#1f2937', wordWrap: 'break-word', overflow: 'visible', whiteSpace: 'normal' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                          {hasDetails && (
                            <button
                              onClick={() => toggleComponentDetails(index)}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '1rem',
                                padding: '0',
                                lineHeight: '1',
                                flexShrink: 0,
                                marginTop: '0.125rem'
                              }}
                              title={isExpanded ? 'Hide details' : 'Show AI analysis details'}
                            >
                              {isExpanded ? '▼' : '▶'}
                            </button>
                          )}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <span style={{ wordWrap: 'break-word', whiteSpace: 'normal', overflow: 'visible' }}>
                              {component.description || ('Component ' + (index + 1))}
                            </span>
                            {/* ✅ NEW: Volatility Badge */}
                            {component.volatility_tier && component.volatility_tier <= 2 && (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  padding: '0.125rem 0.5rem',
                                  fontSize: '0.75rem',
                                  fontWeight: '600',
                                  borderRadius: '9999px',
                                  backgroundColor: component.volatility_tier === 1 ? '#fef3c7' : '#dbeafe',
                                  color: component.volatility_tier === 1 ? '#92400e' : '#1e40af',
                                  border: `1px solid ${component.volatility_tier === 1 ? '#f59e0b' : '#3b82f6'}`,
                                  cursor: 'help'
                                }}
                                title={component.volatility_reason || 'Volatile tariff rate - subject to frequent policy changes'}
                              >
                                {component.volatility_tier === 1 ? '🔴' : '🟡'} Volatile
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Column 2: Origin */}
                      <td style={{ padding: '0.75rem', color: '#1f2937', fontWeight: '500', whiteSpace: 'nowrap' }}>
                        <span title={`Component sourced from ${component.origin_country || 'Unknown'}`}>
                          {component.origin_country || '—'}
                        </span>
                      </td>

                      {/* Column 3: Value % */}
                      <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '500', color: '#1f2937', whiteSpace: 'nowrap' }}>
                        <span title={`${component.value_percentage}% of total product value ($${((results.company?.trade_volume || 0) * component.value_percentage / 100).toLocaleString()} annually)`}>
                          {component.value_percentage}%
                        </span>
                      </td>

                      {/* Column 4: MFN Rate */}
                      <td style={{ padding: '0.75rem', textAlign: 'right', color: component.origin_country === results.company?.destination_country ? '#6b7280' : (baseMfnRate !== null ? '#1f2937' : '#9ca3af') }}>
                        {component.origin_country === results.company?.destination_country ? (
                          <span
                            style={{ fontWeight: '500', whiteSpace: 'nowrap', cursor: 'help', color: '#6b7280' }}
                            title="Domestic production - no import tariffs apply"
                          >
                            N/A
                          </span>
                        ) : baseMfnRate !== null ? (
                          <span
                            style={{ fontWeight: '500', whiteSpace: 'nowrap', cursor: 'help' }}
                            title={`Most Favored Nation base rate from US tariff schedule (HTS ${component.hs_code || 'TBD'})`}
                          >
                            {(baseMfnRate * 100).toFixed(1)}%
                          </span>
                        ) : (
                          <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>N/A</span>
                        )}
                      </td>

                      {/* Column 5: USMCA Rate */}
                      <td style={{ padding: '0.75rem', textAlign: 'right', color: component.origin_country === results.company?.destination_country ? '#6b7280' : (usmcaRate !== null ? '#059669' : '#9ca3af'), fontWeight: '500', whiteSpace: 'nowrap' }}>
                        <span
                          title={component.origin_country === results.company?.destination_country ? 'Domestic production - no import tariffs apply' : (usmcaRate === 0 ? 'USMCA eliminates tariffs for qualified products from US/Mexico/Canada' : `USMCA preferential rate for this product`)}
                          style={{ cursor: 'help' }}
                        >
                          {component.origin_country === results.company?.destination_country ? 'N/A' : (usmcaRate !== null ? `${(usmcaRate * 100).toFixed(1)}%` : 'N/A')}
                        </span>
                      </td>

                      {/* Column 6: Additional Tariffs (Section 301 + Section 232) */}
                      <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '500', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                          {section301 > 0 || section232 > 0 ? (
                            <span
                              style={{ fontWeight: '600', color: '#991b1b', cursor: 'help' }}
                              title={`Policy tariffs: ${section301 > 0 ? `Section 301 ${(section301 * 100).toFixed(1)}%` : ''}${section301 > 0 && section232 > 0 ? ' + ' : ''}${section232 > 0 ? `Section 232 ${(section232 * 100).toFixed(1)}%` : ''}`}
                            >
                              {((section301 + section232) * 100).toFixed(1)}%
                            </span>
                          ) : (
                            <span
                              style={{ color: '#059669', cursor: 'help' }}
                              title={component.origin_country === 'CN' ? 'No Section 301/232 tariffs apply to this HS code' : 'No additional policy tariffs for this component'}
                            >
                              0.0%
                            </span>
                          )}
                          {/* ✅ NEW (Nov 20, 2025): Confidence badge for tariff lookup quality */}
                          {component.lookup_confidence && (
                            <ConfidenceBadge
                              confidence={component.lookup_confidence}
                              source={component.lookup_source}
                              size="sm"
                            />
                          )}
                        </div>
                      </td>

                      {/* Column 7: Total Rate (MFN + Additional) */}
                      <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: component.origin_country === results.company?.destination_country ? '#6b7280' : '#1f2937', whiteSpace: 'nowrap' }}>
                        {component.origin_country === results.company?.destination_country ? (
                          <span
                            style={{ cursor: 'help', color: '#6b7280' }}
                            title="Domestic production - no import tariffs apply"
                          >
                            N/A
                          </span>
                        ) : totalAppliedRate !== null ? (
                          <span
                            style={{ cursor: 'help' }}
                            title={`Total: ${(baseMfnRate * 100).toFixed(1)}% MFN + ${((section301 + section232) * 100).toFixed(1)}% Additional = ${(totalAppliedRate * 100).toFixed(1)}%`}
                          >
                            {(totalAppliedRate * 100).toFixed(1)}%
                          </span>
                        ) : (
                          <span style={{ color: '#9ca3af' }}>N/A</span>
                        )}
                      </td>

                      {/* Column 8: Annual Savings (CURRENT for USMCA, POTENTIAL for non-USMCA) */}
                      <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: (isUSMCAOrigin ? (component.current_annual_savings || 0) : (component.potential_annual_savings || 0)) > 0 ? (isUSMCAOrigin ? '#059669' : '#2563eb') : '#6b7280' }}>
                        {(() => {
                          // 🚨 CRITICAL FIX (Nov 14): Show CURRENT for USMCA components, POTENTIAL for non-USMCA
                          const displaySavings = isUSMCAOrigin
                            ? (component.current_annual_savings || 0)
                            : (component.potential_annual_savings || 0);

                          return displaySavings > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.125rem' }}>
                              <span
                                style={{ whiteSpace: 'nowrap', cursor: 'help', color: isUSMCAOrigin ? '#059669' : '#2563eb', fontWeight: '600' }}
                                title={isUSMCAOrigin
                                  ? `Already saving: $${((results.company?.trade_volume || 0) * component.value_percentage / 100).toLocaleString()} × ${(totalAppliedRate * 100).toFixed(1)}% = $${displaySavings.toLocaleString()}/year (using USMCA supplier)`
                                  : `Could save: $${((results.company?.trade_volume || 0) * component.value_percentage / 100).toLocaleString()} × ${(totalAppliedRate * 100).toFixed(1)}% = $${displaySavings.toLocaleString()}/year (if switched to USMCA supplier)`}
                              >
                                {isUSMCAOrigin ? '✓ ' : '💡 '}${displaySavings.toLocaleString()}
                              </span>
                              <span style={{ fontSize: '0.65rem', color: isUSMCAOrigin ? '#059669' : '#2563eb', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                                {isUSMCAOrigin ? 'Current' : 'Potential'}
                              </span>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.125rem' }}>
                              <span
                                style={{ whiteSpace: 'nowrap', cursor: 'help', color: '#6b7280', fontWeight: '600' }}
                                title={component.origin_country === results.company?.destination_country ? "Domestic production - no import tariffs apply" : "Component already has 0% tariff - no savings opportunity"}
                              >
                                $0
                              </span>
                              <span style={{ fontSize: '0.65rem', color: '#6b7280', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                                {component.origin_country === results.company?.destination_country ? 'Domestic' : 'Duty-Free'}
                              </span>
                            </div>
                          );
                        })()}
                      </td>
                    </tr>

                    {/* Expandable Details Row */}
                    {isExpanded && hasDetails && (
                      <tr>
                        <td colSpan="8" style={{ padding: '1rem', backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                          <div style={{ fontSize: '0.875rem' }}>
                            {/* AI Confidence */}
                            {component.confidence && (
                              <div style={{ marginBottom: '0.75rem' }}>
                                <strong style={{ color: '#374151' }}>
                                  <Tooltip text="90-100%: High confidence - AI found exact database match | 75-89%: Medium - AI validated by similar products | <75%: Low - Professional review recommended before customs filing">
                                    AI Confidence:
                                  </Tooltip>
                                </strong>{' '}
                                <span style={{
                                  color: component.confidence >= 90 ? '#059669' : component.confidence >= 75 ? '#d97706' : '#6b7280',
                                  fontWeight: '500'
                                }}>
                                  {component.confidence}% {component.confidence >= 90 ? '(High)' : component.confidence >= 75 ? '(Medium)' : '(Low)'}
                                </span>
                                {component.confidence < 75 && (
                                  <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#d97706', fontStyle: 'italic' }}>
                                    ⚠️ Consider professional validation before customs filing
                                  </div>
                                )}
                              </div>
                            )}

                            {/* HS Code (AI-classified) */}
                            {component.hs_code && (
                              <div style={{ marginBottom: '0.75rem' }}>
                                <strong style={{ color: '#374151' }}>HS Code:</strong>{' '}
                                <span style={{
                                  fontFamily: 'monospace',
                                  fontSize: '0.9375rem',
                                  fontWeight: '600',
                                  color: '#1f2937',
                                  backgroundColor: '#f3f4f6',
                                  padding: '0.25rem 0.5rem',
                                  borderRadius: '4px'
                                }}>
                                  {component.hs_code}
                                </span>
                                {component.classification_source === 'ai_agent' && (
                                  <span style={{
                                    fontSize: '0.75rem',
                                    color: '#6b7280',
                                    marginLeft: '0.5rem',
                                    fontStyle: 'italic'
                                  }}>
                                    (AI-classified)
                                  </span>
                                )}
                              </div>
                            )}

                            {/* HS Code Description */}
                            {component.hs_description && (
                              <div style={{ marginBottom: '0.75rem' }}>
                                <strong style={{ color: '#374151' }}>HS Code Description:</strong>
                                <div style={{
                                  marginTop: '0.25rem',
                                  padding: '0.75rem',
                                  backgroundColor: '#ffffff',
                                  borderRadius: '4px',
                                  borderLeft: '3px solid #10b981',
                                  color: '#4b5563'
                                }}>
                                  {component.hs_description}
                                </div>
                              </div>
                            )}

                            {/* Tariff Rate Information */}
                            {(component.mfn_rate || component.usmca_rate !== undefined) && (
                              <div style={{ marginBottom: '0.75rem' }}>
                                <strong style={{ color: '#374151' }}>Tariff Rate Details:</strong>
                                <div style={{
                                  marginTop: '0.5rem',
                                  padding: '0.75rem',
                                  backgroundColor: '#ffffff',
                                  borderRadius: '4px',
                                  display: 'grid',
                                  gridTemplateColumns: 'repeat(3, 1fr)',
                                  gap: '1rem'
                                }}>
                                  <div>
                                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>MFN Rate</div>
                                    <div style={{ fontWeight: '600', color: formatTariffRate(component.mfn_rate).color }} title={formatTariffRate(component.mfn_rate).title}>
                                      {formatTariffRate(component.mfn_rate).text}
                                    </div>
                                  </div>
                                  <div>
                                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>USMCA Rate</div>
                                    <div style={{ fontWeight: '600', color: formatTariffRate(component.usmca_rate).color }} title={formatTariffRate(component.usmca_rate).title}>
                                      {formatTariffRate(component.usmca_rate).text}
                                    </div>
                                  </div>
                                  <div>
                                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                                      {component.origin_country === results.company?.destination_country ? 'Status' : 'Savings'}
                                    </div>
                                    <div style={{ fontWeight: '600', color: component.origin_country === results.company?.destination_country ? '#6b7280' : '#059669' }}>
                                      {component.origin_country === results.company?.destination_country ? (
                                        <span title="Component produced domestically - no import tariffs apply">Domestic (no import)</span>
                                      ) : component.mfn_rate !== null && component.usmca_rate !== null ? (
                                        `${((component.mfn_rate - component.usmca_rate) * 100).toFixed(1)}%`
                                      ) : (
                                        'Pending'
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* EDUCATIONAL: Policy Breakdown Explanation */}
                                {component.policy_adjustments && component.policy_adjustments.length > 0 && (
                                  <div style={{
                                    marginTop: '0.75rem',
                                    padding: '0.75rem',
                                    backgroundColor: '#fffbeb',
                                    borderRadius: '4px',
                                    borderLeft: '3px solid #f59e0b'
                                  }}>
                                    <div style={{ fontSize: '0.8125rem', fontWeight: '600', color: '#92400e', marginBottom: '0.5rem' }}>
                                      📊 How We Calculate {formatTariffRate(component.mfn_rate).text} Total Rate:
                                    </div>
                                    <div style={{ fontSize: '0.8125rem', color: '#78350f', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                      {component.policy_adjustments.map((adj, idx) => {
                                        // ✅ SAFETY: Ensure adj is always a string (AI/DB might return objects)
                                        const safeAdj = typeof adj === 'string' ? adj : JSON.stringify(adj);
                                        return (
                                          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{ color: '#f59e0b' }}>•</span>
                                            <span>{safeAdj}</span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                    <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#92400e', fontStyle: 'italic' }}>
                                      {component.rate_source === 'database_fallback' || component.stale
                                        ? '⚠️ Data from January 2025 - may not reflect current policy changes'
                                        : '✅ Current October 2025 policy (updated via AI research)'}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* ✅ Rate Freshness Indicator */}
                            {component.volatility_tier && (
                              <div style={{
                                marginBottom: '0.75rem',
                                padding: '0.75rem 1rem',
                                background: '#f0fdf4',
                                border: '1px solid #bbf7d0',
                                borderRadius: '6px',
                                fontSize: '0.8125rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                              }}>
                                <span style={{ fontSize: '1rem' }}>🔄</span>
                                <div style={{ flex: 1, color: '#166534' }}>
                                  {section301 > 0 && (
                                    <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                                      Section 301 Rate: {(section301 * 100).toFixed(1)}%
                                    </div>
                                  )}
                                  {component.last_verified || component.verified_date ? (
                                    <div>
                                      Verified {component.verified_date || new Date(component.last_verified).toISOString().split('T')[0]}
                                      {component.verified_time && ` at ${component.verified_time}`}
                                      {component.cache_age_days !== undefined && component.cache_age_days > 0 && (
                                        <span style={{ fontStyle: 'italic', marginLeft: '0.5rem' }}>
                                          ({component.cache_age_days} day{component.cache_age_days !== 1 ? 's' : ''} ago)
                                        </span>
                                      )}
                                    </div>
                                  ) : (
                                    <div>Verified today</div>
                                  )}
                                  <div style={{ fontSize: '0.75rem', color: '#15803d', marginTop: '0.25rem' }}>
                                    ⚠️ This rate is refreshed {component.volatility_refresh_frequency || 'regularly'}
                                    {component.volatility_tier === 1 && ' (daily for super-volatile components)'}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* STRATEGIC: Supply Chain Alternatives for Policy-Exposed Components */}
                            {/* ✅ FIX (Nov 10): Only show Section 301 message for Chinese components */}
                            {section301 > 0 && (component.origin_country === 'CN' || component.origin_country === 'China') && (
                              <div style={{
                                marginTop: '0.75rem',
                                padding: '0.75rem',
                                backgroundColor: '#fef3c7',
                                borderRadius: '4px',
                                borderLeft: '3px solid #d97706'
                              }}>
                                <div style={{ fontSize: '0.8125rem', fontWeight: '600', color: '#92400e', marginBottom: '0.5rem' }}>
                                  💡 Strategic Opportunity: Eliminate Section 301 Exposure
                                </div>
                                <div style={{ fontSize: '0.8125rem', color: '#78350f', lineHeight: '1.5', marginBottom: '0.5rem' }}>
                                  <strong>Current situation:</strong> Your {component.description || 'component'} from {component.origin_country} is subject to {(section301 * 100).toFixed(1)}% Section 301 tariffs, costing you approximately <strong>${(component.value_percentage / 100 * (results.company?.trade_volume || 0) * (section301) / 12).toFixed(0)}/month</strong>.
                                </div>
                                <div style={{ fontSize: '0.8125rem', color: '#78350f', lineHeight: '1.5' }}>
                                  <strong>Strategic alternative:</strong> Switch to a Mexico-based supplier for this component would:
                                  <ul style={{ marginTop: '0.25rem', marginBottom: '0.25rem', marginLeft: '1.5rem' }}>
                                    <li>Eliminate Section 301 exposure entirely</li>
                                    <li>Increase regional value content (RVC) by ~{component.value_percentage}%</li>
                                    <li>See AI analysis above for industry-specific cost premiums, timelines, and payback calculations</li>
                                  </ul>
                                </div>
                                <div style={{ marginTop: '0.5rem', padding: '0.5rem', backgroundColor: '#ffffff', borderRadius: '3px', fontSize: '0.75rem', color: '#5f4800', fontStyle: 'italic' }}>
                                  ⚠️ Cost premiums, timelines, and payback periods vary by industry and product complexity. Refer to the AI-generated strategic alternatives section above for calculations specific to your business.
                                </div>
                              </div>
                            )}

                            {/* Section 232 Critical Warning - Applies to ALL Countries */}
                            {section232 > 0 && (
                              <div style={{
                                marginTop: '0.75rem',
                                padding: '0.75rem',
                                backgroundColor: '#fef2f2',
                                borderRadius: '4px',
                                borderLeft: '3px solid #dc2626'
                              }}>
                                <div style={{ fontSize: '0.8125rem', fontWeight: '600', color: '#991b1b', marginBottom: '0.5rem' }}>
                                  🚨 CRITICAL: Section 232 Applies to ALL Countries (50% Steel/Aluminum Tariff)
                                </div>
                                <div style={{ fontSize: '0.8125rem', color: '#7f1d1d', lineHeight: '1.5', marginBottom: '0.5rem' }}>
                                  <strong>Your {component.description || 'component'} from {component.origin_country}</strong> is subject to <strong>{(section232 * 100).toFixed(1)}%</strong> Section 232 tariffs on steel/aluminum, costing approximately <strong>${(component.value_percentage / 100 * (results.company?.trade_volume || 0) * (section232) / 12).toFixed(0)}/month</strong>.
                                </div>
                                {results.company?.manufacturing_location === 'MX' && results.company?.destination_country === 'US' ? (
                                  <div style={{ padding: '0.5rem', backgroundColor: '#d1fae5', borderRadius: '3px', marginBottom: '0.5rem', border: '1px solid #6ee7b7' }}>
                                    <div style={{ fontSize: '0.75rem', color: '#065f46', fontWeight: '600', marginBottom: '0.25rem' }}>
                                      ✅ Your Mexico Assembly Strategy BYPASSES Section 232 on Finished Product
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#047857' }}>
                                      • Component imported TO Mexico: Subject to Mexican Section 232 (cost incurred in Mexico)<br/>
                                      • Finished product FROM Mexico TO US: 0% USMCA (Section 232 bypassed)
                                    </div>
                                  </div>
                                ) : (
                                  <div style={{ padding: '0.5rem', backgroundColor: '#fee2e2', borderRadius: '3px', marginBottom: '0.5rem', border: '1px solid #fca5a5' }}>
                                    <div style={{ fontSize: '0.75rem', color: '#7f1d1d', fontWeight: '600', marginBottom: '0.25rem' }}>
                                      ⚠️ Section 232 applies to ALL countries including USMCA members
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#7f1d1d' }}>
                                      There is NO USMCA exemption. Mexico and Canada pay the same 50% tariff as China. Switching to USMCA suppliers does NOT eliminate Section 232.
                                    </div>
                                  </div>
                                )}
                                <div style={{ padding: '0.5rem', backgroundColor: '#fef3c7', borderRadius: '3px', border: '1px solid #fcd34d' }}>
                                  <div style={{ fontSize: '0.75rem', color: '#78350f', fontWeight: '600', marginBottom: '0.25rem' }}>
                                    💡 ONLY EXEMPTION: US-Smelted Aluminum or US-Melted Steel
                                  </div>
                                  <div style={{ fontSize: '0.75rem', color: '#78350f', marginBottom: '0.25rem' }}>
                                    If this component is made from <strong>aluminum exclusively smelted and cast in the United States</strong>, or <strong>steel exclusively melted and poured in the United States</strong>, it is EXEMPT from Section 232 (0% tariff).
                                  </div>
                                  <div style={{ fontSize: '0.75rem', color: '#78350f', fontWeight: '600', fontStyle: 'italic' }}>
                                    ✅ ACTION REQUIRED: Verify with your supplier whether the aluminum/steel is US-smelted/melted. If yes, provide documentation to eliminate this ${(component.value_percentage / 100 * (results.company?.trade_volume || 0) * (section232) / 12).toFixed(0)}/month cost.
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* AI Reasoning */}
                            {component.ai_reasoning && (
                              <div style={{ marginBottom: '0.75rem' }}>
                                <strong style={{ color: '#374151' }}>AI Classification Reasoning:</strong>
                                <div style={{
                                  marginTop: '0.25rem',
                                  padding: '0.75rem',
                                  backgroundColor: '#ffffff',
                                  borderRadius: '4px',
                                  borderLeft: '3px solid #3b82f6',
                                  color: '#4b5563',
                                  fontStyle: 'italic'
                                }}>
                                  {component.ai_reasoning}
                                </div>
                              </div>
                            )}

                            {/* Alternative HS Codes */}
                            {component.alternative_codes && component.alternative_codes.length > 0 && (
                              <div>
                                <strong style={{ color: '#374151' }}>Alternative HS Codes:</strong>
                                <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                  {component.alternative_codes.map((alt, altIndex) => (
                                    <div
                                      key={altIndex}
                                      style={{
                                        padding: '0.5rem',
                                        backgroundColor: '#ffffff',
                                        borderRadius: '4px',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                      }}
                                    >
                                      <span style={{ fontFamily: 'monospace', fontWeight: '500', color: '#1f2937' }}>
                                        {alt.code || alt.hs_code}
                                      </span>
                                      <span style={{ color: '#6b7280', fontSize: '0.8125rem' }}>
                                        {alt.confidence || alt.accuracy}% confidence
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
          )}
        </>
      )}

      {/* Gap Analysis for NOT QUALIFIED products */}
      {!qualified && gapAnalysis && (
        <div className="alert alert-warning" style={{ marginTop: '2rem' }}>
          <div className="alert-content">
            <div className="alert-title">Path to Qualification</div>
            <p className="text-body" style={{ marginBottom: '1rem' }}>
              You need <strong>{gapAnalysis.gap.toFixed(1)}%</strong> more North American content to qualify for USMCA benefits.
            </p>

            <div className="text-body" style={{ padding: '1rem', backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: '4px', marginBottom: '1rem' }}>
              <strong>Quick Win:</strong> Replace {gapAnalysis.targetComponent.description} from {gapAnalysis.targetComponent.origin_country} ({gapAnalysis.targetComponent.value_percentage}%) with a Mexico-based supplier
            </div>

            <div className="status-grid">
              <div className="status-card">
                <div className="status-label">Potential Savings</div>
                <div className="status-value">
                  {gapAnalysis.potentialSavings > 0
                    ? `$${gapAnalysis.potentialSavings.toLocaleString()}`
                    : 'Contact us for detailed analysis'}
                </div>
              </div>
              <div className="status-card">
                <div className="status-label">Estimated Timeline</div>
                <div className="status-value">{gapAnalysis.estimatedTimeline}</div>
              </div>
            </div>

            {/* CTA to Professional Services */}
            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
              <Link href="/services/logistics-support" className="btn-primary" style={{ display: 'inline-block' }}>
                🇲🇽 Get Expert Help to Qualify
              </Link>
              <p className="text-body" style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>
                Our Mexico trade experts will help you find qualified suppliers and restructure your supply chain
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
