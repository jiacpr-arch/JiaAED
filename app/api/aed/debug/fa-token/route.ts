import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  const candidates = [
    process.env.ADMIN_HMAC_SECRET,
    process.env.ADMIN_COOKIE_SECRET,
    process.env.ADMIN_PASSWORD,
    process.env.DEBUG_KEY,
  ].filter((v): v is string => !!v);
  if (candidates.length === 0 || !key || !candidates.includes(key)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const TOKEN_URL = process.env.FLOWACCOUNT_TOKEN_URL ?? "";
  const BASE_URL = process.env.FLOWACCOUNT_BASE_URL ?? "";
  const CLIENT_ID = process.env.FLOWACCOUNT_CLIENT_ID ?? "";
  const CLIENT_SECRET = process.env.FLOWACCOUNT_CLIENT_SECRET ?? "";

  const env = {
    TOKEN_URL,
    BASE_URL,
    CLIENT_ID_set: !!CLIENT_ID,
    CLIENT_ID_length: CLIENT_ID.length,
    CLIENT_ID_prefix: CLIENT_ID.slice(0, 6),
    CLIENT_SECRET_set: !!CLIENT_SECRET,
    CLIENT_SECRET_length: CLIENT_SECRET.length,
  };

  if (!TOKEN_URL || !CLIENT_ID || !CLIENT_SECRET) {
    return NextResponse.json({ env, error: "missing FA env vars" }, { status: 200 });
  }

  let res: Response;
  try {
    res = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        scope: "flowaccount-api",
      }),
    });
  } catch (err) {
    return NextResponse.json({ env, fetch_error: String(err) }, { status: 200 });
  }

  const text = await res.text();
  const headers = Object.fromEntries(res.headers.entries());

  return NextResponse.json(
    {
      env,
      response: {
        status: res.status,
        statusText: res.statusText,
        headers,
        body: text,
      },
    },
    { status: 200 },
  );
}
