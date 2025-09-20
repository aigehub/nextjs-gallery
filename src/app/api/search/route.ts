import { queryData } from "@/app/libs/data";
import { error } from "console";
import { headers } from "next/headers";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const headersList = await headers();
  const ua = headersList.get("user-agenet");
  const referer = headersList.get("referer");
  console.log("ua:", ua, "referer:", referer, "origin:", req.nextUrl.origin);
  if (!ua || referer !== "jaysen") {
    return Response.json({ error: "bad request" }, { status: 400 });
  }
  const params = req.nextUrl.searchParams;
  const page = params.get("page") || "1";
  const district = params.get("district") || "";
  const name = params.get("name") || "";
  const bust = params.get("bust") || undefined;
  const max_price = params.get("max_price")
    ? parseInt(params.get("max_price") as string)
    : undefined;
  const province = params.get("province") || undefined;
    let plat = parseInt(params.get("p")?.toString() || "1");
  const offset = parseInt(page, 10);

  const data = await queryData({
      max_price,
      province,
      bust,
      offset: offset,
      limit: 20,
      name,
      district_name: district,
      platform:plat,
    });
  const newJson = { current_page: page, limit: data.page_data.length, ...data };
  return new Response(JSON.stringify(newJson, null, 2), { status: 200 });
}
