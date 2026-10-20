import React, { useState, useRef } from 'react';
import { ChevronLeft, Play, Volume2, Sparkles, Headphones, Crown, Cpu } from 'lucide-react';
import { voiceList } from '../utils/audioSpeech';
import { VoiceOption, UserProfile } from '../types';
import { speechController } from '../utils/audioSpeech';
import { geminiService } from '../utils/geminiService';
import { synthesize } from '../utils/piperEngine';

interface VoiceSelectorScreenProps {
  selectedVoice: VoiceOption;
  onSelectVoice: (voice: VoiceOption) => void;
  onBack: () => void;
  userProfile?: UserProfile;
  onOpenPremium?: () => void;
}

export const VoiceSelectorScreen: React.FC<VoiceSelectorScreenProps> = ({
  selectedVoice,
  onSelectVoice,
  onBack,
  userProfile,
  onOpenPremium,
}) => {
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'piper' | 'standard'>('all');
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const previewGenRef = useRef<number>(0);

  // Stop audio on unmount or screen change
  React.useEffect(() => {
    return () => {
      previewGenRef.current++;
      if (previewAudioRef.current) {
        previewAudioRef.current.onended = null;
        previewAudioRef.current.onerror = null;
        try {
          previewAudioRef.current.pause();
          previewAudioRef.current.src = '';
        } catch {
          // ignore
        }
        previewAudioRef.current = null;
      }
      geminiService.stopAudio();
      speechController.stop();
    };
  }, []);

  const filteredVoices = voiceList.filter((v) => {
    if (filter === 'piper') return v.engine === 'piper';
    if (filter === 'standard') return v.engine === 'browser';
    return true;
  });

  const stopAllAudio = () => {
    previewGenRef.current++;
    if (previewAudioRef.current) {
      previewAudioRef.current.onended = null;
      previewAudioRef.current.onerror = null;
      try {
        previewAudioRef.current.pause();
        previewAudioRef.current.src = '';
      } catch {
        // ignore
      }
      previewAudioRef.current = null;
    }
    geminiService.stopAudio();
    speechController.stop();
    setIsPlayingPreview(false);
    setPlayingVoiceId(null);
  };

  const handleListenSample = async (voice: VoiceOption) => {
    // If clicking on the currently playing preview voice, toggle it off
    if (isPlayingPreview && playingVoiceId === voice.id) {
      stopAllAudio();
      return;
    }

    stopAllAudio();
    const currentGen = previewGenRef.current;
    setIsPlayingPreview(true);
    setPlayingVoiceId(voice.id);

    if (voice.engine === 'piper') {
      const sampleText = `Bonjour ! Je suis ${voice.name.split(' ')[0]}, voix neuronale Piper haute définition. Avec HolPdf, profitez d'une lecture fluide, naturelle et totalement gratuite.`;
      try {
        const blob = await synthesize(sampleText, voice.id);
        if (currentGen !== previewGenRef.current) {
          return;
        }
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        previewAudioRef.current = audio;

        audio.onended = () => {
          URL.revokeObjectURL(url);
          if (currentGen === previewGenRef.current) {
            setIsPlayingPreview(false);
            setPlayingVoiceId(null);
          }
        };

        audio.onerror = () => {
          URL.revokeObjectURL(url);
          if (currentGen === previewGenRef.current) {
            setIsPlayingPreview(false);
            setPlayingVoiceId(null);
          }
        };

        try {
          await audio.play();
        } catch (playErr: any) {
          if (
            playErr?.name === 'AbortError' ||
            playErr?.message?.includes('interrupted') ||
            playErr?.message?.includes('pause')
          ) {
            // Normal benign abort when user quickly changes voice or stops
            return;
          }
          console.warn('Note: lecture preview interrompue:', playErr);
        }
      } catch (err: any) {
        if (
          err?.name === 'AbortError' ||
          err?.message?.includes('interrupted') ||
          err?.message?.includes('pause')
        ) {
          return;
        }
        console.warn('Note: pré-écoute Piper:', err);
      } finally {
        if (currentGen === previewGenRef.current && !previewAudioRef.current) {
          setIsPlayingPreview(false);
          setPlayingVoiceId(null);
        }
      }
    } else if (voice.engine === 'gemini') {
      const sampleText = `Bonjour ! Je suis ${voice.name.split(' ')[0]}, synthèse ultra-réaliste générée par Gemini.`;
      const geminiVoiceCode = voice.name.split(' ')[0] || 'Kore';
      geminiService.playAudio(sampleText, geminiVoiceCode, () => {
        if (currentGen === previewGenRef.current) {
          setIsPlayingPreview(false);
          setPlayingVoiceId(null);
        }
      });
    } else {
      const samplePhrase = `Bonjour ! Je suis ${voice.name.split(' ')[0]}. Avec HolPdf, découvrez le plaisir d'écouter vos documents et vos livres en toute simplicité.`;
      speechController.speakText(
        samplePhrase,
        voice,
        voice.rate,
        0.9,
        () => {
          if (currentGen === previewGenRef.current) {
            setIsPlayingPreview(false);
            setPlayingVoiceId(null);
          }
        }
      );
    }
  };

  const handleVoiceClick = (voice: VoiceOption) => {
    onSelectVoice(voice);
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-between bg-[#040612] text-white overflow-hidden select-none">
      {/* Header */}
      <div className="px-4 py-2 flex items-center justify-between border-b border-slate-800/80 bg-[#080d1a]/95 backdrop-blur-md z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              stopAllAudio();
              onBack();
            }}
            aria-label="Retour"
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h2 className="text-sm font-bold text-slate-100">Catalogue des Voix</h2>
            <p className="text-[10px] text-slate-400">
              Choisissez votre voix de lecture préférée
            </p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-4 pt-3 pb-1 border-b border-slate-800/60 bg-[#070b16] flex items-center gap-2 overflow-x-auto no-scrollbar z-10">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
            filter === 'all'
              ? 'bg-purple-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          Toutes ({voiceList.length})
        </button>
        <button
          onClick={() => setFilter('piper')}
          className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
            filter === 'piper'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-xs'
              : 'text-emerald-400 hover:text-emerald-300 hover:bg-slate-800'
          }`}
        >
          <Sparkles size={13} />
          <span>Voix HD gratuite (Piper) ({voiceList.filter((v) => v.engine === 'piper').length})</span>
        </button>
        <button
          onClick={() => setFilter('standard')}
          className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
            filter === 'standard'
              ? 'bg-slate-700 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          Standard Navigateur ({voiceList.filter((v) => v.engine === 'browser').length})
        </button>
      </div>

      {/* Voice List */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2.5 no-scrollbar z-10">
        <div className="max-w-2xl mx-auto space-y-2.5">
          {/* Quota Information Banner */}
          {userProfile && (
            <div className="p-3 rounded-2xl bg-gradient-to-r from-purple-950/60 to-slate-900 border border-purple-500/30 flex items-center justify-between text-xs shadow-xs mb-1">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center flex-shrink-0">
                  <Headphones size={16} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-white text-[11px]">
                      {userProfile.isPremium ? 'Pack 20h Studio HD' : 'Essai Studio HD (30 min)'}
                    </span>
                    {userProfile.isPremium && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                        PREMIUM
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-300 truncate">
                    {Math.max(0, userProfile.studioHdMinutesTotal - userProfile.studioHdMinutesUsed)} min restantes ce mois-ci
                  </p>
                </div>
              </div>

              {onOpenPremium && !userProfile.isPremium && (
                <button
                  type="button"
                  onClick={onOpenPremium}
                  className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-purple-600 hover:opacity-95 text-white font-bold text-[10px] flex items-center gap-1 flex-shrink-0 cursor-pointer shadow-xs"
                >
                  <Crown size={11} />
                  <span>Passer à 20h</span>
                </button>
              )}
            </div>
          )}

          {filteredVoices.map((voice) => {
            const isSelected = voice.id === selectedVoice.id;
            const isPiper = voice.engine === 'piper';

            return (
              <div
                key={voice.id}
                onClick={() => handleVoiceClick(voice)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isSelected
                    ? isPiper
                      ? 'bg-emerald-950/40 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.25)] ring-1 ring-emerald-500/40'
                      : 'bg-purple-950/40 border-purple-500 shadow-[0_0_15px_rgba(147,51,234,0.25)] ring-1 ring-purple-500/40'
                    : 'bg-[#0e1322]/80 border-slate-800/80 hover:border-slate-700/80'
                }`}
              >
                {/* Left Avatar & Info */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className={`relative w-11 h-11 rounded-full p-[1.5px] flex-shrink-0 ${
                      isPiper
                        ? 'bg-gradient-to-tr from-emerald-400 via-teal-400 to-cyan-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                        : 'bg-gradient-to-tr from-purple-500 to-cyan-400'
                    }`}
                  >
                    <img
                      src={voice.avatarUrl}
                      alt={voice.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                    {isSelected && (
                      <span className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 ${isPiper ? 'bg-emerald-500' : 'bg-purple-500'} rounded-full border-2 border-[#040612] flex items-center justify-center`}>
                        <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-xs font-semibold text-slate-100 truncate">
                        {voice.name}
                      </h3>
                      {isPiper && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-[9px] flex items-center gap-1">
                          <Cpu size={10} />
                          VOIX HD GRATUITE (PIPER)
                        </span>
                      )}
                      {!isPiper && (
                        <span className="px-1.5 py-0.5 rounded bg-slate-700/60 border border-slate-600/50 text-slate-300 font-medium text-[9px]">
                          NAVIGATEUR
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {voice.language} • {voice.tone}
                    </p>
                  </div>
                </div>

                {/* Listen & Select Action */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleListenSample(voice);
                    }}
                    title="Écouter un extrait de cette voix"
                    className="p-2 rounded-xl text-slate-400 hover:text-emerald-300 hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <Volume2 size={16} />
                  </button>

                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                      isSelected
                        ? isPiper
                          ? 'border-emerald-500 bg-emerald-600 shadow-[0_0_8px_#10b981]'
                          : 'border-purple-500 bg-purple-600 shadow-[0_0_8px_#a855f7]'
                        : 'border-slate-600 bg-transparent'
                    }`}
                  >
                    {isSelected && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Bottom Button: "▶ Écouter un extrait" */}
      <div className="p-4 bg-[#080d1a]/95 border-t border-slate-800/80 z-20">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button
            onClick={() => handleListenSample(selectedVoice)}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white text-xs font-semibold tracking-wide flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(16,185,129,0.4)] active:scale-[0.98] transition-all cursor-pointer"
          >
            <Play size={15} fill="currentColor" />
            <span>{isPlayingPreview ? 'Lecture en cours...' : `Écouter "${selectedVoice.name}"`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
