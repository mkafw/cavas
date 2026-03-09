import React from 'react';
import { Terminal, X, Info, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { SystemLog } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface LogPanelProps {
  logs: SystemLog[];
  isOpen: boolean;
  onClose: () => void;
}

export const LogPanel: React.FC<LogPanelProps> = ({ logs, isOpen, onClose }) => {
  const getIcon = (level: string) => {
    switch (level) {
      case 'info': return <Info size={14} className="text-blue-400" />;
      case 'warn': return <AlertCircle size={14} className="text-yellow-400" />;
      case 'error': return <AlertCircle size={14} className="text-red-400" />;
      case 'success': return <CheckCircle size={14} className="text-emerald-400" />;
      default: return <Info size={14} className="text-zinc-400" />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="fixed bottom-6 right-6 w-[400px] h-[300px] bg-zinc-900 rounded-xl shadow-2xl border border-white/10 flex flex-col overflow-hidden z-[200] font-mono"
        >
          <div className="h-10 px-4 flex items-center justify-between border-b border-white/10 bg-black/20 shrink-0">
            <div className="flex items-center gap-2">
              <Terminal size={14} className="text-emerald-400" />
              <span className="text-xs font-bold text-zinc-300 uppercase tracking-widest">System Logs & Hooks</span>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg text-zinc-500 hover:text-white transition-colors">
              <X size={14} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {logs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-zinc-600">
                <Terminal size={24} className="mb-2 opacity-20" />
                <span className="text-[10px] uppercase tracking-widest">No logs yet</span>
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="flex gap-3 text-xs">
                  <div className="shrink-0 mt-0.5">{getIcon(log.level)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-zinc-500 flex items-center gap-1">
                        <Clock size={10} />
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                      <span className="text-emerald-400/80 font-bold">[{log.source}]</span>
                    </div>
                    <p className="text-zinc-300 break-words leading-relaxed">{log.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
