import { DocumentItem, PageContent } from '../types';

// Pre-defined rich content for multi-page progression
const aiPages: Record<number, PageContent> = {
  5: {
    chapter: 'CHAPITRE 1',
    chapterTitle: "L'INTELLIGENCE ARTIFICIELLE",
    chapterSubtitle: 'Une révolution en marche',
    page: 5,
    paragraphs: [
      {
        id: 'p-5-1',
        text: "L'intelligence artificielle (IA) est aujourd'hui l'une des technologies les plus transformatrices de notre époque. Elle désigne la capacité des machines à imiter certaines fonctions cognitives humaines, comme l'apprentissage, le raisonnement et la prise de décision.",
        isHighlighted: false,
      },
      {
        id: 'p-5-2',
        text: "Depuis quelques années, l'IA ne se limite plus aux laboratoires de recherche. Elle s'invite dans notre quotidien : assistants vocaux, recommandations personnalisées, outils de travail, création de contenu, et bien plus encore.",
        isHighlighted: true,
        highlightColor: 'bg-yellow-300/85 text-slate-900 shadow-xs ring-1 ring-yellow-400/40',
      },
      {
        id: 'p-5-3',
        text: "Mais au-delà de ses applications, l'IA soulève aussi des questions majeures : quels sont ses limites ? Quel impact sur l'emploi ? Comment garantir une utilisation éthique et responsable ?",
        isHighlighted: false,
      },
      {
        id: 'p-5-4',
        text: "Les modèles neuronaux profonds et l'apprentissage par renforcement ouvrent désormais la voie à une nouvelle ère d'interaction humaine avec la connaissance digitale augmentée.",
        isHighlighted: false,
      },
    ],
  },
  6: {
    chapter: 'CHAPITRE 1',
    chapterTitle: 'LES RÉSEAUX DE NEURONES PROFONDS',
    chapterSubtitle: 'De la théorie mathématique aux modèles concrets',
    page: 6,
    paragraphs: [
      {
        id: 'p-6-1',
        text: "Au cœur de cette renaissance technologique se trouvent les réseaux de neurones profonds. Inspirés par la structure synaptique du cortex biologique, ces algorithmes décomposent l'information en strates d'abstractions successives.",
        isHighlighted: false,
      },
      {
        id: 'p-6-2',
        text: "L'avènement des puces d'accélération graphique et la disponibilité massive de données textuelles et visuelles ont catalysé des percées fulgurantes au cours de la dernière décennie.",
        isHighlighted: false,
      },
      {
        id: 'p-6-3',
        text: "La rétropropagation du gradient permet aujourd'hui d'ajuster des milliards de paramètres pondérés avec une convergence statistique remarquable.",
        isHighlighted: false,
      },
    ],
  },
  7: {
    chapter: 'CHAPITRE 2',
    chapterTitle: 'MODÈLES FONDATIONS & TRANSFORMERS',
    chapterSubtitle: 'Le mécanisme d attention sélective',
    page: 7,
    paragraphs: [
      {
        id: 'p-7-1',
        text: "L'introduction de l'architecture Transformer a totalement bouleversé le traitement automatique des langues. Contrairement aux approches séquentielles traditionnelles, le mécanisme d'attention analyse l'intégralité du contexte simultanément.",
        isHighlighted: false,
      },
      {
        id: 'p-7-2',
        text: "Ces modèles de fondation s'adaptent désormais à une pluralité de domaines : analyse sémantique, synthèse de rapports, programmation informatique et assistance médicale assistée.",
        isHighlighted: true,
        highlightColor: 'bg-cyan-300/85 text-slate-900 shadow-xs ring-1 ring-cyan-400/40',
      },
      {
        id: 'p-7-3',
        text: "La modélisation probabiliste du mot suivant permet ainsi de structurer des réflexions complexes avec une fluidité proche du langage humain naturel.",
        isHighlighted: false,
      },
    ],
  },
  8: {
    chapter: 'CHAPITRE 2',
    chapterTitle: 'ÉTHIQUE, BIAIS & GOUVERNANCE',
    chapterSubtitle: 'Bâtir des technologies dignes de confiance',
    page: 8,
    paragraphs: [
      {
        id: 'p-8-1',
        text: "L'alignement des systèmes d'intelligence artificielle sur des principes éthiques et humains représente la priorité absolue de la recherche contemporaine.",
        isHighlighted: false,
      },
      {
        id: 'p-8-2',
        text: "Garantir l'explicabilité, atténuer les biais d'entraînement et protéger la confidentialité des données des utilisateurs constituent le socle d'un futur numérique serein et équitable.",
        isHighlighted: false,
      },
      {
        id: 'p-8-3',
        text: "C'est dans cette perspective de collaboration harmonieuse entre l'humain et la machine que se dessinent les prochaines frontières de l'intelligence artificielle.",
        isHighlighted: false,
      },
    ],
  },
};

