// Small helper used by the table so price fields always display like money.
function formatCurrency(value) {
  return '$' + Number(value).toFixed(2)
}

function ProductTable({ products, onEdit, onDelete, selectedProductIds, onToggleProductSelection }) {
  // Render the product table with one row per product plus action buttons and compare checkboxes.
  return (
    <div className="table-wrapper">
      <table className="product-table">
        <thead>
          <tr>
            <th className="selection-column">Select</th>
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
          {products.map((product) => {
            // The checkbox is controlled by selected IDs stored in ProductPage state.
            const isSelected = selectedProductIds.includes(product.id)

            return (
              <tr key={product.id}>
                <td className="selection-column">
                  <input
                    type="checkbox"
                    className="selection-checkbox"
                    checked={isSelected}
                    onChange={() => onToggleProductSelection(product.id)}
                    aria-label={'Select ' + product.name + ' for demand comparison'}
                  />
                </td>
                <td>{product.id}</td>
                <td>{product.name}</td>
                <td>{product.category}</td>
                <td>{formatCurrency(product.selling_price)}</td>
                <td>{product.stock_available}</td>
                <td>{product.demand_forecast}</td>
                <td>{formatCurrency(product.optimized_price)}</td>
                <td>
                  <div className="table-actions">
                    <button type="button" className="secondary-button small-button" onClick={() => onEdit(product)}>
                      Edit
                    </button>
                    <button type="button" className="danger-button small-button" onClick={() => onDelete(product)}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default ProductTable
