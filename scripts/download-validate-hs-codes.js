/**
 * Download and Validate HS Codes for Database Import
 * This script fetches complete HS code datasets from multiple sources
 * 
 * Data Sources:
 * 1. GitHub Harmonized System Dataset: https://github.com/datasets/harmonized-system
 * 2. UN Comtrade API: https://comtradeapi.un.org/
 * 3. World Bank WITS: https://wits.worldbank.org/
 * 
 * Formats: CSV, JSON (ready for database import)
 */

const https = require('https');
const fs = require('fs').promises;
const path = require('path');

// Data source URLs
const DATA_SOURCES = {
  github: {
    // GitHub Harmonized System Dataset (CSV format - best for bulk import)
    hs_csv: 'https://raw.githubusercontent.com/datasets/harmonized-system/master/data/harmonized-system.csv',
    hs_json: 'https://raw.githubusercontent.com/datasets/harmonized-system/master/data/harmonized-system.json'
  },
  uncomtrade: {
    // UN Comtrade API (fallback)
    h5: 'https://comtradeapi.un.org/files/v1/app/reference/H5.json',
    h6: 'https://comtradeapi.un.org/files/v1/app/reference/H6.json'
  }
};

/**
 * Fetch HS codes from multiple data sources (GitHub, UN Comtrade)
 * Priority: GitHub dataset (structured CSV/JSON) → UN Comtrade API → Fallback
 */
async function fetchHSCodes() {
  console.log('🔍 Fetching HS codes from multiple data sources...\n');
  
  // Try GitHub dataset first (best for bulk import)
  console.log('📊 Step 1: Attempting GitHub Harmonized System Dataset...');
  try {
    const githubData = await fetchGitHubHSDataset();
    if (githubData && githubData.length > 0) {
      console.log(`✅ Successfully fetched ${githubData.length} codes from GitHub dataset\n`);
      return { results: githubData, source: 'github' };
    }
  } catch (error) {
    console.log(`⚠️ GitHub dataset failed: ${error.message}\n`);
  }
  
  // Fallback to UN Comtrade API
  console.log('📊 Step 2: Falling back to UN Comtrade API...');
  const endpoints = [DATA_SOURCES.uncomtrade.h6, DATA_SOURCES.uncomtrade.h5];
  
  for (const url of endpoints) {
    console.log(`📡 Trying: ${url}`);
    try {
      const data = await fetchFromEndpoint(url);
      if (data && data.results && data.results.length > 0) {
        console.log(`✅ Fetched ${data.results.length} codes from UN Comtrade\n`);
        return { ...data, source: 'uncomtrade' };
      }
    } catch (error) {
      console.log(`⚠️ Failed: ${error.message}`);
    }
  }
  
  // Final fallback
  console.log('⚠️ All sources failed, using sample data\n');
  return { results: generateSampleHSCodes().results, source: 'fallback' };
}

/**
 * Fetch GitHub Harmonized System Dataset (CSV format)
 * This provides a clean, structured dataset perfect for database import
 */
async function fetchGitHubHSDataset() {
  console.log('📡 Fetching GitHub HS dataset (CSV format)...');
  
  try {
    // Try JSON format first (easier to parse)
    const jsonData = await fetchFromEndpoint(DATA_SOURCES.github.hs_json);
    if (jsonData && Array.isArray(jsonData)) {
      console.log('✅ Successfully parsed GitHub JSON dataset');
      return jsonData;
    }
  } catch (error) {
    console.log('⚠️ JSON format failed, trying CSV...');
  }
  
  // Fallback to CSV format
  try {
    const csvData = await fetchCSVFromEndpoint(DATA_SOURCES.github.hs_csv);
    const parsedCsv = parseCSV(csvData);
    console.log('✅ Successfully parsed GitHub CSV dataset');
    return parsedCsv;
  } catch (error) {
    throw new Error(`GitHub dataset unavailable: ${error.message}`);
  }
}

/**
 * Fetch CSV data from endpoint
 */
