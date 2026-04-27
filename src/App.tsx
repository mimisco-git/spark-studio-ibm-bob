import { motion, AnimatePresence } from "motion/react";
import {
  Zap, Activity as ActivityIcon, Plus, Code2, BookOpen, Cpu, ShieldCheck,
  MessageSquareCode, Search, Sparkles, Loader2, PieChart as PieChartIcon,
  Layers, Wand2, FileCode2, GitBranch, Settings, Sun, Moon, Download,
  AlertTriangle, CheckCircle2, TrendingUp, ArrowRight, X, Menu, Upload,
  Terminal, ChevronRight,
} from "lucide-react";
import { useState, useEffect, ReactNode, useCallback, useRef } from "react";
import { askBob, analyzeBobRepo, BobInsight, BobRepoAnalysis } from "./services/bobService";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis,
} from "recharts";

// ─── Static data ─────────────────────────────────────────────────────────────
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
  { label: "Auth Pattern",  value: "JWT + Cascading Redis Cache",    status: "Verified" },
  { label: "Data Flow",     value: "Unidirectional via Store Hooks", status: "Stable" },
  { label: "API Strategy",  value: "RESTful with Zod Validation",    status: "Optimized" },
  { label: "Deployment",    value: "Dockerized Node Express",        status: "Production" },
];
const FILES = [
  { name: "authService.ts", type: "logic",          complexity: "High" },
  { name: "dataMapper.ts",  type: "transformation", complexity: "Med"  },
  { name: "apiClient.ts",   type: "network",        complexity: "Med"  },
  { name: "app.tsx",        type: "ui",             complexity: "Low"  },
  { name: "schema.prisma",  type: "database",       complexity: "High" },
];
const BOOT_STEPS = [
  "Connecting to IBM Bob Core...",
  "Indexing repository: 2,450 files...",
  "Building dependency graph...",
  "Mapping architectural patterns...",
  "Context engine ready.",
];

// ─── Types ───────────────────────────────────────────────────────────────────
type Recommendation = {
  id: string; message: string; time: string;
  action?: { type: string; icon: ReactNode };
};
type Workflow = {
  id: string; label: string; progress: number; icon: ReactNode; done?: boolean;
};
type ChatMessage = {
  id: string; role: "user" | "bob"; content: string;
  suggestions?: string[]; impact?: string; category?: string;
};

