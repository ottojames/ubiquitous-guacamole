import Header from "@/components/layout/Header";
import * as UI from "@/styles/ui";
import NewPublishFlow from "@/next/publish/flow/NewPublishFlow";

export default function PublishPage() {
  return (
    <div className={UI.pageWrap} data-testid="publish-next-layout">
      <Header />
      <div id="header-sentinel" className="h-2" aria-hidden="true" />

      {/* Hero Section - Softened gradient, reduced height */}
      <section className="relative overflow-hidden pb-12 pt-10 md:pb-16 md:pt-12">
        <div className="absolute -right-16 -top-16 h-96 w-96 rounded-full bg-blue-200/15 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-blue-300/8 blur-3xl" />

        <div className={`${UI.container} relative z-10`}>
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-200/70 bg-blue-50/80 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-blue-900">
              Guided publish flow
            </div>
            <h1 className="text-3xl font-extrabold leading-[1.1] tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.25)] md:text-4xl lg:text-5xl">
              Publish with calm, compliant confidence.
            </h1>
            <p className="mt-5 text-base font-medium leading-relaxed text-white drop-shadow-[0_1px_8px_rgba(0,0,0,0.2)] md:text-lg">
              Upload, validate, and ship a statutory notice in minutes. We stage every step, surface issues early, and issue an instant proof of publication.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="relative pb-20 md:pb-32">
        <div className={`${UI.container}`}>
          <NewPublishFlow />
        </div>
      </main>
    </div>
  );
}
