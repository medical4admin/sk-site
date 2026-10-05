// src/index.ts
import { createServer } from "node:http";

// src/app.ts
import express2 from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import path4 from "path";
import fs4 from "fs";
import { fileURLToPath as fileURLToPath2 } from "node:url";

// src/routes/index.ts
import { Router as Router11 } from "express";

// src/routes/health.ts
import { Router } from "express";
var router = Router();
router.get("/healthz", (_req, res) => {
  res.json({ status: "ok" });
});
var health_default = router;

// src/routes/projects.ts
import { Router as Router2 } from "express";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
var router2 = Router2();
var DATA_DIR = path.join(process.cwd(), "backend_data");
if (!fs.existsSync(DATA_DIR))
  fs.mkdirSync(DATA_DIR, { recursive: true });
function projectPath(id) {
  return path.join(DATA_DIR, `${id}.json`);
}
function listProjects(deviceId3) {
  const files = fs.readdirSync(DATA_DIR);
  return files.filter((f) => f.endsWith(".json")).map((f) => JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), "utf-8"))).filter((p) => p.deviceId === deviceId3);
}
router2.get("/projects", (req, res) => {
  res.json(listProjects(req.deviceId));
});
router2.post("/projects", (req, res) => {
  const id = randomUUID();
  const project = {
    id,
    name: req.body.name || `Project ${id.slice(0, 6)}`,
    files: [],
    deviceId: req.deviceId
  };
  fs.writeFileSync(projectPath(id), JSON.stringify(project, null, 2));
  res.status(201).json(project);
});
router2.get("/projects/:id", (req, res) => {
  const p = projectPath(req.params.id);
  if (!fs.existsSync(p))
    return res.status(404).json({ error: "not found" });
  const data = JSON.parse(fs.readFileSync(p, "utf-8"));
  if (data.deviceId !== req.deviceId)
    return res.status(403).json({ error: "forbidden" });
  res.json(data);
});
router2.put("/projects/:id", (req, res) => {
  const p = projectPath(req.params.id);
  if (!fs.existsSync(p))
    return res.status(404).json({ error: "not found" });
  const data = JSON.parse(fs.readFileSync(p, "utf-8"));
  if (data.deviceId !== req.deviceId)
    return res.status(403).json({ error: "forbidden" });
  const updated = { ...data, ...req.body, id: data.id, deviceId: data.deviceId };
  fs.writeFileSync(p, JSON.stringify(updated, null, 2));
  res.json(updated);
});
router2.delete("/projects/:id", (req, res) => {
  const p = projectPath(req.params.id);
  if (!fs.existsSync(p))
    return res.status(404).json({ error: "not found" });
  const data = JSON.parse(fs.readFileSync(p, "utf-8"));
  if (data.deviceId !== req.deviceId)
    return res.status(403).json({ error: "forbidden" });
  fs.unlinkSync(p);
  res.json({ ok: true });
});
var projects_default = router2;

// src/routes/files.ts
import { Router as Router3 } from "express";
import fs2 from "fs";
import path2 from "path";
var router3 = Router3();
var DATA_DIR2 = path2.join(process.cwd(), "backend_data");
function projectPath2(id) {
  return path2.join(DATA_DIR2, `${id}.json`);
}
function sanitizePath(filePath) {
  if (!filePath)
    return null;
  const normalized = path2.normalize(filePath);
  if (normalized.includes("..") || normalized.includes("\0"))
    return null;
  return normalized;
}
router3.get("/files/:projectId", (req, res) => {
  const p = projectPath2(req.params.projectId);
  if (!fs2.existsSync(p))
    return res.status(404).json({ error: "project not found" });
  const data = JSON.parse(fs2.readFileSync(p, "utf-8"));
  if (data.deviceId !== req.deviceId)
    return res.status(403).json({ error: "forbidden" });
  res.json(data.files || []);
});
router3.get("/files/:projectId/file", (req, res) => {
  const p = projectPath2(req.params.projectId);
  if (!fs2.existsSync(p))
    return res.status(404).json({ error: "project not found" });
  const data = JSON.parse(fs2.readFileSync(p, "utf-8"));
  if (data.deviceId !== req.deviceId)
    return res.status(403).json({ error: "forbidden" });
  const rawPath = String(req.query.path || "");
  const filePath = sanitizePath(rawPath);
  if (!filePath)
    return res.status(400).json({ error: "invalid path" });
  const file = (data.files || []).find((f) => f.path === filePath);
  if (!file)
    return res.status(404).json({ error: "file not found" });
  res.json(file);
});
router3.post("/files/:projectId", (req, res) => {
  const p = projectPath2(req.params.projectId);
  if (!fs2.existsSync(p))
    return res.status(404).json({ error: "project not found" });
  const data = JSON.parse(fs2.readFileSync(p, "utf-8"));
  if (data.deviceId !== req.deviceId)
    return res.status(403).json({ error: "forbidden" });
  const rawPath = req.body.path || req.body.name;
  const filePath = sanitizePath(rawPath);
  if (!filePath)
    return res.status(400).json({ error: "invalid path" });
  const file = {
    path: filePath,
    name: req.body.name || path2.basename(filePath),
    type: req.body.type || "file",
    content: req.body.content || ""
  };
  data.files = data.files || [];
  data.files.push(file);
  fs2.writeFileSync(p, JSON.stringify(data, null, 2));
  res.status(201).json(file);
});
router3.put("/files/:projectId/file", (req, res) => {
  const p = projectPath2(req.params.projectId);
  if (!fs2.existsSync(p))
    return res.status(404).json({ error: "project not found" });
  const data = JSON.parse(fs2.readFileSync(p, "utf-8"));
  if (data.deviceId !== req.deviceId)
    return res.status(403).json({ error: "forbidden" });
  const rawPath = String(req.query.path || "");
  const filePath = sanitizePath(rawPath);
  if (!filePath)
    return res.status(400).json({ error: "invalid path" });
  const idx = (data.files || []).findIndex((f) => f.path === filePath);
  if (idx === -1)
    return res.status(404).json({ error: "file not found" });
  data.files[idx] = { ...data.files[idx], ...req.body };
  fs2.writeFileSync(p, JSON.stringify(data, null, 2));
  res.json(data.files[idx]);
});
router3.delete("/files/:projectId/file", (req, res) => {
  const p = projectPath2(req.params.projectId);
  if (!fs2.existsSync(p))
    return res.status(404).json({ error: "project not found" });
  const data = JSON.parse(fs2.readFileSync(p, "utf-8"));
  if (data.deviceId !== req.deviceId)
    return res.status(403).json({ error: "forbidden" });
  const rawPath = String(req.query.path || "");
  const filePath = sanitizePath(rawPath);
  if (!filePath)
    return res.status(400).json({ error: "invalid path" });
  data.files = (data.files || []).filter((f) => f.path !== filePath);
  fs2.writeFileSync(p, JSON.stringify(data, null, 2));
  res.json({ ok: true });
});
var files_default = router3;

