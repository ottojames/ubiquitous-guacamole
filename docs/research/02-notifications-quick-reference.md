# Real-Time Notifications Quick Reference
## Implementation Checklist & Decision Guide

### Transport Layer Decision Tree

```
Need Real-Time Updates?
├─ YES: Already using Supabase?
│   ├─ YES → Use Supabase Realtime (WebSocket)
│   │    Pros: Native integration, RLS support, no extra infra
│   │    Cons: Connection-dependent
│   │
│   └─ NO → Choose:
│       ├─ WebSocket: More complex, true real-time
│       └─ SSE: Simpler, unidirectional, 95% of use cases
│
└─ NO: Use HTTP Polling
     Pros: Simple, stateless
     Cons: Higher latency, higher load
```

### Database Schema Checklist

- [x] Notification type and priority enums
- [x] `is_read` + `read_at` timestamp
- [x] `is_dismissed` flag (soft delete)
- [x] JSONB metadata for extensibility
- [x] Array of channels (in_app, email, sms, push)
- [x] Indexes on (admin_id, created_at DESC) and (admin_id, is_read)
- [x] Separate preferences table
- [x] Audit table for delivery tracking
- [x] RLS policies for security

### React Hook Implementation Phases

**Phase 1: Core Hook (useNotifications)**
```
┌─ fetchNotifications (from DB)
├─ Subscribe to real-time changes
├─ markAsRead (update + re-render)
├─ dismissNotification
└─ markAllAsRead
```

**Phase 2: Fallback Chain**
```
Try WebSocket → 
  Fail → Try SSE → 
    Fail → Fall back to 30s polling
```

**Phase 3: Optimizations**
- Debounce UI updates
- Local optimistic updates
- Batch operations

### UI Component Hierarchy

```
Header
└─ NotificationBell
    ├─ Count Badge (unreadCount > 0)
    └─ NotificationDropdown (onClick)
        ├─ Header (title + "Mark all read")
        ├─ Filters (All / Unread)
        ├─ NotificationItem (map)
        │   ├─ Priority color (critical/high/medium/low)
        │   ├─ Icon (org_approved/rejected/flagged)
        │   ├─ Title + message
        │   ├─ Time (formatDistanceToNow)
        │   ├─ Action link
        │   └─ Dismiss button
        └─ Footer ("View all")

+ Toast Layer (for confirmations)
+ Full Page (/admin/notifications)
```

### Email/SMS Channel Strategy

| Event Type | Priority | Email | SMS | Push | In-App |
|------------|----------|-------|-----|------|--------|
| org_approved | high | ✓ | ✗ | ✗ | ✓ |
| org_rejected | critical | ✓ | ✓ | ✗ | ✓ |
| notice_flagged | high | ✓ | ✗ | ✓ | ✓ |
| user_invited | medium | ✓ | ✗ | ✗ | ✓ |
| payment_received | high | ✓ | ✗ | ✗ | ✓ |
| moderation_alert | medium | ✗* | ✗ | ✗ | ✓ |

*Moderation alerts sent as daily digest

### Security Checklist

- [ ] RLS policies enforce admin_id = auth.uid()
- [ ] Rate limiting on notification endpoints
- [ ] JWT token verification for SSE streams
- [ ] Encrypt sensitive metadata in notifications
- [ ] Audit log all delivery attempts
- [ ] No PII in toast/push notifications
- [ ] Admin auth required for all notification APIs
- [ ] Soft deletes prevent data loss

### Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| Initial fetch | <500ms | First 50 notifications |
| Real-time latency | <100ms | WebSocket delivery |
| Fallback latency | <5s | SSE/polling |
| Badge update | <50ms | Local state update |
| Database query | <100ms | With indexes |
| Email delivery | <5s | Via Edge Function |

### Edge Function Pattern

```typescript
POST /functions/v1/send-notification
├─ Get admin email from DB
├─ Fetch notification details
├─ Render HTML template
├─ Call Resend API
├─ Log delivery status
└─ Return { ok: true, id: "..." }
```

### Notification Types Reference

```typescript
'org_approved'      → Organization activated by admin
'org_rejected'      → Organization rejected during review
'notice_flagged'    → Public flagged a notice for moderation
'user_invited'      → User added to organization
'payment_received'  → Payment processed for notice publication
'moderation_alert'  → Moderator attention needed
```

### Common Implementation Patterns

