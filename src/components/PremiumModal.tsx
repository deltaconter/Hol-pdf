import React, { useState } from 'react';
import {
  Crown,
  Sparkles,
  Headphones,
  Zap,
  Volume2,
  Check,
  ShieldCheck,
  Ban,
  MessageSquare,
} from 'lucide-react';
import { UserProfile } from '../types';

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onUpdateUserProfile: (updates: Partial<UserProfile>) => void;
  customTitle?: string;
  customDescription?: string;
}

export const PremiumModal: React.FC<PremiumModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onUpdateUserProfile,
  customTitle,
  customDescription,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  if (!isOpen) return null;

  const handleStartPremium = () => {
    if (userProfile.isPremium) {
      // Revert to free
      onUpdateUserProfile({
        isPremium: false,
        studioHdMinutesTotal: 30,
      });
      onClose();
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      onUpdateUserProfile({
        isPremium: true,
        studioHdMinutesTotal: 1200, // 20 Hours of Studio HD
        billingCycleRenewsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
      });
      setIsProcessing(false);
      setShowSuccessToast(true);
      setTimeout(() => {
        setShowSuccessToast(false);
        onClose();
      }, 900);
    }, 600);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 select-none overflow-y-auto"
      style={{
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Background ambient radial glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 20%, rgba(155, 92, 255, 0.16), transparent 55%)',
        }}
      />

      {/* Paywall Modal Card */}
      <div
        className="relative w-full max-w-[440px] my-auto overflow-hidden text-white transition-all"
        style={{
          background: 'linear-gradient(145deg, rgba(30, 30, 30, 0.98), rgba(10, 10, 10, 0.98))',
          border: '1px solid rgba(155, 92, 255, 0.28)',
          borderRadius: '26px',
          padding: '28px 24px',
          boxShadow: '0 30px 100px rgba(0, 0, 0, 0.85), 0 0 60px rgba(155, 92, 255, 0.12)',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Fermer"
          className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center text-slate-300 hover:text-white transition-all cursor-pointer z-20 group"
          style={{
            border: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(255, 255, 255, 0.04)',
          }}
        >
          <span className="text-xl leading-none transition-transform duration-200 group-hover:rotate-90">
            ×
          </span>
        </button>

        {/* Header Section */}
        <div className="text-center pt-1">
          {/* Glowing Premium Icon */}
          <div
            className="w-16 h-16 mx-auto mb-4 rounded-[20px] flex items-center justify-center text-2xl"
            style={{
              background: 'linear-gradient(145deg, rgba(155, 92, 255, 0.3), rgba(155, 92, 255, 0.08))',
              border: '1px solid rgba(155, 92, 255, 0.35)',
              boxShadow: '0 0 30px rgba(155, 92, 255, 0.18)',
            }}
          >
            {userProfile.isPremium ? '👑' : '🔐'}
          </div>

          {/* Premium Label */}
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-[1.5px] mb-3"
            style={{
              background: 'rgba(155, 92, 255, 0.12)',
              border: '1px solid rgba(155, 92, 255, 0.25)',
              color: '#bd91ff',
            }}
          >
            <Crown size={12} className="text-[#bd91ff]" />
            HOLPDF PREMIUM
          </div>

          <h2 className="text-xl sm:text-[23px] font-extrabold text-white leading-snug mb-2">
            {customTitle ||
              (userProfile.isPremium
                ? 'Vous êtes membre HolPdf Premium'
                : 'Accédez à l’expérience HolPdf illimitée')}
          </h2>

          <p className="text-xs sm:text-[13px] text-[#999999] leading-relaxed max-w-[360px] mx-auto">
            {customDescription ||
              (userProfile.isPremium
                ? 'Profitez de vos 20h de voix Studio HD et de tous les outils IA en illimité.'
                : 'Déverrouillez la voix neuronale HD, Ask the Book et supprimez 100% des publicités.')}
          </p>
        </div>

        {/* Benefits List matching user specifications */}
        <div className="my-5 grid gap-2">
          {/* Benefit 1 */}
          <div
            className="flex items-center gap-3 p-2.5 rounded-xl text-xs sm:text-[13px] text-slate-200"
            style={{
              background: 'rgba(255, 255, 255, 0.025)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
            }}
          >
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-bold"
              style={{
                background: 'rgba(155, 92, 255, 0.15)',
                color: '#bd91ff',
              }}
            >
              ✓
            </div>
            <span>
              <strong>Pack 20h Studio HD / mois</strong> (Google Cloud & Gemini)
            </span>
          </div>

          {/* Benefit 2 */}
          <div
            className="flex items-center gap-3 p-2.5 rounded-xl text-xs sm:text-[13px] text-slate-200"
            style={{
              background: 'rgba(255, 255, 255, 0.025)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
            }}
          >
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-bold"
              style={{
                background: 'rgba(155, 92, 255, 0.15)',
                color: '#bd91ff',
              }}
            >
              ✓
            </div>
            <span>
              <strong>💬 IA Conversationnelle Ask the Book illimitée :</strong> Posez n'importe quelle question au livre avec citations directes et réponses sourcées
            </span>
          </div>

          {/* Benefit 3 */}
          <div
            className="flex items-center gap-3 p-2.5 rounded-xl text-xs sm:text-[13px] text-slate-200"
            style={{
              background: 'rgba(255, 255, 255, 0.025)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
            }}
          >
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-bold"
              style={{
                background: 'rgba(155, 92, 255, 0.15)',
                color: '#bd91ff',
              }}
            >
              ✓
            </div>
            <span>
              <strong>Ambiances d'immersion :</strong> Pluie, feu, café, vagues
            </span>
          </div>

          {/* Benefit 4 */}
          <div
            className="flex items-center gap-3 p-2.5 rounded-xl text-xs sm:text-[13px] text-slate-200"
            style={{
              background: 'rgba(255, 255, 255, 0.025)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
            }}
          >
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-bold"
              style={{
                background: 'rgba(155, 92, 255, 0.15)',
                color: '#bd91ff',
              }}
            >
              ✓
            </div>
            <span>
              <strong>Zéro Publicité</strong> & Lecture continue sans coupure
            </span>
          </div>
        </div>

        {/* Single Monthly Plan Card ($2.99 / mois) */}
        <div
          className="relative p-4 rounded-2xl transition-all duration-200"
          style={{
            border: '1px solid #9b5cff',
            background: 'linear-gradient(145deg, rgba(155, 92, 255, 0.16), rgba(155, 92, 255, 0.05))',
            boxShadow: '0 0 30px rgba(155, 92, 255, 0.12)',
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] text-purple-300 font-bold uppercase tracking-wider mb-0.5">
                Abonnement Mensuel
              </div>
              <div className="text-2xl sm:text-[26px] font-extrabold text-white leading-tight">
                $2.99 <span className="text-xs text-[#aaa] font-normal">/ mois</span>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-200 border border-purple-500/40">
                Sans engagement
              </span>
              <p className="text-[10px] text-[#888] mt-1">Annulable à tout moment</p>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <button
          type="button"
          onClick={handleStartPremium}
          disabled={isProcessing}
          className="w-full mt-4 rounded-xl p-3.5 text-white font-extrabold text-sm sm:text-[15px] transition-all duration-200 cursor-pointer shadow-lg active:scale-[0.98] flex items-center justify-center gap-2"
          style={{
            background: 'linear-gradient(135deg, #9b5cff, #7434d4)',
            boxShadow: '0 10px 30px rgba(155, 92, 255, 0.25)',
          }}
        >
          {isProcessing ? (
            <span className="flex items-center gap-2 text-white">
              <Sparkles size={16} className="animate-spin text-purple-200" />
              Activation en cours...
            </span>
          ) : userProfile.isPremium ? (
            <span>Passer au compte standard</span>
          ) : (
            <span>
              Passer à Premium — $2.99 / mois
            </span>
          )}
        </button>

        {/* Secure Checkout Note */}
        <div className="text-center mt-3 text-[10px] text-[#666]">
          🔒 Paiement sécurisé • Annulable à tout moment • HolPdf
        </div>

        {/* Success toast if activated */}
        {showSuccessToast && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center animate-fadeIn z-30"
            style={{
              background: 'rgba(10, 10, 10, 0.95)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mb-3">
              <Check size={32} />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">
              Félicitations !
            </h3>
            <p className="text-xs text-slate-300 max-w-xs">
              Votre formule HolPdf Premium ($2.99/mois) est maintenant active avec 20h de voix Studio HD et Ask the Book illimité.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
