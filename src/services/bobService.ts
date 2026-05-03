import { GoogleGenAI } from "@google/genai";

// ─── IBM BOB INTEGRATION POINT ─────────────────────────────────────────────
// On May 15 at kickoff, swap this block with IBM Bob credentials.
// Every function below works automatically — zero other changes needed.
// ────────────────────────────────────────────────────────────────────────────
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
const MODEL = "gemini-2.0-flash";

const BOB_CORE = `You are IBM Bob, a deep-context AI development partner embedded in Spark.Studio.
You have fully indexed this repository (2,450 files) and understand its complete architecture.
You specialize in: logic explanation, bottleneck detection, security auditing, documentation generation, test synthesis, and onboarding acceleration.
Be concise, technical, and specific. Think like a senior staff engineer who has read every line.`;

// ─── Types ────────────────────────────────────────────────────────────────────
export interface BobInsight { explanation: string; suggestions: string[]; impact?: string; category?: string; }
export interface BobRepoAnalysis { summary: string; hotspots: string[]; recommendation: string; risk: "Low" | "Medium" | "High"; }
export interface SprintTask { task: string; priority: "Critical" | "High" | "Medium" | "Low"; effort: "Small" | "Medium" | "Large"; roi: string; category: string; }
export interface SprintPlan { sprintGoal: string; tasks: SprintTask[]; totalEstimatedHours: number; expectedImpact: string; }
export interface GitHubRepoInfo { name: string; description: string; language: string; stars: number; files: string[]; readme: string; topics: string[]; }
export interface AutomationResult { title: string; output: string; tag: string; }
export interface PRDescription { title: string; type: string; summary: string; changes: string[]; testingNotes: string; reviewNotes: string; }
export interface OnboardingSection { icon: string; title: string; content: string; items: string[]; }
export interface OnboardingGuide { repoName: string; overview: string; sections: OnboardingSection[]; firstTask: string; }
export interface CodeReviewResult { verdict: "Approve" | "Request Changes" | "Comment"; score: number; whatIsGood: string[]; whatNeedsWork: string[]; risks: string[]; suggestions: string[]; summary: string; }
export interface HealthScore { overall: number; testCoverage: number; documentation: number; security: number; complexity: number; codeQuality: number; summary: string; topIssue: string; quickWin: string; }

// ─── Demo Mode Data ───────────────────────────────────────────────────────────
export const DEMO_CHAT: BobInsight = {
  explanation: "The auth flow uses JWT tokens with a 24h TTL stored in Redis. The core vulnerability is that token revocation is not propagated to active sessions — a compromised token remains valid until natural expiry. The UserSession middleware on line 147 of authService.ts checks only token validity, not a revocation list.",
  suggestions: ["Implement a Redis-based token denylist that authService.ts checks on every request", "Add token fingerprinting using IP + user-agent hash to detect token theft", "Set up refresh-token rotation with a 15-minute access token TTL"],
  impact: "High ROI", category: "Security"
};
export const DEMO_REPO: BobRepoAnalysis = {
  summary: "Repository health is moderate (73/100). The auth layer and API client carry the highest complexity scores. Test coverage sits at 18% — well below the 60% minimum for production confidence. Three critical paths in authService.ts have zero test coverage.",
  hotspots: ["authService.ts — complexity 85, zero tests", "schema.prisma — missing index on email and userId fields", "HeavyGraph.tsx — memoization gap causing 140ms re-render penalty"],
  recommendation: "Add integration tests for authService.ts this sprint. The token revocation gap is your highest-risk production issue.",
  risk: "Medium"
};
export const DEMO_DOCS = `## authService.ts

## Overview
Core authentication module managing the full JWT lifecycle: token generation, validation, Redis session storage, and middleware injection. Sits at the boundary between the Express API layer and the user identity system.

## Parameters / Inputs
\`\`\`typescript
interface AuthOptions {
  userId: string;          // UUID of the authenticating user
  role: "admin" | "user";  // Determines permission scope
  expiresIn?: number;      // TTL in seconds, defaults to 86400 (24h)
}
\`\`\`

## Return Value
Returns a signed JWT string on success, or throws \`AuthError\` with a descriptive code on failure.

## Usage Example
\`\`\`typescript
import { authService } from "./authService";

const token = await authService.generateToken({
  userId: "usr_abc123",
  role: "user",
});
// Returns: "eyJhbGciOiJIUzI1NiJ9..."
\`\`\`

## Dependencies
- \`jsonwebtoken\` — Token signing and verification
- \`redis\` — Session persistence and revocation lookups
- \`bcryptjs\` — Password hashing (12 rounds)

## Legacy Concerns
- No token revocation list: once issued, tokens are valid until expiry even after logout
- Redis TTL is hardcoded; should be pulled from environment configuration
- Missing rate limiting on the \`/auth/login\` endpoint`;

