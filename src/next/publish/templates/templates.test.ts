import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { NOTICE_DEFINITIONS } from '@/next/publish/config/noticeTypes';
import { getNoticeBuilder } from '@/next/publish/schema/registry';
import { getNoticeTemplateRenderer } from '@/next/publish/templates';
import { buildSampleDraft } from '@/next/publish/sampleData';
import { renderHtmlFromText } from '@/next/publish/templates/engine';

/**
 * Tests for renderHtmlFromText - Issue 1 fix
 * This function converts plain text with newlines to HTML with proper paragraph breaks.
 */
describe('renderHtmlFromText', () => {
  it('should convert double newlines to separate paragraphs', () => {
    const text = "First paragraph.\n\nSecond paragraph.";
    const html = renderHtmlFromText(text);
    expect(html).toBe("<p>First paragraph.</p>\n<p>Second paragraph.</p>");
  });

  it('should convert single newlines to <br /> within paragraphs', () => {
    const text = "Line one.\nLine two.";
    const html = renderHtmlFromText(text);
    expect(html).toBe("<p>Line one.<br />Line two.</p>");
  });

  it('should handle multiple paragraphs with internal line breaks', () => {
    const text = "Para 1 line 1.\nPara 1 line 2.\n\nPara 2 line 1.\nPara 2 line 2.";
    const html = renderHtmlFromText(text);
    expect(html).toBe(
      "<p>Para 1 line 1.<br />Para 1 line 2.</p>\n<p>Para 2 line 1.<br />Para 2 line 2.</p>"
    );
  });

  it('should return empty paragraph for empty input', () => {
    expect(renderHtmlFromText("")).toBe("<p></p>");
    expect(renderHtmlFromText("   ")).toBe("<p></p>");
  });

  it('should handle real notice-style content with proper paragraph breaks', () => {
    const noticeText = `LICENSING ACT 2003

An application for variation of a premises licence has been made by Test Applicant Ltd.

The premises address is:
123 Test Street
London W1A 1AA

Proposed activities:
Sale of alcohol: Mon-Sun 11:00-23:00

Representations may be made until 15 February 2025.`;

    const html = renderHtmlFromText(noticeText);

    // Should have multiple <p> tags
    expect(html).toContain('<p>LICENSING ACT 2003</p>');
    expect(html).toContain('<p>An application');
    expect(html.match(/<p>/g)?.length).toBeGreaterThan(3);

    // Line breaks within paragraphs should be <br />
    expect(html).toContain('<br />');
  });
});

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
      console.info(`[templates:test] rendering ${definition.id}`);
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
