import { NextResponse } from "next/server";
import { createSessionCookieValue, verifyPassword, ADMIN_COOKIE_NAME, ADMIN_COOKIE_MAX_AGE } from "@/lib/auth";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "リクエストの形式が正しくありません。" }, { status: 400 });
  }

  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "管理者パスワードが設定されていません。" }, { status: 500 });
  }

  if (!verifyPassword(body?.password)) {
    return NextResponse.json({ error: "パスワードが正しくありません。" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE_NAME, createSessionCookieValue(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_COOKIE_MAX_AGE,
  });
  return res;
}
