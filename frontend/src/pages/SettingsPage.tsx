import React from 'react';
import {
  Settings,
  GraduationCap,
  Cpu,
  Shield,
  ExternalLink,
  BookOpen,
  Terminal,
  Database,
  GitFork,
  FileCode2,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 font-sans">
      <div className="pb-6 border-b border-slate-800">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-cyan-400" /> Platform Specifications & Project Info
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Academic project details, architecture documentation, and system parameters.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Academic Project Credits */}
        <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-cyan-400 font-semibold text-sm">
            <GraduationCap className="w-5 h-5" />
            <span>Academic Project Credentials</span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-slate-500 block text-[10px] uppercase">Project Title</span>
              <span className="text-slate-200 font-bold text-sm">
                CodePulse AI — An Intelligent Code Change Impact Analysis and Test Recommendation System
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase">Student Name</span>
                <span className="text-cyan-300 font-bold">NAVEEN KUMAR M</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase">Register Number</span>
                <span className="text-white font-bold">710123205026</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-slate-500 block text-[10px] uppercase">Department & Institution</span>
              <span className="text-slate-300">
                Department of Information Technology, Adithya Institute of Technology
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-slate-500 block text-[10px] uppercase">Academic Year</span>
              <span className="text-slate-300">2026–2027</span>
            </div>
          </div>
        </div>

        {/* System Architecture Specifications */}
        <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-blue-400 font-semibold text-sm">
            <Cpu className="w-5 h-5" />
            <span>System Architecture Specs</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCode2 className="w-4 h-4 text-cyan-400" />
                <span className="text-slate-300 font-semibold">AST Parsing Engine</span>
              </div>
              <span className="font-mono text-slate-400 text-[11px]">Python `ast` standard module</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GitFork className="w-4 h-4 text-blue-400" />
                <span className="text-slate-300 font-semibold">Call Graph & Traversal</span>
              </div>
              <span className="font-mono text-slate-400 text-[11px]">NetworkX DiGraph (Reverse-BFS)</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-violet-400" />
                <span className="text-slate-300 font-semibold">Persistence Layer</span>
              </div>
              <span className="font-mono text-slate-400 text-[11px]">SQLite with SQLAlchemy 2.0 ORM</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-300 font-semibold">REST API Server</span>
              </div>
              <span className="font-mono text-slate-400 text-[11px]">FastAPI + Pydantic v2</span>
            </div>
          </div>

          <div className="pt-2">
            <a
              href="/api/docs"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Interactive Swagger API Documentation</span>
            </a>
          </div>
        </div>
      </div>

      {/* Heuristic Formula Documentation */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
          <Shield className="w-5 h-5" />
          <span>Transparent Heuristic Formula Specification</span>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          The risk score is a deterministic review-priority calculation bounded between 0 and 100:
        </p>

        <div className="p-4 rounded-xl bg-slate-950 font-mono text-xs text-cyan-300 border border-slate-800">
          score = min(100, (direct_callers × 10) + (transitive_callers × 3) + (max_depth × 5) + (dependency_paths × 2))
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-emerald-400 font-bold block">LOW</span>
            <span className="text-slate-400 text-[11px]">0 – 24 pts</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-blue-400 font-bold block">MEDIUM</span>
            <span className="text-slate-400 text-[11px]">25 – 49 pts</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-amber-400 font-bold block">HIGH</span>
            <span className="text-slate-400 text-[11px]">50 – 74 pts</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-rose-400 font-bold block">CRITICAL</span>
            <span className="text-slate-400 text-[11px]">75 – 100 pts</span>
          </div>
        </div>
      </div>
    </div>
  );
};
