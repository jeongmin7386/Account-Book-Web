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

function resolveApiBaseUrl() {
  const explicitUrl = import.meta.env.VITE_API_URL;
  if (explicitUrl) return explicitUrl;

  const renderHost = import.meta.env.VITE_API_HOST;
  if (renderHost) {
    const host = renderHost.includes(".") ? renderHost : `${renderHost}.onrender.com`;
    return `https://${host}/api`;
  }

  return "http://localhost:8000/api";
}

const API_BASE_URL = resolveApiBaseUrl();

export class ApiError extends Error {
  status: number;
  detail: unknown;

  constructor(status: number, detail: unknown) {
    super(typeof detail === "string" ? detail : "요청을 처리하지 못했습니다.");
    this.status = status;
    this.detail = detail;
  }
}

function authHeaders(): HeadersInit {
  const token = localStorage.getItem("budget-token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
      ...(options.headers ?? {}),
    },
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") ?? "";
  const data = contentType.includes("application/json") ? await response.json() : await response.text();

  if (!response.ok) {
    throw new ApiError(response.status, data.detail ?? data);
  }

  return data as T;
}

function queryString(params: Record<string, string | number | boolean | undefined | null>): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  });
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export const api = {
  login(email: string, password: string) {
    return request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },
  register(email: string, password: string, name?: string) {
    return request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, name }),
    });
  },
  me() {
    return request<User>("/auth/me");
  },
  overview(month: string) {
    return request<DashboardOverview>(`/months/${month}/overview`);
  },
  updateBudget(month: string, payload: Omit<MonthBudget, "id" | "month">) {
    return request<MonthBudget>(`/months/${month}/budget`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },
  copyPrevious(month: string) {
    return request<DashboardOverview>(`/months/${month}/copy-previous?replace_fixed_expenses=true`, {
      method: "POST",
    });
  },
  createFixedExpense(month: string, payload: Omit<FixedExpense, "id">) {
    return request<FixedExpense>(`/months/${month}/fixed-expenses`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  updateFixedExpense(month: string, id: number, payload: Omit<FixedExpense, "id">) {
    return request<FixedExpense>(`/months/${month}/fixed-expenses/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },
  deleteFixedExpense(month: string, id: number) {
    return request<void>(`/months/${month}/fixed-expenses/${id}`, { method: "DELETE" });
  },
  categories() {
    return request<Category[]>("/categories");
  },
  createCategory(payload: Pick<Category, "name" | "color">) {
    return request<Category>("/categories", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  updateCategory(id: number, payload: Partial<Pick<Category, "name" | "color" | "is_active">>) {
    return request<Category>(`/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },
  deleteCategory(id: number) {
    return request<void>(`/categories/${id}`, { method: "DELETE" });
  },
  transactions(month: string, filters: TransactionFilters) {
    const query = queryString({ month, ...filters });
    return request<Transaction[]>(`/transactions${query}`);
  },
  createTransaction(payload: TransactionPayload) {
    return request<Transaction>("/transactions", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  updateTransaction(id: number, payload: TransactionPayload) {
    return request<Transaction>(`/transactions/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },
  deleteTransaction(id: number) {
    return request<void>(`/transactions/${id}`, { method: "DELETE" });
  },
  createCancellation(id: number, payload: { date: string; amount: number; memo?: string | null }) {
    return request<Transaction>(`/transactions/${id}/cancellations`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  deleteCancellation(id: number) {
    return request<void>(`/transactions/cancellations/${id}`, { method: "DELETE" });
  },
  async downloadExport(month: string, format: "csv" | "xlsx") {
    const response = await fetch(`${API_BASE_URL}/transactions/export${queryString({ month, format })}`, {
      headers: authHeaders(),
    });
    if (!response.ok) {
      throw new ApiError(response.status, await response.text());
    }
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `transactions-${month}.${format}`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(url);
  },
};
