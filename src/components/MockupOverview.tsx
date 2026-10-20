import React from 'react';
import {
  Headphones,
  Search,
  Highlighter,
  Smartphone,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { HolPdfLogo } from './HolPdfLogo';
import { SplashScreen } from '../screens/SplashScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { ReaderScreen } from '../screens/ReaderScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { AudioPlayerScreen } from '../screens/AudioPlayerScreen';
import { VoiceSelectorScreen } from '../screens/VoiceSelectorScreen';
import { LibraryScreen } from '../screens/LibraryScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { DocumentItem, VoiceOption, UserProfile, AppScreen } from '../types';

interface MockupOverviewProps {
  documents: DocumentItem[];
  userProfile: UserProfile;
  currentVoice: VoiceOption;
  onSelectScreen: (screen: AppScreen) => void;
  onOpenUpload: () => void;
}

export const MockupOverview: React.FC<MockupOverviewProps> = ({
  documents,
  userProfile,
  currentVoice,
  onSelectScreen,
  onOpenUpload,
}) => {
  const currentDoc = documents[0];

  const screens = [
    {
      id: 'splash' as AppScreen,
      title: '1. Écran de démarrage (10s)',
      component: <SplashScreen onFinish={() => onSelectScreen('login')} />,
    },
    {
      id: 'login' as AppScreen,
      title: '2. Connexion',
      component: (
        <LoginScreen
          userProfile={userProfile}
          onLoginSuccess={() => onSelectScreen('home')}
        />
      ),
    },
    {
      id: 'home' as AppScreen,
      title: '3. Accueil & Mes documents',
      component: (
        <HomeScreen
          documents={documents}
          userProfile={userProfile}
          onSelectDocument={() => onSelectScreen('reader')}
          onOpenAudio={() => onSelectScreen('audio')}
          onNavigate={onSelectScreen}
          onOpenUpload={onOpenUpload}
          onToggleFavorite={() => {}}
          onDeleteDocument={() => {}}
        />
      ),
    },
    {
      id: 'reader' as AppScreen,
      title: '3. Lecteur PDF & Surlignage',
      component: (
        <ReaderScreen
          document={currentDoc}
          onBack={() => onSelectScreen('home')}
          onNavigate={onSelectScreen}
          onOpenAudio={() => onSelectScreen('audio')}
        />
      ),
    },
    {
      id: 'search' as AppScreen,
      title: '4. Recherche dans le document',
      component: (
        <SearchScreen
          currentDocument={currentDoc}
          onBack={() => onSelectScreen('reader')}
          onSelectResult={() => onSelectScreen('reader')}
        />
      ),
    },
    {
      id: 'audio' as AppScreen,
      title: '5. Lecture audio & Synthèse',
      component: (
        <AudioPlayerScreen
          document={currentDoc}
          currentVoice={currentVoice}
          onBack={() => onSelectScreen('reader')}
          onNavigate={onSelectScreen}
          onOpenVoiceSelector={() => onSelectScreen('voices')}
        />
      ),
    },
    {
      id: 'voices' as AppScreen,
      title: '6. Sélection des voix',
      component: (
        <VoiceSelectorScreen
          selectedVoice={currentVoice}
          onSelectVoice={() => onSelectScreen('audio')}
          onBack={() => onSelectScreen('audio')}
        />
      ),
    },
    {
      id: 'library' as AppScreen,
      title: '7. Bibliothèque complète',
      component: (
        <LibraryScreen
          documents={documents}
          onSelectDocument={() => onSelectScreen('reader')}
          onNavigate={onSelectScreen}
          onOpenUpload={onOpenUpload}
          onToggleFavorite={() => {}}
        />
      ),
    },
    {
      id: 'profile' as AppScreen,
      title: '8. Paramètres & Profil',
      component: (
        <ProfileScreen
          userProfile={userProfile}
          currentVoice={currentVoice}
          onNavigate={onSelectScreen}
          onOpenUpload={onOpenUpload}
          onOpenVoiceSelector={() => onSelectScreen('voices')}
          onUpdateUserProfile={() => {}}
        />
      ),
    },
  ];

  return (
    <div className="w-full min-h-screen bg-[#02040a] text-white p-4 sm:p-8 flex flex-col items-center">
      {/* Top Banner Title */}
      <div className="text-center max-w-2xl mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/60 border border-purple-500/30 text-purple-300 text-xs font-semibold mb-3 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
          <Sparkles size={14} className="text-yellow-400" />
          <span>Reproduction fidèle de la maquette originale</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
          HolPdf — Les 8 interfaces de l'application
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm mt-2">
          Cliquez sur n'importe quel écran pour l'ouvrir en mode interactif complet avec lecture audio, surlignage et recherche.
        </p>
      </div>

      {/* Grid of the 8 Mobile Mockup Devices */}
      <div className="w-full max-w-7xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {screens.map((item) => (
          <div key={item.id} className="flex flex-col items-center">
            {/* Screen Label & Open Button */}
            <div className="w-full flex items-center justify-between mb-2 px-2 text-xs font-medium text-slate-300">
              <span className="truncate">{item.title}</span>
              <button
                onClick={() => onSelectScreen(item.id)}
                className="text-purple-400 hover:text-purple-300 flex items-center gap-1 text-[11px] font-semibold"
              >
                <span>Tester</span>
                <ExternalLink size={12} />
              </button>
            </div>

            {/* Realistic iPhone Bezel Container */}
            <div
              onClick={() => onSelectScreen(item.id)}
              className="relative w-full max-w-[310px] aspect-[9/19.5] rounded-[44px] p-2.5 bg-gradient-to-b from-slate-700 via-slate-900 to-slate-950 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_20px_rgba(147,51,234,0.2)] border-2 border-slate-700/80 cursor-pointer group transition-transform duration-300 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(168,85,247,0.4)]"
            >
              {/* Dynamic Island Pill on Top */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-5 bg-black rounded-full z-40 flex items-center justify-end px-2 border border-slate-800">
                <div className="w-2.5 h-2.5 rounded-full bg-[#0a0f1d] border border-slate-700/50"></div>
              </div>

              {/* Screen Inner Display */}
              <div className="relative w-full h-full rounded-[36px] overflow-hidden bg-[#040612] border border-slate-800">
                {item.component}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Promotional Footer Banner (Exact to user's uploaded mockup bottom section!) */}
      <div className="w-full max-w-5xl rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-[#070b1c] via-[#0f142b] to-[#070b1c] border border-indigo-500/30 shadow-[0_10px_40px_rgba(79,70,229,0.2)] flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Left Logo + Slogan */}
        <div className="flex items-center gap-4">
          <HolPdfLogo size="lg" showSubtitle={true} />
        </div>

        {/* Center Tagline */}
        <div className="text-center md:text-left">
          <h3 className="text-base sm:text-lg font-bold text-white">
            Un simple PDF... <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">une expérience complète.</span>
          </h3>
        </div>

        {/* Right 4 Icons */}
        <div className="flex items-center gap-6 sm:gap-8 flex-wrap justify-center">
          <div className="flex flex-col items-center gap-1.5 text-center">
            <div className="w-10 h-10 rounded-xl bg-purple-950/60 border border-purple-500/40 text-purple-400 flex items-center justify-center shadow-[0_0_12px_rgba(168,85,247,0.3)]">
              <Headphones size={20} />
            </div>
            <span className="text-[11px] text-slate-300 font-medium">Lecture audio</span>
          </div>

          <div className="flex flex-col items-center gap-1.5 text-center">
            <div className="w-10 h-10 rounded-xl bg-blue-950/60 border border-blue-500/40 text-blue-400 flex items-center justify-center shadow-[0_0_12px_rgba(59,130,246,0.3)]">
              <Search size={20} />
            </div>
            <span className="text-[11px] text-slate-300 font-medium">Recherche intelligente</span>
          </div>

          <div className="flex flex-col items-center gap-1.5 text-center">
            <div className="w-10 h-10 rounded-xl bg-indigo-950/60 border border-indigo-500/40 text-indigo-400 flex items-center justify-center shadow-[0_0_12px_rgba(99,102,241,0.3)]">
              <Highlighter size={20} />
            </div>
            <span className="text-[11px] text-slate-300 font-medium">Surlignage intégré</span>
          </div>

          <div className="flex flex-col items-center gap-1.5 text-center">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-400 flex items-center justify-center shadow-[0_0_12px_rgba(6,182,212,0.3)]">
              <Smartphone size={20} />
            </div>
            <span className="text-[11px] text-slate-300 font-medium">Compatible mobile</span>
          </div>
        </div>
      </div>
    </div>
  );
};
