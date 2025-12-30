import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  SignedIn, 
  SignedOut, 
  SignIn, 
  useUser, 
  useAuth 
} from '@clerk/clerk-react';
import { 
  Save, Plus, Trash2, Edit2, Eye, EyeOff, DollarSign, MapPin, Clock, 
  Settings, CreditCard, Star, AlertCircle, Phone, ChevronDown, ChevronUp,
  ShoppingBag, TrendingUp, RefreshCw, CheckCircle, LogOut, X
} from 'lucide-react';

// ============================================
// 💎 ADMIN PANEL ORDINLAMPO v4.2 STRIPE
// Design: Grigio #212121 + Bordi Blu #608beb
// Checkout Stripe integrato
// ============================================

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://ordini-lampo-api.ordini-lampo.workers.dev';

// 🛡️ HELPER: Numeri sicuri (evita NaN.toFixed crash)
const toNumber = (value, fallback = 0) => {
  const n = typeof value === 'number' ? value : Number(String(value).replace(',', '.'));
  return Number.isFinite(n) ? n : fallback;
};

// 📊 PIANI TARIFFARI ORDINI-LAMPO (LISTINO UFFICIALE V2.0 GOLD)
// Prezzo pieno = (crediti + bonus) × tariffa
// Sconto = bonus × tariffa
// Cliente paga = crediti × tariffa
const PIANI_TARIFFARI = {
  freedom_150: {
    id: 'freedom_150',
    code: 'FREEDOM_150',
    nome: 'FREEDOM 150',
    nomeBadge: 'FREEDOM',
    tariffa: 1.20,
    crediti: 150,
    bonus: 0,
    totale: 150,
    prezzoPieno: null,
    sconto: 0,
    importo: null, // Pay-as-you-go
    costoPerOrdine: 1.20,
    costoEffettivo: 1.20,
    colore: 'from-emerald-500 to-teal-600',
    descrizione: 'Linea di credito 150 ordini/settimana',
    descrizioneEstesa: 'Lavora tranquillo, paghi solo quello che consumi. Ogni venerdì ricevi il riepilogo e il link per saldare.'
  },
  lampo_500: {
    id: 'lampo_500',
    code: 'LAMPO_500',
    nome: 'LAMPO 500',
    nomeBadge: 'LAMPO',
    tariffa: 0.98,
    crediti: 500,
    bonus: 50,
    totale: 550,
    prezzoPieno: 539.00,  // 550 × 0.98
    sconto: 49.00,        // 50 × 0.98
    importo: 490.00,      // 500 × 0.98
    costoPerOrdine: 0.98,
    costoEffettivo: 0.89, // 490 / 550
    colore: 'from-blue-500 to-blue-600',
    descrizione: '500 + 50 bonus = 550 crediti'
  },
  lampo_1000: {
    id: 'lampo_1000',
    code: 'LAMPO_1000',
    nome: 'LAMPO 1000',
    nomeBadge: 'LAMPO',
    tariffa: 0.85,
    crediti: 1000,
    bonus: 100,
    totale: 1100,
    prezzoPieno: 935.00,  // 1100 × 0.85
    sconto: 85.00,        // 100 × 0.85
    importo: 850.00,      // 1000 × 0.85
    costoPerOrdine: 0.85,
    costoEffettivo: 0.77, // 850 / 1100
    colore: 'from-purple-500 to-purple-600',
    descrizione: '1000 + 100 bonus = 1100 crediti'
  },
  king_1500: {
    id: 'king_1500',
    code: 'KING_1500',
    nome: 'KING 1500',
    nomeBadge: 'KING',
    tariffa: 0.75,
    crediti: 1500,
    bonus: 150,
    totale: 1650,
    prezzoPieno: 1237.50, // 1650 × 0.75
    sconto: 112.50,       // 150 × 0.75
    importo: 1125.00,     // 1500 × 0.75
    costoPerOrdine: 0.75,
    costoEffettivo: 0.68, // 1125 / 1650
    colore: 'from-amber-500 to-amber-600',
    descrizione: '1500 + 150 bonus = 1650 crediti'
  }
};

// 🎨 PALETTE FINALE (Stile Claude.ai - Grigio Scuro)
const BG_TUTTO = 'bg-[#212121]';
const TEXT_PRIMARY = 'text-gray-50';
const TEXT_SECONDARY = 'text-gray-400';
const BORDER_BLU = 'border-[#608beb]';

// Stati ordine
const ORDER_STATUSES = {
  PENDING: { label: 'In Attesa', color: 'bg-yellow-500/20 text-yellow-400', next: 'CONFIRMED' },
  CONFIRMED: { label: 'Confermato', color: 'bg-blue-500/20 text-blue-400', next: 'PREPARING' },
  PREPARING: { label: 'In Preparazione', color: 'bg-purple-500/20 text-purple-400', next: 'READY' },
  READY: { label: 'Pronto', color: 'bg-green-500/20 text-green-400', next: 'DELIVERING' },
  DELIVERING: { label: 'In Consegna', color: 'bg-indigo-500/20 text-indigo-400', next: 'DELIVERED' },
  DELIVERED: { label: 'Consegnato', color: 'bg-gray-500/20 text-gray-400', next: null },
  CANCELLED: { label: 'Annullato', color: 'bg-red-500/20 text-red-400', next: null }
};

