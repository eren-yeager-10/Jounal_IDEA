'use client';

import React, { useState } from 'react';
import Markdown from 'react-markdown';
import { 
  Sparkles, 
  Moon, 
  Flame, 
  Clock, 
  Feather, 
  Check, 
  Copy, 
  RotateCcw,
  Compass
} from 'lucide-react';

interface LetterEnvelopeProps {
  teaser: string;
  content?: string;
  senderTitle?: string;
  dateLabel?: string;
  isAlreadyOpened?: boolean;
  openedAt?: number | null;
  onOpen?: () => void;
  canReopen?: boolean;
}

export function LetterEnvelope({
  teaser,
  content = '',
  senderTitle = 'A Letter From Time',
  dateLabel,
  isAlreadyOpened = false,
  openedAt,
  onOpen,
  canReopen = true,
}: LetterEnvelopeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleEnvelopeClick = () => {
    if (isAlreadyOpened) return;
    if (isOpen) {
      if (canReopen) {
        setIsOpen(false);
      }
      return;
    }

    setIsOpening(true);
    if (onOpen) onOpen();

    setTimeout(() => {
      setIsOpen(true);
      setIsOpening(false);
    }, 450);
  };

  const handleCopy = () => {
    if (!content) return;
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 1. Spent / Already Opened State (Burn-After-Reading)
  if (isAlreadyOpened) {
    return (
      <div className="relative mx-auto w-full max-w-lg p-4">
        <div className="relative overflow-hidden rounded-2xl border border-stone-300/80 bg-[#EFE9DF] p-8 text-center shadow-lg">
          {/* Subtle Paper Texture Lines */}
          <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#8C7A6B_1px,transparent_1px)] [background-size:16px_16px]" />

          {/* Faded/Spent Broken Seal Motif */}
          <div className="relative mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full border-2 border-dashed border-stone-400 bg-stone-200/80 text-stone-500 shadow-inner">
            <Flame className="h-8 w-8 text-stone-400 opacity-60" />
            <div className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-stone-400 text-stone-100 text-[10px] font-bold">
              ✕
            </div>
          </div>

          <div className="inline-flex items-center space-x-1.5 rounded-full border border-stone-300 bg-stone-100/90 px-3 py-1 text-xs font-serif text-stone-600 mb-3">
            <Clock className="h-3.5 w-3.5 text-stone-400" />
            <span>
              {openedAt ? `Opened on ${new Date(openedAt).toLocaleDateString()}` : 'Already Opened & Consumed'}
            </span>
          </div>

          <h3 className="font-serif text-2xl font-bold tracking-tight text-stone-800">
            This Letter Has Burned
          </h3>

          <p className="mx-auto mt-2 max-w-md font-serif text-sm leading-relaxed text-stone-600 italic">
            &ldquo;{teaser}&rdquo;
          </p>

          <p className="mt-4 text-xs text-stone-500 max-w-sm mx-auto">
            This reflection was sealed with one-time burn-after-reading security. As soon as it was first opened, its words vanished from storage forever.
          </p>

          {/* Antique Botanical Accent Bottom */}
          <div className="mt-6 flex items-center justify-center space-x-3 text-stone-400 opacity-70">
            <span className="h-px w-12 bg-stone-300" />
            <Moon className="h-4 w-4" />
            <span className="h-px w-12 bg-stone-300" />
          </div>
        </div>
      </div>
    );
  }

  // 2. Interactive Closed / Open State
  return (
    <div className="relative mx-auto w-full max-w-xl p-2 sm:p-4">
      {/* Outer Envelope Wrapper */}
      <div 
        className={`relative transition-all duration-700 ease-out ${
          isOpen ? 'pt-8' : 'pt-0'
        }`}
      >
        {/* The Letter Sheet (Slides Up and Out when opened) */}
        <div
          className={`relative z-20 mx-auto overflow-hidden transition-all duration-700 ease-out ${
            isOpen
              ? 'translate-y-0 opacity-100 scale-100 mb-6 shadow-2xl rotate-[-0.5deg]'
              : 'translate-y-16 opacity-0 pointer-events-none scale-95 h-0'
          }`}
        >
          {/* Deckle/Aged Paper Sheet */}
          <div className="relative rounded-t-xl rounded-b-2xl border border-amber-900/20 bg-[#FAF6F0] p-6 sm:p-10 text-stone-900 shadow-xl">
            {/* Torn Deckle Top Edge Simulation */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-100/40 via-amber-200/60 to-amber-100/40 border-b border-amber-900/10" />

            {/* Botanical / Butterfly & Moon Watermark Icons */}
            <div className="absolute top-4 right-5 text-amber-900/20 pointer-events-none select-none flex items-center space-x-2">
              <Moon className="h-5 w-5" />
              <Feather className="h-5 w-5" />
            </div>

            {/* Letter Header */}
            <div className="border-b border-amber-900/15 pb-4 mb-6">
              <div className="flex items-center justify-between">
                <span className="font-serif text-xs font-semibold tracking-wider text-amber-900/70 uppercase">
                  {senderTitle}
                </span>
                {dateLabel && (
                  <span className="text-xs font-serif italic text-stone-500">
                    {dateLabel}
                  </span>
                )}
              </div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-amber-950 mt-1">
                Reflections Across Time
              </h2>
            </div>

            {/* Letter Body (Markdown) */}
            <div className="font-serif text-sm sm:text-base leading-relaxed text-stone-800 space-y-4">
              <div className="markdown-body font-serif">
                <Markdown>{content}</Markdown>
              </div>
            </div>

            {/* Letter Footer Actions */}
            <div className="mt-8 pt-4 border-t border-amber-900/15 flex items-center justify-between text-xs text-stone-500">
              <div className="flex items-center space-x-2 text-amber-900/70 font-serif italic">
                <Compass className="h-4 w-4" />
                <span>Sealed with intentional presence</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center space-x-1 rounded-lg border border-stone-300 bg-white/80 px-2.5 py-1 text-xs font-medium text-stone-700 hover:bg-white shadow-xs"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
                {canReopen && (
                  <button
                    onClick={() => setIsOpen(false)}
                    className="inline-flex items-center space-x-1 rounded-lg border border-stone-300 bg-white/80 px-2.5 py-1 text-xs font-medium text-stone-700 hover:bg-white shadow-xs"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Fold Back</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* The Envelope Box */}
        <div
          onClick={handleEnvelopeClick}
          className={`group relative mx-auto cursor-pointer select-none rounded-2xl border border-[#D5C7B3] bg-[#E8DECF] p-6 sm:p-8 shadow-xl transition-all duration-300 hover:shadow-2xl active:scale-[0.99] ${
            isOpen ? 'opacity-80 scale-95' : 'opacity-100 scale-100 hover:border-amber-700/40'
          }`}
        >
          {/* Paper Texture Overlay */}
          <div className="absolute inset-0 rounded-2xl opacity-20 pointer-events-none bg-[radial-gradient(#6B523B_1px,transparent_1px)] [background-size:14px_14px]" />

          {/* Envelope Flap Creases (Geometric Lines) */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
            <svg className="w-full h-full opacity-30 text-[#8F745B]" preserveAspectRatio="none" viewBox="0 0 100 100">
              <line x1="0" y1="0" x2="50" y2="45" stroke="currentColor" strokeWidth="1" />
              <line x1="100" y1="0" x2="50" y2="45" stroke="currentColor" strokeWidth="1" />
              <line x1="0" y1="100" x2="45" y2="45" stroke="currentColor" strokeWidth="0.8" />
              <line x1="100" y1="100" x2="55" y2="45" stroke="currentColor" strokeWidth="0.8" />
            </svg>
          </div>

          {/* Wax Seal Centerpiece */}
          <div className="relative z-10 mx-auto flex flex-col items-center justify-center text-center">
            <div
              className={`relative flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#8C2D19] via-[#6E1C0A] to-[#451006] text-amber-100 shadow-lg ring-4 ring-[#8C2D19]/30 transition-transform duration-500 ${
                isOpening ? 'scale-125 rotate-45' : 'group-hover:scale-105'
              }`}
            >
              {/* Embossed Moon & Monogram Seal */}
              <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full border border-amber-300/40 bg-gradient-to-tr from-[#591406] to-[#7E2412] shadow-inner">
                <Moon className="h-6 w-6 text-amber-200 drop-shadow-sm" />
              </div>
            </div>

            {/* Wax Seal Label / Callout */}
            <div className="mt-4 inline-flex items-center space-x-1.5 rounded-full border border-amber-900/20 bg-[#F2EAE0] px-3.5 py-1 text-xs font-serif font-medium text-amber-950 shadow-xs">
              <Sparkles className="h-3.5 w-3.5 text-amber-700" />
              <span>{isOpen ? 'Click to Fold Envelope' : 'Break Wax Seal to Open'}</span>
            </div>

            {/* Handwritten-Style Torn Quote Strip Teaser */}
            <div className="relative mt-5 w-full max-w-md">
              {/* Torn paper strip */}
              <div className="relative rounded-md border border-amber-900/20 bg-[#FFFDF9] px-5 py-3 shadow-md rotate-[-0.5deg]">
                <div className="flex items-start space-x-2">
                  <Feather className="h-4 w-4 text-amber-800 shrink-0 mt-0.5" />
                  <p className="font-serif text-xs sm:text-sm italic leading-relaxed text-stone-800">
                    &ldquo;{teaser}&rdquo;
                  </p>
                </div>
              </div>
            </div>

            {/* Sender / Date Metadata */}
            <div className="mt-4 flex items-center space-x-3 text-[11px] text-stone-500">
              <span className="font-serif font-medium">{senderTitle}</span>
              {dateLabel && (
                <>
                  <span>•</span>
                  <span>{dateLabel}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
