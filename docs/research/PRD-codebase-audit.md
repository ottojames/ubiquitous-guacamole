# PRD: Civic Notices Codebase Audit

**Version**: 1.0  
**Created**: 2026-01-29  
**Author**: System Architect  
**Status**: Ready for Execution

---

## Executive Summary

This document defines a 5-phase codebase audit for the Civic Notices platform — a UK public notices system (licensing, probate, GVOL) that is ~80% complete but experiencing "wiring/integration" issues. The audit follows industry-standard frameworks (CAST AIP, SonarQube metrics, IEEE 1028) adapted for a stuck project recovery scenario.

**Goal**: Produce an actionable remediation roadmap to take Civic Notices from stuck to shipped.

**Tech Stack Reference**:
- Frontend: React 19, Vite 7, TailwindCSS, React Router 7
- Backend: Express 4, TypeScript 5.8
- Database: Supabase (PostgreSQL)
- Testing: Vitest, Playwright
- Payments: Stripe

---

## Phase 0: Discovery
*Understand what exists, map the terrain*

### Objectives
1. Create a complete inventory of all code assets
2. Document the current project state and known issues
3. Identify key stakeholders and their concerns
4. Establish baseline metrics for codebase health

### Duration
**Estimated**: 2-4 hours

### Techniques & Commands

#### 0.1 Project Inventory

```bash
# Generate file tree (excluding node_modules, dist, .git)
find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) \
  ! -path "*/node_modules/*" ! -path "*/dist/*" ! -path "*/.git/*" | wc -l

# Count lines of code by file type
find . -type f -name "*.ts" ! -path "*/node_modules/*" | xargs wc -l | tail -1
find . -type f -name "*.tsx" ! -path "*/node_modules/*" | xargs wc -l | tail -1

# List all entry points
ls -la src/main.tsx server/index.ts

# Map route structure
find ./server/routes -name "*.ts" -exec basename {} \;
find ./src/pages -name "*.tsx" -exec basename {} \;
```

#### 0.2 Documentation Inventory

| Document Type | Location Pattern | Check Command |
|--------------|------------------|---------------|
| README | `./README.md` | `cat README.md` |
| API Docs | `./docs/api.md`, `./server/openapi.json` | `ls -la docs/ server/openapi.json` |
| PRDs | `./PRD*.md`, `./docs/**/*.md` | `find . -name "PRD*.md" -o -name "*.md" \| head -20` |
| Architecture | `./docs/architecture/` | `ls -la docs/architecture/` |
| Progress Log | `./progress.txt` | `head -100 progress.txt` |

#### 0.3 Known Issues Collection

```bash
# Find all TODOs, FIXMEs, HACKs in codebase
grep -r "TODO\|FIXME\|HACK\|XXX\|BUG" --include="*.ts" --include="*.tsx" . 2>/dev/null | grep -v node_modules

# Check for console.log statements (potential debug code)
grep -r "console.log" --include="*.ts" --include="*.tsx" src/ server/ | wc -l

# Find commented-out code blocks (potential dead code)
grep -rn "^[[:space:]]*//.*{" --include="*.ts" --include="*.tsx" src/ server/ | head -20
```

#### 0.4 Git History Analysis

```bash
# Recent commit activity (last 30 days)
git log --oneline --since="30 days ago" | wc -l

# Files changed most frequently (hotspots)
git log --oneline --name-only --since="30 days ago" | grep -v "^[a-f0-9]" | sort | uniq -c | sort -rn | head -20

# Contributors and activity
git shortlog -sn --since="60 days ago"

# Recent merge conflicts or reverts
git log --oneline --grep="revert\|conflict\|fix merge" --since="30 days ago"
```

### Deliverables

- [ ] **AUDIT-P0-inventory.md**: Complete file inventory with counts
- [ ] **AUDIT-P0-known-issues.md**: Collected TODOs, FIXMEs, and known bugs
- [ ] **AUDIT-P0-stakeholder-notes.md**: Key concerns and requirements
- [ ] **AUDIT-P0-baseline-metrics.json**: Initial codebase metrics

