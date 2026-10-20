import express from "express";
import http from "http";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Modality } from "@google/genai";
import { createClient as createSupabaseClient, SupabaseClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();
const PORT = 3000;

// Model definitions
const candidateModels = ["gemini-3.8-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];
const ttsModel = "gemini-3.8-flash-lite-tts";

// Supabase server client initialization
const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "";
const supabaseServerClient: SupabaseClient | null = (supabaseUrl && supabaseAnonKey)
  ? createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;

// CORS: Only process.env.APP_URL and http://localhost:3000 outside production
const allowedOrigins = new Set<string>();
if (process.env.APP_URL) {
  allowedOrigins.add(process.env.APP_URL.trim().replace(/\/$/, ""));
}
if (process.env.NODE_ENV !== "production") {
  allowedOrigins.add("http://localhost:3000");
  allowedOrigins.add("http://127.0.0.1:3000");
}

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.has(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "credentialless");
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }
  next();
});

// Serve local ONNX WASM binaries and runtime modules
app.use(
  "/onnx",
  express.static(path.join(process.cwd(), "public/onnx"), {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".wasm")) {
        res.setHeader("Content-Type", "application/wasm");
      } else if (filePath.endsWith(".mjs") || filePath.endsWith(".js")) {
        res.setHeader("Content-Type", "application/javascript");
      }
    },
  })
);
app.use(express.static(path.join(process.cwd(), "public")));

app.use(express.json({ limit: "10mb" }));

// In-memory rate limiting per user (or IP if unauthenticated in dev)
interface RateLimitRecord {
  count: number;
  resetAt: number;
}
const rateLimitStore = new Map<string, RateLimitRecord>();

function rateLimiter(limit: number, type: "text" | "tts") {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const userId = (req as any).user?.id || req.ip || "unknown";
    const key = `${userId}:${type}`;
    const now = Date.now();
    const record = rateLimitStore.get(key);

    if (!record || now > record.resetAt) {
      rateLimitStore.set(key, { count: 1, resetAt: now + 60000 });
      return next();
    }

    if (record.count >= limit) {
      return res.status(429).json({ success: false, error: "Trop de requêtes, réessaie dans un instant" });
    }

    record.count += 1;
    return next();
  };
}

// Clean up stale rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of rateLimitStore.entries()) {
    if (now > v.resetAt) {
      rateLimitStore.delete(k);
    }
  }
}, 300000);

// Authentication middleware for /api/gemini/* routes
async function requireSupabaseAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;

  if (supabaseServerClient) {
    if (!token) {
      return res.status(401).json({ success: false, error: "Connexion requise" });
    }
    try {
      const { data, error } = await supabaseServerClient.auth.getUser(token);
      if (error || !data?.user) {
        return res.status(401).json({ success: false, error: "Connexion requise" });
      }
      (req as any).user = data.user;
      return next();
    } catch {
      return res.status(401).json({ success: false, error: "Connexion requise" });
    }
  }

  // If Supabase is not configured in development, allow requests when process.env.NODE_ENV !== "production"
  if (process.env.NODE_ENV !== "production") {
    (req as any).user = { id: `dev-${req.ip || "local"}` };
    return next();
  }

  return res.status(401).json({ success: false, error: "Connexion requise" });
}

// Lazy initialization of Gemini SDK on server-side
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    supabaseConfigured: Boolean(supabaseServerClient),
    timestamp: new Date().toISOString(),
  });
});

// Helper to generate text with model fallback
async function generateWithFallback(
  ai: GoogleGenAI,
  prompt: string,
  systemInstruction: string,
  temperature: number = 0.7
): Promise<string | null> {
  let lastError: any = null;
  for (const model of candidateModels) {
    try {
      const res = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction,
          temperature,
        },
      });
      if (res.text && res.text.trim().length > 0) {
        return res.text;
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`Model ${model} unavailable or failed:`, err.message || err);
    }
  }
  if (lastError) {
    console.error("Tous les modèles Gemini ont échoué :", lastError.message || lastError);
  }
  return null;
}

