#!/bin/bash
set -e

# Ralph Loop for Civic Notices - Autonomous Task Runner
# This script iteratively works through tasks in PRD.md using fresh contexts

MAX_ITERATIONS=${1:-10}
SLEEP_BETWEEN=${2:-3}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}==========================================="
echo -e "  🤖 Ralph Loop - Civic Notices"
echo -e "  Max iterations: $MAX_ITERATIONS"
echo -e "  Project: Ralph's Civic Notices"
echo -e "===========================================${NC}"
echo ""

# Main iteration loop
for ((i=1; i<=$MAX_ITERATIONS; i++)); do
    echo -e "${YELLOW}==========================================="
    echo -e "  📋 Iteration $i of $MAX_ITERATIONS"
    echo -e "===========================================${NC}"

    # Run Claude with fresh context for this task
    # Using --dangerously-skip-permissions to avoid confirmation prompts
    # Each invocation gets a fresh context to prevent context exhaustion
    result=$(claude --dangerously-skip-permissions -p "You are Ralph, an autonomous coding agent for the Civic Notices project. Execute ONE task per iteration with precision.

## Your Mission
Work through the tasks in PRD.md systematically. Each iteration handles exactly ONE incomplete task.

## Execution Protocol

### Step 1: Task Discovery
1. Read PRD.md - find the FIRST task marked [ ] (incomplete)
2. Read progress.txt - review the Learnings section for patterns from previous iterations
3. If no incomplete tasks remain, output: <promise>COMPLETE</promise>

### Step 2: Task Implementation
1. Implement ONLY the selected task - no more, no less
2. Follow the acceptance criteria exactly as specified
3. Use patterns documented in progress.txt and AGENTS.md

### Step 3: Quality Verification
Run ALL quality checks:
\`\`\`bash
npm run typecheck
npm run lint
npm test
\`\`\`

### Step 4: Browser Testing (when required)
If the task mentions 'BROWSER TESTED' in acceptance criteria:
1. Use /chrome command to open browser for testing
2. Follow the exact browser testing steps listed
3. Document results in evidence

### Step 5: Task Completion

**If ALL checks pass AND browser testing succeeds (when required):**
- Update PRD.md: change [ ] to [x] for the completed task
- Add evidence of completion to the task in PRD.md
- Commit changes: \`git commit -m \"feat: [task description]\"\`
- Update progress.txt with success details

**If ANY check fails:**
- Do NOT mark task complete in PRD.md
- Do NOT commit broken code
- Update progress.txt with failure details and learnings

## Progress Documentation Format

Append to progress.txt using this exact format:

\`\`\`
## Iteration $i - [Task ID: Task Name]
**Status:** [Success/Failed]
**Timestamp:** \$(date)

### What was implemented:
- [Implementation details]

### Files changed:
- [List of modified files]

### Quality checks:
- typecheck: [✓/✗]
- lint: [✓/✗]
- test: [✓/✗]
- browser test: [✓/✗/N/A]

### Learnings for future iterations:
- [Patterns discovered]
- [Gotchas encountered]
- [Useful context]

---
\`\`\`

## Agent Knowledge Base (AGENTS.md)

If you discover reusable patterns:
1. Check if AGENTS.md exists in project root
2. Add genuinely reusable patterns like:
   - 'Always use X when implementing Y'
   - 'This codebase follows pattern Z for W'
3. Keep it concise and actionable

## Context Management
- Start fresh - don't assume knowledge from previous iterations
- Read necessary files to understand current state
- Focus only on your assigned task
- Leave clear documentation for the next iteration

## End Condition
After completing your work:
- If ALL tasks in PRD.md are marked [x]: output <promise>COMPLETE</promise>
- Otherwise, just end your response normally

Remember: Quality over speed. One task done right is better than multiple tasks done poorly.")

    # Display the result
    echo "$result"
    echo ""

    # Check if all tasks are complete
    if [[ "$result" == *"<promise>COMPLETE</promise>"* ]]; then
        echo -e "${GREEN}==========================================="
        echo -e "  ✅ All tasks complete!"
        echo -e "  Total iterations: $i"
        echo -e "===========================================${NC}"

        # Final summary
        echo -e "${BLUE}Generating final summary...${NC}"
        tail -20 progress.txt

        exit 0
    fi

    # Check for critical errors that should stop the loop
    if [[ "$result" == *"CRITICAL ERROR"* ]] || [[ "$result" == *"FATAL"* ]]; then
        echo -e "${RED}==========================================="
        echo -e "  ❌ Critical error detected!"
        echo -e "  Stopping at iteration $i"
        echo -e "===========================================${NC}"
        exit 1
    fi

    # Brief pause before next iteration
    if [ $i -lt $MAX_ITERATIONS ]; then
        echo -e "${BLUE}Pausing for $SLEEP_BETWEEN seconds before next iteration...${NC}"
        sleep $SLEEP_BETWEEN
    fi
done

# Reached max iterations without completing all tasks
echo -e "${YELLOW}==========================================="
echo -e "  ⏱️  Reached maximum iterations ($MAX_ITERATIONS)"
echo -e "  Some tasks may remain incomplete"
echo -e "===========================================${NC}"

# Show remaining tasks
echo -e "${BLUE}Checking remaining tasks...${NC}"
grep -n "\[ \]" PRD.md | head -10 || echo "Could not determine remaining tasks"

exit 1