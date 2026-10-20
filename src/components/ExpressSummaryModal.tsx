import React, { useState } from 'react';
import { X, Sparkles, Volume2, Play, Pause, Check, Crown, Loader2, ArrowRight, AlertCircle, RotateCw } from 'lucide-react';
import { DocumentItem, VoiceOption } from '../types';
import { geminiService } from '../utils/geminiService';

interface ExpressSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentItem;
  currentVoice?: VoiceOption;
  isPremium: boolean;
  onOpenPaywall: () => void;
}

export const ExpressSummaryModal: React.FC<ExpressSummaryModalProps> = ({
  isOpen,
  onClose,
  document,
  currentVoice,
  isPremium,
  onOpenPaywall,
}) => {
  // Extract or generate available chapters for the document
  const availableChapters = React.useMemo(() => {
    return [
      { id: 'ch-1', title: 'Chapitre 1 : Les Fondements & Découvertes Initiales' },
      { id: 'ch-2', title: 'Chapitre 2 : Principes Clés et Architecture' },
      { id: 'ch-3', title: 'Chapitre 3 : Mise en Pratique & Retours d’Expérience' },
      { id: 'ch-4', title: 'Chapitre 4 : Perspectives & Nouveaux Horizons' },
    ];
  }, []);

  const [selectedChapterIds, setSelectedChapterIds] = useState<string[]>([availableChapters[0].id]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSummary, setGeneratedSummary] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleChapter = (id: string) => {
    if (selectedChapterIds.includes(id)) {
      if (selectedChapterIds.length > 1) {
        setSelectedChapterIds(selectedChapterIds.filter((chId) => chId !== id));
      }
    } else {
      if (selectedChapterIds.length < 2) {
        setSelectedChapterIds([...selectedChapterIds, id]);
      } else {
        // Swap to latest selection keeping max 2
        setSelectedChapterIds([selectedChapterIds[1], id]);
      }
    }
  };

  const handleGenerateSummary = async () => {
    if (!isPremium) {
      onOpenPaywall();
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);
    geminiService.stopAudio();
    setIsPlayingAudio(false);

    const chapterTitles = availableChapters
      .filter((c) => selectedChapterIds.includes(c.id))
      .map((c) => c.title);

    const fullContent = (document.pages || [])
      .map((p) => p.paragraphs.map((para) => para.text).join(' '))
      .join('\n\n') || document.content.paragraphs.map((p) => p.text).join(' ');

    const result = await geminiService.generateExpressSummary({
      documentTitle: document.title,
      chapters: chapterTitles,
      content: fullContent,
    });

    if (result.success && result.summary) {
      setGeneratedSummary(result.summary);
      setErrorMessage(null);
    } else {
      setGeneratedSummary(null);
      setErrorMessage(result.error || "Le service IA est momentanément indisponible");
    }
    setIsGenerating(false);
  };

  const handleToggleAudio = () => {
    if (isPlayingAudio) {
      geminiService.stopAudio();
      setIsPlayingAudio(false);
    } else {
      if (!generatedSummary) return;
      setIsPlayingAudio(true);
      const voiceName = currentVoice?.name.split(' ')[0] || 'Kore';
      geminiService.playAudio(generatedSummary, voiceName, () => {
        setIsPlayingAudio(false);
      });
    }
  };

  const handleClose = () => {
    geminiService.stopAudio();
    setIsPlayingAudio(false);
    onClose();
  };

  return (
    <div
      id="express-summary-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn select-none overflow-y-auto"
    >
      <div className="relative w-full max-w-xl rounded-3xl bg-white dark:bg-[#0c1122] border border-slate-200 dark:border-purple-900/40 shadow-2xl overflow-hidden flex flex-col my-auto max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/80 dark:bg-[#0f152b]/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-purple-600 flex items-center justify-center text-white shadow-xs">
              <Sparkles size={16} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Mode Express</h3>
                <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-[10px]">
                  Gemini HD
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-xs">
                Condensé vocal sur-mesure • {document.title}
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            aria-label="Fermer"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 no-scrollbar flex-1">
          {/* Chapter Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 dark:text-slate-200">
                Sélectionnez 1 ou 2 chapitres à résumer :
              </label>
              <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400">
                {selectedChapterIds.length}/2 sélectionnés
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {availableChapters.map((chapter) => {
                const isSelected = selectedChapterIds.includes(chapter.id);
                return (
                  <div
                    key={chapter.id}
                    onClick={() => toggleChapter(chapter.id)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex items-start gap-2.5 ${
                      isSelected
                        ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-500 text-purple-950 dark:text-purple-200 ring-1 ring-purple-500/40'
                        : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-md border mt-0.5 flex items-center justify-center flex-shrink-0 transition-colors ${
                        isSelected
                          ? 'border-purple-600 bg-purple-600 text-white'
                          : 'border-slate-400 dark:border-slate-600'
                      }`}
                    >
                      {isSelected && <Check size={11} strokeWidth={3} />}
                    </div>
                    <span className="text-xs font-medium leading-snug line-clamp-2">
                      {chapter.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Error Message & Retry */}
          {errorMessage && !isGenerating && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 space-y-3 animate-fadeIn">
              <div className="flex items-center gap-2 text-xs font-semibold">
                <AlertCircle size={16} className="flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
              <button
                type="button"
                onClick={handleGenerateSummary}
                className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCw size={13} />
                <span>Réessayer</span>
              </button>
            </div>
          )}

          {/* Action Button: Generate */}
          {!generatedSummary && (
            <div className="pt-2">
              <button
                onClick={handleGenerateSummary}
                disabled={isGenerating}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-amber-500 hover:from-purple-500 hover:to-amber-400 text-white font-bold text-xs tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-purple-600/25 active:scale-[0.98] transition-all disabled:opacity-75 cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Gemini analyse les chapitres...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Générer le condensé vocal express</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Generated Summary Box */}
          {generatedSummary && (
            <div className="p-4 rounded-2xl bg-purple-50/70 dark:bg-slate-900/90 border border-purple-200 dark:border-purple-800/60 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-purple-200/60 dark:border-purple-800/40 pb-2">
                <span className="text-xs font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                  <Sparkles size={14} />
                  Condensé Express généré par Gemini
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  Temps d'écoute estimé : ~1 min 30
                </span>
              </div>

              <div className="text-xs leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-line max-h-56 overflow-y-auto pr-1">
                {generatedSummary}
              </div>

              {/* Audio Listen Bar */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
                <button
                  onClick={handleToggleAudio}
                  className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-purple-600/25"
                >
                  {isPlayingAudio ? (
                    <>
                      <Pause size={15} fill="currentColor" />
                      <span>Mettre en pause l'écoute</span>
                    </>
                  ) : (
                    <>
                      <Play size={15} fill="currentColor" />
                      <span>Écouter le condensé en Voix HD</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleGenerateSummary}
                  disabled={isGenerating}
                  className="w-full sm:w-auto py-2.5 px-3 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Sparkles size={13} />
                  <span>Régénérer</span>
                </button>
              </div>
            </div>
          )}

          {/* Premium callout if user is not premium */}
          {!isPremium && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 text-xs">
                <Crown size={15} className="fill-amber-500 text-amber-500" />
                <span>Fonctionnalité exclusive aux membres Premium</span>
              </div>
              <button
                onClick={onOpenPaywall}
                className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition-colors whitespace-nowrap"
              >
                Débloquer
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
