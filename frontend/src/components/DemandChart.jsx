import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

function DemandChart({ products }) {
  if (products.length === 0) {
    return <p>No products available for charting.</p>
  }

  const labels = products.map((product) => product.name)

  const data = {
    labels,
    datasets: [
      {
        label: 'Demand Forecast',
        data: products.map((product) => product.demand_forecast),
        backgroundColor: 'rgba(37, 99, 235, 0.7)',
      },
      {
        label: 'Selling Price',
        data: products.map((product) => product.selling_price),
        backgroundColor: 'rgba(16, 185, 129, 0.7)',
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Product-wise Demand Forecast vs Selling Price',
      },
    },
  }

  return (
    <div className="chart-container">
      <Bar data={data} options={options} />
    </div>
  )
}

export default DemandChart
