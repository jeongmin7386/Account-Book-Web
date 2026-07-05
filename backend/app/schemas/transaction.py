from __future__ import annotations

from datetime import date as DateType
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.category import CategoryRead

PaymentMethod = Literal["credit_card", "debit_card", "cash", "bank_transfer", "easy_pay"]
CardType = Literal["credit", "debit"]
ExclusionFilter = Literal["all", "included", "excluded"]


class TransactionBase(BaseModel):
    date: DateType
    merchant: str = Field(min_length=1, max_length=180)
    amount: float = Field(gt=0)
    category_id: int
    payment_method: PaymentMethod
    card_name: str | None = Field(default=None, max_length=120)
    card_type: CardType | None = None
    is_excluded: bool = False
    exclusion_reason: str | None = Field(default=None, max_length=200)
    memo: str | None = None


class TransactionCreate(TransactionBase):
    pass


class TransactionUpdate(BaseModel):
    date: DateType | None = None
    merchant: str | None = Field(default=None, min_length=1, max_length=180)
    amount: float | None = Field(default=None, gt=0)
    category_id: int | None = None
    payment_method: PaymentMethod | None = None
    card_name: str | None = Field(default=None, max_length=120)
    card_type: CardType | None = None
    is_excluded: bool | None = None
    exclusion_reason: str | None = Field(default=None, max_length=200)
    memo: str | None = None


class CancellationBase(BaseModel):
    date: DateType
    amount: float = Field(gt=0)
    memo: str | None = None


class CancellationCreate(CancellationBase):
    pass


class CancellationRead(CancellationBase):
    model_config = ConfigDict(from_attributes=True)

    id: int


class TransactionRead(TransactionBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    category: CategoryRead
    cancellations: list[CancellationRead] = []
    cancelled_amount: float
    effective_amount: float
    cancellation_status: Literal["none", "partial", "full"]
