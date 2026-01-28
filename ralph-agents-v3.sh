#!/bin/bash
set -e

# Ralph v3 - Full Agent Hierarchy
# Uses sub-agents for each specialized task like Boris

MAX=${1:-100}
SLEEP=${2:-15}

echo "═══════════════════════════════════════════"
echo "  Ralph v3 - Agent Hierarchy"
echo "  Max $MAX iterations, ${SLEEP}s between"
echo "═══════════════════════════════════════════"

count_remaining() { grep -c '^- \[ \]' PRD.md 2>/dev/null | head -1 || echo 0; }
count_completed() { grep -c '^- \[x\]' PRD.md 2>/dev/null | head -1 || echo 0; }
get_current_task() { grep -m1 '^- \[ \]' PRD.md 2>/dev/null | sed 's/^- \[ \] //' || echo ""; }

[[ ! -f PRD.md ]] && echo "ERROR: PRD.md not found" && exit 1
[[ ! -f progress.txt ]] && echo "# Progress Log" > progress.txt

echo "Starting: $(count_completed) done, $(count_remaining) remaining"

for ((i=1; i<=$MAX; i++)); do
    TASK=$(get_current_task)
    [[ -z "$TASK" ]] && echo "All tasks complete!" && exit 0
    
    echo ""
    echo "═══ Iteration $i: ${TASK:0:60}... ═══"
    
    claude --dangerously-skip-permissions -p "You are Ralph, an orchestrator that delegates to specialized sub-agents.

## YOUR TASK
$TASK

## AGENT HIERARCHY - USE THESE

You MUST use the Task tool to spawn the right agent for each phase:

### For RESEARCH tasks (task contains 'Research'):
1. **Spawn Explore agent** to search the codebase:
   Task(subagent_type='Explore', description='Search codebase for [X]', prompt='...')

2. **Spawn general-purpose agent** for web research:
   Task(subagent_type='general-purpose', description='Research [X]', prompt='Use WebSearch to find...', run_in_background=false)

3. **Combine findings** and document in PRD.md

### For CODING tasks (task contains 'Create' or 'Update' or 'Wire'):
1. **Spawn Plan agent** first:
   Task(subagent_type='Plan', description='Plan implementation', prompt='Analyze codebase and plan minimal changes for...')

2. **Review the plan**, then spawn **Coder agent**:
   Task(subagent_type='general-purpose', description='Implement [X]', prompt='Following this plan: [plan]. Implement...')

3. **Spawn Bash agent** to verify:
   Task(subagent_type='Bash', description='Run typecheck', prompt='Run npm run typecheck and report results')

### For TESTING tasks:
1. **Spawn Bash agent** for tests:
   Task(subagent_type='Bash', description='Run tests', prompt='Run npm test and report')

2. **Spawn Browser agent** if UI testing needed

## COMPLETION

After sub-agents complete:
1. If SUCCESS: Mark task [x] in PRD.md, run: git add -A && git commit -m 'task: [description]'
2. If FAIL: Log to progress.txt, do NOT mark complete

## CRITICAL
- ALWAYS use sub-agents - never do the work directly
- Each sub-agent is specialized - use the right one
- Document all findings in PRD.md or create files as specified

## START NOW
Read PRD.md, read progress.txt for context, then execute using sub-agents."

    echo ""
    echo "Progress: $(count_completed) done, $(count_remaining) remaining"
    
    [[ $(count_remaining) -eq 0 ]] && echo "ALL TASKS COMPLETE!" && exit 0
    
    sleep $SLEEP
done

echo "Max iterations reached. $(count_remaining) tasks remaining."
exit 1
