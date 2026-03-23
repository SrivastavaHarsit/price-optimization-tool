import { useEffect, useMemo, useState } from 'react'
import CompareDemandModal from '../components/CompareDemandModal'
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
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [selectedProductIds, setSelectedProductIds] = useState([])

  const selectedProducts = useMemo(
    () => products.filter((product) => selectedProductIds.includes(product.id)),
    [products, selectedProductIds],
  )

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

  function openCompareModal() {
    if (selectedProducts.length === 0) {
      return
    }

    setIsCompareModalOpen(true)
  }

  function closeCompareModal() {
    setIsCompareModalOpen(false)
  }

  function toggleProductSelection(productId) {
    setSelectedProductIds((currentIds) => {
      if (currentIds.includes(productId)) {
        return currentIds.filter((id) => id !== productId)
      }

      return [...currentIds, productId]
    })
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

  useEffect(() => {
    setSelectedProductIds((currentIds) =>
      currentIds.filter((id) => products.some((product) => product.id === id)),
    )
  }, [products])

  useEffect(() => {
    if (selectedProducts.length === 0) {
      setIsCompareModalOpen(false)
    }
  }, [selectedProducts.length])

  return {
    categories,
    categoriesError,
    canShowProducts,
    closeCompareModal,
    closeProductModal,
    debounceDelayMs: DEBOUNCE_DELAY_MS,
    debouncedSearchTerm,
    editingProduct,
    handleDeleteProduct,
    handleProductSubmit,
    hasProductError,
    isCompareModalOpen,
    isEditMode,
    isProductModalOpen,
    isSearchPending,
    openCompareModal,
    openCreateModal,
    openEditModal,
    products,
    productsError,
    productsLoading,
    searchTerm,
    selectedCategory,
    selectedProductIds,
    selectedProducts,
    setSearchTerm,
    setSelectedCategory,
    toggleProductSelection,
  }
}

function ProductPage({ controller }) {
  const {
    categories,
    categoriesError,
    canShowProducts,
    closeCompareModal,
    closeProductModal,
    debouncedSearchTerm,
    editingProduct,
    handleDeleteProduct,
    handleProductSubmit,
    hasProductError,
    isCompareModalOpen,
    isEditMode,
    isProductModalOpen,
    isSearchPending,
    openCompareModal,
    openCreateModal,
    openEditModal,
    products,
    productsError,
    productsLoading,
    searchTerm,
    selectedCategory,
    selectedProductIds,
    selectedProducts,
    setSearchTerm,
    setSelectedCategory,
    toggleProductSelection,
    debounceDelayMs,
  } = controller

  return (
    <>
      <section className="status-card">
        <div className="section-header">
          <h2>Products</h2>
          <div className="section-actions">
            <button type="button" className="secondary-button" onClick={openCompareModal} disabled={selectedProducts.length === 0}>
              Compare Demand ({selectedProducts.length})
            </button>
            <button type="button" className="primary-button" onClick={openCreateModal}>
              Add Product
            </button>
          </div>
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
            <p className="search-helper">
              Selected for demand comparison: <strong>{selectedProducts.length}</strong>
            </p>
            <ProductTable
              products={products}
              onEdit={openEditModal}
              onDelete={handleDeleteProduct}
              selectedProductIds={selectedProductIds}
              onToggleProductSelection={toggleProductSelection}
            />
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

      <CompareDemandModal
        isOpen={isCompareModalOpen}
        products={selectedProducts}
        onClose={closeCompareModal}
      />

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
