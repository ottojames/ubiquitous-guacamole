# Admin Panel Implementation Guide for Ralph's Civic Notices

Based on the Public Notice Portal architecture, this guide provides specific recommendations for building an admin panel for managing notices, councils, and system configuration.

---

## Project Context

Your project is a full-stack TypeScript application with:
- Frontend: React 19.x + Vite SPA with React Router
- Backend: Express API server
- Database: Supabase (PostgreSQL) with storage
- Styling: Tailwind CSS already configured
- State: React Query available for data fetching

This means you already have a strong foundation for building an admin panel!

---

## Recommended Admin Stack (For Ralph's Civic Notices)

```json
{
  "data-fetching": "react-query@5 (already in project)",
  "tables": "@tanstack/react-table@8",
  "forms": "react-hook-form@7 + zod",
  "modals": "@radix-ui/react-dialog",
  "ui-primitives": "radix-ui/* (primitives)",
  "styling": "tailwind-css (already configured)",
  "testing": "vitest + @testing-library/react (already configured)"
}
```

This stack is already partially in place (React Query, Tailwind, Vitest) and builds on your existing dependencies.

---

## Admin Panel Architecture for Ralph's Civic Notices

### Directory Structure
```
src/
├── admin/                          # New admin section
│   ├── layout/
│   │   ├── AdminLayout.tsx         # Main layout with sidebar
│   │   ├── AdminHeader.tsx
│   │   └── AdminSidebar.tsx
│   ├── pages/
│   │   ├── DashboardPage.tsx       # Overview with key metrics
│   │   ├── NoticesListPage.tsx     # List all notices (CRUD)
│   │   ├── CouncilsPage.tsx        # Manage councils
│   │   ├── UsersPage.tsx           # User management
│   │   └── SettingsPage.tsx        # System settings
│   ├── components/
│   │   ├── NoticeTable.tsx         # Notice data table
│   │   ├── NoticeFormDialog.tsx    # Create/edit modal
│   │   ├── CouncilTable.tsx
│   │   ├── UserTable.tsx
│   │   └── common/
│   │       ├── DataTable.tsx       # Reusable table
│   │       ├── FormDialog.tsx      # Reusable modal
│   │       └── LoadingStates.tsx
│   ├── hooks/
│   │   ├── useNotices.ts           # Notice queries/mutations
│   │   ├── useCouncils.ts
│   │   └── useAdminPagination.ts   # Pagination helper
│   ├── types/
│   │   └── admin.ts                # Admin-specific types
│   └── routes.tsx                  # Admin route definitions
└── (existing structure)
```

### Routes Structure
```typescript
// routes.tsx - Admin route configuration
const adminRoutes = [
  { path: '/admin', element: <AdminLayout />, children: [
    { path: 'dashboard', element: <DashboardPage /> },
    { path: 'notices', element: <NoticesListPage /> },
    { path: 'notices/:id', element: <NoticeDetailPage /> },
    { path: 'councils', element: <CouncilsPage /> },
    { path: 'users', element: <UsersPage /> },
    { path: 'settings', element: <SettingsPage /> },
  ]},
];
```

---

## Step 1: Admin Layout Component

Create the base responsive layout:

```typescript
// src/admin/layout/AdminLayout.tsx
import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const isSmall = useMediaQuery('(max-width: 768px)');

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <aside
        className={`${
          isSmall && !sidebarOpen ? 'hidden' : 'block'
        } ${
          isSmall ? 'fixed inset-0 z-40 w-64' : 'relative w-64'
        } bg-gray-900 text-white transition-all duration-300 overflow-y-auto`}
      >
        <AdminSidebar onClose={() => setSidebarOpen(false)} />
      </aside>

      {/* Mobile overlay */}
      {isSmall && sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader onMenuClick={() => setSidebarOpen(!sidebarOpen)} isSmall={isSmall} />
        <div className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto p-4 md:p-8">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
```

---

## Step 2: Reusable Data Table Component

Build on TanStack Table for notices and other resources:

