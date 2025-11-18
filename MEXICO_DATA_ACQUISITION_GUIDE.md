# Mexico Tariff Data Acquisition Guide

**Status:** 🟡 2026 LIGIE Reform Pending Approval (Expected: Dec 15, 2025)
**Current:** 2025 LIGIE Schedule Available

---

## 📊 Overview

Mexico's tariff schedule (LIGIE - Ley de los Impuestos Generales de Importación y Exportación) is undergoing reform for 2026. The new schedule proposes increases across 1,463 product classifications.

**Timeline:**
- **Now - Dec 15, 2025**: Current schedule (2025) available, 2026 pending congressional approval
- **Jan 1, 2026**: New schedule expected to take effect (if approved)

---

## 🎯 Three Ways to Acquire Mexican Tariff Data

### Option 1: Manual Download from SNICE (Recommended for Initial Seed)

**Best for:** One-time bulk import of current schedule

#### Steps:

1. **Visit SNICE Official Website:**
   ```
   https://www.snice.gob.mx/cs/avi/snice/ligie.info22.html
   ```

2. **Download Files:**
   - **LIGIE Unified PDF:** `LIGIE-UNIFICADA-LIGIE_20250728-20250728.pdf`
   - **Correlation Excel:** `TABLASDECORRELACION-MARZO24-LIGIE_20240404-20240404.xlsx`

3. **Convert PDF to Excel** (if needed):
   - Use online tools: https://www.ilovepdf.com/pdf_to_excel
   - Or Adobe Acrobat
   - Or Python tabula-py library

4. **Run Import Script:**
   ```bash
   node scripts/import-mexico-excel.js ./downloads/LIGIE-2025.xlsx
   ```

#### Expected Excel Format:
| Fracción | Descripción | IGI General | T-MEC |
|----------|-------------|-------------|-------|
| 8542.31.00 | Procesadores | 3.9 | Ex |
| 7616.99.50 | Aluminio | 1.5 | Ex |

**Note:** "Ex" or "Exento" = 0% (duty-free)

---

### Option 2: SIAVI API Scraping (Automated, Slower)

**Best for:** Systematic collection from official API

#### How It Works:
- Queries SIAVI API for each HS code
- Rate: ~2 requests/second (respectful rate limiting)
- Time: ~2-3 hours for 12,000 codes

#### Run:
```bash
# Dry run first (tests 3 codes only)
node scripts/seed-mexico-tariffs.js --dry-run

# Full run (all 12,118 US codes)
node scripts/seed-mexico-tariffs.js

# Limited test (first 100 codes)
node scripts/seed-mexico-tariffs.js --limit 100

# Resume from specific position
node scripts/seed-mexico-tariffs.js --start 5000
```

#### SIAVI API Details:
- **Base URL:** http://siavi.economia.gob.mx/siavi5r/aranceles.php
- **Query:** `?fraccion=85423100`
- **Response:** HTML page (requires parsing)
- **Rate Limit:** No official limit, but be respectful (2/s)

---

### Option 3: Contact SAT Directly

**Best for:** Official data partnership, bulk access

#### Contact:
```
Email: nueva.ligie@economia.gob.mx
Subject: Request for LIGIE 2026 tariff schedule data (CSV/Excel format)
```

#### What to Ask:
- Official 2026 LIGIE schedule in structured format (CSV/Excel/JSON)
- PROSEC program rates (22 sector-specific programs)
- IMMEX/Maquiladora rates
- Scheduled update frequency

#### Advantages:
- Most accurate
- May get structured data directly
- Possible API access
- Official partnership

---

## 🔄 Keeping Data Current

### DOF Monitoring (Already Implemented)

Our DOF scraper automatically polls for tariff announcements:

```javascript
// lib/scrapers/dof-tariff-scraper.js
const scraper = new DOFTariffScraper();
await scraper.poll(); // Detects changes, logs to database
```

**RSS Feed:** https://www.dof.gob.mx/rss/dof.xml

**Cron Job** (Ready to Activate):
- Endpoint: `/api/cron/poll-dof-tariffs`
- Schedule: Daily at 9 AM Mexico City time
- Action: Detect rate changes, log to `tariff_changes_log_international`

---

## 📦 Database Schema

```sql
-- Mexican tariff rates
CREATE TABLE tariff_rates_mexico (
  id UUID PRIMARY KEY,
  hs_code TEXT NOT NULL,
  description TEXT,
  mfn_rate NUMERIC(10,4),     -- Mexican MFN (IGI General)
  usmca_rate NUMERIC(10,4),   -- T-MEC preferential
  prosec_rate NUMERIC(10,4),  -- PROSEC program
  effective_date DATE DEFAULT '2026-01-01',
  source TEXT DEFAULT 'DOF',
  source_url TEXT,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(hs_code, effective_date)
);
```

