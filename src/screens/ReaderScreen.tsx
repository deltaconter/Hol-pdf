import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChevronLeft,
  Bookmark,
  MoreVertical,
  ChevronRight,
  Search,
  Highlighter,
  Headphones,
  MoreHorizontal,
  Share2,
  Moon,
  Sun,
  ZoomIn,
  Check,
  Play,
  Pause,
  Volume2,
  Zap,
  Sparkles,
  UploadCloud,
  Layers,
  Eye,
  BookOpen,
  FileText,
  CloudRain,
  Flame,
  Coffee,
  Waves,
  Trees,
  Wind,
  MessageSquare,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { DocumentItem, AppScreen, VoiceOption, PageParagraph, UserProfile } from '../types';
import { getDocumentPageContent, getDocumentFullContext } from '../utils/documentPages';
import { getPageImage } from '../utils/documentStore';
import { continuousPlayback, ContinuousPlaybackState } from '../utils/continuousPlayback';
import { soundscapeEngine, SoundscapeType, SOUNDSCAPE_OPTIONS } from '../utils/soundscapeEngine';
import { SoundscapeModal } from '../components/SoundscapeModal';
import { AskTheBookModal } from '../components/AskTheBookModal';
import { PremiumModal } from '../components/PremiumModal';
import { voiceList } from '../data/mockData';

interface ReaderScreenProps {
  document?: DocumentItem | null;
  currentVoice?: VoiceOption;
  userProfile?: UserProfile;
  onUpdateUserProfile?: (updates: Partial<UserProfile>) => void;
  onBack: () => void;
  onNavigate: (screen: AppScreen) => void;
  onOpenAudio: (doc: DocumentItem) => void;
  onUpdateProgressPage?: (page: number) => void;
  onOpenUpload?: () => void;
}

