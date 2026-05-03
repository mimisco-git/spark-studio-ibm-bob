import { motion, AnimatePresence } from "motion/react";
import {
  Activity, Plus, Code2, Cpu, ShieldCheck, MessageSquareCode, Search,
  Sparkles, Loader2, Wand2, FileCode2, GitBranch, Settings, Sun, Moon,
  Download, AlertTriangle, CheckCircle2, TrendingUp, ArrowRight, X, Menu,
  Upload, Github, ListTodo, FolderOpen, Copy, Check, FlaskConical, Shield,
  FileText, GitPullRequest, UserCheck, Gauge, RotateCcw, Play, Eye,
  BarChart3, Zap, ChevronRight, Lock, Terminal, Layers,
} from "lucide-react";
import { useState, useEffect, ReactNode, useCallback, useRef } from "react";
import {
  askBobStream, analyzeBobRepo, analyzeFile, generateSprintPlan,
  fetchGitHubRepo, analyzeGitHubRepo, generateDocumentation, generateTests,
  automateGenerateDocs, automateSecurityAudit, automateRefactor, automateCICD,
  generatePRDescription, generateOnboarding, reviewCode, generateHealthScore,
  BobInsight, BobRepoAnalysis, SprintPlan, GitHubRepoInfo, AutomationResult,
  PRDescription, OnboardingGuide, CodeReviewResult, HealthScore,
  DEMO_CHAT, DEMO_REPO, DEMO_HEALTH,
} from "./services/bobService";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, RadialBarChart, RadialBar,
} from "recharts";

// ─── Static data ─────────────────────────────────────────────────────────────
const REPO_COMPOSITION = [
  { name: "TypeScript", value: 65, color: "#4589ff" },
  { name: "Testing",    value: 15, color: "#a56eff" },
  { name: "Config",     value: 10, color: "#f1c21b" },
  { name: "Docs",       value: 10, color: "#3ddbd9" },
];
const COMPLEXITY = [
  { module: "Auth",  score: 85 },
  { module: "API",   score: 60 },
  { module: "Store", score: 45 },
  { module: "Hooks", score: 55 },
  { module: "UI",    score: 30 },
];
const ARCH = [
  { label: "Auth",       value: "JWT + Redis Cache",         status: "ok"   },
  { label: "Data Flow",  value: "Unidirectional Store Hooks", status: "ok"   },
  { label: "API Layer",  value: "REST + Zod Validation",     status: "ok"   },
  { label: "Deploy",     value: "Docker + Node Express",     status: "warn" },
];
const FILES = [
  { name: "authService.ts", risk: "high" },
  { name: "dataMapper.ts",  risk: "med"  },
  { name: "apiClient.ts",   risk: "med"  },
  { name: "app.tsx",        risk: "low"  },
  { name: "schema.prisma",  risk: "high" },
];
const BOOT = [
  "Connecting to IBM Bob Core",
  "Indexing repository: 2,450 files",
  "Building dependency graph",
  "Mapping architectural patterns",
  "Context engine ready",
];
const TABS = [
  { id: "intelligence", label: "Intelligence", icon: <BarChart3 size={15} /> },
  { id: "explainer",    label: "Explainer",    icon: <MessageSquareCode size={15} /> },
  { id: "tools",        label: "Bob Tools",    icon: <Sparkles size={15} /> },
  { id: "automation",   label: "Automation",   icon: <Wand2 size={15} /> },
  { id: "onboarding",   label: "Onboarding",   icon: <UserCheck size={15} /> },
];

type ChatMsg = { id: string; role: "user"|"bob"; content: string; streaming?: boolean; suggestions?: string[]; impact?: string; category?: string; };
type Recommendation = { id: string; message: string; time: string; };
type Workflow = { id: string; label: string; progress: number; done?: boolean; };
type ExplainerMode = "chat"|"review";

const STORAGE_KEY = "spark_v3";

