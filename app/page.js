"use client";

import { useCallback, useEffect, useState } from "react";
import { buildMonthGrid, WEEKDAYS_JA, monthKey } from "@/lib/calendar-utils";

const today = new Date();
const NAME_STORAGE_KEY = "bar01_name";

export default function StaffPage() {
  const [step, setStep] = useState("name");
  const [nameInput, setNameInput] = useState("");
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");
  const [checking, setChecking] = useState(false);

  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [selected, setSelected] = useState(new Set());
  const [initialSelected, setInitialSelected] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(NAME_STORAGE_KEY);
      if (saved) setNameInput(saved);
    } catch {
      // localStorage 사용 불가 시 무시
    }
  }, []);

  const loadMonth = useCallback(async (y, m, empName) => {
    setLoading(true);
    setMessage("");
    try {
      const mk = monthKey(y, m);
      const res = await fetch(`/api/staff/availability?month=${mk}&name=${encodeURIComponent(empName)}`);
      const json = await res.json();
      if (res.ok) {
        const set = new Set(json.dates || []);
        setSelected(set);
        setInitialSelected(new Set(set));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  async function handleVerify(e) {
    e.preventDefault();
    const trimmed = nameInput.trim();
    if (!trimmed) {
      setNameError("名前を入力してください。");
      return;
    }
    setChecking(true);
    setNameError("");
    try {
      const res = await fetch("/api/staff/verify-name", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      const json = await res.json();
      if (!res.ok || !json.valid) {
        setNameError(json.error || "登録されていない名前です。店長にご確認ください。");
        return;
      }
      setName(json.name);
      try {
        window.localStorage.setItem(NAME_STORAGE_KEY, json.name);
      } catch {
        // localStorage 사용 불가 시 무시
      }
      setStep("calendar");
      await loadMonth(year, month, json.name);
    } catch {
      setNameError("通信エラーが発生しました。もう一度お試しください。");
    } finally {
      setChecking(false);
    }
  }

  function hasUnsavedChanges() {
    if (selected.size !== initialSelected.size) return true;
    for (const d of selected) {
      if (!initialSelected.has(d)) return true;
    }
    return false;
  }

  async function changeMonth(delta) {
    if (hasUnsavedChanges()) {
      const ok = window.confirm(
        "保存されていない変更があります。移動すると変更内容は失われます。移動しますか？"
      );
      if (!ok) return;
    }
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
    await loadMonth(y, m, name);
  }

  function toggleDate(dateKey) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(dateKey)) next.delete(dateKey);
      else next.add(dateKey);
      return next;
    });
    setMessage("");
  }

  async function handleSave() {
    setSaving(true);
    setMessage("");
    try {
      const mk = monthKey(year, month);
      const res = await fetch("/api/staff/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month: mk, name, dates: Array.from(selected) }),
      });
      const json = await res.json();
      if (!res.ok) {
        setMessage(json.error || "保存に失敗しました。");
        return;
      }
      setInitialSelected(new Set(json.dates));
      setMessage("保存しました！");
    } catch {
      setMessage("通信エラーが発生しました。もう一度お試しください。");
    } finally {
      setSaving(false);
    }
  }

  function handleChangeName() {
    if (hasUnsavedChanges()) {
      const ok = window.confirm(
        "保存されていない変更があります。名前を変更すると変更内容は失われます。よろしいですか？"
      );
      if (!ok) return;
    }
    setStep("name");
    setName("");
    setSelected(new Set());
    setInitialSelected(new Set());
    setMessage("");
  }

  const cells = buildMonthGrid(year, month);
  const isSuccessMessage = message === "保存しました！";

  return (
    <main className="page staff-page">
      <div className="brand">
        <h1>0&amp;1</h1>
        <p className="subtitle">シフト希望調査フォーム</p>
      </div>

      {step === "name" && (
        <form className="card name-card" onSubmit={handleVerify}>
          <label htmlFor="nameInput">お名前を入力してください</label>
          <input
            id="nameInput"
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="例）やまだ"
            autoComplete="off"
          />
          {nameError && <p className="error-text">{nameError}</p>}
          <button type="submit" className="primary-btn" disabled={checking}>
            {checking ? "確認中..." : "次へ"}
          </button>
        </form>
      )}

      {step === "calendar" && (
        <div className="card calendar-card">
          <div className="calendar-topbar">
            <span className="employee-name">{name} さん</span>
            <button type="button" className="link-btn" onClick={handleChangeName}>
              名前を変更
            </button>
          </div>

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

          <p className="hint">出勤できる日をタップして選択してください。</p>

          <div className="weekdays">
            {WEEKDAYS_JA.map((w, i) => (
              <div key={w} className={`weekday${i === 0 ? " sun" : ""}${i === 6 ? " sat" : ""}`}>
                {w}
              </div>
            ))}
          </div>

          {loading ? (
            <p className="loading-text">読み込み中...</p>
          ) : (
            <div className="grid">
              {cells.map((cell) => {
                const isSelected = selected.has(cell.dateKey);
                return (
                  <button
                    type="button"
                    key={`${cell.dateKey}-${cell.inMonth}`}
                    className={`day-cell${!cell.inMonth ? " other-month" : ""}${
                      isSelected ? " selected" : ""
                    }`}
                    disabled={!cell.inMonth}
                    onClick={() => toggleDate(cell.dateKey)}
                  >
                    {cell.day}
                  </button>
                );
              })}
            </div>
          )}

          {message && (
            <p className={isSuccessMessage ? "message success" : "message error-text"}>{message}</p>
          )}

          <button
            type="button"
            className="primary-btn save-btn"
            onClick={handleSave}
            disabled={saving || loading}
          >
            {saving ? "保存中..." : "保存する"}
          </button>
        </div>
      )}
    </main>
  );
}
