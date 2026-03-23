import { useEffect, useState } from 'react'
import DemandChart from '../components/DemandChart'
import ProductForm from '../components/ProductForm'
import ProductTable from '../components/ProductTable'
import SearchBar from '../components/SearchBar'
import {
  createProduct,
  deleteProduct,
  getCategories,
  getProducts,
  updateProduct,
} from '../api/client'

const DEBOUNCE_DELAY_MS = 300

export function useProductPageController() {
  const [products, setProducts] = useState([])
  const [productsLoading, setProductsLoading] = useState(true)
  const [productsError, setProductsError] = useState('')

  const [categories, setCategories] = useState([])
  const [categoriesError, setCategoriesError] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')

  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)

  const isSearchPending = searchTerm !== debouncedSearchTerm
  const isEditMode = editingProduct !== null
  const hasProductError = productsLoading === false && productsError !== ''
  const canShowProducts = productsLoading === false && productsError === ''

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

  function closeProductModal() {
    setIsProductModalOpen(false)
    setEditingProduct(null)
  }

  function openCreateModal() {
    setEditingProduct(null)
    setIsProductModalOpen(true)
  }

  function openEditModal(product) {
    setEditingProduct(product)
    setIsProductModalOpen(true)
  }

  async function refreshProductData() {
    await loadCategories()
    await loadProducts(debouncedSearchTerm, selectedCategory)
  }

  async function handleProductSubmit(productData) {
    if (isEditMode) {
      await updateProduct(editingProduct.id, productData)
    } else {
      await createProduct(productData)
    }

    await refreshProductData()
    closeProductModal()
  }

  async function handleDeleteProduct(product) {
    const shouldDelete = window.confirm('Delete ' + product.name + '?')

    if (shouldDelete === false) {
      return
    }

    await deleteProduct(product.id)

    if (editingProduct && editingProduct.id === product.id) {
      closeProductModal()
    }

    await refreshProductData()
  }

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

  return {
    categories,
    categoriesError,
    canShowProducts,
    debouncedSearchTerm,
    editingProduct,
    handleDeleteProduct,
    handleProductSubmit,
    hasProductError,
    isEditMode,
    isProductModalOpen,
    isSearchPending,
    openCreateModal,
    openEditModal,
    products,
    productsError,
    productsLoading,
    searchTerm,
    selectedCategory,
    setSearchTerm,
    setSelectedCategory,
    closeProductModal,
    debounceDelayMs: DEBOUNCE_DELAY_MS,
  }
}

function ProductPage({ controller }) {
  const {
    categories,
    categoriesError,
    canShowProducts,
    debouncedSearchTerm,
    editingProduct,
    handleDeleteProduct,
    handleProductSubmit,
    hasProductError,
    isEditMode,
    isProductModalOpen,
    isSearchPending,
    openCreateModal,
    openEditModal,
    products,
    productsError,
    productsLoading,
    searchTerm,
    selectedCategory,
    setSearchTerm,
    setSelectedCategory,
    closeProductModal,
    debounceDelayMs,
  } = controller

  return (
    <>
      <section className="status-card">
        <div className="section-header">
          <h2>Products</h2>
          <button type="button" className="primary-button" onClick={openCreateModal}>
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
          isSearchPending={isSearchPending}
          debounceDelayMs={debounceDelayMs}
        />

        {categoriesError ? <p className="status-error">{categoriesError}</p> : null}

        {productsLoading ? <p>Loading products...</p> : null}

        {hasProductError ? <p className="status-error">{productsError}</p> : null}

        {canShowProducts ? (
          <div>
            <p>
              <strong>Product count:</strong> {products.length}
            </p>
            <ProductTable products={products} onEdit={openEditModal} onDelete={handleDeleteProduct} />
          </div>
        ) : null}
      </section>

      {canShowProducts ? (
        <section className="status-card">
          <h2>Demand Forecast Chart</h2>
          <p>This is a product-wise comparison chart, not a time-series forecast.</p>
          <DemandChart products={products} />
        </section>
      ) : null}

      <ProductForm
        isOpen={isProductModalOpen}
        mode={isEditMode ? 'edit' : 'create'}
        initialData={editingProduct}
        onClose={closeProductModal}
        onSubmit={handleProductSubmit}
      />
    </>
  )
}

export default ProductPage
