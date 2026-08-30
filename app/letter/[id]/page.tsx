'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { LetterEnvelope } from '@/components/LetterEnvelope';
import { Sparkles, ArrowLeft, AlertCircle, RefreshCw } from 'lucide-react';

interface LetterPageProps {
  params: Promise<{ id: string }>;
}

export default function SealedLetterPage({ params }: LetterPageProps) {
  const resolvedParams = use(params);
  const letterId = resolvedParams.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAlreadyOpened, setIsAlreadyOpened] = useState(false);
  const [openedAt, setOpenedAt] = useState<number | null>(null);
  const [teaser, setTeaser] = useState<string>('A sealed reflection across time...');
  const [content, setContent] = useState<string>('');
  const [createdAt, setCreatedAt] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchLetter() {
      if (!letterId) return;
      setLoading(true);
      setError(null);

      try {
        const res = await fetch('/api/letters/open', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ letterId }),
        });

        const data = await res.json();

        if (!isMounted) return;

        if (res.status === 404 || data.status === 'not_found') {
          setError('This sealed letter could not be found. It may have expired or never existed.');
          setLoading(false);
          return;
        }

        if (data.status === 'already_opened') {
          setIsAlreadyOpened(true);
          setOpenedAt(data.openedAt || null);
          setTeaser(data.teaser || 'A sealed letter that was previously opened and burned.');
          setLoading(false);
          return;
        }

        if (data.status === 'success' && data.letter) {
          setContent(data.letter.content);
          setTeaser(data.letter.teaser || 'A sealed reflection waiting to be revealed.');
          setCreatedAt(data.letter.createdAt || null);
          setIsAlreadyOpened(false);
          setLoading(false);
          return;
        }

        throw new Error(data.error || 'Failed to open sealed letter.');
      } catch (err: unknown) {
        if (!isMounted) return;
        const msg = err instanceof Error ? err.message : 'Error retrieving letter.';
        setError(msg);
        setLoading(false);
      }
    }

    fetchLetter();

    return () => {
      isMounted = false;
    };
  }, [letterId]);

  return (
    <div className="min-h-screen bg-[#F4EDE4] text-stone-900 flex flex-col justify-between selection:bg-amber-800 selection:text-white">
      {/* Top Header */}
      <header className="border-b border-[#E3D6C5] bg-[#F7F2EB]/90 backdrop-blur-md px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link href="/" className="flex items-center space-x-2 text-amber-950 hover:opacity-80 transition-opacity">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-800 text-amber-50">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="font-serif text-base font-bold tracking-tight">Gemini Reflections</span>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center space-x-1 rounded-lg border border-amber-900/20 bg-white/80 px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-white transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Open Journal</span>
          </Link>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        {loading ? (
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#8C2D19] text-amber-100 shadow-lg animate-pulse">
              <RefreshCw className="h-6 w-6 animate-spin" />
            </div>
            <p className="font-serif text-sm font-medium text-stone-700">
              Unlocking atomic seal...
            </p>
          </div>
        ) : error ? (
          <div className="mx-auto max-w-md rounded-2xl border border-rose-200 bg-white p-8 text-center shadow-lg">
            <AlertCircle className="mx-auto h-10 w-10 text-rose-600 mb-3" />
            <h2 className="font-serif text-xl font-bold text-stone-900">Letter Unavailable</h2>
            <p className="mt-2 text-xs leading-relaxed text-stone-600">{error}</p>
            <div className="mt-6">
              <Link
                href="/"
                className="inline-flex items-center rounded-xl bg-stone-900 px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-stone-800"
              >
                Return to Journal
              </Link>
            </div>
          </div>
        ) : (
          <LetterEnvelope
            teaser={teaser}
            content={content}
            senderTitle="Sealed Reflection"
            dateLabel={createdAt ? new Date(createdAt).toLocaleDateString() : undefined}
            isAlreadyOpened={isAlreadyOpened}
            openedAt={openedAt}
            canReopen={false}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E3D6C5] py-4 text-center text-xs text-stone-500 font-serif">
        <span>Protected with one-time read-and-burn atomic storage</span>
      </footer>
    </div>
  );
}
