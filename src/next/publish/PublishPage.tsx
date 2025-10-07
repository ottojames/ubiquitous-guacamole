import Header from '@/components/layout/Header';
import * as UI from '@/styles/ui';
import NewPublishFlow from './flow/NewPublishFlow';

export default function PublishPage() {
  return (
    <div className={`${UI.pageWrapLg} relative`} data-testid="publish-next-layout">
      <Header />
      <div id="header-sentinel" className="h-2" aria-hidden="true" />
      <div className={`${UI.container} pt-16 md:pt-20 pb-6`}>
        <h1 className={`${UI.heroH1} mb-2`}>Publish a notice</h1>
        <p className={`${UI.heroSub} mt-1`}>Choose your notice type, upload or use a template, and stay compliant.</p>
      </div>
      <main className={`${UI.container} ${UI.sectionY}`}>
        <NewPublishFlow />
      </main>
    </div>
  );
}
