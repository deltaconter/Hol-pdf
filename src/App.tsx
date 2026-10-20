import React, { useState } from 'react';
import { initialDocuments, voiceList, initialUserProfile } from './data/mockData';
import { DocumentItem, VoiceOption, UserProfile, AppScreen, SearchResult } from './types';
import { SplashScreen } from './screens/SplashScreen';
import { LoginScreen } from './screens/LoginScreen';
import { HomeScreen } from './screens/HomeScreen';
import { ReaderScreen } from './screens/ReaderScreen';
import { SearchScreen } from './screens/SearchScreen';
import { AudioPlayerScreen } from './screens/AudioPlayerScreen';
import { VoiceSelectorScreen } from './screens/VoiceSelectorScreen';
import { LibraryScreen } from './screens/LibraryScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { ImportModal } from './components/ImportModal';
import { PremiumModal } from './components/PremiumModal';
import { AskTheBookModal } from './components/AskTheBookModal';
import { getDocumentFullContext } from './utils/documentPages';
import { speechController } from './utils/audioSpeech';
import {
  getSupabase,
  syncDocumentToSupabase,
  deleteDocumentFromSupabase,
} from './utils/supabaseClient';
import {
  saveDocument,
  loadAllDocuments,
  deleteDocument,
  migrateFromLocalStorage,
  requestStoragePersistence,
  stripPageImages,
} from './utils/documentStore';
import { AlertTriangle, X } from 'lucide-react';

const STORAGE_PROFILE_KEY = 'holpdf_user_profile_cache';

