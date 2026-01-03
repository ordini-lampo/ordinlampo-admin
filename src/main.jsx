import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// ============================================
// MAIN.JSX (NO CLERK) — BULLDOZER
// - Boot minimale, zero dipendenze auth
// - Session-cookie gestita dentro App.jsx
// ============================================

function FatalBootError({ message }) {
  return (
    <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: 18, marginBottom: 8 }}>Errore di avvio</h1>
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
{`Check rapidi:
1) Netlify → Deploys → ultimo deploy
2) Netlify → Environment variables → VITE_API_URL presente
3) API → /health risponde "ok"`}
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
    <App />
  </React.StrictMode>,
)
