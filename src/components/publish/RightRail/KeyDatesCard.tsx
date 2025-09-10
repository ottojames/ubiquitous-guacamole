import React from 'react';

export default function KeyDatesCard({ representationDeadline }: { representationDeadline: string }) {
  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm mt-4" aria-label="Key dates">
      <h3 className="font-medium mb-2">Key dates</h3>
      <div className="text-sm">Representation deadline: {representationDeadline}</div>
    </div>
  );
}
