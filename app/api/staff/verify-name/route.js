import { NextResponse } from "next/server";
import { isValidEmployee } from "@/lib/employees";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ valid: false, error: "リクエストの形式が正しくありません。" }, { status: 400 });
  }

  const trimmed = (body?.name || "").trim();
  if (!trimmed) {
    return NextResponse.json({ valid: false, error: "名前を入力してください。" }, { status: 400 });
  }

  const valid = await isValidEmployee(trimmed);
  if (!valid) {
    return NextResponse.json(
      { valid: false, error: "登録されていない名前です。店長にご確認ください。" },
      { status: 404 }
    );
  }

  return NextResponse.json({ valid: true, name: trimmed });
}
