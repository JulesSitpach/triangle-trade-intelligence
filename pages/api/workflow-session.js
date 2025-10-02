/**
 * Workflow Session Storage API
 * Replaces localStorage with persistent Supabase database storage
 * Enables workflow resume, analytics, and cross-device access
 */

import { createClient } from '@supabase/supabase-js';
import { logInfo, logError } from '../../lib/utils/production-logger.js';
import { apiHandler, sendSuccess } from '../../lib/api/apiHandler.js';
import { ApiError, validateRequiredFields } from '../../lib/api/errorHandler.js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Helper function to generate UUID
const generateUUID = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
  const r = Math.random() * 16 | 0;
  const v = c == 'x' ? r : (r & 0x3 | 0x8);
  return v.toString(16);
});

export default apiHandler({
  GET: async (req, res) => {
    const startTime = Date.now();
    const { sessionId } = req.query;

    // Validate required fields
    validateRequiredFields({ sessionId }, ['sessionId']);

    // Try workflow_sessions first for in-progress workflows
    let { data, error } = await supabase
      .from('workflow_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    // If not found in sessions, try workflow_completions for completed workflows
    if (error && error.code === 'PGRST116') {
      const completedResult = await supabase
        .from('workflow_completions')
        .select('*')
        .eq('session_id', sessionId)
        .single();

      data = completedResult.data;
      error = completedResult.error;
    }

    if (error) {
      if (error.code === 'PGRST116') {
        throw new ApiError('Session not found', 404);
      }

      logError('Failed to retrieve workflow session', { error: error.message, sessionId });
      throw new ApiError('Database query failed', 500, { details: error.message });
    }

    logInfo('Workflow session retrieved', {
      sessionId,
      duration_ms: Date.now() - startTime
    });

    return sendSuccess(res, data.workflow_data || data, 'Workflow session retrieved successfully');
  },

  POST: async (req, res) => {
    const startTime = Date.now();
    const { sessionId, workflowData, userId, action } = req.body;

    // Validate required fields
    validateRequiredFields({ sessionId, workflowData }, ['sessionId', 'workflowData']);

    // Determine if this is a complete workflow
    const isCompleteWorkflow = action === 'complete' && workflowData.steps_completed >= 4;

    if (isCompleteWorkflow) {
      // Save complete workflow to workflow_completions
      const workflowRecord = {
        id: workflowData.id || `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_id: userId || 'anonymous',
        workflow_type: workflowData.workflow_type || 'usmca_compliance',
        product_description: workflowData.product?.description || workflowData.product_description || 'USMCA Analysis',
        hs_code: workflowData.product?.hs_code || workflowData.hs_code || '',
        classification_confidence: parseFloat(workflowData.classification_confidence) || 0.95,
        qualification_result: {
          status: workflowData.usmca?.qualified ? 'QUALIFIED' : 'NOT_QUALIFIED',
          trust_score: parseFloat(workflowData.trust?.score) || 95,
          regional_content: parseFloat(workflowData.usmca?.regional_content || workflowData.usmca?.north_american_content) || 0,
          savings_calculation: parseFloat(workflowData.savings?.annual_savings) || 0,
          component_origins: workflowData.components || [],
          supplier_country: workflowData.company?.supplier_country
        },
        savings_amount: parseFloat(workflowData.savings?.annual_savings) || 0,
        completion_time_seconds: workflowData.completion_time_seconds || 0,
        completed_at: new Date().toISOString(),
        steps_completed: parseInt(workflowData.steps_completed) || 4,
        total_steps: parseInt(workflowData.total_steps) || 4,
        step_timings: workflowData.step_timings || null,
        certificate_generated: !!workflowData.certificate_generated,
        certificate_id: workflowData.certificate_id || null,
        session_id: sessionId
      };

      const { data, error } = await supabase
        .from('workflow_completions')
        .upsert(workflowRecord, {
          onConflict: 'session_id',
          returning: 'minimal'
        });

      if (error) {
        logError('Failed to save complete workflow', { error: error.message, sessionId });
        throw new ApiError('Database save failed', 500, { details: error.message });
      }
    } else {
      // Save in-progress workflow to workflow_sessions
      const sessionRecord = {
        id: generateUUID(),
        user_id: userId || 'anonymous',
        session_id: sessionId,
        state: 'in_progress',
        data: workflowData,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      };

      const { data, error } = await supabase
        .from('workflow_sessions')
        .upsert(sessionRecord, {
          onConflict: 'session_id',
          returning: 'minimal'
        });

      if (error) {
        logError('Failed to save workflow session', { error: error.message, sessionId });
        throw new ApiError('Database save failed', 500, { details: error.message });
      }
    }

    logInfo('Workflow session saved successfully', {
      sessionId,
      userId,
      duration_ms: Date.now() - startTime
    });

    return sendSuccess(res, { sessionId }, 'Workflow session saved successfully');
  }
});
