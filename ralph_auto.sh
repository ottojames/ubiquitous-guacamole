#!/bin/bash

# Ralph Automation Script - 10 iterations
cd "/Users/ottoclarke/projects/Ralph's Civic Notices"

for i in {1..10}; do
    echo "========================================="
    echo "Starting Ralph Iteration $i of 10"
    echo "========================================="

    # Run Ralph with the exact format the stop hook expects
    claude --dangerously-skip-permissions -p "You are Ralph. Work on ONE story per iteration. Fresh context each iteration.

Read Files: PRD.md (find first [ ] task), progress.txt (learnings from previous iterations), AGENTS.md, CLAUDE.md, AVATAR_PROFILES.md, PRD_SUCCESS_CRITERIA.md

Implement ONE Task: Follow acceptance criteria. Run npm run typecheck && npm run lint && npm test. Start npm run dev. BROWSER TEST at http://localhost:5173 following exact test steps.

CRITICAL - Always Update progress.txt: WHETHER YOU PASS OR FAIL, append to progress.txt: Iteration $i, Task ID, STATUS (PASS/FAIL), what was attempted, files changed, browser testing results, why it failed if failed, learnings for next iteration.

If Pass: Mark [x] in PRD.md, add evidence BROWSER TESTED, commit. If Fail: Do NOT mark complete, Do NOT commit, STILL append to progress.txt what failed and learnings. Next iteration gets fresh context and tries different approach.

Now begin working on the next incomplete task." || {
        echo "Iteration $i failed or was interrupted, continuing..."
    }

    # Wait between iterations
    if [ $i -lt 10 ]; then
        echo "Waiting 5 seconds before next iteration..."
        sleep 5
    fi
done

echo "========================================="
echo "All 10 iterations complete"
echo "Check progress.txt for results"
echo "========================================="