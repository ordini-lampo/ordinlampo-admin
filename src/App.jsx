import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Edit2, Eye, EyeOff, DollarSign, MapPin, Clock, Settings, CreditCard, Star, AlertCircle, Phone, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase, getRestaurantConfig, saveRestaurantConfig, testConnection } from './supabaseClient';

// ============================================
// 🔐 ADMIN PANEL ORDINLAMPO - SUPER-IBRIDO
// Versione Finale: Gemini UI + Claude Stability
// ============================================

const RESTAURANT_ID = '11111111-1111-1111-1111-111111111111';

const STRIPE_PRICES = {
  pro: 'price_1SYVGw2LTzIeFZapPaXMWqzx',
  multi_sede: 'price_1SYVJD2LTzIeFZapYo3eewM7'
};

const SUPABASE_FUNCTIONS_URL = 'https://juwusmklaavhshwkfjjs.supabase.co/functions/v1';

export default function OrdinlampoAdmin() {
  // ============================================
  // STATE
  // ============================================
  
  const [locations, setLocations] = useState([
    { id: 'sanremo', name: 'Sanremo', fee: 3.50, estimatedTime: '15-20 min', active: true },
    { id: 'poggio', name: 'Poggio', fee: 5.00, estimatedTime: '20-25 min', active: true },
    { id: 'bussana', name: 'Bussana', fee: 5.00, estimatedTime: '25-30 min', active: true },
    { id: 'ospedaletti', name: 'Ospedaletti', fee: 5.00, estimatedTime: '20-25 min', active: true },
    { id: 'coldirodi', name: 'Coldirodi', fee: 6.00, estimatedTime: '20-25 min', active: true }
  ]);

  const [pokeSizes, setPokeSizes] = useState([
    { id: 'small', name: 'Piccola', price: 8.50, emoji: '🥣' },
    { id: 'medium', name: 'Media', price: 10.50, emoji: '🍜' },
    { id: 'large', name: 'Grande', price: 12.50, emoji: '🍲' }
  ]);

  const [extraPrices, setExtraPrices] = useState({ protein: 1.00, ingredient: 0.50, sauce: 0.30 });
  const [floorDelivery, setFloorDelivery] = useState({ enabled: true, fee: 1.50 });
  const [riderTip, setRiderTip] = useState(1.00);
  const [whatsappNumber, setWhatsappNumber] = useState('393896382394');
  const [restaurantName, setRestaurantName] = useState('Pokenjoy Sanremo');

  // UI State
  const [activeTab, setActiveTab] = useState('locations');
  const [editingLocation, setEditingLocation] = useState(null);
  const [newLocation, setNewLocation] = useState({ name: '', fee: '', estimatedTime: '' });
  const [showSaveNotification, setShowSaveNotification] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const [loading, setLoading] = useState(true);
  
  // Ordini & Notifiche Piano B
  const [newOrders, setNewOrders] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNewOrderAlert, setShowNewOrderAlert] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  // Stripe & Settings
  const [subscriptionStatus, setSubscriptionStatus] = useState('trial');
  const [planId, setPlanId] = useState('normal');
  const [currentPeriodEnd, setCurrentPeriodEnd] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [showRiderCompensation, setShowRiderCompensation] = useState(false);
  const [riderCompensationAmount, setRiderCompensationAmount] = useState(null);
  const [allowDeliveryFeeEdit, setAllowDeliveryFeeEdit] = useState(true);
  const [allowRiderCompensationDisplay, setAllowRiderCompensationDisplay] = useState(true);
  const [forceRiderCompensation, setForceRiderCompensation] = useState(false);
  const [deliveryEnabled, setDeliveryEnabled] = useState(true);

  // ============================================
  // HANDLERS
  // ============================================

  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.error('Errore suono:', error);
    }
  };

  const loadOrders = async () => {
    setLoadingOrders(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('restaurant_id', RESTAURANT_ID)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      if (data) setOrders(data);
    } catch (error) {
      console.error('Errore caricamento ordini:', error);
    }
    setLoadingOrders(false);
  };

  const addLocation = () => {
    if (newLocation.name && newLocation.fee && newLocation.estimatedTime) {
      const id = newLocation.name.toLowerCase().replace(/\s+/g, '-');
      setLocations([...locations, {
        id,
        name: newLocation.name,
        fee: parseFloat(newLocation.fee),
        estimatedTime: newLocation.estimatedTime,
        active: true
      }]);
      setNewLocation({ name: '', fee: '', estimatedTime: '' });
      showNotification();
    }
  };

  const updateLocation = (id, updates) => {
    setLocations(locations.map(loc => loc.id === id ? { ...loc, ...updates } : loc));
    setEditingLocation(null);
    showNotification();
  };

  const deleteLocation = (id) => {
    if (window.confirm('Eliminare questa località?')) {
      setLocations(locations.filter(loc => loc.id !== id));
      showNotification();
    }
  };

  const toggleLocationActive = (id) => {
    setLocations(locations.map(loc => loc.id === id ? { ...loc, active: !loc.active } : loc));
    showNotification();
  };

  const updatePokeSize = (id, field, value) => {
    setPokeSizes(pokeSizes.map(s => s.id === id ? { ...s, [field]: parseFloat(value) } : s));
    showNotification();
  };

  const updateExtraPrice = (field, value) => {
    setExtraPrices({ ...extraPrices, [field]: parseFloat(value) });
    showNotification();
  };

  const handleSubscribe = async (priceId) => {
    setCheckoutLoading(true);
    try {
      const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId,
          restaurantId: RESTAURANT_ID,
          returnUrl: window.location.origin
        })
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Errore creazione pagamento.');
      }
    } catch (error) {
      console.error('Errore checkout:', error);
      alert('Errore connessione.');
    }
    setCheckoutLoading(false);
  };

  const saveAllConfigurations = async () => {
    setLoading(true);
    
    const config = {
      delivery_locations: locations,
      poke_sizes: pokeSizes,
      extra_prices: extraPrices,
      floor_delivery: floorDelivery,
      rider_tip: riderTip,
      whatsapp_number: whatsappNumber,
      restaurant_name: restaurantName,
      delivery_fee: deliveryFee,
      show_rider_compensation: showRiderCompensation,
      rider_compensation_amount: riderCompensationAmount,
      last_updated: new Date().toISOString()
    };

    const result = await saveRestaurantConfig(RESTAURANT_ID, config);
    
    if (result) {
      showNotification();
    } else {
      alert('Errore nel salvataggio.');
    }
    setLoading(false);
  };

  const showNotification = () => {
    setShowSaveNotification(true);
    setTimeout(() => setShowSaveNotification(false), 3000);
  };

  const getStatusBadge = () => {
    if (planId === 'pro' && subscriptionStatus === 'active') {
      return (
        <span className="px-3 py-1 rounded-full text-sm font-bold bg-gradient-to-r from-yellow-400 to-orange-500 text-white flex items-center gap-1">
          <Star className="w-4 h-4" /> PRO
        </span>
      );
    }
    return <span className="px-3 py-1 rounded-full text-sm font-bold bg-blue-100 text-blue-800">Trial</span>;
  };

  // ============================================
  // LIFECYCLE
  // ============================================

  useEffect(() => {
    const loadConfig = async () => {
      setLoading(true);
      const isConnected = await testConnection();
      setConnectionStatus(isConnected ? 'connected' : 'error');
      
      if (!isConnected) {
        alert('Errore connessione Supabase.');
        setLoading(false);
        return;
      }

      // Load delivery toggle
      try {
        const { data: restaurantData, error } = await supabase
          .from('restaurants')
          .select('delivery_enabled')
          .eq('id', RESTAURANT_ID)
          .single();
        
        if (restaurantData && !error) {
          setDeliveryEnabled(restaurantData.delivery_enabled ?? true);
        }
      } catch (err) {
        console.error('Errore delivery_enabled:', err);
        setDeliveryEnabled(true);
      }

      // Load config
      const config = await getRestaurantConfig(RESTAURANT_ID);
      if (config) {
        if (config.subscription_status) setSubscriptionStatus(config.subscription_status);
        if (config.plan_id) setPlanId(config.plan_id);
        if (config.current_period_end) setCurrentPeriodEnd(config.current_period_end);
        
        if (config.delivery_fee !== undefined) setDeliveryFee(config.delivery_fee);
        if (config.show_rider_compensation !== undefined) setShowRiderCompensation(config.show_rider_compensation);
        if (config.rider_compensation_amount !== undefined) setRiderCompensationAmount(config.rider_compensation_amount);
        if (config.allow_delivery_fee_edit !== undefined) setAllowDeliveryFeeEdit(config.allow_delivery_fee_edit);
        if (config.allow_rider_compensation_display !== undefined) setAllowRiderCompensationDisplay(config.allow_rider_compensation_display);
        if (config.force_rider_compensation !== undefined) setForceRiderCompensation(config.force_rider_compensation);
        
        if (config.settings) {
          const s = config.settings;
          if (s.delivery_locations) setLocations(s.delivery_locations);
          if (s.poke_sizes) setPokeSizes(s.poke_sizes);
          if (s.extra_prices) setExtraPrices(s.extra_prices);
          if (s.floor_delivery) setFloorDelivery(s.floor_delivery);
          if (s.rider_tip) setRiderTip(s.rider_tip);
          if (s.whatsapp_number) setWhatsappNumber(s.whatsapp_number);
          if (s.restaurant_name) setRestaurantName(s.restaurant_name);
        }
      }
      setLoading(false);
    };

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('session_id') || urlParams.get('canceled')) {
      window.history.replaceState({}, '', window.location.pathname);
      if (urlParams.get('canceled')) alert('Pagamento annullato.');
    }

    // Realtime subscription
    const channel = supabase
      .channel('orders-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'orders',
        filter: `restaurant_id=eq.${RESTAURANT_ID}`
      }, (payload) => {
        console.log('🔔 NUOVO ORDINE!', payload.new);
        setNewOrders(prev => [payload.new, ...prev]);
        setUnreadCount(prev => prev + 1);
        setShowNewOrderAlert(true);
        playNotificationSound();
        if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 200]);
        loadOrders();
        setTimeout(() => setShowNewOrderAlert(false), 15000);
      })
      .subscribe();

    loadOrders();
    loadConfig();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // ============================================
  // RENDER
  // ============================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento configurazioni...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 border border-gray-100">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h1 className="text-3xl font-bold text-gray-800">⚙️ Admin Panel</h1>
                {getStatusBadge()}
                
                {/* Badge Ordini Non Letti */}
                {unreadCount > 0 && (
                  <span className="relative inline-flex items-center px-4 py-2 rounded-full bg-red-600 text-white font-bold animate-pulse">
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                    🔔 {unreadCount} {unreadCount === 1 ? 'nuovo' : 'nuovi'}
                  </span>
                )}
              </div>
              <p className="text-gray-600 mb-2">Gestisci le configurazioni del sistema</p>
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                <span className="text-sm text-gray-500">
                  {connectionStatus === 'connected' ? 'Database Connesso' : 'Errore Connessione'}
                </span>
              </div>
            </div>
            <button
              onClick={saveAllConfigurations}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg flex items-center gap-2 shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              <span>Salva Modifiche</span>
            </button>
          </div>
        </div>

        {/* Notifica Salvataggio */}
        {showSaveNotification && (
          <div className="fixed top-6 right-6 bg-green-500 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 z-50">
            <Save className="w-6 h-6" />
            <span className="font-bold text-lg">Salvato con successo!</span>
          </div>
        )}

        {/* Alert Nuovo Ordine - UI GEMINI + Stabilità Claude */}
        {showNewOrderAlert && newOrders.length > 0 && (
          <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 animate-bounce w-full max-w-lg px-4">
            <div className="bg-red-600 text-white p-6 rounded-2xl shadow-2xl border-4 border-white ring-4 ring-red-300">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">🔔</span>
                  <div>
                    <h3 className="text-2xl font-black uppercase tracking-wider">Nuovo Ordine!</h3>
                    <p className="text-xl font-medium opacity-90">
                      #{newOrders[0]?.order_number || 'N/A'} • {newOrders[0]?.customer_name || 'Cliente'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowNewOrderAlert(false)}
                  className="text-white hover:bg-red-700 p-2 rounded-full transition-colors"
                >
                  <span className="text-2xl">✕</span>
                </button>
              </div>
              
              {/* 2 Pulsanti: CHIAMA + VISUALIZZA (UI Gemini) */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                <a
                  href={`tel:${newOrders[0]?.customer_phone || ''}`}
                  className="bg-white text-red-600 py-3 rounded-xl font-black text-center flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors shadow-lg"
                >
                  <Phone className="w-6 h-6" />
                  CHIAMA ORA
                </a>
                <button
                  onClick={() => {
                    setActiveTab('orders');
                    setShowNewOrderAlert(false);
                  }}
                  className="bg-red-800 text-white py-3 rounded-xl font-bold border border-red-400 hover:bg-red-900 transition-colors"
                >
                  VISUALIZZA
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
          <div className="flex border-b overflow-x-auto">
            {[
              { id: 'locations', label: 'Località', icon: MapPin },
              { id: 'prices', label: 'Prezzi', icon: DollarSign },
              { id: 'subscription', label: 'Abbonamento', icon: CreditCard },
              { id: 'settings', label: 'Impostazioni', icon: Settings },
              { id: 'orders', label: 'Ordini', icon: Clock }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id === 'orders') setUnreadCount(0);
                }}
                className={`flex-1 py-4 px-6 font-bold flex items-center justify-center gap-2 transition-all ${
                  activeTab === tab.id ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.label}</span>
                {tab.id === 'orders' && unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                    {unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="p-6">
            
            {/* TAB LOCALITÀ */}
            {activeTab === 'locations' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Gestione Zone Consegna</h2>
                {locations.map(loc => (
                  <div
                    key={loc.id}
                    className={`bg-gray-50 p-4 rounded-xl flex items-center justify-between border ${
                      !loc.active ? 'opacity-60 border-dashed' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex-1">
                      {editingLocation === loc.id ? (
                        <div className="flex gap-2">
                          <input
                            className="border p-2 rounded w-1/3"
                            defaultValue={loc.name}
                            onBlur={(e) => updateLocation(loc.id, { name: e.target.value })}
                          />
                          <input
                            className="border p-2 rounded w-20"
                            type="number"
                            step="0.50"
                            defaultValue={loc.fee}
                            onBlur={(e) => updateLocation(loc.id, { fee: parseFloat(e.target.value) })}
                          />
                          <input
                            className="border p-2 rounded w-1/3"
                            defaultValue={loc.estimatedTime}
                            onBlur={(e) => updateLocation(loc.id, { estimatedTime: e.target.value })}
                          />
                        </div>
                      ) : (
                        <div>
                          <h3 className="font-bold text-lg">{loc.name}</h3>
                          <p className="text-gray-500">Tariffa: €{loc.fee.toFixed(2)} • Tempo: {loc.estimatedTime}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleLocationActive(loc.id)}
                        className="p-2 bg-white rounded-lg border hover:bg-gray-50 transition-colors"
                      >
                        {loc.active ? <Eye className="w-5 h-5 text-green-600" /> : <EyeOff className="w-5 h-5 text-gray-400" />}
                      </button>
                      <button
                        onClick={() => setEditingLocation(editingLocation === loc.id ? null : loc.id)}
                        className="p-2 bg-white rounded-lg border hover:bg-gray-50 transition-colors"
                      >
                        <Edit2 className="w-5 h-5 text-blue-600" />
                      </button>
                      <button
                        onClick={() => deleteLocation(loc.id)}
                        className="p-2 bg-white rounded-lg border hover:bg-gray-50 transition-colors"
                      >
                        <Trash2 className="w-5 h-5 text-red-600" />
                      </button>
                    </div>
                  </div>
                ))}
                
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mt-4">
                  <h3 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    Nuova Zona
                  </h3>
                  <div className="flex gap-2">
                    <input
                      className="border p-2 rounded flex-1"
                      placeholder="Nome zona"
                      value={newLocation.name}
                      onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                    />
                    <input
                      className="border p-2 rounded w-24"
                      type="number"
                      step="0.50"
                      placeholder="€"
                      value={newLocation.fee}
                      onChange={(e) => setNewLocation({ ...newLocation, fee: e.target.value })}
                    />
                    <input
                      className="border p-2 rounded w-32"
                      placeholder="20-25 min"
                      value={newLocation.estimatedTime}
                      onChange={(e) => setNewLocation({ ...newLocation, estimatedTime: e.target.value })}
                    />
                    <button
                      onClick={addLocation}
                      className="bg-blue-600 text-white px-6 rounded font-bold hover:bg-blue-700 transition-colors"
                    >
                      AGGIUNGI
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB PREZZI */}
            {activeTab === 'prices' && (
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                  <h3 className="text-lg font-bold mb-4">Taglie Bowl</h3>
                  <div className="space-y-2">
                    {pokeSizes.map(size => (
                      <div
                        key={size.id}
                        className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm"
                      >
                        <span className="font-medium text-lg">
                          {size.emoji} {size.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600">€</span>
                          <input
                            type="number"
                            step="0.50"
                            className="border p-1 w-20 rounded text-center font-bold"
                            value={size.price}
                            onChange={(e) => updatePokeSize(size.id, 'price', e.target.value)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                  <h3 className="text-lg font-bold mb-4">Prezzi Extra</h3>
                  <div className="space-y-2">
                    {Object.entries(extraPrices).map(([key, val]) => (
                      <div
                        key={key}
                        className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm"
                      >
                        <span className="capitalize font-medium">{key}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600">€</span>
                          <input
                            type="number"
                            step="0.10"
                            className="border p-1 w-20 rounded text-center font-bold"
                            value={val}
                            onChange={(e) => updateExtraPrice(key, e.target.value)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB ABBONAMENTO */}
            {activeTab === 'subscription' && (
              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-8 rounded-2xl border border-indigo-100">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                  <div>
                    <p className="text-indigo-600 font-bold uppercase tracking-wider text-sm mb-1">
                      Il tuo piano
                    </p>
                    <h2 className="text-4xl font-black text-gray-900 mb-2">
                      {planId === 'pro' ? 'PIANO PRO 🚀' : 'PIANO BASIC'}
                    </h2>
                    <p className="text-gray-600 flex items-center gap-2">
                      Stato:{' '}
                      <span className={`font-bold ${subscriptionStatus === 'active' ? 'text-green-600' : 'text-orange-500'}`}>
                        {subscriptionStatus.toUpperCase()}
                      </span>
                    </p>
                  </div>
                  {planId !== 'pro' && (
                    <button
                      onClick={() => handleSubscribe(STRIPE_PRICES.pro)}
                      disabled={checkoutLoading}
                      className="bg-orange-500 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-orange-600 hover:scale-105 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      <Star className="w-5 h-5 fill-current" />
                      {checkoutLoading ? 'Attendere...' : 'PASSA A PRO - €39.90'}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* TAB IMPOSTAZIONI */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                  <h3 className="font-bold text-lg mb-4">Info Generali</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block font-semibold text-gray-700 mb-2">Nome Ristorante</label>
                      <input
                        type="text"
                        className="w-full border p-3 rounded-lg"
                        value={restaurantName}
                        onChange={(e) => setRestaurantName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-gray-700 mb-2">Numero WhatsApp</label>
                      <input
                        type="text"
                        className="w-full border p-3 rounded-lg"
                        placeholder="393331234567"
                        value={whatsappNumber}
                        onChange={(e) => setWhatsappNumber(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Toggle Delivery */}
                <div className="bg-white p-6 rounded-xl border-2 border-blue-100 shadow-sm">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h3 className="font-bold text-xl text-gray-800">Modalità Operativa</h3>
                      <p className={`font-medium mt-1 ${deliveryEnabled ? 'text-green-600' : 'text-blue-600'}`}>
                        {deliveryEnabled ? '✅ DELIVERY + ASPORTO ATTIVI' : '🏪 SOLO RITIRO AL LOCALE'}
                      </p>
                    </div>
                    <button
                      onClick={async () => {
                        const newValue = !deliveryEnabled;
                        setDeliveryEnabled(newValue);
                        
                        try {
                          const { error: err1 } = await supabase
                            .from('restaurants')
                            .update({ delivery_enabled: newValue })
                            .eq('id', RESTAURANT_ID);
                          
                          if (err1) throw err1;
                          
                          const { error: err2 } = await supabase
                            .from('restaurant_settings')
                            .update({ enable_delivery: newValue })
                            .eq('restaurant_id', RESTAURANT_ID);
                          
                          if (err2) console.warn('Settings sync:', err2);
                          
                          showNotification();
                        } catch (error) {
                          console.error('Errore delivery toggle:', error);
                          alert('❌ Errore nel salvataggio');
                          setDeliveryEnabled(!newValue);
                        }
                      }}
                      className={`w-20 h-10 rounded-full relative transition-colors duration-300 shadow-inner ${
                        deliveryEnabled ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 bg-white rounded-full absolute top-1 shadow-md transition-all duration-300 ${
                          deliveryEnabled ? 'left-11' : 'left-1'
                        }`}
                      ></div>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB ORDINI - UI Gemini + Stabilità Claude */}
            {activeTab === 'orders' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Storico Ordini</h2>
                  <button
                    onClick={loadOrders}
                    className="text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg font-bold transition-colors"
                  >
                    🔄 Aggiorna Lista
                  </button>
                </div>
                
                {loadingOrders ? (
                  <div className="text-center py-10">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-500">Caricamento ordini...</p>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="bg-gray-50 rounded-lg p-8 text-center">
                    <p className="text-4xl mb-4">📭</p>
                    <p className="text-gray-600 text-lg">Nessun ordine ancora</p>
                    <p className="text-gray-500 text-sm mt-2">Gli ordini appariranno qui quando i clienti ordinano</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map(order => (
                      <div
                        key={order.id}
                        className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                      >
                        {/* Header Ordine */}
                        <div className="p-4 flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-50/50">
                          <div className="flex items-center gap-4 w-full md:w-auto">
                            <div
                              className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white ${
                                order.order_type === 'delivery' ? 'bg-orange-500' : 'bg-blue-500'
                              }`}
                            >
                              {order.order_type === 'delivery' ? '🛵' : '🥡'}
                            </div>
                            <div>
                              <h3 className="font-bold text-lg">#{order.order_number || order.id?.slice(0, 8)}</h3>
                              <p className="text-sm text-gray-500">
                                {new Date(order.created_at).toLocaleString('it-IT')}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                            <div className="text-right mr-2">
                              <p className="font-bold text-lg text-green-600">
                                €{(order.total_amount || order.total || 0).toFixed(2)}
                              </p>
                              <p className="text-xs text-gray-500 capitalize">
                                {order.payment_method || 'N/A'}
                              </p>
                            </div>
                            
                            {/* Pulsante CHIAMA - UI Gemini */}
                            {order.customer_phone && (
                              <a
                                href={`tel:${order.customer_phone}`}
                                className="bg-green-100 text-green-700 p-3 rounded-lg hover:bg-green-200 transition-colors"
                                title="Chiama Cliente"
                              >
                                <Phone className="w-5 h-5" />
                              </a>
                            )}
                            
                            <button
                              onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                              className="bg-gray-100 text-gray-600 p-3 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                              {expandedOrderId === order.id ? (
                                <ChevronUp className="w-5 h-5" />
                              ) : (
                                <ChevronDown className="w-5 h-5" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Dettagli Espandibili - UI Gemini + Stabilità Claude */}
                        {expandedOrderId === order.id && (
                          <div className="p-4 border-t border-gray-100 bg-white">
                            <div className="grid md:grid-cols-2 gap-6">
                              <div>
                                <h4 className="font-bold text-gray-700 mb-2 uppercase text-xs tracking-wider">
                                  Dati Cliente
                                </h4>
                                <p className="font-semibold text-lg">{order.customer_name || 'N/A'}</p>
                                <p className="text-gray-600 flex items-center gap-2">
                                  <Phone className="w-4 h-4" />
                                  {order.customer_phone || 'N/A'}
                                </p>
                                {order.delivery_address && (
                                  <p className="text-gray-600 mt-1">
                                    📍 {order.delivery_address} {order.customer_city || ''}
                                  </p>
                                )}
                                {order.customer_notes_order && (
                                  <div className="mt-3 bg-yellow-50 p-3 rounded text-sm text-yellow-800 border border-yellow-100">
                                    📝 Note: {order.customer_notes_order}
                                  </div>
                                )}
                              </div>
                              
                              <div>
                                <h4 className="font-bold text-gray-700 mb-2 uppercase text-xs tracking-wider">
                                  Riepilogo Ordine
                                </h4>
                                <div className="space-y-2 text-sm">
                                  {/* Safe access con fallback - Stabilità Claude */}
                                  {order.order_details ? (
                                    <div className="bg-blue-50 rounded p-3">
                                      <pre className="whitespace-pre-wrap text-xs overflow-x-auto">
                                        {JSON.stringify(order.order_details, null, 2)}
                                      </pre>
                                    </div>
                                  ) : (
                                    <div className="flex justify-between font-bold text-lg pt-2 border-t">
                                      <span>TOTALE</span>
                                      <span className="text-green-600">€{(order.total_amount || order.total || 0).toFixed(2)}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
