import axios from 'axios'

// Create one shared axios instance so every component uses the same base config.
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Normalize backend errors in one place.
// If JWT refresh or retry logic is needed later, this interceptor is the natural place for it.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const backendMessage = error.response?.data?.detail || error.response?.data?.message
    const fallbackMessage = error.message || 'Request failed'

    return Promise.reject(new Error(backendMessage || fallbackMessage))
  },
)

// Health check used by App.jsx to confirm the backend is reachable.
export async function getHealth() {
  const response = await api.get('/health')
  return response.data
}

// Category list used by the category dropdown.
export async function getCategories() {
  const response = await api.get('/products/categories')
  return response.data
}

// Product list fetch with optional search/category query params.
export async function getProducts({ search = '', category = '' } = {}) {
  const params = {}

  if (search.trim()) {
    params.search = search.trim()
  }

  if (category.trim()) {
    params.category = category.trim()
  }

  const response = await api.get('/products', { params })
  return response.data
}

// Create a new product row in the backend.
export async function createProduct(productData) {
  const response = await api.post('/products', productData)
  return response.data
}

// Update one existing product by ID.
export async function updateProduct(productId, productData) {
  const response = await api.put('/products/' + productId, productData)
  return response.data
}

// Delete one existing product by ID.
export async function deleteProduct(productId) {
  const response = await api.delete('/products/' + productId)
  return response.data
}
