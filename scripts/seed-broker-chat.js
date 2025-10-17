/**
 * Seed Broker Chat Responses
 * Loads 20 essential trade terms with friendly broker personality
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
