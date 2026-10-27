import React, { useState } from 'react';
import type { NoteRecord, NoteCategory } from '@shared/types/case.js';
import {
  Notebook,
  Plus,
  Trash2,
  Edit3,
  Check,
  Eye,
  FileCode,
  Bold,
  Italic,
  List,
  Heading,
  Code,
  Search,
  Filter,
} from 'lucide-react';

interface NotesEditorProps {
  notes: NoteRecord[];
  caseId: string;
  onAddNote: (payload: { title?: string; content: string; category?: NoteCategory }) => Promise<void>;
  onUpdateNote?: (id: string, updates: { title?: string; content?: string; category?: NoteCategory }) => Promise<void>;
  onDeleteNote?: (id: string) => Promise<void>;
}

export const NotesEditor: React.FC<NotesEditorProps> = ({
  notes,
  caseId,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
}) => {
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(notes[0]?.id || null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [previewMode, setPreviewMode] = useState<'edit' | 'preview'>('edit');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Form / active editor state
  const [activeTitle, setActiveTitle] = useState('');
  const [activeContent, setActiveContent] = useState('');
  const [activeCategory, setActiveCategory] = useState<NoteCategory>('observation');
  const [isSaving, setIsSaving] = useState(false);

  // Sync active note on select
  const handleSelectNote = (note: NoteRecord) => {
    setSelectedNoteId(note.id);
    setIsCreatingNew(false);
    setActiveTitle(note.title);
    setActiveContent(note.content);
    setActiveCategory(note.category);
    setPreviewMode('edit');
  };

  const startNewNote = () => {
    setIsCreatingNew(true);
    setSelectedNoteId(null);
    setActiveTitle('');
    setActiveContent('');
    setActiveCategory('observation');
    setPreviewMode('edit');
  };

  // Markdown helper
  const insertMarkdown = (prefix: string, suffix: string = '') => {
    const textarea = document.getElementById('note-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = activeContent.substring(start, end);
    const replacement = `${prefix}${selected || 'text'}${suffix}`;

    const newContent =
      activeContent.substring(0, start) + replacement + activeContent.substring(end);
    setActiveContent(newContent);
  };

  const handleSave = async () => {
    if (!activeContent.trim()) return;

    setIsSaving(true);
    try {
      if (isCreatingNew) {
        await onAddNote({
          title: activeTitle.trim() || undefined,
          content: activeContent.trim(),
          category: activeCategory,
        });
        setIsCreatingNew(false);
      } else if (selectedNoteId && onUpdateNote) {
        await onUpdateNote(selectedNoteId, {
          title: activeTitle.trim() || undefined,
          content: activeContent.trim(),
          category: activeCategory,
        });
      }
    } catch (err) {
      console.error('Failed to save note', err);
    } finally {
      setIsSaving(false);
    }
  };

  const getCategoryBadge = (cat: NoteCategory) => {
    switch (cat) {
      case 'lead':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50';
      case 'hypothesis':
        return 'bg-amber-950/80 text-amber-300 border-amber-500/50';
      case 'interview':
        return 'bg-purple-950/80 text-purple-300 border-purple-500/50';
      case 'summary':
        return 'bg-blue-950/80 text-blue-300 border-blue-500/50';
      default:
        return 'bg-cyan-950/80 text-cyan-300 border-cyan-500/50';
    }
  };

  const filteredNotes = notes.filter((n) => {
    const matchesCat = filterCategory === 'all' || n.category === filterCategory;
    const matchesSearch =
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Simple Markdown renderer
  const renderMarkdown = (text: string) => {
    const lines = text.split('\n');
    return (
      <div className="space-y-2 text-slate-200 text-sm leading-relaxed font-sans">
        {lines.map((line, idx) => {
          if (line.startsWith('### ')) {
            return <h4 key={idx} className="text-base font-bold text-cyan-300 mt-2">{line.replace('### ', '')}</h4>;
          }
          if (line.startsWith('## ')) {
            return <h3 key={idx} className="text-lg font-bold text-cyan-400 mt-3">{line.replace('## ', '')}</h3>;
          }
          if (line.startsWith('# ')) {
            return <h2 key={idx} className="text-xl font-bold text-cyan-300 mt-4 border-b border-slate-800 pb-1">{line.replace('# ', '')}</h2>;
          }
          if (line.startsWith('- ') || line.startsWith('* ')) {
            return (
              <li key={idx} className="ml-4 list-disc text-slate-300">
                {line.replace(/^[-*]\s+/, '')}
              </li>
            );
          }
          if (line.startsWith('> ')) {
            return (
              <blockquote key={idx} className="border-l-2 border-cyan-500 pl-3 italic text-slate-400 my-1">
                {line.replace('> ', '')}
              </blockquote>
            );
          }
          if (line.trim() === '') {
            return <div key={idx} className="h-2" />;
          }
          return <p key={idx}>{line}</p>;
        })}
      </div>
    );
  };

  return (
    <div className="glass-panel rounded-xl overflow-hidden border border-slate-800/80 flex h-[620px] w-full">
      {/* Sidebar: Notes List */}
      <div className="w-72 border-r border-slate-800 bg-slate-950/70 flex flex-col shrink-0">
        <div className="p-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Notebook className="w-4 h-4 text-cyan-400" />
            <span className="font-tactical-mono text-xs font-semibold text-slate-100">
              Investigation Notes
            </span>
          </div>
          <button
            onClick={startNewNote}
            className="p-1 rounded bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-medium"
            title="Create New Note"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-2 border-b border-slate-800">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes..."
              className="w-full bg-slate-900 border border-slate-700 rounded pl-7 pr-2 py-1 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Note List Items */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {filteredNotes.length === 0 && !isCreatingNew ? (
            <div className="text-center py-8 text-slate-400 text-xs font-tactical-mono">
              No notes recorded.
            </div>
          ) : (
            filteredNotes.map((note) => {
              const isSelected = selectedNoteId === note.id && !isCreatingNew;
              return (
                <div
                  key={note.id}
                  onClick={() => handleSelectNote(note)}
                  className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-cyan-950/40 border-cyan-500/50 shadow-md'
                      : 'border-slate-800/80 bg-slate-900/40 hover:bg-slate-900 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-xs font-semibold text-slate-100 truncate">
                      {note.title || 'Untitled Note'}
                    </span>
                    <span
                      className={`text-[9px] font-tactical-mono px-1.5 py-0.2 rounded border uppercase ${getCategoryBadge(
                        note.category
                      )}`}
                    >
                      {note.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2">
                    {note.content}
                  </p>
                  <div className="text-[9px] font-tactical-mono text-slate-400 mt-1">
                    {new Date(note.updatedAt || note.createdAt).toLocaleDateString()}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Editor Pane */}
      <div className="flex-1 flex flex-col bg-[#070A0F]">
        {/* Editor Toolbar */}
        <div className="p-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-tactical-mono px-2 py-0.5 rounded border uppercase ${getCategoryBadge(
                activeCategory
              )}`}
            >
              {isCreatingNew ? 'NEW NOTE' : activeCategory}
            </span>

            <select
              value={activeCategory}
              onChange={(e) => setActiveCategory(e.target.value as NoteCategory)}
              className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-tactical-mono"
            >
              <option value="observation">OBSERVATION</option>
              <option value="lead">LEAD</option>
              <option value="hypothesis">HYPOTHESIS</option>
              <option value="interview">INTERVIEW</option>
              <option value="summary">SUMMARY</option>
            </select>
          </div>

          {/* Markdown Formatting Controls & Preview Toggle */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => insertMarkdown('**', '**')}
              className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800"
              title="Bold"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => insertMarkdown('*', '*')}
              className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800"
              title="Italic"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => insertMarkdown('### ')}
              className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800"
              title="Header"
            >
              <Heading className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => insertMarkdown('- ')}
              className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800"
              title="Bullet List"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => insertMarkdown('`', '`')}
              className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800"
              title="Inline Code"
            >
              <Code className="w-3.5 h-3.5" />
            </button>

            <span className="w-px h-4 bg-slate-800 mx-1" />

            {/* Toggle Edit / Preview */}
            <button
              onClick={() => setPreviewMode((prev) => (prev === 'edit' ? 'preview' : 'edit'))}
              className={`px-2 py-1 rounded text-xs font-tactical-mono flex items-center gap-1 border ${
                previewMode === 'preview'
                  ? 'bg-cyan-950 text-cyan-300 border-cyan-500/50'
                  : 'bg-slate-900 text-slate-400 border-slate-700'
              }`}
            >
              <Eye className="w-3 h-3" />
              <span>{previewMode === 'preview' ? 'EDIT' : 'PREVIEW'}</span>
            </button>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={isSaving || !activeContent.trim()}
              className="px-3 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-semibold text-xs flex items-center gap-1 disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save Note'}</span>
            </button>

            {/* Delete Note */}
            {selectedNoteId && !isCreatingNew && onDeleteNote && (
              <button
                onClick={() => onDeleteNote(selectedNoteId)}
                className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-950/30"
                title="Delete Note"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Note Title Input */}
        <div className="p-3 border-b border-slate-800/80 bg-slate-950/40">
          <input
            type="text"
            value={activeTitle}
            onChange={(e) => setActiveTitle(e.target.value)}
            placeholder="Note title or observation subject..."
            className="w-full bg-transparent text-base font-semibold text-slate-100 placeholder-slate-400 focus:outline-none"
          />
        </div>

        {/* Text Area or Markdown Preview */}
        <div className="flex-1 p-4 overflow-y-auto">
          {previewMode === 'edit' ? (
            <textarea
              id="note-textarea"
              rows={16}
              value={activeContent}
              onChange={(e) => setActiveContent(e.target.value)}
              placeholder="Record investigation notes in Markdown... (e.g. # Observations, - Leads, > Intercept quotes)"
              className="w-full h-full bg-transparent text-slate-100 placeholder-slate-400 font-tactical-mono text-xs focus:outline-none resize-none leading-relaxed"
            />
          ) : (
            <div className="prose prose-invert max-w-none">
              {renderMarkdown(activeContent || '_No content entered yet._')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
