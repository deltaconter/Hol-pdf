import React, { useState } from 'react';
import {
  FolderOpen,
  Search,
  Star,
  UploadCloud,
  FileText,
  SlidersHorizontal,
  Sparkles,
  MessageSquare,
} from 'lucide-react';
import { Navigation } from '../components/Navigation';
import { DocumentItem, AppScreen } from '../types';

interface LibraryScreenProps {
  documents: DocumentItem[];
  onSelectDocument: (doc: DocumentItem) => void;
  onOpenAskTheBook?: (doc: DocumentItem) => void;
  onNavigate: (screen: AppScreen) => void;
  onOpenUpload: () => void;
  onToggleFavorite: (id: string) => void;
}

export const LibraryScreen: React.FC<LibraryScreenProps> = ({
  documents,
  onSelectDocument,
  onOpenAskTheBook,
  onNavigate,
  onOpenUpload,
  onToggleFavorite,
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'pdf' | 'fav' | 'downloaded'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.subtitle && doc.subtitle.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (activeFilter === 'pdf') {
      return (
        doc.category === 'pdf' ||
        !doc.category ||
        (typeof doc.category === 'string' && doc.category.toLowerCase().includes('pdf')) ||
        Boolean(doc.isOriginalPdf)
      );
    }
    if (activeFilter === 'fav') return doc.isFavorite;
    if (activeFilter === 'downloaded') return true; // all local mock items
    return true;
  });

  return (
    <div className="relative w-full h-full flex flex-col justify-between bg-slate-50 dark:bg-[#040612] text-slate-900 dark:text-white overflow-hidden select-none transition-colors duration-200">
      {/* Header */}
      <div className="px-4 py-2.5 flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 bg-white/95 dark:bg-[#080d1a]/95 backdrop-blur-md z-20 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md text-purple-600 dark:text-purple-400">
            <FolderOpen size={18} />
          </div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Bibliothèque</h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('search')}
            aria-label="Rechercher"
            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <Search size={17} />
          </button>
          <button
            aria-label="Filtres"
            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <SlidersHorizontal size={17} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 no-scrollbar z-10">
        <div className="max-w-4xl mx-auto space-y-4">
        {/* Category Pill Filters */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeFilter === 'all'
                ? 'bg-purple-600 text-white shadow-xs dark:shadow-[0_2px_10px_rgba(147,51,234,0.4)]'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-800 shadow-xs'
            }`}
          >
            Tous
          </button>

          <button
            onClick={() => setActiveFilter('pdf')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeFilter === 'pdf'
                ? 'bg-purple-600 text-white shadow-xs dark:shadow-[0_2px_10px_rgba(147,51,234,0.4)]'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-800 shadow-xs'
            }`}
          >
            PDF
          </button>

          <button
            onClick={() => setActiveFilter('fav')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeFilter === 'fav'
                ? 'bg-purple-600 text-white shadow-xs dark:shadow-[0_2px_10px_rgba(147,51,234,0.4)]'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-800 shadow-xs'
            }`}
          >
            Favoris
          </button>

          <button
            onClick={() => setActiveFilter('downloaded')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeFilter === 'downloaded'
                ? 'bg-purple-600 text-white shadow-xs dark:shadow-[0_2px_10px_rgba(147,51,234,0.4)]'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-800 shadow-xs'
            }`}
          >
            Téléchargés
          </button>
        </div>

        {/* Responsive Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 pb-2">
          {filteredDocs.map((doc) => {
            return (
              <div
                key={doc.id}
                onClick={() => onSelectDocument(doc)}
                className="group relative flex flex-col rounded-xl overflow-hidden bg-white dark:bg-[#0e1322] border border-slate-200 dark:border-slate-800/80 hover:border-purple-400 dark:hover:border-purple-500/50 transition-all cursor-pointer shadow-xs dark:shadow-lg"
              >
                {/* Book Cover Container */}
                <div
                  className={`relative w-full aspect-[4/3] ${
                    doc.coverImageUrl ? 'bg-slate-950' : `bg-gradient-to-br ${doc.coverGradient}`
                  } p-2.5 flex flex-col justify-between overflow-hidden`}
                >
                  {doc.coverImageUrl && (
                    <img
                      src={doc.coverImageUrl}
                      alt={doc.title}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  )}
                  {/* Pattern/Gradient overlay */}
                  <div
                    className={`absolute inset-0 ${
                      doc.coverImageUrl
                        ? 'bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-black/30'
                        : 'bg-black/25'
                    }`}
                  ></div>

                  {/* Favorite Star Icon button */}
                  <div className="relative z-10 flex justify-end">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(doc.id);
                      }}
                      className="p-1 rounded-full bg-slate-950/40 hover:bg-slate-950/70 text-yellow-400 backdrop-blur-xs transition-colors"
                      title={doc.isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                    >
                      <Star
                        size={12}
                        className={doc.isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-slate-400'}
                      />
                    </button>
                  </div>

                  {/* Title Preview on Cover */}
                  <div className="relative z-10">
                    <span className="text-[8px] uppercase tracking-wider font-bold block">
                      <span className="text-white">Hol</span><span className="text-red-500">Pdf</span> Book
                    </span>
                    <h4 className="text-[11px] font-black text-white leading-tight drop-shadow-md line-clamp-2">
                      {doc.title}
                    </h4>
                  </div>
                </div>

                {/* Card Meta */}
                <div className="p-2.5 flex items-center justify-between flex-1 gap-1">
                  <div className="min-w-0 flex-1">
                    <h4 className="text-[11px] font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors">
                      {doc.title}
                    </h4>
                    <p className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {doc.fileSize} • {doc.pagesCount} pages
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onOpenAskTheBook) {
                        onOpenAskTheBook(doc);
                      } else {
                        onSelectDocument(doc);
                      }
                    }}
                    className="p-1 rounded-lg bg-purple-100 dark:bg-purple-950/70 hover:bg-purple-200 dark:hover:bg-purple-900/80 text-purple-600 dark:text-purple-300 transition-colors flex-shrink-0"
                    title="Ask the Book (IA conversationnelle)"
                  >
                    <MessageSquare size={13} />
                  </button>
                </div>
              </div>
            );
          })}

          {/* Card 6: "Importer un PDF" (Dashed Upload Card) */}
          <div
            onClick={onOpenUpload}
            className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-purple-300 dark:border-purple-500/40 hover:border-purple-500 bg-purple-50/50 dark:bg-purple-950/15 hover:bg-purple-100/60 dark:hover:bg-purple-900/25 transition-all cursor-pointer min-h-[160px] text-center group"
          >
            <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-900/40 border border-purple-300 dark:border-purple-500/40 flex items-center justify-center text-purple-600 dark:text-purple-300 group-hover:scale-110 shadow-xs group-hover:shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all mb-2">
              <UploadCloud size={24} />
            </div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors">
              Importer un PDF
            </h4>
            <p className="text-[9px] text-slate-500 dark:text-slate-400 mt-1 max-w-[120px]">
              Depuis votre appareil ou le cloud
            </p>
          </div>
        </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <Navigation
        currentScreen="library"
        onNavigate={onNavigate}
        onOpenUpload={onOpenUpload}
      />
    </div>
  );
};
