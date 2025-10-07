import React, { useEffect, useState } from 'react';
import * as UI from '@/styles/ui';
import UploadNoticeFlow from '@/components/publish/UploadNoticeFlow';
import TemplateUploadFlow from '@/features/template/TemplateUploadFlow';
import Header from '@/components/layout/Header';
import { NEW_PUBLISH_FLOW_ENABLED } from '@/config/flags';
import NextPublishPage from '@/next/publish/PublishPage';

export default function PublishPage() {
  if (NEW_PUBLISH_FLOW_ENABLED) {
    return <NextPublishPage />;
  }

  const [tab, setTab] = useState<'notice' | 'template'>('notice');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('tab');
    if (t === 'template') {
      setTab('template');
      return;
    }
    if (window.location.pathname.includes('/template')) {
      setTab('template');
    }
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
          {(
            [
              { key: 'notice', label: 'Upload from Notice' },
              { key: 'template', label: 'Upload via Template' },
            ] as const
          ).map((option) => {
            const isActive = tab === option.key;
            return (
              <button
                key={option.key}
                role="tab"
                aria-selected={isActive}
                aria-controls={`${option.key}-panel`}
                tabIndex={isActive ? 0 : -1}
                className={`${UI.btnSecondary} h-10 px-4 text-sm transition-colors duration-200 focus:ring-offset-0 focus:ring-offset-transparent ${
                  isActive
                    ? 'bg-white text-blue-900 font-semibold shadow-sm border-white/70'
                    : 'bg-white/80 text-blue-900/80 border-white/60 hover:bg-white/90'
                }`}
                data-testid={`tab-trigger-${option.key}`}
                onClick={() => setTab(option.key)}
              >
                {option.label}
              </button>
            );
          })}
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
              <TemplateUploadFlow />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
