# CivicNotices - Product Requirements Document

**Branch:** demo-site-22112025
**Purpose:** Track implementation of enterprise-grade features for $500M valuation target

---

## 🎯 Project Vision

**Enterprise Goal:** Build a $500 Million valuation platform (5-year target)
**Code Standard:** Enterprise-grade, security-first, institutional quality
**Compliance:** SOC 2 Type II ready, GDPR compliant, ISO 27001 aligned

---

## 📊 Current System Status

**Document Version:** 6.0
**Last Updated:** January 19, 2026 @ 19:00
**Status:** ✅ CORE FUNCTIONAL | ⚠️ ENTERPRISE FEATURES PENDING

### What's Working ✅
- **Registration:** Councils and firms can register successfully
- **Authentication:** Sessions persist correctly
- **Department Switching:** No recursion errors
- **Database Schema:** Stable (columns fixed)
- **Notice Submission:** Working from firm portal
- **Public Search:** Working with distance filter
- **Demo Accounts:** Westminster accounts functional

### What's Pending 🔴
- **Admin Panel:** NOT IMPLEMENTED - Critical for managing live accounts
- **Enterprise Security:** Partial - Needs hardening for institutional clients
- **Comprehensive Audit Trail:** Basic - Needs enterprise-grade logging
- **Advanced Monitoring:** Basic - Needs enterprise observability

---

## 🏢 ENTERPRISE ADMIN PANEL - CRITICAL PRIORITY

### ADMIN-001: Master Admin Control Panel

**Status:** 🔴 NOT IMPLEMENTED - CRITICAL FOR LIVE TESTING
**Business Impact:** Cannot manage real council accounts or test live notices

**Core Requirements:**

#### 1. Super Admin Dashboard (/admin)
```
Access Level: RESTRICTED - Super Admins Only
Authentication: Multi-factor required
Audit: Every action logged with timestamp, user, and IP
```

**Features:**
- **Real-time System Overview**
  - Active councils: count, names, subscription status
  - Active firms: count, types, activity levels
  - Total notices: published, pending, expired
  - System health: API status, database connections, error rates
  - Revenue metrics: MRR, ARR, churn rate

- **Account Management Grid**
  - Searchable/filterable list of ALL accounts
  - Columns: Organization, Type, Status, Created, Last Active, Subscription, Actions
  - Bulk actions: Export, Suspend Multiple, Send Communications
  - Quick actions per row: View, Edit, Suspend, Delete, Impersonate

#### 2. Organization Management

**Council/Firm Account Controls:**
```typescript
interface OrganizationControls {
  // View Operations
  viewFullProfile(): OrganizationProfile;
  viewActivityLog(): ActivityLog[];
  viewBillingHistory(): Invoice[];
  viewNoticeHistory(): Notice[];

  // Modify Operations (with audit trail)
  suspendAccount(reason: string): void;
  reactivateAccount(): void;
  updateSubscription(tier: SubscriptionTier): void;
  resetPassword(userId: string): void;

  // Dangerous Operations (require 2FA + confirmation)
  deleteAccount(confirmation: string): void;
  purgeData(dataType: DataType[]): void;
  transferOwnership(newOwnerId: string): void;
}
```

**Security Requirements:**
- All destructive operations require typed confirmation
- Automatic backup before any deletion
- 30-day soft delete with recovery option
- Audit log cannot be modified or deleted
- Rate limiting on all admin endpoints

#### 3. Notice Management & Testing

**Live Notice Testing Dashboard:**
- Test notice submission as any council
- Validate notice processing pipeline
- Check geocoding accuracy
- Verify publication to correct channels
- Test representation submission flow
- Monitor email delivery

