import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { NEW_PUBLISH_FLOW } from "@/env";
import NewPublishFlow from "@/next/publish/flow/NewPublishFlow";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import PublishPage from "@/pages/PublishPage";
import Pricing from "@/pages/Pricing";
import Login from "@/pages/Login";
import Success from "./pages/Success";
import DetailsPage from "./pages/DetailsPage";
import NoticesPage from "@/pages/Notices";
import NoticeDetailPage from "@/pages/NoticeDetailPage";
import PublishConfirmationPage from "@/pages/PublishConfirmationPage";
import SubmitRepresentation from "@/pages/SubmitRepresentation";
import AddressLookupDebug from "@/pages/debug/AddressLookupDebug";
import SignIn from "@/pages/auth/SignIn";
import Callback from "@/pages/auth/Callback";
import SwitchContext from "@/pages/auth/SwitchContext";
import DepartmentSwitcher from "@/pages/council/DepartmentSwitcher";
import CreateOrganization from "@/pages/onboarding/CreateOrganization";
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
import Privacy from "@/pages/legal/Privacy";
import Terms from "@/pages/legal/Terms";
import Accessibility from "@/pages/legal/Accessibility";
import Contact from "@/pages/Contact";
import EmailAlerts from "@/pages/EmailAlerts";
import ApiDocs from "@/pages/ApiDocs";
import ConferenceLanding from "@/pages/ConferenceLanding";
import ShowcaseLanding from "@/pages/ShowcaseLanding";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/conference" element={<ConferenceLanding />} />
        <Route path="/showcase" element={<ShowcaseLanding />} />
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
        <Route path="/auth/callback" element={<Callback />} />
        <Route path="/switch-context" element={<SwitchContext />} />
        <Route path="/switch-department" element={<DepartmentSwitcher />} />
        <Route path="/onboarding/create-organization" element={<CreateOrganization />} />
        <Route path="/register/firm" element={<CreateOrganization />} />

        {/* Council Portal Routes - Auth handled by CouncilLayout (supports demo mode) */}
        <Route path="/c/:orgSlug/:deptSlug" element={<CouncilLayout />}>
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
        <Route path="/f/:firmSlug" element={<FirmLayout />}>
          <Route path="dashboard" element={<FirmDashboard />} />
          <Route path="clients" element={<FirmClients />} />
          <Route path="notices" element={<FirmNotices />} />
          <Route path="bulk-upload" element={<FirmBulkUpload />} />
          <Route path="billing" element={<FirmBilling />} />
          <Route path="team" element={<FirmTeam />} />
          <Route path="settings" element={<FirmSettings />} />
          {/* Comprehensive publish wizard - maintains firm portal context */}
          <Route path="publish/*" element={<NewPublishFlow />} />
        </Route>

        {NEW_PUBLISH_FLOW && (
          <Route path="/next/publish/*" element={<NewPublishFlow />} />
        )}
        <Route path="*" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}
