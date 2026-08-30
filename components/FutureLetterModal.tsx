'use client';

import React, { useState } from 'react';
import { type JournalEntry, type FutureLetter } from '@/lib/types';
import { db, doc, setDoc, stripUndefined } from '@/lib/firebase';
import { 
  Sparkles, 
  Clock, 
  Calendar, 
  Send, 
  X, 
  RefreshCw, 
  Check, 
  Feather,
  AlertCircle
} from 'lucide-react';

interface FutureLetterModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: JournalEntry;
  userId: string;
  onLetterCreated: (letter: FutureLetter) => void;
}

export function FutureLetterModal({
  isOpen,
  onClose,
  entry,
  userId,
  onLetterCreated,
}: FutureLetterModalProps) {
  // Default delivery date to 30 days from now in YYYY-MM-DD
  const getDefaultDate = (daysAhead: number = 30) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    return d.toISOString().split('T')[0];
  };

  const [deliveryDate, setDeliveryDate] = useState(getDefaultDate(30));
  const [teaser, setTeaser] = useState('');
  const [letterContent, setLetterContent] = useState('');
  const [isDrafting, setIsDrafting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleDraftWithGemini = async () => {
    if (!entry.content.trim()) {
      setError('Please ensure your journal entry has content before drafting a letter.');
      return;
    }

    setIsDrafting(true);
    setError(null);

    try {
      const res = await fetch('/api/gemini/future-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entryTitle: entry.title,
          entryContent: entry.content,
          deliveryDate,
          recentThemes: entry.tags,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to draft letter.');
      }

      setTeaser(data.teaser || '');
      setLetterContent(data.letter || '');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error communicating with Gemini.';
      setError(msg);
    } finally {
      setIsDrafting(false);
    }
  };

  const handleSaveFutureLetter = async () => {
    if (!letterContent.trim()) {
      setError('Please generate or write your letter content first.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const now = Date.now();
      const letterId = `fut-${now}-${Math.random().toString(36).substring(2, 7)}`;
      
      const newLetter: FutureLetter = {
        id: letterId,
        userId,
        deliveryDate,
        delivered: false,
        teaser: teaser || 'A message across time from your future self...',
        content: letterContent,
        fromEntryTitle: entry.title || 'Journal Reflection',
        createdAt: now,
      };

      const sanitized = stripUndefined(newLetter);
      const letterDocRef = doc(db, 'users', userId, 'futureLetters', letterId);
      await setDoc(letterDocRef, sanitized);

      onLetterCreated(newLetter);
      setSuccess(true);

      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1800);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save future letter to Firestore.';
      setError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-amber-900/20 bg-[#FAF6F0] p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 rounded-full p-1.5 text-stone-400 hover:bg-amber-100 hover:text-stone-700 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3 pb-4 border-b border-amber-900/10">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-800 text-amber-50 shadow-sm">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-serif text-xl font-bold text-amber-950">
              Write to Future You
            </h2>
            <p className="text-xs text-stone-600 font-serif">
              A private letter from your future self, time-gated until a chosen milestone.
            </p>
          </div>
        </div>

        {/* Form Body */}
        <div className="mt-5 space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          {/* Milestone Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-amber-900/80">
              Select Delivery Date
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setDeliveryDate(getDefaultDate(7))}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium border transition-colors ${
                  deliveryDate === getDefaultDate(7)
                    ? 'border-amber-800 bg-amber-800 text-white'
                    : 'border-stone-300 bg-white text-stone-700 hover:bg-amber-50'
                }`}
              >
                In 1 Week
              </button>
              <button
                type="button"
                onClick={() => setDeliveryDate(getDefaultDate(30))}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium border transition-colors ${
                  deliveryDate === getDefaultDate(30)
                    ? 'border-amber-800 bg-amber-800 text-white'
                    : 'border-stone-300 bg-white text-stone-700 hover:bg-amber-50'
                }`}
              >
                In 1 Month
              </button>
              <button
                type="button"
                onClick={() => setDeliveryDate(getDefaultDate(90))}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium border transition-colors ${
                  deliveryDate === getDefaultDate(90)
                    ? 'border-amber-800 bg-amber-800 text-white'
                    : 'border-stone-300 bg-white text-stone-700 hover:bg-amber-50'
                }`}
              >
                In 3 Months
              </button>
              <button
                type="button"
                onClick={() => setDeliveryDate(getDefaultDate(365))}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium border transition-colors ${
                  deliveryDate === getDefaultDate(365)
                    ? 'border-amber-800 bg-amber-800 text-white'
                    : 'border-stone-300 bg-white text-stone-700 hover:bg-amber-50'
                }`}
              >
                In 1 Year
              </button>
              <div className="flex items-center space-x-1.5 pl-1">
                <Calendar className="h-4 w-4 text-stone-500" />
                <input
                  type="date"
                  value={deliveryDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="rounded-lg border border-stone-300 bg-white px-2.5 py-1 text-xs text-stone-800 focus:outline-amber-800"
                />
              </div>
            </div>
          </div>

          {/* AI Drafting CTA */}
          <div className="rounded-2xl border border-amber-900/15 bg-amber-50/70 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-serif text-sm font-bold text-amber-950">
                  Compose with Gemini Future Perspective
                </p>
                <p className="text-xs text-stone-600 mt-0.5">
                  Grounds the letter in your reflection &ldquo;{entry.title || 'Untitled'}&rdquo; and recent themes.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDraftWithGemini}
                disabled={isDrafting}
                className="inline-flex items-center space-x-1.5 rounded-xl bg-amber-800 px-3.5 py-2 text-xs font-medium text-white shadow-sm hover:bg-amber-900 active:scale-95 disabled:opacity-50"
              >
                {isDrafting ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                <span>{isDrafting ? 'Drafting...' : 'Generate Letter'}</span>
              </button>
            </div>
          </div>

          {/* Teaser Quote Input */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600">
              Envelope Teaser Quote Strip
            </label>
            <div className="relative flex items-center">
              <Feather className="absolute left-3 h-4 w-4 text-amber-800" />
              <input
                type="text"
                placeholder="A short poetic hint for the envelope flap..."
                value={teaser}
                onChange={(e) => setTeaser(e.target.value)}
                className="w-full rounded-xl border border-stone-300 bg-white py-2.5 pl-9 pr-3 text-xs font-serif italic text-stone-900 focus:border-amber-800 focus:outline-none"
              />
            </div>
          </div>

          {/* Letter Body Editor */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600">
              Letter Content
            </label>
            <textarea
              rows={6}
              placeholder="Dear Past Self, when you wrote this reflection..."
              value={letterContent}
              onChange={(e) => setLetterContent(e.target.value)}
              className="w-full rounded-xl border border-stone-300 bg-white p-3.5 font-serif text-xs leading-relaxed text-stone-900 placeholder-stone-400 focus:border-amber-800 focus:outline-none"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 flex items-center space-x-2">
              <Check className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Future letter sealed and saved! It will unlock on {deliveryDate}.</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="mt-6 pt-4 border-t border-amber-900/10 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-stone-300 bg-white px-4 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveFutureLetter}
            disabled={isSaving || !letterContent.trim()}
            className="inline-flex items-center space-x-1.5 rounded-xl bg-amber-800 px-5 py-2 text-xs font-medium text-white shadow-sm hover:bg-amber-900 active:scale-95 disabled:opacity-50"
          >
            {isSaving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            <span>{isSaving ? 'Sealing...' : `Seal Letter for ${deliveryDate}`}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
