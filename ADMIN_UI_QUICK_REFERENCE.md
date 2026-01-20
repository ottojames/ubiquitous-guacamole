# Admin Panel UI Patterns - Quick Reference Guide

## Stack Recommendations

### Recommended Stack (Maximum Flexibility)
```
TanStack Table v8          → Headless data tables
Radix UI                   → Accessible primitives
Tailwind CSS               → Styling
React Hook Form + Zod      → Forms & validation
React Query                → Data fetching
```

### Alternative Stack (Faster Development)
```
React-Admin                → Full admin framework
Material-UI                → Component library
React Query                → Data fetching
```

### Design System Stack
```
shadcn/ui                  → Copy-paste components
Tailwind CSS               → Styling
Radix UI (underneath)      → Accessibility
Storybook                  → Component documentation
```

---

## Key Libraries Comparison

| Feature | TanStack Table | React-Admin | Material-UI | shadcn/ui |
|---------|---|---|---|---|
| Bundle Size | 5-10KB | ~100KB | ~150KB | Variable |
| Learning Curve | Medium | Medium | Easy | Easy |
| Customization | Very High | Medium | Medium | Very High |
| Accessibility | Build yourself | Built-in | Built-in | Built-in |
| Dark Mode | Manual | Built-in | Built-in | Built-in |
| TypeScript | Excellent | Good | Good | Excellent |
| Best For | Custom UI | Quick CRUD | Enterprise | Modern React |

---

## Component Architecture Patterns

### Data Table Pattern
```
┌─ TableHeader
│  ├─ FilterInputs (debounced)
│  └─ ColumnVisibilityToggle
├─ TableBody
│  ├─ DataRows (with sorting indicators)
│  └─ EmptyState / SkeletonRows
└─ TableFooter
   ├─ RowCountDisplay
   └─ PaginationControls
```

### Modal Form Pattern
```
┌─ ModalOverlay (semi-transparent)
├─ ModalContent
│  ├─ DialogTitle
│  ├─ DialogDescription
│  ├─ FormFields
│  │  └─ InlineValidation
│  └─ ActionButtons
└─ FocusTrap
```

### Responsive Layout Pattern
```
Mobile (< 640px)
├─ HamburgerMenu
├─ Content (full width)
└─ BottomNavigation

Tablet (640px - 1024px)
├─ CollapsedSidebar
├─ Content
└─ (Desktop layout starts)

Desktop (> 1024px)
├─ Sidebar (w-64)
├─ Content (flex-1)
└─ Header
```

---

## Implementation Checklist

### Data Table
- [ ] TanStack Table hook setup (useReactTable)
- [ ] Sorting implementation (getSortedRowModel)
- [ ] Filtering setup (getFilteredRowModel + debounced inputs)
- [ ] Pagination (getPaginationRowModel or manual server-side)
- [ ] Row selection (for bulk actions)
- [ ] Keyboard navigation (arrow keys, Enter, Space)
- [ ] ARIA attributes (role="grid", aria-sort, aria-rowcount)
- [ ] Skeleton loading states
- [ ] Empty state UI
- [ ] Error handling & retry

### Modal & Form
- [ ] Radix UI Dialog wrapper
- [ ] Focus trap (automatic with Radix)
- [ ] Form state management (React Hook Form)
- [ ] Schema validation (Zod)
- [ ] Inline error messages
- [ ] Loading indicator on submit
- [ ] Success/error feedback
- [ ] Form reset on close
- [ ] Accessibility (aria-invalid, aria-describedby)
- [ ] Mobile-responsive width

### Layout
- [ ] Sidebar (collapsible on mobile)
- [ ] Top navigation header
- [ ] Main content area (max-width container)
- [ ] Mobile overlay for sidebar
- [ ] Hamburger menu toggle
- [ ] Responsive breakpoints
- [ ] Sticky header option
- [ ] Theme toggle button
- [ ] User menu dropdown
- [ ] Mobile navigation

### Loading & Error States
- [ ] Distinguish loading types (initial, background, optimistic)
- [ ] Skeleton loaders for tables
- [ ] Spinner for small operations
- [ ] Error boundary wrapper
- [ ] Retry buttons
- [ ] Error toast notifications
- [ ] Empty state messaging
- [ ] Optimistic UI updates
- [ ] Loading disabled form states

