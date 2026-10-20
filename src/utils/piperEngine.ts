import { download, stored, remove, VoiceId, TtsSession } from '@mintplex-labs/piper-tts-web';

export type PiperVoiceId =
  | 'fr_FR-siwis-medium'
  | 'fr_FR-upmc-medium'
  | 'fr_FR-tom-medium'
  | 'fr_FR-siwis-low';

export const PIPER_DEFAULT_VOICE: PiperVoiceId = 'fr_FR-siwis-medium';

export interface PiperDownloadStatus {
  voiceId: string;
  percent: number;
  isDownloading: boolean;
  error?: string | null;
}

export interface SynthesisResult {
  blob: Blob;
  durationMs: number;
  synthesisMs: number;
  fromCache?: boolean;
}

// In-memory cache of confirmed stored voices in OPFS
const storedVoicesCache = new Set<string>();

// Active downloads map to prevent duplicate simultaneous fetches
const activeDownloads = new Map<string, Promise<void>>();

// Download status listeners
type DownloadListener = (status: PiperDownloadStatus) => void;
const downloadListeners = new Set<DownloadListener>();

let currentDownloadStatus: PiperDownloadStatus = {
  voiceId: PIPER_DEFAULT_VOICE,
  percent: 0,
  isDownloading: false,
  error: null,
};

function notifyDownloadListeners(status: PiperDownloadStatus) {
  currentDownloadStatus = status;
  downloadListeners.forEach((fn) => {
    try {
      fn(status);
    } catch (e) {
      console.warn('Error in download listener:', e);
    }
  });
  updateDownloadBanner(status);
}

export function subscribePiperDownload(listener: DownloadListener) {
  downloadListeners.add(listener);
  listener(currentDownloadStatus);
  return () => {
    downloadListeners.delete(listener);
  };
}

/**
 * Normalizes any voiceId, key, or name to a valid Piper voice string
 */
export function resolvePiperVoiceId(voiceKey: string): PiperVoiceId {
  if (!voiceKey) return PIPER_DEFAULT_VOICE;
  const lower = voiceKey.toLowerCase();
  if (lower.includes('upmc')) return 'fr_FR-upmc-medium';
  if (lower.includes('tom')) return 'fr_FR-tom-medium';
  if (lower.includes('low') || lower.includes('siwis-low')) return 'fr_FR-siwis-low';
  return 'fr_FR-siwis-medium';
}

/**
 * Configure local WASM binaries and runtime paths
 */
function getLocalWasmPaths() {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const onnxPath = `${origin}/onnx/`;
  return {
    onnxWasm: onnxPath,
    piperData: 'https://cdn.jsdelivr.net/npm/@diffusionstudio/piper-wasm@1.0.0/build/piper_phonemize.data',
    piperWasm: 'https://cdn.jsdelivr.net/npm/@diffusionstudio/piper-wasm@1.0.0/build/piper_phonemize.wasm',
  };
}

// Apply WASM paths configuration at module evaluation
if (typeof window !== 'undefined') {
  const wasmPaths = getLocalWasmPaths();

  if (TtsSession.WASM_LOCATIONS) {
    TtsSession.WASM_LOCATIONS.onnxWasm = wasmPaths.onnxWasm;
    TtsSession.WASM_LOCATIONS.piperData = wasmPaths.piperData;
    TtsSession.WASM_LOCATIONS.piperWasm = wasmPaths.piperWasm;
  }

  // Pre-configure onnxruntime-web environment
  import('onnxruntime-web/wasm')
    .then((ortModule) => {
      const ort = (ortModule as any).default || ortModule;
      if (ort?.env?.wasm) {
        Object.defineProperty(ort.env.wasm, 'wasmPaths', {
          get: () => wasmPaths.onnxWasm,
          set: () => {},
          configurable: true,
        });

        const canMultiThread =
          typeof crossOriginIsolated !== 'undefined' &&
          crossOriginIsolated &&
          typeof SharedArrayBuffer !== 'undefined';

        Object.defineProperty(ort.env.wasm, 'numThreads', {
          get: () => (canMultiThread ? Math.max(1, Math.min(4, navigator.hardwareConcurrency || 1)) : 1),
          set: () => {},
          configurable: true,
        });
      }
    })
    .catch((e) => {
      console.warn('Could not pre-configure onnxruntime environment:', e);
    });
}

