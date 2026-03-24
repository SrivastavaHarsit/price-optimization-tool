import { useEffect, useState } from 'react'
import { getHealth } from './api/client'
import ProductPage, { useProductPageController } from './pages/ProductPage'
import PricingPage from './pages/PricingPage'
import './App.css'

function App() {
  // Stores the backend health JSON when the request succeeds.
  const [health, setHealth] = useState(null)

  // Tracks whether the initial backend health request is still in progress.
  const [healthLoading, setHealthLoading] = useState(true)

  // Holds a readable error if the backend health request fails.
  const [healthError, setHealthError] = useState('')

  // Controls whether the user is looking at Product Management or Pricing View.
  const [activeView, setActiveView] = useState('products')

  // The custom hook owns shared product state so App can stay thin.
  const productPageController = useProductPageController()
  const showingProductView = activeView === 'products'

  // Load backend health once when the App component first appears.
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

  // Render the overall app shell: health status, view switching, and the active page.
  return (
    <div className="app-shell">
      <h1>Price Optimization Tool</h1>
      <p>Frontend booted successfully.</p>
      <p>This version keeps App focused on the shell only: health, view switching, and page composition.</p>

      {/* Health section: proves the frontend can talk to the backend. */}
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

      {/* View switch section: lets the user toggle between the two top-level pages. */}
      <section className="status-card">
        <div className="view-switch">
          <button
            type="button"
            className={showingProductView ? 'primary-button' : 'secondary-button'}
            onClick={() => setActiveView('products')}
          >
            Product Management
          </button>
          <button
            type="button"
            className={showingProductView ? 'secondary-button' : 'primary-button'}
            onClick={() => setActiveView('pricing')}
          >
            Pricing View
          </button>
        </div>
      </section>

      {/* Product page uses the shared controller hook directly. */}
      {showingProductView ? <ProductPage controller={productPageController} /> : null}

      {/* Pricing page reuses the same already-loaded product data via props. */}
      {showingProductView === false ? (
        <PricingPage
          products={productPageController.products}
          productsLoading={productPageController.productsLoading}
          productsError={productPageController.productsError}
        />
      ) : null}
    </div>
  )
}

export default App
