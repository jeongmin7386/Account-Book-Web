import csv
from io import BytesIO, StringIO

from openpyxl import Workbook

from app.models.transaction import Transaction
from app.services.calculations import cancellation_status, cancellation_total, effective_amount, money


EXPORT_HEADERS = [
    "날짜",
    "사용처",
    "금액",
    "실반영금액",
    "카테고리",
    "결제수단",
    "카드명",
    "카드종류",
    "제외여부",
    "취소상태",
    "취소금액",
    "메모",
]


def transaction_row(transaction: Transaction) -> list[object]:
    return [
        transaction.date.isoformat(),
        transaction.merchant,
        money(transaction.amount),
        money(effective_amount(transaction)),
        transaction.category.name,
        transaction.payment_method,
        transaction.card_name or "",
        transaction.card_type or "",
        "Y" if transaction.is_excluded else "N",
        cancellation_status(transaction),
        money(cancellation_total(transaction)),
        transaction.memo or "",
    ]


def transactions_to_csv(transactions: list[Transaction]) -> str:
    buffer = StringIO()
    writer = csv.writer(buffer)
    writer.writerow(EXPORT_HEADERS)
    for transaction in transactions:
        writer.writerow(transaction_row(transaction))
    return buffer.getvalue()


def transactions_to_xlsx(transactions: list[Transaction]) -> bytes:
    workbook = Workbook()
    worksheet = workbook.active
    worksheet.title = "transactions"
    worksheet.append(EXPORT_HEADERS)
    for transaction in transactions:
        worksheet.append(transaction_row(transaction))

    for column_cells in worksheet.columns:
        max_length = max(len(str(cell.value or "")) for cell in column_cells)
        worksheet.column_dimensions[column_cells[0].column_letter].width = min(max_length + 3, 30)

    buffer = BytesIO()
    workbook.save(buffer)
    return buffer.getvalue()
