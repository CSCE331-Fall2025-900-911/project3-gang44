import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useApp } from "../context/AppContext";
import "../styles/ManagerPage.css";
import {
  MenuStatsChart,
  InventoryChart,
  IngredientAmountChart,
  XReportCharts,
  ProductUsageCharts,
} from "../components/ManagerCharts";

export default function ManagerPage() {
  const [activeTab, setActiveTab] = useState("menu-stats");
  const [currentTime, setCurrentTime] = useState(new Date());
  const navigate = useNavigate();
  const { t: i18nT } = useTranslation();

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="manager-page">
      <div className="manager-header">
        <div className="header-left">
          <button className="back-button" onClick={() => navigate("/")}>
            ← {i18nT("Back to Landing Page")}
          </button>
          <h1>{i18nT("Manager Dashboard")}</h1>
        </div>
        <div className="header-right">
          <span className="current-time">{formatTime(currentTime)}</span>
        </div>
      </div>

      <div className="manager-tabs">
        <button
          className={`tab-button ${activeTab === "menu-stats" ? "active" : ""}`}
          onClick={() => setActiveTab("menu-stats")}
        >
          {i18nT("Menu Statistics")}
        </button>
        <button
          className={`tab-button ${activeTab === "inventory" ? "active" : ""}`}
          onClick={() => setActiveTab("inventory")}
        >
          {i18nT("Inventory")}
        </button>
        <button
          className={`tab-button ${activeTab === "products" ? "active" : ""}`}
          onClick={() => setActiveTab("products")}
        >
          {i18nT("Manage Products")}
        </button>
        <button
          className={`tab-button ${
            activeTab === "ingredients" ? "active" : ""
          }`}
          onClick={() => setActiveTab("ingredients")}
        >
          {i18nT("Manage Ingredients")}
        </button>
        <button
          className={`tab-button ${activeTab === "employees" ? "active" : ""}`}
          onClick={() => setActiveTab("employees")}
        >
          {i18nT("Manage Employees")}
        </button>
        <button
          className={`tab-button ${activeTab === "reports" ? "active" : ""}`}
          onClick={() => setActiveTab("reports")}
        >
          {i18nT("Reports")}
        </button>
      </div>

      <div className="manager-content">
        {activeTab === "menu-stats" && <MenuStatsTab />}
        {activeTab === "inventory" && <InventoryTab />}
        {activeTab === "products" && <ProductsTab />}
        {activeTab === "ingredients" && <IngredientsTab />}
        {activeTab === "employees" && <EmployeesTab />}
        {activeTab === "reports" && <ReportsTab />}
      </div>
    </div>
  );
}

