import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Bot, Loader2, Minus, Maximize2, X, Palette, Copy, Check, Code, FileText, Sparkles, Link2, Reply, Eye, Briefcase, Wrench, ChevronDown } from 'lucide-react';
import { Message, Session, Task } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { TaskTracker } from './TaskTracker';

interface SessionNodeProps {
  session: Session;
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (sessionId: string, message: string) => void;
  onUpdateLayout: (sessionId: string, layout: Partial<Session>) => void;
  onClose: (sessionId: string) => void;
  isActive: boolean;
  onActivate: (sessionId: string) => void;
  onStartLinking: (sessionId: string) => void;
  isLinkingSource: boolean;
  parentAgents?: { id: string; name: string }[];
  onReportBack?: (childId: string, parentId: string, content: string) => void;
  agentRole?: 'coordinator' | 'manager' | 'tool';
}

export const SessionNode: React.FC<SessionNodeProps> = ({
  session,
  messages,
  isLoading,
  onSendMessage,
  onUpdateLayout,
  onClose,
  isActive,
  onActivate,
  onStartLinking,
  isLinkingSource,
  parentAgents = [],
  onReportBack,
  agentRole = 'coordinator',
}) => {
  const [viewMode, setViewMode] = useState<'chat' | 'code'>('chat');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(session.name);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setEditName(session.name);
  }, [session.name]);

  const [copied, setCopied] = useState(false);
  const [input, setInput] = useState('');

  const colors = ['#ffffff', '#fef2f2', '#f0fdf4', '#eff6ff', '#fffbeb', '#faf5ff'];

  const latestCanvas = [...messages].reverse().find(m => m.canvas_content);

  useEffect(() => {
    if (latestCanvas && viewMode === 'chat') {
      setViewMode('code');
    }
  }, [latestCanvas]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, viewMode]);

  const handleCopy = () => {
    if (latestCanvas?.canvas_content) {
      navigator.clipboard.writeText(latestCanvas.canvas_content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <motion.div
      drag
      dragMomentum={false}
      onDragEnd={(_, info) => {
        onUpdateLayout(session.id, { x: session.x + info.offset.x, y: session.y + info.offset.y });
      }}
      onPointerDown={() => onActivate(session.id)}
      initial={{ x: session.x, y: session.y, scale: 0.9, opacity: 0 }}
      animate={{ 
        x: session.x, 
        y: session.y, 
        scale: 1, 
        opacity: 1,
        zIndex: isActive ? 50 : 10,
      }}
      className={`absolute w-[400px] rounded-2xl shadow-2xl border-2 transition-all duration-200 overflow-hidden flex flex-col bg-white ${
        isActive ? 'border-emerald-500 ring-4 ring-emerald-500/10' : 'border-zinc-200'
      } ${session.is_minimized ? 'h-14' : 'h-[600px]'}`}
      style={{ backgroundColor: session.color }}
    >
      {/* Visual Ports for n8n-style connecting */}
      <div 
        className="absolute -left-2 top-7 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-zinc-400 z-50 cursor-crosshair hover:scale-150 hover:border-emerald-500 hover:shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all shadow-md flex items-center justify-center group/port"
        onPointerDown={(e) => {
          e.stopPropagation();
          onStartLinking(session.id);
        }}
        title="Input Port"
      >
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 opacity-0 group-hover/port:opacity-100 transition-opacity" />
      </div>
      <div 
        className="absolute -right-2 top-7 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-zinc-400 z-50 cursor-crosshair hover:scale-150 hover:border-emerald-500 hover:shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all shadow-md flex items-center justify-center group/port"
        onPointerDown={(e) => {
          e.stopPropagation();
          onStartLinking(session.id);
        }}
        title="Output Port"
      >
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 opacity-0 group-hover/port:opacity-100 transition-opacity" />
      </div>

      {/* Header */}
      <div className="h-14 px-4 flex items-center justify-between cursor-grab active:cursor-grabbing border-b border-zinc-100 shrink-0 select-none">
        <div className="flex items-center gap-2 overflow-hidden flex-1">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          {isEditingName ? (
            <input
              autoFocus
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={() => {
                setIsEditingName(false);
                if (editName !== session.name) {
                  onUpdateLayout(session.id, { name: editName });
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.currentTarget.blur();
              }}
              className="font-bold text-zinc-800 text-sm bg-transparent border-b border-zinc-300 outline-none w-full"
              onPointerDown={(e) => e.stopPropagation()}
            />
          ) : (
            <h3 
              className="font-bold text-zinc-800 truncate text-sm cursor-text"
              onDoubleClick={(e) => {
                e.stopPropagation();
                setIsEditingName(true);
              }}
              title="Double click to rename"
            >
              {session.name}
            </h3>
          )}
          <div className={`relative flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-medium border ${
              agentRole === 'coordinator' ? 'bg-purple-50 text-purple-600 border-purple-100' :
              agentRole === 'manager' ? 'bg-blue-50 text-blue-600 border-blue-100' :
              'bg-emerald-50 text-emerald-600 border-emerald-100'
            }`}>
            {agentRole === 'coordinator' && <Eye size={10} />}
            {agentRole === 'manager' && <Briefcase size={10} />}
            {agentRole === 'tool' && <Wrench size={10} />}
            <select
              value={session.agentType || 'auto'}
              onChange={(e) => {
                const val = e.target.value;
                onUpdateLayout(session.id, { agentType: val === 'auto' ? null : val as any });
              }}
              className="bg-transparent outline-none cursor-pointer appearance-none pr-3"
              title="Change Agent Role"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <option value="auto">Auto ({agentRole})</option>
              <option value="coordinator">Coordinator</option>
              <option value="manager">Manager</option>
              <option value="tool">Tool</option>
            </select>
            <ChevronDown size={10} className="absolute right-1 pointer-events-none opacity-50" />
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="p-1.5 hover:bg-black/5 rounded-lg text-zinc-500"
          >
            <Palette size={14} />
          </button>
          <button 
            onClick={() => onUpdateLayout(session.id, { is_minimized: !session.is_minimized })}
            className="p-1.5 hover:bg-black/5 rounded-lg text-zinc-500"
          >
            {session.is_minimized ? <Maximize2 size={14} /> : <Minus size={14} />}
          </button>
          <button 
            onClick={() => onClose(session.id)}
            className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg"
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
            className="absolute top-14 right-4 z-50 bg-white p-2 rounded-xl shadow-xl border border-zinc-200 flex gap-2"
          >
            {colors.map(c => (
              <button
                key={c}
                onClick={() => {
                  onUpdateLayout(session.id, { color: c });
                  setShowColorPicker(false);
                }}
                className="w-6 h-6 rounded-full border border-zinc-200"
                style={{ backgroundColor: c }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {!session.is_minimized && (
        <>
          {/* Content Tabs */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* View Toggle */}
            <div className="flex p-1 bg-zinc-100/50 mx-4 mt-4 rounded-xl shrink-0">
               <button 
                onClick={() => setViewMode('chat')}
                className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all rounded-lg ${
                  viewMode === 'chat' ? 'bg-white shadow-sm text-zinc-600' : 'text-zinc-400 hover:text-zinc-500'
                }`}
               >
                Chat
               </button>
               <button 
                onClick={() => setViewMode('code')}
                className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all rounded-lg ${
                  viewMode === 'code' ? 'bg-white shadow-sm text-zinc-600' : 'text-zinc-400 hover:text-zinc-500'
                }`}
               >
                OpenCode
               </button>
            </div>

            <AnimatePresence mode="wait">
              {viewMode === 'chat' ? (
                <motion.div 
                  key="chat"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  ref={scrollRef} 
                  className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar"
                >
                  {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-300">
                       <Bot size={24} className="mb-2 opacity-20" />
                       <span className="text-[10px] font-bold uppercase tracking-widest">Node Initialized</span>
                    </div>
                  )}
                  {messages.filter(m => m.tasks || m.canvas_content).map((msg, i) => (
                    <div key={i} className="space-y-2">
                      {msg.tasks && <TaskTracker tasks={msg.tasks} skillUsed={msg.skill_used || undefined} />}
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex gap-2 items-center justify-center py-4">
                       <Loader2 size={14} className="animate-spin text-emerald-500" />
                       <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Processing...</span>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div 
                  key="code"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="flex-1 flex flex-col overflow-hidden p-4"
                >
                  {latestCanvas ? (
                    <div className="flex-1 flex flex-col bg-zinc-900 rounded-xl border border-white/10 overflow-hidden shadow-inner">
                      <div className="h-10 px-4 flex items-center justify-between border-b border-white/5 bg-black/20">
                        <div className="flex items-center gap-2">
                          <Code size={12} className="text-emerald-400" />
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                            {latestCanvas.canvas_type || 'source'}
                          </span>
                        </div>
                        <button onClick={handleCopy} className="p-1.5 hover:bg-white/5 rounded-md text-zinc-500 hover:text-white transition-all">
                          {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                        </button>
                      </div>
                      <div className="flex-1 overflow-auto p-4 custom-scrollbar">
                        <pre className="text-[11px] font-mono leading-relaxed text-zinc-300 selection:bg-emerald-500/30">
                          <code>{latestCanvas.canvas_content}</code>
                        </pre>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 text-center">
                      <Sparkles size={32} className="mb-3 opacity-20" />
                      <p className="text-[10px] font-bold uppercase tracking-widest">No Code Artifact Yet</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Input Area */}
          <div className="p-3 border-t border-zinc-100 bg-white shrink-0">
            {parentAgents.length > 0 && messages.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-1">
                {parentAgents.map(parent => (
                  <button
                    key={parent.id}
                    onClick={() => {
                      const lastAssistantMessage = [...messages].reverse().find(m => m.role === 'assistant');
                      if (lastAssistantMessage && onReportBack) {
                        onReportBack(session.id, parent.id, lastAssistantMessage.content || lastAssistantMessage.canvas_content || 'Task completed.');
                      }
                    }}
                    className="flex items-center gap-1 text-[10px] font-medium bg-emerald-50 text-emerald-600 px-2 py-1 rounded-md hover:bg-emerald-100 transition-colors border border-emerald-200"
                    title={`Report latest result to ${parent.name}`}
                  >
                    <Reply size={10} />
                    Report to {parent.name}
                  </button>
                ))}
              </div>
            )}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (input.trim() && !isLoading) {
                  onSendMessage(session.id, input);
                  setInput('');
                }
              }}
              className="relative"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Message this agent..."
                className="w-full bg-zinc-50 border border-zinc-200 rounded-lg pl-3 pr-8 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute right-1.5 top-1.5 p-1 bg-emerald-600 text-white rounded disabled:opacity-50 transition-all"
              >
                <Send size={12} />
              </button>
            </form>
          </div>
        </>
      )}
    </motion.div>
  );
};
