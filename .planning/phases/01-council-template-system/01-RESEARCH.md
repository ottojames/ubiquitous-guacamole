# Phase 1: Council Template System - Research

**Researched:** 2026-01-22
**Domain:** Template authoring, placeholder validation, notice type management
**Confidence:** HIGH

## Summary

Research confirms a comprehensive template system already exists in the codebase. The core infrastructure is implemented:
- UI components: `Templates.tsx`, `TemplateTextEditor.tsx`, `TemplateValidationWarnings.tsx`
- Database schema with validation triggers
- Placeholder registry for 32+ notice types
- API endpoints for CRUD operations

The phase requires **verification and integration testing** rather than building from scratch. Key gaps are: (1) lack of side-by-side preview, (2) template text not being used when creating notices, and (3) missing placeholders for some notice types in database validation trigger.

**Primary recommendation:** Focus on testing existing flows end-to-end, then fix gaps where template_text isn't rendered into notice output.

## Standard Stack

The existing codebase already uses the correct technology stack. No new dependencies needed.

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.x | UI components | Already in project |
| Supabase | - | Database + Auth | Already in project |
| Zod | - | Schema validation | Already used for notice validation |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| contentEditable | native | Rich text editing | Already implemented in TemplateTextEditor |
| document.execCommand | native | Formatting (bold/italic/underline) | Already implemented |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| contentEditable | TipTap/Slate/ProseMirror | More features but higher complexity; current implementation sufficient for placeholder-based templates |
| regex placeholder extraction | Mustache/Handlebars | Would add dependency; current `{{TOKEN}}` regex is adequate |

**Installation:** No new packages required.

## Architecture Patterns

### Existing Project Structure
```
src/pages/council/
├── Templates.tsx                  # Template list + create/edit modal
├── TemplateTextEditor.tsx         # WYSIWYG editor with placeholder insertion
├── TemplateValidationWarnings.tsx # Real-time validation display
└── NoticeEditor.tsx               # Consumes templates via ?template= param

src/next/publish/config/
├── placeholders.ts                # Placeholder definitions per notice type
├── noticeTypes.ts                 # 32 notice definitions with templateKey
└── departmentNoticeTypes.ts       # Maps department types to notice types

server/routes/
└── templates.ts                   # CRUD API endpoints

supabase/migrations/
├── 20251021000003_templates_attachments.sql  # Base schema
└── 20251117000001_template_text_support.sql  # Validation trigger
```

### Pattern 1: Placeholder Registry Pattern
**What:** Centralized definition of available placeholders per notice type
**When to use:** When rendering templates or validating completeness
**Example:**
```typescript
// Source: src/next/publish/config/placeholders.ts
export const PLACEHOLDER_REGISTRY: Record<string, NoticePlaceholderSet> = {
  'licensing-premises-new': {
    noticeType: 'licensing-premises-new',
    displayName: 'Premises Licence - New',
    placeholders: [
      { token: 'APPLICANT_NAME', label: 'Applicant Name', required: true, ... },
      { token: 'PREMISES_ADDRESS', label: 'Premises Address', required: true, ... },
      // ...
    ],
  },
  // ...32 total notice types
};
```

### Pattern 2: Template-to-Notice Flow
**What:** Templates pre-fill notice editor via URL parameter
**When to use:** When user clicks "Use Template"
**Example:**
```typescript
// Source: src/pages/council/Templates.tsx
const handleUseTemplate = (template: Template) => {
  window.location.href = `/c/${orgSlug}/${deptSlug}/notices/new?template=${template.id}`;
};

// Source: src/pages/council/NoticeEditor.tsx
const templateId = searchParams.get('template');
if (templateId) {
  loadTemplateAndApply(templateId);
}
```

### Pattern 3: Database Validation Trigger
**What:** PostgreSQL trigger auto-validates template placeholders on save
**When to use:** Ensures data integrity at database level
**Example:**
```sql
-- Source: 20251117000001_template_text_support.sql
CREATE TRIGGER templates_validate_placeholders
  BEFORE INSERT OR UPDATE OF template_text, notice_type ON public.templates
  FOR EACH ROW
  EXECUTE FUNCTION validate_template_placeholders();
```

