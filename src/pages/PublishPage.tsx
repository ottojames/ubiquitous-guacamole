import React, { useEffect, useRef, useState } from 'react';
import NoticeTypeSelect, { NoticeType } from '../components/publish/NoticeTypeSelect';
import PremisesForm from '../components/publish/PremisesForm';
import TrafficForm from '../components/publish/TrafficForm';
import GamblingForm from '../components/publish/GamblingForm';
import Reveal from '../components/publish/Reveal';
import { supabase } from '../lib/supabase';

export default function PublishPage() {
  const [type, setType] = useState<NoticeType | ''>('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const announceRef = useRef<HTMLDivElement>(null);

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
        postcode: data.postcode ?? null,
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
    <main className="max-w-xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-semibold mb-4">Publish a Notice</h1>
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
    </main>
  );
}