// src/routes/ai.ts
import { Router as Router4 } from "express";
import fs3 from "fs";
import path3 from "path";
var router4 = Router4();
var DATA_DIR3 = path3.join(process.cwd(), "backend_data");
var PROXY_ENDPOINTS = /* @__PURE__ */ new Set([
  "https://api.openai.com/v1",
  "https://api.groq.com/openai/v1",
  "https://openrouter.ai/api/v1",
  "https://api.aerolink.lat/v1"
]);
var AEROLINK_ENDPOINT = "https://api.aerolink.lat/v1";
function loadProjectContext(projectId, deviceId3, selectedPaths = []) {
  if (!projectId)
    return "";
  const p = path3.join(DATA_DIR3, `${projectId}.json`);
  if (!fs3.existsSync(p))
    return "";
  const data = JSON.parse(fs3.readFileSync(p, "utf-8"));
  if (data.deviceId !== deviceId3)
    return "";
  const files = (data.files || []).filter((file) => selectedPaths.includes(file.path));
  if (!files.length)
    return "";
  return files.map((file) => `File: ${file.path}

${String(file.content || "").slice(0, 4e3)}`).join("\n\n---\n\n");
}
router4.post("/ai/chat", async (req, res) => {
  const { apiKey, provider, prompt, messages, systemPrompt, projectId, selectedPaths, model, endpoint } = req.body;
  const userPrompt = typeof prompt === "string" ? prompt : messages?.[messages.length - 1]?.content || "";
  if (!apiKey || !userPrompt)
    return res.status(400).json({ error: "apiKey and prompt required" });
  const apiBase = typeof endpoint === "string" && endpoint.trim() ? endpoint.trim().replace(/\/$/, "") : "https://api.openai.com/v1";
  if (!PROXY_ENDPOINTS.has(apiBase))
    return res.status(400).json({ error: "This compatible endpoint is called directly from the browser and must allow browser CORS. The secure workspace proxy only supports built-in provider endpoints." });
  const isAerolink = apiBase === AEROLINK_ENDPOINT;
  const apiEndpoint = isAerolink ? `${apiBase}/messages` : apiBase.endsWith("/chat/completions") ? apiBase : `${apiBase}/chat/completions`;
  let enrichedPrompt = userPrompt;
  const context = loadProjectContext(projectId, req.deviceId, selectedPaths || []);
  if (context) {
    enrichedPrompt = `${userPrompt}

Workspace context:
${context}`;
  }
  const conversation = Array.isArray(messages) ? messages.slice(-30).filter((message) => Boolean(message && typeof message === "object" && ["user", "assistant"].includes(message.role || "") && typeof message.content === "string")) : [];
  if (conversation.length) conversation[conversation.length - 1] = { ...conversation[conversation.length - 1], content: enrichedPrompt };
  try {
    const r = await fetch(apiEndpoint, {
      method: "POST",
      headers: isAerolink ? { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "Content-Type": "application/json" } : { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(isAerolink ? { model: model || "claude-haiku-4-5-20251001", max_tokens: 4096, system: systemPrompt || "You are SK Coder AI assistant. Help users write, debug, and improve their code.", messages: conversation.length ? conversation : [{ role: "user", content: enrichedPrompt }] } : { model: model || "gpt-4o-mini", messages: [{ role: "system", content: systemPrompt || "You are SK Coder AI assistant. Help users write, debug, and improve their code." }, ...conversation.length ? conversation : [{ role: "user", content: enrichedPrompt }]] }),
      signal: AbortSignal.timeout(6e4)
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return res.status(r.status).json(j);
    const content = j?.choices?.[0]?.message?.content || (Array.isArray(j?.content) ? j.content.map((item) => item.text || "").join("") : "") || j?.content || j?.message?.content || "";
    if (!content && j?.error)
      return res.status(502).json(j);
    res.json({ content });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});
var ai_default = router4;

// src/routes/execute.ts
import express, { Router as Router5 } from "express";

// src/lib/sessionManager.ts
import { spawn } from "node:child_process";
import Docker from "dockerode";
import { PassThrough } from "node:stream";
import { chmod, chown, mkdir as mkdir4, open, readdir, rename as rename4, rm as rm3, stat, writeFile as writeFile4 } from "node:fs/promises";
import { createHash as createHash2, randomUUID as randomUUID4 } from "node:crypto";
import { createReadStream } from "node:fs";
import { dirname as dirname4, join as join4, normalize, relative, resolve as resolve2 } from "node:path";

// src/lib/outputLimit.ts
function utf8Prefix(source, maxBytes) {
  let end = Math.min(source.length, Math.max(0, maxBytes));
  while (end > 0 && end < source.length && (source[end] & 192) === 128) {
    end -= 1;
  }
  return source.subarray(0, end).toString();
}
function appendLimitedOutput(current, chunk, maxBytes) {
  const currentBytes = Buffer.byteLength(current);
  if (currentBytes >= maxBytes || maxBytes <= 0)
    return current;
  const available = maxBytes - currentBytes;
  return `${current}${utf8Prefix(chunk, available)}`;
}
function stripTerminalControlSequences(data) {
  return data.replace(/\x1b\][\s\S]*?(?:\x07|\x1b\\)/g, "").replace(/\x1b\[[0-?]*[ -/]*[@-~]/g, "").replace(/\x1b[()][0-2AB]/g, "").replace(/\x1b[=>78]/g, "");
}
function parseTerminalChunk(data, currentCwd) {
  const markerPattern = /__SK_CODER_CWD__(\/workspace(?:\/[^\r\n\x1b]*)?)(?:\x1b\[[0-?]*[ -\/]*[@-~])*/g;
  const matches = [...data.matchAll(markerPattern)];
  const workspacePath = matches.at(-1)?.[1];
  const cwd = workspacePath ? workspacePath === "/workspace" ? "/" : workspacePath.slice("/workspace".length) || "/" : currentCwd;
  return {
    cwd,
    reachedPrompt: Boolean(workspacePath),
    visible: stripTerminalControlSequences(data.replace(markerPattern, ""))
  };
}
function limitTerminalChunk(data, sentBytes, maxBytes) {
  const remaining = Math.max(0, maxBytes - sentBytes);
  if (!data || remaining === 0)
    return { data: "", sentBytes, capped: sentBytes >= maxBytes };
  const source = Buffer.from(data);
  const limited = utf8Prefix(source, remaining);
  const nextSentBytes = sentBytes + Math.min(source.length, remaining);
  return { data: limited, sentBytes: nextSentBytes, capped: nextSentBytes >= maxBytes };
}

// src/lib/backendConfig.ts
import { resolve } from "node:path";
function numberEnv(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}
var WORKSPACE_ROOT = resolve(process.env["WORKSPACE_ROOT"] || "./workspace-sessions");
var WORKSPACE_METADATA_PATH = resolve(process.env["WORKSPACE_METADATA_PATH"] || `${WORKSPACE_ROOT}/.registry/workspaces.json`);
var OPERATION_METADATA_PATH = resolve(process.env["OPERATION_METADATA_PATH"] || `${WORKSPACE_ROOT}/.registry/operations.json`);
var CAPACITY_LEDGER_PATH = resolve(process.env["CAPACITY_LEDGER_PATH"] || `${WORKSPACE_ROOT}/.registry/capacity.json`);
var backendInstanceId = process.env["BACKEND_INSTANCE_ID"]?.trim() || "sk-coder";
var BACKEND_INSTANCE_ID = /^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,62}$/.test(backendInstanceId) ? backendInstanceId : "sk-coder";
var RUNTIME_IMAGE = process.env["RUNTIME_IMAGE"] || "sk-coder-runtime:latest";
var GUI_RUNTIME_IMAGE = process.env["GUI_RUNTIME_IMAGE"] || "sk-coder-gui:latest";
var APK_RUNTIME_IMAGE = process.env["APK_RUNTIME_IMAGE"] || "sk-coder-apk:latest";
var SESSION_TTL_HOURS = numberEnv("SESSION_TTL_HOURS", 72);
var SESSION_MAX_BYTES = numberEnv("SESSION_MAX_BYTES", 5 * 1024 * 1024 * 1024);
var WORKSPACE_INITIAL_RESERVATION_BYTES = numberEnv("WORKSPACE_INITIAL_RESERVATION_BYTES", 1024 * 1024);
var WORKSPACE_INSTALL_RESERVE_BYTES = numberEnv("WORKSPACE_INSTALL_RESERVE_BYTES", 512 * 1024 * 1024);
var WORKSPACE_MAX_BYTES = numberEnv("WORKSPACE_MAX_BYTES", 50 * 1024 * 1024 * 1024);
var SHARED_POOL_MAX_BYTES = numberEnv("SHARED_POOL_MAX_BYTES", WORKSPACE_MAX_BYTES);
var SHARED_POOL_ADMISSION_BYTES = Math.min(numberEnv("SHARED_POOL_ADMISSION_BYTES", 48 * 1024 * 1024 * 1024), SHARED_POOL_MAX_BYTES);
var RUNNER_SCRATCH_MAX_BYTES = numberEnv("RUNNER_SCRATCH_MAX_BYTES", 35 * 1024 * 1024 * 1024);
var STAGING_MAX_BYTES = numberEnv("STAGING_MAX_BYTES", 15 * 1024 * 1024 * 1024);
var RUNTIME_CACHE_MAX_BYTES = numberEnv("RUNTIME_CACHE_MAX_BYTES", 25 * 1024 * 1024 * 1024);
var WORKSPACE_SAFETY_RESERVE_BYTES = numberEnv("WORKSPACE_SAFETY_RESERVE_BYTES", 25 * 1024 * 1024 * 1024);
var PACKAGE_CACHE_MAX_BYTES = numberEnv("PACKAGE_CACHE_MAX_BYTES", 20 * 1024 * 1024 * 1024);
var PACKAGE_CACHE_ROOT = resolve(process.env["PACKAGE_CACHE_ROOT"] || `${WORKSPACE_ROOT}/.cache/packages`);
var LOG_MAX_BYTES = numberEnv("LOG_MAX_BYTES", 5 * 1024 * 1024 * 1024);
var HOST_MEMORY_RESERVE_BYTES = numberEnv("HOST_MEMORY_RESERVE_BYTES", 2 * 1024 * 1024 * 1024);
var HOST_LOAD_MAX = numberEnv("HOST_LOAD_MAX", 3);
var SESSION_MAX_COUNT = numberEnv("SESSION_MAX_COUNT", 50);
var SESSION_IDLE_MINUTES = numberEnv("SESSION_IDLE_MINUTES", 30);
var RUNNER_MAX_COUNT = numberEnv("RUNNER_MAX_COUNT", 2);
var RUNNER_QUEUE_MAX_COUNT = numberEnv("RUNNER_QUEUE_MAX_COUNT", 20);
var COMMAND_TIMEOUT_MS = numberEnv("COMMAND_TIMEOUT_MS", 12e4);
var OUTPUT_MAX_BYTES = numberEnv("OUTPUT_MAX_BYTES", 5e5);
var WORKSPACE_NETWORK_MODE = process.env["WORKSPACE_NETWORK_MODE"] === "bridge" ? "bridge" : "none";
var DEPENDENCY_INSTALL_NETWORK_MODE = process.env["DEPENDENCY_INSTALL_NETWORK_MODE"] === "bridge" ? "bridge" : "none";
var DEPENDENCY_INSTALL_PROXY_URL = process.env["DEPENDENCY_INSTALL_PROXY_URL"]?.trim() || "";
var installerNetworkName = process.env["DEPENDENCY_INSTALL_NETWORK_NAME"]?.trim() || "skcoder-installer";
var DEPENDENCY_INSTALL_NETWORK_NAME = /^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,62}$/.test(installerNetworkName) ? installerNetworkName : "skcoder-installer";
var DEPENDENCY_INSTALL_TIMEOUT_MS = numberEnv("DEPENDENCY_INSTALL_TIMEOUT_MS", 18e4);
var GUI_SESSION_MAX_COUNT = numberEnv("GUI_SESSION_MAX_COUNT", 1);
var GUI_SESSION_TTL_MS = numberEnv("GUI_SESSION_TTL_MS", 10 * 60 * 1e3);
var GUI_SESSION_MEMORY_MB = numberEnv("GUI_SESSION_MEMORY_MB", 1024);
var PREVIEW_RUNTIME_IMAGE = process.env["PREVIEW_RUNTIME_IMAGE"] || RUNTIME_IMAGE;
var PREVIEW_SESSION_MAX_COUNT = numberEnv("PREVIEW_SESSION_MAX_COUNT", 1);
var PREVIEW_SESSION_TTL_MS = numberEnv("PREVIEW_SESSION_TTL_MS", 15 * 60 * 1e3);
var PREVIEW_SESSION_MEMORY_MB = numberEnv("PREVIEW_SESSION_MEMORY_MB", 1024);
var APK_JOB_MAX_COUNT = numberEnv("APK_JOB_MAX_COUNT", 1);
var APK_JOB_MEMORY_MB = numberEnv("APK_JOB_MEMORY_MB", 1536);
var APK_JOB_TIMEOUT_MS = numberEnv("APK_JOB_TIMEOUT_MS", 18e4);
var APK_JOB_TTL_MS = numberEnv("APK_JOB_TTL_MS", 30 * 60 * 1e3);
var APK_JOB_MIN_RESERVATION_BYTES = numberEnv("APK_JOB_MIN_RESERVATION_BYTES", 64 * 1024 * 1024);
var APK_JOB_EXPANSION_MULTIPLIER = numberEnv("APK_JOB_EXPANSION_MULTIPLIER", 8);

// src/lib/workspaceRegistry.ts
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { randomUUID as randomUUID2 } from "node:crypto";
var RETAINED_WORKSPACE_HOURS = 72;
var SCHEDULED_DELETE_HOURS = 4;
var registryCache = null;
var writeQueue = Promise.resolve();
function defaultRegistry() {
  return { version: 1, records: [] };
}
async function readRegistry() {
  if (registryCache)
    return registryCache;
  try {
    const parsed = JSON.parse(await readFile(WORKSPACE_METADATA_PATH, "utf8"));
    registryCache = parsed?.version === 1 && Array.isArray(parsed.records) ? parsed : defaultRegistry();
  } catch {
    registryCache = defaultRegistry();
  }
  return registryCache;
}
async function persistRegistry() {
  const registry = await readRegistry();
  await mkdir(dirname(WORKSPACE_METADATA_PATH), { recursive: true, mode: 448 });
  const temporaryPath = join(dirname(WORKSPACE_METADATA_PATH), `.workspaces-${randomUUID2()}.json`);
  await writeFile(temporaryPath, JSON.stringify(registry), { encoding: "utf8", mode: 384 });
  await rename(temporaryPath, WORKSPACE_METADATA_PATH);
}
function queuePersist() {
  writeQueue = writeQueue.then(() => persistRegistry());
  return writeQueue;
}
async function createWorkspaceRecord(id, quotaBytes, retentionMode = "three-days", terminalAccessHash = "", keepAlive = false) {
  const registry = await readRegistry();
  const now = Date.now();
  const duration = retentionMode === "four-hours" ? SCHEDULED_DELETE_HOURS : RETAINED_WORKSPACE_HOURS;
  const record = {
    id,
    terminalAccessHash,
    createdAt: now,
    lastHeartbeatAt: now,
    expiresAt: now + duration * 60 * 60 * 1e3,
    retentionMode,
    keepAlive,
    quotaBytes,
    state: "active",
    deleteUndoUntil: null,
    revision: 0
  };
  registry.records = [...registry.records.filter((item) => item.id !== id), record];
  await queuePersist();
  return record;
}
async function getWorkspaceRecord(id) {
  return (await readRegistry()).records.find((item) => item.id === id) ?? null;
}
async function touchWorkspaceRecord(id) {
  const registry = await readRegistry();
  const record = registry.records.find((item) => item.id === id);
  if (!record)
    return null;
  record.lastHeartbeatAt = Date.now();
  await queuePersist();
  return record;
}
async function setWorkspaceRetention(id, retentionMode) {
  const registry = await readRegistry();
  const record = registry.records.find((item) => item.id === id);
  if (!record)
    return null;
  const now = Date.now();
  const duration = retentionMode === "four-hours" ? SCHEDULED_DELETE_HOURS : RETAINED_WORKSPACE_HOURS;
  record.retentionMode = retentionMode;
  record.lastHeartbeatAt = now;
  record.expiresAt = now + duration * 60 * 60 * 1e3;
  record.state = "active";
  record.deleteUndoUntil = null;
  await queuePersist();
  return record;
}
async function setWorkspaceKeepAlive(id, keepAlive) {
  const registry = await readRegistry();
  const record = registry.records.find((item) => item.id === id);
  if (!record)
    return null;
  record.keepAlive = keepAlive;
  record.lastHeartbeatAt = Date.now();
  await queuePersist();
  return record;
}
async function scheduleWorkspaceDelete(id) {
  const registry = await readRegistry();
  const record = registry.records.find((item) => item.id === id);
  if (!record)
    return null;
  const now = Date.now();
  record.state = "scheduled-delete";
  record.retentionMode = "four-hours";
  record.expiresAt = now + SCHEDULED_DELETE_HOURS * 60 * 60 * 1e3;
  record.deleteUndoUntil = record.expiresAt;
  await queuePersist();
  return record;
}
async function cancelWorkspaceDelete(id) {
  const registry = await readRegistry();
  const record = registry.records.find((item) => item.id === id);
  if (!record)
    return null;
  const now = Date.now();
  record.state = "active";
  record.retentionMode = "three-days";
  record.deleteUndoUntil = null;
  record.lastHeartbeatAt = now;
  record.expiresAt = now + RETAINED_WORKSPACE_HOURS * 60 * 60 * 1e3;
  await queuePersist();
  return record;
}
async function incrementWorkspaceRevision(id) {
  const registry = await readRegistry();
  const record = registry.records.find((item) => item.id === id);
  if (!record)
    return null;
  record.revision += 1;
  await queuePersist();
  return record;
}
async function markWorkspaceDeleted(id) {
  const registry = await readRegistry();
  const record = registry.records.find((item) => item.id === id);
  if (!record)
    return null;
  record.state = "deleted";
  record.deleteUndoUntil = null;
  await queuePersist();
  return record;
}
async function listExpiredWorkspaceRecords(now = Date.now()) {
  return (await readRegistry()).records.filter((record) => record.state !== "deleted" && record.expiresAt <= now);
}
async function listScheduledWorkspaceRecords() {
  return (await readRegistry()).records.filter((record) => record.state === "scheduled-delete");
}
async function listWorkspaceRecords() {
  return [...(await readRegistry()).records];
}

// src/lib/terminalAccess.ts
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
var ACCESS_TOKEN_PREFIX = "skc.";
var TOKEN_PATTERN = /^[A-Za-z0-9_-]{40,128}$/;
function createTerminalAccessToken() {
  return randomBytes(32).toString("base64url");
}
function hashTerminalAccessToken(token) {
  return createHash("sha256").update(token).digest("hex");
}
function isTerminalAccessToken(token) {
  return typeof token === "string" && TOKEN_PATTERN.test(token);
}
function matchesTerminalAccessToken(token, expectedHash) {
  if (!isTerminalAccessToken(token) || typeof expectedHash !== "string" || !/^[a-f0-9]{64}$/i.test(expectedHash))
    return false;
  const actual = Buffer.from(hashTerminalAccessToken(token), "hex");
  const expected = Buffer.from(expectedHash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
function terminalAccessTokenFromProtocolHeader(header) {
  const value = Array.isArray(header) ? header.join(",") : header ?? "";
  for (const protocol of value.split(",").map((item) => item.trim())) {
    if (protocol.startsWith(ACCESS_TOKEN_PREFIX)) {
      const token = protocol.slice(ACCESS_TOKEN_PREFIX.length);
      return isTerminalAccessToken(token) ? token : null;
    }
  }
  return null;
}

// src/lib/operationRegistry.ts
import { mkdir as mkdir3, readFile as readFile3, rename as rename3, writeFile as writeFile3 } from "node:fs/promises";
import { dirname as dirname3, join as join3 } from "node:path";
import { randomUUID as randomUUID3 } from "node:crypto";

// src/lib/capacityLedger.ts
import { mkdir as mkdir2, readFile as readFile2, rename as rename2, rm as rm2, writeFile as writeFile2 } from "node:fs/promises";
import { dirname as dirname2, join as join2 } from "node:path";
var cachedLedger = null;
var writeQueue2 = Promise.resolve();
function defaultLedger() {
  return { version: 1, records: [] };
}
async function readLedger() {
  if (cachedLedger) return cachedLedger;
  try {
    const parsed = JSON.parse(await readFile2(CAPACITY_LEDGER_PATH, "utf8"));
    cachedLedger = parsed?.version === 1 && Array.isArray(parsed.records) ? parsed : defaultLedger();
  } catch {
    cachedLedger = defaultLedger();
  }
  return cachedLedger;
}
async function persistLedger() {
  const ledger = await readLedger();
  await mkdir2(dirname2(CAPACITY_LEDGER_PATH), { recursive: true, mode: 448 });
  const temporaryPath = join2(dirname2(CAPACITY_LEDGER_PATH), ".capacity-ledger-next.json");
  await writeFile2(temporaryPath, JSON.stringify(ledger), { encoding: "utf8", mode: 384 });
  await rename2(temporaryPath, CAPACITY_LEDGER_PATH);
}
function queueWrite(work) {
  const next = writeQueue2.then(work, work);
  writeQueue2 = next.then(() => void 0, () => void 0);
  return next;
}
function isCommitted(record) {
  return record.state === "active" || record.state === "releasing" || record.state === "release-failed";
}
function committedBytes(records) {
  return records.filter(isCommitted).reduce((total, record) => total + record.reservedBytes, 0);
}
function validateReservationInput(input) {
  if (!input.id || !input.ownerId || !Number.isSafeInteger(input.reservedBytes) || input.reservedBytes <= 0 || !Number.isSafeInteger(input.expiresAt) || input.expiresAt <= Date.now())
    throw new Error("Shared capacity requires an exact operation, owner, positive byte reservation, and future expiry.");
}
function canAdmitSharedReservation(currentReservedBytes, requestedBytes, admissionBytes = SHARED_POOL_ADMISSION_BYTES) {
  return Number.isSafeInteger(currentReservedBytes) && Number.isSafeInteger(requestedBytes) && requestedBytes > 0 && currentReservedBytes + requestedBytes <= admissionBytes;
}
function canExtendSharedReservation(currentReservedBytes, requestedBytes, maximumBytes = SHARED_POOL_MAX_BYTES) {
  return Number.isSafeInteger(currentReservedBytes) && Number.isSafeInteger(requestedBytes) && requestedBytes > 0 && currentReservedBytes + requestedBytes <= maximumBytes;
}
async function reserveSharedCapacity(input) {
  validateReservationInput(input);
  return queueWrite(async () => {
    const ledger = await readLedger();
    const existing = ledger.records.find((record) => record.id === input.id && isCommitted(record));
    if (existing) {
      if (existing.ownerId === input.ownerId && existing.kind === input.kind)
        return existing;
      throw new Error("Shared capacity is already reserved for a different operation.");
    }
    const currentReservedBytes = committedBytes(ledger.records);
    if (!canAdmitSharedReservation(currentReservedBytes, input.reservedBytes))
      throw new Error("Shared server workspace capacity is busy. Source files remain available in browser storage while this server operation waits.");
    const reservation = { ...input, actualBytes: 0, createdAt: Date.now(), state: "active", releaseError: null };
    ledger.records = [...ledger.records.filter((record) => record.id !== input.id), reservation];
    await persistLedger();
    return reservation;
  });
}
async function reconcileSharedCapacity(id, ownerId, requiredBytes, actualBytes = requiredBytes) {
  if (!id || !ownerId || !Number.isSafeInteger(requiredBytes) || requiredBytes <= 0 || !Number.isSafeInteger(actualBytes) || actualBytes < 0)
    throw new Error("Shared capacity reconciliation requires an exact operation, owner, and positive bounded reservation.");
  return queueWrite(async () => {
    const ledger = await readLedger();
    const reservation = ledger.records.find((record) => record.id === id);
    if (!reservation || reservation.ownerId !== ownerId || reservation.state !== "active")
      throw new Error("Only an active owned operation can reconcile shared capacity.");
    const currentReservedBytes = committedBytes(ledger.records);
    const additionalBytes = Math.max(0, requiredBytes - reservation.reservedBytes);
    if (additionalBytes > 0 && !canExtendSharedReservation(currentReservedBytes, additionalBytes))
      throw new Error("The shared server workplace capacity is busy. Existing work remains protected while this workspace waits for capacity.");
    reservation.reservedBytes = requiredBytes;
    reservation.actualBytes = Math.min(actualBytes, requiredBytes);
    await persistLedger();
    return reservation;
  });
}
async function reportSharedCapacityUsage(id, ownerId, actualBytes) {
  if (!Number.isSafeInteger(actualBytes) || actualBytes < 0)
    throw new Error("Shared capacity usage must be a non-negative byte value.");
  return queueWrite(async () => {
    const ledger = await readLedger();
    const reservation = ledger.records.find((record) => record.id === id);
    if (!reservation || reservation.ownerId !== ownerId || !isCommitted(reservation))
      return null;
    reservation.actualBytes = Math.min(actualBytes, reservation.reservedBytes);
    await persistLedger();
    return reservation;
  });
}
async function updateSharedCapacityExpiry(id, ownerId, expiresAt) {
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= Date.now())
    throw new Error("Shared capacity expiry must be a future timestamp.");
  return queueWrite(async () => {
    const ledger = await readLedger();
    const reservation = ledger.records.find((record) => record.id === id);
    if (!reservation || reservation.ownerId !== ownerId || !isCommitted(reservation))
      return null;
    reservation.expiresAt = expiresAt;
    await persistLedger();
    return reservation;
  });
}
async function beginSharedCapacityRelease(id, ownerId) {
  return queueWrite(async () => {
    const ledger = await readLedger();
    const reservation = ledger.records.find((record) => record.id === id);
    if (!reservation || reservation.ownerId !== ownerId || reservation.state === "released")
      return null;
    reservation.state = "releasing";
    reservation.releaseError = null;
    await persistLedger();
    return reservation;
  });
}
async function completeSharedCapacityRelease(id, ownerId) {
  return queueWrite(async () => {
    const ledger = await readLedger();
    const reservation = ledger.records.find((record) => record.id === id);
    if (!reservation || reservation.ownerId !== ownerId)
      return null;
    reservation.state = "released";
    reservation.actualBytes = 0;
    reservation.releaseError = null;
    await persistLedger();
    return reservation;
  });
}
async function failSharedCapacityRelease(id, ownerId, error) {
  return queueWrite(async () => {
    const ledger = await readLedger();
    const reservation = ledger.records.find((record) => record.id === id);
    if (!reservation || reservation.ownerId !== ownerId || reservation.state === "released")
      return null;
    reservation.state = "release-failed";
    reservation.releaseError = error instanceof Error ? error.message.slice(0, 500) : String(error).slice(0, 500);
    await persistLedger();
    return reservation;
  });
}
async function listSharedCapacityReservations(ownerId) {
  const records = (await readLedger()).records;
  return ownerId ? records.filter((record) => record.ownerId === ownerId) : [...records];
}
async function sharedCapacitySummary() {
  const records = await listSharedCapacityReservations();
  const reservedBytes = committedBytes(records);
  const actualBytes = records.filter(isCommitted).reduce((total, record) => total + record.actualBytes, 0);
  return {
    maximumBytes: SHARED_POOL_MAX_BYTES,
    admissionBytes: SHARED_POOL_ADMISSION_BYTES,
    extensionBytes: Math.max(0, SHARED_POOL_MAX_BYTES - SHARED_POOL_ADMISSION_BYTES),
    reservedBytes,
    actualBytes,
    availableAdmissionBytes: Math.max(0, SHARED_POOL_ADMISSION_BYTES - reservedBytes),
    availableExtensionBytes: Math.max(0, SHARED_POOL_MAX_BYTES - reservedBytes),
    activeReservations: records.filter((record) => record.state === "active").length,
    releaseFailures: records.filter((record) => record.state === "release-failed").length
  };
}

// src/lib/operationRegistry.ts
var registryCache2 = null;
var writeQueue3 = Promise.resolve();
function defaultRegistry2() {
  return { version: 1, records: [] };
}
function defaultReservationBytes(kind) {
  if (kind === "workplace") return WORKSPACE_INITIAL_RESERVATION_BYTES;
  if (kind === "terminal") return SESSION_MAX_BYTES;
  if (kind === "staging") return STAGING_MAX_BYTES;
  if (kind === "runner" || kind === "installer") return RUNNER_SCRATCH_MAX_BYTES;
  if (kind === "apk") return Math.min(STAGING_MAX_BYTES, 3 * 1024 * 1024 * 1024);
  if (kind === "gui" || kind === "preview") return Math.min(STAGING_MAX_BYTES, 2 * 1024 * 1024 * 1024);
  return Math.min(STAGING_MAX_BYTES, 1024 * 1024 * 1024);
}
function normalizeRecord(record) {
  return { ...record, reservationBytes: Number.isSafeInteger(record.reservationBytes) && record.reservationBytes >= 0 ? record.reservationBytes : defaultReservationBytes(record.kind) };
}
async function readRegistry2() {
  if (registryCache2) return registryCache2;
  try {
    const parsed = JSON.parse(await readFile3(OPERATION_METADATA_PATH, "utf8"));
    registryCache2 = parsed?.version === 1 && Array.isArray(parsed.records) ? { version: 1, records: parsed.records.map(normalizeRecord) } : defaultRegistry2();
  } catch {
    registryCache2 = defaultRegistry2();
  }
  return registryCache2;
}
async function persistRegistry2() {
  const registry = await readRegistry2();
  await mkdir3(dirname3(OPERATION_METADATA_PATH), { recursive: true, mode: 448 });
  const temporaryPath = join3(dirname3(OPERATION_METADATA_PATH), `.operations-${randomUUID3()}.json`);
  await writeFile3(temporaryPath, JSON.stringify(registry), { encoding: "utf8", mode: 384 });
  await rename3(temporaryPath, OPERATION_METADATA_PATH);
}
function queuePersist2() {
  writeQueue3 = writeQueue3.then(() => persistRegistry2());
  return writeQueue3;
}
function operationCanFinalize(operation, ownerId, kind) {
  return Boolean(operation && operation.ownerId === ownerId && operation.state !== "finalized" && (!kind || operation.kind === kind));
}
function operationNeedsRecovery(operation, now = Date.now()) {
  return operation.kind !== "terminal" && operation.kind !== "workplace" && operation.expiresAt <= now && operation.state !== "finalized";
}
async function createRuntimeOperation(operation) {
  if (!operation.id || !operation.ownerId || !Array.isArray(operation.resources) || operation.resources.some((resource) => !resource))
    throw new Error("Runtime operation requires an exact operation, owner, and resource list.");
  const reservationBytes = operation.reservationBytes ?? defaultReservationBytes(operation.kind);
  if (!Number.isSafeInteger(reservationBytes) || reservationBytes < 0)
    throw new Error("Runtime operation requires a non-negative bounded shared-capacity reservation.");
  if (reservationBytes > 0)
    await reserveSharedCapacity({ id: operation.id, ownerId: operation.ownerId, kind: operation.kind, reservedBytes: reservationBytes, expiresAt: operation.expiresAt });
  const registry = await readRegistry2();
  try {
    const record = { ...operation, reservationBytes, resources: [...new Set(operation.resources)], createdAt: Date.now(), state: "active", cleanupError: null };
    registry.records = [...registry.records.filter((item) => item.id !== record.id), record];
    await queuePersist2();
    return record;
  } catch (error) {
    if (reservationBytes > 0) {
      await beginSharedCapacityRelease(operation.id, operation.ownerId);
      await completeSharedCapacityRelease(operation.id, operation.ownerId);
    }
    throw error;
  }
}
async function updateRuntimeOperationExpiry(id, ownerId, expiresAt) {
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= Date.now())
    throw new Error("Runtime operation expiry must be a future timestamp.");
  const registry = await readRegistry2();
  const record = registry.records.find((item) => item.id === id);
  if (!record || record.ownerId !== ownerId || record.state === "finalized")
    return null;
  record.expiresAt = expiresAt;
  await queuePersist2();
  await updateSharedCapacityExpiry(id, ownerId, expiresAt);
  return record;
}
async function beginRuntimeOperationFinalization(id, ownerId, kind) {
  const registry = await readRegistry2();
  const record = registry.records.find((item) => item.id === id);
  if (!record || !operationCanFinalize(record, ownerId, kind)) return null;
  record.state = "finalizing";
  record.cleanupError = null;
  await queuePersist2();
  if (record.reservationBytes > 0)
    await beginSharedCapacityRelease(id, ownerId);
  return record;
}
async function completeRuntimeOperationFinalization(id, ownerId, kind) {
  const registry = await readRegistry2();
  const record = registry.records.find((item) => item.id === id);
  if (!record || record.ownerId !== ownerId || kind && record.kind !== kind) return null;
  record.state = "finalized";
  record.cleanupError = null;
  await queuePersist2();
  if (record.reservationBytes > 0)
    await completeSharedCapacityRelease(id, ownerId);
  return record;
}
async function failRuntimeOperationFinalization(id, ownerId, error) {
  const registry = await readRegistry2();
  const record = registry.records.find((item) => item.id === id);
  if (!record || record.ownerId !== ownerId) return null;
  record.state = "cleanup-failed";
  record.cleanupError = error instanceof Error ? error.message.slice(0, 500) : String(error).slice(0, 500);
  await queuePersist2();
  if (record.reservationBytes > 0)
    await failSharedCapacityRelease(id, ownerId, error);
  return record;
}
async function listRuntimeOperations(ownerId) {
  const records = (await readRegistry2()).records;
  return ownerId ? records.filter((record) => record.ownerId === ownerId) : [...records];
}
async function listExpiredRuntimeOperations(now = Date.now()) {
  return (await listRuntimeOperations()).filter((record) => operationNeedsRecovery(record, now));
}

// src/lib/operationalMetrics.ts
import { execFile } from "node:child_process";
import { cpus, loadavg, uptime } from "node:os";
import { readFile as readFile4, statfs } from "node:fs/promises";
import { promisify } from "node:util";
var execFileAsync = promisify(execFile);
var snapshots = [];
function parseMemInfo(value) {
  const values = new Map(value.split("\n").map((line) => {
    const [key, raw] = line.split(":", 2);
    return [key, Number(raw?.trim().split(/\s+/)[0]) * 1024];
  }));
  const totalBytes = values.get("MemTotal") || 0;
  const availableBytes = values.get("MemAvailable") || values.get("MemFree") || 0;
  return { totalBytes, availableBytes, usedBytes: Math.max(0, totalBytes - availableBytes) };
}
async function dockerStats() {
  try {
    const { stdout } = await execFileAsync("docker", ["stats", "--no-stream", "--format", "{{.Name}}|{{.CPUPerc}}|{{.MemUsage}}|{{.PIDs}}"], { timeout: 5e3, maxBuffer: 1024 * 1024 });
    return stdout.split("\n").filter(Boolean).map((line) => {
      const [name, cpu, memory, pids] = line.split("|", 4);
      return { name, cpu, memory, pids: Number(pids) || 0 };
    }).filter((entry) => entry.name.startsWith("skcoder-"));
  } catch {
    return [];
  }
}
async function getHostPressure() {
  const [meminfo, filesystem] = await Promise.all([
    readFile4("/proc/meminfo", "utf8").catch(() => ""),
    statfs(WORKSPACE_ROOT).catch(() => null)
  ]);
  const memory = parseMemInfo(meminfo);
  const diskTotalBytes = filesystem ? Number(filesystem.blocks) * Number(filesystem.bsize) : 0;
  const diskFreeBytes = filesystem ? Number(filesystem.bavail) * Number(filesystem.bsize) : 0;
  return {
    memory,
    disk: { totalBytes: diskTotalBytes, freeBytes: diskFreeBytes, usedBytes: Math.max(0, diskTotalBytes - diskFreeBytes) },
    cpu: { logicalCpus: cpus().length, load1: loadavg()[0] || 0, load5: loadavg()[1] || 0, load15: loadavg()[2] || 0 },
    uptimeSeconds: uptime()
  };
}
async function collectOperationalMetrics() {
  const [host, capacity, operations, reservations, containers] = await Promise.all([getHostPressure(), sharedCapacitySummary(), listRuntimeOperations(), listSharedCapacityReservations(), dockerStats()]);
  const byKind = /* @__PURE__ */ new Map();
  for (const reservation of reservations) {
    if (reservation.state === "released") continue;
    const entry = byKind.get(reservation.kind) || { reservedBytes: 0, actualBytes: 0, active: 0 };
    entry.reservedBytes += reservation.reservedBytes;
    entry.actualBytes += reservation.actualBytes;
    entry.active += 1;
    byKind.set(reservation.kind, entry);
  }
  const snapshot = { generatedAt: Date.now(), reservedBytes: capacity.reservedBytes, actualBytes: capacity.actualBytes, diskUsedBytes: host.disk.usedBytes, memoryUsedBytes: host.memory.usedBytes, load1: host.cpu.load1 };
  snapshots.push(snapshot);
  if (snapshots.length > 120) snapshots.splice(0, snapshots.length - 120);
  return {
    generatedAt: snapshot.generatedAt,
    host,
    sharedPool: { ...capacity, byKind: [...byKind.entries()].map(([kind, value]) => ({ kind, ...value })) },
    operations: {
      active: operations.filter((operation) => operation.state === "active" || operation.state === "finalizing").length,
      cleanupFailed: operations.filter((operation) => operation.state === "cleanup-failed").length,
      finalized: operations.filter((operation) => operation.state === "finalized").length,
      expired: operations.filter((operation) => operation.expiresAt <= snapshot.generatedAt && operation.state !== "finalized").length
    },
    containers,
    history: [...snapshots]
  };
}

// src/lib/serialTaskQueue.ts
var SerialTaskQueue = class {
  constructor(maxConcurrent = 1, maxOutstanding = 20) {
    this.maxConcurrent = maxConcurrent;
    this.maxOutstanding = maxOutstanding;
  }
  pending = [];
  active = 0;
  outstanding = 0;
  activeUsers = /* @__PURE__ */ new Map();
  run(task) {
    if (this.outstanding >= this.maxOutstanding)
      return Promise.reject(new Error("The isolated runner queue is full. Keep working in the browser and retry after queued jobs finish."));
    this.outstanding += 1;
    return new Promise((resolve6, reject) => {
      this.pending.push({ userKey: null, task, resolve: resolve6, reject });
      this.drain();
    });
  }
  runForUser(userKey, task) {
    if (this.outstanding >= this.maxOutstanding)
      return Promise.reject(new Error("The isolated runner queue is full. Keep working in the browser and retry after queued jobs finish."));
    this.outstanding += 1;
    return new Promise((resolve6, reject) => {
      this.pending.push({ userKey, task, resolve: resolve6, reject });
      this.drain();
    });
  }
  status() {
    return { active: this.active, queued: this.pending.length, outstanding: this.outstanding, maxConcurrent: this.maxConcurrent, maxOutstanding: this.maxOutstanding, activeUsers: Object.fromEntries(this.activeUsers) };
  }
  drain() {
    while (this.active < this.maxConcurrent && this.pending.length > 0) {
      const nextIndex = this.pending.findIndex((item) => item.userKey === null || !this.activeUsers.has(item.userKey));
      if (nextIndex === -1)
        break;
      const queued = this.pending.splice(nextIndex, 1)[0];
      if (queued.userKey) {
        const currentUsers = this.activeUsers.get(queued.userKey) ?? 0;
        this.activeUsers.set(queued.userKey, currentUsers + 1);
      }
      this.active += 1;
      void queued.task().then(queued.resolve, queued.reject).finally(() => {
        this.active -= 1;
        if (queued.userKey) {
          const after = (this.activeUsers.get(queued.userKey) ?? 1) - 1;
          if (after <= 0)
            this.activeUsers.delete(queued.userKey);
          else
            this.activeUsers.set(queued.userKey, after);
        }
        this.outstanding -= 1;
        this.drain();
      });
    }
  }
};

// src/lib/sessionManager.ts
function durableTerminalSessionName(terminalId) {
  return `sk-${terminalId.replace(/[^A-Za-z0-9_-]/g, "-").slice(0, 56) || "shell"}`;
}
function shellQuote(value) {
  return `'${value.replaceAll("'", `'"'"'`)}'`;
}
function terminalBootstrapCommand() {
  return `export PS1='\\$ '; export HISTFILE=/workspace/.skcoder-terminal-history; export HISTSIZE=1000; export HISTFILESIZE=1000; history -r; export PROMPT_COMMAND='history -a; printf "__SK_CODER_CWD__%s\\n" "$PWD"'; exec bash --noprofile --norc -i`;
}
function isTransientTerminalResizeError(error) {
  return /container not running|cannot resize a stopped container/i.test(error instanceof Error ? error.message : String(error));
}
function onceTerminalClose(onClose) {
  let closed = false;
  return (code) => {
    if (closed)
      return;
    closed = true;
    onClose(code);
  };
}
var STAGE_CHUNK_BYTES = 4 * 1024 * 1024;
var sessions = /* @__PURE__ */ new Map();
var stages = /* @__PURE__ */ new Map();
var activeInteractiveTerminals = /* @__PURE__ */ new Map();
var dockerReady = null;
var cleanupStarted = false;
var runtimeProbeCache = null;
var terminalToolProbeCache = null;
var workspaceLifecycleQueue = Promise.resolve();
var ephemeralRunnerQueue = new SerialTaskQueue(RUNNER_MAX_COUNT, RUNNER_QUEUE_MAX_COUNT);
var docker = new Docker({ socketPath: "/var/run/docker.sock" });
function run(command, args, timeout = COMMAND_TIMEOUT_MS, stdin = "") {
  return new Promise((resolveResult) => {
    const startedAt = Date.now();
    const proc = spawn(command, args, { env: { ...process.env, NO_COLOR: "1" } });
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    proc.stdin.on("error", () => void 0);
    const timer = setTimeout(() => {
      timedOut = true;
      proc.kill("SIGTERM");
      setTimeout(() => proc.kill("SIGKILL"), 1e3).unref();
    }, timeout);
    proc.stdout.on("data", (value) => {
      stdout = appendLimitedOutput(stdout, value, OUTPUT_MAX_BYTES);
    });
    proc.stderr.on("data", (value) => {
      stderr = appendLimitedOutput(stderr, value, OUTPUT_MAX_BYTES);
    });
    proc.stdin.end(stdin);
    proc.once("error", (error) => {
      clearTimeout(timer);
      resolveResult({ stdout: "", stderr: error.message, exitCode: 127, executionTime: Date.now() - startedAt });
    });
    proc.once("close", (code) => {
      clearTimeout(timer);
      resolveResult({ stdout, stderr: `${stderr}${timedOut ? "\nCommand timed out." : ""}`.trim(), exitCode: code ?? 1, executionTime: Date.now() - startedAt });
    });
  });
}
function safeRelativePath(pathname) {
  const value = normalize(pathname.trim().replace(/^\/+/, "") || ".");
  if (value === ".." || value.startsWith("..\\") || value.startsWith("../"))
    throw new Error("Workspace path escapes the session root.");
  return value;
}
function workspacePathFor(id) {
  return resolve2(WORKSPACE_ROOT, id);
}
function workplaceOperationId(id) {
  return `workplace:${id}`;
}
function stageRootFor(sessionId, stageId) {
  return resolve2(WORKSPACE_ROOT, ".staging", sessionId, stageId);
}
function containerNameFor(id) {
  return `skcoder-${id.replaceAll("-", "")}`;
}
function runnerPathFor(id) {
  return resolve2(WORKSPACE_ROOT, ".runs", id);
}
function queueWorkspaceLifecycle(work) {
  const next = workspaceLifecycleQueue.then(work, work);
  workspaceLifecycleQueue = next.then(() => void 0, () => void 0);
  return next;
}
async function checkSize(pathname, limit, message) {
  const result = await run("du", ["-sb", pathname], 5e3);
  const bytes = Number(result.stdout.split(/\s+/)[0]);
  if (Number.isFinite(bytes) && bytes >= limit)
    throw new Error(message);
}
async function measureDirectoryBytes(pathname) {
  const result = await run("du", ["-sb", pathname], 5e3);
  const bytes = Number(result.stdout.split(/\s+/)[0]);
  return Number.isFinite(bytes) && bytes >= 0 ? bytes : 0;
}
async function reconcileWorkspaceCapacityUsage(id, additionalBytes = 0) {
  const actualBytes = await measureDirectoryBytes(workspacePathFor(id));
  const reservationBytes = Math.max(WORKSPACE_INITIAL_RESERVATION_BYTES, actualBytes + additionalBytes);
  if (reservationBytes > SESSION_MAX_BYTES)
    throw new Error("This server workspace reached its configured temporary storage limit. The browser project remains available locally.");
  await reconcileSharedCapacity(workplaceOperationId(id), id, reservationBytes, actualBytes);
}
async function reserveWorkspaceGrowth(id, incomingBytes) {
  if (!Number.isSafeInteger(incomingBytes) || incomingBytes < 0)
    throw new Error("Workspace growth must be an exact non-negative byte value.");
  await ensureCapacity(incomingBytes);
  await reconcileWorkspaceCapacityUsage(id, incomingBytes);
}
async function reportWorkspaceCapacityUsage(id) {
  await reconcileWorkspaceCapacityUsage(id);
}
async function pruneInstallerCacheIfNeeded() {
  let bytes = await measureDirectoryBytes(PACKAGE_CACHE_ROOT);
  if (bytes < PACKAGE_CACHE_MAX_BYTES)
    return;
  const targetBytes = Math.floor(PACKAGE_CACHE_MAX_BYTES * 0.8);
  const entries = await readdir(PACKAGE_CACHE_ROOT, { withFileTypes: true }).catch(() => []);
  const candidates = await Promise.all(entries.filter((entry) => entry.isDirectory() || entry.isFile()).map(async (entry) => {
    const path5 = resolve2(PACKAGE_CACHE_ROOT, entry.name);
    const info = await stat(path5).catch(() => null);
    return { path: path5, modifiedAt: info?.mtimeMs ?? 0 };
  }));
  for (const candidate of candidates.sort((left, right) => left.modifiedAt - right.modifiedAt)) {
    if (bytes <= targetBytes) break;
    await rm3(candidate.path, { recursive: true, force: true });
    bytes = await measureDirectoryBytes(PACKAGE_CACHE_ROOT);
  }
}
function stageRelativePath(pathname) {
  const requested = safeRelativePath(pathname);
  if (requested === ".")
    throw new Error("A staged file path is required.");
  return requested;
}
async function ensureWritableWorkspaceDirectory(rootPath, targetPath) {
  const directory = dirname4(targetPath);
  const requested = relative(rootPath, directory);
  if (requested === ".." || requested.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`))
    throw new Error("Workspace path escapes the session root.");
  let current = rootPath;
  await mkdir4(current, { recursive: true, mode: 493 });
  await chown(current, 1e3, 1e3);
  await chmod(current, 493);
  for (const part of requested.split(/[\\/]+/).filter(Boolean)) {
    current = join4(current, part);
    await mkdir4(current, { recursive: true, mode: 493 });
    await chown(current, 1e3, 1e3);
    await chmod(current, 493);
  }
}
async function writeLiveWorkspaceFile(session, requested, content) {
  const target = `/workspace/${requested.replaceAll("\\", "/")}`;
  const directory = dirname4(target);
  const container = docker.getContainer(session.containerName);
  const prepare = await container.exec({
    AttachStdout: true,
    AttachStderr: true,
    Tty: false,
    User: "0:0",
    WorkingDir: "/workspace",
    Cmd: ["bash", "-lc", `mkdir -p -- ${shellQuote(directory)} && chmod 777 -- ${shellQuote(directory)}`]
  });
  await prepare.start({ hijack: true, stdin: false });
  let prepared = await prepare.inspect();
  for (let attempt = 0; prepared.Running && attempt < 200; attempt += 1) {
    await new Promise((resolveResult) => setTimeout(resolveResult, 25));
    prepared = await prepare.inspect();
  }
  if (prepared.Running || prepared.ExitCode !== 0)
    throw new Error("The isolated workspace could not prepare the staged file path.");
  const exec = await container.exec({
    AttachStdin: true,
    AttachStdout: true,
    AttachStderr: true,
    Tty: false,
    User: "1000:1000",
    WorkingDir: "/workspace",
    Env: ["HOME=/workspace", "TERM=dumb"],
    Cmd: ["bash", "-lc", `cat > ${shellQuote(target)} && chmod 644 -- ${shellQuote(target)}`]
  });
  const stream = await exec.start({ hijack: true, stdin: true });
  let streamError = null;
  stream.once("error", (error) => {
    streamError = error instanceof Error ? error : new Error("The staged file stream failed.");
  });
  stream.end(content);
  let status = await exec.inspect();
  for (let attempt = 0; status.Running && attempt < 200; attempt += 1) {
    await new Promise((resolveResult) => setTimeout(resolveResult, 25));
    status = await exec.inspect();
  }
  if (streamError)
    throw streamError;
  if (status.Running) {
    stream.destroy();
    throw new Error("The isolated workspace did not finish receiving the staged file.");
  }
  if (status.ExitCode !== 0)
    throw new Error("The isolated workspace could not receive the staged file.");
}
function missingOffsets(file, completed) {
  const offsets = [];
  for (let offset = 0; offset < file.size; offset += STAGE_CHUNK_BYTES)
    if (!completed.has(offset))
      offsets.push(offset);
  return offsets;
}
async function hashFile(pathname) {
  const hash = createHash2("sha256");
  await new Promise((resolveResult, reject) => {
    const stream = createReadStream(pathname);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.once("error", reject);
    stream.once("end", resolveResult);
  });
  return hash.digest("hex");
}
async function collectWorkspaceManifest(root, current = root, entries = []) {
  for (const entry of await readdir(current, { withFileTypes: true })) {
    const target = resolve2(current, entry.name);
    const relation = relative(root, target);
    if (!relation || relation.startsWith("..") || entry.isSymbolicLink())
      continue;
    if (entry.isDirectory()) {
      await collectWorkspaceManifest(root, target, entries);
      continue;
    }
    if (entry.isFile()) {
      const info = await stat(target);
      entries.push({ path: relation.replaceAll("\\", "/"), size: info.size, sha256: await hashFile(target) });
    }
  }
  return entries;
}
async function ensureCapacity(incomingBytes = 0) {
  const pressure = await getHostPressure();
  if (pressure.disk.freeBytes > 0 && pressure.disk.freeBytes - incomingBytes < WORKSPACE_SAFETY_RESERVE_BYTES)
    throw new Error("Cloud runtime is preserving its safety reserve. Source files remain available in browser storage.");
  if (pressure.memory.availableBytes > 0 && pressure.memory.availableBytes < HOST_MEMORY_RESERVE_BYTES)
    throw new Error("Cloud runtime is preserving memory for active work. Source files remain available in browser storage while server work waits.");
  if (pressure.cpu.load1 > HOST_LOAD_MAX)
    throw new Error("Cloud runtime is completing active work before admitting more server tasks. Source files remain available in browser storage.");
}
async function activeRuntimeCount() {
  const result = await run("docker", ["ps", "--filter", "label=skcoder.workspace=true", "--filter", `label=skcoder.instance=${BACKEND_INSTANCE_ID}`, "-q"], 5e3);
  if (result.exitCode !== 0)
    return sessions.size;
  return result.stdout.split("\n").filter(Boolean).length;
}
async function runtimeIsActive(id) {
  const probe = await run("docker", ["inspect", "-f", "{{.State.Running}}", containerNameFor(id)], 5e3);
  return probe.exitCode === 0 && probe.stdout.trim() === "true";
}
async function startWorkspaceRuntime(id, workspacePath) {
  await mkdir4(workspacePath, { recursive: true, mode: 493 });
  await chown(workspacePath, 1e3, 1e3);
  await chmod(workspacePath, 493);
  const result = await run("docker", [
    "run",
    "-d",
    "--rm",
    "--name",
    containerNameFor(id),
    "--label",
    "skcoder.workspace=true",
    "--label",
    `skcoder.workspace-id=${id}`,
    "--label",
    `skcoder.instance=${BACKEND_INSTANCE_ID}`,
    "--network",
    WORKSPACE_NETWORK_MODE,
    "--memory",
    "768m",
    "--memory-swap",
    "768m",
    "--cpus",
    "1",
    "--pids-limit",
    "256",
    "--cap-drop",
    "ALL",
    "--security-opt",
    "no-new-privileges",
    "--user",
    "1000:1000",
    "-v",
    `${workspacePath}:/workspace:rw`,
    "-w",
    "/workspace",
    "--tmpfs",
    "/tmp:rw,size=128m,mode=1777",
    RUNTIME_IMAGE,
    "sleep",
    "infinity"
  ], 3e4);
  if (result.exitCode !== 0)
    throw new Error(result.stderr || "The isolated runtime could not start.");
}
async function suspendWorkspaceRuntime(id) {
  sessions.delete(id);
  for (const stage of stages.values())
    if (stage.sessionId === id)
      stages.delete(stage.id);
  await run("docker", ["rm", "-f", containerNameFor(id)], 1e4);
}
async function suspendIdleWorkspaceRuntimes(now = Date.now()) {
  const cutoff = now - SESSION_IDLE_MINUTES * 60 * 1e3;
  for (const record of await listWorkspaceRecords()) {
    if (record.state !== "active" || record.keepAlive || record.lastHeartbeatAt >= cutoff)
      continue;
    if ((activeInteractiveTerminals.get(record.id) ?? 0) > 0)
      continue;
    if (await runtimeIsActive(record.id))
      await suspendWorkspaceRuntime(record.id);
  }
}
async function resumeWorkspaceSession(record) {
  const workspacePath = workspacePathFor(record.id);
  if (!await runtimeIsActive(record.id)) {
    await suspendIdleWorkspaceRuntimes();
    if (await activeRuntimeCount() >= SESSION_MAX_COUNT)
      throw new Error("All active runtime slots are busy. Keep the project in browser storage and retry when a running terminal becomes idle.");
    await ensureCapacity();
    await startWorkspaceRuntime(record.id, workspacePath);
    await createRuntimeOperation({ id: `terminal:${record.id}`, ownerId: record.id, kind: "terminal", resources: [`container:${containerNameFor(record.id)}`], reservationBytes: 0, expiresAt: record.expiresAt });
  }
  const session = { id: record.id, containerName: containerNameFor(record.id), workspacePath, createdAt: record.createdAt, lastUsedAt: Date.now(), retentionMode: record.retentionMode };
  sessions.set(record.id, session);
  return session;
}
async function ensureDockerReady() {
  if (dockerReady !== null)
    return dockerReady;
  const result = await run("docker", ["version", "--format", "{{.Server.Version}}"], 5e3);
  dockerReady = result.exitCode === 0 && Boolean(result.stdout.trim());
  return dockerReady;
}
async function createWorkspaceSession(options) {
  return queueWorkspaceLifecycle(async () => {
    const startRuntime = options?.startRuntime !== false;
    if (startRuntime && !await ensureDockerReady())
      throw new Error("The isolated runtime service is not available.");
    await removeExpiredWorkspaceSessions();
    await suspendScheduledWorkspaceRuntimes();
    await suspendIdleWorkspaceRuntimes();
    if (startRuntime && await activeRuntimeCount() >= SESSION_MAX_COUNT)
      throw new Error("All active runtime slots are busy. Keep the project in browser storage and retry when a running terminal becomes idle.");
    await mkdir4(WORKSPACE_ROOT, { recursive: true, mode: 448 });
    await ensureCapacity();
    const id = randomUUID4();
    const terminalAccessToken = createTerminalAccessToken();
    const workspacePath = workspacePathFor(id);
    const retentionMode = options?.retentionMode === "four-hours" ? "four-hours" : "three-days";
    try {
      const record = await createWorkspaceRecord(id, SESSION_MAX_BYTES, retentionMode, hashTerminalAccessToken(terminalAccessToken), options?.keepAlive === true);
      await mkdir4(workspacePath, { recursive: true, mode: 493 });
      await chown(workspacePath, 1e3, 1e3);
      await chmod(workspacePath, 493);
      await createRuntimeOperation({ id: workplaceOperationId(id), ownerId: id, kind: "workplace", resources: [`path:${workspacePath}`], reservationBytes: WORKSPACE_INITIAL_RESERVATION_BYTES, expiresAt: record.expiresAt });
      if (startRuntime) {
        await startWorkspaceRuntime(id, workspacePath);
        await createRuntimeOperation({ id: `terminal:${id}`, ownerId: id, kind: "terminal", resources: [`container:${containerNameFor(id)}`], reservationBytes: 0, expiresAt: record.expiresAt });
      }
    } catch (error) {
      await suspendWorkspaceRuntime(id);
      await rm3(workspacePath, { recursive: true, force: true });
      await beginRuntimeOperationFinalization(`terminal:${id}`, id, "terminal");
      await completeRuntimeOperationFinalization(`terminal:${id}`, id, "terminal");
      await beginRuntimeOperationFinalization(workplaceOperationId(id), id, "workplace");
      await completeRuntimeOperationFinalization(workplaceOperationId(id), id, "workplace");
      await markWorkspaceDeleted(id);
      throw error;
    }
    const session = { id, containerName: containerNameFor(id), workspacePath, terminalAccessToken, createdAt: Date.now(), lastUsedAt: Date.now(), retentionMode };
    sessions.set(id, session);
    startCleanup();
    return session;
  });
}
async function authorizeTerminalSession(id, token) {
  const record = await getWorkspaceRecord(id);
  return Boolean(record && record.state === "active" && matchesTerminalAccessToken(token, record.terminalAccessHash));
}
async function getWorkspaceSession(id) {
  let session = sessions.get(id);
  if (!session || !await runtimeIsActive(id)) {
    sessions.delete(id);
    session = await queueWorkspaceLifecycle(async () => {
      const record = await getWorkspaceRecord(id);
      if (!record || record.state === "deleted" || record.state === "scheduled-delete")
        throw new Error("Workspace session not found or expired.");
      const existing = sessions.get(id);
      if (existing && await runtimeIsActive(id))
        return existing;
      return resumeWorkspaceSession(record);
    });
  }
  session.lastUsedAt = Date.now();
  await touchWorkspaceRecord(id);
  return session;
}
async function getWorkspaceManifest(id) {
  const lifecycle = await getWorkspaceLifecycle(id);
  if (lifecycle.state !== "active")
    throw new Error("Workspace session not found or expired.");
  return { revision: lifecycle.revision, files: await collectWorkspaceManifest(workspacePathFor(id)) };
}
async function syncWorkspaceFiles(id, files) {
  const session = await getWorkspaceSession(id);
  for (const file of files) {
    if (typeof file.path !== "string" || typeof file.content !== "string")
      throw new Error("Invalid workspace file payload.");
    if (file.encoding && file.encoding !== "utf8" && file.encoding !== "base64")
      throw new Error("Unsupported workspace file encoding.");
    const requested = safeRelativePath(file.path);
    if (requested === ".")
      throw new Error("A workspace file path is required.");
    const content = file.encoding === "base64" ? Buffer.from(file.content, "base64") : Buffer.from(file.content, "utf8");
    await reserveWorkspaceGrowth(id, content.length);
    await writeLiveWorkspaceFile(session, requested, content);
  }
  await ensureCapacity();
  await incrementWorkspaceRevision(id);
  await reportWorkspaceCapacityUsage(id);
}
function describeWorkspaceStage(stage) {
  return {
    stageId: stage.id,
    chunkBytes: STAGE_CHUNK_BYTES,
    files: [...stage.files.values()].map((file) => ({
      path: file.path,
      size: file.size,
      missingOffsets: missingOffsets(file, stage.completedOffsets.get(file.path) ?? /* @__PURE__ */ new Set())
    }))
  };
}
async function requireWorkspaceStage(sessionId, stageId) {
  const record = await getWorkspaceLifecycle(sessionId);
  if (record.state !== "active")
    throw new Error("Workspace session not found or expired.");
  const stage = stages.get(stageId);
  if (!stage || stage.sessionId !== sessionId)
    throw new Error("Staging session not found or expired.");
  return stage;
}
async function beginWorkspaceStage(sessionId, requestedFiles, existingStageId, options) {
  const record = await getWorkspaceLifecycle(sessionId);
  if (record.state !== "active")
    throw new Error("Workspace session not found or expired.");
  if (existingStageId) {
    const existing = await requireWorkspaceStage(sessionId, existingStageId);
    return describeWorkspaceStage(existing);
  }
  if (!Array.isArray(requestedFiles))
    throw new Error("A staging manifest is required.");
  const lifecycle = await getWorkspaceLifecycle(sessionId);
  if (options?.baseRevision !== void 0 && options.baseRevision !== lifecycle.revision)
    throw new Error("Workspace changed on the server. Refresh the manifest and review the changed files before retrying.");
  const files = /* @__PURE__ */ new Map();
  for (const item of requestedFiles) {
    const path5 = stageRelativePath(item.path);
    if (!Number.isSafeInteger(item.size) || item.size < 0 || item.sha256 !== void 0 && !/^[a-f0-9]{64}$/i.test(item.sha256))
      throw new Error("A staged file requires a valid size and optional SHA-256 checksum.");
    if (files.has(path5))
      throw new Error("The staging manifest contains duplicate file paths.");
    files.set(path5, { path: path5, size: item.size, sha256: item.sha256?.toLowerCase(), revision: item.revision });
  }
  const deletedPaths = [...new Set((options?.deletedPaths ?? []).map(stageRelativePath))].filter((path5) => !files.has(path5));
  const totalBytes = [...files.values()].reduce((total, file) => total + file.size, 0);
  if (totalBytes > STAGING_MAX_BYTES)
    throw new Error("This server staging request exceeds the current temporary staging capacity. The browser project remains available locally.");
  const id = randomUUID4();
  const stage = {
    id,
    sessionId,
    rootPath: stageRootFor(sessionId, id),
    files,
    completedOffsets: new Map([...files.keys()].map((path5) => [path5, /* @__PURE__ */ new Set()])),
    receivedBytes: 0,
    deletedPaths,
    baseRevision: lifecycle.revision
  };
  await createRuntimeOperation({ id: `staging:${id}`, ownerId: sessionId, kind: "staging", resources: [`path:${stage.rootPath}`], reservationBytes: Math.max(1, totalBytes), expiresAt: Date.now() + 30 * 60 * 1e3 });
  try {
    await mkdir4(stage.rootPath, { recursive: true, mode: 448 });
  } catch (error) {
    await beginRuntimeOperationFinalization(`staging:${id}`, sessionId, "staging");
    await failRuntimeOperationFinalization(`staging:${id}`, sessionId, error);
    throw error;
  }
  stages.set(id, stage);
  return describeWorkspaceStage(stage);
}
async function getWorkspaceStageStatus(sessionId, stageId) {
  return describeWorkspaceStage(await requireWorkspaceStage(sessionId, stageId));
}
async function writeWorkspaceStageChunk(sessionId, stageId, filePath, offset, data, checksum) {
  const stage = await requireWorkspaceStage(sessionId, stageId);
  const path5 = stageRelativePath(filePath);
  const file = stage.files.get(path5);
  if (!file)
    throw new Error("Chunk path is not part of the staging manifest.");
  if (!Number.isSafeInteger(offset) || offset < 0 || offset % STAGE_CHUNK_BYTES !== 0)
    throw new Error("Chunk offset is invalid.");
  const expectedLength = Math.min(STAGE_CHUNK_BYTES, file.size - offset);
  if (expectedLength < 0 || data.length !== expectedLength)
    throw new Error("Chunk length does not match the manifest.");
  const receivedHash = createHash2("sha256").update(data).digest("hex");
  if (checksum && checksum.toLowerCase() !== receivedHash)
    throw new Error("Chunk checksum verification failed.");
  await ensureCapacity(data.length);
  const target = resolve2(stage.rootPath, path5);
  if (relative(stage.rootPath, target).startsWith(".."))
    throw new Error("Staging path escapes the session root.");
  await mkdir4(dirname4(target), { recursive: true, mode: 448 });
  let handle;
  try {
    handle = await open(target, "r+");
  } catch {
    handle = await open(target, "w+");
  }
  try {
    await handle.write(data, 0, data.length, offset);
  } finally {
    await handle.close();
  }
  const completedOffsets = stage.completedOffsets.get(path5);
  if (!completedOffsets?.has(offset)) {
    completedOffsets?.add(offset);
    stage.receivedBytes += data.length;
  }
  await reportSharedCapacityUsage(`staging:${stage.id}`, sessionId, stage.receivedBytes);
  await ensureCapacity();
  return { path: path5, offset, receivedBytes: data.length, checksum: receivedHash };
}
async function commitWorkspaceStage(sessionId, stageId) {
  const stage = await requireWorkspaceStage(sessionId, stageId);
  const lifecycle = await getWorkspaceLifecycle(sessionId);
  if (lifecycle.revision !== stage.baseRevision)
    throw new Error("Workspace changed on the server during staging. Refresh the manifest and resolve the conflict before committing.");
  await reserveWorkspaceGrowth(sessionId, [...stage.files.values()].reduce((total, file) => total + file.size, 0));
  for (const file of stage.files.values()) {
    const completed = stage.completedOffsets.get(file.path) ?? /* @__PURE__ */ new Set();
    if (missingOffsets(file, completed).length > 0)
      throw new Error(`Staging file is incomplete: ${file.path}`);
    const staged = resolve2(stage.rootPath, file.path);
    if (file.size === 0) {
      await mkdir4(dirname4(staged), { recursive: true, mode: 448 });
      await writeFile4(staged, "");
    }
    if ((await stat(staged)).size !== file.size || file.sha256 !== void 0 && await hashFile(staged) !== file.sha256)
      throw new Error(`Staging verification failed: ${file.path}`);
  }
  for (const file of stage.files.values()) {
    const staged = resolve2(stage.rootPath, file.path);
    const target = resolve2(workspacePathFor(sessionId), file.path);
    if (relative(workspacePathFor(sessionId), target).startsWith(".."))
      throw new Error("Staging path escapes the session root.");
    await ensureWritableWorkspaceDirectory(workspacePathFor(sessionId), target);
    await chmod(staged, 420);
    await rename4(staged, target);
  }
  for (const path5 of stage.deletedPaths) {
    const target = resolve2(workspacePathFor(sessionId), path5);
    if (relative(workspacePathFor(sessionId), target).startsWith(".."))
      throw new Error("Staging path escapes the session root.");
    await rm3(target, { recursive: true, force: true });
  }
  await beginRuntimeOperationFinalization(`staging:${stage.id}`, sessionId, "staging");
  try {
    stages.delete(stage.id);
    await rm3(stage.rootPath, { recursive: true, force: true });
    await completeRuntimeOperationFinalization(`staging:${stage.id}`, sessionId, "staging");
  } catch (error) {
    await failRuntimeOperationFinalization(`staging:${stage.id}`, sessionId, error);
    throw error;
  }
  await ensureCapacity();
  await incrementWorkspaceRevision(sessionId);
  await reportWorkspaceCapacityUsage(sessionId);
  return { revision: (await getWorkspaceLifecycle(sessionId)).revision };
}
async function removeWorkspaceStage(sessionId, stageId) {
  const stage = await requireWorkspaceStage(sessionId, stageId);
  await beginRuntimeOperationFinalization(`staging:${stage.id}`, sessionId, "staging");
  try {
    stages.delete(stage.id);
    await rm3(stage.rootPath, { recursive: true, force: true });
    await completeRuntimeOperationFinalization(`staging:${stage.id}`, sessionId, "staging");
  } catch (error) {
    await failRuntimeOperationFinalization(`staging:${stage.id}`, sessionId, error);
    throw error;
  }
}
async function runWorkspaceCommand(id, command, cwd = "/", stdin = "") {
  const session = await getWorkspaceSession(id);
  const requested = safeRelativePath(cwd);
  const workspaceCwd = requested === "." ? "/workspace" : `/workspace/${requested.replaceAll("\\", "/")}`;
  const result = await run("docker", ["exec", "-i", "--user", "1000:1000", "-e", "HOME=/workspace", "-w", workspaceCwd, session.containerName, "bash", "-lc", command], COMMAND_TIMEOUT_MS, stdin);
  await ensureCapacity();
  await checkSize(session.workspacePath, SESSION_MAX_BYTES, "The workspace reached its storage limit while running this command.");
  await incrementWorkspaceRevision(id);
  await reportWorkspaceCapacityUsage(id);
  return result;
}
function dependencyInstallArgs(manager, mode, packages = []) {
  if (manager === "npm") {
    return [mode === "ci" ? "ci" : "install", ...packages, "--ignore-scripts", "--no-audit", "--no-fund", "--registry=https://registry.npmjs.org/", "--userconfig=/dev/null"];
  }
  if (manager === "pnpm") {
    return [packages.length ? "add" : "install", ...packages, "--ignore-scripts", "--registry=https://registry.npmjs.org/", ...mode === "ci" ? ["--frozen-lockfile"] : []];
  }
  return [packages.length ? "add" : "install", ...packages, "--ignore-scripts", "--registry=https://registry.npmjs.org/", ...mode === "ci" ? ["--immutable"] : []];
}
async function installWorkspaceDependencies(id, manager, mode, cwd = "/", packages = []) {
  if (DEPENDENCY_INSTALL_NETWORK_MODE !== "bridge") {
    throw new Error("Dependency installation is disabled until the server enables the separate installer network. The live terminal remains safely offline.");
  }
  if (!/^https?:\/\/[^\s/]+/i.test(DEPENDENCY_INSTALL_PROXY_URL)) {
    throw new Error("Dependency installation requires a configured registry egress proxy. The live terminal remains safely offline.");
  }
  if (packages.length > 32 || packages.some((entry) => !/^(?:@[-a-z0-9_.]+\/)?[a-z0-9][a-z0-9_.-]*(?:@[-a-z0-9_.+*~^<>=|]+)?$/i.test(entry))) {
    throw new Error("Only up to 32 registry package names with optional versions are accepted for isolated installation.");
  }
  if (mode === "ci" && packages.length > 0) {
    throw new Error("A clean lockfile install cannot add package names. Use install instead.");
  }
  const session = await getWorkspaceSession(id);
  await reserveWorkspaceGrowth(id, WORKSPACE_INSTALL_RESERVE_BYTES);
  const requested = safeRelativePath(cwd);
  const workspaceCwd = requested === "." ? "/workspace" : `/workspace/${requested.replaceAll("\\", "/")}`;
  await mkdir4(PACKAGE_CACHE_ROOT, { recursive: true, mode: 493 });
  await chown(PACKAGE_CACHE_ROOT, 1e3, 1e3);
  await chmod(PACKAGE_CACHE_ROOT, 493);
  const permissionResult = await run("docker", [
    "run",
    "--rm",
    "--network",
    "none",
    "--user",
    "0:0",
    "--cap-drop",
    "ALL",
    "--security-opt",
    "no-new-privileges",
    "--volumes-from",
    session.containerName,
    RUNTIME_IMAGE,
    "bash",
    "-lc",
    `mkdir -p -- ${shellQuote(workspaceCwd)} && chmod 777 -- ${shellQuote(workspaceCwd)}`
  ], 1e4);
  if (permissionResult.exitCode !== 0)
    throw new Error("The isolated installer could not prepare the selected project directory.");
  const result = await run("docker", [
    "run",
    "--rm",
    "--network",
    DEPENDENCY_INSTALL_NETWORK_NAME,
    "--memory",
    "1024m",
    "--memory-swap",
    "1024m",
    "--cpus",
    "1",
    "--pids-limit",
    "256",
    "--cap-drop",
    "ALL",
    "--security-opt",
    "no-new-privileges",
    "--user",
    "1000:1000",
    "-e",
    "HOME=/tmp",
    "-e",
    "npm_config_cache=/sk-coder-cache/npm",
    "-e",
    "npm_config_store_dir=/sk-coder-cache/pnpm",
    "-e",
    "YARN_CACHE_FOLDER=/sk-coder-cache/yarn",
    "-e",
    `HTTP_PROXY=${DEPENDENCY_INSTALL_PROXY_URL}`,
    "-e",
    `HTTPS_PROXY=${DEPENDENCY_INSTALL_PROXY_URL}`,
    "-e",
    `http_proxy=${DEPENDENCY_INSTALL_PROXY_URL}`,
    "-e",
    `https_proxy=${DEPENDENCY_INSTALL_PROXY_URL}`,
    "-e",
    `NO_PROXY=localhost,127.0.0.1,registry-proxy`,
    "--volumes-from",
    session.containerName,
    "-v",
    `${PACKAGE_CACHE_ROOT}:/sk-coder-cache:rw`,
    "-w",
    workspaceCwd,
    "--tmpfs",
    "/tmp:rw,size=256m,mode=1777",
    RUNTIME_IMAGE,
    manager,
    ...dependencyInstallArgs(manager, mode, packages)
  ], DEPENDENCY_INSTALL_TIMEOUT_MS);
  await ensureCapacity();
  await checkSize(session.workspacePath, SESSION_MAX_BYTES, "The workspace reached its storage limit while installing dependencies.");
  await pruneInstallerCacheIfNeeded();
  await incrementWorkspaceRevision(id);
  await reportWorkspaceCapacityUsage(id);
  return result;
}
async function runCodeInWorkspace(id, language, code, stdin = "") {
  return ephemeralRunnerQueue.runForUser(id, async () => {
    const session = await getWorkspaceSession(id);
    const runPath = `.skcoder-runs/${randomUUID4()}`;
    const hostRunPath = resolve2(session.workspacePath, runPath);
    const config = {
      python: { filename: "main.py", command: "python3 main.py" },
      py: { filename: "main.py", command: "python3 main.py" },
      node: { filename: "main.js", command: "node main.js" },
      nodejs: { filename: "main.js", command: "node main.js" },
      javascript: { filename: "main.js", command: "node main.js" },
      js: { filename: "main.js", command: "node main.js" },
      mjs: { filename: "main.mjs", command: "node main.mjs" },
      cjs: { filename: "main.cjs", command: "node main.cjs" },
      typescript: { filename: "main.tsx", command: "tsx main.tsx" },
      ts: { filename: "main.tsx", command: "tsx main.tsx" },
      tsx: { filename: "main.tsx", command: "tsx main.tsx" },
      bash: { filename: "main.sh", command: "bash main.sh" },
      shell: { filename: "main.sh", command: "bash main.sh" },
      java: { filename: "Main.java", command: "javac Main.java && java Main" },
      c: { filename: "main.c", command: "gcc main.c -O2 -o main && ./main" },
      cpp: { filename: "main.cpp", command: "g++ main.cpp -O2 -o main && ./main" },
      cxx: { filename: "main.cpp", command: "g++ main.cpp -O2 -o main && ./main" },
      csharp: { filename: "Program.cs", command: "rm -rf .skcoder-dotnet && dotnet new console --force --output .skcoder-dotnet >/dev/null && cp Program.cs .skcoder-dotnet/Program.cs && dotnet run --project .skcoder-dotnet" },
      cs: { filename: "Program.cs", command: "rm -rf .skcoder-dotnet && dotnet new console --force --output .skcoder-dotnet >/dev/null && cp Program.cs .skcoder-dotnet/Program.cs && dotnet run --project .skcoder-dotnet" },
      cc: { filename: "main.cpp", command: "g++ main.cpp -O2 -o main && ./main" },
      kotlin: { filename: "Main.kt", command: "kotlinc Main.kt -include-runtime -d main.jar && java -jar main.jar" },
      kt: { filename: "Main.kt", command: "kotlinc Main.kt -include-runtime -d main.jar && java -jar main.jar" },
      kts: { filename: "Main.kts", command: "kotlinc -script Main.kts" },
      rust: { filename: "main.rs", command: "rustc main.rs -O -o main && ./main" },
      rs: { filename: "main.rs", command: "rustc main.rs -O -o main && ./main" },
      go: { filename: "main.go", command: "mkdir -p .go-tmp && TMPDIR=$PWD/.go-tmp go run main.go" },
      php: { filename: "main.php", command: "php main.php" },
      ruby: { filename: "main.rb", command: "ruby main.rb" },
      rb: { filename: "main.rb", command: "ruby main.rb" }
    };
    const selected = config[language.toLowerCase()];
    if (!selected)
      throw new Error(`Unsupported runtime: ${language}`);
    if (stdin.length > 65536)
      throw new Error("Program input exceeds the 64 KB source-run limit.");
    await reserveWorkspaceGrowth(id, Buffer.byteLength(code));
    await mkdir4(hostRunPath, { recursive: true, mode: 493 });
    await chown(hostRunPath, 1e3, 1e3);
    await writeFile4(join4(hostRunPath, selected.filename), code, "utf8");
    try {
      return await runWorkspaceCommand(id, selected.command, runPath, stdin);
    } finally {
      await rm3(hostRunPath, { recursive: true, force: true });
      await reportWorkspaceCapacityUsage(id);
    }
  });
}
function runEphemeralCode(language, code, stdin = "") {
  return ephemeralRunnerQueue.runForUser("ephemeral", async () => {
    const profiles2 = {
      python: { filename: "main.py", command: "python3 main.py" },
      py: { filename: "main.py", command: "python3 main.py" },
      node: { filename: "main.js", command: "node main.js" },
      nodejs: { filename: "main.js", command: "node main.js" },
      javascript: { filename: "main.js", command: "node main.js" },
      js: { filename: "main.js", command: "node main.js" },
      mjs: { filename: "main.mjs", command: "node main.mjs" },
      cjs: { filename: "main.cjs", command: "node main.cjs" },
      typescript: { filename: "main.tsx", command: "tsx main.tsx" },
      ts: { filename: "main.tsx", command: "tsx main.tsx" },
      tsx: { filename: "main.tsx", command: "tsx main.tsx" },
      bash: { filename: "main.sh", command: "bash main.sh" },
      shell: { filename: "main.sh", command: "bash main.sh" },
      java: { filename: "Main.java", command: "javac Main.java && java Main" },
      c: { filename: "main.c", command: "gcc main.c -O2 -o main && ./main" },
      cpp: { filename: "main.cpp", command: "g++ main.cpp -O2 -o main && ./main" },
      cc: { filename: "main.cpp", command: "g++ main.cpp -O2 -o main && ./main" },
      cxx: { filename: "main.cpp", command: "g++ main.cpp -O2 -o main && ./main" },
      csharp: { filename: "Program.cs", command: "dotnet new console --force --output app >/dev/null && cp Program.cs app/Program.cs && dotnet run --project app" },
      cs: { filename: "Program.cs", command: "dotnet new console --force --output app >/dev/null && cp Program.cs app/Program.cs && dotnet run --project app" },
      kotlin: { filename: "Main.kt", command: "kotlinc Main.kt -include-runtime -d main.jar && java -jar main.jar" },
      kt: { filename: "Main.kt", command: "kotlinc Main.kt -include-runtime -d main.jar && java -jar main.jar" },
      kts: { filename: "Main.kts", command: "kotlinc -script Main.kts" },
      rust: { filename: "main.rs", command: "rustc main.rs -O -o main && ./main" },
      rs: { filename: "main.rs", command: "rustc main.rs -O -o main && ./main" },
      go: { filename: "main.go", command: "mkdir -p .go-tmp && TMPDIR=$PWD/.go-tmp go run main.go" },
      php: { filename: "main.php", command: "php main.php" },
      ruby: { filename: "main.rb", command: "ruby main.rb" },
      rb: { filename: "main.rb", command: "ruby main.rb" }
    };
    const profile = profiles2[language.toLowerCase()];
    if (!profile)
      throw new Error(`Unsupported runtime: ${language}`);
    if (Buffer.byteLength(code) > RUNNER_SCRATCH_MAX_BYTES || Buffer.byteLength(stdin) > 65536)
      throw new Error("Runner input exceeds the isolated execution limit.");
    if (!await ensureDockerReady())
      throw new Error("The isolated runtime service is not available.");
    await ensureCapacity(Buffer.byteLength(code));
    const id = randomUUID4();
    const root = runnerPathFor(id);
    const containerName = `skcoder-runner-${id.replaceAll("-", "")}`;
    try {
      await mkdir4(root, { recursive: true, mode: 493 });
      await chown(root, 1e3, 1e3);
      await chmod(root, 493);
      await writeFile4(join4(root, profile.filename), code, "utf8");
      await createRuntimeOperation({ id: `runner:${id}`, ownerId: id, kind: "runner", resources: [`container:${containerName}`, `path:${root}`], expiresAt: Date.now() + COMMAND_TIMEOUT_MS + 6e4 });
      return await run("docker", [
        "run",
        "--rm",
        "--name",
        containerName,
        "--label",
        "skcoder.runner=true",
        "--label",
        `skcoder.instance=${BACKEND_INSTANCE_ID}`,
        "--network",
        "none",
        "--memory",
        "768m",
        "--memory-swap",
        "768m",
        "--cpus",
        "1",
        "--pids-limit",
        "256",
        "--cap-drop",
        "ALL",
        "--security-opt",
        "no-new-privileges",
        "--user",
        "1000:1000",
        "-v",
        `${root}:/run:rw`,
        "-w",
        "/run",
        "--tmpfs",
        "/tmp:rw,size=128m,mode=1777",
        RUNTIME_IMAGE,
        "bash",
        "-lc",
        profile.command
      ], COMMAND_TIMEOUT_MS, stdin);
    } finally {
      await beginRuntimeOperationFinalization(`runner:${id}`, id, "runner");
      try {
        await run("docker", ["rm", "-f", containerName], 1e4);
        await rm3(root, { recursive: true, force: true });
        await completeRuntimeOperationFinalization(`runner:${id}`, id, "runner");
      } catch (error) {
        await failRuntimeOperationFinalization(`runner:${id}`, id, error);
        throw error;
      }
    }
  });
}
async function openInteractiveTerminal(id, onStdout, _onStderr, onClose, size, terminalId = "shell") {
  const session = await getWorkspaceSession(id);
  const cols = Math.min(240, Math.max(40, Math.floor(size?.cols ?? 100)));
  const rows = Math.min(120, Math.max(12, Math.floor(size?.rows ?? 30)));
  const tmuxSession = durableTerminalSessionName(terminalId);
  const promptBootstrap = terminalBootstrapCommand();
  const exec = await docker.getContainer(session.containerName).exec({
    AttachStdin: true,
    AttachStdout: true,
    AttachStderr: true,
    Tty: true,
    User: "1000:1000",
    WorkingDir: "/workspace",
    Env: ["HOME=/workspace", "TERM=xterm-256color"],
    Cmd: ["bash", "-lc", `if command -v tmux >/dev/null 2>&1; then tmux has-session -t ${tmuxSession} 2>/dev/null || tmux new-session -d -s ${tmuxSession} bash -lc ${shellQuote(promptBootstrap)}; tmux set-option -t ${tmuxSession} status off; exec tmux attach-session -d -t ${tmuxSession}; else ${promptBootstrap}; fi`]
  });
  const stream = await exec.start({ hijack: true, stdin: true });
  const output = new PassThrough();
  docker.modem.demuxStream(stream, output, output);
  activeInteractiveTerminals.set(id, (activeInteractiveTerminals.get(id) ?? 0) + 1);
  const closeOnce = onceTerminalClose((code) => {
    const remaining = Math.max(0, (activeInteractiveTerminals.get(id) ?? 1) - 1);
    if (remaining === 0)
      activeInteractiveTerminals.delete(id);
    else
      activeInteractiveTerminals.set(id, remaining);
    onClose(code);
  });
  let initialized = false;
  let startupOutput = "";
  let resolveInitialized = null;
  let rejectInitialized = null;
  const initializedSignal = new Promise((resolveInitializedSignal, rejectInitializedSignal) => {
    resolveInitialized = resolveInitializedSignal;
    rejectInitialized = rejectInitializedSignal;
  });
  output.on("data", (value) => {
    const data = value.toString();
    if (initialized) {
      onStdout(data);
      return;
    }
    startupOutput += data;
    const marker = /__SK_CODER_CWD__\/workspace(?:\/[^\r\n\x1b]*)?(?:\x1b\[[0-?]*[ -\/]*[@-~])*\r?\n/.exec(startupOutput);
    const promptSeen = /(?:^|\r?\n)[$#] $|bash-\d+\.\d+[$#]/m.test(startupOutput);
    if (!marker && !promptSeen)
      return;
    initialized = true;
    if (!marker) {
      onStdout(startupOutput);
      startupOutput = "";
      resolveInitialized?.();
      return;
    }
    const markerEnd = marker.index + marker[0].length;
    onStdout(marker[0]);
    const remainder = startupOutput.slice(markerEnd);
    startupOutput = "";
    if (remainder)
      onStdout(remainder);
    resolveInitialized?.();
  });
  stream.once("end", () => closeOnce(0));
  stream.once("close", () => closeOnce(0));
  stream.once("error", () => {
    rejectInitialized?.(new Error("Terminal transport closed before Bash initialized."));
    closeOnce(1);
  });
  let resizeError;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      await exec.resize({ h: rows, w: cols });
      resizeError = void 0;
      break;
    } catch (error) {
      resizeError = error;
      if (!isTransientTerminalResizeError(error) || attempt === 4)
        break;
      await new Promise((resolveResult) => setTimeout(resolveResult, 100));
    }
  }
  if (resizeError)
    throw resizeError;
  const initializedTimeout = setTimeout(() => rejectInitialized?.(new Error("Terminal prompt did not initialize.")), 5e3);
  try {
    await initializedSignal;
  } catch (error) {
    closeOnce(1);
    stream.destroy();
    throw error;
  } finally {
    clearTimeout(initializedTimeout);
  }
  return {
    write: (data) => stream.write(data),
    resize: (nextCols, nextRows) => {
      void exec.resize({ h: Math.min(120, Math.max(12, Math.floor(nextRows))), w: Math.min(240, Math.max(40, Math.floor(nextCols))) });
    },
    detach: () => stream.destroy(),
    kill: () => {
      stream.write("d");
      setTimeout(() => stream.destroy(), 25);
    }
  };
}
function terminateInteractiveTerminal(proc) {
  proc.kill();
}
var RUNTIME_PROBE_DEFINITIONS = [
  { name: "node", label: "Node.js", command: `node -e "console.log('node-ok')"` },
  { name: "csharp", label: ".NET / C#", command: `rm -rf /tmp/sk-coder-dotnet && dotnet new console --force --output /tmp/sk-coder-dotnet >/dev/null && printf 'Console.WriteLine("csharp-ok");\\n' >/tmp/sk-coder-dotnet/Program.cs && dotnet run --project /tmp/sk-coder-dotnet` },
  { name: "typescript", label: "TypeScript", command: `tsx -e "const value: number = 1; console.log('typescript-ok', value)"` },
  { name: "python", label: "Python with NumPy", command: `python3 -c "import numpy; print('python-numpy-ok', numpy.__version__)"` },
  { name: "c", label: "C", command: "printf 'int main(void){return 0;}\\n' >/tmp/main.c && gcc /tmp/main.c -o /tmp/main-c && /tmp/main-c" },
  { name: "cpp", label: "C++", command: `printf '#include <iostream>\\nint main(){std::cout << \\"cpp-ok\\\\n\\";}\\n' >/tmp/main.cpp && g++ /tmp/main.cpp -o /tmp/main-cpp && /tmp/main-cpp` },
  { name: "java", label: "Java", command: `printf 'class Main { public static void main(String[] args) { System.out.println(\\"java-ok\\"); } }\\n' >/tmp/Main.java && javac /tmp/Main.java && java -cp /tmp Main` },
  { name: "kotlin", label: "Kotlin script", command: `printf 'println(\\"kotlin-ok\\")\\n' >/tmp/main.kts && kotlinc -script /tmp/main.kts` },
  { name: "rust", label: "Rust", command: `printf 'fn main(){println!("rust-ok");}\\n' >/tmp/main.rs && rustc /tmp/main.rs -o /tmp/main-rust && /tmp/main-rust` },
  { name: "go", label: "Go", command: `printf 'package main\\nimport "fmt"\\nfunc main(){fmt.Println("go-ok")}\\n' >/tmp/main.go && go run /tmp/main.go` },
  { name: "php", label: "PHP", command: `php -r "echo 'php-ok\\n';"` },
  { name: "ruby", label: "Ruby", command: `ruby -e "puts 'ruby-ok'"` },
  { name: "bash", label: "Bash", command: `bash -lc "printf 'bash-ok\\n'"` }
];
var TERMINAL_TOOL_PROBE_DEFINITIONS = [
  { name: "bash", label: "Bash" },
  { name: "tmux", label: "tmux" },
  { name: "dotnet", label: ".NET SDK" },
  { name: "node", label: "Node.js" },
  { name: "npm", label: "npm" },
  { name: "npx", label: "npx" },
  { name: "pnpm", label: "pnpm" },
  { name: "yarn", label: "Yarn" },
  { name: "git", label: "Git" },
  { name: "python3", label: "Python" },
  { name: "pip3", label: "pip" },
  { name: "gcc", label: "GCC" },
  { name: "g++", label: "G++" },
  { name: "javac", label: "Java compiler" },
  { name: "kotlinc", label: "Kotlin compiler" },
  { name: "cargo", label: "Cargo" },
  { name: "go", label: "Go" },
  { name: "php", label: "PHP" },
  { name: "ruby", label: "Ruby" },
  { name: "mvn", label: "Maven" },
  { name: "gradle", label: "Gradle" },
  { name: "cmake", label: "CMake" },
  { name: "composer", label: "Composer" },
  { name: "bundle", label: "Bundler" }
];
async function probeRuntimeImage(force = false) {
  if (!force && runtimeProbeCache && runtimeProbeCache.expiresAt > Date.now())
    return runtimeProbeCache.probes;
  if (!await ensureDockerReady()) {
    const probes2 = RUNTIME_PROBE_DEFINITIONS.map((definition) => ({ name: definition.name, label: definition.label, available: false, output: "The isolated runtime service is not available.", exitCode: 1 }));
    runtimeProbeCache = { probes: probes2, expiresAt: Date.now() + 5e3 };
    return probes2;
  }
  const probes = [];
  for (const definition of RUNTIME_PROBE_DEFINITIONS) {
    const result = await run("docker", ["run", "--rm", "--network", "none", "--user", "1000:1000", "--tmpfs", "/tmp:rw,size=64m,mode=1777,exec", RUNTIME_IMAGE, "bash", "-lc", definition.command], 3e4);
    probes.push({ name: definition.name, label: definition.label, available: result.exitCode === 0, output: `${result.stdout}${result.stderr}`.trim().slice(0, 1200), exitCode: result.exitCode });
  }
  runtimeProbeCache = { probes, expiresAt: Date.now() + 6e4 };
  return probes;
}
async function probeTerminalTools(force = false) {
  if (!force && terminalToolProbeCache && terminalToolProbeCache.expiresAt > Date.now())
    return terminalToolProbeCache.probes;
  if (!await ensureDockerReady()) {
    const probes2 = TERMINAL_TOOL_PROBE_DEFINITIONS.map((definition) => ({ name: definition.name, label: definition.label, available: false, output: "The isolated runtime service is not available.", exitCode: 1 }));
    terminalToolProbeCache = { probes: probes2, expiresAt: Date.now() + 5e3 };
    return probes2;
  }
  const names = TERMINAL_TOOL_PROBE_DEFINITIONS.map((definition) => definition.name).join(" ");
  const command = `for tool in ${names}; do if command -v "$tool" >/dev/null 2>&1; then printf '%s|1|%s\\n' "$tool" "$(command -v "$tool")"; else printf '%s|0|missing\\n' "$tool"; fi; done`;
  const result = await run("docker", ["run", "--rm", "--network", "none", "--user", "1000:1000", "--tmpfs", "/tmp:rw,size=64m,mode=1777", RUNTIME_IMAGE, "bash", "-lc", command], 3e4);
  const availability = new Map(result.stdout.split("\n").filter(Boolean).map((line) => {
    const [name, available, output] = line.split("|", 3);
    return [name, { available: available === "1", output: output || "missing" }];
  }));
  const probes = TERMINAL_TOOL_PROBE_DEFINITIONS.map((definition) => {
    const value = availability.get(definition.name);
    return { name: definition.name, label: definition.label, available: result.exitCode === 0 && value?.available === true, output: value?.output ?? (result.stderr.trim() || "missing"), exitCode: result.exitCode };
  });
  terminalToolProbeCache = { probes, expiresAt: Date.now() + 6e4 };
  return probes;
}
async function workspaceStatus() {
  startCleanup();
  await removeExpiredWorkspaceSessions();
  await suspendScheduledWorkspaceRuntimes();
  const [disk, activeSessions] = await Promise.all([
    run("df", ["-B1", "--output=size,used,avail", WORKSPACE_ROOT], 5e3),
    activeRuntimeCount()
  ]);
  return {
    ready: await ensureDockerReady(),
    activeSessions,
    runnerQueue: ephemeralRunnerQueue.status(),
    image: RUNTIME_IMAGE,
    capacity: {
      workspaceMaxBytes: WORKSPACE_MAX_BYTES,
      sessionMaxBytes: SESSION_MAX_BYTES,
      safetyReserveBytes: WORKSPACE_SAFETY_RESERVE_BYTES,
      disk: disk.exitCode === 0 ? disk.stdout.trim().split("\n").at(-1) : null
    }
  };
}
async function getWorkspaceLifecycle(id) {
  const record = await getWorkspaceRecord(id);
  if (!record)
    throw new Error("Workspace session not found or expired.");
  return record;
}
async function recordWorkspaceActivity(id) {
  const record = await touchWorkspaceRecord(id);
  if (!record)
    throw new Error("Workspace session not found or expired.");
  return record;
}
async function updateWorkspaceRetention(id, retentionMode) {
  const record = await setWorkspaceRetention(id, retentionMode);
  if (!record)
    throw new Error("Workspace session not found or expired.");
  await updateRuntimeOperationExpiry(`terminal:${id}`, id, record.expiresAt);
  await updateRuntimeOperationExpiry(workplaceOperationId(id), id, record.expiresAt);
  const session = sessions.get(id);
  if (session)
    session.retentionMode = retentionMode;
  return record;
}
async function updateWorkspaceKeepAlive(id, keepAlive) {
  const record = await setWorkspaceKeepAlive(id, keepAlive);
  if (!record)
    throw new Error("Workspace session not found or expired.");
  return record;
}
async function scheduleWorkspaceDeletion(id) {
  const record = await scheduleWorkspaceDelete(id);
  if (!record)
    throw new Error("Workspace session not found or expired.");
  await updateRuntimeOperationExpiry(`terminal:${id}`, id, record.expiresAt);
  await updateRuntimeOperationExpiry(workplaceOperationId(id), id, record.expiresAt);
  await suspendWorkspaceRuntime(id);
  return record;
}
async function cancelWorkspaceDeletion(id) {
  const record = await cancelWorkspaceDelete(id);
  if (!record)
    throw new Error("Workspace session not found or expired.");
  await updateRuntimeOperationExpiry(`terminal:${id}`, id, record.expiresAt);
  await updateRuntimeOperationExpiry(workplaceOperationId(id), id, record.expiresAt);
  return record;
}
async function destroyWorkspaceSession(id) {
  const session = sessions.get(id);
  const containerName = session?.containerName ?? containerNameFor(id);
  const workspacePath = session?.workspacePath ?? workspacePathFor(id);
  sessions.delete(id);
  for (const stage of stages.values())
    if (stage.sessionId === id)
      stages.delete(stage.id);
  await beginRuntimeOperationFinalization(`terminal:${id}`, id, "terminal");
  await beginRuntimeOperationFinalization(workplaceOperationId(id), id, "workplace");
  try {
    await run("docker", ["rm", "-f", containerName], 1e4);
    await Promise.all([
      rm3(workspacePath, { recursive: true, force: true }),
      rm3(resolve2(WORKSPACE_ROOT, ".staging", id), { recursive: true, force: true })
    ]);
    await markWorkspaceDeleted(id);
    await completeRuntimeOperationFinalization(`terminal:${id}`, id, "terminal");
    await completeRuntimeOperationFinalization(workplaceOperationId(id), id, "workplace");
  } catch (error) {
    await failRuntimeOperationFinalization(`terminal:${id}`, id, error);
    await failRuntimeOperationFinalization(workplaceOperationId(id), id, error);
    throw error;
  }
}
async function removeExpiredWorkspaceSessions() {
  for (const record of await listExpiredWorkspaceRecords())
    await destroyWorkspaceSession(record.id);
}
async function suspendScheduledWorkspaceRuntimes() {
  for (const record of await listScheduledWorkspaceRecords()) {
    await suspendWorkspaceRuntime(record.id);
  }
}
function operationPathIsOwned(kind, pathname) {
  const roots = {
    staging: resolve2(WORKSPACE_ROOT, ".staging"),
    runner: resolve2(WORKSPACE_ROOT, ".runs"),
    apk: resolve2(WORKSPACE_ROOT, ".apk-jobs")
  };
  const root = roots[kind];
  if (!root)
    return false;
  const relation = relative(root, pathname);
  return Boolean(relation && relation !== ".." && !relation.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`));
}
function operationContainerIsOwned(name) {
  return /^skcoder-(?:runner|gui|preview|apk)-[a-z0-9]+(?:-build)?$/.test(name);
}
async function recoverExpiredRuntimeOperations() {
  for (const operation of await listExpiredRuntimeOperations()) {
    const current = await beginRuntimeOperationFinalization(operation.id, operation.ownerId, operation.kind);
    if (!current)
      continue;
    try {
      for (const resource of current.resources) {
        if (resource.startsWith("container:")) {
          const name = resource.slice("container:".length);
          if (operationContainerIsOwned(name))
            await run("docker", ["rm", "-f", name], 1e4);
        }
        if (resource.startsWith("path:")) {
          const pathname = resource.slice("path:".length);
          if (operationPathIsOwned(current.kind, pathname))
            await rm3(pathname, { recursive: true, force: true });
        }
      }
      await completeRuntimeOperationFinalization(current.id, current.ownerId, current.kind);
    } catch (error) {
      await failRuntimeOperationFinalization(current.id, current.ownerId, error);
    }
  }
}
function startCleanup() {
  if (cleanupStarted)
    return;
  cleanupStarted = true;
  void removeExpiredWorkspaceSessions();
  void suspendScheduledWorkspaceRuntimes();
  void recoverExpiredRuntimeOperations();
  const timer = setInterval(async () => {
    await suspendIdleWorkspaceRuntimes();
    await removeExpiredWorkspaceSessions();
    await suspendScheduledWorkspaceRuntimes();
    await recoverExpiredRuntimeOperations();
  }, 5 * 60 * 1e3);
  timer.unref();
}

// src/lib/runtimeRegistry.ts
var installedRuntimes = [
  { name: "node", label: "Node.js", family: "web", extensions: ["js", "mjs", "cjs"], packageManagers: ["npm", "pnpm", "yarn"], supportsWorkspace: true, supportsSourceFallback: true },
  { name: "typescript", label: "TypeScript", family: "web", extensions: ["ts", "tsx"], packageManagers: ["npm", "pnpm", "yarn"], supportsWorkspace: true, supportsSourceFallback: false },
  { name: "python", label: "Python with NumPy", family: "python", extensions: ["py"], packageManagers: ["pip"], supportsWorkspace: true, supportsSourceFallback: true },
  { name: "java", label: "Java", family: "jvm", extensions: ["java"], packageManagers: [], supportsWorkspace: true, supportsSourceFallback: true },
  { name: "kotlin", label: "Kotlin", family: "jvm", extensions: ["kt", "kts"], packageManagers: [], supportsWorkspace: true, supportsSourceFallback: false },
  { name: "csharp", label: ".NET / C#", family: "dotnet", extensions: ["cs", "csproj", "sln"], packageManagers: ["dotnet"], supportsWorkspace: true, supportsSourceFallback: false },
  { name: "c", label: "C", family: "native", extensions: ["c"], packageManagers: [], supportsWorkspace: true, supportsSourceFallback: true },
  { name: "cpp", label: "C++", family: "native", extensions: ["cc", "cpp", "cxx", "h", "hpp"], packageManagers: [], supportsWorkspace: true, supportsSourceFallback: true },
  { name: "rust", label: "Rust", family: "systems", extensions: ["rs"], packageManagers: ["cargo"], supportsWorkspace: true, supportsSourceFallback: true },
  { name: "go", label: "Go", family: "systems", extensions: ["go"], packageManagers: ["go"], supportsWorkspace: true, supportsSourceFallback: true },
  { name: "php", label: "PHP", family: "scripting", extensions: ["php"], packageManagers: ["composer"], supportsWorkspace: true, supportsSourceFallback: true },
  { name: "ruby", label: "Ruby", family: "scripting", extensions: ["rb"], packageManagers: ["bundle"], supportsWorkspace: true, supportsSourceFallback: true },
  { name: "bash", label: "Bash", family: "shell", extensions: ["sh", "bash"], packageManagers: [], supportsWorkspace: true, supportsSourceFallback: false }
];

// src/lib/runtimeProfileResolver.ts
var profiles = [
  { id: "node", state: "oracle-runner", label: "Node.js and TypeScript", extensions: ["js", "mjs", "cjs", "ts", "tsx"], markers: ["package.json", "pnpm-lock.yaml", "yarn.lock", "package-lock.json"] },
  { id: "python", state: "oracle-runner", label: "Python", extensions: ["py"], markers: ["pyproject.toml", "requirements.txt", "poetry.lock", "pipfile"] },
  { id: "native", state: "oracle-runner", label: "C and C++", extensions: ["c", "cc", "cpp", "cxx", "h", "hpp"], markers: ["cmakelists.txt", "makefile", "meson.build"] },
  { id: "jvm", state: "oracle-runner", label: "Java and Kotlin", extensions: ["java", "kt", "kts"], markers: ["pom.xml", "build.gradle", "build.gradle.kts", "settings.gradle", "settings.gradle.kts"] },
  { id: "dotnet", state: "oracle-runner", label: ".NET", extensions: ["cs", "fs", "vb", "csproj", "fsproj", "sln"], markers: ["global.json", "nuget.config"] },
  { id: "systems", state: "oracle-runner", label: "Rust and Go", extensions: ["rs", "go"], markers: ["cargo.toml", "go.mod"] },
  { id: "scripting", state: "oracle-runner", label: "PHP, Ruby, and Bash", extensions: ["php", "rb", "sh", "bash"], markers: ["composer.json", "gemfile", ".ruby-version"] },
  { id: "browser", state: "browser", label: "Browser preview", extensions: ["html", "htm", "css", "svg"], markers: ["vite.config.ts", "vite.config.js"] },
  { id: "mobile", state: "special-worker", label: "Android and Flutter", extensions: ["apk", "aab", "apks", "xapk", "dart", "gradle", "properties", "xml"], markers: ["androidmanifest.xml", "pubspec.yaml", "settings.gradle"] },
  { id: "gui", state: "special-worker", label: "GUI and game", extensions: ["gd", "godot", "love", "unity", "csx"], markers: ["project.godot", "projectsettings.asset"] },
  { id: "hardware", state: "special-worker", label: "Hardware and blockchain", extensions: ["v", "sv", "vhd", "vhdl", "sol", "vy", "move", "cairo"], markers: ["foundry.toml", "hardhat.config.ts", "verilator.yml"] },
  { id: "licensed", state: "licensed-platform", label: "Licensed or platform-specific", extensions: ["swift", "m", "mm", "matlab", "sas", "do", "abap", "cls", "trigger"], markers: ["package.swift", "xcodeproj", "xcworkspace"] },
  { id: "broad-editable", state: "editable", label: "Recognized editable source", extensions: ["ada", "adb", "ads", "agda", "apl", "asm", "bas", "bf", "clj", "cljs", "cljc", "cob", "cobol", "cr", "crystal", "d", "dart", "elm", "elixir", "ex", "exs", "erl", "hrl", "fsx", "f90", "f95", "for", "forth", "gleam", "groovy", "gvy", "hs", "idr", "janet", "jl", "lisp", "lsp", "lua", "mojo", "nim", "odin", "ml", "mli", "pas", "pp", "pl", "pm", "pony", "pro", "r", "rkt", "scm", "ss", "scala", "sc", "smalltalk", "st", "tcl", "tk", "zig"], markers: [] }
];
function runtimeProfileCatalog() {
  return profiles.map((profile) => ({ ...profile, extensions: [...profile.extensions], markers: [...profile.markers] }));
}

// src/routes/execute.ts
var router5 = Router5();
router5.param("id", async (req, res, next, id) => {
  try {
    if (await authorizeTerminalSession(id, req.header("x-sk-workspace-access"))) {
      next();
      return;
    }
    res.status(403).json({ error: "Workspace access is not valid for this browser session." });
  } catch {
    res.status(403).json({ error: "Workspace access is not valid for this browser session." });
  }
});
router5.get("/execute/status", async (_req, res) => {
  res.json(await workspaceStatus());
});
router5.get("/execute/runtimes", async (_req, res) => {
  const [status, probes] = await Promise.all([workspaceStatus(), probeRuntimeImage()]);
  const availability = new Map(probes.map((probe) => [probe.name, probe.available]));
  res.json({ runtimes: installedRuntimes.map((runtime) => ({ ...runtime, available: status.ready && availability.get(runtime.name) === true, tier: "oracle-workspace" })), profiles: runtimeProfileCatalog(), status });
});
router5.get("/execute/runtimes/probe", async (req, res) => {
  const probes = await probeRuntimeImage(req.query.force === "true");
  res.json({ image: (await workspaceStatus()).image, probes });
});
router5.get("/execute/shell-tools/probe", async (req, res) => {
  const probes = await probeTerminalTools(req.query.force === "true");
  res.json({ image: (await workspaceStatus()).image, probes });
});
router5.post("/execute/sessions", async (req, res) => {
  try {
    const requestedRetention = req.body?.retentionMode;
    const retentionMode = requestedRetention === "four-hours" ? "four-hours" : "three-days";
    const session = await createWorkspaceSession({ retentionMode, startRuntime: req.body?.startRuntime !== false, keepAlive: req.body?.keepAlive === true });
    const lifecycle = await getWorkspaceLifecycle(session.id);
    res.status(201).json({ id: session.id, terminalAccessToken: session.terminalAccessToken, cwd: "/", expiresAt: lifecycle.expiresAt, retentionMode: lifecycle.retentionMode, quotaBytes: lifecycle.quotaBytes, tier: "oracle-workspace" });
  } catch (error) {
    res.status(503).json({ error: error instanceof Error ? error.message : "Session service unavailable." });
  }
});
router5.get("/execute/sessions/:id", async (req, res) => {
  try {
    res.json({ ...await getWorkspaceLifecycle(req.params.id), tier: "oracle-workspace" });
  } catch (error) {
    res.status(404).json({ error: error instanceof Error ? error.message : "Workspace session not found." });
  }
});
router5.get("/execute/sessions/:id/manifest", async (req, res) => {
  try {
    res.json(await getWorkspaceManifest(req.params.id));
  } catch (error) {
    res.status(404).json({ error: error instanceof Error ? error.message : "Workspace session not found." });
  }
});
router5.post("/execute/sessions/:id/heartbeat", async (req, res) => {
  try {
    const lifecycle = await recordWorkspaceActivity(req.params.id);
    res.json({ ...lifecycle, tier: "oracle-workspace" });
  } catch (error) {
    res.status(404).json({ error: error instanceof Error ? error.message : "Workspace session not found." });
  }
});
router5.put("/execute/sessions/:id/retention", async (req, res) => {
  const requestedRetention = req.body?.retentionMode;
  if (requestedRetention !== void 0 && requestedRetention !== "three-days" && requestedRetention !== "four-hours")
    return res.status(400).json({ error: "retentionMode must be three-days or four-hours" });
  try {
    const lifecycle = requestedRetention === void 0 ? await updateWorkspaceKeepAlive(req.params.id, req.body?.keepAlive === true) : await updateWorkspaceRetention(req.params.id, requestedRetention);
    res.json({ ...lifecycle, tier: "oracle-workspace" });
  } catch (error) {
    res.status(404).json({ error: error instanceof Error ? error.message : "Workspace session not found." });
  }
});
router5.post("/execute/sessions/:id/delete", async (req, res) => {
  try {
    res.json({ ...await scheduleWorkspaceDeletion(req.params.id), tier: "oracle-workspace" });
  } catch (error) {
    res.status(404).json({ error: error instanceof Error ? error.message : "Workspace session not found." });
  }
});
router5.post("/execute/sessions/:id/cancel-delete", async (req, res) => {
  try {
    res.json({ ...await cancelWorkspaceDeletion(req.params.id), tier: "oracle-workspace" });
  } catch (error) {
    res.status(404).json({ error: error instanceof Error ? error.message : "Workspace session not found." });
  }
});
router5.post("/execute/sessions/:id/files", async (req, res) => {
  const files = req.body?.files;
  if (!Array.isArray(files))
    return res.status(400).json({ error: "files must be an array" });
  try {
    await syncWorkspaceFiles(req.params.id, files.map((file) => {
      const item = file;
      return { path: String(item.path ?? ""), content: String(item.content ?? ""), encoding: item.encoding === "base64" ? "base64" : "utf8" };
    }));
    res.status(204).end();
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "Workspace synchronization failed." });
  }
});
router5.post("/execute/sessions/:id/stage/manifest", async (req, res) => {
  const files = req.body?.files;
  if (!Array.isArray(files))
    return res.status(400).json({ error: "files must be an array" });
  try {
    const baseRevision = Number(req.body?.baseRevision);
    const deletedPaths = Array.isArray(req.body?.deletedPaths) && req.body.deletedPaths.every((path5) => typeof path5 === "string") ? req.body.deletedPaths : void 0;
    res.status(201).json(await beginWorkspaceStage(req.params.id, files, typeof req.body?.stageId === "string" ? req.body.stageId : void 0, { baseRevision: Number.isSafeInteger(baseRevision) ? baseRevision : void 0, deletedPaths }));
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "Unable to create staging session." });
  }
});
router5.get("/execute/sessions/:id/stage/:stageId", async (req, res) => {
  try {
    res.json(await getWorkspaceStageStatus(req.params.id, req.params.stageId));
  } catch (error) {
    res.status(404).json({ error: error instanceof Error ? error.message : "Staging session not found." });
  }
});
router5.put("/execute/sessions/:id/stage/:stageId/chunk", express.raw({ type: "application/octet-stream", limit: "8mb" }), async (req, res) => {
  const path5 = req.header("x-stage-path");
  const offset = Number(req.header("x-stage-offset"));
  if (!path5 || !Number.isSafeInteger(offset) || !Buffer.isBuffer(req.body))
    return res.status(400).json({ error: "Binary body, x-stage-path, and x-stage-offset are required." });
  try {
    res.status(201).json(await writeWorkspaceStageChunk(req.params.id, req.params.stageId, path5, offset, req.body, req.header("x-stage-checksum") ?? void 0));
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "Chunk transfer failed." });
  }
});
router5.post("/execute/sessions/:id/stage/:stageId/commit", async (req, res) => {
  try {
    res.json(await commitWorkspaceStage(req.params.id, req.params.stageId));
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "Staging commit failed." });
  }
});
router5.delete("/execute/sessions/:id/stage/:stageId", async (req, res) => {
  try {
    await removeWorkspaceStage(req.params.id, req.params.stageId);
    res.status(204).end();
  } catch (error) {
    res.status(404).json({ error: error instanceof Error ? error.message : "Staging session not found." });
  }
});
router5.post("/execute/sessions/:id/command", async (req, res) => {
  const { command, cwd } = req.body;
  if (!command?.trim())
    return res.status(400).json({ error: "command is required" });
  try {
    res.json({ ...await runWorkspaceCommand(req.params.id, command, cwd || "/"), tier: "oracle-workspace" });
  } catch (error) {
    res.status(400).json({ stdout: "", stderr: error instanceof Error ? error.message : "Command failed.", exitCode: 1, executionTime: 0, tier: "oracle-workspace" });
  }
});
router5.post("/execute/sessions/:id/dependencies", async (req, res) => {
  const manager = req.body?.manager;
  const mode = req.body?.mode;
  const cwd = req.body?.cwd;
  const packages = req.body?.packages;
  if (!["npm", "pnpm", "yarn"].includes(manager) || !["install", "ci"].includes(mode) || cwd !== void 0 && typeof cwd !== "string" || packages !== void 0 && (!Array.isArray(packages) || packages.some((entry) => typeof entry !== "string"))) {
    return res.status(400).json({ error: "manager, mode, and optional cwd are invalid." });
  }
  try {
    res.json({ ...await installWorkspaceDependencies(req.params.id, manager, mode, cwd || "/", packages || []), lifecycleScriptsDisabled: true, tier: "isolated-dependency-installer" });
  } catch (error) {
    res.status(400).json({ stdout: "", stderr: error instanceof Error ? error.message : "Dependency installation failed.", exitCode: 1, executionTime: 0, lifecycleScriptsDisabled: true, tier: "isolated-dependency-installer" });
  }
});
router5.post("/execute", async (req, res) => {
  const { language, code, sessionId, stdin } = req.body;
  if (!language || code === void 0)
    return res.status(400).json({ error: "language and code are required" });
  try {
    if (sessionId && !await authorizeTerminalSession(sessionId, req.header("x-sk-workspace-access")))
      return res.status(403).json({ error: "Workspace access is not valid for this browser session." });
    const result = sessionId ? await runCodeInWorkspace(sessionId, language, code, typeof stdin === "string" ? stdin : "") : await runEphemeralCode(language, code, typeof stdin === "string" ? stdin : "");
    res.json({ ...result, ...sessionId ? { sessionId } : {}, tier: "oracle-workspace" });
  } catch (error) {
    res.status(503).json({ stdout: "", stderr: error instanceof Error ? error.message : "Execution service unavailable.", exitCode: 1, executionTime: 0, error: "runtime-unavailable", tier: "unavailable" });
  }
});
var execute_default = router5;

