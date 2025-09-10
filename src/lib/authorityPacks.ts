import bristol from '@/data/authorityPacks/bristol.json';
import camden from '@/data/authorityPacks/camden.json';
import edinburgh from '@/data/authorityPacks/edinburgh.json';
import leeds from '@/data/authorityPacks/leeds.json';
import manchester from '@/data/authorityPacks/manchester.json';
import southwark from '@/data/authorityPacks/southwark.json';

export type AuthorityPack = {
  id: string;
  name: string;
  region: string;
  representation: {
    email?: string;
    postal?: string;
    portal?: string;
  };
  consultationLength?: number;
  costOverride?: number;
  headingCase?: string;
};

const packs: Record<string, AuthorityPack> = {
  bristol,
  camden,
  edinburgh,
  leeds,
  manchester,
  southwark,
};

export function getAuthorityPack(id: string): AuthorityPack | undefined {
  return packs[id];
}

export function listAuthorityPacks(): AuthorityPack[] {
  return Object.values(packs);
}
