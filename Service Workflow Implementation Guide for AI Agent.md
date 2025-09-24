# Service Workflow Implementation Guide for AI Agent

## 🎯 Mission: Build Service Dashboards Using Supplier Sourcing as Template

You are tasked with implementing service workflows for the Triangle Intelligence Platform. Use the existing **Supplier Sourcing** workflow as your foundation template to build other service dashboards efficiently and consistently.

---

## 📋 Project Context

**Base Project:** `D:\bacjup\triangle-simple`
**Reference Workflow:** `components\jorge\SupplierSourcingTab.js` 
**Target Pattern:** Flexible 2/3/4-stage workflows based on service complexity

### Key Success Metrics:
- ✅ Consistent UI/UX across all services
- ✅ Natural complexity levels (not forced 4-stage)
- ✅ Reusable components and patterns
- ✅ Professional workflow progression
- ✅ AI report generation integration

---

## 🏗️ Architecture Foundation

### Service Complexity Levels
Use the **natural complexity** approach already defined in the codebase:

```javascript
// From TradeFlow Service Dashboards.md
🟢 2-Stage Services: Quick & Simple ($150-200)
  - HS Classification
  - Monthly Support

🔵 3-Stage Services: Standard Process ($200-450)  
  - USMCA Certificate Generation
  - Document Review & Validation
  - Crisis Response

🟣 4-Stage Services: Complex Research ($400-650)
  - Supplier Sourcing (✅ COMPLETED - YOUR TEMPLATE)
  - Manufacturing Feasibility 
  - Market Entry Strategy
```

### Component Structure to Follow
```
components/
├── shared/
│   ├── UniversalWorkflowModal.js     ← CREATE THIS
│   ├── IntakeFormModal.js            ← ALREADY EXISTS
│   └── DynamicAIReportButton.js      ← ALREADY EXISTS
├── jorge/
│   ├── SupplierSourcingTab.js        ← YOUR TEMPLATE
│   ├── ManufacturingFeasibilityTab.js ← TO BUILD
│   └── MarketEntryTab.js             ← TO BUILD
└── cristina/
    ├── USMCACertificatesTab.js       ← TO BUILD
    ├── HSClassificationTab.js        ← TO BUILD
    ├── DocumentReviewTab.js          ← TO BUILD
    ├── MonthlySupportTab.js          ← TO BUILD
    └── CrisisResponseTab.js          ← TO BUILD
```

---

## 🔄 Step-by-Step Implementation Process

### Phase 1: Extract Common Pattern (PRIORITY 1)

**1.1 Create Universal Workflow Modal**
```javascript
// components/shared/UniversalWorkflowModal.js
import React, { useState } from 'react';

const UniversalWorkflowModal = ({ 
  isOpen, 
  onClose, 
  serviceConfig, 
  request,
  onComplete 
}) => {
  const [currentStage, setCurrentStage] = useState(1);
  const [formData, setFormData] = useState({});
  const [collectedData, setCollectedData] = useState({});

  // Dynamic stage progression based on serviceConfig.totalStages (2, 3, or 4)
  // Reuse the exact pattern from SupplierSourcingTab.js
  
  return (
    <div className="modal-overlay">
      <div className="modal-content sourcing-modal">
        {/* Progress indicator - adapts to 2, 3, or 4 stages */}
        <div className="verification-progress">
          <div className="progress-steps">
            {Array.from({ length: serviceConfig.totalStages }, (_, i) => i + 1).map((stage) => (
              <div key={stage} className={`step ${currentStage >= stage ? 'active' : ''}`}>
                {stage}. {serviceConfig.stageNames[stage]}
              </div>
            ))}
          </div>
        </div>
        
        {/* Stage content - dynamically rendered */}
        <div className="verification-form">
          {serviceConfig.stageComponents[currentStage]}
        </div>
      </div>
    </div>
  );
};
```

