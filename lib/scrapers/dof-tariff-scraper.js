/**
 * DOF Tariff Scraper - Mexican Tariff Change Detection
 * Polls Diario Oficial de la Federación (DOF) for tariff announcements
 *
 * Sources:
 * - DOF RSS: https://www.dof.gob.mx/rss/dof.xml
 * - SAT LIGIE: https://www.sat.gob.mx/consulta/07736/tarifa-de-la-ligie
 */

const Parser = require('rss-parser');
const { createClient } = require('@supabase/supabase-js');

const DOF_RSS_URL = 'https://www.dof.gob.mx/rss/dof.xml';
const DOF_SEARCH_TERMS = [
  'arancel',  // tariff
  'fracción arancelaria',  // tariff line
  'LIGIE',  // Mexican tariff law
  'T-MEC',  // USMCA in Spanish
  'TLCAN 2.0',  // USMCA alternative name
  'impuestos de importación',  // import duties
  'Servicio de Administración Tributaria',  // SAT
];

class DOFTariffScraper {
  constructor() {
    this.parser = new Parser({
      customFields: {
        item: ['pubDate', 'link', 'description', 'category']
      }
    });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials for DOF scraper');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Main polling function - checks DOF RSS for tariff announcements
   */
  async poll() {
    console.log('🇲🇽 Polling DOF for tariff announcements...');

    try {
      // Step 1: Fetch DOF RSS feed
      const feed = await this.fetchDOFRSS();
      console.log(`   Found ${feed.items.length} recent DOF publications`);

      // Step 2: Filter for tariff-related items
      const tariffAnnouncements = this.filterTariffAnnouncements(feed.items);
      console.log(`   ${tariffAnnouncements.length} tariff-related announcements`);

      // Step 3: Process each announcement
      const changes = [];
      for (const announcement of tariffAnnouncements) {
        const extractedChanges = await this.processAnnouncement(announcement);
        changes.push(...extractedChanges);
      }

      console.log(`   Detected ${changes.length} tariff changes`);

      // Step 4: Log changes to database
      if (changes.length > 0) {
        await this.logChanges(changes);
      }

      return {
        success: true,
        announcements: tariffAnnouncements.length,
        changes: changes.length
      };

    } catch (error) {
      console.error('❌ DOF polling failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Fetch DOF RSS feed
   */
  async fetchDOFRSS() {
    try {
      const response = await fetch(DOF_RSS_URL, {
        headers: {
          'User-Agent': 'TriangleIntelligence/1.0 (+https://triangle-trade-intelligence.vercel.app)'
        }
      });

      if (!response.ok) {
        throw new Error(`DOF RSS fetch failed: ${response.status}`);
      }

      const xmlText = await response.text();
      const feed = await this.parser.parseString(xmlText);

      return feed;

    } catch (error) {
      console.error('DOF RSS fetch error:', error.message);
      throw error;
    }
  }

  /**
   * Filter RSS items for tariff-related announcements
   */
  filterTariffAnnouncements(items) {
    return items.filter(item => {
      const text = `${item.title} ${item.description}`.toLowerCase();

      // Check if any search term is present
      return DOF_SEARCH_TERMS.some(term =>
        text.includes(term.toLowerCase())
      );
    });
  }

  /**
   * Process a single DOF announcement to extract tariff changes
   */
  async processAnnouncement(announcement) {
    console.log(`   Processing: ${announcement.title}`);

    const changes = [];

    try {
      // Step 1: Download announcement HTML/PDF
      const content = await this.fetchAnnouncementContent(announcement.link);

      // Step 2: Extract HS codes using regex
      const hsCodes = this.extractHSCodes(content);
      console.log(`      Found ${hsCodes.length} HS codes`);

      // Step 3: Extract rate changes
      for (const hsCode of hsCodes) {
        const rateChange = this.extractRateChange(content, hsCode);

        if (rateChange) {
          changes.push({
            hs_code: hsCode,
            ...rateChange,
            source_url: announcement.link,
            announcement_title: announcement.title,
            announcement_date: new Date(announcement.pubDate)
          });
        }
      }

      // Step 4: Check for policy-level changes (affects multiple HS codes)
      const policyChange = this.extractPolicyChange(content);
      if (policyChange) {
        changes.push({
          ...policyChange,
          source_url: announcement.link,
          announcement_title: announcement.title,
          announcement_date: new Date(announcement.pubDate)
        });
      }

    } catch (error) {
      console.error(`      Error processing announcement: ${error.message}`);
    }

    return changes;
  }

  /**
   * Fetch announcement content (HTML or PDF text)
   */
  async fetchAnnouncementContent(url) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'TriangleIntelligence/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`Announcement fetch failed: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');

      if (contentType.includes('application/pdf')) {
        // TODO: Implement PDF text extraction (pdf-parse library)
        console.log('      PDF detected - text extraction not yet implemented');
        return '';
      } else {
        // HTML
        return await response.text();
      }

    } catch (error) {
      console.error('Announcement content fetch error:', error.message);
      return '';
    }
  }

  /**
   * Extract HS codes from announcement text
   * Mexican HS codes are 8 digits (sometimes with periods: 8542.31.00)
   */
  extractHSCodes(text) {
    const codes = new Set();

    // Pattern 1: 8542.31.00 (with periods)
    const pattern1 = /\b(\d{4}\.\d{2}\.\d{2})\b/g;
    const matches1 = text.matchAll(pattern1);
    for (const match of matches1) {
      const normalized = match[1].replace(/\./g, '');  // Remove periods
      codes.add(normalized);
    }

    // Pattern 2: 85423100 (no periods)
    const pattern2 = /\b(\d{8})\b/g;
    const matches2 = text.matchAll(pattern2);
    for (const match of matches2) {
      codes.add(match[1]);
    }

    // Pattern 3: Chapter references (e.g., "Capítulo 85")
    const chapterPattern = /capítulo\s+(\d{2})/gi;
    const chapterMatches = text.matchAll(chapterPattern);
    for (const match of chapterMatches) {
      codes.add(match[1]);  // 2-digit chapter
    }

    return Array.from(codes);
  }

  /**
   * Extract rate change for a specific HS code
   */
  extractRateChange(text, hsCode) {
    // Look for patterns like:
    // "arancel del 3.9% al 5.7%"
    // "incremento de 2 puntos porcentuales"
    // "reducción del arancel"

    // Pattern: "X% al Y%"
    const changePattern = new RegExp(
      `${hsCode}.*?(\\d+\\.\\d+)%.*?al.*?(\\d+\\.\\d+)%`,
      'i'
    );
    const match = text.match(changePattern);

    if (match) {
      const oldRate = parseFloat(match[1]);
      const newRate = parseFloat(match[2]);

      return {
        change_type: newRate > oldRate ? 'rate_increase' : 'rate_decrease',
        old_rate: oldRate,
        new_rate: newRate,
        rate_change: newRate - oldRate
      };
    }

    // Pattern: "incremento de X puntos"
    const incrementPattern = new RegExp(
      `${hsCode}.*?incremento.*?(\\d+\\.?\\d*).*?punto`,
      'i'
    );
    const incrementMatch = text.match(incrementPattern);

    if (incrementMatch) {
      const increment = parseFloat(incrementMatch[1]);
      return {
        change_type: 'rate_increase',
        old_rate: null,  // Unknown
        new_rate: null,  // Unknown
        rate_change: increment
      };
    }

    return null;
  }

  /**
   * Extract policy-level changes (affects multiple HS codes)
   */
  extractPolicyChange(text) {
    // Look for keywords indicating policy changes
    const policyKeywords = [
      'arancel adicional',  // additional tariff
      'medida de salvaguarda',  // safeguard measure
      'cuota compensatoria',  // countervailing duty
      'antidumping',
      'PROSEC',
      'IMMEX',
      'maquiladora'
    ];

    for (const keyword of policyKeywords) {
      if (text.toLowerCase().includes(keyword.toLowerCase())) {
        // Extract affected HS codes/chapters
        const hsCodes = this.extractHSCodes(text);

        // Extract countries if mentioned
        const countries = this.extractCountries(text);

        return {
          policy_type: keyword,
          affected_hs_codes: hsCodes,
          affected_countries: countries,
          change_type: 'new_policy'
        };
      }
    }

    return null;
  }

  /**
   * Extract country mentions from text
   */
  extractCountries(text) {
    const countryMap = {
      'china': 'CN',
      'estados unidos': 'US',
      'canadá': 'CA',
      'vietnam': 'VN',
      'tailandia': 'TH',
      'india': 'IN',
      'alemania': 'DE',
      'corea': 'KR',
      'japón': 'JP'
    };

    const countries = [];
    const lowerText = text.toLowerCase();

    for (const [name, code] of Object.entries(countryMap)) {
      if (lowerText.includes(name)) {
        countries.push(code);
      }
    }

    return countries;
  }

  /**
   * Log detected changes to database
   */
  async logChanges(changes) {
    console.log(`   Logging ${changes.length} changes to database...`);

    const records = changes.map(change => ({
      destination_country: 'MX',
      hs_code: change.hs_code,
      origin_country: change.affected_countries?.[0] || null,
      change_type: change.change_type,
      old_rate: change.old_rate,
      new_rate: change.new_rate,
      rate_change: change.rate_change,
      policy_type: change.policy_type || null,
      source_url: change.source_url,
      detected_at: new Date(),
      is_processed: false  // For daily digest
    }));

    const { data, error } = await this.supabase
      .from('tariff_changes_log_international')
      .insert(records);

    if (error) {
      console.error('   Database insert error:', error.message);
      throw error;
    }

    console.log('   ✅ Changes logged successfully');
  }

  /**
   * Update tariff_rates_mexico table with detected changes
   */
  async applyChanges(changes) {
    for (const change of changes) {
      if (!change.hs_code || !change.new_rate) continue;

      const { error } = await this.supabase
        .from('tariff_rates_mexico')
        .upsert({
          hs_code: change.hs_code,
          mfn_rate: change.new_rate,
          effective_date: new Date().toISOString().split('T')[0],
          source: 'DOF',
          source_url: change.source_url,
          last_updated: new Date()
        }, {
          onConflict: 'hs_code,effective_date'
        });

      if (error) {
        console.error(`Error updating ${change.hs_code}:`, error.message);
      }
    }
  }
}

module.exports = { DOFTariffScraper };
