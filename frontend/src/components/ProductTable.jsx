function formatCurrency(value) {
  return '$' + Number(value).toFixed(2)
}

function ProductTable({ products, onEdit }) {
  return (
    <div className="table-wrapper">
      <table className="product-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Category</th>
            <th>Selling Price</th>
            <th>Stock</th>
            <th>Demand Forecast</th>
            <th>Optimized Price</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id}>
              <td>{product.id}</td>
              <td>{product.name}</td>
              <td>{product.category}</td>
              <td>{formatCurrency(product.selling_price)}</td>
              <td>{product.stock_available}</td>
              <td>{product.demand_forecast}</td>
              <td>{formatCurrency(product.optimized_price)}</td>
              <td>
                <button type="button" className="secondary-button small-button" onClick={() => onEdit(product)}>
                  Edit
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default ProductTable