/**
 * 1. isPiperSupported()
 * Checks for WebAssembly, Audio element / AudioContext, and OPFS storage
 */
export function isPiperSupported(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const hasWasm =
      typeof window.WebAssembly === 'object' &&
      typeof window.WebAssembly.instantiate === 'function';
    const hasAudio =
      typeof Audio !== 'undefined' || typeof (window as any).AudioContext !== 'undefined';
    const hasStorage = Boolean(
      typeof navigator !== 'undefined' &&
        navigator.storage &&
        typeof navigator.storage.getDirectory === 'function'
    );
    return Boolean(hasWasm && hasAudio && hasStorage);
  } catch {
    return false;
  }
}

/**
 * Checks if a voice is already stored in the browser's OPFS cache
 */
export async function isVoiceStored(voiceId: string): Promise<boolean> {
  const resolved = resolvePiperVoiceId(voiceId);
  if (storedVoicesCache.has(resolved)) return true;
  if (typeof navigator === 'undefined' || !navigator.storage?.getDirectory) return false;

  try {
    const list = await stored();
    if (Array.isArray(list)) {
      list.forEach((v) => storedVoicesCache.add(v));
      return storedVoicesCache.has(resolved);
    }
  } catch (err) {
    console.warn('Could not query stored Piper voices:', err);
  }
  return false;
}

/**
 * 2. ensureVoice(voiceId, onProgress)
 * Downloads the voice model once if not already present in browser OPFS cache
 */
export async function ensureVoice(
  voiceId: string,
  onProgress?: (percent: number) => void
): Promise<void> {
  const resolved = resolvePiperVoiceId(voiceId);

  // If already confirmed in cache, report 100% and return immediately
  const alreadyStored = await isVoiceStored(resolved);
  if (alreadyStored) {
    onProgress?.(100);
    return;
  }

  // Reuse existing in-flight download if one is running
  if (activeDownloads.has(resolved)) {
    return activeDownloads.get(resolved)!;
  }

  notifyDownloadListeners({
    voiceId: resolved,
    percent: 0,
    isDownloading: true,
    error: null,
  });

  const downloadPromise = (async () => {
    try {
      await download(resolved as VoiceId, (progress) => {
        const pct = progress.total > 0 ? Math.round((progress.loaded / progress.total) * 100) : 0;
        onProgress?.(pct);
        notifyDownloadListeners({
          voiceId: resolved,
          percent: pct,
          isDownloading: true,
          error: null,
        });
      });

      storedVoicesCache.add(resolved);
      onProgress?.(100);
      notifyDownloadListeners({
        voiceId: resolved,
        percent: 100,
        isDownloading: false,
        error: null,
      });
    } catch (err: any) {
      console.error('Piper voice download failed:', err);
      notifyDownloadListeners({
        voiceId: resolved,
        percent: 0,
        isDownloading: false,
        error: err?.message || 'Erreur lors du téléchargement de la voix.',
      });
      throw err;
    } finally {
      activeDownloads.delete(resolved);
    }
  })();

  activeDownloads.set(resolved, downloadPromise);
  return downloadPromise;
}

/**
 * Calculates audio duration in milliseconds directly from WAV header
 */
export async function getWavDurationMs(blob: Blob): Promise<number> {
  try {
    const slice = await blob.slice(0, 44).arrayBuffer();
    const view = new DataView(slice);
    const byteRate = view.getUint32(28, true);
    const dataSize = blob.size > 44 ? blob.size - 44 : 0;
    if (byteRate > 0) {
      return Math.round((dataSize / byteRate) * 1000);
    }
  } catch {
    // fallback
  }
  // Standard fallback for 22050Hz 16-bit mono PCM (44100 bytes/sec)
  return Math.round((Math.max(0, blob.size - 44) / 44100) * 1000);
}

