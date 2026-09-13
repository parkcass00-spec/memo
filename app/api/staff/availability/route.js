import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { isValidEmployee } from "@/lib/employees";
import { availabilityKey, isValidMonth, isValidDateKey } from "@/lib/date-utils";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month");
  const name = (searchParams.get("name") || "").trim();

  if (!isValidMonth(month) || !name) {
    return NextResponse.json({ error: "パラメータが正しくありません。" }, { status: 400 });
  }

  const valid = await isValidEmployee(name);
  if (!valid) {
    return NextResponse.json({ error: "登録されていない名前です。" }, { status: 404 });
  }

  const raw = await redis.get(availabilityKey(month, name));
  return NextResponse.json({ dates: Array.isArray(raw) ? raw : [] });
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "リクエストの形式が正しくありません。" }, { status: 400 });
  }

  const { month, dates } = body || {};
  const name = (body?.name || "").trim();

  if (!isValidMonth(month) || !name || !Array.isArray(dates)) {
    return NextResponse.json({ error: "パラメータが正しくありません。" }, { status: 400 });
  }

  const valid = await isValidEmployee(name);
  if (!valid) {
    return NextResponse.json({ error: "登録されていない名前です。" }, { status: 404 });
  }

  const cleanDates = [...new Set(dates)].filter(
    (d) => isValidDateKey(d) && d.startsWith(month)
  );

  await redis.set(availabilityKey(month, name), cleanDates);

  return NextResponse.json({ ok: true, dates: cleanDates });
}
