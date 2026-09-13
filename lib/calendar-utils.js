export function pad2(n) {
  return String(n).padStart(2, "0");
}

export function monthKey(year, month) {
  return `${year}-${pad2(month)}`;
}

export function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

// month: 1-12, 42개의 셀(6주치)을 반환. 이전/다음 달 셀은 inMonth=false.
export function buildMonthGrid(year, month) {
  const first = new Date(year, month - 1, 1);
  const startWeekday = first.getDay();
  const totalDays = daysInMonth(year, month);
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const prevDays = daysInMonth(prevYear, prevMonth);
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;

  const cells = [];
  for (let i = 0; i < 42; i++) {
    const dayNum = i - startWeekday + 1;
    let y = year;
    let m = month;
    let d = dayNum;
    let inMonth = true;

    if (dayNum < 1) {
      inMonth = false;
      y = prevYear;
      m = prevMonth;
      d = prevDays + dayNum;
    } else if (dayNum > totalDays) {
      inMonth = false;
      y = nextYear;
      m = nextMonth;
      d = dayNum - totalDays;
    }

    const dateKey = `${y}-${pad2(m)}-${pad2(d)}`;
    cells.push({ year: y, month: m, day: d, dateKey, inMonth });
  }
  return cells;
}

export const WEEKDAYS_JA = ["日", "月", "火", "水", "木", "金", "土"];
