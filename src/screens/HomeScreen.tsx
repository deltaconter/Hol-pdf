import React, { useState } from 'react';
import { Bell, Search, MoreVertical, ChevronRight, FileText, Sparkles, Mic, Play, Heart, Trash2, Share2, Zap, UploadCloud, User, MessageSquare } from 'lucide-react';
import { HolPdfLogo } from '../components/HolPdfLogo';
import { Navigation } from '../components/Navigation';
import { PwaInstallBanner } from '../components/pwa/PwaInstallBanner';
import { AdSenseBanner } from '../components/ads/AdSenseBanner';
import { DocumentItem, AppScreen, UserProfile } from '../types';

interface HomeScreenProps {
  documents: DocumentItem[];
  userProfile: UserProfile;
  onSelectDocument: (doc: DocumentItem) => void;
  onOpenAudio: (doc: DocumentItem) => void;
  onOpenAskTheBook?: (doc: DocumentItem) => void;
  onNavigate: (screen: AppScreen) => void;
  onOpenUpload: () => void;
  onToggleFavorite: (id: string) => void;
  onDeleteDocument: (id: string) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  documents,
  userProfile,
  onSelectDocument,
  onOpenAudio,
  onOpenAskTheBook,
  onNavigate,
  onOpenUpload,
  onToggleFavorite,
  onDeleteDocument,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMenuDocId, setActiveMenuDocId] = useState<string | null>(null);
  const [showNotificationToast, setShowNotificationToast] = useState(false);

  const filteredDocs = documents.filter(
    (doc) =>
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.subtitle && doc.subtitle.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getDocColorStyle = (color: DocumentItem['color']) => {
    switch (color) {
      case 'red':
        return {
          bg: 'bg-rose-500/20 text-rose-400 border border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.2)]',
          badge: 'bg-rose-500',
        };
      case 'blue':
        return {
          bg: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.2)]',
          badge: 'bg-cyan-500',
        };
      case 'purple':
        return {
          bg: 'bg-purple-500/20 text-purple-400 border border-purple-500/30 shadow-[0_0_12px_rgba(168,85,247,0.2)]',
          badge: 'bg-purple-500',
        };
      case 'green':
        return {
          bg: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.2)]',
          badge: 'bg-emerald-500',
        };
      case 'amber':
      default:
        return {
          bg: 'bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.2)]',
          badge: 'bg-amber-500',
        };
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-between bg-slate-50 dark:bg-[#040612] text-slate-900 dark:text-white overflow-hidden transition-colors duration-200">
      {/* Background radial glows in dark mode */}
      <div className="absolute top-0 right-[-10%] w-[260px] h-[260px] bg-purple-700/10 dark:bg-purple-700/15 rounded-full blur-[80px] pointer-events-none"></div>
      <div className="absolute top-[30%] left-[-15%] w-[240px] h-[240px] bg-blue-700/10 dark:bg-blue-700/15 rounded-full blur-[70px] pointer-events-none"></div>

      {/* Scrollable Container */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-6 space-y-5 no-scrollbar z-10">
        <div className="max-w-4xl mx-auto space-y-5">
          {/* Header with Logo, Notifications & User Avatar */}
          <div className="flex items-center justify-between pt-1">
            <HolPdfLogo size="md" showSubtitle={true} />

            <div className="flex items-center gap-3">
              {/* Notification Bell */}
              <button
                onClick={() => setShowNotificationToast(!showNotificationToast)}
                className="relative p-2 rounded-full bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors shadow-xs"
                aria-label="Notifications"
              >
                <Bell size={18} />
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
              </button>

              {/* Profile Avatar */}
              <button
                onClick={() => onNavigate('profile')}
                className="relative w-9 h-9 rounded-full p-[1.5px] bg-gradient-to-tr from-purple-500 to-cyan-400 shadow-[0_0_10px_rgba(168,85,247,0.4)] active:scale-95 transition-transform flex items-center justify-center overflow-hidden"
                aria-label="Profil utilisateur"
              >
                {userProfile.avatarUrl ? (
                  <img
                    src={userProfile.avatarUrl}
                    alt={userProfile.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-purple-600 dark:text-purple-300 text-xs font-bold">
                    {userProfile.name && userProfile.name !== 'Utilisateur' && userProfile.name !== 'Invité' ? (
                      userProfile.name.charAt(0).toUpperCase()
                    ) : (
                      <User size={15} />
                    )}
                  </div>
                )}
              </button>
            </div>
          </div>

        {/* Notification alert toast */}
        {showNotificationToast && (
          <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/90 border border-indigo-200 dark:border-indigo-700/60 text-xs flex items-center justify-between animate-fadeIn text-indigo-950 dark:text-indigo-200 shadow-xs">
            <span>
              🎙️ La voix de synthèse <strong>Lucie</strong> a été mise à jour en haute fidélité.
            </span>
            <button
              onClick={() => setShowNotificationToast(false)}
              className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white text-[11px] ml-2"
            >
              Fermer
            </button>
          </div>
        )}

        {/* PWA Install In-App Banner */}
        <PwaInstallBanner className="mb-1" />

        {/* Search Bar Input */}
        <div className="relative flex items-center">
          <div className="absolute left-3.5 text-slate-400">
            <Search size={16} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => {
              // Can navigate to search if user clicks
            }}
            placeholder="Rechercher un fichier, un mot-clé..."
            className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white dark:bg-[#0e1322] border border-slate-200 dark:border-slate-800/80 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/40 transition-all shadow-xs"
          />
          <button
            onClick={() => onNavigate('search')}
            aria-label="Recherche vocale"
            className="absolute right-3 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
          >
            <Mic size={15} />
          </button>
        </div>

        {/* IA Conversationnelle Ask the Book Quick Banner */}
        {documents.length > 0 && (
          <div
            onClick={() => {
              if (onOpenAskTheBook) {
                onOpenAskTheBook(documents[0]);
              } else {
                onSelectDocument(documents[0]);
              }
            }}
            className="p-3 rounded-2xl bg-gradient-to-r from-purple-950/80 via-slate-900 to-[#0e1322] border border-purple-500/30 hover:border-purple-400/60 transition-all cursor-pointer shadow-md flex items-center justify-between group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-[0_0_15px_rgba(168,85,247,0.4)] group-hover:scale-105 transition-transform flex-shrink-0">
                <MessageSquare size={19} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-bold text-white tracking-tight flex items-center gap-1">
                    <span>Ask the Book</span>
                    <Sparkles size={11} className="text-amber-300 animate-pulse" />
                  </h3>
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                    IA Illimitée
                  </span>
                </div>
                <p className="text-[10px] text-slate-300 truncate mt-0.5">
                  Posez n'importe quelle question avec citations et pages sourcées
                </p>
              </div>
            </div>
            <div className="p-1.5 rounded-lg bg-purple-900/40 text-purple-300 group-hover:text-white group-hover:bg-purple-800/60 transition-colors ml-2 flex-shrink-0">
              <ChevronRight size={15} />
            </div>
          </div>
        )}

        {/* Section Mes Documents */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">Mes documents</h2>
            <button
              onClick={() => onNavigate('library')}
              className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium flex items-center gap-0.5"
            >
              <span>Tout voir</span>
              <ChevronRight size={13} />
            </button>
          </div>

          {/* List of Documents */}
          <div className="space-y-2.5">
            {filteredDocs.length === 0 ? (
              searchQuery ? (
                <div className="text-center py-8 text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900/30 rounded-xl border border-slate-200 dark:border-slate-800">
                  Aucun document correspondant à "{searchQuery}".
                </div>
              ) : (
                <div
                  onClick={onOpenUpload}
                  className="flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed border-purple-300 dark:border-purple-500/40 hover:border-purple-500 bg-white dark:bg-[#0d1222]/60 hover:bg-purple-50/40 dark:hover:bg-purple-950/20 transition-all cursor-pointer text-center group shadow-xs"
                >
                  <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-900/40 border border-purple-200 dark:border-purple-500/40 flex items-center justify-center text-purple-600 dark:text-purple-300 group-hover:scale-110 transition-transform mb-3 shadow-xs">
                    <UploadCloud size={24} />
                  </div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors">
                    Aucun document pour le moment
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-xs leading-relaxed">
                    Importez votre premier fichier PDF, ePub ou texte pour commencer la lecture et l'écoute audio.
                  </p>
                  <span className="mt-3.5 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-xs">
                    <UploadCloud size={14} />
                    <span>Importer un document</span>
                  </span>
                </div>
              )
            ) : (
              filteredDocs.map((doc) => {
                const style = getDocColorStyle(doc.color);
                return (
                  <div
                    key={doc.id}
                    className="relative group flex items-center justify-between p-3 rounded-xl bg-white dark:bg-[#0d1220]/80 hover:bg-slate-100/80 dark:hover:bg-[#13192c] border border-slate-200/80 dark:border-slate-800/80 transition-all cursor-pointer shadow-xs"
                    onClick={() => onSelectDocument(doc)}
                  >
                    {/* Left Icon + Details */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* PDF Thumbnail Badge or Real Cover */}
                      <div
                        className={`w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0 ${style.bg} border border-slate-200/80 dark:border-slate-800 shadow-xs`}
                      >
                        {doc.coverImageUrl ? (
                          <img
                            src={doc.coverImageUrl}
                            alt={doc.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <FileText size={18} strokeWidth={2.2} />
                        )}
                      </div>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors">
                          {doc.title}
                        </h3>
                        {doc.subtitle && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {doc.subtitle}
                          </p>
                        )}
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                          <span>PDF • {doc.fileSize}</span>
                          <span>•</span>
                          <span>Dernière lecture : {doc.lastRead}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right Controls: Quick Audio Play & 3-Dots Menu */}
                    <div
                      className="flex items-center gap-1.5 ml-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => onOpenAudio(doc)}
                        aria-label="Écouter ce document"
                        title="Écouter ce document"
                        className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/80 text-purple-700 dark:text-purple-300 hover:text-purple-900 dark:hover:text-white border border-purple-200 dark:border-purple-800/50 transition-colors"
                      >
                        <Play size={13} fill="currentColor" />
                      </button>

                      <div className="relative">
                        <button
                          onClick={() =>
                            setActiveMenuDocId(activeMenuDocId === doc.id ? null : doc.id)
                          }
                          aria-label="Options du document"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
                        >
                          <MoreVertical size={16} />
                        </button>

                        {/* Dropdown Menu */}
                        {activeMenuDocId === doc.id && (
                          <>
                            <div
                              className="fixed inset-0 z-30"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuDocId(null);
                              }}
                            />
                            <div className="absolute right-0 top-8 w-40 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl py-1.5 z-40 text-xs text-slate-800 dark:text-slate-200">
                              <button
                                onClick={() => {
                                  onSelectDocument(doc);
                                  setActiveMenuDocId(null);
                                }}
                                className="w-full px-3 py-1.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                              >
                                <FileText size={13} />
                                <span>Lire le document</span>
                              </button>
                              <button
                                onClick={() => {
                                  if (onOpenAskTheBook) {
                                    onOpenAskTheBook(doc);
                                  } else {
                                    onSelectDocument(doc);
                                  }
                                  setActiveMenuDocId(null);
                                }}
                                className="w-full px-3 py-1.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 text-purple-600 dark:text-purple-300 font-medium"
                              >
                                <MessageSquare size={13} />
                                <span>Ask the Book (IA)</span>
                              </button>
                            <button
                              onClick={() => {
                                onOpenAudio(doc);
                                setActiveMenuDocId(null);
                              }}
                              className="w-full px-3 py-1.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 text-purple-600 dark:text-purple-300"
                            >
                              <Play size={13} />
                              <span>Lancer la lecture audio</span>
                            </button>
                            <button
                              onClick={() => {
                                onToggleFavorite(doc.id);
                                setActiveMenuDocId(null);
                              }}
                              className="w-full px-3 py-1.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                            >
                              <Heart
                                size={13}
                                className={doc.isFavorite ? 'text-rose-500 fill-rose-500' : ''}
                              />
                              <span>{doc.isFavorite ? 'Retirer des favoris' : 'Favori'}</span>
                            </button>
                            <button
                              onClick={() => {
                                if (navigator.share) {
                                  navigator.share({ title: doc.title, text: doc.summary });
                                }
                                setActiveMenuDocId(null);
                              }}
                              className="w-full px-3 py-1.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                            >
                              <Share2 size={13} />
                              <span>Partager</span>
                            </button>
                            <div className="border-t border-slate-100 dark:border-slate-800 my-1"></div>
                            <button
                              onClick={() => {
                                onDeleteDocument(doc.id);
                                setActiveMenuDocId(null);
                              }}
                              className="w-full px-3 py-1.5 text-left hover:bg-rose-50 dark:hover:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center gap-2"
                            >
                              <Trash2 size={13} />
                              <span>Supprimer</span>
                            </button>
                          </div>
                        </>
                      )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* AdSense Native Banner: Home Screen Bottom (automatically hidden for Premium) */}
          <AdSenseBanner
            slot="home-bottom"
            userProfile={userProfile}
            onOpenPremium={() => onNavigate('profile')}
          />
        </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <Navigation
        currentScreen="home"
        onNavigate={onNavigate}
        onOpenUpload={onOpenUpload}
      />
    </div>
  );
};