**1.2 Create Service Configuration Files**
```javascript
// config/workflows/service-configs.js
export const serviceConfigurations = {
  'supplier-sourcing': {
    totalStages: 4,
    price: 500,
    stageNames: {
      1: 'Client Context',
      2: 'Network Research', 
      3: 'Validation Analysis',
      4: 'Connection Report'
    },
    // Copy exact logic from SupplierSourcingTab.js
  },
  
  'manufacturing-feasibility': {
    totalStages: 4,
    price: 650,
    stageNames: {
      1: 'Requirements Collection',
      2: 'Location Analysis',
      3: 'Cost Analysis', 
      4: 'Feasibility Report'
    }
  },
  
  'usmca-certificate': {
    totalStages: 3,
    price: 200,
    stageNames: {
      1: 'Product Documentation',
      2: 'Expert Validation',
      3: 'Certificate Generation'
    }
  },
  
  'hs-classification': {
    totalStages: 2,
    price: 150,
    stageNames: {
      1: 'Product Documentation',
      2: 'Classification & Delivery'
    }
  }
};
```

### Phase 2: Build Individual Service Components

**COPY-PASTE STRATEGY:** Use SupplierSourcingTab.js as your template and modify the specific content while keeping the structure identical.

**2.1 Manufacturing Feasibility (4-Stage)**
```javascript
// components/jorge/ManufacturingFeasibilityTab.js

// 🔄 COPY: SupplierSourcingTab.js structure
// 🔧 MODIFY: Stage content and AI prompts
// ✅ KEEP: Modal structure, progress bars, button patterns

// Stage 1: Requirements Collection
// - Manufacturing requirements form
// - Investment budget details  
// - Timeline requirements

// Stage 2: Location Analysis  
// - Regional assessment
// - Infrastructure evaluation
// - Labor market analysis

// Stage 3: Cost Analysis
// - Setup costs calculation
// - Operating expense projections
// - USMCA benefits assessment

// Stage 4: Feasibility Report
// - Location recommendations
// - Cost-benefit analysis
// - Implementation timeline
```

**2.2 USMCA Certificate Generation (3-Stage)**
```javascript
// components/cristina/USMCACertificatesTab.js

// 🔄 COPY: SupplierSourcingTab.js structure  
// 🔧 MODIFY: Remove Stage 2 (goes from 4 to 3 stages)
// ✅ KEEP: Modal structure, progress bars, AI integration

// Stage 1: Product Documentation
// Stage 2: Expert Validation (skip the "research" stage)  
// Stage 3: Certificate Generation
```

**2.3 HS Classification (2-Stage)**
```javascript
// components/cristina/HSClassificationTab.js

// 🔄 COPY: SupplierSourcingTab.js structure
// 🔧 MODIFY: Simplify to 2 stages only
// ✅ KEEP: Modal structure, AI integration

// Stage 1: Product Documentation
// Stage 2: Classification & Delivery (combine analysis + report)
```

### Phase 3: Service-Specific Customizations

**3.1 Database Integration Patterns**
```javascript
// Follow the exact pattern from SupplierSourcingTab.js:

const loadServiceRequests = async () => {
  try {
    const jorgeData = await richDataConnector.getJorgesDashboardData();
    
    // Change only the service type filter
    const requests = jorgeData.service_requests.manufacturing_feasibility || [];
    // OR: usmca_certificates, hs_classification, etc.
    
    setServiceRequests(requests);
  } catch (error) {
    console.error('Error loading requests:', error);
  }
};
```

**3.2 AI Report Generation**
```javascript
// Copy the exact generateSourcingReport function
// Modify only the report content and API endpoint

const generateServiceReport = async (request, pricing = null) => {
  setAiReportModal({
    isOpen: true,
    loading: true,
    type: 'manufacturing_feasibility', // ← Change this
    report: null,
    request: request
  });

  try {
    // Same loading pattern, different report content
    const reportContent = `# Manufacturing Feasibility Report - ${request.company_name}
    
    ## Executive Summary
    Comprehensive feasibility analysis for ${request.company_name} Mexico operations.
    
    // ... service-specific content
    `;
    
    // Same modal handling, different content
  } catch (error) {
    // Same error handling
  }
};
```

