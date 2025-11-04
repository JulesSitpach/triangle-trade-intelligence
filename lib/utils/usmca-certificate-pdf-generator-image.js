/**
 * USMCA Certificate PDF Generator - Image-Based Approach
 *
 * ✅ WYSIWYG: Preview exactly matches PDF download
 * ✅ Simple: Capture preview as image → embed in PDF → done
 * ✅ Reliable: No HTML-to-PDF conversion issues
 * ✅ Fast: Single render, instant download
 *
 * This replaces the complex jsPDF manual drawing with a simple image embed.
 */

export async function generateCertificatePDFFromImage(imageDataUrl, options = {}) {
  const { watermark = false, userTier = 'Starter' } = options;

  try {
    const { jsPDF } = await import('jspdf');

    // US Letter size in mm
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter'
    });

    const pageWidth = 216;  // Letter width in mm
    const pageHeight = 279; // Letter height in mm

    // Add the captured image (full page)
    doc.addImage(imageDataUrl, 'PNG', 0, 0, pageWidth, pageHeight);

    // Add watermark if trial user
    if (watermark && (userTier === 'trial' || userTier === 'Trial' || userTier === 'free' || userTier === 'Free')) {
      doc.setFontSize(50);
      doc.setTextColor(255, 0, 0, 0.3); // Red with 30% opacity
      doc.setFont(undefined, 'bold');
      doc.text('TRIAL VERSION', pageWidth / 2, pageHeight / 2, {
        align: 'center',
        angle: 45
      });
    }

    // Return as Blob for browser download
    return doc.output('blob');

  } catch (error) {
    console.error('PDF generation from image failed:', error);
    throw error;
  }
}

/**
 * Helper function to capture a DOM element as image using html2canvas
 *
 * @param {HTMLElement} element - The DOM element to capture
 * @param {Object} options - html2canvas options
 * @returns {Promise<string>} - Data URL of the captured image
 */
export async function captureElementAsImage(element, options = {}) {
  try {
    const html2canvas = (await import('html2canvas')).default;

    const canvas = await html2canvas(element, {
      scale: 2, // Higher quality (2x resolution)
      useCORS: true, // Allow cross-origin images
      logging: false, // Disable console logs
      backgroundColor: '#ffffff', // White background
      ...options
    });

    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Failed to capture element as image:', error);
    throw error;
  }
}