// ==================== API CLIENT ====================
const createApiClient = (getToken) => {
  const fetchWithAuth = async (endpoint, options = {}) => {
    const token = await getToken();
    const idempotencyKey = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Idempotency-Key': idempotencyKey,
      ...options.headers
    };

    const res = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  };

  return {
    checkHealth: async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/health`);
        const data = await res.json();
        return data?.status === 'ok';
      } catch { return false; }
    },
    getOrders: (date) => fetchWithAuth(`/admin/orders?date=${date}`),
    getSettings: () => fetchWithAuth('/admin/settings'),
    saveSettings: (data) => fetchWithAuth('/admin/settings', { method: 'PUT', body: JSON.stringify(data) }),
    updateOrderStatus: (orderId, status) => fetchWithAuth(`/admin/orders/${orderId}/status`, { 
      method: 'PATCH', 
      body: JSON.stringify({ status }) 
    }),
    // BILLING ENDPOINTS
    getBillingPlans: () => fetchWithAuth('/admin/billing/plans'),
    getSubscription: () => fetchWithAuth('/admin/billing/subscription'),
    createCheckout: (planCode) => fetchWithAuth('/admin/billing/checkout', { 
      method: 'POST', 
      body: JSON.stringify({ plan_code: planCode }) 
    }),
    getBillingHistory: () => fetchWithAuth('/admin/billing/history')
  };
};

// ==================== MAIN ADMIN COMPONENT ====================
function AdminPanel() {
  const { user } = useUser();
  const { getToken, signOut } = useAuth();
  
  // API Client
  const apiRef = useRef(null);
  if (!apiRef.current) {
    apiRef.current = createApiClient(getToken);
  }
  const api = apiRef.current;

  // Restaurant info from Clerk metadata
  const restaurantSlug = user?.publicMetadata?.restaurant_id || 'pokenjoy-sanremo';
  const restaurantName = user?.publicMetadata?.restaurant_name || 'Pokenjoy Sanremo';

  // ==================== REFS ====================
  const notifTimerRef = useRef(null);
  const ordersReqIdRef = useRef(0);

  // ==================== STATI GENERALI ====================
  const [activeTab, setActiveTab] = useState('orders');
  const [showSaveNotification, setShowSaveNotification] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const [loading, setLoading] = useState(true);

  // ==================== STATI ORDINI ====================
  const [orders, setOrders] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // ==================== STATI SETTINGS ====================
  const [localRestaurantName, setLocalRestaurantName] = useState(restaurantName);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [locations, setLocations] = useState([]);
  const [newLocation, setNewLocation] = useState({ name: '', fee: '', estimatedTime: '' });
  
  // ==================== STATI POKE CONFIG ====================
  const [pokeSizes, setPokeSizes] = useState([
    { id: 'regular', name: 'Regular', price: 9.90 },
    { id: 'large', name: 'Large', price: 12.90 }
  ]);
  const [extraPrices, setExtraPrices] = useState({ base: 1.50, protein: 2.50 });

  // ==================== STATI SUBSCRIPTION ====================
  const [planId, setPlanId] = useState('freedom_150');
  const [subscription, setSubscription] = useState(null);
  const [weeklyStats, setWeeklyStats] = useState({
    ordersCount: 0,
    totaleFee: 0,
    feePerOrdine: 1.20,
    periodStart: null,
    periodEnd: null,
    loading: true
  });

  // ==================== STATI UPGRADE POPUP ====================
  const [showUpgradePopup, setShowUpgradePopup] = useState(false);
  const [selectedUpgradePlan, setSelectedUpgradePlan] = useState(null);
  const [si1_Lettura, setSi1_Lettura] = useState(false);
  const [si2_Accettazione, setSi2_Accettazione] = useState(false);
  const [si3_Consapevolezza, setSi3_Consapevolezza] = useState(false);
  const [signatureName, setSignatureName] = useState('');
  const [upgradeLoading, setUpgradeLoading] = useState(false);

  // ==================== CHECK CHECKOUT SUCCESS ====================
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkout = params.get('checkout');
    const plan = params.get('plan');
    
    if (checkout === 'success' && plan) {
      alert(`✅ Pagamento completato!\n\nI crediti del piano ${plan} sono stati accreditati sul tuo account.`);
      // Rimuovi i parametri dalla URL
      window.history.replaceState({}, '', window.location.pathname);
      // Ricarica subscription
      loadSubscription();
    } else if (checkout === 'cancelled') {
      alert('❌ Pagamento annullato.\n\nPuoi riprovare quando vuoi.');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // ==================== INIT ====================
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const ok = await api.checkHealth();
      setConnectionStatus(ok ? 'connected' : 'disconnected');
      
      if (ok) {
        await Promise.all([
          loadSettings(),
          loadOrders(),
          loadWeeklyStats(),
          loadSubscription()
        ]);
      }
      
      setLoading(false);
    };
    init();
  }, []);

  // ==================== LOADERS ====================
  const loadOrders = async () => {
    const reqId = ++ordersReqIdRef.current;
    setOrdersLoading(true);
    try {
      const data = await api.getOrders(selectedDate);
      if (reqId === ordersReqIdRef.current) {
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error('Errore caricamento ordini:', error);
    } finally {
      if (reqId === ordersReqIdRef.current) {
        setOrdersLoading(false);
      }
    }
  };

  useEffect(() => {
    if (connectionStatus === 'connected') {
      loadOrders();
    }
  }, [selectedDate, connectionStatus]);

  const loadSettings = async () => {
    try {
      const data = await api.getSettings();
      if (data.restaurant) {
        setLocalRestaurantName(data.restaurant.name || restaurantName);
        setWhatsappNumber(data.restaurant.whatsapp_number || '');
      }
      if (data.locations) {
        setLocations(data.locations);
      }
    } catch (error) {
      console.error('Errore caricamento settings:', error);
    }
  };

  const loadSubscription = async () => {
    try {
      const data = await api.getSubscription();
      if (data.subscription) {
        setSubscription(data.subscription);
        // Trova il piano corrispondente
        const plan = Object.values(PIANI_TARIFFARI).find(p => p.code === data.subscription.plan_code);
        if (plan) {
          setPlanId(plan.id);
        }
      }
    } catch (error) {
      console.error('Errore caricamento subscription:', error);
    }
  };

  const loadWeeklyStats = async () => {
    setWeeklyStats(prev => ({ ...prev, loading: true }));
    try {
      // Calcola lunedì della settimana corrente
      const now = new Date();
      const dayOfWeek = now.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const monday = new Date(now);
      monday.setDate(now.getDate() + mondayOffset);
      monday.setHours(0, 0, 0, 0);
      
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      
      // Carica ordini della settimana (semplificato - in prod servirebbe endpoint dedicato)
      const ordersCount = orders.length;
      const feePerOrdine = PIANI_TARIFFARI[planId]?.costoPerOrdine || 1.20;
      
      setWeeklyStats({
        ordersCount,
        totaleFee: ordersCount * feePerOrdine,
        feePerOrdine,
        periodStart: monday,
        periodEnd: sunday,
        loading: false
      });
    } catch (error) {
      console.error('Errore stats settimanali:', error);
      setWeeklyStats(prev => ({ ...prev, loading: false }));
    }
  };

  // ==================== NOTIFICATION ====================
  const showNotification = () => {
    if (notifTimerRef.current) clearTimeout(notifTimerRef.current);
    setShowSaveNotification(true);
    notifTimerRef.current = setTimeout(() => setShowSaveNotification(false), 2000);
  };

  // ==================== ACTIONS ====================
  const saveConfig = async () => {
    setLoading(true);
    try {
      const config = {
        restaurant: { name: localRestaurantName, whatsapp_number: whatsappNumber },
        locations,
        expectedVersion: 1
      };
      await api.saveSettings(config);
      showNotification();
    } catch (error) {
      console.error('Errore salvataggio:', error);
      alert('Errore nel salvataggio');
    } finally {
      setLoading(false);
    }
  };

  // ==================== STRIPE CHECKOUT ====================
  const handleUpgrade = async () => {
    if (!selectedUpgradePlan) return;
    setUpgradeLoading(true);
    
    try {
      // Chiama l'endpoint per creare la sessione Stripe
      const response = await api.createCheckout(selectedUpgradePlan.code);
      
      if (response.success && response.checkout_url) {
        // Redirect a Stripe Checkout
        window.location.href = response.checkout_url;
      } else {
        throw new Error(response.error || 'Errore creazione checkout');
      }
    } catch (error) {
      console.error('Errore checkout:', error);
      alert(`❌ Errore: ${error.message}\n\nRiprova o contatta l'assistenza.`);
      setUpgradeLoading(false);
    }
  };

  const updateGeneric = (setter, id, field, value) => {
    setter(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
    showNotification();
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

  const advanceOrderStatus = async (orderId, currentStatus) => {
    const nextStatus = ORDER_STATUSES[currentStatus]?.next;
    if (!nextStatus) return;
    
    try {
      await api.updateOrderStatus(orderId, nextStatus);
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: nextStatus } : o));
      showNotification();
    } catch (error) {
      console.error('Errore aggiornamento stato:', error);
      alert('Errore nell\'aggiornamento dello stato');
    }
  };

  // ==================== LOADING SCREEN ====================
  if (loading) {
    return (
      <div className={`min-h-screen ${BG_TUTTO} flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#608beb] mx-auto mb-4"></div>
          <p className={TEXT_PRIMARY}>Caricamento...</p>
        </div>
      </div>
    );
  }

  // ==================== MAIN RENDER ====================
  return (
    <div className={`min-h-screen ${BG_TUTTO} ${TEXT_PRIMARY}`}>
      {/* Save Notification */}
      {showSaveNotification && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg animate-bounce-subtle flex items-center gap-2">
          <CheckCircle className="w-5 h-5" /> Salvato!
        </div>
      )}

      {/* Header */}
      <header className={`${BG_TUTTO} border-b ${BORDER_BLU} sticky top-0 z-40`}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-black">
              ⚡ ORDINI<span className="text-[#608beb]">LAMPO</span>
            </h1>
            <span className={`text-sm ${TEXT_SECONDARY}`}>| {localRestaurantName}</span>
          </div>
          <div className="flex items-center gap-4">
            {/* Crediti Badge */}
            {subscription && (
              <div className="bg-green-500/20 border border-green-500/50 px-4 py-2 rounded-xl">
                <span className="text-green-400 font-bold">
                  💰 {subscription.credits_balance + subscription.bonus_balance} crediti
                </span>
              </div>
            )}
            <span className={`flex items-center gap-2 text-sm ${connectionStatus === 'connected' ? 'text-green-400' : 'text-red-400'}`}>
              <span className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
              {connectionStatus === 'connected' ? 'Online' : 'Offline'}
            </span>
            <button onClick={() => signOut()} className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-700">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: 'orders', label: 'Ordini', icon: ShoppingBag },
            { id: 'subscription', label: 'Tariffe', icon: CreditCard },
            { id: 'settings', label: 'Impostazioni', icon: Settings },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? `bg-[#608beb] text-white shadow-lg shadow-[#608beb]/30`
                  : `${BG_TUTTO} ${TEXT_SECONDARY} hover:text-white border ${BORDER_BLU}`
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          
          {/* ==================== TAB ORDINI ==================== */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              {/* Date Picker + Refresh */}
              <div className="flex items-center gap-4">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className={`${BG_TUTTO} border ${BORDER_BLU} ${TEXT_PRIMARY} px-4 py-2 rounded-xl`}
                />
                <button
                  onClick={loadOrders}
                  disabled={ordersLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-[#608beb] text-white rounded-xl hover:bg-[#4a6bc4]"
                >
                  <RefreshCw className={`w-4 h-4 ${ordersLoading ? 'animate-spin' : ''}`} />
                  Aggiorna
                </button>
                <span className={TEXT_SECONDARY}>{orders.length} ordini</span>
              </div>

              {/* Orders List */}
              {ordersLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#608beb] mx-auto"></div>
                </div>
              ) : orders.length === 0 ? (
                <div className={`${BG_TUTTO} border ${BORDER_BLU} rounded-2xl p-12 text-center`}>
                  <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                  <p className={TEXT_SECONDARY}>Nessun ordine per questa data</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {orders.map(order => (
                    <div key={order.id} className={`${BG_TUTTO} border ${BORDER_BLU} rounded-2xl p-5`}>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-bold text-lg">#{order.order_number}</h3>
                          <p className={TEXT_SECONDARY}>{order.customer_name} - {order.customer_phone}</p>
                        </div>
                        <div className="text-right">
                          <span className={`px-3 py-1 rounded-full text-sm font-bold ${ORDER_STATUSES[order.status]?.color || 'bg-gray-500/20 text-gray-400'}`}>
                            {ORDER_STATUSES[order.status]?.label || order.status}
                          </span>
                          <p className="text-green-400 font-bold text-xl mt-1">€{toNumber(order.total).toFixed(2)}</p>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className={TEXT_SECONDARY}>
                          <Clock className="w-4 h-4 inline mr-1" />
                          {order.scheduled_time ? new Date(order.scheduled_time).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                        </p>
                        {ORDER_STATUSES[order.status]?.next && (
                          <button
                            onClick={() => advanceOrderStatus(order.id, order.status)}
                            className="px-4 py-2 bg-[#608beb] text-white rounded-lg hover:bg-[#4a6bc4] text-sm font-bold"
                          >
                            → {ORDER_STATUSES[ORDER_STATUSES[order.status].next]?.label}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ==================== TAB TARIFFE ==================== */}
          {activeTab === 'subscription' && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                
                {/* COLONNA SINISTRA: TARIFFE DISPONIBILI */}
                <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-6 rounded-2xl border border-slate-600">
                  <h2 className={`text-2xl font-black ${TEXT_PRIMARY} mb-6 flex items-center gap-3`}>
                    <span className="text-3xl">📋</span> TARIFFE DISPONIBILI
                  </h2>
                  
                  <div className="space-y-4">
                    {Object.values(PIANI_TARIFFARI).map((piano) => {
                      const isActive = planId === piano.id;
                      const isUpgrade = !isActive && piano.id !== 'freedom_150';
                      
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
                                ? 'border-amber-500/50 hover:border-amber-400 hover:shadow-lg cursor-pointer hover:scale-[1.02]'
                                : 'border-gray-600'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${piano.colore} flex items-center justify-center text-white font-black text-lg shadow-lg`}>
                                {piano.nomeBadge.charAt(0)}
                              </div>
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className={`font-black text-lg ${TEXT_PRIMARY}`}>{piano.nome}</h3>
                                  {isActive && (
                                    <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold">✓ ATTIVO</span>
                                  )}
                                  {isUpgrade && (
                                    <span className="bg-amber-500/20 text-amber-400 text-xs px-2 py-1 rounded-full font-bold border border-amber-500/50">UPGRADE</span>
                                  )}
                                </div>
                                <p className={`text-sm ${TEXT_SECONDARY}`}>{piano.descrizione}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-green-400 font-black text-2xl">€{piano.costoEffettivo.toFixed(2)}</p>
                              <p className={`text-xs ${TEXT_SECONDARY}`}>€/ordine effettivo</p>
                            </div>
                          </div>
                          
                          <div className={`mt-4 pt-4 border-t border-gray-700 grid grid-cols-4 gap-2 text-center`}>
                            <div className="bg-[#1a1a1a] p-2 rounded-lg">
                              <p className={`text-xs ${TEXT_SECONDARY}`}>Crediti</p>
                              <p className={`font-bold ${TEXT_PRIMARY}`}>{piano.crediti}</p>
                            </div>
                            <div className="bg-[#1a1a1a] p-2 rounded-lg">
                              <p className={`text-xs ${TEXT_SECONDARY}`}>Bonus</p>
                              <p className={`font-bold ${piano.bonus > 0 ? 'text-green-400' : TEXT_PRIMARY}`}>
                                {piano.bonus > 0 ? `+${piano.bonus}` : '—'}
                              </p>
                            </div>
                            <div className="bg-[#1a1a1a] p-2 rounded-lg">
                              <p className={`text-xs ${TEXT_SECONDARY}`}>Totale</p>
                              <p className={`font-bold text-green-400`}>{piano.totale}</p>
                            </div>
                            <div className="bg-[#1a1a1a] p-2 rounded-lg">
                              <p className={`text-xs ${TEXT_SECONDARY}`}>Prezzo</p>
                              <p className={`font-bold ${TEXT_PRIMARY}`}>
                                {piano.importo ? `€${piano.importo}` : 'Variabile'}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Link Documenti */}
                  <div className={`mt-6 ${BG_TUTTO} p-4 rounded-xl border border-gray-700`}>
                    <h4 className={`font-bold ${TEXT_PRIMARY} mb-3 flex items-center gap-2`}>📄 Documenti Legali</h4>
                    <div className="grid grid-cols-3 gap-2">
                      <a href="https://ordini-lampo.it/termini-servizio" target="_blank" rel="noopener noreferrer" className="text-center p-2 rounded-lg bg-[#1a1a1a] hover:bg-[#2a2a2a]">
                        <p className={`text-xs ${TEXT_SECONDARY}`}>Termini</p>
                      </a>
                      <a href="https://ordini-lampo.it/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-center p-2 rounded-lg bg-[#1a1a1a] hover:bg-[#2a2a2a]">
                        <p className={`text-xs ${TEXT_SECONDARY}`}>Privacy</p>
                      </a>
                      <a href="https://ordini-lampo.it/tariffe" target="_blank" rel="noopener noreferrer" className="text-center p-2 rounded-lg bg-[#1a1a1a] hover:bg-[#2a2a2a]">
                        <p className={`text-xs ${TEXT_SECONDARY}`}>Listino</p>
                      </a>
                    </div>
                  </div>
                </div>
                
                {/* COLONNA DESTRA: IL TUO PIANO ATTIVO */}
                <div className="bg-gradient-to-br from-emerald-900/30 to-teal-900/30 p-6 rounded-2xl border border-emerald-500/50">
                  <h2 className={`text-2xl font-black ${TEXT_PRIMARY} mb-6 flex items-center gap-3`}>
                    <span className="text-3xl">🎯</span> IL TUO PIANO
                  </h2>
                  
                  {/* Widget Crediti */}
                  {subscription && (
                    <div className="bg-[#1a1a1a] p-5 rounded-xl border border-green-500/30 mb-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className={`text-lg font-bold ${TEXT_PRIMARY} flex items-center gap-2`}>💰 Saldo Crediti</h3>
                        <button onClick={loadSubscription} className="text-green-400 hover:text-green-300 text-sm font-medium bg-green-500/10 px-3 py-1 rounded-lg">
                          🔄 Aggiorna
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="bg-[#212121] p-4 rounded-xl text-center">
                          <p className={`text-xs ${TEXT_SECONDARY} mb-1`}>Acquistati</p>
                          <p className="text-3xl font-black text-blue-400">{subscription.credits_balance || 0}</p>
                        </div>
                        <div className="bg-[#212121] p-4 rounded-xl text-center">
                          <p className={`text-xs ${TEXT_SECONDARY} mb-1`}>Bonus</p>
                          <p className="text-3xl font-black text-amber-400">{subscription.bonus_balance || 0}</p>
                        </div>
                        <div className="bg-[#212121] p-4 rounded-xl text-center">
                          <p className={`text-xs ${TEXT_SECONDARY} mb-1`}>TOTALE</p>
                          <p className="text-3xl font-black text-green-400">
                            {(subscription.credits_balance || 0) + (subscription.bonus_balance || 0)}
                          </p>
                        </div>
                      </div>
                      
                      <p className={`text-xs ${TEXT_SECONDARY} text-center`}>
                        ⚡ I crediti bonus vengono consumati per primi
                      </p>
                    </div>
                  )}
                  
                  {/* Piano Attivo Card */}
                  <div className={`${BG_TUTTO} p-6 rounded-xl border-2 border-green-500`}>
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`w-16 h-16 rounded-xl bg-gradient-to-r ${PIANI_TARIFFARI[planId]?.colore} flex items-center justify-center text-white font-black text-2xl shadow-lg`}>
                        {PIANI_TARIFFARI[planId]?.nomeBadge?.charAt(0) || 'F'}
                      </div>
                      <div>
                        <h3 className={`font-black text-2xl ${TEXT_PRIMARY}`}>{PIANI_TARIFFARI[planId]?.nome || 'FREEDOM 150'}</h3>
                        <p className="text-green-400 font-bold">Piano Attivo</p>
                      </div>
                    </div>
                    <div className="bg-[#1a1a1a] p-4 rounded-lg">
                      <div className="flex justify-between mb-2">
                        <span className={TEXT_SECONDARY}>Costo per ordine:</span>
                        <span className={`font-bold ${TEXT_PRIMARY}`}>€{PIANI_TARIFFARI[planId]?.costoPerOrdine?.toFixed(2) || '1.20'}</span>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span className={TEXT_SECONDARY}>Costo effettivo:</span>
                        <span className={`font-bold text-green-400`}>€{PIANI_TARIFFARI[planId]?.costoEffettivo?.toFixed(2) || '1.20'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={TEXT_SECONDARY}>Stato:</span>
                        <span className="text-green-400 font-bold">✓ Attivo</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================== TAB IMPOSTAZIONI ==================== */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h2 className={`text-2xl font-bold ${TEXT_PRIMARY} mb-6`}>⚙️ Impostazioni</h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className={`${BG_TUTTO} p-6 rounded-2xl border ${BORDER_BLU}`}>
                  <h3 className={`font-bold ${TEXT_PRIMARY} mb-4`}>🏪 Nome Ristorante</h3>
                  <input
                    type="text"
                    value={localRestaurantName}
                    onChange={(e) => setLocalRestaurantName(e.target.value)}
                    className={`w-full p-4 rounded-xl ${BG_TUTTO} border ${BORDER_BLU} ${TEXT_PRIMARY} font-medium`}
                  />
                </div>
                
                <div className={`${BG_TUTTO} p-6 rounded-2xl border ${BORDER_BLU}`}>
                  <h3 className={`font-bold ${TEXT_PRIMARY} mb-4`}>📱 Numero WhatsApp</h3>
                  <input
                    type="text"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    className={`w-full p-4 rounded-xl ${BG_TUTTO} border ${BORDER_BLU} ${TEXT_PRIMARY} font-medium`}
                  />
                </div>
              </div>
              
              <div className={`${BG_TUTTO} p-6 rounded-2xl border ${BORDER_BLU}`}>
                <h3 className={`font-bold ${TEXT_PRIMARY} mb-4`}>🔗 Stato Connessione</h3>
                <div className="flex items-center gap-3">
                  <span className={`w-4 h-4 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                  <span className={connectionStatus === 'connected' ? 'text-green-400' : 'text-red-400'}>
                    {connectionStatus === 'connected' ? 'API Connessa' : 'Errore Connessione'}
                  </span>
                </div>
                <p className={`${TEXT_SECONDARY} mt-2 text-sm`}>
                  Endpoint: {API_BASE_URL}
                </p>
              </div>
              
              <button
                onClick={saveConfig}
                className="w-full py-4 bg-[#608beb] text-white font-bold rounded-xl hover:bg-[#4a6bc4] flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" /> Salva Impostazioni
              </button>
            </div>
          )}

        </div>
      </div>

      {/* ==================== POPUP UPGRADE STRIPE ==================== */}
      {showUpgradePopup && selectedUpgradePlan && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border-2 border-amber-500/50 shadow-2xl">
            
            {/* Header Popup */}
            <div className="sticky top-0 bg-gradient-to-r from-amber-600 to-amber-700 p-6 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black text-white">🚀 UPGRADE A {selectedUpgradePlan.nome}</h2>
                <p className="text-amber-100">Risparmia €{((1.20 - selectedUpgradePlan.costoEffettivo) * selectedUpgradePlan.totale).toFixed(0)} su {selectedUpgradePlan.totale} ordini</p>
              </div>
              <button onClick={() => setShowUpgradePopup(false)} className="text-white hover:bg-amber-800 p-2 rounded-full">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              
              {/* Riepilogo Piano con PARTITA DOPPIA */}
              <div className="bg-[#212121] p-5 rounded-xl border border-gray-700">
                <h4 className={`font-bold ${TEXT_PRIMARY} mb-3`}>📊 RIEPILOGO ACQUISTO</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className={TEXT_SECONDARY}>{selectedUpgradePlan.totale} crediti × €{selectedUpgradePlan.tariffa.toFixed(2)}</span>
                    <span className={TEXT_PRIMARY}>€{selectedUpgradePlan.prezzoPieno?.toFixed(2)}</span>
                  </div>
                  {selectedUpgradePlan.bonus > 0 && (
                    <div className="flex justify-between text-green-400">
                      <span>Bonus {selectedUpgradePlan.bonus} crediti OMAGGIO</span>
                      <span className="font-bold">-€{selectedUpgradePlan.sconto?.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-700">
                    <span className={TEXT_PRIMARY}>TOTALE DA PAGARE</span>
                    <span className="text-amber-400">€{selectedUpgradePlan.importo?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2">
                    <span className={TEXT_SECONDARY}>Costo effettivo per ordine</span>
                    <span className="text-green-400 font-bold">€{selectedUpgradePlan.costoEffettivo?.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              {/* Documenti Legali */}
              <div className="bg-[#212121] p-4 rounded-xl">
                <h4 className="font-bold text-white mb-3">📄 DOCUMENTI LEGALI</h4>
                <p className={`text-xs ${TEXT_SECONDARY} mb-3`}>Prima di procedere, leggi attentamente tutti i documenti:</p>
                <div className="grid grid-cols-3 gap-2">
                  <a href="https://ordini-lampo.it/contratto-upgrade.html" target="_blank" rel="noopener noreferrer"
                    className="bg-amber-500/20 border border-amber-500 p-3 rounded-lg text-center hover:bg-amber-500/30 transition-colors">
                    <span className="text-2xl block mb-1">📜</span>
                    <p className="text-amber-400 text-xs font-bold">CONTRATTO</p>
                  </a>
                  <a href="https://ordini-lampo.it/termini-servizio" target="_blank" rel="noopener noreferrer"
                    className="bg-[#1a1a1a] border border-gray-600 p-3 rounded-lg text-center hover:bg-[#2a2a2a]">
                    <span className="text-2xl block mb-1">📋</span>
                    <p className={`text-xs ${TEXT_SECONDARY}`}>Termini</p>
                  </a>
                  <a href="https://ordini-lampo.it/privacy-policy" target="_blank" rel="noopener noreferrer"
                    className="bg-[#1a1a1a] border border-gray-600 p-3 rounded-lg text-center hover:bg-[#2a2a2a]">
                    <span className="text-2xl block mb-1">🔒</span>
                    <p className={`text-xs ${TEXT_SECONDARY}`}>Privacy</p>
                  </a>
                </div>
              </div>
              
              {/* Clausole Importanti */}
              <div className="bg-red-900/30 border border-red-500/50 p-4 rounded-xl">
                <h4 className="font-bold text-red-400 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" /> CLAUSOLE IMPORTANTI
                </h4>
                <ul className="text-xs text-gray-300 space-y-2">
                  <li className="flex items-start gap-2"><span className="text-red-400">•</span><span>I crediti <strong>NON sono rimborsabili</strong> in nessun caso</span></li>
                  <li className="flex items-start gap-2"><span className="text-red-400">•</span><span>I crediti sono validi <strong>12 mesi</strong> dalla data di acquisto</span></li>
                  <li className="flex items-start gap-2"><span className="text-red-400">•</span><span>Accettando, <strong>rinunci ad azioni di rivalsa</strong> per rimborsi</span></li>
                  <li className="flex items-start gap-2"><span className="text-red-400">•</span><span><strong>Divieto assoluto</strong> di divulgare/vendere dati clienti a terzi</span></li>
                  <li className="flex items-start gap-2"><span className="text-red-400">•</span><span>Violazioni privacy → <strong>segnalazione a Garante e A.G.</strong></span></li>
                  <li className="flex items-start gap-2"><span className="text-red-400">•</span><span>Al termine crediti → passaggio automatico a FREEDOM 150</span></li>
                </ul>
              </div>
              
              {/* FORMULA DEI TRE SÌ */}
              <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-600">
                <h4 className="font-bold text-white mb-4 text-center text-lg">📜 DICHIARAZIONI OBBLIGATORIE</h4>
                <p className={`text-xs ${TEXT_SECONDARY} text-center mb-4`}>
                  Ai sensi degli artt. 46 e 47 del D.P.R. 445/2000, consapevole delle sanzioni penali previste dall'art. 76 del medesimo decreto e dall'art. 483 c.p. per dichiarazioni mendaci:
                </p>
                
                {/* SÌ 1 */}
                <label className={`flex items-start gap-3 cursor-pointer p-4 rounded-xl mb-3 border-2 transition-all ${
                  si1_Lettura ? 'bg-green-900/30 border-green-500' : 'bg-[#212121] border-gray-600 hover:border-blue-500'
                }`}>
                  <input type="checkbox" checked={si1_Lettura} onChange={(e) => setSi1_Lettura(e.target.checked)}
                    className="w-6 h-6 mt-0.5 rounded border-2 border-green-500 bg-transparent flex-shrink-0" />
                  <div>
                    <span className="text-green-400 font-black text-lg">SÌ 1</span>
                    <span className={`text-sm ${TEXT_PRIMARY} ml-2`}>
                      — <strong>DICHIARO</strong> di aver letto integralmente il Contratto di Acquisto Crediti Prepagati <em>prima</em> della presente sottoscrizione.
                    </span>
                  </div>
                </label>
                
                {/* SÌ 2 */}
                <label className={`flex items-start gap-3 cursor-pointer p-4 rounded-xl mb-3 border-2 transition-all ${
                  si2_Accettazione ? 'bg-green-900/30 border-green-500' : 'bg-[#212121] border-gray-600 hover:border-amber-500'
                }`}>
                  <input type="checkbox" checked={si2_Accettazione} onChange={(e) => setSi2_Accettazione(e.target.checked)}
                    className="w-6 h-6 mt-0.5 rounded border-2 border-green-500 bg-transparent flex-shrink-0" />
                  <div>
                    <span className="text-amber-400 font-black text-lg">SÌ 2</span>
                    <span className={`text-sm ${TEXT_PRIMARY} ml-2`}>
                      — <strong>ACCETTO</strong> integralmente e senza riserve tutte le clausole contrattuali, incluse quelle vessatorie ex artt. 1341-1342 c.c. (Artt. 5, 6, 8-bis, 8-ter, 9, 13).
                    </span>
                  </div>
                </label>
                
                {/* SÌ 3 */}
                <label className={`flex items-start gap-3 cursor-pointer p-4 rounded-xl border-2 transition-all ${
                  si3_Consapevolezza ? 'bg-green-900/30 border-green-500' : 'bg-[#212121] border-gray-600 hover:border-red-500'
                }`}>
                  <input type="checkbox" checked={si3_Consapevolezza} onChange={(e) => setSi3_Consapevolezza(e.target.checked)}
                    className="w-6 h-6 mt-0.5 rounded border-2 border-green-500 bg-transparent flex-shrink-0" />
                  <div>
                    <span className="text-red-400 font-black text-lg">SÌ 3</span>
                    <span className={`text-sm ${TEXT_PRIMARY} ml-2`}>
                      — <strong>SONO CONSAPEVOLE</strong> che le presenti dichiarazioni hanno valore legale, che eventuali dichiarazioni false configurano reato penale (art. 483 c.p.), e che tale circostanza non potrà essere contestata in sede giudiziale.
                    </span>
                  </div>
                </label>
                
                {/* Contatore */}
                <div className="mt-4 text-center">
                  <span className={`text-lg font-bold ${si1_Lettura && si2_Accettazione && si3_Consapevolezza ? 'text-green-400' : 'text-gray-500'}`}>
                    {[si1_Lettura, si2_Accettazione, si3_Consapevolezza].filter(Boolean).length}/3 dichiarazioni confermate
                  </span>
                </div>
              </div>
              
              {/* Firma Digitale */}
              <div>
                <label className={`block text-sm font-medium ${TEXT_SECONDARY} mb-2`}>✍️ Firma Digitale (scrivi il tuo nome completo)</label>
                <input
                  type="text"
                  value={signatureName}
                  onChange={(e) => setSignatureName(e.target.value)}
                  placeholder="Mario Rossi"
                  className={`w-full p-4 rounded-xl bg-[#212121] border-2 ${signatureName.length >= 3 ? 'border-green-500' : 'border-gray-600'} ${TEXT_PRIMARY} font-medium text-lg`}
                />
                <p className={`text-xs ${TEXT_SECONDARY} mt-1`}>
                  La firma vale come accettazione formale del contratto ai sensi del Reg. eIDAS. Data: {new Date().toLocaleDateString('it-IT')}
                </p>
              </div>
              
              {/* Bottone PAGA CON STRIPE */}
              <button
                disabled={!si1_Lettura || !si2_Accettazione || !si3_Consapevolezza || signatureName.length < 3 || upgradeLoading}
                onClick={handleUpgrade}
                className={`w-full py-4 rounded-xl font-black text-xl transition-all ${
                  si1_Lettura && si2_Accettazione && si3_Consapevolezza && signatureName.length >= 3
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 shadow-lg shadow-green-500/30'
                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                }`}
              >
                {upgradeLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Redirect a Stripe...
                  </span>
                ) : (
                  `💳 PAGA €${selectedUpgradePlan.importo?.toFixed(2)} CON STRIPE`
                )}
              </button>
              
              <p className={`text-xs ${TEXT_SECONDARY} text-center`}>
                🔒 Pagamento sicuro tramite Stripe. Vedrai €{selectedUpgradePlan.prezzoPieno?.toFixed(2)} - €{selectedUpgradePlan.sconto?.toFixed(2)} sconto = €{selectedUpgradePlan.importo?.toFixed(2)}
              </p>
              
            </div>
          </div>
        </div>
      )}

      {/* Animation Styles */}
      <style>{`
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
        .animate-bounce-subtle { animation: bounce-subtle 2s ease-in-out infinite; }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
      `}</style>
    </div>
  );
}

// ==================== APP WRAPPER ====================
export default function App() {
  return (
    <>
      <SignedOut>
        <div className="min-h-screen bg-[#212121] flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-black text-gray-50">
                ⚡ ORDINI<span className="text-[#608beb]">LAMPO</span>
              </h1>
              <p className="text-gray-400 mt-2">Admin Panel</p>
            </div>
            <SignIn 
              appearance={{
                elements: {
                  rootBox: "mx-auto",
                  card: "shadow-xl rounded-2xl bg-[#1a1a1a] border border-[#608beb]"
                }
              }}
            />
          </div>
        </div>
      </SignedOut>
      <SignedIn>
        <AdminPanel />
      </SignedIn>
    </>
  );
}
