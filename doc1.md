# DOCUMENT 1: Case Study Understanding & Interview Strategy

## BCG X Round 2 — Price Optimization Tool Live Coding Assessment

**Prepared for:** Harshit Srivastava
**Interview type:** Live coding assessment (Round 2)
**Stack:** FastAPI + PostgreSQL + React (Vite) + Chart.js

---

## What this document helps you do

This document gives you a complete mental model of the Price Optimization Tool case study so you can walk into the live coding interview with clarity. It covers: what they actually want, what to build first, what to skip, what to say while building, what questions to ask, how you'll be evaluated, and how to handle scope extensions under time pressure. Read this first, internalize it, then move to the setup and implementation documents.

---

## How to use this document in prep

1. Read it once fully — understand the shape of the problem
2. Re-read the "Feature Decomposition" and "Build Order" sections until you can recite them
3. Practice the "What to say" phrases out loud — not memorized scripts, just the key framings
4. Before the interview, skim the "Evaluation Criteria" and "Likely Change Requests" sections
5. Keep the "Clarifying Questions" section in mind for the first 3-5 minutes of the interview

---

## SECTION 1: What They Actually Want

### The Business Context

A global enterprise wants a web tool to help business users manage products and get pricing recommendations. The key value prop is: input product data → see demand forecasts → get optimized prices. This is a **CRUD app with a data visualization layer and a simple optimization calculation**.

Don't overthink it. This is not a machine learning problem. The demand_forecast and optimized_price are **pre-computed fields in the CSV data**. You are building a data management + visualization tool, not a forecasting engine.

### The Real Requirements (from the assessment document)

**Part A — Product Management:**
- Create, view, update, delete products
- Search by product name
- Filter by category

**Part B — Demand Forecast & Pricing Optimization:**
- Show demand forecasts for products
- Visualize forecasted demand vs selling price on a linear plot
- Display optimized prices in tabular format with product details

**Technical Requirements (from the doc):**
- Auth & RBAC (mentioned but deprioritize — see below)
- Python backend (FastAPI)
- React frontend with responsive UI
- Data visualization (Chart.js / D3.js)
- Relational DB (PostgreSQL)
- Modular, well-structured code
- README.md

### The Product Data (10 rows in provided CSV)

```
Fields: product_id, name, description, cost_price, selling_price, 
        category, stock_available, units_sold, customer_rating, 
        demand_forecast, optimized_price
```

Categories in data: `Outdoor & Sports`, `Electronics`, `Apparel`, `Home Automation`, `Transportation`, `Wearables`

Key insight: `demand_forecast` and `optimized_price` are pre-existing fields. The CSV already has them calculated. Your job is to **display** them, not compute them from scratch. However, you should have a simple calculation formula ready in case the interviewer asks "how would you actually compute optimized_price?"

---

## SECTION 2: What the UI Mockup Reveals

I analyzed all 6 sections of the UI PDF. Here's what the mockup actually shows:

### Screen 1: Landing / Home Page
- Dark theme with BCG X branding
- Two card buttons: "Create and Manage Product" and "Pricing Optimization"
- Simple navigation — two main flows

### Screen 2: Product Management Table
- Top bar: "Create and Manage Product" title, "With Demand Forecast" toggle, Search input, Category dropdown, Filter button, "Add New Products" button, "Demand Forecast" button
- Table columns: Checkbox, Product Name, Product Category, Cost Price, Selling Price, Description, Available Stock, Units Sold, Action (view/edit/delete icons)
- Cancel / Save buttons at bottom

### Screen 3: Add New Product Modal
- Modal overlay on the table page
- Fields: Product Name, Product Category, Cost Price, Selling Price, Description, Available Stock, Units Sold
- Cancel / Add buttons
- Note: NO demand_forecast or optimized_price fields in the add form — these are computed/display-only

### Screen 4: Demand Forecast View
- Selecting products (checkboxes) and clicking "Demand Forecast" opens a modal/overlay
- Contains a **line chart** with:
  - Y-axis: years (2020-2024)
  - X-axis: Products (Product 1, 2, 3, 4)
  - Two lines: "Product Demand" (purple) and "Selling Price" (cyan/teal)
  - Legend at bottom
- Below the chart: a table showing selected products with columns including "Calculated Demand Forecast" (highlighted in teal)

### Screen 5: Product Table with Demand Forecast Toggle ON
- When "With Demand Forecast" toggle is on, the table gains a "Calculated Demand.." column
- Values shown in teal for computed forecasts, "-" for products without forecast
- This is the same product table but with the extra column visible