// A. Résumé instantané & « Mode Express » (Gemini)
// Limite : 20 requêtes/minute
app.post("/api/gemini/summarize", requireSupabaseAuth, rateLimiter(20, "text"), async (req, res) => {
  try {
    const { documentTitle, chapters, content } = req.body || {};
    const chaptersText = Array.isArray(chapters) && chapters.length > 0
      ? chapters.join(" et ")
      : "les chapitres sélectionnés";

    const ai = getGeminiClient();
    if (!ai) {
      console.error("Erreur résumé Gemini : Clé API GEMINI_API_KEY non configurée.");
      return res.status(502).json({
        success: false,
        error: "Le service IA est momentanément indisponible",
      });
    }

    const prompt = `Tu es l'assistant de lecture audio intelligent HolPdf.
L'utilisateur a activé le "Mode Express" pour écouter un résumé concis et percutant de 1 ou 2 chapitres du livre/document "${documentTitle || 'Document'}".

Chapitres sélectionnés : ${chaptersText}
Contenu textuel fourni :
"""
${(content || '').slice(0, 10000)}
"""

Consignes de rédaction :
1. Fais un résumé audio-friendly (idéal pour être écouté à l'oral).
2. Commence par une phrase d'accroche captivante résumant la thèse principale.
3. Développe 3 points clés clairs et mémorables (avec tirets ou puces).
4. Termine par une conclusion percutante de 2 phrases.
5. Langue : Français soigné, naturel et dynamique. Longueur : environ 150 à 250 mots.`;

    const summaryText = await generateWithFallback(
      ai,
      prompt,
      "Tu es un narrateur d'audiolivre d'élite et tuteur pédagogique pour l'application HolPdf.",
      0.7
    );

    if (summaryText) {
      return res.json({
        success: true,
        summary: summaryText,
        source: "gemini",
      });
    }

    console.error("Erreur résumé Gemini : Aucun texte généré.");
    return res.status(502).json({
      success: false,
      error: "Le service IA est momentanément indisponible",
    });
  } catch (error: any) {
    console.error("Erreur résumé Gemini:", error?.message || error);
    return res.status(502).json({
      success: false,
      error: "Le service IA est momentanément indisponible",
    });
  }
});

// B. Explication de passage / « Ask the Book » (Q&A interactif)
// Limite : 20 requêtes/minute
app.post("/api/gemini/explain", requireSupabaseAuth, rateLimiter(20, "text"), async (req, res) => {
  try {
    const { text, documentTitle, customQuestion } = req.body || {};
    const safeText = typeof text === "string" ? text : "";
    const question = customQuestion || "Explique-moi ce concept simplement avec une analogie claire de la vie quotidienne.";

    if (!safeText.trim()) {
      return res.status(400).json({ success: false, error: "Passage manquant" });
    }

    const ai = getGeminiClient();
    if (!ai) {
      console.error("Erreur explication Gemini : Clé API GEMINI_API_KEY non configurée.");
      return res.status(502).json({
        success: false,
        error: "Le service IA est momentanément indisponible",
      });
    }

    const prompt = `Tu es le tuteur personnel "Ask the Book" dans l'application HolPdf.
L'utilisateur est en train de lire/écouter "${documentTitle || 'un document'}" et a mis en pause pour demander des éclaircissements sur ce passage :

« ${safeText} »

Demande de l'utilisateur : "${question}"

Consignes :
1. Explique le fond de l'idée en termes simples, clairs et accessibles à un débutant.
2. Utilise IMPÉRATIVEMENT une métaphore ou une analogie concrète tirée de la vie de tous les jours (ex: cuisine, sport, circulation routière, musique, construction).
3. Reste concis (1 à 2 paragraphes bien rythmés, faits pour être écoutés).
4. Ton chaleureux, encourageant et stimulant. Langue : Français.`;

    const explanation = await generateWithFallback(
      ai,
      prompt,
      "Tu es un vulgarisateur scientifique et tuteur bienveillant qui rend n'importe quel concept évident.",
      0.6
    );

    if (explanation) {
      return res.json({
        success: true,
        explanation,
        source: "gemini",
      });
    }

    console.error("Erreur explication Gemini : Aucun résultat généré.");
    return res.status(502).json({
      success: false,
      error: "Le service IA est momentanément indisponible",
    });
  } catch (error: any) {
    console.error("Erreur explication Gemini:", error?.message || error);
    return res.status(502).json({
      success: false,
      error: "Le service IA est momentanément indisponible",
    });
  }
});