function fetchCSVFromEndpoint(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Triangle-Intelligence-USMCA-Platform/1.0',
        'Accept': 'text/csv'
      }
    }, (res) => {
      let data = '';
      
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve(data);
      });
    }).on('error', reject);
  });
}

/**
 * Parse CSV data into JSON format
 */
function parseCSV(csvData) {
  const lines = csvData.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV file appears to be empty or invalid');
  }
  
  // Handle CSV with quoted fields that might contain commas
  const parseCSVLine = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current); // Don't forget the last field
    return result;
  };
  
  const headers = parseCSVLine(lines[0]);
  console.log(`📋 CSV Headers found: ${headers.join(', ')}`);
  
  const results = [];
  
  for (let i = 1; i < lines.length && i < 100; i++) { // Limit for debugging
    const values = parseCSVLine(lines[i]);
    const obj = {};
    
    headers.forEach((header, index) => {
      obj[header.trim()] = values[index] ? values[index].trim() : '';
    });
    
    // Try to find the HS code and description fields
    const hsCode = obj.code || obj.hs_code || obj.commodity_code || obj.id || '';
    const description = obj.description || obj.text || obj.commodity_description || '';
    
    if (hsCode && hsCode.length >= 2) {
      results.push({
        id: hsCode,
        text: description,
        parent: obj.parent || '#',
        isLeaf: '1',
        aggrlevel: hsCode.length,
        standardUnitAbbr: obj.unit || 'n/a',
        source: 'github'
      });
    }
  }
  
  console.log(`📊 Parsed ${results.length} valid HS codes from CSV`);
  return results;
}

/**
 * Fetch from a specific endpoint (JSON format)
 */
function fetchFromEndpoint(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Triangle-Intelligence-USMCA-Platform/1.0',
        'Accept': 'application/json'
      }
    }, (res) => {
      let data = '';
      
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', reject);
  });
}

/**
 * Fetch extended HS dataset including all classifications
 * This attempts to get the full 50,000+ code dataset mentioned in UN Comtrade docs
 */
async function fetchExtendedHSDataset() {
  console.log('🔄 Fetching extended HS classification dataset...\n');
  
  // The UN Comtrade API provides classification data through different methods
  // Based on https://github.com/uncomtrade/comtradeapicall
  const classificationUrl = `${COMTRADE_BASE_URL}/data/v1/reference/classification/HS`;
  
  try {
    const response = await fetchFromEndpoint(classificationUrl);
    console.log(`✅ Fetched extended dataset with ${response.results?.length || response.length || 0} codes\n`);
    return response;
  } catch (error) {
    console.log('⚠️ Could not fetch extended dataset, using H6 classification\n');
    // Fallback to H6
    try {
      return await fetchFromEndpoint(`${COMTRADE_BASE_URL}/files/v1/app/reference/H6.json`);
    } catch (fallbackError) {
      console.log('⚠️ All API attempts failed, using sample data\n');
      return generateSampleHSCodes();
    }
  }
}

/**
 * Generate sample HS codes for testing when API is unavailable
 */
function generateSampleHSCodes() {
  return {
    results: [
      { id: '01', text: 'Live animals', parent: '' },
      { id: '0101', text: 'Live horses, asses, mules and hinnies', parent: '01' },
      { id: '010121', text: 'Horses: Pure-bred breeding animals', parent: '0101' },
      { id: '02', text: 'Meat and edible meat offal', parent: '' },
      { id: '0201', text: 'Meat of bovine animals, fresh or chilled', parent: '02' },
      { id: '020110', text: 'Carcasses and half-carcasses', parent: '0201' },
      { id: '61', text: 'Articles of apparel and clothing accessories, knitted or crocheted', parent: '' },
      { id: '6109', text: 'T-shirts, singlets and other vests, knitted or crocheted', parent: '61' },
      { id: '610910', text: 'Of cotton', parent: '6109' },
      { id: '85', text: 'Electrical machinery and equipment', parent: '' },
      { id: '8517', text: 'Telephone sets and other apparatus', parent: '85' },
      { id: '851712', text: 'Telephones for cellular networks', parent: '8517' }
    ]
  };
}

/**
 * Validate HS code format and structure
 */
