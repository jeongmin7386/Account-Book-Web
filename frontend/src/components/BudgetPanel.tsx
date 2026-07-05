import { Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import type { FixedExpense, MonthBudget } from "../types";
import { formatCurrency } from "../utils/format";

interface BudgetPanelProps {
  budget: MonthBudget;
  fixedExpenses: FixedExpense[];
  onSaveBudget: (budget: Omit<MonthBudget, "id" | "month">) => Promise<void>;
  onCreateFixedExpense: (expense: Omit<FixedExpense, "id">) => Promise<void>;
  onUpdateFixedExpense: (id: number, expense: Omit<FixedExpense, "id">) => Promise<void>;
  onDeleteFixedExpense: (id: number) => Promise<void>;
}

const emptyFixed = { name: "", amount: 0, memo: "" };

export function BudgetPanel({
  budget,
  fixedExpenses,
  onSaveBudget,
  onCreateFixedExpense,
  onUpdateFixedExpense,
  onDeleteFixedExpense,
}: BudgetPanelProps) {
  const [draft, setDraft] = useState({
    salary: budget.salary,
    savings_goal: budget.savings_goal,
    alert_threshold_ratio: budget.alert_threshold_ratio,
  });
  const [fixedDraft, setFixedDraft] = useState<Omit<FixedExpense, "id">>(emptyFixed);
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    setDraft({
      salary: budget.salary,
      savings_goal: budget.savings_goal,
      alert_threshold_ratio: budget.alert_threshold_ratio,
    });
  }, [budget]);

  const fixedTotal = fixedExpenses.reduce((sum, item) => sum + item.amount, 0);

  const submitFixed = async () => {
    if (!fixedDraft.name.trim()) return;
    if (editingId) {
      await onUpdateFixedExpense(editingId, fixedDraft);
      setEditingId(null);
    } else {
      await onCreateFixedExpense(fixedDraft);
    }
    setFixedDraft(emptyFixed);
  };

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-slate-950">월 예산</h2>
        <button
          className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-slate-950 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
          type="button"
          onClick={() => onSaveBudget(draft)}
        >
          <Save aria-hidden className="h-4 w-4" />
          저장
        </button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <NumberField
          label="월 실수령 급여"
          value={draft.salary}
          onChange={(value) => setDraft((prev) => ({ ...prev, salary: value }))}
        />
        <NumberField
          label="목표 저축 금액"
          value={draft.savings_goal}
          onChange={(value) => setDraft((prev) => ({ ...prev, savings_goal: value }))}
        />
        <label className="block">
          <span className="text-sm font-medium text-slate-600">경고 비율</span>
          <input
            className="input mt-1"
            inputMode="decimal"
            max={1}
            min={0}
            step={0.05}
            type="number"
            value={draft.alert_threshold_ratio}
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, alert_threshold_ratio: Number(event.target.value) }))
            }
          />
        </label>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800">고정지출</h3>
        <span className="text-sm font-medium text-slate-500">{formatCurrency(fixedTotal)}</span>
      </div>
      <div className="mt-3 grid gap-2">
        {fixedExpenses.map((expense) => (
          <div
            className="grid gap-2 rounded-lg border border-slate-100 bg-slate-50 p-3 sm:grid-cols-[1fr_9rem_1fr_auto]"
            key={expense.id}
          >
            <input
              aria-label="고정지출명"
              className="input"
              value={editingId === expense.id ? fixedDraft.name : expense.name}
              onChange={(event) => setFixedDraft((prev) => ({ ...prev, name: event.target.value }))}
              onFocus={() => {
                setEditingId(expense.id);
                setFixedDraft({ name: expense.name, amount: expense.amount, memo: expense.memo ?? "" });
              }}
            />
            <input
              aria-label="고정지출 금액"
              className="input"
              inputMode="numeric"
              min={0}
              type="number"
              value={editingId === expense.id ? fixedDraft.amount : expense.amount}
              onChange={(event) => setFixedDraft((prev) => ({ ...prev, amount: Number(event.target.value) }))}
              onFocus={() => {
                setEditingId(expense.id);
                setFixedDraft({ name: expense.name, amount: expense.amount, memo: expense.memo ?? "" });
              }}
            />
            <input
              aria-label="고정지출 메모"
              className="input"
              value={editingId === expense.id ? fixedDraft.memo ?? "" : expense.memo ?? ""}
              onChange={(event) => setFixedDraft((prev) => ({ ...prev, memo: event.target.value }))}
              onFocus={() => {
                setEditingId(expense.id);
                setFixedDraft({ name: expense.name, amount: expense.amount, memo: expense.memo ?? "" });
              }}
            />
            <div className="flex gap-2">
              <button
                aria-label="고정지출 저장"
                className="min-h-11 rounded-lg border border-slate-200 bg-white p-2 text-slate-700 hover:bg-slate-100"
                type="button"
                onClick={submitFixed}
              >
                <Save aria-hidden className="h-4 w-4" />
              </button>
              <button
                aria-label="고정지출 삭제"
                className="min-h-11 rounded-lg border border-rose-200 bg-white p-2 text-rose-600 hover:bg-rose-50"
                type="button"
                onClick={() => onDeleteFixedExpense(expense.id)}
              >
                <Trash2 aria-hidden className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 grid gap-2 rounded-lg border border-dashed border-slate-300 p-3 sm:grid-cols-[1fr_9rem_1fr_auto]">
        <input
          aria-label="새 고정지출명"
          className="input"
          placeholder="항목"
          value={fixedDraft.name}
          onChange={(event) => setFixedDraft((prev) => ({ ...prev, name: event.target.value }))}
        />
        <input
          aria-label="새 고정지출 금액"
          className="input"
          inputMode="numeric"
          min={0}
          placeholder="금액"
          type="number"
          value={fixedDraft.amount || ""}
          onChange={(event) => setFixedDraft((prev) => ({ ...prev, amount: Number(event.target.value) }))}
        />
        <input
          aria-label="새 고정지출 메모"
          className="input"
          placeholder="메모"
          value={fixedDraft.memo ?? ""}
          onChange={(event) => setFixedDraft((prev) => ({ ...prev, memo: event.target.value }))}
        />
        <button
          aria-label="고정지출 추가"
          className="min-h-11 rounded-lg bg-slate-950 p-2 text-white hover:bg-slate-800"
          type="button"
          onClick={submitFixed}
        >
          <Plus aria-hidden className="h-5 w-5" />
        </button>
      </div>
    </section>
  );
}

interface NumberFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
}

function NumberField({ label, value, onChange }: NumberFieldProps) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-600">{label}</span>
      <input
        className="input mt-1"
        inputMode="numeric"
        min={0}
        type="number"
        value={value || ""}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}
