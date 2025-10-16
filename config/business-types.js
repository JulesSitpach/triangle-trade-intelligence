/**
 * BUSINESS TYPES & INDUSTRY SECTORS
 * Centralized business classification for flexible platform expansion
 *
 * Benefits:
 * - Add new business types without code changes
 * - Consistent across entire platform
 * - Easy to localize (Spanish/English)
 * - Database-friendly structure
 *
 * Updated: October 15, 2025
 */

/**
 * Business Role Types (Role in supply chain)
 * Used in company information forms
 */
export const BUSINESS_TYPES = [
  {
    value: 'Importer',
    label: 'Importer',
    label_with_cert: 'Importer (Certificate: IMPORTER)',
    label_es: 'Importador',
    description: 'Purchases goods from foreign suppliers',
    description_es: 'Compra productos de proveedores extranjeros',
    certificate_type: 'IMPORTER'
  },
  {
    value: 'Exporter',
    label: 'Exporter',
    label_with_cert: 'Exporter (Certificate: EXPORTER)',
    label_es: 'Exportador',
    description: 'Sells goods to foreign markets',
    description_es: 'Vende productos a mercados extranjeros',
    certificate_type: 'EXPORTER'
  },
  {
    value: 'Manufacturer',
    label: 'Manufacturer',
    label_with_cert: 'Manufacturer (Certificate: PRODUCER)',
    label_es: 'Fabricante',
    description: 'Produces goods for domestic or international sale',
    description_es: 'Produce bienes para venta nacional o internacional',
    certificate_type: 'PRODUCER'
  },
  {
    value: 'Distributor',
    label: 'Distributor',
    label_with_cert: 'Distributor (Certificate: IMPORTER)',
    label_es: 'Distribuidor',
    description: 'Distributes products within a region',
    description_es: 'Distribuye productos dentro de una región',
    certificate_type: 'IMPORTER'
  },
  {
    value: 'Wholesaler',
    label: 'Wholesaler',
    label_with_cert: 'Wholesaler (Certificate: IMPORTER)',
    label_es: 'Mayorista',
    description: 'Bulk seller to retailers',
    description_es: 'Vendedor al por mayor a minoristas',
    certificate_type: 'IMPORTER'
  },
  {
    value: 'Retailer',
    label: 'Retailer',
    label_with_cert: 'Retailer (Certificate: IMPORTER)',
    label_es: 'Minorista',
    description: 'Sells directly to end consumers',
    description_es: 'Vende directamente a consumidores finales',
    certificate_type: 'IMPORTER'
  }
];

/**
 * Industry Sectors (Product categories for HS classification)
 * Aligned with HS code chapter structure
 */
export const INDUSTRY_SECTORS = [
  {
    value: 'Agriculture & Food Products',
    label: 'Agriculture & Food Products',
    label_es: 'Agricultura y Productos Alimenticios',
    hs_chapters: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24]
  },
  {
    value: 'Textiles & Apparel',
    label: 'Textiles & Apparel',
    label_es: 'Textiles y Confección',
    hs_chapters: [50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63]
  },
  {
    value: 'Footwear & Leather',
    label: 'Footwear & Leather',
    label_es: 'Calzado y Cuero',
    hs_chapters: [41, 42, 43, 64]
  },
  {
    value: 'Wood & Paper Products',
    label: 'Wood & Paper Products',
    label_es: 'Madera y Papel',
    hs_chapters: [44, 45, 46, 47, 48, 49]
  },
  {
    value: 'Chemicals & Plastics',
    label: 'Chemicals & Plastics',
    label_es: 'Químicos y Plásticos',
    hs_chapters: [28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40]
  },
  {
    value: 'Metals & Metal Products',
    label: 'Metals & Metal Products',
    label_es: 'Metales y Productos Metálicos',
    hs_chapters: [72, 73, 74, 75, 76, 78, 79, 80, 81, 82, 83]
  },
  {
    value: 'Machinery & Mechanical Equipment',
    label: 'Machinery & Mechanical Equipment',
    label_es: 'Maquinaria y Equipo Mecánico',
    hs_chapters: [84]
  },
  {
    value: 'Electronics & Electrical Equipment',
    label: 'Electronics & Electrical Equipment',
    label_es: 'Electrónica y Equipo Eléctrico',
    hs_chapters: [85]
  },
  {
    value: 'Automotive & Transportation',
    label: 'Automotive & Transportation',
    label_es: 'Automotriz y Transporte',
    hs_chapters: [86, 87, 88, 89]
  },
  {
    value: 'Medical Devices & Pharmaceuticals',
    label: 'Medical Devices & Pharmaceuticals',
    label_es: 'Dispositivos Médicos y Farmacéuticos',
    hs_chapters: [30, 90]
  },
  {
    value: 'Furniture & Household Goods',
    label: 'Furniture & Household Goods',
    label_es: 'Muebles y Artículos del Hogar',
    hs_chapters: [94, 95, 96]
  },
  {
    value: 'Optical & Precision Instruments',
    label: 'Optical & Precision Instruments',
    label_es: 'Instrumentos Ópticos y de Precisión',
    hs_chapters: [90, 91]
  },
  {
    value: 'Minerals & Stone Products',
    label: 'Minerals & Stone Products',
    label_es: 'Minerales y Productos de Piedra',
    hs_chapters: [25, 26, 27, 68, 69, 70, 71]
  },
  {
    value: 'Arms & Ammunition',
    label: 'Arms & Ammunition',
    label_es: 'Armas y Municiones',
    hs_chapters: [93]
  },
  {
    value: 'Art & Antiques',
    label: 'Art & Antiques',
    label_es: 'Arte y Antigüedades',
    hs_chapters: [97]
  },
  {
    value: 'Other',
    label: 'Other',
    label_es: 'Otro',
    hs_chapters: []
  }
];

