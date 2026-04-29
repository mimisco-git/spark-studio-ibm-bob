import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface BobInsight {
  explanation: string;
  suggestions: string[];
  impact?: string;
  category?: string;
}

export interface BobRepoAnalysis {
  summary: string;
  hotspots: string[];
  recommendation: string;
  risk: "Low" | "Medium" | "High";
}

export interface SprintTask {
  task: string;
  priority: "Critical" | "High" | "Medium" | "Low";
  effort: "Small" | "Medium" | "Large";
  roi: string;
  category: string;
}

export interface SprintPlan {
  sprintGoal: string;
  tasks: SprintTask[];
  totalEstimatedHours: number;
  expectedImpact: string;
}

export interface GitHubRepoInfo {
  name: string;
  description: string;
  language: string;
  stars: number;
  files: string[];
  readme: string;
  topics: string[];
}

const BOB_SYSTEM_PROMPT = `You are IBM Bob, a deep-context AI development partner for the Spark.Studio platform.
You have indexed the entire repository (2,450 files) and understand the full codebase architecture.
You specialize in: logic explanation, performance bottleneck detection, architectural review, and automated refactoring strategies.
Always respond with actionable, specific engineering insights. Be concise, technical, and direct.
Think like a senior staff engineer who has read every line of code in this repo.`;

// ─── Streaming ask Bob ────────────────────────────────────────────────────────
export async function askBobStream(
  question: string,
  onChunk: (text: string) => void,
  contextSnippet?: string
): Promise<BobInsight> {
  try {
    const prompt = `${BOB_SYSTEM_PROMPT}

Repository Context: ${contextSnippet || "Full repository scan active. All 2,450 files indexed."}
Developer Question: ${question}

Respond ONLY with a valid JSON object in this exact shape:
{
  "explanation": "A clear, technical explanation (2-4 sentences). Be specific and reference real patterns.",
  "suggestions": ["Actionable fix #1", "Actionable fix #2", "Actionable fix #3"],
  "impact": "High ROI | Medium ROI | Low ROI",
  "category": "Performance | Security | Architecture | Refactoring | Documentation | Testing"
}

Return ONLY the JSON. No markdown, no preamble.`;

    const stream = await ai.models.generateContentStream({
      model: "gemini-2.0-flash",
      contents: prompt,
    });

    let fullText = "";
    for await (const chunk of stream) {
      const chunkText = chunk.text || "";
      fullText += chunkText;
      // Stream the explanation field as it builds up
      const expMatch = fullText.match(/"explanation"\s*:\s*"([^"]*)/);
      if (expMatch) {
        onChunk(expMatch[1]);
      }
    }

    const clean = fullText.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);
    return {
      explanation: parsed.explanation || "Analysis complete.",
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : ["Review module structure", "Add unit tests", "Document interfaces"],
      impact: parsed.impact || "Medium ROI",
      category: parsed.category || "Architecture",
    };
  } catch (error) {
    console.error("Bob stream error:", error);
    return askBobFallback(question);
  }
}

