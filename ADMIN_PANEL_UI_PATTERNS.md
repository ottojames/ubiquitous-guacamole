# React Admin Panel UI Patterns - Comprehensive Guide

## Executive Summary

This document consolidates research on modern React UI patterns for building production-grade admin panels. The focus is on proven architectural patterns, component libraries, and implementation strategies that prioritize developer experience, accessibility, and user experience.

---

## Table of Contents

1. [Data Table Components](#data-table-components)
2. [Modal and Form Patterns](#modal-and-form-patterns)
3. [Loading States & Error Handling](#loading-states--error-handling)
4. [Responsive Admin Layouts](#responsive-admin-layouts)
5. [Dark Mode Implementation](#dark-mode-implementation)
6. [Accessibility for Admin Interfaces](#accessibility-for-admin-interfaces)
7. [Component Library Recommendations](#component-library-recommendations)
8. [Implementation Examples](#implementation-examples)

---

## 1. Data Table Components

### 1.1 Overview

Modern React data tables have evolved from monolithic components to headless utilities that separate business logic from presentation. This shift enables maximum flexibility while maintaining features like sorting, filtering, and pagination.

### 1.2 Key Libraries

#### **TanStack Table (formerly React Table) v8**

A headless utility library that provides hooks for table functionality without dictating UI markup.

**Core Features:**
- Tree-shakable, lightweight (5-10KB gzipped)
- Server-side and client-side capabilities
- Column visibility, resizing, and reordering
- Multi-column sorting
- Advanced filtering
- Pagination with customizable row counts
- Row selection and bulk actions

**Basic Implementation:**

```typescript
import { useReactTable, getCoreRowModel, getSortedRowModel, getPaginationRowModel } from '@tanstack/react-table';

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
}

export function DataTable<T>({ data, columns }: DataTableProps<T>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 });

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters, pagination },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="space-y-4">
      {/* Column Filters */}
      <div className="flex gap-4 p-4 border rounded-lg bg-gray-50">
        {table.getLeafHeaders().map(header => (
          <div key={header.id} className="flex flex-col gap-2">
            {header.column.getCanFilter() && (
              <DebouncedInput
                type="text"
                value={(header.column.getFilterValue() as string) ?? ''}
                onChange={value => header.column.setFilterValue(value)}
                placeholder={`Filter ${header.id}...`}
                className="px-2 py-1 border rounded"
              />
            )}
          </div>
        ))}
      </div>

      {/* Table */}
      <table className="w-full border-collapse">
        <thead className="bg-gray-100 border-b-2 border-gray-300">
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <th
                  key={header.id}
                  className="px-4 py-2 text-left font-semibold cursor-pointer hover:bg-gray-200"
                  onClick={header.column.getToggleSortingHandler()}
                >
                  <div className="flex items-center gap-2">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {/* Sort indicator */}
                    <span className="text-xs">
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
          {table.getRowModel().rows.map(row => (
            <tr key={row.id} className="border-b hover:bg-gray-50 transition-colors">
              {row.getVisibleCells().map(cell => (
                <td key={cell.id} className="px-4 py-2">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between p-4">
        <div className="flex gap-2">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span className="flex items-center gap-2">
            Page <strong>{table.getState().pagination.pageIndex + 1}</strong> of{' '}
            <strong>{table.getPageCount()}</strong>
          </span>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
        <select
          value={table.getState().pagination.pageSize}
          onChange={e => table.setPageSize(Number(e.target.value))}
          className="border rounded px-2 py-1"
        >
          {[10, 20, 30, 40, 50].map(pageSize => (
            <option key={pageSize} value={pageSize}>
              Show {pageSize}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
```

#### **React-Admin Framework**

A full-featured admin framework built on React Query and Material-UI, providing higher-level abstractions.

**Key Components:**
- `<List>` - Renders fetchable list of records
- `<DataTable>` - Table-specific display
- `<SimpleList>` - Mobile-friendly alternative
- `<Datagrid>` - Advanced grid with bulk actions

**React-Admin List Implementation:**

```typescript
import { List, DataTable, TextField, DateField } from 'react-admin';

export const PostList = () => (
  <List perPage={25} sort={{ field: 'published_at', order: 'DESC' }}>
    <DataTable>
      <DataTable.Col source="id" label="ID" />
      <DataTable.Col source="title" label="Title" />
      <DataTable.Col source="status" label="Status" />
      <DataTable.Col source="published_at" label="Published" field={DateField} />
    </DataTable>
  </List>
);
```

### 1.3 Sorting Implementation

**TanStack Table Sorting State:**

```typescript
type SortingState = ColumnSort[];
type ColumnSort = {
  id: string;           // Column ID
  desc: boolean;        // true for descending, false for ascending
};

// Multi-column sorting example
const [sorting, setSorting] = React.useState<SortingState>([
  { id: 'lastName', desc: false },
  { id: 'firstName', desc: false },
]);
```

**Built-in Sorting Functions:**
- `alphanumeric` - Mixed alphanumeric values (case-insensitive)
- `text` - String values
- `datetime` - Date values
- `basic` - Basic comparisons

**Custom Sorting:**

```typescript
const columns: ColumnDef<Person>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    sortingFn: (rowA, rowB) => {
      const nameA = rowA.original.name.toLowerCase();
      const nameB = rowB.original.name.toLowerCase();
      return nameA.localeCompare(nameB);
    },
  },
];
```

### 1.4 Filtering Implementation

**Column Filtering Pattern:**

```typescript
export function FilterableTable<T>({ data, columns }: DataTableProps<T>) {
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  
  const table = useReactTable({
    data,
    columns,
    state: { columnFilters },
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(), // IMPORTANT: Required for filtering
  });

  return (
    <div>
      {/* Filter inputs */}
      {table.getLeafHeaders().map(header => (
        <input
          key={header.id}
          type="text"
          placeholder={`Filter ${header.id}...`}
          onChange={e => header.column.setFilterValue(e.target.value)}
          className="px-2 py-1 border rounded"
        />
      ))}
      
      {/* Table rendering... */}
    </div>
  );
}
```

**Advanced Filtering with Faceted Search:**

```typescript
// For categorical data like statuses
const statusOptions = ['active', 'inactive', 'pending'];

<div className="flex flex-col gap-2">
  <label className="font-semibold">Status</label>
  <div className="flex gap-2">
    {statusOptions.map(status => (
      <label key={status} className="flex items-center gap-1">
        <input
          type="checkbox"
          checked={
            (table.getColumn('status')?.getFilterValue() as string[])?.includes(status) ?? false
          }
          onChange={e => {
            const current = (table.getColumn('status')?.getFilterValue() as string[]) ?? [];
            table.getColumn('status')?.setFilterValue(
              e.target.checked ? [...current, status] : current.filter(s => s !== status)
            );
          }}
        />
        {status}
      </label>
    ))}
  </div>
</div>
```

### 1.5 Pagination Patterns

**Client-Side Pagination:**

```typescript
const [{ pageIndex, pageSize }, setPagination] = React.useState<PaginationState>({
  pageIndex: 0,
  pageSize: 10,
});

const table = useReactTable({
  data,
  columns,
  state: { pagination: { pageIndex, pageSize } },
  onPaginationChange: setPagination,
  getPaginationRowModel: getPaginationRowModel(),
});

// Render pagination controls
<div className="flex items-center gap-2">
  <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
    Previous
  </button>
  <span>
    Page {pageIndex + 1} of {table.getPageCount()}
  </span>
  <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
    Next
  </button>
  <select value={pageSize} onChange={e => setPagination(p => ({ ...p, pageSize: Number(e.target.value) }))}>
    {[10, 20, 50, 100].map(size => <option key={size} value={size}>{size}</option>)}
  </select>
</div>
```

**Server-Side Pagination with React Query:**

```typescript
function ServerSidePaginationTable() {
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 });
  
  const { data, isLoading } = useQuery({
    queryKey: ['users', pagination.pageIndex, pagination.pageSize],
    queryFn: ({ signal }) =>
      fetch(`/api/users?page=${pagination.pageIndex}&limit=${pagination.pageSize}`, { signal }).then(
        res => res.json()
      ),
  });

  const table = useReactTable({
    data: data?.items ?? [],
    columns,
    state: { pagination },
    onPaginationChange: setPagination,
    pageCount: data?.pageCount,
    manualPagination: true, // Don't do client-side pagination
    getCoreRowModel: getCoreRowModel(),
  });

  return <DataTable table={table} isLoading={isLoading} />;
}
```

### 1.6 Bulk Actions Pattern

```typescript
function BulkActionsTable() {
  const [rowSelection, setRowSelection] = React.useState({});

  const table = useReactTable({
    data,
    columns,
    state: { rowSelection },
    onRowSelectionChange: setRowSelection,
    getRowCanBeSelected: row => row.id !== 1, // Disable row 1
    getCoreRowModel: getCoreRowModel(),
  });

  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const hasSelected = selectedRows.length > 0;

  return (
    <div>
      {hasSelected && (
        <div className="bg-blue-50 p-4 mb-4 flex items-center justify-between rounded">
          <span className="font-semibold">{selectedRows.length} row(s) selected</span>
          <div className="flex gap-2">
            <button
              onClick={() => handleBulkDelete(selectedRows.map(r => r.original.id))}
              className="px-3 py-1 bg-red-500 text-white rounded"
            >
              Delete
            </button>
            <button
              onClick={() => handleBulkExport(selectedRows)}
              className="px-3 py-1 bg-green-500 text-white rounded"
            >
              Export
            </button>
          </div>
        </div>
      )}
      {/* Table... */}
    </div>
  );
}
```

---

## 2. Modal and Form Patterns

### 2.1 Modal Components

#### **Radix UI Dialog (Recommended)**

Provides unstyled, accessible modal primitives with automatic focus management and ARIA handling.

```typescript
import * as Dialog from '@radix-ui/react-dialog';
import { Cross2Icon } from '@radix-ui/react-icons';

export function EditRecordDialog({ record, onSave, onOpenChange }) {
  return (
    <Dialog.Root onOpenChange={onOpenChange}>
      <Dialog.Trigger asChild>
        <button className="px-3 py-1 bg-blue-500 text-white rounded">Edit</button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl p-6 max-w-md w-[90vw] max-h-[85vh] overflow-auto">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-semibold">Edit Record</Dialog.Title>
            <Dialog.Close asChild>
              <button className="p-1 hover:bg-gray-100 rounded" aria-label="Close">
                <Cross2Icon />
              </button>
            </Dialog.Close>
          </div>
          
          <Dialog.Description className="text-sm text-gray-600 mb-4">
            Update the record details below.
          </Dialog.Description>

          <EditForm record={record} onSave={onSave} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```

**Key Features:**
- Automatic focus trapping
- Escape key handling
- ARIA roles and attributes
- Portal rendering (no z-index issues)
- Accessible title and description

#### **Material-UI Modal (Alternative)**

```typescript
import { Modal, Box, TextField, Button } from '@mui/material';

export function EditModal({ open, record, onClose, onSave }) {
  const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={style}>
        <h2 id="modal-title">Edit Record</h2>
        <EditForm record={record} onSave={onSave} onClose={onClose} />
      </Box>
    </Modal>
  );
}
```

### 2.2 Form Patterns

#### **React Hook Form Integration**

```typescript
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const userSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'user', 'viewer']),
  status: z.enum(['active', 'inactive']),
});

type UserFormData = z.infer<typeof userSchema>;

function UserForm({ initialData, onSubmit }: { initialData?: UserFormData; onSubmit: (data: UserFormData) => void }) {
  const { control, handleSubmit, formState: { errors } } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: initialData || { role: 'user', status: 'active' },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1">Name</label>
        <Controller
          name="name"
          control={control}
          render={({ field }) => (
            <input
              {...field}
              id="name"
              type="text"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}
        />
        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
        <Controller
          name="email"
          control={control}
          render={({ field }) => (
            <input
              {...field}
              id="email"
              type="email"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}
        />
        {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
      </div>

      <div>
        <label htmlFor="role" className="block text-sm font-medium mb-1">Role</label>
        <Controller
          name="role"
          control={control}
          render={({ field }) => (
            <select
              {...field}
              id="role"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
              <option value="viewer">Viewer</option>
            </select>
          )}
        />
      </div>

      <button
        type="submit"
        className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
      >
        Save
      </button>
    </form>
  );
}
```

#### **Form Layout Patterns**

**Two-Column Layout (Desktop Responsive):**

```typescript
<form className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <div className="md:col-span-2">
    <label className="block text-sm font-medium mb-1">Full Name *</label>
    <input type="text" className="w-full px-3 py-2 border rounded-lg" />
  </div>

  <div>
    <label className="block text-sm font-medium mb-1">Email *</label>
    <input type="email" className="w-full px-3 py-2 border rounded-lg" />
  </div>

  <div>
    <label className="block text-sm font-medium mb-1">Phone</label>
    <input type="tel" className="w-full px-3 py-2 border rounded-lg" />
  </div>

  <div className="md:col-span-2">
    <label className="block text-sm font-medium mb-1">Address</label>
    <textarea className="w-full px-3 py-2 border rounded-lg" rows={3}></textarea>
  </div>

  <div className="md:col-span-2 flex gap-2">
    <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-lg">
      Submit
    </button>
    <button type="reset" className="px-4 py-2 border rounded-lg">
      Reset
    </button>
  </div>
</form>
```

### 2.3 Form Validation

**Inline Validation with Error Messages:**

```typescript
function FormFieldWithValidation({ label, error, ...props }) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium mb-1 text-gray-700">
        {label}
        {props.required && <span className="text-red-500">*</span>}
      </label>
      <input
        {...props}
        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
          error
            ? 'border-red-500 focus:ring-red-500 bg-red-50'
            : 'border-gray-300 focus:ring-blue-500'
        }`}
        aria-invalid={!!error}
        aria-describedby={error ? `${props.id}-error` : undefined}
      />
      {error && (
        <p id={`${props.id}-error`} className="text-red-500 text-sm mt-1 flex items-center gap-1">
          <ExclamationIcon className="w-4 h-4" />
          {error}
        </p>
      )}
    </div>
  );
}
```

---

## 3. Loading States & Error Handling

### 3.1 Loading State Types

Modern admin panels should distinguish between different loading scenarios:

```typescript
type LoadingState = 'idle' | 'initial_loading' | 'background_refresh' | 'optimistic_update' | 'error';

// Usage
const [loadingState, setLoadingState] = React.useState<LoadingState>('idle');
```

**Different States:**
- **idle**: No operation in progress
- **initial_loading**: First data fetch (show skeleton)
- **background_refresh**: Fetching updates for already-loaded data (keep showing data, subtle indicator)
- **optimistic_update**: Awaiting confirmation after user action (show loading state on button)
- **error**: Operation failed (show error message)

### 3.2 Skeleton Loading Pattern

```typescript
import { Skeleton, SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

export function TableSkeleton({ rows = 5 }) {
  return (
    <SkeletonTheme baseColor="#f3f3f3" highlightColor="#e0e0e0">
      <table className="w-full">
        <thead className="bg-gray-100">
          <tr>
            {[1, 2, 3, 4].map(i => (
              <th key={i} className="px-4 py-2">
                <Skeleton height={20} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i} className="border-b">
              {[1, 2, 3, 4].map(j => (
                <td key={j} className="px-4 py-2">
                  <Skeleton height={20} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </SkeletonTheme>
  );
}
```

**MUI Skeleton Alternative:**

```typescript
import { Skeleton } from '@mui/material';

function TableRowSkeleton() {
  return (
    <tr>
      <td className="px-4 py-2"><Skeleton variant="text" /></td>
      <td className="px-4 py-2"><Skeleton variant="text" /></td>
      <td className="px-4 py-2"><Skeleton variant="text" width="60%" /></td>
    </tr>
  );
}
```

### 3.3 Smart Loader Component

```typescript
interface SmartLoaderProps<T> {
  isLoading: boolean;
  error: Error | null;
  data: T | null;
  emptyState?: React.ReactNode;
  skeleton?: React.ReactNode;
  errorFallback?: (error: Error, retry: () => void) => React.ReactNode;
  children: (data: T) => React.ReactNode;
  retryFn?: () => void;
}

export function SmartLoader<T>({
  isLoading,
  error,
  data,
  emptyState,
  skeleton,
  errorFallback,
  children,
  retryFn,
}: SmartLoaderProps<T>) {
  if (error) {
    return (
      errorFallback?.(error, retryFn || (() => {})) || (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="font-semibold text-red-900">Error Loading Data</h3>
          <p className="text-red-700 text-sm mt-1">{error.message}</p>
          {retryFn && (
            <button
              onClick={retryFn}
              className="mt-2 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
            >
              Try Again
            </button>
          )}
        </div>
      )
    );
  }

  if (isLoading && !data) {
    return skeleton || <div className="p-4 text-gray-500">Loading...</div>;
  }

  if (!data || (Array.isArray(data) && data.length === 0)) {
    return emptyState || <div className="p-4 text-gray-500 text-center">No data available</div>;
  }

  return <>{children(data)}</>;
}

// Usage
<SmartLoader
  isLoading={isLoading}
  error={error}
  data={tableData}
  skeleton={<TableSkeleton />}
  emptyState={<div className="p-8 text-center text-gray-500">No records found</div>}
  errorFallback={(error, retry) => (
    <div className="p-4 bg-red-50 border border-red-200 rounded">
      <p>Failed to load: {error.message}</p>
      <button onClick={retry}>Retry</button>
    </div>
  )}
  retryFn={() => refetch()}
>
  {data => <DataTable data={data} columns={columns} />}
</SmartLoader>
```

### 3.4 Error Boundaries

```typescript
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: (error: Error, reset: () => void) => React.ReactNode;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, { error: Error | null }> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return (
        this.props.fallback?.(this.state.error, this.reset) || (
          <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
            <h2 className="font-semibold text-red-900">Something went wrong</h2>
            <p className="text-red-700 text-sm mt-2">{this.state.error.message}</p>
            <button
              onClick={this.reset}
              className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Try again
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

// Usage
<ErrorBoundary
  fallback={(error, reset) => (
    <div className="p-6 bg-red-50 rounded">
      <p>Error: {error.message}</p>
      <button onClick={reset}>Reset</button>
    </div>
  )}
>
  <AdminPanel />
</ErrorBoundary>
```

### 3.5 Optimistic Updates

```typescript
function OptimisticUpdateExample() {
  const [items, setItems] = React.useState<Item[]>([...]);
  const updateMutation = useMutation({
    mutationFn: (item: Item) => updateItemAPI(item),
    onMutate: async newItem => {
      // Cancel outgoing refetches so they don't overwrite optimistic update
      await queryClient.cancelQueries({ queryKey: ['items'] });

      // Snapshot previous value
      const previousItems = queryClient.getQueryData(['items']);

      // Optimistically update UI
      queryClient.setQueryData(['items'], (old: Item[] | undefined) =>
        old?.map(item => (item.id === newItem.id ? newItem : item))
      );

      // Return context with snapshots
      return { previousItems };
    },
    onError: (err, newItem, context) => {
      // Rollback on error
      if (context?.previousItems) {
        queryClient.setQueryData(['items'], context.previousItems);
      }
    },
    onSuccess: () => {
      // Refetch to confirm
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });

  return (
    <button
      onClick={() => updateMutation.mutate({ ...item, status: 'active' })}
      disabled={updateMutation.isPending}
    >
      {updateMutation.isPending ? 'Updating...' : 'Update'}
    </button>
  );
}
```

---

## 4. Responsive Admin Layouts

### 4.1 Layout Architecture

```typescript
export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const isSmall = useMediaQuery('(max-width: 768px)');

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`${
          isSmall && !sidebarOpen ? 'hidden' : 'block'
        } ${
          isSmall ? 'fixed inset-0 z-40 w-64' : 'relative w-64'
        } bg-gray-900 text-white transition-all duration-300`}
      >
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-800">
            <h1 className="text-xl font-bold">Admin</h1>
            {isSmall && (
              <button onClick={() => setSidebarOpen(false)} className="p-1 hover:bg-gray-800 rounded">
                <XIcon />
              </button>
            )}
          </div>
          <nav className="flex-1 overflow-y-auto">
            {/* Navigation links */}
          </nav>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isSmall && sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black bg-opacity-50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-4 gap-4">
          {isSmall && (
            <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-gray-100 rounded">
              <MenuIcon />
            </button>
          )}
          <div className="flex-1" />
          <UserMenu />
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto p-4 md:p-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
```

### 4.2 Responsive Breakpoints Strategy

**Mobile-First Approach with Tailwind:**

```typescript
// Define breakpoints
const breakpoints = {
  xs: 0,      // Mobile
  sm: 640,    // Small tablets
  md: 768,    // Tablets
  lg: 1024,   // Small desktop
  xl: 1280,   // Desktop
  '2xl': 1536, // Large desktop
};

// Responsive grid
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  {items.map(item => <Card key={item.id} item={item} />)}
</div>

// Responsive text
<h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold">
  Responsive Heading
</h1>

// Responsive padding
<div className="p-4 sm:p-6 md:p-8 lg:p-12">
  Content with responsive padding
</div>
```

### 4.3 Responsive Table Design

**Stacked Cards on Mobile:**

```typescript
function ResponsiveTable({ data, columns }: { data: any[]; columns: ColumnDef<any>[] }) {
  const isSmall = useMediaQuery('(max-width: 768px)');

  if (isSmall) {
    return (
      <div className="space-y-4">
        {data.map(row => (
          <div key={row.id} className="bg-white border rounded-lg p-4 space-y-2">
            {columns.map(col => (
              <div key={col.id} className="flex justify-between">
                <span className="font-semibold text-gray-600">{col.header}</span>
                <span>{row[col.id]}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  return <DataTable data={data} columns={columns} />;
}
```

**Horizontal Scroll on Tablet:**

```typescript
<div className="overflow-x-auto md:overflow-visible">
  <table className="w-full md:table">
    {/* Table content */}
  </table>
</div>
```

### 4.4 Grid Layout with Drag & Drop (Optional)

```typescript
import { Responsive, WidthProvider, Layout, Layouts } from 'react-grid-layout';

const ResponsiveGridLayout = WidthProvider(Responsive);

function DashboardLayout() {
  const [layouts, setLayouts] = React.useState<Layouts>({
    lg: [
      { x: 0, y: 0, w: 6, h: 3, i: 'chart1' },
      { x: 6, y: 0, w: 6, h: 3, i: 'chart2' },
      { x: 0, y: 3, w: 12, h: 4, i: 'table' },
    ],
    md: [
      { x: 0, y: 0, w: 6, h: 3, i: 'chart1' },
      { x: 6, y: 0, w: 6, h: 3, i: 'chart2' },
      { x: 0, y: 3, w: 12, h: 4, i: 'table' },
    ],
    sm: [
      { x: 0, y: 0, w: 6, h: 3, i: 'chart1' },
      { x: 0, y: 3, w: 6, h: 3, i: 'chart2' },
      { x: 0, y: 6, w: 6, h: 4, i: 'table' },
    ],
  });

  return (
    <ResponsiveGridLayout
      className="layout"
      layouts={layouts}
      onLayoutChange={setLayouts}
      breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
      cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
      rowHeight={30}
      width={1200}
    >
      <div key="chart1" className="bg-white p-4 rounded-lg shadow">
        Chart 1
      </div>
      <div key="chart2" className="bg-white p-4 rounded-lg shadow">
        Chart 2
      </div>
      <div key="table" className="bg-white p-4 rounded-lg shadow">
        Table
      </div>
    </ResponsiveGridLayout>
  );
}
```

---

## 5. Dark Mode Implementation

### 5.1 Architecture

**Context-Based Theme Management:**

```typescript
type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = React.createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<Theme>(() => {
    // Restore from localStorage
    const saved = localStorage.getItem('theme') as Theme | null;
    if (saved) return saved;
    
    // Check system preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
    updateDOM(newTheme);
  };

  const updateDOM = (theme: Theme) => {
    const html = document.documentElement;
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      html.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
      html.setAttribute('data-theme', theme);
    }
  };

  // Listen for system theme changes
  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        updateDOM('system');
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  // Initial update
  React.useEffect(() => {
    updateDOM(theme);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
```

### 5.2 CSS Variables for Theming

```css
:root {
  --color-bg: #ffffff;
  --color-bg-secondary: #f3f4f6;
  --color-text: #1f2937;
  --color-text-secondary: #6b7280;
  --color-border: #e5e7eb;
  --color-primary: #3b82f6;
  --color-primary-dark: #2563eb;
  --color-danger: #ef4444;
}

[data-theme='dark'] {
  --color-bg: #1f2937;
  --color-bg-secondary: #111827;
  --color-text: #f9fafb;
  --color-text-secondary: #d1d5db;
  --color-border: #374151;
  --color-primary: #60a5fa;
  --color-primary-dark: #3b82f6;
  --color-danger: #f87171;
}

/* Component usage */
.card {
  background-color: var(--color-bg);
  color: var(--color-text);
  border-color: var(--color-border);
}

.button-primary {
  background-color: var(--color-primary);
}
.button-primary:hover {
  background-color: var(--color-primary-dark);
}
```

### 5.3 Tailwind CSS with Dark Mode

```typescript
// tailwind.config.js
module.exports = {
  darkMode: 'class', // or 'media'
  theme: {
    extend: {
      colors: {
        // Define semantic colors
        bg: 'var(--color-bg)',
        'bg-secondary': 'var(--color-bg-secondary)',
      },
    },
  },
};

// Usage
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
  <h1 className="text-gray-700 dark:text-gray-200">Heading</h1>
  <p className="text-gray-600 dark:text-gray-400">Content</p>
</div>
```

### 5.4 Theme Toggle Component

```typescript
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
      <button
        onClick={() => setTheme('light')}
        className={`p-2 rounded ${
          theme === 'light'
            ? 'bg-white dark:bg-gray-700 shadow'
            : 'hover:bg-gray-200 dark:hover:bg-gray-700'
        }`}
        aria-label="Light mode"
      >
        <SunIcon className="w-5 h-5" />
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={`p-2 rounded ${
          theme === 'dark'
            ? 'bg-gray-700 shadow'
            : 'hover:bg-gray-200 dark:hover:bg-gray-700'
        }`}
        aria-label="Dark mode"
      >
        <MoonIcon className="w-5 h-5" />
      </button>
      <button
        onClick={() => setTheme('system')}
        className={`p-2 rounded ${
          theme === 'system'
            ? 'bg-gray-200 dark:bg-gray-600 shadow'
            : 'hover:bg-gray-200 dark:hover:bg-gray-700'
        }`}
        aria-label="System theme"
      >
        <SystemIcon className="w-5 h-5" />
      </button>
    </div>
  );
}
```

---

## 6. Accessibility for Admin Interfaces

### 6.1 ARIA Roles and Attributes

**Table Accessibility:**

```typescript
function AccessibleDataTable({ data, columns }: DataTableProps) {
  return (
    <div role="region" aria-label="Data table" aria-live="polite">
      <table
        role="grid"
        aria-rowcount={data.length}
        aria-colcount={columns.length}
        aria-label="Records"
      >
        <thead>
          <tr role="row">
            {columns.map((col, idx) => (
              <th
                key={col.id}
                role="columnheader"
                aria-colindex={idx + 1}
                aria-sort="none"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIdx) => (
            <tr key={row.id} role="row" aria-rowindex={rowIdx + 2}>
              {columns.map((col, colIdx) => (
                <td
                  key={`${row.id}-${col.id}`}
                  role="gridcell"
                  aria-colindex={colIdx + 1}
                >
                  {row[col.id]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

**Modal Accessibility:**

```typescript
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="dialog-title"
  aria-describedby="dialog-description"
>
  <h2 id="dialog-title">Confirm Action</h2>
  <p id="dialog-description">Are you sure you want to delete this record?</p>
  <button>Cancel</button>
  <button>Confirm</button>
</div>
```

### 6.2 Keyboard Navigation

**Focus Management:**

```typescript
function AccessibleForm() {
  const submitRef = React.useRef<HTMLButtonElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Escape to close
    if (e.key === 'Escape' && isOpen) {
      handleClose();
    }
    // Tab to navigate
    if (e.key === 'Tab') {
      // Focus management handled by browser
    }
  };

  return (
    <form onKeyDown={handleKeyDown}>
      <input type="text" placeholder="Name" />
      <input type="email" placeholder="Email" />
      <button ref={submitRef} type="submit">
        Submit
      </button>
    </form>
  );
}
```

**Focus Trap in Modals:**

```typescript
import FocusTrap from 'focus-trap-react';

function Modal({ isOpen, onClose }) {
  return (
    <FocusTrap>
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
      >
        <div className="bg-white rounded-lg p-6 max-w-md">
          <h2>Modal Title</h2>
          <p>Modal content</p>
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </FocusTrap>
  );
}
```

### 6.3 Color Contrast

**WCAG AA Compliance:**

```css
/* Ensure 4.5:1 contrast ratio for normal text */
.text-primary {
  color: #0c0c0c; /* 21:1 contrast with white bg */
  background-color: #ffffff;
}

.text-secondary {
  color: #595959; /* 4.6:1 contrast with white bg */
  background-color: #ffffff;
}

/* Dark mode */
.dark .text-primary {
  color: #f5f5f5; /* 18:1 contrast with dark bg */
  background-color: #1f2937;
}

.dark .text-secondary {
  color: #b3b3b3; /* 4.5:1 contrast with dark bg */
  background-color: #1f2937;
}
```

**Check Contrast Tool:**
```typescript
// Helper function to check contrast
function getContrastRatio(rgb1: [number, number, number], rgb2: [number, number, number]): number {
  const getLuminance = (rgb: [number, number, number]) => {
    const [r, g, b] = rgb.map(x => {
      x = x / 255;
      return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  const lum1 = getLuminance(rgb1);
  const lum2 = getLuminance(rgb2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}
```

### 6.4 Screen Reader Support

**Live Regions:**

```typescript
function DataTableWithLiveRegion({ data, sortOrder }) {
  const announcementRef = React.useRef<HTMLDivElement>(null);

  const handleSort = (column: string) => {
    // ... sort logic
    // Announce to screen readers
    const message = `Table sorted by ${column} in ${sortOrder === 'asc' ? 'ascending' : 'descending'} order`;
    if (announcementRef.current) {
      announcementRef.current.textContent = message;
    }
  };

  return (
    <>
      <div
        ref={announcementRef}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />
      <table>
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.id}>
                <button onClick={() => handleSort(col.id)} aria-sort="none">
                  {col.header}
                </button>
              </th>
            ))}
          </tr>
        </thead>
      </table>
    </>
  );
}
```

**Icon Button Labels:**

```typescript
// ✗ Bad: Icon without label
<button className="p-2 hover:bg-gray-100">
  <TrashIcon />
</button>

// ✓ Good: Icon with aria-label
<button
  className="p-2 hover:bg-gray-100"
  aria-label="Delete record"
  title="Delete record"
>
  <TrashIcon className="w-5 h-5" />
</button>
```

### 6.5 Semantic HTML

```typescript
// ✗ Bad: Using divs for everything
<div className="heading">Users</div>
<div className="form">
  <div>Name</div>
  <div><input /></div>
  <div className="button">Submit</div>
</div>

// ✓ Good: Using semantic HTML
<h1>Users</h1>
<form>
  <label htmlFor="name">Name</label>
  <input id="name" />
  <button type="submit">Submit</button>
</form>
```

---

## 7. Component Library Recommendations

### 7.1 Recommended Stack

**For Maximum Customization:**
```
- TanStack Table (headless data tables)
- Radix UI (accessible primitives)
- Tailwind CSS (styling)
- React Hook Form (form management)
- Zod (schema validation)
```

**For Faster Development:**
```
- React-Admin (opinionated framework)
- Material-UI (component library)
- React Query (data fetching)
```

**For Design System:**
```
- shadcn/ui (copy-paste components)
- Storybook (component documentation)
- Chromatic (visual testing)
```

### 7.2 Library Comparison

| Library | Pros | Cons | Best For |
|---------|------|------|----------|
| **TanStack Table** | Headless, lightweight, flexible | Requires UI implementation | Custom admin panels |
| **React-Admin** | Full-featured, batteries included | Less customizable, opinionated | Quick CRUD applications |
| **Material-UI** | Comprehensive, well-documented | Large bundle size, opinionated | Enterprise applications |
| **shadcn/ui** | Highly customizable, open source | Requires TypeScript knowledge | Modern React projects |
| **Radix UI** | Accessible primitives, unstyled | Requires CSS/styling effort | Design systems |
| **CoreUI** | Admin-specific components | Commercial options available | Admin dashboards |

---

## 8. Implementation Examples

### 8.1 Complete Admin List Page

```typescript
import { useMemo, useState } from 'react';
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
import { useQuery } from '@tanstack/react-query';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'viewer';
  status: 'active' | 'inactive';
  createdAt: string;
}

const columns: ColumnDef<User>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    enableSorting: true,
  },
  {
    accessorKey: 'email',
    header: 'Email',
    enableSorting: true,
  },
  {
    accessorKey: 'role',
    header: 'Role',
    cell: ({ row }) => (
      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
        {row.getValue('role')}
      </span>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      return (
        <span
          className={`px-2 py-1 rounded text-sm ${
            status === 'active'
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {status}
        </span>
      );
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Created',
    cell: ({ row }) => new Date(row.getValue('createdAt')).toLocaleDateString(),
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => (
      <div className="flex gap-2">
        <button className="px-2 py-1 text-blue-600 hover:bg-blue-50 rounded">
          Edit
        </button>
        <button className="px-2 py-1 text-red-600 hover:bg-red-50 rounded">
          Delete
        </button>
      </div>
    ),
  },
];

export function UsersPage() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });

  const { data, isLoading, error } = useQuery({
    queryKey: ['users', sorting, columnFilters, pagination],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(pagination.pageIndex),
        limit: String(pagination.pageSize),
      });
      const response = await fetch(`/api/users?${params}`);
      return response.json();
    },
  });

  const table = useReactTable({
    data: data?.users ?? [],
    columns,
    state: { sorting, columnFilters, pagination },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    manualPagination: true,
    pageCount: data?.pageCount,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <TableSkeleton rows={10} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="font-semibold text-red-900">Error Loading Users</h3>
        <p className="text-red-700 text-sm mt-1">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Users</h1>
        <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
          Add User
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    className="px-6 py-3 text-left text-sm font-semibold text-gray-900"
                  >
                    <button
                      onClick={header.column.getToggleSortingHandler()}
                      className="flex items-center gap-2 hover:text-blue-600"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                      <span className="text-xs">
                        {header.column.getIsSorted() === 'asc' && '↑'}
                        {header.column.getIsSorted() === 'desc' && '↓'}
                      </span>
                    </button>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map(row => (
              <tr key={row.id} className="border-b hover:bg-gray-50 transition-colors">
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="px-6 py-4 text-sm text-gray-700">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
        <div className="text-sm text-gray-600">
          Page {pagination.pageIndex + 1} of {table.getPageCount()} ({data?.totalCount} total)
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-50"
          >
            Previous
          </button>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-50"
          >
            Next
          </button>
          <select
            value={pagination.pageSize}
            onChange={e => setPagination(p => ({ ...p, pageSize: Number(e.target.value) }))}
            className="border rounded px-2 py-1"
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

### 8.2 Complete Admin Form Dialog

```typescript
import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const userFormSchema = z.object({
  name: z.string().min(1, 'Name is required').min(3, 'Name must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'user', 'viewer']),
  status: z.enum(['active', 'inactive']),
});

type UserFormData = z.infer<typeof userFormSchema>;

function UserFormDialog({ user, onSave }: { user?: UserFormData; onSave: (data: UserFormData) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { control, handleSubmit, formState: { errors }, reset } = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: user || { role: 'user', status: 'active' },
  });

  const onSubmit = async (data: UserFormData) => {
    try {
      setError(null);
      setIsSaving(true);
      await onSave(data);
      setOpen(false);
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
          {user ? 'Edit' : 'Add New User'}
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-50 z-40" />
        <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl p-6 max-w-md w-[90vw] max-h-[85vh] overflow-auto z-50">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-semibold">
              {user ? 'Edit User' : 'Add New User'}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="p-1 hover:bg-gray-100 rounded" aria-label="Close">
                ✕
              </button>
            </Dialog.Close>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">
                Name *
              </label>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    id="name"
                    type="text"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                      errors.name
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? 'name-error' : undefined}
                  />
                )}
              />
              {errors.name && (
                <p id="name-error" className="text-red-500 text-sm mt-1">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                Email *
              </label>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    id="email"
                    type="email"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                      errors.email
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                  />
                )}
              />
              {errors.email && (
                <p id="email-error" className="text-red-500 text-sm mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium mb-1">
                Role *
              </label>
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <select
                    {...field}
                    id="role"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                    <option value="viewer">Viewer</option>
                  </select>
                )}
              />
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium mb-1">
                Status *
              </label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <select
                    {...field}
                    id="status"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                )}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
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

export default UserFormDialog;
```

---

## 9. Performance Optimization Tips

### 9.1 Virtual Scrolling for Large Lists

```typescript
import { FixedSizeList as List } from 'react-window';

function VirtualizedTable({ data, columns }: { data: any[]; columns: ColumnDef<any>[] }) {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <tr style={style} className="border-b hover:bg-gray-50">
      {columns.map(col => (
        <td key={col.id} className="px-4 py-2">
          {data[index][col.id]}
        </td>
      ))}
    </tr>
  );

  return (
    <List height={600} itemCount={data.length} itemSize={50} width="100%">
      {Row}
    </List>
  );
}
```

### 9.2 Memoization

```typescript
const DataRow = React.memo(({ row, columns }: { row: User; columns: ColumnDef<User>[] }) => (
  <tr className="border-b hover:bg-gray-50">
    {columns.map(col => (
      <td key={col.id} className="px-4 py-2">
        {row[col.id]}
      </td>
    ))}
  </tr>
));

DataRow.displayName = 'DataRow';
```

### 9.3 Debounced Search

```typescript
import { useMemo, useCallback } from 'react';
import { useDebounce } from '@/hooks/useDebounce';

function SearchableTable() {
  const [searchValue, setSearchValue] = useState('');
  const debouncedSearch = useDebounce(searchValue, 300);

  const filteredData = useMemo(
    () => data.filter(item => item.name.includes(debouncedSearch)),
    [debouncedSearch]
  );

  return (
    <>
      <input
        type="text"
        placeholder="Search..."
        value={searchValue}
        onChange={e => setSearchValue(e.target.value)}
      />
      <DataTable data={filteredData} columns={columns} />
    </>
  );
}
```

---

## 10. Testing Admin Components

### 10.1 Unit Tests with Vitest + React Testing Library

```typescript
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { DataTable } from './DataTable';

describe('DataTable', () => {
  it('renders table with data', () => {
    const data = [{ id: 1, name: 'John', email: 'john@example.com' }];
    render(<DataTable data={data} columns={mockColumns} />);
    expect(screen.getByText('John')).toBeInTheDocument();
  });

  it('sorts column when header clicked', async () => {
    const user = userEvent.setup();
    render(<DataTable data={mockData} columns={mockColumns} />);
    const nameHeader = screen.getByText('Name');
    await user.click(nameHeader);
    // Assert sorted state
  });

  it('paginates data', async () => {
    const user = userEvent.setup();
    render(<DataTable data={mockLargeData} columns={mockColumns} pageSize={10} />);
    const nextButton = screen.getByRole('button', { name: /next/i });
    await user.click(nextButton);
    // Assert pagination changed
  });
});
```

### 10.2 E2E Tests with Playwright

```typescript
import { test, expect } from '@playwright/test';

test('admin list page workflow', async ({ page }) => {
  await page.goto('/admin/users');

  // Check table renders
  await expect(page.locator('table')).toBeVisible();

  // Filter data
  await page.fill('input[placeholder="Filter..."]', 'John');
  await expect(page.locator('text=John')).toBeVisible();

  // Open add dialog
  await page.click('button:has-text("Add User")');
  await expect(page.locator('role=dialog')).toBeVisible();

  // Fill form
  await page.fill('input[id="name"]', 'Jane Doe');
  await page.fill('input[id="email"]', 'jane@example.com');

  // Submit
  await page.click('button:has-text("Save")');

  // Verify user added
  await expect(page.locator('text=Jane Doe')).toBeVisible();
});
```

---

## Conclusion

Modern React admin panels require a thoughtful combination of:

1. **Headless data table libraries** (TanStack Table) for flexibility
2. **Accessible primitives** (Radix UI) for proper semantics
3. **Strong styling solutions** (Tailwind CSS) for rapid development
4. **Form management** (React Hook Form + Zod) for robust validation
5. **Loading state management** with proper UX patterns
6. **Responsive design** from mobile-first perspective
7. **Accessibility** as a first-class concern
8. **Dark mode support** with proper theme management

By following these patterns and using the recommended component libraries, you can build production-grade admin panels that are accessible, performant, and maintainable.
