import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Pie, Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export function MenuStatsChart({ stats }) {
  // stats: [{ name, totalSold, avgPerDay }, ...]
  const labels = stats.map((s) => s.name);
  const data = {
    labels,
    datasets: [
      {
        label: "Total Sold",
        data: stats.map((s) => s.totalSold),
        backgroundColor: "rgba(54, 162, 235, 0.6)",
      },
      {
        label: "Avg/Day",
        data: stats.map((s) => s.avgPerDay),
        backgroundColor: "rgba(75, 192, 192, 0.6)",
      },
    ],
  };
  const options = {
    responsive: true,
    plugins: { legend: { position: "top" } },
    scales: { x: { ticks: { autoSkip: false } }, y: { beginAtZero: true } },
  };
  return (
    <div className="chart-wrapper">
      <Bar data={data} options={options} />
    </div>
  );
}

export function InventoryChart({ ingredients }) {
  // ingredients: [{ id, name, quantity }, ...]
  const labels = ingredients.map((i) => i.name);
  const data = {
    labels,
    datasets: [
      {
        label: "Quantity",
        data: ingredients.map((i) => i.quantity),
        backgroundColor: labels.map((_, idx) =>
          `hsl(${(idx * 40) % 360} 70% 50% / 0.7)`
        ),
      },
    ],
  };
  const options = { responsive: true, plugins: { legend: { display: false } } };
  return (
    <div className="chart-wrapper">
      <Bar data={data} options={options} />
    </div>
  );
}

export function IngredientAmountChart({ ingredients }) {
  // Show top 6 ingredients in a pie
  const sorted = [...ingredients].sort((a, b) => b.quantity - a.quantity);
  const top = sorted.slice(0, 6);
  const data = {
    labels: top.map((i) => i.name),
    datasets: [
      {
        label: "Amount",
        data: top.map((i) => i.quantity),
        backgroundColor: top.map((_, idx) => `hsl(${(idx * 60) % 360} 70% 50% / 0.8)`),
      },
    ],
  };
  return (
    <div className="chart-wrapper small">
      <Pie data={data} />
    </div>
  );
}

export function XReportCharts({ xReportData }) {
  if (!xReportData) return null;
  // Top items pie and revenue line (if history provided)
  const topItems = xReportData.topItems || [];
  const pieData = {
    labels: topItems.map((it) => it.product_name),
    datasets: [
      {
        data: topItems.map((it) => it.quantity),
        backgroundColor: topItems.map((_, idx) => `hsl(${(idx * 50) % 360} 70% 50% / 0.8)`),
      },
    ],
  };

  const revenueHistory = xReportData.revenueHistory || null; // optional: [{label, value}, ...]
  const lineData = revenueHistory
    ? {
        labels: revenueHistory.map((r) => r.label),
        datasets: [
          {
            label: "Revenue",
            data: revenueHistory.map((r) => r.value),
            borderColor: "rgba(255,99,132,0.8)",
            backgroundColor: "rgba(255,99,132,0.2)",
            tension: 0.3,
          },
        ],
      }
    : null;

  return (
    <div className="xreport-charts">
      <div className="chart-section">
        <h4>Top Items</h4>
        <Pie data={pieData} />
      </div>
      {lineData && (
        <div className="chart-section">
          <h4>Revenue History</h4>
          <Line data={lineData} />
        </div>
      )}
    </div>
  );
}

export function ProductUsageCharts({ productUsageData }) {
  if (!productUsageData) return null;
  const products = productUsageData.productsSold || [];
  const labels = products.map((p) => p.product_name);
  const data = {
    labels,
    datasets: [
      {
        label: "Quantity Sold",
        data: products.map((p) => p.quantity),
        backgroundColor: labels.map((_, idx) => `hsl(${(idx * 50) % 360} 70% 50% / 0.7)`),
      },
    ],
  };
  return (
    <div className="chart-wrapper">
      <Bar data={data} />
    </div>
  );
}
