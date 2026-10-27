import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  Filter,
  Search,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Tag,
  ArrowUpDown,
  Plus,
  Compass,
  FileText,
} from 'lucide-react';

export interface TimelineItem {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  category: string;
  severity?: string; // routine, notable, critical, warning, low, medium, high
  location?: string;
  sourceEvidence?: string;
  tags?: string[];
}

interface TimelineViewProps {
  events: TimelineItem[];
  title?: string;
  onAddEvent?: (newEvent: {
    title: string;
    description: string;
    eventTimestamp: string;
    category: string;
    significance: string;
  }) => Promise<void>;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  events,
  title = 'Chronological Intelligence Timeline',
  onAddEvent,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form state for adding an event
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState('incident');
  const [newSignificance, setNewSignificance] = useState('medium');
  const [newDate, setNewDate] = useState(new Date().toISOString().slice(0, 16));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = useMemo(() => {
    const set = new Set<string>();
    events.forEach((e) => set.add(e.category));
    return ['all', ...Array.from(set)];
  }, [events]);

  const filteredEvents = useMemo(() => {
    return events
      .filter((e) => {
        const matchesCat = selectedCategory === 'all' || e.category === selectedCategory;
        const matchesQuery =
          e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (e.location && e.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (e.tags && e.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));
        return matchesCat && matchesQuery;
      })
      .sort((a, b) => {
        const timeA = new Date(a.timestamp).getTime();
        const timeB = new Date(b.timestamp).getTime();
        return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
      });
  }, [events, selectedCategory, searchQuery, sortOrder]);

