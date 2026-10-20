import React, { useState } from 'react';
import { Clock, BookOpen, Headphones, ChevronRight, Play, Calendar, RotateCcw, Trash2, Check, Sparkles } from 'lucide-react';
import { Navigation } from '../components/Navigation';
import { DocumentItem, AppScreen, UserProfile } from '../types';

interface HistoryScreenProps {
  documents: DocumentItem[];
  userProfile?: UserProfile;
  onSelectDocument: (doc: DocumentItem) => void;
  onOpenAudio: (doc: DocumentItem) => void;
  onNavigate: (screen: AppScreen) => void;
  onOpenUpload: () => void;
  onResetReadingMinutes?: () => void;
  onClearHistory?: () => void;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({
  documents,
  userProfile,
  onSelectDocument,
  onOpenAudio,
  onNavigate,
  onOpenUpload,
  onResetReadingMinutes,
  onClearHistory,
}) => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  const totalMinutes = userProfile?.stats?.totalReadingMinutes || 0;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const timeDisplay =
    totalMinutes === 0
      ? '0 min'
      : hours > 0
      ? `${hours} h ${minutes > 0 ? `${minutes} min` : ''}`
      : `${minutes} min`;

  const totalPagesRead = documents.reduce((acc, d) => acc + (d.progressPage || 0), 0);

  const handleResetTimeCounter = () => {
    if (onResetReadingMinutes) {
      onResetReadingMinutes();
    }
    setShowConfirmReset(false);
    setToastMessage('Compteur de temps de lecture réinitialisé à 0 min');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleClearHistoryList = () => {
    if (onClearHistory) {
      onClearHistory();
    }
    setShowConfirmClear(false);
    setToastMessage("Historique d'activité vidé avec succès");
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-between bg-slate-50 dark:bg-[#040612] text-slate-900 dark:text-white overflow-hidden select-none transition-colors duration-200">
      {/* Toast notification */}
      {toastMessage && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-50 bg-purple-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 animate-fadeIn border border-purple-400/40">
          <Check size={14} className="text-emerald-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="px-4 py-2.5 flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 bg-white/95 dark:bg-[#080d1a]/95 backdrop-blur-md z-20 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md text-purple-600 dark:text-purple-400">
            <Clock size={18} />
          </div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Historique d'activité</h2>
        </div>

        {/* Global Reset / Clean actions */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowConfirmReset(true)}
            title="Nettoyer le compteur de temps de lecture"
            className="px-2.5 py-1 rounded-lg text-xs font-medium text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-950/60 border border-purple-200 dark:border-purple-800/50 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw size={13} />
            <span className="hidden sm:inline">Nettoyer compteur</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 no-scrollbar z-10">
        <div className="max-w-3xl mx-auto space-y-4">
          {/* Confirmation Modals / Banners */}
          {showConfirmReset && (
            <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/80 border border-purple-200 dark:border-purple-800 text-xs space-y-2 animate-fadeIn">
              <div className="font-semibold text-purple-950 dark:text-purple-200 flex items-center gap-1.5">
                <RotateCcw size={14} className="text-purple-600 dark:text-purple-400" />
                <span>Confirmer la réinitialisation du compteur ?</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                Le compteur de temps d'écoute sera remis à 0 min.
              </p>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowConfirmReset(false)}
                  className="px-2.5 py-1 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleResetTimeCounter}
                  className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold flex items-center gap-1"
                >
                  <Check size={13} />
                  <span>Réinitialiser</span>
                </button>
              </div>
            </div>
          )}

          {showConfirmClear && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 text-xs space-y-2 animate-fadeIn">
              <div className="font-semibold text-rose-950 dark:text-rose-200 flex items-center gap-1.5">
                <Trash2 size={14} className="text-rose-600 dark:text-rose-400" />
                <span>Effacer tout l'historique de lecture ?</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                La liste des lectures récentes et les progressions de session seront remises à zéro.
              </p>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowConfirmClear(false)}
                  className="px-2.5 py-1 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleClearHistoryList}
                  className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold flex items-center gap-1"
                >
                  <Trash2 size={13} />
                  <span>Effacer l'historique</span>
                </button>
              </div>
            </div>
          )}

          {/* Weekly Stats Summary Card */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-100/70 to-blue-100/70 dark:from-purple-950/40 dark:to-blue-950/40 border border-purple-200 dark:border-purple-800/40 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600/20 dark:bg-purple-600/30 text-purple-700 dark:text-purple-300 flex items-center justify-center border border-purple-300 dark:border-purple-500/30 shadow-xs">
                <Headphones size={20} />
              </div>
              <div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">Temps d'écoute cette semaine</div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white">{timeDisplay}</span>
                  {totalMinutes > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowConfirmReset(true)}
                      title="Nettoyer le compteur de temps"
                      className="p-1 rounded-md text-slate-400 hover:text-purple-600 dark:hover:text-purple-300 transition-colors"
                    >
                      <RotateCcw size={12} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-[10px] text-slate-500 dark:text-slate-400">Pages lues</div>
                <div className="text-sm font-extrabold text-cyan-600 dark:text-cyan-300">{totalPagesRead} p.</div>
              </div>
              <button
                type="button"
                onClick={() => setShowConfirmReset(true)}
                className="p-1.5 rounded-lg bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-2xs transition-colors cursor-pointer"
                title="Nettoyer le compteur"
              >
                <RotateCcw size={14} />
              </button>
            </div>
          </div>

          {/* History timeline list */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Lectures récentes
              </span>
              {documents.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowConfirmClear(true)}
                  className="text-[11px] text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 flex items-center gap-1 transition-colors"
                >
                  <Trash2 size={12} />
                  <span>Effacer l'historique</span>
                </button>
              )}
            </div>

            {documents.length === 0 ? (
              <div className="text-center py-10 px-4 rounded-2xl bg-white dark:bg-[#0e1322] border border-slate-200 dark:border-slate-800/80 shadow-xs">
                <Clock size={28} className="mx-auto text-slate-400 dark:text-slate-500 mb-2 opacity-60" />
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Aucune lecture récente
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                  Vos livres et documents consultés apparaîtront ici avec votre progression.
                </p>
                <button
                  type="button"
                  onClick={onOpenUpload}
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium shadow-xs cursor-pointer"
                >
                  <Sparkles size={13} />
                  <span>Commencer une lecture</span>
                </button>
              </div>
            ) : (
              documents.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => onSelectDocument(doc)}
                  className="p-3 rounded-xl bg-white dark:bg-[#0e1322] border border-slate-200 dark:border-slate-800/80 hover:border-purple-400 dark:hover:border-slate-700 transition-all cursor-pointer flex items-center justify-between shadow-xs"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 text-slate-600 dark:text-slate-300">
                      <BookOpen size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {doc.title}
                      </h4>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        <Calendar size={11} />
                        <span>Dernière session : {doc.lastRead}</span>
                        <span>•</span>
                        <span className="text-purple-600 dark:text-purple-300 font-medium">Page {doc.progressPage}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onOpenAudio(doc)}
                      className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 hover:text-purple-900 dark:hover:text-white border border-purple-200 dark:border-purple-800/40"
                      title="Reprendre l'écoute audio"
                    >
                      <Play size={13} fill="currentColor" />
                    </button>
                    <ChevronRight size={16} className="text-slate-400 dark:text-slate-500" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <Navigation
        currentScreen="history"
        onNavigate={onNavigate}
        onOpenUpload={onOpenUpload}
      />
    </div>
  );
};
