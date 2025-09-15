import React from "react";
import type { Filters } from "../lib/filter";

interface Props {
  filters: Filters;
  setFilters: (f: Partial<Filters>) => void;
}

export default function FilterBar({ filters, setFilters }: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      <div>
        <label htmlFor="filter-type" className="text-sm font-medium text-slate-700">Type</label>
        <select
          id="filter-type"
          value={filters.type}
          onChange={(e) => setFilters({ type: e.target.value })}
          className={`mt-1 h-11 block w-full text-sm rounded-lg border border-[rgba(25,38,80,0.12)] bg-white text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 focus:ring-offset-transparent`}
        >
          <option value="">All</option>
          <option value="Premises Licence">Premises</option>
          <option value="Planning">Planning</option>
          <option value="Traffic Order">Traffic</option>
          <option value="Other">Other</option>
        </select>
      </div>
      <div>
        <label htmlFor="filter-status" className="text-sm font-medium text-slate-700">Status</label>
        <select
          id="filter-status"
          value={filters.status}
          onChange={(e) => setFilters({ status: e.target.value })}
          className={`mt-1 h-11 block w-full text-sm rounded-lg border border-[rgba(25,38,80,0.12)] bg-white text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 focus:ring-offset-transparent`}
        >
          <option value="">All</option>
          <option value="Open">Open</option>
          <option value="Closed">Closed</option>
        </select>
      </div>
      <div>
        <label htmlFor="filter-start" className="text-sm font-medium text-slate-700">Start</label>
        <input
          id="filter-start"
          type="date"
          value={filters.start}
          onChange={(e) => setFilters({ start: e.target.value })}
          className={`mt-1 h-11 block w-full text-sm rounded-lg border border-[rgba(25,38,80,0.12)] bg-white text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 focus:ring-offset-transparent`}
        />
      </div>
      <div>
        <label htmlFor="filter-end" className="text-sm font-medium text-slate-700">End</label>
        <input
          id="filter-end"
          type="date"
          value={filters.end}
          onChange={(e) => setFilters({ end: e.target.value })}
          className={`mt-1 h-11 block w-full text-sm rounded-lg border border-[rgba(25,38,80,0.12)] bg-white text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 focus:ring-offset-transparent`}
        />
      </div>
      <div>
        <label htmlFor="filter-authority" className="text-sm font-medium text-slate-700">Authority</label>
        <input
          id="filter-authority"
          type="text"
          value={filters.authority}
          onChange={(e) => setFilters({ authority: e.target.value })}
          placeholder="Council"
          className={`mt-1 h-11 block w-full text-sm rounded-lg border border-[rgba(25,38,80,0.12)] bg-white text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 focus:ring-offset-transparent`}
        />
      </div>
    </div>
  );
}
