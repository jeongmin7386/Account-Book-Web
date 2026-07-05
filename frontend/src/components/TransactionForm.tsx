import { Save, X } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import type { Category, PaymentMethod, Transaction, TransactionPayload } from "../types";
import { todayISO } from "../utils/format";

interface TransactionFormProps {
  categories: Category[];
  initial?: Transaction | null;
  onSubmit: (payload: TransactionPayload) => Promise<void>;
  onCancelEdit: () => void;
}

const paymentMethods: Array<{ value: PaymentMethod; label: string }> = [
  { value: "credit_card", label: "신용카드" },
  { value: "debit_card", label: "체크카드" },
  { value: "cash", label: "현금" },
  { value: "bank_transfer", label: "계좌이체" },
  { value: "easy_pay", label: "간편결제" },
];

const exclusionReasons = [
  "신용카드 결제대금 출금",
  "계좌 간 이동",
  "환불",
  "회사 비용 선결제",
  "대신 결제 후 돌려받음",
  "기타",
];

const emptyPayload = (categoryId: number): TransactionPayload => ({
  date: todayISO(),
  merchant: "",
  amount: 0,
  category_id: categoryId,
  payment_method: "credit_card",
  card_name: "",
  card_type: "credit",
  is_excluded: false,
  exclusion_reason: "",
  memo: "",
});

export function TransactionForm({ categories, initial, onSubmit, onCancelEdit }: TransactionFormProps) {
  const firstCategoryId = categories[0]?.id ?? 0;
  const [draft, setDraft] = useState<TransactionPayload>(emptyPayload(firstCategoryId));
  const isCard = draft.payment_method === "credit_card" || draft.payment_method === "debit_card";

  useEffect(() => {
    if (initial) {
      setDraft({
        date: initial.date,
        merchant: initial.merchant,
        amount: initial.amount,
        category_id: initial.category_id,
        payment_method: initial.payment_method,
        card_name: initial.card_name ?? "",
        card_type: initial.card_type ?? null,
        is_excluded: initial.is_excluded,
        exclusion_reason: initial.exclusion_reason ?? "",
        memo: initial.memo ?? "",
      });
    } else {
      setDraft(emptyPayload(firstCategoryId));
    }
  }, [initial, firstCategoryId]);

  const categoryOptions = useMemo(
    () =>
      categories.map((category) => (
        <option key={category.id} value={category.id}>
          {category.name}
        </option>
      )),
    [categories],
  );

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!draft.category_id || !draft.merchant.trim() || draft.amount <= 0) return;
    const normalized: TransactionPayload = {
      ...draft,
      card_name: isCard ? draft.card_name : null,
      card_type: draft.payment_method === "credit_card" ? "credit" : draft.payment_method === "debit_card" ? "debit" : null,
      exclusion_reason: draft.is_excluded ? draft.exclusion_reason : null,
    };
    await onSubmit(normalized);
    if (!initial) setDraft(emptyPayload(firstCategoryId));
  };

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-slate-950">{initial ? "거래 수정" : "거래 입력"}</h2>
        {initial && (
          <button
            aria-label="수정 취소"
            className="min-h-11 rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
            type="button"
            onClick={onCancelEdit}
          >
            <X aria-hidden className="h-4 w-4" />
          </button>
        )}
      </div>
      <form className="mt-4 grid gap-3 lg:grid-cols-6" onSubmit={submit}>
        <Field label="사용일">
          <input
            className="input"
            autoComplete="off"
            type="date"
            value={draft.date}
            onChange={(event) => setDraft((prev) => ({ ...prev, date: event.target.value }))}
          />
        </Field>
        <Field label="사용처">
          <input
            className="input"
            autoComplete="off"
            value={draft.merchant}
            onChange={(event) => setDraft((prev) => ({ ...prev, merchant: event.target.value }))}
          />
        </Field>
        <Field label="사용금액">
          <input
            className="input"
            inputMode="numeric"
            min={0}
            type="number"
            value={draft.amount || ""}
            onChange={(event) => setDraft((prev) => ({ ...prev, amount: Number(event.target.value) }))}
          />
        </Field>
        <Field label="카테고리">
          <select
            className="input"
            value={draft.category_id}
            onChange={(event) => setDraft((prev) => ({ ...prev, category_id: Number(event.target.value) }))}
          >
            {categoryOptions}
          </select>
        </Field>
        <Field label="결제수단">
          <select
            className="input"
            value={draft.payment_method}
            onChange={(event) => {
              const paymentMethod = event.target.value as PaymentMethod;
              setDraft((prev) => ({
                ...prev,
                payment_method: paymentMethod,
                card_type:
                  paymentMethod === "credit_card" ? "credit" : paymentMethod === "debit_card" ? "debit" : null,
              }));
            }}
          >
            {paymentMethods.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="카드명">
          <input
            className="input disabled:bg-slate-100"
            autoComplete="off"
            disabled={!isCard}
            value={draft.card_name ?? ""}
            onChange={(event) => setDraft((prev) => ({ ...prev, card_name: event.target.value }))}
          />
        </Field>
        <Field label="카드 종류">
          <div className="input bg-slate-50">
            {draft.card_type === "credit" ? "신용카드" : draft.card_type === "debit" ? "체크카드" : "없음"}
          </div>
        </Field>
        <Field label="제외 여부">
          <label className="flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm">
            <input
              checked={draft.is_excluded}
              type="checkbox"
              onChange={(event) => setDraft((prev) => ({ ...prev, is_excluded: event.target.checked }))}
            />
            제외
          </label>
        </Field>
        <Field label="제외 사유">
          <select
            className="input disabled:bg-slate-100"
            disabled={!draft.is_excluded}
            value={draft.exclusion_reason ?? ""}
            onChange={(event) => setDraft((prev) => ({ ...prev, exclusion_reason: event.target.value }))}
          >
            <option value="">선택</option>
            {exclusionReasons.map((reason) => (
              <option key={reason} value={reason}>
                {reason}
              </option>
            ))}
          </select>
        </Field>
        <Field className="lg:col-span-2" label="메모">
          <input
            className="input"
            autoComplete="off"
            value={draft.memo ?? ""}
            onChange={(event) => setDraft((prev) => ({ ...prev, memo: event.target.value }))}
          />
        </Field>
        <div className="flex items-end">
          <button
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-medium text-white hover:bg-slate-800"
            type="submit"
          >
            <Save aria-hidden className="h-4 w-4" />
            저장
          </button>
        </div>
      </form>
    </section>
  );
}

function Field({ label, className = "", children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-sm font-medium text-slate-600">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
