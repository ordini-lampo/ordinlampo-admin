import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Edit2, Eye, EyeOff, DollarSign, MapPin, Clock, Settings, CreditCard, Star, AlertCircle, Phone, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase, getRestaurantConfig, saveRestaurantConfig, testConnection } from './supabaseClient';

// ============================================
// 💎 ADMIN PANEL ORDINLAMPO - MONO GRIGIO v5.0 FINALE
// Design: 1 SOLO Grigio #212121 + Bordi Blu #608beb Sottili
// Request: Paolo Pizzo - "Un'unica tonalità grigio"
// ============================================

const RESTAURANT_ID = '11111111-1111-1111-1111-111111111111';
const SUPABASE_FUNCTIONS_URL = 'https://juwusmklaavhshwkfjjs.supabase.co/functions/v1';
const STRIPE_PRICES = { pro: 'price_1SYVGw2LTzIeFZapPaXMWqzx', multi_sede: 'price_1SYVJD2LTzIeFZapYo3eewM7' };

// 📊 PIANI TARIFFARI ORDINI-LAMPO (RETAIL)
const PIANI_TARIFFARI = {
  freedom_150: {
    id: 'freedom_150',
    nome: 'FREEDOM 150',
    nomeBadge: 'FREEDOM',
    tariffa: 1.20,
    crediti: null, // pay-as-you-go
    bonus: 0,
    totale: 150, // max settimanale
    importo: null, // variabile
    costoPerOrdine: 1.20, // €1.20 per ordine
    colore: 'from-gray-500 to-gray-600',
    descrizione: 'Pay-as-you-go settimanale'
  },
  lampo_500: {
    id: 'lampo_500',
    nome: 'LAMPO 500',
    nomeBadge: 'LAMPO',
    tariffa: 0.98,
    crediti: 500,
    bonus: 0,
    totale: 500,
    importo: 490,
    costoPerOrdine: 0.98, // €0.98 per ordine
    colore: 'from-blue-500 to-blue-600',
    descrizione: 'Piano standard prepagato'
  },
  max_1000: {
    id: 'max_1000',
    nome: 'MAX 1000',
    nomeBadge: 'MAX',
    tariffa: 0.90,
    crediti: 1000,
    bonus: 50,
    totale: 1050,
    importo: 900,
    costoPerOrdine: 0.86, // €900 / 1050 ordini = €0.857
    colore: 'from-purple-500 to-purple-600',
    descrizione: 'Per chi spinge forte'
  },
  king_1500: {
    id: 'king_1500',
    nome: 'KING 1500',
    nomeBadge: 'KING',
    tariffa: 0.80,
    crediti: 1500,
    bonus: 100,
    totale: 1600,
    importo: 1200,
    costoPerOrdine: 0.75, // €1200 / 1600 ordini = €0.75
    colore: 'from-amber-500 to-amber-600',
    descrizione: 'Elite retail - Miglior prezzo'
  }
};

// 🎨 PALETTE FINALE (Paolo's Spec - Claude.ai Style)
const BG_TUTTO = 'bg-[#212121]'; // UN SOLO GRIGIO scuro (stile Claude.ai sidebar!)
const TEXT_PRIMARY = 'text-gray-50'; // #F9FAFB - Testo principale
const TEXT_SECONDARY = 'text-gray-400'; // #9CA3AF - Testo secondario
const BORDER_BLU = 'border-[#608beb]'; // Bordi blu sottili (1px)
const ACCENT_RED = 'bg-red-600'; // #DC2626 - Rosso fortuna
const ACCENT_GREEN = 'bg-green-600'; // #10B981 - Verde successo

// ============================================
// 🎨 ICONE CUSTOM (Busta Rossa + Bowl SVG Professionali)
// ============================================
const Icons = {
  RedEnvelope: ({ className }) => (
    <svg className={className} viewBox="0 0 100 120" fill="currentColor">
      <rect x="15" y="30" width="70" height="85" rx="4" />
      <path d="M15 30 L50 60 L85 30" fill="#B91C1C" />
      <circle cx="50" cy="70" r="15" fill="#F59E0B" />
      <text x="50" y="78" fontSize="16" fill="#DC2626" textAnchor="middle" fontWeight="bold">福</text>
    </svg>
  ),
  
  // 🥣 BOWL PICCOLA: Compatta, riempimento base
  BowlS: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 10c0 4.4 3.6 8 8 8s8-3.6 8-8H4z" fill="currentColor" fillOpacity="0.15" />
      <path d="M4 10c0-1 2-2 5-2s5 1 5 2" />
    </svg>
  ),
  
  // 🍜 BOWL MEDIA: Più larga, riempimento medio
  BowlM: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9c0 5 4 9 9 9s9-4 9-9H3z" fill="currentColor" fillOpacity="0.15" />
      <path d="M3 9c0-1.5 2.5-3 6-3s6 1.5 6 3" />
    </svg>
  ),
  
  // 🍲 BOWL GRANDE: Capiente, riempimento abbondante
  BowlL: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 8c0 5.5 4.5 10 10 10s10-4.5 10-10H2z" fill="currentColor" fillOpacity="0.15" />
      <path d="M2 8c0-2.5 3-4.5 7-4.5s7 2 7 4.5" />
    </svg>
  )
};

