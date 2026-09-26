/* =========================================================
   STOCKSENSE — APPLICATION
   Vanilla JS single-page app. No build step required.
   ========================================================= */

/* ---------- global state ---------- */

const state = {
  currentPage: "dashboard",
  products: [],
  dashboard: null,
  ledger: [],
};

const LOCATIONS = {
  1: "Main Warehouse",
  2: "Secondary Warehouse",
};

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: "▣", eyebrow: "OVERVIEW" },
  { id: "products", label: "Products", icon: "▤", eyebrow: "CATALOG" },
  { id: "receipts", label: "Receipts", icon: "↓", eyebrow: "STOCK IN" },
  { id: "deliveries", label: "Deliveries", icon: "↑", eyebrow: "STOCK OUT" },
  { id: "adjustments", label: "Adjustments", icon: "✓", eyebrow: "STOCK FIX" },
  { id: "transfers", label: "Transfers", icon: "⇄", eyebrow: "INTERNAL" },
  { id: "ledger", label: "Stock Ledger", icon: "☷", eyebrow: "HISTORY" },
];

/* ---------- elements ---------- */

const pageRoot = document.getElementById("pageRoot");
const navigation = document.getElementById("navigation");
const sidebar = document.getElementById("sidebar");
const toastStack = document.getElementById("toastStack");

/* =========================================================
   UTILITIES
   ========================================================= */

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function getStockStatus(product) {
  const qty = Number(product.quantity ?? 0);
  const reorder = Number(product.reorder_level ?? 0);
  if (qty <= 0) return { label: "Out of Stock", cls: "out" };
  if (qty <= reorder) return { label: "Low Stock", cls: "low" };
  return { label: "In Stock", cls: "healthy" };
}

function movementBadge(type) {
  const map = {
    RECEIPT: { cls: "receipt", label: "Receipt", icon: "↓" },
    DELIVERY: { cls: "delivery", label: "Delivery", icon: "↑" },
    TRANSFER: { cls: "transfer", label: "Transfer", icon: "⇄" },
    ADJUSTMENT: { cls: "adjustment", label: "Adjustment", icon: "✓" },
  };
  return map[type] || { cls: "adjustment", label: type || "—", icon: "•" };
}

function loadingHTML(message = "Loading…") {
  return `<div class="loading-state"><div class="spinner"></div><p>${escapeHtml(message)}</p></div>`;
}

function emptyHTML(icon, title, subtitle) {
  return `<div class="empty-state"><div class="icon">${icon}</div><strong>${escapeHtml(title)}</strong><p>${escapeHtml(subtitle || "")}</p></div>`;
}

function errorHTML(err) {
  return `<div class="empty-state"><div class="icon">⚠</div><strong>Something went wrong</strong><p>${escapeHtml(err.message || "Unknown error")}</p></div>`;
}

function showToast(message, type = "success") {
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.textContent = message;
  toastStack.appendChild(el);
  setTimeout(() => el.remove(), 3800);
}

function productOptions(selected) {
  if (!state.products.length) return `<option value="">No products available</option>`;
  return state.products
    .map(
      (p) =>
        `<option value="${p.id}" ${String(p.id) === String(selected) ? "selected" : ""}>${escapeHtml(p.name)} (${escapeHtml(p.sku)}) — ${p.quantity} ${escapeHtml(p.unit || "")} in stock</option>`
    )
    .join("");
}

async function ensureProducts() {
  state.products = await api.getProducts();
  return state.products;
}

function findProduct(id) {
  return state.products.find((p) => String(p.id) === String(id));
}

function renderNav() {
  navigation.innerHTML =
    `<p class="section-label">MENU</p>` +
    NAV_ITEMS.map(
      (item) => `
      <button class="nav-item ${item.id === state.currentPage ? "active" : ""}" data-page="${item.id}">
        <span class="nav-icon">${item.icon}</span>
        <span>${item.label}</span>
      </button>`
    ).join("");

  navigation.querySelectorAll(".nav-item").forEach((btn) => {
    btn.addEventListener("click", () => navigateTo(btn.dataset.page));
  });
}

function navigateTo(pageId) {
  state.currentPage = pageId;
  renderNav();

  const item = NAV_ITEMS.find((n) => n.id === pageId);
  document.getElementById("pageEyebrow").textContent = item.eyebrow;
  document.getElementById("pageTitle").textContent = item.label;

  if (window.innerWidth <= 800) sidebar.classList.remove("open");

  renderPage(pageId);
}

