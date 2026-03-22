from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import close_db, get_db, init_db
from app.routes.products import router as products_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield
    await close_db()


app = FastAPI(
    title="Price Optimization Tool",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(products_router)


@app.get("/api/health", tags=["health"])
async def health():
    return {"status": "ok", "service": "backend"}


@app.get("/api/db-health", tags=["health"])
async def db_health(session: AsyncSession = Depends(get_db)):
    result = await session.execute(text("SELECT 1"))
    value = result.scalar_one()
    return {"status": "ok", "db": value}
