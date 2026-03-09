import React, { useState } from 'react';
import { Copy, Check, Code, FileText, Sparkles, Maximize2, Minimize2, Download, Share2 } from 'lucide-react';
import { Message } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface GlobalCanvasProps {
  activeMessage: Message | null;
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalCanvas: React.FC<GlobalCanvasProps> = ({
  activeMessage,
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleCopy = () => {
    if (activeMessage?.canvas_content) {
      navigator.clipboard.writeText(activeMessage.canvas_content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      className={`bg-white border-l border-zinc-200 flex flex-col shrink-0 z-[110] shadow-2xl transition-all duration-300 ${
        isExpanded ? 'w-full fixed inset-0 z-[200]' : 'w-[500px] h-full'
      }`}
    >
      {/* Header */}
      <div className="h-16 border-b border-zinc-100 flex items-center justify-between px-6 bg-white shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-600">
            {activeMessage?.canvas_type?.includes('code') ? <Code size={20} /> : <FileText size={20} />}
          </div>
          <div>
            <h2 className="text-sm font-bold text-zinc-800">Global Artifact Viewer</h2>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              {activeMessage?.canvas_type || 'No Content'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={handleCopy} className="p-2 hover:bg-zinc-100 rounded-xl text-zinc-500 transition-all">
            {copied ? <Check size={18} className="text-emerald-600" /> : <Copy size={18} />}
          </button>
          <button onClick={() => setIsExpanded(!isExpanded)} className="p-2 hover:bg-zinc-100 rounded-xl text-zinc-500 transition-all">
            {isExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
          <div className="w-px h-6 bg-zinc-100 mx-1" />
          <button onClick={onClose} className="p-2 hover:bg-red-50 rounded-xl text-red-500 transition-all">
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto bg-zinc-50/50 p-8">
        <AnimatePresence mode="wait">
          {activeMessage?.canvas_content ? (
            <motion.div
              key={activeMessage.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden min-h-full"
            >
              <div className="p-10">
                <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-zinc-800 selection:bg-emerald-100">
                  <code>{activeMessage.canvas_content}</code>
                </pre>
              </div>
            </motion.div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-zinc-400 text-center">
              <Sparkles size={48} className="mb-4 opacity-20" />
              <p className="text-sm font-medium">Select a node with an artifact to view it here</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-zinc-100 bg-white flex items-center justify-between">
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-zinc-600 hover:bg-zinc-50 rounded-xl border border-zinc-200 transition-all">
            <Download size={14} /> Download
          </button>
          <button className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-zinc-600 hover:bg-zinc-50 rounded-xl border border-zinc-200 transition-all">
            <Share2 size={14} /> Share
          </button>
        </div>
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
          Last Updated: {activeMessage?.created_at ? new Date(activeMessage.created_at).toLocaleTimeString() : 'N/A'}
        </span>
      </div>
    </motion.div>
  );
};

const X = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);
