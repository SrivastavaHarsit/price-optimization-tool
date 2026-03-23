import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// JWT refresh logic would plug into this interceptor later without changing callers.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const backendMessage = error.response?.data?.detail || error.response?.data?.message
    const fallbackMessage = error.message || 'Request failed'

    return Promise.reject(new Error(backendMessage || fallbackMessage))
  },
)

export async function getHealth() {
  const response = await api.get('/health')
  return response.data
}

export async function getCategories() {
  const response = await api.get('/products/categories')
  return response.data
}

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

export async function createProduct(productData) {
  const response = await api.post('/products', productData)
  return response.data
}

export async function updateProduct(productId, productData) {
  const response = await api.put('/products/' + productId, productData)
  return response.data
}

export async function deleteProduct(productId) {
  const response = await api.delete('/products/' + productId)
  return response.data
}
