# Claude Code Agent Orchestration System v2 - Setup Brief

## What This Is
A multi-agent system for Claude Code that extends context limits and eliminates silent fallbacks. Perfect for polishing projects before launch.

## Why Use It For Launch Prep
- **Extended Context**: Each agent gets fresh 200K tokens (no more `/compact` losing context)
- **Zero Fallbacks**: System asks you for decisions instead of creating placeholder code
- **Visual Verification**: Playwright screenshots verify every implementation
- **Quality Control**: Catches issues before launch with mandatory testing

## Key Components

### 1. Main Claude (Orchestrator - 200K context)
- Creates and manages todo lists
- Delegates tasks to subagents
- Tracks overall project progress
- Maintains big picture understanding

### 2. Coder Subagent (Fresh 200K per task)
- Implements one todo at a time
- Works in clean context
- **Never uses fallbacks** - invokes stuck agent on ANY problem
- Reports completion back to orchestrator

### 3. Tester Subagent (Fresh 200K per test)
- Verifies each implementation with Playwright
- Takes screenshots for visual proof
- Tests interactions (clicks, forms, navigation)
- **Never marks failing tests as passing**
- Reports pass/fail to orchestrator

### 4. Stuck Subagent (Fresh 200K per issue)
- **ONLY agent that asks user questions**
- Invoked when ANY problem occurs
- Presents clear options
- Blocks progress until user responds
- Returns decision to calling agent

## Setup Instructions

```bash
# 1. Clone the repository
git clone https://github.com/IncomeStreamSurfer/claude-code-agents-wizard-v2.git
cd claude-code-agents-wizard-v2

# 2. Start Claude Code in this directory
claude

# 3. Begin working
# The agents automatically load from .claude/ directory
```

## How to Use It

### Starting Work
Simply tell Claude what needs to be done:

```
"Polish the authentication flow - fix any edge cases and ensure error handling is perfect"
```

### The Workflow
```
YOU: Request task
  ↓
CLAUDE: Creates detailed todos using TodoWrite
  ↓
CLAUDE: Delegates todo #1 to coder
  ↓
CODER (fresh context): Implements
  ├─→ Problem? → STUCK asks you → Continue
  ↓
CODER: Reports done
  ↓
CLAUDE: Delegates to tester
  ↓
TESTER (fresh context): Playwright verification + screenshots
  ├─→ Fails? → STUCK asks you → Continue
  ↓
TESTER: Reports success
  ↓
CLAUDE: Marks complete, moves to next todo
  ↓
Repeat until all done ✅
```

## Critical Rules for Agents

**CODER AGENT:**
- Implement ONE todo at a time
- On ANY uncertainty/error: invoke stuck agent immediately
- NEVER use placeholder values, console.logs, or fallback solutions
- Report completion clearly

**TESTER AGENT:**
- Verify using Playwright with screenshots
- Test actual functionality, not just syntax
- On ANY test failure: invoke stuck agent
- NEVER mark failing tests as passing

**STUCK AGENT:**
- Present clear options to user
- Wait for user decision
- Return decision to calling agent
- ONLY agent allowed to ask questions

## Repository Structure
```
.
├── .claude/
│   ├── CLAUDE.md              # Main orchestrator instructions
│   └── agents/
│       ├── coder.md          # Coder subagent
│       ├── tester.md         # Tester subagent  
│       └── stuck.md          # Stuck subagent
├── .mcp.json                  # Playwright MCP config
└── README.md
```

## Pre-Launch Use Cases

### Perfect for:
- **Bug fixes**: Test edge cases thoroughly
- **Polish features**: Ensure everything works perfectly
- **Error handling**: Add comprehensive error handling
- **Visual QA**: Screenshot verification of all UI
- **Performance**: Optimize before launch
- **Security**: Review and patch vulnerabilities

### Example Session:
```
YOU: "Audit the entire app for launch - test all features, fix bugs, improve error handling"

CLAUDE creates todos:
  [ ] Test authentication flows (login, logout, password reset)
  [ ] Verify all API endpoints handle errors properly
  [ ] Check responsive design on all pages
  [ ] Test payment integration edge cases
  [ ] Add loading states where missing
  [ ] Verify all forms validate correctly
  [ ] Test 404 and error pages
  [ ] Check accessibility compliance
  [ ] Review security best practices
  [ ] Optimize performance bottlenecks

Then systematically works through each with:
- Coder implements fixes
- Tester verifies with screenshots
- Stuck asks you when decisions needed
```

## Pro Tips

1. **Use --dangerous-skip-permissions**: Avoid constant approval prompts
2. **Review screenshots**: Visual proof is saved for every test
3. **Trust the process**: Let Claude manage the todo list
4. **Answer stuck agent promptly**: It's waiting for your input
5. **Check progress anytime**: Todo list always visible in Claude's context

## Benefits Over Normal Claude Code

| Normal | With This System |
|--------|------------------|
| 200K limit → `/compact` → memory loss | Fresh 200K per agent → no loss |
| Silent fallbacks/placeholders | Explicit questions via stuck agent |
| No visual verification | Playwright screenshots |
| Guesses on unclear requirements | Stops and asks |
| Context pollution | Fresh context per task |

## Expected Results

- **2.5+ hours** of continuous work (500K-1M tokens used in video demo)
- **Zero placeholder code** - everything is production-ready
- **Visual proof** of every implementation
- **Human oversight** on all important decisions
- **Launch-ready quality** through systematic testing

## Quick Start Command

```bash
git clone https://github.com/IncomeStreamSurfer/claude-code-agents-wizard-v2.git && cd claude-code-agents-wizard-v2 && claude
```

Then tell Claude: "Help me prepare [project name] for launch by auditing all features, fixing bugs, and ensuring everything is production-ready"

---

**Repository**: https://github.com/IncomeStreamSurfer/claude-code-agents-wizard-v2

**Key Point**: This system ensures your launch is perfect by giving you control over every decision while extending Claude's context infinitely through agent rotation.