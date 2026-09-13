"use client";

import { useState } from "react";

export default function LoginForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "ログインに失敗しました。");
        return;
      }
      window.location.reload();
    } catch {
      setError("通信エラーが発生しました。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="card login-card" onSubmit={handleSubmit}>
      <h1>0&amp;1 管理画面</h1>
      <input
        type="text"
        name="username"
        autoComplete="username"
        value="admin"
        readOnly
        hidden
      />
      <label htmlFor="adminPassword">パスワード</label>
      <input
        id="adminPassword"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="current-password"
      />
      {error && <p className="error-text">{error}</p>}
      <button type="submit" className="primary-btn" disabled={loading}>
        {loading ? "ログイン中..." : "ログイン"}
      </button>
    </form>
  );
}
