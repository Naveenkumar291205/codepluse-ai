import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Upload,
  FileCode2,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Search,
  Code,
  ArrowRight,
  GitFork,
  Zap,
  Clock,
  Box,
  ChevronRight,
  FileText,
  FileWarning,
} from 'lucide-react';
import {
  listProjects,
  uploadProject,
  deleteProject,
  getProjectFunctions,
  getProjectFiles,
} from '../services/api';
import { Project, FunctionItem, SourceFile } from '../types';

export const ProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [functions, setFunctions] = useState<FunctionItem[]>([]);
  const [files, setFiles] = useState<SourceFile[]>([]);
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await listProjects();
      setProjects(data);
      const paramId = searchParams.get('id');
      if (paramId) {
        const found = data.find((p) => p.id === Number(paramId));
        if (found) selectProject(found);
      } else if (data.length > 0 && !selectedProject) {
        selectProject(data[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const selectProject = async (project: Project) => {
    setSelectedProject(project);
    setSearchParams({ id: String(project.id) });
    try {
      const [funcs, fls] = await Promise.all([
        getProjectFunctions(project.id),
        getProjectFiles(project.id),
      ]);
      setFunctions(funcs);
      setFiles(fls);
    } catch (err) {
      console.error('Failed to load project details', err);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file.name.endsWith('.zip')) {
      setUploadError('Please select a valid .zip file containing Python code.');
      return;
    }

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const newProj = await uploadProject(file);
      setUploadSuccess(`Successfully uploaded and analyzed ${newProj.name}!`);
      await loadProjects();
      selectProject(newProj);
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Upload or extraction failed.';
      setUploadError(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this project?')) return;
    try {
      await deleteProject(id);
      if (selectedProject?.id === id) {
        setSelectedProject(null);
        setFunctions([]);
        setFiles([]);
      }
      await loadProjects();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredFunctions = functions.filter(
    (f) =>
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.qualified_name.toLowerCase().includes(search.toLowerCase()) ||
      f.source_file_path.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Upload Banner Section */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Drag & Drop Upload Card */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6 border border-slate-800 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <Upload className="w-5 h-5 text-cyan-400" /> Upload Python Project
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Upload a .zip repository archive. Our AST parser statically extracts modules, classes, and calls.
            </p>

            {/* Drop Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                if (e.dataTransfer.files?.[0]) {
                  handleFileUpload(e.dataTransfer.files[0]);
                }
              }}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                dragOver
                  ? 'border-cyan-400 bg-cyan-950/30'
                  : 'border-slate-700/80 hover:border-cyan-500/50 bg-slate-900/40'
              }`}
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.zip';
                input.onchange = (e) => {
                  const target = e.target as HTMLInputElement;
                  if (target.files?.[0]) handleFileUpload(target.files[0]);
                };
                input.click();
              }}
            >
              <FileCode2 className="w-10 h-10 text-cyan-400 mx-auto mb-3 opacity-80" />
              <div className="text-sm font-semibold text-slate-200">
                {uploading ? 'Processing & extracting AST...' : 'Drop your project .zip here, or browse files'}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Max size: 50MB • Safe sandbox extraction • Zero code execution
              </div>
            </div>

            {/* Notifications */}
            {uploadError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}
            {uploadSuccess && (
              <div className="mt-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{uploadSuccess}</span>
              </div>
            )}
          </div>
        </div>

        {/* Existing Projects List */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 flex flex-col">
          <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
            <Box className="w-5 h-5 text-blue-400" /> Your Projects
          </h2>
          <p className="text-xs text-slate-400 mb-4">
            Select a project to inspect source tree & functions.
          </p>

          <div className="space-y-2 overflow-y-auto max-h-56 flex-1 pr-1">
            {projects.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">
                No projects uploaded yet.
              </div>
            ) : (
              projects.map((p) => (
                <div
                  key={p.id}
                  onClick={() => selectProject(p)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${
                    selectedProject?.id === p.id
                      ? 'bg-cyan-950/50 border-cyan-500/50 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="truncate mr-2">
                    <div className="text-xs font-semibold truncate">{p.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {p.total_functions} functions • {p.total_files} files
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={(e) => handleDelete(p.id, e)}
                      title="Delete project"
                      className="p-1 rounded hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Explorer Section when project selected */}
      {selectedProject && (
        <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800 space-y-6">
          {/* Project Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-xl font-bold text-white">{selectedProject.name}</h3>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {selectedProject.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Source archive: {selectedProject.original_filename} • {selectedProject.total_files} Python files • {selectedProject.total_functions} extracted functions
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(`/app/graph?id=${selectedProject.id}`)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
              >
                <GitFork className="w-3.5 h-3.5 text-cyan-400" />
                <span>Open Graph</span>
              </button>
            </div>
          </div>

          {/* Files Summary Strip */}
          <div>
            <h4 className="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-3">
              Source Files Tree ({files.length})
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2 truncate mr-2">
                    {file.has_syntax_error ? (
                      <FileWarning className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    ) : (
                      <FileText className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    )}
                    <span className="font-mono text-slate-300 truncate" title={file.relative_path}>
                      {file.relative_path}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 shrink-0">
                    {file.function_count} fn
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Extracted Functions Table */}
          <div className="pt-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <h4 className="text-xs uppercase font-semibold text-slate-400 tracking-wider">
                Extracted Functions ({filteredFunctions.length})
              </h4>

              {/* Function Search */}
              <div className="relative w-full sm:w-72">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter functions..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Function Name</th>
                    <th className="py-3 px-4">File Location</th>
                    <th className="py-3 px-4">Lines</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {filteredFunctions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500">
                        No functions found matching "{search}"
                      </td>
                    </tr>
                  ) : (
                    filteredFunctions.map((fn) => (
                      <tr
                        key={fn.id}
                        className="hover:bg-slate-800/40 transition-colors group"
                      >
                        <td className="py-3 px-4 font-semibold text-slate-200 flex items-center gap-2">
                          {fn.is_method ? (
                            <Box className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                          ) : (
                            <Code className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          )}
                          <span className="text-cyan-300 font-bold">{fn.name}</span>
                          {fn.class_name && (
                            <span className="text-[10px] text-slate-500 font-normal">
                              ({fn.class_name})
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-400 truncate max-w-xs" title={fn.source_file_path}>
                          {fn.source_file_path}
                        </td>
                        <td className="py-3 px-4 text-slate-400">
                          {fn.line_start ? `${fn.line_start}–${fn.line_end}` : '—'}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400">
                            {fn.is_method ? 'Method' : 'Function'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() =>
                              navigate(
                                `/app/analyze?projectId=${selectedProject.id}&func=${encodeURIComponent(
                                  fn.qualified_name
                                )}`
                              )
                            }
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[11px] font-sans font-medium transition-colors"
                          >
                            <Zap className="w-3 h-3 text-cyan-400" />
                            <span>Analyze Impact</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
