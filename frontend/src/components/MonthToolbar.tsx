import { CalendarDays, Download, LogOut, Repeat2 } from "lucide-react";
import type { ReactNode } from "react";

import type { User } from "../types";

interface MonthToolbarProps {
  user: User;
  month: string;
  onMonthChange: (month: string) => void;
  onCopyPrevious: () => void;
  onExport: (format: "csv" | "xlsx") => void;
  onLogout: () => void;
  children?: ReactNode;
}

export function MonthToolbar({ user, month, onMonthChange, onCopyPrevious, onExport, onLogout, children }: MonthToolbarProps) {
  return (
    <header id="dashboard-header" className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 pt-[var(--safe-top)] backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-3 py-3 sm:px-4 sm:py-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-normal text-slate-950">수동 가계부</h1>
          <p className="mt-1 text-sm text-slate-500">{user.name || user.email}</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
          <label className="col-span-2 flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 sm:col-span-1">
            <CalendarDays aria-hidden className="h-4 w-4" />
            <input
              aria-label="월 선택"
              className="w-[8.5rem] bg-transparent outline-none"
              type="month"
              value={month}
              onChange={(event) => onMonthChange(event.target.value)}
            />
          </label>
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            type="button"
            onClick={onCopyPrevious}
          >
            <Repeat2 aria-hidden className="h-4 w-4" />
            지난달 복사
          </button>
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            type="button"
            onClick={() => onExport("csv")}
          >
            <Download aria-hidden className="h-4 w-4" />
            CSV
          </button>
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            type="button"
            onClick={() => onExport("xlsx")}
          >
            <Download aria-hidden className="h-4 w-4" />
            Excel
          </button>
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            type="button"
            onClick={onLogout}
          >
            <LogOut aria-hidden className="h-4 w-4" />
            로그아웃
          </button>
        </div>
      </div>
      {children}
    </header>
  );
}
