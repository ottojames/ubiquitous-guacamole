import { describe, it, expect } from 'vitest';
import { generateProof, proofToTxt } from './proof';

describe('proof generation', () => {
  it('creates sha256 hash and timestamp', () => {
    const proof = generateProof({ a: 1 });
    expect(proof.hash).toMatch(/^[0-9a-f]{64}$/);
    expect(proof.timestamp).toBeDefined();
    expect(proofToTxt(proof)).toContain('Hash:');
  });
});
