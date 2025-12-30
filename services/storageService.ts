import { SavedBento, SiteData, BlockType } from '../types';
import { AVATAR_PLACEHOLDER } from '../constants';

const STORAGE_KEY = 'openbento_bentos';
const ACTIVE_BENTO_KEY = 'openbento_active_bento';

// Default data for new bentos
const DEFAULT_PROFILE = {
  name: "My Bento",
  bio: "Digital creator & developer.\nBuilding awesome things.",
  avatarUrl: AVATAR_PLACEHOLDER,
  theme: 'light' as const,
  primaryColor: 'blue'
};

const DEFAULT_BLOCKS = [
  { 
    id: '1', 
    type: BlockType.LINK, 
    title: 'My Website', 
    subtext: 'Visit my site', 
    content: 'https://example.com', 
    colSpan: 1, 
    rowSpan: 1, 
    color: 'bg-gray-900', 
    textColor: 'text-white' 
  },
];

// Generate unique ID
const generateId = (): string => {
  return `bento_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Get all saved bentos
export const getAllBentos = (): SavedBento[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (e) {
    console.error('Failed to get bentos from localStorage:', e);
    return [];
  }
};

// Get a specific bento by ID
export const getBento = (id: string): SavedBento | null => {
  const bentos = getAllBentos();
  return bentos.find(b => b.id === id) || null;
};

// Save a bento (create or update)
export const saveBento = (bento: SavedBento): void => {
  try {
    const bentos = getAllBentos();
    const existingIndex = bentos.findIndex(b => b.id === bento.id);
    
    const updatedBento = {
      ...bento,
      updatedAt: Date.now()
    };
    
    if (existingIndex >= 0) {
      bentos[existingIndex] = updatedBento;
    } else {
      bentos.push(updatedBento);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bentos));
  } catch (e) {
    console.error('Failed to save bento to localStorage:', e);
  }
};

// Create a new bento with default data
export const createBento = (name: string): SavedBento => {
  const now = Date.now();
  const newBento: SavedBento = {
    id: generateId(),
    name: name || `Bento ${getAllBentos().length + 1}`,
    createdAt: now,
    updatedAt: now,
    data: {
      profile: { ...DEFAULT_PROFILE, name: name || 'My Bento' },
      blocks: [...DEFAULT_BLOCKS.map(b => ({ ...b, id: generateId() }))]
    }
  };
  
  saveBento(newBento);
  setActiveBentoId(newBento.id);
  
  return newBento;
};

// Delete a bento
export const deleteBento = (id: string): void => {
  try {
    const bentos = getAllBentos().filter(b => b.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bentos));
    
    // If deleted bento was active, clear active
    if (getActiveBentoId() === id) {
      localStorage.removeItem(ACTIVE_BENTO_KEY);
    }
  } catch (e) {
    console.error('Failed to delete bento from localStorage:', e);
  }
};

// Get the currently active bento ID
export const getActiveBentoId = (): string | null => {
  try {
    return localStorage.getItem(ACTIVE_BENTO_KEY);
  } catch (e) {
    return null;
  }
};

// Set the active bento ID
export const setActiveBentoId = (id: string): void => {
  try {
    localStorage.setItem(ACTIVE_BENTO_KEY, id);
  } catch (e) {
    console.error('Failed to set active bento ID:', e);
  }
};

// Get the active bento, or create a default one if none exists
export const getOrCreateActiveBento = (): SavedBento => {
  const activeId = getActiveBentoId();
  
  if (activeId) {
    const bento = getBento(activeId);
    if (bento) return bento;
  }
  
  // Check if there are any bentos
  const bentos = getAllBentos();
  if (bentos.length > 0) {
    setActiveBentoId(bentos[0].id);
    return bentos[0];
  }
  
  // Create a new default bento
  return createBento('My First Bento');
};

// Update just the data of a bento (for auto-save)
export const updateBentoData = (id: string, data: SiteData): void => {
  const bento = getBento(id);
  if (bento) {
    saveBento({
      ...bento,
      data,
      updatedAt: Date.now()
    });
  }
};

// Rename a bento
export const renameBento = (id: string, newName: string): void => {
  const bento = getBento(id);
  if (bento) {
    saveBento({
      ...bento,
      name: newName,
      updatedAt: Date.now()
    });
  }
};

