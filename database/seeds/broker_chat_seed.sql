-- Seed Data: 20 Essential Trade Terms (Friendly Broker Voice)
-- "Ask Your Broker" - Conversational, encouraging, practical help

INSERT INTO broker_chat_responses (
  term, keywords, category, broker_response, quick_tip, real_example,
  encouragement, related_questions, next_steps, difficulty_level, form_field
) VALUES

-- 1. Origin Criterion (MOST ASKED)
(
  'Origin Criterion',
  ARRAY['origin criterion', 'criterion', 'field 8', 'A B C', 'criterion A', 'criterion B', 'criterion C'],
  'certificate',
  'Hey! Great question - this one trips up a LOT of first-timers. Don''t worry! 😊

**Origin Criterion** is basically customs asking: *"Okay, HOW did this become a North American product?"*

Think of it like this:

🅰️ **Criterion A** - "I made it 100% in North America"
(Rare - like maple syrup from Canadian trees)

🅱️ **Criterion B** - "I transformed it here + it''s mostly North American value"
(Most common - you''re probably this one!)

©️ **Criterion C** - "I followed special industry rules"
(For specific products like cars or textiles)',
  'You can totally skip this field! Our system looks at your components and figures it out automatically. I''ve been doing this for 17 years - trust me, Criterion B is what 80% of manufacturers use.',
  'Had a furniture maker last week - they import wood from China, cut and assemble in Mexico. That''s Criterion B! The wood "transformed" into furniture.',
  'This stuff looks scary at first, but you''re asking the right questions! Keep going! 🌟',
  ARRAY['What does "transformed" mean?', 'How do I know which criterion I am?', 'What is Regional Value Content?'],
  ARRAY['Fill out your components and we''ll determine your criterion automatically!', 'Skip this field - AI will handle it'],
  'beginner',
  'origin_criterion'
),

-- 2. Method of Qualification
(
  'Method of Qualification',
  ARRAY['method of qualification', 'qualification method', 'TV', 'NC', 'TS', 'NO', 'transaction value', 'net cost'],
  'certificate',
  'Short answer: **Nope!** We''ve got you covered. 👍

Long answer (because I like to explain things):

"Method of Qualification" is customs-speak for *"How did you calculate your North American content percentage?"*

There are 4 methods, but honestly? **95% of my clients use Transaction Value (TV)**. Why? Because it''s based on your component costs - super simple, no complicated accounting needed.

**Here''s what we do automatically:**
1. You tell us: "40% from Mexico, 30% from Canada, 30% from China"
2. We calculate: "70% North American content"
3. We fill in: "Method = TV (Transaction Value)"
4. Done! ✅',
  'If you''re an SMB, you''re using TV. The other methods (NC, TS, NO) are for very specific situations. Don''t overthink this!',
  'I''ve been helping companies with USMCA since it launched in 2020. Trust me - if you''re an SMB, you''re using TV.',
  'Look, I''ve been doing customs for 17 years. Trust the AI on this one. You''re welcome! 😊',
  ARRAY['What is Regional Value Content?', 'How do you calculate RVC?', 'What''s the difference between TV and NC?'],
  ARRAY['Skip to next field >', 'View your calculation when ready'],
  'beginner',
  'method_of_qualification'
),

-- 3. MFN Rate (CRITICAL FOR UNDERSTANDING SAVINGS)
(
  'MFN Rate',
  ARRAY['mfn', 'most favored nation', 'normal tariff', 'regular duty', 'standard rate', 'mfn rate'],
  'tariff',
  'Oh man, MFN rates! Let me break this down for you...

**MFN Rate = The "regular price" you''d pay in tariffs WITHOUT any trade deals.** 📦

It''s what the U.S. charges all WTO member countries by default. Think of it like the sticker price before any discounts.

**Here''s why it matters:**
- MFN is what you pay if you DON''T use USMCA
- The higher the MFN, the MORE you save with USMCA
- In 2025, many MFN rates are CRAZY high (100%+) due to Section 301 tariffs',
  'We show MFN rates so you can see your savings when using USMCA. Higher MFN = bigger savings potential!',
  'Real example from my client yesterday: Product: "Stainless steel brackets" - MFN: 103% - USMCA: 0% - Savings: $103,000 on $100K of imports!',
  'You''re learning the important stuff! Understanding MFN vs USMCA rates is KEY to seeing your savings. 💪',
  ARRAY['What is USMCA Rate?', 'Why is my tariff over 100%?', 'What is Section 301?', 'How are savings calculated?'],
  ARRAY['View your tariff comparison', 'Calculate your USMCA savings'],
  'beginner',
  NULL
),

