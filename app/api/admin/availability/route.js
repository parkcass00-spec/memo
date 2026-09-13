import { NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/auth";
import { getEmployees } from "@/lib/employees";
import { redis } from "@/lib/redis";
import { availabilityKey, isValidMonth } from "@/lib/date-utils";

export async function GET(request) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "認証が必要です。" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month");

  if (!isValidMonth(month)) {
    return NextResponse.json({ error: "月の形式が正しくありません。" }, { status: 400 });
  }

  const employees = await getEmployees();
  const data = {};

  await Promise.all(
    employees.map(async (name) => {
      const raw = await redis.get(availabilityKey(month, name));
      data[name] = Array.isArray(raw) ? raw : [];
    })
  );

  return NextResponse.json({ month, employees, data });
}
