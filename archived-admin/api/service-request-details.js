import { createClient } from '@supabase/supabase-js';
import { logDevIssue, DevIssue } from '../../../lib/utils/logDevIssue.js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    await DevIssue.validationError('admin_api', 'request_method', req.method, {
      endpoint: '/api/admin/service-request-details',
      allowed_methods: ['GET']
    });
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id) {
    await DevIssue.missingData('admin_api', 'service_request_id', {
      endpoint: '/api/admin/service-request-details',
      query: req.query
    });
    return res.status(400).json({ error: 'Request ID required' });
  }

  console.log('📋 Fetching request details for ID:', id);

  try {
    const { data, error } = await supabase
      .from('service_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    if (data) {
      console.log('✅ Found request:', data.company_name);

      // Log if subscriber_data is missing or incomplete
      if (!data.subscriber_data) {
        await DevIssue.missingData('admin_api', 'subscriber_data', {
          request_id: id,
          company_name: data.company_name,
          service_type: data.service_type
        });
      } else if (!data.subscriber_data.company_name) {
        await DevIssue.missingData('admin_api', 'subscriber_data.company_name', {
          request_id: id,
          company_name: data.company_name,
          service_type: data.service_type
        });
      }

      res.status(200).json(data);
    } else {
      await logDevIssue({
        type: 'missing_data',
        severity: 'medium',
        component: 'admin_api',
        message: 'Service request not found in database',
        data: { request_id: id }
      });
      res.status(404).json({ error: 'Request not found' });
    }
  } catch (error) {
    console.error('❌ Error fetching request:', error);
    await DevIssue.apiError('admin_api', '/api/admin/service-request-details', error, {
      request_id: id
    });
    res.status(500).json({ error: 'Failed to fetch request details' });
  }
}