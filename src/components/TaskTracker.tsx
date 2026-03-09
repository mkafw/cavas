import React from 'react';
import { CheckCircle2, Circle, PlayCircle, Settings, Zap, Code, FileText, BarChart3, ListTodo } from 'lucide-react';
import { Task } from '../types';
import { motion } from 'motion/react';

interface TaskTrackerProps {
  tasks: Task[];
  skillUsed?: string;
}

const SkillIcon = ({ skill, size = 16 }: { skill: string; size?: number }) => {
  switch (skill.toLowerCase()) {
    case 'coding': return <Code size={size} />;
    case 'writing': return <FileText size={size} />;
    case 'analysis': return <BarChart3 size={size} />;
    case 'planning': return <ListTodo size={size} />;
    default: return <Zap size={size} />;
  }
};

export const TaskTracker: React.FC<TaskTrackerProps> = ({ tasks, skillUsed }) => {
  if (!tasks || tasks.length === 0) return null;

  return (
    <div className="mt-4 p-4 bg-white rounded-xl border border-zinc-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
            {skillUsed ? <SkillIcon skill={skillUsed} /> : <Settings size={16} />}
          </div>
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
            Atomic Task Execution
          </span>
        </div>
        <span className="text-[10px] bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded-full font-medium">
          {tasks.filter(t => t.status === 'completed').length}/{tasks.length} Done
        </span>
      </div>

      <div className="space-y-3">
        {tasks.map((task, idx) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="flex items-start gap-3 group"
          >
            <div className="mt-0.5">
              {task.status === 'completed' ? (
                <CheckCircle2 size={16} className="text-emerald-500" />
              ) : task.status === 'running' ? (
                <PlayCircle size={16} className="text-blue-500 animate-pulse" />
              ) : (
                <Circle size={16} className="text-zinc-300" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className={`text-sm font-medium ${task.status === 'completed' ? 'text-zinc-500 line-through' : 'text-zinc-800'}`}>
                  {task.name}
                </h4>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                   <SkillIcon skill={task.skill} size={12} />
                </div>
              </div>
              {task.description && (
                <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                  {task.description}
                </p>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
