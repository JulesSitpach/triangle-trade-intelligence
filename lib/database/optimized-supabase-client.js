/**
 * OPTIMIZED SUPABASE CLIENT
 * Enterprise connection pooling and performance optimization
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

// ENTERPRISE CONNECTION POOLING CONFIG
const supabaseConfig = {
  db: {
    schema: 'public',
  },
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  },
  global: {
    headers: {
      'x-my-custom-header': 'triangle-intelligence-platform',
    },
  },
  realtime: {
    disabled: true // Disable realtime for API performance
  }
};

// CREATE SINGLETON CLIENT WITH OPTIMIZED CONFIG
const optimizedSupabase = createClient(supabaseUrl, supabaseKey, supabaseConfig);

// CONNECTION MONITORING
let connectionCount = 0;
let queryCount = 0;
let totalQueryTime = 0;

// PERFORMANCE MONITORING WRAPPER
export const performQuery = async (queryFn, queryName = 'unknown') => {
  connectionCount++;
  const startTime = Date.now();
  
  try {
    const result = await queryFn(optimizedSupabase);
    const duration = Date.now() - startTime;
    
    queryCount++;
    totalQueryTime += duration;
    
    // Log slow queries (>500ms)
    if (duration > 500) {
      console.warn(`Slow query detected: ${queryName} took ${duration}ms`);
    }
    
    return result;
  } catch (error) {
    console.error(`Query failed: ${queryName}`, error);
    throw error;
  }
};

// BATCH QUERY OPTIMIZATION
export const batchQuery = async (queries) => {
  // Execute queries in parallel for better performance
  const results = await Promise.allSettled(queries.map(q => performQuery(q.fn, q.name)));
  
  return results.map((result, index) => ({
    name: queries[index].name,
    success: result.status === 'fulfilled',
    data: result.status === 'fulfilled' ? result.value : null,
    error: result.status === 'rejected' ? result.reason : null
  }));
};

// CONNECTION STATISTICS
export const getConnectionStats = () => ({
  connectionCount,
  queryCount,
  averageQueryTime: queryCount > 0 ? totalQueryTime / queryCount : 0,
  totalQueryTime
});

// RESET STATS (for testing)
export const resetStats = () => {
  connectionCount = 0;
  queryCount = 0;
  totalQueryTime = 0;
};

export default optimizedSupabase;