const getInitialProfile = (): UserProfile => {
  try {
    const saved = localStorage.getItem(STORAGE_PROFILE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') {
        return { ...initialUserProfile, ...parsed };
      }
    }
  } catch (e) {
    console.error('Error loading stored profile:', e);
  }
  return initialUserProfile;
};

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('splash');
  const [documents, setDocuments] = useState<DocumentItem[]>(() =>
    initialDocuments.map(stripPageImages)
  );
  const [activeDocument, setActiveDocument] = useState<DocumentItem | null>(() => {
    return initialDocuments.length > 0 ? stripPageImages(initialDocuments[0]) : null;
  });
  const [currentVoice, setCurrentVoice] = useState<VoiceOption>(voiceList[0]);
  const [userProfile, setUserProfile] = useState<UserProfile>(getInitialProfile);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  const [askTheBookDoc, setAskTheBookDoc] = useState<DocumentItem | null>(null);
  const [storageErrorToast, setStorageErrorToast] = useState<string | null>(null);

  const saveDebounceTimers = React.useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Debounced save for individual modified documents (500 ms)
  const queueSaveDocument = React.useCallback((doc: DocumentItem) => {
    const existing = saveDebounceTimers.current.get(doc.id);
    if (existing) clearTimeout(existing);

    const timer = setTimeout(async () => {
      saveDebounceTimers.current.delete(doc.id);
      try {
        await saveDocument(doc);
      } catch (err: any) {
        console.error('Failed to save document to IndexedDB:', err);
        setStorageErrorToast(
          err?.name === 'QuotaExceededError'
            ? 'Espace de stockage saturé. Supprimez des documents pour libérer de la place.'
            : 'Échec de la sauvegarde locale du document.'
        );
      }
    }, 500);

    saveDebounceTimers.current.set(doc.id, timer);
  }, []);

  // Load documents from IndexedDB on startup (migrates legacy localStorage if present)
  React.useEffect(() => {
    async function initStorage() {
      try {
        const migrated = await migrateFromLocalStorage();
        if (migrated && migrated.length > 0) {
          setDocuments(migrated);
          setActiveDocument(migrated[0]);
          return;
        }

        const storedDocs = await loadAllDocuments();
        if (storedDocs && storedDocs.length > 0) {
          setDocuments(storedDocs);
          setActiveDocument(storedDocs[0]);
        } else {
          for (const d of initialDocuments) {
            try {
              await saveDocument(d);
            } catch {
              // Ignore initial seed warning
            }
          }
        }
      } catch (err: any) {
        console.warn('Note: initialisation du stockage IndexedDB avec repli mémoire:', err);
        if (err?.name === 'QuotaExceededError') {
          setStorageErrorToast('Espace de stockage saturé. Impossible d’enregistrer.');
        }
      }
    }

    initStorage();
  }, []);

  const handleOpenAskTheBook = React.useCallback((doc?: DocumentItem | null) => {
    const target = doc || activeDocument || documents[0] || null;
    if (target) {
      setActiveDocument(target);
      setAskTheBookDoc(target);
    }
  }, [activeDocument, documents]);

  // Synchronize dark/light theme on document root
  React.useEffect(() => {
    if (userProfile.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [userProfile.darkMode]);

  // Save profile to local cache (lightweight)
  React.useEffect(() => {
    try {
      localStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(userProfile));
    } catch (e) {
      console.warn('Could not cache profile to localStorage:', e);
    }
  }, [userProfile]);

  // Check Supabase session on startup and subscribe to auth changes
  React.useEffect(() => {
    const client = getSupabase();
    if (!client) return;

    client.auth.getSession().then(({ data }) => {
      if (data?.session?.user) {
        const u = data.session.user;
        const uName =
          u.user_metadata?.full_name ||
          u.user_metadata?.name ||
          u.email?.split('@')[0] ||
          'Utilisateur';
        setUserProfile((prev) => ({
          ...prev,
          email: u.email || '',
          name: uName,
        }));
      }
    });

    const { data: authListener } = client.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const u = session.user;
        const uName =
          u.user_metadata?.full_name ||
          u.user_metadata?.name ||
          u.email?.split('@')[0] ||
          'Utilisateur';
        setUserProfile((prev) => ({
          ...prev,
          email: u.email || '',
          name: uName,
        }));
      } else if (event === 'SIGNED_OUT') {
        setUserProfile((prev) => ({
          ...prev,
          email: '',
          name: 'Utilisateur',
          avatarUrl: '',
          isPremium: false,
        }));
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const handleSelectDocument = (doc: DocumentItem) => {
    setActiveDocument(doc);
    setCurrentScreen('reader');
  };

  const handleOpenAudio = (doc: DocumentItem) => {
    setActiveDocument(doc);
    setCurrentScreen('audio');
  };

  const handleSelectSearchResult = (result: SearchResult) => {
    const targetDoc = documents.find((d) => result.id.startsWith(d.id)) || activeDocument || documents[0];
    if (targetDoc) {
      setActiveDocument({
        ...targetDoc,
        progressPage: result.page,
      });
      setCurrentScreen('reader');
    }
  };

  const handleToggleFavorite = (id: string) => {
    setDocuments((prev) => {
      let target: DocumentItem | undefined;
      const updated = prev.map((d) => {
        if (d.id === id) {
          target = { ...d, isFavorite: !d.isFavorite };
          return target;
        }
        return d;
      });
      if (target) {
        queueSaveDocument(target);
        syncDocumentToSupabase(target);
      }
      return updated;
    });
  };

  const handleDeleteDocument = async (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    try {
      await deleteDocument(id);
    } catch (err) {
      console.warn('Error deleting document from IndexedDB:', err);
    }
    deleteDocumentFromSupabase(id);
  };

  const handleImportDocument = async (newDoc: DocumentItem) => {
    const cleanDoc = stripPageImages(newDoc);
    setDocuments((prev) => [cleanDoc, ...prev]);
    setActiveDocument(cleanDoc);
    try {
      await saveDocument(cleanDoc);
      await requestStoragePersistence();
    } catch (err: any) {
      console.error('Error saving imported document to IndexedDB:', err);
      setStorageErrorToast(
        err?.name === 'QuotaExceededError'
          ? 'Espace de stockage saturé. Le document n’a pas pu être sauvegardé.'
          : 'Erreur lors de la sauvegarde du document.'
      );
    }
    syncDocumentToSupabase(cleanDoc);
    setCurrentScreen('reader');
  };

  const handleUpdateProgressPage = React.useCallback(
    (docId: string, page: number) => {
      let updatedTarget: DocumentItem | null = null;
      setDocuments((prev) => {
        const existing = prev.find((d) => d.id === docId);
        if (existing && existing.progressPage === page) return prev;
        const updated = prev.map((d) => {
          if (d.id === docId) {
            updatedTarget = { ...d, progressPage: page };
            return updatedTarget;
          }
          return d;
        });
        return updated;
      });
      if (updatedTarget) {
        queueSaveDocument(updatedTarget);
        syncDocumentToSupabase(updatedTarget);
      }
      setActiveDocument((prev) => {
        if (!prev) return null;
        if (prev.id === docId && prev.progressPage === page) return prev;
        return prev.id === docId ? { ...prev, progressPage: page } : prev;
      });
    },
    [queueSaveDocument]
  );

  const handleActiveDocProgress = React.useCallback(
    (page: number) => {
      if (activeDocument?.id) {
        handleUpdateProgressPage(activeDocument.id, page);
      }
    },
    [activeDocument?.id, handleUpdateProgressPage]
  );

  const handleResetReadingMinutes = React.useCallback(() => {
    setUserProfile((prev) => ({
      ...prev,
      stats: {
        ...prev.stats,
        totalReadingMinutes: 0,
      },
    }));
  }, []);

  const handleClearHistory = React.useCallback(() => {
    setDocuments((prev) =>
      prev.map((d) => ({
        ...d,
        progressPage: 1,
        lastRead: 'Non débuté',
      }))
    );
  }, []);

  // Accumulate reading minutes dynamically when reading or listening
  React.useEffect(() => {
    if (currentScreen !== 'reader' && currentScreen !== 'audio') return;

    const timer = setInterval(() => {
      setUserProfile((prev) => ({
        ...prev,
        stats: {
          ...prev.stats,
          totalReadingMinutes: (prev.stats?.totalReadingMinutes || 0) + 1,
        },
      }));
    }, 60000);

    return () => clearInterval(timer);
  }, [currentScreen]);

  // Render current active screen full screen
  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'splash':
        return (
          <SplashScreen
            onFinish={() => {
              if (userProfile.email && userProfile.email.trim() !== '') {
                setCurrentScreen('home');
              } else {
                setCurrentScreen('login');
              }
            }}
          />
        );
      case 'login':
        return (
          <LoginScreen
            userProfile={userProfile}
            onLoginSuccess={(email, name) => {
              setUserProfile((p) => ({
                ...p,
                ...(email ? { email } : {}),
                ...(name ? { name } : {}),
              }));
              setCurrentScreen('home');
            }}
          />
        );
      case 'home':
        return (
          <HomeScreen
            documents={documents}
            userProfile={userProfile}
            onSelectDocument={handleSelectDocument}
            onOpenAudio={handleOpenAudio}
            onOpenAskTheBook={handleOpenAskTheBook}
            onNavigate={setCurrentScreen}
            onOpenUpload={() => setIsImportModalOpen(true)}
            onToggleFavorite={handleToggleFavorite}
            onDeleteDocument={handleDeleteDocument}
          />
        );
      case 'reader':
        return (
          <ReaderScreen
            document={activeDocument}
            currentVoice={currentVoice}
            userProfile={userProfile}
            onUpdateUserProfile={(updated) =>
              setUserProfile((prev) => ({ ...prev, ...updated }))
            }
            onBack={() => setCurrentScreen('home')}
            onNavigate={setCurrentScreen}
            onOpenAudio={handleOpenAudio}
            onUpdateProgressPage={handleActiveDocProgress}
            onOpenUpload={() => setIsImportModalOpen(true)}
          />
        );
      case 'audio':
        return (
          <AudioPlayerScreen
            document={activeDocument}
            currentVoice={currentVoice}
            onBack={() => setCurrentScreen('home')}
            onNavigate={setCurrentScreen}
            onOpenVoiceSelector={() => setCurrentScreen('voices')}
            onOpenAskTheBook={handleOpenAskTheBook}
            onUpdateProgressPage={handleActiveDocProgress}
            onOpenUpload={() => setIsImportModalOpen(true)}
          />
        );
      case 'voices':
        return (
          <VoiceSelectorScreen
            selectedVoice={currentVoice}
            onSelectVoice={(voice) => {
              setCurrentVoice(voice);
              setUserProfile((prev) => ({ ...prev, currentVoiceId: voice.id }));
            }}
            onBack={() => setCurrentScreen('audio')}
            userProfile={userProfile}
            onOpenPremium={() => setIsPremiumModalOpen(true)}
          />
        );
      case 'library':
        return (
          <LibraryScreen
            documents={documents}
            onSelectDocument={handleSelectDocument}
            onOpenAskTheBook={handleOpenAskTheBook}
            onNavigate={setCurrentScreen}
            onOpenUpload={() => setIsImportModalOpen(true)}
            onToggleFavorite={handleToggleFavorite}
          />
        );
      case 'history':
        return (
          <HistoryScreen
            documents={documents}
            userProfile={userProfile}
            onSelectDocument={handleSelectDocument}
            onOpenAudio={handleOpenAudio}
            onNavigate={setCurrentScreen}
            onOpenUpload={() => setIsImportModalOpen(true)}
            onResetReadingMinutes={handleResetReadingMinutes}
            onClearHistory={handleClearHistory}
          />
        );
      case 'search':
        return (
          <SearchScreen
            currentDocument={activeDocument || undefined}
            documents={documents}
            onSelectResult={handleSelectSearchResult}
            onBack={() => setCurrentScreen('home')}
          />
        );
      case 'profile':
        return (
          <ProfileScreen
            userProfile={userProfile}
            currentVoice={currentVoice}
            onNavigate={setCurrentScreen}
            onOpenUpload={() => setIsImportModalOpen(true)}
            onOpenVoiceSelector={() => setCurrentScreen('voices')}
            onUpdateUserProfile={(updated) =>
              setUserProfile((prev) => ({ ...prev, ...updated }))
            }
          />
        );
      default:
        return (
          <HomeScreen
            documents={documents}
            userProfile={userProfile}
            onSelectDocument={handleSelectDocument}
            onOpenAudio={handleOpenAudio}
            onOpenAskTheBook={handleOpenAskTheBook}
            onNavigate={setCurrentScreen}
            onOpenUpload={() => setIsImportModalOpen(true)}
            onToggleFavorite={handleToggleFavorite}
            onDeleteDocument={handleDeleteDocument}
          />
        );
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none flex items-center justify-center">
      {/* Mobile-first fixed viewport container */}
      <div className="w-full h-full max-w-md mx-auto relative overflow-hidden bg-white dark:bg-[#040612] shadow-2xl flex flex-col">
        {/* Storage Error Toast / Banner */}
        {storageErrorToast && (
          <div className="absolute top-4 left-4 right-4 z-50 p-3 rounded-2xl bg-rose-950/95 border border-rose-600 text-white shadow-2xl flex items-center justify-between gap-2 animate-fadeIn">
            <div className="flex items-center gap-2 text-xs">
              <AlertTriangle size={16} className="text-rose-400 shrink-0" />
              <span>{storageErrorToast}</span>
            </div>
            <button
              onClick={() => setStorageErrorToast(null)}
              className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {renderCurrentScreen()}

        {/* Global Import Modal */}
        <ImportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onImportDocument={handleImportDocument}
        />

        {/* Global Premium Modal */}
        <PremiumModal
          isOpen={isPremiumModalOpen}
          onClose={() => setIsPremiumModalOpen(false)}
          userProfile={userProfile}
          onUpdateUserProfile={(updated) =>
            setUserProfile((prev) => ({ ...prev, ...updated }))
          }
        />

        {/* Global Ask the Book Conversational AI Modal */}
        {askTheBookDoc && (
          <AskTheBookModal
            isOpen={Boolean(askTheBookDoc)}
            onClose={() => setAskTheBookDoc(null)}
            document={askTheBookDoc}
            currentPage={askTheBookDoc.progressPage || 1}
            documentContext={getDocumentFullContext(askTheBookDoc)}
            userProfile={userProfile}
            onJumpToPage={(page) => {
              handleSelectDocument({ ...askTheBookDoc, progressPage: page });
              setAskTheBookDoc(null);
            }}
            onOpenPremium={() => setIsPremiumModalOpen(true)}
          />
        )}
      </div>
    </div>
  );
}
