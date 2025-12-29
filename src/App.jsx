import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Eye, EyeOff, MapPin, Settings, ShoppingBag, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { api } from './apiClient';

const RESTAURANT_SLUG = 'pokenjoy-demo';

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

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      const isConnected = await api.testConnection();
      setConnectionStatus(isConnected ? 'connected' : 'error');
      if (!isConnected) {
        alert('Errore connessione API Worker.');
        setLoading(false);
        return;
      }
      const settingsResult = await api.getSettings(RESTAURANT_SLUG);
      if (settingsResult.success) {
        setRestaurantName(settingsResult.restaurant?.name || '');
        setWhatsappNumber(settingsResult.restaurant?.whatsapp_number || '');
        setLocations(settingsResult.locations || []);
      }
      await loadOrders();
      setLoading(false);
    };
    loadInitialData();
  }, []);

  useEffect(() => {
    if (!loading) loadOrders();
  }, [selectedDate]);

  const loadOrders = async () => {
    setOrdersLoading(true);
    const result = await api.getOrders(RESTAURANT_SLUG, selectedDate);
    if (result.success) setOrders(result.orders || []);
    setOrdersLoading(false);
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    const result = await api.updateOrderStatus(RESTAURANT_SLUG, orderId, newStatus);
    if (result.success) {
      showNotification();
      loadOrders();
    } else {
      alert('Errore aggiornamento stato');
    }
  };

  const advanceOrderStatus = (order) => {
    const currentStatus = ORDER_STATUSES[order.status];
    if (currentStatus?.next) updateOrderStatus(order.id, currentStatus.next);
  };

  const saveAllConfigurations = async () => {
    setLoading(true);
    const result = await api.saveSettings(RESTAURANT_SLUG, {
      name: restaurantName,
      whatsapp_number: whatsappNumber
    });
    if (result.success) showNotification();
    else alert('Errore nel salvataggio.');
    setLoading(false);
  };

  const showNotification = () => {
    setShowSaveNotification(true);
    setTimeout(() => setShowSaveNotification(false), 3000);
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">⚙️ Admin Panel - Ordinlampo</h1>
              <p className="text-gray-600">Gestisci ordini e configurazioni</p>
              <div className="mt-2 flex items-center gap-2">
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
              </div>
            </div>
            <button onClick={saveAllConfigurations} disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50">
              <Save className="w-5 h-5" /><span>Salva Modifiche</span>
            </button>
          </div>
        </div>

        {showSaveNotification && (
          <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2 z-50">
            <Save className="w-5 h-5" /><span>Salvato!</span>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg mb-6">
          <div className="flex border-b">
            <button onClick={() => setActiveTab('orders')}
              className={`flex-1 px-6 py-4 font-semibold flex items-center justify-center space-x-2 ${activeTab === 'orders' ? 'bg-orange-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
              <ShoppingBag className="w-5 h-5" /><span>Ordini ({orders.length})</span>
            </button>
            <button onClick={() => setActiveTab('locations')}
              className={`flex-1 px-6 py-4 font-semibold flex items-center justify-center space-x-2 ${activeTab === 'locations' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
              <MapPin className="w-5 h-5" /><span>Località</span>
            </button>
            <button onClick={() => setActiveTab('settings')}
              className={`flex-1 px-6 py-4 font-semibold flex items-center justify-center space-x-2 ${activeTab === 'settings' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
              <Settings className="w-5 h-5" /><span>Impostazioni</span>
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'orders' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-800">Ordini del Giorno</h2>
                  <div className="flex items-center gap-3">
                    <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="border rounded-lg px-3 py-2" />
                    <button onClick={loadOrders} disabled={ordersLoading}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50">
                      <RefreshCw className={`w-4 h-4 ${ordersLoading ? 'animate-spin' : ''}`} />Aggiorna
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
                                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusInfo.color}`}>{statusInfo.label}</span>
                              </div>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className="text-gray-600"><strong>Cliente:</strong> {order.customer_name}</p>
                                  <p className="text-gray-600"><strong>Telefono:</strong> {order.customer_phone}</p>
                                </div>
                                <div>
                                  <p className="text-gray-600"><strong>Orario:</strong> {order.scheduled_time?.substring(0, 5) || '-'}</p>
                                  <p className="text-gray-600"><strong>Totale:</strong> €{parseFloat(order.total || 0).toFixed(2)}</p>
                                </div>
                              </div>
                              {order.delivery_address && <p className="text-gray-600 text-sm mt-2"><strong>Indirizzo:</strong> {order.delivery_address}</p>}
                              {order.notes && <p className="text-gray-600 text-sm mt-1 italic">Note: {order.notes}</p>}
                            </div>
                            <div className="flex flex-col gap-2 ml-4">
                              {statusInfo.next && (
                                <button onClick={() => advanceOrderStatus(order)}
                                  className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 text-sm">
                                  <CheckCircle className="w-4 h-4" />Avanza
                                </button>
                              )}
                              {order.status === 'PENDING' && (
                                <button onClick={() => updateOrderStatus(order.id, 'CANCELLED')}
                                  className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-700 text-sm">
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

            {activeTab === 'locations' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800">Località di Consegna</h2>
                {locations.length === 0 ? (
                  <p className="text-gray-500">Nessuna località configurata.</p>
                ) : (
                  <div className="space-y-3">
                    {locations.map(location => (
                      <div key={location.id} className={`bg-gray-50 rounded-lg p-4 flex items-center justify-between ${!location.is_active ? 'opacity-50' : ''}`}>
                        <div className="flex items-center space-x-4 flex-1">
                          <MapPin className={`w-6 h-6 ${location.is_active ? 'text-blue-600' : 'text-gray-400'}`} />
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-800">{location.name}</h3>
                            <p className="text-sm text-gray-600">Tariffa: €{parseFloat(location.delivery_fee || 0).toFixed(2)} • Tempo: {location.delivery_time_minutes || '-'} min</p>
                          </div>
                        </div>
                        {location.is_active ? <Eye className="w-5 h-5 text-green-600" /> : <EyeOff className="w-5 h-5 text-gray-400" />}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800">Impostazioni</h2>
                <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                  <div>
                    <label className="block font-semibold mb-2">Nome Ristorante</label>
                    <input type="text" value={restaurantName} onChange={(e) => setRestaurantName(e.target.value)} className="w-full border rounded px-3 py-2" />
                  </div>
                  <div>
                    <label className="block font-semibold mb-2">Numero WhatsApp</label>
                    <input type="text" value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} placeholder="393896382394" className="w-full border rounded px-3 py-2" />
                  </div>
                  <div className="pt-4 border-t">
                    <h3 className="font-semibold mb-2">Connessione API</h3>
                    <div className="bg-white rounded p-3">
                      <p className="text-sm text-gray-600">URL: https://ordini-lampo-api.ordini-lampo.workers.dev</p>
                      <p className="text-sm text-gray-600">Slug: {RESTAURANT_SLUG}</p>
                      <div className="mt-2">
                        {connectionStatus === 'connected' ? (
                          <span className="text-green-600 text-sm font-semibold">✅ Connesso</span>
                        ) : (
                          <span className="text-red-600 text-sm font-semibold">❌ Errore</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="text-center text-gray-500 text-sm">Ordini-Lampo Admin v2.1.0 • Worker API</div>
      </div>
    </div>
  );
}
