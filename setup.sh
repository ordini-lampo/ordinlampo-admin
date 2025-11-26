#!/bin/bash

# ============================================
# 🚀 SETUP AUTOMATICO ORDINLAMPO ADMIN
# ============================================

echo "🚀 Ordinlampo Admin - Setup Automatico"
echo "========================================"
echo ""

# Controlla Node.js
echo "🔍 Controllo Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js non trovato!"
    echo "📥 Installazione Node.js..."
    sudo apt update
    sudo apt install -y nodejs npm
fi

NODE_VERSION=$(node --version)
echo "✅ Node.js installato: $NODE_VERSION"
echo ""

# Controlla npm
NPM_VERSION=$(npm --version)
echo "✅ npm installato: $NPM_VERSION"
echo ""

# Installa dipendenze
echo "📦 Installazione dipendenze..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dipendenze installate con successo!"
else
    echo "❌ Errore installazione dipendenze"
    exit 1
fi

echo ""
echo "========================================"
echo "✅ Setup completato!"
echo ""
echo "🎯 Per avviare l'app:"
echo "   npm run dev"
echo ""
echo "🌐 L'app sarà disponibile su:"
echo "   http://localhost:5173"
echo ""
echo "📱 Apri il browser e vai a localhost:5173"
echo "========================================"
