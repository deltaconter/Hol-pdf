// Client-side helper calling our backend server endpoints (/api/gemini/*)
// Sends current Supabase authorization token and eliminates all fake responses
import { getCurrentSupabaseSession } from './supabaseClient';

export interface SummarizeParams {
  documentTitle: string;
  chapters: string[];
  content?: string;
}

export interface ExplainParams {
  text: string;
  documentTitle?: string;
  customQuestion?: string;
}

export interface AskBookParams {
  question: string;
  documentTitle: string;
  currentPage: number;
  documentContext?: {
    page: number;
    text: string;
    chapter?: string;
  }[];
  history?: {
    role: 'user' | 'model';
    text: string;
  }[];
}

export interface AskBookResult {
  success: boolean;
  answer: string;
  sources: {
    page: number;
    quote: string;
  }[];
  source?: 'gemini' | 'fallback';
  error?: string;
}

export interface TTSResult {
  success: boolean;
  audioBase64?: string;
  mimeType?: string;
  voice?: string;
  error?: string;
}

// Convert PCM base64 audio to WAV or AudioBuffer for playback
function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

let activeAudioElement: HTMLAudioElement | null = null;
let activeAudioContext: AudioContext | null = null;
let activeAudioSource: AudioBufferSourceNode | null = null;

async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  try {
    const session = await getCurrentSupabaseSession();
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
  } catch (err) {
    console.warn('Could not read Supabase session for auth header:', err);
  }
  return headers;
}

