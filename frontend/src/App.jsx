import { useEffect, useState } from 'react'
import ProductForm from './components/ProductForm'
import ProductTable from './components/ProductTable'
import SearchBar from './components/SearchBar'
import { createProduct, getCategories, getHealth, getProducts } from './api/client'
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
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  async function loadProducts(searchValue, categoryValue) {
    setProductsLoading(true)
    setProductsError('')

    try {
      const data = await getProducts({
        search: searchValue,
        category: categoryValue,
      })
      setProducts(data)
    } catch (err) {
      setProductsError(err.message || 'Failed to load products')
    } finally {
      setProductsLoading(false)
    }
  }

  async function loadCategories() {
    try {
      const data = await getCategories()
      setCategories(data)
      setCategoriesError('')
    } catch (err) {
      setCategoriesError(err.message || 'Failed to load categories')
    }
  }

  async function handleCreateProduct(productData) {
    await createProduct(productData)
    await loadCategories()
    await loadProducts(debouncedSearchTerm, selectedCategory)
    setIsCreateModalOpen(false)
  }

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
    loadProducts(debouncedSearchTerm, selectedCategory)
  }, [debouncedSearchTerm, selectedCategory])

  return (
    <div className="app-shell">
      <h1>Price Optimization Tool</h1>
      <p>Frontend booted successfully.</p>
      <p>This step adds a create modal with one formData object, a POST request, and a refresh after successful creation.</p>

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
        <div className="section-header">
          <h2>Products</h2>
          <button type="button" className="primary-button" onClick={() => setIsCreateModalOpen(true)}>
            Add Product
          </button>
        </div>

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

      <ProductForm
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateProduct}
      />
    </div>
  )
}

export default App
