/**
 * Database Setup Script for USMCA Postal Intelligence
 * Creates postal_intelligence table and seeds with comprehensive data
 */

const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

/**
 * Create postal_intelligence table
 */
async function createPostalIntelligenceTable() {
  console.log('🏗️  Creating postal_intelligence table...')
  
  try {
    // Note: This would typically be done via Supabase SQL editor or migration
    // For now, we'll document the required SQL
    console.log(`
📋 Execute this SQL in your Supabase SQL editor:

-- Create postal_intelligence table for USMCA countries
CREATE TABLE IF NOT EXISTS postal_intelligence (
  id SERIAL PRIMARY KEY,
  postal_code VARCHAR(10) NOT NULL,
  country VARCHAR(2) NOT NULL,
  state_province VARCHAR(50),
  city VARCHAR(100),
  region VARCHAR(50),
  metro VARCHAR(100),
  nearest_ports TEXT[], -- Array of nearby ports
  shipping_zone VARCHAR(20),
  tax_jurisdiction VARCHAR(100),
  economic_zone VARCHAR(100),
  usmca_gateway BOOLEAN DEFAULT false,
  us_border BOOLEAN DEFAULT false,
  mexico_border BOOLEAN DEFAULT false,
  canada_border BOOLEAN DEFAULT false,
  trade_advantages TEXT[],
  confidence_score INTEGER DEFAULT 70,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_postal_code ON postal_intelligence(postal_code);
CREATE INDEX IF NOT EXISTS idx_country ON postal_intelligence(country);
CREATE INDEX IF NOT EXISTS idx_country_region ON postal_intelligence(country, region);
CREATE INDEX IF NOT EXISTS idx_usmca_gateway ON postal_intelligence(usmca_gateway);

-- Create update trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_postal_intelligence_updated_at 
BEFORE UPDATE ON postal_intelligence 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`)

    return true
  } catch (error) {
    console.error('❌ Error creating table:', error)
    return false
  }
}

/**
 * Seed postal intelligence data for major USMCA locations
 */
async function seedPostalIntelligenceData() {
  console.log('🌱 Seeding USMCA postal intelligence data...')
  
  const postalData = [
    // US Major Markets
    { 
      postal_code: '90210', country: 'US', state_province: 'CA', city: 'Beverly Hills', 
      region: 'West Coast', metro: 'Los Angeles',
      nearest_ports: ['Los Angeles', 'Long Beach'], shipping_zone: 'West Coast',
      usmca_gateway: true, confidence_score: 95,
      trade_advantages: ['USMCA 0% tariff eligibility', 'Major port access', 'Mexico border proximity']
    },
    {
      postal_code: '10001', country: 'US', state_province: 'NY', city: 'New York',
      region: 'Northeast', metro: 'New York',
      nearest_ports: ['New York', 'Newark'], shipping_zone: 'East Coast',
      usmca_gateway: true, confidence_score: 95,
      trade_advantages: ['USMCA 0% tariff eligibility', 'Major port access', 'Financial hub']
    },
    {
      postal_code: '77001', country: 'US', state_province: 'TX', city: 'Houston',
      region: 'Gulf Coast', metro: 'Houston',
      nearest_ports: ['Houston'], shipping_zone: 'Gulf Coast',
      usmca_gateway: true, mexico_border: true, confidence_score: 95,
      trade_advantages: ['USMCA 0% tariff eligibility', 'Major port access', 'Mexico border hub', 'Energy center']
    },
    {
      postal_code: '60601', country: 'US', state_province: 'IL', city: 'Chicago',
      region: 'Midwest', metro: 'Chicago',
      nearest_ports: ['Chicago'], shipping_zone: 'Great Lakes',
      usmca_gateway: true, canada_border: true, confidence_score: 90,
      trade_advantages: ['USMCA 0% tariff eligibility', 'Great Lakes shipping', 'Canada border proximity']
    },

    // Canadian Major Markets
    {
      postal_code: 'M5V3A8', country: 'CA', state_province: 'ON', city: 'Toronto',
      region: 'Central Ontario', metro: 'Toronto',
      nearest_ports: ['Toronto'], shipping_zone: 'Great Lakes',
      usmca_gateway: true, us_border: true, confidence_score: 95,
      trade_advantages: ['USMCA 0% tariff eligibility', 'US border hub', 'Financial center']
    },
    {
      postal_code: 'V6B1A1', country: 'CA', state_province: 'BC', city: 'Vancouver',
      region: 'British Columbia', metro: 'Vancouver',
      nearest_ports: ['Vancouver'], shipping_zone: 'Pacific Gateway',
      usmca_gateway: true, us_border: true, confidence_score: 95,
      trade_advantages: ['USMCA 0% tariff eligibility', 'Pacific Gateway', 'Asia-Pacific hub']
    },
    {
      postal_code: 'H3B2Y5', country: 'CA', state_province: 'QC', city: 'Montreal',
      region: 'Montreal Area', metro: 'Montreal',
      nearest_ports: ['Montreal'], shipping_zone: 'St. Lawrence Seaway',
      usmca_gateway: true, us_border: true, confidence_score: 90,
      trade_advantages: ['USMCA 0% tariff eligibility', 'St. Lawrence Seaway', 'US border proximity']
    },

    // Mexican Major Markets
    {
      postal_code: '01000', country: 'MX', state_province: 'CDMX', city: 'Mexico City',
      region: 'Mexico City', metro: 'Mexico City',
      nearest_ports: ['Veracruz', 'Manzanillo'], shipping_zone: 'Central Mexico',
      usmca_gateway: true, confidence_score: 95,
      trade_advantages: ['USMCA 0% tariff eligibility', 'Capital city', 'Major manufacturing hub']
    },
    {
      postal_code: '22000', country: 'MX', state_province: 'BCN', city: 'Tijuana',
      region: 'Baja California Norte', metro: 'Tijuana',
      nearest_ports: ['Ensenada'], shipping_zone: 'Pacific Coast',
      usmca_gateway: true, us_border: true, confidence_score: 95,
      trade_advantages: ['USMCA 0% tariff eligibility', 'US border hub', 'Maquiladora center']
    },
    {
      postal_code: '64000', country: 'MX', state_province: 'NLE', city: 'Monterrey',
      region: 'Nuevo León', metro: 'Monterrey',
      nearest_ports: ['Altamira'], shipping_zone: 'Northeast Mexico',
      usmca_gateway: true, confidence_score: 95,
      trade_advantages: ['USMCA 0% tariff eligibility', 'Manufacturing hub', 'US proximity']
    },
    {
      postal_code: '44100', country: 'MX', state_province: 'JAL', city: 'Guadalajara',
      region: 'Jalisco', metro: 'Guadalajara',
      nearest_ports: ['Manzanillo'], shipping_zone: 'Pacific Coast',
      usmca_gateway: true, confidence_score: 90,
      trade_advantages: ['USMCA 0% tariff eligibility', 'Tech hub', 'Pacific port access']
    }
  ]

  let successCount = 0
  let errorCount = 0

  for (const postal of postalData) {
    try {
      const { data, error } = await supabase
        .from('postal_intelligence')
        .upsert(postal, { onConflict: 'postal_code' })

      if (error) {
        console.error(`❌ Error seeding ${postal.postal_code}:`, error.message)
        errorCount++
      } else {
        console.log(`✅ Seeded: ${postal.postal_code} (${postal.city}, ${postal.country})`)
        successCount++
      }
    } catch (err) {
      console.error(`💥 Exception seeding ${postal.postal_code}:`, err.message)
      errorCount++
    }
  }

  console.log(`\n📊 SEEDING SUMMARY:`)
  console.log(`✅ Successfully seeded: ${successCount} postal codes`)
  console.log(`❌ Errors: ${errorCount} postal codes`)

  return { successCount, errorCount }
}