### Anti-Patterns to Avoid
- **Building new template UI from scratch:** Existing UI is functional, fix don't rebuild
- **Storing rendered text at template time:** Templates store text with placeholders; rendering happens at notice creation
- **Duplicating placeholder definitions:** Single source of truth in `placeholders.ts`

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Rich text editing | Custom textarea with markdown | contentEditable + execCommand | Already implemented in TemplateTextEditor |
| Placeholder validation | Custom string parsing | `validateTemplatePlaceholders()` function | Handles required/optional, statutory clauses |
| Notice type filtering | Manual filtering | `getNoticeTypesForDepartment()` | Department-scoped filtering already works |
| Template retrieval | Direct Supabase calls | `get_active_template()` SQL function | Handles is_active, is_validated, ordering |

**Key insight:** 80% of the template system exists. The work is testing and integration, not implementation.

## Common Pitfalls

### Pitfall 1: Template Text Not Rendered into Notice
**What goes wrong:** Template is applied but only `default_values` (JSON) are used; `template_text` with placeholders is ignored
**Why it happens:** `applyTemplateDefaults()` in NoticeEditor.tsx only spreads `default_values`, not `template_text`
**How to avoid:** Must implement placeholder substitution when creating notice from template
**Warning signs:** Notice created from template has no description/body text

### Pitfall 2: Mismatch Between Frontend and Database Required Placeholders
**What goes wrong:** Frontend shows different required placeholders than database trigger validates
**Why it happens:** Database trigger `validate_template_placeholders()` has hardcoded required list that may not match `placeholders.ts`
**How to avoid:** Sync database trigger CASE statement with `getRequiredPlaceholders()` output
**Warning signs:** Template saves with warnings in UI but `is_validated = true` in database (or vice versa)

### Pitfall 3: Missing Placeholder Definitions for Notice Types
**What goes wrong:** TemplateTextEditor shows "No placeholders available for this notice type"
**Why it happens:** Notice type not in `PLACEHOLDER_REGISTRY` (e.g., some transfer types)
**How to avoid:** Verify all 32 notice types have entries in `PLACEHOLDER_REGISTRY`
**Warning signs:** Dropdown shows 0 placeholders when creating template for certain types

### Pitfall 4: Side-by-Side Preview Not Implemented
**What goes wrong:** User expectation from CONTEXT.md not met
**Why it happens:** CONTEXT.md specifies "Side-by-side live preview - editor on left, rendered preview on right" but this doesn't exist
**How to avoid:** Add preview panel that substitutes placeholders with example values
**Warning signs:** User confusion about what final notice will look like

## Code Examples

Verified patterns from existing codebase:

### Insert Placeholder at Cursor
```typescript
// Source: src/pages/council/TemplateTextEditor.tsx (lines 114-163)
const insertPlaceholder = (token: string) => {
  const editor = editorRef.current;
  if (!editor) return;

  const placeholder = `{{${token}}}`;
  editor.focus();

  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    // Append to end
    isUserInputRef.current = true;
    onChange(value + placeholder);
    editor.innerHTML = value + placeholder;
  } else {
    // Insert at cursor
    const range = selection.getRangeAt(0);
    range.deleteContents();
    const textNode = document.createTextNode(placeholder);
    range.insertNode(textNode);
    range.setStartAfter(textNode);
    isUserInputRef.current = true;
    onChange(editor.innerHTML);
  }
};
```

### Validate Template Completeness
```typescript
// Source: src/next/publish/config/placeholders.ts (lines 1357-1392)
export function validateTemplatePlaceholders(
  templateText: string,
  noticeType: string
): { isValid: boolean; missingRequired: string[]; warnings: string[] } {
  const required = getRequiredPlaceholders(noticeType);
  const missingRequired: string[] = [];
  const warnings: string[] = [];

  for (const placeholder of required) {
    const pattern = new RegExp(`\\{\\{${placeholder.token}\\}\\}`, 'g');
    if (!pattern.test(templateText)) {
      missingRequired.push(placeholder.token);
    }
  }

  // Check for statutory clause (licensing notices only)
  if (noticeType.startsWith('licensing-')) {
    if (!templateText.includes('Licensing Act 2003')) {
      warnings.push('Template should reference "Licensing Act 2003" for legal compliance');
    }
  }

  return { isValid: missingRequired.length === 0, missingRequired, warnings };
}
```

