async function request(path, options = {}) {
  const { headers = {}, ...restOptions } = options

  const response = await fetch(path, {
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    ...restOptions,
  })

  if (response.ok === false) {
    throw new Error('API request failed: ' + response.status)
  }

  return response.json()
}

export function getHealth() {
  return request('/api/health')
}

export function getCategories() {
  return request('/api/products/categories')
}

export function getProducts({ search = '', category = '' } = {}) {
  const params = new URLSearchParams()
  const trimmedSearch = search.trim()
  const trimmedCategory = category.trim()

  if (trimmedSearch) {
    params.set('search', trimmedSearch)
  }

  if (trimmedCategory) {
    params.set('category', trimmedCategory)
  }

  const queryString = params.toString()
  const path = queryString ? '/api/products?' + queryString : '/api/products'

  return request(path)
}

export function createProduct(productData) {
  return request('/api/products', {
    method: 'POST',
    body: JSON.stringify(productData),
  })
}

export function updateProduct(productId, productData) {
  return request('/api/products/' + productId, {
    method: 'PUT',
    body: JSON.stringify(productData),
  })
}

export function deleteProduct(productId) {
  return request('/api/products/' + productId, {
    method: 'DELETE',
  })
}
