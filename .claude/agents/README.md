# Civic Notices Agent Hierarchy

This directory contains the hierarchical agent system for Civic Notices development.

## Quick Start

Just talk to Claude normally. The orchestrator handles routing automatically.

```
You: "Add a filter dropdown to the notices page"
Claude: [Orchestrator activates, coordinates agents, asks questions if needed]
```

## Architecture

```
                            ┌─────────────────┐
                            │   ORCHESTRATOR  │
                            │   /dev command  │
                            └────────┬────────┘
                                     │
        ┌────────────────────────────┼────────────────────────────┐
        │                            │                            │
        ▼                            ▼                            ▼
┌───────────────┐          ┌───────────────┐          ┌───────────────┐
│   THINKING    │          │   BUILDING    │          │   VERIFYING   │
│    LAYER      │          │    LAYER      │          │     LAYER     │
│               │          │               │          │               │
│ • Analyst     │          │ • Coder       │          │ • Tester      │
│ • Architect   │          │ • Fixer       │          │ • Browser     │
│ • Critic      │          │               │          │ • UserSim     │
└───────────────┘          └───────────────┘          └───────────────┘
```

## Directory Structure

```
.claude/agents/
├── README.md                    # This file
├── orchestrator/
│   └── SKILL.md                 # Main orchestrator (invoked as /dev)
├── thinking/
│   ├── analyst.md               # Understands requirements, asks questions
│   ├── architect.md             # Designs implementation approach
│   └── critic.md                # Reviews plans, finds holes
├── building/
│   ├── coder.md                 # Implements approved plans
│   └── fixer.md                 # Fixes specific issues
├── verification/
│   ├── tester.md                # Runs typecheck, lint, tests
│   ├── browser.md               # Visual verification in Chrome
│   └── user-sim.md              # Tests edge cases
└── config/
    ├── settings.json            # Orchestrator configuration
    └── question-protocol.md     # When/how to ask questions
```

## Workflow

### Automatic Mode (Default)

1. You give a task
2. Orchestrator classifies as simple/medium/complex
3. Appropriate agents are invoked in sequence
4. Questions are asked if anything is unclear
5. Code is built
6. Verification runs automatically
7. You get confirmation with screenshot proof

### The Iteration Loop

```
Attempt 1: Coder → Tester → Browser
    │
    ├─► Success? → DONE
    │
    └─► Failure? → Fixer → Re-verify

Attempt 2: Fixer → Tester → Browser
    │
    └─► After 3 failures → Escalate to human
```

## Agent Roles

| Agent | Layer | Responsibility |
|-------|-------|----------------|
| **Analyst** | Thinking | Search codebase, understand requirements, ask clarifying questions |
| **Architect** | Thinking | Design simplest solution, identify files to modify, plan steps |
| **Critic** | Thinking | Find holes in plan, identify risks, block bad approaches |
| **Coder** | Building | Implement plan exactly, minimal code, no extras |
| **Fixer** | Building | Surgical fixes for specific issues |
| **Tester** | Verification | Run typecheck, lint, tests - report failures |
| **Browser** | Verification | Visual verification in Chrome, screenshots |
| **UserSim** | Verification | Test edge cases, unhappy paths |

## Configuration

Edit `.claude/agents/config/settings.json` to customize:

```json
{
  "orchestrator": {
    "askBeforeBuilding": true,    // Show plan before coding
    "browserVerification": true,   // Always verify in browser
    "maxIterations": 3             // Fix attempts before escalating
  }
}
```

## Key Principles

1. **No agent trusts itself** - Every output is verified by another agent
2. **Ask early** - Questions before building prevent wasted work
3. **Browser is truth** - Nothing is "complete" until visually verified
4. **Simple > Clever** - Match existing patterns, don't over-engineer
5. **3 failures = Human** - Don't spin forever, escalate

## Pragmatism Rules

These override everything:

1. **Working > Perfect** - Ship something that works
2. **Simple > Clever** - Junior devs should understand it
3. **Delete > Comment** - Remove dead code
4. **Existing > New** - Match codebase patterns
5. **Browser = Truth** - If Chrome says no, it's no
6. **3 Failures = Ask** - Don't spin forever
7. **Scope Creep = Stop** - Pause if task grows

## Troubleshooting

### "The agent isn't asking questions"
Check that `decisionThreshold` in settings.json isn't set to `"major-only"`.

### "Verification keeps failing"
Check that the dev server is running (`npm run dev`).

### "Browser agent can't take screenshots"
Ensure Playwright is installed: `npm install -D @playwright/test`

### "Too many questions"
Set `decisionThreshold` to `"major-only"` in settings.json.

## Comparison: Before vs After

| Before | After |
|--------|-------|
| You remind me to test | Tester runs automatically |
| You ask "did you check browser?" | Browser verification is mandatory |
| You catch my mistakes | Critic catches them first |
| I say "done" hopefully | Browser agent confirms with screenshot |
| I assume requirements | Analyst asks clarifying questions |
| I might over-engineer | Architect designs simplest solution |

## Adding New Agents

Create a markdown file in the appropriate layer directory:

```markdown
---
name: my-agent
description: What this agent does and when to invoke it
model: sonnet
---

# My Agent

[Agent instructions...]
```

The orchestrator will discover it automatically.