// ─── Root ────────────────────────────────────────────────────────────────────
export default function App() {
  const [booted,        setBooted]        = useState(false);
  const [bootStep,      setBootStep]      = useState(0);
  const [showLanding,   setShowLanding]   = useState(true);
  const [activeTab,     setActiveTab]     = useState("intelligence");
  const [darkMode,      setDarkMode]      = useState(false);
  const [mobileMenuOpen,setMobileMenuOpen]= useState(false);
  const [query,         setQuery]         = useState("");
  const [loading,       setLoading]       = useState(false);
  const [repoLoading,   setRepoLoading]   = useState(false);
  const [insight,       setInsight]       = useState<BobInsight | null>(null);
  const [repoAnalysis,  setRepoAnalysis]  = useState<BobRepoAnalysis | null>(null);
  const [selectedFile,  setSelectedFile]  = useState<string | null>(null);
  const [chatHistory,   setChatHistory]   = useState<ChatMessage[]>([]);
  const [codeInput,     setCodeInput]     = useState("");
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([
    { id: "r1", message: "Found 3 circular dependencies in /src/lib", time: "Now" },
    { id: "r2", message: "Exporting 'User' type would fix 12 TS errors", time: "5m ago" },
  ]);
  const [activeWorkflows, setActiveWorkflows] = useState<Workflow[]>([
    { id: "w1", label: "Automating Docs",  progress: 64, icon: <Code2 size={16} /> },
    { id: "w2", label: "Mapping Data flow",progress: 82, icon: <Cpu  size={16} /> },
  ]);

  const workflowIntervals = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());
  const chatEndRef         = useRef<HTMLDivElement>(null);

  // Boot animation
  useEffect(() => {
    let step = 0;
    const t = setInterval(() => {
      step++;
      setBootStep(step);
      if (step >= BOOT_STEPS.length) {
        clearInterval(t);
        setTimeout(() => setBooted(true), 600);
      }
    }, 520);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  // Live pulse
  useEffect(() => {
    const proactiveInsights = [
      { msg: "Detected redundant state in authService.ts",    type: "Refactoring",   icon: <GitBranch   size={16} /> },
      { msg: "API client could use a retry wrapper",           type: "Safety",        icon: <ShieldCheck size={16} /> },
      { msg: "Database schema missing index on email field",   type: "DevOps",        icon: <Settings    size={16} /> },
      { msg: "Logic gap detected in session validation",       type: "Safety",        icon: <ShieldCheck size={16} /> },
      { msg: "Unit test coverage for hooks is below 20%",      type: "Documentation", icon: <FileCode2   size={16} /> },
      { msg: "Potential memory leak in useWebSocket hook",     type: "Performance",   icon: <AlertTriangle size={16}/> },
    ];
    const interval = setInterval(() => {
      const pick = proactiveInsights[Math.floor(Math.random() * proactiveInsights.length)];
      const id   = `live-${Date.now()}`;
      setRecommendations(prev => [
        { id, message: pick.msg, time: "Just now", action: { type: pick.type, icon: pick.icon } },
        ...prev.slice(0, 4),
      ]);
    }, 12000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    return () => { workflowIntervals.current.forEach(i => clearInterval(i)); };
  }, []);

  // Ask Bob (with chat history)
  const handleAskBob = useCallback(async (overrideQuery?: string, codeCtx?: string) => {
    const q = (overrideQuery ?? query).trim();
    if (!q) return;

    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: "user", content: q };
    setChatHistory(prev => [...prev, userMsg]);
    setQuery("");
    setLoading(true);
    setInsight(null);

    const context = codeCtx
      ? `User-provided code:\n${codeCtx}`
      : selectedFile
        ? `File context: ${selectedFile}`
        : undefined;

    const result = await askBob(q, context);
    setInsight(result);

    const bobMsg: ChatMessage = {
      id: `b-${Date.now()}`, role: "bob",
      content:     result.explanation,
      suggestions: result.suggestions,
      impact:      result.impact,
      category:    result.category,
    };
    setChatHistory(prev => [...prev, bobMsg]);
    setLoading(false);
  }, [query, selectedFile]);

  const selectFile = (fileName: string) => {
    const q = `Explain the logic and architecture of ${fileName}`;
    setSelectedFile(fileName);
    setQuery(q);
    setActiveTab("explainer");
    (async () => {
      const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: "user", content: q };
      setChatHistory(prev => [...prev, userMsg]);
      setLoading(true);
      setInsight(null);
      const result = await askBob(q, `File context: ${fileName}`);
      setInsight(result);
      const bobMsg: ChatMessage = {
        id: `b-${Date.now()}`, role: "bob",
        content: result.explanation, suggestions: result.suggestions,
        impact: result.impact, category: result.category,
      };
      setChatHistory(prev => [...prev, bobMsg]);
      setLoading(false);
    })();
  };

  const handleAnalyzeRepo = async () => {
    setRepoLoading(true);
    const result = await analyzeBobRepo();
    setRepoAnalysis(result);
    setRepoLoading(false);
  };

  const launchWorkflow = (label: string, icon: ReactNode) => {
    const id = Math.random().toString(36).slice(2, 9);
    setActiveWorkflows(prev => [{ id, label, progress: 0, icon }, ...prev]);
    const interval = setInterval(() => {
      setActiveWorkflows(prev => prev.map(w => {
        if (w.id !== id) return w;
        const next = Math.min(w.progress + Math.floor(Math.random() * 18) + 5, 100);
        if (next >= 100) {
          clearInterval(interval);
          workflowIntervals.current.delete(id);
          return { ...w, progress: 100, done: true };
        }
        return { ...w, progress: next };
      }));
    }, 900);
    workflowIntervals.current.set(id, interval);
  };

  const handleExportReport = () => {
    const report = {
      generatedBy: "IBM Bob via Spark.Studio",
      timestamp:   new Date().toISOString(),
      repositoryStats: { totalFiles: 2450, complexityScore: "Medium (7.4)" },
      roi: { devTimeReclaimed: "48h/sprint", estimatedSavings: "$14,200", riskMitigation: "86%" },
      composition: REPO_DATA, complexity: COMPLEXITY_DATA, architecture: ARCHITECTURE,
      recommendations: recommendations.slice(0, 5).map(r => r.message),
      chatHistory: chatHistory.map(m => ({ role: m.role, content: m.content })),
      repoAnalysis: repoAnalysis || null,
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `ibm-bob-report-${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  const handleCodeAnalyze = () => {
    if (!codeInput.trim()) return;
    const q = "Analyze this code for architecture issues, performance bottlenecks, and security risks.";
    setShowCodeInput(false);
    setActiveTab("explainer");
    handleAskBob(q, codeInput);
  };

  // ── Boot screen ─────────────────────────────────────────────────────────────
  if (!booted) {
    return (
      <div className="min-h-screen bg-brand-black flex flex-col items-center justify-center gap-8 font-mono">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1,   opacity: 1 }}
          className="flex items-center gap-4"
        >
          <div className="w-16 h-16 bg-brand-indigo rounded-2xl border-4 border-white flex items-center justify-center shadow-[0_0_40px_rgba(15,98,254,0.6)]">
            <span className="text-white font-black text-4xl">B</span>
          </div>
          <div>
            <div className="text-white text-3xl font-black uppercase italic tracking-tight">
              SPARK<span className="text-brand-pink">.</span>STUDIO
            </div>
            <div className="text-brand-teal text-xs font-black uppercase tracking-widest">
              Powered by IBM Bob
            </div>
          </div>
        </motion.div>
        <div className="w-80 space-y-3">
          {BOOT_STEPS.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: i < bootStep ? 1 : 0.2, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-3"
            >
              <div className={`w-2 h-2 rounded-full shrink-0 ${i < bootStep ? "bg-brand-teal" : "bg-white/20"}`} />
              <span className={`text-xs font-bold uppercase tracking-widest ${i < bootStep ? "text-brand-teal" : "text-white/30"}`}>
                {step}
              </span>
            </motion.div>
          ))}
        </div>
        <div className="w-80 h-1 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-brand-teal"
            animate={{ width: `${(bootStep / BOOT_STEPS.length) * 100}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>
    );
  }

  // ── Landing page ─────────────────────────────────────────────────────────────
  if (showLanding) {
    return (
      <div className="min-h-screen bg-brand-black text-white flex flex-col overflow-hidden relative">
        {/* Background grid */}
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: "linear-gradient(#0F62FE 1px,transparent 1px),linear-gradient(90deg,#0F62FE 1px,transparent 1px)", backgroundSize: "40px 40px" }}
        />
        {/* Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-brand-indigo/20 rounded-full blur-[120px]" />

        <nav className="relative z-10 h-20 px-8 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-indigo rounded-xl border-2 border-white flex items-center justify-center">
              <span className="text-white font-black text-2xl">B</span>
            </div>
            <span className="text-xl font-black uppercase italic">
              SPARK<span className="text-brand-pink">.</span>STUDIO
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-black text-brand-teal uppercase tracking-widest hidden sm:block">
              IBM Bob Hackathon 2026
            </span>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowLanding(false)}
              className="bg-brand-indigo text-white px-6 py-3 rounded-xl border-2 border-white font-black text-sm uppercase tracking-widest flex items-center gap-2"
            >
              Launch App <ArrowRight size={16} />
            </motion.button>
          </div>
        </nav>

        <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center gap-12 py-20">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-4xl">
            <div className="inline-flex items-center gap-2 bg-brand-teal/10 border border-brand-teal/30 px-4 py-2 rounded-full">
              <span className="w-2 h-2 bg-brand-teal rounded-full animate-pulse" />
              <span className="text-brand-teal text-xs font-black uppercase tracking-widest">Bob is online. 2,450 files indexed.</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black uppercase italic leading-none tracking-tighter">
              Your Repo.<br />
              <span className="text-brand-indigo">Your Rules.</span><br />
              <span className="text-brand-pink">AI as your</span> Dev Partner.
            </h1>
            <p className="text-lg md:text-xl text-white/60 font-medium max-w-2xl mx-auto leading-relaxed">
              Spark.Studio uses IBM Bob to index your entire codebase, explain complex logic, identify bottlenecks, and automate the work that slows your team down.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap gap-4 justify-center"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowLanding(false)}
              className="bg-brand-pink text-white px-10 py-5 rounded-2xl border-4 border-white font-black text-lg uppercase tracking-widest flex items-center gap-3 shadow-[8px_8px_0_white]"
            >
              <Cpu size={24} />
              Start with Bob
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={() => { setShowLanding(false); setActiveTab("explainer"); }}
              className="bg-transparent text-white px-10 py-5 rounded-2xl border-4 border-white/30 font-black text-lg uppercase tracking-widest flex items-center gap-3 hover:border-white transition-colors"
            >
              <MessageSquareCode size={24} />
              Try Logic Explainer
            </motion.button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl w-full"
          >
            {[
              { label: "Files Indexed",    value: "2,450",   color: "text-brand-teal"   },
              { label: "Dev Hours Saved",  value: "+48h",    color: "text-brand-yellow" },
              { label: "Risk Mitigation",  value: "86%",     color: "text-brand-pink"   },
              { label: "Est. Savings",     value: "$14.2k",  color: "text-brand-indigo" },
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
          <span>Spark.Studio — Built for speed. Built with Bob.</span>
        </footer>
      </div>
    );
  }

  // ── Main dashboard ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col bg-brand-bg text-brand-black font-sans selection:bg-brand-pink/30">

      {/* Code Input Modal */}
      <AnimatePresence>
        {showCodeInput && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowCodeInput(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-brand-dark-card border-brutal rounded-brutal-lg p-8 w-full max-w-2xl flex flex-col gap-4 shadow-brutal-lg"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black italic flex items-center gap-2 dark:text-white">
                  <Upload size={24} className="text-brand-indigo" />
                  Paste Your Code
                </h3>
                <button onClick={() => setShowCodeInput(false)} className="p-2 hover:bg-brand-bg dark:hover:bg-white/10 rounded-lg transition-colors">
                  <X size={20} className="dark:text-white" />
                </button>
              </div>
              <p className="text-sm font-bold text-brand-black/60 dark:text-white/60">
                Paste any code snippet and Bob will analyze it with full architectural context.
              </p>
              <textarea
                value={codeInput}
                onChange={e => setCodeInput(e.target.value)}
                placeholder="// Paste your code here..."
                className="w-full h-64 bg-brand-bg dark:bg-brand-dark-bg border-2 border-brand-black dark:border-white rounded-xl p-4 font-mono text-sm resize-none focus:outline-none focus:ring-4 focus:ring-brand-indigo/20 dark:text-white"
                autoFocus
              />
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleCodeAnalyze}
                  disabled={!codeInput.trim()}
                  className="flex-1 bg-brand-indigo text-white py-3 rounded-xl border-2 border-brand-black dark:border-white shadow-brutal font-black uppercase text-sm flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-brand-pink transition-colors"
                >
                  <Terminal size={18} />
                  Analyze with Bob
                </motion.button>
                <button
                  onClick={() => setCodeInput("")}
                  className="px-4 py-3 border-2 border-brand-black dark:border-white rounded-xl font-black text-sm uppercase hover:bg-brand-bg dark:hover:bg-white/10 transition-colors dark:text-white"
                >
                  Clear
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 25 }}
            className="fixed inset-y-0 right-0 z-[90] w-72 bg-white dark:bg-brand-dark-bg border-l-4 border-brand-black dark:border-white flex flex-col p-8 gap-6 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <span className="font-black text-xl uppercase italic dark:text-white">Menu</span>
              <button onClick={() => setMobileMenuOpen(false)}>
                <X size={24} className="dark:text-white" />
              </button>
            </div>
            <div className="flex flex-col gap-3">
              {["intelligence", "automation", "explainer"].map(tab => (
                <button key={tab} onClick={() => { setActiveTab(tab); setMobileMenuOpen(false); }}
                  className={`text-left px-4 py-3 rounded-xl font-black uppercase text-sm border-2 transition-colors ${
                    activeTab === tab
                      ? "bg-brand-indigo text-white border-brand-indigo"
                      : "border-brand-black dark:border-white dark:text-white hover:bg-brand-bg dark:hover:bg-white/10"
                  }`}
                >
                  {tab === "explainer" ? "Logic Explainer" : tab}
                </button>
              ))}
            </div>
            <div className="border-t border-brand-black/10 dark:border-white/10 pt-4 flex flex-col gap-3">
              <button onClick={() => { setShowCodeInput(true); setMobileMenuOpen(false); }}
                className="flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-brand-black dark:border-white font-black uppercase text-sm dark:text-white hover:bg-brand-bg dark:hover:bg-white/10 transition-colors"
              >
                <Upload size={16} /> Paste Code
              </button>
              <button onClick={handleAnalyzeRepo} disabled={repoLoading}
                className="flex items-center gap-2 px-4 py-3 rounded-xl bg-brand-indigo text-white border-2 border-brand-black dark:border-white font-black uppercase text-sm disabled:opacity-60"
              >
                {repoLoading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                {repoLoading ? "Analyzing..." : "Analyze Repo"}
              </button>
              <div className="flex items-center justify-between">
                <span className="font-black text-sm uppercase dark:text-white">Dark Mode</span>
                <button onClick={() => setDarkMode(!darkMode)}
                  className="w-10 h-10 bg-brand-bg dark:bg-white/10 border-2 border-brand-black dark:border-white rounded-xl flex items-center justify-center"
                >
                  {darkMode ? <Sun size={18} className="text-brand-yellow" /> : <Moon size={18} className="text-brand-indigo" />}
                </button>
              </div>
            </div>
            <button onClick={() => setShowLanding(true)} className="mt-auto text-xs font-black uppercase text-brand-indigo/60 dark:text-brand-teal hover:text-brand-pink transition-colors flex items-center gap-1">
              <ChevronRight size={14} /> Back to landing
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nav */}
      <nav className="h-20 px-6 md:px-10 flex items-center justify-between border-b-4 border-brand-black/10 bg-white dark:bg-brand-dark-bg sticky top-0 z-50">
        <button onClick={() => setShowLanding(true)} className="flex items-center gap-3">
          <motion.div initial={{ rotate: -6 }} whileHover={{ rotate: 0 }}
            className="w-10 h-10 bg-brand-indigo rounded-xl flex items-center justify-center border-2 border-brand-black dark:border-white shadow-brutal"
          >
            <span className="text-white font-black text-2xl">B</span>
          </motion.div>
          <div className="flex flex-col">
            <span className="text-xl md:text-2xl font-black tracking-tight uppercase italic leading-none dark:text-white">
              SPARK<span className="text-brand-pink">.</span>STUDIO
            </span>
            <span className="text-[10px] font-black text-brand-indigo dark:text-brand-teal uppercase tracking-widest mt-0.5">
              Powered by IBM Bob
            </span>
          </div>
        </button>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center gap-4 font-bold text-sm uppercase tracking-widest">
          {["intelligence", "automation", "explainer"].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`capitalize transition-opacity ${activeTab === tab ? "text-brand-pink" : "opacity-40 dark:text-white hover:opacity-100"}`}
            >
              {tab === "explainer" ? "Logic Explainer" : tab}
            </button>
          ))}
          <div className="flex items-center gap-3 bg-brand-pink/5 dark:bg-brand-indigo/10 px-4 py-2 rounded-full border border-brand-pink/20">
            <span className="w-1.5 h-1.5 bg-brand-teal rounded-full animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-brand-indigo dark:text-brand-teal">Context Active</span>
            <div className="w-px h-4 bg-brand-indigo/20" />
            <span className="text-[10px] font-black uppercase text-brand-black/40 dark:text-white/40">2,450 Nodes</span>
          </div>
          <button onClick={() => setShowCodeInput(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-brand-black dark:border-white shadow-brutal font-black text-xs uppercase hover:bg-brand-indigo hover:text-white dark:text-white transition-colors"
          >
            <Upload size={16} /> Paste Code
          </button>
          <button onClick={() => setDarkMode(!darkMode)}
            className="w-10 h-10 bg-white dark:bg-brand-dark-card border-2 border-brand-black dark:border-white rounded-xl shadow-brutal flex items-center justify-center hover-brutal"
          >
            {darkMode ? <Sun size={18} className="text-brand-yellow" /> : <Moon size={18} className="text-brand-indigo" />}
          </button>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={handleAnalyzeRepo} disabled={repoLoading}
            className="bg-brand-indigo text-white px-6 py-3 rounded-xl border-2 border-brand-black dark:border-white shadow-brutal hover:shadow-none translate-y-[-2px] hover:translate-y-0 transition-all flex items-center gap-2 disabled:opacity-60"
          >
            {repoLoading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
            <span>{repoLoading ? "Analyzing..." : "Analyze Repo"}</span>
          </motion.button>
        </div>

        {/* Mobile hamburger */}
        <button onClick={() => setMobileMenuOpen(true)} className="lg:hidden p-2 border-2 border-brand-black dark:border-white rounded-xl dark:text-white">
          <Menu size={24} />
        </button>
      </nav>

      <main className="flex-1 p-4 md:p-10 grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 max-w-7xl mx-auto w-full">
        {/* Left Column */}
        <div className="lg:col-span-8 flex flex-col gap-6 md:gap-8">
          {/* Hero */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-brand-teal dark:bg-brand-indigo p-6 md:p-12 rounded-brutal-lg border-brutal shadow-brutal-lg relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/20 rounded-full -mr-24 -mt-24 group-hover:scale-125 transition-transform duration-700" />
            <div className="bg-brand-black text-white px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest inline-flex items-center gap-2 mb-6">
              <Cpu size={14} className="text-brand-teal animate-pulse" />
              Dev Partner Online
            </div>
            <h1 className="text-3xl md:text-5xl font-black leading-tight text-brand-black dark:text-white mb-6">
              "Bob, help me understand
              <br />
              <span className="text-brand-indigo dark:text-brand-yellow italic underline decoration-4 underline-offset-8 decoration-brand-yellow">
                this repository.
              </span>"
            </h1>
            <p className="text-base md:text-xl font-medium text-brand-black/80 dark:text-white/90 max-w-md mb-6">
              Your AI partner has indexed <strong>2,450 files</strong>. Ready to automate refactors, clarify logic, and generate deep docs.
            </p>
            <div className="flex flex-wrap gap-3">
              <div className="bg-white/10 backdrop-blur-sm px-4 md:px-6 py-3 md:py-4 rounded-brutal border-2 border-white/20 flex flex-col">
                <span className="text-[10px] font-black text-white/60 uppercase">Context Depth</span>
                <span className="text-xl md:text-2xl font-black text-white">Full Repo</span>
              </div>
              <div className="bg-white/10 backdrop-blur-sm px-4 md:px-6 py-3 md:py-4 rounded-brutal border-2 border-white/20 flex flex-col">
                <span className="text-[10px] font-black text-white/60 uppercase">Complexity Score</span>
                <span className="text-xl md:text-2xl font-black text-white">Medium (7.4)</span>
              </div>
              {repoAnalysis && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  className={`bg-white/10 backdrop-blur-sm px-4 md:px-6 py-3 md:py-4 rounded-brutal border-2 border-white/20 flex flex-col ${repoAnalysis.risk === "High" ? "border-brand-pink/60" : ""}`}
                >
                  <span className="text-[10px] font-black text-white/60 uppercase">Bob's Risk Assessment</span>
                  <span className={`text-xl md:text-2xl font-black ${repoAnalysis.risk === "High" ? "text-brand-pink" : "text-white"}`}>
                    {repoAnalysis.risk} Risk
                  </span>
                </motion.div>
              )}
            </div>
            {repoAnalysis && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 bg-white/10 rounded-brutal border border-white/20"
              >
                <p className="text-sm font-bold text-white/90 leading-relaxed">
                  <span className="text-brand-yellow font-black">Bob says: </span>
                  {repoAnalysis.summary}
                </p>
                <p className="text-xs font-black text-white/60 mt-2 uppercase tracking-widest">
                  Priority this sprint: {repoAnalysis.recommendation}
                </p>
              </motion.div>
            )}
          </motion.div>

          {/* Tabs */}
          <AnimatePresence mode="wait">
            {activeTab === "intelligence" && (
              <motion.div key="intelligence" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6 md:space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <FeatureCard icon={<BookOpen size={24} />} title="Identity and Flow" subtitle="Repo Intelligence"
                    description="Bob maps how authentication flows through your middleware and services." color="bg-brand-yellow" />
                  <FeatureCard icon={<Layers size={24} />} title="Context Graph" subtitle="Service Mapping"
                    description="Bob identified 12 interconnected microservices and 4 critical data paths." color="bg-brand-teal" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  {/* Pie chart */}
                  <div className="bg-white dark:bg-brand-dark-card border-brutal rounded-brutal-lg p-6 shadow-brutal flex flex-col gap-4">
                    <h3 className="text-xl font-black italic flex items-center gap-2 dark:text-white">
                      <PieChartIcon size={20} className="text-brand-pink" /> Repo Composition
                    </h3>
                    <div className="h-44 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={REPO_DATA} innerRadius={36} outerRadius={56} paddingAngle={5} dataKey="value" stroke="#1A1A1A" strokeWidth={2}>
                            {REPO_DATA.map((e, i) => <Cell key={i} fill={e.color} />)}
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor:"#1A1A1A", border:"none", borderRadius:"8px", color:"white", fontWeight:"900", fontSize:"10px" }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {REPO_DATA.map(item => (
                        <div key={item.name} className="flex items-center gap-2 text-[10px] font-black uppercase dark:text-white/80">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                          {item.name}: {item.value}%
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* ROI */}
                  <div className="bg-white dark:bg-brand-dark-card border-brutal rounded-brutal-lg p-6 shadow-brutal flex flex-col gap-4">
                    <h3 className="text-xl font-black italic flex items-center gap-2 dark:text-white">
                      <Zap size={20} className="text-brand-yellow" /> Strategic ROI
                    </h3>
                    <button onClick={handleExportReport}
                      className="p-2 bg-brand-indigo text-white rounded-lg border border-brand-black dark:border-white shadow-sm hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 group"
                    >
                      <Download size={14} className="group-hover:animate-bounce" />
                      <span className="text-[10px] font-black uppercase">Export Report</span>
                    </button>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-brand-indigo/5 dark:bg-brand-indigo/20 p-4 rounded-xl border border-brand-indigo/20">
                        <p className="text-[10px] font-black uppercase text-brand-indigo dark:text-brand-teal opacity-60">Estimated Savings</p>
                        <p className="text-2xl font-black text-brand-indigo dark:text-brand-teal">$14.2k</p>
                      </div>
                      <div className="bg-brand-pink/5 dark:bg-brand-pink/20 p-4 rounded-xl border border-brand-pink/20">
                        <p className="text-[10px] font-black uppercase text-brand-pink opacity-60">Risk Mitigation</p>
                        <p className="text-2xl font-black text-brand-pink">86%</p>
                      </div>
                    </div>
                    <div className="text-center pt-1">
                      <div className="text-4xl font-black text-brand-indigo dark:text-white">+48h</div>
                      <p className="text-[10px] font-black uppercase text-brand-indigo/60 dark:text-brand-teal/60 tracking-widest">Dev Time Reclaimed / Sprint</p>
                    </div>
                  </div>
                </div>
                {/* Complexity */}
                <div className="bg-white dark:bg-brand-dark-card border-brutal rounded-brutal-lg p-6 shadow-brutal flex flex-col gap-4">
                  <h3 className="text-xl font-black italic flex items-center gap-2 dark:text-white">
                    <TrendingUp size={20} className="text-brand-indigo" /> Module Complexity
                  </h3>
                  <div className="h-40 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={COMPLEXITY_DATA} barSize={28}>
                        <XAxis dataKey="module" tick={{ fontSize: 10, fontWeight: 900, fill: "#888" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: "#888" }} axisLine={false} tickLine={false} domain={[0, 100]} />
                        <Tooltip contentStyle={{ backgroundColor:"#1A1A1A", border:"none", borderRadius:"8px", color:"white", fontWeight:"900", fontSize:"10px" }} />
                        <Bar dataKey="score" radius={[6,6,0,0]}>
                          {COMPLEXITY_DATA.map((e, i) => (
                            <Cell key={i} fill={e.score >= 70 ? "#D12771" : e.score >= 50 ? "#0F62FE" : "#11D3BC"} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                {/* Architecture */}
                <div className="bg-brand-indigo p-6 md:p-8 rounded-brutal-lg border-brutal shadow-brutal text-white">
                  <h3 className="text-2xl font-black italic mb-6 flex items-center gap-3">
                    <ShieldCheck size={28} /> Architectural Discovery
                  </h3>
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
                {/* Repo explorer */}
                <div className="bg-white dark:bg-brand-dark-card border-brutal rounded-brutal-lg p-6 md:p-8 shadow-brutal flex flex-col gap-6">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h3 className="text-2xl font-black italic flex items-center gap-3 dark:text-white">
                      <FileCode2 className="text-brand-indigo" size={28} /> Repo Consciousness
                    </h3>
                    <span className="text-[10px] font-black text-brand-indigo/60 dark:text-brand-teal uppercase">Click a file for deep focus</span>
                  </div>
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-3 md:gap-4">
                    {FILES.map(file => (
                      <motion.button key={file.name} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={() => selectFile(file.name)}
                        className={`p-3 md:p-4 rounded-xl border-2 border-brand-black dark:border-white shadow-sm flex flex-col items-center gap-2 transition-all ${
                          selectedFile === file.name ? "bg-brand-indigo text-white" : "bg-white dark:bg-brand-dark-bg hover:bg-brand-bg dark:hover:bg-white/5"
                        }`}
                      >
                        <FileCode2 size={20} className={selectedFile === file.name ? "text-white" : "text-brand-indigo"} />
                        <span className={`text-[9px] font-black uppercase truncate w-full text-center ${selectedFile === file.name ? "text-white" : "dark:text-white"}`}>{file.name}</span>
                        <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full border border-current ${file.complexity === "High" ? "border-brand-pink text-brand-pink" : "border-brand-teal text-brand-teal"}`}>
                          {file.complexity}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "automation" && (
              <motion.div key="automation" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6 md:space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <FeatureCard icon={<Zap size={24} />} title="Test Generator" subtitle="Contextual Automation"
                    description="Instantly generate Jest/Vitest tests for the 14 uncovered modules found." color="bg-brand-pink" darkOnHover />
                  <FeatureCard icon={<Sparkles size={24} />} title="Multi-step Work" subtitle="Complex Pipelines"
                    description="Deploy a staging environment with mock data populated for testing." color="bg-brand-indigo" darkOnHover />
                </div>
                <div className="bg-white dark:bg-brand-dark-card border-brutal rounded-brutal-lg p-6 md:p-8 shadow-brutal flex flex-col gap-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-black italic flex items-center gap-3 dark:text-white">
                      <Wand2 className="text-brand-pink" size={28} /> Automation Lab
                    </h3>
                    <button className="bg-brand-black dark:bg-white dark:text-brand-black text-white px-4 py-2 rounded-full text-xs font-black uppercase hover:scale-105 transition-transform">
                      New Strategy
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ActionItem icon={<FileCode2 size={20} />} title="Generate Docs"   desc="Create README for all submodules"    tag="Documentation" onClick={() => launchWorkflow("Generating Docs",     <FileCode2   size={16} />)} />
                    <ActionItem icon={<ShieldCheck size={20} />} title="Security Patch" desc="Update vulnerable dependencies"      tag="Safety"        onClick={() => launchWorkflow("Security Patching",   <ShieldCheck size={16} />)} />
                    <ActionItem icon={<GitBranch size={20} />} title="Refactor Props"   desc="Convert interfaces to types"         tag="Refactoring"   onClick={() => launchWorkflow("Refactoring Types",   <GitBranch   size={16} />)} />
                    <ActionItem icon={<Settings size={20} />} title="CI/CD Config"      desc="Generate GitHub Action workflows"    tag="DevOps"        onClick={() => launchWorkflow("Configuring CI/CD",  <Settings    size={16} />)} />
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "explainer" && (
              <motion.div key="explainer" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="bg-white dark:bg-brand-dark-card border-brutal rounded-brutal-lg p-6 md:p-8 shadow-brutal flex flex-col gap-6"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h3 className="text-2xl font-black italic flex items-center gap-3 dark:text-white">
                    <MessageSquareCode className="text-brand-indigo" size={28} /> Bob's Logic Explainer
                  </h3>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setShowCodeInput(true)}
                      className="flex items-center gap-1.5 px-3 py-2 border-2 border-brand-black dark:border-white rounded-lg font-black text-[10px] uppercase hover:bg-brand-indigo hover:text-white dark:text-white transition-colors"
                    >
                      <Upload size={12} /> Paste Code
                    </button>
                    {chatHistory.length > 0 && (
                      <button onClick={() => setChatHistory([])}
                        className="flex items-center gap-1.5 px-3 py-2 border-2 border-brand-black/30 dark:border-white/30 rounded-lg font-black text-[10px] uppercase hover:border-brand-pink hover:text-brand-pink dark:text-white/60 transition-colors"
                      >
                        <X size={12} /> Clear chat
                      </button>
                    )}
                    <div className="flex items-center gap-2 text-xs font-black text-brand-indigo/60 dark:text-brand-teal uppercase tracking-widest">
                      <div className="w-2 h-2 bg-brand-teal rounded-full animate-pulse" />
                      Repo Context: Active
                    </div>
                  </div>
                </div>

                {/* Chat history */}
                <div className="flex flex-col gap-4 max-h-[420px] overflow-y-auto pr-1">
                  {chatHistory.length === 0 && !loading && (
                    <div className="bg-brand-bg dark:bg-brand-dark-bg rounded-brutal p-6 border-2 border-dashed border-brand-black/20 dark:border-white/20 font-mono text-sm">
                      <p className="text-brand-black/40 dark:text-white/40 italic">
                        Select a file from the Intelligence tab, paste your own code, or type a question below.
                      </p>
                    </div>
                  )}

                  <AnimatePresence>
                    {chatHistory.map(msg => (
                      <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center border-2 shrink-0 ${
                          msg.role === "bob"
                            ? "bg-brand-indigo border-brand-black dark:border-white"
                            : "bg-brand-pink border-brand-black dark:border-white"
                        }`}>
                          <span className="text-[10px] text-white font-black">{msg.role === "bob" ? "B" : "Y"}</span>
                        </div>
                        <div className={`flex-1 max-w-[85%] ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col gap-2`}>
                          {msg.role === "user" ? (
                            <div className="bg-brand-pink text-white px-4 py-3 rounded-2xl rounded-tr-sm font-bold text-sm">
                              {msg.content}
                            </div>
                          ) : (
                            <div className="bg-brand-bg dark:bg-brand-dark-bg border-2 border-dashed border-brand-black/20 dark:border-white/20 rounded-2xl rounded-tl-sm p-4 font-mono text-sm space-y-3">
                              <div className="flex gap-2 flex-wrap">
                                {msg.category && (
                                  <span className="bg-brand-indigo/10 text-brand-indigo dark:text-brand-teal text-[9px] font-black uppercase px-2 py-1 rounded border border-brand-indigo/20">
                                    {msg.category}
                                  </span>
                                )}
                                {msg.impact && (
                                  <span className="bg-brand-teal text-brand-black text-[9px] font-black uppercase px-2 py-1 rounded border border-brand-black">
                                    {msg.impact}
                                  </span>
                                )}
                              </div>
                              <p className="leading-relaxed text-brand-black dark:text-white/80 font-medium text-[13px]">
                                "{msg.content}"
                              </p>
                              {msg.suggestions && (
                                <div className="space-y-1.5 pt-1">
                                  <p className="text-[9px] font-black text-brand-indigo/40 dark:text-white/40 uppercase">Suggestions:</p>
                                  {msg.suggestions.map((s, i) => (
                                    <div key={i} className="flex items-start gap-2">
                                      <CheckCircle2 size={13} className="text-brand-teal mt-0.5 shrink-0" />
                                      <span className="text-[11px] font-bold dark:text-white/80">{s}</span>
                                    </div>
                                  ))}
                                  <button
                                    onClick={() => launchWorkflow("Applying Transformation", <Sparkles size={16} />)}
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

                  {loading && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                      <div className="w-8 h-8 rounded-lg bg-brand-indigo border-2 border-brand-black dark:border-white flex items-center justify-center shrink-0">
                        <span className="text-[10px] text-white font-black">B</span>
                      </div>
                      <div className="bg-brand-bg dark:bg-brand-dark-bg border-2 border-dashed border-brand-black/20 dark:border-white/20 rounded-2xl rounded-tl-sm px-5 py-4 flex items-center gap-3">
                        <Loader2 className="animate-spin text-brand-pink" size={18} />
                        <span className="text-xs font-black uppercase tracking-widest text-brand-indigo/60 dark:text-brand-teal">
                          Bob is reading the repo...
                        </span>
                      </div>
                    </motion.div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Input */}
                <div className="relative">
                  <input type="text" value={query} onChange={e => setQuery(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") handleAskBob(); }}
                    placeholder="Ask Bob about any module, logic, or transformation..."
                    className="w-full bg-brand-bg dark:bg-brand-dark-bg p-4 pr-14 rounded-full border-2 border-brand-black dark:border-white font-bold focus:outline-none focus:ring-4 focus:ring-brand-pink/20 transition-all dark:text-white"
                  />
                  <button onClick={() => handleAskBob()} disabled={loading || !query.trim()}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-brand-pink text-white rounded-full shadow-sm hover:scale-110 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all"
                  >
                    {loading ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
                  </button>
                </div>

                <div className="flex flex-wrap gap-3">
                  {["Explain auth flow", "Find performance bottlenecks", "Map external APIs", "Review API client resilience"].map((q, i) => (
                    <button key={i} onClick={() => handleAskBob(q)}
                      className="text-[10px] font-black uppercase text-brand-indigo/60 hover:text-brand-pink transition-colors border-b border-dashed border-brand-indigo/20 hover:border-brand-pink"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar */}
        <aside className="lg:col-span-4 flex flex-col gap-6 md:gap-8">
          <div className="bg-brand-pink/5 dark:bg-brand-pink/10 border-brutal rounded-brutal-lg p-6 md:p-8 flex flex-col gap-6 md:gap-8 shadow-brutal">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black uppercase italic flex items-center gap-2 dark:text-white">
                <ActivityIcon size={24} /> Live Pulse
              </h2>
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
            </div>

            <div className="flex flex-col gap-6">
              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase text-brand-indigo dark:text-brand-teal tracking-widest">Active Discoveries</p>
                <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  className="p-3 bg-brand-black dark:bg-brand-indigo rounded-xl border border-white/10"
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[9px] font-black text-brand-teal uppercase">Architectural Drift</span>
                    <span className="text-[8px] text-white/40 uppercase">2m ago</span>
                  </div>
                  <p className="text-[11px] text-white font-medium leading-tight">
                    Legacy fetch pattern detected in /services/old-api vs new Axios standard.
                  </p>
                </motion.div>
                <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }}
                  className="p-3 bg-brand-pink/10 dark:bg-brand-pink/20 rounded-xl border border-brand-pink/30"
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[9px] font-black text-brand-pink uppercase">Optimization Gap</span>
                    <span className="text-[8px] text-brand-black/40 dark:text-white/60 uppercase">5m ago</span>
                  </div>
                  <p className="text-[11px] text-brand-black dark:text-white font-medium leading-tight">
                    Memoization gap in HeavyGraph.tsx causing 12ms UI stutter.
                  </p>
                </motion.div>
              </div>

              {/* Cognitive depth */}
              <div className="bg-brand-black dark:bg-brand-dark-card border-2 border-white/10 rounded-2xl p-4 hover:scale-[1.02] transition-transform">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-2 h-2 bg-brand-teal rounded-full animate-pulse" />
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">Bob Cognitive Depth</span>
                </div>
                <div className="h-6 bg-white/10 rounded-full border border-white/20 overflow-hidden relative">
                  <motion.div initial={{ width: 0 }} animate={{ width: "94%" }} transition={{ duration: 1.5, ease: "easeOut" }}
                    className="h-full bg-brand-teal shadow-[0_0_15px_rgba(17,211,188,0.6)]"
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-brand-black">
                    94.8% REPO INDEXED
                  </span>
                </div>
              </div>

              {/* Workflows */}
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
            </div>

            {/* Recommendations */}
            <div className="pt-6 border-t-2 border-brand-black/10">
              <p className="text-xs font-black uppercase text-brand-pink mb-4">Bob's Active Recommendations</p>
              <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {recommendations.map(rec => (
                    <motion.div key={rec.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                      <RecommendationItem message={rec.message} time={rec.time}
                        onFix={rec.action ? () => launchWorkflow(`Fixing: ${rec.action!.type}`, rec.action!.icon) : undefined}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* CTA */}
          <motion.div whileHover={{ scale: 1.02 }} onClick={() => setActiveTab("explainer")}
            className="bg-brand-indigo p-6 md:p-8 rounded-brutal border-brutal shadow-brutal text-white flex flex-col gap-4 overflow-hidden relative cursor-pointer"
          >
            <div className="absolute top-0 right-0 p-4 opacity-20"><Sparkles size={64} /></div>
            <h4 className="text-2xl font-black italic">Turn idea<br />into impact.</h4>
            <p className="text-xs font-bold text-white/70 uppercase tracking-widest leading-relaxed">
              Use Bob to automate the tasks that slow you down.
            </p>
            <button className="bg-white text-brand-indigo px-4 py-2 rounded-full font-black text-xs uppercase self-start hover:bg-brand-yellow hover:text-brand-black transition-colors">
              Start with Bob
            </button>
          </motion.div>
        </aside>
      </main>

      <footer className="h-12 px-6 md:px-10 bg-brand-black text-white flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] sticky bottom-0">
        <div className="flex gap-4 md:gap-8 overflow-hidden whitespace-nowrap">
          <span className="opacity-60">IBM Bob Core v2.1</span>
          <span className="text-brand-teal flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-brand-teal rounded-full animate-ping" /> Sync: Stable
          </span>
        </div>
        <div className="hidden sm:flex gap-8">
          <span className="opacity-60">Memory: 4.2GB</span>
          <span className="opacity-60">Repo Identity: Verified</span>
        </div>
      </footer>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function FeatureCard({ icon, title, subtitle, description, color, darkOnHover = false }: {
  icon: ReactNode; title: string; subtitle: string; description: string; color: string; darkOnHover?: boolean;
}) {
  return (
    <motion.div whileHover={{ y: -4, x: -4 }}
      className={`bg-white dark:bg-brand-dark-card p-6 rounded-brutal border-brutal shadow-brutal transition-colors group cursor-pointer ${
        darkOnHover ? "hover:bg-brand-pink hover:text-white" : `hover:${color}`
      }`}
    >
      <div className={`w-12 h-12 ${color} group-hover:bg-white dark:group-hover:bg-brand-dark-bg rounded-2xl mb-4 flex items-center justify-center border-2 border-brand-black dark:border-white transition-colors`}>
        {icon}
      </div>
      <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${darkOnHover ? "group-hover:text-white/70 text-brand-pink" : "text-brand-indigo dark:text-brand-teal"}`}>
        {subtitle}
      </p>
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
        <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.5, ease: "easeOut" }}
          className={`h-full rounded-full ${done ? "bg-brand-teal" : "bg-brand-pink"}`}
        />
      </div>
    </div>
  );
}

function RecommendationItem({ message, time, onFix }: { message: string; time: string; onFix?: () => void; }) {
  return (
    <div className="flex gap-3 group relative">
      <div className="w-8 h-8 bg-brand-indigo rounded-lg flex items-center justify-center border border-brand-black dark:border-white shrink-0">
        <span className="text-[10px] text-white font-black">B</span>
      </div>
      <div className="flex flex-col flex-1 pr-8">
        <p className="text-xs font-bold leading-tight text-brand-pink">{message}</p>
        <span className="text-[9px] font-black opacity-40 dark:opacity-60 uppercase mt-0.5">{time}</span>
      </div>
      {onFix && (
        <button onClick={onFix}
          className="absolute right-0 top-0 p-1.5 bg-brand-teal text-brand-black rounded-lg border border-brand-black dark:border-white opacity-0 group-hover:opacity-100 hover:scale-110 active:scale-95 transition-all"
          title="Auto-fix"
        >
          <Zap size={10} fill="currentColor" />
        </button>
      )}
    </div>
  );
}

function ActionItem({ icon, title, desc, tag, onClick }: { icon: ReactNode; title: string; desc: string; tag: string; onClick: () => void; }) {
  return (
    <motion.div whileHover={{ scale: 1.02 }} onClick={onClick}
      className="p-4 bg-brand-bg dark:bg-brand-black/40 rounded-brutal border-2 border-brand-black dark:border-white/40 group cursor-pointer hover:bg-white dark:hover:bg-brand-indigo/20 transition-colors"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="p-2 bg-white dark:bg-brand-dark-bg rounded-lg border border-brand-black dark:border-white/20 group-hover:bg-brand-indigo group-hover:text-white transition-colors">{icon}</div>
        <span className="text-[8px] font-black uppercase tracking-widest bg-brand-teal text-brand-black px-2 py-0.5 rounded-full border border-brand-black dark:border-white/20">{tag}</span>
      </div>
      <h4 className="text-sm font-black mb-1 dark:text-white">{title}</h4>
      <p className="text-[11px] font-bold opacity-60 dark:opacity-50 leading-tight dark:text-white/70">{desc}</p>
    </motion.div>
  );
}
