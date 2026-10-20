import React, { useState, useEffect } from 'react';
import {
  X,
  Volume2,
  VolumeX,
  Sparkles,
  Play,
  Pause,
  Check,
  Radio,
  Sliders,
  CloudRain,
  Flame,
  Coffee,
  Waves,
  Trees,
  Wind,
} from 'lucide-react';
import {
  soundscapeEngine,
  SoundscapeType,
  SOUNDSCAPE_OPTIONS,
} from '../utils/soundscapeEngine';

interface SoundscapeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SoundscapeModal: React.FC<SoundscapeModalProps> = ({ isOpen, onClose }) => {
  const [currentType, setCurrentType] = useState<SoundscapeType>(soundscapeEngine.getCurrentType());
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(Math.round(soundscapeEngine.getVolume() * 100));

  useEffect(() => {
    const unsub = soundscapeEngine.subscribe((type, playing, vol) => {
      setCurrentType(type);
      setIsPlaying(playing);
      setVolume(Math.round(vol * 100));
    });
    return unsub;
  }, []);

  if (!isOpen) return null;

  const handleSelectSoundscape = (id: SoundscapeType) => {
    soundscapeEngine.setSoundscape(id);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setVolume(val);
    soundscapeEngine.setVolume(val / 100);
  };

  const handleTogglePlay = () => {
    soundscapeEngine.togglePlayPause();
  };

  const getAmbianceIcon = (id: SoundscapeType) => {
    switch (id) {
      case 'rain':
        return <CloudRain size={20} className="text-cyan-400" />;
      case 'fireplace':
        return <Flame size={20} className="text-rose-400" />;
      case 'cafe':
        return <Coffee size={20} className="text-amber-400" />;
      case 'waves':
        return <Waves size={20} className="text-blue-400" />;
      case 'forest':
        return <Trees size={20} className="text-emerald-400" />;
      case 'whitenoise':
        return <Wind size={20} className="text-purple-400" />;
      case 'none':
      default:
        return <VolumeX size={20} className="text-slate-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn select-none">
      <div className="relative w-full max-w-md rounded-2xl bg-[#0a0f1d] border border-slate-800 shadow-[0_15px_45px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col">
        {/* Glow ambient background */}
        <div className="absolute top-0 right-1/4 w-48 h-48 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-48 h-48 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="relative px-5 py-4 border-b border-slate-800/80 flex items-center justify-between z-10 bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Sparkles size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                Ambiances Sonores d'Immersion
              </h3>
              <p className="text-[10px] text-slate-400">
                Mixez un fond sonore relaxant sous la voix du narrateur
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/70 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Main Content */}
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto no-scrollbar z-10">
          {/* Active Soundscape Card & Play/Pause */}
          <div className="p-3.5 rounded-xl bg-[#0f172a]/90 border border-slate-700/80 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-800/90 border border-slate-700 flex items-center justify-center text-xl">
                {SOUNDSCAPE_OPTIONS.find((s) => s.id === currentType)?.emoji || '🔇'}
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">
                  {isPlaying ? 'Ambiance active' : 'Ambiance en pause'}
                </span>
                <h4 className="text-xs font-bold text-white">
                  {SOUNDSCAPE_OPTIONS.find((s) => s.id === currentType)?.name || 'Aucune'}
                </h4>
              </div>
            </div>

            {currentType !== 'none' && (
              <button
                type="button"
                onClick={handleTogglePlay}
                className={`p-2.5 rounded-xl font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 text-xs ${
                  isPlaying
                    ? 'bg-rose-500/20 border border-rose-500/40 text-rose-300 hover:bg-rose-500/30'
                    : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                }`}
              >
                {isPlaying ? <Pause size={14} /> : <Play size={14} className="fill-white" />}
                <span>{isPlaying ? 'Pause' : 'Écouter'}</span>
              </button>
            )}
          </div>

          {/* Volume Slider */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium flex items-center gap-1.5">
                <Volume2 size={14} className="text-cyan-400" />
                Volume de l'ambiance
              </span>
              <span className="font-mono text-cyan-300 font-semibold text-[11px]">
                {volume}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={handleVolumeChange}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <div className="flex justify-between text-[9px] text-slate-500">
              <span>Subtil (15%)</span>
              <span>Recommandé (35%)</span>
              <span>Immersif (70%)</span>
            </div>
          </div>

          {/* Soundscapes Grid */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
              Choisir un univers sonore
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SOUNDSCAPE_OPTIONS.map((opt) => {
                const isSelected = currentType === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectSoundscape(opt.id)}
                    className={`relative p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-cyan-950/40 border-cyan-500/60 ring-1 ring-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                        : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{opt.emoji}</span>
                        <div>
                          <div className="text-xs font-bold text-white flex items-center gap-1">
                            {opt.name}
                          </div>
                          <span className="text-[9px] text-slate-400 font-medium">
                            {opt.tags}
                          </span>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="w-4 h-4 rounded-full bg-cyan-500 flex items-center justify-center text-slate-950 flex-shrink-0">
                          <Check size={11} strokeWidth={3} />
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2 line-clamp-1">
                      {opt.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/40 flex items-center justify-between text-xs text-slate-400 z-10">
          <span className="text-[10px]">
            Synthétiseur audio binaural sans coupure
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
