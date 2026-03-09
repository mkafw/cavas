/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from "react";
import {
  Grid,
  ZoomIn,
  ZoomOut,
  MousePointer2,
  Share2,
  StickyNote,
  Sparkles,
  Loader2,
  Wand2,
} from "lucide-react";
import { SessionNode } from "./components/SessionNode";
import { Sidebar } from "./components/Sidebar";
import { GlobalCanvas } from "./components/GlobalCanvas";
import { ConnectionLine } from "./components/ConnectionLine";
import { CommandMenu } from "./components/CommandMenu";
import { MiniMap } from "./components/MiniMap";
import { NoteNode } from "./components/NoteNode";
import { Message, Session, Connection, Note, SystemLog, Group } from "./types";
import { motion, AnimatePresence } from "motion/react";
import { GoogleGenAI } from "@google/genai";
import { LogPanel } from "./components/LogPanel";
import { ContextMenu } from "./components/ContextMenu";
import { GroupNode } from "./components/GroupNode";
import { rustCore } from "./services/rustBridge";

export default function App() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [sessionMessages, setSessionMessages] = useState<
    Record<string, Message[]>
  >({});
  const [loadingSessions, setLoadingSessions] = useState<
    Record<string, boolean>
  >({});
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const sessionsRef = useRef<Session[]>([]);
  const [zoom, setZoom] = useState(1);
  const [isGlobalCanvasOpen, setIsGlobalCanvasOpen] = useState(false);
  const [isCommandMenuOpen, setIsCommandMenuOpen] = useState(false);
  const [linkingSourceId, setLinkingSourceId] = useState<string | null>(null);
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [isOrganizing, setIsOrganizing] = useState(false);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [isLogPanelOpen, setIsLogPanelOpen] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [contextMenu, setContextMenu] = useState({ isOpen: false, x: 0, y: 0, canvasX: 0, canvasY: 0 });

  const triggerHook = (hookName: string, source: string, details: string) => {
    const newLog: SystemLog = {
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toISOString(),
      level: 'info',
      source: `Hook:${hookName}`,
      message: `[${source}] ${details}`
    };
    setLogs(prev => [...prev, newLog]);
  };

  useEffect(() => {
    sessionsRef.current = sessions;
  }, [sessions]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isPanning) {
        setCanvasOffset((prev) => ({
          x: prev.x + (e.movementX || 0),
          y: prev.y + (e.movementY || 0),
        }));
        return;
      }

      if (linkingSourceId) {
        // Get canvas container rect to calculate relative position
        const canvas = document.querySelector(".canvas-container");
        if (canvas) {
          const rect = canvas.getBoundingClientRect();
          setMousePos({
            x: (e.clientX - rect.left - canvasOffset.x) / zoom,
            y: (e.clientY - rect.top - canvasOffset.y) / zoom,
          });
        }
      }
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [linkingSourceId, zoom, isPanning, canvasOffset]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Global shortcuts
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsCommandMenuOpen(true);
      }

      if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        setIsCommandMenuOpen(true);
      }

      // Direct shortcuts
      if ((e.metaKey || e.ctrlKey) && e.key === "n") {
        e.preventDefault();
        handleNewSession();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "l") {
        e.preventDefault();
        autoLayout();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "v") {
        e.preventDefault();
        setIsGlobalCanvasOpen((prev) => !prev);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "0") {
        e.preventDefault();
        setZoom(1);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "Backspace") {
        e.preventDefault();
        if (activeSessionId) {
          setSessionMessages((prev) => ({ ...prev, [activeSessionId]: [] }));
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key >= "1" && e.key <= "9") {
        const idx = parseInt(e.key) - 1;
        if (sessionsRef.current[idx]) {
          e.preventDefault();
          setActiveSessionId(sessionsRef.current[idx].id);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const fetchGroups = async () => {
    try {
      const res = await fetch("/api/groups");
      const data = await res.json();
      setGroups(data);
    } catch (err) {
      console.error("Failed to fetch groups", err);
    }
  };

  useEffect(() => {
    fetchSessions();
    fetchConnections();
    fetchNotes();
    fetchGroups();
  }, []);

  const fetchNotes = async () => {
    try {
      const res = await fetch("/api/notes");
      const data = await res.json();
      setNotes(data);
    } catch (err) {
      console.error("Failed to fetch notes", err);
    }
  };

  const handleNavigate = (x: number, y: number) => {
    // Zoom to node and center it
    setZoom(0.8);
    setCanvasOffset({
      x: -x * 0.8 + window.innerWidth / 2 - 200,
      y: -y * 0.8 + window.innerHeight / 2 - 300,
    });
  };

  const fetchSessions = async () => {
    try {
      const res = await fetch("/api/sessions");
      const data = await res.json();
      setSessions(data);

      for (const session of data) {
        fetchMessages(session.id);
      }
    } catch (err) {
      console.error("Failed to fetch sessions", err);
    }
  };

  const fetchConnections = async () => {
    try {
      const res = await fetch("/api/connections");
      const data = await res.json();
      setConnections(data);
    } catch (err) {
      console.error("Failed to fetch connections", err);
    }
  };

  const handleStartLinking = (id: string) => {
    if (linkingSourceId === id) {
      setLinkingSourceId(null);
      return;
    }

    if (linkingSourceId) {
      // Create connection
      handleCreateConnection(linkingSourceId, id);
      setLinkingSourceId(null);
    } else {
      setLinkingSourceId(id);
    }
  };

  const handleCreateConnection = async (
    source_id: string,
    target_id: string,
  ) => {
    if (source_id === target_id) return;

    // Check if exists
    if (
      connections.some(
        (c) => c.source_id === source_id && c.target_id === target_id,
      )
    )
      return;

    const id = Math.random().toString(36).substring(7);
    const newConn: Connection = {
      id,
      source_id,
      target_id,
      type: "dependency",
    };

    setConnections((prev) => [...prev, newConn]);

    try {
      await fetch("/api/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newConn),
      });
    } catch (err) {
      console.error("Failed to create connection", err);
    }
  };

  const handleApproveDelegation = async (
    sessionId: string,
    delegation: any,
  ) => {
    // 1. Create new session for sub-agent
    const subId = Math.random().toString(36).substring(7);
    const name = delegation.target_session_name;
    const parentSession = sessions.find((s) => s.id === sessionId);

    // Position sub-agent near parent
    const x = (parentSession?.x || 0) + 450;
    const y = parentSession?.y || 0;

    try {
      await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: subId, name, x, y }),
      });

      // 2. Create connection
      await handleCreateConnection(sessionId, subId);

      // 3. Send initial prompt to sub-agent
      await handleSendMessage(
        subId,
        `SYSTEM: You have been delegated a task by the Orchestrator.\n\nTASK: ${delegation.task_description}\n\nPlease execute this task and report back.`,
      );

      setActiveSessionId(subId);
      await fetchSessions();
      await fetchConnections();
    } catch (err) {
      console.error("Delegation failed", err);
    }
  };

  const fetchMessages = async (id: string) => {
    try {
      const res = await fetch(`/api/sessions/${id}/messages`);
      const data = await res.json();
      setSessionMessages((prev) => ({ ...prev, [id]: data }));
    } catch (err) {
      console.error("Failed to fetch messages", err);
    }
  };

  const handleNewSession = async () => {
    handleNewAgent('tool');
  };

  const handleNewAgent = async (type: 'coordinator' | 'manager' | 'tool', x?: number, y?: number) => {
    const id = Math.random().toString(36).substring(7);
    const color = type === 'coordinator' ? '#f3e8ff' : type === 'tool' ? '#dcfce7' : '#ffffff';
    const name = type === 'coordinator' ? 'Main Agent' : type === 'tool' ? 'Tool Agent' : 'New Agent';
    
    const spawnX = x !== undefined ? x : -canvasOffset.x / zoom + window.innerWidth / 2 / zoom - 200;
    const spawnY = y !== undefined ? y : -canvasOffset.y / zoom + window.innerHeight / 2 / zoom - 300;

    const newSession: Session = {
      id,
      name,
      x: spawnX,
      y: spawnY,
      color,
      is_minimized: false,
      created_at: new Date().toISOString(),
      agentType: type
    };

    setSessions((prev) => [...prev, newSession]);
    setActiveSessionId(id);

    try {
      await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSession),
      });
    } catch (err) {
      console.error("Failed to create session", err);
    }
  };

  const handleNewGroup = async (x: number, y: number) => {
    const id = Math.random().toString(36).substring(7);
    const newGroup: Group = {
      id,
      name: 'New Group',
      x,
      y,
      width: 600,
      height: 400,
      color: '#3b82f6' // blue-500
    };
    setGroups(prev => [...prev, newGroup]);
    try {
      await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newGroup),
      });
    } catch (err) {
      console.error("Failed to create group", err);
    }
  };

  const handleUpdateGroup = async (id: string, updates: Partial<Group>) => {
    setGroups(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g));
    try {
      await fetch(`/api/groups/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
    } catch (err) {
      console.error("Failed to update group", err);
    }
  };

  const handleDeleteGroup = async (id: string) => {
    setGroups(prev => prev.filter(g => g.id !== id));
    try {
      await fetch(`/api/groups/${id}`, { method: "DELETE" });
    } catch (err) {
      console.error("Failed to delete group", err);
    }
  };

  const handleContextMenuAction = (action: string) => {
    const { canvasX, canvasY } = contextMenu;
    if (action === 'coordinator') {
      handleNewAgent('coordinator', canvasX, canvasY);
    } else if (action === 'tool') {
      handleNewAgent('tool', canvasX, canvasY);
    } else if (action === 'group') {
      handleNewGroup(canvasX, canvasY);
    } else if (action === 'note') {
      handleAddNoteAt(canvasX, canvasY);
    }
    setContextMenu({ ...contextMenu, isOpen: false });
  };

  const handleDeleteConnection = async (id: string) => {
    setConnections(prev => prev.filter(c => c.id !== id));
    try {
      await fetch(`/api/connections/${id}`, { method: "DELETE" });
    } catch (err) {
      console.error("Failed to delete connection", err);
    }
  };

  const handleUpdateLayout = async (id: string, layout: Partial<Session>) => {
    const session = sessions.find((s) => s.id === id);
    if (!session) return;

    const updated = { ...session, ...layout };
    setSessions((prev) => prev.map((s) => (s.id === id ? updated : s)));

    try {
      await fetch(`/api/sessions/${id}/layout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
    } catch (err) {
      console.error("Failed to update layout", err);
    }
  };

  const getAgentRole = (sessionId: string): 'coordinator' | 'manager' | 'tool' => {
    const session = sessions.find(s => s.id === sessionId);
    if (session?.agentType) return session.agentType;

    const hasParents = connections.some(c => c.target_id === sessionId);
    const hasChildren = connections.some(c => c.source_id === sessionId);

    if (!hasParents) return 'coordinator';
    if (hasParents && hasChildren) return 'manager';
    return 'tool';
  };

  const handleSendMessage = async (sessionId: string, content: string) => {
    const role = getAgentRole(sessionId);
    triggerHook('pre_task_execution', sessionId, `Agent (${role}) starting task.`);
    const userMsg: Message = { role: "user", content };
    setSessionMessages((prev) => ({
      ...prev,
      [sessionId]: [...(prev[sessionId] || []), userMsg],
    }));
    setLoadingSessions((prev) => ({ ...prev, [sessionId]: true }));

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          message: content,
          history: sessionMessages[sessionId] || [],
          agentRole: role,
        }),
      });
      const data = await res.json();

      const modelMsg: Message = {
        role: "model",
        content: data.text,
        canvas_content: data.canvas?.content,
        canvas_type: data.canvas?.type,
        tasks: data.tasks,
        skill_used: data.skill_used,
        created_at: new Date().toISOString(),
      };

      setSessionMessages((prev) => ({
        ...prev,
        [sessionId]: [...(prev[sessionId] || []), modelMsg],
      }));

      triggerHook('post_task_execution', sessionId, `Agent (${role}) completed task.`);

      if (data.canvas) {
        setIsGlobalCanvasOpen(true);
      }
    } catch (err) {
      console.error("Chat failed", err);
      triggerHook('error', sessionId, `Task execution failed.`);
    } finally {
      setLoadingSessions((prev) => ({ ...prev, [sessionId]: false }));
    }
  };

  const handleDeleteSession = async (id: string) => {
    if (!confirm("Are you sure you want to delete this session?")) return;

    setSessions((prev) => prev.filter((s) => s.id !== id));
    setConnections((prev) =>
      prev.filter((c) => c.source_id !== id && c.target_id !== id),
    );
    if (activeSessionId === id) setActiveSessionId(null);

    try {
      await fetch(`/api/sessions/${id}`, { method: "DELETE" });
    } catch (err) {
      console.error("Failed to delete session", err);
    }
  };

  const handleAddNoteAt = async (x: number, y: number) => {
    const newNote: Note = {
      id: Math.random().toString(36).substring(7),
      content: "",
      x,
      y,
      color: "#fef08a",
      created_at: new Date().toISOString(),
    };
    setNotes((prev) => [...prev, newNote]);
    try {
      await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newNote),
      });
    } catch (err) {
      console.error("Failed to create note", err);
    }
  };

  const handleAddNote = async () => {
    const x = -canvasOffset.x / zoom + window.innerWidth / 2 / zoom - 128;
    const y = -canvasOffset.y / zoom + window.innerHeight / 2 / zoom - 128;
    handleAddNoteAt(x, y);
  };

  const handleUpdateNote = async (id: string, updates: Partial<Note>) => {
    const note = notes.find((n) => n.id === id);
    if (!note) return;
    const updated = { ...note, ...updates };
    setNotes((prev) => prev.map((n) => (n.id === id ? updated : n)));
    try {
      await fetch(`/api/notes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
    } catch (err) {
      console.error("Failed to update note", err);
    }
  };

  const handleDeleteNote = async (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    try {
      await fetch(`/api/notes/${id}`, { method: "DELETE" });
    } catch (err) {
      console.error("Failed to delete note", err);
    }
  };

  const handleAutoOrganize = async () => {
    if (sessions.length === 0 && notes.length === 0) return;

    setIsOrganizing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

      const prompt = `You are an expert spatial organizer for an infinite canvas application.
      I have the following items on my canvas:
      Sessions (Agents): ${JSON.stringify(sessions.map((s) => ({ id: s.id, name: s.name, category: s.category })))}
      Notes (Sticky Notes): ${JSON.stringify(notes.map((n) => ({ id: n.id, content: n.content.substring(0, 100) })))}
      
      Your task is to organize them logically.
      1. Group related items together.
      2. Assign a pastel color (hex code) to each group. Valid colors: #fef08a, #fbcfe8, #bfdbfe, #bbf7d0, #e9d5ff, #ffffff.
      3. Assign (x, y) coordinates. Items in the same group should be close (e.g., 400px spacing). Different groups should be separated by at least 1000px.
      
      Return ONLY a JSON object with this exact schema:
      {
        "sessions": [{ "id": "string", "x": number, "y": number, "color": "string" }],
        "notes": [{ "id": "string", "x": number, "y": number, "color": "string" }]
      }`;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
        config: { responseMimeType: "application/json" },
      });

      const result = JSON.parse(response.text || "{}");

      // Apply updates
      if (result.sessions) {
        result.sessions.forEach((s: any) =>
          handleUpdateLayout(s.id, { x: s.x, y: s.y, color: s.color }),
        );
      }
      if (result.notes) {
        result.notes.forEach((n: any) =>
          handleUpdateNote(n.id, { x: n.x, y: n.y, color: n.color }),
        );
      }

      // Center canvas
      setZoom(0.5);
      setCanvasOffset({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
    } catch (err) {
      console.error("Auto-organize failed", err);
      // Fallback to basic layout
      autoLayout();
    } finally {
      setIsOrganizing(false);
    }
  };

  const autoLayout = async () => {
    console.log("🦀 Running Rust-powered Auto Layout...");
    
    // Use the Rust Core (simulated in this environment) to calculate layout
    const updatedNodes = rustCore.calculate_auto_layout(
      sessions.map(s => ({ id: s.id, x: s.x, y: s.y, width: 320, height: 400 })),
      connections.map(c => ({ source_id: c.source_id, target_id: c.target_id }))
    );

    // Apply the layout updates
    setSessions((prev) =>
      prev.map((s) => {
        const update = updatedNodes.find((u) => u.id === s.id);
        return update ? { ...s, x: update.x, y: update.y } : s;
      })
    );

    // Persist to backend
    try {
      await Promise.all(
        updatedNodes.map(node => 
          fetch(`/api/sessions/${node.id}/layout`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ x: node.x, y: node.y }),
          })
        )
      );
    } catch (err) {
      console.error("Failed to persist auto-layout", err);
    }

    triggerHook('on_layout_updated', 'system', 'Auto-layout completed using Rust Core');
  };

  const activeMessages = activeSessionId
    ? sessionMessages[activeSessionId] || []
    : [];
  const latestActiveCanvas =
    [...activeMessages].reverse().find((m) => m.canvas_content) || null;

  const getParentAgents = (sessionId: string) => {
    return connections
      .filter(c => c.target_id === sessionId)
      .map(c => {
        const parent = sessions.find(s => s.id === c.source_id);
        return parent ? { id: parent.id, name: parent.name } : null;
      })
      .filter((p): p is { id: string; name: string } => p !== null);
  };

  const handleReportBack = async (childId: string, parentId: string, content: string) => {
    const child = sessions.find(s => s.id === childId);
    triggerHook('on_report_received', parentId, `Received report from ${child?.name || 'Unknown'}`);
    const reportMessage = `[Task Report from Sub-Agent: ${child?.name || 'Unknown'}]\n\n${content}`;
    await handleSendMessage(parentId, reportMessage);
    setActiveSessionId(parentId);
    const parentSession = sessions.find(s => s.id === parentId);
    if (parentSession) {
      handleNavigate(parentSession.x, parentSession.y);
    }
  };

  const handleRetrospective = async (coordinatorId: string) => {
    triggerHook('on_retrospective_start', coordinatorId, 'Initiating project retrospective');
    const prompt = `[HOOK: SYSTEM_RETROSPECTIVE]\nAs the Coordinator, please conduct a comprehensive retrospective (复盘) of the entire project so far. Based on the reports received from Manager agents and the overall progress, generate a formal Retrospective Document including:\n1. Overall Project Outcomes (项目成果)\n2. Workflow & Management Efficiency (协作效率)\n3. Bottlenecks & Issues Encountered (瓶颈与问题)\n4. Actionable Improvements for future iterations (改进建议)\n\nPlease format this as a structured report.`;
    await handleSendMessage(coordinatorId, prompt);
  };

  return (
    <div className="flex h-screen w-screen bg-zinc-50 overflow-hidden font-sans">
      <CommandMenu
        isOpen={isCommandMenuOpen}
        onClose={() => setIsCommandMenuOpen(false)}
        onNewSession={handleNewSession}
        onAutoLayout={autoLayout}
        onResetZoom={() => setZoom(1)}
        onClearMessages={() => {
          if (activeSessionId) {
            setSessionMessages((prev) => ({ ...prev, [activeSessionId]: [] }));
          }
        }}
        onSwitchSession={(idx) => {
          if (sessions[idx]) {
            setActiveSessionId(sessions[idx].id);
            handleNavigate(sessions[idx].x, sessions[idx].y);
          }
        }}
        onToggleCanvas={() => setIsGlobalCanvasOpen((prev) => !prev)}
        sessions={sessions}
      />

      <MiniMap
        sessions={sessions}
        notes={notes}
        zoom={zoom}
        activeSessionId={activeSessionId}
        onNavigate={handleNavigate}
      />

      {/* 1. Sidebar (Now contains the Chat Dialog) */}
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={(id) => {
          setActiveSessionId(id);
          const hasCanvas = sessionMessages[id]?.some((m) => m.canvas_content);
          if (hasCanvas) setIsGlobalCanvasOpen(true);
        }}
        onNewSession={handleNewSession}
        onAutoLayout={autoLayout}
        messages={activeMessages}
        isLoading={
          activeSessionId ? loadingSessions[activeSessionId] || false : false
        }
        onSendMessage={handleSendMessage}
        onApproveDelegation={(idx, del) => {
          if (activeSessionId) handleApproveDelegation(activeSessionId, del);
        }}
        onOpenCommandMenu={() => setIsCommandMenuOpen(true)}
        parentAgents={activeSessionId ? getParentAgents(activeSessionId) : []}
        onReportBack={handleReportBack}
      />

      {/* 2. Main Infinite Canvas */}
      <main
        className={`flex-1 relative overflow-hidden canvas-container ${isPanning ? "cursor-grabbing" : "cursor-default"}`}
        onPointerDown={(e) => {
          if (
            e.button === 0 &&
            (e.target as HTMLElement).classList.contains("canvas-container")
          ) {
            setIsPanning(true);
          }
        }}
        onPointerUp={() => setIsPanning(false)}
        onPointerLeave={() => setIsPanning(false)}
        onContextMenu={(e) => {
          e.preventDefault();
          const canvas = document.querySelector(".canvas-container");
          if (canvas) {
            const rect = canvas.getBoundingClientRect();
            const canvasX = (e.clientX - rect.left - canvasOffset.x) / zoom;
            const canvasY = (e.clientY - rect.top - canvasOffset.y) / zoom;
            setContextMenu({
              isOpen: true,
              x: e.clientX,
              y: e.clientY,
              canvasX,
              canvasY
            });
          }
        }}
      >
        {/* Grid Background */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: "radial-gradient(#000 1px, transparent 1px)",
            backgroundSize: "20px 20px",
            transform: `scale(${zoom})`,
          }}
        />

        {/* Floating Controls */}
        <div className="absolute bottom-6 left-6 z-[100] flex items-center gap-2 p-1 bg-white border border-zinc-200 rounded-xl shadow-lg">
          <button
            onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
            className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-500"
          >
            <ZoomOut size={16} />
          </button>
          <span className="text-[10px] font-bold text-zinc-400 w-10 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.min(2, z + 0.1))}
            className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-500"
          >
            <ZoomIn size={16} />
          </button>
          <div className="w-px h-4 bg-zinc-200 mx-1" />
          <button
            onClick={handleAddNote}
            className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-500"
            title="Add Sticky Note"
          >
            <StickyNote size={16} />
          </button>
          <button
            onClick={autoLayout}
            className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-500 flex items-center gap-2"
            title="Auto Layout (DAG)"
          >
            <Wand2 size={16} />
          </button>
          <button
            onClick={handleAutoOrganize}
            disabled={isOrganizing}
            className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-500 disabled:opacity-50 flex items-center gap-2"
            title="AI Auto Organize"
          >
            {isOrganizing ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Sparkles size={16} />
            )}
          </button>
        </div>

        {/* Canvas Area */}
        <motion.div
          className="w-full h-full relative"
          animate={{
            scale: zoom,
            x: canvasOffset.x,
            y: canvasOffset.y,
          }}
          transition={{ type: "spring", damping: 25, stiffness: 120 }}
        >
          {/* Groups Layer (Bottom) */}
          {groups.map((group) => (
            <GroupNode
              key={group.id}
              group={group}
              zoom={zoom}
              onUpdate={handleUpdateGroup}
              onDelete={handleDeleteGroup}
            />
          ))}

          {/* Connections Layer */}
          {connections.map((conn) => {
            const source = sessions.find((s) => s.id === conn.source_id);
            const target = sessions.find((s) => s.id === conn.target_id);
            if (!source || !target) return null;
            return (
              <ConnectionLine
                key={conn.id}
                id={conn.id}
                sourceX={source.x}
                sourceY={source.y}
                targetX={target.x}
                targetY={target.y}
                type={conn.type}
                onDelete={handleDeleteConnection}
              />
            );
          })}

          {/* Ghost Line (Connecting) */}
          {linkingSourceId && (
            <ConnectionLine
              sourceX={sessions.find((s) => s.id === linkingSourceId)?.x || 0}
              sourceY={sessions.find((s) => s.id === linkingSourceId)?.y || 0}
              targetX={mousePos.x - 400}
              targetY={mousePos.y - 28}
              type="ghost"
            />
          )}

          {sessions.map((session) => (
            <SessionNode
              key={session.id}
              session={session}
              messages={sessionMessages[session.id] || []}
              isLoading={loadingSessions[session.id] || false}
              onSendMessage={handleSendMessage}
              onUpdateLayout={handleUpdateLayout}
              onClose={handleDeleteSession}
              isActive={activeSessionId === session.id}
              onActivate={setActiveSessionId}
              onStartLinking={handleStartLinking}
              isLinkingSource={linkingSourceId === session.id}
              parentAgents={getParentAgents(session.id)}
              onReportBack={handleReportBack}
              agentRole={getAgentRole(session.id)}
              onRetrospective={handleRetrospective}
            />
          ))}

          {/* Notes */}
          {notes.map((note) => (
            <NoteNode
              key={note.id}
              note={note}
              onUpdate={handleUpdateNote}
              onDelete={handleDeleteNote}
            />
          ))}

          {sessions.length === 0 && notes.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-300 pointer-events-none">
              <MousePointer2 size={48} className="mb-4 opacity-20" />
              <p className="text-sm font-medium">
                Create a session from the sidebar to start
              </p>
            </div>
          )}
        </motion.div>
      </main>

      {/* 3. Global Artifact Viewer (Right Sidebar) */}
      <AnimatePresence>
        {isGlobalCanvasOpen && (
          <GlobalCanvas
            activeMessage={latestActiveCanvas}
            isOpen={isGlobalCanvasOpen}
            onClose={() => setIsGlobalCanvasOpen(false)}
          />
        )}
      </AnimatePresence>
      <LogPanel 
        logs={logs} 
        isOpen={isLogPanelOpen} 
        onClose={() => setIsLogPanelOpen(false)} 
      />
      <ContextMenu
        x={contextMenu.x}
        y={contextMenu.y}
        isOpen={contextMenu.isOpen}
        onClose={() => setContextMenu({ ...contextMenu, isOpen: false })}
        onAction={handleContextMenuAction}
      />
    </div>
  );
}
