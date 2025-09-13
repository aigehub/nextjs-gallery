import { NextRequest } from "next/server";
import prisma from "../../../../prisma/database_api";
import { headers } from "next/headers";
import { insertData } from "@/app/libs/data";

export async function POST(req: NextRequest) {
  console.log("nextUrl:", req.nextUrl);
  console.log("nextUrl:", req.headers);
  if (!req.headers.get("user-agent")) {
    console.log("no user agent");
    return;
  }
  const headersList = await headers();
  const referer = headersList.get("referer");
  const action = headersList.get("action");
  switch (action) {
    case "insert":
      //todo insert scrawl data
      //   req.json()
      const data = await req.body?.getReader().read();
      console.log(data);

      if (data?.done == true) {
        const data_str = new String(data?.value);
        const result = await insertData(JSON.parse(data_str.trim()));
        console.log("insertData done:", result);
      } else {
        console.log("no data");
      }
      break;
  }
  return new Response("Hello, Next.js!", {
    status: 200,
    headers: { referer: referer ?? "unknown, not set" },
  });
}
