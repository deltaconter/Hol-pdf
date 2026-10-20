import React, { useState } from 'react';
import {
  ChevronLeft,
  FileText,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface TermsOfServiceViewProps {
  onBack: () => void;
}

export const TermsOfServiceView: React.FC<TermsOfServiceViewProps> = ({ onBack }) => {
  const [isExpanded, setIsExpanded] = useState(false);

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
        <h2 className="text-base font-bold text-white">Conditions d'utilisation</h2>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 no-scrollbar text-xs leading-relaxed">
        <div className="max-w-md mx-auto space-y-4">
          {/* Top Card */}
          <div className="p-3.5 rounded-2xl bg-[#090e1f] border border-blue-900/30 flex items-center gap-3 shadow-xs">
            <div className="w-12 h-12 rounded-xl bg-purple-950/90 border border-purple-800/60 flex items-center justify-center text-purple-300 flex-shrink-0">
              <FileText size={22} />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white leading-snug">
                Conditions d'utilisation de HolPDF
              </h1>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Dernière mise à jour : 2 octobre 2026
              </p>
            </div>
          </div>

          {/* Intro Paragraph */}
          <p className="text-[12px] text-slate-300 leading-relaxed pt-1">
            En utilisant HolPDF, vous acceptez les présentes Conditions d'utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser le service.
          </p>

          {/* Section 1: Présentation du service */}
          <div className="flex items-start gap-3 pt-1">
            <div className="w-6 h-6 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center text-[11px] flex-shrink-0 mt-0.5 shadow-sm">
              1
            </div>
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-white">Présentation du service</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                HolPDF est une plateforme numérique destinée à permettre aux utilisateurs de consulter et de lire des documents numériques au format PDF ainsi qu'à accéder aux fonctionnalités proposées par la plateforme.
              </p>
            </div>
          </div>

          {/* Section 2: Compte utilisateur */}
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center text-[11px] flex-shrink-0 mt-0.5 shadow-sm">
              2
            </div>
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-white">Compte utilisateur</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Certaines fonctionnalités peuvent nécessiter la création d'un compte. L'utilisateur s'engage à :
              </p>
              <ul className="space-y-0.5 text-[11px] text-slate-400 pl-1 pt-0.5">
                <li>• fournir des informations exactes ;</li>
                <li>• conserver ses identifiants confidentiels ;</li>
                <li>• ne pas utiliser le compte d'une autre personne ;</li>
                <li>• informer HolPDF en cas d'utilisation non autorisée de son compte.</li>
              </ul>
            </div>
          </div>

          {/* Section 3: Utilisation autorisée */}
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center text-[11px] flex-shrink-0 mt-0.5 shadow-sm">
              3
            </div>
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-white">Utilisation autorisée</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                L'utilisateur s'engage à utiliser HolPDF conformément à la loi et aux présentes conditions. Il est notamment interdit de :
              </p>
              <ul className="space-y-0.5 text-[11px] text-slate-400 pl-1 pt-0.5">
                <li>• utiliser la plateforme à des fins frauduleuses ;</li>
                <li>• tenter de compromettre la sécurité du service ;</li>
                <li>• contourner les restrictions d'accès ;</li>
                <li>• perturber le fonctionnement de la plateforme ;</li>
                <li>• utiliser le service pour des activités illégales.</li>
              </ul>
            </div>
          </div>

          {/* Expanded Sections 4, 5, 6 when clicking "Lire la suite" */}
          {isExpanded && (
            <div className="space-y-4 pt-1 animate-fadeIn">
              {/* Section 4: Propriété intellectuelle */}
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center text-[11px] flex-shrink-0 mt-0.5 shadow-sm">
                  4
                </div>
                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-white">Propriété intellectuelle</h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    L'utilisateur conserve l'entière propriété intellectuelle des documents qu'il importe. HolPDF ne revendique aucun droit sur vos fichiers personnels et garantit leur traitement sécurisé.
                  </p>
                </div>
              </div>

              {/* Section 5: Responsabilité */}
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center text-[11px] flex-shrink-0 mt-0.5 shadow-sm">
                  5
                </div>
                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-white">Limitation de responsabilité</h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    HolPDF s'efforce d'assurer une disponibilité continue du service et de la synthèse vocale, sans pouvoir être tenu responsable des interruptions liées aux réseaux de télécommunications.
                  </p>
                </div>
              </div>

              {/* Section 6: Modifications */}
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center text-[11px] flex-shrink-0 mt-0.5 shadow-sm">
                  6
                </div>
                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-white">Modifications des conditions</h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Ces conditions peuvent être modifiées à tout moment. La date de dernière mise à jour sera systématiquement actualisée en tête de page.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Button: Lire la suite */}
          <div className="pt-3 pb-6 flex justify-center">
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-6 py-2 rounded-full border border-purple-800/80 bg-purple-950/40 hover:bg-purple-900/60 text-purple-300 font-medium text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <span>{isExpanded ? 'Réduire' : 'Lire la suite'}</span>
              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
