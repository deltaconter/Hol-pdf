import React, { useState } from 'react';
import { X, Sparkles, Volume2, Play, Pause, Crown, Loader2, Send, Lightbulb, AlertCircle, RotateCw } from 'lucide-react';
import { VoiceOption } from '../types';
import { geminiService } from '../utils/geminiService';

interface ConceptExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedText: string;
  documentTitle?: string;
  currentVoice?: VoiceOption;
  isPremium: boolean;
  onOpenPaywall: () => void;
}

export const ConceptExplanationModal: React.FC<ConceptExplanationModalProps> = ({
  isOpen,
  onClose,
  selectedText,
  documentTitle = 'ce document',
  currentVoice,
  isPremium,
  onOpenPaywall,
}) => {
  const [customQuestion, setCustomQuestion] = useState(
    'Explique-moi ce concept simplement avec une analogie claire de la vie quotidienne.'
  );
  const [isExplaining, setIsExplaining] = useState(false);
  const [explanationResult, setExplanationResult] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  if (!isOpen) return null;

  const handleAsk = async (questionToAsk?: string) => {
    if (!isPremium) {
      onOpenPaywall();
      return;
    }

    const q = questionToAsk || customQuestion;
    setIsExplaining(true);
    setErrorMessage(null);
    geminiService.stopAudio();
    setIsPlayingAudio(false);

    const result = await geminiService.explainConcept({
      text: selectedText,
      documentTitle,
      customQuestion: q,
    });

    if (result.success && result.explanation) {
      setExplanationResult(result.explanation);
      setErrorMessage(null);
    } else {
      setExplanationResult(null);
      setErrorMessage(result.error || "Le service IA est momentanément indisponible");
    }
    setIsExplaining(false);
  };

  const handleToggleAudio = () => {
    if (isPlayingAudio) {
      geminiService.stopAudio();
      setIsPlayingAudio(false);
    } else {
      if (!explanationResult) return;
      setIsPlayingAudio(true);
      const voiceName = currentVoice?.name.split(' ')[0] || 'Kore';
      geminiService.playAudio(explanationResult, voiceName, () => {
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
      id="concept-explanation-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn select-none overflow-y-auto"
    >
      <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-[#0c1122] border border-slate-200 dark:border-purple-900/40 shadow-2xl overflow-hidden flex flex-col my-auto max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/80 dark:bg-[#0f152b]/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Lightbulb size={16} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Ask the Book</h3>
                <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 font-bold text-[10px]">
                  Tuteur IA
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Explication de passage & analogies claires
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

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 no-scrollbar flex-1">
          {/* Passage Cité */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Passage sélectionné :
            </span>
            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900/80 border-l-4 border-purple-500 text-xs italic text-slate-800 dark:text-slate-300 leading-relaxed max-h-28 overflow-y-auto">
              « {selectedText} »
            </div>
          </div>

          {/* Quick Prompts */}
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => {
                const q = 'Explique-moi ce concept simplement avec une analogie claire.';
                setCustomQuestion(q);
                handleAsk(q);
              }}
              className="px-2.5 py-1 rounded-full bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 dark:hover:bg-purple-900/60 border border-purple-200 dark:border-purple-800/60 text-purple-700 dark:text-purple-300 text-[11px] font-medium transition-colors"
            >
              💡 Analogie claire
            </button>
            <button
              onClick={() => {
                const q = 'Pourquoi ce point est-il important dans la pratique ?';
                setCustomQuestion(q);
                handleAsk(q);
              }}
              className="px-2.5 py-1 rounded-full bg-cyan-50 dark:bg-cyan-950/50 hover:bg-cyan-100 dark:hover:bg-cyan-900/60 border border-cyan-200 dark:border-cyan-800/60 text-cyan-700 dark:text-cyan-300 text-[11px] font-medium transition-colors"
            >
              🎯 Pourquoi c'est important ?
            </button>
            <button
              onClick={() => {
                const q = 'Résume l’idée clé en une seule phrase mémorisable.';
                setCustomQuestion(q);
                handleAsk(q);
              }}
              className="px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800/60 text-amber-700 dark:text-amber-300 text-[11px] font-medium transition-colors"
            >
              ⚡ Idée en 1 phrase
            </button>
          </div>

          {/* Error Message & Retry */}
          {errorMessage && !isExplaining && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 space-y-3 animate-fadeIn">
              <div className="flex items-center gap-2 text-xs font-semibold">
                <AlertCircle size={16} className="flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => handleAsk()}
                className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCw size={13} />
                <span>Réessayer</span>
              </button>
            </div>
          )}

          {/* Input or Ask Button */}
          {!explanationResult && (
            <div className="space-y-2">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={customQuestion}
                  onChange={(e) => setCustomQuestion(e.target.value)}
                  placeholder="Posez votre question sur ce passage..."
                  className="w-full pl-3 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-purple-500 transition-colors"
                />
                <button
                  onClick={() => handleAsk()}
                  disabled={isExplaining || !customQuestion.trim()}
                  className="absolute right-2 p-1.5 rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 transition-colors"
                >
                  <Send size={13} />
                </button>
              </div>

              <button
                onClick={() => handleAsk()}
                disabled={isExplaining}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 active:scale-[0.98] transition-all disabled:opacity-75 cursor-pointer"
              >
                {isExplaining ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Gemini prépare l'explication...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Explique-moi ce concept simplement</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Error Message & Retry */}
          {errorMessage && !isExplaining && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-between gap-3 animate-fadeIn">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-xs">
                <AlertCircle size={16} className="shrink-0 text-red-500" />
                <span>{errorMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => handleAsk()}
                className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                <RotateCw size={13} />
                <span>Réessayer</span>
              </button>
            </div>
          )}

          {/* Explanation Output */}
          {explanationResult && (
            <div className="p-4 rounded-2xl bg-cyan-50/70 dark:bg-slate-900/90 border border-cyan-200 dark:border-cyan-800/60 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-cyan-200/60 dark:border-cyan-800/40 pb-2">
                <span className="text-xs font-bold text-cyan-800 dark:text-cyan-300 flex items-center gap-1.5">
                  <Lightbulb size={14} />
                  Explication avec analogie
                </span>
                <span className="text-[10px] text-slate-500">Gemini IA</span>
              </div>

              <div className="text-xs leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-line max-h-56 overflow-y-auto pr-1">
                {explanationResult}
              </div>

              {/* Audio Listen Bar */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
                <button
                  onClick={handleToggleAudio}
                  className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-cyan-600/25"
                >
                  {isPlayingAudio ? (
                    <>
                      <Pause size={15} fill="currentColor" />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <Volume2 size={15} />
                      <span>Écouter l'explication en audio</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => setExplanationResult(null)}
                  className="w-full sm:w-auto py-2.5 px-3 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center justify-center transition-colors"
                >
                  Autre question
                </button>
              </div>
            </div>
          )}

          {/* Premium banner if not subscribed */}
          {!isPremium && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 text-xs">
                <Crown size={15} className="fill-amber-500 text-amber-500" />
                <span>Ask the Book est réservé aux membres Premium</span>
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