### Success Criteria

| Criterion | Target |
|-----------|---------|
| File inventory complete | 100% of source files catalogued |
| Known issues documented | All TODOs/FIXMEs listed with file locations |
| Baseline metrics captured | LOC, file count, test count, dependency count |
| Entry points identified | All route handlers and page components mapped |

---

## Phase 1: Architecture Assessment
*Evaluate structure, dependencies, patterns*

### Objectives
1. Map the application architecture (frontend <-> backend <-> database)
2. Analyze dependency health and security
3. Evaluate code organization and patterns
4. Identify architectural anti-patterns and technical debt

### Duration
**Estimated**: 4-6 hours

### Techniques & Commands

#### 1.1 Dependency Analysis

```bash
# Check for outdated dependencies
npm outdated

# Check for security vulnerabilities
npm audit

# Generate dependency tree (direct deps)
npm ls --depth=0

# Check for unused dependencies
npx depcheck

# Analyze bundle size impact
npx vite-bundle-visualizer
```

**Dependency Health Scorecard**:

| Metric | Tool | Threshold |
|--------|------|-----------||
| Outdated (major) | `npm outdated` | <5 critical |
| Security vulns | `npm audit` | 0 high/critical |
| Unused deps | `depcheck` | <10% of total |
| Bundle size | `vite-bundle-visualizer` | <500KB gzipped |

#### 1.2 Static Analysis Setup

```bash
# Run ESLint with full report
npm run lint 2>&1 | tee lint-report.txt
cat lint-report.txt | grep -c "error\|warning"

# TypeScript strict check
npx tsc --noEmit --strict 2>&1 | tee typecheck-report.txt

# Run SonarQube scanner (if available) or use alternatives
# Local alternative: using ESLint with additional plugins
npx eslint . --ext .ts,.tsx -f json -o eslint-results.json
```

#### 1.3 Architecture Mapping

**Frontend Structure Analysis**:

```bash
# Map component hierarchy
find src/components -name "*.tsx" | while read f; do
  echo "=== $f ==="
  grep -h "^import.*from" "$f" | grep -v "react" | head -5
done > component-imports.txt

# Find circular dependencies
npx madge --circular --extensions ts,tsx src/

# Map page -> component relationships
grep -r "import.*from.*components" src/pages/ | cut -d: -f1 | sort | uniq -c | sort -rn
```

**Backend Structure Analysis**:

```bash
# Map route -> service -> database flow
find server/routes -name "*.ts" -exec grep -l "supabase\|db\|database" {} \;

# List all API endpoints
grep -rh "router\.\(get\|post\|put\|patch\|delete\)" server/routes/ | \
  sed 's/.*router\.\([a-z]*\).*\("[^"]*"\).*/\1 \2/' | sort

# Check middleware usage
grep -r "app.use\|router.use" server/
```

**Database Schema Mapping**:

```bash
# List Supabase migrations
ls -la supabase/migrations/

# Extract table names from migrations
grep -rh "CREATE TABLE\|ALTER TABLE" supabase/migrations/ | \
  sed 's/.*TABLE[^a-z]*\([a-z_]*\).*/\1/' | sort | uniq
```

#### 1.4 Code Quality Metrics

**Complexity Analysis**:

| Metric | Tool | Command | Target |
|--------|------|---------|--------|
| Cyclomatic complexity | `eslint-plugin-complexity` | Via ESLint | <10 per function |
| File length | `wc -l` | `find src -name "*.tsx" -exec wc -l {} \; \| sort -rn \| head -10` | <400 lines |
| Function length | Manual review | Check top 10 longest files | <50 lines |
| Nesting depth | Manual review | Check for >3 levels | Max 3 levels |

**Pattern Detection**:

```bash
# Check for consistent patterns
# 1. Hook usage pattern
grep -r "use[A-Z][a-zA-Z]*" src/hooks/ --include="*.ts" | wc -l

# 2. Service pattern (server-side)
grep -r "export.*function\|export.*const.*=.*async" server/services/ | wc -l

# 3. Component pattern (PascalCase exports)
grep -r "export.*function [A-Z]\|export default function [A-Z]" src/components/ | wc -l
```