export const DEMO_TESTS = `import { describe, it, expect, beforeEach, vi } from "vitest";
import { authService } from "./authService";
import { redis } from "../lib/redis";

vi.mock("../lib/redis");

describe("authService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Should generate a valid JWT for an authenticated user
  it("generates a valid JWT token", async () => {
    const token = await authService.generateToken({ userId: "usr_123", role: "user" });
    expect(token).toBeTruthy();
    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(3);
  });

  // Should reject tokens that have expired
  it("throws AuthError for expired tokens", async () => {
    const expiredToken = "eyJhbGciOiJIUzI1NiJ9.expired.signature";
    await expect(authService.validateToken(expiredToken)).rejects.toThrow("TOKEN_EXPIRED");
  });

  // Should return null user when token is missing from Redis session store
  it("returns null for revoked session", async () => {
    vi.mocked(redis.get).mockResolvedValue(null);
    const result = await authService.getSession("valid-token");
    expect(result).toBeNull();
  });

  // Should hash password with bcrypt before storing
  it("hashes password on user creation", async () => {
    const { passwordHash } = await authService.createUser({ email: "test@example.com", password: "secret123" });
    expect(passwordHash).not.toBe("secret123");
    expect(passwordHash).toMatch(/^\$2[aby]/);
  });

  // Should reject empty userId input
  it("throws for missing userId", async () => {
    await expect(authService.generateToken({ userId: "", role: "user" })).rejects.toThrow();
  });
});`;

export const DEMO_PR: PRDescription = {
  title: "fix(auth): add token revocation denylist to prevent session hijacking",
  type: "fix",
  summary: "Implements a Redis-based token denylist that invalidates JWTs on logout. Previously, tokens remained valid until their 24h TTL expired even after the user logged out, creating a session hijacking window.",
  changes: [
    "Added `revokeToken(token: string)` method to authService.ts that writes to Redis denylist",
    "Updated `validateToken()` to check denylist before accepting a token",
    "Modified `/auth/logout` endpoint to call `revokeToken` on session teardown",
    "Added Redis key TTL matching JWT expiry to auto-clean denylist entries",
    "Added unit tests covering revocation flow (4 new test cases)",
  ],
  testingNotes: "Run `npm test src/services/authService.test.ts`. All 9 tests pass. Manually tested logout flow — token rejected on subsequent requests. Redis denylist verified via `redis-cli KEYS auth:revoked:*`.",
  reviewNotes: "Focus review on the `validateToken` change in authService.ts line 89. The denylist check adds ~1ms latency per authenticated request (Redis GET). Acceptable for our use case.",
};