async function renderPage(pageId) {
  const renderers = {
    dashboard: renderDashboard,
    products: renderProducts,
    receipts: renderReceipts,
    deliveries: renderDeliveries,
    adjustments: renderAdjustments,
    transfers: renderTransfers,
    ledger: renderLedger,
  };
  const fn = renderers[pageId] || renderDashboard;
  await fn();
}


async function renderDashboard() {
  pageRoot.innerHTML = loadingHTML("Loading dashboard…");

  try {
    const [dashboard, products, ledger] = await Promise.all([
      api.getDashboard(),
      api.getProducts(),
      api.getLedger(),
    ]);
    state.dashboard = dashboard;
    state.products = products;
    state.ledger = ledger;
    setApiOnline(true);

    const lowStock = products
      .filter((p) => Number(p.quantity) <= Number(p.reorder_level))
      .sort((a, b) => a.quantity - b.quantity);

    const recentMoves = ledger.slice(0, 6);

    const categories = {};
    products.forEach((p) => {
      const cat = p.category || "Uncategorized";
      categories[cat] = (categories[cat] || 0) + 1;
    });
    const maxCatCount = Math.max(1, ...Object.values(categories));

    pageRoot.innerHTML = `
      <div class="welcome-row">
        <div>
          <span class="eyebrow">DASHBOARD</span>
          <h1>Inventory overview</h1>
          <p>Live snapshot of stock, movements and alerts.</p>
        </div>
        <div class="page-actions">
          <button class="secondary-button" data-nav="ledger">View Ledger</button>
          <button class="primary-button" data-nav="receipts">+ Receive Stock</button>
        </div>
      </div>

      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-top">
            <div><span class="kpi-label">TOTAL PRODUCTS</span><h2>${dashboard.total_products}</h2></div>
            <div class="kpi-icon blue">▤</div>
          </div>
          <div class="kpi-bottom">Across all categories</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-top">
            <div><span class="kpi-label">TOTAL STOCK</span><h2>${dashboard.total_stock}</h2></div>
            <div class="kpi-icon green">▣</div>
          </div>
          <div class="kpi-bottom">Units on hand</div>
        </div>

        <div class="kpi-card ${dashboard.low_stock_count > 0 ? "danger-card" : ""}">
          <div class="kpi-top">
            <div><span class="kpi-label">LOW STOCK</span><h2>${dashboard.low_stock_count}</h2></div>
            <div class="kpi-icon red">!</div>
          </div>
          <div class="kpi-bottom">At or below reorder level</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-top">
            <div><span class="kpi-label">TOTAL RECEIPTS</span><h2>${dashboard.receipts_count}</h2></div>
            <div class="kpi-icon purple">↓</div>
          </div>
          <div class="kpi-bottom">Stock-in transactions</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-top">
            <div><span class="kpi-label">TOTAL DELIVERIES</span><h2>${dashboard.deliveries_count}</h2></div>
            <div class="kpi-icon orange">↑</div>
          </div>
          <div class="kpi-bottom">Stock-out transactions</div>
        </div>
      </div>

      <div class="lower-grid">
        <div class="card">
          <div class="card-header">
            <div><h3>Recent Stock Movements</h3><p>Latest entries from the stock ledger</p></div>
            <button class="secondary-button" data-nav="ledger">View all</button>
          </div>
          ${
            recentMoves.length
              ? `<div class="movement-list">${recentMoves.map(movementItemHTML).join("")}</div>`
              : emptyHTML("☷", "No movements yet", "Create a receipt or delivery to see activity here.")
          }
        </div>

        <div>
          <div class="card" style="margin-bottom:18px;">
            <div class="card-header">
              <div><h3>Low Stock Warning</h3><p>Needs attention</p></div>
              <span class="alert-count">${lowStock.length} item${lowStock.length === 1 ? "" : "s"}</span>
            </div>
            ${
              lowStock.length
                ? `<div class="alerts-list">${lowStock.slice(0, 5).map(lowStockItemHTML).join("")}</div>`
                : emptyHTML("✓", "All stock levels healthy", "No products are at or below their reorder level.")
            }
          </div>

          <div class="card">
            <div class="card-header"><div><h3>Inventory by Category</h3><p>Product count per category</p></div></div>
            ${
              Object.keys(categories).length
                ? `<div style="padding:10px 16px 16px;">${Object.entries(categories)
                    .sort((a, b) => b[1] - a[1])
                    .map(
                      ([cat, count]) => `
                      <div class="category-bar-row">
                        <span class="cat-name">${escapeHtml(cat)}</span>
                        <div class="category-bar-track"><div class="category-bar-fill" style="width:${(count / maxCatCount) * 100}%"></div></div>
                        <span class="cat-count">${count}</span>
                      </div>`
                    )
                    .join("")}</div>`
                : emptyHTML("▤", "No products yet", "Add your first product to get started.")
            }
          </div>
        </div>
      </div>
    `;

    pageRoot.querySelectorAll("[data-nav]").forEach((btn) =>
      btn.addEventListener("click", () => navigateTo(btn.dataset.nav))
    );
  } catch (err) {
    setApiOnline(false);
    pageRoot.innerHTML = errorHTML(err);
    showToast(err.message, "error");
  }
}

