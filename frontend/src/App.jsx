import { useEffect, useState } from 'react'
import ProductTable from './components/ProductTable'
import SearchBar from './components/SearchBar'
import { getCategories, getHealth, getProducts } from './api/client'
import './App.css'

const DEBOUNCE_DELAY_MS = 300

function App() {
  const [health, setHealth] = useState(null)
  const [healthLoading, setHealthLoading] = useState(true)
  const [healthError, setHealthError] = useState('')

  const [products, setProducts] = useState([])
  const [productsLoading, setProductsLoading] = useState(true)
  const [productsError, setProductsError] = useState('')

  const [categories, setCategories] = useState([])
  const [categoriesError, setCategoriesError] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')

  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')

  useEffect(() => {
    async function loadHealth() {
      try {
        const data = await getHealth()
        setHealth(data)
      } catch (err) {
        setHealthError(err.message || 'Failed to reach backend')
      } finally {
        setHealthLoading(false)
      }
    }

    loadHealth()
  }, [])

  useEffect(() => {
    async function loadCategories() {
      try {
        const data = await getCategories()
        setCategories(data)
      } catch (err) {
        setCategoriesError(err.message || 'Failed to load categories')
      }
    }

    loadCategories()
  }, [])

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, DEBOUNCE_DELAY_MS)

    return () => {
      window.clearTimeout(timerId)
    }
  }, [searchTerm])

  useEffect(() => {
    async function loadProducts() {
      setProductsLoading(true)
      setProductsError('')

      try {
        const data = await getProducts({
          search: debouncedSearchTerm,
          category: selectedCategory,
        })
        setProducts(data)
      } catch (err) {
        setProductsError(err.message || 'Failed to load products')
      } finally {
        setProductsLoading(false)
      }
    }

    loadProducts()
  }, [debouncedSearchTerm, selectedCategory])

  return (
    <div className="app-shell">
      <h1>Price Optimization Tool</h1>
      <p>Frontend booted successfully.</p>
      <p>This step adds a category dropdown and keeps both filters in page state before passing products down to the table.</p>

      <section className="status-card">
        <h2>Backend Status</h2>

        {healthLoading ? <p>Checking backend connection...</p> : null}

        {healthLoading === false && healthError ? (
          <p className="status-error">{healthError}</p>
        ) : null}

        {healthLoading === false && health ? (
          <div>
            <p>
              <strong>Status:</strong> {health.status}
            </p>
            <p>
              <strong>Service:</strong> {health.service}
            </p>
          </div>
        ) : null}
      </section>

      <section className="status-card">
        <h2>Products</h2>

        <SearchBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedCategory={selectedCategory}
          categories={categories}
          onCategoryChange={setSelectedCategory}
          debouncedSearchTerm={debouncedSearchTerm}
          isSearchPending={searchTerm !== debouncedSearchTerm}
          debounceDelayMs={DEBOUNCE_DELAY_MS}
        />

        {categoriesError ? <p className="status-error">{categoriesError}</p> : null}

        {productsLoading ? <p>Loading products...</p> : null}

        {productsLoading === false && productsError ? (
          <p className="status-error">{productsError}</p>
        ) : null}

        {productsLoading === false && productsError === '' ? (
          <div>
            <p>
              <strong>Product count:</strong> {products.length}
            </p>
            <ProductTable products={products} />
          </div>
        ) : null}
      </section>
    </div>
  )
}

export default App
