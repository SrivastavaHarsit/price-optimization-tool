# DOCUMENT 5: Future Enhancements & Extension Handling

## BCG X Round 2 — Price Optimization Tool

**Stack:** FastAPI + asyncpg + PostgreSQL + React + Vite + Chart.js
**Prepared for:** Harshit Srivastava

---

## What this document helps you do

The BCG pre-test checklist says: *"you may be asked to implement features either based on the provided case study or on new use cases outside of it."* This document prepares you for every likely extension request. For each one, you'll know what they're testing, how to think about it, how to implement it minimally, and what to say while doing it. The goal is zero panic when the interviewer says "now can you add X?"

---

## How to use this document

1. Read all 15 enhancements once to build familiarity
2. Memorize the top 10 list at the end (most likely requests)
3. For each, know the ONE backend change and ONE frontend change
4. Practice saying the "how I'd approach it" sentence aloud
5. Don't pre-build any of these — just know the plan

---

## The Universal Response Pattern

When the interviewer asks for any change, follow this 4-step protocol:

```
1. REPEAT IT BACK: "So you'd like me to add [X]."
2. STATE THE PLAN: "On the backend I'd [change]. On the frontend I'd [change]. Should take about [N] minutes."
3. START WITH BACKEND: Get the API working first. Test it with Swagger or curl.
4. WIRE THE FRONTEND: Hook the new API into the UI.
```

Say step 2 aloud BEFORE you start coding. It shows structured thinking and lets the interviewer redirect if you've misunderstood.

---

## Enhancement 1: Add Pagination

### What they are testing
Can you handle large datasets without loading everything? Do you know LIMIT/OFFSET?

### How to think
This is a backend query change + frontend page controls. Don't overthink it.

### Minimum viable implementation

**Backend:** Add `page` and `page_size` query params. Return total count alongside data.

```python
@router.get("")
async def get_products(
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    conn: asyncpg.Connection = Depends(get_db),
):
    offset = (page - 1) * page_size

    # Count query (same WHERE clause, no LIMIT)
    count_query = "SELECT count(*) FROM products WHERE 1=1"
    data_query = "SELECT * FROM products WHERE 1=1"
    params = []
    idx = 1

    if search:
        clause = f" AND name ILIKE ${idx}"
        count_query += clause
        data_query += clause
        params.append(f"%{search}%")
        idx += 1
    if category:
        clause = f" AND category = ${idx}"
        count_query += clause
        data_query += clause
        params.append(category)
        idx += 1

    total = await conn.fetchval(count_query, *params)

    data_query += f" ORDER BY id LIMIT ${idx} OFFSET ${idx+1}"
    params.extend([page_size, offset])

    rows = await conn.fetch(data_query, *params)
    return {"data": [dict(r) for r in rows], "total": total, "page": page, "page_size": page_size}
```

**Frontend:** Add page state, prev/next buttons, update fetch to pass page param.

**Database:** No schema change. LIMIT/OFFSET on existing index.

### What to say
> "I'll add LIMIT/OFFSET pagination on the backend and return the total count so the frontend can show page controls. For 10 products this is cosmetic, but it's the correct pattern for production."

### What not to overbuild
Don't implement cursor/keyset pagination. Don't add page size selector. LIMIT/OFFSET with prev/next buttons is enough.

---

## Enhancement 2: Add Sorting

### What they are testing
Can you handle ORDER BY from user input safely?

### Minimum viable implementation

**Backend:** Add `sort_by` and `sort_order` query params. **Whitelist the column names.**

```python
ALLOWED_SORT_COLUMNS = {"name", "category", "cost_price", "selling_price", "stock_available", "units_sold", "customer_rating"}

@router.get("")
async def get_products(
    # ... existing params ...
    sort_by: Optional[str] = Query(None),
    sort_order: Optional[str] = Query("asc"),
    conn: asyncpg.Connection = Depends(get_db),
):
    # ... existing WHERE logic ...

    if sort_by and sort_by in ALLOWED_SORT_COLUMNS:
        direction = "DESC" if sort_order == "desc" else "ASC"
        query += f" ORDER BY {sort_by} {direction}"
    else:
        query += " ORDER BY id"
    # ...
```