// src/routes/download.ts
import { Router as Router6 } from "express";
import { join as join5, dirname as dirname5 } from "path";
import { fileURLToPath } from "url";
import { spawn as spawn2 } from "child_process";
var router6 = Router6();
var __filename = fileURLToPath(import.meta.url);
var __dirname = dirname5(__filename);
var WORKSPACE_DIR = join5(__dirname, "../../../");
router6.get("/download/source", async (req, res) => {
  res.setHeader("Content-Type", "application/gzip");
  res.setHeader("Content-Disposition", "attachment; filename=sk-coder-source.tar.gz");
  const excludes = [
    "--exclude=*/node_modules",
    "--exclude=*/.git",
    "--exclude=*/dist",
    "--exclude=*/.local",
    "--exclude=*/.cache",
    "--exclude=*/.vite",
    "--exclude=*.log",
    "--exclude=*/.tsbuildinfo"
  ];
  const targets = [
    "artifacts/sk-ide",
    "artifacts/api-server",
    "lib",
    "scripts",
    "package.json",
    "pnpm-workspace.yaml",
    "tsconfig.json",
    "tsconfig.base.json"
  ];
  const tar = spawn2("tar", ["-czf", "-", ...excludes, ...targets], { cwd: WORKSPACE_DIR });
  tar.stdout.pipe(res);
  tar.stderr.on("data", (d) => {
    const msg = d.toString();
    if (!msg.includes("socket ignored") && !msg.includes("Removing leading")) {
      req.log?.warn({ msg }, "tar warning");
    }
  });
  tar.on("error", (err) => {
    if (!res.headersSent) {
      res.status(500).json({ error: err.message });
    }
  });
  tar.on("close", (code) => {
    if (code !== 0 && !res.writableEnded) {
      res.end();
    }
  });
});
var download_default = router6;

