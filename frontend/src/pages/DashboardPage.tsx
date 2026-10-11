import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  FolderGit2,
  Code2,
  Zap,
  AlertTriangle,
  Upload,
  ArrowRight,
  Clock,
  Layers,
  ShieldCheck,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { getDashboardStats, getRecentAnalyses, listProjects } from '../services/api';
import { DashboardStats, Project } from '../types';

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [recentAnalyses, setRecentAnalyses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [s, p, a] = await Promise.all([
        getDashboardStats(),
        listProjects(),
        getRecentAnalyses(),
      ]);
      setStats(s);
      setProjects(p);
      setRecentAnalyses(a);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      label: 'Total Projects',
      value: stats?.total_projects ?? 0,
      icon: FolderGit2,
      color: 'text-cyan-400',
      border: 'border-cyan-500/20',
      glow: 'shadow-[0_0_20px_rgba(6,182,212,0.15)]',
    },
    {
      label: 'Extracted Functions',
      value: stats?.total_functions ?? 0,
      icon: Code2,
      color: 'text-blue-400',
      border: 'border-blue-500/20',
      glow: 'shadow-[0_0_20px_rgba(59,130,246,0.15)]',
    },
    {
      label: 'Analyses Run',
      value: stats?.total_analyses ?? 0,
      icon: Zap,
      color: 'text-violet-400',
      border: 'border-violet-500/20',
      glow: 'shadow-[0_0_20px_rgba(139,92,246,0.15)]',
    },
    {
      label: 'High Priority Targets',
      value: stats?.high_priority_analyses ?? 0,
      icon: AlertTriangle,
      color: 'text-amber-400',
      border: 'border-amber-500/20',
      glow: 'shadow-[0_0_20px_rgba(245,158,11,0.15)]',
    },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Welcome Banner */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-full bg-gradient-to-l from-cyan-500/10 to-transparent pointer-events-none" />
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono mb-3">
            <Sparkles className="w-3.5 h-3.5" /> Live Workspace Overview
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Developer Analysis Center
          </h1>
          <p className="text-slate-400 text-sm mt-1 max-w-xl">
            Upload repositories, map function dependencies, and calculate impact reach before deploying code.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <NavLink
            to="/app/projects"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm text-slate-950 bg-gradient-to-r from-cyan-400 to-blue-400 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all hover:scale-105"
          >
            <Upload className="w-4 h-4" />
            <span>Upload New ZIP</span>
          </NavLink>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              className={`glass-panel rounded-xl p-5 border ${card.border} ${card.glow} flex flex-col justify-between`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">{card.label}</span>
                <Icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <div className="mt-4">
                <span className="text-3xl font-extrabold text-white tracking-tight font-mono">
                  {loading ? '...' : card.value}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid: Recent Projects + Recent Analyses */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Recent Projects Card */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-4">
            <div className="flex items-center gap-2">
              <FolderGit2 className="w-4 h-4 text-cyan-400" />
              <h2 className="text-base font-semibold text-white">Repositories</h2>
            </div>
            <NavLink
              to="/app/projects"
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </NavLink>
          </div>

          <div className="space-y-3 flex-1">
            {projects.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-sm">
                <FolderGit2 className="w-10 h-10 mx-auto mb-3 opacity-30 text-slate-400" />
                <p>No projects uploaded yet.</p>
                <NavLink
                  to="/app/projects"
                  className="mt-3 inline-block text-xs text-cyan-400 hover:underline"
                >
                  Upload your first Python ZIP project →
                </NavLink>
              </div>
            ) : (
              projects.slice(0, 4).map((p) => (
                <div
                  key={p.id}
                  onClick={() => navigate(`/app/projects?id=${p.id}`)}
                  className="p-3.5 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800/60 hover:border-cyan-500/30 transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div>
                    <div className="font-medium text-sm text-slate-200 group-hover:text-cyan-300 transition-colors">
                      {p.name}
                    </div>
                    <div className="text-xs text-slate-500 font-mono mt-0.5">
                      {p.total_files} files • {p.total_functions} functions
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-[11px] font-mono px-2 py-0.5 rounded ${
                        p.status === 'ready'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400'
                      }`}
                    >
                      {p.status}
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 transition-colors" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Analyses Card */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-4">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-violet-400" />
              <h2 className="text-base font-semibold text-white">Recent Impact Analyses</h2>
            </div>
            <NavLink
              to="/app/history"
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium"
            >
              <span>Full History</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </NavLink>
          </div>

          <div className="space-y-3 flex-1">
            {recentAnalyses.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-sm">
                <Zap className="w-10 h-10 mx-auto mb-3 opacity-30 text-slate-400" />
                <p>No impact analyses recorded yet.</p>
                <p className="text-xs text-slate-600 mt-1">
                  Select a function from the Dependency Graph or Project Explorer.
                </p>
              </div>
            ) : (
              recentAnalyses.map((a) => (
                <div
                  key={a.id}
                  onClick={() => navigate(`/app/analyze?id=${a.id}`)}
                  className="p-3.5 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800/60 hover:border-violet-500/30 transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div>
                    <div className="font-mono text-sm font-semibold text-slate-200 group-hover:text-cyan-300 transition-colors">
                      {a.function_name}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {a.project_name} • {a.affected_count} affected caller(s)
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                        a.risk_category === 'critical'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                          : a.risk_category === 'high'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          : a.risk_category === 'medium'
                          ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      }`}
                    >
                      {a.risk_score} pts
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-violet-400 transition-colors" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Action & Onboarding Guide */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 grid md:grid-cols-3 gap-6">
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-3 font-mono text-sm font-bold">
            1
          </div>
          <h3 className="font-semibold text-white text-sm mb-1">Upload Archive</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Upload your Python project ZIP. The AST parser extracts functions and call references securely.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center mb-3 font-mono text-sm font-bold">
            2
          </div>
          <h3 className="font-semibold text-white text-sm mb-1">Explore Call Graph</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Navigate the interactive React Flow canvas. Inspect node details, source paths, and line numbers.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <div className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-400 flex items-center justify-center mb-3 font-mono text-sm font-bold">
            3
          </div>
          <h3 className="font-semibold text-white text-sm mb-1">Analyze Impact & Tests</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Run change-impact analysis to discover affected callers, calculate heuristic risk, and receive candidate tests.
          </p>
        </div>
      </div>
    </div>
  );
};
