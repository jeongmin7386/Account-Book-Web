export type PaymentMethod = "credit_card" | "debit_card" | "cash" | "bank_transfer" | "easy_pay";
export type CardType = "credit" | "debit";
export type CancellationStatus = "none" | "partial" | "full";

export interface User {
  id: number;
  email: string;
  name?: string | null;
}

export interface AuthResponse {
  access_token: string;
  token_type: "bearer";
  user: User;
}

export interface Category {
  id: number;
  name: string;
  color: string;
  is_default: boolean;
  is_active: boolean;
}

export interface MonthBudget {
  id: number;
  month: string;
  salary: number;
  savings_goal: number;
  alert_threshold_ratio: number;
}

export interface FixedExpense {
  id: number;
  name: string;
  amount: number;
  memo?: string | null;
}

export interface Cancellation {
  id: number;
  date: string;
  amount: number;
  memo?: string | null;
}

export interface Transaction {
  id: number;
  date: string;
  merchant: string;
  amount: number;
  category_id: number;
  payment_method: PaymentMethod;
  card_name?: string | null;
  card_type?: CardType | null;
  is_excluded: boolean;
  exclusion_reason?: string | null;
  memo?: string | null;
  category: Category;
  cancellations: Cancellation[];
  cancelled_amount: number;
  effective_amount: number;
  cancellation_status: CancellationStatus;
}

export interface TransactionPayload {
  date: string;
  merchant: string;
  amount: number;
  category_id: number;
  payment_method: PaymentMethod;
  card_name?: string | null;
  card_type?: CardType | null;
  is_excluded: boolean;
  exclusion_reason?: string | null;
  memo?: string | null;
}

export interface DashboardSummary {
  salary: number;
  fixed_expense_total: number;
  monthly_free_money: number;
  usable_funds: number;
  credit_card_spending: number;
  debit_card_spending: number;
  cash_spending: number;
  current_remaining_usable_funds: number;
  savings_goal: number;
  target_savings_gap: number;
  alert_threshold_ratio: number;
  warning: boolean;
}

export interface ChartItem {
  name: string;
  value: number;
  color?: string | null;
}

export interface DailyTrendItem {
  date: string;
  amount: number;
}

export interface DashboardOverview {
  budget: MonthBudget;
  fixed_expenses: FixedExpense[];
  summary: DashboardSummary;
  category_spending: ChartItem[];
  payment_method_spending: ChartItem[];
  daily_spending: DailyTrendItem[];
  recent_transactions: Transaction[];
}

export interface TransactionFilters {
  date_from?: string;
  date_to?: string;
  category_id?: string;
  payment_method?: string;
  card_type?: string;
  is_excluded?: string;
  search?: string;
}