function movementItemHTML(m) {
  const badge = movementBadge(m.movement_type);
  const qtyClass = Number(m.quantity_change) >= 0 ? "qty-positive" : "qty-negative";
  const qtySign = Number(m.quantity_change) >= 0 ? "+" : "";
  return `
    <div class="movement-item">
      <div class="movement-icon ${badge.cls === "receipt" ? "incoming" : badge.cls === "delivery" ? "outgoing" : badge.cls}">${badge.icon}</div>
      <div class="movement-info">
        <strong>${escapeHtml(m.product_name)} <span class="${qtyClass}">${qtySign}${m.quantity_change}</span></strong>
        <span>${escapeHtml(m.sku)} · ${badge.label} · ${formatDate(m.created_at)}</span>
      </div>
    </div>`;
}

function lowStockItemHTML(p) {
  const status = getStockStatus(p);
  return `
    <div class="alert-item ${status.cls === "out" ? "danger" : "warning"}">
      <div class="alert-icon">!</div>
      <div>
        <strong>${escapeHtml(p.name)}</strong>
        <span>${p.quantity} ${escapeHtml(p.unit || "")} left · reorder at ${p.reorder_level}</span>
      </div>
    </div>`;
}

/* =========================================================
   PRODUCTS
   ========================================================= */

let productFormOpen = false;

async function renderProducts() {
  pageRoot.innerHTML = loadingHTML("Loading products…");
  try {
    await ensureProducts();
    paintProducts();
  } catch (err) {
    pageRoot.innerHTML = errorHTML(err);
    showToast(err.message, "error");
  }
}

function paintProducts(filterText = "", filterCategory = "") {
  const categories = [...new Set(state.products.map((p) => p.category).filter(Boolean))];

  const rows = state.products.filter((p) => {
    const matchesText = !filterText || `${p.name} ${p.sku}`.toLowerCase().includes(filterText.toLowerCase());
    const matchesCat = !filterCategory || p.category === filterCategory;
    return matchesText && matchesCat;
  });

  pageRoot.innerHTML = `
    <div class="welcome-row">
      <div>
        <span class="eyebrow">PRODUCTS</span>
        <h1>Product catalog</h1>
        <p>${state.products.length} product${state.products.length === 1 ? "" : "s"} in the system.</p>
      </div>
      <div class="page-actions">
        <button class="primary-button" id="toggleAddProduct">${productFormOpen ? "✕ Close" : "+ Add Product"}</button>
      </div>
    </div>

    <div class="card" id="addProductCard" style="display:${productFormOpen ? "block" : "none"}; margin-bottom:18px;">
      <div class="card-header"><div><h3>Add a new product</h3><p>Creates the product with 0 starting stock.</p></div></div>
      <div class="form-card">
        <form id="productForm">
          <div class="form-grid">
            <div class="field"><label>Product Name</label><input type="text" name="name" required placeholder="e.g. Safety Helmet" /></div>
            <div class="field"><label>SKU</label><input type="text" name="sku" required placeholder="e.g. SH-309" /></div>
            <div class="field"><label>Category</label><input type="text" name="category" required placeholder="e.g. Safety" /></div>
            <div class="field"><label>Unit</label><input type="text" name="unit" required placeholder="e.g. PCS, KG, BOX" /></div>
          </div>
          <div class="field" style="max-width:200px;">
            <label>Reorder Level</label>
            <input type="number" name="reorder_level" min="0" value="0" required />
          </div>
          <div class="form-actions">
            <button type="submit" class="primary-button" id="productSubmitBtn">Save Product</button>
          </div>
        </form>
        <div id="productResult"></div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <div><h3>All Products</h3><p>Search or filter by category</p></div>
      </div>
      <div style="padding:16px 20px 0;">
        <div class="toolbar">
          <input type="text" id="productSearch" placeholder="Search by name or SKU…" value="${escapeHtml(filterText)}" />
          <select id="categoryFilter">
            <option value="">All Categories</option>
            ${categories.map((c) => `<option value="${escapeHtml(c)}" ${c === filterCategory ? "selected" : ""}>${escapeHtml(c)}</option>`).join("")}
          </select>
        </div>
      </div>
      <div class="table-wrapper">
        ${
          rows.length
            ? `<table class="data-table">
                <thead><tr><th>Product</th><th>Category</th><th>Unit</th><th>Current Stock</th><th>Reorder Level</th><th>Status</th></tr></thead>
                <tbody>${rows.map(productRowHTML).join("")}</tbody>
              </table>`
            : emptyHTML("▤", "No products found", "Try a different search or add a new product.")
        }
      </div>
    </div>
  `;

  document.getElementById("toggleAddProduct").addEventListener("click", () => {
    productFormOpen = !productFormOpen;
    paintProducts(filterText, filterCategory);
    if (productFormOpen) document.querySelector('input[name="name"]')?.focus();
  });

  document.getElementById("productSearch").addEventListener("input", (e) => paintProducts(e.target.value, filterCategory));
  document.getElementById("categoryFilter").addEventListener("change", (e) => paintProducts(filterText, e.target.value));

  const form = document.getElementById("productForm");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = document.getElementById("productSubmitBtn");
      const resultBox = document.getElementById("productResult");
      const data = Object.fromEntries(new FormData(form).entries());
      data.reorder_level = Number(data.reorder_level) || 0;

      btn.disabled = true;
      btn.textContent = "Saving…";
      try {
        await api.createProduct(data);
        showToast(`Product "${data.name}" added successfully`, "success");
        productFormOpen = false;
        await ensureProducts();
        paintProducts();
      } catch (err) {
        resultBox.innerHTML = `<div class="result-box error">${escapeHtml(err.message)}</div>`;
        showToast(err.message, "error");
        btn.disabled = false;
        btn.textContent = "Save Product";
      }
    });
  }
}

