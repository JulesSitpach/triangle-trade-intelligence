/**
 * Measure PDF Template Dimensions
 *
 * This script helps us understand the coordinate system of the official PDF template
 * so we can accurately position text when filling it.
 */

import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

async function measureTemplate() {
  try {
    // Load the official template
    const templatePath = path.join(process.cwd(), 'public', 'image', 'USMCA-Certificate-Of-Origin-Form-Template-Updated-10-21-2021.pdf');
    const templateBytes = fs.readFileSync(templatePath);

    const pdfDoc = await PDFDocument.load(templateBytes);
    const page = pdfDoc.getPages()[0];

    const { width, height } = page.getSize();

    console.log('📏 PDF Template Measurements:');
    console.log(`   Width: ${width} points`);
    console.log(`   Height: ${height} points`);
    console.log('');
    console.log('📐 Coordinate System:');
    console.log('   Origin (0,0) is at BOTTOM-LEFT corner');
    console.log('   X increases going RIGHT');
    console.log('   Y increases going UP');
    console.log('');
    console.log('🎯 Key Reference Points:');
    console.log(`   Top-left corner: (0, ${height})`);
    console.log(`   Top-right corner: (${width}, ${height})`);
    console.log('   Bottom-left corner: (0, 0)');
    console.log(`   Bottom-right corner: (${width}, 0)`);
    console.log('');
    console.log('📋 Standard US Letter Dimensions:');
    console.log('   Expected: 612 x 792 points (8.5" x 11")');
    console.log(`   Actual: ${width} x ${height} points`);
    console.log(`   Match: ${width === 612 && height === 792 ? '✅ YES' : '❌ NO'}`);

  } catch (error) {
    console.error('❌ Failed to measure template:', error);
  }
}

measureTemplate();
