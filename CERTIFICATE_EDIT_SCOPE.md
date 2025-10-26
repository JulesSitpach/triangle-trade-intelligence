# 📝 CERTIFICATE EDIT FEATURE - SCOPE DEFINITION
**Model**: TurboTax review-and-edit approach
**Positioning**: Advisory tool + user final authority
**Status**: Scope definition

---

## 🎯 CRITICAL EDITABLE FIELDS (MUST HAVE)

### 1. Regional Value Content (RVC) %
```
Current: System calculated 72.5%
User Edit: Allows 60-100%

Why Editable:
- User knows their supply chain better than AI analysis
- Legitimate business judgment on value allocation
- Different calculation methods exist (Transaction Value vs. Net Cost)
- User might have supplier documentation AI missed

Liability Implications:
- ✅ User is making conscious decision with data in front of them
- ✅ System showed its calculation, user modified with own knowledge
- ✅ Clear audit trail: "System: 72.5% → User Modified: 75%"

Validation:
- ⚠️ Warning if drops below threshold (e.g., "Below 65% = no USMCA benefit")
- ⚠️ Warning if exceeds 100%
- User can proceed with warnings
```

### 2. Component Origin Percentages
```
Current: User entered 35% China, 30% Mexico, 35% US
User Edit: Can adjust any component's %

Why Editable:
- User might refine sourcing allocation after thinking through it
- May have supplier data they didn't initially provide
- Legitimately complex to allocate across multiple suppliers

Liability Implications:
- ✅ User confirming their own data
- ✅ System shows what RVC would be with new percentages
- ✅ Audit trail preserved

Validation:
- ⚠️ Total must equal 100%
- ⚠️ Recalculate RVC in real-time as they adjust
- Show updated certificate impact instantly
```

### 3. Preference Criterion (A/B/C/D)
```
Current: System determined "A" (wholly North American)
User Edit: Can select A, B, C, or D

Why Editable:
- If user disagrees with AI interpretation of their sourcing
- Wants to be conservative (choose "B" instead of "A")
- Has evidence supporting different criterion

Liability Implications:
- ✅ User is making deliberate choice, not accepting default
- ✅ All options shown with USMCA rule explanations
- ✅ Clear: "User selected B instead of system recommendation A"

Validation:
- Show USMCA rule for each criterion alongside dropdown
- No validation errors (user choice is sovereign)
```

---

## ⚠️ SHOULD NOT BE EDITABLE (System Maintains)

### 1. HS Code
```
Current: AI classified as 8517.62.00 (Smartphone assembly)
WHY NO EDIT:
- Too technical for most users to judge
- Tariff rates tied to HS code - allowing edit breaks calculation chain
- CBP audit would question why different from classification

INSTEAD:
- Show 2-3 alternative HS codes AI considered
- Link to tariff.io or CBP website for verification
- Allow user to request reclassification (separate flow)
```

### 2. Base Tariff Rates (MFN, Section 301, etc.)
```
Current: System pulled 3.2% MFN from database
WHY NO EDIT:
- These are regulatory facts (USTR official rates)
- User editing these creates compliance risk
- If user disagrees, they need legal/compliance help

INSTEAD:
- Show source of rate (USTR List, CBP, etc.)
- Allow "Flag for Review" → escalates to compliance team
```

### 3. Tariff Savings Calculations
```
Current: $4,080/year savings
WHY NO EDIT:
- Automatically recalculates based on component percentages
- If user edits origin percentages, savings auto-update
- No need for manual override
```

---

## 🤔 NICE-TO-HAVE EDITABLE FIELDS

### 1. Product Description
```
Current: "Smartphone assembly..."
User Edit: Refine description for clarity

Why Nice-to-Have:
- Might want to clarify for their own records
- Could help with future certificates for similar products
- Doesn't affect calculations (read-only in final PDF)

Low Priority:
- Not critical to functionality
- Can be "Phase 2" feature
```

### 2. Component Descriptions
```
Current: "Microprocessor (ARM-based)"
User Edit: Add supplier name, specifications, etc.

Why Nice-to-Have:
- Helpful for internal records/audit trail
- Makes certificate more useful for their documentation
- Doesn't affect USMCA calculations

Low Priority:
- Can be Phase 2
```

---

## 🔐 FIELDS THAT MUST STAY LOCKED

| Field | Reason | Impact if User Changes |
|-------|--------|------------------------|
| **HS Code** | Regulatory classification | CBP audit risk |
| **MFN Rate** | Regulatory tariff | Certification accuracy |
| **Section 301 Rate** | Policy/tariff fact | Compliance risk |
| **USMCA Qualification Status** | Calculated result | Contradicts RVC/threshold |
| **Manufacturing Location** | Input validation | Changes entire qualification |
| **Company Data** | Audit trail | Identity/liability questions |

---

## 🎨 UX APPROACH (TurboTax Model)

