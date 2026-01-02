import React from 'react'
import ReactDOM from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import App from './App.jsx'
import './index.css'

// ============================================
// 🔐 MAIN.JSX - ClerkProvider UNICO WRAPPER (BULLDOZER)
// ============================================
// NOTE:
// - Legge SEMPRE da: VITE_CLERK_PUBLISHABLE_KEY (Netlify Env Var)
// - Se manca, NON crasha in bianco: mostra errore leggibile a schermo.

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

function FatalEnvError({ message }) {
  return (
    <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: 18, marginBottom: 8 }}>Configurazione mancante</h1>
      <p style={{ marginBottom: 12 }}>{message}</p>
      <pre
        style={{
          background: '#111',
          color: '#fff',
          padding: 12,
          borderRadius: 8,
          overflowX: 'auto',
        }}
      >
{`Netlify → Project configuration → Environment variables
Aggiungi:
VITE_CLERK_PUBLISHABLE_KEY=pk_...

Poi: Trigger deploy → Deploy project without cache`}
      </pre>
    </div>
  )
}

const rootEl = document.getElementById('root')
if (!rootEl) {
  throw new Error('Root element #root non trovato (index.html corrotto o diverso).')
}

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    {CLERK_PUBLISHABLE_KEY ? (
      <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
        <App />
      </ClerkProvider>
    ) : (
      <FatalEnvError message="Variabile VITE_CLERK_PUBLISHABLE_KEY assente. L’app non può inizializzare Clerk." />
    )}
  </React.StrictMode>,
)
