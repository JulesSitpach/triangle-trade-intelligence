# Trade Routes & Supplier Information - Quick Reference

**Required for API Analysis - Use These Exact Values**

---

## 🗺️ TEST ACCOUNT 1: TRIAL USER (AutoParts USA)

### Trade Route Information
```
Primary Supplier Country: Mexico
Destination Market: United States
Trade Volume: $450,000

TRADE FLOW: Mexico → United States (Simple - 2 countries)
ADVANTAGE: USMCA-qualifying route (Mexico + US involvement)
```

### Why This Route?
- Components sourced from Mexico (cost advantage)
- Final assembly/distribution in USA
- Direct Mexico→US export (USMCA eligible)

---

## 🗺️ TEST ACCOUNT 2: STARTER (MexManufacturing)

### Trade Route Information
```
Primary Supplier Country: United States
Destination Market: Canada
Trade Volume: $850,000

TRADE FLOW: United States → Mexico → Canada (Triangle routing)
ADVANTAGE: USMCA triangle route - potential tariff savings through Mexico routing
```

### Why This Route?
- Raw materials sourced in USA (quality, cost)
- Manufacturing in Mexico (labor cost advantage, USMCA territory)
- Final distribution in Canada
- This is the MEXICO BRIDGE VALUE PROPOSITION - triangle routing

---

## 🗺️ TEST ACCOUNT 3: PROFESSIONAL (CanadaDistribution)

### Trade Route Information
```
Primary Supplier Country: China
Destination Market: United States
Trade Volume: $2,500,000

TRADE FLOW: China → Canada → United States (Non-USMCA + USMCA)
CONCERN: Chinese origin components face Section 301 tariffs even with USMCA
OPPORTUNITY: Could optimize by switching to Mexico suppliers
```

### Why This Route?
- Cheapest components from China
- Distribution hub in Canada
- Final market in USA
- Shows why USMCA qualification is hard (65% threshold for electronics)

---

## 🗺️ TEST ACCOUNT 4: PREMIUM (GlobalWholesale)

### Trade Route Information
```
Primary Supplier Country: Mexico
Destination Market: United States
Trade Volume: $8,500,000

TRADE FLOW: Mexico → United States (Simple but high-volume USMCA route)
ADVANTAGE: Maximum USMCA savings at scale ($8.5M volume = significant tariff reduction)
```

### Why This Route?
- Mexico is USMCA territory (automatic partial qualification)
- Direct Mexico→USA export (optimal for USMCA)
- High volume = high tariff savings potential
- Premium tier because of substantial trade volume

---

## 📋 API Field Reference

When filling the workflow form, use these exact field names:

### **Field 1: Primary Supplier Country**
Label in form: "Supplier Country" or "Where you source components"
```
TEST 1 (TRIAL): Mexico
TEST 2 (STARTER): United States
TEST 3 (PROFESSIONAL): China
TEST 4 (PREMIUM): Mexico
```

### **Field 2: Destination Market**
Label in form: "Destination Country" or "Where you export to"
```
TEST 1 (TRIAL): United States
TEST 2 (STARTER): Canada
TEST 3 (PROFESSIONAL): United States
TEST 4 (PREMIUM): United States
```

### **Field 3: Trade Volume (Annual)**
Label in form: "Annual Trade Volume" or "Trade Volume"
```
TEST 1 (TRIAL): $450,000 (or 450000)
TEST 2 (STARTER): $850,000 (or 850000)
TEST 3 (PROFESSIONAL): $2,500,000 (or 2500000)
TEST 4 (PREMIUM): $8,500,000 (or 8500000)
```

---

## 🎯 Trade Route Combinations & What to Expect

| Route | Supplier | Destination | USMCA Eligible? | Tariff Savings | Notes |
|-------|----------|-------------|-----------------|-----------------|-------|
| **Mexico→USA** | Mexico | USA | ✅ YES | High | Easiest USMCA (both USMCA territory) |
| **USA→Mexico→Canada** | USA | Canada | ✅ YES | High | Triangle routing (Mexico advantage) |
| **China→Canada→USA** | China | USA | ❌ NO | None (Section 301) | Chinese components disqualify |
| **Mexico→USA** | Mexico | USA | ✅ YES | High | Optimal for tariff savings |

**Key Point**: The PRIMARY SUPPLIER COUNTRY is what matters most for USMCA qualification. If it's USMCA territory (US/Mexico/Canada), you get automatic qualifying content. If it's non-USMCA (China, Vietnam, etc.), the entire component counts as non-qualifying.

---

## ✅ Complete Copy-Paste Data (Trade Routes Included)