### Preview Screen Layout
```
┌─────────────────────────────────────────────┐
│ USMCA Certificate Preview & Edit            │
├─────────────────────────────────────────────┤
│                                             │
│ COMPANY INFORMATION (Read-Only)            │
│  Company: TechFlow Electronics              │
│  Country: US                                │
│  ⓘ Click edit icon if information changed  │
│                                             │
│ ─────────────────────────────────────────  │
│                                             │
│ PRODUCT & COMPONENTS                       │
│                                             │
│  Product: Smartphone assembly              │
│  HS Code: 8517.62.00 [View on CBP] [?]    │
│  Regional Content: 72.5% [EDIT] ✎          │
│     └─ Change this if you have updated    │
│        supplier data (warning if <65%)     │
│                                             │
│  COMPONENT BREAKDOWN [EDIT] ✎              │
│  China origin:     35% [EDIT] ✎            │
│  Mexico origin:    30% [EDIT] ✎            │
│  US origin:        35% [EDIT] ✎            │
│  ├─ Total must equal 100% ✓               │
│  └─ RVC updates to 75% as you adjust      │
│                                             │
│ ─────────────────────────────────────────  │
│                                             │
│ QUALIFICATION STATUS                       │
│  ✓ QUALIFIED for USMCA Preferential Duty  │
│  Preference Criterion: [A ▼]  [EDIT] ✎   │
│  └─ A = Wholly North American              │
│     B = Regional value content ≥ threshold │
│     C = Change in tariff classification    │
│     D = Material cost reduction            │
│                                             │
│ ─────────────────────────────────────────  │
│                                             │
│ TARIFF IMPACT                              │
│  MFN Rate: 3.2%        $10,240/year       │
│  USMCA Rate: 0%        $0/year            │
│  ─────────────────────────────────────    │
│  ANNUAL SAVINGS: $10,240                   │
│                                             │
│ ─────────────────────────────────────────  │
│                                             │
│  [← Previous] [Download Certificate] [Next →]
│                                             │
│  ℹ️ You're responsible for accuracy of all │
│     information on this certificate        │
│                                             │
└─────────────────────────────────────────────┘
```

### Edit Mode (Click "EDIT" ✎ button)
```
Inline edit popup:
┌─────────────────────────────────────┐
│ Regional Value Content              │
│                                     │
│ System Calculation: 72.5%           │
│ Your RVC: [65] % [SAVE] [CANCEL]   │
│                                     │
│ ⚠️ Below 65% threshold = No USMCA  │
│ Benefit. You can proceed but        │
│ product won't qualify.              │
│                                     │
│ Explanation:                        │
│ Enter your company's calculated RVC │
│ if you have supplier documentation  │
│ that differs from our analysis.     │
│                                     │
└─────────────────────────────────────┘
```

---

## 📊 RECOMMENDED MVP SCOPE

**Phase 1 (Launch):**
- ✅ Edit RVC % (with real-time recalculation)
- ✅ Edit component origin % (with RVC auto-update)
- ✅ Edit preference criterion (with rule explanation)
- ✅ Warnings for invalid selections
- ✅ Audit trail (show original vs. edited values)

**Phase 2 (After Launch):**
- [ ] Product description edit
- [ ] Component description edit
- [ ] Export edit history/change log
- [ ] Comparison view (before/after)

**Never Add:**
- ❌ HS code edit
- ❌ Tariff rate edit
- ❌ Company data edit
- ❌ Manufacturing location edit

---

## 🔍 TRACKING FOR PRODUCT REFINEMENT

**Edits to Track:**
1. **RVC adjustments** - "System: 72.5% → User: 75%"
   - Insight: Where is AI calculation off? Which industries?

2. **Component origin adjustments** - Which components get adjusted most?
   - Insight: Do users have better supply chain data than we're capturing?

3. **Preference criterion overrides** - "System: A → User: B"
   - Insight: Are we being too aggressive in criterion determination?

4. **Validation warnings ignored** - How many proceed despite warnings?
   - Insight: Is our threshold warning helpful or ignored?

**Dashboard for You:**
```
Certificate Edit Metrics

RVC Adjustments:
- Average change: +/- 2.3%
- Most common: Increase (users adjust upward)
- Industry trend: Electronics users increase 1.5%, Automotive 0.8%

Preference Criterion:
- Override rate: 12% (users change system recommendation)
- Common change: A → B (want to be conservative)
- Insight: Maybe our A recommendations are too aggressive?

Component Percentage Changes:
- 23% of users adjust component percentages
- Most common: Increase Mexico %, decrease China %
- Insight: Users might know better suppliers than they initially reported
```

---

## ✅ FINAL RECOMMENDATION

**Go with Phase 1 MVP scope above.** It gives users the control they need while:
- ✅ Protecting your liability (clear audit trail)
- ✅ Maintaining data integrity (locked critical fields)
- ✅ Providing TurboTax UX users expect
- ✅ Generating insights for product improvement

**Start building:** Certificate preview with inline editing for RVC%, component %, and preference criterion.

