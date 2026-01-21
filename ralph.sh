#!/bin/bash
set -e

MAX=${1:-10}
SLEEP=${2:-2}

echo "Starting Ralph - Max $MAX iterations"
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
echo "Starting status: $INITIAL_COMPLETED completed, $INITIAL_REMAINING remaining"
echo ""

for ((i=1; i<=$MAX; i++)); do
    echo "==========================================="
    echo "  Iteration $i of $MAX"
    echo "==========================================="

    result=$(claude --dangerously-skip-permissions -p "You are Ralph, an autonomous coding agent. Do exactly ONE task per iteration.

## Steps

1. Read PRD.md and find the first task that is NOT complete (marked [ ]).
2. Read progress.txt - check the Learnings section first for patterns from previous iterations.
3. Implement that ONE task only.
4. Run tests/typecheck to verify it works.

## Critical: Only Complete If Tests Pass

- If tests PASS:
  - Update PRD.md to mark the task complete (change [ ] to [x])
  - Commit your changes with message: feat: [task description]
  - Append what worked to progress.txt

- If tests FAIL:
  - Do NOT mark the task complete
  - Do NOT commit broken code
  - Append what went wrong to progress.txt (so next iteration can learn)

## Progress Notes Format

Append to progress.txt using this format:

## Iteration [N] - [Task Name]
- What was implemented
- Files changed
- Learnings for future iterations:
  - Patterns discovered
  - Gotchas encountered
  - Useful context
---

## Update AGENTS.md (If Applicable)

If you discover a reusable pattern that future work should know about:
- Check if AGENTS.md exists in the project root
- Add patterns like: 'This codebase uses X for Y' or 'Always do Z when changing W'
- Only add genuinely reusable knowledge, not task-specific details

## Important

Do NOT output <promise>COMPLETE</promise> - the script will verify completion independently.")

    echo "$result"
    echo ""

    # Check actual progress (don't trust Ralph's self-report)
    REMAINING=$(count_remaining)
    COMPLETED=$(count_completed)

    echo "==========================================="
    echo "  Progress: $COMPLETED completed, $REMAINING remaining"
    echo "==========================================="

    # Verify completion independently
    if [[ $REMAINING -eq 0 ]]; then
        echo "==========================================="
        echo "  VERIFIED: All tasks complete after $i iterations!"
        echo "==========================================="
        exit 0
    fi

    sleep $SLEEP
done

FINAL_REMAINING=$(count_remaining)
FINAL_COMPLETED=$(count_completed)

echo "==========================================="
echo "  Reached max iterations ($MAX)"
echo "  Final: $FINAL_COMPLETED completed, $FINAL_REMAINING remaining"
echo "  Progress this run: $((FINAL_COMPLETED - INITIAL_COMPLETED)) tasks completed"
echo "==========================================="
exit 1
