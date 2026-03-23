import { useEffect, useState } from 'react'
import { getHealth } from './api/client'
import ProductPage, { useProductPageController } from './pages/ProductPage'
import PricingPage from './pages/PricingPage'
import './App.css'

function App() {
  const [health, setHealth] = useState(null)
  const [healthLoading, setHealthLoading] = useState(true)
  const [healthError, setHealthError] = useState('')
  const [activeView, setActiveView] = useState('products')

  const productPageController = useProductPageController()
  const showingProductView = activeView === 'products'

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

  return (
    <div className="app-shell">
      <h1>Price Optimization Tool</h1>
      <p>Frontend booted successfully.</p>
      <p>This version keeps App focused on the shell only: health, view switching, and page composition.</p>

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

      {showingProductView ? <ProductPage controller={productPageController} /> : null}

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