function productRowHTML(p) {
  const status = getStockStatus(p);
  const initials = (p.name || "?").slice(0, 2).toUpperCase();
  return `
    <tr>
      <td>
        <div class="product-cell">
          <div class="product-icon">${escapeHtml(initials)}</div>
          <div><strong>${escapeHtml(p.name)}</strong><span>${escapeHtml(p.sku)}</span></div>
        </div>
      </td>
      <td>${escapeHtml(p.category || "—")}</td>
      <td>${escapeHtml(p.unit || "—")}</td>
      <td><strong>${p.quantity} ${escapeHtml(p.unit || "")}</strong></td>
      <td>${p.reorder_level}</td>
      <td><span class="status ${status.cls}">${status.label}</span></td>
    </tr>`;
}

/* =========================================================
   RECEIPTS
   ========================================================= */

async function renderReceipts() {
  pageRoot.innerHTML = loadingHTML("Loading receipts…");
  try {
    await ensureProducts();
    state.ledger = await api.getLedger();
    paintMovementForm({
      key: "receipts",
      title: "Receive Stock",
      subtitle: "Record incoming stock from a supplier. Stock increases immediately.",
      submitLabel: "Receive Stock",
      movementType: "RECEIPT",
      extraFields: "",
      onSubmit: async (form) => {
        const product_id = form.product_id.value;
        const quantity = Number(form.quantity.value);
        return api.createReceipt({ product_id, quantity });
      },
      resultRender: (res) => `
        <div class="result-box success">
          <strong>${res.message}</strong>
          <div class="result-grid">
            <div class="result-stat"><span>NEW STOCK BALANCE</span><strong>${res.stock.quantity}</strong></div>
            <div class="result-stat"><span>RECEIPT ID</span><strong>#${res.receipt.id}</strong></div>
          </div>
        </div>`,
    });
  } catch (err) {
    pageRoot.innerHTML = errorHTML(err);
    showToast(err.message, "error");
  }
}

/* =========================================================
   DELIVERIES
   ========================================================= */

