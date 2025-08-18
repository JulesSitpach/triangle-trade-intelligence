/**
 * Database Explorer API
 * Examines actual Supabase database structure for documentation
 */

import { getSupabaseClient } from '../../lib/supabase-client'

const supabase = getSupabaseClient()

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('📊 Exploring Supabase Database Structure...')
    
    // Get all tables
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_table_list')
      .select('*')
    
    // If RPC doesn't exist, use direct queries
    const databaseStructure = await exploreDatabaseStructure()
    
    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      database: databaseStructure
    })
    
  } catch (error) {
    console.error('❌ Database exploration error:', error)
    return res.status(500).json({ error: error.message })
  }
}

async function exploreDatabaseStructure() {
  const structure = {
    tables: [],
    totalTables: 0,
    totalRows: 0,
    documentation: {}
  }
  
  // Known tables in the system
  const knownTables = [
    'usmca_business_intelligence',
    'triangle_routing_opportunities',
    'trade_flows',
    'comtrade_reference',
    'us_ports',
    'countries',
    'usmca_tariff_rates',
    'trade_routes',
    'workflow_sessions',
    'hindsight_pattern_library',
    'marcus_consultations',
    'current_market_alerts',
    'api_cache',
    'country_risk_scores',
    'network_intelligence_events',
    'business_profiles',
    'specialist_leads'
  ]
  
  for (const tableName of knownTables) {
    try {
      // Get row count and sample data
      const { data, error, count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: false })
        .limit(1)
      
      if (!error) {
        // Get column information from first row
        const columns = data && data.length > 0 
          ? Object.keys(data[0]).map(col => ({
              name: col,
              type: typeof data[0][col],
              sampleValue: data[0][col]
            }))
          : []
        
        const tableInfo = {
          name: tableName,
          rowCount: count || 0,
          columns: columns,
          category: categorizeTable(tableName),
          status: count > 0 ? 'populated' : 'empty'
        }
        
        structure.tables.push(tableInfo)
        structure.totalRows += count || 0
      }
    } catch (err) {
      console.log(`⚠️ Could not query table ${tableName}:`, err.message)
    }
  }
  
  structure.totalTables = structure.tables.length
  
  // Add documentation
  structure.documentation = {
    stable: structure.tables.filter(t => t.category === 'stable'),
    volatile: structure.tables.filter(t => t.category === 'volatile'),
    intelligence: structure.tables.filter(t => t.category === 'intelligence')
  }
  
  return structure
}

function categorizeTable(tableName) {
  const stableTables = [
    'usmca_business_intelligence',
    'usmca_tariff_rates',
    'us_ports',
    'countries',
    'trade_routes',
    'comtrade_reference',
    'triangle_routing_opportunities'
  ]
  
  const volatileTables = [
    'current_market_alerts',
    'api_cache',
    'country_risk_scores',
    'network_intelligence_events'
  ]
  
  const intelligenceTables = [
    'trade_flows',
    'workflow_sessions',
    'hindsight_pattern_library',
    'marcus_consultations',
    'business_profiles',
    'specialist_leads'
  ]
  
  if (stableTables.includes(tableName)) return 'stable'
  if (volatileTables.includes(tableName)) return 'volatile'
  if (intelligenceTables.includes(tableName)) return 'intelligence'
  return 'unknown'
}