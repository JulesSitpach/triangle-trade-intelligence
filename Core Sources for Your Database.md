https://wits.worldbank.org/data/public/WITSAPI_UserGuide.pdf

You’re asking whether the World Bank’s **WITS API User Guide** (the PDF you linked) can help you retrieve **HS codes**—in other words, whether it provides those codes or guides you in getting them. The answer is **yes**, but let's unpack how:

---

### What the WITS API User Guide Explains

1. **Product Codes = HS codes**
   The guide refers to **Product Code: 6-digit HS code. Refer metadata section for list of product Codes and descriptions** ([World Integrated Trade Solution][1], [Studocu][2]). That means the API expects product codes that correspond to HS-6 codes and provides metadata listing those codes.

2. **Metadata Endpoints for HS Codes**

   * There are API endpoints specifically for retrieving metadata, including product codes (the HS codes) and their descriptions ([Studocu][2], [World Integrated Trade Solution][3]).
   * The “metadata section” referenced in the guide includes lists of product codes and descriptions for HS codes ([World Integrated Trade Solution][1], [Studocu][2]).

3. **Reference Data Page on the WITS Site**
   Separately, the WITS website includes a **Reference Data** section where you can download HS nomenclatures and codes in Excel or ZIP formats—this is especially useful for offline browsing or mapping products to HS codes ([World Integrated Trade Solution][4]).

4. **Product Concordances**
   If you need to convert between different product classification systems (e.g., HS to SITC or others), WITS also offers **concordance tables** to help map between nomenclatures ([World Integrated Trade Solution][5]).

---

### So, can the guide help with HS codes?

**Yes**—here’s how:

* It **documents API endpoints** to fetch metadata that includes HS codes and descriptions.
* Using the API, you can programmatically query for HS codes supported:

  * You request product metadata (via API).
  * The API returns product codes (HS-6) and their descriptions.
* You’ll need to pull this metadata (often via endpoints like `/nomenclature` or `/product`) to get the HS codes list.

---

### How to Actually Retrieve HS Codes via API

#### **1. Use metadata endpoints**

The user guide suggests endpoints such as:

* URL-based queries:

  ```
  https://wits.worldbank.org/API/V1/WITS/datasource/trn/nomenclature/…
  ```
* SDMX queries:

  ```
  https://wits.worldbank.org/API/V1/SDMX/V21/rest/…
  ```

  You’d replace the “…” with appropriate parameters like “ALL” or specific nomenclature codes to retrieve metadata about product classifications ([Studocu][2], [World Integrated Trade Solution][3]).

#### **2. Use the Reference Data section on the website**

If you're not using the API or want a ready-made list:

* Go to the **Reference Data** → **HS Products** section on the WITS site.
* Download the list of HS codes and their descriptions in Excel or zip formats ([World Integrated Trade Solution][4]).

#### **3. Use external tools/libraries for convenience**

If you're coding:

