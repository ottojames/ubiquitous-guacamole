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
import PublishConfirmationPage from "@/pages/PublishConfirmationPage";
import SubmitRepresentation from "@/pages/SubmitRepresentation";
import AddressLookupDebug from "@/pages/debug/AddressLookupDebug";
import SignIn from "@/pages/auth/SignIn";
import Callback from "@/pages/auth/Callback";
import SwitchContext from "@/pages/auth/SwitchContext";
import CreateOrganization from "@/pages/onboarding/CreateOrganization";
import CouncilLayout from "@/pages/council/CouncilLayout";
import CouncilDashboard from "@/pages/council/Dashboard";
import CouncilNotices from "@/pages/council/Notices";
import NoticeEditor from "@/pages/council/NoticeEditor";
import NoticeDetail from "@/pages/council/NoticeDetail";
import Team from "@/pages/council/Team";
import Templates from "@/pages/council/Templates";
import Settings from "@/pages/council/Settings";
import AuditLog from "@/pages/council/AuditLog";
import Privacy from "@/pages/legal/Privacy";
import Terms from "@/pages/legal/Terms";
import Accessibility from "@/pages/legal/Accessibility";
import Contact from "@/pages/Contact";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/notices" element={<NoticesPage />} />
        <Route path="/notices/:id" element={<NoticeDetailPage />} />
        <Route path="/notices/:id/confirmation" element={<PublishConfirmationPage />} />
        <Route path="/notices/:id/respond" element={<SubmitRepresentation />} />
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

        {/* Auth & Onboarding Routes */}
        <Route path="/auth/sign-in" element={<SignIn />} />
        <Route path="/auth/callback" element={<Callback />} />
        <Route path="/switch-context" element={<SwitchContext />} />
        <Route path="/onboarding/create-organization" element={<CreateOrganization />} />

        {/* Council Portal Routes - Protected */}
        <Route path="/c/:orgSlug/:deptSlug" element={<ProtectedRoute><CouncilLayout /></ProtectedRoute>}>
          <Route path="dashboard" element={<CouncilDashboard />} />
          <Route path="notices" element={<CouncilNotices />} />
          <Route path="notices/new" element={<NoticeEditor />} />
          <Route path="notices/:noticeId" element={<NoticeDetail />} />
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
