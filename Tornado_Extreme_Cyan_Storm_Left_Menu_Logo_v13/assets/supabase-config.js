// Public browser configuration. Never place a Supabase service_role/secret key here.
window.TOR_SUPABASE_URL = 'https://esqoeqzhtxxujtdrqysj.supabase.co';
window.TOR_SUPABASE_KEY = 'sb_publishable_49QiK6_lKHgzKTat_ZG-lA_DbVuYaPi';

// Reuse one Supabase client across page scripts to avoid duplicate auth clients.
if (window.supabase && !window.TOR_SUPABASE_CLIENT) {
  window.TOR_SUPABASE_CLIENT = window.supabase.createClient(window.TOR_SUPABASE_URL, window.TOR_SUPABASE_KEY, {
    auth: { storage: window.localStorage, persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });
}