```typescript
// src/admin/components/common/DataTable.tsx
import React, { useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  PaginationState,
} from '@tanstack/react-table';

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  isLoading?: boolean;
  error?: Error | null;
  onRowClick?: (row: T) => void;
  enableRowSelection?: boolean;
  onSelectionChange?: (selectedIds: string[]) => void;
}

export function DataTable<T extends { id: string }>({
  data,
  columns,
  isLoading,
  error,
  onRowClick,
  enableRowSelection = false,
  onSelectionChange,
}: DataTableProps<T>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [rowSelection, setRowSelection] = React.useState({});

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters, pagination, rowSelection },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  // Notify parent of selection changes
  React.useEffect(() => {
    if (onSelectionChange) {
      const selectedIds = Object.keys(rowSelection)
        .filter(key => rowSelection[key as any])
        .map(idx => data[parseInt(idx)]?.id)
        .filter(Boolean);
      onSelectionChange(selectedIds);
    }
  }, [rowSelection, data, onSelectionChange]);

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <h3 className="font-semibold text-red-900 dark:text-red-200">Error Loading Data</h3>
        <p className="text-red-700 dark:text-red-300 text-sm mt-1">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
        <table className="w-full">
          <thead className="bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-2">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {header.column.getIsSorted() === 'asc' && '↑'}
                        {header.column.getIsSorted() === 'desc' && '↓'}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-200 dark:border-gray-700">
                    {columns.map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              : table.getRowModel().rows.map(row => (
                  <tr
                    key={row.id}
                    className={`border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                      onRowClick ? 'cursor-pointer' : ''
                    }`}
                    onClick={() => onRowClick?.(row.original)}
                  >
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {data.length === 0 ? 'No records' : `Page ${pagination.pageIndex + 1} of ${table.getPageCount() || 1}`}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 text-sm"
          >
            Previous
          </button>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 text-sm"
          >
            Next
          </button>
          <select
            value={pagination.pageSize}
            onChange={e => table.setPageSize(Number(e.target.value))}
            className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded px-2 py-1 text-sm"
          >
            {[10, 20, 50, 100].map(size => (
              <option key={size} value={size}>
                {size} per page
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
```

---

## Step 3: Notice Management Page

Manage all notices with CRUD operations:

```typescript
// src/admin/pages/NoticesListPage.tsx
import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Dialog from '@radix-ui/react-dialog';
import { DataTable } from '../components/common/DataTable';
import { NoticeFormDialog } from '../components/NoticeFormDialog';
import { supabase } from '@/lib/supabase';

interface Notice {
  id: string;
  title: string;
  type: string;
  status: 'draft' | 'published' | 'expired';
  council: string;
  createdAt: string;
  expiresAt: string;
}

export default function NoticesListPage() {
  const queryClient = useQueryClient();
  const [selectedNotice, setSelectedNotice] = React.useState<Notice | null>(null);
  const [isFormOpen, setIsFormOpen] = React.useState(false);

  // Fetch notices
  const { data: notices = [], isLoading, error } = useQuery({
    queryKey: ['admin', 'notices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notices')
        .select('*')
        .order('createdAt', { ascending: false });

      if (error) throw error;
      return data as Notice[];
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('notices').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'notices'] });
    },
  });

  const columns = React.useMemo(() => [
    {
      accessorKey: 'title',
      header: 'Title',
      cell: ({ row }: any) => (
        <div className="max-w-xs truncate">{row.getValue('title')}</div>
      ),
    },
    {
      accessorKey: 'type',
      header: 'Type',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: any) => {
        const status = row.getValue('status');
        return (
          <span className={`px-2 py-1 rounded text-xs font-semibold ${
            status === 'published' ? 'bg-green-100 text-green-800' :
            status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {status}
          </span>
        );
      },
    },
    {
      accessorKey: 'council',
      header: 'Council',
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }: any) => new Date(row.getValue('createdAt')).toLocaleDateString(),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: any) => (
        <div className="flex gap-2">
          <button
            onClick={() => {
              setSelectedNotice(row.original);
              setIsFormOpen(true);
            }}
            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
          >
            Edit
          </button>
          <button
            onClick={() => deleteMutation.mutate(row.original.id)}
            disabled={deleteMutation.isPending}
            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium disabled:opacity-50"
          >
            Delete
          </button>
        </div>
      ),
    },
  ], []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Notices</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage all published notices</p>
        </div>
        <button
          onClick={() => {
            setSelectedNotice(null);
            setIsFormOpen(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 font-medium"
        >
          Add Notice
        </button>
      </div>

      <DataTable
        data={notices}
        columns={columns}
        isLoading={isLoading}
        error={error}
      />

      <NoticeFormDialog
        notice={selectedNotice}
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSuccess={() => {
          setIsFormOpen(false);
          setSelectedNotice(null);
          queryClient.invalidateQueries({ queryKey: ['admin', 'notices'] });
        }}
      />
    </div>
  );
}
```

---

## Step 4: Form Dialog Component

Reusable modal for creating/editing records:

```typescript
// src/admin/components/common/FormDialog.tsx
import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Cross2Icon } from '@radix-ui/react-icons';

interface FormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  onSubmit: () => Promise<void>;
  isLoading?: boolean;
  children: React.ReactNode;
}

export function FormDialog({
  isOpen,
  onOpenChange,
  title,
  description,
  onSubmit,
  isLoading,
  children,
}: FormDialogProps) {
  return (
    <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40" />
        <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-[90vw] max-h-[85vh] overflow-auto z-50">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded" aria-label="Close">
                <Cross2Icon className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>

          {description && (
            <Dialog.Description className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {description}
            </Dialog.Description>
          )}

          <form onSubmit={e => { e.preventDefault(); onSubmit(); }} className="space-y-4">
            {children}
            <div className="flex gap-2 pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:opacity-50 font-medium"
              >
                {isLoading ? 'Saving...' : 'Save'}
              </button>
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium"
                >
                  Cancel
                </button>
              </Dialog.Close>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```

---

## Step 5: Custom Hooks for Data Management

```typescript
// src/admin/hooks/useNotices.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useNotices() {
  return useQuery({
    queryKey: ['admin', 'notices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notices')
        .select('*')
        .order('createdAt', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateNotice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notice: any) => {
      const { data, error } = await supabase
        .from('notices')
        .update(notice)
        .eq('id', notice.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'notices'] });
    },
  });
}

