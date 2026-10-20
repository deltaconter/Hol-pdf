import React, { useState } from 'react';
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Database,
  Key,
  Globe,
  Settings2,
  Check,
  AlertCircle,
  Send,
  HelpCircle,
  Copy,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { HolPdfLogo } from '../components/HolPdfLogo';
import { UserProfile } from '../types';
import {
  registerWithSupabase,
  loginWithSupabase,
  isSupabaseConfigured,
  getSupabaseConfig,
  setSupabaseConfig,
  resendConfirmationEmail,
  isConfigFromEnv,
  getProjectRef,
} from '../utils/supabaseClient';

interface LoginScreenProps {
  userProfile: UserProfile;
  onLoginSuccess: (email?: string, name?: string) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  userProfile,
  onLoginSuccess,
}) => {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState(
    userProfile.name && userProfile.name !== 'Utilisateur' && userProfile.name !== 'Invité'
      ? userProfile.name
      : ''
  );
  const [email, setEmail] = useState(userProfile.email || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  // Email confirmation help state
  const [isEmailUnconfirmedError, setIsEmailUnconfirmedError] = useState(false);
  const [isResendingEmail, setIsResendingEmail] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [showSupabaseHelp, setShowSupabaseHelp] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Supabase Configuration Modal State
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [supabaseUrlInput, setSupabaseUrlInput] = useState(getSupabaseConfig().url);
  const [supabaseAnonKeyInput, setSupabaseAnonKeyInput] = useState(getSupabaseConfig().anonKey);
  const [configSavedToast, setConfigSavedToast] = useState(false);
  const hasSupabaseKeys = isSupabaseConfigured();
  const configFromEnv = isConfigFromEnv();
  const projectRef = getProjectRef(getSupabaseConfig().url);

  // Synchronize with userProfile without wiping user typing
  React.useEffect(() => {
    if (!name && userProfile.name && userProfile.name !== 'Utilisateur' && userProfile.name !== 'Invité') {
      setName(userProfile.name);
    }
    if (!email && userProfile.email) {
      setEmail(userProfile.email);
    }
  }, [userProfile.name, userProfile.email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);
    setIsEmailUnconfirmedError(false);
    setResendStatus(null);

    const cleanEmail = email.trim();
    const cleanName = name.trim();

    if (!cleanEmail) {
      setErrorMessage('Veuillez renseigner une adresse e-mail valide.');
      return;
    }

    if (authMode === 'register') {
      if (password.length < 6) {
        setErrorMessage('Le mot de passe doit comporter au moins 6 caractères.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('Les mots de passe ne correspondent pas.');
        return;
      }

      setIsLoading(true);
      try {
        const result = await registerWithSupabase(cleanEmail, password, cleanName);
        setIsLoading(false);

        if (!result.success) {
          if (result.needsEmailConfirmation) {
            setIsEmailUnconfirmedError(true);
          }
          setErrorMessage(result.error || "Échec de l'inscription avec Supabase.");
          return;
        }

        if (result.needsEmailConfirmation) {
          setIsEmailUnconfirmedError(true);
          setInfoMessage(
            "Inscription réussie ! Un e-mail de confirmation vous a été envoyé par Supabase. Veuillez cliquer sur le lien dans votre boîte de réception pour valider votre compte."
          );
        } else {
          onLoginSuccess(cleanEmail, cleanName || undefined);
        }
      } catch (err: any) {
        setIsLoading(false);
        setErrorMessage(err?.message || "Une erreur inattendue est survenue.");
      }
    } else {
      // Login mode
      setIsLoading(true);
      try {
        const result = await loginWithSupabase(cleanEmail, password);
        setIsLoading(false);

        if (!result.success) {
          const rawErr = result.error || '';
          if (rawErr.toLowerCase().includes('email not confirmed')) {
            setIsEmailUnconfirmedError(true);
            setErrorMessage(
              "Votre adresse e-mail n'a pas encore été confirmée dans Supabase. Veuillez cliquer sur le lien reçu par e-mail, ou désactivez la confirmation dans votre console Supabase."
            );
          } else {
            setErrorMessage(rawErr || 'Identifiants invalides.');
          }
          return;
        }

        const registeredName =
          result.user?.user_metadata?.full_name ||
          result.user?.user_metadata?.name ||
          cleanEmail.split('@')[0];

        onLoginSuccess(cleanEmail, registeredName);
      } catch (err: any) {
        setIsLoading(false);
        setErrorMessage(err?.message || "Une erreur inattendue est survenue.");
      }
    }
  };

  const handleResendEmail = async () => {
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage("Veuillez renseigner votre e-mail ci-dessous avant de renvoyer l'e-mail.");
      return;
    }

    setIsResendingEmail(true);
    setResendStatus(null);

    const res = await resendConfirmationEmail(cleanEmail);
    setIsResendingEmail(false);

    if (res.success) {
      setResendStatus("E-mail de confirmation renvoyé ! Vérifiez votre boîte de réception et vos courriers indésirables (spams).");
    } else {
      setResendStatus(`Erreur : ${res.error || "Impossible d'envoyer l'e-mail pour le moment."}`);
    }
  };

  const handleCopySql = () => {
    const sqlText = `update auth.users set email_confirmed_at = now() where email = '${email.trim() || 'votre_email@exemple.com'}';`;
    navigator.clipboard.writeText(sqlText);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const handleGoogleSignIn = () => {
    setGoogleLoading(true);
    setErrorMessage(null);
    setTimeout(() => {
      setGoogleLoading(false);
      onLoginSuccess('utilisateur@holpdf.app', 'Utilisateur Google');
    }, 700);
  };

  const handleSaveSupabaseConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseUrlInput.trim() || !supabaseAnonKeyInput.trim()) {
      setErrorMessage('Veuillez fournir l’URL Supabase et la clé Anon.');
      return;
    }

    const ok = setSupabaseConfig(supabaseUrlInput.trim(), supabaseAnonKeyInput.trim());
    if (ok) {
      setConfigSavedToast(true);
      setTimeout(() => {
        setConfigSavedToast(false);
        setShowConfigModal(false);
      }, 1000);
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-between bg-[#040612] text-white p-5 sm:p-6 overflow-y-auto select-none">
      {/* Subtle ambient lighting matching Splash Screen */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 bg-red-600/12 rounded-full blur-[110px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-72 h-72 bg-rose-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Top Header */}
      <div className="flex items-center justify-between z-10">
        <HolPdfLogo size="sm" showSubtitle={false} />

        {/* Supabase Status Button / Badge */}
        {configFromEnv ? (
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-900 border border-red-500/40 text-red-300 shadow-[0_0_10px_rgba(239,68,68,0.2)] select-none"
            title={`Supabase connecté au projet : ${projectRef || 'actif'}`}
          >
            <Database size={12} className="text-red-400" />
            <span>Supabase Actif</span>
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_6px_rgba(239,68,68,0.8)]" />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowConfigModal(true)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer border ${
              hasSupabaseKeys
                ? 'bg-slate-900 border-red-500/40 text-red-300 shadow-[0_0_10px_rgba(239,68,68,0.2)]'
                : 'bg-slate-900 border-slate-700/80 text-slate-300 hover:text-white'
            }`}
            title="Configurer le projet Supabase"
          >
            <Database size={12} className={hasSupabaseKeys ? 'text-red-400' : 'text-slate-400'} />
            <span>{hasSupabaseKeys ? 'Supabase Actif' : 'Config Supabase'}</span>
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                hasSupabaseKeys ? 'bg-red-500 animate-pulse shadow-[0_0_6px_rgba(239,68,68,0.8)]' : 'bg-amber-400'
              }`}
            />
          </button>
        )}
      </div>

      {/* Main Card */}
      <div className="my-auto w-full max-w-sm mx-auto z-10 py-3">
        {/* Title */}
        <div className="text-center mb-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/25 text-red-400 text-[10px] font-bold uppercase tracking-wider mb-2.5">
            <Database size={11} className="text-red-400" />
            <span>Authentification HolPdf</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1 flex items-center justify-center gap-1.5">
            <span>{authMode === 'register' ? 'Créer un compte' : 'Connexion à'}</span>
            <span className="font-extrabold">
              <span className="text-white">Hol</span>
              <span className="text-red-500">Pdf</span>
            </span>
          </h1>
          <p className="text-xs text-slate-400">
            {authMode === 'register'
              ? 'Inscrivez-vous pour sécuriser et synchroniser vos PDF et livres audio.'
              : 'Accédez à votre bibliothèque et vos préférences de lecture audio.'}
          </p>
        </div>

        {/* Tab Switcher: Inscription / Connexion in HolPdf Red Ambiance */}
        <div className="flex p-1 bg-slate-900/90 border border-slate-800 rounded-xl mb-4 text-xs font-medium">
          <button
            type="button"
            onClick={() => {
              setAuthMode('login');
              setErrorMessage(null);
              setInfoMessage(null);
              setIsEmailUnconfirmedError(false);
              setResendStatus(null);
            }}
            className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer text-center ${
              authMode === 'login'
                ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white font-semibold shadow-[0_2px_12px_rgba(239,68,68,0.3)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Connexion
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('register');
              setErrorMessage(null);
              setInfoMessage(null);
              setIsEmailUnconfirmedError(false);
              setResendStatus(null);
            }}
            className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer text-center ${
              authMode === 'register'
                ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white font-semibold shadow-[0_2px_12px_rgba(239,68,68,0.3)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Inscription
          </button>
        </div>

        {/* Info Message (e.g. Email Confirmation Sent) */}
        {infoMessage && (
          <div className="mb-3.5 p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-rose-200 text-xs flex items-start gap-2 animate-fadeIn text-left">
            <CheckCircle2 size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
            <span>{infoMessage}</span>
          </div>
        )}

        {/* Error message */}
        {errorMessage && (
          <div className="mb-3.5 p-3 rounded-xl bg-red-950/70 border border-red-800/80 text-red-200 text-xs flex flex-col gap-2 animate-fadeIn text-left">
            <div className="flex items-start gap-2">
              <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <span>{errorMessage}</span>
                {errorMessage.toLowerCase().includes('database error') && (
                  <div className="mt-2 p-2 bg-black/60 rounded-lg border border-red-900/60 font-mono text-[10px] text-amber-300">
                    <p className="font-sans font-bold text-white mb-1">
                      🔧 Solution immédiate dans Supabase SQL Editor :
                    </p>
                    <code>drop trigger if exists on_auth_user_auto_confirm on auth.users;</code>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-red-900/50 text-[11px]">
              <button
                type="button"
                onClick={() => setAuthMode(authMode === 'register' ? 'login' : 'register')}
                className="text-red-300 hover:text-white underline cursor-pointer"
              >
                {authMode === 'register' ? 'Passer à la Connexion' : "Créer un compte"}
              </button>
              <button
                type="button"
                onClick={() =>
                  onLoginSuccess(
                    email.trim() || 'utilisateur@holpdf.app',
                    name.trim() || 'Utilisateur'
                  )
                }
                className="text-red-400 hover:text-red-300 font-bold cursor-pointer hover:underline"
              >
                Accéder directement →
              </button>
            </div>
          </div>
        )}

        {/* Dedicated "Email Not Confirmed" Action & Resolution Box */}
        {isEmailUnconfirmedError && (
          <div className="mb-3.5 p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs space-y-2.5 animate-fadeIn text-left">
            <div className="flex items-center justify-between font-semibold text-amber-300">
              <span className="flex items-center gap-1.5">
                <Mail size={14} className="text-amber-400" />
                Validation de l'e-mail requise
              </span>
              <button
                type="button"
                onClick={() => setShowSupabaseHelp(!showSupabaseHelp)}
                className="text-[11px] text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Comment débloquer ?</span>
                {showSupabaseHelp ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
            </div>

            <p className="text-[11px] text-amber-300/90 leading-relaxed">
              Supabase attend la validation du lien envoyé à <strong className="text-white">{email || 'votre adresse'}</strong>.
            </p>

            <div className="flex items-center gap-2 pt-0.5">
              <button
                type="button"
                onClick={handleResendEmail}
                disabled={isResendingEmail}
                className="flex-1 py-1.5 px-3 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isResendingEmail ? (
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send size={12} />
                    <span>Renvoyer l'e-mail</span>
                  </>
                )}
              </button>
            </div>

            {resendStatus && (
              <p className="text-[10px] text-amber-200 bg-amber-900/40 p-2 rounded-lg border border-amber-700/50">
                {resendStatus}
              </p>
            )}

            {/* Expandable step-by-step help guide */}
            {showSupabaseHelp && (
              <div className="pt-2 border-t border-amber-500/20 text-[11px] text-slate-300 space-y-2 text-left">
                <p className="font-semibold text-amber-200">
                  2 façons simples de résoudre ce problème :
                </p>

                <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 space-y-1">
                  <p className="text-red-400 font-bold">
                    ✅ Option 1 (Recommandée) : Désactiver "Confirm Email" dans Supabase
                  </p>
                  <ol className="list-decimal list-inside space-y-0.5 text-[10px] text-slate-300">
                    <li>Allez sur le dashboard Supabase.</li>
                    <li>Ouvrez <strong>Authentication</strong> ➔ <strong>Providers</strong> ➔ <strong>Email</strong>.</li>
                    <li>Décochez <span className="text-amber-300 font-medium">"Confirm email"</span> et cliquez sur <strong>Save</strong>.</li>
                  </ol>
                </div>

                <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <p className="text-rose-400 font-bold">
                      ⚡ Option 2 : Valider votre utilisateur en 1 clic
                    </p>
                    <button
                      type="button"
                      onClick={handleCopySql}
                      className="px-2 py-0.5 rounded bg-red-600/30 hover:bg-red-600/50 text-[10px] text-red-300 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedSql ? <Check size={11} /> : <Copy size={11} />}
                      <span>{copiedSql ? 'Copié !' : 'Copier SQL'}</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Dans le <strong>SQL Editor</strong> de Supabase, exécutez simplement :
                  </p>
                  <pre className="p-1.5 bg-black/60 rounded border border-slate-800 font-mono text-[9px] text-rose-300 overflow-x-auto">
                    {`update auth.users set email_confirmed_at = now() where email = '${email || 'votre_email@exemple.com'}';`}
                  </pre>
                  <p className="text-[10px] text-slate-400">
                    Ou dans <strong>Authentication ➔ Users</strong>, cliquez sur les <code>...</code> à droite de votre compte puis sur <strong>"Confirm User"</strong>.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Name field (Inscription only) */}
          {authMode === 'register' && (
            <div className="space-y-1 text-left">
              <label className="block text-xs font-medium text-slate-300">
                Nom complet
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3 text-slate-400 pointer-events-none">
                  <User size={15} />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jean Dupont"
                  className="w-full pl-9 pr-3 py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
                />
              </div>
            </div>
          )}

          {/* Email field */}
          <div className="space-y-1 text-left">
            <label className="block text-xs font-medium text-slate-300">
              Adresse e-mail
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3 text-slate-400 pointer-events-none">
                <Mail size={15} />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre.email@exemple.com"
                className="w-full pl-9 pr-3 py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
              />
            </div>
          </div>

          {/* Password field */}
          <div className="space-y-1 text-left">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium text-slate-300">
                Mot de passe {authMode === 'register' && '(min. 6 caractères)'}
              </label>
            </div>
            <div className="relative flex items-center">
              <div className="absolute left-3 text-slate-400 pointer-events-none">
                <Lock size={15} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-10 py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Confirm password (Inscription only) */}
          {authMode === 'register' && (
            <div className="space-y-1 text-left">
              <label className="block text-xs font-medium text-slate-300">
                Confirmer le mot de passe
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3 text-slate-400 pointer-events-none">
                  <CheckCircle2 size={15} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
                />
              </div>
            </div>
          )}

          {/* Submit Button in signature HolPdf Red */}
          <button
            type="submit"
            disabled={isLoading || googleLoading}
            className="w-full mt-2 py-2.5 px-4 rounded-xl text-white text-xs font-bold tracking-wide flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-all cursor-pointer disabled:opacity-70 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 shadow-[0_4px_16px_rgba(239,68,68,0.35)]"
          >
            {isLoading ? (
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>
                  {authMode === 'register' ? "Créer mon compte HolPdf" : 'Se connecter'}
                </span>
                <ArrowRight size={14} />
              </>
            )}
          </button>

          {/* Mode Switch text link */}
          <div className="pt-1.5 text-center">
            {authMode === 'login' ? (
              <p className="text-xs text-slate-400">
                Pas encore de compte ?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('register');
                    setErrorMessage(null);
                    setInfoMessage(null);
                    setIsEmailUnconfirmedError(false);
                    setResendStatus(null);
                  }}
                  className="text-red-400 hover:text-red-300 font-semibold underline underline-offset-2 transition-colors cursor-pointer"
                >
                  S'inscrire
                </button>
              </p>
            ) : (
              <p className="text-xs text-slate-400">
                Vous avez déjà un compte ?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setErrorMessage(null);
                    setInfoMessage(null);
                    setIsEmailUnconfirmedError(false);
                    setResendStatus(null);
                  }}
                  className="text-red-400 hover:text-red-300 font-semibold underline underline-offset-2 transition-colors cursor-pointer"
                >
                  Se connecter
                </button>
              </p>
            )}
          </div>
        </form>

        {/* Divider */}
        <div className="relative flex items-center justify-center my-3">
          <div className="w-full border-t border-slate-800" />
          <span className="absolute px-2.5 bg-[#040612] text-[10px] text-slate-500 font-medium">
            ou
          </span>
        </div>

        {/* Quick Google Sign In */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googleLoading || isLoading}
          className="w-full py-2 px-3 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700/80 text-slate-200 text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          {googleLoading ? (
            <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.97 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.25 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Continuer avec Google</span>
            </>
          )}
        </button>
      </div>

      {/* Footer info in Red/Slate tone */}
      <div className="text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5 z-10 pt-2">
        <ShieldCheck size={13} className="text-red-500" />
        <span>Authentification chiffrée & sécurisée par Supabase</span>
      </div>

      {/* Supabase Configuration Modal in Red Ambiance - Only when not configured by env */}
      {showConfigModal && !configFromEnv && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowConfigModal(false);
          }}
        >
          <div className="relative w-full max-w-md bg-gradient-to-b from-[#0f172a] to-[#040612] border border-red-500/30 rounded-2xl p-5 shadow-2xl text-left">
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center">
                  <Database size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Paramètres Supabase</h3>
                  <p className="text-[10px] text-slate-400">
                    Connectez votre projet Supabase (URL & clé anon)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-white flex items-center justify-center text-lg hover:bg-slate-800 cursor-pointer"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSaveSupabaseConfig} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                  <Globe size={13} className="text-red-400" />
                  <span>Supabase Project URL</span>
                </label>
                <input
                  type="url"
                  placeholder="https://votre-projet.supabase.co"
                  value={supabaseUrlInput}
                  onChange={(e) => setSupabaseUrlInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:border-red-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                  <Key size={13} className="text-red-400" />
                  <span>Supabase Anon Public Key</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={supabaseAnonKeyInput}
                  onChange={(e) => setSupabaseAnonKeyInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:border-red-500 font-mono resize-none"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
                💡 Vous pouvez également définir ces valeurs dans les variables d'environnement <code className="text-red-400 font-mono">VITE_SUPABASE_URL</code> et <code className="text-red-400 font-mono">VITE_SUPABASE_ANON_KEY</code>.
              </div>

              {configSavedToast && (
                <div className="p-2 rounded-lg bg-red-950/80 border border-red-500/50 text-red-300 text-xs text-center flex items-center justify-center gap-1.5">
                  <Check size={14} />
                  <span>Configuration Supabase enregistrée !</span>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium cursor-pointer"
                >
                  Fermer
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold cursor-pointer shadow-md"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
