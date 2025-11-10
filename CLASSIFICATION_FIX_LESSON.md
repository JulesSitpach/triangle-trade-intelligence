# Classification Fix Lesson - Nov 10, 2025

## 🎓 What We Learned Today

### The Problem (Two Phases):

**Phase 1: Band-Aid Fixes (WRONG)**
- User: "AI is having issues finding correct HS code"
- Me: *Adds keyword mappings* ("LCD display" → "flat panel display")
- User: "that is not the fix that just hard coding"
- Me: *Adds 4-step strategic framework* with material→chapter mappings
- User: "why do you keep hard codein"

**Phase 2: Task Framing Issue (ROOT CAUSE)**
- User: "**NO!** Claude Haiku 4.5 already knows this!"
- Me: *Removes all instructions, simplifies prompt*
- BUT: AI still confused - finding 8528 display codes, rejecting them, giving 45% confidence
- User: *Points to actual classification result* - "Houston, we have a problem"

---

## 🔍 Root Cause Analysis:

### What the AI Was Doing:

1. ✅ **CORRECT**: Searched database for "touchscreen LCD display"
2. ✅ **CORRECT**: Found 8528.72.64 (TV/monitor displays)
3. ❌ **WRONG**: Rejected the result with this reasoning:

> "The search results returned television/monitor codes from heading 8528, but these are not appropriate for a standalone LCD display module component."

4. ❌ **WRONG**: Defaulted to 8534.00.00 (printed circuits) - completely unrelated!
5. ❌ **WRONG**: Gave 45% confidence (knew it was wrong)

### Why the AI Rejected Correct Codes:

The prompt said:
> "The component is in imported state (not the finished product)."

The AI interpreted this as:
- "Component" = part of a larger assembly
- "Not the finished product" = can't use finished product codes
- Display codes (8524/8528) = for finished displays/TVs
- Therefore = must reject display codes for "component parts"
- Fallback = 8534 (printed circuits) because it sounds like a component code

**AI Logic**: "A display module is a COMPONENT of a phone, so I can't use display codes. Those are for FINISHED displays like TVs. I need a component code like printed circuits."

**Real HTS Rule**: Displays are classified as displays, regardless of what they'll be used in. A 7" LCD display module gets the same code whether it's for a phone, tablet, or standalone monitor.

---

## ✅ The Fix:

### Changed From (12 lines, but WRONG framing):
```javascript
TASK: Classify this component as it's imported from ${country}.
Use your search_database tool to find the correct HTS code.
The component is in imported state (not the finished product).
```

### Changed To (14 lines, CORRECT framing):
```javascript
TASK: Classify this specific part as it crosses the border from ${country}.

CRITICAL: HTS classifies by WHAT THE PART IS, not what it will be used in.
- LCD/touchscreen display → Display codes (8524/8528), NOT circuit codes
- Circuit board/PCB → Circuit codes (8534), NOT display codes
- Aluminum housing → Aluminum codes (7616), NOT circuit codes

If you find display-related codes (Chapter 8524/8528), that's CORRECT for a display part.
Don't reject display codes just because the part will be used in a phone/device.

Use your search_database tool. Trust the results if they match the part's PRIMARY FUNCTION.
```

### Key Changes:

1. **Removed**: "not the finished product" (caused confusion)
2. **Added**: "HTS classifies by WHAT THE PART IS" (clear rule)
3. **Added**: Examples showing correct classification logic (meta-instruction)
4. **Added**: "Don't reject display codes just because..." (addresses specific confusion)
5. **Added**: "Trust the results if they match PRIMARY FUNCTION" (build confidence)

---

## 📊 Results:

| Metric | Before | After |
|--------|--------|-------|
| **HS Code** | 8528.72.64 (TV apparatus) → 45% confidence → Rejected → 8534.00.00 (printed circuits) | 8524.11.00 (flat panel display modules) |
| **Confidence** | 45% (low, knew it was wrong) | 70% (medium-high, good) |
| **Reasoning** | "not appropriate for standalone component" | "classified by primary function as display" |
| **Understanding** | Confused about component vs finished product | Clear about HTS classification rule |

---

## 💡 Key Lessons:

### 1. Distinguish Between Two Types of Instructions:

**❌ Teaching Claude What It Knows (BAD - Over-instruction)**:
```javascript
// This is teaching HTS knowledge
Step 1 - Identify Core Characteristics:
- PRIMARY MATERIAL: aluminum, steel, plastic...
Step 2 - Determine HTS Chapter:
- Aluminum articles → Chapter 76
- Steel/iron articles → Chapter 73
// ... Claude already knows this!
```

**✅ Clarifying Task Framing (GOOD - Meta-instruction)**:
```javascript
// This is clarifying HOW to apply HTS rules
CRITICAL: HTS classifies by WHAT THE PART IS, not what it will be used in.
- LCD display → Display codes (8524/8528), NOT circuit codes
// This is about TASK FRAMING, not HTS knowledge
```

### 2. Examples Can Be Good (When Used Right):

**❌ Wrong Use of Examples**:
```javascript
// Teaching Claude material→chapter mappings
- Aluminum → Chapter 76
- Steel → Chapter 73
- Plastic → Chapter 39
// Claude already knows this from training
```

