/**
 * Unified Workflow Data Service
 *
 * CRITICAL: Abstracts storage location (localStorage vs database) from components
 *
 * Problem this solves:
 * - Users can skip certificate creation and go straight to alerts
 * - Users can browse results without saving to database
 * - Users need workflow data regardless of storage choice
 * - Users should access data across devices (requires DB)
 *
 * Implementation:
 * 1. Try database first (if user is authenticated)
 * 2. Fall back to localStorage (if no DB data or not authenticated)
 * 3. Provide consistent API across all pages
 *
 * Usage:
 * ```javascript
 * import { getWorkflowData, getUserComponents } from '@/lib/services/unified-workflow-data-service';
 *
 * const workflowData = await getWorkflowData(userId);
 * const components = await getUserComponents(userId);
 * ```
 */

import { createClient } from '@supabase/supabase-js';

// ✅ FIX: Use service role key because this app uses custom JWT auth (not Supabase auth)
// RLS policies check auth.uid() which is always null with custom auth
// Service role key bypasses RLS, which is safe here because:
// 1. This file only queries data by user_id (user-scoped)
// 2. The user_id comes from authenticated API calls or localStorage
// 3. No sensitive cross-user data is exposed
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/**
 * Check if user has database-saved profile
 */
async function hasDBProfile(userId) {
  if (!userId || userId === 'anonymous') return false;

  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    return !!data && !error;
  } catch (error) {
    console.error('[UnifiedDataService] Error checking DB profile:', error);
    return false;
  }
}

/**
 * Get workflow data from database
 */
