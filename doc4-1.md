# Frontend from Memory — 15-Minute Pre-Interview Revision

---

## 1. The Frontend Flow (Trace This Mentally in 15 Minutes)

### Minute 0-3: How React works

A component is a function that returns HTML. When you call `setX(newValue)`, React re-runs the function with the new value, and the screen updates. That's it. Everything else is details.

```
User does something → state changes → component re-runs → screen updates
```

Data flows DOWN (parent → child via props). Events flow UP (child → parent via callback functions).

### Minute 3-6: How this app loads

```
Browser hits localhost:5173
  → Vite serves JS bundle
  → React mounts App
  → App renders ProductPage
  → ProductPage has useState([]) for products
  → useEffect(fn, []) runs ONCE on mount
  → fn calls api.getProducts()
  → axios GET /api/products → Vite proxy → FastAPI → asyncpg → Postgres
  → JSON array returns
  → setProducts(data) → React re-renders → .map() renders table rows
  → User sees 10 products
```

### Minute 6-9: How interactions work

**Search:** Type → onChange → setSearch("wireless") → useEffect sees search changed → re-fetches with `?search=wireless` → backend filters with ILIKE → 1 result returns → table shows 1 row.

**Category filter:** Select dropdown → setCategory("Electronics") → useEffect fires → re-fetches with `?category=Electronics` → 3 results → table updates.

**Create:** Click "Add" → setShowForm(true) → form renders (conditional rendering) → user fills fields (controlled inputs, each onChange updates formData state) → click Submit → api.createProduct(payload) → POST → backend inserts → onClose callback fires → setShowForm(false) + fetchProducts() → list refreshes.

**Delete:** Click 🗑️ → confirm() → api.deleteProduct(id) → DELETE → fetchProducts() → row disappears.

**Chart:** Click "Demand Forecast" → setShowChart(true) → DemandChart receives products as props → Chart.js renders two lines (demand_forecast purple, selling_price teal) → user sees chart in modal.

### Minute 9-12: Where state lives

ALL state lives in ProductPage. Children are dumb display components.

```
ProductPage (owns everything)
  ├── products []          ← from API
  ├── categories []        ← from API (once)
  ├── search ""            ← from SearchBar input
  ├── category ""          ← from SearchBar dropdown
  ├── loading true/false
  ├── showForm true/false
  ├── editProduct null/obj
  └── showChart true/false
      │
      ├── SearchBar        ← receives search, category, callbacks as props
      ├── ProductTable     ← receives products, onEdit, onDelete as props
      ├── ProductForm      ← receives editProduct, onClose as props (has OWN formData state)
      └── DemandChart      ← receives products as props (NO state)
```

### Minute 12-15: The files

```
src/
  main.jsx          ← boot file, never touch
  App.jsx            ← page switcher (home / products / pricing)
  api/client.js      ← all axios calls
  pages/
    ProductPage.jsx  ← the big one: state + fetch + handlers
    PricingPage.jsx  ← simple: fetch + read-only table
  components/
    ProductTable.jsx ← stateless, renders rows from props
    ProductForm.jsx  ← has formData state, calls API on submit
    SearchBar.jsx    ← stateless, fires callbacks on input change
    DemandChart.jsx  ← stateless, Chart.js from props
```

---

## 2. The 10 React Concepts You Must Remember

**1. `useState` creates reactive data.**
```jsx
const [products, setProducts] = useState([]);
// products = current value. setProducts = updater. [] = initial.
```

**2. `setX(newValue)` triggers re-render. Direct mutation does nothing.**
```jsx
// WRONG: products.push(item)     ← React doesn't detect this
// RIGHT: setProducts([...products, item])  ← new array, React re-renders
```

**3. `useEffect(fn, [deps])` runs side effects after render.**
```jsx
useEffect(() => { fetchData(); }, []);          // [] = once on mount
useEffect(() => { fetchData(); }, [search]);    // runs when search changes
// NO array = every render = usually a bug
```

**4. Props are read-only arguments passed from parent to child.**
```jsx
<ProductTable products={products} onDelete={handleDelete} />
// Inside ProductTable: function ProductTable({ products, onDelete }) { ... }
```

**5. `.map()` renders lists. Always use `key={uniqueId}`.**
```jsx
{products.map(p => <tr key={p.id}><td>{p.name}</td></tr>)}
```

**6. `{condition && <Component />}` for conditional rendering.**
```jsx
{showForm && <ProductForm />}    // renders form only when showForm is true
{loading ? <p>Loading...</p> : <ProductTable ... />}  // ternary also works
```

**7. Controlled inputs: value from state, onChange updates state.**
```jsx
<input value={search} onChange={(e) => setSearch(e.target.value)} />
```

**8. Single state object for forms, spread to update one field.**
```jsx
const [formData, setFormData] = useState({ name: '', price: '' });
const handleChange = (e) => {
  setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
};
```

**9. Child-to-parent communication = callback props.**
```jsx
// Parent passes: <SearchBar onSearchChange={setSearch} />
// Child calls:   onChange={(e) => onSearchChange(e.target.value)}
```