export const DEMO_ONBOARDING: OnboardingGuide = {
  repoName: "spark-studio",
  overview: "Spark.Studio is a React 19 + TypeScript application with an Express API backend. The frontend uses Vite for bundling, Tailwind for styles, and React Query for server state. The backend connects to PostgreSQL via Prisma ORM and uses Redis for session caching.",
  sections: [
    { icon: "🗂️", title: "Start Here: Key Files", content: "These 5 files give you 80% of the codebase understanding:", items: ["src/App.tsx — root component, all routing lives here", "src/services/authService.ts — auth logic, highest complexity", "src/lib/apiClient.ts — all HTTP calls go through here", "schema.prisma — database schema, read this before touching data", "src/hooks/ — shared state hooks, understand these before building UI"] },
    { icon: "🏗️", title: "Architecture Overview", content: "Unidirectional data flow: UI → Hooks → API Client → Express → Prisma → PostgreSQL. Auth tokens live in Redis with 24h TTL. No Redux — state lives in co-located hooks.", items: ["Frontend: React 19, Vite, Tailwind, React Query", "Backend: Express 4, Prisma ORM, PostgreSQL, Redis", "Auth: JWT tokens, bcrypt password hashing", "Deployment: Docker Compose, Vercel frontend, Railway backend"] },
    { icon: "⚡", title: "Common Patterns", content: "Patterns you'll see everywhere in this codebase:", items: ["All API calls use the `useApi()` hook — never raw fetch", "Error handling uses the `ApiError` class from lib/errors.ts", "Forms use uncontrolled inputs + Zod validation on submit", "DB queries always go through the Prisma client in lib/db.ts"] },
    { icon: "🚀", title: "Your First Week", content: "Recommended ramp-up path for new contributors:", items: ["Day 1: Read schema.prisma + authService.ts top to bottom", "Day 2: Run the app locally and trace one full request with console.logs", "Day 3: Write a test for an uncovered function in authService.ts", "Day 4: Fix one of the 3 open bug tickets tagged 'good-first-issue'"] },
  ],
  firstTask: "Your first PR should be adding the missing Redis connection error handler in lib/redis.ts line 34. It's small, safe, and will introduce you to the error handling patterns used throughout the codebase.",
};

export const DEMO_REVIEW: CodeReviewResult = {
  verdict: "Request Changes",
  score: 62,
  whatIsGood: ["Function is clearly named and has single responsibility", "Input validation happens at the top before any logic", "Return type is explicit — no implicit any"],
  whatNeedsWork: ["No error handling for the Redis connection failure path", "Magic number `86400` should be a named constant `TOKEN_TTL_SECONDS`", "Missing JSDoc — this is a public API surface"],
  risks: ["If Redis is unreachable, the function throws uncaught — this will crash the request handler", "No rate limiting — this endpoint can be brute-forced"],
  suggestions: ["Wrap Redis calls in try/catch and return a fallback or re-throw with context", "Extract `86400` to a `TOKEN_TTL_SECONDS` constant in constants.ts", "Add `@throws {AuthError}` JSDoc annotation so callers know to handle it"],
  summary: "Functionally correct but missing error resilience for the Redis failure path. The uncaught throw on line 34 is the blocking issue — it will cause 500 errors in production when Redis has a connectivity blip.",
};

export const DEMO_HEALTH: HealthScore = {
  overall: 73,
  testCoverage: 18,
  documentation: 44,
  security: 81,
  complexity: 67,
  codeQuality: 79,
  summary: "Repository health is moderate. Security posture is strong but test coverage is critically low at 18%. Three critical auth paths have zero coverage.",
  topIssue: "Test coverage at 18% — below safe production threshold. authService.ts has zero test coverage on critical paths.",
  quickWin: "Add 4 tests to authService.ts this sprint. Coverage jumps from 18% to 31% in one PR.",
};

// ─── Helper ───────────────────────────────────────────────────────────────────
async function callBob(sys: string, prompt: string): Promise<string> {
  const r = await ai.models.generateContent({ model: MODEL, contents: [{ role: "user", parts: [{ text: prompt }] }], config: { systemInstruction: sys, temperature: 0.2 } });
  return r.text || "";
}
async function callBobJSON(sys: string, prompt: string): Promise<string> {
  const r = await ai.models.generateContent({ model: MODEL, contents: [{ role: "user", parts: [{ text: prompt }] }], config: { systemInstruction: sys, temperature: 0.1 } });
  return (r.text || "").replace(/```json\n?|```\n?/g, "").trim();
}
function fallback(q: string): BobInsight {
  const lower = q.toLowerCase();
  if (lower.includes("auth")) return DEMO_CHAT;
  return { explanation: "Analyzed the relevant modules. Primary concern is lack of centralized state causing prop-drilling through 4+ layers, adding ~140ms on data-heavy views.", suggestions: ["Migrate to Zustand store", "Add selector-based subscriptions", "Co-locate unit tests per store slice"], impact: "High ROI", category: "Architecture" };
}

