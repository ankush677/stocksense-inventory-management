/* =========================================================
   STOCKSENSE — API LAYER
   Thin wrapper around fetch() for every backend endpoint.
   Backend base URL: http://localhost:5000
   ========================================================= */

const API_BASE = "http://localhost:5000/api";

/**
 * Core request helper.
 * - Parses JSON responses (even error responses, since the
 *   backend sends { message } bodies on 4xx/5xx).
 * - Throws an Error whose .message is the backend's message
 *   when available, and whose .data carries the full body
 *   (useful for fields like current_stock).
 */
async function request(path, options = {}) {
  let response;

  try {
    response = await fetch(`${API_BASE}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
  } catch (networkError) {
    const err = new Error(
      "Could not reach the backend. Is it running on http://localhost:5000?"
    );
    err.isNetworkError = true;
    throw err;
  }

  let body = null;
  try {
    body = await response.json();
  } catch (_) {
    // no JSON body — fine for some responses
  }

  if (!response.ok) {
    const err = new Error(
      (body && body.message) || `Request failed (${response.status})`
    );
    err.status = response.status;
    err.data = body;
    throw err;
  }

  return body;
}

const api = {
  // Products
  getProducts: () => request("/products"),
  createProduct: (payload) =>
    request("/products", { method: "POST", body: JSON.stringify(payload) }),

  // Receipts
  createReceipt: (payload) =>
    request("/receipts", { method: "POST", body: JSON.stringify(payload) }),

  // Deliveries
  createDelivery: (payload) =>
    request("/deliveries", { method: "POST", body: JSON.stringify(payload) }),

  // Adjustments
  createAdjustment: (payload) =>
    request("/adjustments", { method: "POST", body: JSON.stringify(payload) }),

  
  // Transfers
 // Transfers
createTransfer: (payload) =>
  request("/transfers", {
    method: "POST",
    body: JSON.stringify(payload),
  }),

getTransfers: () => request("/transfers"),
  // Ledger
  getLedger: () => request("/ledger"),

  // Dashboard
  getDashboard: () => request("/dashboard"),
};
