'use client';

import React from 'react';
import { Sparkles, Shield, Lock, BrainCircuit, ArrowRight, BookMarked, CheckCircle2 } from 'lucide-react';

interface LandingPageProps {
  onSignIn: () => void;
  isLoading: boolean;
  errorMessage: string | null;
}

export function LandingPage({ onSignIn, isLoading, errorMessage }: LandingPageProps) {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-gradient-to-b from-stone-50 via-stone-100/50 to-stone-50 text-stone-900">
      {/* Background Subtle Accents */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-amber-100/60 blur-3xl" />
        <div className="absolute top-1/3 right-10 h-72 w-72 rounded-full bg-emerald-100/40 blur-3xl" />
      </div>

      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-8 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 shadow-sm animate-in fade-in">
            <p className="font-semibold">Authentication Error</p>
            <p className="mt-1">{errorMessage}</p>
          </div>
        )}

        {/* Hero Section */}
        <div className="text-center">
          <div className="inline-flex items-center space-x-2 rounded-full border border-amber-300 bg-amber-50/80 px-3.5 py-1 text-xs font-medium text-amber-900 shadow-sm backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5 text-amber-600" />
            <span>Powered by Gemini 3.6 Flash & Cloud Firestore</span>
          </div>

          <h1 className="mt-6 font-serif text-4xl font-bold tracking-tight text-stone-900 sm:text-5xl lg:text-6xl">
            Thoughtful Journaling, <br />
            <span className="italic text-amber-800">Deep AI Reflections.</span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base text-stone-600 sm:text-lg">
            Unpack your thoughts, gain fresh perspectives, brainstorm solutions, and reflect on life with an intelligent conversational companion — strictly isolated to your private Firebase account.
          </p>

          {/* Call to Action Button */}
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <button
              id="google-sign-in-btn"
              onClick={onSignIn}
              disabled={isLoading}
              className="inline-flex items-center justify-center space-x-3 rounded-xl bg-stone-900 px-8 py-3.5 text-base font-medium text-white shadow-md transition-all hover:bg-stone-800 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 active:scale-95 disabled:opacity-75"
            >
              {isLoading ? (
                <>
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Connecting to Google...</span>
                </>
              ) : (
                <>
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path
                      fill="#EA4335"
                      d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.3 8.9 5 12 5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.3 14.7c-.2-.7-.4-1.5-.4-2.7 0-1.2.2-2 .4-2.7L1.6 6.4C.6 8.3 0 10.1 0 12s.6 3.7 1.6 5.6l3.7-2.9z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.3-6.7-5.3L1.6 16C3.5 19.8 7.4 23 12 23z"
                    />
                  </svg>
                  <span>Sign In with Google</span>
                  <ArrowRight className="h-4 w-4 text-stone-400" />
                </>
              )}
            </button>
          </div>

          {/* Privacy Trust Badges */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-stone-500">
            <span className="flex items-center">
              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
              No passwords stored
            </span>
            <span className="flex items-center">
              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
              Strict Firestore User-Isolation
            </span>
            <span className="flex items-center">
              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
              Direct Gemini 3.6 API
            </span>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="mt-20 grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="rounded-2xl border border-stone-200/80 bg-white/80 p-6 shadow-sm backdrop-blur-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
              <BrainCircuit className="h-5 w-5" />
            </div>
            <h3 className="mt-4 font-serif text-lg font-semibold text-stone-900">Multi-Turn Reflections</h3>
            <p className="mt-2 text-sm text-stone-600 leading-relaxed">
              Have nuanced discussions with Gemini around your thoughts. Receive insightful questions that help you introspect and gain deeper self-awareness.
            </p>
          </div>

          <div className="rounded-2xl border border-stone-200/80 bg-white/80 p-6 shadow-sm backdrop-blur-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
              <Shield className="h-5 w-5" />
            </div>
            <h3 className="mt-4 font-serif text-lg font-semibold text-stone-900">Firestore Isolation</h3>
            <p className="mt-2 text-sm text-stone-600 leading-relaxed">
              Every journal entry and conversation thread is scoped exclusively to your authenticated Firebase UID. No cross-user leakage or public access.
            </p>
          </div>

          <div className="rounded-2xl border border-stone-200/80 bg-white/80 p-6 shadow-sm backdrop-blur-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-800">
              <BookMarked className="h-5 w-5" />
            </div>
            <h3 className="mt-4 font-serif text-lg font-semibold text-stone-900">Searchable History</h3>
            <p className="mt-2 text-sm text-stone-600 leading-relaxed">
              Easily browse, search, and continue any past reflection session. Tag entries and track how your perspectives evolve over time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