-- 4. USMCA Rate
(
  'USMCA Rate',
  ARRAY['usmca rate', 'preferential rate', 'usmca tariff', 'zero duty', 'free trade rate'],
  'tariff',
  'This is the GOOD one! 🎉

**USMCA Rate = The special discounted tariff you pay IF you qualify for USMCA benefits.**

Most of the time? **It''s 0%!** Zero. Zilch. Nada.

**Here''s how it works:**
- Regular imports pay MFN Rate (often 10-100%+)
- USMCA-qualified imports pay USMCA Rate (usually 0%)
- The difference? That''s your savings! 💰

**Why 0%?** The whole point of USMCA is to encourage trade between US, Canada, and Mexico. So they made tariffs basically free if you prove it''s North American.',
  'If you see "USMCA Rate: 0%" on your results - that''s what you''ll pay IF you qualify. Compare it to your MFN rate to see your potential savings!',
  'Had a client last week shipping electronics from Mexico. MFN Rate: 68% - USMCA Rate: 0% - They save $68,000 per $100K shipment. That''s life-changing!',
  'You''re getting it! This is exactly why USMCA matters so much for your business. 🌟',
  ARRAY['How do I qualify for USMCA?', 'What is MFN Rate?', 'Can I always get 0%?'],
  ARRAY['Check if you qualify', 'View your potential savings'],
  'beginner',
  NULL
),

-- 5. HS Code (TOP CONFUSION POINT)
(
  'HS Code',
  ARRAY['hs code', 'hts code', 'tariff code', 'harmonized code', 'classification code', 'product code'],
  'classification',
  'Oh man, HS codes! Let me break this down for you...

**HS Code = The "barcode" for your product in international trade.** 📦

Every product crossing a border needs one. It''s how customs knows:
- What tariff rate to charge
- What regulations apply
- How to track trade statistics

**Real example from my client yesterday:**
- Product: "Stainless steel brackets for furniture"
- HS Code: 7326.90.85
- What it means: "Other articles of iron or steel"',
  'There are over 17,000 HS codes. Finding the right one can be tricky. That''s why we built the AI suggestion button! 🤖',
  'Been doing customs for 17 years - even I use classification tools sometimes. Nothing wrong with getting help!',
  'You got this! Finding the right HS code is half the battle. Our AI makes it way easier. 👍',
  ARRAY['How do I find my HS code?', 'Can AI help me?', 'What if I get it wrong?'],
  ARRAY['Click "Get AI HS Code Suggestion"', 'Let AI classify your product'],
  'intermediate',
  'hs_code'
),

-- 6. Regional Value Content (RVC)
(
  'Regional Value Content',
  ARRAY['rvc', 'regional value content', 'north american content', 'local content', 'value content', 'regional content'],
  'qualification',
  'Great question! This is THE big calculation. 💰

**Regional Value Content (RVC) = The percentage of your product''s value that comes from North America (US/Canada/Mexico).**

**Simple example:**
- Your product sells for $100
- $70 worth of parts from Mexico/Canada
- $30 worth of parts from China
- **RVC = 70%** ✅

If your industry threshold is 60%, you QUALIFY! 🎊',
  'Our system calculates this automatically from your component breakdown. You just tell us the percentages - we do the math!',
  'Had a machinery client: 45% Mexico parts + 25% Canada parts + 30% China parts = 70% RVC. Threshold needed: 60%. Result: QUALIFIED with room to spare!',
  'The cool part? You see your RVC IN REAL-TIME as you fill out components. No surprises! 🌟',
  ARRAY['How is RVC calculated?', 'What''s my industry threshold?', 'What if I''m below the threshold?'],
  ARRAY['Fill out your component breakdown', 'See your RVC calculation'],
  'intermediate',
  NULL
),

