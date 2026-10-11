import axios from 'axios';
import {
  Project,
  FunctionItem,
  SourceFile,
  GraphResponse,
  AnalysisResponse,
  AnalysisHistoryItem,
  DashboardStats,
} from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getHealth = async () => {
  const res = await api.get('/health');
  return res.data;
};

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const res = await api.get<DashboardStats>('/dashboard/stats');
  return res.data;
};

export const getRecentAnalyses = async () => {
  const res = await api.get('/dashboard/recent-analyses');
  return res.data.analyses;
};

export const uploadProject = async (file: File): Promise<Project> => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post<Project>('/projects/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
};

export const listProjects = async (): Promise<Project[]> => {
  const res = await api.get<{ projects: Project[]; total: number }>('/projects');
  return res.data.projects;
};

export const getProject = async (id: number): Promise<Project> => {
  const res = await api.get<Project>(`/projects/${id}`);
  return res.data;
};

export const deleteProject = async (id: number): Promise<void> => {
  await api.delete(`/projects/${id}`);
};

export const getProjectFiles = async (id: number): Promise<SourceFile[]> => {
  const res = await api.get<{ files: SourceFile[]; total: number }>(`/projects/${id}/files`);
  return res.data.files;
};

export const getProjectFunctions = async (
  id: number,
  search?: string
): Promise<FunctionItem[]> => {
  const res = await api.get<{ functions: FunctionItem[]; total: number }>(
    `/projects/${id}/functions`,
    { params: { search } }
  );
  return res.data.functions;
};

export const getProjectGraph = async (id: number): Promise<GraphResponse> => {
  const res = await api.get<GraphResponse>(`/projects/${id}/graph`);
  return res.data;
};

export const analyzeFunction = async (
  projectId: number,
  functionQualifiedName: string,
  useAi: boolean = false
): Promise<AnalysisResponse> => {
  const res = await api.post<AnalysisResponse>(`/projects/${projectId}/analyze`, {
    function_qualified_name: functionQualifiedName,
    use_ai: useAi,
  });
  return res.data;
};

export const getProjectHistory = async (projectId: number): Promise<AnalysisHistoryItem[]> => {
  const res = await api.get<{ history: AnalysisHistoryItem[]; total: number }>(
    `/projects/${projectId}/history`
  );
  return res.data.history;
};

export const getAllHistory = async (): Promise<AnalysisHistoryItem[]> => {
  const res = await api.get<{ history: AnalysisHistoryItem[]; total: number }>('/history');
  return res.data.history;
};

export const getAnalysisDetail = async (analysisId: number) => {
  const res = await api.get(`/analyses/${analysisId}`);
  return res.data;
};

export default api;