### Screen 6: Pricing Optimization Page
- Separate page (not the product management page)
- Top bar: "Pricing Optimization" title, same toggle/search/filter controls
- Table columns: Product Name, Product Category, Description, Cost Price, Selling Price, **Optimized Price** (in teal/green)
- Simpler table — display-only, no edit/delete actions

---

## SECTION 3: Feature Decomposition — Must-Have / Nice-to-Have / Skip

### MUST-HAVE (build these in the interview)

| # | Feature | Why it's must-have |
|---|---------|-------------------|
| 1 | Product table with all fields | Core CRUD display — first thing they'll evaluate |
| 2 | Create product (modal/form) | CRUD requirement — shows form handling |
| 3 | Edit product | CRUD requirement |
| 4 | Delete product | CRUD requirement — simplest to implement |
| 5 | Search by product name | Explicitly required — simple ILIKE query |
| 6 | Filter by category | Explicitly required — dropdown + query param |
| 7 | Demand forecast chart | Part B requirement — the "wow" visual |
| 8 | Pricing optimization table | Part B requirement — separate view with optimized_price |
| 9 | Seed data from CSV | Need data to show — pre-load the 10 products |
| 10 | Basic responsive layout | Listed in requirements — use a CSS framework or simple flex |

### NICE-TO-HAVE (if time permits, in this order)

| # | Feature | Why it's nice-to-have |
|---|---------|----------------------|
| 1 | "With Demand Forecast" toggle | Shows in mockup, adds polish |
| 2 | Product selection (checkboxes) for chart | Mockup shows selecting products to chart |
| 3 | View product detail | Mockup has an eye icon |
| 4 | Loading/error states | Shows production mindset |
| 5 | Basic input validation (frontend) | Shows attention to quality |
| 6 | Pagination | Only 10 rows in data but shows you're thinking ahead |

### SKIP (do not build unless specifically asked)

| # | Feature | Why skip |
|---|---------|---------|
| 1 | Auth/RBAC | Mentioned in requirements but HR-level ask — eats 30+ min for login/register/JWT flow with zero visual payoff. Mention it, don't build it. |
| 2 | Email verification | Listed but absurd for a live interview |
| 3 | Dynamic role assignment | Listed but way out of scope |
| 4 | D3.js | Chart.js is 10x faster to implement for this use case |
| 5 | Complex optimization algorithm | The data has optimized_price pre-computed. If asked, use a simple formula. |
| 6 | Fancy state management (Redux) | useState + useEffect is enough |
| 7 | Docker for everything | Docker Compose for Postgres only. Run FastAPI and React locally. |

---

## SECTION 4: Hidden Requirements & What They're Really Testing

### What the document says vs. what they actually evaluate

| Document says | What they really want to see |
|---------------|------------------------------|
| "Auth & RBAC" | That you acknowledge it, explain how you'd add it, but prioritize working features |
| "Scalability and security" | Clean code structure, not microservices. Maybe parameterized queries. |
| "Normalization and indexing" | A sensible schema with at least one index on category and maybe name |
| "Modular code" | Separation: routes/models/services on backend, components on frontend |
| "README" | 10-line README with setup instructions. Write this LAST. |
| "Responsive UI" | Works on different widths. Basic flex/grid. Not pixel-perfect. |
| "Data visualization" | A working chart. Not a beautiful chart. Chart.js line chart. |

### The real evaluation criteria (inferred from BCG X interview patterns)

1. **Can you build a working full-stack app under pressure?** — This is 60% of the evaluation
2. **Code quality and structure** — Are files organized? Are functions small? Is there separation of concerns?
3. **Design decisions and tradeoffs** — Can you explain WHY you chose something?
4. **Communication** — Do you narrate while coding? Do you explain your approach?
5. **Handling extensions** — When they ask "now add X", can you adapt without panic?
6. **Completeness** — Did you cover both Part A (CRUD) and Part B (forecast + optimization)?

### What separates "pass" from "strong pass"

- Pass: CRUD works, one of the visualizations works, code is readable
- Strong pass: CRUD works, search/filter works, chart works, optimization table works, you explained tradeoffs throughout, and you handled at least one change request cleanly

---

## SECTION 5: Clarifying Questions to Ask (First 3-5 Minutes)

Ask 3-4 of these. It shows structured thinking and prevents wasted work.

**Must-ask:**