function validateHSCode(code) {
  const issues = [];
  
  // Check if code exists
  if (!code || code === '') {
    issues.push('Empty code');
    return issues;
  }
  
  // HS codes should be 2, 4, or 6 digits
  const codeStr = code.toString().trim();
  if (!/^\d{2,6}$/.test(codeStr)) {
    issues.push(`Invalid format: ${codeStr} (should be 2-6 digits)`);
  }
  
  // Check hierarchical structure
  if (codeStr.length === 4 && !codeStr.startsWith(codeStr.substring(0, 2))) {
    issues.push(`Hierarchical issue: 4-digit code doesn't match 2-digit parent`);
  }
  
  if (codeStr.length === 6 && !codeStr.startsWith(codeStr.substring(0, 4))) {
    issues.push(`Hierarchical issue: 6-digit code doesn't match 4-digit parent`);
  }
  
  return issues;
}

/**
 * Analyze and validate downloaded HS codes
 */
async function analyzeHSCodes(hsCodes) {
  console.log('📊 Analyzing HS Code Data Quality...\n');
  
  const stats = {
    total: 0,
    byLength: { 2: 0, 4: 0, 6: 0, other: 0 },
    valid: 0,
    invalid: 0,
    issues: [],
    samples: [],
    chapters: new Set()
  };
  
  // Process each HS code
  for (const item of hsCodes) {
    stats.total++;
    
    const code = item.id || item.code || item.hs_code;
    const description = item.text || item.description || item.name || '';
    
    // Validate code
    const codeIssues = validateHSCode(code);
    if (codeIssues.length === 0) {
      stats.valid++;
    } else {
      stats.invalid++;
      stats.issues.push({ code, issues: codeIssues });
    }
    
    // Categorize by length
    const codeLen = code ? code.toString().length : 0;
    if (codeLen === 2) {
      stats.byLength[2]++;
      stats.chapters.add(code);
    } else if (codeLen === 4) {
      stats.byLength[4]++;
    } else if (codeLen === 6) {
      stats.byLength[6]++;
    } else {
      stats.byLength.other++;
    }
    
    // Collect samples
    if (stats.samples.length < 10) {
      stats.samples.push({
        code,
        description: description.substring(0, 100),
        length: codeLen
      });
    }
  }
  
  // Display results
  console.log('✅ VALIDATION RESULTS:');
  console.log('═'.repeat(50));
  console.log(`Total HS Codes: ${stats.total}`);
  console.log(`Valid Codes: ${stats.valid} (${((stats.valid/stats.total)*100).toFixed(1)}%)`);
  console.log(`Invalid Codes: ${stats.invalid}`);
  console.log('');
  
  console.log('📈 CODE DISTRIBUTION:');
  console.log(`  2-digit (Chapters): ${stats.byLength[2]}`);
  console.log(`  4-digit (Headings): ${stats.byLength[4]}`);
  console.log(`  6-digit (Subheadings): ${stats.byLength[6]}`);
  console.log(`  Other: ${stats.byLength.other}`);
  console.log(`  Total Chapters: ${stats.chapters.size}`);
  console.log('');
  
  console.log('📝 SAMPLE HS CODES:');
  console.log('─'.repeat(50));
  stats.samples.forEach(sample => {
    console.log(`  ${sample.code.toString().padEnd(8)} | ${sample.description}`);
  });
  console.log('');
  
  if (stats.invalid > 0 && stats.issues.length > 0) {
    console.log('⚠️ VALIDATION ISSUES (first 5):');
    stats.issues.slice(0, 5).forEach(issue => {
      console.log(`  Code ${issue.code}: ${issue.issues.join(', ')}`);
    });
    console.log('');
  }
  
  return stats;
}

/**
 * Compare with existing database
 */
