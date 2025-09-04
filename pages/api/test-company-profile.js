/**
 * TEST COMPANY PROFILE ACCESS
 */

import optimizedSupabase from '../../lib/database/optimized-supabase-client.js';

export default async function handler(req, res) {
  try {
    // Test 1: Get all company profiles
    const { data: allProfiles, error: allError } = await optimizedSupabase
      .from('company_profiles')
      .select('company_id, company_name, primary_hs_chapters')
      .limit(10);
    
    // Test 1b: Try with RPC function
    const { data: rpcData, error: rpcError } = await optimizedSupabase
      .rpc('get_company_context', { p_company_id: 'autoparts_mexico_sa' });
    
    // Test 2: Get specific company
    const { data: specific, error: specificError } = await optimizedSupabase
      .from('company_profiles')
      .select('*')
      .eq('company_id', 'autoparts_mexico_sa')
      .single();
    
    return res.status(200).json({
      success: true,
      all_profiles: allProfiles,
      all_error: allError,
      specific_profile: specific,
      specific_error: specificError,
      rpc_result: rpcData,
      rpc_error: rpcError,
      total_found: allProfiles?.length || 0
    });
  } catch (error) {
    return res.status(500).json({ 
      error: error.message,
      stack: error.stack 
    });
  }
}