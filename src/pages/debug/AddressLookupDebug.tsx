import React, { useMemo, useState } from "react";
import AddressLookup, {
  mockProvider,
  getAddressProvider,
  type AddressResult,
} from "@/components/AddressLookup";
import { getGetAddressKey } from "@/lib/env";

export default function AddressLookupDebug() {
  const [lastResolved, setLastResolved] = useState<AddressResult | null>(null);

  const provider = useMemo(() => {
    const key = getGetAddressKey();
    return key ? getAddressProvider(key) : mockProvider;
  }, []);

  const isLive = Boolean(getGetAddressKey());

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-xl space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">AddressLookup Debug</h1>
          <span
            className={`text-xs px-2 py-1 rounded-full ${isLive ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}
          >
            {isLive ? "getAddress.io (live)" : "Mock provider"}
          </span>
        </div>
        <div className="relative overflow-visible rounded-2xl border bg-white p-4 shadow-sm">
          <AddressLookup
            provider={provider}
            onResolved={(addr) => setLastResolved(addr)}
            placeholder="Type SW1A, W1A, etc."
          />
        </div>
        <div>
          <h2 className="text-sm font-medium text-gray-700">Last resolved address</h2>
          <pre className="mt-2 max-h-64 overflow-auto rounded-lg border bg-white p-3 text-xs text-gray-800">
            {JSON.stringify(lastResolved, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
