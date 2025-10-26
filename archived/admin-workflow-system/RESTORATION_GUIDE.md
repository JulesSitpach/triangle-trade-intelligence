# Restoration Guide - Dead Admin Workflow System
**Created:** October 26, 2025
**Scope:** All 11 archived files and supporting directories
**Risk Level:** LOW - All files preserved in git history, can be restored anytime

---

## Quick Restoration

### Option 1: Restore All Files to Active Codebase
If you need to fully restore the admin workflow system to active use:

```bash
cd /path/to/triangle-simple

# Move components back
git mv archived/admin-workflow-system/components/AdminDashboard.js components/
git mv archived/admin-workflow-system/components/AdminNavigation.js components/
git mv archived/admin-workflow-system/components/shared/ServiceWorkflowTab.js components/shared/
git mv archived/admin-workflow-system/components/shared/stages/* components/shared/stages/

# Move config back
git mv archived/admin-workflow-system/config/* config/

# Move auth back
git mv archived/admin-workflow-system/lib/auth/verify-admin.js lib/auth/

# Move styles back
git mv archived/admin-workflow-system/styles/* styles/

# Commit restoration
git commit -m "restore: Restore admin workflow system from archive (4,245 lines)"

# Update admin-config import references
# (edit any files that now import these modules)
```

---

### Option 2: Restore Individual File
If you only need one specific file:

```bash
cd /path/to/triangle-simple

# Example: Restore CristinaDocumentReviewStage.js
git mv archived/admin-workflow-system/components/shared/stages/CristinaDocumentReviewStage.js \
        components/shared/stages/

git commit -m "restore: Restore CristinaDocumentReviewStage.js from archive"
```

---

### Option 3: Check Out from Git History
If you want to see what was in these files without restoring:

```bash
# View file contents without restoring
git show HEAD~5:components/AdminDashboard.js

# Show diff between archived and active version
git diff archived/admin-workflow-system/components/AdminDashboard.js

# Restore to a specific commit before archival
git checkout <commit-hash-before-archival> -- components/AdminDashboard.js
```

---

## Full Architecture Restoration Steps

**This is the complete sequence to restore the admin consulting model:**

### Step 1: Restore All Files
```bash
# Assuming you're in project root
cd /path/to/triangle-simple

# Create directories if needed
mkdir -p components/shared/stages config lib/auth styles

# Restore all files
git mv archived/admin-workflow-system/components/AdminDashboard.js components/
git mv archived/admin-workflow-system/components/AdminNavigation.js components/
git mv archived/admin-workflow-system/components/shared/ServiceWorkflowTab.js components/shared/
git mv archived/admin-workflow-system/components/shared/stages/JorgeClientIntakeStage.js components/shared/stages/
git mv archived/admin-workflow-system/components/shared/stages/CristinaDocumentReviewStage.js components/shared/stages/
git mv archived/admin-workflow-system/components/shared/stages/AIAnalysisValidationStage.js components/shared/stages/
git mv archived/admin-workflow-system/components/shared/stages/ReportGenerationStage.js components/shared/stages/
git mv archived/admin-workflow-system/config/admin-config.js config/
git mv archived/admin-workflow-system/config/jorge-services-config.js config/
git mv archived/admin-workflow-system/lib/auth/verify-admin.js lib/auth/
git mv archived/admin-workflow-system/styles/admin-workflows.css styles/

echo "✅ All files restored to active codebase"
```

### Step 2: Restore Admin Pages
```bash
# Create admin pages that import these components
# pages/admin/dashboard.js should import AdminDashboard
# pages/admin/jorge/intake.js should import ServiceWorkflowTab with JorgeClientIntakeStage
# etc.

# Copy from your previous implementation or rebuild based on REMOVAL_DECISION_LOG.md
```

### Step 3: Restore Database Tables (if deleted)
```sql
-- Restore admin-related tables if they were removed
-- Run migrations to recreate:
-- - admin_users table (email, role)
-- - workflow_approvals table (stage completion tracking)
-- - compliance_flags table (document review results)

-- Check CLAUDE.md for previous schema before archival
```

### Step 4: Update Environment Variables
```bash
# Restore admin authentication if it was removed
# .env.local should have:
ADMIN_EMAILS=cristina@company.com,jorge@company.com
ADMIN_ROLE_CONFIG="cristina:compliance_officer,jorge:intake_specialist"
```

### Step 5: Test Admin Workflow
```bash
# Test the restored workflow:
npm run dev:3001

# 1. Navigate to http://localhost:3001/admin/dashboard
# 2. Verify AdminDashboard component renders
# 3. Test Jorge intake form (Stage 1)
# 4. Test Cristina document review (Stage 2)
# 5. Test AI validation (Stage 3)
# 6. Test report generation (Stage 4)
# 7. Verify certificate download works
```

