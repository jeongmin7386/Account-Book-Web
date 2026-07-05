from pydantic import BaseModel, ConfigDict, Field


class CategoryBase(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    color: str = Field(default="#2563eb", pattern=r"^#[0-9a-fA-F]{6}$")


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=80)
    color: str | None = Field(default=None, pattern=r"^#[0-9a-fA-F]{6}$")
    is_active: bool | None = None


class CategoryRead(CategoryBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    is_default: bool
    is_active: bool