async function renderDeliveries() {
  pageRoot.innerHTML = loadingHTML("Loading deliveries…");
  try {
    await ensureProducts();
    state.ledger = await api.getLedger();
    paintMovementForm({
      key: "deliveries",
      title: "Deliver Stock",
      subtitle: "Send stock out to a customer. Stock decreases immediately.",
      submitLabel: "Deliver Stock",
      movementType: "DELIVERY",
      extraFields: "",
      onSubmit: async (form) => {
        const product_id = form.product_id.value;
        const quantity = Number(form.quantity.value);
        return api.createDelivery({ product_id, quantity });
      },
      resultRender: (res) => `
        <div class="result-box success">
          <strong>${res.message}</strong>
          <div class="result-grid">
            <div class="result-stat"><span>NEW STOCK BALANCE</span><strong>${res.stock.quantity}</strong></div>
            <div class="result-stat"><span>DELIVERY ID</span><strong>#${res.delivery.id}</strong></div>
          </div>
        </div>`,
      errorRender: (err) =>
        err.data && err.data.current_stock !== undefined
          ? `<div class="result-box error"><strong>${escapeHtml(err.message)}</strong><p style="margin-top:6px;">Current stock available: <strong>${err.data.current_stock}</strong></p></div>`
          : `<div class="result-box error">${escapeHtml(err.message)}</div>`,
    });
  } catch (err) {
    pageRoot.innerHTML = errorHTML(err);
    showToast(err.message, "error");
  }
}

/* ---------- shared receipt/delivery form painter ---------- */

function paintMovementForm({ title, subtitle, submitLabel, onSubmit, resultRender, errorRender }) {
  const recent = state.ledger
    .filter((l) => l.movement_type === (title === "Receive Stock" ? "RECEIPT" : "DELIVERY"))
    .slice(0, 8);

  pageRoot.innerHTML = `
    <div class="welcome-row">
      <div><span class="eyebrow">${title === "Receive Stock" ? "STOCK IN" : "STOCK OUT"}</span><h1>${title}</h1><p>${subtitle}</p></div>
    </div>

    <div class="lower-grid">
      <div class="card">
        <div class="card-header"><div><h3>${title}</h3></div></div>
        <div class="form-card">
          <form id="movementForm">
            ${
              state.products.length
                ? `<div class="field"><label>Product</label><select name="product_id" required>${productOptions()}</select></div>`
                : `<p style="color:var(--muted); margin-bottom:14px;">No products yet — add one on the Products page first.</p>`
            }
            <div class="field" style="max-width:220px;"><label>Quantity</label><input type="number" name="quantity" min="1" step="1" required placeholder="e.g. 20" /></div>
            <div class="form-actions">
              <button type="submit" class="primary-button" id="movementSubmitBtn" ${state.products.length ? "" : "disabled"}>${submitLabel}</button>
            </div>
          </form>
          <div id="movementResult"></div>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><div><h3>Recent ${title === "Receive Stock" ? "Receipts" : "Deliveries"}</h3><p>Latest 8 entries</p></div></div>
        ${
          recent.length
            ? `<div class="movement-list">${recent.map(movementItemHTML).join("")}</div>`
            : emptyHTML("☷", "No activity yet", `Submit a ${title.toLowerCase()} to see it here.`)
        }
      </div>
    </div>
  `;

  const form = document.getElementById("movementForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.getElementById("movementSubmitBtn");
    const resultBox = document.getElementById("movementResult");
    btn.disabled = true;
    btn.textContent = "Processing…";

    try {
      const res = await onSubmit(form);
      resultBox.innerHTML = resultRender(res);
      showToast(res.message || "Success", "success");
      form.reset();
      await ensureProducts();
      state.ledger = await api.getLedger();
    } catch (err) {
      resultBox.innerHTML = errorRender ? errorRender(err) : `<div class="result-box error">${escapeHtml(err.message)}</div>`;
      showToast(err.message, "error");
    } finally {
      btn.disabled = false;
      btn.textContent = submitLabel;
    }
  });
}

/* =========================================================
   ADJUSTMENTS
   ========================================================= */

