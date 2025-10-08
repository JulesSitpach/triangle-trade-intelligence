/**
 * Educational Alerts & Thought Leadership Content
 * Static content library for Mexico trade intelligence and policy updates
 * Can be displayed on alerts page, home page, or as email content
 */

export const EDUCATIONAL_ALERTS = [
  {
    id: 'usmca-bilateral-threat-2025',
    category: 'policy',
    priority: 'critical',
    title: 'USMCA Bilateral Threat: What SMBs Need to Know',
    publishDate: '2025-01-15',
    lastUpdated: '2025-01-15',
    summary: 'Trump administration considering replacing USMCA with bilateral deals. Companies relying on 0% tariffs need backup plans NOW.',
    content: `**The Situation:**
Trump administration is considering replacing USMCA (United States-Mexico-Canada Agreement) with separate bilateral trade deals with Mexico and Canada. This could fundamentally change the tariff landscape for North American trade.

**What This Means for Your Business:**
- Current 0% USMCA tariff benefits could be renegotiated or eliminated
- Timeline: Potential changes in 2025-2026 (during USMCA review period)
- Risk: Companies with USMCA-dependent strategies need contingency plans

**The Good News:**
Even if USMCA is replaced, Mexico's geographic advantages remain:
- 2-week shipping vs 6-8 weeks from Asia (unchanged)
- Same time zone for real-time communication (unchanged)
- Direct trucking to US/Canada (unchanged)
- Cultural/language bridges (unchanged)

**Action Items:**
1. ✓ Get your current USMCA qualification assessed
2. ✓ Build Mexico supplier relationships NOW (before policy changes)
3. ✓ Calculate savings under both USMCA and bilateral scenarios
4. ✓ Establish partnerships based on geography, not just tariff rates

**Bottom Line:**
Mexico makes strategic sense WITH or WITHOUT USMCA. But companies that act now get:
- Current 0% benefits while they last
- Established relationships if bilateral deals change terms
- Geographic advantages that persist regardless of policy`,
    cta: {
      primary: 'Get USMCA Analysis',
      primaryLink: '/usmca-workflow',
      secondary: 'Calculate Savings',
      secondaryLink: '/mexico-savings-calculator'
    },
    tags: ['USMCA', 'policy', 'bilateral-deals', 'Trump', 'trade-agreement']
  },

  {
    id: 'geography-advantage-2025',
    category: 'strategy',
    priority: 'high',
    title: 'The Geography Advantage: Why 2-Week Shipping Beats Any Tariff Rate',
    publishDate: '2025-01-10',
    lastUpdated: '2025-01-10',
    summary: 'Hidden costs of long-distance supply chains make Mexico competitive even in worst-case tariff scenarios.',
    content: `**The Hidden Cost of Distance:**
Companies focus on tariff rates, but shipping time drives massive hidden costs:

**Inventory Carrying Costs:**
- 6-8 week shipping = 2 months of inventory in transit at all times
- Industry standard: 25% annual carrying cost on inventory
- Formula: (Shipping Days ÷ 365) × Annual Volume × 25%
- Example: $10M annual imports, 49 days shipping = $335k annual carrying cost

**Mexico's 2-Week Advantage:**
- 1-2 week shipping = 10.5 days average
- Same example: $10M annual, 10.5 days = $72k carrying cost
- Savings: $263k annually just from faster delivery

**Real-World Math:**
Even if Mexico tariffs increased from 0% (USMCA) to 3% (bilateral MFN):
- Tariff increase: $10M × 3% = $300k annual cost
- Inventory savings: $263k
- Net impact: Only $37k (0.37% of total volume)

**Additional Benefits (Not Quantified Above):**
✓ Faster response to demand changes
✓ Reduced air freight for urgent shipments
✓ Less buffer stock needed (lower warehouse costs)
✓ Same-day communication vs 12-hour delays
✓ Easier quality control and site visits

**The Suez Canal Factor:**
2024 Red Sea disruptions added 2-3 weeks to Asia shipping. Mexico routes were unaffected. This resilience has real dollar value that doesn't show up in tariff calculations.

**Conclusion:**
Geography is a competitive advantage that trade agreements can't change. Companies sourcing from Mexico for proximity alone are making sound decisions regardless of USMCA's future.`,
    cta: {
      primary: 'Calculate My Savings',
      primaryLink: '/mexico-savings-calculator',
      secondary: 'Find Mexico Suppliers',
      secondaryLink: '/services/logistics-support'
    },
    tags: ['geography', 'shipping', 'inventory', 'cost-analysis', 'proximity']
  },

  {
    id: 'china-tariff-landscape-2025',
    category: 'risk',
    priority: 'high',
    title: 'China Tariff Landscape 2025: Section 301 Reality Check',
    publishDate: '2025-01-05',
    lastUpdated: '2025-01-05',
    summary: '25% Section 301 tariffs remain on most Chinese goods. No relief in sight for machinery, electronics, textiles.',
    content: `**Current State (January 2025):**
Section 301 tariffs on Chinese imports remain at 25% for most product categories:
- Machinery & equipment: 25%
- Electronics & technology: 25%
- Textiles & apparel: 25%
- Industrial supplies: 25%

**Combined with MFN rates:**
Most companies pay 27-28% total tariffs on Chinese goods.

**Example: $5M Annual Chinese Imports**
- Section 301 (25%): $1.25M
- MFN average (2.5%): $125k
- Total annual tariff cost: $1.375M

**Mexico Alternative:**
Same $5M volume from Mexico:
- USMCA qualified: $0 (0% tariff)
- Bilateral scenario (worst case): $125k (2.5% MFN)
- Savings: $1.25M to $1.375M annually

**Risk Factors:**
⚠️ No guarantee Section 301 rates won't increase
⚠️ Potential for additional restrictions on Chinese tech
⚠️ Supply chain disruptions (Suez Canal, Taiwan tensions)
⚠️ Lead times 6-8 weeks vs Mexico's 1-2 weeks

**Strategic Question:**
Why pay $1.375M in tariffs when Mexico offers:
- $0 (with USMCA) or $125k (bilateral MFN) in tariffs
- 75% faster delivery (2 weeks vs 8 weeks)
- Same time zone for communication
- Direct trucking access to US market

**Action Plan:**
1. Calculate your current China tariff exposure
2. Identify which components could be sourced from Mexico
3. Get vetted Mexico supplier matches
4. Build transition roadmap (most companies transition in 6-12 months)`,
    cta: {
      primary: 'Calculate China Exposure',
      primaryLink: '/mexico-savings-calculator',
      secondary: 'Find Alternatives',
      secondaryLink: '/services/logistics-support'
    },
    tags: ['China', 'Section-301', 'tariffs', 'risk-mitigation', 'alternatives']
  },

  {
    id: 'eu-energy-crisis-2025',
    category: 'risk',
    priority: 'medium',
    title: 'EU Energy Crisis: The 25-35% Hidden Tariff on German Components',
    publishDate: '2025-01-08',
    lastUpdated: '2025-01-08',
    summary: 'German manufacturing costs up 25-35% due to energy crisis. Affects precision components, machinery, industrial supplies.',
    content: `**The Situation:**
European energy costs remain 25-35% higher than pre-2022 levels. German manufacturers are passing these costs to customers through:
- Direct price increases (15-25%)
- Energy surcharges (5-10%)
- Currency adjustments (EUR strengthening)

**Affected Industries:**
- Precision machining & components
- Industrial machinery
- Automotive parts
- Electronics manufacturing

**Real-World Impact:**
Company importing $3M annually in German precision components:
- Base cost: $3M
- Energy-related increases: 25% average
- New cost: $3.75M
- Unexpected cost increase: $750k annually

**Mexico Alternative:**
Mexico's energy costs remain stable and competitive:
- Natural gas prices 40-60% lower than EU
- Electricity costs competitive with US
- No energy crisis surcharges
- Skilled manufacturing workforce at 40-60% of German labor costs

**Case for Diversification:**
Even companies with established German suppliers should:
1. Calculate exposure to EU energy cost volatility
2. Identify which components could be dual-sourced from Mexico
3. Build backup supply relationships
4. Reduce single-country dependency risk

**The Reliability Factor:**
Beyond cost, EU manufacturers face:
- Potential energy rationing in winter months
- Production interruptions
- Longer lead times due to capacity constraints

Mexico offers:
- Stable energy supply
- Consistent production capacity
- 2-week delivery vs 2-3 weeks from Europe
- Direct trucking vs ocean freight

**Strategic Approach:**
Not suggesting abandoning European suppliers entirely, but:
✓ Dual-source critical components
✓ Shift non-critical items to Mexico
✓ Build relationships now before crisis worsens
✓ Reduce exposure to energy price volatility`,
    cta: {
      primary: 'Calculate EU Exposure',
      primaryLink: '/mexico-savings-calculator',
      secondary: 'Find Mexico Alternatives',
      secondaryLink: '/services/logistics-support'
    },
    tags: ['EU', 'Germany', 'energy-crisis', 'cost-increases', 'diversification']
  },

  {
    id: 'nearshoring-trend-2025',
    category: 'strategy',
    priority: 'medium',
    title: 'Nearshoring Isn\'t a Trend – It\'s the New Normal',
    publishDate: '2025-01-12',
    lastUpdated: '2025-01-12',
    summary: 'Data shows 67% of manufacturers moving production closer to end markets. Mexico is primary beneficiary for North American companies.',
    content: `**The Numbers:**
Recent surveys show fundamental shifts in supply chain strategy:
- 67% of manufacturers reshoring or nearshoring production
- Mexico manufacturing output up 24% since 2020
- New manufacturing facilities in Monterrey, Guadalajara, Tijuana up 40%
- Electronics, automotive, aerospace leading the transition

**Why Now?**
Multiple factors converging:
1. **Trade Policy Uncertainty**: USMCA bilateral threat, China tariffs, EU challenges
2. **Supply Chain Disruptions**: Suez Canal, Panama Canal, COVID lessons learned
3. **Inventory Costs**: CFOs demanding lower carrying costs (faster delivery)
4. **Resilience Focus**: Boards demanding diversified, lower-risk supply chains

**Mexico's Advantages:**
**Geographic:**
- 2-week shipping vs 6-8 weeks Asia
- Direct trucking access to US/Canada
- Same time zones (real-time communication)
- 2-hour flights for site visits

**Economic:**
- Labor costs 40-60% of US
- Competitive energy costs vs EU
- Modern manufacturing infrastructure
- Free trade agreements with 46 countries

**Strategic:**
- USMCA benefits (while they last)
- Political stability and pro-business policies
- Skilled workforce (especially in automotive, aerospace, electronics)
- Proximity reduces geopolitical risk

**The Early Mover Advantage:**
Companies establishing Mexico relationships now get:
✓ Better supplier selection (before capacity fills)
✓ Negotiating leverage (suppliers seeking US partners)
✓ Time to build relationships properly
✓ Competitive advantage over slower-moving competitors

**Common Objections Addressed:**

"Mexico manufacturing can't match Asian quality"
→ Modern Mexico facilities match or exceed quality (aerospace, automotive, medical devices prove this)

"Labor cost savings aren't as good as China"
→ True, but total landed cost (tariffs + shipping + inventory) often favors Mexico

"I don't know how to find reliable Mexican suppliers"
→ This is where expert services add value (vetting, verification, relationship building)

**The Risk of Waiting:**
1. Supplier capacity filling up (best partners getting locked into relationships)
2. Policy changes forcing reactive decisions
3. Competitors gaining lead time advantages
4. Missing current USMCA benefits window

**Get Started:**
Most companies follow this path:
1. Start with vulnerability assessment (which components are highest risk?)
2. Pilot with 1-2 non-critical components (learn the process)
3. Expand to critical items once confidence built
4. Maintain current suppliers during transition (risk management)`,
    cta: {
      primary: 'Assess My Supply Chain',
      primaryLink: '/usmca-workflow',
      secondary: 'Explore Mexico Services',
      secondaryLink: '/secure-supply-chain-mexico'
    },
    tags: ['nearshoring', 'trends', 'strategy', 'Mexico-manufacturing', 'competitive-advantage']
  }
];

// Helper functions
export function getAlertsByCategory(category) {
  return EDUCATIONAL_ALERTS.filter(alert => alert.category === category);
}

export function getAlertsByPriority(priority) {
  return EDUCATIONAL_ALERTS.filter(alert => alert.priority === priority);
}

export function getLatestAlerts(count = 3) {
  return EDUCATIONAL_ALERTS
    .sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate))
    .slice(0, count);
}

export function getAlertById(id) {
  return EDUCATIONAL_ALERTS.find(alert => alert.id === id);
}

export function searchAlerts(searchTerm) {
  const term = searchTerm.toLowerCase();
  return EDUCATIONAL_ALERTS.filter(alert =>
    alert.title.toLowerCase().includes(term) ||
    alert.summary.toLowerCase().includes(term) ||
    alert.content.toLowerCase().includes(term) ||
    alert.tags.some(tag => tag.toLowerCase().includes(term))
  );
}
