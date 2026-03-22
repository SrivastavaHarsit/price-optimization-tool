from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import ProductCreate, ProductUpdate

router = APIRouter(prefix="/api/products", tags=["products"])


@router.get("")
async def list_products(
    search: str | None = Query(default=None),
    category: str | None = Query(default=None),
    session: AsyncSession = Depends(get_db),
):
    sql = """
        SELECT
            id,
            name,
            description,
            cost_price,
            selling_price,
            category,
            stock_available,
            units_sold,
            customer_rating,
            demand_forecast,
            optimized_price,
            created_at,
            updated_at
        FROM products
        WHERE 1=1
    """

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



@router.get("/categories")
async def get_categories(session: AsyncSession = Depends(get_db)):
    result = await session.execute(
        text(
            """
            SELECT DISTINCT category
            FROM products
            ORDER BY category;

            """
        )
    )

    rows = result.mappings().all() # Go through
    return [row["category"] for row in rows] # Go through



@router.get("/{product_id}")
async def get_product(
    product_id: int,
    session: AsyncSession = Depends(get_db),
):
    result = await session.execute(
        text(
            """
            SELECT
                id,
                name,
                description,
                cost_price,
                selling_price,
                category,
                stock_available,
                units_sold,
                customer_rating,
                demand_forecast,
                optimized_price,
                created_at,
                updated_at
            FROM products
            WHERE id = :product_id;
            """
        ),
        {"product_id": product_id},
    )

    row = result.mappings().first()

    if row is None:
        raise HTTPException(status_code=404, detail="Product not found")

    return dict(row)


@router.post("", status_code=201)
async def create_product(
    product: ProductCreate,
    session: AsyncSession = Depends(get_db),
):
    result = await session.execute(
        text(
            """
            INSERT INTO products (
                name,
                description,
                cost_price,
                selling_price,
                category,
                stock_available,
                units_sold,
                customer_rating,
                demand_forecast,
                optimized_price
            )
            VALUES (
                :name,
                :description,
                :cost_price,
                :selling_price,
                :category,
                :stock_available,
                :units_sold,
                :customer_rating,
                :demand_forecast,
                :optimized_price
            )
            RETURNING
                id,
                name,
                description,
                cost_price,
                selling_price,
                category,
                stock_available,
                units_sold,
                customer_rating,
                demand_forecast,
                optimized_price,
                created_at,
                updated_at;
            """
        ),
        {
            "name": product.name,
            "description": product.description,
            "cost_price": product.cost_price,
            "selling_price": product.selling_price,
            "category": product.category,
            "stock_available": product.stock_available,
            "units_sold": product.units_sold,
            "customer_rating": product.customer_rating,
            "demand_forecast": product.demand_forecast,
            "optimized_price": product.optimized_price,
        },
    )

    row = result.mappings().first()
    return dict(row)




@router.put("/{product_id}")
async def update_product(
    product_id: int,
    product: ProductUpdate,
    session: AsyncSession = Depends(get_db),
):
    update_data = product.model_dump(exclude_unset=True) # Go through

    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    set_parts = []
    params = {"product_id": product_id}

    for field, value in update_data.items():
        set_parts.append(f"{field} = :{field}")
        params[field] = value

    sql = f"""
        UPDATE products
        SET {", ".join(set_parts)}, updated_at = CURRENT_TIMESTAMP
        WHERE id = :product_id
        RETURNING
            id,
            name,
            description,
            cost_price,
            selling_price,
            category,
            stock_available,
            units_sold,
            customer_rating,
            demand_forecast,
            optimized_price,
            created_at,
            updated_at;
    """

    result = await session.execute(text(sql), params)
    row = result.mappings().first()

    if row is None:
        raise HTTPException(status_code=404, detail="Product not found")

    return dict(row)


@router.delete("/{product_id}")
async def delete_product(
    product_id: int,
    session: AsyncSession = Depends(get_db),
):
    result = await session.execute(
        text(
            """
            DELETE FROM products
            WHERE id = :product_id
            RETURNING id;
            """
        ),
        {"product_id": product_id},
    )

    row = result.mappings().first()

    if row is None:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return {"message": "Product deleted", "id": product_id}