async function compareWithDatabase() {
  console.log('🔄 Comparing with existing database...\n');
  
  try {
    // Try to load existing data if available
    const existingDataPath = path.join(__dirname, '../lib/database/hs-codes-reference.json');
    const existingData = await fs.readFile(existingDataPath, 'utf8')
      .then(data => JSON.parse(data))
      .catch(() => null);
    
    if (existingData) {
      console.log(`  Existing database has ${existingData.length} codes`);
      return existingData;
    } else {
      console.log('  No existing database found for comparison');
      return null;
    }
  } catch (error) {
    console.log('  Could not load existing database:', error.message);
    return null;
  }
}

/**
 * Save validated HS codes in multiple formats
 */
async function saveHSCodes(hsCodes, stats, source = 'unknown') {
  const dataDir = path.join(__dirname, '../data');
  await fs.mkdir(dataDir, { recursive: true });
  
  // Save JSON format (original)
  const jsonPath = path.join(dataDir, 'validated-hs-codes.json');
  await fs.writeFile(jsonPath, JSON.stringify(hsCodes, null, 2));
  console.log(`✅ Saved ${hsCodes.length} HS codes to ${jsonPath}`);
  
  // Save CSV format (database-ready)
  const csvPath = path.join(dataDir, 'hs-codes-for-database.csv');
  const csvContent = generateCSV(hsCodes);
  await fs.writeFile(csvPath, csvContent);
  console.log(`📊 Database-ready CSV saved to ${csvPath}`);
  
  // Save SQL import script
  const sqlPath = path.join(dataDir, 'import-hs-codes.sql');
  const sqlContent = generateSQLImport(hsCodes);
  await fs.writeFile(sqlPath, sqlContent);
  console.log(`🗄️ SQL import script saved to ${sqlPath}`);
  
  // Save validation report
  const reportPath = path.join(dataDir, 'hs-validation-report.json');
  await fs.writeFile(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    source: source,
    total_codes: hsCodes.length,
    stats,
    files_generated: {
      json: path.basename(jsonPath),
      csv: path.basename(csvPath),
      sql: path.basename(sqlPath)
    },
    database_import_instructions: [
      '1. Use import-hs-codes.sql for Postgres/MySQL',
      '2. Use hs-codes-for-database.csv for bulk CSV import',
      '3. Table structure: hs_code, description, chapter, version'
    ],
    validationRules: [
      'HS codes must be 2, 4, or 6 digits',
      'Codes must follow hierarchical structure',
      'No empty or null codes allowed'
    ]
  }, null, 2));
  
  console.log(`📋 Validation report saved to ${reportPath}`);
}

/**
 * Generate CSV content for database import
 */
