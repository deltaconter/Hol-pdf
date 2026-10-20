import { VoiceOption } from '../types';

export interface SpeechState {
  isPlaying: boolean;
  isPaused: boolean;
  progress: number;
  currentParagraphIndex: number;
}

class SpeechController {
  private utterance: SpeechSynthesisUtterance | null = null;
  private isSpeaking = false;
  private isPaused = false;
  private listeners: ((state: SpeechState) => void)[] = [];
  private progressInterval: number | null = null;
  private currentProgress = 0;
  private totalDurationSeconds = 436;

  // Multi-paragraph queue
  private currentParagraphs: string[] = [];
  private currentParagraphIndex = 0;
  private currentVoice: VoiceOption | null = null;
  private currentSpeed = 1.0;
  private currentVolume = 0.8;
  private onParagraphChangeCallback?: (index: number) => void;
  private onPageEndCallback?: () => void;
  private fallbackTimer: number | null = null;

  public subscribe(fn: (state: SpeechState) => void) {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  private notify() {
    this.listeners.forEach((fn) =>
      fn({
        isPlaying: this.isSpeaking,
        isPaused: this.isPaused,
        progress: this.currentProgress,
        currentParagraphIndex: this.currentParagraphIndex,
      })
    );
  }

  private clearFallbackTimer() {
    if (this.fallbackTimer) {
      window.clearTimeout(this.fallbackTimer);
      this.fallbackTimer = null;
    }
  }

  /**
   * Speak an entire page paragraph-by-paragraph with zero pause between pages.
   * When the last paragraph of the page is done, onPageEnd is called immediately!
   */
  public speakPageParagraphs(
    paragraphs: string[],
    voice: VoiceOption,
    speed: number = 1.0,
    volume: number = 0.8,
    startIndex: number = 0,
    onParagraphChange?: (index: number) => void,
    onPageEnd?: () => void
  ) {
    this.stop(false);

    if (!paragraphs || paragraphs.length === 0) {
      if (onPageEnd) onPageEnd();
      return;
    }

    this.currentParagraphs = paragraphs;
    this.currentParagraphIndex = Math.max(0, Math.min(startIndex, paragraphs.length - 1));
    this.currentVoice = voice;
    this.currentSpeed = speed;
    this.currentVolume = volume;
    this.onParagraphChangeCallback = onParagraphChange;
    this.onPageEndCallback = onPageEnd;

    this.isSpeaking = true;
    this.isPaused = false;
    this.startProgressTracker();

    this.speakCurrentParagraph();
  }

  private speakCurrentParagraph() {
    this.clearFallbackTimer();

    if (
      this.currentParagraphIndex < 0 ||
      this.currentParagraphIndex >= this.currentParagraphs.length
    ) {
      // Reached end of current page's paragraphs!
      // Immediately trigger next page continuation without pause
      if (this.onPageEndCallback) {
        const nextCallback = this.onPageEndCallback;
        // Don't stop speaking state so UI doesn't flicker pause
        nextCallback();
      } else {
        this.stop();
      }
      return;
    }

    const text = this.currentParagraphs[this.currentParagraphIndex];
    if (this.onParagraphChangeCallback) {
      this.onParagraphChangeCallback(this.currentParagraphIndex);
    }
    this.notify();

    // Check browser speech synthesis support
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'fr-FR';
      const voice = this.currentVoice;
      utterance.rate = (voice ? voice.rate : 1.0) * this.currentSpeed;
      utterance.pitch = voice ? voice.pitch : 1.0;
      utterance.volume = this.currentVolume;

      // Select French voice if available
      try {
        const browserVoices = window.speechSynthesis.getVoices();
        const frenchVoices = browserVoices.filter((v) => v.lang.startsWith('fr'));
        if (frenchVoices.length > 0 && voice) {
          if (voice.gender === 'Femme') {
            const female = frenchVoices.find((v) =>
              /female|femme|amelie|audrey|marie|claire|hortense|celine/i.test(v.name)
            );
            utterance.voice = female || frenchVoices[0];
          } else {
            const male = frenchVoices.find((v) =>
              /male|homme|thomas|nicolas|antoine|mathieu|paul/i.test(v.name)
            );
            utterance.voice = male || frenchVoices[0];
          }
        }
      } catch {
        // fallback to default voice
      }

      let advanceTriggered = false;
      const advanceToNext = () => {
        if (advanceTriggered) return;
        advanceTriggered = true;
        this.clearFallbackTimer();

        if (this.isSpeaking && !this.isPaused) {
          this.currentParagraphIndex += 1;
          this.speakCurrentParagraph();
        }
      };

      utterance.onstart = () => {
        this.isSpeaking = true;
        this.isPaused = false;
        this.notify();
      };

      utterance.onend = () => {
        advanceToNext();
      };

      utterance.onerror = () => {
        advanceToNext();
      };

      // Fallback timer: word count estimate in case utterance.onend doesn't fire
      const wordsCount = text.split(/\s+/).filter(Boolean).length || 10;
      // ~130 words per min at 1.0x -> ~2.1 words per sec
      const estimatedSec = Math.max(3, (wordsCount / (2.2 * this.currentSpeed)) + 1.2);
      this.fallbackTimer = window.setTimeout(() => {
        advanceToNext();
      }, estimatedSec * 1000);

      this.utterance = utterance;
      window.speechSynthesis.speak(utterance);
    } else {
      // Simulation mode if SpeechSynthesis is completely absent
      const wordsCount = text.split(/\s+/).filter(Boolean).length || 10;
      const estimatedSec = Math.max(2.5, (wordsCount / (2.2 * this.currentSpeed)) + 0.8);
      this.fallbackTimer = setTimeout(() => {
        if (this.isSpeaking && !this.isPaused) {
          this.currentParagraphIndex += 1;
          this.speakCurrentParagraph();
        }
      }, estimatedSec * 1000) as unknown as number;
    }
  }