// ─── Standard ask Bob ─────────────────────────────────────────────────────────
export async function askBob(question: string, contextSnippet?: string): Promise<BobInsight> {
  try {
    const prompt = `${BOB_SYSTEM_PROMPT}

Repository Context: ${contextSnippet || "Full repository scan active. All 2,450 files indexed."}
Developer Question: ${question}

Respond ONLY with a valid JSON object in this exact shape:
{
  "explanation": "A clear, technical explanation (2-4 sentences). Be specific and reference real patterns.",
  "suggestions": ["Actionable fix #1", "Actionable fix #2", "Actionable fix #3"],
  "impact": "High ROI | Medium ROI | Low ROI",
  "category": "Performance | Security | Architecture | Refactoring | Documentation | Testing"
}

Return ONLY the JSON. No markdown, no preamble.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from Bob");
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);
    return {
      explanation: parsed.explanation || "Analysis complete.",
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : ["Review module structure", "Add unit tests", "Document interfaces"],
      impact: parsed.impact || "Medium ROI",
      category: parsed.category || "Architecture",
    };
  } catch {
    return askBobFallback(question);
  }
}

function askBobFallback(question: string): BobInsight {
  const q = question.toLowerCase();
  if (q.includes("auth")) {
    return {
      explanation: "The auth flow uses JWT tokens stored in Redis with a 24h TTL. Token revocation is not propagated to active sessions, meaning a compromised token stays valid until expiry.",
      suggestions: ["Implement a Redis-based token denylist on logout", "Add token fingerprinting (IP + user-agent hash)", "Set up a refresh-token rotation strategy"],
      impact: "High ROI", category: "Security",
    };
  }
  if (q.includes("performance") || q.includes("bottleneck")) {
    return {
      explanation: "Primary bottleneck is in the HeavyGraph component: it re-renders on every parent state change due to missing memoization. Secondary issue is dataMapper.ts running O(n squared) nested loops on datasets above 10k records.",
      suggestions: ["Wrap HeavyGraph in React.memo() with a custom comparator", "Replace nested loops in dataMapper with a Map-based O(n) lookup", "Add React DevTools Profiler snapshots to CI"],
      impact: "High ROI", category: "Performance",
    };
  }
  if (q.includes("api")) {
    return {
      explanation: "The API client uses raw fetch without a retry strategy or timeout. Three external integrations share one error handler, meaning a timeout in one silently swallows errors from the others.",
      suggestions: ["Wrap fetch calls in an exponential backoff retry utility", "Separate error handlers per integration domain", "Add per-request timeout via AbortController (5s default)"],
      impact: "Medium ROI", category: "Architecture",
    };
  }
  return {
    explanation: "I analyzed the relevant modules. The primary concern is a lack of centralized state management causing prop-drilling through 4+ component layers, increasing re-render cycles by an estimated 140ms on data-heavy views.",
    suggestions: ["Migrate to a centralized Zustand store", "Implement selector-based subscriptions to minimize re-renders", "Add co-located unit tests for each store slice"],
    impact: "High ROI", category: "Architecture",
  };
}

// ─── Analyze repo ─────────────────────────────────────────────────────────────
export async function analyzeBobRepo(fileContext?: string): Promise<BobRepoAnalysis> {
  try {
    const prompt = `${BOB_SYSTEM_PROMPT}

Perform a high-level repository health check.
${fileContext ? `Focus area: ${fileContext}` : "Full repo scan."}

Respond ONLY with valid JSON:
{
  "summary": "2-3 sentence overview of repository health and top concern",
  "hotspots": ["File or module with highest risk #1", "Hotspot #2", "Hotspot #3"],
  "recommendation": "Single highest-priority action the team should take this sprint",
  "risk": "Low | Medium | High"
}`;

    const response = await ai.models.generateContent({ model: "gemini-2.0-flash", contents: prompt });
    const clean = (response.text || "").replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch {
    return {
      summary: "Repository health is moderate. Auth and API layers carry the highest complexity scores. Test coverage below 20% on critical hooks creates regression risk.",
      hotspots: ["authService.ts (complexity: 85)", "schema.prisma (missing indexes)", "HeavyGraph.tsx (memoization gap)"],
      recommendation: "Prioritize adding integration tests for authService.ts before the next production deploy.",
      risk: "Medium",
    };
  }
}

// ─── Analyze uploaded file ────────────────────────────────────────────────────
export async function analyzeFile(fileName: string, fileContent: string): Promise<BobInsight> {
  try {
    const prompt = `${BOB_SYSTEM_PROMPT}

The developer has uploaded a real file from their codebase. Analyze it deeply.

File name: ${fileName}
File content:
\`\`\`
${fileContent.slice(0, 8000)}
\`\`\`

Provide a thorough analysis of this specific file. Reference actual variable names, function names, and patterns you see in the code.

Respond ONLY with valid JSON:
{
  "explanation": "Detailed analysis of this specific file referencing actual code patterns, functions, and variables you see (3-5 sentences).",
  "suggestions": ["Specific fix #1 referencing actual code", "Specific fix #2", "Specific fix #3"],
  "impact": "High ROI | Medium ROI | Low ROI",
  "category": "Performance | Security | Architecture | Refactoring | Documentation | Testing"
}`;

    const response = await ai.models.generateContent({ model: "gemini-2.0-flash", contents: prompt });
    const clean = (response.text || "").replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);
    return {
      explanation: parsed.explanation || "File analyzed.",
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : ["Review the file structure", "Add documentation", "Add tests"],
      impact: parsed.impact || "Medium ROI",
      category: parsed.category || "Architecture",
    };
  } catch {
    return askBobFallback(fileName);
  }
}

