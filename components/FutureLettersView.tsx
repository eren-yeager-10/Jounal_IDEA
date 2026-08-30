'use client';

import React, { useState } from 'react';
import { type FutureLetter } from '@/lib/types';
import { LetterEnvelope } from '@/components/LetterEnvelope';
import { 
  Clock, 
  Sparkles, 
  Calendar, 
  CheckCircle2, 
  Hourglass, 
  Mail, 
  Plus, 
  ArrowLeft,
  Feather
} from 'lucide-react';

interface FutureLettersViewProps {
  letters: FutureLetter[];
  onOpenLetter: (letter: FutureLetter) => void;
  onNewFutureLetter: () => void;
}

export function FutureLettersView({
  letters,
  onOpenLetter,
  onNewFutureLetter,
}: FutureLettersViewProps) {
  const [activeViewingLetter, setActiveViewingLetter] = useState<FutureLetter | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  const deliveredLetters = letters.filter(
    (l) => l.delivered || (l.deliveryDate && l.deliveryDate <= todayStr)
  );

  const pendingLetters = letters.filter(
    (l) => !l.delivered && l.deliveryDate && l.deliveryDate > todayStr
  );

  return (
    <div className="flex h-full flex-col bg-stone-50 overflow-y-auto p-6 sm:p-8 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-800 text-amber-50">
              <Clock className="h-4 w-4" />
            </span>
            <h1 className="font-serif text-2xl font-bold tracking-tight text-stone-900">
              Letters Across Time
            </h1>
          </div>
          <p className="mt-1 text-xs text-stone-500 font-serif">
            Time-gated letters from your future self, grounded in your reflections and unlocked at milestones.
          </p>
        </div>

        <button
          onClick={onNewFutureLetter}
          className="inline-flex items-center space-x-1.5 rounded-xl bg-amber-800 px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-amber-900 active:scale-95 transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>Write to Future Me</span>
        </button>
      </div>

      {/* Active Envelope Viewer if a letter is selected */}
      {activeViewingLetter ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setActiveViewingLetter(null)}
              className="inline-flex items-center space-x-1.5 text-xs font-medium text-stone-600 hover:text-stone-900"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Letters</span>
            </button>
            <span className="text-xs font-serif text-amber-900 font-medium">
              Unlocked on {activeViewingLetter.deliveryDate}
            </span>
          </div>

          <div className="py-4">
            <LetterEnvelope
              teaser={activeViewingLetter.teaser}
              content={activeViewingLetter.content}
              senderTitle="Letter From Your Future Self"
              dateLabel={`Scheduled for ${activeViewingLetter.deliveryDate}`}
              isAlreadyOpened={false}
              canReopen={true}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* 1. Delivered / Unlocked Letters Section */}
          <section className="space-y-3">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-700" />
              <h2 className="font-serif text-base font-bold text-stone-900">
                Delivered Letters ({deliveredLetters.length})
              </h2>
            </div>

            {deliveredLetters.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-stone-300 bg-white/60 p-8 text-center text-xs text-stone-500">
                <Mail className="mx-auto h-8 w-8 text-stone-400 mb-2" />
                <p className="font-medium text-stone-700 font-serif">No Delivered Letters Yet</p>
                <p className="mt-1 text-stone-500">
                  When a future letter reaches its scheduled milestone, it will unlock here in a wax-sealed envelope.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {deliveredLetters.map((letter) => (
                  <div
                    key={letter.id}
                    onClick={() => {
                      onOpenLetter(letter);
                      setActiveViewingLetter(letter);
                    }}
                    className="group cursor-pointer rounded-2xl border border-amber-900/15 bg-[#FAF6F0] p-5 shadow-sm transition-all hover:border-amber-700/50 hover:shadow-md active:scale-98"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-amber-900/10 text-[11px] text-amber-900 font-medium">
                      <span className="inline-flex items-center space-x-1">
                        <Sparkles className="h-3 w-3 text-amber-700" />
                        <span>Ready to Open</span>
                      </span>
                      <span className="font-mono text-stone-500">{letter.deliveryDate}</span>
                    </div>

                    <p className="mt-3 font-serif text-xs italic text-stone-800 line-clamp-2">
                      &ldquo;{letter.teaser}&rdquo;
                    </p>

                    <div className="mt-4 flex items-center justify-between text-[11px] text-stone-500">
                      <span className="truncate max-w-[140px] text-stone-600">
                        {letter.fromEntryTitle || 'Reflection'}
                      </span>
                      <span className="font-semibold text-amber-900 group-hover:underline">
                        Break Wax Seal →
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 2. Pending Time-Gated Letters */}
          <section className="space-y-3">
            <div className="flex items-center space-x-2">
              <Hourglass className="h-4 w-4 text-amber-700" />
              <h2 className="font-serif text-base font-bold text-stone-900">
                Awaiting Delivery Milestone ({pendingLetters.length})
              </h2>
            </div>

            {pendingLetters.length === 0 ? (
              <div className="rounded-2xl border border-stone-200 bg-white p-6 text-center text-xs text-stone-500">
                <p>No upcoming letters scheduled.</p>
                <button
                  onClick={onNewFutureLetter}
                  className="mt-3 inline-flex items-center space-x-1 text-xs font-semibold text-amber-900 underline"
                >
                  <span>Write your first letter to future you</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {pendingLetters.map((letter) => (
                  <div
                    key={letter.id}
                    className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs opacity-90"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-stone-100 text-[11px] text-stone-500">
                      <span className="inline-flex items-center space-x-1 text-amber-700 font-medium">
                        <Calendar className="h-3 w-3" />
                        <span>Unlocks on {letter.deliveryDate}</span>
                      </span>
                      <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[9px] font-bold text-stone-600">
                        Time-Locked
                      </span>
                    </div>

                    <p className="mt-3 font-serif text-xs italic text-stone-600 line-clamp-2">
                      &ldquo;{letter.teaser}&rdquo;
                    </p>

                    <div className="mt-4 flex items-center justify-between text-[11px] text-stone-400">
                      <span className="truncate max-w-[160px]">
                        From: {letter.fromEntryTitle || 'Reflection'}
                      </span>
                      <span>Encrypted in private vault</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
