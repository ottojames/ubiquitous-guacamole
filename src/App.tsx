import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { NEW_PUBLISH_FLOW } from "@/env";
import NewPublishFlow from "@/next/publish/flow/NewPublishFlow";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import PublishPage from "@/pages/PublishPage";
import Pricing from "@/pages/Pricing";
import Login from "@/pages/Login";
import Success from "./pages/Success";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCancelled from "./pages/PaymentCancelled";
import DetailsPage from "./pages/DetailsPage";
import NoticesPage from "@/pages/Notices";
import NoticeDetailPage from "@/pages/NoticeDetailPage";
import PublishConfirmationPage from "@/pages/PublishConfirmationPage";
import SubmitRepresentation from "@/pages/SubmitRepresentation";
import AddressLookupDebug from "@/pages/debug/AddressLookupDebug";
import SignIn from "@/pages/auth/SignIn";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import Callback from "@/pages/auth/Callback";
import SwitchContext from "@/pages/auth/SwitchContext";
import CouncilLogin from "@/pages/auth/CouncilLogin";
import AcceptInvitation from "@/pages/auth/AcceptInvitation";
import DepartmentSwitcher from "@/pages/council/DepartmentSwitcher";
import CreateOrganization from "@/pages/onboarding/CreateOrganization";
import CouncilRegistration from "@/pages/onboarding/CouncilRegistration";
import FirmRegistration from "@/pages/onboarding/FirmRegistration";
import CouncilLayout from "@/pages/council/CouncilLayout";
import CouncilDashboard from "@/pages/council/Dashboard";
import CouncilNotices from "@/pages/council/Notices";
import CouncilDrafts from "@/pages/council/Drafts";
import NoticeEditor from "@/pages/council/NoticeEditor";
import NoticeDetail from "@/pages/council/NoticeDetail";
import PendingSubmissions from "@/pages/council/PendingSubmissions";
import Team from "@/pages/council/Team";
import Templates from "@/pages/council/Templates";
import Settings from "@/pages/council/Settings";
import Billing from "@/pages/council/Billing";
import AuditLog from "@/pages/council/AuditLog";
import Analytics from "@/pages/council/Analytics";
import CouncilRepresentations from "@/pages/council/Representations";
import TrackNotice from "@/pages/TrackNotice";
import FirmLayout from "@/pages/firm/FirmLayout";
import FirmDashboard from "@/pages/firm/Dashboard";
import FirmClients from "@/pages/firm/Clients";
import FirmNotices from "@/pages/firm/Notices";
import FirmBilling from "@/pages/firm/Billing";
import FirmBulkUpload from "@/pages/firm/BulkUpload";
import FirmSettings from "@/pages/firm/Settings";
import FirmTeam from "@/pages/firm/Team";
import FirmTemplates from "@/pages/firm/Templates";
import Register from "@/pages/Register";
import Privacy from "@/pages/legal/Privacy";
import Terms from "@/pages/legal/Terms";
import Accessibility from "@/pages/legal/Accessibility";
import Contact from "@/pages/Contact";
import EmailAlerts from "@/pages/EmailAlerts";
import ApiDocs from "@/pages/ApiDocs";
import ConferenceLanding from "@/pages/ConferenceLanding";
import ShowcaseLanding from "@/pages/ShowcaseLanding";
import ShowcaseSegment from "@/pages/ShowcaseSegment";
import SampleNotice from "@/pages/SampleNotice";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { UnifiedAuthProvider } from "@/contexts/UnifiedAuthContext";
import AdminLayout from "@/pages/admin/AdminLayout";
import AdminLogin from "@/pages/admin/Login";
import AdminDashboard from "@/pages/admin/Dashboard";
import AccountManagement from "@/pages/admin/AccountManagement";
import AdminAuditLog from "@/pages/admin/AuditLog";
import AdminSettings from "@/pages/admin/Settings";
import AdminNotices from "@/pages/admin/AdminNotices";
import AdminProtectedRoute from "@/components/admin/AdminProtectedRoute";
import CouncilProtectedRoute from "@/components/council/CouncilProtectedRoute";
import AuthDebug from "@/pages/AuthDebug";
import { SectionErrorBoundary } from "@/components/error/SectionErrorBoundary";

