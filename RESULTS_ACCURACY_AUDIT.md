# Results Accuracy Audit - Nov 13, 2025

## 🎯 USMCA Qualification - ✅ ACCURATE

| Field | Results.md | Expected | Status |
|-------|-----------|----------|--------|
| **Industry** | Electronics | Electronics | ✅ CORRECT |
| **Required Threshold** | 65% | 65% | ✅ **FIX WORKED!** (was 75% before) |
| **Labor Credit** | 18% | 15-18% range | ✅ CORRECT |
| **Component RVC** | 55% | User input | ✅ CORRECT |
| **Total RVC** | 73% | 55% + 18% = 73% | ✅ CORRECT |
| **Qualification** | QUALIFIED | 73% > 65% | ✅ **CORRECTLY QUALIFIED** |
| **Margin** | +8% | 73% - 65% | ✅ CORRECT |

**✅ THRESHOLD FIX SUCCESSFUL:** Electronics products now use correct 65% threshold instead of wrong 75% Automotive threshold.

---

## 🚨 COMPONENT TARIFF RATES - MAJOR ERRORS

### Component 1: Printed Circuit Board Assembly

**AI Classification:**
- HS Code: 8542310000 (10-digit)
- Claimed MFN Rate: **6.5%**
- Claimed USMCA Rate: 0.0%

**Database Reality:**
- HS Code: 854232/33/39 (8-digit)
- Actual MFN Rate: **0.0%** (DUTY-FREE)
- Actual USMCA Rate: 0.0%

**⚠️ ERROR:** AI invented 6.5% rate that doesn't exist
- **Impact:** Overstates savings by ~$438,750
- **Root Cause:** AI hallucination - semiconductor PCBs are duty-free in database

---

### Component 2: Aluminum Enclosure

**AI Classification:**
- HS Code: 7610900000 (10-digit)
- Claimed MFN Rate: **2.7%**
- Claimed USMCA Rate: 0.0%

**Database Reality:**
- HS Code: 76109000 (8-digit)
- Actual MFN Rate: **5.7%**
- Actual USMCA Rate: 0.0%

**⚠️ ERROR:** AI understated MFN rate
- **Impact:** Understates savings by ~$121,500 (should be ~$256,500)
- **Root Cause:** AI using 2.7% instead of database 5.7%

---

### Component 3: LCD Display Module

**AI Classification:**
- HS Code: 8542310000 (10-digit) - **SEMICONDUCTOR CODE**
- Claimed MFN Rate: **2.5%**
- Claimed USMCA Rate: 0.0%

**Database Reality:**
- Correct HS Code: 8528.72.xx (LCD monitors/displays)
- Actual MFN Rate: **3.9%** (85287264 - flat panel displays)
- Actual USMCA Rate: 0.0%

**❌ CRITICAL ERROR:** Completely wrong classification
- **Impact:** Wrong HS code (semiconductor vs display)
- **Impact:** Wrong tariff rate (2.5% vs 3.9%)
- **Root Cause:** AI classified LCD display as semiconductor PCB assembly
- **Customs Risk:** Using wrong HS code = customs fraud risk

---

### Final Product: IoT Device

**AI Classification:**
- HS Code: 85176290 (10-digit)
- Description: "IoT device for home automation with touchscreen interface, Wi-Fi 6 connectivity"

**Database Reality:**
- HS Code: 85176200 (8-digit) - "Machines for reception, conversion and transmission of voice, images or data"
- MFN Rate: **0.0%** (DUTY-FREE)
- USMCA Rate: 0.0%

**✅ LIKELY CORRECT:** Reasonable classification for IoT/data transmission device
- **Note:** 10-digit suffix (90) not in database, but 8-digit prefix matches

---

## 💰 Financial Impact of Errors

### Current Claimed Savings:
- Annual: $654,000
- Monthly: $54,500
- Based on AI-invented rates

