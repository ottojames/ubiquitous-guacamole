import React from 'react';
import * as UI from '@/styles/ui';
import type { NoticeDraft } from '@/types/notice';
import { calcRepsDeadline } from '@/lib/licensing/checks';

type ApplicationBasicsProps = {
  draft: NoticeDraft;
  onChange: (p: Partial<NoticeDraft>) => void;
  refs?: { applicationDate?: React.RefObject<HTMLInputElement> };
};

export default function ApplicationBasicsSection(props: ApplicationBasicsProps) {
  const { draft, onChange, refs } = props;
  return (
    <div className="mt-4">
      <label htmlFor="applicationDate" className={UI.label}>
        Date of submission<span className="text-rose-600">*</span>
      </label>
      <input
        id="applicationDate"
        type="date"
        className={UI.input}
        ref={refs?.applicationDate}
        data-testid="input-application-date"
        value={draft.applicationDate}
        onChange={(e) => {
          const v = e.target.value;
          onChange({ applicationDate: v, repsDeadline: v ? calcRepsDeadline(v) : '' });
        }}
      />
    </div>
  );
}

