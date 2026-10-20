import { createClient, SupabaseClient, User as SupabaseUser, Session } from '@supabase/supabase-js';

const STORAGE_KEY_URL = 'holpdf_supabase_url';
const STORAGE_KEY_ANON = 'holpdf_supabase_anon_key';

// Helper to extract the project ref from a Supabase URL
// (the first segment of the hostname, e.g. "gycgtypraizigcgpfhvw")
export const getProjectRef = (url: string): string => {
  if (!url) return '';
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    const hostParts = parsed.hostname.split('.');
    return hostParts[0] || '';
  } catch {
    return '';
  }
};

const rawEnvUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const rawEnvAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();
const hasEnvConfig = Boolean(rawEnvUrl && rawEnvAnonKey);

export const isConfigFromEnv = (): boolean => hasEnvConfig;
export const getSupabaseConfigSource = (): 'env' | 'localStorage' | 'none' => {
  if (hasEnvConfig) return 'env';
  if (typeof window !== 'undefined' && window.localStorage) {
    const storedUrl = localStorage.getItem(STORAGE_KEY_URL);
    const storedAnon = localStorage.getItem(STORAGE_KEY_ANON);
    if (storedUrl && storedAnon) return 'localStorage';
  }
  return 'none';
};

// When config exists in environment variables, it ALWAYS has priority:
// Remove stale localStorage keys (holpdf_supabase_url, holpdf_supabase_anon_key, and non-matching sb-*-auth-token)
if (typeof window !== 'undefined' && window.localStorage && hasEnvConfig) {
  try {
    localStorage.removeItem(STORAGE_KEY_URL);
    localStorage.removeItem(STORAGE_KEY_ANON);

    const activeRef = getProjectRef(rawEnvUrl);
    const validTokenKey = activeRef ? `sb-${activeRef}-auth-token` : null;

    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
        if (key !== validTokenKey) {
          keysToRemove.push(key);
        }
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch (e) {
    console.warn('Erreur lors du nettoyage du localStorage Supabase:', e);
  }
}

// Initial configuration selection
const getInitialConfig = (): { url: string; anonKey: string; source: 'env' | 'localStorage' | 'none' } => {
  if (hasEnvConfig) {
    return { url: rawEnvUrl, anonKey: rawEnvAnonKey, source: 'env' };
  }

  if (typeof window !== 'undefined' && window.localStorage) {
    const storedUrl = (localStorage.getItem(STORAGE_KEY_URL) || '').trim();
    const storedAnon = (localStorage.getItem(STORAGE_KEY_ANON) || '').trim();
    if (storedUrl && storedAnon) {
      return { url: storedUrl, anonKey: storedAnon, source: 'localStorage' };
    }
  }

  return { url: '', anonKey: '', source: 'none' };
};

let currentConfig = getInitialConfig();

// Singleton management: single GoTrueClient instance across the entire application
let supabaseInstance: SupabaseClient | null = null;
let initializedUrl: string | null = null;
let initializedKey: string | null = null;

const initClient = (url: string, anonKey: string): SupabaseClient | null => {
  if (!url || !anonKey) return null;

  // Singleton: Only recreate if url or key has actually changed
  if (supabaseInstance && initializedUrl === url && initializedKey === anonKey) {
    return supabaseInstance;
  }

  try {
    supabaseInstance = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
    initializedUrl = url;
    initializedKey = anonKey;
    return supabaseInstance;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
};

// Initialize singleton client at startup
if (currentConfig.url && currentConfig.anonKey) {
  supabaseInstance = initClient(currentConfig.url, currentConfig.anonKey);
}

// Diagnostic: at startup, print project ref and its source (without exposing the key)
if (currentConfig.url) {
  const ref = getProjectRef(currentConfig.url);
  console.info(`Supabase projet : ${ref} (source: ${currentConfig.source})`);
} else {
  console.info('Supabase projet : non configuré (source: none)');
}

export const getSupabase = (): SupabaseClient | null => {
  if (!supabaseInstance && currentConfig.url && currentConfig.anonKey) {
    supabaseInstance = initClient(currentConfig.url, currentConfig.anonKey);
  }
  return supabaseInstance;
};

export const isSupabaseConfigured = (): boolean => {
  return Boolean(currentConfig.url && currentConfig.anonKey);
};

export const getSupabaseConfig = () => ({
  url: currentConfig.url,
  anonKey: currentConfig.anonKey,
  source: currentConfig.source,
});

export const setSupabaseConfig = (url: string, anonKey: string): boolean => {
  if (hasEnvConfig) {
    console.warn('La configuration Supabase est définie par l’environnement et ne peut être modifiée.');
    return false;
  }

  const cleanUrl = url.trim();
  const cleanKey = anonKey.trim();

  if (cleanUrl && cleanKey) {
    try {
      localStorage.setItem(STORAGE_KEY_URL, cleanUrl);
      localStorage.setItem(STORAGE_KEY_ANON, cleanKey);
      currentConfig = { url: cleanUrl, anonKey: cleanKey, source: 'localStorage' };
      supabaseInstance = initClient(cleanUrl, cleanKey);
      const ref = getProjectRef(cleanUrl);
      console.info(`Supabase projet : ${ref} (source: localStorage)`);
      return true;
    } catch (e) {
      console.error('Error saving Supabase config:', e);
      return false;
    }
  }
  return false;
};

export const clearSupabaseConfig = () => {
  if (hasEnvConfig) {
    console.warn('Impossible d’effacer la configuration Supabase définie par l’environnement.');
    return;
  }
  try {
    localStorage.removeItem(STORAGE_KEY_URL);
    localStorage.removeItem(STORAGE_KEY_ANON);
    currentConfig = { url: '', anonKey: '', source: 'none' };
    supabaseInstance = null;
    initializedUrl = null;
    initializedKey = null;
  } catch (e) {
    console.error('Error clearing Supabase config:', e);
  }
};

export interface AuthResult {
  success: boolean;
  user?: SupabaseUser | null;
  session?: Session | null;
  error?: string | null;
  needsEmailConfirmation?: boolean;
}

/**
 * Register a user via Supabase Auth
 */
export const registerWithSupabase = async (
  email: string,
  password: string,
  name?: string
): Promise<AuthResult> => {
  const client = getSupabase();

  const cleanEmail = email.trim().toLowerCase();
  const cleanName = name?.trim() || cleanEmail.split('@')[0];

  if (!client) {
    // If Supabase is not configured with project credentials, simulate successful registration
    // and store in local session so app remains 100% functional
    const mockUser: any = {
      id: `local-user-${Date.now()}`,
      email: cleanEmail,
      user_metadata: {
        full_name: cleanName,
        name: cleanName,
      },
    };
    return {
      success: true,
      user: mockUser,
      needsEmailConfirmation: false,
    };
  }

  try {
    // 1. Attempt sign up
    const { data, error } = await client.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          full_name: cleanName,
          name: cleanName,
        },
      },
    });

    if (error) {
      const errMsg = error.message || '';

      // If user already registered, immediately try logging in with the entered password!
      if (
        errMsg.toLowerCase().includes('already registered') ||
        errMsg.toLowerCase().includes('already exists') ||
        errMsg.toLowerCase().includes('user already registered')
      ) {
        const loginAttempt = await client.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (loginAttempt.data?.session) {
          return {
            success: true,
            user: loginAttempt.data.user,
            session: loginAttempt.data.session,
            needsEmailConfirmation: false,
          };
        } else if (loginAttempt.error) {
          if (loginAttempt.error.message.toLowerCase().includes('email not confirmed')) {
            return {
              success: false,
              error: "Ce compte existe déjà mais son e-mail n'a pas encore été validé. Cliquez sur le lien reçu par e-mail ou désactivez la confirmation dans Supabase.",
              needsEmailConfirmation: true,
            };
          }
          return {
            success: false,
            error: "Ce compte existe déjà avec un mot de passe différent. Veuillez vous connecter.",
          };
        }
      }

      // If database error caused by conflicting triggers on auth.users
      if (
        errMsg.toLowerCase().includes('database error') ||
        errMsg.toLowerCase().includes('saving new user')
      ) {
        return {
          success: false,
          error: "Erreur interne Supabase ('Database error saving new user'). Un déclencheur SQL bloque l'insertion. Supprimez les triggers sur auth.users (on_auth_user_auto_confirm).",
        };
      }

      return {
        success: false,
        error: error.message,
      };
    }

    // 2. If immediate session returned
    if (data.session) {
      return {
        success: true,
        user: data.user,
        session: data.session,
        needsEmailConfirmation: false,
      };
    }

    // 3. If session is null, test immediate signInWithPassword
    const directLogin = await client.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (directLogin.data?.session) {
      return {
        success: true,
        user: directLogin.data.user,
        session: directLogin.data.session,
        needsEmailConfirmation: false,
      };
    }

    // 4. Check if user already exists (identities empty is Supabase's silent existing user check)
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      // User existed already, let's notify user to log in
      return {
        success: false,
        error: "Cette adresse e-mail est déjà inscrite. Veuillez passer sur l'onglet 'Connexion'.",
      };
    }

    const needsEmailConfirmation = !directLogin.data?.session && Boolean(data.user);

    return {
      success: true,
      user: data.user,
      session: data.session,
      needsEmailConfirmation,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Une erreur est survenue lors de l'inscription.",
    };
  }
};

