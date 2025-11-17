/**
 * PERSONALIZED USMCA 2026 DISPLAY
 *
 * Mobile-friendly collapsible sections matching ExecutiveSummaryDisplay pattern
 * Shows analysis of how USMCA 2026 renegotiation affects THIS user's supply chain
 */

import React, { useState, useEffect } from 'react';

export default function PersonalizedUSMCA2026Display({ data, onClose }) {
  const [mainExpanded, setMainExpanded] = useState(true);
  const [expandedSections, setExpandedSections] = useState({});
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const getInitialData = () => {
    try {
      const stored = localStorage.getItem('personalized_usmca_2026_analysis');
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed;
      }
    } catch (e) {
      console.error('Failed to load from localStorage:', e);
    }
    return data;
  };

  const [displayData, setDisplayData] = useState(getInitialData);

  useEffect(() => {
    if (data && data !== displayData) {
      setDisplayData(data);
      try {
        localStorage.setItem('personalized_usmca_2026_analysis', JSON.stringify(data));
      } catch (e) {
        console.error('Failed to save to localStorage:', e);
      }
    }
  }, [data, displayData]);

  // Initialize section states based on screen size
  useEffect(() => {
    const shouldExpand = typeof window !== 'undefined' && window.innerWidth >= 768;
    setExpandedSections({
      executive: shouldExpand,
      risks: shouldExpand,
      strategic: shouldExpand,
      monitoring: shouldExpand
    });
  }, []);

  const handleToggleSection = (sectionKey) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  const handleDownloadPDF = async () => {
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });

      const PAGE = { width: 216, height: 279, margin: 15 };
      const contentWidth = PAGE.width - (PAGE.margin * 2);
      let y = PAGE.margin;

      const addText = (text, fontSize = 10, isBold = false) => {
        doc.setFontSize(fontSize);
        doc.setFont(undefined, isBold ? 'bold' : 'normal');
        const lines = doc.splitTextToSize(text, contentWidth);
        lines.forEach(line => {
          if (y > PAGE.height - PAGE.margin) { doc.addPage(); y = PAGE.margin; }
          doc.text(line, PAGE.margin, y);
          y += fontSize * 0.5;
        });
        y += 2;
      };

      doc.setFillColor(59, 130, 246);
      doc.rect(0, 0, PAGE.width, 35, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text('USMCA 2026 IMPACT & TRADE RISK ASSESSMENT', PAGE.width / 2, 15, { align: 'center' });
      doc.setFontSize(10);
      doc.text('Your Personalized Supply Chain Analysis', PAGE.width / 2, 23, { align: 'center' });
      doc.setFontSize(9);
      doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, PAGE.width / 2, 30, { align: 'center' });

      doc.setTextColor(0, 0, 0);
      y = 45;

      if (displayData.executive_summary) {
        addText('EXECUTIVE SUMMARY', 14, true);
        addText(displayData.executive_summary, 10);
        y += 5;
      }
      if (displayData.component_risks?.length) {
        addText('COMPONENT RISK BREAKDOWN', 14, true);
        displayData.component_risks.forEach(risk => addText(`• ${risk}`, 10));
        y += 5;
      }
      if (displayData.strategic_considerations?.length) {
        addText('STRATEGIC CONSIDERATIONS', 14, true);
        displayData.strategic_considerations.forEach(item => addText(`• ${item}`, 10));
        y += 5;
      }
      if (displayData.monitoring_focus) {
        addText('MONITORING FOCUS', 14, true);
        addText(displayData.monitoring_focus, 10);
      }

      doc.save(`USMCA_2026_Impact_Assessment_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  if (!displayData) return null;

  return (
    <div className="executive-summary-container">
      <div className="executive-main-header" style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: isMobile ? '0.75rem 1rem' : '1.5rem 2rem', flexWrap: 'wrap', gap: '0.5rem'
      }}>
        <h2 onClick={() => setMainExpanded(!mainExpanded)} style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0, cursor: 'pointer',
          flex: 1, fontSize: isMobile ? '1rem' : '1.25rem'
        }}>
          <span style={{ display: 'inline-block', transition: 'transform 0.2s',
            transform: mainExpanded ? 'rotate(90deg)' : 'rotate(0deg)', fontSize: '1.25rem' }}>▶</span>
          USMCA 2026 Impact & Trade Risk Assessment
        </h2>
        <button onClick={(e) => { e.stopPropagation(); handleDownloadPDF(); }} style={{
          padding: '0.5rem 1rem', background: 'white', color: '#3b82f6', border: 'none',
          borderRadius: '6px', fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap'
        }}>📄 Download PDF</button>
      </div>

      {mainExpanded && (
        <div style={{ padding: isMobile ? '0.75rem' : '2rem' }}>
          {displayData.executive_summary && (
            <div style={{ marginBottom: isMobile ? '0.75rem' : '1.5rem' }}>
              <h3 onClick={() => handleToggleSection('executive')} style={{
                fontSize: isMobile ? '1rem' : '1.25rem', fontWeight: '600', color: '#3b82f6',
                margin: '0 0 0.5rem 0', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: '0.5rem'
              }}>
                <span style={{ transform: expandedSections.executive ? 'rotate(90deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s', fontSize: '0.875rem', flexShrink: 0, marginTop: '0.2rem' }}>▶</span>
                USMCA 2026 Renegotiation Exposure Analysis
              </h3>
              {expandedSections.executive && (
                <div style={{ padding: isMobile ? '0.75rem' : '1rem', backgroundColor: '#fef3c7',
                  borderLeft: '4px solid #f59e0b', borderRadius: '4px', marginLeft: '1.5rem' }}>
                  <p style={{ margin: 0, color: '#78350f', lineHeight: '1.7', fontSize: isMobile ? '0.9rem' : '1rem' }}>
                    {displayData.executive_summary}
                  </p>
                </div>
              )}
            </div>
          )}

          {displayData.component_risks?.length > 0 && (
            <div style={{ marginBottom: isMobile ? '0.75rem' : '1.5rem' }}>
              <h3 onClick={() => handleToggleSection('risks')} style={{
                fontSize: isMobile ? '1rem' : '1.25rem', fontWeight: '600', color: '#3b82f6',
                margin: '0 0 0.5rem 0', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: '0.5rem'
              }}>
                <span style={{ transform: expandedSections.risks ? 'rotate(90deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s', fontSize: '0.875rem', flexShrink: 0, marginTop: '0.2rem' }}>▶</span>
                Component Risk Breakdown
              </h3>
              {expandedSections.risks && (
                <ul style={{ margin: 0, paddingLeft: '2.5rem', color: '#374151', lineHeight: '1.7' }}>
                  {displayData.component_risks.map((item, idx) => (
                    <li key={idx} style={{ marginBottom: '0.5rem', fontSize: isMobile ? '0.9rem' : '1rem' }}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {displayData.strategic_considerations?.length > 0 && (
            <div style={{ marginBottom: isMobile ? '0.75rem' : '1.5rem' }}>
              <h3 onClick={() => handleToggleSection('strategic')} style={{
                fontSize: isMobile ? '1rem' : '1.25rem', fontWeight: '600', color: '#3b82f6',
                margin: '0 0 0.5rem 0', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: '0.5rem'
              }}>
                <span style={{ transform: expandedSections.strategic ? 'rotate(90deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s', fontSize: '0.875rem', flexShrink: 0, marginTop: '0.2rem' }}>▶</span>
                Strategic Considerations
              </h3>
              {expandedSections.strategic && (
                <ul style={{ margin: 0, paddingLeft: '2.5rem', color: '#374151', lineHeight: '1.7' }}>
                  {displayData.strategic_considerations.map((item, idx) => (
                    <li key={idx} style={{ marginBottom: '0.5rem', fontSize: isMobile ? '0.9rem' : '1rem' }}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {displayData.monitoring_focus && (
            <div style={{ marginBottom: 0 }}>
              <h3 onClick={() => handleToggleSection('monitoring')} style={{
                fontSize: isMobile ? '1rem' : '1.25rem', fontWeight: '600', color: '#3b82f6',
                margin: '0 0 0.5rem 0', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: '0.5rem'
              }}>
                <span style={{ transform: expandedSections.monitoring ? 'rotate(90deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s', fontSize: '0.875rem', flexShrink: 0, marginTop: '0.2rem' }}>▶</span>
                What We're Monitoring For You
              </h3>
              {expandedSections.monitoring && (
                <p style={{ margin: 0, paddingLeft: '1.5rem', color: '#374151', lineHeight: '1.7',
                  fontStyle: 'italic', fontSize: isMobile ? '0.9rem' : '1rem' }}>
                  {displayData.monitoring_focus}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
