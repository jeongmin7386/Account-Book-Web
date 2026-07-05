from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.budget import FixedExpense, MonthBudget
from app.models.user import User
from app.schemas.budget import (
    FixedExpenseCreate,
    FixedExpenseRead,
    FixedExpenseUpdate,
    MonthBudgetRead,
    MonthBudgetUpdate,
)
from app.schemas.dashboard import DashboardOverview
from app.services.budgeting import get_or_create_budget, previous_month, validate_month
from app.services.calculations import calculate_overview

router = APIRouter(prefix="/months", tags=["months"])


@router.get("/{month}/budget", response_model=MonthBudgetRead)
def get_budget(
    month: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MonthBudget:
    return get_or_create_budget(db, current_user.id, month)


@router.put("/{month}/budget", response_model=MonthBudgetRead)
def update_budget(
    month: str,
    payload: MonthBudgetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MonthBudget:
    budget = get_or_create_budget(db, current_user.id, month)
    budget.salary = Decimal(str(payload.salary))
    budget.savings_goal = Decimal(str(payload.savings_goal))
    budget.alert_threshold_ratio = Decimal(str(payload.alert_threshold_ratio))
    db.commit()
    db.refresh(budget)
    return budget


@router.get("/{month}/fixed-expenses", response_model=list[FixedExpenseRead])
def list_fixed_expenses(
    month: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[FixedExpense]:
    budget = get_or_create_budget(db, current_user.id, month)
    return (
        db.query(FixedExpense)
        .filter(FixedExpense.user_id == current_user.id, FixedExpense.month_budget_id == budget.id)
        .order_by(FixedExpense.id)
        .all()
    )


@router.post("/{month}/fixed-expenses", response_model=FixedExpenseRead, status_code=status.HTTP_201_CREATED)
def create_fixed_expense(
    month: str,
    payload: FixedExpenseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> FixedExpense:
    budget = get_or_create_budget(db, current_user.id, month)
    expense = FixedExpense(
        user_id=current_user.id,
        month_budget_id=budget.id,
        name=payload.name,
        amount=Decimal(str(payload.amount)),
        memo=payload.memo,
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense


@router.put("/{month}/fixed-expenses/{expense_id}", response_model=FixedExpenseRead)
def update_fixed_expense(
    month: str,
    expense_id: int,
    payload: FixedExpenseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> FixedExpense:
    budget = get_or_create_budget(db, current_user.id, month)
    expense = db.get(FixedExpense, expense_id)
    if not expense or expense.user_id != current_user.id or expense.month_budget_id != budget.id:
        raise HTTPException(status_code=404, detail="Fixed expense not found")

    updates = payload.model_dump(exclude_unset=True)
    for field in ("name", "memo"):
        if field in updates:
            setattr(expense, field, updates[field])
    if "amount" in updates and updates["amount"] is not None:
        expense.amount = Decimal(str(updates["amount"]))
    db.commit()
    db.refresh(expense)
    return expense


@router.delete("/{month}/fixed-expenses/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_fixed_expense(
    month: str,
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    budget = get_or_create_budget(db, current_user.id, month)
    expense = db.get(FixedExpense, expense_id)
    if not expense or expense.user_id != current_user.id or expense.month_budget_id != budget.id:
        raise HTTPException(status_code=404, detail="Fixed expense not found")
    db.delete(expense)
    db.commit()


@router.post("/{month}/copy-previous", response_model=DashboardOverview)
def copy_previous_month(
    month: str,
    replace_fixed_expenses: bool = Query(True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    month = validate_month(month)
    current_budget = get_or_create_budget(db, current_user.id, month)
    previous_budget = (
        db.query(MonthBudget)
        .filter(MonthBudget.user_id == current_user.id, MonthBudget.month == previous_month(month))
        .first()
    )
    if not previous_budget:
        raise HTTPException(status_code=404, detail="Previous month budget not found")

    current_budget.salary = previous_budget.salary
    current_budget.savings_goal = previous_budget.savings_goal
    current_budget.alert_threshold_ratio = previous_budget.alert_threshold_ratio

    if replace_fixed_expenses:
        (
            db.query(FixedExpense)
            .filter(FixedExpense.user_id == current_user.id, FixedExpense.month_budget_id == current_budget.id)
            .delete()
        )

    existing_count = (
        db.query(FixedExpense)
        .filter(FixedExpense.user_id == current_user.id, FixedExpense.month_budget_id == current_budget.id)
        .count()
    )
    if existing_count == 0:
        for expense in previous_budget.fixed_expenses:
            db.add(
                FixedExpense(
                    user_id=current_user.id,
                    month_budget_id=current_budget.id,
                    name=expense.name,
                    amount=expense.amount,
                    memo=expense.memo,
                )
            )

    db.commit()
    return calculate_overview(db, current_user, month)


@router.get("/{month}/overview", response_model=DashboardOverview)
def overview(
    month: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    return calculate_overview(db, current_user, month)
