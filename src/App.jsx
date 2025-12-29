import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ClerkProvider, 
  SignedIn, 
  SignedOut, 
  SignIn, 
  useUser, 
  useAuth 
} from '@clerk/clerk-react';
import { 
  Save, Plus, Trash2, Edit2, MapPin, Settings, CreditCard, 
  ShoppingBag, RefreshCw, CheckCircle, XCircle, FileText, 
  ChevronRight, TrendingUp, DollarSign, Percent, Sparkles, Lock, LogOut
} from 'lucide-react';

// ============================================
// 🔐 ADMIN PANEL ORDINLAMPO v3.0 COMPLETE
// Clerk Auth + Gemini Design + ChatGPT Fixes
// ============================================

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://ordini-lampo-api.ordini-lampo.workers.dev';

// 🛡️ HELPER: Numeri sicuri (FIX ChatGPT - evita NaN.toFixed crash)
const toNumber = (value, fallback = 0) => {
  const n = typeof value === 'number' ? value : Number(String(value).replace(',', '.'));
  return Number.isFinite(n) ? n : fallback;
};

// 💳 PIANI TARIFFARI
const PRICING_PLANS = {
  freedom: {
    id: 'freedom', name: 'FREEDOM', emoji: '🆓',
    price_per_order: 1.20, monthly_fee: 0,
    description: 'Paga solo per ordine',
    features: ['€1.20 per ordine', 'Nessun abbonamento', 'Disdici quando vuoi'],
    color: 'from-gray-100 to-gray-200', border: 'border-gray-300'
  },
  lampo_500: {
    id: 'lampo_500', name: 'LAMPO 500', emoji: '⚡',
    price_per_order: 0.98, monthly_fee: 0, credits: 500, prepaid: 490,
    description: 'Pacchetto prepagato 500 ordini',
    features: ['€0.98 per ordine', '500 ordini prepagati', 'Risparmio 18%'],
    color: 'from-blue-100 to-blue-200', border: 'border-blue-400'
  },
  lampo_max: {
    id: 'lampo_max', name: 'LAMPO MAX', emoji: '🚀',
    price_per_order: 0.78, monthly_fee: 99,
    description: 'Per ristoranti ad alto volume',
    features: ['€0.78 per ordine', '€99/mese fisso', 'Ordini illimitati'],
    color: 'from-orange-100 to-yellow-100', border: 'border-orange-400',
    recommended: true
  }
};

// Stati ordine
const ORDER_STATUSES = {
  PENDING: { label: 'In Attesa', color: 'bg-yellow-100 text-yellow-800', next: 'CONFIRMED' },
  CONFIRMED: { label: 'Confermato', color: 'bg-blue-100 text-blue-800', next: 'PREPARING' },
  PREPARING: { label: 'In Preparazione', color: 'bg-purple-100 text-purple-800', next: 'READY' },
  READY: { label: 'Pronto', color: 'bg-green-100 text-green-800', next: 'DELIVERING' },
  DELIVERING: { label: 'In Consegna', color: 'bg-indigo-100 text-indigo-800', next: 'DELIVERED' },
  DELIVERED: { label: 'Consegnato', color: 'bg-gray-100 text-gray-800', next: null },
  CANCELLED: { label: 'Annullato', color: 'bg-red-100 text-red-800', next: null }
};

// ==================== COMPONENTE TOGGLE (Design Gemini + Fix ChatGPT) ====================
const Toggle = ({ enabled, onChange, size = 'md', label = 'toggle' }) => {
  const sizes = {
    sm: { track: 'w-11 h-6', thumb: 'w-5 h-5', translate: 'translate-x-5' },
    md: { track: 'w-14 h-8', thumb: 'w-7 h-7', translate: 'translate-x-6' },
    lg: { track: 'w-16 h-9', thumb: 'w-8 h-8', translate: 'translate-x-7' }
  };
  const s = sizes[size];
  
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={enabled}
      onClick={() => onChange(!enabled)}
      className={`
        relative inline-flex items-center rounded-full p-0.5
        transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]
        focus:outline-none focus:ring-4 focus:ring-green-200
        ${s.track}
        ${enabled 
          ? 'bg-gradient-to-r from-green-400 to-emerald-500 shadow-lg shadow-green-200' 
          : 'bg-gray-300'
        }
      `}
    >
      <span
        className={`
          inline-block rounded-full bg-white shadow-md
          transform transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]
          flex items-center justify-center
          ${s.thumb}
          ${enabled ? s.translate : 'translate-x-0'}
        `}
      >
        <span className={`text-xs font-bold transition-opacity duration-200 ${enabled ? 'opacity-100 text-green-500' : 'opacity-0'}`}>
          ✓
        </span>
      </span>
    </button>
  );
};

// ==================== TYPE SELECTOR €/% (Design Gemini) ====================
const TypeSelector = ({ type, onChange }) => (
  <div className="inline-flex rounded-xl overflow-hidden shadow-sm bg-gray-100 p-1">
    <button
      onClick={() => onChange('euro')}
      className={`
        px-5 py-3 rounded-lg font-bold text-lg transition-all duration-200 flex items-center gap-2
        ${type === 'euro' 
          ? 'bg-white text-green-600 shadow-md' 
          : 'text-gray-400 hover:text-gray-600'
        }
      `}
    >
      <DollarSign className="w-4 h-4" /> €
    </button>
    <button
      onClick={() => onChange('percent')}
      className={`
        px-5 py-3 rounded-lg font-bold text-lg transition-all duration-200 flex items-center gap-2
        ${type === 'percent' 
          ? 'bg-white text-green-600 shadow-md' 
          : 'text-gray-400 hover:text-gray-600'
        }
      `}
    >
      <Percent className="w-4 h-4" /> %
    </button>
  </div>
);

// ==================== VALUE SELECTOR +/- (Design Gemini) ====================
const ValueSelector = ({ value, onChange, type, step = 0.5, min = 0.5, max = 50 }) => {
  const safeValue = toNumber(value, min);
  const increment = () => onChange(Math.min(safeValue + step, max));
  const decrement = () => onChange(Math.max(safeValue - step, min));
  
  return (
    <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200 shadow-sm">
      <button
        onClick={decrement}
        className="w-12 h-12 flex items-center justify-center rounded-lg bg-white shadow-sm hover:bg-gray-50 active:scale-95 transition-all text-gray-600 font-bold text-xl"
      >
        −
      </button>
      <div className="px-4 min-w-[80px] text-center font-black text-gray-800 text-xl">
        {type === 'euro' ? '€' : ''}{safeValue.toFixed(type === 'euro' ? 2 : 0)}{type === 'percent' ? '%' : ''}
      </div>
      <button
        onClick={increment}
        className="w-12 h-12 flex items-center justify-center rounded-lg bg-white shadow-sm hover:bg-gray-50 active:scale-95 transition-all text-gray-600 font-bold text-xl"
      >
        +
      </button>
    </div>
  );
};

