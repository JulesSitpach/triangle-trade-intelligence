/**
 * SHARED SUPABASE CLIENT
 * Single instance to avoid conflicts
 */

import { createClient } from '@supabase/supabase-js'

let supabaseInstance = null

export const getSupabaseClient = () => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
    console.log('✅ Created single Supabase client instance')
  }
  return supabaseInstance
}

// Test database connection
export const testSupabaseConnection = async () => {
  try {
    const client = getSupabaseClient()
    const { data, error } = await client.from('translations').select('*').limit(1)
    
    if (error) {
      console.error('Supabase connection test failed:', error.message)
      return false
    }
    
    console.log('✅ Supabase connection test successful')
    return true
  } catch (error) {
    console.error('Supabase connection test error:', error.message)
    return false
  }
}

export default getSupabaseClient