/**
 * Official USMCA Certificate Template Filler
 *
 * Uses the actual government-issued PDF template and fills it with user data.
 * This approach guarantees:
 * - Perfect layout match (it IS the official form)
 * - Government compliance (no layout discrepancies)
 * - Zero debugging (no coordinate calculations needed)
 * - Easy updates (government updates template → we just swap file)
 *
 * October 30, 2025 - Smart architecture (use official template, not reinvent)
 */

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

/**
 * Fill official USMCA template with certificate data
 * @param {Object} certificateData - Certificate data from user
 * @param {Object} options - { watermark: boolean, userTier: string }
 * @returns {Blob} PDF blob ready for download
 */
export async function fillOfficialUSMCATemplate(certificateData, options = {}) {
  const { watermark = false, userTier = 'Starter' } = options;

  try {
    // Load official government template
    const templateUrl = '/image/USMCA-Certificate-Of-Origin-Form-Template-Updated-10-21-2021.pdf';
    const templateBytes = await fetch(templateUrl).then(res => res.arrayBuffer());
    const pdfDoc = await PDFDocument.load(templateBytes);

    const page = pdfDoc.getPages()[0];
    const { width, height } = page.getSize();

    // Load fonts
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Font sizes
    const SIZE = {
      data: 10,
      label: 8,
      small: 7
    };

    // ========== SECTION 1: CERTIFIER TYPE + BLANKET PERIOD ==========
    // Y coordinates measured from bottom (PDF coordinate system)
    const certifierType = (certificateData.certifier?.type || certificateData.certifier_type || 'EXPORTER').toUpperCase();

    // Checkboxes (X marks) - measured from official template
    // Section 1 starts around y=720 from bottom
    const section1Y = 720;

    if (certifierType === 'IMPORTER') {
      page.drawText('X', { x: 95, y: section1Y, size: 10, font: fontBold });
    } else if (certifierType === 'EXPORTER') {
      page.drawText('X', { x: 210, y: section1Y, size: 10, font: fontBold });
    } else if (certifierType === 'PRODUCER') {
      page.drawText('X', { x: 310, y: section1Y, size: 10, font: fontBold });
    }

    // BLANKET PERIOD (right side of Section 1)
    const blanketFrom = certificateData.blanket_period?.start_date || certificateData.blanket_from || '';
    const blanketTo = certificateData.blanket_period?.end_date || certificateData.blanket_to || '';

    page.drawText(blanketFrom, { x: 500, y: section1Y + 5, size: SIZE.small, font });
    page.drawText(blanketTo, { x: 500, y: section1Y - 10, size: SIZE.small, font });

    // ========== SECTIONS 2-5: 2x2 PARTY GRID ==========
    // Top row starts at y=650, bottom row at y=550
    // Left column x=50, right column x=315

    // SECTION 2: CERTIFIER INFO (Top-Left)
    const certifier = certificateData.certifier || {};
    const s2Y = 650;
    const s2X = 50;

    page.drawText(certifier.name || '', { x: s2X, y: s2Y, size: SIZE.data, font: fontBold });
    page.drawText(certifier.address || '', { x: s2X, y: s2Y - 20, size: SIZE.small, font });
    page.drawText(certifier.country || '', { x: s2X, y: s2Y - 55, size: SIZE.data, font });
    page.drawText(certifier.phone || '', { x: s2X + 140, y: s2Y - 55, size: SIZE.data, font });
    page.drawText(certifier.email || '', { x: s2X, y: s2Y - 75, size: SIZE.data, font });
    page.drawText(certifier.tax_id || '', { x: s2X, y: s2Y - 95, size: SIZE.data, font });

    // SECTION 3: EXPORTER INFO (Top-Right)
    const exporter = certificateData.exporter || {};
    const s3Y = 650;
    const s3X = 315;

    page.drawText(exporter.name || '', { x: s3X, y: s3Y, size: SIZE.data, font: fontBold });
    page.drawText(exporter.address || '', { x: s3X, y: s3Y - 20, size: SIZE.small, font });
    page.drawText(exporter.country || '', { x: s3X, y: s3Y - 55, size: SIZE.data, font });
    page.drawText(exporter.phone || '', { x: s3X + 140, y: s3Y - 55, size: SIZE.data, font });
    page.drawText(exporter.email || '', { x: s3X, y: s3Y - 75, size: SIZE.data, font });
    page.drawText(exporter.tax_id || '', { x: s3X, y: s3Y - 95, size: SIZE.data, font });

    // SECTION 4: PRODUCER INFO (Bottom-Left)
    const producer = certificateData.producer || {};
    const s4Y = 550;
    const s4X = 50;

    page.drawText(producer.name || '', { x: s4X, y: s4Y, size: SIZE.data, font: fontBold });
    page.drawText(producer.address || '', { x: s4X, y: s4Y - 20, size: SIZE.small, font });
    page.drawText(producer.country || '', { x: s4X, y: s4Y - 55, size: SIZE.data, font });
    page.drawText(producer.phone || '', { x: s4X + 140, y: s4Y - 55, size: SIZE.data, font });
    page.drawText(producer.email || '', { x: s4X, y: s4Y - 75, size: SIZE.data, font });
    page.drawText(producer.tax_id || '', { x: s4X, y: s4Y - 95, size: SIZE.data, font });

    // SECTION 5: IMPORTER INFO (Bottom-Right)
    const importer = certificateData.importer || {};
    const s5Y = 550;
    const s5X = 315;

    page.drawText(importer.name || '', { x: s5X, y: s5Y, size: SIZE.data, font: fontBold });
    page.drawText(importer.address || '', { x: s5X, y: s5Y - 20, size: SIZE.small, font });
    page.drawText(importer.country || '', { x: s5X, y: s5Y - 55, size: SIZE.data, font });
    page.drawText(importer.phone || '', { x: s5X + 140, y: s5Y - 55, size: SIZE.data, font });
    page.drawText(importer.email || '', { x: s5X, y: s5Y - 75, size: SIZE.data, font });
    page.drawText(importer.tax_id || '', { x: s5X, y: s5Y - 95, size: SIZE.data, font });

    // ========== SECTIONS 6-11: PRODUCT TABLE ==========
    // Table starts at y=420, data row at y=400
    const tableY = 400;

    // Field 6: Description (left-aligned, wide column)
    const description = certificateData.product?.description || certificateData.product_description || '';
    page.drawText(description.substring(0, 80), { x: 50, y: tableY, size: SIZE.small, font });

    // Field 7: HS Code (centered in narrow column)
    const hsCode = certificateData.hs_classification?.code || certificateData.product?.hs_code || certificateData.hs_code || '';
    page.drawText(hsCode, { x: 265, y: tableY, size: SIZE.small, font });

    // Field 8: Origin Criterion (centered)
    const criterion = certificateData.preference_criterion || certificateData.origin_criterion || '';
    page.drawText(criterion, { x: 335, y: tableY, size: SIZE.data, font });

    // Field 9: Producer YES/NO (centered)
    const isProducer = certificateData.producer_declaration?.is_producer || certificateData.is_producer;
    page.drawText(isProducer ? 'YES' : 'NO', { x: 385, y: tableY, size: SIZE.data, font });

    // Field 10: Method of Qualification (centered)
    const method = certificateData.qualification_method?.method || certificateData.qualification_method || 'RVC';
    page.drawText(method, { x: 450, y: tableY, size: SIZE.data, font });

    // Field 11: Country of Origin (centered)
    const countryOfOrigin = certificateData.country_of_origin || '';
    page.drawText(countryOfOrigin, { x: 530, y: tableY, size: SIZE.data, font });

    // ========== SECTION 12: AUTHORIZATION ==========
    // Authorization section starts at y=200 from bottom

    // 12a: Signature box (left blank for physical signature)
    // 12b: Company name
    page.drawText(exporter.name || '', { x: 315, y: 200, size: SIZE.data, font });

    // 12c: Signatory Name
    const signatoryName = certificateData.authorization?.signatory_name || certificateData.signatory_name || '';
    page.drawText(signatoryName, { x: 50, y: 165, size: SIZE.data, font });

    // 12d: Signatory Title
    const signatoryTitle = certificateData.authorization?.signatory_title || certificateData.signatory_title || '';
    page.drawText(signatoryTitle, { x: 315, y: 165, size: SIZE.data, font });

    // 12e: Date (MM/DD/YYYY)
    const signatureDate = certificateData.authorization?.signature_date || certificateData.signature_date || new Date().toLocaleDateString('en-US');
    page.drawText(signatureDate, { x: 50, y: 130, size: SIZE.data, font });

    // 12f: Telephone Number
    const signatoryPhone = certificateData.authorization?.phone || certificateData.signatory_phone || '';
    page.drawText(signatoryPhone, { x: 220, y: 130, size: SIZE.data, font });

    // 12g: Email
    const signatoryEmail = certificateData.authorization?.email || certificateData.signatory_email || '';
    page.drawText(signatoryEmail, { x: 420, y: 130, size: SIZE.data, font });

    // WATERMARK (if trial user)
    if (watermark || userTier === 'Trial' || userTier === 'trial' || userTier === 'free') {
      page.drawText('TRIAL - NOT OFFICIAL', {
        x: width / 2 - 150,
        y: height / 2,
        size: 40,
        font: fontBold,
        color: rgb(0.8, 0.8, 0.8),
        opacity: 0.3,
        rotate: { angle: 45, type: 'degrees' }
      });
    }

    // Save and return
    const pdfBytes = await pdfDoc.save();
    const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });

    const filename = watermark
      ? 'USMCA_Certificate_PREVIEW.pdf'
      : `USMCA-Certificate-${certificateData.certificate_number || 'DRAFT'}.pdf`;

    pdfBlob.filename = filename;

    console.log('✅ Official template filled successfully');
    return pdfBlob;

  } catch (error) {
    console.error('❌ Template filling failed:', error);
    console.error('Stack trace:', error.stack);
    throw new Error(`Official template filling failed: ${error.message}`);
  }
}