// src/routes/admin.ts
import { timingSafeEqual as timingSafeEqual2 } from "node:crypto";
import { Router as Router7 } from "express";
var router7 = Router7();
function isAuthorized(value) {
  const expected = process.env["ADMIN_DASHBOARD_TOKEN"];
  if (!expected || typeof value !== "string")
    return false;
  const left = Buffer.from(value);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual2(left, right);
}
router7.use((req, res, next) => {
  if (!process.env["ADMIN_DASHBOARD_TOKEN"])
    return res.status(404).json({ error: "Administrator dashboard is not configured." });
  if (!isAuthorized(req.header("x-sk-admin-token")))
    return res.status(401).json({ error: "Administrator authorization required." });
  next();
});
router7.get("/admin/summary", async (_req, res) => {
  const [status, records, operations, operational] = await Promise.all([workspaceStatus(), listWorkspaceRecords(), listRuntimeOperations(), collectOperationalMetrics()]);
  const active = records.filter((record) => record.state === "active");
  const scheduledDelete = records.filter((record) => record.state === "scheduled-delete");
  res.json({
    generatedAt: Date.now(),
    capacity: status.capacity,
    activeRuntimeSessions: status.activeSessions,
    runnerQueue: status.runnerQueue,
    operational,
    workspaces: {
      total: records.length,
      active: active.length,
      scheduledDelete: scheduledDelete.length,
      deleted: records.filter((record) => record.state === "deleted").length,
      retainedQuotaBytes: active.reduce((total, record) => total + record.quotaBytes, 0)
    },
    operations: {
      active: operations.filter((operation) => operation.state === "active" || operation.state === "finalizing").length,
      cleanupFailed: operations.filter((operation) => operation.state === "cleanup-failed").length,
      finalized: operations.filter((operation) => operation.state === "finalized").length
    }
  });
});
router7.get("/admin/operations", async (_req, res) => {
  const operations = await listRuntimeOperations();
  res.json({
    operations: operations.map((operation) => ({
      id: operation.id,
      ownerId: operation.ownerId,
      kind: operation.kind,
      resourceCount: operation.resources.length,
      createdAt: operation.createdAt,
      expiresAt: operation.expiresAt,
      state: operation.state,
      cleanupError: operation.cleanupError
    }))
  });
});
router7.get("/admin/workspaces", async (_req, res) => {
  const records = await listWorkspaceRecords();
  res.json({
    workspaces: records.map((record) => ({
      id: record.id,
      createdAt: record.createdAt,
      lastHeartbeatAt: record.lastHeartbeatAt,
      expiresAt: record.expiresAt,
      state: record.state,
      quotaBytes: record.quotaBytes,
      revision: record.revision
    }))
  });
});
router7.post("/admin/workspaces/:id/schedule-delete", async (req, res) => {
  const id = req.params.id;
  if (req.body?.confirmWorkspaceId !== id)
    return res.status(400).json({ error: "Confirm the exact workspace ID before scheduling deletion." });
  const record = await getWorkspaceLifecycle(id).catch(() => null);
  if (!record || record.state !== "active")
    return res.status(404).json({ error: "Active workspace not found." });
  if (Date.now() - record.lastHeartbeatAt < 15 * 60 * 1e3)
    return res.status(409).json({ error: "Workspace is recently active and cannot be scheduled for administrator cleanup." });
  const lifecycle = await scheduleWorkspaceDeletion(id);
  res.json({ lifecycle, message: "Inactive workspace is scheduled for deletion in four hours and can still be undone by its user." });
});
var admin_default = router7;

