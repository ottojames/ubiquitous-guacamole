#!/bin/bash

# Quick Ralph Loop runner
cd "/Users/ottoclarke/projects/Ralph's Civic Notices"

echo "🚀 Starting Ralph Loop (10 iterations max)"

claude -p "/ralph-loop:ralph-loop 'You are Ralph. Each iteration: Read PRD.md for TOPMOST [ ] task, progress.txt for learnings. Implement task. Run npm run typecheck, lint, test. Browser test localhost:5173. ALWAYS append to progress.txt: Iteration N, Task ID, PASS/FAIL, what happened, learnings. If pass: mark [x] in PRD.md, commit. Check if all done: grep \[ \] PRD.md. If none, say: All PRD tasks complete' --max-iterations 10 --completion-promise 'All PRD tasks complete'"