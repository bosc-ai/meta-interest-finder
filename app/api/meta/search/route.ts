import { NextRequest, NextResponse } from "next/server";
import { graphBase, proxyFetch } from "../_utils";

export async function GET(req: NextRequest) {
  const v = req.headers.get("x-api-version") || "v20.0";
  const token = process.env.META_TOKEN!;
  const appSecret = process.env.META_APP_SECRET;
  if (!token) return NextResponse.json({ error: "Server not configured with META_TOKEN" }, { status: 500 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "interests";
  const q = searchParams.get("q") || "";
  const limit = Number(searchParams.get("limit") || 50);
  const locale = searchParams.get("locale") || "en_US";

  let endpoint = "";
  const params: any = { limit, locale };
  switch (type) {
    case "interests":
      endpoint = "/search";
      params.type = "adinterest";
      params.q = q;
      break;
    case "behaviors":
      endpoint = "/search";
      params.type = "adtargetingcategory";
      params.class = "behaviors";
      break;
    case "job_titles":
      endpoint = "/search";
      params.type = "adworkposition";
      params.q = q;
      break;
    case "employers":
      endpoint = "/search";
      params.type = "adworkemployer";
      params.q = q;
      break;
    case "demographics":
      endpoint = "/search";
      params.type = "adtargetingcategory";
      params.class = "demographics";
      break;
    case "life_events":
      endpoint = "/search";
      params.type = "adtargetingcategory";
      params.class = "life_events";
      break;
    case "industries":
      endpoint = "/search";
      params.type = "adtargetingcategory";
      params.class = "industries";
      break;
    case "geos":
      endpoint = "/search";
      params.type = "adgeolocation";
      params.q = q;
      params.location_types = JSON.stringify(["country","region","city","zip"]);
      break;
    default:
      return NextResponse.json({ error: "Unknown type" }, { status: 400 });
  }

  const url = graphBase(v) + endpoint;
  const { json, headers } = await proxyFetch({ url, params, token, appSecret });
  const res = NextResponse.json(json);
  if (headers["x-app-usage"]) res.headers.set("x-app-usage", headers["x-app-usage"]);
  return res;
}
