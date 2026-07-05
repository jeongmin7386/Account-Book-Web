from sqlalchemy.orm import Session

from app.models.category import Category


DEFAULT_CATEGORIES = [
    ("식비", "#ef4444"),
    ("카페/간식", "#f97316"),
    ("교통", "#0ea5e9"),
    ("생활용품", "#14b8a6"),
    ("주거/관리비", "#8b5cf6"),
    ("통신", "#2563eb"),
    ("의료/건강", "#22c55e"),
    ("쇼핑", "#ec4899"),
    ("문화/여가", "#f59e0b"),
    ("저축/투자", "#10b981"),
    ("기타", "#64748b"),
]


def ensure_default_categories(db: Session, user_id: int) -> None:
    existing = db.query(Category).filter(Category.user_id == user_id).first()
    if existing:
        return

    db.add_all(
        Category(user_id=user_id, name=name, color=color, is_default=True)
        for name, color in DEFAULT_CATEGORIES
    )
    db.commit()