-- 7. USMCA (The Agreement Itself)
(
  'USMCA',
  ARRAY['usmca', 'usmca agreement', 'trade agreement', 'nafta', 'free trade'],
  'general',
  'Welcome to the big leagues! 🎉

**USMCA = United States-Mexico-Canada Agreement**

It''s the free trade agreement between the three North American countries. Think of it like a VIP pass for imports/exports.

**Why should you care?**
- Qualify for USMCA = Pay 0% tariffs (instead of 10-100%+)
- Faster customs clearance
- Easier to do business across North America

**It replaced NAFTA in 2020** with updated rules for modern products (like electronics, cars, etc.).',
  'The whole point of this platform? Help you qualify for USMCA benefits so you can save thousands (or millions) in tariffs! 💰',
  'I helped a Texas electronics importer last month. They were paying $120K/year in tariffs. After USMCA qualification? $0. That''s a new hire they can afford now!',
  'You''re in the right place! Let''s get you qualified. 🚀',
  ARRAY['How do I qualify for USMCA?', 'What are the benefits?', 'Do I need a certificate?'],
  ARRAY['Start your USMCA analysis', 'Learn about qualification'],
  'beginner',
  NULL
),

-- 8. Section 301 Tariffs (2025 CRITICAL)
(
  'Section 301 Tariffs',
  ARRAY['section 301', '301 tariffs', 'china tariffs', 'additional duties', 'trade war'],
  'tariff',
  'Oh boy, Section 301... Let''s talk about this 2025 reality. 😅

**Section 301 = Extra tariffs (usually 25-50%) the US added on Chinese imports** due to the trade dispute.

**Why your tariff is so high:**
- Base MFN Rate: Maybe 3-10%
- Section 301: +25% to +50%
- Sometimes IEEPA: +another 50%
- **Total: Can be 100%+ !**

Yeah, it''s brutal.',
  'This is EXACTLY why USMCA is so valuable right now. Qualify for USMCA = bypass these crazy tariffs entirely! 🎯',
  'Had a client yesterday: Product from China = 103% tariff. Same product from Mexico with USMCA = 0% tariff. They''re moving production NOW.',
  'I won''t lie - 2025 trade policy is messy. But USMCA is your escape hatch. Let''s use it! 💪',
  ARRAY['Why is my tariff over 100%?', 'How does USMCA help?', 'Should I move production?'],
  ARRAY['Check your USMCA savings', 'Explore Mexico sourcing'],
  'intermediate',
  NULL
),

-- 9. Certificate of Origin
(
  'Certificate of Origin',
  ARRAY['certificate', 'usmca certificate', 'coo', 'origin certificate', 'form', 'documentation'],
  'certificate',
  'Ah, the certificate! This is your "proof" for customs. 📄

**Certificate of Origin = Official document proving your product qualifies for USMCA benefits.**

It''s like a receipt that says: "Hey customs, this product meets all the USMCA rules. Give me that 0% tariff!"

**Here''s the process:**
1. You complete our workflow (components, origins, etc.)
2. Our system generates the certificate with all 18 fields filled
3. You review and approve
4. You submit to customs with your shipment
5. Customs accepts it = You pay USMCA rate (usually 0%!) ✅',
  'The certificate is only needed when you actually IMPORT goods. Our system generates it automatically from your workflow data - you don''t fill it out manually!',
  'I''ve prepared thousands of these. The key? Accurate data. If your component breakdown is right, the certificate writes itself.',
  'Almost there! Once you complete your analysis, generating the certificate takes literally 30 seconds. 🚀',
  ARRAY['Do I need a certificate?', 'How do I generate it?', 'What''s on the certificate?'],
  ARRAY['Complete your workflow analysis', 'Generate certificate when ready'],
  'intermediate',
  NULL
),

-- 10. Tariff Shift
(
  'Tariff Shift',
  ARRAY['tariff shift', 'change in classification', 'transformation', 'substantial transformation'],
  'qualification',
  'This sounds complicated but it''s actually simple! 🎯

**Tariff Shift = Your product changed HS code categories during manufacturing.**

**Real example:**
- You import fabric (HS 5209.42)
- You sew it into t-shirts (HS 6109.10)
- HS code changed from "fabric" to "clothing"
- **That''s a tariff shift!** ✅

**Why it matters:** Many USMCA rules say "product must undergo a tariff shift" to qualify. It proves you actually DID something to it (not just repackaged it).',
  'Don''t worry about memorizing HS codes! Our system checks if your product underwent a tariff shift automatically based on your description.',
  'Had a client making furniture: Import steel bars (HS 7214) → Make table frames (HS 9403). Clear tariff shift = USMCA qualified!',
  'You''re learning the technical stuff! This proves you''re serious about getting USMCA right. 💪',
  ARRAY['Do I need a tariff shift?', 'How do I know if I have one?', 'What if I don''t have a tariff shift?'],
  ARRAY['Describe your manufacturing process', 'Let AI determine your tariff shift'],
  'advanced',
  NULL
),

