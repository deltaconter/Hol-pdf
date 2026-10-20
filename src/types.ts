export interface PageParagraph {
  id: string;
  text: string;
  isHighlighted?: boolean;
  highlightColor?: string;
}

export interface PageContent {
  chapter: string;
  chapterTitle: string;
  chapterSubtitle: string;
  page: number;
  paragraphs: PageParagraph[];
  pageImageUrl?: string;
  rawText?: string;
  hasNoText?: boolean;
}

export interface DocumentItem {
  id: string;
  title: string;
  subtitle?: string;
  fileSize: string;
  pagesCount: number;
  lastRead: string;
  color: 'red' | 'blue' | 'purple' | 'green' | 'amber';
  coverGradient: string;
  coverImageUrl?: string;
  isOriginalPdf?: boolean;
  isFavorite: boolean;
  category: 'pdf' | 'manga' | 'guide' | 'report';
  progressPage: number;
  summary?: string;
  content: PageContent;
  pages?: PageContent[];
}

export interface VoiceOption {
  id: string;
  name: string;
  gender: 'Femme' | 'Homme';
  language: string;
  tone: string;
  avatarUrl: string;
  rate: number;
  pitch: number;
  voiceGenderStyle: string;
  isPremiumOnly?: boolean;
  isGeminiHd?: boolean;
  engine?: 'piper' | 'browser' | 'gemini';
}

export interface SearchResult {
  id: string;
  page: number;
  snippetPrefix: string;
  matchText: string;
  snippetSuffix: string;
  documentTitle?: string;
}

export type AppScreen =
  | 'splash'
  | 'login'
  | 'home'
  | 'reader'
  | 'search'
  | 'audio'
  | 'voices'
  | 'library'
  | 'profile'
  | 'history';

export interface UserProfile {
  name: string;
  email: string;
  avatarUrl?: string;
  isPremium: boolean;
  storageUsedMb: number;
  storageTotalMb: number;
  studioHdMinutesUsed: number;
  studioHdMinutesTotal: number;
  billingCycleRenewsAt?: string;
  darkMode: boolean;
  currentVoiceId: string;
  language: string;
  stats: {
    totalReadingMinutes: number;
    totalBooks: number;
    highlightsCount: number;
    weeklyStreak: number;
  };
}
