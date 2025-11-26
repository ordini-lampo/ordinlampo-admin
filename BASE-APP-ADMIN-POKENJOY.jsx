import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Edit2, Eye, EyeOff, DollarSign, MapPin, Clock, Settings } from 'lucide-react';

// ============================================
// 🔐 PAGINA ADMIN POKENJOY
// ============================================

export default function PokenjoyAdmin() {
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

  const [whatsappNumber, setWhatsappNumber] = useState('393271234567');
  const [restaurantName, setRestaurantName] = useState('Pokenjoy Sanremo');

  const [activeTab, setActiveTab] = useState('locations');
  const [editingLocation, setEditingLocation] = useState(null);
  const [newLocation, setNewLocation] = useState({ name: '', fee: '', estimatedTime: '' });
  const [showSaveNotification, setShowSaveNotification] = useState(false);

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

  // Salvataggio configurazioni
  const saveAllConfigurations = () => {
    const config = {
      locations,
      pokeSizes,
      extraPrices,
      floorDelivery,
      riderTip,
      whatsappNumber,
      restaurantName,
      lastUpdated: new Date().toISOString()
    };

    // Salva su localStorage (o Firebase se configurato)
    localStorage.setItem('pokenjoy_config', JSON.stringify(config));
    
    // Genera file di configurazione da scaricare
    generateConfigFile(config);
    
    showNotification();
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

  // Carica configurazioni salvate
  useEffect(() => {
    const saved = localStorage.getItem('pokenjoy_config');
    if (saved) {
      try {
        const config = JSON.parse(saved);
        setLocations(config.locations || locations);
        setPokeSizes(config.pokeSizes || pokeSizes);
        setExtraPrices(config.extraPrices || extraPrices);
        setFloorDelivery(config.floorDelivery || floorDelivery);
        setRiderTip(config.riderTip || riderTip);
        setWhatsappNumber(config.whatsappNumber || whatsappNumber);
        setRestaurantName(config.restaurantName || restaurantName);
      } catch (e) {
        console.error('Errore nel caricamento configurazioni', e);
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                ⚙️ Admin Panel - Pokenjoy
              </h1>
              <p className="text-gray-600">Gestisci tutte le configurazioni del sistema</p>
            </div>
            <button
              onClick={saveAllConfigurations}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Save className="w-5 h-5" />
              <span>Salva Tutto</span>
            </button>
          </div>
        </div>

        {/* Notification */}
        {showSaveNotification && (
          <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2 animate-fade-in-down z-50">
            <Check className="w-5 h-5" />
            <span>Modifiche salvate!</span>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg mb-6 overflow-hidden">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('locations')}
              className={`flex-1 py-4 px-6 font-semibold transition-colors ${
                activeTab === 'locations'
                  ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <MapPin className="w-5 h-5 inline mr-2" />
              Località
            </button>
            <button
              onClick={() => setActiveTab('prices')}
              className={`flex-1 py-4 px-6 font-semibold transition-colors ${
                activeTab === 'prices'
                  ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <DollarSign className="w-5 h-5 inline mr-2" />
              Prezzi
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex-1 py-4 px-6 font-semibold transition-colors ${
                activeTab === 'settings'
                  ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Settings className="w-5 h-5 inline mr-2" />
              Impostazioni
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          {activeTab === 'locations' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Gestione Località</h2>
                <p className="text-gray-600 mb-6">Aggiungi, modifica o elimina le località di consegna</p>

                {/* Add New Location */}
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-6">
                  <h3 className="font-bold text-gray-800 mb-3">➕ Aggiungi Nuova Località</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                    <input
                      type="text"
                      placeholder="Nome località"
                      value={newLocation.name}
                      onChange={(e) => setNewLocation({...newLocation, name: e.target.value})}
                      className="p-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                    />
                    <input
                      type="number"
                      step="0.50"
                      placeholder="Tariffa (€)"
                      value={newLocation.fee}
                      onChange={(e) => setNewLocation({...newLocation, fee: e.target.value})}
                      className="p-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Tempo (es: 20-25 min)"
                      value={newLocation.estimatedTime}
                      onChange={(e) => setNewLocation({...newLocation, estimatedTime: e.target.value})}
                      className="p-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={addLocation}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Aggiungi Località</span>
                  </button>
                </div>

                {/* Locations List */}
                <div className="space-y-3">
                  {locations.map(location => (
                    <div
                      key={location.id}
                      className={`border-2 rounded-lg p-4 transition-all ${
                        location.active ? 'border-gray-200' : 'border-gray-200 bg-gray-50 opacity-60'
                      }`}
                    >
                      {editingLocation === location.id ? (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                          <input
                            type="text"
                            value={location.name}
                            onChange={(e) => updateLocation(location.id, { name: e.target.value })}
                            className="p-2 border-2 border-gray-200 rounded focus:border-blue-500 focus:outline-none"
                          />
                          <input
                            type="number"
                            step="0.50"
                            value={location.fee}
                            onChange={(e) => updateLocation(location.id, { fee: parseFloat(e.target.value) })}
                            className="p-2 border-2 border-gray-200 rounded focus:border-blue-500 focus:outline-none"
                          />
                          <input
                            type="text"
                            value={location.estimatedTime}
                            onChange={(e) => updateLocation(location.id, { estimatedTime: e.target.value })}
                            className="p-2 border-2 border-gray-200 rounded focus:border-blue-500 focus:outline-none"
                          />
                          <button
                            onClick={() => setEditingLocation(null)}
                            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded"
                          >
                            Salva
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-bold text-lg">{location.name}</div>
                            <div className="text-sm text-gray-600">
                              💰 €{location.fee.toFixed(2)} • ⏱️ {location.estimatedTime}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => toggleLocationActive(location.id)}
                              className={`p-2 rounded-lg transition-colors ${
                                location.active
                                  ? 'bg-green-100 text-green-600 hover:bg-green-200'
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                              title={location.active ? 'Disattiva' : 'Attiva'}
                            >
                              {location.active ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                            </button>
                            <button
                              onClick={() => setEditingLocation(location.id)}
                              className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                              title="Modifica"
                            >
                              <Edit2 className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => deleteLocation(location.id)}
                              className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                              title="Elimina"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'prices' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Gestione Prezzi</h2>
                <p className="text-gray-600 mb-6">Modifica i prezzi dei formati e degli extra</p>

                {/* Poke Sizes */}
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Formati Pokè</h3>
                  <div className="space-y-3">
                    {pokeSizes.map(size => (
                      <div key={size.id} className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{size.emoji}</span>
                          <span className="font-bold">{size.name}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-gray-600">€</span>
                          <input
                            type="number"
                            step="0.50"
                            value={size.price}
                            onChange={(e) => updatePokeSize(size.id, 'price', e.target.value)}
                            className="w-24 p-2 border-2 border-gray-200 rounded focus:border-blue-500 focus:outline-none font-bold text-right"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Extra Prices */}
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Prezzi Extra</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg">
                      <span className="font-bold">🐟 Proteine extra (dalla 3ª)</span>
                      <div className="flex items-center space-x-3">
                        <span className="text-gray-600">€</span>
                        <input
                          type="number"
                          step="0.10"
                          value={extraPrices.protein}
                          onChange={(e) => updateExtraPrice('protein', e.target.value)}
                          className="w-24 p-2 border-2 border-gray-200 rounded focus:border-blue-500 focus:outline-none font-bold text-right"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg">
                      <span className="font-bold">🥑 Ingredienti extra (dal 5°)</span>
                      <div className="flex items-center space-x-3">
                        <span className="text-gray-600">€</span>
                        <input
                          type="number"
                          step="0.10"
                          value={extraPrices.ingredient}
                          onChange={(e) => updateExtraPrice('ingredient', e.target.value)}
                          className="w-24 p-2 border-2 border-gray-200 rounded focus:border-blue-500 focus:outline-none font-bold text-right"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg">
                      <span className="font-bold">🌶️ Salse extra (dalla 3ª)</span>
                      <div className="flex items-center space-x-3">
                        <span className="text-gray-600">€</span>
                        <input
                          type="number"
                          step="0.10"
                          value={extraPrices.sauce}
                          onChange={(e) => updateExtraPrice('sauce', e.target.value)}
                          className="w-24 p-2 border-2 border-gray-200 rounded focus:border-blue-500 focus:outline-none font-bold text-right"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Optional Services */}
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Servizi Opzionali</h3>
                  <div className="space-y-3">
                    <div className="p-4 border-2 border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-bold">🏢 Consegna al piano</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={floorDelivery.enabled}
                            onChange={(e) => updateFloorDelivery('enabled', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      {floorDelivery.enabled && (
                        <div className="flex items-center space-x-3">
                          <span className="text-gray-600">Supplemento:</span>
                          <span className="text-gray-600">€</span>
                          <input
                            type="number"
                            step="0.50"
                            value={floorDelivery.fee}
                            onChange={(e) => updateFloorDelivery('fee', parseFloat(e.target.value))}
                            className="w-24 p-2 border-2 border-gray-200 rounded focus:border-blue-500 focus:outline-none font-bold text-right"
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg">
                      <span className="font-bold">☕ Mancia suggerita rider</span>
                      <div className="flex items-center space-x-3">
                        <span className="text-gray-600">€</span>
                        <input
                          type="number"
                          step="0.50"
                          value={riderTip}
                          onChange={(e) => setRiderTip(parseFloat(e.target.value))}
                          onBlur={showNotification}
                          className="w-24 p-2 border-2 border-gray-200 rounded focus:border-blue-500 focus:outline-none font-bold text-right"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Impostazioni Generali</h2>
                <p className="text-gray-600 mb-6">Configura nome ristorante e numero WhatsApp</p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      🏪 Nome Ristorante
                    </label>
                    <input
                      type="text"
                      value={restaurantName}
                      onChange={(e) => setRestaurantName(e.target.value)}
                      onBlur={showNotification}
                      className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                      placeholder="Pokenjoy Sanremo"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      📱 Numero WhatsApp (formato: 393271234567)
                    </label>
                    <input
                      type="tel"
                      value={whatsappNumber}
                      onChange={(e) => setWhatsappNumber(e.target.value)}
                      onBlur={showNotification}
                      className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                      placeholder="393271234567"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      ⚠️ Formato: prefisso internazionale (39) + numero senza spazi
                    </p>
                  </div>
                </div>

                <div className="mt-8 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
                  <h3 className="font-bold text-gray-800 mb-2">💡 Istruzioni</h3>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Tutte le modifiche vengono salvate automaticamente</li>
                    <li>• Clicca "Salva Tutto" per generare un file di configurazione</li>
                    <li>• Le località disattivate non appariranno nell'app cliente</li>
                    <li>• I prezzi possono essere modificati in qualsiasi momento</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mt-6">
          <h3 className="font-bold text-gray-800 mb-4">📊 Riepilogo Configurazioni</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="text-gray-600">Località attive</div>
              <div className="text-2xl font-bold text-blue-600">
                {locations.filter(l => l.active).length}
              </div>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="text-gray-600">Formato più economico</div>
              <div className="text-2xl font-bold text-green-600">
                €{Math.min(...pokeSizes.map(s => s.price)).toFixed(2)}
              </div>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <div className="text-gray-600">Consegna più economica</div>
              <div className="text-2xl font-bold text-purple-600">
                €{Math.min(...locations.filter(l => l.active).map(l => l.fee)).toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
