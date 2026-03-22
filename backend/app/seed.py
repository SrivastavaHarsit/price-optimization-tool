import asyncio
import csv
from pathlib import Path

from sqlalchemy import text

from app.database import engine

CSV_PATH = Path(__file__).resolve().parent.parent / "product_data.csv"


async def seed_products() -> None:
    if not CSV_PATH.exists():
        raise FileNotFoundError(f"CSV file not found: {CSV_PATH}")

    with CSV_PATH.open("r", encoding="utf-8", newline="") as file:
        rows = list(csv.DictReader(file))

    async with engine.begin() as conn:
        await conn.execute(text("TRUNCATE TABLE products RESTART IDENTITY;"))

        insert_sql = text(
            """
            INSERT INTO products (
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
                optimized_price
            )
            VALUES (
                :id,
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
            );
            """
        )

        for row in rows:
            await conn.execute(
                insert_sql,
                {
                    "id": int(row["product_id"]),
                    "name": row["name"],
                    "description": row["description"],
                    "cost_price": float(row["cost_price"]),
                    "selling_price": float(row["selling_price"]),
                    "category": row["category"],
                    "stock_available": int(row["stock_available"]),
                    "units_sold": int(row["units_sold"]),
                    "customer_rating": float(row["customer_rating"]),
                    "demand_forecast": int(row["demand_forecast"]),
                    "optimized_price": float(row["optimized_price"]),
                },
            )

        await conn.execute(
            text(
                """
                SELECT setval(
                    pg_get_serial_sequence('products', 'id'),
                    COALESCE((SELECT MAX(id) FROM products), 1),
                    true
                );
                """
            )
        )

    print(f"Seeded {len(rows)} products from {CSV_PATH.name}")


def main() -> None:
    asyncio.run(seed_products())


if __name__ == "__main__":
    main()