**Frontend:** Add clickable column headers that toggle sort direction.

**Database:** No change. Existing B-tree indexes help for category. Other columns scan the full 10 rows (fine).

### What to say
> "I'm whitelisting the allowed sort columns to prevent SQL injection — you should never pass raw user input into ORDER BY. The frontend sends the column name and direction, and the backend validates it against a known set."

### What not to overbuild
Don't add multi-column sorting. Single column sort is enough.

---

## Enhancement 3: Add a New Field to the Product

### What they are testing
Can you modify schema, API, and UI in one coherent change?

### Minimum viable implementation

Example: "Add a `discount_percentage` field."

**Database:**
```sql
ALTER TABLE products ADD COLUMN discount_percentage NUMERIC(5,2) DEFAULT 0;
```

**Backend:** Add field to Pydantic models + update INSERT/UPDATE queries.

```python
# In ProductCreate:
discount_percentage: Optional[float] = Field(default=0, ge=0, le=100)
```

The SELECT * queries already return all columns, so the list/detail endpoints work immediately.

**Frontend:** Add one `<td>` in the table and one `<input>` in the form.

### What to say
> "ALTER TABLE ADD COLUMN is instant in Postgres — no table rewrite. I'll add the field to the Pydantic models and the form. The list endpoint already uses SELECT *, so it picks up the new column automatically."

### What not to overbuild
Don't add migration tooling. A single ALTER TABLE is fine for a live interview.

---

## Enhancement 4: Add Input Validation (Frontend)

### What they are testing
Do you validate on both sides? Do you handle bad input gracefully?

### Minimum viable implementation

**Backend:** Already handled — Pydantic rejects invalid input with 422.

**Frontend:** Add basic checks before submitting.

```jsx
const handleSubmit = async () => {
  if (!formData.name.trim()) { alert('Product name is required'); return; }
  if (parseFloat(formData.cost_price) <= 0) { alert('Cost price must be positive'); return; }
  if (parseFloat(formData.selling_price) <= 0) { alert('Selling price must be positive'); return; }
  if (!formData.category.trim()) { alert('Category is required'); return; }
  // ... proceed with API call
};
```

**Database:** NOT NULL constraints already enforce at the DB level.

### What to say
> "Validation happens at three layers: frontend for immediate user feedback, Pydantic on the backend for type and constraint checking, and database constraints as the final safety net. I'll add frontend checks now for a better user experience."

### What not to overbuild
Don't install a form library (Formik, React Hook Form). Simple if-checks before submit are enough.

---

## Enhancement 5: Add Bulk Delete

### What they are testing
Can you handle multi-select operations? Do you know how to delete multiple rows efficiently?

### Minimum viable implementation

**Backend:**

```python
@router.post("/bulk-delete")
async def bulk_delete_products(
    ids: list[int],
    conn: asyncpg.Connection = Depends(get_db),
):
    if not ids:
        raise HTTPException(400, "No IDs provided")
    deleted = await conn.execute(
        "DELETE FROM products WHERE id = ANY($1)", ids
    )
    return {"message": f"Deleted {deleted.split()[-1]} products"}
```

**Frontend:** Add checkboxes to table rows. Track selected IDs in state. Add "Delete Selected" button.

```jsx
const [selectedIds, setSelectedIds] = useState(new Set());

const toggleSelect = (id) => {
  setSelectedIds(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
};
```

**Database:** `ANY($1)` works with an integer array. No schema change.

### What to say
> "I'm using Postgres's ANY operator with an array of IDs for the bulk delete — one query instead of N queries. On the frontend, I track selected rows with a Set in state."

### What not to overbuild
Don't add select-all. Don't add undo. Simple multi-select with delete is enough.

