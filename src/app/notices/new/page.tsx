"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import AddressAutocomplete from "@/components/AddressAutocomplete";

type FormState = {
  address_line1: string;
  address_line2: string;
  city: string;
  postcode: string;
  activities: string[];
  opening_start: string;
  opening_end: string;
  council_email: string;
  applicant_email: string;
};

const LICENSABLE_ACTIVITIES = [
  "Sale by retail of alcohol",
  "Provision of late night refreshment",
  "Plays",
  "Films",
  "Indoor sporting events",
  "Boxing or wrestling entertainment",
  "Live music",
  "Recorded music",
  "Performances of dance",
] as const;

export default function NewNoticePage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [noticeId, setNoticeId] = useState<string | null>(null);
  const [preview, setPreview] = useState("");

  const [form, setForm] = useState<FormState>({
    address_line1: "",
    address_line2: "",
    city: "",
    postcode: "",
    activities: [],
    opening_start: "09:00",
    opening_end: "23:00",
    council_email: "",
    applicant_email: "",
  });

  const selected = (a: string) => form.activities.includes(a);
  const toggleActivity = (a: string) =>
    setForm((f) => ({
      ...f,
      activities: selected(a) ? f.activities.filter((x) => x !== a) : [...f.activities, a],
    }));

  const buildPreview = () => {
    const body = `LICENSING ACT 2003

Notice of application for a premises licence

I/We hereby give notice that an application has been made for a premises licence in respect of:

Address: ${form.address_line1}${form.address_line2 ? ", " + form.address_line2 : ""}${form.city ? ", " + form.city : ""}${form.postcode ? ", " + form.postcode : ""}.

Licensable activities applied for:
- ${form.activities.join("\n- ")}

Opening hours: ${form.opening_start} to ${form.opening_end}

Any representations must be made to the Licensing Authority via ${form.council_email}.`;
    setPreview(body);
  };

  const saveDraft = async () => {
    const { data, error } = await supabase
      .from("notices")
      .insert({
        status: "pending_payment",
        applicant_email: form.applicant_email,
        council_email: form.council_email,
        address_line1: form.address_line1,
        address_line2: form.address_line2 || null,
        city: form.city || null,
        postcode: form.postcode,
        activities: form.activities,
        opening_hours: { start: form.opening_start, end: form.opening_end },
        notice_markdown: preview,
      })
      .select("id")
      .single();

    if (error) {
      alert(error.message);
      return;
    }
    setNoticeId(data!.id);
  };

  const goCheckout = async () => {
    const res = await fetch("/api/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ noticeId }),
    });
    const { url } = await res.json();
    window.location.href = url;
  };

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="text-3xl font-bold mb-6">Premises Notice</h1>

      {step === 1 && (
        <div className="space-y-6">
          {/* Address */}
          <div>
            <label className="block text-sm font-medium mb-2">Premises address</label>
            <AddressAutocomplete
              onSelect={(s) =>
                setForm((f) => ({
                  ...f,
                  address_line1: s.line1 || "",
                  address_line2: s.line2 || "",
                  city: s.city || "",
                  postcode: s.postcode || "",
                }))
              }
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <input
                className="rounded border px-3 py-2"
                placeholder="Address line 1"
                value={form.address_line1}
                onChange={(e) => setForm({ ...form, address_line1: e.target.value })}
              />
              <input
                className="rounded border px-3 py-2"
                placeholder="Address line 2"
                value={form.address_line2}
                onChange={(e) => setForm({ ...form, address_line2: e.target.value })}
              />
              <input
                className="rounded border px-3 py-2"
                placeholder="City/Town"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
              <input
                className="rounded border px-3 py-2"
                placeholder="Postcode"
                value={form.postcode}
                onChange={(e) => setForm({ ...form, postcode: e.target.value })}
              />
            </div>
          </div>

          {/* Activities */}
          <div>
            <label className="block text-sm font-medium mb-2">What are you applying for?</label>
            <div className="grid sm:grid-cols-2 gap-2">
              {LICENSABLE_ACTIVITIES.map((a) => (
                <label key={a} className="flex items-center gap-2 rounded border px-3 py-2">
                  <input type="checkbox" checked={selected(a)} onChange={() => toggleActivity(a)} />
                  <span>{a}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Hours */}
          <div>
            <label className="block text-sm font-medium mb-2">Opening hours</label>
            <div className="flex items-center gap-3">
              <input
                type="time"
                className="rounded border px-3 py-2"
                value={form.opening_start}
                onChange={(e) => setForm({ ...form, opening_start: e.target.value })}
              />
              <span>to</span>
              <input
                type="time"
                className="rounded border px-3 py-2"
                value={form.opening_end}
                onChange={(e) => setForm({ ...form, opening_end: e.target.value })}
              />
            </div>
          </div>

          {/* Emails */}
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-2">Council licensing email</label>
              <input
                type="email"
                className="w-full rounded border px-3 py-2"
                value={form.council_email}
                onChange={(e) => setForm({ ...form, council_email: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Your email</label>
              <input
                type="email"
                className="w-full rounded border px-3 py-2"
                value={form.applicant_email}
                onChange={(e) => setForm({ ...form, applicant_email: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <button
              className="rounded-xl border px-4 py-2"
              onClick={() => {
                buildPreview();
                setStep(2);
              }}
            >
              Next: Preview
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Preview</h2>
          <pre className="whitespace-pre-wrap rounded-xl border bg-gray-50 p-4">{preview}</pre>
          <div className="flex items-center gap-3">
            <button className="rounded-xl border px-4 py-2" onClick={() => setStep(1)}>
              Back
            </button>
            <button
              className="rounded-xl bg-black text-white px-4 py-2"
              onClick={async () => {
                await saveDraft();
                setStep(3);
              }}
            >
              Confirm & Continue to Payment
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <p>When you’re ready, proceed to checkout.</p>
          <button
            className="rounded-xl bg-black text-white px-4 py-2"
            onClick={goCheckout}
            disabled={!noticeId}
          >
            Pay with Stripe
          </button>
        </div>
      )}
    </div>
  );
}