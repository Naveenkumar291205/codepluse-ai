import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Flame,
  ArrowRight,
  GitFork,
  ShieldAlert,
  TestTube2,
  FileCode2,
  Cpu,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Info,
} from 'lucide-react';
import { ThreeHeroScene } from '../components/ThreeHeroScene';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#050811] text-slate-100 font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* 1. Navigation Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-[#050811]/80 border-b border-slate-800/60">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.4)]">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-white via-cyan-100 to-cyan-400 bg-clip-text text-transparent">
                CodePulse AI
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm text-slate-400 font-medium">
            <a href="#how-it-works" className="hover:text-cyan-400 transition-colors">
              How It Works
            </a>
            <a href="#features" className="hover:text-cyan-400 transition-colors">
              Features
            </a>
            <a href="#risk-scoring" className="hover:text-cyan-400 transition-colors">
              Risk Engine
            </a>
            <a href="#limitations" className="hover:text-cyan-400 transition-colors">
              Methodology
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <NavLink
              to="/app"
              className="group relative inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-slate-950 bg-gradient-to-r from-cyan-400 via-cyan-300 to-blue-400 hover:shadow-[0_0_25px_rgba(6,182,212,0.45)] transition-all hover:scale-[1.02]"
            >
              <span>Launch App</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </NavLink>
          </div>
        </div>
      </header>

      {/* 2. Cinematic Hero with 3D Canvas */}
      <section className="relative min-h-[90vh] pt-32 pb-20 flex items-center overflow-hidden">
        {/* Background 3D Scene */}
        <div className="absolute inset-0 z-0 opacity-80 pointer-events-auto">
          <ThreeHeroScene />
        </div>

        {/* Ambient Gradient Overlays */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-gradient-to-r from-cyan-500/10 via-blue-600/10 to-violet-600/10 blur-[140px] pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 pointer-events-none">
          <div className="max-w-3xl">
            {/* Academic & Platform Tag */}
            <div className="pointer-events-auto inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-mono mb-6 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Next-Gen Static Code Impact Analysis</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08] text-white">
              Understand the{' '}
              <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-400 bg-clip-text text-transparent">
                impact
              </span>{' '}
              of every code change.
            </h1>

            {/* Supporting Text */}
            <p className="mt-6 text-lg sm:text-xl text-slate-300 leading-relaxed font-normal">
              Analyze Python projects, visualize function dependencies, identify
              potential risks, and discover relevant tests before shipping changes.
            </p>

            {/* CTAs */}
            <div className="mt-10 flex flex-wrap items-center gap-4 pointer-events-auto">
              <NavLink
                to="/app/projects"
                className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl font-semibold text-slate-950 bg-gradient-to-r from-cyan-400 to-blue-400 hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all hover:scale-105"
              >
                <span>Analyze a Project</span>
                <ArrowRight className="w-4 h-4" />
              </NavLink>

              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-medium text-slate-200 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 backdrop-blur-md transition-all"
              >
                <span>Explore How It Works</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </a>
            </div>

            {/* Mini Stat Pills */}
            <div className="mt-12 flex flex-wrap gap-4 text-xs font-mono text-slate-400 pointer-events-auto">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950/70 border border-slate-800">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                <span>Zero Execution (100% Static AST)</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950/70 border border-slate-800">
                <span className="w-2 h-2 rounded-full bg-violet-400" />
                <span>Reverse-BFS Call Traversal</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950/70 border border-slate-800">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Transparent Heuristic Scoring</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Three-Step Workflow */}
      <section id="how-it-works" className="py-24 border-t border-slate-900 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs uppercase tracking-widest text-cyan-400 font-mono mb-2">
              Workflow Pipeline
            </h2>
            <h3 className="text-3xl font-bold text-white tracking-tight">
              From source zip to change impact insight in three steps
            </h3>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="glass-panel rounded-2xl p-8 relative overflow-hidden group hover:border-cyan-500/40 transition-all">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-6">
                <FileCode2 className="w-6 h-6" />
              </div>
              <div className="text-sm font-mono text-cyan-400 mb-2">STEP 01</div>
              <h4 className="text-xl font-bold text-white mb-3">Upload Python Project</h4>
              <p className="text-slate-400 text-sm leading-relaxed">
                Safely upload a ZIP archive of your Python repository. CodePulse analyzes the code structure statically with Python AST without executing any files.
              </p>
            </div>

            <div className="glass-panel rounded-2xl p-8 relative overflow-hidden group hover:border-blue-500/40 transition-all">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-6">
                <GitFork className="w-6 h-6" />
              </div>
              <div className="text-sm font-mono text-blue-400 mb-2">STEP 02</div>
              <h4 className="text-xl font-bold text-white mb-3">Directed Graph Extraction</h4>
              <p className="text-slate-400 text-sm leading-relaxed">
                Functions, classes, and calls are extracted into a directed call graph (caller → callee). Interactive React Flow canvas lets you inspect topology.
              </p>
            </div>

            <div className="glass-panel rounded-2xl p-8 relative overflow-hidden group hover:border-violet-500/40 transition-all">
              <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-400 mb-6">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="text-sm font-mono text-violet-400 mb-2">STEP 03</div>
              <h4 className="text-xl font-bold text-white mb-3">Impact & Test Discovery</h4>
              <p className="text-slate-400 text-sm leading-relaxed">
                Select any function to trace affected upstream callers, compute deterministic heuristic risk (0–100), and receive candidate test recommendations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Core Features Showcase */}
      <section id="features" className="py-24 bg-gradient-to-b from-[#050811] via-[#090e1c] to-[#050811]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-2xl mb-16">
            <h2 className="text-xs uppercase tracking-widest text-cyan-400 font-mono mb-2">
              Capabilities
            </h2>
            <h3 className="text-3xl font-bold text-white tracking-tight">
              Engineered for developer productivity and review confidence
            </h3>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="glass-panel rounded-xl p-6 hover:border-cyan-500/40 transition-all">
              <GitFork className="w-7 h-7 text-cyan-400 mb-4" />
              <h4 className="text-lg font-semibold text-white mb-2">Reverse Graph Traversal</h4>
              <p className="text-sm text-slate-400 leading-relaxed">
                When a callee changes, BFS reverse traversal navigates back through caller hierarchies to find all transitive dependents without infinite loop recursion.
              </p>
            </div>

            <div className="glass-panel rounded-xl p-6 hover:border-blue-500/40 transition-all">
              <ShieldAlert className="w-7 h-7 text-blue-400 mb-4" />
              <h4 className="text-lg font-semibold text-white mb-2">Deterministic Risk Engine</h4>
              <p className="text-sm text-slate-400 leading-relaxed">
                Calculates review priority based on caller count, transitive depth, and coupling paths using a transparent, documented formula.
              </p>
            </div>

            <div className="glass-panel rounded-xl p-6 hover:border-violet-500/40 transition-all">
              <TestTube2 className="w-7 h-7 text-violet-400 mb-4" />
              <h4 className="text-lg font-semibold text-white mb-2">Static Test Recommender</h4>
              <p className="text-sm text-slate-400 leading-relaxed">
                Identifies test functions matching modified routines via naming patterns and AST call references, prioritizing high-confidence test suites.
              </p>
            </div>

            <div className="glass-panel rounded-xl p-6 hover:border-emerald-500/40 transition-all">
              <Layers className="w-7 h-7 text-emerald-400 mb-4" />
              <h4 className="text-lg font-semibold text-white mb-2">Interactive React Flow Canvas</h4>
              <p className="text-sm text-slate-400 leading-relaxed">
                Zoom, pan, search, and highlight nodes. Custom glowing node components display line numbers, classes, and hop distances.
              </p>
            </div>

            <div className="glass-panel rounded-xl p-6 hover:border-cyan-500/40 transition-all">
              <Cpu className="w-7 h-7 text-cyan-400 mb-4" />
              <h4 className="text-lg font-semibold text-white mb-2">Safe Sandbox Architecture</h4>
              <p className="text-sm text-slate-400 leading-relaxed">
                Strict path-traversal prevention, zip expansion limits, temporary directory cleanup, and 100% static parsing with zero arbitrary code execution.
              </p>
            </div>

            <div className="glass-panel rounded-xl p-6 hover:border-amber-500/40 transition-all">
              <Sparkles className="w-7 h-7 text-amber-400 mb-4" />
              <h4 className="text-lg font-semibold text-white mb-2">Natural Language Explanations</h4>
              <p className="text-sm text-slate-400 leading-relaxed">
                Translates static graph metrics into clear review actions with rule-based heuristics and optional OpenAI integration.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Risk Scoring & Formula Explanation */}
      <section id="risk-scoring" className="py-24 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-xs uppercase tracking-widest text-cyan-400 font-mono mb-2">
                Transparent Metrics
              </h2>
              <h3 className="text-3xl font-bold text-white tracking-tight mb-4">
                Review priority calculated with mathematical clarity
              </h3>
              <p className="text-slate-400 leading-relaxed mb-6">
                CodePulse AI never presents fabricated statistics or black-box metrics. Every point in the 0–100 risk score maps directly to observable static signals:
              </p>

              <div className="space-y-4 font-mono text-sm">
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
                  <div className="text-cyan-400 font-bold mb-1">Direct Callers (×10 pts)</div>
                  <div className="text-slate-400 text-xs">Immediate callers that invoke this function directly.</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
                  <div className="text-blue-400 font-bold mb-1">Transitive Reach (×3 pts)</div>
                  <div className="text-slate-400 text-xs">Functions indirectly affected higher up the call chain.</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
                  <div className="text-violet-400 font-bold mb-1">Call Depth (×5 pts)</div>
                  <div className="text-slate-400 text-xs">Maximum distance of propagation through the call graph.</div>
                </div>
              </div>
            </div>

            <div className="glass-panel rounded-2xl p-8 border border-cyan-500/20">
              <div className="flex items-center justify-between mb-6">
                <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider">Example Score Breakdown</span>
                <span className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 font-bold text-xs border border-amber-500/30">
                  HIGH (64.0 / 100)
                </span>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-xs py-2 border-b border-slate-800">
                  <span className="text-slate-400">Direct callers: generate_invoice, test_calc</span>
                  <span className="text-cyan-400 font-mono">+20 pts</span>
                </div>
                <div className="flex justify-between text-xs py-2 border-b border-slate-800">
                  <span className="text-slate-400">Transitive callers: process_order, notify_customer</span>
                  <span className="text-cyan-400 font-mono">+6 pts</span>
                </div>
                <div className="flex justify-between text-xs py-2 border-b border-slate-800">
                  <span className="text-slate-400">Propagation depth: 3 hops</span>
                  <span className="text-cyan-400 font-mono">+15 pts</span>
                </div>
                <div className="flex justify-between text-xs py-2 border-b border-slate-800">
                  <span className="text-slate-400">Structural dependency paths</span>
                  <span className="text-cyan-400 font-mono">+4 pts</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/90 text-xs text-slate-400 border border-slate-800 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>
                  The risk score is a review-priority heuristic. It does not measure runtime bug probability or guarantee execution failure.
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Benefits & Limitations */}
      <section id="limitations" className="py-24 bg-[#070c18] border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs uppercase tracking-widest text-cyan-400 font-mono mb-2">
              Engineering Rigor
            </h2>
            <h3 className="text-3xl font-bold text-white tracking-tight">
              Benefits and Static Analysis Boundaries
            </h3>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="glass-panel rounded-2xl p-8 border-emerald-500/20">
              <h4 className="text-lg font-bold text-emerald-400 mb-4 flex items-center gap-2">
                <span>Key Platform Benefits</span>
              </h4>
              <ul className="space-y-3 text-sm text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>Instant impact detection before running extensive test suites.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>Interactive visual graph makes monolithic codebases understandable.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>Zero execution security ensures untrusted source code is never executed.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>Persistent SQLite storage keeps historical review logs accessible.</span>
                </li>
              </ul>
            </div>

            <div className="glass-panel rounded-2xl p-8 border-amber-500/20">
              <h4 className="text-lg font-bold text-amber-400 mb-4 flex items-center gap-2">
                <span>Known Limitations to Consider</span>
              </h4>
              <ul className="space-y-3 text-sm text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">!</span>
                  <span>Dynamic dispatch & duck-typing cannot be statically resolved.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">!</span>
                  <span>Calls through reflection (getattr, __call__) are not traced.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">!</span>
                  <span>Runtime monkey-patching and mock substitutions are bypassed.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">!</span>
                  <span>Recommended tests are candidate suggestions, not certified coverage.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Final Call to Action */}
      <section className="py-24 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-radial from-cyan-950/30 to-transparent pointer-events-none" />
        <div className="relative z-10 max-w-4xl mx-auto px-6">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-6">
            Ready to analyze your Python codebase?
          </h2>
          <p className="text-slate-400 text-lg mb-8 max-w-2xl mx-auto">
            Upload your ZIP archive, explore the interactive dependency graph, and discover potential regression risks instantly.
          </p>
          <NavLink
            to="/app/projects"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-base font-semibold text-slate-950 bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-400 hover:shadow-[0_0_35px_rgba(6,182,212,0.5)] transition-all hover:scale-105"
          >
            <span>Launch CodePulse AI Studio</span>
            <ArrowRight className="w-5 h-5" />
          </NavLink>
        </div>
      </section>

      {/* 8. Academic Project Footer */}
      <footer className="border-t border-slate-900 bg-[#04060d] py-12 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <div className="flex items-center gap-2 text-slate-300 font-bold text-sm mb-2">
              <Flame className="w-4 h-4 text-cyan-400" />
              <span>CodePulse AI</span>
            </div>
            <p className="text-slate-400 leading-relaxed max-w-md">
              An Intelligent Code Change Impact Analysis and Test Recommendation System.
            </p>
          </div>

          <div className="md:text-right font-mono space-y-1">
            <div className="text-slate-300 font-semibold">Academic Mini Project</div>
            <div>Student: <span className="text-cyan-400">NAVEEN KUMAR M</span></div>
            <div>Register Number: <span className="text-slate-300">710123205026</span></div>
            <div>Dept: Information Technology | Adithya Institute of Technology</div>
            <div>Academic Year: 2026–2027</div>
          </div>
        </div>
      </footer>
    </div>
  );
};
