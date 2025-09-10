/**
 * TRIANGLE INTELLIGENCE PRESENTATION EXPORT UTILITY
 * Professional PDF generation for sales presentations
 * 
 * Supports multiple export formats:
 * - PDF slides (presentation format)
 * - PDF document (report format) 
 * - Email summary (2-page overview)
 * - PowerPoint outline (structured text)
 */

import React, { useState } from 'react';
import { Download, Mail, FileText, Presentation } from 'lucide-react';
import jsPDF from 'jspdf';

// Import configuration
import {
  SALES_MESSAGING,
  SALES_STATISTICS,
  PRICING_TIERS,
  CASE_STUDIES,
  SLIDE_TEMPLATES,
  EMAIL_TEMPLATES,
  PDF_CONFIG
} from '../config/sales-presentation-config.js';

/**
 * Main Presentation Export Component
 * Handles multiple export formats with professional styling
 */
export default function PresentationExport({ 
  presentationType = 'executiveSummary',
  presentationData = null,
  customBranding = {},
  onExportComplete = () => {}
}) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  // Merge custom branding with defaults
  const branding = {
    ...PDF_CONFIG.branding,
    ...customBranding
  };

  /**
   * Export presentation as PDF slides
   */
  const exportAsPDFSlides = async () => {
    setIsExporting(true);
    setExportProgress(0);

    try {
      const pdf = new jsPDF({
        orientation: PDF_CONFIG.document.orientation,
        unit: 'mm',
        format: PDF_CONFIG.document.format
      });

      const slideTemplate = presentationData || SLIDE_TEMPLATES[presentationType];
      
      // Add title page
      await addTitlePage(pdf, slideTemplate);
      setExportProgress(10);

      // Add slides
      const slides = slideTemplate.slides;
      for (let i = 0; i < slides.length; i++) {
        pdf.addPage();
        await addSlidePage(pdf, slides[i], i + 1, slides.length);
        setExportProgress(10 + (80 * (i + 1) / slides.length));
      }

      // Add contact page
      pdf.addPage();
      await addContactPage(pdf);
      setExportProgress(95);

      // Save PDF
      const filename = `Triangle-Intelligence-${presentationType}-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(filename);
      setExportProgress(100);

      onExportComplete('pdf-slides', filename);

    } catch (error) {
      console.error('PDF export failed:', error);
    } finally {
      setIsExporting(false);
      setTimeout(() => setExportProgress(0), 2000);
    }
  };

  /**
   * Export presentation as PDF document (report format)
   */
  const exportAsPDFDocument = async () => {
    setIsExporting(true);
    setExportProgress(0);

    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'A4'
      });

      // Add document header
      await addDocumentHeader(pdf);
      setExportProgress(20);

      // Add executive summary
      await addExecutiveSummary(pdf);
      setExportProgress(40);

      // Add case studies
      pdf.addPage();
      await addCaseStudiesSection(pdf);
      setExportProgress(60);

      // Add pricing information
      await addPricingSection(pdf);
      setExportProgress(80);

      // Add next steps
      await addNextStepsSection(pdf);
      setExportProgress(95);

      // Save document
      const filename = `Triangle-Intelligence-Overview-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(filename);
      setExportProgress(100);

      onExportComplete('pdf-document', filename);

    } catch (error) {
      console.error('PDF document export failed:', error);
    } finally {
      setIsExporting(false);
      setTimeout(() => setExportProgress(0), 2000);
    }
  };

  /**
   * Generate PowerPoint outline text
   */
  const exportAsPowerPointOutline = () => {
    const slideTemplate = presentationData || SLIDE_TEMPLATES[presentationType];
    
    let outline = `TRIANGLE INTELLIGENCE SALES PRESENTATION OUTLINE\n`;
    outline += `Presentation Type: ${presentationType.charAt(0).toUpperCase() + presentationType.slice(1)}\n`;
    outline += `Generated: ${new Date().toLocaleDateString()}\n\n`;
    
    outline += `TITLE SLIDE:\n`;
    outline += `Title: ${slideTemplate.title}\n`;
    outline += `Subtitle: ${slideTemplate.subtitle}\n\n`;

    slideTemplate.slides.forEach((slide, index) => {
      outline += `SLIDE ${index + 2}: ${slide.title.toUpperCase()}\n`;
      if (slide.subtitle) {
        outline += `Subtitle: ${slide.subtitle}\n`;
      }
      outline += `Content:\n`;
      slide.content.forEach((item, itemIndex) => {
        outline += `  ${itemIndex + 1}. ${item}\n`;
      });
      outline += `\n`;
    });

    // Add speaker notes
    outline += `SPEAKER NOTES:\n\n`;
    outline += `Key Statistics:\n`;
    outline += `- Platform: ${SALES_STATISTICS.platform.activeEndpoints} active endpoints\n`;
    outline += `- Database: ${SALES_STATISTICS.platform.databaseRecords} verified records\n`;
    outline += `- Performance: ${SALES_STATISTICS.platform.responseTime} response time\n`;
    outline += `- Accuracy: ${SALES_STATISTICS.platform.accuracy} classification accuracy\n\n`;
    
    outline += `Case Studies:\n`;
    Object.values(CASE_STUDIES).forEach(caseStudy => {
      outline += `- ${caseStudy.companyName}: ${caseStudy.results.savings} saved in ${caseStudy.results.timeframe}\n`;
    });

    // Download as text file
    const blob = new Blob([outline], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Triangle-Intelligence-PowerPoint-Outline-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    onExportComplete('powerpoint-outline', a.download);
  };

  /**
   * Generate email summary
   */
  const generateEmailSummary = () => {
    const emailTemplate = EMAIL_TEMPLATES.executiveSummary;
    
    let emailContent = `Subject: ${emailTemplate.subject}\n\n`;
    emailContent += `Dear [PROSPECT NAME],\n\n`;
    
    emailTemplate.sections.forEach(section => {
      emailContent += `${section.title.toUpperCase()}\n`;
      emailContent += `${section.content}\n\n`;
    });

    emailContent += `Best regards,\n`;
    emailContent += `[YOUR NAME]\n`;
    emailContent += `Triangle Intelligence\n`;
    emailContent += `${branding.contact}\n`;
    emailContent += `${branding.website}\n\n`;

    emailContent += `---\n`;
    emailContent += `This email summary includes key points from our presentation.\n`;
    emailContent += `Request a full demo: [CALENDAR LINK]\n`;
    emailContent += `Download detailed materials: [PRESENTATION LINK]`;

    // Copy to clipboard and download
    navigator.clipboard.writeText(emailContent).then(() => {
      alert('Email content copied to clipboard!');
    });

    const blob = new Blob([emailContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Triangle-Intelligence-Email-Summary-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    onExportComplete('email-summary', a.download);
  };

  return (
    <div className="container-app" style={{background: 'white', border: '1px solid #e8e9ea', borderRadius: '0.75rem', padding: '1.5rem'}}>
      <h3 className="section-title">Export Presentation</h3>
      
      {/* Export progress */}
      {isExporting && (
        <div className="mb-4">
          <div style={{display: 'flex', justifyContent: 'space-between', color: '#6a6b6c', marginBottom: '0.5rem'}}>
            <span>Generating export...</span>
            <span>{exportProgress}%</span>
          </div>
          <div style={{width: '100%', background: '#cccdce', borderRadius: '9999px', height: '0.5rem'}}>
            <div style={{height: '100%', background: 'var(--blue-500)', borderRadius: '9999px', width: `${exportProgress}%`, transition: 'width 0.3s ease'}} />
          </div>
        </div>
      )}

      {/* Export options */}
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem'}}>
        
        {/* PDF Slides Export */}
        <button
          onClick={exportAsPDFSlides}
          disabled={isExporting}
          className="btn-secondary"
          style={{display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', opacity: isExporting ? 0.5 : 1, cursor: isExporting ? 'not-allowed' : 'pointer'}}
        >
          <Presentation style={{width: '1.5rem', height: '1.5rem', color: 'var(--navy-600)', marginRight: '0.75rem'}} />
          <div style={{textAlign: 'left'}}>
            <div style={{fontWeight: 500}}>PDF Slides</div>
            <div style={{fontSize: '0.875rem', color: 'var(--gray-600)'}}>Presentation format</div>
          </div>
        </button>

        {/* PDF Document Export */}
        <button
          onClick={exportAsPDFDocument}
          disabled={isExporting}
          className="btn-secondary"
          style={{display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', opacity: isExporting ? 0.5 : 1, cursor: isExporting ? 'not-allowed' : 'pointer'}}
        >
          <FileText style={{width: '1.5rem', height: '1.5rem', color: 'var(--green-600)', marginRight: '0.75rem'}} />
          <div style={{textAlign: 'left'}}>
            <div style={{fontWeight: 500}}>PDF Document</div>
            <div style={{fontSize: '0.875rem', color: 'var(--gray-600)'}}>Report format</div>
          </div>
        </button>

        {/* PowerPoint Outline */}
        <button
          onClick={exportAsPowerPointOutline}
          disabled={isExporting}
          className="btn-secondary 
                   disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Download style={{width: '1.5rem', height: '1.5rem', color: 'var(--amber-600)', marginRight: '0.75rem'}} />
          <div style={{textAlign: 'left'}}>
            <div style={{fontWeight: 500}}>PowerPoint Outline</div>
            <div style={{fontSize: '0.875rem', color: 'var(--gray-600)'}}>Text structure</div>
          </div>
        </button>

        {/* Email Summary */}
        <button
          onClick={generateEmailSummary}
          disabled={isExporting}
          className="btn-secondary"
          style={{display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', opacity: isExporting ? 0.5 : 1, cursor: isExporting ? 'not-allowed' : 'pointer'}}
        >
          <Mail style={{width: '1.5rem', height: '1.5rem', color: 'var(--blue-600)', marginRight: '0.75rem'}} />
          <div style={{textAlign: 'left'}}>
            <div style={{fontWeight: 500}}>Email Summary</div>
            <div style={{fontSize: '0.875rem', color: 'var(--gray-600)'}}>2-page overview</div>
          </div>
        </button>

      </div>

      {/* Export instructions */}
      <div style={{marginTop: '1rem', padding: '0.75rem', background: 'var(--green-50)', border: '1px solid var(--green-200)', borderRadius: 'var(--radius-base)', fontSize: '0.875rem'}}>
        <p style={{color: 'var(--green-700)'}}>
          <strong>Export Tips:</strong> PDF slides are best for presentations. 
          PDF document format works well for detailed reviews. 
          PowerPoint outline provides structured content for custom slides.
        </p>
      </div>
    </div>
  );
}

/**
 * PDF Helper Functions
 */

async function addTitlePage(pdf, slideTemplate) {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // Background gradient effect (simulated)
  pdf.setFillColor(30, 64, 175); // Blue background
  pdf.rect(0, 0, pageWidth, 60, 'F');

  // Title
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(28);
  pdf.setFont(undefined, 'bold');
  const titleLines = pdf.splitTextToSize(slideTemplate.title, pageWidth - 40);
  pdf.text(titleLines, 20, 35);

  // Subtitle
  pdf.setFontSize(16);
  pdf.setFont(undefined, 'normal');
  const subtitleLines = pdf.splitTextToSize(slideTemplate.subtitle, pageWidth - 40);
  pdf.text(subtitleLines, 20, 50);

  // Company branding
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(12);
  pdf.text('Triangle Intelligence', 20, pageHeight - 30);
  pdf.text('Professional USMCA Compliance Platform', 20, pageHeight - 20);
  pdf.text(new Date().toLocaleDateString(), pageWidth - 60, pageHeight - 20);
}

async function addSlidePage(pdf, slideData, slideNumber, totalSlides) {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // Slide header
  pdf.setFillColor(245, 245, 245);
  pdf.rect(0, 0, pageWidth, 25, 'F');

  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(14);
  pdf.setFont(undefined, 'bold');
  pdf.text(slideData.title, 20, 15);

  pdf.setFontSize(10);
  pdf.setFont(undefined, 'normal');
  pdf.text(`Slide ${slideNumber} of ${totalSlides}`, pageWidth - 50, 15);

  // Slide content
  let yPosition = 40;
  pdf.setFontSize(12);
  
  slideData.content.forEach((item, index) => {
    if (yPosition > pageHeight - 30) return; // Prevent overflow
    
    // Bullet point
    pdf.setFont(undefined, 'bold');
    pdf.text('•', 20, yPosition);
    
    // Content
    pdf.setFont(undefined, 'normal');
    const contentLines = pdf.splitTextToSize(item, pageWidth - 40);
    pdf.text(contentLines, 25, yPosition);
    
    yPosition += 10 + (contentLines.length - 1) * 5;
  });
}

async function addContactPage(pdf) {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  pdf.setFontSize(24);
  pdf.setFont(undefined, 'bold');
  pdf.text('Next Steps', 20, 30);

  pdf.setFontSize(14);
  pdf.setFont(undefined, 'normal');
  
  const nextSteps = [
    '15-minute platform demonstration',
    'Custom ROI analysis for your supply chain',
    '30-day pilot program available',
    'Implementation support included'
  ];

  let yPos = 50;
  nextSteps.forEach(step => {
    pdf.text('• ' + step, 20, yPos);
    yPos += 10;
  });

  // Contact information
  pdf.setFontSize(16);
  pdf.setFont(undefined, 'bold');
  pdf.text('Contact Information', 20, pageHeight - 80);

  pdf.setFontSize(12);
  pdf.setFont(undefined, 'normal');
  pdf.text('Triangle Intelligence', 20, pageHeight - 65);
  pdf.text('sales@triangle-intelligence.com', 20, pageHeight - 55);
  pdf.text('triangle-intelligence.com', 20, pageHeight - 45);
  pdf.text('Professional USMCA Compliance Solutions', 20, pageHeight - 35);
}

async function addDocumentHeader(pdf) {
  // Similar to addTitlePage but with document-style formatting
  const pageWidth = pdf.internal.pageSize.getWidth();
  
  pdf.setFontSize(20);
  pdf.setFont(undefined, 'bold');
  pdf.text('Triangle Intelligence', 20, 20);
  
  pdf.setFontSize(14);
  pdf.text('USMCA Compliance Platform Overview', 20, 30);
  
  pdf.setFontSize(10);
  pdf.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - 60, 20);
}

async function addExecutiveSummary(pdf) {
  pdf.setFontSize(16);
  pdf.setFont(undefined, 'bold');
  pdf.text('Executive Summary', 20, 50);
  
  pdf.setFontSize(11);
  pdf.setFont(undefined, 'normal');
  const summaryText = EMAIL_TEMPLATES.executiveSummary.sections[0].content;
  const lines = pdf.splitTextToSize(summaryText, 170);
  pdf.text(lines, 20, 65);
}

async function addCaseStudiesSection(pdf) {
  pdf.setFontSize(16);
  pdf.setFont(undefined, 'bold');
  pdf.text('Success Stories', 20, 20);
  
  let yPos = 35;
  Object.values(CASE_STUDIES).forEach(caseStudy => {
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    pdf.text(caseStudy.companyName, 20, yPos);
    
    pdf.setFontSize(11);
    pdf.setFont(undefined, 'normal');
    pdf.text(caseStudy.industry, 20, yPos + 8);
    
    pdf.setFont(undefined, 'bold');
    pdf.text(`Savings: ${caseStudy.results.savings}`, 20, yPos + 18);
    
    yPos += 35;
  });
}

async function addPricingSection(pdf) {
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  pdf.setFontSize(16);
  pdf.setFont(undefined, 'bold');
  pdf.text('Pricing & Investment', 20, pageHeight - 100);
  
  pdf.setFontSize(11);
  pdf.setFont(undefined, 'normal');
  const pricingText = `Professional: ${PRICING_TIERS.professional.price}/month | Enterprise: ${PRICING_TIERS.enterprise.price}/month | Custom solutions available`;
  pdf.text(pricingText, 20, pageHeight - 85);
}

async function addNextStepsSection(pdf) {
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  pdf.setFontSize(14);
  pdf.setFont(undefined, 'bold');
  pdf.text('Recommended Next Steps', 20, pageHeight - 60);
  
  pdf.setFontSize(11);
  pdf.setFont(undefined, 'normal');
  pdf.text('1. Schedule 15-minute demo', 20, pageHeight - 45);
  pdf.text('2. Custom ROI analysis', 20, pageHeight - 35);
  pdf.text('3. 30-day pilot program', 20, pageHeight - 25);
}