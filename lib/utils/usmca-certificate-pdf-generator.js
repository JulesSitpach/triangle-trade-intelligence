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
  const { watermark = false, userTier = 'Starter' } = options;
  const { jsPDF } = await import('jspdf');

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter'
  });

  // Page dimensions
  const pageWidth = 216;
  const pageHeight = 279;
  const margin = 10;
  const contentWidth = 196;

  // Helper: Wrap text
  const wrapText = (text, maxWidth) => {
    if (!text) return [''];
    return doc.splitTextToSize(String(text), maxWidth);
  };

  // ========== MAIN BORDER (3px = ~1mm) ==========
  doc.setLineWidth(1);
  doc.setDrawColor(0, 0, 0);
  doc.rect(margin, margin, contentWidth, pageHeight - (margin * 2));

  // ========== CERTIFICATE NUMBER (Top Right Corner) ==========
  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  const certNumText = certificateData.certificate_number || 'USMCA-2025-XXXXX';
  const certNumWidth = doc.getTextWidth(certNumText) + 8;
  const certNumX = pageWidth - margin - certNumWidth;
  const certNumY = margin + 2;
  doc.setLineWidth(0.5);
  doc.rect(certNumX, certNumY, certNumWidth, 6);
  doc.text(certNumText, certNumX + certNumWidth/2, certNumY + 4.5, { align: 'center' });

  // ========== HEADER (Centered, clear space below cert number) ==========
  let y = margin + 10;

  doc.setFontSize(13);
  doc.setFont(undefined, 'bold');
  doc.text('UNITED STATES MEXICO CANADA AGREEMENT (USMCA)', pageWidth / 2, y, { align: 'center' });

  y += 6;
  doc.setFontSize(12);
  doc.text('CERTIFICATION OF ORIGIN', pageWidth / 2, y, { align: 'center' });

  y += 8;

  // Header bottom border
  doc.setLineWidth(0.7); // 2px
  doc.line(margin, y, pageWidth - margin, y);

  // ========== SECTION 1: CERTIFIER TYPE + BLANKET PERIOD ==========
  const section1Top = y;
  const section1Height = 20;

  // Left side: Certifier Type
  const certTypeWidth = 70;
  doc.setLineWidth(0.3); // 1px internal borders
  doc.rect(margin, section1Top, certTypeWidth, section1Height);

  doc.setFontSize(8);
  doc.setFont(undefined, 'bold');
  doc.text('1. CERTIFIER TYPE (INDICATE "X")', margin + 2, section1Top + 4);

  // Checkboxes
  const certifierType = (certificateData.certifier?.type || certificateData.certifier_type || 'EXPORTER').toUpperCase();
  const boxSize = 3;
  let checkY = section1Top + 7;

  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');

  // IMPORTER
  doc.rect(margin + 2, checkY, boxSize, boxSize);
  if (certifierType === 'IMPORTER') {
    doc.setFont(undefined, 'bold');
    doc.text('X', margin + 2.8, checkY + 2.3);
    doc.setFont(undefined, 'normal');
  }
  doc.text('IMPORTER', margin + 7, checkY + 2.3);

  checkY += 4;
  doc.rect(margin + 2, checkY, boxSize, boxSize);
  if (certifierType === 'EXPORTER') {
    doc.setFont(undefined, 'bold');
    doc.text('X', margin + 2.8, checkY + 2.3);
    doc.setFont(undefined, 'normal');
  }
  doc.text('EXPORTER', margin + 7, checkY + 2.3);

  checkY += 4;
  doc.rect(margin + 2, checkY, boxSize, boxSize);
  if (certifierType === 'PRODUCER') {
    doc.setFont(undefined, 'bold');
    doc.text('X', margin + 2.8, checkY + 2.3);
    doc.setFont(undefined, 'normal');
  }
  doc.text('PRODUCER', margin + 7, checkY + 2.3);

  // Right side: Blanket Period (with gray background)
  const bpX = margin + certTypeWidth;
  const bpWidth = contentWidth - certTypeWidth;

  // Light gray background (#f9fafb ≈ RGB 249,250,251) - matches preview styling
  doc.setFillColor(249, 250, 251);
  doc.setLineWidth(0.3);
  doc.rect(bpX, section1Top, bpWidth, section1Height, 'FD'); // FD = Fill and Draw border

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

  y = section1Top + section1Height;

  // Section 1 bottom border
  doc.setLineWidth(0.7); // 2px
  doc.line(margin, y, pageWidth - margin, y);

  // ========== SECTIONS 2-5: 2x2 GRID ==========
  const halfWidth = contentWidth / 2;
  const partyHeight = 48;

  // Helper: Render party section
  const renderPartySection = (title, data, x, yStart, width, height, drawBorders) => {
    // Borders
    if (drawBorders.top) doc.line(x, yStart, x + width, yStart);
    if (drawBorders.right) doc.line(x + width, yStart, x + width, yStart + height);
    if (drawBorders.bottom) doc.line(x, yStart + height, x + width, yStart + height);
    if (drawBorders.left) doc.line(x, yStart, x, yStart + height);

    let fieldY = yStart + 4;

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

  doc.setLineWidth(0.3); // 1px internal borders

  // Row 1: Section 2 (Certifier) + Section 3 (Exporter)
  renderPartySection('2. CERTIFIER NAME, ADDRESS, PHONE, AND EMAIL',
    certificateData.certifier,
    margin, y, halfWidth, partyHeight,
    { top: false, right: true, bottom: true, left: false });

  renderPartySection('3. EXPORTER NAME, ADDRESS, PHONE, AND EMAIL',
    certificateData.exporter,
    margin + halfWidth, y, halfWidth, partyHeight,
    { top: false, right: false, bottom: true, left: false });

  y += partyHeight;

  // Row 2: Section 4 (Producer) + Section 5 (Importer)
  renderPartySection('4. PRODUCER NAME, ADDRESS, PHONE, AND EMAIL',
    certificateData.producer,
    margin, y, halfWidth, partyHeight,
    { top: false, right: true, bottom: false, left: false });

  renderPartySection('5. IMPORTER NAME, ADDRESS, PHONE, AND EMAIL',
    certificateData.importer,
    margin + halfWidth, y, halfWidth, partyHeight,
    { top: false, right: false, bottom: false, left: false });

  y += partyHeight;

  // Sections 2-5 bottom border
  doc.setLineWidth(0.7); // 2px
  doc.line(margin, y, pageWidth - margin, y);

  // ========== SECTIONS 6-11: PRODUCT TABLE ==========
  const tableTop = y;
  const tableHeight = 50;

  // Column widths (matching HTML table percentages)
  const col6Width = contentWidth * 0.40; // 40%
  const col7Width = contentWidth * 0.12; // 12%
  const col8Width = contentWidth * 0.12; // 12%
  const col9Width = contentWidth * 0.08; // 8%
  const col10Width = contentWidth * 0.15; // 15%
  const col11Width = contentWidth * 0.13; // 13%

  const col6X = margin;
  const col7X = col6X + col6Width;
  const col8X = col7X + col7Width;
  const col9X = col8X + col8Width;
  const col10X = col9X + col9Width;
  const col11X = col10X + col10Width;

  doc.setLineWidth(0.3); // 1px table borders

  // Table outer border
  doc.rect(margin, tableTop, contentWidth, tableHeight);

  // Vertical column lines
  doc.line(col7X, tableTop, col7X, tableTop + tableHeight);
  doc.line(col8X, tableTop, col8X, tableTop + tableHeight);
  doc.line(col9X, tableTop, col9X, tableTop + tableHeight);
  doc.line(col10X, tableTop, col10X, tableTop + tableHeight);
  doc.line(col11X, tableTop, col11X, tableTop + tableHeight);

  // Header row (height ~10mm)
  const headerHeight = 10;
  doc.line(margin, tableTop + headerHeight, pageWidth - margin, tableTop + headerHeight);

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
  const dataY = tableTop + headerHeight + 4;

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

  y = tableTop + tableHeight;

  // Table bottom border
  doc.setLineWidth(0.7); // 2px
  doc.line(margin, y, pageWidth - margin, y);

  // ========== CERTIFICATION STATEMENT ==========
  const certStatementHeight = 16;
  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  const certText = 'I CERTIFY THAT THE GOODS DESCRIBED IN THIS DOCUMENT QUALIFY AS ORIGINATING AND THE INFORMATION CONTAINED IN THIS DOCUMENT IS TRUE AND ACCURATE. I ASSUME RESPONSIBILITY FOR PROVING SUCH REPRESENTATIONS AND AGREE TO MAINTAIN AND PRESENT UPON REQUEST OR TO MAKE AVAILABLE DURING A VERIFICATION VISIT, DOCUMENTATION NECESSARY TO SUPPORT THIS CERTIFICATION';
  const wrappedCert = wrapText(certText, contentWidth - 4);
  doc.text(wrappedCert, margin + 2, y + 4);

  y += certStatementHeight;

  // Statement bottom border
  doc.setLineWidth(0.7); // 2px
  doc.line(margin, y, pageWidth - margin, y);

  // ========== SECTION 12: AUTHORIZATION ==========
  const authTop = y;
  const authHeight = 36;

  doc.setFontSize(9);
  doc.setFont(undefined, 'bold');
  doc.text('THIS CERTIFICATE CONSISTS OF 1 PAGES, INCLUDING ALL ATTACHMENTS.', margin + 2, authTop + 4);

  let authY = authTop + 8;

  // 12a & 12b (side by side)
  doc.setFontSize(8);
  doc.text('12a. AUTHORIZED SIGNATURE', margin + 2, authY);
  doc.text('12b. COMPANY', margin + halfWidth + 2, authY);
  authY += 3;
  doc.setFont(undefined, 'normal');
  doc.setFontSize(9);
  // Signature box (left)
  doc.rect(margin + 2, authY, halfWidth - 4, 10);
  // Company name (right)
  doc.text(certificateData.exporter?.name || '', margin + halfWidth + 2, authY + 4);
  authY += 12;

  // Horizontal line
  doc.setLineWidth(0.3);
  doc.line(margin, authY, pageWidth - margin, authY);
  authY += 3;

  // 12c & 12d (side by side)
  doc.setFontSize(8);
  doc.setFont(undefined, 'bold');
  doc.text('12c. NAME', margin + 2, authY);
  doc.text('12d. TITLE', margin + halfWidth + 2, authY);
  authY += 3;
  doc.setFont(undefined, 'normal');
  doc.setFontSize(9);
  doc.text(certificateData.authorization?.signatory_name || certificateData.signatory_name || '', margin + 2, authY);
  doc.text(certificateData.authorization?.signatory_title || certificateData.signatory_title || '', margin + halfWidth + 2, authY);
  authY += 5;

  // Horizontal line
  doc.setLineWidth(0.3);
  doc.line(margin, authY, pageWidth - margin, authY);
  authY += 3;

  // 12e, 12f, 12g (side by side layout)
  doc.setFontSize(8);
  doc.setFont(undefined, 'bold');
  doc.text('12e. DATE (MM/DD/YYYY)', margin + 2, authY);
  doc.text('12f. TELEPHONE NUMBER', margin + 60, authY);
  authY += 3;
  doc.setFont(undefined, 'normal');
  doc.setFontSize(9);
  doc.text(certificateData.authorization?.signature_date || certificateData.signature_date || new Date().toLocaleDateString('en-US'), margin + 2, authY);
  doc.text(certificateData.authorization?.phone || certificateData.signatory_phone || '', margin + 60, authY);
  authY += 5;

  // 12g EMAIL (full width on its own line)
  doc.setFontSize(8);
  doc.setFont(undefined, 'bold');
  doc.text('12g. EMAIL', margin + 2, authY);
  authY += 3;
  doc.setFont(undefined, 'normal');
  doc.setFontSize(9);
  doc.text(certificateData.authorization?.email || certificateData.signatory_email || '', margin + 2, authY);

  y = authTop + authHeight;

  // Section 12 bottom border
  doc.setLineWidth(0.7); // 2px
  doc.line(margin, y, pageWidth - margin, y);

  // ========== FOOTER ==========
  doc.setFontSize(8);
  doc.setFont(undefined, 'bold');
  doc.text('USMCA CERTIFICATE V3', pageWidth - margin - 30, y + 4, { align: 'right' });

  // ========== WATERMARK ==========
  if (watermark || userTier === 'Trial' || userTier === 'trial' || userTier === 'free') {
    doc.saveGraphicsState();
    doc.setTextColor(200, 200, 200);
    doc.setFontSize(60);
    doc.setFont(undefined, 'bold');
    doc.text('TRIAL - NOT OFFICIAL', pageWidth / 2, pageHeight / 2, {
      align: 'center',
      angle: 45
    });
    doc.restoreGraphicsState();
  }

  // Return PDF blob
  const pdfBlob = doc.output('blob');
  const filename = watermark ? 'USMCA_Certificate_PREVIEW.pdf' : `USMCA-Certificate-${certificateData.certificate_number || 'DRAFT'}.pdf`;
  pdfBlob.filename = filename;

  return pdfBlob;
}