---

## Enhancement 6: Export Products to CSV

### What they are testing
Can you generate file downloads from an API?

### Minimum viable implementation

**Backend:**

```python
from fastapi.responses import StreamingResponse
import csv
import io

@router.get("/export")
async def export_products(conn: asyncpg.Connection = Depends(get_db)):
    rows = await conn.fetch("SELECT * FROM products ORDER BY id")
    
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=dict(rows[0]).keys())
    writer.writeheader()
    for row in rows:
        writer.writerow(dict(row))
    
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=products.csv"},
    )
```

**Frontend:** A button that triggers a download.

```jsx
<button onClick={() => window.open('/api/products/export')}>
  📥 Export CSV
</button>
```

**Database:** No change.

### What to say
> "I'm streaming the CSV response with a Content-Disposition header so the browser triggers a download. For 10 rows, it's instant. For larger datasets, I'd use a generator to stream rows without loading everything into memory — that's the pattern I use in production for 500k+ row exports."

### What not to overbuild
Don't implement chunked streaming for 10 rows. Don't add format selection (CSV vs Excel).

---

## Enhancement 7: Add a Dashboard with Summary Statistics

### What they are testing
Can you write aggregate queries and display summary data?

### Minimum viable implementation

**Backend:**

```python
@router.get("/stats")
async def get_product_stats(conn: asyncpg.Connection = Depends(get_db)):
    row = await conn.fetchrow("""
        SELECT
            count(*) as total_products,
            count(DISTINCT category) as total_categories,
            round(avg(selling_price)::numeric, 2) as avg_selling_price,
            round(avg(optimized_price)::numeric, 2) as avg_optimized_price,
            sum(stock_available) as total_stock,
            sum(units_sold) as total_units_sold
        FROM products
    """)
    return dict(row)
```

**Frontend:** A row of stat cards above the table.

```jsx
const [stats, setStats] = useState(null);
useEffect(() => { api.getStats().then(setStats); }, []);

{stats && (
  <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
    <StatCard label="Products" value={stats.total_products} />
    <StatCard label="Categories" value={stats.total_categories} />
    <StatCard label="Avg Price" value={`$${stats.avg_selling_price}`} />
    <StatCard label="Total Stock" value={stats.total_stock} />
  </div>
)}
```

**Database:** No change. Pure aggregate query.

### What to say
> "One aggregate query gives us all the summary numbers. I'll display them as stat cards above the product table. The query is cheap — it scans the whole table once, and for 10 rows that's essentially free."

### What not to overbuild
Don't add charts to the dashboard. Don't add per-category breakdowns unless asked.

---

## Enhancement 8: Implement Basic Auth (Login)

### What they are testing
Do you understand JWT auth flow? Can you protect routes?

### Minimum viable implementation

**Database:**
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user'
);
INSERT INTO users (email, password_hash, role)
VALUES ('admin@bcgx.com', 'hashed_password_here', 'admin');
```

**Backend:** Two new endpoints + a dependency.

```python
import hashlib, secrets, time, json, base64

# Simplified JWT (interview-safe — NOT production-grade)
SECRET = "interview-secret-key"

def create_token(user_id: int, email: str, role: str) -> str:
    payload = {"user_id": user_id, "email": email, "role": role, "exp": time.time() + 3600}
    # In production: use python-jose or PyJWT. For interview: base64 encode.
    return base64.b64encode(json.dumps(payload).encode()).decode()

def verify_token(token: str) -> dict:
    payload = json.loads(base64.b64decode(token))
    if payload["exp"] < time.time():
        raise HTTPException(401, "Token expired")
    return payload

async def get_current_user(request: Request):
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    if not token:
        raise HTTPException(401, "Not authenticated")
    return verify_token(token)

