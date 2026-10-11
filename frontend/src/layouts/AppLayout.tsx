import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderGit2,
  GitFork,
  Zap,
  History,
  Settings,
  Flame,
  ArrowUpRight,
  ChevronDown,
  Layers,
  Terminal,
} from 'lucide-react';
import { listProjects } from '../services/api';
import { Project } from '../types';

export const AppLayout: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await listProjects();
      setProjects(data);
      if (data.length > 0 && !selectedProjectId) {
        setSelectedProjectId(data[0].id);
      }
    } catch (e) {
      console.error('Failed to load projects', e);
    }
  };

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/app' },
    { label: 'Projects & Upload', icon: FolderGit2, path: '/app/projects' },
    { label: 'Dependency Graph', icon: GitFork, path: '/app/graph' },
    { label: 'Impact Analyzer', icon: Zap, path: '/app/analyze' },
    { label: 'Analysis History', icon: History, path: '/app/history' },
    { label: 'Settings & Info', icon: Settings, path: '/app/settings' },
  ];

  return (
    <div className="flex h-screen bg-[#050811] text-slate-100 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800/80 bg-[#070c18]/90 backdrop-blur-xl flex flex-col shrink-0 z-30">
        {/* Logo */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <NavLink to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.4)] group-hover:scale-105 transition-transform">
              <Flame className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-bold tracking-tight text-base bg-gradient-to-r from-white via-cyan-100 to-cyan-400 bg-clip-text text-transparent">
                CodePulse AI
              </span>
              <span className="block text-[9px] uppercase tracking-widest text-cyan-400/80 font-mono">
                Static Analysis
              </span>
            </div>
          </NavLink>
        </div>

        {/* Project Selector Badge */}
        <div className="px-4 py-3 border-b border-slate-800/60 bg-slate-900/40">
          <div className="text-[11px] uppercase font-semibold text-slate-400 tracking-wider mb-1 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-cyan-400" /> Active Project
          </div>
          <div className="relative">
            <select
              value={selectedProjectId || ''}
              onChange={(e) => {
                const val = Number(e.target.value);
                setSelectedProjectId(val);
                navigate(`/app/projects?id=${val}`);
              }}
              className="w-full bg-slate-950/80 border border-slate-800 text-xs text-slate-200 rounded-lg py-1.5 px-2.5 focus:outline-none focus:border-cyan-500 appearance-none cursor-pointer"
            >
              {projects.length === 0 ? (
                <option value="">No projects uploaded</option>
              ) : (
                projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.total_functions} fn)
                  </option>
                ))
              )}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.path === '/app'
                ? location.pathname === '/app'
                : location.pathname.startsWith(item.path);

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/15 to-blue-500/5 text-cyan-300 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.1)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-cyan-400' : 'text-slate-500'
                  }`}
                />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer info badge */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/60">
          <div className="rounded-xl p-3 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800/80 text-xs">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="font-mono text-[10px] text-cyan-400">AST ENGINE</span>
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              Non-executing Python static change impact analyzer.
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-14 border-b border-slate-800/80 bg-[#070c18]/70 backdrop-blur-md px-6 flex items-center justify-between z-20">
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="text-slate-500">Workspace</span>
            <span>/</span>
            <span className="text-cyan-300 font-medium">
              {projects.find((p) => p.id === selectedProjectId)?.name || 'Default'}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <NavLink
              to="/"
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 transition-colors"
            >
              <span>Landing Page</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </NavLink>
            <div className="h-4 w-[1px] bg-slate-800" />
            <a
              href="/api/docs"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors font-mono"
            >
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              <span>Swagger Docs</span>
            </a>
          </div>
        </header>

        {/* Outlet for Pages */}
        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-[#050811] to-[#070c18]">
          <Outlet context={{ projects, selectedProjectId, setSelectedProjectId, reloadProjects: loadProjects }} />
        </main>
      </div>
    </div>
  );
};
