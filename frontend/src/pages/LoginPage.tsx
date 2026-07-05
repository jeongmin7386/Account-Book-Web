import { FormEvent, useState } from "react";
import { LockKeyhole, UserPlus } from "lucide-react";

import { api, ApiError } from "../api/client";
import type { AuthResponse } from "../types";

interface LoginPageProps {
  onAuthenticated: (response: AuthResponse) => void;
}

export function LoginPage({ onAuthenticated }: LoginPageProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response =
        mode === "login" ? await api.login(email, password) : await api.register(email, password, name || undefined);
      localStorage.setItem("budget-token", response.access_token);
      onAuthenticated(response);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : mode === "login" ? "로그인에 실패했습니다." : "회원가입에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="app-screen flex items-center justify-center bg-slate-100 px-4 py-6 pb-[calc(1.5rem+var(--safe-bottom))] pt-[calc(1.5rem+var(--safe-top))] sm:py-10">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-5 shadow-soft sm:p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-slate-950 p-3 text-white">
            {mode === "login" ? <LockKeyhole aria-hidden className="h-6 w-6" /> : <UserPlus aria-hidden className="h-6 w-6" />}
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-950">수동 가계부</h1>
            <p className="mt-1 text-sm text-slate-500">사용자별 데이터 분리</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 rounded-lg bg-slate-100 p-1">
          <button
            className={`min-h-11 rounded-md px-3 py-2 text-sm font-medium ${mode === "login" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"}`}
            type="button"
            onClick={() => setMode("login")}
          >
            로그인
          </button>
          <button
            className={`min-h-11 rounded-md px-3 py-2 text-sm font-medium ${mode === "register" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"}`}
            type="button"
            onClick={() => setMode("register")}
          >
            회원가입
          </button>
        </div>

        <form className="mt-6 grid gap-4" onSubmit={submit}>
          {mode === "register" && (
            <label className="block">
              <span className="text-sm font-medium text-slate-600">이름</span>
              <input
                className="input mt-1"
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </label>
          )}
          <label className="block">
            <span className="text-sm font-medium text-slate-600">이메일</span>
            <input
              className="input mt-1"
              autoCapitalize="none"
              autoComplete="email"
              inputMode="email"
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-600">비밀번호</span>
            <input
              className="input mt-1"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              minLength={8}
              required
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{error}</p>}
          <button
            className="inline-flex min-h-12 items-center justify-center rounded-lg bg-slate-950 px-4 text-base font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400 sm:h-11 sm:text-sm"
            disabled={loading}
            type="submit"
          >
            {loading ? "처리 중" : mode === "login" ? "로그인" : "회원가입"}
          </button>
        </form>
      </section>
    </main>
  );
}
