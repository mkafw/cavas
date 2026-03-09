import React from 'react';
import { motion } from 'motion/react';

interface ConnectionLineProps {
  id?: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  type?: string;
  onDelete?: (id: string) => void;
}

export const ConnectionLine: React.FC<ConnectionLineProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  type = 'dependency',
  onDelete
}) => {
  if (isNaN(sourceX) || isNaN(sourceY) || isNaN(targetX) || isNaN(targetY)) {
    return null;
  }

  // Offset to ports (Node width 400, height variable, ports at middle)
  // Source connects from its RIGHT port (+400)
  const sX = sourceX + 400;
  const sY = sourceY + 28; // Header center
  // Target connects to its LEFT port (+0)
  const tX = targetX;
  const tY = targetY + 28; // Header center

  // Calculate control points for a curved path (horizontal flow)
  const dx = Math.abs(tX - sX);
  const cp1x = sX + Math.max(dx * 0.4, 50);
  const cp1y = sY;
  const cp2x = tX - Math.max(dx * 0.4, 50);
  const cp2y = tY;

  const path = `M ${sX} ${sY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${tX} ${tY}`;

  // Calculate midpoint of the cubic bezier curve (t=0.5)
  const midX = 0.125 * sX + 0.375 * cp1x + 0.375 * cp2x + 0.125 * tX;
  const midY = 0.125 * sY + 0.375 * cp1y + 0.375 * cp2y + 0.125 * tY;

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none z-0">
      <svg className="absolute inset-0 w-full h-full overflow-visible">
        <defs>
          <marker
            id="arrowhead"
            markerWidth="8"
            markerHeight="8"
            refX="8"
            refY="4"
            orient="auto"
          >
            <path d="M0,0 L8,4 L0,8 Z" fill="#64748b" />
          </marker>
        </defs>
        
        {/* Invisible thicker path for easier clicking */}
        {id && onDelete && type !== 'ghost' && (
          <path
            d={path}
            stroke="transparent"
            strokeWidth="20"
            fill="none"
            className="pointer-events-auto cursor-pointer peer"
            onClick={() => onDelete(id)}
            title="Click to delete connection"
          />
        )}

        <motion.path
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: type === 'ghost' ? 0.6 : 0.4 }}
          d={path}
          stroke={type === 'ghost' ? '#f59e0b' : '#64748b'}
          strokeWidth="3"
          fill="none"
          markerEnd={type === 'ghost' ? '' : 'url(#arrowhead)'}
          strokeDasharray={type === 'ghost' ? '5,5' : (type === 'dependency' ? '0' : '5,5')}
          className={id && onDelete && type !== 'ghost' ? "pointer-events-auto cursor-pointer peer-hover:stroke-red-500 hover:stroke-red-500 transition-colors" : ""}
          onClick={() => {
            if (id && onDelete && type !== 'ghost') onDelete(id);
          }}
        />
      </svg>
      {id && onDelete && type !== 'ghost' && (
        <div 
          className="absolute w-6 h-6 bg-white border border-zinc-200 rounded-full flex items-center justify-center text-zinc-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 cursor-pointer pointer-events-auto shadow-sm transition-all transform -translate-x-1/2 -translate-y-1/2 z-10 opacity-0 hover:opacity-100 peer-hover:opacity-100"
          style={{ left: midX, top: midY }}
          onClick={() => onDelete(id)}
          title="Delete connection"
        >
          <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </div>
      )}
    </div>
  );
};