@auth_router.post("/login")
async def login(email: str, password: str, conn = Depends(get_db)):
    row = await conn.fetchrow("SELECT * FROM users WHERE email = $1", email)
    if not row or row["password_hash"] != hash_password(password):
        raise HTTPException(401, "Invalid credentials")
    token = create_token(row["id"], row["email"], row["role"])
    return {"token": token}
```

**Frontend:** Login form that stores token, adds it to API headers.

**What to say:**
> "I'd add a users table, a login endpoint that returns a JWT, and a FastAPI dependency that validates the token on protected routes. I've built this exact pattern in production — at CAPSAI, our RBAC middleware decodes the JWT, extracts tenant context, and checks per-module permissions. For the interview, I'll keep the auth simplified."

### What not to overbuild
Don't add registration. Don't add email verification. Don't add refresh tokens. One hardcoded user + login + token check is enough.

---

## Enhancement 9: Make Optimized Price Editable

### What they are testing
Can you add inline editing to a read-only field?

### Minimum viable implementation

**Backend:** The existing PUT endpoint already supports partial updates. If the frontend sends `{ optimized_price: 42.50 }`, it updates only that field. No backend change needed.

**Frontend:** Add an inline edit input in the Pricing Optimization table.

```jsx
const [editingId, setEditingId] = useState(null);
const [editValue, setEditValue] = useState('');

const handleSave = async (id) => {
  await api.updateProduct(id, { optimized_price: parseFloat(editValue) });
  setEditingId(null);
  fetchProducts(); // refresh
};

// In the table row:
<td>
  {editingId === p.id ? (
    <>
      <input value={editValue} onChange={e => setEditValue(e.target.value)} style={{ width: '80px' }} />
      <button onClick={() => handleSave(p.id)}>✓</button>
      <button onClick={() => setEditingId(null)}>✕</button>
    </>
  ) : (
    <span onClick={() => { setEditingId(p.id); setEditValue(p.optimized_price); }}
          style={{ cursor: 'pointer', color: '#2dd4bf' }}>
      ${p.optimized_price}
    </span>
  )}
</td>
```

**Database:** No change. `optimized_price` is already a writable column.

### What to say
> "The backend already supports partial updates — the PUT endpoint only updates non-null fields. So I just need frontend inline editing. Click the price → input appears → type new value → save → PUT with just the optimized_price field."

### What not to overbuild
Don't add validation modals. Don't add undo. Click, type, save.

---

## Enhancement 10: Add a Different Chart Type

### What they are testing
Can you adapt the visualization quickly?

### Minimum viable implementation

Chart.js supports bar, pie, scatter, radar with minimal config changes.

**Bar chart — change one word:**
```jsx
import { Bar } from 'react-chartjs-2';
// ... same data/options ...
return <Bar data={chartData} options={options} />;
```

Also register `BarElement`:
```jsx
import { BarElement } from 'chart.js';
ChartJS.register(/* existing */, BarElement);
```

**Pie chart for category distribution:**
```jsx
import { Pie } from 'react-chartjs-2';
import { ArcElement } from 'chart.js';
ChartJS.register(ArcElement);

// Group products by category and count
const categoryCounts = {};
products.forEach(p => { categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1; });

const pieData = {
  labels: Object.keys(categoryCounts),
  datasets: [{ data: Object.values(categoryCounts), backgroundColor: ['#8b5cf6','#2dd4bf','#f59e0b','#ef4444','#3b82f6','#10b981'] }],
};
```

**Backend/Database:** No change.

### What to say
> "Chart.js makes this easy — switching from a line to a bar chart is a one-word change in the import. For a pie chart showing category distribution, I aggregate on the frontend since we already have the data."

### What not to overbuild
Don't add chart type selection UI. Just swap the chart type and move on.

---

## Enhancement 11: Add a Price Comparison View

### What they are testing
Can you build a meaningful data view beyond CRUD?

### Minimum viable implementation

Show a table or chart comparing `cost_price`, `selling_price`, and `optimized_price` for each product with the margin and savings calculated.

**Backend:**

```python
@router.get("/comparison")
async def get_price_comparison(conn: asyncpg.Connection = Depends(get_db)):
    rows = await conn.fetch("""
        SELECT id, name, category, cost_price, selling_price, optimized_price,
               round((selling_price - cost_price)::numeric, 2) as current_margin,
               round((optimized_price - cost_price)::numeric, 2) as optimized_margin,
               round((selling_price - optimized_price)::numeric, 2) as price_difference
        FROM products ORDER BY id
    """)
    return [dict(r) for r in rows]
