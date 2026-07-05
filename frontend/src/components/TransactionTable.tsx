import { Ban, RotateCcw, Save, Search, Trash2, X } from "lucide-react";
import { useState } from "react";

import type { Category, Transaction, TransactionFilters } from "../types";
import { formatCurrency, todayISO } from "../utils/format";

interface TransactionTableProps {
  transactions: Transaction[];
  categories: Category[];
  filters: TransactionFilters;
  onFiltersChange: (filters: TransactionFilters) => void;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: number) => Promise<void>;
  onCancelTransaction: (id: number, payload: { date: string; amount: number; memo?: string | null }) => Promise<void>;
  onDeleteCancellation: (id: number) => Promise<void>;
}

const paymentLabels: Record<string, string> = {
  credit_card: "신용카드",
  debit_card: "체크카드",
  cash: "현금",
  bank_transfer: "계좌이체",
  easy_pay: "간편결제",
};

const cancelLabels = {
  none: "없음",
  partial: "부분 취소",
  full: "전체 취소",
};

export function TransactionTable({
  transactions,
  categories,
  filters,
  onFiltersChange,
  onEdit,
  onDelete,
  onCancelTransaction,
  onDeleteCancellation,
}: TransactionTableProps) {
  const [cancelingId, setCancelingId] = useState<number | null>(null);
  const [cancelDraft, setCancelDraft] = useState({ date: todayISO(), amount: 0, memo: "" });

  const updateFilter = (key: keyof TransactionFilters, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const openCancellation = (transaction: Transaction) => {
    setCancelingId((prev) => (prev === transaction.id ? null : transaction.id));
    setCancelDraft({ date: todayISO(), amount: transaction.effective_amount, memo: "" });
  };

  const submitCancellation = async (transaction: Transaction) => {
    await onCancelTransaction(transaction.id, cancelDraft);
    setCancelingId(null);
    setCancelDraft({ date: todayISO(), amount: 0, memo: "" });
  };

  const renderCancellationEditor = (transaction: Transaction) =>
    cancelingId === transaction.id && (
      <div className="mt-3 grid gap-2 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
        <input
          className="filter-input"
          type="date"
          value={cancelDraft.date}
          onChange={(event) => setCancelDraft((prev) => ({ ...prev, date: event.target.value }))}
        />
        <input
          className="filter-input"
          inputMode="numeric"
          max={transaction.effective_amount}
          min={0}
          type="number"
          value={cancelDraft.amount || ""}
          onChange={(event) => setCancelDraft((prev) => ({ ...prev, amount: Number(event.target.value) }))}
        />
        <input
          className="filter-input"
          placeholder="메모"
          value={cancelDraft.memo}
          onChange={(event) => setCancelDraft((prev) => ({ ...prev, memo: event.target.value }))}
        />
        <div className="grid grid-cols-2 gap-2">
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-600"
            type="button"
            onClick={() => submitCancellation(transaction)}
          >
            <Save aria-hidden className="h-4 w-4" />
            적용
          </button>
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            type="button"
            onClick={() => setCancelingId(null)}
          >
            <X aria-hidden className="h-4 w-4" />
            닫기
          </button>
        </div>
      </div>
    );

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <h2 className="text-base font-semibold text-slate-950">거래내역</h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          <input
            aria-label="시작일"
            className="filter-input"
            type="date"
            value={filters.date_from ?? ""}
            onChange={(event) => updateFilter("date_from", event.target.value)}
          />
          <input
            aria-label="종료일"
            className="filter-input"
            type="date"
            value={filters.date_to ?? ""}
            onChange={(event) => updateFilter("date_to", event.target.value)}
          />
          <select
            aria-label="카테고리 필터"
            className="filter-input"
            value={filters.category_id ?? ""}
            onChange={(event) => updateFilter("category_id", event.target.value)}
          >
            <option value="">카테고리</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <select
            aria-label="결제수단 필터"
            className="filter-input"
            value={filters.payment_method ?? ""}
            onChange={(event) => updateFilter("payment_method", event.target.value)}
          >
            <option value="">결제수단</option>
            <option value="credit_card">신용카드</option>
            <option value="debit_card">체크카드</option>
            <option value="cash">현금</option>
            <option value="bank_transfer">계좌이체</option>
            <option value="easy_pay">간편결제</option>
          </select>
          <select
            aria-label="카드 종류 필터"
            className="filter-input"
            value={filters.card_type ?? ""}
            onChange={(event) => updateFilter("card_type", event.target.value)}
          >
            <option value="">카드 종류</option>
            <option value="credit">신용</option>
            <option value="debit">체크</option>
          </select>
          <select
            aria-label="제외 여부 필터"
            className="filter-input"
            value={filters.is_excluded ?? ""}
            onChange={(event) => updateFilter("is_excluded", event.target.value)}
          >
            <option value="">제외 전체</option>
            <option value="false">포함</option>
            <option value="true">제외</option>
          </select>
          <label className="relative block">
            <Search aria-hidden className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              aria-label="검색"
              className="filter-input pl-9"
              placeholder="검색"
              type="search"
              value={filters.search ?? ""}
              onChange={(event) => updateFilter("search", event.target.value)}
            />
          </label>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:hidden">
        {transactions.map((transaction) => (
          <article className="rounded-lg border border-slate-200 bg-slate-50 p-3" key={transaction.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500">{transaction.date}</p>
                <h3 className="mt-1 truncate text-base font-semibold text-slate-950">{transaction.merchant}</h3>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-base font-bold text-slate-950">{formatCurrency(transaction.effective_amount)}</p>
                {transaction.cancelled_amount > 0 && (
                  <p className="text-xs font-medium text-emerald-700">복구 {formatCurrency(transaction.cancelled_amount)}</p>
                )}
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <span
                className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium text-white"
                style={{ backgroundColor: transaction.category.color }}
              >
                {transaction.category.name}
              </span>
              <span className="inline-flex items-center rounded-full bg-white px-2 py-1 text-xs font-medium text-slate-700">
                {paymentLabels[transaction.payment_method]}
              </span>
              {transaction.card_name && (
                <span className="inline-flex items-center rounded-full bg-white px-2 py-1 text-xs font-medium text-slate-700">
                  {transaction.card_name}
                </span>
              )}
              {transaction.is_excluded && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">
                  <Ban aria-hidden className="h-3 w-3" />
                  {transaction.exclusion_reason || "제외"}
                </span>
              )}
              {transaction.cancellation_status !== "none" && (
                <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-800">
                  {cancelLabels[transaction.cancellation_status]}
                </span>
              )}
            </div>

            {transaction.memo && <p className="mt-3 text-sm leading-6 text-slate-600">{transaction.memo}</p>}

            {transaction.cancellations.length > 0 && (
              <div className="mt-3 grid gap-2">
                {transaction.cancellations.map((cancel) => (
                  <button
                    className="min-h-10 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-left text-xs font-medium text-emerald-700"
                    key={cancel.id}
                    type="button"
                    onClick={() => onDeleteCancellation(cancel.id)}
                  >
                    {cancel.date} {formatCurrency(cancel.amount)} 삭제
                  </button>
                ))}
              </div>
            )}

            {renderCancellationEditor(transaction)}

            <div className="mt-3 grid grid-cols-3 gap-2">
              <button
                className="inline-flex min-h-11 items-center justify-center gap-1 rounded-lg border border-emerald-200 bg-white px-2 text-sm font-medium text-emerald-700"
                type="button"
                onClick={() => openCancellation(transaction)}
              >
                <RotateCcw aria-hidden className="h-4 w-4" />
                취소
              </button>
              <button
                className="min-h-11 rounded-lg border border-slate-200 bg-white px-2 text-sm font-medium text-slate-700"
                type="button"
                onClick={() => onEdit(transaction)}
              >
                수정
              </button>
              <button
                className="inline-flex min-h-11 items-center justify-center gap-1 rounded-lg border border-rose-200 bg-white px-2 text-sm font-medium text-rose-600"
                type="button"
                onClick={() => onDelete(transaction.id)}
              >
                <Trash2 aria-hidden className="h-4 w-4" />
                삭제
              </button>
            </div>
          </article>
        ))}
        {transactions.length === 0 && (
          <div className="rounded-lg bg-slate-50 px-3 py-10 text-center text-sm font-medium text-slate-400">
            거래내역 없음
          </div>
        )}
      </div>

      <div className="thin-scrollbar mt-4 hidden overflow-x-auto md:block">
        <table className="min-w-[1120px] w-full border-separate border-spacing-0 text-left text-sm">
          <thead>
            <tr className="text-slate-500">
              {["날짜", "사용처", "금액", "카테고리", "결제수단", "카드명", "카드 종류", "제외", "취소", "메모", ""].map(
                (head) => (
                  <th className="border-b border-slate-200 px-3 py-3 font-medium" key={head}>
                    {head}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => (
              <tr className="align-top hover:bg-slate-50" key={transaction.id}>
                <td className="border-b border-slate-100 px-3 py-3">{transaction.date}</td>
                <td className="border-b border-slate-100 px-3 py-3 font-medium text-slate-900">{transaction.merchant}</td>
                <td className="border-b border-slate-100 px-3 py-3">
                  <div className="font-semibold text-slate-900">{formatCurrency(transaction.effective_amount)}</div>
                  {transaction.cancelled_amount > 0 && (
                    <div className="text-xs text-emerald-700">복구 {formatCurrency(transaction.cancelled_amount)}</div>
                  )}
                </td>
                <td className="border-b border-slate-100 px-3 py-3">
                  <span
                    className="inline-flex max-w-[9rem] items-center rounded-full px-2 py-1 text-xs font-medium text-white"
                    style={{ backgroundColor: transaction.category.color }}
                  >
                    {transaction.category.name}
                  </span>
                </td>
                <td className="border-b border-slate-100 px-3 py-3">{paymentLabels[transaction.payment_method]}</td>
                <td className="border-b border-slate-100 px-3 py-3">{transaction.card_name || "-"}</td>
                <td className="border-b border-slate-100 px-3 py-3">
                  {transaction.card_type === "credit" ? "신용" : transaction.card_type === "debit" ? "체크" : "-"}
                </td>
                <td className="border-b border-slate-100 px-3 py-3">
                  {transaction.is_excluded ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">
                      <Ban aria-hidden className="h-3 w-3" />
                      {transaction.exclusion_reason || "제외"}
                    </span>
                  ) : (
                    "포함"
                  )}
                </td>
                <td className="border-b border-slate-100 px-3 py-3">
                  <div>{cancelLabels[transaction.cancellation_status]}</div>
                  {transaction.cancellations.length > 0 && (
                    <div className="mt-1 space-y-1">
                      {transaction.cancellations.map((cancel) => (
                        <button
                          className="block rounded border border-emerald-200 px-2 py-1 text-xs text-emerald-700 hover:bg-emerald-50"
                          key={cancel.id}
                          type="button"
                          onClick={() => onDeleteCancellation(cancel.id)}
                        >
                          {cancel.date} {formatCurrency(cancel.amount)} 삭제
                        </button>
                      ))}
                    </div>
                  )}
                  {cancelingId === transaction.id && (
                    <div className="mt-2 grid w-56 gap-2 rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
                      <input
                        className="filter-input"
                        type="date"
                        value={cancelDraft.date}
                        onChange={(event) => setCancelDraft((prev) => ({ ...prev, date: event.target.value }))}
                      />
                      <input
                        className="filter-input"
                        inputMode="numeric"
                        max={transaction.effective_amount}
                        min={0}
                        type="number"
                        value={cancelDraft.amount || ""}
                        onChange={(event) => setCancelDraft((prev) => ({ ...prev, amount: Number(event.target.value) }))}
                      />
                      <input
                        className="filter-input"
                        placeholder="메모"
                        value={cancelDraft.memo}
                        onChange={(event) => setCancelDraft((prev) => ({ ...prev, memo: event.target.value }))}
                      />
                      <button
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-600"
                        type="button"
                        onClick={async () => {
                          await onCancelTransaction(transaction.id, cancelDraft);
                          setCancelingId(null);
                          setCancelDraft({ date: todayISO(), amount: 0, memo: "" });
                        }}
                      >
                        <Save aria-hidden className="h-3 w-3" />
                        적용
                      </button>
                    </div>
                  )}
                </td>
                <td className="max-w-[16rem] border-b border-slate-100 px-3 py-3 text-slate-600">
                  <span className="block max-h-16 overflow-hidden">{transaction.memo || "-"}</span>
                </td>
                <td className="border-b border-slate-100 px-3 py-3">
                  <div className="flex gap-2">
                    <button
                      aria-label="거래 취소"
                      className="rounded-lg border border-emerald-200 p-2 text-emerald-700 hover:bg-emerald-50"
                      type="button"
                      onClick={() => {
                        setCancelingId((prev) => (prev === transaction.id ? null : transaction.id));
                        setCancelDraft({ date: todayISO(), amount: transaction.effective_amount, memo: "" });
                      }}
                    >
                      <RotateCcw aria-hidden className="h-4 w-4" />
                    </button>
                    <button
                      className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      type="button"
                      onClick={() => onEdit(transaction)}
                    >
                      수정
                    </button>
                    <button
                      aria-label="거래 삭제"
                      className="rounded-lg border border-rose-200 p-2 text-rose-600 hover:bg-rose-50"
                      type="button"
                      onClick={() => onDelete(transaction.id)}
                    >
                      <Trash2 aria-hidden className="h-4 w-4" />
                    </button>
                    {cancelingId === transaction.id && (
                      <button
                        aria-label="취소 입력 닫기"
                        className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
                        type="button"
                        onClick={() => setCancelingId(null)}
                      >
                        <X aria-hidden className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {transactions.length === 0 && (
              <tr>
                <td className="px-3 py-10 text-center text-sm font-medium text-slate-400" colSpan={11}>
                  거래내역 없음
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