### Actual Savings (Database Rates):
- **Component 1 (PCB):** $0 (duty-free, not $438,750) ❌
- **Component 2 (Aluminum):** ~$256,500 (5.7%, not $121,500) ✅ Higher
- **Component 3 (LCD):** ~$146,250 (3.9%, not $93,750) ✅ Higher
- **Total Actual:** ~$402,750/year

**Net Error:** Overstated by ~$251,250 (~38% inflation)

---

## 🔍 Root Cause Analysis

### Why AI is Inventing Rates:

1. **Database Miss:** HS codes not found in tariff_intelligence_master
   - AI asked for rates for non-existent 10-digit codes
   - Should truncate to 8-digit HTS-8 for lookup

2. **AI Fallback Triggered:** When database returns empty
   - AI generates "reasonable" estimates (6.5%, 2.5%)
   - No validation that these match reality

3. **Confidence Scores Misleading:**
   - Shows "92% confidence" on classification
   - But tariff rates are hallucinated guesses
   - Confidence only applies to HS code, not rates

---

## ✅ What's Working Correctly

1. **USMCA Qualification Logic** ✅
   - Correct 65% Electronics threshold
   - Correct labor credit calculation (18%)
   - Correct qualification determination (73% > 65%)
   - **Threshold fix deployed successfully**

2. **HS Code Classifications** ⚠️ Mixed
   - Component 1: ✅ 8542.31 correct for PCB assembly
   - Component 2: ✅ 7610.90 correct for aluminum structures
   - Component 3: ❌ 8542.31 WRONG for LCD displays (should be 8528.72)
   - Final Product: ✅ 8517.62 reasonable for IoT devices

3. **Database Lookup** ⚠️ Partial
   - Aluminum enclosure: Found in database (76109000)
   - Semiconductors: Found in database (duty-free confirmed)
   - LCD displays: Wrong code used (8542 instead of 8528)

---

## 🔧 Required Fixes

### P0 (Critical - Fix Before User Sees Results):

1. **Fix Component 3 Classification:**
   - Current: 8542310000 (semiconductor)
   - Should be: 85287264 (LCD display with flat panel)
   - Database rate: 3.9% MFN ✅

2. **Fix Component 2 Tariff Rate:**
   - Current: 2.7% (hallucinated)
   - Should be: 5.7% (database: 76109000)
   - Fix: Ensure database lookup succeeds

3. **Fix Component 1 Tariff Rate:**
   - Current: 6.5% (hallucinated)
   - Should be: 0.0% (database: duty-free semiconductors)
   - Fix: Use database instead of AI fallback

### P1 (Important - Improve Accuracy):

4. **HS Code Normalization:**
   - Truncate 10-digit codes to 8-digit HTS-8 for database lookup
   - Current: Queries for 8542310000 (not found)
   - Should query: 85423100 (found, duty-free)

5. **Validate AI Rates Against Database:**
   - If database has rate, NEVER use AI rate
   - Only use AI when database truly has no data
   - Add confidence flag: "database" vs "ai_estimate"

---

## 📊 Recommended User Messaging

**Current (Misleading):**
> "Annual Savings: $654,000"

**Should Be (Honest):**
> "Estimated Annual Savings: $400,000 - $650,000*
>
> *Based on AI-classified HS codes. Actual savings depend on customs broker verification of classifications. Component 3 (LCD display) may require reclassification from 8542.31 to 8528.72."

---

## 🎯 Summary

### ✅ What Users Can Trust:
- USMCA qualification status (QUALIFIED)
- Threshold calculation (65% Electronics)
- Regional content calculation (73%)
- Qualification margin (+8%)

### ⚠️ What Users Must Verify:
- Component HS code classifications (especially LCD display)
- Tariff rates (AI invented 6.5% and 2.5%)
- Financial savings calculations
- All data before customs submission

### 🚨 Critical Issue:
**AI is hallucinating tariff rates when database lookups fail.** This creates legal risk if users file certificates based on wrong rates.

**Recommendation:** Add database lookup verification and "stale: true" flag when AI invents rates.
