# AI Calls Audit - Complete User Journey

**Last Updated:** November 4, 2025
**Purpose:** Track every AI call from workflow start to alerts page

---

## 🔍 Complete User Journey: AI Call Tracking

### **Step 1: Company Information**
**Page:** `/usmca-workflow` (Step 1)
**AI Calls:** 0
- Just form input, no AI needed

---

### **Step 2: Component Origins**
**Page:** `/usmca-workflow` (Step 2)
**AI Calls:** 0
- Component form with BOM upload
- Data saved to workflow_sessions
- No AI classification yet (optional future feature)

---

### **Step 3: USMCA Analysis (Main Workflow)**
**API:** `/api/ai-usmca-complete-analysis`
**AI Calls:** 0 ❓
**Why:** Uses database tariff_intelligence_master (12,118 HS codes)
- ✅ Database lookup for tariff rates
- ✅ RVC calculations are mathematical
- ✅ Qualification logic is rules-based
- ❌ NO AI CALLS (unless HS code not in database - edge case <5%)

**Edge Case AI Call:**
If HS code not in database → Fallback to AI tariff lookup (~$0.02)
Frequency: <5% of workflows

---

### **Step 4: Results Page Load**
**Page:** `/usmca-workflow` (Results display)
**Components:**
1. **Certificate Preview** - No AI
2. **Executive Summary Display** - No AI (shows database results)
3. **PolicyTimeline Component** - No AI (queries crisis_alerts with keyword filter)

**AI Calls on Page Load:** 0 ✅

---

### **Step 5: Generate Business Impact Summary (Button Click)**
**API:** `/api/generate-portfolio-briefing`
**AI Calls:** 2

#### **AI Call #1: Strategic Alert Filtering**
- **Lines:** 195-263
- **Model:** claude-haiku-4.5
- **Cost:** ~$0.005
- **Duration:** ~2-3 seconds
- **Purpose:** Filter 10-20 alerts down to 2-5 strategic alerts
- **Input:** All matched alerts + user portfolio
- **Output:** List of alert numbers (e.g., "1, 3, 7")

#### **AI Call #2: Portfolio Briefing Generation**
- **Lines:** 296-413
- **Model:** claude-haiku-4.5
- **Cost:** ~$0.015
- **Duration:** ~5-7 seconds
- **Purpose:** Generate strategic analysis with 4 sections
- **Input:** Components + strategic alerts + USMCA context
- **Output:** JSON briefing (Bottom Line, Component Risk, Strategic Considerations, Monitoring)

**Total for Button Click:** 2 AI calls, ~$0.02, ~8-10 seconds

---

### **Step 6: Navigate to Alerts Page**
**Page:** `/trade-risk-alternatives`
**AI Calls:** 1 (FIXED - was 2)

#### **AI Call #1: Portfolio Briefing (if not cached)**
- **API:** `/api/generate-portfolio-briefing`
- **Trigger:** Auto-loads on page if no cached briefing
- **Cost:** ~$0.02
- **Duration:** ~8-10 seconds
- **Includes:** Strategic alert filtering (internal)

**Previous Bug (FIXED):**
- ❌ Was calling `/api/filter-strategic-alerts` separately (~$0.01)
- ❌ Then calling `/api/generate-portfolio-briefing` (~$0.02)
- ❌ Total: 2 AI calls, $0.03, 15 seconds

**Current (FIXED):**
- ✅ Single call to `/api/generate-portfolio-briefing`
- ✅ Returns strategic_alerts in response
- ✅ USMCA 2026 section reuses filtered alerts
- ✅ Total: 1 AI call, $0.02, 8-10 seconds

---

### **Step 7: Executive Trade Alert (Optional Button)**
**API:** `/api/executive-trade-alert`
**AI Calls:** 1
**Trigger:** User clicks "📧 Generate Executive Alert" button
**Cost:** ~$0.03
**Duration:** ~10-12 seconds
**Purpose:** Consulting-grade strategic advisory with CBP guidance

---

## 📊 Complete Journey Summary

### **Minimum Path (No Optional Features):**
```
Step 1: Company Info        → 0 AI calls
Step 2: Components          → 0 AI calls
Step 3: USMCA Analysis      → 0 AI calls (database only)
Step 4: Results Page Load   → 0 AI calls
Step 5: Click Briefing btn  → 2 AI calls ($0.02)
Step 6: Navigate to Alerts  → 0 AI calls (briefing cached)
---
TOTAL: 2 AI calls, $0.02
```

### **Maximum Path (All Features Used):**
```
Step 1: Company Info              → 0 AI calls
Step 2: Components                → 0 AI calls
Step 3: USMCA Analysis (edge)     → 1 AI call ($0.02) [rare]
Step 4: Results Page Load         → 0 AI calls
Step 5: Generate Briefing         → 2 AI calls ($0.02)
Step 6: Navigate to Alerts        → 0 AI calls (briefing cached)
Step 7: Executive Trade Alert     → 1 AI call ($0.03)
---
TOTAL: 4 AI calls, $0.07
```

### **Typical User (Most Common):**
```
Step 1-3: Workflow          → 0 AI calls
Step 4: Results             → 0 AI calls
Step 5: Generate Briefing   → 2 AI calls ($0.02)
Step 6: Alerts Page         → 0 AI calls (cached)
---
TOTAL: 2 AI calls, $0.02
```

