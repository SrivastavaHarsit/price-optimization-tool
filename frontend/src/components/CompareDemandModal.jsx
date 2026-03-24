import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

// The compare modal uses a line chart, so it needs line-specific Chart.js pieces.
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

// Reuse the same money formatter used in table views.
function formatCurrency(value) {
  return '$' + Number(value).toFixed(2)
}

function CompareDemandModal({ isOpen, products, onClose }) {
  // When the modal is closed, render nothing.
  if (isOpen === false) {
    return null
  }

  // Safety guard: if nothing is selected, there is nothing to compare.
  if (products.length === 0) {
    return null
  }

  // Product names become the x-axis labels.
  const labels = products.map((product) => product.name)

  // Two lines are drawn: demand forecast and selling price.
  const data = {
    labels,
    datasets: [
      {
        label: 'Demand Forecast',
        data: products.map((product) => product.demand_forecast),
        borderColor: '#7c3aed',
        backgroundColor: 'rgba(124, 58, 237, 0.18)',
        tension: 0.35,
        fill: false,
      },
      {
        label: 'Selling Price',
        data: products.map((product) => product.selling_price),
        borderColor: '#14b8a6',
        backgroundColor: 'rgba(20, 184, 166, 0.18)',
        tension: 0.35,
        fill: false,
      },
    ],
  }

  // Modal compare chart keeps its own title and legend placement.
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
      title: {
        display: true,
        text: 'Selected Products: Demand Forecast vs Selling Price',
      },
    },
  }

  // Render the compare modal with a line chart on top and a read-only summary table below.
  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="compare-demand-title">
      <div className="modal-card compare-modal-card">
        <div className="modal-header">
          <h2 id="compare-demand-title">Compare Demand Forecast</h2>
          <button type="button" className="secondary-button" onClick={onClose}>
            Close
          </button>
        </div>

        <p className="search-helper">
          This compare view uses only the products currently selected in the table.
        </p>

        <div className="chart-container compare-chart-container">
          <Line data={data} options={options} />
        </div>

        <div className="table-wrapper">
          <table className="product-table compare-table">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Category</th>
                <th>Cost Price</th>
                <th>Selling Price</th>
                <th>Available Stock</th>
                <th>Units Sold</th>
                <th>Demand Forecast</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>{product.name}</td>
                  <td>{product.category}</td>
                  <td>{formatCurrency(product.cost_price)}</td>
                  <td>{formatCurrency(product.selling_price)}</td>
                  <td>{product.stock_available}</td>
                  <td>{product.units_sold}</td>
                  <td className="compare-forecast-cell">{product.demand_forecast}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="modal-actions">
          <button type="button" className="secondary-button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default CompareDemandModal
