
/**
 * Database Access Validator
 * Ensures all database operations work correctly
 */
export async function validateDatabaseAccess() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const validations = [];

  try {
    // Test 1: Primary table access
    const { data: masterData, error: masterError } = await supabase
      .from('hs_master_rebuild')
      .select('count(*)', { count: 'exact', head: true });
    
    validations.push({
      test: 'Primary table access',
      success: !masterError,
      error: masterError?.message,
      result: masterData?.length || 0
    });

    // Test 2: Required fields present
    const { data: schemaTest, error: schemaError } = await supabase
      .from('hs_master_rebuild')
      .select('hs_code, description, mfn_rate, usmca_rate, country_source')
      .limit(1);

    validations.push({
      test: 'Required fields access',
      success: !schemaError && schemaTest?.[0]?.usmca_rate !== undefined,
      error: schemaError?.message,
      hasUsmcaRate: schemaTest?.[0]?.usmca_rate !== undefined
    });

    return {
      success: validations.every(v => v.success),
      validations,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    return {
      success: false,
      error: error.message,
      validations
    };
  }
}
