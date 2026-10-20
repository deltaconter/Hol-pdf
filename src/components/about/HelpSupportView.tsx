import React, { useState } from 'react';
import {
  ChevronLeft,
  Search,
  Headphones,
  BookOpen,
  User,
  CreditCard,
  Settings,
  ChevronRight,
  ChevronDown,
  Mail,
  MessageSquare,
  FileText,
  Send,
  Check,
  Copy,
} from 'lucide-react';

interface HelpSupportViewProps {
  onBack: () => void;
}

export const HelpSupportView: React.FC<HelpSupportViewProps> = ({ onBack }) => {
  const [currentView, setCurrentView] = useState<'main' | 'contact'>('main');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFaq, setActiveFaq] = useState<string | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [userMessage, setUserMessage] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [messageSent, setMessageSent] = useState(false);

  const faqItems = [
    {
      id: 'reading',
      title: 'Lecture',
      subtitle: 'Comment ouvrir un PDF ?',
      icon: BookOpen,
      iconColor: 'bg-blue-600',
      answer:
        "Sur l'écran d'accueil ou dans votre Bibliothèque, appuyez sur n'importe quel document pour l'ouvrir dans le Lecteur. Vous pouvez basculer entre la vue texte fluide reformatée et la vue originale du document PDF à tout moment.",
    },
    {
      id: 'account',
      title: 'Compte',
      subtitle: 'Comment créer un compte ?',
      icon: User,
      iconColor: 'bg-emerald-500',
      answer:
        "Rendez-vous sur l'onglet Profil ou à l'écran de connexion, sélectionnez 'Inscription' et renseignez votre nom, e-mail et mot de passe. Votre compte permet de synchroniser vos livres et marque-pages sur tous vos appareils via Supabase.",
    },
    {
      id: 'premium',
      title: 'Abonnement & paiements',
      subtitle: 'Comment fonctionne HolPDF Premium ?',
      icon: CreditCard,
      iconColor: 'bg-purple-600',
      answer:
        "HolPDF Premium vous donne accès à 20 heures par mois de voix Studio HD neuronales (Google Cloud & Gemini HD), à l'IA conversationnelle Ask the Book en illimité (avec citations directes et pages sourcées), aux ambiances sonores de concentration et à l'expérience 100% sans publicité.",
    },
    {
      id: 'technical',
      title: 'Problèmes techniques',
      subtitle: 'Mon PDF ne se charge pas.',
      icon: Settings,
      iconColor: 'bg-amber-500',
      answer:
        "Assurez-vous que votre fichier est un format PDF non protégé par mot de passe. Si le document contient uniquement des images scannées sans texte vectoriel, activez le mode 'Vue PDF Originale' pour consulter les pages telles quelles.",
    },
  ];

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('support@holpdf.com');
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2200);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userMessage.trim()) return;
    setMessageSent(true);
    setTimeout(() => {
      setMessageSent(false);
      setShowContactModal(false);
      setUserMessage('');
      setUserEmail('');
    }, 2500);
  };

  const filteredFaqs = faqItems.filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // VIEW 2: Contacter le support (Aide & support suite.png)
  if (currentView === 'contact') {
    return (
      <div className="relative w-full h-full flex flex-col justify-between bg-[#040612] text-white select-none overflow-hidden">
        {/* Top Header */}
        <div className="px-4 py-3 flex items-center gap-3 border-b border-slate-800/80 bg-[#060919]/95 backdrop-blur-md z-20">
          <button
            onClick={() => setCurrentView('main')}
            aria-label="Retour à l'aide"
            className="p-1.5 -ml-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
          >
            <ChevronLeft size={22} />
          </button>
          <h2 className="text-base font-bold text-white">Aide & support</h2>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 no-scrollbar">
          <div className="max-w-md mx-auto space-y-4">
            {/* Hero Card with Glowing Headphones & Speech Bubble */}
            <div className="w-full h-36 rounded-2xl bg-[#090e1f] border border-blue-900/30 flex items-center justify-center relative overflow-hidden shadow-inner">
              <div className="absolute inset-0 bg-radial-gradient from-purple-600/20 via-transparent to-transparent pointer-events-none" />

              <div className="relative flex items-center gap-3">
                {/* 3D-styled glowing headset icon */}
                <div className="relative w-20 h-20 rounded-full flex items-center justify-center bg-gradient-to-tr from-purple-700 to-indigo-500 shadow-[0_0_30px_rgba(147,51,234,0.4)]">
                  <Headphones size={36} className="text-white drop-shadow-md" />
                </div>

                {/* Speech Bubble */}
                <div className="px-3 py-2 rounded-2xl bg-indigo-600/90 text-white font-bold text-xs flex items-center gap-1 shadow-lg border border-indigo-400/40 -mt-6 -ml-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse delay-75" />
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse delay-150" />
                </div>
              </div>
            </div>

            {/* Title & Subtitle */}
            <div className="space-y-1.5 pt-1">
              <h1 className="text-xl font-extrabold text-white">Contacter le support</h1>
              <p className="text-xs text-slate-300 leading-relaxed">
                Notre équipe est disponible pour vous aider. Remplissez le formulaire ci-dessous ou envoyez-nous un e-mail.
              </p>
            </div>

            {/* Option 1: E-mail */}
            <div
              onClick={handleCopyEmail}
              className="p-3.5 rounded-2xl bg-[#090e1f] border border-blue-900/30 hover:border-purple-600/50 transition-all cursor-pointer flex items-center justify-between group shadow-xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-purple-950/90 border border-purple-800/60 flex items-center justify-center text-purple-300 flex-shrink-0">
                  <Mail size={20} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">E-mail</h3>
                  <p className="text-xs text-slate-300 font-mono mt-0.5">support@holpdf.com</p>
                  <p className="text-[10px] text-purple-400 mt-0.5 font-medium">Réponse sous 24h</p>
                </div>
              </div>

              <div className="text-slate-400 group-hover:text-purple-400 transition-colors">
                {copiedEmail ? (
                  <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                    <Check size={12} /> Copié !
                  </span>
                ) : (
                  <ChevronRight size={18} />
                )}
              </div>
            </div>

            {/* Option 2: Chat (bientôt) */}
            <div className="p-3.5 rounded-2xl bg-[#090e1f]/70 border border-blue-900/20 flex items-center gap-3 text-slate-400 shadow-xs">
              <div className="w-11 h-11 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-center text-slate-400 flex-shrink-0">
                <MessageSquare size={20} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-300">Chat (bientôt)</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Disponible prochainement</p>
              </div>
            </div>

            {/* Option 3: Informations utiles */}
            <div className="p-3.5 rounded-2xl bg-[#090e1f] border border-blue-900/30 space-y-2 text-xs shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-purple-950/90 border border-purple-800/60 flex items-center justify-center text-purple-300 flex-shrink-0">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">Informations utiles</h3>
                </div>
              </div>

              <div className="pl-1 pt-1 text-[11px] text-slate-400 space-y-1">
                <p>Pour une réponse plus rapide, veuillez nous indiquer :</p>
                <ul className="space-y-0.5 pl-2 text-slate-300">
                  <li>• votre adresse e-mail ;</li>
                  <li>• le problème rencontré ;</li>
                  <li>• une capture d'écran (si possible).</li>
                </ul>
              </div>
            </div>

            {/* Bottom Button: Envoyer un message */}
            <div className="pt-2 pb-6">
              <button
                type="button"
                onClick={() => setShowContactModal(true)}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(147,51,234,0.35)] transition-all cursor-pointer"
              >
                <Send size={15} />
                <span>Envoyer un message</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal: Formulaire d'envoi rapide */}
        {showContactModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowContactModal(false);
            }}
          >
            <div className="w-full max-w-sm rounded-2xl bg-[#0d1428] border border-purple-800/60 p-4 text-xs space-y-3 shadow-2xl">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h3 className="font-bold text-white text-sm">Écrire au support</h3>
                <button
                  onClick={() => setShowContactModal(false)}
                  className="text-slate-400 hover:text-white text-base"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSendMessage} className="space-y-3">
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">
                    Votre e-mail
                  </label>
                  <input
                    type="email"
                    required
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    placeholder="votre.email@exemple.com"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">
                    Description du problème
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={userMessage}
                    onChange={(e) => setUserMessage(e.target.value)}
                    placeholder="Décrivez votre question ou le souci rencontré..."
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-purple-500 resize-none"
                  />
                </div>

                {messageSent && (
                  <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-center flex items-center justify-center gap-1.5">
                    <Check size={14} />
                    <span>Message transmis à support@holpdf.com !</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 font-bold text-white text-xs cursor-pointer shadow-md"
                >
                  Confirmer et envoyer
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // VIEW 1: Aide & support (Aide & support.png)
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
        <h2 className="text-base font-bold text-white">Aide & support</h2>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 no-scrollbar">
        <div className="max-w-md mx-auto space-y-4">
          {/* Hero Banner: Besoin d'aide ? */}
          <div className="flex items-center gap-3.5 pt-1">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-700 to-indigo-500 flex items-center justify-center text-white flex-shrink-0 shadow-[0_0_20px_rgba(147,51,234,0.35)]">
              <Headphones size={26} />
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="text-base font-extrabold text-white">Besoin d'aide ?</h1>
              <p className="text-[11px] text-slate-300 leading-snug mt-0.5">
                Nous sommes là pour vous aider à profiter pleinement de votre expérience de lecture.
              </p>
            </div>
          </div>

          {/* Search Bar Capsule */}
          <div className="relative pt-1">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none mt-0.5">
              <Search size={15} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher une question..."
              className="w-full pl-10 pr-3 py-2.5 bg-[#090e1f] border border-blue-900/40 rounded-full text-xs text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 transition-all shadow-inner"
            />
          </div>

          {/* Section: Questions fréquentes */}
          <div className="space-y-2 pt-1">
            <h2 className="text-xs font-bold text-white tracking-wide">
              Questions fréquentes
            </h2>

            <div className="space-y-2">
              {filteredFaqs.map((faq) => {
                const isOpened = activeFaq === faq.id;
                const IconComponent = faq.icon;

                return (
                  <div
                    key={faq.id}
                    className="rounded-2xl bg-[#090e1f] border border-blue-900/30 overflow-hidden transition-all shadow-xs"
                  >
                    <div
                      onClick={() => setActiveFaq(isOpened ? null : faq.id)}
                      className="p-3 flex items-center justify-between cursor-pointer hover:bg-slate-800/30 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl ${faq.iconColor} flex items-center justify-center text-white flex-shrink-0 shadow-xs`}
                        >
                          <IconComponent size={18} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-xs font-bold text-white truncate">{faq.title}</h3>
                          <p className="text-[11px] text-slate-400 truncate">{faq.subtitle}</p>
                        </div>
                      </div>

                      <div className="text-slate-400 pl-2">
                        {isOpened ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </div>
                    </div>

                    {isOpened && (
                      <div className="px-3.5 pb-3 pt-0 text-[11px] text-slate-300 leading-relaxed border-t border-slate-800/60 bg-[#060a16]">
                        <p className="pt-2">{faq.answer}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Card: Vous n'avez pas trouvé la réponse ? */}
          <div className="p-3.5 rounded-2xl bg-[#090e1f] border border-blue-900/30 space-y-3 mt-4 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-950/80 border border-purple-800/60 flex items-center justify-center text-purple-300 flex-shrink-0">
                <Mail size={18} />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs font-bold text-white">
                  Vous n'avez pas trouvé la réponse ?
                </h3>
                <p className="text-[11px] text-slate-400">Contactez notre équipe support.</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setCurrentView('contact')}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
            >
              <span>Contacter le support</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
