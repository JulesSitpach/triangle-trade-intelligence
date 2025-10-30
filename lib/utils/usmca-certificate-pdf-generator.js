/**
 * USMCA Certificate PDF Generator - MATCHES EditableCertificatePreview.js EXACTLY
 *
 * This generator produces the EXACT VISUAL OUTPUT as the HTML preview:
 * - Border widths match (3px main, 2px sections, 1px internal)
 * - Font sizes match (13px, 12px, 9px, 8px)
 * - Layout matches (2x2 grid, table structure)
 * - Spacing and padding match exactly
 */

export async function generateUSMCACertificatePDF(certificateData, options = {}) {
  // ========== INPUT VALIDATION ==========
  if (!certificateData) {
    throw new Error('certificateData is required for PDF generation');
  }

  // Warn about missing critical fields
  if (!certificateData.certificate_number) {
    console.warn('⚠️ PDF Generator: Missing certificate_number - using default');
  }
  if (!certificateData.certifier && !certificateData.exporter) {
    console.warn('⚠️ PDF Generator: Missing certifier/exporter information');
  }
  if (!certificateData.product?.description && !certificateData.product_description) {
    console.warn('⚠️ PDF Generator: Missing product description');
  }

  const { watermark = false, userTier = 'Starter' } = options;

  try {
    const { jsPDF } = await import('jspdf');

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter'
    });

    // ========== LAYOUT CONSTANTS ==========
    const LAYOUT = {
      page: {
        width: 216,
        height: 279,
        margin: 10
      },
      sections: {
        header: { height: 18 },
        certifierType: { height: 20, width: 70 },
        partyInfo: { height: 48 },
        productTable: { height: 50, headerHeight: 10 },
        certStatement: { height: 16 },
        authorization: { height: 45 }
      },
      borders: {
        main: 1,      // 1mm (3px equivalent)
        section: 0.7, // 0.7mm (2px equivalent)
        internal: 0.3 // 0.3mm (1px equivalent)
      },
      colors: {
        blanketPeriod: [249, 250, 251], // Light blue-gray
        sectionHeaders: [245, 245, 245], // Light gray
        tableHeaders: [248, 248, 248]    // Light gray
      }
    };

    const contentWidth = LAYOUT.page.width - (LAYOUT.page.margin * 2);
    const halfWidth = contentWidth / 2;

    // Helper: Wrap text
    const wrapText = (text, maxWidth) => {
      if (!text) return [''];
      return doc.splitTextToSize(String(text), maxWidth);
    };

    // ========== MAIN BORDER ==========
    doc.setLineWidth(LAYOUT.borders.main);
    doc.setDrawColor(0, 0, 0);
    doc.rect(LAYOUT.page.margin, LAYOUT.page.margin, contentWidth, LAYOUT.page.height - (LAYOUT.page.margin * 2));

    // ========== HEADER ==========
    let y = LAYOUT.page.margin + 6;

    doc.setFontSize(13);
    doc.setFont(undefined, 'bold');
    doc.text('UNITED STATES MEXICO CANADA AGREEMENT (USMCA)', LAYOUT.page.width / 2, y, { align: 'center' });

    y += 6;
    doc.setFontSize(12);
    doc.text('CERTIFICATION OF ORIGIN', LAYOUT.page.width / 2, y, { align: 'center' });

    y += 6;

    // Certificate Number (bottom right of header box, before border)
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    const certNumText = certificateData.certificate_number || 'USMCA-2025-XXXXX';
    doc.text(certNumText, LAYOUT.page.width - LAYOUT.page.margin - 2, y, { align: 'right' });

    y += 2;

    // Header bottom border
    doc.setLineWidth(LAYOUT.borders.section);
    doc.line(LAYOUT.page.margin, y, LAYOUT.page.width - LAYOUT.page.margin, y);

    // ========== SECTION 1: CERTIFIER TYPE + BLANKET PERIOD ==========
    const section1Top = y;

    // Left side: Certifier Type
    doc.setLineWidth(LAYOUT.borders.internal);
    doc.rect(LAYOUT.page.margin, section1Top, LAYOUT.sections.certifierType.width, LAYOUT.sections.certifierType.height);

    doc.setFontSize(8);
    doc.setFont(undefined, 'bold');
    doc.text('1. CERTIFIER TYPE (INDICATE "X")', LAYOUT.page.margin + 2, section1Top + 4);

    // Checkboxes
    const certifierType = (certificateData.certifier?.type || certificateData.certifier_type || 'EXPORTER').toUpperCase();
    const boxSize = 3;
    let checkY = section1Top + 7;

    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');

    // IMPORTER
    doc.rect(LAYOUT.page.margin + 2, checkY, boxSize, boxSize);
    if (certifierType === 'IMPORTER') {
      doc.setFont(undefined, 'bold');
      doc.text('X', LAYOUT.page.margin + 2.8, checkY + 2.3);
      doc.setFont(undefined, 'normal');
    }
    doc.text('IMPORTER', LAYOUT.page.margin + 7, checkY + 2.3);

    checkY += 4;
    doc.rect(LAYOUT.page.margin + 2, checkY, boxSize, boxSize);
    if (certifierType === 'EXPORTER') {
      doc.setFont(undefined, 'bold');
      doc.text('X', LAYOUT.page.margin + 2.8, checkY + 2.3);
      doc.setFont(undefined, 'normal');
    }
    doc.text('EXPORTER', LAYOUT.page.margin + 7, checkY + 2.3);

    checkY += 4;
    doc.rect(LAYOUT.page.margin + 2, checkY, boxSize, boxSize);
    if (certifierType === 'PRODUCER') {
      doc.setFont(undefined, 'bold');
      doc.text('X', LAYOUT.page.margin + 2.8, checkY + 2.3);
      doc.setFont(undefined, 'normal');
    }
    doc.text('PRODUCER', LAYOUT.page.margin + 7, checkY + 2.3);

    // Right side: Blanket Period (with light blue-gray background)
    const bpX = LAYOUT.page.margin + LAYOUT.sections.certifierType.width;
    const bpWidth = contentWidth - LAYOUT.sections.certifierType.width;

    doc.setFillColor(...LAYOUT.colors.blanketPeriod);
    doc.setLineWidth(LAYOUT.borders.internal);
    doc.rect(bpX, section1Top, bpWidth, LAYOUT.sections.certifierType.height, 'FD'); // FD = Fill and Draw border

    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.text('BLANKET PERIOD', bpX + 2, section1Top + 4);
    doc.setFontSize(7);
    doc.text('(MM/DD/YYYY)', bpX + 2, section1Top + 7);

    doc.setFont(undefined, 'bold');
    doc.text('FROM:', bpX + 2, section1Top + 11);
    doc.setFont(undefined, 'normal');
    doc.text(certificateData.blanket_period?.start_date || certificateData.blanket_from || '', bpX + 14, section1Top + 11);

    doc.setFont(undefined, 'bold');
    doc.text('TO:', bpX + 2, section1Top + 15);
    doc.setFont(undefined, 'normal');
    doc.text(certificateData.blanket_period?.end_date || certificateData.blanket_to || '', bpX + 14, section1Top + 15);

    y = section1Top + LAYOUT.sections.certifierType.height;

    // Section 1 bottom border
    doc.setLineWidth(LAYOUT.borders.section);
    doc.line(LAYOUT.page.margin, y, LAYOUT.page.width - LAYOUT.page.margin, y);

    // ========== SECTIONS 2-5: 2x2 GRID ==========

    // Helper: Render party section
    const renderPartySection = (title, data, x, yStart, width, height, drawBorders) => {
      // Borders
      if (drawBorders.top) doc.line(x, yStart, x + width, yStart);
      if (drawBorders.right) doc.line(x + width, yStart, x + width, yStart + height);
      if (drawBorders.bottom) doc.line(x, yStart + height, x + width, yStart + height);
      if (drawBorders.left) doc.line(x, yStart, x, yStart + height);

      let fieldY = yStart + 4;

      // Light gray background for section title (professional look - reduced height)
      doc.setFillColor(...LAYOUT.colors.sectionHeaders);
      doc.rect(x, yStart, width, 3, 'F');

      doc.setFontSize(8);
      doc.setFont(undefined, 'bold');
      doc.text(title, x + 2, fieldY);
      fieldY += 4;

    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.text('NAME', x + 2, fieldY);
    fieldY += 3;
    doc.setFontSize(9);
    doc.text(data?.name || '', x + 2, fieldY);
    fieldY += 4;

    doc.setFontSize(8);
    doc.text('ADDRESS', x + 2, fieldY);
    fieldY += 3;
    doc.setFontSize(9);
    const addr = wrapText(data?.address || '', width - 4);
    doc.text(addr, x + 2, fieldY);
    fieldY += 8;

    doc.setFontSize(8);
    doc.text('COUNTRY', x + 2, fieldY);
    doc.text('PHONE', x + width/2, fieldY);
    fieldY += 3;
    doc.setFontSize(9);
    doc.text(data?.country || '', x + 2, fieldY);
    doc.text(data?.phone || '', x + width/2, fieldY);
    fieldY += 4;

    doc.setFontSize(8);
    doc.text('EMAIL', x + 2, fieldY);
    fieldY += 3;
    doc.setFontSize(9);
    doc.text(data?.email || '', x + 2, fieldY);
    fieldY += 4;

    doc.setFontSize(8);
    doc.text('TAX IDENTIFICATION NUMBER', x + 2, fieldY);
    fieldY += 3;
    doc.setFontSize(9);
    doc.text(data?.tax_id || '', x + 2, fieldY);
  };

    doc.setLineWidth(LAYOUT.borders.internal);

    // Row 1: Section 2 (Certifier) + Section 3 (Exporter)
    renderPartySection('2. CERTIFIER NAME, ADDRESS, PHONE, AND EMAIL',
      certificateData.certifier,
      LAYOUT.page.margin, y, halfWidth, LAYOUT.sections.partyInfo.height,
      { top: false, right: true, bottom: true, left: false });

    renderPartySection('3. EXPORTER NAME, ADDRESS, PHONE, AND EMAIL',
      certificateData.exporter,
      LAYOUT.page.margin + halfWidth, y, halfWidth, LAYOUT.sections.partyInfo.height,
      { top: false, right: false, bottom: true, left: false });

    y += LAYOUT.sections.partyInfo.height;

    // Row 2: Section 4 (Producer) + Section 5 (Importer)
    renderPartySection('4. PRODUCER NAME, ADDRESS, PHONE, AND EMAIL',
      certificateData.producer,
      LAYOUT.page.margin, y, halfWidth, LAYOUT.sections.partyInfo.height,
      { top: false, right: true, bottom: false, left: false });

    renderPartySection('5. IMPORTER NAME, ADDRESS, PHONE, AND EMAIL',
      certificateData.importer,
      LAYOUT.page.margin + halfWidth, y, halfWidth, LAYOUT.sections.partyInfo.height,
      { top: false, right: false, bottom: false, left: false });

    y += LAYOUT.sections.partyInfo.height;

    // Sections 2-5 bottom border
    doc.setLineWidth(LAYOUT.borders.section);
    doc.line(LAYOUT.page.margin, y, LAYOUT.page.width - LAYOUT.page.margin, y);

    // ========== SECTIONS 6-11: PRODUCT TABLE ==========
    const tableTop = y;

    // Column widths (matching HTML table percentages)
    const col6Width = contentWidth * 0.40; // 40%
    const col7Width = contentWidth * 0.12; // 12%
    const col8Width = contentWidth * 0.12; // 12%
    const col9Width = contentWidth * 0.08; // 8%
    const col10Width = contentWidth * 0.15; // 15%
    const col11Width = contentWidth * 0.13; // 13%

    const col6X = LAYOUT.page.margin;
    const col7X = col6X + col6Width;
    const col8X = col7X + col7Width;
    const col9X = col8X + col8Width;
    const col10X = col9X + col9Width;
    const col11X = col10X + col10Width;

    doc.setLineWidth(LAYOUT.borders.internal);

    // Table outer border
    doc.rect(LAYOUT.page.margin, tableTop, contentWidth, LAYOUT.sections.productTable.height);

    // Vertical column lines
    doc.line(col7X, tableTop, col7X, tableTop + LAYOUT.sections.productTable.height);
    doc.line(col8X, tableTop, col8X, tableTop + LAYOUT.sections.productTable.height);
    doc.line(col9X, tableTop, col9X, tableTop + LAYOUT.sections.productTable.height);
    doc.line(col10X, tableTop, col10X, tableTop + LAYOUT.sections.productTable.height);
    doc.line(col11X, tableTop, col11X, tableTop + LAYOUT.sections.productTable.height);

    // Light gray background for table headers (professional look)
    doc.setFillColor(...LAYOUT.colors.tableHeaders);
    doc.rect(LAYOUT.page.margin, tableTop, contentWidth, LAYOUT.sections.productTable.headerHeight, 'F');

    doc.line(LAYOUT.page.margin, tableTop + LAYOUT.sections.productTable.headerHeight, LAYOUT.page.width - LAYOUT.page.margin, tableTop + LAYOUT.sections.productTable.headerHeight);

    // Table headers
    doc.setFontSize(8);
    doc.setFont(undefined, 'bold');
    doc.text('6. DESCRIPTION OF GOOD(S)', col6X + 2, tableTop + 5);
    doc.text('7.', col7X + 2, tableTop + 3);
    doc.text('HTS', col7X + 2, tableTop + 6);
    doc.text('8. ORIGIN', col8X + 2, tableTop + 3);
    doc.text('CRITERION', col8X + 2, tableTop + 6);
    doc.text('9. PRODUCER', col9X + 1, tableTop + 3);
    doc.text('(YES/NO)', col9X + 1, tableTop + 6);
    doc.text('10. METHOD OF', col10X + 2, tableTop + 3);
    doc.text('QUALIFICATION', col10X + 2, tableTop + 6);
    doc.text('11. COUNTRY', col11X + 2, tableTop + 3);
    doc.text('OF ORIGIN', col11X + 2, tableTop + 6);

    // Data row
    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);
    const dataY = tableTop + LAYOUT.sections.productTable.headerHeight + 4;

    // Field 6: Description
    const desc = wrapText(certificateData.product?.description || certificateData.product_description || '', col6Width - 4);
    doc.text(desc, col6X + 2, dataY);

    // Field 7: HS Code
    const hsCode = certificateData.hs_classification?.code || certificateData.product?.hs_code || certificateData.hs_code || '';
    doc.text(hsCode, col7X + 2, dataY);

    // Field 8: Origin Criterion
    doc.text(certificateData.preference_criterion || certificateData.origin_criterion || '', col8X + 6, dataY);

    // Field 9: Producer
    const isProducer = certificateData.producer_declaration?.is_producer || certificateData.is_producer;
    doc.text(isProducer ? 'YES' : 'NO', col9X + 4, dataY);

    // Field 10: Method
    doc.text(certificateData.qualification_method?.method || certificateData.qualification_method || 'RVC', col10X + 2, dataY);

    // Field 11: Country
    doc.text(certificateData.country_of_origin || '', col11X + 2, dataY);

    y = tableTop + LAYOUT.sections.productTable.height;

    // Table bottom border
    doc.setLineWidth(LAYOUT.borders.section);
    doc.line(LAYOUT.page.margin, y, LAYOUT.page.width - LAYOUT.page.margin, y);

    // ========== CERTIFICATION STATEMENT ==========
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    const certText = 'I CERTIFY THAT THE GOODS DESCRIBED IN THIS DOCUMENT QUALIFY AS ORIGINATING AND THE INFORMATION CONTAINED IN THIS DOCUMENT IS TRUE AND ACCURATE. I ASSUME RESPONSIBILITY FOR PROVING SUCH REPRESENTATIONS AND AGREE TO MAINTAIN AND PRESENT UPON REQUEST OR TO MAKE AVAILABLE DURING A VERIFICATION VISIT, DOCUMENTATION NECESSARY TO SUPPORT THIS CERTIFICATION';
    const wrappedCert = wrapText(certText, contentWidth - 4);
    doc.text(wrappedCert, LAYOUT.page.margin + 2, y + 4);

    y += LAYOUT.sections.certStatement.height;

    // Statement bottom border
    doc.setLineWidth(LAYOUT.borders.section);
    doc.line(LAYOUT.page.margin, y, LAYOUT.page.width - LAYOUT.page.margin, y);

    // ========== SECTION 12: AUTHORIZATION ==========
    const authTop = y;

    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.text('THIS CERTIFICATE CONSISTS OF 1 PAGES, INCLUDING ALL ATTACHMENTS.', LAYOUT.page.margin + 2, authTop + 4);

    let authY = authTop + 8;

    // 12a & 12b (side by side)
    doc.setFontSize(8);
    doc.text('12a. AUTHORIZED SIGNATURE', LAYOUT.page.margin + 2, authY);
    doc.text('12b. COMPANY', LAYOUT.page.margin + halfWidth + 2, authY);
    authY += 3;
    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);
    // Signature box (left)
    doc.rect(LAYOUT.page.margin + 2, authY, halfWidth - 4, 10);
    // Company name (right)
    doc.text(certificateData.exporter?.name || '', LAYOUT.page.margin + halfWidth + 2, authY + 4);
    authY += 12;

    // Horizontal line
    doc.setLineWidth(LAYOUT.borders.internal);
    doc.line(LAYOUT.page.margin, authY, LAYOUT.page.width - LAYOUT.page.margin, authY);
    authY += 3;

    // 12c & 12d (side by side)
    doc.setFontSize(8);
    doc.setFont(undefined, 'bold');
    doc.text('12c. NAME', LAYOUT.page.margin + 2, authY);
    doc.text('12d. TITLE', LAYOUT.page.margin + halfWidth + 2, authY);
    authY += 3;
    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);
    doc.text(certificateData.authorization?.signatory_name || certificateData.signatory_name || '', LAYOUT.page.margin + 2, authY);
    doc.text(certificateData.authorization?.signatory_title || certificateData.signatory_title || '', LAYOUT.page.margin + halfWidth + 2, authY);
    authY += 5;

    // Horizontal line
    doc.setLineWidth(LAYOUT.borders.internal);
    doc.line(LAYOUT.page.margin, authY, LAYOUT.page.width - LAYOUT.page.margin, authY);
    authY += 3;

    // 12e, 12f, 12g (side by side layout)
    doc.setFontSize(8);
    doc.setFont(undefined, 'bold');
    doc.text('12e. DATE (MM/DD/YYYY)', LAYOUT.page.margin + 2, authY);
    doc.text('12f. TELEPHONE NUMBER', LAYOUT.page.margin + 60, authY);
    authY += 3;
    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);
    doc.text(certificateData.authorization?.signature_date || certificateData.signature_date || new Date().toLocaleDateString('en-US'), LAYOUT.page.margin + 2, authY);
    doc.text(certificateData.authorization?.phone || certificateData.signatory_phone || '', LAYOUT.page.margin + 60, authY);
    authY += 5;

    // 12g EMAIL (full width on its own line)
    doc.setFontSize(8);
    doc.setFont(undefined, 'bold');
    doc.text('12g. EMAIL', LAYOUT.page.margin + 2, authY);
    authY += 3;
    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);
    doc.text(certificateData.authorization?.email || certificateData.signatory_email || '', LAYOUT.page.margin + 2, authY);

    y = authTop + LAYOUT.sections.authorization.height;

    // Section 12 bottom border
    doc.setLineWidth(LAYOUT.borders.section);
    doc.line(LAYOUT.page.margin, y, LAYOUT.page.width - LAYOUT.page.margin, y);

    // ========== FOOTER ==========
    doc.setFontSize(8);
    doc.setFont(undefined, 'bold');
    doc.text('USMCA CERTIFICATE V3', LAYOUT.page.width - LAYOUT.page.margin - 30, y + 4, { align: 'right' });

    // ========== WATERMARK ==========
    if (watermark || userTier === 'Trial' || userTier === 'trial' || userTier === 'free') {
      doc.saveGraphicsState();
      doc.setTextColor(200, 200, 200);
      doc.setFontSize(60);
      doc.setFont(undefined, 'bold');
      doc.text('TRIAL - NOT OFFICIAL', LAYOUT.page.width / 2, LAYOUT.page.height / 2, {
        align: 'center',
        angle: 45
      });
      doc.restoreGraphicsState();
    }

    // Return PDF blob
    console.log('✅ PDF generation successful');
    const pdfBlob = doc.output('blob');
    const filename = watermark ? 'USMCA_Certificate_PREVIEW.pdf' : `USMCA-Certificate-${certificateData.certificate_number || 'DRAFT'}.pdf`;
    pdfBlob.filename = filename;

    return pdfBlob;

  } catch (error) {
    console.error('❌ PDF generation failed:', error);
    console.error('Stack trace:', error.stack);
    throw new Error(`PDF generation failed: ${error.message}`);
  }
}
