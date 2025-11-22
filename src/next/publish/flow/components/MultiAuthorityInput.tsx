import React, { useState } from 'react';

export type LicensingAuthority = {
  id: string;
  name: string;
  address: string;
  email: string;
};

export type MultiAuthorityInputProps = {
  authorities: LicensingAuthority[];
  onChange: (authorities: LicensingAuthority[]) => void;
  label?: string;
  hint?: string;
};

/**
 * MultiAuthorityInput Component
 *
 * Allows officers to specify multiple licensing authorities for premises
 * that straddle licensing authority boundaries (CRIT-008 compliance).
 *
 * Used when ADDITIONAL_LICENSING_AUTHORITIES field is present in the schema.
 */
export default function MultiAuthorityInput({
  authorities,
  onChange,
  label = 'Additional licensing authorities',
  hint = 'Add authorities if the premises straddles multiple licensing authority boundaries.',
}: MultiAuthorityInputProps) {
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleAdd = () => {
    const newAuthority: LicensingAuthority = {
      id: `authority-${Date.now()}`,
      name: '',
      address: '',
      email: '',
    };
    onChange([...authorities, newAuthority]);
    setEditingId(newAuthority.id);
  };

  const handleRemove = (id: string) => {
    onChange(authorities.filter((auth) => auth.id !== id));
    if (editingId === id) {
      setEditingId(null);
    }
  };

  const handleUpdate = (id: string, field: keyof Omit<LicensingAuthority, 'id'>, value: string) => {
    onChange(
      authorities.map((auth) =>
        auth.id === id ? { ...auth, [field]: value } : auth
      )
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-slate-900">
          {label}
        </label>
        {hint && (
          <p className="mt-1 text-sm text-slate-600">{hint}</p>
        )}
      </div>

      {authorities.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
          <p className="text-sm text-slate-600">
            No additional authorities added. Click "Add authority" if the premises crosses boundary lines.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {authorities.map((authority, index) => (
            <div
              key={authority.id}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-slate-900">
                  Authority {index + 1}
                </h4>
                <button
                  type="button"
                  onClick={() => handleRemove(authority.id)}
                  className="text-sm text-red-600 hover:text-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                  aria-label={`Remove authority ${index + 1}`}
                >
                  Remove
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label
                    htmlFor={`authority-${authority.id}-name`}
                    className="block text-xs font-medium text-slate-700"
                  >
                    Authority name
                  </label>
                  <input
                    id={`authority-${authority.id}-name`}
                    type="text"
                    value={authority.name}
                    onChange={(e) => handleUpdate(authority.id, 'name', e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="e.g., Westminster City Council"
                  />
                </div>

                <div>
                  <label
                    htmlFor={`authority-${authority.id}-address`}
                    className="block text-xs font-medium text-slate-700"
                  >
                    Address
                  </label>
                  <textarea
                    id={`authority-${authority.id}-address`}
                    value={authority.address}
                    onChange={(e) => handleUpdate(authority.id, 'address', e.target.value)}
                    rows={3}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="Full postal address including postcode"
                  />
                </div>

                <div>
                  <label
                    htmlFor={`authority-${authority.id}-email`}
                    className="block text-xs font-medium text-slate-700"
                  >
                    Email address
                  </label>
                  <input
                    id={`authority-${authority.id}-email`}
                    type="email"
                    value={authority.email}
                    onChange={(e) => handleUpdate(authority.id, 'email', e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="licensing@authority.gov.uk"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={handleAdd}
        className="inline-flex items-center gap-2 rounded-lg border border-blue-600 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
        Add authority
      </button>
    </div>
  );
}
