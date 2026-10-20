import React from 'react';
import { Sparkles, Crown, ExternalLink } from 'lucide-react';
import { UserProfile } from '../../types';

interface AdSenseBannerProps {
  slot: 'home-bottom' | 'import-modal' | 'audio-player' | 'reader-break';
  format?: 'banner' | 'rectangle' | 'compact';
  userProfile?: UserProfile;
  onOpenPremium?: () => void;
  className?: string;
}

export const AdSenseBanner: React.FC<AdSenseBannerProps> = ({
  slot,
  format = 'banner',
  userProfile,
  onOpenPremium,
  className = '',
}) => {
  // CRITICAL REQUIREMENT: Automatic suppression for Premium members!
  if (userProfile?.isPremium) {
    return null;
  }

  // Realistic fallback ad creatives tailored to reading, productivity & audio
  const adCreatives: Record<
    string,
    { title: string; desc: string; brand: string; action: string; badge: string }
  > = {
    'home-bottom': {
      brand: 'Blinkist & Audible',
      title: 'Écoutez + de 5 000 résumés de livres',
      desc: 'Accédez aux meilleures idées de livres en 15 minutes par jour.',
      action: 'Découvrir',
      badge: 'Sponsorisé',
    },
    'import-modal': {
      brand: 'Google Cloud & AI',
      title: 'Besoin d’extraire des millions de pages ?',
      desc: 'Découvrez les API Document AI pour entreprises.',
      action: 'En savoir plus',
      badge: 'Annonce',
    },
    'audio-player': {
      brand: 'Casques Sony & Bose',
      title: 'Son spatial & Réduction de bruit active',
      desc: 'Plongez dans vos livres audio avec une immersion sonore totale.',
      action: 'Profiter de l’offre',
      badge: 'Sponsorisé',
    },
    'reader-break': {
      brand: 'Abonnement HolPdf',
      title: 'Profitez de la lecture sans aucune coupure',
      desc: 'Supprimez les annonces et profitez de 20h de voix Studio HD.',
      action: 'Passer Premium',
      badge: 'Recommandé',
    },
  };

  const creative = adCreatives[slot] || adCreatives['home-bottom'];

  // Check if actual Google AdSense client ID is configured
  const adsenseClientId = (import.meta as any).env?.VITE_ADSENSE_CLIENT_ID;

  if (adsenseClientId) {
    return (
      <div className={`my-2 p-1 rounded-xl bg-slate-900/80 border border-slate-800 text-center overflow-hidden ${className}`}>
        <div className="flex items-center justify-between px-2 py-0.5 text-[9px] text-slate-500">
          <span>Annonce Google AdSense</span>
          {onOpenPremium && (
            <button
              onClick={onOpenPremium}
              className="text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Crown size={10} />
              <span>Retirer les pubs</span>
            </button>
          )}
        </div>
        <ins
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client={adsenseClientId}
          data-ad-slot="1234567890"
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    );
  }

  // Native stylized ad container matching HolPdf design
  if (format === 'compact') {
    return (
      <div
        className={`my-2 px-3 py-2 rounded-xl bg-[#0a1024]/90 border border-blue-900/30 flex items-center justify-between gap-2 shadow-xs ${className}`}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="px-1.5 py-0.2 rounded text-[8px] font-bold uppercase bg-slate-800 text-slate-400">
              {creative.badge}
            </span>
            <span className="text-[10px] font-semibold text-white truncate">
              {creative.title}
            </span>
          </div>
          <p className="text-[9px] text-slate-400 truncate mt-0.5">{creative.desc}</p>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {onOpenPremium && (
            <button
              type="button"
              onClick={onOpenPremium}
              className="text-[9px] text-amber-400 hover:text-amber-300 font-medium flex items-center gap-0.5 cursor-pointer"
              title="Supprimer les pubs avec Premium"
            >
              <Crown size={10} />
              <span className="hidden sm:inline">Sans pub</span>
            </button>
          )}
          <button
            type="button"
            className="px-2 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold cursor-pointer transition-colors shadow-2xs"
          >
            {creative.action}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`my-2.5 p-3 rounded-2xl bg-gradient-to-br from-[#0c1328] to-[#070b18] border border-blue-900/35 relative overflow-hidden shadow-xs select-none ${className}`}
    >
      {/* Top Banner Tag & Premium upsell */}
      <div className="flex items-center justify-between text-[9px] mb-1.5">
        <div className="flex items-center gap-1 text-slate-400">
          <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-bold uppercase tracking-wider text-[8px]">
            {creative.badge}
          </span>
          <span className="text-slate-500">• {creative.brand}</span>
        </div>

        {onOpenPremium && (
          <button
            type="button"
            onClick={onOpenPremium}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 hover:text-amber-300 font-medium text-[9px] cursor-pointer transition-colors"
          >
            <Crown size={10} className="text-amber-400" />
            <span>Retirer les pubs</span>
          </button>
        )}
      </div>

      {/* Main Ad Content */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h4 className="text-xs font-bold text-white tracking-tight leading-snug">
            {creative.title}
          </h4>
          <p className="text-[10px] text-slate-400 mt-0.5 leading-normal">
            {creative.desc}
          </p>
        </div>

        <button
          type="button"
          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-[11px] font-bold flex items-center gap-1 flex-shrink-0 cursor-pointer shadow-sm transition-transform active:scale-95"
        >
          <span>{creative.action}</span>
          <ExternalLink size={10} />
        </button>
      </div>
    </div>
  );
};
