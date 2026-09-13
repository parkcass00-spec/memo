"use client";

import { useCallback, useEffect, useState } from "react";
import { daysInMonth, pad2, WEEKDAYS_JA, monthKey } from "@/lib/calendar-utils";

const today = new Date();
const DATE_COL_WIDTH = 96;
const EMPLOYEE_COL_WIDTH = 84;

export default function Dashboard() {
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [employees, setEmployees] = useState([]);
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [newName, setNewName] = useState("");
  const [busyName, setBusyName] = useState("");

  const load = useCallback(async (y, m) => {
    setLoading(true);
    setError("");
    try {
      const mk = monthKey(y, m);
      const res = await fetch(`/api/admin/availability?month=${mk}`);
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "データの取得に失敗しました。");
        return;
      }
      setEmployees(json.employees || []);
      setData(json.data || {});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(year, month);
  }, [year, month, load]);

  function changeMonth(delta) {
    let y = year;
    let m = month + delta;
    if (m < 1) {
      m = 12;
      y -= 1;
    } else if (m > 12) {
      m = 1;
      y += 1;
    }
    setYear(y);
    setMonth(m);
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.reload();
  }

  async function handleAddEmployee(e) {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) return;
    setBusyName(trimmed);
    setError("");
    try {
      const res = await fetch("/api/admin/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      const json = await res.json();
      if (res.ok) {
        setEmployees(json.employees);
        setNewName("");
        await load(year, month);
      } else {
        setError(json.error || "追加に失敗しました。");
      }
    } finally {
      setBusyName("");
    }
  }

  async function handleRemoveEmployee(name) {
    const ok = window.confirm(`「${name}」を削除しますか？この操作は元に戻せません。`);
    if (!ok) return;
    setBusyName(name);
    setError("");
    try {
      const res = await fetch("/api/admin/employees", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const json = await res.json();
      if (res.ok) {
        setEmployees(json.employees);
        await load(year, month);
      } else {
        setError(json.error || "削除に失敗しました。");
      }
    } finally {
      setBusyName("");
    }
  }

  const totalDays = daysInMonth(year, month);
  const days = Array.from({ length: totalDays }, (_, i) => i + 1);

  return (
    <div className="admin-wrap">
      <header className="admin-header">
        <h1>0&amp;1 シフト管理画面</h1>
        <button type="button" className="link-btn" onClick={handleLogout}>
          ログアウト
        </button>
      </header>

      <div className="month-nav">
        <button type="button" aria-label="前月" onClick={() => changeMonth(-1)}>
          &#10094;
        </button>
        <span className="month-label">
          {year}年{month}月
        </span>
        <button type="button" aria-label="翌月" onClick={() => changeMonth(1)}>
          &#10095;
        </button>
      </div>

      {error && <p className="error-text">{error}</p>}

      <section className="card">
        <h2>出勤可能日 一覧</h2>
        {loading ? (
          <p className="loading-text">読み込み中...</p>
        ) : employees.length === 0 ? (
          <p className="empty-text">登録されているスタッフがいません。下から追加してください。</p>
        ) : (
          <div className="table-scroll">
            <table
              className="avail-table"
              style={{ minWidth: `${DATE_COL_WIDTH + employees.length * EMPLOYEE_COL_WIDTH}px` }}
            >
              <thead>
                <tr>
                  <th className="date-col" style={{ width: DATE_COL_WIDTH }}>
                    日付
                  </th>
                  {employees.map((name) => (
                    <th key={name} style={{ width: EMPLOYEE_COL_WIDTH }}>
                      {name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {days.map((d) => {
                  const dateKey = `${year}-${pad2(month)}-${pad2(d)}`;
                  const weekdayIdx = new Date(year, month - 1, d).getDay();
                  const rowClass = weekdayIdx === 0 ? "sun-row" : weekdayIdx === 6 ? "sat-row" : "";
                  return (
                    <tr key={d} className={rowClass}>
                      <td className="date-col" style={{ width: DATE_COL_WIDTH }}>
                        {d}日（{WEEKDAYS_JA[weekdayIdx]}）
                      </td>
                      {employees.map((name) => (
                        <td key={name} className="mark-cell" style={{ width: EMPLOYEE_COL_WIDTH }}>
                          {(data[name] || []).includes(dateKey) ? <span className="mark-ok">◯</span> : ""}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card">
        <h2>スタッフ管理</h2>
        <ul className="employee-list">
          {employees.map((name) => (
            <li key={name}>
              <span>{name}</span>
              <button
                type="button"
                className="danger-btn"
                onClick={() => handleRemoveEmployee(name)}
                disabled={busyName === name}
              >
                削除
              </button>
            </li>
          ))}
        </ul>
        <form className="add-employee-form" onSubmit={handleAddEmployee}>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="新しいスタッフ名"
          />
          <button type="submit" className="primary-btn" disabled={!!busyName}>
            追加
          </button>
        </form>
      </section>
    </div>
  );
}