### Step 6: Deploy Restored System
```bash
git commit -m "restore: Restore admin consulting workflow system (4-stage model with Cristina/Jorge)"
git push origin testing-all-fixes
# Then merge to main for production deployment
```

---

## File Restoration Reference

### Components

#### `components/AdminDashboard.js` (355 lines)
**Imports:** React
**Exports:** AdminDashboard component
**Dependencies:** AdminNavigation, ServiceWorkflowTab
**Usage Location:** `/pages/admin/dashboard.js`
**When to Restore:** When building admin dashboard UI

#### `components/AdminNavigation.js` (84 lines)
**Imports:** React, Link
**Exports:** AdminNavigation component
**Dependencies:** None
**Usage Location:** Used by AdminDashboard
**When to Restore:** When building admin top navigation

#### `components/shared/ServiceWorkflowTab.js` (382 lines)
**Imports:** React, stage components
**Exports:** ServiceWorkflowTab component
**Dependencies:** All 4 stage components
**Usage Location:** AdminDashboard, admin pages
**When to Restore:** When restoring workflow stage system

#### `components/shared/stages/JorgeClientIntakeStage.js` (422 lines)
**Imports:** React, config
**Exports:** JorgeClientIntakeStage component
**Dependencies:** admin-config.js
**Usage Location:** ServiceWorkflowTab (stage index 0)
**When to Restore:** When restoring client intake workflow

#### `components/shared/stages/CristinaDocumentReviewStage.js` (549 lines)
**Imports:** React, Supabase
**Exports:** CristinaDocumentReviewStage component
**Dependencies:** admin-config.js, database
**Usage Location:** ServiceWorkflowTab (stage index 1)
**When to Restore:** When restoring document review workflow
**Note:** Largest component - handles file uploads and compliance flags

#### `components/shared/stages/AIAnalysisValidationStage.js` (278 lines)
**Imports:** React, USMCA analysis results
**Exports:** AIAnalysisValidationStage component
**Dependencies:** None
**Usage Location:** ServiceWorkflowTab (stage index 2)
**When to Restore:** When restoring results validation workflow

#### `components/shared/stages/ReportGenerationStage.js` (154 lines)
**Imports:** React, PDF generation
**Exports:** ReportGenerationStage component
**Dependencies:** PDF library
**Usage Location:** ServiceWorkflowTab (stage index 3)
**When to Restore:** When restoring report generation

### Configuration

#### `config/admin-config.js` (39 lines)
**Imports:** None
**Exports:** ADMIN_EMAILS, ADMIN_ROLES, WORKFLOW_CONFIG
**Dependencies:** None
**Usage Location:** verify-admin.js, stage components
**When to Restore:** When restoring admin authentication
**Key Data:**
```javascript
const ADMIN_EMAILS = ['cristina@...', 'jorge@...'];
const ADMIN_ROLES = {
  CRISTINA: 'compliance_officer',
  JORGE: 'intake_specialist'
};
```

#### `config/jorge-services-config.js` (80 lines)
**Imports:** None
**Exports:** SERVICES array
**Dependencies:** None
**Usage Location:** Pricing, service descriptions
**When to Restore:** When restoring consulting service model
**Key Data:** Service definitions with pricing and SLA

### Authentication

#### `lib/auth/verify-admin.js` (40 lines)
**Imports:** admin-config.js
**Exports:** verifyAdmin(email) function
**Dependencies:** admin-config.js
**Usage Location:** pages/api/auth/login.js (for authentication)
**When to Restore:** When restoring admin authentication
**Key Function:**
```javascript
function verifyAdmin(userEmail) {
  const isAdmin = ADMIN_EMAILS.includes(userEmail);
  return isAdmin ? { role: 'admin', ... } : null;
}
```

### Styling

#### `styles/admin-workflows.css` (1,762 lines)
**Content:** All CSS for admin workflow system
**Imported By:** None currently (archived)
**When to Restore:** When restoring admin UI components
**Import Location:** Should be imported in `pages/_app.js`:
```javascript
import '../styles/admin-workflows.css';
```

---

## Partial Restoration (Pick and Choose)

### Restore Only Components (Without Admin Auth)
```bash
# If you want the workflow stages but not the admin system:
git mv archived/admin-workflow-system/components/shared/stages/* components/shared/stages/
git mv archived/admin-workflow-system/styles/admin-workflows.css styles/

# Then manually import stages into your page
# Example: pages/my-workflow.js
import ServiceWorkflowTab from '../components/shared/ServiceWorkflowTab';
```