```

**Frontend:** Render a table with the computed columns. Highlight rows where `optimized_price < selling_price` (discount recommended) vs `optimized_price > selling_price` (opportunity to raise price).

**Database:** No schema change. Computed columns in the query.

### What to say
> "I'm computing the margins in SQL rather than in Python — keeps the application code cleaner and lets the database do what it's good at. The frontend highlights the price differences to give a quick visual comparison."

---

## Enhancement 12: Add Product Image Upload

### What they are testing
Can you handle file uploads? Do you know multipart form data?

### Minimum viable implementation

**Database:**
```sql
ALTER TABLE products ADD COLUMN image_url VARCHAR(500);
```

**Backend:**

```python
import shutil
from fastapi import UploadFile, File

UPLOAD_DIR = "static/images"

@router.post("/{product_id}/image")
async def upload_product_image(
    product_id: int,
    file: UploadFile = File(...),
    conn: asyncpg.Connection = Depends(get_db),
):
    # Save to local filesystem
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    filename = f"{product_id}_{file.filename}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    with open(filepath, "wb") as f:
        shutil.copyfileobj(file.file, f)

    image_url = f"/static/images/{filename}"
    await conn.execute(
        "UPDATE products SET image_url = $1 WHERE id = $2", image_url, product_id
    )
    return {"image_url": image_url}
```

Mount static files in main.py:
```python
from fastapi.staticfiles import StaticFiles
app.mount("/static", StaticFiles(directory="static"), name="static")
```

**Frontend:** Add a file input to the form. Use `FormData` for the upload:
```jsx
const handleImageUpload = async (productId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  await axios.post(`/api/products/${productId}/image`, formData);
};
```

### What to say
> "I'll store images on the local filesystem and serve them via FastAPI's static file mounting. In production, I'd use cloud storage like Azure Blob — which is what I use at my current company for large file uploads. For the interview, local storage is cleaner."

### What not to overbuild
Don't add image resizing. Don't add cloud storage. Don't add drag-and-drop. Simple file input → save to disk → store URL.

---

## Enhancement 13: Add a "Recalculate Optimized Price" Button

### What they are testing
Can you implement server-side computation triggered from the UI?

### Minimum viable implementation

**Backend:**

```python
@router.post("/recalculate")
async def recalculate_prices(conn: asyncpg.Connection = Depends(get_db)):
    """Recalculate optimized prices for all products."""
    rows = await conn.fetch("SELECT id, cost_price, selling_price, demand_forecast, stock_available FROM products")
    
    updated = 0
    for row in rows:
        demand = row["demand_forecast"]
        stock = row["stock_available"]
        cost = float(row["cost_price"])
        selling = float(row["selling_price"])
        
        if demand + stock > 0:
            factor = demand / (demand + stock)
        else:
            factor = 0.5
        
        optimized = round(cost + (selling - cost) * factor, 2)
        await conn.execute("UPDATE products SET optimized_price = $1 WHERE id = $2", optimized, row["id"])
        updated += 1
    
    return {"message": f"Recalculated {updated} products"}
```

**Frontend:** One button that calls the endpoint and refreshes the list.

```jsx
const handleRecalculate = async () => {
  await axios.post('/api/products/recalculate');
  fetchProducts(); // refresh
};

