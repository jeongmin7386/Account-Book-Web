from collections import defaultdict
from decimal import Decimal, ROUND_HALF_UP

from sqlalchemy.orm import Session, joinedload

from app.models.budget import FixedExpense
from app.models.category import Category
from app.models.transaction import Transaction
from app.models.user import User
from app.schemas.transaction import TransactionRead
from app.services.budgeting import get_or_create_budget, month_range


PAYMENT_LABELS = {
    "credit_card": "신용카드",
    "debit_card": "체크카드",
    "cash": "현금",
    "bank_transfer": "계좌이체",
    "easy_pay": "간편결제",
}

PAYMENT_COLORS = {
    "credit_card": "#4f46e5",
    "debit_card": "#0f766e",
    "cash": "#ca8a04",
    "bank_transfer": "#0284c7",
    "easy_pay": "#db2777",
}


def decimal_money(value: object) -> Decimal:
    return Decimal(str(value or 0)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def money(value: object) -> float:
    return float(decimal_money(value))


def cancellation_total(transaction: Transaction) -> Decimal:
    return sum((decimal_money(cancel.amount) for cancel in transaction.cancellations), Decimal("0"))


def effective_amount(transaction: Transaction) -> Decimal:
    remaining = decimal_money(transaction.amount) - cancellation_total(transaction)
    return max(remaining, Decimal("0"))


def cancellation_status(transaction: Transaction) -> str:
    cancelled = cancellation_total(transaction)
    if cancelled <= 0:
        return "none"
    if cancelled >= decimal_money(transaction.amount):
        return "full"
    return "partial"


def serialize_transaction(transaction: Transaction) -> TransactionRead:
    return TransactionRead.model_validate(
        {
            **transaction.__dict__,
            "category": transaction.category,
            "cancellations": transaction.cancellations,
            "cancelled_amount": money(cancellation_total(transaction)),
            "effective_amount": money(effective_amount(transaction)),
            "cancellation_status": cancellation_status(transaction),
        }
    )


def query_month_transactions(db: Session, user_id: int, month: str) -> list[Transaction]:
    first, next_first = month_range(month)
    return (
        db.query(Transaction)
        .options(joinedload(Transaction.category), joinedload(Transaction.cancellations))
        .filter(
            Transaction.user_id == user_id,
            Transaction.date >= first,
            Transaction.date < next_first,
        )
        .order_by(Transaction.date.desc(), Transaction.id.desc())
        .all()
    )


def calculate_overview(db: Session, user: User, month: str) -> dict:
    budget = get_or_create_budget(db, user.id, month)
    fixed_expenses = (
        db.query(FixedExpense)
        .filter(FixedExpense.user_id == user.id, FixedExpense.month_budget_id == budget.id)
        .order_by(FixedExpense.id)
        .all()
    )
    transactions = query_month_transactions(db, user.id, month)

    fixed_total = sum((decimal_money(item.amount) for item in fixed_expenses), Decimal("0"))
    salary = decimal_money(budget.salary)
    monthly_free = salary - fixed_total

    credit_total = Decimal("0")
    debit_total = Decimal("0")
    cash_total = Decimal("0")
    category_totals: dict[int, Decimal] = defaultdict(lambda: Decimal("0"))
    payment_totals: dict[str, Decimal] = defaultdict(lambda: Decimal("0"))
    daily_totals: dict[str, Decimal] = defaultdict(lambda: Decimal("0"))
    category_lookup: dict[int, Category] = {}

    for transaction in transactions:
        amount = effective_amount(transaction)
        if transaction.is_excluded or amount <= 0:
            continue

        if transaction.payment_method == "credit_card":
            credit_total += amount
        elif transaction.payment_method == "debit_card":
            debit_total += amount
        else:
            cash_total += amount

        category_totals[transaction.category_id] += amount
        payment_totals[transaction.payment_method] += amount
        daily_totals[transaction.date.isoformat()] += amount
        category_lookup[transaction.category_id] = transaction.category

    usable_funds = monthly_free
    current_remaining = monthly_free - credit_total - debit_total - cash_total
    threshold_ratio = decimal_money(budget.alert_threshold_ratio)
    warning = bool(usable_funds > 0 and current_remaining <= (usable_funds * threshold_ratio))
    savings_goal = decimal_money(budget.savings_goal)
    target_savings_gap = max(savings_goal - current_remaining, Decimal("0"))

    category_spending = [
        {
            "name": category_lookup[category_id].name,
            "value": money(total),
            "color": category_lookup[category_id].color,
        }
        for category_id, total in sorted(category_totals.items(), key=lambda item: item[1], reverse=True)
    ]

    payment_method_spending = [
        {
            "name": PAYMENT_LABELS.get(method, method),
            "value": money(total),
            "color": PAYMENT_COLORS.get(method),
        }
        for method, total in sorted(payment_totals.items(), key=lambda item: item[1], reverse=True)
    ]

    daily_spending = [
        {"date": day, "amount": money(total)}
        for day, total in sorted(daily_totals.items(), key=lambda item: item[0])
    ]

    return {
        "budget": budget,
        "fixed_expenses": fixed_expenses,
        "summary": {
            "salary": money(salary),
            "fixed_expense_total": money(fixed_total),
            "monthly_free_money": money(monthly_free),
            "usable_funds": money(usable_funds),
            "credit_card_spending": money(credit_total),
            "debit_card_spending": money(debit_total),
            "cash_spending": money(cash_total),
            "current_remaining_usable_funds": money(current_remaining),
            "savings_goal": money(savings_goal),
            "target_savings_gap": money(target_savings_gap),
            "alert_threshold_ratio": money(threshold_ratio),
            "warning": warning,
        },
        "category_spending": category_spending,
        "payment_method_spending": payment_method_spending,
        "daily_spending": daily_spending,
        "recent_transactions": [serialize_transaction(item) for item in transactions[:8]],
    }
