import React, { useState } from "react";

interface NoticeForm {
  type: string;
  title: string;
  address: string;
  description: string;
  opening_hours: string;
}

export default function Publish() {
  const [form, setForm] = useState<NoticeForm>({
    type: "",
    title: "",
    address: "",
    description: "",
    opening_hours: "",
  });
  const [status, setStatus] = useState<string | null>(null);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus(null);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/notices`,
        {
          method: "POST",
          headers: {
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
            Prefer: "return=representation",
          },
          body: JSON.stringify(form),
        }
      );
      if (!res.ok) throw new Error(await res.text());
      setStatus("Notice published!");
      setForm({ type: "", title: "", address: "", description: "", opening_hours: "" });
    } catch {
      setStatus("Failed to publish notice");
    }
  }

  return (
    <main className="max-w-xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-semibold mb-4">Publish a Notice</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="type"
          value={form.type}
          onChange={handleChange}
          required
          className="w-full rounded border border-slate-300 p-2"
          placeholder="Type"
        />
        <input
          name="title"
          value={form.title}
          onChange={handleChange}
          required
          className="w-full rounded border border-slate-300 p-2"
          placeholder="Title"
        />
        <input
          name="address"
          value={form.address}
          onChange={handleChange}
          className="w-full rounded border border-slate-300 p-2"
          placeholder="Address"
        />
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          className="w-full rounded border border-slate-300 p-2"
          placeholder="Description"
        />
        <input
          name="opening_hours"
          value={form.opening_hours}
          onChange={handleChange}
          className="w-full rounded border border-slate-300 p-2"
          placeholder="Opening hours"
        />
        <button
          type="submit"
          className="h-10 px-4 rounded bg-blue-600 text-white hover:bg-blue-700"
        >
          Submit
        </button>
      </form>
      {status && <p className="mt-4 text-sm text-slate-600">{status}</p>}
    </main>
  );
}

