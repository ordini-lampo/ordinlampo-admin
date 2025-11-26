import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Edit2, Eye, EyeOff, DollarSign, MapPin, Clock, Settings } from 'lucide-react';
import { supabase, getRestaurantConfig, saveRestaurantConfig, testConnection } from './supabaseClient';

// ============================================
// 🔐 ADMIN PANEL ORDINLAMPO - POKENJOY
// ============================================

// ID Ristorante Pokenjoy (dal database)
const RESTAURANT_ID = '11111111-1111-1111-1111-111111111111';

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

  // Carica configurazioni salvate
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

      // SOSTITUISCE: const saved = localStorage.getItem('pokenjoy_config')
      const config = await getRestaurantConfig(RESTAURANT_ID);
      
      if (config && config.settings) {
        const settings = config.settings;
        
        // Carica dati se presenti
        if (settings.delivery_locations) setLocations(settings.delivery_locations);
        if (settings.poke_sizes) setPokeSizes(settings.poke_sizes);
        if (settings.extra_prices) setExtraPrices(settings.extra_prices);
        if (settings.floor_delivery) setFloorDelivery(settings.floor_delivery);
        if (settings.rider_tip) setRiderTip(settings.rider_tip);
        if (settings.whatsapp_number) setWhatsappNumber(settings.whatsapp_number);
        if (settings.restaurant_name) setRestaurantName(settings.restaurant_name);
        
        console.log('✅ Configurazioni caricate da Supabase');
      } else {
        console.log('⚠️ Nessuna configurazione trovata, uso defaults');
      }
      
      setLoading(false);
    };

    loadConfig();
  }, []);

  // Salvataggio automatico ogni volta che cambia qualcosa (opzionale)
  // useEffect(() => {
  //   if (!loading) {
  //     const timer = setTimeout(() => {
  //       saveAllConfigurations();
  //     }, 2000);
  //     return () => clearTimeout(timer);
  //   }
  // }, [locations, pokeSizes, extraPrices, floorDelivery, riderTip]);

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
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                ⚙️ Admin Panel - Ordinlampo
              </h1>
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
              <span>Località Consegna</span>
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
              <span>Prezzi & Tariffe</span>
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

                  <div className="pt-4 border-t">
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
