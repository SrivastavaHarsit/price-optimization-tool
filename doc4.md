# DOCUMENT 4: Frontend & Integration Guide (For a Backend Engineer)

## BCG X Round 2 — Price Optimization Tool

**Stack:** React 18 + Vite + Chart.js + axios
**Prepared for:** Harshit Srivastava (backend-heavy, React beginner)

---

## What this document helps you do

This is a frontend crash course disguised as an interview prep guide. It teaches you enough React to build the Price Optimization Tool's UI during a live coding interview — and to explain what you're doing while you build it. It does NOT try to make you a frontend expert. It makes you dangerous enough to ship a working full-stack app in 40 minutes.

---

## How to use this document in prep

1. Read Part 1 (React Mental Model) fully — even if some of it feels basic. It connects React concepts to backend concepts you already know.
2. Read Part 2 (App Flow) and trace the data path mentally. This is the most important section.
3. Read Part 3 (Folder Structure) to know where every file goes.
4. Read Part 4 (Implementation Order) and rehearse the sequence out loud.
5. Read Part 5 (Code) section by section. Don't try to memorize code. Understand the patterns.
6. Skim Part 6 (React Q&A) for interview questions.
7. Read Part 7 (Backend Engineer Mistakes) to avoid the traps.

---

# PART 1: React Mental Model for Backend Engineers

## What is React?

React is a JavaScript library for building user interfaces. Think of it as a **template engine that re-renders automatically when data changes**.

**Backend analogy:** In FastAPI, you have Jinja2 templates that generate HTML from data. React is like Jinja2 — except it runs in the browser, and when the data changes, it automatically re-generates only the parts of the HTML that need to change. You never manually touch the DOM (the HTML tree). You just update the data, and React figures out what to re-render.

## What is a component?

A component is a **function that returns HTML** (technically JSX, which looks like HTML). That's it.

```jsx
function Greeting() {
  return <h1>Hello, world</h1>;
}
```

**Backend analogy:** A component is like a FastAPI route handler that returns a response — except instead of returning JSON, it returns a piece of UI. And instead of being called once per request, React calls it every time the data changes.

**Key insight:** Components are just functions. They take inputs, they return output (UI). Everything else in React is about controlling *when* these functions re-run and *what data* they have access to.

## What are props?

Props are **arguments passed to a component**. They're read-only — the component can use them but can't change them.

```jsx
function ProductRow({ name, price }) {
  return <tr><td>{name}</td><td>${price}</td></tr>;
}

// Usage:
<ProductRow name="Wireless Earbuds" price={59.99} />
```

**Backend analogy:** Props are like function parameters. When you write `def get_product(product_id: int)`, `product_id` is like a prop. The function receives it, uses it, but doesn't modify it.

## What is state?

State is **data that lives inside a component and can change over time**. When state changes, React re-renders the component.

```jsx
function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>Clicked {count} times</button>;
}
```

**Backend analogy:** State is like a mutable variable inside a request handler that, when modified, automatically causes the response to be re-generated. Imagine if changing a Python variable inside your FastAPI handler automatically re-sent the response to the client — that's what React state does for the UI.

## What does useState do?

`useState` creates a piece of state and gives you two things:
1. The current value (`count`)
2. A function to update it (`setCount`)

```jsx
const [products, setProducts] = useState([]);
//      ↑ current value    ↑ updater function    ↑ initial value
```

**The rule:** Never modify state directly. Always use the setter function.

```jsx
// WRONG: products.push(newProduct)
// RIGHT: setProducts([...products, newProduct])
```

**Backend analogy:** Think of `useState` like declaring a reactive variable. In Python, if you change a variable, nothing happens automatically. In React, calling `setProducts(newData)` triggers a re-render — the component function runs again with the new data, and the UI updates.

## What does useEffect do?

`useEffect` runs **side effects** — things that happen outside of rendering, like fetching data from an API, setting up timers, or reading from localStorage.

```jsx
useEffect(() => {
  // This code runs AFTER the component appears on screen
  api.getProducts().then(data => setProducts(data));
}, []);
//  ↑ dependency array: [] means "run once when the component first mounts"
```

**Backend analogy:** `useEffect` is like a startup hook. Think of FastAPI's `lifespan` context manager — code that runs when the app starts up. `useEffect(() => {...}, [])` runs once when the component "starts up" (mounts to the screen).

**The dependency array controls when it re-runs:**
- `[]` — run once on mount (like `@app.on_event("startup")`)
- `[searchTerm]` — run again whenever `searchTerm` changes
- No array at all — run after every single render (usually wrong, avoid this)

## What is a controlled input?

A controlled input is a form field whose value comes from React state, and whose changes update that state.

```jsx
const [search, setSearch] = useState('');

<input
  value={search}                          // Display what's in state
  onChange={(e) => setSearch(e.target.value)}  // Update state on every keystroke
/>
```

**Backend analogy:** Think of it like a Pydantic model that's always in sync with a form. The `value` is the current model state. The `onChange` is like a validator that runs on every keystroke and updates the model. The form field always reflects the model, and the model always reflects the form field. They're never out of sync.

**Why this matters:** Without `value={search}`, the input field manages its own state and you can't control it from React. With it, you're in charge. This is how you wire search inputs to API calls.

## What is a re-render?

A re-render is when React **calls your component function again** because state changed. The function runs, returns new JSX, and React updates only the parts of the screen that are different.

```
User clicks button → setCount(count + 1) → React re-runs Counter() → new JSX → screen updates
```

**Backend analogy:** Imagine if every time you updated a database row, FastAPI automatically re-ran the relevant GET endpoint and pushed the new response to the client. That's what re-render does — the "response" (UI) is always up to date with the "database" (state).