  public skipToParagraph(index: number) {
    if (index >= 0 && index < this.currentParagraphs.length) {
      this.currentParagraphIndex = index;
      if (this.isSpeaking && !this.isPaused) {
        this.speakCurrentParagraph();
      } else {
        if (this.onParagraphChangeCallback) {
          this.onParagraphChangeCallback(index);
        }
        this.notify();
      }
    }
  }

  public speakText(
    text: string,
    voice: VoiceOption,
    speed: number = 1.0,
    volume: number = 0.8,
    onEnd?: () => void
  ) {
    this.speakPageParagraphs([text], voice, speed, volume, 0, undefined, onEnd);
  }

  public playAudioBook(
    text: string,
    voice: VoiceOption,
    speed: number = 1.0,
    volume: number = 0.8
  ) {
    if (this.isPaused) {
      this.resume();
      return;
    }
    this.speakText(text, voice, speed, volume);
  }

  public pause() {
    this.clearFallbackTimer();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.pause();
    }
    this.isPaused = true;
    this.notify();
  }

  public resume() {
    if (this.isPaused) {
      this.isPaused = false;
      this.isSpeaking = true;
      if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        this.notify();
      } else {
        // Re-trigger current paragraph
        this.speakCurrentParagraph();
      }
    }
  }

  public stop(notifyListeners = true) {
    this.clearFallbackTimer();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.isSpeaking = false;
    this.isPaused = false;
    this.stopProgressTracker();
    if (notifyListeners) {
      this.notify();
    }
  }

  public seekSeconds(seconds: number) {
    this.currentProgress = Math.max(0, Math.min(this.totalDurationSeconds, seconds));
    this.notify();
  }

  private startProgressTracker() {
    if (this.progressInterval) clearInterval(this.progressInterval);
    this.progressInterval = window.setInterval(() => {
      if (this.isSpeaking && !this.isPaused) {
        this.currentProgress = (this.currentProgress + 1) % this.totalDurationSeconds;
        this.notify();
      }
    }, 1000);
  }

  private stopProgressTracker() {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }

  public formatTime(totalSeconds: number): string {
    const mins = Math.floor(totalSeconds / 60);
    const secs = Math.floor(totalSeconds % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
}

export const speechController = new SpeechController();

import { voiceList as mockVoiceList } from '../data/mockData';

export const voiceList: VoiceOption[] = [
  {
    id: 'fr_FR-siwis-medium',
    name: 'Siwis (Voix HD gratuite - Piper)',
    gender: 'Femme',
    language: 'Français',
    tone: 'Naturelle & Fluide',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    rate: 1.0,
    pitch: 1.0,
    voiceGenderStyle: 'Synthèse neuronale locale Piper ultra-naturelle, 100% gratuite et hors-ligne.',
    engine: 'piper',
    isPremiumOnly: false,
    isGeminiHd: false,
  },
  {
    id: 'fr_FR-upmc-medium',
    name: 'UPMC (Voix HD gratuite - Piper)',
    gender: 'Femme',
    language: 'Français',
    tone: 'Clair & Pédagogique',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    rate: 1.0,
    pitch: 1.0,
    voiceGenderStyle: "Voix neuronale Piper haute précision, idéale pour l'apprentissage et les manuels.",
    engine: 'piper',
    isPremiumOnly: false,
    isGeminiHd: false,
  },
  {
    id: 'fr_FR-tom-medium',
    name: 'Tom (Voix HD gratuite - Piper)',
    gender: 'Homme',
    language: 'Français',
    tone: 'Dynamique & Expressif',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    rate: 1.0,
    pitch: 1.0,
    voiceGenderStyle: 'Voix neuronale masculine Piper, fluide et agréable.',
    engine: 'piper',
    isPremiumOnly: false,
    isGeminiHd: false,
  },
  {
    id: 'lucie',
    name: 'Lucie (Voix Navigateur)',
    gender: 'Femme',
    language: 'Français',
    tone: 'Naturelle',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    rate: 1.0,
    pitch: 1.05,
    voiceGenderStyle: 'Voix douce du navigateur pour les récits.',
    engine: 'browser',
    isPremiumOnly: false,
    isGeminiHd: false,
  },
  {
    id: 'thomas',
    name: 'Thomas (Voix Navigateur)',
    gender: 'Homme',
    language: 'Français',
    tone: 'Clair & Posé',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    rate: 1.0,
    pitch: 0.95,
    voiceGenderStyle: 'Voix masculine claire du navigateur, idéale pour les rapports.',
    engine: 'browser',
    isPremiumOnly: false,
    isGeminiHd: false,
  },
  {
    id: 'julie',
    name: 'Julie (Voix Navigateur)',
    gender: 'Femme',
    language: 'Français',
    tone: 'Chaleureuse',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    rate: 0.95,
    pitch: 1.1,
    voiceGenderStyle: 'Voix souriante et captivante du navigateur.',
    engine: 'browser',
    isPremiumOnly: false,
    isGeminiHd: false,
  },
  {
    id: 'antoine',
    name: 'Antoine (Voix Navigateur)',
    gender: 'Homme',
    language: 'Français',
    tone: 'Grave & Posé',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    rate: 0.95,
    pitch: 0.85,
    voiceGenderStyle: 'Timbre chaleureux et profond du navigateur.',
    engine: 'browser',
    isPremiumOnly: false,
    isGeminiHd: false,
  },
];

// Synchronize in-place so all app imports of voiceList receive the exact updated list
if (Array.isArray(mockVoiceList)) {
  mockVoiceList.length = 0;
  mockVoiceList.push(...voiceList);
}