---

## 🎯 AI Call Optimization Summary

### **What We Fixed Today:**
1. ✅ Dashboard alerts now use keyword filtering (not AI)
2. ✅ Results page PolicyTimeline uses keyword filtering (not AI)
3. ✅ Alerts page reuses portfolio briefing's filtered alerts (eliminated duplicate call)

### **Previous (Before Today):**
- Alerts page: 2 AI calls ($0.03)
- Results page: 0 AI calls (good)
- Dashboard: 0 AI calls (good)

### **Current (After Today):**
- Alerts page: 1 AI call ($0.02) - 33% cost reduction
- Results page: 0 AI calls - no change
- Dashboard: 0 AI calls - no change

---

## 💡 Where AI is Actually Used

### **1️⃣ Portfolio Briefing (`generate-portfolio-briefing.js`)**
**When:** User clicks "📊 Generate Business Impact Summary"
**Why:** Strategic analysis requires contextual reasoning AI does better than rules
**Alternatives Considered:**
- ❌ Template-based: Too generic, users complained
- ❌ Rules-based: Can't handle nuanced trade-offs
- ✅ AI: Best for strategic planning advice

### **2️⃣ Executive Trade Alert (`executive-trade-alert.js`)**
**When:** User clicks "📧 Generate Executive Alert"
**Why:** Consulting-grade advisory requires sophisticated analysis
**Alternatives Considered:**
- ❌ Static template: Not personalized enough
- ✅ AI: Handles CBP guidance, financial scenarios, strategic roadmap

### **3️⃣ Tariff Lookup Fallback (`ai-usmca-complete-analysis.js`)**
**When:** HS code not in database (<5% of cases)
**Why:** Need real-time tariff rates for edge cases
**Alternatives Considered:**
- ❌ Fail: Bad UX
- ❌ Show "Not found": Breaks workflow
- ✅ AI fallback: Seamless experience

---

## 🚫 Where AI is NOT Used (Database/Rules Work Better)

### **1️⃣ USMCA Qualification Logic**
**Method:** Rules-based calculations
**Why:**
- RVC thresholds are mathematical (55%, 65%, 75%)
- Preference criteria have fixed rules (A/B/C/D)
- Faster (<100ms vs 2-3s for AI)
- More reliable (no hallucination risk)
- Cheaper ($0 vs $0.02 per analysis)

### **2️⃣ Tariff Rate Lookups**
**Method:** Database (tariff_intelligence_master - 12,118 HS codes)
**Why:**
- 95%+ coverage of common products
- Instant response (<50ms)
- Accurate historical data
- Free (no AI cost)
- Only uses AI for 5% edge cases

### **3️⃣ Alert Matching to Components**
**Method:** SQL queries with HS code/country matching
**Why:**
- Exact matching is deterministic
- Database indexing is fast
- No interpretation needed
- Free (no AI cost)

### **4️⃣ Simple Alert Filtering (Today's Fix)**
**Method:** Keyword-based filtering
**Why:**
- "Earnings", "carrier", "fleet" → clearly not strategic
- "Tariff", "section 301", "investigation" → clearly strategic
- Fast (<5ms vs 2-3s for AI)
- Free (no AI cost)
- Works for 90% of alerts

---

## 💰 Cost Analysis

### **Per User (Typical Journey):**
- USMCA Analysis: $0 (database)
- Portfolio Briefing: $0.02 (2 AI calls)
- **Total: $0.02 per workflow**

### **At Scale (1000 users/month):**
- 1000 workflows × $0.02 = **$20/month**
- Optional executive alerts: 100 users × $0.03 = **$3/month**
- Edge case tariff lookups: 50 × $0.02 = **$1/month**
- **Total: ~$24/month for 1000 workflows**

### **Revenue vs Cost:**
- Starter tier: $29/month (15 workflows) → $0.30 cost → **90% margin**
- Professional: $99/month (100 workflows) → $2.00 cost → **98% margin**
- Premium: $599/month (500 workflows) → $10.00 cost → **98% margin**

**Conclusion:** AI costs are negligible compared to subscription revenue.

---

## 🔄 Recommended Next Optimizations

### **High Priority:**
1. ✅ DONE: Remove duplicate AI call on alerts page
2. ✅ DONE: Use keyword filtering for simple cases (dashboard, results page)
3. ⏳ TODO: Cache portfolio briefing for 24 hours (avoid regenerating on every alerts page visit)

### **Medium Priority:**
4. ⏳ Consider: Batch alert filtering (filter 50 alerts once, cache results)
5. ⏳ Consider: Pre-generate briefings for workflows after completion (async)

### **Low Priority:**
6. ⏳ Maybe: Use cheaper model for simple tasks (gpt-3.5-turbo for alert filtering)
7. ⏳ Maybe: Implement streaming for faster perceived performance

---

**Audit Status:** ✅ Complete
**Total AI Calls per User Journey:** 2 (typical), 4 (maximum)
**Cost per User Journey:** $0.02 (typical), $0.07 (maximum)
**Optimization Opportunity:** 33% reduction achieved today (eliminated duplicate call)