// C. IA Conversationnelle « Ask the Book » avec citations directes et pages sourcées
// Limite : 20 requêtes/minute
app.post("/api/gemini/ask-book", requireSupabaseAuth, rateLimiter(20, "text"), async (req, res) => {
  try {
    const { question, documentTitle, currentPage, documentContext, history } = req.body || {};
    if (!question || !question.trim()) {
      return res.status(400).json({ success: false, error: "Question requise" });
    }

    const ai = getGeminiClient();
    if (!ai) {
      console.error("Erreur ask-book Gemini : Clé API GEMINI_API_KEY non configurée.");
      return res.status(502).json({
        success: false,
        error: "Le service IA est momentanément indisponible",
      });
    }

    // Set of allowed pages from documentContext + active page
    const allowedPages = new Set<number>();
    if (Array.isArray(documentContext)) {
      for (const item of documentContext) {
        if (typeof item.page === "number") {
          allowedPages.add(item.page);
        }
      }
    }
    if (typeof currentPage === "number") {
      allowedPages.add(currentPage);
    }

    const formattedContext = Array.isArray(documentContext) && documentContext.length > 0
      ? documentContext
          .map((c: any) => `[PAGE ${c.page || 1}${c.chapter ? ' - ' + c.chapter : ''}] :\n${(c.text || '').slice(0, 2000)}`)
          .join("\n\n---\n\n")
      : "";

    let prompt = `Tu es l'assistant de lecture conversationnel "Ask the Book" dans l'application HolPdf.
L'utilisateur est en train de lire le document : "${documentTitle || 'Document'}".
Page active du lecteur : Page ${currentPage || 1}.`;

    if (Array.isArray(history) && history.length > 0) {
      prompt += `\n\nHistorique récent de l'échange :\n` +
        history
          .slice(-6)
          .map((h: any) => `${h.role === 'user' ? 'Lecteur' : 'Ask the Book'} : ${h.text}`)
          .join("\n");
    }

    prompt += `\n\nNouvelle question du lecteur :\n"${question}"`;

    if (formattedContext) {
      prompt += `\n\nExtraits textuels tirés du document pour formuler votre réponse :\n"""\n${formattedContext.slice(0, 25000)}\n"""`;
    }

    prompt += `\n\nDirectives indispensables :
1. Réponds UNIQUEMENT à partir des extraits fournis. Si la réponse n'y figure pas, dis-le clairement. Ne cite que des pages présentes dans les extraits.
2. CITATIONS DIRECTES : Intègre des citations exactes tirées des extraits entre guillemets français : « ... ».
3. SOURCES PRÉCISES : Indique clairement la page source pour chaque citation ou idée majeure sous la forme [Page X]. Ne cite aucune page en dehors des extraits fournis.
4. Fournis une analyse claire, bien aérée avec des paragraphes ou puces si nécessaire.
5. Rédige en français soigné, dynamique et agréable à lire ou à écouter.`;

    const responseText = await generateWithFallback(
      ai,
      prompt,
      "Tu es un bibliothécaire d'élite, érudit et rigoureux qui répond UNIQUEMENT à partir des extraits fournis et ne cite que les pages présentes dans les extraits.",
      0.4
    );

    if (responseText) {
      // Supprime tout [Page X] dont X n'est pas dans les pages envoyées
      let filteredResponse = responseText.replace(/\[Page\s*(\d+)\]/gi, (match, p1) => {
        const pageNum = parseInt(p1, 10);
        return allowedPages.has(pageNum) ? match : "";
      });
      // Clean up whitespace
      filteredResponse = filteredResponse.replace(/[ \t]{2,}/g, " ").trim();

      // Extract valid sources
      const pageMatches = [...filteredResponse.matchAll(/\[Page\s*(\d+)\]/gi)];
      const sources = pageMatches
        .map((m) => parseInt(m[1], 10))
        .filter((pageNum) => allowedPages.has(pageNum))
        .map((p) => ({ page: p, quote: `Page ${p}` }));
      const uniqueSources = sources.filter((v, i, a) => a.findIndex((t) => t.page === v.page) === i);

      return res.json({
        success: true,
        answer: filteredResponse,
        sources: uniqueSources.length > 0 ? uniqueSources : (allowedPages.has(currentPage) ? [{ page: currentPage, quote: `Page ${currentPage}` }] : []),
        source: "gemini",
      });
    }

    console.error("Erreur ask-book Gemini : Aucun texte retourné.");
    return res.status(502).json({
      success: false,
      error: "Le service IA est momentanément indisponible",
    });
  } catch (error: any) {
    console.error("Erreur ask-book Gemini:", error?.message || error);
    return res.status(502).json({
      success: false,
      error: "Le service IA est momentanément indisponible",
    });
  }
});