export const geminiService = {
  // 1. Résumé express de chapitres
  async generateExpressSummary(params: SummarizeParams): Promise<{ success: boolean; summary?: string; error?: string }> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/gemini/summarize', {
        method: 'POST',
        headers,
        body: JSON.stringify(params),
      });

      const data = await response.json().catch(() => null);

      if (response.ok && data?.success && data?.summary) {
        return { success: true, summary: data.summary };
      }

      const errorMessage = data?.error || (
        response.status === 401
          ? 'Connexion requise'
          : response.status === 429
          ? 'Trop de requêtes, réessaie dans un instant'
          : 'Le service IA est momentanément indisponible'
      );

      console.error('Erreur API summarize:', errorMessage);
      return { success: false, error: errorMessage };
    } catch (err: any) {
      console.error('Erreur réseau /api/gemini/summarize:', err?.message || err);
      return {
        success: false,
        error: 'Le service IA est momentanément indisponible',
      };
    }
  },

  // 2. Explication de concept / Ask the Book
  async explainConcept(params: ExplainParams): Promise<{ success: boolean; explanation?: string; error?: string }> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/gemini/explain', {
        method: 'POST',
        headers,
        body: JSON.stringify(params),
      });

      const data = await response.json().catch(() => null);

      if (response.ok && data?.success && data?.explanation) {
        return { success: true, explanation: data.explanation };
      }

      const errorMessage = data?.error || (
        response.status === 401
          ? 'Connexion requise'
          : response.status === 429
          ? 'Trop de requêtes, réessaie dans un instant'
          : 'Le service IA est momentanément indisponible'
      );

      console.error('Erreur API explain:', errorMessage);
      return { success: false, error: errorMessage };
    } catch (err: any) {
      console.error('Erreur réseau /api/gemini/explain:', err?.message || err);
      return {
        success: false,
        error: 'Le service IA est momentanément indisponible',
      };
    }
  },

  // 3. IA Conversationnelle « Ask the Book »
  async askTheBook(params: AskBookParams): Promise<AskBookResult> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/gemini/ask-book', {
        method: 'POST',
        headers,
        body: JSON.stringify(params),
      });

      const data = await response.json().catch(() => null);

      if (response.ok && data?.success && data?.answer) {
        return {
          success: true,
          answer: data.answer,
          sources: Array.isArray(data.sources) ? data.sources : [],
          source: 'gemini',
        };
      }

      const errorMessage = data?.error || (
        response.status === 401
          ? 'Connexion requise'
          : response.status === 429
          ? 'Trop de requêtes, réessaie dans un instant'
          : 'Le service IA est momentanément indisponible'
      );

      console.error('Erreur API ask-book:', errorMessage);
      return {
        success: false,
        answer: '',
        sources: [],
        error: errorMessage,
      };
    } catch (err: any) {
      console.error('Erreur réseau /api/gemini/ask-book:', err?.message || err);
      return {
        success: false,
        answer: '',
        sources: [],
        error: 'Le service IA est momentanément indisponible',
      };
    }
  },

  // 4. Synthèse vocale Gemini HD (800 caractères max)
  async generateHDVoice(text: string, voiceName: string = 'Kore'): Promise<TTSResult> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/gemini/tts', {
        method: 'POST',
        headers,
        body: JSON.stringify({ text, voiceName }),
      });

      const data = await response.json().catch(() => null);

      if (response.ok && data?.success && data?.audioBase64) {
        return {
          success: true,
          audioBase64: data.audioBase64,
          mimeType: data.mimeType,
          voice: data.voice,
        };
      }

      const errorMessage = data?.error || (
        response.status === 401
          ? 'Connexion requise'
          : response.status === 429
          ? 'Trop de requêtes, réessaie dans un instant'
          : 'Le service IA est momentanément indisponible'
      );

      console.error('Erreur API tts:', errorMessage);
      return { success: false, error: errorMessage };
    } catch (err: any) {
      console.error('Erreur réseau /api/gemini/tts:', err?.message || err);
      return {
        success: false,
        error: 'Le service IA est momentanément indisponible',
      };
    }
  },

  // Play audio generated from Gemini or fallback to Web Speech
  async playAudio(
    text: string,
    voiceName: string = 'Kore',
    onEnd?: () => void,
    onError?: (errMessage: string) => void
  ): Promise<void> {
    this.stopAudio();

    try {
      const ttsData = await this.generateHDVoice(text, voiceName);
      if (ttsData.success && ttsData.audioBase64) {
        const audioBytes = base64ToUint8Array(ttsData.audioBase64);

        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        activeAudioContext = ctx;

        // PCM 16-bit to Float32Array
        const int16Array = new Int16Array(audioBytes.buffer, audioBytes.byteOffset, audioBytes.byteLength / 2);
        const float32Array = new Float32Array(int16Array.length);
        for (let i = 0; i < int16Array.length; i++) {
          float32Array[i] = int16Array[i] / 32768.0;
        }

        const audioBuffer = ctx.createBuffer(1, float32Array.length, 24000);
        audioBuffer.copyToChannel(float32Array, 0);

        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        activeAudioSource = source;

        source.onended = () => {
          onEnd?.();
        };

        source.start(0);
        return;
      } else if (ttsData.error) {
        onError?.(ttsData.error);
      }
    } catch (e: any) {
      console.error('Erreur lecture audio Gemini:', e);
      onError?.('Le service IA est momentanément indisponible');
    }

    // Fallback: Web Speech API with smooth pitch and rate
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'fr-FR';
      utterance.rate = 1.0;
      utterance.pitch = voiceName.toLowerCase().includes('homme') || voiceName === 'Fenrir' || voiceName === 'Puck' ? 0.92 : 1.05;
      utterance.onend = () => onEnd?.();
      utterance.onerror = () => onEnd?.();
      window.speechSynthesis.speak(utterance);
    } else {
      onEnd?.();
    }
  },

  stopAudio() {
    if (activeAudioSource) {
      try {
        activeAudioSource.stop();
        activeAudioSource.disconnect();
      } catch {
        // Ignore if already stopped
      }
      activeAudioSource = null;
    }
    if (activeAudioContext && activeAudioContext.state !== 'closed') {
      try {
        activeAudioContext.close();
      } catch {
        // Ignore
      }
      activeAudioContext = null;
    }
    if (activeAudioElement) {
      activeAudioElement.pause();
      activeAudioElement = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  },
};
