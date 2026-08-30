'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { type JournalEntry, type ChatMessage, type ReflectionMode, type CartographyMetadata, type FutureLetter } from '@/lib/types';
import { FutureLetterModal } from '@/components/FutureLetterModal';
import { SealedLetterModal } from '@/components/SealedLetterModal';
import Markdown from 'react-markdown';
import { 
  Sparkles, 
  FileText, 
  Lightbulb, 
  MessageSquare, 
  Send, 
  Save, 
  Check, 
  Copy, 
  X, 
  RefreshCw, 
  AlertCircle,
  Bot,
  User as UserIcon,
  HelpCircle,
  Clock,
  Flame,
  Compass,
  Repeat,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';

interface JournalEditorProps {
  entry: JournalEntry;
  onUpdateEntry: (updated: JournalEntry) => void;
  onSaveToFirestore: (entryToSave?: JournalEntry) => Promise<void>;
  isSaving: boolean;
  saveError: string | null;
  onClearSaveError: () => void;
  userId: string;
}

export function JournalEditor({
  entry,
  onUpdateEntry,
  onSaveToFirestore,
  isSaving,
  saveError,
  onClearSaveError,
  userId,
}: JournalEditorProps) {
  const [activeMode, setActiveMode] = useState<ReflectionMode>('reflect');
  const [replyInput, setReplyInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);

  // Modals state
  const [futureModalOpen, setFutureModalOpen] = useState(false);
  const [sealedModalOpen, setSealedModalOpen] = useState(false);
  const [isAnalyzingCartography, setIsAnalyzingCartography] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of message thread on new turns
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entry.messages?.length, isGenerating]);

  // Handle text change
  const handleContentChange = useCallback((content: string) => {
    onUpdateEntry({
      ...entry,
      content,
      updatedAt: Date.now(),
    });
  }, [entry, onUpdateEntry]);

  const handleTitleChange = useCallback((title: string) => {
    onUpdateEntry({
      ...entry,
      title,
      updatedAt: Date.now(),
    });
  }, [entry, onUpdateEntry]);

  // Add Tag
  const handleAddTag = useCallback((e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    const cleanTag = tagInput.trim().replace(/^#/, '').toLowerCase();
    if (cleanTag && !entry.tags.includes(cleanTag)) {
      onUpdateEntry({
        ...entry,
        tags: [...entry.tags, cleanTag],
        updatedAt: Date.now(),
      });
      setTagInput('');
    }
  }, [tagInput, entry, onUpdateEntry]);

  // Remove Tag
  const handleRemoveTag = useCallback((tagToRemove: string) => {
    onUpdateEntry({
      ...entry,
      tags: entry.tags.filter((t) => t !== tagToRemove),
      updatedAt: Date.now(),
    });
  }, [entry, onUpdateEntry]);

  // Background Emotional Cartography trigger
  const triggerCartographyAnalysis = useCallback(async (targetEntry: JournalEntry) => {
    if (!targetEntry.content || targetEntry.content.trim().length < 15) return;
    setIsAnalyzingCartography(true);
    try {
      const res = await fetch('/api/gemini/cartography', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entryTitle: targetEntry.title,
          entryContent: targetEntry.content,
        }),
      });

      const data = await res.json();
      if (res.ok && data.cartography) {
        const withCarto: JournalEntry = {
          ...targetEntry,
          cartography: data.cartography as CartographyMetadata,
          updatedAt: Date.now(),
        };
        onUpdateEntry(withCarto);
        await onSaveToFirestore(withCarto);
      }
    } catch (err: unknown) {
      console.warn('[Cartography Background] Analysis warning:', err);
    } finally {
      setIsAnalyzingCartography(false);
    }
  }, [onUpdateEntry, onSaveToFirestore]);

  // Manual save with cartography analysis trigger
  const handleManualSave = async () => {
    await onSaveToFirestore(entry);
    setLastSavedTime(new Date());
    // Trigger background emotional cartography
    triggerCartographyAnalysis(entry);
  };

  // Trigger AI reflection or mode action
  const handleGenerateReflection = async (customPrompt?: string, targetMode?: ReflectionMode) => {
    const modeToUse = targetMode || activeMode;
    const promptToUse = customPrompt || (
      modeToUse === 'summarize'
        ? 'Please summarize this journal reflection with core insights and actionable takeaways.'
        : modeToUse === 'brainstorm'
        ? 'Brainstorm creative angles, alternative solutions, and fresh perspectives based on my thoughts.'
        : modeToUse === 'reflect'
        ? 'Reflect deeply on what I have written, identify any emotional or behavioral patterns, and ask two thought-provoking questions.'
        : 'Let us discuss this reflection together.'
    );

    if (!entry.content && !promptToUse) {
      setGenerationError('Please write some journal content or enter a prompt first.');
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);

    const userTurnTime = Date.now();
    // Create user message turn
    const userMessage: ChatMessage = {
      id: `msg-${userTurnTime}-user`,
      role: 'user',
      content: promptToUse,
      timestamp: userTurnTime,
      mode: modeToUse,
    };

    const updatedMessages = [...(entry.messages || []), userMessage];
    const interimEntry: JournalEntry = {
      ...entry,
      messages: updatedMessages,
      updatedAt: userTurnTime,
    };
    onUpdateEntry(interimEntry);

    try {
      // Prepare history for API
      const historyPayload = (entry.messages || []).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/gemini/reflect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptToUse,
          entryContent: entry.content,
          entryTitle: entry.title,
          history: historyPayload,
          mode: modeToUse,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate Gemini reflection.');
      }

      const modelTurnTime = Date.now();
      const modelMessage: ChatMessage = {
        id: `msg-${modelTurnTime}-model`,
        role: 'model',
        content: data.text,
        timestamp: modelTurnTime,
        mode: modeToUse,
      };

      const finalEntry: JournalEntry = {
        ...entry,
        messages: [...updatedMessages, modelMessage],
        summary: modeToUse === 'summarize' ? data.text.slice(0, 150) + '...' : (entry.summary || ''),
        updatedAt: modelTurnTime,
      };

      onUpdateEntry(finalEntry);
      
      // Persist guaranteed to Firestore
      await onSaveToFirestore(finalEntry);
      setLastSavedTime(new Date());

      // Trigger background cartography analysis
      triggerCartographyAnalysis(finalEntry);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error communicating with Gemini';
      setGenerationError(msg);
    } finally {
      setIsGenerating(false);
      setReplyInput('');
    }
  };

  // Quick Prompt Pills
  const QUICK_PROMPTS = [
    { label: 'Reflect Deeply', prompt: 'What underlying patterns and values stand out in what I wrote?', mode: 'reflect' as ReflectionMode },
    { label: 'Executive Summary', prompt: 'Summarize the core thoughts, mindset, and next steps in 3 concise bullet points.', mode: 'summarize' as ReflectionMode },
    { label: 'Brainstorm Solutions', prompt: 'Brainstorm 3-5 creative ways to look at this situation or tackle the next step.', mode: 'brainstorm' as ReflectionMode },
    { label: 'Constructive Reframe', prompt: 'How might I constructively reframe the challenges mentioned here?', mode: 'reflect' as ReflectionMode },
    { label: 'Identify Blind Spots', prompt: 'What blind spots or unchallenged assumptions might be present in this reflection?', mode: 'reflect' as ReflectionMode },
  ];

  // Copy AI response
  const handleCopyText = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="flex h-full flex-col bg-white overflow-hidden">
      {/* Editor Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 px-6 py-3 bg-stone-50/50">
        {/* Title & Tag Inputs */}
        <div className="flex-1 min-w-[240px]">
          <input
            id="entry-title-input"
            type="text"
            placeholder="Reflection Title..."
            value={entry.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="w-full bg-transparent font-serif text-xl font-bold text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-0"
          />
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {entry.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full bg-stone-200/80 px-2.5 py-0.5 text-[11px] font-medium text-stone-700"
              >
                #{tag}
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-1 text-stone-400 hover:text-stone-700"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            <div className="flex items-center space-x-1">
              <input
                id="entry-tag-input"
                type="text"
                placeholder="+ Add tag (Press Enter)"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                className="w-32 bg-transparent text-[11px] text-stone-600 placeholder-stone-400 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Feature Actions: Future Letter & Sealed Letter & Save */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Write to Future Me */}
          <button
            id="write-future-me-btn"
            onClick={() => setFutureModalOpen(true)}
            className="inline-flex items-center space-x-1.5 rounded-lg border border-amber-900/20 bg-[#FAF6F0] px-3 py-1.5 text-xs font-serif font-medium text-amber-950 shadow-xs hover:bg-[#F3ECE0] transition-colors"
          >
            <Clock className="h-3.5 w-3.5 text-amber-800" />
            <span>Write to Future Me</span>
          </button>

          {/* Seal & Send */}
          <button
            id="seal-send-btn"
            onClick={() => setSealedModalOpen(true)}
            className="inline-flex items-center space-x-1.5 rounded-lg border border-amber-900/20 bg-[#FAF6F0] px-3 py-1.5 text-xs font-serif font-medium text-amber-950 shadow-xs hover:bg-[#F3ECE0] transition-colors"
          >
            <Flame className="h-3.5 w-3.5 text-[#8C2D19]" />
            <span>Seal & Send</span>
          </button>

          {saveError ? (
            <button
              onClick={() => {
                onClearSaveError();
                handleManualSave();
              }}
              className="inline-flex items-center space-x-1 rounded-lg bg-rose-100 px-3 py-1.5 text-xs font-medium text-rose-800 hover:bg-rose-200"
            >
              <AlertCircle className="h-3.5 w-3.5" />
              <span>Retry Save</span>
            </button>
          ) : lastSavedTime ? (
            <span className="hidden text-[11px] text-emerald-700 sm:inline-flex items-center">
              <Check className="mr-1 h-3.5 w-3.5" />
              Saved
            </span>
          ) : null}

          <button
            id="manual-save-btn"
            onClick={handleManualSave}
            disabled={isSaving || isAnalyzingCartography}
            className="inline-flex items-center space-x-1.5 rounded-lg border border-stone-200 bg-white px-3.5 py-1.5 text-xs font-medium text-stone-700 shadow-sm transition-colors hover:bg-stone-50 active:scale-95 disabled:opacity-60"
          >
            {isSaving || isAnalyzingCartography ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-amber-700" />
            ) : (
              <Save className="h-3.5 w-3.5 text-stone-500" />
            )}
            <span>{isSaving ? 'Syncing...' : isAnalyzingCartography ? 'Mapping Patterns...' : 'Save & Map'}</span>
          </button>
        </div>
      </div>

      {/* Persistence Error Alert */}
      {saveError && (
        <div className="bg-rose-50 border-b border-rose-200 px-6 py-2 flex items-center justify-between text-xs text-rose-800">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            <span><strong>Firestore Sync Warning:</strong> {saveError}</span>
          </div>
          <button
            onClick={handleManualSave}
            className="font-medium underline hover:text-rose-950"
          >
            Retry Now
          </button>
        </div>
      )}

      {/* Main Workspace Body */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {/* Emotional Cartography Badge (if analyzed) */}
        {entry.cartography && (
          <div className="rounded-2xl border border-amber-900/15 bg-amber-50/40 p-4 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-900/10 pb-2 mb-2.5">
              <div className="flex items-center space-x-2">
                <Compass className="h-4 w-4 text-amber-800" />
                <span className="font-serif text-xs font-bold text-amber-950">Emotional Cartography</span>
              </div>
              <div className="flex items-center space-x-3 text-xs">
                <div className="flex items-center space-x-1">
                  <span className="text-stone-500 text-[11px]">Sentiment:</span>
                  <span className={`font-bold inline-flex items-center ${
                    entry.cartography.sentiment > 0.1 ? 'text-emerald-700' : entry.cartography.sentiment < -0.1 ? 'text-rose-700' : 'text-amber-800'
                  }`}>
                    {entry.cartography.sentiment > 0.1 ? <TrendingUp className="h-3 w-3 mr-0.5" /> : entry.cartography.sentiment < -0.1 ? <TrendingDown className="h-3 w-3 mr-0.5" /> : <Minus className="h-3 w-3 mr-0.5" />}
                    {entry.cartography.sentiment > 0 ? `+${entry.cartography.sentiment}` : entry.cartography.sentiment}
                  </span>
                </div>
                {entry.cartography.recurring_flag && (
                  <span className="inline-flex items-center rounded-full bg-amber-200/80 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                    <Repeat className="h-2.5 w-2.5 mr-1" />
                    Recurring Motif
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-stone-700">
              {entry.cartography.themes.length > 0 && (
                <div>
                  <span className="text-[11px] font-medium text-stone-500 mr-1.5">Themes:</span>
                  {entry.cartography.themes.map((t) => (
                    <span key={t} className="mr-1.5 inline-block rounded-md bg-white border border-amber-900/10 px-2 py-0.5 text-[11px] font-medium text-stone-800">
                      {t}
                    </span>
                  ))}
                </div>
              )}
              {entry.cartography.people.length > 0 && (
                <div>
                  <span className="text-[11px] font-medium text-stone-500 mr-1.5">People:</span>
                  {entry.cartography.people.map((p) => (
                    <span key={p} className="mr-1.5 inline-block rounded-md bg-stone-100 px-2 py-0.5 text-[11px] text-stone-700">
                      {p}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Journal Entry Textarea */}
        <div className="rounded-2xl border border-stone-200 bg-stone-50/40 p-4 shadow-sm focus-within:border-amber-600 focus-within:bg-white focus-within:ring-1 focus-within:ring-amber-600 transition-all">
          <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
            Journal Entry / Stream of Consciousness
          </label>
          <textarea
            id="journal-content-textarea"
            rows={5}
            placeholder="Write down your thoughts, experiences, dilemmas, or reflections here..."
            value={entry.content}
            onChange={(e) => handleContentChange(e.target.value)}
            className="w-full resize-y bg-transparent text-sm leading-relaxed text-stone-900 placeholder-stone-400 focus:outline-none"
          />

          {/* Quick Action Mode Selector */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-stone-200/80 pt-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-medium text-stone-500 mr-1">Modes:</span>
              <button
                type="button"
                onClick={() => setActiveMode('reflect')}
                className={`inline-flex items-center space-x-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                  activeMode === 'reflect'
                    ? 'bg-amber-800 text-white shadow-sm'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                <Sparkles className="h-3 w-3" />
                <span>Reflect</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveMode('summarize')}
                className={`inline-flex items-center space-x-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                  activeMode === 'summarize'
                    ? 'bg-amber-800 text-white shadow-sm'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                <FileText className="h-3 w-3" />
                <span>Summarize</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveMode('brainstorm')}
                className={`inline-flex items-center space-x-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                  activeMode === 'brainstorm'
                    ? 'bg-amber-800 text-white shadow-sm'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                <Lightbulb className="h-3 w-3" />
                <span>Brainstorm</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveMode('chat')}
                className={`inline-flex items-center space-x-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                  activeMode === 'chat'
                    ? 'bg-amber-800 text-white shadow-sm'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                <MessageSquare className="h-3 w-3" />
                <span>Conversation</span>
              </button>
            </div>

            <button
              id="generate-ai-btn"
              onClick={() => handleGenerateReflection()}
              disabled={isGenerating || !entry.content.trim()}
              className="inline-flex items-center space-x-1.5 rounded-xl bg-amber-800 px-4 py-2 text-xs font-medium text-white shadow-sm transition-all hover:bg-amber-900 active:scale-95 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Gemini Thinking...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 text-amber-200" />
                  <span>
                    {activeMode === 'summarize'
                      ? 'Summarize Entry'
                      : activeMode === 'brainstorm'
                      ? 'Brainstorm Perspectives'
                      : activeMode === 'chat'
                      ? 'Start Discussion'
                      : 'Generate Deep Reflection'}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Guided Prompts */}
        <div className="space-y-2">
          <div className="flex items-center space-x-1.5 text-xs font-medium text-stone-500">
            <HelpCircle className="h-3.5 w-3.5 text-stone-400" />
            <span>Guided Inquiries & Perspectives:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {QUICK_PROMPTS.map((qp, idx) => (
              <button
                key={idx}
                id={`quick-prompt-${idx}`}
                onClick={() => handleGenerateReflection(qp.prompt, qp.mode)}
                disabled={isGenerating || !entry.content.trim()}
                className="inline-flex items-center space-x-1.5 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs text-stone-700 shadow-xs transition-all hover:border-amber-400 hover:bg-amber-50/50 hover:text-amber-900 active:scale-95 disabled:opacity-50"
              >
                <Sparkles className="h-3 w-3 text-amber-600" />
                <span>{qp.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Error Notification */}
        {generationError && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 flex items-start space-x-3 shadow-sm">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">AI Generation Issue</p>
              <p className="mt-0.5">{generationError}</p>
              <button
                onClick={() => handleGenerateReflection()}
                className="mt-2 inline-flex items-center text-xs font-medium underline text-rose-900 hover:text-rose-950"
              >
                Retry Generation
              </button>
            </div>
          </div>
        )}

        {/* Multi-Turn Conversation & Reflection Thread */}
        {entry.messages && entry.messages.length > 0 && (
          <div className="space-y-4 pt-4 border-t border-stone-200">
            <h3 className="font-serif text-sm font-semibold text-stone-900 flex items-center space-x-2">
              <MessageSquare className="h-4 w-4 text-amber-700" />
              <span>Multi-Turn Dialogue & Reflection History</span>
            </h3>

            <div className="space-y-4">
              {entry.messages.map((msg, idx) => {
                const isModel = msg.role === 'model';

                return (
                  <div
                    key={msg.id || idx}
                    className={`flex items-start space-x-3 ${
                      isModel ? 'justify-start' : 'justify-end'
                    }`}
                  >
                    {isModel && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-800 text-amber-50 shadow-xs">
                        <Bot className="h-4 w-4" />
                      </div>
                    )}

                    <div
                      className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm shadow-xs ${
                        isModel
                          ? 'border border-stone-200/90 bg-stone-50 text-stone-900'
                          : 'bg-stone-900 text-stone-50'
                      }`}
                    >
                      {/* Message Meta */}
                      <div className="flex items-center justify-between gap-4 pb-2 mb-2 border-b border-stone-200/50 text-[10px] text-stone-400">
                        <span className="font-medium">
                          {isModel ? 'Gemini 3.6 Companion' : 'You'}
                        </span>
                        <div className="flex items-center space-x-2">
                          {msg.mode && (
                            <span className="rounded bg-stone-200/60 px-1.5 py-0.5 text-stone-700 uppercase tracking-wider text-[9px] font-semibold">
                              {msg.mode}
                            </span>
                          )}
                          {isModel && (
                            <button
                              onClick={() => handleCopyText(msg.content, idx)}
                              title="Copy Reflection"
                              className="text-stone-400 hover:text-stone-700 transition-colors"
                            >
                              {copiedIndex === idx ? (
                                <Check className="h-3 w-3 text-emerald-600" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="leading-relaxed space-y-2">
                        {isModel ? (
                          <div className="markdown-body">
                            <Markdown>{msg.content}</Markdown>
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        )}
                      </div>
                    </div>

                    {!isModel && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-stone-200 text-stone-700">
                        <UserIcon className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Generating Animation indicator */}
              {isGenerating && (
                <div className="flex items-start space-x-3 justify-start animate-pulse">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-800 text-amber-50">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 text-xs text-stone-600 space-y-2 w-72">
                    <div className="flex items-center space-x-2">
                      <div className="h-2 w-2 rounded-full bg-amber-700 animate-bounce" />
                      <div className="h-2 w-2 rounded-full bg-amber-700 animate-bounce [animation-delay:0.2s]" />
                      <div className="h-2 w-2 rounded-full bg-amber-700 animate-bounce [animation-delay:0.4s]" />
                      <span className="text-[11px] font-medium text-stone-500">Formulating insight...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>
        )}
      </div>

      {/* Multi-turn Dialogue Input Footer */}
      <div className="border-t border-stone-200 bg-stone-50/80 p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (replyInput.trim() && !isGenerating) {
              handleGenerateReflection(replyInput.trim(), 'chat');
            }
          }}
          className="mx-auto flex max-w-4xl items-center space-x-2"
        >
          <input
            id="multi-turn-reply-input"
            type="text"
            placeholder="Ask a follow-up, share how you feel, or request another angle..."
            value={replyInput}
            onChange={(e) => setReplyInput(e.target.value)}
            disabled={isGenerating}
            className="flex-1 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-xs sm:text-sm text-stone-900 placeholder-stone-400 focus:border-amber-700 focus:outline-none focus:ring-1 focus:ring-amber-700 disabled:opacity-60"
          />
          <button
            id="send-reply-btn"
            type="submit"
            disabled={isGenerating || !replyInput.trim()}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-stone-900 text-stone-50 shadow-sm transition-all hover:bg-stone-800 active:scale-95 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>

      {/* Future Letter Modal */}
      <FutureLetterModal
        isOpen={futureModalOpen}
        onClose={() => setFutureModalOpen(false)}
        entry={entry}
        userId={userId}
        onLetterCreated={(newLetter: FutureLetter) => {
          console.log('Future letter created:', newLetter.id);
        }}
      />

      {/* Sealed Letter Modal */}
      <SealedLetterModal
        isOpen={sealedModalOpen}
        onClose={() => setSealedModalOpen(false)}
        entry={entry}
      />
    </div>
  );
}