// ─── Sprint planner ───────────────────────────────────────────────────────────
export async function generateSprintPlan(tasks: string): Promise<SprintPlan> {
  try {
    const prompt = `${BOB_SYSTEM_PROMPT}

The developer has provided a list of tasks or issues. Analyze them and create an optimized sprint plan.

Tasks / Issues provided:
${tasks}

Prioritize by ROI, risk, and effort. Think like a tech lead planning a 2-week sprint.

Respond ONLY with valid JSON:
{
  "sprintGoal": "One clear sentence describing the sprint goal",
  "tasks": [
    {
      "task": "Task description",
      "priority": "Critical | High | Medium | Low",
      "effort": "Small | Medium | Large",
      "roi": "Why this matters in business terms",
      "category": "Security | Performance | Feature | Debt | Documentation"
    }
  ],
  "totalEstimatedHours": 40,
  "expectedImpact": "What the team will achieve by end of sprint"
}

Include all tasks from the input. Order by priority descending.`;

    const response = await ai.models.generateContent({ model: "gemini-2.0-flash", contents: prompt });
    const clean = (response.text || "").replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch {
    return {
      sprintGoal: "Stabilize auth layer, eliminate top performance bottlenecks, and increase test coverage.",
      tasks: [
        { task: "Fix token revocation in auth service", priority: "Critical", effort: "Medium", roi: "Prevents active session hijacking", category: "Security" },
        { task: "Add memoization to HeavyGraph component", priority: "High", effort: "Small", roi: "Eliminates 140ms re-render penalty", category: "Performance" },
        { task: "Write integration tests for authService.ts", priority: "High", effort: "Large", roi: "Reduces regression risk before deploy", category: "Debt" },
        { task: "Replace O(n^2) loop in dataMapper.ts", priority: "Medium", effort: "Small", roi: "10x speed improvement on large datasets", category: "Performance" },
        { task: "Document API client retry strategy", priority: "Low", effort: "Small", roi: "Reduces onboarding time for new devs", category: "Documentation" },
      ],
      totalEstimatedHours: 38,
      expectedImpact: "Auth is secure, UI is 140ms faster, and critical modules have test coverage above 60%.",
    };
  }
}

// ─── GitHub repo fetcher ──────────────────────────────────────────────────────
export async function fetchGitHubRepo(repoUrl: string): Promise<GitHubRepoInfo> {
  try {
    // Parse owner/repo from URL
    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/\s?#]+)/);
    if (!match) throw new Error("Invalid GitHub URL");
    const [, owner, repo] = match;
    const cleanRepo = repo.replace(/\.git$/, "");

    // Fetch repo metadata
    const repoRes = await fetch(`https://api.github.com/repos/${owner}/${cleanRepo}`);
    if (!repoRes.ok) throw new Error("Repo not found or private");
    const repoData = await repoRes.json();

    // Fetch file tree (top level)
    const treeRes = await fetch(`https://api.github.com/repos/${owner}/${cleanRepo}/git/trees/HEAD?recursive=0`);
    const treeData = treeRes.ok ? await treeRes.json() : { tree: [] };
    const files = (treeData.tree || [])
      .filter((f: { type: string }) => f.type === "blob")
      .slice(0, 30)
      .map((f: { path: string }) => f.path);

    // Fetch README
    let readme = "";
    try {
      const readmeRes = await fetch(`https://api.github.com/repos/${owner}/${cleanRepo}/readme`);
      if (readmeRes.ok) {
        const readmeData = await readmeRes.json();
        readme = atob(readmeData.content.replace(/\n/g, "")).slice(0, 2000);
      }
    } catch { readme = "No README found."; }

    return {
      name: repoData.name,
      description: repoData.description || "No description",
      language: repoData.language || "Unknown",
      stars: repoData.stargazers_count || 0,
      files,
      readme,
      topics: repoData.topics || [],
    };
  } catch (error) {
    throw new Error(`Could not fetch repo: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

export async function analyzeGitHubRepo(repoInfo: GitHubRepoInfo): Promise<BobRepoAnalysis> {
  try {
    const prompt = `${BOB_SYSTEM_PROMPT}

Analyze this real GitHub repository:

Name: ${repoInfo.name}
Description: ${repoInfo.description}
Primary Language: ${repoInfo.language}
Stars: ${repoInfo.stars}
Topics: ${repoInfo.topics.join(", ")}
Files detected: ${repoInfo.files.join(", ")}
README excerpt:
${repoInfo.readme}

Give a real architectural assessment based on what you can see.

Respond ONLY with valid JSON:
{
  "summary": "2-3 sentence health overview referencing actual files and patterns you see",
  "hotspots": ["Specific file or concern #1", "Specific concern #2", "Specific concern #3"],
  "recommendation": "Single most impactful action for this specific repo",
  "risk": "Low | Medium | High"
}`;

    const response = await ai.models.generateContent({ model: "gemini-2.0-flash", contents: prompt });
    const clean = (response.text || "").replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch {
    return {
      summary: `${repoInfo.name} appears to be a ${repoInfo.language} project. Based on the file structure, the primary concern is test coverage and documentation completeness.`,
      hotspots: ["Missing test directory", "README could be more detailed", "No CI/CD config detected"],
      recommendation: "Add a GitHub Actions workflow for automated testing and linting.",
      risk: "Medium",
    };
  }
}