**What triggers a re-render:**
1. Calling a state setter (`setProducts(...)`)
2. Parent component re-rendering (your component re-runs too)
3. Context value changing (advanced — not needed here)

**What does NOT trigger a re-render:**
- Changing a regular `let` variable (React doesn't watch normal variables)
- Mutating state directly (`products.push(x)` — React doesn't detect this)

## The core loop: Event → State → Re-render → UI

This is the single most important mental model:

```
1. User types "wireless" in search box
2. onChange fires → setSearch("wireless")
3. React re-renders the component (calls the function again)
4. Inside the function, search is now "wireless"
5. useEffect sees search changed → fetches /api/products?search=wireless
6. API returns filtered products
7. setProducts(filteredData)
8. React re-renders again
9. Table now shows only Wireless Earbuds
```

Every interaction in React follows this loop. Once you understand it, you understand React well enough to build this app.

## The API fetch → State → UI loop

```
1. Component mounts (appears on screen)
2. useEffect runs (dependency array is [])
3. Inside useEffect: call api.getProducts()
4. This sends GET /api/products to your FastAPI backend
5. Backend queries Postgres, returns JSON array
6. .then(data => setProducts(data))  ← updates state
7. React re-renders the component
8. products.map(p => <tr>...) renders one table row per product
9. User sees 10 products in the table
```

**This is the EXACT same pattern for every data-fetching component.** The only things that change are: which API endpoint, which state variable, and which JSX renders the data.

---

# PART 2: The Complete Data Flow of This App

Here's the full picture — from browser load to every user interaction. Read this like a sequence diagram.

## Flow 1: Page loads, products appear

```
Browser navigates to http://localhost:5173
  → Vite serves index.html + JavaScript bundle
  → React mounts App component
  → App renders ProductPage component
  → ProductPage has: useState([]) for products, useState('') for search
  → useEffect runs (empty dependency array = on mount)
  → Inside useEffect: api.getProducts() fires
  → axios sends GET http://localhost:5173/api/products
  → Vite proxy forwards to http://localhost:8000/api/products
  → FastAPI route handler runs
  → asyncpg queries: SELECT * FROM products ORDER BY id
  → Returns JSON array of 10 products
  → axios receives response
  → .then(data => setProducts(data))
  → React re-renders ProductPage
  → products.map(p => <ProductRow ...>) renders 10 rows
  → User sees a table with 10 products
```

## Flow 2: User searches for "wireless"

```
User types "w" in search input
  → onChange fires → setSearch("w")
  → React re-renders (search is now "w")
  → useEffect has [search] in dependency array
  → But we debounce — don't fetch yet
  
User finishes typing "wireless"
  → After 300ms of no typing, debounce fires
  → api.getProducts({ search: "wireless" })
  → GET /api/products?search=wireless
  → FastAPI: SELECT * FROM products WHERE name ILIKE '%wireless%'
  → Returns 1 product (Wireless Earbuds)
  → setProducts([...one product...])
  → Table re-renders with 1 row
```

## Flow 3: User selects category filter

```
User picks "Electronics" from dropdown
  → onChange fires → setCategory("Electronics")
  → useEffect has [category] in dependency array → fires
  → api.getProducts({ category: "Electronics" })
  → GET /api/products?category=Electronics
  → Returns 3 products
  → setProducts([...three products...])
  → Table shows 3 rows
```

## Flow 4: User creates a product

```
User clicks "Add New Product" button
  → setShowForm(true)
  → React re-renders → form modal appears (conditional rendering)

User fills out form fields
  → Each input has its own state or a single formData state object
  → onChange handlers update state on every keystroke

User clicks "Add" / "Submit"
  → handleSubmit function fires
  → api.createProduct(formData)
  → POST /api/products with JSON body
  → FastAPI validates with Pydantic, inserts into DB
  → Returns newly created product with id
  → setShowForm(false) → modal closes
  → Re-fetch products: api.getProducts() → setProducts(updatedList)
  → Table now shows 11 products
```

## Flow 5: User deletes a product

```
User clicks delete icon on a row
  → (Optional) confirm("Are you sure?")
  → api.deleteProduct(productId)
  → DELETE /api/products/5
  → FastAPI deletes from DB
  → Re-fetch products → setProducts(updatedList)
  → Table now shows one fewer row
```

## Flow 6: User views demand forecast chart

```
User clicks "Demand Forecast" button
  → setShowChart(true)
  → Chart component mounts
  → Chart receives products from parent (as props)
  → Chart.js renders a Line chart:
      labels = product names
      dataset 1 = demand_forecast values (purple line)
      dataset 2 = selling_price values (teal line)
  → User sees the chart in a modal/overlay
```

---

# PART 3: Frontend Folder Structure

```
frontend/src/
├── main.jsx            ← Entry point. Mounts App into the HTML page.
├── App.jsx             ← Root component. Handles page routing/switching.
├── App.css             ← Global styles (minimal)
├── api/
│   └── client.js       ← All API calls in one place. axios wrapper.
├── pages/
│   ├── ProductPage.jsx ← Product management page (table, search, form)
│   └── PricingPage.jsx ← Pricing optimization page (read-only table)
└── components/
    ├── ProductTable.jsx ← The product data table
    ├── ProductForm.jsx  ← Add/edit product modal form
    ├── SearchBar.jsx    ← Search input + category dropdown
    └── DemandChart.jsx  ← Chart.js demand forecast chart
```

### What each file does

**`main.jsx`** — The boot file. Like Python's `if __name__ == "__main__"`. Mounts your React app into the HTML page. You write this once and never touch it again.

**`App.jsx`** — The shell. Decides which page to show. Contains the top-level navigation (home with two cards, or a specific page). Think of it like your FastAPI `main.py` that registers routers.

**`api/client.js`** — Already created in Doc 2. All API calls live here. Every component calls functions from this file instead of using axios directly. Like your FastAPI `database.py` — one place for all external communication.

**`pages/ProductPage.jsx`** — The main page for Part A (product management). Contains the state for products, search, category filter, and form visibility. Renders the table, search bar, and form components. Like a FastAPI router file that orchestrates multiple dependencies.

**`pages/PricingPage.jsx`** — The read-only page for Part B (pricing optimization). Simpler — just fetches products and displays them in a table with optimized_price highlighted.

**`components/ProductTable.jsx`** — A reusable table component. Receives products as props. Renders rows. Has action buttons (edit/delete). Doesn't manage its own data — it receives data from the page.

**`components/ProductForm.jsx`** — The add/edit form. Modal dialog with input fields. Calls the API on submit. Tells the parent page to refresh the product list.

**`components/SearchBar.jsx`** — Search input and category dropdown. Fires callbacks to the parent page when values change.

**`components/DemandChart.jsx`** — Chart.js line chart. Receives product data as props, renders the chart. No state management needed — it's purely display.

---

# PART 4: Implementation Order (Live Coding)

This is the exact sequence for the frontend portion of the interview. Each step has what you're proving, what to build, how to verify, and what to say.

---

## Step 1: Prove the frontend boots (1 min)

**What you're proving:** React app loads in the browser.

**What to do:** Start the dev server if not already running.

```bash
cd frontend && npm run dev
```

Open `http://localhost:5173`. You should see the basic app from Doc 2.

**What to say:** "Frontend is running. Let me start building the product management page."

---

## Step 2: Prove API connectivity (2 min)

**What you're proving:** Frontend can talk to backend.

**What to do:** The App.jsx from Doc 2 already fetches and shows products. If it's showing 10 products, this step is done.

**What to say:** "Data is flowing from Postgres through FastAPI through to the React frontend. Now I'll structure this into proper components."

---

## Step 3: Build the product table (8-10 min)

**What you're proving:** You can display data in a table with proper columns.

**What to build:**
1. Create `pages/ProductPage.jsx` — owns the state and data fetching
2. Create `components/ProductTable.jsx` — receives products as props, renders rows
3. Update `App.jsx` to render ProductPage

**What to verify:** All 10 products appear in a clean table with the columns from the mockup.

**What to say:** "I'm separating the page from the table component. The page owns the data and fetching logic. The table just receives products as props and renders them. This keeps the table reusable."

---

## Step 4: Add search and category filter (8-10 min)

**What you're proving:** You can wire user input to API calls.

**What to build:**
1. Add search state to ProductPage
2. Add category state and fetch categories from API
3. Create `components/SearchBar.jsx` with input and dropdown
4. Re-fetch products when search or category changes

**What to verify:** Type "wireless" → only Wireless Earbuds shows. Select "Electronics" → 3 products show.

**What to say:** "The search and filter states live in the page component. When they change, I re-fetch from the API with the new parameters. The backend handles the actual filtering with ILIKE and WHERE clauses."

---

## Step 5: Add create product form (8-10 min)

**What you're proving:** You can handle form submission and POST to the API.

**What to build:**
1. Create `components/ProductForm.jsx` — modal form with controlled inputs
2. Add "Add New Product" button to the page
3. POST to backend on submit, refresh the product list

**What to verify:** Click "Add New Product" → fill form → submit → new product appears in table.

**What to say:** "The form uses controlled inputs — each field's value comes from state, and onChange updates that state. On submit, I POST the form data to the backend. After success, I close the form and refresh the product list."

---

## Step 6: Add edit and delete (5-8 min)

**What you're proving:** You can handle row-level actions.

**What to build:**
1. Add edit/delete buttons to each table row
2. Delete: call API, refresh list
3. Edit: open the same form pre-filled with existing data, PUT on submit

**What to verify:** Delete a product → it disappears. Edit a product → changes persist.

**What to say:** "Delete is straightforward — call the API, refresh the list. For edit, I reuse the same form component but pre-fill it with the existing product data. The form detects whether it's creating or editing based on whether a product prop was passed."

---

## Step 7: Add demand forecast chart (8-10 min)

**What you're proving:** You can do data visualization with Chart.js.

**What to build:**
1. Create `components/DemandChart.jsx`
2. Add "Demand Forecast" button to ProductPage
3. Pass product data to the chart component
4. Render a Line chart with demand_forecast and selling_price

**What to verify:** Click "Demand Forecast" → chart appears with two lines and a legend.

**What to say:** "I'm using Chart.js with the react-chartjs-2 wrapper. The chart receives product data as props. I'm plotting demand forecast and selling price as two datasets on a line chart so you can see the relationship between demand and pricing."

---

## Step 8: Add pricing optimization view (5-8 min)

**What you're proving:** You can build a second view/page.

**What to build:**
1. Create `pages/PricingPage.jsx`
2. Simple table: name, category, description, cost_price, selling_price, optimized_price
3. Add navigation between the two pages (simple state toggle or react-router)

**What to verify:** Navigate to pricing page → see all products with optimized_price column highlighted.

**What to say:** "This is a read-only view showing the optimized prices alongside the original prices. The data comes from the same endpoint — I'm just selecting which columns to display."

---

## Step 9: Polish (remaining time)

**What to do if time permits:**
- Add loading spinner while data fetches
- Add basic responsive styling
- Add confirmation dialog for delete
- Make the chart modal closeable
- Add hover effects on table rows
- Write README

---

# PART 5: Code Guidance With Explanation

## 5.1 The API Client (already created in Doc 2)

**File:** `frontend/src/api/client.js`

```javascript
import axios from 'axios';

const API_BASE = '/api';

const api = {
  getProducts: (params = {}) =>
    axios.get(`${API_BASE}/products`, { params }).then(res => res.data),

  getProduct: (id) =>
    axios.get(`${API_BASE}/products/${id}`).then(res => res.data),

  createProduct: (data) =>
    axios.post(`${API_BASE}/products`, data).then(res => res.data),

  updateProduct: (id, data) =>
    axios.put(`${API_BASE}/products/${id}`, data).then(res => res.data),

  deleteProduct: (id) =>
    axios.delete(`${API_BASE}/products/${id}`).then(res => res.data),

  getCategories: () =>
    axios.get(`${API_BASE}/products/categories`).then(res => res.data),
};

export default api;
```

**Why this file exists:** Same reason you put database logic in `database.py`. One place for all external communication. Components never call `axios` directly — they call `api.getProducts()`. If the base URL changes, you update one file.

**Line-by-line:**
- `axios.get(url, { params })` — sends GET with query parameters. `{ params: { search: "wireless" } }` becomes `?search=wireless`
- `.then(res => res.data)` — axios wraps responses in `{ data, status, headers }`. We just want the data.
- `(params = {})` — default empty params so you can call `api.getProducts()` with no arguments

---

## 5.2 The App Shell

**File:** `frontend/src/App.jsx`

```jsx
import { useState } from 'react';
import ProductPage from './pages/ProductPage';
import PricingPage from './pages/PricingPage';

function App() {
  // 'home', 'products', or 'pricing'
  const [page, setPage] = useState('home');

  // Home screen with two cards (matches the BCG mockup)
  if (page === 'home') {
    return (
      <div style={{ 
        minHeight: '100vh', background: '#1a1a2e', color: 'white',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', fontFamily: 'sans-serif'
      }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Price Optimization Tool</h1>
        <div style={{ display: 'flex', gap: '2rem' }}>
          <div
            onClick={() => setPage('products')}
            style={{
              background: 'white', color: 'black', padding: '2rem',
              borderRadius: '12px', cursor: 'pointer', width: '250px',
            }}
          >
            <h3>Create and Manage Product</h3>
            <p style={{ color: '#666', fontSize: '0.9rem' }}>
              Add, edit, and manage your product catalog
            </p>
          </div>
          <div
            onClick={() => setPage('pricing')}
            style={{
              background: 'white', color: 'black', padding: '2rem',
              borderRadius: '12px', cursor: 'pointer', width: '250px',
            }}
          >
            <h3>Pricing Optimization</h3>
            <p style={{ color: '#666', fontSize: '0.9rem' }}>
              View optimized pricing recommendations
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Page content with back button header
  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      <header style={{
        background: '#16213e', color: 'white', padding: '12px 24px',
        display: 'flex', alignItems: 'center', gap: '16px'
      }}>
        <button
          onClick={() => setPage('home')}
          style={{
            background: 'none', border: 'none', color: '#2dd4bf',
            cursor: 'pointer', fontSize: '1rem'
          }}
        >
          ← Back
        </button>
        <span style={{ color: '#2dd4bf', fontWeight: 'bold' }}>
          Price Optimization Tool
        </span>
        <span style={{ marginLeft: '16px' }}>
          {page === 'products' ? 'Create and Manage Product' : 'Pricing Optimization'}
        </span>
      </header>
      {page === 'products' && <ProductPage />}
      {page === 'pricing' && <PricingPage />}
    </div>
  );
}

export default App;
```

**What this component does:**
- Manages which "page" is shown using a simple `page` state variable
- Home screen: two clickable cards (matches the BCG mockup layout)
- Product page and Pricing page: rendered with a header that includes a Back button

**Why not use React Router:** For two pages, a state variable is simpler. React Router adds a dependency, import boilerplate, and routing config. If the interviewer asks, say: "For two pages, conditional rendering is simpler. I'd add React Router when the app has 5+ routes or needs URL-based navigation."

**What causes re-renders here:** Only `setPage(...)`. When you click a card, `page` changes, React re-runs `App()`, and the correct page component appears.

---

## 5.3 The Product Page (the main one)

**File:** `frontend/src/pages/ProductPage.jsx`

This is the most important component. It owns all the state and orchestrates everything.

```jsx
import { useState, useEffect } from 'react';
import api from '../api/client';
import ProductTable from '../components/ProductTable';
import ProductForm from '../components/ProductForm';
import SearchBar from '../components/SearchBar';
import DemandChart from '../components/DemandChart';

function ProductPage() {
  // --- STATE ---
  const [products, setProducts] = useState([]);     // The product list from the API
  const [categories, setCategories] = useState([]);  // For the category dropdown
  const [search, setSearch] = useState('');           // Current search text
  const [category, setCategory] = useState('');       // Selected category filter
  const [loading, setLoading] = useState(true);       // Show loading indicator
  const [showForm, setShowForm] = useState(false);    // Is the add/edit form open?
  const [editProduct, setEditProduct] = useState(null); // Product being edited (null = creating)
  const [showChart, setShowChart] = useState(false);  // Is the chart modal open?

  // --- DATA FETCHING ---

  // fetchProducts: called on mount, and whenever search/category changes
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (category) params.category = category;
      const data = await api.getProducts(params);
      setProducts(data);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch products when search or category changes
  useEffect(() => {
    fetchProducts();
  }, [search, category]);
  // ↑ This dependency array means: re-run fetchProducts when search OR category changes.
  // It also runs once on mount (initial render).

  // Fetch categories once on mount (for the dropdown)
  useEffect(() => {
    api.getCategories().then(setCategories).catch(console.error);
  }, []);
  // ↑ Empty array = run once on mount. Categories don't change during the session.

  // --- EVENT HANDLERS ---

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    await api.deleteProduct(id);
    fetchProducts(); // Refresh the list
  };

  const handleEdit = (product) => {
    setEditProduct(product); // Store which product we're editing
    setShowForm(true);       // Open the form
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditProduct(null); // Clear the edit target
    fetchProducts();      // Refresh the list (new/updated product will appear)
  };

  // --- RENDER ---
  return (
    <div style={{ padding: '20px' }}>
      {/* Search and filter bar */}
      <SearchBar
        search={search}
        onSearchChange={setSearch}
        category={category}
        onCategoryChange={setCategory}
        categories={categories}
      />

      {/* Action buttons */}
      <div style={{ margin: '16px 0', display: 'flex', gap: '12px' }}>
        <button
          onClick={() => { setEditProduct(null); setShowForm(true); }}
          style={{
            background: '#2dd4bf', color: 'black', border: 'none',
            padding: '8px 16px', borderRadius: '6px', cursor: 'pointer',
          }}
        >
          + Add New Product
        </button>
        <button
          onClick={() => setShowChart(true)}
          style={{
            background: '#6366f1', color: 'white', border: 'none',
            padding: '8px 16px', borderRadius: '6px', cursor: 'pointer',
          }}
        >
          📊 Demand Forecast
        </button>
      </div>

      {/* Product table */}
      {loading ? (
        <p>Loading products...</p>
      ) : (
        <ProductTable
          products={products}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {/* Add/Edit form modal */}
      {showForm && (
        <ProductForm
          product={editProduct}
          onClose={handleFormClose}
        />
      )}

      {/* Demand forecast chart modal */}
      {showChart && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div style={{
            background: 'white', borderRadius: '12px', padding: '24px',
            width: '80%', maxWidth: '900px', maxHeight: '90vh', overflow: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <h2>Demand Forecast</h2>
              <button onClick={() => setShowChart(false)} style={{
                background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer'
              }}>✕</button>
            </div>
            <DemandChart products={products} />
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductPage;
```

**What every state variable does:**

| State | Type | Purpose | When it changes |
|-------|------|---------|-----------------|
| `products` | array | The list of products from the API | After every fetch |
| `categories` | array | Distinct categories for the dropdown | Once on mount |
| `search` | string | Current search text | On every keystroke in search input |
| `category` | string | Selected category filter | When user picks from dropdown |
| `loading` | boolean | Whether data is being fetched | Start/end of every fetch |
| `showForm` | boolean | Whether the add/edit modal is visible | Click "Add" or "Edit" / close form |
| `editProduct` | object or null | Which product is being edited | Click edit icon on a row |
| `showChart` | boolean | Whether the chart modal is visible | Click "Demand Forecast" / close chart |

**Why all state is in this component:** This is called "lifting state up." The ProductPage is the parent of ProductTable, SearchBar, ProductForm, and DemandChart. It owns the data and passes it down as props. Children communicate back up via callback functions (like `onDelete`, `onEdit`).

**Backend analogy:** Think of ProductPage as your FastAPI router. It owns the database connection (state), handles the request logic (fetch/create/update/delete), and delegates rendering to sub-handlers (components).

---

## 5.4 The Product Table Component

**File:** `frontend/src/components/ProductTable.jsx`

```jsx
function ProductTable({ products, onEdit, onDelete }) {
  // This component receives everything as props. It has NO state of its own.
  // It just renders what it's given.

  if (products.length === 0) {
    return <p style={{ color: '#888' }}>No products found.</p>;
  }

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{ background: '#1a1a2e', color: 'white', textAlign: 'left' }}>
          <th style={{ padding: '10px' }}>Name</th>
          <th style={{ padding: '10px' }}>Category</th>
          <th style={{ padding: '10px' }}>Cost Price</th>
          <th style={{ padding: '10px' }}>Selling Price</th>
          <th style={{ padding: '10px' }}>Description</th>
          <th style={{ padding: '10px' }}>Stock</th>
          <th style={{ padding: '10px' }}>Units Sold</th>
          <th style={{ padding: '10px' }}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {products.map(product => (
          <tr key={product.id} style={{ borderBottom: '1px solid #ddd' }}>
            <td style={{ padding: '10px' }}>{product.name}</td>
            <td style={{ padding: '10px' }}>{product.category}</td>
            <td style={{ padding: '10px' }}>${product.cost_price}</td>
            <td style={{ padding: '10px' }}>${product.selling_price}</td>
            <td style={{ padding: '10px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {product.description}
            </td>
            <td style={{ padding: '10px' }}>{product.stock_available}</td>
            <td style={{ padding: '10px' }}>{product.units_sold}</td>
            <td style={{ padding: '10px' }}>
              <button onClick={() => onEdit(product)} style={{ marginRight: '8px', cursor: 'pointer' }}>✏️</button>
              <button onClick={() => onDelete(product.id)} style={{ cursor: 'pointer', color: 'red' }}>🗑️</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default ProductTable;
```

**Critical React concepts in this code:**

**`products.map(product => ...)`** — This is how you render lists in React. `.map()` transforms each item in the array into a JSX element. It's like a Python list comprehension: `[render_row(p) for p in products]`.

**`key={product.id}`** — React requires a unique `key` on each list item so it can efficiently track which items changed, were added, or were removed. Always use the database ID. Never use the array index.

**`onClick={() => onEdit(product)}`** — When the edit button is clicked, call the `onEdit` callback (which came from the parent as a prop). This is how the child communicates back to the parent. The parent's `handleEdit` function receives the product and opens the form.

**Why no state in this component:** The table is a "dumb" display component. It just renders what it receives. All the intelligence (fetching, filtering, deleting) lives in the parent. This makes the table reusable and easy to test.

---

## 5.5 The Search Bar Component

**File:** `frontend/src/components/SearchBar.jsx`

```jsx
function SearchBar({ search, onSearchChange, category, onCategoryChange, categories }) {
  return (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
      <input
        type="text"
        placeholder="🔍 Search by product name..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        style={{
          padding: '8px 12px', borderRadius: '6px', border: '1px solid #ccc',
          width: '250px', fontSize: '0.9rem',
        }}
      />
      <select
        value={category}
        onChange={(e) => onCategoryChange(e.target.value)}
        style={{
          padding: '8px 12px', borderRadius: '6px', border: '1px solid #ccc',
          fontSize: '0.9rem',
        }}
      >
        <option value="">All Categories</option>
        {categories.map(cat => (
          <option key={cat} value={cat}>{cat}</option>
        ))}
      </select>
    </div>
  );
}

export default SearchBar;
```

**What's happening:**
- The search input is **controlled** — `value={search}` comes from the parent's state, `onChange` calls `onSearchChange` which is actually the parent's `setSearch`
- The category dropdown works the same way
- `categories.map(cat => <option ...>)` renders one option per category
- The empty `<option value="">All Categories</option>` is the default "show all" option

**Backend analogy:** This component is like a query parameter parser. It doesn't know what happens with the values — it just captures them and passes them up. The parent decides what to do (fetch from API with those params).

---

## 5.6 The Product Form Component

**File:** `frontend/src/components/ProductForm.jsx`

```jsx
import { useState } from 'react';
import api from '../api/client';

function ProductForm({ product, onClose }) {
  // If product is passed, we're editing. If null, we're creating.
  const isEditing = !!product;

  // Form state — initialized from the product (edit) or empty (create)
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    cost_price: product?.cost_price || '',
    selling_price: product?.selling_price || '',
    category: product?.category || '',
    stock_available: product?.stock_available || 0,
    units_sold: product?.units_sold || 0,
    customer_rating: product?.customer_rating || 0,
  });

  const [submitting, setSubmitting] = useState(false);

  // Update a single field in the form
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  // ↑ This uses the "spread previous state + override one key" pattern.
  //   Backend analogy: like dict.update({name: value}) in Python.

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // Convert string values to numbers where needed
      const payload = {
        ...formData,
        cost_price: parseFloat(formData.cost_price),
        selling_price: parseFloat(formData.selling_price),
        stock_available: parseInt(formData.stock_available),
        units_sold: parseInt(formData.units_sold),
        customer_rating: parseFloat(formData.customer_rating),
      };

      if (isEditing) {
        await api.updateProduct(product.id, payload);
      } else {
        await api.createProduct(payload);
      }
      onClose(); // Tell the parent to close the form and refresh
    } catch (err) {
      console.error('Submit failed:', err);
      alert('Failed to save product. Check the console for details.');
    } finally {
      setSubmitting(false);
    }
  };

  // Style for input fields
  const inputStyle = {
    width: '100%', padding: '8px', borderRadius: '4px',
    border: '1px solid #ccc', marginBottom: '12px', boxSizing: 'border-box',
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }}>
      <div style={{
        background: 'white', borderRadius: '12px', padding: '24px',
        width: '500px', maxHeight: '90vh', overflow: 'auto',
      }}>
        <h2>{isEditing ? 'Edit Product' : 'Add New Product'}</h2>

        <label>Product Name</label>
        <input name="name" value={formData.name} onChange={handleChange} style={inputStyle} />

        <label>Category</label>
        <input name="category" value={formData.category} onChange={handleChange} style={inputStyle} />

        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ flex: 1 }}>
            <label>Cost Price</label>
            <input name="cost_price" type="number" step="0.01" value={formData.cost_price} onChange={handleChange} style={inputStyle} />
          </div>
          <div style={{ flex: 1 }}>
            <label>Selling Price</label>
            <input name="selling_price" type="number" step="0.01" value={formData.selling_price} onChange={handleChange} style={inputStyle} />
          </div>
        </div>

        <label>Description</label>
        <textarea name="description" value={formData.description} onChange={handleChange}
          style={{ ...inputStyle, minHeight: '60px' }} />

        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ flex: 1 }}>
            <label>Stock Available</label>
            <input name="stock_available" type="number" value={formData.stock_available} onChange={handleChange} style={inputStyle} />
          </div>
          <div style={{ flex: 1 }}>
            <label>Units Sold</label>
            <input name="units_sold" type="number" value={formData.units_sold} onChange={handleChange} style={inputStyle} />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
          <button onClick={onClose} style={{ padding: '8px 20px', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSubmit} disabled={submitting} style={{
            padding: '8px 20px', borderRadius: '6px', cursor: 'pointer',
            background: '#2dd4bf', color: 'black', border: 'none',
          }}>
            {submitting ? 'Saving...' : (isEditing ? 'Save' : 'Add')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductForm;
```

**Key pattern — single state object for forms:**

Instead of one `useState` per field (messy for 8+ fields), we use one state object:

```jsx
const [formData, setFormData] = useState({ name: '', cost_price: '', ... });
```

And one handler for all fields:

```jsx
const handleChange = (e) => {
  const { name, value } = e.target;
  setFormData(prev => ({ ...prev, [name]: value }));
};
```

The `name` attribute on each `<input>` matches the key in `formData`. So `<input name="cost_price" ...>` updates `formData.cost_price`.

**Backend analogy:** This is like Pydantic's `model_dump()` and `model_copy(update={...})`. You have a data object (formData), and on each keystroke, you create a new copy with one field updated.

**Why `parseFloat` before submitting:** HTML inputs always give you strings, even `type="number"`. Your FastAPI backend expects actual numbers. So we convert before sending.

---

## 5.7 The Demand Chart Component

**File:** `frontend/src/components/DemandChart.jsx`

```jsx
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, Title, Tooltip, Legend,
} from 'chart.js';

// Register Chart.js components (required by react-chartjs-2)
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

function DemandChart({ products }) {
  // Build chart data from the products array
  const chartData = {
    labels: products.map(p => p.name),     // X-axis: product names
    datasets: [
      {
        label: 'Demand Forecast',
        data: products.map(p => p.demand_forecast),
        borderColor: '#8b5cf6',  // purple
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        tension: 0.3,            // slight curve on lines
      },
      {
        label: 'Selling Price',
        data: products.map(p => p.selling_price),
        borderColor: '#2dd4bf',  // teal (matches BCG mockup)
        backgroundColor: 'rgba(45, 212, 191, 0.1)',
        tension: 0.3,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'bottom' },
      title: { display: true, text: 'Demand Forecast vs Selling Price' },
    },
    scales: {
      y: { beginAtZero: true },
    },
  };

  return <Line data={chartData} options={options} />;
}

export default DemandChart;
```

**What this component does:**
1. Receives `products` array as a prop
2. Maps product names to x-axis labels
3. Maps `demand_forecast` values to one line (purple)
4. Maps `selling_price` values to another line (teal)
5. Configures Chart.js options (legend at bottom, title, responsive)
6. Returns a `<Line>` component that Chart.js renders as a canvas chart

**The ChartJS.register() call:** Chart.js v4 uses a tree-shakeable design — you must register the components you use. Without this, you get a blank chart with no error. This is the #1 gotcha with Chart.js.

**Why this is simple:** The chart component has NO state. It's purely a display component. It takes data as props and renders it. All the data fetching and state management happens in the parent (ProductPage).

---

## 5.8 The Pricing Optimization Page

**File:** `frontend/src/pages/PricingPage.jsx`

```jsx
import { useState, useEffect } from 'react';
import api from '../api/client';

function PricingPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getProducts()
      .then(data => { setProducts(data); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  }, []);

  if (loading) return <p style={{ padding: '20px' }}>Loading...</p>;

  return (
    <div style={{ padding: '20px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#1a1a2e', color: 'white', textAlign: 'left' }}>
            <th style={{ padding: '10px' }}>Product Name</th>
            <th style={{ padding: '10px' }}>Category</th>
            <th style={{ padding: '10px' }}>Description</th>
            <th style={{ padding: '10px' }}>Cost Price</th>
            <th style={{ padding: '10px' }}>Selling Price</th>
            <th style={{ padding: '10px' }}>Optimized Price</th>
          </tr>
        </thead>
        <tbody>
          {products.map(p => (
            <tr key={p.id} style={{ borderBottom: '1px solid #ddd' }}>
              <td style={{ padding: '10px' }}>{p.name}</td>
              <td style={{ padding: '10px' }}>{p.category}</td>
              <td style={{ padding: '10px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {p.description}
              </td>
              <td style={{ padding: '10px' }}>${p.cost_price}</td>
              <td style={{ padding: '10px' }}>${p.selling_price}</td>
              <td style={{ padding: '10px', color: '#2dd4bf', fontWeight: 'bold' }}>
                ${p.optimized_price}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default PricingPage;
```

This is the simplest page in the app. Fetch products, render a table, highlight the optimized_price column in teal. That's it.

---

# PART 6: React Basics You May Get Asked

**"What is the difference between props and state?"**
> Props are read-only inputs passed from a parent. State is mutable data owned by the component itself. Props flow down, state lives locally. When state changes, the component re-renders.

**"When does useEffect run?"**
> It runs after the component renders. With an empty dependency array, it runs once on mount. With dependencies, it runs whenever those values change. It's for side effects like API calls, timers, and subscriptions.

**"What is the key prop in lists?"**
> React uses `key` to track which items in a list changed, were added, or removed. Without keys (or with array indices as keys), React can't efficiently update the DOM. Always use a unique ID from the data, like the database primary key.

**"What is lifting state up?"**
> When two sibling components need the same data, you move the state to their common parent and pass it down as props. In this app, ProductPage owns the product data and passes it to both ProductTable and DemandChart.

**"What is conditional rendering?"**
> Showing or hiding parts of the UI based on state. In JSX: `{showForm && <ProductForm />}`. If `showForm` is true, the form renders. If false, nothing renders. It's like an `if` statement in your template.

**"Why use a separate API client file?"**
> Separation of concerns — the same reason I have a database.py in my backend. Components shouldn't know about URLs, HTTP methods, or axios. They call `api.getProducts()` and get data back.

---

# PART 7: Common Mistakes Backend Engineers Make in React

### Mistake 1: Mutating state directly

```jsx
// WRONG: This does nothing. React doesn't detect the change.
products.push(newProduct);

// RIGHT: Create a new array with the new item.
setProducts([...products, newProduct]);
```

**Why:** React uses reference equality to detect changes. `products.push()` modifies the same array reference. React sees the same reference and thinks nothing changed. Spread (`...`) creates a new array.

### Mistake 2: Forgetting that state updates are asynchronous

```jsx
setSearch('wireless');
console.log(search); // Still the old value! Not "wireless" yet.
```

**Why:** `setSearch` schedules a re-render. The new value is only available on the next render. This is different from Python where `x = 5; print(x)` gives you 5 immediately.

### Mistake 3: Infinite re-render loops

```jsx
// WRONG: useEffect with no dependency array + setState inside = infinite loop
useEffect(() => {
  api.getProducts().then(data => setProducts(data));
}); // ← Missing dependency array!
```

**Why:** No dependency array = run after every render. setProducts causes a render. That render triggers useEffect again. Loop forever. Always include a dependency array.

### Mistake 4: Using index as key in lists

```jsx
// WRONG: If items reorder, React gets confused
{products.map((p, index) => <tr key={index}>...

// RIGHT: Use the unique ID
{products.map(p => <tr key={p.id}>...
```

### Mistake 5: Over-engineering state management

Don't install Redux, Zustand, Jotai, or any state library for this app. `useState` is enough for 10 products and a few UI toggles. If asked, say: "For this scope, useState is sufficient. I'd add a state library when the app has deeply nested component trees or complex shared state."

### Mistake 6: Forgetting to handle loading and error states

Backend engineers often focus on the happy path. Add at minimum:

```jsx
if (loading) return <p>Loading...</p>;
if (error) return <p>Error loading products.</p>;
```

### Mistake 7: Trying to build the perfect CSS

Stop. Inline styles are fine for a live interview. Don't install Tailwind. Don't write a CSS file unless you have time at the end. The interviewer is evaluating functionality, not design quality.

### What to do if stuck live

1. **Console.log everything.** `console.log('products:', products)` in the component body. Check the browser console (F12).
2. **Check the Network tab.** Open browser DevTools → Network. See if the API request went out. See the response.
3. **Simplify.** If a component isn't working, replace it with `<p>{JSON.stringify(products)}</p>` to verify the data is there.
4. **Say it out loud.** "I'm debugging this — the API call succeeded but the table isn't updating. Let me check if state is updating correctly." The interviewer sees you thinking, not frozen.

---

# PART 8: Interview Narration Lines

Use these naturally while coding. Don't memorize them as scripts — just know the key phrases.

**Starting the frontend:**
> "I'm going to build the frontend now. I'll start with the product table since it's the core display component, then add search and filter, then the form, then the chart."

**When creating the page component:**
> "The page component owns all the state — the product list, search term, category filter, and form visibility. Child components receive data as props and communicate back through callbacks."

**When writing useEffect:**
> "This useEffect fetches products on mount and whenever the search or category filter changes. The dependency array tells React when to re-run the fetch."

**When building the form:**
> "I'm using a single state object for the form instead of one useState per field. The handleChange function updates the right field based on the input's name attribute. On submit, I convert strings to numbers and POST to the backend."

**When adding the chart:**
> "Chart.js needs you to register the components you use — that's the register call at the top. The chart data is just two arrays mapped from the products: demand forecast values and selling prices."

**If CSS looks rough:**
> "I'm using inline styles to move fast. In a production app, I'd use a proper CSS solution — at my company we use MUI components. But for live coding, inline styles keep me focused on functionality."

**If asked about frontend vs backend comfort:**
> "I'm backend-heavy — my strength is FastAPI, Postgres, and system architecture. I've shipped frontend features in Next.js and React at my current company, but I'm most productive on the backend. I can build and extend frontend code, and I understand the architecture well enough to work effectively with frontend-focused teammates."

---

# PART 9: Quick Reference

## The 5 patterns you need for this entire app

| Pattern | What it does | When to use |
|---------|-------------|-------------|
| `useState(initialValue)` | Creates mutable state | For products array, search text, form data, toggles |
| `useEffect(() => {...}, [deps])` | Runs side effects | For API calls on mount or when filters change |
| `products.map(p => <Row key={p.id} .../>)` | Renders lists | For table rows, dropdown options |
| `{condition && <Component />}` | Conditional rendering | For showing/hiding modals, loading states |
| `onChange={(e) => setSomething(e.target.value)}` | Controlled inputs | For search, form fields, dropdowns |

That's it. Five patterns. Everything in this app is a combination of these five.

---

# PART 10: Weak Areas to Patch

| Area | What to do |
|------|------------|
| **CSS/styling** | Don't try to match the mockup exactly. Use inline styles for layout. Dark header, white content, teal accent color. Good enough. |
| **Chart.js registration** | Memorize the register call. Without it, the chart silently fails. |
| **Form number conversion** | HTML inputs give strings. `parseFloat()` and `parseInt()` before sending to backend. |
| **useEffect dependency array** | If you forget it, you get infinite loops. Always include `[]` or `[dep1, dep2]`. |
| **Debouncing search** | For 10 products, immediate re-fetch on every keystroke is fine. If asked, explain you'd add a 300ms debounce with `setTimeout`. |

---

# PART 11: How This Document Connects to Your Resume

| What you're doing | Your real experience |
|-------------------|---------------------|
| React components with state/props | You've shipped MUI DataGrid, forms, filters at CAPSAI |
| API integration (fetch → display) | You wire frontend to FastAPI backends in production |
| Chart rendering | You've worked with data visualization in the Medicaid dashboard |
| Form handling + validation | You built upload UI with drag-and-drop, validation feedback |
| Conditional rendering | Your Medicaid workspace hides/shows tabs based on permissions |

**Honest framing if asked about frontend depth:** "I've shipped real frontend features — tables, forms, filters, upload UIs — but my core is backend. I understand the React architecture, I can build and debug frontend code, and I work effectively with frontend teammates. For this exercise, I'm keeping it simple and functional."

---

READY FOR DOCUMENT 5. SAY: GO AHEAD