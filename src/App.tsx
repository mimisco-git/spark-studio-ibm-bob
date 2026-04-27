import { motion, AnimatePresence } from "motion/react";
import {
  Zap,
  Activity as ActivityIcon,
  Plus,
  Code2,
  BookOpen,
  Cpu,
  ShieldCheck,
  MessageSquareCode,
  Search,
  Sparkles,
  Loader2,
  PieChart as PieChartIcon,
  Layers,
  Wand2,
  FileCode2,
  GitBranch,
  Settings,
  Sun,
  Moon,
  Download,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import { useState, useEffect, ReactNode, useCallback, useRef } from "react";
import { askBob, analyzeBobRepo, BobInsight, BobRepoAnalysis } from "./services/bobService";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from "recharts";

const REPO_DATA = [
  { name: "TypeScript", value: 65, color: "#0F62FE" },
  { name: "Testing", value: 15, color: "#D12771" },
  { name: "Config", value: 10, color: "#F1C21B" },
  { name: "Docs", value: 10, color: "#11D3BC" },
];

const COMPLEXITY_DATA = [
  { module: "Auth", score: 85 },
  { module: "API", score: 60 },
  { module: "Store", score: 45 },
  { module: "Hooks", score: 55 },
  { module: "UI", score: 30 },
];

const ARCHITECTURE = [
  { label: "Auth Pattern", value: "JWT + Cascading Redis Cache", status: "Verified" },
  { label: "Data Flow", value: "Unidirectional via Store Hooks", status: "Stable" },
  { label: "API Strategy", value: "RESTful with Zod Validation", status: "Optimized" },
  { label: "Deployment", value: "Dockerized Node Express", status: "Production" },
];

const FILES = [
  { name: "authService.ts", type: "logic", complexity: "High" },
  { name: "dataMapper.ts", type: "transformation", complexity: "Med" },
  { name: "apiClient.ts", type: "network", complexity: "Med" },
  { name: "app.tsx", type: "ui", complexity: "Low" },
  { name: "schema.prisma", type: "database", complexity: "High" },
];

const RECOMMENDATIONS_STATIC = [
  { id: "r1", message: "Found 3 circular dependencies in /src/lib", time: "Now" },
  { id: "r2", message: "Exporting 'User' type would fix 12 TS errors", time: "5m ago" },
];

type Recommendation = {
  id: string;
  message: string;
  time: string;
  action?: { type: string; icon: ReactNode };
};

type Workflow = {
  id: string;
  label: string;
  progress: number;
  icon: ReactNode;
  done?: boolean;
};

export default function App() {
  const [activeTab, setActiveTab] = useState("intelligence");
  const [darkMode, setDarkMode] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [repoLoading, setRepoLoading] = useState(false);
  const [insight, setInsight] = useState<BobInsight | null>(null);
  const [repoAnalysis, setRepoAnalysis] = useState<BobRepoAnalysis | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>(RECOMMENDATIONS_STATIC);
  const [activeWorkflows, setActiveWorkflows] = useState<Workflow[]>([
    { id: "w1", label: "Automating Docs", progress: 64, icon: <Code2 size={16} /> },
    { id: "w2", label: "Mapping Data flow", progress: 82, icon: <Cpu size={16} /> },
  ]);

  // Track workflow intervals so we can clean them up
  const workflowIntervals = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  // Live pulse: proactive recommendations
  useEffect(() => {
    const proactiveInsights = [
      { msg: "Detected redundant state in authService.ts", type: "Refactoring", icon: <GitBranch size={16} /> },
      { msg: "API client could use a retry wrapper", type: "Safety", icon: <ShieldCheck size={16} /> },
      { msg: "Database schema missing index on email field", type: "DevOps", icon: <Settings size={16} /> },
      { msg: "Logic gap detected in session validation", type: "Safety", icon: <ShieldCheck size={16} /> },
      { msg: "Unit test coverage for hooks is below 20%", type: "Documentation", icon: <FileCode2 size={16} /> },
      { msg: "Potential memory leak in useWebSocket hook", type: "Performance", icon: <AlertTriangle size={16} /> },
    ];
    const interval = setInterval(() => {
      const pick = proactiveInsights[Math.floor(Math.random() * proactiveInsights.length)];
      const id = `live-${Date.now()}`;
      setRecommendations((prev) => [
        { id, message: pick.msg, time: "Just now", action: { type: pick.type, icon: pick.icon } },
        ...prev.slice(0, 4),
      ]);
    }, 12000);
    return () => clearInterval(interval);
  }, []);

  // Clean up workflow intervals on unmount
  useEffect(() => {
    return () => {
      workflowIntervals.current.forEach((interval) => clearInterval(interval));
    };
  }, []);

  // FIX: use useCallback so handleAskBob can be called with a specific query value
  const handleAskBob = useCallback(async (overrideQuery?: string) => {
    const q = (overrideQuery ?? query).trim();
    if (!q) return;
    setLoading(true);
    setInsight(null);
    const context = selectedFile ? `File context: ${selectedFile}` : undefined;
    const result = await askBob(q, context);
    setInsight(result);
    setLoading(false);
  }, [query, selectedFile]);

  // FIX: selectFile now passes the constructed query directly instead of relying on state
  const selectFile = (fileName: string) => {
    const q = `Explain the logic and architecture of ${fileName}`;
    setSelectedFile(fileName);
    setQuery(q);
    // Pass the query directly so we don't depend on React state update timing
    (async () => {
      setLoading(true);
      setInsight(null);
      const result = await askBob(q, `File context: ${fileName}`);
      setInsight(result);
      setLoading(false);
    })();
    setActiveTab("explainer");
  };

  const handleAnalyzeRepo = async () => {
    setRepoLoading(true);
    const result = await analyzeBobRepo();
    setRepoAnalysis(result);
    setRepoLoading(false);
  };

  const launchWorkflow = (label: string, icon: ReactNode) => {
    const id = Math.random().toString(36).slice(2, 9);
    setActiveWorkflows((prev) => [{ id, label, progress: 0, icon }, ...prev]);

    const interval = setInterval(() => {
      setActiveWorkflows((prev) =>
        prev.map((w) => {
          if (w.id !== id) return w;
          const next = Math.min(w.progress + Math.floor(Math.random() * 18) + 5, 100);
          if (next >= 100) {
            clearInterval(interval);
            workflowIntervals.current.delete(id);
            return { ...w, progress: 100, done: true };
          }
          return { ...w, progress: next };
        })
      );
    }, 900);

    workflowIntervals.current.set(id, interval);
  };

  // FIX: RECOMMENDATIONS constant is now defined (was referenced but missing)
  const reportRecommendations = recommendations.slice(0, 5).map((r) => r.message);

  const handleExportReport = () => {
    const report = {
      generatedBy: "IBM Bob via Spark.Studio",
      timestamp: new Date().toISOString(),
      repositoryStats: {
        totalFiles: 2450,
        indexedAt: new Date().toISOString(),
        complexityScore: "Medium (7.4)",
      },
      roi: {
        devTimeReclaimed: "48h/sprint",
        estimatedSavings: "$14,200",
        riskMitigation: "86%",
        securityImprovements: "12 patches",
      },
      composition: REPO_DATA,
      complexity: COMPLEXITY_DATA,
      architecture: ARCHITECTURE,
      recommendations: reportRecommendations,
      repoAnalysis: repoAnalysis || null,
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ibm-bob-strategic-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen flex flex-col bg-brand-bg text-brand-black font-sans selection:bg-brand-pink/30">
      {/* Nav */}
      <nav className="h-20 px-6 md:px-10 flex items-center justify-between border-b-4 border-brand-black/10 bg-white dark:bg-brand-dark-bg sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <motion.div
            initial={{ rotate: -6 }}
            whileHover={{ rotate: 0 }}
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
        </div>
        <div className="hidden lg:flex items-center gap-6 font-bold text-sm uppercase tracking-widest">
          {["intelligence", "automation", "explainer"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`capitalize transition-opacity ${
                activeTab === tab ? "text-brand-pink" : "opacity-40 dark:text-white hover:opacity-100"
              }`}
            >
              {tab === "explainer" ? "Logic Explainer" : tab}
            </button>
          ))}
          <div className="flex items-center gap-4 bg-brand-pink/5 dark:bg-brand-indigo/10 px-4 py-2 rounded-full border border-brand-pink/20">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-brand-teal rounded-full animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-brand-indigo dark:text-brand-teal">
                Context Active
              </span>
            </div>
            <div className="w-px h-4 bg-brand-indigo/20" />
            <span className="text-[10px] font-black uppercase text-brand-black/40 dark:text-white/40">
              2,450 Nodes
            </span>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="w-10 h-10 bg-white dark:bg-brand-dark-card border-2 border-brand-black dark:border-white rounded-xl shadow-brutal flex items-center justify-center hover-brutal"
          >
            {darkMode ? <Sun size={18} className="text-brand-yellow" /> : <Moon size={18} className="text-brand-indigo" />}
          </button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleAnalyzeRepo}
            disabled={repoLoading}
            className="bg-brand-indigo text-white px-6 py-3 rounded-xl border-2 border-brand-black dark:border-white shadow-brutal hover:shadow-none translate-y-[-2px] hover:translate-y-0 transition-all flex items-center gap-2 disabled:opacity-60"
          >
            {repoLoading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
            <span>{repoLoading ? "Analyzing..." : "Analyze Repo"}</span>
          </motion.button>
        </div>
      </nav>

      <main className="flex-1 p-6 md:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-7xl mx-auto w-full">
        {/* Left Column */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-brand-teal dark:bg-brand-indigo p-8 md:p-12 rounded-brutal-lg border-brutal shadow-brutal-lg relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/20 rounded-full -mr-24 -mt-24 group-hover:scale-125 transition-transform duration-700" />
            <div className="bg-brand-black text-white px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest inline-flex items-center gap-2 mb-6 shadow-sm">
              <Cpu size={14} className="text-brand-teal animate-pulse" />
              Dev Partner Online
            </div>
            <h1 className="text-4xl md:text-5xl font-black leading-tight text-brand-black dark:text-white mb-6">
              "Bob, help me understand
              <br />
              <span className="text-brand-indigo dark:text-brand-yellow italic underline decoration-4 underline-offset-8 decoration-brand-yellow">
                this repository.
              </span>
              "
            </h1>
            <p className="text-lg md:text-xl font-medium text-brand-black/80 dark:text-white/90 max-w-md mb-8">
              Your AI partner has indexed <strong>2,450 files</strong>. Ready to automate refactors, clarify logic, and generate deep docs.
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="bg-white/10 backdrop-blur-sm px-6 py-4 rounded-brutal border-2 border-white/20 flex flex-col">
                <span className="text-xs font-black text-white/60 uppercase">Context Depth</span>
                <span className="text-2xl font-black text-white">Full Repo</span>
              </div>
              <div className="bg-white/10 backdrop-blur-sm px-6 py-4 rounded-brutal border-2 border-white/20 flex flex-col">
                <span className="text-xs font-black text-white/60 uppercase">Complexity Score</span>
                <span className="text-2xl font-black text-white">Medium (7.4)</span>
              </div>
              {repoAnalysis && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`bg-white/10 backdrop-blur-sm px-6 py-4 rounded-brutal border-2 border-white/20 flex flex-col ${
                    repoAnalysis.risk === "High" ? "border-brand-pink/60" : ""
                  }`}
                >
                  <span className="text-xs font-black text-white/60 uppercase">Bob's Risk Assessment</span>
                  <span className={`text-2xl font-black ${repoAnalysis.risk === "High" ? "text-brand-pink" : "text-white"}`}>
                    {repoAnalysis.risk} Risk
                  </span>
                </motion.div>
              )}
            </div>
            {repoAnalysis && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
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

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            {activeTab === "intelligence" && (
              <motion.div
                key="intelligence"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FeatureCard
                    icon={<BookOpen size={24} />}
                    title="Identity and Flow"
                    subtitle="Repo Intelligence"
                    description="Bob maps how authentication flows through your middleware and services."
                    color="bg-brand-yellow"
                  />
                  <FeatureCard
                    icon={<Layers size={24} />}
                    title="Context Graph"
                    subtitle="Service Mapping"
                    description="Bob identified 12 interconnected microservices and 4 critical data paths."
                    color="bg-brand-teal"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Repo Composition */}
                  <div className="bg-white dark:bg-brand-dark-card border-brutal rounded-brutal-lg p-6 shadow-brutal flex flex-col gap-4">
                    <h3 className="text-xl font-black italic flex items-center gap-2 dark:text-white">
                      <PieChartIcon size={20} className="text-brand-pink" />
                      Repo Composition
                    </h3>
                    <div className="h-48 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={REPO_DATA}
                            innerRadius={40}
                            outerRadius={60}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="#1A1A1A"
                            strokeWidth={2}
                          >
                            {REPO_DATA.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#1A1A1A",
                              border: "none",
                              borderRadius: "8px",
                              color: "white",
                              fontWeight: "900",
                              fontSize: "10px",
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {REPO_DATA.map((item) => (
                        <div key={item.name} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider dark:text-white/80">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                          {item.name}: {item.value}%
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Strategic ROI */}
                  <div className="bg-white dark:bg-brand-dark-card border-brutal rounded-brutal-lg p-6 shadow-brutal flex flex-col gap-4">
                    <h3 className="text-xl font-black italic flex items-center gap-2 dark:text-white">
                      <Zap size={20} className="text-brand-yellow" />
                      Strategic ROI
                    </h3>
                    <button
                      onClick={handleExportReport}
                      className="p-1.5 bg-brand-indigo text-white rounded-lg border border-brand-black dark:border-white shadow-sm hover:scale-110 active:scale-95 transition-all flex items-center justify-center gap-2 group"
                    >
                      <Download size={14} className="group-hover:animate-bounce" />
                      <span className="text-[10px] font-black uppercase">Export Report</span>
                    </button>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-brand-indigo/5 dark:bg-brand-indigo/20 p-4 rounded-xl border border-brand-indigo/20">
                        <p className="text-[10px] font-black uppercase text-brand-indigo dark:text-brand-teal opacity-60">Estimated Savings</p>
                        <p className="text-2xl font-black text-brand-indigo dark:text-brand-teal">$14.2k</p>
                      </div>
                      <div className="bg-brand-pink/5 dark:bg-brand-pink/20 p-4 rounded-xl border border-brand-pink/20">
                        <p className="text-[10px] font-black uppercase text-brand-pink opacity-60">Risk Mitigation</p>
                        <p className="text-2xl font-black text-brand-pink">86%</p>
                      </div>
                    </div>
                    <div className="text-center pt-2">
                      <div className="text-4xl font-black text-brand-indigo dark:text-white">+48h</div>
                      <p className="text-[10px] font-black uppercase text-brand-indigo/60 dark:text-brand-teal/60 tracking-widest">
                        Dev Time Reclaimed / Sprint
                      </p>
                    </div>
                  </div>
                </div>

                {/* Complexity Bar Chart */}
                <div className="bg-white dark:bg-brand-dark-card border-brutal rounded-brutal-lg p-6 shadow-brutal flex flex-col gap-4">
                  <h3 className="text-xl font-black italic flex items-center gap-2 dark:text-white">
                    <TrendingUp size={20} className="text-brand-indigo" />
                    Module Complexity
                  </h3>
                  <div className="h-40 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={COMPLEXITY_DATA} barSize={28}>
                        <XAxis dataKey="module" tick={{ fontSize: 10, fontWeight: 900, fill: "#888" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: "#888" }} axisLine={false} tickLine={false} domain={[0, 100]} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1A1A1A",
                            border: "none",
                            borderRadius: "8px",
                            color: "white",
                            fontWeight: "900",
                            fontSize: "10px",
                          }}
                        />
                        <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                          {COMPLEXITY_DATA.map((entry, index) => (
                            <Cell
                              key={index}
                              fill={entry.score >= 70 ? "#D12771" : entry.score >= 50 ? "#0F62FE" : "#11D3BC"}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Architectural Discovery */}
                <div className="bg-brand-indigo p-8 rounded-brutal-lg border-brutal dark:border-white shadow-brutal text-white">
                  <h3 className="text-2xl font-black italic mb-6 flex items-center gap-3">
                    <ShieldCheck size={28} />
                    Architectural Discovery
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {ARCHITECTURE.map((item, i) => (
                      <div key={i} className="p-4 bg-white/10 rounded-brutal border border-white/20 flex flex-col">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[10px] font-black uppercase text-white/60">{item.label}</span>
                          <span className="text-[8px] font-black uppercase bg-brand-teal text-brand-black px-1.5 py-0.5 rounded shadow-sm">
                            {item.status}
                          </span>
                        </div>
                        <span className="text-sm font-black">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Repo Explorer */}
                <div className="bg-white dark:bg-brand-dark-card border-brutal rounded-brutal-lg p-8 shadow-brutal flex flex-col gap-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-black italic flex items-center gap-3 dark:text-white">
                      <FileCode2 className="text-brand-indigo" size={28} />
                      Repo Consciousness
                    </h3>
                    <span className="text-[10px] font-black text-brand-indigo/60 dark:text-brand-teal uppercase">
                      Click a file for deep focus
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {FILES.map((file) => (
                      <motion.button
                        key={file.name}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => selectFile(file.name)}
                        className={`p-4 rounded-xl border-2 border-brand-black dark:border-white shadow-sm flex flex-col items-center gap-2 transition-all ${
                          selectedFile === file.name
                            ? "bg-brand-indigo text-white"
                            : "bg-white dark:bg-brand-dark-bg hover:bg-brand-bg dark:hover:bg-white/5"
                        }`}
                      >
                        <FileCode2 size={24} className={selectedFile === file.name ? "text-white" : "text-brand-indigo"} />
                        <span className={`text-[10px] font-black uppercase truncate w-full text-center ${selectedFile === file.name ? "text-white" : "dark:text-white"}`}>
                          {file.name}
                        </span>
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border border-current ${
                          file.complexity === "High" ? "border-brand-pink text-brand-pink" : "border-brand-teal text-brand-teal"
                        }`}>
                          {file.complexity}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "automation" && (
              <motion.div
                key="automation"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FeatureCard
                    icon={<Zap size={24} />}
                    title="Test Generator"
                    subtitle="Contextual Automation"
                    description="Instantly generate Jest/Vitest tests for the 14 uncovered modules found."
                    color="bg-brand-pink"
                    darkOnHover
                  />
                  <FeatureCard
                    icon={<Sparkles size={24} />}
                    title="Multi-step Work"
                    subtitle="Complex Pipelines"
                    description="Deploy a staging environment with mock data populated for testing."
                    color="bg-brand-indigo"
                    darkOnHover
                  />
                </div>

                <div className="bg-white dark:bg-brand-dark-card border-brutal rounded-brutal-lg p-8 shadow-brutal flex flex-col gap-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-black italic flex items-center gap-3 dark:text-white">
                      <Wand2 className="text-brand-pink" size={28} />
                      Automation Lab
                    </h3>
                    <button className="bg-brand-black dark:bg-white dark:text-brand-black text-white px-4 py-2 rounded-full text-xs font-black uppercase hover:scale-105 transition-transform">
                      New Strategy
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ActionItem icon={<FileCode2 size={20} />} title="Generate Docs" desc="Create README for all submodules" tag="Documentation"
                      onClick={() => launchWorkflow("Generating Docs", <FileCode2 size={16} />)} />
                    <ActionItem icon={<ShieldCheck size={20} />} title="Security Patch" desc="Update vulnerable dependencies" tag="Safety"
                      onClick={() => launchWorkflow("Security Patching", <ShieldCheck size={16} />)} />
                    <ActionItem icon={<GitBranch size={20} />} title="Refactor Props" desc="Convert interfaces to types" tag="Refactoring"
                      onClick={() => launchWorkflow("Refactoring Types", <GitBranch size={16} />)} />
                    <ActionItem icon={<Settings size={20} />} title="CI/CD Config" desc="Generate GitHub Action workflows" tag="DevOps"
                      onClick={() => launchWorkflow("Configuring CI/CD", <Settings size={16} />)} />
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "explainer" && (
              <motion.div
                key="explainer"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white dark:bg-brand-dark-card border-brutal rounded-brutal-lg p-8 shadow-brutal flex flex-col gap-6"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-black italic flex items-center gap-3 dark:text-white">
                    <MessageSquareCode className="text-brand-indigo" size={28} />
                    Bob's Logic Explainer
                  </h3>
                  <div className="flex items-center gap-2 text-xs font-black text-brand-indigo/60 dark:text-brand-teal uppercase tracking-widest">
                    <div className="w-2 h-2 bg-brand-teal rounded-full animate-pulse" />
                    Repo Context: Active
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {loading ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="bg-brand-bg dark:bg-brand-dark-bg rounded-brutal p-12 border-2 border-dashed border-brand-black/20 dark:border-white/20 flex flex-col items-center justify-center gap-4"
                    >
                      <Loader2 className="animate-spin text-brand-pink" size={48} />
                      <p className="font-bold text-sm uppercase tracking-widest text-brand-indigo/60 dark:text-brand-teal">
                        Bob is reading the repo...
                      </p>
                    </motion.div>
                  ) : insight ? (
                    <motion.div
                      key="insight"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-brand-bg dark:bg-brand-dark-bg rounded-brutal p-6 border-2 border-dashed border-brand-black/20 dark:border-white/20 font-mono text-sm space-y-4"
                    >
                      <div className="flex justify-between items-start flex-wrap gap-2">
                        <p className="text-brand-indigo dark:text-brand-teal font-bold italic">Bob says:</p>
                        <div className="flex gap-2">
                          {insight.category && (
                            <span className="bg-brand-indigo/10 text-brand-indigo dark:text-brand-teal text-[9px] font-black uppercase px-2 py-1 rounded border border-brand-indigo/20">
                              {insight.category}
                            </span>
                          )}
                          {insight.impact && (
                            <span className="bg-brand-teal text-brand-black text-[9px] font-black uppercase px-2 py-1 rounded border border-brand-black shadow-sm">
                              {insight.impact}
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="leading-relaxed text-brand-black dark:text-white/80 font-medium">
                        "{insight.explanation}"
                      </p>
                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-brand-indigo/40 dark:text-white/40 uppercase">
                          Actionable Suggestions:
                        </p>
                        <div className="flex flex-col gap-2">
                          {insight.suggestions.map((s, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <CheckCircle2 size={14} className="text-brand-teal mt-0.5 shrink-0" />
                              <span className="text-[11px] font-bold dark:text-white/80">{s}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={() => launchWorkflow("Applying Transformation", <Sparkles size={16} />)}
                        className="w-full mt-4 bg-brand-indigo text-white p-3 rounded-xl border-2 border-brand-black dark:border-white shadow-brutal font-black uppercase text-xs hover:bg-brand-pink transition-colors flex items-center justify-center gap-2"
                      >
                        <Wand2 size={16} />
                        Apply Automated Refactor
                      </button>
                    </motion.div>
                  ) : (
                    <div className="bg-brand-bg dark:bg-brand-dark-bg rounded-brutal p-6 border-2 border-dashed border-brand-black/20 dark:border-white/20 font-mono text-sm">
                      <p className="text-brand-black/40 dark:text-white/40 italic">
                        Select a file from Intelligence tab, or type a question below.
                      </p>
                    </div>
                  )}
                </AnimatePresence>

                {/* Query Input */}
                <div className="relative">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleAskBob(); }}
                    placeholder="Ask Bob about any module, logic, or transformation..."
                    className="w-full bg-brand-bg dark:bg-brand-dark-bg p-4 pr-14 rounded-full border-2 border-brand-black dark:border-white font-bold focus:outline-none focus:ring-4 focus:ring-brand-pink/20 transition-all dark:text-white"
                  />
                  <button
                    onClick={() => handleAskBob()}
                    disabled={loading || !query.trim()}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-brand-pink text-white rounded-full shadow-sm hover:scale-110 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all"
                  >
                    {loading ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
                  </button>
                </div>

                <div className="flex flex-wrap gap-3">
                  {["Explain auth flow", "Find performance bottlenecks", "Map external APIs", "Review API client resilience"].map((q, i) => (
                    <button
                      key={i}
                      onClick={() => { setQuery(q); handleAskBob(q); }}
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

        {/* Right Sidebar */}
        <aside className="lg:col-span-4 flex flex-col gap-8">
          <div className="bg-brand-pink/5 dark:bg-brand-pink/10 border-brutal rounded-brutal-lg p-8 flex flex-col gap-8 shadow-brutal">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black uppercase italic flex items-center gap-2 dark:text-white">
                <ActivityIcon size={24} />
                Live Pulse
              </h2>
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
            </div>

            <div className="flex flex-col gap-6">
              {/* Active Discoveries */}
              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase text-brand-indigo dark:text-brand-teal tracking-widest">
                  Active Discoveries
                </p>
                <div className="space-y-3">
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="p-3 bg-brand-black dark:bg-brand-indigo rounded-xl border border-white/10 shadow-sm"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[9px] font-black text-brand-teal uppercase">Architectural Drift</span>
                      <span className="text-[8px] text-white/40 uppercase">2m ago</span>
                    </div>
                    <p className="text-[11px] text-white font-medium leading-tight">
                      Legacy fetch pattern detected in /services/old-api vs new Axios standard.
                    </p>
                  </motion.div>
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="p-3 bg-brand-pink/10 dark:bg-brand-pink/20 rounded-xl border border-brand-pink/30 shadow-sm"
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
              </div>

              {/* Cognitive Depth */}
              <div className="bg-brand-black dark:bg-brand-dark-card border-2 border-brutal-white rounded-2xl p-4 shadow-brutal transition-all hover:scale-[1.02]">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-2 h-2 bg-brand-teal rounded-full animate-pulse" />
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">Bob Cognitive Depth</span>
                </div>
                <div className="h-6 bg-white/10 rounded-full border border-white/20 overflow-hidden relative">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "94%" }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="h-full bg-brand-teal shadow-[0_0_15px_rgba(17,211,188,0.6)]"
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-brand-black">
                    94.8% REPO INDEXED
                  </span>
                </div>
              </div>

              {/* Active Workflows */}
              {activeWorkflows.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-brand-black/10">
                  <p className="text-[10px] font-black uppercase text-brand-pink tracking-widest">Active Automation</p>
                  <AnimatePresence>
                    {activeWorkflows.slice(0, 5).map((workflow) => (
                      <motion.div
                        key={workflow.id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <TaskItem label={workflow.label} progress={workflow.progress} icon={workflow.icon} done={workflow.done} />
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
                  {recommendations.map((rec) => (
                    <motion.div
                      key={rec.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <RecommendationItem
                        message={rec.message}
                        time={rec.time}
                        onFix={rec.action ? () => launchWorkflow(`Fixing: ${rec.action!.type}`, rec.action!.icon) : undefined}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* CTA Card */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-brand-indigo p-8 rounded-brutal border-brutal shadow-brutal text-white flex flex-col gap-4 overflow-hidden relative cursor-pointer"
            onClick={() => setActiveTab("explainer")}
          >
            <div className="absolute top-0 right-0 p-4 opacity-20">
              <Sparkles size={64} />
            </div>
            <h4 className="text-2xl font-black italic">
              Turn idea
              <br />
              into impact.
            </h4>
            <p className="text-xs font-bold text-white/70 uppercase tracking-widest leading-relaxed">
              Use Bob to automate the tasks that slow you down.
            </p>
            <button className="bg-white text-brand-indigo px-4 py-2 rounded-full font-black text-xs uppercase self-start shadow-sm hover:bg-brand-yellow hover:text-brand-black transition-colors">
              Start with Bob
            </button>
          </motion.div>
        </aside>
      </main>

      {/* Footer Status Bar */}
      <footer className="h-12 px-6 md:px-10 bg-brand-black text-white flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] sticky bottom-0">
        <div className="flex gap-4 md:gap-8 overflow-hidden whitespace-nowrap">
          <span className="opacity-60">IBM Bob Core v2.1</span>
          <span className="text-brand-teal flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-brand-teal rounded-full animate-ping" />
            Sync: Stable
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

// Sub-components

function FeatureCard({
  icon, title, subtitle, description, color, darkOnHover = false,
}: {
  icon: ReactNode; title: string; subtitle: string; description: string; color: string; darkOnHover?: boolean;
}) {
  return (
    <motion.div
      whileHover={{ y: -4, x: -4 }}
      className={`bg-white dark:bg-brand-dark-card p-6 rounded-brutal border-brutal shadow-brutal transition-colors group cursor-pointer ${
        darkOnHover ? "hover:bg-brand-pink hover:text-white dark:hover:bg-brand-pink" : `hover:${color}`
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

function TaskItem({
  label, progress, icon, done,
}: {
  label: string; progress: number; icon: ReactNode; done?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2 mb-3">
      <div className="flex items-center justify-between text-xs font-black uppercase italic tracking-tighter dark:text-white/80">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-brand-black/5 dark:bg-white/5 rounded-lg border border-brand-black/10 dark:border-white/10">
            {icon}
          </div>
          <span className="truncate max-w-[120px]">{label}</span>
        </div>
        <span className={done ? "text-brand-teal" : ""}>{done ? "Done" : `${progress}%`}</span>
      </div>
      <div className="h-4 bg-brand-black/10 dark:bg-white/5 rounded-full border-2 border-brand-black dark:border-white overflow-hidden p-0.5 shadow-inner">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={`h-full rounded-full border border-black/10 dark:border-white/20 ${done ? "bg-brand-teal" : "bg-brand-pink"}`}
        />
      </div>
    </div>
  );
}

function RecommendationItem({
  message, time, onFix,
}: {
  message: string; time: string; onFix?: () => void;
}) {
  return (
    <div className="flex gap-3 group relative">
      <div className="w-8 h-8 bg-brand-indigo rounded-lg flex items-center justify-center border border-brand-black dark:border-white shadow-sm shrink-0">
        <span className="text-[10px] text-white font-black">B</span>
      </div>
      <div className="flex flex-col flex-1 pr-8">
        <p className="text-xs font-bold leading-tight text-brand-pink">{message}</p>
        <span className="text-[9px] font-black opacity-40 dark:opacity-60 uppercase mt-0.5">{time}</span>
      </div>
      {onFix && (
        <button
          onClick={onFix}
          className="absolute right-0 top-0 p-1.5 bg-brand-teal text-brand-black rounded-lg border border-brand-black dark:border-white shadow-sm hover:scale-110 active:scale-95 transition-all opacity-0 group-hover:opacity-100"
          title="Auto-fix"
        >
          <Zap size={10} fill="currentColor" />
        </button>
      )}
    </div>
  );
}

function ActionItem({
  icon, title, desc, tag, onClick,
}: {
  icon: ReactNode; title: string; desc: string; tag: string; onClick: () => void;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className="p-4 bg-brand-bg dark:bg-brand-black/40 rounded-brutal border-2 border-brand-black dark:border-white/40 group cursor-pointer hover:bg-white dark:hover:bg-brand-indigo/20 transition-colors"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="p-2 bg-white dark:bg-brand-dark-bg rounded-lg border border-brand-black dark:border-white/20 group-hover:bg-brand-indigo group-hover:text-white transition-colors">
          {icon}
        </div>
        <span className="text-[8px] font-black uppercase tracking-widest bg-brand-teal text-brand-black px-2 py-0.5 rounded-full border border-brand-black dark:border-white/20">
          {tag}
        </span>
      </div>
      <h4 className="text-sm font-black mb-1 dark:text-white">{title}</h4>
      <p className="text-[11px] font-bold opacity-60 dark:opacity-50 leading-tight dark:text-white/70">{desc}</p>
    </motion.div>
  );
}
