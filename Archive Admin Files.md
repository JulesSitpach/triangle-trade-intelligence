# Archive Admin Files - Cristina/Jorge Cleanup Prompt

## TASK: Identify and Archive Dead Admin Code

You are tasked with finding and archiving all files related to the old multi-stage admin workflow (Cristina document review + Jorge intake) that is no longer used in the Triangle Intelligence Platform.

## SEARCH PATTERNS

### 1. **File Name Patterns**
Search for files containing these terms (case-insensitive):
- `cristina`
- `jorge` 
- `admin-dashboard`
- `document-review`
- `intake-notes`
- `stage` (when related to workflow)
- `workflow`
- `approval`
- `multi-user`
- `team-member`

### 2. **Code Content Patterns**
Search file contents for:
- `cristina` (variable names, comments, strings)
- `jorge` (variable names, comments, strings)
- `Stage 2` or `Stage 1` (workflow references)
- `document review`
- `intake notes`
- `compliance flag`
- `team member role`
- `admin access`
- `reviewer assignment`

### 3. **Database Patterns**
Look for:
- Table names with `admin`, `review`, `stage`, `workflow`
- Columns with `reviewer_id`, `stage_status`, `approval_status`
- Queries referencing Cristina/Jorge specific functionality

### 4. **API Endpoint Patterns**
Search for routes:
- `/api/admin/`
- `/api/cristina/`
- `/api/jorge/`
- `/api/review/`
- `/api/workflow/`
- `/api/stage/`

## COMPREHENSIVE FILE AUDIT

### **Frontend Files to Check:**
```
/components/admin/
/components/cristina/
/components/jorge/
/components/workflow/
/pages/admin/
/pages/cristina/
/pages/jorge/
/lib/admin/
/lib/workflow/
/lib/services/*admin*
/lib/services/*review*
/lib/services/*workflow*
```

### **Backend Files to Check:**
```
/pages/api/admin/
/pages/api/cristina/
/pages/api/jorge/
/pages/api/review/
/pages/api/workflow/
/lib/services/*admin*
/lib/services/*review*
/lib/database/*admin*
/lib/database/*workflow*
```

### **Database Files to Check:**
```
/lib/database/admin-queries.js
/lib/database/workflow-queries.js
/lib/database/team-member-queries.js
/migrations/*admin*
/migrations/*workflow*
/supabase/migrations/*admin*
```

### **Configuration Files to Check:**
```
/lib/config/admin-config.js
/lib/config/workflow-config.js
/lib/permissions/admin-permissions.js
/lib/auth/admin-auth.js
```

## DEPENDENCY ANALYSIS

For each file found, check for:

### **1. Import Dependencies**
```javascript
// Find files that import the admin code
import { cristinaReview } from './admin/cristina-service'
import { jorgeIntake } from './admin/jorge-service'
import { workflowStage } from './workflow/stage-manager'
```

### **2. Export Dependencies**
```javascript
// Find what the admin files export
export { documentReview, complianceFlags }
export default CristinaAdminDashboard
```

### **3. Database Dependencies**
```sql
-- Find tables/columns that depend on admin workflow
SELECT * FROM document_reviews WHERE reviewer_id = 'cristina'
SELECT * FROM intake_notes WHERE created_by = 'jorge'
```

### **4. Route Dependencies**
```javascript
// Find pages/components that route to admin areas
router.push('/admin/cristina')
href="/jorge/intake"
```

## ARCHIVE STRATEGY

### **Create Archive Structure:**
```
/archived/
├── admin-workflow/           # Main archive folder
│   ├── components/          # Dead UI components
│   ├── services/            # Dead service files  
│   ├── api-endpoints/       # Dead API routes
│   ├── database/            # Dead database files
│   ├── dependencies.md     # List of files that imported these
│   └── removal-impact.md   # What broke when removing
```

### **Documentation to Create:**
1. **`dependencies.md`** - List every file that imported admin code
2. **`removal-impact.md`** - What features/pages will break
3. **`archive-manifest.md`** - Complete list of archived files
4. **`restoration-guide.md`** - How to restore if needed

## SAFE REMOVAL PROCESS

### **Phase 1: Identification**
```bash
# Search commands to run:
grep -r -i "cristina" . --exclude-dir=node_modules
grep -r -i "jorge" . --exclude-dir=node_modules  
grep -r -i "document.review" . --exclude-dir=node_modules
grep -r -i "stage.*workflow" . --exclude-dir=node_modules
find . -name "*admin*" -not -path "./node_modules/*"
find . -name "*cristina*" -not -path "./node_modules/*"
find . -name "*jorge*" -not -path "./node_modules/*"
```

### **Phase 2: Dependency Mapping**
For each file found:
1. **List what imports it:** `grep -r "import.*filename" .`
2. **List what it imports:** Check import statements in the file
3. **List what calls it:** `grep -r "functionName\|ComponentName" .`

### **Phase 3: Safe Archival**
1. **Copy files to archive folder** (don't delete yet)
2. **Comment out imports** in dependent files
3. **Test the platform** - run full USMCA analysis
4. **Fix any broken dependencies**
5. **Delete original files** only after testing passes

### **Phase 4: Cleanup**
1. **Remove dead imports** from package.json
2. **Remove dead database columns** (after backup)
3. **Remove dead environment variables**
4. **Update documentation** to reflect new architecture

## VALIDATION CHECKLIST

After archival, verify:
- [ ] USMCA analysis still works end-to-end
- [ ] No broken imports or 404 errors
- [ ] Database queries still execute
- [ ] All current features functional
- [ ] Bundle size reduced
- [ ] No console errors
- [ ] All tests pass

## RISK MITIGATION

### **Before Starting:**
- [ ] Full database backup
- [ ] Git commit current working state
- [ ] Document current functionality
- [ ] Test suite passes
- [ ] Staging environment available

### **During Process:**
- [ ] Archive first, delete later
- [ ] Test after each major removal
- [ ] Keep dependency documentation
- [ ] Monitor for broken functionality

### **After Completion:**
- [ ] Performance testing (should be faster)
- [ ] Full regression testing
- [ ] Update team on changes
- [ ] Document new simplified architecture

## EXPECTED OUTCOMES

### **Performance Improvements:**
- Faster bundle builds
- Reduced memory usage
- Smaller client-side bundles
- Cleaner codebase

### **Maintenance Benefits:**
- Less code to maintain
- Clearer architecture
- Easier onboarding for new developers
- Reduced complexity

## OUTPUT FORMAT

Create these files:
1. **`archive-plan.md`** - List of files to archive
2. **`dependency-map.md`** - What depends on what
3. **`removal-script.sh`** - Commands to safely archive
4. **`test-checklist.md`** - Validation steps after removal

## EXECUTE THIS AUDIT

Run the search commands above and create a comprehensive report of all Cristina/Jorge admin files and their dependencies. Focus on identifying the complete scope before making any changes.