import React from 'react';
import { Home, Library, Plus, Clock, User } from 'lucide-react';
import { AppScreen } from '../types';

interface NavigationProps {
  currentScreen: AppScreen;
  onNavigate: (screen: AppScreen) => void;
  onOpenUpload: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentScreen,
  onNavigate,
  onOpenUpload,
}) => {
  const isTabActive = (tab: AppScreen) => currentScreen === tab;

  return (
    <div className="w-full bg-white/95 dark:bg-[#0d111d]/90 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800/80 px-4 py-2 z-30 transition-colors shadow-sm">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        {/* Accueil */}
        <button
          onClick={() => onNavigate('home')}
          className={`flex flex-col items-center gap-1 transition-all duration-200 py-1 px-2.5 rounded-xl ${
            isTabActive('home')
              ? 'text-purple-600 dark:text-purple-400 font-semibold drop-shadow-xs dark:drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Home size={20} strokeWidth={isTabActive('home') ? 2.4 : 1.8} />
          <span className="text-[10px] font-medium tracking-tight">Accueil</span>
        </button>

        {/* Bibliothèque */}
        <button
          onClick={() => onNavigate('library')}
          className={`flex flex-col items-center gap-1 transition-all duration-200 py-1 px-2.5 rounded-xl ${
            isTabActive('library')
              ? 'text-purple-600 dark:text-purple-400 font-semibold drop-shadow-xs dark:drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Library size={20} strokeWidth={isTabActive('library') ? 2.4 : 1.8} />
          <span className="text-[10px] font-medium tracking-tight">Bibliothèque</span>
        </button>

        {/* Central Floating Plus Action Button */}
        <button
          onClick={onOpenUpload}
          aria-label="Importer un document"
          className="relative -top-2 w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 p-[1.5px] shadow-[0_4px_16px_rgba(129,140,248,0.5)] active:scale-95 transition-transform flex items-center justify-center group"
        >
          <div className="w-full h-full rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white">
            <Plus size={24} strokeWidth={2.5} className="group-hover:rotate-90 transition-transform duration-300" />
          </div>
        </button>

        {/* Historique */}
        <button
          onClick={() => onNavigate('history')}
          className={`flex flex-col items-center gap-1 transition-all duration-200 py-1 px-2.5 rounded-xl ${
            isTabActive('history')
              ? 'text-purple-600 dark:text-purple-400 font-semibold drop-shadow-xs dark:drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Clock size={20} strokeWidth={isTabActive('history') ? 2.4 : 1.8} />
          <span className="text-[10px] font-medium tracking-tight">Historique</span>
        </button>

        {/* Profil */}
        <button
          onClick={() => onNavigate('profile')}
          className={`flex flex-col items-center gap-1 transition-all duration-200 py-1 px-2.5 rounded-xl ${
            isTabActive('profile')
              ? 'text-purple-600 dark:text-purple-400 font-semibold drop-shadow-xs dark:drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <User size={20} strokeWidth={isTabActive('profile') ? 2.4 : 1.8} />
          <span className="text-[10px] font-medium tracking-tight">Profil</span>
        </button>
      </div>
    </div>
  );
};
