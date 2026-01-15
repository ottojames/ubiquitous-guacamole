import React, { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

type Props = {
  text: string;
  onTextChange: (text: string) => void;
  editable?: boolean;
  placeholder?: string;
};

export default function EditableNoticePreview({
  text,
  onTextChange,
  editable = true,
  placeholder = "Start typing your notice here..."
}: Props) {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [localText, setLocalText] = useState(text);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    setLocalText(text);
  }, [text]);

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [localText, isEditing]);

  const handleEdit = () => {
    if (!editable) return;
    setIsEditing(true);
    setTimeout(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(localText.length, localText.length);
    }, 0);
  };

  const handleSave = () => {
    onTextChange(localText);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setLocalText(text);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Allow Enter for line breaks
    if (e.key === 'Tab') {
      e.preventDefault();
      // Insert 4 spaces for tab
      const start = textareaRef.current?.selectionStart || 0;
      const end = textareaRef.current?.selectionEnd || 0;
      const newText = localText.substring(0, start) + '    ' + localText.substring(end);
      setLocalText(newText);
      setTimeout(() => {
        textareaRef.current?.setSelectionRange(start + 4, start + 4);
      }, 0);
    }
  };

  const copyText = async () => {
    try {
      await navigator.clipboard?.writeText(localText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const downloadTxt = () => {
    const blob = new Blob([localText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "notice.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Format text for display (preserve line breaks)
  const formatDisplayText = (text: string) => {
    return text
      .split('\n')
      .map((line, i) => (
        <React.Fragment key={i}>
          {line || '\u00A0'}{/* Non-breaking space for empty lines */}
          {i < text.split('\n').length - 1 && <br />}
        </React.Fragment>
      ));
  };

  const isEmpty = !localText.trim();

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {editable && !isEditing && (
            <button
              type="button"
              aria-label="Edit text"
              title="Edit notice text"
              className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-medium text-blue-700 shadow-sm transition-all duration-150 hover:bg-blue-100 hover:border-blue-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              onClick={handleEdit}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span className="hidden sm:inline">Edit</span>
            </button>
          )}
          {isEditing && (
            <>
              <button
                type="button"
                aria-label="Save changes"
                title="Save changes"
                className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-700 shadow-sm transition-all duration-150 hover:bg-emerald-100 hover:border-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                onClick={handleSave}
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="hidden sm:inline">Save</span>
              </button>
              <button
                type="button"
                aria-label="Cancel editing"
                title="Cancel editing"
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition-all duration-150 hover:bg-slate-50 hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
                onClick={handleCancel}
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="hidden sm:inline">Cancel</span>
              </button>
            </>
          )}
          {!isEditing && (
            <>
              <button
                type="button"
                aria-label="Copy text"
                title="Copy text"
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition-all duration-150 hover:bg-slate-50 hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                onClick={copyText}
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span className="hidden sm:inline">Copy</span>
              </button>
              <button
                type="button"
                aria-label="Download .txt"
                title="Download as text file"
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition-all duration-150 hover:bg-slate-50 hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                onClick={downloadTxt}
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span className="hidden sm:inline">Download</span>
              </button>
            </>
          )}
        </div>

        {/* Character/line count */}
        {!isEmpty && (
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>{localText.split('\n').length} lines</span>
            <span>{localText.length.toLocaleString()} characters</span>
          </div>
        )}
      </div>

      {/* Preview/Edit content */}
      <div className="overflow-hidden rounded-xl border border-slate-200/60 bg-slate-50/30 shadow-inner">
        <AnimatePresence mode="wait" initial={false}>
          {!isEmpty || isEditing ? (
            <motion.div
              key={isEditing ? 'editing' : 'preview'}
              initial={{ opacity: reduceMotion ? 1 : 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: reduceMotion ? 1 : 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.2 }}
              className="bg-white"
            >
              {isEditing ? (
                <textarea
                  ref={textareaRef}
                  value={localText}
                  onChange={(e) => setLocalText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={placeholder}
                  className="w-full resize-none border-0 bg-white p-4 font-sans text-[14px] leading-[1.6] text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-0"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                    minHeight: '400px'
                  }}
                />
              ) : (
                <div
                  className="notice-preview max-h-[600px] overflow-y-auto break-words bg-white p-4 font-sans text-[14px] leading-[1.6] text-slate-800 [overflow-wrap:anywhere] scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100 cursor-text hover:bg-slate-50/50 transition-colors"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                    minHeight: '200px',
                    whiteSpace: 'pre-wrap'
                  }}
                  onClick={handleEdit}
                  role={editable ? "button" : undefined}
                  tabIndex={editable ? 0 : undefined}
                  aria-label={editable ? "Click to edit notice text" : undefined}
                >
                  {formatDisplayText(localText)}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="placeholder"
              initial={{ opacity: reduceMotion ? 1 : 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: reduceMotion ? 1 : 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.2 }}
              className="flex min-h-[200px] flex-col items-center justify-center p-8 text-center cursor-text hover:bg-slate-50/50 transition-colors"
              onClick={handleEdit}
              role={editable ? "button" : undefined}
              tabIndex={editable ? 0 : undefined}
              aria-label={editable ? "Click to start editing" : undefined}
            >
              <svg className="mb-3 h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm font-medium text-slate-600">No preview yet</p>
              <p className="mt-1 text-xs text-slate-500">
                {editable ? "Click here to start writing your notice" : "Upload a file or complete the form to see your notice"}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Help text when editing */}
      {isEditing && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700"
        >
          <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Press Enter to add line breaks, Tab to indent. Your formatting will be preserved.</span>
        </motion.div>
      )}

      {/* Copy notification toast */}
      <AnimatePresence>
        {copied && (
          <motion.div
            initial={{ opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 10 }}
            transition={{ duration: reduceMotion ? 0 : 0.15 }}
            className="fixed bottom-6 right-6 z-[500] flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-[0_8px_24px_rgba(0,0,0,0.25)]"
            role="status"
            aria-live="polite"
          >
            <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            Copied to clipboard
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}