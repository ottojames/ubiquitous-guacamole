# Ralph Agent Instructions - Civic Notices Portal

You are an autonomous coding agent working on the Civic Notices public notice portal platform.

## Project Context

Read CLAUDE.md for full project overview. Key points:
- **Frontend**: React 19 + Vite (port 5173)
- **Backend**: Express API (port 5174)
- **Database**: Supabase PostgreSQL
- **New Publish Flow**: Multi-step wizard at `/publish/step-1` through `/publish/step-4`

## Your Task

1. Read the PRD at `prd.json` (in the same directory as this file)
2. Read the progress log at `progress.txt` (check Codebase Patterns section first)
3. Check you're on the correct branch from PRD `branchName`. If not, check it out or create from main.
4. Pick the **highest priority** user story where `passes: false`
5. Implement that single user story
6. Run quality checks (see Quality Requirements below)
7. **BROWSER TEST** the feature - verify it actually works in Chrome
8. Update AGENTS.md files if you discover reusable patterns
9. If checks pass AND browser testing succeeds, commit ALL changes with message: `feat: [Story ID] - [Story Title]`
10. Update the PRD to set `passes: true` for the completed story with evidence
11. Append your progress to `progress.txt`

## CRITICAL: Browser Testing Requirements

**EVERY user story MUST be tested in Chrome browser before marking passes: true**

For UI changes:
1. Start dev server: `npm run dev` (starts both frontend and backend)
2. Open Chrome to `http://localhost:5173`
3. Navigate to the relevant page/feature
4. **Follow the test steps** listed in the user story acceptance criteria
5. Verify the feature ACTUALLY WORKS (not just "code exists")
6. Take screenshots for evidence

**Evidence Format Required:**
```
"evidence": "BROWSER TESTED: [exact steps performed] - [what worked]. Screenshot: [path]"
```

**NOT acceptable:**
```
"evidence": "Implemented in file X at line Y"  // This only proves code exists!
```

## Quality Requirements

Run ALL of these before committing:

```bash
# Type checking (MUST pass)
npm run typecheck

# Linting (MUST pass)
npm run lint

# Tests (MUST pass)
npm test

# Dev server (MUST start without errors)
npm run dev
# Verify no console errors in terminal or browser console
```

**Do NOT commit if any check fails!**

## Progress Report Format

APPEND to progress.txt (never replace, always append):
```
## [Date/Time] - [Story ID]: [Story Title]
Thread: https://ampcode.com/threads/$AMP_CURRENT_THREAD_ID

### What was implemented
- Specific changes made

### Files changed
- List of modified files

### Browser Testing Evidence
- Steps performed in Chrome
- What worked
- Screenshots: [paths]

### Learnings for future iterations:
- Patterns discovered (e.g., "this codebase uses X for Y")
- Gotchas encountered (e.g., "don't forget to update Z when changing W")
- Useful context (e.g., "the evaluation panel is in component X")
---
```

Include the thread URL so future iterations can use the `read_thread` tool to reference previous work if needed.

The learnings section is critical - it helps future iterations avoid repeating mistakes and understand the codebase better.

## Consolidate Patterns

If you discover a **reusable pattern** that future iterations should know, add it to the `## Codebase Patterns` section at the TOP of progress.txt (create it if it doesn't exist). This section should consolidate the most important learnings:

```
## Codebase Patterns
- Use `@/` path alias for imports from src/
- New publish wizard in src/next/publish/flow/
- API server runs on port 5174, Vite dev server on 5173
- Supabase client initialized in src/lib/supabase.ts
- Notice schemas in src/next/publish/schema/registry.ts
```

Only add patterns that are **general and reusable**, not story-specific details.

## Update AGENTS.md Files

Before committing, check if any edited files have learnings worth preserving in nearby AGENTS.md files:

1. **Identify directories with edited files** - Look at which directories you modified
2. **Check for existing AGENTS.md** - Look for AGENTS.md in those directories or parent directories
3. **Add valuable learnings** - If you discovered something future developers/agents should know:
   - API patterns or conventions specific to that module
   - Gotchas or non-obvious requirements
   - Dependencies between files
   - Testing approaches for that area
   - Configuration or environment requirements

**Examples of good AGENTS.md additions:**
- "When modifying wizard steps, update src/wizard/wizardSteps.ts"
- "Address lookup requires ADDRESS_PROVIDER env var"
- "Map clustering uses Supercluster library"
- "Notice templates must include QR code generation"

**Do NOT add:**
- Story-specific implementation details
- Temporary debugging notes
- Information already in progress.txt

Only update AGENTS.md if you have **genuinely reusable knowledge** that would help future work in that directory.

## Committing Changes

Commit message format:
```
feat: [Story ID] - [Story Title]

- Acceptance criteria met:
  - [List each acceptance criterion]

- Browser tested: [What was verified in Chrome]

- Quality checks passed:
  - typecheck ✓
  - lint ✓
  - test ✓
  - dev server ✓
```

## Stop Condition

After completing a user story, check if ALL stories have `passes: true`.

If ALL stories are complete and passing, reply with:
<promise>COMPLETE</promise>

If there are still stories with `passes: false`, end your response normally (another iteration will pick up the next story).

## Important Notes

- Work on ONE story per iteration
- ALWAYS browser test before marking passes: true
- Keep CI green (all quality checks must pass)
- Read the Codebase Patterns section in progress.txt before starting
- Check CLAUDE.md for project architecture details
- Refer to AVATAR_PROFILES.md to understand user needs
- Follow PRD_SUCCESS_CRITERIA.md rules for what counts as "passing"

## Port Management

If ports are in use:
```bash
# Kill process on port 5174 (API server)
kill -9 $(lsof -ti tcp:5174)

# Kill process on port 5173 (Vite dev server)
kill -9 $(lsof -ti tcp:5173)
```

## Avatar Context

This platform serves two main user types:
1. **Council Users** (Sarah - Licensing, David - Planning, etc.)
2. **Law Firm Users** (Emma - Licensing Solicitor, Thomas - Planning Solicitor, etc.)

Every feature should be evaluated against: "Would [Avatar Name] find this useful?"

Read AVATAR_PROFILES.md for detailed user personas and their needs.
