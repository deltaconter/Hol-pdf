import { VoiceOption, DocumentItem } from '../types';
import { getDocumentPageContent } from './documentPages';
import {
  isPiperSupported,
  synthesizeWithStats,
  isVoiceStored,
  ensureVoice,
  resolvePiperVoiceId,
  PIPER_DEFAULT_VOICE,
} from './piperEngine';
import { voiceList } from './audioSpeech';

export interface ContinuousPlaybackState {
  isPlaying: boolean;
  isPaused: boolean;
  page: number;
  paragraphIndex: number;
  totalParagraphs: number;
  totalPages: number;
  speed: number;
  progressPercent: number;
}

type PlaybackListener = (state: ContinuousPlaybackState) => void;

/**
 * Splits paragraph into sentence/clause chunks of maximum 200 characters,
 * cleanly breaking on punctuation marks (. ! ? ; : ,).
 */
export function splitParagraphIntoChunks(text: string, maxChars = 200): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  if (trimmed.length <= maxChars) return [trimmed];

  const sentenceRegex = /[^.!?؛;:]+[.!?؛;:]+/g;
  const rawSentences = trimmed.match(sentenceRegex);
  const parts: string[] = rawSentences ? [...rawSentences] : [];

  const matchedLen = parts.join('').length;
  if (matchedLen < trimmed.length) {
    const rest = trimmed.slice(matchedLen).trim();
    if (rest) parts.push(rest);
  }

  const chunks: string[] = [];
  let current = '';

  for (const p of parts) {
    const s = p.trim();
    if (!s) continue;

    if (!current) {
      if (s.length <= maxChars) {
        current = s;
      } else {
        // Break long sentence by punctuation clauses or spaces
        const subParts = s.split(/([,،\n]+)/);
        for (const sp of subParts) {
          const sub = sp.trim();
          if (!sub) continue;
          if ((current + ' ' + sub).trim().length <= maxChars) {
            current = (current ? current + ' ' : '') + sub;
          } else {
            if (current) chunks.push(current.trim());
            // If even a sub-part is huge, break by words
            if (sub.length > maxChars) {
              const words = sub.split(/\s+/);
              for (const w of words) {
                if ((current + ' ' + w).trim().length <= maxChars) {
                  current = (current ? current + ' ' : '') + w;
                } else {
                  if (current) chunks.push(current.trim());
                  current = w;
                }
              }
            } else {
              current = sub;
            }
          }
        }
      }
    } else if ((current + ' ' + s).length <= maxChars) {
      current += ' ' + s;
    } else {
      chunks.push(current.trim());
      current = s;
    }
  }

  if (current.trim()) {
    chunks.push(current.trim());
  }

  return chunks.length > 0 ? chunks : [trimmed.slice(0, maxChars)];
}

class ContinuousPlaybackEngine {
  private document: DocumentItem | null = null;
  private totalPages = 28;
  private currentPage = 1;
  private currentParagraphIndex = 0;
  private voice: VoiceOption | null = null;
  private speed = 1.0;
  private volume = 0.85;

  private isPlaying = false;
  private isPaused = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private currentAudio: HTMLAudioElement | null = null;
  private currentAudioUrl: string | null = null;
  private playbackGeneration = 0;

  // Paragraph chunking state for sentence-by-sentence reading
  private currentParagraphChunks: string[] = [];
  private currentChunkIndex = 0;

  private listeners: PlaybackListener[] = [];
  private fallbackTimer: number | null = null;
  private nextParagraphTimer: number | null = null;
  private speechCheckInterval: number | null = null;
  private onPageChangedExternal?: (page: number) => void;

  // Anti-cascade safeguard: record timestamp when current paragraph started
  private paragraphStartTime = 0;
  private isAdvancing = false;

