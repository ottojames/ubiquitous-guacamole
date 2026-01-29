#!/bin/bash
set -e

# Ralph with Agent Hierarchy
# Uses the orchestrator pattern from .claude/agents/ for higher quality fixes
# Each iteration: Analyst → Architect → Coder → Tester → Fixer (if needed)

MAX=${1:-10}
SLEEP=${2:-3}

echo "==========================================="
echo "  Ralph + Agent Hierarchy"
echo "  Max $MAX iterations, ${SLEEP}s between"
echo "==========================================="
echo ""

# Function to count remaining tasks
count_remaining() {
    grep -c '^\- \[ \]' PRD.md 2>/dev/null || echo 0
}

# Function to count completed tasks
count_completed() {
    grep -c '^\- \[x\]' PRD.md 2>/dev/null || echo 0
}

# Show initial status
INITIAL_REMAINING=$(count_remaining)
INITIAL_COMPLETED=$(count_completed)
echo "Starting: $INITIAL_COMPLETED done, $INITIAL_REMAINING remaining"
echo ""

for ((i=1; i<=$MAX; i++)); do
    echo "==========================================="
    echo "  Iteration $i of $MAX"
    echo "==========================================="

    result=$(claude --dangerously-skip-permissions -p "You are Ralph, an autonomous coding agent using a hierarchical agent system.

## Agent Hierarchy

You operate in LAYERS. For each task, go through:

### Layer 1: THINKING (Before Building)
1. **Analyst Role**: Read PRD.md, find the first incomplete task (marked [ ])
2. **Analyst Role**: Search the codebase to understand the context
3. **Architect Role**: Plan the minimal fix - identify exact files and lines

### Layer 2: BUILDING (Implementation)
4. **Coder Role**: Implement the fix following existing patterns
   - Make the SMALLEST possible change
   - Do not refactor surrounding code
   - Do not add features or improvements

### Layer 3: VERIFICATION (After Building)
5. **Tester Role**: Run \`npm run typecheck\` to verify the fix
6. If tests FAIL:
   - **Fixer Role**: Analyze the failure, make a surgical fix
   - Re-run verification (max 3 attempts per task)
   - If still failing after 3 attempts, log the issue and move on

## Critical Rules

- **ONE task per iteration** - never do multiple tasks
- **Minimal changes** - fix only what's specified, nothing else
- **Verify before marking complete** - typecheck must pass
- **Learn from failures** - check progress.txt for patterns

## Progress Tracking

After each task (pass or fail), append to progress.txt:

\`\`\`
## Iteration $i - [Task Name]
**Status**: [PASS/FAIL]
**Agent Flow**: Analyst → Architect → Coder → Tester → [Fixer if needed]
**Files Changed**: [list]
**What Happened**: [brief description]
**Learnings**: [patterns for future iterations]
---
\`\`\`

## Completion Protocol

If typecheck PASSES:
1. Mark task complete in PRD.md (change [ ] to [x])
2. Commit: \`git add -A && git commit -m \"fix: [task description]\"\`

If typecheck FAILS after 3 fix attempts:
1. Do NOT mark complete
2. Do NOT commit
3. Log detailed failure in progress.txt
4. The next iteration will try again with more context

## Start Now

1. Read PRD.md - find first [ ] task
2. Read progress.txt - check Learnings from previous iterations
3. Execute the agent hierarchy for that one task
4. Verify and update progress")

    echo "$result"
    echo ""

    # Verify progress independently
    REMAINING=$(count_remaining)
    COMPLETED=$(count_completed)

    echo "==========================================="
    echo "  Progress: $COMPLETED done, $REMAINING remaining"
    echo "==========================================="

    if [[ $REMAINING -eq 0 ]]; then
        echo ""
        echo "==========================================="
        echo "  ALL TASKS COMPLETE!"
        echo "  Finished in $i iterations"
        echo "==========================================="

        # Final verification
        echo ""
        echo "Running final verification..."
        npm run typecheck && echo "Typecheck: PASS" || echo "Typecheck: FAIL"

        exit 0
    fi

    sleep $SLEEP
done

FINAL_REMAINING=$(count_remaining)
FINAL_COMPLETED=$(count_completed)
PROGRESS=$((FINAL_COMPLETED - INITIAL_COMPLETED))

echo ""
echo "==========================================="
echo "  Reached max iterations ($MAX)"
echo "  Completed: $PROGRESS tasks this run"
echo "  Remaining: $FINAL_REMAINING tasks"
echo "==========================================="

# Show what's left
echo ""
echo "Remaining tasks:"
grep '^\- \[ \]' PRD.md | head -5

exit 1
