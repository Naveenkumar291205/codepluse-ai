import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Code, Box } from 'lucide-react';
import { GraphNodeData } from '../types';

interface FunctionNodeProps {
  data: GraphNodeData & {
    isTarget?: boolean;
    isAffected?: boolean;
    depth?: number;
    riskCategory?: 'low' | 'medium' | 'high' | 'critical';
  };
  selected?: boolean;
}

export const FunctionNode: React.FC<FunctionNodeProps> = memo(({ data, selected }) => {
  const isTarget = data.isTarget;
  const isAffected = data.isAffected;

  // Determine styling based on target or affected state
  let borderClass = 'border-slate-800/80 hover:border-cyan-500/50';
  let bgClass = 'bg-slate-900/90';
  let badgeColor = 'bg-slate-800 text-slate-300';

  if (isTarget) {
    borderClass = 'border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.4)] ring-2 ring-cyan-400/50';
    bgClass = 'bg-cyan-950/80';
    badgeColor = 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30';
  } else if (isAffected) {
    if (data.riskCategory === 'critical') {
      borderClass = 'border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)] ring-1 ring-rose-500/50';
      bgClass = 'bg-rose-950/70';
      badgeColor = 'bg-rose-500/20 text-rose-300 border border-rose-500/30';
    } else if (data.riskCategory === 'high') {
      borderClass = 'border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)] ring-1 ring-amber-500/50';
      bgClass = 'bg-amber-950/70';
      badgeColor = 'bg-amber-500/20 text-amber-300 border border-amber-500/30';
    } else {
      borderClass = 'border-violet-500 shadow-[0_0_15px_rgba(139,92,246,0.3)] ring-1 ring-violet-500/50';
      bgClass = 'bg-violet-950/70';
      badgeColor = 'bg-violet-500/20 text-violet-300 border border-violet-500/30';
    }
  } else if (selected) {
    borderClass = 'border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.4)] ring-1 ring-blue-400';
    bgClass = 'bg-slate-900';
  }

  return (
    <div
      className={`min-w-[190px] max-w-[260px] rounded-xl border p-3 backdrop-blur-md transition-all duration-200 ${bgClass} ${borderClass}`}
    >
      {/* Target handle (incoming calls from callers) */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2.5 !h-2.5 !bg-cyan-400 !border-2 !border-slate-950"
      />

      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 overflow-hidden">
          {data.is_method ? (
            <Box className="w-4 h-4 text-violet-400 shrink-0" />
          ) : (
            <Code className="w-4 h-4 text-cyan-400 shrink-0" />
          )}
          <span className="font-mono text-sm font-semibold text-slate-100 truncate" title={data.label}>
            {data.label}
          </span>
        </div>

        {isTarget && (
          <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-cyan-500/30 text-cyan-200 shrink-0 border border-cyan-400/40">
            Target
          </span>
        )}
        {!isTarget && isAffected && data.depth !== undefined && (
          <span className="text-[10px] font-bold tracking-wider px-1.5 py-0.5 rounded bg-violet-500/30 text-violet-200 shrink-0 border border-violet-400/40">
            +{data.depth} hop
          </span>
        )}
      </div>

      <div className="mt-2 text-[11px] text-slate-400 font-mono truncate" title={data.relative_path}>
        {data.relative_path || 'module.py'}
        {data.line_start ? `:${data.line_start}` : ''}
      </div>

      {data.class_name && (
        <div className="mt-1">
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-300 font-mono">
            class {data.class_name}
          </span>
        </div>
      )}

      {/* Source handle (outgoing calls to callees) */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2.5 !h-2.5 !bg-blue-400 !border-2 !border-slate-950"
      />
    </div>
  );
});
