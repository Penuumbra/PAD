export type Platform =
  | 'instagram'
  | 'linkedin'
  | 'blog'
  | 'email'
  | 'youtube'
  | 'tiktok'
  | 'twitter'
  | 'facebook'
  | 'whatsapp'
  | 'website';

export type ContentFormat =
  | 'post'
  | 'reel'
  | 'carrossel'
  | 'artigo'
  | 'newsletter'
  | 'stories'
  | 'infografico'
  | 'video'
  | 'podcast'
  | 'live'
  | 'thread';

export type ContentStatus =
  | 'ideia'
  | 'redacao'
  | 'revisao'
  | 'aprovado'
  | 'publicado'
  | 'arquivado';

export type ProjectStatus = 'ativo' | 'pausado' | 'concluido';

export interface ProjectChannel {
  platform: Platform;
  handle?: string;
  url?: string;
  targetReach?: number;
}

export interface ProjectGoal {
  id: string;
  metric: string;
  target: number;
  current: number;
  unit: string;
  deadline?: string;
}

export interface Project {
  id: string;
  name: string;
  client: string;
  description?: string;
  color: string;
  status: ProjectStatus;
  channels: ProjectChannel[];
  goals: ProjectGoal[];
  startDate: string;
  createdAt: string;
}

export interface ContentMetrics {
  reach?: number;
  impressions?: number;
  engagement?: number;
  clicks?: number;
  conversions?: number;
  shares?: number;
  comments?: number;
  likes?: number;
  saves?: number;
}

export interface ContentItem {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  format: ContentFormat;
  channels: Platform[];
  status: ContentStatus;
  scheduledDate?: string;
  publishedDate?: string;
  metrics?: ContentMetrics;
  tags: string[];
  notes?: string;
  createdAt: string;
}

export interface MonthlyData {
  month: string;
  reach: number;
  engagement: number;
  conversions: number;
  clicks: number;
  content: number;
}