---

## 📝 Implementation Checklist

### For Each New Service Component:

**✅ File Structure**
- [ ] Copy SupplierSourcingTab.js to new service file
- [ ] Update component name and exports
- [ ] Modify database table references

**✅ UI Components** 
- [ ] Keep identical modal structure
- [ ] Update progress steps (2, 3, or 4 stages)
- [ ] Modify stage titles and descriptions
- [ ] Keep exact button styling and actions

**✅ Data Integration**
- [ ] Update richDataConnector service type filter
- [ ] Modify database table references
- [ ] Keep identical state management patterns

**✅ AI Integration**
- [ ] Copy AI report generation function
- [ ] Update report content template
- [ ] Modify pricing in AI button
- [ ] Keep identical modal handling

**✅ Form Handling**
- [ ] Reuse IntakeFormModal with service-specific config
- [ ] Keep identical file upload patterns  
- [ ] Maintain consistent validation logic

**✅ Workflow Logic**
- [ ] Keep identical stage progression
- [ ] Maintain consistent form data structure
- [ ] Preserve modal state management

---

## 🎨 UI/UX Consistency Requirements

### Visual Elements (Keep Identical)
- Modal overlay and sizing
- Progress bar styling and colors
- Button colors and hover states
- Form input styling
- Table layouts and spacing

### Interaction Patterns (Keep Identical)  
- Stage progression (next/previous)
- Form submission handling
- File upload drag/drop
- AI report modal flow
- Email integration patterns

### Color Coding (Keep Consistent)
- 🟢 2-Stage: Green accents (`bg-green-100 text-green-700`)
- 🔵 3-Stage: Blue accents (`bg-blue-100 text-blue-700`)  
- 🟣 4-Stage: Purple accents (`bg-purple-100 text-purple-700`)

---

## 🔧 Technical Implementation Notes

### File Naming Convention
```
components/jorge/
  SupplierSourcingTab.js          ← Template (✅ Complete)
  ManufacturingFeasibilityTab.js  ← Copy and modify
  MarketEntryTab.js               ← Copy and modify

components/cristina/  
  USMCACertificatesTab.js         ← Copy and modify
  HSClassificationTab.js          ← Copy and modify  
  DocumentReviewTab.js            ← Copy and modify
  MonthlySupportTab.js            ← Copy and modify
  CrisisResponseTab.js            ← Copy and modify
```

### State Management Pattern (Keep Identical)
```javascript
// Every service component should have identical state structure:
const [serviceRequests, setServiceRequests] = useState([]);
const [workflowModal, setWorkflowModal] = useState({
  isOpen: false,
  request: null,
  currentStage: 1,
  formData: {},
  collectedData: {}
});
const [aiReportModal, setAiReportModal] = useState({
  isOpen: false,
  loading: false,
  type: '',
  report: null,
  request: null
});
```

### Import Pattern (Keep Consistent)
```javascript
// Standard imports for every service component:
import { useState, useEffect } from 'react';
import { richDataConnector } from '../../lib/utils/rich-data-connector.js';
import { DynamicAIReportButton } from '../../components/shared/DynamicAIReportButton';
import IntakeFormModal from '../shared/IntakeFormModal';
import { getIntakeFormByService } from '../../config/service-intake-forms';
```

---

## 🚀 Execution Priority Order

### Week 1: Foundation
1. **UniversalWorkflowModal.js** - Extract common patterns
2. **Service configuration files** - Define all service structures
3. **Test with existing Supplier Sourcing** - Ensure no regression

