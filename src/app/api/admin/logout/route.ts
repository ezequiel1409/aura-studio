import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE_NAME } from "../../../../infra/auth/guard";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(ADMIN_SESSION_COOKIE_NAME);
  return res;
}
