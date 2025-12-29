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
// 💎 ADMIN PANEL ORDINLAMPO v4.0 PROFESSIONAL
// Design: Grigio #212121 + Bordi Blu #608beb
// Migrato da Supabase a Clerk/Neon
// ============================================

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://ordini-lampo-api.ordini-lampo.workers.dev';

// 🛡️ HELPER: Numeri sicuri (evita NaN.toFixed crash)
const toNumber = (value, fallback = 0) => {
  const n = typeof value === 'number' ? value : Number(String(value).replace(',', '.'));
  return Number.isFinite(n) ? n : fallback;
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
    descrizioneEstesa: 'Lavora tranquillo, paghi solo quello che consumi. Ogni venerdì ricevi il riepilogo e il link per saldare.'
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

// ============================================
// 🎨 ICONE CUSTOM (Busta Rossa + Bowl SVG)
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

// ============================================
// API CLIENT per Clerk
// ============================================
const createApiClient = (getToken) => {
  const fetchWithAuth = async (endpoint, options = {}) => {
    const token = await getToken();
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
      }
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || `HTTP ${res.status}`);
    }
    return res.json();
  };

  return {
    testConnection: async () => {
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
    signContract: (data) => fetchWithAuth('/admin/contract-signatures', { method: 'POST', body: JSON.stringify(data) }),
    createCheckout: (data) => fetchWithAuth('/admin/create-checkout', { method: 'POST', body: JSON.stringify(data) })
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
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // ==================== STATI LOCALITÀ ====================
  const [locations, setLocations] = useState([
    { id: 'sanremo', name: 'Sanremo', fee: 3.50, estimatedTime: '15-20 min', active: true },
    { id: 'poggio', name: 'Poggio', fee: 5.00, estimatedTime: '20-25 min', active: true },
    { id: 'bussana', name: 'Bussana', fee: 5.00, estimatedTime: '25-30 min', active: true },
    { id: 'ospedaletti', name: 'Ospedaletti', fee: 5.00, estimatedTime: '20-25 min', active: true },
    { id: 'coldirodi', name: 'Coldirodi', fee: 6.00, estimatedTime: '20-25 min', active: true }
  ]);
  const [editingLocation, setEditingLocation] = useState(null);
  const [newLocation, setNewLocation] = useState({ name: '', fee: '', estimatedTime: '' });

  // ==================== STATI PREZZI ====================
  const [pokeSizes, setPokeSizes] = useState([
    { id: 'small', name: 'Piccola', price: 8.50 },
    { id: 'medium', name: 'Media', price: 10.50 },
    { id: 'large', name: 'Grande', price: 12.50 }
  ]);
  const [extraPrices, setExtraPrices] = useState({ protein: 1.00, ingredient: 0.50, sauce: 0.30 });
  const [floorDelivery, setFloorDelivery] = useState({ enabled: true, fee: 1.50 });
  const [riderTip, setRiderTip] = useState(1.00);

  // ==================== STATI ABBONAMENTO ====================
  const [planId, setPlanId] = useState('freedom_150');
  const [subscriptionStatus, setSubscriptionStatus] = useState('active');
  
  // ==================== STATI IMPOSTAZIONI ====================
  const [whatsappNumber, setWhatsappNumber] = useState('393896382394');
  const [localRestaurantName, setLocalRestaurantName] = useState(restaurantName);

  // ==================== STATI STATISTICHE SETTIMANALI ====================
  const [weeklyStats, setWeeklyStats] = useState({
    ordersCount: 0,
    totalAmount: 0,
    totaleFee: 0,
    feePerOrdine: 1.20,
    periodStart: null,
    periodEnd: null,
    loading: true
  });

  // ==================== STATI POPUP UPGRADE ====================
  const [showUpgradePopup, setShowUpgradePopup] = useState(false);
  const [selectedUpgradePlan, setSelectedUpgradePlan] = useState(null);
  const [si1_Lettura, setSi1_Lettura] = useState(false);
  const [si2_Accettazione, setSi2_Accettazione] = useState(false);
  const [si3_Consapevolezza, setSi3_Consapevolezza] = useState(false);
  const [signatureName, setSignatureName] = useState('');
  const [upgradeLoading, setUpgradeLoading] = useState(false);

  // ==================== HANDLERS ====================
  const showNotification = useCallback(() => {
    if (notifTimerRef.current) clearTimeout(notifTimerRef.current);
    setShowSaveNotification(true);
    notifTimerRef.current = setTimeout(() => setShowSaveNotification(false), 3000);
  }, []);

  const loadOrders = useCallback(async (date) => {
    const reqId = ++ordersReqIdRef.current;
    setOrdersLoading(true);
    try {
      const data = await api.getOrders(date || selectedDate);
      if (reqId === ordersReqIdRef.current && data?.orders) {
        setOrders(data.orders);
      }
    } catch (error) {
      console.error('Errore caricamento ordini:', error);
    } finally {
      if (reqId === ordersReqIdRef.current) setOrdersLoading(false);
    }
  }, [api, selectedDate]);

  const loadWeeklyStats = useCallback(async () => {
    try {
      const now = new Date();
      const dayOfWeek = now.getDay();
      const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() + diffToMonday);
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      // Per ora usiamo dati mock - da collegare all'API
      const pianoAttivo = PIANI_TARIFFARI[planId] || PIANI_TARIFFARI.freedom_150;
      const ordersCount = orders.length;
      const feePerOrdine = pianoAttivo.costoPerOrdine;
      const totaleFee = ordersCount * feePerOrdine;

      setWeeklyStats({
        ordersCount,
        totalAmount: orders.reduce((sum, o) => sum + toNumber(o.total_amount || o.total, 0), 0),
        totaleFee,
        feePerOrdine,
        periodStart: startOfWeek,
        periodEnd: endOfWeek,
        loading: false
      });
    } catch (error) {
      console.error('Errore statistiche:', error);
      setWeeklyStats(prev => ({ ...prev, loading: false }));
    }
  }, [orders, planId]);

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await api.updateOrderStatus(orderId, newStatus);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      showNotification();
    } catch (error) {
      console.error('Errore aggiornamento stato:', error);
      alert('Errore aggiornamento stato ordine');
    }
  };

  const saveAllConfigurations = async () => {
    setLoading(true);
    try {
      const config = {
        settings: {
          delivery_locations: locations,
          poke_sizes: pokeSizes,
          extra_prices: extraPrices,
          floor_delivery: floorDelivery,
          rider_tip: riderTip,
          whatsapp_number: whatsappNumber,
          restaurant_name: localRestaurantName
        }
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

  const handleUpgrade = async () => {
    if (!selectedUpgradePlan) return;
    setUpgradeLoading(true);
    try {
      // Salva firma contratto
      await api.signContract({
        plan_id: selectedUpgradePlan.id,
        signature_name: signatureName,
        si1_lettura: si1_Lettura,
        si2_accettazione: si2_Accettazione,
        si3_consapevolezza: si3_Consapevolezza
      });

      // Crea checkout Stripe
      const { url } = await api.createCheckout({
        plan_id: selectedUpgradePlan.id,
        success_url: window.location.href,
        cancel_url: window.location.href
      });

      if (url) window.location.href = url;
    } catch (error) {
      console.error('Errore upgrade:', error);
      alert('Errore durante il processo. Riprova.');
    } finally {
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

  const renderBowlIcon = (sizeId) => {
    const iconClass = "text-[#608beb]";
    switch (sizeId) {
      case 'small': return <Icons.BowlS className={`w-8 h-8 ${iconClass}`} />;
      case 'medium': return <Icons.BowlM className={`w-10 h-10 ${iconClass}`} />;
      case 'large': return <Icons.BowlL className={`w-12 h-12 ${iconClass}`} />;
      default: return <Icons.BowlM className={`w-10 h-10 ${iconClass}`} />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  // ==================== EFFECTS ====================
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const isConnected = await api.testConnection();
        setConnectionStatus(isConnected ? 'connected' : 'error');
        
        if (isConnected) {
          await loadOrders(selectedDate);
        }
      } catch (error) {
        console.error('Init error:', error);
        setConnectionStatus('error');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
    
    return () => {
      if (notifTimerRef.current) clearTimeout(notifTimerRef.current);
    };
  }, []);

  useEffect(() => {
    loadWeeklyStats();
  }, [orders, planId]);

  useEffect(() => {
    if (selectedDate) loadOrders(selectedDate);
  }, [selectedDate]);

  // ==================== LOADING SCREEN ====================
  if (loading && connectionStatus === 'checking') {
    return (
      <div className={`min-h-screen ${BG_TUTTO} flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#608beb] mx-auto mb-4"></div>
          <p className={`${TEXT_PRIMARY} font-medium`}>Caricamento...</p>
        </div>
      </div>
    );
  }

  // ==================== RENDER ====================
  return (
    <div className={`min-h-screen ${BG_TUTTO} py-8 px-4 relative overflow-hidden font-sans`}>
      <div className="max-w-6xl mx-auto relative z-20">
        
        {/* HEADER */}
        <div className={`${BG_TUTTO} rounded-2xl shadow-2xl p-8 mb-8 border ${BORDER_BLU}`}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h1 className={`text-3xl font-bold ${TEXT_PRIMARY}`}>
                  ⚡ ORDINI<span className="text-[#608beb]">LAMPO</span>
                </h1>
                <span className={`px-4 py-2 rounded-full text-sm font-bold bg-gradient-to-r ${PIANI_TARIFFARI[planId]?.colore || 'from-emerald-500 to-teal-600'} text-white shadow-lg`}>
                  {PIANI_TARIFFARI[planId]?.nomeBadge || 'FREEDOM'}
                </span>
                {unreadCount > 0 && (
                  <span className="relative inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-red-600 to-red-700 text-white font-bold shadow-lg animate-pulse">
                    🔔 {unreadCount} {unreadCount === 1 ? 'nuovo' : 'nuovi'}
                  </span>
                )}
              </div>
              <p className={`${TEXT_SECONDARY} font-medium`}>{localRestaurantName}</p>
              <div className="flex items-center gap-4 mt-2">
                <span className={`flex items-center gap-2 text-sm ${connectionStatus === 'connected' ? 'text-green-400' : 'text-red-400'}`}>
                  <span className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></span>
                  {connectionStatus === 'connected' ? 'Connesso' : 'Errore Connessione'}
                </span>
                <span className={`text-sm ${TEXT_SECONDARY}`}>👤 {user?.primaryEmailAddress?.emailAddress}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={saveAllConfigurations}
                disabled={loading}
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-4 px-8 rounded-xl flex items-center gap-2 shadow-xl shadow-green-500/30 transition-all disabled:opacity-50"
              >
                <Save className="w-5 h-5" />
                <span>Salva Modifiche</span>
              </button>
              <button
                onClick={() => signOut()}
                className={`${BG_TUTTO} border ${BORDER_BLU} p-4 rounded-xl hover:bg-red-900/30 transition-colors`}
                title="Logout"
              >
                <LogOut className="w-5 h-5 text-red-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Notifica Salvataggio */}
        {showSaveNotification && (
          <div className="fixed top-8 right-8 bg-gradient-to-r from-red-600 to-red-700 text-white px-8 py-5 rounded-2xl shadow-2xl flex items-center gap-4 z-50 border border-[#608beb] animate-bounce">
            <Icons.RedEnvelope className="w-10 h-10" />
            <div>
              <p className="font-bold text-lg">Salvato con successo!</p>
              <p className="text-sm text-red-100">好运 (Buona Fortuna)</p>
            </div>
          </div>
        )}

        {/* TABS */}
        <div className={`${BG_TUTTO} rounded-2xl shadow-2xl border ${BORDER_BLU} mb-8 overflow-hidden`}>
          <div className="flex border-b-2 border-[#608beb]/30 overflow-x-auto bg-[#212121]">
            {[
              { id: 'orders', label: 'Ordini', icon: ShoppingBag, count: orders.length },
              { id: 'locations', label: 'Località', icon: MapPin },
              { id: 'prices', label: 'Prezzi', icon: DollarSign },
              { id: 'subscription', label: 'Tariffe', icon: CreditCard },
              { id: 'settings', label: 'Impostazioni', icon: Settings }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id === 'orders') setUnreadCount(0);
                }}
                className={`flex-1 py-4 px-6 font-bold flex items-center justify-center gap-2 transition-all border-r border-[#608beb]/20 last:border-r-0 min-w-max ${
                  activeTab === tab.id 
                    ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg' 
                    : `${TEXT_SECONDARY} hover:bg-[#2a2a2a]`
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="hidden sm:inline">{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="bg-white/20 px-2 py-0.5 rounded-full text-sm">{tab.count}</span>
                )}
              </button>
            ))}
          </div>

          <div className="p-8">
            
            {/* ==================== TAB ORDINI ==================== */}
            {activeTab === 'orders' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center flex-wrap gap-4">
                  <h2 className={`text-2xl font-bold ${TEXT_PRIMARY}`}>📦 Ordini del Giorno</h2>
                  <div className="flex items-center gap-3">
                    <input 
                      type="date" 
                      value={selectedDate} 
                      onChange={(e) => setSelectedDate(e.target.value)} 
                      className={`${BG_TUTTO} border-2 ${BORDER_BLU} rounded-xl px-4 py-2 ${TEXT_PRIMARY} focus:outline-none`}
                    />
                    <button 
                      onClick={() => loadOrders(selectedDate)} 
                      disabled={ordersLoading}
                      className="bg-[#608beb] text-white p-3 rounded-xl hover:bg-[#4a7bd9] disabled:opacity-50 transition-colors"
                    >
                      <RefreshCw className={`w-5 h-5 ${ordersLoading ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>

                {ordersLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#608beb] mx-auto mb-4"></div>
                    <p className={`${TEXT_PRIMARY} font-medium`}>Caricamento ordini...</p>
                  </div>
                ) : orders.length === 0 ? (
                  <div className={`${BG_TUTTO} rounded-2xl p-12 text-center border ${BORDER_BLU}`}>
                    <ShoppingBag className="w-20 h-20 text-gray-600 mx-auto mb-4" />
                    <p className={`${TEXT_PRIMARY} text-xl font-bold`}>Nessun ordine per {formatDate(selectedDate)}</p>
                    <p className={`${TEXT_SECONDARY} text-sm mt-2`}>Gli ordini appariranno qui quando i clienti ordinano</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map(order => {
                      const statusInfo = ORDER_STATUSES[order.status] || ORDER_STATUSES.PENDING;
                      return (
                        <div key={order.id} className={`${BG_TUTTO} rounded-2xl border ${BORDER_BLU} overflow-hidden hover:shadow-xl transition-all`}>
                          <div className="p-6 flex flex-col md:flex-row justify-between items-center gap-4">
                            <div className="flex items-center gap-4 w-full md:w-auto">
                              <div className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-white text-2xl shadow-lg ${
                                order.order_type === 'delivery' ? 'bg-gradient-to-br from-orange-500 to-red-600' : 'bg-gradient-to-br from-[#608beb] to-[#4a7bd9]'
                              }`}>
                                {order.order_type === 'delivery' ? '🛵' : '🥡'}
                              </div>
                              <div>
                                <div className="flex items-center gap-3 flex-wrap">
                                  <h3 className={`font-black text-xl ${TEXT_PRIMARY}`}>#{order.order_number || order.id?.slice(0, 8)}</h3>
                                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusInfo.color}`}>
                                    {statusInfo.label}
                                  </span>
                                </div>
                                <p className={`text-sm ${TEXT_SECONDARY}`}>
                                  {order.customer_name || 'Cliente'} • {order.scheduled_time?.substring(0, 5) || '-'}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                              <div className="text-right mr-2">
                                <p className="font-black text-2xl text-green-400">
                                  €{toNumber(order.total_amount || order.total, 0).toFixed(2)}
                                </p>
                              </div>
                              
                              {statusInfo.next && (
                                <button
                                  onClick={() => updateOrderStatus(order.id, statusInfo.next)}
                                  className="bg-gradient-to-r from-[#608beb] to-[#4a7bd9] text-white px-4 py-3 rounded-xl font-bold hover:opacity-90 transition-all"
                                >
                                  Avanza →
                                </button>
                              )}
                              
                              {order.customer_phone && (
                                <a
                                  href={`tel:${order.customer_phone}`}
                                  className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-3 rounded-xl hover:opacity-90 transition-all"
                                >
                                  <Phone className="w-5 h-5" />
                                </a>
                              )}
                              
                              <button
                                onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                                className={`${BG_TUTTO} border ${BORDER_BLU} p-3 rounded-xl hover:bg-[#2a2a2a] transition-colors`}
                              >
                                {expandedOrderId === order.id ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                              </button>
                            </div>
                          </div>

                          {expandedOrderId === order.id && (
                            <div className={`p-6 border-t border-[#608beb]/30 bg-[#1a1a1a]`}>
                              <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                  <h4 className={`font-bold ${TEXT_SECONDARY} mb-2 uppercase text-xs`}>Dati Cliente</h4>
                                  <p className={`font-bold text-lg ${TEXT_PRIMARY}`}>{order.customer_name || 'N/A'}</p>
                                  <p className={`${TEXT_SECONDARY} flex items-center gap-2`}>
                                    <Phone className="w-4 h-4" /> {order.customer_phone || 'N/A'}
                                  </p>
                                  {order.delivery_address && (
                                    <p className={`${TEXT_SECONDARY} mt-2`}>📍 {order.delivery_address}</p>
                                  )}
                                </div>
                                <div>
                                  <h4 className={`font-bold ${TEXT_SECONDARY} mb-2 uppercase text-xs`}>Note</h4>
                                  <p className={`${TEXT_SECONDARY}`}>{order.notes || order.customer_notes_order || 'Nessuna nota'}</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ==================== TAB LOCALITÀ ==================== */}
            {activeTab === 'locations' && (
              <div className="space-y-4">
                <h2 className={`text-2xl font-bold ${TEXT_PRIMARY} mb-6`}>📍 Zone Consegna</h2>
                {locations.map(loc => (
                  <div
                    key={loc.id}
                    className={`${BG_TUTTO} p-6 rounded-2xl flex items-center justify-between border shadow-lg transition-all hover:shadow-xl ${
                      !loc.active ? 'opacity-60 border-dashed border-gray-600' : `${BORDER_BLU} shadow-[#608beb]/10`
                    }`}
                  >
                    <div className="flex-1">
                      {editingLocation === loc.id ? (
                        <div className="flex gap-2 flex-wrap">
                          <input
                            className={`border ${BORDER_BLU} p-3 rounded-xl w-32 font-medium ${BG_TUTTO} ${TEXT_PRIMARY}`}
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
                            className={`border ${BORDER_BLU} p-3 rounded-xl w-32 font-medium ${BG_TUTTO} ${TEXT_PRIMARY}`}
                            defaultValue={loc.estimatedTime}
                            onBlur={(e) => updateGeneric(setLocations, loc.id, 'estimatedTime', e.target.value)}
                          />
                        </div>
                      ) : (
                        <div>
                          <h3 className={`font-bold text-xl ${TEXT_PRIMARY}`}>{loc.name}</h3>
                          <p className={`${TEXT_SECONDARY}`}>€{loc.fee.toFixed(2)} • {loc.estimatedTime}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => toggleLocationActive(loc.id)} className={`p-3 ${BG_TUTTO} rounded-xl border ${BORDER_BLU}`}>
                        {loc.active ? <Eye className="w-5 h-5 text-green-500" /> : <EyeOff className="w-5 h-5 text-gray-500" />}
                      </button>
                      <button onClick={() => setEditingLocation(editingLocation === loc.id ? null : loc.id)} className={`p-3 ${BG_TUTTO} rounded-xl border ${BORDER_BLU}`}>
                        <Edit2 className="w-5 h-5 text-blue-500" />
                      </button>
                      <button onClick={() => deleteLocation(loc.id)} className={`p-3 ${BG_TUTTO} rounded-xl border ${BORDER_BLU} hover:bg-red-900/30`}>
                        <Trash2 className="w-5 h-5 text-red-500" />
                      </button>
                    </div>
                  </div>
                ))}
                
                {/* Aggiungi nuova località */}
                <div className={`bg-[#608beb]/10 p-6 rounded-2xl border ${BORDER_BLU} mt-6`}>
                  <h3 className={`font-bold ${TEXT_PRIMARY} mb-4 flex items-center gap-2`}><Plus className="w-5 h-5" /> Nuova Zona</h3>
                  <div className="flex gap-3 flex-wrap">
                    <input
                      placeholder="Nome zona"
                      value={newLocation.name}
                      onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                      className={`${BG_TUTTO} border ${BORDER_BLU} p-3 rounded-xl flex-1 min-w-32 ${TEXT_PRIMARY}`}
                    />
                    <input
                      placeholder="Tariffa"
                      type="number"
                      step="0.50"
                      value={newLocation.fee}
                      onChange={(e) => setNewLocation({ ...newLocation, fee: e.target.value })}
                      className={`${BG_TUTTO} border ${BORDER_BLU} p-3 rounded-xl w-24 ${TEXT_PRIMARY}`}
                    />
                    <input
                      placeholder="Tempo stimato"
                      value={newLocation.estimatedTime}
                      onChange={(e) => setNewLocation({ ...newLocation, estimatedTime: e.target.value })}
                      className={`${BG_TUTTO} border ${BORDER_BLU} p-3 rounded-xl flex-1 min-w-32 ${TEXT_PRIMARY}`}
                    />
                    <button onClick={addLocation} className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-xl font-bold">
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ==================== TAB PREZZI ==================== */}
            {activeTab === 'prices' && (
              <div className="space-y-8">
                <h2 className={`text-2xl font-bold ${TEXT_PRIMARY} mb-6`}>💰 Listino Prezzi</h2>
                
                {/* Formati Pokè */}
                <div className={`bg-[#608beb]/10 p-6 rounded-2xl border ${BORDER_BLU}`}>
                  <h3 className={`text-xl font-bold mb-6 ${TEXT_PRIMARY}`}>🥣 Formati Pokè</h3>
                  <div className="space-y-4">
                    {pokeSizes.map(size => (
                      <div key={size.id} className={`${BG_TUTTO} p-5 rounded-xl border ${BORDER_BLU} flex items-center justify-between`}>
                        <div className="flex items-center gap-4">
                          {renderBowlIcon(size.id)}
                          <span className={`font-bold text-lg ${TEXT_PRIMARY}`}>{size.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`${TEXT_SECONDARY} font-medium`}>€</span>
                          <div className="flex items-center gap-2 bg-[#1a1a1a] rounded-xl p-1">
                            <button
                              onClick={() => updatePokeSize(size.id, 'price', Math.max(0, size.price - 0.50).toFixed(2))}
                              className="w-10 h-10 flex items-center justify-center rounded-lg bg-[#608beb] hover:bg-[#4a7bd9] text-white font-black text-xl"
                            >−</button>
                            <input
                              type="number"
                              step="0.50"
                              className={`w-20 text-center font-bold text-lg bg-transparent ${TEXT_PRIMARY} border-none outline-none`}
                              value={size.price}
                              onChange={(e) => updatePokeSize(size.id, 'price', e.target.value)}
                            />
                            <button
                              onClick={() => updatePokeSize(size.id, 'price', (parseFloat(size.price) + 0.50).toFixed(2))}
                              className="w-10 h-10 flex items-center justify-center rounded-lg bg-[#608beb] hover:bg-[#4a7bd9] text-white font-black text-xl"
                            >+</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Extra */}
                <div className={`bg-[#608beb]/10 p-6 rounded-2xl border ${BORDER_BLU}`}>
                  <h3 className={`text-xl font-bold mb-6 ${TEXT_PRIMARY}`}>➕ Prezzi Extra</h3>
                  <div className="space-y-3">
                    {Object.entries(extraPrices).map(([key, val]) => (
                      <div key={key} className={`${BG_TUTTO} p-4 rounded-xl border ${BORDER_BLU} flex justify-between items-center`}>
                        <span className={`capitalize font-bold ${TEXT_PRIMARY}`}>{key}</span>
                        <div className="flex items-center gap-3">
                          <span className={`${TEXT_SECONDARY}`}>€</span>
                          <div className="flex items-center gap-2 bg-[#1a1a1a] rounded-xl p-1">
                            <button
                              onClick={() => updateExtraPrice(key, Math.max(0, val - 0.10).toFixed(2))}
                              className="w-10 h-10 flex items-center justify-center rounded-lg bg-[#608beb] text-white font-black"
                            >−</button>
                            <input
                              type="number"
                              step="0.10"
                              className={`w-20 text-center font-bold bg-transparent ${TEXT_PRIMARY} border-none outline-none`}
                              value={val}
                              onChange={(e) => updateExtraPrice(key, e.target.value)}
                            />
                            <button
                              onClick={() => updateExtraPrice(key, (parseFloat(val) + 0.10).toFixed(2))}
                              className="w-10 h-10 flex items-center justify-center rounded-lg bg-[#608beb] text-white font-black"
                            >+</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ==================== TAB TARIFFE (ABBONAMENTO) ==================== */}
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
                                <p className="text-green-400 font-black text-2xl">€{piano.costoPerOrdine.toFixed(2)}</p>
                                <p className={`text-xs ${TEXT_SECONDARY}`}>€/ordine</p>
                              </div>
                            </div>
                            
                            <div className={`mt-4 pt-4 border-t border-gray-700 grid grid-cols-3 gap-3 text-center`}>
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
                                <p className={`text-xs ${TEXT_SECONDARY}`}>Importo</p>
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
                    
                    {/* Widget Contatore Settimanale */}
                    <div className="bg-[#1a1a1a] p-5 rounded-xl border border-green-500/30 mb-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className={`text-lg font-bold ${TEXT_PRIMARY} flex items-center gap-2`}>📊 Questa Settimana</h3>
                        <button onClick={loadWeeklyStats} className="text-green-400 hover:text-green-300 text-sm font-medium bg-green-500/10 px-3 py-1 rounded-lg">
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
                            <span className="text-amber-400 font-bold ml-2">= €{weeklyStats.totaleFee?.toFixed(2) || '0.00'}</span>
                          </div>
                          <p className={`text-xs ${TEXT_SECONDARY} mt-3 text-center`}>
                            📅 {weeklyStats.periodStart?.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' })} — {weeklyStats.periodEnd?.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' })}
                          </p>
                        </>
                      )}
                    </div>
                    
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
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ==================== POPUP UPGRADE ==================== */}
      {showUpgradePopup && selectedUpgradePlan && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border-2 border-amber-500/50 shadow-2xl">
            
            {/* Header Popup */}
            <div className="sticky top-0 bg-gradient-to-r from-amber-600 to-amber-700 p-6 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black text-white">🚀 UPGRADE A {selectedUpgradePlan.nome}</h2>
                <p className="text-amber-100">Risparmia €{((1.20 - selectedUpgradePlan.costoPerOrdine) * selectedUpgradePlan.totale).toFixed(0)} su {selectedUpgradePlan.totale} ordini</p>
              </div>
              <button onClick={() => setShowUpgradePopup(false)} className="text-white hover:bg-amber-800 p-2 rounded-full">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              
              {/* Riepilogo Piano */}
              <div className="bg-[#212121] p-5 rounded-xl border border-gray-700">
                <h4 className={`font-bold ${TEXT_PRIMARY} mb-3`}>📊 RIEPILOGO ACQUISTO</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className={TEXT_SECONDARY}>Crediti base</span>
                    <span className={TEXT_PRIMARY}>{selectedUpgradePlan.crediti}</span>
                  </div>
                  {selectedUpgradePlan.bonus > 0 && (
                    <div className="flex justify-between">
                      <span className={TEXT_SECONDARY}>Bonus omaggio</span>
                      <span className="text-green-400 font-bold">+{selectedUpgradePlan.bonus}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className={TEXT_SECONDARY}>Totale ordini</span>
                    <span className="text-green-400 font-bold">{selectedUpgradePlan.totale}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={TEXT_SECONDARY}>Costo effettivo</span>
                    <span className="text-green-400 font-bold">€{selectedUpgradePlan.costoPerOrdine.toFixed(2)}/ordine</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-700">
                    <span className={TEXT_PRIMARY}>TOTALE</span>
                    <span className="text-amber-400">€{selectedUpgradePlan.importo}</span>
                  </div>
                </div>
              </div>
              
              {/* Documenti Legali */}
              <div className="bg-[#212121] p-4 rounded-xl">
                <h4 className="font-bold text-white mb-3">📄 DOCUMENTI LEGALI</h4>
                <p className={`text-xs ${TEXT_SECONDARY} mb-3`}>Prima di procedere, leggi attentamente tutti i documenti:</p>
                <div className="grid grid-cols-3 gap-2">
                  <a href="https://ordini-lampo.it/contratto-upgrade" target="_blank" rel="noopener noreferrer"
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
              
              {/* Bottone Paga */}
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
                    Elaborazione...
                  </span>
                ) : (
                  `💳 PAGA €${selectedUpgradePlan.importo} E ATTIVA`
                )}
              </button>
              
              <p className={`text-xs ${TEXT_SECONDARY} text-center`}>
                🔒 Pagamento sicuro tramite Stripe. I tuoi dati sono protetti.
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