### Template Usage Counter Increment
```sql
-- Source: 20251021000003_templates_attachments.sql (lines 119-143)
CREATE OR REPLACE FUNCTION track_template_usage()
RETURNS TRIGGER AS $$
DECLARE
  template_uuid UUID;
BEGIN
  template_uuid := (NEW.extras->>'template_id')::UUID;

  IF template_uuid IS NOT NULL THEN
    UPDATE public.templates
    SET use_count = use_count + 1, last_used_at = NOW()
    WHERE id = template_uuid;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `default_values` JSON only | `template_text` with placeholders | Migration 20251117 | Enables council-customized notice wording |
| No validation | Database trigger + frontend validation | Migration 20251117 | Ensures required placeholders present |
| Manual use count | Automatic trigger on notice insert | Migration 20251021 | Accurate template usage analytics |

**Deprecated/outdated:**
- Direct template text storage without placeholder substitution: Must render at notice creation time

## Open Questions

Things that couldn't be fully resolved:

1. **Notice Type Count Discrepancy**
   - What we know: CONTEXT.md says "30+ notice types", code has 32 definitions, PLACEHOLDER_REGISTRY has ~35 entries
   - What's unclear: Are all placeholders actually defined? Some transfer types may be missing
   - Recommendation: Audit `PLACEHOLDER_REGISTRY` keys against `NOTICE_DEFINITIONS` IDs

2. **Statutory Clause Enforcement**
   - What we know: Validation checks for "Licensing Act 2003" in licensing templates
   - What's unclear: Should missing statutory clause block save (currently warning only)?
   - Recommendation: Per CONTEXT.md "Missing required placeholders block save", consider adding statutory clause to required list

3. **Preview Rendering Implementation**
   - What we know: CONTEXT.md requires side-by-side preview
   - What's unclear: Best approach for preview (sample data? form data?)
   - Recommendation: Use `PlaceholderDefinition.example` values for preview substitution

## Sources

### Primary (HIGH confidence)
- `src/pages/council/Templates.tsx` - Template management UI implementation
- `src/pages/council/TemplateTextEditor.tsx` - WYSIWYG editor implementation
- `src/pages/council/TemplateValidationWarnings.tsx` - Validation display
- `src/next/publish/config/placeholders.ts` - Placeholder registry (1435 lines)
- `src/next/publish/config/noticeTypes.ts` - Notice definitions (438 lines)
- `supabase/migrations/20251117000001_template_text_support.sql` - Database validation
- `src/pages/council/NoticeEditor.tsx` - Template consumption flow

### Secondary (MEDIUM confidence)
- `server/routes/templates.ts` - API endpoints (verified against Supabase client calls in Templates.tsx)

### Tertiary (LOW confidence)
- None - all findings verified against codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No external dependencies needed, existing stack verified
- Architecture: HIGH - Existing patterns documented from actual code
- Pitfalls: HIGH - Identified through code analysis and CONTEXT.md comparison

**Research date:** 2026-01-22
**Valid until:** 2026-02-22 (30 days - stable domain, low churn)

## Key Findings for Planner

### What Already Works
1. Template CRUD via Templates.tsx + Supabase
2. Placeholder insertion with TemplateTextEditor
3. Validation display via TemplateValidationWarnings
4. Notice type filtering by department
5. API endpoints for templates
6. Database schema with validation trigger
7. Template usage tracking

### What Needs Work
1. **Template text rendering:** `template_text` not substituted into notice at creation time
2. **Side-by-side preview:** Not implemented, required by CONTEXT.md
3. **Placeholder coverage audit:** Verify all 32 notice types have placeholders defined
4. **Database validation sync:** Align trigger's required placeholders with frontend
5. **Save blocking:** Currently warnings only; should block save on missing required

### Suggested Task Ordering
1. Audit existing components work correctly (manual testing)
2. Add placeholder definitions for any missing notice types
3. Sync database trigger with frontend required placeholders
4. Implement side-by-side preview in TemplateTextEditor
5. Implement placeholder substitution when notice created from template
6. Add save-blocking behavior for missing required placeholders
7. E2E test: create template -> use template -> verify notice text