const webPages: Record<number, PageContent> = {
  14: {
    chapter: 'CHAPITRE 3',
    chapterTitle: 'DÉVELOPPEMENT WEB MODERNE',
    chapterSubtitle: 'Composants et Réactivité',
    page: 14,
    paragraphs: [
      {
        id: 'w-14-1',
        text: "L'écosystème web moderne repose sur des architectures orientées composants, garantissant une séparation rigoureuse des responsabilités et une réutilisabilité maximale.",
        isHighlighted: false,
      },
      {
        id: 'w-14-2',
        text: "L'optimisation des performances au premier affichage et la réduction du JavaScript exécuté côté client constituent des priorités d'ergonomie majeures.",
        isHighlighted: true,
        highlightColor: 'bg-cyan-300/85 text-slate-900 shadow-xs ring-1 ring-cyan-400/40',
      },
      {
        id: 'w-14-3',
        text: "La synchronisation réactive de l'état applicatif avec le Document Object Model assure une réactivité instantanée à chaque interaction utilisateur.",
        isHighlighted: false,
      },
    ],
  },
  15: {
    chapter: 'CHAPITRE 3',
    chapterTitle: "OPTIMISATION & PERFORMANCE WEB",
    chapterSubtitle: "Core Web Vitals et efficacité énergétique",
    page: 15,
    paragraphs: [
      {
        id: 'w-15-1',
        text: "Mesurer et optimiser le Largest Contentful Paint (LCP) et l'Interaction to Next Paint (INP) permet d'offrir une expérience utilisateur fluide sans latence perceptible.",
        isHighlighted: false,
      },
      {
        id: 'w-15-2',
        text: "Le chargement différé des médias lourds, la mise en cache agressive et la compression vectorielle réduisent drastiquement l'empreinte carbone numérique.",
        isHighlighted: false,
      },
    ],
  },
  16: {
    chapter: 'CHAPITRE 4',
    chapterTitle: 'ACCESSIBILITÉ & DESIGN SYSTEMS',
    chapterSubtitle: "Des interfaces inclusives pour tous les utilisateurs",
    page: 16,
    paragraphs: [
      {
        id: 'w-16-1',
        text: "L'accessibilité web (normes WCAG) garantit que chaque utilisateur, quelles que soient ses capacités sensorielles ou motrices, accède aux contenus sans entrave.",
        isHighlighted: false,
      },
      {
        id: 'w-16-2',
        text: "L'utilisation de contrastes typographiques rigoureux, d'arbres d'accessibilité fiables et d'étiquettes ARIA appropriées transforme chaque application en un outil universel.",
        isHighlighted: false,
      },
    ],
  },
};

/**
 * Retrieves page content dynamically.
 * If custom pages are already embedded in the document, returns them.
 * Otherwise provides rich theme-matching content for that page number.
 */
export function getDocumentPageContent(document: DocumentItem, pageNumber: number): PageContent {
  // Check if document has explicit pages array
  if (document.pages && document.pages.length > 0) {
    const found = document.pages.find((p) => p.page === pageNumber);
    if (found) return found;
  }

  // Check document specific dictionary
  if (document.id === 'doc-ai' && aiPages[pageNumber]) {
    return aiPages[pageNumber];
  }
  if (document.id === 'doc-web' && webPages[pageNumber]) {
    return webPages[pageNumber];
  }

  // If page matches document.content.page, return default content
  if (document.content && document.content.page === pageNumber) {
    return document.content;
  }

  // Fallback: Generate meaningful, contextual paragraphs for any arbitrary page
  const chapterNumber = Math.max(1, Math.ceil(pageNumber / 5));
  const chapterSection = ((pageNumber - 1) % 5) + 1;

  return {
    chapter: `CHAPITRE ${chapterNumber}`,
    chapterTitle: `${document.title.toUpperCase()} — SECTION ${chapterSection}`,
    chapterSubtitle: `Page ${pageNumber} • Analyse et approfondissement des concepts`,
    page: pageNumber,
    paragraphs: [
      {
        id: `gen-${pageNumber}-1`,
        text: `Cette section de la page ${pageNumber} approfondit les axes majeurs abordés dans ${document.title}. L'assimilation méthodique de ces principes fondamentaux permet d'en appréhender les applications directes.`,
        isHighlighted: false,
      },
      {
        id: `gen-${pageNumber}-2`,
        text: `L'observation attentive des dynamiques structurelles met en lumière l'importance d'une rigueur constante, tant dans la formulation des concepts que dans leur mise en œuvre pratique.`,
        isHighlighted: false,
      },
      {
        id: `gen-${pageNumber}-3`,
        text: `En poursuivant cette étude, nous découvrons comment les perspectives contemporaines enrichissent notre vision globale, ouvrant des horizons prometteurs pour la suite de cet ouvrage.`,
        isHighlighted: false,
      },
    ],
  };
}

/**
 * Returns structured full context of the entire book/document for Ask the Book AI.
 */
export function getDocumentFullContext(
  document: DocumentItem
): { page: number; text: string; chapter?: string }[] {
  if (!document) return [];

  // If explicit pages array exists
  if (document.pages && document.pages.length > 0) {
    return document.pages.map((p) => ({
      page: p.page,
      chapter: `${p.chapter} - ${p.chapterTitle}`,
      text: p.paragraphs.map((para) => para.text).join(' '),
    }));
  }

  // Iterate across available pages up to totalPages (max 20 for optimal context window)
  const total = Math.min(document.pagesCount || 10, 20);
  const contextList: { page: number; text: string; chapter?: string }[] = [];
  for (let p = 1; p <= total; p++) {
    const pageContent = getDocumentPageContent(document, p);
    contextList.push({
      page: p,
      chapter: `${pageContent.chapter} - ${pageContent.chapterTitle}`,
      text: pageContent.paragraphs.map((para) => para.text).join(' '),
    });
  }
  return contextList;
}