// ─── App ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [booted,         setBooted]         = useState(false);
  const [bootStep,       setBootStep]       = useState(0);
  const [showLanding,    setShowLanding]    = useState(true);
  const [activeTab,      setActiveTab]      = useState("intelligence");
  const [lightMode,      setLightMode]      = useState(false);
  const [sidebarOpen,    setSidebarOpen]    = useState(false);
  const [demoMode,       setDemoMode]       = useState(false);
  const [copiedId,       setCopiedId]       = useState<string|null>(null);

  // Chat
  const [query,          setQuery]          = useState("");
  const [loading,        setLoading]        = useState(false);
  const [chatHistory,    setChatHistory]    = useState<ChatMsg[]>(() => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)||"[]"); } catch { return []; } });
  const [explainerMode,  setExplainerMode]  = useState<ExplainerMode>("chat");
  const [reviewInput,    setReviewInput]    = useState("");
  const [reviewLoading,  setReviewLoading]  = useState(false);
  const [reviewResult,   setReviewResult]   = useState<CodeReviewResult|null>(null);

  // Repo
  const [repoLoading,    setRepoLoading]    = useState(false);
  const [repoAnalysis,   setRepoAnalysis]   = useState<BobRepoAnalysis|null>(null);
  const [selectedFile,   setSelectedFile]   = useState<string|null>(null);

  // GitHub
  const [showGithub,     setShowGithub]     = useState(false);
  const [githubUrl,      setGithubUrl]      = useState("");
  const [githubLoading,  setGithubLoading]  = useState(false);
  const [githubInfo,     setGithubInfo]     = useState<GitHubRepoInfo|null>(null);
  const [githubError,    setGithubError]    = useState("");

  // Sprint
  const [showSprint,     setShowSprint]     = useState(false);
  const [sprintInput,    setSprintInput]    = useState("");
  const [sprintLoading,  setSprintLoading]  = useState(false);
  const [sprintPlan,     setSprintPlan]     = useState<SprintPlan|null>(null);

  // PR
  const [showPR,         setShowPR]         = useState(false);
  const [prInput,        setPrInput]        = useState("");
  const [prLoading,      setPrLoading]      = useState(false);
  const [prResult,       setPrResult]       = useState<PRDescription|null>(null);

  // Tools
  const [toolsFile,      setToolsFile]      = useState<{name:string;content:string}|null>(null);
  const [toolsMode,      setToolsMode]      = useState<"docs"|"tests">("docs");
  const [toolsOutput,    setToolsOutput]    = useState("");
  const [toolsLoading,   setToolsLoading]   = useState(false);
  const toolsRef = useRef<HTMLInputElement>(null);
  const fileRef  = useRef<HTMLInputElement>(null);

  // Onboarding
  const [onboardingCtx,     setOnboardingCtx]     = useState("");
  const [onboardingLoading,  setOnboardingLoading]  = useState(false);
  const [onboardingGuide,    setOnboardingGuide]    = useState<OnboardingGuide|null>(null);

  // Automation
  const [automationResult,  setAutomationResult]  = useState<AutomationResult|null>(null);
  const [automationLoading, setAutomationLoading] = useState<string|null>(null);

  // Health
  const [healthScore,    setHealthScore]    = useState<HealthScore|null>(null);
  const [healthLoading,  setHealthLoading]  = useState(false);
  const [healthFetched,  setHealthFetched]  = useState(false);

  // Live feed
  const [recs, setRecs] = useState<Recommendation[]>([
    { id:"r1", message:"Circular dependency detected in /src/lib",          time:"now"  },
    { id:"r2", message:"Exporting 'User' type would fix 12 TS errors",      time:"2m"   },
    { id:"r3", message:"Redis connection missing error handler on line 34",  time:"5m"   },
  ]);
  const [workflows, setWorkflows] = useState<Workflow[]>([
    { id:"w1", label:"Automating Docs",    progress:64 },
    { id:"w2", label:"Mapping Data Flow",  progress:82 },
  ]);

  const wfIntervals = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());
  const chatEndRef  = useRef<HTMLDivElement>(null);
  const uploadLoading = useRef(false);

  // Boot
  useEffect(() => {
    let s = 0;
    const t = setInterval(() => { s++; setBootStep(s); if (s >= BOOT.length) { clearInterval(t); setTimeout(() => setBooted(true), 500); } }, 500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(chatHistory.slice(-40))); }, [chatHistory]);
  useEffect(() => { document.body.classList.toggle("light", lightMode); }, [lightMode]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior:"smooth" }); }, [chatHistory]);
  useEffect(() => () => { wfIntervals.current.forEach(i => clearInterval(i)); }, []);

  // Live recs feed
  useEffect(() => {
    const msgs = [
      "Auth token revocation not propagated to active sessions",
      "HeavyGraph.tsx re-renders on every parent state change",
      "schema.prisma missing index on email and userId columns",
      "API client has no retry logic for transient 5xx errors",
      "Unit test coverage below 20% on critical auth paths",
    ];
    const t = setInterval(() => {
      const msg = msgs[Math.floor(Math.random()*msgs.length)];
      setRecs(prev => [{ id:`r-${Date.now()}`, message:msg, time:"now" }, ...prev.slice(0,4)]);
    }, 14000);
    return () => clearInterval(t);
  }, []);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const copy = (text:string, id:string) => { navigator.clipboard.writeText(text); setCopiedId(id); setTimeout(()=>setCopiedId(null),2000); };

  const launchWorkflow = (label:string) => {
    const id = Math.random().toString(36).slice(2,8);
    setWorkflows(prev => [{id, label, progress:0}, ...prev]);
    const interval = setInterval(() => {
      setWorkflows(prev => prev.map(w => {
        if (w.id !== id) return w;
        const next = Math.min(w.progress + Math.floor(Math.random()*16)+6, 100);
        if (next >= 100) { clearInterval(interval); wfIntervals.current.delete(id); return {...w, progress:100, done:true}; }
        return {...w, progress:next};
      }));
    }, 900);
    wfIntervals.current.set(id, interval);
  };

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleAsk = useCallback(async (override?:string, codeCtx?:string) => {
    const q = (override ?? query).trim();
    if (!q) return;
    const uid = `u-${Date.now()}`, bid = `b-${Date.now()}`;
    setChatHistory(prev => [...prev, { id:uid, role:"user", content:q }, { id:bid, role:"bob", content:"", streaming:true }]);
    setQuery(""); setLoading(true);
    if (demoMode) {
      await new Promise(r=>setTimeout(r,900));
      setChatHistory(prev=>prev.map(m=>m.id===bid?{...m,...DEMO_CHAT,streaming:false}:m));
      setLoading(false); return;
    }
    const ctx = codeCtx ? `Code:\n${codeCtx}` : selectedFile ? `File: ${selectedFile}` : undefined;
    const result = await askBobStream(q, t => setChatHistory(prev=>prev.map(m=>m.id===bid?{...m,content:t}:m)), ctx);
    setChatHistory(prev=>prev.map(m=>m.id===bid?{...m,...result,streaming:false}:m));
    setLoading(false);
  }, [query, selectedFile, demoMode]);

  const handleFileUpload = async (e:React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    uploadLoading.current = true;
    const content = await file.text();
    const uid = `u-${Date.now()}`, bid = `b-${Date.now()}`;
    setChatHistory(prev=>[...prev,{id:uid,role:"user",content:`Analyze: ${file.name}`},{id:bid,role:"bob",content:"",streaming:true}]);
    setActiveTab("explainer");
    const result = await analyzeFile(file.name, content);
    setChatHistory(prev=>prev.map(m=>m.id===bid?{...m,...result,streaming:false}:m));
    uploadLoading.current = false;
    if (e.target) e.target.value = "";
  };

  const handleToolsUpload = async (e:React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setToolsFile({name:file.name, content:await file.text()});
    setToolsOutput("");
    if (e.target) e.target.value = "";
  };

  const handleRunTool = async () => {
    if (!toolsFile) return;
    setToolsLoading(true); setToolsOutput("");
    const out = toolsMode==="docs" ? await generateDocumentation(toolsFile.name, toolsFile.content) : await generateTests(toolsFile.name, toolsFile.content);
    setToolsOutput(out); setToolsLoading(false);
  };

  const handleGithub = async () => {
    if (!githubUrl.trim()) return;
    setGithubLoading(true); setGithubError(""); setGithubInfo(null);
    try {
      const info = await fetchGitHubRepo(githubUrl);
      setGithubInfo(info);
      const analysis = await analyzeGitHubRepo(info);
      setRepoAnalysis(analysis);
      setChatHistory(prev=>[...prev,
        {id:`u-${Date.now()}`,role:"user",content:`Analyze repo: ${githubUrl}`},
        {id:`b-${Date.now()}`,role:"bob",content:analysis.summary,suggestions:analysis.hotspots,impact:`${analysis.risk} Risk`,category:"Architecture"},
      ]);
      setActiveTab("explainer"); setShowGithub(false); setHealthFetched(false);
    } catch (err) { setGithubError(err instanceof Error ? err.message : "Could not fetch repo"); }
    setGithubLoading(false);
  };

  const handleRepoAnalyze = async () => {
    setRepoLoading(true);
    if (demoMode) { await new Promise(r=>setTimeout(r,900)); setRepoAnalysis(DEMO_REPO); setRepoLoading(false); return; }
    const r = await analyzeBobRepo(); setRepoAnalysis(r); setRepoLoading(false);
  };

  const handleSprint = async () => {
    if (!sprintInput.trim()) return;
    setSprintLoading(true);
    const plan = await generateSprintPlan(sprintInput);
    setSprintPlan(plan); setSprintLoading(false);
  };

  const handlePR = async () => {
    if (!prInput.trim()) return;
    setPrLoading(true);
    const result = await generatePRDescription(prInput);
    setPrResult(result); setPrLoading(false);
  };

  const handleOnboarding = async () => {
    setOnboardingLoading(true);
    const ctx = githubInfo
      ? `Repo: ${githubInfo.name}\nLanguage: ${githubInfo.language}\nFiles: ${githubInfo.files.slice(0,30).join(", ")}\nDescription: ${githubInfo.description}`
      : onboardingCtx || "TypeScript React app, Express backend, 2,450 files, JWT auth, Redis, Prisma ORM";
    const guide = await generateOnboarding(ctx);
    setOnboardingGuide(guide); setOnboardingLoading(false);
  };

  const handleCodeReview = async () => {
    if (!reviewInput.trim()) return;
    setReviewLoading(true);
    const result = await reviewCode(reviewInput);
    setReviewResult(result); setReviewLoading(false);
  };

  const handleHealthScore = async () => {
    if (healthFetched) return;
    setHealthLoading(true);
    const ctx = githubInfo ? `Repo: ${githubInfo.name}\nLanguage: ${githubInfo.language}\nFiles: ${githubInfo.files.join(", ")}` : "TypeScript React app, 18% test coverage";
    if (demoMode) { await new Promise(r=>setTimeout(r,800)); setHealthScore(DEMO_HEALTH); setHealthLoading(false); setHealthFetched(true); return; }
    const score = await generateHealthScore(ctx);
    setHealthScore(score); setHealthLoading(false); setHealthFetched(true);
  };

  const handleAutomation = async (type:"docs"|"security"|"refactor"|"cicd", label:string) => {
    setAutomationLoading(type); setAutomationResult(null);
    const ctx = githubInfo
      ? `Repo: ${githubInfo.name}\nLanguage: ${githubInfo.language}\nFiles: ${githubInfo.files.slice(0,20).join(", ")}`
      : "TypeScript React app with 2,450 files, Express backend, Prisma ORM, Redis sessions";
    let result: AutomationResult;
    if (type==="docs")     result = await automateGenerateDocs(ctx);
    else if (type==="security") result = await automateSecurityAudit(ctx);
    else if (type==="refactor") result = await automateRefactor(ctx);
    else                    result = await automateCICD(ctx);
    setAutomationResult(result); setAutomationLoading(null); launchWorkflow(label);
  };

  const handleExport = () => {
    const data = { tool:"Spark.Studio powered by IBM Bob", generated:new Date().toISOString(), repoAnalysis, healthScore, sprintPlan, chatHistory:chatHistory.map(m=>({role:m.role,content:m.content})) };
    const url = URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:"application/json"}));
    const a = document.createElement("a"); a.href=url; a.download=`bob-report-${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  const stats = { files: githubInfo?.files.length ?? 2450, lang: githubInfo?.language ?? "TypeScript" };

  // ── Boot screen ────────────────────────────────────────────────────────────
  if (!booted) return (
    <div className="min-h-screen surface-0 flex flex-col items-center justify-center gap-10">
      <div className="dot-bg absolute inset-0 opacity-60" />
      <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="relative flex flex-col items-center gap-8">
        <div className="w-20 h-20 rounded-2xl gradient-blue flex items-center justify-center glow-blue">
          <span className="text-white font-bold text-4xl tracking-tight">B</span>
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary tracking-tight">Spark.Studio</h1>
          <p className="text-muted text-sm mt-1">Powered by IBM Bob</p>
        </div>
        <div className="w-72 space-y-2.5">
          {BOOT.map((step,i) => (
            <motion.div key={i} initial={{opacity:0}} animate={{opacity: i<bootStep?1:0.2}} className="flex items-center gap-3">
              <div className={`w-1.5 h-1.5 rounded-full shrink-0 transition-colors ${i<bootStep?"bg-acc-teal":"bg-ink-500"}`} />
              <span className={`text-xs font-mono transition-colors ${i<bootStep?"text-acc-teal":"text-dimmed"}`}>{step}</span>
              {i<bootStep && i===bootStep-1 && <span className="text-[10px] text-acc-teal ml-auto">done</span>}
            </motion.div>
          ))}
        </div>
        <div className="w-72 h-px bg-ink-600 overflow-hidden rounded-full">
          <motion.div animate={{width:`${(bootStep/BOOT.length)*100}%`}} className="h-full bg-acc-teal" transition={{duration:0.4}} />
        </div>
      </motion.div>
    </div>
  );

  // ── Landing ────────────────────────────────────────────────────────────────
  if (showLanding) return (
    <div className="min-h-screen surface-0 flex flex-col overflow-hidden">
      <div className="grid-bg absolute inset-0 opacity-70" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-ibm-blue/5 rounded-full blur-[120px]" />

      <nav className="relative z-10 h-16 px-8 flex items-center justify-between border-b border-subtle">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg gradient-blue flex items-center justify-center">
            <span className="text-white font-bold text-lg">B</span>
          </div>
          <div>
            <span className="font-semibold text-primary text-sm tracking-tight">Spark.Studio</span>
            <span className="text-dimmed text-xs ml-2">by IBM Bob</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="chip bg-acc-teal/10 text-acc-teal border border-acc-teal/20">IBM Bob Hackathon 2026</span>
          <button onClick={()=>setDemoMode(true)} className="text-xs text-muted hover:text-primary transition-colors border border-subtle px-3 py-1.5 rounded-lg hover:border-strong">Try Demo</button>
          <motion.button whileHover={{scale:1.03}} whileTap={{scale:0.97}} onClick={()=>setShowLanding(false)}
            className="bg-ibm-blue text-white px-5 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-all"
          >Launch App</motion.button>
        </div>
      </nav>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-20 gap-16 max-w-5xl mx-auto w-full">
        <motion.div initial={{opacity:0,y:30}} animate={{opacity:1,y:0}} className="text-center space-y-6 max-w-3xl">
          <div className="inline-flex items-center gap-2 chip bg-ibm-blue/10 text-acc-blue border border-ibm-blue/20 mb-4">
            <span className="w-1.5 h-1.5 bg-acc-blue rounded-full pulse-slow" /> Bob Online — {stats.files.toLocaleString()} files indexed
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-tight text-primary">
            Your Repo. Your Rules.<br />
            <span className="text-gradient-blue">AI as your Dev Partner.</span>
          </h1>
          <p className="text-lg text-muted max-w-xl mx-auto leading-relaxed">
            IBM Bob indexes your entire codebase and helps you understand, document, test, and modernize it — in seconds.
          </p>
        </motion.div>

        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.15}} className="grid grid-cols-2 md:grid-cols-3 gap-3 w-full max-w-3xl">
          {[
            { icon:<MessageSquareCode size={18}/>, label:"Logic Explainer",   desc:"Ask Bob anything about your code",     tab:"explainer",    accent:"ibm-blue" },
            { icon:<FileText size={18}/>,          label:"Doc Generator",     desc:"Production-quality markdown docs",     tab:"tools",        accent:"ibm-teal" },
            { icon:<FlaskConical size={18}/>,      label:"Test Synthesizer",  desc:"Complete Vitest suites from real code", tab:"tools",        accent:"ibm-purple" },
            { icon:<GitPullRequest size={18}/>,    label:"PR Description",    desc:"Professional PRs from your changes",    tab:"tools",        accent:"ibm-blue" },
            { icon:<UserCheck size={18}/>,         label:"Onboarding Guide",  desc:"Get new devs up to speed fast",         tab:"onboarding",   accent:"ibm-green" },
            { icon:<Shield size={18}/>,            label:"Security Audit",    desc:"Find vulnerabilities with specific fixes",tab:"automation",  accent:"ibm-red" },
          ].map((f,i)=>(
            <motion.button key={i} initial={{opacity:0,y:15}} animate={{opacity:1,y:0}} transition={{delay:0.2+i*0.07}}
              onClick={()=>{setShowLanding(false);setActiveTab(f.tab);}}
              className="panel-interactive p-5 text-left group"
            >
              <div className={`w-9 h-9 rounded-lg bg-${f.accent}/10 border border-${f.accent}/20 flex items-center justify-center mb-3 text-acc-blue group-hover:scale-105 transition-transform`}
                style={{color:`var(--color-${f.accent.replace("ibm-","ibm-")})`}}>
                {f.icon}
              </div>
              <div className="font-semibold text-sm text-primary mb-1">{f.label}</div>
              <div className="text-xs text-muted leading-relaxed">{f.desc}</div>
            </motion.button>
          ))}
        </motion.div>

        <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.4}} className="flex flex-wrap gap-4 justify-center">
          <motion.button whileHover={{scale:1.04}} whileTap={{scale:0.96}} onClick={()=>setShowLanding(false)}
            className="bg-ibm-blue text-white px-8 py-3.5 rounded-xl font-semibold flex items-center gap-2.5 hover:opacity-90 transition-all glow-blue"
          >
            <Cpu size={18}/> Start with Bob
          </motion.button>
          <motion.button whileHover={{scale:1.04}} onClick={()=>{setShowLanding(false);setShowGithub(true);}}
            className="panel border-default text-secondary px-8 py-3.5 rounded-xl font-medium flex items-center gap-2.5 hover:border-strong hover:text-primary transition-all"
          >
            <Github size={18}/> Connect GitHub Repo
          </motion.button>
        </motion.div>

        <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.5}} className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full max-w-3xl">
          {[
            { v:"2,450",  l:"Files Indexed",      c:"text-acc-blue"   },
            { v:"+48h",   l:"Dev Time / Sprint",  c:"text-acc-teal"   },
            { v:"86%",    l:"Risk Mitigation",    c:"text-acc-purple" },
            { v:"$14.2k", l:"Estimated Savings",  c:"text-acc-green"  },
          ].map((s,i)=>(
            <div key={i} className="panel p-4">
              <div className={`text-2xl font-bold ${s.c}`}>{s.v}</div>
              <div className="text-[11px] text-muted mt-0.5">{s.l}</div>
            </div>
          ))}
        </motion.div>
      </main>
    </div>
  );

  // ── Dashboard ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen surface-0 flex flex-col text-sm">
      <input ref={fileRef}   type="file" className="hidden" onChange={handleFileUpload} accept=".ts,.tsx,.js,.jsx,.py,.go,.rs,.java,.cs,.cpp,.c,.json,.yaml,.yml,.md,.prisma,.sql" />
      <input ref={toolsRef}  type="file" className="hidden" onChange={handleToolsUpload} accept=".ts,.tsx,.js,.jsx,.py,.go,.rs,.java,.cs,.cpp,.c,.json,.yaml,.yml,.md,.prisma,.sql" />

      {/* Modals */}
      <AnimatePresence>
        {showGithub && <Overlay onClose={()=>{setShowGithub(false);setGithubError("");}} title="Connect GitHub Repository" icon={<Github size={18}/>}>
          <p className="text-xs text-muted mb-4">Paste any public GitHub repo. Bob fetches the real file tree and gives a live architectural assessment.</p>
          <input value={githubUrl} onChange={e=>setGithubUrl(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")handleGithub();}}
            placeholder="https://github.com/owner/repo"
            className="w-full surface-3 border border-subtle text-primary font-mono text-sm px-4 py-3 rounded-xl focus:outline-none focus:border-acc-blue transition-colors placeholder:text-dimmed"
          />
          {githubError && <p className="text-xs text-acc-red mt-2">{githubError}</p>}
          {githubInfo && <div className="mt-3 p-3 surface-4 rounded-lg border border-subtle">
            <p className="font-semibold text-primary text-sm">{githubInfo.name}</p>
            <p className="text-xs text-muted mt-0.5">{githubInfo.description}</p>
            <div className="flex gap-3 mt-2 text-[10px] font-medium uppercase tracking-wide">
              <span className="text-acc-blue">{githubInfo.language}</span>
              <span className="text-acc-teal">{githubInfo.stars} stars</span>
              <span className="text-acc-purple">{githubInfo.files.length} files</span>
            </div>
          </div>}
          <motion.button whileHover={{scale:1.02}} onClick={handleGithub} disabled={githubLoading||!githubUrl.trim()}
            className="w-full mt-4 bg-ibm-blue text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50 hover:opacity-90 transition-all"
          >
            {githubLoading?<><Loader2 size={16} className="animate-spin"/>Connecting...</>:<><Github size={16}/>Analyze with Bob</>}
          </motion.button>
        </Overlay>}

        {showSprint && <Overlay onClose={()=>setShowSprint(false)} title="Sprint Planner" icon={<ListTodo size={18}/>} wide>
          {!sprintPlan ? <>
            <p className="text-xs text-muted mb-4">Paste your backlog or task list. Bob prioritizes by ROI, risk, and effort.</p>
            <textarea value={sprintInput} onChange={e=>setSprintInput(e.target.value)} rows={8} placeholder={"- Fix auth token expiry\n- Add tests for API client\n- Refactor dataMapper.ts\n- Set up CI/CD pipeline"}
              className="w-full surface-3 border border-subtle text-primary font-mono text-xs px-4 py-3 rounded-xl resize-none focus:outline-none focus:border-acc-blue transition-colors placeholder:text-dimmed"
            />
            <motion.button whileHover={{scale:1.02}} onClick={handleSprint} disabled={sprintLoading||!sprintInput.trim()}
              className="w-full mt-4 bg-ibm-purple text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50 hover:opacity-90 transition-all"
            >
              {sprintLoading?<><Loader2 size={16} className="animate-spin"/>Planning sprint...</>:<><Wand2 size={16}/>Generate Sprint Plan</>}
            </motion.button>
          </> : <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="p-4 bg-ibm-blue/10 border border-ibm-blue/20 rounded-xl">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-acc-blue mb-1">Sprint Goal</p>
              <p className="text-sm font-medium text-primary">{sprintPlan.sprintGoal}</p>
            </div>
            <div className="space-y-2">
              {sprintPlan.tasks.map((t,i)=>(
                <div key={i} className="panel-raised p-3 flex gap-3">
                  <div className={`accent-line self-stretch ${t.priority==="Critical"?"bg-acc-red":t.priority==="High"?"bg-acc-purple":t.priority==="Medium"?"bg-acc-amber":"bg-acc-teal"}`} />
                  <div className="flex-1">
                    <div className="flex justify-between items-start gap-2">
                      <p className="font-medium text-primary text-xs">{t.task}</p>
                      <span className={`chip shrink-0 ${t.priority==="Critical"?"bg-acc-red/10 text-acc-red":t.priority==="High"?"bg-acc-purple/10 text-acc-purple":"bg-acc-amber/10 text-acc-amber"}`}>{t.priority}</span>
                    </div>
                    <p className="text-[10px] text-muted mt-1">{t.roi}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="panel p-3"><p className="text-[10px] text-muted mb-1">Est. Hours</p><p className="text-xl font-bold text-acc-teal">{sprintPlan.totalEstimatedHours}h</p></div>
              <div className="panel p-3"><p className="text-[10px] text-muted mb-1">Expected Impact</p><p className="text-[11px] text-acc-blue leading-tight">{sprintPlan.expectedImpact}</p></div>
            </div>
            <button onClick={()=>{setSprintPlan(null);setSprintInput("");}} className="w-full py-2.5 border border-subtle text-muted text-xs rounded-xl hover:border-strong hover:text-primary transition-all">Plan another sprint</button>
          </div>}
        </Overlay>}

        {showPR && <Overlay onClose={()=>{setShowPR(false);setPrResult(null);setPrInput("");}} title="PR Description Generator" icon={<GitPullRequest size={18}/>} wide>
          {!prResult ? <>
            <p className="text-xs text-muted mb-4">Describe your changes. Bob writes a professional PR with conventional commit title, changelog, and review notes.</p>
            <textarea value={prInput} onChange={e=>setPrInput(e.target.value)} rows={6}
              placeholder={"What did you change and why?\n\n- Added Redis denylist to authService.ts\n- Updated /auth/logout to revoke tokens on sign-out\n- Added 4 unit tests for the revocation flow"}
              className="w-full surface-3 border border-subtle text-primary font-mono text-xs px-4 py-3 rounded-xl resize-none focus:outline-none focus:border-acc-blue transition-colors placeholder:text-dimmed"
            />
            <motion.button whileHover={{scale:1.02}} onClick={handlePR} disabled={prLoading||!prInput.trim()}
              className="w-full mt-4 bg-ibm-blue text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50 hover:opacity-90 transition-all"
            >
              {prLoading?<><Loader2 size={16} className="animate-spin"/>Writing PR...</>:<><GitPullRequest size={16}/>Generate PR Description</>}
            </motion.button>
          </> : <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="p-3 surface-3 border border-subtle rounded-xl flex items-center gap-3">
              <span className={`chip ${prResult.type==="fix"?"bg-acc-red/10 text-acc-red":prResult.type==="feat"?"bg-acc-green/10 text-acc-green":"bg-acc-blue/10 text-acc-blue"}`}>{prResult.type}</span>
              <span className="font-mono text-xs text-primary flex-1">{prResult.title}</span>
              <button onClick={()=>copy(prResult.title,"pr-t")} className="text-muted hover:text-acc-blue transition-colors shrink-0">
                {copiedId==="pr-t"?<Check size={13} className="text-acc-green"/>:<Copy size={13}/>}
              </button>
            </div>
            <div><p className="text-[10px] font-semibold uppercase tracking-widest text-muted mb-2">Summary</p><p className="text-xs text-secondary leading-relaxed">{prResult.summary}</p></div>
            <div><p className="text-[10px] font-semibold uppercase tracking-widest text-muted mb-2">Changes</p>
              {prResult.changes.map((c,i)=><div key={i} className="flex items-start gap-2 mb-1.5"><CheckCircle2 size={11} className="text-acc-green mt-0.5 shrink-0"/><span className="text-xs text-secondary">{c}</span></div>)}
            </div>
            <div><p className="text-[10px] font-semibold uppercase tracking-widest text-muted mb-2">Testing Notes</p><p className="text-xs font-mono surface-3 rounded-lg p-3 text-secondary">{prResult.testingNotes}</p></div>
            <div className="flex gap-3">
              <button onClick={()=>copy(`${prResult.title}\n\n${prResult.summary}\n\n## Changes\n${prResult.changes.map(c=>`- ${c}`).join("\n")}\n\n## Testing\n${prResult.testingNotes}`, "pr-f")}
                className="flex-1 bg-ibm-blue text-white py-2.5 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 hover:opacity-90 transition-all"
              >
                {copiedId==="pr-f"?<><Check size={13}/>Copied!</>:<><Copy size={13}/>Copy Full PR</>}
              </button>
              <button onClick={()=>{setPrResult(null);setPrInput("");}} className="px-4 py-2.5 border border-subtle text-muted rounded-xl text-xs hover:border-strong hover:text-primary transition-all">Again</button>
            </div>
          </div>}
        </Overlay>}

        {automationResult && <Overlay onClose={()=>setAutomationResult(null)} title={automationResult.title} icon={<Sparkles size={18}/>} wide>
          <div className="flex justify-between items-center mb-3">
            <span className="chip bg-acc-teal/10 text-acc-teal border border-acc-teal/20">{automationResult.tag}</span>
            <button onClick={()=>copy(automationResult.output,"auto")} className="text-xs text-muted hover:text-acc-blue transition-colors flex items-center gap-1">
              {copiedId==="auto"?<><Check size={12}/>Copied!</>:<><Copy size={12}/>Copy</>}
            </button>
          </div>
          <div className="surface-3 rounded-xl border border-subtle p-4 max-h-[55vh] overflow-y-auto">
            <pre className="text-xs font-mono text-secondary whitespace-pre-wrap leading-relaxed">{automationResult.output}</pre>
          </div>
        </Overlay>}
      </AnimatePresence>

      {/* Top bar */}
      <header className="h-14 border-b border-subtle px-6 flex items-center gap-4 sticky top-0 z-50 surface-1">
        <button onClick={()=>setShowLanding(true)} className="flex items-center gap-2.5 shrink-0">
          <div className="w-7 h-7 rounded-lg gradient-blue flex items-center justify-center">
            <span className="text-white font-bold text-sm">B</span>
          </div>
          <div className="hidden sm:block">
            <span className="font-semibold text-primary text-sm">Spark.Studio</span>
            <span className="text-dimmed text-xs ml-1.5">IBM Bob</span>
          </div>
        </button>

        <div className="flex-1 flex items-center">
          {/* Tab bar */}
          <nav className="hidden lg:flex items-center gap-1 ml-6">
            {TABS.map(tab=>(
              <button key={tab.id} onClick={()=>setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab===tab.id?"bg-ibm-blue/10 text-acc-blue":"text-muted hover:text-primary hover:bg-surface-3"}`}
                style={activeTab===tab.id?{backgroundColor:"rgba(15,98,254,0.12)"}:{}}
              >
                {tab.icon}{tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 surface-3 rounded-lg border border-subtle text-[11px] text-muted">
            <span className="w-1.5 h-1.5 rounded-full bg-acc-teal pulse-slow" />
            {stats.files.toLocaleString()} {stats.lang} files
          </div>

          <button onClick={()=>fileRef.current?.click()} className="hidden md:flex items-center gap-1.5 px-3 py-1.5 border border-subtle text-muted text-xs rounded-lg hover:border-strong hover:text-primary transition-all">
            <FolderOpen size={13}/> Upload
          </button>
          <button onClick={()=>setShowGithub(true)} className="hidden md:flex items-center gap-1.5 px-3 py-1.5 border border-subtle text-muted text-xs rounded-lg hover:border-strong hover:text-primary transition-all">
            <Github size={13}/> GitHub
          </button>
          <button onClick={()=>setShowSprint(true)} className="hidden md:flex items-center gap-1.5 px-3 py-1.5 border border-subtle text-muted text-xs rounded-lg hover:border-strong hover:text-primary transition-all">
            <ListTodo size={13}/> Sprint
          </button>
          <button onClick={()=>setShowPR(true)} className="hidden md:flex items-center gap-1.5 px-3 py-1.5 border border-subtle text-muted text-xs rounded-lg hover:border-strong hover:text-primary transition-all">
            <GitPullRequest size={13}/> PR
          </button>
          <button onClick={()=>setDemoMode(d=>!d)}
            className={`px-3 py-1.5 text-xs rounded-lg border transition-all flex items-center gap-1.5 ${demoMode?"bg-ibm-purple/15 border-ibm-purple/40 text-acc-purple":"border-subtle text-muted hover:border-strong hover:text-primary"}`}
          >
            <Play size={12}/> Demo
          </button>
          <button onClick={()=>setLightMode(l=>!l)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-subtle text-muted hover:border-strong hover:text-primary transition-all">
            {lightMode?<Moon size={14}/>:<Sun size={14}/>}
          </button>
          <button onClick={()=>setSidebarOpen(s=>!s)} className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg border border-subtle text-muted">
            <Menu size={14}/>
          </button>
        </div>
      </header>

      {/* Demo Banner */}
      <AnimatePresence>
        {demoMode && (
          <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}}
            className="bg-ibm-purple/8 border-b border-ibm-purple/20 px-6 py-2 flex items-center justify-between gap-4"
            style={{backgroundColor:"rgba(105,41,196,0.08)"}}
          >
            <div className="flex items-center gap-2.5">
              <Play size={12} className="text-acc-purple shrink-0"/>
              <span className="text-xs font-medium text-acc-purple">Demo Mode</span>
              <span className="text-xs text-muted hidden sm:block">Pre-built responses — no API key required. Add yours in Vercel to go live.</span>
            </div>
            <button onClick={()=>setDemoMode(false)} className="text-muted hover:text-primary transition-colors"><X size={13}/></button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex overflow-hidden">
        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-6 max-w-5xl mx-auto w-full">
          <AnimatePresence mode="wait">

            {/* Intelligence */}
            {activeTab==="intelligence" && (
              <motion.div key="intel" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} className="space-y-5">
                {/* Hero banner */}
                <div className="panel relative overflow-hidden p-6" style={{background:"linear-gradient(135deg,#0d0d1a 0%,#111128 100%)"}}>
                  <div className="grid-bg absolute inset-0 opacity-40"/>
                  <div className="absolute top-0 right-0 w-64 h-64 bg-ibm-blue/5 rounded-full -mr-32 -mt-32 blur-xl"/>
                  <div className="relative">
                    <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-acc-blue mb-2">Bob Context Engine</p>
                        <h1 className="text-2xl font-bold text-primary leading-tight">
                          "Bob, help me understand<br/><span className="text-gradient-blue">this repository."</span>
                        </h1>
                        <p className="text-sm text-muted mt-2 max-w-md">
                          {githubInfo ? `Analyzing ${githubInfo.name} — ${githubInfo.language} · ${githubInfo.stars} stars` : `${stats.files.toLocaleString()} files indexed. Ask anything about your codebase.`}
                        </p>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <motion.button whileHover={{scale:1.04}} onClick={handleRepoAnalyze} disabled={repoLoading}
                          className="bg-ibm-blue text-white px-4 py-2.5 rounded-lg text-xs font-medium flex items-center gap-2 hover:opacity-90 transition-all disabled:opacity-50"
                        >
                          {repoLoading?<Loader2 size={13} className="animate-spin"/>:<Plus size={13}/>}
                          {repoLoading?"Scanning...":"Analyze Repo"}
                        </motion.button>
                        <button onClick={handleExport} className="border border-subtle text-muted px-4 py-2.5 rounded-lg text-xs font-medium flex items-center gap-2 hover:border-strong hover:text-primary transition-all">
                          <Download size={13}/> Export Report
                        </button>
                      </div>
                    </div>
                    {repoAnalysis && (
                      <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}
                        className={`mt-4 p-4 rounded-xl border text-xs leading-relaxed ${repoAnalysis.risk==="High"?"bg-acc-red/5 border-acc-red/20":"bg-acc-blue/5 border-acc-blue/20"}`}
                      >
                        <span className="font-semibold text-acc-blue">Bob: </span>
                        <span className="text-secondary">{repoAnalysis.summary}</span>
                        <span className="block mt-1 text-muted">Priority: {repoAnalysis.recommendation}</span>
                      </motion.div>
                    )}
                    <div className="flex flex-wrap gap-2 mt-4">
                      {["Upload a file","Connect GitHub","Plan sprint","Generate docs","Run security audit"].map((chip,i)=>(
                        <button key={i} onClick={()=>{
                          if(chip==="Upload a file") fileRef.current?.click();
                          else if(chip==="Connect GitHub") setShowGithub(true);
                          else if(chip==="Plan sprint") setShowSprint(true);
                          else if(chip==="Generate docs") {setActiveTab("tools");setToolsMode("docs");}
                          else if(chip==="Run security audit") setActiveTab("automation");
                        }}
                          className="chip bg-white/5 text-secondary border border-subtle hover:border-strong hover:text-primary transition-all cursor-pointer"
                        >{chip}</button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Metrics row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label:"Files Indexed", value: stats.files.toLocaleString(), icon:<FileCode2 size={14}/>, c:"text-acc-blue"   },
                    { label:"Dev Time Saved",value:"+48h / sprint",               icon:<TrendingUp size={14}/>,c:"text-acc-teal"   },
                    { label:"Risk Reduction", value:"86%",                        icon:<ShieldCheck size={14}/>,c:"text-acc-green" },
                    { label:"Est. ROI",       value:"$14.2k",                     icon:<Zap size={14}/>,       c:"text-acc-purple" },
                  ].map((m,i)=>(
                    <div key={i} className="panel p-4">
                      <div className={`${m.c} mb-2`}>{m.icon}</div>
                      <div className={`text-xl font-bold ${m.c}`}>{m.value}</div>
                      <div className="text-[11px] text-muted mt-0.5">{m.label}</div>
                    </div>
                  ))}
                </div>

                {/* Charts row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="panel p-5">
                    <h3 className="text-xs font-semibold text-primary mb-4 flex items-center gap-2"><span className="w-2 h-2 rounded-sm bg-acc-blue"/>Repo Composition</h3>
                    <div className="h-36">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={REPO_COMPOSITION} innerRadius={36} outerRadius={54} paddingAngle={3} dataKey="value" stroke="none">
                            {REPO_COMPOSITION.map((e,i)=><Cell key={i} fill={e.color}/>)}
                          </Pie>
                          <Tooltip contentStyle={{background:"#12121f",border:"1px solid #26263d",borderRadius:"8px",fontSize:"11px",color:"#f0f0ff"}}/>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 mt-2">
                      {REPO_COMPOSITION.map(d=>(
                        <div key={d.name} className="flex items-center gap-1.5 text-[11px] text-muted">
                          <div className="w-2 h-2 rounded-sm shrink-0" style={{background:d.color}}/>{d.name}: {d.value}%
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="panel p-5">
                    <h3 className="text-xs font-semibold text-primary mb-4 flex items-center gap-2"><span className="w-2 h-2 rounded-sm bg-acc-purple"/>Module Complexity</h3>
                    <div className="h-44">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={COMPLEXITY} barSize={22}>
                          <XAxis dataKey="module" tick={{fontSize:10,fill:"#8888aa"}} axisLine={false} tickLine={false}/>
                          <YAxis tick={{fontSize:10,fill:"#8888aa"}} axisLine={false} tickLine={false} domain={[0,100]}/>
                          <Tooltip contentStyle={{background:"#12121f",border:"1px solid #26263d",borderRadius:"8px",fontSize:"11px",color:"#f0f0ff"}}/>
                          <Bar dataKey="score" radius={[4,4,0,0]}>
                            {COMPLEXITY.map((e,i)=><Cell key={i} fill={e.score>=70?"#ff8389":e.score>=50?"#a56eff":"#3ddbd9"}/>)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Architecture table */}
                <div className="panel p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-semibold text-primary flex items-center gap-2"><span className="w-2 h-2 rounded-sm bg-acc-teal"/>Architectural Overview</h3>
                    <span className="chip bg-acc-teal/10 text-acc-teal">Bob Verified</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {ARCH.map((a,i)=>(
                      <div key={i} className="surface-3 rounded-lg p-3 flex items-center justify-between border border-subtle">
                        <div>
                          <p className="text-[10px] font-medium uppercase tracking-widest text-muted">{a.label}</p>
                          <p className="text-xs font-medium text-primary mt-0.5">{a.value}</p>
                        </div>
                        <span className={`chip text-[9px] ${a.status==="ok"?"bg-acc-green/10 text-acc-green":"bg-acc-amber/10 text-acc-amber"}`}>{a.status==="ok"?"Stable":"Review"}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* File explorer */}
                <div className="panel p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-semibold text-primary flex items-center gap-2"><span className="w-2 h-2 rounded-sm bg-acc-purple"/>File Explorer</h3>
                    <span className="text-[10px] text-muted">Click a file to analyze</span>
                  </div>
                  <div className="space-y-1">
                    {FILES.map(f=>(
                      <button key={f.name} onClick={()=>{setSelectedFile(f.name);setActiveTab("explainer");handleAsk(`Explain the logic and architecture of ${f.name}`);}}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-all group ${selectedFile===f.name?"bg-ibm-blue/10 border-ibm-blue/30":"surface-3 border-subtle hover:border-strong"}`}
                      >
                        <FileCode2 size={14} className={selectedFile===f.name?"text-acc-blue":"text-dimmed group-hover:text-muted"}/>
                        <span className={`font-mono text-xs flex-1 ${selectedFile===f.name?"text-acc-blue":"text-secondary"}`}>{f.name}</span>
                        <span className={`chip text-[9px] ${f.risk==="high"?"bg-acc-red/10 text-acc-red":f.risk==="med"?"bg-acc-amber/10 text-acc-amber":"bg-acc-green/10 text-acc-green"}`}>
                          {f.risk==="high"?"High Risk":f.risk==="med"?"Medium":"Low"}
                        </span>
                        <ChevronRight size={12} className="text-dimmed group-hover:text-muted"/>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Logic Explainer */}
            {activeTab==="explainer" && (
              <motion.div key="explainer" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}
                className="panel flex flex-col" style={{height:"calc(100vh - 160px)"}}>
                <div className="p-5 border-b border-subtle flex items-center justify-between flex-wrap gap-3 shrink-0">
                  <div>
                    <h2 className="font-semibold text-primary flex items-center gap-2"><MessageSquareCode size={16} className="text-acc-blue"/>Logic Explainer</h2>
                    <p className="text-[11px] text-muted mt-0.5">Ask Bob anything about your codebase</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex surface-3 rounded-lg p-0.5 border border-subtle">
                      <button onClick={()=>setExplainerMode("chat")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${explainerMode==="chat"?"bg-ibm-blue/20 text-acc-blue":"text-muted hover:text-primary"}`}>
                        <MessageSquareCode size={12}/>Chat
                      </button>
                      <button onClick={()=>setExplainerMode("review")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${explainerMode==="review"?"bg-acc-red/20 text-acc-red":"text-muted hover:text-primary"}`}>
                        <Eye size={12}/>Review
                      </button>
                    </div>
                    {explainerMode==="chat" && <>
                      <button onClick={()=>fileRef.current?.click()} className="border border-subtle text-muted px-3 py-1.5 rounded-lg text-xs hover:border-strong hover:text-primary transition-all flex items-center gap-1.5"><FolderOpen size={12}/>Upload</button>
                      {chatHistory.length>0 && <button onClick={()=>setChatHistory([])} className="border border-subtle text-muted px-3 py-1.5 rounded-lg text-xs hover:border-acc-red/50 hover:text-acc-red transition-all flex items-center gap-1.5"><X size={12}/>Clear</button>}
                    </>}
                    <div className="flex items-center gap-1.5 text-[10px] text-muted"><span className="w-1.5 h-1.5 rounded-full bg-acc-teal pulse-slow"/>Active</div>
                  </div>
                </div>

                {explainerMode==="chat" && <>
                  <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    {chatHistory.length===0 && !loading && (
                      <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                        <div className="w-12 h-12 rounded-2xl bg-ibm-blue/10 border border-ibm-blue/20 flex items-center justify-center">
                          <MessageSquareCode size={20} className="text-acc-blue"/>
                        </div>
                        <div>
                          <p className="font-medium text-primary text-sm">Ask Bob anything</p>
                          <p className="text-xs text-muted mt-1">Select a file, upload code, or type a question below</p>
                        </div>
                        <div className="flex flex-wrap gap-2 justify-center mt-2">
                          {["Explain auth flow","Find performance bottlenecks","Map external APIs","Review data layer"].map((q,i)=>(
                            <button key={i} onClick={()=>handleAsk(q)} className="chip bg-surface-3 text-secondary border border-subtle hover:border-strong hover:text-primary transition-all cursor-pointer">{q}</button>
                          ))}
                        </div>
                      </div>
                    )}
                    <AnimatePresence>
                      {chatHistory.map(msg=>(
                        <motion.div key={msg.id} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} className={`flex gap-3 ${msg.role==="user"?"flex-row-reverse":""}`}>
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-white text-[11px] font-bold shrink-0 ${msg.role==="bob"?"gradient-blue":"bg-acc-purple/30 border border-acc-purple/40"}`}>
                            {msg.role==="bob"?"B":"Y"}
                          </div>
                          <div className={`flex-1 max-w-[85%] ${msg.role==="user"?"flex flex-col items-end":""}`}>
                            {msg.role==="user" ? (
                              <div className="bg-ibm-blue/15 border border-ibm-blue/20 text-primary px-4 py-2.5 rounded-xl rounded-tr-sm text-xs leading-relaxed">{msg.content}</div>
                            ) : (
                              <div className="surface-3 border border-subtle rounded-xl rounded-tl-sm p-4 space-y-3">
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                  <div className="flex gap-1.5">
                                    {msg.category && <span className="chip bg-acc-blue/10 text-acc-blue">{msg.category}</span>}
                                    {msg.impact && <span className="chip bg-acc-teal/10 text-acc-teal">{msg.impact}</span>}
                                  </div>
                                  {!msg.streaming && msg.content && <button onClick={()=>copy(msg.content,msg.id)} className="text-dimmed hover:text-acc-blue transition-colors">
                                    {copiedId===msg.id?<Check size={11} className="text-acc-green"/>:<Copy size={11}/>}
                                  </button>}
                                </div>
                                <p className="text-xs text-secondary leading-relaxed">
                                  {msg.content}
                                  {msg.streaming && <span className="inline-block w-1 h-3 bg-acc-blue ml-1 animate-pulse rounded-sm"/>}
                                </p>
                                {!msg.streaming && msg.suggestions && (
                                  <div className="space-y-1.5 pt-1 border-t border-subtle">
                                    {msg.suggestions.map((s,i)=>(
                                      <div key={i} className="flex items-start gap-2">
                                        <CheckCircle2 size={11} className="text-acc-teal mt-0.5 shrink-0"/>
                                        <span className="text-[11px] text-muted">{s}</span>
                                      </div>
                                    ))}
                                    <button onClick={()=>launchWorkflow("Applying fix")}
                                      className="w-full mt-2 bg-ibm-blue/10 hover:bg-ibm-blue/20 text-acc-blue border border-ibm-blue/20 py-2 rounded-lg text-[11px] font-medium flex items-center justify-center gap-1.5 transition-all"
                                    >
                                      <Wand2 size={11}/>Apply Automated Fix
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    {loading && <motion.div initial={{opacity:0}} animate={{opacity:1}} className="flex gap-3">
                      <div className="w-7 h-7 rounded-lg gradient-blue flex items-center justify-center text-white text-[11px] font-bold shrink-0">B</div>
                      <div className="surface-3 border border-subtle rounded-xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
                        <Loader2 size={13} className="animate-spin text-acc-blue"/>
                        <span className="text-[11px] text-muted">Bob is reading the repo...</span>
                      </div>
                    </motion.div>}
                    <div ref={chatEndRef}/>
                  </div>
                  <div className="p-4 border-t border-subtle shrink-0">
                    <div className="relative">
                      <input value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")handleAsk();}}
                        placeholder="Ask Bob about any module, architecture, or logic..."
                        className="w-full surface-3 border border-subtle text-primary text-xs px-4 py-3 pr-12 rounded-xl focus:outline-none focus:border-acc-blue transition-colors placeholder:text-dimmed"
                      />
                      <button onClick={()=>handleAsk()} disabled={loading||!query.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-ibm-blue text-white rounded-lg flex items-center justify-center hover:opacity-90 disabled:opacity-40 transition-all active:scale-95"
                      >
                        {loading?<Loader2 size={13} className="animate-spin"/>:<Search size={13}/>}
                      </button>
                    </div>
                  </div>
                </>}

                {explainerMode==="review" && (
                  <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    {!reviewResult ? <>
                      <p className="text-xs text-muted">Paste the code you want Bob to review as a senior engineer.</p>
                      <textarea value={reviewInput} onChange={e=>setReviewInput(e.target.value)} rows={12}
                        placeholder="// Paste code to review..."
                        className="w-full surface-3 border border-subtle text-primary font-mono text-xs px-4 py-3 rounded-xl resize-none focus:outline-none focus:border-acc-blue transition-colors placeholder:text-dimmed"
                      />
                      <motion.button whileHover={{scale:1.02}} onClick={handleCodeReview} disabled={reviewLoading||!reviewInput.trim()}
                        className="w-full bg-ibm-blue text-white py-3 rounded-xl text-xs font-medium flex items-center justify-center gap-2 disabled:opacity-50 hover:opacity-90 transition-all"
                      >
                        {reviewLoading?<><Loader2 size={14} className="animate-spin"/>Reviewing...</>:<><Eye size={14}/>Submit for Code Review</>}
                      </motion.button>
                    </> : <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="space-y-4">
                      <div className={`p-4 rounded-xl border flex items-center justify-between ${reviewResult.verdict==="Approve"?"bg-acc-green/5 border-acc-green/20":reviewResult.verdict==="Request Changes"?"bg-acc-red/5 border-acc-red/20":"bg-acc-amber/5 border-acc-amber/20"}`}>
                        <div>
                          <p className={`font-bold text-base ${reviewResult.verdict==="Approve"?"text-acc-green":reviewResult.verdict==="Request Changes"?"text-acc-red":"text-acc-amber"}`}>{reviewResult.verdict}</p>
                          <p className="text-xs text-muted mt-0.5">{reviewResult.summary}</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-3xl font-bold ${reviewResult.score>=80?"text-acc-green":reviewResult.score>=60?"text-acc-amber":"text-acc-red"}`}>{reviewResult.score}</p>
                          <p className="text-[10px] text-dimmed">/100</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="surface-3 rounded-xl border border-subtle p-4">
                          <p className="text-[10px] font-semibold uppercase tracking-widest text-acc-green mb-2">What Is Good</p>
                          {reviewResult.whatIsGood.map((g,i)=><div key={i} className="flex items-start gap-2 mb-1.5"><CheckCircle2 size={11} className="text-acc-green mt-0.5 shrink-0"/><span className="text-[11px] text-secondary">{g}</span></div>)}
                        </div>
                        <div className="surface-3 rounded-xl border border-subtle p-4">
                          <p className="text-[10px] font-semibold uppercase tracking-widest text-acc-red mb-2">Needs Work</p>
                          {reviewResult.whatNeedsWork.map((w,i)=><div key={i} className="flex items-start gap-2 mb-1.5"><AlertTriangle size={11} className="text-acc-red mt-0.5 shrink-0"/><span className="text-[11px] text-secondary">{w}</span></div>)}
                        </div>
                      </div>
                      {reviewResult.risks.length>0 && <div className="surface-3 rounded-xl border border-acc-amber/20 p-4">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-acc-amber mb-2">Risks</p>
                        {reviewResult.risks.map((r,i)=><div key={i} className="flex items-start gap-2 mb-1.5"><Shield size={11} className="text-acc-amber mt-0.5 shrink-0"/><span className="text-[11px] text-secondary">{r}</span></div>)}
                      </div>}
                      <button onClick={()=>{setReviewResult(null);setReviewInput("");}} className="w-full py-2.5 border border-subtle text-muted text-xs rounded-xl hover:border-strong hover:text-primary transition-all">Review Another</button>
                    </motion.div>}
                  </div>
                )}
              </motion.div>
            )}

            {/* Bob Tools */}
            {activeTab==="tools" && (
              <motion.div key="tools" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} className="space-y-4">
                <div className="panel p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h2 className="font-semibold text-primary flex items-center gap-2"><Sparkles size={16} className="text-acc-purple"/>Bob Tools</h2>
                      <p className="text-[11px] text-muted mt-0.5">Upload any file. Bob generates real documentation or tests.</p>
                    </div>
                    <div className="flex surface-3 rounded-lg p-0.5 border border-subtle">
                      <button onClick={()=>{setToolsMode("docs");setToolsOutput("");}} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${toolsMode==="docs"?"bg-ibm-teal/20 text-acc-teal":"text-muted hover:text-primary"}`}>
                        <FileText size={12}/>Docs
                      </button>
                      <button onClick={()=>{setToolsMode("tests");setToolsOutput("");}} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${toolsMode==="tests"?"bg-acc-purple/20 text-acc-purple":"text-muted hover:text-primary"}`}>
                        <FlaskConical size={12}/>Tests
                      </button>
                    </div>
                  </div>
                  <div onClick={()=>toolsRef.current?.click()} className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${toolsFile?"border-acc-teal/40 bg-acc-teal/5":"border-subtle hover:border-acc-blue/40 hover:bg-ibm-blue/5"}`}>
                    {toolsFile ? <>
                      <FileCode2 size={24} className="text-acc-teal mx-auto mb-2"/>
                      <p className="font-medium text-acc-teal text-sm">{toolsFile.name}</p>
                      <p className="text-[11px] text-muted mt-1">{toolsFile.content.length.toLocaleString()} chars</p>
                      <button onClick={e=>{e.stopPropagation();setToolsFile(null);setToolsOutput("");}} className="text-[11px] text-muted hover:text-acc-red transition-colors mt-2">Remove</button>
                    </> : <>
                      <FolderOpen size={24} className="text-dimmed mx-auto mb-2"/>
                      <p className="text-sm font-medium text-secondary">Click to upload a file</p>
                      <p className="text-[11px] text-muted mt-1">TS, JS, Python, Go, Rust, Java, SQL, and more</p>
                    </>}
                  </div>
                  <motion.button whileHover={{scale:1.01}} onClick={handleRunTool} disabled={!toolsFile||toolsLoading}
                    className={`w-full mt-4 py-3 rounded-xl text-xs font-medium flex items-center justify-center gap-2 disabled:opacity-50 transition-all text-white ${toolsMode==="docs"?"bg-ibm-teal hover:opacity-90":"bg-ibm-purple hover:opacity-90"}`}
                  >
                    {toolsLoading?<><Loader2 size={14} className="animate-spin"/>Bob is {toolsMode==="docs"?"writing docs":"generating tests"}...</>:<><Sparkles size={14}/>Generate {toolsMode==="docs"?"Documentation":"Test Suite"} with Bob</>}
                  </motion.button>
                  <AnimatePresence>
                    {toolsOutput && <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} className="mt-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-acc-teal rounded-full"/><span className="text-[11px] text-acc-teal font-medium">Output ready</span></div>
                        <button onClick={()=>copy(toolsOutput,"tools")} className="text-[11px] text-muted hover:text-acc-blue transition-colors flex items-center gap-1">
                          {copiedId==="tools"?<><Check size={11}/>Copied!</>:<><Copy size={11}/>Copy</>}
                        </button>
                      </div>
                      <div className="surface-3 rounded-xl border border-subtle p-4 max-h-96 overflow-y-auto">
                        <pre className="text-[11px] font-mono text-secondary whitespace-pre-wrap leading-relaxed">{toolsOutput}</pre>
                      </div>
                    </motion.div>}
                  </AnimatePresence>
                </div>

                <div className="panel p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-semibold text-primary flex items-center gap-2"><GitPullRequest size={14} className="text-acc-blue"/>PR Description Generator</h3>
                  </div>
                  <p className="text-xs text-muted mb-3">Describe your changes in plain text. Bob writes a professional PR with title, changelog, and review notes.</p>
                  <motion.button whileHover={{scale:1.02}} onClick={()=>setShowPR(true)} className="w-full bg-ibm-blue/10 hover:bg-ibm-blue/20 text-acc-blue border border-ibm-blue/20 py-2.5 rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-all">
                    <GitPullRequest size={13}/>Open PR Generator
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* Automation */}
            {activeTab==="automation" && (
              <motion.div key="automation" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} className="space-y-4">
                <div className="panel p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h2 className="font-semibold text-primary flex items-center gap-2"><Wand2 size={16} className="text-acc-purple"/>Automation Lab</h2>
                      <p className="text-[11px] text-muted mt-0.5">Real AI output for every action. Connect GitHub for context-aware results.</p>
                    </div>
                    {!githubInfo && <button onClick={()=>setShowGithub(true)} className="chip bg-ibm-blue/10 text-acc-blue border border-ibm-blue/20 hover:bg-ibm-blue/20 cursor-pointer transition-all">Connect GitHub</button>}
                  </div>
                  {automationLoading && <div className="flex items-center gap-3 p-4 surface-3 rounded-xl border border-subtle mb-4">
                    <Loader2 size={16} className="animate-spin text-acc-purple shrink-0"/>
                    <p className="text-xs text-muted">Bob is working on it — this may take 15-30 seconds...</p>
                  </div>}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { type:"docs"     as const, icon:<FileText size={16}/>,    title:"Generate README",    desc:"Production-quality README from your codebase",  color:"ibm-teal",   label:"Documentation" },
                      { type:"security" as const, icon:<Shield size={16}/>,      title:"Security Audit",     desc:"Vulnerabilities with specific actionable fixes", color:"ibm-red",    label:"Security"      },
                      { type:"refactor" as const, icon:<GitBranch size={16}/>,   title:"Refactor Plan",      desc:"Before/after code for top 3 improvement targets",color:"ibm-purple", label:"Refactoring"   },
                      { type:"cicd"     as const, icon:<Settings size={16}/>,    title:"CI/CD Workflows",    desc:"Complete GitHub Actions YAML: CI, deploy, PR",   color:"ibm-blue",   label:"DevOps"        },
                    ].map(action=>(
                      <motion.button key={action.type} whileHover={{scale:1.02}} onClick={()=>handleAutomation(action.type,action.title)} disabled={!!automationLoading}
                        className="panel-interactive p-4 text-left flex items-start gap-3 group disabled:opacity-50"
                      >
                        <div className={`w-9 h-9 rounded-lg bg-${action.color}/10 border border-${action.color}/20 flex items-center justify-center shrink-0 text-acc-blue group-hover:scale-105 transition-transform`}>
                          {automationLoading===action.type?<Loader2 size={14} className="animate-spin"/>:action.icon}
                        </div>
                        <div>
                          <p className="font-medium text-primary text-xs mb-0.5">{action.title}</p>
                          <p className="text-[11px] text-muted leading-relaxed">{action.desc}</p>
                          <span className="chip mt-2 bg-surface-4 text-dimmed">{action.label}</span>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Onboarding */}
            {activeTab==="onboarding" && (
              <motion.div key="onboarding" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} className="space-y-4">
                <div className="panel p-6">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h2 className="font-semibold text-primary flex items-center gap-2"><UserCheck size={16} className="text-acc-teal"/>Onboarding Assistant</h2>
                      <p className="text-[11px] text-muted mt-0.5">Get any new developer up to speed in 60 seconds</p>
                    </div>
                    {githubInfo && <span className="chip bg-acc-teal/10 text-acc-teal border border-acc-teal/20">{githubInfo.name}</span>}
                  </div>
                  {!githubInfo && <textarea value={onboardingCtx} onChange={e=>setOnboardingCtx(e.target.value)} rows={4}
                    placeholder="Paste project context, or connect a GitHub repo above for automatic context..."
                    className="w-full mt-4 surface-3 border border-subtle text-primary text-xs px-4 py-3 rounded-xl resize-none focus:outline-none focus:border-acc-blue transition-colors placeholder:text-dimmed"
                  />}
                  <motion.button whileHover={{scale:1.01}} onClick={handleOnboarding} disabled={onboardingLoading}
                    className="w-full mt-4 bg-ibm-teal text-white py-3 rounded-xl text-xs font-medium flex items-center justify-center gap-2 disabled:opacity-50 hover:opacity-90 transition-all"
                  >
                    {onboardingLoading?<><Loader2 size={14} className="animate-spin"/>Bob is mapping the codebase...</>:<><UserCheck size={14}/>Generate Onboarding Guide</>}
                  </motion.button>
                  <AnimatePresence>
                    {onboardingGuide && <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} className="mt-5 space-y-4">
                      <div className="p-4 bg-ibm-blue/10 border border-ibm-blue/20 rounded-xl">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-acc-blue mb-1">{onboardingGuide.repoName}</p>
                        <p className="text-xs text-secondary leading-relaxed">{onboardingGuide.overview}</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {onboardingGuide.sections.map((s,i)=>(
                          <div key={i} className="surface-3 border border-subtle rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-lg">{s.icon}</span>
                              <p className="font-semibold text-xs text-primary">{s.title}</p>
                            </div>
                            <p className="text-[11px] text-muted mb-2 leading-relaxed">{s.content}</p>
                            {s.items.map((item,j)=><div key={j} className="flex items-start gap-2 mb-1.5"><CheckCircle2 size={11} className="text-acc-teal mt-0.5 shrink-0"/><span className="text-[11px] text-secondary">{item}</span></div>)}
                          </div>
                        ))}
                      </div>
                      <div className="p-4 bg-acc-teal/5 border border-acc-teal/20 rounded-xl">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-acc-teal mb-1">First PR Recommendation</p>
                        <p className="text-xs text-secondary leading-relaxed">{onboardingGuide.firstTask}</p>
                      </div>
                      <div className="flex gap-3">
                        <button onClick={()=>copy(`# ${onboardingGuide.repoName}\n\n${onboardingGuide.overview}\n\n${onboardingGuide.sections.map(s=>`## ${s.icon} ${s.title}\n${s.content}\n${s.items.map(i=>`- ${i}`).join("\n")}`).join("\n\n")}\n\n## First PR\n${onboardingGuide.firstTask}`,"ob")}
                          className="flex-1 bg-ibm-blue text-white py-2.5 rounded-xl text-xs font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-all"
                        >
                          {copiedId==="ob"?<><Check size={12}/>Copied!</>:<><Copy size={12}/>Copy as Markdown</>}
                        </button>
                        <button onClick={()=>setOnboardingGuide(null)} className="px-4 py-2.5 border border-subtle text-muted rounded-xl text-xs hover:border-strong hover:text-primary transition-all">Reset</button>
                      </div>
                    </motion.div>}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </main>

        {/* Sidebar */}
        <aside className="hidden xl:flex w-72 flex-col border-l border-subtle surface-1 overflow-y-auto shrink-0">
          <div className="p-4 space-y-4">

            {/* Health Score */}
            <div className="panel p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-primary flex items-center gap-2"><Gauge size={13} className="text-acc-blue"/>Health Score</h3>
                {!healthFetched
                  ? <button onClick={handleHealthScore} disabled={healthLoading} className="text-[10px] text-acc-blue hover:opacity-80 transition-opacity border border-ibm-blue/30 px-2 py-0.5 rounded-md disabled:opacity-50">{healthLoading?"Scanning...":"Run Scan"}</button>
                  : <button onClick={()=>{setHealthFetched(false);setHealthScore(null);}} className="text-dimmed hover:text-muted transition-colors"><RotateCcw size={11}/></button>
                }
              </div>
              {healthLoading && <div className="flex justify-center py-4"><Loader2 size={18} className="animate-spin text-acc-blue"/></div>}
              {!healthScore && !healthLoading && <div className="text-center py-4"><p className="text-[11px] text-dimmed">Click Run Scan to analyze</p></div>}
              {healthScore && <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className={`text-3xl font-bold ${healthScore.overall>=80?"text-acc-green":healthScore.overall>=60?"text-acc-amber":"text-acc-red"}`}>{healthScore.overall}</div>
                  <div>
                    <div className="text-[10px] text-muted">/100</div>
                    <div className={`text-[10px] font-semibold ${healthScore.overall>=80?"text-acc-green":healthScore.overall>=60?"text-acc-amber":"text-acc-red"}`}>
                      {healthScore.overall>=80?"Healthy":healthScore.overall>=60?"Moderate":"Critical"}
                    </div>
                  </div>
                </div>
                {[
                  {l:"Test Coverage", v:healthScore.testCoverage},
                  {l:"Documentation", v:healthScore.documentation},
                  {l:"Security",      v:healthScore.security},
                  {l:"Code Quality",  v:healthScore.codeQuality},
                ].map(({l,v})=>(
                  <div key={l}>
                    <div className="flex justify-between text-[10px] mb-1"><span className="text-muted">{l}</span><span className="text-secondary">{v}</span></div>
                    <div className="health-track"><motion.div initial={{width:0}} animate={{width:`${v}%`}} transition={{duration:0.7}} className={`h-full rounded-full ${v>=60?"bg-acc-green":v>=30?"bg-acc-amber":"bg-acc-red"}`}/></div>
                  </div>
                ))}
                <div className="pt-2 border-t border-subtle space-y-1.5">
                  <div className="flex items-start gap-1.5"><AlertTriangle size={10} className="text-acc-red shrink-0 mt-0.5"/><p className="text-[10px] text-muted leading-tight">{healthScore.topIssue}</p></div>
                  <div className="flex items-start gap-1.5"><Zap size={10} className="text-acc-green shrink-0 mt-0.5"/><p className="text-[10px] text-muted leading-tight">{healthScore.quickWin}</p></div>
                </div>
              </div>}
            </div>

            {/* Active Workflows */}
            {workflows.length>0 && <div className="panel p-4">
              <h3 className="text-xs font-semibold text-primary mb-3 flex items-center gap-2"><Activity size={13} className="text-acc-purple"/>Active Workflows</h3>
              <div className="space-y-3">
                <AnimatePresence>
                  {workflows.slice(0,5).map(w=>(
                    <motion.div key={w.id} initial={{opacity:0,height:0}} animate={{opacity:1,height:"auto"}} exit={{opacity:0,height:0}}>
                      <div className="flex justify-between text-[10px] mb-1">
                        <span className="text-secondary truncate max-w-[140px]">{w.label}</span>
                        <span className={w.done?"text-acc-green":"text-muted"}>{w.done?"Done":`${w.progress}%`}</span>
                      </div>
                      <div className="health-track"><motion.div initial={{width:0}} animate={{width:`${w.progress}%`}} transition={{duration:0.5}} className={`h-full rounded-full ${w.done?"bg-acc-green":"bg-ibm-blue"}`}/></div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>}

            {/* Live Recommendations */}
            <div className="panel p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-primary flex items-center gap-2"><Activity size={13} className="text-acc-red"/>Live Feed</h3>
                <span className="w-2 h-2 rounded-full bg-acc-red animate-pulse"/>
              </div>
              <div className="space-y-2.5">
                <AnimatePresence mode="popLayout">
                  {recs.map(r=>(
                    <motion.div key={r.id} initial={{opacity:0,x:12}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-12}} className="flex gap-2">
                      <div className="accent-line self-stretch bg-acc-blue shrink-0"/>
                      <div>
                        <p className="text-[11px] text-secondary leading-tight">{r.message}</p>
                        <p className="text-[10px] text-dimmed mt-0.5">{r.time}</p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* Bob status */}
            <div className="panel p-4 grid-bg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-acc-teal pulse-slow"/>
                <span className="text-[10px] font-medium text-acc-teal uppercase tracking-widest">Bob Online</span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-muted mb-2"><span>Repo indexed</span><span>94.8%</span></div>
              <div className="health-track"><div className="h-full w-[94.8%] bg-acc-teal rounded-full"/></div>
              <p className="text-[10px] text-dimmed mt-3 leading-relaxed">Full repository context active. Bob has mapped all dependencies and architectural patterns.</p>
            </div>

          </div>
        </aside>
      </div>

      <footer className="h-9 border-t border-subtle px-6 flex items-center justify-between shrink-0 surface-1">
        <span className="text-[10px] text-dimmed">IBM Bob Core v2.1 — Spark.Studio</span>
        <div className="flex items-center gap-4 text-[10px] text-dimmed">
          <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-acc-teal pulse-slow"/>Sync stable</span>
          <span>{stats.files.toLocaleString()} files · {stats.lang}</span>
        </div>
      </footer>
    </div>
  );
}

// ─── Shared Components ────────────────────────────────────────────────────────
function Overlay({ onClose, title, icon, children, wide }: { onClose:()=>void; title:string; icon:ReactNode; children:ReactNode; wide?:boolean; }) {
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{scale:0.95,y:16}} animate={{scale:1,y:0}} exit={{scale:0.95,y:16}} onClick={e=>e.stopPropagation()}
        className={`panel-raised w-full ${wide?"max-w-2xl":"max-w-md"} flex flex-col gap-4 p-6 max-h-[90vh] overflow-y-auto`}
        style={{boxShadow:"0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)"}}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-primary text-sm flex items-center gap-2 text-acc-blue">{icon}{title}</h3>
          <button onClick={onClose} className="text-muted hover:text-primary transition-colors"><X size={16}/></button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}