/**
 * Test postal intelligence system
 */
async function testPostalIntelligence() {
  console.log('\n🧪 Testing USMCA Postal Intelligence...')
  
  const testCodes = [
    '90210', // US - Beverly Hills
    'M5V3A8', // CA - Toronto
    '01000', // MX - Mexico City
    '12345', // US - Unknown
    'K1A0A6', // CA - Ottawa (not in seed data)
    '64000' // MX - Monterrey
  ]

  for (const code of testCodes) {
    try {
      const { data, error } = await supabase
        .from('postal_intelligence')
        .select('*')
        .eq('postal_code', code)
        .limit(1)

      if (error) {
        console.log(`❌ ${code}: Database error - ${error.message}`)
      } else if (data && data.length > 0) {
        const postal = data[0]
        console.log(`✅ ${code}: ${postal.city}, ${postal.country} (${postal.confidence_score}% confidence)`)
      } else {
        console.log(`⚪ ${code}: Not found in database (will use algorithmic fallback)`)
      }
    } catch (err) {
      console.log(`💥 ${code}: Test error - ${err.message}`)
    }
  }
}

/**
 * Main setup function
 */
async function main() {
  console.log('🚀 Setting up USMCA Postal Intelligence System...\n')

  // Step 1: Create table structure (SQL to be executed manually)
  await createPostalIntelligenceTable()

  // Step 2: Check if we can connect to database
  try {
    const { data, error } = await supabase
      .from('postal_intelligence')
      .select('id')
      .limit(1)

    if (error) {
      console.log('\n⚠️  Table not yet created. Please run the SQL above in Supabase SQL editor first.')
      console.log('After creating the table, run this script again to seed data.')
      return
    }

    // Step 3: Seed data
    await seedPostalIntelligenceData()

    // Step 4: Test system
    await testPostalIntelligence()

    console.log('\n🎉 USMCA Postal Intelligence system setup complete!')
    console.log('✅ Ready for enterprise-grade postal code validation')

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message)
    console.log('\nPlease ensure:')
    console.log('1. NEXT_PUBLIC_SUPABASE_URL is set')
    console.log('2. SUPABASE_SERVICE_ROLE_KEY is set')
    console.log('3. The postal_intelligence table exists (run SQL above)')
  }
}

// Run setup
if (require.main === module) {
  main().catch(console.error)
}

module.exports = {
  createPostalIntelligenceTable,
  seedPostalIntelligenceData,
  testPostalIntelligence
}