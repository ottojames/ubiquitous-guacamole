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
    <div className={UI.gradientBg} data-testid="publish-layout">
      <Header />
      <main className={UI.container + ' py-6'}>
        <h1 className={UI.h1 + ' mb-6 text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)]'}>Publish a notice</h1>
        <nav role="tablist" className="mb-4 flex gap-2">
          <button
            role="tab"
            aria-selected={tab === 'notice'}
            aria-controls="notice-panel"
            tabIndex={tab === 'notice' ? 0 : -1}
            className={tab === 'notice' ? UI.pillBtn : UI.ghostPill}
            onClick={() => setTab('notice')}
          >
            Upload from Notice
          </button>
          <button
            role="tab"
            aria-selected={tab === 'template'}
            aria-controls="template-panel"
            tabIndex={tab === 'template' ? 0 : -1}
            className={tab === 'template' ? UI.pillBtn : UI.ghostPill}
            onClick={() => setTab('template')}
          >
            Upload via Template
          </button>
        </nav>
        <div id="notice-panel" role="tabpanel" hidden={tab !== 'notice'}>
          {tab === 'notice' && <UploadNoticeFlow />}
        </div>
        <div id="template-panel" role="tabpanel" hidden={tab !== 'template'}>
          {tab === 'template' && <TemplateBuilder />}
        </div>
      </main>
    </div>
  );
}
