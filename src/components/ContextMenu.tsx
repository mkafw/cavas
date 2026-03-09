import React, { useEffect, useRef } from 'react';
import { BrainCircuit, Wrench, FolderOpen, StickyNote } from 'lucide-react';

interface ContextMenuProps {
  x: number;
  y: number;
  isOpen: boolean;
  onClose: () => void;
  onAction: (action: string) => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, isOpen, onClose, onAction }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen || isNaN(x) || isNaN(y)) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-[9999] w-48 bg-white rounded-xl shadow-2xl border border-zinc-200 py-2 text-sm font-medium text-zinc-700"
      style={{ left: x, top: y }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <button onClick={() => onAction('coordinator')} className="w-full flex items-center gap-2 px-4 py-2 hover:bg-zinc-50 text-left">
        <BrainCircuit size={16} className="text-purple-500" />
        New Main Agent
      </button>
      <button onClick={() => onAction('tool')} className="w-full flex items-center gap-2 px-4 py-2 hover:bg-zinc-50 text-left">
        <Wrench size={16} className="text-emerald-500" />
        New Tool Agent
      </button>
      <div className="h-px bg-zinc-100 my-1" />
      <button onClick={() => onAction('group')} className="w-full flex items-center gap-2 px-4 py-2 hover:bg-zinc-50 text-left">
        <FolderOpen size={16} className="text-blue-500" />
        Create Group
      </button>
      <button onClick={() => onAction('note')} className="w-full flex items-center gap-2 px-4 py-2 hover:bg-zinc-50 text-left">
        <StickyNote size={16} className="text-yellow-500" />
        Add Note
      </button>
    </div>
  );
};