### Accessibility
- [ ] ARIA roles (grid, dialog, button, etc.)
- [ ] Keyboard navigation support
- [ ] Focus management & visible indicators
- [ ] Color contrast (WCAG AA 4.5:1)
- [ ] Semantic HTML
- [ ] Screen reader testing
- [ ] Icon alt text / aria-labels
- [ ] Form label associations
- [ ] Live region announcements

### Dark Mode
- [ ] CSS variables for colors
- [ ] Theme context provider
- [ ] localStorage persistence
- [ ] System preference detection
- [ ] Theme toggle component
- [ ] Tailwind dark: prefix usage
- [ ] Test both light & dark
- [ ] Ensure sufficient contrast

---

## Code Snippets

### Basic TanStack Table Setup
```typescript
const table = useReactTable({
  data,
  columns,
  state: { sorting, columnFilters, pagination },
  onSortingChange: setSorting,
  onColumnFiltersChange: setColumnFilters,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
});
```

### Radix Dialog with Form
```typescript
<Dialog.Root>
  <Dialog.Trigger>Open</Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Overlay />
    <Dialog.Content>
      <Dialog.Title>Title</Dialog.Title>
      <Form />
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
```

### React Hook Form with Zod
```typescript
const { control, handleSubmit } = useForm({
  resolver: zodResolver(schema),
  defaultValues: initialData,
});
```

### Responsive Breakpoint
```typescript
const isSmall = useMediaQuery('(max-width: 768px)');
```

### Dark Mode Context
```typescript
<ThemeProvider>
  <App />
</ThemeProvider>
```

---

## Performance Optimization

### For Large Tables
- [ ] Virtual scrolling (react-window)
- [ ] Memoize rows (React.memo)
- [ ] Debounce filters (300ms)
- [ ] Server-side pagination
- [ ] Column visibility toggle
- [ ] Lazy column rendering

### General
- [ ] Code splitting for admin routes
- [ ] Lazy load heavy dependencies
- [ ] Image optimization
- [ ] Minimize re-renders (useMemo, useCallback)
- [ ] CSS-in-JS optimization (emotion/styled)

---

## Testing Strategy

### Unit Tests (Vitest + React Testing Library)
```typescript
describe('DataTable', () => {
  it('renders with data', () => {
    render(<DataTable data={mockData} columns={columns} />);
    expect(screen.getByText('Expected')).toBeInTheDocument();
  });
});
```

### E2E Tests (Playwright)
```typescript
test('admin workflow', async ({ page }) => {
  await page.goto('/admin/users');
  await page.click('button:has-text("Add")');
  await page.fill('input[name="name"]', 'John');
  await page.click('button:has-text("Save")');
});
```

### Accessibility Testing
- [ ] Use axe DevTools
- [ ] Keyboard navigation (Tab, Arrow keys, Escape)
- [ ] Screen reader (VoiceOver, NVDA)
- [ ] Color contrast checker
- [ ] Lighthouse accessibility score (90+)

---

## Common Patterns

### Server-Side Pagination
```typescript
useQuery({
  queryKey: ['items', page, pageSize],
  queryFn: () => fetch(`/api/items?page=${page}&limit=${pageSize}`),
});
```

### Optimistic Updates
```typescript
useMutation({
  onMutate: () => updateLocalCache(),
  onError: () => rollbackCache(),
});
```

### Debounced Search
```typescript
const debouncedSearch = useDebounce(searchValue, 300);
```

### Focus Trap in Modal
```typescript
<FocusTrap>
  <Dialog>Content</Dialog>
</FocusTrap>
```

### Responsive Grid
```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
```

---

## Accessibility Checklist

### ARIA
- [ ] role="grid" on tables
- [ ] role="dialog" on modals
- [ ] aria-label on icon buttons
- [ ] aria-sort on sortable columns
- [ ] aria-live on dynamic content
- [ ] aria-invalid on form errors
- [ ] aria-describedby for error messages

### Keyboard Navigation
- [ ] Tab through interactive elements
- [ ] Enter to activate buttons
- [ ] Escape to close modals
- [ ] Arrow keys for table navigation
- [ ] Space to select/toggle
- [ ] Home/End for first/last item

### Focus Management
- [ ] Visible focus indicator (3px outline)
- [ ] Logical tab order
- [ ] Focus restoration after modal close
- [ ] Focus trap in modals
- [ ] No focus removed without replacing

