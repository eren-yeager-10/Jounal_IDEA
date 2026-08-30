'use client';

import React, { useState } from 'react';
import { type JournalEntry } from '@/lib/types';
import { Search, Plus, Trash2, Calendar, MessageSquare, Tag, Sparkles } from 'lucide-react';

interface SidebarHistoryProps {
  entries: JournalEntry[];
  activeEntryId: string | null;
  onSelectEntry: (entry: JournalEntry) => void;
  onNewEntry: () => void;
  onDeleteEntry: (entryId: string) => void;
  isSaving: boolean;
}

export function SidebarHistory({
  entries,
  activeEntryId,
  onSelectEntry,
  onNewEntry,
  onDeleteEntry,
  isSaving,
}: SidebarHistoryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Collect unique tags
  const allTags = Array.from(
    new Set(entries.flatMap((entry) => entry.tags || []))
  );

  // Filter entries
  const filteredEntries = entries.filter((entry) => {
    const matchesSearch =
      (entry.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (entry.content || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (entry.summary || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTag = !selectedTag || (entry.tags && entry.tags.includes(selectedTag));

    return matchesSearch && matchesTag;
  });

  const formatDate = (timestamp: number) => {
    if (!timestamp) return 'Recent';
    const date = new Date(timestamp);
    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <aside className="flex h-full w-full flex-col border-r border-stone-200 bg-stone-50/70">
      {/* Search & Actions Header */}
      <div className="p-4 border-b border-stone-200/80 space-y-3">
        <button
          id="new-entry-sidebar-btn"
          onClick={onNewEntry}
          className="flex w-full items-center justify-center space-x-2 rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-stone-800 active:scale-98"
        >
          <Plus className="h-4 w-4" />
          <span>New Journal Reflection</span>
        </button>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
          <input
            id="search-entries-input"
            type="text"
            placeholder="Search entries & reflections..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-stone-200 bg-white py-2 pl-9 pr-3 text-xs text-stone-900 placeholder-stone-400 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-xs text-stone-400 hover:text-stone-600"
            >
              ✕
            </button>
          )}
        </div>

        {/* Tags Filter Pill List */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            <button
              onClick={() => setSelectedTag(null)}
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors ${
                selectedTag === null
                  ? 'bg-stone-900 text-stone-50'
                  : 'bg-stone-200/70 text-stone-600 hover:bg-stone-200'
              }`}
            >
              All
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={`flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors ${
                  selectedTag === tag
                    ? 'bg-amber-800 text-amber-50'
                    : 'bg-stone-200/70 text-stone-600 hover:bg-stone-200'
                }`}
              >
                <Tag className="mr-1 h-2.5 w-2.5" />
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Entries List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filteredEntries.length === 0 ? (
          <div className="py-12 text-center text-stone-400">
            <Sparkles className="mx-auto h-8 w-8 text-stone-300 mb-2" />
            <p className="text-xs font-medium">No reflections found</p>
            <p className="text-[11px] text-stone-400 mt-0.5">
              {entries.length === 0 ? 'Create your first reflection!' : 'Try a different search query'}
            </p>
          </div>
        ) : (
          filteredEntries.map((entry) => {
            const isActive = entry.id === activeEntryId;
            const messagesCount = entry.messages?.length || 0;

            return (
              <div
                key={entry.id}
                id={`entry-item-${entry.id}`}
                onClick={() => onSelectEntry(entry)}
                className={`group relative flex flex-col rounded-xl p-3 text-left transition-all cursor-pointer border ${
                  isActive
                    ? 'border-amber-700/40 bg-amber-50/70 shadow-sm'
                    : 'border-transparent bg-white/70 hover:bg-white hover:border-stone-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className={`text-xs font-semibold line-clamp-1 ${isActive ? 'text-amber-950' : 'text-stone-800'}`}>
                    {entry.title || 'Untitled Entry'}
                  </h4>
                  <span className="text-[10px] text-stone-400 shrink-0 flex items-center">
                    <Calendar className="mr-1 h-2.5 w-2.5" />
                    {formatDate(entry.updatedAt || entry.createdAt)}
                  </span>
                </div>

                <p className="mt-1 text-[11px] text-stone-500 line-clamp-2 leading-relaxed">
                  {entry.content || (entry.summary ? `Summary: ${entry.summary}` : 'Empty reflection...')}
                </p>

                {/* Entry Meta: Tags & Message Count */}
                <div className="mt-2.5 flex items-center justify-between text-[10px] text-stone-400">
                  <div className="flex items-center space-x-1.5 overflow-hidden">
                    {messagesCount > 0 && (
                      <span className="flex items-center text-amber-700 font-medium">
                        <MessageSquare className="mr-1 h-3 w-3" />
                        {messagesCount}
                      </span>
                    )}
                    {entry.tags && entry.tags.slice(0, 2).map((tag) => (
                      <span key={tag} className="rounded bg-stone-100 px-1.5 py-0.5 text-stone-600 truncate max-w-[80px]">
                        #{tag}
                      </span>
                    ))}
                    {entry.tags && entry.tags.length > 2 && (
                      <span>+{entry.tags.length - 2}</span>
                    )}
                  </div>

                  {/* Delete Trigger */}
                  <button
                    id={`delete-entry-btn-${entry.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Delete this journal entry permanently?')) {
                        onDeleteEntry(entry.id);
                      }
                    }}
                    title="Delete Entry"
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-stone-400 hover:text-rose-600 rounded hover:bg-rose-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer / Status */}
      <div className="p-3 border-t border-stone-200/80 bg-stone-100/50 flex items-center justify-between text-[11px] text-stone-500">
        <span>{entries.length} {entries.length === 1 ? 'entry' : 'entries'} stored</span>
        {isSaving && (
          <span className="flex items-center text-amber-700 font-medium animate-pulse">
            <span className="mr-1 h-1.5 w-1.5 rounded-full bg-amber-600" />
            Syncing...
          </span>
        )}
      </div>
    </aside>
  );
}
