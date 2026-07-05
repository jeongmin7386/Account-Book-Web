from pydantic import BaseModel

from app.schemas.budget import FixedExpenseRead, MonthBudgetRead
from app.schemas.transaction import TransactionRead


class DashboardSummary(BaseModel):
    salary: float
    fixed_expense_total: float
    monthly_free_money: float
    usable_funds: float
    credit_card_spending: float
    debit_card_spending: float
    cash_spending: float
    current_remaining_usable_funds: float
    savings_goal: float
    target_savings_gap: float
    alert_threshold_ratio: float
    warning: bool


class ChartItem(BaseModel):
    name: str
    value: float
    color: str | None = None


class DailyTrendItem(BaseModel):
    date: str
    amount: float


class DashboardOverview(BaseModel):
    budget: MonthBudgetRead
    fixed_expenses: list[FixedExpenseRead]
    summary: DashboardSummary
    category_spending: list[ChartItem]
    payment_method_spending: list[ChartItem]
    daily_spending: list[DailyTrendItem]
    recent_transactions: list[TransactionRead]
