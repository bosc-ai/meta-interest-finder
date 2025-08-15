import { NextRequest, NextResponse } from "next/server";
import { graphBase, proxyFetch } from "../_utils";

export async function GET(req: NextRequest) {
  const v = req.headers.get("x-api-version") || "v20.0";
  const token = process.env.META_TOKEN!;
  const appSecret = process.env.META_APP_SECRET;
  if (!token) return NextResponse.json({ error: "Server not configured with META_TOKEN" }, { status: 500 });

  const { searchParams } = new URL(req.url);
  const seeds = searchParams.get("seeds");
  const limit = Number(searchParams.get("limit") || 50);
  const locale = searchParams.get("locale") || "en_US";
  if (!seeds) return NextResponse.json({ error: "Missing seeds" }, { status: 400 });

  const url = graphBase(v) + "/search";
  const params: any = { type: "adinterestsuggestion", interest_list: seeds, limit, locale };

  const { json, headers } = await proxyFetch({ url, params, token, appSecret });
  const res = NextResponse.json(json);
  if (headers["x-app-usage"]) res.headers.set("x-app-usage", headers["x-app-usage"]);
  return res;
}
