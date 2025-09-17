/**
 * ADMIN API: Suppliers Management
 * GET /api/admin/suppliers - Returns supplier directory with verification status
 * POST /api/admin/suppliers - Add new supplier (for future implementation)
 * Provides data for supplier management dashboard
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return handleGetSuppliers(req, res);
  } else if (req.method === 'POST') {
    return handleAddSupplier(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

/**
 * Handle GET request - fetch all suppliers with analytics
 */
async function handleGetSuppliers(req, res) {
  try {
    // TODO: Add admin authentication check
    
    // Query suppliers with certifications
    let { data: suppliers, error: suppliersError } = await supabase
      .from('suppliers')
      .select(`
        id,
        name,
        legal_name,
        location,
        country,
        specialization,
        verification_status,
        partnership_level,
        created_at,
        updated_at,
        verified_at,
        contact_email,
        contact_phone,
        website,
        primary_contact_name,
        business_license,
        established_year,
        employee_count,
        annual_revenue_range,
        manufacturing_capabilities,
        certifications,
        quality_standards,
        minimum_order_quantity,
        lead_time_days,
        reliability_score,
        quality_score,
        communication_score,
        total_orders,
        successful_orders,
        supplier_certifications!supplier_certifications_supplier_id_fkey (
          id,
          certification_name,
          certification_body,
          issued_date,
          expiry_date,
          verified
        )
      `)
      .order('created_at', { ascending: false });

    if (suppliersError && suppliersError.code !== 'PGRST116') { // Table doesn't exist
      console.error('Error fetching suppliers:', suppliersError);
      return res.status(500).json({ error: 'Failed to fetch supplier data' });
    }

    // If table doesn't exist or is empty, use sample data
    if (!suppliers || suppliers.length === 0) {
      console.log('Using sample supplier data for demo');
      const sampleSuppliers = [
        {
          id: '1',
          name: 'Mexico Wire Solutions',
          legal_name: 'Mexico Wire Solutions SA de CV',
          location: 'Tijuana, Baja California',
          country: 'Mexico',
          specialization: 'Automotive Electrical Components',
          verification_status: 'verified',
          partnership_level: 'preferred',
          created_at: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
          verified_at: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000).toISOString(),
          contact_email: 'contact@mexicowire.mx',
          contact_phone: '+52-664-555-0123',
          website: 'https://mexicowire.mx',
          primary_contact_name: 'José Martinez',
          established_year: 2015,
          employee_count: 250,
          annual_revenue_range: '$10M-50M',
          manufacturing_capabilities: ['Wire Harnesses', 'Connectors', 'Assemblies'],
          certifications: ['ISO 9001', 'TS 16949', 'USMCA'],
          reliability_score: 98,
          quality_score: 96,
          communication_score: 94,
          total_orders: 145,
          successful_orders: 142
        },
        {
          id: '2',
          name: 'Canadian Auto Parts Ltd',
          legal_name: 'Canadian Auto Parts Limited',
          location: 'Toronto, Ontario',
          country: 'Canada',
          specialization: 'Automotive Components',
          verification_status: 'verified',
          partnership_level: 'standard',
          created_at: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000).toISOString(),
          verified_at: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
          contact_email: 'info@canadianparts.ca',
          contact_phone: '+1-416-555-0456',
          website: 'https://canadianparts.ca',
          primary_contact_name: 'Sarah Thompson',
          established_year: 2010,
          employee_count: 180,
          annual_revenue_range: '$5M-25M',
          manufacturing_capabilities: ['Brake Components', 'Engine Parts', 'Suspension'],
          certifications: ['ISO 9001', 'QS-9000', 'USMCA'],
          reliability_score: 95,
          quality_score: 93,
          communication_score: 97,
          total_orders: 89,
          successful_orders: 85
        },
        {
          id: '3',
          name: 'Electronics Manufacturing SA',
          legal_name: 'Electronics Manufacturing SA de CV',
          location: 'Guadalajara, Jalisco',
          country: 'Mexico',
          specialization: 'Electronic Components',
          verification_status: 'pending',
          partnership_level: 'standard',
          created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
          verified_at: null,
          contact_email: 'sales@electronicsmfg.mx',
          contact_phone: '+52-33-555-0789',
          website: 'https://electronicsmfg.mx',
          primary_contact_name: 'Roberto Flores',
          established_year: 2018,
          employee_count: 120,
          annual_revenue_range: '$2M-10M',
          manufacturing_capabilities: ['PCB Assembly', 'Testing', 'Packaging'],
          certifications: ['ISO 9001', 'IPC-610'],
          reliability_score: 88,
          quality_score: 90,
          communication_score: 85,
          total_orders: 34,
          successful_orders: 30
        },
        {
          id: '4',
          name: 'Steel Components MX',
          legal_name: 'Steel Components Mexico SA de CV',
          location: 'Mexico City, CDMX',
          country: 'Mexico',
          specialization: 'Steel Manufacturing',
          verification_status: 'rejected',
          partnership_level: 'none',
          created_at: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(),
          verified_at: null,
          contact_email: 'info@steelcomponents.mx',
          contact_phone: '+52-55-555-0321',
          website: 'https://steelcomponents.mx',
          primary_contact_name: 'Miguel Rodriguez',
          established_year: 2012,
          employee_count: 450,
          annual_revenue_range: '$25M-100M',
          manufacturing_capabilities: ['Sheet Metal', 'Structural Steel', 'Machining'],
          certifications: ['ISO 9001'],
          reliability_score: 78,
          quality_score: 82,
          communication_score: 75,
          total_orders: 12,
          successful_orders: 8
        }
      ];
      
      suppliers = sampleSuppliers;
    }

    // Enrich supplier data
    const enrichedSuppliers = suppliers.map(supplier => ({
      ...supplier,
      // Calculate performance metrics
      success_rate: supplier.total_orders > 0 ? 
        ((supplier.successful_orders / supplier.total_orders) * 100) : 0,
      
      // Overall performance score
      overall_score: calculateOverallScore(supplier),
      
      // Active certifications count
      active_certifications: supplier.supplier_certifications?.filter(cert => 
        !cert.expiry_date || new Date(cert.expiry_date) > new Date()
      ).length || 0,
      
      // Days since verification
      days_since_verification: supplier.verified_at ? 
        Math.floor((new Date() - new Date(supplier.verified_at)) / (1000 * 60 * 60 * 24)) : null,
      
      // Risk indicators
      risk_level: assessSupplierRisk(supplier),
      
      // Format dates
      created_at_formatted: new Date(supplier.created_at).toLocaleDateString(),
      verified_at_formatted: supplier.verified_at ? 
        new Date(supplier.verified_at).toLocaleDateString() : 'Not verified'
    }));

    // Calculate summary statistics
    const summary = calculateSupplierSummary(enrichedSuppliers);

    return res.status(200).json({
      suppliers: enrichedSuppliers,
      summary,
      data_status: {
        total_suppliers: enrichedSuppliers.length,
        with_certifications: enrichedSuppliers.filter(s => s.supplier_certifications?.length > 0).length,
        verified_suppliers: enrichedSuppliers.filter(s => s.verification_status === 'verified').length
      }
    });

  } catch (error) {
    console.error('Suppliers API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

/**
 * Handle POST request - add new supplier
 */
async function handleAddSupplier(req, res) {
  try {
    // TODO: Add admin authentication check
    const {
      name,
      legal_name,
      location,
      country,
      specialization,
      contact_email,
      contact_phone,
      website,
      primary_contact_name,
      business_license,
      established_year,
      employee_count,
      annual_revenue_range,
      manufacturing_capabilities,
      certifications,
      quality_standards,
      minimum_order_quantity,
      lead_time_days
    } = req.body;

    // Validate required fields
    if (!name || !location || !country) {
      return res.status(400).json({ 
        error: 'Missing required fields: name, location, country' 
      });
    }

    // Normalize array fields to prevent malformed array literal errors
    const normalizeArray = (value) => {
      if (Array.isArray(value)) return value;
      if (typeof value === 'string' && value.trim() !== '') return [value];
      return [];
    };

    // Insert new supplier
    const { data: newSupplier, error: insertError } = await supabase
      .from('suppliers')
      .insert({
        name,
        legal_name: legal_name || name,
        location,
        country,
        specialization: normalizeArray(specialization),
        verification_status: 'pending',
        partnership_level: 'basic',
        contact_email,
        contact_phone,
        website,
        primary_contact_name,
        business_license,
        established_year,
        employee_count,
        annual_revenue_range,
        manufacturing_capabilities: normalizeArray(manufacturing_capabilities),
        certifications: normalizeArray(certifications),
        quality_standards: normalizeArray(quality_standards),
        minimum_order_quantity,
        lead_time_days,
        reliability_score: 0.00,
        quality_score: 0.00,
        communication_score: 0.00,
        total_orders: 0,
        successful_orders: 0
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting supplier:', insertError);
      return res.status(500).json({ error: 'Failed to add supplier' });
    }

    return res.status(201).json({
      supplier: newSupplier,
      message: 'Supplier added successfully'
    });

  } catch (error) {
    console.error('Add supplier API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

/**
 * Calculate overall performance score for supplier
 */
function calculateOverallScore(supplier) {
  const scores = [
    supplier.reliability_score || 0,
    supplier.quality_score || 0,
    supplier.communication_score || 0
  ];
  
  const validScores = scores.filter(score => score > 0);
  if (validScores.length === 0) return 0;
  
  return Math.round((validScores.reduce((sum, score) => sum + score, 0) / validScores.length) * 100) / 100;
}

/**
 * Assess supplier risk level
 */
function assessSupplierRisk(supplier) {
  let riskFactors = 0;
  
  // Risk factors
  if (supplier.verification_status !== 'verified') riskFactors++;
  if (!supplier.business_license) riskFactors++;
  if (supplier.total_orders === 0) riskFactors++;
  if (supplier.reliability_score < 3.0) riskFactors++;
  if (!supplier.supplier_certifications || supplier.supplier_certifications.length === 0) riskFactors++;
  
  // Risk level based on factors
  if (riskFactors <= 1) return 'low';
  if (riskFactors <= 3) return 'medium';
  return 'high';
}

/**
 * Calculate supplier summary statistics
 */
function calculateSupplierSummary(suppliers) {
  const total = suppliers.length;
  const verified = suppliers.filter(s => s.verification_status === 'verified').length;
  const pending = suppliers.filter(s => s.verification_status === 'pending').length;
  const rejected = suppliers.filter(s => s.verification_status === 'rejected').length;

  // Group by country
  const byCountry = suppliers.reduce((acc, supplier) => {
    const country = supplier.country || 'Unknown';
    acc[country] = (acc[country] || 0) + 1;
    return acc;
  }, {});

  // Group by specialization
  const bySpecialization = suppliers.reduce((acc, supplier) => {
    if (supplier.specialization && Array.isArray(supplier.specialization)) {
      supplier.specialization.forEach(spec => {
        acc[spec] = (acc[spec] || 0) + 1;
      });
    }
    return acc;
  }, {});

  // Calculate averages
  const avgReliabilityScore = suppliers.length > 0 ?
    suppliers.reduce((sum, s) => sum + (s.reliability_score || 0), 0) / suppliers.length : 0;
  
  const avgQualityScore = suppliers.length > 0 ?
    suppliers.reduce((sum, s) => sum + (s.quality_score || 0), 0) / suppliers.length : 0;

  return {
    total,
    verified,
    pending,
    rejected,
    suspended: suppliers.filter(s => s.verification_status === 'suspended').length,
    
    // Performance metrics
    avg_reliability_score: Math.round(avgReliabilityScore * 100) / 100,
    avg_quality_score: Math.round(avgQualityScore * 100) / 100,
    
    // Risk distribution
    risk_distribution: {
      low: suppliers.filter(s => s.risk_level === 'low').length,
      medium: suppliers.filter(s => s.risk_level === 'medium').length,
      high: suppliers.filter(s => s.risk_level === 'high').length
    },
    
    // Geographic distribution
    by_country: Object.entries(byCountry).map(([country, count]) => ({
      country,
      count,
      percentage: total > 0 ? Math.round((count / total) * 1000) / 10 : 0
    })),
    
    // Specialization distribution
    by_specialization: Object.entries(bySpecialization).map(([specialization, count]) => ({
      specialization,
      count,
      percentage: total > 0 ? Math.round((count / total) * 1000) / 10 : 0
    })),
    
    // Partnership levels
    partnership_levels: {
      basic: suppliers.filter(s => s.partnership_level === 'basic').length,
      preferred: suppliers.filter(s => s.partnership_level === 'preferred').length,
      premium: suppliers.filter(s => s.partnership_level === 'premium').length,
      exclusive: suppliers.filter(s => s.partnership_level === 'exclusive').length
    }
  };
}