// src/routes/gui.ts
import { Router as Router8 } from "express";

// src/lib/guiSessionManager.ts
import { randomBytes as randomBytes2, randomUUID as randomUUID5 } from "node:crypto";
import { readFile as readFile6 } from "node:fs/promises";
import { basename, extname, normalize as normalize2, relative as relative2, resolve as resolve3 } from "node:path";
import { spawn as spawn3 } from "node:child_process";
var sessions2 = /* @__PURE__ */ new Map();
var cleanupStarted2 = false;
function run2(command, args, timeout = 3e4) {
  return new Promise((resolveResult) => {
    const proc = spawn3(command, args, { env: { ...process.env, NO_COLOR: "1" } });
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      proc.kill("SIGTERM");
      setTimeout(() => proc.kill("SIGKILL"), 1e3).unref();
    }, timeout);
    proc.stdout.on("data", (value) => {
      stdout += value.toString();
    });
    proc.stderr.on("data", (value) => {
      stderr += value.toString();
    });
    proc.once("error", (error) => {
      clearTimeout(timer);
      resolveResult({ stdout: "", stderr: error.message, exitCode: 127 });
    });
    proc.once("close", (code) => {
      clearTimeout(timer);
      resolveResult({ stdout: stdout.slice(0, 65536), stderr: `${stderr}${timedOut ? "\nCommand timed out." : ""}`.trim(), exitCode: code ?? 1 });
    });
  });
}
function safeRelativePath2(pathname) {
  const value = normalize2(pathname.trim().replace(/^\/+/, "") || ".");
  if (value === "." || value === ".." || value.startsWith("../") || value.startsWith("..\\"))
    throw new Error("A file inside the workspace is required.");
  return value.replaceAll("\\", "/");
}
function shellQuote2(value) {
  return `'${value.replaceAll("'", `'"'"'`)}'`;
}
function containerNameFor2(id) {
  return `skcoder-gui-${id.replaceAll("-", "")}`;
}
function displayPath(session) {
  return `/gui/sessions/${encodeURIComponent(session.id)}/view/${encodeURIComponent(session.token)}/vnc.html?autoconnect=1&resize=scale&reconnect=1`;
}
function publicSession(session) {
  return {
    id: session.id,
    workspaceSessionId: session.workspaceSessionId,
    filePath: session.filePath,
    status: session.containerName ? "running" : "staging",
    expiresAt: session.expiresAt,
    viewPath: session.containerName ? displayPath(session) : null
  };
}
async function activeGuiCount() {
  const result = await run2("docker", ["ps", "--filter", "label=skcoder.gui=true", "--filter", `label=skcoder.instance=${BACKEND_INSTANCE_ID}`, "-q"], 5e3);
  return result.stdout.split("\n").filter(Boolean).length;
}
async function getOwnedSession(id, deviceId3, workspaceAccess) {
  await removeExpiredGuiSessions();
  const session = sessions2.get(id);
  if (!session || session.deviceId !== deviceId3 || !await authorizeTerminalSession(session.workspaceSessionId, workspaceAccess))
    throw new Error("Display session not found or expired.");
  return session;
}
function detectLanguage(filePath, requested) {
  const value = (requested || extname(filePath).slice(1)).toLowerCase();
  if (value === "py" || value === "python")
    return "python";
  if (value === "java")
    return "java";
  throw new Error("Run with Display currently supports Python Tkinter/Pygame and Java Swing/AWT source files.");
}
async function programCommand(workspacePath, filePath, language) {
  const relativePath = safeRelativePath2(filePath);
  if (language === "python")
    return `DISPLAY=:99 python3 ${shellQuote2(`/workspace/${relativePath}`)}`;
  const source = await readFile6(resolve3(workspacePath, relativePath), "utf8");
  const packageName = source.match(/^\s*package\s+([\w.]+)\s*;/m)?.[1];
  const className = basename(relativePath, ".java");
  const mainClass = packageName ? `${packageName}.${className}` : className;
  return `mkdir -p /tmp/skcoder-java && javac -d /tmp/skcoder-java ${shellQuote2(`/workspace/${relativePath}`)} && DISPLAY=:99 java -cp /tmp/skcoder-java ${shellQuote2(mainClass)}`;
}
function parseDockerPort(stdout) {
  const value = (stdout || "").trim();
  if (!value)
    return null;
  const match = value.match(/(?:127\.0\.0\.1|0\.0\.0\.0|\[::\]|::):\s*(\d+)/i) ?? value.match(/:(\d+)$/i);
  const port2 = match?.[1] ? Number(match[1]) : NaN;
  return Number.isSafeInteger(port2) && port2 > 0 ? port2 : null;
}
async function awaitGuiPort(containerName) {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const portResult = await run2("docker", ["port", containerName, "6901/tcp"], 5e3);
    const parsed = parseDockerPort(portResult.stdout);
    if (parsed)
      return parsed;
    await new Promise((resolve6) => setTimeout(resolve6, 250));
  }
  const inspectResult = await run2("docker", ["inspect", containerName, "--format", "{{json .NetworkSettings.Ports}}"], 1e4);
  const inspectPort = Number(inspectResult.stdout.match(/"6901\/tcp":\[[\s\S]*?"HostPort":"?(\d+)"?/)?.[1] ?? "0");
  if (Number.isSafeInteger(inspectPort) && inspectPort > 0)
    return inspectPort;
  return null;
}
async function createGuiSession(deviceId3, workspaceSessionId) {
  await removeExpiredGuiSessions();
  if (await activeGuiCount() >= GUI_SESSION_MAX_COUNT)
    throw new Error("The GUI display queue is full. Try again after the current display session ends.");
  const workspace = workspaceSessionId ? await getWorkspaceSession(workspaceSessionId) : await createWorkspaceSession({ retentionMode: "four-hours" });
  const session = {
    id: randomUUID5(),
    deviceId: deviceId3,
    workspaceSessionId: workspace.id,
    ownsWorkspace: !workspaceSessionId,
    token: randomBytes2(24).toString("base64url"),
    filePath: null,
    language: null,
    containerName: null,
    port: null,
    createdAt: Date.now(),
    expiresAt: Date.now() + GUI_SESSION_TTL_MS
  };
  await createRuntimeOperation({ id: `gui:${session.id}`, ownerId: session.id, kind: "gui", resources: [`workspace:${workspace.id}`], expiresAt: session.expiresAt });
  sessions2.set(session.id, session);
  startCleanup2();
  return publicSession(session);
}
async function launchGuiSession(id, deviceId3, workspaceAccess, filePath, requestedLanguage) {
  const session = await getOwnedSession(id, deviceId3, workspaceAccess);
  if (session.containerName)
    throw new Error("This display session is already running.");
  if (await activeGuiCount() >= GUI_SESSION_MAX_COUNT)
    throw new Error("The GUI display queue is full. Try again after the current display session ends.");
  const language = detectLanguage(filePath, requestedLanguage);
  const workspace = await getWorkspaceSession(session.workspaceSessionId);
  const relativePath = safeRelativePath2(filePath);
  const sourcePath = resolve3(workspace.workspacePath, relativePath);
  if (relative2(workspace.workspacePath, sourcePath).startsWith(".."))
    throw new Error("Display file path escapes the workspace.");
  await readFile6(sourcePath);
  const containerName = containerNameFor2(session.id);
  const started = await run2("docker", [
    "run",
    "-d",
    "--rm",
    "--name",
    containerName,
    "--label",
    "skcoder.gui=true",
    "--label",
    `skcoder.gui-id=${session.id}`,
    "--label",
    `skcoder.instance=${BACKEND_INSTANCE_ID}`,
    "--memory",
    `${GUI_SESSION_MEMORY_MB}m`,
    "--memory-swap",
    `${GUI_SESSION_MEMORY_MB}m`,
    "--cpus",
    "1",
    "--pids-limit",
    "192",
    "--shm-size",
    "256m",
    "--cap-drop",
    "ALL",
    "--security-opt",
    "no-new-privileges",
    "--read-only",
    "--user",
    "1000:1000",
    "-v",
    `${workspace.workspacePath}:/workspace:ro`,
    "--tmpfs",
    "/tmp:rw,noexec,nosuid,size=256m,mode=1777",
    "--tmpfs",
    "/home/coder:rw,nosuid,size=64m,mode=1777",
    "-p",
    "127.0.0.1:0:6901",
    GUI_RUNTIME_IMAGE
  ], 45e3);
  if (started.exitCode !== 0)
    throw new Error(started.stderr || "The GUI runtime could not start.");
  const portResult = await awaitGuiPort(containerName);
  if (!portResult || !Number.isSafeInteger(portResult) || portResult <= 0) {
    const logs = await run2("docker", ["logs", "--tail", "200", containerName], 1e4);
    await run2("docker", ["rm", "-f", containerName], 1e4);
    throw new Error(logs.stdout || logs.stderr || "The GUI runtime did not expose a local display port.");
  }
  const port2 = portResult;
  session.port = port2;
  const command = await programCommand(workspace.workspacePath, filePath, language);
  const launched = await run2("docker", ["exec", "-d", "--user", "1000:1000", "-e", "DISPLAY=:99", "-w", "/workspace", containerName, "bash", "-lc", `${command} > /tmp/skcoder-program.log 2>&1`], 15e3);
  if (launched.exitCode !== 0) {
    await run2("docker", ["rm", "-f", containerName], 1e4);
    throw new Error(launched.stderr || "The graphical program could not start.");
  }
  session.filePath = filePath;
  session.language = language;
  session.containerName = containerName;
  session.port = session.port ?? port2;
  session.expiresAt = Date.now() + GUI_SESSION_TTL_MS;
  await createRuntimeOperation({ id: `gui:${session.id}`, ownerId: session.id, kind: "gui", resources: [`workspace:${session.workspaceSessionId}`, `container:${containerName}`], expiresAt: session.expiresAt });
  return publicSession(session);
}
async function getGuiDisplayTarget(id, token) {
  await removeExpiredGuiSessions();
  const session = sessions2.get(id);
  if (!session || session.token !== token || !session.port || !session.containerName)
    throw new Error("Display session not found or expired.");
  return { port: session.port };
}
async function getGuiSessionStatus(id, deviceId3, workspaceAccess) {
  const session = await getOwnedSession(id, deviceId3, workspaceAccess);
  let log = "";
  if (session.containerName) {
    const result = await run2("docker", ["exec", "--user", "1000:1000", session.containerName, "bash", "-lc", "tail -c 16384 /tmp/skcoder-program.log 2>/dev/null || true"], 1e4);
    log = result.stdout;
  }
  return { ...publicSession(session), log };
}
async function stopGuiSession(id, deviceId3, workspaceAccess) {
  const session = await getOwnedSession(id, deviceId3, workspaceAccess);
  await removeGuiSession(session);
}
async function removeGuiSession(session) {
  sessions2.delete(session.id);
  await beginRuntimeOperationFinalization(`gui:${session.id}`, session.id, "gui");
  try {
    if (session.containerName)
      await run2("docker", ["rm", "-f", session.containerName], 1e4);
    if (session.ownsWorkspace)
      await destroyWorkspaceSession(session.workspaceSessionId);
    await completeRuntimeOperationFinalization(`gui:${session.id}`, session.id, "gui");
  } catch (error) {
    await failRuntimeOperationFinalization(`gui:${session.id}`, session.id, error);
    throw error;
  }
}
async function removeExpiredGuiSessions() {
  const now = Date.now();
  for (const session of [...sessions2.values()])
    if (session.expiresAt <= now)
      await removeGuiSession(session);
}
function startCleanup2() {
  if (cleanupStarted2)
    return;
  cleanupStarted2 = true;
  const timer = setInterval(() => void removeExpiredGuiSessions(), 3e4);
  timer.unref();
}