### Week 2: Jorge's Services  
1. **ManufacturingFeasibilityTab.js** - 4-stage workflow
2. **MarketEntryTab.js** - 4-stage workflow
3. **Integration testing** - Ensure all Jorge services work

### Week 3: Cristina's Services (Complex)
1. **DocumentReviewTab.js** - 3-stage workflow  
2. **CrisisResponseTab.js** - 3-stage workflow
3. **USMCACertificatesTab.js** - 3-stage workflow

### Week 4: Cristina's Services (Simple)
1. **HSClassificationTab.js** - 2-stage workflow
2. **MonthlySupportTab.js** - 2-stage workflow  
3. **Final testing and refinement**

---

## ⚠️ Critical Success Factors

### 1. **Don't Reinvent - Copy and Modify**
- SupplierSourcingTab.js is your template
- Keep 90% identical, modify 10% for service-specific content
- Resist the urge to "improve" the base pattern

### 2. **Maintain Visual Consistency**
- Users should feel like they're using the same system
- Same buttons, same colors, same interactions
- Only content should be different

### 3. **Follow the Complexity Levels**
- Don't force 2-stage services into 4 stages
- Don't oversimplify 4-stage services into 2 stages
- Match stages to natural workflow complexity

### 4. **Preserve Working Patterns**
- AI integration already works - don't break it
- Database connections already work - keep identical
- State management already works - copy exactly

### 5. **Test Incrementally**
- Build one service at a time
- Test each service thoroughly before moving to next
- Ensure existing services still work after changes

---

## 📊 Quality Assurance Checklist

### Before Marking Any Service "Complete":

**✅ Functional Requirements**
- [ ] Service requests load from database
- [ ] Workflow modal opens and progresses through all stages
- [ ] Forms collect and validate data correctly
- [ ] AI report generation works with correct pricing
- [ ] File uploads process correctly
- [ ] Email integration functions properly

**✅ UI/UX Requirements**  
- [ ] Visual styling matches template exactly
- [ ] Progress indicators work for correct number of stages
- [ ] Buttons have consistent styling and behavior
- [ ] Modals open/close properly
- [ ] Responsive layout works on different screen sizes

**✅ Data Integration**
- [ ] Correct database tables are queried
- [ ] Data saves properly to database
- [ ] Service requests update status correctly
- [ ] Rich data connector integration works
- [ ] No data corruption or conflicts

**✅ Error Handling**
- [ ] Graceful handling of missing data
- [ ] Proper error messages for failed operations
- [ ] No JavaScript console errors
- [ ] Fallback behavior for API failures

---

## 🎯 Final Success Criteria

### When Implementation is Complete, You Should Have:

1. **8 Working Service Dashboards** (1 template + 7 new)
2. **Consistent User Experience** across all services
3. **Natural Complexity Levels** (2/3/4 stages as appropriate)
4. **Working AI Integration** for all services
5. **Professional Workflow Progression** for each service type
6. **Maintainable Codebase** with reusable components

### The end result should be a comprehensive service platform where:
- Users can process any Triangle Intelligence service type
- Jorge and Cristina have appropriate workflow tools
- AI generates professional reports for all services
- The system scales easily to add new services
- Code maintenance is minimal due to consistent patterns

---

## 📞 Support Resources

### Key Reference Files:
- `components/jorge/SupplierSourcingTab.js` - Your primary template
- `TradeFlow Service Dashboards.md` - Service definitions and complexity levels
- `TradeFlow Service Workflow Specifications.md` - Database and workflow specs
- `config/service-intake-forms.js` - Form configurations

### When You Need Help:
- **UI Issues**: Reference the existing SupplierSourcingTab.js styling
- **Database Issues**: Check TradeFlow Service Workflow Specifications.md  
- **Workflow Logic**: Copy the exact pattern from the template
- **AI Integration**: Use the existing generateSourcingReport as template

Remember: **Your goal is consistency and efficiency, not innovation**. The template works - use it!