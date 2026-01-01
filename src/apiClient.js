// ============================================================
// Ordini-Lampo apiClient.js - BULLDOZER ENTERPRISE v3.1
// ============================================================
// FIX v3.1: Safe fallback when not initialized (no crash)
// ============================================================

const DEFAULT_API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace(/\/+$/, "");

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
// FIX v3.1: Safe fallbacks when not initialized
// -------------------------
export const api = (() => {
  let _api = null;

  // Helper: returns true if initialized
  const isReady = () => _api !== null;

  // Helper: get api or null (no throw)
  const getApi = () => _api;

  return {
    init: ({ baseUrl = DEFAULT_API_BASE, getToken }) => {
      _api = createApi({ baseUrl, getToken });
      console.log('[apiClient] Initialized successfully');
      return _api;
    },

    // FIX v3.1: Check if initialized
    isInitialized: () => isReady(),

    // FIX v3.1: Safe mode - return false if not initialized
    isSafeMode: () => {
      if (!isReady()) return false;
      return _api.isSafeMode();
    },

    // FIX v3.1: testConnection - return false if not initialized
    testConnection: async () => {
      if (!isReady()) {
        console.warn('[apiClient] testConnection called before init');
        return false;
      }
      return _api.testConnection();
    },

    // FIX v3.1: All methods check initialization first
    getSettings: async (...a) => {
      if (!isReady()) throw new Error("API_NOT_INITIALIZED");
      return _api.getSettings(...a);
    },

    saveSettings: async (...a) => {
      if (!isReady()) throw new Error("API_NOT_INITIALIZED");
      return _api.saveSettings(...a);
    },

    getOrders: async (...a) => {
      if (!isReady()) throw new Error("API_NOT_INITIALIZED");
      return _api.getOrders(...a);
    },

    updateOrderStatus: async (...a) => {
      if (!isReady()) throw new Error("API_NOT_INITIALIZED");
      return _api.updateOrderStatus(...a);
    },

    getBlockedSlots: async (...a) => {
      if (!isReady()) throw new Error("API_NOT_INITIALIZED");
      return _api.getBlockedSlots(...a);
    },

    blockSlot: async (...a) => {
      if (!isReady()) throw new Error("API_NOT_INITIALIZED");
      return _api.blockSlot(...a);
    },

    unblockSlot: async (...a) => {
      if (!isReady()) throw new Error("API_NOT_INITIALIZED");
      return _api.unblockSlot(...a);
    },
  };
})();

export default api;
