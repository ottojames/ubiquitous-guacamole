import * as React from 'react';
import { Outlet } from 'react-router-dom';
import StepBar from '@/components/ui/StepBar';

const steps = [
  { key: 'type',    label: 'Confirm Notice Type', href: '/next/publish/type' },
  { key: 'upload',  label: 'Upload your Notice',  href: '/next/publish/upload' },
  { key: 'confirm', label: 'Confirm your Notice', href: '/next/publish/confirm' },
  { key: 'pay',     label: 'Pay',                 href: '/next/publish/pay' },
] as const;

export default function PublishLayout() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6">
        <StepBar steps={steps as any} />
      </div>
      <div className="rounded-2xl border bg-card shadow-sm p-6">
        <Outlet />
      </div>
    </div>
  );
}