// ==================== API CLIENT CON CLERK ====================
const createApiClient = (getToken) => {
  const fetchWithAuth = async (endpoint, options = {}) => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
          ...options.headers
        }
      });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`[API] ${endpoint} failed:`, error);
      return { success: false, error: error.message };
    }
  };

  return {
    testConnection: async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/health`);
        return response.ok;
      } catch {
        return false;
      }
    },
    getOrders: (slug, date) => fetchWithAuth(`/admin/orders?date=${date}`),
    getSettings: (slug) => fetchWithAuth(`/admin/settings`),
    saveSettings: (slug, data) => fetchWithAuth(`/admin/settings`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
    updateOrderStatus: (slug, orderId, status) => fetchWithAuth(`/admin/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    })
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

  // Restaurant slug from user metadata
  const restaurantSlug = user?.publicMetadata?.restaurant_id || 'pokenjoy-sanremo';

  // ==================== REFS (FIX ChatGPT) ====================
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
    { id: 'small', name: 'Piccola', price: 8.50, emoji: '🥣' },
    { id: 'medium', name: 'Media', price: 10.50, emoji: '🍜' },
    { id: 'large', name: 'Grande', price: 12.50, emoji: '🍲' }
  ]);
  const [extraPrices, setExtraPrices] = useState({ protein: 1.00, ingredient: 0.50, sauce: 0.30 });
  const [floorDelivery, setFloorDelivery] = useState({ enabled: true, fee: 1.50 });
  const [riderTip, setRiderTip] = useState(1.00);

  // ==================== STATI ABBONAMENTO ====================
  const [currentPlan, setCurrentPlan] = useState('freedom');
  const [credits, setCredits] = useState(0);
  const [showContractModal, setShowContractModal] = useState(false);
  const [selectedPlanForUpgrade, setSelectedPlanForUpgrade] = useState(null);
  const [contractStep, setContractStep] = useState(0);

  // ==================== STATI IMPOSTAZIONI ====================
  const [restaurantName, setRestaurantName] = useState('Pokenjoy Sanremo');
  const [whatsappNumber, setWhatsappNumber] = useState('393896382394');

  // ==================== STATI MARKETING ====================
  const [radarTier, setRadarTier] = useState('base');
  const [stats, setStats] = useState({
    totalOrders: 156, newCustomers: 23, returningCustomers: 45,
    percentNew: 34, avgOrderValue: 18.50, savedAmount: 1840
  });
  const [firstOrderDiscount, setFirstOrderDiscount] = useState({
    enabled: false, type: 'euro', value: 2, minOrder: 15
  });
  const [nominativeDiscounts, setNominativeDiscounts] = useState([]);
  const [newNominativeDiscount, setNewNominativeDiscount] = useState({
    type: 'euro', value: 2, customerSearch: '', selectedCustomer: null
  });
  const [customerSearchResults, setCustomerSearchResults] = useState([]);

  // Mock clienti
  const mockCustomers = [
    { id: 1, name: 'Marco Bianchi', phone: '3331234567', orders: 12 },
    { id: 2, name: 'Sara Moretti', phone: '3339876543', orders: 8 },
    { id: 3, name: 'Luca Parisi', phone: '3345678901', orders: 6 },
    { id: 4, name: 'Giulia Ferri', phone: '3356789012', orders: 5 },
    { id: 5, name: 'Andrea Costa', phone: '3367890123', orders: 4 },
  ];

  // ==================== NOTIFICATION (FIX ChatGPT - cleanup timer) ====================
  const showNotification = useCallback(() => {
    setShowSaveNotification(true);
    if (notifTimerRef.current) clearTimeout(notifTimerRef.current);
    notifTimerRef.current = setTimeout(() => setShowSaveNotification(false), 3000);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (notifTimerRef.current) clearTimeout(notifTimerRef.current);
    };
  }, []);

  // ==================== LOAD ORDERS (FIX ChatGPT - race-safe) ====================
  const loadOrders = useCallback(async (date) => {
    const reqId = ++ordersReqIdRef.current;
    setOrdersLoading(true);

    try {
      const result = await api.getOrders(restaurantSlug, date);
      if (reqId !== ordersReqIdRef.current) return;
      if (result.success) setOrders(result.orders || []);
      else setOrders([]);
    } catch (e) {
      if (reqId !== ordersReqIdRef.current) return;
      setOrders([]);
      console.error('loadOrders failed', e);
    } finally {
      if (reqId === ordersReqIdRef.current) setOrdersLoading(false);
    }
  }, [api, restaurantSlug]);

  // ==================== BOOTSTRAP (FIX ChatGPT - try/catch/finally) ====================
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        const isConnected = await api.testConnection();
        setConnectionStatus(isConnected ? 'connected' : 'error');
        
        if (!isConnected) {
          setLoading(false);
          return;
        }

        const settingsResult = await api.getSettings(restaurantSlug);
        if (settingsResult?.success) {
          const r = settingsResult.restaurant;
          if (r?.name) setRestaurantName(r.name);
          if (r?.whatsapp_number) setWhatsappNumber(r.whatsapp_number);
          
          const s = r?.settings;
          if (s) {
            if (s.delivery_locations) setLocations(s.delivery_locations);
            if (s.poke_sizes) setPokeSizes(s.poke_sizes);
            if (s.extra_prices) setExtraPrices(s.extra_prices);
            if (s.floor_delivery) setFloorDelivery(s.floor_delivery);
            if (s.rider_tip !== undefined) setRiderTip(s.rider_tip);
            if (s.current_plan) setCurrentPlan(s.current_plan);
            if (s.credits !== undefined) setCredits(s.credits);
            if (s.radar_tier) setRadarTier(s.radar_tier);
            if (s.first_order_discount) setFirstOrderDiscount(s.first_order_discount);
            if (s.nominative_discounts) setNominativeDiscounts(s.nominative_discounts);
          }
        }

        await loadOrders(new Date().toISOString().split('T')[0]);
      } catch (e) {
        console.error('init failed', e);
        setConnectionStatus('error');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [api, restaurantSlug, loadOrders]);

  // Effect per cambio data
  useEffect(() => {
    if (!loading) loadOrders(selectedDate);
  }, [selectedDate, loading, loadOrders]);

  // ==================== FUNZIONI ORDINI ====================
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const result = await api.updateOrderStatus(restaurantSlug, orderId, newStatus);
      if (result.success) {
        showNotification();
        loadOrders(selectedDate);
      }
    } catch (e) {
      console.error('updateOrderStatus failed', e);
    }
  };

  const advanceOrderStatus = (order) => {
    const currentStatus = ORDER_STATUSES[order.status];
    if (currentStatus?.next) updateOrderStatus(order.id, currentStatus.next);
  };

  // ==================== FUNZIONI LOCALITÀ ====================
  const addLocation = () => {
    if (newLocation.name && newLocation.fee && newLocation.estimatedTime) {
      const id = `loc-${Date.now()}`;
      setLocations([...locations, { 
        id, 
        name: newLocation.name, 
        fee: toNumber(newLocation.fee, 0), 
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
    setLocations(locations.filter(loc => loc.id !== id));
    showNotification();
  };

  const toggleLocationActive = (id) => {
    setLocations(locations.map(loc => loc.id === id ? { ...loc, active: !loc.active } : loc));
    showNotification();
  };

  // ==================== FUNZIONI PREZZI (FIX ChatGPT - toNumber) ====================
  const updatePokeSize = (id, field, value) => {
    setPokeSizes(prev => prev.map(size => 
      size.id === id ? { ...size, [field]: toNumber(value, size[field] ?? 0) } : size
    ));
    showNotification();
  };

  const updateExtraPrice = (field, value) => {
    setExtraPrices(prev => ({ ...prev, [field]: toNumber(value, prev[field] ?? 0) }));
    showNotification();
  };

  const updateFloorDelivery = (field, value) => {
    setFloorDelivery(prev => ({ 
      ...prev, 
      [field]: field === 'fee' ? toNumber(value, prev.fee ?? 0) : value 
    }));
    showNotification();
  };

  // ==================== FUNZIONI ABBONAMENTO ====================
  const openContractModal = (planId) => {
    setSelectedPlanForUpgrade(planId);
    setContractStep(0);
    setShowContractModal(true);
  };

  const handleContractStep = () => {
    if (contractStep < 2) {
      setContractStep(contractStep + 1);
    } else {
      setCurrentPlan(selectedPlanForUpgrade);
      if (selectedPlanForUpgrade === 'lampo_500') setCredits(500);
      setShowContractModal(false);
      setContractStep(0);
      showNotification();
    }
  };

  // ==================== FUNZIONI MARKETING ====================
  const calculateDiscountProjection = (percent, minOrder) => {
    return (toNumber(percent, 0) / 100 * toNumber(minOrder, 0)).toFixed(2);
  };

  const searchCustomers = (query) => {
    if (query.length < 2) {
      setCustomerSearchResults([]);
      return;
    }
    const results = mockCustomers.filter(c => 
      c.name.toLowerCase().includes(query.toLowerCase()) || c.phone.includes(query)
    );
    setCustomerSearchResults(results);
  };

  const addNominativeDiscount = () => {
    if (!newNominativeDiscount.selectedCustomer) return;
    
    const newDiscount = {
      id: Date.now(),
      customer: newNominativeDiscount.selectedCustomer,
      type: newNominativeDiscount.type,
      value: toNumber(newNominativeDiscount.value, 0),
      active: true,
      createdAt: new Date().toISOString()
    };
    
    setNominativeDiscounts([...nominativeDiscounts, newDiscount]);
    setNewNominativeDiscount({ type: 'euro', value: 2, customerSearch: '', selectedCustomer: null });
    setCustomerSearchResults([]);
    showNotification();
  };

  const toggleNominativeDiscount = (id) => {
    setNominativeDiscounts(nominativeDiscounts.map(d => d.id === id ? { ...d, active: !d.active } : d));
    showNotification();
  };

  const deleteNominativeDiscount = (id) => {
    setNominativeDiscounts(nominativeDiscounts.filter(d => d.id !== id));
    showNotification();
  };

  // ==================== SALVATAGGIO ====================
  const saveAllConfigurations = async () => {
    setLoading(true);
    
    try {
      const settings = {
        delivery_locations: locations,
        poke_sizes: pokeSizes,
        extra_prices: extraPrices,
        floor_delivery: floorDelivery,
        rider_tip: riderTip,
        current_plan: currentPlan,
        credits: credits,
        radar_tier: radarTier,
        first_order_discount: firstOrderDiscount,
        nominative_discounts: nominativeDiscounts,
        last_updated: new Date().toISOString()
      };

      const result = await api.saveSettings(restaurantSlug, {
        name: restaurantName,
        whatsapp_number: whatsappNumber,
        settings: settings
      });
      
      if (result.success) showNotification();
    } catch (e) {
      console.error('saveAllConfigurations failed', e);
    } finally {
      setLoading(false);
    }
  };

  // ==================== HELPERS ====================
  const getPlanBadge = () => {
    const plan = PRICING_PLANS[currentPlan];
    if (!plan) return null;
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-gradient-to-r ${plan.color} ${plan.border} border`}>
        {plan.emoji} {plan.name}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  // ==================== LOADING SCREEN ====================
  if (loading && connectionStatus === 'checking') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Caricamento...</p>
        </div>
      </div>
    );
  }

  // ==================== RENDER ====================
  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 px-4">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-black text-slate-800">
                  ORDINI<span className="text-green-600">LAMPO</span>
                </h1>
                {getPlanBadge()}
                {radarTier === 'full' && (
                  <span className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-1 rounded-full font-bold">RAD FULL</span>
                )}
              </div>
              <p className="text-gray-600">{restaurantName}</p>
              <div className="mt-2 flex items-center gap-4 flex-wrap">
                {connectionStatus === 'connected' ? (
                  <span className="text-green-600 text-sm flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></span>
                    Connesso
                  </span>
                ) : (
                  <span className="text-red-600 text-sm flex items-center gap-1">
                    <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                    Errore connessione
                  </span>
                )}
                {currentPlan === 'lampo_500' && credits > 0 && (
                  <span className="text-blue-600 text-sm font-semibold">💳 {credits} crediti</span>
                )}
                <span className="text-gray-500 text-sm">👤 {user?.primaryEmailAddress?.emailAddress}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={saveAllConfigurations}
                disabled={loading}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 active:scale-95"
              >
                <Save className="w-5 h-5" />
                <span>Salva</span>
              </button>
              <button
                onClick={() => signOut()}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 px-4 rounded-xl flex items-center gap-2 transition-all"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* NOTIFICATION */}
        {showSaveNotification && (
          <div className="fixed top-4 right-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-2 z-50 animate-bounce">
            <CheckCircle className="w-5 h-5" />
            <span className="font-semibold">Salvato!</span>
          </div>
        )}

        {/* TABS */}
        <div className="bg-white rounded-2xl shadow-lg mb-6 overflow-hidden">
          <div className="flex border-b overflow-x-auto">
            {[
              { id: 'orders', icon: <ShoppingBag className="w-5 h-5" />, label: 'Ordini', count: orders.length },
              { id: 'marketing', icon: <TrendingUp className="w-5 h-5" />, label: 'Marketing', accent: true },
              { id: 'locations', icon: <MapPin className="w-5 h-5" />, label: 'Località' },
              { id: 'prices', icon: <DollarSign className="w-5 h-5" />, label: 'Prezzi' },
              { id: 'subscription', icon: <CreditCard className="w-5 h-5" />, label: 'Tariffe' },
              { id: 'settings', icon: <Settings className="w-5 h-5" />, label: 'Impostazioni' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-max px-4 py-4 font-semibold flex items-center justify-center gap-2 transition-all ${
                  activeTab === tab.id 
                    ? tab.accent 
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' 
                      : 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
                {tab.count !== undefined && (
                  <span className="bg-white/20 px-2 py-0.5 rounded-full text-sm">{tab.count}</span>
                )}
              </button>
            ))}
          </div>

          <div className="p-6">
            
            {/* ==================== TAB ORDINI ==================== */}
            {activeTab === 'orders' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <h2 className="text-2xl font-bold text-gray-800">📦 Ordini</h2>
                  <div className="flex items-center gap-3">
                    <input 
                      type="date" 
                      value={selectedDate} 
                      onChange={(e) => setSelectedDate(e.target.value)} 
                      className="border-2 border-gray-200 rounded-xl px-4 py-2 focus:border-blue-500 outline-none" 
                    />
                    <button 
                      onClick={() => loadOrders(selectedDate)} 
                      disabled={ordersLoading}
                      className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors min-w-11 min-h-11"
                    >
                      <RefreshCw className={`w-5 h-5 ${ordersLoading ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>

                {orders.length === 0 ? (
                  <div className="text-center py-16 bg-gray-50 rounded-2xl">
                    <ShoppingBag className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">Nessun ordine per {formatDate(selectedDate)}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map(order => {
                      const statusInfo = ORDER_STATUSES[order.status] || ORDER_STATUSES.PENDING;
                      return (
                        <div key={order.id} className="bg-gray-50 rounded-xl p-5 border-2 border-gray-100 hover:border-blue-200 transition-all">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3 flex-wrap">
                                <span className="text-xl font-black text-gray-800">#{order.order_number}</span>
                                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusInfo.color}`}>
                                  {statusInfo.label}
                                </span>
                                <span className="text-gray-500">🕐 {order.scheduled_time?.substring(0, 5) || '-'}</span>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                <p className="text-gray-600"><strong>👤</strong> {order.customer_name}</p>
                                <p className="text-gray-600"><strong>📱</strong> {order.customer_phone}</p>
                                <p className="text-gray-600"><strong>💰</strong> €{toNumber(order.total, 0).toFixed(2)}</p>
                                {order.delivery_address && (
                                  <p className="text-gray-600"><strong>📍</strong> {order.delivery_address}</p>
                                )}
                              </div>
                              {order.notes && (
                                <p className="text-gray-500 text-sm mt-3 bg-yellow-50 p-3 rounded-lg">📝 {order.notes}</p>
                              )}
                            </div>
                            <div className="flex flex-col gap-2">
                              {statusInfo.next && (
                                <button 
                                  onClick={() => advanceOrderStatus(order)}
                                  className="bg-green-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-green-700 text-sm font-semibold transition-colors min-h-11"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  {ORDER_STATUSES[statusInfo.next]?.label}
                                </button>
                              )}
                              {order.status === 'PENDING' && (
                                <button 
                                  onClick={() => updateOrderStatus(order.id, 'CANCELLED')}
                                  className="bg-red-100 text-red-600 px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-red-200 text-sm font-semibold transition-colors min-h-11"
                                >
                                  <XCircle className="w-4 h-4" />
                                  Annulla
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

            {/* ==================== TAB MARKETING ==================== */}
            {activeTab === 'marketing' && (
              <div className="space-y-8">
                
                {/* HERO BOX RISPARMIO (Design Gemini - Dark Mode) */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 p-8 shadow-2xl border border-slate-700">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <TrendingUp className="w-32 h-32 text-white" />
                  </div>
                  
                  <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                      <p className="text-green-400 font-bold uppercase tracking-widest text-xs mb-2 flex items-center gap-2">
                        <Sparkles className="w-4 h-4" /> Il Tuo Margine Preservato
                      </p>
                      <h2 className="text-5xl md:text-6xl font-black text-white">
                        €{stats.savedAmount.toLocaleString('it-IT')}
                      </h2>
                      <p className="text-slate-400 mt-3 font-medium max-w-md">
                        Questo importo sarebbe finito in commissioni ai servizi di intermediazione. 
                        <span className="text-white font-semibold"> Ora resta nel tuo cassetto.</span>
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                        <p className="text-slate-400 text-xs font-bold uppercase">Ordini</p>
                        <p className="text-white text-2xl font-black">{stats.totalOrders}</p>
                      </div>
                      <div className="bg-green-500/20 backdrop-blur-md p-4 rounded-2xl border border-green-500/20">
                        <p className="text-green-400 text-xs font-bold uppercase">Risparmio</p>
                        <p className="text-green-400 text-2xl font-black">~28%</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* STATISTICHE */}
                <div className="bg-white rounded-xl border-2 border-gray-100 overflow-hidden">
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-wrap gap-2">
                    <h3 className="text-xl font-bold text-gray-800">📈 Statistiche Clienti</h3>
                    {radarTier === 'base' ? (
                      <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-semibold">RAD BASE</span>
                    ) : (
                      <span className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full font-semibold">RAD FULL</span>
                    )}
                  </div>
                  
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 text-center">
                        <p className="text-blue-600 text-sm font-medium mb-1">Ordini questo mese</p>
                        <p className="text-4xl font-black text-blue-700">{stats.totalOrders}</p>
                      </div>
                      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 text-center">
                        <p className="text-green-600 text-sm font-medium mb-1">Nuovi clienti</p>
                        <p className="text-4xl font-black text-green-700">{stats.newCustomers}</p>
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5 text-center">
                        <p className="text-purple-600 text-sm font-medium mb-1">Clienti di ritorno</p>
                        <p className="text-4xl font-black text-purple-700">{stats.returningCustomers}</p>
                      </div>
                    </div>

                    {/* STATS FULL - Bloccate se BASE */}
                    {radarTier === 'base' ? (
                      <div className="relative">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 opacity-30 blur-sm select-none pointer-events-none">
                          <div className="bg-gray-100 rounded-xl p-5 text-center">
                            <p className="text-gray-500 text-sm">% Nuovi vs Ritorno</p>
                            <p className="text-3xl font-bold text-gray-400">34%</p>
                          </div>
                          <div className="bg-gray-100 rounded-xl p-5 text-center">
                            <p className="text-gray-500 text-sm">Valore medio ordine</p>
                            <p className="text-3xl font-bold text-gray-400">€18.50</p>
                          </div>
                          <div className="bg-gray-100 rounded-xl p-5 text-center">
                            <p className="text-gray-500 text-sm">Trend settimanale</p>
                            <p className="text-3xl font-bold text-gray-400">+12%</p>
                          </div>
                        </div>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center mb-4 shadow-xl">
                            <Lock className="w-8 h-8" />
                          </div>
                          <button 
                            onClick={() => setRadarTier('full')}
                            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all flex items-center gap-2"
                          >
                            🚀 Sblocca con RAD FULL (+€0.09/ordine)
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-5 text-center">
                          <p className="text-orange-600 text-sm font-medium mb-1">% Nuovi vs Ritorno</p>
                          <p className="text-4xl font-black text-orange-700">{stats.percentNew}%</p>
                        </div>
                        <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl p-5 text-center">
                          <p className="text-teal-600 text-sm font-medium mb-1">Valore medio ordine</p>
                          <p className="text-4xl font-black text-teal-700">€{toNumber(stats.avgOrderValue, 0).toFixed(2)}</p>
                        </div>
                        <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl p-5 text-center">
                          <p className="text-pink-600 text-sm font-medium mb-1">Trend settimanale</p>
                          <p className="text-4xl font-black text-pink-700">+12%</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* SCONTO PRIMO ORDINE */}
                <div className="bg-white rounded-xl border-2 border-gray-100 overflow-hidden">
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-gray-800">🎁 Sconto Primo Ordine</h3>
                    <Toggle 
                      enabled={firstOrderDiscount.enabled}
                      onChange={(val) => setFirstOrderDiscount({...firstOrderDiscount, enabled: val})}
                      label="Attiva sconto primo ordine"
                    />
                  </div>
                  
                  <div className={`p-6 transition-all duration-300 ${!firstOrderDiscount.enabled ? 'opacity-40 pointer-events-none' : ''}`}>
                    <p className="text-gray-600 mb-6">Attira nuovi clienti con uno sconto automatico al primo ordine.</p>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <div>
                          <label className="block text-xs font-black text-gray-400 uppercase tracking-tighter mb-3">Ordine minimo</label>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500 text-lg">€</span>
                            <input
                              type="number"
                              min="0"
                              step="0.50"
                              value={firstOrderDiscount.minOrder}
                              onChange={(e) => setFirstOrderDiscount({
                                ...firstOrderDiscount, 
                                minOrder: toNumber(e.target.value, 0)
                              })}
                              className="w-28 border-2 border-gray-200 rounded-xl px-4 py-3 text-xl font-bold text-center focus:border-green-500 outline-none transition-all"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-black text-gray-400 uppercase tracking-tighter mb-3">Tipo sconto</label>
                          <TypeSelector 
                            type={firstOrderDiscount.type}
                            onChange={(val) => setFirstOrderDiscount({...firstOrderDiscount, type: val})}
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-black text-gray-400 uppercase tracking-tighter mb-3">Valore sconto</label>
                          <ValueSelector
                            value={firstOrderDiscount.value}
                            type={firstOrderDiscount.type}
                            onChange={(val) => setFirstOrderDiscount({...firstOrderDiscount, value: val})}
                            step={firstOrderDiscount.type === 'euro' ? 0.5 : 5}
                            min={firstOrderDiscount.type === 'euro' ? 0.5 : 5}
                            max={firstOrderDiscount.type === 'euro' ? 20 : 50}
                          />
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200">
                        <h4 className="font-bold text-green-800 mb-4">👁️ Anteprima</h4>
                        
                        <div className="bg-white rounded-xl p-6 shadow-sm border border-green-100">
                          <div className="text-center">
                            <span className="text-5xl">🎉</span>
                            <p className="text-xl font-bold text-gray-800 mt-3">Benvenuto!</p>
                            <p className="text-green-600 font-bold text-2xl mt-2">
                              {firstOrderDiscount.type === 'euro' 
                                ? `€${toNumber(firstOrderDiscount.value, 0).toFixed(2)} di sconto`
                                : `${toNumber(firstOrderDiscount.value, 0)}% di sconto`
                              }
                            </p>
                            <p className="text-gray-500 mt-2">
                              sul tuo primo ordine
                              {firstOrderDiscount.minOrder > 0 && ` (min. €${toNumber(firstOrderDiscount.minOrder, 0).toFixed(2)})`}
                            </p>
                          </div>
                        </div>

                        {firstOrderDiscount.type === 'percent' && firstOrderDiscount.minOrder > 0 && (
                          <div className="mt-4 bg-blue-50 rounded-xl p-4 border border-blue-200">
                            <p className="text-blue-800 text-sm">
                              📊 Su ordine di €{toNumber(firstOrderDiscount.minOrder, 0).toFixed(2)} → sconto di <strong>€{calculateDiscountProjection(firstOrderDiscount.value, firstOrderDiscount.minOrder)}</strong>
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* SCONTI NOMINATIVI */}
                <div className="bg-white rounded-xl border-2 border-gray-100 overflow-hidden">
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-wrap gap-2">
                    <h3 className="text-xl font-bold text-gray-800">🎯 Sconti Nominativi</h3>
                    {radarTier === 'full' ? (
                      <span className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full font-semibold">RAD FULL</span>
                    ) : (
                      <span className="text-xs bg-gray-200 text-gray-600 px-3 py-1 rounded-full">🔒 Richiede RAD FULL</span>
                    )}
                  </div>

                  {radarTier === 'base' ? (
                    <div className="p-10 text-center">
                      <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
                        <Lock className="w-8 h-8" />
                      </div>
                      <h4 className="text-xl font-bold text-gray-800">Funzione Premium</h4>
                      <p className="text-gray-600 mt-2 max-w-md mx-auto">
                        Con RAD FULL puoi creare sconti personalizzati per singoli clienti.
                      </p>
                      <button 
                        onClick={() => setRadarTier('full')}
                        className="mt-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
                      >
                        🚀 Attiva RAD FULL
                      </button>
                    </div>
                  ) : (
                    <div className="p-6">
                      <div className="bg-purple-50 rounded-xl p-6 mb-6 border-2 border-purple-200">
                        <h4 className="font-bold text-purple-800 mb-4">➕ Nuovo sconto</h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                          <div className="md:col-span-2 relative">
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-tighter mb-2">Cerca cliente</label>
                            <input
                              type="text"
                              value={newNominativeDiscount.customerSearch}
                              onChange={(e) => {
                                setNewNominativeDiscount({...newNominativeDiscount, customerSearch: e.target.value, selectedCustomer: null});
                                searchCustomers(e.target.value);
                              }}
                              placeholder="Nome o telefono..."
                              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-purple-500 outline-none transition-all"
                            />
                            
                            {customerSearchResults.length > 0 && !newNominativeDiscount.selectedCustomer && (
                              <div className="absolute z-10 w-full mt-1 bg-white border-2 border-purple-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                                {customerSearchResults.map(customer => (
                                  <button
                                    key={customer.id}
                                    onClick={() => {
                                      setNewNominativeDiscount({ ...newNominativeDiscount, selectedCustomer: customer, customerSearch: customer.name });
                                      setCustomerSearchResults([]);
                                    }}
                                    className="w-full text-left px-4 py-3 hover:bg-purple-50 border-b border-gray-100 last:border-0 min-h-11"
                                  >
                                    <p className="font-semibold text-gray-800">{customer.name}</p>
                                    <p className="text-sm text-gray-500">📱 {customer.phone} • {customer.orders} ordini</p>
                                  </button>
                                ))}
                              </div>
                            )}

                            {newNominativeDiscount.selectedCustomer && (
                              <div className="mt-2 bg-green-100 rounded-lg px-4 py-2 flex items-center justify-between">
                                <span className="text-green-800 font-medium">✅ {newNominativeDiscount.selectedCustomer.name}</span>
                                <button 
                                  onClick={() => setNewNominativeDiscount({...newNominativeDiscount, selectedCustomer: null, customerSearch: ''})} 
                                  className="text-green-600 hover:text-green-800 text-lg p-1 min-w-8 min-h-8"
                                >
                                  ✕
                                </button>
                              </div>
                            )}
                          </div>

                          <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-tighter mb-2">Tipo</label>
                            <TypeSelector type={newNominativeDiscount.type} onChange={(val) => setNewNominativeDiscount({...newNominativeDiscount, type: val})} />
                          </div>

                          <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-tighter mb-2">Valore</label>
                            <input
                              type="number"
                              min="0.5"
                              step="0.5"
                              value={newNominativeDiscount.value}
                              onChange={(e) => setNewNominativeDiscount({...newNominativeDiscount, value: toNumber(e.target.value, 0)})}
                              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-lg font-bold text-center focus:border-purple-500 outline-none"
                            />
                          </div>
                        </div>

                        <button
                          onClick={addNominativeDiscount}
                          disabled={!newNominativeDiscount.selectedCustomer}
                          className="mt-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-xl transition-all min-h-11"
                        >
                          ➕ Crea Sconto
                        </button>
                      </div>

                      {nominativeDiscounts.length > 0 ? (
                        <div className="space-y-3">
                          {nominativeDiscounts.map(discount => (
                            <div key={discount.id} className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                                  <span className="text-purple-600 font-bold text-lg">{discount.customer.name.charAt(0)}</span>
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-800">{discount.customer.name}</p>
                                  <p className="text-sm text-gray-500">
                                    {discount.type === 'euro' ? `€${toNumber(discount.value, 0).toFixed(2)}` : `${toNumber(discount.value, 0)}%`} di sconto
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <Toggle 
                                  enabled={discount.active} 
                                  onChange={() => toggleNominativeDiscount(discount.id)} 
                                  size="sm" 
                                  label={`Toggle sconto ${discount.customer.name}`}
                                />
                                <button 
                                  onClick={() => deleteNominativeDiscount(discount.id)} 
                                  className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors min-w-11 min-h-11"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-10 text-gray-500">
                          <span className="text-5xl">🎯</span>
                          <p className="mt-3 font-medium">Nessuno sconto nominativo</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* INFO BOX */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
                  <div className="flex items-start gap-4">
                    <span className="text-4xl">💡</span>
                    <div>
                      <h4 className="font-bold text-blue-900 mb-1">Lo sapevi?</h4>
                      <p className="text-blue-800">
                        Le piattaforme di intermediazione <strong>non ti mostrano chi sono i tuoi clienti</strong>.
                        Con Ordini-Lampo <strong>i tuoi clienti sono tuoi</strong>: nomi, telefoni, preferenze.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ==================== TAB LOCALITÀ ==================== */}
            {activeTab === 'locations' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800">📍 Località di Consegna</h2>

                <div className="space-y-3">
                  {locations.map(location => (
                    <div key={location.id} className={`bg-gray-50 rounded-xl p-4 flex items-center justify-between transition-all ${!location.active ? 'opacity-50 grayscale' : ''}`}>
                      <div className="flex items-center gap-4 flex-1">
                        <MapPin className={`w-6 h-6 ${location.active ? 'text-blue-600' : 'text-gray-400'}`} />
                        <div className="flex-1">
                          {editingLocation === location.id ? (
                            <div className="flex items-center gap-2 flex-wrap">
                              <input 
                                type="text" 
                                defaultValue={location.name} 
                                className="border-2 rounded-lg px-3 py-2 w-32" 
                                onBlur={(e) => updateLocation(location.id, { name: e.target.value })} 
                              />
                              <input 
                                type="number" 
                                step="0.50" 
                                defaultValue={location.fee} 
                                className="border-2 rounded-lg px-3 py-2 w-20" 
                                onBlur={(e) => updateLocation(location.id, { fee: toNumber(e.target.value, 0) })} 
                              />
                              <input 
                                type="text" 
                                defaultValue={location.estimatedTime} 
                                className="border-2 rounded-lg px-3 py-2 w-28" 
                                onBlur={(e) => updateLocation(location.id, { estimatedTime: e.target.value })} 
                              />
                            </div>
                          ) : (
                            <>
                              <h3 className="font-semibold text-gray-800">{location.name}</h3>
                              <p className="text-sm text-gray-600">€{toNumber(location.fee, 0).toFixed(2)} • {location.estimatedTime}</p>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Toggle 
                          enabled={location.active} 
                          onChange={() => toggleLocationActive(location.id)} 
                          size="sm" 
                          label={`Toggle ${location.name}`}
                        />
                        <button 
                          onClick={() => setEditingLocation(editingLocation === location.id ? null : location.id)} 
                          className="p-3 hover:bg-gray-200 rounded-lg min-w-11 min-h-11"
                        >
                          <Edit2 className="w-5 h-5 text-blue-600" />
                        </button>
                        <button 
                          onClick={() => deleteLocation(location.id)} 
                          className="p-3 hover:bg-gray-200 rounded-lg min-w-11 min-h-11"
                        >
                          <Trash2 className="w-5 h-5 text-red-600" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-blue-50 rounded-xl p-5 border-2 border-blue-200">
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Plus className="w-5 h-5" /> Aggiungi Località
                  </h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    <input 
                      type="text" 
                      placeholder="Nome" 
                      value={newLocation.name} 
                      onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })} 
                      className="flex-1 min-w-32 border-2 rounded-xl px-4 py-3" 
                    />
                    <input 
                      type="number" 
                      step="0.50" 
                      placeholder="€" 
                      value={newLocation.fee} 
                      onChange={(e) => setNewLocation({ ...newLocation, fee: e.target.value })} 
                      className="w-20 border-2 rounded-xl px-4 py-3" 
                    />
                    <input 
                      type="text" 
                      placeholder="Tempo" 
                      value={newLocation.estimatedTime} 
                      onChange={(e) => setNewLocation({ ...newLocation, estimatedTime: e.target.value })} 
                      className="w-32 border-2 rounded-xl px-4 py-3" 
                    />
                    <button 
                      onClick={addLocation} 
                      className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 font-semibold min-h-11"
                    >
                      Aggiungi
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ==================== TAB PREZZI ==================== */}
            {activeTab === 'prices' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800">💰 Prezzi Menu</h2>

                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">🍜 Formati Pokè</h3>
                  <div className="space-y-3">
                    {pokeSizes.map(size => (
                      <div key={size.id} className="flex items-center justify-between bg-white rounded-xl p-4 border">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{size.emoji}</span>
                          <span className="font-semibold text-gray-800">{size.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600">€</span>
                          <input 
                            type="number" 
                            step="0.50" 
                            value={size.price} 
                            onChange={(e) => updatePokeSize(size.id, 'price', e.target.value)} 
                            className="w-24 border-2 rounded-xl px-3 py-2 text-center font-bold" 
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">➕ Prezzi Extra</h3>
                  <div className="space-y-3">
                    {[
                      { key: 'protein', label: '🥩 Proteina Extra', value: extraPrices.protein },
                      { key: 'ingredient', label: '🥬 Ingrediente Extra', value: extraPrices.ingredient },
                      { key: 'sauce', label: '🥫 Salsa Extra', value: extraPrices.sauce }
                    ].map(item => (
                      <div key={item.key} className="flex items-center justify-between bg-white rounded-xl p-4 border">
                        <span className="font-semibold text-gray-800">{item.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600">€</span>
                          <input 
                            type="number" 
                            step="0.10" 
                            value={item.value} 
                            onChange={(e) => updateExtraPrice(item.key, e.target.value)} 
                            className="w-24 border-2 rounded-xl px-3 py-2 text-center font-bold" 
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">🛎️ Servizi</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between bg-white rounded-xl p-4 border">
                      <div className="flex items-center gap-3">
                        <Toggle 
                          enabled={floorDelivery.enabled} 
                          onChange={(val) => updateFloorDelivery('enabled', val)} 
                          size="sm" 
                          label="Consegna al piano"
                        />
                        <span className="font-semibold text-gray-800">🏢 Consegna al Piano</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">€</span>
                        <input 
                          type="number" 
                          step="0.50" 
                          value={floorDelivery.fee} 
                          onChange={(e) => updateFloorDelivery('fee', e.target.value)} 
                          disabled={!floorDelivery.enabled} 
                          className="w-24 border-2 rounded-xl px-3 py-2 text-center font-bold disabled:opacity-50" 
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between bg-white rounded-xl p-4 border">
                      <span className="font-semibold text-gray-800">💝 Mancia Rider Default</span>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">€</span>
                        <input 
                          type="number" 
                          step="0.50" 
                          value={riderTip} 
                          onChange={(e) => setRiderTip(toNumber(e.target.value, 0))} 
                          className="w-24 border-2 rounded-xl px-3 py-2 text-center font-bold" 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ==================== TAB TARIFFE ==================== */}
            {activeTab === 'subscription' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800">💳 Tariffe Ordini-Lampo</h2>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">📋 Piani Disponibili</h3>
                    
                    {Object.values(PRICING_PLANS).map(plan => (
                      <div key={plan.id} className={`bg-gradient-to-r ${plan.color} rounded-xl p-5 border-2 ${plan.border} relative ${currentPlan === plan.id ? 'ring-4 ring-green-400' : ''}`}>
                        {plan.recommended && (
                          <div className="absolute top-0 right-0 bg-orange-500 text-white px-3 py-1 text-xs font-bold rounded-bl-lg">CONSIGLIATO</div>
                        )}
                        {currentPlan === plan.id && (
                          <div className="absolute top-0 left-0 bg-green-500 text-white px-3 py-1 text-xs font-bold rounded-br-lg">✓ ATTIVO</div>
                        )}
                        
                        <div className="flex items-start justify-between mt-4">
                          <div>
                            <h4 className="text-xl font-bold text-gray-800">{plan.emoji} {plan.name}</h4>
                            <p className="text-gray-600 text-sm mt-1">{plan.description}</p>
                            <ul className="mt-3 space-y-1">
                              {plan.features.map((f, i) => (
                                <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                                  <span className="text-green-500">✓</span> {f}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="text-right">
                            <p className="text-3xl font-bold text-gray-800">€{plan.price_per_order.toFixed(2)}</p>
                            <p className="text-gray-600 text-sm">/ordine</p>
                          </div>
                        </div>

                        {currentPlan !== plan.id && (
                          <button 
                            onClick={() => openContractModal(plan.id)} 
                            className="mt-4 w-full bg-gray-800 hover:bg-gray-900 text-white font-bold py-2 px-4 rounded-xl flex items-center justify-center gap-2 min-h-11"
                          >
                            <ChevronRight className="w-5 h-5" /> Passa a {plan.name}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">✅ Piano Attivo</h3>
                    
                    <div className="bg-white rounded-xl p-6 border-2 border-green-400 shadow-lg">
                      <div className="text-center mb-6">
                        <span className="text-5xl">{PRICING_PLANS[currentPlan]?.emoji}</span>
                        <h4 className="text-2xl font-bold text-gray-800 mt-2">{PRICING_PLANS[currentPlan]?.name}</h4>
                        <p className="text-green-600 font-semibold">Piano Attivo</p>
                      </div>

                      <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Costo per ordine:</span>
                          <span className="font-bold text-gray-800">€{PRICING_PLANS[currentPlan]?.price_per_order.toFixed(2)}</span>
                        </div>
                        {currentPlan === 'lampo_500' && (
                          <div className="flex justify-between border-t pt-3">
                            <span className="text-gray-600">Crediti:</span>
                            <span className="font-bold text-blue-600 text-xl">{credits}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ==================== TAB IMPOSTAZIONI ==================== */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800">⚙️ Impostazioni</h2>

                <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                  <div>
                    <label className="block font-semibold text-gray-800 mb-2">🏪 Nome Ristorante</label>
                    <input 
                      type="text" 
                      value={restaurantName} 
                      onChange={(e) => setRestaurantName(e.target.value)} 
                      className="w-full border-2 rounded-xl px-4 py-3" 
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-800 mb-2">📱 WhatsApp</label>
                    <input 
                      type="text" 
                      value={whatsappNumber} 
                      onChange={(e) => setWhatsappNumber(e.target.value)} 
                      className="w-full border-2 rounded-xl px-4 py-3" 
                      placeholder="393271234567" 
                    />
                  </div>

                  <div className="pt-4 border-t">
                    <h3 className="font-semibold text-gray-800 mb-2">🔌 Connessione</h3>
                    <div className="bg-white rounded-xl p-4">
                      <p className="text-sm text-gray-600">API: {API_BASE_URL}</p>
                      <p className="text-sm text-gray-600">Slug: {restaurantSlug}</p>
                      <div className="mt-2">
                        {connectionStatus === 'connected' ? (
                          <span className="text-green-600 text-sm font-semibold">✅ Connesso</span>
                        ) : (
                          <span className="text-red-600 text-sm font-semibold">❌ Errore connessione</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <h3 className="font-semibold text-gray-800 mb-2">📊 RADAR Tier</h3>
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => setRadarTier('base')} 
                        className={`px-4 py-2 rounded-xl font-semibold transition-all min-h-11 ${radarTier === 'base' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}
                      >
                        BASE (Gratis)
                      </button>
                      <button 
                        onClick={() => setRadarTier('full')} 
                        className={`px-4 py-2 rounded-xl font-semibold transition-all min-h-11 ${radarTier === 'full' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' : 'bg-gray-200 text-gray-600'}`}
                      >
                        FULL (+€0.09/ordine)
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div className="text-center text-gray-500 text-sm">
          Ordini-Lampo Admin v3.0 COMPLETE • {restaurantName}
        </div>
      </div>

      {/* MODAL CONTRATTO */}
      {showContractModal && selectedPlanForUpgrade && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FileText className="w-6 h-6" />
              Contratto {PRICING_PLANS[selectedPlanForUpgrade]?.name}
            </h3>

            <div className="flex items-center gap-2 mb-6">
              {[0, 1, 2].map(step => (
                <div key={step} className={`flex-1 h-2 rounded-full transition-all ${contractStep >= step ? 'bg-green-500' : 'bg-gray-200'}`} />
              ))}
            </div>

            <div className="bg-gray-50 rounded-xl p-5 mb-6 min-h-[200px]">
              {contractStep === 0 && (
                <div>
                  <h4 className="font-bold text-gray-800 mb-2">📄 Termini del Servizio</h4>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li>• Costo per ordine: <strong>€{PRICING_PLANS[selectedPlanForUpgrade]?.price_per_order.toFixed(2)}</strong></li>
                    <li>• Attivazione immediata</li>
                    <li>• Puoi cambiare piano quando vuoi</li>
                  </ul>
                  <div className="mt-4 p-3 bg-yellow-50 rounded-xl border border-yellow-200">
                    <p className="text-sm text-yellow-800">⚠️ Conferma di aver letto i termini</p>
                  </div>
                </div>
              )}

              {contractStep === 1 && (
                <div>
                  <h4 className="font-bold text-gray-800 mb-2">✅ Consapevolezza</h4>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li>• Addebiti secondo piano scelto</li>
                    <li>• Fatture settimanali</li>
                    <li>• Supporto via email</li>
                  </ul>
                  <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-200">
                    <p className="text-sm text-blue-800">ℹ️ Conferma di essere consapevole</p>
                  </div>
                </div>
              )}

              {contractStep === 2 && (
                <div className="text-center py-4">
                  <span className="text-5xl">{PRICING_PLANS[selectedPlanForUpgrade]?.emoji}</span>
                  <h5 className="text-2xl font-bold text-gray-800 mt-2">{PRICING_PLANS[selectedPlanForUpgrade]?.name}</h5>
                  <p className="text-3xl font-bold text-green-600 mt-2">€{PRICING_PLANS[selectedPlanForUpgrade]?.price_per_order.toFixed(2)}/ordine</p>
                  <div className="mt-4 p-3 bg-green-50 rounded-xl border border-green-200">
                    <p className="text-sm text-green-800">✓ Clicca CONFERMA per attivare</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setShowContractModal(false)} 
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-4 rounded-xl min-h-11"
              >
                Annulla
              </button>
              <button 
                onClick={handleContractStep} 
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 min-h-11"
              >
                {contractStep < 2 ? <>Sì, Confermo <ChevronRight className="w-5 h-5" /></> : <>✓ CONFERMA</>}
              </button>
            </div>

            <p className="text-center text-gray-500 text-xs mt-4">Step {contractStep + 1} di 3</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== APP WRAPPER ====================
export default function App() {
  if (!CLERK_PUBLISHABLE_KEY) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <span className="text-5xl">⚠️</span>
          <h1 className="text-2xl font-bold text-red-600 mt-4">Configurazione Mancante</h1>
          <p className="text-gray-600 mt-2">VITE_CLERK_PUBLISHABLE_KEY non configurata</p>
        </div>
      </div>
    );
  }

  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
      <SignedOut>
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-black text-slate-800">
                ORDINI<span className="text-green-600">LAMPO</span>
              </h1>
              <p className="text-gray-600 mt-2">Admin Panel</p>
            </div>
            <SignIn 
              appearance={{
                elements: {
                  rootBox: "mx-auto",
                  card: "shadow-xl rounded-2xl"
                }
              }}
            />
          </div>
        </div>
      </SignedOut>
      <SignedIn>
        <AdminPanel />
      </SignedIn>
    </ClerkProvider>
  );
}