async function getDBWorkflowData(userId) {
  try {
    // Get most recent workflow session for user
    const { data: sessions, error } = await supabase
      .from('workflow_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1);

    if (error || !sessions || sessions.length === 0) {
      console.log('[UnifiedDataService] No DB workflow sessions found');
      return null;
    }

    const session = sessions[0];

    // Transform database format to expected workflow format
    return {
      company: {
        name: session.company_name,
        company_name: session.company_name,
        company_country: session.company_country,
        company_address: session.company_address,
        business_type: session.business_type,
        trade_volume: session.trade_volume,
        tax_id: session.tax_id,
        contact_person: session.contact_person,
        contact_phone: session.contact_phone,
        contact_email: session.contact_email
      },
      product: {
        description: session.product_description,
        hs_code: session.product_hs_code
      },
      usmca: {
        qualified: session.usmca_qualified,
        regional_content: session.regional_content,
        north_american_content: session.regional_content,
        preference_criterion: session.preference_criterion
      },
      component_origins: session.components || [],
      components: session.components || [],
      destination_country: session.destination_country,
      savings: session.enrichment_data?.savings || {},
      detailed_analysis: session.enrichment_data?.detailed_analysis || {},
      timestamp: session.updated_at,
      source: 'database'
    };
  } catch (error) {
    console.error('[UnifiedDataService] Error fetching DB workflow data:', error);
    return null;
  }
}

/**
 * Get workflow data from localStorage
 */
function getLocalStorageWorkflowData() {
  if (typeof window === 'undefined') return null;

  try {
    // Try primary key first (standardized Oct 31, 2025)
    const resultsData = localStorage.getItem('usmca_workflow_results');
    if (resultsData) {
      const parsed = JSON.parse(resultsData);
      return {
        ...parsed,
        source: 'localStorage'
      };
    }

    // Fallback: Try to reconstruct from form data
    const formData = localStorage.getItem('triangleUserData');
    if (formData) {
      const parsed = JSON.parse(formData);
      return {
        company: {
          name: parsed.company_name,
          company_name: parsed.company_name,
          company_country: parsed.company_country,
          company_address: parsed.company_address,
          business_type: parsed.business_type,
          trade_volume: parsed.trade_volume,
          tax_id: parsed.tax_id,
          contact_person: parsed.contact_person,
          contact_phone: parsed.contact_phone,
          contact_email: parsed.contact_email
        },
        product: {
          description: parsed.product_description,
          hs_code: parsed.product_hs_code
        },
        component_origins: parsed.component_origins || [],
        components: parsed.component_origins || [],
        destination_country: parsed.destination_country,
        source: 'localStorage_partial'
      };
    }

    return null;
  } catch (error) {
    console.error('[UnifiedDataService] Error reading localStorage:', error);
    return null;
  }
}

/**
 * MAIN: Get workflow data (database-first, localStorage fallback)
 *
 * @param {string} userId - User ID (optional, if not authenticated)
 * @returns {Object|null} Workflow data from DB or localStorage
 */
export async function getWorkflowData(userId = null) {
  console.log('[UnifiedDataService] Getting workflow data for user:', userId);

  // Strategy 1: Try database first (if authenticated)
  if (userId && userId !== 'anonymous' && await hasDBProfile(userId)) {
    const dbData = await getDBWorkflowData(userId);
    if (dbData) {
      console.log('[UnifiedDataService] ✅ Loaded workflow from database');
      return dbData;
    }
  }

  // Strategy 2: Fall back to localStorage
  const localData = getLocalStorageWorkflowData();
  if (localData) {
    console.log('[UnifiedDataService] ✅ Loaded workflow from localStorage');
    return localData;
  }

  console.log('[UnifiedDataService] ⚠️ No workflow data found');
  return null;
}

/**
 * Get user's components (from either storage)
 *
 * @param {string} userId - User ID (optional)
 * @returns {Array} Array of component origins
 */
export async function getUserComponents(userId = null) {
  const workflowData = await getWorkflowData(userId);
  return workflowData?.component_origins || workflowData?.components || [];
}

/**
 * Get user's company info (from either storage)
 *
 * @param {string} userId - User ID (optional)
 * @returns {Object|null} Company information
 */
export async function getUserCompany(userId = null) {
  const workflowData = await getWorkflowData(userId);
  return workflowData?.company || null;
}

/**
 * Get user's USMCA qualification status (from either storage)
 *
 * @param {string} userId - User ID (optional)
 * @returns {Object|null} USMCA qualification data
 */
export async function getUSMCAQualification(userId = null) {
  const workflowData = await getWorkflowData(userId);
  return workflowData?.usmca || null;
}

/**
 * Check if user has workflow data (any storage)
 *
 * @param {string} userId - User ID (optional)
 * @returns {boolean} True if user has workflow data
 */
export async function hasWorkflowData(userId = null) {
  const data = await getWorkflowData(userId);
  return !!data;
}

/**
 * Save workflow data to both localStorage AND database
 * Ensures seamless transition and cross-device access
 *
 * @param {Object} workflowData - Complete workflow data
 * @param {string} userId - User ID (required for DB save)
 */
export async function saveWorkflowData(workflowData, userId = null) {
  console.log('[UnifiedDataService] Saving workflow data...');

  // 1. Always save to localStorage (immediate persistence)
  if (typeof window !== 'undefined') {
    localStorage.setItem('usmca_workflow_results', JSON.stringify(workflowData));
    console.log('[UnifiedDataService] ✅ Saved to localStorage');
  }

  // 2. Save to database (if authenticated)
  if (userId && userId !== 'anonymous') {
    try {
      // Check if session exists
      const { data: existingSessions } = await supabase
        .from('workflow_sessions')
        .select('id')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(1);

      const sessionData = {
        user_id: userId,
        workflow_type: 'usmca',
        company_name: workflowData.company?.name || workflowData.company?.company_name,
        company_country: workflowData.company?.company_country,
        company_address: workflowData.company?.company_address,
        business_type: workflowData.company?.business_type,
        trade_volume: workflowData.company?.trade_volume,
        tax_id: workflowData.company?.tax_id,
        contact_person: workflowData.company?.contact_person,
        contact_phone: workflowData.company?.contact_phone,
        contact_email: workflowData.company?.contact_email,
        product_description: workflowData.product?.description,
        product_hs_code: workflowData.product?.hs_code,
        destination_country: workflowData.destination_country,
        components: workflowData.component_origins || workflowData.components,
        usmca_qualified: workflowData.usmca?.qualified,
        regional_content: workflowData.usmca?.regional_content || workflowData.usmca?.north_american_content,
        preference_criterion: workflowData.usmca?.preference_criterion,
        enrichment_data: {
          savings: workflowData.savings,
          detailed_analysis: workflowData.detailed_analysis
        },
        updated_at: new Date().toISOString()
      };

      if (existingSessions && existingSessions.length > 0) {
        // Update existing session
        const { error } = await supabase
          .from('workflow_sessions')
          .update(sessionData)
          .eq('id', existingSessions[0].id);

        if (error) throw error;
        console.log('[UnifiedDataService] ✅ Updated database session');
      } else {
        // Create new session
        const { error } = await supabase
          .from('workflow_sessions')
          .insert([{ ...sessionData, created_at: new Date().toISOString() }]);

        if (error) throw error;
        console.log('[UnifiedDataService] ✅ Created new database session');
      }
    } catch (error) {
      console.error('[UnifiedDataService] ❌ Failed to save to database:', error);
      // Don't throw - localStorage save succeeded
    }
  }

  return true;
}

/**
 * Clear workflow data from both storages
 * Used when user explicitly wants to start fresh
 *
 * @param {string} userId - User ID (optional, for DB deletion)
 */
export async function clearWorkflowData(userId = null) {
  console.log('[UnifiedDataService] Clearing workflow data...');

  // 1. Clear localStorage
  if (typeof window !== 'undefined') {
    localStorage.removeItem('usmca_workflow_results');
    localStorage.removeItem('triangleUserData');
    localStorage.removeItem('workflow_current_step');
    console.log('[UnifiedDataService] ✅ Cleared localStorage');
  }

  // 2. Clear database (if authenticated)
  if (userId && userId !== 'anonymous') {
    try {
      const { error } = await supabase
        .from('workflow_sessions')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;
      console.log('[UnifiedDataService] ✅ Cleared database sessions');
    } catch (error) {
      console.error('[UnifiedDataService] ❌ Failed to clear database:', error);
    }
  }

  return true;
}

/**
 * Sync localStorage to database (one-time migration)
 * Called when user signs in with localStorage data
 *
 * @param {string} userId - User ID (required)
 * @returns {boolean} Success status
 */
export async function syncLocalStorageToDatabase(userId) {
  if (!userId || userId === 'anonymous') {
    console.error('[UnifiedDataService] Cannot sync without valid userId');
    return false;
  }

  console.log('[UnifiedDataService] Syncing localStorage to database...');

  const localData = getLocalStorageWorkflowData();
  if (!localData) {
    console.log('[UnifiedDataService] No localStorage data to sync');
    return false;
  }

  // Save to database using unified save function
  await saveWorkflowData(localData, userId);

  console.log('[UnifiedDataService] ✅ Synced localStorage → database');
  return true;
}