**1. Creating Notifications**
```
Trigger (DB) → Edge Function → Send notification + audit
```

**2. Marking as Read**
```
User clicks → Update is_read=true + read_at → Real-time sync → Badge update
```

**3. Dismissing**
```
User dismisses → Update is_dismissed=true → Remove from dropdown
```

**4. Quiet Hours**
```
Create notification → Check quiet_hours → If in quiet window: email only
```

**5. Digest Mode**
```
Create notification → If digest_frequency=daily → Queue until midnight
```

### Dependencies & Libraries

```json
{
  "@supabase/supabase-js": "^2.x",
  "date-fns": "^2.x",
  "react": "^19.x",
  "resend": "^3.x",
  "pg": "^8.x"
}
```

### File Structure

```
src/
├─ types/
│  └─ notifications.ts        (Type definitions)
├─ hooks/
│  ├─ useNotifications.ts      (Main hook)
│  └─ useNotificationsSSE.ts   (SSE fallback)
├─ lib/
│  └─ notificationService.ts   (DB queries)
├─ components/admin/
│  ├─ NotificationBell.tsx     (Header component)
│  ├─ NotificationDropdown.tsx
│  └─ NotificationItem.tsx
└─ pages/admin/
   ├─ NotificationsPage.tsx    (Full page)
   └─ SettingsNotificationsTab.tsx

server/
├─ routes/
│  └─ notifications.ts         (Express endpoints)
├─ middleware/
│  ├─ notificationAuth.ts
│  └─ notificationRateLimit.ts
└─ services/
   └─ notificationService.ts   (Business logic)

supabase/
└─ migrations/
   ├─ 20250120000001_admin_notifications.sql
   ├─ 20250120000002_notification_preferences.sql
   └─ 20250120000003_notification_triggers.sql

supabase/functions/
└─ send-notification/
   └─ index.ts
```

### Implementation Timeline (Realistic)

| Phase | Tasks | Duration | Dependencies |
|-------|-------|----------|--------------|
| 1 | DB schema, migrations, RLS | 1-2 days | Supabase access |
| 2 | Core hook (useNotifications) | 1-2 days | Types defined |
| 3 | UI components (Bell, Dropdown) | 1-2 days | Hook ready |
| 4 | Fallback chain (SSE/polling) | 1 day | Hook architecture |
| 5 | Email integration (Resend) | 1-2 days | API key, Edge Functions |
| 6 | Database triggers | 1-2 days | DB schema ready |
| 7 | Admin preferences UI | 1 day | Preferences table |
| 8 | Testing + docs | 2-3 days | All components |

**Total: 10-15 days** (1 engineer, assuming ~4h/day on this)

### Testing Checklist

- [ ] Real-time notification delivery works
- [ ] Fallback to SSE works
- [ ] Fallback to polling works
- [ ] Mark as read updates badge
- [ ] Mark all as read works
- [ ] Dismiss removes from dropdown
- [ ] Email notifications sent correctly
- [ ] RLS policies prevent cross-user access
- [ ] Rate limiting blocks abuse
- [ ] Old notifications archived
- [ ] Quiet hours respected
- [ ] Notification preferences saved
- [ ] Badge shows 99+ for 100+ notifications
- [ ] Performance meets targets (<500ms)
- [ ] Mobile responsive
- [ ] Accessibility (WCAG 2.1 AA)

### Troubleshooting Guide

**Problem: Notifications not appearing in dropdown**
1. Check WebSocket connection in browser DevTools
2. Verify RLS policy allows admin to see own notifications
3. Check Supabase realtime is enabled on table
4. Fallback to polling and check `/api/notifications` endpoint

**Problem: Real-time connection drops**
1. Verify network is stable
2. Check browser console for errors
3. Ensure SSE fallback is working
4. Increase polling frequency if on slow connection

**Problem: Emails not sending**
1. Check Edge Function logs: `supabase functions logs send-notification`
2. Verify Resend API key is set
3. Check admin email is in database
4. Test email template rendering

**Problem: High memory usage on server**
1. Check SSE client Map size
2. Implement cleanup for disconnected clients
3. Add connection timeout (30 min)
4. Monitor with: `sseClients.size`

**Problem: Notification counts out of sync**
1. Clear browser cache
2. Refetch notifications: `refetch()`
3. Check for race conditions in updates
4. Verify database constraints

