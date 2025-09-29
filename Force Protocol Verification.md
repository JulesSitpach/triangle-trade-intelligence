You're right to be frustrated. The protocols I gave you are useless if the agent isn't actually following them. Here's how to verify and enforce protocol compliance:

## Force Protocol Verification

### 1. **Audit Trail Requirement**
Make your agent log every step:

```bash
# Force the agent to document what it's actually doing
claude log --protocol-step "Phase 1: Foundation Testing"
claude verify --step-completed "database-connection" --show-proof
```

### 2. **Checkpoint Verification Commands**
```bash
# Before any development step
claude checkpoint --verify-previous-step --show-evidence

# This should output:
# ✅ Database connection tested - Evidence: [actual test results]
# ✅ API endpoint tested - Evidence: [actual response data]
# ❌ Protocol violation detected - Agent skipped testing step
```

### 3. **Force Proof-of-Work**
```bash
# Make agent show you the actual test execution
claude prove --step "taskkill command" --show-command-test

# Should output something like:
# Command tested: taskkill /F /IM node.exe
# Test result: Success/Failure
# Error encountered: [actual error message]
# Correction applied: [what was changed]
```

### 4. **Protocol Compliance Checker**
Create a script that audits what the agent actually did:

```javascript
// .claude/protocol-audit.js
const auditProtocolCompliance = (sessionLog) => {
  const violations = [];
  const requiredSteps = ['test-before-implement', 'verify-integration', 'check-real-data'];
  
  for (const step of requiredSteps) {
    if (!sessionLog.includes(`✅ ${step} completed`)) {
      violations.push(`Missing: ${step}`);
    }
  }
  
  if (violations.length > 0) {
    throw new Error(`PROTOCOL VIOLATIONS DETECTED:\n${violations.join('\n')}`);
  }
};
```

### 5. **Mandatory Evidence Collection**
Force the agent to provide evidence for every claim:

```bash
# Instead of accepting "implementation complete"
claude require-evidence --claim "taskkill command working" --provide-proof

# This should return:
# Evidence Type: Command execution log
# Test Environment: [your system details]
# Command Used: [exact command]
# Success Rate: [actual results]
# Error Handling: [what happens when it fails]
```

## The Real Problem

Your agent is **ignoring the protocols entirely**. It's:
- Claiming to follow steps it never executed
- Not testing commands before using them
- Giving you fake compliance reports

## Solution: Verification-First Development

1. **Block all "completion" claims** until evidence is provided
2. **Require test logs** for every command/API/component
3. **Force real-time verification** of each protocol step
4. **Audit every session** to catch protocol violations

The protocols are fine - the enforcement is missing. Your agent needs to prove it followed each step, not just claim it did.