/**
 * Portfolio Briefing Display Component
 * Displays AI-generated strategic portfolio analysis with collapsible sections
 * Matches ExecutiveSummaryDisplay.js structure with two-level collapsible navigation
 */

import { useState, useCallback } from 'react';

export default function PortfolioBriefingDisplay({ briefingContent, userTier }) {
  // State for collapsible sections
  const [mainExpanded, setMainExpanded] = useState(true);
  const [expandedSections, setExpandedSections] = useState({});

  /**
   * Parse markdown content into sections
   * Extracts ## headings and their content
   */
  const parseSections = useCallback((content) => {
    if (!content) return [];

    const sections = [];
    const lines = content.split('\n');
    let currentSection = { title: '', content: '' };

    lines.forEach(line => {
      if (line.startsWith('## ')) {
        // Save previous section if exists
        if (currentSection.title) {
          sections.push(currentSection);
        }
        // Start new section
        currentSection = {
          title: line.replace('## ', '').trim(),
          content: ''
        };
      } else if (line.startsWith('# ')) {
        // Skip main title (# heading)
        return;
      } else {
        // Add to current section content
        currentSection.content += line + '\n';
      }
    });

    // Don't forget the last section
    if (currentSection.title) {
      sections.push(currentSection);
    }

    return sections;
  }, []);

  const sections = parseSections(typeof briefingContent === 'string' ? briefingContent : '');

  /**
   * Toggle main collapsible
   */
  const handleToggleMain = () => {
    setMainExpanded(!mainExpanded);
  };

  /**
   * Toggle individual section and scroll to next section when collapsing
   */
  const handleToggleSection = (index, event) => {
    // Default to expanded if undefined (same logic as render)
    const wasExpanded = expandedSections[index] !== false;

    setExpandedSections(prev => ({
      ...prev,
      [index]: !wasExpanded
    }));

    // If collapsing, scroll to next section
    if (wasExpanded) {
      // Capture DOM reference before setTimeout (React event pooling fix)
      const currentSection = event.currentTarget.closest('.portfolio-section');

      setTimeout(() => {
        // Use DOM navigation to find next section
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

  /**
   * Download PDF of portfolio briefing
   */
  const handleDownloadPDF = async () => {
    if (userTier === 'Trial') {
      alert('PDF download is available for paying subscribers. Upgrade to download your strategic analysis.');
      window.location.href = '/pricing';
      return;
    }

    if (!briefingContent) {
      alert('Please generate the strategic analysis first.');
      return;
    }

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
          if (y > PAGE.height - PAGE.margin) {
            doc.addPage();
            y = PAGE.margin;
          }
          doc.text(line, PAGE.margin, y);
          y += fontSize * 0.5;
        });
        y += 2;
      };

      // Header
      doc.setFillColor(59, 130, 246); // Blue color
      doc.rect(0, 0, PAGE.width, 35, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont(undefined, 'bold');
      doc.text('STRATEGIC PORTFOLIO ANALYSIS', PAGE.width / 2, 15, { align: 'center' });

      doc.setFontSize(11);
      doc.setFont(undefined, 'normal');
      doc.text('USMCA 2026 Impact & Trade Risk Assessment', PAGE.width / 2, 23, { align: 'center' });

      doc.setFontSize(9);
      doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, PAGE.width / 2, 30, { align: 'center' });

      // Reset text color for content
      doc.setTextColor(0, 0, 0);
      y = 45;

      // Parse and add sections
      sections.forEach((section) => {
        // Section title
        if (section.title) {
          doc.setFontSize(14);
          doc.setFont(undefined, 'bold');
          doc.setTextColor(59, 130, 246);

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
        doc.setTextColor(31, 41, 55);
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
            // Regular paragraph - remove bold markdown
            const cleanParagraph = paragraph.replace(/\*\*(.*?)\*\*/g, '$1');
            addText(cleanParagraph.trim(), 10, false);
          }
        });

        y += 3;
      });

      // Disclaimer footer
      if (y > PAGE.height - 50) {
        doc.addPage();
        y = PAGE.margin;
      }

      y = Math.max(y, PAGE.height - 40);
      doc.setFillColor(254, 243, 199);
      doc.rect(PAGE.margin, y, contentWidth, 30, 'F');

      doc.setTextColor(146, 64, 14);
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
      const fileName = `Strategic_Portfolio_Analysis_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  /**
   * Format section content with markdown styling
   */
  const formatContent = (content) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/^- (.*?)$/gm, '<li style="margin-left: 1.5rem; margin-bottom: 0.5rem;">$1</li>')
      .replace(/\n\n/g, '</p><p style="margin-top: 1rem; margin-bottom: 1rem;">')
      .replace(/\n/g, '<br/>');
  };

  return (
    <div style={{
      marginTop: '2rem',
      background: 'white',
      borderRadius: '12px',
      border: '2px solid #3b82f6',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      overflow: 'hidden'
    }}>
      {/* Main Header - Always Visible with Download PDF */}
      <div
        className="portfolio-main-header"
        style={{
          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.5rem 2rem',
          cursor: 'pointer',
          transition: 'background 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
        }}
      >
        <h2
          onClick={handleToggleMain}
          style={{
            color: 'white',
            fontSize: '1.5rem',
            fontWeight: '700',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            flex: 1
          }}
        >
          <span style={{
            display: 'inline-block',
            transform: mainExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s ease',
            fontSize: '1rem'
          }}>
            ▶
          </span>
          USMCA 2026 Impact & Trade Risk Assessment
        </h2>

        {/* Download PDF Button - Always Visible */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDownloadPDF();
          }}
          style={{
            background: 'white',
            color: '#3b82f6',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '8px',
            fontSize: '0.9375rem',
            fontWeight: '600',
            cursor: userTier === 'Trial' ? 'not-allowed' : 'pointer',
            opacity: userTier === 'Trial' ? 0.7 : 1,
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap'
          }}
          onMouseEnter={(e) => {
            if (userTier !== 'Trial') {
              e.currentTarget.style.background = '#f3f4f6';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'white';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
          disabled={userTier === 'Trial'}
          title={userTier === 'Trial' ? 'Upgrade to download PDF' : 'Download strategic analysis as PDF'}
        >
          {userTier === 'Trial' ? '🔒 Download PDF' : '📄 Download PDF'}
        </button>
      </div>

      {/* Collapsible Content */}
      {mainExpanded && (
        <div style={{ padding: '2rem' }}>
          {sections.map((section, index) => {
            const isExpanded = expandedSections[index] !== false; // Default to expanded

            return (
              <div key={index} className="portfolio-section" style={{ marginBottom: '1.5rem' }}>
                {/* Section Header */}
                <h3
                  onClick={(e) => handleToggleSection(index, e)}
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    color: '#3b82f6',
                    margin: '0 0 0.75rem 0',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.5rem 0',
                    transition: 'color 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#2563eb';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#3b82f6';
                  }}
                >
                  <span style={{
                    display: 'inline-block',
                    transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s ease',
                    fontSize: '0.875rem'
                  }}>
                    ▶
                  </span>
                  {section.title}
                </h3>

                {/* Section Content */}
                {isExpanded && (
                  <div
                    style={{
                      fontSize: '0.9375rem',
                      color: '#374151',
                      lineHeight: '1.7',
                      paddingLeft: '2rem'
                    }}
                    dangerouslySetInnerHTML={{
                      __html: formatContent(section.content)
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
