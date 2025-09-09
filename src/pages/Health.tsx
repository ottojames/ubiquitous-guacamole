import React from "react";

export default function Health() {
  const ping = async () => {
    try {
      const { supabase } = await import("../lib/supabaseClient");
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        alert(`Supabase error: ${error.message}`);
      } else {
        alert("Supabase client OK ✅ (no session is normal)");
        console.log("Auth session:", data);
      }
    } catch (e: any) {
      alert(`Ping failed: ${e?.message ?? String(e)}`);
      console.error(e);
    }
  };

  return (
    <div style={{ padding: 24, fontFamily: "Inter, system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Health</h1>
      <p>This page should render even if Supabase is misconfigured.</p>
      <button
        onClick={ping}
        style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", cursor: "pointer" }}
      >
        Ping Supabase
      </button>
    </div>
  );
}
