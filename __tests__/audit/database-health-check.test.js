/**
 * DATABASE HEALTH CHECK - Quick validation of core data integrity
 * Phase 1 Critical Validation Tests
 */

const { createClient } = require('@supabase/supabase-js');

describe('Database Health Check', () => {
  let supabase;
  
  beforeAll(() => {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  });

  test('Database connection is working', async () => {
    const { data, error } = await supabase
      .from('hs_master_rebuild')
      .select('hs_code')
      .limit(1);

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(Array.isArray(data)).toBe(true);
  });

  test('hs_master_rebuild table has required columns', async () => {
    const { data, error } = await supabase
      .from('hs_master_rebuild')
      .select('hs_code, description, chapter, mfn_rate, usmca_rate, country_source')
      .limit(1);

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data.length).toBeGreaterThan(0);
    
    const record = data[0];
    expect(record).toHaveProperty('hs_code');
    expect(record).toHaveProperty('description');
    expect(record).toHaveProperty('chapter');
    expect(record).toHaveProperty('mfn_rate');
    expect(record).toHaveProperty('usmca_rate');
    expect(record).toHaveProperty('country_source');
  });

  test('Database has substantial record count', async () => {
    const { count, error } = await supabase
      .from('hs_master_rebuild')
      .select('*', { count: 'exact', head: true });

    expect(error).toBeNull();
    expect(count).toBeGreaterThan(30000);
    console.log(`Database contains ${count} records`);
  });

  test('Sample HS codes have valid tariff data', async () => {
    const sampleCodes = ['8544429000', '6204620090', '8708299050'];
    
    for (const hsCode of sampleCodes) {
      const { data, error } = await supabase
        .from('hs_master_rebuild')
        .select('hs_code, mfn_rate, usmca_rate, description')
        .eq('hs_code', hsCode)
        .limit(1);

      if (!error && data && data.length > 0) {
        const record = data[0];
        expect(record.mfn_rate).toBeGreaterThanOrEqual(0);
        expect(record.usmca_rate).toBeGreaterThanOrEqual(0);
        expect(record.description).toBeTruthy();
        
        console.log(`✓ ${hsCode}: MFN=${record.mfn_rate}%, USMCA=${record.usmca_rate}%`);
      }
    }
  });

  test('No obvious hardcoded fallback data exists', async () => {
    const { data, error } = await supabase
      .from('hs_master_rebuild')
      .select('hs_code, mfn_rate, description')
      .or('description.ilike.%fallback%,description.ilike.%placeholder%,description.ilike.%test%')
      .limit(10);

    expect(error).toBeNull();
    expect(data.length).toBe(0);
  });

  test('Database query performance is acceptable', async () => {
    const startTime = Date.now();
    
    const { data, error } = await supabase
      .from('hs_master_rebuild')
      .select('hs_code, mfn_rate, usmca_rate')
      .eq('hs_code', '8544429000')
      .single();
      
    const queryTime = Date.now() - startTime;
    
    expect(error).toBeNull();
    expect(queryTime).toBeLessThan(500);
    console.log(`Query completed in ${queryTime}ms`);
  });
});