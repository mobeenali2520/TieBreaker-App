import { DecisionProject } from '../types/decision';
import { PRESET_TEMPLATES } from '../data/templates';
import { doc, setDoc, deleteDoc, collection, getDocs } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

const STORAGE_KEY = 'decidewise_projects_v1';
const ACTIVE_PROJECT_KEY = 'decidewise_active_id';
const DELETED_PROJECTS_KEY = 'decidewise_deleted_ids_v1';

export function getDeletedProjectIds(): string[] {
  try {
    const raw = localStorage.getItem(DELETED_PROJECTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

export function recordDeletedProjectId(id: string): void {
  try {
    const deleted = getDeletedProjectIds();
    if (!deleted.includes(id)) {
      deleted.push(id);
      localStorage.setItem(DELETED_PROJECTS_KEY, JSON.stringify(deleted));
    }
  } catch (e) {
    console.error('Failed to record deleted project id:', e);
  }
}

export async function syncProjectToFirestore(project: DecisionProject): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;
  try {
    const ref = doc(db, 'users', user.uid, 'projects', project.id);
    await setDoc(ref, project);
  } catch (err) {
    console.warn("Failed to sync project to Firestore:", err);
  }
}

export async function deleteProjectFromFirestore(projectId: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;
  try {
    const ref = doc(db, 'users', user.uid, 'projects', projectId);
    await deleteDoc(ref);
  } catch (err) {
    console.warn("Failed to delete project from Firestore:", err);
  }
}

export async function fetchUserProjectsFromFirestore(uid: string): Promise<DecisionProject[]> {
  try {
    const projectsCol = collection(db, 'users', uid, 'projects');
    const snap = await getDocs(projectsCol);
    const list: DecisionProject[] = [];
    snap.forEach((docSnap) => {
      list.push(docSnap.data() as DecisionProject);
    });
    return list;
  } catch (err) {
    console.warn("Failed to fetch user projects from Firestore:", err);
    return [];
  }
}

export function createDefaultProject(): DecisionProject {
  const template = PRESET_TEMPLATES[0]; // Job offers
  const options = template.options.map((opt, i) => ({ ...opt, id: `opt_${Date.now()}_${i}` }));
  const criteria = template.criteria.map((crit, i) => ({ ...crit, id: `crit_${Date.now()}_${i}` }));
  
  const scores: Record<string, number> = {};
  if (template.defaultScores) {
    options.forEach((opt, optIdx) => {
      criteria.forEach((crit, critIdx) => {
        const key = `${opt.id}_${crit.id}`;
        const templateKey = `opt${optIdx}_crit${critIdx}`;
        scores[key] = template.defaultScores?.[templateKey] ?? 7;
      });
    });
  }

  return {
    id: `proj_${Date.now()}`,
    title: template.title,
    description: template.description,
    category: template.category,
    options,
    criteria,
    scores,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function loadAllProjects(): DecisionProject[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    const list = Array.isArray(parsed) ? parsed : [];
    const deletedIds = getDeletedProjectIds();
    return list.filter((p) => p && p.id && !deletedIds.includes(p.id));
  } catch (e) {
    console.error('Failed to load projects:', e);
    return [];
  }
}

export function saveProjects(projects: DecisionProject[]): void {
  try {
    const deletedIds = getDeletedProjectIds();
    const filtered = projects.filter((p) => p && p.id && !deletedIds.includes(p.id));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error('Failed to save projects:', e);
  }
}

export function saveSingleProject(project: DecisionProject): DecisionProject[] {
  const deletedIds = getDeletedProjectIds();
  if (deletedIds.includes(project.id)) {
    // If it was previously marked as deleted, remove from deleted tombstone list
    const updatedDeleted = deletedIds.filter((id) => id !== project.id);
    localStorage.setItem(DELETED_PROJECTS_KEY, JSON.stringify(updatedDeleted));
  }

  const all = loadAllProjects();
  const updated = { ...project, updatedAt: Date.now() };
  const index = all.findIndex((p) => p.id === project.id);
  if (index >= 0) {
    all[index] = updated;
  } else {
    all.unshift(updated);
  }
  saveProjects(all);
  localStorage.setItem(ACTIVE_PROJECT_KEY, project.id);
  syncProjectToFirestore(updated);
  return all;
}

export function deleteProject(id: string): DecisionProject[] {
  recordDeletedProjectId(id);
  const all = loadAllProjects();
  const filtered = all.filter((p) => p.id !== id);
  saveProjects(filtered);
  const activeId = getActiveProjectId();
  if (activeId === id) {
    localStorage.removeItem(ACTIVE_PROJECT_KEY);
  }
  deleteProjectFromFirestore(id);
  return filtered;
}

export function clearAllProjects(): DecisionProject[] {
  const all = loadAllProjects();
  all.forEach((p) => {
    recordDeletedProjectId(p.id);
    deleteProjectFromFirestore(p.id);
  });
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(ACTIVE_PROJECT_KEY);
  return [];
}

export function getActiveProjectId(): string | null {
  return localStorage.getItem(ACTIVE_PROJECT_KEY);
}

export function setActiveProjectId(id: string): void {
  localStorage.setItem(ACTIVE_PROJECT_KEY, id);
}

export function exportProjectToJson(project: DecisionProject): void {
  try {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(project, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${(project.title || 'decision_analysis').toLowerCase().replace(/[^a-z0-9]/g, '_')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  } catch (err) {
    console.error("Failed to export JSON file:", err);
  }
}

