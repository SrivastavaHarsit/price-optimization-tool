from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.controllers import product_controller
from app.database import get_db
from app.models import ProductCreate, ProductUpdate

router = APIRouter(prefix="/api/products", tags=["products"])


@router.get("")
async def list_products(
    search: str | None = Query(default=None),
    category: str | None = Query(default=None),
    session: AsyncSession = Depends(get_db),
):
    return await product_controller.list_products(session, search=search, category=category)


@router.get("/categories")
async def get_categories(session: AsyncSession = Depends(get_db)):
    return await product_controller.get_categories(session)


@router.get("/{product_id}")
async def get_product(
    product_id: int,
    session: AsyncSession = Depends(get_db),
):
    return await product_controller.get_product(session, product_id)


@router.post("", status_code=201)
async def create_product(
    product: ProductCreate,
    session: AsyncSession = Depends(get_db),
):
    return await product_controller.create_product(session, product)


@router.put("/{product_id}")
async def update_product(
    product_id: int,
    product: ProductUpdate,
    session: AsyncSession = Depends(get_db),
):
    return await product_controller.update_product(session, product_id, product)


@router.delete("/{product_id}")
async def delete_product(
    product_id: int,
    session: AsyncSession = Depends(get_db),
):
    return await product_controller.delete_product(session, product_id)