export default function App() {
  // Demo mode toggle: Cmd+Shift+D (Mac) or Ctrl+Shift+D (Windows/Linux)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        document.body.classList.toggle('demo-mode');
        const isEnabled = document.body.classList.contains('demo-mode');
        console.log(`🎥 Demo mode ${isEnabled ? 'enabled' : 'disabled'}`);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <UnifiedAuthProvider>
      <BrowserRouter>
        <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/conference" element={<ConferenceLanding />} />
        <Route path="/showcase" element={<ShowcaseLanding />} />
        <Route path="/showcase/:segmentId" element={<ShowcaseSegment />} />
        <Route path="/sample-notice" element={<SampleNotice />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/notices" element={<NoticesPage />} />
        <Route path="/notices/:id" element={<NoticeDetailPage />} />
        <Route path="/notices/:id/confirmation" element={<PublishConfirmationPage />} />
        <Route path="/notices/:id/respond" element={<SubmitRepresentation />} />
        <Route path="/track" element={<TrackNotice />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/publish/*" element={<PublishPage />} />
        <Route path="/notices/upload/template" element={<PublishPage />} />
        <Route path="/success" element={<Success />} />
        <Route path="/payment/success" element={<PaymentSuccess />} />
        <Route path="/payment/cancelled" element={<PaymentCancelled />} />
        <Route path="/details" element={<DetailsPage />} />
        <Route path="/debug/address" element={<AddressLookupDebug />} />

        {/* Legal & Contact Pages */}
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/accessibility" element={<Accessibility />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/email-alerts" element={<EmailAlerts />} />
        <Route path="/api-docs" element={<ApiDocs />} />

        {/* Auth & Onboarding Routes */}
        <Route path="/auth/sign-in" element={<SignIn />} />
        <Route path="/auth/signin" element={<SignIn />} />
        <Route path="/auth/callback" element={<Callback />} />
        <Route path="/auth/council-login" element={<CouncilLogin />} />
        <Route path="/auth/accept-invitation" element={<AcceptInvitation />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/switch-context" element={<SwitchContext />} />
        <Route path="/switch-department" element={<DepartmentSwitcher />} />
        <Route path="/onboarding/create-organization" element={<CreateOrganization />} />
        <Route path="/register" element={<Register />} />
        <Route path="/register/council" element={<CouncilRegistration />} />
        <Route path="/register/firm" element={<FirmRegistration />} />

        {/* Council Portal Routes - Auth handled by CouncilProtectedRoute */}
        <Route path="/c/:orgSlug/:deptSlug" element={
          <SectionErrorBoundary sectionName="Council Portal">
            <CouncilProtectedRoute>
              <CouncilLayout />
            </CouncilProtectedRoute>
          </SectionErrorBoundary>
        }>
          <Route path="dashboard" element={<CouncilDashboard />} />
          <Route path="notices" element={<CouncilNotices />} />
          <Route path="notices/new" element={<NoticeEditor />} />
          <Route path="notices/:noticeId" element={<NoticeDetail />} />
          <Route path="representations" element={<CouncilRepresentations />} />
          <Route path="pending" element={<PendingSubmissions />} />
          <Route path="drafts" element={<CouncilDrafts />} />
          <Route path="team" element={<Team />} />
          <Route path="templates" element={<Templates />} />
          <Route path="billing" element={<Billing />} />
          <Route path="settings" element={<Settings />} />
          <Route path="audit" element={<AuditLog />} />
          <Route path="analytics" element={<Analytics />} />
        </Route>

        {/* Firm Portal Routes */}
        <Route path="/f/:firmSlug" element={
          <SectionErrorBoundary sectionName="Firm Portal">
            <FirmLayout />
          </SectionErrorBoundary>
        }>
          <Route path="dashboard" element={<FirmDashboard />} />
          <Route path="clients" element={<FirmClients />} />
          <Route path="notices" element={<FirmNotices />} />
          <Route path="bulk-upload" element={<FirmBulkUpload />} />
          <Route path="billing" element={<FirmBilling />} />
          <Route path="team" element={<FirmTeam />} />
          <Route path="templates" element={<FirmTemplates />} />
          <Route path="settings" element={<FirmSettings />} />
          {/* Comprehensive publish wizard - maintains firm portal context */}
          <Route path="publish/*" element={<NewPublishFlow />} />
        </Route>

        {/* Admin Portal Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={
          <SectionErrorBoundary sectionName="Admin Portal">
            <AdminProtectedRoute>
              <AdminLayout />
            </AdminProtectedRoute>
          </SectionErrorBoundary>
        }>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="accounts" element={<AccountManagement />} />
          <Route path="notices" element={<AdminNotices />} />
          <Route path="audit" element={<AdminAuditLog />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        {NEW_PUBLISH_FLOW && (
          <Route path="/next/publish/*" element={
            <SectionErrorBoundary sectionName="Publish Wizard">
              <NewPublishFlow />
            </SectionErrorBoundary>
          } />
        )}
        <Route path="/auth-debug" element={<AuthDebug />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </BrowserRouter>
    </UnifiedAuthProvider>
  );
}