### Color & Contrast
- [ ] Normal text: 4.5:1 contrast
- [ ] Large text: 3:1 contrast
- [ ] UI components: 3:1 contrast
- [ ] No color-only information
- [ ] Alt text for images
- [ ] Captions for videos

### Semantic HTML
- [ ] Use <button> not <div>
- [ ] Use <label> for form inputs
- [ ] Use <select> for dropdowns
- [ ] Use <table> for tabular data
- [ ] Use heading hierarchy (h1-h6)
- [ ] Use <form> for forms

---

## Common Mistakes to Avoid

### Data Tables
- ✗ Hiding sort/filter controls
- ✗ No loading state between pages
- ✗ No empty state messaging
- ✗ Poor color contrast in alternating rows
- ✓ Visible sort indicators
- ✓ Skeleton loaders
- ✓ Clear empty state
- ✓ WCAG compliant colors

### Forms
- ✗ No form labels
- ✗ Missing required field indicators
- ✗ Generic error messages
- ✗ Disabled submit button while loading (no feedback)
- ✓ Associated labels with inputs
- ✓ Clear required field marking
- ✓ Specific, helpful error messages
- ✓ Loading state on submit button

### Layout
- ✗ Fixed widths (not responsive)
- ✗ Sidebar doesn't collapse on mobile
- ✗ Unreadable text on small screens
- ✗ Horizontal scroll table on mobile
- ✓ Mobile-first design
- ✓ Collapsible sidebar
- ✓ Responsive font sizes
- ✓ Stacked card layout on mobile

### Accessibility
- ✗ Keyboard navigation broken
- ✗ Focus outline removed
- ✗ Color-only differentiation
- ✗ No alt text
- ✓ Full keyboard support
- ✓ Visible focus indicator
- ✓ Multiple ways to differentiate
- ✓ Descriptive alt text

### Dark Mode
- ✗ Insufficient contrast in dark mode
- ✗ Images not optimized for dark
- ✗ Hard-coded colors instead of variables
- ✗ No system preference detection
- ✓ CSS variables for colors
- ✓ Test both modes
- ✓ Respect prefers-color-scheme
- ✓ Smooth transitions

---

## Resource Links

### Component Libraries
- TanStack Table: https://tanstack.com/table/v8
- Radix UI: https://radix-ui.com/primitives
- shadcn/ui: https://ui.shadcn.com/
- React-Admin: https://marmelab.com/react-admin/
- Material-UI: https://mui.com/

### Styling
- Tailwind CSS: https://tailwindcss.com/
- CSS-in-JS: emotion, styled-components

### Forms
- React Hook Form: https://react-hook-form.com/
- Zod: https://zod.dev/

### Testing
- Vitest: https://vitest.dev/
- React Testing Library: https://testing-library.com/react
- Playwright: https://playwright.dev/

### Accessibility
- WCAG 2.1: https://www.w3.org/WAI/WCAG21/quickref/
- ARIA: https://www.w3.org/WAI/ARIA/apg/
- WebAIM: https://webaim.org/

---

## Next Steps

1. **Choose Stack**: Decide between recommended (flexible) or alternative (fast)
2. **Set Up Base Layout**: Create AdminLayout with responsive sidebar
3. **Implement First Table**: Build example data table with sorting/filtering
4. **Add Form Modal**: Create reusable form dialog component
5. **Add Theme Support**: Implement dark mode with CSS variables
6. **Test Accessibility**: Run through keyboard nav and ARIA checklist
7. **Document Patterns**: Create Storybook stories for components
8. **Performance**: Add virtual scrolling for large lists
9. **E2E Tests**: Write Playwright tests for critical flows
10. **Deploy**: Ship admin panel with monitoring

---

## Questions to Consider

Before implementing, ask:

1. **Data Scale**: How many rows in tables? (affects virtual scrolling need)
2. **Complexity**: Many tables, forms, or dashboards? (affects library choice)
3. **Customization**: High design needs? (affects component library)
4. **Accessibility**: WCAG AA or AAA? (affects testing scope)
5. **Performance**: Real-time updates? (affects state management)
6. **Mobile**: Full admin on mobile? (affects responsive design scope)
7. **Offline**: Offline support needed? (affects data strategy)
8. **Analytics**: Track admin usage? (affects instrumentation)
9. **Security**: Fine-grained permissions? (affects role/feature flags)
10. **Monitoring**: Error tracking? (affects logging setup)

---

*Last updated: January 2026*