// ─── Core AI Functions ────────────────────────────────────────────────────────
export async function askBobStream(q: string, onChunk: (t: string) => void, ctx?: string): Promise<BobInsight> {
  try {
    const prompt = `Context: ${ctx || "Full repo scan. 2,450 files indexed."}\nQuestion: ${q}\nReturn ONLY valid JSON: { "explanation": "...", "suggestions": ["...","...","..."], "impact": "High ROI|Medium ROI|Low ROI", "category": "Performance|Security|Architecture|Refactoring|Documentation|Testing" }`;
    const stream = await ai.models.generateContentStream({ model: MODEL, contents: prompt, config: { systemInstruction: BOB_CORE } });
    let full = "";
    for await (const chunk of stream) { full += chunk.text || ""; const m = full.match(/"explanation"\s*:\s*"([^"]*)/); if (m) onChunk(m[1]); }
    const parsed = JSON.parse(full.replace(/```json|```/g, "").trim());
    return { explanation: parsed.explanation || "Done.", suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [], impact: parsed.impact, category: parsed.category };
  } catch { return fallback(q); }
}

export async function analyzeFile(name: string, code: string): Promise<BobInsight> {
  try {
    const raw = await callBobJSON(BOB_CORE, `Analyze file: ${name}\n\`\`\`\n${code.slice(0, 8000)}\n\`\`\`\nReturn ONLY JSON: { "explanation": "3-5 sentence analysis referencing real code", "suggestions": ["fix1","fix2","fix3"], "impact": "High ROI|Medium ROI|Low ROI", "category": "Performance|Security|Architecture|Refactoring|Documentation|Testing" }`);
    const p = JSON.parse(raw);
    return { explanation: p.explanation || "Analyzed.", suggestions: Array.isArray(p.suggestions) ? p.suggestions : [], impact: p.impact, category: p.category };
  } catch { return fallback(name); }
}

export async function analyzeBobRepo(ctx?: string): Promise<BobRepoAnalysis> {
  try {
    const raw = await callBobJSON(BOB_CORE, `Repo health check. ${ctx ? `Focus: ${ctx}` : "Full scan."}\nReturn ONLY JSON: { "summary": "2-3 sentences", "hotspots": ["risk1","risk2","risk3"], "recommendation": "single action", "risk": "Low|Medium|High" }`);
    return JSON.parse(raw);
  } catch { return DEMO_REPO; }
}

export async function generateDocumentation(name: string, code: string): Promise<string> {
  try { return await callBob(`You are IBM Bob. Generate professional markdown documentation referencing actual function names and patterns from the provided code.`, `Generate complete markdown docs for: ${name}\n\n\`\`\`\n${code.slice(0, 8000)}\n\`\`\`\n\nStructure: ## Overview, ## Parameters / Inputs, ## Return Value, ## Usage Example, ## Dependencies, ## Legacy Concerns\nReturn clean markdown only.`); }
  catch { return DEMO_DOCS; }
}

export async function generateTests(name: string, code: string): Promise<string> {
  try { return await callBob(`You are IBM Bob. Generate complete runnable Vitest TypeScript test suites. Cover happy path, edge cases, error handling, null inputs. Add comments explaining each test. Return ONLY executable TypeScript.`, `Generate complete Vitest suite for: ${name}\n\n\`\`\`\n${code.slice(0, 8000)}\n\`\`\`\n\nCover every export. Include edge cases.`); }
  catch { return DEMO_TESTS; }
}

export async function generatePRDescription(changes: string): Promise<PRDescription> {
  try {
    const raw = await callBobJSON(`You are IBM Bob. Write professional, complete PR descriptions for software changes.`, `Write a PR description for these changes:\n${changes}\n\nReturn ONLY JSON: { "title": "conventional commit style title", "type": "feat|fix|refactor|docs|test|chore", "summary": "2-3 sentence summary", "changes": ["change1","change2","change3"], "testingNotes": "how to verify", "reviewNotes": "what reviewers should focus on" }`);
    return JSON.parse(raw);
  } catch { return DEMO_PR; }
}

