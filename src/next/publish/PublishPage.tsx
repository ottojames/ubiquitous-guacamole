import * as UI from '@/styles/ui';
import NewPublishFlow from './flow/NewPublishFlow';

export default function PublishPage() {
  return (
    <div className="max-w-7xl mx-auto py-8">
      <h1 className={`${UI.heroH1} mb-2`}>Publish a notice</h1>
      <NewPublishFlow />
    </div>
  );
}