  public subscribe(fn: PlaybackListener) {
    this.listeners.push(fn);
    fn(this.getState());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  public setPageChangeCallback(fn: (page: number) => void) {
    this.onPageChangedExternal = fn;
  }

  public getState(): ContinuousPlaybackState {
    const pageContent = this.document
      ? getDocumentPageContent(this.document, this.currentPage)
      : null;
    const totalParas = pageContent ? pageContent.paragraphs.length : 1;

    const pageWeight = 100 / Math.max(1, this.totalPages);
    const inPageFraction = totalParas > 0 ? this.currentParagraphIndex / totalParas : 0;
    const progressPercent = Math.min(
      100,
      Math.round((this.currentPage - 1 + inPageFraction) * pageWeight)
    );

    return {
      isPlaying: this.isPlaying,
      isPaused: this.isPaused,
      page: this.currentPage,
      paragraphIndex: this.currentParagraphIndex,
      totalParagraphs: totalParas,
      totalPages: this.totalPages,
      speed: this.speed,
      progressPercent,
    };
  }

  private notify() {
    const state = this.getState();
    this.listeners.forEach((fn) => {
      try {
        fn(state);
      } catch (err) {
        console.error('Error in playback listener:', err);
      }
    });
  }

  private clearTimers() {
    if (this.fallbackTimer) {
      clearTimeout(this.fallbackTimer);
      this.fallbackTimer = null;
    }
    if (this.nextParagraphTimer) {
      clearTimeout(this.nextParagraphTimer);
      this.nextParagraphTimer = null;
    }
  }

  private stopCurrentAudioSafely() {
    if (this.currentAudio) {
      this.currentAudio.onplay = null;
      this.currentAudio.onended = null;
      this.currentAudio.onerror = null;
      try {
        this.currentAudio.pause();
        this.currentAudio.src = '';
      } catch {
        // Ignore pause error on unattached audio
      }
      this.currentAudio = null;
    }
    if (this.currentAudioUrl) {
      try {
        URL.revokeObjectURL(this.currentAudioUrl);
      } catch {
        // Ignore revocation error
      }
      this.currentAudioUrl = null;
    }
  }

  private cancelSpeechSynthesisSafely() {
    this.stopCurrentAudioSafely();

    if (this.currentUtterance) {
      this.currentUtterance.onstart = null;
      this.currentUtterance.onend = null;
      this.currentUtterance.onerror = null;
      this.currentUtterance = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {
        console.warn('speechSynthesis.cancel failed:', e);
      }
    }
  }

  private showUserToast(message: string) {
    if (typeof document === 'undefined') return;
    const TOAST_ID = 'piper-toast-notification';
    let toast = document.getElementById(TOAST_ID);
    if (!toast) {
      toast = document.createElement('div');
      toast.id = TOAST_ID;
      toast.style.position = 'fixed';
      toast.style.bottom = '84px';
      toast.style.left = '50%';
      toast.style.transform = 'translateX(-50%)';
      toast.style.zIndex = '99999';
      toast.style.backgroundColor = 'rgba(239, 68, 68, 0.95)';
      toast.style.color = '#ffffff';
      toast.style.padding = '10px 18px';
      toast.style.borderRadius = '20px';
      toast.style.fontSize = '12px';
      toast.style.fontWeight = '600';
      toast.style.boxShadow = '0 6px 18px rgba(0,0,0,0.4)';
      toast.style.maxWidth = '90vw';
      toast.style.textAlign = 'center';
      toast.style.pointerEvents = 'none';
      toast.style.transition = 'opacity 0.3s ease';
      document.body.appendChild(toast);
    }
    toast.innerText = message;
    toast.style.opacity = '1';
    setTimeout(() => {
      if (toast) toast.style.opacity = '0';
      setTimeout(() => toast?.remove(), 300);
    }, 4500);
  }

  /**
   * Synchronizes active voice with user profile if it was updated in the selector
   */
  private syncVoiceFromProfile() {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      const raw = localStorage.getItem('holpdf_user_profile');
      if (raw) {
        const profile = JSON.parse(raw);
        if (profile?.currentVoiceId && (!this.voice || this.voice.id !== profile.currentVoiceId)) {
          const matched = voiceList.find((v) => v.id === profile.currentVoiceId);
          if (matched) {
            this.voice = matched;
          }
        }
      }
    } catch {
      // Ignore profile parsing error
    }
  }

  /**
   * Set voice directly from UI components
   */
  public setVoice(voice: VoiceOption) {
    const previousVoiceId = this.voice?.id;
    this.voice = voice;
    if (this.isPlaying && previousVoiceId !== voice.id) {
      this.playbackGeneration++;
      this.stopCurrentAudioSafely();
      this.currentChunkIndex = 0;
      this.currentParagraphChunks = [];
      this.speakCurrent();
    }
  }

