/**
 * TemplateTextEditor Component
 *
 * A rich text editor for council staff to create custom notice templates.
 * Features:
 * - Large textarea for template text
 * - Placeholder insertion dropdown
 * - Grouped placeholders (Required/Optional)
 * - Character count
 * - Side-by-side live preview with placeholder substitution
 * - Beautiful UI matching existing design system
 */

import { useState, useRef, useEffect } from 'react';
import {
  getPlaceholdersForNoticeType,
  type PlaceholderDefinition,
  formatCategoryName,
} from '@/next/publish/config/placeholders';
import TemplatePreview from './TemplatePreview';

interface TemplateTextEditorProps {
  /** Current template text value */
  value: string;

  /** Callback when template text changes */
  onChange: (value: string) => void;

  /** Notice type to determine available placeholders */
  noticeType: string;

  /** Optional class name for styling */
  className?: string;
}

/** localStorage key for preview visibility preference */
const PREVIEW_VISIBLE_KEY = 'templateEditor.showPreview';

export default function TemplateTextEditor({
  value,
  onChange,
  noticeType,
  className = '',
}: TemplateTextEditorProps) {
  const [showPlaceholderMenu, setShowPlaceholderMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPreview, setShowPreview] = useState(() => {
    // Initialize from localStorage, default to true
    const stored = localStorage.getItem(PREVIEW_VISIBLE_KEY);
    return stored !== null ? stored === 'true' : true;
  });
  const editorRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  // Track if the change originated from user input to avoid resetting cursor
  const isUserInputRef = useRef(false);
  // Track last value to detect external changes
  const lastValueRef = useRef(value);

  const placeholders = getPlaceholdersForNoticeType(noticeType);
  const requiredPlaceholders = placeholders.filter(p => p.required);
  const optionalPlaceholders = placeholders.filter(p => !p.required);

  // Persist preview visibility preference
  useEffect(() => {
    localStorage.setItem(PREVIEW_VISIBLE_KEY, String(showPreview));
  }, [showPreview]);

  // Filter placeholders by search query
  const filterPlaceholders = (placeholderList: PlaceholderDefinition[]) => {
    if (!searchQuery) return placeholderList;

    const query = searchQuery.toLowerCase();
    return placeholderList.filter(
      p =>
        p.token.toLowerCase().includes(query) ||
        p.label.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query)
    );
  };

  const filteredRequired = filterPlaceholders(requiredPlaceholders);
  const filteredOptional = filterPlaceholders(optionalPlaceholders);

  // Sync value prop to contentEditable when changed externally (not from user input)
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    // Only update innerHTML if value changed externally (not from user input)
    if (value !== lastValueRef.current && !isUserInputRef.current) {
      editor.innerHTML = value;
    }

    // Reset user input flag and update last value
    isUserInputRef.current = false;
    lastValueRef.current = value;
  }, [value]);

  // Initialize content on mount
  useEffect(() => {
    const editor = editorRef.current;
    if (editor && value) {
      editor.innerHTML = value;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowPlaceholderMenu(false);
        setSearchQuery('');
      }
    };

    if (showPlaceholderMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showPlaceholderMenu]);

  /**
   * Insert a placeholder at the current cursor position
   * Ensures cursor is positioned immediately after the inserted variable
   */
  const insertPlaceholder = (token: string) => {
    const editor = editorRef.current;
    if (!editor) return;

    const placeholder = `{{${token}}}`;

    // Focus the editor first
    editor.focus();

    // Get the current selection
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      // No selection, append to the end and position cursor after
      isUserInputRef.current = true;
      const newValue = value + placeholder;
      onChange(newValue);
      // Update the DOM directly
      editor.innerHTML = newValue;

      // Position cursor at the end after the inserted placeholder
      const range = document.createRange();
      range.selectNodeContents(editor);
      range.collapse(false); // collapse to end
      selection?.removeAllRanges();
      selection?.addRange(range);
    } else {
      // Save the current range before inserting
      const range = selection.getRangeAt(0);

      // Delete any selected text first
      range.deleteContents();

      // Create a text node for the placeholder
      const textNode = document.createTextNode(placeholder);
      range.insertNode(textNode);

      // Move cursor to immediately after the inserted text node
      range.setStartAfter(textNode);
      range.setEndAfter(textNode);
      selection.removeAllRanges();
      selection.addRange(range);

      // Mark as user input and update the value
      isUserInputRef.current = true;
      onChange(editor.innerHTML);
    }

    setShowPlaceholderMenu(false);
    setSearchQuery('');
  };

  /**
   * Render a single placeholder option
   */
  const renderPlaceholderOption = (placeholder: PlaceholderDefinition) => {
    const categoryColorMap: Record<string, string> = {
      applicant: 'bg-blue-50 text-blue-700 border-blue-200',
      premises: 'bg-purple-50 text-purple-700 border-purple-200',
      licensing: 'bg-orange-50 text-orange-700 border-orange-200',
      consultation: 'bg-green-50 text-green-700 border-green-200',
      location: 'bg-teal-50 text-teal-700 border-teal-200',
      gambling: 'bg-red-50 text-red-700 border-red-200',
      transport: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      planning: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      probate: 'bg-slate-50 text-slate-700 border-slate-200',
      tro: 'bg-amber-50 text-amber-700 border-amber-200',
      other: 'bg-gray-50 text-gray-700 border-gray-200',
    };
    const categoryColor = categoryColorMap[placeholder.category] || categoryColorMap.other;

    return (
      <button
        key={placeholder.token}
        onClick={() => insertPlaceholder(placeholder.token)}
        className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors rounded-lg group"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <code className="text-sm font-mono font-semibold text-gray-900 group-hover:text-blue-600">
                {`{{${placeholder.token}}}`}
              </code>
              <span
                className={`text-xs px-2 py-0.5 rounded-full border ${categoryColor}`}
              >
                {formatCategoryName(placeholder.category)}
              </span>
            </div>
            <p className="text-sm text-gray-900 font-medium mb-1">
              {placeholder.label}
            </p>
            <p className="text-xs text-gray-600 mb-1">
              {placeholder.description}
            </p>
            <p className="text-xs text-gray-500 italic">
              Example: {placeholder.example}
            </p>
          </div>
        </div>
      </button>
    );
  };

  // Strip HTML for accurate character and word count
  const stripHtml = (html: string) => {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  };

  const plainText = stripHtml(value);
  const characterCount = plainText.length;
  const wordCount = plainText.trim() ? plainText.trim().split(/\s+/).length : 0;

  return (
    <div className={`space-y-3 ${className}`}>
      <style>{`
        [contenteditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #9CA3AF;
          pointer-events: none;
          white-space: pre-wrap;
        }
      `}</style>

      {/* Header row with label, word count, and preview toggle */}
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Template Text *
        </label>
        <div className="flex items-center gap-4">
          <span className="text-xs text-gray-500">
            {wordCount} words, {characterCount} characters
          </span>
          {/* Preview toggle */}
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              showPreview
                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {showPreview ? (
                <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              ) : (
                <path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              )}
            </svg>
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </button>
        </div>
      </div>

      {/* Help text */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
        <p className="text-sm text-blue-800">
          Write your notice template below. Use placeholders like{' '}
          <code className="font-mono bg-blue-100 px-1 py-0.5 rounded">
            {`{{APPLICANT_NAME}}`}
          </code>{' '}
          to insert dynamic content. Click the "Insert Placeholder" button to
          see all available options.
        </p>
      </div>

      {/* Editor toolbar */}
      <div className="flex items-center gap-2">
        {/* Formatting buttons */}
        <div className="flex items-center gap-1 border border-gray-300 rounded-xl p-1 bg-white">
          <button
            type="button"
            onClick={() => {
              document.execCommand('bold', false);
              editorRef.current?.focus();
              // Update value after formatting
              if (editorRef.current) {
                isUserInputRef.current = true;
                onChange(editorRef.current.innerHTML);
              }
            }}
            className="px-3 py-1.5 hover:bg-gray-100 rounded-lg transition-colors font-bold"
            title="Bold (Ctrl+B)"
          >
            B
          </button>
          <button
            type="button"
            onClick={() => {
              document.execCommand('underline', false);
              editorRef.current?.focus();
              // Update value after formatting
              if (editorRef.current) {
                isUserInputRef.current = true;
                onChange(editorRef.current.innerHTML);
              }
            }}
            className="px-3 py-1.5 hover:bg-gray-100 rounded-lg transition-colors underline"
            title="Underline (Ctrl+U)"
          >
            U
          </button>
          <button
            type="button"
            onClick={() => {
              document.execCommand('italic', false);
              editorRef.current?.focus();
              // Update value after formatting
              if (editorRef.current) {
                isUserInputRef.current = true;
                onChange(editorRef.current.innerHTML);
              }
            }}
            className="px-3 py-1.5 hover:bg-gray-100 rounded-lg transition-colors italic"
            title="Italic (Ctrl+I)"
          >
            I
          </button>
        </div>

        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setShowPlaceholderMenu(!showPlaceholderMenu)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-sm"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M12 4v16m8-8H4" />
            </svg>
            Insert Placeholder
          </button>

          {/* Placeholder dropdown menu */}
          {showPlaceholderMenu && (
            <div className="absolute top-full left-0 mt-2 w-full min-w-[500px] max-w-[600px] bg-white rounded-2xl shadow-2xl border border-gray-200 z-[100] max-h-[400px] flex flex-col">
              {/* Search bar */}
              <div className="flex-shrink-0 bg-white border-b border-gray-200 p-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search placeholders..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
              </div>

              {/* Scrollable content area */}
              <div className="flex-1 overflow-y-auto p-2">
                {/* Required Placeholders */}
                {filteredRequired.length > 0 && (
                  <div className="mb-4">
                    <div className="px-4 py-2 bg-red-50 rounded-lg mb-2">
                      <h3 className="text-sm font-semibold text-red-900">
                        Required Placeholders
                      </h3>
                      <p className="text-xs text-red-700">
                        These placeholders must be included in your template
                      </p>
                    </div>
                    <div className="space-y-1">
                      {filteredRequired.map(renderPlaceholderOption)}
                    </div>
                  </div>
                )}

                {/* Optional Placeholders */}
                {filteredOptional.length > 0 && (
                  <div>
                    <div className="px-4 py-2 bg-gray-50 rounded-lg mb-2">
                      <h3 className="text-sm font-semibold text-gray-900">
                        Optional Placeholders
                      </h3>
                      <p className="text-xs text-gray-700">
                        Include these as needed for additional information
                      </p>
                    </div>
                    <div className="space-y-1">
                      {filteredOptional.map(renderPlaceholderOption)}
                    </div>
                  </div>
                )}

                {/* No results */}
                {filteredRequired.length === 0 &&
                  filteredOptional.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <p>No placeholders found matching "{searchQuery}"</p>
                    </div>
                  )}
              </div>
            </div>
          )}
        </div>

        {placeholders.length === 0 && (
          <span className="text-sm text-amber-600">
            No placeholders available for this notice type
          </span>
        )}
      </div>

      {/* Side-by-side editor and preview container */}
      <div
        className={`flex flex-col ${showPreview ? 'lg:flex-row' : ''} gap-4`}
      >
        {/* Editor panel */}
        <div className={`flex-1 ${showPreview ? 'lg:w-1/2' : 'w-full'}`}>
          {/* Template text area - contentEditable for rich text support */}
          <div
            ref={editorRef}
            contentEditable
            onInput={e => {
              const target = e.target as HTMLDivElement;
              // Mark as user input to prevent cursor reset
              isUserInputRef.current = true;
              onChange(target.innerHTML);
            }}
            onBlur={e => {
              const target = e.target as HTMLDivElement;
              // Mark as user input to prevent cursor reset
              isUserInputRef.current = true;
              onChange(target.innerHTML);
            }}
            className="w-full min-h-[500px] px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm leading-relaxed overflow-y-auto"
            style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}
            data-placeholder={
              !value
                ? `Write your notice template here...

Example:
LICENSING ACT 2003
APPLICATION FOR A NEW PREMISES LICENCE

Notice is hereby given that {{APPLICANT_NAME}} has applied to {{AUTHORITY_NAME}} for a new premises licence for {{PREMISES_NAME}}, {{PREMISES_ADDRESS}}.

Licensable activities applied for: {{LICENSABLE_ACTIVITIES}}.

Any representations must be made in writing by {{DEADLINE_DATE}} to {{REPRESENTATION_ADDRESS}}.`
                : undefined
            }
          />
        </div>

        {/* Preview panel - shown when showPreview is true */}
        {showPreview && (
          <div className="flex-1 lg:w-1/2 min-h-[500px]">
            <TemplatePreview
              templateText={value}
              noticeType={noticeType}
              className="h-full border border-gray-200 rounded-xl shadow-sm"
            />
          </div>
        )}
      </div>

      {/* Footer info */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>
            Press Tab inside textarea for better formatting control
          </span>
        </div>
      </div>
    </div>
  );
}
