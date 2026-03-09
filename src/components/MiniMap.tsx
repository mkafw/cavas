import React from 'react';
import { Session, Note } from '../types';

interface MiniMapProps {
  sessions: Session[];
  notes: Note[];
  zoom: number;
  activeSessionId: string | null;
  onNavigate: (x: number, y: number) => void;
}

export const MiniMap: React.FC<MiniMapProps> = ({
  sessions,
  notes,
  zoom,
  activeSessionId,
  onNavigate,
}) => {
  const validSessions = sessions.filter(s => !isNaN(s.x) && !isNaN(s.y));
  const validNotes = notes.filter(n => !isNaN(n.x) && !isNaN(n.y));

  if (validSessions.length === 0 && validNotes.length === 0) return null;

  // Calculate bounds
  const padding = 100;
  const allX = [...validSessions.map(s => s.x), ...validNotes.map(n => n.x)];
  const allY = [...validSessions.map(s => s.y), ...validNotes.map(n => n.y)];
  
  const minX = Math.min(...allX) - padding;
  const maxX = Math.max(...validSessions.map(s => s.x + 400), ...validNotes.map(n => n.x + 256)) + padding;
  const minY = Math.min(...allY) - padding;
  const maxY = Math.max(...validSessions.map(s => s.y + 600), ...validNotes.map(n => n.y + 256)) + padding;

  const width = maxX - minX;
  const height = maxY - minY;

  const mapSize = 180;
  const scale = mapSize / Math.max(width, height);

  return (
    <div 
      className="fixed bottom-6 right-6 w-[180px] h-[180px] bg-white/80 backdrop-blur-md border border-zinc-200 rounded-2xl shadow-xl overflow-hidden z-[100] group transition-all hover:w-[240px] hover:h-[240px]"
      style={{ aspectRatio: '1/1' }}
    >
      <div className="absolute top-2 left-3 flex items-center gap-1.5">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">OpenCode Radar</span>
      </div>

      <div className="relative w-full h-full p-4">
        <div 
          className="relative w-full h-full"
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        >
          {validSessions.map(session => (
            <div
              key={session.id}
              onClick={() => onNavigate(session.x, session.y)}
              className={`absolute rounded-md transition-all cursor-pointer ${
                session.id === activeSessionId 
                  ? 'bg-emerald-500 ring-4 ring-emerald-500/20 z-10' 
                  : 'bg-zinc-300 hover:bg-zinc-400'
              }`}
              style={{
                left: session.x - minX,
                top: session.y - minY,
                width: 400,
                height: session.is_minimized ? 80 : 600,
                opacity: 0.8,
              }}
            />
          ))}
          {validNotes.map(note => (
            <div
              key={note.id}
              onClick={() => onNavigate(note.x, note.y)}
              className="absolute rounded-md transition-all cursor-pointer bg-yellow-300 hover:bg-yellow-400"
              style={{
                left: note.x - minX,
                top: note.y - minY,
                width: 256,
                height: 256,
                opacity: 0.8,
                backgroundColor: note.color
              }}
            />
          ))}
        </div>
      </div>

      <div className="absolute bottom-2 right-3">
        <span className="text-[10px] font-mono text-zinc-400">
          {Math.round(zoom * 100)}%
        </span>
      </div>
    </div>
  );
};
