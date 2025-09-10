#!/bin/bash

# Project Cleanup Script - Remove old/unused files
# Created: 2025-09-01
# IMPORTANT: You have a backup, but review before running!

echo "Triangle Project Cleanup Script"
echo "================================"
echo "This will remove old/unused files from when the project had a different direction"
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Files to be removed:${NC}"
echo ""

# 1. DUPLICATE WORKFLOW COMPONENTS
echo -e "${GREEN}Duplicate Workflow Components:${NC}"
echo "  - components/workflow/CompanyInfoStep.js (duplicate of CompanyInformationStep.js)"
echo "  - components/workflow/ComponentOriginsStep.js (replaced by ComponentOriginsStepEnhanced.js)"
echo "  - components/workflow/ProductDetailsStep.js (consolidated into ComponentOriginsStepEnhanced.js)"
echo "  - components/workflow/ProductInformationStep.js (duplicate/old version)"
echo "  - components/workflow/SupplyChainStep.js (old workflow step)"
echo "  - components/workflow/CertificateCompletionWizard.js (old wizard approach)"

# 2. KEEPING CRISIS/TRUMP TARIFF FILES (still active features)
echo -e "${GREEN}[KEEPING] Crisis/Trump Tariff Files (active features):${NC}"
echo "  - These files provide tariff monitoring alerts - keeping them"

# 3. OLD SQL SCHEMAS  
echo -e "${GREEN}Old SQL Schema Files:${NC}"
echo "  - lib/database/missing-products-schema.sql"
echo "  - lib/database/unified-tariff-view.sql"
echo "  - Note: Keeping crisis-pivot-schema.sql and tariff-monitoring-schema.sql (active features)"

# 4. OLD/DUPLICATE API ENDPOINTS
echo -e "${GREEN}Old/Duplicate API Endpoints:${NC}"
echo "  - pages/api/dynamic-hs-codes-old.js"
echo "  - pages/api/dynamic-hs-codes-simple-test.js"
echo "  - pages/api/dynamic-hs-codes-simplified.js"
echo "  - pages/api/test-search-query.js"
echo "  - pages/api/debug-search.js"

# 5. TEST FILES IN ROOT (should be in __tests__)
echo -e "${GREEN}Test Files in Root (61 files):${NC}"
echo "  - All test-*.js files in root directory"
echo "  - All debug-*.js files in root directory"
echo "  - All check-*.js files in root directory"

# 6. OLD SIMPLE VERSIONS (if replaced)
echo -e "${GREEN}Old 'Simple' Versions:${NC}"
echo "  - pages/simple-index.js"

# 7. OLD DOCUMENTATION
echo -e "${GREEN}Old Documentation/Plans:${NC}"
echo "  - Implementation Roadmap - USMCA Compliance Platform.md"
echo "  - Triangle Intelligence Strategic Cleanup Plan.md"
echo "  - Triangle Intelligence Platform Holistic Reconstruction Plan.md"
echo "  - Building a self-learning AI classification system for Triangle Intelligence.md"
echo "  - Note: Keeping crisis-related docs (might be useful for tariff monitoring context)"

echo ""
echo -e "${RED}Total files to remove: ~85 files${NC}"
echo "  (Keeping crisis/tariff monitoring features)"
echo ""

read -p "Do you want to proceed with cleanup? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]
then
    echo "Starting cleanup..."
    
    # Remove duplicate workflow components
    rm -f components/workflow/CompanyInfoStep.js
    rm -f components/workflow/ComponentOriginsStep.js
    rm -f components/workflow/ProductDetailsStep.js
    rm -f components/workflow/ProductInformationStep.js
    rm -f components/workflow/SupplyChainStep.js
    rm -f components/workflow/CertificateCompletionWizard.js
    
    # KEEPING crisis/trump files - they're active features
    echo "Keeping crisis/tariff monitoring features..."
    
    # Remove old SQL schemas
    rm -f lib/database/missing-products-schema.sql
    rm -f lib/database/unified-tariff-view.sql
    
    # Remove old API endpoints
    rm -f pages/api/dynamic-hs-codes-old.js
    rm -f pages/api/dynamic-hs-codes-simple-test.js
    rm -f pages/api/dynamic-hs-codes-simplified.js
    rm -f pages/api/test-search-query.js
    rm -f pages/api/debug-search.js
    
    # Remove test files from root
    rm -f test-*.js
    rm -f debug-*.js
    rm -f check-*.js
    rm -f alignment-*.js
    rm -f analyze-*.js
    rm -f explore-*.js
    rm -f inspect-*.js
    rm -f find-*.js
    rm -f demo-*.js
    rm -f workflow-*.js
    rm -f comprehensive-*.js
    rm -f final-*.js
    rm -f search-*.js
    
    # Remove old simple versions
    rm -f pages/simple-index.js
    
    # Remove old documentation (but keep crisis-related ones)
    # Keeping crisis docs - might be useful for tariff monitoring
    rm -f "IMMEDIATE REPAIR SOLUTION.md"
    rm -f "Implementation Roadmap - USMCA Compliance Platform.md"
    rm -f "Triangle Intelligence Strategic Cleanup Plan.md"
    rm -f "Triangle Intelligence USMCA-to-LATAM Master Plan Executive Summary.md"
    rm -f "Triangle Intelligence Platform Holistic Reconstruction Plan.md"
    rm -f "Triangle Intelligence - Agent Context Framework.md"
    rm -f "Building a self-learning AI classification system for Triangle Intelligence.md"
    rm -f "certificate with professional 9-element USMCA format.md"
    rm -f "backup dynmaic hs.md"
    rm -f "daily tariff monitoring.md"
    rm -f "comprehensive system alignment checker.md"
    
    # Remove other old files
    rm -f "01-99-2025-0-eng.accdb"
    rm -f "01-99-2025-eng.pdf"
    rm -f "2-D._Mexico_Tariff_Elimination_Schedule.pdf"
    rm -f "hts_2025_revision_19_csv.csv"
    rm -f hardcode-report.json
    rm -f Dockerfile
    rm -f docker-compose.yml
    rm -f LICENSE
    rm -f vercel.json
    rm -f nul
    
    echo -e "${GREEN}Cleanup completed!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Clear Next.js cache: rm -rf .next"
    echo "2. Reinstall dependencies: rm -rf node_modules && npm install"
    echo "3. Rebuild: npm run build"
    echo "4. Test: npm run dev"
else
    echo "Cleanup cancelled."
fi