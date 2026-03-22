# DOCUMENT 3: Backend + Database Implementation Guide

## BCG X Round 2 — Price Optimization Tool

**Stack:** FastAPI + asyncpg + PostgreSQL (local) + Pydantic v2
**Prepared for:** Harshit Srivastava

---

## What this document helps you do

This is your backend implementation blueprint for the live coding interview. It contains every schema detail, every query shape, every endpoint signature, every validation rule, and the exact order you should build things in. The goal is that during the interview, you already know what to type — you're executing from a mental model, not figuring things out.

---

## How to use this document in prep

1. Read the full schema section and write the CREATE TABLE from memory once
2. Read each endpoint and mentally trace the query + response shape
3. Practice the build order (Section 12) by walking through it out loud
4. Memorize the "what to say" phrases — they're what the interviewer hears while you code
5. On interview day, you should be able to type each endpoint in under 3 minutes

---

## SECTION 1: Backend Architecture for This Interview

### Keep it flat and simple

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py           # FastAPI app, lifespan, CORS, router registration
│   ├── database.py        # asyncpg pool init/close/get_db dependency
│   ├── models.py          # Pydantic request/response schemas
│   ├── routes/
│   │   ├── __init__.py
│   │   └── products.py    # All product endpoints
│   └── seed.py            # CSV → database loader
├── requirements.txt
├── .env
└── product_data.csv
```

**No service layer. No repository layer. No utils folder.**

For 6 endpoints and one table, routes that talk directly to the database via asyncpg is the right call. Adding abstraction layers for this scope would be over-engineering and waste interview time.

**What to say if asked about architecture:**
> "For this scope — one table, six endpoints — I'm keeping it flat: routes talk directly to the database via asyncpg. In production, I'd add a service layer for business logic and a repository layer for data access, which is what I do at my current company. But for this exercise, the extra indirection would add complexity without adding value."

**What to say if asked about ORM:**
> "I'm using raw SQL with asyncpg instead of SQLAlchemy because for a single-table CRUD app, the queries are simple enough that an ORM adds overhead without simplifying anything. asyncpg is also what I use in production — it's the fastest async Postgres driver for Python. If this grew to 10+ tables with complex relationships, I'd add SQLAlchemy."

---

## SECTION 2: Schema Design

### The products table

```sql
CREATE TABLE IF NOT EXISTS products (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    cost_price      NUMERIC(10,2) NOT NULL,
    selling_price   NUMERIC(10,2) NOT NULL,
    category        VARCHAR(100) NOT NULL,
    stock_available INTEGER DEFAULT 0,
    units_sold      INTEGER DEFAULT 0,
    customer_rating NUMERIC(2,1) DEFAULT 0,
    demand_forecast INTEGER DEFAULT 0,
    optimized_price NUMERIC(10,2) DEFAULT 0,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Field type decisions and why

| Field | Type | Why this type |
|-------|------|---------------|
| `id` | `SERIAL` | Auto-incrementing integer PK. Simple, fast, sufficient. UUID would be overkill for 10 products. |
| `name` | `VARCHAR(255)` | Bounded product name. Indexed for search. |
| `description` | `TEXT` | Unbounded text. No need to search or filter on this. |
| `cost_price` | `NUMERIC(10,2)` | **Never use FLOAT for money.** NUMERIC is exact decimal. 10 digits total, 2 after decimal = up to $99,999,999.99 |
| `selling_price` | `NUMERIC(10,2)` | Same as cost_price |
| `optimized_price` | `NUMERIC(10,2)` | Same — it's a price field |
| `category` | `VARCHAR(100)` | Bounded, indexed for filtering |
| `stock_available` | `INTEGER` | Whole units. No fractional stock. |
| `units_sold` | `INTEGER` | Whole units |
| `customer_rating` | `NUMERIC(2,1)` | 0.0 to 5.0. One decimal place. Covers ratings like 4.5 |
| `demand_forecast` | `INTEGER` | Whole unit forecast. The CSV has integer values. |
| `created_at` | `TIMESTAMP` | Audit trail. Auto-set on insert. |
| `updated_at` | `TIMESTAMP` | Audit trail. Manually set on update. |

**What to say about NUMERIC vs FLOAT:**
> "I always use NUMERIC for monetary values. FLOAT has rounding errors — `0.1 + 0.2 != 0.3` in floating point. NUMERIC stores exact decimals. In my production work on the Medicaid platform, we use NUMERIC for all financial fields — cost prices, rebate amounts, interest calculations."

**Why no separate categories table?**

For 6 categories and a live interview, a separate table with a foreign key adds a JOIN to every query and a whole migration step. Not worth it.

> "In production I'd normalize categories into their own table with a foreign key. For this scope, the category column with an index is simpler and equally performant. If the interviewer asked me to add category management, I'd create the table then."

### Indexes

```sql
-- Primary filter field — used by the category dropdown
CREATE INDEX idx_products_category ON products(category);

-- Optional: for fast text search on product name
-- Requires: CREATE EXTENSION IF NOT EXISTS pg_trgm;
-- CREATE INDEX idx_products_name_trgm ON products USING gin(name gin_trgm_ops);
```

**In practice for 10 rows:** These indexes make zero performance difference. But they show the interviewer you think about query performance.

**What to say:**
> "I'm adding an index on category since it's the primary filter field. For name search, ILIKE with a sequential scan is fine for 10 rows. In production with thousands of products, I'd add a trigram GIN index for fast partial match search."

---

## SECTION 3: asyncpg Connection & Pool Strategy

### The pool lifecycle

```python
# database.py
import os
import asyncpg
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
pool: asyncpg.Pool = None

async def init_db():
    global pool
    pool = await asyncpg.create_pool(DATABASE_URL, min_size=2, max_size=10)

async def close_db():
    global pool
    if pool:
        await pool.close()

async def get_db() -> asyncpg.Connection:
    async with pool.acquire() as conn:
        yield conn
```

### How it works

1. **App starts** → `init_db()` creates a pool with 2-10 connections
2. **Request arrives** → FastAPI calls `get_db()` via `Depends(get_db)`
3. **`pool.acquire()`** borrows a connection from the pool
4. **Route handler** uses the connection for queries
5. **Request ends** → `async with` returns the connection to the pool
6. **App shuts down** → `close_db()` closes all connections

### asyncpg query API cheat sheet

```python
# Fetch multiple rows → list of Record objects
rows = await conn.fetch("SELECT * FROM products")

# Fetch single row → one Record or None
row = await conn.fetchrow("SELECT * FROM products WHERE id = $1", product_id)

# Fetch single value → scalar
count = await conn.fetchval("SELECT count(*) FROM products")

# Execute (no return) → status string like "DELETE 1"
status = await conn.execute("DELETE FROM products WHERE id = $1", product_id)

# Convert Record to dict
dict(row)  # works because Record supports dict()
[dict(r) for r in rows]  # list of dicts
```

### Parameter syntax

```python
# asyncpg uses $1, $2, $3... (positional)
await conn.fetch("SELECT * FROM products WHERE category = $1 AND name ILIKE $2", category, f"%{search}%")

# NOT %s (psycopg2) or :name (SQLAlchemy)
# Params are passed as *args, not a dict or tuple
```

**asyncpg type handling:**

asyncpg automatically converts between Python and Postgres types:
- `NUMERIC` → Python `Decimal` (exact — good for money)
- `INTEGER` → Python `int`
- `TIMESTAMP` → Python `datetime`
- `TEXT/VARCHAR` → Python `str`

**Important:** When converting `asyncpg.Record` to dict for JSON response, `Decimal` values need to become `float` for JSON serialization. FastAPI handles this automatically via Pydantic if you use response models. With `dict(row)`, you may need to handle it manually or just let FastAPI's default JSON encoder handle it (it does handle Decimal).

---

## SECTION 4: Pydantic Models (Request/Response Schemas)

```python
# models.py
from pydantic import BaseModel, Field
from typing import Optional
from decimal import Decimal

class ProductCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    cost_price: float = Field(..., gt=0)
    selling_price: float = Field(..., gt=0)
    category: str = Field(..., min_length=1, max_length=100)
    stock_available: int = Field(default=0, ge=0)
    units_sold: int = Field(default=0, ge=0)
    customer_rating: Optional[float] = Field(default=0, ge=0, le=5)
    demand_forecast: Optional[int] = Field(default=0, ge=0)
    optimized_price: Optional[float] = Field(default=0, ge=0)

class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    cost_price: Optional[float] = Field(None, gt=0)
    selling_price: Optional[float] = Field(None, gt=0)
    category: Optional[str] = Field(None, min_length=1, max_length=100)
    stock_available: Optional[int] = Field(None, ge=0)
    units_sold: Optional[int] = Field(None, ge=0)
    customer_rating: Optional[float] = Field(None, ge=0, le=5)
    demand_forecast: Optional[int] = Field(None, ge=0)
    optimized_price: Optional[float] = Field(None, ge=0)
```

**Why `float` instead of `Decimal` in Pydantic models:**

For this interview, `float` is simpler. The JSON coming from the frontend sends numbers as floats. asyncpg will accept Python `float` for `NUMERIC` columns (it converts internally). Using `Decimal` in Pydantic requires configuring `json_encoders` and adds friction for zero benefit at this scale.

In production with real money: use `Decimal` everywhere. For a live interview: `float` is fine.

**Why separate Create and Update models:**
- `ProductCreate`: All required fields must be present (name, cost_price, selling_price, category)
- `ProductUpdate`: Everything is optional — only update what's sent
- This prevents accidentally nullifying fields on a partial update

**Validation that Pydantic gives you for free:**
- `cost_price: float = Field(..., gt=0)` → rejects 0 and negative prices
- `name: str = Field(..., min_length=1)` → rejects empty strings
- `customer_rating: float = Field(ge=0, le=5)` → rejects ratings outside 0-5
- Type coercion: string "12.99" → float 12.99 automatically

---

## SECTION 5: Complete Endpoint List

| Method | Path | Purpose | Query params | Request body | Response |
|--------|------|---------|-------------|-------------|----------|
| `GET` | `/api/products` | List all products | `?search=`, `?category=` | — | `[{product}, ...]` |
| `GET` | `/api/products/categories` | Distinct categories | — | — | `["Electronics", ...]` |
| `GET` | `/api/products/{id}` | Single product | — | — | `{product}` |
| `POST` | `/api/products` | Create product | — | `ProductCreate` | `{product}` (201) |
| `PUT` | `/api/products/{id}` | Update product | — | `ProductUpdate` | `{product}` |
| `DELETE` | `/api/products/{id}` | Delete product | — | — | `{message, id}` |
| `GET` | `/api/health` | Health check | — | — | `{status, db}` |

**Important ordering note:** In FastAPI, `/api/products/categories` must be registered BEFORE `/api/products/{product_id}`, otherwise FastAPI will try to parse "categories" as a product_id integer and return a 422 error.

---

## SECTION 6: Query Shapes — Every Query You'll Write

### 6.1 List products with search and filter

```python
query = "SELECT * FROM products WHERE 1=1"
params = []
idx = 1

if search:
    query += f" AND name ILIKE ${idx}"
    params.append(f"%{search}%")
    idx += 1
if category:
    query += f" AND category = ${idx}"
    params.append(category)
    idx += 1

query += " ORDER BY id"
rows = await conn.fetch(query, *params)
```

**Why `WHERE 1=1`:** It lets you unconditionally append `AND` clauses without worrying about whether it's the first condition. Common pattern for dynamic queries.

**Why ILIKE:** Case-insensitive search. `ILIKE` is Postgres-specific but perfect here. "wireless" matches "Wireless Earbuds".

### 6.2 Get single product

```python
row = await conn.fetchrow("SELECT * FROM products WHERE id = $1", product_id)
```

Simple. `fetchrow` returns one Record or None.

### 6.3 Create product

```python
row = await conn.fetchrow(
    """INSERT INTO products (name, description, cost_price, selling_price, category,
       stock_available, units_sold, customer_rating, demand_forecast, optimized_price)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *""",
    product.name, product.description, product.cost_price, product.selling_price,
    product.category, product.stock_available, product.units_sold,
    product.customer_rating, product.demand_forecast, product.optimized_price,
)
```

**Why `RETURNING *`:** Returns the newly created row including the auto-generated `id` and default timestamps. Avoids a second SELECT query.

### 6.4 Update product (dynamic partial update)

```python
update_data = {k: v for k, v in product.model_dump().items() if v is not None}
if not update_data:
    raise HTTPException(status_code=400, detail="No fields to update")

set_parts = []
params = []
for idx, (key, val) in enumerate(update_data.items(), start=1):
    set_parts.append(f"{key} = ${idx}")
    params.append(val)

params.append(product_id)
id_idx = len(params)

query = f"""UPDATE products SET {', '.join(set_parts)}, updated_at = CURRENT_TIMESTAMP
            WHERE id = ${id_idx} RETURNING *"""
row = await conn.fetchrow(query, *params)
```

**Why dynamic update:** If the frontend sends `{"name": "New Name"}`, we only update `name`. We don't overwrite `cost_price`, `category`, etc. with None.

**What to say:**
> "I'm building the UPDATE query dynamically from the non-null fields in the request. This way a partial update — like just changing the name — doesn't touch other columns. It's the same pattern I use in production."

### 6.5 Delete product

```python
row = await conn.fetchrow("DELETE FROM products WHERE id = $1 RETURNING id", product_id)
```

`RETURNING id` tells us if the row actually existed. If `row` is None, the product wasn't found → 404.

### 6.6 Get categories

```python
rows = await conn.fetch("SELECT DISTINCT category FROM products ORDER BY category")
return [r["category"] for r in rows]
```

Powers the category filter dropdown on the frontend. Simple.

---

## SECTION 7: Demand Forecast Endpoint Guidance

The UI mockup shows two demand-forecast related features:

### Feature 1: "With Demand Forecast" toggle on the product table

When the toggle is ON, the product table shows an additional `demand_forecast` column (called "Calculated Demand.." in the mockup).

**Backend impact:** Zero. The `demand_forecast` field is already returned by `GET /api/products`. The frontend just shows/hides the column based on a toggle state.

### Feature 2: Demand Forecast modal with chart + detail table

The mockup shows: select products via checkboxes → click "Demand Forecast" button → modal appears with a line chart and a table of selected products with their forecast values.

**Backend option A (simplest):** No new endpoint needed. The frontend already has all product data from the list endpoint. It can filter selected products client-side and pass them to Chart.js.

**Backend option B (if they ask for a dedicated endpoint):**

```python
@router.get("/forecast")
async def get_forecast_data(
    product_ids: str = Query(..., description="Comma-separated product IDs"),
    conn: asyncpg.Connection = Depends(get_db),
):
    """Get forecast data for selected products."""
    ids = [int(x) for x in product_ids.split(",")]
    rows = await conn.fetch(
        "SELECT id, name, category, selling_price, demand_forecast, units_sold, stock_available "
        "FROM products WHERE id = ANY($1) ORDER BY id",
        ids,
    )
    return [dict(r) for r in rows]
```

**What to say:**
> "The demand forecast data is part of the product record, so the frontend already has it from the list endpoint. I could add a dedicated forecast endpoint if we need a different shape or if we were fetching forecast data from an external service. For now, the frontend can filter and chart from the existing data."

**About the chart data shape:** The CSV has one `demand_forecast` integer per product — not time-series. The chart should plot `demand_forecast` vs `selling_price` per product, as discussed in Document 1. If the interviewer wants time-series, you'll need to simulate it or ask for clarification.

---

## SECTION 8: Optimized Price Handling

### The data is pre-computed

The CSV has `optimized_price` already calculated. Your job is to store it, display it, and potentially explain how it could be computed.

### Where optimized_price appears in the UI

1. **Pricing Optimization page** — a separate table showing: Product Name, Category, Description, Cost Price, Selling Price, **Optimized Price** (highlighted in green/teal)
2. This is a read-only view — no editing of optimized_price in the mockup

### Backend approach

The `GET /api/products` endpoint already returns `optimized_price`. The frontend's Pricing Optimization page can either:
- Reuse the same endpoint (filtering to show only the columns it needs)
- Or use a dedicated endpoint with a slimmer response

**Dedicated endpoint (if you want to be thorough):**

```python
@router.get("/pricing")
async def get_pricing_optimization(
    category: Optional[str] = Query(None),
    conn: asyncpg.Connection = Depends(get_db),
):
    """Get pricing optimization data."""
    query = """SELECT id, name, category, description, cost_price, selling_price, optimized_price
               FROM products WHERE 1=1"""
    params = []
    idx = 1
    if category:
        query += f" AND category = ${idx}"
        params.append(category)
        idx += 1
    query += " ORDER BY id"
    rows = await conn.fetch(query, *params)
    return [dict(r) for r in rows]
```

**What to say about the optimization logic:**
> "The optimized price is pre-computed in the dataset. If I were implementing the calculation, I'd use a demand-weighted margin formula — adjusting the price between cost and selling price based on the demand-to-stock ratio. High demand and low stock would push the price up toward selling price; low demand and high stock would push it down toward cost. The exact model would depend on business rules and could be plugged in as a separate calculation function."

### If asked to implement a calculation

```python
def calculate_optimized_price(cost: float, selling: float, demand: int, stock: int) -> float:
    """Simple demand-weighted pricing."""
    if stock + demand == 0:
        return selling  # no data, keep selling price
    demand_factor = demand / (demand + stock)
    margin = selling - cost
    return round(cost + margin * demand_factor, 2)
```

This is interview-safe. Don't claim it's a real optimization algorithm — just a sensible heuristic.

---

## SECTION 9: CSV Seed / Import Approach

### The seed script flow

1. Connect to the database
2. Delete all existing products (clean slate)
3. Read CSV row by row
4. Insert each row with explicit `id` values (matching CSV's `product_id`)
5. Reset the auto-increment sequence so new inserts get id=11+
6. Close connection

### The seed script

```python
# seed.py — full version in Document 2 Addendum
async def seed_products():
    conn = await asyncpg.connect(DATABASE_URL)
    await conn.execute("DELETE FROM products")
    
    # Read CSV, insert each row
    csv_path = os.path.join(os.path.dirname(__file__), "..", "product_data.csv")
    with open(csv_path, "r") as f:
        reader = csv.DictReader(f)
        for row in reader:
            await conn.execute(
                """INSERT INTO products (id, name, description, cost_price, selling_price,
                   category, stock_available, units_sold, customer_rating,
                   demand_forecast, optimized_price)
                   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)""",
                int(row["product_id"]), row["name"], row["description"],
                float(row["cost_price"]), float(row["selling_price"]),
                row["category"], int(row["stock_available"]),
                int(row["units_sold"]), int(row["customer_rating"]),
                int(row["demand_forecast"]), float(row["optimized_price"]),
            )
    
    await conn.execute("SELECT setval('products_id_seq', (SELECT MAX(id) FROM products))")
    await conn.close()
    print("Seeded 10 products successfully.")
```

### Why not use COPY?

Postgres `COPY FROM` is the fastest way to bulk-load CSV, but:
- asyncpg's `copy_to_table` requires the CSV to match the table schema exactly (column order, types)
- The CSV has `product_id` while the table has `id`
- For 10 rows, row-by-row insert takes milliseconds
- COPY is overkill here

**What to say if asked:**
> "For 10 rows, individual inserts are fine. If we were loading 500k rows like I do in my Medicaid pipeline, I'd use Postgres COPY or asyncpg's copy_to_table with batch processing for throughput."

---

## SECTION 10: Validation & Error Handling

### Layer 1: Pydantic validation (automatic)

FastAPI + Pydantic handles most validation automatically:
- Missing required fields → 422 with field-level errors
- Wrong types → 422 with type error detail
- Constraint violations (gt=0, min_length=1, etc.) → 422

You don't need to write any code for this. It just works.

### Layer 2: Route-level validation

```python
# Product not found
row = await conn.fetchrow("SELECT * FROM products WHERE id = $1", product_id)
if not row:
    raise HTTPException(status_code=404, detail="Product not found")

# Empty update body
update_data = {k: v for k, v in product.model_dump().items() if v is not None}
if not update_data:
    raise HTTPException(status_code=400, detail="No fields to update")
```

### Layer 3: Database-level constraints

The schema enforces:
- `NOT NULL` on name, cost_price, selling_price, category
- `PRIMARY KEY` uniqueness on id
- `DEFAULT` values for optional numeric fields

### Error handling pattern

```python
# In main.py — add a global exception handler
from fastapi import Request
from fastapi.responses import JSONResponse

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )
```

**Don't over-build error handling during the interview.** The three layers above cover 95% of cases. Add the global handler only if you have time at the end.

**What to say:**
> "Pydantic handles input validation automatically — FastAPI returns a 422 with detailed error messages. For business logic errors like 'product not found', I raise HTTPException with the appropriate status code. In production, I'd add structured error logging and more granular exception handlers."

---

## SECTION 11: The Complete Route File (Interview Reference)

Here's the full `products.py` as a single reference. This is what you're building toward during the interview. Don't try to type this from memory — use it as a mental model.

```python
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
import asyncpg
from app.database import get_db
from app.models import ProductCreate, ProductUpdate

router = APIRouter()


@router.get("")
async def get_products(
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    conn: asyncpg.Connection = Depends(get_db),
):
    query = "SELECT * FROM products WHERE 1=1"
    params = []
    idx = 1
    if search:
        query += f" AND name ILIKE ${idx}"
        params.append(f"%{search}%")
        idx += 1
    if category:
        query += f" AND category = ${idx}"
        params.append(category)
        idx += 1
    query += " ORDER BY id"
    rows = await conn.fetch(query, *params)
    return [dict(r) for r in rows]


@router.get("/categories")
async def get_categories(conn: asyncpg.Connection = Depends(get_db)):
    rows = await conn.fetch(
        "SELECT DISTINCT category FROM products ORDER BY category"
    )
    return [r["category"] for r in rows]


@router.get("/{product_id}")
async def get_product(
    product_id: int, conn: asyncpg.Connection = Depends(get_db)
):
    row = await conn.fetchrow(
        "SELECT * FROM products WHERE id = $1", product_id
    )
    if not row:
        raise HTTPException(status_code=404, detail="Product not found")
    return dict(row)


@router.post("", status_code=201)
async def create_product(
    product: ProductCreate, conn: asyncpg.Connection = Depends(get_db)
):
    row = await conn.fetchrow(
        """INSERT INTO products
           (name, description, cost_price, selling_price, category,
            stock_available, units_sold, customer_rating,
            demand_forecast, optimized_price)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
           RETURNING *""",
        product.name,
        product.description,
        product.cost_price,
        product.selling_price,
        product.category,
        product.stock_available,
        product.units_sold,
        product.customer_rating,
        product.demand_forecast,
        product.optimized_price,
    )
    return dict(row)


@router.put("/{product_id}")
async def update_product(
    product_id: int,
    product: ProductUpdate,
    conn: asyncpg.Connection = Depends(get_db),
):
    update_data = {k: v for k, v in product.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    set_parts = []
    params = []
    for idx, (key, val) in enumerate(update_data.items(), start=1):
        set_parts.append(f"{key} = ${idx}")
        params.append(val)
    params.append(product_id)
    id_idx = len(params)

    row = await conn.fetchrow(
        f"""UPDATE products
            SET {', '.join(set_parts)}, updated_at = CURRENT_TIMESTAMP
            WHERE id = ${id_idx} RETURNING *""",
        *params,
    )
    if not row:
        raise HTTPException(status_code=404, detail="Product not found")
    return dict(row)


@router.delete("/{product_id}")
async def delete_product(
    product_id: int, conn: asyncpg.Connection = Depends(get_db)
):
    row = await conn.fetchrow(
        "DELETE FROM products WHERE id = $1 RETURNING id", product_id
    )
    if not row:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted", "id": product_id}
```

---

## SECTION 12: Exact Implementation Order During Live Coding

This is the step-by-step build sequence for the backend portion of the interview. Each step should take 2-5 minutes.

### Assuming pre-setup is done (DB connected, table exists, data seeded)

**Step 1 (2 min): Verify setup works**
- Start uvicorn
- Hit `/api/health` in browser
- Show the interviewer: "Backend is running, DB is connected, we have 10 products seeded."

**Step 2 (3 min): GET /api/products — list endpoint**
- Write the route handler
- Test in browser: `http://localhost:8000/api/products`
- Show JSON response with 10 products
- Say: "Products are flowing from Postgres through asyncpg to the API."

**Step 3 (2 min): GET /api/products/categories**
- Write the route
- Test: shows 6 distinct categories
- Say: "This powers the category filter dropdown on the frontend."

**Step 4 (2 min): GET /api/products/{id}**
- Write the route with 404 handling
- Test with id=1 (works) and id=999 (404)
- Say: "Single product lookup with proper 404 handling."

**Step 5 (3 min): POST /api/products — create**
- Write the route with Pydantic validation
- Test via Swagger UI (`/docs`) — create a test product
- Show: it returns the new product with auto-generated id
- Say: "Pydantic validates the input automatically. RETURNING * gives us the created record without a second query."

**Step 6 (4 min): PUT /api/products/{id} — update**
- Write the dynamic update route
- Test via Swagger UI — update just the name of product 1
- Verify other fields didn't change
- Say: "This is a partial update — only the fields you send get updated. I build the SET clause dynamically from non-null fields."

**Step 7 (2 min): DELETE /api/products/{id}**
- Write the route with 404 handling
- Test: delete the test product you created
- Say: "Delete with RETURNING to confirm the row existed."

**Step 8 (3 min): Add search and category filter to GET /api/products**
- Add `search` and `category` query params
- Build the dynamic WHERE clause
- Test: `?search=wireless` → Wireless Earbuds
- Test: `?category=Electronics` → 3 products
- Test: `?search=smart&category=Wearables` → Smartwatch and Fitness Tracker
- Say: "Dynamic filtering with parameterized queries. ILIKE for case-insensitive search."

**Step 9 (1 min): Open Swagger UI, show all endpoints**
- Navigate to `http://localhost:8000/docs`
- Say: "FastAPI auto-generates this API documentation from our route definitions and Pydantic models. Every endpoint is testable from here."

**Total backend time: ~22 minutes**

This leaves 40-50+ minutes for frontend, chart, and polish.

---

## SECTION 13: What to Say While Building Backend

### When starting

> "I'm going to build the backend endpoints first so we have a working API before touching the frontend. I'll start with the list endpoint, then CRUD, then search and filter."

### When writing the list endpoint

> "This is a simple SELECT with dynamic filtering. I'm using asyncpg with parameterized queries — the $1, $2 placeholders prevent SQL injection. The WHERE 1=1 pattern lets me cleanly append AND clauses."

### When writing create

> "Pydantic validates the request body automatically — I don't need manual type checking. RETURNING * gives us the created row back including the auto-generated ID, so I don't need a second query."

### When writing update

> "I'm building the SET clause dynamically from only the non-null fields. This means a partial update — sending just {name: 'new name'} — only changes the name, not other fields. I also bump updated_at on every update."

### When writing delete

> "Delete with RETURNING id so I can tell if the product actually existed. If it didn't, 404."

### When showing search/filter

> "Search uses ILIKE for case-insensitive partial matching. Category is an exact match. Both are optional and composable — you can search and filter at the same time."

### When showing Swagger UI

> "One of the benefits of FastAPI — we get interactive API docs for free. You can test every endpoint directly from here. In production, this also serves as documentation for frontend developers."

---

## SECTION 14: Mistakes to Avoid

### SQL mistakes

1. **Don't use f-strings to build SQL values.** Always use `$N` parameters.
   ```python
   # WRONG (SQL injection)
   await conn.fetch(f"SELECT * FROM products WHERE name = '{search}'")
   
   # RIGHT
   await conn.fetch("SELECT * FROM products WHERE name = $1", search)
   ```

2. **Don't forget `RETURNING *` on INSERT/UPDATE.** Without it, you get nothing back and need a second query.

3. **Don't use `%s` placeholders with asyncpg.** That's psycopg2 syntax. asyncpg uses `$1, $2, $3`.

4. **Don't forget to reset the sequence after seeding with explicit IDs.** Otherwise the next auto-insert fails with a duplicate key error.

### FastAPI mistakes

5. **Don't put `/categories` after `/{product_id}`.** FastAPI will try to parse "categories" as an integer and return 422. Static paths must come before parameterized paths.

6. **Don't use `def` instead of `async def` with asyncpg.** asyncpg is async-only. Using `def` will block the event loop or error out.

7. **Don't forget `Depends(get_db)` on every route that touches the database.** Missing it means no database connection.

### Architecture mistakes

8. **Don't add a service layer during the interview.** It's extra files and indirection for zero benefit at this scale.

9. **Don't add SQLAlchemy models.** You'd need to define the same fields twice (SQLAlchemy model + Pydantic schema). Raw SQL is cleaner here.

10. **Don't add pagination unless asked.** For 10 products, it's unnecessary complexity. If asked, add `LIMIT $N OFFSET $M` — takes 2 minutes.

### Communication mistakes

11. **Don't go silent while writing SQL.** Narrate: "I'm parameterizing this to prevent injection."

12. **Don't say "this is trivial."** Just build it cleanly and let the quality speak.

13. **Don't skip testing each endpoint.** A 30-second Swagger UI test after each endpoint builds confidence and catches bugs early.

---

## SECTION 15: If the Interviewer Asks...

### "Why not use an ORM?"

> "For one table and six endpoints, raw SQL is more transparent. The interviewer can read the queries directly, there's no magic happening behind an ORM. In production with complex relationships, I'd use SQLAlchemy — that's what I use at my current company with asyncpg as the driver."

### "Why asyncpg instead of psycopg2?"

> "asyncpg is a native async driver for Postgres — it doesn't wrap a sync driver. I use it in production with FastAPI. It's faster for async workloads and returns native Python types. Since FastAPI is async-first, asyncpg is the natural fit."

### "How would you add pagination?"

> "Add `page` and `page_size` query parameters. Compute OFFSET as `(page - 1) * page_size`. Add `LIMIT $N OFFSET $M` to the query. Also run a `COUNT(*)` query to return total count so the frontend can render page controls. I'd wrap the response in `{data: [...], total: N, page: 1, page_size: 20}`."

### "How would you add sorting?"

> "Add `sort_by` and `sort_order` query parameters. Validate `sort_by` against a whitelist of allowed column names — never pass user input directly into ORDER BY. Then append `ORDER BY {validated_column} {ASC|DESC}` to the query."

### "How would you add auth?"

> "I'd add a `users` table with hashed passwords, a `/api/auth/login` endpoint that verifies credentials and returns a JWT, and a `get_current_user` FastAPI dependency that decodes the JWT and makes the user available to route handlers. For RBAC, add a `role` field to the user model and check it in a `require_role` dependency. I've built this exact pattern in production — at CAPSAI, our middleware decodes the JWT, sets tenant context, and checks permissions per module and action."

### "What about database transactions?"

> "For single-row CRUD operations, each query is auto-committed. If I needed a multi-step operation — like updating a product and logging the change atomically — I'd use asyncpg's transaction context manager: `async with conn.transaction():`. That ensures both operations succeed or both roll back."

```python
async with conn.transaction():
    await conn.execute("UPDATE products SET name = $1 WHERE id = $2", name, id)
    await conn.execute("INSERT INTO audit_log (product_id, action) VALUES ($1, $2)", id, "UPDATE")
```

---

## SECTION 16: Top Things to Memorize

1. **asyncpg parameter syntax is `$1, $2, $3` — not `%s`**
2. **`conn.fetch()` for multiple rows, `conn.fetchrow()` for one, `conn.fetchval()` for scalar**
3. **`RETURNING *` on INSERT/UPDATE to get the row back**
4. **Static routes before parameterized routes** (`/categories` before `/{product_id}`)
5. **`WHERE 1=1` for clean dynamic query building**
6. **ILIKE for case-insensitive search**
7. **`dict(row)` to convert asyncpg Record to JSON-serializable dict**
8. **`model_dump()` on Pydantic v2 (not `dict()` which was v1)**
9. **Every route handler is `async def`**
10. **Pool lifecycle: create in lifespan startup, close in shutdown**

---

## SECTION 17: Weak Areas to Patch

| Area | Status | What to do |
|------|--------|------------|
| asyncpg `$N` parameter counting in dynamic queries | Easy to miscount during live coding | Practice the update query 3 times |
| Decimal serialization from asyncpg | Can cause `TypeError` in JSON response | `dict(row)` usually works. If not, cast to `float` manually. FastAPI handles Decimal in most cases. |
| Dynamic WHERE clause building | Straightforward but error-prone under pressure | Memorize the `idx` counter pattern |
| Chart data endpoint shape | Ambiguous — chart is frontend-heavy | Know the fallback: "frontend has all data from list endpoint" |

---

## SECTION 18: How This Document Connects to Your Resume

| Interview task | Your production experience |
|----------------|--------------------------|
| asyncpg connection pool | You use `asyncpg` with pool_size=10, max_overflow=5 at CAPSAI |
| Parameterized queries | You enforce parameterized queries for SQL safety in your AST validator |
| Pydantic validation | All your FastAPI APIs use Pydantic models for request/response |
| Dynamic query building | Your product list/search endpoints at CAPSAI use the same pattern |
| RETURNING * | Standard pattern in your repository layer |
| CSV data loading | You built the Celery pipeline for 500k+ row CSV uploads |
| Error handling with HTTPException | Same pattern across all your CAPSAI endpoints |
| FastAPI dependency injection | Your middleware uses `Depends()` for tenant_id, db session, auth |

Don't force these references during the interview. But if asked "have you built something like this before?", the answer is: "Yes — my production system at CAPSAI handles the same patterns at much larger scale with multi-tenant isolation, audit logging, and background job processing on top."

---

READY FOR DOCUMENT 4. SAY: GO AHEAD