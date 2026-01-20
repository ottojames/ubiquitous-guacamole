# Admin Panel Guide - Civic Notices

Version 1.0 | January 2026

## Table of Contents
1. [Getting Started](#1-getting-started)
2. [Authentication & 2FA](#2-authentication--2fa)
3. [Managing Accounts](#3-managing-accounts)
4. [Monitoring System](#4-monitoring-system)
5. [Security Best Practices](#5-security-best-practices)
6. [Troubleshooting](#6-troubleshooting)

---

## 1. Getting Started

### Overview
The Civic Notices Admin Panel provides centralized control over the entire platform, including account management, notice moderation, system monitoring, and audit trail review. Access is restricted to authorized administrators only.

### Access Requirements
- **URL:** https://civicnotices.co.uk/admin
- **Credentials:** Provided by system administrator
- **Browser:** Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Network:** IP allowlist may apply - contact IT if access denied

### First Login Process
1. Navigate to `/admin/login`
2. Enter your email and password
3. If 2FA is enabled, enter the 6-digit code from your authenticator app
4. You'll be redirected to the Admin Dashboard

### User Roles
- **Super Admin:** Full system access, can manage other admins
- **Admin:** Standard administrative access, cannot modify admin accounts
- **Support:** Limited access for customer support tasks

### Session Management
- Sessions expire after **2 hours** of activity
- Warning appears when **10 minutes** remain
- Session automatically extends with activity
- Logout immediately when finished for security

---

## 2. Authentication & 2FA

### Setting Up Two-Factor Authentication

#### Initial Setup
1. Login to admin panel
2. Navigate to **Settings > Security**
3. Click **"Enable 2FA"**
4. Scan the QR code with your authenticator app:
   - Google Authenticator (recommended)
   - Microsoft Authenticator
   - Authy
   - 1Password
5. Enter the 6-digit verification code
6. **IMPORTANT:** Save the backup codes in a secure location
7. Click **"Confirm Setup"**

#### Backup Codes
- 10 backup codes are generated during setup
- Each code can only be used once
- Store in a password manager or secure location
- To generate new codes: Settings > Security > Regenerate Backup Codes

#### Using 2FA
1. Enter email and password on login
2. When prompted, enter the 6-digit code from your authenticator
3. Check "Remember this device for 30 days" on trusted computers
4. If you lose your device, use a backup code instead

#### Disabling 2FA
1. Navigate to Settings > Security
2. Click "Disable 2FA"
3. Enter your current 2FA code
4. Confirm the action

**Warning:** Disabling 2FA reduces account security. Only disable if absolutely necessary.

### Password Management

#### Password Requirements
- Minimum 12 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character
- Cannot match previous 5 passwords

#### Changing Your Password
1. Go to Settings > Account
2. Enter current password
3. Enter new password twice
4. Click "Update Password"

#### Forgotten Password
1. Click "Forgot Password?" on login page
2. Enter your email address
3. Check email for reset link (expires in 1 hour)
4. Create new password following requirements

### Failed Login Protection
- Account locks after **5 failed attempts**
- Lockout duration: **30 minutes**
- Contact super admin if urgently needed
- Failed attempts are logged for security audit

---

## 3. Managing Accounts

### Council Accounts

#### Viewing Council Accounts
1. Navigate to **Accounts > Councils**
2. Use filters to narrow results:
   - Status: Active, Suspended, Deleted
   - Search by name or email
   - Sort by created date or last activity

#### Council Account Actions
- **View Details:** Click account name for full information
- **Edit:** Modify contact details, departments
- **Suspend:** Temporarily disable access (reversible)
- **Activate:** Restore suspended account
- **Delete:** Soft delete (data preserved for audit)

#### Adding Departments
1. Select council account
2. Click "Manage Departments"
3. Click "Add Department"
4. Enter:
   - Department name (e.g., "Licensing", "Planning")
   - Contact email
   - Phone number
5. Assign department users

### Law Firm Accounts

#### Managing Firm Accounts
1. Navigate to **Accounts > Firms**
2. Available actions:
   - View client list
   - Check notice submission history
   - Review billing status
   - Manage practice areas

#### Practice Area Configuration
1. Select firm account
2. Click "Practice Areas"
3. Enable/disable:
   - Licensing
   - Planning
   - Environmental
   - Highways
   - Other notice types

### User Management

#### Viewing Users
1. Navigate to **Accounts > Users**
2. Filter by organization
3. Search by name or email
4. View user activity and permissions

#### User Actions
- **Reset Password:** Send password reset email
- **Unlock Account:** Clear failed login attempts
- **Change Role:** Modify user permissions
- **Suspend/Activate:** Control user access
- **View Activity:** Check login history and actions

### Bulk Operations

#### Bulk Suspend
1. Select multiple accounts using checkboxes
2. Click "Bulk Actions" > "Suspend Selected"
3. Enter reason for suspension
4. Confirm action

#### Bulk Export
1. Apply desired filters
2. Click "Export" button
3. Choose format:
   - CSV (Excel compatible)
   - JSON (for integrations)
4. Download will start automatically

---

## 4. Monitoring System

### Dashboard Overview

#### Key Metrics
- **Total Councils:** Active council organizations
- **Total Firms:** Registered law firms
- **Active Notices:** Currently published notices
- **Monthly Revenue:** Platform revenue this month
- **System Health:** Overall system status

#### System Health Indicators
- 🟢 **Healthy:** All systems operational
- 🟡 **Degraded:** Minor issues, monitoring closely
- 🔴 **Down:** Critical issues requiring attention

#### Recent Activity Feed
- Shows last 20 admin actions
- Click "View All" for complete audit log
- Real-time updates every 30 seconds

### Audit Log

#### Accessing Audit Logs
1. Navigate to **Audit Log**
2. Logs are immutable and cannot be modified
3. Default view shows last 24 hours

#### Filtering Options
- **Date Range:** Custom date selection
- **Admin User:** Filter by specific admin
- **Action Category:**
  - Account Management
  - Notice Moderation
  - User Management
  - System Configuration
  - Security Events
  - Billing Operations
- **Severity:**
  - ℹ️ Info (routine operations)
  - ⚠️ Warning (attention needed)
  - 🔴 Critical (immediate action)
- **Target Type:** Organization, User, Notice, etc.

#### Audit Log Features
- **Infinite Scroll:** Loads more as you scroll
- **Export:** Download filtered results as CSV
- **Detail View:** Click any entry for full details
- **Change History:** View before/after values

### Notice Monitoring

#### Notice Statistics
- Daily/weekly/monthly submission counts
- Notice types breakdown
- Geographic distribution
- Average processing time

#### Flagged Notices
- Automatically flagged for review
- Manual flags from users
- Review queue with priority sorting

### Performance Metrics

#### Response Times
- API endpoint performance
- Database query times
- Page load speeds
- Error rates

#### Resource Usage
- Server CPU and memory
- Database connections
- Storage utilization
- Bandwidth consumption

---

## 5. Security Best Practices

### Account Security

#### Strong Passwords
- Use a unique password for admin panel
- Consider using a password manager
- Never share your password
- Change password every 90 days

#### Two-Factor Authentication
- **Always enable 2FA** for admin accounts
- Keep authenticator app updated
- Store backup codes securely
- Never share 2FA codes

#### Session Security
- Always logout when finished
- Don't use admin panel on public computers
- Be cautious of session timeout warnings
- Clear browser data after use on shared devices

### IP Allowlisting

#### Configuration
- Contact IT to add your IP address
- Use static IP when possible
- VPN may be required for remote access
- Wildcards supported for office ranges

#### Troubleshooting IP Blocks
1. Check your current IP: whatismyip.com
2. Verify IP is on allowlist
3. Contact super admin to add IP
4. Consider VPN if dynamic IP

### Audit Trail Best Practices

#### Regular Review
- Check audit logs weekly
- Investigate unusual patterns
- Review critical severity events immediately
- Export logs for compliance records

#### What to Look For
- Failed login attempts
- Unusual access times
- Bulk operations
- Permission changes
- Data exports

### Data Protection

#### Handling Sensitive Data
- Never export data to personal devices
- Use encrypted connections (HTTPS only)
- Follow GDPR requirements
- Report any data breaches immediately

#### Screen Sharing
- Hide admin panel during video calls
- Use incognito mode for demonstrations
- Clear sensitive data from screen
- Disable notifications during presentations

---

## 6. Troubleshooting

### Common Issues

#### Cannot Login
**Problem:** Login fails with correct credentials
**Solutions:**
1. Check CAPS LOCK is off
2. Verify email address spelling
3. Wait 30 minutes if account locked
4. Contact super admin for unlock
5. Try password reset if forgotten

#### 2FA Code Not Working
**Problem:** Authenticator code rejected
**Solutions:**
1. Check device time is synced
2. Ensure correct admin account in app
3. Try next code if near 30-second mark
4. Use backup code if available
5. Contact super admin to reset 2FA

#### Session Keeps Expiring
**Problem:** Logged out frequently
**Solutions:**
1. Check for 2-hour timeout
2. Ensure stable internet connection
3. Disable aggressive browser privacy settings
4. Check if IP address is changing
5. Contact IT for session configuration

#### Cannot Access Certain Features
**Problem:** Buttons or pages unavailable
**Solutions:**
1. Verify your admin role level
2. Check if feature requires super admin
3. Clear browser cache and cookies
4. Try different browser
5. Report to system administrator

### Browser Issues

#### Recommended Settings
- Enable JavaScript
- Allow cookies for civicnotices.co.uk
- Disable ad blockers for admin panel
- Use standard browser mode (not private)

#### Cache Problems
1. Hard refresh: Ctrl+Shift+R (Cmd+Shift+R on Mac)
2. Clear browser cache for last hour
3. Try incognito/private window
4. Restart browser completely

### Performance Issues

#### Slow Loading
**Causes and Solutions:**
- Network: Check connection speed
- Browser: Update to latest version
- Extensions: Disable temporarily
- Cache: Clear and restart
- Server: Check system health indicator

#### Timeout Errors
- Refresh page and retry
- Check system status
- Try again in few minutes
- Report if persistent

### Error Messages

#### "Unauthorized Access"
- Session expired - login again
- IP not on allowlist
- Account suspended
- Insufficient permissions

#### "Invalid Token"
- Session corrupted - login again
- Browser blocking cookies
- Multiple tabs conflict
- Clear cookies and retry

#### "Rate Limited"
- Too many requests
- Wait 1 minute and retry
- Reduce operation frequency
- Contact admin if legitimate use

### Getting Help

#### Support Channels
1. **Documentation:** Check this guide first
2. **IT Helpdesk:** For technical issues
3. **Super Admin:** For account/permission issues
4. **GitHub Issues:** For bug reports

#### Information to Provide
- Your admin email
- Browser and version
- Error message (screenshot helpful)
- Steps to reproduce issue
- Time issue occurred

#### Emergency Contacts
- **System Down:** Contact CTO immediately
- **Security Breach:** Follow incident response plan
- **Data Loss:** Contact database administrator
- **Account Compromise:** Notify security team

### Best Practices Summary

#### Daily Tasks
✓ Check dashboard for alerts
✓ Review recent activity
✓ Monitor system health
✓ Process pending reviews

#### Weekly Tasks
✓ Review audit logs
✓ Check account suspensions
✓ Export compliance reports
✓ Update documentation

#### Monthly Tasks
✓ Review user permissions
✓ Audit admin accounts
✓ Check backup codes
✓ Update passwords if needed

---

## Appendix

### Keyboard Shortcuts
- `Ctrl+K`: Quick search
- `Esc`: Close modals
- `?`: Show help
- `Alt+D`: Dashboard
- `Alt+A`: Accounts
- `Alt+L`: Audit Log

### API Rate Limits
- 100 requests per minute
- 1000 requests per hour
- Bulk operations: 10 per hour
- Exports: 20 per day

### Data Retention
- Audit logs: Permanent
- Session data: 30 days
- Failed logins: 90 days
- Deleted accounts: Soft delete (permanent)

### Compliance
- GDPR compliant
- ICO registered
- ISO 27001 aligned
- Regular security audits

### Version History
- v1.0 - January 2026 - Initial admin panel release

---

**Last Updated:** January 2026
**Document Version:** 1.0
**Maintained By:** Civic Notices Admin Team

For additional support, please contact: admin-support@civicnotices.co.uk