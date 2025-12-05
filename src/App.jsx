import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Edit2, Eye, EyeOff, DollarSign, MapPin, Clock, Settings, CreditCard, Star, AlertCircle } from 'lucide-react';
import { supabase, getRestaurantConfig, saveRestaurantConfig, testConnection } from './supabaseClient';

// ============================================
// 🔐 ADMIN PANEL ORDINLAMPO - POKENJOY
// ============================================

// ID Ristorante Pokenjoy (dal database)
const RESTAURANT_ID = '11111111-1111-1111-1111-111111111111';

// 💳 STRIPE CONFIGURATION
const STRIPE_PRICES = {
  pro: 'price_1SYVGw2LTzIeFZapPaXMWqzx',        // €39.90/mese
  multi_sede: 'price_1SYVJD2LTzIeFZapYo3eewM7'  // €29.90/mese
};

const SUPABASE_FUNCTIONS_URL = 'https://juwusmklaavhshwkfjjs.supabase.co/functions/v1';

export default function OrdinlampoAdmin() {
  // Stati per le configurazioni
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

  const [extraPrices, setExtraPrices] = useState({
    protein: 1.00,
    ingredient: 0.50,
    sauce: 0.30
  });

  const [floorDelivery, setFloorDelivery] = useState({
    enabled: true,
    fee: 1.50
  });

  const [riderTip, setRiderTip] = useState(1.00);
  const [whatsappNumber, setWhatsappNumber] = useState('393896382394');
  const [restaurantName, setRestaurantName] = useState('Pokenjoy Sanremo');

  const [activeTab, setActiveTab] = useState('locations');
  const [editingLocation, setEditingLocation] = useState(null);
  const [newLocation, setNewLocation] = useState({ name: '', fee: '', estimatedTime: '' });
  const [showSaveNotification, setShowSaveNotification] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const [loading, setLoading] = useState(true);

  // 💳 NUOVI STATI PER ABBONAMENTO
  const [subscriptionStatus, setSubscriptionStatus] = useState('trial');
  const [planId, setPlanId] = useState('normal');
  const [currentPeriodEnd, setCurrentPeriodEnd] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  // 🚚 STATI PER CONSEGNA E COMPENSO RIDER
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [showRiderCompensation, setShowRiderCompensation] = useState(false);
  const [riderCompensationAmount, setRiderCompensationAmount] = useState(null);
  const [allowDeliveryFeeEdit, setAllowDeliveryFeeEdit] = useState(true);
  const [allowRiderCompensationDisplay, setAllowRiderCompensationDisplay] = useState(true);
  const [forceRiderCompensation, setForceRiderCompensation] = useState(false);
  // 🚗 STATO PER TOGGLE DELIVERY ON/OFF
  const [deliveryEnabled, setDeliveryEnabled] = useState(true);

  // Funzioni per gestire le località
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
    setLocations(locations.map(loc => 
      loc.id === id ? { ...loc, ...updates } : loc
    ));
    setEditingLocation(null);
    showNotification();
  };

  const deleteLocation = (id) => {
    if (window.confirm('Sei sicuro di voler eliminare questa località?')) {
      setLocations(locations.filter(loc => loc.id !== id));
      showNotification();
    }
  };

  const toggleLocationActive = (id) => {
    setLocations(locations.map(loc =>
      loc.id === id ? { ...loc, active: !loc.active } : loc
    ));
    showNotification();
  };

  // Funzioni per gestire i prezzi
  const updatePokeSize = (id, field, value) => {
    setPokeSizes(pokeSizes.map(size =>
      size.id === id ? { ...size, [field]: parseFloat(value) } : size
    ));
    showNotification();
  };

  const updateExtraPrice = (field, value) => {
    setExtraPrices({ ...extraPrices, [field]: parseFloat(value) });
    showNotification();
  };

  const updateFloorDelivery = (field, value) => {
    setFloorDelivery({ ...floorDelivery, [field]: value });
    showNotification();
  };

  // ============================================
  // 💳 STRIPE CHECKOUT FUNCTION
  // ============================================
  const handleSubscribe = async (priceId) => {
    setCheckoutLoading(true);
    
    try {
      const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: priceId,
          restaurantId: RESTAURANT_ID,
          returnUrl: window.location.origin
        })
      });

      const data = await response.json();
      
      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        alert('Errore nella creazione del pagamento. Riprova.');
        console.error('Checkout error:', data.error);
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert('Errore di connessione. Verifica la tua connessione internet.');
    }
    
    setCheckoutLoading(false);
  };

  // ============================================
  // 🔄 SUPABASE INTEGRATION (SOSTITUISCE localStorage)
  // ============================================

  // Salvataggio configurazioni su Supabase
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

    // SOSTITUISCE: localStorage.setItem('pokenjoy_config', JSON.stringify(config))
    const result = await saveRestaurantConfig(RESTAURANT_ID, config);
    
    if (result) {
      showNotification();
      // Genera anche file di backup
      generateConfigFile(config);
    } else {
      alert('Errore nel salvataggio. Riprova.');
    }
    
    setLoading(false);
  };

  const generateConfigFile = (config) => {
    const jsContent = `// ============================================
// 🔧 CONFIGURAZIONE POKENJOY - AUTO-GENERATA
// Ultimo aggiornamento: ${new Date().toLocaleString('it-IT')}
// ============================================

export const POKENJOY_CONFIG = ${JSON.stringify(config, null, 2)};

// Per applicare questa configurazione:
// 1. Sostituisci le variabili corrispondenti nel file principale
// 2. Oppure importa questo file: import { POKENJOY_CONFIG } from './pokenjoy-config.js'
`;

    const blob = new Blob([jsContent], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pokenjoy-config.js';
    a.click();
  };

  const showNotification = () => {
    setShowSaveNotification(true);
    setTimeout(() => setShowSaveNotification(false), 3000);
  };

  // ============================================
  // 🔄 CARICAMENTO CONFIGURAZIONI DA SUPABASE
  // ============================================

  // Carica configurazioni salvate + stato abbonamento
  useEffect(() => {
    const loadConfig = async () => {
      setLoading(true);
      
      // Test connessione
      const isConnected = await testConnection();
      setConnectionStatus(isConnected ? 'connected' : 'error');
      
      if (!isConnected) {
        alert('Errore connessione Supabase. Controlla le credenziali.');
        setLoading(false);
        return;
      }

      // 🚗 Carica stato delivery_enabled dal database
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
      console.error('Errore caricamento delivery_enabled:', err);
      setDeliveryEnabled(true); // Default: delivery attivo
    }

      // Carica configurazioni ristorante
      const config = await getRestaurantConfig(RESTAURANT_ID);
      
      if (config) {
        // 💳 Carica stato abbonamento
        if (config.subscription_status) setSubscriptionStatus(config.subscription_status);
        if (config.plan_id) setPlanId(config.plan_id);
        if (config.current_period_end) setCurrentPeriodEnd(config.current_period_end);
        
        // 🚚 Carica impostazioni consegna e rider
        if (config.delivery_fee !== undefined) setDeliveryFee(config.delivery_fee);
        if (config.show_rider_compensation !== undefined) setShowRiderCompensation(config.show_rider_compensation);
        if (config.rider_compensation_amount !== undefined) setRiderCompensationAmount(config.rider_compensation_amount);
        if (config.allow_delivery_fee_edit !== undefined) setAllowDeliveryFeeEdit(config.allow_delivery_fee_edit);
        if (config.allow_rider_compensation_display !== undefined) setAllowRiderCompensationDisplay(config.allow_rider_compensation_display);
        if (config.force_rider_compensation !== undefined) setForceRiderCompensation(config.force_rider_compensation);
        
        // Carica settings se presenti
        if (config.settings) {
          const settings = config.settings;
          if (settings.delivery_locations) setLocations(settings.delivery_locations);
          if (settings.poke_sizes) setPokeSizes(settings.poke_sizes);
          if (settings.extra_prices) setExtraPrices(settings.extra_prices);
          if (settings.floor_delivery) setFloorDelivery(settings.floor_delivery);
          if (settings.rider_tip) setRiderTip(settings.rider_tip);
          if (settings.whatsapp_number) setWhatsappNumber(settings.whatsapp_number);
          if (settings.restaurant_name) setRestaurantName(settings.restaurant_name);
        }
        
        console.log('✅ Configurazioni caricate da Supabase');
      } else {
        console.log('⚠️ Nessuna configurazione trovata, uso defaults');
      }
      
      setLoading(false);
    };

    // Check URL params for Stripe redirect
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('session_id')) {
      // Payment successful, reload to get updated status
      window.history.replaceState({}, '', window.location.pathname);
    }
    if (urlParams.get('canceled')) {
      alert('Pagamento annullato. Puoi riprovare quando vuoi.');
      window.history.replaceState({}, '', window.location.pathname);
    }

    loadConfig();
  }, []);

  // Helper per formattare la data
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  // Helper per status badge
  const getStatusBadge = () => {
    if (planId === 'pro' && subscriptionStatus === 'active') {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
          <Star className="w-4 h-4 mr-1" />
          PRO
        </span>
      );
    }
    if (subscriptionStatus === 'past_due') {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-800">
          <AlertCircle className="w-4 h-4 mr-1" />
          Pagamento in ritardo
        </span>
      );
    }
    if (subscriptionStatus === 'canceled') {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-gray-100 text-gray-800">
          Cancellato
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
        Trial
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Caricamento configurazioni da Supabase...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-800">
                  ⚙️ Admin Panel - Ordinlampo
                </h1>
                {getStatusBadge()}
              </div>
              <p className="text-gray-600">Gestisci tutte le configurazioni del sistema</p>
              <div className="mt-2 flex items-center gap-2">
                {connectionStatus === 'connected' ? (
                  <span className="text-green-600 text-sm flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                    Connesso a Supabase
                  </span>
                ) : (
                  <span className="text-red-600 text-sm flex items-center gap-1">
                    <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                    Errore connessione
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={saveAllConfigurations}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              <span>Salva su Supabase</span>
            </button>
          </div>
        </div>

        {/* Notification */}
        {showSaveNotification && (
          <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2 animate-fade-in-down z-50">
            <Save className="w-5 h-5" />
            <span>Modifiche salvate su Supabase!</span>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg mb-6 overflow-hidden">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('locations')}
              className={`flex-1 px-6 py-4 font-semibold flex items-center justify-center space-x-2 transition-colors ${
                activeTab === 'locations'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <MapPin className="w-5 h-5" />
              <span>Località</span>
            </button>
            <button
              onClick={() => setActiveTab('prices')}
              className={`flex-1 px-6 py-4 font-semibold flex items-center justify-center space-x-2 transition-colors ${
                activeTab === 'prices'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <DollarSign className="w-5 h-5" />
              <span>Prezzi</span>
            </button>
            <button
              onClick={() => setActiveTab('subscription')}
              className={`flex-1 px-6 py-4 font-semibold flex items-center justify-center space-x-2 transition-colors ${
                activeTab === 'subscription'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <CreditCard className="w-5 h-5" />
              <span>Abbonamento</span>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex-1 px-6 py-4 font-semibold flex items-center justify-center space-x-2 transition-colors ${
                activeTab === 'settings'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Settings className="w-5 h-5" />
              <span>Impostazioni</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* LOCALITÀ TAB */}
            {activeTab === 'locations' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Località di Consegna</h2>

                {/* Lista località esistenti */}
                <div className="space-y-3">
                  {locations.map(location => (
                    <div
                      key={location.id}
                      className={`bg-gray-50 rounded-lg p-4 flex items-center justify-between ${
                        !location.active ? 'opacity-50' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-4 flex-1">
                        <MapPin className={`w-6 h-6 ${location.active ? 'text-blue-600' : 'text-gray-400'}`} />
                        <div className="flex-1">
                          {editingLocation === location.id ? (
                            <div className="flex items-center space-x-2">
                              <input
                                type="text"
                                defaultValue={location.name}
                                className="border rounded px-2 py-1"
                                onBlur={(e) => updateLocation(location.id, { name: e.target.value })}
                              />
                              <input
                                type="number"
                                step="0.50"
                                defaultValue={location.fee}
                                className="border rounded px-2 py-1 w-24"
                                onBlur={(e) => updateLocation(location.id, { fee: parseFloat(e.target.value) })}
                              />
                              <input
                                type="text"
                                defaultValue={location.estimatedTime}
                                className="border rounded px-2 py-1"
                                onBlur={(e) => updateLocation(location.id, { estimatedTime: e.target.value })}
                              />
                            </div>
                          ) : (
                            <>
                              <h3 className="font-semibold text-gray-800">{location.name}</h3>
                              <p className="text-sm text-gray-600">
                                Tariffa: €{location.fee.toFixed(2)} • Tempo: {location.estimatedTime}
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => toggleLocationActive(location.id)}
                          className="p-2 hover:bg-gray-200 rounded transition-colors"
                        >
                          {location.active ? (
                            <Eye className="w-5 h-5 text-green-600" />
                          ) : (
                            <EyeOff className="w-5 h-5 text-gray-400" />
                          )}
                        </button>
                        <button
                          onClick={() => setEditingLocation(editingLocation === location.id ? null : location.id)}
                          className="p-2 hover:bg-gray-200 rounded transition-colors"
                        >
                          <Edit2 className="w-5 h-5 text-blue-600" />
                        </button>
                        <button
                          onClick={() => deleteLocation(location.id)}
                          className="p-2 hover:bg-gray-200 rounded transition-colors"
                        >
                          <Trash2 className="w-5 h-5 text-red-600" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Aggiungi nuova località */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                    <Plus className="w-5 h-5 mr-2" />
                    Aggiungi Nuova Località
                  </h3>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder="Nome località"
                      value={newLocation.name}
                      onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                      className="flex-1 border rounded px-3 py-2"
                    />
                    <input
                      type="number"
                      step="0.50"
                      placeholder="Tariffa"
                      value={newLocation.fee}
                      onChange={(e) => setNewLocation({ ...newLocation, fee: e.target.value })}
                      className="w-24 border rounded px-3 py-2"
                    />
                    <input
                      type="text"
                      placeholder="Tempo (es. 20-25 min)"
                      value={newLocation.estimatedTime}
                      onChange={(e) => setNewLocation({ ...newLocation, estimatedTime: e.target.value })}
                      className="w-40 border rounded px-3 py-2"
                    />
                    <button
                      onClick={addLocation}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                    >
                      Aggiungi
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* PREZZI TAB */}
            {activeTab === 'prices' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Prezzi & Tariffe</h2>

                {/* Formati Pokè */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Formati Pokè</h3>
                  <div className="space-y-3">
                    {pokeSizes.map(size => (
                      <div key={size.id} className="flex items-center justify-between bg-white rounded-lg p-4">
                        <div className="flex items-center space-x-3">
                          <span className="text-3xl">{size.emoji}</span>
                          <span className="font-semibold text-gray-800">{size.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-600">€</span>
                          <input
                            type="number"
                            step="0.50"
                            value={size.price}
                            onChange={(e) => updatePokeSize(size.id, 'price', e.target.value)}
                            className="w-20 border rounded px-2 py-1 text-center font-semibold"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Prezzi Extra */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Prezzi Extra</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between bg-white rounded-lg p-4">
                      <span className="font-semibold text-gray-800">Proteina Extra (oltre le 2)</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-600">€</span>
                        <input
                          type="number"
                          step="0.10"
                          value={extraPrices.protein}
                          onChange={(e) => updateExtraPrice('protein', e.target.value)}
                          className="w-20 border rounded px-2 py-1 text-center font-semibold"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between bg-white rounded-lg p-4">
                      <span className="font-semibold text-gray-800">Ingrediente Extra (oltre i 4)</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-600">€</span>
                        <input
                          type="number"
                          step="0.10"
                          value={extraPrices.ingredient}
                          onChange={(e) => updateExtraPrice('ingredient', e.target.value)}
                          className="w-20 border rounded px-2 py-1 text-center font-semibold"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between bg-white rounded-lg p-4">
                      <span className="font-semibold text-gray-800">Salsa Extra (oltre le 2)</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-600">€</span>
                        <input
                          type="number"
                          step="0.10"
                          value={extraPrices.sauce}
                          onChange={(e) => updateExtraPrice('sauce', e.target.value)}
                          className="w-20 border rounded px-2 py-1 text-center font-semibold"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Servizi Opzionali */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Servizi Opzionali</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between bg-white rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={floorDelivery.enabled}
                          onChange={(e) => updateFloorDelivery('enabled', e.target.checked)}
                          className="w-5 h-5"
                        />
                        <span className="font-semibold text-gray-800">Consegna al Piano</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-600">€</span>
                        <input
                          type="number"
                          step="0.50"
                          value={floorDelivery.fee}
                          onChange={(e) => updateFloorDelivery('fee', parseFloat(e.target.value))}
                          disabled={!floorDelivery.enabled}
                          className="w-20 border rounded px-2 py-1 text-center font-semibold disabled:opacity-50"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between bg-white rounded-lg p-4">
                      <span className="font-semibold text-gray-800">Mancia Rider</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-600">€</span>
                        <input
                          type="number"
                          step="0.50"
                          value={riderTip}
                          onChange={(e) => setRiderTip(parseFloat(e.target.value))}
                          className="w-20 border rounded px-2 py-1 text-center font-semibold"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 💳 ABBONAMENTO TAB (NUOVO!) */}
            {activeTab === 'subscription' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">💳 Gestione Abbonamento</h2>

                {/* Stato attuale */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Stato Attuale</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Piano</p>
                      <p className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        {planId === 'pro' ? '⭐ PRO' : planId === 'multi_sede' ? '🏢 Multi-Sede' : '🆓 Normal'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <p className="text-xl font-bold">
                        {subscriptionStatus === 'active' && <span className="text-green-600">✅ Attivo</span>}
                        {subscriptionStatus === 'trial' && <span className="text-blue-600">🔄 Trial</span>}
                        {subscriptionStatus === 'past_due' && <span className="text-red-600">⚠️ Pagamento in ritardo</span>}
                        {subscriptionStatus === 'canceled' && <span className="text-gray-600">❌ Cancellato</span>}
                      </p>
                    </div>
                    {currentPeriodEnd && (
                      <div className="col-span-2">
                        <p className="text-sm text-gray-600">Prossimo rinnovo</p>
                        <p className="text-lg font-semibold text-gray-800">{formatDate(currentPeriodEnd)}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Piani disponibili */}
                {(planId === 'normal' || subscriptionStatus === 'trial' || subscriptionStatus === 'canceled') && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800">Passa a PRO</h3>
                    
                    {/* Piano PRO */}
                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 border-2 border-orange-300 relative overflow-hidden">
                      <div className="absolute top-0 right-0 bg-orange-500 text-white px-4 py-1 text-sm font-bold rounded-bl-lg">
                        CONSIGLIATO
                      </div>
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                            <Star className="w-6 h-6 text-orange-500" />
                            Piano PRO
                          </h4>
                          <p className="text-gray-600 mt-1">Ordini illimitati, zero commissioni</p>
                          <ul className="mt-4 space-y-2">
                            <li className="flex items-center gap-2 text-gray-700">
                              <span className="text-green-500">✓</span> Ordini illimitati
                            </li>
                            <li className="flex items-center gap-2 text-gray-700">
                              <span className="text-green-500">✓</span> Zero commissioni sugli ordini
                            </li>
                            <li className="flex items-center gap-2 text-gray-700">
                              <span className="text-green-500">✓</span> Supporto prioritario
                            </li>
                            <li className="flex items-center gap-2 text-gray-700">
                              <span className="text-green-500">✓</span> Statistiche avanzate
                            </li>
                          </ul>
                        </div>
                        <div className="text-right">
                          <p className="text-4xl font-bold text-gray-800">€39,90</p>
                          <p className="text-gray-600">/mese</p>
                          <button
                            onClick={() => handleSubscribe(STRIPE_PRICES.pro)}
                            disabled={checkoutLoading}
                            className="mt-4 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white font-bold py-3 px-8 rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none flex items-center gap-2"
                          >
                            {checkoutLoading ? (
                              <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                Caricamento...
                              </>
                            ) : (
                              <>
                                <CreditCard className="w-5 h-5" />
                                Abbonati Ora
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Info se già PRO */}
                {planId === 'pro' && subscriptionStatus === 'active' && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                        <Star className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-green-800">Sei già PRO! 🎉</h3>
                        <p className="text-green-700">Stai godendo di tutti i vantaggi dell'abbonamento PRO.</p>
                      </div>
                    </div>
                    <p className="mt-4 text-sm text-green-600">
                      Il tuo abbonamento si rinnoverà automaticamente il {formatDate(currentPeriodEnd)}.
                      Per gestire o cancellare l'abbonamento, contatta il supporto.
                    </p>
                  </div>
                )}

                {/* Avviso pagamento fallito */}
                {subscriptionStatus === 'past_due' && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="w-8 h-8 text-red-500" />
                      <div>
                        <h3 className="text-lg font-bold text-red-800">Pagamento non riuscito</h3>
                        <p className="text-red-700">Il tuo ultimo pagamento non è andato a buon fine. Aggiorna il metodo di pagamento per continuare.</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleSubscribe(STRIPE_PRICES.pro)}
                      className="mt-4 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg"
                    >
                      Aggiorna Pagamento
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* IMPOSTAZIONI TAB */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Impostazioni Generali</h2>

                <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                  <div>
                    <label className="block font-semibold text-gray-800 mb-2">Nome Ristorante</label>
                    <input
                      type="text"
                      value={restaurantName}
                      onChange={(e) => setRestaurantName(e.target.value)}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-800 mb-2">Numero WhatsApp</label>
                    <input
                      type="text"
                      value={whatsappNumber}
                      onChange={(e) => setWhatsappNumber(e.target.value)}
                      className="w-full border rounded px-3 py-2"
                      placeholder="393271234567"
                    />
                    <p className="text-sm text-gray-600 mt-1">Formato: 393271234567 (senza + o spazi)</p>
                  </div>

                  {/* 🚗 TOGGLE DELIVERY ON/OFF */}
                  <div className="pt-4 border-t">
                    <h3 className="font-semibold text-gray-800 mb-3">🚗 Servizio Consegna</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Scegli se offrire consegna a domicilio oppure solo asporto
                    </p>
                    
                    <div className="bg-white rounded-lg p-4 border-2 border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className={`inline-flex items-center px-4 py-3 rounded-lg ${
                            deliveryEnabled 
                              ? 'bg-green-50 text-green-700 border border-green-200' 
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}>
                            <span className="text-2xl mr-3">
                              {deliveryEnabled ? '✅' : '🏪'}
                            </span>
                            <div>
                              <div className="font-medium">
                                {deliveryEnabled ? 'Delivery Attivo' : 'Solo Asporto'}
                              </div>
                              <div className="text-xs mt-1">
                                {deliveryEnabled 
                                  ? 'I clienti vedono opzioni "Consegna" e "Ritiro"'
                                  : 'I clienti vedono solo opzione "Ritiro al locale"'
                                }
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Toggle Switch */}
                        <button
                          onClick={async () => {
                            const newValue = !deliveryEnabled;
                            setDeliveryEnabled(newValue);
                            
                            // Salva su database
                            const { error } = await supabase
                              .from('restaurants')
                              .update({ delivery_enabled: newValue })
                              .eq('id', RESTAURANT_ID);
                            
                            if (error) {
                              console.error('Errore salvataggio delivery:', error);
                              alert('❌ Errore nel salvataggio');
                              setDeliveryEnabled(!newValue); // Rollback
                            } else {
                              showNotification();
                            }
                          }}
                          className={`
                            relative inline-flex h-10 w-20 items-center rounded-full
                            transition-colors duration-200 focus:outline-none focus:ring-2 
                            focus:ring-offset-2 focus:ring-blue-500 ml-4
                            ${deliveryEnabled ? 'bg-green-500' : 'bg-gray-300'}
                          `}
                        >
                          <span
                            className={`
                              inline-block h-8 w-8 transform rounded-full 
                              bg-white shadow-lg transition-transform duration-200
                              ${deliveryEnabled ? 'translate-x-11' : 'translate-x-1'}
                            `}
                          />
                        </button>
                      </div>
                      
                      {/* Info Box */}
                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-start">
                          <span className="text-blue-500 text-xl mr-2">💡</span>
                          <div className="text-sm text-blue-800">
                            <p className="font-medium mb-1">
                              {deliveryEnabled 
                                ? 'Con delivery attivo:'
                                : 'Solo asporto è perfetto per:'
                              }
                            </p>
                            <ul className="space-y-1">
                              {deliveryEnabled ? (
                                <>
                                  <li>✓ Clienti scelgono tra consegna e ritiro</li>
                                  <li>✓ Imposti zone e costi delivery</li>
                                  <li>✓ Gestisci tutto da un unico pannello</li>
                                </>
                              ) : (
                                <>
                                  <li>✓ Cliente ordina dal divano, ritira al locale</li>
                                  <li>✓ Evita code e attese in orario punta</li>
                                  <li>✓ Zero complessità logistica</li>
                                  <li>✓ Focus su preparazione, non consegne</li>
                                </>
                              )}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
{/* 🚚 SEZIONE CONSEGNA & COMPENSO RIDER */}
                  {(allowDeliveryFeeEdit || allowRiderCompensationDisplay) && (
                    <div className="pt-4 border-t">
                      <h3 className="font-semibold text-gray-800 mb-3">🚚 Consegna & Compenso Rider</h3>
                      <div className="space-y-4">
                        {allowDeliveryFeeEdit && (
                          <div>
                            <label className="block font-semibold text-gray-800 mb-2">💰 Costo Consegna (€)</label>
                            <input
                              type="number"
                              step="0.50"
                              min="0"
                              value={deliveryFee}
                              onChange={(e) => setDeliveryFee(parseFloat(e.target.value) || 0)}
                              className="w-full border rounded px-3 py-2"
                              placeholder="2.50"
                            />
                            <p className="text-sm text-gray-600 mt-1">Questo importo sarà visibile ai clienti</p>
                          </div>
                        )}
                        {allowRiderCompensationDisplay && (
                          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                            <div className="flex items-center justify-between mb-3">
                              <label className="font-semibold text-gray-800">💚 Mostra Compenso Rider Trasparente</label>
                              <input
                                type="checkbox"
                                checked={showRiderCompensation}
                                onChange={(e) => setShowRiderCompensation(e.target.checked)}
                                className="w-5 h-5 cursor-pointer"
                              />
                            </div>
                            {showRiderCompensation && (
                              <div>
                                <label className="block text-sm text-gray-700 mb-2">🏍️ Compenso riconosciuto al Rider (€)</label>
                                <input
                                  type="number"
                                  step="0.50"
                                  min="0"
                                  value={riderCompensationAmount || ''}
                                  onChange={(e) => setRiderCompensationAmount(parseFloat(e.target.value) || null)}
                                  className="w-full border border-green-300 rounded px-3 py-2"
                                  placeholder="4.00"
                                />
                                <p className="text-sm text-green-700 mt-2">✨ Questo valore sarà visibile ai clienti come segno di trasparenza etica</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                    <h3 className="font-semibold text-gray-800 mb-2">Connessione Database</h3>
                    <div className="bg-white rounded p-3">
                      <p className="text-sm text-gray-600 mb-1">URL: https://juwusmklaavhshwkfjjs.supabase.co</p>
                      <p className="text-sm text-gray-600">Ristorante ID: {RESTAURANT_ID}</p>
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

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Settings className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">💾 Salvataggio Automatico su Supabase</h3>
              <p className="text-sm text-blue-800">
                Tutte le modifiche vengono salvate sul database cloud Supabase. 
                Le configurazioni sono condivise tra tutte le app e sempre sincronizzate. 
                Click "Salva su Supabase" per confermare le modifiche.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
