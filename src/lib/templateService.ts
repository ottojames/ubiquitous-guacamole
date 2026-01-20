/**
 * Template Service
 *
 * Handles fetching and rendering custom council templates.
 * Provides fallback to default templates when custom templates are not available.
 */

import { supabase } from '@/lib/supabase';
import type { NoticeBase } from '@/types/notice';
import { generateTokensFromNotice, renderTemplate } from '@/next/publish/templates/tokenizer';
import { renderNoticeTemplate } from '@/next/publish/templates/engine';

// Import default template renderers
import { renderLicensingText } from '@/next/publish/templates/licensing';
import { renderGamblingText } from '@/next/publish/templates/gambling';

interface CustomTemplate {
  id: string;
  name: string;
  description: string | null;
  template_text: string;
  placeholders: string[];
  required_placeholders: string[];
  is_validated: boolean;
  validation_warnings: string[];
}

/**
 * Result type for renderNoticeWithTemplateInfo
 * Contains both the rendered text and metadata about the template used
 */
export interface TemplateRenderResult {
  text: string;
  isCustomTemplate: boolean;
  templateName?: string;
  templateId?: string;
}

/**
 * Fetch the active custom template for a department and notice type
 *
 * @param departmentId - UUID of the department
 * @param noticeTypeId - Notice type identifier (e.g., 'licensing-premises-new')
 * @returns Custom template or null if none found
 */
export async function getTemplateForDepartment(
  departmentId: string,
  noticeTypeId: string
): Promise<CustomTemplate | null> {
  try {
    console.log('[Template Service] Querying templates for:', { departmentId, noticeTypeId });

    // Query templates table directly instead of using RPC
    const { data, error } = await supabase
      .from('templates')
      .select('id, name, description, template_text')
      .eq('department_id', departmentId)
      .eq('notice_type', noticeTypeId)
      .not('template_text', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      // PGRST116 = no rows found, which is not an error
      if (error.code === 'PGRST116') {
        console.log('[Template Service] No template found for:', { departmentId, noticeTypeId });
        return null;
      }
      console.error('Error fetching custom template:', error);
      return null;
    }

    if (data && data.template_text) {
      // Extract placeholders from template_text
      const placeholderMatches = data.template_text.match(/\{\{([A-Z_]+)\}\}/g) || [];
      const placeholders = [...new Set(placeholderMatches.map((m: string) => m.replace(/\{\{|\}\}/g, '')))];

      console.log('[Template Service] Found template:', data.name, 'with placeholders:', placeholders);

      return {
        id: data.id,
        name: data.name,
        description: data.description,
        template_text: data.template_text,
        placeholders,
        required_placeholders: [], // Not tracking required vs optional for now
        is_validated: true,
        validation_warnings: [],
      };
    }

    return null;
  } catch (err) {
    console.error('Failed to fetch custom template:', err);
    return null;
  }
}

/**
 * Render a notice using custom template if available, otherwise fallback to default
 *
 * @param notice - Notice data to render
 * @param departmentId - Optional department ID for custom template lookup
 * @param noticeTypeId - Notice type ID (e.g. 'licensing-premises-new') for template lookup
 * @returns Rendered notice text
 */
export async function renderNoticeWithTemplate(
  notice: NoticeBase,
  departmentId?: string,
  noticeTypeId?: string
): Promise<string> {
  const result = await renderNoticeWithTemplateInfo(notice, departmentId, noticeTypeId);
  return result.text;
}

/**
 * Render a notice using custom template if available, otherwise fallback to default
 * Returns both the rendered text and metadata about the template used
 *
 * @param notice - Notice data to render
 * @param departmentId - Optional department ID for custom template lookup
 * @param noticeTypeId - Notice type ID (e.g. 'licensing-premises-new') for template lookup
 * @returns Rendered notice text with template metadata
 */
export async function renderNoticeWithTemplateInfo(
  notice: NoticeBase,
  departmentId?: string,
  noticeTypeId?: string
): Promise<TemplateRenderResult> {
  // Try to fetch custom template if department ID provided
  if (departmentId && noticeTypeId) {
    try {
      console.log('[Template Service] Looking up template for:', { departmentId, noticeTypeId });

      const customTemplate = await getTemplateForDepartment(
        departmentId,
        noticeTypeId
      );

      if (customTemplate && customTemplate.template_text) {
        console.log('[Template Service] ✅ Using custom template:', customTemplate.name);

        // Generate tokens from notice data
        const tokens = generateTokensFromNotice(notice);

        // Render using custom template
        const rendered = renderTemplate(customTemplate.template_text, tokens);

        return {
          text: rendered,
          isCustomTemplate: true,
          templateName: customTemplate.name,
          templateId: customTemplate.id,
        };
      } else {
        console.log('[Template Service] ❌ No custom template found for:', noticeTypeId);
      }
    } catch (err) {
      console.error('[Template Service] Error rendering custom template, falling back to default:', err);
      // Fall through to default rendering
    }
  }

  // Fallback to default template rendering
  console.log('[Template Service] Using default template for:', notice.noticeType);
  return {
    text: renderDefaultTemplate(notice),
    isCustomTemplate: false,
  };
}

/**
 * Render notice using the default built-in templates
 *
 * This is the fallback when no custom template is available.
 *
 * @param notice - Notice data
 * @returns Rendered text using default template
 */
