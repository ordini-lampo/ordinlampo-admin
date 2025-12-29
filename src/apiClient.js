// ============================================================
// Ordini-Lampo apiClient.js - BULLDOZER ENTERPRISE
// ============================================================
// ISTRUZIONI:
// 1. Sostituire src/apiClient.js con questo file
// 2. Nel componente principale: import { api } from './apiClient'
// 3. Inizializzare: api.init({ getToken, baseUrl })
// ============================================================
// FEATURES:
// - Zero-trust: NO slug tenant in API (server derives from token)
// - Abort + Dedupe + Circuit Breaker
// - Idempotency-Key for mutations
// - If-Match optimistic concurrency for settings
// ============================================================

const DEFAULT_API_BASE = "https://ordini-lampo-api.ordini-lampo.workers.dev";

// -------------------------
// Small utilities
// -------------------------
function uuid() {
  return crypto.randomUUID();
}

async function sha256Hex(input) {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2, "0")).join("");
}

class CircuitBreaker {
  constructor() {
    this.fails = 0;
    this.openUntil = 0;
  }
  isOpen() {
    return Date.now() < this.openUntil;
  }
  onSuccess() {
    this.fails = 0;
    this.openUntil = 0;
  }
  onFail() {
    this.fails += 1;
    if (this.fails >= 3) this.openUntil = Date.now() + 30_000;
  }
}

const breaker = new CircuitBreaker();
const inflight = new Map();
const aborters = new Map();

function safeJsonParse(text) {
  try { return JSON.parse(text); } catch { return null; }
}

function ensureOk(res, payload) {
  if (res.ok) return;
  const msg = payload?.error || `HTTP_${res.status}`;
  const err = new Error(msg);
  err.status = res.status;
  err.payload = payload;
  throw err;
}

function makeAbortSignal(abortKey) {
  if (!abortKey) return { signal: undefined };
  const prev = aborters.get(abortKey);
  if (prev) prev.abort();
  const ctrl = new AbortController();
  aborters.set(abortKey, ctrl);
  return { signal: ctrl.signal };
}

// -------------------------
// Factory
// -------------------------
export function createApi({ baseUrl = DEFAULT_API_BASE, getToken }) {
  if (typeof getToken !== "function") {
    throw new Error("createApi requires getToken() (Clerk)");
  }

  async function request(method, path, {
    body,
    dedupe = false,
    abortKey,
    idempotent = false,
    ifMatchVersion,
  } = {}) {
    if (breaker.isOpen()) {
      throw new Error("SAFE_MODE_CIRCUIT_OPEN");
    }

    const token = await getToken();
    if (!token) throw new Error("NO_TOKEN");

    const url = `${baseUrl}${path}`;
    const bodyText = body ? JSON.stringify(body) : "";

    const dedupeKey = dedupe ? await sha256Hex(`${method}|${url}|${bodyText}`) : null;
    if (dedupeKey && inflight.has(dedupeKey)) return inflight.get(dedupeKey);

    const p = (async () => {
      const { signal } = makeAbortSignal(abortKey);

      const headers = {
        "content-type": "application/json",
        "authorization": `Bearer ${token}`,
        "x-request-id": uuid(),
      };

      if (idempotent) headers["idempotency-key"] = uuid();
      if (Number.isFinite(ifMatchVersion)) headers["if-match"] = `W/"${ifMatchVersion}"`;

      const res = await fetch(url, {
        method,
        headers,
        body: body ? bodyText : undefined,
        signal,
      });

      const text = await res.text().catch(() => "");
      const payload = safeJsonParse(text) ?? {};

      ensureOk(res, payload);

      breaker.onSuccess();
      return payload;
    })().catch((e) => {
      breaker.onFail();
      throw e;
    }).finally(() => {
      if (dedupeKey) inflight.delete(dedupeKey);
    });

    if (dedupeKey) inflight.set(dedupeKey, p);
    return p;
  }

  return {
    // Safe mode indicator (UI can disable mutations)
    isSafeMode: () => breaker.isOpen(),

    // Health (no auth required)
    testConnection: async () => {
      try {
        const res = await fetch(`${baseUrl}/health`);
        const data = await res.json().catch(() => ({}));
        return data?.status === "ok";
      } catch {
        return false;
      }
    },

    // =========================
    // ADMIN (auth required)
    // =========================
    getSettings: async () =>
      request("GET", "/admin/settings", { dedupe: true, abortKey: "settings" }),

    saveSettings: async ({ settings, restaurant }, expectedVersion) =>
      request("PUT", "/admin/settings", {
        body: { settings, restaurant },
        idempotent: true,
        ifMatchVersion: expectedVersion,
      }),

    getOrders: async (date) =>
      request("GET", `/admin/orders?date=${encodeURIComponent(date)}`, {
        abortKey: "orders",
      }),

    updateOrderStatus: async (orderId, status) =>
      request("PUT", `/admin/orders/${encodeURIComponent(orderId)}`, {
        body: { status },
        idempotent: true,
      }),

    getBlockedSlots: async () =>
      request("GET", "/admin/blocked-slots", { abortKey: "blockedSlots" }),

    blockSlot: async ({ slot_date, slot_time, reason }) =>
      request("POST", "/admin/blocked-slots", {
        body: { slot_date, slot_time, reason },
        idempotent: true,
      }),

    unblockSlot: async (id) =>
      request("DELETE", `/admin/blocked-slots/${encodeURIComponent(id)}`, {
        idempotent: true,
      }),
  };
}

// -------------------------
// Singleton pattern (backward compatible)
// -------------------------
export const api = (() => {
  let _api = null;

  return {
    init: ({ baseUrl = DEFAULT_API_BASE, getToken }) => {
      _api = createApi({ baseUrl, getToken });
      return _api;
    },
    _must: () => {
      if (!_api) throw new Error("api not initialized. Call api.init({ getToken })");
      return _api;
    },

    isSafeMode: () => (api._must()).isSafeMode(),
    testConnection: (...a) => (api._must()).testConnection(...a),

    getSettings: (...a) => (api._must()).getSettings(...a),
    saveSettings: (...a) => (api._must()).saveSettings(...a),

    getOrders: (...a) => (api._must()).getOrders(...a),
    updateOrderStatus: (...a) => (api._must()).updateOrderStatus(...a),

    getBlockedSlots: (...a) => (api._must()).getBlockedSlots(...a),
    blockSlot: (...a) => (api._must()).blockSlot(...a),
    unblockSlot: (...a) => (api._must()).unblockSlot(...a),
  };
})();

export default api;
