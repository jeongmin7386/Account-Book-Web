from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Numeric, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class MonthBudget(Base):
    __tablename__ = "month_budgets"
    __table_args__ = (UniqueConstraint("user_id", "month", name="uq_budget_user_month"),)

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True, nullable=False)
    month: Mapped[str] = mapped_column(String(7), index=True, nullable=False)
    salary: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=0)
    initial_cash_asset: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=0)
    savings_goal: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=0)
    alert_threshold_ratio: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=0.2)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="budgets")
    fixed_expenses = relationship(
        "FixedExpense",
        back_populates="budget",
        cascade="all, delete-orphan",
        order_by="FixedExpense.id",
    )


class FixedExpense(Base):
    __tablename__ = "fixed_expenses"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True, nullable=False)
    month_budget_id: Mapped[int] = mapped_column(ForeignKey("month_budgets.id"), index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=0)
    memo: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    budget = relationship("MonthBudget", back_populates="fixed_expenses")