/**
 * Helper function to get business type label
 */
export function getBusinessTypeLabel(value, language = 'en') {
  const businessType = BUSINESS_TYPES.find(bt => bt.value === value);
  if (!businessType) return value;
  return language === 'es' ? businessType.label_es : businessType.label;
}

/**
 * Helper function to get industry sector label
 */
export function getIndustrySectorLabel(value, language = 'en') {
  const sector = INDUSTRY_SECTORS.find(s => s.value === value);
  if (!sector) return value;
  return language === 'es' ? sector.label_es : sector.label;
}

/**
 * Helper function to get HS chapters for industry sector
 */
export function getHSChaptersForSector(sectorValue) {
  const sector = INDUSTRY_SECTORS.find(s => s.value === sectorValue);
  return sector?.hs_chapters || [];
}

/**
 * Helper function to find sector by HS code
 */
export function findSectorByHSCode(hsCode) {
  // Extract chapter from HS code (first 2 digits)
  const chapter = parseInt(hsCode.substring(0, 2), 10);

  const sector = INDUSTRY_SECTORS.find(s => s.hs_chapters.includes(chapter));
  return sector || INDUSTRY_SECTORS.find(s => s.value === 'Other');
}

/**
 * USMCA Certifier Types (Official legal options for USMCA Certificate Field 1)
 * These are the ONLY valid options for the official USMCA certificate
 */
export const CERTIFIER_TYPES = [
  {
    value: 'IMPORTER',
    label: 'Importer',
    label_es: 'Importador',
    description: 'Company importing goods into USMCA territory',
    description_es: 'Empresa que importa bienes al territorio USMCA'
  },
  {
    value: 'EXPORTER',
    label: 'Exporter',
    label_es: 'Exportador',
    description: 'Company exporting goods from USMCA territory',
    description_es: 'Empresa que exporta bienes del territorio USMCA'
  },
  {
    value: 'PRODUCER',
    label: 'Producer',
    label_es: 'Productor',
    description: 'Company manufacturing or producing the goods',
    description_es: 'Empresa que fabrica o produce los bienes'
  }
];

/**
 * Map Business Type to suggested Certifier Type
 * Business Type (6 options for AI context) → Certifier Type (3 legal USMCA options)
 * User can override this suggestion
 */
export function mapBusinessTypeToCertifierType(businessType) {
  const mapping = {
    'Importer': 'IMPORTER',
    'Exporter': 'EXPORTER',
    'Manufacturer': 'PRODUCER',
    'Retailer': 'IMPORTER',      // Retailers typically import goods
    'Distributor': 'IMPORTER',   // Distributors typically import for distribution
    'Wholesaler': 'IMPORTER'     // Wholesalers typically import for wholesale
  };

  return mapping[businessType] || 'EXPORTER'; // Default to EXPORTER if unknown
}

/**
 * Helper function to get certifier type label
 */
export function getCertifierTypeLabel(value, language = 'en') {
  const certifierType = CERTIFIER_TYPES.find(ct => ct.value === value);
  if (!certifierType) return value;
  return language === 'es' ? certifierType.label_es : certifierType.label;
}

export default {
  BUSINESS_TYPES,
  INDUSTRY_SECTORS,
  CERTIFIER_TYPES,
  getBusinessTypeLabel,
  getIndustrySectorLabel,
  getHSChaptersForSector,
  findSectorByHSCode,
  mapBusinessTypeToCertifierType,
  getCertifierTypeLabel
};
