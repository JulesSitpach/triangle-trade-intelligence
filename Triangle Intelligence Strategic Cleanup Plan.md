# Triangle Intelligence Strategic Cleanup Plan

## 🎯 Cleanup Objectives
- Remove complex multi-stage journey components
- Keep core UI framework and language support
- Preserve essential USMCA compliance functions
- Maintain Next.js/React foundation
- Streamline to single workflow approach

## ✅ KEEP - Core Infrastructure & UI
### Framework & Languages
- `next.config.js` ✅
- `tsconfig.json` ✅  
- `package.json` ✅ (review dependencies)
- `tailwind.config.js` ✅
- `.env` files ✅
- Language support files ✅

### Essential UI Components
- `components/TriangleLayout.js` ✅ 
- `components/LanguageSwitcher.js` ✅
- `components/ErrorBoundary.js` ✅
- `components/Icons.js` ✅
- `components/LegalFooter.js` ✅
- Core styling in `styles/` ✅

### Essential API Endpoints  
- `pages/api/simple-classification.js` ✅ (HS Code classification)
- `pages/api/simple-usmca-compliance.js` ✅ (USMCA rules)
- `pages/api/simple-savings.js` ✅ (Tariff calculator)
- `pages/api/status.js` ✅

## ❌ DELETE - Complex Systems
### Multi-Stage Journey Pages
- `pages/foundation.js` ❌ (multi-stage complexity)
- `pages/foundation-dynamic.js` ❌ 
- `pages/routing.js` ❌ (complex routing analysis)
- `pages/hindsight.js` ❌ (over-engineered analysis)
- `pages/test-dynamic.js` ❌
- `pages/dynamic-test-simple.js` ❌

### Complex Dashboard Systems
- `pages/dashboard.js` ❌ (if overly complex)
- `pages/dashboard-hub.js` ❌ 
- `components/StandardDashboardLayout.js` ❌
- `components/UniversalDashboardWrapper.js` ❌
- `components/UniversalLayoutWrapper.js` ❌

### Over-Engineered Components
- `components/DynamicFormGenerator.js` ❌ (likely over-complex)
- `pages/api/dynamic-form-handler.js` ❌
- `pages/api/dashboard-hub-intelligence.js` ❌

### Marketing/Info Pages (Simplify)
- `pages/about.js` 📝 (simplify)
- `pages/platform.js` 📝 (simplify) 
- `pages/product.js` 📝 (simplify)
- `pages/markets.js` ❌ (not needed for USMCA focus)

## 🔄 TRANSFORM - Key Changes Needed
### Create New Core Pages
1. **Single USMCA Workflow Page** (replace multi-stage)
2. **Simple Alert Dashboard** (for regulatory alerts)
3. **Certificate Generation Page**
4. **Simplified Landing Page**

### API Endpoints to Build
1. **Certificate generation API**
2. **Regulatory alerts API** 
3. **Alert management API**

## 📋 Cleanup Execution Plan

### Phase 1: Safe Deletions (Start Here)
1. Delete test/development files
2. Remove complex dashboard wrappers
3. Clean up over-engineered form generators

### Phase 2: Page Simplification  
1. Simplify marketing pages
2. Remove multi-stage journey pages
3. Streamline API endpoints

### Phase 3: New Core Development
1. Build single USMCA workflow
2. Create alert management system
3. Implement certificate generation

## 🚨 Before Deleting - Backup Strategy
1. Git commit current state
2. Extract any useful utility functions
3. Document configuration settings
4. Test core functionality still works

## 📊 Expected Results
- **~60% code reduction** in pages/components  
- **~40% simpler** API surface
- **Single workflow** instead of multi-stage
- **Focused USMCA compliance** tool
- **Regulatory alerts** as key differentiator