function renderDefaultTemplate(notice: NoticeBase): string {
  // Map notice type to appropriate default renderer
  const noticeType = notice.noticeType;

  try {
    // Licensing notices
    if (noticeType.startsWith('licensing-')) {
      return renderLicensingText(notice);
    }

    // Gambling notices
    if (noticeType === 'gambling') {
      return renderGamblingText(notice);
    }

    // TODO: Add other notice type renderers as needed
    // - GVOL
    // - TRO
    // - Planning
    // - Probate

    // Generic fallback - extract what we can
    return renderGenericNotice(notice);
  } catch (err) {
    console.error('[Template Service] Error rendering default template:', err);
    return renderGenericNotice(notice);
  }
}

/**
 * Generic fallback renderer when no specific template is available
 */
function renderGenericNotice(notice: NoticeBase): string {
  const tokens = generateTokensFromNotice(notice);

  const genericTemplate = `NOTICE

{{APPLICANT_NAME}} has submitted a {{NOTICE_TYPE}} application{{#if PREMISES_NAME}} for {{PREMISES_NAME}}{{/if}}{{#if PREMISES_ADDRESS}} at {{PREMISES_ADDRESS}}{{/if}}.

Application date: {{APPLICATION_DATE}}
Deadline for representations: {{DEADLINE_DATE}}

{{#if REPRESENTATION_ADDRESS}}Representations should be sent to: {{REPRESENTATION_ADDRESS}}{{/if}}

{{#if AUTHORITY_NAME}}Authority: {{AUTHORITY_NAME}}{{/if}}`;

  return renderNoticeTemplate(genericTemplate, tokens);
}

/**
 * Preview a custom template with sample data
 *
 * Useful for testing templates before saving them.
 *
 * @param templateText - Template text to preview
 * @param noticeType - Notice type for generating sample tokens
 * @returns Rendered preview text
 */
export function previewTemplate(
  templateText: string,
  noticeType: string
): string {
  // Generate sample tokens for the notice type
  const sampleTokens = generateSampleTokens(noticeType);

  // Render template with sample data
  return renderTemplate(templateText, sampleTokens);
}

/**
 * Generate sample tokens for template preview
 */
function generateSampleTokens(noticeType: string): Record<string, string> {
  const baseTokens = {
    APPLICANT_NAME: 'John Smith',
    APPLICANT_ADDRESS: '123 High Street, Bristol, BS1 2AB',
    APPLICANT_CONTACT: 'Email: john.smith@example.com, Tel: 0117 123 4567',
    AUTHORITY_NAME: 'Bristol City Council',
    APPLICATION_DATE: '17 November 2025',
    DEADLINE_DATE: '15 December 2025',
    REPRESENTATION_ADDRESS: 'Licensing Team, Bristol City Council, PO Box 3399, Bristol, BS1 9NE',
    REPRESENTATION_EMAIL: 'licensing@bristol.gov.uk',
    PUBLICATION_DATE: '17 November 2025',
  };

  if (noticeType.startsWith('licensing-')) {
    return {
      ...baseTokens,
      PREMISES_NAME: 'The Red Lion',
      PREMISES_ADDRESS: '45 Market Street, Bristol, BS1 1HQ',
      PREMISES_POSTCODE: 'BS1 1HQ',
      LICENSABLE_ACTIVITIES: 'Sale of alcohol for consumption on and off premises, Live music, Late night refreshment',
      ACTIVITY_SCHEDULE: 'Monday-Sunday: 10:00-23:00 (Alcohol), Friday-Saturday: 20:00-01:00 (Live Music)',
      OPERATING_HOURS: 'Monday-Sunday: 09:00-23:30',
      DPS_NAME: 'Sarah Johnson',
      INSPECTION_LOCATION: 'Bristol City Council, Licensing Office, 100 Temple Street, Bristol, BS1 6AG',
      INSPECTION_HOURS: 'Monday-Friday: 9:00 AM - 5:00 PM',
      ...(noticeType === 'licensing-premises-variation' && {
        NATURE_OF_VARIATION: 'Extension of hours for sale of alcohol on Fridays and Saturdays until 01:00',
        CURRENT_LICENCE_NUMBER: 'PREM/2020/00123',
      }),
      ...(noticeType === 'licensing-premises-review' && {
        REVIEW_APPLICANT_NAME: 'Avon and Somerset Police',
        REVIEW_APPLICANT_TYPE: 'Responsible Authority (Police)',
        REVIEW_GROUNDS: 'Prevention of crime and disorder, Public safety',
        REVIEW_DETAILS: 'Multiple incidents of anti-social behaviour and noise complaints from residents',
        CURRENT_LICENCE_HOLDER: 'ABC Hospitality Ltd',
      }),
    };
  }

  return baseTokens;
}

/**
 * Validate that a notice has all required data for rendering with a template
 *
 * @param notice - Notice to validate
 * @param templateText - Template text with placeholders
 * @returns Validation result with missing tokens
 */
export function validateNoticeForTemplate(
  notice: NoticeBase,
  templateText: string
): { isValid: boolean; missingTokens: string[] } {
  const tokens = generateTokensFromNotice(notice);
  const missingTokens: string[] = [];

  // Extract required tokens from template
  const requiredTokensMatches = templateText.match(/\{\{([A-Z_]+)\}\}/g);
  if (!requiredTokensMatches) {
    return { isValid: true, missingTokens: [] };
  }

  const requiredTokens = requiredTokensMatches.map(match =>
    match.replace(/\{\{|\}\}/g, '')
  );

  // Check each required token (use Array.from for Set compatibility)
  const uniqueTokens = Array.from(new Set(requiredTokens));
  for (const token of uniqueTokens) {
    if (!tokens[token] || tokens[token].trim() === '') {
      missingTokens.push(token);
    }
  }

  return {
    isValid: missingTokens.length === 0,
    missingTokens,
  };
}