export function useCreateNotice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notice: any) => {
      const { data, error } = await supabase
        .from('notices')
        .insert([notice])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'notices'] });
    },
  });
}
```

---

## Step 6: Dark Mode Support

Leverage existing Tailwind setup:

```typescript
// src/admin/layout/AdminLayout.tsx - Updated with dark mode toggle
import { useTheme } from '@/hooks/useTheme'; // Create this hook

export default function AdminLayout() {
  const { theme, setTheme } = useTheme();

  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
      {/* Layout content */}
    </div>
  );
}
```

```typescript
// src/hooks/useTheme.ts
import React, { createContext, useContext } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<Theme>(() => {
    const saved = localStorage.getItem('theme') as Theme | null;
    if (saved) return saved;
    return 'system';
  });

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);

    const html = document.documentElement;
    if (newTheme === 'dark' || (newTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  };

  React.useEffect(() => {
    setTheme(theme);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
```

---

## Step 7: Testing Admin Components

```typescript
// src/admin/__tests__/NoticesListPage.test.tsx
import { render, screen } from '@testing-library/react';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import NoticesListPage from '../pages/NoticesListPage';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

describe('NoticesListPage', () => {
  beforeEach(() => {
    queryClient.clear();
  });

  it('renders page title', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <NoticesListPage />
      </QueryClientProvider>
    );
    expect(screen.getByText('Notices')).toBeInTheDocument();
  });

  it('renders add notice button', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <NoticesListPage />
      </QueryClientProvider>
    );
    expect(screen.getByRole('button', { name: /add notice/i })).toBeInTheDocument();
  });
});
```

---

## Implementation Timeline

### Phase 1: Foundation (Week 1)
- [ ] Install dependencies: `@tanstack/react-table`, `@radix-ui/react-dialog`, `react-hook-form`, `zod`
- [ ] Create AdminLayout with responsive sidebar
- [ ] Create base DataTable component
- [ ] Create FormDialog component

### Phase 2: Core Features (Week 2)
- [ ] Build Notices management page
- [ ] Implement CRUD operations
- [ ] Add form validation with Zod
- [ ] Add loading/error states

### Phase 3: Additional Resources (Week 3)
- [ ] Add Councils management
- [ ] Add Users management
- [ ] Add Settings page

### Phase 4: Polish & Optimization (Week 4)
- [ ] Add dark mode support
- [ ] Add accessibility (ARIA, keyboard nav)
- [ ] Optimize performance (virtual scrolling for large lists)
- [ ] Add unit and E2E tests
- [ ] Documentation

---

## Deployment Considerations

### Environment Variables
```bash
VITE_ADMIN_ENABLED=true  # Feature flag for admin panel
VITE_ADMIN_ROLES=admin   # Comma-separated roles with admin access
```

### Security Checklist
- [ ] Implement role-based access control (RBAC)
- [ ] Validate all mutations on backend
- [ ] Audit log admin actions
- [ ] Rate limit admin API endpoints
- [ ] Use HTTPS for all admin traffic
- [ ] Implement CSRF protection

### Performance Targets
- [ ] DataTable rendering: < 100ms for 1000 rows
- [ ] Modal open: < 50ms
- [ ] Form submission: < 1s (including API call)
- [ ] Search/filter: < 300ms (debounced)
- [ ] Page load: < 2s

---

## Monitoring & Analytics

Track admin panel usage:

```typescript
// src/admin/lib/analytics.ts
export function trackAdminEvent(event: string, data?: Record<string, any>) {
  // Send to your analytics service
  console.log(`[Admin] ${event}`, data);
  // Example: Sentry, PostHog, Amplitude, etc.
}

// Usage
trackAdminEvent('notice_created', { type: 'premises-licence', council: 'ABC' });
trackAdminEvent('notice_deleted', { id: 'notice-123' });
```

---

## Next Steps

1. **Review and Approve**: Confirm this architecture aligns with your needs
2. **Install Dependencies**: Add required npm packages
3. **Create Base Components**: Start with AdminLayout and DataTable
4. **Build First Feature**: Implement Notices management
5. **Test Thoroughly**: Unit tests + E2E tests
6. **Get Feedback**: Have team review before scaling
7. **Document**: Create Storybook stories for components
8. **Deploy**: Ship to production with feature flag

---

## Resources & References

- TanStack Table: https://tanstack.com/table/v8
- Radix UI: https://radix-ui.com/
- React Hook Form: https://react-hook-form.com/
- Zod: https://zod.dev/
- Tailwind CSS: https://tailwindcss.com/docs/dark-mode
- Your Project Docs: See CLAUDE.md for existing setup

---

*Created: January 20, 2026*
*Project: Ralph's Civic Notices*
*Admin Panel Implementation Guide*
