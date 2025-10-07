export function getNested<T = unknown>(obj: unknown, path: (string | number)[]): T | undefined {
  return path.reduce((acc: any, key) => {
    if (acc == null) return undefined;
    return acc[key as keyof typeof acc];
  }, obj) as T | undefined;
}

export function setNested(obj: any, path: (string | number)[], value: unknown): any {
  if (!path.length) return obj || {};
  const [head, ...rest] = path;
  const clone: any = Array.isArray(obj) ? [...obj] : { ...(obj || {}) };
  if (rest.length === 0) {
    if (value === undefined) {
      if (Array.isArray(clone)) {
        clone.splice(head as number, 1);
      } else {
        delete clone[head as string];
      }
    } else {
      clone[head as keyof typeof clone] = value;
    }
    return clone;
  }
  const current = clone[head as keyof typeof clone];
  const nextContainer =
    typeof current === 'object' && current !== null
      ? current
      : typeof rest[0] === 'number'
        ? []
        : {};
  clone[head as keyof typeof clone] = setNested(nextContainer, rest, value);
  return clone;
}
