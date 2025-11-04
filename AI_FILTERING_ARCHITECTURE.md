# AI Filtering Architecture - Two Complementary Systems

**Last Updated:** November 4, 2025

## 🎯 Overview: Why Two AI Filters?

The platform uses **two separate AI filtering systems** that work together to provide both **immediate actionable intelligence** and **long-term strategic context**.

---

## 1️⃣ Portfolio Briefing Filter (Results Dashboard)

### **File:** `/api/generate-portfolio-briefing.js` (Lines 195-295)
### **When It Runs:** User clicks "📊 Re-analyze" button on Results page
### **Cost:** ~$0.02 per briefing (claude-haiku-4.5)

### **Purpose:**
Strategic planning and immediate action guidance - "What should I do about my supply chain RIGHT NOW?"

### **AI Decision Questions:**
- Should I ship this product this week/month?
- Should I change sourcing countries?
- Should I qualify new suppliers?
- Should I lock in pricing now or wait?
- Should I delay shipments or accelerate orders?

### **What It Filters FOR:**
✅ Tariff rate changes affecting user's specific components
✅ CBP rulings impacting compliance requirements
✅ Section 301/232 actions on user's sourcing countries
✅ Trade agreement changes affecting certificate validity
✅ Nearshoring incentives for user's industry

### **What It Filters OUT:**
❌ Earnings reports (not actionable)
❌ Logistics pricing (operational, not strategic)
❌ General news without direct sourcing impact
❌ Alerts affecting industries/countries user doesn't source from

### **Output Format:**
```
STRATEGIC POLICY ALERTS (3 of 15 alerts affect business decisions):

[1] HIGH - US-China trade truce announced
    WHY RELEVANT: Affects sourcing for Microprocessor (ARM-based)
    Impact: 35% of portfolio value
    Details: One-year pause in reciprocal tariffs...

[2] CRITICAL - Section 301 Investigation initiated
    WHY RELEVANT: Affects sourcing for Microprocessor (ARM-based)
    Impact: 35% of portfolio value
    Details: Phase One Agreement compliance review...
```

### **User Experience:**
- Briefing explains exactly WHY each alert matters to THEIR components
- Shows percentage of portfolio affected
- Provides context for immediate decisions

---

## 2️⃣ USMCA 2026 Market Intelligence Filter (Alerts Dashboard)

### **File:** `/api/filter-strategic-alerts.js`
### **When It Runs:** Alerts page loads
### **Cost:** ~$0.01 per page load (claude-haiku-4.5)

### **Purpose:**
Policy landscape awareness and forward-looking signals - "What's happening in trade policy that I should monitor?"

### **Four Objectives:**
1. 📊 **Policy Landscape Awareness** - What's the current trade environment?
2. 🔮 **Forward-Looking Signals** - What might affect USMCA 2026 renegotiation?
3. 🌍 **Geopolitical Context** - What trade shifts are happening globally?
4. 📧 **Email-Worthy Intelligence** - What should users be notified about?

### **AI Decision Questions:**
- What's changing in US/Canada/Mexico trade relations?
- Are there signals about USMCA 2026 renegotiation priorities?
- What alternative sourcing regions are emerging?
- What legislative/executive trade actions are happening?
- Are there policy shifts that could affect certificate validity?
- Should I be preparing for rule changes in 12-24 months?

### **What It Filters FOR:**
✅ USMCA 2026 renegotiation developments
✅ Legislative/executive trade policy changes
✅ USTR diplomatic meetings (signals about trade direction)
✅ Nearshoring/reshoring trends tied to policy
✅ Trade agreement developments (bilateral deals, frameworks)
✅ CBP guidance affecting certificate compliance
✅ Supply chain realignments driven by trade policy

### **What It Filters OUT:**
❌ Earnings reports (financial performance)
❌ Logistics pricing (freight rates, capacity)
❌ Carrier operations (fleet orders, terminals)
❌ Individual business decisions (warehouse expansions)
❌ Non-trade regulatory topics (patents, immigration)
❌ General market news without policy implications