  const getSeverityBadge = (severity?: string) => {
    const s = (severity || 'routine').toLowerCase();
    switch (s) {
      case 'critical':
      case 'high':
        return {
          label: 'CRITICAL',
          classes: 'bg-rose-950/80 text-rose-300 border-rose-500/50 glow-crimson',
          dot: 'bg-rose-500',
        };
      case 'notable':
      case 'warning':
        return {
          label: 'NOTABLE',
          classes: 'bg-amber-950/80 text-amber-300 border-amber-500/50 glow-amber',
          dot: 'bg-amber-500',
        };
      case 'medium':
        return {
          label: 'MEDIUM',
          classes: 'bg-cyan-950/80 text-cyan-300 border-cyan-500/50 glow-cyan-sm',
          dot: 'bg-cyan-400',
        };
      default:
        return {
          label: 'ROUTINE',
          classes: 'bg-slate-900 text-slate-300 border-slate-700',
          dot: 'bg-emerald-400',
        };
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !onAddEvent) return;

    setIsSubmitting(true);
    try {
      await onAddEvent({
        title: newTitle.trim(),
        description: newDesc.trim(),
        eventTimestamp: new Date(newDate).toISOString(),
        category: newCategory,
        significance: newSignificance,
      });
      setNewTitle('');
      setNewDesc('');
      setIsAddModalOpen(false);
    } catch (err) {
      console.error('Failed to create timeline event', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass-panel rounded-xl overflow-hidden border border-slate-800/80 flex flex-col h-full w-full">
      {/* Top Filter Bar */}
      <div className="p-4 bg-slate-950/80 border-b border-slate-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-cyan-400" />
            <h3 className="font-tactical-mono text-sm font-semibold text-slate-100">
              {title}
            </h3>
            <span className="text-xs font-tactical-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
              {filteredEvents.length} EVENTS
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search event, location, tag..."
                className="bg-slate-900/90 border border-slate-700/80 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-500/60 w-52"
              />
            </div>

            {/* Sort Toggle */}
            <button
              onClick={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
              className="px-2.5 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700/80 text-xs font-tactical-mono text-slate-300 hover:text-cyan-400 flex items-center gap-1.5"
              title="Toggle sort direction"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>{sortOrder === 'desc' ? 'NEWEST' : 'OLDEST'}</span>
            </button>

            {/* Add Event Button (if handler provided) */}
            {onAddEvent && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-medium text-xs flex items-center gap-1.5 shadow-sm shadow-cyan-900/40"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log Event</span>
              </button>
            )}
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <Filter className="w-3 h-3 text-slate-400 shrink-0 mr-1" />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`text-xs font-tactical-mono px-2.5 py-1 rounded-full whitespace-nowrap transition-colors border ${
                selectedCategory === cat
                  ? 'bg-cyan-950 text-cyan-300 border-cyan-500/60 font-semibold'
                  : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              {cat.replace(/_/g, ' ').toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline Stream */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-12 text-slate-400 font-tactical-mono text-xs">
            No events match the selected criteria.
          </div>
        ) : (
          <div className="relative border-l-2 border-slate-800/80 ml-4 space-y-6">
            {filteredEvents.map((evt) => {
              const badge = getSeverityBadge(evt.severity);
              const formattedDate = new Date(evt.timestamp).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                timeZoneName: 'short',
              });

              return (
                <div key={evt.id} className="relative pl-6 group">
                  {/* Pulse Node */}
                  <div
                    className={`absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-2 border-[#070A0F] ${badge.dot} shadow-md group-hover:scale-125 transition-transform`}
                  />

                  {/* Event Card */}
                  <div className="glass-panel glass-panel-hover p-4 rounded-xl border border-slate-800/80 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-tactical-mono text-cyan-400 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-cyan-500" />
                          {formattedDate}
                        </span>
                        <span className="text-[10px] font-tactical-mono px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-700 uppercase">
                          {evt.category.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <span
                        className={`text-[9px] font-tactical-mono px-2 py-0.5 rounded border ${badge.classes}`}
                      >
                        {badge.label}
                      </span>
                    </div>

                    <h4 className="text-sm font-semibold text-slate-100 group-hover:text-cyan-300 transition-colors">
                      {evt.title}
                    </h4>

                    <p className="text-xs text-slate-300 leading-relaxed">{evt.description}</p>

                    {/* Metadata: Location, Source, Tags */}
                    <div className="flex flex-wrap items-center gap-3 pt-2 text-[11px] font-tactical-mono text-slate-400 border-t border-slate-800/60">
                      {evt.location && (
                        <span className="flex items-center gap-1 text-slate-300">
                          <MapPin className="w-3 h-3 text-amber-400" />
                          {evt.location}
                        </span>
                      )}
                      {evt.sourceEvidence && (
                        <span className="flex items-center gap-1 text-slate-400">
                          <FileText className="w-3 h-3 text-cyan-500" />
                          Src: {evt.sourceEvidence}
                        </span>
                      )}
                      {evt.tags && evt.tags.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Tag className="w-3 h-3 text-slate-500" />
                          {evt.tags.map((t) => (
                            <span
                              key={t}
                              className="px-1.5 py-0.2 rounded bg-slate-900 text-slate-400 text-[10px]"
                            >
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Event Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass-panel-elevated p-6 rounded-xl border border-cyan-500/40 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="font-tactical-mono text-sm font-bold text-cyan-300">
                Log Timeline Event
              </h4>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-100 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-3">
              <div>
                <label className="block text-xs font-tactical-mono text-slate-300 mb-1">
                  Event Title *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Unidentified offshore transfer detected"
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-tactical-mono text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-tactical-mono"
                  >
                    <option value="incident">INCIDENT</option>
                    <option value="financial">FINANCIAL</option>
                    <option value="travel">TRAVEL</option>
                    <option value="cyber">CYBER</option>
                    <option value="employment">EMPLOYMENT</option>
                    <option value="legal">LEGAL</option>
                    <option value="social">SOCIAL</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-tactical-mono text-slate-300 mb-1">
                    Significance
                  </label>
                  <select
                    value={newSignificance}
                    onChange={(e) => setNewSignificance(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-tactical-mono"
                  >
                    <option value="low">LOW</option>
                    <option value="medium">MEDIUM</option>
                    <option value="high">HIGH</option>
                    <option value="critical">CRITICAL</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-tactical-mono text-slate-300 mb-1">
                  Date / Time *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 font-tactical-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-tactical-mono text-slate-300 mb-1">
                  Description / Observations
                </label>
                <textarea
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Details of the event, witnesses, evidence items..."
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 rounded bg-slate-800 text-slate-300 text-xs hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-semibold text-xs disabled:opacity-50"
                >
                  {isSubmitting ? 'Recording...' : 'Record Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