async function renderAdjustments() {
  pageRoot.innerHTML = loadingHTML("Loading adjustments…");
  try {
    await ensureProducts();
    state.ledger = await api.getLedger();
    const recent = state.ledger.filter((l) => l.movement_type === "ADJUSTMENT").slice(0, 8);

    pageRoot.innerHTML = `
      <div class="welcome-row">
        <div><span class="eyebrow">STOCK FIX</span><h1>Stock Adjustments</h1><p>Correct stock after a physical count. Use a negative number to reduce stock.</p></div>
      </div>

      <div class="lower-grid">
        <div class="card">
          <div class="card-header"><div><h3>New Adjustment</h3></div></div>
          <div class="form-card">
            <form id="adjustmentForm">
              ${
                state.products.length
                  ? `<div class="field"><label>Product</label><select name="product_id" required>${productOptions()}</select></div>`
                  : `<p style="color:var(--muted); margin-bottom:14px;">No products yet — add one on the Products page first.</p>`
              }
              <div class="field" style="max-width:220px;">
                <label>Quantity Change</label>
                <input type="number" name="quantity_change" step="1" required placeholder="e.g. 10 or -5" />
                <small class="hint">Positive to add stock, negative to remove.</small>
              </div>
              <div class="field"><label>Reason</label><textarea name="reason" required placeholder="e.g. Physical stock count"></textarea></div>
              <div class="form-actions">
                <button type="submit" class="primary-button" id="adjustmentSubmitBtn" ${state.products.length ? "" : "disabled"}>Save Adjustment</button>
              </div>
            </form>
            <div id="adjustmentResult"></div>
          </div>
        </div>

        <div class="card">
          <div class="card-header"><div><h3>Recent Adjustments</h3><p>Latest 8 entries</p></div></div>
          ${
            recent.length
              ? `<div class="movement-list">${recent.map(movementItemHTML).join("")}</div>`
              : emptyHTML("✓", "No adjustments yet", "Submit an adjustment to see it here.")
          }
        </div>
      </div>
    `;

    const form = document.getElementById("adjustmentForm");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = document.getElementById("adjustmentSubmitBtn");
      const resultBox = document.getElementById("adjustmentResult");
      btn.disabled = true;
      btn.textContent = "Processing…";

      try {
        const res = await api.createAdjustment({
          product_id: form.product_id.value,
          quantity_change: Number(form.quantity_change.value),
          reason: form.reason.value,
        });
        resultBox.innerHTML = `
          <div class="result-box success">
            <strong>${res.message}</strong>
            <div class="result-grid">
              <div class="result-stat"><span>NEW STOCK BALANCE</span><strong>${res.stock.quantity}</strong></div>
              <div class="result-stat"><span>ADJUSTMENT ID</span><strong>#${res.adjustment.id}</strong></div>
            </div>
          </div>`;
        showToast(res.message, "success");
        form.reset();
        await ensureProducts();
        state.ledger = await api.getLedger();
      } catch (err) {
        resultBox.innerHTML =
          err.data && err.data.current_stock !== undefined
            ? `<div class="result-box error"><strong>${escapeHtml(err.message)}</strong><p style="margin-top:6px;">Current stock: <strong>${err.data.current_stock}</strong></p></div>`
            : `<div class="result-box error">${escapeHtml(err.message)}</div>`;
        showToast(err.message, "error");
      } finally {
        btn.disabled = false;
        btn.textContent = "Save Adjustment";
      }
    });
  } catch (err) {
    pageRoot.innerHTML = errorHTML(err);
    showToast(err.message, "error");
  }
}

/* =========================================================
   TRANSFERS
   ========================================================= */

