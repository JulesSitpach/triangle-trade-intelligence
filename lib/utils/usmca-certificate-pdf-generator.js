/**
 * USMCA Certificate PDF Generator - Production-Ready Professional Layout
 *
 * This generator produces a polished, production-ready certificate with:
 * - Consistent spacing and alignment throughout (3mm label gap, 4.5mm value gap)
 * - Centered table columns for clean scannable layout
 * - Subtle alternating backgrounds for visual hierarchy (sections 2 & 4)
 * - Light gray section headers for professional appearance
 * - Bold values with normal labels for clear data emphasis
 * - Clean grid borders (light gray, 0.3mm) around all party sections
 * - Border widths: 1mm main, 0.7mm sections, 0.3mm internal
 * - Font sizes: 13px header, 12px subheader, 9px data, 8px labels
 * - Layout: 2x2 party grid, 6-column product table
 *
 * October 30, 2025 - Final polish: clean grid borders, professional appearance
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
        authorization: { height: 60 } // Increased from 45 for better spacing
      },
      borders: {
        main: 1,      // 1mm (3px equivalent)
        section: 0.7, // 0.7mm (2px equivalent)
        internal: 0.3 // 0.3mm (1px equivalent)
      },
      colors: {
        blanketPeriod: [249, 250, 251], // Light blue-gray
        sectionHeaders: [245, 245, 245], // Light gray
        tableHeaders: [248, 248, 248],   // Light gray
        alternateSection: [252, 252, 252] // Very light gray for alternating sections
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
    doc.text('1. CERTIFIER TYPE (INDICATE "X")', LAYOUT.page.margin + 3, section1Top + 5);

    // Checkboxes
    const certifierType = (certificateData.certifier?.type || certificateData.certifier_type || 'EXPORTER').toUpperCase();
    const boxSize = 3;
    let checkY = section1Top + 9;

    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');

    // IMPORTER
    doc.rect(LAYOUT.page.margin + 3, checkY, boxSize, boxSize);
    if (certifierType === 'IMPORTER') {
      doc.setFont(undefined, 'bold');
      doc.text('X', LAYOUT.page.margin + 3.8, checkY + 2.3);
      doc.setFont(undefined, 'normal');
    }
    doc.text('IMPORTER', LAYOUT.page.margin + 8, checkY + 2.3);

    checkY += 4.5;
    doc.rect(LAYOUT.page.margin + 3, checkY, boxSize, boxSize);
    if (certifierType === 'EXPORTER') {
      doc.setFont(undefined, 'bold');
      doc.text('X', LAYOUT.page.margin + 3.8, checkY + 2.3);
      doc.setFont(undefined, 'normal');
    }
    doc.text('EXPORTER', LAYOUT.page.margin + 8, checkY + 2.3);

    checkY += 4.5;
    doc.rect(LAYOUT.page.margin + 3, checkY, boxSize, boxSize);
    if (certifierType === 'PRODUCER') {
      doc.setFont(undefined, 'bold');
      doc.text('X', LAYOUT.page.margin + 3.8, checkY + 2.3);
      doc.setFont(undefined, 'normal');
    }
    doc.text('PRODUCER', LAYOUT.page.margin + 8, checkY + 2.3);

    // Right side: Blanket Period (with light blue-gray background)
    const bpX = LAYOUT.page.margin + LAYOUT.sections.certifierType.width;
    const bpWidth = contentWidth - LAYOUT.sections.certifierType.width;

    doc.setFillColor(...LAYOUT.colors.blanketPeriod);
    doc.setLineWidth(LAYOUT.borders.internal);
    doc.rect(bpX, section1Top, bpWidth, LAYOUT.sections.certifierType.height, 'FD'); // FD = Fill and Draw border

    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.text('BLANKET PERIOD', bpX + 3, section1Top + 5);
    doc.setFontSize(7);
    doc.text('(MM/DD/YYYY)', bpX + 3, section1Top + 8);

    doc.setFont(undefined, 'bold');
    doc.text('FROM:', bpX + 3, section1Top + 12);
    doc.setFont(undefined, 'normal');
    doc.text(certificateData.blanket_period?.start_date || certificateData.blanket_from || '', bpX + 15, section1Top + 12);

    doc.setFont(undefined, 'bold');
    doc.text('TO:', bpX + 3, section1Top + 16);
    doc.setFont(undefined, 'normal');
    doc.text(certificateData.blanket_period?.end_date || certificateData.blanket_to || '', bpX + 15, section1Top + 16);

    y = section1Top + LAYOUT.sections.certifierType.height;

    // Section 1 bottom border
    doc.setLineWidth(LAYOUT.borders.section);
    doc.line(LAYOUT.page.margin, y, LAYOUT.page.width - LAYOUT.page.margin, y);

    // ========== SECTIONS 2-5: 2x2 GRID ==========

    // Helper: Render party section
    const renderPartySection = (title, data, x, yStart, width, height, drawBorders, useAlternateBackground = false) => {
      // Optional subtle background for visual separation
      if (useAlternateBackground) {
        doc.setFillColor(...LAYOUT.colors.alternateSection);
        doc.rect(x, yStart, width, height, 'F');
      }

      // Thin borders for clean grid appearance
      doc.setLineWidth(LAYOUT.borders.internal);
      doc.setDrawColor(200, 200, 200); // Light gray for subtle borders

      // Borders (draw all borders for clean grid)
      if (drawBorders.top) doc.line(x, yStart, x + width, yStart);
      if (drawBorders.right) doc.line(x + width, yStart, x + width, yStart + height);
      if (drawBorders.bottom) doc.line(x, yStart + height, x + width, yStart + height);
      if (drawBorders.left) doc.line(x, yStart, x, yStart + height);

      // Reset to black for text
      doc.setDrawColor(0, 0, 0);

      // CONSISTENT SPACING CONSTANTS
      const FIELD_SPACING = {
        headerHeight: 5.5,    // Section header background height
        labelGap: 3,          // Gap between label and value
        valueGap: 4.5,        // Gap after value before next label
        padding: 3            // Left/right padding
      };

      let fieldY = yStart + 4;

      // Light gray background for section title (professional look)
      doc.setFillColor(...LAYOUT.colors.sectionHeaders);
      doc.rect(x, yStart, width, FIELD_SPACING.headerHeight, 'F');

      doc.setFontSize(8);
      doc.setFont(undefined, 'bold');
      doc.text(title, x + FIELD_SPACING.padding, fieldY);
      fieldY += FIELD_SPACING.headerHeight;

    // NAME field
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.text('NAME', x + FIELD_SPACING.padding, fieldY);
    fieldY += FIELD_SPACING.labelGap;
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.text(data?.name || '', x + FIELD_SPACING.padding, fieldY);
    fieldY += FIELD_SPACING.valueGap;

    // ADDRESS field
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.text('ADDRESS', x + FIELD_SPACING.padding, fieldY);
    fieldY += FIELD_SPACING.labelGap;
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    const addr = wrapText(data?.address || '', width - (FIELD_SPACING.padding * 2));
    doc.text(addr, x + FIELD_SPACING.padding, fieldY);
    fieldY += (addr.length > 1 ? 7 : 4.5); // More space for wrapped addresses

    // COUNTRY + PHONE (side by side)
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.text('COUNTRY', x + FIELD_SPACING.padding, fieldY);
    doc.text('PHONE', x + width/2, fieldY);
    fieldY += FIELD_SPACING.labelGap;
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.text(data?.country || '', x + FIELD_SPACING.padding, fieldY);
    doc.text(data?.phone || '', x + width/2, fieldY);
    fieldY += FIELD_SPACING.valueGap;

    // EMAIL field
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.text('EMAIL', x + FIELD_SPACING.padding, fieldY);
    fieldY += FIELD_SPACING.labelGap;
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.text(data?.email || '', x + FIELD_SPACING.padding, fieldY);
    fieldY += FIELD_SPACING.valueGap;

    // TAX ID field
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.text('TAX IDENTIFICATION NUMBER', x + FIELD_SPACING.padding, fieldY);
    fieldY += FIELD_SPACING.labelGap;
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.text(data?.tax_id || '', x + FIELD_SPACING.padding, fieldY);
  };

    doc.setLineWidth(LAYOUT.borders.internal);

    // Row 1: Section 2 (Certifier - with subtle background) + Section 3 (Exporter)
    renderPartySection('2. CERTIFIER NAME, ADDRESS, PHONE, AND EMAIL',
      certificateData.certifier,
      LAYOUT.page.margin, y, halfWidth, LAYOUT.sections.partyInfo.height,
      { top: true, right: true, bottom: true, left: true }, // All borders for clean grid
      true); // Use alternate background

    renderPartySection('3. EXPORTER NAME, ADDRESS, PHONE, AND EMAIL',
      certificateData.exporter,
      LAYOUT.page.margin + halfWidth, y, halfWidth, LAYOUT.sections.partyInfo.height,
      { top: true, right: true, bottom: true, left: true }, // All borders for clean grid
      false); // No alternate background

    y += LAYOUT.sections.partyInfo.height;

    // Row 2: Section 4 (Producer - with subtle background) + Section 5 (Importer)
    renderPartySection('4. PRODUCER NAME, ADDRESS, PHONE, AND EMAIL',
      certificateData.producer,
      LAYOUT.page.margin, y, halfWidth, LAYOUT.sections.partyInfo.height,
      { top: true, right: true, bottom: true, left: true }, // All borders for clean grid
      true); // Use alternate background

    renderPartySection('5. IMPORTER NAME, ADDRESS, PHONE, AND EMAIL',
      certificateData.importer,
      LAYOUT.page.margin + halfWidth, y, halfWidth, LAYOUT.sections.partyInfo.height,
      { top: true, right: true, bottom: true, left: true }, // All borders for clean grid
      false); // No alternate background

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

    // Table headers (centered in columns for professional look)
    doc.setFontSize(8);
    doc.setFont(undefined, 'bold');

    // Column 6: Description (left-aligned)
    doc.text('6. DESCRIPTION OF GOOD(S)', col6X + 3, tableTop + 6);

    // Column 7: HTS (centered)
    const col7Center = col7X + (col7Width / 2);
    doc.text('7. HTS', col7Center, tableTop + 5.5, { align: 'center' });

    // Column 8: Origin Criterion (centered)
    const col8Center = col8X + (col8Width / 2);
    doc.text('8. ORIGIN', col8Center, tableTop + 4.5, { align: 'center' });
    doc.text('CRITERION', col8Center, tableTop + 7.5, { align: 'center' });

    // Column 9: Producer (centered)
    const col9Center = col9X + (col9Width / 2);
    doc.text('9.', col9Center, tableTop + 4, { align: 'center' });
    doc.text('PRODUCER', col9Center, tableTop + 7, { align: 'center' });

    // Column 10: Method (centered)
    const col10Center = col10X + (col10Width / 2);
    doc.text('10. METHOD', col10Center, tableTop + 4.5, { align: 'center' });
    doc.text('OF QUAL.', col10Center, tableTop + 7.5, { align: 'center' });

    // Column 11: Country (centered)
    const col11Center = col11X + (col11Width / 2);
    doc.text('11. COUNTRY', col11Center, tableTop + 4.5, { align: 'center' });
    doc.text('OF ORIGIN', col11Center, tableTop + 7.5, { align: 'center' });

    // Data row (centered in columns)
    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);
    const dataY = tableTop + LAYOUT.sections.productTable.headerHeight + 6;

    // Field 6: Description (left-aligned)
    const desc = wrapText(certificateData.product?.description || certificateData.product_description || '', col6Width - 6);
    doc.text(desc, col6X + 3, dataY);

    // Field 7: HS Code (centered)
    const hsCode = certificateData.hs_classification?.code || certificateData.product?.hs_code || certificateData.hs_code || '';
    doc.text(hsCode, col7Center, dataY, { align: 'center' });

    // Field 8: Origin Criterion (centered)
    doc.text(certificateData.preference_criterion || certificateData.origin_criterion || '', col8Center, dataY, { align: 'center' });

    // Field 9: Producer (centered)
    const isProducer = certificateData.producer_declaration?.is_producer || certificateData.is_producer;
    doc.text(isProducer ? 'YES' : 'NO', col9Center, dataY, { align: 'center' });

    // Field 10: Method (centered)
    doc.text(certificateData.qualification_method?.method || certificateData.qualification_method || 'RVC', col10Center, dataY, { align: 'center' });

    // Field 11: Country (centered)
    doc.text(certificateData.country_of_origin || '', col11Center, dataY, { align: 'center' });

    y = tableTop + LAYOUT.sections.productTable.height;

    // Table bottom border
    doc.setLineWidth(LAYOUT.borders.section);
    doc.line(LAYOUT.page.margin, y, LAYOUT.page.width - LAYOUT.page.margin, y);

    // ========== CERTIFICATION STATEMENT ==========
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    const certText = 'I CERTIFY THAT THE GOODS DESCRIBED IN THIS DOCUMENT QUALIFY AS ORIGINATING AND THE INFORMATION CONTAINED IN THIS DOCUMENT IS TRUE AND ACCURATE. I ASSUME RESPONSIBILITY FOR PROVING SUCH REPRESENTATIONS AND AGREE TO MAINTAIN AND PRESENT UPON REQUEST OR TO MAKE AVAILABLE DURING A VERIFICATION VISIT, DOCUMENTATION NECESSARY TO SUPPORT THIS CERTIFICATION';
    const wrappedCert = wrapText(certText, contentWidth - 6);
    doc.text(wrappedCert, LAYOUT.page.margin + 3, y + 5);

    y += LAYOUT.sections.certStatement.height;

    // Statement bottom border
    doc.setLineWidth(LAYOUT.borders.section);
    doc.line(LAYOUT.page.margin, y, LAYOUT.page.width - LAYOUT.page.margin, y);

    // ========== SECTION 12: AUTHORIZATION (IMPROVED SPACING) ==========
    const authTop = y;

    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.text('THIS CERTIFICATE CONSISTS OF 1 PAGES, INCLUDING ALL ATTACHMENTS.', LAYOUT.page.margin + 3, authTop + 5);

    let authY = authTop + 12; // More breathing room at top

    // 12a & 12b (side by side with better spacing)
    doc.setFontSize(8);
    doc.text('12a. AUTHORIZED SIGNATURE', LAYOUT.page.margin + 3, authY);
    doc.text('12b. COMPANY', LAYOUT.page.margin + halfWidth + 3, authY);
    authY += 6; // More space before boxes
    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);
    // Taller signature box (left) - 14mm instead of 10mm
    doc.setLineWidth(LAYOUT.borders.internal);
    doc.rect(LAYOUT.page.margin + 3, authY, halfWidth - 6, 14);
    // Company name (right) - centered vertically in box
    doc.text(certificateData.exporter?.name || '', LAYOUT.page.margin + halfWidth + 3, authY + 7);
    authY += 18; // More space after signature box

    // Horizontal line with padding
    doc.setLineWidth(LAYOUT.borders.internal);
    doc.line(LAYOUT.page.margin, authY, LAYOUT.page.width - LAYOUT.page.margin, authY);
    authY += 6; // More space after line

    // 12c & 12d (side by side with better spacing)
    doc.setFontSize(8);
    doc.setFont(undefined, 'bold');
    doc.text('12c. NAME', LAYOUT.page.margin + 3, authY);
    doc.text('12d. TITLE', LAYOUT.page.margin + halfWidth + 3, authY);
    authY += 5; // More space before values
    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);
    doc.text(certificateData.authorization?.signatory_name || certificateData.signatory_name || '', LAYOUT.page.margin + 3, authY);
    doc.text(certificateData.authorization?.signatory_title || certificateData.signatory_title || '', LAYOUT.page.margin + halfWidth + 3, authY);
    authY += 8; // More space after values

    // Horizontal line with padding
    doc.setLineWidth(LAYOUT.borders.internal);
    doc.line(LAYOUT.page.margin, authY, LAYOUT.page.width - LAYOUT.page.margin, authY);
    authY += 6; // More space after line

    // 12e, 12f, 12g (properly spaced thirds layout)
    const thirdWidth = contentWidth / 3;
    doc.setFontSize(8);
    doc.setFont(undefined, 'bold');
    doc.text('12e. DATE (MM/DD/YYYY)', LAYOUT.page.margin + 3, authY);
    doc.text('12f. TELEPHONE NUMBER', LAYOUT.page.margin + thirdWidth, authY);
    doc.text('12g. EMAIL', LAYOUT.page.margin + (thirdWidth * 2), authY);
    authY += 5; // More space before values
    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);
    doc.text(certificateData.authorization?.signature_date || certificateData.signature_date || new Date().toLocaleDateString('en-US'), LAYOUT.page.margin + 3, authY);
    doc.text(certificateData.authorization?.phone || certificateData.signatory_phone || '', LAYOUT.page.margin + thirdWidth, authY);
    doc.text(certificateData.authorization?.email || certificateData.signatory_email || '', LAYOUT.page.margin + (thirdWidth * 2), authY);

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
