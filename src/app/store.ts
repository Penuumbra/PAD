import { useState, useEffect, useCallback } from 'react';
import { Project, ContentItem } from './types';

const KEYS = { PROJECTS: 'cda_projects', CONTENT: 'cda_content' };

const LEGACY_DEMO_PROJECT_IDS = new Set(['p1', 'p2', 'p3']);
const LEGACY_DEMO_CONTENT_IDS = new Set(['c1', 'c2', 'c3', 'c4', 'c5', 'c6']);

function isLegacyDemoProject(project: Project): boolean {
  return LEGACY_DEMO_PROJECT_IDS.has(project.id);
}

function isLegacyDemoContent(item: ContentItem): boolean {
  return LEGACY_DEMO_PROJECT_IDS.has(item.projectId) || LEGACY_DEMO_CONTENT_IDS.has(item.id);
}

function load<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch { return fallback; }
}

function save<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>(() => {
    const stored = load<Project[]>(KEYS.PROJECTS, []);
    return stored.filter(project => !isLegacyDemoProject(project));
  });

  useEffect(() => { save(KEYS.PROJECTS, projects); }, [projects]);

  const addProject = useCallback((p: Omit<Project, 'id' | 'createdAt'>) => {
    const np: Project = { ...p, id: `p${Date.now()}`, createdAt: new Date().toISOString().slice(0, 10) };
    setProjects(prev => [...prev, np]);
    return np;
  }, []);

  const updateProject = useCallback((id: string, updates: Partial<Project>) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }, []);

  const deleteProject = useCallback((id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
  }, []);

  return { projects, addProject, updateProject, deleteProject };
}

export function useContent() {
  const [content, setContent] = useState<ContentItem[]>(() => {
    const stored = load<ContentItem[]>(KEYS.CONTENT, []);
    return stored.filter(item => !isLegacyDemoContent(item));
  });

  useEffect(() => { save(KEYS.CONTENT, content); }, [content]);

  const addContent = useCallback((c: Omit<ContentItem, 'id' | 'createdAt'>) => {
    const nc: ContentItem = { ...c, id: `c${Date.now()}`, createdAt: new Date().toISOString().slice(0, 10) };
    setContent(prev => [...prev, nc]);
    return nc;
  }, []);

  const updateContent = useCallback((id: string, updates: Partial<ContentItem>) => {
    setContent(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  }, []);

  const deleteContent = useCallback((id: string) => {
    setContent(prev => prev.filter(c => c.id !== id));
  }, []);

  const getByProject = useCallback((projectId: string) =>
    content.filter(c => c.projectId === projectId), [content]);

  return { content, addContent, updateContent, deleteContent, getByProject };
}

export const PLATFORM_LABELS: Record<string, string> = {
  instagram: 'Instagram', linkedin: 'LinkedIn', blog: 'Blog', email: 'E-mail',
  youtube: 'YouTube', tiktok: 'TikTok', twitter: 'Twitter/X', facebook: 'Facebook',
  whatsapp: 'WhatsApp', website: 'Website',
};

export const FORMAT_LABELS: Record<string, string> = {
  post: 'Post', reel: 'Reel', carrossel: 'Carrossel', artigo: 'Artigo',
  newsletter: 'Newsletter', stories: 'Stories', infografico: 'Infografico',
  video: 'Video', podcast: 'Podcast', live: 'Live', thread: 'Thread',
};

export const STATUS_LABELS: Record<string, string> = {
  ideia: 'Ideia', redacao: 'Redacao', revisao: 'Revisao',
  aprovado: 'Aprovado', publicado: 'Publicado', arquivado: 'Arquivado',
};

export const STATUS_COLORS: Record<string, string> = {
  ideia: 'bg-gray-100 text-gray-700',
  redacao: 'bg-yellow-100 text-yellow-700',
  revisao: 'bg-orange-100 text-orange-700',
  aprovado: 'bg-blue-100 text-blue-700',
  publicado: 'bg-green-100 text-green-700',
  arquivado: 'bg-red-100 text-red-600',
};

export const PROJECT_COLOR_OPTIONS = [
  '#2563eb', '#16a34a', '#9333ea', '#ea580c',
  '#db2777', '#0d9488', '#dc2626', '#ca8a04', '#0284c7',
];
