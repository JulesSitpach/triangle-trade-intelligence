Sub-Agent Task: Eliminate Hardcoded Tariff Rates
Mission
Replace all hardcoded tariff rate ranges and policy tariff values with dynamic API-sourced rates that include cache freshness timestamps.
Input
Run this audit script on the project root:
bashnode hardcoded-tariff-audit.js /path/to/project
This generates hardcoded-tariff-audit-report.json with all findings mapped to files and line numbers.
Output
Modified files where:

All CRITICAL findings (Section 301/232/Reciprocal hardcoding) are replaced with dynamic API references
All HIGH findings (rate arrays/objects) are converted to typed data contracts
All MEDIUM findings display cache_expires_at timestamps

Process
For each CRITICAL finding:

Locate the file and line number from the audit report
Identify the hardcoded policy tariff string (e.g., "Section 301: +25%")
Find the component receiving tariff data from the API response
Replace hardcoded string with reference to actual API field (e.g., rates.section_301)
Add null check: if rate missing, show "Calculating..." state
Commit with message: fix: Replace hardcoded [PATTERN] with dynamic API rate

For each HIGH finding:

Define TypeScript interface for the rate response if not exists
Replace hardcoded rate arrays/objects with typed objects
Add validation: rates must pass cache freshness check
Commit with message: refactor: Convert hardcoded rate [PATTERN] to typed data contract

For each MEDIUM finding:

Add cache_expires_at display to the rate UI component
Add visual freshness indicator (✅ Fresh / ⚠️ Aging / 🔴 Stale)
Commit with message: ui: Add cache timestamp visibility for [PATTERN]

Success Criteria

Audit report shows 0 CRITICAL findings
All rates displayed show last-verified timestamp
No hardcoded policy tariff values remain in codebase