/**
 * Workflow Session Storage API
 * Replaces localStorage with persistent Supabase database storage
 * Enables workflow resume, analytics, and cross-device access
 */

import { createClient } from '@supabase/supabase-js';
import { logInfo, logError } from '../../lib/utils/production-logger.js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const startTime = Date.now();

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'POST') {
      // Save or update workflow session
      const { sessionId, workflowData, userId, action } = req.body;

      if (!sessionId || !workflowData) {
        return res.status(400).json({
          success: false,
          error: 'sessionId and workflowData are required'
        });
      }

      // For in-progress workflows, use workflow_sessions table instead
      // Only save to workflow_completions when workflow is actually complete
      const isCompleteWorkflow = action === 'complete' && workflowData.steps_completed >= 4;

      if (isCompleteWorkflow) {
        // Save complete workflow to workflow_completions with all required fields
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

        var { data, error } = await supabase
          .from('workflow_completions')
          .upsert(workflowRecord, {
            onConflict: 'session_id',
            returning: 'minimal'
          });
      } else {
        // Save in-progress workflow to workflow_sessions
        // Generate proper UUID for database
        const generateUUID = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c == 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });

        const sessionRecord = {
          id: generateUUID(),
          user_id: userId || 'anonymous',
          session_id: sessionId, // Keep original sessionId for reference
          state: 'in_progress',
          data: workflowData,
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
        };

        var { data, error } = await supabase
          .from('workflow_sessions')
          .upsert(sessionRecord, {
            onConflict: 'session_id',
            returning: 'minimal'
          });
      }

      if (error) {
        logError('Failed to save workflow session', { error: error.message, sessionId });
        return res.status(500).json({
          success: false,
          error: 'Database save failed',
          details: error.message
        });
      }

      logInfo('Workflow session saved successfully', {
        sessionId,
        userId,
        duration_ms: Date.now() - startTime
      });

      return res.status(200).json({
        success: true,
        sessionId,
        message: 'Workflow session saved successfully'
      });

    } else if (req.method === 'GET') {
      // Retrieve workflow session
      const { sessionId } = req.query;

      if (!sessionId) {
        return res.status(400).json({
          success: false,
          error: 'sessionId is required'
        });
      }

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
          return res.status(404).json({
            success: false,
            error: 'Session not found'
          });
        }

        logError('Failed to retrieve workflow session', { error: error.message, sessionId });
        return res.status(500).json({
          success: false,
          error: 'Database query failed',
          details: error.message
        });
      }

      logInfo('Workflow session retrieved', {
        sessionId,
        duration_ms: Date.now() - startTime
      });

      return res.status(200).json({
        success: true,
        data: data.workflow_data || data,
        sessionId
      });

    } else {
      return res.status(405).json({
        success: false,
        error: 'Method not allowed',
        allowed_methods: ['GET', 'POST']
      });
    }

  } catch (error) {
    logError('Workflow session API error', { error: error.message });
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
}