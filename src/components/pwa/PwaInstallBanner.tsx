import React, { useState } from 'react';
import { Download, Smartphone, X, Check, Share } from 'lucide-react';
import { usePwaInstall } from '../../hooks/usePwaInstall';

interface PwaInstallBannerProps {
  className?: string;
}

export const PwaInstallBanner: React.FC<PwaInstallBannerProps> = ({ className = '' }) => {
  const { isInstallable, isInstalled, isIos, promptInstall } = usePwaInstall();
  const [isDismissed, setIsDismissed] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  // If already running standalone or dismissed, hide
  if (isInstalled || isDismissed) {
    return null;
  }

  // Handle click
  const handleInstallClick = async () => {
    if (isIos) {
      setShowIosGuide(true);
      return;
    }
    const installed = await promptInstall();
    if (!installed) {
      // Fallback: Show guide or notice
      setShowIosGuide(true);
    }
  };

  return (
    <>
      <div
        className={`p-3 rounded-2xl bg-gradient-to-r from-purple-900/60 via-indigo-900/50 to-[#0c142b] border border-purple-500/30 text-white shadow-lg flex items-center justify-between gap-3 animate-fadeIn select-none ${className}`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {/* App Icon mini */}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white flex-shrink-0 shadow-md">
            <Smartphone size={20} />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs font-bold text-white truncate">Installer HolPDF</h4>
              <span className="px-1.5 py-0.2 rounded-full text-[8px] font-bold bg-purple-500/30 text-purple-200">
                PWA
              </span>
            </div>
            <p className="text-[10px] text-slate-300 truncate mt-0.5">
              Lecture hors-ligne & accès plein écran
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            type="button"
            onClick={handleInstallClick}
            className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Download size={13} />
            <span>Installer</span>
          </button>

          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            aria-label="Fermer la bannière"
            className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* iOS Safari / Manual Install Guide Modal */}
      {showIosGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowIosGuide(false);
          }}
        >
          <div className="w-full max-w-sm rounded-2xl bg-[#0d1428] border border-purple-800/60 p-5 text-xs text-white space-y-3 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-bold text-white text-sm">Ajouter à l'écran d'accueil</h3>
              <button
                onClick={() => setShowIosGuide(false)}
                className="text-slate-400 hover:text-white text-base"
              >
                ✕
              </button>
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed">
              Pour installer HolPDF sur votre téléphone sans passer par un magasin d'applications :
            </p>

            <ol className="space-y-2 text-[11px] text-slate-300 pl-1">
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-purple-900 text-purple-200 font-bold flex items-center justify-center text-[10px] flex-shrink-0">
                  1
                </span>
                <span>
                  Appuyez sur le bouton <strong>Partager</strong> <Share size={12} className="inline ml-1 text-purple-400" /> dans votre navigateur (Safari ou Chrome).
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-purple-900 text-purple-200 font-bold flex items-center justify-center text-[10px] flex-shrink-0">
                  2
                </span>
                <span>
                  Faites défiler vers le bas et sélectionnez <strong>« Sur l'écran d'accueil »</strong>.
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-purple-900 text-purple-200 font-bold flex items-center justify-center text-[10px] flex-shrink-0">
                  3
                </span>
                <span>
                  Appuyez sur <strong>Ajouter</strong> en haut à droite.
                </span>
              </li>
            </ol>

            <button
              type="button"
              onClick={() => setShowIosGuide(false)}
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 font-bold text-white text-xs cursor-pointer shadow-md mt-2"
            >
              Compris !
            </button>
          </div>
        </div>
      )}
    </>
  );
};
