import * as UI from '@/styles/ui';
import type { NoticeType } from '@/types/notice';

export default function NoticeTypeStep({
  value,
  onChange,
}: { value?: NoticeType; onChange: (t: NoticeType) => void }) {
  return (
    <section className={UI.card + ' p-5 md:p-6'} data-testid="notice-type-step">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Confirm Notice Type</h2>
      </div>
      <div className="mt-3">
        <select
          className={UI.input}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value as NoticeType)}
          data-testid="select-notice-type"
        >
          <option value="" disabled>Select a type…</option>
          <option value="premises">Premises Licence (Licensing Act 2003)</option>
          <option value="gvol">Goods Vehicle Operator</option>
          <option value="tro">Traffic Regulation Order</option>
          <option value="planning">Planning</option>
          <option value="gambling">Gambling</option>
          <option value="probate">Probate</option>
          <option value="other">Other</option>
        </select>
      </div>
    </section>
  );
}

