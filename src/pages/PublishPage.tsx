import React, { useEffect, useRef, useState } from 'react';
import NoticeTypeSelect, { NoticeType } from '../components/publish/NoticeTypeSelect';
import PremisesForm from '../components/publish/PremisesForm';
import TrafficForm from '../components/publish/TrafficForm';
import GamblingForm from '../components/publish/GamblingForm';
import Reveal from '../components/publish/Reveal';
import { supabase } from '../lib/supabase';
import SiteHeader from '../components/SiteHeader';
import BlueNoticeUpload from '../components/BlueNoticeUpload';

export default function PublishPage() {
  const [type, setType] = useState<NoticeType | ''>('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const announceRef = useRef<HTMLDivElement>(null);

  function handleUploaded(files: any[]) {
    localStorage.setItem('blueNoticeUploads', JSON.stringify(files));
    window.location.href = '/details';
  }

  useEffect(() => {
    if (type && firstFieldRef.current) firstFieldRef.current.focus();
    if (type && announceRef.current) {
      const label =
        type === 'premises'
          ? 'Premises Licence form'
          : type === 'traffic'
          ? 'Traffic notice form'
          : 'Gambling licence form';
      announceRef.current.textContent = `${label} loaded`;
    }
  }, [type]);

  async function submit(type: NoticeType, data: Record<string, unknown>) {
    setSaving(true);
    setError('');
    try {
      const { error } = await supabase.from('notices').insert({
        type,
        payload: JSON.stringify(data),
        applicant_email: data.applicantEmail,
        council_email: data.councilEmail,
        address_line1: data.address_line1 ?? null,
        address_line2: data.address_line2 ?? null,
        city: data.city ?? null,
        status: 'draft',
      });
      if (error) throw error;
      // TODO: integrate Stripe Checkout
      window.location.href = '/success';
    } catch {
      setError('Unable to save notice');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{
        background: 'linear-gradient(112deg, #192650 0%, #3866af 50%, #ffffff 100%)',
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          zIndex: 1,
          background: 'radial-gradient(ellipse at 65% 40%, rgba(255,255,255,0.24) 0%, transparent 80%)',
          mixBlendMode: 'lighten',
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          zIndex: 1,
          background: 'linear-gradient(120deg, rgba(53,136,255,0.70) 0%, rgba(120,126,255,0.60) 50%, rgba(204,148,255,0.6) 100%)',
          mixBlendMode: 'lighten',
        }}
      />
      <SiteHeader />
      <main className="relative z-10 flex-1 flex items-start justify-center py-10 px-4">
        <div className="w-full max-w-xl bg-white/95 rounded-2xl ring-1 ring-slate-200 shadow p-6">
          <h1 className="text-2xl font-semibold mb-4">Publish a Notice</h1>
          <BlueNoticeUpload onUploaded={handleUploaded} />
          <NoticeTypeSelect value={type} onChange={setType} />
          <div ref={announceRef} aria-live="polite" className="sr-only" />
          <Reveal show={type === 'premises'}>
            {type === 'premises' && (
              <PremisesForm
                onSubmit={(d) => submit('premises', d as unknown as Record<string, unknown>)}
                saving={saving}
                autoFocusRef={firstFieldRef}
              />
            )}
          </Reveal>
          <Reveal show={type === 'traffic'}>
            {type === 'traffic' && (
              <TrafficForm
                onSubmit={(d) => submit('traffic', d as unknown as Record<string, unknown>)}
                saving={saving}
                autoFocusRef={firstFieldRef}
              />
            )}
          </Reveal>
          <Reveal show={type === 'gambling'}>
            {type === 'gambling' && (
              <GamblingForm
                onSubmit={(d) => submit('gambling', d as unknown as Record<string, unknown>)}
                saving={saving}
                autoFocusRef={firstFieldRef}
              />
            )}
          </Reveal>
          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        </div>
      </main>
    </div>
  );
}
