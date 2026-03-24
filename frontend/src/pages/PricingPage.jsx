// Money formatting helper for the pricing table.
function formatCurrency(value) {
  return '$' + Number(value).toFixed(2)
}

function PricingPage({ products, productsLoading, productsError }) {
  // Early return for loading state so the user sees feedback immediately.
  if (productsLoading) {
    return (
      <section className="status-card">
        <h2>Pricing Optimization</h2>
        <p>Loading pricing view...</p>
      </section>
    )
  }

  // Early return for error state so we do not try to render a broken table.
  if (productsError) {
    return (
      <section className="status-card">
        <h2>Pricing Optimization</h2>
        <p className="status-error">{productsError}</p>
      </section>
    )
  }

  // Render the read-only pricing table using the product data passed in by App.jsx.
  return (
    <section className="status-card">
      <h2>Pricing Optimization</h2>
      <p>This is a read-only pricing view using the precomputed optimized prices from the backend.</p>

      <div className="table-wrapper">
        <table className="product-table pricing-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Selling Price</th>
              <th>Optimized Price</th>
              <th>Price Gap</th>
              <th>Demand Forecast</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              // Price gap helps the user see how far optimized price is from the current price.
              const priceGap = Number(product.optimized_price) - Number(product.selling_price)
              const priceGapLabel = (priceGap >= 0 ? '+' : '') + priceGap.toFixed(2)

              return (
                <tr key={product.id}>
                  <td>{product.name}</td>
                  <td>{product.category}</td>
                  <td>{formatCurrency(product.selling_price)}</td>
                  <td className="optimized-price-cell">{formatCurrency(product.optimized_price)}</td>
                  <td>{priceGapLabel}</td>
                  <td>{product.demand_forecast}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default PricingPage