/**
 * Log in a user via Supabase Auth
 */
export const loginWithSupabase = async (
  email: string,
  password: string
): Promise<AuthResult> => {
  const client = getSupabase();

  if (!client) {
    // Simulated login if Supabase credentials are not yet entered
    const mockUser: any = {
      id: `local-user-${Date.now()}`,
      email,
      user_metadata: {
        full_name: email.split('@')[0],
        name: email.split('@')[0],
      },
    };
    return {
      success: true,
      user: mockUser,
    };
  }

  try {
    const { data, error } = await client.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      user: data.user,
      session: data.session,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Identifiants invalides ou erreur de connexion.',
    };
  }
};

/**
 * Log out user from Supabase
 */
export const logoutFromSupabase = async (): Promise<void> => {
  const client = getSupabase();
  if (client) {
    try {
      await client.auth.signOut();
    } catch (e) {
      console.error('Error signing out of Supabase:', e);
    }
  }
};

/**
 * Send password reset email via Supabase
 */
export const resetSupabasePassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
  const client = getSupabase();
  if (!client) {
    return { success: true };
  }

  try {
    const { error } = await client.auth.resetPasswordForEmail(email);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Erreur lors de la réinitialisation.' };
  }
};

/**
 * Resend email confirmation via Supabase
 */
