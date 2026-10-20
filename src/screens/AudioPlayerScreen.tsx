import React, { useState, useEffect, useRef } from 'react';
import {
  Settings,
  RotateCcw,
  RotateCw,
  Play,
  Pause,
  ChevronRight,
  ChevronLeft,
  FileText,
  Volume2,
  Gauge,
  User,
  BookOpen,
  Zap,
  Sparkles,
  UploadCloud,
  CloudRain,
  Flame,
  Coffee,
  Waves,
  Trees,
  Wind,
  MessageSquare,
} from 'lucide-react';
import { continuousPlayback, ContinuousPlaybackState } from '../utils/continuousPlayback';
import { getDocumentPageContent } from '../utils/documentPages';
import { soundscapeEngine, SoundscapeType, SOUNDSCAPE_OPTIONS } from '../utils/soundscapeEngine';
import { SoundscapeModal } from '../components/SoundscapeModal';
import { AdSenseBanner } from '../components/ads/AdSenseBanner';
import { DocumentItem, VoiceOption, AppScreen } from '../types';

interface AudioPlayerScreenProps {
  document?: DocumentItem | null;
  currentVoice: VoiceOption;
  onBack: () => void;
  onNavigate: (screen: AppScreen) => void;
  onOpenVoiceSelector: () => void;
  onOpenAskTheBook?: (doc: DocumentItem) => void;
  onUpdateProgressPage?: (page: number) => void;
  onOpenUpload?: () => void;
}

