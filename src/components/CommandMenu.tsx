import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, LayoutGrid, Trash2, Maximize, Search, Zap } from 'lucide-react';
import { Session } from '../types';

interface Command {
  id: string;
  label: string;
  icon: React.ReactNode;
  shortcut: string;
  action: () => void;
}

interface CommandMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNewSession: () => void;
  onAutoLayout: () => void;
  onResetZoom: () => void;
  onClearMessages: () => void;
  onSwitchSession: (index: number) => void;
  onToggleCanvas: () => void;
  sessions: Session[];
}

export const CommandMenu: React.FC<CommandMenuProps> = ({
  isOpen,
  onClose,
  onNewSession,
  onAutoLayout,
  onResetZoom,
  onClearMessages,
  onSwitchSession,
  onToggleCanvas,
  sessions,
}) => {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const commands: Command[] = [
    { id: 'new', label: 'New Session', icon: <Plus size={16} />, shortcut: 'N', action: onNewSession },
    { id: 'layout', label: 'Auto Layout', icon: <LayoutGrid size={16} />, shortcut: 'L', action: onAutoLayout },
    { id: 'zoom', label: 'Reset Zoom', icon: <Maximize size={16} />, shortcut: 'Z', action: onResetZoom },
    { id: 'clear', label: 'Clear Messages', icon: <Trash2 size={16} />, shortcut: 'C', action: onClearMessages },
    { id: 'canvas', label: 'Toggle Canvas', icon: <Search size={16} />, shortcut: 'V', action: onToggleCanvas },
    ...sessions.slice(0, 9).map((s, i) => ({
      id: `s${i + 1}`,
      label: `Go to: ${s.name}`,
      icon: <Zap size={16} />,
      shortcut: `${i + 1}`,
      action: () => onSwitchSession(i)
    }))
  ];

  const filteredCommands = commands.filter(c => 
    c.label.toLowerCase().includes(search.toLowerCase()) || 
    c.id.startsWith(search.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-start justify-center pt-32 px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden relative"
          >
            <div className="p-4 border-b border-zinc-100 flex items-center gap-3">
              <Search size={18} className="text-zinc-400" />
              <input
                autoFocus
                type="text"
                placeholder="Type a command or search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-sm text-zinc-800"
              />
              <div className="px-1.5 py-0.5 rounded bg-zinc-100 text-[10px] font-bold text-zinc-400 uppercase">
                ESC
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto p-2">
              {filteredCommands.length === 0 ? (
                <div className="p-8 text-center text-zinc-400 text-sm">
                  No commands found for "{search}"
                </div>
              ) : (
                filteredCommands.map((cmd, idx) => (
                  <button
                    key={cmd.id}
                    onClick={() => {
                      cmd.action();
                      onClose();
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                      idx === selectedIndex ? 'bg-emerald-50 text-emerald-700' : 'hover:bg-zinc-50 text-zinc-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${idx === selectedIndex ? 'bg-emerald-100' : 'bg-zinc-100'}`}>
                        {cmd.icon}
                      </div>
                      <span className="text-sm font-medium">{cmd.label}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-bold opacity-40">/</span>
                      <span className="text-[10px] font-bold uppercase">{cmd.shortcut}</span>
                    </div>
                  </button>
                ))
              )}
            </div>

            <div className="p-3 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-white border border-zinc-200 text-[10px] font-bold text-zinc-400">↑↓</kbd>
                  <span className="text-[10px] text-zinc-400 font-medium">Navigate</span>
                </div>
                <div className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-white border border-zinc-200 text-[10px] font-bold text-zinc-400">ENTER</kbd>
                  <span className="text-[10px] text-zinc-400 font-medium">Select</span>
                </div>
              </div>
              <div className="flex items-center gap-1 text-emerald-600">
                <Zap size={10} fill="currentColor" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Quick Actions</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
