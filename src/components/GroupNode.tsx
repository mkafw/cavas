import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Group } from '../types';
import { X } from 'lucide-react';

interface GroupNodeProps {
  group: Group;
  zoom: number;
  onUpdate: (id: string, updates: Partial<Group>) => void;
  onDelete: (id: string) => void;
}

export const GroupNode: React.FC<GroupNodeProps> = ({ group, zoom, onUpdate, onDelete }) => {
  const [isResizing, setIsResizing] = useState(false);

  return (
    <motion.div
      drag={!isResizing}
      dragMomentum={false}
      onDragEnd={(_, info) => {
        if (!isResizing) {
          onUpdate(group.id, { x: group.x + info.offset.x / zoom, y: group.y + info.offset.y / zoom });
        }
      }}
      initial={{ x: group.x, y: group.y }}
      animate={{ x: group.x, y: group.y }}
      className="absolute border-2 border-dashed rounded-2xl z-0 group"
      style={{ 
        width: group.width, 
        height: group.height, 
        borderColor: group.color,
        backgroundColor: `${group.color}1A`
      }}
    >
      <div className="absolute -top-6 left-2 px-2 py-1 bg-white/80 backdrop-blur-sm rounded-md text-xs font-bold text-zinc-600 shadow-sm border border-zinc-200 cursor-text z-10 flex items-center gap-2">
        <input 
          type="text" 
          value={group.name}
          onChange={(e) => onUpdate(group.id, { name: e.target.value })}
          className="bg-transparent outline-none w-full min-w-[100px]"
          onPointerDown={(e) => e.stopPropagation()}
        />
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onDelete(group.id);
          }}
          className="hover:text-red-500 transition-colors p-0.5 rounded-sm hover:bg-red-50"
          title="Delete Group"
        >
          <X size={14} />
        </button>
      </div>
      
      {/* Resize Handle */}
      <div 
        className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize opacity-0 group-hover:opacity-100 transition-opacity z-10"
        onPointerDown={(e) => {
          e.stopPropagation();
          setIsResizing(true);
          const startX = e.clientX;
          const startY = e.clientY;
          const startW = group.width;
          const startH = group.height;
          
          const onMove = (moveEvent: PointerEvent) => {
            const dx = (moveEvent.clientX - startX) / zoom;
            const dy = (moveEvent.clientY - startY) / zoom;
            onUpdate(group.id, { 
              width: Math.max(200, startW + dx), 
              height: Math.max(200, startH + dy) 
            });
          };
          
          const onUp = () => {
            setIsResizing(false);
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
          };
          
          window.addEventListener('pointermove', onMove);
          window.addEventListener('pointerup', onUp);
        }}
      >
        <svg viewBox="0 0 24 24" className="w-full h-full text-zinc-400 p-1">
          <path fill="currentColor" d="M22 22H20V20H22V22ZM22 18H20V16H22V18ZM18 22H16V20H18V22ZM22 14H20V12H22V14ZM14 22H12V20H14V22Z" />
        </svg>
      </div>
    </motion.div>
  );
};
