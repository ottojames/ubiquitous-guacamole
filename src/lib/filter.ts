export interface Notice {
  type: string;
  status: string;
  deadline: string;
  council: string;
  submitted: string;
}

export interface Filters {
  type: string;
  status: string;
  start: string;
  end: string;
  authority: string;
}

export function filterNotices<T extends Notice>(notices: T[], filters: Filters): T[] {
  return notices.filter((n) => {
    if (filters.type && n.type !== filters.type) return false;
    if (filters.status && n.status !== filters.status) return false;
    if (filters.authority && !n.council.toLowerCase().includes(filters.authority.toLowerCase())) return false;
    if (filters.start && new Date(n.submitted) < new Date(filters.start)) return false;
    if (filters.end && new Date(n.deadline) > new Date(filters.end)) return false;
    return true;
  });
}
