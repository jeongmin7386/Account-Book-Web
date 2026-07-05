import {
  Banknote,
  CreditCard,
  Landmark,
  PiggyBank,
  ReceiptText,
  ShieldAlert,
  WalletCards,
  type LucideIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { api, ApiError } from "../api/client";
import { BudgetPanel } from "../components/BudgetPanel";
import { CategoryManager } from "../components/CategoryManager";
import { ChartsPanel } from "../components/ChartsPanel";
import { MetricCard } from "../components/MetricCard";
import { MonthToolbar } from "../components/MonthToolbar";
import { TransactionForm } from "../components/TransactionForm";
import { TransactionTable } from "../components/TransactionTable";
import type {
  AuthResponse,
  Category,
  DashboardOverview,
  FixedExpense,
  MonthBudget,
  Transaction,
  TransactionFilters,
  TransactionPayload,
  User,
} from "../types";
import { currentMonth, formatCurrency } from "../utils/format";

interface DashboardPageProps {
  user: User;
  onLogout: () => void;
  onAuthenticated?: (response: AuthResponse) => void;
}

type DashboardSectionId = "summary" | "insights" | "budget" | "entry" | "categories" | "history";

const dashboardSections: Array<{ id: DashboardSectionId; label: string; icon: LucideIcon }> = [
  { id: "summary", label: "요약", icon: Banknote },
  { id: "insights", label: "분석", icon: Landmark },
  { id: "budget", label: "예산", icon: PiggyBank },
  { id: "entry", label: "입력", icon: ReceiptText },
  { id: "categories", label: "카테고리", icon: CreditCard },
  { id: "history", label: "내역", icon: WalletCards },
];

export function DashboardPage({ user, onLogout }: DashboardPageProps) {
  const [month, setMonth] = useState(currentMonth());
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filters, setFilters] = useState<TransactionFilters>({});
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [activeSection, setActiveSection] = useState<DashboardSectionId>("summary");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [overviewData, categoryData, transactionData] = await Promise.all([
        api.overview(month),
        api.categories(),
        api.transactions(month, filters),
      ]);
      setOverview(overviewData);
      setCategories(categoryData);
      setTransactions(transactionData);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "데이터를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [month, filters]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((first, second) => second.intersectionRatio - first.intersectionRatio)[0];

        if (visibleEntry?.target.id) {
          setActiveSection(visibleEntry.target.id as DashboardSectionId);
        }
      },
      { rootMargin: "-35% 0px -50% 0px", threshold: [0.1, 0.25, 0.5] },
    );

    dashboardSections.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [overview, categories.length, transactions.length]);

  const scrollToSection = useCallback((sectionId: DashboardSectionId) => {
    const element = document.getElementById(sectionId);
    if (!element) return;

    setActiveSection(sectionId);
    const headerHeight = document.getElementById("dashboard-header")?.getBoundingClientRect().height ?? 0;
    const top = element.getBoundingClientRect().top + window.scrollY - headerHeight - 12;
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  }, []);

  const summary = overview?.summary;
  const metrics = useMemo(() => {
    if (!summary) return [];
    return [
      { title: "월 급여", value: summary.salary, icon: Banknote, tone: "good" as const },
      { title: "고정지출 총액", value: summary.fixed_expense_total, icon: ReceiptText, tone: "neutral" as const },
      { title: "월 여유돈", value: summary.monthly_free_money, icon: PiggyBank, tone: "info" as const },
      { title: "사용 가능 자금", value: summary.usable_funds, icon: Banknote, tone: "info" as const },
      { title: "신용카드 사용액", value: summary.credit_card_spending, icon: CreditCard, tone: "warn" as const },
      { title: "체크카드 사용액", value: summary.debit_card_spending, icon: CreditCard, tone: "neutral" as const },
      { title: "현금/이체 지출액", value: summary.cash_spending, icon: WalletCards, tone: "neutral" as const },
      {
        title: "현재 남은 사용 가능 자금",
        value: summary.current_remaining_usable_funds,
        icon: ShieldAlert,
        tone: summary.warning ? ("warn" as const) : ("good" as const),
      },
    ];
  }, [summary]);

  const run = async (action: () => Promise<unknown>, success: string) => {
    setMessage("");
    setError("");
    try {
      await action();
      setMessage(success);
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "처리에 실패했습니다.");
    }
  };

  if (loading && !overview) {
    return <div className="app-screen flex items-center justify-center bg-slate-100 text-slate-500">불러오는 중</div>;
  }

  return (
    <main className="app-screen bg-slate-100">
      <MonthToolbar
        month={month}
        user={user}
        onCopyPrevious={() =>
          run(async () => {
            const data = await api.copyPrevious(month);
            setOverview(data);
          }, "지난달 급여와 고정지출을 복사했습니다.")
        }
        onExport={(format) => run(() => api.downloadExport(month, format), `${format.toUpperCase()} 내보내기를 시작했습니다.`)}
        onLogout={onLogout}
        onMonthChange={(value) => {
          setMonth(value);
          setFilters({});
          setEditingTransaction(null);
        }}
      >
        <DashboardSectionTabs activeSection={activeSection} onSelect={scrollToSection} sections={dashboardSections} />
      </MonthToolbar>

      <div className="mx-auto grid max-w-7xl gap-4 px-3 pb-[calc(1.25rem+var(--safe-bottom))] pt-4 sm:gap-5 sm:px-4 sm:py-5">
        {(message || error) && (
          <div
            className={`rounded-lg border px-4 py-3 text-sm font-medium ${
              error ? "border-rose-200 bg-rose-50 text-rose-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
          >
            {error || message}
          </div>
        )}

        {summary?.warning && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
            현재 남은 사용 가능 자금이 {Math.round(summary.alert_threshold_ratio * 100)}% 이하입니다. 목표 저축까지{" "}
            {formatCurrency(summary.target_savings_gap)} 남았습니다.
          </div>
        )}

        <section id="summary" className="dashboard-section grid grid-cols-2 gap-3 md:grid-cols-4">
          {metrics.map((metric) => (
            <MetricCard key={metric.title} {...metric} />
          ))}
        </section>

        {overview && (
          <section id="insights" className="dashboard-section">
            <ChartsPanel
              categorySpending={overview.category_spending}
              dailySpending={overview.daily_spending}
              paymentMethodSpending={overview.payment_method_spending}
            />
          </section>
        )}

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="grid gap-5">
            {overview && (
              <section id="budget" className="dashboard-section">
                <BudgetPanel
                  budget={overview.budget}
                  fixedExpenses={overview.fixed_expenses}
                  onCreateFixedExpense={(expense) =>
                    run(() => api.createFixedExpense(month, expense), "고정지출을 추가했습니다.")
                  }
                  onDeleteFixedExpense={(id) => run(() => api.deleteFixedExpense(month, id), "고정지출을 삭제했습니다.")}
                  onSaveBudget={(payload: Omit<MonthBudget, "id" | "month">) =>
                    run(() => api.updateBudget(month, payload), "월 예산을 저장했습니다.")
                  }
                  onUpdateFixedExpense={(id, expense: Omit<FixedExpense, "id">) =>
                    run(() => api.updateFixedExpense(month, id, expense), "고정지출을 저장했습니다.")
                  }
                />
              </section>
            )}

            <section id="entry" className="dashboard-section">
              <TransactionForm
                categories={categories}
                initial={editingTransaction}
                onCancelEdit={() => setEditingTransaction(null)}
                onSubmit={(payload: TransactionPayload) =>
                  run(
                    async () => {
                      if (editingTransaction) {
                        await api.updateTransaction(editingTransaction.id, payload);
                        setEditingTransaction(null);
                      } else {
                        await api.createTransaction(payload);
                      }
                    },
                    editingTransaction ? "거래를 수정했습니다." : "거래를 추가했습니다.",
                  )
                }
              />
            </section>
          </div>

          <section id="categories" className="dashboard-section">
            <CategoryManager
              categories={categories}
              onCreate={(payload) => run(() => api.createCategory(payload), "카테고리를 추가했습니다.")}
              onDelete={(id) => run(() => api.deleteCategory(id), "카테고리를 삭제했습니다.")}
              onUpdate={(id, payload) => run(() => api.updateCategory(id, payload), "카테고리를 저장했습니다.")}
            />
          </section>
        </div>

        <section id="history" className="dashboard-section">
          <TransactionTable
            categories={categories}
            filters={filters}
            transactions={transactions}
            onCancelTransaction={(id, payload) => run(() => api.createCancellation(id, payload), "취소 금액을 반영했습니다.")}
            onDelete={(id) => run(() => api.deleteTransaction(id), "거래를 삭제했습니다.")}
            onDeleteCancellation={(id) => run(() => api.deleteCancellation(id), "취소 내역을 삭제했습니다.")}
            onEdit={(transaction) => {
              setEditingTransaction(transaction);
              window.setTimeout(() => scrollToSection("entry"), 0);
            }}
            onFiltersChange={setFilters}
          />
        </section>
      </div>
    </main>
  );
}

function DashboardSectionTabs({
  sections,
  activeSection,
  onSelect,
}: {
  sections: Array<{ id: DashboardSectionId; label: string; icon: LucideIcon }>;
  activeSection: DashboardSectionId;
  onSelect: (sectionId: DashboardSectionId) => void;
}) {
  return (
    <nav aria-label="대시보드 섹션" className="border-t border-slate-100 bg-white/90">
      <div className="thin-scrollbar mx-auto flex max-w-7xl gap-2 overflow-x-auto px-3 pb-2 sm:px-4">
        {sections.map(({ id, label, icon: Icon }) => {
          const isActive = activeSection === id;
          return (
            <button
              aria-current={isActive ? "page" : undefined}
              className={`inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-semibold transition ${
                isActive
                  ? "border-slate-950 bg-slate-950 text-white shadow-sm"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
              key={id}
              type="button"
              onClick={() => onSelect(id)}
            >
              <Icon aria-hidden className="h-4 w-4" />
              {label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