// src/gui-proxy.ts
import net from "node:net";
import { request as httpRequest } from "node:http";

// src/lib/originPolicy.ts
var configuredOrigins = (process.env.ALLOWED_ORIGINS || "").split(",").map((value) => value.trim()).filter(Boolean);
var localOrigin = /^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/;
function isAllowedOrigin(origin) {
  if (!origin)
    return true;
  if (configuredOrigins.length)
    return configuredOrigins.includes(origin);
  return process.env.NODE_ENV !== "production" && localOrigin.test(origin);
}

// src/gui-proxy.ts
function parseGuiPath(url) {
  const pathname = new URL(url, "http://localhost").pathname;
  const match = pathname.match(/^\/api\/gui\/sessions\/([^/]+)\/view\/([^/]+)(\/.*)?$/);
  if (!match)
    return null;
  return { id: decodeURIComponent(match[1]), token: decodeURIComponent(match[2]), targetPath: `${match[3] || "/"}${new URL(url, "http://localhost").search}` };
}
function proxyGuiHttpRequest(req, res, id, token) {
  void getGuiDisplayTarget(id, token).then(({ port: port2 }) => {
    const parsed = parseGuiPath(req.url || "/");
    const upstream = httpRequest({ hostname: "127.0.0.1", port: port2, method: req.method, path: parsed?.targetPath || "/", headers: { ...req.headers, host: `127.0.0.1:${port2}` } }, (upstreamResponse) => {
      res.writeHead(upstreamResponse.statusCode || 502, upstreamResponse.headers);
      upstreamResponse.pipe(res);
    });
    upstream.once("error", () => res.headersSent ? res.destroy() : res.status(502).send("Display stream is unavailable."));
    req.pipe(upstream);
  }).catch(() => res.status(404).send("Display session not found or expired."));
}
function setupGuiProxy(server2) {
  server2.on("upgrade", (request, socket, head) => {
    const parsed = parseGuiPath(request.url || "/");
    if (!parsed)
      return;
    if (!isAllowedOrigin(request.headers.origin)) {
      socket.write("HTTP/1.1 403 Forbidden\r\n\r\n");
      return socket.destroy();
    }
    void getGuiDisplayTarget(parsed.id, parsed.token).then(({ port: port2 }) => {
      const upstream = net.connect(port2, "127.0.0.1", () => {
        const lines = [`GET ${parsed.targetPath} HTTP/${request.httpVersion}`, `Host: 127.0.0.1:${port2}`];
        for (let index = 0; index < request.rawHeaders.length; index += 2) {
          const name = request.rawHeaders[index];
          const value = request.rawHeaders[index + 1];
          if (name.toLowerCase() !== "host")
            lines.push(`${name}: ${value}`);
        }
        upstream.write(`${lines.join("\r\n")}\r
\r
`);
        if (head.length)
          upstream.write(head);
        socket.pipe(upstream).pipe(socket);
      });
      upstream.once("error", () => socket.destroy());
    }).catch(() => {
      socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
      socket.destroy();
    });
  });
}