### **TEST 1: TRIAL** - Mexico→USA Route
```
COMPANY: AutoParts USA Inc
SUPPLIER COUNTRY: Mexico ← KEY FIELD
DESTINATION: United States ← KEY FIELD
TRADE VOLUME: $450,000

Company Address: 123 Import Blvd, Detroit, MI 48201
Contact: John Smith (+1-313-555-1234)
Tax ID: 38-7654321

Product: Automotive engine mount assemblies with steel housing and rubber vibration dampeners
Manufacturing Location: Mexico

Components:
1. Cold-rolled steel housing | China | 20%
2. Rubber dampeners | Mexico | 50%
3. Steel bolts | USA | 30%
```

### **TEST 2: STARTER** - USA→Mexico→Canada Triangle Route
```
COMPANY: MexManufacturing Ltd
SUPPLIER COUNTRY: United States ← KEY FIELD (USA supplies raw materials)
DESTINATION: Canada ← KEY FIELD (Triangle routing benefit)
TRADE VOLUME: $850,000

Company Address: 456 Industrial Way, Monterrey, NL, Mexico 64000
Contact: Maria Garcia (+52-81-555-6789)
Tax ID: RFC-MEX123456

Product: Industrial textile products for automotive upholstery and interior trim
Manufacturing Location: Mexico

Components:
1. Cotton fabric | USA | 45%
2. Polyester thread | Mexico | 35%
3. Foam backing | Canada | 20%
```

### **TEST 3: PROFESSIONAL** - China→Canada→USA Route (Non-USMCA)
```
COMPANY: CanadaDistribution Inc
SUPPLIER COUNTRY: China ← KEY FIELD (Chinese components = tariff exposure)
DESTINATION: United States ← KEY FIELD
TRADE VOLUME: $2,500,000

Company Address: 789 Commerce St, Toronto, ON M5H 2N2
Contact: David Chen (+1-416-555-9012)
Tax ID: BN-987654321RC0001

Product: Electronic components and circuit assemblies for automotive control systems
Manufacturing Location: Does Not Apply

Components:
1. Circuit boards | China | 55%
2. Wire harness | Mexico | 25%
3. ABS housing | USA | 20%
```

### **TEST 4: PREMIUM** - Mexico→USA Route (High Volume)
```
COMPANY: GlobalWholesale Corp
SUPPLIER COUNTRY: Mexico ← KEY FIELD (USMCA territory)
DESTINATION: United States ← KEY FIELD
TRADE VOLUME: $8,500,000

Company Address: 321 Medical Plaza, Houston, TX 77002
Contact: Dr. Sarah Johnson (+1-713-555-3456)
Tax ID: 12-3456789

Product: Medical device components and surgical instrument assemblies
Manufacturing Location: Does Not Apply

Components:
1. Stainless steel | USA | 40%
2. Silicone seals | Mexico | 35%
3. Polycarbonate | Canada | 25%
```

---

## 🚨 API Requirements - Do NOT Skip These Fields

The API **requires** these fields for AI analysis:

```javascript
{
  supplier_country: "Required - Where you source from",
  destination_country: "Required - Where you export to",
  trade_volume: "Required - Annual $ volume",
  company_country: "Required - Your company location",
  manufacturing_location: "Required - Where assembly happens"
}
```

Without these, the AI cannot:
- Determine USMCA eligibility
- Calculate tariff rates (destination-specific)
- Assess trade flow risks
- Recommend alternative routes

---

## 📌 Workflow Form Field Order

When filling the workflow form, you'll encounter these in this order:

1. **Company Information** (name, address, contact)
   - Includes: Company Country, Contact details

2. **Trade Information** ← **THIS IS WHERE SUPPLIER/DESTINATION GO**
   - "Where do you source components?" = **Primary Supplier Country**
   - "Where will products be sold/exported?" = **Destination Market**
   - "Annual trade volume?" = **Trade Volume**
   - "Where is manufacturing located?" = **Manufacturing Location**

3. **Product Details**
   - Product description, HS code

4. **Components**
   - Component details with origins

5. **Results**
   - USMCA qualification, tariff rates, recommendations

---

## 🎯 Testing Tip

When testing, pay attention to how the **Supplier Country** affects results:

- **Mexico supplier** → Components qualify for USMCA
- **USA supplier** → Components qualify for USMCA
- **Canada supplier** → Components qualify for USMCA
- **China supplier** → Components DON'T qualify (non-USMCA)
- **Other countries** → Components DON'T qualify

The AI will use this to calculate regional content percentage and determine qualification.

---

**You're now set with complete trade route information! Use these values when testing. 🌍**
