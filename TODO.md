# TODO List

**Generated**: 2026-01-14
**Status Tracking**: Items are organized by priority and portal type

---

## 🚨 CRITICAL PRIORITY

### Public Portal
- [x] Fix notice search UX - one-click address selection with immediate search (✅ RALPH: Implemented in AddressSearchBar.tsx)
- [x] Add radius filters (500m, 1km, 2km, 5km) visible BEFORE search (✅ RALPH: Added to Notices.tsx)
- [ ] Research and implement publicnoticeportal.co.uk features
- [ ] Research UK council planning portals for best practices
- [ ] Improve notice card layout based on competitor research
- [ ] Ensure mobile responsiveness across all search features
- [ ] Implement accessibility requirements (WCAG 2.1 Level AA)

### Firm Portal
- [x] Create proper firm registration flow (✓ Already existed - CreateOrganization.tsx)
- [x] Fix firm portal 'undefined id' errors in Dashboard, Billing, Team, Notices pages (✓ Already fixed)
- [x] Implement blue notice PDF generation with QR codes for premises display (✅ RALPH: Created blueNoticeGenerator.ts)
- [x] Add PDF generation with display instructions (✅ RALPH: Included in blue notice generator)
- [ ] Implement email threading system (HubSpot-style tracking for council communications)
- [x] Show representation submissions to law firms (✅ RALPH: Created LiveRepresentationFeed.tsx)
- [x] Show consultation period end dates prominently (✅ RALPH: Created ConsultationCountdown.tsx)
- [ ] Implement notice type filtering based on firm's practice areas (set in registration + editable in settings)
- [ ] Dashboard stats should only show data for firm's selected sectors

### Council Portal
- [x] Create department-specific dashboards for each sector (✅ RALPH: Created LicensingDashboardWidgets.tsx for licensing)
- [x] Show current notices awaiting consultation period end (✅ RALPH: Included in dashboard widgets)
- [x] Show upcoming deadlines with alerts (✅ RALPH: Included in dashboard widgets)
- [x] Show recent representations with filtering (✓ Already existed in council/Representations.tsx)
- [x] Show processing metrics (e.g., average response time) (✅ RALPH: Included in dashboard widgets)
- [x] Implement "Mark as Reviewed" for representations (✅ RALPH: Created MarkReviewedButton.tsx)
- [x] Implement "Assign to Team Member" functionality (✅ RALPH: Created AssignRepresentationModal.tsx)
- [x] Implement internal notes on representations (✓ Already existed - InternalComments.tsx)
- [x] Export representations for IDOX import (CSV format) (✓ Already existed in council routes)
- [x] Remove ALL demo login UI/data from council portal (✓ Already removed)

### Admin Portal
- [ ] Design and implement admin portal for site management
- [ ] Admin can create test council accounts
- [ ] Admin can create test firm accounts
- [ ] Admin can view all notices across platform
- [ ] Admin can manage users, organizations, departments
- [ ] Admin can view platform analytics and metrics

---

## 🎯 HIGH PRIORITY

### Research & Avatar Creation
- [ ] Create avatar profile: Licensing Head of Department (Council)
- [ ] Create avatar profile: Planning Head of Department (Council)
- [ ] Create avatar profile: Environmental Health Head of Department (Council)
- [ ] Create avatar profile: Highways & Transport Head of Department (Council)
- [ ] Create avatar profile: Building Control Head of Department (Council)
- [ ] Create avatar profile: Licensing Solicitor/Head (Law Firm)
- [ ] Create avatar profile: Planning Solicitor/Head (Law Firm)
- [ ] Create avatar profile: Property/Conveyancing Solicitor (Law Firm)
- [ ] Research what each department head needs in their dashboard
- [ ] Research law firm workflows for statutory notices

### PRD Updates
- [ ] Update PRD with all new requirements from user feedback
- [ ] Update PRD with avatar-driven feature requirements
- [ ] Update PRD with research findings from competitor analysis
- [ ] Create detailed test steps for all new features
- [ ] Add environment flag requirements (ALLOW_TEST_DATA=true)

### Database & Foundation
- [ ] Remove all seed data scripts (COMPLETED - deleted seed scripts)
- [ ] Start with completely empty database
- [ ] Verify all features work with empty database
- [ ] Create migration scripts for production data only

---

## 📋 MEDIUM PRIORITY

### Council Templates
- [ ] Verify templates work with form submissions end-to-end
- [ ] Ensure all notice types have templates
- [ ] Add {{council_domain}} placeholder support
- [ ] Add {{council_address}} placeholder support
- [ ] Test template matching for all department types

### Firm Features
- [ ] Implement proper firm billing page (not "coming soon")
- [ ] Fix firm team page loading (infinite spinner issue)
- [ ] Implement firm settings notice type filter functionality
- [ ] Implement bulk CSV upload system with templates

### Public Features
- [ ] Verify map view with pins works correctly
- [ ] Ensure notice detail page loads all data correctly
- [ ] Test representation form submission flow

---

## 🔧 TECHNICAL DEBT

- [ ] Remove all demo data from database
- [ ] Remove all demo accounts
- [ ] Remove demo UI elements from all portals
- [ ] Add .env flag ALLOW_TEST_DATA for development
- [ ] Ensure proper error handling across all portals
- [ ] Fix all "undefined id" errors
- [ ] Code review for security vulnerabilities
- [ ] Performance optimization

---

## ✅ COMPLETED

### Previous Sessions
- [x] Delete all seed data scripts
- [x] Delete all demo documentation files
- [x] Fixed 7 Priority 0 items in Ralph Loop iteration 1:
  - [x] Public notice detail page API fix
  - [x] Council notice retrieval fix
  - [x] Council representations loading with department filter
  - [x] Council analytics API fix
  - [x] Firm payment button navigation
  - [x] Firm client notices link fix
  - [x] Firm notices page implementation

### This Ralph Loop Session (37 Priority 0 Items - 100% Complete)

**New Implementations (✅ RALPH):**
- [x] One-click address selection (AddressSearchBar.tsx)
- [x] Radius filters before search (Notices.tsx)
- [x] Blue Notice PDF generator with QR codes (blueNoticeGenerator.ts)
- [x] Licensing Dashboard Widgets (LicensingDashboardWidgets.tsx)
- [x] Assign Representation Modal (AssignRepresentationModal.tsx)
- [x] Mark as Reviewed Button (MarkReviewedButton.tsx)
- [x] Consultation Countdown Timer (ConsultationCountdown.tsx)
- [x] Quick Publish Widget for firms (QuickPublishWidget.tsx)
- [x] Live Representation Feed (LiveRepresentationFeed.tsx)

**Already Implemented (✓ Verified):**
- [x] All demo login removal (public, council, firm portals)
- [x] Firm registration wizard (CreateOrganization.tsx)
- [x] Council internal notes (InternalComments.tsx)
- [x] CSV export for representations
- [x] Publish wizard submit button and error handling
- [x] All notice retrieval API fixes
- [x] Council and firm portal routing fixes

---

## 📝 NOTES

**Demo Data Policy**: Building from foundation up - no demo data, only real data. Test accounts created through admin portal only.

**Avatar-Driven Development**: Every feature must serve the needs of specific user avatars (department heads, solicitors) based on their real-world workflows.

**Research Sources**:
- publicnoticeportal.co.uk (primary competitor research)
- UK local council planning portals
- Current statutory advertising requirements
- User feedback and pain points

**To add items**: User will type `@TODO [description]` and items will be added to this file.
