# AI Agent Architecture Map - Triangle Intelligence

## 🤖 TWO SEPARATE AI SYSTEMS EXIST!

### System 1: NEW Agent Orchestration (lib/agents/) - Phase 1
**Purpose**: User-facing certificate workflow assistance

1. **BaseAgent** (`base-agent.js`)
   - Foundation class for all agents
   - Handles: Anthropic API calls, retry logic, JSON parsing, confidence scoring
   - Model: claude-3-haiku-20240307

2. **FormAssistantAgent** (`form-assistant-agent.js`)
   - Auto-populates certificate fields from user history
   - Suggests field values based on context
   - Validates user input in real-time
   - **Status**: ❌ Built but NEVER integrated

3. **ClassificationAgent** (`classification-agent.js`)
   - HS code suggestions (database + AI hybrid)
   - Searches hs_master_rebuild (34,476 codes)
   - Validates against database
   - Provides confidence scores and alternatives
   - **Status**: ✅ ACTIVE in ComponentOriginsStepEnhanced

4. **ValidationAgent** (`validation-agent.js`)
   - Pre-submission compliance checks
   - USMCA qualification validation
   - Error detection and warnings
   - Smart escalation recommendations
   - **Status**: ❌ Built but NEVER integrated

5. **AgentCoordinator** (`agent-coordinator.js`)
   - Orchestrates multi-agent workflows
   - Manages agent-to-agent communication
   - Synthesizes results from all agents
   - Performance tracking
   - **Status**: ❌ Built but NO UI connection

### System 2: EXISTING AI APIs (pages/api/) - Already Active
**Purpose**: Service delivery, supplier discovery, crisis monitoring

1. **ai-category-analysis.js** ✅
   - Analyzes product descriptions
   - Suggests categories from database
   - Learns from user contributions
   - **Status**: ACTIVE, used in admin workflows

2. **ai-classification.js** ✅
   - AI-first classification approach
   - Semantic understanding then database validation
   - Returns tariff rates
   - **Status**: ACTIVE

3. **ai-supplier-discovery.js** ✅
   - Finds real Mexican suppliers
   - Used in Jorge's service dashboard
   - Saves to partner_suppliers table
   - **Status**: ACTIVE in supplier sourcing workflow

4. **crisis-alerts.js** ✅
   - RSS monitoring integration
   - Crisis scenario simulation
   - Active alerts management
   - **Status**: ACTIVE in trade risk alerts

## 🔗 API Endpoints (pages/api/agents/)

| Endpoint | Agent | Purpose | Status |
|----------|-------|---------|--------|
| `/api/agents/form-assistant` | FormAssistantAgent | Field suggestions, validation | ✅ Active |
| `/api/agents/classification` | ClassificationAgent | HS code suggestions | ✅ Active (UI integrated) |
| `/api/agents/validation` | ValidationAgent | Compliance checks | ✅ Created |
| `/api/agents/orchestrate-certificate` | AgentCoordinator | Full orchestration | ✅ Created |
| `/api/agents/performance` | N/A | Performance metrics | ✅ Monitoring |

## 🎯 Where Agents Are Used

### Currently Integrated:
1. **ComponentOriginsStepEnhanced.js** (Step 2 of workflow)
   - ✅ ClassificationAgent: Real-time HS code suggestions per component
   - Triggers: When user types component description (10+ chars, 1.5s debounce)
   - Display: AgentSuggestionBadge below HS Code field

### Not Yet Integrated:
2. **Certificate Completion Page** (`/usmca-certificate-completion`)
   - ❌ AgentCoordinator: Full orchestration NOT connected
   - ❌ FormAssistantAgent: Auto-populate NOT used
   - ❌ ValidationAgent: Pre-submission checks NOT active

## 🔄 Agent Orchestration Flow

### Current Implementation:
```
User Types Component Description
    ↓
ClassificationAgent.suggestHSCode()
    ↓
1. Search database (hs_master_rebuild)
2. Send to Claude AI with context
3. AI suggests HS code
4. Validate against database
    ↓
Display suggestion badge
    ↓
User accepts/dismisses
```

### Intended Full Orchestration (NOT ACTIVE):
```
Certificate Data Submitted
    ↓
AgentCoordinator.orchestrateCertificateCompletion()
    ↓
Phase 1: FormAssistant → Auto-populate fields
    ↓
Phase 2: Classification → Validate HS codes
    ↓
Phase 3: Validation → Compliance check
    ↓
Phase 4: Synthesize results → Decision
    ↓
Return: enhanced data + recommendations
```

## 📊 Agent Performance Tracking

**Admin Dashboard**: `/admin/agent-performance`
- Success rates per agent
- Average confidence scores
- Escalation patterns
- Response times

## 🚨 Issues Identified

### ✅ Fixed:
1. JSON parsing errors (control characters) - FIXED
2. Agent suggestions in wrong UI location - FIXED

### ⚠️ Not Integrated:
1. **Full orchestration NOT connected** to any UI
2. FormAssistantAgent created but NEVER used
3. ValidationAgent created but NEVER used
4. `/api/agents/orchestrate-certificate` exists but NO UI calls it

### 🔍 Working:
- ✅ ClassificationAgent in ComponentOriginsStepEnhanced
- ✅ Database + AI hybrid classification
- ✅ Per-component suggestions
- ✅ Multi-component support

## 🎯 Recommendations

### Immediate Actions:
1. **Integrate FormAssistantAgent** into certificate completion
   - Auto-populate from user history
   - Reduce manual data entry

2. **Integrate ValidationAgent** into workflow
   - Pre-submission checks before USMCA analysis
   - Reduce failed submissions

3. **Connect AgentCoordinator** to UI
   - Either in certificate completion OR main workflow
   - Currently isolated - no UI integration

### Integration Priority:
**Option A**: Keep it simple - continue per-component approach
- ✅ Already working
- ✅ Users understand it
- ✅ Low complexity

**Option B**: Add full orchestration
- Need to wire up to certificate completion page
- More complex but more powerful
- Better for expert escalation flow

## 📝 Usage Patterns

### Active Pattern (Working):
```javascript
// In ComponentOriginsStepEnhanced.js
const getComponentHSSuggestion = async (index, description) => {
  const response = await fetch('/api/agents/classification', {
    method: 'POST',
    body: JSON.stringify({
      action: 'suggest_hs_code',
      productDescription: description
    })
  });
  // Display suggestion badge
}
```

### Inactive Pattern (Not Used):
```javascript
// useAgentOrchestration hook exists but NOT imported anywhere
const { orchestrationResult } = useAgentOrchestration(data, context);
// This hook is written but never called
```

## 🔗 Dependencies

- **Anthropic API**: Claude 3 Haiku for all agents
- **Supabase**: Database queries in ClassificationAgent
- **Agent Architecture**: Phase 1 complete, UI integration partial

---

**Last Updated**: 2025-09-24
**Status**: Partial - ClassificationAgent working, others dormant