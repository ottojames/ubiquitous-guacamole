#!/bin/bash
set -e

# Ralph v2 - Modern Autonomous Agent Loop
# Based on latest best practices (Jan 2026):
# - Fresh context each iteration (re-anchor from filesystem)
# - Plan before build
# - Auto-block stuck tasks after N failures
# - Browser verification for UI tasks
# - Opus 4.5 with thinking for higher quality

MAX=${1:-20}
SLEEP=${2:-5}
MAX_FAILURES_PER_TASK=3

echo "═══════════════════════════════════════════"
echo "  Ralph v2 - Autonomous Agent Loop"
echo "  Max $MAX iterations, ${SLEEP}s between"
echo "  Auto-block after $MAX_FAILURES_PER_TASK failures"
echo "═══════════════════════════════════════════"
echo ""

# Functions
count_remaining() {
    grep -c '^- \[ \]' PRD.md 2>/dev/null || echo 0
}

count_completed() {
    grep -c '^- \[x\]' PRD.md 2>/dev/null || echo 0
}

count_blocked() {
    grep -c '^- \[BLOCKED\]' PRD.md 2>/dev/null || echo 0
}

get_current_task() {
    grep -m1 '^- \[ \]' PRD.md 2>/dev/null | sed 's/^- \[ \] //' || echo ""
}

get_task_failures() {
    local task="$1"
    grep -c "FAIL.*$task" progress.txt 2>/dev/null || echo 0
}

# Pre-flight checks
if [[ ! -f PRD.md ]]; then
    echo "ERROR: PRD.md not found"
    exit 1
fi

# Initialize progress.txt if needed
if [[ ! -f progress.txt ]]; then
    echo "# Ralph Progress Log" > progress.txt
    echo "Started: $(date)" >> progress.txt
    echo "---" >> progress.txt
fi

# Show initial status
INITIAL_REMAINING=$(count_remaining)
INITIAL_COMPLETED=$(count_completed)
echo "Starting: $INITIAL_COMPLETED done, $INITIAL_REMAINING remaining"
echo ""

for ((i=1; i<=$MAX; i++)); do
    CURRENT_TASK=$(get_current_task)
    
    if [[ -z "$CURRENT_TASK" ]]; then
        echo "No more tasks found!"
        break
    fi
    
    # Check if this task has failed too many times
    TASK_FAILURES=$(get_task_failures "$CURRENT_TASK")
    if [[ $TASK_FAILURES -ge $MAX_FAILURES_PER_TASK ]]; then
        echo "═══════════════════════════════════════════"
        echo "  BLOCKING TASK (failed $TASK_FAILURES times)"
        echo "  Task: ${CURRENT_TASK:0:60}..."
        echo "═══════════════════════════════════════════"
        
        # Mark as blocked in PRD.md
        sed -i '' "s/^- \[ \] $(echo "$CURRENT_TASK" | sed 's/[\[\].*]/\\&/g')/- [BLOCKED] $CURRENT_TASK/" PRD.md
        
        # Log the block
        echo "" >> progress.txt
        echo "## Iteration $i - BLOCKED" >> progress.txt
        echo "**Task**: $CURRENT_TASK" >> progress.txt
        echo "**Reason**: Failed $TASK_FAILURES times, auto-blocked" >> progress.txt
        echo "**Action Needed**: Manual intervention required" >> progress.txt
        echo "---" >> progress.txt
        
        continue
    fi

    echo "═══════════════════════════════════════════"
    echo "  Iteration $i of $MAX"
    echo "  Task: ${CURRENT_TASK:0:50}..."
    echo "═══════════════════════════════════════════"

    # Build the prompt with fresh context each iteration
    PROMPT="You are Ralph, an autonomous agent executing tasks from PRD.md.

## FRESH CONTEXT (Re-anchored this iteration)

Current Task: $CURRENT_TASK
Iteration: $i of $MAX
Previous failures on this task: $TASK_FAILURES

## PHASE 1: PLAN (Before any code changes)

