import React, { useState, useRef, useEffect } from 'react';
import { Plus, Zap, Send, User, Bot, Loader2, MessageSquare, LayoutGrid, Settings, Database } from 'lucide-react';
import { Session, Message, Task } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { TaskTracker } from './TaskTracker';
import { OrchestrationPanel } from './OrchestrationPanel';

interface SidebarProps {
  sessions: Session[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onAutoLayout: () => void;
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (sessionId: string, message: string) => void;
  onApproveDelegation: (index: number, delegation: any) => void;
  onOpenCommandMenu: () => void;
  parentAgents?: { id: string; name: string }[];
  onReportBack?: (childId: string, parentId: string, content: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onAutoLayout,
  messages,
  isLoading,
  onSendMessage,
  onApproveDelegation,
  onOpenCommandMenu,
  parentAgents = [],
  onReportBack,
}) => {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    if (val === '/') {
      onOpenCommandMenu();
      return;
    }
    setInput(val);
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading && activeSessionId) {
      onSendMessage(activeSessionId, input);
      setInput('');
    }
  };

  return (
    <div className="w-80 h-full bg-white border-r border-zinc-200 flex flex-col shrink-0 z-[110] shadow-xl">
      {/* Brand */}
      <div className="p-6 border-b border-zinc-100 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-200">
          <Zap size={20} fill="currentColor" />
        </div>
        <div>
          <h1 className="font-bold text-zinc-800 leading-none">OpenCode Canvas</h1>
          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-tighter">Code Orchestrator</span>
        </div>
      </div>

      {/* Quick Switcher (1, 2 buttons) */}
      <div className="px-6 py-3 flex items-center justify-between border-b border-zinc-100 bg-zinc-50/30">
        <div className="flex gap-2">
          {sessions.slice(0, 5).map((s, i) => (
            <button
              key={s.id}
              onClick={() => onSelectSession(s.id)}
              className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all ${
                activeSessionId === s.id
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200'
                  : 'bg-white text-zinc-400 border border-zinc-200 hover:border-zinc-300'
              }`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={onNewSession}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 transition-all group relative"
            title="New Session (Ctrl+N)"
          >
            <Plus size={14} />
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-zinc-800 text-white text-[8px] rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap">
              CTRL + N
            </div>
          </button>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-1.5 py-0.5 bg-orange-50 border border-orange-200 rounded text-[8px] font-bold text-orange-600 uppercase tracking-tighter">
            <span className="w-1 h-1 rounded-full bg-orange-500 animate-pulse" />
            Rust Core
          </div>
          <button 
            onClick={onAutoLayout} 
            className="p-2 text-zinc-400 hover:text-zinc-600 transition-colors group relative"
            title="Auto Layout (Ctrl+L)"
          >
            <LayoutGrid size={16} />
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-zinc-800 text-white text-[8px] rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap">
              CTRL + L
            </div>
          </button>
        </div>
      </div>

      {/* Chat Dialog Area (The "Dialog Box" requested) */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white">
        {!activeSessionId ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-zinc-400">
            <MessageSquare size={32} className="mb-4 opacity-20" />
            <p className="text-sm font-medium">Select a Chat to start messaging</p>
          </div>
        ) : (
          <>
            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar">
              {messages.length === 0 && (
                <div className="py-12 text-center">
                  <Bot size={32} className="mx-auto text-zinc-200 mb-4" />
                  <p className="text-xs text-zinc-400 font-medium">How can I help you with Chat {sessions.findIndex(s => s.id === activeSessionId) + 1}?</p>
                </div>
              )}
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-[10px] font-bold ${
                    msg.role === 'user' ? 'bg-zinc-800 text-white' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {msg.role === 'user' ? 'U' : 'G'}
                  </div>
                  <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-zinc-800 text-white rounded-tr-none' 
                      : 'bg-zinc-100 text-zinc-800 rounded-tl-none'
                  }`}>
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                    {msg.tasks && <TaskTracker tasks={msg.tasks} skillUsed={msg.skill_used || undefined} />}
                    {msg.delegations && (
                      <OrchestrationPanel 
                        delegations={msg.delegations} 
                        onApprove={(idx) => {
                          onApproveDelegation(idx, msg.delegations![idx]);
                        }} 
                      />
                    )}
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <Loader2 size={12} className="animate-spin" />
                  </div>
                  <div className="bg-zinc-100 rounded-2xl rounded-tl-none px-3 py-2">
                    <div className="flex gap-1">
                      <span className="w-1 h-1 bg-zinc-400 rounded-full animate-bounce" />
                      <span className="w-1 h-1 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-zinc-100 bg-zinc-50/50">
              {parentAgents.length > 0 && messages.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-1">
                  {parentAgents.map(parent => (
                    <button
                      key={parent.id}
                      onClick={() => {
                        const lastAssistantMessage = [...messages].reverse().find(m => m.role === 'assistant');
                        if (lastAssistantMessage && onReportBack && activeSessionId) {
                          onReportBack(activeSessionId, parent.id, lastAssistantMessage.content || lastAssistantMessage.canvas_content || 'Task completed.');
                        }
                      }}
                      className="flex items-center gap-1 text-[10px] font-medium bg-emerald-50 text-emerald-600 px-2 py-1 rounded-md hover:bg-emerald-100 transition-colors border border-emerald-200"
                      title={`Report latest result to ${parent.name}`}
                    >
                      <Send size={10} className="rotate-180" />
                      Report to {parent.name}
                    </button>
                  ))}
                </div>
              )}
              <form onSubmit={handleSubmit} className="relative">
                <textarea
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                  placeholder="Type a message or / for commands..."
                  className="w-full bg-white border border-zinc-200 rounded-xl pl-4 pr-10 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none max-h-32"
                  rows={1}
                />
                <div className="absolute right-10 bottom-3 flex items-center gap-1 pointer-events-none opacity-30">
                  <kbd className="px-1 py-0.5 rounded bg-zinc-100 border border-zinc-200 text-[8px] font-bold">CTRL</kbd>
                  <kbd className="px-1 py-0.5 rounded bg-zinc-100 border border-zinc-200 text-[8px] font-bold">K</kbd>
                </div>
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 bottom-2 p-1.5 bg-emerald-600 text-white rounded-lg disabled:opacity-50 transition-all"
                >
                  <Send size={14} />
                </button>
              </form>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-zinc-100 bg-white">
        <div className="flex items-center justify-between text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
          <div className="flex items-center gap-2">
            <Database size={10} /> Local Sync
          </div>
          <Settings size={12} className="cursor-pointer hover:text-zinc-600" />
        </div>
      </div>
    </div>
  );
};