### Deliverables

- [ ] **AUDIT-P1-architecture-diagram.md**: Visual representation of system architecture
- [ ] **AUDIT-P1-dependency-report.md**: Full dependency analysis with recommendations
- [ ] **AUDIT-P1-static-analysis.md**: ESLint, TypeScript, complexity findings
- [ ] **AUDIT-P1-patterns.md**: Documented patterns and anti-patterns found

### Success Criteria

| Criterion | Target |
|-----------|---------|
| All entry points mapped | Frontend routes + API routes documented |
| Dependency audit complete | All vulnerabilities categorized by severity |
| Architecture diagram created | All major components and their relationships |
| Anti-patterns identified | Listed with file locations and remediation notes |

---

## Phase 2: Integration Audit
*Identify what's connected, what's broken, what's missing*

### Objectives
1. Test all integration points (frontend <-> backend <-> external services)
2. Document working vs broken flows
3. Identify missing integrations
4. Map data flow through the system

### Duration
**Estimated**: 6-8 hours

### Techniques & Commands

#### 2.1 API Integration Testing

```bash
# Start development servers
npm run dev

# Test API health endpoint
curl -s http://localhost:5174/api/health | jq .

# Run existing API tests
npm run test:api
```

#### 2.2 Frontend-Backend Integration Matrix

**Create Integration Matrix**:

| Frontend Page | API Endpoints Used | Status | Notes |
|--------------|--------------------|--------|-------|
| `/` (Home) | `/api/notices` | ? | Check list rendering |
| `/publish` | `/api/notices` (POST) | ? | Check form submission |
| `/notice/:id` | `/api/notices/:id` | ? | Check detail view |
| `/council/:id` | `/api/councils/:id` | ? | Check council data |

```bash
# Generate page -> API mapping
grep -r "fetch\|axios\|useMutation\|useQuery" src/pages/ --include="*.tsx" | \
  grep -oE "(api|/api)[^'\"]*" | sort | uniq

# Check for hardcoded URLs vs environment variables
grep -r "localhost\|127.0.0.1" src/ --include="*.ts" --include="*.tsx" | grep -v node_modules
```

#### 2.3 External Service Integration

**Supabase Integration**:

```bash
# Check Supabase client usage
grep -r "supabase\." src/lib/ server/ --include="*.ts" | grep -v node_modules | head -20

# Verify environment variables
grep "SUPABASE\|VITE_SUPABASE" .env.example
```

**Stripe Integration**:

```bash
# Check Stripe implementation
grep -r "stripe\|Stripe" src/ server/ --include="*.ts" --include="*.tsx" | \
  grep -v node_modules | wc -l

# Verify Stripe webhook endpoint
grep -r "webhook\|stripe" server/routes/ --include="*.ts"
```

**Email Service (Resend)**:

```bash
# Check email service implementation
grep -r "resend\|Resend\|sendEmail" server/ --include="*.ts"

# Test email service (dry run)
npm run test:email
```

#### 2.4 E2E Flow Testing

```bash
# Run Playwright tests
npx playwright test

# Run specific flow tests
npx playwright test publish-flow
npx playwright test council-notification

# Generate test report
npx playwright show-report
```

**Critical Flow Checklist**:

| Flow | Test File | Status | Blocker? |
|------|-----------|--------|----------|
| Notice Publish (happy path) | `e2e/publish.spec.ts` | ? | -- |
| Notice Search | `e2e/search.spec.ts` | ? | -- |
| Council Lookup | `e2e/council.spec.ts` | ? | -- |
| Payment Flow | `e2e/payment.spec.ts` | ? | -- |
| User Authentication | `e2e/auth.spec.ts` | ? | -- |

#### 2.5 Data Flow Tracing

```bash
# Trace a notice from creation to display
# 1. Form component
grep -l "NoticeForm\|PublishForm" src/components/ src/pages/

# 2. API submission
grep -l "POST.*notice" server/routes/

# 3. Database insert
grep -l "insert.*notice\|notices.*insert" server/services/

# 4. List retrieval
grep -l "GET.*notices\|notices.*select" server/routes/ server/services/

# 5. Display component
grep -l "NoticeCard\|NoticeList\|NoticeDetail" src/components/
```

