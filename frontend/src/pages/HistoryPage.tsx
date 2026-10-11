import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  History,
  Zap,
  ArrowRight,
  GitFork,
  Clock,
  Layers,
  ChevronRight,
  AlertTriangle,
  FolderGit2,
} from 'lucide-react';
import { getAllHistory } from '../services/api';
import { AnalysisHistoryItem } from '../types';

export const HistoryPage: React.FC = () => {
  const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await getAllHistory();
      setHistory(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const riskBadgeStyles = {
    critical: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    high: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    medium: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    low: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-cyan-400" /> Analysis History Archive
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Persisted review sessions and impact logs stored in SQLite database.
          </p>
        </div>

        <div className="text-xs font-mono text-slate-400">
          Total Recorded: {history.length} runs
        </div>
      </div>

      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-500 text-xs font-mono">
            Loading analysis logs...
          </div>
        ) : history.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-sm">
            <Zap className="w-10 h-10 mx-auto mb-3 opacity-30 text-slate-400" />
            <p>No historical analyses recorded yet.</p>
            <button
              onClick={() => navigate('/app/analyze')}
              className="mt-3 text-xs text-cyan-400 hover:underline"
            >
              Run your first change impact analysis →
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-5">Target Function</th>
                  <th className="py-3 px-5">Project</th>
                  <th className="py-3 px-5">Risk Score</th>
                  <th className="py-3 px-5">Affected Callers</th>
                  <th className="py-3 px-5">Discovered Tests</th>
                  <th className="py-3 px-5">Date / Time</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {history.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-800/40 transition-colors group"
                  >
                    <td className="py-4 px-5">
                      <div className="font-bold text-slate-200 text-sm group-hover:text-cyan-300 transition-colors">
                        {item.function_name}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate max-w-xs" title={item.function_qualified_name}>
                        {item.function_qualified_name}
                      </div>
                    </td>

                    <td className="py-4 px-5 text-slate-400 font-sans">
                      <div className="flex items-center gap-1.5">
                        <FolderGit2 className="w-3.5 h-3.5 text-slate-500" />
                        <span>{item.project_name}</span>
                      </div>
                    </td>

                    <td className="py-4 px-5">
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded border ${
                          riskBadgeStyles[item.risk_category]
                        }`}
                      >
                        {item.risk_score} pts ({item.risk_category.toUpperCase()})
                      </span>
                    </td>

                    <td className="py-4 px-5 text-slate-300">
                      <span className="font-bold text-violet-400">{item.affected_count}</span> function(s)
                    </td>

                    <td className="py-4 px-5 text-slate-300">
                      <span className="font-bold text-emerald-400">{item.recommendation_count}</span> test(s)
                    </td>

                    <td className="py-4 px-5 text-slate-500 text-[11px]">
                      {new Date(item.created_at).toLocaleString()}
                    </td>

                    <td className="py-4 px-5 text-right font-sans">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/app/analyze?analysisId=${item.id}`)}
                          className="px-3 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs transition-colors flex items-center gap-1"
                        >
                          <Zap className="w-3 h-3" />
                          <span>View</span>
                        </button>
                        <button
                          onClick={() =>
                            navigate(
                              `/app/graph?id=${item.project_id}&highlight=${encodeURIComponent(
                                item.function_qualified_name
                              )}`
                            )
                          }
                          title="Open in Graph"
                          className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                        >
                          <GitFork className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
