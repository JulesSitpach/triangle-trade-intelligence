#!/usr/bin/env node

/**
 * Puppeteer MCP Examples for Triangle Intelligence Platform
 * Demonstrates practical browser automation use cases for trade intelligence
 */

const examples = {
  
  // Example 1: Monitor UN Comtrade for specific HS codes
  comtradeMonitoring: {
    description: "Monitor UN Comtrade database for automotive parts trade data",
    steps: [
      {
        tool: "puppeteer_navigate",
        params: { url: "https://comtrade.un.org/data" },
        purpose: "Navigate to UN Comtrade data portal"
      },
      {
        tool: "puppeteer_fill",
        params: { 
          selector: "input[placeholder*='commodity']", 
          value: "8708" // Automotive parts HS code
        },
        purpose: "Search for automotive parts classification"
      },
      {
        tool: "puppeteer_click",
        params: { selector: "button[type='submit'], .search-btn" },
        purpose: "Execute search"
      },
      {
        tool: "puppeteer_screenshot",
        params: { 
          name: "comtrade-automotive-parts-data",
          width: 1200,
          height: 800 
        },
        purpose: "Capture trade data for analysis"
      },
      {
        tool: "puppeteer_evaluate",
        params: {
          script: `
            // Extract trade flow data
            const rows = document.querySelectorAll('table.data-table tbody tr');
            return Array.from(rows).slice(0, 10).map(row => {
              const cells = row.querySelectorAll('td');
              return {
                reporter: cells[0]?.textContent?.trim(),
                partner: cells[1]?.textContent?.trim(), 
                tradeValue: cells[2]?.textContent?.trim(),
                year: cells[3]?.textContent?.trim()
              };
            }).filter(row => row.reporter && row.partner);
          `
        },
        purpose: "Extract structured trade data"
      }
    ],
    businessValue: "Real-time verification of platform trade flow data against official UN sources"
  },

  // Example 2: Monitor shipping carrier rates
  shippingRateMonitoring: {
    description: "Track shipping rates from major carriers for cost analysis",
    steps: [
      {
        tool: "puppeteer_navigate", 
        params: { url: "https://www.maersk.com/shipping/rates" },
        purpose: "Access Maersk shipping calculator"
      },
      {
        tool: "puppeteer_fill",
        params: { selector: "input[name*='origin'], #origin", value: "Shanghai, China" },
        purpose: "Set origin port"
      },
      {
        tool: "puppeteer_fill",
        params: { selector: "input[name*='destination'], #destination", value: "Los Angeles, USA" },
        purpose: "Set destination port"
      },
      {
        tool: "puppeteer_select",
        params: { selector: "select[name*='container'], #container-type", value: "40ft" },
        purpose: "Select container size"
      },
      {
        tool: "puppeteer_click",
        params: { selector: "button[type='submit'], .get-quote, .calculate" },
        purpose: "Request rate quote"
      },
      {
        tool: "puppeteer_screenshot",
        params: { 
          name: "maersk-rates-cn-us",
          selector: ".quote-results, .rate-table"
        },
        purpose: "Document current shipping rates"
      }
    ],
    businessValue: "Track shipping cost volatility for accurate triangle routing calculations"
  },

  // Example 3: Government tariff monitoring
  tariffMonitoring: {
    description: "Monitor USTR website for tariff announcements and policy changes",
    steps: [
      {
        tool: "puppeteer_navigate",
        params: { url: "https://ustr.gov/trade-agreements/free-trade-agreements/united-states-mexico-canada-agreement" },
        purpose: "Check USMCA official updates"
      },
      {
        tool: "puppeteer_evaluate",
        params: {
          script: `
            // Extract recent announcements
            const announcements = document.querySelectorAll('.news-item, .announcement, .update');
            return Array.from(announcements).slice(0, 5).map(item => {
              const titleEl = item.querySelector('h2, h3, .title, .headline');
              const dateEl = item.querySelector('.date, .published, time');
              const linkEl = item.querySelector('a');
              
              return {
                title: titleEl?.textContent?.trim() || 'No title',
                date: dateEl?.textContent?.trim() || 'No date',
                link: linkEl?.href || 'No link',
                content: item.textContent?.substring(0, 200) + '...'
              };
            });
          `
        },
        purpose: "Extract latest USMCA updates"
      },
      {
        tool: "puppeteer_screenshot",
        params: { 
          name: "ustr-usmca-updates",
          width: 1400,
          height: 1000
        },
        purpose: "Document official policy updates"
      }
    ],
    businessValue: "Early detection of USMCA policy changes that could affect triangle routing strategies"
  },

  // Example 4: Competitive intelligence gathering
  competitorAnalysis: {
    description: "Gather competitive intelligence on trade service providers",
    steps: [
      {
        tool: "puppeteer_navigate",
        params: { url: "https://competitor-trade-services.com/calculator" },
        purpose: "Access competitor's pricing calculator"
      },
      {
        tool: "puppeteer_fill",
        params: { 
          selector: "input[name*='product']", 
          value: "Electronics components" 
        },
        purpose: "Input comparable product category"
      },
      {
        tool: "puppeteer_fill",
        params: { 
          selector: "input[name*='value'], #import-value", 
          value: "500000" 
        },
        purpose: "Set import value for comparison"
      },
      {
        tool: "puppeteer_select",
        params: { 
          selector: "select[name*='origin'], #country-origin", 
          value: "China" 
        },
        purpose: "Select origin country"
      },
      {
        tool: "puppeteer_click",
        params: { selector: ".calculate-savings, button[type='submit']" },
        purpose: "Calculate competitor's savings estimate"
      },
      {
        tool: "puppeteer_evaluate",
        params: {
          script: `
            // Extract competitor pricing and claims
            const results = document.querySelector('.results, .savings-display, .output');
            if (results) {
              return {
                totalSavings: results.querySelector('.total-savings, .savings-amount')?.textContent?.trim(),
                methodology: results.querySelector('.methodology, .how-calculated')?.textContent?.trim(),
                timeframe: results.querySelector('.timeframe, .implementation-time')?.textContent?.trim(),
                timestamp: new Date().toISOString()
              };
            }
            return { error: 'No results found' };
          `
        },
        purpose: "Extract competitor claims and methodology"
      }
    ],
    businessValue: "Competitive benchmarking and value proposition refinement"
  },

  // Example 5: Market research automation
  marketResearch: {
    description: "Automated collection of market intelligence from multiple sources",
    steps: [
      {
        tool: "puppeteer_navigate",
        params: { url: "https://www.trade.gov/country-commercial-guides" },
        purpose: "Access official US trade intelligence"
      },
      {
        tool: "puppeteer_fill",
        params: { selector: "input[type='search'], #search", value: "Mexico manufacturing" },
        purpose: "Search for Mexico manufacturing intelligence"
      },
      {
        tool: "puppeteer_click",
        params: { selector: "button[type='submit'], .search-btn" },
        purpose: "Execute search"
      },
      {
        tool: "puppeteer_evaluate",
        params: {
          script: `
            // Extract market research data
            const reports = document.querySelectorAll('.report, .guide, .document');
            return Array.from(reports).slice(0, 8).map(report => {
              const titleEl = report.querySelector('h2, h3, .title');
              const summaryEl = report.querySelector('.summary, .excerpt, p');
              const linkEl = report.querySelector('a');
              
              return {
                title: titleEl?.textContent?.trim(),
                summary: summaryEl?.textContent?.trim()?.substring(0, 150) + '...',
                link: linkEl?.href,
                relevance: report.textContent?.includes('USMCA') ? 'High' : 'Medium'
              };
            }).filter(r => r.title);
          `
        },
        purpose: "Extract relevant market intelligence reports"
      }
    ],
    businessValue: "Automated market research for strategic triangle routing opportunities"
  }
};