1. Read PRD.md completely - understand the full context
2. Read progress.txt - learn from ALL previous iterations
3. If this is a RESEARCH task (contains 'Research'):
   - Use web search to gather information
   - Document findings IN the PRD.md file itself
   - Update relevant sections with research results
4. If this is a CODE task:
   - Search codebase for relevant files
   - Plan the MINIMAL change needed
   - List exact files and changes

## PHASE 2: EXECUTE

For RESEARCH tasks:
- Search the web for authoritative sources
- Extract key information
- Update PRD.md with structured findings
- Create files if task specifies (e.g., /templates/, /councils/)

For CODE tasks:
- Make ONLY the changes specified
- Follow existing code patterns
- No refactoring, no improvements, no extras

## PHASE 3: VERIFY

For RESEARCH tasks:
- Verify information was added to PRD.md or specified file
- Check file exists and has content

For CODE tasks:
- Run: npm run typecheck
- If UI-related: verify with browser (headless)
- If fails: try to fix (max 3 attempts total across all iterations)

## PHASE 4: COMPLETE

If verification PASSES:
1. Mark task complete: change \"- [ ]\" to \"- [x]\" in PRD.md
2. Commit: git add -A && git commit -m \"task: [brief description]\"
3. Append to progress.txt:
   ## Iteration $i - [Task Name]
   **Status**: PASS
   **Files Changed**: [list]
   **Summary**: [what was done]
   **Learnings**: [patterns for future]
   ---

If verification FAILS:
1. Do NOT mark complete
2. Do NOT commit
3. Append to progress.txt with FAIL status and error details
4. Next iteration will try again with more context

## CRITICAL RULES

- ONE task per iteration - never skip ahead
- Re-read PRD.md and progress.txt EVERY iteration (fresh context)
- Research tasks: ADD findings to the document, don't just report them
- Code tasks: VERIFY before marking complete
- Learn from progress.txt - don't repeat mistakes

## START NOW

Execute the task: $CURRENT_TASK"

    # Run Claude with Opus (best quality) - remove --dangerously-skip-permissions in production
    result=$(claude --dangerously-skip-permissions -p "$PROMPT" 2>&1) || true

    echo "$result"
    echo ""

    # Verify progress independently
    REMAINING=$(count_remaining)
    COMPLETED=$(count_completed)
    BLOCKED=$(count_blocked)

    echo "═══════════════════════════════════════════"
    echo "  Progress: $COMPLETED done, $REMAINING todo, $BLOCKED blocked"
    echo "═══════════════════════════════════════════"

    if [[ $REMAINING -eq 0 ]]; then
        echo ""
        echo "═══════════════════════════════════════════"
        echo "  ALL TASKS COMPLETE!"
        echo "  Finished in $i iterations"
        echo "  Blocked: $BLOCKED tasks (need manual review)"
        echo "═══════════════════════════════════════════"

        # Final verification
        echo ""
        echo "Running final verification..."
        npm run typecheck && echo "✓ Typecheck: PASS" || echo "✗ Typecheck: FAIL"

        exit 0
    fi

    sleep $SLEEP
done

FINAL_REMAINING=$(count_remaining)
FINAL_COMPLETED=$(count_completed)
FINAL_BLOCKED=$(count_blocked)
PROGRESS=$((FINAL_COMPLETED - INITIAL_COMPLETED))

echo ""
echo "═══════════════════════════════════════════"
echo "  Reached max iterations ($MAX)"
echo "  Completed: $PROGRESS tasks this run"
echo "  Remaining: $FINAL_REMAINING tasks"
echo "  Blocked: $FINAL_BLOCKED tasks"
echo "═══════════════════════════════════════════"

# Show what's left
echo ""
echo "Remaining tasks:"
grep '^- \[ \]' PRD.md | head -5

if [[ $FINAL_BLOCKED -gt 0 ]]; then
    echo ""
    echo "Blocked tasks (need manual intervention):"
    grep '^- \[BLOCKED\]' PRD.md
fi

exit 1
