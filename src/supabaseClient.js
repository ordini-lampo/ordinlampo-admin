// ============================================
// 🔌 SUPABASE CLIENT - ORDINLAMPO
// ============================================
// Configurazione client Supabase per app admin
// AGGIORNATO: 29 Nov 2025 - Aggiunto supporto campi abbonamento Stripe

import { createClient } from '@supabase/supabase-js'

// Credenziali Supabase
const supabaseUrl = 'https://juwusmklaavhshwkfjjs.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1d3VzbWtsYWF2aHNod2tmampzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MDU1ODAsImV4cCI6MjA3ODA4MTU4MH0.YkFJydeC6He50APrZtQkoqyaQ3HdlcAm-scPsYCPvEM'

// Crea e esporta client Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ============================================
// 🛠️ FUNZIONI HELPER PER ADMIN
// ============================================

// Ottieni configurazione ristorante (CON CAMPI ABBONAMENTO)
export const getRestaurantConfig = async (restaurantId) => {
  try {
    const { data, error } = await supabase
      .from('restaurants')
      .select(`
        settings, 
        name, 
        whatsapp_number,
        plan_id,
        subscription_status,
        stripe_customer_id,
        stripe_subscription_id,
        current_period_end,
        billing_email
      `)
      .eq('id', restaurantId)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Errore caricamento config:', error)
    return null
  }
}

// Salva configurazione ristorante
export const saveRestaurantConfig = async (restaurantId, config) => {
  try {
    const { data, error } = await supabase
      .from('restaurants')
      .update({
        settings: config,
        updated_at: new Date().toISOString()
      })
      .eq('id', restaurantId)
      .select()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Errore salvataggio config:', error)
    return null
  }
}

// Ottieni lista tutti ristoranti (per super admin)
export const getAllRestaurants = async () => {
  try {
    const { data, error } = await supabase
      .from('restaurants')
      .select('id, name, slug, active, plan_id, subscription_status')
      .order('name')

    if (error) throw error
    return data
  } catch (error) {
    console.error('Errore caricamento ristoranti:', error)
    return []
  }
}

// Test connessione
export const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('restaurants')
      .select('count')
      .limit(1)

    if (error) throw error
    console.log('✅ Connessione Supabase OK!')
    return true
  } catch (error) {
    console.error('❌ Errore connessione Supabase:', error)
    return false
  }
}
