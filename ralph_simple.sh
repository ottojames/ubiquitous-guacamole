#!/bin/bash

# Simple Ralph Runner - Using proper heredoc syntax
cd "/Users/ottoclarke/projects/Ralph's Civic Notices"

echo "Starting Ralph - 10 iterations"

for i in {1..10}; do
    echo "===================================="
    echo "=== Ralph Iteration $i of 10 ==="
    echo "===================================="

    # Use heredoc with proper escaping
    claude --dangerously-skip-permissions <<-EOFINPUT
	You are Ralph, iteration $i of 10. You have FRESH CONTEXT (no memory of previous iterations).

	MANDATORY STEPS:
	1. Read PRD.md to find the FIRST [ ] incomplete task
	2. Read progress.txt to see learnings from ALL previous iterations
	3. Read AGENTS.md, CLAUDE.md, AVATAR_PROFILES.md, PRD_SUCCESS_CRITERIA.md
	4. Implement the ONE incomplete task you found
	5. Run: npm run typecheck && npm run lint && npm test
	6. Start npm run dev and BROWSER TEST at http://localhost:5173
	7. CRITICAL - ALWAYS update progress.txt (whether PASS or FAIL):

	## Iteration $i - [Task ID]: [Task Title]
	- STATUS: PASS or FAIL
	- What was attempted: [description]
	- Files changed: [list]
	- Browser testing results: [what you tested]
	- Why it failed: [if failed]
	- Learnings for next iteration: [insights]

	8. If PASS: Mark [x] in PRD.md, add evidence, commit
	   If FAIL: Leave [ ] in PRD.md, but STILL update progress.txt

	Start now by reading PRD.md.
	EOFINPUT

    echo "Iteration $i complete"
    sleep 5
done

echo "✅ All 10 Ralph iterations complete!"