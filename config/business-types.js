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
    label_with_cert: 'IMPORTER (Importer)',
    label_es: 'Importador',
    description: 'Purchases goods from foreign suppliers',
    description_es: 'Compra productos de proveedores extranjeros',
    certificate_type: 'IMPORTER'
  },
  {
    value: 'Exporter',
    label: 'Exporter',
    label_with_cert: 'EXPORTER (Exporter)',
    label_es: 'Exportador',
    description: 'Sells goods to foreign markets',
    description_es: 'Vende productos a mercados extranjeros',
    certificate_type: 'EXPORTER'
  },
  {
    value: 'Manufacturer',
    label: 'Manufacturer',
    label_with_cert: 'PRODUCER (Manufacturer)',
    label_es: 'Fabricante',
    description: 'Produces goods for domestic or international sale',
    description_es: 'Produce bienes para venta nacional o internacional',
    certificate_type: 'PRODUCER'
  },
  {
    value: 'Distributor',
    label: 'Distributor',
    label_with_cert: 'IMPORTER (Distributor)',
    label_es: 'Distribuidor',
    description: 'Distributes products within a region',
    description_es: 'Distribuye productos dentro de una región',
    certificate_type: 'IMPORTER'
  },
  {
    value: 'Wholesaler',
    label: 'Wholesaler',
    label_with_cert: 'IMPORTER (Wholesaler)',
    label_es: 'Mayorista',
    description: 'Bulk seller to retailers',
    description_es: 'Vendedor al por mayor a minoristas',
    certificate_type: 'IMPORTER'
  },
  {
    value: 'Retailer',
    label: 'Retailer',
    label_with_cert: 'IMPORTER (Retailer)',
    label_es: 'Minorista',
    description: 'Sells directly to end consumers',
    description_es: 'Vende directamente a consumidores finales',
    certificate_type: 'IMPORTER'
  }
];

/**
 * REMOVED: Industry Sectors hardcoded array
 *
 * REASON: Violates AI-first principle "NEVER use hardcoded arrays"
 * - Database is source of truth for industry sectors
 * - API queries database directly via /api/simple-dropdown-options
 * - Config values were out of sync with actual dropdown values
 * - Example: Config had "Electronics & Electrical Equipment" but DB has "Electronics & Technology"
 *
 * ACTION: Industry sectors now come ONLY from the database
 * - UI Form: Fetches from /api/simple-dropdown-options
 * - API: Queries from usmca_qualification_rules table
 * - No hardcoded fallback values
 */

/**
 * Helper function to get business type label
 */
export function getBusinessTypeLabel(value, language = 'en') {
  const businessType = BUSINESS_TYPES.find(bt => bt.value === value);
  if (!businessType) return value;
  return language === 'es' ? businessType.label_es : businessType.label;
}

/**
 * REMOVED: Helper functions for industry sectors
 * - getIndustrySectorLabel()
 * - getHSChaptersForSector()
 * - findSectorByHSCode()
 *
 * These functions referenced INDUSTRY_SECTORS which is now database-driven.
 * If industry sector label lookups are needed, fetch from the database via the API.
 */

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
  CERTIFIER_TYPES,
  getBusinessTypeLabel,
  mapBusinessTypeToCertifierType,
  getCertifierTypeLabel
};
