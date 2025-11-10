# UI-Only Change Guide

**For Developers/Agents Making UI Improvements**
**Project Status**: Production Locked (November 10, 2025)

---

## ✅ What You CAN Change (Safe UI-Only)

### 1. CSS Styling (`styles/globals.css`)

**Allowed:**
```css
/* ✅ Color changes */
.btn-primary {
  background-color: #0070f3;  /* Change this */
  color: white;                /* And this */
}

/* ✅ Font changes */
.form-section-title {
  font-size: 1.5rem;   /* Change this */
  font-weight: 600;    /* And this */
  font-family: 'Inter', sans-serif;  /* And this */
}

/* ✅ Spacing changes */
.dashboard-card {
  padding: 2rem;   /* Change this */
  margin: 1rem;    /* And this */
  gap: 1rem;       /* And this */
}

/* ✅ Layout changes */
.component-table {
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;  /* Change this */
  align-items: center;  /* And this */
}

/* ✅ Responsive breakpoints */
@media (max-width: 768px) {
  .workflow-container {
    flex-direction: column;  /* Change this */
  }
}

/* ✅ Animations */
.fade-in {
  animation: fadeIn 0.3s ease-in;  /* Change this */
}

/* ✅ Hover states */
.btn-primary:hover {
  background-color: #0051d5;  /* Change this */
  transform: scale(1.05);     /* Add this */
}
```

**Forbidden:**
```css
/* ❌ DO NOT add inline styles in JSX */
<div style={{ color: 'red' }}>  /* NEVER DO THIS */

/* ❌ DO NOT use Tailwind classes */
<div className="bg-blue-500 text-white p-4">  /* CONFLICTS WITH EXISTING CSS */
```

### 2. Display Text & Labels

**Allowed:**
```jsx
/* ✅ Button labels */
<button className="btn-primary">
  Analyze Components  {/* Change this text */}
</button>

/* ✅ Headings */
<h2 className="form-section-title">
  Component Origins  {/* Change this text */}
</h2>

/* ✅ Help text */
<p className="help-text">
  Enter the country where each component is manufactured.  {/* Change this */}
</p>

/* ✅ Placeholder text */
<input
  placeholder="e.g., China, Mexico, USA"  {/* Change this */}
/>

/* ✅ Tooltips */
<Tooltip content="This shows the tariff rate under USMCA">  {/* Change this */}
  <InfoIcon />
</Tooltip>

/* ✅ Error messages (display only) */
<span className="error-message">
  Please enter a valid HS code  {/* Change this */}
</span>
```

**Forbidden:**
```jsx
/* ❌ DO NOT change validation logic messages */
if (hsCode.length !== 10) {
  throw new Error("HS code must be 10 digits")  // DO NOT CHANGE - affects validation
}

/* ❌ DO NOT change API response messages */
return { error: "Invalid workflow session" }  // DO NOT CHANGE - affects error handling
```

### 3. Component Layout (HTML/JSX Structure)

**Allowed:**
```jsx
/* ✅ Rearrange elements */
<div className="workflow-step">
  <h2>Step 2</h2>
  <ComponentTable />  {/* Move this up/down */}
  <ActionButtons />   {/* Move this up/down */}
</div>

/* ✅ Add wrapper divs for styling */
<div className="button-group">
  <button>Save</button>
  <button>Cancel</button>
</div>

/* ✅ Add loading states */
{isLoading && <LoadingSpinner />}

/* ✅ Add icons */
<button className="btn-primary">
  <SaveIcon />  {/* Add icon */}
  Save Changes
</button>

/* ✅ Change grid/flex layouts */
<div className="component-grid">  {/* Change from flex to grid */}
  {components.map(c => <ComponentCard />)}
</div>
```

**Forbidden:**
```jsx
/* ❌ DO NOT change data flow */
<ComponentTable
  data={components}  // DO NOT CHANGE prop name or source
  onUpdate={handleUpdate}  // DO NOT CHANGE handler
/>

/* ❌ DO NOT change state management */
const [workflow, setWorkflow] = useState(...)  // DO NOT CHANGE state structure

/* ❌ DO NOT change API calls */
fetch('/api/ai-usmca-complete-analysis', ...)  // DO NOT CHANGE endpoint or payload
```

### 4. Accessibility Improvements

