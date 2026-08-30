'use client';

import React from 'react';
import { type User } from 'firebase/auth';
import { 
  Sparkles, 
  LogOut, 
  ShieldCheck, 
  Plus, 
  BookOpen, 
  Compass, 
  Clock, 
  PenLine 
} from 'lucide-react';

export type DashboardView = 'journal' | 'patterns' | 'letters';

interface NavbarProps {
  user: User | null;
  onSignOut: () => void;
  onNewEntry: () => void;
  entriesCount: number;
  activeView: DashboardView;
  onViewChange: (view: DashboardView) => void;
  deliveredLettersCount?: number;
}

export function Navbar({
  user,
  onSignOut,
  onNewEntry,
  entriesCount,
  activeView,
  onViewChange,
  deliveredLettersCount = 0,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-stone-200 bg-stone-50/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand & View Switcher */}
        <div className="flex items-center space-x-6">
          <div 
            onClick={() => onViewChange('journal')}
            className="flex items-center space-x-3 cursor-pointer select-none"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-800 text-amber-50 shadow-sm">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-serif text-lg font-bold tracking-tight text-stone-900">
                  Gemini Reflections
                </span>
                <span className="hidden sm:inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-800">
                  <ShieldCheck className="mr-1 h-3 w-3" />
                  Firestore Isolated
                </span>
              </div>
              <p className="text-[11px] text-stone-500 hidden md:block">Private Journal, Patterns & Sealed Letters</p>
            </div>
          </div>

          {/* Navigation Tabs (When logged in) */}
          {user && (
            <nav className="hidden sm:flex items-center space-x-1 rounded-xl border border-stone-200 bg-stone-100/80 p-1">
              <button
                id="nav-tab-journal"
                onClick={() => onViewChange('journal')}
                className={`inline-flex items-center space-x-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  activeView === 'journal'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <PenLine className="h-3.5 w-3.5" />
                <span>Journal</span>
              </button>

              <button
                id="nav-tab-patterns"
                onClick={() => onViewChange('patterns')}
                className={`inline-flex items-center space-x-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  activeView === 'patterns'
                    ? 'bg-white text-amber-950 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Compass className="h-3.5 w-3.5 text-amber-800" />
                <span>Patterns</span>
              </button>

              <button
                id="nav-tab-letters"
                onClick={() => onViewChange('letters')}
                className={`relative inline-flex items-center space-x-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  activeView === 'letters'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Clock className="h-3.5 w-3.5 text-amber-800" />
                <span>Letters</span>
                {deliveredLettersCount > 0 && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-800 text-[9px] font-bold text-white">
                    {deliveredLettersCount}
                  </span>
                )}
              </button>
            </nav>
          )}
        </div>

        {/* User Context & Actions */}
        {user ? (
          <div className="flex items-center space-x-3">
            {/* Mobile View Switcher Icons */}
            <div className="flex sm:hidden items-center space-x-1">
              <button
                onClick={() => onViewChange('journal')}
                className={`p-2 rounded-lg ${activeView === 'journal' ? 'bg-amber-100 text-amber-950' : 'text-stone-600'}`}
                title="Journal"
              >
                <PenLine className="h-4 w-4" />
              </button>
              <button
                onClick={() => onViewChange('patterns')}
                className={`p-2 rounded-lg ${activeView === 'patterns' ? 'bg-amber-100 text-amber-950' : 'text-stone-600'}`}
                title="Patterns"
              >
                <Compass className="h-4 w-4" />
              </button>
              <button
                onClick={() => onViewChange('letters')}
                className={`p-2 rounded-lg ${activeView === 'letters' ? 'bg-amber-100 text-amber-950' : 'text-stone-600'}`}
                title="Letters"
              >
                <Clock className="h-4 w-4" />
              </button>
            </div>

            <button
              id="new-entry-header-btn"
              onClick={onNewEntry}
              className="inline-flex items-center space-x-1.5 rounded-lg bg-stone-900 px-3.5 py-2 text-xs font-medium text-stone-50 transition-colors hover:bg-stone-800 active:scale-95 sm:text-sm"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New Entry</span>
            </button>

            {/* User Profile */}
            <div className="flex items-center space-x-2 pl-2 border-l border-stone-200">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-800 text-xs font-bold text-amber-50 shadow-xs">
                {user.displayName
                  ? user.displayName.charAt(0).toUpperCase()
                  : user.email
                  ? user.email.charAt(0).toUpperCase()
                  : 'U'}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-semibold text-stone-800 truncate max-w-[110px]">
                  {user.displayName || user.email?.split('@')[0]}
                </p>
                <p className="text-[10px] text-stone-500 truncate max-w-[110px]">{user.email}</p>
              </div>
            </div>

            {/* Sign Out Button */}
            <button
              id="sign-out-btn"
              onClick={onSignOut}
              title="Sign Out"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-600 transition-colors hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700 active:scale-95"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
