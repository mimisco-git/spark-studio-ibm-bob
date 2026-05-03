import { motion, AnimatePresence } from "motion/react";
import {
  Zap, Activity as ActivityIcon, Plus, Code2, BookOpen, Cpu, ShieldCheck,
  MessageSquareCode, Search, Sparkles, Loader2, PieChart as PieChartIcon,
  Layers, Wand2, FileCode2, GitBranch, Settings, Sun, Moon, Download,
  AlertTriangle, CheckCircle2, TrendingUp, ArrowRight, X, Menu, Upload,
  Terminal, ChevronRight, Github, ListTodo, FolderOpen, Copy, Check,
  FlaskConical, Shield, FileText,
} from "lucide-react";
import { useState, useEffect, ReactNode, useCallback, useRef } from "react";
import {
  askBobStream, analyzeBobRepo, analyzeFile, generateSprintPlan,
  fetchGitHubRepo, analyzeGitHubRepo, generateDocumentation, generateTests,
  automateGenerateDocs, automateSecurityAudit, automateRefactor, automateCICD,
  BobInsight, BobRepoAnalysis, SprintPlan, GitHubRepoInfo, AutomationResult,
} from "./services/bobService";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from "recharts";

const REPO_DATA = [
  { name: "TypeScript", value: 65, color: "#0F62FE" },
  { name: "Testing",    value: 15, color: "#D12771" },
  { name: "Config",     value: 10, color: "#F1C21B" },
  { name: "Docs",       value: 10, color: "#11D3BC" },
];
const COMPLEXITY_DATA = [
  { module: "Auth",  score: 85 },
  { module: "API",   score: 60 },
  { module: "Store", score: 45 },
  { module: "Hooks", score: 55 },
  { module: "UI",    score: 30 },
];
const ARCHITECTURE = [
  { label: "Auth Pattern",  value: "JWT + Cascading Redis Cache",    status: "Verified"   },
  { label: "Data Flow",     value: "Unidirectional via Store Hooks", status: "Stable"     },
  { label: "API Strategy",  value: "RESTful with Zod Validation",    status: "Optimized"  },
  { label: "Deployment",    value: "Dockerized Node Express",        status: "Production" },
];
const FILES = [
  { name: "authService.ts", complexity: "High" },
  { name: "dataMapper.ts",  complexity: "Med"  },
  { name: "apiClient.ts",   complexity: "Med"  },
  { name: "app.tsx",        complexity: "Low"  },
  { name: "schema.prisma",  complexity: "High" },
];
const BOOT_STEPS = [
  "Connecting to IBM Bob Core...",
  "Indexing repository: 2,450 files...",
  "Building dependency graph...",
  "Mapping architectural patterns...",
  "Context engine ready.",
];
const PRIORITY_COLORS: Record<string, string> = {
  Critical: "bg-red-500", High: "bg-brand-pink", Medium: "bg-brand-yellow", Low: "bg-brand-teal",
};
const EFFORT_COLORS: Record<string, string> = {
  Small: "text-brand-teal", Medium: "text-brand-yellow", Large: "text-brand-pink",
};

type Recommendation = { id: string; message: string; time: string; action?: { type: string; icon: ReactNode }; };
type Workflow = { id: string; label: string; progress: number; icon: ReactNode; done?: boolean; };
type ChatMessage = { id: string; role: "user" | "bob"; content: string; streaming?: boolean; suggestions?: string[]; impact?: string; category?: string; };

const STORAGE_KEY = "spark_studio_chat_v2";