**Allowed:**
```jsx
/* ✅ ARIA labels */
<button aria-label="Analyze USMCA qualification">
  Analyze
</button>

/* ✅ ARIA descriptions */
<input
  aria-describedby="hs-code-help"
  id="hs-code"
/>
<span id="hs-code-help">Enter 10-digit HS code</span>

/* ✅ Keyboard navigation */
<div
  tabIndex={0}
  onKeyPress={(e) => e.key === 'Enter' && handleClick()}
>

/* ✅ Focus indicators */
.btn-primary:focus {
  outline: 2px solid #0070f3;
  outline-offset: 2px;
}

/* ✅ Screen reader text */
<span className="sr-only">Loading analysis results</span>
```

### 5. Visual Feedback

**Allowed:**
```jsx
/* ✅ Loading spinners */
{isLoading && (
  <div className="spinner-container">
    <Spinner />
    <p>Analyzing components...</p>
  </div>
)}

/* ✅ Success/error indicators */
{success && <SuccessMessage />}
{error && <ErrorMessage />}

/* ✅ Progress indicators */
<ProgressBar current={2} total={3} />

/* ✅ Disabled states */
<button
  className="btn-primary"
  disabled={!canProceed}
>
  Continue
</button>
```

---

## ❌ What You CANNOT Change (Frozen)

### 1. API Calls

**DO NOT modify:**
```jsx
// ❌ FROZEN - DO NOT CHANGE
const response = await fetch('/api/ai-usmca-complete-analysis', {
  method: 'POST',
  body: JSON.stringify({
    company: companyData,
    components: componentData,
    destination: destination
  })
})

// ❌ FROZEN - DO NOT CHANGE
const { qualification_status, savings, component_origins } = response.data
```

### 2. State Management

**DO NOT modify:**
```jsx
// ❌ FROZEN - DO NOT CHANGE
const [workflowData, setWorkflowData] = useState({
  company: null,
  components: [],
  destination: null,
  results: null
})

// ❌ FROZEN - DO NOT CHANGE
useEffect(() => {
  const saved = localStorage.getItem('workflow_session')
  if (saved) setWorkflowData(JSON.parse(saved))
}, [])
```

### 3. Data Transformations

**DO NOT modify:**
```jsx
// ❌ FROZEN - DO NOT CHANGE
const enrichedComponents = components.map(c => ({
  ...c,
  mfn_rate: c.mfn_rate || 0,
  section_301: c.section_301 || 0,
  total_rate: (c.mfn_rate || 0) + (c.section_301 || 0),
  savings_percentage: calculateSavings(c)
}))
```

### 4. Validation Logic

**DO NOT modify:**
```jsx
// ❌ FROZEN - DO NOT CHANGE
const validateHSCode = (code) => {
  if (!code || code.length !== 10) {
    return { valid: false, error: "HS code must be 10 digits" }
  }
  return { valid: true }
}

// ❌ FROZEN - DO NOT CHANGE
if (destination !== 'US' && destination !== 'CA' && destination !== 'MX') {
  throw new Error('Invalid destination - USMCA only')
}
```

### 5. Database Queries

**DO NOT modify:**
```jsx
// ❌ FROZEN - DO NOT CHANGE
const { data: workflow } = await supabase
  .from('workflow_sessions')
  .select('*')
  .eq('user_id', userId)
  .single()
```

### 6. Calculation Logic

**DO NOT modify:**
```jsx
// ❌ FROZEN - DO NOT CHANGE
const calculateRVC = (components, fobValue) => {
  const nonOriginating = components.reduce((sum, c) => {
    if (c.origin !== 'US' && c.origin !== 'CA' && c.origin !== 'MX') {
      return sum + c.value
    }
    return sum
  }, 0)

  return ((fobValue - nonOriginating) / fobValue) * 100
}
```

---

## 🔍 How to Verify Your Change is Safe

### Before Making Change:

Ask yourself:
- [ ] Is this ONLY changing visual appearance?
- [ ] Am I modifying a CSS file or JSX styling attributes?
- [ ] Am I changing display text (not validation messages)?
- [ ] Am I NOT touching any API calls?
- [ ] Am I NOT touching any state management?
- [ ] Am I NOT touching any calculations?
- [ ] Am I NOT touching any database queries?