  /**
   * Start continuous reading for a document at a given page & paragraph
   */
  public start(
    document: DocumentItem,
    voice: VoiceOption,
    page: number = 1,
    paragraphIdx: number = 0,
    speed: number = 1.0,
    volume: number = 0.85
  ) {
    this.playbackGeneration++;
    this.clearTimers();
    this.cancelSpeechSynthesisSafely();

    this.document = document;
    this.totalPages = document.pagesCount || 28;
    this.voice = voice;
    this.syncVoiceFromProfile();

    this.speed = speed;
    this.volume = volume;
    this.currentPage = Math.max(1, Math.min(page, this.totalPages));
    this.currentParagraphIndex = Math.max(0, paragraphIdx);

    this.currentChunkIndex = 0;
    this.currentParagraphChunks = [];

    this.isPlaying = true;
    this.isPaused = false;
    this.isAdvancing = false;

    this.startWatchdog();

    setTimeout(() => {
      if (this.isPlaying && !this.isPaused) {
        this.speakCurrent();
      }
    }, 50);
  }

  public setSpeed(newSpeed: number) {
    this.speed = newSpeed;
    if (this.currentAudio) {
      this.currentAudio.playbackRate = this.speed;
      (this.currentAudio as any).preservesPitch = true;
    }
    if (this.isPlaying && !this.isPaused && !this.currentAudio) {
      this.speakCurrent();
    } else {
      this.notify();
    }
  }

  public setVolume(newVolume: number) {
    this.volume = Math.max(0, Math.min(1, newVolume));
    if (this.currentAudio) {
      this.currentAudio.volume = this.volume;
    }
    if (this.currentUtterance) {
      this.currentUtterance.volume = this.volume;
    }
    this.notify();
  }

  public jumpToPage(page: number, paragraphIdx: number = 0) {
    if (page < 1 || page > this.totalPages) return;
    this.playbackGeneration++;
    this.clearTimers();
    this.cancelSpeechSynthesisSafely();

    this.currentPage = page;
    this.currentParagraphIndex = paragraphIdx;
    this.currentChunkIndex = 0;
    this.currentParagraphChunks = [];

    this.isAdvancing = false;
    this.onPageChangedExternal?.(page);

    if (this.isPlaying && !this.isPaused) {
      setTimeout(() => {
        if (this.isPlaying && !this.isPaused) {
          this.speakCurrent();
        }
      }, 50);
    } else {
      this.notify();
    }
  }

  public jumpToParagraph(idx: number) {
    if (!this.document) return;
    const pageContent = getDocumentPageContent(this.document, this.currentPage);
    if (idx >= 0 && idx < pageContent.paragraphs.length) {
      this.playbackGeneration++;
      this.clearTimers();
      this.cancelSpeechSynthesisSafely();

      this.currentParagraphIndex = idx;
      this.currentChunkIndex = 0;
      this.currentParagraphChunks = [];
      this.isAdvancing = false;

      if (this.isPlaying && !this.isPaused) {
        setTimeout(() => {
          if (this.isPlaying && !this.isPaused) {
            this.speakCurrent();
          }
        }, 50);
      } else {
        if (this.voice) {
          this.start(this.document, this.voice, this.currentPage, idx, this.speed, this.volume);
        } else {
          this.notify();
        }
      }
    }
  }

  public nextParagraph() {
    if (!this.document) return;
    const pageContent = getDocumentPageContent(this.document, this.currentPage);
    if (this.currentParagraphIndex + 1 < pageContent.paragraphs.length) {
      this.jumpToParagraph(this.currentParagraphIndex + 1);
    } else if (this.currentPage < this.totalPages) {
      this.jumpToPage(this.currentPage + 1, 0);
    }
  }

  public previousParagraph() {
    if (this.currentParagraphIndex > 0) {
      this.jumpToParagraph(this.currentParagraphIndex - 1);
    } else if (this.currentPage > 1) {
      const prevPage = this.currentPage - 1;
      const prevContent = getDocumentPageContent(this.document!, prevPage);
      this.jumpToPage(prevPage, Math.max(0, prevContent.paragraphs.length - 1));
    }
  }

