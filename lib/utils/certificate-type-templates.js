/**
 * USMCA Certificate Type Templates
 * Provides role-specific certificate field population and validation
 *
 * USMCA allows 3 certifier types:
 * - PRODUCER: Manufacturer certifying goods they produced
 * - EXPORTER: Exporter certifying goods (may or may not be producer)
 * - IMPORTER: Importer certifying based on producer/exporter documentation
 *
 * Each type has different required fields and validation rules
 */

/**
 * PRODUCER Certificate Template
 * Used when: Business Type = Manufacturer
 * Complexity: MOST DETAILED
 * Required: Full manufacturing details, component breakdown, RVC calculation
 */
export function getProducerCertificateFields(workflowData) {
  const company = workflowData.company || {};
  const product = workflowData.product || {};
  const usmca = workflowData.usmca || {};
  const components = workflowData.components || workflowData.component_origins || [];

  return {
    // Field 1: Certifier Type
    certifier_type: 'PRODUCER',
    certifier_declaration: 'I am the producer of the goods described below',

    // Field 2: Certifier (Producer information)
    certifier: {
      name: company.company_name || company.name,
      address: company.company_address || company.address,
      country: company.company_country,
      phone: company.contact_phone || company.phone,
      email: company.contact_email || company.email,
      tax_id: company.tax_id || ''
    },

    // Field 3: Exporter (Same as producer if they export directly, otherwise buyer)
    exporter: {
      name: company.company_name || company.name,
      address: company.company_address || company.address,
      country: company.company_country,
      phone: company.contact_phone || company.phone,
      email: company.contact_email || company.email,
      tax_id: company.tax_id || '',
      same_as_producer: true
    },

    // Field 4: Producer (Same as certifier for PRODUCER type)
    producer: {
      same_as_exporter: true,
      name: company.company_name || company.name,
      address: company.company_address || company.address,
      country: company.company_country
    },

    // Field 5: Importer (Optional for producer)
    importer: {
      name: workflowData.authorization?.importer_name || '',
      address: workflowData.authorization?.importer_address || '',
      country: workflowData.authorization?.importer_country || '',
      phone: workflowData.authorization?.importer_phone || '',
      email: workflowData.authorization?.importer_email || '',
      tax_id: workflowData.authorization?.importer_tax_id || ''
    },

    // Fields 6-11: Product details (required for all types)
    product_description: product.description || '',
    hs_code: product.hs_code || '',
    // ✅ REMOVED: preference_criterion default || 'B' (line 72)
    // REASON: FALSE CERTIFICATION if AI didn't determine criterion
    preference_criterion: usmca.preference_criterion,  // Must be determined by AI
    producer_indicator: 'YES',  // Producer is certifying

    // Producer-specific: Detailed RVC calculation
    rvc_calculation: {
      method: workflowData.method_of_qualification || 'Transaction Value (TV)',
      transaction_value: workflowData.product_value || 0,
      vnm: calculateVNM(components),  // Value of non-originating materials
      vom: calculateVOM(components),  // Value of originating materials
      rvc_percentage: usmca.regional_content || usmca.north_american_content || 0,
      threshold_required: usmca.threshold_applied || 60
    },

    // Producer-specific: Component breakdown
    component_breakdown: components.map(c => ({
      description: c.description || c.component_type,
      origin: c.origin_country || c.country,
      value_percentage: c.value_percentage || c.percentage,
      hs_code: c.hs_code || c.classified_hs_code,
      originating: isUSMCAOrigin(c.origin_country || c.country)
    })),

    // Blanket period (producers can use up to 12 months)
    blanket_period: {
      allowed: true,
      max_months: 12,
      start_date: workflowData.blanket_period?.start_date || new Date().toISOString().split('T')[0],
      end_date: workflowData.blanket_period?.end_date || getDatePlusMonths(12)
    },

    // Required documentation
    required_documentation: [
      'Manufacturing records and bills of materials',
      'Component origin certifications',
      'RVC calculation worksheets',
      'Supplier declarations for non-originating materials'
    ],

    basis_of_knowledge: 'I produced these goods in my facility and have direct knowledge of all components and their origins'
  };
}

/**
 * EXPORTER Certificate Template
 * Used when: Business Type = Exporter
 * Complexity: MEDIUM
 * Required: Exporter details, producer info (if different), summary RVC
 */
