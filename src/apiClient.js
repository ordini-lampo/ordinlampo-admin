// ============================================
// API Client per Ordini-Lampo Worker
// Sostituisce supabaseClient.js
// ============================================

const API_BASE = 'https://ordini-lampo-api.ordini-lampo.workers.dev';

export const api = {
  // ==================== ORDINI ====================
  async getOrders(slug, date) {
    try {
      const res = await fetch(`${API_BASE}/admin/${slug}/orders?date=${date}`);
      return await res.json();
    } catch (e) {
      console.error('getOrders error:', e);
      return { success: false, error: e.message };
    }
  },

  async updateOrderStatus(slug, orderId, status) {
    try {
      const res = await fetch(`${API_BASE}/admin/${slug}/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      return await res.json();
    } catch (e) {
      console.error('updateOrderStatus error:', e);
      return { success: false, error: e.message };
    }
  },

  // ==================== SETTINGS ====================
  async getSettings(slug) {
    try {
      const res = await fetch(`${API_BASE}/admin/${slug}/settings`);
      return await res.json();
    } catch (e) {
      console.error('getSettings error:', e);
      return { success: false, error: e.message };
    }
  },

  async saveSettings(slug, data) {
    try {
      const res = await fetch(`${API_BASE}/admin/${slug}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await res.json();
    } catch (e) {
      console.error('saveSettings error:', e);
      return { success: false, error: e.message };
    }
  },

  // ==================== BLOCKED SLOTS ====================
  async getBlockedSlots(slug) {
    try {
      const res = await fetch(`${API_BASE}/admin/${slug}/blocked-slots`);
      return await res.json();
    } catch (e) {
      console.error('getBlockedSlots error:', e);
      return { success: false, error: e.message };
    }
  },

  async blockSlot(slug, slot_date, slot_time, reason) {
    try {
      const res = await fetch(`${API_BASE}/admin/${slug}/blocked-slots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slot_date, slot_time, reason })
      });
      return await res.json();
    } catch (e) {
      console.error('blockSlot error:', e);
      return { success: false, error: e.message };
    }
  },

  async unblockSlot(slug, slotId) {
    try {
      const res = await fetch(`${API_BASE}/admin/${slug}/blocked-slots/${slotId}`, {
        method: 'DELETE'
      });
      return await res.json();
    } catch (e) {
      console.error('unblockSlot error:', e);
      return { success: false, error: e.message };
    }
  },

  // ==================== HEALTH CHECK ====================
  async testConnection() {
    try {
      const res = await fetch(`${API_BASE}/health`);
      const data = await res.json();
      return data.status === 'ok';
    } catch (e) {
      console.error('testConnection error:', e);
      return false;
    }
  }
};

export default api;