  public togglePlayPause() {
    if (this.isPlaying) {
      if (this.isPaused) {
        this.resume();
      } else {
        this.pause();
      }
    } else if (this.document && this.voice) {
      this.start(
        this.document,
        this.voice,
        this.currentPage,
        this.currentParagraphIndex,
        this.speed,
        this.volume
      );
    }
  }

  public pause() {
    this.clearTimers();
    if (this.currentAudio && !this.currentAudio.paused) {
      try {
        this.currentAudio.pause();
      } catch (e) {
        console.warn('Current audio pause error:', e);
      }
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.pause();
      } catch (e) {
        console.warn('speechSynthesis pause failed:', e);
      }
    }
    this.isPaused = true;
    this.notify();
  }

  public resume() {
    if (this.isPaused) {
      this.isPaused = false;
      this.isPlaying = true;

      if (this.currentAudio && this.currentAudio.paused) {
        try {
          this.currentAudio.play();
          this.notify();
          return;
        } catch (err) {
          console.warn('Audio resume failed, restarting chunk:', err);
        }
      }

      if (
        typeof window !== 'undefined' &&
        'speechSynthesis' in window &&
        window.speechSynthesis.paused
      ) {
        try {
          window.speechSynthesis.resume();
          this.notify();
          return;
        } catch {
          // fallback to speaking current
        }
      }
      this.speakCurrent();
    }
  }

  public stop() {
    this.playbackGeneration++;
    this.clearTimers();
    this.stopWatchdog();
    this.cancelSpeechSynthesisSafely();
    this.isPlaying = false;
    this.isPaused = false;
    this.isAdvancing = false;
    this.currentChunkIndex = 0;
    this.currentParagraphChunks = [];
    this.notify();
  }

  /**
   * Safe paragraph advance routine with delay and anti-cascade guards,
   * automatically skipping empty pages and pages marked with hasNoText.
   */
  private advanceToNextParagraph() {
    if (this.isAdvancing || !this.isPlaying || this.isPaused) return;
    this.isAdvancing = true;
    this.clearTimers();
    this.cancelSpeechSynthesisSafely();

    this.nextParagraphTimer = setTimeout(() => {
      this.isAdvancing = false;
      if (!this.isPlaying || this.isPaused || !this.document) return;

      const pageContent = getDocumentPageContent(this.document, this.currentPage);
      const paragraphs = pageContent.paragraphs;

      if (this.currentParagraphIndex + 1 < paragraphs.length) {
        // Next paragraph on the same page
        this.currentParagraphIndex += 1;
        this.currentChunkIndex = 0;
        this.currentParagraphChunks = [];
        this.speakCurrent();
      } else if (this.currentPage < this.totalPages) {
        // Continuous page transition: find next page that has exploitable text
        let nextPage = this.currentPage + 1;
        while (nextPage <= this.totalPages) {
          const nextContent = getDocumentPageContent(this.document, nextPage);
          if (nextContent && !nextContent.hasNoText && nextContent.paragraphs.length > 0) {
            break;
          }
          nextPage++;
        }

        if (nextPage <= this.totalPages) {
          this.currentPage = nextPage;
          this.currentParagraphIndex = 0;
          this.currentChunkIndex = 0;
          this.currentParagraphChunks = [];
          this.onPageChangedExternal?.(this.currentPage);
          this.notify();
          this.speakCurrent();
        } else {
          // End of document
          this.stop();
        }
      } else {
        // End of document
        this.stop();
      }
    }, 280) as unknown as number;
  }

  /**
   * Look ahead into future text to retrieve the next chunks across paragraphs and pages
   * (Requirement 3: skipping pages without text)
   */
  private getNextChunks(count = 2): string[] {
    if (!this.document) return [];
    const results: string[] = [];

    // 1. Remaining chunks in current paragraph
    for (
      let i = this.currentChunkIndex + 1;
      i < this.currentParagraphChunks.length && results.length < count;
      i++
    ) {
      results.push(this.currentParagraphChunks[i]);
    }
    if (results.length >= count) return results;

    // 2. Chunks from next paragraphs on the current page
    const pageContent = getDocumentPageContent(this.document, this.currentPage);
    for (
      let p = this.currentParagraphIndex + 1;
      p < pageContent.paragraphs.length && results.length < count;
      p++
    ) {
      const text = pageContent.paragraphs[p]?.text?.trim();
      if (text) {
        const subChunks = splitParagraphIntoChunks(text, 200);
        for (const c of subChunks) {
          results.push(c);
          if (results.length >= count) return results;
        }
      }
    }
    if (results.length >= count) return results;

    // 3. Chunks from next pages (skipping hasNoText pages)
    let pIdx = this.currentPage + 1;
    while (pIdx <= this.totalPages && results.length < count) {
      const nContent = getDocumentPageContent(this.document, pIdx);
      if (nContent && !nContent.hasNoText && nContent.paragraphs.length > 0) {
        for (const para of nContent.paragraphs) {
          const text = para?.text?.trim();
          if (text) {
            const subChunks = splitParagraphIntoChunks(text, 200);
            for (const c of subChunks) {
              results.push(c);
              if (results.length >= count) return results;
            }
          }
        }
      }
      pIdx++;
    }

    return results;
  }

  /**
   * Pre-synthesizes the next 2 chunks in parallel to eliminate silence (Requirement 3)
   */
  private preSynthesizeNextChunks(count = 2) {
    if (!this.document || this.voice?.engine !== 'piper' || !isPiperSupported()) return;
    const nextChunks = this.getNextChunks(count);
    const piperVoiceId = resolvePiperVoiceId(this.voice.id);
    nextChunks.forEach((chunk) => {
      synthesizeWithStats(chunk, piperVoiceId).catch(() => {});
    });
  }

  /**
   * Fallback to timed simulation when Web Speech synthesis fails or is blocked
   */
  private fallbackToTimedSimulation(expectedSeconds: number) {
    this.clearTimers();
    this.cancelSpeechSynthesisSafely();

    const durationMs = Math.max(3000, expectedSeconds * 1000);
    this.fallbackTimer = setTimeout(() => {
      if (this.isPlaying && !this.isPaused) {
        this.advanceToNextParagraph();
      }
    }, durationMs) as unknown as number;
  }

  /**
   * Explicit, visible fallback routine with full logging and toast notification
   * (Requirement 1 & 5: No silent fallback!)
   */
  private triggerFallback(
    textToSpeak: string,
    expectedSec: number,
    etape: string,
    errName: string,
    errMessage: string
  ) {
    const durationMs = Math.round(expectedSec * 1000);

    console.info('[lecture]', {
      moteur: 'navigateur',
      voiceId: this.voice?.id || 'standard',
      caracteres: textToSpeak.length,
      ms_synthese: 0,
      duree_audio_ms: durationMs,
      facteur_temps_reel: 0,
      repli_etape: etape,
      repli_erreur_nom: errName,
      repli_erreur_message: errMessage,
    });

    this.showUserToast(`Voix HD indisponible [${etape}] : ${errMessage || errName} — Voix du navigateur utilisée`);
    this.speakWithSpeechSynthesis(textToSpeak, expectedSec);
  }

  /**
   * Browser SpeechSynthesis playback routine (used for browser voices and Piper fallback)
   */
  private speakWithSpeechSynthesis(textToSpeak: string, expectedSec: number) {
    const hasSpeech =
      typeof window !== 'undefined' &&
      'speechSynthesis' in window &&
      typeof SpeechSynthesisUtterance !== 'undefined';

    if (!hasSpeech) {
      this.fallbackToTimedSimulation(expectedSec);
      return;
    }

    try {
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = 'fr-FR';
      const voice = this.voice;
      utterance.rate = (voice ? voice.rate : 1.0) * this.speed;
      utterance.pitch = voice ? voice.pitch : 1.0;
      utterance.volume = this.volume;

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
        // ignore voice lookup failure
      }

      let isCompleted = false;

      utterance.onstart = () => {
        this.isPlaying = true;
        this.isPaused = false;
        this.notify();
      };

      utterance.onend = () => {
        if (isCompleted) return;
        isCompleted = true;

        const elapsed = Date.now() - this.paragraphStartTime;
        const minRequiredMs = Math.min(1200, expectedSec * 1000 * 0.4);

        if (elapsed < minRequiredMs) {
          const remaining = minRequiredMs - elapsed;
          setTimeout(() => {
            this.advanceToNextParagraph();
          }, remaining);
        } else {
          this.advanceToNextParagraph();
        }
      };

      utterance.onerror = (e) => {
        if (isCompleted) return;
        if (e.error === 'canceled' || e.error === 'interrupted') return;

        console.warn('SpeechSynthesis error:', e.error, '- using timed reading simulation');
        isCompleted = true;
        this.fallbackToTimedSimulation(expectedSec);
      };

      this.fallbackTimer = setTimeout(() => {
        if (!isCompleted && this.isPlaying && !this.isPaused) {
          isCompleted = true;
          this.advanceToNextParagraph();
        }
      }, (expectedSec + 2.5) * 1000) as unknown as number;

      this.currentUtterance = utterance;
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('speechSynthesis.speak threw:', err);
      this.fallbackToTimedSimulation(expectedSec);
    }
  }

  /**
   * Plays a specific chunk of the current paragraph with Piper TTS
   * (Requirement 3: sentence-by-sentence with lookahead pre-synthesis)
   */
  private async playCurrentPiperChunk(expectedSec: number, textToSpeak: string) {
    if (this.currentChunkIndex >= this.currentParagraphChunks.length) {
      // Paragraph completely read
      this.advanceToNextParagraph();
      return;
    }

    const chunkText = this.currentParagraphChunks[this.currentChunkIndex];
    const generation = ++this.playbackGeneration;
    const piperVoiceId = resolvePiperVoiceId(this.voice?.id || PIPER_DEFAULT_VOICE);

    // 1. Verify model is downloaded
    const stored = await isVoiceStored(piperVoiceId);
    if (!stored) {
      ensureVoice(piperVoiceId).catch((err) => {
        console.warn('Téléchargement modèle Piper:', err);
      });
      this.triggerFallback(
        textToSpeak,
        expectedSec,
        'telechargement_modele',
        'ModelNotDownloaded',
        'Modèle vocal en cours de téléchargement'
      );
      return;
    }

    // 2. Synthesize current chunk
    try {
      const res = await synthesizeWithStats(chunkText, piperVoiceId);

      if (generation !== this.playbackGeneration || !this.isPlaying || this.isPaused) {
        return;
      }

      const facteur_temps_reel =
        res.durationMs > 0 ? Math.round((res.synthesisMs / res.durationMs) * 100) / 100 : 0;

      // Requirement 1: console.info log proof of what is actually being read
      console.info('[lecture]', {
        moteur: 'piper',
        voiceId: piperVoiceId,
        caracteres: chunkText.length,
        ms_synthese: res.synthesisMs,
        duree_audio_ms: res.durationMs,
        facteur_temps_reel,
      });

      const url = URL.createObjectURL(res.blob);
      this.currentAudioUrl = url;
      const audio = new Audio(url);
      this.currentAudio = audio;
      audio.playbackRate = this.speed;
      (audio as any).preservesPitch = true;
      audio.volume = this.volume;

      audio.onplay = () => {
        if (generation !== this.playbackGeneration) return;
        this.isPlaying = true;
        this.isPaused = false;
        this.notify();
        // Requirement 3: pre-synthesize the next 2 chunks while current chunk is playing
        this.preSynthesizeNextChunks(2);
      };

      audio.onended = () => {
        if (generation !== this.playbackGeneration) return;
        this.stopCurrentAudioSafely();
        this.currentChunkIndex += 1;
        this.playCurrentPiperChunk(expectedSec, textToSpeak);
      };

      audio.onerror = (e) => {
        if (generation !== this.playbackGeneration) return;
        console.warn('Erreur lecture audio Piper:', e);
        this.stopCurrentAudioSafely();
        this.triggerFallback(
          textToSpeak,
          expectedSec,
          'lecture_audio',
          'AudioPlaybackError',
          'Erreur lors du décodage du flux audio'
        );
      };

      try {
        await audio.play();
      } catch (playErr: any) {
        if (
          playErr?.name === 'AbortError' ||
          playErr?.message?.includes('interrupted') ||
          playErr?.message?.includes('pause')
        ) {
          return;
        }
        throw playErr;
      }
    } catch (err: any) {
      if (generation !== this.playbackGeneration) return;
      if (
        err?.name === 'AbortError' ||
        err?.message?.includes('interrupted') ||
        err?.message?.includes('pause')
      ) {
        return;
      }
      this.triggerFallback(
        textToSpeak,
        expectedSec,
        'synthese_piper',
        err?.name || 'SynthesisError',
        err?.message || 'Échec de la synthèse vocale'
      );
    }
  }

  /**
   * Core reading routine: Speaks current page & paragraph safely.
   */
  private async speakCurrent() {
    this.clearTimers();
    this.cancelSpeechSynthesisSafely();

    if (!this.document) {
      this.stop();
      return;
    }

    // Requirement 2: sync voice selection from local profile if changed in UI
    this.syncVoiceFromProfile();

    const pageContent = getDocumentPageContent(this.document, this.currentPage);
    const paragraphs = pageContent.paragraphs;

    // Boundary check
    if (this.currentParagraphIndex >= paragraphs.length) {
      if (this.currentPage < this.totalPages) {
        let nextPage = this.currentPage + 1;
        while (nextPage <= this.totalPages) {
          const nextContent = getDocumentPageContent(this.document, nextPage);
          if (nextContent && !nextContent.hasNoText && nextContent.paragraphs.length > 0) {
            break;
          }
          nextPage++;
        }

        if (nextPage <= this.totalPages) {
          this.currentPage = nextPage;
          this.currentParagraphIndex = 0;
          this.currentChunkIndex = 0;
          this.currentParagraphChunks = [];
          this.onPageChangedExternal?.(this.currentPage);
          this.notify();
          this.speakCurrent();
          return;
        } else {
          this.stop();
          return;
        }
      } else {
        this.stop();
        return;
      }
    }

    const paragraph = paragraphs[this.currentParagraphIndex];
    const textToSpeak = paragraph?.text?.trim();

    if (!textToSpeak) {
      this.advanceToNextParagraph();
      return;
    }

    this.paragraphStartTime = Date.now();
    this.notify();

    // Calculate natural reading duration based on word count
    const wordCount = textToSpeak.split(/\s+/).filter(Boolean).length || 8;
    const expectedSec = Math.max(2.8, wordCount / (2.2 * this.speed) + 0.6);

    // Piper Neural Voice Branch
    if (this.voice?.engine === 'piper' && isPiperSupported()) {
      // Requirement 3: Split paragraph into chunks of max 200 chars on punctuation
      this.currentParagraphChunks = splitParagraphIntoChunks(textToSpeak, 200);
      this.currentChunkIndex = 0;

      // Start playing chunk 0 immediately
      await this.playCurrentPiperChunk(expectedSec, textToSpeak);
      return;
    }

    // Standard Browser Voice Branch
    if (this.voice?.engine !== 'piper') {
      console.info('[lecture]', {
        moteur: 'navigateur',
        voiceId: this.voice?.id || 'standard',
        caracteres: textToSpeak.length,
        ms_synthese: 0,
        duree_audio_ms: Math.round(expectedSec * 1000),
        facteur_temps_reel: 0,
      });
    }

    this.speakWithSpeechSynthesis(textToSpeak, expectedSec);
  }

  private startWatchdog() {
    this.stopWatchdog();
    this.speechCheckInterval = setInterval(() => {
      if (
        this.isPlaying &&
        !this.isPaused &&
        typeof window !== 'undefined' &&
        'speechSynthesis' in window &&
        !this.currentAudio
      ) {
        if (window.speechSynthesis.paused) {
          try {
            window.speechSynthesis.resume();
          } catch {
            // ignore
          }
        }
      }
    }, 4000) as unknown as number;
  }

  private stopWatchdog() {
    if (this.speechCheckInterval) {
      clearInterval(this.speechCheckInterval);
      this.speechCheckInterval = null;
    }
  }
}

export const continuousPlayback = new ContinuousPlaybackEngine();
