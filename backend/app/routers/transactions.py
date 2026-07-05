from datetime import date
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.dependencies import get_current_user
from app.models.category import Category
from app.models.transaction import Cancellation, Transaction
from app.models.user import User
from app.schemas.transaction import CancellationCreate, CancellationRead, TransactionCreate, TransactionRead, TransactionUpdate
from app.services.budgeting import month_range, validate_month
from app.services.calculations import cancellation_total, decimal_money, effective_amount, serialize_transaction
from app.services.export import transactions_to_csv, transactions_to_xlsx

router = APIRouter(prefix="/transactions", tags=["transactions"])


def normalize_card_fields(payment_method: str, card_type: str | None) -> str | None:
    if payment_method == "credit_card":
        return "credit"
    if payment_method == "debit_card":
        return "debit"
    return card_type


def ensure_category(db: Session, user_id: int, category_id: int) -> Category:
    category = db.get(Category, category_id)
    if not category or category.user_id != user_id or not category.is_active:
        raise HTTPException(status_code=404, detail="Category not found")
    return category


def get_owned_transaction(db: Session, user_id: int, transaction_id: int) -> Transaction:
    transaction = (
        db.query(Transaction)
        .options(joinedload(Transaction.category), joinedload(Transaction.cancellations))
        .filter(Transaction.id == transaction_id, Transaction.user_id == user_id)
        .first()
    )
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return transaction


@router.get("", response_model=list[TransactionRead])
def list_transactions(
    month: str | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    category_id: int | None = None,
    payment_method: str | None = None,
    card_type: str | None = None,
    is_excluded: bool | None = None,
    search: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[TransactionRead]:
    query = (
        db.query(Transaction)
        .options(joinedload(Transaction.category), joinedload(Transaction.cancellations))
        .filter(Transaction.user_id == current_user.id)
    )
    if month:
        first, next_first = month_range(validate_month(month))
        query = query.filter(Transaction.date >= first, Transaction.date < next_first)
    if date_from:
        query = query.filter(Transaction.date >= date_from)
    if date_to:
        query = query.filter(Transaction.date <= date_to)
    if category_id:
        query = query.filter(Transaction.category_id == category_id)
    if payment_method:
        query = query.filter(Transaction.payment_method == payment_method)
    if card_type:
        query = query.filter(Transaction.card_type == card_type)
    if is_excluded is not None:
        query = query.filter(Transaction.is_excluded.is_(is_excluded))
    if search:
        keyword = f"%{search.strip()}%"
        query = query.join(Category).filter(
            or_(
                Transaction.merchant.ilike(keyword),
                Transaction.memo.ilike(keyword),
                Category.name.ilike(keyword),
            )
        )

    transactions = query.order_by(Transaction.date.desc(), Transaction.id.desc()).all()
    return [serialize_transaction(item) for item in transactions]


@router.post("", response_model=TransactionRead, status_code=status.HTTP_201_CREATED)
def create_transaction(
    payload: TransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TransactionRead:
    ensure_category(db, current_user.id, payload.category_id)
    payment_method = payload.payment_method
    transaction = Transaction(
        user_id=current_user.id,
        category_id=payload.category_id,
        date=payload.date,
        merchant=payload.merchant,
        amount=Decimal(str(payload.amount)),
        payment_method=payment_method,
        card_name=payload.card_name,
        card_type=normalize_card_fields(payment_method, payload.card_type),
        is_excluded=payload.is_excluded,
        exclusion_reason=payload.exclusion_reason,
        memo=payload.memo,
    )
    db.add(transaction)
    db.commit()
    return serialize_transaction(get_owned_transaction(db, current_user.id, transaction.id))


@router.get("/export")
def export_transactions(
    month: str = Query(...),
    format: str = Query("csv", pattern="^(csv|xlsx)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    first, next_first = month_range(validate_month(month))
    transactions = (
        db.query(Transaction)
        .options(joinedload(Transaction.category), joinedload(Transaction.cancellations))
        .filter(Transaction.user_id == current_user.id, Transaction.date >= first, Transaction.date < next_first)
        .order_by(Transaction.date.desc(), Transaction.id.desc())
        .all()
    )

    if format == "xlsx":
        content = transactions_to_xlsx(transactions)
        return Response(
            content=content,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f'attachment; filename="transactions-{month}.xlsx"'},
        )

    csv_content = transactions_to_csv(transactions)
    return Response(
        content=csv_content.encode("utf-8-sig"),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="transactions-{month}.csv"'},
    )


@router.put("/{transaction_id}", response_model=TransactionRead)
def update_transaction(
    transaction_id: int,
    payload: TransactionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TransactionRead:
    transaction = get_owned_transaction(db, current_user.id, transaction_id)
    updates = payload.model_dump(exclude_unset=True)
    if "category_id" in updates and updates["category_id"] is not None:
        ensure_category(db, current_user.id, updates["category_id"])
    if "amount" in updates and updates["amount"] is not None:
        if cancellation_total(transaction) > Decimal(str(updates["amount"])):
            raise HTTPException(status_code=400, detail="Amount cannot be less than cancelled amount")
        transaction.amount = Decimal(str(updates.pop("amount")))
    for field in (
        "date",
        "merchant",
        "category_id",
        "payment_method",
        "card_name",
        "card_type",
        "is_excluded",
        "exclusion_reason",
        "memo",
    ):
        if field in updates:
            setattr(transaction, field, updates[field])

    transaction.card_type = normalize_card_fields(transaction.payment_method, transaction.card_type)
    db.commit()
    return serialize_transaction(get_owned_transaction(db, current_user.id, transaction.id))


@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    transaction = get_owned_transaction(db, current_user.id, transaction_id)
    db.delete(transaction)
    db.commit()


@router.post("/{transaction_id}/cancellations", response_model=TransactionRead, status_code=status.HTTP_201_CREATED)
def create_cancellation(
    transaction_id: int,
    payload: CancellationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TransactionRead:
    transaction = get_owned_transaction(db, current_user.id, transaction_id)
    amount = Decimal(str(payload.amount))
    if amount > effective_amount(transaction):
        raise HTTPException(status_code=400, detail="Cancellation exceeds remaining transaction amount")

    db.add(
        Cancellation(
            user_id=current_user.id,
            transaction_id=transaction.id,
            date=payload.date,
            amount=amount,
            memo=payload.memo,
        )
    )
    db.commit()
    return serialize_transaction(get_owned_transaction(db, current_user.id, transaction.id))


@router.delete("/cancellations/{cancellation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_cancellation(
    cancellation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    cancellation = db.get(Cancellation, cancellation_id)
    if not cancellation or cancellation.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Cancellation not found")
    db.delete(cancellation)
    db.commit()

