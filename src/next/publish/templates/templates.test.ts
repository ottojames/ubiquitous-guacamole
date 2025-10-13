import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { NOTICE_DEFINITIONS } from '@/next/publish/config/noticeTypes';
import { getNoticeBuilder } from '@/next/publish/schema/registry';
import { getNoticeTemplateRenderer } from '@/next/publish/templates';
import { buildSampleDraft } from '@/next/publish/sampleData';

describe('Notice template renderers', () => {
  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-09-25T09:00:00Z'));
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  for (const definition of NOTICE_DEFINITIONS) {
    it(`renders ${definition.id}`, () => {
      const builder = getNoticeBuilder(definition.id);
      expect(builder).not.toBeNull();
      const sample = buildSampleDraft(definition.id);
      expect(sample).not.toBeNull();
      const parsed = builder!.schema.parse(sample as Record<string, unknown>);
      const notice = builder!.mapToNoticeBase(parsed);
      const renderer = getNoticeTemplateRenderer(definition.templateKey);
      expect(renderer).not.toBeNull();
      const text = renderer!.renderText(notice);
      expect(text).toMatchSnapshot();
    });
  }
});
