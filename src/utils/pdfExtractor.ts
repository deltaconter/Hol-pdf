import * as pdfjsLib from 'pdfjs-dist';
// Vite bundled worker URL
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { PageContent, PageParagraph } from '../types';
import { savePageImage } from './documentStore';

// Set up pdf.js worker using Vite's local bundled worker
if (typeof window !== 'undefined') {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;
  } catch (e) {
    console.warn('Could not set GlobalWorkerOptions:', e);
  }
}

export interface ExtractedPdfResult {
  id: string;
  title: string;
  totalPages: number;
  fileSizeFormatted: string;
  coverImageUrl?: string;
  pages: PageContent[];
  hasMajorityNoText?: boolean;
}

export interface ExtractProgressCallback {
  (current: number, total: number, status: string): void;
}

/**
 * Clean and normalize text extracted from PDF tokens
 */
function cleanText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[\t ]+/g, ' ')
    .trim();
}

/**
 * Group raw PDF text items into authentic, coherent paragraphs
 * based on spatial layout.
 * When a page has no usable text, returns [] (empty array).
 */
function reconstructParagraphsFromItems(
  items: Array<{ str: string; transform: number[]; width: number; height: number; hasEOL?: boolean }>,
  pageIndex: number
): PageParagraph[] {
  if (!items || items.length === 0) {
    return [];
  }

  // Sort items from top to bottom (y desc in PDF space), then left to right (x asc)
  const sorted = [...items].sort((a, b) => {
    const yA = a.transform[5];
    const yB = b.transform[5];
    const diffY = yB - yA;
    if (Math.abs(diffY) <= 4) {
      return a.transform[4] - b.transform[4];
    }
    return diffY;
  });

  interface LineGroup {
    y: number;
    text: string;
    height: number;
  }

  const lines: LineGroup[] = [];
  let currentLine: LineGroup | null = null;

  for (const item of sorted) {
    const str = item.str;
    if (!str || !str.trim()) continue;

    const y = item.transform[5];
    const height = Math.abs(item.transform[0] || item.height || 12);

    if (!currentLine) {
      currentLine = { y, text: str, height };
    } else if (Math.abs(currentLine.y - y) <= 4) {
      if (!currentLine.text.endsWith(' ') && !str.startsWith(' ')) {
        currentLine.text += ' ' + str;
      } else {
        currentLine.text += str;
      }
      currentLine.height = Math.max(currentLine.height, height);
    } else {
      lines.push(currentLine);
      currentLine = { y, text: str, height };
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  if (lines.length === 0) {
    return [];
  }

  // Assemble lines into coherent paragraphs
  const paragraphs: PageParagraph[] = [];
  let currentParaText = '';
  let lastY = lines[0].y;
  let lastHeight = lines[0].height;
  let paraIdx = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineText = cleanText(line.text);
    if (!lineText) continue;

    const yGap = Math.abs(lastY - line.y);
    const expectedLineGap = Math.max(10, lastHeight * 1.6);
    const isSignificantGap = yGap > expectedLineGap;
    const endsWithPeriod = /[.!?:]$/.test(currentParaText.trim());

    if (currentParaText && (isSignificantGap || (endsWithPeriod && yGap > lastHeight * 1.35))) {
      paragraphs.push({
        id: `p-${pageIndex}-${paraIdx++}`,
        text: cleanText(currentParaText),
        isHighlighted: false,
      });
      currentParaText = lineText;
    } else {
      if (currentParaText) {
        if (currentParaText.endsWith('-')) {
          currentParaText = currentParaText.slice(0, -1) + lineText;
        } else {
          currentParaText += ' ' + lineText;
        }
      } else {
        currentParaText = lineText;
      }
    }

    lastY = line.y;
    lastHeight = line.height;
  }

  if (currentParaText.trim()) {
    paragraphs.push({
      id: `p-${pageIndex}-${paraIdx++}`,
      text: cleanText(currentParaText),
      isHighlighted: false,
    });
  }

  return paragraphs;
}

/**
 * Render a page to a Blob (IndexedDB storage), freeing the canvas memory immediately
 */
async function renderPageToBlob(page: any, scale = 1.3): Promise<Blob | null> {
  let canvas: HTMLCanvasElement | null = null;
  try {
    const viewport = page.getViewport({ scale });
    canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    await page.render({
      canvasContext: ctx,
      viewport: viewport,
    }).promise;

    return await new Promise<Blob | null>((resolve) => {
      canvas!.toBlob((blob) => resolve(blob), 'image/jpeg', 0.8);
    });
  } catch (err) {
    console.warn('Canvas render error for page toBlob:', err);
    return null;
  } finally {
    if (canvas) {
      canvas.width = 0;
      canvas.height = 0;
    }
  }
}

/**
 * Render reduced cover image (max width 400px, JPEG quality 0.7)
 */
async function renderCoverImage(page: any): Promise<string | undefined> {
  let canvas: HTMLCanvasElement | null = null;
  try {
    const defaultViewport = page.getViewport({ scale: 1.0 });
    const scale = defaultViewport.width > 400 ? 400 / defaultViewport.width : 1.0;
    const viewport = page.getViewport({ scale });

    canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    await page.render({
      canvasContext: ctx,
      viewport: viewport,
    }).promise;

    return canvas.toDataURL('image/jpeg', 0.7);
  } catch (err) {
    console.warn('Cover render error:', err);
    return undefined;
  } finally {
    if (canvas) {
      canvas.width = 0;
      canvas.height = 0;
    }
  }
}

/**
 * Extract genuine PDF pages faithfully with IndexedDB blob storage & performance cleanup
 */
export async function extractPdfDocument(
  file: File,
  onProgress?: ExtractProgressCallback,
  targetDocId?: string
): Promise<ExtractedPdfResult> {
  const actualDocId = targetDocId || 'doc-' + Date.now();
  const arrayBuffer = await file.arrayBuffer();

  onProgress?.(0, 1, 'Chargement du document PDF...');

  // Use local cMaps copied into /cmaps/
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    cMapUrl: '/cmaps/',
    cMapPacked: true,
  });

  const pdfDoc = await loadingTask.promise;
  const totalPages = pdfDoc.numPages;

  // Try extracting PDF metadata
  let docTitle = file.name.replace(/\.[^/.]+$/, '');
  try {
    const metadata: any = await pdfDoc.getMetadata();
    if (metadata?.info?.Title && metadata.info.Title.trim().length > 1) {
      docTitle = metadata.info.Title.trim();
    }
  } catch {
    // Ignore metadata error
  }

  const pages: PageContent[] = [];
  let coverImageUrl: string | undefined;
  let emptyPageCount = 0;

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    onProgress?.(
      pageNum,
      totalPages,
      `Extraction fidèle : page ${pageNum} sur ${totalPages}...`
    );

    const page = await pdfDoc.getPage(pageNum);

    try {
      // 1. Extract text items
      const textContent = await page.getTextContent();
      const items = textContent.items as Array<{
        str: string;
        transform: number[];
        width: number;
        height: number;
        hasEOL?: boolean;
      }>;

      // 2. Cover image (page 1) max width 400px, JPEG 0.7
      if (pageNum === 1) {
        coverImageUrl = await renderCoverImage(page);
      }

      // 3. Render page image to Blob and store in IndexedDB
      const pageBlob = await renderPageToBlob(page, 1.3);
      if (pageBlob) {
        await savePageImage(actualDocId, pageNum, pageBlob);
      }

      // 4. Reconstruct paragraphs from items
      const paragraphs = reconstructParagraphsFromItems(items, pageNum);
      const hasNoText = paragraphs.length === 0;
      if (hasNoText) {
        emptyPageCount++;
      }

      const firstLine = paragraphs[0]?.text || '';
      const chapterTitle =
        firstLine.length > 3 && firstLine.length < 90
          ? firstLine
          : `PAGE ${pageNum} • ${docTitle.toUpperCase()}`;

      const chapterSubtitle =
        paragraphs.length > 1 && paragraphs[1].text.length < 120
          ? paragraphs[1].text
          : `Contenu original — Page ${pageNum}`;

      pages.push({
        chapter: `PAGE ${pageNum}`,
        chapterTitle: hasNoText ? `PAGE ${pageNum}` : chapterTitle.slice(0, 100),
        chapterSubtitle: hasNoText ? 'Page sans texte' : chapterSubtitle.slice(0, 130),
        page: pageNum,
        paragraphs,
        hasNoText: hasNoText ? true : undefined,
        rawText: items.map((i) => i.str).join(' ').trim(),
      });
    } finally {
      // Free page resources immediately for low memory consumption
      page.cleanup();
    }
  }

  const fileSizeFormatted =
    file.size >= 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(1)} Mo`
      : `${Math.round(file.size / 1024)} Ko`;

  onProgress?.(totalPages, totalPages, 'Extraction terminée avec succès !');

  const hasMajorityNoText = emptyPageCount > totalPages * 0.5;

  return {
    id: actualDocId,
    title: docTitle,
    totalPages,
    fileSizeFormatted,
    coverImageUrl,
    pages,
    hasMajorityNoText,
  };
}
