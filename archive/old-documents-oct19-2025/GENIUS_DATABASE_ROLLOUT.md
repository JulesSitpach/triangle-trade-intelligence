# 🧠 GENIUS DATABASE - Rollout Plan

**Goal**: Every AI call saves results to build a self-improving knowledge base over time

**Status**: ✅ Infrastructure created (tables + helper functions)

---

## 📋 Integration Checklist (34 AI Endpoints)

### ✅ COMPLETED (1/34)
- [x] `ai-usmca-complete-analysis.js` - Tariff rate saving already implemented

### 🔄 IN PROGRESS - High Priority (Core Intelligence)

#### HS Code Classifications (5 endpoints)
- [ ] `ai-classification-report.js` → saveToGeniusDB.classification()
- [ ] `generate-hs-classification-report.js` → saveToGeniusDB.classification()
- [ ] `ai-certificate-generation.js` → saveToGeniusDB.classification()
- [ ] `regenerate-usmca-certificate.js` → saveToGeniusDB.classification()
- [ ] `generate-usmca-certificate-report.js` → saveToGeniusDB.classification()

#### Supplier Intelligence (4 endpoints)
- [ ] `supplier-sourcing-discovery.js` → saveToGeniusDB.supplier()
- [ ] `openrouter-supplier-search.js` → saveToGeniusDB.supplier()
- [ ] `anthropic-supplier-search.js` → saveToGeniusDB.supplier()
- [ ] `generate-supplier-sourcing-report.js` → saveToGeniusDB.supplier()

#### Crisis & Alerts (5 endpoints)
- [ ] `ai-vulnerability-alerts.js` → saveToGeniusDB.crisis()
- [ ] `consolidate-alerts.js` → saveToGeniusDB.crisis()
- [ ] `ai-crisis-discovery.js` → saveToGeniusDB.crisis()
- [ ] `crisis-response-analysis.js` → saveToGeniusDB.crisis()
- [ ] `generate-crisis-response-report.js` → saveToGeniusDB.crisis()

#### USMCA Qualification Research (4 endpoints)
- [ ] `usmca-compliance-risk-analysis.js` → saveToGeniusDB.usmcaQualification()
- [ ] `usmca-roadmap-generation.js` → saveToGeniusDB.usmcaQualification()
- [ ] `usmca-document-analysis.js` → saveToGeniusDB.usmcaQualification()
- [ ] `generate-trade-health-analysis.js` → saveToGeniusDB.usmcaQualification()

#### Manufacturing Intelligence (2 endpoints)
- [ ] `manufacturing-feasibility-analysis.js` → saveToGeniusDB.manufacturing()
- [ ] `generate-manufacturing-feasibility-report.js` → saveToGeniusDB.manufacturing()

#### Market Intelligence (2 endpoints)
- [ ] `market-entry-analysis.js` → saveToGeniusDB.market()
- [ ] `generate-market-entry-report.js` → saveToGeniusDB.market()

#### Document Extraction (1 endpoint)
- [ ] `extract-pdf-content.js` → saveToGeniusDB.document()

### 📊 REPORTS & CHAT (Don't Save - One-off)
- [ ] `enhanced-claude-report.js` - Report only (uses saved data)
- [ ] `broker-chat.js` - Chat responses (conversational)
- [ ] `ai-trade-advisor.js` - Advisory (uses saved data)
- [ ] `personalized-alert-analysis.js` - Report only
- [ ] `usmca-client-communication.js` - Communication only

### 🔧 SUPPORT & ADMIN (Lower Priority)
- [ ] `ai-support-discovery.js` - Support responses
- [ ] `admin/ai-synthesis.js` - Admin synthesis
- [ ] `ai-document-discovery.js` - Discovery phase
- [ ] `ai-market-entry-discovery.js` - Discovery phase
- [ ] `ai-supplier-discovery.js` - Discovery phase
- [ ] `ai-manufacturing-discovery.js` - Discovery phase

---

## 🚀 How To Integrate (5-Line Template)

### Example: Add to supplier-sourcing-discovery.js

```javascript
import saveToGeniusDB from '../../lib/ai/saveAIToGeniusDB.js';

// ... existing AI call ...
const aiResult = await fetch('https://openrouter.ai/...');
const suppliers = aiResult.data.suppliers;

// 💾 NEW: Save each supplier to genius database (non-blocking)
suppliers.forEach(supplier => {
  saveToGeniusDB.supplier({
    supplier_name: supplier.name,
    country: supplier.country,
    industry_sector: supplier.industry,
    products_offered: supplier.products,
    usmca_compliant: supplier.usmca_qualified,
    reliability_score: supplier.score,
    ai_confidence: 85,
    source_analysis: 'supplier-sourcing-discovery'
  }).catch(err => console.error('DB save failed:', err.message));
});

return res.status(200).json({ success: true, suppliers });
```

