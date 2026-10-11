import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Zap,
  ShieldAlert,
  TestTube2,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  GitFork,
  Code2,
  FileCode2,
  Layers,
  Sparkles,
  RefreshCw,
  Info,
  ChevronDown,
  Terminal,
  FileText,
} from 'lucide-react';
import {
  analyzeFunction,
  getProjectFunctions,
  listProjects,
  getAnalysisDetail,
} from '../services/api';
import {
  AnalysisResponse,
  FunctionItem,
  Project,
  TestRecommendation,
} from '../types';

export const AnalyzePage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [functions, setFunctions] = useState<FunctionItem[]>([]);
  const [selectedFunctionQName, setSelectedFunctionQName] = useState<string>('');
  const [useAi, setUseAi] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    try {
      const projList = await listProjects();
      setProjects(projList);

      const pId = searchParams.get('projectId') || searchParams.get('id');
      const fQName = searchParams.get('func');
      const analysisId = searchParams.get('analysisId');

      if (analysisId) {
        // Load existing analysis
        const existing = await getAnalysisDetail(Number(analysisId));
        setAnalysisResult({
          analysis_id: existing.id,
          impact: existing.analysis_data?.impact || {
            selected_function: existing.function_name,
            selected_qualified_name: existing.function_qualified_name,
            source_file: '',
            line_start: null,
            line_end: null,
            direct_callers: [],
            all_affected: [],
            affected_count: existing.affected_count,
            sample_paths: [],
            limitations: [],
          },
          risk: existing.analysis_data?.risk || {
            score: existing.risk_score,
            category: existing.risk_category,
            contributing_factors: [],
            formula_description: '',
            review_priority: '',
            disclaimer: '',
          },
          test_recommendations: existing.test_recommendations || [],
          explanation: existing.ai_explanation || '',
        });
        setSelectedProjectId(existing.project_id);
        setSelectedFunctionQName(existing.function_qualified_name);
        return;
      }

      if (pId) {
        const id = Number(pId);
        setSelectedProjectId(id);
        const fnList = await getProjectFunctions(id);
        setFunctions(fnList);

        if (fQName) {
          setSelectedFunctionQName(fQName);
          handleRunAnalysis(id, fQName);
        } else if (fnList.length > 0) {
          setSelectedFunctionQName(fnList[0].qualified_name);
        }
      } else if (projList.length > 0) {
        const first = projList[0];
        setSelectedProjectId(first.id);
        const fnList = await getProjectFunctions(first.id);
        setFunctions(fnList);
        if (fnList.length > 0) {
          setSelectedFunctionQName(fnList[0].qualified_name);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleProjectChange = async (projectId: number) => {
    setSelectedProjectId(projectId);
    setAnalysisResult(null);
    try {
      const fnList = await getProjectFunctions(projectId);
      setFunctions(fnList);
      if (fnList.length > 0) {
        setSelectedFunctionQName(fnList[0].qualified_name);
      } else {
        setSelectedFunctionQName('');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRunAnalysis = async (
    projectId: number | null = selectedProjectId,
    qName: string = selectedFunctionQName
  ) => {
    if (!projectId || !qName) return;

    setLoading(true);
    setError(null);

    try {
      const res = await analyzeFunction(projectId, qName, useAi);
      setAnalysisResult(res);
      setSearchParams({
        projectId: String(projectId),
        func: qName,
      });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Analysis execution failed.');
    } finally {
      setLoading(false);
    }
  };

  const riskBadgeStyles = {
    critical: 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.3)]',
    high: 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.3)]',
    medium: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    low: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 font-sans">
      {/* Target Selector Bar */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 pb-5 border-b border-slate-800/80">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-cyan-400" /> Change-Impact Analysis Engine
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Select a target function to compute affected reverse callers, heuristic risk scores, and candidate test suites.
            </p>
          </div>

          {/* AI Explanation Toggle */}
          <div className="flex items-center gap-3 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-medium text-slate-300">LLM Deep Summary:</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={useAi}
                onChange={(e) => setUseAi(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500"></div>
            </label>
          </div>
        </div>

        {/* Form Controls */}
        <div className="grid sm:grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider font-mono">
              Project
            </label>
            <select
              value={selectedProjectId || ''}
              onChange={(e) => handleProjectChange(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-xl p-2.5 focus:outline-none focus:border-cyan-500 font-mono"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider font-mono">
              Target Function (Calibrated)
            </label>
            <select
              value={selectedFunctionQName}
              onChange={(e) => setSelectedFunctionQName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-xl p-2.5 focus:outline-none focus:border-cyan-500 font-mono"
            >
              {functions.map((fn) => (
                <option key={fn.id} value={fn.qualified_name}>
                  {fn.name} ({fn.source_file_path})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => handleRunAnalysis()}
              disabled={loading || !selectedFunctionQName}
              className="w-full py-2.5 px-5 rounded-xl font-semibold text-xs text-slate-950 bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-400 hover:shadow-[0_0_25px_rgba(6,182,212,0.45)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Calculating Reach...</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5" />
                  <span>Execute Impact Analysis</span>
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Analysis Results Display */}
      {analysisResult && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Top Metric Cards: Risk Score & Summary */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Risk Gauge Card */}
            <div className="glass-panel rounded-2xl p-6 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono uppercase text-slate-400 tracking-wider">
                    Heuristic Risk Score
                  </span>
                  <span
                    className={`text-xs uppercase font-bold font-mono px-2 py-0.5 rounded border ${
                      riskBadgeStyles[analysisResult.risk.category]
                    }`}
                  >
                    {analysisResult.risk.category}
                  </span>
                </div>

                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-5xl font-black text-white font-mono tracking-tight">
                    {analysisResult.risk.score}
                  </span>
                  <span className="text-slate-500 font-mono text-sm">/ 100</span>
                </div>

                {/* Visual Progress Bar */}
                <div className="w-full h-2 rounded-full bg-slate-800 mt-4 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-700 ${
                      analysisResult.risk.category === 'critical'
                        ? 'bg-rose-500'
                        : analysisResult.risk.category === 'high'
                        ? 'bg-amber-500'
                        : analysisResult.risk.category === 'medium'
                        ? 'bg-blue-500'
                        : 'bg-emerald-400'
                    }`}
                    style={{ width: `${analysisResult.risk.score}%` }}
                  />
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/80 text-[11px] text-slate-400">
                {analysisResult.risk.review_priority}
              </div>
            </div>

            {/* Affected Callers Summary Card */}
            <div className="glass-panel rounded-2xl p-6 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="text-xs font-mono uppercase text-slate-400 tracking-wider mb-3">
                  Reachability Metrics
                </div>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <div className="text-3xl font-extrabold text-cyan-300 font-mono">
                      {analysisResult.impact.direct_callers.length}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">Direct Callers</div>
                  </div>
                  <div>
                    <div className="text-3xl font-extrabold text-violet-300 font-mono">
                      {analysisResult.impact.affected_count}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">Total Reachable</div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/80 text-[11px] text-slate-400 truncate">
                Target: <span className="font-mono text-cyan-300">{analysisResult.impact.selected_function}</span>
              </div>
            </div>

            {/* Target Location Card */}
            <div className="glass-panel rounded-2xl p-6 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="text-xs font-mono uppercase text-slate-400 tracking-wider mb-3">
                  Target Declaration
                </div>
                <div className="space-y-2 text-xs font-mono text-slate-300 mt-2">
                  <div className="truncate">
                    <span className="text-slate-500">File: </span>
                    {analysisResult.impact.source_file || 'N/A'}
                  </div>
                  <div>
                    <span className="text-slate-500">Lines: </span>
                    {analysisResult.impact.line_start
                      ? `${analysisResult.impact.line_start} – ${analysisResult.impact.line_end}`
                      : 'N/A'}
                  </div>
                  <div>
                    <span className="text-slate-500">Discovered Tests: </span>
                    {analysisResult.test_recommendations.length} candidate(s)
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/80">
                <button
                  onClick={() =>
                    navigate(
                      `/app/graph?id=${selectedProjectId}&highlight=${encodeURIComponent(
                        analysisResult.impact.selected_qualified_name
                      )}`
                    )
                  }
                  className="w-full text-center text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center justify-center gap-1.5"
                >
                  <GitFork className="w-3.5 h-3.5" />
                  <span>Highlight on Dependency Graph</span>
                </button>
              </div>
            </div>
          </div>

          {/* Contributing Factors & Formula */}
          <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800 space-y-6">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-cyan-400" />
              Risk Calculation Breakdown
            </h3>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {analysisResult.risk.contributing_factors.map((f, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl bg-slate-950/70 border border-slate-800"
                >
                  <div className="text-xs text-slate-400 mb-1">{f.name}</div>
                  <div className="text-xl font-bold text-white font-mono">
                    +{f.contribution} pts
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 leading-tight">
                    {f.description}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 text-xs font-mono text-cyan-300">
              Formula: {analysisResult.risk.formula_description}
            </div>
          </div>

          {/* Affected Callers List */}
          <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-violet-400" />
              Potentially Affected Downstream Functions ({analysisResult.impact.all_affected.length})
            </h3>

            {analysisResult.impact.all_affected.length === 0 ? (
              <p className="text-xs text-slate-400">
                No recognized callers found in this codebase. This function may be an entrypoint or called via external modules.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Function</th>
                      <th className="py-3 px-4">Propagation Distance</th>
                      <th className="py-3 px-4">Source Location</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {analysisResult.impact.all_affected.map((aff, i) => (
                      <tr key={i} className="hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-semibold text-slate-200">
                          <span className="text-violet-300 font-bold">{aff.name}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-400">
                          <span className="px-2 py-0.5 rounded bg-violet-500/10 text-violet-300 border border-violet-500/20">
                            {aff.depth} {aff.depth === 1 ? 'hop (direct)' : 'hops (indirect)'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-400 truncate max-w-xs" title={aff.relative_path}>
                          {aff.relative_path}
                          {aff.line_start ? `:${aff.line_start}` : ''}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedFunctionQName(aff.qualified_name);
                              handleRunAnalysis(selectedProjectId, aff.qualified_name);
                            }}
                            className="text-xs text-cyan-400 hover:text-cyan-300 font-sans"
                          >
                            Analyze this caller →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Test Recommendations */}
          <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <TestTube2 className="w-4 h-4 text-emerald-400" />
              Candidate Test Recommendations ({analysisResult.test_recommendations.length})
            </h3>
            <p className="text-xs text-slate-400">
              Discovered statically from test naming conventions and AST call body references. No tests were executed.
            </p>

            {analysisResult.test_recommendations.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs bg-slate-950/60 rounded-xl border border-slate-800">
                No matching test functions identified for this routine. Consider adding unit tests before altering this code.
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {analysisResult.test_recommendations.map((t, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-xs font-bold text-emerald-300">
                          {t.test_function_name}
                        </span>
                        <span
                          className={`text-[10px] font-mono uppercase font-bold px-1.5 py-0.5 rounded border ${
                            t.confidence === 'high'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : t.confidence === 'medium'
                              ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {t.confidence}
                        </span>
                      </div>
                      <div className="text-xs text-slate-300 font-mono mb-2 truncate" title={t.test_file_path}>
                        {t.test_file_path}
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed mb-2">
                        {t.reason}
                      </p>
                    </div>
                    <div className="text-[10px] font-mono text-slate-500 bg-slate-900/90 p-2 rounded border border-slate-800/80">
                      Evidence: {t.evidence}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Plain English Explanation */}
          <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Analysis Explanation & Review Guidance
            </h3>
            <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-slate-300 leading-relaxed whitespace-pre-line font-sans">
              {analysisResult.explanation}
            </div>
          </div>

          {/* Limitations Banner */}
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 flex items-start gap-3">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Static Analysis Caveat: </span>
              {analysisResult.risk.disclaimer}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
