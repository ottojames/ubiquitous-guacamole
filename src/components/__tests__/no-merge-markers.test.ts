import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

function gather(dir: string): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      files.push(...gather(full));
    } else if (['.ts', '.tsx'].includes(extname(entry))) {
      files.push(full);
    }
  }
  return files;
}

describe('no merge markers', () => {
  const files = [...gather('src'), ...gather('templates')].filter(
    (f) => !f.endsWith('no-merge-markers.test.ts')
  );
  files.forEach((file) => {
    it(`${file} has no conflict markers`, () => {
      const content = readFileSync(file, 'utf8');
      expect(content).not.toMatch(/<<<<<<<|=======|>>>>>>>/);
    });
  });
});