export async function generateOnboarding(ctx: string): Promise<OnboardingGuide> {
  try {
    const raw = await callBobJSON(`You are IBM Bob. You have indexed the entire repository and are helping a new developer get up to speed as fast as possible.`, `Generate an onboarding guide for a new developer joining this project:\n${ctx}\n\nReturn ONLY JSON: { "repoName": "project name", "overview": "2-3 sentence architecture overview", "sections": [{ "icon": "emoji", "title": "section title", "content": "intro sentence", "items": ["bullet1","bullet2","bullet3"] }], "firstTask": "specific first PR recommendation" }\n\nInclude 4 sections: Start Here (key files), Architecture, Common Patterns, First Week plan.`);
    return JSON.parse(raw);
  } catch { return DEMO_ONBOARDING; }
}

export async function reviewCode(code: string): Promise<CodeReviewResult> {
  try {
    const raw = await callBobJSON(`You are IBM Bob acting as a senior staff engineer doing a thorough code review. Be specific, reference actual code patterns, and give actionable feedback.`, `Review this code:\n\`\`\`\n${code.slice(0, 8000)}\n\`\`\`\n\nReturn ONLY JSON: { "verdict": "Approve|Request Changes|Comment", "score": 0-100, "whatIsGood": ["point1","point2"], "whatNeedsWork": ["issue1","issue2","issue3"], "risks": ["risk1","risk2"], "suggestions": ["fix1","fix2","fix3"], "summary": "2-3 sentence overall verdict" }`);
    return JSON.parse(raw);
  } catch { return DEMO_REVIEW; }
}

export async function generateHealthScore(ctx: string): Promise<HealthScore> {
  try {
    const raw = await callBobJSON(`You are IBM Bob. Analyze a repository and produce a comprehensive health score.`, `Generate a health score for this repository:\n${ctx}\n\nReturn ONLY JSON: { "overall": 0-100, "testCoverage": 0-100, "documentation": 0-100, "security": 0-100, "complexity": 0-100, "codeQuality": 0-100, "summary": "2-3 sentence overview", "topIssue": "single biggest problem", "quickWin": "fastest improvement this sprint" }`);
    return JSON.parse(raw);
  } catch { return DEMO_HEALTH; }
}

export async function automateGenerateDocs(ctx: string): Promise<AutomationResult> {
  try { return { title: "README Generated", output: await callBob(`You are IBM Bob. Generate a comprehensive, production-quality README.md.`, `Generate README.md for:\n${ctx}\n\nInclude: overview, features, installation, usage, API reference, contributing, license.`), tag: "Documentation" }; }
  catch { return { title: "README Generated", output: "**Error:** Bob could not generate docs. Add your API key.", tag: "Documentation" }; }
}

export async function automateSecurityAudit(ctx: string): Promise<AutomationResult> {
  try { return { title: "Security Audit Complete", output: await callBob(`You are IBM Bob, a security auditor. Find real vulnerabilities with specific fixes.`, `Security audit:\n${ctx}\n\nProvide: 1. Critical Issues, 2. High Priority, 3. Medium Priority, 4. Dependency CVEs, 5. Security Wins. Format as markdown.`), tag: "Security" }; }
  catch { return { title: "Security Audit Complete", output: "**Error:** Bob could not complete the audit. Add your API key.", tag: "Security" }; }
}

export async function automateRefactor(ctx: string): Promise<AutomationResult> {
  try { return { title: "Refactor Plan Ready", output: await callBob(`You are IBM Bob. Provide specific refactoring plans with before/after code examples.`, `Refactor plan for:\n${ctx}\n\nProvide: 1. Top 3 targets, 2. Before/after code, 3. Type safety, 4. Performance, 5. Impact. Format as markdown.`), tag: "Refactoring" }; }
  catch { return { title: "Refactor Plan Ready", output: "**Error:** Bob could not generate plan. Add your API key.", tag: "Refactoring" }; }
}

