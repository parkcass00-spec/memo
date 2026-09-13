import { NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/auth";
import { getEmployees, addEmployee, removeEmployee } from "@/lib/employees";

function unauthorized() {
  return NextResponse.json({ error: "認証が必要です。" }, { status: 401 });
}

export async function GET() {
  if (!(await isAdminAuthed())) return unauthorized();
  const employees = await getEmployees();
  return NextResponse.json({ employees });
}

export async function POST(request) {
  if (!(await isAdminAuthed())) return unauthorized();

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "リクエストの形式が正しくありません。" }, { status: 400 });
  }

  const trimmed = (body?.name || "").trim();
  if (!trimmed) {
    return NextResponse.json({ error: "名前を入力してください。" }, { status: 400 });
  }

  await addEmployee(trimmed);
  const employees = await getEmployees();
  return NextResponse.json({ employees });
}

export async function DELETE(request) {
  if (!(await isAdminAuthed())) return unauthorized();

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "リクエストの形式が正しくありません。" }, { status: 400 });
  }

  const trimmed = (body?.name || "").trim();
  if (!trimmed) {
    return NextResponse.json({ error: "名前が正しくありません。" }, { status: 400 });
  }

  await removeEmployee(trimmed);
  const employees = await getEmployees();
  return NextResponse.json({ employees });
}