// src/routes/gui.ts
var router8 = Router8();
function deviceId(req) {
  if (typeof req.deviceId !== "string" || req.deviceId === "anonymous")
    throw new Error("A browser workspace capability is required for graphical display sessions.");
  return req.deviceId;
}
router8.post("/gui/sessions", async (req, res) => {
  try {
    const workspaceSessionId = typeof req.body?.workspaceSessionId === "string" ? req.body.workspaceSessionId : void 0;
    if (workspaceSessionId && !await authorizeTerminalSession(workspaceSessionId, req.header("x-sk-workspace-access"))) {
      res.status(403).json({ error: "Workspace access is not valid for this browser session." });
      return;
    }
    res.status(201).json(await createGuiSession(deviceId(req), workspaceSessionId));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Display service unavailable.";
    res.status(/capability/i.test(message) ? 401 : 503).json({ error: message });
  }
});
router8.post("/gui/sessions/:id/launch", async (req, res) => {
  const filePath = typeof req.body?.filePath === "string" ? req.body.filePath : "";
  const language = typeof req.body?.language === "string" ? req.body.language : void 0;
  if (!filePath)
    return res.status(400).json({ error: "filePath is required." });
  try {
    res.json(await launchGuiSession(req.params.id, deviceId(req), req.header("x-sk-workspace-access"), filePath, language));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Display launch failed.";
    res.status(/capability/i.test(message) ? 401 : 400).json({ error: message });
  }
});
router8.get("/gui/sessions/:id", async (req, res) => {
  try {
    res.json(await getGuiSessionStatus(req.params.id, deviceId(req), req.header("x-sk-workspace-access")));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Display session not found.";
    res.status(/capability/i.test(message) ? 401 : 404).json({ error: message });
  }
});
router8.delete("/gui/sessions/:id", async (req, res) => {
  try {
    await stopGuiSession(req.params.id, deviceId(req), req.header("x-sk-workspace-access"));
    res.status(204).end();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Display session not found.";
    res.status(/capability/i.test(message) ? 401 : 404).json({ error: message });
  }
});
router8.use("/gui/sessions/:id/view/:token", (req, res) => proxyGuiHttpRequest(req, res, req.params.id, req.params.token));
var gui_default = router8;

// src/routes/previews.ts
import { Router as Router9 } from "express";

// src/lib/webPreviewSessionManager.ts
import { randomBytes as randomBytes3, randomUUID as randomUUID6 } from "node:crypto";
import { readFile as readFile7 } from "node:fs/promises";
import { hostname } from "node:os";
import { normalize as normalize3, relative as relative3, resolve as resolve4 } from "node:path";
import { spawn as spawn4 } from "node:child_process";
var sessions3 = /* @__PURE__ */ new Map();
var cleanupStarted3 = false;
var PREVIEW_NETWORK = "skcoder-preview";
function run3(command, args, timeout = 3e4) {
  return new Promise((resolveResult) => {
    const proc = spawn4(command, args, { env: { ...process.env, NO_COLOR: "1" } });
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      proc.kill("SIGTERM");
      setTimeout(() => proc.kill("SIGKILL"), 1e3).unref();
    }, timeout);
    proc.stdout.on("data", (value) => {
      stdout += value.toString();
    });
    proc.stderr.on("data", (value) => {
      stderr += value.toString();
    });
    proc.once("error", (error) => {
      clearTimeout(timer);
      resolveResult({ stdout: "", stderr: error.message, exitCode: 127 });
    });
    proc.once("close", (code) => {
      clearTimeout(timer);
      resolveResult({ stdout: stdout.slice(0, 65536), stderr: `${stderr}${timedOut ? "\nCommand timed out." : ""}`.trim(), exitCode: code ?? 1 });
    });
  });
}
function safeProjectPath(pathname) {
  const value = normalize3(pathname.trim().replace(/^\/+/, "") || ".");
  if (value === ".." || value.startsWith("../") || value.startsWith("..\\"))
    throw new Error("A project folder inside the workspace is required.");
  return value.replaceAll("\\", "/");
}
function containerNameFor3(id) {
  return `skcoder-preview-${id.replaceAll("-", "")}`;
}
function viewPath(session) {
  return `/previews/sessions/${encodeURIComponent(session.id)}/view/${encodeURIComponent(session.token)}/`;
}
function wait(milliseconds) {
  return new Promise((resolveResult) => setTimeout(resolveResult, milliseconds));
}
async function previewStartupLog(containerName) {
  const result = await run3("docker", ["exec", "--user", "1000:1000", containerName, "bash", "-lc", "tail -c 16384 /tmp/skcoder-preview.log 2>/dev/null || true"], 1e4);
  return result.stdout.trim();
}
async function waitForPreviewReady(containerName) {
  let log = "";
  for (let attempt = 0; attempt < 8; attempt += 1) {
    await wait(500);
    const ready = await run3("docker", ["exec", "--user", "1000:1000", containerName, "bash", "-lc", "curl --silent --show-error --fail --max-time 1 http://127.0.0.1:4173/ >/dev/null"], 5e3);
    if (ready.exitCode === 0)
      return;
    log = await previewStartupLog(containerName);
  }
  throw new Error(`Project preview did not become ready.${log ? `
${log}` : ""}`);
}
function publicSession2(session, log = "") {
  return {
    id: session.id,
    workspaceSessionId: session.workspaceSessionId,
    projectPath: session.projectPath,
    kind: session.kind,
    status: session.containerName ? "running" : "staging",
    expiresAt: session.expiresAt,
    viewPath: session.containerName ? viewPath(session) : null,
    log
  };
}
async function activeCount() {
  const result = await run3("docker", ["ps", "--filter", "label=skcoder.preview=true", "--filter", `label=skcoder.instance=${BACKEND_INSTANCE_ID}`, "-q"], 5e3);
  return result.stdout.split("\n").filter(Boolean).length;
}
async function ensurePreviewNetwork() {
  const existing = await run3("docker", ["network", "inspect", PREVIEW_NETWORK], 1e4);
  if (existing.exitCode !== 0) {
    const created = await run3("docker", ["network", "create", "--driver", "bridge", "--internal", PREVIEW_NETWORK], 1e4);
    if (created.exitCode !== 0) {
      const afterCreate = await run3("docker", ["network", "inspect", PREVIEW_NETWORK], 1e4);
      if (afterCreate.exitCode !== 0)
        throw new Error(created.stderr || "The isolated preview network could not be created.");
    }
  }
  const joined = await run3("docker", ["network", "connect", PREVIEW_NETWORK, hostname()], 1e4);
  if (joined.exitCode !== 0 && !joined.stderr.includes("already exists"))
    throw new Error(joined.stderr || "The preview proxy could not join the isolated preview network.");
}
async function ownedSession(id, deviceId3, workspaceAccess) {
  await removeExpiredWebPreviewSessions();
  const session = sessions3.get(id);
  if (!session || session.deviceId !== deviceId3 || !await authorizeTerminalSession(session.workspaceSessionId, workspaceAccess))
    throw new Error("Project preview session not found or expired.");
  return session;
}
async function detectProject(workspacePath, projectPath3) {
  const relativeProject = safeProjectPath(projectPath3);
  const directory = resolve4(workspacePath, relativeProject);
  if (relative3(workspacePath, directory).startsWith(".."))
    throw new Error("Project path escapes the workspace.");
  let manifest;
  try {
    manifest = JSON.parse(await readFile7(resolve4(directory, "package.json"), "utf8"));
  } catch {
    throw new Error("A readable package.json is required for project preview.");
  }
  const packages = { ...manifest.dependencies, ...manifest.devDependencies };
  if (packages.next && manifest.scripts?.dev)
    return { kind: "next", command: "npm run dev -- --hostname 0.0.0.0 --port 4173" };
  if (packages.vite && manifest.scripts?.dev)
    return { kind: "vite", command: "npm run dev -- --host 0.0.0.0 --port 4173 --strictPort" };
  throw new Error("Project preview currently supports Vite and Next.js projects with a dev script. Install dependencies first, then start preview.");
}
async function createWebPreviewSession(deviceId3, workspaceSessionId) {
  await removeExpiredWebPreviewSessions();
  if (await activeCount() >= PREVIEW_SESSION_MAX_COUNT)
    throw new Error("The project preview queue is full. Stop an existing preview before starting another.");
  const workspace = workspaceSessionId ? await getWorkspaceSession(workspaceSessionId) : await createWorkspaceSession({ retentionMode: "four-hours" });
  const session = {
    id: randomUUID6(),
    deviceId: deviceId3,
    workspaceSessionId: workspace.id,
    ownsWorkspace: !workspaceSessionId,
    token: randomBytes3(24).toString("base64url"),
    projectPath: null,
    kind: null,
    containerName: null,
    host: null,
    port: null,
    expiresAt: Date.now() + PREVIEW_SESSION_TTL_MS
  };
  await createRuntimeOperation({ id: `preview:${session.id}`, ownerId: session.id, kind: "preview", resources: [`workspace:${workspace.id}`], expiresAt: session.expiresAt });
  sessions3.set(session.id, session);
  startCleanup3();
  return publicSession2(session);
}
async function launchWebPreviewSession(id, deviceId3, workspaceAccess, projectPath3) {
  const session = await ownedSession(id, deviceId3, workspaceAccess);
  if (session.containerName)
    throw new Error("This project preview is already running.");
  if (await activeCount() >= PREVIEW_SESSION_MAX_COUNT)
    throw new Error("The project preview queue is full. Stop an existing preview before starting another.");
  const workspace = await getWorkspaceSession(session.workspaceSessionId);
  const project = await detectProject(workspace.workspacePath, projectPath3);
  const relativeProject = safeProjectPath(projectPath3);
  const containerName = containerNameFor3(session.id);
  await ensurePreviewNetwork();
  const started = await run3("docker", [
    "run",
    "-d",
    "--rm",
    "--name",
    containerName,
    "--label",
    "skcoder.preview=true",
    "--label",
    `skcoder.preview-id=${session.id}`,
    "--label",
    `skcoder.instance=${BACKEND_INSTANCE_ID}`,
    "--network",
    PREVIEW_NETWORK,
    "--memory",
    `${PREVIEW_SESSION_MEMORY_MB}m`,
    "--memory-swap",
    `${PREVIEW_SESSION_MEMORY_MB}m`,
    "--cpus",
    "1",
    "--pids-limit",
    "192",
    "--cap-drop",
    "ALL",
    "--security-opt",
    "no-new-privileges",
    "--read-only",
    "--user",
    "1000:1000",
    "-v",
    `${workspace.workspacePath}:/workspace:rw`,
    "-w",
    `/workspace/${relativeProject === "." ? "" : relativeProject}`,
    "--tmpfs",
    "/tmp:rw,noexec,nosuid,size=256m,mode=1777",
    PREVIEW_RUNTIME_IMAGE,
    "bash",
    "-lc",
    "sleep infinity"
  ], 45e3);
  if (started.exitCode !== 0)
    throw new Error(started.stderr || "The preview runtime could not start.");
  const port2 = 4173;
  const previewEnv = project.kind === "vite" ? [`-e`, `__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS=${containerName}`] : [];
  const launched = await run3("docker", ["exec", "-d", "--user", "1000:1000", ...previewEnv, "-w", `/workspace/${relativeProject === "." ? "" : relativeProject}`, containerName, "bash", "-lc", `${project.command} > /tmp/skcoder-preview.log 2>&1`], 15e3);
  if (launched.exitCode !== 0) {
    await run3("docker", ["rm", "-f", containerName], 1e4);
    throw new Error(launched.stderr || "The project preview command could not start.");
  }
  try {
    await waitForPreviewReady(containerName);
  } catch (error) {
    await run3("docker", ["rm", "-f", containerName], 1e4);
    throw error;
  }
  session.projectPath = projectPath3;
  session.kind = project.kind;
  session.containerName = containerName;
  session.host = containerName;
  session.port = port2;
  session.expiresAt = Date.now() + PREVIEW_SESSION_TTL_MS;
  await createRuntimeOperation({ id: `preview:${session.id}`, ownerId: session.id, kind: "preview", resources: [`workspace:${session.workspaceSessionId}`, `container:${containerName}`], expiresAt: session.expiresAt });
  return publicSession2(session);
}
async function getWebPreviewTarget(id, token) {
  await removeExpiredWebPreviewSessions();
  const session = sessions3.get(id);
  if (!session || session.token !== token || !session.port || !session.host || !session.containerName)
    throw new Error("Project preview session not found or expired.");
  return { host: session.host, port: session.port };
}
async function getWebPreviewSessionStatus(id, deviceId3, workspaceAccess) {
  const session = await ownedSession(id, deviceId3, workspaceAccess);
  let log = "";
  if (session.containerName) {
    const result = await run3("docker", ["exec", "--user", "1000:1000", session.containerName, "bash", "-lc", "tail -c 16384 /tmp/skcoder-preview.log 2>/dev/null || true"], 1e4);
    log = result.stdout;
  }
  return publicSession2(session, log);
}
async function stopWebPreviewSession(id, deviceId3, workspaceAccess) {
  await removeWebPreviewSession(await ownedSession(id, deviceId3, workspaceAccess));
}
async function removeWebPreviewSession(session) {
  sessions3.delete(session.id);
  await beginRuntimeOperationFinalization(`preview:${session.id}`, session.id, "preview");
  try {
    if (session.containerName)
      await run3("docker", ["rm", "-f", session.containerName], 1e4);
    if (session.ownsWorkspace)
      await destroyWorkspaceSession(session.workspaceSessionId);
    await completeRuntimeOperationFinalization(`preview:${session.id}`, session.id, "preview");
  } catch (error) {
    await failRuntimeOperationFinalization(`preview:${session.id}`, session.id, error);
    throw error;
  }
}
async function removeExpiredWebPreviewSessions() {
  const now = Date.now();
  for (const session of [...sessions3.values()])
    if (session.expiresAt <= now)
      await removeWebPreviewSession(session);
}
function startCleanup3() {
  if (cleanupStarted3)
    return;
  cleanupStarted3 = true;
  const timer = setInterval(() => void removeExpiredWebPreviewSessions(), 3e4);
  timer.unref();
}

// src/web-preview-proxy.ts
import net2 from "node:net";
import { request as httpRequest2 } from "node:http";
function parsePreviewPath(url) {
  const parsed = new URL(url, "http://localhost");
  const match = parsed.pathname.match(/^\/api\/previews\/sessions\/([^/]+)\/view\/([^/]+)(\/.*)?$/);
  if (!match)
    return null;
  return { id: decodeURIComponent(match[1]), token: decodeURIComponent(match[2]), targetPath: `${match[3] || "/"}${parsed.search}` };
}
function proxyWebPreviewHttpRequest(req, res, id, token) {
  void getWebPreviewTarget(id, token).then(({ host, port: port2 }) => {
    const parsed = parsePreviewPath(req.url || "/");
    const upstream = httpRequest2({ hostname: host, port: port2, method: req.method, path: parsed?.targetPath || "/", headers: { ...req.headers, host: `${host}:${port2}` } }, (upstreamResponse) => {
      res.writeHead(upstreamResponse.statusCode || 502, upstreamResponse.headers);
      upstreamResponse.pipe(res);
    });
    upstream.once("error", () => res.headersSent ? res.destroy() : res.status(502).send("Project preview is unavailable."));
    req.pipe(upstream);
  }).catch(() => res.status(404).send("Project preview session not found or expired."));
}
function setupWebPreviewProxy(server2) {
  server2.on("upgrade", (request, socket, head) => {
    const parsed = parsePreviewPath(request.url || "");
    if (!parsed)
      return;
    if (!isAllowedOrigin(request.headers.origin)) {
      socket.write("HTTP/1.1 403 Forbidden\r\n\r\n");
      return socket.destroy();
    }
    void getWebPreviewTarget(parsed.id, parsed.token).then(({ host, port: port2 }) => {
      const upstream = net2.connect(port2, host, () => {
        const lines = [`GET ${parsed.targetPath} HTTP/${request.httpVersion}`, `Host: ${host}:${port2}`];
        for (let index = 0; index < request.rawHeaders.length; index += 2) {
          const name = request.rawHeaders[index];
          const value = request.rawHeaders[index + 1];
          if (name.toLowerCase() !== "host")
            lines.push(`${name}: ${value}`);
        }
        upstream.write(`${lines.join("\r\n")}\r
\r
`);
        if (head.length)
          upstream.write(head);
        socket.pipe(upstream).pipe(socket);
      });
      upstream.once("error", () => socket.destroy());
    }).catch(() => {
      socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
      socket.destroy();
    });
  });
}

// src/routes/previews.ts
var router9 = Router9();
function deviceId2(req) {
  return typeof req.deviceId === "string" ? req.deviceId : "anonymous";
}
router9.post("/previews/sessions", async (req, res) => {
  try {
    const workspaceSessionId = typeof req.body?.workspaceSessionId === "string" ? req.body.workspaceSessionId : void 0;
    if (workspaceSessionId && !await authorizeTerminalSession(workspaceSessionId, req.header("x-sk-workspace-access"))) {
      res.status(403).json({ error: "Workspace access is not valid for this browser session." });
      return;
    }
    res.status(201).json(await createWebPreviewSession(deviceId2(req), workspaceSessionId));
  } catch (error) {
    res.status(503).json({ error: error instanceof Error ? error.message : "Project preview is unavailable." });
  }
});
router9.post("/previews/sessions/:id/launch", async (req, res) => {
  const projectPath3 = typeof req.body?.projectPath === "string" ? req.body.projectPath : "";
  if (!projectPath3)
    return res.status(400).json({ error: "A project folder is required." });
  try {
    res.json(await launchWebPreviewSession(req.params.id, deviceId2(req), req.header("x-sk-workspace-access"), projectPath3));
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "Project preview could not start." });
  }
});
router9.get("/previews/sessions/:id", async (req, res) => {
  try {
    res.json(await getWebPreviewSessionStatus(req.params.id, deviceId2(req), req.header("x-sk-workspace-access")));
  } catch (error) {
    res.status(404).json({ error: error instanceof Error ? error.message : "Project preview session not found." });
  }
});
router9.delete("/previews/sessions/:id", async (req, res) => {
  try {
    await stopWebPreviewSession(req.params.id, deviceId2(req), req.header("x-sk-workspace-access"));
    res.status(204).end();
  } catch (error) {
    res.status(404).json({ error: error instanceof Error ? error.message : "Project preview session not found." });
  }
});
router9.use("/previews/sessions/:id/view/:token", (req, res) => proxyWebPreviewHttpRequest(req, res, req.params.id, req.params.token));
var previews_default = router9;

// src/routes/apk.ts
import { Router as Router10 } from "express";

