import { headers } from "next/headers";

export function validOrigin(origin: string | null, requestUrl?: string) {
  if (!origin) return false;
  try {
    if (process.env.SITE_URL) return origin === new URL(process.env.SITE_URL).origin;
    if (process.env.NODE_ENV === "production") return false;
    return Boolean(requestUrl && origin === new URL(requestUrl).origin);
  } catch {
    return false;
  }
}

export async function validActionOrigin() {
  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin");
  return validOrigin(origin, `http://${requestHeaders.get("host") ?? ""}`);
}

export const originError = "İstek kaynağı doğrulanamadı.";

const maxFormBytes = 128 * 1024;

export async function readAdminForm(request: Request) {
  let bytes = 0;
  if (Number(request.headers.get("content-length")) > maxFormBytes) return { status: 413, error: "Form verisi çok büyük." };
  const bounded = request.body?.pipeThrough(new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      bytes += chunk.byteLength;
      if (bytes > maxFormBytes) controller.error(new Error("Form limit"));
      else controller.enqueue(chunk);
    },
  }));
  try {
    const form = await new Response(bounded, {
      headers: { "Content-Type": request.headers.get("content-type") ?? "" },
    }).formData();
    if (Array.from(form.values()).some((value) => typeof value !== "string")) return { status: 400, error: "Dosya yüklenemez." };
    return { form };
  } catch {
    return bytes > maxFormBytes
      ? { status: 413, error: "Form verisi çok büyük." }
      : { status: 400, error: "Form verisi okunamadı." };
  }
}
