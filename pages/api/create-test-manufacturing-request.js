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
    const testRequest = {
      id: 'SR' + Date.now().toString().slice(-6),
      service_type: 'Manufacturing Feasibility',
      company_name: 'TechCorp Manufacturing',
      contact_name: 'Sarah Johnson',
      email: 'ceo@techcorp.com',
      phone: '555-0123',
      industry: 'Electronics Manufacturing',
      trade_volume: 2500000,
      assigned_to: 'Jorge',
      status: 'pending_analysis',
      priority: 'high',
      timeline: '2-3 weeks',
      budget_range: '25k-100k',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      service_details: {
        product_description: 'IoT sensors and electronic components',
        current_challenges: 'High labor costs and 25% tariffs from China',
        volume: '$2.5M annually',
        quality_standards: 'ISO 9001, UL listing required',
        preferred_locations: 'Mexico near US border',
        setup_timeline: 'Operational by Q2 2025'
      },
      consultation_status: 'pending_schedule',
      consultation_duration: '15 minutes',
      next_steps: 'Schedule 15-minute consultation call'
    };

    const { data, error } = await supabase
      .from('service_requests')
      .insert(testRequest)
      .select();

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to create test request', details: error });
    }

    return res.status(200).json({
      success: true,
      message: 'Test manufacturing feasibility request created',
      data: data[0]
    });

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Server error', message: error.message });
  }
}