/**
 * TemplateTextEditor Component
 *
 * A rich text editor for council staff to create custom notice templates.
 * Features:
 * - Large textarea for template text
 * - Placeholder insertion dropdown
 * - Grouped placeholders (Required/Optional)
 * - Character count
 * - Beautiful UI matching existing design system
 */

import { useState, useRef, useEffect } from 'react';
import {
  getPlaceholdersForNoticeType,
  type PlaceholderDefinition,
  formatCategoryName,
} from '@/next/publish/config/placeholders';

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

export default function TemplateTextEditor({
  value,
  onChange,
  noticeType,
  className = '',
}: TemplateTextEditorProps) {
  const [showPlaceholderMenu, setShowPlaceholderMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const placeholders = getPlaceholdersForNoticeType(noticeType);
  const requiredPlaceholders = placeholders.filter(p => p.required);
  const optionalPlaceholders = placeholders.filter(p => !p.required);

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
   */
  const insertPlaceholder = (token: string) => {
    const editor = textareaRef.current as HTMLDivElement;
    if (!editor) return;

    const placeholder = `{{${token}}}`;

    // Focus the editor first
    editor.focus();

    // Get the current selection
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      // No selection, just append to the end
      const newValue = value + placeholder;
      onChange(newValue);
    } else {
      // Insert at cursor position using execCommand
      document.execCommand('insertText', false, placeholder);

      // Update the value
      onChange(editor.innerHTML);
    }

    setShowPlaceholderMenu(false);
    setSearchQuery('');
  };

  /**
   * Render a single placeholder option
   */
  const renderPlaceholderOption = (placeholder: PlaceholderDefinition) => {
    const categoryColor = {
      applicant: 'bg-blue-50 text-blue-700 border-blue-200',
      premises: 'bg-purple-50 text-purple-700 border-purple-200',
      licensing: 'bg-orange-50 text-orange-700 border-orange-200',
      consultation: 'bg-green-50 text-green-700 border-green-200',
      location: 'bg-teal-50 text-teal-700 border-teal-200',
      other: 'bg-gray-50 text-gray-700 border-gray-200',
    }[placeholder.category];

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
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Template Text *
        </label>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">
            {wordCount} words, {characterCount} characters
          </span>
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
              textareaRef.current?.focus();
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
              textareaRef.current?.focus();
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
              textareaRef.current?.focus();
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

      {/* Template text area - contentEditable for rich text support */}
      <div
        ref={textareaRef as any}
        contentEditable
        onInput={e => {
          const target = e.target as HTMLDivElement;
          onChange(target.innerHTML);
        }}
        onBlur={e => {
          const target = e.target as HTMLDivElement;
          onChange(target.innerHTML);
        }}
        dangerouslySetInnerHTML={{ __html: value }}
        className="w-full min-h-[500px] px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm leading-relaxed overflow-y-auto"
        style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}
        data-placeholder={!value ? `Write your notice template here...

Example:
LICENSING ACT 2003
APPLICATION FOR A NEW PREMISES LICENCE

Notice is hereby given that {{APPLICANT_NAME}} has applied to {{AUTHORITY_NAME}} for a new premises licence for {{PREMISES_NAME}}, {{PREMISES_ADDRESS}}.

Licensable activities applied for: {{LICENSABLE_ACTIVITIES}}.

Any representations must be made in writing by {{DEADLINE_DATE}} to {{REPRESENTATION_ADDRESS}}.` : undefined}
      />

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
