export interface Task {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  skill: string;
  description?: string;
}

export interface Message {
  id?: number;
  role: 'user' | 'model';
  content: string;
  canvas_content?: string | null;
  canvas_type?: string | null;
  tasks?: Task[] | null;
  skill_used?: string | null;
  delegations?: {
    target_session_name: string;
    task_description: string;
    status: 'pending' | 'approved' | 'executing' | 'completed';
  }[] | null;
  dependencies?: {
    source_task_id: string;
    target_task_id: string;
  }[] | null;
  created_at?: string;
}

export interface Connection {
  id: string;
  source_id: string;
  target_id: string;
  type: string;
}

export interface Session {
  id: string;
  name: string;
  category?: string;
  x: number;
  y: number;
  color: string;
  is_minimized: boolean;
  created_at: string;
  agentType?: 'coordinator' | 'manager' | 'tool' | null;
}

export interface Group {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

export interface Note {
  id: string;
  content: string;
  x: number;
  y: number;
  color: string;
  created_at: string;
}

export interface SystemLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success';
  source: string;
  message: string;
}

export interface CanvasState {
  content: string;
  type: string;
  title: string;
  isOpen: boolean;
}