### Deliverables

- [ ] **AUDIT-P2-integration-matrix.md**: Complete frontend <-> backend mapping
- [ ] **AUDIT-P2-api-test-results.md**: API endpoint test results
- [ ] **AUDIT-P2-e2e-test-results.md**: Playwright test results with screenshots
- [ ] **AUDIT-P2-broken-flows.md**: List of non-functional integrations with error logs
- [ ] **AUDIT-P2-data-flow-diagram.md**: Visual data flow through the system

### Success Criteria

| Criterion | Target |
|-----------|---------|
| All API endpoints tested | 100% coverage of documented endpoints |
| Integration matrix complete | Every page mapped to API calls |
| Broken flows documented | Each failure includes: endpoint, error, probable cause |
| E2E tests executed | All existing tests run with results captured |

---

## Phase 3: Gap Analysis
*Document what is needed to reach completion*

### Objectives
1. Compare current state to PRD requirements
2. Identify missing features, components, and integrations
3. Quantify technical debt requiring remediation
4. Prioritize gaps by business impact

### Duration
**Estimated**: 4-6 hours

### Techniques & Commands

#### 3.1 PRD Compliance Check

```bash
# Extract requirements from PRD
grep -E "^-\s*\[.\]|^##|^###" PRD.md COMPLETED_PRD.md > prd-requirements.txt

# Count completed vs incomplete
grep -c "\[x\]" PRD.md
grep -c "\[ \]" PRD.md

# Extract feature categories
grep "^##" PRD.md | sed 's/## //'
```

**Feature Compliance Matrix**:

| PRD Feature | Status | Implementation Location | Gap |
|-------------|--------|------------------------|-----|
| Notice Types | ? | `src/lib/noticeTypes.ts` | List missing types |
| Council Data | ? | `councils/` | Check completeness |
| Payment Flow | ? | `server/routes/stripe.ts` | Verify webhook |
| Notifications | ? | `server/services/email.ts` | Test delivery |
| User Auth | ? | `src/lib/supabase.ts` | Check role-based access |

#### 3.2 Notice Type Completeness Audit

```bash
# List all defined notice types
grep -A5 "noticeTypes\|NoticeType" src/lib/noticeTypes.ts | head -50

# Check schema registry
cat src/next/publish/schema/registry.ts | grep "export\|register"

# Verify templates exist for each type
ls -la templates/ src/next/publish/templates/
```

#### 3.3 Council Data Completeness

```bash
# Count councils
ls councils/ | wc -l

# Check council data structure
head -50 councils/sample-council.json 2>/dev/null || cat councils/*/index.json | head -50
```

#### 3.4 Technical Debt Inventory

**Debt Categories**:

| Category | Detection Method | Count | Priority |
|----------|------------------|-------|----------|
| Dead code | `ts-prune` | ? | Medium |
| Duplicate code | `jscpd` | ? | Low |
| Missing types | `tsc --strict` | ? | High |
| Outdated patterns | Manual review | ? | Medium |
| Test coverage gaps | `vitest --coverage` | ? | High |

```bash
# Find potentially dead exports
npx ts-prune | head -30

# Find duplicate code
npx jscpd --pattern "src/**/*.{ts,tsx}" --ignore "node_modules" --min-lines 5

# Check test coverage
npm run coverage 2>&1 | tee coverage-report.txt
grep -E "All files|Statements|Branches|Functions|Lines" coverage-report.txt
```

#### 3.5 Missing Integration Gaps

```bash
# Check for stub implementations
grep -r "TODO\|NOT_IMPLEMENTED\|throw.*Error.*not implemented" src/ server/ --include="*.ts" --include="*.tsx"

# Find empty function bodies
grep -rn "() => {}" src/ server/ --include="*.ts" --include="*.tsx"

# Check for mock data that should be replaced
grep -r "mock\|MOCK\|dummy\|DUMMY\|fake\|FAKE" src/ server/ --include="*.ts" --include="*.tsx" | grep -v test | head -20
```