**Notice Controls:**
```typescript
interface NoticeAdminControls {
  // Inspection
  viewNoticeDetails(noticeId: string): NoticeDetails;
  viewRepresentations(noticeId: string): Representation[];
  validateCompliance(noticeId: string): ComplianceReport;

  // Modifications (logged)
  extendDeadline(noticeId: string, days: number): void;
  correctErrors(noticeId: string, corrections: Partial<Notice>): void;
  flagForReview(noticeId: string, reason: string): void;

  // Testing
  createTestNotice(council: string, type: NoticeType): TestNotice;
  simulateSubmission(notice: TestNotice): SimulationResult;
  verifyPublication(noticeId: string): PublicationStatus;
}
```

#### 4. Security & Compliance

**Enterprise Security Features:**
- **Session Management:** View/terminate active sessions per account
- **IP Allowlisting:** Restrict admin access to specific IPs
- **Audit Trail:** Immutable log of all admin actions
- **Data Encryption:** All sensitive data encrypted at rest
- **Access Control:** Granular permissions system
- **Compliance Reports:** GDPR data requests, right to be forgotten

**Implementation Standards:**
```typescript
// Every admin action must follow this pattern
async function executeAdminAction<T>(
  action: AdminAction<T>,
  context: AdminContext
): Promise<ActionResult<T>> {
  // 1. Verify permissions
  await verifyAdminPermissions(context.user, action.requiredRole);

  // 2. Validate 2FA if required
  if (action.requires2FA) {
    await validate2FA(context.user, context.token);
  }

  // 3. Create audit entry (before action)
  const auditId = await createAuditEntry({
    user: context.user,
    action: action.type,
    target: action.target,
    timestamp: new Date(),
    ip: context.ip,
    userAgent: context.userAgent,
    status: 'pending'
  });

  // 4. Execute with monitoring
  const result = await monitorExecution(async () => {
    return await action.execute();
  });

  // 5. Update audit with result
  await updateAuditEntry(auditId, {
    status: result.success ? 'completed' : 'failed',
    result: result.data,
    error: result.error
  });

  // 6. Send alerts if needed
  if (action.alertOnComplete) {
    await sendAdminAlert(action, result);
  }

  return result;
}
```

#### 5. Monitoring & Alerting

**Real-time Monitoring Requirements:**
- Failed login attempts (alert after 3 failures)
- Suspicious activity patterns
- High error rates (>1% of requests)
- Database connection issues
- Payment processing failures
- Unusual data access patterns

**Alert Channels:**
- Email to admin team
- Slack/Teams integration
- SMS for critical issues
- Dashboard notifications
- Automated incident creation

#### 6. Database Schema for Admin Features

```sql
-- Admin users table (separate from regular users for security)
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT CHECK (role IN ('super_admin', 'admin', 'support', 'viewer')),
  two_factor_secret TEXT,
  two_factor_enabled BOOLEAN DEFAULT false,
  ip_whitelist TEXT[],
  last_login_at TIMESTAMPTZ,
  last_login_ip INET,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comprehensive audit log
CREATE TABLE admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES admin_users(id),
  action_type TEXT NOT NULL,
  action_details JSONB NOT NULL,
  target_type TEXT,
  target_id UUID,
  ip_address INET NOT NULL,
  user_agent TEXT,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Account suspension tracking
CREATE TABLE account_suspensions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  suspended_by UUID REFERENCES admin_users(id),
  suspension_reason TEXT NOT NULL,
  suspension_type TEXT CHECK (suspension_type IN ('temporary', 'permanent', 'pending_review')),
  suspended_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  lifted_at TIMESTAMPTZ,
  lifted_by UUID REFERENCES admin_users(id),
  notes TEXT
);

-- Indexes for performance
CREATE INDEX idx_audit_log_admin_user ON admin_audit_log(admin_user_id);
CREATE INDEX idx_audit_log_created_at ON admin_audit_log(created_at DESC);
CREATE INDEX idx_audit_log_target ON admin_audit_log(target_type, target_id);
CREATE INDEX idx_suspensions_org ON account_suspensions(organization_id);
CREATE INDEX idx_suspensions_active ON account_suspensions(lifted_at) WHERE lifted_at IS NULL;
```

