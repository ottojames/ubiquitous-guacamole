import React from 'react';

export default function ComplianceCard({ issues }: { issues: string[] }) {
  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm mt-4" aria-label="Compliance checklist">
      <h3 className="font-medium mb-2">Compliance</h3>
      <ul className="list-disc pl-5 text-sm">
        {issues.length ? issues.map((i) => <li key={i}>{i}</li>) : <li>No issues</li>}
      </ul>
    </div>
  );
}
