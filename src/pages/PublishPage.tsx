import React, { useEffect, useState } from 'react';
import * as UI from '@/styles/ui';
import UploadNoticeFlow from '@/components/publish/UploadNoticeFlow';
import TemplateBuilder from './publish';
import Header from '@/components/layout/Header';

export default function PublishPage() {
  const [tab, setTab] = useState<'notice' | 'template'>('notice');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('tab');
    if (t === 'template') setTab('template');
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set('tab', tab);
    const url = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', url);
  }, [tab]);

  return (
    <div className={`${UI.pageWrapLg} relative`} data-testid="publish-layout">
      <Header />
      {/* Sentinel right after header */}
      <div id="header-sentinel" className="h-2" aria-hidden="true" />
      {/* Hero header area: title + tabs on gradient */}
      <div className={`${UI.container} pt-16 md:pt-20 pb-6`}>
        <h1 className={`${UI.heroH1} mb-2`}>Publish a notice</h1>
        <p className={`${UI.heroSub} mt-1`}>Guided, compliant, and instant proof</p>
        <nav role="tablist" className="mt-4 flex gap-2">
          {(() => {
            const activeTab = (t: 'notice' | 'template') =>
              t === tab
                ? "rounded-xl bg-white text-blue-900 font-semibold ring-1 ring-white/60 shadow-sm"
                : "rounded-xl bg-white/80 text-blue-800 hover:bg-white ring-1 ring-white/50";
            return (
              <>
          <button
            role="tab"
            aria-selected={tab === 'notice'}
            aria-controls="notice-panel"
            tabIndex={tab === 'notice' ? 0 : -1}
            className={`${activeTab('notice')} px-4 h-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-transparent`}
            data-testid="tab-trigger-notice"
            onClick={() => setTab('notice')}
          >
            Upload from Notice
          </button>
          <button
            role="tab"
            aria-selected={tab === 'template'}
            aria-controls="template-panel"
            tabIndex={tab === 'template' ? 0 : -1}
            className={`${activeTab('template')} px-4 h-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-transparent`}
            data-testid="tab-trigger-template"
            onClick={() => setTab('template')}
          >
            Upload via Template
          </button>
              </>
            );
          })()}
        </nav>
      </div>
      {/* Main content on light canvas */}
      <main className={`${UI.container} ${UI.sectionY}`}>
        <div id="notice-panel" role="tabpanel" hidden={tab !== 'notice'}>
          {tab === 'notice' && (
            <div data-testid="tab-notice-root">
              <UploadNoticeFlow />
            </div>
          )}
        </div>
        <div id="template-panel" role="tabpanel" hidden={tab !== 'template'}>
          {tab === 'template' && (
            <div data-testid="tab-template-root">
              <TemplateBuilder />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
