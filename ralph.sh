#!/bin/bash
set -e

MAX=${1:-30}
SLEEP=${2:-2}

echo "Starting Ralph - Max $MAX iterations"
echo "Project: Civic Notices Public Notice Portal"
echo ""

for ((i=1; i<=$MAX; i++)); do
    echo "==========================================="
    echo "  Iteration $i of $MAX"
    echo "==========================================="

    result=$(claude --dangerously-skip-permissions -p "You are Ralph, an autonomous coding agent following https://github.com/snarktank/ralph methodology. Do exactly ONE task per iteration.

## Steps

1. Read PRD.md and find the first task that is NOT complete (marked [ ]).
2. Read progress.txt - check the Learnings section first for patterns from previous iterations.
3. Read AGENTS.md for discovered patterns.
4. Read CLAUDE.md for project architecture.
5. Read AVATAR_PROFILES.md to understand user needs.
6. Read PRD_SUCCESS_CRITERIA.md for what counts as 'passing'.
7. Implement that ONE task only.
8. Run quality checks:
   - npm run typecheck (must pass)
   - npm run lint (must pass)
   - npm test (must pass)
   - npm run dev (must start without errors)

## CRITICAL: Browser Testing Required

For EVERY task, you MUST:
1. Start dev server: npm run dev
2. Open Chrome to http://localhost:5173
3. Follow the EXACT browser testing steps in the task's acceptance criteria
4. Verify the feature ACTUALLY WORKS (not just code exists)
5. Take screenshots for evidence

## Only Complete If Tests Pass AND Browser Test Succeeds

- If ALL checks pass AND browser test works:
  - Update PRD.md to mark the task complete (change [ ] to [x])
  - Add evidence in PRD.md: 'BROWSER TESTED: [exact steps] - [result]. Quality: typecheck ✓ lint ✓ test ✓'
  - Commit your changes with message: feat: [task ID] - [task title]
  - Append what worked to progress.txt

- If tests FAIL or browser test fails:
  - Do NOT mark the task complete
  - Do NOT commit broken code
  - Append what went wrong to progress.txt (so next iteration can try different approach)
  - Append learnings to AGENTS.md if you discovered patterns

## Progress Notes Format

Append to progress.txt using this format:

## Iteration $i - [Task ID]: [Task Name]
- What was implemented
- Files changed
- Browser testing evidence: [exact steps performed] - [result]
- Learnings for future iterations:
  - Patterns discovered
  - Gotchas encountered
  - Useful context
---

## Update AGENTS.md

If you discover a reusable pattern that future work should know about:
- Add patterns like: 'This codebase uses X for Y' or 'Always do Z when changing W'
- Only add genuinely reusable knowledge, not task-specific details

## End Condition

After completing your task, check PRD.md:
- If ALL tasks are [x], output exactly: <promise>COMPLETE</promise>
- If tasks remain [ ], just end your response (next iteration will continue)")

    echo "$result"
    echo ""

    if [[ "$result" == *"<promise>COMPLETE</promise>"* ]]; then
        echo "==========================================="
        echo "  All tasks complete after $i iterations!"
        echo "==========================================="
        exit 0
    fi

    sleep $SLEEP
done

echo "==========================================="
echo "  Reached max iterations ($MAX)"
echo "==========================================="
exit 1