-- 11. De Minimis
(
  'De Minimis',
  ARRAY['de minimis', 'small amounts', 'minor content', 'threshold exception'],
  'qualification',
  'Love this rule - it''s a lifesaver! 🎁

**De Minimis = "Small amounts don''t count" rule.**

**Here''s how it works:**
If your product contains a TINY amount of non-North American materials, USMCA lets you ignore it!

**Thresholds:**
- Usually 10% of product value
- Sometimes 7% (for specific products)

**Real example:**
- Your product is 95% North American
- 5% is screws from China
- De minimis rule: "Those screws are so small, ignore them!"
- **You count as 100% North American!** ✅',
  'This rule can push you OVER the qualification threshold when you''re close! We automatically check if de minimis applies to your product.',
  'Had a client at 58% North American content (needed 60%). De minimis rule kicked in for their Chinese adhesive (2%) → Boom! 60% qualified! 🎉',
  'These little rules can make a BIG difference. Keep learning - you''re doing great! 🌟',
  ARRAY['Does de minimis apply to me?', 'What materials qualify?', 'How much can I ignore?'],
  ARRAY['Fill out your components', 'Check if de minimis helps you qualify'],
  'advanced',
  NULL
),

-- 12. Producer vs Importer
(
  'Producer vs Importer',
  ARRAY['producer', 'importer', 'exporter', 'manufacturer', 'who signs', 'who certifies'],
  'certificate',
  'Good question! This confuses a LOT of people. 📝

**Producer = The company that MAKES the product**
**Importer = The company that BRINGS it into the US**

**For the certificate:**
- Either one can sign/certify
- Most of the time, the PRODUCER certifies (they know the components)
- Sometimes the IMPORTER certifies (if they have all the data)

**Real scenario:**
- Canadian factory (Producer) makes widgets
- Texas company (Importer) brings them to US
- Canadian factory usually signs the certificate (they know what''s in it!)',
  'If you''re using our platform, YOU''re probably the producer or importer. Either way, you can certify as long as you have accurate component data!',
  'Just yesterday: A Minnesota importer asked "Can I certify if my Mexican supplier won''t?" Answer: YES! As long as you have their component breakdown data.',
  'You''re thinking about the right details. That''s what separates amateurs from pros! 🎯',
  ARRAY['Who should sign my certificate?', 'Can I certify as an importer?', 'What if I''m both?'],
  ARRAY['Review certificate signing options', 'Complete your company info'],
  'intermediate',
  NULL
),

-- 13. Blanket Period
(
  'Blanket Period',
  ARRAY['blanket period', 'blanket certificate', 'validity period', 'one year'],
  'certificate',
  'This is a time-saver! ⏰

**Blanket Period = One certificate covers multiple shipments over a period (usually 12 months).**

Instead of:
- ❌ New certificate for EVERY shipment (annoying!)

You do:
- ✅ ONE certificate covering all shipments for a year (smart!)

**Requirements:**
- Product specs stay the same
- Component sources stay consistent
- Valid for up to 12 months',
  'Most SMBs use blanket certificates. It''s way more efficient than certifying every shipment. We set this up automatically!',
  'I have clients shipping weekly from Mexico. They use one blanket certificate per year per product. Saves them HOURS of paperwork!',
  'Working smarter, not harder! That''s the goal. 🚀',
  ARRAY['How do I set up a blanket certificate?', 'When does it expire?', 'What if my product changes?'],
  ARRAY['Generate your blanket certificate', 'Set your validity period'],
  'intermediate',
  NULL
),