**✅ Right Use of Examples**:
```javascript
// Clarifying a meta-rule about HOW to classify
- LCD display → Display codes (8524/8528), NOT circuit codes
- Circuit board → Circuit codes (8534), NOT display codes
// This shows the "classify by what it IS" rule in action
```

### 3. AI Can Find Right Answer But Reject It:

The failure mode wasn't:
- ❌ "AI can't find the right codes" (AI searched and found 8528)

The failure mode was:
- ✅ "AI FOUND the right codes but REJECTED them due to task framing confusion"

**Lesson**: When AI gives low confidence despite finding good results, check if task framing is confusing the AI's application logic.

### 4. "Component" Is a Loaded Term:

Saying "classify this component" made the AI think:
- Component = subassembly
- Subassembly = can't use finished product codes
- Display codes = finished product codes
- Therefore = reject display codes

**Better framing**: "Classify this specific part as it crosses the border"
- Neutral language
- Focus on import classification
- Doesn't trigger "component vs finished product" confusion

---

## 🎯 The Principle:

### Don't Teach Claude What It Knows, Clarify How To Apply It

**Claude Already Knows**:
- ✅ HTS chapter structure (85 = electrical, 76 = aluminum, etc.)
- ✅ Display codes (8524/8528)
- ✅ Material→chapter mappings
- ✅ How to search databases strategically
- ✅ What "research" means

**What Claude Needs**:
- ✅ Clear task framing ("classify by what the part IS")
- ✅ Context (product, industry, origin, destination)
- ✅ Meta-instructions about HOW to apply rules ("don't reject display codes for components")
- ✅ Confidence builders ("trust database results if they match PRIMARY FUNCTION")

---

## 📝 Before/After Prompt Comparison:

### BEFORE (Caused 45% confidence):
```javascript
const prompt = `PRODUCT CONTEXT:
Final Product: ${overallProduct}
Industry: ${industryContext}

COMPONENT TO CLASSIFY:
"${productDescription}"
Origin: ${origin_country}

TASK: Classify this component as it's imported from ${origin_country}.
Use your search_database tool to find the correct HTS code.
The component is in imported state (not the finished product).

Return the MOST SPECIFIC applicable code as your primary hs_code.`;
```

**Problem**: "not the finished product" confused AI

### AFTER (Achieved 70% confidence):
```javascript
const prompt = `PRODUCT CONTEXT:
Final Product: ${overallProduct}
Industry: ${industryContext}

COMPONENT TO CLASSIFY:
"${productDescription}"
Origin: ${origin_country}

TASK: Classify this specific part as it crosses the border from ${origin_country}.

CRITICAL: HTS classifies by WHAT THE PART IS, not what it will be used in.
- LCD/touchscreen display → Display codes (8524/8528), NOT circuit codes
- Circuit board/PCB → Circuit codes (8534), NOT display codes

If you find display-related codes (Chapter 8524/8528), that's CORRECT for a display part.
Don't reject display codes just because the part will be used in a phone/device.

Use your search_database tool. Trust the results if they match the part's PRIMARY FUNCTION.
Return the MOST SPECIFIC applicable code as your primary hs_code.`;
```

**Solution**: Clear meta-rule + confidence builder + removed confusing language

---

## 🔮 Future Application:

### When Reviewing AI Prompts, Ask:

1. **Is this teaching Claude what it already knows?**
   - If YES: Remove it (over-instruction)
   - If NO: Keep it (useful context)

2. **Is this a meta-instruction about HOW to apply knowledge?**
   - If YES: This is good (task framing)
   - If NO: Check if it's redundant

3. **Do examples clarify a rule or teach basic knowledge?**
   - Clarify rule: ✅ Good
   - Teach basics: ❌ Remove

4. **Does the prompt use loaded terms that could confuse AI?**
   - "component" → might trigger subassembly logic
   - "not the finished product" → might trigger code rejection
   - Better: neutral framing like "this specific part"

5. **Is the AI finding correct results but rejecting them?**
   - Check task framing for confusing meta-rules
   - Add confidence builders ("trust the results if...")
   - Clarify the APPLICATION rule, not the knowledge

---

## 📚 Related Documents:

1. **AI_AGENT_PROMPT_ANALYSIS.md** - Comprehensive analysis of all AI agents
2. **RESULTS_DASHBOARD_REVIEW.md** - Identified the classification issue
3. **classification-agent.js** (lines 99-110) - The fixed prompt

---

## 🎓 Summary:

**The Journey**:
1. Band-aid fixes (keyword mappings, strategic framework) ❌
2. Removed all instructions ✅ but AI still confused
3. Found root cause: task framing confusion ("not the finished product")
4. Fixed with meta-instruction clarifying HTS rule ✅

**The Lesson**:
- Over-instruction: Teaching Claude what it knows
- Good instruction: Clarifying HOW to apply what it knows
- Examples can be good when clarifying meta-rules
- "Component" is a loaded term - use neutral language
- AI can find right answer but reject it due to task framing

**The Result**:
- 45% confidence → 70% confidence
- Wrong code (8534 printed circuits) → Correct code (8524 flat panel displays)
- Confused reasoning → Clear understanding of HTS rule

---

**Date**: November 10, 2025
**Lesson**: Trust Claude's training, clarify task framing, don't over-instruct
**Next**: Apply same principle to other AI agents (see AI_AGENT_PROMPT_ANALYSIS.md)
