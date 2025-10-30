/**
 * USMCA Certificate Layout Template - MEASURED COORDINATE SYSTEM
 *
 * ⚠️ CRITICAL: These coordinates are MEASURED from the working jsPDF generator
 * Source: lib/utils/usmca-certificate-pdf-generator.js
 * DO NOT CHANGE unless updating from working code measurements
 *
 * Coordinate System:
 * - All measurements in MILLIMETERS (mm)
 * - Origin (0,0) is top-left corner
 * - Letter size: 216mm × 279mm (8.5" × 11")
 * - Preview converts mm to pixels: 1mm = 3.7795px (96 DPI)
 * - PDF uses mm directly via jsPDF
 */

export const USMCA_LAYOUT = {
  // === PAGE DIMENSIONS === (MEASURED from lines 115-119)
  page: {
    width: 216,        // 8.5 inches in mm
    height: 279,       // 11 inches in mm
    marginLeft: 10,
    marginRight: 10,
    marginTop: 10,
    marginBottom: 10,
    contentWidth: 196  // 216 - 10 - 10
  },

  // === CONVERSION FACTOR ===
  // 1mm = 3.7795px at 96 DPI (standard web resolution)
  mmToPx: 3.7795,

  // === FONTS ===
  fonts: {
    header: {
      family: 'Arial, sans-serif',
      size: 11,          // pt
      weight: 'bold'
    },
    sectionTitle: {
      family: 'Arial, sans-serif',
      size: 8,           // pt
      weight: 'bold'
    },
    fieldLabel: {
      family: 'Arial, sans-serif',
      size: 7,           // pt
      weight: 'normal'
    },
    fieldValue: {
      family: 'Arial, sans-serif',
      size: 9,           // pt
      weight: 'normal'
    }
  },

  // === HEADER === (MEASURED from lines 125-140)
  header: {
    y: 18,             // Starting Y position (line 125: let y = 18)
    title1: {
      text: 'UNITED STATES MEXICO CANADA AGREEMENT (USMCA)',
      y: 18,           // MEASURED: line 130
      align: 'center',
      fontSize: 11,
      fontWeight: 'bold'
    },
    title2: {
      text: 'CERTIFICATION OF ORIGIN',
      y: 24,           // MEASURED: y += 6 (line 131-132)
      align: 'center',
      fontSize: 11,
      fontWeight: 'bold'
    },
    pageCount: {
      text: 'THIS CERTIFICATE CONSISTS OF 1 PAGE, INCLUDING ALL ATTACHMENTS.',
      y: 30,           // MEASURED: y += 6 (line 134-139)
      align: 'center',
      fontSize: 8,
      fontWeight: 'normal'
    },
    certificateNumber: {
      x: 10,           // MEASURED: margin (line 571)
      y: 7,            // MEASURED: margin - 3 (line 571)
      fontSize: 8,
      fontWeight: 'normal'
    }
  },

  // === SECTION 1: CERTIFIER TYPE & BLANKET PERIOD === (MEASURED from lines 142-185)
  section1: {
    y: 36,             // MEASURED: y after header (line 144: doc.rect(margin, y, ...))
    height: 14,        // MEASURED: line 145
    rect: {
      x: 10,           // margin
      y: 36,
      width: 196,      // contentWidth
      height: 14
    },
    label: {
      text: '1. CERTIFIER TYPE (INDICATE "X")',
      x: 12,           // MEASURED: margin + 2 (line 149)
      y: 40,           // MEASURED: y + 4 (line 149)
      fontSize: 7,
      fontWeight: 'bold'
    },
    checkboxes: {
      size: 3,         // MEASURED: boxSize = 3 (line 152)
      importer: {
        x: 60,         // MEASURED: margin + 50 (line 156)
        y: 38,         // MEASURED: boxY = y + 2 (line 153, 156)
        label: 'IMPORTER',
        labelX: 65,    // MEASURED: margin + 55 (line 159)
        labelY: 40.5   // MEASURED: boxY + 2.5 (line 159)
      },
      exporter: {
        x: 95,         // MEASURED: margin + 85 (line 163)
        y: 38,
        label: 'EXPORTER',
        labelX: 100,   // MEASURED: margin + 90 (line 166)
        labelY: 40.5
      },
      producer: {
        x: 130,        // MEASURED: margin + 120 (line 170)
        y: 38,
        label: 'PRODUCER',
        labelX: 135,   // MEASURED: margin + 125 (line 173)
        labelY: 40.5
      }
    },
    blanketPeriod: {
      labelX: 161,     // MEASURED: margin + contentWidth - 45 (line 177)
      labelY1: 39,     // MEASURED: y + 3 (line 177)
      labelY2: 42,     // MEASURED: y + 6 (line 178)
      fromLabelX: 161, // MEASURED: margin + contentWidth - 45 (line 180)
      fromLabelY: 45,  // MEASURED: y + 9 (line 180)
      fromValueX: 174, // MEASURED: margin + contentWidth - 32 (line 181)
      fromValueY: 45,
      toLabelX: 161,   // MEASURED: margin + contentWidth - 45 (line 182)
      toLabelY: 48,    // MEASURED: y + 12 (line 182)
      toValueX: 170,   // MEASURED: margin + contentWidth - 36 (line 183)
      toValueY: 48,
      fontSize: 6
    }
  },

  // === SECTIONS 2-5: PARTY INFORMATION (2×2 GRID) === (MEASURED from lines 187-401)
  partyInfo: {
    y: 50,             // MEASURED: y after section 1 (y=36 + 14)
    halfWidth: 98,     // MEASURED: contentWidth / 2 (line 188)
    fieldHeight: 52,   // MEASURED: line 189

    // Row 1: Sections 2 & 3 (side by side)
    row1: {
      y: 50,
      leftRect: {       // Section 2: Certifier
        x: 10,          // MEASURED: margin (line 191)
        y: 50,
        width: 98,      // MEASURED: halfWidth
        height: 52,     // MEASURED: fieldHeight
        borderWidth: 0.5
      },
      rightRect: {      // Section 3: Exporter
        x: 108,         // MEASURED: margin + halfWidth (line 192)
        y: 50,
        width: 98,
        height: 52,
        borderWidth: 0.5
      }
    },

    // Row 2: Sections 4 & 5 (side by side)
    row2: {
      y: 102,           // MEASURED: 50 + 52 (y += fieldHeight at line 291)
      leftRect: {       // Section 4: Producer
        x: 10,
        y: 102,
        width: 98,
        height: 52,
        borderWidth: 0.5
      },
      rightRect: {      // Section 5: Importer
        x: 108,
        y: 102,
        width: 98,
        height: 52,
        borderWidth: 0.5
      }
    },

    // Field positions within each party box (relative to box y position)
    fields: {
      title: {
        offsetX: 1,     // MEASURED: margin + 1 (line 197, 245, etc.)
        offsetY: 3,     // MEASURED: y + 3
        fontSize: 7,
        fontWeight: 'bold'
      },
      name: {
        labelOffsetX: 1,
        labelOffsetY: 6,  // MEASURED: y + 6 (line 202)
        valueOffsetX: 1,
        valueOffsetY: 9,  // MEASURED: y + 9 (line 204)
        labelFontSize: 6,
        valueFontSize: 7
      },
      address: {
        labelOffsetX: 1,
        labelOffsetY: 12, // MEASURED: y + 12 (line 208)
        valueOffsetX: 1,
        valueOffsetY: 15, // MEASURED: y + 15 (line 211)
        labelFontSize: 6,
        valueFontSize: 7
      },
      country: {
        labelOffsetX: 1,
        labelOffsetY: 26, // MEASURED: y + 26 (line 215)
        valueOffsetX: 1,
        valueOffsetY: 29, // MEASURED: y + 29 (line 221)
        labelFontSize: 6,
        valueFontSize: 7
      },
      phone: {
        labelOffsetX: 1,
        labelOffsetY: 32, // MEASURED: y + 32 (line 225)
        valueOffsetX: 1,
        valueOffsetY: 35, // MEASURED: y + 35 (line 227)
        labelFontSize: 6,
        valueFontSize: 7
      },
      email: {
        labelOffsetX: 1,
        labelOffsetY: 38, // MEASURED: y + 38 (line 231)
        valueOffsetX: 1,
        valueOffsetY: 41, // MEASURED: y + 41 (line 234)
        labelFontSize: 6,
        valueFontSize: 7
      },
      taxId: {
        labelOffsetX: 1,
        labelOffsetY: 44, // MEASURED: y + 44 (line 238)
        valueOffsetX: 1,
        valueOffsetY: 47, // MEASURED: y + 47 (line 240)
        labelFontSize: 6,
        valueFontSize: 7,
        labelText: 'TAX IDENTIFICATION NUMBER'
      }
    }
  },

  // === SECTIONS 6-11: PRODUCT TABLE === (MEASURED from lines 403-517)
  productTable: {
    y: 154,            // MEASURED: 102 + 52 (after row2, y += fieldHeight at line 401)
    height: 60,        // MEASURED: tableHeight (line 405)
    headerHeight: 11,  // MEASURED: Header separator at y + 11 (line 460)
    dataY: 15,         // MEASURED: dataY offset from table top (line 465)

    // Main table border
    mainRect: {
      x: 10,           // MEASURED: margin (line 408)
      y: 154,
      width: 196,      // MEASURED: contentWidth
      height: 60,      // MEASURED: tableHeight
      borderWidth: 0.5
    },

    // Column X positions (MEASURED from lines 411-416)
    columns: [
      {
        id: 6,
        title: 'DESCRIPTION OF GOOD(S)',
        x: 11,         // MEASURED: col6X = margin + 1 (line 411)
        headerLines: ['6.', 'DESCRIPTION', 'OF GOOD(S)'],
        headerY: [2, 5, 8], // MEASURED: y + 2, y + 5, y + 8 (lines 430-432)
        headerFontSize: 6,
        dataFontSize: 7.5,
        align: 'left'
      },
      {
        id: 7,
        title: 'HTS CODE',
        x: 77,         // MEASURED: col7X = margin + 67 (line 412)
        headerLines: ['7.', 'HTS', 'CODE'],
        headerY: [2, 5, 8], // MEASURED: (lines 435-437)
        headerFontSize: 6,
        dataFontSize: 7.5,
        align: 'left'
      },
      {
        id: 8,
        title: 'ORIGIN CRITERION',
        x: 97,         // MEASURED: col8X = margin + 87 (line 413)
        headerLines: ['8.', 'ORIGIN', 'CRITERION'],
        headerY: [2, 5, 8], // MEASURED: (lines 440-442)
        headerFontSize: 6,
        dataFontSize: 7.5,
        align: 'center'  // MEASURED: Center-align for single character A/B/C/D (line 501)
      },
      {
        id: 9,
        title: 'PRODUCER',
        x: 117,        // MEASURED: col9X = margin + 107 (line 414)
        headerLines: ['9.', 'PRODUCER', '(YES/NO)'],
        headerY: [2, 5, 8], // MEASURED: (lines 445-447)
        headerFontSize: 6,
        dataFontSize: 7.5,
        align: 'center'  // MEASURED: Center-align for YES/NO (line 507)
      },
      {
        id: 10,
        title: 'METHOD OF QUALIFICATION',
        x: 147,        // MEASURED: col10X = margin + 137 (line 415)
        headerLines: ['10.', 'METHOD OF', 'QUALIFICATION'],
        headerY: [2, 5, 8], // MEASURED: (lines 450-452)
        headerFontSize: 6,
        dataFontSize: 7.5,
        align: 'left'
      },
      {
        id: 11,
        title: 'COUNTRY OF ORIGIN',
        x: 182,        // MEASURED: col11X = margin + 172 (line 416)
        headerLines: ['11.', 'COUNTRY', 'OF ORIGIN'],
        headerY: [2, 5, 8], // MEASURED: (lines 455-457)
        headerFontSize: 6,
        dataFontSize: 7.5,
        align: 'left'
      }
    ],

    // Vertical separators (MEASURED from lines 419-423)
    verticalLines: [
      { x: 77, y1: 154, y2: 214 },  // col7X separator
      { x: 97, y1: 154, y2: 214 },  // col8X separator
      { x: 117, y1: 154, y2: 214 }, // col9X separator
      { x: 147, y1: 154, y2: 214 }, // col10X separator
      { x: 182, y1: 154, y2: 214 }  // col11X separator
    ],

    // Header separator line (MEASURED from line 460)
    headerSeparator: {
      x1: 10,
      y: 165,        // MEASURED: y + 11
      x2: 206,       // MEASURED: margin + contentWidth
      lineWidth: 0.3
    }
  },

  // === SECTION 12: AUTHORIZATION === (MEASURED from lines 519-564)
  authorization: {
    y: 214,            // MEASURED: 154 + 60 (after product table, y += tableHeight at line 517)
    height: 45,        // MEASURED: authHeight (line 520)

    // Main authorization border
    mainRect: {
      x: 10,           // MEASURED: margin (line 521)
      y: 214,
      width: 196,      // MEASURED: contentWidth
      height: 45,      // MEASURED: authHeight
      borderWidth: 0.5
    },

    // Certification statement text (MEASURED from lines 524-527)
    certificationStatement: {
      text: 'I CERTIFY THAT THE GOODS DESCRIBED IN THIS DOCUMENT QUALIFY AS ORIGINATING AND THE INFORMATION CONTAINED IN THIS DOCUMENT IS TRUE AND ACCURATE. I ASSUME RESPONSIBILITY FOR PROVING SUCH REPRESENTATIONS AND AGREE TO MAINTAIN AND PRESENT UPON REQUEST OR TO MAKE AVAILABLE DURING A VERIFICATION VISIT, DOCUMENTATION NECESSARY TO SUPPORT THIS CERTIFICATION',
      x: 12,           // MEASURED: margin + 2 (line 527)
      y: 217,          // MEASURED: y + 3 (line 527)
      fontSize: 6,     // MEASURED: line 523
      fontWeight: 'normal'
    },

    // Separator line after certification text (MEASURED from line 530)
    separatorLine1: {
      x1: 10,          // MEASURED: margin
      y: 228,          // MEASURED: y + 14
      x2: 206,         // MEASURED: margin + contentWidth
      lineWidth: 0.3
    },

    // Field 12a & 12b (MEASURED from lines 534-537)
    row1: {
      field12a: {
        label: '12a. AUTHORIZED SIGNATURE',
        labelX: 12,    // MEASURED: margin + 2
        labelY: 231,   // MEASURED: y + 17
        labelFontSize: 6
      },
      field12b: {
        label: '12b. COMPANY',
        labelX: 80,    // MEASURED: margin + 70 (line 535)
        labelY: 231,   // MEASURED: y + 17
        valueX: 80,
        valueY: 236,   // MEASURED: y + 22 (line 537)
        labelFontSize: 6,
        valueFontSize: 7
      }
    },

    // Separator line (MEASURED from line 539)
    separatorLine2: {
      x1: 10,
      y: 238,          // MEASURED: y + 24
      x2: 206,
      lineWidth: 0.3
    },

    // Field 12c & 12d (MEASURED from lines 542-548)
    row2: {
      field12c: {
        label: '12c. NAME',
        labelX: 12,    // MEASURED: margin + 2
        labelY: 241,   // MEASURED: y + 27
        valueX: 12,
        valueY: 246,   // MEASURED: y + 32 (line 544)
        labelFontSize: 6,
        valueFontSize: 7
      },
      field12d: {
        label: '12d. TITLE',
        labelX: 80,    // MEASURED: margin + 70 (line 546)
        labelY: 241,   // MEASURED: y + 27
        valueX: 80,
        valueY: 246,   // MEASURED: y + 32 (line 548)
        labelFontSize: 6,
        valueFontSize: 7
      }
    },

    // Separator line (MEASURED from line 550)
    separatorLine3: {
      x1: 10,
      y: 248,          // MEASURED: y + 34
      x2: 206,
      lineWidth: 0.3
    },

    // Field 12e, 12f, 12g (MEASURED from lines 553-563)
    row3: {
      field12e: {
        label: '12e. DATE (MM/DD/YYYY)',
        labelX: 12,    // MEASURED: margin + 2
        labelY: 251,   // MEASURED: y + 37
        valueX: 40,    // MEASURED: margin + 30 (line 555)
        valueY: 251,   // MEASURED: y + 37
        labelFontSize: 6,
        valueFontSize: 7
      },
      field12f: {
        label: '12f. TELEPHONE NUMBER',
        labelX: 80,    // MEASURED: margin + 70 (line 557)
        labelY: 251,   // MEASURED: y + 37
        valueX: 110,   // MEASURED: margin + 100 (line 559)
        valueY: 251,
        labelFontSize: 6,
        valueFontSize: 7
      },
      field12g: {
        label: '12g. EMAIL',
        labelX: 150,   // MEASURED: margin + 140 (line 561)
        labelY: 251,   // MEASURED: y + 37
        valueX: 165,   // MEASURED: margin + 155 (line 563)
        valueY: 251,
        labelFontSize: 6,
        valueFontSize: 7
      }
    }
  },

  // === FOOTER === (MEASURED from lines 566-572)
  footer: {
    versionText: {
      text: 'USMCA CERTIFICATE V3',
      x: 176,        // MEASURED: pageWidth - margin - 30 (line 567)
      y: 282,        // MEASURED: pageHeight - margin + 3 (line 567)
      fontSize: 6,   // MEASURED: line 566
      fontWeight: 'normal',
      align: 'left'
    },
    certificateNumber: {
      x: 10,         // MEASURED: margin (line 571)
      y: 7,          // MEASURED: margin - 3 (line 571)
      fontSize: 8,   // MEASURED: line 570
      fontWeight: 'normal'
    },
    generatedDate: {
      x: 161,        // MEASURED: pageWidth - margin - 45 (line 572)
      y: 7,          // MEASURED: margin - 3 (line 572)
      fontSize: 8,
      fontWeight: 'normal'
    }
  },

  // === DISCLAIMER === (MEASURED from lines 575-580)
  disclaimer: {
    text: 'PLATFORM DISCLAIMER: This certificate was prepared by the signatory identified above using Triangle Trade Intelligence tools. Triangle Trade Intelligence provides software tools only and assumes no legal responsibility for the accuracy, completeness, or compliance of this certificate. The signatory assumes full legal responsibility for all information contained herein and certifies compliance with all applicable regulations.',
    x: 10,           // MEASURED: margin (line 580)
    y: 286,          // MEASURED: pageHeight - margin + 7 (line 577)
    fontSize: 5,     // MEASURED: line 575
    fontWeight: 'normal',
    maxWidth: 196    // MEASURED: contentWidth (for text wrapping)
  },

  // === WATERMARK === (MEASURED from lines 583-598)
  watermark: {
    text: 'PREVIEW ONLY',
    x: 108,          // MEASURED: pageWidth / 2 (line 592)
    y: 139.5,        // MEASURED: pageHeight / 2 (line 593)
    fontSize: 60,    // MEASURED: line 588
    fontWeight: 'bold',
    color: [200, 200, 200], // MEASURED: Light gray (line 587)
    rotation: 45,
    align: 'center'
  },

  // === STYLING CONFIGURATION ===
  styling: {
    // Border styling
    borders: {
      main: {
        lineWidth: 0.5,
        color: [0, 0, 0]  // Black
      },
      sections: {
        lineWidth: 0.3,
        color: [0, 0, 0]  // Black
      }
    },

    // Background colors (for preview HTML)
    backgrounds: {
      inputFields: '#e8f4f8',      // Light blue for editable fields
      headerSection: '#f5f5f5',     // Light gray for header
      certificationText: '#ffffff'  // White for certification statement
    },

    // Typography
    fonts: {
      primary: 'Arial, sans-serif',
      fallback: 'Helvetica, sans-serif'
    },

    // Field spacing
    spacing: {
      fieldPadding: 4,
      sectionMargin: 8,
      lineSpacing: 1.2
    }
  }
};

/**
 * Helper: Convert millimeters to pixels for CSS display
 * @param {number} mm - Measurement in millimeters
 * @returns {number} - Measurement in pixels
 */
export function mmToPx(mm) {
  return mm * USMCA_LAYOUT.mmToPx;
}

/**
 * Helper: Convert pixels to millimeters for jsPDF
 * @param {number} px - Measurement in pixels
 * @returns {number} - Measurement in millimeters
 */
export function pxToMm(px) {
  return px / USMCA_LAYOUT.mmToPx;
}

/**
 * Helper: Get CSS style object for a field using layout coordinates
 * @param {object} field - Field definition from layout
 * @returns {object} - CSS style object
 */
export function getFieldStyle(field) {
  return {
    position: 'absolute',
    left: `${mmToPx(field.x)}px`,
    top: `${mmToPx(field.y)}px`,
    width: field.width ? `${mmToPx(field.width)}px` : 'auto',
    height: field.height ? `${mmToPx(field.height)}px` : 'auto'
  };
}