export function getExporterCertificateFields(workflowData) {
  const company = workflowData.company || {};
  const product = workflowData.product || {};
  const usmca = workflowData.usmca || {};

  // Check if exporter is also the producer
  const isAlsoProducer = company.business_type === 'Manufacturer' ||
                         workflowData.is_also_producer === true;

  return {
    // Field 1: Certifier Type
    certifier_type: 'EXPORTER',
    certifier_declaration: 'I certify that the goods described below qualify as originating',

    // Field 2: Certifier (Exporter information)
    certifier: {
      name: company.company_name || company.name,
      address: company.company_address || company.address,
      country: company.company_country,
      phone: company.contact_phone || company.phone,
      email: company.contact_email || company.email,
      tax_id: company.tax_id || ''
    },

    // Field 3: Exporter (Same as certifier)
    exporter: {
      same_as_certifier: true,
      name: company.company_name || company.name,
      address: company.company_address || company.address,
      country: company.company_country,
      phone: company.contact_phone || company.phone,
      email: company.contact_email || company.email,
      tax_id: company.tax_id || ''
    },

    // Field 4: Producer (Different from exporter if not also producer)
    producer: {
      same_as_exporter: isAlsoProducer,
      name: isAlsoProducer ? company.company_name : (workflowData.producer_name || 'Various USMCA Producers'),
      address: isAlsoProducer ? company.company_address : (workflowData.producer_address || ''),
      country: isAlsoProducer ? company.company_country : (workflowData.producer_country || '')
    },

    // Field 5: Importer (Optional for exporter)
    importer: {
      name: workflowData.authorization?.importer_name || '',
      address: workflowData.authorization?.importer_address || '',
      country: workflowData.authorization?.importer_country || '',
      phone: workflowData.authorization?.importer_phone || '',
      email: workflowData.authorization?.importer_email || '',
      tax_id: workflowData.authorization?.importer_tax_id || ''
    },

    // Fields 6-11: Product details
    product_description: product.description || '',
    hs_code: product.hs_code || '',
    // ✅ REMOVED: preference_criterion default || 'B' (line 176)
    // REASON: FALSE CERTIFICATION if AI didn't determine criterion
    preference_criterion: usmca.preference_criterion,  // Must be determined by AI
    producer_indicator: isAlsoProducer ? 'YES' : 'NO',

    // Exporter-specific: Summary RVC only (not detailed worksheet)
    rvc_calculation: {
      method: 'Summary based on producer information',
      rvc_percentage: usmca.regional_content || usmca.north_american_content || 0,
      threshold_required: usmca.threshold_applied || 60,
      detailed_worksheet: false  // Exporters don't need detailed breakdown
    },

    // Blanket period (exporters can use up to 12 months)
    blanket_period: {
      allowed: true,
      max_months: 12,
      start_date: workflowData.blanket_period?.start_date || new Date().toISOString().split('T')[0],
      end_date: workflowData.blanket_period?.end_date || getDatePlusMonths(12)
    },

    // Required documentation
    required_documentation: isAlsoProducer ? [
      'Manufacturing records',
      'Component origin certifications',
      'RVC calculations'
    ] : [
      'Producer certification or declaration',
      'Commercial invoices',
      'Packing lists',
      'Bill of lading'
    ],

    basis_of_knowledge: isAlsoProducer ?
      'I produced these goods and have direct knowledge of their origin' :
      'Based on information provided by the producer and my records as the exporter'
  };
}

/**
 * IMPORTER Certificate Template
 * Used when: Business Type = Importer, Distributor, Wholesaler, Retailer
 * Complexity: SIMPLEST
 * Required: Importer details, supplier info, reliance on supplier certification
 */
export function getImporterCertificateFields(workflowData) {
  const company = workflowData.company || {};
  const product = workflowData.product || {};
  const usmca = workflowData.usmca || {};

  return {
    // Field 1: Certifier Type
    certifier_type: 'IMPORTER',
    certifier_declaration: 'I have reason to believe the goods qualify as originating',

    // Field 2: Certifier (Importer information)
    certifier: {
      name: company.company_name || company.name,
      address: company.company_address || company.address,
      country: company.company_country,
      phone: company.contact_phone || company.phone,
      email: company.contact_email || company.email,
      tax_id: company.tax_id || ''
    },

    // Field 3: Exporter (Supplier who exported to importer)
    exporter: {
      name: company.supplier_name || workflowData.exporter_name || 'Supplier Name',
      address: company.supplier_address || workflowData.exporter_address || '',
      country: company.supplier_country || workflowData.exporter_country || '',
      phone: company.supplier_phone || workflowData.exporter_phone || '',
      email: company.supplier_email || workflowData.exporter_email || '',
      tax_id: company.supplier_tax_id || workflowData.exporter_tax_id || ''
    },

    // Field 4: Producer (May not be known by importer)
    producer: {
      same_as_exporter: true,
      name: 'Same as Exporter',
      address: '',
      country: ''
    },

    // Field 5: Importer (Same as certifier)
    importer: {
      same_as_certifier: true,
      name: company.company_name || company.name,
      address: company.company_address || company.address,
      country: company.company_country,
      phone: company.contact_phone || company.phone,
      email: company.contact_email || company.email,
      tax_id: company.tax_id || ''
    },

    // Fields 6-11: Product details (may be limited for importers)
    product_description: product.description || '',
    hs_code: product.hs_code || '',
    // ✅ REMOVED: preference_criterion default || 'B' (line 271)
    // REASON: FALSE CERTIFICATION if AI didn't determine criterion
    preference_criterion: usmca.preference_criterion,  // Must be determined by AI
    producer_indicator: 'NO',  // Importer is not the producer

    // Importer-specific: No RVC calculation required
    rvc_calculation: {
      method: 'Not applicable - Importer relies on supplier certification',
      rvc_percentage: null,
      threshold_required: null,
      detailed_worksheet: false
    },

    // Blanket period (importers typically use single shipment)
    blanket_period: {
      allowed: false,  // Importers generally cannot issue blanket certificates
      max_months: 0,
      start_date: null,
      end_date: null,
      reason: 'Importer certificates are typically for single shipments'
    },

    // Required documentation
    required_documentation: [
      'Supplier USMCA certificate or declaration',
      'Commercial invoice from supplier',
      'Packing list',
      'Bill of lading or air waybill',
      'Proof of payment to supplier'
    ],

    basis_of_knowledge: "Importer's knowledge based on supplier certification and commercial documentation"
  };
}

