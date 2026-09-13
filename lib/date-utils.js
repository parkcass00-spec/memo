export function availabilityKey(month, name) {
  return `avail:${month}:${encodeURIComponent(name)}`;
}

export function isValidMonth(month) {
  return typeof month === "string" && /^\d{4}-\d{2}$/.test(month);
}

export function isValidDateKey(dateKey) {
  return typeof dateKey === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateKey);
}