// Usage instructions
const usageInstructions = `
PUPPETEER MCP USAGE FOR TRIANGLE INTELLIGENCE PLATFORM
=====================================================

To use these examples with Claude Desktop (once Puppeteer MCP is loaded):

1. **Simple Navigation Example**:
   "Use puppeteer to navigate to https://comtrade.un.org and take a screenshot"

2. **Data Extraction Example**:
   "Navigate to the UN Comtrade database, search for HS code 8708 (automotive parts), 
   and extract the top 10 trade flows between China and USA"

3. **Competitive Analysis Example**:
   "Go to [competitor website], fill out their trade calculator with Electronics, 
   $500K import value, origin China, and capture their savings claims"

4. **Market Monitoring Example**:
   "Check the USTR website for any new USMCA announcements in the last 30 days 
   and summarize the key points"

5. **Automated Workflow Example**:
   "Set up a monitoring workflow: navigate to Maersk rates page, get quote for 
   Shanghai to LA 40ft container, screenshot the results, then do the same for 
   COSCO and compare the rates"

INTEGRATION WITH TRIANGLE INTELLIGENCE:
- Use captured data to validate platform calculations
- Monitor market changes for real-time alert generation  
- Gather competitive intelligence for value proposition refinement
- Document successful strategies for hindsight pattern library
- Cross-reference external sources with internal 500K+ trade flow database

BEST PRACTICES:
- Always add delays between requests (respect rate limits)
- Use descriptive screenshot names with timestamps
- Extract data in structured formats for easy analysis
- Document data sources and capture timestamps
- Respect website terms of service and robots.txt
`;

console.log('📖 Puppeteer MCP Examples for Triangle Intelligence Platform');
console.log('============================================================\n');

Object.entries(examples).forEach(([key, example], index) => {
  console.log(`${index + 1}. ${example.description.toUpperCase()}`);
  console.log(`   Business Value: ${example.businessValue}`);
  console.log(`   Steps: ${example.steps.length} automated actions\n`);
});

console.log(usageInstructions);

module.exports = examples;