export async function automateCICD(ctx: string): Promise<AutomationResult> {
  try { return { title: "CI/CD Config Generated", output: await callBob(`You are IBM Bob. Generate production-ready GitHub Actions YAML workflows.`, `GitHub Actions workflows for:\n${ctx}\n\n1. CI (.github/workflows/ci.yml): lint, typecheck, test, build\n2. Deploy (.github/workflows/deploy.yml): Vercel on main push\n3. PR checks (.github/workflows/pr.yml)\nOutput complete YAML.`), tag: "DevOps" }; }
  catch { return { title: "CI/CD Config Generated", output: "**Error:** Bob could not generate config. Add your API key.", tag: "DevOps" }; }
}

export async function generateSprintPlan(tasks: string): Promise<SprintPlan> {
  try {
    const raw = await callBobJSON(BOB_CORE, `Sprint plan for:\n${tasks}\n\nReturn ONLY JSON: { "sprintGoal": "...", "tasks": [{ "task": "...", "priority": "Critical|High|Medium|Low", "effort": "Small|Medium|Large", "roi": "...", "category": "Security|Performance|Feature|Debt|Documentation" }], "totalEstimatedHours": 40, "expectedImpact": "..." }`);
    return JSON.parse(raw);
  } catch {
    return { sprintGoal: "Stabilize auth, eliminate performance bottlenecks, increase test coverage.", tasks: [{ task: "Fix token revocation in auth service", priority: "Critical", effort: "Medium", roi: "Prevents session hijacking", category: "Security" }, { task: "Add memoization to HeavyGraph", priority: "High", effort: "Small", roi: "Eliminates 140ms re-render", category: "Performance" }, { task: "Write tests for authService.ts", priority: "High", effort: "Large", roi: "Reduces regression risk", category: "Debt" }], totalEstimatedHours: 38, expectedImpact: "Auth secure, UI 140ms faster, 60% test coverage on critical modules." };
  }
}

export async function fetchGitHubRepo(url: string): Promise<GitHubRepoInfo> {
  const m = url.match(/github\.com\/([^/]+)\/([^/\s?#]+)/);
  if (!m) throw new Error("Invalid GitHub URL");
  const [, owner, repo] = m;
  const clean = repo.replace(/\.git$/, "");
  const res = await fetch(`https://api.github.com/repos/${owner}/${clean}`);
  if (!res.ok) throw new Error("Repo not found or private");
  const data = await res.json();
  const treeRes = await fetch(`https://api.github.com/repos/${owner}/${clean}/git/trees/HEAD?recursive=0`);
  const tree = treeRes.ok ? await treeRes.json() : { tree: [] };
  const files = (tree.tree || []).filter((f: {type:string}) => f.type === "blob").slice(0, 50).map((f: {path:string}) => f.path);
  let readme = "";
  try { const r = await fetch(`https://api.github.com/repos/${owner}/${clean}/readme`); if (r.ok) { const d = await r.json(); readme = atob(d.content.replace(/\n/g,"")).slice(0,2000); } } catch {}
  return { name: data.name, description: data.description || "", language: data.language || "Unknown", stars: data.stargazers_count || 0, files, readme, topics: data.topics || [] };
}

export async function analyzeGitHubRepo(info: GitHubRepoInfo): Promise<BobRepoAnalysis> {
  try {
    const raw = await callBobJSON(BOB_CORE, `Analyze this GitHub repo:\nName: ${info.name}\nDescription: ${info.description}\nLanguage: ${info.language}\nStars: ${info.stars}\nTopics: ${info.topics.join(", ")}\nFiles: ${info.files.join(", ")}\nREADME:\n${info.readme}\n\nReturn ONLY JSON: { "summary": "...", "hotspots": ["...","...","..."], "recommendation": "...", "risk": "Low|Medium|High" }`);
    return JSON.parse(raw);
  } catch { return { summary: `${info.name} is a ${info.language} project. Based on the file structure, primary concerns are test coverage and documentation completeness.`, hotspots: ["Missing test directory", "README could be more detailed", "No CI/CD config detected"], recommendation: "Add GitHub Actions workflow for automated testing.", risk: "Medium" }; }
}
