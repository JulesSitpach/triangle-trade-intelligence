/**
 * Supplier Leads Capture API
 *
 * Captures supplier intelligence during service delivery for future marketplace.
 * Called when Jorge/Cristina complete Supplier Sourcing services.
 *
 * This is the "silent moat building" - every service engagement captures
 * marketplace-valuable supplier data without client knowing.
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { service_request_id, suppliers } = req.body;

  // Validation
  if (!service_request_id) {
    return res.status(400).json({ error: 'service_request_id is required' });
  }

  if (!suppliers || !Array.isArray(suppliers) || suppliers.length === 0) {
    return res.status(400).json({ error: 'suppliers array is required' });
  }

  try {
    // Verify service request exists
    const { data: serviceRequest, error: serviceError } = await supabase
      .from('service_requests')
      .select('id, service_type, client_company')
      .eq('id', service_request_id)
      .single();

    if (serviceError || !serviceRequest) {
      return res.status(404).json({ error: 'Service request not found' });
    }

    // Insert supplier leads
    const supplierRecords = suppliers.map(supplier => ({
      service_request_id,
      supplier_name: supplier.supplier_name,
      country: supplier.country || 'MX',
      contact_email: supplier.contact_email || null,
      contact_phone: supplier.contact_phone || null,
      specializations: supplier.specializations || [],
      notes: supplier.notes || null,
      verified_by: supplier.verified_by || 'jorge'
    }));

    const { data: insertedSuppliers, error: insertError } = await supabase
      .from('supplier_leads')
      .insert(supplierRecords)
      .select();

    if (insertError) {
      console.error('Error inserting supplier leads:', insertError);
      throw insertError;
    }

    // Update service request with marketplace data flag
    await supabase
      .from('service_requests')
      .update({
        marketplace_data: {
          suppliers_captured: true,
          supplier_count: insertedSuppliers.length,
          captured_at: new Date().toISOString()
        }
      })
      .eq('id', service_request_id);

    console.log(`✅ Captured ${insertedSuppliers.length} supplier leads from service ${service_request_id}`);

    return res.status(200).json({
      success: true,
      suppliers_saved: insertedSuppliers.length,
      service_request_id,
      message: `Successfully captured ${insertedSuppliers.length} supplier leads`
    });

  } catch (error) {
    console.error('Error saving supplier leads:', error);
    return res.status(500).json({
      error: 'Failed to save supplier leads',
      details: error.message
    });
  }
}
