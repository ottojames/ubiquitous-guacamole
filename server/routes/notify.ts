import { Router } from "express";

const router = Router();

router.post("/notice-saved", async (req, res) => {
  try {
    const { applicantEmail, councilEmail, draftId, uploads } = req.body || {};
    if (!applicantEmail) return res.status(400).json({ error: "Missing applicantEmail" });
    const key = process.env.RESEND_API_KEY;
    if (!key) return res.status(500).json({ error: "Missing RESEND_API_KEY" });

    const subject = `Notice saved (draft ${draftId})`;
    const html = `
      <div style="font-family:system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif;padding:12px">
        <h2>Notice saved</h2>
        <p>Your notice has been saved as a draft.</p>
        ${Array.isArray(uploads) && uploads.length ? `
          <p><strong>Files:</strong></p>
          <ul>${uploads.map((u: any) => `<li><a href="${u.url}">${u.filename}</a></li>`).join("")}</ul>
        ` : ""}
        <p>You can return to the portal to complete submission.</p>
      </div>
    `;

    const toList = [applicantEmail, councilEmail].filter(Boolean);
    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        from: "Public Notice Portal <no-reply@notices.example>",
        to: toList,
        subject,
        html,
      }),
    });
    if (!resp.ok) {
      const text = await resp.text();
      return res.status(500).json({ error: `Resend error ${resp.status}: ${text}` });
    }
    return res.json({ ok: true });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "Server error" });
  }
});

export default router;
