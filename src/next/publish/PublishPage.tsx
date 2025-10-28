import { useLocation } from "react-router-dom";
import Header from "@/components/layout/Header";
import * as UI from "@/styles/ui";
import NewPublishFlow from "@/next/publish/flow/NewPublishFlow";

export default function PublishPage() {
  const location = useLocation();

  // Detect if we're in a firm or council portal context
  const isPortalContext = location.pathname.startsWith('/f/') || location.pathname.startsWith('/c/');

  // In portal context, skip the public header and use integrated layout
  if (isPortalContext) {
    return (
      <div className="min-h-screen" data-testid="publish-portal-layout">
        <main className="relative">
          <NewPublishFlow />
        </main>
      </div>
    );
  }

  // Public context - show full header
  return (
    <div className={`min-h-screen ${UI.pageWrap}`} data-testid="publish-next-layout">
      <Header />
      <div id="header-sentinel" className="h-2" aria-hidden="true" />

      {/* Main Content - Hero and flow integrated */}
      <main className="relative">
        <NewPublishFlow />
      </main>
    </div>
  );
}
