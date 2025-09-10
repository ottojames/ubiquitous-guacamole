import React from 'react';
import ActivitiesTable, { type ActivityRow } from './ActivitiesTable';

export default function ActivitiesHours({ rows, onChange }: { rows: ActivityRow[]; onChange: (rows: ActivityRow[]) => void }) {
  const invalid = rows.length === 0 || rows.some((r) => !/^\d{2}:\d{2}$/.test(r.start) || !/^\d{2}:\d{2}$/.test(r.end));
  return (
    <div data-error={invalid}>
      <ActivitiesTable rows={rows} onChange={onChange} />
    </div>
  );
}

export type { ActivityRow };
