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
    const testRequests = [
      // USMCA Certificate Request
      {
        id: 'SR' + Date.now().toString().slice(-6) + '1',
        service_type: 'USMCA Certificates',
        company_name: 'AutoParts Corp',
        contact_name: 'Mike Rodriguez',
        email: 'mike@autoparts.com',
        phone: '555-0234',
        industry: 'Automotive Parts',
        trade_volume: 1800000,
        assigned_to: 'Cristina',
        status: 'pending_analysis',
        priority: 'medium',
        timeline: 'Same day',
        budget_range: '200-300',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        service_details: {
          product_description: 'Automotive brake components and sensors',
          manufacturing_location: 'Tijuana, Mexico',
          volume: '$1.8M annually',
          component_count: 8,
          current_hs_code: '8708.30.50'
        },
        consultation_status: 'pending_schedule',
        consultation_duration: '15 minutes',
        next_steps: 'Generate USMCA certificate'
      },

      // HS Classification Request
      {
        id: 'SR' + Date.now().toString().slice(-6) + '2',
        service_type: 'HS Classification',
        company_name: 'ElectroTech Solutions',
        contact_name: 'Lisa Chen',
        email: 'lisa@electrotech.com',
        phone: '555-0345',
        industry: 'Electronics',
        trade_volume: 950000,
        assigned_to: 'Cristina',
        status: 'pending_analysis',
        priority: 'high',
        timeline: 'Same day',
        budget_range: '150-250',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        service_details: {
          product_description: 'Smart home IoT devices and controllers',
          manufacturing_location: 'Shenzhen, China',
          volume: '$950K annually',
          component_count: 12,
          current_hs_code: 'To be determined'
        },
        consultation_status: 'pending_schedule',
        consultation_duration: '15 minutes',
        next_steps: 'Validate HS classification'
      },

      // Crisis Response Request
      {
        id: 'SR' + Date.now().toString().slice(-6) + '3',
        service_type: 'Crisis Response',
        company_name: 'Global Trade Inc',
        contact_name: 'David Kim',
        email: 'david@globaltrade.com',
        phone: '555-0456',
        industry: 'Import/Export',
        trade_volume: 3200000,
        assigned_to: 'Cristina',
        status: 'pending_analysis',
        priority: 'urgent',
        timeline: '24-48 hours',
        budget_range: '400-600',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        service_details: {
          product_description: 'Mixed consumer goods and electronics',
          volume: '$3.2M annually',
          risk_factors: 'Sudden tariff increase disruption',
          crisis_severity: 'High',
          immediate_impact: 'Shipments delayed, costs increased 25%'
        },
        consultation_status: 'pending_schedule',
        consultation_duration: '15 minutes',
        next_steps: 'Crisis analysis and action plan'
      }
    ];

    const results = [];
    for (const request of testRequests) {
      const { data, error } = await supabase
        .from('service_requests')
        .insert(request)
        .select();

      if (error) {
        console.error(`Error creating ${request.service_type} request:`, error);
      } else {
        results.push(data[0]);
        console.log(`✅ Created ${request.service_type} request for ${request.company_name}`);
      }
    }

    return res.status(200).json({
      success: true,
      message: `Created ${results.length} test service requests for Cristina`,
      data: results
    });

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Server error', message: error.message });
  }
}