-- 14. Accumulation
(
  'Accumulation',
  ARRAY['accumulation', 'combined content', 'add up value', 'multiple countries'],
  'qualification',
  'This rule is AWESOME! Let me explain... 🇨🇦🇲🇽🇺🇸

**Accumulation = You can ADD UP materials from ALL three USMCA countries.**

**Example:**
- 30% parts from Canada
- 35% parts from Mexico
- 5% parts from US
- **Total North American: 70%!** ✅

All three countries count as "North American" under USMCA!

**Why it matters:** You don''t need ALL parts from ONE country. Mix and match across US/Canada/Mexico freely!',
  'This is why it''s called "North American" content, not just "Mexican" or "Canadian" content. All three countries are friends here! 🤝',
  'Had a furniture client: Wood from Canada (40%), Assembly in Mexico (30%), Hardware from US (10%). All three combined = 80% North American. Easy qualification!',
  'See? The rules actually HELP you sometimes! USMCA wants you to succeed. 💪',
  ARRAY['Can I combine multiple countries?', 'What counts as North American?', 'Do I need to source from all three?'],
  ARRAY['Fill out your multi-country components', 'View your combined RVC'],
  'intermediate',
  NULL
),

-- 15. Substantial Transformation
(
  'Substantial Transformation',
  ARRAY['substantial transformation', 'major change', 'manufacturing process', 'value add'],
  'qualification',
  'This is the "Did you REALLY make something?" test. 🔨

**Substantial Transformation = You changed the product significantly enough that it became something NEW.**

**Examples that qualify:**
✅ Imported steel → Made furniture frames
✅ Imported fabric → Sewed into shirts
✅ Imported electronics parts → Assembled computers

**Examples that DON''T qualify:**
❌ Imported finished products → Just repackaged them
❌ Imported widgets → Just relabeled them
❌ Imported food → Just sorted/packaged it',
  'If you''re MANUFACTURING something (cutting, assembling, processing), you''re probably fine. If you''re just repackaging? That won''t work for USMCA.',
  'Had a client importing pre-made jewelry from China, just putting it in boxes in Mexico. That''s NOT substantial transformation. But their competitor who actually MAKES jewelry in Mexico? Totally qualified!',
  'The key question: "Did I ADD significant value?" If yes, you''re good! 🎯',
  ARRAY['How do I know if I transformed it enough?', 'Does assembly count?', 'What about packaging?'],
  ARRAY['Describe your manufacturing process', 'Get AI assessment of your transformation'],
  'advanced',
  NULL
),

-- 16. Drawback
(
  'Drawback',
  ARRAY['drawback', 'duty drawback', 'refund', 'tariff refund'],
  'general',
  'Ooh, this is advanced stuff! Let''s talk refunds... 💰

**Drawback = Getting a REFUND on tariffs you already paid.**

**How it works:**
1. You import parts from China (pay tariffs)
2. You use those parts to make a product
3. You EXPORT that product to another country
4. You apply for drawback = Get your tariffs BACK! 🎉

**USMCA twist:** If you claim USMCA benefits, you usually CAN''T also claim drawback. Pick one!',
  'Most SMBs don''t worry about drawback. It''s extra paperwork for a refund. USMCA''s 0% tariff is usually better than paying first, then getting refunded.',
  'Honestly? In 17 years, I''ve only had a handful of clients use drawback. USMCA is simpler and saves more money for most businesses.',
  'Don''t overthink this one. If you''re using USMCA, you probably don''t need drawback! 👍',
  ARRAY['Should I use drawback or USMCA?', 'Can I use both?', 'How do I apply for drawback?'],
  ARRAY['Focus on USMCA qualification first', 'Talk to a customs broker about drawback'],
  'advanced',
  NULL
),

-- 17. Verification
(
  'Verification',
  ARRAY['verification', 'audit', 'customs check', 'proof', 'documentation'],
  'certificate',
  'Don''t panic! This is just customs doing their job. ✅

**Verification = Customs checking that your certificate is accurate.**

**What happens:**
1. You submit your USMCA certificate
2. Customs MAY ask for proof (component invoices, supplier docs, etc.)
3. You provide the proof
4. Customs approves = You''re good to go!

**How often does this happen?** Honestly, not super often. Maybe 5-10% of certificates get verified.',
  'THIS IS WHY accurate data matters! If customs verifies you and finds errors, you could lose your USMCA benefits AND pay penalties. So let''s get it right the first time! 🎯',
  'I''ve been through dozens of verifications with clients. The ones who kept good records? Smooth sailing. The ones who guessed their numbers? Nightmare. Be the first group!',
  'Keep your component invoices and supplier declarations! You probably won''t need them, but if customs asks, you''ll be ready. 💪',
  ARRAY['What documents do I need to keep?', 'How long should I keep records?', 'What if I can''t prove it?'],
  ARRAY['Save your component invoices', 'Keep supplier declarations on file', 'Maintain accurate records'],
  'advanced',
  NULL
),

