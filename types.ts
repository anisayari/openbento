export enum BlockType {
  LINK = 'LINK',
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  SOCIAL = 'SOCIAL',
  MAP = 'MAP',
  SPACER = 'SPACER'
}

export interface BlockData {
  id: string;
  type: BlockType;
  title?: string;
  content?: string; // URL or Text
  subtext?: string;
  imageUrl?: string;
  colSpan: number; // 1, 2, or 3
  rowSpan: number; // 1 or 2
  color?: string; // Tailwind class like 'bg-blue-100'
  customBackground?: string; // Raw CSS value (hex or gradient)
  textColor?: string; // 'text-black' or 'text-white'
  rotation?: number; // Removed usage, kept for type safety if needed, or remove.
  
  // Grid positioning (explicit placement)
  gridColumn?: number; // 1-based column start position
  gridRow?: number; // 1-based row start position
  
  // YouTube specific
  channelId?: string; // Persist the ID for dynamic fetching
  youtubeVideoId?: string; // For Single Mode (fallback or initial)
  channelTitle?: string;
  youtubeMode?: 'single' | 'grid' | 'list';
  youtubeVideos?: Array<{ id: string; title: string; thumbnail: string }>;
}

export interface UserProfile {
  name: string;
  bio: string;
  avatarUrl: string;
  theme: 'light' | 'dark';
  primaryColor: string;
}

export interface SiteData {
  profile: UserProfile;
  blocks: BlockData[];
}

export interface SavedBento {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  data: SiteData;
}