<button onClick={handleRecalculate}>🔄 Recalculate Prices</button>
```

**Database:** Updates `optimized_price` in place.

### What to say
> "The recalculate endpoint applies a demand-weighted margin formula to all products and updates the optimized_price column. In production, this calculation would likely come from a more sophisticated model — maybe an ML pipeline or business rules engine. The architecture supports swapping the formula without changing the API contract."

---

## Enhancement 14: Add Product Categories Management

### What they are testing
Can you add a related entity? Do you understand normalization?

### Minimum viable implementation

**Database:**
```sql
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT
);

-- Populate from existing data
INSERT INTO categories (name) SELECT DISTINCT category FROM products;

-- Optionally add FK (but this changes the products table):
-- ALTER TABLE products ADD COLUMN category_id INTEGER REFERENCES categories(id);
-- UPDATE products SET category_id = c.id FROM categories c WHERE products.category = c.name;
```

**Backend:** New CRUD router for categories. For the interview, just add GET and POST.

```python
@category_router.get("")
async def list_categories(conn = Depends(get_db)):
    rows = await conn.fetch("SELECT * FROM categories ORDER BY name")
    return [dict(r) for r in rows]

@category_router.post("", status_code=201)
async def create_category(name: str, conn = Depends(get_db)):
    row = await conn.fetchrow("INSERT INTO categories (name) VALUES ($1) RETURNING *", name)
    return dict(row)
```

**Frontend:** Update the category dropdown to use the categories endpoint (already done). Optionally add a category management section.

### What to say
> "I'd normalize categories into their own table. For the interview, I'll keep the existing varchar column working — the category dropdown already fetches distinct values. If this were production, I'd add a foreign key and a migration to link existing products."

### What not to overbuild
Don't add the FK migration. Don't rewrite existing queries. Just add the table and basic CRUD.

---

## Enhancement 15: Add Real-Time Price Updates (WebSocket)

### What they are testing
Do you know WebSockets? Can you implement push updates?

### Minimum viable implementation

This is an advanced request. Only attempt if you've finished everything else.

**Backend:**

```python
from fastapi import WebSocket

connected_clients: list[WebSocket] = []

@app.websocket("/ws/prices")
async def price_updates(websocket: WebSocket):
    await websocket.accept()
    connected_clients.append(websocket)
    try:
        while True:
            await websocket.receive_text()  # Keep connection alive
    except:
        connected_clients.remove(websocket)

async def broadcast_update(product: dict):
    for ws in connected_clients:
        try:
            await ws.send_json({"type": "product_updated", "data": product})
        except:
            connected_clients.remove(ws)
