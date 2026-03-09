import React from 'react';
import { ShieldCheck, GitPullRequest, UserPlus, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface OrchestrationPanelProps {
  delegations: {
    target_session_name: string;
    task_description: string;
    status: 'pending' | 'approved' | 'executing' | 'completed';
  }[];
  onApprove: (index: number) => void;
}

export const OrchestrationPanel: React.FC<OrchestrationPanelProps> = ({ delegations, onApprove }) => {
  return (
    <div className="mt-4 space-y-3">
      <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 rounded-lg w-fit">
        <ShieldCheck size={12} className="text-emerald-400" />
        <span className="text-[10px] font-bold text-white uppercase tracking-widest">Orchestration Layer</span>
      </div>

      <div className="space-y-2">
        {delegations.map((del, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="p-3 bg-white border border-zinc-200 rounded-xl shadow-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-emerald-100 rounded-md">
                  <UserPlus size={12} className="text-emerald-700" />
                </div>
                <span className="text-[10px] font-bold text-zinc-800 uppercase tracking-wider">
                  Delegate to: {del.target_session_name}
                </span>
              </div>
              <div className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-tighter ${
                del.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
              }`}>
                {del.status}
              </div>
            </div>

            <p className="text-[11px] text-zinc-500 mb-3 leading-relaxed">
              {del.task_description}
            </p>

            {del.status === 'pending' && (
              <button
                onClick={() => onApprove(idx)}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
              >
                Approve Delegation <ArrowRight size={12} />
              </button>
            )}
            
            {del.status === 'approved' && (
              <div className="flex items-center gap-2 text-emerald-600 text-[10px] font-bold uppercase tracking-widest">
                <CheckCircle2 size={12} /> Confirmed & Initializing...
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Three-Layer Confirmation Status */}
      <div className="grid grid-cols-3 gap-1 pt-2">
        <div className="flex flex-col items-center gap-1">
          <div className="w-full h-1 bg-emerald-500 rounded-full" />
          <span className="text-[8px] font-bold text-emerald-600 uppercase">L1: Planning</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className={`w-full h-1 rounded-full ${delegations.some(d => d.status !== 'pending') ? 'bg-emerald-500' : 'bg-zinc-200'}`} />
          <span className="text-[8px] font-bold text-zinc-400 uppercase">L2: Delegation</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="w-full h-1 bg-zinc-200 rounded-full" />
          <span className="text-[8px] font-bold text-zinc-400 uppercase">L3: Execution</span>
        </div>
      </div>
    </div>
  );
};
