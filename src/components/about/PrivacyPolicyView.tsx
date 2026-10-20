import React, { useState } from 'react';
import {
  ChevronLeft,
  Shield,
  User,
  Layers,
  Cpu,
  CreditCard,
  ChevronRight,
  ChevronDown,
  Mail,
  Check,
  Copy,
} from 'lucide-react';

interface PrivacyPolicyViewProps {
  onBack: () => void;
}

export const PrivacyPolicyView: React.FC<PrivacyPolicyViewProps> = ({ onBack }) => {
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const [copiedPrivacyEmail, setCopiedPrivacyEmail] = useState(false);
  const [showRightsModal, setShowRightsModal] = useState(false);

  const subItems = [
    {
      id: 'account',
      title: 'Informations de compte',
      subtitle: 'Nom, e-mail, photo de profil...',
      icon: User,
      iconColor: 'bg-blue-600',
      details:
        "Utilisées pour sécuriser votre accès et sauvegarder vos livres dans votre espace privé. Vous pouvez les modifier à tout moment depuis vos Paramètres.",
    },
    {
      id: 'usage',
      title: "Informations d'utilisation",
      subtitle: 'Documents consultés, progression...',
      icon: Layers,
      iconColor: 'bg-blue-600',
      details:
        "Permet de mémoriser la page active où vous vous êtes arrêté, vos marque-pages et surlignages, ainsi que votre temps de lecture pour vos statistiques personnelles.",
    },
    {
      id: 'tech',
      title: 'Informations techniques',
      subtitle: "Appareil, système d'exploitation...",
      icon: Cpu,
      iconColor: 'bg-emerald-500',
      details:
        "Utilisées pour adapter l'affichage (mode sombre, taille d'écran) et optimiser la synthèse vocale selon les capacités audio de votre appareil.",
    },
    {
      id: 'payment',
      title: 'Informations de paiement',
      subtitle: 'Traitées par nos prestataires de paiement.',
      icon: CreditCard,
      iconColor: 'bg-amber-500',
      details:
        "HolPDF ne stocke jamais vos numéros complets de carte bancaire. Les transactions sont gérées par des prestataires de paiement certifiés conformes PCI-DSS.",
    },
  ];

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('privacy@holpdf.com');
    setCopiedPrivacyEmail(true);
    setTimeout(() => setCopiedPrivacyEmail(false), 2200);
  };

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
        <h2 className="text-base font-bold text-white">Politique de confidentialité</h2>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 no-scrollbar text-xs leading-relaxed">
        <div className="max-w-md mx-auto space-y-4">
          {/* Top Card */}
          <div className="p-3.5 rounded-2xl bg-[#090e1f] border border-blue-900/30 flex items-center gap-3 shadow-xs">
            <div className="w-12 h-12 rounded-xl bg-purple-950/90 border border-purple-800/60 flex items-center justify-center text-purple-300 flex-shrink-0">
              <Shield size={22} />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white leading-snug">
                Politique de confidentialité
              </h1>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Dernière mise à jour : 2 octobre 2026
              </p>
            </div>
          </div>

          {/* Intro Paragraph */}
          <p className="text-[12px] text-slate-300 leading-relaxed pt-1">
            La confidentialité de nos utilisateurs est importante pour nous. Cette politique explique quelles informations HolPDF peut collecter, pourquoi elles sont utilisées et comment elles sont protégées.
          </p>

          {/* Section 1: Informations que nous pouvons collecter */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center text-[11px] flex-shrink-0 shadow-sm">
                1
              </div>
              <h2 className="text-xs font-bold text-white">
                Informations que nous pouvons collecter
              </h2>
            </div>
            <p className="text-[11px] text-slate-400 pl-9">
              Selon votre utilisation de HolPDF, nous pouvons collecter :
            </p>

            {/* 4 Clickable Sub-cards */}
            <div className="space-y-2 pl-9 pt-1">
              {subItems.map((item) => {
                const IconComponent = item.icon;
                const isOpened = activeItem === item.id;

                return (
                  <div
                    key={item.id}
                    className="rounded-2xl bg-[#090e1f] border border-blue-900/30 overflow-hidden transition-all shadow-xs"
                  >
                    <div
                      onClick={() => setActiveItem(isOpened ? null : item.id)}
                      className="p-3 flex items-center justify-between cursor-pointer hover:bg-slate-800/30 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl ${item.iconColor} flex items-center justify-center text-white flex-shrink-0 shadow-xs`}
                        >
                          <IconComponent size={18} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-xs font-bold text-white truncate">{item.title}</h3>
                          <p className="text-[11px] text-slate-400 truncate">{item.subtitle}</p>
                        </div>
                      </div>

                      <div className="text-slate-400 pl-2">
                        {isOpened ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </div>
                    </div>

                    {isOpened && (
                      <div className="px-3.5 pb-3 pt-0 text-[11px] text-slate-300 leading-relaxed border-t border-slate-800/60 bg-[#060a16]">
                        <p className="pt-2">{item.details}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Pourquoi utilisons-nous ces informations ? */}
          <div className="flex items-start gap-3 pt-1">
            <div className="w-6 h-6 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center text-[11px] flex-shrink-0 mt-0.5 shadow-sm">
              2
            </div>
            <div className="space-y-1">
              <h2 className="text-xs font-bold text-white">
                Pourquoi utilisons-nous ces informations ?
              </h2>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Pour fournir les fonctionnalités, améliorer le service, assurer la sécurité et traiter les paiements.
              </p>
            </div>
          </div>

          {/* Section 3: Partage des informations */}
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center text-[11px] flex-shrink-0 mt-0.5 shadow-sm">
              3
            </div>
            <div className="space-y-1">
              <h2 className="text-xs font-bold text-white">Partage des informations</h2>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Nous ne vendons pas vos informations personnelles. Certaines peuvent être partagées avec nos prestataires (hébergement, authentification, stockage, paiement...) uniquement pour le bon fonctionnement du service.
              </p>
            </div>
          </div>

          {/* Section 4: Sécurité */}
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center text-[11px] flex-shrink-0 mt-0.5 shadow-sm">
              4
            </div>
            <div className="space-y-1">
              <h2 className="text-xs font-bold text-white">Sécurité</h2>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Nous mettons en place des mesures techniques et organisationnelles pour protéger vos données. Cependant, aucune connexion Internet n'est totalement sécurisée.
              </p>
            </div>
          </div>

          {/* Section 5: Conservation des données */}
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center text-[11px] flex-shrink-0 mt-0.5 shadow-sm">
              5
            </div>
            <div className="space-y-1">
              <h2 className="text-xs font-bold text-white">Conservation des données</h2>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Les informations sont conservées aussi longtemps que nécessaire au fonctionnement du service ou pour respecter les obligations légales.
              </p>
            </div>
          </div>

          {/* Section 6: Vos droits */}
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center text-[11px] flex-shrink-0 mt-0.5 shadow-sm">
              6
            </div>
            <div className="space-y-2 flex-1 min-w-0">
              <h2 className="text-xs font-bold text-white">Vos droits</h2>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Vous pouvez demander l'accès, la correction, la suppression de vos données ou certaines informations sur leur utilisation.
              </p>

              {/* Action row with "Exercer mes droits" and "privacy@holpdf.com" */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowRightsModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-[#090e1f] border border-blue-900/40 hover:border-purple-600 text-xs font-medium text-slate-200 hover:text-white transition-all cursor-pointer shadow-xs"
                >
                  Exercer mes droits
                </button>

                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className="flex-1 px-3 py-2 rounded-xl bg-[#090e1f] border border-blue-900/40 hover:border-purple-600 font-mono text-[11px] text-purple-300 hover:text-purple-200 flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                >
                  {copiedPrivacyEmail ? (
                    <span className="text-emerald-400 font-sans flex items-center gap-1 font-semibold">
                      <Check size={12} /> E-mail copié !
                    </span>
                  ) : (
                    <span>privacy@holpdf.com</span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Section 7: Cookies et technologies similaires */}
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center text-[11px] flex-shrink-0 mt-0.5 shadow-sm">
              7
            </div>
            <div className="space-y-1">
              <h2 className="text-xs font-bold text-white">Cookies et technologies similaires</h2>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Nous utilisons des cookies nécessaires au fonctionnement, à la sécurité et à l'analyse de l'utilisation du service.
              </p>
            </div>
          </div>

          {/* Section 8: Modifications */}
          <div className="flex items-start gap-3 pb-6">
            <div className="w-6 h-6 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center text-[11px] flex-shrink-0 mt-0.5 shadow-sm">
              8
            </div>
            <div className="space-y-1">
              <h2 className="text-xs font-bold text-white">Modifications</h2>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Cette politique peut être mise à jour. La date de dernière modification sera indiquée en haut de cette page.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Exercer mes droits */}
      {showRightsModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowRightsModal(false);
          }}
        >
          <div className="w-full max-w-sm rounded-2xl bg-[#0d1428] border border-purple-800/60 p-4 text-xs space-y-3 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-bold text-white text-sm">Exercer vos droits (RGPD)</h3>
              <button
                onClick={() => setShowRightsModal(false)}
                className="text-slate-400 hover:text-white text-base"
              >
                ✕
              </button>
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed">
              Pour demander l'exportation ou la suppression totale de vos données et de votre compte, adressez directement votre demande à notre DPO à :
            </p>

            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs text-purple-300 text-center select-all">
              privacy@holpdf.com
            </div>

            <p className="text-[10px] text-slate-400">
              Nous traiterons votre requête dans un délai maximum de 48 heures ouvrées conformément à la législation en vigueur.
            </p>

            <button
              type="button"
              onClick={() => setShowRightsModal(false)}
              className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-500 font-bold text-white text-xs cursor-pointer shadow-md"
            >
              Compris
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