```

Call `broadcast_update` after create/update/delete operations.

**Frontend:**
```jsx
useEffect(() => {
  const ws = new WebSocket('ws://localhost:8000/ws/prices');
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.type === 'product_updated') fetchProducts();
  };
  return () => ws.close();
}, []);
```

### What to say
> "I'd add a WebSocket endpoint that broadcasts product changes to connected clients. I've built this pattern in production — at CAPSAI, we use WebSockets for real-time AI chat streaming, and at MechPhy, we used them for live soldier tracking dashboards. For this interview, I'll keep it simple: broadcast on any product change, frontend refetches on message."

### What not to overbuild
Don't add rooms/channels. Don't add authentication on the WebSocket. Don't add optimistic updates. Broadcast + refetch is enough.

---

# FINAL SECTION: Priority Rankings & Strategy

## Top 10 Most Likely Extension Requests (in order)

| Rank | Enhancement | Probability | Time | Difficulty |
|------|-------------|-------------|------|------------|
| 1 | Pagination | Very high | 5-8 min | Easy |
| 2 | Sorting | Very high | 5 min | Easy |
| 3 | Input validation (frontend) | High | 5 min | Easy |
| 4 | New field on product | High | 5-8 min | Easy |
| 5 | Different chart type | High | 3-5 min | Easy |
| 6 | Dashboard / summary stats | Medium-high | 8-10 min | Easy |
| 7 | Export to CSV | Medium | 5-8 min | Easy |
| 8 | Bulk delete | Medium | 8-10 min | Medium |
| 9 | Basic auth (login) | Medium | 15-20 min | Medium |
| 10 | Editable optimized price | Medium | 8-10 min | Medium |

---

## Fastest Wins vs Risky/Time-Consuming Changes

### Fastest wins (under 5 min, high impression)

| Enhancement | Why it's fast | What to say |
|-------------|---------------|-------------|
| Sorting | One ORDER BY clause + whitelist | "Done — just added validated ORDER BY with a column whitelist" |
| Different chart type | Change one import | "Chart.js makes switching chart types trivial" |
| Frontend validation | 5 if-checks before submit | "Three-layer validation: frontend, Pydantic, database" |
| New field | ALTER TABLE + 2 lines of Pydantic | "ALTER TABLE ADD COLUMN is instant in Postgres" |

### Medium effort, good payoff (5-10 min)

| Enhancement | Notes |
|-------------|-------|
| Pagination | Backend is straightforward, frontend needs page buttons |
| Dashboard stats | One aggregate query + stat cards |
| CSV export | StreamingResponse + csv module |
| Bulk delete | ANY($1) in SQL + checkbox state on frontend |

### Risky / time-consuming (avoid unless specifically asked)

| Enhancement | Why it's risky | Fallback |
|-------------|---------------|----------|
| Auth/login | 15-20 min minimum, touches everything, zero visual payoff | Describe the architecture verbally: "users table, login endpoint, JWT dependency, route protection" |
| WebSocket real-time | Complex setup, connection management, easy to break | Say: "I'd add a WebSocket broadcast — I've built this in production" and describe the pattern |
| Image upload | File handling edge cases, static mounting, multipart form | Describe: "UploadFile in FastAPI, save to disk or cloud storage, store URL in DB" |
| Category normalization with FK | Migration risk, existing queries break | Keep the varchar column, add categories table alongside |

---

## Fallback Simplifications If Time Is Short

If the interviewer asks for something and you're running low on time, use these fallback strategies:

### Strategy 1: Describe, don't build
> "I'd add pagination with LIMIT/OFFSET on the backend, return a total count, and add page controls on the frontend. The query change is straightforward — want me to implement it, or should I focus on [other feature] first?"

This lets the interviewer decide where your time goes.

### Strategy 2: Backend only, skip frontend
Build the API endpoint, test it in Swagger. Say: "The API is working — I'd wire the frontend if we have time." This shows the backend works and the interviewer can see the response.

### Strategy 3: Hardcode the tricky part
If asked for auth, hardcode a token check instead of building full JWT:
```python
async def get_current_user(request: Request):
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    if token != "interview-token":
        raise HTTPException(401, "Unauthorized")
    return {"user_id": 1, "role": "admin"}
```
Say: "I'm using a hardcoded token for now. In production, this would decode a JWT and validate against the users table."

### Strategy 4: UI placeholder
If asked for a chart type you're not sure about:
```jsx
<div style={{ padding: '40px', textAlign: 'center', border: '1px dashed #ccc' }}>
  <p>📊 {chartType} chart would render here</p>
  <p>Data: {products.length} products</p>
</div>
```
Then describe what it would look like while you wire the actual Chart.js config.

---

## The Meta-Strategy: How to Handle ANY Unknown Request

```
1. Don't panic. Repeat the request back.
2. Think: what's the SMALLEST change on backend, frontend, and database?
3. Say your plan BEFORE coding.
4. Start with the backend — get the API right.
5. Wire the frontend minimally.
6. If stuck, describe the approach and ask: "Want me to implement this fully or move to [next thing]?"
```

The interviewer is testing your ability to adapt under pressure, not your ability to build a perfect feature. A clear plan + partial implementation beats panicked full implementation every time.

---

*You're prepared for anything they can throw at you. Build the base app calmly, handle extensions methodically, and talk while you code.*

DOCUMENTS COMPLETE.