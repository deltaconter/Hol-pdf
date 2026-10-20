import React, { useState, useRef } from 'react';
import { X, UploadCloud, FileText, CheckCircle2, Sparkles, AlertCircle, Layers } from 'lucide-react';
import confetti from 'canvas-confetti';
import { AdSenseBanner } from './ads/AdSenseBanner';
import { DocumentItem, PageContent } from '../types';
import { extractPdfDocument } from '../utils/pdfExtractor';

import { requestStoragePersistence } from '../utils/documentStore';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportDocument: (doc: DocumentItem) => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  onImportDocument,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStatus, setProgressStatus] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [scanWarningDoc, setScanWarningDoc] = useState<DocumentItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFile = async (file: File) => {
    setFileName(file.name);
    setIsProcessing(true);
    setErrorMessage(null);
    setScanWarningDoc(null);
    setProgressPercent(10);
    setProgressStatus('Initialisation du fichier...');

    const isPdf =
      file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

    if (isPdf) {
      try {
        const docId = 'doc-' + Date.now();
        const result = await extractPdfDocument(
          file,
          (current, total, statusText) => {
            const pct = Math.round((current / Math.max(1, total)) * 100);
            setProgressPercent(pct);
            setProgressStatus(statusText);
          },
          docId
        );

        if (!result.pages || result.pages.length === 0) {
          throw new Error('Aucune page lisible trouvée dans ce PDF.');
        }

        const newDoc: DocumentItem = {
          id: result.id || docId,
          title: result.title || file.name.replace(/\.[^/.]+$/, ''),
          subtitle: `${result.totalPages} page${result.totalPages > 1 ? 's' : ''} extraite${result.totalPages > 1 ? 's' : ''} fidèlement`,
          fileSize: result.fileSizeFormatted,
          pagesCount: result.totalPages,
          lastRead: "à l'instant",
          color: 'purple',
          coverGradient: 'from-fuchsia-600 via-purple-700 to-indigo-900',
          coverImageUrl: result.coverImageUrl,
          isFavorite: true,
          category: 'pdf',
          isOriginalPdf: true,
          progressPage: 1,
          summary: `Document PDF importé avec extraction exacte de ses ${result.totalPages} pages originales.`,
          content: result.pages[0],
          pages: result.pages,
        };

        // Request storage persistence after import
        requestStoragePersistence().catch(() => {});

        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 },
        });

        if (result.hasMajorityNoText) {
          setIsProcessing(false);
          setScanWarningDoc(newDoc);
          return;
        }

        setIsProcessing(false);
        onImportDocument(newDoc);
        onClose();
        return;
      } catch (err: any) {
        console.error('Erreur extraction PDF:', err);
        setErrorMessage(
          err?.message ||
            "Impossible d'extraire ce document PDF. Vérifiez qu'il n'est pas protégé par mot de passe."
        );
        setIsProcessing(false);
        return;
      }
    }

    // Fallback for non-PDF text/epub files: extract text with page pagination
    try {
      setProgressStatus('Extraction du texte structuré...');
      const text = await file.text();
      const rawLines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

      // Split into real pages of ~25 lines per page
      const linesPerPage = 20;
      const pagesCount = Math.max(1, Math.ceil(rawLines.length / linesPerPage));
      const extractedPages: PageContent[] = [];

      for (let p = 1; p <= pagesCount; p++) {
        const pageLines = rawLines.slice((p - 1) * linesPerPage, p * linesPerPage);
        extractedPages.push({
          chapter: `PAGE ${p}`,
          chapterTitle: pageLines[0] || `${file.name.replace(/\.[^/.]+$/, '')} — Page ${p}`,
          chapterSubtitle: `Contenu extrait — Page ${p}`,
          page: p,
          paragraphs: pageLines.map((line, lIdx) => ({
            id: `txt-${p}-${lIdx + 1}`,
            text: line,
            isHighlighted: false,
          })),
        });
      }

      const newDoc: DocumentItem = {
        id: 'doc-' + Date.now(),
        title: file.name.replace(/\.[^/.]+$/, ''),
        subtitle: `${pagesCount} page${pagesCount > 1 ? 's' : ''} structurée${pagesCount > 1 ? 's' : ''}`,
        fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} Mo`,
        pagesCount,
        lastRead: "à l'instant",
        color: 'purple',
        coverGradient: 'from-fuchsia-600 via-purple-700 to-indigo-900',
        isFavorite: true,
        category: 'pdf',
        progressPage: 1,
        summary: `Document importé : ${file.name}`,
        content: extractedPages[0],
        pages: extractedPages,
      };

      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.6 },
      });

      setIsProcessing(false);
      onImportDocument(newDoc);
      onClose();
    } catch (err: any) {
      setErrorMessage("Échec de la lecture du fichier : " + (err?.message || 'Erreur inconnue'));
      setIsProcessing(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDemoImport = () => {
    setIsProcessing(true);
    setProgressStatus('Génération du document de démonstration multi-pages...');
    setProgressPercent(50);

    setTimeout(() => {
      // Create a fully multi-page demonstration document with faithful individual pages
      const demoPages: PageContent[] = [
        {
          chapter: 'PAGE 1',
          chapterTitle: 'RAPPORT STRATÉGIQUE : INTELLIGENCE ARTIFICIELLE 2026',
          chapterSubtitle: 'Page de garde et introduction générale',
          page: 1,
          paragraphs: [
            {
              id: 'demo-1-1',
              text: "Rapport d'Orientation Technologique — Édition 2026. Ce document présente les avancées majeures dans le domaine des modèles d'intelligence artificielle et leurs applications industrielles.",
              isHighlighted: false,
            },
            {
              id: 'demo-1-2',
              text: "Objectif du rapport : Établir une cartographie précise des technologies génératives, des systèmes d'écoute audio multimodaux et de la gestion documentaire intelligente.",
              isHighlighted: true,
              highlightColor: 'bg-yellow-300/80 text-slate-900',
            },
          ],
        },
        {
          chapter: 'PAGE 2',
          chapterTitle: 'SECTION 1 : LES NOUVELLES ARCHITECTURES NEURONALES',
          chapterSubtitle: 'Analyse des modèles multimodaux de nouvelle génération',
          page: 2,
          paragraphs: [
            {
              id: 'demo-2-1',
              text: "L'émergence des modèles à fenêtres de contexte étendues permet aujourd'hui d'analyser des centaines de pages d'un seul bloc, sans perte de repères sémantiques.",
              isHighlighted: false,
            },
            {
              id: 'demo-2-2',
              text: "Les mécanismes d'attention sélective réduisent les coûts computationnels tout en conservant une grande précision lors de l'extraction des données techniques.",
              isHighlighted: true,
              highlightColor: 'bg-cyan-300/80 text-slate-900',
            },
            {
              id: 'demo-2-3',
              text: "Dans le secteur de la lecture assistée, la synthèse vocale neuronale produit des intonations naturelles adaptées au rythme propre de chaque phrase.",
              isHighlighted: false,
            },
          ],
        },
        {
          chapter: 'PAGE 3',
          chapterTitle: 'SECTION 2 : EXTRACTION FIDÈLE DE DOCUMENTS PDF',
          chapterSubtitle: 'Conservation rigoureuse de la mise en page originale',
          page: 3,
          paragraphs: [
            {
              id: 'demo-3-1',
              text: "L'enjeu central de la numérisation réside dans la fidélité absolue aux pages réelles du document source, évitant les amalgames ou les pertes de contexte.",
              isHighlighted: true,
              highlightColor: 'bg-emerald-300/80 text-slate-900',
            },
            {
              id: 'demo-3-2',
              text: "HolPdf garantit que chaque page affichée correspond exactement à la page correspondante du fichier original, tant au niveau du texte que du découpage visuel.",
              isHighlighted: false,
            },
            {
              id: 'demo-3-3',
              text: "L'auditeur peut ainsi naviguer page par page tout en bénéficiant de l'enchaînement sonore automatique et sans coupure.",
              isHighlighted: false,
            },
          ],
        },
        {
          chapter: 'PAGE 4',
          chapterTitle: 'SECTION 3 : PERSPECTIVES ET SYNTHÈSE',
          chapterSubtitle: 'Recommandations pour les flux de lecture assistée',
          page: 4,
          paragraphs: [
            {
              id: 'demo-4-1',
              text: "La convergence entre le surlignage interactif et la restitution audio continue transforme l'étude documentaire en une expérience immersive.",
              isHighlighted: false,
            },
            {
              id: 'demo-4-2',
              text: "En résumé, la technologie de lecture augmentée favorise une mémorisation accrue et une accessibilité universelle pour tous les types d'utilisateurs.",
              isHighlighted: false,
            },
          ],
        },
      ];

      const demoDoc: DocumentItem = {
        id: 'doc-demo-' + Date.now(),
        title: 'Guide Stratégique IA 2026',
        subtitle: '4 pages extraites fidèlement',
        fileSize: '3.8 Mo',
        pagesCount: 4,
        lastRead: "à l'instant",
        color: 'blue',
        coverGradient: 'from-blue-600 via-indigo-700 to-slate-900',
        isFavorite: true,
        category: 'pdf',
        isOriginalPdf: true,
        progressPage: 1,
        summary: 'Exemple multi-pages démontrant la fidélité de pagination réelle de HolPdf.',
        content: demoPages[0],
        pages: demoPages,
      };

      confetti({
        particleCount: 50,
        spread: 60,
      });

      setIsProcessing(false);
      onImportDocument(demoDoc);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-sm rounded-2xl bg-[#0d1222] border border-purple-500/40 p-5 shadow-[0_10px_35px_rgba(147,51,234,0.3)] text-white select-none">
        {/* Close button */}
        <button
          onClick={onClose}
          disabled={isProcessing}
          aria-label="Fermer"
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-30 cursor-pointer"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-2.5 mb-3">
          <div className="p-2 rounded-xl bg-purple-600/30 text-purple-300 border border-purple-500/30">
            <UploadCloud size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Importer un document PDF</h3>
            <p className="text-[11px] text-purple-300 font-medium flex items-center gap-1">
              <Layers size={11} />
              <span>Extraction fidèle page par page</span>
            </p>
          </div>
        </div>

        {/* Error notification if any */}
        {errorMessage && (
          <div className="mb-3 p-2.5 rounded-xl bg-rose-950/80 border border-rose-800 text-xs text-rose-200 flex items-start gap-2">
            <AlertCircle size={15} className="text-rose-400 flex-shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Scan Warning Dialog if >50% pages have no text */}
        {scanWarningDoc ? (
          <div className="p-4 rounded-xl border border-amber-500/40 bg-amber-500/10 space-y-3 animate-fadeIn text-left">
            <div className="flex items-start gap-2.5 text-amber-400">
              <AlertCircle size={20} className="shrink-0 mt-0.5 text-amber-500" />
              <div>
                <h4 className="text-xs font-bold text-white">Document numérisé détecté</h4>
                <p className="text-xs text-amber-200/90 mt-1 leading-relaxed">
                  Ce PDF semble être un scan : la lecture vocale ne fonctionnera pas sans reconnaissance de texte (OCR).
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Les pages réelles resteront consultables en mode visuel dans le lecteur.
                </p>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setScanWarningDoc(null);
                  onClose();
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => {
                  onImportDocument(scanWarningDoc);
                  setScanWarningDoc(null);
                  onClose();
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                Ouvrir quand même
              </button>
            </div>
          </div>
        ) : !isProcessing ? (
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`p-6 rounded-xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center ${
              dragActive
                ? 'border-purple-400 bg-purple-950/30 scale-[1.02]'
                : 'border-slate-700 bg-slate-900/50 hover:border-purple-500/50 hover:bg-slate-900'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,.epub"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFile(e.target.files[0]);
                }
              }}
            />

            <div className="w-12 h-12 rounded-full bg-indigo-950/70 text-indigo-400 flex items-center justify-center mb-2 shadow-inner">
              <FileText size={24} />
            </div>

            <p className="text-xs font-semibold text-slate-200">
              Glissez-déposez votre PDF ici
            </p>
            <p className="text-[10px] text-slate-400 mt-1">
              ou cliquez pour sélectionner un fichier
            </p>

            <div className="mt-3 flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-purple-950/80 border border-purple-800/60 text-purple-300 text-[9px] font-semibold">
                PDF natif • Toutes pages
              </span>
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[9px] font-mono">
                Jusqu'à 50 Mo
              </span>
            </div>
          </div>
        ) : (
          /* Processing State with Live Progress Bar */
          <div className="p-6 rounded-xl border border-purple-500/30 bg-purple-950/20 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <Sparkles size={24} className="animate-spin text-purple-400" />
            </div>

            <div className="space-y-1 w-full">
              <h4 className="text-xs font-bold text-white">Extraction haute fidélité</h4>
              <p className="text-[11px] text-purple-300 font-mono truncate px-2">
                {progressStatus || 'Traitement du PDF en cours...'}
              </p>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-purple-500 to-indigo-400 h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.max(8, progressPercent)}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              {progressPercent}%
            </span>

            {/* AdSense Native Banner while extracting */}
            <AdSenseBanner slot="import-modal" format="compact" className="w-full mt-2" />
          </div>
        )}

        {/* Quick Demo Import Button */}
        {!isProcessing && (
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">Pas de PDF sous la main ?</span>
            <button
              onClick={handleDemoImport}
              className="px-3 py-1.5 rounded-lg bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200 text-xs font-semibold border border-indigo-700/60 transition-colors cursor-pointer"
            >
              Tester un exemple multi-pages
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

