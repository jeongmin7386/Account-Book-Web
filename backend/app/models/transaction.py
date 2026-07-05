from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True, nullable=False)
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id"), index=True, nullable=False)
    date: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    merchant: Mapped[str] = mapped_column(String(180), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    payment_method: Mapped[str] = mapped_column(String(30), index=True, nullable=False)
    card_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    card_type: Mapped[str | None] = mapped_column(String(20), index=True, nullable=True)
    is_excluded: Mapped[bool] = mapped_column(Boolean, default=False)
    exclusion_reason: Mapped[str | None] = mapped_column(String(200), nullable=True)
    memo: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="transactions")
    category = relationship("Category", back_populates="transactions")
    cancellations = relationship(
        "Cancellation",
        back_populates="transaction",
        cascade="all, delete-orphan",
        order_by="Cancellation.date",
    )


class Cancellation(Base):
    __tablename__ = "cancellations"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True, nullable=False)
    transaction_id: Mapped[int] = mapped_column(ForeignKey("transactions.id"), index=True, nullable=False)
    date: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    memo: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    transaction = relationship("Transaction", back_populates="cancellations")
