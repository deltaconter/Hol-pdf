import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Sparkles,
  Send,
  X,
  Volume2,
  VolumeX,
  BookOpen,
  Copy,
  Check,
  ChevronRight,
  Crown,
  CornerDownRight,
  ArrowRight,
  Bot,
  User,
  AlertCircle,
  RotateCw,
} from 'lucide-react';
import { geminiService, AskBookResult } from '../utils/geminiService';
import { DocumentItem, UserProfile } from '../types';

interface MessageItem {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  sources?: { page: number; quote: string }[];
  timestamp: string;
  isGemini?: boolean;
  isError?: boolean;
  retryQuestion?: string;
}

interface AskTheBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentItem;
  currentPage: number;
  documentContext: { page: number; text: string; chapter?: string }[];
  userProfile?: UserProfile;
  onJumpToPage: (page: number) => void;
  onOpenPremium?: () => void;
}

export const AskTheBookModal: React.FC<AskTheBookModalProps> = ({
  isOpen,
  onClose,
  document,
  currentPage,
  documentContext,
  userProfile,
  onJumpToPage,
  onOpenPremium,
}) => {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Suggested prompt pills
  const presetPrompts = [
    'Résume les idées fortes de cette page en 3 points',
    'Quels sont les arguments principaux de l’auteur ?',
    'Explique-moi ce concept avec une analogie simple',
    'Quelle est la conclusion ou la leçon à retenir ?',
  ];

  // Initialize with a welcoming greeting
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          sender: 'ai',
          text: `Bonjour ! Je suis votre assistant de lecture **Ask the Book** pour « ${document.title} ». Vous êtes actuellement à la **Page ${currentPage}**. Que souhaitez-vous approfondir ou clarifier dans ce document ?`,
          sources: [{ page: currentPage, quote: `Page ${currentPage}` }],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  }, [isOpen, document.title, currentPage, messages.length]);

  // Auto scroll to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Clean audio on close
  useEffect(() => {
    if (!isOpen) {
      window.speechSynthesis?.cancel();
      setSpeakingMessageId(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Rank all document pages by relevance to the question (word count > 3 letters)
  // and pick the 8 most relevant pages + active page
  const selectRelevantPages = (
    allPages: { page: number; text: string; chapter?: string }[],
    question: string,
    activePage: number
  ) => {
    if (!allPages || allPages.length === 0) return [];

    const words = question
      .toLowerCase()
      .split(/[\s,.'";:!?()\-]+/)
      .filter((w) => w.length > 3);

    const scored = allPages.map((item) => {
      const textLower = (item.text || '').toLowerCase();
      let score = 0;
      for (const word of words) {
        let idx = 0;
        while ((idx = textLower.indexOf(word, idx)) !== -1) {
          score++;
          idx += word.length;
        }
      }
      return { ...item, score };
    });

    scored.sort((a, b) => b.score - a.score);

    const top8 = scored.slice(0, 8);
    const hasActive = top8.some((p) => p.page === activePage);
    const selected = [...top8];
    if (!hasActive) {
      const activeObj = allPages.find((p) => p.page === activePage);
      if (activeObj) {
        selected.push({ ...activeObj, score: 0 });
      }
    }

    selected.sort((a, b) => a.page - b.page);
    return selected.map(({ page, text, chapter }) => ({ page, text, chapter }));
  };

  const handleSend = async (questionText?: string) => {
    const q = (questionText || inputValue).trim();
    if (!q || isLoading) return;

    // Check free trial limitation
    const isFree = !userProfile?.isPremium;
    if (isFree && messages.filter((m) => m.sender === 'user').length >= 3) {
      if (onOpenPremium) {
        onOpenPremium();
        return;
      }
    }

    const userMsg: MessageItem = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    const filteredContext = selectRelevantPages(documentContext, q, currentPage);

    try {
      const history = messages
        .filter((m) => m.id !== 'welcome' && !m.isError)
        .slice(-6)
        .map((m) => ({
          role: (m.sender === 'user' ? 'user' : 'model') as 'user' | 'model',
          text: m.text,
        }));

      const result: AskBookResult = await geminiService.askTheBook({
        question: q,
        documentTitle: document.title,
        currentPage,
        documentContext: filteredContext,
        history,
      });

      if (result.success && result.answer) {
        const aiMsg: MessageItem = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: result.answer,
          sources: result.sources,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isGemini: true,
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        const errorMsg: MessageItem = {
          id: `error-${Date.now()}`,
          sender: 'ai',
          text: result.error || "Le service IA est momentanément indisponible",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isError: true,
          retryQuestion: q,
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } catch (err: any) {
      const errorMsg: MessageItem = {
        id: `error-${Date.now()}`,
        sender: 'ai',
        text: "Le service IA est momentanément indisponible",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true,
        retryQuestion: q,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSpeak = (id: string, text: string) => {
    if (speakingMessageId === id) {
      window.speechSynthesis?.cancel();
      setSpeakingMessageId(null);
      return;
    }

    window.speechSynthesis?.cancel();
    setSpeakingMessageId(id);

    // Strip markdown chars for clean voice
    const cleanSpeech = text.replace(/[*_#«»\[\]]/g, ' ');
    const utterance = new SpeechSynthesisUtterance(cleanSpeech);
    utterance.lang = 'fr-FR';
    utterance.rate = 1.0;

    utterance.onend = () => {
      setSpeakingMessageId(null);
    };
    utterance.onerror = () => {
      setSpeakingMessageId(null);
    };

    window.speechSynthesis?.speak(utterance);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 select-none"
      style={{
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Ambient background glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 30%, rgba(155, 92, 255, 0.18), transparent 60%)',
        }}
      />

      {/* Main Drawer/Modal Card */}
      <div
        className="relative w-full max-w-lg h-[90vh] max-h-[700px] rounded-3xl overflow-hidden flex flex-col text-white shadow-2xl transition-all"
        style={{
          background: 'linear-gradient(155deg, rgba(20, 24, 40, 0.98), rgba(8, 11, 22, 0.99))',
          border: '1px solid rgba(155, 92, 255, 0.35)',
          boxShadow: '0 30px 100px rgba(0, 0, 0, 0.9), 0 0 50px rgba(155, 92, 255, 0.15)',
        }}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-800/80 bg-[#0c1122]/90 flex items-center justify-between z-10">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-sm flex-shrink-0">
              <MessageSquare size={18} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5 truncate">
                  <span>Ask the Book</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-purple-500/25 border border-purple-500/50 text-purple-200">
                    <Sparkles size={9} />
                    <span>Gemini API</span>
                  </span>
                </h2>
              </div>
              <p className="text-[10px] text-slate-400 truncate mt-0.5">
                « {document.title} » • Page active : {currentPage}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {!userProfile?.isPremium && onOpenPremium && (
              <button
                type="button"
                onClick={onOpenPremium}
                className="px-2 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                title="Débloquer les questions illimitées"
              >
                <Crown size={11} />
                <span className="hidden sm:inline">Illimité</span>
              </button>
            )}

            <button
              onClick={onClose}
              aria-label="Fermer"
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Conversation History */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 no-scrollbar text-xs">
          {messages.map((msg) => {
            const isAi = msg.sender === 'ai';

            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${isAi ? 'items-start' : 'items-end justify-end'}`}
              >
                {isAi && (
                  <div className="w-7 h-7 rounded-lg bg-purple-900/60 border border-purple-600/40 text-purple-300 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-2xs">
                    <Bot size={15} />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[80%] rounded-2xl p-3.5 space-y-2 leading-relaxed shadow-sm transition-all ${
                    msg.isError
                      ? 'bg-rose-950/70 border border-rose-800/80 text-rose-200'
                      : isAi
                      ? 'bg-[#0f172e] border border-blue-900/40 text-slate-200'
                      : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-br-xs'
                  }`}
                >
                  {/* Message body */}
                  {msg.isError ? (
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2 text-rose-300 font-semibold text-xs">
                        <AlertCircle size={15} className="flex-shrink-0 text-rose-400" />
                        <span>{msg.text}</span>
                      </div>
                      {msg.retryQuestion && (
                        <button
                          type="button"
                          onClick={() => handleSend(msg.retryQuestion)}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-700/80 hover:bg-rose-600 text-white font-bold text-[11px] transition-colors cursor-pointer shadow-xs"
                        >
                          <RotateCw size={12} />
                          <span>Réessayer</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="whitespace-pre-line text-xs font-sans">
                      {msg.text}
                    </div>
                  )}

                  {/* Sourced Page Badges (Clickable to jump directly to page!) */}
                  {!msg.isError && isAi && msg.sources && msg.sources.length > 0 && (
                    <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-1.5 text-[10px]">
                      <span className="text-slate-400 font-medium">Pages citées :</span>
                      {msg.sources.map((src, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            onJumpToPage(src.page);
                            onClose();
                          }}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-purple-950/80 border border-purple-700/60 text-purple-300 hover:bg-purple-900 hover:text-white font-mono font-semibold transition-all cursor-pointer shadow-2xs"
                          title={`Aller directement à la page ${src.page} du document`}
                        >
                          <BookOpen size={10} />
                          <span>Page {src.page}</span>
                          <ArrowRight size={9} />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Audio read-aloud & copy action bar for AI */}
                  {!msg.isError && isAi && msg.id !== 'welcome' && (
                    <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-800/40">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-mono">{msg.timestamp}</span>
                        {msg.isGemini && (
                          <span className="inline-flex items-center gap-0.5 text-[8px] font-mono text-purple-300 bg-purple-950/70 border border-purple-700/50 px-1.5 py-0.2 rounded-full">
                            <Sparkles size={7} /> Gemini
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleSpeak(msg.id, msg.text)}
                          className="flex items-center gap-1 hover:text-purple-300 cursor-pointer transition-colors"
                          title="Écouter la réponse avec la voix"
                        >
                          {speakingMessageId === msg.id ? (
                            <>
                              <VolumeX size={12} className="text-amber-400" />
                              <span className="text-amber-300">Arrêter</span>
                            </>
                          ) : (
                            <>
                              <Volume2 size={12} />
                              <span>Écouter</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCopy(msg.id, msg.text)}
                          className="flex items-center gap-1 hover:text-purple-300 cursor-pointer transition-colors"
                          title="Copier la réponse"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check size={11} className="text-emerald-400" />
                              <span className="text-emerald-400">Copié</span>
                            </>
                          ) : (
                            <>
                              <Copy size={11} />
                              <span>Copier</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {!isAi && (
                  <div className="w-7 h-7 rounded-lg bg-indigo-600/40 border border-indigo-400/40 text-indigo-200 flex items-center justify-center flex-shrink-0 mb-0.5">
                    <User size={15} />
                  </div>
                )}
              </div>
            );
          })}

          {/* Loading bubble */}
          {isLoading && (
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-purple-900/60 border border-purple-600/40 text-purple-300 flex items-center justify-center flex-shrink-0 animate-pulse">
                <Sparkles size={14} />
              </div>
              <div className="p-3.5 rounded-2xl bg-[#0f172e] border border-blue-900/40 text-purple-300 text-xs flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                <span>Recherche des citations et synthèse de la réponse...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Preset Prompt Pills (Quick Questions) */}
        <div className="px-3 py-2 bg-[#0a0f1e]/90 border-t border-slate-800/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {presetPrompts.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSend(preset)}
              disabled={isLoading}
              className="px-2.5 py-1 rounded-full bg-slate-900/90 border border-purple-500/30 hover:border-purple-400 text-slate-300 hover:text-white text-[10px] whitespace-nowrap transition-all cursor-pointer shadow-2xs flex-shrink-0"
            >
              {preset}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-[#080d1a] border-t border-slate-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Posez votre question au livre..."
              disabled={isLoading}
              className="flex-1 px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all shadow-inner"
            />

            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="p-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-md transition-all cursor-pointer flex-shrink-0"
              aria-label="Envoyer"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