### Deliverables

- [ ] **AUDIT-P3-prd-compliance.md**: Feature-by-feature PRD status
- [ ] **AUDIT-P3-feature-gaps.md**: Missing features with specifications
- [ ] **AUDIT-P3-technical-debt.md**: Categorized debt with remediation estimates
- [ ] **AUDIT-P3-notice-type-audit.md**: Complete notice type implementation status
- [ ] **AUDIT-P3-priority-matrix.md**: Gaps ranked by business impact

### Success Criteria

| Criterion | Target |
|-----------|---------|
| PRD compliance measured | % complete calculated per feature area |
| All gaps documented | Each gap includes: description, impact, effort estimate |
| Technical debt quantified | Debt items with hours-to-fix estimates |
| Priority ranking complete | MoSCoW or similar prioritization applied |

---

## Phase 4: Remediation Roadmap
*Prioritized action plan with effort estimates*

### Objectives
1. Create actionable fix list from audit findings
2. Estimate effort for each remediation item
3. Sequence fixes by dependency and priority
4. Define success metrics and acceptance criteria

### Duration
**Estimated**: 3-4 hours

### Techniques

#### 4.1 Fix Categorization

**Impact/Effort Matrix**:

```
              Low Effort    High Effort
            +-------------+-------------+
High Impact |  QUICK WINS |  BIG BETS   |
            |  Do First   |  Plan Well  |
            +-------------+-------------+
Low Impact  |  FILL-INS   |  AVOID      |
            |  Do Later   |  Defer/Skip |
            +-------------+-------------+
```

**Effort Estimation Framework**:

| Size | Hours | Description |
|------|-------|-------------|
| XS | <1h | Config change, single-line fix |
| S | 1-4h | Single function, isolated component |
| M | 4-8h | Multiple files, one feature area |
| L | 1-3 days | Cross-cutting, multiple integrations |
| XL | 3-5 days | Architectural change, major refactor |

#### 4.2 Dependency Mapping

```bash
# Create fix dependency graph
# Format: [FIX-ID] depends on [FIX-ID]
cat > fix-dependencies.txt << 'EOF'
# Critical Path
FIX-001: Database schema fixes (no deps)
FIX-002: API endpoint repairs (depends: FIX-001)
FIX-003: Frontend integration (depends: FIX-002)
FIX-004: E2E test fixes (depends: FIX-003)
FIX-005: Payment flow completion (depends: FIX-002)
EOF
```

#### 4.3 Sprint Planning Template

**Week 1: Foundation Fixes**

| ID | Task | Size | Owner | Status |
|----|------|------|-------|--------|
| FIX-001 | Fix database migration issues | M | -- | ? |
| FIX-002 | Repair broken API endpoints | M | -- | ? |
| FIX-003 | Update TypeScript errors | S | -- | ? |

**Week 2: Integration Repair**

| ID | Task | Size | Owner | Status |
|----|------|------|-------|--------|
| FIX-004 | Complete notice publish flow | L | -- | ? |
| FIX-005 | Fix council data fetching | M | -- | ? |
| FIX-006 | Repair search functionality | M | -- | ? |

**Week 3: Feature Completion**

| ID | Task | Size | Owner | Status |
|----|------|------|-------|--------|
| FIX-007 | Complete payment integration | L | -- | ? |
| FIX-008 | Finish email notifications | M | -- | ? |
| FIX-009 | Add missing notice types | L | -- | ? |

**Week 4: Polish & Ship**

| ID | Task | Size | Owner | Status |
|----|------|------|-------|--------|
| FIX-010 | Fix failing E2E tests | M | -- | ? |
| FIX-011 | UI polish and bug fixes | M | -- | ? |
| FIX-012 | Documentation update | S | -- | ? |

#### 4.4 Success Metrics Definition

**Definition of Done for Each Fix**:

1. Code change implemented
2. Unit tests passing (if applicable)
3. Integration tests passing
4. Code reviewed (or AI-assisted review)
5. Deployed to staging/preview
6. Smoke tested in staging

