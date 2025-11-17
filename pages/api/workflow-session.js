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

    // ✅ NEW (Nov 8): Merge executive_summary into returned data
    // Executive summary is stored at top level, not in workflow_data JSONB
    const responseData = data.workflow_data || data;
    if (data.executive_summary) {
      responseData.detailed_analysis = responseData.detailed_analysis || {};
      responseData.detailed_analysis.situation_brief = data.executive_summary;
      console.log('✅ Added executive_summary to response for reload:', {
        has_summary: true,
        summary_length: data.executive_summary.length
      });
    }

    return sendSuccess(res, responseData, 'Workflow session retrieved successfully');
  },

  POST: async (req, res) => {
    const startTime = Date.now();
    const { sessionId, workflowData, action } = req.body;
    const userId = req.user?.id; // Get user ID from authenticated session (optional for dev testing)

    console.log('═══════════════════════════════════════════════════');
    console.log('[WORKFLOW-SESSION-DEBUG] POST request received');
    console.log('[WORKFLOW-SESSION-DEBUG] sessionId:', sessionId);
    console.log('[WORKFLOW-SESSION-DEBUG] Type of sessionId:', typeof sessionId);
    console.log('[WORKFLOW-SESSION-DEBUG] userId:', userId);
    console.log('[WORKFLOW-SESSION-DEBUG] action:', action);
    console.log('[WORKFLOW-SESSION-DEBUG] steps_completed:', workflowData.steps_completed);
    console.log('[WORKFLOW-SESSION-DEBUG] Type of steps_completed:', typeof workflowData.steps_completed);
    console.log('═══════════════════════════════════════════════════');

    // Validate required fields
    validateRequiredFields({ sessionId, workflowData }, ['sessionId', 'workflowData']);

    // Skip database save if not authenticated (developer testing mode)
    if (!userId) {
      logInfo('Workflow not saved - no authentication (dev testing)', { sessionId });
      return sendSuccess(res, { sessionId, saved: false, reason: 'not_authenticated' }, 'Workflow processed (not saved - no auth)');
    }

    // ✅ CRITICAL FIX: Normalize components to ensure required fields
    // Components MUST have hs_code and origin_country from API enrichment
    const normalizeComponents = (components, isComplete) => {
      return (components || []).map((component, idx) => {
        // Only warn if workflow is COMPLETE and still missing fields (critical issue)
        // Don't warn for in-progress workflows (user is still filling them in)
        if (isComplete && (!component.hs_code || !component.origin_country)) {
          console.warn(`⚠️ Component ${idx} missing required fields in COMPLETED workflow:`, {
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

    // ✅ CRITICAL FIX: Handle executive_summary update separately
    // This prevents infinite free summary regeneration by saving to database
    if (action === 'update_executive_summary') {
      console.log('💾 [WORKFLOW-SESSION] Updating executive summary for session:', sessionId);

      try {
        // First, fetch existing data to merge with new summary
        const { data: existingSession } = await supabase
          .from('workflow_sessions')
          .select('data')
          .eq('session_id', sessionId)
          .eq('user_id', userId)
          .single();

        const { data: existingCompletion } = await supabase
          .from('workflow_completions')
          .select('workflow_data')
          .eq('session_id', sessionId)
          .eq('user_id', userId)
          .single();

        // Merge executive summary into existing data
        const mergedSessionData = {
          ...(existingSession?.data || {}),
          detailed_analysis: workflowData.detailed_analysis
        };

        const mergedCompletionData = {
          ...(existingCompletion?.workflow_data || {}),
          detailed_analysis: workflowData.detailed_analysis
        };

        // Update workflow_sessions if it exists
        let sessionUpdateSuccess = false;
        if (existingSession) {
          const { error: sessionError } = await supabase
            .from('workflow_sessions')
            .update({
              executive_summary: workflowData.executive_summary,
              data: mergedSessionData
            })
            .eq('session_id', sessionId)
            .eq('user_id', userId);

          sessionUpdateSuccess = !sessionError;
          if (sessionError) {
            console.error('⚠️ Failed to update workflow_sessions:', sessionError);
          } else {
            console.log('✅ Updated workflow_sessions with executive summary');
          }
        }

        // Update workflow_completions if it exists
        let completionUpdateSuccess = false;
        if (existingCompletion) {
          const { error: completionError } = await supabase
            .from('workflow_completions')
            .update({
              executive_summary: workflowData.executive_summary,
              workflow_data: mergedCompletionData
            })
            .eq('session_id', sessionId)
            .eq('user_id', userId);

          completionUpdateSuccess = !completionError;
          if (completionError) {
            console.error('⚠️ Failed to update workflow_completions:', completionError);
          } else {
            console.log('✅ Updated workflow_completions with executive summary');
          }
        }

        if (!sessionUpdateSuccess && !completionUpdateSuccess) {
          console.error('❌ Failed to save executive summary to any table');
          return res.status(500).json({ success: false, error: 'Failed to save executive summary' });
        }

        console.log('✅ Executive summary saved to database successfully');
        return sendSuccess(res, { saved: true }, 'Executive summary saved successfully');
      } catch (error) {
        console.error('❌ Error saving executive summary:', error);
        return res.status(500).json({ success: false, error: 'Failed to save executive summary' });
      }
    }

    // Determine if this is a complete workflow
    const isCompleteWorkflow = action === 'complete' && workflowData.steps_completed >= 4;

    console.log('🔍 [WORKFLOW-SESSION-DEBUG] Completion check:');
    console.log('  - action === "complete"?', action === 'complete');
    console.log('  - steps_completed >= 4?', workflowData.steps_completed >= 4);
    console.log('  - isCompleteWorkflow?', isCompleteWorkflow);

    if (isCompleteWorkflow) {
      console.log('✅ [WORKFLOW-SESSION-DEBUG] Saving to workflow_completions + incrementing usage counter');
      // Save complete workflow to workflow_completions
      // Table schema: id, user_id, email, workflow_type, workflow_name, hs_code,
      // completed_at, certificate_generated, status, total_savings, estimated_duty_savings,
      // compliance_cost_savings, workflow_data (JSONB), session_id, completion_time_minutes
      const normalizedComponents = normalizeComponents(workflowData.components || workflowData.component_origins || [], true);

      // ✅ CRITICAL FIX: Extract qualification status and regional content to top-level columns
      // Dashboard expects these fields in database columns, not just in JSONB
      const qualificationStatus = workflowData.usmca?.qualified ? 'QUALIFIED' : 'NOT_QUALIFIED';

      // ✅ FIX (Nov 12): Ensure regional_content is 0-100 percentage, not 0-1 decimal
      let regionalContent = parseFloat(workflowData.usmca?.regional_content || workflowData.usmca?.north_american_content) || 0;
      // If AI returned decimal format (0.82), convert to percentage (82)
      if (regionalContent > 0 && regionalContent < 1) {
        regionalContent = regionalContent * 100;
      }
      // Clamp to 0-100 range for database constraint
      regionalContent = Math.max(0, Math.min(100, regionalContent));

      const workflowRecord = {
        user_id: userId,
        email: req.user?.email || null,
        workflow_type: workflowData.workflow_type || 'usmca_compliance',
        product_description:
          workflowData.product?.description ||
          workflowData.product_description ||
          (workflowData.classified_hs_code
            ? `Product with HS ${workflowData.classified_hs_code}`
            : (workflowData.product?.hs_code
                ? `Product with HS ${workflowData.product.hs_code}`
                : 'USMCA Analysis')),
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
          workflowData.company_country ||       // ✅ FIX (Nov 8): Top-level from workflow hook (line 609 in useWorkflowState.js)
          workflowData.company?.company_country ||
          workflowData.company?.country ||
          null,
        destination_country:
          workflowData.destination_country ||   // ✅ FIX (Nov 8): Top-level from workflow hook
          workflowData.company?.destination_country ||
          (() => {
            throw new Error('destination_country is required but missing. UI validation should prevent this. Available keys: ' + Object.keys(workflowData).join(', '));
          })(),
        business_type:
          workflowData.company?.business_type ||
          workflowData.business_type ||  // Flat from hook
          null,
        manufacturing_location:
          workflowData.product?.manufacturing_location ||  // ✅ FIX (Nov 8): AI response has it in product object
          workflowData.company?.manufacturing_location ||
          workflowData.manufacturing_location ||
          workflowData.usmca?.manufacturing_location ||
          (() => {
            throw new Error(`manufacturing_location is required but missing. Available keys: ${Object.keys(workflowData).join(', ')}`);
          })(),

        // Component origins in top-level column for database queries
        component_origins: normalizedComponents,

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

        // ✅ FIX (Nov 12): Copy executive_summary from workflowData if it exists
        // Executive summaries are generated during workflow and need to persist to completions table
        executive_summary: workflowData.detailed_analysis?.situation_brief || null,

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

      // ✅ STANDARD SAAS PATTERN: Increment usage counter ONLY on successful workflow completion
      // This ensures users are only charged for completed workflows, not abandoned ones
      try {
        // ✅ FIX (Nov 9): Get user's subscription tier before incrementing counter
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('subscription_tier')
          .eq('user_id', userId)
          .single();

        const subscriptionTier = profile?.subscription_tier || 'Trial';

        const { incrementAnalysisCount } = require('../../lib/services/usage-tracking-service.js');
        await incrementAnalysisCount(userId, subscriptionTier);
        console.log(`[WORKFLOW-SESSION] ✅ Usage counter incremented for user ${userId} (${subscriptionTier}) after workflow completion`);
      } catch (counterError) {
        // Log but don't block - tracking failure shouldn't prevent workflow completion
        console.error('[WORKFLOW-SESSION] ⚠️ Failed to increment usage counter:', counterError);
        logError('Failed to increment usage counter', { error: counterError.message, userId, sessionId });
      }
    } else {
      console.log('⚠️ [WORKFLOW-SESSION-DEBUG] Saving to workflow_sessions with state="in_progress" (NOT incrementing counter)');
      // Save in-progress workflow to workflow_sessions
      // Extract company data from workflow for dedicated columns
      const companyData = workflowData.company || {};

      // ✅ Normalize components for in-progress workflow too (false = don't warn about missing fields)
      const normalizedComponents = normalizeComponents(workflowData.component_origins || workflowData.components || [], false);

      const sessionRecord = {
        user_id: userId,
        session_id: sessionId,
        state: 'in_progress',
        data: workflowData,

        // ✅ FIXED (Oct 24): Extract company/product fields to dedicated columns
        // ✅ FIXED (Nov 1): Support both nested (workflowData.company) and flat (workflowData) structures
        // ✅ FIXED (Nov 8): Extract company_country from top-level (workflow hook puts it there)
        // ✅ FIXED (Nov 9): Extract ALL company fields including contact info, tax_id, address, etc.
        // Dashboard validation requires these fields to be populated in DB columns, not just JSONB
        company_name:
          companyData.company_name ||           // Nested: workflowData.company.company_name
          companyData.name ||                   // Nested: workflowData.company.name
          workflowData.company_name ||          // Flat: workflowData.company_name (from useWorkflowState hook)
          null,
        company_country:
          workflowData.company_country ||       // ✅ FIX (Nov 8): Top-level from workflow hook (line 609 in useWorkflowState.js)
          companyData.company_country ||        // Nested fallback
          companyData.country ||                // Alternative nested
          null,
        company_address:
          companyData.company_address ||
          companyData.address ||
          workflowData.company_address ||
          null,
        tax_id:
          companyData.tax_id ||
          workflowData.tax_id ||
          null,
        contact_person:
          companyData.contact_person ||
          workflowData.contact_person ||
          null,
        contact_phone:
          companyData.contact_phone ||
          workflowData.contact_phone ||
          null,
        contact_email:
          companyData.contact_email ||
          workflowData.contact_email ||
          null,
        business_type:
          companyData.business_type ||          // Nested
          workflowData.business_type ||         // Flat
          null,
        industry_sector:
          companyData.industry_sector ||
          workflowData.industry_sector ||
          null,
        trade_volume:
          companyData.trade_volume ||
          workflowData.trade_volume ||
          null,
        supplier_country:
          companyData.supplier_country ||
          workflowData.supplier_country ||
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
        destination_country:
          workflowData.destination_country ||
          companyData.destination_country ||
          (() => {
            throw new Error('destination_country is required but missing. UI validation should prevent this. Available keys: ' + Object.keys(workflowData).join(', '));
          })(),
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
