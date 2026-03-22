import { useEffect, useState } from 'react'

const INITIAL_FORM_DATA = {
  name: '',
  description: '',
  cost_price: '0',
  selling_price: '0',
  category: '',
  stock_available: '0',
  units_sold: '0',
  customer_rating: '0',
  demand_forecast: '0',
  optimized_price: '0',
}

function mapProductToFormData(product) {
  if (product === null) {
    return INITIAL_FORM_DATA
  }

  return {
    name: String(product.name ?? ''),
    description: String(product.description ?? ''),
    cost_price: String(product.cost_price ?? 0),
    selling_price: String(product.selling_price ?? 0),
    category: String(product.category ?? ''),
    stock_available: String(product.stock_available ?? 0),
    units_sold: String(product.units_sold ?? 0),
    customer_rating: String(product.customer_rating ?? 0),
    demand_forecast: String(product.demand_forecast ?? 0),
    optimized_price: String(product.optimized_price ?? 0),
  }
}

function ProductForm({ isOpen, mode, initialData, onClose, onSubmit }) {
  const [formData, setFormData] = useState(INITIAL_FORM_DATA)
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const isEditMode = mode === 'edit'
  const modalTitle = isEditMode ? 'Edit Product' : 'Add Product'
  const submitLabel = submitting ? (isEditMode ? 'Saving...' : 'Creating...') : (isEditMode ? 'Save Changes' : 'Create Product')
  const helperText = isEditMode
    ? 'This form is preloaded from the selected row. On submit it sends a PUT request and refreshes the list.'
    : 'This form sends a plain POST request to the backend. Forecast and optimized price are entered directly for new records in this MVP.'

  useEffect(() => {
    if (isOpen) {
      setFormData(mapProductToFormData(initialData))
      setSubmitError('')
      setSubmitting(false)
    }
  }, [isOpen, initialData])

  function handleChange(event) {
    const { name, value } = event.target

    setFormData((currentFormData) => ({
      ...currentFormData,
      [name]: value,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setSubmitError('')

    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      cost_price: Number(formData.cost_price),
      selling_price: Number(formData.selling_price),
      category: formData.category.trim(),
      stock_available: Number(formData.stock_available),
      units_sold: Number(formData.units_sold),
      customer_rating: Number(formData.customer_rating),
      demand_forecast: Number(formData.demand_forecast),
      optimized_price: Number(formData.optimized_price),
    }

    try {
      await onSubmit(payload)
      setFormData(INITIAL_FORM_DATA)
    } catch (err) {
      setSubmitError(err.message || 'Failed to save product')
      setSubmitting(false)
      return
    }

    setSubmitting(false)
  }

  if (isOpen === false) {
    return null
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="product-form-title">
      <div className="modal-card">
        <div className="modal-header">
          <h2 id="product-form-title">{modalTitle}</h2>
          <button type="button" className="secondary-button" onClick={onClose}>
            Close
          </button>
        </div>

        <p className="search-helper">{helperText}</p>

        <form className="product-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <label className="form-field">
              <span>Name</span>
              <input name="name" type="text" value={formData.name} onChange={handleChange} required />
            </label>

            <label className="form-field">
              <span>Category</span>
              <input name="category" type="text" value={formData.category} onChange={handleChange} required />
            </label>

            <label className="form-field form-field-wide">
              <span>Description</span>
              <textarea name="description" rows="3" value={formData.description} onChange={handleChange} />
            </label>

            <label className="form-field">
              <span>Cost Price</span>
              <input name="cost_price" type="number" min="0.01" step="0.01" value={formData.cost_price} onChange={handleChange} required />
            </label>

            <label className="form-field">
              <span>Selling Price</span>
              <input name="selling_price" type="number" min="0.01" step="0.01" value={formData.selling_price} onChange={handleChange} required />
            </label>

            <label className="form-field">
              <span>Stock Available</span>
              <input name="stock_available" type="number" min="0" step="1" value={formData.stock_available} onChange={handleChange} required />
            </label>

            <label className="form-field">
              <span>Units Sold</span>
              <input name="units_sold" type="number" min="0" step="1" value={formData.units_sold} onChange={handleChange} required />
            </label>

            <label className="form-field">
              <span>Customer Rating</span>
              <input name="customer_rating" type="number" min="0" max="5" step="0.1" value={formData.customer_rating} onChange={handleChange} required />
            </label>

            <label className="form-field">
              <span>Demand Forecast</span>
              <input name="demand_forecast" type="number" min="0" step="1" value={formData.demand_forecast} onChange={handleChange} required />
            </label>

            <label className="form-field">
              <span>Optimized Price</span>
              <input name="optimized_price" type="number" min="0" step="0.01" value={formData.optimized_price} onChange={handleChange} required />
            </label>
          </div>

          {submitError ? <p className="status-error">{submitError}</p> : null}

          <div className="modal-actions">
            <button type="button" className="secondary-button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="primary-button" disabled={submitting}>
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ProductForm