/**
 * 4. LRU Cache of the last 10 synthesized audio chunks
 */
class ChunkLruCache {
  private max: number;
  private cache: Map<string, SynthesisResult>;

  constructor(max = 10) {
    this.max = max;
    this.cache = new Map();
  }

  get(key: string): SynthesisResult | undefined {
    const item = this.cache.get(key);
    if (item !== undefined) {
      this.cache.delete(key);
      this.cache.set(key, item);
    }
    return item;
  }

  set(key: string, value: SynthesisResult): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.max) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }
    this.cache.set(key, value);
  }

  clear(): void {
    this.cache.clear();
  }
}

export const piperAudioCache = new ChunkLruCache(10);

// Slow device detection tracker (Requirement 4)
let consecutiveSlowCount = 0;
let hasShownSlowDeviceWarning = false;

function checkSlowDevice(facteur_temps_reel: number) {
  if (facteur_temps_reel > 1.0) {
    consecutiveSlowCount++;
    if (consecutiveSlowCount >= 2 && !hasShownSlowDeviceWarning) {
      hasShownSlowDeviceWarning = true;
      showSlowDeviceToast();
    }
  } else {
    consecutiveSlowCount = 0;
  }
}

function showSlowDeviceToast() {
  if (typeof document === 'undefined') return;
  const TOAST_ID = 'piper-slow-device-toast';
  let el = document.getElementById(TOAST_ID);
  if (!el) {
    el = document.createElement('div');
    el.id = TOAST_ID;
    el.style.position = 'fixed';
    el.style.bottom = '84px';
    el.style.left = '50%';
    el.style.transform = 'translateX(-50%)';
    el.style.zIndex = '99999';
    el.style.backgroundColor = 'rgba(30, 41, 59, 0.95)';
    el.style.backdropFilter = 'blur(10px)';
    el.style.border = '1px solid rgba(245, 158, 11, 0.4)';
    el.style.color = '#fef3c7';
    el.style.padding = '10px 18px';
    el.style.borderRadius = '20px';
    el.style.fontSize = '12px';
    el.style.fontWeight = '500';
    el.style.boxShadow = '0 8px 24px rgba(0,0,0,0.5)';
    el.style.maxWidth = '360px';
    el.style.textAlign = 'center';
    el.style.fontFamily = 'system-ui, -apple-system, sans-serif';
    document.body.appendChild(el);
  }
  el.innerHTML = `
    <div style="display:flex;align-items:center;gap:8px;justify-content:center;">
      <span>⚡</span>
      <span><strong>Voix HD lente sur cet appareil</strong> : Vous pouvez basculer sur une voix allégée (fr_FR-siwis-low) ou la voix du navigateur pour plus de réactivité.</span>
    </div>
  `;
  setTimeout(() => {
    el?.remove();
  }, 6000);
}

/**
 * 3. synthesizeWithStats(text, voiceId)
 * Returns a WAV audio Blob, duration in ms, and synthesis time in ms.
 * CRITICAL: Resets TtsSession._instance if voiceId changed, fixing the bug
 * where siwis, upmc, and tom sounded identical!
 */
export async function synthesizeWithStats(
  text: string,
  voiceId: string = PIPER_DEFAULT_VOICE
): Promise<SynthesisResult> {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error('Empty text cannot be synthesized');
  }

  const resolved = resolvePiperVoiceId(voiceId);
  const cacheKey = `${resolved}:::${trimmed}`;

  // Check LRU cache first
  const cached = piperAudioCache.get(cacheKey);
  if (cached) {
    return {
      ...cached,
      fromCache: true,
      synthesisMs: 0,
    };
  }

  // Ensure voice is downloaded
  await ensureVoice(resolved);

  // CRITICAL FIX: If TtsSession._instance exists and belongs to a DIFFERENT voice,
  // reset it so the new voice model is actually initialized!
  const currentSessionInstance = (TtsSession as any)._instance;
  if (currentSessionInstance && currentSessionInstance.voiceId !== resolved) {
    (TtsSession as any)._instance = null;
  }

  const wasmPaths = getLocalWasmPaths();
  const session = new TtsSession({
    voiceId: resolved as VoiceId,
    wasmPaths,
  });

  const t0 = performance.now();
  const blob = await session.predict(trimmed);
  const synthesisMs = Math.round(performance.now() - t0);

  if (!blob || blob.size === 0) {
    throw new Error('Piper synthesis returned an empty audio blob');
  }

  const durationMs = await getWavDurationMs(blob);
  const facteur_temps_reel = durationMs > 0 ? synthesisMs / durationMs : 0;
  checkSlowDevice(facteur_temps_reel);

  const result: SynthesisResult = {
    blob,
    durationMs,
    synthesisMs,
    fromCache: false,
  };

  piperAudioCache.set(cacheKey, result);
  return result;
}

