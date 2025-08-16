import crypto from "crypto";


export function graphBase(v: string) {
  retur `https://graph.facebook.com/${v}`;
}

export function appSecretProof(token: string, appSecret?: string) {
  if (!token || !appSecret) return undefined;
  const h = crypto.createHmac("sha256", appSecret).update(token).digest("hex");
  return h;
}

export async function proxyFetch({ url, params, token, appSecret, signal }: any) {
  const u = new URL(url);
  for (const [k, v] of Object.entries(params || {})) if (v !== undefined) u.searchParams.set(k, String(v));

  u.searchParams.set("access_token", token);
  const proof = appSecretProof(token, appSecret);
  if (proof) u.searchParams.set("appsecret_proof", proof);
  let lastErr: any;
  for (let i = 0; i < 3; i++) {
    try {
      const res = await fetch(u as any, { signal } as any);
      const body = await res.text();
      const headers: Record<string, string> = {};
      for (const [key, value] of (res.headers as any).entries()) headers[key.toLowerCase()] = value as any;
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${body}`);
      return { json: body ? JSON.parse(body) : {}, headers };
    } catch (e) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, 400 * (i + 1) ** 2));
    }
  }
  throw lastErr;
}`
