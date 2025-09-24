import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const serviceMapping = {
      'mexico-supplier-sourcing': 'Supplier Sourcing',
      'supplier-sourcing': 'Supplier Sourcing',
      'supplier-vetting': 'Supplier Sourcing',
      'mexico-manufacturing-feasibility': 'Manufacturing Feasibility',
      'manufacturing-feasibility': 'Manufacturing Feasibility',
      'mexico-market-entry': 'Market Entry',
      'market-entry': 'Market Entry',
      'partnership-intelligence': 'Partnership Intelligence',
      'crisis-response': 'Crisis Response'
    };

    const { data: allRequests, error: fetchError } = await supabase
      .from('service_requests')
      .select('id, service_type');

    if (fetchError) throw fetchError;

    const updates = [];
    for (const request of allRequests) {
      const standardizedType = serviceMapping[request.service_type];
      if (standardizedType && standardizedType !== request.service_type) {
        updates.push({
          id: request.id,
          old: request.service_type,
          new: standardizedType
        });

        const { error: updateError } = await supabase
          .from('service_requests')
          .update({ service_type: standardizedType })
          .eq('id', request.id);

        if (updateError) {
          console.error(`Failed to update ${request.id}:`, updateError);
        }
      }
    }

    res.status(200).json({
      success: true,
      message: 'Service types standardized',
      updates: updates,
      total_updated: updates.length
    });

  } catch (error) {
    console.error('Error standardizing service types:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to standardize service types',
      message: error.message
    });
  }
}