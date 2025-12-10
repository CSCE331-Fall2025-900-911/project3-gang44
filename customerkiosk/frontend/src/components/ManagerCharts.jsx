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

export function PaymentMethodChart({ cardTotal, cashTotal }) {
  const total = cardTotal + cashTotal;
  const cardPercent = total > 0 ? ((cardTotal / total) * 100).toFixed(1) : 0;
  const cashPercent = total > 0 ? ((cashTotal / total) * 100).toFixed(1) : 0;

  const data = {
    labels: ["Card Payments", "Cash Payments"],
    datasets: [
      {
        data: [cardTotal, cashTotal],
        backgroundColor: [
          "rgba(54, 162, 235, 0.8)", // Blue for card
          "rgba(75, 192, 75, 0.8)", // Green for cash
        ],
        borderColor: [
          "rgba(54, 162, 235, 1)",
          "rgba(75, 192, 75, 1)",
        ],
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: "bottom" },
      tooltip: {
        callbacks: {
          label: function (context) {
            const label = context.label || "";
            const value = context.parsed || 0;
            const percent = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            return `${label}: $${value.toFixed(2)} (${percent}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="chart-wrapper">
      <h3>Payment Method Distribution</h3>
      <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
        <div style={{ flex: 1 }}>
          <Pie data={data} options={options} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "0.95rem" }}>
            <div style={{ marginBottom: "12px" }}>
              <strong style={{ color: "rgba(54, 162, 235, 1)" }}>Card Payments:</strong>
              <br />
              ${cardTotal.toFixed(2)} ({cardPercent}%)
            </div>
            <div>
              <strong style={{ color: "rgba(75, 192, 75, 1)" }}>Cash Payments:</strong>
              <br />
              ${cashTotal.toFixed(2)} ({cashPercent}%)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
