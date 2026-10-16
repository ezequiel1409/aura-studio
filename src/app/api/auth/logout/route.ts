import { NextResponse } from "next/server";
import { CUSTOMER_SESSION_COOKIE_NAME } from "../../../../infra/auth/customer-session";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(CUSTOMER_SESSION_COOKIE_NAME);
  return res;
}

