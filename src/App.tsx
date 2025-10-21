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
import CouncilNotices from "@/pages/council/Notices";
import NoticeEditor from "@/pages/council/NoticeEditor";
import Team from "@/pages/council/Team";
import Templates from "@/pages/council/Templates";
import Settings from "@/pages/council/Settings";
import AuditLog from "@/pages/council/AuditLog";

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
          <Route path="notices" element={<CouncilNotices />} />
          <Route path="notices/new" element={<NoticeEditor />} />
          <Route path="notices/:noticeId" element={<NoticeEditor />} />
          <Route path="team" element={<Team />} />
          <Route path="templates" element={<Templates />} />
          <Route path="settings" element={<Settings />} />
          <Route path="audit" element={<AuditLog />} />
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
