import crypto from "crypto";

export function graphBase(v: string): string {
  return `https://graph.facebook.com/${v}`;
}

export function appSecretProof(token: string, appSecret?: string): string | undefined {
  if (!token || !appSecret) return undefined;
  const h = crypto.createHmac("sha256", appSecret).update(token).digest("hex");
  return h;
}

export interface ProxyFetchOptions {
  url: string;
  params?: Record<string, any>;
  token: string;
  appSecret?: string;
  signal?: AbortSignal;
}

export interface ProxyFetchResponse {
  json: any;
  headers: Record<string, string>;
}

export async function proxyFetch({ 
  url, 
  params, 
  token, 
  appSecret, 
  signal 
}: ProxyFetchOptions): Promise<ProxyFetchResponse> {
  const u = new URL(url);
  
  // Add parameters to URL
  for (const [k, v] of Object.entries(params || {})) {
    if (v !== undefined) {
      u.searchParams.set(k, String(v));
    }
  }
  
  u.searchParams.set("access_token", token);
  
  // Add app secret proof for security
  const proof = appSecretProof(token, appSecret);
  if (proof) {
    u.searchParams.set("appsecret_proof", proof);
  }

  let lastErr: any;
  
  // Retry logic with exponential backoff
  for (let i = 0; i < 3; i++) {
    try {
      const res = await fetch(u.toString(), { signal });
      const body = await res.text();
      
      const headers: Record<string, string> = {};
      for (const [key, value] of res.headers.entries()) {
        headers[key.toLowerCase()] = value;
      }
      
      if (!res.ok) {
        throw new Error(`${res.status} ${res.statusText}: ${body}`);
      }
      
      return { 
        json: body ? JSON.parse(body) : {}, 
        headers 
      };
    } catch (e) {
      lastErr = e;
      if (i < 2) { // Don't wait after last attempt
        await new Promise((r) => setTimeout(r, 400 * (i + 1) ** 2));
      }
    }
  }
  
  throw lastErr;
}
