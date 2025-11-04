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

    // ✅ Use onclone to modify the CLONED DOM (not the visible page)
    const canvas = await html2canvas(element, {
      scale: 2, // Higher quality (2x resolution)
      useCORS: true, // Allow cross-origin images
      allowTaint: true, // Allow cross-origin content
      logging: false, // Disable console logs
      backgroundColor: '#ffffff', // White background
      onclone: (clonedDoc) => {
        // This runs on the CLONE, not the actual page
        const clonedElement = clonedDoc.querySelector('#certificate-preview-for-pdf');
        if (!clonedElement) return;

        // Replace all inputs with their values as styled text
        const inputs = clonedElement.querySelectorAll('input, textarea, select');
        inputs.forEach((input) => {
          const computedStyle = window.getComputedStyle(input);

          // ✅ Handle checkboxes specially
          if (input.type === 'checkbox') {
            const replacement = clonedDoc.createElement('span');
            replacement.style.cssText = computedStyle.cssText;
            replacement.style.display = 'inline-block';
            replacement.style.width = '14px';
            replacement.style.height = '14px';
            replacement.style.border = '2px solid #000';
            replacement.style.backgroundColor = '#fff';
            replacement.style.textAlign = 'center';
            replacement.style.lineHeight = '14px';
            replacement.style.fontSize = '12px';
            replacement.style.fontWeight = 'bold';
            replacement.style.color = '#000';
            replacement.style.verticalAlign = 'middle';

            // Show X if checked, empty box if not
            if (input.checked) {
              replacement.textContent = 'X';
            }

            input.parentNode.replaceChild(replacement, input);
            return;
          }

          // Handle text inputs
          const value = input.value || '';
          const replacement = clonedDoc.createElement('div');
          replacement.textContent = value;

          // Copy all the visual styles
          replacement.style.cssText = computedStyle.cssText;
          replacement.style.display = 'block';
          replacement.style.whiteSpace = 'pre-wrap';
          replacement.style.wordWrap = 'break-word';
          replacement.style.overflow = 'visible';

          // Preserve the blue input background
          if (computedStyle.backgroundColor) {
            replacement.style.backgroundColor = computedStyle.backgroundColor;
          }

          // ✅ Make text darker for better PDF readability
          replacement.style.color = '#000000'; // Pure black
          replacement.style.fontWeight = '500'; // Slightly bolder

          // Replace the input with the styled div
          input.parentNode.replaceChild(replacement, input);
        });
      },
      ...options
    });

    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Failed to capture element as image:', error);
    throw error;
  }
}