-- 18. Importer of Record
(
  'Importer of Record',
  ARRAY['importer of record', 'ior', 'responsible party', 'customs clearance', 'who pays'],
  'general',
  'This is basically "Who''s responsible?" 📋

**Importer of Record = The person/company legally responsible for the import.**

**Why it matters:**
- They pay the tariffs (or claim USMCA benefits)
- They''re responsible for accurate info
- They sign customs documents
- Customs comes to THEM if there''s a problem

**Usually this is:**
- The buyer (if you''re buying from abroad)
- The seller (if arranged)
- A customs broker (acting on your behalf)',
  'If you''re using our platform to qualify for USMCA, you''re probably the Importer of Record. That means YOU benefit from the 0% tariff! 🎉',
  'I work with importers ranging from one-person startups to Fortune 500s. Whether big or small, being the IOR means you control your USMCA benefits.',
  'You got this! Being the Importer of Record just means you''re in charge. And that''s a good thing when it comes to saving money! 💰',
  ARRAY['Am I the importer of record?', 'Can someone else be the IOR?', 'What are my responsibilities?'],
  ARRAY['Review your import responsibilities', 'Set up your company profile'],
  'intermediate',
  NULL
),

-- 19. Preferential Treatment
(
  'Preferential Treatment',
  ARRAY['preferential treatment', 'preferential rate', 'special rate', 'usmca benefits', 'zero duty'],
  'general',
  'This is the whole point! 🎯

**Preferential Treatment = Getting the special USMCA tariff rate (usually 0%) instead of the regular MFN rate.**

It''s called "preferential" because you get PREFERRED treatment at customs.

**To get it:**
1. ✅ Qualify for USMCA (meet RVC threshold + rules)
2. ✅ Have a valid certificate
3. ✅ Submit certificate with your shipment
4. ✅ Claim preferential treatment on customs form
5. 🎉 Pay 0% instead of 10-100%!

**It''s literally checking a box that says:**
"I claim preferential tariff treatment under USMCA"',
  'This checkbox can save you THOUSANDS per shipment. Never forget to claim it! Our certificate makes sure you remember. 📄',
  'I once had a client forget to claim preferential treatment for 3 months. They qualified, had the certificate, but forgot to CHECK THE BOX. Lost $45K! Don''t be that person.',
  'You''re doing all this work to qualify - don''t forget the last step! Claim your benefits! 💪',
  ARRAY['How do I claim preferential treatment?', 'What if I forget?', 'Can I get a refund if I forgot?'],
  ARRAY['Complete your certificate', 'Learn about customs filing'],
  'intermediate',
  NULL
),

-- 20. Non-Originating Materials
(
  'Non-Originating Materials',
  ARRAY['non-originating', 'non-originating materials', 'foreign parts', 'imported components', 'non-qualifying'],
  'qualification',
  'These are the "outsiders" in your product! 🌍

**Non-Originating Materials = Parts/components from OUTSIDE North America (US/Canada/Mexico).**

**Examples:**
- Chinese electronics
- Vietnamese fabric
- German machinery parts
- Brazilian rubber

**Why track them?** USMCA rules say:
"You can have SOME non-originating materials, but not TOO much."

**Typical limits:**
- 30-45% non-originating = Still qualify ✅
- 50%+ non-originating = Might not qualify ❌',
  'Our system tracks this automatically! When you enter "30% from China", we know that''s non-originating. We subtract it from your 100% to calculate your North American content.',
  'Had a client yesterday: 65% Mexico, 25% Canada, 10% China. The China parts are non-originating, but only 10%! So 90% North American = Easy qualification!',
  'Don''t be scared of non-originating materials. A little bit is totally fine! USMCA is realistic about global supply chains. 🌎',
  ARRAY['How much non-originating is OK?', 'Do I need to track every screw?', 'What if most of my parts are non-originating?'],
  ARRAY['Enter your component breakdown', 'See your originating vs non-originating ratio'],
  'intermediate',
  NULL
);
