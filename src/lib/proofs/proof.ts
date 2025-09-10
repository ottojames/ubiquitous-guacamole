import crypto from 'crypto';

export interface Proof {
  hash: string;
  timestamp: string;
  manifest: Record<string, unknown>;
}

export function generateProof(manifest: Record<string, unknown>): Proof {
  const timestamp = new Date().toISOString();
  const hash = crypto
    .createHash('sha256')
    .update(JSON.stringify({ ...manifest, timestamp }))
    .digest('hex');
  return { hash, timestamp, manifest };
}

export function proofToTxt(proof: Proof): string {
  return `Hash: ${proof.hash}\nTimestamp: ${proof.timestamp}`;
}