async function renderTransfers() {
  pageRoot.innerHTML = loadingHTML("Loading transfers…");

  try {
    await ensureProducts();

    // Get transfers from the transfers API
    const recent = (await api.getTransfers()).slice(0, 8);

    const locationOptions = Object.entries(LOCATIONS)
      .map(
        ([id, name]) =>
          `<option value="${id}">${escapeHtml(name)}</option>`
      )
      .join("");

    pageRoot.innerHTML = `
      <div class="welcome-row">
        <div>
          <span class="eyebrow">INTERNAL</span>
          <h1>Internal Transfers</h1>
          <p>
            Move stock between warehouses. Total stock is unchanged,
            only location changes.
          </p>
        </div>
      </div>

      <div class="lower-grid">

        <div class="card">
          <div class="card-header">
            <div>
              <h3>New Transfer</h3>
            </div>
          </div>

          <div class="form-card">
            <form id="transferForm">

              ${
                state.products.length
                  ? `
                    <div class="field">
                      <label>Product</label>
                      <select name="product_id" required>
                        ${productOptions()}
                      </select>
                    </div>
                  `
                  : `
                    <p style="color:var(--muted); margin-bottom:14px;">
                      No products yet — add one on the Products page first.
                    </p>
                  `
              }

              <div class="form-grid">

                <div class="field">
                  <label>From Location</label>
                  <select name="from_location_id" required>
                    ${locationOptions}
                  </select>
                </div>

                <div class="field">
                  <label>To Location</label>
                  <select name="to_location_id" required>
                    ${Object.entries(LOCATIONS)
                      .map(
                        ([id, name]) =>
                          `<option value="${id}" ${
                            id === "2" ? "selected" : ""
                          }>
                            ${escapeHtml(name)}
                          </option>`
                      )
                      .join("")}
                  </select>
                </div>

              </div>

              <div class="field" style="max-width:220px;">
                <label>Quantity</label>
                <input
                  type="number"
                  name="quantity"
                  min="1"
                  step="1"
                  required
                  placeholder="e.g. 10"
                />
              </div>

              <div class="form-actions">
                <button
                  type="submit"
                  class="primary-button"
                  id="transferSubmitBtn"
                  ${state.products.length ? "" : "disabled"}
                >
                  Transfer Stock
                </button>
              </div>

            </form>

            <div id="transferResult"></div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <div>
              <h3>Recent Transfers</h3>
              <p>Latest 8 entries</p>
            </div>
          </div>

          ${
            recent.length
              ? `
                <div class="movement-list">
                  ${recent
                    .map(
                      (transfer) => `
                        <div class="movement-item">
                          <div class="movement-icon transfer">
                            ⇄
                          </div>

                          <div class="movement-info">
                            <strong>
                              ${escapeHtml(transfer.product_name)}
                              <span class="qty-positive">
                                +${transfer.quantity}
                              </span>
                            </strong>

                            <span>
                              ${escapeHtml(transfer.sku || "")}
                              · TRANSFER ·
                              ${
                                transfer.transferred_at
                                  ? formatDate(transfer.transferred_at)
                                  : ""
                              }
                            </span>

                            <span>
                              ${escapeHtml(
                                transfer.from_location || "Unknown"
                              )}
                              → 
                              ${escapeHtml(
                                transfer.to_location || "Unknown"
                              )}
                            </span>
                          </div>
                        </div>
                      `
                    )
                    .join("")}
                </div>
              `
              : emptyHTML(
                  "⇄",
                  "No transfers yet",
                  "Submit a transfer to see it here."
                )
          }
        </div>

      </div>
    `;

    const form = document.getElementById("transferForm");

    if (!form) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const btn = document.getElementById("transferSubmitBtn");
      const resultBox = document.getElementById("transferResult");

      const from_location_id = Number(
        form.from_location_id.value
      );

      const to_location_id = Number(
        form.to_location_id.value
      );

      if (from_location_id === to_location_id) {
        resultBox.innerHTML = `
          <div class="result-box error">
            Source and destination locations must be different.
          </div>
        `;
        return;
      }

      btn.disabled = true;
      btn.textContent = "Processing…";

      try {
        const res = await api.createTransfer({
          product_id: form.product_id.value,
          from_location_id,
          to_location_id,
          quantity: Number(form.quantity.value),
        });

        resultBox.innerHTML = `
          <div class="result-box success">
            <strong>${escapeHtml(res.message)}</strong>

            <div class="result-grid">

              <div class="result-stat">
                <span>
                  ${escapeHtml(
                    LOCATIONS[from_location_id]
                  )} — REMAINING
                </span>
                <strong>
                  ${res.source_stock.quantity}
                </strong>
              </div>

              <div class="result-stat">
                <span>
                  ${escapeHtml(
                    LOCATIONS[to_location_id]
                  )} — NEW BALANCE
                </span>
                <strong>
                  ${res.destination_stock.quantity}
                </strong>
              </div>

            </div>
          </div>
        `;

        showToast(res.message, "success");

        form.reset();

        await ensureProducts();

      } catch (err) {
        resultBox.innerHTML =
          err.data &&
          err.data.current_stock !== undefined
            ? `
              <div class="result-box error">
                <strong>${escapeHtml(err.message)}</strong>
                <p style="margin-top:6px;">
                  Stock available at source:
                  <strong>${err.data.current_stock}</strong>
                </p>
              </div>
            `
            : `
              <div class="result-box error">
                ${escapeHtml(err.message)}
              </div>
            `;

        showToast(err.message, "error");

      } finally {
        btn.disabled = false;
        btn.textContent = "Transfer Stock";
      }
    });

  } catch (err) {
    pageRoot.innerHTML = errorHTML(err);
    showToast(err.message, "error");
  }
}
/* =========================================================
   STOCK LEDGER
   ========================================================= */

async function renderLedger() {
  pageRoot.innerHTML = loadingHTML("Loading stock ledger…");
  try {
    state.ledger = await api.getLedger();
    paintLedger();
  } catch (err) {
    pageRoot.innerHTML = errorHTML(err);
    showToast(err.message, "error");
  }
}