**10. Chart.js requires explicit registration or it silently fails.**
```jsx
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);
```

---

## 3. Exact Frontend Build Order from Memory

| Step | What | Time | Verify by |
|------|------|------|-----------|
| 1 | Start dev server, see app in browser | 1 min | Page loads |
| 2 | Confirm API connectivity (products load) | 1 min | 10 products visible |
| 3 | Create ProductPage with state + useEffect fetch | 5 min | Products in a basic `<table>` |
| 4 | Extract ProductTable component, pass products as props | 3 min | Same table, cleaner code |
| 5 | Add SearchBar: input + category dropdown | 5 min | Type "wireless" → 1 result. Select "Electronics" → 3 results |
| 6 | Add ProductForm modal, wire create | 8 min | Click Add → fill form → submit → new row appears |
| 7 | Wire edit (reuse form with product prop) + delete | 5 min | Edit changes persist. Delete removes row. |
| 8 | Add DemandChart with Chart.js | 6 min | Click button → chart modal with two lines |
| 9 | Add PricingPage (read-only table with optimized_price) | 4 min | Navigate → see optimized prices in teal |
| 10 | Polish: loading states, responsive, README | remaining | App feels complete |

**Total: ~38 minutes.** With backend done in ~22 min, you're at ~60 min total with 20 min buffer.

---

## 4. The 10 Lines to Say Aloud During Live Coding

**1. Starting:**
"I'll build the frontend now — smallest vertical slice first. Get the table working, then search, then form, then chart."

**2. Creating ProductPage:**
"This page component owns all the state. It fetches data, manages search and filter, and passes everything to child components as props."

**3. Writing useEffect:**
"This fetches products on mount and whenever the search or category changes. The dependency array controls when it re-runs."

**4. Building the table:**
"The table component is stateless — it just renders whatever products it receives. The page is responsible for the data."

**5. Wiring search:**
"The search input is controlled — its value comes from state, and onChange updates that state, which triggers a re-fetch."

**6. Building the form:**
"I'm using one state object for all form fields. The handleChange function uses the input's name attribute to update the right field."

**7. On form submit:**
"I convert string values to numbers before sending — HTML inputs always give strings, but the backend expects typed data."

**8. Adding the chart:**
"Chart.js needs component registration — without it, the chart silently renders nothing. Two datasets: demand forecast and selling price."

**9. If styling is rough:**
"I'm using inline styles to stay focused on functionality. In production, I'd use a component library like MUI — which is what I use at my current company."

**10. If asked about frontend depth:**
"My core is backend. I've shipped real frontend features — tables, forms, filters — but I'm most impactful on API design, database, and system architecture."

---

## 5. The 5 Most Likely Frontend Bugs and How to Debug Them

### Bug 1: Table shows nothing, no errors

**Cause:** API call succeeded but state wasn't updated, OR data is there but render logic is wrong.

**Debug:**
```jsx
// Add this inside the component, before the return:
console.log('products:', products);
```
Check browser console (F12). If products is `[]`, the fetch failed or hasn't completed. If it has data, the `.map()` rendering is wrong.

**Also check:** Network tab in DevTools. Is the request going out? Is it returning 200 with data?

### Bug 2: Infinite loading / page freezing

**Cause:** useEffect without a dependency array, or a dependency that changes on every render.

**Debug:** Look for `useEffect(() => { ... })` with no `[]` at the end. Add the dependency array. Also check if you're creating a new object/array in the dependency array — that causes infinite re-renders because `{} !== {}` in JavaScript.

**Fix:** Always write `useEffect(() => { ... }, []);` first, then add specific deps.

### Bug 3: Chart renders as blank white space

**Cause:** Missing `ChartJS.register(...)` call.

**Fix:** Add this at the top of your chart component file:
```jsx
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);
```

**Also check:** Is `products` empty when the chart mounts? Add `console.log('chart data:', products)`.

### Bug 4: Form submit sends strings, backend returns 422

**Cause:** HTML inputs give strings. `"59.99"` instead of `59.99`. Pydantic expects a number, gets a string, returns 422 Unprocessable Entity.

**Debug:** Check Network tab → look at the request payload. Are prices quoted strings?

**Fix:** `parseFloat()` / `parseInt()` before sending:
```jsx
const payload = { ...formData, cost_price: parseFloat(formData.cost_price) };
```

### Bug 5: CORS error in browser console

**Symptom:** Red error in console: `Access to XMLHttpRequest... has been blocked by CORS policy`.

**Cause:** Frontend is calling `http://localhost:8000/api/...` directly instead of going through the Vite proxy at `/api/...`.

**Fix:** Make sure your API client uses `/api/products` (relative path), not `http://localhost:8000/api/products`. The Vite proxy in `vite.config.js` forwards `/api` to `localhost:8000`.

**If proxy isn't set up:** Check that FastAPI CORS middleware includes `http://localhost:5173` in `allow_origins`.

---

*Print this. Read it once the night before. Skim it 15 minutes before the interview. You're ready.*