#### 7. Implementation Timeline

**Phase 1 (Week 1) - Core Infrastructure:**
- [ ] Admin authentication system with 2FA
- [ ] Basic admin dashboard with organization list
- [ ] View-only access to accounts
- [ ] Audit logging foundation

**Phase 2 (Week 2) - Account Management:**
- [ ] Suspend/reactivate accounts
- [ ] Edit organization details
- [ ] View activity logs
- [ ] Basic search and filtering

**Phase 3 (Week 3) - Testing & Monitoring:**
- [ ] Notice testing interface
- [ ] System health monitoring
- [ ] Alert configuration
- [ ] Performance metrics

**Phase 4 (Week 4) - Security & Polish:**
- [ ] IP whitelisting
- [ ] Advanced audit reports
- [ ] Compliance tools
- [ ] Role-based permissions

---

## 📋 Other Pending Enhancements

### ENHANCE-002: Advanced Search & Filtering
- [ ] Multi-parameter search (postcode + notice type + date range)
- [ ] Saved searches for registered users
- [ ] Search history
- [ ] Advanced filters (council, status, deadline)

### ENHANCE-003: Analytics Dashboard
- [ ] Council-specific analytics
- [ ] Notice performance metrics
- [ ] Representation analytics
- [ ] Revenue tracking

### ENHANCE-004: API Documentation
- [ ] OpenAPI/Swagger documentation
- [ ] API key management
- [ ] Rate limiting per key
- [ ] Usage analytics

---

## 🔒 Security Requirements

### Critical Security Features Needed:
- [ ] Two-factor authentication for all admin users
- [ ] IP allowlisting for admin panel
- [ ] Comprehensive audit logging
- [ ] Data encryption at rest
- [ ] Regular security audits
- [ ] GDPR compliance tools
- [ ] Automated backup system
- [ ] Disaster recovery plan

### Security Checklist:
- [ ] All endpoints require authentication
- [ ] Rate limiting implemented (10 req/sec)
- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] CSRF tokens on all forms
- [ ] Encrypted passwords (bcrypt/argon2)
- [ ] Secure session management
- [ ] Input validation on all fields
- [ ] Output encoding
- [ ] Secure headers (HSTS, CSP, etc.)

---

## 📈 Success Metrics

### Admin Panel Success Criteria:
- Admin can manage 1000+ accounts without performance degradation
- All admin actions logged within 100ms
- Zero unauthorized access incidents
- 99.9% uptime for admin panel
- <2 second load time for any admin view

### Platform Success Metrics:
- 500+ councils onboarded within 2 years
- 99.99% uptime SLA
- <500ms average API response time
- 100% statutory compliance
- Zero data breaches

---

## 🚀 Next Steps (Priority Order)

1. **IMMEDIATE (This Week):**
   - [ ] Start Phase 1 of Admin Panel implementation
   - [ ] Set up admin authentication with 2FA
   - [ ] Create basic dashboard layout

2. **WEEK 2:**
   - [ ] Implement account management features
   - [ ] Add suspend/delete functionality
   - [ ] Create audit logging system

3. **WEEK 3:**
   - [ ] Build notice testing interface
   - [ ] Add system monitoring
   - [ ] Configure alerts

4. **WEEK 4:**
   - [ ] Implement enterprise security features
   - [ ] Add compliance tools
   - [ ] Final testing and polish

5. **ONGOING:**
   - [ ] Test with real councils
   - [ ] Monitor system health
   - [ ] Iterate based on feedback
   - [ ] Scale infrastructure as needed

---

## 📚 Related Documents

- **Completed Items:** See PRD_COMPLETED.md for all finished work
- **Ralph Automation:** See docs/RALPH-CICD.md for database fix automation
- **Production Guide:** See docs/PRODUCTION-DEPLOYMENT.md for deployment
- **Monitoring Setup:** See monitoring/setup-monitoring.sh for configuration

---

**For questions or updates, contact the development team**