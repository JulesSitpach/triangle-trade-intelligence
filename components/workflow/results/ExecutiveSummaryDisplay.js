/**
 * ExecutiveSummaryDisplay - AI-Generated Strategic Trade Advisory
 * Displays consulting-grade narrative analysis with personality
 */

import React, { useState, useEffect } from 'react';

export default function ExecutiveSummaryDisplay({ data, onClose }) {
  const [narrativeContent, setNarrativeContent] = useState('');

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

  const handleDownloadPDF = () => {
    const pdfContent = `EXECUTIVE TRADE ADVISORY\nStrategic Analysis for Your Supply Chain\n\nGenerated: ${new Date().toLocaleDateString()}\n${'='.repeat(80)}\n\n${narrativeContent}\n\n${'='.repeat(80)}\nDISCLAIMER\nThis is a research tool, not professional advice. Consult licensed customs brokers or trade attorneys before making business decisions.`;

    const blob = new Blob([pdfContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Executive_Trade_Advisory_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Parse markdown sections from AI output
  const parseSections = (content) => {
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
  };

  const sections = parseSections(narrativeContent);

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
      {/* Header */}
      <div className="executive-summary-header">
        <div>
          <h2 className="form-section-title">📊 Executive Trade Advisory</h2>
          <p className="executive-summary-subtitle">Strategic analysis for your supply chain</p>
        </div>
        <div className="executive-summary-actions">
          <button onClick={handleDownloadPDF} className="btn-download">
            📄 Download Advisory
          </button>
          <button onClick={onClose} className="btn-close">
            Close
          </button>
        </div>
      </div>

      {/* AI-Generated Narrative Sections */}
      <div className="executive-summary-content">
        {sections.map((section, index) => (
          <div key={index} className="form-section">
            <h3 className="form-section-title">{section.title}</h3>
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
          </div>
        ))}
      </div>

      {/* Disclaimer */}
      <div className="executive-summary-disclaimer">
        <p>
          <strong>⚠️ Disclaimer:</strong> This is a research tool, not professional advice.
          All tariff calculations, savings estimates, and compliance guidance must be independently verified
          by licensed customs brokers or trade attorneys before making business decisions.
        </p>
      </div>

      <style jsx>{`
        .executive-summary-container {
          margin-top: 1.5rem;
          background: white;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
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

        @media (max-width: 768px) {
          .executive-summary-header {
            flex-direction: column;
            gap: 1rem;
          }

          .executive-summary-actions {
            width: 100%;
            flex-direction: column;
          }

          .btn-download, .btn-close {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
