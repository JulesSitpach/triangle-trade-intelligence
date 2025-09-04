# Component Library - Triangle Intelligence

## Overview
This document catalogs all React components in the Triangle Intelligence USMCA Compliance Platform, including their purpose, props, usage patterns, and visual testing requirements.

## Component Categories

### 1. Workflow Components (`/components/workflow/`)

#### USMCAWorkflowOrchestrator
**Purpose**: Main workflow controller managing the 3-step USMCA qualification process
**Location**: `components/workflow/USMCAWorkflowOrchestrator.js`
**Props**:
- `initialData`: Pre-populated form data
- `onComplete`: Callback when workflow completes
- `mode`: 'standard' | 'express' | 'detailed'

**Visual Tests Required**:
- All three workflow steps
- Progress indicator states
- Error states
- Loading states
- Mobile responsiveness

#### CompanyInformationStep
**Purpose**: Collect company details and business context
**Location**: `components/workflow/CompanyInformationStep.js`
**Props**:
- `data`: Current form data
- `onChange`: Form change handler
- `onNext`: Navigate to next step
- `errors`: Validation errors

**Key Features**:
- Company name input
- Business type selection
- NAICS code lookup
- Address fields
- Contact information

#### ComponentOriginsStepEnhanced
**Purpose**: Product and component data entry with HS code classification
**Location**: `components/workflow/ComponentOriginsStepEnhanced.js`
**Props**:
- `data`: Product and component data
- `onChange`: Update handler
- `onBack`: Previous step navigation
- `onNext`: Next step navigation

**Key Features**:
- Dynamic component addition
- HS code auto-suggestion
- Origin country selection
- Value percentage calculation
- AI-powered classification

#### WorkflowResults
**Purpose**: Display qualification results and generate certificates
**Location**: `components/workflow/WorkflowResults.js`
**Props**:
- `data`: Complete workflow data
- `results`: Qualification analysis
- `onReset`: Start new workflow
- `onDownload`: Generate PDF certificate

**Sub-components**:
- `QualificationSummary`
- `SavingsCalculator`
- `CertificatePreview`
- `NextSteps`

#### WorkflowProgress
**Purpose**: Visual progress indicator for workflow steps
**Location**: `components/workflow/WorkflowProgress.js`
**Props**:
- `currentStep`: 1 | 2 | 3
- `completedSteps`: Array of completed step numbers
- `stepLabels`: Custom step labels

**Visual States**:
- Completed (green check)
- Current (blue dot)
- Upcoming (gray outline)

### 2. UI Components

#### Icons
**Purpose**: Centralized icon components using Lucide React
**Location**: `components/Icons.js`
**Exports**:
- `CheckCircle`
- `AlertCircle`
- `InfoIcon`
- `ChevronRight`
- `Download`
- `RefreshCw`

#### TriangleLayout
**Purpose**: Main application layout wrapper
**Location**: `components/TriangleLayout.js`
**Props**:
- `children`: Page content
- `showNav`: Boolean to show/hide navigation
- `showFooter`: Boolean to show/hide footer

**Sections**:
- Fixed navigation header
- Main content area
- Responsive footer

### 3. Form Components

#### GuidedProductInput
**Purpose**: Guided product entry with category selection
**Location**: `components/GuidedProductInput.js`
**Props**:
- `value`: Current product description
- `onChange`: Update handler
- `businessType`: Context for suggestions
- `disabled`: Disable input

**Features**:
- Category dropdown
- Smart suggestions
- Material detection
- Application context

#### HSCodeEntry
**Purpose**: HS code input with validation and formatting
**Location**: `components/HSCodeEntry.js`
**Props**:
- `value`: Current HS code
- `onChange`: Update handler
- `onValidate`: Validation callback
- `country`: Origin country for validation

**Features**:
- Format validation
- Real-time lookup
- Alternative suggestions
- Tariff rate display

#### CategorySelector
**Purpose**: Hierarchical category selection
**Location**: `components/CategorySelector.js`
**Props**:
- `selected`: Current category
- `onChange`: Selection handler
- `categories`: Category tree data
- `multiple`: Allow multiple selection

### 4. Display Components

#### SimpleSavingsCalculator
**Purpose**: Calculate and display tariff savings
**Location**: `components/SimpleSavingsCalculator.js`
**Props**:
- `productValue`: Total value
- `mfnRate`: Standard tariff rate
- `usmcaRate`: USMCA preferential rate
- `qualified`: Boolean qualification status

**Displays**:
- Annual savings amount
- Percentage reduction
- Visual comparison chart
- ROI calculation

#### CrisisAlertBanner
**Purpose**: Display urgent tariff change notifications
**Location**: `components/CrisisAlertBanner.js`
**Props**:
- `alerts`: Array of alert objects
- `dismissible`: Allow user dismissal
- `priority`: 'high' | 'medium' | 'low'

### 5. Results Components (`/components/workflow/results/`)