### Pattern For All Endpoints:

1. **Import helper**: `import saveToGeniusDB from '../../lib/ai/saveAIToGeniusDB.js';`
2. **After AI success**: Call appropriate save function
3. **Non-blocking**: Use `.catch()` to prevent failures
4. **Continue normally**: Don't wait for DB save

---

## 📈 Expected Growth Timeline

### Month 1 (November 2025)
- **HS Codes**: 1,000 codes with Oct 2025 tariff rates
- **Suppliers**: 200 Mexico suppliers with USMCA compliance data
- **Crisis Alerts**: 50 active trade policy changes tracked
- **USMCA Rules**: 20 product category qualification thresholds

### Month 3 (January 2026)
- **HS Codes**: 5,000 codes with current tariff rates
- **Suppliers**: 800 North American suppliers
- **Crisis Alerts**: 150 policy changes tracked
- **USMCA Rules**: 60 product categories documented

### Month 6 (April 2026)
- **HS Codes**: 15,000 codes (approaching comprehensive coverage)
- **Suppliers**: 2,000+ suppliers across North America
- **Crisis Alerts**: 300+ policy changes with resolution strategies
- **USMCA Rules**: 150+ product categories
- **Manufacturing Sites**: 100+ feasibility assessments
- **Market Insights**: 50+ market entry analyses

---

## 🎯 When To Trust Database Over AI

**Current (Oct 2025)**: 100% AI-first (database is learning)

**Future Decision Points**:

### Tariff Rates (ai_classifications)
- **Trust Database When**: Record updated within 7 days + confidence >90%
- **Still Use AI When**: No record OR >7 days old OR confidence <90%
- **Estimated Timeline**: February 2026 (4 months of data)

### Supplier Intelligence
- **Trust Database When**: Record updated within 30 days + verified=true
- **Still Use AI When**: New supplier discovery requests
- **Estimated Timeline**: March 2026 (need human verification process)

### USMCA Qualification Rules
- **Trust Database When**: Record exists + verified=true
- **Still Use AI When**: Product category not in database
- **Estimated Timeline**: January 2026 (2 months to cover common categories)

### Crisis Alerts
- **ALWAYS USE AI**: Trade policy changes daily, database for historical context only
- **Database Role**: Show policy evolution timeline

---

## 🔍 Genius Database Admin Dashboard

**Create new admin page**: `/admin/genius-database`

**Features**:
1. **Stats Overview**: Query `genius_database_stats` view
2. **Verification Queue**: Show unverified AI results for Cristina/Jorge review
3. **Confidence Analysis**: Chart showing AI confidence distribution
4. **Growth Metrics**: Records added per week/month
5. **Coverage Gaps**: Identify common HS codes missing from database

**Query Example**:
```sql
-- Show database growth
SELECT * FROM genius_database_stats ORDER BY total_records DESC;

-- Show low-confidence items needing review
SELECT hs_code, component_description, confidence, last_updated
FROM ai_classifications
WHERE verified = false AND confidence < 80
ORDER BY last_updated DESC
LIMIT 50;
```

---

## 💰 Cost Impact

### Current (100% AI)
- 500 workflows/month × $0.03/workflow = **$15/month**

### After Genius Database (Month 3)
- 500 workflows/month
- 60% tariff cache hit (from database)
- Effective cost: 40% × $15 = **$6/month**
- **Savings: $9/month (60% reduction)**

### After Genius Database (Month 6)
- 500 workflows/month
- 85% tariff cache hit (from database)
- Effective cost: 15% × $15 = **$2.25/month**
- **Savings: $12.75/month (85% reduction)**

---

## ✅ Next Steps

1. **Run migration**: Execute `create_genius_database_tables.sql` on Supabase
2. **Test save helper**: Verify `saveAIToGeniusDB.js` works with existing endpoint
3. **Roll out Phase 1**: Integrate 5 high-priority endpoints (classifications, suppliers, crisis)
4. **Monitor growth**: Check `genius_database_stats` view weekly
5. **Build admin dashboard**: Create verification interface for Cristina/Jorge
6. **Decide transition**: Set database freshness thresholds (Feb-Mar 2026)

---

**The database gets smarter with every AI call. In 6 months, you'll have the most comprehensive North American trade intelligence database ever built.** 🧠✨
