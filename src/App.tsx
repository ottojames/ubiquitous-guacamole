import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { NEW_PUBLISH_FLOW } from "@/env";
import PublishLayout from "@/routes/next/publish/PublishLayout";
import StepType from "@/routes/next/publish/StepType";
import StepUpload from "@/routes/next/publish/StepUpload";
import StepConfirm from "@/routes/next/publish/StepConfirm";
import StepPay from "@/routes/next/publish/StepPay";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import PublishPage from "@/pages/PublishPage";
import Pricing from "@/pages/Pricing";
import Login from "@/pages/Login";
import Success from "./pages/Success";
import DetailsPage from "./pages/DetailsPage";
import NoticesPage from "@/pages/Notices";
import NoticeDetailPage from "@/pages/NoticeDetailPage";
import SubmitRepresentation from "@/pages/SubmitRepresentation";
import AddressLookupDebug from "@/pages/debug/AddressLookupDebug";
import SignIn from "@/pages/auth/SignIn";
import DevSignIn from "@/pages/auth/DevSignIn";
import Callback from "@/pages/auth/Callback";
import SwitchContext from "@/pages/auth/SwitchContext";
import CreateOrganization from "@/pages/onboarding/CreateOrganization";
import CouncilLayout from "@/pages/council/CouncilLayout";
import CouncilDashboard from "@/pages/council/Dashboard";
import Submissions from "@/pages/council/Submissions";
import SubmissionReviewer from "@/pages/council/SubmissionReviewer";
import Publications from "@/pages/council/Publications";
import Representations from "@/pages/council/Representations";
import CouncilNotices from "@/pages/council/Notices";
import NoticeEditor from "@/pages/council/NoticeEditor";
import Team from "@/pages/council/Team";
import Templates from "@/pages/council/Templates";
import Settings from "@/pages/council/Settings";
import AuditLog from "@/pages/council/AuditLog";
import Compliance from "@/pages/council/Compliance";
import Analytics from "@/pages/council/Analytics";
import BulkActions from "@/pages/council/BulkActions";
import Exports from "@/pages/council/Exports";
import FirmLayout from "@/pages/firm/FirmLayout";
import FirmDashboard from "@/pages/firm/FirmDashboard";
import FirmSubmissions from "@/pages/firm/FirmSubmissions";
import NewSubmission from "@/pages/firm/NewSubmission";
import SubmissionDetail from "@/pages/firm/SubmissionDetail";
import PublicHome from "@/pages/public/PublicHome";
import PublicNotices from "@/pages/public/PublicNotices";
import PublicNoticeDetail from "@/pages/public/PublicNoticeDetail";
import AdminLayout from "@/pages/admin/AdminLayout";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import ManageOrganizations from "@/pages/admin/ManageOrganizations";
import ManageUsers from "@/pages/admin/ManageUsers";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/notices" element={<NoticesPage />} />
        <Route path="/notices/:id" element={<NoticeDetailPage />} />
        <Route path="/notices/:id/respond" element={<SubmitRepresentation />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/publish/*" element={<PublishPage />} />
        <Route path="/notices/upload/template" element={<PublishPage />} />
        <Route path="/success" element={<Success />} />
        <Route path="/details" element={<DetailsPage />} />
        <Route path="/debug/address" element={<AddressLookupDebug />} />

        {/* Auth & Onboarding Routes */}
        <Route path="/auth/sign-in" element={<SignIn />} />
        <Route path="/auth/dev" element={<DevSignIn />} />
        <Route path="/auth/callback" element={<Callback />} />
        <Route path="/switch-context" element={<SwitchContext />} />
        <Route path="/onboarding/create-organization" element={<CreateOrganization />} />

        {/* Council Portal Routes */}
        <Route path="/c/:orgSlug/:deptSlug" element={<CouncilLayout />}>
          <Route path="dashboard" element={<CouncilDashboard />} />
          <Route path="submissions" element={<Submissions />} />
          <Route path="submissions/:submissionId" element={<SubmissionReviewer />} />
          <Route path="publications" element={<Publications />} />
          <Route path="representations" element={<Representations />} />
          <Route path="compliance" element={<Compliance />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="bulk-actions" element={<BulkActions />} />
          <Route path="exports" element={<Exports />} />
          <Route path="notices" element={<CouncilNotices />} />
          <Route path="notices/new" element={<NoticeEditor />} />
          <Route path="notices/:noticeId" element={<NoticeEditor />} />
          <Route path="team" element={<Team />} />
          <Route path="templates" element={<Templates />} />
          <Route path="settings" element={<Settings />} />
          <Route path="audit" element={<AuditLog />} />
        </Route>

        {/* Firm Portal Routes */}
        <Route path="/f/:orgSlug" element={<FirmLayout />}>
          <Route path="dashboard" element={<FirmDashboard />} />
          <Route path="submissions" element={<FirmSubmissions />} />
          <Route path="submissions/:submissionId" element={<SubmissionDetail />} />
          <Route path="new-submission" element={<NewSubmission />} />
          <Route path="team" element={<Team />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Public Portal Routes */}
        <Route path="/public" element={<PublicHome />} />
        <Route path="/public/notices" element={<PublicNotices />} />
        <Route path="/public/notices/:noticeId" element={<PublicNoticeDetail />} />

        {/* Admin Portal Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="organizations" element={<ManageOrganizations />} />
          <Route path="users" element={<ManageUsers />} />
          <Route path="submissions" element={<AdminDashboard />} />
          <Route path="analytics" element={<AdminDashboard />} />
          <Route path="settings" element={<AdminDashboard />} />
        </Route>

        {NEW_PUBLISH_FLOW && (
          <Route path="/next/publish" element={<PublishLayout />}>
            <Route index element={<Navigate to="type" replace />} />
            <Route path="type" element={<StepType />} />
            <Route path="upload" element={<StepUpload />} />
            <Route path="confirm" element={<StepConfirm />} />
            <Route path="pay" element={<StepPay />} />
          </Route>
        )}
        <Route path="*" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}
