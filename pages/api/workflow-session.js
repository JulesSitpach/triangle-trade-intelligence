/**
 * Workflow Session Storage API
 * Replaces localStorage with persistent Supabase database storage
 * Enables workflow resume, analytics, and cross-device access
 */

import { createClient } from '@supabase/supabase-js';
import { logInfo, logError } from '../../lib/utils/production-logger.js';
import { protectedApiHandler, sendSuccess } from '../../lib/api/apiHandler.js';
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

export default protectedApiHandler({
  GET: async (req, res) => {
    const startTime = Date.now();
    const { sessionId } = req.query;
    const userId = req.user?.id; // Get user ID from authenticated session

    // Validate required fields
    validateRequiredFields({ sessionId }, ['sessionId']);

    // CRITICAL: Check if user is authenticated before querying
    if (!userId) {
      logError('Workflow session retrieval failed - no authentication', { sessionId });
      throw new ApiError('Authentication required', 401);
    }

    // Try workflow_sessions first for in-progress workflows
    let { data, error } = await supabase
      .from('workflow_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .eq('user_id', userId)
      .single();

    // If not found in sessions, try workflow_completions for completed workflows
    if (error && error.code === 'PGRST116') {
      const completedResult = await supabase
        .from('workflow_completions')
        .select('*')
        .eq('session_id', sessionId)
        .eq('user_id', userId)
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
    const { sessionId, workflowData, action } = req.body;
    const userId = req.user?.id; // Get user ID from authenticated session (optional for dev testing)

    // Validate required fields
    validateRequiredFields({ sessionId, workflowData }, ['sessionId', 'workflowData']);

    // Skip database save if not authenticated (developer testing mode)
    if (!userId) {
      logInfo('Workflow not saved - no authentication (dev testing)', { sessionId });
      return sendSuccess(res, { sessionId, saved: false, reason: 'not_authenticated' }, 'Workflow processed (not saved - no auth)');
    }

    // Determine if this is a complete workflow
    const isCompleteWorkflow = action === 'complete' && workflowData.steps_completed >= 4;

    if (isCompleteWorkflow) {
      // Save complete workflow to workflow_completions
      // Table schema: id, user_id, email, workflow_type, workflow_name, hs_code,
      // completed_at, certificate_generated, status, total_savings, estimated_duty_savings,
      // compliance_cost_savings, workflow_data (JSONB), session_id, completion_time_minutes
      const workflowRecord = {
        user_id: userId,
        email: req.user?.email || null,
        workflow_type: workflowData.workflow_type || 'usmca_compliance',
        product_description: workflowData.product?.description || workflowData.product_description || 'USMCA Analysis',
        hs_code: workflowData.product?.hs_code || workflowData.hs_code || '',
        completed_at: new Date().toISOString(),
        certificate_generated: !!workflowData.certificate_generated,
        status: 'completed',

        // Financial data in dedicated columns for easy querying
        total_savings: parseFloat(workflowData.savings?.annual_savings) || 0,
        estimated_duty_savings: parseFloat(workflowData.savings?.annual_savings) || 0,
        compliance_cost_savings: 0,

        // Store ALL workflow data in JSONB column
        workflow_data: {
          ...workflowData,
          qualification_result: {
            status: workflowData.usmca?.qualified ? 'QUALIFIED' : 'NOT_QUALIFIED',
            trust_score: parseFloat(workflowData.trust?.score) || 95,
            regional_content: parseFloat(workflowData.usmca?.regional_content || workflowData.usmca?.north_american_content) || 0,
            required_threshold: workflowData.usmca?.threshold_applied || 60,
            component_origins: workflowData.components || workflowData.component_origins || [],
            supplier_country: workflowData.company?.supplier_country
          }
        },

        session_id: sessionId,
        completion_time_minutes: Math.ceil((workflowData.completion_time_seconds || 180) / 60)
      };

      const { data, error } = await supabase
        .from('workflow_completions')
        .insert(workflowRecord)
        .select();

      if (error) {
        logError('Failed to save complete workflow', { error: error.message, sessionId });
        throw new ApiError('Database save failed', 500, { details: error.message });
      }
    } else {
      // Save in-progress workflow to workflow_sessions
      const sessionRecord = {
        user_id: userId,
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
