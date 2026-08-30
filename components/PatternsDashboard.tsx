'use client';

import React, { useMemo } from 'react';
import { type JournalEntry } from '@/lib/types';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  ReferenceLine,
  Area,
  AreaChart
} from 'recharts';
import { 
  Sparkles, 
  Compass, 
  Users, 
  Tag, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  BookOpen, 
  Repeat, 
  Calendar,
  AlertCircle,
  HelpCircle,
  Plus
} from 'lucide-react';

interface PatternsDashboardProps {
  entries: JournalEntry[];
  onNewEntry: () => void;
  onSelectEntry: (entry: JournalEntry) => void;
}

export function PatternsDashboard({
  entries,
  onNewEntry,
  onSelectEntry,
}: PatternsDashboardProps) {
  // Entries with valid cartography or content
  const analyzedEntries = useMemo(() => {
    return entries
      .filter((e) => e.content && e.content.trim() !== '')
      .map((e) => {
        // If entry has stored cartography, use it; otherwise compute heuristic fallback
        const carto = e.cartography || {
          themes: e.tags.length > 0 ? e.tags : ['reflection'],
          people: [],
          sentiment: 0.2,
          recurring_flag: false,
        };
        return {
          ...e,
          carto,
        };
      })
      .sort((a, b) => a.createdAt - b.createdAt);
  }, [entries]);

  const totalAnalyzed = analyzedEntries.length;

  // Sentiment Timeline Data
  const timelineData = useMemo(() => {
    return analyzedEntries.map((e) => {
      const dateStr = new Date(e.createdAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      });
      return {
        id: e.id,
        title: e.title || 'Untitled',
        date: dateStr,
        sentiment: e.carto.sentiment,
        recurring: e.carto.recurring_flag,
        themes: e.carto.themes.join(', '),
        people: e.carto.people.join(', '),
        rawEntry: e,
      };
    });
  }, [analyzedEntries]);

  // Aggregate Themes ranked by frequency
  const rankedThemes = useMemo(() => {
    const counts: Record<string, { count: number; recurringCount: number }> = {};
    for (const e of analyzedEntries) {
      for (const theme of e.carto.themes) {
        const clean = theme.toLowerCase().trim();
        if (!clean) continue;
        if (!counts[clean]) {
          counts[clean] = { count: 0, recurringCount: 0 };
        }
        counts[clean].count += 1;
        if (e.carto.recurring_flag) {
          counts[clean].recurringCount += 1;
        }
      }
    }
    return Object.entries(counts)
      .map(([theme, data]) => ({ theme, count: data.count, recurring: data.recurringCount > 0 }))
      .sort((a, b) => b.count - a.count);
  }, [analyzedEntries]);

  // Aggregate People ranked by frequency
  const rankedPeople = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const e of analyzedEntries) {
      for (const person of e.carto.people) {
        const clean = person.trim();
        if (!clean) continue;
        counts[clean] = (counts[clean] || 0) + 1;
      }
    }
    return Object.entries(counts)
      .map(([person, count]) => ({ person, count }))
      .sort((a, b) => b.count - a.count);
  }, [analyzedEntries]);

  // Metrics summary
  const averageSentiment = useMemo(() => {
    if (analyzedEntries.length === 0) return 0;
    const sum = analyzedEntries.reduce((acc, curr) => acc + curr.carto.sentiment, 0);
    return Math.round((sum / analyzedEntries.length) * 100) / 100;
  }, [analyzedEntries]);

  const recurringThemesCount = useMemo(() => {
    return analyzedEntries.filter((e) => e.carto.recurring_flag).length;
  }, [analyzedEntries]);

  // 1. Empty State (< 5 entries)
  if (totalAnalyzed < 5) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6 sm:p-12 text-center bg-stone-50 overflow-y-auto">
        <div className="mx-auto max-w-md rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100/70 text-amber-800 shadow-inner mb-4">
            <Compass className="h-8 w-8" />
          </div>

          <h2 className="font-serif text-2xl font-bold tracking-tight text-stone-900">
            Emotional Cartography
          </h2>

          <p className="mt-3 text-sm text-stone-600 leading-relaxed font-serif">
            &ldquo;Keep writing — patterns emerge after a few entries.&rdquo;
          </p>

          <p className="mt-2 text-xs text-stone-500">
            Emotional Cartography maps subconscious recurring themes, relational circles, and sentiment trajectories across your journaling journey.
          </p>

          {/* Progress Tracker toward 5 entries */}
          <div className="mt-6 border-t border-stone-100 pt-5">
            <div className="flex items-center justify-between text-xs text-stone-600 mb-2">
              <span className="font-medium">Journey Progress</span>
              <span className="font-bold text-amber-800">{totalAnalyzed} / 5 Entries</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-stone-100">
              <div
                className="h-full bg-amber-700 transition-all duration-500"
                style={{ width: `${Math.min(100, (totalAnalyzed / 5) * 100)}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] text-stone-400">
              {5 - totalAnalyzed} more {5 - totalAnalyzed === 1 ? 'reflection' : 'reflections'} needed to unlock multi-dimensional timeline trends.
            </p>
          </div>

          <div className="mt-6 flex justify-center">
            <button
              onClick={onNewEntry}
              className="inline-flex items-center space-x-2 rounded-xl bg-stone-900 px-5 py-2.5 text-xs font-medium text-white shadow-sm hover:bg-stone-800 active:scale-95 transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Write Next Reflection</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Full Emotional Cartography Dashboard
  return (
    <div className="flex h-full flex-col bg-stone-50 overflow-y-auto p-6 sm:p-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-800 text-amber-50">
              <Compass className="h-4 w-4" />
            </span>
            <h1 className="font-serif text-2xl font-bold tracking-tight text-stone-900">
              Emotional Cartography & Patterns
            </h1>
          </div>
          <p className="mt-1 text-xs text-stone-500 font-serif">
            Subconscious trajectories, recurring relational dynamics, and emotional landscape over {totalAnalyzed} reflections.
          </p>
        </div>

        <button
          onClick={onNewEntry}
          className="inline-flex items-center space-x-1.5 rounded-xl bg-amber-800 px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-amber-900 active:scale-95 transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>New Reflection</span>
        </button>
      </div>

      {/* Top Stat Overview Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-medium uppercase tracking-wider">Average Sentiment</span>
            {averageSentiment > 0.1 ? (
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            ) : averageSentiment < -0.1 ? (
              <TrendingDown className="h-4 w-4 text-rose-600" />
            ) : (
              <Minus className="h-4 w-4 text-amber-600" />
            )}
          </div>
          <p className="mt-2 font-serif text-2xl font-bold text-stone-900">
            {averageSentiment > 0 ? `+${averageSentiment}` : averageSentiment}
          </p>
          <p className="mt-1 text-[11px] text-stone-500">
            Scale: -1.0 (deep challenge) to +1.0 (growth / joy)
          </p>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-medium uppercase tracking-wider">Recurring Motifs</span>
            <Repeat className="h-4 w-4 text-amber-600" />
          </div>
          <p className="mt-2 font-serif text-2xl font-bold text-stone-900">
            {recurringThemesCount} / {totalAnalyzed}
          </p>
          <p className="mt-1 text-[11px] text-stone-500">
            Reflections exhibiting ongoing life cycles
          </p>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-medium uppercase tracking-wider">Top Emotional Core</span>
            <Tag className="h-4 w-4 text-amber-600" />
          </div>
          <p className="mt-2 font-serif text-2xl font-bold text-stone-900 truncate">
            {rankedThemes[0]?.theme || 'Reflection'}
          </p>
          <p className="mt-1 text-[11px] text-stone-500">
            Surfaced in {rankedThemes[0]?.count || 0} journal entries
          </p>
        </div>
      </div>

      {/* Sentiment Timeline Chart */}
      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-serif text-lg font-bold text-stone-900 flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-amber-800" />
              <span>Emotional Valence Timeline</span>
            </h2>
            <p className="text-xs text-stone-500">
              Trajectory of emotional resilience and inner state across consecutive reflections
            </p>
          </div>
        </div>

        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timelineData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="sentimentGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8C2D19" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#8C2D19" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E7E5E4" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 11, fill: '#78716C' }} 
                axisLine={{ stroke: '#D6D3D1' }}
                tickLine={false}
              />
              <YAxis 
                domain={[-1, 1]} 
                ticks={[-1, -0.5, 0, 0.5, 1]}
                tick={{ fontSize: 11, fill: '#78716C' }}
                axisLine={{ stroke: '#D6D3D1' }}
                tickLine={false}
              />
              <ReferenceLine y={0} stroke="#A8A29E" strokeDasharray="4 4" />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="rounded-xl border border-stone-200 bg-white p-3 shadow-lg text-xs max-w-xs space-y-1.5">
                        <p className="font-serif font-bold text-stone-900">{data.title}</p>
                        <p className="text-[11px] text-stone-500">{data.date}</p>
                        <div className="flex items-center space-x-2 pt-1">
                          <span className="font-semibold text-stone-700">Sentiment:</span>
                          <span className={`font-bold ${
                            data.sentiment > 0.2 ? 'text-emerald-700' : data.sentiment < -0.2 ? 'text-rose-700' : 'text-amber-800'
                          }`}>
                            {data.sentiment > 0 ? `+${data.sentiment}` : data.sentiment}
                          </span>
                        </div>
                        {data.themes && (
                          <p className="text-[11px] text-stone-600">
                            <span className="font-medium">Themes:</span> {data.themes}
                          </p>
                        )}
                        {data.people && (
                          <p className="text-[11px] text-stone-600">
                            <span className="font-medium">People:</span> {data.people}
                          </p>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area 
                type="monotone" 
                dataKey="sentiment" 
                stroke="#8C2D19" 
                strokeWidth={2.5} 
                fillOpacity={1} 
                fill="url(#sentimentGradient)" 
                activeDot={{ r: 6, fill: '#8C2D19', stroke: '#FAF6F0', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two Columns: Ranked Themes & Relational Dynamics */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Ranked Themes */}
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs">
          <h3 className="font-serif text-base font-bold text-stone-900 flex items-center space-x-2 mb-4">
            <Tag className="h-4 w-4 text-amber-800" />
            <span>Recurring Themes & Life Motifs</span>
          </h3>

          {rankedThemes.length === 0 ? (
            <p className="text-xs text-stone-500 italic">No themes extracted yet.</p>
          ) : (
            <div className="space-y-3">
              {rankedThemes.slice(0, 8).map((item, idx) => (
                <div
                  key={item.theme}
                  className="flex items-center justify-between rounded-xl border border-stone-100 bg-stone-50/60 px-3.5 py-2.5 text-xs transition-colors hover:bg-stone-100"
                >
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-[11px] font-semibold text-stone-400">
                      #{idx + 1}
                    </span>
                    <span className="font-medium text-stone-800 capitalize">{item.theme}</span>
                    {item.recurring && (
                      <span className="inline-flex items-center space-x-0.5 rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-800">
                        <Repeat className="h-2.5 w-2.5 mr-0.5" />
                        Loop
                      </span>
                    )}
                  </div>
                  <span className="rounded-full bg-stone-200/80 px-2.5 py-0.5 text-[11px] font-bold text-stone-700">
                    {item.count} {item.count === 1 ? 'entry' : 'entries'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Relational Network & Mentioned Figures */}
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs">
          <h3 className="font-serif text-base font-bold text-stone-900 flex items-center space-x-2 mb-4">
            <Users className="h-4 w-4 text-amber-800" />
            <span>Relational Circles & Figures</span>
          </h3>

          {rankedPeople.length === 0 ? (
            <div className="rounded-xl border border-dashed border-stone-200 p-6 text-center text-xs text-stone-500">
              <p>No specific names or relationships detected yet.</p>
              <p className="mt-1 text-[11px] text-stone-400">
                Mention friends, mentors, colleagues, or family in your entries to map your interpersonal landscape.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {rankedPeople.slice(0, 8).map((item, idx) => (
                <div
                  key={item.person}
                  className="flex items-center justify-between rounded-xl border border-stone-100 bg-stone-50/60 px-3.5 py-2.5 text-xs transition-colors hover:bg-stone-100"
                >
                  <div className="flex items-center space-x-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-stone-200 text-[10px] font-bold text-stone-700">
                      {item.person.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium text-stone-800">{item.person}</span>
                  </div>
                  <span className="rounded-full bg-stone-200/80 px-2.5 py-0.5 text-[11px] font-bold text-stone-700">
                    {item.count} {item.count === 1 ? 'mention' : 'mentions'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
