export interface Project {
  id: number;
  name: string;
  original_filename: string;
  status: 'uploaded' | 'processing' | 'ready' | 'error';
  total_files: number;
  total_functions: number;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface FunctionItem {
  id: number;
  name: string;
  qualified_name: string;
  class_name: string | null;
  line_start: number | null;
  line_end: number | null;
  docstring: string | null;
  is_method: boolean;
  source_file_path: string;
}

export interface SourceFile {
  id: number;
  relative_path: string;
  has_syntax_error: boolean;
  syntax_error_message: string | null;
  function_count: number;
}

export interface GraphNodeData {
  label: string;
  qualified_name: string;
  relative_path: string;
  line_start: number | null;
  line_end: number | null;
  class_name: string | null;
  is_method: boolean;
}

export interface GraphNode {
  id: string;
  data: GraphNodeData;
  type: string;
  position?: { x: number; y: number };
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  data?: { call_type: string };
  type?: string;
  animated?: boolean;
}

export interface GraphResponse {
  nodes: GraphNode[];
  edges: GraphEdge[];
  node_count: number;
  edge_count: number;
}

export interface AffectedFunction {
  qualified_name: string;
  name: string;
  relative_path: string;
  line_start: number | null;
  depth: number;
}

export interface RiskFactor {
  name: string;
  value: any;
  contribution: number;
  description: string;
}

export interface RiskScore {
  score: number;
  category: 'low' | 'medium' | 'high' | 'critical';
  contributing_factors: RiskFactor[];
  formula_description: string;
  review_priority: string;
  disclaimer: string;
}

export interface ImpactData {
  selected_function: string;
  selected_qualified_name: string;
  source_file: string;
  line_start: number | null;
  line_end: number | null;
  direct_callers: string[];
  all_affected: AffectedFunction[];
  affected_count: number;
  sample_paths: string[][];
  limitations: string[];
}

export interface TestRecommendation {
  id?: number;
  test_function_name: string;
  test_file_path: string;
  reason: string;
  evidence: string;
  confidence: 'low' | 'medium' | 'high';
}

export interface AnalysisResponse {
  analysis_id: number;
  impact: ImpactData;
  risk: RiskScore;
  test_recommendations: TestRecommendation[];
  explanation: string;
}

export interface AnalysisHistoryItem {
  id: number;
  project_id: number;
  project_name: string;
  function_name: string;
  function_qualified_name: string;
  risk_score: number;
  risk_category: 'low' | 'medium' | 'high' | 'critical';
  affected_count: number;
  recommendation_count: number;
  status: string;
  created_at: string;
}

export interface DashboardStats {
  total_projects: number;
  total_functions: number;
  total_analyses: number;
  high_priority_analyses: number;
}
