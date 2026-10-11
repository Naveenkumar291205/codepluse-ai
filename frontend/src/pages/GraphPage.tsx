import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Search,
  Filter,
  Maximize2,
  Info,
  Zap,
  ArrowRight,
  GitFork,
  Code2,
  Layers,
  ChevronRight,
  X,
} from 'lucide-react';
import { FunctionNode } from '../components/FunctionNode';
import { getProjectGraph, listProjects } from '../services/api';
import { GraphResponse, Project } from '../types';

const nodeTypes = {
  functionNode: FunctionNode,
};

export const GraphPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState<any>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<any>([]);
  const [selectedNodeData, setSelectedNodeData] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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
        const id = Number(paramId);
        setSelectedProjectId(id);
        fetchGraph(id);
      } else if (data.length > 0) {
        setSelectedProjectId(data[0].id);
        fetchGraph(data[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchGraph = async (projectId: number) => {
    setLoading(true);
    setError(null);
    setSelectedNodeData(null);
    try {
      const data: GraphResponse = await getProjectGraph(projectId);
      layoutAndSetGraph(data);
    } catch (err: any) {
      setError(
        err.response?.data?.detail || 'Failed to load project dependency graph.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Layout nodes hierarchically or cleanly in grid
  const layoutAndSetGraph = (graph: GraphResponse) => {
    const rawNodes = graph.nodes;
    const rawEdges = graph.edges;

    // Build degree maps
    const inDegree: Record<string, number> = {};
    const outDegree: Record<string, number> = {};
    rawNodes.forEach((n) => {
      inDegree[n.id] = 0;
      outDegree[n.id] = 0;
    });
    rawEdges.forEach((e) => {
      if (outDegree[e.source] !== undefined) outDegree[e.source]++;
      if (inDegree[e.target] !== undefined) inDegree[e.target]++;
    });

    // Assign positions using a multi-column layer layout
    // Callers on top/left, callees lower down
    const cols = Math.max(3, Math.ceil(Math.sqrt(rawNodes.length)));
    const colSpacing = 320;
    const rowSpacing = 160;

    const formattedNodes = rawNodes.map((node, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;

      return {
        id: node.id,
        type: 'functionNode',
        position: {
          x: col * colSpacing + (row % 2 === 1 ? 40 : 0),
          y: row * rowSpacing,
        },
        data: {
          ...node.data,
        },
      };
    });

    const formattedEdges = rawEdges.map((edge) => ({
      ...edge,
      animated: true,
      style: {
        stroke: '#38bdf8',
        strokeWidth: 2,
        opacity: 0.65,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#38bdf8',
        width: 14,
        height: 14,
      },
    }));

    setNodes(formattedNodes);
    setEdges(formattedEdges);
  };

  const onNodeClick = useCallback((_: React.MouseEvent, node: any) => {
    setSelectedNodeData(node.data);
  }, []);

  // Filter or highlight matching search
  const highlightSearch = () => {
    if (!searchQuery.trim()) {
      setNodes((nds: any[]) =>
        nds.map((n) => ({
          ...n,
          data: { ...n.data, isTarget: false },
        }))
      );
      return;
    }

    const query = searchQuery.toLowerCase();
    setNodes((nds: any[]) =>
      nds.map((n) => {
        const matches =
          n.data.label.toLowerCase().includes(query) ||
          n.data.qualified_name.toLowerCase().includes(query);
        if (matches && !selectedNodeData) {
          setSelectedNodeData(n.data);
        }
        return {
          ...n,
          data: {
            ...n.data,
            isTarget: matches,
          },
        };
      })
    );
  };

  useEffect(() => {
    highlightSearch();
  }, [searchQuery]);

  return (
    <div className="h-full flex flex-col relative font-sans">
      {/* Top Toolbar */}
      <div className="h-14 border-b border-slate-800/80 bg-[#070c18]/90 px-6 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <GitFork className="w-4 h-4 text-cyan-400" />
            <h1 className="text-sm font-bold text-white tracking-wide">
              Interactive Dependency Graph
            </h1>
          </div>

          <div className="h-4 w-[1px] bg-slate-800" />

          {/* Project Picker */}
          <select
            value={selectedProjectId || ''}
            onChange={(e) => {
              const id = Number(e.target.value);
              setSelectedProjectId(id);
              setSearchParams({ id: String(id) });
              fetchGraph(id);
            }}
            className="bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-lg py-1 px-3 focus:outline-none focus:border-cyan-500"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.total_functions} nodes)
              </option>
            ))}
          </select>
        </div>

        {/* Search in Graph */}
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search node by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          <div className="text-xs font-mono text-slate-400">
            {nodes.length} nodes • {edges.length} calls
          </div>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 relative bg-[#040711]">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-[#050811]/80 z-20">
            <div className="text-center space-y-3">
              <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
              <div className="text-xs font-mono text-cyan-400">
                Parsing AST and rendering directed call graph...
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
            <div className="glass-panel rounded-2xl p-8 max-w-md border border-rose-500/30">
              <Info className="w-8 h-8 text-rose-400 mx-auto mb-3" />
              <div className="text-sm font-semibold text-rose-300">{error}</div>
              <button
                onClick={() => selectedProjectId && fetchGraph(selectedProjectId)}
                className="mt-4 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-white"
              >
                Retry
              </button>
            </div>
          </div>
        ) : nodes.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-slate-500 text-sm">
            <div>
              <GitFork className="w-12 h-12 mx-auto mb-3 opacity-30 text-slate-400" />
              <p>No functions found in this project.</p>
              <button
                onClick={() => navigate('/app/projects')}
                className="mt-3 text-xs text-cyan-400 hover:underline"
              >
                Upload a valid Python project ZIP →
              </button>
            </div>
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            onNodeClick={onNodeClick}
            fitView
            minZoom={0.2}
            maxZoom={2.5}
            proOptions={{ hideAttribution: true }}
          >
            <Background color="#1e293b" gap={20} size={1} />
            <Controls className="!bg-slate-900 !border-slate-800 !text-slate-300 fill-slate-300" />
            <MiniMap
              nodeColor={() => '#06b6d4'}
              maskColor="rgba(5, 8, 17, 0.75)"
              className="!bg-slate-950 !border !border-slate-800 rounded-lg overflow-hidden"
            />
          </ReactFlow>
        )}

        {/* Legend Overlay */}
        <div className="absolute bottom-5 left-5 z-10 glass-panel rounded-xl p-3 border border-slate-800 text-[11px] font-mono text-slate-300 space-y-1.5 shadow-xl pointer-events-none">
          <div className="font-bold text-slate-400 mb-1 text-[10px] uppercase tracking-wider">
            Call Graph Legend
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-cyan-400 inline-block shadow-[0_0_8px_#06b6d4]" />
            <span>Target Function (Changing)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-violet-400 inline-block" />
            <span>Affected Callers (Reverse-BFS)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-0.5 bg-sky-400 inline-block" />
            <span>Directed Call (Caller → Callee)</span>
          </div>
        </div>

        {/* Details Drawer when a node is selected */}
        {selectedNodeData && (
          <div className="absolute top-5 right-5 z-20 w-80 glass-panel rounded-2xl p-5 border border-cyan-500/30 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-cyan-400" />
                <h3 className="font-mono text-sm font-bold text-white truncate max-w-[200px]" title={selectedNodeData.label}>
                  {selectedNodeData.label}
                </h3>
              </div>
              <button
                onClick={() => setSelectedNodeData(null)}
                className="p-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs font-mono text-slate-300 bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              <div className="text-[11px] text-slate-500 uppercase tracking-wider font-sans">
                Source Details
              </div>
              <div className="truncate" title={selectedNodeData.relative_path}>
                <span className="text-slate-500">File: </span>
                {selectedNodeData.relative_path}
              </div>
              <div>
                <span className="text-slate-500">Lines: </span>
                {selectedNodeData.line_start
                  ? `${selectedNodeData.line_start} – ${selectedNodeData.line_end}`
                  : 'N/A'}
              </div>
              {selectedNodeData.class_name && (
                <div>
                  <span className="text-slate-500">Class: </span>
                  {selectedNodeData.class_name}
                </div>
              )}
            </div>

            <button
              onClick={() => {
                navigate(
                  `/app/analyze?projectId=${selectedProjectId}&func=${encodeURIComponent(
                    selectedNodeData.qualified_name
                  )}`
                );
              }}
              className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-slate-950 bg-gradient-to-r from-cyan-400 to-blue-400 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all flex items-center justify-center gap-2"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Run Change Impact Analysis</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
