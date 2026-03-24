from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


_PRODUCT_COLUMNS = """
    id, name, description, cost_price, selling_price, category,
    stock_available, units_sold, customer_rating, demand_forecast,
    optimized_price, created_at, updated_at
"""


async def get_all(
    session: AsyncSession,
    *,
    search: str | None = None,
    category: str | None = None,
) -> list[dict]:
    sql = f"SELECT {_PRODUCT_COLUMNS} FROM products WHERE 1=1"
    params: dict[str, object] = {}

    if search:
        sql += " AND name ILIKE :search"
        params["search"] = f"%{search}%"

    if category:
        sql += " AND category = :category"
        params["category"] = category

    sql += " ORDER BY id;"  
    result = await session.execute(text(sql), params)
    return [dict(row) for row in result.mappings().all()]


async def get_distinct_categories(session: AsyncSession) -> list[str]:
    result = await session.execute(
        text("SELECT DISTINCT category FROM products ORDER BY category;")
    )
    return [row["category"] for row in result.mappings().all()]


async def get_by_id(session: AsyncSession, product_id: int) -> dict | None:
    result = await session.execute(
        text(f"SELECT {_PRODUCT_COLUMNS} FROM products WHERE id = :product_id;"),
        {"product_id": product_id},
    )
    row = result.mappings().first()
    return dict(row) if row else None


async def create(session: AsyncSession, data: dict) -> dict:
    result = await session.execute(
        text(f"""
            INSERT INTO products (
                name, description, cost_price, selling_price, category,
                stock_available, units_sold, customer_rating,
                demand_forecast, optimized_price
            )
            VALUES (
                :name, :description, :cost_price, :selling_price, :category,
                :stock_available, :units_sold, :customer_rating,
                :demand_forecast, :optimized_price
            )
            RETURNING {_PRODUCT_COLUMNS};
        """),
        data,
    )
    return dict(result.mappings().first())


async def update(
    session: AsyncSession, product_id: int, data: dict
) -> dict | None:
    set_parts = [f"{field} = :{field}" for field in data]
    params = {"product_id": product_id, **data}

    sql = f"""
        UPDATE products
        SET {", ".join(set_parts)}, updated_at = CURRENT_TIMESTAMP
        WHERE id = :product_id
        RETURNING {_PRODUCT_COLUMNS};
    """
    result = await session.execute(text(sql), params)
    row = result.mappings().first()
    return dict(row) if row else None


async def delete(session: AsyncSession, product_id: int) -> bool:
    result = await session.execute(
        text("DELETE FROM products WHERE id = :product_id RETURNING id;"),
        {"product_id": product_id},
    )
    return result.mappings().first() is not None
