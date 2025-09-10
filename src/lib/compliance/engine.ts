export type Rule<T> = {
  id: string;
  severity: 'error' | 'warning';
  message: string;
  rationale: string;
  anchor?: string;
  test: (data: T) => boolean;
};

export type Result<T> = Rule<T> & { ok: boolean };

export function runCompliance<T>(data: T, rules: Rule<T>[]): Result<T>[] {
  return rules.map((r) => ({ ...r, ok: r.test(data) }));
}
