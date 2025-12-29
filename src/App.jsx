// ============================================================
// Ordini-Lampo Admin Panel - v3.2 FINALE
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth, SignIn, UserButton } from '@clerk/clerk-react';
import { Save, MapPin, Settings, ShoppingBag, RefreshCw, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { api } from './apiClient';

// Helper: evita NaN.toFixed() crash
const toNumber = (value, fallback = 0) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const parsed = Number(String(value || '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : fallback;
};

const ORDER_STATUSES = {
  PENDING: { label: 'In Attesa', color: 'bg-yellow-100 text-yellow-800', next: 'CONFIRMED' },
  CONFIRMED: { label: 'Confermato', color: 'bg-blue-100 text-blue-800', next: 'PREPARING' },
  PREPARING: { label: 'In Preparazione', color: 'bg-purple-100 text-purple-800', next: 'READY' },
  READY: { label: 'Pronto', color: 'bg-green-100 text-green-800', next: 'DELIVERING' },
  DELIVERING: { label: 'In Consegna', color: 'bg-indigo-100 text-indigo-800', next: 'DELIVERED' },
  DELIVERED: { label: 'Consegnato', color: 'bg-gray-100 text-gray-800', next: null },
  CANCELLED: { label: 'Annullato', color: 'bg-red-100 text-red-800', next: null },
  REJECTED: { label: 'Rifiutato', color: 'bg-red-100 text-red-800', next: null }
};

export default function OrdinlampoAdmin() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  
  const [locations, setLocations] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [restaurantName, setRestaurantName] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [activeTab, setActiveTab] = useState('orders');
  const [showSaveNotification, setShowSaveNotification] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settingsVersion, setSettingsVersion] = useState(1);
  const [safeMode, setSafeMode] = useState(false);
  const [apiInitialized, setApiInitialized] = useState(false);
  const [initError, setInitError] = useState(null);

  // INIT API
  useEffect(() => {
    if (isLoaded && isSignedIn && !apiInitialized) {
      try {
        api.init({
          getToken,
          baseUrl: import.meta.env.VITE_API_BASE_URL || 'https://ordini-lampo-api.ordini-lampo.workers.dev'
        });
        setApiInitialized(true);
      } catch (e) {
        setInitError(e.message);
      }
    }
  }, [isLoaded, isSignedIn, getToken, apiInitialized]);

  // CHECK SAFE MODE
  useEffect(() => {
    if (!apiInitialized) return;
    const check = () => setSafeMode(api.isSafeMode());
    check();
    const interval = setInterval(check, 5000);
    return () => clearInterval(interval);
  }, [apiInitialized]);

  // LOAD DATA
  useEffect(() => {
    if (!apiInitialized) return;
    
    const loadInitialData = async () => {
      setLoading(true);
      try {
        const isConnected = await api.testConnection();
        setConnectionStatus(isConnected ? 'connected' : 'error');
        
        if (!isConnected) {
          setLoading(false);
          return;
        }

        const settingsResult = await api.getSettings();
        if (settingsResult.success) {
          setRestaurantName(settingsResult.restaurant?.name || '');
          setWhatsappNumber(settingsResult.restaurant?.whatsapp_number || '');
          setLocations(settingsResult.locations || []);
          setSettingsVersion(settingsResult.version || 1);
        }

        await loadOrders();
      } catch (e) {
        setConnectionStatus('error');
      }
      setLoading(false);
    };

    loadInitialData();
  }, [apiInitialized]);

  useEffect(() => {
    if (!loading && apiInitialized) loadOrders();
  }, [selectedDate]);

  const loadOrders = useCallback(async () => {
    if (!apiInitialized) return;
    setOrdersLoading(true);
    try {
      const result = await api.getOrders(selectedDate);
      if (result.success) setOrders(result.orders || []);
    } catch (e) {
      if (e.message === 'SAFE_MODE_CIRCUIT_OPEN') setSafeMode(true);
    }
    setOrdersLoading(false);
  }, [selectedDate, apiInitialized]);

  const updateOrderStatus = async (orderId, newStatus) => {
    if (safeMode) return alert('Modalità sicura attiva.');
    try {
      const result = await api.updateOrderStatus(orderId, newStatus);
      if (result.success) {
        showNotification();
        loadOrders();
      } else {
        alert('Errore: ' + (result.error || 'Sconosciuto'));
      }
    } catch (e) {
      alert('Errore: ' + e.message);
    }
  };

  const advanceOrderStatus = (order) => {
    const currentStatus = ORDER_STATUSES[order.status];
    if (currentStatus?.next) updateOrderStatus(order.id, currentStatus.next);
  };

  const saveAllConfigurations = async () => {
    if (safeMode) return alert('Modalità sicura attiva.');
    setSaving(true);
    try {
      const result = await api.saveSettings(
        { settings: {}, restaurant: { name: restaurantName, whatsapp_number: whatsappNumber } },
        settingsVersion
      );
      if (result.success) {
        setSettingsVersion(result.version);
        showNotification();
      } else if (result.error === 'VERSION_CONFLICT') {
        alert('Conflitto versione. Ricarica la pagina.');
        window.location.reload();
      } else {
        alert('Errore: ' + (result.error || 'Sconosciuto'));
      }
    } catch (e) {
      alert('Errore: ' + e.message);
    }
    setSaving(false);
  };

  const showNotification = () => {
    setShowSaveNotification(true);
    setTimeout(() => setShowSaveNotification(false), 3000);
  };

  // === LOADING CLERK ===
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // === LOGIN SCREEN ===
  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">⚡ Ordini-Lampo</h1>
            <p className="text-gray-600">Accedi al pannello admin</p>
          </div>
          <SignIn 
            routing="hash" 
            appearance={{
              elements: {
                rootBox: "mx-auto",
                card: "shadow-lg"
              }
            }}
          />
        </div>
      </div>
    );
  }

  // === LOADING DATA ===
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Caricamento...</p>
        </div>
      </div>
    );
  }

  // === MAIN PANEL ===
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        
        {safeMode && (
          <div className="mb-4 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center gap-3">
            <AlertTriangle className="w-6 h-6" />
            <div>
              <p className="font-semibold">Modalità sicura attiva</p>
              <p className="text-sm">Connessione instabile. Riprova tra poco.</p>
            </div>
          </div>
        )}

        {/* HEADER */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">⚙️ Admin Panel</h1>
              <div className="flex items-center gap-4">
                {connectionStatus === 'connected' ? (
                  <span className="text-green-600 text-sm flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                    Connesso
                  </span>
                ) : (
                  <span className="text-red-600 text-sm flex items-center gap-1">
                    <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                    Errore connessione
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={saveAllConfigurations} 
                disabled={saving || safeMode}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg flex items-center space-x-2 disabled:opacity-50"
              >
                <Save className="w-5 h-5" />
                <span>{saving ? 'Salvataggio...' : 'Salva'}</span>
              </button>
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>

        {showSaveNotification && (
          <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2 z-50">
            <Save className="w-5 h-5" /><span>Salvato!</span>
          </div>
        )}

        {/* TABS */}
        <div className="bg-white rounded-2xl shadow-lg mb-6">
          <div className="flex border-b">
            <button onClick={() => setActiveTab('orders')}
              className={`flex-1 px-6 py-4 font-semibold flex items-center justify-center space-x-2 ${activeTab === 'orders' ? 'bg-orange-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
              <ShoppingBag className="w-5 h-5" /><span>Ordini ({orders.length})</span>
            </button>
            <button onClick={() => setActiveTab('settings')}
              className={`flex-1 px-6 py-4 font-semibold flex items-center justify-center space-x-2 ${activeTab === 'settings' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
              <Settings className="w-5 h-5" /><span>Impostazioni</span>
            </button>
          </div>

          <div className="p-6">
            {/* ORDERS TAB */}
            {activeTab === 'orders' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-800">Ordini</h2>
                  <div className="flex items-center gap-3">
                    <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="border rounded-lg px-3 py-2" />
                    <button onClick={loadOrders} disabled={ordersLoading || safeMode}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50">
                      <RefreshCw className={`w-4 h-4 ${ordersLoading ? 'animate-spin' : ''}`} />Aggiorna
                    </button>
                  </div>
                </div>

                {orders.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">Nessun ordine</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map(order => {
                      const statusInfo = ORDER_STATUSES[order.status] || ORDER_STATUSES.PENDING;
                      return (
                        <div key={order.id} className="bg-gray-50 rounded-lg p-4 border">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="text-xl font-bold">#{order.order_number}</span>
                                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusInfo.color}`}>{statusInfo.label}</span>
                              </div>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p><strong>Cliente:</strong> {order.customer_name}</p>
                                  <p><strong>Telefono:</strong> {order.customer_phone}</p>
                                </div>
                                <div>
                                  <p><strong>Orario:</strong> {order.scheduled_time?.substring(0, 5) || '-'}</p>
                                  <p><strong>Totale:</strong> €{toNumber(order.total).toFixed(2)}</p>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col gap-2 ml-4">
                              {statusInfo.next && (
                                <button onClick={() => advanceOrderStatus(order)} disabled={safeMode}
                                  className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 text-sm disabled:opacity-50">
                                  <CheckCircle className="w-4 h-4" />Avanza
                                </button>
                              )}
                              {order.status === 'PENDING' && (
                                <button onClick={() => updateOrderStatus(order.id, 'CANCELLED')} disabled={safeMode}
                                  className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-700 text-sm disabled:opacity-50">
                                  <XCircle className="w-4 h-4" />Annulla
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* SETTINGS TAB */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800">Impostazioni</h2>
                <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                  <div>
                    <label className="block font-semibold mb-2">Nome Ristorante</label>
                    <input type="text" value={restaurantName} onChange={(e) => setRestaurantName(e.target.value)} disabled={safeMode} className="w-full border rounded px-3 py-2" />
                  </div>
                  <div>
                    <label className="block font-semibold mb-2">Numero WhatsApp</label>
                    <input type="text" value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} placeholder="393896382394" disabled={safeMode} className="w-full border rounded px-3 py-2" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="text-center text-gray-500 text-sm">Ordini-Lampo Admin v3.2</div>
      </div>
    </div>
  );
}
