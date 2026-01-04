import React from 'react'

// ============================================
// AUTH PROVIDER (NO CLERK) — BULLDOZER
// - Disinnesco completo Clerk lato frontend
// - Nessun gate UI qui: auth gestita altrove (session-cookie)
// - Mantiene API identica: <AuthProvider>{children}</AuthProvider>
// ============================================

export default function AuthProvider({ children }) {
  return <>{children}</>
}
