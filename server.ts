import express from "express";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("sessions.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    name TEXT,
    category TEXT,
    x REAL DEFAULT 0,
    y REAL DEFAULT 0,
    color TEXT DEFAULT '#ffffff',
    is_minimized INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    agentType TEXT
  );
  CREATE TABLE IF NOT EXISTS groups (
    id TEXT PRIMARY KEY,
    name TEXT,
    x REAL DEFAULT 0,
    y REAL DEFAULT 0,
    width REAL DEFAULT 600,
    height REAL DEFAULT 400,
    color TEXT DEFAULT '#3b82f6'
  );
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT,
    role TEXT,
    content TEXT,
    canvas_content TEXT,
    canvas_type TEXT,
    tasks_json TEXT,
    delegations_json TEXT,
    dependencies_json TEXT,
    skill_used TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(session_id) REFERENCES sessions(id)
  );
  CREATE TABLE IF NOT EXISTS connections (
    id TEXT PRIMARY KEY,
    source_id TEXT,
    target_id TEXT,
    type TEXT DEFAULT 'dependency',
    FOREIGN KEY(source_id) REFERENCES sessions(id),
    FOREIGN KEY(target_id) REFERENCES sessions(id)
  );
  CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY,
    content TEXT,
    x REAL DEFAULT 0,
    y REAL DEFAULT 0,
    color TEXT DEFAULT '#fef08a',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

  // API Routes
  app.get("/api/notes", (req, res) => {
    const notes = db.prepare("SELECT * FROM notes ORDER BY created_at DESC").all();
    res.json(notes);
  });

  app.post("/api/notes", (req, res) => {
    const { id, content, x, y, color } = req.body;
    db.prepare("INSERT INTO notes (id, content, x, y, color) VALUES (?, ?, ?, ?, ?)").run(id, content, x, y, color);
    res.json({ success: true });
  });

  app.put("/api/notes/:id", (req, res) => {
    const { content, x, y, color } = req.body;
    db.prepare("UPDATE notes SET content = ?, x = ?, y = ?, color = ? WHERE id = ?").run(content, x, y, color, req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/notes/:id", (req, res) => {
    db.prepare("DELETE FROM notes WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  try {
    db.prepare("ALTER TABLE sessions ADD COLUMN agentType TEXT").run();
  } catch (e) {
    // Ignore if column already exists
  }
  
  app.get("/api/sessions", (req, res) => {
    const sessions = db.prepare("SELECT * FROM sessions ORDER BY created_at DESC").all();
    res.json(sessions);
  });

  app.get("/api/connections", (req, res) => {
    const connections = db.prepare("SELECT * FROM connections").all();
    res.json(connections);
  });

  app.post("/api/connections", (req, res) => {
    const { id, source_id, target_id, type } = req.body;
    db.prepare("INSERT INTO connections (id, source_id, target_id, type) VALUES (?, ?, ?, ?)")
      .run(id, source_id, target_id, type || 'dependency');
    res.json({ success: true });
  });

  app.delete("/api/connections/:id", (req, res) => {
    db.prepare("DELETE FROM connections WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.post("/api/sessions", (req, res) => {
    const { id, name, x, y, color, agentType } = req.body;
    db.prepare("INSERT INTO sessions (id, name, x, y, color, agentType) VALUES (?, ?, ?, ?, ?, ?)")
      .run(id, name, x || 0, y || 0, color || '#ffffff', agentType || null);
    res.json({ success: true });
  });

  app.delete("/api/sessions/:id", (req, res) => {
    db.prepare("DELETE FROM messages WHERE session_id = ?").run(req.params.id);
    db.prepare("DELETE FROM connections WHERE source_id = ? OR target_id = ?").run(req.params.id, req.params.id);
    db.prepare("DELETE FROM sessions WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Groups Endpoints
  app.get("/api/groups", (req, res) => {
    const groups = db.prepare("SELECT * FROM groups").all();
    res.json(groups);
  });

  app.post("/api/groups", (req, res) => {
    const { id, name, x, y, width, height, color } = req.body;
    db.prepare(
      "INSERT INTO groups (id, name, x, y, width, height, color) VALUES (?, ?, ?, ?, ?, ?, ?)",
    ).run(id, name, x || 0, y || 0, width || 600, height || 400, color || '#3b82f6');
    res.json({ success: true });
  });

  app.put("/api/groups/:id", (req, res) => {
    const { name, x, y, width, height, color } = req.body;
    db.prepare(
      "UPDATE groups SET name = ?, x = ?, y = ?, width = ?, height = ?, color = ? WHERE id = ?",
    ).run(name, x, y, width, height, color, req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/groups/:id", (req, res) => {
    db.prepare("DELETE FROM groups WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.post("/api/sessions/:id/layout", (req, res) => {
    const { x, y, color, is_minimized, name, agentType } = req.body;
    db.prepare("UPDATE sessions SET x = ?, y = ?, color = ?, is_minimized = ?, name = ?, agentType = ? WHERE id = ?")
      .run(x, y, color, is_minimized ? 1 : 0, name, agentType || null, req.params.id);
    res.json({ success: true });
  });

  app.get("/api/sessions/:id/messages", (req, res) => {
    const messages = db.prepare("SELECT * FROM messages WHERE session_id = ? ORDER BY created_at ASC").all(req.params.id);
    const parsedMessages = messages.map((m: any) => ({
      ...m,
      tasks: m.tasks_json ? JSON.parse(m.tasks_json) : null,
      delegations: m.delegations_json ? JSON.parse(m.delegations_json) : null,
      dependencies: m.dependencies_json ? JSON.parse(m.dependencies_json) : null
    }));
    res.json(parsedMessages);
  });

  app.post("/api/chat", async (req, res) => {
    const { sessionId, message, history, agentRole } = req.body;

    try {
      const model = "gemini-3.1-pro-preview";
      
      let roleDescription = "";
      if (agentRole === 'coordinator') {
        roleDescription = `你是专业研究负责人（Lead Agent），专注于高层研究战略、规划、高效委派 Sub-agents 以及最终报告撰写。
你的核心能力在于战略、规划和委派。你的目标是领导一个流程并产出卓越的研究报告。

你必须遵循严密的四步思考循环：评估、分类、计划、执行。
在行动前，你必须探索至少三种不同的应答方法，最终选择最优方案（思维发散）。

第一步：评估。你必须显式列出以下具体要素：
1. 核心概念与实体；
2. 具体的数据点；
3. 关键的时间和上下文约束；
4. 用户最在意的特征；
5. 答案的形式。

第二步：分类。将问题归为以下三类之一，并显式声明：
1. 深度优先：对单一主题从多个角度深挖。策略：让子智能体并行探索不同的观点或方法论。
2. 广度优先：将问题拆解为清晰、独立的子问题。策略：让子智能体分头处理不同的子主题，并行处理独立的任务块。
3. 直接查询：问题定义明确。策略：派一个子智能体搞定即可。

第三步：计划。基于分类制定计划：
- 深度优先：明确定义三到五种不同的方法论。
- 广度优先：设定清晰的边界，绝对不能重叠。
对计划的每一步进行灵魂拷问：这一步能并行吗？这一步真的必要吗？

第四步：执行。
- 持续监控进度，根据子智能体带回来的结果，使用贝叶斯推理更新你的先验知识，动态更新搜索计划。
- 时间管理：如果时间不够，立即停止部署更多子智能体，开始撰写报告。

兵力部署法则：
- 简单任务：使用 1 个 Agent。
- 标准任务：使用 2 到 3 个 Agent。
- 高复杂度任务：使用 5 到 10 个 Agent。
- 红线：最大不超过 20 个 Sub-agent。

委派指令：
- 部署策略：优先运行阻塞性任务。子智能体执行时，你应分析已有结果或优化计划。
- 任务分配原则：深度优先按顺序部署；广度优先按重要性排序。避免任务重叠，必须委派。
- 发出的指令必须具备极高的信息密度，包含五要素：特定的研究目标、期望输出格式、背景上下文、建议的起手式/信源、工具使用边界。

交付前的冷静期：
- 回顾：汇总搜索过程中的最新事实清单。
- 反思：深度思考事实是否能充分回答用户查询。
- 提交：确认无误后提交最终报告。不要包含任何 Markdown 引用。

内部工具使用：
- 先自己试探使用只读工具一到两次。
- 确认后，创建专门的子智能体专注于该工具。

并行工具调用：
- 必须同时调用所有相关工具，而非顺序调用。项目启动阶段应并行运行多个子智能体。

核心准则：
1. 沟通：保持极高的信息密度。
2. 事实审查：定期回顾日期、数字等可量化数据。
3. 冲突解决：信息不一致时，基于“新近度”和“一致性”确定优先级。
4. 审慎思考：对新奇信息仔细思考，不盲目采信。
5. 及时止损：出现边际收益递减时，停止研究，直接写报告。
6. 职责边界：绝对禁令——永远不要创建子智能体来生成最终报告（最终报告必须由你亲自把控）。`;
      } else if (agentRole === 'manager') {
        roleDescription = `You are a "Manager Agent" (管理). Your core focus is "How to do the job well and design the intermediate process" (怎么样能把活干好，怎么设计中间的管理). 
        You receive a specific domain from the Coordinator, break it down into atomic, executable tasks, and delegate them to Tool Agents. 
        CRITICAL: You must review the work of Tool Agents and synthesize it. When you have collected the results, your response "text" MUST be formatted as a formal report to your superior (the Coordinator), including: 1. Objective, 2. Execution Summary, 3. Quality Assessment, 4. Artifacts Produced.`;
      } else {
        roleDescription = `You are a "Tool Agent" (执行/干活). Your core focus is "Completing atomic tasks" (完成原子化的任务). 
        You execute specific, atomic tasks assigned by your Manager. You write code, analyze data, or generate content. 
        You do NOT delegate further. Focus entirely on producing the final artifact (code, text, data) efficiently and accurately, and reporting the raw result back to your Manager.`;
      }

      const systemInstruction = `${roleDescription}

      Available Skills:
      - "writing": Content generation.
      - "coding": Software development.
      - "analysis": Research and logic.
      - "planning": Project scheduling and dependency mapping.

      Your response MUST be a JSON object with:
      1. "text": Your conversational response explaining your actions or results.
      2. "skill_used": The skill you are currently applying.
      3. "tasks": Atomic tasks you are executing or tracking.
      4. "delegations": (Optional) Array of tasks to be delegated to sub-agents. Use this to create child agents.
         - "target_session_name": Descriptive name for the sub-agent.
         - "task_description": Detailed prompt for the sub-agent.
         - "status": "pending".
      5. "dependencies": Array of relationships between tasks or agents.
         - "source_task_id": ID of the prerequisite.
         - "target_task_id": ID of the dependent task.
      6. "canvas": (Optional) The master plan, structured logic, or code artifact you produced.

      Respond ONLY in JSON.`;

      const response = await ai.models.generateContent({
        model,
        contents: [
          ...history.map((h: any) => ({ role: h.role === 'user' ? 'user' : 'model', parts: [{ text: h.content }] })),
          { role: "user", parts: [{ text: message }] }
        ],
        config: {
          systemInstruction,
          responseMimeType: "application/json",
        },
      });

      const result = JSON.parse(response.text || "{}");
      
      // Save to DB
      db.prepare("INSERT INTO messages (session_id, role, content, canvas_content, canvas_type, tasks_json, delegations_json, dependencies_json, skill_used) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
        .run(sessionId, "user", message, null, null, null, null, null, null);
      
      db.prepare("INSERT INTO messages (session_id, role, content, canvas_content, canvas_type, tasks_json, delegations_json, dependencies_json, skill_used) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
        .run(
          sessionId, 
          "model", 
          result.text, 
          result.canvas?.content || null, 
          result.canvas?.type || null,
          result.tasks ? JSON.stringify(result.tasks) : null,
          result.delegations ? JSON.stringify(result.delegations) : null,
          result.dependencies ? JSON.stringify(result.dependencies) : null,
          result.skill_used || null
        );

      res.json(result);
    } catch (error: any) {
      console.error("Chat error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