export default function App() {
  const [booted,          setBooted]          = useState(false);
  const [bootStep,        setBootStep]        = useState(0);
  const [showLanding,     setShowLanding]     = useState(true);
  const [activeTab,       setActiveTab]       = useState("intelligence");
  const [darkMode,        setDarkMode]        = useState(false);
  const [mobileMenuOpen,  setMobileMenuOpen]  = useState(false);
  const [query,           setQuery]           = useState("");
  const [loading,         setLoading]         = useState(false);
  const [repoLoading,     setRepoLoading]     = useState(false);
  const [repoAnalysis,    setRepoAnalysis]    = useState<BobRepoAnalysis | null>(null);
  const [selectedFile,    setSelectedFile]    = useState<string | null>(null);
  const [copiedId,        setCopiedId]        = useState<string | null>(null);
  const [chatHistory,     setChatHistory]     = useState<ChatMessage[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
  });

  // Code paste
  const [showCodeInput,   setShowCodeInput]   = useState(false);
  const [codeInput,       setCodeInput]       = useState("");

  // File upload
  const [uploadedFile,    setUploadedFile]    = useState<{ name: string; content: string } | null>(null);
  const [uploadLoading,   setUploadLoading]   = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // GitHub
  const [showGithub,      setShowGithub]      = useState(false);
  const [githubUrl,       setGithubUrl]       = useState("");
  const [githubLoading,   setGithubLoading]   = useState(false);
  const [githubInfo,      setGithubInfo]      = useState<GitHubRepoInfo | null>(null);
  const [githubError,     setGithubError]     = useState("");

  // Sprint
  const [showSprint,      setShowSprint]      = useState(false);
  const [sprintInput,     setSprintInput]     = useState("");
  const [sprintLoading,   setSprintLoading]   = useState(false);
  const [sprintPlan,      setSprintPlan]      = useState<SprintPlan | null>(null);

  // Bob Tools tab
  const [toolsFile,       setToolsFile]       = useState<{ name: string; content: string } | null>(null);
  const [toolsMode,       setToolsMode]       = useState<"docs" | "tests">("docs");
  const [toolsOutput,     setToolsOutput]     = useState("");
  const [toolsLoading,    setToolsLoading]    = useState(false);
  const toolsFileRef = useRef<HTMLInputElement>(null);

  // Automation results
  const [automationResult, setAutomationResult] = useState<AutomationResult | null>(null);
  const [automationLoading, setAutomationLoading] = useState<string | null>(null);

  const [recommendations, setRecommendations] = useState<Recommendation[]>([
    { id: "r1", message: "Found 3 circular dependencies in /src/lib", time: "Now" },
    { id: "r2", message: "Exporting 'User' type would fix 12 TS errors", time: "5m ago" },
  ]);
  const [activeWorkflows, setActiveWorkflows] = useState<Workflow[]>([
    { id: "w1", label: "Automating Docs",   progress: 64, icon: <Code2 size={16} /> },
    { id: "w2", label: "Mapping Data flow", progress: 82, icon: <Cpu  size={16} /> },
  ]);

  const workflowIntervals = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());
  const chatEndRef        = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let step = 0;
    const t = setInterval(() => {
      step++;
      setBootStep(step);
      if (step >= BOOT_STEPS.length) { clearInterval(t); setTimeout(() => setBooted(true), 600); }
    }, 520);
    return () => clearInterval(t);
  }, []);

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(chatHistory.slice(-50))); }, [chatHistory]);
  useEffect(() => { document.documentElement.classList.toggle("dark", darkMode); }, [darkMode]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatHistory]);
  useEffect(() => { return () => { workflowIntervals.current.forEach(i => clearInterval(i)); }; }, []);

  useEffect(() => {
    const items = [
      { msg: "Detected redundant state in authService.ts",  type: "Refactoring",   icon: <GitBranch    size={16} /> },
      { msg: "API client could use a retry wrapper",         type: "Safety",        icon: <ShieldCheck  size={16} /> },
      { msg: "Database schema missing index on email field", type: "DevOps",        icon: <Settings     size={16} /> },
      { msg: "Logic gap detected in session validation",     type: "Safety",        icon: <ShieldCheck  size={16} /> },
      { msg: "Unit test coverage for hooks is below 20%",    type: "Documentation", icon: <FileCode2    size={16} /> },
      { msg: "Potential memory leak in useWebSocket hook",   type: "Performance",   icon: <AlertTriangle size={16}/> },
    ];
    const interval = setInterval(() => {
      const pick = items[Math.floor(Math.random() * items.length)];
      const id   = `live-${Date.now()}`;
      setRecommendations(prev => [
        { id, message: pick.msg, time: "Just now", action: { type: pick.type, icon: pick.icon } },
        ...prev.slice(0, 4),
      ]);
    }, 12000);
    return () => clearInterval(interval);
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAskBob = useCallback(async (overrideQuery?: string, codeCtx?: string) => {
    const q = (overrideQuery ?? query).trim();
    if (!q) return;
    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: "user", content: q };
    const bobId = `b-${Date.now()}`;
    const bobPlaceholder: ChatMessage = { id: bobId, role: "bob", content: "", streaming: true };
    setChatHistory(prev => [...prev, userMsg, bobPlaceholder]);
    setQuery("");
    setLoading(true);
    const context = codeCtx ? `User-provided code:\n${codeCtx}` : selectedFile ? `File context: ${selectedFile}` : undefined;
    const result = await askBobStream(q, (streamedText) => {
      setChatHistory(prev => prev.map(m => m.id === bobId ? { ...m, content: streamedText } : m));
    }, context);
    setChatHistory(prev => prev.map(m =>
      m.id === bobId ? { ...m, content: result.explanation, suggestions: result.suggestions, impact: result.impact, category: result.category, streaming: false } : m
    ));
    setLoading(false);
  }, [query, selectedFile]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadLoading(true);
    const content = await file.text();
    setUploadedFile({ name: file.name, content });
    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: "user", content: `Analyze my uploaded file: ${file.name}` };
    const bobId = `b-${Date.now()}`;
    setChatHistory(prev => [...prev, userMsg, { id: bobId, role: "bob", content: "", streaming: true }]);
    setActiveTab("explainer");
    const result = await analyzeFile(file.name, content);
    setChatHistory(prev => prev.map(m =>
      m.id === bobId ? { ...m, content: result.explanation, suggestions: result.suggestions, impact: result.impact, category: result.category, streaming: false } : m
    ));
    setUploadLoading(false);
    if (e.target) e.target.value = "";
  };

  const handleToolsFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const content = await file.text();
    setToolsFile({ name: file.name, content });
    setToolsOutput("");
    if (e.target) e.target.value = "";
  };

  const handleRunTool = async () => {
    if (!toolsFile) return;
    setToolsLoading(true);
    setToolsOutput("");
    if (toolsMode === "docs") {
      const result = await generateDocumentation(toolsFile.name, toolsFile.content);
      setToolsOutput(result);
    } else {
      const result = await generateTests(toolsFile.name, toolsFile.content);
      setToolsOutput(result);
    }
    setToolsLoading(false);
  };

  const selectFile = (fileName: string) => {
    setSelectedFile(fileName);
    setActiveTab("explainer");
    handleAskBob(`Explain the logic and architecture of ${fileName}`, `File context: ${fileName}`);
  };

  const handleCodeAnalyze = () => {
    if (!codeInput.trim()) return;
    setShowCodeInput(false);
    setActiveTab("explainer");
    handleAskBob("Analyze this code for architecture issues, performance bottlenecks, and security risks.", codeInput);
    setCodeInput("");
  };

  const handleGithubAnalyze = async () => {
    if (!githubUrl.trim()) return;
    setGithubLoading(true);
    setGithubError("");
    setGithubInfo(null);
    try {
      const info = await fetchGitHubRepo(githubUrl);
      setGithubInfo(info);
      const analysis = await analyzeGitHubRepo(info);
      setRepoAnalysis(analysis);
      const bobMsg: ChatMessage = {
        id: `b-${Date.now()}`, role: "bob",
        content: analysis.summary,
        suggestions: analysis.hotspots,
        impact: `${analysis.risk} Risk`,
        category: "Architecture",
      };
      setChatHistory(prev => [...prev, { id: `u-${Date.now()}`, role: "user", content: `Analyze the GitHub repo: ${githubUrl}` }, bobMsg]);
      setActiveTab("explainer");
      setShowGithub(false);
    } catch (err) {
      setGithubError(err instanceof Error ? err.message : "Could not fetch repo. Make sure it is public.");
    }
    setGithubLoading(false);
  };

  const handleSprintPlan = async () => {
    if (!sprintInput.trim()) return;
    setSprintLoading(true);
    const plan = await generateSprintPlan(sprintInput);
    setSprintPlan(plan);
    setSprintLoading(false);
  };

  const handleAnalyzeRepo = async () => {
    setRepoLoading(true);
    const result = await analyzeBobRepo();
    setRepoAnalysis(result);
    setRepoLoading(false);
  };

  const handleAutomation = async (type: "docs" | "security" | "refactor" | "cicd", label: string, icon: ReactNode) => {
    setAutomationLoading(type);
    setAutomationResult(null);
    const context = githubInfo
      ? `Repo: ${githubInfo.name}\nLanguage: ${githubInfo.language}\nFiles: ${githubInfo.files.slice(0, 20).join(", ")}\nDescription: ${githubInfo.description}`
      : `Project context: TypeScript React application with 2,450 files. Auth service, API client, data mapper, Prisma schema, React hooks.`;
    let result: AutomationResult;
    if (type === "docs") result = await automateGenerateDocs(context);
    else if (type === "security") result = await automateSecurityAudit(context);
    else if (type === "refactor") result = await automateRefactor(context);
    else result = await automateCICD(context);
    setAutomationResult(result);
    setAutomationLoading(null);
    launchWorkflow(label, icon);
  };

  const launchWorkflow = (label: string, icon: ReactNode) => {
    const id = Math.random().toString(36).slice(2, 9);
    setActiveWorkflows(prev => [{ id, label, progress: 0, icon }, ...prev]);
    const interval = setInterval(() => {
      setActiveWorkflows(prev => prev.map(w => {
        if (w.id !== id) return w;
        const next = Math.min(w.progress + Math.floor(Math.random() * 18) + 5, 100);
        if (next >= 100) { clearInterval(interval); workflowIntervals.current.delete(id); return { ...w, progress: 100, done: true }; }
        return { ...w, progress: next };
      }));
    }, 900);
    workflowIntervals.current.set(id, interval);
  };

  const handleExportReport = () => {
    const report = {
      generatedBy: "IBM Bob via Spark.Studio", timestamp: new Date().toISOString(),
      repositoryStats: { totalFiles: githubInfo?.files.length || 2450, language: githubInfo?.language || "TypeScript" },
      roi: { devTimeReclaimed: "48h/sprint", estimatedSavings: "$14,200", riskMitigation: "86%" },
      composition: REPO_DATA, complexity: COMPLEXITY_DATA, architecture: ARCHITECTURE,
      recommendations: recommendations.slice(0, 5).map(r => r.message),
      chatHistory: chatHistory.map(m => ({ role: m.role, content: m.content })),
      sprintPlan: sprintPlan || null, repoAnalysis: repoAnalysis || null, githubInfo: githubInfo || null,
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `ibm-bob-report-${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  const goTab = (tab: string) => { setActiveTab(tab); setMobileMenuOpen(false); };

  // Dynamic stats from GitHub
  const statsFileCount = githubInfo ? githubInfo.files.length : 2450;
  const statsLanguage = githubInfo ? githubInfo.language : "TypeScript";

  // ── Boot screen ──────────────────────────────────────────────────────────────
  if (!booted) {
    return (
      <div className="min-h-screen bg-brand-black flex flex-col items-center justify-center gap-8 font-mono">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center gap-4">
          <div className="w-16 h-16 bg-brand-indigo rounded-2xl border-4 border-white flex items-center justify-center shadow-[0_0_40px_rgba(15,98,254,0.6)]">
            <span className="text-white font-black text-4xl">B</span>
          </div>
          <div>
            <div className="text-white text-3xl font-black uppercase italic">SPARK<span className="text-brand-pink">.</span>STUDIO</div>
            <div className="text-brand-teal text-xs font-black uppercase tracking-widest">Powered by IBM Bob</div>
          </div>
        </motion.div>
        <div className="w-80 space-y-3">
          {BOOT_STEPS.map((step, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: i < bootStep ? 1 : 0.2, x: 0 }} transition={{ delay: i * 0.1 }} className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full shrink-0 ${i < bootStep ? "bg-brand-teal" : "bg-white/20"}`} />
              <span className={`text-xs font-bold uppercase tracking-widest ${i < bootStep ? "text-brand-teal" : "text-white/30"}`}>{step}</span>
            </motion.div>
          ))}
        </div>
        <div className="w-80 h-1 bg-white/10 rounded-full overflow-hidden">
          <motion.div className="h-full bg-brand-teal" animate={{ width: `${(bootStep / BOOT_STEPS.length) * 100}%` }} transition={{ duration: 0.4 }} />
        </div>
      </div>
    );
  }

  // ── Landing ──────────────────────────────────────────────────────────────────
  if (showLanding) {
    return (
      <div className="min-h-screen bg-brand-black text-white flex flex-col overflow-hidden relative">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "linear-gradient(#0F62FE 1px,transparent 1px),linear-gradient(90deg,#0F62FE 1px,transparent 1px)", backgroundSize: "40px 40px" }} />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-brand-indigo/20 rounded-full blur-[120px]" />
        <nav className="relative z-10 h-20 px-8 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-indigo rounded-xl border-2 border-white flex items-center justify-center"><span className="text-white font-black text-2xl">B</span></div>
            <span className="text-xl font-black uppercase italic">SPARK<span className="text-brand-pink">.</span>STUDIO</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-black text-brand-teal uppercase tracking-widest hidden sm:block">IBM Bob Hackathon 2026</span>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowLanding(false)}
              className="bg-brand-indigo text-white px-6 py-3 rounded-xl border-2 border-white font-black text-sm uppercase tracking-widest flex items-center gap-2"
            >
              Launch App <ArrowRight size={16} />
            </motion.button>
          </div>
        </nav>
        <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center gap-10 py-20">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-4xl">
            <div className="inline-flex items-center gap-2 bg-brand-teal/10 border border-brand-teal/30 px-4 py-2 rounded-full">
              <span className="w-2 h-2 bg-brand-teal rounded-full animate-pulse" />
              <span className="text-brand-teal text-xs font-black uppercase tracking-widest">Bob is online. 2,450 files indexed.</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black uppercase italic leading-none tracking-tighter">
              Your Repo.<br /><span className="text-brand-indigo">Your Rules.</span><br /><span className="text-brand-pink">AI as your</span> Dev Partner.
            </h1>
            <p className="text-lg md:text-xl text-white/60 font-medium max-w-2xl mx-auto leading-relaxed">
              Spark.Studio uses IBM Bob to index your entire codebase, explain complex logic, generate documentation and tests, plan sprints, and automate the work that slows your team down.
            </p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl w-full">
            {[
              { icon: <MessageSquareCode size={20} />, label: "Logic Explainer", desc: "Ask Bob anything about your code", tab: "explainer", color: "border-brand-indigo text-brand-indigo" },
              { icon: <FileText size={20} />, label: "Doc Generator", desc: "Auto-generate full documentation", tab: "tools", color: "border-brand-teal text-brand-teal" },
              { icon: <FlaskConical size={20} />, label: "Test Synthesizer", desc: "Generate Vitest test suites", tab: "tools", color: "border-brand-pink text-brand-pink" },
              { icon: <Wand2 size={20} />, label: "Automation Lab", desc: "Refactor, audit, CI/CD generation", tab: "automation", color: "border-brand-yellow text-brand-yellow" },
            ].map((f, i) => (
              <motion.button key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.1 }}
                onClick={() => { setShowLanding(false); setActiveTab(f.tab); if (f.tab === "tools") setToolsMode(i === 2 ? "tests" : "docs"); }}
                className={`bg-white/5 hover:bg-white/10 border-2 ${f.color} rounded-2xl p-4 text-left transition-all hover:-translate-y-1`}
              >
                <div className="mb-2">{f.icon}</div>
                <div className="font-black text-sm uppercase text-white">{f.label}</div>
                <div className="text-[10px] text-white/50 mt-1">{f.desc}</div>
              </motion.button>
            ))}
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex flex-wrap gap-4 justify-center">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowLanding(false)}
              className="bg-brand-pink text-white px-10 py-5 rounded-2xl border-4 border-white font-black text-lg uppercase tracking-widest flex items-center gap-3 shadow-[8px_8px_0_white]"
            >
              <Cpu size={24} /> Start with Bob
            </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} onClick={() => { setShowLanding(false); setShowGithub(true); }}
              className="bg-transparent text-white px-10 py-5 rounded-2xl border-4 border-white/30 font-black text-lg uppercase tracking-widest flex items-center gap-3 hover:border-white transition-colors"
            >
              <Github size={24} /> Connect GitHub Repo
            </motion.button>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl w-full">
            {[
              { label: "Files Indexed",   value: "2,450",  color: "text-brand-teal"   },
              { label: "Dev Hours Saved", value: "+48h",   color: "text-brand-yellow" },
              { label: "Risk Mitigation", value: "86%",    color: "text-brand-pink"   },
              { label: "Est. Savings",    value: "$14.2k", color: "text-brand-indigo" },
            ].map((s, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col">
                <span className={`text-3xl font-black ${s.color}`}>{s.value}</span>
                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest mt-1">{s.label}</span>
              </div>
            ))}
          </motion.div>
        </main>
        <footer className="relative z-10 h-12 px-8 border-t border-white/10 flex items-center justify-between text-[10px] font-black uppercase text-white/30 tracking-widest">
          <span>IBM Bob Hackathon 2026</span>
          <span>Spark.Studio: Built for speed. Built with Bob.</span>
        </footer>
      </div>
    );
  }

  // ── Dashboard ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col bg-brand-bg text-brand-black font-sans">
      <input ref={fileInputRef} type="file" accept=".ts,.tsx,.js,.jsx,.py,.go,.rs,.java,.cs,.cpp,.c,.json,.yaml,.yml,.md,.prisma,.sql" className="hidden" onChange={handleFileUpload} />
      <input ref={toolsFileRef} type="file" accept=".ts,.tsx,.js,.jsx,.py,.go,.rs,.java,.cs,.cpp,.c,.json,.yaml,.yml,.md,.prisma,.sql" className="hidden" onChange={handleToolsFileUpload} />

      {/* Code Modal */}
      <AnimatePresence>
        {showCodeInput && (
          <Modal onClose={() => setShowCodeInput(false)} title="Paste Your Code" icon={<Upload size={24} className="text-brand-indigo" />}>
            <p className="text-sm font-bold text-brand-black/60 dark:text-white/60">Paste any code snippet and Bob will analyze it with full architectural context.</p>
            <textarea value={codeInput} onChange={e => setCodeInput(e.target.value)} placeholder="// Paste your code here..."
              className="w-full h-56 bg-brand-bg dark:bg-brand-dark-bg border-2 border-brand-black dark:border-white rounded-xl p-4 font-mono text-sm resize-none focus:outline-none focus:ring-4 focus:ring-brand-indigo/20 dark:text-white" autoFocus />
            <div className="flex gap-3">
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={handleCodeAnalyze} disabled={!codeInput.trim()}
                className="flex-1 bg-brand-indigo text-white py-3 rounded-xl border-2 border-brand-black dark:border-white shadow-brutal font-black uppercase text-sm flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-brand-pink transition-colors"
              >
                <Terminal size={18} /> Analyze with Bob
              </motion.button>
              <button onClick={() => setCodeInput("")} className="px-4 py-3 border-2 border-brand-black dark:border-white rounded-xl font-black text-sm uppercase dark:text-white">Clear</button>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* GitHub Modal */}
      <AnimatePresence>
        {showGithub && (
          <Modal onClose={() => { setShowGithub(false); setGithubError(""); setGithubInfo(null); }} title="GitHub Connector" icon={<Github size={24} className="text-brand-indigo" />}>
            <p className="text-sm font-bold text-brand-black/60 dark:text-white/60">Paste any public GitHub repo URL. Bob will fetch the real file tree, README, and give a live architectural assessment.</p>
            <input value={githubUrl} onChange={e => setGithubUrl(e.target.value)} onKeyDown={e => { if (e.key === "Enter") handleGithubAnalyze(); }}
              placeholder="https://github.com/owner/repo"
              className="w-full bg-brand-bg dark:bg-brand-dark-bg border-2 border-brand-black dark:border-white rounded-xl p-4 font-mono text-sm focus:outline-none focus:ring-4 focus:ring-brand-indigo/20 dark:text-white"
            />
            {githubError && <p className="text-xs font-bold text-brand-pink bg-brand-pink/10 px-3 py-2 rounded-lg border border-brand-pink/30">{githubError}</p>}
            {githubInfo && (
              <div className="bg-brand-bg dark:bg-brand-dark-bg rounded-xl border-2 border-brand-black/20 dark:border-white/20 p-4 space-y-2">
                <p className="font-black text-brand-indigo dark:text-brand-teal">{githubInfo.name}</p>
                <p className="text-xs font-bold dark:text-white/70">{githubInfo.description}</p>
                <div className="flex gap-3 text-[10px] font-black uppercase">
                  <span className="text-brand-teal">{githubInfo.language}</span>
                  <span className="text-brand-yellow">{githubInfo.stars} stars</span>
                  <span className="text-brand-pink">{githubInfo.files.length} files detected</span>
                </div>
              </div>
            )}
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={handleGithubAnalyze} disabled={githubLoading || !githubUrl.trim()}
              className="w-full bg-brand-indigo text-white py-3 rounded-xl border-2 border-brand-black dark:border-white shadow-brutal font-black uppercase text-sm flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-brand-pink transition-colors"
            >
              {githubLoading ? <><Loader2 size={18} className="animate-spin" /> Fetching repo...</> : <><Github size={18} /> Analyze with Bob</>}
            </motion.button>
          </Modal>
        )}
      </AnimatePresence>

      {/* Sprint Modal */}
      <AnimatePresence>
        {showSprint && (
          <Modal onClose={() => setShowSprint(false)} title="Bob's Sprint Planner" icon={<ListTodo size={24} className="text-brand-pink" />} wide>
            <p className="text-sm font-bold text-brand-black/60 dark:text-white/60">Paste your backlog, issues, or TODO list. Bob prioritizes by ROI, risk, and effort.</p>
            {!sprintPlan ? (
              <>
                <textarea value={sprintInput} onChange={e => setSprintInput(e.target.value)}
                  placeholder={"- Fix auth token expiry bug\n- Add unit tests for API client\n- Refactor dataMapper.ts\n- Update README\n- Set up GitHub Actions CI/CD"}
                  className="w-full h-48 bg-brand-bg dark:bg-brand-dark-bg border-2 border-brand-black dark:border-white rounded-xl p-4 font-mono text-sm resize-none focus:outline-none focus:ring-4 focus:ring-brand-pink/20 dark:text-white"
                />
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={handleSprintPlan} disabled={sprintLoading || !sprintInput.trim()}
                  className="w-full bg-brand-pink text-white py-3 rounded-xl border-2 border-brand-black dark:border-white shadow-brutal font-black uppercase text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {sprintLoading ? <><Loader2 size={18} className="animate-spin" /> Bob is planning your sprint...</> : <><Wand2 size={18} /> Generate Sprint Plan</>}
                </motion.button>
              </>
            ) : (
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                <div className="bg-brand-indigo text-white p-4 rounded-xl">
                  <p className="text-[10px] font-black uppercase text-white/60 mb-1">Sprint Goal</p>
                  <p className="font-black text-sm">{sprintPlan.sprintGoal}</p>
                </div>
                <div className="space-y-2">
                  {sprintPlan.tasks.map((task, i) => (
                    <div key={i} className="bg-brand-bg dark:bg-brand-dark-bg border-2 border-brand-black/20 dark:border-white/20 rounded-xl p-4 flex gap-3 items-start">
                      <div className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${PRIORITY_COLORS[task.priority] || "bg-brand-teal"}`} />
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <p className="font-black text-sm dark:text-white">{task.task}</p>
                          <div className="flex gap-1.5 shrink-0">
                            <span className="text-[8px] font-black uppercase bg-brand-indigo/10 text-brand-indigo dark:text-brand-teal px-2 py-0.5 rounded">{task.category}</span>
                            <span className={`text-[8px] font-black uppercase ${EFFORT_COLORS[task.effort] || "text-brand-teal"}`}>{task.effort}</span>
                          </div>
                        </div>
                        <p className="text-[11px] font-bold text-brand-black/60 dark:text-white/50 mt-1">{task.roi}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-brand-teal/10 border border-brand-teal/30 rounded-xl p-3">
                    <p className="text-[10px] font-black text-brand-teal uppercase">Est. Hours</p>
                    <p className="text-2xl font-black text-brand-teal">{sprintPlan.totalEstimatedHours}h</p>
                  </div>
                  <div className="bg-brand-pink/10 border border-brand-pink/30 rounded-xl p-3">
                    <p className="text-[10px] font-black text-brand-pink uppercase">Sprint Impact</p>
                    <p className="text-xs font-bold text-brand-pink leading-tight mt-1">{sprintPlan.expectedImpact}</p>
                  </div>
                </div>
                <button onClick={() => { setSprintPlan(null); setSprintInput(""); }}
                  className="w-full py-2.5 border-2 border-brand-black dark:border-white rounded-xl font-black text-xs uppercase dark:text-white hover:bg-brand-bg dark:hover:bg-white/10 transition-colors"
                >Plan Another Sprint</button>
              </div>
            )}
          </Modal>
        )}
      </AnimatePresence>

      {/* Automation Result Modal */}
      <AnimatePresence>
        {automationResult && (
          <Modal onClose={() => setAutomationResult(null)} title={automationResult.title} icon={<Sparkles size={24} className="text-brand-pink" />} wide>
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black uppercase bg-brand-teal text-brand-black px-2 py-0.5 rounded">{automationResult.tag}</span>
              <button onClick={() => handleCopy(automationResult.output, "automation-result")}
                className="flex items-center gap-1.5 text-[10px] font-black uppercase text-brand-indigo hover:text-brand-pink transition-colors border-b border-dashed border-brand-indigo/30"
              >
                {copiedId === "automation-result" ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy Output</>}
              </button>
            </div>
            <div className="bg-brand-bg dark:bg-brand-dark-bg rounded-xl border-2 border-brand-black/10 dark:border-white/10 p-4 max-h-[60vh] overflow-y-auto">
              <pre className="text-[11px] font-mono text-brand-black dark:text-white/80 whitespace-pre-wrap leading-relaxed">{automationResult.output}</pre>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div initial={{ opacity: 0, x: "100%" }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: "100%" }} transition={{ type: "spring", damping: 25 }}
            className="fixed inset-y-0 right-0 z-[90] w-72 bg-white dark:bg-brand-dark-bg border-l-4 border-brand-black dark:border-white flex flex-col p-8 gap-5 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <span className="font-black text-xl uppercase italic dark:text-white">Menu</span>
              <button onClick={() => setMobileMenuOpen(false)}><X size={24} className="dark:text-white" /></button>
            </div>
            <div className="flex flex-col gap-2">
              {[
                { id: "intelligence", label: "Intelligence" },
                { id: "automation",   label: "Automation"   },
                { id: "explainer",    label: "Logic Explainer" },
                { id: "tools",        label: "Bob Tools"    },
              ].map(tab => (
                <button key={tab.id} onClick={() => goTab(tab.id)}
                  className={`text-left px-4 py-3 rounded-xl font-black uppercase text-sm border-2 transition-colors ${activeTab === tab.id ? "bg-brand-indigo text-white border-brand-indigo" : "border-brand-black dark:border-white dark:text-white"}`}
                >{tab.label}</button>
              ))}
            </div>
            <div className="border-t border-brand-black/10 dark:border-white/10 pt-4 flex flex-col gap-2">
              <button onClick={() => { setShowCodeInput(true); setMobileMenuOpen(false); }} className="flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-brand-black dark:border-white font-black uppercase text-sm dark:text-white"><Upload size={16} /> Paste Code</button>
              <button onClick={() => { fileInputRef.current?.click(); setMobileMenuOpen(false); }} className="flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-brand-black dark:border-white font-black uppercase text-sm dark:text-white"><FolderOpen size={16} /> Upload File</button>
              <button onClick={() => { setShowGithub(true); setMobileMenuOpen(false); }} className="flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-brand-black dark:border-white font-black uppercase text-sm dark:text-white"><Github size={16} /> GitHub Repo</button>
              <button onClick={() => { setShowSprint(true); setMobileMenuOpen(false); }} className="flex items-center gap-2 px-4 py-3 rounded-xl bg-brand-pink text-white border-2 border-brand-black dark:border-white font-black uppercase text-sm"><ListTodo size={16} /> Sprint Planner</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nav */}
      <nav className="h-20 px-4 md:px-10 flex items-center justify-between border-b-4 border-brand-black/10 bg-white dark:bg-brand-dark-bg sticky top-0 z-50">
        <button onClick={() => setShowLanding(true)} className="flex items-center gap-3">
          <motion.div initial={{ rotate: -6 }} whileHover={{ rotate: 0 }} className="w-10 h-10 bg-brand-indigo rounded-xl flex items-center justify-center border-2 border-brand-black dark:border-white shadow-brutal">
            <span className="text-white font-black text-2xl">B</span>
          </motion.div>
          <div className="flex flex-col">
            <span className="text-xl font-black tracking-tight uppercase italic leading-none dark:text-white">SPARK<span className="text-brand-pink">.</span>STUDIO</span>
            <span className="text-[10px] font-black text-brand-indigo dark:text-brand-teal uppercase tracking-widest">Powered by IBM Bob</span>
          </div>
        </button>
        <div className="hidden lg:flex items-center gap-3 font-bold text-sm uppercase tracking-widest">
          {[
            { id: "intelligence", label: "Intelligence" },
            { id: "automation",   label: "Automation"   },
            { id: "explainer",    label: "Logic Explainer" },
            { id: "tools",        label: "Bob Tools"    },
          ].map(tab => (
            <button key={tab.id} onClick={() => goTab(tab.id)}
              className={`capitalize transition-opacity ${activeTab === tab.id ? "text-brand-pink" : "opacity-40 dark:text-white hover:opacity-100"}`}
            >{tab.label}</button>
          ))}
          <div className="flex items-center gap-2 bg-brand-pink/5 dark:bg-brand-indigo/10 px-3 py-2 rounded-full border border-brand-pink/20">
            <span className="w-1.5 h-1.5 bg-brand-teal rounded-full animate-pulse" />
            <span className="text-[10px] font-black uppercase text-brand-indigo dark:text-brand-teal">Context Active</span>
            <div className="w-px h-4 bg-brand-indigo/20" />
            <span className="text-[10px] font-black uppercase text-brand-black/40 dark:text-white/40">{statsFileCount.toLocaleString()} {statsLanguage} Files</span>
          </div>
          <button onClick={() => fileInputRef.current?.click()} disabled={uploadLoading}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border-2 border-brand-black dark:border-white shadow-brutal font-black text-xs uppercase hover:bg-brand-teal hover:text-brand-black dark:text-white transition-colors disabled:opacity-60"
          >
            {uploadLoading ? <Loader2 size={14} className="animate-spin" /> : <FolderOpen size={14} />} {uploadLoading ? "Reading..." : "Upload File"}
          </button>
          <button onClick={() => setShowCodeInput(true)} className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border-2 border-brand-black dark:border-white shadow-brutal font-black text-xs uppercase hover:bg-brand-indigo hover:text-white dark:text-white transition-colors">
            <Upload size={14} /> Paste Code
          </button>
          <button onClick={() => setShowGithub(true)} className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border-2 border-brand-black dark:border-white shadow-brutal font-black text-xs uppercase hover:bg-brand-indigo hover:text-white dark:text-white transition-colors">
            <Github size={14} /> GitHub
          </button>
          <button onClick={() => setShowSprint(true)} className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-brand-pink text-white border-2 border-brand-black dark:border-white shadow-brutal font-black text-xs uppercase hover:bg-brand-indigo transition-colors">
            <ListTodo size={14} /> Sprint
          </button>
          <button onClick={() => setDarkMode(!darkMode)} className="w-10 h-10 bg-white dark:bg-brand-dark-card border-2 border-brand-black dark:border-white rounded-xl shadow-brutal flex items-center justify-center">
            {darkMode ? <Sun size={18} className="text-brand-yellow" /> : <Moon size={18} className="text-brand-indigo" />}
          </button>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleAnalyzeRepo} disabled={repoLoading}
            className="bg-brand-indigo text-white px-5 py-3 rounded-xl border-2 border-brand-black dark:border-white shadow-brutal hover:shadow-none translate-y-[-2px] hover:translate-y-0 transition-all flex items-center gap-2 disabled:opacity-60"
          >
            {repoLoading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
            <span>{repoLoading ? "Analyzing..." : "Analyze Repo"}</span>
          </motion.button>
        </div>
        <button onClick={() => setMobileMenuOpen(true)} className="lg:hidden p-2 border-2 border-brand-black dark:border-white rounded-xl dark:text-white"><Menu size={24} /></button>
      </nav>

      <main className="flex-1 p-4 md:p-10 grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 max-w-7xl mx-auto w-full">
        <div className="lg:col-span-8 flex flex-col gap-6 md:gap-8">

          {/* Hero */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-brand-teal dark:bg-brand-indigo p-6 md:p-12 rounded-brutal-lg border-brutal shadow-brutal-lg relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/20 rounded-full -mr-24 -mt-24 group-hover:scale-125 transition-transform duration-700" />
            <div className="bg-brand-black text-white px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest inline-flex items-center gap-2 mb-4">
              <Cpu size={14} className="text-brand-teal animate-pulse" /> Dev Partner Online
            </div>
            <h1 className="text-3xl md:text-5xl font-black leading-tight text-brand-black dark:text-white mb-4">
              "Bob, help me understand<br />
              <span className="text-brand-indigo dark:text-brand-yellow italic underline decoration-4 underline-offset-8 decoration-brand-yellow">this repository.</span>"
            </h1>
            <p className="text-base md:text-xl font-medium text-brand-black/80 dark:text-white/90 max-w-md mb-4">
              IBM Bob has indexed <strong>{statsFileCount.toLocaleString()} {githubInfo ? githubInfo.language : ""} files</strong>. Ready to explain logic, generate docs and tests, plan sprints, and automate refactors.
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              {[
                { label: "Upload a file", icon: <FolderOpen size={12} />, action: () => fileInputRef.current?.click() },
                { label: "Connect GitHub repo", icon: <Github size={12} />, action: () => setShowGithub(true) },
                { label: "Plan my sprint", icon: <ListTodo size={12} />, action: () => setShowSprint(true) },
                { label: "Generate docs", icon: <FileText size={12} />, action: () => { goTab("tools"); setToolsMode("docs"); } },
                { label: "Generate tests", icon: <FlaskConical size={12} />, action: () => { goTab("tools"); setToolsMode("tests"); } },
              ].map((chip, i) => (
                <button key={i} onClick={chip.action}
                  className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-brand-black dark:text-white border border-white/30 px-3 py-1.5 rounded-full text-[11px] font-black uppercase transition-colors"
                >
                  {chip.icon} {chip.label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="bg-white/10 backdrop-blur-sm px-4 md:px-6 py-3 md:py-4 rounded-brutal border-2 border-white/20 flex flex-col">
                <span className="text-[10px] font-black text-white/60 uppercase">Context Depth</span>
                <span className="text-xl md:text-2xl font-black text-white">Full Repo</span>
              </div>
              <div className="bg-white/10 backdrop-blur-sm px-4 md:px-6 py-3 md:py-4 rounded-brutal border-2 border-white/20 flex flex-col">
                <span className="text-[10px] font-black text-white/60 uppercase">Complexity Score</span>
                <span className="text-xl md:text-2xl font-black text-white">Medium (7.4)</span>
              </div>
              {githubInfo && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  className="bg-white/10 backdrop-blur-sm px-4 md:px-6 py-3 md:py-4 rounded-brutal border-2 border-white/20 flex flex-col"
                >
                  <span className="text-[10px] font-black text-white/60 uppercase">Connected Repo</span>
                  <span className="text-xl font-black text-white">{githubInfo.name}</span>
                  <span className="text-[10px] text-white/50">{githubInfo.stars} stars · {githubInfo.language}</span>
                </motion.div>
              )}
              {repoAnalysis && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  className={`bg-white/10 backdrop-blur-sm px-4 md:px-6 py-3 md:py-4 rounded-brutal border-2 border-white/20 flex flex-col ${repoAnalysis.risk === "High" ? "border-brand-pink/60" : ""}`}
                >
                  <span className="text-[10px] font-black text-white/60 uppercase">Bob's Risk Assessment</span>
                  <span className={`text-xl md:text-2xl font-black ${repoAnalysis.risk === "High" ? "text-brand-pink" : "text-white"}`}>{repoAnalysis.risk} Risk</span>
                </motion.div>
              )}
            </div>
            {repoAnalysis && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 p-4 bg-white/10 rounded-brutal border border-white/20">
                <p className="text-sm font-bold text-white/90 leading-relaxed">
                  <span className="text-brand-yellow font-black">Bob says: </span>{repoAnalysis.summary}
                </p>
                <p className="text-xs font-black text-white/60 mt-1 uppercase tracking-widest">Priority this sprint: {repoAnalysis.recommendation}</p>
              </motion.div>
            )}
          </motion.div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">

            {/* Intelligence Tab */}
            {activeTab === "intelligence" && (
              <motion.div key="intelligence" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FeatureCard icon={<BookOpen size={24} />} title="Identity and Flow" subtitle="Repo Intelligence" description="Bob maps how authentication flows through your middleware and services." color="bg-brand-yellow" />
                  <FeatureCard icon={<Layers size={24} />} title="Context Graph" subtitle="Service Mapping" description="Bob identified 12 interconnected microservices and 4 critical data paths." color="bg-brand-teal" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-brand-dark-card border-brutal rounded-brutal-lg p-6 shadow-brutal flex flex-col gap-4">
                    <h3 className="text-xl font-black italic flex items-center gap-2 dark:text-white"><PieChartIcon size={20} className="text-brand-pink" /> Repo Composition</h3>
                    <div className="h-44 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={REPO_DATA} innerRadius={36} outerRadius={56} paddingAngle={5} dataKey="value" stroke="#1A1A1A" strokeWidth={2}>
                            {REPO_DATA.map((e, i) => <Cell key={i} fill={e.color} />)}
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: "#1A1A1A", border: "none", borderRadius: "8px", color: "white", fontWeight: "900", fontSize: "10px" }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {REPO_DATA.map(item => (
                        <div key={item.name} className="flex items-center gap-2 text-[10px] font-black uppercase dark:text-white/80">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} /> {item.name}: {item.value}%
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white dark:bg-brand-dark-card border-brutal rounded-brutal-lg p-6 shadow-brutal flex flex-col gap-4">
                    <h3 className="text-xl font-black italic flex items-center gap-2 dark:text-white"><Zap size={20} className="text-brand-yellow" /> Strategic ROI</h3>
                    <button onClick={handleExportReport} className="p-2 bg-brand-indigo text-white rounded-lg border border-brand-black dark:border-white flex items-center justify-center gap-2 hover:scale-105 transition-transform group">
                      <Download size={14} className="group-hover:animate-bounce" /><span className="text-[10px] font-black uppercase">Export Full Report</span>
                    </button>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-brand-indigo/5 dark:bg-brand-indigo/20 p-4 rounded-xl border border-brand-indigo/20">
                        <p className="text-[10px] font-black uppercase text-brand-indigo dark:text-brand-teal opacity-60">Est. Savings</p>
                        <p className="text-2xl font-black text-brand-indigo dark:text-brand-teal">$14.2k</p>
                      </div>
                      <div className="bg-brand-pink/5 dark:bg-brand-pink/20 p-4 rounded-xl border border-brand-pink/20">
                        <p className="text-[10px] font-black uppercase text-brand-pink opacity-60">Risk Mitigation</p>
                        <p className="text-2xl font-black text-brand-pink">86%</p>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-black text-brand-indigo dark:text-white">+48h</div>
                      <p className="text-[10px] font-black uppercase text-brand-indigo/60 dark:text-brand-teal/60 tracking-widest">Dev Time Reclaimed / Sprint</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white dark:bg-brand-dark-card border-brutal rounded-brutal-lg p-6 shadow-brutal flex flex-col gap-4">
                  <h3 className="text-xl font-black italic flex items-center gap-2 dark:text-white"><TrendingUp size={20} className="text-brand-indigo" /> Module Complexity</h3>
                  <div className="h-40 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={COMPLEXITY_DATA} barSize={28}>
                        <XAxis dataKey="module" tick={{ fontSize: 10, fontWeight: 900, fill: "#888" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: "#888" }} axisLine={false} tickLine={false} domain={[0, 100]} />
                        <Tooltip contentStyle={{ backgroundColor: "#1A1A1A", border: "none", borderRadius: "8px", color: "white", fontWeight: "900", fontSize: "10px" }} />
                        <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                          {COMPLEXITY_DATA.map((e, i) => <Cell key={i} fill={e.score >= 70 ? "#D12771" : e.score >= 50 ? "#0F62FE" : "#11D3BC"} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="bg-brand-indigo p-6 md:p-8 rounded-brutal-lg border-brutal shadow-brutal text-white">
                  <h3 className="text-2xl font-black italic mb-6 flex items-center gap-3"><ShieldCheck size={28} /> Architectural Discovery</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {ARCHITECTURE.map((item, i) => (
                      <div key={i} className="p-4 bg-white/10 rounded-brutal border border-white/20">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[10px] font-black uppercase text-white/60">{item.label}</span>
                          <span className="text-[8px] font-black uppercase bg-brand-teal text-brand-black px-1.5 py-0.5 rounded">{item.status}</span>
                        </div>
                        <span className="text-sm font-black">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white dark:bg-brand-dark-card border-brutal rounded-brutal-lg p-6 md:p-8 shadow-brutal flex flex-col gap-6">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h3 className="text-2xl font-black italic flex items-center gap-3 dark:text-white"><FileCode2 className="text-brand-indigo" size={28} /> Repo Consciousness</h3>
                    <span className="text-[10px] font-black text-brand-indigo/60 dark:text-brand-teal uppercase">Click a file for deep focus</span>
                  </div>
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                    {FILES.map(file => (
                      <motion.button key={file.name} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => selectFile(file.name)}
                        className={`p-3 md:p-4 rounded-xl border-2 border-brand-black dark:border-white shadow-sm flex flex-col items-center gap-2 transition-all ${selectedFile === file.name ? "bg-brand-indigo text-white" : "bg-white dark:bg-brand-dark-bg hover:bg-brand-bg dark:hover:bg-white/5"}`}
                      >
                        <FileCode2 size={20} className={selectedFile === file.name ? "text-white" : "text-brand-indigo"} />
                        <span className={`text-[9px] font-black uppercase truncate w-full text-center ${selectedFile === file.name ? "text-white" : "dark:text-white"}`}>{file.name}</span>
                        <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full border border-current ${file.complexity === "High" ? "border-brand-pink text-brand-pink" : "border-brand-teal text-brand-teal"}`}>{file.complexity}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Automation Tab */}
            {activeTab === "automation" && (
              <motion.div key="automation" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FeatureCard icon={<Zap size={24} />} title="Test Generator" subtitle="Contextual Automation" description="Instantly generate Vitest tests for uncovered modules. Bob writes them from your actual code." color="bg-brand-pink" darkOnHover />
                  <FeatureCard icon={<Sparkles size={24} />} title="Multi-step Work" subtitle="Complex Pipelines" description="Bob chains analysis, refactoring, and testing into a single automated workflow." color="bg-brand-indigo" darkOnHover />
                </div>
                {automationLoading && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white dark:bg-brand-dark-card border-brutal rounded-brutal-lg p-8 shadow-brutal flex flex-col items-center gap-4">
                    <Loader2 size={36} className="animate-spin text-brand-pink" />
                    <p className="font-black text-sm uppercase tracking-widest dark:text-white">Bob is working on it...</p>
                    <p className="text-xs text-brand-black/40 dark:text-white/40 uppercase">This may take 15-30 seconds</p>
                  </motion.div>
                )}
                <div className="bg-white dark:bg-brand-dark-card border-brutal rounded-brutal-lg p-6 md:p-8 shadow-brutal flex flex-col gap-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-black italic flex items-center gap-3 dark:text-white"><Wand2 className="text-brand-pink" size={28} /> Automation Lab</h3>
                    <span className="text-[10px] font-black text-brand-indigo/60 dark:text-brand-teal uppercase">Real AI Output</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ActionItem icon={<FileCode2 size={20} />} title="Generate README" desc="Bob writes a production-quality README from your codebase" tag="Documentation" loading={automationLoading === "docs"}
                      onClick={() => handleAutomation("docs", "Generating README", <FileCode2 size={16} />)} />
                    <ActionItem icon={<Shield size={20} />} title="Security Audit" desc="Bob identifies vulnerabilities and provides specific fixes" tag="Security" loading={automationLoading === "security"}
                      onClick={() => handleAutomation("security", "Security Audit", <Shield size={16} />)} />
                    <ActionItem icon={<GitBranch size={20} />} title="Refactor Plan" desc="Before/after code examples for top 3 refactoring targets" tag="Refactoring" loading={automationLoading === "refactor"}
                      onClick={() => handleAutomation("refactor", "Refactoring Plan", <GitBranch size={16} />)} />
                    <ActionItem icon={<Settings size={20} />} title="CI/CD Workflows" desc="Complete GitHub Actions YAML: CI, deploy, and PR checks" tag="DevOps" loading={automationLoading === "cicd"}
                      onClick={() => handleAutomation("cicd", "Configuring CI/CD", <Settings size={16} />)} />
                  </div>
                  {!githubInfo && (
                    <div className="flex items-center gap-3 p-3 bg-brand-yellow/10 border border-brand-yellow/30 rounded-xl">
                      <AlertTriangle size={16} className="text-brand-yellow shrink-0" />
                      <p className="text-[11px] font-bold dark:text-white/80">
                        <span className="text-brand-yellow font-black">Tip:</span> Connect a real GitHub repo above for context-aware automation results.
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Logic Explainer Tab */}
            {activeTab === "explainer" && (
              <motion.div key="explainer" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="bg-white dark:bg-brand-dark-card border-brutal rounded-brutal-lg p-6 md:p-8 shadow-brutal flex flex-col gap-5"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h3 className="text-2xl font-black italic flex items-center gap-3 dark:text-white"><MessageSquareCode className="text-brand-indigo" size={28} /> Bob's Logic Explainer</h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button onClick={() => setShowCodeInput(true)} className="flex items-center gap-1.5 px-3 py-2 border-2 border-brand-black dark:border-white rounded-lg font-black text-[10px] uppercase hover:bg-brand-indigo hover:text-white dark:text-white transition-colors"><Upload size={12} /> Paste Code</button>
                    <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1.5 px-3 py-2 border-2 border-brand-black dark:border-white rounded-lg font-black text-[10px] uppercase hover:bg-brand-teal hover:text-brand-black dark:text-white transition-colors"><FolderOpen size={12} /> Upload File</button>
                    {chatHistory.length > 0 && (
                      <button onClick={() => setChatHistory([])} className="flex items-center gap-1.5 px-3 py-2 border-2 border-brand-black/30 dark:border-white/30 rounded-lg font-black text-[10px] uppercase hover:border-brand-pink hover:text-brand-pink dark:text-white/60 transition-colors"><X size={12} /> Clear</button>
                    )}
                    <div className="flex items-center gap-2 text-[10px] font-black text-brand-indigo/60 dark:text-brand-teal uppercase">
                      <div className="w-2 h-2 bg-brand-teal rounded-full animate-pulse" /> Repo Context: Active
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-4 max-h-[460px] overflow-y-auto pr-1">
                  {chatHistory.length === 0 && !loading && (
                    <div className="bg-brand-bg dark:bg-brand-dark-bg rounded-brutal p-6 border-2 border-dashed border-brand-black/20 dark:border-white/20 font-mono text-sm">
                      <p className="text-brand-black/40 dark:text-white/40 italic">Select a file, upload your own code, connect a GitHub repo, or type a question below.</p>
                    </div>
                  )}
                  <AnimatePresence>
                    {chatHistory.map(msg => (
                      <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center border-2 shrink-0 ${msg.role === "bob" ? "bg-brand-indigo border-brand-black dark:border-white" : "bg-brand-pink border-brand-black dark:border-white"}`}>
                          <span className="text-[10px] text-white font-black">{msg.role === "bob" ? "B" : "Y"}</span>
                        </div>
                        <div className={`flex-1 max-w-[85%] flex flex-col gap-2 ${msg.role === "user" ? "items-end" : "items-start"}`}>
                          {msg.role === "user" ? (
                            <div className="bg-brand-pink text-white px-4 py-3 rounded-2xl rounded-tr-sm font-bold text-sm">{msg.content}</div>
                          ) : (
                            <div className="bg-brand-bg dark:bg-brand-dark-bg border-2 border-dashed border-brand-black/20 dark:border-white/20 rounded-2xl rounded-tl-sm p-4 font-mono text-sm space-y-3 w-full">
                              <div className="flex items-center justify-between flex-wrap gap-2">
                                <div className="flex gap-2 flex-wrap">
                                  {msg.category && <span className="bg-brand-indigo/10 text-brand-indigo dark:text-brand-teal text-[9px] font-black uppercase px-2 py-1 rounded border border-brand-indigo/20">{msg.category}</span>}
                                  {msg.impact && <span className="bg-brand-teal text-brand-black text-[9px] font-black uppercase px-2 py-1 rounded border border-brand-black">{msg.impact}</span>}
                                </div>
                                {!msg.streaming && msg.content && (
                                  <button onClick={() => handleCopy(msg.content, msg.id)} className="text-[9px] font-black uppercase text-brand-black/30 dark:text-white/30 hover:text-brand-indigo dark:hover:text-brand-teal transition-colors flex items-center gap-1">
                                    {copiedId === msg.id ? <><Check size={10} /> Copied!</> : <><Copy size={10} /> Copy</>}
                                  </button>
                                )}
                              </div>
                              <p className="leading-relaxed text-brand-black dark:text-white/80 font-medium text-[13px]">
                                "{msg.content}"
                                {msg.streaming && <span className="inline-block w-1.5 h-3 bg-brand-indigo dark:bg-brand-teal ml-1 animate-pulse rounded-sm" />}
                              </p>
                              {!msg.streaming && msg.suggestions && (
                                <div className="space-y-1.5 pt-1">
                                  <p className="text-[9px] font-black text-brand-indigo/40 dark:text-white/40 uppercase">Suggestions:</p>
                                  {msg.suggestions.map((s, i) => (
                                    <div key={i} className="flex items-start gap-2">
                                      <CheckCircle2 size={13} className="text-brand-teal mt-0.5 shrink-0" />
                                      <span className="text-[11px] font-bold dark:text-white/80">{s}</span>
                                    </div>
                                  ))}
                                  <button onClick={() => launchWorkflow("Applying Transformation", <Sparkles size={16} />)}
                                    className="w-full mt-2 bg-brand-indigo text-white p-2.5 rounded-xl border-2 border-brand-black dark:border-white font-black uppercase text-[10px] hover:bg-brand-pink transition-colors flex items-center justify-center gap-2"
                                  >
                                    <Wand2 size={14} /> Apply Automated Refactor
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {loading && chatHistory[chatHistory.length - 1]?.role !== "bob" && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                      <div className="w-8 h-8 rounded-lg bg-brand-indigo border-2 border-brand-black dark:border-white flex items-center justify-center shrink-0">
                        <span className="text-[10px] text-white font-black">B</span>
                      </div>
                      <div className="bg-brand-bg dark:bg-brand-dark-bg border-2 border-dashed border-brand-black/20 dark:border-white/20 rounded-2xl rounded-tl-sm px-5 py-4 flex items-center gap-3">
                        <Loader2 className="animate-spin text-brand-pink" size={18} />
                        <span className="text-xs font-black uppercase tracking-widest text-brand-indigo/60 dark:text-brand-teal">Bob is reading the repo...</span>
                      </div>
                    </motion.div>
                  )}
                  <div ref={chatEndRef} />
                </div>
                <div className="relative">
                  <input type="text" value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => { if (e.key === "Enter") handleAskBob(); }}
                    placeholder="Ask Bob about any module, logic, or transformation..."
                    className="w-full bg-brand-bg dark:bg-brand-dark-bg p-4 pr-14 rounded-full border-2 border-brand-black dark:border-white font-bold focus:outline-none focus:ring-4 focus:ring-brand-pink/20 dark:text-white"
                  />
                  <button onClick={() => handleAskBob()} disabled={loading || !query.trim()}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-brand-pink text-white rounded-full hover:scale-110 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all"
                  >
                    {loading ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
                  </button>
                </div>
                <div className="flex flex-wrap gap-3">
                  {["Explain auth flow", "Find performance bottlenecks", "Map external APIs", "Review API client resilience", "Explain the data layer"].map((q, i) => (
                    <button key={i} onClick={() => handleAskBob(q)} className="text-[10px] font-black uppercase text-brand-indigo/60 hover:text-brand-pink transition-colors border-b border-dashed border-brand-indigo/20 hover:border-brand-pink">{q}</button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Bob Tools Tab */}
            {activeTab === "tools" && (
              <motion.div key="tools" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div className="bg-white dark:bg-brand-dark-card border-brutal rounded-brutal-lg p-6 md:p-8 shadow-brutal flex flex-col gap-6">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h3 className="text-2xl font-black italic flex items-center gap-3 dark:text-white"><Sparkles className="text-brand-pink" size={28} /> Bob Tools</h3>
                    <div className="flex items-center gap-2 text-[10px] font-black text-brand-indigo/60 dark:text-brand-teal uppercase">
                      <div className="w-2 h-2 bg-brand-teal rounded-full animate-pulse" /> Bob Ready
                    </div>
                  </div>

                  {/* Mode toggle */}
                  <div className="flex gap-3">
                    <button onClick={() => { setToolsMode("docs"); setToolsOutput(""); }}
                      className={`flex-1 py-3 rounded-xl border-2 font-black uppercase text-sm flex items-center justify-center gap-2 transition-colors ${toolsMode === "docs" ? "bg-brand-indigo text-white border-brand-indigo" : "border-brand-black dark:border-white dark:text-white hover:bg-brand-bg dark:hover:bg-white/5"}`}
                    >
                      <FileText size={16} /> Doc Generator
                    </button>
                    <button onClick={() => { setToolsMode("tests"); setToolsOutput(""); }}
                      className={`flex-1 py-3 rounded-xl border-2 font-black uppercase text-sm flex items-center justify-center gap-2 transition-colors ${toolsMode === "tests" ? "bg-brand-pink text-white border-brand-pink" : "border-brand-black dark:border-white dark:text-white hover:bg-brand-bg dark:hover:bg-white/5"}`}
                    >
                      <FlaskConical size={16} /> Test Synthesizer
                    </button>
                  </div>

                  {/* File upload area */}
                  <div
                    onClick={() => toolsFileRef.current?.click()}
                    className={`border-4 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${toolsFile ? "border-brand-teal bg-brand-teal/5" : "border-brand-black/20 dark:border-white/20 hover:border-brand-indigo"}`}
                  >
                    {toolsFile ? (
                      <div className="flex flex-col items-center gap-2">
                        <FileCode2 size={32} className="text-brand-teal" />
                        <p className="font-black text-brand-teal">{toolsFile.name}</p>
                        <p className="text-[10px] text-brand-black/40 dark:text-white/40 uppercase">{toolsFile.content.length.toLocaleString()} characters loaded</p>
                        <button onClick={e => { e.stopPropagation(); setToolsFile(null); setToolsOutput(""); }} className="text-[10px] font-black uppercase text-brand-pink hover:underline">Remove</button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        <FolderOpen size={32} className="text-brand-black/30 dark:text-white/30" />
                        <p className="font-black text-sm dark:text-white">Click to upload a file</p>
                        <p className="text-[10px] text-brand-black/40 dark:text-white/40 uppercase">TS, JS, Python, Go, Rust, Java, SQL, and more</p>
                      </div>
                    )}
                  </div>

                  {/* Or paste code */}
                  {!toolsFile && (
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-px bg-brand-black/10 dark:bg-white/10" />
                      <span className="text-[10px] font-black uppercase text-brand-black/30 dark:text-white/30">or paste code directly</span>
                      <div className="flex-1 h-px bg-brand-black/10 dark:bg-white/10" />
                    </div>
                  )}
                  {!toolsFile && (
                    <textarea
                      placeholder="// Paste your code here and Bob will generate docs or tests for it..."
                      className="w-full h-36 bg-brand-bg dark:bg-brand-dark-bg border-2 border-brand-black dark:border-white rounded-xl p-4 font-mono text-sm resize-none focus:outline-none focus:ring-4 focus:ring-brand-indigo/20 dark:text-white"
                      onChange={e => { if (e.target.value) setToolsFile({ name: "pasted-code.ts", content: e.target.value }); }}
                    />
                  )}

                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleRunTool} disabled={!toolsFile || toolsLoading}
                    className={`w-full py-4 rounded-xl border-2 border-brand-black dark:border-white shadow-brutal font-black uppercase text-sm flex items-center justify-center gap-3 disabled:opacity-50 transition-colors ${toolsMode === "docs" ? "bg-brand-indigo text-white hover:bg-brand-teal hover:text-brand-black" : "bg-brand-pink text-white hover:bg-brand-indigo"}`}
                  >
                    {toolsLoading ? (
                      <><Loader2 size={20} className="animate-spin" /> Bob is {toolsMode === "docs" ? "writing docs" : "synthesizing tests"}...</>
                    ) : (
                      <><Sparkles size={20} /> {toolsMode === "docs" ? "Generate Documentation" : "Generate Test Suite"} with Bob</>
                    )}
                  </motion.button>

                  {/* Output */}
                  <AnimatePresence>
                    {toolsOutput && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-brand-teal animate-pulse" />
                            <span className="text-[10px] font-black uppercase text-brand-teal">Bob Output Ready</span>
                          </div>
                          <button onClick={() => handleCopy(toolsOutput, "tools-output")}
                            className="flex items-center gap-1.5 text-[10px] font-black uppercase text-brand-indigo hover:text-brand-pink transition-colors border-b border-dashed border-brand-indigo/30"
                          >
                            {copiedId === "tools-output" ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy Output</>}
                          </button>
                        </div>
                        <div className={`bg-brand-bg dark:bg-brand-dark-bg rounded-2xl border-2 p-6 max-h-[500px] overflow-y-auto ${toolsMode === "docs" ? "border-brand-indigo/30" : "border-brand-pink/30"}`}>
                          <pre className="text-[11px] font-mono leading-relaxed whitespace-pre-wrap dark:text-white/80">{toolsOutput}</pre>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Sidebar */}
        <aside className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-brand-pink/5 dark:bg-brand-pink/10 border-brutal rounded-brutal-lg p-6 md:p-8 flex flex-col gap-6 shadow-brutal">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black uppercase italic flex items-center gap-2 dark:text-white"><ActivityIcon size={24} /> Live Pulse</h2>
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
            </div>
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase text-brand-indigo dark:text-brand-teal tracking-widest">Active Discoveries</p>
              <div className="p-3 bg-brand-black dark:bg-brand-indigo rounded-xl border border-white/10">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[9px] font-black text-brand-teal uppercase">Architectural Drift</span>
                  <span className="text-[8px] text-white/40 uppercase">2m ago</span>
                </div>
                <p className="text-[11px] text-white font-medium leading-tight">Legacy fetch pattern detected in /services/old-api vs new Axios standard.</p>
              </div>
              <div className="p-3 bg-brand-pink/10 dark:bg-brand-pink/20 rounded-xl border border-brand-pink/30">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[9px] font-black text-brand-pink uppercase">Optimization Gap</span>
                  <span className="text-[8px] text-brand-black/40 dark:text-white/60 uppercase">5m ago</span>
                </div>
                <p className="text-[11px] text-brand-black dark:text-white font-medium leading-tight">Memoization gap in HeavyGraph.tsx causing 12ms UI stutter.</p>
              </div>
            </div>
            <div className="bg-brand-black dark:bg-brand-dark-card border-2 border-white/10 rounded-2xl p-4 hover:scale-[1.02] transition-transform">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-2 h-2 bg-brand-teal rounded-full animate-pulse" />
                <span className="text-[10px] font-black text-white uppercase tracking-widest">Bob Cognitive Depth</span>
              </div>
              <div className="h-6 bg-white/10 rounded-full border border-white/20 overflow-hidden relative">
                <motion.div initial={{ width: 0 }} animate={{ width: "94%" }} transition={{ duration: 1.5, ease: "easeOut" }} className="h-full bg-brand-teal shadow-[0_0_15px_rgba(17,211,188,0.6)]" />
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-brand-black">94.8% REPO INDEXED</span>
              </div>
            </div>
            {activeWorkflows.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-brand-black/10">
                <p className="text-[10px] font-black uppercase text-brand-pink tracking-widest">Active Automation</p>
                <AnimatePresence>
                  {activeWorkflows.slice(0, 5).map(w => (
                    <motion.div key={w.id} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                      <TaskItem label={w.label} progress={w.progress} icon={w.icon} done={w.done} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
            <div className="pt-4 border-t-2 border-brand-black/10">
              <p className="text-xs font-black uppercase text-brand-pink mb-3">Bob's Active Recommendations</p>
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {recommendations.map(rec => (
                    <motion.div key={rec.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                      <RecommendationItem message={rec.message} time={rec.time} onFix={rec.action ? () => launchWorkflow(`Fixing: ${rec.action!.type}`, rec.action!.icon) : undefined} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>
          <motion.div whileHover={{ scale: 1.02 }} onClick={() => setActiveTab("tools")}
            className="bg-brand-indigo p-6 md:p-8 rounded-brutal border-brutal shadow-brutal text-white flex flex-col gap-4 overflow-hidden relative cursor-pointer"
          >
            <div className="absolute top-0 right-0 p-4 opacity-20"><Sparkles size={64} /></div>
            <h4 className="text-2xl font-black italic">Turn idea<br />into impact.</h4>
            <p className="text-xs font-bold text-white/70 uppercase tracking-widest leading-relaxed">Generate docs, tests, and CI/CD with one click.</p>
            <div className="flex gap-2 flex-wrap">
              <span className="bg-white/10 text-white text-[9px] font-black uppercase px-2 py-1 rounded border border-white/20">Doc Generator</span>
              <span className="bg-white/10 text-white text-[9px] font-black uppercase px-2 py-1 rounded border border-white/20">Test Synthesizer</span>
              <span className="bg-white/10 text-white text-[9px] font-black uppercase px-2 py-1 rounded border border-white/20">CI/CD Config</span>
            </div>
            <button className="bg-white text-brand-indigo px-4 py-2 rounded-full font-black text-xs uppercase self-start hover:bg-brand-yellow hover:text-brand-black transition-colors">Open Bob Tools</button>
          </motion.div>
        </aside>
      </main>

      <footer className="h-12 px-6 md:px-10 bg-brand-black text-white flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] sticky bottom-0">
        <div className="flex gap-4 md:gap-8 overflow-hidden whitespace-nowrap">
          <span className="opacity-60">IBM Bob Core v2.1</span>
          <span className="text-brand-teal flex items-center gap-1"><span className="w-1.5 h-1.5 bg-brand-teal rounded-full animate-ping" /> Sync: Stable</span>
        </div>
        <div className="hidden sm:flex gap-8">
          <span className="opacity-60">{statsFileCount.toLocaleString()} Files Indexed</span>
          <span className="opacity-60">Repo Identity: Verified</span>
        </div>
      </footer>
    </div>
  );
}

function Modal({ onClose, title, icon, children, wide }: { onClose: () => void; title: string; icon: ReactNode; children: ReactNode; wide?: boolean; }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} onClick={e => e.stopPropagation()}
        className={`bg-white dark:bg-brand-dark-card border-brutal rounded-brutal-lg p-6 md:p-8 w-full ${wide ? "max-w-2xl" : "max-w-lg"} flex flex-col gap-4 shadow-brutal-lg max-h-[90vh] overflow-y-auto`}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-black italic flex items-center gap-2 dark:text-white">{icon}{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-brand-bg dark:hover:bg-white/10 rounded-lg transition-colors"><X size={20} className="dark:text-white" /></button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}
function FeatureCard({ icon, title, subtitle, description, color, darkOnHover = false }: { icon: ReactNode; title: string; subtitle: string; description: string; color: string; darkOnHover?: boolean; }) {
  return (
    <motion.div whileHover={{ y: -4, x: -4 }} className={`bg-white dark:bg-brand-dark-card p-6 rounded-brutal border-brutal shadow-brutal transition-colors group cursor-pointer ${darkOnHover ? "hover:bg-brand-pink" : ""}`}>
      <div className={`w-12 h-12 ${color} group-hover:bg-white dark:group-hover:bg-brand-dark-bg rounded-2xl mb-4 flex items-center justify-center border-2 border-brand-black dark:border-white transition-colors`}>{icon}</div>
      <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${darkOnHover ? "group-hover:text-white/70 text-brand-pink" : "text-brand-indigo dark:text-brand-teal"}`}>{subtitle}</p>
      <h3 className="text-xl font-black mb-2 dark:text-white">{title}</h3>
      <p className="text-sm font-bold opacity-60 dark:opacity-40 leading-relaxed">{description}</p>
    </motion.div>
  );
}
function TaskItem({ label, progress, icon, done }: { label: string; progress: number; icon: ReactNode; done?: boolean; }) {
  return (
    <div className="flex flex-col gap-2 mb-3">
      <div className="flex items-center justify-between text-xs font-black uppercase italic dark:text-white/80">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-brand-black/5 dark:bg-white/5 rounded-lg border border-brand-black/10 dark:border-white/10">{icon}</div>
          <span className="truncate max-w-[120px]">{label}</span>
        </div>
        <span className={done ? "text-brand-teal" : ""}>{done ? "Done" : `${progress}%`}</span>
      </div>
      <div className="h-4 bg-brand-black/10 dark:bg-white/5 rounded-full border-2 border-brand-black dark:border-white overflow-hidden p-0.5">
        <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.5, ease: "easeOut" }} className={`h-full rounded-full ${done ? "bg-brand-teal" : "bg-brand-pink"}`} />
      </div>
    </div>
  );
}
function RecommendationItem({ message, time, onFix }: { message: string; time: string; onFix?: () => void; }) {
  return (
    <div className="flex gap-3 group relative">
      <div className="w-8 h-8 bg-brand-indigo rounded-lg flex items-center justify-center border border-brand-black dark:border-white shrink-0"><span className="text-[10px] text-white font-black">B</span></div>
      <div className="flex flex-col flex-1 pr-8">
        <p className="text-xs font-bold leading-tight text-brand-pink">{message}</p>
        <span className="text-[9px] font-black opacity-40 dark:opacity-60 uppercase mt-0.5">{time}</span>
      </div>
      {onFix && (
        <button onClick={onFix} className="absolute right-0 top-0 p-1.5 bg-brand-teal text-brand-black rounded-lg border border-brand-black dark:border-white opacity-0 group-hover:opacity-100 hover:scale-110 active:scale-95 transition-all" title="Auto-fix">
          <Zap size={10} fill="currentColor" />
        </button>
      )}
    </div>
  );
}
function ActionItem({ icon, title, desc, tag, onClick, loading }: { icon: ReactNode; title: string; desc: string; tag: string; onClick: () => void; loading?: boolean; }) {
  return (
    <motion.div whileHover={{ scale: loading ? 1 : 1.02 }} onClick={loading ? undefined : onClick}
      className={`p-4 bg-brand-bg dark:bg-brand-black/40 rounded-brutal border-2 border-brand-black dark:border-white/40 group transition-colors ${loading ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:bg-white dark:hover:bg-brand-indigo/20"}`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className={`p-2 bg-white dark:bg-brand-dark-bg rounded-lg border border-brand-black dark:border-white/20 transition-colors ${!loading ? "group-hover:bg-brand-indigo group-hover:text-white" : ""}`}>
          {loading ? <Loader2 size={20} className="animate-spin text-brand-pink" /> : icon}
        </div>
        <span className="text-[8px] font-black uppercase bg-brand-teal text-brand-black px-2 py-0.5 rounded-full border border-brand-black dark:border-white/20">{tag}</span>
      </div>
      <h4 className="text-sm font-black mb-1 dark:text-white">{loading ? "Bob is working..." : title}</h4>
      <p className="text-[11px] font-bold opacity-60 dark:opacity-50 leading-tight dark:text-white/70">{desc}</p>
    </motion.div>
  );
}