### Restore Only Configuration
```bash
# If you want the config but not the UI:
git mv archived/admin-workflow-system/config/* config/

# Then update your code to use the config:
import { ADMIN_EMAILS, ADMIN_ROLES } from '../config/admin-config';
```

---

## Verification After Restoration

### Checklist
- [ ] All files restored to correct locations
- [ ] No git conflicts during mv operations
- [ ] All imports work (no 404 errors)
- [ ] Admin dashboard renders without errors
- [ ] All 4 workflow stages load correctly
- [ ] Database tables exist (if needed)
- [ ] Admin authentication works
- [ ] Certificate generation works from stage 4
- [ ] Build succeeds: `npm run build`
- [ ] No TypeScript errors: `npx tsc --noEmit`

### Test Commands
```bash
# Check for import errors
npm run build

# Check for missing dependencies
npm ls

# Search for lingering references
grep -r "TODO\|FIXME" archived/admin-workflow-system/

# Verify git history preserved
git log --follow components/AdminDashboard.js
```

---

## Why This System Was Archived

### Business Reason
**Model Pivot:** Consulting model (multi-stage admin review) → Self-serve model (direct user certificate generation)

**Old Model Problems:**
- 4 stages slowed certificate generation
- Required dedicated admin staff (Cristina/Jorge)
- Scaling limited by human capacity
- High operational costs

**New Model Benefits:**
- Instant certificate generation
- Unlimited scaling (no human bottleneck)
- User takes liability (clear responsibility)
- Pure SaaS model (no services)

### Technical Reason
**Zero Dependencies:** All 11 files had zero active imports/references. Complete separation from active codebase made archival safe.

---

## Git History Navigation

### View Archived Files in Git History
```bash
# See when files were archived
git log --oneline -- archived/admin-workflow-system/

# Show specific file history (even though it's now archived)
git log --follow components/AdminDashboard.js

# Compare old version vs archived version
git show <old-commit>:components/AdminDashboard.js > /tmp/old.js
diff /tmp/old.js archived/admin-workflow-system/components/AdminDashboard.js
```

### Restore from Specific Commit
```bash
# If you want the version from before archival
git checkout <commit-hash>~1 -- components/AdminDashboard.js

# Then commit the restoration
git add components/AdminDashboard.js
git commit -m "restore: Restore AdminDashboard.js from commit <hash>"
```

---

## Common Restoration Issues

### Issue 1: Import Errors After Restoration
**Problem:** `Cannot find module 'AdminDashboard'`
**Solution:** Check that all imports are using correct relative paths
```javascript
// Wrong (outdated path from archive)
import AdminDashboard from '../../archived/admin-workflow-system/components/AdminDashboard';

// Correct (after restoration)
import AdminDashboard from '../../components/AdminDashboard';
```

### Issue 2: CSS Not Loading
**Problem:** Admin styles not applied after restoring CSS
**Solution:** Import the CSS in your main page or layout:
```javascript
// In pages/admin/dashboard.js or pages/_app.js
import '../../styles/admin-workflows.css';
```

### Issue 3: Admin Config Not Found
**Problem:** `Cannot find module 'admin-config'`
**Solution:** Verify admin-config.js was moved to config/ folder:
```bash
ls config/admin-config.js  # Should exist

# Update imports
import { ADMIN_EMAILS } from '../config/admin-config';
```

### Issue 4: Database Tables Missing
**Problem:** `relation "document_reviews" does not exist`
**Solution:** Check if admin-related tables were ever created. If needed:
```sql
-- Create missing tables (based on archived code requirements)
CREATE TABLE document_reviews (...);
CREATE TABLE compliance_flags (...);
CREATE TABLE workflow_approvals (...);
```

---

## Support & Documentation

**If you restore the admin system:**
1. Review REMOVAL_DECISION_LOG.md to understand why each file was archived
2. Read ARCHIVE_MANIFEST.md to understand the old architecture
3. Update CLAUDE.md to document the model pivot back to consulting
4. Update test suite (TEST_CHEAT_SHEET.md) for admin workflow tests
5. Consider writing a new RESTORATION_NOTES.md documenting the restoration

---

## Contact & Questions

If you need help restoring or understanding the archived system:
1. Check git blame to see why specific features were removed
2. Review commit messages from October 22-26, 2025
3. Consult REMOVAL_DECISION_LOG.md for business justification
4. Check if database schema exists for archived features

---

**Last Updated:** October 26, 2025
**Archive Status:** ✅ Complete, safe for restoration anytime
**Git History:** ✅ Fully preserved (used `git mv` not `rm`)
**Rollback Difficulty:** ✅ Easy (simple git commands)
