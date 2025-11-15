/**
 * ExecutiveSummaryDisplay - AI-Generated Strategic Trade Advisory
 * Displays consulting-grade narrative analysis with personality
 */

import React, { useState, useEffect, useCallback } from 'react';

export default function ExecutiveSummaryDisplay({ data, onClose }) {
  const [narrativeContent, setNarrativeContent] = useState('');
  const [mainExpanded, setMainExpanded] = useState(true); // Main container expanded by default
  const [expandedSections, setExpandedSections] = useState({}); // Track each section's state

  useEffect(() => {
    // Extract AI-generated narrative from the alert structure
    if (data?.alert) {
      // Fresh generation: AI returns markdown in the alert object
      const content = data.alert.situation_brief || data.alert.narrative || '';
      console.log('📊 Executive Summary AI Content (fresh):', content);
      setNarrativeContent(content);
    } else if (data?.situation_brief) {
      // Saved summary: Loaded from database
      console.log('📊 Executive Summary AI Content (saved):', data.situation_brief);
      setNarrativeContent(data.situation_brief);
    } else if (typeof data === 'string') {
      // Sometimes AI returns raw markdown string
      setNarrativeContent(data);
    }
  }, [data]);

  // Parse markdown sections from AI output
  const parseSections = useCallback((content) => {
    if (!content) return [];

    // Split by ## headers
    const sections = [];
    const lines = content.split('\n');
    let currentSection = { title: '', content: '' };

    lines.forEach(line => {
      if (line.startsWith('## ')) {
        if (currentSection.title) {
          sections.push(currentSection);
        }
        currentSection = { title: line.replace('## ', '').trim(), content: '' };
      } else if (line.startsWith('# ')) {
        // Skip main title
        return;
      } else {
        currentSection.content += line + '\n';
      }
    });

    if (currentSection.title) {
      sections.push(currentSection);
    }

    return sections;
  }, []);

  // Initialize all sections as expanded when content loads
  useEffect(() => {
    if (narrativeContent) {
      const sections = parseSections(narrativeContent);
      const initialState = {};
      sections.forEach((_, index) => {
        initialState[index] = true; // All sections expanded by default
      });
      setExpandedSections(initialState);
    }
  }, [narrativeContent, parseSections]);

  const handleDownloadPDF = async () => {
    try {
      const { jsPDF } = await import('jspdf');

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'letter'
      });

      // Page dimensions
      const PAGE = {
        width: 216,
        height: 279,
        margin: 15
      };

      const contentWidth = PAGE.width - (PAGE.margin * 2);
      let y = PAGE.margin;

      // Helper function to add text with wrapping
      const addText = (text, fontSize = 10, isBold = false) => {
        doc.setFontSize(fontSize);
        doc.setFont(undefined, isBold ? 'bold' : 'normal');
        const lines = doc.splitTextToSize(text, contentWidth);

        lines.forEach(line => {
          // Check if we need a new page
          if (y > PAGE.height - PAGE.margin) {
            doc.addPage();
            y = PAGE.margin;
          }
          doc.text(line, PAGE.margin, y);
          y += fontSize * 0.5;
        });
        y += 2; // Extra spacing after text block
      };

      // Header
      doc.setFillColor(102, 126, 234); // Purple gradient color
      doc.rect(0, 0, PAGE.width, 35, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont(undefined, 'bold');
      doc.text('EXECUTIVE TRADE ADVISORY', PAGE.width / 2, 15, { align: 'center' });

      doc.setFontSize(11);
      doc.setFont(undefined, 'normal');
      doc.text('Strategic Analysis for Your Supply Chain', PAGE.width / 2, 23, { align: 'center' });

      doc.setFontSize(9);
      doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, PAGE.width / 2, 30, { align: 'center' });

      // Reset text color for content
      doc.setTextColor(0, 0, 0);
      y = 45;

      // Parse and add sections
      const sections = parseSections(narrativeContent);

      sections.forEach((section, index) => {
        // Section title
        if (section.title) {
          doc.setFontSize(14);
          doc.setFont(undefined, 'bold');
          doc.setTextColor(59, 130, 246); // Blue color

          // Check if we need a new page for section header
          if (y > PAGE.height - 30) {
            doc.addPage();
            y = PAGE.margin;
          }

          doc.text(section.title, PAGE.margin, y);
          y += 8;

          // Underline
          doc.setDrawColor(59, 130, 246);
          doc.setLineWidth(0.5);
          doc.line(PAGE.margin, y - 2, PAGE.width - PAGE.margin, y - 2);
          y += 3;
        }

        // Section content
        doc.setTextColor(31, 41, 55); // Dark gray
        const paragraphs = section.content.split('\n\n');

        paragraphs.forEach(paragraph => {
          if (!paragraph.trim() || paragraph.trim() === '---') return;

          // Handle bullet points
          if (paragraph.trim().startsWith('•') || paragraph.trim().startsWith('-')) {
            const bullets = paragraph.split('\n').filter(b => b.trim());
            bullets.forEach(bullet => {
              const cleanBullet = bullet.replace(/^[•\-]\s*/, '').trim();

              doc.setFontSize(10);
              doc.setFont(undefined, 'normal');
              const bulletLines = doc.splitTextToSize('• ' + cleanBullet, contentWidth - 5);

              bulletLines.forEach((line, idx) => {
                if (y > PAGE.height - PAGE.margin) {
                  doc.addPage();
                  y = PAGE.margin;
                }
                doc.text(line, PAGE.margin + (idx > 0 ? 5 : 0), y);
                y += 5;
              });
            });
            y += 2;
          } else {
            // Regular paragraph
            addText(paragraph.trim(), 10, false);
          }
        });

        y += 3; // Extra spacing between sections
      });

      // Disclaimer footer
      if (y > PAGE.height - 50) {
        doc.addPage();
        y = PAGE.margin;
      }

      y = Math.max(y, PAGE.height - 40);
      doc.setFillColor(254, 243, 199); // Light yellow
      doc.rect(PAGE.margin, y, contentWidth, 30, 'F');

      doc.setTextColor(146, 64, 14); // Brown text
      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      doc.text('DISCLAIMER', PAGE.margin + 3, y + 6);

      doc.setFont(undefined, 'normal');
      doc.setFontSize(8);
      const disclaimerText = 'This is a research tool, not professional advice. All tariff calculations, savings estimates, and compliance guidance must be independently verified by licensed customs brokers or trade attorneys before making business decisions.';
      const disclaimerLines = doc.splitTextToSize(disclaimerText, contentWidth - 6);

      let disclaimerY = y + 11;
      disclaimerLines.forEach(line => {
        doc.text(line, PAGE.margin + 3, disclaimerY);
        disclaimerY += 4;
      });

      // Save the PDF
      const fileName = `Executive_Trade_Advisory_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const sections = parseSections(narrativeContent);

  // Toggle main container (entire summary)
  const handleToggleMain = () => {
    setMainExpanded(!mainExpanded);
  };

  // Toggle individual section with smooth scroll to next section
  const handleToggleSection = (index, event) => {
    // Default to expanded if undefined (same logic as render)
    const wasExpanded = expandedSections[index] !== false;
    setExpandedSections(prev => ({
      ...prev,
      [index]: !wasExpanded
    }));

    // If collapsing, scroll to next section after brief delay
    if (wasExpanded) {
      // Capture the reference before setTimeout (React synthetic events are pooled)
      const currentSection = event.currentTarget.closest('.executive-section');

      setTimeout(() => {
        // Get the actual next sibling section in the DOM
        const nextSection = currentSection?.nextElementSibling;

        if (nextSection) {
          const elementTop = nextSection.getBoundingClientRect().top;
          const offset = 100;

          window.scrollTo({
            top: window.pageYOffset + elementTop - offset,
            behavior: 'smooth'
          });
        }
      }, 100);
    }
  };

  if (!narrativeContent && sections.length === 0) {
    return (
      <div className="form-section">
        <div className="alert alert-info">
          <p>📊 Generating your strategic trade advisory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="executive-summary-container">
      {/* Main Header with Big Triangle and Download Button */}
      <div
        className="executive-main-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.5rem 2rem'
        }}
      >
        <h2
          onClick={handleToggleMain}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            margin: 0,
            cursor: 'pointer',
            flex: 1
          }}
        >
          <span style={{
            display: 'inline-block',
            transition: 'transform 0.2s',
            transform: mainExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
            fontSize: '1.25rem'
          }}>
            ▶
          </span>
          USMCA Certification Status & Tariff Exposure Analysis
        </h2>

        {/* Download PDF Button - Always visible */}
        <button
          onClick={(e) => {
            e.stopPropagation(); // Prevent header collapse when clicking button
            handleDownloadPDF();
          }}
          style={{
            padding: '0.5rem 1rem',
            background: 'white',
            color: '#3b82f6',
            border: 'none',
            borderRadius: '6px',
            fontSize: '0.875rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s',
            whiteSpace: 'nowrap'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#f0f0f0';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'white';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          📄 Download PDF
        </button>
      </div>

      {/* AI-Generated Narrative Sections - Only show if main is expanded */}
      {mainExpanded && (
        <div className="executive-summary-content">
          {sections.map((section, index) => {
            // Skip rendering the first section entirely if it matches the main header (avoid duplicate)
            const isDuplicateTitle = index === 0 &&
              (section.title.includes('USMCA Certification Status') ||
               section.title.includes('Tariff Exposure Analysis'));

            // Don't render duplicate section at all
            if (isDuplicateTitle) return null;

            return (
              <div key={index} className="form-section executive-section">
                {/* Section Header with Smaller Triangle */}
                <div
                  onClick={(e) => handleToggleSection(index, e)}
                  style={{
                    cursor: 'pointer',
                    marginBottom: expandedSections[index] ? '1rem' : '0'
                  }}
                >
                  <h3 className="form-section-title" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: 0
                  }}>
                    <span style={{
                      display: 'inline-block',
                      transition: 'transform 0.2s',
                      transform: expandedSections[index] ? 'rotate(90deg)' : 'rotate(0deg)',
                      fontSize: '0.875rem'
                    }}>
                      ▶
                    </span>
                    {section.title}
                  </h3>
                </div>

                {/* Section Content - Only show if expanded */}
                {expandedSections[index] && (
                  <div className="narrative-content">
                    {section.content.split('\n\n').map((paragraph, pIndex) => {
                      // Skip empty paragraphs and dividers
                      if (!paragraph.trim() || paragraph.trim() === '---') return null;

                      // Handle bullet points
                      if (paragraph.trim().startsWith('•') || paragraph.trim().startsWith('-')) {
                        const bullets = paragraph.split('\n').filter(b => b.trim());
                        return (
                          <ul key={pIndex} className="narrative-bullets">
                            {bullets.map((bullet, bIndex) => (
                              <li key={bIndex}>{bullet.replace(/^[•\-]\s*/, '').trim()}</li>
                            ))}
                          </ul>
                        );
                      }

                      // Regular paragraphs
                      return (
                        <p key={pIndex} className="narrative-paragraph">
                          {paragraph.trim()}
                        </p>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Disclaimer - Only show if main is expanded */}
      {mainExpanded && (
        <div className="executive-summary-disclaimer">
        <p>
          <strong>Disclaimer:</strong> This is a research tool, not professional advice.
          All tariff calculations, savings estimates, and compliance guidance must be independently verified
          by licensed customs brokers or trade attorneys before making business decisions.
        </p>
        </div>
      )}

      <style jsx>{`
        .executive-summary-container {
          margin-top: 1.5rem;
          background: white;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .executive-main-header {
          background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
          border-radius: 8px 8px 0 0;
          color: white;
        }

        .executive-main-header h2 {
          color: white;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .executive-main-header h2:hover {
          opacity: 0.9;
        }

        .executive-summary-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 1.5rem 2rem;
          border-bottom: 2px solid #e5e7eb;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 8px 8px 0 0;
        }

        .executive-summary-header h2 {
          color: white;
          margin: 0 0 0.5rem 0;
        }

        .executive-summary-subtitle {
          color: rgba(255,255,255,0.9);
          font-size: 0.875rem;
          margin: 0;
        }

        .executive-summary-actions {
          display: flex;
          gap: 0.75rem;
        }

        .btn-primary {
          padding: 0.625rem 1.25rem;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-primary:hover {
          background: #2563eb;
          transform: translateY(-1px);
          box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3);
        }

        .btn-download {
          padding: 0.5rem 1rem;
          background: white;
          color: #667eea;
          border: none;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-download:hover {
          background: #f0f0f0;
          transform: translateY(-1px);
        }

        .btn-close {
          padding: 0.5rem 1rem;
          background: rgba(255,255,255,0.2);
          color: white;
          border: 1px solid rgba(255,255,255,0.3);
          border-radius: 6px;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-close:hover {
          background: rgba(255,255,255,0.3);
        }

        .executive-summary-content {
          padding: 2rem;
        }

        .form-section {
          margin-bottom: 2rem;
          padding: 1.5rem;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
        }

        .executive-section {
          transition: all 0.2s;
        }

        .executive-section:hover {
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .form-section-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: #111827;
          margin: 0 0 1rem 0;
          padding-bottom: 0.5rem;
          border-bottom: 2px solid #3b82f6;
        }

        .narrative-content {
          font-size: 1rem;
          line-height: 1.75;
          color: #1f2937;
        }

        .narrative-paragraph {
          margin-bottom: 1rem;
          text-align: justify;
        }

        .narrative-bullets {
          margin: 1rem 0;
          padding-left: 1.5rem;
        }

        .narrative-bullets li {
          margin-bottom: 0.5rem;
          line-height: 1.6;
        }

        .executive-summary-disclaimer {
          padding: 1.5rem 2rem;
          background: #fef3c7;
          border-top: 2px solid #f59e0b;
          border-radius: 0 0 8px 8px;
        }

        .executive-summary-disclaimer p {
          margin: 0;
          font-size: 0.875rem;
          color: #92400e;
          line-height: 1.5;
        }
      `}</style>
    </div>
  );
}