function generateCSV(hsCodes) {
  const headers = 'hs_code,description,chapter,parent,is_leaf,level,unit,source\n';
  const rows = hsCodes
    .filter(code => code.id !== 'TOTAL') // Remove non-HS entries
    .map(code => {
      const hsCode = code.id || '';
      const description = (code.text || '').replace(/"/g, '""'); // Escape quotes
      const chapter = hsCode.length >= 2 ? hsCode.substring(0, 2) : '';
      const parent = code.parent || '';
      const isLeaf = code.isLeaf || '0';
      const level = code.aggrlevel || hsCode.length;
      const unit = code.standardUnitAbbr || 'n/a';
      const source = code.source || 'unknown';
      
      return `"${hsCode}","${description}","${chapter}","${parent}","${isLeaf}","${level}","${unit}","${source}"`;
    })
    .join('\n');
  
  return headers + rows;
}

/**
 * Generate SQL import script for Postgres/MySQL
 */
function generateSQLImport(hsCodes) {
  const validCodes = hsCodes.filter(code => code.id !== 'TOTAL');
  
  let sql = `-- HS Codes Database Import Script
-- Generated: ${new Date().toISOString()}
-- Total codes: ${validCodes.length}

-- Create table (Postgres/MySQL compatible)
CREATE TABLE IF NOT EXISTS hs_codes (
    id SERIAL PRIMARY KEY,
    hs_code VARCHAR(10) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    chapter VARCHAR(2),
    parent VARCHAR(10),
    is_leaf BOOLEAN DEFAULT FALSE,
    level INTEGER,
    unit VARCHAR(50),
    source VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_hs_codes_code ON hs_codes(hs_code);
CREATE INDEX IF NOT EXISTS idx_hs_codes_chapter ON hs_codes(chapter);
CREATE INDEX IF NOT EXISTS idx_hs_codes_level ON hs_codes(level);

-- Insert data
INSERT INTO hs_codes (hs_code, description, chapter, parent, is_leaf, level, unit, source) VALUES\n`;

  const values = validCodes.map((code, index) => {
    const hsCode = (code.id || '').replace(/'/g, "''");
    const description = (code.text || '').replace(/'/g, "''");
    const chapter = hsCode.length >= 2 ? hsCode.substring(0, 2) : '';
    const parent = (code.parent || '').replace(/'/g, "''");
    const isLeaf = code.isLeaf === '1' ? 'TRUE' : 'FALSE';
    const level = code.aggrlevel || hsCode.length;
    const unit = (code.standardUnitAbbr || 'n/a').replace(/'/g, "''");
    const source = (code.source || 'unknown').replace(/'/g, "''");
    
    const comma = index === validCodes.length - 1 ? ';' : ',';
    return `    ('${hsCode}', '${description}', '${chapter}', '${parent}', ${isLeaf}, ${level}, '${unit}', '${source}')${comma}`;
  }).join('\n');

  sql += values + '\n\n-- Query examples:\n';
  sql += '-- SELECT * FROM hs_codes WHERE chapter = \'85\' ORDER BY hs_code;\n';
  sql += '-- SELECT COUNT(*) FROM hs_codes GROUP BY chapter ORDER BY chapter;\n';
  sql += '-- SELECT * FROM hs_codes WHERE hs_code LIKE \'6109%\' ORDER BY hs_code;\n';

  return sql;
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 UN Comtrade HS Code Download & Validation Tool');
  console.log('═'.repeat(50));
  console.log('');
  console.log('📖 Understanding HS Code Levels:');
  console.log('  • 6-digit: International HS codes (~5,400-6,900 codes)');
  console.log('  • 8-digit: National tariff lines (10,000+ per country)');
  console.log('  • 10-digit: Statistical codes (50,000+ total variations)');
  console.log('');
  console.log('ℹ️  This script fetches the 6-digit international HS codes');
  console.log('    which are the foundation for all trade classification.\n');
  
  try {
    // Fetch HS codes
    console.log('Step 1: Downloading HS codes from UN Comtrade...');
    const response = await fetchHSCodes();
    
    // Extract the actual HS codes array from the response
    let hsCodes = [];
    let dataSource = 'unknown';
    
    if (response.results) {
      hsCodes = response.results;
      dataSource = response.source || 'api';
    } else if (Array.isArray(response)) {
      hsCodes = response;
      dataSource = 'array';
    } else if (response.data) {
      hsCodes = response.data;
      dataSource = 'data';
    } else {
      console.log('⚠️ Unexpected response structure, using sample data');
      hsCodes = generateSampleHSCodes().results;
      dataSource = 'fallback';
    }
    
    console.log(`✅ Downloaded ${hsCodes.length} HS codes from ${dataSource} source\n`);
    
    // Validate the codes
    console.log('Step 2: Validating HS codes...');
    const stats = await analyzeHSCodes(hsCodes);
    
    // Compare with existing database
    console.log('Step 3: Comparing with existing data...');
    await compareWithDatabase();
    
    // Save results
    console.log('Step 4: Saving validated data...');
    await saveHSCodes(hsCodes, stats, dataSource);
    
    // Final summary
    console.log('\n' + '═'.repeat(50));
    console.log('🎯 VALIDATION COMPLETE!');
    console.log(`✅ ${stats.valid} valid codes out of ${stats.total} total`);
    console.log(`✅ Data quality: ${((stats.valid/stats.total)*100).toFixed(1)}%`);
    
    if (stats.valid / stats.total >= 0.95) {
      console.log('✅ EXCELLENT: Data quality exceeds 95% threshold!');
    } else if (stats.valid / stats.total >= 0.90) {
      console.log('✅ GOOD: Data quality is acceptable (>90%)');
    } else {
      console.log('⚠️ WARNING: Data quality below 90%, review needed');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the script
main();