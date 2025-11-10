import { useState } from "react";
import "./style.css";

export default function App() {
  const [textSize, setTextSize] = useState(1);

  const items = [
    "Menu Item #1","Menu Item #5","Menu Item #9",
    "Menu Item #2","Menu Items #6","Menu Item #10",
    "Menu Item #3","Menu Item #7","Menu Item #11",
    "Menu Item #4","Menu Item #8","Menu Item #12",
  ];

  return (
    <div className="page" style={{ fontSize: `${textSize}em` }}>
      <div className="container-grid">
        {/* Header row */}
        <button className="btn purple header-left"
          onClick={() => alert("Language options coming soon!")}>
          Select Language<br/>Seleccionar Idioma
        </button>

        <div className="menu-title">Menu Items</div>

        <button className="btn purple header-right"
          onClick={() => alert("Manager view coming soon!")}>
          Manager View
        </button>

        {/* Sidebar */}
        <aside className="sidebar">
          <p>Change Text Size</p>
          <div className="size-controls">
            <button className="circle-btn" aria-label="Increase text size"
              onClick={() => setTextSize(t => +(t + 0.1).toFixed(2))}>+</button>
            <button className="circle-btn" aria-label="Decrease text size"
              onClick={() => setTextSize(t => Math.max(0.8, +(t - 0.1).toFixed(2)))}>−</button>
          </div>
        </aside>

        {/* Grid of menu items */}
        <main className="menu-grid">
          {items.map((label, i) => (
            <button key={i} className="menu-item"
              onClick={() => alert(`${label} selected`)}>
              {label}
            </button>
          ))}
        </main>

        {/* Bottom left */}
        <button className="btn purple bottom-left"
          onClick={() => alert("Screen reader mode coming soon!")}>
          Enable Screen<br/>Reader
        </button>

        {/* Bottom right */}
        <button className="btn green place-order"
          onClick={() => alert("Order placed!")}>
          Place Order
        </button>
      </div>
    </div>
  );
}
