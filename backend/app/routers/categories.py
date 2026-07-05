from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.category import Category
from app.models.user import User
from app.schemas.category import CategoryCreate, CategoryRead, CategoryUpdate

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("", response_model=list[CategoryRead])
def list_categories(
    include_inactive: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Category]:
    query = db.query(Category).filter(Category.user_id == current_user.id)
    if not include_inactive:
        query = query.filter(Category.is_active.is_(True))
    return query.order_by(Category.is_default.desc(), Category.name).all()


@router.post("", response_model=CategoryRead, status_code=status.HTTP_201_CREATED)
def create_category(
    payload: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Category:
    category = Category(
        user_id=current_user.id,
        name=payload.name.strip(),
        color=payload.color,
        is_default=False,
    )
    db.add(category)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=400, detail="Category name already exists") from exc
    db.refresh(category)
    return category


@router.put("/{category_id}", response_model=CategoryRead)
def update_category(
    category_id: int,
    payload: CategoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Category:
    category = db.get(Category, category_id)
    if not category or category.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Category not found")

    updates = payload.model_dump(exclude_unset=True)
    if "name" in updates and updates["name"]:
        category.name = updates["name"].strip()
    if "color" in updates and updates["color"]:
        category.color = updates["color"]
    if "is_active" in updates:
        category.is_active = updates["is_active"]
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=400, detail="Category name already exists") from exc
    db.refresh(category)
    return category


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    category = db.get(Category, category_id)
    if not category or category.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Category not found")
    category.is_active = False
    db.commit()