/**
 * Backwards compatible synthesize()
 */
export async function synthesize(
  text: string,
  voiceId: string = PIPER_DEFAULT_VOICE
): Promise<Blob> {
  const res = await synthesizeWithStats(text, voiceId);
  return res.blob;
}

/**
 * Lightweight floating DOM banner for voice download progress
 */
function updateDownloadBanner(status: PiperDownloadStatus) {
  if (typeof document === 'undefined') return;

  const BANNER_ID = 'piper-download-banner';
  let banner = document.getElementById(BANNER_ID);

  if (!status.isDownloading && status.percent < 100 && !status.error) {
    if (banner) banner.remove();
    return;
  }

  if (status.percent >= 100) {
    if (banner) {
      banner.innerHTML = `
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="font-size:16px;">✨</span>
          <span style="font-weight:600;font-size:12px;color:#a7f3d0;">Voix HD Piper prête !</span>
        </div>
      `;
      setTimeout(() => {
        banner?.remove();
      }, 2500);
    }
    return;
  }

  if (status.error) {
    if (!banner) {
      banner = createBannerElement(BANNER_ID);
    }
    banner.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;">
        <span style="font-size:11px;color:#fca5a5;">Voix HD indisponible (${status.error})</span>
        <button id="${BANNER_ID}-close" style="background:none;border:none;color:#94a3b8;cursor:pointer;font-size:14px;">✕</button>
      </div>
    `;
    document.getElementById(`${BANNER_ID}-close`)?.addEventListener('click', () => banner?.remove());
    setTimeout(() => banner?.remove(), 4000);
    return;
  }

  if (!banner) {
    banner = createBannerElement(BANNER_ID);
  }

  banner.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:6px;min-width:240px;max-width:320px;">
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <span style="font-weight:600;font-size:12px;color:#f8fafc;">Téléchargement de la voix (≈ 60 Mo, une seule fois)</span>
        <span style="font-size:11px;color:#38bdf8;font-weight:700;">${status.percent}%</span>
      </div>
      <div style="font-size:10px;color:#94a3b8;">Connexion Wi-Fi recommandée • Lecture continue en cours avec la voix du navigateur...</div>
      <div style="width:100%;height:4px;background:#1e293b;border-radius:4px;overflow:hidden;">
        <div style="width:${status.percent}%;height:100%;background:linear-gradient(90deg, #38bdf8, #818cf8);transition:width 0.3s ease;"></div>
      </div>
    </div>
  `;
}

function createBannerElement(id: string): HTMLElement {
  const el = document.createElement('div');
  el.id = id;
  el.style.position = 'fixed';
  el.style.bottom = '80px';
  el.style.left = '50%';
  el.style.transform = 'translateX(-50%)';
  el.style.zIndex = '9999';
  el.style.backgroundColor = 'rgba(15, 23, 42, 0.95)';
  el.style.backdropFilter = 'blur(12px)';
  el.style.border = '1px solid rgba(56, 189, 248, 0.3)';
  el.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.6), 0 0 15px rgba(56, 189, 248, 0.2)';
  el.style.borderRadius = '16px';
  el.style.padding = '12px 16px';
  el.style.fontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  el.style.color = '#ffffff';
  document.body.appendChild(el);
  return el;
}
