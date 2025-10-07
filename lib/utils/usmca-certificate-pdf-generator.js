/**
 * Official USMCA Certificate PDF Generator
 * Generates certificates matching the official USMCA V3 form structure
 */

export async function generateUSMCACertificatePDF(certificateData) {
  const jsPDFModule = await import('jspdf');
  const jsPDF = jsPDFModule.default || jsPDFModule;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter'
  });

  // Helper function for text wrapping
  const wrapText = (text, maxWidth) => {
    if (!text) return [''];
    return doc.splitTextToSize(text, maxWidth);
  };

  // Page dimensions (Letter size in mm)
  const pageWidth = 216;
  const pageHeight = 279;
  const margin = 10;
  const contentWidth = pageWidth - (margin * 2);

  // Draw main border
  doc.setLineWidth(0.5);
  doc.rect(margin, margin, contentWidth, pageHeight - (margin * 2));

  let y = 18;

  // ========== HEADER ==========
  doc.setFontSize(11);
  doc.setFont(undefined, 'bold');
  doc.text('UNITED STATES MEXICO CANADA AGREEMENT (USMCA)', pageWidth / 2, y, { align: 'center' });
  y += 6;
  doc.text('CERTIFICATION OF ORIGIN', pageWidth / 2, y, { align: 'center' });

  y += 8;

  // ========== FIELD 1: Certifier Type + Blanket Period ==========
  doc.setLineWidth(0.3);
  doc.rect(margin, y, contentWidth, 14);

  doc.setFontSize(7);
  doc.setFont(undefined, 'bold');
  doc.text('1. CERTIFIER TYPE (INDICATE "X")', margin + 2, y + 4);

  const certifierType = (certificateData.certifier?.type || 'Exporter').toUpperCase();
  const boxSize = 3;
  const boxY = y + 2;

  // Importer checkbox
  doc.rect(margin + 50, boxY, boxSize, boxSize);
  if (certifierType === 'IMPORTER') doc.text('X', margin + 51, boxY + 2.5);
  doc.setFont(undefined, 'normal');
  doc.text('IMPORTER', margin + 55, boxY + 2.5);

  // Exporter checkbox
  doc.setFont(undefined, 'bold');
  doc.rect(margin + 85, boxY, boxSize, boxSize);
  if (certifierType === 'EXPORTER') doc.text('X', margin + 86, boxY + 2.5);
  doc.setFont(undefined, 'normal');
  doc.text('EXPORTER', margin + 90, boxY + 2.5);

  // Producer checkbox
  doc.setFont(undefined, 'bold');
  doc.rect(margin + 120, boxY, boxSize, boxSize);
  if (certifierType === 'PRODUCER') doc.text('X', margin + 121, boxY + 2.5);
  doc.setFont(undefined, 'normal');
  doc.text('PRODUCER', margin + 125, boxY + 2.5);

  // Blanket Period (right side)
  doc.setFontSize(6);
  doc.text('BLANKET PERIOD', margin + contentWidth - 45, y + 3);
  doc.text('(MM/DD/YYYY)', margin + contentWidth - 45, y + 6);
  doc.setFontSize(7);
  doc.text('FROM:', margin + contentWidth - 45, y + 9);
  doc.text(certificateData.blanket_period?.start_date || '', margin + contentWidth - 32, y + 9);
  doc.text('TO:', margin + contentWidth - 45, y + 12);
  doc.text(certificateData.blanket_period?.end_date || '', margin + contentWidth - 36, y + 12);

  y += 14;

  // ========== FIELDS 2 & 3: Certifier and Exporter (side by side) ==========
  const halfWidth = contentWidth / 2;
  const fieldHeight = 45;

  doc.rect(margin, y, halfWidth, fieldHeight);
  doc.rect(margin + halfWidth, y, halfWidth, fieldHeight);

  // Field 2 - Certifier (Optimized spacing: more room for NAME/ADDRESS, compact PHONE/EMAIL/TAX)
  doc.setFontSize(7);
  doc.setFont(undefined, 'bold');
  doc.text('2. CERTIFIER NAME, ADDRESS, PHONE, AND EMAIL', margin + 1, y + 3);
  doc.setFont(undefined, 'normal');

  // NAME - more vertical space
  doc.setFontSize(6);
  doc.text('NAME', margin + 1, y + 5);
  doc.setFontSize(7);
  doc.text(certificateData.certifier?.name || certificateData.exporter?.name || '', margin + 1, y + 8);

  // ADDRESS - much more vertical space for multi-line addresses
  doc.setFontSize(6);
  doc.text('ADDRESS', margin + 1, y + 10);
  doc.setFontSize(7);
  const certAddr = wrapText(certificateData.certifier?.address || certificateData.exporter?.address || '', halfWidth - 3);
  doc.text(certAddr, margin + 1, y + 13);

  // COUNTRY
  doc.setFontSize(6);
  doc.text('COUNTRY', margin + 1, y + 23);
  doc.setFontSize(7);
  const certCountry = certificateData.certifier?.country || certificateData.exporter?.country || certificateData.country_of_origin || '';
  doc.text(certCountry, margin + 1, y + 25);

  // PHONE - compact spacing
  doc.setFontSize(6);
  doc.text('PHONE', margin + 1, y + 27);
  doc.setFontSize(7);
  doc.text(certificateData.certifier?.phone || certificateData.exporter?.phone || '', margin + 1, y + 29);

  // EMAIL - compact spacing
  doc.setFontSize(6);
  doc.text('EMAIL', margin + 1, y + 31);
  doc.setFontSize(7);
  const certEmail = wrapText(certificateData.certifier?.email || certificateData.exporter?.email || '', halfWidth - 10);
  doc.text(certEmail, margin + 1, y + 33);

  // TAX ID - compact spacing
  doc.setFontSize(6);
  doc.text('TAX IDENTIFICATION NUMBER', margin + 1, y + 36);
  doc.setFontSize(7);
  doc.text(certificateData.certifier?.tax_id || certificateData.exporter?.tax_id || '', margin + 1, y + 39);

  // Field 3 - Exporter (Optimized spacing: more room for NAME/ADDRESS, compact PHONE/EMAIL/TAX)
  doc.setFontSize(7);
  doc.setFont(undefined, 'bold');
  doc.text('3. EXPORTER NAME, ADDRESS, PHONE, AND EMAIL', margin + halfWidth + 1, y + 3);
  doc.setFont(undefined, 'normal');

  // NAME - more vertical space
  doc.setFontSize(6);
  doc.text('NAME', margin + halfWidth + 1, y + 5);
  doc.setFontSize(7);
  doc.text(certificateData.exporter?.name || '', margin + halfWidth + 1, y + 8);

  // ADDRESS - much more vertical space for multi-line addresses
  doc.setFontSize(6);
  doc.text('ADDRESS', margin + halfWidth + 1, y + 10);
  doc.setFontSize(7);
  const expAddr = wrapText(certificateData.exporter?.address || '', halfWidth - 3);
  doc.text(expAddr, margin + halfWidth + 1, y + 13);

  // COUNTRY
  doc.setFontSize(6);
  doc.text('COUNTRY', margin + halfWidth + 1, y + 23);
  doc.setFontSize(7);
  const expCountry = certificateData.exporter?.country || certificateData.country_of_origin || certificateData.manufacturing_location || '';
  doc.text(expCountry, margin + halfWidth + 1, y + 25);

  // PHONE - compact spacing
  doc.setFontSize(6);
  doc.text('PHONE', margin + halfWidth + 1, y + 27);
  doc.setFontSize(7);
  doc.text(certificateData.exporter?.phone || '', margin + halfWidth + 1, y + 29);

  // EMAIL - compact spacing
  doc.setFontSize(6);
  doc.text('EMAIL', margin + halfWidth + 1, y + 31);
  doc.setFontSize(7);
  const expEmail = wrapText(certificateData.exporter?.email || '', halfWidth - 10);
  doc.text(expEmail, margin + halfWidth + 1, y + 33);

  // TAX ID - compact spacing
  doc.setFontSize(6);
  doc.text('TAX IDENTIFICATION NUMBER', margin + halfWidth + 1, y + 36);
  doc.setFontSize(7);
  doc.text(certificateData.exporter?.tax_id || '', margin + halfWidth + 1, y + 39);

  y += fieldHeight;

  // ========== FIELDS 4 & 5: Producer and Importer (side by side) ==========
  doc.rect(margin, y, halfWidth, fieldHeight);
  doc.rect(margin + halfWidth, y, halfWidth, fieldHeight);

  // Field 4 - Producer (Optimized spacing: more room for NAME/ADDRESS, compact PHONE/EMAIL/TAX)
  doc.setFontSize(7);
  doc.setFont(undefined, 'bold');
  doc.text('4. PRODUCER NAME, ADDRESS, PHONE, AND EMAIL', margin + 1, y + 3);
  doc.setFont(undefined, 'normal');

  // NAME - more vertical space
  doc.setFontSize(6);
  doc.text('NAME', margin + 1, y + 5);
  doc.setFontSize(7);
  doc.text(certificateData.producer?.name || 'SAME AS EXPORTER', margin + 1, y + 8);

  // ADDRESS - much more vertical space for multi-line addresses
  doc.setFontSize(6);
  doc.text('ADDRESS', margin + 1, y + 10);
  doc.setFontSize(7);
  const prodAddr = wrapText(certificateData.producer?.same_as_exporter ? 'SAME AS EXPORTER' : (certificateData.producer?.address || certificateData.exporter?.address || ''), halfWidth - 3);
  doc.text(prodAddr, margin + 1, y + 13);

  // COUNTRY
  doc.setFontSize(6);
  doc.text('COUNTRY', margin + 1, y + 23);
  doc.setFontSize(7);
  const prodCountry = certificateData.producer?.country || certificateData.exporter?.country || certificateData.country_of_origin || certificateData.manufacturing_location || '';
  doc.text(prodCountry, margin + 1, y + 25);

  // PHONE - compact spacing
  doc.setFontSize(6);
  doc.text('PHONE', margin + 1, y + 27);
  doc.setFontSize(7);
  doc.text(certificateData.producer?.phone || certificateData.exporter?.phone || '', margin + 1, y + 29);

  // EMAIL - compact spacing
  doc.setFontSize(6);
  doc.text('EMAIL', margin + 1, y + 31);
  doc.setFontSize(7);
  const prodEmail = wrapText(certificateData.producer?.email || certificateData.exporter?.email || '', halfWidth - 10);
  doc.text(prodEmail, margin + 1, y + 33);

  // TAX ID - compact spacing
  doc.setFontSize(6);
  doc.text('TAX IDENTIFICATION NUMBER', margin + 1, y + 36);
  doc.setFontSize(7);
  doc.text(certificateData.producer?.tax_id || certificateData.exporter?.tax_id || '', margin + 1, y + 39);

  // Field 5 - Importer (Optimized spacing: more room for NAME/ADDRESS, compact PHONE/EMAIL/TAX)
  doc.setFontSize(7);
  doc.setFont(undefined, 'bold');
  doc.text('5. IMPORTER NAME, ADDRESS, PHONE, AND EMAIL', margin + halfWidth + 1, y + 3);
  doc.setFont(undefined, 'normal');

  // NAME - more vertical space
  doc.setFontSize(6);
  doc.text('NAME', margin + halfWidth + 1, y + 5);
  doc.setFontSize(7);
  doc.text(certificateData.importer?.name || '', margin + halfWidth + 1, y + 8);

  // ADDRESS - much more vertical space for multi-line addresses
  doc.setFontSize(6);
  doc.text('ADDRESS', margin + halfWidth + 1, y + 10);
  doc.setFontSize(7);
  const impAddr = wrapText(certificateData.importer?.address || '', halfWidth - 4);
  doc.text(impAddr, margin + halfWidth + 1, y + 13);

  // COUNTRY
  doc.setFontSize(6);
  doc.text('COUNTRY', margin + halfWidth + 1, y + 23);
  doc.setFontSize(7);
  // For importer, only use the importer-specific country field (don't fallback to exporter/manufacturing location)
  const impCountry = certificateData.importer?.country || '';
  doc.text(impCountry, margin + halfWidth + 1, y + 25);

  // PHONE - compact spacing
  doc.setFontSize(6);
  doc.text('PHONE', margin + halfWidth + 1, y + 27);
  doc.setFontSize(7);
  doc.text(certificateData.importer?.phone || '', margin + halfWidth + 1, y + 29);

  // EMAIL - compact spacing
  doc.setFontSize(6);
  doc.text('EMAIL', margin + halfWidth + 1, y + 31);
  doc.setFontSize(7);
  const impEmail = wrapText(certificateData.importer?.email || '', halfWidth - 10);
  doc.text(impEmail, margin + halfWidth + 1, y + 33);

  // TAX ID - compact spacing
  doc.setFontSize(6);
  doc.text('TAX IDENTIFICATION NUMBER', margin + halfWidth + 1, y + 36);
  doc.setFontSize(7);
  doc.text(certificateData.importer?.tax_id || '', margin + halfWidth + 1, y + 39);

  y += fieldHeight;

  // ========== FIELDS 6-11: Goods Table ==========
  const tableHeight = 60;
  doc.rect(margin, y, contentWidth, tableHeight);

  // Table column positions
  const col6X = margin + 1;
  const col7X = margin + 68;
  const col8X = margin + 88;
  const col9X = margin + 108;
  const col10X = margin + 138;
  const col11X = margin + 173;

  // Vertical lines
  doc.line(col7X, y, col7X, y + tableHeight);
  doc.line(col8X, y, col8X, y + tableHeight);
  doc.line(col9X, y, col9X, y + tableHeight);
  doc.line(col10X, y, col10X, y + tableHeight);
  doc.line(col11X, y, col11X, y + tableHeight);

  // Table headers
  doc.setFontSize(6);
  doc.setFont(undefined, 'bold');
  doc.text('6.', col6X, y + 3);
  doc.text('DESCRIPTION', col6X, y + 6);
  doc.text('OF GOOD(S)', col6X, y + 9);

  doc.text('7.', col7X + 1, y + 3);
  doc.text('HTS', col7X + 1, y + 6);

  doc.text('8.', col8X + 1, y + 3);
  doc.text('ORIGIN', col8X + 1, y + 6);
  doc.text('CRITERION', col8X + 1, y + 9);

  doc.text('9.', col9X + 1, y + 3);
  doc.text('PRODUCER', col9X + 1, y + 6);
  doc.text('(YES/NO)', col9X + 1, y + 9);

  doc.text('10.', col10X + 1, y + 3);
  doc.text('METHOD OF', col10X + 1, y + 6);
  doc.text('QUALIFICATION', col10X + 1, y + 9);

  doc.text('11.', col11X + 1, y + 3);
  doc.text('COUNTRY', col11X + 1, y + 6);
  doc.text('OF ORIGIN', col11X + 1, y + 9);

  // Header line
  doc.line(margin, y + 11, margin + contentWidth, y + 11);

  // Table data
  doc.setFont(undefined, 'normal');
  doc.setFontSize(7);
  const dataY = y + 14;

  // Column 6 - Description
  const description = wrapText(certificateData.product?.description || '', 64);
  doc.text(description, col6X, dataY);

  // Column 7 - HTS/HS Code
  doc.text(certificateData.hs_classification?.code || certificateData.product?.hs_code || '', col7X + 1, dataY);

  // Column 8 - Origin Criterion
  doc.text(certificateData.preference_criterion || 'B', col8X + 1, dataY);

  // Column 9 - Producer
  doc.text(certificateData.producer_declaration?.is_producer ? 'YES' : 'NO', col9X + 1, dataY);

  // Column 10 - Method
  const method = wrapText(certificateData.qualification_method?.method || 'RVC', 32);
  doc.text(method, col10X + 1, dataY);

  // Column 11 - Country
  doc.text(certificateData.country_of_origin || '', col11X + 1, dataY);

  y += tableHeight;

  // ========== FIELD 12: Authorization ==========
  const authHeight = 45;
  doc.rect(margin, y, contentWidth, authHeight);

  doc.setFontSize(6);
  doc.setFont(undefined, 'normal');
  const certText = 'I CERTIFY THAT THE GOODS DESCRIBED IN THIS DOCUMENT QUALIFY AS ORIGINATING AND THE INFORMATION CONTAINED IN THIS DOCUMENT IS TRUE AND ACCURATE. I ASSUME RESPONSIBILITY FOR PROVING SUCH REPRESENTATIONS AND AGREE TO MAINTAIN AND PRESENT UPON REQUEST OR TO MAKE AVAILABLE DURING A VERIFICATION VISIT, DOCUMENTATION NECESSARY TO SUPPORT THIS CERTIFICATION';
  const wrappedCert = wrapText(certText, contentWidth - 4);
  doc.text(wrappedCert, margin + 2, y + 3);

  // Line after certification text
  doc.line(margin, y + 14, margin + contentWidth, y + 14);

  // Field 12 subfields
  doc.setFontSize(6);
  doc.text('12a. AUTHORIZED SIGNATURE', margin + 2, y + 17);
  doc.text('12b. COMPANY', margin + 70, y + 17);
  doc.setFontSize(7);
  doc.text(certificateData.exporter?.name || '', margin + 70, y + 22);

  doc.line(margin, y + 24, margin + contentWidth, y + 24);

  doc.setFontSize(6);
  doc.text('12c. NAME', margin + 2, y + 27);
  doc.setFontSize(7);
  doc.text(certificateData.authorization?.signatory_name || '', margin + 2, y + 32);
  doc.setFontSize(6);
  doc.text('12d. TITLE', margin + 70, y + 27);
  doc.setFontSize(7);
  doc.text(certificateData.authorization?.signatory_title || '', margin + 70, y + 32);

  doc.line(margin, y + 34, margin + contentWidth, y + 34);

  doc.setFontSize(6);
  doc.text('12e. DATE (MM/DD/YYYY)', margin + 2, y + 37);
  doc.setFontSize(7);
  doc.text(new Date().toLocaleDateString('en-US'), margin + 30, y + 37);
  doc.setFontSize(6);
  doc.text('12f. TELEPHONE NUMBER', margin + 70, y + 37);
  doc.setFontSize(7);
  doc.text(certificateData.authorization?.phone || certificateData.exporter?.phone || '', margin + 100, y + 37);
  doc.setFontSize(6);
  doc.text('12g. EMAIL', margin + 140, y + 37);
  doc.setFontSize(7);
  doc.text(certificateData.authorization?.email || certificateData.exporter?.email || '', margin + 155, y + 37);

  // Footer
  doc.setFontSize(6);
  doc.text('USMCA CERTIFICATE V3', pageWidth - margin - 30, pageHeight - margin + 3);

  // Certificate Number (top right corner outside form)
  doc.setFontSize(8);
  doc.text(`Certificate No: ${certificateData.certificate_number}`, margin, margin - 3);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-US')}`, pageWidth - margin - 45, margin - 3);

  return doc.output('blob');
}
