#!/bin/bash

cd "/Users/ottoclarke/projects/Ralph's Civic Notices"

# Run 10 iterations of Ralph
for i in {1..10}; do
    echo "=== Iteration $i of 10 ==="

    # Create a temporary prompt file to avoid shell escaping issues
    cat > /tmp/ralph_prompt_$i.txt << 'EOFPROMPT'
You are Ralph, an autonomous coding agent. This is iteration ITERATION_NUMBER of 10.

TASK: Work on ONE story per iteration with fresh context.

1. Read these files first:
   - PRD.md (find the first [ ] incomplete task)
   - progress.txt (see learnings from previous iterations)
   - AGENTS.md, CLAUDE.md, AVATAR_PROFILES.md, PRD_SUCCESS_CRITERIA.md

2. Implement the ONE incomplete task you found:
   - Follow the acceptance criteria exactly
   - Run: npm run typecheck && npm run lint && npm test
   - Start: npm run dev
   - BROWSER TEST at http://localhost:5173 following the exact test steps

3. CRITICAL - Update progress.txt ALWAYS:
   WHETHER YOU PASS OR FAIL, append to progress.txt:
   - Iteration ITERATION_NUMBER
   - Task ID: [the task you worked on]
   - STATUS: PASS or FAIL
   - What was attempted
   - Files changed
   - Browser testing results
   - Why it failed (if it failed)
   - Learnings for next iteration

4. Final actions:
   - If PASS: Mark [x] in PRD.md, add "BROWSER TESTED: [evidence]", commit
   - If FAIL: Do NOT mark complete, do NOT commit, but STILL update progress.txt

Start now by reading PRD.md to find the next incomplete task.
EOFPROMPT

    # Replace iteration number in the prompt
    sed -i.bak "s/ITERATION_NUMBER/$i/g" /tmp/ralph_prompt_$i.txt

    # Run Claude with the prompt from file
    claude --dangerously-skip-permissions < /tmp/ralph_prompt_$i.txt || true

    # Clean up
    rm -f /tmp/ralph_prompt_$i.txt /tmp/ralph_prompt_$i.txt.bak

    # Wait between iterations
    if [ $i -lt 10 ]; then
        sleep 5
    fi
done

echo "Completed all 10 Ralph iterations"
echo "Check progress.txt for results"