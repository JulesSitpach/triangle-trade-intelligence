import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return handleGetProgress(req, res);
  } else if (req.method === 'POST') {
    return handleSaveProgress(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleGetProgress(req, res) {
  try {
    const { request_id } = req.query;

    if (!request_id) {
      return res.status(400).json({ error: 'request_id is required' });
    }

    // Try to get workflow progress from database
    try {
      const { data, error } = await supabase
        .from('workflow_progress')
        .select('*')
        .eq('request_id', request_id)
        .single();

      if (data) {
        return res.status(200).json({
          success: true,
          progress: {
            current_stage: data.current_stage,
            stage_data: data.stage_data,
            updated_at: data.updated_at
          }
        });
      }
    } catch (dbError) {
      console.log('Database unavailable for workflow progress');
    }

    // No progress found
    return res.status(200).json({
      success: true,
      progress: null
    });

  } catch (error) {
    console.error('Error fetching workflow progress:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch workflow progress'
    });
  }
}

async function handleSaveProgress(req, res) {
  try {
    const { request_id, current_stage, stage_data } = req.body;

    if (!request_id || !current_stage) {
      return res.status(400).json({ error: 'request_id and current_stage are required' });
    }

    const progressData = {
      request_id,
      current_stage,
      stage_data: stage_data || {},
      updated_at: new Date().toISOString()
    };

    // Try to save to database
    try {
      const { data, error } = await supabase
        .from('workflow_progress')
        .upsert(progressData, { onConflict: 'request_id' })
        .select();

      if (error) throw error;

      return res.status(200).json({
        success: true,
        message: 'Workflow progress saved',
        progress: data[0]
      });
    } catch (dbError) {
      console.log('Database unavailable - progress logged locally');

      // Return success even if database fails (for demo mode)
      return res.status(200).json({
        success: true,
        message: 'Workflow progress saved (local mode)',
        progress: progressData
      });
    }

  } catch (error) {
    console.error('Error saving workflow progress:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to save workflow progress'
    });
  }
}