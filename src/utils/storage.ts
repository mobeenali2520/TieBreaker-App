import { DecisionProject } from '../types/decision';
import { PRESET_TEMPLATES } from '../data/templates';
import { doc, setDoc, deleteDoc, collection, getDocs } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

const STORAGE_KEY = 'decidewise_projects_v1';
const ACTIVE_PROJECT_KEY = 'decidewise_active_id';

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
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Failed to load projects:', e);
    return [];
  }
}

export function saveProjects(projects: DecisionProject[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch (e) {
    console.error('Failed to save projects:', e);
  }
}

export function saveSingleProject(project: DecisionProject): DecisionProject[] {
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

export function getActiveProjectId(): string | null {
  return localStorage.getItem(ACTIVE_PROJECT_KEY);
}

export function setActiveProjectId(id: string): void {
  localStorage.setItem(ACTIVE_PROJECT_KEY, id);
}

export function exportProjectToJson(project: DecisionProject): void {
  // Export as PDF document instead of .json as requested
  import('./exportUtils').then(({ exportProjectToPdf }) => {
    exportProjectToPdf(project);
  }).catch(() => {
    window.print();
  });
}