export const ReaderScreen: React.FC<ReaderScreenProps> = ({
  document,
  currentVoice,
  userProfile,
  onUpdateUserProfile,
  onBack,
  onNavigate,
  onOpenAudio,
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
          <span className="text-xs font-bold text-slate-200">Lecteur</span>
          <div className="w-8" />
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-purple-950/60 border border-purple-800 flex items-center justify-center text-purple-400">
            <UploadCloud size={32} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">Aucun document sélectionné</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              Veuillez sélectionner ou importer un document pour commencer la lecture.
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
  const [isBookmarked, setIsBookmarked] = useState(document.isFavorite);
  const [showBookmarkToast, setShowBookmarkToast] = useState(false);
  const [highlightMode, setHighlightMode] = useState(false);
  const [activeHighlightColor, setActiveHighlightColor] = useState<'yellow' | 'cyan' | 'pink' | 'green'>('yellow');
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isReaderDarkMode, setIsReaderDarkMode] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [viewMode, setViewMode] = useState<'text' | 'pdf'>('text');

  // Active voice for in-reader reading
  const activeVoice = currentVoice || voiceList[0];

  // Auto-reading state from centralized engine
  const [isAutoReading, setIsAutoReading] = useState(false);
  const [readingParagraphIndex, setReadingParagraphIndex] = useState<number>(-1);
  const [readingSpeed, setReadingSpeed] = useState<number>(1.0);
  const [pageTransitionToast, setPageTransitionToast] = useState<string | null>(null);
  const [showSoundscapeModal, setShowSoundscapeModal] = useState(false);
  const [showAskTheBook, setShowAskTheBook] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [soundscapeType, setSoundscapeType] = useState<SoundscapeType>(soundscapeEngine.getCurrentType());

  useEffect(() => {
    return soundscapeEngine.subscribe((type) => {
      setSoundscapeType(type);
    });
  }, []);

  // Load current page dynamic content
  const pageContent = getDocumentPageContent(document, currentPage);
  const [paragraphs, setParagraphs] = useState<PageParagraph[]>(pageContent.paragraphs);
  const [pageImageUrl, setPageImageUrl] = useState<string | null>(pageContent.pageImageUrl || null);
  const [isLoadingPageImage, setIsLoadingPageImage] = useState(false);

  // Load page image dynamically from IndexedDB (or fallback to pageContent) and revoke Object URL on change
  useEffect(() => {
    let isMounted = true;
    let currentObjectUrl: string | null = null;

    async function loadImg() {
      if (!document?.id) return;
      setIsLoadingPageImage(true);
      try {
        const url = await getPageImage(document.id, currentPage);
        if (!isMounted) {
          if (url) URL.revokeObjectURL(url);
          return;
        }
        currentObjectUrl = url;
        setPageImageUrl(url || pageContent.pageImageUrl || null);
      } catch (err) {
        console.warn('Could not load page image from IndexedDB:', err);
      } finally {
        if (isMounted) setIsLoadingPageImage(false);
      }
    }

    loadImg();

    return () => {
      isMounted = false;
      if (currentObjectUrl) {
        URL.revokeObjectURL(currentObjectUrl);
      }
      setPageImageUrl(null);
    };
  }, [document?.id, currentPage, pageContent.pageImageUrl]);

  // Default to 'pdf' view mode if document has images or hasNoText
  useEffect(() => {
    if (document?.isOriginalPdf && (pageImageUrl || pageContent.hasNoText)) {
      setViewMode('pdf');
    }
  }, [pageImageUrl, pageContent.hasNoText, document?.isOriginalPdf]);

  // Ref to container for smooth auto-scroll to active reading paragraph
  const paragraphsContainerRef = useRef<HTMLDivElement>(null);
  const activeParagraphRef = useRef<HTMLParagraphElement>(null);
  const currentPageRef = useRef(currentPage);

  useEffect(() => {
    currentPageRef.current = currentPage;
  }, [currentPage]);

  // Synchronize with continuousPlayback engine
  useEffect(() => {
    // Notify on external page change
    continuousPlayback.setPageChangeCallback((newPage) => {
      setCurrentPage(newPage);
      onUpdateProgressPage?.(newPage);
      setPageTransitionToast(`Page ${newPage} enchaînée sans pause`);
      setTimeout(() => setPageTransitionToast(null), 2400);
    });

    const unsubscribe = continuousPlayback.subscribe((state: ContinuousPlaybackState) => {
      setIsAutoReading(state.isPlaying && !state.isPaused);
      setReadingParagraphIndex(state.isPlaying ? state.paragraphIndex : -1);
      setReadingSpeed(state.speed);
      if (state.isPlaying && state.page !== currentPageRef.current) {
        setCurrentPage(state.page);
        onUpdateProgressPage?.(state.page);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [onUpdateProgressPage]);

  // Keep paragraphs updated when currentPage or document changes
  useEffect(() => {
    const updated = getDocumentPageContent(document, currentPage);
    setParagraphs(updated.paragraphs);
  }, [currentPage, document.id]);

  // Scroll active reading paragraph into view softly
  useEffect(() => {
    if (isAutoReading && readingParagraphIndex >= 0 && activeParagraphRef.current) {
      activeParagraphRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [isAutoReading, readingParagraphIndex]);

  const toggleAutoReading = () => {
    if (isAutoReading) {
      continuousPlayback.stop();
    } else {
      continuousPlayback.start(
        document,
        activeVoice,
        currentPage,
        Math.max(0, readingParagraphIndex),
        readingSpeed
      );
    }
  };

  const handleParagraphClick = (idx: number, paraId: string) => {
    if (highlightMode) {
      toggleParagraphHighlight(paraId);
      return;
    }

    // Direct jump to this paragraph without interruption
    if (isAutoReading) {
      continuousPlayback.jumpToParagraph(idx);
    } else {
      continuousPlayback.start(document, activeVoice, currentPage, idx, readingSpeed);
    }
  };

  const toggleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    setShowBookmarkToast(true);
    setTimeout(() => setShowBookmarkToast(false), 2000);
  };

  const toggleParagraphHighlight = (id: string) => {
    setParagraphs((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const nextState = !p.isHighlighted;
          let colorClass = 'bg-yellow-300/90 text-slate-900 shadow-xs ring-1 ring-yellow-400/40';
          if (activeHighlightColor === 'cyan') {
            colorClass = 'bg-cyan-300/90 text-slate-900 shadow-xs ring-1 ring-cyan-400/40';
          } else if (activeHighlightColor === 'pink') {
            colorClass = 'bg-fuchsia-300/90 text-slate-900 shadow-xs ring-1 ring-fuchsia-400/40';
          } else if (activeHighlightColor === 'green') {
            colorClass = 'bg-emerald-300/90 text-slate-900 shadow-xs ring-1 ring-emerald-400/40';
          }
          return {
            ...p,
            isHighlighted: nextState,
            highlightColor: nextState ? colorClass : undefined,
          };
        }
        return p;
      })
    );
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      const prev = currentPage - 1;
      setCurrentPage(prev);
      onUpdateProgressPage?.(prev);
      if (isAutoReading) {
        continuousPlayback.jumpToPage(prev, 0);
      }
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      const next = currentPage + 1;
      setCurrentPage(next);
      onUpdateProgressPage?.(next);
      if (isAutoReading) {
        continuousPlayback.jumpToPage(next, 0);
      }
    }
  };

  const handleSpeedToggle = () => {
    const speeds = [1.0, 1.25, 1.5, 2.0];
    const nextIdx = (speeds.indexOf(readingSpeed) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    setReadingSpeed(nextSpeed);
    continuousPlayback.setSpeed(nextSpeed);
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-between bg-[#040612] text-white overflow-hidden select-none">
      {/* Reader Header */}
      <div className="px-4 py-2 flex items-center justify-between border-b border-slate-800/80 bg-[#080d1a]/95 backdrop-blur-md z-20">
        <button
          onClick={() => {
            continuousPlayback.stop();
            onBack();
          }}
          aria-label="Retour"
          className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
        >
          <ChevronLeft size={20} />
        </button>

        <div className="flex flex-col items-center">
          <h2 className="text-xs font-bold text-slate-100 max-w-[180px] truncate text-center">
            {document.title}
          </h2>
          <span className="text-[10px] text-slate-400 flex items-center gap-1">
            <span>Page {currentPage} / {totalPages}</span>
            {isAutoReading && (
              <span className="inline-flex items-center gap-1 text-red-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                Audio actif
              </span>
            )}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleBookmark}
            aria-label="Marque-page"
            className={`p-1.5 rounded-lg transition-colors ${
              isBookmarked
                ? 'text-red-400 hover:text-red-300'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Bookmark size={18} fill={isBookmarked ? 'currentColor' : 'none'} />
          </button>

          <button
            onClick={() => setShowOptionsMenu(!showOptionsMenu)}
            aria-label="Menu d'options"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
          >
            <MoreVertical size={18} />
          </button>
        </div>
      </div>

      {/* Floating Transition & Bookmark Toasts */}
      {pageTransitionToast && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-red-600 to-rose-600 text-white text-[11px] font-semibold px-4 py-1.5 rounded-full shadow-[0_4px_20px_rgba(239,68,68,0.5)] flex items-center gap-2 animate-pulse">
          <Zap size={13} className="text-amber-300" />
          <span>{pageTransitionToast}</span>
        </div>
      )}

      {showBookmarkToast && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white text-[11px] font-medium px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5 animate-bounce">
          <Check size={12} />
          <span>{isBookmarked ? 'Page ajoutée aux favoris' : 'Marque-page retiré'}</span>
        </div>
      )}

      {/* Options Dropdown Menu */}
      {showOptionsMenu && (
        <div className="absolute right-4 top-14 w-52 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-2 z-40 text-xs text-slate-200">
          <button
            onClick={() => {
              setIsReaderDarkMode(!isReaderDarkMode);
              setShowOptionsMenu(false);
            }}
            className="w-full px-2.5 py-1.5 text-left hover:bg-slate-800 rounded-lg flex items-center justify-between cursor-pointer"
          >
            <span className="flex items-center gap-2">
              {isReaderDarkMode ? <Sun size={14} /> : <Moon size={14} />}
              <span>{isReaderDarkMode ? 'Thème clair papier' : 'Mode nuit PDF'}</span>
            </span>
          </button>
          <div className="flex items-center justify-between px-2.5 py-1.5 hover:bg-slate-800 rounded-lg">
            <span className="flex items-center gap-2">
              <ZoomIn size={14} />
              <span>Zoom</span>
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setZoomLevel((z) => Math.max(80, z - 10))}
                className="w-5 h-5 rounded bg-slate-800 flex items-center justify-center text-xs cursor-pointer"
              >
                -
              </button>
              <span className="text-[10px]">{zoomLevel}%</span>
              <button
                onClick={() => setZoomLevel((z) => Math.min(140, z + 10))}
                className="w-5 h-5 rounded bg-slate-800 flex items-center justify-center text-xs cursor-pointer"
              >
                +
              </button>
            </div>
          </div>
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: document.title, text: `Page ${currentPage}` });
              }
              setShowOptionsMenu(false);
            }}
            className="w-full px-2.5 py-1.5 text-left hover:bg-slate-800 rounded-lg flex items-center gap-2 cursor-pointer"
          >
            <Share2 size={14} />
            <span>Partager cet extrait</span>
          </button>
        </div>
      )}

      {/* Auto-Reading Live Control Bar */}
      <div className="mx-4 mt-2 px-3 py-2 rounded-xl bg-slate-900/95 border border-slate-800 flex items-center justify-between text-xs z-10 shadow-sm">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={toggleAutoReading}
            className={`px-3 py-1.5 rounded-lg font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
              isAutoReading
                ? 'bg-red-600 text-white hover:bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.4)]'
                : 'bg-white text-slate-900 hover:bg-slate-100'
            }`}
          >
            {isAutoReading ? <Pause size={14} /> : <Play size={14} />}
            <span>{isAutoReading ? 'Pause audio' : 'Écouter la page'}</span>
          </button>

          <button
            type="button"
            onClick={handleSpeedToggle}
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-mono text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Vitesse de lecture"
          >
            {readingSpeed}x
          </button>

          <button
            type="button"
            onClick={() => setShowSoundscapeModal(true)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
              soundscapeType !== 'none'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-xs'
                : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
            title="Ambiance sonore d'immersion (Pluie, Feu, Café...)"
          >
            {soundscapeType === 'rain' && <CloudRain size={13} className="text-cyan-400" />}
            {soundscapeType === 'fireplace' && <Flame size={13} className="text-rose-400" />}
            {soundscapeType === 'cafe' && <Coffee size={13} className="text-amber-400" />}
            {soundscapeType === 'waves' && <Waves size={13} className="text-blue-400" />}
            {soundscapeType === 'forest' && <Trees size={13} className="text-emerald-400" />}
            {soundscapeType === 'whitenoise' && <Wind size={13} className="text-purple-400" />}
            {soundscapeType === 'none' && <CloudRain size={13} />}
            <span className="hidden sm:inline">
              {soundscapeType !== 'none'
                ? SOUNDSCAPE_OPTIONS.find((s) => s.id === soundscapeType)?.name
                : 'Ambiance'}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400 hidden sm:inline flex items-center gap-1">
            <Sparkles size={12} className="text-red-400" />
            <span>Enchaînement automatique :</span>
          </span>
          <span className="px-2 py-0.5 rounded-full bg-red-950/80 border border-red-800/60 text-[10px] text-red-300 font-medium">
            Sans pause
          </span>
        </div>
      </div>

      {/* Highlighter Color Picker Tray (when highlight mode is toggled) */}
      {highlightMode && (
        <div className="mx-4 mt-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-red-500/40 flex items-center justify-between text-xs text-slate-300">
          <span className="text-[11px] font-medium flex items-center gap-1.5 text-red-300">
            <Highlighter size={13} />
            <span>Touchez un paragraphe pour surligner :</span>
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveHighlightColor('yellow')}
              className={`w-5 h-5 rounded-full bg-yellow-400 border-2 ${
                activeHighlightColor === 'yellow' ? 'border-white scale-110' : 'border-transparent'
              }`}
              title="Jaune"
            />
            <button
              onClick={() => setActiveHighlightColor('cyan')}
              className={`w-5 h-5 rounded-full bg-cyan-400 border-2 ${
                activeHighlightColor === 'cyan' ? 'border-white scale-110' : 'border-transparent'
              }`}
              title="Cyan"
            />
            <button
              onClick={() => setActiveHighlightColor('pink')}
              className={`w-5 h-5 rounded-full bg-fuchsia-400 border-2 ${
                activeHighlightColor === 'pink' ? 'border-white scale-110' : 'border-transparent'
              }`}
              title="Rose"
            />
            <button
              onClick={() => setActiveHighlightColor('green')}
              className={`w-5 h-5 rounded-full bg-emerald-400 border-2 ${
                activeHighlightColor === 'green' ? 'border-white scale-110' : 'border-transparent'
              }`}
              title="Vert"
            />
          </div>
        </div>
      )}

      {/* View Mode Switcher for authentic PDF documents */}
      {(pageImageUrl || pageContent.pageImageUrl || pageContent.hasNoText || document?.isOriginalPdf) && (
        <div className="mx-4 mt-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-purple-500/30 flex items-center justify-between text-xs z-10 shadow-xs">
          <span className="text-[11px] text-purple-300 font-semibold flex items-center gap-1.5">
            <Layers size={13} />
            <span className="hidden sm:inline">Rendu du document :</span>
            <span className="sm:hidden">Affichage :</span>
          </span>
          <div className="flex items-center gap-1 bg-slate-950/80 p-0.5 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={() => setViewMode('pdf')}
              className={`px-2.5 py-1 rounded text-[11px] font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'pdf'
                  ? 'bg-purple-600 text-white font-bold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Afficher la page exacte du PDF original avec sa mise en page d'origine"
            >
              <FileText size={12} />
              <span>Page Réelle PDF</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('text')}
              className={`px-2.5 py-1 rounded text-[11px] font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'text'
                  ? 'bg-purple-600 text-white font-bold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Afficher le texte extrait avec outils de surlignage"
            >
              <BookOpen size={12} />
              <span>Texte & Surlignage</span>
            </button>
          </div>
        </div>
      )}

      {/* Document Page Canvas Container */}
      <div
        ref={paragraphsContainerRef}
        className="flex-1 overflow-y-auto px-4 py-3 flex justify-center items-start no-scrollbar"
      >
        <div
          style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
          className={`w-full max-w-3xl rounded-2xl p-4 sm:p-6 shadow-2xl transition-all duration-300 border ${
            isReaderDarkMode
              ? 'bg-[#0f1424] text-slate-200 border-slate-800'
              : 'bg-[#fafbfe] text-slate-800 border-slate-200/90'
          }`}
        >
          {viewMode === 'pdf' && (pageImageUrl || pageContent.pageImageUrl || pageContent.hasNoText) ? (
            /* Authentic PDF Page Mode */
            <div className="flex flex-col items-center w-full space-y-3">
              {/* Header badge with exact page number and document title */}
              <div className="w-full flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800 text-xs">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-purple-600/20 text-purple-600 dark:text-purple-300 font-bold text-[10px] border border-purple-500/30">
                    PAGE ORIGINALE DU PDF
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100 truncate max-w-xs">
                    {document.title}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-purple-600 dark:text-purple-300 font-bold bg-purple-100 dark:bg-purple-950/80 px-2 py-0.5 rounded-md border border-purple-200 dark:border-purple-800/60">
                  Page {currentPage} / {totalPages}
                </span>
              </div>

              {/* No-text notice banner */}
              {pageContent.hasNoText && (
                <div className="w-full p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-300 text-xs flex items-center justify-center gap-2 font-medium">
                  <AlertCircle size={15} className="shrink-0 text-amber-500" />
                  <span>Page sans texte (image ou scan) — non lue à voix haute</span>
                </div>
              )}

              {/* Exact High-Fidelity PDF Vector/Canvas Rendering */}
              <div className="relative w-full rounded-xl overflow-hidden shadow-xl border border-slate-300 dark:border-slate-700/80 bg-white">
                {isLoadingPageImage ? (
                  <div className="w-full h-80 flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-900 text-slate-400 gap-2">
                    <Loader2 size={24} className="animate-spin text-purple-500" />
                    <span className="text-[11px] font-mono">Chargement de la page...</span>
                  </div>
                ) : (pageImageUrl || pageContent.pageImageUrl) ? (
                  <img
                    src={pageImageUrl || pageContent.pageImageUrl}
                    alt={`Page ${currentPage} - ${document.title}`}
                    className="w-full h-auto object-contain block max-h-[75vh] mx-auto select-none"
                  />
                ) : (
                  <div className="w-full h-64 flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-900 text-slate-400 gap-2">
                    <FileText size={32} className="opacity-40" />
                    <span className="text-xs">Image de la page non disponible</span>
                  </div>
                )}
              </div>

              {/* Live Audio Narration Subtitle Bar during audio playback */}
              {isAutoReading && (
                <div className="w-full p-3 rounded-xl bg-slate-900/95 border border-purple-500/50 shadow-lg flex items-center justify-between gap-3 text-xs text-white animate-fadeIn">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="p-1 rounded-md bg-purple-600 text-white animate-pulse flex-shrink-0">
                      <Volume2 size={13} />
                    </span>
                    <p className="text-[11px] italic font-serif truncate text-slate-200">
                      &ldquo;{paragraphs[readingParagraphIndex]?.text || paragraphs[0]?.text}&rdquo;
                    </p>
                  </div>
                  <span className="text-[10px] text-purple-300 font-mono px-2 py-0.5 rounded bg-purple-950/80 border border-purple-800/50 flex-shrink-0">
                    § {readingParagraphIndex + 1}/{paragraphs.length}
                  </span>
                </div>
              )}

              {/* Bottom bar */}
              <div className="w-full pt-2 flex items-center justify-between text-[11px] text-slate-400 font-sans">
                <button
                  type="button"
                  onClick={() => setViewMode('text')}
                  className="text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                >
                  <BookOpen size={12} />
                  <span>Passer en mode texte & surlignage</span>
                </button>
                <span className="font-mono">Page {currentPage} sur {totalPages}</span>
              </div>
            </div>
          ) : (
            /* Structured Text Mode with Surlignage & Paragraph controls */
            <>
              {/* Chapter Top Graphic Banner */}
              <div className="rounded-xl overflow-hidden mb-5 bg-gradient-to-r from-red-950/80 via-slate-900 to-[#0c1020] p-4 border border-red-900/40 relative shadow-inner">
                <div className="relative z-10 flex items-center justify-between">
                  <div>
                    <span className="inline-block px-2 py-0.5 rounded-sm bg-red-600/30 border border-red-500/40 text-[9px] font-extrabold tracking-wider text-red-200 mb-1">
                      {pageContent.chapter}
                    </span>
                    <h1 className="text-sm font-extrabold tracking-tight text-white leading-tight">
                      {pageContent.chapterTitle}
                    </h1>
                    <p className="text-[11px] text-red-200/80 font-medium">
                      {pageContent.chapterSubtitle}
                    </p>
                  </div>

                  {/* PDF Page Graphic Badge */}
                  <div className="relative w-14 h-14 flex-shrink-0 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-xl bg-red-600/10 flex flex-col items-center justify-center border border-red-500/30 shadow-[0_0_12px_rgba(239,68,68,0.25)]">
                      <span className="text-[9px] font-bold text-red-400 uppercase">PAGE</span>
                      <span className="text-sm font-extrabold text-white">{currentPage}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Document Paragraphs with Real Highlighting or No-Text fallback */}
              {pageContent.hasNoText || paragraphs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center space-y-3">
                  {(pageImageUrl || pageContent.pageImageUrl) && (
                    <div className="relative w-full rounded-xl overflow-hidden shadow-xl border border-slate-300 dark:border-slate-700/80 bg-white mb-2">
                      <img
                        src={pageImageUrl || pageContent.pageImageUrl}
                        alt={`Page ${currentPage} - ${document.title}`}
                        className="w-full h-auto object-contain block max-h-[60vh] mx-auto select-none"
                      />
                    </div>
                  )}
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-300 text-xs font-medium">
                    <AlertCircle size={14} className="shrink-0 text-amber-500" />
                    <span>Page sans texte (image ou scan) — non lue à voix haute</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 text-xs leading-[1.7] font-serif">
                  {paragraphs.map((para, idx) => {
                  const isCurrentlyBeingRead = isAutoReading && readingParagraphIndex === idx;

                  return (
                    <p
                      key={para.id}
                      ref={isCurrentlyBeingRead ? activeParagraphRef : null}
                      onClick={() => handleParagraphClick(idx, para.id)}
                      className={`rounded-lg transition-all p-2 cursor-pointer relative ${
                        isCurrentlyBeingRead
                          ? 'bg-red-500/15 border-l-4 border-red-500 text-slate-900 dark:text-white shadow-sm ring-1 ring-red-500/30'
                          : para.isHighlighted
                          ? para.highlightColor ||
                            'bg-yellow-300/90 text-slate-900 shadow-xs ring-1 ring-yellow-400/40'
                          : isReaderDarkMode
                          ? 'hover:bg-slate-800/40'
                          : 'hover:bg-slate-100'
                      }`}
                      title={
                        highlightMode
                          ? 'Cliquez pour surligner'
                          : 'Cliquez pour écouter à partir de ce paragraphe'
                      }
                    >
                      {/* Live Sound wave indicator for current reading paragraph */}
                      {isCurrentlyBeingRead && (
                        <span className="inline-flex items-center gap-1 mr-2 px-1.5 py-0.5 rounded bg-red-600 text-white text-[9px] font-sans font-bold">
                          <Volume2 size={10} className="animate-pulse" />
                          Lecture
                        </span>
                      )}
                      {para.text}
                    </p>
                  );
                })}
              </div>
            )}

              {/* Page bottom indicator */}
              <div className="mt-8 pt-3 border-t border-slate-200/40 dark:border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400 font-sans">
                <span>{document.title}</span>
                <span className="font-mono">Page {currentPage} / {totalPages}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bottom Page Scrubber Controls ([<] [ 5/28 ] [>]) */}
      <div className="px-5 py-2 flex items-center justify-between gap-3 bg-[#080d1a] border-t border-slate-800/80 z-20">
        <button
          onClick={handlePrevPage}
          disabled={currentPage <= 1}
          aria-label="Page précédente"
          className="p-1.5 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <ChevronLeft size={18} />
        </button>

        <div className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full flex items-center gap-2">
            <input
              type="range"
              min={1}
              max={totalPages}
              value={currentPage}
              onChange={(e) => {
                const p = Number(e.target.value);
                setCurrentPage(p);
                onUpdateProgressPage?.(p);
                if (isAutoReading) {
                  continuousPlayback.jumpToPage(p, 0);
                }
              }}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-500"
            />
          </div>
          <span className="text-[10px] font-medium text-slate-400">
            Page {currentPage} sur {totalPages}
          </span>
        </div>

        <button
          onClick={handleNextPage}
          disabled={currentPage >= totalPages}
          aria-label="Page suivante"
          className="p-1.5 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Action Toolbar (Ask the Book, Rechercher, Surligner, Audio, Plus) */}
      <div className="w-full bg-[#0d111d] border-t border-slate-800/80 px-4 py-2 flex items-center justify-between z-20">
        <button
          onClick={() => setShowAskTheBook(true)}
          className="flex flex-col items-center gap-0.5 text-purple-400 hover:text-purple-300 drop-shadow-[0_0_8px_rgba(168,85,247,0.4)] transition-colors cursor-pointer"
        >
          <div className="relative">
            <MessageSquare size={18} />
            <Sparkles size={9} className="absolute -top-1 -right-1 text-amber-300 animate-pulse" />
          </div>
          <span className="text-[10px] font-bold">Ask the Book</span>
        </button>

        <button
          onClick={() => {
            continuousPlayback.stop();
            onNavigate('search');
          }}
          className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
        >
          <Search size={18} />
          <span className="text-[10px] font-medium">Rechercher</span>
        </button>

        <button
          onClick={() => setHighlightMode(!highlightMode)}
          className={`flex flex-col items-center gap-0.5 transition-colors cursor-pointer ${
            highlightMode
              ? 'text-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.5)]'
              : 'text-slate-400 hover:text-yellow-300'
          }`}
        >
          <Highlighter size={18} />
          <span className="text-[10px] font-medium">Surligner</span>
        </button>

        <button
          onClick={() => {
            onOpenAudio(document);
          }}
          className="flex flex-col items-center gap-0.5 text-red-400 hover:text-red-300 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)] transition-colors cursor-pointer"
        >
          <Headphones size={18} />
          <span className="text-[10px] font-medium">Lecteur audio</span>
        </button>

        <button
          onClick={() => setShowOptionsMenu(!showOptionsMenu)}
          className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <MoreHorizontal size={18} />
          <span className="text-[10px] font-medium">Plus</span>
        </button>
      </div>

      {/* Soundscape Immersion Modal */}
      <SoundscapeModal
        isOpen={showSoundscapeModal}
        onClose={() => setShowSoundscapeModal(false)}
      />

      {/* Ask the Book Conversational AI Modal */}
      <AskTheBookModal
        isOpen={showAskTheBook}
        onClose={() => setShowAskTheBook(false)}
        document={document}
        currentPage={currentPage}
        documentContext={getDocumentFullContext(document)}
        userProfile={userProfile}
        onJumpToPage={(p) => {
          setCurrentPage(p);
          onUpdateProgressPage?.(p);
        }}
        onOpenPremium={() => setShowPremiumModal(true)}
      />

      {/* Premium Paywall Modal */}
      <PremiumModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        userProfile={userProfile || ({ isPremium: false } as any)}
        onUpdateUserProfile={onUpdateUserProfile || (() => {})}
        customTitle="Ask the Book illimité"
        customDescription="Dialoguez sans limite avec votre livre, obtenez des citations textuelles directes et des explications personnalisées."
      />
    </div>
  );
};