export const AudioPlayerScreen: React.FC<AudioPlayerScreenProps> = ({
  document,
  currentVoice,
  onBack,
  onNavigate,
  onOpenVoiceSelector,
  onOpenAskTheBook,
  onUpdateProgressPage,
  onOpenUpload,
}) => {
  if (!document) {
    return (
      <div className="relative w-full h-full flex flex-col justify-between bg-[#040612] text-white p-4 select-none">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-xs font-bold text-slate-200">Lecteur Audio</span>
          <div className="w-8" />
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-purple-950/60 border border-purple-800 flex items-center justify-center text-purple-400">
            <UploadCloud size={32} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">Aucun document à écouter</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              Veuillez sélectionner ou importer un document pour démarrer la synthèse vocale.
            </p>
          </div>
          {onOpenUpload && (
            <button
              onClick={onOpenUpload}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-xs"
            >
              Importer un document
            </button>
          )}
        </div>
      </div>
    );
  }

  const [currentPage, setCurrentPage] = useState(document.progressPage || 1);
  const totalPages = document.pagesCount || 28;

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentParagraphIndex, setCurrentParagraphIndex] = useState(0);
  const [speed, setSpeed] = useState(1.0);
  const [volume, setVolume] = useState(85);
  const [activeTab, setActiveTab] = useState<'audio' | 'page'>('audio');
  const [transitionMessage, setTransitionMessage] = useState<string | null>(null);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [showSoundscapeModal, setShowSoundscapeModal] = useState(false);
  const [soundscapeType, setSoundscapeType] = useState<SoundscapeType>(soundscapeEngine.getCurrentType());

  useEffect(() => {
    return soundscapeEngine.subscribe((type) => {
      setSoundscapeType(type);
    });
  }, []);

  // Load current page dynamic content
  const pageContent = getDocumentPageContent(document, currentPage);

  // Reference for active paragraph auto-scroll in 'page' tab
  const activeParagraphRef = useRef<HTMLParagraphElement>(null);

  const currentPageRef = useRef(currentPage);

  useEffect(() => {
    currentPageRef.current = currentPage;
  }, [currentPage]);

  useEffect(() => {
    continuousPlayback.setPageChangeCallback((newPage) => {
      setCurrentPage(newPage);
      onUpdateProgressPage?.(newPage);
      setTransitionMessage(`Page ${newPage} enchaînée sans pause`);
      setTimeout(() => setTransitionMessage(null), 2500);
    });

    const unsubscribe = continuousPlayback.subscribe((state: ContinuousPlaybackState) => {
      setIsPlaying(state.isPlaying && !state.isPaused);
      setCurrentParagraphIndex(state.paragraphIndex);
      setSpeed(state.speed);
      setProgressPercent(state.progressPercent);

      if (state.isPlaying && state.page !== currentPageRef.current) {
        setCurrentPage(state.page);
        onUpdateProgressPage?.(state.page);
      }
    });

    // Start playback immediately if idle
    const st = continuousPlayback.getState();
    if (!st.isPlaying) {
      continuousPlayback.start(document, currentVoice, currentPageRef.current, 0, speed, volume / 100);
    }

    return () => {
      unsubscribe();
    };
  }, [document.id, currentVoice.id, onUpdateProgressPage]);

  // Auto scroll to active paragraph if in 'page' tab
  useEffect(() => {
    if (activeTab === 'page' && activeParagraphRef.current) {
      activeParagraphRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeTab, currentParagraphIndex]);

  const togglePlayPause = () => {
    continuousPlayback.togglePlayPause();
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      const prev = currentPage - 1;
      setCurrentPage(prev);
      onUpdateProgressPage?.(prev);
      continuousPlayback.jumpToPage(prev, 0);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      const next = currentPage + 1;
      setCurrentPage(next);
      onUpdateProgressPage?.(next);
      continuousPlayback.jumpToPage(next, 0);
    }
  };

  const handleRewind10 = () => {
    continuousPlayback.previousParagraph();
  };

  const handleForward10 = () => {
    continuousPlayback.nextParagraph();
  };

  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed);
    continuousPlayback.setSpeed(newSpeed);
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    continuousPlayback.setVolume(newVolume / 100);
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-between bg-[#040612] text-white overflow-hidden select-none">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[320px] h-[320px] bg-red-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <div className="px-4 py-2 flex items-center justify-between border-b border-slate-800/80 bg-[#080d1a]/95 backdrop-blur-md z-20">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              continuousPlayback.stop();
              onBack();
            }}
            aria-label="Retour au lecteur"
            className="p-1 rounded-lg text-slate-300 hover:text-white cursor-pointer"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-100">Lecture audio continue</span>
            <span className="text-[10px] text-red-400 font-medium flex items-center gap-1">
              <Sparkles size={10} />
              Enchaînement automatique des pages
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowSoundscapeModal(true)}
            aria-label="Ambiance sonore"
            className={`px-2 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 text-xs ${
              soundscapeType !== 'none'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.3)] animate-pulse'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
            }`}
            title="Ambiance sonore d'immersion (Pluie, Feu, Café...)"
          >
            {soundscapeType === 'rain' && <CloudRain size={16} className="text-cyan-400" />}
            {soundscapeType === 'fireplace' && <Flame size={16} className="text-rose-400" />}
            {soundscapeType === 'cafe' && <Coffee size={16} className="text-amber-400" />}
            {soundscapeType === 'waves' && <Waves size={16} className="text-blue-400" />}
            {soundscapeType === 'forest' && <Trees size={16} className="text-emerald-400" />}
            {soundscapeType === 'whitenoise' && <Wind size={16} className="text-purple-400" />}
            {soundscapeType === 'none' && <CloudRain size={16} />}
            <span className="text-[10px] hidden sm:inline font-medium">
              {soundscapeType !== 'none' ? 'Ambiance active' : 'Ambiance'}
            </span>
          </button>

          {/* Ask the Book button */}
          <button
            onClick={() => {
              continuousPlayback.stop();
              setIsPlaying(false);
              if (onOpenAskTheBook && document) {
                onOpenAskTheBook(document);
              } else {
                onNavigate('reader');
              }
            }}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/35 text-purple-300 border border-purple-500/40 transition-all cursor-pointer shadow-xs"
            title="Poser une question au livre avec l'IA conversationnelle Ask the Book"
          >
            <MessageSquare size={14} className="text-purple-400" />
            <span className="text-[10px] font-bold hidden sm:inline">Ask the Book</span>
            <Sparkles size={10} className="text-amber-300 animate-pulse" />
          </button>

          <button
            onClick={onOpenVoiceSelector}
            aria-label="Paramètres de voix"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
          >
            <Settings size={18} />
          </button>
        </div>
      </div>

      {/* Seamless transition banner */}
      {transitionMessage && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-red-600 to-rose-600 text-white text-[11px] font-semibold px-4 py-1.5 rounded-full shadow-[0_4px_20px_rgba(239,68,68,0.5)] flex items-center gap-2 animate-pulse">
          <Zap size={13} className="text-amber-300" />
          <span>{transitionMessage}</span>
        </div>
      )}

      {/* Main Player Content */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 no-scrollbar z-10 flex flex-col justify-between">
        <div className="max-w-2xl w-full mx-auto space-y-3.5">
          {/* Document & Page Navigation Pill */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/70 border border-slate-800">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-red-600/20 text-red-400 border border-red-500/30 flex items-center justify-center flex-shrink-0">
                <FileText size={16} />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs font-semibold text-slate-100 truncate">
                  {document.title}
                </h3>
                <p className="text-[10px] text-slate-400">
                  {document.fileSize} • Page {currentPage} sur {totalPages}
                </p>
              </div>
            </div>

            {/* Quick Page Jumper */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={handlePrevPage}
                disabled={currentPage <= 1}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 cursor-pointer"
                title="Page précédente"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-[11px] font-mono text-red-400 font-bold">
                {currentPage}/{totalPages}
              </span>
              <button
                onClick={handleNextPage}
                disabled={currentPage >= totalPages}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 cursor-pointer"
                title="Page suivante"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {activeTab === 'audio' ? (
            /* Cover Artwork / Visual Mode */
            <div className="space-y-3">
              <div className="relative mx-auto w-full max-w-[270px] aspect-square rounded-2xl overflow-hidden border border-red-500/30 shadow-[0_0_35px_rgba(239,68,68,0.2)] bg-gradient-to-b from-red-950/60 via-slate-900 to-[#060a1a] flex flex-col items-center justify-between p-4">
                {pageContent.pageImageUrl && (
                  <div className="absolute inset-0 overflow-hidden">
                    <img
                      src={pageContent.pageImageUrl}
                      alt={`Page ${currentPage}`}
                      className="w-full h-full object-cover opacity-35 filter blur-[1px]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-[#060a1a]/80 via-[#060a1a]/70 to-[#060a1a]/95" />
                  </div>
                )}
                {/* Neon corner accents */}
                <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-red-500/60" />
                <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-rose-400/60" />

                {/* Chapter Text Banner */}
                <div className="text-center z-10">
                  <span className="inline-block px-2 py-0.5 rounded-xs bg-red-600/30 border border-red-400/30 text-[9px] font-bold text-red-200">
                    {pageContent.chapter}
                  </span>
                  <h2 className="text-xs font-black tracking-wider text-white mt-1">
                    {pageContent.chapterTitle}
                  </h2>
                  <p className="text-[10px] text-red-200/80 font-medium">
                    {pageContent.chapterSubtitle}
                  </p>
                </div>

                {/* Glowing Center Badge */}
                <div className="relative w-24 h-24 flex items-center justify-center">
                  <div
                    className={`w-20 h-20 rounded-2xl bg-red-600/10 flex flex-col items-center justify-center border border-red-500/40 shadow-[0_0_20px_rgba(239,68,68,0.3)] transition-all ${
                      isPlaying ? 'scale-105 ring-2 ring-red-500/40 animate-pulse' : ''
                    }`}
                  >
                    <span className="text-[10px] font-bold text-red-400 uppercase">PAGE</span>
                    <span className="text-2xl font-black text-white">{currentPage}</span>
                    <span className="text-[9px] text-slate-400">/ {totalPages}</span>
                  </div>
                </div>

                {/* Active paragraph subtitle */}
                <div className="w-full text-center z-10 px-2">
                  <p className="text-[10px] text-slate-300 line-clamp-2 italic font-serif">
                    &ldquo;{pageContent.paragraphs[currentParagraphIndex]?.text || 'Lecture en cours...'}&rdquo;
                  </p>
                </div>
              </div>

              {/* Progress info badge */}
              <div className="flex items-center justify-between px-2 text-[11px] text-slate-400 font-medium">
                <span className="flex items-center gap-1.5 text-red-400">
                  <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-red-500 animate-ping' : 'bg-slate-600'}`} />
                  <span>Paragraphe {currentParagraphIndex + 1} sur {pageContent.paragraphs.length}</span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-red-950/60 border border-red-800/40 text-red-300 text-[10px]">
                  Enchaînement auto actif
                </span>
              </div>
            </div>
          ) : (
            /* Page Text Mode with Live Paragraph Highlighting */
            <div className="rounded-2xl bg-[#0f1424] border border-slate-800 p-4 max-h-[300px] overflow-y-auto no-scrollbar space-y-3">
              <div className="border-b border-slate-800 pb-2 mb-2">
                <span className="text-[10px] font-bold text-red-400 uppercase">
                  {pageContent.chapter} • Page {currentPage}
                </span>
                <h4 className="text-xs font-bold text-white">{pageContent.chapterTitle}</h4>
              </div>

              {pageContent.paragraphs.map((p, idx) => {
                const isActive = idx === currentParagraphIndex;
                return (
                  <p
                    key={p.id}
                    ref={isActive ? activeParagraphRef : null}
                    onClick={() => {
                      continuousPlayback.jumpToParagraph(idx);
                    }}
                    className={`text-xs leading-[1.65] p-2 rounded-lg transition-all cursor-pointer ${
                      isActive
                        ? 'bg-red-500/20 border-l-4 border-red-500 text-white font-medium shadow-sm'
                        : 'text-slate-300 hover:bg-slate-800/50'
                    }`}
                  >
                    {isActive && (
                      <span className="inline-flex items-center gap-1 mr-1.5 px-1 rounded bg-red-600 text-[9px] font-bold">
                        <Volume2 size={9} /> Actif
                      </span>
                    )}
                    {p.text}
                  </p>
                );
              })}
            </div>
          )}

          {/* Global document reading progress bar synced in real-time */}
          <div className="space-y-1 px-1">
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
              <span>Progression globale document</span>
              <span className="font-mono text-red-400 font-bold">{progressPercent}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red-600 to-rose-500 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Central Playback Controls (↺10, Play/Pause, ↻10) */}
          <div className="flex items-center justify-center gap-6 pt-1">
            <button
              onClick={handleRewind10}
              className="p-3 rounded-full text-slate-300 hover:text-white hover:bg-slate-800/60 active:scale-95 transition-all flex flex-col items-center cursor-pointer"
              title="Paragraphe précédent"
            >
              <RotateCcw size={22} />
              <span className="text-[9px] font-bold mt-0.5">Préc</span>
            </button>

            {/* Big Play/Pause Button with Red Neon Halo */}
            <button
              onClick={togglePlayPause}
              className="w-16 h-16 rounded-full bg-gradient-to-tr from-red-600 via-rose-600 to-red-500 flex items-center justify-center text-white shadow-[0_0_30px_rgba(239,68,68,0.5)] active:scale-95 transition-transform border border-red-400/40 cursor-pointer"
              aria-label={isPlaying ? 'Mettre en pause' : 'Lire'}
            >
              {isPlaying ? (
                <Pause size={28} fill="currentColor" />
              ) : (
                <Play size={28} fill="currentColor" className="ml-1" />
              )}
            </button>

            <button
              onClick={handleForward10}
              className="p-3 rounded-full text-slate-300 hover:text-white hover:bg-slate-800/60 active:scale-95 transition-all flex flex-col items-center cursor-pointer"
              title="Paragraphe suivant"
            >
              <RotateCw size={22} />
              <span className="text-[9px] font-bold mt-0.5">Suiv</span>
            </button>
          </div>

          {/* Audio Configuration Sliders & Voice Row */}
          <div className="space-y-2 pt-1">
            {/* Voice Selector row */}
            <button
              onClick={onOpenVoiceSelector}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-[#0e1322] border border-slate-800 hover:border-red-500/40 transition-colors text-xs cursor-pointer"
            >
              <div className="flex items-center gap-2.5 text-slate-300">
                <User size={15} className="text-red-400" />
                <span>Voix de lecture</span>
              </div>
              <div className="flex items-center gap-1.5 text-red-300 font-medium">
                <span>{currentVoice.name}</span>
                <ChevronRight size={14} />
              </div>
            </button>

            {/* Soundscape Selector row */}
            <button
              onClick={() => setShowSoundscapeModal(true)}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-[#0e1322] border border-slate-800 hover:border-cyan-500/40 transition-colors text-xs cursor-pointer group"
            >
              <div className="flex items-center gap-2.5 text-slate-300">
                <CloudRain size={15} className="text-cyan-400 group-hover:scale-110 transition-transform" />
                <span>Ambiance sonore (Pluie, Feu, Café...)</span>
              </div>
              <div className="flex items-center gap-1.5 text-cyan-300 font-medium">
                <span>{SOUNDSCAPE_OPTIONS.find((s) => s.id === soundscapeType)?.name || 'Aucune'}</span>
                <ChevronRight size={14} />
              </div>
            </button>

            {/* Speed slider */}
            <div className="p-2.5 rounded-xl bg-[#0e1322] border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <Gauge size={14} className="text-amber-400" />
                  <span>Vitesse de lecture</span>
                </div>
                <span className="text-red-300 font-mono font-medium">{speed.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min={0.7}
                max={2.0}
                step={0.1}
                value={speed}
                onChange={(e) => handleSpeedChange(Number(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-500"
              />
            </div>

            {/* Volume slider */}
            <div className="p-2.5 rounded-xl bg-[#0e1322] border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <Volume2 size={14} className="text-red-400" />
                  <span>Volume</span>
                </div>
                <span className="text-red-300 font-mono font-medium">{volume}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={volume}
                onChange={(e) => handleVolumeChange(Number(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-500"
              />
            </div>

            {/* AdSense Native Banner: Audio player compact (automatically hidden for Premium) */}
            <AdSenseBanner slot="audio-player" format="compact" className="my-1" />
          </div>
        </div>
      </div>

      {/* Bottom Segmented Toggle: [▶ Audio] [📖 Texte de la page] */}
      <div className="p-3 bg-[#080d1a] border-t border-slate-800/80 z-20">
        <div className="max-w-2xl mx-auto flex gap-2">
          <button
            onClick={() => setActiveTab('audio')}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'audio'
                ? 'bg-red-600 text-white shadow-[0_2px_12px_rgba(239,68,68,0.4)]'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            <Play size={13} fill="currentColor" />
            <span>Lecteur visuel</span>
          </button>

          <button
            onClick={() => setActiveTab('page')}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'page'
                ? 'bg-red-600 text-white shadow-[0_2px_12px_rgba(239,68,68,0.4)]'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen size={14} />
            <span>Texte suivi en direct</span>
          </button>
        </div>
      </div>

      {/* Soundscape Immersion Modal */}
      <SoundscapeModal
        isOpen={showSoundscapeModal}
        onClose={() => setShowSoundscapeModal(false)}
      />
    </div>
  );
};
