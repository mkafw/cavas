import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Palette, X, StickyNote } from 'lucide-react';
import { Note } from '../types';

interface NoteNodeProps {
  note: Note;
  onUpdate: (id: string, updates: Partial<Note>) => void;
  onDelete: (id: string) => void;
}

export const NoteNode: React.FC<NoteNodeProps> = ({ note, onUpdate, onDelete }) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [content, setContent] = useState(note.content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const colors = ['#fef08a', '#fbcfe8', '#bfdbfe', '#bbf7d0', '#e9d5ff', '#ffffff'];

  useEffect(() => {
    setContent(note.content);
  }, [note.content]);

  const handleBlur = () => {
    if (content !== note.content) {
      onUpdate(note.id, { content });
    }
  };

  return (
    <motion.div
      drag
      dragMomentum={false}
      onDragEnd={(_, info) => {
        onUpdate(note.id, { x: note.x + info.offset.x, y: note.y + info.offset.y });
      }}
      initial={{ x: note.x, y: note.y, scale: 0.9, opacity: 0 }}
      animate={{ x: note.x, y: note.y, scale: 1, opacity: 1 }}
      className="absolute w-64 min-h-[256px] rounded-xl shadow-xl border border-black/5 flex flex-col transition-shadow hover:shadow-2xl z-20"
      style={{ backgroundColor: note.color }}
    >
      {/* Header */}
      <div className="h-10 px-3 flex items-center justify-between cursor-grab active:cursor-grabbing border-b border-black/5 shrink-0 select-none">
        <div className="flex items-center gap-2 opacity-50">
          <StickyNote size={14} />
        </div>
        <div className="flex items-center gap-1 opacity-0 hover:opacity-100 transition-opacity">
          <button 
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="p-1.5 hover:bg-black/5 rounded-lg text-black/50"
          >
            <Palette size={14} />
          </button>
          <button 
            onClick={() => onDelete(note.id)}
            className="p-1.5 hover:bg-red-500/10 text-red-500/70 rounded-lg"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Color Picker Popover */}
      <AnimatePresence>
        {showColorPicker && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-10 right-2 z-50 bg-white p-2 rounded-xl shadow-xl border border-zinc-200 flex gap-2"
          >
            {colors.map(c => (
              <button
                key={c}
                onClick={() => {
                  onUpdate(note.id, { color: c });
                  setShowColorPicker(false);
                }}
                className="w-6 h-6 rounded-full border border-zinc-200"
                style={{ backgroundColor: c }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="flex-1 p-4">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onBlur={handleBlur}
          placeholder="Type your note here..."
          className="w-full h-full bg-transparent resize-none outline-none text-black/80 font-medium placeholder:text-black/30 text-sm leading-relaxed"
        />
      </div>
    </motion.div>
  );
};