function paintLedger(filterText = "", filterType = "") {
  const rows = state.ledger.filter((l) => {
    const matchesText = !filterText || `${l.product_name} ${l.sku}`.toLowerCase().includes(filterText.toLowerCase());
    const matchesType = !filterType || l.movement_type === filterType;
    return matchesText && matchesType;
  });

  pageRoot.innerHTML = `
    <div class="welcome-row">
      <div><span class="eyebrow">HISTORY</span><h1>Stock Ledger</h1><p>Complete, chronological record of every stock movement.</p></div>
      <div class="page-actions"><button class="secondary-button" id="exportCsvBtn">⬇ Export CSV</button></div>
    </div>

    <div class="card">
      <div class="card-header"><div><h3>All Movements</h3><p>${state.ledger.length} total entries</p></div></div>
      <div style="padding:16px 20px 0;">
        <div class="toolbar">
          <input type="text" id="ledgerSearch" placeholder="Search by product or SKU…" value="${escapeHtml(filterText)}" />
          <select id="ledgerTypeFilter">
            <option value="">All Movement Types</option>
            <option value="RECEIPT" ${filterType === "RECEIPT" ? "selected" : ""}>Receipt</option>
            <option value="DELIVERY" ${filterType === "DELIVERY" ? "selected" : ""}>Delivery</option>
            <option value="TRANSFER" ${filterType === "TRANSFER" ? "selected" : ""}>Transfer</option>
            <option value="ADJUSTMENT" ${filterType === "ADJUSTMENT" ? "selected" : ""}>Adjustment</option>
          </select>
        </div>
      </div>
      <div class="table-wrapper">
        ${
          rows.length
            ? `<table class="data-table">
                <thead><tr><th>Date</th><th>Product</th><th>SKU</th><th>Movement Type</th><th>Quantity Change</th><th>Balance After</th><th>Reference ID</th></tr></thead>
                <tbody>${rows.map(ledgerRowHTML).join("")}</tbody>
              </table>`
            : emptyHTML("☷", "No ledger entries found", "Movements will appear here as you receive, deliver, transfer or adjust stock.")
        }
      </div>
    </div>
  `;

  document.getElementById("ledgerSearch").addEventListener("input", (e) => paintLedger(e.target.value, filterType));
  document.getElementById("ledgerTypeFilter").addEventListener("change", (e) => paintLedger(filterText, e.target.value));
  document.getElementById("exportCsvBtn").addEventListener("click", () => exportLedgerCsv(rows));
}

function ledgerRowHTML(l) {
  const badge = movementBadge(l.movement_type);
  const qtyClass = Number(l.quantity_change) >= 0 ? "qty-positive" : "qty-negative";
  const qtySign = Number(l.quantity_change) >= 0 ? "+" : "";
  return `
    <tr>
      <td>${formatDate(l.created_at)}</td>
      <td><strong>${escapeHtml(l.product_name)}</strong></td>
      <td>${escapeHtml(l.sku)}</td>
      <td><span class="badge ${badge.cls}">${badge.icon} ${badge.label}</span></td>
      <td class="${qtyClass}">${qtySign}${l.quantity_change}</td>
      <td>${l.balance_after}</td>
      <td>#${l.reference_id}</td>
    </tr>`;
}

function exportLedgerCsv(rows) {
  if (!rows.length) return showToast("Nothing to export", "error");
  const header = ["Date", "Product", "SKU", "Movement Type", "Quantity Change", "Balance After", "Reference ID"];
  const lines = rows.map((l) =>
    [formatDate(l.created_at), l.product_name, l.sku, l.movement_type, l.quantity_change, l.balance_after, l.reference_id]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(",")
  );
  const csv = [header.join(","), ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "stocksense-ledger.csv";
  a.click();
  URL.revokeObjectURL(url);
}

/* =========================================================
   API STATUS / SHELL WIRING
   ========================================================= */

function setApiOnline(isOnline) {
  const dot = document.getElementById("apiStatusDot");
  const text = document.getElementById("apiStatusText");
  const footer = document.getElementById("footerStatus");
  if (isOnline) {
    dot.style.background = "var(--success)";
    text.textContent = "Backend connected";
    footer.textContent = "● backend connected";
  } else {
    dot.style.background = "var(--danger)";
    text.textContent = "Backend unreachable";
    footer.textContent = "● backend unreachable";
  }
}

document.getElementById("mobileMenu").addEventListener("click", () => sidebar.classList.toggle("open"));
document.getElementById("refreshButton").addEventListener("click", () => renderPage(state.currentPage));

document.addEventListener("DOMContentLoaded", () => {
  renderNav();
  navigateTo("dashboard");
});
