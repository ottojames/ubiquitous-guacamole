#!/bin/bash

cd "/Users/ottoclarke/projects/Ralph's Civic Notices"

echo "🚀 Starting Ralph Loop - Autonomous Task Implementation"
echo "======================================================="
echo ""
echo "This uses the Ralph Loop plugin to iteratively work through PRD tasks."
echo "Each iteration gets fresh context by re-reading all files."
echo ""

# Create the Ralph Loop prompt that will repeat each iteration
RALPH_PROMPT="You are Ralph, an autonomous coding agent using Ralph Loop.

CRITICAL: Each iteration is a FRESH START. You see modified files from previous work but have NO MEMORY of what you did.

YOUR TASK FOR THIS ITERATION:

1. FIRST, check what iteration this is:
   - Run: grep -c 'Iteration' progress.txt 2>/dev/null || echo 0
   - This tells you which iteration number you are

2. Read these files to understand context:
   - PRD.md: Find the TOPMOST [ ] incomplete task (first one from top to bottom)
   - progress.txt: See what ALL previous iterations attempted and learned
   - AGENTS.md, CLAUDE.md, AVATAR_PROFILES.md, PRD_SUCCESS_CRITERIA.md

3. Implement the TOPMOST incomplete task from PRD.md:
   - Follow acceptance criteria exactly
   - Make the implementation
   - Run: npm run typecheck && npm run lint && npm test
   - Start npm run dev
   - BROWSER TEST at http://localhost:5173

4. CRITICAL - Update progress.txt BEFORE ANYTHING ELSE:
   Append this format (use actual iteration number from step 1):

   ## Iteration [N] - [Task ID]: [Task Title]
   - STATUS: PASS or FAIL
   - What was attempted: [specific description]
   - Files changed: [list all files you modified]
   - Browser testing results: [what you tested, what happened]
   - Why it failed: [if failed, specific reason]
   - Learnings for next iteration: [specific insights]

5. If tests PASS and browser test PASSES:
   - Mark task [x] in PRD.md
   - Add 'BROWSER TESTED: [evidence]' comment
   - Commit with message: 'feat: [Task ID] - [description]'

   If ANYTHING fails:
   - Do NOT mark complete in PRD.md
   - Do NOT commit
   - Ensure progress.txt has failure details for next iteration

6. Check if all tasks are complete:
   - Run: grep '\[ \]' PRD.md
   - If no incomplete tasks found, output: 'All PRD tasks complete'

Remember: You have NO MEMORY between iterations. progress.txt is your ONLY way to learn from previous attempts."

# Execute Ralph Loop with the plugin
echo "Executing: /ralph-loop:ralph-loop with 10 max iterations"
echo ""

claude -p "/ralph-loop:ralph-loop '$RALPH_PROMPT' --max-iterations 10 --completion-promise 'All PRD tasks complete'"

echo ""
echo "======================================================="
echo "✅ Ralph Loop finished!"
echo "📊 Check progress.txt for full iteration history"
echo "📋 Check PRD.md for completed tasks"
echo "======================================================="