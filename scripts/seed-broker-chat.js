/**
 * Seed Broker Chat Responses
 * Loads 22 trade terms with friendly broker personality
 * Includes Mexico Triangle Routing advantages + Professional Services referrals
 * Run with: node scripts/seed-broker-chat.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const brokerResponses = [
  {
    term: 'MFN Rate',
    keywords: ['mfn', 'most favored nation', 'normal tariff', 'regular duty', 'standard rate', 'mfn rate'],
    category: 'tariff',
    broker_response: `Oh man, MFN rates! Let me break this down for you...

**MFN Rate = The "regular price" you'd pay in tariffs WITHOUT any trade deals.** 📦

It's what the U.S. charges all WTO member countries by default. Think of it like the sticker price before any discounts.

**Here's why it matters:**
- MFN is what you pay if you DON'T use USMCA
- The higher the MFN, the MORE you save with USMCA
- In 2025, many MFN rates are CRAZY high (100%+) due to Section 301 tariffs`,
    quick_tip: 'We show MFN rates so you can see your savings when using USMCA. Higher MFN = bigger savings potential!',
    real_example: 'Real example from my client yesterday: Product: "Stainless steel brackets" - MFN: 103% - USMCA: 0% - Savings: $103,000 on $100K of imports!',
    encouragement: 'You\'re learning the important stuff! Understanding MFN vs USMCA rates is KEY to seeing your savings. 💪',
    related_questions: ['What is USMCA Rate?', 'Why is my tariff over 100%?', 'What is Section 301?', 'How are savings calculated?'],
    next_steps: ['View your tariff comparison', 'Calculate your USMCA savings'],
    difficulty_level: 'beginner',
    form_field: null
  },
  {
    term: 'USMCA Rate',
    keywords: ['usmca rate', 'preferential rate', 'usmca tariff', 'zero duty', 'free trade rate'],
    category: 'tariff',
    broker_response: `This is the GOOD one! 🎉

**USMCA Rate = The special discounted tariff you pay IF you qualify for USMCA benefits.**

Most of the time? **It's 0%!** Zero. Zilch. Nada.

**Here's how it works:**
- Regular imports pay MFN Rate (often 10-100%+)
- USMCA-qualified imports pay USMCA Rate (usually 0%)
- The difference? That's your savings! 💰

**Why 0%?** The whole point of USMCA is to encourage trade between US, Canada, and Mexico. So they made tariffs basically free if you prove it's North American.`,
    quick_tip: 'If you see "USMCA Rate: 0%" on your results - that\'s what you\'ll pay IF you qualify. Compare it to your MFN rate to see your potential savings!',
    real_example: 'Had a client last week shipping electronics from Mexico. MFN Rate: 68% - USMCA Rate: 0% - They save $68,000 per $100K shipment. That\'s life-changing!',
    encouragement: 'You\'re getting it! This is exactly why USMCA matters so much for your business. 🌟',
    related_questions: ['How do I qualify for USMCA?', 'What is MFN Rate?', 'Can I always get 0%?'],
    next_steps: ['Check if you qualify', 'View your potential savings'],
    difficulty_level: 'beginner',
    form_field: null
  },
  {
    term: 'HS Code',
    keywords: ['hs code', 'hts code', 'tariff code', 'harmonized code', 'classification code', 'product code'],
    category: 'classification',
    broker_response: `Oh man, HS codes! Let me break this down for you...

**HS Code = The "barcode" for your product in international trade.** 📦

Every product crossing a border needs one. It's how customs knows:
- What tariff rate to charge
- What regulations apply
- How to track trade statistics

**Real example from my client yesterday:**
- Product: "Stainless steel brackets for furniture"
- HS Code: 7326.90.85
- What it means: "Other articles of iron or steel"`,
    quick_tip: 'There are over 17,000 HS codes. Finding the right one can be tricky. That\'s why we built the AI suggestion button! 🤖',
    real_example: 'Been doing customs for 17 years - even I use classification tools sometimes. Nothing wrong with getting help!',
    encouragement: 'You got this! Finding the right HS code is half the battle. Our AI makes it way easier. 👍',
    related_questions: ['How do I find my HS code?', 'Can AI help me?', 'What if I get it wrong?'],
    next_steps: ['Click "Get AI HS Code Suggestion"', 'Let AI classify your product'],
    difficulty_level: 'intermediate',
    form_field: 'hs_code'
  },
  {
    term: 'Regional Value Content',
    keywords: ['rvc', 'regional value content', 'north american content', 'local content', 'value content', 'regional content'],
    category: 'qualification',
    broker_response: `Great question! This is THE big calculation. 💰

**Regional Value Content (RVC) = The percentage of your product's value that comes from North America (US/Canada/Mexico).**

**Simple example:**
- Your product sells for $100
- $70 worth of parts from Mexico/Canada
- $30 worth of parts from China
- **RVC = 70%** ✅

If your industry threshold is 60%, you QUALIFY! 🎊`,
    quick_tip: 'Our system calculates this automatically from your component breakdown. You just tell us the percentages - we do the math!',
    real_example: 'Had a machinery client: 45% Mexico parts + 25% Canada parts + 30% China parts = 70% RVC. Threshold needed: 60%. Result: QUALIFIED with room to spare!',
    encouragement: 'The cool part? You see your RVC IN REAL-TIME as you fill out components. No surprises! 🌟',
    related_questions: ['How is RVC calculated?', 'What\'s my industry threshold?', 'What if I\'m below the threshold?'],
    next_steps: ['Fill out your component breakdown', 'See your RVC calculation'],
    difficulty_level: 'intermediate',
    form_field: null
  },
  {
    term: 'USMCA',
    keywords: ['usmca', 'usmca agreement', 'trade agreement', 'nafta', 'free trade'],
    category: 'general',
    broker_response: `Welcome to the big leagues! 🎉

**USMCA = United States-Mexico-Canada Agreement**

It's the free trade agreement between the three North American countries. Think of it like a VIP pass for imports/exports.

**Why should you care?**
- Qualify for USMCA = Pay 0% tariffs (instead of 10-100%+)
- Faster customs clearance
- Easier to do business across North America

**It replaced NAFTA in 2020** with updated rules for modern products (like electronics, cars, etc.).`,
    quick_tip: 'The whole point of this platform? Help you qualify for USMCA benefits so you can save thousands (or millions) in tariffs! 💰',
    real_example: 'I helped a Texas electronics importer last month. They were paying $120K/year in tariffs. After USMCA qualification? $0. That\'s a new hire they can afford now!',
    encouragement: 'You\'re in the right place! Let\'s get you qualified. 🚀',
    related_questions: ['How do I qualify for USMCA?', 'What are the benefits?', 'Do I need a certificate?'],
    next_steps: ['Start your USMCA analysis', 'Learn about qualification'],
    difficulty_level: 'beginner',
    form_field: null
  },
  {
    term: 'Section 301 Tariffs',
    keywords: ['section 301', '301 tariffs', 'china tariffs', 'additional duties', 'trade war'],
    category: 'tariff',
    broker_response: `Oh boy, Section 301... Let's talk about this 2025 reality. 😅

**Section 301 = Extra tariffs (usually 25-50%) the US added on Chinese imports** due to the trade dispute.

**Why your tariff is so high:**
- Base MFN Rate: Maybe 3-10%
- Section 301: +25% to +50%
- Sometimes IEEPA: +another 50%
- **Total: Can be 100%+ !**

Yeah, it's brutal.`,
    quick_tip: 'This is EXACTLY why USMCA is so valuable right now. Qualify for USMCA = bypass these crazy tariffs entirely! 🎯',
    real_example: 'Had a client yesterday: Product from China = 103% tariff. Same product from Mexico with USMCA = 0% tariff. They\'re moving production NOW.',
    encouragement: 'I won\'t lie - 2025 trade policy is messy. But USMCA is your escape hatch. Let\'s use it! 💪',
    related_questions: ['Why is my tariff over 100%?', 'How does USMCA help?', 'Should I move production?'],
    next_steps: ['Check your USMCA savings', 'Explore Mexico sourcing'],
    difficulty_level: 'intermediate',
    form_field: null
  },

  // ============ MEXICO TRIANGLE ROUTING ADVANTAGES (Cost-Benefit Analysis) ============

  {
    term: 'USMCA vs MFN Savings',
    keywords: ['usmca savings', 'mfn vs usmca', 'duty differential', 'tariff savings', 'cost comparison', 'savings calculation'],
    category: 'cost_benefit',
    broker_response: `Let's talk about the real money! 💰

**USMCA vs MFN Savings = The actual dollar amount you save by qualifying for USMCA instead of paying regular tariffs.**

**Here's the calculation:**
- MFN Rate: What you pay WITHOUT USMCA (often 10-100%+)
- USMCA Rate: What you pay WITH USMCA (usually 0%)
- **Savings = MFN - USMCA**

**Real numbers from a client last week:**
- Annual imports: $500,000
- MFN Rate: 68%
- USMCA Rate: 0%
- **Annual savings: $340,000!** That's life-changing.`,
    quick_tip: 'We calculate this automatically in your results. The higher the MFN rate (thanks Section 301!), the MORE you save with USMCA. 🎯',
    real_example: 'Electronics client from Texas: Importing $2M annually from Mexico. MFN would cost $1.36M in tariffs. USMCA cost? $0. They literally saved enough to hire 15 people.',
    encouragement: 'These aren\'t hypothetical savings - this is real money staying in your business. Let\'s capture it! 💪',
    related_questions: ['How do I qualify for USMCA?', 'What is MFN Rate?', 'Can I always get 0%?'],
    next_steps: ['View your potential savings', 'Calculate ROI of USMCA compliance'],
    difficulty_level: 'beginner',
    form_field: null
  },

  {
    term: 'Canada-Mexico-US Route',
    keywords: ['triangle trade', 'canada mexico us', 'triangle routing', 'north american supply chain', 'regional sourcing'],
    category: 'mexico_strategy',
    broker_response: `Welcome to "Triangle Trade" - the smart play in 2025! 🔺

**The Triangle: Canada → Mexico → US (or any combination)**

**Why this matters:**
- All three countries are USMCA members
- Products can cross borders multiple times
- Each step stays under USMCA (0% tariffs!)
- Build resilient North American supply chains

**Strategic example:**
- Canadian raw materials → Mexico manufacturing → US market
- All at 0% tariffs with USMCA qualification`,
    quick_tip: 'Mexico is the HUB of this triangle. Close to US markets, lower labor costs than Canada, and full USMCA benefits. Many companies are discovering this now!',
    real_example: 'Auto parts client: Canadian steel → Mexico stamping/assembly → Texas distribution. All USMCA-qualified, zero tariffs, 3-day total transit time. Compare that to 45 days from Asia!',
    encouragement: 'You\'re thinking strategically! Triangle routing gives you flexibility AND savings. 🌟',
    related_questions: ['Why Mexico over China?', 'What is nearshoring?', 'How does Mexico fit in?'],
    next_steps: ['Explore Mexico sourcing options', 'Calculate triangle trade savings'],
    difficulty_level: 'intermediate',
    form_field: null
  },

  {
    term: 'Maquiladora Program',
    keywords: ['maquiladora', 'maquila', 'mexico manufacturing', 'twin plant', 'border manufacturing'],
    category: 'mexico_strategy',
    broker_response: `The Maquiladora program - Mexico's secret weapon! 🏭

**Maquiladora = Special Mexican manufacturing program allowing duty-free imports of materials for export manufacturing.**

**How it works:**
- Import raw materials/components to Mexico (duty-free!)
- Manufacture or assemble in Mexico
- Export finished goods (usually to US)
- Pay tariffs ONLY on value added in Mexico

**Perfect for:**
- Assembly operations
- Component manufacturing
- Testing and packaging
- Final processing before US import`,
    quick_tip: 'Combine Maquiladora + USMCA and you get DOUBLE benefits: duty-free imports into Mexico, PLUS 0% tariffs exporting to US. That\'s why so many companies are moving there!',
    real_example: 'Electronics client moved assembly from China to Tijuana Maquiladora. Chinese components come in duty-free, assembly in Mexico, export to US at 0% with USMCA. They cut costs 40% vs China direct!',
    encouragement: 'Maquiladoras aren\'t just for big companies anymore. SMBs are using this too! 💪',
    related_questions: ['What is IMMEX?', 'Do I need a Mexico facility?', 'Can I use contract manufacturing?'],
    next_steps: ['Research Mexico manufacturing partners', 'Calculate Maquiladora savings'],
    difficulty_level: 'advanced',
    form_field: null
  },

  {
    term: 'IMMEX Program',
    keywords: ['immex', 'maquiladora industry', 'temporary import', 'mexico manufacturing program', 'duty deferral'],
    category: 'mexico_strategy',
    broker_response: `IMMEX - the official name of the Maquiladora program! 📋

**IMMEX = Manufacturing Industry, Maquiladora, and Export Services**

It's Mexico's government program for temporary imports and duty-free manufacturing.

**Key benefits:**
- Import materials/equipment duty-free (temporary)
- Must be used in manufacturing for export
- Can stay in Mexico up to 18 months
- Compatible with USMCA qualification

**Types of operations allowed:**
- Manufacturing and assembly
- Repair and maintenance
- Testing and quality control
- Packaging and distribution`,
    quick_tip: 'IMMEX registration takes ~30-60 days. Many companies use Mexican 3PL providers who already have IMMEX licenses - faster to get started!',
    real_example: 'Medical device client: Used a Tijuana IMMEX-certified contract manufacturer. Got up and running in 2 months instead of building their own facility. Smart!',
    encouragement: 'IMMEX sounds complicated but it\'s really just Mexico saying "come manufacture here, we\'ll make it easy." And they do! 🌟',
    related_questions: ['What is Maquiladora?', 'Do I need my own facility?', 'How long does registration take?'],
    next_steps: ['Find IMMEX-certified partners', 'Explore contract manufacturing'],
    difficulty_level: 'advanced',
    form_field: null
  },

  {
    term: 'CTPAT-OEA Partnership',
    keywords: ['ctpat', 'oea', 'customs partnership', 'trusted trader', 'mutual recognition', 'fast lane'],
    category: 'compliance',
    broker_response: `The "fast lane" for trusted importers! 🚀

**CTPAT (US) + OEA (Mexico) = Mutual Recognition Agreement**

If you're certified by one country, the other trusts you too!

**Benefits:**
- Faster customs clearance (both directions)
- Fewer inspections (less than 1% vs 15%+ for others)
- Priority processing during crises
- Lower bond requirements
- Front-of-line treatment at borders

**Think of it like:**
TSA PreCheck for commercial imports - you're pre-vetted, so you skip the long lines!`,
    quick_tip: 'If you do regular Mexico-US trade, CTPAT certification pays for itself in reduced delays. Some clients report 50% faster clearance times!',
    real_example: 'Auto parts client with CTPAT: Average clearance at Laredo border is 45 minutes. Non-CTPAT competitors? 4-6 hours. That\'s a HUGE competitive advantage!',
    encouragement: 'Getting certified takes effort, but if you\'re serious about Mexico trade, it\'s worth every minute. You\'ll thank yourself later! 💪',
    related_questions: ['How do I get CTPAT certified?', 'What is OEA?', 'Is it worth the cost?'],
    next_steps: ['Apply for CTPAT certification', 'Research certification requirements'],
    difficulty_level: 'advanced',
    form_field: null
  },

  {
    term: 'Mexico Free Trade Zones',
    keywords: ['free trade zone', 'ftz', 'special economic zone', 'mexico ftz', 'duty free zone', 'trade zone'],
    category: 'mexico_strategy',
    broker_response: `Free Trade Zones - Mexico's sweet spots for manufacturers! 🎯

**Free Trade Zone (FTZ) = Designated areas in Mexico where foreign goods can enter without paying import duties** (as long as they're ultimately exported).

**Major Mexico FTZ locations:**
- Tijuana (San Diego border)
- Ciudad Juárez (El Paso border)
- Monterrey (Texas proximity)
- Guadalajara (tech manufacturing)
- Querétaro (aerospace/auto)

**Strategic benefits:**
- Duty-free imports from anywhere
- Combine with USMCA for 0% export to US
- Modern infrastructure
- Skilled labor pools nearby`,
    quick_tip: 'Border FTZs (Tijuana, Juárez) give you "dual advantage" - duty-free imports from Asia + same-day trucking to US markets. Many companies use this for final assembly!',
    real_example: 'Consumer electronics client: Ships components from Asia to Tijuana FTZ (no duties), final assembly in FTZ, truck to LA in 6 hours with USMCA (0% tariff). Total landed cost 30% less than China direct!',
    encouragement: 'FTZs aren\'t just for huge companies - plenty of contract manufacturers in these zones can handle smaller volumes too. 🌟',
    related_questions: ['Which FTZ is best for me?', 'How does IMMEX relate to FTZ?', 'Can I use contract manufacturing?'],
    next_steps: ['Research FTZ locations', 'Find FTZ-based manufacturers'],
    difficulty_level: 'advanced',
    form_field: null
  },

  {
    term: 'NAFTA vs USMCA Transition',
    keywords: ['nafta usmca', 'nafta transition', 'legacy certification', 'usmca changes', 'old nafta rules'],
    category: 'compliance',
    broker_response: `The great transition! Let me clarify this... 📜

**NAFTA ended July 1, 2020. USMCA replaced it.**

**Key differences:**
- NAFTA: Old rules (1994-2020)
- USMCA: New rules (2020-present)
- Stricter origin requirements (especially autos, textiles)
- New labor and environmental provisions
- Different RVC thresholds for some products

**BUT - good news:**
Most SMBs barely notice the difference. The core concept is the same: **qualify for North American origin = 0% tariffs!**`,
    quick_tip: 'If someone says "NAFTA certificate" they usually mean USMCA certificate - people still use the old term out of habit. Don\'t let it confuse you!',
    real_example: 'Client asked me last week: "Can I use my old NAFTA certificate?" Answer: No, but the USMCA process is basically the same. We got them qualified in 2 days.',
    encouragement: 'Don\'t overthink the NAFTA vs USMCA thing. The important part? You can STILL get 0% tariffs on qualified goods. That hasn\'t changed! 💪',
    related_questions: ['What changed in USMCA?', 'Do I need a new certificate?', 'Are the rules harder now?'],
    next_steps: ['Start USMCA qualification', 'Generate your certificate'],
    difficulty_level: 'intermediate',
    form_field: null
  },

  {
    term: 'Mexico Labor Reform',
    keywords: ['mexico labor', 'labor reform', 'usmca labor', 'worker rights', 'labor compliance', 'union rights'],
    category: 'compliance',
    broker_response: `USMCA's "fairness clause" - and why it matters! 👷

**Mexico Labor Reform = New worker protections required by USMCA** (effective 2019-2023).

**What changed:**
- Independent unions (not controlled by companies)
- Secret ballot voting
- Collective bargaining rights
- Better wage enforcement
- Worker health & safety standards

**Why you should care:**
- Ensures fair competition (no race to bottom on wages)
- Reduces supply chain risk (fewer strikes/disruptions)
- Required for USMCA qualification in some sectors
- Generally: good for business stability!`,
    quick_tip: 'If you work with Mexican suppliers, ask if they\'re compliant with the new labor rules. Reputable manufacturers will say "yes" immediately - they had to comply by 2023.',
    real_example: 'Auto client told me their Mexican supplier actually WELCOMED the reforms - said it helped them attract better workers and reduce turnover. Win-win!',
    encouragement: 'Labor reform sounds political, but really it\'s just about creating stable, reliable supply chains. That\'s good for everyone! 🌟',
    related_questions: ['Does this affect my costs?', 'What is Rapid Response?', 'Do I need to audit suppliers?'],
    next_steps: ['Verify supplier compliance', 'Review USMCA labor provisions'],
    difficulty_level: 'advanced',
    form_field: null
  },

  {
    term: 'Rapid Response Mechanism',
    keywords: ['rapid response', 'rrm', 'labor enforcement', 'usmca enforcement', 'facility-specific', 'labor complaints'],
    category: 'compliance',
    broker_response: `The USMCA "enforcement tool" - here's what it means... ⚡

**Rapid Response Mechanism (RRM) = Fast-track system to investigate labor violations at specific facilities** (Mexico/US/Canada).

**How it works:**
- Someone files a labor complaint about a facility
- Independent panel investigates (30-45 days!)
- If violations found: penalties, import blocks
- Facility-specific (not country-wide)

**Real talk:**
This is VERY rare. Since 2021, only ~15 cases total. Most Mexican facilities are compliant.

**What it means for you:**
Work with reputable suppliers who respect worker rights, and you'll never hear about RRM.`,
    quick_tip: 'If you\'re nervous about this, ask potential Mexican suppliers: "Any RRM cases?" Legit suppliers will know what you mean and answer confidently. It\'s a good vetting question!',
    real_example: 'Client asked me about a supplier in Monterrey - I checked public RRM database (yes, it\'s public!). Clean record. That gave them confidence to proceed.',
    encouragement: 'RRM sounds scary but it\'s actually protecting YOU from supply chain disruptions. Better to catch problems early than have a supplier shut down mid-contract! 💪',
    related_questions: ['Has RRM ever been used?', 'How do I check supplier compliance?', 'What are the penalties?'],
    next_steps: ['Check RRM public database', 'Vet potential suppliers'],
    difficulty_level: 'advanced',
    form_field: null
  },

  {
    term: 'USMCA Environmental Compliance',
    keywords: ['environmental compliance', 'usmca environment', 'sustainability', 'green trade', 'environmental provisions'],
    category: 'compliance',
    broker_response: `The "green trade" requirements - USMCA edition! 🌱

**USMCA Environmental Compliance = First major trade agreement with enforceable environmental protections.**

**Key provisions:**
- Illegal fishing/logging enforcement
- Air quality standards
- Marine protection (especially Gulf of Mexico)
- Ozone-depleting substances ban
- Corporate accountability for violations

**Why it's actually good for business:**
- Level playing field (everyone follows same rules)
- Reduces reputational risk
- Appeals to ESG-conscious buyers
- Future-proofs your supply chain`,
    quick_tip: 'Most established Mexican manufacturers already comply - it\'s built into their operations. But it\'s worth asking about environmental certifications when vetting suppliers!',
    real_example: 'Had a client in sustainable packaging - their Mexican supplier\'s ISO 14001 environmental certification was a SELLING POINT to their US customers. Helped them win contracts!',
    encouragement: 'Environmental compliance isn\'t a burden - it\'s a competitive advantage. Customers care about this stuff now! 🌟',
    related_questions: ['Do I need to audit suppliers?', 'What certifications should I look for?', 'Does this affect costs?'],
    next_steps: ['Request supplier environmental certifications', 'Review USMCA environmental chapter'],
    difficulty_level: 'intermediate',
    form_field: null
  },

  // ============ PROFESSIONAL SERVICES REFERRALS ============

  {
    term: 'Getting Expert Help',
    keywords: ['need help', 'expert help', 'professional help', 'hire expert', 'get assistance', 'need consultant', 'trade expert', 'customs broker help'],
    category: 'services',
    broker_response: `Smart move asking for help! Trade compliance can get complex fast. 💼

**Here's what we offer at Triangle Trade Intelligence:**

**🏥 Trade Health Check ($99)** - Quick assessment of your trade setup
**📜 USMCA Advantage Sprint ($175)** - Get USMCA-qualified with expert guidance
**🔧 Supply Chain Optimization ($275)** - Reduce costs and improve efficiency
**🚀 Pathfinder Market Entry ($350)** - Expert Mexico market entry strategy
**🛡️ Supply Chain Resilience ($450)** - Find alternative suppliers, reduce risk
**🆘 Crisis Navigator ($200/month)** - Ongoing support for trade emergencies

**My team (Cristina & Jorge):**
- 17+ years combined trade experience
- Mexico-based with US market expertise
- Bilingual (Spanish/English)
- Real SMB owners who understand your challenges`,
    quick_tip: 'Professional subscribers get 15-25% off all services! If you\'re doing regular trade, the subscription pays for itself quickly.',
    real_example: 'Had a client last month unsure about USMCA qualification. They got our USMCA Advantage Sprint ($175) - we had them qualified and certified in 2 days. Saved them $50K annually in tariffs!',
    encouragement: 'You don\'t have to figure this out alone! We\'re here to help. 🤝',
    related_questions: ['Which service is right for me?', 'Do you offer custom packages?', 'What about ongoing support?'],
    next_steps: ['View all services at /services', 'Book a Trade Health Check', 'Talk to Cristina or Jorge'],
    difficulty_level: 'beginner',
    form_field: null
  },

  {
    term: 'Finding Suppliers',
    keywords: ['find suppliers', 'supplier sourcing', 'mexico suppliers', 'manufacturer search', 'finding manufacturers', 'supplier directory', 'contract manufacturing'],
    category: 'services',
    broker_response: `Finding the right suppliers is SO key! You're in the right place. 🔍

**The USMCA advantage:**
The agreement has really opened up new possibilities for sourcing from Mexico and Canada. A lot of my clients are taking advantage of Mexico's Maquiladora program and IMMEX manufacturing zones. These allow you to import materials duty-free, manufacture in Mexico, then export to the US at 0% tariffs under USMCA.

**We can help with this!**
Our **🚀 Pathfinder Market Entry service ($350)** specializes in Mexico supplier research and market entry strategy. Cristina and Jorge have deep Mexico connections and can point you to vetted IMMEX-certified manufacturers.

**Or for supply chain issues:**
**🛡️ Supply Chain Resilience ($450)** - We research alternative suppliers, assess USMCA qualification, and build your resilient North American supply chain.

So you've got a whole network of Mexico-based suppliers ready to partner with small and medium businesses like yours!`,
    quick_tip: 'Check out the Maquiladora and IMMEX info in my database - that\'s a great starting point for understanding Mexico-based suppliers that can help you maximize your USMCA benefits.',
    real_example: 'Had a client last year that moved their electronics assembly from China to a Maquiladora facility in Tijuana. They cut their costs by 40% and got 0% tariffs shipping back to the US. Game-changer!',
    encouragement: 'Don\'t be intimidated by all the Mexico trade programs - my team and I are here to guide you through it. Let\'s find some awesome suppliers that can help you take advantage of USMCA! 💪',
    related_questions: ['What is the Maquiladora program?', 'How does IMMEX work?', 'What are the benefits of Mexico sourcing?'],
    next_steps: ['Book Pathfinder Market Entry service', 'Explore Supply Chain Resilience', 'Learn about IMMEX'],
    difficulty_level: 'intermediate',
    form_field: null
  },

  {
    term: 'USMCA Qualification Help',
    keywords: ['qualify for usmca', 'usmca help', 'qualification assistance', 'certificate help', 'how to qualify', 'usmca support', 'need usmca help'],
    category: 'services',
    broker_response: `Getting USMCA-qualified? Let me help! 🎯

**Our platform guides you through it:**
1. Fill out the USMCA workflow (company info + components)
2. Our AI analyzes your qualification status
3. Get instant results and recommendations
4. Generate your USMCA certificate if qualified

**But if you want EXPERT guidance:**
**📜 USMCA Advantage Sprint ($175)** is our most popular service!

Cristina (17-year customs expert) personally reviews your:
- Product classification
- Component origin verification
- RVC (Regional Value Content) calculations
- Qualification status and optimization tips
- Professional certificate validation

**Typical turnaround: 24-48 hours!**`,
    quick_tip: 'Professional/Premium subscribers get 15-25% off the USMCA Advantage Sprint. That brings it down to $149 or $131!',
    real_example: 'Electronics client was confused about which USMCA criterion to use. Got our Sprint service - Cristina identified they qualified under Criterion B (instead of A they were trying). Certified in 36 hours!',
    encouragement: 'The DIY workflow is great for straightforward cases. But if you\'re unsure or want expert validation? The Sprint service is worth every penny. 💪',
    related_questions: ['What\'s included in USMCA Advantage Sprint?', 'How long does it take?', 'Do I get a certificate?'],
    next_steps: ['Try the free workflow first', 'Book USMCA Advantage Sprint', 'Talk to Cristina'],
    difficulty_level: 'beginner',
    form_field: null
  },

  {
    term: 'Tariff Crisis Help',
    keywords: ['tariff emergency', 'crisis help', 'urgent tariff', 'emergency support', 'tariff spike', 'trade emergency', 'crisis response'],
    category: 'services',
    broker_response: `Tariff crisis? I feel you - 2025 has been WILD. 🚨

**If you need URGENT help:**
**🆘 Crisis Navigator ($200/month ongoing)** is exactly for this!

What you get:
- Priority emergency response (24-48 hours)
- Real-time tariff change monitoring
- Crisis impact analysis and action plan
- Alternative sourcing strategies
- Direct access to Cristina & Jorge

**Led by Cristina (60%) with Jorge support (40%)**

This isn't a one-time fix - it's ongoing protection. We monitor for you, alert you to threats, and help you respond FAST when tariffs spike or trade rules change.

**Perfect for:**
- High-volume importers
- Companies with China exposure (Section 301 risks)
- Businesses needing reliable supply chains
- Anyone who can't afford surprises`,
    quick_tip: 'Many of our Premium subscribers add Crisis Navigator because they\'re already getting 25% off ($150/month instead of $200). Worth it for peace of mind!',
    real_example: 'Steel importer client: Section 301 tariffs jumped overnight. We had them on Crisis Navigator - we called them at 8am with alternative Mexico suppliers already researched. They pivoted in 72 hours. Saved their quarter!',
    encouragement: 'You can\'t predict tariff changes, but you CAN be ready for them. That\'s what we do! 💪',
    related_questions: ['What makes Crisis Navigator different?', 'Can I cancel anytime?', 'Do you handle emergencies?'],
    next_steps: ['Book Crisis Navigator', 'Get emergency assessment', 'Talk to Cristina'],
    difficulty_level: 'advanced',
    form_field: null
  },

  {
    term: 'Supply Chain Problems',
    keywords: ['supply chain issues', 'logistics problems', 'supply chain help', 'optimization help', 'reduce costs', 'improve efficiency', 'supply chain support'],
    category: 'services',
    broker_response: `Supply chain headaches? You're not alone - everyone's dealing with this in 2025. 📦

**We have TWO services for this:**

**🔧 Supply Chain Optimization ($275)**
- Complete audit of your current supply chain
- Cost reduction opportunities
- Lead time improvements
- Logistics efficiency analysis
- Actionable recommendations
**Led by Cristina (60%) with Jorge support (40%)**

**🛡️ Supply Chain Resilience ($450)**
- Alternative supplier research
- Mexico/Canada sourcing options
- USMCA qualification assessment
- Risk mitigation strategy
- Build backup supply chains
**Led by Jorge (60%) with Cristina support (40%)**

**Which one?**
- **Optimization** = Fix what you have, make it better
- **Resilience** = Build alternatives, reduce risk`,
    quick_tip: 'Most clients start with Optimization to understand their current state, then add Resilience to build backups. But you can do either one first!',
    real_example: 'Furniture importer: Supply chain mess, high costs, long lead times. Got our Optimization service - we found 3 ways to cut costs 30% and reduce lead time from 45 days to 12 days with Mexico sourcing!',
    encouragement: 'Supply chain problems feel overwhelming, but they\'re fixable! We do this every day. Let\'s get you sorted. 💪',
    related_questions: ['Which service should I choose?', 'Can I get both?', 'How long does it take?'],
    next_steps: ['Book Supply Chain Optimization', 'Book Supply Chain Resilience', 'Get Trade Health Check first ($99)'],
    difficulty_level: 'intermediate',
    form_field: null
  },

  {
    term: 'Trade Health Check',
    keywords: ['trade assessment', 'health check', 'trade audit', 'quick assessment', 'starting point', 'trade review', 'where to start'],
    category: 'services',
    broker_response: `Not sure where to start? Trade Health Check is PERFECT for you! 🏥

**🏥 Trade Health Check ($99)**
**Led equally by Cristina & Jorge (50% each)**

**What you get:**
- Complete assessment of your current trade setup
- Identify biggest cost savings opportunities
- USMCA qualification quick-check
- Tariff exposure analysis
- Prioritized action plan (what to fix first)
- Recommendations for next steps

**Turnaround: 24-48 hours!**

Think of it like a doctor's annual physical, but for your trade operations. We look at EVERYTHING and tell you what's working, what's broken, and what's costing you money.

**Perfect for:**
- New importers/exporters
- Companies unsure about USMCA
- Businesses wanting a second opinion
- Anyone needing a roadmap`,
    quick_tip: 'Trade Health Check is our ONLY service with no subscriber discount - $99 for everyone. It\'s our "try us out" offer!',
    real_example: 'Manufacturing client thought they needed full supply chain overhaul. Health Check revealed they were 90% USMCA-qualified already - just needed minor component sourcing tweaks. Saved them $15K on services they didn\'t need!',
    encouragement: 'This is the best bang-for-buck starting point. For $99, you get a complete roadmap. Then you decide what to tackle! 💪',
    related_questions: ['What\'s included?', 'How fast is it?', 'What happens after?'],
    next_steps: ['Book Trade Health Check', 'Learn about other services', 'Talk to Cristina & Jorge'],
    difficulty_level: 'beginner',
    form_field: null
  }
];

async function seedBrokerChat() {
  console.log('🌱 Seeding broker chat responses...');

  try {
    // Check existing count
    const { count: existingCount } = await supabase
      .from('broker_chat_responses')
      .select('*', { count: 'exact', head: true });

    console.log(`📊 Current responses in database: ${existingCount}`);

    // Insert each response
    for (const response of brokerResponses) {
      const { data, error } = await supabase
        .from('broker_chat_responses')
        .insert(response)
        .select();

      if (error) {
        console.error(`❌ Failed to insert "${response.term}":`, error.message);
      } else {
        console.log(`✅ Inserted: ${response.term}`);
      }
    }

    // Final count
    const { count: finalCount } = await supabase
      .from('broker_chat_responses')
      .select('*', { count: 'exact', head: true });

    console.log(`\n🎉 Seeding complete! Total responses: ${finalCount}`);

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedBrokerChat();
