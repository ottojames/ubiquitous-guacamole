import React, { useState } from 'react';
import * as UI from '@/styles/ui';
import UploadNoticeFlow from '@/components/publish/UploadNoticeFlow';
import TemplateBuilder from './publish';

export default function PublishPage() {
  const [tab, setTab] = useState<'notice' | 'template'>('notice');
  return (
    <div className={UI.gradientBg} data-testid="publish-layout">
      <div className="px-4 md:px-6 lg:px-8">
        <h1 className={UI.h1 + ' mb-6'}>Publish a notice</h1>
        <div className="mb-4 flex gap-2">
          <button className="px-4 py-2 rounded" onClick={() => setTab('notice')}>Upload from Notice</button>
          <button className="px-4 py-2 rounded" onClick={() => setTab('template')}>Upload via Template</button>
        </div>
        {tab === 'notice' ? <UploadNoticeFlow /> : <TemplateBuilder />}
      </div>
    </div>
  );
}
