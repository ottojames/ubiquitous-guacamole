import { NextRequest } from "next/server";
import { z } from "zod";
import { normalizeAddressBody, normalizePostcode } from "@/utils/address";

const NoticePayloadSchema = z.object({
  addressBody: z.string().min(1),
  postcode: z.string().min(1),
  noticeText: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const data = await req.json().catch(() => null);
  const parsed = NoticePayloadSchema.safeParse(data);
  if (!parsed.success) {
    return new Response(JSON.stringify({ ok: false, error: "VALIDATION_ERROR" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const { addressBody, postcode, noticeText } = parsed.data;
  const normalizedPostcode = normalizePostcode(postcode);
  const cleanBody = normalizeAddressBody(addressBody, normalizedPostcode);

  // In a real app this would persist to a database. For now we echo the normalized payload.
  return new Response(
    JSON.stringify({
      ok: true,
      notice: {
        addressBody: cleanBody,
        postcode: normalizedPostcode,
        noticeText: noticeText.trim(),
      },
    }),
    {
      status: 200,
      headers: { "content-type": "application/json" },
    }
  );
}
