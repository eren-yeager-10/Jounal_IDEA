'use client';

import React, { useState } from 'react';
import { type JournalEntry } from '@/lib/types';
import { 
  Sparkles, 
  Flame, 
  Send, 
  X, 
  RefreshCw, 
  Check, 
  Copy, 
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Feather
} from 'lucide-react';

interface SealedLetterModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: JournalEntry;
}

export function SealedLetterModal({
  isOpen,
  onClose,
  entry,
}: SealedLetterModalProps) {
  const [customTeaser, setCustomTeaser] = useState('');
  const [customContent, setCustomContent] = useState(entry.content || '');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCreateSealedLetter = async () => {
    if (!customContent.trim()) {
      setError('Letter content cannot be empty.');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const res = await fetch('/api/letters/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entryTitle: entry.title,
          entryContent: entry.content,
          customTeaser: customTeaser.trim(),
          customContent: customContent.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create sealed letter.');
      }

      const fullUrl = `${window.location.origin}${data.shareUrl}`;
      setShareUrl(fullUrl);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error generating sealed letter.';
      setError(msg);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyLink = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#8C2D19] text-amber-50 shadow-sm">
            <Flame className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="font-serif text-xl font-bold text-amber-950">
                Seal & Send Letter
              </h2>
              <span className="inline-flex items-center rounded-full bg-amber-200/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-950">
                Burn After Reading
              </span>
            </div>
            <p className="text-xs text-stone-600 font-serif">
              Anyone with the link can open it once. It burns from storage permanently upon first reading.
            </p>
          </div>
        </div>

        {/* Content Area */}
        <div className="mt-5 space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          {shareUrl ? (
            /* Share Link Ready State */
            <div className="space-y-4 rounded-2xl border border-amber-900/20 bg-white p-6 text-center shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#8C2D19] text-amber-100 shadow-md">
                <Flame className="h-7 w-7" />
              </div>

              <h3 className="font-serif text-lg font-bold text-stone-900">
                Letter Sealed with Wax
              </h3>

              <p className="mx-auto max-w-md text-xs text-stone-600 leading-relaxed">
                Your letter has been stored in a dedicated, isolated top-level vault. The first person to open this link will unlock and consume the letter. It cannot be read a second time.
              </p>

              {/* Share URL Box */}
              <div className="flex items-center space-x-2 rounded-xl border border-stone-300 bg-stone-50 p-2 text-left">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="flex-1 bg-transparent px-2 text-xs font-mono text-stone-800 focus:outline-none select-all"
                />
                <button
                  onClick={handleCopyLink}
                  className="inline-flex items-center space-x-1 rounded-lg bg-stone-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-stone-800 active:scale-95 transition-all shrink-0"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? 'Copied Link' : 'Copy Link'}</span>
                </button>
              </div>

              <div className="flex items-center justify-center space-x-3 pt-2">
                <a
                  href={shareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1.5 text-xs font-serif font-semibold text-amber-900 hover:text-amber-950 underline"
                >
                  <span>Preview / Open Letter</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          ) : (
            /* Creation Form */
            <>
              {/* Security Banner */}
              <div className="rounded-xl border border-amber-900/15 bg-amber-50/60 p-3.5 flex items-start space-x-2.5 text-xs text-amber-950">
                <ShieldCheck className="h-4 w-4 text-amber-800 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-semibold">Atomic Single-Read Guarantee</p>
                  <p className="text-[11px] text-stone-600">
                    Never touches your private entries. Governed by a server-side atomic transaction ensuring only one viewer ever receives the content.
                  </p>
                </div>
              </div>

              {/* Envelope Teaser Quote */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600">
                  Envelope Teaser Quote Strip (Displayed on Flap)
                </label>
                <div className="relative flex items-center">
                  <Feather className="absolute left-3 h-4 w-4 text-amber-800" />
                  <input
                    type="text"
                    placeholder="e.g. A reflection that was meant just for you..."
                    value={customTeaser}
                    onChange={(e) => setCustomTeaser(e.target.value)}
                    className="w-full rounded-xl border border-stone-300 bg-white py-2.5 pl-9 pr-3 text-xs font-serif italic text-stone-900 focus:border-amber-800 focus:outline-none"
                  />
                </div>
              </div>

              {/* Letter Content */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600">
                  Letter Body
                </label>
                <textarea
                  rows={6}
                  placeholder="The content of your sealed letter..."
                  value={customContent}
                  onChange={(e) => setCustomContent(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 bg-white p-3.5 font-serif text-xs leading-relaxed text-stone-900 placeholder-stone-400 focus:border-amber-800 focus:outline-none"
                />
              </div>

              {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="mt-6 pt-4 border-t border-amber-900/10 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-stone-300 bg-white px-4 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50"
          >
            {shareUrl ? 'Done' : 'Cancel'}
          </button>
          {!shareUrl && (
            <button
              type="button"
              onClick={handleCreateSealedLetter}
              disabled={isCreating || !customContent.trim()}
              className="inline-flex items-center space-x-1.5 rounded-xl bg-[#8C2D19] px-5 py-2 text-xs font-medium text-white shadow-sm hover:bg-[#722312] active:scale-95 disabled:opacity-50"
            >
              {isCreating ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Flame className="h-3.5 w-3.5" />
              )}
              <span>{isCreating ? 'Sealing & Generating Link...' : 'Seal & Generate Link'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
