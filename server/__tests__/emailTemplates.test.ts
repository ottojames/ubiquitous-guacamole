/**
 * Email Template Rendering Tests
 *
 * These tests verify that all email template functions can render
 * without errors when provided with valid sample data.
 *
 * Note: We don't actually send emails in tests - we just verify
 * the template rendering logic works correctly.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Resend to prevent actual email sending
vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: {
      send: vi.fn().mockResolvedValue({ id: 'mock-email-id' }),
    },
  })),
}));

// Set up environment variables before importing email module
process.env.RESEND_API_KEY = 'test-api-key';
process.env.VITE_APP_URL = 'http://localhost:5173';

import {
  sendTeamInvitation,
  sendCouncilDepartmentInvitation,
  sendNoticeConfirmation,
  sendRepresentationConfirmation,
  sendRepresentationNotificationToCouncil,
  sendDeadlineReminder,
  sendDailySummary,
  sendSubscriptionVerification,
  sendAlertEmail,
} from '../services/email';

describe('Email Template Rendering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('sendTeamInvitation', () => {
    it('renders team invitation email for admin role', async () => {
      const result = await sendTeamInvitation('test@example.com', {
        firmName: 'Smith & Associates',
        inviterName: 'John Smith',
        inviterEmail: 'john@smithlaw.com',
        role: 'admin',
        loginUrl: 'http://localhost:5173/auth/sign-in',
      });
      expect(result.success).toBe(true);
    });

    it('renders team invitation email for member role', async () => {
      const result = await sendTeamInvitation('test@example.com', {
        firmName: 'Smith & Associates',
        inviterName: 'John Smith',
        inviterEmail: 'john@smithlaw.com',
        role: 'member',
        loginUrl: 'http://localhost:5173/auth/sign-in',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('sendCouncilDepartmentInvitation', () => {
    it('renders council invitation for department_admin', async () => {
      const result = await sendCouncilDepartmentInvitation('staff@council.gov.uk', {
        councilName: 'Westminster City Council',
        departmentName: 'Licensing Department',
        inviterEmail: 'admin@council.gov.uk',
        role: 'department_admin',
        invitationToken: 'test-token-123',
        acceptUrl: 'http://localhost:5173/auth/accept-invitation?token=test-token-123',
      });
      expect(result.success).toBe(true);
    });

    it('renders council invitation for editor', async () => {
      const result = await sendCouncilDepartmentInvitation('staff@council.gov.uk', {
        councilName: 'Westminster City Council',
        departmentName: 'Licensing Department',
        inviterEmail: 'admin@council.gov.uk',
        role: 'editor',
        invitationToken: 'test-token-456',
        acceptUrl: 'http://localhost:5173/auth/accept-invitation?token=test-token-456',
      });
      expect(result.success).toBe(true);
    });

    it('renders council invitation for viewer', async () => {
      const result = await sendCouncilDepartmentInvitation('staff@council.gov.uk', {
        councilName: 'Westminster City Council',
        departmentName: 'Licensing Department',
        inviterEmail: 'admin@council.gov.uk',
        role: 'viewer',
        invitationToken: 'test-token-789',
        acceptUrl: 'http://localhost:5173/auth/accept-invitation?token=test-token-789',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('sendNoticeConfirmation', () => {
    it('renders notice confirmation with all fields', async () => {
      const result = await sendNoticeConfirmation('publisher@example.com', {
        noticeId: '550e8400-e29b-41d4-a716-446655440000',
        noticeType: 'Premises Licence - New Application',
        premisesName: 'The Red Lion',
        premisesAddress: '123 High Street, London, SW1A 1AA',
        applicantName: 'John Smith',
        noticeText: 'Notice of application for premises licence...',
        viewUrl: 'http://localhost:5173/notices/550e8400-e29b-41d4-a716-446655440000',
        trackingUrl: 'http://localhost:5173/track?token=abc123',
      });
      expect(result.success).toBe(true);
    });

    it('renders notice confirmation without optional fields', async () => {
      const result = await sendNoticeConfirmation('publisher@example.com', {
        noticeId: '550e8400-e29b-41d4-a716-446655440001',
        noticeType: 'Planning Application',
        noticeText: 'Notice of planning application...',
        viewUrl: 'http://localhost:5173/notices/550e8400-e29b-41d4-a716-446655440001',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('sendRepresentationConfirmation', () => {
    it('renders support representation confirmation', async () => {
      const result = await sendRepresentationConfirmation({
        representationId: 'REP-2026-001',
        noticeType: 'Premises Licence Application',
        premisesName: 'The Kings Arms',
        premisesAddress: '45 Church Road, Manchester, M1 2AB',
        stance: 'support',
        submitterName: 'Jane Doe',
        submitterEmail: 'jane@example.com',
        deadline: 'Friday, 31 January 2026',
        noticeUrl: 'http://localhost:5173/notices/123',
      });
      expect(result.success).toBe(true);
    });

    it('renders objection representation confirmation', async () => {
      const result = await sendRepresentationConfirmation({
        representationId: 'REP-2026-002',
        noticeType: 'Premises Licence Application',
        premisesName: 'Late Night Club',
        stance: 'object',
        submitterName: 'John Resident',
        submitterEmail: 'john@example.com',
        noticeUrl: 'http://localhost:5173/notices/456',
      });
      expect(result.success).toBe(true);
    });

    it('renders comment representation confirmation', async () => {
      const result = await sendRepresentationConfirmation({
        representationId: 'REP-2026-003',
        noticeType: 'Traffic Order',
        stance: 'comment',
        submitterName: 'Community Member',
        submitterEmail: 'member@example.com',
        noticeUrl: 'http://localhost:5173/notices/789',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('sendRepresentationNotificationToCouncil', () => {
    it('renders support notification to council', async () => {
      const result = await sendRepresentationNotificationToCouncil('licensing@council.gov.uk', {
        representationId: 'REP-2026-001',
        noticeId: '550e8400-e29b-41d4-a716-446655440000',
        noticeType: 'Premises Licence Application',
        premisesName: 'The Golden Lion',
        premisesAddress: '100 Main Street, London, EC1A 1BB',
        stance: 'support',
        submitterName: 'Local Supporter',
        contentPreview: 'I am writing to express my support for this application. The establishment has always been well-run...',
        noticeUrl: 'http://localhost:5173/notices/550e8400-e29b-41d4-a716-446655440000',
        dashboardUrl: 'http://localhost:5173/c/westminster/licensing/notices/550e8400-e29b-41d4-a716-446655440000/representations',
        councilName: 'Westminster City Council',
      });
      expect(result.success).toBe(true);
    });

    it('renders objection notification to council', async () => {
      const result = await sendRepresentationNotificationToCouncil('licensing@council.gov.uk', {
        representationId: 'REP-2026-002',
        noticeId: '550e8400-e29b-41d4-a716-446655440001',
        noticeType: 'Late Night Venue Application',
        premisesName: 'Night Owl Club',
        stance: 'objection',
        submitterName: 'Concerned Neighbour',
        contentPreview: 'I strongly object to this application due to noise concerns and antisocial behaviour...',
        noticeUrl: 'http://localhost:5173/notices/550e8400-e29b-41d4-a716-446655440001',
        dashboardUrl: 'http://localhost:5173/c/camden/licensing/notices/550e8400-e29b-41d4-a716-446655440001/representations',
        councilName: 'Camden Council',
      });
      expect(result.success).toBe(true);
    });

    it('renders comment notification to council', async () => {
      const result = await sendRepresentationNotificationToCouncil('planning@council.gov.uk', {
        representationId: 'REP-2026-003',
        noticeId: '550e8400-e29b-41d4-a716-446655440002',
        noticeType: 'Planning Application',
        stance: 'comment',
        submitterName: 'Planning Enthusiast',
        contentPreview: 'I have some questions about the proposed development...',
        noticeUrl: 'http://localhost:5173/notices/550e8400-e29b-41d4-a716-446655440002',
        dashboardUrl: 'http://localhost:5173/c/islington/planning/notices/550e8400-e29b-41d4-a716-446655440002/representations',
        councilName: 'Islington Council',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('sendDeadlineReminder', () => {
    it('renders urgent deadline reminder (24h)', async () => {
      const result = await sendDeadlineReminder({
        noticeId: '550e8400-e29b-41d4-a716-446655440000',
        noticeType: 'Premises Licence Application',
        premisesName: 'The Blue Bar',
        premisesAddress: '50 West End Lane, London, NW6 1SH',
        deadline: 'Tuesday, 21 January 2026 at 5:00 PM',
        hoursRemaining: 24,
        noticeUrl: 'http://localhost:5173/notices/550e8400-e29b-41d4-a716-446655440000',
        recipientEmail: 'interested@example.com',
      });
      expect(result.success).toBe(true);
    });

    it('renders standard deadline reminder (48h)', async () => {
      const result = await sendDeadlineReminder({
        noticeId: '550e8400-e29b-41d4-a716-446655440001',
        noticeType: 'Traffic Order',
        deadline: 'Wednesday, 22 January 2026 at 5:00 PM',
        hoursRemaining: 48,
        noticeUrl: 'http://localhost:5173/notices/550e8400-e29b-41d4-a716-446655440001',
        recipientEmail: 'subscriber@example.com',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('sendDailySummary', () => {
    it('renders daily summary with representations', async () => {
      const result = await sendDailySummary('licensing@council.gov.uk', {
        councilName: 'Westminster City Council',
        date: 'Monday, 20 January 2026',
        newRepresentations: [
          {
            noticeId: '550e8400-e29b-41d4-a716-446655440000',
            noticeType: 'Premises Licence Application',
            premisesName: 'The Red Lion',
            representationCount: 5,
            supportCount: 2,
            objectCount: 2,
            commentCount: 1,
            unreadCount: 3,
            noticeUrl: 'http://localhost:5173/c/westminster/licensing/notices/550e8400-e29b-41d4-a716-446655440000/representations',
          },
          {
            noticeId: '550e8400-e29b-41d4-a716-446655440001',
            noticeType: 'Club Premises Certificate',
            premisesName: 'The Social Club',
            representationCount: 2,
            supportCount: 1,
            objectCount: 0,
            commentCount: 1,
            unreadCount: 2,
            noticeUrl: 'http://localhost:5173/c/westminster/licensing/notices/550e8400-e29b-41d4-a716-446655440001/representations',
          },
        ],
        totalNew: 7,
      });
      expect(result.success).toBe(true);
    });

    it('renders daily summary with no representations', async () => {
      const result = await sendDailySummary('licensing@council.gov.uk', {
        councilName: 'Camden Council',
        date: 'Monday, 20 January 2026',
        newRepresentations: [],
        totalNew: 0,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('sendSubscriptionVerification', () => {
    it('renders subscription verification email', async () => {
      const result = await sendSubscriptionVerification('subscriber@example.com', {
        verificationToken: 'verify-token-abc123',
        postcode: 'SW1A 1AA',
        radius: 5,
      });
      expect(result.success).toBe(true);
    });

    it('renders subscription verification with large radius', async () => {
      const result = await sendSubscriptionVerification('subscriber@example.com', {
        verificationToken: 'verify-token-def456',
        postcode: 'M1 1AD',
        radius: 20,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('sendAlertEmail', () => {
    it('renders alert email with single notice', async () => {
      const result = await sendAlertEmail('subscriber@example.com', {
        notices: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            noticeType: 'Premises Licence Application',
            premisesName: 'The Corner Shop',
            premisesAddress: '1 High Street, London, SW1A 1AA',
            distance: 0.5,
            viewUrl: 'http://localhost:5173/notices/550e8400-e29b-41d4-a716-446655440000',
          },
        ],
        postcode: 'SW1A 1AA',
        radius: 5,
        unsubscribeToken: 'unsub-token-123',
      });
      expect(result.success).toBe(true);
    });

    it('renders alert email with multiple notices', async () => {
      const result = await sendAlertEmail('subscriber@example.com', {
        notices: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            noticeType: 'Premises Licence Application',
            premisesName: 'The Red Lion',
            premisesAddress: '100 Main St, London, SW1A 1AA',
            distance: 0.3,
            viewUrl: 'http://localhost:5173/notices/550e8400-e29b-41d4-a716-446655440000',
          },
          {
            id: '550e8400-e29b-41d4-a716-446655440001',
            noticeType: 'Traffic Order',
            distance: 1.2,
            viewUrl: 'http://localhost:5173/notices/550e8400-e29b-41d4-a716-446655440001',
          },
          {
            id: '550e8400-e29b-41d4-a716-446655440002',
            noticeType: 'Planning Application',
            premisesName: 'New Development Site',
            distance: 2.8,
            viewUrl: 'http://localhost:5173/notices/550e8400-e29b-41d4-a716-446655440002',
          },
        ],
        postcode: 'SW1A 1AA',
        radius: 5,
        unsubscribeToken: 'unsub-token-456',
      });
      expect(result.success).toBe(true);
    });
  });
});
