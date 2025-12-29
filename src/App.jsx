// ============================================================
// Ordini-Lampo Admin Panel - v3.0 ENTERPRISE BULLDOZER
// ============================================================
// CHANGELOG v3.0:
// - RIMOSSO: RESTAURANT_SLUG hardcoded (zero-trust)
// - AGGIUNTO: Clerk useAuth integration
// - AGGIUNTO: API init con getToken
// - AGGIUNTO: settingsVersion per optimistic concurrency
// - AGGIUNTO: Safe mode indicator + circuit breaker UI
// - AGGIUNTO: Helper toNumber() per evitare NaN crash
// - AGGIUNTO: Gestione errore 409 VERSION_CONFLICT
// - AGGIUNTO: Banner safe mode
// - AGGIUNTO: Bottoni disabilitati in safe mode
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Save, Plus, Trash2, Eye, EyeOff, MapPin, Settings, ShoppingBag, RefreshCw, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { api } from './apiClient';

// ============================================================
// HELPER: toNumber - evita NaN.toFixed() crash
// ============================================================
const toNumber = (value, fallback = 0) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const parsed = Number(String(value || '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : fallback;
};

// ============================================================
// CONSTANTS
// ============================================================
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

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function OrdinlampoAdmin() {
  // === CLERK AUTH ===
  const { getToken, isLoaded, isSignedIn } = useAuth();
  
  // === STATE ===
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
  
  // === BULLDOZER: Optimistic concurrency ===
  const [settingsVersion, setSettingsVersion] = useState(1);
  
  // === BULLDOZER: Safe mode (circuit breaker) ===
  const [safeMode, setSafeMode] = useState(false);
  const [apiInitialized, setApiInitialized] = useState(false);

  // ============================================================
  // INIT API WITH CLERK TOKEN
  // ============================================================
  useEffect(() => {
    if (isLoaded && isSignedIn && !apiInitialized) {
      try {
        api.init({
          getToken,
          baseUrl: import.meta.env.VITE_API_BASE_URL || 'https://ordini-lampo-api.ordini-lampo.workers.dev'
        });
        setApiInitialized(true);
        console.log('[BULLDOZER] API initialized with Clerk token');
      } catch (e) {
        console.error('[BULLDOZER] API init failed:', e);
      }
    }
  }, [isLoaded, isSignedIn, getToken, apiInitialized]);

  // ============================================================
  // CHECK SAFE MODE PERIODICALLY
  // ============================================================
  useEffect(() => {
    const checkSafeMode = () => {
      if (api.isSafeMode) {
        setSafeMode(api.isSafeMode());
      }
    };
    checkSafeMode();
    const interval = setInterval(checkSafeMode, 5000);
    return () => clearInterval(interval);
  }, [apiInitialized]);

  // ============================================================
  // LOAD INITIAL DATA
  // ============================================================
  useEffect(() => {
    if (!apiInitialized) return;
    
    const loadInitialData = async () => {
      setLoading(true);
      try {
        const isConnected = await api.testConnection();
        setConnectionStatus(isConnected ? 'connected' : 'error');
        
        if (!isConnected) {
          console.error('[BULLDOZER] API connection failed');
          setLoading(false);
          return;
        }

        // BULLDOZER: No slug needed - server derives tenant from JWT
        const settingsResult = await api.getSettings();
        
        if (settingsResult.success) {
          setRestaurantName(settingsResult.restaurant?.name || '');
          setWhatsappNumber(settingsResult.restaurant?.whatsapp_number || '');
          setLocations(settingsResult.locations || []);
          // BULLDOZER: Save version for optimistic concurrency
          setSettingsVersion(settingsResult.version || 1);
          console.log('[BULLDOZER] Settings loaded, version:', settingsResult.version);
        }

        await loadOrders();
      } catch (e) {
        console.error('[BULLDOZER] Load initial data failed:', e);
        setConnectionStatus('error');
      }
      setLoading(false);
    };

    loadInitialData();
  }, [apiInitialized]);

  // ============================================================
  // LOAD ORDERS WHEN DATE CHANGES
  // ============================================================
  useEffect(() => {
    if (!loading && apiInitialized) {
      loadOrders();
    }
  }, [selectedDate]);

  // ============================================================
  // LOAD ORDERS
  // ============================================================
  const loadOrders = useCallback(async () => {
    if (!apiInitialized) return;
    
    setOrdersLoading(true);
    try {
      // BULLDOZER: No slug needed
      const result = await api.getOrders(selectedDate);
      if (result.success) {
        setOrders(result.orders || []);
      }
    } catch (e) {
      console.error('[BULLDOZER] Load orders failed:', e);
      if (e.message === 'SAFE_MODE_CIRCUIT_OPEN') {
        setSafeMode(true);
      }
    }
    setOrdersLoading(false);
  }, [selectedDate, apiInitialized]);

  // ============================================================
  // UPDATE ORDER STATUS
  // ============================================================
  const updateOrderStatus = async (orderId, newStatus) => {
    if (safeMode) {
      alert('Modalità sicura attiva. Riprova tra qualche secondo.');
      return;
    }
    
    try {
      // BULLDOZER: No slug needed
      const result = await api.updateOrderStatus(orderId, newStatus);
      if (result.success) {
        showNotification();
        loadOrders();
      } else {
        alert('Errore aggiornamento stato: ' + (result.error || 'Sconosciuto'));
      }
    } catch (e) {
      console.error('[BULLDOZER] Update order status failed:', e);
      if (e.message === 'SAFE_MODE_CIRCUIT_OPEN') {
        setSafeMode(true);
        alert('Connessione instabile. Riprova tra qualche secondo.');
      } else {
        alert('Errore: ' + e.message);
      }
    }
  };

  // ============================================================
  // ADVANCE ORDER STATUS
  // ============================================================
  const advanceOrderStatus = (order) => {
    const currentStatus = ORDER_STATUSES[order.status];
    if (currentStatus?.next) {
      updateOrderStatus(order.id, currentStatus.next);
    }
  };

  // ============================================================
  // SAVE ALL CONFIGURATIONS (BULLDOZER: with optimistic concurrency)
  // ============================================================
  const saveAllConfigurations = async () => {
    if (safeMode) {
      alert('Modalità sicura attiva. Riprova tra qualche secondo.');
      return;
    }
    
    setSaving(true);
    try {
      // BULLDOZER: Pass settings + restaurant + expectedVersion
      const result = await api.saveSettings(
        {
          settings: {}, // Future: additional settings
          restaurant: {
            name: restaurantName,
            whatsapp_number: whatsappNumber
          }
        },
        settingsVersion // BULLDOZER: For If-Match header
      );

      if (result.success) {
        // BULLDOZER: Update local version
        setSettingsVersion(result.version);
        showNotification();
        console.log('[BULLDOZER] Settings saved, new version:', result.version);
      } else if (result.error === 'VERSION_CONFLICT') {
        // BULLDOZER: Handle 409 conflict
        alert('Qualcun altro ha modificato le impostazioni. La pagina verrà ricaricata.');
        window.location.reload();
      } else {
        alert('Errore nel salvataggio: ' + (result.error || 'Sconosciuto'));
      }
    } catch (e) {
      console.error('[BULLDOZER] Save settings failed:', e);
      if (e.message === 'SAFE_MODE_CIRCUIT_OPEN') {
        setSafeMode(true);
        alert('Connessione instabile. Riprova tra qualche secondo.');
      } else if (e.status === 409) {
        alert('Qualcun altro ha modificato le impostazioni. La pagina verrà ricaricata.');
        window.location.reload();
      } else {
        alert('Errore: ' + e.message);
      }
    }
    setSaving(false);
  };

  // ============================================================
  // SHOW NOTIFICATION
  // ============================================================
  const showNotification = () => {
    setShowSaveNotification(true);
    setTimeout(() => setShowSaveNotification(false), 3000);
  };

  // ============================================================
  // LOADING STATE (Clerk not ready)
  // ============================================================
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Inizializzazione autenticazione...</p>
        </div>
      </div>
    );
  }

  // ============================================================
  // NOT SIGNED IN
  // ============================================================
  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-lg">
          <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Accesso Richiesto</h1>
          <p className="text-gray-600">Effettua il login per accedere al pannello admin.</p>
        </div>
      </div>
    );
  }

  // ============================================================
  // LOADING STATE (Data loading)
  // ============================================================
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Caricamento da API Worker...</p>
        </div>
      </div>
    );
  }

  // ============================================================
  // MAIN RENDER
  // ============================================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        
        {/* BULLDOZER: Safe Mode Banner */}
        {safeMode && (
          <div className="mb-4 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 flex-shrink-0" />
            <div>
              <p className="font-semibold">Modalità sicura attiva</p>
              <p className="text-sm">Connessione instabile. Le modifiche sono temporaneamente disabilitate.</p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">⚙️ Admin Panel - Ordinlampo</h1>
              <p className="text-gray-600">Gestisci ordini e configurazioni</p>
              <div className="mt-2 flex items-center gap-4">
                {connectionStatus === 'connected' ? (
                  <span className="text-green-600 text-sm flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                    Connesso a Worker API
                  </span>
                ) : (
                  <span className="text-red-600 text-sm flex items-center gap-1">
                    <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                    Errore connessione
                  </span>
                )}
                {/* BULLDOZER: Show version */}
                <span className="text-gray-400 text-xs">v{settingsVersion}</span>
              </div>
            </div>
            <button 
              onClick={saveAllConfigurations} 
              disabled={saving || safeMode}
              className={`bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${safeMode ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Save className="w-5 h-5" />
              <span>{saving ? 'Salvataggio...' : 'Salva Modifiche'}</span>
            </button>
          </div>
        </div>

        {/* Save Notification */}
        {showSaveNotification && (
          <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2 z-50">
            <Save className="w-5 h-5" /><span>Salvato!</span>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg mb-6">
          <div className="flex border-b">
            <button onClick={() => setActiveTab('orders')}
              className={`flex-1 px-6 py-4 font-semibold flex items-center justify-center space-x-2 transition-colors ${activeTab === 'orders' ? 'bg-orange-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
              <ShoppingBag className="w-5 h-5" /><span>Ordini ({orders.length})</span>
            </button>
            <button onClick={() => setActiveTab('locations')}
              className={`flex-1 px-6 py-4 font-semibold flex items-center justify-center space-x-2 transition-colors ${activeTab === 'locations' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
              <MapPin className="w-5 h-5" /><span>Località</span>
            </button>
            <button onClick={() => setActiveTab('settings')}
              className={`flex-1 px-6 py-4 font-semibold flex items-center justify-center space-x-2 transition-colors ${activeTab === 'settings' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
              <Settings className="w-5 h-5" /><span>Impostazioni</span>
            </button>
          </div>

          <div className="p-6">
            {/* ORDERS TAB */}
            {activeTab === 'orders' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-800">Ordini del Giorno</h2>
                  <div className="flex items-center gap-3">
                    <input 
                      type="date" 
                      value={selectedDate} 
                      onChange={(e) => setSelectedDate(e.target.value)} 
                      className="border rounded-lg px-3 py-2" 
                    />
                    <button 
                      onClick={loadOrders} 
                      disabled={ordersLoading || safeMode}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-4 h-4 ${ordersLoading ? 'animate-spin' : ''}`} />
                      Aggiorna
                    </button>
                  </div>
                </div>

                {orders.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">Nessun ordine per questa data</p>
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
                                <span className="text-xl font-bold text-gray-800">#{order.order_number}</span>
                                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusInfo.color}`}>
                                  {statusInfo.label}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className="text-gray-600"><strong>Cliente:</strong> {order.customer_name}</p>
                                  <p className="text-gray-600"><strong>Telefono:</strong> {order.customer_phone}</p>
                                </div>
                                <div>
                                  <p className="text-gray-600"><strong>Orario:</strong> {order.scheduled_time?.substring(0, 5) || '-'}</p>
                                  {/* BULLDOZER: Use toNumber() */}
                                  <p className="text-gray-600"><strong>Totale:</strong> €{toNumber(order.total).toFixed(2)}</p>
                                </div>
                              </div>
                              {order.delivery_address && (
                                <p className="text-gray-600 text-sm mt-2">
                                  <strong>Indirizzo:</strong> {order.delivery_address}
                                </p>
                              )}
                              {order.notes && (
                                <p className="text-gray-600 text-sm mt-1 italic">Note: {order.notes}</p>
                              )}
                            </div>
                            <div className="flex flex-col gap-2 ml-4">
                              {statusInfo.next && (
                                <button 
                                  onClick={() => advanceOrderStatus(order)}
                                  disabled={safeMode}
                                  className={`bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 text-sm ${safeMode ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                  <CheckCircle className="w-4 h-4" />Avanza
                                </button>
                              )}
                              {order.status === 'PENDING' && (
                                <button 
                                  onClick={() => updateOrderStatus(order.id, 'CANCELLED')}
                                  disabled={safeMode}
                                  className={`bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-700 text-sm ${safeMode ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
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

            {/* LOCATIONS TAB */}
            {activeTab === 'locations' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800">Località di Consegna</h2>
                {locations.length === 0 ? (
                  <p className="text-gray-500">Nessuna località configurata.</p>
                ) : (
                  <div className="space-y-3">
                    {locations.map(location => (
                      <div 
                        key={location.id} 
                        className={`bg-gray-50 rounded-lg p-4 flex items-center justify-between ${!location.is_active ? 'opacity-50' : ''}`}
                      >
                        <div className="flex items-center space-x-4 flex-1">
                          <MapPin className={`w-6 h-6 ${location.is_active ? 'text-blue-600' : 'text-gray-400'}`} />
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-800">{location.name}</h3>
                            {/* BULLDOZER: Use toNumber() */}
                            <p className="text-sm text-gray-600">
                              Tariffa: €{toNumber(location.delivery_fee).toFixed(2)} • Tempo: {location.delivery_time_minutes || '-'} min
                            </p>
                          </div>
                        </div>
                        {location.is_active ? (
                          <Eye className="w-5 h-5 text-green-600" />
                        ) : (
                          <EyeOff className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    ))}
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
                    <input 
                      type="text" 
                      value={restaurantName} 
                      onChange={(e) => setRestaurantName(e.target.value)} 
                      disabled={safeMode}
                      className={`w-full border rounded px-3 py-2 ${safeMode ? 'bg-gray-100' : ''}`}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-2">Numero WhatsApp</label>
                    <input 
                      type="text" 
                      value={whatsappNumber} 
                      onChange={(e) => setWhatsappNumber(e.target.value)} 
                      placeholder="393896382394" 
                      disabled={safeMode}
                      className={`w-full border rounded px-3 py-2 ${safeMode ? 'bg-gray-100' : ''}`}
                    />
                  </div>
                  <div className="pt-4 border-t">
                    <h3 className="font-semibold mb-2">Connessione API</h3>
                    <div className="bg-white rounded p-3 space-y-1">
                      <p className="text-sm text-gray-600">
                        URL: {import.meta.env.VITE_API_BASE_URL || 'https://ordini-lampo-api.ordini-lampo.workers.dev'}
                      </p>
                      {/* BULLDOZER: No more slug shown */}
                      <p className="text-sm text-gray-600">
                        Tenant: <span className="text-green-600 font-mono">Derivato da JWT</span>
                      </p>
                      <p className="text-sm text-gray-600">
                        Settings Version: <span className="font-mono">{settingsVersion}</span>
                      </p>
                      <div className="mt-2 flex items-center gap-3">
                        {connectionStatus === 'connected' ? (
                          <span className="text-green-600 text-sm font-semibold">✅ Connesso</span>
                        ) : (
                          <span className="text-red-600 text-sm font-semibold">❌ Errore</span>
                        )}
                        {safeMode && (
                          <span className="text-amber-600 text-sm font-semibold">⚠️ Safe Mode</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm">
          Ordini-Lampo Admin v3.0 BULLDOZER • Zero-Trust • Worker API
        </div>
      </div>
    </div>
  );
}