**Overall Project Completion Metrics**:

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| E2E Tests Passing | --% | 95%+ | `npx playwright test` |
| API Endpoints Working | --% | 100% | Manual + automated testing |
| TypeScript Errors | -- | 0 | `npx tsc --noEmit` |
| Test Coverage | --% | 70%+ | `npm run coverage` |
| Security Vulns (High) | -- | 0 | `npm audit` |

#### 4.5 Risk Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Unknown dependencies | Medium | High | Phase 2 thorough integration testing |
| Scope creep during fixes | High | Medium | Strict fix scope, defer non-critical |
| External service issues | Low | High | Mock services for development |
| Time estimation errors | Medium | Medium | 1.5x buffer on estimates |

### Deliverables

- [ ] **AUDIT-P4-fix-list.md**: Complete list of all fixes needed
- [ ] **AUDIT-P4-roadmap.md**: Week-by-week remediation plan
- [ ] **AUDIT-P4-estimates.md**: Effort estimates with assumptions
- [ ] **AUDIT-P4-success-metrics.md**: Measurable completion criteria
- [ ] **AUDIT-FINAL-SUMMARY.md**: Executive summary of all findings and plan

### Success Criteria

| Criterion | Target |
|-----------|---------|
| All fixes identified | 100% coverage of Phase 2-3 findings |
| Estimates provided | Every fix has size estimate (XS-XL) |
| Roadmap created | Weekly breakdown with dependencies |
| Acceptance criteria defined | Each fix has measurable done criteria |

---

## Appendix A: Tool Installation

```bash
# Install analysis tools
npm install -D depcheck jscpd ts-prune

# Install Playwright if not present
npm install -D @playwright/test
npx playwright install

# ESLint complexity plugin
npm install -D eslint-plugin-complexity
```

## Appendix B: Audit Checklist Summary

### Phase 0 Checklist
- [ ] File inventory complete
- [ ] Line counts by file type
- [ ] TODOs/FIXMEs extracted
- [ ] Git history analyzed
- [ ] Documentation reviewed

### Phase 1 Checklist
- [ ] npm audit run
- [ ] Dependency tree analyzed
- [ ] TypeScript strict check
- [ ] ESLint report generated
- [ ] Architecture diagram created
- [ ] Circular dependencies checked

### Phase 2 Checklist
- [ ] API endpoints tested
- [ ] Frontend-backend mapping complete
- [ ] Supabase connection verified
- [ ] Stripe integration tested
- [ ] Email service tested
- [ ] E2E tests run
- [ ] Data flow documented

### Phase 3 Checklist
- [ ] PRD compliance reviewed
- [ ] Notice types audited
- [ ] Council data checked
- [ ] Technical debt inventoried
- [ ] Coverage report generated
- [ ] Gaps prioritized

### Phase 4 Checklist
- [ ] Fixes categorized
- [ ] Effort estimated
- [ ] Dependencies mapped
- [ ] Roadmap created
- [ ] Success metrics defined
- [ ] Final summary written

---

## Appendix C: Quick Reference Commands

```bash
# === PHASE 0 ===
# Count TypeScript files
find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules | wc -l

# Find TODOs
grep -r "TODO" src/ server/ --include="*.ts" --include="*.tsx" | wc -l

# === PHASE 1 ===
# Security check
npm audit --audit-level=high

# Outdated deps
npm outdated

# Type check
npx tsc --noEmit

# === PHASE 2 ===
# API test
curl http://localhost:5174/api/health

# Run E2E
npx playwright test

# === PHASE 3 ===
# Coverage
npm run coverage

# Dead code
npx ts-prune | head -20

# === PHASE 4 ===
# Validate fixes
npm run lint && npm run typecheck && npm run test
```

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|----------|
| 1.0 | 2026-01-29 | System Architect | Initial comprehensive PRD |

---

*This PRD follows industry-standard audit frameworks including IEEE 1028 (Software Reviews), CAST AIP metrics, and SonarQube quality gates adapted for a project recovery scenario.*
