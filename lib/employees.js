import { redis } from "./redis";

const EMPLOYEES_KEY = "employees:list";

async function ensureSeeded() {
  const exists = await redis.exists(EMPLOYEES_KEY);
  if (exists) return;

  const seed = (process.env.EMPLOYEE_LIST || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (seed.length > 0) {
    await redis.sadd(EMPLOYEES_KEY, ...seed);
  }
}

export async function getEmployees() {
  await ensureSeeded();
  const members = await redis.smembers(EMPLOYEES_KEY);
  return members.sort((a, b) => a.localeCompare(b, "ja"));
}

export async function addEmployee(name) {
  await redis.sadd(EMPLOYEES_KEY, name);
}

export async function removeEmployee(name) {
  await redis.srem(EMPLOYEES_KEY, name);
}

export async function isValidEmployee(name) {
  await ensureSeeded();
  const result = await redis.sismember(EMPLOYEES_KEY, name);
  return result === 1;
}
