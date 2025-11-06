/**
 * USMCA Certificate PDF Generator - Clean Rewrite
 *
 * Built to match certificate preview.png EXACTLY
 * No more patching - this is a fresh start
 */

export async function generateUSMCACertificatePDF(certificateData, options = {}) {
  if (!certificateData) {
    throw new Error('certificateData is required for PDF generation');
  }

  const { watermark = false, userTier = 'Starter' } = options;

  try {
    const { jsPDF } = await import('jspdf');

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter'
    });

    // ========== LAYOUT CONSTANTS (based on preview) ==========
    const PAGE = {
      width: 216,  // Letter width in mm
      height: 279, // Letter height in mm
      margin: 12   // Border margin
    };

    const contentWidth = PAGE.width - (PAGE.margin * 2);
    const halfWidth = contentWidth / 2;

    // Helper: wrap text
    const wrapText = (text, maxWidth) => {
      if (!text) return [''];
      return doc.splitTextToSize(String(text), maxWidth);
    };

    let y = PAGE.margin;

    // ========== OUTER BORDER (thick) ==========
    doc.setLineWidth(0.8);
    doc.setDrawColor(0, 0, 0);
    doc.rect(PAGE.margin, PAGE.margin, contentWidth, PAGE.height - (PAGE.margin * 2));

    // ========== HEADER ==========
    y += 6;
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('UNITED STATES MEXICO CANADA AGREEMENT (USMCA)', PAGE.width / 2, y, { align: 'center' });

    y += 5;
    doc.setFontSize(10);
    doc.text('CERTIFICATION OF ORIGIN', PAGE.width / 2, y, { align: 'center' });

    // Certificate number (top right)
    doc.setFontSize(8);
    const certNum = certificateData.certificate_number || `USMCA-${new Date().getFullYear()}-XXXXX`;
    doc.text(certNum, PAGE.width - PAGE.margin - 3, PAGE.margin + 6, { align: 'right' });

    // Header bottom line
    y += 4;
    doc.setLineWidth(0.3);
    doc.line(PAGE.margin, y, PAGE.width - PAGE.margin, y);

    // ========== SECTION 1: CERTIFIER TYPE + BLANKET PERIOD ==========
    const section1Top = y;
    const section1Height = 24; // Taller to fit 3 checkboxes comfortably
    const section1Width = 70;

    // Section 1 title
    y += 5;
    doc.setFontSize(8);
    doc.setFont(undefined, 'bold');
    doc.text('1. CERTIFIER TYPE (INDICATE "X")', PAGE.margin + 2, y);

    // Three checkboxes
    const certifierType = (certificateData.certifier?.type || certificateData.certifier_type || 'EXPORTER').toUpperCase();
    const boxSize = 3;

    y += 5;
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');

    // IMPORTER
    doc.rect(PAGE.margin + 2, y - 2.5, boxSize, boxSize);
    if (certifierType === 'IMPORTER') {
      doc.setFont(undefined, 'bold');
      doc.text('X', PAGE.margin + 3, y);
      doc.setFont(undefined, 'normal');
    }
    doc.text('IMPORTER', PAGE.margin + 7, y);

    y += 5;
    // EXPORTER
    doc.rect(PAGE.margin + 2, y - 2.5, boxSize, boxSize);
    if (certifierType === 'EXPORTER') {
      doc.setFont(undefined, 'bold');
      doc.text('X', PAGE.margin + 3, y);
      doc.setFont(undefined, 'normal');
    }
    doc.text('EXPORTER', PAGE.margin + 7, y);

    y += 5;
    // PRODUCER
    doc.rect(PAGE.margin + 2, y - 2.5, boxSize, boxSize);
    if (certifierType === 'PRODUCER') {
      doc.setFont(undefined, 'bold');
      doc.text('X', PAGE.margin + 3, y);
      doc.setFont(undefined, 'normal');
    }
    doc.text('PRODUCER', PAGE.margin + 7, y);

    // Vertical line separating certifier type from blanket period
    doc.setLineWidth(0.3);
    doc.line(PAGE.margin + section1Width, section1Top, PAGE.margin + section1Width, section1Top + section1Height);

    // Blanket Period (right side of Section 1)
    const bpX = PAGE.margin + section1Width;
    const bpWidth = contentWidth - section1Width;

    // Light background
    doc.setFillColor(249, 250, 251);
    doc.rect(bpX, section1Top, bpWidth, section1Height, 'F');

    y = section1Top + 5;
    doc.setFontSize(8);
    doc.setFont(undefined, 'bold');
    doc.text('BLANKET PERIOD', bpX + 2, y);
    doc.setFontSize(7);
    doc.setFont(undefined, 'normal');
    doc.text('(MM/DD/YYYY)', bpX + 2, y + 3);

    // Auto-generate dates
    const today = new Date();
    const oneYearLater = new Date(today);
    oneYearLater.setFullYear(today.getFullYear() + 1);
    const formatDate = (date) => {
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const year = date.getFullYear();
      return `${year}-${month}-${day}`;
    };

    const blanketFrom = certificateData.blanket_period?.start_date || formatDate(today);
    const blanketTo = certificateData.blanket_period?.end_date || formatDate(oneYearLater);

    y += 7;
    doc.setFontSize(8);
    doc.setFont(undefined, 'bold');
    doc.text('FROM:', bpX + 2, y);
    doc.setFont(undefined, 'normal');
    doc.text(blanketFrom, bpX + 15, y);

    y += 5;
    doc.setFont(undefined, 'bold');
    doc.text('TO:', bpX + 2, y);
    doc.setFont(undefined, 'normal');
    doc.text(blanketTo, bpX + 15, y);

    // Section 1 bottom line
    y = section1Top + section1Height;
    doc.setLineWidth(0.3);
    doc.line(PAGE.margin, y, PAGE.width - PAGE.margin, y);

    // ========== SECTIONS 2-5: 2x2 PARTY GRID ==========
    const partyHeight = 40;

    // Helper to render party section
    const renderParty = (sectionNum, title, data, x, yStart) => {
      const padding = 2;
      let fieldY = yStart + 4;

      // Section title
      doc.setFontSize(7);
      doc.setFont(undefined, 'bold');
      doc.text(`${sectionNum}. ${title}`, x + padding, fieldY);
      fieldY += 5;

      // NAME
      doc.setFontSize(7);
      doc.setFont(undefined, 'normal');
      doc.text('NAME', x + padding, fieldY);
      fieldY += 3;
      doc.setFontSize(8);
      doc.setFont(undefined, 'bold');
      doc.text(data?.name || '', x + padding, fieldY);
      fieldY += 4;

      // ADDRESS
      doc.setFontSize(7);
      doc.setFont(undefined, 'normal');
      doc.text('ADDRESS', x + padding, fieldY);
      fieldY += 3;
      doc.setFontSize(8);
      doc.setFont(undefined, 'bold');
      const addr = wrapText(data?.address || '', halfWidth - 4);
      doc.text(addr, x + padding, fieldY);
      fieldY += (addr.length > 1 ? 7 : 4);

      // COUNTRY and PHONE (side by side)
      doc.setFontSize(7);
      doc.setFont(undefined, 'normal');
      doc.text('COUNTRY', x + padding, fieldY);
      doc.text('PHONE', x + halfWidth/2, fieldY);
      fieldY += 3;
      doc.setFontSize(8);
      doc.setFont(undefined, 'bold');
      // ✅ FIX: Provide clear placeholder when country is missing (better than empty)
      const countryText = data?.country || 'TO BE COMPLETED';
      doc.text(countryText, x + padding, fieldY);
      doc.text(data?.phone || '', x + halfWidth/2, fieldY);
      fieldY += 4;

      // EMAIL
      doc.setFontSize(7);
      doc.setFont(undefined, 'normal');
      doc.text('EMAIL', x + padding, fieldY);
      fieldY += 3;
      doc.setFontSize(8);
      doc.setFont(undefined, 'bold');
      doc.text(data?.email || '', x + padding, fieldY);
      fieldY += 4;

      // TAX ID
      doc.setFontSize(7);
      doc.setFont(undefined, 'normal');
      doc.text('TAX IDENTIFICATION NUMBER', x + padding, fieldY);
      fieldY += 3;
      doc.setFontSize(8);
      doc.setFont(undefined, 'bold');
      doc.text(data?.tax_id || '', x + padding, fieldY);
    };

    // Row 1
    renderParty(2, 'CERTIFIER NAME, ADDRESS, PHONE, AND EMAIL', certificateData.certifier, PAGE.margin, y);
    renderParty(3, 'EXPORTER NAME, ADDRESS, PHONE, AND EMAIL', certificateData.exporter, PAGE.margin + halfWidth, y);

    // Horizontal line between rows
    y += partyHeight;
    doc.line(PAGE.margin, y, PAGE.width - PAGE.margin, y);

    // Row 2
    renderParty(4, 'PRODUCER NAME, ADDRESS, PHONE, AND EMAIL', certificateData.producer, PAGE.margin, y);
    renderParty(5, 'IMPORTER NAME, ADDRESS, PHONE, AND EMAIL', certificateData.importer, PAGE.margin + halfWidth, y);

    // Vertical line down middle of grid
    const gridTop = y - partyHeight * 2;
    doc.line(PAGE.margin + halfWidth, gridTop, PAGE.margin + halfWidth, y);

    y += partyHeight;
    doc.line(PAGE.margin, y, PAGE.width - PAGE.margin, y);

    // ========== PRODUCT TABLE (Sections 6-11) ==========
    const tableTop = y;
    const tableHeight = 40;

    // Column widths
    const col6Width = 80; // Description
    const col7Width = 25; // HTS
    const col8Width = 20; // Origin Criterion
    const col9Width = 20; // Producer
    const col10Width = 25; // Method
    const col11Width = 22; // Country

    let tableX = PAGE.margin;

    // Draw table outer border
    doc.rect(tableX, tableTop, contentWidth, tableHeight);

    // Draw column lines
    tableX += col6Width;
    doc.line(tableX, tableTop, tableX, tableTop + tableHeight);
    tableX += col7Width;
    doc.line(tableX, tableTop, tableX, tableTop + tableHeight);
    tableX += col8Width;
    doc.line(tableX, tableTop, tableX, tableTop + tableHeight);
    tableX += col9Width;
    doc.line(tableX, tableTop, tableX, tableTop + tableHeight);
    tableX += col10Width;
    doc.line(tableX, tableTop, tableX, tableTop + tableHeight);

    // Column headers
    const headerY = tableTop + 4;
    doc.setFontSize(6);
    doc.setFont(undefined, 'bold');
    tableX = PAGE.margin + 1;
    doc.text('6. DESCRIPTION OF GOOD(S)', tableX, headerY);
    tableX += col6Width;
    doc.text('7. HTS', tableX + 2, headerY);
    tableX += col7Width;
    doc.text('8. ORIGIN\nCRITERION', tableX + 2, headerY);
    tableX += col8Width;
    doc.text('9.\nPRODUCER', tableX + 2, headerY);
    tableX += col9Width;
    doc.text('10. METHOD\nOF QUAL.', tableX + 2, headerY);
    tableX += col10Width;
    doc.text('11. COUNTRY\nOF ORIGIN', tableX + 2, headerY);

    // Header line
    doc.line(PAGE.margin, tableTop + 8, PAGE.width - PAGE.margin, tableTop + 8);

    // Product data
    const productDesc = certificateData.product?.description || certificateData.product_description || '';
    const hsCode = certificateData.hs_classification?.code || certificateData.hs_code || '';
    const criterion = certificateData.preference_criterion || 'B';
    const isProducer = certificateData.producer_declaration?.is_producer ? 'YES' : 'NO';
    const method = certificateData.qualification_method?.method || 'TV';
    const country = certificateData.country_of_origin || '';

    let dataY = tableTop + 12;
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');

    tableX = PAGE.margin + 1;
    const descLines = wrapText(productDesc, col6Width - 2);
    doc.text(descLines, tableX, dataY);

    tableX += col6Width + 2;
    doc.text(hsCode, tableX, dataY);

    tableX += col7Width + 2;
    doc.text(criterion, tableX, dataY);

    tableX += col8Width + 2;
    doc.text(isProducer, tableX, dataY);

    tableX += col9Width + 2;
    doc.text(method, tableX, dataY);

    tableX += col10Width + 2;
    doc.text(country, tableX, dataY);

    y = tableTop + tableHeight;
    doc.line(PAGE.margin, y, PAGE.width - PAGE.margin, y);

    // ========== CERTIFICATION STATEMENT ==========
    y += 4;
    doc.setFontSize(6);
    doc.setFont(undefined, 'normal');
    const statement = wrapText('I CERTIFY THAT THE GOODS DESCRIBED IN THIS DOCUMENT QUALIFY AS ORIGINATING AND THE INFORMATION CONTAINED IN THIS DOCUMENT IS TRUE AND ACCURATE. I ASSUME RESPONSIBILITY FOR PROVING SUCH REPRESENTATIONS AND AGREE TO MAINTAIN AND PRESENT UPON REQUEST OR TO MAKE AVAILABLE DURING A VERIFICATION VISIT, DOCUMENTATION NECESSARY TO SUPPORT THIS CERTIFICATION.', contentWidth - 4);
    doc.text(statement, PAGE.margin + 2, y);

    y += statement.length * 2 + 4;
    doc.line(PAGE.margin, y, PAGE.width - PAGE.margin, y);

    y += 2;
    doc.setFontSize(7);
    doc.setFont(undefined, 'bold');
    doc.text('THIS CERTIFICATE CONSISTS OF 1 PAGES, INCLUDING ALL ATTACHMENTS.', PAGE.margin + 2, y);

    y += 4;
    doc.line(PAGE.margin, y, PAGE.width - PAGE.margin, y);

    // ========== AUTHORIZATION (Section 12) ==========
    const authTop = y;
    const authHeight = 50;

    // 12a. Signature box (left) | 12b. Company (right)
    y += 5;
    doc.setFontSize(7);
    doc.setFont(undefined, 'bold');
    doc.text('12a. AUTHORIZED SIGNATURE', PAGE.margin + 2, y);
    doc.text('12b. COMPANY', PAGE.margin + halfWidth + 2, y);

    // Signature box
    doc.rect(PAGE.margin + 2, y + 2, halfWidth - 4, 14);

    // Company name
    const companyName = certificateData.authorization?.company || certificateData.certifier?.name || '';
    doc.setFont(undefined, 'normal');
    doc.text(companyName, PAGE.margin + halfWidth + 2, y + 10);

    y += 18;
    doc.line(PAGE.margin, y, PAGE.width - PAGE.margin, y);

    // 12c. Name | 12d. Title
    y += 4;
    doc.setFont(undefined, 'bold');
    doc.text('12c. NAME', PAGE.margin + 2, y);
    doc.text('12d. TITLE', PAGE.margin + halfWidth + 2, y);

    y += 4;
    doc.setFont(undefined, 'normal');
    const signatoryName = certificateData.authorization?.signatory_name || '';
    const signatoryTitle = certificateData.authorization?.signatory_title || '';
    doc.text(signatoryName, PAGE.margin + 2, y);
    doc.text(signatoryTitle, PAGE.margin + halfWidth + 2, y);

    y += 4;
    doc.line(PAGE.margin, y, PAGE.width - PAGE.margin, y);

    // 12e. Date | 12f. Phone | 12g. Email (3 columns)
    const thirdWidth = contentWidth / 3;
    y += 4;
    doc.setFont(undefined, 'bold');
    doc.text('12e. DATE (MM/DD/YYYY)', PAGE.margin + 2, y);
    doc.text('12f. TELEPHONE NUMBER', PAGE.margin + thirdWidth + 2, y);
    doc.text('12g. EMAIL', PAGE.margin + thirdWidth * 2 + 2, y);

    y += 4;
    doc.setFont(undefined, 'normal');
    const sigDate = certificateData.authorization?.signatory_date || formatDate(today);
    const sigPhone = certificateData.authorization?.signatory_phone || '';
    const sigEmail = certificateData.authorization?.signatory_email || '';
    doc.text(sigDate, PAGE.margin + 2, y);
    doc.text(sigPhone, PAGE.margin + thirdWidth + 2, y);
    doc.text(sigEmail, PAGE.margin + thirdWidth * 2 + 2, y);

    // Vertical lines for 3 columns
    doc.line(PAGE.margin + thirdWidth, authTop + 24, PAGE.margin + thirdWidth, y + 2);
    doc.line(PAGE.margin + thirdWidth * 2, authTop + 24, PAGE.margin + thirdWidth * 2, y + 2);

    // ========== WATERMARK (with blur effect) ==========
    if (watermark && userTier === 'Trial') {
      // Create "blur" effect by layering multiple semi-transparent copies
      doc.setFont(undefined, 'bold');

      // Layer 1: Largest, most transparent (outermost blur)
      doc.setFontSize(48);
      doc.setTextColor(235, 235, 235, 0.3); // Very light, 30% opacity
      doc.text('TRIAL VERSION', PAGE.width / 2, PAGE.height / 2 - 10, {
        align: 'center',
        angle: 45
      });

      // Layer 2: Medium size, medium transparency
      doc.setFontSize(46);
      doc.setTextColor(230, 230, 230, 0.5); // Light gray, 50% opacity
      doc.text('TRIAL VERSION', PAGE.width / 2, PAGE.height / 2 - 10, {
        align: 'center',
        angle: 45
      });

      // Layer 3: Core text (sharpest)
      doc.setFontSize(45);
      doc.setTextColor(220, 220, 220); // Light gray, solid
      doc.text('TRIAL VERSION', PAGE.width / 2, PAGE.height / 2 - 10, {
        align: 'center',
        angle: 45
      });

      // Second line (smaller, blurred)
      doc.setFontSize(27);
      doc.setTextColor(235, 235, 235, 0.3);
      doc.text('NOT VALID FOR CUSTOMS', PAGE.width / 2, PAGE.height / 2 + 10, {
        align: 'center',
        angle: 45
      });

      doc.setFontSize(26);
      doc.setTextColor(230, 230, 230, 0.5);
      doc.text('NOT VALID FOR CUSTOMS', PAGE.width / 2, PAGE.height / 2 + 10, {
        align: 'center',
        angle: 45
      });

      doc.setFontSize(25);
      doc.setTextColor(220, 220, 220);
      doc.text('NOT VALID FOR CUSTOMS', PAGE.width / 2, PAGE.height / 2 + 10, {
        align: 'center',
        angle: 45
      });

      doc.setTextColor(0, 0, 0); // Reset to black
    }

    // ✅ Convert to Blob for browser download
    return doc.output('blob');

  } catch (error) {
    console.error('PDF generation error:', error);
    throw error;
  }
}
