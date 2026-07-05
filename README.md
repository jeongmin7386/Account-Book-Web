# 수동 입력형 웹 가계부

FastAPI, SQLAlchemy, PostgreSQL/SQLite, React, Vite, TypeScript, Tailwind CSS 기반의 수동 입력형 가계부입니다.

## 주요 기능

- 사용자별 로그인 및 bcrypt 비밀번호 암호화 저장
- 월별 급여, 목표 저축, 경고 비율 관리
- 월별 고정지출 관리 및 지난달 급여/고정지출 복사
- 신용카드, 체크카드, 현금, 계좌이체, 간편결제 지출 직접 입력 및 월 여유돈 차감
- 제외 거래 처리: 카드 결제대금 출금, 계좌 간 이동, 환불, 회사 비용 등
- 전체/부분 취소 금액 반영
- 거래 수정, 삭제, 필터, 검색
- 카테고리 추가, 수정, 삭제
- 대시보드 요약 및 카테고리/결제수단/일자별 차트
- CSV/XLSX 거래내역 내보내기

## 실행

백엔드:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

프론트엔드:

```powershell
cd frontend
pnpm install
pnpm run dev
```

프론트엔드는 기본적으로 `http://localhost:8000/api`를 호출합니다. 다른 주소를 쓰려면 `VITE_API_URL`을 설정하면 됩니다.

로컬 개발에서는 `DATABASE_URL`을 따로 설정하지 않으면 SQLite `backend/finance.db`를 사용합니다.

## Render Blueprint 배포

저장소 루트의 `render.yaml`을 GitHub `main` 브랜치에 포함해서 푸시한 뒤 Render에서 Blueprint로 배포합니다.

- Blueprint Path: 비워두거나 `render.yaml`
- Backend service: `account-book-api`
- Frontend static site: `account-book-web`
- Database: `account-book-db`

Render 배포에서는 PostgreSQL `account-book-db`를 사용합니다. `render.yaml`은 백엔드의 `DATABASE_URL`을 Render Postgres 연결 문자열로 자동 연결합니다.

기본 DB 플랜은 안정적인 장기 사용을 위해 `basic-256mb`로 설정되어 있습니다. 무료 Postgres를 쓰려면 `render.yaml`의 database plan을 `free`로 바꿀 수 있지만, 무료 DB는 제한과 만료 정책이 있어 실제 사용 데이터 보관에는 권장하지 않습니다.
