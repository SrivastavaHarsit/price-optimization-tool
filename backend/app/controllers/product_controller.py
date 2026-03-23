from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import ProductCreate, ProductUpdate
from app.repositories import product_repo


async def list_products(
    session: AsyncSession,
    search: str | None = None,
    category: str | None = None,
) -> list[dict]:
    return await product_repo.get_all(session, search=search, category=category)


async def get_categories(session: AsyncSession) -> list[str]:
    return await product_repo.get_distinct_categories(session)


async def get_product(session: AsyncSession, product_id: int) -> dict:
    product = await product_repo.get_by_id(session, product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


async def create_product(session: AsyncSession, product: ProductCreate) -> dict:
    return await product_repo.create(session, product.model_dump())


async def update_product(
    session: AsyncSession, product_id: int, product: ProductUpdate
) -> dict:
    update_data = product.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    updated = await product_repo.update(session, product_id, update_data)
    if updated is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return updated


async def delete_product(session: AsyncSession, product_id: int) -> dict:
    deleted = await product_repo.delete(session, product_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted", "id": product_id}