// Menu Statistics Tab
function MenuStatsTab() {
  const { t: i18nT } = useTranslation();
  const { t } = useApp(); // For translating product names
  const [stats, setStats] = useState([]);
  const [period, setPeriod] = useState("day");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [period]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL
        }/api/manager/menu-stats?period=${period}`
      );
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error("Error fetching menu stats:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tab-content">
      <h2>{i18nT("Menu Statistics")}</h2>
      <div className="period-buttons">
        <button
          className={period === "day" ? "active" : ""}
          onClick={() => setPeriod("day")}
        >
          {i18nT("Day")}
        </button>
        <button
          className={period === "week" ? "active" : ""}
          onClick={() => setPeriod("week")}
        >
          {i18nT("Week")}
        </button>
        <button
          className={period === "month" ? "active" : ""}
          onClick={() => setPeriod("month")}
        >
          {i18nT("Month")}
        </button>
      </div>
      {loading ? (
        <div className="loading">{i18nT("Loading statistics...")}</div>
      ) : (
        <>
          <MenuStatsChart stats={stats} />
          <table className="stats-table">
            <thead>
              <tr>
                <th>{i18nT("Item")}</th>
                <th>
                  {i18nT("Sales")} {" "}
                  {period === "day"
                    ? i18nT("Today")
                    : i18nT("This {period}", {
                        period: i18nT(period === "week" ? "Week" : "Month"),
                      })}
                </th>
                <th>{i18nT("Sold/Day")}</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((item, index) => (
                <tr key={index}>
                  <td>{t(item.name)}</td>
                  <td>{item.totalSold}</td>
                  <td>{item.avgPerDay}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

// Inventory Tab
function InventoryTab() {
  const { t: i18nT } = useTranslation();
  const { t } = useApp(); // For translating ingredient names
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIngredients();
  }, []);

  const fetchIngredients = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/manager/ingredients`
      );
      const data = await response.json();
      setIngredients(data);
    } catch (err) {
      console.error("Error fetching ingredients:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tab-content">
      <h2>{i18nT("Current Inventory")}</h2>
      {loading ? (
        <div className="loading">{i18nT("Loading inventory...")}</div>
      ) : (
        <>
          <InventoryChart ingredients={ingredients} />
          <table className="inventory-table">
          <thead>
            <tr>
              <th>{i18nT("Item")}</th>
              <th>{i18nT("Amount")}</th>
              <th>{i18nT("Status")}</th>
            </tr>
          </thead>
          <tbody>
            {ingredients.map((item) => (
              <tr
                key={item.id}
                className={item.quantity < 10 ? "low-stock" : ""}
              >
                <td>{t(item.name)}</td>
                <td>{item.quantity}</td>
                <td>
                  {item.quantity < 10 ? (
                    <span className="status-low">{i18nT("Low Stock")}</span>
                  ) : (
                    <span className="status-ok">{i18nT("OK")}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          </table>
        </>
      )}
    </div>
  );
}

// Products Management Tab
function ProductsTab() {
  const { t: i18nT } = useTranslation();
  const { t } = useApp(); // For translating product names
  const [products, setProducts] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchIngredients();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/manager/products`
      );
      const data = await response.json();
      setProducts(data);
    } catch (err) {
      console.error("Error fetching products:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchIngredients = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/manager/ingredients`
      );
      const data = await response.json();
      setIngredients(data);
    } catch (err) {
      console.error("Error fetching ingredients:", err);
    }
  };

  const handleAdd = async (formData) => {
    try {
      const productResponse = await fetch(
        `${import.meta.env.VITE_API_URL}/api/manager/products`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            category: formData.category,
            price: formData.price,
          }),
        }
      );
      const newProduct = await productResponse.json();

      // If ingredients were specified, save them
      if (formData.ingredients && formData.ingredients.length > 0) {
        await fetch(
          `${import.meta.env.VITE_API_URL}/api/manager/products/${
            newProduct.id
          }/ingredients`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ingredients: formData.ingredients }),
          }
        );
      }

      fetchProducts();
      setShowAddForm(false);
    } catch (err) {
      console.error("Error adding product:", err);
      alert(i18nT("Failed to add product"));
    }
  };

  const handleUpdate = async (id, formData) => {
    try {
      // Update basic product info
      await fetch(
        `${import.meta.env.VITE_API_URL}/api/manager/products/${id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            category: formData.category,
            price: formData.price,
          }),
        }
      );

      // Update ingredients if provided
      if (formData.ingredients !== undefined) {
        await fetch(
          `${import.meta.env.VITE_API_URL}/api/manager/products/${id}/ingredients`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ingredients: formData.ingredients }),
          }
        );
      }

      fetchProducts();
      setEditingProduct(null);
    } catch (err) {
      console.error("Error updating product:", err);
      alert(i18nT("Failed to update product"));
    }
  };

  const handleDelete = async (id) => {
    if (!confirm(i18nT("Are you sure you want to delete this product?")))
      return;

    try {
      await fetch(
        `${import.meta.env.VITE_API_URL}/api/manager/products/${id}`,
        {
          method: "DELETE",
        }
      );
      fetchProducts();
    } catch (err) {
      console.error("Error deleting product:", err);
      alert(i18nT("Failed to delete product"));
    }
  };

  return (
    <div className="tab-content">
      <div className="tab-header">
        <h2>{i18nT("Manage Products")}</h2>
        <button className="add-button" onClick={() => setShowAddForm(true)}>
          + {i18nT("Add Product")}
        </button>
      </div>

      {showAddForm && (
        <ProductForm
          onSubmit={handleAdd}
          onCancel={() => setShowAddForm(false)}
          availableIngredients={ingredients}
        />
      )}

      {loading ? (
        <div className="loading">{i18nT("Loading products...")}</div>
      ) : (
        <table className="management-table">
          <thead>
            <tr>
              <th>{i18nT("ID")}</th>
              <th>{i18nT("Name")}</th>
              <th>{i18nT("Category")}</th>
              <th>{i18nT("Price")}</th>
              <th>{i18nT("Actions")}</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                {editingProduct?.id === product.id ? (
                  <ProductFormRow
                    product={product}
                    onSave={(data) => handleUpdate(product.id, data)}
                    onCancel={() => setEditingProduct(null)}
                    availableIngredients={ingredients}
                  />
                ) : (
                  <>
                    <td>{product.id}</td>
                    <td>{t(product.name)}</td>
                    <td>{t(product.category)}</td>
                    <td>${parseFloat(product.price).toFixed(2)}</td>
                    <td>
                      <button
                        className="edit-btn"
                        onClick={() => setEditingProduct(product)}
                      >
                        {i18nT("Edit")}
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => handleDelete(product.id)}
                      >
                        {i18nT("Delete")}
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function ProductForm({ onSubmit, onCancel, availableIngredients }) {
  const { t: i18nT } = useTranslation();
  const { t } = useApp();
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    price: "",
    ingredients: [],
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleIngredientToggle = (ingredientId) => {
    setFormData((prev) => {
      const exists = prev.ingredients.find(
        (ing) => ing.ingredient_id === ingredientId
      );
      if (exists) {
        return {
          ...prev,
          ingredients: prev.ingredients.filter(
            (ing) => ing.ingredient_id !== ingredientId
          ),
        };
      } else {
        return {
          ...prev,
          ingredients: [
            ...prev.ingredients,
            { ingredient_id: ingredientId, quantity_needed: 1 },
          ],
        };
      }
    });
  };

  const handleQuantityChange = (ingredientId, quantity) => {
    setFormData((prev) => ({
      ...prev,
      ingredients: prev.ingredients.map((ing) =>
        ing.ingredient_id === ingredientId
          ? { ...ing, quantity_needed: parseFloat(quantity) || 1 }
          : ing
      ),
    }));
  };

  return (
    <div className="product-form-container">
      <form className="inline-form" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
        <input
          type="text"
          placeholder="Category"
          value={formData.category}
          onChange={(e) =>
            setFormData({ ...formData, category: e.target.value })
          }
          required
        />
        <input
          type="number"
          step="0.01"
          placeholder="Price"
          value={formData.price}
          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
          required
        />

        <div className="ingredients-section">
          <h4>{i18nT("Required Ingredients")}</h4>
          <div className="ingredients-grid">
            {availableIngredients.map((ingredient) => {
              const selected = formData.ingredients.find(
                (ing) => ing.ingredient_id === ingredient.id
              );
              return (
                <div key={ingredient.id} className="ingredient-item">
                  <label>
                    <input
                      type="checkbox"
                      checked={!!selected}
                      onChange={() => handleIngredientToggle(ingredient.id)}
                    />
                    {t(ingredient.name)}
                  </label>
                  {selected && (
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={selected.quantity_needed}
                      onChange={(e) =>
                        handleQuantityChange(ingredient.id, e.target.value)
                      }
                      placeholder="Qty"
                      className="quantity-input"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="form-actions">
          <button type="submit">{i18nT("Add")}</button>
          <button type="button" onClick={onCancel}>
            {i18nT("Cancel")}
          </button>
        </div>
      </form>
    </div>
  );
}

function ProductFormRow({ product, onSave, onCancel, availableIngredients }) {
  const { t: i18nT } = useTranslation();
  const { t } = useApp();
  const [formData, setFormData] = useState({
    name: product.name,
    category: product.category,
    price: product.price,
    ingredients: [],
  });
  const [showIngredients, setShowIngredients] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProductIngredients();
  }, []);

  const fetchProductIngredients = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/manager/products/${
          product.id
        }/ingredients`
      );
      const data = await response.json();
      setFormData((prev) => ({ ...prev, ingredients: data }));
    } catch (err) {
      console.error("Error fetching product ingredients:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleIngredientToggle = (ingredientId) => {
    setFormData((prev) => {
      const exists = prev.ingredients.find(
        (ing) => ing.ingredient_id === ingredientId
      );
      if (exists) {
        return {
          ...prev,
          ingredients: prev.ingredients.filter(
            (ing) => ing.ingredient_id !== ingredientId
          ),
        };
      } else {
        return {
          ...prev,
          ingredients: [
            ...prev.ingredients,
            { ingredient_id: ingredientId, quantity_needed: 1 },
          ],
        };
      }
    });
  };

  const handleQuantityChange = (ingredientId, quantity) => {
    setFormData((prev) => ({
      ...prev,
      ingredients: prev.ingredients.map((ing) =>
        ing.ingredient_id === ingredientId
          ? { ...ing, quantity_needed: parseFloat(quantity) || 1 }
          : ing
      ),
    }));
  };

  return (
    <>
      <td colSpan="5">
        <div className="edit-product-form">
          <div className="basic-info">
            <div className="form-field">
              <label>{i18nT("ID")}</label>
              <span>{product.id}</span>
            </div>
            <div className="form-field">
              <label>{i18nT("Name")}</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div className="form-field">
              <label>{i18nT("Category")}</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
              />
            </div>
            <div className="form-field">
              <label>{i18nT("Price")}</label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
              />
            </div>
          </div>

          <div className="ingredients-toggle">
            <button
              type="button"
              onClick={() => setShowIngredients(!showIngredients)}
              className="toggle-ingredients-btn"
            >
              {showIngredients
                ? `▼ ${i18nT("Hide Ingredients")}`
                : `▶ ${i18nT("Edit Ingredients")} (${
                    formData.ingredients.length
                  })`}
            </button>
          </div>

          {showIngredients && (
            <div className="ingredients-section">
              <h4>{i18nT("Required Ingredients")}</h4>
              {loading ? (
                <div>{i18nT("Loading...")}</div>
              ) : (
                <div className="ingredients-grid">
                  {availableIngredients.map((ingredient) => {
                    const selected = formData.ingredients.find(
                      (ing) => ing.ingredient_id === ingredient.id
                    );
                    return (
                      <div key={ingredient.id} className="ingredient-item">
                        <label>
                          <input
                            type="checkbox"
                            checked={!!selected}
                            onChange={() =>
                              handleIngredientToggle(ingredient.id)
                            }
                          />
                          {t(ingredient.name)}
                        </label>
                        {selected && (
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={selected.quantity_needed}
                            onChange={(e) =>
                              handleQuantityChange(ingredient.id, e.target.value)
                            }
                            placeholder="Qty"
                            className="quantity-input"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div className="form-actions">
            <button className="save-btn" onClick={() => onSave(formData)}>
              {i18nT("Save")}
            </button>
            <button className="cancel-btn" onClick={onCancel}>
              {i18nT("Cancel")}
            </button>
          </div>
        </div>
      </td>
    </>
  );
}

// Ingredients Management Tab
function IngredientsTab() {
  const { t: i18nT } = useTranslation();
  const { t } = useApp(); // For translating ingredient names
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingIngredient, setEditingIngredient] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    fetchIngredients();
  }, []);

  const fetchIngredients = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/manager/ingredients`
      );
      const data = await response.json();
      setIngredients(data);
    } catch (err) {
      console.error("Error fetching ingredients:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (formData) => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/manager/ingredients`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      fetchIngredients();
      setShowAddForm(false);
    } catch (err) {
      console.error("Error adding ingredient:", err);
      alert(i18nT("Failed to add ingredient"));
    }
  };

  const handleUpdate = async (id, formData) => {
    try {
      await fetch(
        `${import.meta.env.VITE_API_URL}/api/manager/ingredients/${id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }
      );
      fetchIngredients();
      setEditingIngredient(null);
    } catch (err) {
      console.error("Error updating ingredient:", err);
      alert(i18nT("Failed to update ingredient"));
    }
  };

  const handleDelete = async (id) => {
    if (!confirm(i18nT("Are you sure you want to delete this ingredient?")))
      return;

    try {
      await fetch(
        `${import.meta.env.VITE_API_URL}/api/manager/ingredients/${id}`,
        {
          method: "DELETE",
        }
      );
      fetchIngredients();
    } catch (err) {
      console.error("Error deleting ingredient:", err);
      alert(i18nT("Failed to delete ingredient"));
    }
  };

  return (
    <div className="tab-content">
      <div className="tab-header">
        <h2>{i18nT("Manage Ingredients")}</h2>
        <button className="add-button" onClick={() => setShowAddForm(true)}>
          + {i18nT("Add Ingredient")}
        </button>
      </div>

      {showAddForm && (
        <IngredientForm
          onSubmit={handleAdd}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {loading ? (
        <div className="loading">{i18nT("Loading ingredients...")}</div>
      ) : (
        <>
          <IngredientAmountChart ingredients={ingredients} />
          <table className="management-table">
          <thead>
            <tr>
              <th>{i18nT("ID")}</th>
              <th>{i18nT("Name")}</th>
              <th>{i18nT("Category")}</th>
              <th>{i18nT("Price")}</th>
              <th>{i18nT("Quantity")}</th>
              <th>{i18nT("Actions")}</th>
            </tr>
          </thead>
          <tbody>
            {ingredients.map((ingredient) => (
              <tr key={ingredient.id}>
                {editingIngredient?.id === ingredient.id ? (
                  <IngredientFormRow
                    ingredient={ingredient}
                    onSave={(data) => handleUpdate(ingredient.id, data)}
                    onCancel={() => setEditingIngredient(null)}
                  />
                ) : (
                  <>
                    <td>{ingredient.id}</td>
                    <td>{t(ingredient.name)}</td>
                    <td>{t(ingredient.category)}</td>
                    <td>${parseFloat(ingredient.price).toFixed(2)}</td>
                    <td>{ingredient.quantity}</td>
                    <td>
                      <button
                        className="edit-btn"
                        onClick={() => setEditingIngredient(ingredient)}
                      >
                        {i18nT("Edit")}
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => handleDelete(ingredient.id)}
                      >
                        {i18nT("Delete")}
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        </>
      )}
    </div>
  );
}

function IngredientForm({ onSubmit, onCancel }) {
  const { t: i18nT } = useTranslation();
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    price: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form className="inline-form" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        required
      />
      <input
        type="text"
        placeholder="Category"
        value={formData.category}
        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
        required
      />
      <input
        type="number"
        step="0.01"
        placeholder="Price"
        value={formData.price}
        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
        required
      />
      <button type="submit">{i18nT("Add")}</button>
      <button type="button" onClick={onCancel}>
        {i18nT("Cancel")}
      </button>
    </form>
  );
}

function IngredientFormRow({ ingredient, onSave, onCancel }) {
  const { t: i18nT } = useTranslation();
  const [formData, setFormData] = useState({
    price: ingredient.price,
    quantity: ingredient.quantity,
  });

  return (
    <>
      <td>{ingredient.id}</td>
      <td>{ingredient.name}</td>
      <td>{ingredient.category}</td>
      <td>
        <input
          type="number"
          step="0.01"
          value={formData.price}
          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
        />
      </td>
      <td>
        <input
          type="number"
          value={formData.quantity}
          onChange={(e) =>
            setFormData({ ...formData, quantity: e.target.value })
          }
        />
      </td>
      <td>
        <button className="save-btn" onClick={() => onSave(formData)}>
          {i18nT("Save")}
        </button>
        <button className="cancel-btn" onClick={onCancel}>
          {i18nT("Cancel")}
        </button>
      </td>
    </>
  );
}

// Employees Management Tab
function EmployeesTab() {
  const { t: i18nT } = useTranslation();
  const { t } = useApp(); // For translating employee roles
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/manager/employees`
      );
      const data = await response.json();
      setEmployees(data);
    } catch (err) {
      console.error("Error fetching employees:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (formData) => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/manager/employees`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      fetchEmployees();
      setShowAddForm(false);
    } catch (err) {
      console.error("Error adding employee:", err);
      alert(i18nT("Failed to add employee"));
    }
  };

  const handleUpdate = async (id, formData) => {
    try {
      await fetch(
        `${import.meta.env.VITE_API_URL}/api/manager/employees/${id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }
      );
      fetchEmployees();
      setEditingEmployee(null);
    } catch (err) {
      console.error("Error updating employee:", err);
      alert(i18nT("Failed to update employee"));
    }
  };

  const handleDelete = async (id) => {
    if (!confirm(i18nT("Are you sure you want to delete this employee?")))
      return;

    try {
      await fetch(
        `${import.meta.env.VITE_API_URL}/api/manager/employees/${id}`,
        {
          method: "DELETE",
        }
      );
      fetchEmployees();
    } catch (err) {
      console.error("Error deleting employee:", err);
      alert(i18nT("Failed to delete employee"));
    }
  };

  return (
    <div className="tab-content">
      <div className="tab-header">
        <h2>{i18nT("Manage Employees")}</h2>
        <button className="add-button" onClick={() => setShowAddForm(true)}>
          + {i18nT("Add Employee")}
        </button>
      </div>

      {showAddForm && (
        <EmployeeForm
          onSubmit={handleAdd}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {loading ? (
        <div className="loading">{i18nT("Loading employees...")}</div>
      ) : (
        <table className="management-table">
          <thead>
            <tr>
              <th>{i18nT("ID")}</th>
              <th>{i18nT("Name")}</th>
              <th>{i18nT("Role")}</th>
              <th>{i18nT("Wage")}</th>
              <th>{i18nT("Actions")}</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((employee) => (
              <tr key={employee.id}>
                {editingEmployee?.id === employee.id ? (
                  <EmployeeFormRow
                    employee={employee}
                    onSave={(data) => handleUpdate(employee.id, data)}
                    onCancel={() => setEditingEmployee(null)}
                  />
                ) : (
                  <>
                    <td>{employee.id}</td>
                    <td>{employee.name}</td>
                    <td>{t(employee.role)}</td>
                    <td>${parseFloat(employee.salary).toFixed(2)}/hr</td>
                    <td>
                      <button
                        className="edit-btn"
                        onClick={() => setEditingEmployee(employee)}
                      >
                        {i18nT("Edit")}
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => handleDelete(employee.id)}
                      >
                        {i18nT("Delete")}
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function EmployeeForm({ onSubmit, onCancel }) {
  const { t: i18nT } = useTranslation();
  const [formData, setFormData] = useState({ name: "", role: "", salary: "" });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form className="inline-form" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        required
      />
      <input
        type="text"
        placeholder="Role"
        value={formData.role}
        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
        required
      />
      <input
        type="number"
        step="0.01"
        placeholder="Wage"
        value={formData.salary}
        onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
        required
      />
      <button type="submit">{i18nT("Add")}</button>
      <button type="button" onClick={onCancel}>
        {i18nT("Cancel")}
      </button>
    </form>
  );
}

function EmployeeFormRow({ employee, onSave, onCancel }) {
  const { t: i18nT } = useTranslation();
  const [formData, setFormData] = useState({
    name: employee.name,
    role: employee.role,
    salary: employee.salary,
  });

  return (
    <>
      <td>{employee.id}</td>
      <td>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
      </td>
      <td>
        <input
          type="text"
          value={formData.role}
          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
        />
      </td>
      <td>
        <input
          type="number"
          step="0.01"
          value={formData.salary}
          onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
        />
      </td>
      <td>
        <button className="save-btn" onClick={() => onSave(formData)}>
          {i18nT("Save")}
        </button>
        <button className="cancel-btn" onClick={onCancel}>
          {i18nT("Cancel")}
        </button>
      </td>
    </>
  );
}

// Reports Tab
function ReportsTab() {
  const { t: i18nT } = useTranslation();
  const { t } = useApp(); // For translating product/ingredient names
  const [xReportData, setXReportData] = useState(null);
  const [productUsageData, setProductUsageData] = useState(null);
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const generateXReport = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/manager/reports/x-report`
      );
      const data = await response.json();
      setXReportData(data);
    } catch (err) {
      console.error("Error generating X-report:", err);
      alert(i18nT("Failed to generate X-report"));
    }
  };

  const generateProductUsage = async () => {
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL
        }/api/manager/reports/product-usage?startDate=${startDate}&endDate=${endDate}`
      );
      const data = await response.json();
      setProductUsageData(data);
    } catch (err) {
      console.error("Error generating product usage report:", err);
      alert(i18nT("Failed to generate product usage report"));
    }
  };

  return (
    <div className="tab-content">
      <h2>{i18nT("Reports")}</h2>

      <div className="report-section">
        <h3>{i18nT("X-Report (Today's Activity)")}</h3>
        <button className="generate-report-btn" onClick={generateXReport}>
          {i18nT("Generate X-Report")}
        </button>

        {xReportData && (
          <div className="report-display">
            <h4>{i18nT("Sales Summary")}</h4>
            <p>
              {i18nT("Total Orders")}: {xReportData.totalOrders}
            </p>
            <p>
              {i18nT("Total Items Sold")}: {xReportData.totalItems}
            </p>
            <p>
              {i18nT("Total Revenue")}: ${xReportData.totalRevenue.toFixed(2)}
            </p>

            <h4>{i18nT("Top Selling Items")}</h4>
            <ul>
              {xReportData.topItems.map((item, index) => (
                <li key={index}>
                  {t(item.product_name)}: {item.quantity} {i18nT("Quantity")}
                </li>
              ))}
            </ul>

            <h4>{i18nT("Low Stock Items")}</h4>
            {xReportData.lowStock.length === 0 ? (
              <p>{i18nT("All stock levels are sufficient.")}</p>
            ) : (
              <ul>
                {xReportData.lowStock.map((item, index) => (
                  <li key={index}>
                    {item.name}: {item.quantity} {i18nT("Quantity")}
                  </li>
                ))}
              </ul>
            )}

            <h4>{i18nT("Employee Statistics")}</h4>
            <p>
              {i18nT("Total Employees")}: {xReportData.employeeCount}
            </p>
            <p>
              {i18nT("Average Wage")}: ${xReportData.avgWage.toFixed(2)}/hr
            </p>

            {/* Charts for X-Report */}
            <XReportCharts xReportData={xReportData} />
          </div>
        )}
      </div>

      <div className="report-section">
        <h3>{i18nT("Product Usage Report")}</h3>
        <div className="date-range">
          <label>
            {i18nT("Start Date")}:
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </label>
          <label>
            {i18nT("End Date")}:
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </label>
          <button
            className="generate-report-btn"
            onClick={generateProductUsage}
          >
            {i18nT("Generate Report")}
          </button>
        </div>

        {productUsageData && (
          <div className="report-display">
            <h4>
              {i18nT("Products Sold")} ({productUsageData.startDate} to{" "}
              {productUsageData.endDate})
            </h4>
            <ProductUsageCharts productUsageData={productUsageData} />
            <table className="report-table">
              <thead>
                <tr>
                  <th>{i18nT("Product")}</th>
                  <th>{i18nT("Quantity")}</th>
                </tr>
              </thead>
              <tbody>
                {productUsageData.productsSold.map((item, index) => (
                  <tr key={index}>
                    <td>{t(item.product_name)}</td>
                    <td>{item.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h4>{i18nT("Ingredients Used")}</h4>
            <table className="report-table">
              <thead>
                <tr>
                  <th>{i18nT("Ingredient")}</th>
                  <th>{i18nT("Quantity Used")}</th>
                </tr>
              </thead>
              <tbody>
                {productUsageData.ingredientsUsed.map((item, index) => (
                  <tr key={index}>
                    <td>{t(item.name)}</td>
                    <td>{item.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h4>{i18nT("Summary")}</h4>
            <p>
              {i18nT("Total Products Sold")}: {productUsageData.totalProducts}
            </p>
            <p>
              {i18nT("Total Ingredient Units Used")}:{" "}
              {productUsageData.totalIngredients}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
