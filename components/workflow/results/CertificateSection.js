/**
 * CertificateSection - Certificate of Origin display and interactive form
 * Now includes digital form wizard for proper certificate completion
 */

import React, { useState } from 'react';
import CertificateCompletionWizard from '../CertificateCompletionWizard';

export default function CertificateSection({ results, onDownloadCertificate }) {
  const [showWizard, setShowWizard] = useState(false);
  
  if (!results?.certificate) return null;

  const certificate = results.certificate;

  const handleWizardComplete = async (completedCertificate) => {
    // Generate PDF from completed certificate data
    const pdfBlob = await generatePDFCertificate(completedCertificate);
    
    // Download the PDF
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `USMCA_Certificate_${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setShowWizard(false);
  };

  const generatePDFCertificate = async (certificateData) => {
    try {
      // Dynamic import to avoid SSR issues
      const jsPDFModule = await import('jspdf');
      const jsPDF = jsPDFModule.default || jsPDFModule;
    
    // Create new PDF document
    const doc = new jsPDF();
    
    // Set up document properties
    doc.setProperties({
      title: 'USMCA Certificate of Origin',
      subject: 'Official USMCA Certificate of Origin',
      author: 'Triangle Intelligence Platform',
      creator: 'Triangle Intelligence USMCA Platform'
    });

    // Header
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('UNITED STATES-MEXICO-CANADA AGREEMENT', 105, 20, { align: 'center' });
    doc.text('CERTIFICATE OF ORIGIN', 105, 30, { align: 'center' });
    
    // Certificate details
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Certificate Number: ${certificateData.certificate_number || new Date().getTime()}`, 20, 45);
    doc.text(`Issue Date: ${new Date().toLocaleDateString()}`, 20, 52);
    doc.text(`Valid From: ${certificateData.blanket_period?.start_date || new Date().toLocaleDateString()}`, 20, 59);
    doc.text(`Valid Until: ${certificateData.blanket_period?.end_date || new Date(Date.now() + 365*24*60*60*1000).toLocaleDateString()}`, 20, 66);

    // Field 1 - Exporter Information
    let yPos = 80;
    doc.setFont(undefined, 'bold');
    doc.text('FIELD 1 - EXPORTER INFORMATION', 20, yPos);
    doc.setFont(undefined, 'normal');
    yPos += 8;
    doc.text(`Name: ${certificateData.company_info?.exporter_name || 'TO BE COMPLETED'}`, 20, yPos);
    yPos += 6;
    doc.text(`Address: ${certificateData.company_info?.exporter_address || 'TO BE COMPLETED'}`, 20, yPos);
    yPos += 6;
    doc.text(`Tax ID: ${certificateData.company_info?.exporter_tax_id || 'TO BE COMPLETED'}`, 20, yPos);
    yPos += 6;
    doc.text(`Phone: ${certificateData.company_info?.exporter_phone || 'TO BE COMPLETED'}`, 20, yPos);
    yPos += 6;
    doc.text(`Email: ${certificateData.company_info?.exporter_email || 'TO BE COMPLETED'}`, 20, yPos);

    // Field 2 - Importer Information
    yPos += 15;
    doc.setFont(undefined, 'bold');
    doc.text('FIELD 2 - IMPORTER INFORMATION', 20, yPos);
    doc.setFont(undefined, 'normal');
    yPos += 8;
    doc.text(`Name: ${certificateData.company_info?.importer_name || 'TO BE COMPLETED'}`, 20, yPos);
    yPos += 6;
    doc.text(`Address: ${certificateData.company_info?.importer_address || 'TO BE COMPLETED'}`, 20, yPos);
    yPos += 6;
    doc.text(`Tax ID: ${certificateData.company_info?.importer_tax_id || 'TO BE COMPLETED'}`, 20, yPos);

    // Field 3 - Product Information
    yPos += 15;
    doc.setFont(undefined, 'bold');
    doc.text('FIELD 3 - PRODUCT INFORMATION', 20, yPos);
    doc.setFont(undefined, 'normal');
    yPos += 8;
    doc.text(`HS Code: ${certificateData.product_details?.hs_code || certificate.hs_code || 'TO BE COMPLETED'}`, 20, yPos);
    yPos += 6;
    const description = certificateData.product_details?.commercial_description || certificate.product_description || 'TO BE COMPLETED';
    // Handle long descriptions with text wrapping
    const splitDescription = doc.splitTextToSize(description, 170);
    doc.text(splitDescription, 20, yPos);
    yPos += splitDescription.length * 6;
    doc.text(`Origin Criterion: ${certificate.preference_criterion || 'B'}`, 20, yPos);

    // Field 4 - Origin Details
    yPos += 15;
    doc.setFont(undefined, 'bold');
    doc.text('FIELD 4 - ORIGIN DETAILS', 20, yPos);
    doc.setFont(undefined, 'normal');
    yPos += 8;
    doc.text(`Manufacturing Location: ${certificateData.supply_chain?.manufacturing_location || 'TO BE COMPLETED'}`, 20, yPos);
    yPos += 6;
    doc.text(`Regional Value Content: ${certificateData.supply_chain?.regional_value_content || '0'}%`, 20, yPos);
    yPos += 6;
    doc.text('USMCA Qualified: YES', 20, yPos);

    // Field 5 - Authorization
    yPos += 15;
    doc.setFont(undefined, 'bold');
    doc.text('FIELD 5 - AUTHORIZED SIGNATURE', 20, yPos);
    doc.setFont(undefined, 'normal');
    yPos += 8;
    doc.text(`Signatory: ${certificateData.authorization?.signatory_name || 'TO BE COMPLETED'}`, 20, yPos);
    yPos += 6;
    doc.text(`Title: ${certificateData.authorization?.signatory_title || 'TO BE COMPLETED'}`, 20, yPos);
    yPos += 6;
    doc.text(`Date: ${certificateData.authorization?.signatory_date || new Date().toLocaleDateString()}`, 20, yPos);

    // Declaration
    yPos += 15;
    doc.setFont(undefined, 'bold');
    doc.text('DECLARATION:', 20, yPos);
    doc.setFont(undefined, 'normal');
    yPos += 8;
    const declaration = 'I certify that the goods described in this document qualify as originating under the USMCA and that the information contained in this document is true and accurate.';
    const splitDeclaration = doc.splitTextToSize(declaration, 170);
    doc.text(splitDeclaration, 20, yPos);

    // Footer
    yPos = 280;
    doc.setFontSize(8);
    doc.text('Generated by Triangle Intelligence Platform', 105, yPos, { align: 'center' });
    doc.text('Professional verification recommended before customs submission', 105, yPos + 5, { align: 'center' });
    
    // Generate and return PDF blob
    return doc.output('blob');
    
    } catch (error) {
      console.error('PDF generation error:', error);
      throw new Error(`PDF generation failed: ${error.message}`);
    }
  };

  if (showWizard) {
    return (
      <CertificateCompletionWizard
        initialData={results}
        onComplete={handleWizardComplete}
        onCancel={() => setShowWizard(false)}
      />
    );
  }

  return (
    <div className="mb-8">
      <h3 className="text-xl font-bold text-gray-800 mb-4">Certificate of Origin</h3>
      <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-6">
        <div className="mb-6">
          <p className="text-gray-700 mb-4">
            Your USMCA Certificate of Origin is ready. Complete the digital form to generate a professional certificate.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="flex justify-between">
              <span className="font-medium text-gray-600">Valid From:</span>
              <span className="font-semibold text-gray-900">
                {new Date(certificate.blanket_start).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-gray-600">Valid Until:</span>
              <span className="font-semibold text-gray-900">
                {new Date(certificate.blanket_end).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-gray-600">Preference Criterion:</span>
              <span className="font-semibold text-gray-900">
                {certificate.preference_criterion}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex gap-4">
          <button 
            onClick={() => setShowWizard(true)}
            className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            📝 Complete Digital Form
          </button>
          
          <button 
            onClick={onDownloadCertificate}
            className="bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            📄 Download Template (.txt)
          </button>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 mt-4">
          <p className="text-sm text-gray-700">
            <strong>Recommended:</strong> Use the digital form to complete all required fields and generate a 
            professional certificate. The template download is a basic text file for reference only.
          </p>
        </div>
      </div>
    </div>
  );
}