1. "The requirements mention auth and RBAC. Given the time constraint, should I focus on the product management and visualization features first, and architect auth as something that could be added later? Or is a working login flow expected?"
   - *Expected answer: focus on features first*
   - *This saves you 30+ minutes*

2. "For the demand forecast and optimized price — should I treat these as pre-computed values that come from the data, or do you want me to implement the actual calculation logic?"
   - *Expected answer: pre-computed is fine, maybe explain how you'd calculate it*
   - *This clarifies the hardest ambiguity in the problem*

3. "For the chart — the mockup shows products on the X-axis and what looks like year-based data on the Y-axis. But our dataset has one demand_forecast value per product, not time-series data. Should I plot demand_forecast vs selling_price per product as a comparison chart? Or do you want me to simulate time-series?"
   - *This shows you actually read the data carefully*

**Good-to-ask if natural:**

4. "Should I pre-seed the database with the provided CSV data, or start with an empty database and show the create flow?"
   - *Almost certainly: seed it so you have data to show*

5. "For the category filter — should it work as a dropdown that filters the table, or as a more complex multi-select?"
   - *Keeps scope clear*

---

## SECTION 6: The Optimized Price Logic — What to Know

The CSV data has `optimized_price` pre-computed. But you need a story for how it's calculated.

### Simple formula (interview-safe)

```
optimized_price = cost_price + (selling_price - cost_price) × demand_factor

where demand_factor = demand_forecast / (demand_forecast + stock_available)
```

This is a **demand-weighted margin** approach:
- High demand + low stock → price closer to selling_price (keep margin)
- Low demand + high stock → price closer to cost_price (discount to move inventory)

### Verify against CSV data

Product 1 (Water Bottle): cost=5.0, selling=12.99, demand=250, stock=500
- factor = 250 / (250+500) = 0.333
- optimized = 5.0 + (12.99-5.0) × 0.333 = 5.0 + 2.66 = 7.66
- CSV says 11.5 — so the actual formula is different

This tells us: **the CSV data uses a different formula**. For the interview, just load the pre-computed value. If asked about the logic, say:

> "For the interview, I'm loading the pre-computed optimized price from the dataset. If I were implementing this for real, I'd use a demand-weighted margin formula — something like adjusting the price between cost and selling price based on the ratio of demand to available stock. The exact model would depend on business rules and could be swapped out as the optimization logic evolves."

This is honest and shows business thinking without faking math.

---

## SECTION 7: Build Order (The Vertical Slice Plan)

This is the most important section. Memorize this sequence.

### Phase 0: Pre-interview Setup (done before interview day)
- [ ] PostgreSQL running locally (or via Docker Compose)
- [ ] FastAPI project skeleton with health check endpoint
- [ ] React + Vite project skeleton with a "Hello World" page
- [ ] Frontend can call backend (CORS configured)
- [ ] Database connected, empty `products` table exists
- [ ] Seed script ready (loads CSV into DB)
- [ ] Both apps start with one command each

### Phase 1: Core Backend (first 15-20 min of interview)
1. Create `products` table with all fields (run CREATE TABLE)
2. Seed data from CSV
3. `GET /api/products` — list all products
4. `POST /api/products` — create product
5. `PUT /api/products/{id}` — update product
6. `DELETE /api/products/{id}` — delete product
7. `GET /api/products?search=X&category=Y` — search + filter

### Phase 2: Core Frontend (next 20-25 min)
1. Product table displaying all products
2. Add Product form/modal
3. Edit product flow
4. Delete product (confirm + delete)
5. Search input wired to API
6. Category dropdown filter wired to API

### Phase 3: Visualization (next 15-20 min)
1. Demand Forecast chart (Chart.js line chart)
2. Pricing Optimization table (separate view/page)

### Phase 4: Polish (remaining time)
1. Error handling / loading states
2. Basic responsive tweaks
3. README.md
4. Clean up console logs / dead code

### What to say at the start

> "I'm going to take a vertical-slice approach. I'll get the backend endpoints working first, verify them with the browser or curl, then wire up the frontend table, then the form, then search and filter, and finally the chart and optimization view. This way we have something working at every stage."

---

## SECTION 8: What to Say During the Interview

### Opening (after clarifying questions)

> "Great, so my plan is: I already have the basic FastAPI and React setup running with Postgres connected. I'll start by seeding the product data, building the CRUD endpoints, then the frontend table, then search and filter, and then the demand forecast chart and pricing optimization table. I'll keep the code modular so it's easy to extend."

