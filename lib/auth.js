import crypto from "crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE_NAME = "admin_session";
export const ADMIN_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7일

function getSecret() {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) {
    throw new Error("ADMIN_PASSWORD 환경변수가 설정되지 않았습니다.");
  }
  return secret;
}

function sign(expiry) {
  return crypto.createHmac("sha256", getSecret()).update(String(expiry)).digest("hex");
}

export function createSessionCookieValue() {
  const expiry = Date.now() + ADMIN_COOKIE_MAX_AGE * 1000;
  return `${expiry}.${sign(expiry)}`;
}

export function verifySessionCookieValue(value) {
  if (!value) return false;
  const [expiryStr, sig] = value.split(".");
  const expiry = Number(expiryStr);
  if (!expiry || !sig || Date.now() > expiry) return false;

  const expected = sign(expiry);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function verifyPassword(input) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || typeof input !== "string") return false;
  const a = Buffer.from(input);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export async function isAdminAuthed() {
  const store = await cookies();
  const value = store.get(ADMIN_COOKIE_NAME)?.value;
  return verifySessionCookieValue(value);
}