#### QualificationStatus
**Purpose**: Large visual qualification result
**Location**: `components/workflow/results/QualificationStatus.js`
**Props**:
- `qualified`: Boolean
- `confidence`: Percentage
- `reasons`: Array of qualification factors

**Visual States**:
- Qualified (green check)
- Not Qualified (amber warning)
- Conditional (blue info)

#### DetailedBreakdown
**Purpose**: Component-by-component analysis
**Location**: `components/workflow/results/DetailedBreakdown.js`
**Props**:
- `components`: Array of component data
- `thresholds`: Regional content requirements
- `showDetails`: Expandable sections

#### TariffComparison
**Purpose**: Visual tariff rate comparison
**Location**: `components/workflow/results/TariffComparison.js`
**Props**:
- `mfnRate`: Standard rate
- `usmcaRate`: Preferential rate
- `currentRate`: What they pay now

#### DocumentationChecklist
**Purpose**: Required documents for qualification
**Location**: `components/workflow/results/DocumentationChecklist.js`
**Props**:
- `required`: Array of required docs
- `optional`: Array of optional docs
- `completed`: Array of completed items

## Component Testing Matrix

### Visual Regression Tests
Each component requires screenshots at:
- Mobile (375px)
- Tablet (768px)
- Desktop (1920px)

### Interaction Tests
- Click/tap all buttons
- Fill all form fields
- Navigate all steps
- Trigger all error states

### Accessibility Tests
- Keyboard navigation
- Screen reader labels
- Focus indicators
- Color contrast

### Performance Tests
- Initial render time
- Re-render optimization
- Bundle size impact
- API call efficiency

## Component Usage Patterns

### Standard Workflow
```jsx
import USMCAWorkflowOrchestrator from '../components/workflow/USMCAWorkflowOrchestrator';

function USMCAPage() {
  return (
    <TriangleLayout>
      <USMCAWorkflowOrchestrator
        mode="standard"
        onComplete={handleComplete}
      />
    </TriangleLayout>
  );
}
```

### Form with Validation
```jsx
import HSCodeEntry from '../components/HSCodeEntry';

function ProductForm() {
  const [hsCode, setHSCode] = useState('');
  const [error, setError] = useState(null);
  
  return (
    <HSCodeEntry
      value={hsCode}
      onChange={setHSCode}
      onValidate={(valid, msg) => setError(msg)}
      country="US"
    />
  );
}
```

### Results Display
```jsx
import WorkflowResults from '../components/workflow/WorkflowResults';

function ResultsPage({ data, analysis }) {
  return (
    <WorkflowResults
      data={data}
      results={analysis}
      onDownload={generatePDF}
      onReset={startNew}
    />
  );
}
```

## Component State Management

### Local State
- Form inputs
- UI toggles
- Validation errors

### Context State
- User session
- Workflow data
- Theme preferences

### Server State
- HS codes
- Tariff rates
- Qualification rules

## Component Styling

All components use custom CSS classes from `styles/globals.css`:

### Common Classes
- `.card` - Container styling
- `.btn-primary` - Primary actions
- `.form-input` - Input fields
- `.status-success` - Success states

### Component-Specific
- `.workflow-step` - Step containers
- `.result-card` - Result displays
- `.progress-indicator` - Progress UI

## Accessibility Requirements

### ARIA Labels
All interactive components must have:
- `aria-label` or `aria-labelledby`
- `role` when semantic HTML insufficient
- `aria-describedby` for help text

### Keyboard Support
- Tab navigation order
- Enter/Space activation
- Escape to cancel
- Arrow keys for selection

### Screen Reader
- Announce state changes
- Read validation errors
- Describe visual indicators

## Performance Guidelines

### Code Splitting
Large components should be lazy loaded:
```jsx
const HeavyComponent = lazy(() => import('./HeavyComponent'));
```

### Memoization
Use for expensive renders:
```jsx
const MemoizedComponent = memo(Component);
```

### Debouncing
For search and validation:
```jsx
const debouncedSearch = useMemo(
  () => debounce(search, 300),
  []
);
```

## Future Components (Planned)

### In Development
- `BatchProcessor` - Multiple product analysis
- `ComparisonTool` - Side-by-side qualification
- `HistoryViewer` - Past qualification records

### Proposed
- `TeamCollaboration` - Multi-user workflows
- `APIIntegration` - Third-party connections
- `AdvancedAnalytics` - Deep dive reporting

## Component Maintenance

### Version Control
- Semantic versioning for breaking changes
- Changelog in component file
- Deprecation warnings

### Documentation
- JSDoc comments for props
- Usage examples in Storybook
- Visual regression baselines

### Testing Coverage
- Unit tests: 80% minimum
- Integration tests for workflows
- E2E tests for critical paths

---

*Component Library Version: 2.0.0*
*Last Updated: September 2025*
*Total Components: 24 active, 3 planned*