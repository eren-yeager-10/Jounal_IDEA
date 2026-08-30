'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  auth, 
  db, 
  signInWithGoogle, 
  logOut, 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  deleteDoc, 
  query, 
  orderBy,
  updateDoc,
  stripUndefined,
  type User 
} from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { type JournalEntry, type FutureLetter } from '@/lib/types';
import { Navbar, type DashboardView } from '@/components/Navbar';
import { LandingPage } from '@/components/LandingPage';
import { SidebarHistory } from '@/components/SidebarHistory';
import { JournalEditor } from '@/components/JournalEditor';
import { PatternsDashboard } from '@/components/PatternsDashboard';
import { FutureLettersView } from '@/components/FutureLettersView';
import { FutureLetterModal } from '@/components/FutureLetterModal';
import { Sparkles, Menu, X, BookPlus } from 'lucide-react';

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Active view
  const [activeView, setActiveView] = useState<DashboardView>('journal');

  // Journal entries state
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [activeEntry, setActiveEntry] = useState<JournalEntry | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Future Letters state
  const [futureLetters, setFutureLetters] = useState<FutureLetter[]>([]);
  const [futureModalOpen, setFutureModalOpen] = useState(false);

  // Create a new blank reflection
  const createNewEntry = useCallback((userId?: string) => {
    const uid = userId || user?.uid || 'anonymous';
    const now = Date.now();
    const newId = `entry-${now}`;
    const freshEntry: JournalEntry = {
      id: newId,
      userId: uid,
      title: 'New Reflection',
      content: '',
      summary: '',
      tags: ['reflection'],
      messages: [],
      createdAt: now,
      updatedAt: now,
    };

    setEntries((prev) => [freshEntry, ...prev.filter((e) => e.content.trim() !== '')]);
    setActiveEntry(freshEntry);
    setActiveView('journal');
    setMobileSidebarOpen(false);
  }, [user?.uid]);

  // Fetch User-Isolated Entries from Firestore
  const fetchEntries = useCallback(async (userId: string) => {
    try {
      const entriesRef = collection(db, 'users', userId, 'entries');
      const q = query(entriesRef, orderBy('updatedAt', 'desc'));
      const snapshot = await getDocs(q);

      const loadedEntries: JournalEntry[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as JournalEntry;
        loadedEntries.push({
          ...data,
          id: docSnap.id,
        });
      });

      setEntries(loadedEntries);

      if (loadedEntries.length > 0) {
        setActiveEntry(loadedEntries[0]);
      } else {
        createNewEntry(userId);
      }
    } catch (err: unknown) {
      console.error('Error fetching Firestore entries:', err);
      createNewEntry(userId);
    }
  }, [createNewEntry]);

  // Fetch Future Letters & Run Client-Side Delivery Gate Check
  const fetchFutureLetters = useCallback(async (userId: string) => {
    try {
      const lettersRef = collection(db, 'users', userId, 'futureLetters');
      const q = query(lettersRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);

      const todayStr = new Date().toISOString().split('T')[0];
      const lettersList: FutureLetter[] = [];

      for (const docSnap of snapshot.docs) {
        const letter = docSnap.data() as FutureLetter;
        let delivered = letter.delivered;

        // Client-side delivery gate check (2a): if date has arrived, mark delivered
        if (!delivered && letter.deliveryDate && letter.deliveryDate <= todayStr) {
          delivered = true;
          try {
            const lRef = doc(db, 'users', userId, 'futureLetters', docSnap.id);
            await updateDoc(lRef, { delivered: true });
          } catch (updateErr) {
            console.warn('Could not update delivered status:', updateErr);
          }
        }

        lettersList.push({
          ...letter,
          id: docSnap.id,
          delivered,
        });
      }

      setFutureLetters(lettersList);
    } catch (err: unknown) {
      console.error('Error fetching Future Letters:', err);
    }
  }, []);

  // Subscribe to Auth changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (currentUser) => {
        setUser(currentUser);
        setAuthLoading(false);
        if (currentUser) {
          await fetchEntries(currentUser.uid);
          await fetchFutureLetters(currentUser.uid);
        } else {
          setEntries([]);
          setActiveEntry(null);
          setFutureLetters([]);
        }
      },
      (error) => {
        console.error('Auth state change error:', error);
        setAuthError(error.message);
        setAuthLoading(false);
      }
    );

    return () => unsubscribe();
  }, [fetchEntries, fetchFutureLetters]);

  // Save entry to Firestore with guaranteed persistence and undefined stripping
  const handleSaveToFirestore = async (entryToSave?: JournalEntry) => {
    const target = entryToSave || activeEntry;
    if (!user || !target) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      const now = Date.now();
      const sanitized = stripUndefined({
        ...target,
        userId: user.uid,
        updatedAt: now,
      });

      const entryDocRef = doc(db, 'users', user.uid, 'entries', target.id);
      await setDoc(entryDocRef, sanitized, { merge: true });

      // If cartography metadata is present, also save to subcollection for clean indexing
      if (target.cartography) {
        const cartoRef = doc(db, 'users', user.uid, 'entries', target.id, 'metadata', 'cartography');
        await setDoc(cartoRef, stripUndefined(target.cartography), { merge: true });
      }

      // Update in local state
      setEntries((prev) =>
        prev.map((e) => (e.id === target.id ? sanitized : e))
      );
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to save to Firestore';
      console.error('Firestore save failed:', err);
      setSaveError(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  // Delete entry from Firestore
  const handleDeleteEntry = async (entryId: string) => {
    if (!user) return;

    try {
      const entryDocRef = doc(db, 'users', user.uid, 'entries', entryId);
      await deleteDoc(entryDocRef);

      const remaining = entries.filter((e) => e.id !== entryId);
      setEntries(remaining);

      if (activeEntry?.id === entryId) {
        if (remaining.length > 0) {
          setActiveEntry(remaining[0]);
        } else {
          createNewEntry(user.uid);
        }
      }
    } catch (err: unknown) {
      console.error('Error deleting entry:', err);
      alert('Failed to delete entry from Firestore.');
    }
  };

  // Handle local update of active entry
  const handleUpdateActiveEntry = (updated: JournalEntry) => {
    setActiveEntry(updated);
    setEntries((prev) =>
      prev.map((item) => (item.id === updated.id ? updated : item))
    );
  };

  // Auth Action Handlers
  const handleSignIn = async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      await signInWithGoogle();
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      console.error('Google Sign-in failure:', err);
      setAuthError(error.message || 'Google Sign-In failed. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logOut();
      setUser(null);
      setEntries([]);
      setActiveEntry(null);
      setFutureLetters([]);
    } catch (err: unknown) {
      console.error('Sign-out failure:', err);
    }
  };

  // Count delivered letters ready to open
  const todayStr = new Date().toISOString().split('T')[0];
  const deliveredCount = futureLetters.filter(
    (l) => l.delivered || (l.deliveryDate && l.deliveryDate <= todayStr)
  ).length;

  // Loading Screen
  if (authLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-stone-50 text-stone-900">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-800 text-amber-50 shadow-md animate-pulse">
          <Sparkles className="h-6 w-6" />
        </div>
        <p className="mt-4 font-serif text-sm font-medium text-stone-600">
          Connecting to Gemini Reflections...
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-stone-100 text-stone-900 antialiased font-sans">
      {/* Top Navbar */}
      <Navbar
        user={user}
        onSignOut={handleSignOut}
        onNewEntry={() => createNewEntry()}
        entriesCount={entries.length}
        activeView={activeView}
        onViewChange={(v) => setActiveView(v)}
        deliveredLettersCount={deliveredCount}
      />

      {/* Main Content Area */}
      {!user ? (
        <LandingPage
          onSignIn={handleSignIn}
          isLoading={authLoading}
          errorMessage={authError}
        />
      ) : (
        <main className="flex-1 flex overflow-hidden h-[calc(100vh-4rem)]">
          {/* Mobile Sidebar Toggle Button for Journal View */}
          {activeView === 'journal' && (
            <div className="fixed bottom-4 right-4 z-40 md:hidden">
              <button
                onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-stone-900 text-white shadow-lg active:scale-95"
              >
                {mobileSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          )}

          {/* Desktop & Mobile Responsive History Sidebar (Only in Journal view) */}
          {activeView === 'journal' && (
            <div
              className={`fixed inset-y-16 left-0 z-30 w-80 transform transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
                mobileSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:shadow-none'
              }`}
            >
              <SidebarHistory
                entries={entries}
                activeEntryId={activeEntry?.id || null}
                onSelectEntry={(selected) => {
                  setActiveEntry(selected);
                  setMobileSidebarOpen(false);
                }}
                onNewEntry={() => createNewEntry()}
                onDeleteEntry={handleDeleteEntry}
                isSaving={isSaving}
              />
            </div>
          )}

          {/* Main Active View Area */}
          <div className="flex-1 h-full overflow-hidden">
            {activeView === 'patterns' ? (
              <PatternsDashboard
                entries={entries}
                onNewEntry={() => createNewEntry()}
                onSelectEntry={(entry) => {
                  setActiveEntry(entry);
                  setActiveView('journal');
                }}
              />
            ) : activeView === 'letters' ? (
              <FutureLettersView
                letters={futureLetters}
                onOpenLetter={(letter) => {
                  console.log('Opened future letter:', letter.id);
                }}
                onNewFutureLetter={() => setFutureModalOpen(true)}
              />
            ) : activeEntry ? (
              <JournalEditor
                entry={activeEntry}
                onUpdateEntry={handleUpdateActiveEntry}
                onSaveToFirestore={handleSaveToFirestore}
                isSaving={isSaving}
                saveError={saveError}
                onClearSaveError={() => setSaveError(null)}
                userId={user.uid}
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center p-8 text-center text-stone-500">
                <BookPlus className="h-12 w-12 text-stone-300 mb-3" />
                <h3 className="font-serif text-lg font-semibold text-stone-800">No Active Reflection</h3>
                <p className="mt-1 text-sm text-stone-500">
                  Select a past entry from history or start a new reflection session.
                </p>
                <button
                  onClick={() => createNewEntry()}
                  className="mt-4 rounded-xl bg-stone-900 px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-stone-800"
                >
                  Create New Reflection
                </button>
              </div>
            )}
          </div>

          {/* Global Future Letter Modal */}
          {activeEntry && user && (
            <FutureLetterModal
              isOpen={futureModalOpen}
              onClose={() => setFutureModalOpen(false)}
              entry={activeEntry}
              userId={user.uid}
              onLetterCreated={(newLetter) => {
                setFutureLetters((prev) => [newLetter, ...prev]);
                setActiveView('letters');
              }}
            />
          )}
        </main>
      )}
    </div>
  );
}