### **Output Format:**
```
🇺🇸🇨🇦🇲🇽 USMCA 2026 Renegotiation & Market Intelligence
All Users | 8 insights

📅 USMCA 2026 Renegotiation: The USMCA agreement is up for review in 2026...

🎯 Affects your Microprocessor (ARM-based) sourcing
US, China clinch one-year trade truce, cut tariffs in rare earth deal
high
The U.S. and China have agreed to a one-year trade truce...
🗓 2025-11-04

Senate rejection of Trump's tariffs stirs North American trade debate
high
The U.S. Senate's bipartisan vote to roll back President Donald Trump's...
🗓 2025-11-04
```

### **User Experience:**
- Shows macro trade policy landscape
- Provides context for USMCA 2026 preparation
- Identifies which components are affected (🎯 badges)
- Email notification opt-in for strategic awareness

---

## 📊 Side-by-Side Comparison

| Aspect | Portfolio Briefing Filter | USMCA 2026 Market Intelligence |
|--------|---------------------------|-------------------------------|
| **Location** | Results Dashboard | Alerts Dashboard |
| **Trigger** | Button click ("📊 Re-analyze") | Page load |
| **Frequency** | On-demand | Every visit |
| **Time Horizon** | Immediate (1-3 months) | Forward-looking (12-24 months) |
| **Focus** | Actionable decisions | Strategic awareness |
| **Personalization** | Highly specific to components | Context-aware (shows relevance) |
| **Output** | 3-5 critical alerts with WHY | 8-15 policy landscape alerts |
| **Question Answered** | "What should I do NOW?" | "What should I monitor?" |
| **Cost** | ~$0.02 per analysis | ~$0.01 per page load |

---

## 🔄 How They Work Together

### **Example: "US-China Trade Truce Announced"**

**Portfolio Briefing Filter (Results):**
```
✅ INCLUDES - HIGH PRIORITY
WHY: Directly affects your China microprocessor sourcing (35% of portfolio)
ACTION: Consider whether to accelerate orders during truce period
```

**Market Intelligence Filter (Alerts):**
```
✅ INCLUDES - STRATEGIC CONTEXT
WHY: Signals broader US-China trade relations
CONTEXT: May affect USMCA 2026 negotiations (China alternative sourcing)
```

### **Example: "Cosco Q3 Earnings Drop 56%"**

**Portfolio Briefing Filter:**
```
❌ EXCLUDES
REASON: Earnings report, not policy change affecting sourcing decisions
```

**Market Intelligence Filter:**
```
❌ EXCLUDES
REASON: Financial news without trade policy implications
```

---

## 💡 User Feedback Alignment

**Adam Williams (LinkedIn):**
> "Would real-time policy alerts be something you're looking to add?"

**Answer:** ✅ YES - Two systems provide this:
1. Portfolio briefing shows alerts affecting YOUR components
2. Market intelligence shows broader policy landscape

**Anthony Robinson (LinkedIn):**
> "Ever thought about adding live customs updates?"

**Answer:** ✅ YES - Both systems include:
1. CBP rulings in portfolio briefing (immediate compliance)
2. CBP guidance in market intelligence (long-term trends)

**Julie MacArthur (LinkedIn response):**
> "I'm also thinking of developing a few more apps that complements this one, all focused on helping SMB react and pivot quickly."

**Delivered:** ✅ Two-tier alert system enables both:
- **React quickly** (portfolio briefing - immediate actions)
- **Pivot strategically** (market intelligence - long-term planning)

---

## 🎯 Design Philosophy

**Why Not One Filter?**

❌ Single filter would need to balance contradictions:
- Immediate vs long-term relevance
- Specific vs general context
- Actionable vs awareness

✅ Two filters enable specialization:
- Portfolio briefing: NARROW and DEEP (your specific situation)
- Market intelligence: BROAD and CONTEXTUAL (policy landscape)

**Result:** Users get both precision and perspective.

---

## 🚀 Future Enhancements

### Portfolio Briefing Filter:
- [ ] Add cost impact calculations ($X savings if you switch suppliers)
- [ ] Historical alert tracking (when did we first see this signal?)
- [ ] Comparison to peer companies in same industry

### Market Intelligence Filter:
- [ ] Predictive scoring (likelihood USMCA 2026 will include this topic)
- [ ] Expert commentary integration (what trade lawyers are saying)
- [ ] Historical pattern matching (similar situations in past negotiations)

---

**Last Review:** November 4, 2025
**Status:** Both filters active and production-ready
**Performance:** <2s response time for both filters
