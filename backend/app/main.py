import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import models
from app.database import Base, engine
from app.routers import auth, categories, months, transactions

app = FastAPI(title="Manual Budget API", version="0.1.0")

default_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
extra_origins = [
    origin.strip()
    for origin in os.getenv("CORS_ALLOW_ORIGINS", "").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=default_origins + extra_origins,
    allow_origin_regex=r"https://.*\.onrender\.com",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    _ = models
    Base.metadata.create_all(bind=engine)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(auth.router, prefix="/api")
app.include_router(categories.router, prefix="/api")
app.include_router(months.router, prefix="/api")
app.include_router(transactions.router, prefix="/api")
