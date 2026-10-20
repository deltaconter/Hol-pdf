import React, { useState, useMemo } from 'react';
import { ChevronLeft, Search, X, ChevronRight, BookOpen } from 'lucide-react';
import { SearchResult, DocumentItem } from '../types';
import { getDocumentPageContent } from '../utils/documentPages';

interface SearchScreenProps {
  currentDocument?: DocumentItem;
  documents?: DocumentItem[];
  onBack: () => void;
  onSelectResult: (result: SearchResult) => void;
}

export const SearchScreen: React.FC<SearchScreenProps> = ({
  currentDocument,
  documents = [],
  onBack,
  onSelectResult,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchScope, setSearchScope] = useState<'document' | 'all'>('document');
  const [selectedResultIndex, setSelectedResultIndex] = useState(0);

  // Dynamic real search across current document or all documents
  const results: SearchResult[] = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term || term.length < 2) return [];

    const found: SearchResult[] = [];
    const targetDocs = searchScope === 'document' 
      ? (currentDocument ? [currentDocument] : [])
      : (documents.length > 0 ? documents : (currentDocument ? [currentDocument] : []));

    for (const doc of targetDocs) {
      const pageCount = Math.min(doc.pagesCount || 1, 50); // Search up to 50 pages for performance
      for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
        const pageContent = getDocumentPageContent(doc, pageNum);
        for (const p of pageContent.paragraphs) {
          const lowerText = p.text.toLowerCase();
          const matchIdx = lowerText.indexOf(term);
          if (matchIdx !== -1) {
            const startSnippet = Math.max(0, matchIdx - 35);
            const prefix = (startSnippet > 0 ? '...' : '') + p.text.substring(startSnippet, matchIdx);
            const matchText = p.text.substring(matchIdx, matchIdx + term.length);
            const endSnippet = Math.min(p.text.length, matchIdx + term.length + 50);
            const suffix = p.text.substring(matchIdx + term.length, endSnippet) + (endSnippet < p.text.length ? '...' : '');

            found.push({
              id: `${doc.id}-p${pageNum}-${p.id}`,
              page: pageNum,
              snippetPrefix: prefix,
              matchText: matchText,
              snippetSuffix: suffix,
              documentTitle: doc.title,
            });

            if (found.length >= 25) return found; // Limit to 25 matches
          }
        }
      }
    }

    return found;
  }, [searchTerm, searchScope, currentDocument, documents]);

  const currentResult = results[selectedResultIndex] || results[0];

  const handleClear = () => {
    setSearchTerm('');
    setSelectedResultIndex(0);
  };

  const handlePrevResult = () => {
    if (results.length === 0) return;
    setSelectedResultIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
  };

  const handleNextResult = () => {
    if (results.length === 0) return;
    setSelectedResultIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-between bg-slate-50 dark:bg-[#040612] text-slate-900 dark:text-white overflow-hidden select-none transition-colors duration-200">
      {/* Header */}
      <div className="px-4 py-2.5 flex items-center gap-3 border-b border-slate-200 dark:border-slate-800/80 bg-white/95 dark:bg-[#080d1a]/95 backdrop-blur-md z-20 shadow-xs">
        <button
          onClick={onBack}
          aria-label="Retour"
          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Rechercher</h2>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3.5 no-scrollbar z-10">
        <div className="max-w-2xl mx-auto space-y-3.5">
          {/* Search Bar with Clear Icon */}
          <div className="relative flex items-center">
            <div className="absolute left-3.5 text-slate-400">
              <Search size={16} />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setSelectedResultIndex(0);
              }}
              placeholder={
                currentDocument
                  ? `Rechercher dans "${currentDocument.title}"...`
                  : 'Rechercher un mot, une phrase...'
              }
              className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-white dark:bg-[#0e1322] border border-purple-300 dark:border-purple-500/50 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-400 shadow-xs dark:shadow-[0_0_12px_rgba(168,85,247,0.2)]"
              autoFocus
            />
            {searchTerm && (
              <button
                onClick={handleClear}
                aria-label="Effacer la recherche"
                className="absolute right-3 text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Scope Switcher Pills */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSearchScope('document');
                setSelectedResultIndex(0);
              }}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                searchScope === 'document'
                  ? 'bg-purple-600 text-white shadow-xs dark:shadow-[0_2px_10px_rgba(147,51,234,0.4)]'
                  : 'bg-white dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-800 shadow-xs'
              }`}
            >
              Dans ce document
            </button>
            <button
              onClick={() => {
                setSearchScope('all');
                setSelectedResultIndex(0);
              }}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                searchScope === 'all'
                  ? 'bg-purple-600 text-white shadow-xs dark:shadow-[0_2px_10px_rgba(147,51,234,0.4)]'
                  : 'bg-white dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-800 shadow-xs'
              }`}
            >
              Dans tous mes documents
            </button>
          </div>

          {/* Results Metadata & Pagination */}
          {results.length > 0 && (
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
              <span className="font-medium text-slate-700 dark:text-slate-300">
                Résultats : <strong className="text-slate-900 dark:text-white">{results.length}</strong>
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevResult}
                  className="p-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-40"
                  aria-label="Précédent"
                >
                  <ChevronLeft size={15} />
                </button>
                <span className="text-[11px] font-mono">
                  {selectedResultIndex + 1} / {results.length}
                </span>
                <button
                  onClick={handleNextResult}
                  className="p-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-40"
                  aria-label="Suivant"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}

          {/* Results List Cards */}
          <div className="space-y-2.5">
            {searchTerm.trim().length > 0 && results.length === 0 && (
              <div className="text-center py-10 px-4 rounded-2xl bg-white dark:bg-[#0e1322] border border-slate-200 dark:border-slate-800/80 shadow-xs">
                <Search size={26} className="mx-auto text-slate-400 mb-2 opacity-50" />
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Aucun résultat trouvé pour "{searchTerm}"
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Vérifiez l'orthographe ou tentez une recherche plus générale.
                </p>
              </div>
            )}

            {!searchTerm.trim() && (
              <div className="text-center py-10 px-4 rounded-2xl bg-white dark:bg-[#0e1322] border border-slate-200 dark:border-slate-800/80 shadow-xs">
                <Search size={26} className="mx-auto text-purple-500/60 mb-2" />
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Recherche instantanée
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                  Tapez un mot ou une phrase pour explorer le texte de vos documents et sauter directement à la page correspondante.
                </p>
              </div>
            )}

            {results.map((item, idx) => {
              const isSelected = idx === selectedResultIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedResultIndex(idx)}
                  className={`group p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-400 dark:border-purple-500/70 shadow-xs dark:shadow-[0_0_15px_rgba(147,51,234,0.25)] ring-1 ring-purple-400 dark:ring-purple-500/40'
                      : 'bg-white dark:bg-[#0e1322]/80 border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700/80 shadow-xs'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    {/* Page Badge Number */}
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                        isSelected
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {idx + 1}
                    </div>

                    {/* Text snippet */}
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 mb-0.5">
                        {item.documentTitle ? `${item.documentTitle} • ` : ''}Page {item.page}
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed truncate">
                        <span>{item.snippetPrefix}</span>
                        <mark className="bg-yellow-300 dark:bg-yellow-400/90 text-slate-950 font-semibold px-1 py-0.2 rounded-xs">
                          {item.matchText}
                        </mark>
                        <span>{item.snippetSuffix}</span>
                      </p>
                    </div>
                  </div>

                  <ChevronRight
                    size={16}
                    className={`text-slate-400 dark:text-slate-500 transition-transform ${
                      isSelected ? 'text-purple-600 dark:text-purple-400 translate-x-0.5' : 'group-hover:text-slate-700 dark:group-hover:text-slate-300'
                    }`}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Floating Bottom Button: "Voir sur la page" */}
      {currentResult && (
        <div className="p-4 bg-white/95 dark:bg-[#080d1a]/95 border-t border-slate-200 dark:border-slate-800/80 z-20 shadow-xs">
          <div className="max-w-2xl mx-auto">
            <button
              onClick={() => onSelectResult(currentResult)}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-xs font-semibold tracking-wide flex items-center justify-center gap-2 shadow-sm dark:shadow-[0_4px_20px_rgba(129,140,248,0.4)] active:scale-[0.98] transition-all"
            >
              <BookOpen size={16} />
              <span>Voir sur la page {currentResult.page}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
