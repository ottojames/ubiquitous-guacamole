import Header from "@/components/layout/Header";
import * as UI from "@/styles/ui";
import NewPublishFlow from "@/next/publish/flow/NewPublishFlow";

export default function PublishPage() {
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
