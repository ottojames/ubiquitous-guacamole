# Phase 1: Council Template System - Context

**Gathered:** 2026-01-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Councils can create and use templates for all 30+ notice types. Templates are department-owned, locked structures with placeholders. When used, templates pre-fill notices with form-collected values. This phase focuses on the template authoring and usage experience — not the publish flow itself.

**Important scope note:** Not all notice types require newspaper publication (some only need site notices). Research must identify which notice types should be excluded from the template/publication system.

</domain>

<decisions>
## Implementation Decisions

### Two Upload Paths
- **Structured template path:** User selects notice type, council's template is used, user fills form fields that map to placeholders
- **File upload path:** User uploads document (e.g., blue notice from council), OCR extracts text, user can edit on final step
- Both paths already exist in codebase — verify and fix rather than rebuild

### Template Editor Experience
- Rich text editor (WYSIWYG) for council staff authoring templates
- Placeholder insertion via dropdown menu (existing implementation)
- Side-by-side live preview — editor on left, rendered preview on right, updates as you type
- When user fills template: locked structure, form fields only — no editing of template text itself

### Template Organization
- Strictly department-owned — each department creates and sees only their own templates
- One template per notice type per department
- No versioning — edits apply immediately, existing notices unaffected (they stored rendered text at creation time)
- Organization within department: Claude's discretion based on existing UI

### Placeholder System
- Double brace format: `{{applicant_name}}`, `{{premises_address}}`
- Fixed placeholders per notice type — councils cannot add custom fields
- No default values — every placeholder must be filled by user
- Required placeholders marked with asterisk in dropdown/editor

### Validation Behavior
- Real-time validation — warnings appear as user types
- Missing required placeholders block save — cannot save template until all required placeholders included
- All form fields are mandatory when filling out a notice — user must complete every field
- Template uses only the placeholders the council included — form is standardized, template is customized

### Claude's Discretion
- Invalid placeholder handling (recommend: error, block save)
- Template list organization within department
- Specific error message wording
- Editor toolbar configuration

</decisions>

<specifics>
## Specific Ideas

- "The council at the end of the day they have their template, they have their placeholders within the template, but the user still has the same form every time regardless of the council"
- Existing code: Templates.tsx, TemplateTextEditor.tsx, TemplateValidationWarnings.tsx — verify these work before building new

</specifics>

<deferred>
## Deferred Ideas

- Research which notice types don't require newspaper publication (site notice only) — affects which templates should exist
- Removal of notice types/departments that shouldn't be in publication system — scope for research phase

</deferred>

---

*Phase: 01-council-template-system*
*Context gathered: 2026-01-22*
