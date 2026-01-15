/**
 * CouncilDepartmentSelect - Database-driven council department selector
 *
 * This component queries the database for departments filtered by type,
 * enabling proper template matching based on notice category.
 *
 * Unlike the legacy CouncilSelect (which uses static JSON), this component:
 * - Queries live database for departments
 * - Filters by department type (licensing, planning, traffic, etc.)
 * - Returns full department object with IDs for template lookup
 * - Only shows councils that actually exist in the database
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { DepartmentType } from '@/next/publish/config/departmentNoticeTypes';

export type CouncilDepartment = {
  id: string;                    // Department UUID for template lookup
  departmentName: string;        // e.g., "Licensing"
  departmentType: DepartmentType; // e.g., "licensing"
  organizationId: string;        // Organization UUID
  organizationName: string;      // e.g., "Bristol City Council"
  email?: string;                // Department contact email
  displayName: string;           // Combined: "Bristol City Council - Licensing"
};

type Props = {
  value?: string;                // Display value (organization name)
  departmentType?: DepartmentType; // Filter departments by type
  onSelect: (department: CouncilDepartment) => void;
  onChangeText?: (value: string) => void;
  onBlur?: () => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  label?: string;
  placeholder?: string;
  id?: string;
  name?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
};

function norm(input: string) {
  return input.toLowerCase().normalize('NFKD').replace(/\s+/g, ' ').trim();
}

export default function CouncilDepartmentSelect({
  value,
  departmentType,
  onSelect,
  onChangeText,
  onBlur,
  inputRef,
  label = 'Council',
  placeholder = 'Search councils…',
  id = 'council-department',
  name,
  required = true,
  error,
  disabled = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState<string>(value ?? '');
  const [activeIdx, setActiveIdx] = useState<number>(-1);
  const [departments, setDepartments] = useState<CouncilDepartment[]>([]);
  const [loading, setLoading] = useState(true); // Start as loading
  const [loadError, setLoadError] = useState<string | null>(null);

  const fallbackRef = useRef<HTMLInputElement>(null);
  const resolvedInputRef = inputRef ?? fallbackRef;
  const listRef = useRef<HTMLUListElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const pointerDownRef = useRef(false);

  // Load departments from database
  useEffect(() => {
    // Clear state and load fresh data
    setDepartments([]);
    setLoading(true);
    setLoadError(null);

    (async () => {
      try {
        let query = supabase
          .from('departments')
          .select(`
            id,
            name,
            type,
            contact_email,
            organization_id,
            organizations!inner (
              id,
              name
            )
          `)
          .order('organizations(name)');

        if (departmentType) {
          query = query.eq('type', departmentType);
        }

        const { data, error } = await query;

        if (error) {
          console.error('[CouncilDepartmentSelect] Database error:', error);
          setLoadError('Failed to load councils');
          setLoading(false);
          return;
        }

        const transformed: CouncilDepartment[] = (data || []).map((dept: any) => ({
          id: dept.id,
          departmentName: dept.name,
          departmentType: dept.type,
          organizationId: dept.organizations.id,
          organizationName: dept.organizations.name,
          email: dept.contact_email,
          displayName: `${dept.organizations.name} - ${dept.name}`,
        }));

        setDepartments(transformed);
        setLoading(false);
      } catch (err) {
        console.error('[CouncilDepartmentSelect] Exception:', err);
        setLoadError('Failed to load councils');
        setLoading(false);
      }
    })();
  }, [departmentType]);

  // Sync value prop to query state
  useEffect(() => {
    setQuery(value ?? '');
  }, [value]);

  // Filter options based on search query
  const options = useMemo(() => {
    const q = norm(query);
    if (!q) return departments;

    return departments.filter((dept) => {
      const orgName = norm(dept.organizationName);
      const deptName = norm(dept.departmentName);
      const display = norm(dept.displayName);

      return orgName.includes(q) || deptName.includes(q) || display.includes(q);
    });
  }, [query, departments]);

  // Update active index when options change
  useEffect(() => {
    setActiveIdx(options.length ? 0 : -1);
    if (query.trim()) {
      setOpen(options.length > 0);
    }
  }, [options.length, query]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleDocumentMouseDown(event: MouseEvent) {
      const root = rootRef.current;
      if (!root) return;
      if (root.contains(event.target as Node)) return;
      setOpen(false);
      pointerDownRef.current = false;
    }
    document.addEventListener('mousedown', handleDocumentMouseDown);
    return () => document.removeEventListener('mousedown', handleDocumentMouseDown);
  }, []);

  function select(option: CouncilDepartment) {
    setQuery(option.organizationName);
    setOpen(false);
    onSelect(option);
    console.log('[CouncilDepartmentSelect] Selected:', option);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
      setOpen(true);
      return;
    }

    if (!open) {
      if (event.key === 'Enter' && query.trim()) {
        event.preventDefault();
        // If there's a single exact match, select it
        if (options.length === 1) {
          select(options[0]);
        }
      }
      return;
    }

    if (event.key === 'Escape') {
      setOpen(false);
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      if (activeIdx >= 0 && activeIdx < options.length) {
        select(options[activeIdx]);
      }
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIdx((prev) => (prev + 1) % options.length);
      scrollToActive();
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIdx((prev) => (prev - 1 + options.length) % options.length);
      scrollToActive();
    }
  }

  function scrollToActive() {
    if (!listRef.current) return;
    const activeEl = listRef.current.children[activeIdx] as HTMLElement;
    if (!activeEl) return;
    activeEl.scrollIntoView({ block: 'nearest' });
  }

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const newQuery = event.target.value;
    setQuery(newQuery);
    if (onChangeText) {
      onChangeText(newQuery);
    }
  }

  function handleFocus() {
    if (!disabled) {
      setOpen(true);
    }
  }

  function handleBlur() {
    if (pointerDownRef.current) {
      pointerDownRef.current = false;
      return;
    }
    setTimeout(() => {
      setOpen(false);
      if (onBlur) {
        onBlur();
      }
    }, 150);
  }

  function handleOptionMouseDown() {
    pointerDownRef.current = true;
  }

  return (
    <div ref={rootRef} className="relative">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-600 ml-1">*</span>}
          {departmentType && (
            <span className="text-xs text-gray-500 ml-2">
              ({departmentType} departments only)
            </span>
          )}
        </label>
      )}

      <div className="relative">
        <input
          ref={resolvedInputRef}
          type="text"
          id={id}
          name={name}
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={loading ? 'Loading councils...' : placeholder}
          disabled={disabled || loading}
          required={required}
          autoComplete="off"
          className={`
            w-full pl-10 pr-4 py-3 border rounded-xl
            focus:ring-2 focus:ring-blue-500 focus:border-transparent
            disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
            ${error ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'}
          `}
          aria-autocomplete="list"
          aria-controls={`${id}-listbox`}
          aria-expanded={open}
          aria-activedescendant={activeIdx >= 0 ? `${id}-option-${activeIdx}` : undefined}
        />

        {/* Search icon */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {loadError && (
        <p className="mt-2 text-sm text-red-600">
          {loadError}
        </p>
      )}

      {error && (
        <p className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}

      {loading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ marginTop: label ? '20px' : '0' }}>
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
        </div>
      )}

      {open && options.length > 0 && (
        <ul
          ref={listRef}
          id={`${id}-listbox`}
          role="listbox"
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-64 overflow-y-auto"
          onMouseDown={handleOptionMouseDown}
        >
          {options.map((option, idx) => (
            <li
              key={option.id}
              id={`${id}-option-${idx}`}
              role="option"
              aria-selected={idx === activeIdx}
              className={`
                px-4 py-3 cursor-pointer border-b border-gray-100 last:border-0
                ${idx === activeIdx ? 'bg-blue-50' : 'hover:bg-gray-50'}
              `}
              onMouseDown={handleOptionMouseDown}
              onClick={() => select(option)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {option.organizationName}
                  </p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {option.departmentName}
                    {option.email && ` • ${option.email}`}
                  </p>
                </div>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {option.departmentType}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      {open && options.length === 0 && !loading && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-amber-200 rounded-xl shadow-xl p-4 bg-amber-50">
          <div className="text-center">
            <p className="text-sm font-medium text-amber-900 mb-1">
              {departments.length === 0 && !query
                ? '⚠️ No councils in database'
                : departmentType
                  ? `No ${departmentType} departments matching "${query}"`
                  : `No councils matching "${query}"`}
            </p>
            {departments.length === 0 && !query && (
              <p className="text-xs text-amber-700 mt-2">
                Import councils via Supabase SQL Editor to populate the dropdown
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
