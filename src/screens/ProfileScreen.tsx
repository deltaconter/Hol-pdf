import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  Moon,
  Sun,
  Volume2,
  Bell,
  HardDrive,
  Globe,
  HelpCircle,
  FileText,
  Shield,
  Info,
  ChevronRight,
  LogOut,
  User,
  Edit3,
  Check,
  X,
  Crown,
  Headphones,
  Sparkles,
  Database,
  Smartphone,
  Download,
} from 'lucide-react';
import { Navigation } from '../components/Navigation';
import { PremiumModal } from '../components/PremiumModal';
import { HelpSupportView } from '../components/about/HelpSupportView';
import { TermsOfServiceView } from '../components/about/TermsOfServiceView';
import { PrivacyPolicyView } from '../components/about/PrivacyPolicyView';
import { AboutHolPdfView } from '../components/about/AboutHolPdfView';
import { usePwaInstall } from '../hooks/usePwaInstall';
import { UserProfile, VoiceOption, AppScreen } from '../types';
import { logoutFromSupabase, isSupabaseConfigured } from '../utils/supabaseClient';

interface ProfileScreenProps {
  userProfile: UserProfile;
  currentVoice: VoiceOption;
  onNavigate: (screen: AppScreen) => void;
  onOpenUpload: () => void;
  onOpenVoiceSelector: () => void;
  onUpdateUserProfile: (updates: Partial<UserProfile>) => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  userProfile,
  currentVoice,
  onNavigate,
  onOpenUpload,
  onOpenVoiceSelector,
  onUpdateUserProfile,
}) => {
  const [isDarkMode, setIsDarkMode] = useState(userProfile.darkMode);
  const [notificationsOn, setNotificationsOn] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(userProfile.name || '');
  const [editEmail, setEditEmail] = useState(userProfile.email || '');
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [activeSubView, setActiveSubView] = useState<'help' | 'terms' | 'privacy' | 'about' | null>(null);
  const { isInstalled, promptInstall } = usePwaInstall();

  useEffect(() => {
    setIsDarkMode(userProfile.darkMode);
  }, [userProfile.darkMode]);

  useEffect(() => {
    setEditName(userProfile.name || '');
    setEditEmail(userProfile.email || '');
  }, [userProfile.name, userProfile.email]);

  const handleSaveProfile = () => {
    onUpdateUserProfile({
      name: editName.trim() || 'Utilisateur',
      email: editEmail.trim(),
    });
    setIsEditing(false);
  };

  const handleClearProfileInfo = () => {
    setEditName('Utilisateur');
    setEditEmail('');
    onUpdateUserProfile({
      name: 'Utilisateur',
      email: '',
      avatarUrl: '',
    });
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditName(userProfile.name || '');
    setEditEmail(userProfile.email || '');
    setIsEditing(false);
  };

  const handleLogout = async () => {
    await logoutFromSupabase();
    onUpdateUserProfile({
      name: 'Utilisateur',
      email: '',
      avatarUrl: '',
      isPremium: false,
    });
    onNavigate('login');
  };

  const storagePercentage = Math.round(
    (userProfile.storageUsedMb / (userProfile.storageTotalMb || 1024)) * 100
  );

  const setMode = (darkMode: boolean) => {
    setIsDarkMode(darkMode);
    onUpdateUserProfile({ darkMode });
  };

  // Render dedicated sub-view if active
  if (activeSubView === 'help') {
    return <HelpSupportView onBack={() => setActiveSubView(null)} />;
  }
  if (activeSubView === 'terms') {
    return <TermsOfServiceView onBack={() => setActiveSubView(null)} />;
  }
  if (activeSubView === 'privacy') {
    return <PrivacyPolicyView onBack={() => setActiveSubView(null)} />;
  }
  if (activeSubView === 'about') {
    return (
      <AboutHolPdfView
        onBack={() => setActiveSubView(null)}
        onOpenHelp={() => setActiveSubView('help')}
        onOpenTerms={() => setActiveSubView('terms')}
        onOpenPrivacy={() => setActiveSubView('privacy')}
      />
    );
  }

  return (
    <div className="relative w-full h-full flex flex-col justify-between bg-slate-50 dark:bg-[#040612] text-slate-900 dark:text-white overflow-hidden select-none transition-colors duration-200">
      {/* Header */}
      <div className="px-4 py-2.5 flex items-center gap-3 border-b border-slate-200 dark:border-slate-800/80 bg-white/95 dark:bg-[#080d1a]/95 backdrop-blur-md z-20 shadow-xs">
        <button
          onClick={() => onNavigate('home')}
          aria-label="Retour à l'accueil"
          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Paramètres</h2>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 no-scrollbar z-10">
        <div className="max-w-2xl mx-auto space-y-4">
        {/* User Profile Card */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0e1322] border border-slate-200/80 dark:border-slate-800 shadow-sm transition-all">
          {!isEditing ? (
            <div className="flex items-center gap-3.5">
              <div className="relative w-14 h-14 rounded-full p-[2px] bg-gradient-to-tr from-cyan-400 via-indigo-400 to-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.3)] flex-shrink-0 flex items-center justify-center overflow-hidden">
                {userProfile.avatarUrl ? (
                  <img
                    src={userProfile.avatarUrl}
                    alt={userProfile.name || 'Profil'}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-purple-600 dark:text-purple-300 font-bold text-lg">
                    {userProfile.name && userProfile.name !== 'Utilisateur' ? (
                      userProfile.name.charAt(0).toUpperCase()
                    ) : (
                      <User size={22} />
                    )}
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight truncate">
                    {userProfile.name || 'Utilisateur'}
                  </h3>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="p-1 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors rounded-md"
                      title="Modifier le profil"
                      aria-label="Modifier le profil"
                    >
                      <Edit3 size={15} />
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {userProfile.email || 'Aucune adresse e-mail'}
                </p>
                {userProfile.isPremium ? (
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40">
                    Membre Premium
                  </span>
                ) : (
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400">
                    Compte standard
                  </span>
                )}
                {isSupabaseConfigured() && (
                  <span className="inline-flex items-center gap-1 mt-1 ml-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
                    <Database size={10} />
                    Supabase
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-xs font-semibold text-slate-900 dark:text-white flex items-center justify-between">
                <span>Modifier mon profil</span>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="text-slate-400 hover:text-slate-200 p-0.5"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="space-y-2">
                <div>
                  <label className="block text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    Nom
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Votre nom complet"
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    Adresse e-mail
                  </label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="votre.email@exemple.com"
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={handleClearProfileInfo}
                  className="text-[11px] text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                >
                  Effacer les coordonnées
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveProfile}
                    className="px-3 py-1.5 text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white rounded-lg flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <Check size={14} />
                    <span>Enregistrer</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section Abonnement & Quotas Studio HD */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-white via-slate-50 to-purple-50/40 dark:from-[#0e1322] dark:via-[#0f172a] dark:to-purple-950/20 border border-purple-200/80 dark:border-purple-800/40 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-400 to-purple-600 p-[1px] flex items-center justify-center shadow-xs">
                <div className="w-full h-full bg-white dark:bg-[#0e1322] rounded-xl flex items-center justify-center text-amber-500">
                  <Crown size={15} />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    {userProfile.isPremium ? 'HolPdf Premium' : 'Formule Standard'}
                  </h4>
                  {userProfile.isPremium ? (
                    <span className="px-1.5 py-0.2 rounded-md text-[9px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800/50">
                      Actif
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.2 rounded-md text-[9px] font-medium bg-slate-150 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      Gratuit
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  {userProfile.isPremium
                    ? 'Pack 20h Studio HD & Fonctions IA illimitées'
                    : 'Voix locales illimitées + 30 min d\'essai Studio HD'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowPremiumModal(true)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs ${
                userProfile.isPremium
                  ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                  : 'bg-gradient-to-r from-amber-500 via-purple-600 to-indigo-600 hover:opacity-95 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]'
              }`}
            >
              {userProfile.isPremium ? (
                <span>Gérer</span>
              ) : (
                <>
                  <Sparkles size={12} className="text-amber-300" />
                  <span>Passer Premium</span>
                </>
              )}
            </button>
          </div>

          {/* Studio HD Listening Gauge */}
          <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
                <Headphones size={14} className="text-purple-500 dark:text-purple-400" />
                <span>Écoute Voix Studio HD</span>
              </div>
              <span className="font-mono text-purple-600 dark:text-purple-300 font-semibold text-[11px]">
                {Math.max(0, userProfile.studioHdMinutesTotal - userProfile.studioHdMinutesUsed)} min restantes
                <span className="text-slate-400 font-normal"> / {userProfile.studioHdMinutesTotal} min</span>
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 via-purple-500 to-cyan-400 rounded-full transition-all"
                style={{
                  width: `${Math.min(
                    100,
                    Math.round((userProfile.studioHdMinutesUsed / (userProfile.studioHdMinutesTotal || 1)) * 100)
                  )}%`,
                }}
              />
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 pt-0.5">
              <span>Voix locales : <strong>100% illimitées</strong></span>
              {userProfile.billingCycleRenewsAt && (
                <span>Renouvellement : {userProfile.billingCycleRenewsAt}</span>
              )}
            </div>
          </div>
        </div>

        {/* Section Préférences */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">
            Préférences
          </span>

          <div className="rounded-2xl bg-white dark:bg-[#0e1322] border border-slate-200 dark:border-slate-800/80 divide-y divide-slate-100 dark:divide-slate-800/60 overflow-hidden text-xs shadow-xs">
            {/* Apparence: Mode jour ou sombre */}
            <div className="p-3 flex items-center justify-between transition-colors">
              <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-lg transition-colors ${
                  isDarkMode
                    ? 'bg-indigo-950/60 text-indigo-400'
                    : 'bg-amber-100 text-amber-600'
                }`}>
                  {isDarkMode ? <Moon size={16} /> : <Sun size={16} />}
                </div>
                <div>
                  <div className="font-medium text-slate-900 dark:text-slate-200">Apparence</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">
                    {isDarkMode ? 'Mode sombre actif' : 'Mode jour actif'}
                  </div>
                </div>
              </div>

              {/* Action Selector: ☀️ / 🌙 */}
              <div className="inline-flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setMode(false)}
                  className={`flex items-center justify-center w-7 h-7 rounded-lg transition-all cursor-pointer ${
                    !isDarkMode
                      ? 'bg-white text-amber-600 shadow-xs'
                      : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                  title="Activer le mode jour"
                  aria-label="Activer le mode jour"
                >
                  <Sun size={14} className={!isDarkMode ? 'text-amber-500 fill-amber-500' : ''} />
                </button>
                <button
                  type="button"
                  onClick={() => setMode(true)}
                  className={`flex items-center justify-center w-7 h-7 rounded-lg transition-all cursor-pointer ${
                    isDarkMode
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                  title="Activer le mode sombre"
                  aria-label="Activer le mode sombre"
                >
                  <Moon size={14} className={isDarkMode ? 'fill-white' : ''} />
                </button>
              </div>
            </div>

            {/* Voix et lecture */}
            <div
              onClick={onOpenVoiceSelector}
              className="p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                  <Volume2 size={16} />
                </div>
                <div>
                  <div className="font-medium text-slate-900 dark:text-slate-200">Voix et lecture</div>
                  <div className="text-[10px] text-purple-600 dark:text-purple-300 font-medium">
                    {currentVoice.name}
                  </div>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-400 dark:text-slate-500" />
            </div>

            {/* Notifications */}
            <div
              onClick={() => setNotificationsOn(!notificationsOn)}
              className="p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-cyan-100 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400">
                  <Bell size={16} />
                </div>
                <div>
                  <div className="font-medium text-slate-900 dark:text-slate-200">Notifications</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">
                    {notificationsOn ? 'Activées' : 'Désactivées'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${notificationsOn ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                <ChevronRight size={16} className="text-slate-400 dark:text-slate-500" />
              </div>
            </div>

            {/* Stockage */}
            <div className="p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                    <HardDrive size={16} />
                  </div>
                  <div>
                    <div className="font-medium text-slate-900 dark:text-slate-200">Stockage local</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">
                      Espace utilisé par les documents : {userProfile.storageUsedMb} Mo
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-purple-600 dark:text-purple-300 font-semibold">
                  {storagePercentage}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 rounded-full shadow-xs"
                  style={{ width: `${storagePercentage}%` }}
                ></div>
              </div>
            </div>

            {/* Langue */}
            <div className="p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                  <Globe size={16} />
                </div>
                <div>
                  <div className="font-medium text-slate-900 dark:text-slate-200">Langue</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">Français</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-base">🇫🇷</span>
                <ChevronRight size={16} className="text-slate-400 dark:text-slate-500" />
              </div>
            </div>

            {/* PWA Installation Option */}
            <div
              onClick={() => {
                if (!isInstalled) {
                  promptInstall();
                }
              }}
              className="p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                  <Smartphone size={16} />
                </div>
                <div>
                  <div className="font-medium text-slate-900 dark:text-slate-200">
                    Application mobile & bureau
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">
                    {isInstalled ? 'Déjà installée sur cet appareil' : 'Installer HolPDF (PWA hors-ligne)'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {isInstalled ? (
                  <span className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1">
                    <Check size={12} /> Active
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      promptInstall();
                    }}
                    className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-[10px] flex items-center gap-1 shadow-xs cursor-pointer"
                  >
                    <Download size={11} />
                    <span>Installer</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Section À propos */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">
            À propos
          </span>

          <div className="rounded-2xl bg-white dark:bg-[#0e1322] border border-slate-200 dark:border-slate-800/80 divide-y divide-slate-100 dark:divide-slate-800/60 overflow-hidden text-xs shadow-xs">
            <div
              onClick={() => setActiveSubView('help')}
              className="p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <HelpCircle size={16} className="text-purple-600 dark:text-purple-400" />
                <span className="font-medium text-slate-800 dark:text-slate-200">Aide & support</span>
              </div>
              <ChevronRight size={16} className="text-slate-400 dark:text-slate-500" />
            </div>

            <div
              onClick={() => setActiveSubView('terms')}
              className="p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <FileText size={16} className="text-purple-600 dark:text-purple-400" />
                <span className="font-medium text-slate-800 dark:text-slate-200">Conditions d'utilisation</span>
              </div>
              <ChevronRight size={16} className="text-slate-400 dark:text-slate-500" />
            </div>

            <div
              onClick={() => setActiveSubView('privacy')}
              className="p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <Shield size={16} className="text-emerald-600 dark:text-emerald-400" />
                <span className="font-medium text-slate-800 dark:text-slate-200">Politique de confidentialité</span>
              </div>
              <ChevronRight size={16} className="text-slate-400 dark:text-slate-500" />
            </div>

            <div
              onClick={() => setActiveSubView('about')}
              className="p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <Info size={16} className="text-purple-600 dark:text-purple-400" />
                <span className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  À propos de
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-[11px]">
                    <span className="text-white font-bold">Hol</span>
                    <span className="text-red-500 font-bold">Pdf</span>
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-purple-600 dark:text-purple-400 font-mono">v1.0.0</span>
                <ChevronRight size={16} className="text-slate-400 dark:text-slate-500" />
              </div>
            </div>
          </div>

          {/* Bouton Déconnexion */}
          <button
            type="button"
            onClick={handleLogout}
            className="w-full mt-3 py-2.5 px-4 rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/20 text-red-600 dark:text-red-400 hover:bg-red-100/60 dark:hover:bg-red-950/40 font-medium text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <LogOut size={14} />
            <span>Se déconnecter</span>
          </button>
        </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <Navigation
        currentScreen="profile"
        onNavigate={onNavigate}
        onOpenUpload={onOpenUpload}
      />

      {/* HolPdf Premium Modal */}
      <PremiumModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        userProfile={userProfile}
        onUpdateUserProfile={onUpdateUserProfile}
      />
    </div>
  );
};