export const resendConfirmationEmail = async (email: string): Promise<{ success: boolean; error?: string }> => {
  const client = getSupabase();
  if (!client) {
    return { success: true };
  }

  try {
    const { error } = await client.auth.resend({
      type: 'signup',
      email,
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Erreur lors de l'envoi de l'e-mail de confirmation." };
  }
};

/**
 * Get the current Supabase session
 */
export const getCurrentSupabaseSession = async () => {
  const client = getSupabase();
  if (!client) return null;
  try {
    const { data } = await client.auth.getSession();
    return data.session;
  } catch (err) {
    console.error('Error fetching Supabase session:', err);
    return null;
  }
};

/**
 * Synchronize document to Supabase database (if user is authenticated)
 */
export const syncDocumentToSupabase = async (doc: any, userId?: string) => {
  const client = getSupabase();
  if (!client) return;

  try {
    let targetUserId = userId;
    if (!targetUserId) {
      const { data } = await client.auth.getSession();
      targetUserId = data.session?.user?.id;
    }
    if (!targetUserId) return;

    await client.from('documents').upsert({
      id: doc.id,
      user_id: targetUserId,
      title: doc.title,
      subtitle: doc.subtitle || '',
      pages: doc.pagesCount || 1,
      current_page: doc.progressPage || 1,
      progress: Math.round(((doc.progressPage || 1) / Math.max(1, doc.pagesCount || 1)) * 100),
      category: doc.category || 'pdf',
      color: doc.color || 'purple',
      is_favorite: Boolean(doc.isFavorite),
      format: doc.isOriginalPdf ? 'PDF' : 'DOC',
      file_url: doc.coverImageUrl || '',
      last_read_at: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('Could not sync document to Supabase (continuing offline):', err);
  }
};

/**
 * Delete document from Supabase
 */
export const deleteDocumentFromSupabase = async (docId: string) => {
  const client = getSupabase();
  if (!client) return;

  try {
    await client.from('documents').delete().eq('id', docId);
  } catch (err) {
    console.warn('Could not delete document from Supabase:', err);
  }
};