// src/lib/apkJobManager.ts
import { randomBytes as randomBytes4, randomUUID as randomUUID7 } from "node:crypto";
import { spawn as spawn5 } from "node:child_process";
import { chown as chown2, copyFile, mkdir as mkdir5, readFile as readFile8, readdir as readdir2, rm as rm4, stat as stat2, writeFile as writeFile5 } from "node:fs/promises";
import { basename as basename2, normalize as normalize4, relative as relative4, resolve as resolve5 } from "node:path";
var MAX_DECODED_TEXT_BYTES = 1024 * 1024;
var jobs = /* @__PURE__ */ new Map();
var cleanupStarted4 = false;
function run4(command, args, timeout) {
  return new Promise((resolveResult) => {
    const child = spawn5(command, args, { env: { ...process.env, NO_COLOR: "1" } });
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
      setTimeout(() => child.kill("SIGKILL"), 1e3).unref();
    }, timeout);
    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });
    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });
    child.once("error", (error) => {
      clearTimeout(timer);
      resolveResult({ stdout: "", stderr: error.message, exitCode: 127 });
    });
    child.once("close", (code) => {
      clearTimeout(timer);
      resolveResult({ stdout: stdout.slice(0, 262144), stderr: `${stderr}${timedOut ? "\nAPK job timed out." : ""}`.trim(), exitCode: code ?? 1 });
    });
  });
}
function safeRelativePath3(value) {
  const path5 = normalize4(value.trim().replace(/^\/+/, "") || ".");
  if (path5 === "." || path5 === ".." || path5.startsWith("../") || path5.startsWith("..\\")) throw new Error("An APK file inside the workspace is required.");
  return path5.replaceAll("\\", "/");
}
function jobPathFor(id) {
  return resolve5(WORKSPACE_ROOT, ".apk-jobs", id);
}
function containerNameFor4(id) {
  return `skcoder-apk-${id.replaceAll("-", "")}`;
}
function publicJob(job) {
  return {
    id: job.id,
    workspaceSessionId: job.workspaceSessionId,
    sourcePath: job.sourcePath,
    mode: job.mode,
    status: job.status,
    createdAt: job.createdAt,
    expiresAt: job.expiresAt,
    log: job.log,
    error: job.error,
    artifactReady: Boolean(job.outputPath),
    artifactSigned: job.artifactSigned
  };
}
async function activeJobCount() {
  const result = await run4("docker", ["ps", "--filter", "label=skcoder.apk=true", "--filter", `label=skcoder.instance=${BACKEND_INSTANCE_ID}`, "-q"], 5e3);
  return result.stdout.split("\n").filter(Boolean).length;
}
async function getOwnedJob(id, deviceId3, workspaceAccess) {
  await removeExpiredApkJobs();
  const job = jobs.get(id);
  if (!job || job.deviceId !== deviceId3 || !await authorizeTerminalSession(job.workspaceSessionId, workspaceAccess)) throw new Error("APK job not found or expired.");
  return job;
}
async function getOwnedDecodedJob(id, deviceId3, workspaceAccess) {
  const job = await getOwnedJob(id, deviceId3, workspaceAccess);
  if (job.mode === "inspect" || job.status !== "complete") throw new Error("Complete a resource or full decode before editing decoded files.");
  return job;
}
function decodedEntryPath(job, value) {
  const root = resolve5(job.jobPath, "output", "decoded");
  const target = resolve5(root, safeRelativePath3(value));
  const relation = relative4(root, target);
  if (!relation || relation.startsWith("..") || relation.includes("../")) throw new Error("A decoded file inside this APK workspace is required.");
  return target;
}
function isReadableText(value) {
  return !value.subarray(0, Math.min(value.length, 8192)).includes(0);
}
function commandFor(mode) {
  if (mode === "inspect") return "unzip -l /job/input/source.apk > /job/output/archive-list.txt && unzip -t /job/input/source.apk";
  if (mode === "resources") return "apktool d -f -s -o /job/output/decoded /job/input/source.apk";
  return "apktool d -f -o /job/output/decoded /job/input/source.apk";
}
async function runDecode(job) {
  job.status = "running";
  job.log = "Starting isolated APK job...";
  const result = await run4("docker", [
    "run",
    "--rm",
    "--name",
    containerNameFor4(job.id),
    "--label",
    "skcoder.apk=true",
    "--label",
    `skcoder.apk-id=${job.id}`,
    "--label",
    `skcoder.instance=${BACKEND_INSTANCE_ID}`,
    "--network",
    "none",
    "--memory",
    `${APK_JOB_MEMORY_MB}m`,
    "--memory-swap",
    `${APK_JOB_MEMORY_MB}m`,
    "--cpus",
    "1",
    "--pids-limit",
    "192",
    "--cap-drop",
    "ALL",
    "--security-opt",
    "no-new-privileges",
    "--read-only",
    "--user",
    "1000:1000",
    "-v",
    `${job.jobPath}:/job:rw`,
    "--tmpfs",
    "/tmp:rw,noexec,nosuid,size=256m,mode=1777",
    APK_RUNTIME_IMAGE,
    "sh",
    "-lc",
    commandFor(job.mode)
  ], APK_JOB_TIMEOUT_MS);
  job.log = `${job.log}
${result.stdout}
${result.stderr}`.trim().slice(0, 262144);
  if (result.exitCode !== 0) {
    job.status = "failed";
    job.error = result.stderr || "The isolated APK job failed.";
    return;
  }
  if (job.mode === "inspect") {
    job.outputPath = resolve5(job.jobPath, "output", "archive-list.txt");
  } else {
    job.outputPath = resolve5(job.jobPath, "output", "decoded");
  }
  job.status = "complete";
}
async function createApkJob(deviceId3, workspaceAccess, input) {
  if (!await ensureDockerReady()) throw new Error("APK decode requires the Docker backend, which is not available right now.");
  if (!await authorizeTerminalSession(input.workspaceSessionId, workspaceAccess)) throw new Error("Workspace access is not valid for this browser session.");
  await removeExpiredApkJobs();
  if (await activeJobCount() >= APK_JOB_MAX_COUNT) throw new Error("The APK processing queue is full. Try again after the active job finishes.");
  const workspace = await getWorkspaceSession(input.workspaceSessionId);
  const sourcePath = safeRelativePath3(input.sourcePath);
  const source = resolve5(workspace.workspacePath, sourcePath);
  if (relative4(workspace.workspacePath, source).startsWith("..")) throw new Error("APK file path escapes the workspace.");
  const sourceInfo = await stat2(source);
  if (!sourceInfo.isFile()) throw new Error("The selected APK file is not available in the workspace.");
  const reservationBytes = Math.min(STAGING_MAX_BYTES, Math.max(APK_JOB_MIN_RESERVATION_BYTES, sourceInfo.size * APK_JOB_EXPANSION_MULTIPLIER));
  const id = randomUUID7();
  const jobPath = jobPathFor(id);
  await mkdir5(resolve5(jobPath, "input"), { recursive: true, mode: 493 });
  await mkdir5(resolve5(jobPath, "output"), { recursive: true, mode: 493 });
  await chown2(jobPath, 1e3, 1e3);
  await chown2(resolve5(jobPath, "input"), 1e3, 1e3);
  await chown2(resolve5(jobPath, "output"), 1e3, 1e3);
  await copyFile(source, resolve5(jobPath, "input", "source.apk"));
  const job = { id, deviceId: deviceId3, workspaceSessionId: input.workspaceSessionId, sourcePath, mode: input.mode, status: "queued", createdAt: Date.now(), expiresAt: Date.now() + APK_JOB_TTL_MS, jobPath, log: "Queued isolated APK job.", outputPath: null, error: null, artifactSigned: false };
  await createRuntimeOperation({ id: `apk:${job.id}`, ownerId: job.id, kind: "apk", resources: [`path:${jobPath}`, `container:${containerNameFor4(job.id)}`, `workspace:${job.workspaceSessionId}`], reservationBytes, expiresAt: job.expiresAt });
  jobs.set(id, job);
  startCleanup4();
  void runDecode(job);
  return publicJob(job);
}
async function buildApkJob(id, deviceId3, workspaceAccess, outputName, sign = false) {
  const job = await getOwnedJob(id, deviceId3, workspaceAccess);
  if (job.status !== "complete" || job.mode === "inspect") throw new Error("Complete a resource or full decode before requesting a rebuild.");
  const decodedPath = resolve5(job.jobPath, "output", "decoded");
  if (!(await stat2(decodedPath)).isDirectory()) throw new Error("Decoded APK files are no longer available.");
  job.status = "running";
  job.error = null;
  const safeName = basename2((outputName || "sk-coder-unsigned.apk").replace(/[^a-zA-Z0-9._-]/g, "_"));
  const outputFile = safeName.endsWith(".apk") ? safeName : `${safeName}.apk`;
  const output = resolve5(job.jobPath, "output", outputFile);
  const aligned = resolve5(job.jobPath, "output", `aligned-${outputFile}`);
  const signed = resolve5(job.jobPath, "output", `signed-${outputFile}`);
  const signingPassword = randomBytes4(24).toString("hex");
  const buildCommand = sign ? `apktool b /job/output/decoded -o /job/output/${basename2(output)} && zipalign -f -p 4 /job/output/${basename2(output)} /job/output/${basename2(aligned)} && keytool -genkeypair -keystore /tmp/sk-coder-signing.jks -storepass ${signingPassword} -keypass ${signingPassword} -alias skcoder -keyalg RSA -keysize 2048 -validity 1 -dname 'CN=SK Coder Temporary Signing' && apksigner sign --ks /tmp/sk-coder-signing.jks --ks-key-alias skcoder --ks-pass pass:${signingPassword} --key-pass pass:${signingPassword} --out /job/output/${basename2(signed)} /job/output/${basename2(aligned)} && apksigner verify --verbose /job/output/${basename2(signed)} && rm -f /tmp/sk-coder-signing.jks` : `apktool b /job/output/decoded -o /job/output/${basename2(output)} && zipalign -f -p 4 /job/output/${basename2(output)} /job/output/${basename2(aligned)} && unzip -t /job/output/${basename2(aligned)}`;
  const result = await run4("docker", [
    "run",
    "--rm",
    "--name",
    containerNameFor4(`${job.id}-build`),
    "--label",
    "skcoder.apk=true",
    "--label",
    `skcoder.apk-id=${job.id}`,
    "--label",
    `skcoder.instance=${BACKEND_INSTANCE_ID}`,
    "--network",
    "none",
    "--memory",
    `${APK_JOB_MEMORY_MB}m`,
    "--memory-swap",
    `${APK_JOB_MEMORY_MB}m`,
    "--cpus",
    "1",
    "--pids-limit",
    "192",
    "--cap-drop",
    "ALL",
    "--security-opt",
    "no-new-privileges",
    "--read-only",
    "--user",
    "1000:1000",
    "-v",
    `${job.jobPath}:/job:rw`,
    "--tmpfs",
    "/tmp:rw,noexec,nosuid,size=256m,mode=1777",
    APK_RUNTIME_IMAGE,
    "sh",
    "-lc",
    buildCommand
  ], APK_JOB_TIMEOUT_MS);
  job.log = `${job.log}
${result.stdout}
${result.stderr}`.trim().slice(0, 262144);
  if (result.exitCode !== 0) {
    job.status = "failed";
    job.error = result.stderr || "The isolated APK rebuild failed.";
    return publicJob(job);
  }
  job.status = "complete";
  job.outputPath = sign ? signed : aligned;
  job.artifactSigned = sign;
  return publicJob(job);
}
async function getApkJobStatus(id, deviceId3, workspaceAccess) {
  return publicJob(await getOwnedJob(id, deviceId3, workspaceAccess));
}
async function getApkArtifact(id, deviceId3, workspaceAccess) {
  const job = await getOwnedJob(id, deviceId3, workspaceAccess);
  if (!job.outputPath) throw new Error("APK job output is not available.");
  const output = resolve5(job.outputPath);
  if (!output.startsWith(`${job.jobPath}/`)) throw new Error("APK job output is invalid.");
  const info = await stat2(output);
  if (!info.isFile()) throw new Error("This APK job output is a decoded workspace, not a downloadable artifact.");
  return { path: output, name: basename2(output) };
}
async function listDecodedEntries(id, deviceId3, workspaceAccess) {
  const job = await getOwnedJob(id, deviceId3, workspaceAccess);
  if (job.mode === "inspect" || job.status !== "complete") return [];
  const root = resolve5(job.jobPath, "output", "decoded");
  const paths = [];
  async function collect(folder) {
    for (const entry of await readdir2(folder, { withFileTypes: true })) {
      const current = resolve5(folder, entry.name);
      if (paths.length >= 1e4) return;
      if (entry.isDirectory()) await collect(current);
      else paths.push(relative4(root, current).replaceAll("\\", "/"));
    }
  }
  await collect(root);
  return paths.sort();
}
async function readDecodedEntry(id, deviceId3, workspaceAccess, entryPath) {
  const job = await getOwnedDecodedJob(id, deviceId3, workspaceAccess);
  const target = decodedEntryPath(job, entryPath);
  const info = await stat2(target);
  if (!info.isFile()) throw new Error("The selected decoded entry is not a file.");
  if (info.size > MAX_DECODED_TEXT_BYTES) throw new Error("This decoded text file is too large to open in the editor.");
  const content = await readFile8(target);
  if (!isReadableText(content)) throw new Error("This decoded entry is binary and cannot be edited as text.");
  return { path: entryPath, size: info.size, content: content.toString("utf8") };
}
async function updateDecodedEntry(id, deviceId3, workspaceAccess, entryPath, content) {
  if (Buffer.byteLength(content, "utf8") > MAX_DECODED_TEXT_BYTES) throw new Error("This decoded text edit is too large to save.");
  const job = await getOwnedDecodedJob(id, deviceId3, workspaceAccess);
  const target = decodedEntryPath(job, entryPath);
  const info = await stat2(target);
  if (!info.isFile()) throw new Error("The selected decoded entry is not a file.");
  if (info.size > MAX_DECODED_TEXT_BYTES) throw new Error("This decoded text file is too large to edit.");
  const existing = await readFile8(target);
  if (!isReadableText(existing)) throw new Error("This decoded entry is binary and cannot be edited as text.");
  await writeFile5(target, content, "utf8");
  return { path: entryPath, size: Buffer.byteLength(content, "utf8") };
}
async function removeExpiredApkJobs() {
  const now = Date.now();
  for (const job of [...jobs.values()]) {
    if (job.expiresAt > now) continue;
    jobs.delete(job.id);
    job.status = "expired";
    await beginRuntimeOperationFinalization(`apk:${job.id}`, job.id, "apk");
    try {
      await run4("docker", ["rm", "-f", containerNameFor4(job.id)], 1e4);
      await run4("docker", ["rm", "-f", containerNameFor4(`${job.id}-build`)], 1e4);
      await rm4(job.jobPath, { recursive: true, force: true });
      await completeRuntimeOperationFinalization(`apk:${job.id}`, job.id, "apk");
    } catch (error) {
      await failRuntimeOperationFinalization(`apk:${job.id}`, job.id, error);
      throw error;
    }
  }
}
function startCleanup4() {
  if (cleanupStarted4) return;
  cleanupStarted4 = true;
  const timer = setInterval(() => void removeExpiredApkJobs(), 3e4);
  timer.unref();
}

// src/routes/apk.ts
var router10 = Router10();
router10.post("/apk/jobs", async (req, res) => {
  const { workspaceSessionId, sourcePath, mode } = req.body || {};
  if (typeof workspaceSessionId !== "string" || typeof sourcePath !== "string" || !["inspect", "resources", "full"].includes(mode)) {
    res.status(400).json({ error: "workspaceSessionId, sourcePath, and a valid APK job mode are required." });
    return;
  }
  try {
    res.status(202).json(await createApkJob(req.deviceId, req.header("x-sk-workspace-access"), { workspaceSessionId, sourcePath, mode }));
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "APK job could not be created." });
  }
});
router10.get("/apk/jobs/:id", async (req, res) => {
  try {
    res.json(await getApkJobStatus(req.params.id, req.deviceId, req.header("x-sk-workspace-access")));
  } catch (error) {
    res.status(404).json({ error: error instanceof Error ? error.message : "APK job not found." });
  }
});
router10.get("/apk/jobs/:id/entries", async (req, res) => {
  try {
    res.json({ entries: await listDecodedEntries(req.params.id, req.deviceId, req.header("x-sk-workspace-access")) });
  } catch (error) {
    res.status(404).json({ error: error instanceof Error ? error.message : "Decoded APK workspace not found." });
  }
});
router10.get("/apk/jobs/:id/entries/{*entryPath}", async (req, res) => {
  try {
    const entryPath = Array.isArray(req.params.entryPath) ? req.params.entryPath.join("/") : req.params.entryPath;
    if (typeof entryPath !== "string" || !entryPath) throw new Error("A decoded file path is required.");
    res.json(await readDecodedEntry(req.params.id, req.deviceId, req.header("x-sk-workspace-access"), entryPath));
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "Decoded APK entry could not be read." });
  }
});
router10.put("/apk/jobs/:id/entries/{*entryPath}", async (req, res) => {
  try {
    const entryPath = Array.isArray(req.params.entryPath) ? req.params.entryPath.join("/") : req.params.entryPath;
    if (typeof entryPath !== "string" || !entryPath || typeof req.body?.content !== "string") throw new Error("A decoded file path and text content are required.");
    res.json(await updateDecodedEntry(req.params.id, req.deviceId, req.header("x-sk-workspace-access"), entryPath, req.body.content));
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "Decoded APK entry could not be saved." });
  }
});
router10.post("/apk/jobs/:id/build", async (req, res) => {
  try {
    res.status(202).json(await buildApkJob(req.params.id, req.deviceId, req.header("x-sk-workspace-access"), typeof req.body?.outputName === "string" ? req.body.outputName : void 0, req.body?.sign === true));
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "APK build could not start." });
  }
});
router10.get("/apk/jobs/:id/artifact", async (req, res) => {
  try {
    const artifact = await getApkArtifact(req.params.id, req.deviceId, req.header("x-sk-workspace-access"));
    res.download(artifact.path, artifact.name);
  } catch (error) {
    res.status(404).json({ error: error instanceof Error ? error.message : "APK artifact not found." });
  }
});
var apk_default = router10;

// src/routes/index.ts
var router11 = Router11();
router11.use(health_default);
router11.use(projects_default);
router11.use(files_default);
router11.use(ai_default);
router11.use(execute_default);
router11.use(download_default);
router11.use(gui_default);
router11.use(previews_default);
router11.use(apk_default);
router11.use(admin_default);
var routes_default = router11;

// src/lib/logger.ts
import pino from "pino";
var logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  redact: ["req.headers.authorization", "req.headers.cookie", "res.headers['set-cookie']"]
});

// src/app.ts
var app = express2();
var __dirname2 = path4.dirname(fileURLToPath2(import.meta.url));
app.disable("x-powered-by");
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
});
app.use(pinoHttp({
  logger,
  serializers: {
    req(req) {
      return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
    },
    res(res) {
      return { statusCode: res.statusCode };
    }
  }
}));
app.use((req, res, next) => {
  if (!isAllowedOrigin(req.headers.origin)) {
    res.status(403).json({ error: "Origin is not allowed." });
    return;
  }
  next();
});
app.use(cors({
  origin(origin, callback) {
    callback(null, isAllowedOrigin(origin));
  },
  exposedHeaders: ["X-Device-Id"]
}));
app.use(express2.json({ limit: "10mb" }));
app.use(express2.urlencoded({ extended: true }));
app.use((req, res, next) => {
  if (req.path === "/api/healthz") {
    next();
    return;
  }
  const deviceId3 = req.headers["x-device-id"];
  const isValid = typeof deviceId3 === "string" && deviceId3.length >= 8 && /^[a-zA-Z0-9-]{8,64}$/.test(deviceId3);
  if (!isValid) {
    res.status(401).json({ error: "Device identity is required." });
    return;
  }
  req.deviceId = deviceId3;
  next();
});
app.use("/api", routes_default);
var userAppDir = path4.join(__dirname2, "../public-user-app");
if (fs4.existsSync(path4.join(userAppDir, "index.html"))) {
  const userAppHtml = fs4.readFileSync(path4.join(userAppDir, "index.html"), "utf-8").replace(/src="\/assets\//g, 'src="/user-app/assets/').replace(/href="\/assets\//g, 'href="/user-app/assets/').replace('href="/favicon.svg"', 'href="/user-app/favicon.svg"').replace("<head>", `<head><script>(function(){var b='/user-app';if(window.location.pathname.startsWith(b)){var r=window.location.pathname.slice(b.length)||'/';window.history.replaceState(null,'',r+window.location.search+window.location.hash);}}());</script>`);
  app.use("/user-app", express2.static(userAppDir, { index: false }));
  app.get(["/user-app", "/user-app/{*path}"], (_req, res) => {
    res.setHeader("Content-Type", "text/html");
    res.send(userAppHtml);
  });
}
var app_default = app;

// src/terminal-ws.ts
import { WebSocket, WebSocketServer } from "ws";
var terminalDisconnectLingerMs = 10 * 60 * 1e3;
var terminalReplayBufferSize = 2e4;
var terminalReplayBuffers = /* @__PURE__ */ new Map();
function replayKey(sessionId, terminalId) {
  return `${sessionId}:${terminalId}`;
}
function setupTerminalWs(server2) {
  const wss = new WebSocketServer({ noServer: true, handleProtocols: (protocols) => protocols.has("sk-coder-v1") ? "sk-coder-v1" : false });
  server2.on("upgrade", async (request, socket, head) => {
    if (new URL(request.url || "/", "http://localhost").pathname !== "/api/ws/terminal")
      return;
    if (!isAllowedOrigin(request.headers.origin)) {
      socket.write("HTTP/1.1 403 Forbidden\r\n\r\n");
      return socket.destroy();
    }
    const url = new URL(request.url || "/", "http://localhost");
    const sessionId = url.searchParams.get("sessionId");
    const accessToken = terminalAccessTokenFromProtocolHeader(request.headers["sec-websocket-protocol"]);
    if (!sessionId || !await authorizeTerminalSession(sessionId, accessToken)) {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      return socket.destroy();
    }
    wss.handleUpgrade(request, socket, head, (ws) => wss.emit("connection", ws, request));
  });
  wss.on("connection", async (ws, request) => {
    try {
      const url = new URL(request.url || "/", "http://localhost");
      const requestedSessionId = url.searchParams.get("sessionId");
      const terminalId = url.searchParams.get("terminalId") || "shell";
      if (!requestedSessionId)
        throw new Error("Terminal session is required.");
      let cwd = "/";
      let sentBytes = 0;
      let terminal = null;
      let closed = false;
      const terminalReplayKey = replayKey(requestedSessionId, terminalId);
      const pendingMessages = [];
      const replayState = terminalReplayBuffers.get(terminalReplayKey) ?? { buffer: [], timer: null };
      terminalReplayBuffers.set(terminalReplayKey, replayState);
      if (replayState.timer) {
        clearTimeout(replayState.timer);
        replayState.timer = null;
      }
      const handleMessage = (raw) => {
        try {
          const message = JSON.parse(raw.toString());
          if (!terminal) {
            if (pendingMessages.length < 32 && (message.type === "command" && Boolean(message.command) || message.type === "input" && typeof message.data === "string" && message.data.length <= 65536 || message.type === "interrupt" || message.type === "resize" && Number.isFinite(message.cols) && Number.isFinite(message.rows)))
              pendingMessages.push(message);
            return;
          }
          if (message.type === "kill")
            terminateInteractiveTerminal(terminal);
          if (message.type === "command" && message.command) {
            ws.readyState === WebSocket.OPEN && ws.send(JSON.stringify({ type: "state", state: "running", cwd }));
            terminal.write(`${message.command}\r`);
          }
          if (message.type === "input" && typeof message.data === "string" && message.data.length <= 65536)
            terminal.write(message.data);
          if (message.type === "interrupt")
            terminal.write("");
          if (message.type === "resize" && Number.isFinite(message.cols) && Number.isFinite(message.rows))
            terminal.resize(message.cols, message.rows);
        } catch {
        }
      };
      ws.on("message", handleMessage);
      ws.on("close", () => {
        closed = true;
        if (!terminal)
          return;
        if (replayState.timer)
          clearTimeout(replayState.timer);
        replayState.timer = setTimeout(() => {
          terminal?.detach();
          terminalReplayBuffers.delete(terminalReplayKey);
        }, terminalDisconnectLingerMs);
      });
      const session = await getWorkspaceSession(requestedSessionId);
      terminal = await openInteractiveTerminal(session.id, (data) => {
        const parsed = parseTerminalChunk(data, cwd);
        cwd = parsed.cwd;
        if (replayState.buffer.length > 32)
          replayState.buffer.shift();
        if (data)
          replayState.buffer.push(data);
        if (replayState.buffer.length > terminalReplayBufferSize)
          replayState.buffer = replayState.buffer.slice(-terminalReplayBufferSize);
        if (ws.readyState === WebSocket.OPEN) {
          const limited = limitTerminalChunk(parsed.visible, sentBytes, OUTPUT_MAX_BYTES);
          sentBytes = limited.sentBytes;
          if (limited.data) {
            ws.send(JSON.stringify({ type: "stdout", data: limited.data }));
            if (limited.capped)
              ws.send(JSON.stringify({ type: "stderr", data: "\nTerminal output was capped for this live session.\n" }));
          }
          if (parsed.reachedPrompt)
            ws.send(JSON.stringify({ type: "state", state: "live", cwd }));
        }
      }, (data) => ws.readyState === WebSocket.OPEN && ws.send(JSON.stringify({ type: "stderr", data })), (code) => ws.readyState === WebSocket.OPEN && ws.send(JSON.stringify({ type: "exit", code, cwd })), void 0, terminalId);
      if (closed) {
        return;
      }
      const replay = replayState.buffer.join("");
      if (replay)
        ws.send(JSON.stringify({ type: "stdout", data: replay.slice(-terminalReplayBufferSize) }));
      ws.send(JSON.stringify({ type: "ready", cwd, sessionId: session.id, mode: "pty" }));
      ws.send(JSON.stringify({ type: "state", state: "live", cwd }));
      for (const message of pendingMessages)
        handleMessage(Buffer.from(JSON.stringify(message)));
    } catch (error) {
      ws.send(JSON.stringify({ type: "stderr", data: `${error instanceof Error ? error.message : "Terminal unavailable."}
` }));
      ws.close();
    }
  });
}

// src/index.ts
var port = Number(process.env["PORT"] || 3001);
if (!Number.isFinite(port) || port <= 0)
  throw new Error("PORT must be a positive number.");
var server = createServer(app_default);
setupTerminalWs(server);
setupGuiProxy(server);
setupWebPreviewProxy(server);
server.listen(port, () => logger.info({ port }, "Server listening"));