* **Python package**: [`world_trade_data`](https://github.com/mwouts/world_trade_data) lets you retrieve lists of products including their codes directly ([GitHub][6]).
* **R package**: [`witstrainsr`](https://github.com/diegoacastro/witstrainsr) provides functions to get tariffs and metadata, including HS codes ([GitHub][7]).

---

### Summary Table

| What You Want                          | How WITS Handles It                                                                                        |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| List of HS-6 codes & descriptions      | Available via metadata APIs and downloadable reference data ([World Integrated Trade Solution][1])         |
| Programmatic access via API            | Yes—use metadata endpoints (`nomenclature`, `product`, etc.) as described in the User Guide ([Studocu][2]) |
| Mapping between classification systems | Use Product Concordance on WITS site ([World Integrated Trade Solution][5])                                |
| Convenience libraries in Python/R      | Yes—`world_trade_data` (Python) and `witstrainsr` (R) support HS code access ([GitHub][6])                 |

---

### Final Takeaway

The **WITS API User Guide** is indeed helpful for obtaining HS codes—it documents how to access metadata endpoints for product classifications and their descriptions. Additionally, WITS provides downloadable reference data and concordances for offline use, and there are even programming libraries to streamline this process in Python or R. Let me know if you'd like help writing a specific API call or script to fetch those codes!

[1]: https://wits.worldbank.org/data/public/WITSAPI_UserGuide.pdf?utm_source=chatgpt.com "WITS-API USER GUIDE"
[2]: https://www.studocu.com/en-us/document/university-of-northwestern-ohio/agricultural-marketing/witsapi-user-guide-access-to-api-data-for-trade-data-analysis/114025162?utm_source=chatgpt.com "WITSAPI User Guide: Accessing Trade Data via API for ..."
[3]: https://wits.worldbank.org/witsapiintro.aspx?lang=en&utm_source=chatgpt.com "WITS API"
[4]: https://wits.worldbank.org/referencedata.html?utm_source=chatgpt.com "Reference Data for Products, Country and Miscellaneous"
[5]: https://wits.worldbank.org/product_concordance.html?utm_source=chatgpt.com "Product Concordance - World Integrated Trade Solution (WITS)"
[6]: https://github.com/mwouts/world_trade_data?utm_source=chatgpt.com "World Integrated Trade Solution (WITS) API in Python"
[7]: https://github.com/diegoacastro/witstrainsr?utm_source=chatgpt.com "diegoacastro/witstrainsr: WITS API in R to programmatically ..."
Perfect — your roadmap is clear. To actually **populate your database** (HS codes, tariff rates, USMCA/FTA rules, regulatory updates, etc.) with **free official sources**, you’ll need to pull from multiple authoritative datasets. Here’s a breakdown of where you can get each piece of information in your schema **without paying for commercial databases**:

---

## 🔑 Core Sources for Your Database

### 1. **HS Codes Master (`hs_codes` table)**

* **WTO / World Bank WITS**

  * WITS API + Reference Data: Free access to HS nomenclature lists and product descriptions (HS-6).
  * 🔗 [WITS Reference Data](https://wits.worldbank.org/referencedata.html)
* **WCO (World Customs Organization)**

  * Official HS system (full HS text is paid, but chapter headings + explanatory notes summaries are often public).
* **National Customs Tariff Schedules** (for detail beyond HS-6):

  * **U.S.**: [HTSUS (USITC)](https://hts.usitc.gov/)
  * **Canada**: [CBSA Customs Tariff](https://www.cbsa-asfc.gc.ca/trade-commerce/tariff-tarif/menu-eng.html)
  * **Mexico**: [SAT Tariff Tables](https://www.gob.mx/cms/uploads/attachment/file/786557/LIGIE_2022.pdf)

👉 These provide descriptions, chapters, and section breakdowns for free.

---

### 2. *


* **MFN (Most Favored Nation) & Preferential Tariffs**:

  * **U.S. ITC DataWeb**: [https://dataweb.usitc.gov](https://dataweb.usitc.gov)
  * **Canada CBSA Customs Tariff** (PDF/Excel downloads per year)
  * **Mexico SAT LIGIE (tariff schedule)**
* **WITS Tariff Data**:

  * Provides country-to-country tariff schedules (MFN & FTA) at HS-6 level.

👉 You’ll use these to populate **mfn\_rate** and **usmca\_rate** per country.

---

### 3. **USMCA Rules of Origin (`usmca_rules` table)**

* **Official USMCA Text**:

  * [USTR (USMCA Agreement)](https://ustr.gov/trade-agreements/free-trade-agreements/united-states-mexico-canada-agreement)
  * Annex 4-B: Rules of Origin (tables with HS codes, content %, tariff shift requirements).
* **CBP USMCA Guidance**:

  * [CBP USMCA Center](https://www.cbp.gov/trade/priority-issues/trade-agreements/free-trade-agreements/usmca)
  * Has simplified product-specific rules of origin.
* **Canada’s Global Affairs USMCA Guide**

  * [CUSMA Text](https://www.international.gc.ca/trade-commerce/trade-agreements-accords-commerciaux/agr-acc/cusma-aceum/text-texte/toc-tdm.aspx)

👉 You can parse these annexes into **rule\_type, regional\_content\_percentage, tariff\_shift\_rule**.

---

### 4. **Regulatory Updates (`regulatory_updates` table)**

* **United States (CBP)**

  * [CSMS Messaging Service](https://www.cbp.gov/trade/automated/cargo-systems-messaging-service) – Free alerts about rule/tariff changes.
  * Federal Register (for binding updates).
* **Canada (CBSA)**

  * [Customs Notices](https://www.cbsa-asfc.gc.ca/publications/cn-ad/menu-eng.html).
* **Mexico (SAT)**

  * [Boletines Aduanales](https://www.sat.gob.mx/).
* **USMCA Committee** (longer-term reports): USTR and Global Affairs Canada publish changes/clarifications.

👉 These feed your **regulatory\_feed.js** and **regulatory\_updates** table.

---

### 5. **Certificates of Origin**

* **Official USMCA Certificate Template** (free):

  * [CBP USMCA Certificate Form](https://www.cbp.gov/sites/default/files/assets/documents/2020-Jul/CBP%20Form%20USMCA%20Certificate%20of%20Origin.pdf).
* Similar forms are provided by **Canada** and **Mexico** trade ministries.

👉 Use these as PDF templates for your `/lib/pdf/CertificateGenerator`.

---

### 6. **Chile FTA + Peru TPA Data (Phase 6–7)**

* **Chile–U.S. FTA**:

  * [USTR Chile FTA Text](https://ustr.gov/trade-agreements/free-trade-agreements/chile-fta)
  * Chilean Ministry of Foreign Affairs publishes tariff elimination schedules.
* **Peru TPA**:

  * [USTR Peru TPA](https://ustr.gov/trade-agreements/free-trade-agreements/peru-tpa)
  * Peru’s SUNAT publishes tariff schedules + origin rules.

👉 These provide the **bridge logic** for LATAM expansion.

---

## ⚡ How to Build Your DB for Free

1. **Start with HS Codes**: Download HS-6 from WITS Reference Data → load into `hs_codes`.
2. **Load Tariffs**: Scrape or download tariff tables from US, CA, MX (and later Chile, Peru).
3. **Parse Rules of Origin**: Extract from Annex 4-B (USMCA) into `usmca_rules`.
4. **Regulatory Feeds**: Subscribe to CBP CSMS + CBSA Notices + SAT bulletins → push into `regulatory_updates`.
5. **Certificates**: Store the official PDF template in `/lib/pdf/`.

---

✅ With this, you’ll have **all the data needed for Phase 1–7** of your roadmap, entirely from **free official sources**.

---

Do you want me to make you a **step-by-step “data ingestion plan”** (scripts + endpoints) so your `/lib/core/` can pull HS codes, tariffs, and rules automatically into your Postgres database?

Perfect — let’s lay this out like a **step-by-step ingestion plan** you can plug into your `/lib/core/` so your platform automatically pulls the free data and syncs it into your Postgres schema.

---

# 📥 Data Ingestion Plan for USMCA Compliance Platform

## 1. **HS Codes (Master List)**

**Source:** [WITS Reference Data](https://wits.worldbank.org/referencedata.html) (HS-6 codes + descriptions)

### Script Plan

* Endpoint: `https://wits.worldbank.org/API/V1/WITS/metadata/product/HS`
* Transform: map → `hs_codes` table

  ```sql
  INSERT INTO hs_codes (hs_code, description, chapter, section, search_keywords)
  VALUES ($1, $2, $3, $4, $5)
  ON CONFLICT (hs_code) DO UPDATE SET description = EXCLUDED.description;
  ```

**Automation:**

* `lib/core/ingestion/hsCodes.js`
* Schedule weekly refresh (HS doesn’t change often, but updates yearly).

---

## 2. **Tariff Rates (US, CA, MX)**

**Sources:**

* US: [HTSUS API (USITC)](https://hts.usitc.gov/api)
* Canada: [CBSA Tariff CSV/PDF](https://www.cbsa-asfc.gc.ca/trade-commerce/tariff-tarif/menu-eng.html)
* Mexico: SAT’s [LIGIE 2022](https://www.gob.mx/cms/uploads/attachment/file/786557/LIGIE_2022.pdf)

### Script Plan

* Extract tariff schedules by HS code.
* Normalize MFN vs preferential (USMCA rate).
* Load into `tariff_rates`.

```sql
INSERT INTO tariff_rates (hs_code, country, mfn_rate, usmca_rate, effective_date, staging_category)
VALUES ($1, $2, $3, $4, $5, $6)
ON CONFLICT (hs_code, country, effective_date) DO UPDATE
SET mfn_rate = EXCLUDED.mfn_rate, usmca_rate = EXCLUDED.usmca_rate;
```

**Automation:**

* `lib/core/ingestion/tariffs.js`
* Monthly refresh (tariff updates are infrequent).

---

## 3. **USMCA Rules of Origin**

**Source:**

* Annex 4-B of USMCA ([USTR Text](https://ustr.gov/trade-agreements/free-trade-agreements/united-states-mexico-canada-agreement))
* CBP “Product Specific Rules” PDF/Excel

### Script Plan

* Scraper/parser: Convert Annex tables → JSON → `usmca_rules`.
* Classify `rule_type` (`tariff_shift`, `regional_content_percentage`, `process`).

```sql
INSERT INTO usmca_rules (
  hs_code, product_description, rule_type,
  regional_content_percentage, tariff_shift_rule,
  specific_process_requirements, certification_required
)
VALUES ($1,$2,$3,$4,$5,$6,$7)
ON CONFLICT (hs_code) DO UPDATE
SET rule_type = EXCLUDED.rule_type,
    regional_content_percentage = EXCLUDED.regional_content_percentage;
```

**Automation:**

* `lib/core/ingestion/usmcaRules.js`
* Refresh when new USMCA interpretations are published (rare).

---

## 4. **Regulatory Updates**

**Sources:**

* **US (CBP):** [CSMS API](https://www.cbp.gov/trade/automated/cargo-systems-messaging-service)
* **Canada (CBSA):** Customs Notices RSS/HTML pages
* **Mexico (SAT):** Boletines Aduanales

### Script Plan

* Scrape or subscribe to feeds.
* Normalize into `regulatory_updates`.

```sql
INSERT INTO regulatory_updates (
  id, source, update_type, affected_hs_codes,
  affected_countries, effective_date, update_content,
  severity, created_at
) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW())
ON CONFLICT (id) DO NOTHING;
```

**Automation:**

* `lib/core/ingestion/regUpdates.js`
* Daily cron job (regulatory feeds change frequently).

---

## 5. **Certificates of Origin Templates**

**Sources:**

* CBP Official PDF (Form USMCA)
* Global Affairs Canada template
* SAT template

### Script Plan

* Store base PDF in `/lib/pdf/templates/`.
* Use `pdf-lib` or `pdfkit` to auto-populate fields.

👉 No ingestion needed, just template management.

---

## 6. **Future: Chile & Peru (LATAM Bridge)**

**Sources:**

* Chile–U.S. FTA text ([USTR Chile FTA](https://ustr.gov/trade-agreements/free-trade-agreements/chile-fta))
* Peru TPA text ([USTR Peru TPA](https://ustr.gov/trade-agreements/free-trade-agreements/peru-tpa))

**Script Plan:**

* Similar to USMCA: parse annexes, map to `chile_fta_rules` and `peru_tpa_rules`.

---

# ⚙️ Suggested File Structure

```
/lib/core/ingestion/
├── hsCodes.js         # Pulls HS from WITS API
├── tariffs.js         # US/CA/MX tariffs
├── usmcaRules.js      # Parse Annex 4-B
├── regUpdates.js      # Scrape CBP/CBSA/SAT feeds
└── utils/             # Shared fetch/parsing utilities
```

# 🕒 Refresh Schedule

| Dataset               | Refresh                         |
| --------------------- | ------------------------------- |
| HS Codes              | Yearly                          |
| Tariffs (MFN/FTA)     | Monthly                         |
| USMCA Rules of Origin | On updates                      |
| Regulatory Updates    | Daily                           |
| Certificates          | Static (update if form changes) |

---

Would you like me to **draft one of the ingestion scripts in Node.js** (say for HS codes via WITS API) so you can drop it into `/lib/core/ingestion/hsCodes.js` and test?


Great 👍 Let’s start with the **HS Codes ingestion script** (Node.js).
This script will call the **WITS Metadata API**, fetch HS codes + descriptions, and insert them into your Postgres `hs_codes` table.

---

# 📄 `/lib/core/ingestion/hsCodes.js`

```javascript
// lib/core/ingestion/hsCodes.js
// Ingest HS Codes (HS-6) from World Bank WITS API into Postgres

import fetch from "node-fetch";
import pg from "pg";

const { Pool } = pg;

// 🔧 Postgres connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // set this in .env
});

// 🔧 WITS API Endpoint (HS codes metadata)
const WITS_ENDPOINT =
  "https://wits.worldbank.org/API/V1/WITS/metadata/product/HS";

// Parse HS metadata from WITS
async function fetchHSCodes() {
  const res = await fetch(WITS_ENDPOINT);
  if (!res.ok) throw new Error(`Failed WITS API: ${res.status}`);
  const data = await res.json();

  // API returns array of { Code, Description, Section, Chapter }
  return data.map((item) => ({
    hs_code: item.Code,
    description: item.Description,
    chapter: parseInt(item.Chapter || "0"),
    section: item.Section || null,
    search_keywords: item.Description
      ? item.Description.toLowerCase().split(/\W+/).filter(Boolean)
      : [],
  }));
}

// Insert into DB
async function saveToDB(hsCodes) {
  const client = await pool.connect();
  try {
    for (const row of hsCodes) {
      await client.query(
        `
        INSERT INTO hs_codes (hs_code, description, chapter, section, search_keywords)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (hs_code) DO UPDATE
        SET description = EXCLUDED.description,
            chapter = EXCLUDED.chapter,
            section = EXCLUDED.section,
            search_keywords = EXCLUDED.search_keywords;
      `,
        [
          row.hs_code,
          row.description,
          row.chapter,
          row.section,
          row.search_keywords,
        ]
      );
    }
    console.log(`✅ Inserted/Updated ${hsCodes.length} HS codes`);
  } finally {
    client.release();
  }
}

// Run script
(async () => {
  try {
    console.log("📥 Fetching HS codes from WITS...");
    const hsCodes = await fetchHSCodes();
    console.log(`Fetched ${hsCodes.length} records`);
    await saveToDB(hsCodes);
    console.log("✅ HS Codes ingestion completed.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Ingestion failed:", err);
    process.exit(1);
  }
})();
```

---

# 🔧 Setup

1. **Add `.env` file**

   ```bash
   DATABASE_URL=postgresql://user:pass@localhost:5432/usmca_db
   ```

2. **Install dependencies**

   ```bash
   npm install node-fetch pg
   ```

3. **Run script manually**

   ```bash
   node lib/core/ingestion/hsCodes.js
   ```

4. **Schedule (optional)**
   Add to `package.json`:

   ```json
   "scripts": {
     "ingest:hs": "node lib/core/ingestion/hsCodes.js"
   }
   ```

   Then run:

   ```bash
   npm run ingest:hs
   ```

---

👉 This script will populate and keep your `hs_codes` table fresh.

Would you like me to also prepare the **Tariff ingestion script** (US/CA/MX) next, so your `tariff_rates` table starts getting filled too?
Yes — you’ll want a **“Data Integration Playbook”** alongside the roadmap so that anyone on your team (or future agents) knows **what data is coming in, where it comes from, how often it refreshes, and how it maps into your schema**.

Here’s what I’d suggest documenting (besides the ingestion scripts themselves):

---

# 📖 Data Integration Documentation (What You’ll Need)

## 1. **Data Source Inventory**

* **HS Codes** → WITS API / WITS Reference Data
* **Tariff Rates** → USITC (HTS API), CBSA Tariff CSVs, SAT (Mexico tariff PDFs)
* **USMCA Rules of Origin** → USTR Annex 4-B, CBP “Product Specific Rules”
* **Regulatory Updates** → CBP CSMS feed, CBSA Customs Notices, SAT bulletins
* **Certificates** → CBP/Global Affairs/SAT official PDFs
* **Chile & Peru FTA** → USTR texts + local customs (Chile Direcon / Peru SUNAT)

Each entry should include:

* API/URL
* Data format (JSON, XML, CSV, PDF)
* Frequency of update

---

## 2. **Schema Mapping Guide**

Show how raw fields map into your Postgres tables. Example:

| Source Field       | Target Table        | Column          | Transform         |
| ------------------ | ------------------- | --------------- | ----------------- |
| `Code` (HS)        | hs\_codes           | hs\_code        | string            |
| `Description` (HS) | hs\_codes           | description     | raw text          |
| `Chapter` (HS)     | hs\_codes           | chapter         | parse int         |
| US ITC `mfn_rate`  | tariff\_rates       | mfn\_rate       | decimal           |
| US ITC `fta_rate`  | tariff\_rates       | usmca\_rate     | decimal           |
| CBP `CSMS text`    | regulatory\_updates | update\_content | clean HTML → text |

---

## 3. **Refresh & Update Policy**

Document when each dataset is pulled and how often:

| Dataset               | Refresh Frequency | Trigger             |
| --------------------- | ----------------- | ------------------- |
| HS Codes              | Yearly            | WITS API update     |
| Tariff Rates          | Monthly           | USITC/CBSA/SAT      |
| USMCA Rules of Origin | On updates only   | Annex/CBP change    |
| Regulatory Updates    | Daily             | CSMS/CBSA/SAT feeds |

---

## 4. **Error Handling / Validation**

Define rules like:

* If WITS API fails → retry 3x → fallback to cached JSON file.
* If tariff parsing fails → log record, skip insert.
* If regulatory feed contains unknown HS → flag in `validation_logs` table.

---

## 5. **Version Control**

* Keep raw source files in `/data/raw/` (CSV/JSON dumps).
* Processed datasets in `/data/processed/`.
* Add `source_version` column to each table (e.g., `HS2022`, `HTS2025`).

---

## 6. **Test Data & Sample Queries**

Include SQL snippets in documentation for QA, e.g.:

```sql
-- Check if HS code exists
SELECT * FROM hs_codes WHERE hs_code = '870323';

-- Compare MFN vs USMCA
SELECT hs_code, mfn_rate, usmca_rate
FROM tariff_rates
WHERE country = 'US'
ORDER BY mfn_rate DESC LIMIT 10;

-- Recent regulatory updates
SELECT source, update_content
FROM regulatory_updates
WHERE created_at > NOW() - interval '7 days';
```

---

## 7. **Certificates of Origin Templates**

* Store **official PDFs** in `/lib/pdf/templates/` with version numbers.
* Document which fields are auto-populated from DB vs user input.
* Example mapping:

  * `Exporter Name` → user profile table
  * `HS Code` → hs\_codes table
  * `Origin Criteria` → usmca\_rules

---

## 8. **Security & Compliance Notes**

* Don’t store confidential customs docs in raw ingestion logs.
* Ensure regulatory updates are archived (for audit trails).
* Mask personal data in alerts (customer alerts table).

---

📌 In short: You want one **living doc** (could be `DATA_INTEGRATION.md` in your repo) with:

* Sources → Schema mapping → Refresh rules → Validation → Versioning

---

Would you like me to **draft a starter `DATA_INTEGRATION.md`** file for your repo (with placeholders for each source) so you can hand it to your devs and keep everything consistent?

Perfect 🙌 Here’s a clean starter **`DATA_INTEGRATION.md`** for your repo.
You can drop this in the root of your project — it’s structured so you can expand as you add Chile/Peru phases later.

---

# 📖 Data Integration Guide – USMCA Compliance Platform

This document describes the external **data sources**, **schema mappings**, **update schedules**, and **validation rules** used in the USMCA Compliance Platform.
It ensures consistent ingestion and maintenance of trade compliance data.

---

## 1. Data Sources Inventory

| Dataset                      | Source / API Docs                                                                                                    | Format    | Frequency | Notes                                         |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------- | --------- | --------- | --------------------------------------------- |
| **HS Codes**                 | [World Bank WITS Metadata API](https://wits.worldbank.org/data/public/WITSAPI_UserGuide.pdf)                         | JSON      | Annual    | Harmonized System (HS-6) codes + descriptions |
| **Tariff Rates – US**        | USITC HTS API ([HTS Online](https://hts.usitc.gov/))                                                                 | JSON      | Monthly   | MFN + USMCA preferential rates                |
| **Tariff Rates – CA**        | CBSA Tariff Database ([Canada Tariff Finder](https://www.cbsa-asfc.gc.ca/trade-commerce/tariff-tarif/menu-eng.html)) | CSV       | Monthly   | MFN + CUSMA preferential rates                |
| **Tariff Rates – MX**        | SAT (Diario Oficial / TIGIE Tariff Tables)                                                                           | PDF → CSV | Monthly   | MFN + T-MEC preferential rates                |
| **USMCA Rules of Origin**    | USTR Annex 4-B + CBP “Product Specific Rules”                                                                        | PDF       | As needed | Text parsing required                         |
| **Regulatory Updates**       | CBP CSMS feed, CBSA Customs Notices, SAT Bulletins                                                                   | HTML/CSV  | Daily     | For compliance alerts                         |
| **Certificates (Templates)** | CBP / Global Affairs Canada / SAT Official CO Forms                                                                  | PDF       | Versioned | Used for auto-fill generation                 |

---

## 2. Schema Mapping

### HS Codes → `hs_codes`

| Source Field  | Target Column     | Notes                               |
| ------------- | ----------------- | ----------------------------------- |
| `Code`        | `hs_code`         | Primary key                         |
| `Description` | `description`     | Product description                 |
| `Chapter`     | `chapter`         | Integer                             |
| `Section`     | `section`         | HS Section                          |
| Derived       | `search_keywords` | Tokenized keywords from description |

---

### Tariff Rates → `tariff_rates`

| Source Field   | Target Column      | Notes           |
| -------------- | ------------------ | --------------- |
| HS code        | `hs_code`          | FK → `hs_codes` |
| Country        | `country`          | US, CA, MX      |
| MFN duty       | `mfn_rate`         | Decimal (%)     |
| Preferential   | `usmca_rate`       | Decimal (%)     |
| Effective date | `effective_date`   | From source     |
| Staging info   | `staging_category` | From Annex      |

---

### USMCA Rules → `usmca_rules`

| Source Field  | Target Column                   | Notes                                   |
| ------------- | ------------------------------- | --------------------------------------- |
| HS code       | `hs_code`                       | FK → `hs_codes`                         |
| Rule type     | `rule_type`                     | `percentage`, `tariff_shift`, `process` |
| RVC %         | `regional_content_percentage`   | From Annex                              |
| Tariff shift  | `tariff_shift_rule`             | Text                                    |
| Process       | `specific_process_requirements` | Text                                    |
| Certification | `certification_required`        | Boolean                                 |

---

### Regulatory Updates → `regulatory_updates`

| Source Field   | Target Column        | Notes                   |
| -------------- | -------------------- | ----------------------- |
| Feed source    | `source`             | CBP, CBSA, SAT          |
| Notice type    | `update_type`        | Rule, tariff, procedure |
| HS impacted    | `affected_hs_codes`  | Array                   |
| Countries      | `affected_countries` | Array                   |
| Effective date | `effective_date`     | Date                    |
| Content        | `update_content`     | Clean text              |
| Severity       | `severity`           | Critical → Low          |

---

## 3. Refresh Policy

| Dataset         | Frequency | Trigger                  |
| --------------- | --------- | ------------------------ |
| HS Codes        | Annual    | WITS HS updates          |
| Tariff Rates    | Monthly   | Customs authority update |
| Rules of Origin | On change | CBP/USTR/Annex updates   |
| Regulatory Feed | Daily     | CSMS/CBSA/SAT            |
| Certificates    | Versioned | Official form release    |

---

## 4. Validation & Error Handling

* **HS Codes**: Reject non-numeric codes, ensure 6-digit format.
* **Tariffs**: If preferential > MFN → log error.
* **Rules**: If HS code missing from `hs_codes`, flag in `validation_logs`.
* **Feeds**: Retry API calls 3x, fallback to cached JSON.

---

## 5. Version Control

* Store raw files in `/data/raw/` (JSON, CSV, PDF).
* Processed files in `/data/processed/`.
* Add `source_version` column to each table: e.g., `HS2022`, `HTS2025`.

---

## 6. Testing & QA

Sample queries for validation:

```sql
-- Check HS code exists
SELECT * FROM hs_codes WHERE hs_code = '870323';

-- Compare MFN vs USMCA rates
SELECT hs_code, mfn_rate, usmca_rate
FROM tariff_rates
WHERE country = 'US'
ORDER BY mfn_rate DESC LIMIT 10;

-- Regulatory updates in last 7 days
SELECT source, update_content
FROM regulatory_updates
WHERE created_at > NOW() - interval '7 days';
```

---

## 7. Certificate Templates

* Store official PDFs in `/lib/pdf/templates/`.
* Map fields:

  * Exporter/Importer → user profile
  * HS Code → `hs_codes`
  * Origin Criteria → `usmca_rules`
* Version each template by year + authority (e.g., `USMCA_CO_2025_US.pdf`).

---

## 8. Security & Compliance Notes

* Do not store confidential trade docs in ingestion logs.
* Archive regulatory updates for audit trail.
* Mask personal data in `customer_alerts`.

---

✅ This doc is **living** → update as you add Chile (Phase 6) & Peru (Phase 7).

---

Would you like me to **expand this further with the Chile & Peru FTA placeholders now**, so you don’t have to rework the structure later when you add them in Phase 6/7?


Great 👍 I’ll extend your **`DATA_INTEGRATION.md`** so it’s ready for **Chile (Phase 6)** and **Peru (Phase 7)** without needing a rework later.
Here’s the expanded version with placeholders built-in:

---

# 📖 Data Integration Guide – USMCA + LATAM Compliance Platform

This document describes the external **data sources**, **schema mappings**, **update schedules**, and **validation rules** used in the Compliance Platform.
It ensures consistent ingestion and maintenance of trade compliance data.

---

## 1. Data Sources Inventory

| Dataset                      | Source / API Docs                                                                                                    | Format    | Frequency | Notes                                         |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------- | --------- | --------- | --------------------------------------------- |
| **HS Codes**                 | [WITS Metadata API](https://wits.worldbank.org/data/public/WITSAPI_UserGuide.pdf)                                    | JSON      | Annual    | Harmonized System (HS-6) codes + descriptions |
| **Tariff Rates – US**        | USITC HTS API ([HTS Online](https://hts.usitc.gov/))                                                                 | JSON      | Monthly   | MFN + USMCA preferential rates                |
| **Tariff Rates – CA**        | CBSA Tariff Database ([Canada Tariff Finder](https://www.cbsa-asfc.gc.ca/trade-commerce/tariff-tarif/menu-eng.html)) | CSV       | Monthly   | MFN + CUSMA preferential rates                |
| **Tariff Rates – MX**        | SAT (Diario Oficial / TIGIE Tariff Tables)                                                                           | PDF → CSV | Monthly   | MFN + T-MEC preferential rates                |
| **USMCA Rules of Origin**    | USTR Annex 4-B + CBP “Product Specific Rules”                                                                        | PDF       | As needed | Text parsing required                         |
| **Regulatory Updates**       | CBP CSMS feed, CBSA Customs Notices, SAT Bulletins                                                                   | HTML/CSV  | Daily     | For compliance alerts                         |
| **Certificates (Templates)** | CBP / Global Affairs Canada / SAT Official CO Forms                                                                  | PDF       | Versioned | Used for auto-fill generation                 |
| **Chile FTA Tariffs**        | DIRECON (Chile Foreign Trade), USTR Chile FTA Annexes                                                                | CSV/XML   | Monthly   | Chile tariff schedule & FTA preferential      |
| **Chile Market Access**      | Chilean Customs (Aduanas Chile) + sectoral import regs                                                               | PDF/HTML  | Quarterly | Import requirements, documentation            |
| **Peru TPA Tariffs**         | SUNAT Peru (Customs Tariff Tables), USTR Peru TPA Annexes                                                            | CSV/XML   | Monthly   | Peru tariff schedule & preferential           |
| **Peru Market Access**       | SUNAT + Peru Trade Ministry                                                                                          | PDF/HTML  | Quarterly | Import procedures, sectoral requirements      |

---

## 2. Schema Mapping

### HS Codes → `hs_codes`

| Source Field  | Target Column     | Notes               |
| ------------- | ----------------- | ------------------- |
| `Code`        | `hs_code`         | Primary key         |
| `Description` | `description`     | Product description |
| `Chapter`     | `chapter`         | Integer             |
| `Section`     | `section`         | HS Section          |
| Derived       | `search_keywords` | Tokenized keywords  |

---

### Tariff Rates → `tariff_rates`

| Source Field   | Target Column      | Notes              |
| -------------- | ------------------ | ------------------ |
| HS code        | `hs_code`          | FK → `hs_codes`    |
| Country        | `country`          | US, CA, MX, CL, PE |
| MFN duty       | `mfn_rate`         | Decimal (%)        |
| Preferential   | `fta_rate`         | Decimal (%)        |
| Effective date | `effective_date`   | From source        |
| Staging info   | `staging_category` | From Annex         |

---

### USMCA Rules → `usmca_rules`

(same as before, see above)

---

### Chile FTA Rules → `chile_fta_rules`

| Source Field      | Target Column         | Notes           |
| ----------------- | --------------------- | --------------- |
| HS code           | `hs_code`             | FK → `hs_codes` |
| FTA qualification | `us_chile_qualified`  | Boolean         |
| Chile tariff      | `chile_tariff_rate`   | Decimal         |
| US MFN rate       | `us_mfn_rate`         | Decimal         |
| Origin rules      | `origin_requirements` | Text            |
| Staging schedule  | `staging_category`    | Text            |

---

### Chile Market Access → `chile_market_access`

| Field           | Target Column          | Notes                           |
| --------------- | ---------------------- | ------------------------------- |
| Sector          | `sector`               | Agriculture, Mining, etc.       |
| Import reqs     | `import_requirements`  | Array                           |
| Key regulations | `key_regulations`      | Text                            |
| Logistics hubs  | `logistics_hubs`       | Array (Valparaíso, San Antonio) |
| Docs needed     | `documentation_needed` | Array                           |

---

### Peru TPA Rules → `peru_tpa_rules`

| Source Field      | Target Column           | Notes           |
| ----------------- | ----------------------- | --------------- |
| HS code           | `hs_code`               | FK → `hs_codes` |
| FTA qualification | `us_peru_qualified`     | Boolean         |
| Peru tariff       | `peru_tariff_rate`      | Decimal         |
| TPA pref. rate    | `tpa_preferential_rate` | Decimal         |
| Origin rules      | `origin_requirements`   | Text            |
| Staging schedule  | `staging_schedule`      | Text            |

---

### Peru Market Access → `peru_market_access`

| Field          | Target Column          | Notes                  |
| -------------- | ---------------------- | ---------------------- |
| Sector         | `sector`               | Textiles, Mining, Agri |
| Import reqs    | `import_requirements`  | Array                  |
| Regulations    | `key_regulations`      | Text                   |
| Logistics hubs | `logistics_hubs`       | Array (Callao, Paita)  |
| Docs needed    | `documentation_needed` | Array                  |

---

### Regulatory Updates → `regulatory_updates`

(expanded to cover CL + PE)

| Source Field   | Target Column        | Notes                          |
| -------------- | -------------------- | ------------------------------ |
| Feed source    | `source`             | CBP, CBSA, SAT, DIRECON, SUNAT |
| Notice type    | `update_type`        | Rule, tariff, procedure        |
| HS impacted    | `affected_hs_codes`  | Array                          |
| Countries      | `affected_countries` | Array                          |
| Effective date | `effective_date`     | Date                           |
| Content        | `update_content`     | Clean text                     |
| Severity       | `severity`           | Critical → Low                 |

---

## 3. Refresh Policy

| Dataset                 | Frequency | Trigger                        |
| ----------------------- | --------- | ------------------------------ |
| HS Codes                | Annual    | WITS update                    |
| Tariff Rates (US/CA/MX) | Monthly   | Customs release                |
| Chile Tariffs           | Monthly   | DIRECON update                 |
| Peru Tariffs            | Monthly   | SUNAT update                   |
| Market Access CL/PE     | Quarterly | Local customs circulars        |
| Rules of Origin         | As needed | Agreement updates              |
| Regulatory Feeds        | Daily     | CBP, CBSA, SAT, DIRECON, SUNAT |
| Certificates            | Versioned | Official releases              |

---

## 4. Validation & Error Handling

(same as USMCA section, expanded to CL/PE sources)

---

## 5. Version Control

* Chile FTA → versioned by “FTA entry into force” year.
* Peru TPA → versioned by “TPA schedule” year.

---

## 6. Testing & QA

```sql
-- Check Chile tariff vs US MFN
SELECT hs_code, chile_tariff_rate, us_mfn_rate
FROM chile_fta_rules
WHERE us_chile_qualified = true
LIMIT 10;

-- Check Peru qualification
SELECT hs_code, us_peru_qualified, tpa_preferential_rate
FROM peru_tpa_rules
WHERE tpa_preferential_rate < peru_tariff_rate;
```

---

## 7. Certificates (Multi-Market)

* USMCA, Chile, and Peru CO forms stored in `/lib/pdf/templates/`.
* Version each template: `USMCA_CO_2025.pdf`, `Chile_FTA_CO_2025.pdf`, `Peru_TPA_CO_2025.pdf`.

---

## 8. Security & Compliance Notes

* Apply same rules as USMCA → CL + PE.
* Archive **market access circulars** for compliance checks.

---

✅ With this structure, adding Chile (Phase 6) and Peru (Phase 7) is just “turning on” data sources — the schema, documentation, and processes are already set up.

---

Would you like me to also **draft sample ingestion scripts (Node/TS)** for **HS Codes (WITS)** and **Tariff Rates (USITC)** so you have working ETL templates to build from?