// D. Synthèse Vocale HD (Gemini TTS)
// Limite : 10 requêtes/minute, plafonné à 800 caractères
app.post("/api/gemini/tts", requireSupabaseAuth, rateLimiter(10, "tts"), async (req, res) => {
  try {
    const { text, voiceName = "Kore" } = req.body;

    if (!text || typeof text !== "string") {
      return res.status(400).json({ success: false, error: "Texte manquant" });
    }

    // Plafonne le texte à 800 caractères
    const trimmedText = text.trim().slice(0, 800);
    if (!trimmedText) {
      return res.status(400).json({ success: false, error: "Texte vide" });
    }

    const ai = getGeminiClient();
    if (!ai) {
      console.error("Erreur TTS Gemini : Clé API GEMINI_API_KEY non configurée.");
      return res.status(502).json({
        success: false,
        error: "Le service IA est momentanément indisponible",
      });
    }

    const allowedVoices = ["Kore", "Puck", "Fenrir", "Zephyr", "Charon"];
    const chosenVoice = allowedVoices.includes(voiceName) ? voiceName : "Kore";

    const response = await ai.models.generateContent({
      model: ttsModel,
      contents: [{ parts: [{ text: trimmedText }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: chosenVoice },
          },
        },
      },
    });

    const audioPart = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;
    if (audioPart && audioPart.data) {
      return res.json({
        success: true,
        audioBase64: audioPart.data,
        mimeType: audioPart.mimeType || "audio/pcm;rate=24000",
        sampleRate: 24000,
        voice: chosenVoice,
      });
    }

    console.error("Erreur TTS Gemini : Aucun flux audio retourné par le modèle.");
    return res.status(502).json({
      success: false,
      error: "Le service IA est momentanément indisponible",
    });
  } catch (error: any) {
    console.error("Erreur TTS Gemini:", error?.message || error);
    return res.status(502).json({
      success: false,
      error: "Le service IA est momentanément indisponible",
    });
  }
});

async function startServer() {
  const server = http.createServer(app);

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        watch: null,
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`HolPdf Server running on http://0.0.0.0:${PORT}`);
    console.log("Modèles Gemini configurés :", {
      textCandidates: candidateModels,
      ttsModel: ttsModel,
    });
  });
}

startServer();
