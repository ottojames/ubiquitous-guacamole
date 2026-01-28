# Question Protocol

This document defines when and how agents should ask questions.

## Core Principle

**Ask early, ask clearly, ask once.**

Asking questions BEFORE building prevents wasted work. A 2-minute clarification saves hours of rework.

## When To Ask

### Always Ask When

1. **Requirements are ambiguous**
   - "Add a filter" - Filter what? Filter how?
   - "Make it faster" - What's slow? What's the target?
   - "Fix the bug" - Which bug? What's expected?

2. **Multiple valid approaches exist**
   - "Should I use URL params or React state?"
   - "Should this be client-side or server-side?"
   - "Should this be a new component or extend existing?"

3. **Scope might be larger than expected**
   - "This will affect 10+ files, is that expected?"
   - "This requires a database migration, should I proceed?"
   - "This will change the public API, is that intentional?"

4. **User experience decisions needed**
   - "Should invalid input show an error or be silently corrected?"
   - "Should this action require confirmation?"
   - "What should the empty state look like?"

5. **Breaking changes possible**
   - "This will change existing behavior, is that OK?"
   - "This removes a feature, is that intentional?"
   - "Existing data will need migration, how should we handle it?"

### Never Ask When

1. **Answer is in the codebase** - Search first
2. **Answer is obvious from context** - Don't over-clarify
3. **Decision has minimal impact** - Just pick one
4. **Already asked before** - Check conversation history

## How To Ask

### Format

```
Before I proceed, I need clarification:

**[Question 1 Topic]**
[Clear question ending with ?]
- Option A: [Brief description]
- Option B: [Brief description]

**[Question 2 Topic]** (if needed)
[Clear question ending with ?]
- Option A: [Brief description]
- Option B: [Brief description]
```

### Rules

1. **Maximum 4 questions** per interaction
2. **Provide options** when possible (not open-ended)
3. **Prioritize** by impact on approach
4. **Group related questions** together
5. **Explain why** the answer matters

### Good vs Bad Questions

**Bad**: "What should I do?"
**Good**: "Should the filter persist across page refreshes? (A) Yes, via URL params (B) No, reset on refresh"

**Bad**: "Is this OK?"
**Good**: "This approach requires adding a new API endpoint. Should I (A) proceed with that or (B) implement client-side only?"

**Bad**: "I have some questions..."
**Good**: "Before I implement, I need to clarify the scope:
1. Should the filter apply to both list and map views?
2. Should we remember the user's last filter selection?"

## Question Examples By Agent

### Analyst Questions
```
**Scope Clarification**
I found both legacy and new publish flows. Which should I modify?
- Option A: New wizard flow only (src/next/publish/)
- Option B: Both flows
- Option C: Legacy only (src/pages/PublishPage.tsx)

**Requirements Clarification**
The request mentions "filter by type". I found 3 notice types in the codebase. Should the filter:
- Option A: Include all 3 types as options
- Option B: Only show types that have existing notices
```

### Architect Questions
```
**Implementation Approach**
Two approaches are viable:
- Option A: Client-side filtering (simpler, works for MVP, may be slow with 1000+ notices)
- Option B: Server-side filtering (requires API change, scales better)

Which should I design for?

**State Management**
Should the filter state be:
- Option A: URL params (shareable, survives refresh)
- Option B: React state (simpler, resets on navigation)
```

### Critic Questions
```
**Risk Acceptance**
This plan filters client-side. With 1000+ notices, this could be slow.
- Option A: Accept this risk for MVP
- Option B: Block and redesign for server-side filtering
```

### Browser Agent Questions
```
**Visual Verification**
The dropdown appears but styling differs from other dropdowns on the site.
- Option A: This is intentional, proceed
- Option B: This needs to match other dropdowns, needs fix
```

## Escalation Questions

When verification fails 3 times:

```
**Escalation Required**

I've attempted to fix this issue 3 times without success.

**Issue**: [Description]

**Attempts Made**:
1. [What was tried] → [Why it failed]
2. [What was tried] → [Why it failed]
3. [What was tried] → [Why it failed]

**My Best Hypothesis**: [What I think is wrong]

**Questions for Human**:
1. Is my understanding of the expected behavior correct?
2. Am I missing context about how this system works?
3. Should I try a completely different approach?
```

## Response Handling

When the user answers:

1. **Acknowledge** the answer briefly
2. **Proceed** with the chosen approach
3. **Don't re-ask** the same question
4. **Reference** the decision if relevant later

Example:
```
User: "Option A - URL params"

Agent: "Got it - using URL params for filter state. Proceeding with the implementation..."
```

## Remember

Questions are a feature, not a weakness. The best developers ask clarifying questions. The worst developers assume and build the wrong thing.

But respect the user's time - ask only what's necessary, group questions efficiently, and provide clear options.
