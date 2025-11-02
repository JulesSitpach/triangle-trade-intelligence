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

    // Gracefully handle non-authenticated users - they use localStorage only
    if (!userId) {
      logInfo('Workflow session not found - user not authenticated (localStorage mode)', { sessionId });
      throw new ApiError('Session not found', 404);
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
        // Session not found - return success with null (graceful for frontend)
        logInfo('Workflow session not found in database - returning null', { sessionId, userId });
        return sendSuccess(res, null, 'No session found - starting fresh');
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

    // ✅ CRITICAL FIX: Normalize components to ensure required fields
    // Components MUST have hs_code and origin_country from API enrichment
    const normalizeComponents = (components) => {
      return (components || []).map((component, idx) => {
        if (!component.hs_code || !component.origin_country) {
          console.warn(`⚠️ Component ${idx} missing required fields in workflow-session:`, {
            description: component.description,
            hasHsCode: !!component.hs_code,
            hasOriginCountry: !!component.origin_country
          });
        }

        return {
          ...component,
          // ✅ Ensure required fields - NEVER save components with undefined hs_code or origin_country
          hs_code: component.hs_code || 'UNKNOWN',
          origin_country: component.origin_country || 'UNKNOWN',
          // Ensure other contract fields
          base_mfn_rate: component.base_mfn_rate !== undefined ? component.base_mfn_rate : (component.mfn_rate || 0),
          mfn_rate: component.mfn_rate !== undefined ? component.mfn_rate : (component.base_mfn_rate || 0),
          usmca_rate: component.usmca_rate !== undefined ? component.usmca_rate : 0,
          section_301: component.section_301 !== undefined ? component.section_301 : 0,
          section_232: component.section_232 !== undefined ? component.section_232 : 0,
          total_rate: component.total_rate !== undefined ? component.total_rate : 0,
          savings_percentage: component.savings_percentage !== undefined ? component.savings_percentage : 0,
          rate_source: component.rate_source || 'workflow_session',
          stale: component.stale !== undefined ? component.stale : false,
          data_source: component.data_source || 'workflow_session'
        };
      });
    };

    // Determine if this is a complete workflow
    const isCompleteWorkflow = action === 'complete' && workflowData.steps_completed >= 4;

    if (isCompleteWorkflow) {
      // Save complete workflow to workflow_completions
      // Table schema: id, user_id, email, workflow_type, workflow_name, hs_code,
      // completed_at, certificate_generated, status, total_savings, estimated_duty_savings,
      // compliance_cost_savings, workflow_data (JSONB), session_id, completion_time_minutes
      const normalizedComponents = normalizeComponents(workflowData.components || workflowData.component_origins || []);

      // ✅ CRITICAL FIX: Extract qualification status and regional content to top-level columns
      // Dashboard expects these fields in database columns, not just in JSONB
      const qualificationStatus = workflowData.usmca?.qualified ? 'QUALIFIED' : 'NOT_QUALIFIED';
      const regionalContent = parseFloat(workflowData.usmca?.regional_content || workflowData.usmca?.north_american_content) || 0;

      const workflowRecord = {
        user_id: userId,
        email: req.user?.email || null,
        workflow_type: workflowData.workflow_type || 'usmca_compliance',
        product_description:
          workflowData.product?.description ||
          workflowData.product_description ||
          workflowData.classified_hs_code ? `Product with HS ${workflowData.classified_hs_code}` : 'USMCA Analysis',
        hs_code:
          workflowData.product?.hs_code ||
          workflowData.hs_code ||
          workflowData.classified_hs_code ||  // Flat from hook
          '',
        completed_at: new Date().toISOString(),
        certificate_generated: !!workflowData.certificate_generated,
        status: 'completed',

        // ✅ NEW: Add qualification and content fields to top-level columns
        // ✅ FIXED (Nov 1): Support both nested and flat data structures
        // This is what the dashboard queries for in UserDashboard.js
        qualification_status: qualificationStatus,
        regional_content_percentage: regionalContent,
        required_threshold: workflowData.usmca?.threshold_applied || 60,
        company_name:
          workflowData.company?.company_name ||
          workflowData.company?.name ||
          workflowData.company_name ||  // Flat from hook
          null,
        company_country:
          workflowData.company?.company_country ||
          workflowData.company_country ||  // Flat from hook
          'US',
        destination_country:
          workflowData.company?.destination_country ||
          workflowData.destination_country ||  // Flat from hook
          'US',
        business_type:
          workflowData.company?.business_type ||
          workflowData.business_type ||  // Flat from hook
          null,
        manufacturing_location:
          workflowData.company?.manufacturing_location ||
          workflowData.manufacturing_location ||  // Flat from hook
          null,

        // Financial data in dedicated columns for easy querying
        total_savings: parseFloat(workflowData.savings?.annual_savings) || 0,
        estimated_duty_savings: parseFloat(workflowData.savings?.annual_savings) || 0,
        estimated_annual_savings: parseFloat(workflowData.savings?.annual_savings) || 0,
        compliance_cost_savings: 0,

        // Store ALL workflow data in JSONB column
        workflow_data: {
          ...workflowData,
          qualification_result: {
            status: qualificationStatus,
            trust_score: parseFloat(workflowData.trust?.score) || 95,
            regional_content: regionalContent,
            required_threshold: workflowData.usmca?.threshold_applied || 60,
            component_origins: normalizedComponents,
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
      // Extract company data from workflow for dedicated columns
      const companyData = workflowData.company || {};

      // ✅ Normalize components for in-progress workflow too
      const normalizedComponents = normalizeComponents(workflowData.components || workflowData.component_origins || []);

      const sessionRecord = {
        user_id: userId,
        session_id: sessionId,
        state: 'in_progress',
        data: workflowData,

        // ✅ FIXED (Oct 24): Extract company/product fields to dedicated columns
        // ✅ FIXED (Nov 1): Support both nested (workflowData.company) and flat (workflowData) structures
        // Dashboard validation requires these fields to be populated in DB columns, not just JSONB
        company_name:
          companyData.company_name ||           // Nested: workflowData.company.company_name
          companyData.name ||                   // Nested: workflowData.company.name
          workflowData.company_name ||          // Flat: workflowData.company_name (from useWorkflowState hook)
          null,
        business_type:
          companyData.business_type ||          // Nested
          workflowData.business_type ||         // Flat
          null,
        trade_volume:
          companyData.trade_volume ||
          workflowData.trade_volume ||
          null,
        manufacturing_location:
          companyData.manufacturing_location ||
          workflowData.manufacturing_location ||
          null,
        hs_code:
          workflowData.product?.hs_code ||      // Nested: workflowData.product.hs_code
          workflowData.hs_code ||               // Flat: workflowData.hs_code (from useWorkflowState hook)
          workflowData.classified_hs_code ||    // Alternative: workflowData.classified_hs_code
          null,
        product_description:
          workflowData.product?.description ||
          workflowData.product_description ||
          null,
        component_origins: normalizedComponents,

        // ✅ FIXED (Nov 1): Save qualification status to top-level column for alerts page
        qualification_status:
          workflowData.qualification_status ||
          (workflowData.usmca?.qualified ? 'QUALIFIED' : 'NOT_QUALIFIED'),

        // Destination-aware tariff intelligence fields
        destination_country: companyData.destination_country || workflowData.destination_country || null,
        trade_flow_type: companyData.trade_flow_type || workflowData.trade_flow_type || null,
        tariff_cache_strategy: companyData.tariff_cache_strategy || workflowData.tariff_cache_strategy || null,

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
