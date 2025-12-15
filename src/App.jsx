import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Edit2, Eye, EyeOff, DollarSign, MapPin, Clock, Settings, CreditCard, Star, Phone, ChevronDown, ChevronUp, LogOut } from 'lucide-react';
import { supabase, getRestaurantConfig, saveRestaurantConfig, testConnection } from './supabaseClient';

// ============================================
// 💎 ADMIN PANEL ORDINLAMPO - MULTI-TENANT SaaS v5.2
// FIX CRITICO: Rimosso RESTAURANT_ID hardcoded
// FIX: toNumber(), defense in depth, collision-free IDs
// Design: Mono Grigio #212121 + Bordi Blu #608beb
// ============================================

const SUPABASE_FUNCTIONS_URL = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL || 'https://juwusmklaavhshwkfjjs.supabase.co/functions/v1';

// 🛡️ UTILITY: Conversione sicura a numero (previene NaN)
const toNumber = (v, fallback = 0) => {
  const n = typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : fallback;
};

// ⚠️ STRIPE PRICE IDs - DA SOSTITUIRE CON ID REALI
const STRIPE_PRICES = {
  freedom_150: '', // Piano default - metered billing
  lampo_500: 'price_LAMPO500_TODO',
  max_1000: 'price_LAMPO1000_TODO',
  king_1500: 'price_KING1500_TODO'
};

// Helper: verifica se piano ha Stripe ID valido (formato: price_XXXX...)
const isPlanReady = (planId) => {
  const priceId = STRIPE_PRICES[planId];
  return typeof priceId === 'string'
    && /^price_/.test(priceId)
    && !priceId.includes('TODO')
    && priceId.length > 20;
};

// 📊 PIANI TARIFFARI ORDINI-LAMPO (RETAIL)
const PIANI_TARIFFARI = {
  freedom_150: {
    id: 'freedom_150',
    nome: 'FREEDOM 150',
    nomeBadge: 'FREEDOM',
    tariffa: 1.20,
    crediti: 150,
    bonus: 0,
    totale: 150,
    importo: null,
    costoPerOrdine: 1.20,
    colore: 'from-emerald-500 to-teal-600',
    descrizione: 'Linea di credito 150 ordini/settimana',
    descrizioneEstesa: 'Paghi solo quello che consumi. Saldo ogni venerdì. In caso di esaurimento crediti prima del venerdì, è richiesto il pagamento immediato per rinnovare la linea o passare a un pacchetto prepagato.'
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
    costoPerOrdine: 0.98,
    colore: 'from-blue-500 to-blue-600',
    descrizione: 'Piano standard prepagato'
  },
  max_1000: {
    id: 'max_1000',
    nome: 'LAMPO 1000',
    nomeBadge: 'LAMPO',
    tariffa: 0.90,
    crediti: 1000,
    bonus: 50,
    totale: 1050,
    importo: 900,
    costoPerOrdine: 0.86,
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
    costoPerOrdine: 0.75,
    colore: 'from-amber-500 to-amber-600',
    descrizione: 'Elite retail - Miglior prezzo'
  }
};

// 🎨 PALETTE (Claude Style)
const BG_TUTTO = 'bg-[#212121]';
const TEXT_PRIMARY = 'text-gray-50';
const TEXT_SECONDARY = 'text-gray-400';
const BORDER_BLU = 'border-[#608beb]';

// ============================================
// 🎨 ICONE CUSTOM
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
  BowlS: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 10c0 4.4 3.6 8 8 8s8-3.6 8-8H4z" fill="currentColor" fillOpacity="0.15" />
      <path d="M4 10c0-1 2-2 5-2s5 1 5 2" />
    </svg>
  ),
  BowlM: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9c0 5 4 9 9 9s9-4 9-9H3z" fill="currentColor" fillOpacity="0.15" />
      <path d="M3 9c0-1.5 2.5-3 6-3s6 1.5 6 3" />
    </svg>
  ),
  BowlL: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 8c0 5.5 4.5 10 10 10s10-4.5 10-10H2z" fill="currentColor" fillOpacity="0.15" />
      <path d="M2 8c0-2.5 3-4.5 7-4.5s7 2 7 4.5" />
    </svg>
  )
};

