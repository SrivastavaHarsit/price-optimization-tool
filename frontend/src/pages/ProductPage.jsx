import { useEffect, useMemo, useState } from 'react'
import CompareDemandModal from '../components/CompareDemandModal'
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
  // Main product list returned from the backend.
  const [products, setProducts] = useState([])

  // Loading flag for the product list request.
  const [productsLoading, setProductsLoading] = useState(true)

  // Error message for product list failures.
  const [productsError, setProductsError] = useState('')

  // Category options for the dropdown.
  const [categories, setCategories] = useState([])

  // Error message for category fetch failures.
  const [categoriesError, setCategoriesError] = useState('')

  // Currently selected category filter.
  const [selectedCategory, setSelectedCategory] = useState('')

  // Raw text the user is typing right now.
  const [searchTerm, setSearchTerm] = useState('')

  // Debounced search value that is safe to send to the backend.
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')

  // Controls whether the add/edit product modal is visible.
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)

  // Controls whether the compare-demand modal is visible.
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false)

  // Holds the row being edited. Null means create mode.
  const [editingProduct, setEditingProduct] = useState(null)

  // Stores the selected table row IDs for compare-demand flow.
  const [selectedProductIds, setSelectedProductIds] = useState([])

  // Convert selected IDs into the actual product objects used by the compare modal.
  const selectedProducts = useMemo(
    () => products.filter((product) => selectedProductIds.includes(product.id)),
    [products, selectedProductIds],
  )

  // Derived flag: true while user has typed something that has not finished debouncing yet.
  const isSearchPending = searchTerm !== debouncedSearchTerm

  // Derived flag: true when the form should save with PUT instead of POST.
  const isEditMode = editingProduct !== null

  // Derived flag: product list request finished with an error.
  const hasProductError = productsLoading === false && productsError !== ''

  // Derived flag: product list request finished successfully.
  const canShowProducts = productsLoading === false && productsError === ''

  // Fetch products from the backend using the latest search + category values.
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

  // Fetch all distinct categories for the dropdown.
  async function loadCategories() {
    try {
      const data = await getCategories()
      setCategories(data)
      setCategoriesError('')
    } catch (err) {
      setCategoriesError(err.message || 'Failed to load categories')
    }
  }

  // Close the create/edit modal and clear edit mode.
  function closeProductModal() {
    setIsProductModalOpen(false)
    setEditingProduct(null)
  }

  // Open the product form in create mode.
  function openCreateModal() {
    setEditingProduct(null)
    setIsProductModalOpen(true)
  }

  // Open the product form in edit mode with the clicked row.
  function openEditModal(product) {
    setEditingProduct(product)
    setIsProductModalOpen(true)
  }

  // Open compare modal only when at least one product is selected.
  function openCompareModal() {
    if (selectedProducts.length === 0) {
      return
    }

    setIsCompareModalOpen(true)
  }

  // Close the compare modal.
  function closeCompareModal() {
    setIsCompareModalOpen(false)
  }

  // Toggle a product row checkbox on or off.
  function toggleProductSelection(productId) {
    setSelectedProductIds((currentIds) => {
      if (currentIds.includes(productId)) {
        return currentIds.filter((id) => id !== productId)
      }

      return [...currentIds, productId]
    })
  }

  // Refresh helper used after create, update, and delete so UI stays aligned with backend truth.
  async function refreshProductData() {
    await loadCategories()
    await loadProducts(debouncedSearchTerm, selectedCategory)
  }

  // One submit handler powers both create and edit flows.
  async function handleProductSubmit(productData) {
    if (isEditMode) {
      await updateProduct(editingProduct.id, productData)
    } else {
      await createProduct(productData)
    }

    await refreshProductData()
    closeProductModal()
  }

  // Delete a row after confirmation, then refresh the page state.
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

  // Load categories once when the page controller is first created.
  useEffect(() => {
    loadCategories()
  }, [])

  // Debounce the raw search input so we do not call the backend on every keypress.
  useEffect(() => {
    const timerId = window.setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, DEBOUNCE_DELAY_MS)

    return () => {
      window.clearTimeout(timerId)
    }
  }, [searchTerm])

  // Fetch products whenever the debounced search value or category changes.
  useEffect(() => {
    loadProducts(debouncedSearchTerm, selectedCategory)
  }, [debouncedSearchTerm, selectedCategory])

  // If filters change, remove any selected IDs that are no longer visible in the current list.
  useEffect(() => {
    setSelectedProductIds((currentIds) =>
      currentIds.filter((id) => products.some((product) => product.id === id)),
    )
  }, [products])

  // If selection becomes empty, auto-close the compare modal.
  useEffect(() => {
    if (selectedProducts.length === 0) {
      setIsCompareModalOpen(false)
    }
  }, [selectedProducts.length])

  // Return everything the ProductPage UI needs to render and respond to user actions.
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
  // Read all UI state + handlers from the custom hook/controller.
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

  // Render the main product management page: filters, table, and both modals.
  return (
    <>
      {/* Product list section with actions, filters, and table. */}
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

      {/* Compare modal for only the selected rows. */}
      <CompareDemandModal
        isOpen={isCompareModalOpen}
        products={selectedProducts}
        onClose={closeCompareModal}
      />

      {/* Create/edit modal for product CRUD. */}
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