/**
 * Route to correct template based on certifier type
 */
export function getCertificateFieldsByCertifierType(certifierType, workflowData) {
  const normalizedType = (certifierType || 'EXPORTER').toUpperCase();

  switch (normalizedType) {
    case 'PRODUCER':
      return getProducerCertificateFields(workflowData);

    case 'EXPORTER':
      return getExporterCertificateFields(workflowData);

    case 'IMPORTER':
      return getImporterCertificateFields(workflowData);

    default:
      console.warn(`Unknown certifier type: ${certifierType}, defaulting to EXPORTER`);
      return getExporterCertificateFields(workflowData);
  }
}

/**
 * Helper: Calculate Value of Non-Originating Materials (VNM)
 */
function calculateVNM(components) {
  if (!Array.isArray(components)) return 0;

  return components
    .filter(c => !isUSMCAOrigin(c.origin_country || c.country))
    .reduce((sum, c) => sum + (c.value_percentage || c.percentage || 0), 0);
}

/**
 * Helper: Calculate Value of Originating Materials (VOM)
 */
function calculateVOM(components) {
  if (!Array.isArray(components)) return 0;

  return components
    .filter(c => isUSMCAOrigin(c.origin_country || c.country))
    .reduce((sum, c) => sum + (c.value_percentage || c.percentage || 0), 0);
}

/**
 * Helper: Check if country is USMCA member
 */
function isUSMCAOrigin(country) {
  if (!country) return false;
  const usmcaCountries = ['US', 'USA', 'United States', 'CA', 'Canada', 'MX', 'Mexico'];
  return usmcaCountries.some(c => country.toUpperCase().includes(c.toUpperCase()));
}

/**
 * Helper: Get date plus N months
 */
function getDatePlusMonths(months) {
  const date = new Date();
  date.setMonth(date.getMonth() + months);
  return date.toISOString().split('T')[0];
}

/**
 * Get validation rules by certifier type
 */
export function getValidationRules(certifierType) {
  const normalizedType = (certifierType || 'EXPORTER').toUpperCase();

  const commonRules = {
    certifier_name: { required: true, message: 'Certifier name is required' },
    certifier_address: { required: true, message: 'Certifier address is required' },
    certifier_country: { required: true, message: 'Certifier country is required' },
    product_description: { required: true, message: 'Product description is required' },
    hs_code: { required: true, message: 'HS code is required' }
  };

  switch (normalizedType) {
    case 'PRODUCER':
      return {
        ...commonRules,
        component_breakdown: { required: true, minItems: 1, message: 'At least one component required for producer certificate' },
        manufacturing_location: { required: true, message: 'Manufacturing location required for producer' },
        rvc_calculation: { required: true, message: 'Detailed RVC calculation required for producer' }
      };

    case 'EXPORTER':
      return {
        ...commonRules,
        producer_name: { required: true, message: 'Producer name required (use "SAME" if exporter is producer)' },
        rvc_percentage: { required: true, message: 'RVC percentage summary required' }
      };

    case 'IMPORTER':
      return {
        ...commonRules,
        supplier_name: { required: true, message: 'Supplier (exporter) name required for importer certificate' },
        supplier_country: { required: true, message: 'Supplier country required' },
        supplier_certification: { required: true, message: 'Supplier USMCA certification required' }
      };

    default:
      return commonRules;
  }
}
