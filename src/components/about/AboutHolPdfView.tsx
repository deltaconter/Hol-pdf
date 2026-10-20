import React from 'react';
import {
  ChevronLeft,
  Eye,
  Target,
  Landmark,
} from 'lucide-react';

interface AboutHolPdfViewProps {
  onBack: () => void;
  onOpenHelp?: () => void;
  onOpenTerms?: () => void;
  onOpenPrivacy?: () => void;
}

export const AboutHolPdfView: React.FC<AboutHolPdfViewProps> = ({ onBack }) => {
  return (
    <div className="relative w-full h-full flex flex-col justify-between bg-[#040612] text-white select-none overflow-hidden">
      {/* Top Header */}
      <div className="px-4 py-3 flex items-center gap-3 border-b border-slate-800/80 bg-[#060919]/95 backdrop-blur-md z-20">
        <button
          onClick={onBack}
          aria-label="Retour aux paramètres"
          className="p-1.5 -ml-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
        >
          <ChevronLeft size={22} />
        </button>
        <h2 className="text-base font-bold text-white">À propos de HolPDF</h2>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5 no-scrollbar text-xs">
        <div className="max-w-md mx-auto space-y-5">
          {/* Header Brand Banner */}
          <div className="flex items-center gap-3.5">
            {/* Stylized "P" Brand Icon with purple gradient */}
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-600 to-fuchsia-600 p-0.5 shadow-[0_4px_20px_rgba(147,51,234,0.35)] flex-shrink-0 flex items-center justify-center">
              <div className="w-full h-full rounded-[14px] bg-gradient-to-br from-indigo-500 to-purple-700 flex items-center justify-center text-white">
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-8 h-8 text-white drop-shadow-sm"
                >
                  <path d="M6 3h8a5 5 0 0 1 5 5c0 2.76-2.24 5-5 5H9v8H6V3zm3 3v4h5a2 2 0 0 0 2-2c0-1.1-.9-2-2-2H9z" />
                </svg>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-purple-400">HolPDF</h1>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-purple-950/80 text-purple-300 border border-purple-800/50">
                  v1.0.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Lire. Comprendre. Aller plus loin.
              </p>
            </div>
          </div>

          {/* Intro Paragraph */}
          <p className="text-[12px] text-slate-300 leading-relaxed">
            HolPDF est une plateforme de lecture numérique conçue pour offrir une expérience simple, moderne et agréable autour des documents PDF.
          </p>

          {/* Notre Vision */}
          <div className="flex items-start gap-3.5 pt-1">
            <div className="w-10 h-10 rounded-full bg-purple-950/90 border border-purple-800/50 flex items-center justify-center text-purple-300 flex-shrink-0 mt-0.5">
              <Eye size={18} />
            </div>
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-white">Notre vision</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Nous pensons qu'un document numérique ne devrait pas simplement être un fichier que l'on ouvre. Il devrait être une expérience de lecture.
              </p>
            </div>
          </div>

          {/* Notre Mission */}
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-full bg-purple-950/90 border border-purple-800/50 flex items-center justify-center text-purple-300 flex-shrink-0 mt-0.5">
              <Target size={18} />
            </div>
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-white">Notre mission</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Construire des outils numériques simples, utiles et accessibles, en partant de la RDC et en regardant vers le monde.
              </p>
            </div>
          </div>

          {/* Card: HolPDF fait partie de... */}
          <div className="p-3.5 rounded-2xl bg-[#0a1122]/90 border border-blue-900/40 shadow-sm flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-950/80 border border-blue-800/40 flex items-center justify-center text-blue-300 flex-shrink-0 mt-0.5">
              <Landmark size={18} />
            </div>
            <div className="space-y-1 text-slate-300">
              <h3 className="text-xs font-bold text-white">HolPDF fait partie de...</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                HolPDF est un produit de Hol Corporation, une initiative technologique née en République démocratique du Congo avec l'ambition de créer progressivement des produits numériques utiles et innovants.
              </p>
            </div>
          </div>

          {/* Footer note: Développé par Holsen Bika */}
          <div className="pt-8 pb-4 flex items-end justify-between text-[11px] text-slate-400 border-t border-slate-900">
            <div>
              <p className="text-[10px] text-slate-500">Développé par</p>
              <p className="text-xs font-bold text-white tracking-wide">Holsen Bika</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-500">© 2026 Hol Corporation.</p>
              <p className="text-[10px] text-slate-500">Tous droits réservés.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
