import * as React from 'react';
import { useNavigate } from 'react-router-dom';

import AddressSearch, { type AddressItem } from '@/components/address/AddressSearch';

export default function HomeRoute() {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = React.useState('');

  const goToPublish = React.useCallback(
    (value: string) => {
      const trimmed = value.trim();
      if (!trimmed) return;
      try {
        window.sessionStorage?.setItem('pn:publish:q', trimmed);
      } catch {
        // ignore storage limitations
      }
      navigate(`/publish?q=${encodeURIComponent(trimmed)}`, { state: { q: trimmed } });
    },
    [navigate],
  );

  const handleManualCommit = React.useCallback(
    (value: string) => {
      setSearchValue(value);
      goToPublish(value);
    },
    [goToPublish],
  );

  const handlePick = React.useCallback(
    (item: AddressItem) => {
      const label = item?.label?.trim() || [item.line1, item.town, item.postcode].filter(Boolean).join(', ');
      setSearchValue(label);
      goToPublish(label);
    },
    [goToPublish],
  );

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-3xl flex-col justify-center px-4 py-16">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-semibold text-slate-900">
          Search, publish, and verify statutory notices — instantly, with an audit trail
        </h1>
        <p className="mt-3 text-base text-slate-600">
          Give residents a voice. Keep licensing transparent and accountable.
        </p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-xl backdrop-blur">
        <div className="flex flex-col gap-3">
          <AddressSearch
            value={searchValue}
            onChange={handleManualCommit}
            onPick={handlePick}
            inputTestId="home-address-input"
            autoFocus
            placeholder="Enter premises address or postcode"
          />
          <p className="text-xs text-slate-500">
            Start typing to see suggestions instantly. Press Enter to continue into the Publish flow.
          </p>
        </div>
      </section>
    </main>
  );
}
