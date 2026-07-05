from datetime import date
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.budget import MonthBudget


def validate_month(month: str) -> str:
    try:
        parsed = date.fromisoformat(f"{month}-01")
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="month must be in YYYY-MM format",
        ) from exc
    return parsed.strftime("%Y-%m")


def previous_month(month: str) -> str:
    first = date.fromisoformat(f"{validate_month(month)}-01")
    if first.month == 1:
        return f"{first.year - 1}-12"
    return f"{first.year}-{first.month - 1:02d}"


def month_range(month: str) -> tuple[date, date]:
    first = date.fromisoformat(f"{validate_month(month)}-01")
    if first.month == 12:
        next_first = date(first.year + 1, 1, 1)
    else:
        next_first = date(first.year, first.month + 1, 1)
    return first, next_first


def get_or_create_budget(db: Session, user_id: int, month: str) -> MonthBudget:
    month = validate_month(month)
    budget = (
        db.query(MonthBudget)
        .filter(MonthBudget.user_id == user_id, MonthBudget.month == month)
        .first()
    )
    if budget:
        return budget

    budget = MonthBudget(
        user_id=user_id,
        month=month,
        salary=Decimal("0"),
        initial_cash_asset=Decimal("0"),
        savings_goal=Decimal("0"),
        alert_threshold_ratio=Decimal("0.2"),
    )
    db.add(budget)
    db.commit()
    db.refresh(budget)
    return budget