---

## 🚀 Quick Start (Choose One)

### Method A: Manual Download + Import (Fastest Initial Setup)

```bash
# 1. Download Excel from SNICE
# 2. Place in ./downloads/ folder
# 3. Import
node scripts/import-mexico-excel.js ./downloads/LIGIE-2025.xlsx

# Expected output:
# ✅ Imported 12,000+ tariff rates
# ⏱️  Time: ~30 seconds
```

### Method B: SIAVI API Scraping (Automated)

```bash
# Test first 100 codes
node scripts/seed-mexico-tariffs.js --limit 100

# If successful, run full
node scripts/seed-mexico-tariffs.js

# Expected output:
# ✅ Success: 10,500+
# ⚠️  Not found: 1,500
# ⏱️  Time: 2-3 hours
```

---

## 🎯 Data Quality Expectations

| Source | Coverage | Accuracy | Freshness | Speed |
|--------|----------|----------|-----------|-------|
| **SNICE Excel** | 95-98% | Official | Current 2025 | Minutes |
| **SIAVI API** | 85-90% | Official | Real-time | Hours |
| **SAT Direct** | 100% | Official | Latest | Depends |
| **DOF Scraping** | N/A | Official | 24-hour lag | Daily |

**Recommendation:** Start with SNICE Excel for bulk seed, then activate DOF monitoring for updates.

---

## ⚠️ Known Issues & Limitations

### 1. 2026 Schedule Not Final
- Pending congressional approval (deadline: Dec 15, 2025)
- Rates may change before Jan 1, 2026 effective date
- Monitor DOF for final publication

### 2. PROSEC Rates Not Complete
- 22 sector-specific programs (automotive, electronics, etc.)
- Rates vary by industry and component
- May require separate acquisition

### 3. SIAVI Rate Limiting
- No official API, relies on web scraping
- HTML structure may change without notice
- Be respectful: 2 requests/second maximum

### 4. HS Code Format Differences
- Mexico uses 8-digit (soon 10-digit) codes
- US uses 10-digit HTS codes
- Mapping required for correlation

---

## 🧪 Testing After Seed

```bash
# 1. Check row count
SELECT COUNT(*) FROM tariff_rates_mexico;
# Expected: 10,000-12,000

# 2. Sample rates
SELECT hs_code, description, mfn_rate, usmca_rate
FROM tariff_rates_mexico
WHERE mfn_rate > 0
LIMIT 10;

# 3. Test comparative API
node scripts/test-mexico-comparison.js
```

---

## 📚 Official Resources

| Resource | URL | Purpose |
|----------|-----|---------|
| **SNICE** | https://www.snice.gob.mx | Official tariff downloads |
| **SIAVI** | http://siavi.economia.gob.mx | Online tariff lookup |
| **DOF** | https://www.dof.gob.mx | Federal gazette (announcements) |
| **SAT** | https://www.sat.gob.mx | Tax authority (official data) |
| **Secretaría de Economía** | https://www.gob.mx/se | Ministry of Economy |

---

## 🆘 Troubleshooting

### "Excel file columns not recognized"
- Check column headers match expected names
- Try renaming: "Fracción" → "Fraccion" (no accent)
- Ensure first row has headers

### "SIAVI timeout errors"
- Reduce rate limit in script (line 89: `await this.sleep(1000);` = 1/s)
- Try during off-peak hours (Mexico 2-5 AM = US 4-7 AM EST)
- Check internet connection stability

### "Database foreign key errors"
- Ensure `tariff_rates_mexico` table created (migration deployed)
- Check `effective_date` format (YYYY-MM-DD)

### "Empty descriptions"
- Some codes may lack Spanish descriptions
- Script uses US descriptions as fallback
- Edit manually in database if needed

---

## 📞 Support Contacts

**Technical Issues:**
- Email: nueva.ligie@economia.gob.mx (SAT)

**Integration Questions:**
- Project: Mac (macproductions010@gmail.com)

**2026 Reform Updates:**
- Monitor: https://www.dof.gob.mx
- Search: "LIGIE" or "arancel"

---

## ✅ Next Steps After Seeding

1. **Verify row count** (expect 10,000-12,000)
2. **Test comparative API** (`node scripts/test-mexico-comparison.js`)
3. **Clean up sample data** (`SELECT cleanup_sample_data();`)
4. **Activate DOF polling cron** (Phase 3)
5. **Update UI** (Add "Compare with Mexico" checkbox)

---

**Status:** Ready to seed with Method A or B
**Recommendation:** Start with SNICE Excel download (fastest, most complete)
**Timeline:** 30 minutes to 3 hours depending on method

