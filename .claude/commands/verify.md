# /verify - Full verification suite

## Run all checks

1. TypeScript: `npm run typecheck`
2. Lint: `npm run lint`
3. Tests: `npm test -- --run` (if tests exist)
4. Build: `npm run build` (verify production build works)

Report results in a table:
| Check | Status | Notes |
|-------|--------|-------|
| typecheck | PASS/FAIL | error count |
| lint | PASS/FAIL | warning count |
| test | PASS/FAIL | test count |
| build | PASS/FAIL | build time |

Execute now.