export default function OrdinlampoAdmin() {
  // ============================================
  // STATE MANAGEMENT
  // ============================================
  const [locations, setLocations] = useState([
    { id: 'sanremo', name: 'Sanremo', fee: 3.50, estimatedTime: '15-20 min', active: true },
    { id: 'poggio', name: 'Poggio', fee: 5.00, estimatedTime: '20-25 min', active: true },
    { id: 'bussana', name: 'Bussana', fee: 5.00, estimatedTime: '25-30 min', active: true },
    { id: 'ospedaletti', name: 'Ospedaletti', fee: 5.00, estimatedTime: '20-25 min', active: true },
    { id: 'coldirodi', name: 'Coldirodi', fee: 6.00, estimatedTime: '20-25 min', active: true }
  ]);

  // Rimosso campo emoji - usano SVG ora
  const [pokeSizes, setPokeSizes] = useState([
    { id: 'small', name: 'Piccola', price: 8.50 },
    { id: 'medium', name: 'Media', price: 10.50 },
    { id: 'large', name: 'Grande', price: 12.50 }
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
  
  // Ordini & Notifiche
  const [newOrders, setNewOrders] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNewOrderAlert, setShowNewOrderAlert] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  // Stripe & Settings
  const [subscriptionStatus, setSubscriptionStatus] = useState('trial');
  const [planId, setPlanId] = useState('freedom_150'); // FREEDOM 150 di default
  
  // 📊 Statistiche Settimanali per Widget Contatore
  const [weeklyStats, setWeeklyStats] = useState({
    ordersCount: 0,
    totalAmount: 0,
    periodStart: null,
    periodEnd: null,
    loading: true
  });
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
    } catch (error) { console.error('Errore suono:', error); }
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
    } catch (error) { console.error('Errore ordini:', error); }
    setLoadingOrders(false);
  };

  // 📊 CARICA STATISTICHE SETTIMANALI (per Widget Contatore)
  const loadWeeklyStats = async () => {
    try {
      // Calcola inizio settimana (Lunedì) e fine (Domenica)
      const now = new Date();
      const dayOfWeek = now.getDay();
      const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() + diffToMonday);
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from('orders')
        .select('id, total, created_at')
        .eq('restaurant_id', RESTAURANT_ID)
        .gte('created_at', startOfWeek.toISOString())
        .lte('created_at', endOfWeek.toISOString());

      if (error) throw error;

      const ordersCount = data?.length || 0;
      const totalAmount = data?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;
      
      // Calcola fee in base al piano attivo
      const pianoAttivo = PIANI_TARIFFARI[planId] || PIANI_TARIFFARI.freedom_150;
      const feePerOrdine = pianoAttivo.costoPerOrdine;
      const totaleFee = ordersCount * feePerOrdine;

      setWeeklyStats({
        ordersCount,
        totalAmount,
        totaleFee,
        feePerOrdine,
        periodStart: startOfWeek,
        periodEnd: endOfWeek,
        loading: false
      });
    } catch (error) {
      console.error('Errore statistiche settimanali:', error);
      setWeeklyStats(prev => ({ ...prev, loading: false }));
    }
  };

  const updateGeneric = (setter, id, field, value) => {
    setter(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
    showNotification();
  };

  const addLocation = () => {
    if (newLocation.name && newLocation.fee && newLocation.estimatedTime) {
      const id = newLocation.name.toLowerCase().replace(/\s+/g, '-');
      setLocations([...locations, { id, name: newLocation.name, fee: parseFloat(newLocation.fee), estimatedTime: newLocation.estimatedTime, active: true }]);
      setNewLocation({ name: '', fee: '', estimatedTime: '' });
      showNotification();
    }
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
        body: JSON.stringify({ priceId, restaurantId: RESTAURANT_ID, returnUrl: window.location.origin })
      });
      const data = await response.json();
      if (data.url) window.location.href = data.url;
      else alert('Errore creazione pagamento.');
    } catch (error) { alert('Errore connessione.'); }
    setCheckoutLoading(false);
  };

  const saveAllConfigurations = async () => {
    setLoading(true);
    const config = {
      delivery_locations: locations, poke_sizes: pokeSizes, extra_prices: extraPrices,
      floor_delivery: floorDelivery, rider_tip: riderTip, whatsapp_number: whatsappNumber,
      restaurant_name: restaurantName, delivery_fee: deliveryFee, show_rider_compensation: showRiderCompensation,
      rider_compensation_amount: riderCompensationAmount, last_updated: new Date().toISOString()
    };
    const result = await saveRestaurantConfig(RESTAURANT_ID, config);
    if (result) showNotification();
    else alert('Errore nel salvataggio.');
    setLoading(false);
  };

  const showNotification = () => {
    setShowSaveNotification(true);
    setTimeout(() => setShowSaveNotification(false), 3000);
  };

  // Helper per renderizzare l'icona Bowl corretta (DA GEMINI)
  const renderBowlIcon = (sizeId) => {
    const iconClass = "text-[#608beb]"; // Blu #608beb per tutte
    switch (sizeId) {
      case 'small': return <Icons.BowlS className={`w-8 h-8 ${iconClass}`} />;
      case 'medium': return <Icons.BowlM className={`w-10 h-10 ${iconClass}`} />;
      case 'large': return <Icons.BowlL className={`w-12 h-12 ${iconClass}`} />;
      default: return <Icons.BowlM className={`w-10 h-10 ${iconClass}`} />;
    }
  };

  // ============================================
  // EFFECTS
  // ============================================

  useEffect(() => {
    const loadConfig = async () => {
      setLoading(true);
      try {
        const isConnected = await testConnection();
        setConnectionStatus(isConnected ? 'connected' : 'error');
        
        if (!isConnected) {
          alert('Errore connessione Supabase.');
          return;
        }

        // Load Delivery Toggle
        const { data: rData, error: rError } = await supabase
          .from('restaurants')
          .select('delivery_enabled')
          .eq('id', RESTAURANT_ID)
          .single();
        if (rData && !rError) setDeliveryEnabled(rData.delivery_enabled ?? true);

        // Load Settings
        const config = await getRestaurantConfig(RESTAURANT_ID);
        if (config) {
          if (config.subscription_status) setSubscriptionStatus(config.subscription_status);
          if (config.plan_id) setPlanId(config.plan_id);
          if (config.current_period_end) setCurrentPeriodEnd(config.current_period_end);
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
      } catch (e) {
        console.error("Init error:", e);
      } finally {
        setLoading(false);
      }
    };

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('session_id') || urlParams.get('canceled')) {
      window.history.replaceState({}, '', window.location.pathname);
      if (urlParams.get('canceled')) alert('Pagamento annullato.');
    }

    const channel = supabase.channel('orders-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${RESTAURANT_ID}` }, 
      (payload) => {
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
    loadWeeklyStats(); // Carica statistiche settimanali
    return () => { supabase.removeChannel(channel); };
  }, []);

  const getStatusBadge = () => {
    if (planId === 'pro' && subscriptionStatus === 'active') {
      return (
        <span className="px-4 py-2 rounded-full text-sm font-bold bg-gradient-to-r from-[#608beb] to-[#4a7bd9] text-white flex items-center gap-1 shadow-lg shadow-[#608beb]/30">
          <Star className="w-4 h-4" /> PRO
        </span>
      );
    }
    return <span className="px-4 py-2 rounded-full text-sm font-bold bg-gradient-to-r from-[#608beb] to-[#4a7bd9] text-white shadow-lg">Trial</span>;
  };

  // ============================================
  // RENDER
  // ============================================

  if (loading) {
    return (
      <div className={`min-h-screen ${BG_TUTTO} flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#608beb] mx-auto mb-4"></div>
          <p className={`${TEXT_PRIMARY} font-medium`}>Caricamento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${BG_TUTTO} py-8 px-4 relative overflow-hidden font-sans`}>
      
      <div className="max-w-6xl mx-auto relative z-20">
        
        {/* HEADER */}
        <div className={`${BG_TUTTO} rounded-2xl shadow-2xl p-8 mb-8 border ${BORDER_BLU}`}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h1 className={`text-3xl font-bold ${TEXT_PRIMARY}`}>⚙️ Admin Panel</h1>
                {getStatusBadge()}
                
                {unreadCount > 0 && (
                  <span className="relative inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-red-600 to-red-700 text-white font-bold shadow-lg shadow-red-500/40 animate-pulse">
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                    🔔 {unreadCount} {unreadCount === 1 ? 'nuovo' : 'nuovi'}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                <span className={`text-sm ${TEXT_SECONDARY} font-medium`}>
                  {connectionStatus === 'connected' ? 'Database Connesso' : 'Errore Connessione'}
                </span>
              </div>
            </div>
            <button
              onClick={saveAllConfigurations}
              disabled={loading}
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-4 px-8 rounded-xl flex items-center gap-2 shadow-xl shadow-green-500/40 hover:shadow-2xl hover:scale-105 transition-all disabled:opacity-50 border border-green-400/30"
            >
              <Save className="w-5 h-5" />
              <span>Salva Modifiche</span>
            </button>
          </div>
        </div>

        {/* Notifica Salvataggio con Busta Rossa */}
        {showSaveNotification && (
          <div className="fixed top-8 right-8 bg-gradient-to-r from-red-600 to-red-700 text-white px-8 py-5 rounded-2xl shadow-2xl flex items-center gap-4 z-50 border border-[#608beb] animate-bounce-subtle">
            <Icons.RedEnvelope className="w-10 h-10" />
            <div>
              <p className="font-bold text-lg">Salvato con successo!</p>
              <p className="text-sm text-red-100">好运 (Buona Fortuna)</p>
            </div>
          </div>
        )}

        {/* Alert Nuovo Ordine */}
        {showNewOrderAlert && newOrders.length > 0 && (
          <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-lg px-4">
            <div className="bg-gradient-to-br from-red-600 to-red-800 text-white p-8 rounded-3xl shadow-2xl border border-[#608beb] ring-4 ring-red-300 animate-bounce-subtle">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                  <span className="text-5xl">🔔</span>
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
              
              <div className="grid grid-cols-2 gap-3 mt-4">
                <a
                  href={`tel:${newOrders[0]?.customer_phone || ''}`}
                  className="bg-white text-red-600 py-4 rounded-xl font-black text-center flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors shadow-lg"
                >
                  <Phone className="w-6 h-6" />
                  CHIAMA ORA
                </a>
                <button
                  onClick={() => {
                    setActiveTab('orders');
                    setShowNewOrderAlert(false);
                  }}
                  className="bg-red-900 text-white py-4 rounded-xl font-bold border border-[#608beb] hover:bg-red-950 transition-colors"
                >
                  VISUALIZZA
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className={`${BG_TUTTO} rounded-2xl shadow-2xl border ${BORDER_BLU} mb-8 overflow-hidden`}>
          <div className="flex border-b-2 border-[#608beb]/30 overflow-x-auto bg-[#212121]">
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
                className={`flex-1 py-4 px-6 font-bold flex items-center justify-center gap-2 transition-all border-r border-[#608beb]/20 last:border-r-0 ${
                  activeTab === tab.id 
                    ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg' 
                    : `${TEXT_SECONDARY} hover:bg-[#212121]`
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.label}</span>
                {tab.id === 'orders' && unreadCount > 0 && (
                  <span className="bg-[#608beb] text-red-900 text-xs px-2 py-1 rounded-full font-black shadow-inner">
                    {unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="p-8">
            
            {/* TAB LOCALITÀ */}
            {activeTab === 'locations' && (
              <div className="space-y-4">
                <h2 className={`text-2xl font-bold ${TEXT_PRIMARY} mb-6`}>Zone Consegna</h2>
                {locations.map(loc => (
                  <div
                    key={loc.id}
                    className={`${BG_TUTTO} p-6 rounded-2xl flex items-center justify-between border shadow-lg transition-all hover:shadow-xl ${
                      !loc.active ? 'opacity-60 border-dashed border-gray-600' : `${BORDER_BLU} shadow-[#608beb]/20`
                    }`}
                  >
                    <div className="flex-1">
                      {editingLocation === loc.id ? (
                        <div className="flex gap-2">
                          <input
                            className={`border ${BORDER_BLU} p-3 rounded-xl w-1/3 font-medium ${BG_TUTTO} ${TEXT_PRIMARY}`}
                            defaultValue={loc.name}
                            onBlur={(e) => updateGeneric(setLocations, loc.id, 'name', e.target.value)}
                          />
                          <input
                            className={`border ${BORDER_BLU} p-3 rounded-xl w-24 font-bold text-center ${BG_TUTTO} ${TEXT_PRIMARY}`}
                            type="number"
                            step="0.50"
                            defaultValue={loc.fee}
                            onBlur={(e) => updateGeneric(setLocations, loc.id, 'fee', parseFloat(e.target.value))}
                          />
                          <input
                            className={`border ${BORDER_BLU} p-3 rounded-xl w-1/3 font-medium ${BG_TUTTO} ${TEXT_PRIMARY}`}
                            defaultValue={loc.estimatedTime}
                            onBlur={(e) => updateGeneric(setLocations, loc.id, 'estimatedTime', e.target.value)}
                          />
                        </div>
                      ) : (
                        <div>
                          <h3 className={`font-bold text-xl ${TEXT_PRIMARY}`}>{loc.name}</h3>
                          <p className={`${TEXT_SECONDARY} font-medium`}>Tariffa: €{loc.fee.toFixed(2)} • Tempo: {loc.estimatedTime}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleLocationActive(loc.id)}
                        className={`p-3 ${BG_TUTTO} rounded-xl border ${BORDER_BLU} hover:bg-[#212121] transition-colors shadow-sm`}
                      >
                        {loc.active ? <Eye className="w-5 h-5 text-green-500" /> : <EyeOff className="w-5 h-5 text-gray-500" />}
                      </button>
                      <button
                        onClick={() => setEditingLocation(editingLocation === loc.id ? null : loc.id)}
                        className={`p-3 ${BG_TUTTO} rounded-xl border ${BORDER_BLU} hover:bg-[#212121] transition-colors shadow-sm`}
                      >
                        <Edit2 className="w-5 h-5 text-blue-500" />
                      </button>
                      <button
                        onClick={() => deleteLocation(loc.id)}
                        className={`p-3 ${BG_TUTTO} rounded-xl border ${BORDER_BLU} hover:bg-red-900 transition-colors shadow-sm`}
                      >
                        <Trash2 className="w-5 h-5 text-red-500" />
                      </button>
                    </div>
                  </div>
                ))}
                
                <div className="bg-blue-900/30 p-6 rounded-2xl border border-[#608beb] mt-6">
                  <h3 className={`font-bold ${TEXT_PRIMARY} mb-4 flex items-center gap-2 text-lg`}>
                    <Plus className="w-6 h-6" />
                    Nuova Zona
                  </h3>
                  <div className="flex gap-3">
                    <input
                      className={`border border-[#608beb] p-3 rounded-xl flex-1 font-medium ${BG_TUTTO} ${TEXT_PRIMARY}`}
                      placeholder="Nome zona"
                      value={newLocation.name}
                      onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                    />
                    <input
                      className={`border border-[#608beb] p-3 rounded-xl w-28 font-bold text-center ${BG_TUTTO} ${TEXT_PRIMARY}`}
                      type="number"
                      step="0.50"
                      placeholder="€"
                      value={newLocation.fee}
                      onChange={(e) => setNewLocation({ ...newLocation, fee: e.target.value })}
                    />
                    <input
                      className={`border border-[#608beb] p-3 rounded-xl w-36 font-medium ${BG_TUTTO} ${TEXT_PRIMARY}`}
                      placeholder="20-25 min"
                      value={newLocation.estimatedTime}
                      onChange={(e) => setNewLocation({ ...newLocation, estimatedTime: e.target.value })}
                    />
                    <button
                      onClick={addLocation}
                      className="bg-gradient-to-r from-[#608beb] to-[#4a7bd9] text-white px-8 rounded-xl font-bold hover:from-[#4a7bd9] hover:to-[#3a6bc9] transition-all shadow-lg"
                    >
                      AGGIUNGI
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB PREZZI - CON ICONE SVG! */}
            {activeTab === 'prices' && (
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-[#608beb]/10 p-8 rounded-2xl border border-[#608beb] shadow-lg">
                  <h3 className={`text-xl font-bold mb-6 ${TEXT_PRIMARY}`}>Taglie Bowl</h3>
                  <div className="space-y-3">
                    {pokeSizes.map(size => (
                      <div
                        key={size.id}
                        className={`${BG_TUTTO} p-4 rounded-xl shadow-md border ${BORDER_BLU}`}
                      >
                        <div className="flex justify-between items-center">
                          <span className={`font-bold text-lg ${TEXT_PRIMARY} flex items-center gap-3`}>
                            {renderBowlIcon(size.id)}
                            {size.name}
                          </span>
                          <div className="flex items-center gap-3">
                            <span className={`${TEXT_SECONDARY} font-medium text-lg`}>€</span>
                            <div className="flex items-center gap-2 bg-[#1a1a1a] rounded-xl p-1 border ${BORDER_BLU}">
                              <button
                                onClick={() => updatePokeSize(size.id, 'price', Math.max(0, size.price - 0.50).toFixed(2))}
                                className="w-10 h-10 flex items-center justify-center rounded-lg bg-[#608beb] hover:bg-[#4a7bd9] text-white font-black text-xl transition-colors"
                              >
                                −
                              </button>
                              <input
                                type="number"
                                step="0.50"
                                className={`w-20 text-center font-bold text-lg ${BG_TUTTO} ${TEXT_PRIMARY} border-none outline-none bg-transparent`}
                                value={size.price}
                                onChange={(e) => updatePokeSize(size.id, 'price', e.target.value)}
                              />
                              <button
                                onClick={() => updatePokeSize(size.id, 'price', (parseFloat(size.price) + 0.50).toFixed(2))}
                                className="w-10 h-10 flex items-center justify-center rounded-lg bg-[#608beb] hover:bg-[#4a7bd9] text-white font-black text-xl transition-colors"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="bg-[#608beb]/10 p-8 rounded-2xl border border-[#608beb] shadow-lg">
                  <h3 className={`text-xl font-bold mb-6 ${TEXT_PRIMARY}`}>Prezzi Extra</h3>
                  <div className="space-y-3">
                    {Object.entries(extraPrices).map(([key, val]) => (
                      <div
                        key={key}
                        className={`${BG_TUTTO} p-4 rounded-xl shadow-md border ${BORDER_BLU}`}
                      >
                        <div className="flex justify-between items-center">
                          <span className={`capitalize font-bold ${TEXT_PRIMARY}`}>{key}</span>
                          <div className="flex items-center gap-3">
                            <span className={`${TEXT_SECONDARY} font-medium text-lg`}>€</span>
                            <div className="flex items-center gap-2 bg-[#1a1a1a] rounded-xl p-1 border ${BORDER_BLU}">
                              <button
                                onClick={() => updateExtraPrice(key, Math.max(0, val - 0.10).toFixed(2))}
                                className="w-10 h-10 flex items-center justify-center rounded-lg bg-[#608beb] hover:bg-[#4a7bd9] text-white font-black text-xl transition-colors"
                              >
                                −
                              </button>
                              <input
                                type="number"
                                step="0.10"
                                className={`w-20 text-center font-bold text-lg ${BG_TUTTO} ${TEXT_PRIMARY} border-none outline-none bg-transparent`}
                                value={val}
                                onChange={(e) => updateExtraPrice(key, e.target.value)}
                              />
                              <button
                                onClick={() => updateExtraPrice(key, (parseFloat(val) + 0.10).toFixed(2))}
                                className="w-10 h-10 flex items-center justify-center rounded-lg bg-[#608beb] hover:bg-[#4a7bd9] text-white font-black text-xl transition-colors"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB ABBONAMENTO - LAYOUT 2 COLONNE */}
            {activeTab === 'subscription' && (
              <div className="grid md:grid-cols-2 gap-8">
                
                {/* COLONNA SINISTRA: Tariffe Disponibili */}
                <div className="space-y-6">
                  <h2 className={`text-2xl font-bold ${TEXT_PRIMARY} flex items-center gap-2`}>
                    📋 Tariffe Disponibili
                  </h2>
                  
                  {/* Lista Piani */}
                  <div className="space-y-3">
                    {Object.values(PIANI_TARIFFARI).map((piano) => {
                      const isActive = planId === piano.id;
                      return (
                        <div
                          key={piano.id}
                          className={`${BG_TUTTO} p-4 rounded-xl border transition-all hover:scale-[1.01] ${
                            isActive 
                              ? 'border-green-500 ring-2 ring-green-500/30 shadow-lg shadow-green-500/20' 
                              : BORDER_BLU
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${piano.colore} flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                                {piano.nomeBadge.charAt(0)}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className={`font-bold text-lg ${TEXT_PRIMARY}`}>{piano.nome}</h3>
                                  {isActive && (
                                    <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                                      ATTIVO
                                    </span>
                                  )}
                                </div>
                                <p className={`text-xs ${TEXT_SECONDARY}`}>{piano.descrizione}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-green-400 font-black text-2xl">€{piano.costoPerOrdine.toFixed(2)}</p>
                              <p className={`text-xs ${TEXT_SECONDARY}`}>€/ordine</p>
                            </div>
                          </div>
                          
                          {/* Dettagli piano (se prepagato) */}
                          {piano.crediti && (
                            <div className={`mt-3 pt-3 border-t border-gray-700 grid grid-cols-3 gap-2 text-center`}>
                              <div>
                                <p className={`text-xs ${TEXT_SECONDARY}`}>Crediti</p>
                                <p className={`font-bold ${TEXT_PRIMARY}`}>{piano.crediti}</p>
                              </div>
                              <div>
                                <p className={`text-xs ${TEXT_SECONDARY}`}>Bonus</p>
                                <p className={`font-bold ${piano.bonus > 0 ? 'text-green-400' : TEXT_PRIMARY}`}>
                                  {piano.bonus > 0 ? `+${piano.bonus}` : '0'}
                                </p>
                              </div>
                              <div>
                                <p className={`text-xs ${TEXT_SECONDARY}`}>Importo</p>
                                <p className={`font-bold ${TEXT_PRIMARY}`}>€{piano.importo}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* CTA Upgrade */}
                  <div className="bg-gradient-to-r from-amber-900/30 to-orange-900/30 p-4 rounded-xl border border-amber-500/50">
                    <p className={`text-sm ${TEXT_SECONDARY} mb-2`}>
                      💡 Vuoi risparmiare? Più ordini fai, meno paghi!
                    </p>
                    <button
                      className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 rounded-xl font-bold hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg"
                    >
                      Richiedi Upgrade Piano
                    </button>
                  </div>
                  
                  {/* Link Contratti */}
                  <div className={`${BG_TUTTO} p-4 rounded-xl border ${BORDER_BLU}`}>
                    <h4 className={`font-bold ${TEXT_PRIMARY} mb-3`}>📄 Documenti</h4>
                    <div className="space-y-2">
                      <a href="https://ordini-lampo.it/termini-servizio" target="_blank" rel="noopener noreferrer"
                        className={`block ${TEXT_SECONDARY} hover:text-[#608beb] transition-colors text-sm`}>
                        → Termini di Servizio
                      </a>
                      <a href="https://ordini-lampo.it/privacy-policy" target="_blank" rel="noopener noreferrer"
                        className={`block ${TEXT_SECONDARY} hover:text-[#608beb] transition-colors text-sm`}>
                        → Privacy Policy
                      </a>
                      <a href="https://ordini-lampo.it/tariffe" target="_blank" rel="noopener noreferrer"
                        className={`block ${TEXT_SECONDARY} hover:text-[#608beb] transition-colors text-sm`}>
                        → Listino Completo
                      </a>
                    </div>
                  </div>
                </div>
                
                {/* COLONNA DESTRA: Widget Contatore + Piano Attivo */}
                <div className="space-y-6">
                  
                  {/* 📊 WIDGET CONTATORE SETTIMANALE */}
                  <div className="bg-gradient-to-br from-green-900/40 to-emerald-900/40 p-6 rounded-2xl border border-green-500/50 shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className={`text-xl font-bold ${TEXT_PRIMARY} flex items-center gap-2`}>
                        📊 Questa Settimana
                      </h3>
                      <button 
                        onClick={loadWeeklyStats}
                        className="text-green-400 hover:text-green-300 text-sm font-medium"
                      >
                        🔄 Aggiorna
                      </button>
                    </div>
                    
                    {weeklyStats.loading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-500 mx-auto"></div>
                        <p className={`${TEXT_SECONDARY} mt-2 text-sm`}>Caricamento...</p>
                      </div>
                    ) : (
                      <>
                        {/* Contatore Ordini */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="bg-[#212121] p-4 rounded-xl border border-green-500/30">
                            <p className={`text-xs ${TEXT_SECONDARY} mb-1`}>Ordini ricevuti</p>
                            <p className="text-4xl font-black text-green-400">{weeklyStats.ordersCount}</p>
                          </div>
                          <div className="bg-[#212121] p-4 rounded-xl border border-green-500/30">
                            <p className={`text-xs ${TEXT_SECONDARY} mb-1`}>Fee Ordini-Lampo</p>
                            <p className="text-4xl font-black text-amber-400">€{weeklyStats.totaleFee?.toFixed(2) || '0.00'}</p>
                          </div>
                        </div>
                        
                        {/* Calcolo dettagliato */}
                        <div className="bg-[#212121] p-4 rounded-xl border border-gray-700">
                          <div className="flex justify-between items-center text-sm">
                            <span className={TEXT_SECONDARY}>{weeklyStats.ordersCount} ordini × €{weeklyStats.feePerOrdine?.toFixed(2) || '0.00'}</span>
                            <span className="text-amber-400 font-bold">= €{weeklyStats.totaleFee?.toFixed(2) || '0.00'}</span>
                          </div>
                        </div>
                        
                        {/* Periodo */}
                        <p className={`text-xs ${TEXT_SECONDARY} mt-3 text-center`}>
                          📅 {weeklyStats.periodStart?.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' })} - {weeklyStats.periodEnd?.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' })}
                        </p>
                      </>
                    )}
                  </div>
                  
                  {/* 🏷️ FASCIONE PIANO ATTIVO */}
                  <div className={`bg-gradient-to-br from-[#608beb]/20 to-blue-900/30 p-6 rounded-2xl border border-[#608beb] shadow-xl`}>
                    <p className={`text-xs ${TEXT_SECONDARY} uppercase tracking-wider mb-2`}>Il tuo piano attuale</p>
                    
                    {(() => {
                      const pianoAttivo = PIANI_TARIFFARI[planId] || PIANI_TARIFFARI.freedom_150;
                      return (
                        <>
                          <div className="flex items-center gap-4 mb-4">
                            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${pianoAttivo.colore} flex items-center justify-center text-white font-black text-2xl shadow-lg`}>
                              {pianoAttivo.nomeBadge.charAt(0)}
                            </div>
                            <div>
                              <h2 className={`text-3xl font-black ${TEXT_PRIMARY}`}>{pianoAttivo.nome}</h2>
                              <p className="text-green-400 font-bold text-xl">€{pianoAttivo.costoPerOrdine.toFixed(2)} €/ordine</p>
                            </div>
                          </div>
                          
                          <div className="bg-[#212121] p-4 rounded-xl border border-gray-700 space-y-2">
                            <div className="flex justify-between">
                              <span className={TEXT_SECONDARY}>Stato</span>
                              <span className="text-green-500 font-bold">✅ ATTIVO</span>
                            </div>
                            <div className="flex justify-between">
                              <span className={TEXT_SECONDARY}>Prossimo pagamento</span>
                              <span className={`${TEXT_PRIMARY} font-medium`}>
                                {pianoAttivo.id === 'freedom_150' ? 'Venerdì' : 'A esaurimento crediti'}
                              </span>
                            </div>
                            {pianoAttivo.crediti && (
                              <div className="flex justify-between">
                                <span className={TEXT_SECONDARY}>Crediti totali</span>
                                <span className={`${TEXT_PRIMARY} font-medium`}>{pianoAttivo.totale}</span>
                              </div>
                            )}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                  
                  {/* Info Pagamento */}
                  <div className={`${BG_TUTTO} p-4 rounded-xl border ${BORDER_BLU}`}>
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">💳</span>
                      <div>
                        <h4 className={`font-bold ${TEXT_PRIMARY}`}>Pagamento Settimanale</h4>
                        <p className={`text-sm ${TEXT_SECONDARY}`}>
                          Ogni venerdì ricevi il riepilogo ordini e il link per pagare via WhatsApp.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                </div>
              </div>
            )}

            {/* TAB IMPOSTAZIONI */}
            {activeTab === 'settings' && (
              <div className="space-y-8">
                <div className={`${BG_TUTTO} p-8 rounded-2xl border ${BORDER_BLU} shadow-lg`}>
                  <h3 className={`font-bold text-xl mb-6 ${TEXT_PRIMARY}`}>Generale</h3>
                  <div className="space-y-5">
                    <div>
                      <label className={`block font-bold ${TEXT_SECONDARY} mb-2`}>Nome Ristorante</label>
                      <input
                        type="text"
                        className={`w-full border ${BORDER_BLU} p-4 rounded-xl font-medium ${BG_TUTTO} ${TEXT_PRIMARY}`}
                        value={restaurantName}
                        onChange={(e) => setRestaurantName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className={`block font-bold ${TEXT_SECONDARY} mb-2`}>WhatsApp</label>
                      <input
                        type="text"
                        className={`w-full border ${BORDER_BLU} p-4 rounded-xl font-medium ${BG_TUTTO} ${TEXT_PRIMARY}`}
                        placeholder="393331234567"
                        value={whatsappNumber}
                        onChange={(e) => setWhatsappNumber(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Toggle Delivery */}
                <div className={`${BG_TUTTO} p-8 rounded-2xl border border-[#608beb] shadow-xl`}>
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h3 className={`font-bold text-2xl ${TEXT_PRIMARY}`}>Modalità Operativa</h3>
                      <p className={`font-bold mt-2 text-lg ${deliveryEnabled ? 'text-green-500' : 'text-blue-500'}`}>
                        {deliveryEnabled ? '✅ DELIVERY + ASPORTO ATTIVI' : '🏪 SOLO RITIRO AL LOCALE'}
                      </p>
                    </div>
                    <button
                      onClick={async () => {
                        const newVal = !deliveryEnabled;
                        setDeliveryEnabled(newVal);
                        
                        try {
                          const { error: err1 } = await supabase
                            .from('restaurants')
                            .update({ delivery_enabled: newVal })
                            .eq('id', RESTAURANT_ID);
                          
                          if (err1) throw err1;
                          
                          const { error: err2 } = await supabase
                            .from('restaurant_settings')
                            .update({ enable_delivery: newVal })
                            .eq('restaurant_id', RESTAURANT_ID);
                          
                          if (err2) console.warn('Settings sync:', err2);
                          
                          showNotification();
                        } catch (error) {
                          console.error('Errore delivery toggle:', error);
                          alert('❌ Errore nel salvataggio');
                          setDeliveryEnabled(!newVal);
                        }
                      }}
                      className={`w-24 h-12 rounded-full relative transition-colors duration-300 shadow-lg border ${
                        deliveryEnabled ? 'bg-gradient-to-r from-green-500 to-green-600 border-green-400' : 'bg-gray-600 border-gray-500'
                      }`}
                    >
                      <div
                        className={`w-10 h-10 bg-white rounded-full absolute top-1 shadow-md transition-all duration-300 border border-gray-300 ${
                          deliveryEnabled ? 'left-[52px]' : 'left-1'
                        }`}
                      ></div>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB ORDINI */}
            {activeTab === 'orders' && (
              <div>
                <div className="flex justify-between items-center mb-8">
                  <h2 className={`text-3xl font-bold ${TEXT_PRIMARY}`}>Storico Ordini</h2>
                  <button
                    onClick={loadOrders}
                    className="text-blue-400 hover:bg-[#212121] px-6 py-3 rounded-xl font-bold transition-colors border border-[#608beb] shadow-md"
                  >
                    🔄 Aggiorna Lista
                  </button>
                </div>
                
                {loadingOrders ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#608beb] mx-auto mb-4"></div>
                    <p className={`${TEXT_PRIMARY} font-medium text-lg`}>Caricamento ordini...</p>
                  </div>
                ) : orders.length === 0 ? (
                  <div className={`${BG_TUTTO} rounded-2xl p-12 text-center border border-[#608beb] shadow-inner`}>
                    <p className="text-6xl mb-4">📭</p>
                    <p className={`${TEXT_PRIMARY} text-xl font-bold`}>Nessun ordine ancora</p>
                    <p className={`${TEXT_SECONDARY} text-sm mt-2`}>Gli ordini appariranno qui quando i clienti ordinano</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map(order => (
                      <div
                        key={order.id}
                        className={`${BG_TUTTO} rounded-2xl shadow-lg border ${BORDER_BLU} overflow-hidden hover:shadow-2xl hover:scale-[1.01] transition-all relative`}
                      >
                        <div className="p-6 flex flex-col md:flex-row justify-between items-center gap-4 bg-[#212121]">
                          <div className="flex items-center gap-4 w-full md:w-auto">
                            <div
                              className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-white text-2xl shadow-lg ${
                                order.order_type === 'delivery' ? 'bg-gradient-to-br from-orange-500 to-red-600' : 'bg-gradient-to-br from-[#608beb] to-[#4a7bd9]'
                              }`}
                            >
                              {order.order_type === 'delivery' ? '🛵' : '🥡'}
                            </div>
                            <div>
                              <h3 className={`font-black text-xl ${TEXT_PRIMARY}`}>#{order.order_number || order.id?.slice(0, 8)}</h3>
                              <p className={`text-sm ${TEXT_SECONDARY} font-medium`}>
                                {new Date(order.created_at).toLocaleString('it-IT')}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                            <div className="text-right mr-2">
                              <p className="font-black text-2xl text-green-500">
                                €{(order.total_amount || order.total || 0).toFixed(2)}
                              </p>
                              <p className={`text-xs ${TEXT_SECONDARY} capitalize font-medium`}>
                                {order.payment_method || 'N/A'}
                              </p>
                            </div>
                            
                            {order.customer_phone && (
                              <a
                                href={`tel:${order.customer_phone}`}
                                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-4 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl"
                                title="Chiama Cliente"
                              >
                                <Phone className="w-6 h-6" />
                              </a>
                            )}
                            
                            <button
                              onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                              className="bg-[#212121] text-gray-200 p-4 rounded-xl hover:bg-[#212121] transition-colors shadow-md"
                            >
                              {expandedOrderId === order.id ? (
                                <ChevronUp className="w-6 h-6" />
                              ) : (
                                <ChevronDown className="w-6 h-6" />
                              )}
                            </button>
                          </div>
                        </div>

                        {expandedOrderId === order.id && (
                          <div className={`p-6 border-t border-[#608beb]/20 ${BG_TUTTO}`}>
                            <div className="grid md:grid-cols-2 gap-8">
                              <div>
                                <h4 className={`font-bold ${TEXT_SECONDARY} mb-3 uppercase text-xs tracking-wider`}>
                                  Dati Cliente
                                </h4>
                                <p className={`font-bold text-xl ${TEXT_PRIMARY}`}>{order.customer_name || 'N/A'}</p>
                                <p className={`${TEXT_SECONDARY} flex items-center gap-2 font-medium`}>
                                  <Phone className="w-4 h-4" />
                                  {order.customer_phone || 'N/A'}
                                </p>
                                {order.delivery_address && (
                                  <p className={`${TEXT_SECONDARY} mt-2 font-medium`}>
                                    📍 {order.delivery_address} {order.customer_city || ''}
                                  </p>
                                )}
                                {order.customer_notes_order && (
                                  <div className="mt-4 bg-[#608beb]/20 p-4 rounded-xl text-sm text-[#608beb] border border-[#608beb] font-medium">
                                    📝 Note: {order.customer_notes_order}
                                  </div>
                                )}
                              </div>
                              
                              <div>
                                <h4 className={`font-bold ${TEXT_SECONDARY} mb-3 uppercase text-xs tracking-wider`}>
                                  Riepilogo Ordine
                                </h4>
                                <div className="space-y-2 text-sm">
                                  {order.order_details ? (
                                    <div className="bg-blue-900/30 rounded-xl p-4 border border-blue-600">
                                      <pre className={`whitespace-pre-wrap text-xs overflow-x-auto ${TEXT_SECONDARY} font-mono`}>
                                        {JSON.stringify(order.order_details, null, 2)}
                                      </pre>
                                    </div>
                                  ) : (
                                    <div className="flex justify-between font-black text-2xl pt-3 border-t border-gray-600">
                                      <span className={TEXT_PRIMARY}>TOTALE</span>
                                      <span className="text-green-500">€{(order.total_amount || order.total || 0).toFixed(2)}</span>
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

      {/* Animation Styles */}
      <style>{`
        @keyframes bounce-subtle {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-2px);
          }
        }

        .animate-bounce-subtle {
          animation: bounce-subtle 2s ease-in-out infinite;
        }

        /* Nascondi frecce native input number */
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }

        input[type=number] {
          -moz-appearance: textfield;
        }
      `}</style>
    </div>
  );
}
