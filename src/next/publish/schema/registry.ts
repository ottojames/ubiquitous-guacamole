import { z } from 'zod';
import type { NoticeBase } from '@/types/notice';
import { NOTICE_DEFINITIONS } from '@/next/publish/config/noticeTypes';
import {
  LICENSING_VARIANTS,
  licensingNoticeSchema,
  mapLicensingToNoticeBase,
} from './licensing';
import {
  GAMBLING_VARIANTS,
  gamblingNoticeSchema,
  mapGamblingToNoticeBase,
} from './gambling';
import { GVOL_VARIANTS, gvolNoticeSchema, mapGvolToNoticeBase } from './gvol';
import {
  PLANNING_VARIANTS,
  planningNoticeSchema,
  mapPlanningToNoticeBase,
} from './planning';
import { probateNoticeSchema, mapProbateToNoticeBase } from './probate';

export type BuilderSchema = z.ZodTypeAny;

export interface NoticeBuilder {
  definitionId: string;
  schema: BuilderSchema;
  mapToNoticeBase: (input: unknown) => NoticeBase;
  category: string;
}

const registry = new Map<string, NoticeBuilder>();

for (const definition of NOTICE_DEFINITIONS) {
  if (LICENSING_VARIANTS.includes(definition.id as any)) {
    registry.set(definition.id, {
      definitionId: definition.id,
      category: 'licensing',
      schema: licensingNoticeSchema,
      mapToNoticeBase: (input) => {
        const parsed = licensingNoticeSchema.parse({ ...(input as object), variant: definition.id });
        return mapLicensingToNoticeBase(parsed);
      },
    });
    continue;
  }
  if (GAMBLING_VARIANTS.includes(definition.id as any)) {
    registry.set(definition.id, {
      definitionId: definition.id,
      category: 'gambling',
      schema: gamblingNoticeSchema,
      mapToNoticeBase: (input) => {
        const parsed = gamblingNoticeSchema.parse({ ...(input as object), variant: definition.id });
        return mapGamblingToNoticeBase(parsed);
      },
    });
    continue;
  }
  if (GVOL_VARIANTS.includes(definition.id as any)) {
    registry.set(definition.id, {
      definitionId: definition.id,
      category: 'gvol',
      schema: gvolNoticeSchema,
      mapToNoticeBase: (input) => {
        const parsed = gvolNoticeSchema.parse({ ...(input as object), variant: definition.id });
        return mapGvolToNoticeBase(parsed);
      },
    });
    continue;
  }
  if (PLANNING_VARIANTS.includes(definition.id as any)) {
    registry.set(definition.id, {
      definitionId: definition.id,
      category: 'planning',
      schema: planningNoticeSchema,
      mapToNoticeBase: (input) => {
        const parsed = planningNoticeSchema.parse({ ...(input as object), variant: definition.id });
        return mapPlanningToNoticeBase(parsed);
      },
    });
    continue;
  }
  if (definition.id === 'probate-trustee-s27') {
    registry.set(definition.id, {
      definitionId: definition.id,
      category: 'probate',
      schema: probateNoticeSchema,
      mapToNoticeBase: (input) => {
        const parsed = probateNoticeSchema.parse(input);
        return mapProbateToNoticeBase(parsed);
      },
    });
    continue;
  }
}

export function getNoticeBuilder(definitionId: string): NoticeBuilder | null {
  return registry.get(definitionId) ?? null;
}

export function assertNoticeBuilder(definitionId: string): NoticeBuilder {
  const builder = getNoticeBuilder(definitionId);
  if (!builder) {
    throw new Error(`No builder registered for ${definitionId}`);
  }
  return builder;
}