**If you answered YES to all questions above, your change is probably safe.**

**If you answered NO to ANY question, STOP and check PROJECT_LOCKDOWN.md.**

### Testing Checklist:

After making UI change, verify:
- [ ] No console errors in browser DevTools
- [ ] All buttons still work
- [ ] All forms still submit
- [ ] All data still displays correctly
- [ ] No layout breaking at mobile/tablet/desktop sizes
- [ ] No accessibility regressions (keyboard nav, screen readers)

### Quick Test Procedure:

```bash
# 1. Start dev server
npm run dev:3001

# 2. Navigate to http://localhost:3001

# 3. Test critical flows:
# - Login/register
# - USMCA workflow (all 3 steps)
# - Alerts page
# - Certificate download

# 4. Check browser console for errors

# 5. If all pass, commit
git add .
git commit -m "ui: [description]"
git push
```

---

## 📝 Examples of Safe UI Changes

### Example 1: Change Button Colors

**File**: `styles/globals.css`

```css
/* BEFORE */
.btn-primary {
  background-color: #0070f3;
  color: white;
}

/* AFTER - SAFE ✅ */
.btn-primary {
  background-color: #0051d5;  /* Darker blue */
  color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);  /* Add shadow */
}

.btn-primary:hover {
  background-color: #003d99;  /* Even darker on hover */
  transform: translateY(-1px);  /* Subtle lift effect */
}
```

**Testing**: Click all buttons, verify they still work.

### Example 2: Improve Form Layout

**File**: `components/workflow/CompanyInformationStep.js`

```jsx
// BEFORE
<div className="form-section">
  <input name="company_name" />
  <input name="company_country" />
  <input name="destination" />
</div>

// AFTER - SAFE ✅
<div className="form-section">
  <div className="form-row">
    <div className="form-field">
      <label htmlFor="company_name">Company Name</label>
      <input id="company_name" name="company_name" />
    </div>
  </div>

  <div className="form-row">
    <div className="form-field half-width">
      <label htmlFor="company_country">Your Country</label>
      <input id="company_country" name="company_country" />
    </div>

    <div className="form-field half-width">
      <label htmlFor="destination">Destination</label>
      <input id="destination" name="destination" />
    </div>
  </div>
</div>
```

**CSS Addition**:
```css
.form-row {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.form-field {
  display: flex;
  flex-direction: column;
}

.half-width {
  flex: 1;
}
```

**Testing**: Fill out form, submit, verify data still saves correctly.

### Example 3: Add Loading State

**File**: `components/workflow/ComponentOriginsStepEnhanced.js`

```jsx
// BEFORE
<button onClick={handleAnalyze}>
  Analyze Components
</button>

// AFTER - SAFE ✅
<button
  onClick={handleAnalyze}
  disabled={isAnalyzing}
  className={isAnalyzing ? 'btn-primary loading' : 'btn-primary'}
>
  {isAnalyzing ? (
    <>
      <Spinner size="small" />
      Analyzing...
    </>
  ) : (
    'Analyze Components'
  )}
</button>
```