### While building backend

> "I'm setting up the Pydantic models for request validation — FastAPI gives us automatic validation and docs from these."

> "I'm using parameterized queries here to prevent SQL injection — this is a habit from working with multi-tenant enterprise systems."

> "I'm adding the category index now — it's the main filter field, so it should be indexed."

### While building frontend

> "I'm keeping state simple with useState — for 10 products and a few UI states, we don't need a state management library."

> "I'm wiring the search as a controlled input with a debounced API call — this avoids hammering the backend on every keystroke."

### While building chart

> "I'm using Chart.js for this — it's the simplest library for a clean line chart and it works well with React."

### If running behind on time

> "I'm going to prioritize getting the chart working over polishing the UI — the visualization is a key requirement."

### If asked about auth

> "I'd add JWT-based auth with a login endpoint that returns a token, then a FastAPI dependency that validates the token and injects user context. For RBAC, I'd add a role field to the user model and check permissions in route dependencies. I've built this exact pattern in production — at CAPSAI, our middleware decodes the JWT, sets tenant context, and checks permissions per module and action. I'm skipping it here to focus on the core features, but the architecture supports it cleanly."

---

## SECTION 9: Likely Change Requests (Prepare for These)

The checklist says: *"you may be asked to implement features either based on the provided case study or on new use cases outside of it."*

### High-probability change requests

| # | Request | How to handle | Time estimate |
|---|---------|---------------|---------------|
| 1 | "Add pagination to the product table" | Add `LIMIT/OFFSET` to query, pass `page` and `page_size` params, return total count | 5-8 min |
| 2 | "Add sorting to the table" | Add `sort_by` and `sort_order` query params, `ORDER BY` in SQL | 5 min |
| 3 | "Show a different chart type" | Chart.js supports bar/pie/scatter with minimal config change | 5 min |
| 4 | "Add product validation (price > 0, name required)" | Pydantic validators on backend, form validation on frontend | 5-8 min |
| 5 | "Add a new field to the product" | ALTER TABLE, update Pydantic model, update frontend form + table | 8-10 min |
| 6 | "Implement basic auth" | JWT login endpoint, auth dependency, protect routes | 15-20 min |
| 7 | "Add bulk delete" | `DELETE /api/products/bulk` with list of IDs, checkboxes on frontend | 8-10 min |
| 8 | "Export products to CSV" | Stream query results as CSV response with Content-Disposition header | 8-10 min |
| 9 | "Add a dashboard with summary stats" | New endpoint returning aggregates (count, avg price per category) | 10-12 min |
| 10 | "Make the optimized price editable" | PUT endpoint to update just optimized_price, inline edit on frontend | 8-10 min |

### How to respond to ANY change request

1. **Repeat it back**: "So you'd like me to add [X]. Let me think about the impact."
2. **State the approach**: "On the backend, I'd add [query change]. On the frontend, I'd [component change]. Shouldn't take more than [X] minutes."
3. **Start with the backend**: Always get the API working first, then wire the frontend.
4. **Talk while building**: Narrate what you're doing.

---

## SECTION 10: Mistakes to Avoid

### Technical mistakes
- **Don't start with auth.** It's a time sink with no visual payoff. Mention it, skip it.
- **Don't use D3.js.** Chart.js is 5x faster to implement for this use case.
- **Don't use Redux/Zustand.** useState is enough for this scope.
- **Don't write a complex optimization algorithm.** Load the pre-computed value.
- **Don't over-normalize the schema.** One table is fine. Maybe a categories table if you have time.
- **Don't forget to seed data.** An empty table is useless for the demo.
- **Don't use raw string concatenation for SQL.** Always use parameterized queries.

### Communication mistakes
- **Don't go silent for more than 60 seconds.** Even if you're thinking, say "I'm thinking about how to structure this."
- **Don't say "this is easy."** Just do it cleanly.
- **Don't apologize for choosing simple solutions.** Say "I'm choosing Chart.js over D3 because it gives us a clean chart with much less code, and for this use case, the trade-off is clearly worth it."
- **Don't say "I would do X in production."** Instead say "For this interview, I'm doing X. In production, I'd extend this by adding Y."
- **Don't pretend you know something you don't.** If asked about a specific optimization algorithm, say "I'd need to research the specific model, but the architecture supports plugging in any calculation function."

