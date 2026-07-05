from pydantic import BaseModel, ConfigDict, Field


class MonthBudgetBase(BaseModel):
    salary: float = Field(default=0, ge=0)
    savings_goal: float = Field(default=0, ge=0)
    alert_threshold_ratio: float = Field(default=0.2, ge=0, le=1)


class MonthBudgetUpdate(MonthBudgetBase):
    pass


class MonthBudgetRead(MonthBudgetBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    month: str


class FixedExpenseBase(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    amount: float = Field(ge=0)
    memo: str | None = Field(default=None, max_length=500)


class FixedExpenseCreate(FixedExpenseBase):
    pass


class FixedExpenseUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    amount: float | None = Field(default=None, ge=0)
    memo: str | None = Field(default=None, max_length=500)


class FixedExpenseRead(FixedExpenseBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
