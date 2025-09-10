import React, { useState } from 'react';

export default function PreviewCard({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm" aria-label="Notice preview">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium">Preview</h3>
        <button type="button" className="text-sm underline" onClick={() => setOpen(true)}>Expand</button>
      </div>
      <p className="text-sm whitespace-pre-wrap max-h-40 overflow-auto" id="notice-preview">{text}</p>
      {open && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white max-w-2xl w-full p-6 rounded-lg shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-medium">Notice preview</h4>
              <button onClick={() => setOpen(false)} aria-label="Close" className="text-sm underline">Close</button>
            </div>
            <div className="overflow-auto max-h-[70vh] whitespace-pre-wrap">{text}</div>
          </div>
        </div>
      )}
    </div>
  );
}
