#!/bin/bash

# Ralph Standalone Runner - Runs 10 iterations without hooks
cd "/Users/ottoclarke/projects/Ralph's Civic Notices"

echo "Starting Ralph - 10 iterations"
echo "========================================="

for i in {1..10}; do
    echo ""
    echo "🤖 Ralph Iteration $i of 10"
    echo "========================================="

    # Create a temporary script that Ralph will execute
    cat > /tmp/ralph_task_$i.sh << 'RALPHSCRIPT'
#!/bin/bash
cd "/Users/ottoclarke/projects/Ralph's Civic Notices"

echo "Ralph starting iteration ITERNUM..."

# Read PRD.md to find next task
NEXT_TASK=$(grep -n "\[ \]" PRD.md | head -1 || echo "No tasks found")
echo "Next task: $NEXT_TASK"

# Run the actual Claude command with Ralph instructions
claude --dangerously-skip-permissions << 'EOF'
You are Ralph, an autonomous coding agent. This is iteration ITERNUM of 10.

Your task:
1. Read PRD.md and find the first [ ] incomplete task
2. Read progress.txt to see learnings from previous iterations
3. Read AGENTS.md, CLAUDE.md, AVATAR_PROFILES.md, PRD_SUCCESS_CRITERIA.md for context
4. Implement the ONE incomplete task following its acceptance criteria
5. Run: npm run typecheck && npm run lint && npm test
6. Start npm run dev and BROWSER TEST at http://localhost:5173
7. Update progress.txt with:
   - Iteration ITERNUM
   - Task ID and description
   - STATUS: PASS or FAIL
   - What was attempted
   - Files changed
   - Browser testing results
   - Why it failed (if failed)
   - Learnings for next iteration
8. If PASS: Mark [x] in PRD.md and commit
   If FAIL: Do NOT mark complete, do NOT commit

Now begin by reading PRD.md.
EOF

echo "Ralph iteration ITERNUM complete"
RALPHSCRIPT

    # Replace iteration number
    sed -i.bak "s/ITERNUM/$i/g" /tmp/ralph_task_$i.sh
    chmod +x /tmp/ralph_task_$i.sh

    # Run Ralph for this iteration
    /tmp/ralph_task_$i.sh || true

    # Clean up
    rm -f /tmp/ralph_task_$i.sh /tmp/ralph_task_$i.sh.bak

    # Wait between iterations
    if [ $i -lt 10 ]; then
        echo "Waiting 5 seconds before next iteration..."
        sleep 5
    fi
done

echo ""
echo "========================================="
echo "✅ Completed all 10 Ralph iterations"
echo "Check progress.txt for detailed results"
echo "========================================="