### Time management mistakes
- **Don't spend more than 5 min on setup/seeding during the interview.** This should be pre-done.
- **Don't polish CSS before features work.** Features > aesthetics.
- **Don't write tests during the live interview unless asked.** Mention that you'd add them.
- **Don't build both pages perfectly before showing either.** Get one flow working end-to-end first.

---

## SECTION 11: The Chart — What You're Actually Plotting

The mockup is confusing. It shows years (2020-2024) on the Y-axis and products on the X-axis, with two lines for "Product Demand" and "Selling Price". But the data has **one demand_forecast value per product, not time-series data**.

### Practical approach

**Option A (recommended — matches data):**
Plot a grouped bar chart or dual-axis line chart where:
- X-axis = product names
- Y-axis (left) = demand_forecast
- Y-axis (right) or second dataset = selling_price
- This lets you compare demand vs price across products

**Option B (if they insist on time-series):**
Simulate time-series by generating synthetic data points around the demand_forecast value with slight variation per year. Say: "The dataset has a single forecast value per product. I can generate a projected trend, or we can use the actual values in a comparison chart."

**What to say:**
> "The data gives us one demand forecast value per product, so I'm plotting demand vs selling price across products. If we had time-series data — like monthly forecasts — I'd plot those as lines over time. The chart component supports both; it's just a data shape change."

### Chart.js Implementation Shape

```javascript
// Dual dataset line chart
{
  labels: products.map(p => p.name),
  datasets: [
    {
      label: 'Demand Forecast',
      data: products.map(p => p.demand_forecast),
      borderColor: '#8b5cf6',  // purple
    },
    {
      label: 'Selling Price',
      data: products.map(p => p.selling_price),
      borderColor: '#2dd4bf',  // teal
    }
  ]
}
```

---

## SECTION 12: How This Connects to Your Resume

This live coding task maps directly to things you've shipped. Use these connections naturally:

| Interview task | Your real experience |
|----------------|---------------------|
| FastAPI CRUD endpoints | You built the entire Medicaid module's REST API layer |
| PostgreSQL schema + indexing | You optimized queries for 500k+ row tables with targeted indexes |
| Pydantic models for validation | You use Pydantic models for all request/response validation at CAPSAI |
| Search/filter queries | You built search and filter for the GP viewer in production |
| Chart.js visualization | Frontend integration at CAPSAI (not your core, but you've done it) |
| React table + form | You shipped MUI DataGrid, forms, and filter components |
| Seed data pipeline | You built the Celery CSV upload pipeline — this is a simpler version |
| Code modularity | Service/repository pattern in your FastAPI codebase |

**Don't force these references.** Only mention them if the interviewer asks "have you done something like this before?" or if explaining a design choice.

---

## SECTION 13: Step-by-Step Execution Mindset

### Before the interview (day before)
1. Run through the full setup from scratch one more time
2. Verify: FastAPI starts, Postgres connects, React loads, API calls work
3. Have the seed script ready and tested
4. Have the CSV file accessible
5. Have Chart.js installed in the React project
6. Close all unnecessary apps, restart laptop
7. Open: VS Code, terminal, browser with localhost ready

### First 5 minutes of interview
1. Greet, listen to instructions
2. Ask 2-3 clarifying questions (Section 5)
3. State your plan (Section 8 opening)
4. Confirm setup works by showing health check endpoint

### Minutes 5-25: Backend CRUD
1. Create table + seed data (should be fast if pre-prepared)
2. Build endpoints one by one
3. Test each with browser/curl before moving on
4. Show the interviewer: "Here's the products list endpoint working"

### Minutes 25-50: Frontend table + forms
1. Fetch products, display in table
2. Add product form
3. Wire edit/delete
4. Add search and filter

### Minutes 50-70: Chart + Optimization
1. Install/import Chart.js
2. Build demand forecast chart
3. Build pricing optimization table view

### Minutes 70-80: Polish + README
1. Quick responsive check
2. Error states if time
3. Write 10-line README

### If you finish early
- Add the "With Demand Forecast" toggle
- Add pagination
- Add form validation
- Add loading spinners

---

## What to do next

After internalizing this document:
1. Move to Document 2 (Setup Guide) — get your local environment bulletproof
2. Move to Document 3 (Backend Implementation) — know every endpoint and query
3. Move to Document 4 (Frontend Implementation) — know every component and API call
4. Move to Document 5 (Future Enhancements) — prepare for scope extensions
5. Do one full dry run: build the entire thing from scratch in ~80 minutes

---

READY FOR DOCUMENT 2. SAY: GO AHEAD