**CSS Addition**:
```css
.btn-primary.loading {
  opacity: 0.6;
  cursor: wait;
}

.spinner {
  display: inline-block;
  width: 1rem;
  height: 1rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

**Testing**: Click analyze button, verify:
- Button disables during analysis
- Spinner shows
- Analysis still completes
- Results still display

---

## 🚫 Examples of FORBIDDEN Changes

### Example 1: Changing API Endpoint ❌

```jsx
// ❌ FORBIDDEN - DO NOT DO THIS
const response = await fetch('/api/new-tariff-analysis', {  // Changed endpoint
  method: 'POST',
  body: JSON.stringify(data)
})
```

**Why forbidden**: Changes production API, breaks existing workflows, requires backend changes.

### Example 2: Modifying State Structure ❌

```jsx
// ❌ FORBIDDEN - DO NOT DO THIS
const [workflowData, setWorkflowData] = useState({
  companyInfo: null,  // Changed from 'company'
  productList: [],    // Changed from 'components'
  target: null        // Changed from 'destination'
})
```

**Why forbidden**: Breaks data flow, localStorage compatibility, API payloads.

### Example 3: Changing Calculation ❌

```jsx
// ❌ FORBIDDEN - DO NOT DO THIS
const calculateSavings = (component) => {
  const mfnRate = component.mfn_rate || 0
  const usmcaRate = component.usmca_rate || 0
  const section301 = component.section_301 || 0

  // WRONG: Changed calculation logic
  return (mfnRate - usmcaRate + section301) / mfnRate * 100
}
```

**Why forbidden**: Changes financial calculations users rely on for business decisions.

### Example 4: Adding New Validation ❌

```jsx
// ❌ FORBIDDEN - DO NOT DO THIS
const validateCompanyName = (name) => {
  // WRONG: Added new validation
  if (name.length < 3) {
    return { valid: false, error: "Company name too short" }
  }
  return { valid: true }
}
```

**Why forbidden**: Changes validation rules, could block existing users, affects API contracts.

---

## 📚 Approved CSS Class Reference

**Use these existing classes (from `styles/globals.css`):**

### Layout
- `.workflow-container` - Main workflow wrapper
- `.form-section` - Form section container
- `.dashboard-card` - Card component
- `.component-table` - Component data table

### Buttons
- `.btn-primary` - Primary action button
- `.btn-secondary` - Secondary action button
- `.btn-danger` - Destructive action button
- `.btn-ghost` - Subtle button

### Typography
- `.form-section-title` - Section heading
- `.help-text` - Helper text
- `.error-message` - Error message
- `.success-message` - Success message

### Forms
- `.form-field` - Form field wrapper
- `.form-label` - Form label
- `.form-input` - Text input
- `.form-select` - Select dropdown

### Alerts
- `.alert-card` - Alert container
- `.alert-badge` - Alert badge
- `.severity-critical` - Critical severity
- `.severity-high` - High severity
- `.severity-medium` - Medium severity
- `.severity-low` - Low severity

### Utilities
- `.loading-spinner` - Loading indicator
- `.fade-in` - Fade in animation
- `.sr-only` - Screen reader only text
- `.disabled` - Disabled state

---

## ✅ Safe Change Workflow

1. **Identify Change Type**
   - Is it CSS only? → Safe
   - Is it display text only? → Safe
   - Is it layout only (no data flow change)? → Safe
   - Is it anything else? → Check PROJECT_LOCKDOWN.md

2. **Make Change**
   - Edit CSS file OR JSX styling attributes
   - Do NOT touch API calls, state, calculations, validations

3. **Test Locally**
   ```bash
   npm run dev:3001
   # Test in browser
   # Check console for errors
   # Test critical flows
   ```

4. **Commit & Deploy**
   ```bash
   git add .
   git commit -m "ui: improved button styling"  # Use 'ui:' prefix
   git push  # Auto-deploys to Vercel
   ```

5. **Verify Production**
   - Visit https://triangle-trade-intelligence.vercel.app
   - Test same flows as local
   - Monitor for errors

---

## 🆘 When to Ask for Help

**Ask owner if:**
- You need to modify an API endpoint
- You need to change state structure
- You need to add new validation rules
- You need to change calculations
- You need to modify database queries
- You're unsure if change is safe
- Pre-commit hook blocks your commit
- Tests start failing after your change

**Don't ask if:**
- Changing CSS colors/fonts/spacing
- Adding loading spinners
- Improving accessibility
- Rearranging UI elements (no data flow change)
- Fixing typos in display text

---

## 🎯 Quick Decision Tree

```
Do you want to change something?
│
├─ Is it CSS styling? → ✅ SAFE - Go ahead
│
├─ Is it display text? → ✅ SAFE - Go ahead
│
├─ Is it layout/HTML structure?
│  │
│  ├─ Does it change data flow? → ❌ FORBIDDEN - Ask owner
│  │
│  └─ Does it only change appearance? → ✅ SAFE - Go ahead
│
├─ Is it an API call? → ❌ FORBIDDEN - Ask owner
│
├─ Is it state management? → ❌ FORBIDDEN - Ask owner
│
├─ Is it a calculation? → ❌ FORBIDDEN - Ask owner
│
├─ Is it validation logic? → ❌ FORBIDDEN - Ask owner
│
└─ Not sure? → ❌ FORBIDDEN - Ask owner
```

---

**Remember: When in doubt, ask. The project is working perfectly. Don't break it.**

**Priority: Production stability > New features > UI polish**