export default function OrdinlampoAdmin() {
  // ============================================
  // STATE MANAGEMENT - MULTI-TENANT
  // ============================================
  const [restaurantId, setRestaurantId] = useState(null); // 🟢 MULTI-TENANT FIX
  const [userId, setUserId] = useState(null); // 🛡️ Per defense in depth
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Dati Configurazione
  const [locations, setLocations] = useState([]);
  const [pokeSizes, setPokeSizes] = useState([
    { id: 'small', name: 'Piccola', price: 8.50 },
    { id: 'medium', name: 'Media', price: 10.50 },
    { id: 'large', name: 'Grande', price: 12.50 }
  ]);
  const [extraPrices, setExtraPrices] = useState({ protein: 1.00, ingredient: 0.50, sauce: 0.30 });
  const [floorDelivery, setFloorDelivery] = useState({ enabled: true, fee: 1.50 });
  const [riderTip, setRiderTip] = useState(1.00);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [deliveryEnabled, setDeliveryEnabled] = useState(true);

  // UI State
  const [activeTab, setActiveTab] = useState('locations');
  const [editingLocation, setEditingLocation] = useState(null);
  const [newLocation, setNewLocation] = useState({ name: '', fee: '', estimatedTime: '' });
  const [showSaveNotification, setShowSaveNotification] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('checking');

  // Ordini & Notifiche
  const [newOrders, setNewOrders] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNewOrderAlert, setShowNewOrderAlert] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  // Stripe & Subscription
  const [subscriptionStatus, setSubscriptionStatus] = useState('trial');
  const [planId, setPlanId] = useState('freedom_150');

  // Statistiche
  const [weeklyStats, setWeeklyStats] = useState({
    ordersCount: 0,
    totalAmount: 0,
    totaleFee: 0,
    feePerOrdine: 1.20,
    periodStart: null,
    periodEnd: null,
    loading: true
  });

  // Upgrade Flow - Formula TRE SÌ
  const [showUpgradePopup, setShowUpgradePopup] = useState(false);
  const [selectedUpgradePlan, setSelectedUpgradePlan] = useState(null);
  const [si1_Lettura, setSi1_Lettura] = useState(false);
  const [si2_Accettazione, setSi2_Accettazione] = useState(false);
  const [si3_Consapevolezza, setSi3_Consapevolezza] = useState(false);
  const [signatureName, setSignatureName] = useState('');
  const [upgradeLoading, setUpgradeLoading] = useState(false);

  // 🔐 LOGIN FORM STATE
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // ============================================
  // INITIALIZATION & AUTH (CRITICAL)
  // ============================================
  useEffect(() => {
    const initApp = async () => {
      setLoading(true);
      try {
        // 1. Verifica Connessione DB
        const isConnected = await testConnection();
        setConnectionStatus(isConnected ? 'connected' : 'error');
        if (!isConnected) throw new Error('Impossibile connettersi al Database Supabase.');

        // 2. Identifica Utente e Ristorante (Multi-Tenant Logic)
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Utente non autenticato. Effettua il login.');

        setUserId(user.id); // 🛡️ Salva per defense in depth

        // Cerca il ristorante di proprietà dell'utente
        const { data: restaurant, error: rError } = await supabase
          .from('restaurants')
          .select('id, name, slug, delivery_enabled')
          .eq('owner_id', user.id) // 🔒 SECURITY CHECK
          .single();

        if (rError || !restaurant) {
          console.error("No restaurant found:", rError);
          throw new Error('Nessun ristorante associato a questo account.');
        }

        setRestaurantId(restaurant.id);
        setRestaurantName(restaurant.name);
        setDeliveryEnabled(restaurant.delivery_enabled ?? true);

        // 3. Carica Configurazioni Ristorante specifico
        await loadRestaurantData(restaurant.id);

      } catch (e) {
        console.error("Init Error:", e);
        setAuthError(e.message);
      } finally {
        setLoading(false);
      }
    };
    initApp();
  }, []);

  // Effetto separato per Realtime (si attiva solo quando abbiamo restaurantId)
  useEffect(() => {
    if (!restaurantId) return;

    const channel = supabase.channel(`orders-${restaurantId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${restaurantId}` },
        (payload) => {
          // 🛡️ Dedup: evita duplicati su reconnect/doppia tab
          setNewOrders(prev => {
            const exists = prev.some(o => o.id === payload.new.id);
            if (exists) return prev; // Skip duplicato
            
            // Notifica solo se nuovo
            setUnreadCount(c => c + 1);
            setShowNewOrderAlert(true);
            playNotificationSound();
            if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 200]);
            loadOrders(restaurantId);
            setTimeout(() => setShowNewOrderAlert(false), 15000);
            
            return [payload.new, ...prev].slice(0, 20);
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [restaurantId]);

  // 🔄 Ricalcola stats quando cambia planId o restaurantId
  useEffect(() => {
    if (restaurantId && planId) {
      loadWeeklyStats(restaurantId);
    }
  }, [restaurantId, planId]);

  // ============================================
  // DATA LOADING & HANDLERS
  // ============================================
  const loadRestaurantData = async (id) => {
    const config = await getRestaurantConfig(id);
    if (config) {
      if (config.subscription_status) setSubscriptionStatus(config.subscription_status);
      if (config.plan_id) setPlanId(config.plan_id);

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
    await loadOrders(id);
    await loadWeeklyStats(id);
  };

  const loadOrders = async (id = restaurantId) => {
    if (!id) return;
    setLoadingOrders(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('restaurant_id', id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      if (data) setOrders(data);
    } catch (error) { console.error('Errore ordini:', error); }
    setLoadingOrders(false);
  };

  // Periodo: SABATO → VENERDÌ (coerente con pagamento ogni venerdì)
  const loadWeeklyStats = async (id = restaurantId) => {
    if (!id) return;
    try {
      const now = new Date();
      const dayOfWeek = now.getDay();
      let diffToSaturday;
      if (dayOfWeek === 6) diffToSaturday = 0;
      else if (dayOfWeek === 0) diffToSaturday = -1;
      else diffToSaturday = -(dayOfWeek + 1);

      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() + diffToSaturday);
      startOfWeek.setHours(0, 0, 0, 0);

      // 🛡️ Fix timezone: usa [start, end) con .lt() per evitare bug ai bordi
      const endExclusive = new Date(startOfWeek);
      endExclusive.setDate(startOfWeek.getDate() + 7); // Sabato + 7 = Sabato prossimo

      const { data, error } = await supabase
        .from('orders')
        .select('id, total, total_amount')
        .eq('restaurant_id', id)
        .gte('created_at', startOfWeek.toISOString())
        .lt('created_at', endExclusive.toISOString()); // .lt() non .lte()

      if (error) throw error;

      const ordersCount = data?.length || 0;
      // 🛡️ Usa total_amount con fallback a total (allineamento con UI)
      const totalAmount = data?.reduce((sum, o) => sum + toNumber(o.total_amount ?? o.total, 0), 0) ?? 0;
      const pianoAttivo = PIANI_TARIFFARI[planId] || PIANI_TARIFFARI.freedom_150;
      const feePerOrdine = pianoAttivo.costoPerOrdine;
      const totaleFee = ordersCount * feePerOrdine;

      setWeeklyStats({
        ordersCount, totalAmount, totaleFee, feePerOrdine,
        periodStart: startOfWeek, periodEnd: new Date(endExclusive.getTime() - 1), loading: false
      });
    } catch (error) {
      console.error('Errore stats:', error);
      setWeeklyStats(prev => ({ ...prev, loading: false }));
    }
  };

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
    } catch (error) { console.error('Sound error:', error); }
  };

  const updateGeneric = (setter, id, field, value) => {
    setter(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
    showNotificationFn();
  };

  const addLocation = () => {
    // 🛡️ Validazione: nome obbligatorio, fee può essere 0, tempo obbligatorio
    const feeNum = toNumber(newLocation.fee, -1);
    if (newLocation.name && feeNum >= 0 && newLocation.estimatedTime) {
      // 🛡️ ID collision-free: slug + timestamp
      const slug = newLocation.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const id = `${slug}-${Date.now()}`;
      setLocations([...locations, { 
        id, 
        name: newLocation.name, 
        fee: feeNum, 
        estimatedTime: newLocation.estimatedTime, 
        active: true 
      }]);
      setNewLocation({ name: '', fee: '', estimatedTime: '' });
      showNotificationFn();
    }
  };

  const deleteLocation = (id) => {
    if (window.confirm('Eliminare questa località?')) {
      setLocations(locations.filter(loc => loc.id !== id));
      showNotificationFn();
    }
  };

  const toggleLocationActive = (id) => {
    setLocations(locations.map(loc => loc.id === id ? { ...loc, active: !loc.active } : loc));
    showNotificationFn();
  };

  const updatePokeSize = (id, field, value) => {
    setPokeSizes(pokeSizes.map(s => s.id === id ? { ...s, [field]: toNumber(value, s[field]) } : s));
    showNotificationFn();
  };

  const updateExtraPrice = (field, value) => {
    setExtraPrices({ ...extraPrices, [field]: toNumber(value, extraPrices[field]) });
    showNotificationFn();
  };

  const saveAllConfigurations = async () => {
    if (!restaurantId || !userId) return;
    setLoading(true);
    try {
      const config = {
        delivery_locations: locations, poke_sizes: pokeSizes, extra_prices: extraPrices,
        floor_delivery: floorDelivery, rider_tip: riderTip, whatsapp_number: whatsappNumber,
        restaurant_name: restaurantName, last_updated: new Date().toISOString()
      };

      // 🛡️ Defense in depth: aggiungi owner_id check
      const { error: upErr } = await supabase
        .from('restaurants')
        .update({ name: restaurantName })
        .eq('id', restaurantId)
        .eq('owner_id', userId);
      if (upErr) throw upErr;
        
      const result = await saveRestaurantConfig(restaurantId, config);
      if (!result) throw new Error('saveRestaurantConfig failed');
      
      showNotificationFn();
    } catch (e) {
      console.error('Save error:', e);
      alert('Errore nel salvataggio.');
    } finally {
      setLoading(false);
    }
  };

  const showNotificationFn = () => {
    setShowSaveNotification(true);
    setTimeout(() => setShowSaveNotification(false), 3000);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  // 🔐 LOGIN HANDLER
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });
      
      if (error) throw error;
      
      // Ricarica la pagina per inizializzare l'app
      window.location.reload();
    } catch (error) {
      setLoginError(error.message || 'Errore durante il login');
    } finally {
      setLoginLoading(false);
    }
  };

  const renderBowlIcon = (sizeId) => {
    const iconClass = "text-[#608beb]";
    switch (sizeId) {
      case 'small': return <Icons.BowlS className={`w-8 h-8 ${iconClass}`} />;
      case 'medium': return <Icons.BowlM className={`w-10 h-10 ${iconClass}`} />;
      case 'large': return <Icons.BowlL className={`w-12 h-12 ${iconClass}`} />;
      default: return <Icons.BowlM className={`w-10 h-10 ${iconClass}`} />;
    }
  };

  const getStatusBadge = () => {
    if (planId !== 'freedom_150' && subscriptionStatus === 'active') {
      return (
        <span className="px-4 py-2 rounded-full text-sm font-bold bg-gradient-to-r from-[#608beb] to-[#4a7bd9] text-white flex items-center gap-1 shadow-lg shadow-[#608beb]/30">
          <Star className="w-4 h-4" /> {PIANI_TARIFFARI[planId]?.nomeBadge || 'PRO'}
        </span>
      );
    }
    return <span className="px-4 py-2 rounded-full text-sm font-bold bg-gray-600 text-gray-300 shadow-lg">FREEDOM</span>;
  };

  // ============================================
  // RENDER CONDITIONAL (Loading / Error)
  // ============================================
  if (loading) {
    return (
      <div className={`min-h-screen ${BG_TUTTO} flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#608beb] mx-auto mb-4"></div>
          <p className={`${TEXT_PRIMARY} font-medium`}>Caricamento Ordini-Lampo...</p>
        </div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className={`min-h-screen ${BG_TUTTO} flex items-center justify-center p-4`}>
        <div className="max-w-md w-full bg-[#1a1a1a] p-8 rounded-2xl border border-[#608beb] shadow-2xl">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">⚡ Ordini-Lampo</h1>
            <p className="text-gray-400">Admin Panel</p>
          </div>
          
          {authError && (
            <div className="bg-red-900/30 border border-red-500/50 rounded-xl p-4 mb-6 text-center">
              <p className="text-red-400 text-sm">{authError}</p>
            </div>
          )}
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-gray-400 text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full bg-[#212121] border border-gray-600 rounded-xl p-4 text-white focus:border-[#608beb] focus:outline-none transition-colors"
                placeholder="la-tua@email.com"
                required
              />
            </div>
            
            <div>
              <label className="block text-gray-400 text-sm font-medium mb-2">Password</label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full bg-[#212121] border border-gray-600 rounded-xl p-4 text-white focus:border-[#608beb] focus:outline-none transition-colors"
                placeholder="••••••••"
                required
              />
            </div>
            
            {loginError && (
              <div className="bg-red-900/30 border border-red-500/50 rounded-xl p-3 text-center">
                <p className="text-red-400 text-sm">{loginError}</p>
              </div>
            )}
            
            <button
              type="submit"
              disabled={loginLoading}
              className="w-full bg-gradient-to-r from-[#608beb] to-[#4a7bd9] text-white font-bold py-4 px-6 rounded-xl hover:from-[#5078d8] hover:to-[#3a6bc9] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#608beb]/30"
            >
              {loginLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Accesso in corso...
                </span>
              ) : (
                '🔐 Accedi'
              )}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-gray-500 text-xs">
              Powered by Ordini-Lampo • Pagamenti sicuri con Stripe
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // MAIN RENDER
  // ============================================
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
                    🔔 {unreadCount} {unreadCount === 1 ? 'nuovo' : 'nuovi'}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                <span className={`text-sm ${TEXT_SECONDARY} font-medium`}>
                  {restaurantName || 'Ristorante'} • {connectionStatus === 'connected' ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleLogout}
                className="bg-[#2a2a2a] hover:bg-[#333] text-gray-400 font-bold py-4 px-4 rounded-xl flex items-center gap-2 transition-all border border-gray-600"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
              <button
                onClick={saveAllConfigurations}
                disabled={loading}
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-4 px-8 rounded-xl flex items-center gap-2 shadow-xl shadow-green-500/40 hover:shadow-2xl hover:scale-105 transition-all disabled:opacity-50 border border-green-400/30"
              >
                <Save className="w-5 h-5" />
                <span>Salva</span>
              </button>
            </div>
          </div>
        </div>

        {/* Notifica Salvataggio */}
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
                  CHIAMA
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
                    : `${TEXT_SECONDARY} hover:bg-[#2a2a2a]`
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
                            onBlur={(e) => updateGeneric(setLocations, loc.id, 'fee', toNumber(e.target.value, loc.fee))}
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
                        className={`p-3 ${BG_TUTTO} rounded-xl border ${BORDER_BLU} hover:bg-[#2a2a2a] transition-colors shadow-sm`}
                      >
                        {loc.active ? <Eye className="w-5 h-5 text-green-500" /> : <EyeOff className="w-5 h-5 text-gray-500" />}
                      </button>
                      <button
                        onClick={() => setEditingLocation(editingLocation === loc.id ? null : loc.id)}
                        className={`p-3 ${BG_TUTTO} rounded-xl border ${BORDER_BLU} hover:bg-[#2a2a2a] transition-colors shadow-sm`}
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
                  <div className="flex gap-3 flex-wrap">
                    <input
                      className={`border border-[#608beb] p-3 rounded-xl flex-1 min-w-[150px] font-medium ${BG_TUTTO} ${TEXT_PRIMARY}`}
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
                      className="bg-gradient-to-r from-[#608beb] to-[#4a7bd9] text-white px-8 py-3 rounded-xl font-bold hover:from-[#4a7bd9] hover:to-[#3a6bc9] transition-all shadow-lg"
                    >
                      AGGIUNGI
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB PREZZI */}
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
                            <div className={`flex items-center gap-2 bg-[#1a1a1a] rounded-xl p-1 border ${BORDER_BLU}`}>
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
                                onClick={() => updatePokeSize(size.id, 'price', (toNumber(size.price) + 0.50).toFixed(2))}
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
                            <div className={`flex items-center gap-2 bg-[#1a1a1a] rounded-xl p-1 border ${BORDER_BLU}`}>
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
                                onClick={() => updateExtraPrice(key, (toNumber(val) + 0.10).toFixed(2))}
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

            {/* TAB ABBONAMENTO */}
            {activeTab === 'subscription' && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* COLONNA SINISTRA: TARIFFE DISPONIBILI */}
                  <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-6 rounded-2xl border border-slate-600">
                    <h2 className={`text-3xl font-black ${TEXT_PRIMARY} mb-6 flex items-center gap-3`}>
                      <span className="text-4xl">📋</span>
                      TARIFFE DISPONIBILI
                    </h2>

                    <div className="space-y-4">
                      {Object.values(PIANI_TARIFFARI).map((piano) => {
                        const isActive = planId === piano.id;
                        const canUpgrade = !isActive && piano.id !== 'freedom_150';
                        const isReady = isPlanReady(piano.id);
                        const isUpgrade = canUpgrade && isReady; // 🛡️ Solo se Stripe pronto

                        return (
                          <div
                            key={piano.id}
                            onClick={() => {
                              if (isUpgrade) {
                                setSelectedUpgradePlan(piano);
                                setShowUpgradePopup(true);
                                setSi1_Lettura(false);
                                setSi2_Accettazione(false);
                                setSi3_Consapevolezza(false);
                                setSignatureName('');
                              }
                            }}
                            className={`${BG_TUTTO} p-5 rounded-xl border-2 transition-all ${
                              isActive
                                ? 'border-green-500 ring-2 ring-green-500/30 shadow-lg shadow-green-500/20'
                                : isUpgrade
                                  ? 'border-amber-500/50 hover:border-amber-400 hover:shadow-lg hover:shadow-amber-500/20 cursor-pointer hover:scale-[1.02]'
                                  : canUpgrade && !isReady
                                    ? 'border-gray-700 opacity-50'
                                    : 'border-gray-600'
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="flex items-center gap-3 mb-1">
                                  <h3 className={`font-black text-3xl ${TEXT_PRIMARY}`}>{piano.nome}</h3>
                                  {isActive && (
                                    <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold animate-pulse">
                                      ✓ ATTIVO
                                    </span>
                                  )}
                                  {isUpgrade && (
                                    <span className="bg-amber-500/20 text-amber-400 text-xs px-2 py-1 rounded-full font-bold border border-amber-500/50">
                                      UPGRADE
                                    </span>
                                  )}
                                  {canUpgrade && !isReady && (
                                    <span className="bg-gray-700 text-gray-400 text-xs px-2 py-1 rounded-full font-bold">
                                      PROSSIMAMENTE
                                    </span>
                                  )}
                                </div>
                                <p className={`text-sm ${TEXT_SECONDARY}`}>{piano.descrizione}</p>
                                {piano.descrizioneEstesa && (
                                  <p className={`text-xs ${TEXT_SECONDARY} mt-1 italic max-w-sm`}>{piano.descrizioneEstesa}</p>
                                )}
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="text-green-400 font-black text-3xl">€{piano.costoPerOrdine.toFixed(2)}</p>
                                <p className={`text-sm ${TEXT_SECONDARY}`}>€/ordine</p>
                              </div>
                            </div>

                            <div className={`mt-4 pt-4 border-t border-gray-700 grid grid-cols-3 gap-3 text-center`}>
                              <div className="bg-[#1a1a1a] p-2 rounded-lg">
                                <p className={`text-xs ${TEXT_SECONDARY}`}>Crediti</p>
                                <p className={`font-bold text-lg ${TEXT_PRIMARY}`}>{piano.crediti || piano.totale}</p>
                              </div>
                              <div className="bg-[#1a1a1a] p-2 rounded-lg">
                                <p className={`text-xs ${TEXT_SECONDARY}`}>Bonus</p>
                                <p className={`font-bold text-lg ${piano.bonus > 0 ? 'text-green-400' : TEXT_PRIMARY}`}>
                                  {piano.bonus > 0 ? `+${piano.bonus}` : '—'}
                                </p>
                              </div>
                              <div className="bg-[#1a1a1a] p-2 rounded-lg">
                                <p className={`text-xs ${TEXT_SECONDARY}`}>Importo</p>
                                <p className={`font-bold text-lg ${TEXT_PRIMARY}`}>
                                  {piano.importo ? `€${piano.importo}` : 'A consumo'}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* COLONNA DESTRA: IL TUO PIANO ATTIVO */}
                  <div className="bg-gradient-to-br from-emerald-900/30 to-teal-900/30 p-6 rounded-2xl border border-emerald-500/50">
                    <h2 className={`text-3xl font-black ${TEXT_PRIMARY} mb-6 flex items-center gap-3`}>
                      <span className="text-4xl">🎯</span>
                      IL TUO PIANO
                    </h2>

                    {/* WIDGET CONTATORE SETTIMANALE */}
                    <div className="bg-[#1a1a1a] p-5 rounded-xl border border-green-500/30 mb-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className={`text-lg font-bold ${TEXT_PRIMARY} flex items-center gap-2`}>
                          📊 Questa Settimana
                        </h3>
                        <button
                          onClick={() => loadWeeklyStats(restaurantId)}
                          className="text-green-400 hover:text-green-300 text-sm font-medium bg-green-500/10 px-3 py-1 rounded-lg"
                        >
                          🔄 Aggiorna
                        </button>
                      </div>

                      {weeklyStats.loading ? (
                        <div className="text-center py-6">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
                        </div>
                      ) : (
                        <>
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="bg-[#212121] p-4 rounded-xl text-center">
                              <p className={`text-xs ${TEXT_SECONDARY} mb-1`}>Ordini</p>
                              <p className="text-4xl font-black text-green-400">{weeklyStats.ordersCount}</p>
                            </div>
                            <div className="bg-[#212121] p-4 rounded-xl text-center">
                              <p className={`text-xs ${TEXT_SECONDARY} mb-1`}>Fee Totale</p>
                              <p className="text-4xl font-black text-amber-400">€{weeklyStats.totaleFee?.toFixed(2) || '0.00'}</p>
                            </div>
                          </div>
                          <div className="bg-[#212121] p-3 rounded-lg text-center">
                            <span className={`text-sm ${TEXT_SECONDARY}`}>
                              {weeklyStats.ordersCount} × €{weeklyStats.feePerOrdine?.toFixed(2) || '1.20'}
                            </span>
                            <span className="text-amber-400 font-bold ml-2">
                              = €{weeklyStats.totaleFee?.toFixed(2) || '0.00'}
                            </span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* FASCIONE PIANO ATTIVO */}
                    {(() => {
                      const pianoAttivo = PIANI_TARIFFARI[planId] || PIANI_TARIFFARI.freedom_150;
                      return (
                        <div className="bg-[#1a1a1a] p-5 rounded-xl border-2 border-green-500 shadow-lg shadow-green-500/20">
                          <div className="mb-4">
                            <p className={`text-xs ${TEXT_SECONDARY} uppercase tracking-wider mb-1`}>Piano Attivo</p>
                            <h2 className={`text-3xl font-black ${TEXT_PRIMARY}`}>{pianoAttivo.nome}</h2>
                            <p className="text-green-400 font-bold text-2xl">€{pianoAttivo.costoPerOrdine.toFixed(2)} <span className="text-base">€/ordine</span></p>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between bg-[#212121] p-3 rounded-lg">
                              <span className={TEXT_SECONDARY}>Stato</span>
                              <span className="text-green-500 font-bold">✅ ATTIVO</span>
                            </div>
                            <div className="flex justify-between bg-[#212121] p-3 rounded-lg">
                              <span className={TEXT_SECONDARY}>Prossimo pagamento</span>
                              <span className={`${TEXT_PRIMARY} font-medium`}>
                                {pianoAttivo.id === 'freedom_150' ? '💳 Venerdì' : '📦 A esaurimento'}
                              </span>
                            </div>
                            <div className="flex justify-between bg-[#212121] p-3 rounded-lg">
                              <span className={TEXT_SECONDARY}>Crediti disponibili</span>
                              <span className={`${TEXT_PRIMARY} font-bold`}>{pianoAttivo.totale}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Info Pagamento */}
                    <div className="mt-6 bg-[#1a1a1a] p-4 rounded-xl border border-gray-700">
                      <div className="flex items-start gap-3">
                        <span className="text-3xl">💳</span>
                        <div>
                          <h4 className={`font-bold ${TEXT_PRIMARY}`}>Come Funziona il Pagamento</h4>
                          <p className={`text-sm ${TEXT_SECONDARY} mt-1`}>
                            <strong>FREEDOM:</strong> Inserisci i dati della carta una sola volta. Ogni venerdì l'addebito avviene in automatico tramite Stripe. In caso di esaurimento crediti prima del venerdì, l'addebito è immediato.
                          </p>
                          <p className={`text-sm ${TEXT_SECONDARY} mt-2`}>
                            <strong>PREPAGATI:</strong> Pagamento anticipato una tantum. Nessun addebito automatico.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Info Sicurezza Stripe */}
                    <div className="mt-4 bg-[#1a1a1a] p-4 rounded-xl border border-gray-700">
                      <div className="flex items-start gap-3">
                        <span className="text-3xl">🔒</span>
                        <div>
                          <h4 className={`font-bold ${TEXT_PRIMARY}`}>Pagamenti Sicuri con Stripe</h4>
                          <p className={`text-sm ${TEXT_SECONDARY} mt-1`}>
                            I pagamenti sono gestiti da <strong>Stripe</strong>, leader mondiale nei pagamenti online utilizzato da Amazon, Google, Shopify, Booking.com e milioni di aziende.
                          </p>
                          <p className={`text-xs ${TEXT_SECONDARY} mt-2 italic`}>
                            ⚠️ Ordini-Lampo non ha accesso ai dati della tua carta. Stripe gestisce tutto in modo automatico, sicuro e certificato PCI-DSS. Non possiamo visualizzare, modificare o intervenire sui tuoi dati bancari.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* POPUP UPGRADE CONTRATTO */}
                {showUpgradePopup && selectedUpgradePlan && (
                  <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#1a1a1a] rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden border-2 border-amber-500 flex flex-col">
                      {/* Header Sticky */}
                      <div className="bg-gradient-to-r from-amber-600 to-orange-600 p-6 flex-shrink-0 sticky top-0 z-10">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-amber-100 text-sm font-medium">UPGRADE A</p>
                            <h2 className="text-3xl font-black text-white">{selectedUpgradePlan.nome}</h2>
                            <p className="text-amber-100 mt-1">€{selectedUpgradePlan.importo} per {selectedUpgradePlan.totale} ordini</p>
                          </div>
                          <button
                            onClick={() => setShowUpgradePopup(false)}
                            className="bg-white/20 hover:bg-white/30 text-white w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold transition-colors"
                          >
                            ✕
                          </button>
                        </div>
                      </div>

                      <div className="p-6 space-y-6 overflow-y-auto flex-1">

                        {/* Riepilogo Ordine */}
                        <div className="bg-[#212121] p-4 rounded-xl">
                          <h4 className={`font-bold ${TEXT_PRIMARY} mb-3`}>📦 Riepilogo Ordine</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className={TEXT_SECONDARY}>Crediti base</span>
                              <span className={TEXT_PRIMARY}>{selectedUpgradePlan.crediti}</span>
                            </div>
                            {selectedUpgradePlan.bonus > 0 && (
                              <div className="flex justify-between">
                                <span className={TEXT_SECONDARY}>Bonus inclusi</span>
                                <span className="text-green-400">+{selectedUpgradePlan.bonus}</span>
                              </div>
                            )}
                            <div className="flex justify-between border-t border-gray-700 pt-2 mt-2">
                              <span className={`${TEXT_PRIMARY} font-bold`}>Totale crediti</span>
                              <span className={`${TEXT_PRIMARY} font-bold`}>{selectedUpgradePlan.totale}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className={TEXT_SECONDARY}>Costo effettivo</span>
                              <span className="text-green-400 font-bold">€{selectedUpgradePlan.costoPerOrdine.toFixed(2)}/ordine</span>
                            </div>
                          </div>
                        </div>

                        {/* Documenti Legali */}
                        <div className="bg-amber-900/20 p-4 rounded-xl border border-amber-500/30">
                          <h4 className={`font-bold ${TEXT_PRIMARY} mb-3`}>📄 DOCUMENTI LEGALI</h4>
                          <div className="space-y-2">
                            <a href="https://ordini-lampo.it/contratto-upgrade" target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-2 text-amber-400 hover:text-amber-300 font-medium bg-amber-500/10 p-2 rounded-lg">
                              📜 CONTRATTO INTEGRALE (leggi prima di procedere)
                            </a>
                            <a href="https://ordini-lampo.it/termini-servizio" target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm">
                              📋 Termini di Servizio
                            </a>
                            <a href="https://ordini-lampo.it/privacy-policy" target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm">
                              🔒 Privacy Policy
                            </a>
                          </div>
                        </div>

                        {/* Clausole Importanti */}
                        <div className="bg-red-900/20 p-4 rounded-xl border border-red-500/30">
                          <h4 className="font-bold text-red-400 mb-3">⚠️ CLAUSOLE IMPORTANTI</h4>
                          <ul className={`text-sm ${TEXT_SECONDARY} space-y-2`}>
                            <li className="flex items-start gap-2">
                              <span className="text-red-400">•</span>
                              <span><strong>Nessun rimborso</strong> in nessun caso (Art. 5)</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-red-400">•</span>
                              <span>Crediti validi <strong>12 mesi</strong> dalla data di acquisto</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-red-400">•</span>
                              <span><strong>Rinuncia espressa</strong> ad azioni di rivalsa (Art. 6)</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-red-400">•</span>
                              <span><strong>Divieto assoluto</strong> di divulgare/vendere dati clienti a terzi</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-red-400">•</span>
                              <span>Violazioni privacy → <strong>segnalazione a Garante e A.G.</strong></span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-red-400">•</span>
                              <span>Al termine crediti → passaggio automatico a FREEDOM 150, salvo acquisto di altro pacchetto prepagato</span>
                            </li>
                          </ul>
                        </div>

                        {/* FORMULA DEI TRE SÌ */}
                        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-600">
                          <h4 className="font-bold text-white mb-4 text-center text-lg">
                            📜 DICHIARAZIONI OBBLIGATORIE
                          </h4>
                          <p className={`text-xs ${TEXT_SECONDARY} text-center mb-4`}>
                            Ai sensi degli artt. 46 e 47 del D.P.R. 445/2000, consapevole delle sanzioni penali previste dall'art. 76 del medesimo decreto e dall'art. 483 c.p. per dichiarazioni mendaci:
                          </p>

                          {/* SÌ 1: Ho letto */}
                          <label className={`flex items-start gap-3 cursor-pointer p-4 rounded-xl mb-3 border-2 transition-all ${
                            si1_Lettura
                              ? 'bg-green-900/30 border-green-500'
                              : 'bg-[#212121] border-gray-600 hover:border-blue-500'
                          }`}>
                            <input
                              type="checkbox"
                              checked={si1_Lettura}
                              onChange={(e) => setSi1_Lettura(e.target.checked)}
                              className="w-6 h-6 mt-0.5 rounded border-2 border-green-500 bg-transparent checked:bg-green-500 flex-shrink-0"
                            />
                            <div>
                              <span className="text-green-400 font-black text-lg">SÌ 1</span>
                              <span className={`text-sm ${TEXT_PRIMARY} ml-2`}>
                                — <strong>DICHIARO</strong> di aver letto integralmente il Contratto di Acquisto Crediti Prepagati <em>prima</em> della presente sottoscrizione.
                              </span>
                            </div>
                          </label>

                          {/* SÌ 2: Accetto */}
                          <label className={`flex items-start gap-3 cursor-pointer p-4 rounded-xl mb-3 border-2 transition-all ${
                            si2_Accettazione
                              ? 'bg-green-900/30 border-green-500'
                              : 'bg-[#212121] border-gray-600 hover:border-amber-500'
                          }`}>
                            <input
                              type="checkbox"
                              checked={si2_Accettazione}
                              onChange={(e) => setSi2_Accettazione(e.target.checked)}
                              className="w-6 h-6 mt-0.5 rounded border-2 border-green-500 bg-transparent checked:bg-green-500 flex-shrink-0"
                            />
                            <div>
                              <span className="text-amber-400 font-black text-lg">SÌ 2</span>
                              <span className={`text-sm ${TEXT_PRIMARY} ml-2`}>
                                — <strong>ACCETTO</strong> integralmente e senza riserve tutte le clausole contrattuali, incluse quelle vessatorie ex artt. 1341-1342 c.c. (Artt. 5, 6, 8-bis, 8-ter, 9, 13).
                              </span>
                            </div>
                          </label>

                          {/* SÌ 3: Sono consapevole */}
                          <label className={`flex items-start gap-3 cursor-pointer p-4 rounded-xl border-2 transition-all ${
                            si3_Consapevolezza
                              ? 'bg-green-900/30 border-green-500'
                              : 'bg-[#212121] border-gray-600 hover:border-red-500'
                          }`}>
                            <input
                              type="checkbox"
                              checked={si3_Consapevolezza}
                              onChange={(e) => setSi3_Consapevolezza(e.target.checked)}
                              className="w-6 h-6 mt-0.5 rounded border-2 border-green-500 bg-transparent checked:bg-green-500 flex-shrink-0"
                            />
                            <div>
                              <span className="text-red-400 font-black text-lg">SÌ 3</span>
                              <span className={`text-sm ${TEXT_PRIMARY} ml-2`}>
                                — <strong>SONO CONSAPEVOLE</strong> che le presenti dichiarazioni hanno valore legale, che eventuali dichiarazioni false configurano reato penale (art. 483 c.p.), e che tale circostanza non potrà essere contestata in sede giudiziale.
                              </span>
                            </div>
                          </label>

                          {/* Contatore SÌ */}
                          <div className="mt-4 text-center">
                            <span className={`text-lg font-bold ${
                              si1_Lettura && si2_Accettazione && si3_Consapevolezza
                                ? 'text-green-400'
                                : 'text-gray-500'
                            }`}>
                              {[si1_Lettura, si2_Accettazione, si3_Consapevolezza].filter(Boolean).length}/3 dichiarazioni confermate
                            </span>
                          </div>
                        </div>

                        {/* Firma Digitale */}
                        <div>
                          <label className={`block text-sm font-medium ${TEXT_SECONDARY} mb-2`}>
                            ✍️ Firma Digitale (scrivi il tuo nome completo)
                          </label>
                          <input
                            type="text"
                            value={signatureName}
                            onChange={(e) => setSignatureName(e.target.value)}
                            placeholder="Nome e Cognome"
                            className={`w-full p-4 rounded-xl bg-[#212121] border-2 ${
                              signatureName.length >= 3 ? 'border-green-500' : 'border-gray-600'
                            } ${TEXT_PRIMARY} font-medium text-lg`}
                          />
                          <p className={`text-xs ${TEXT_SECONDARY} mt-1`}>
                            La firma vale come accettazione formale del contratto ai sensi del Reg. eIDAS. Data: {new Date().toLocaleDateString('it-IT')}
                          </p>
                        </div>

                        {/* Bottone Paga */}
                        <button
                          disabled={!si1_Lettura || !si2_Accettazione || !si3_Consapevolezza || signatureName.length < 3 || upgradeLoading}
                          onClick={async () => {
                            setUpgradeLoading(true);
                            try {
                              const priceId = STRIPE_PRICES[selectedUpgradePlan.id];

                              if (!priceId || priceId.includes('TODO')) {
                                alert("Configurazione Stripe incompleta. Contatta l'amministrazione.");
                                setUpgradeLoading(false);
                                return;
                              }

                              // Salva firma nel DB con i 3 SÌ
                              await supabase.from('contract_signatures').insert({
                                restaurant_id: restaurantId,
                                plan_id: selectedUpgradePlan.id,
                                signature_name: signatureName,
                                signed_at: new Date().toISOString(),
                                si1_lettura: si1_Lettura,
                                si2_accettazione: si2_Accettazione,
                                si3_consapevolezza: si3_Consapevolezza,
                                ip_address: 'client-side'
                              });

                              // Chiama Stripe Checkout
                              const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/stripe-checkout`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  priceId: priceId,
                                  restaurantId: restaurantId,
                                  successUrl: window.location.href,
                                  cancelUrl: window.location.href
                                })
                              });

                              const { url } = await response.json();
                              if (url) window.location.href = url;

                            } catch (error) {
                              console.error('Errore upgrade:', error);
                              alert('Errore durante il processo. Riprova.');
                            }
                            setUpgradeLoading(false);
                          }}
                          className={`w-full py-4 rounded-xl font-black text-xl transition-all ${
                            si1_Lettura && si2_Accettazione && si3_Consapevolezza && signatureName.length >= 3
                              ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 shadow-lg shadow-green-500/30'
                              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          {upgradeLoading ? 'Elaborazione...' : `💳 PAGA €${selectedUpgradePlan.importo} E ATTIVA`}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
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
                          // 🛡️ Defense in depth: aggiungi owner_id check
                          await supabase
                            .from('restaurants')
                            .update({ delivery_enabled: newVal })
                            .eq('id', restaurantId)
                            .eq('owner_id', userId);
                          await supabase
                            .from('restaurant_settings')
                            .update({ enable_delivery: newVal })
                            .eq('restaurant_id', restaurantId);
                          showNotificationFn();
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
                      <div className={`w-10 h-10 bg-white rounded-full absolute top-1 shadow-md transition-all duration-300 border border-gray-300 ${
                        deliveryEnabled ? 'left-[52px]' : 'left-1'
                      }`}></div>
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
                    onClick={() => loadOrders(restaurantId)}
                    className="text-blue-400 hover:bg-[#2a2a2a] px-6 py-3 rounded-xl font-bold transition-colors border border-[#608beb] shadow-md"
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
                            <div className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-white text-2xl shadow-lg ${
                              order.order_type === 'delivery' ? 'bg-gradient-to-br from-orange-500 to-red-600' : 'bg-gradient-to-br from-[#608beb] to-[#4a7bd9]'
                            }`}>
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
                            </div>

                            {order.customer_phone && (
                              <a href={`tel:${order.customer_phone}`} className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-4 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl">
                                <Phone className="w-6 h-6" />
                              </a>
                            )}

                            <button
                              onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                              className="bg-[#2a2a2a] text-gray-200 p-4 rounded-xl hover:bg-[#333] transition-colors shadow-md"
                            >
                              {expandedOrderId === order.id ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
                            </button>
                          </div>
                        </div>
                        {expandedOrderId === order.id && (
                          <div className={`p-6 border-t border-[#608beb]/20 ${BG_TUTTO}`}>
                            <div className="grid md:grid-cols-2 gap-8">
                              <div>
                                <h4 className={`font-bold ${TEXT_SECONDARY} mb-3 uppercase text-xs tracking-wider`}>Dati Cliente</h4>
                                <p className={`font-bold text-xl ${TEXT_PRIMARY}`}>{order.customer_name || 'N/A'}</p>
                                <p className={`${TEXT_SECONDARY} flex items-center gap-2 font-medium`}>
                                  <Phone className="w-4 h-4" /> {order.customer_phone || 'N/A'}
                                </p>
                                {order.delivery_address && (
                                  <p className={`${TEXT_SECONDARY} mt-2 font-medium`}>📍 {order.delivery_address}</p>
                                )}
                              </div>
                              <div>
                                <h4 className={`font-bold ${TEXT_SECONDARY} mb-3 uppercase text-xs tracking-wider`}>Riepilogo</h4>
                                <pre className={`whitespace-pre-wrap text-xs ${TEXT_SECONDARY}`}>
                                  {JSON.stringify(order.order_details || order.items || {}, null, 2)}
                                </pre>
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
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
        .animate-bounce-subtle { animation: bounce-subtle 2s ease-in-out infinite; }
        input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
      `}</style>
    </div>
  );
}
