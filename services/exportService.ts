import JSZip from 'jszip';
import saveAs from 'file-saver';
import { SiteData, BlockData, BlockType, SocialPlatform } from '../types';
import { GITHUB_WORKFLOW_YAML, BASE_COLORS } from '../constants';
import { COMMON_BLOCK_CSS } from './commonStyles';
import { buildSocialUrl, formatFollowerCount, getSocialPlatformOption } from '../socialPlatforms';

// --- HELPERS ---

function base64ToBlob(base64: string): Blob | null {
  try {
    const arr = base64.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) return null;
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  } catch (e) {
    return null;
  }
}

function getStyleFromClass(className: string | undefined, type: 'bg' | 'text'): string {
    if (!className) return type === 'bg' ? '#ffffff' : '#000000';
    if (className === 'bg-transparent') return 'transparent';
    
    const colorDef = BASE_COLORS.find(c => (type === 'bg' ? c.bg : c.text) === className);
    if (colorDef) {
        return type === 'bg' ? (colorDef.hex || '#fff') : (colorDef.textHex || '#000');
    }
    return type === 'bg' ? '#ffffff' : '#000000';
}

const SIMPLE_ICON_SLUGS: Partial<Record<SocialPlatform, string>> = {
  x: 'x',
  instagram: 'instagram',
  tiktok: 'tiktok',
  youtube: 'youtube',
  github: 'github',
  gitlab: 'gitlab',
  linkedin: 'linkedin',
  facebook: 'facebook',
  twitch: 'twitch',
  dribbble: 'dribbble',
  medium: 'medium',
  devto: 'devdotto',
  reddit: 'reddit',
  pinterest: 'pinterest',
  threads: 'threads',
  bluesky: 'bluesky',
  mastodon: 'mastodon',
  substack: 'substack',
  patreon: 'patreon',
  kofi: 'kofi',
  buymeacoffee: 'buymeacoffee',
  snapchat: 'snapchat',
  discord: 'discord',
  telegram: 'telegram',
  whatsapp: 'whatsapp',
};

const getSimpleIconSrc = (platform: SocialPlatform | undefined, color?: string) => {
  if (!platform) return '';
  const slug = SIMPLE_ICON_SLUGS[platform];
  if (!slug) return '';
  const sanitized = color ? color.replace('#', '').trim() : '';
  return sanitized ? `https://cdn.simpleicons.org/${slug}/${sanitized}` : `https://cdn.simpleicons.org/${slug}`;
};

const resolveIconColor = (textColor?: string, brandColor?: string) => {
  if (!textColor || textColor === 'text-brand') return brandColor;
  if (textColor === 'text-black') return '#000000';
  if (textColor === 'text-white') return '#ffffff';
  if (textColor === 'text-gray-700') return '#374151';
  if (textColor === 'text-gray-900') return '#111827';
  return brandColor;
};

// --- CONTENT GENERATORS ---

interface BackgroundConfig {
  backgroundColor?: string;
  backgroundImage?: string;
  backgroundBlur?: number;
}

const generateCSS = (profileName: string, bgConfig?: BackgroundConfig) => {
  const bgColor = bgConfig?.backgroundColor || '#f8fafc';
  const bgImage = bgConfig?.backgroundImage;
  const bgBlur = bgConfig?.backgroundBlur || 0;

  const bodyBackground = bgImage
    ? `background-image: url('${bgImage}'); background-size: cover; background-position: center; background-attachment: fixed;`
    : `background: ${bgColor};`;

  return `
${COMMON_BLOCK_CSS}
:root {
  --font-family: 'Inter', system-ui, -apple-system, sans-serif;
  --bg-color: ${bgColor};
  --text-main: #111827;
  --text-muted: #6b7280;
  --radius: 1.75rem;
  --gap: 1.25rem;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: var(--font-family);
  ${bodyBackground}
  color: var(--text-main);
  min-height: 100vh;
  opacity: 0;
  animation: fadeInBody 0.8s ease-out forwards;
  position: relative;
}

/* Background blur overlay */
.bg-blur-overlay {
  position: fixed;
  inset: 0;
  z-index: 0;
  backdrop-filter: blur(${bgBlur}px);
  -webkit-backdrop-filter: blur(${bgBlur}px);
  pointer-events: none;
}

@keyframes fadeInBody {
  from { opacity: 0; }
  to { opacity: 1; }
}

.container {
  max-width: 1600px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 1;
}

/* Left Profile */
.profile-section {
  padding: 2rem 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  position: relative;
  z-index: 20;
}

@media (min-width: 640px) {
  .profile-section { padding: 3rem 1.5rem; }
}

@media (min-width: 1024px) {
  .profile-section { padding: 4rem 2rem; }
}

.avatar {
  width: 6rem;
  height: 6rem;
  border-radius: 1rem;
  overflow: hidden;
  margin-bottom: 1rem;
  box-shadow: 0 25px 50px -12px rgba(0,0,0,0.15);
  border: 3px solid white;
  background: #f3f4f6;
  transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
}

@media (min-width: 640px) {
  .avatar { width: 7rem; height: 7rem; border-radius: 1.25rem; margin-bottom: 1.25rem; }
}

.avatar:hover {
  transform: scale(1.05) rotate(2deg);
  box-shadow: 0 30px 60px -15px rgba(0,0,0,0.2);
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.avatar:hover img {
  transform: scale(1.1);
}

.profile-name {
  font-size: 1.5rem;
  font-weight: 800;
  letter-spacing: -0.04em;
  margin-bottom: 0.5rem;
  line-height: 1;
  color: var(--text-main);
}

.profile-bio {
  font-size: 0.85rem;
  color: var(--text-muted);
  white-space: pre-wrap;
  max-width: 20rem;
  line-height: 1.5;
  font-weight: 500;
}

@media (min-width: 640px) {
  .profile-name { font-size: 2rem; margin-bottom: 0.6rem; }
  .profile-bio { font-size: 0.9rem; line-height: 1.6; }
}

@media (min-width: 1024px) {
  .profile-name { font-size: 2.5rem; margin-bottom: 0.75rem; }
  .profile-bio { font-size: 1rem; line-height: 1.7; }
}

.profile-socials {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 1.5rem;
  justify-content: center;
}

.profile-social {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 999px;
  background: #ffffff;
  text-decoration: none;
  color: var(--text-main);
  font-weight: 600;
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.profile-social.icon-only {
  width: 2.5rem;
  height: 2.5rem;
  padding: 0;
  justify-content: center;
}

.profile-social:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 18px rgba(0, 0, 0, 0.12);
}

.profile-social .social-icon {
  width: 1.25rem;
  height: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.profile-social .social-icon img {
  width: 100%;
  height: 100%;
  display: block;
}

.profile-social .social-fallback {
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--text-main);
}

.profile-social .social-count {
  font-size: 0.85rem;
  color: var(--text-main);
}

/* Right Grid */
.grid-section {
  padding: 1rem;
  flex: 1;
}

.bento-grid {
  display: grid;
  grid-template-columns: 1fr; /* Mobile default */
  gap: var(--gap);
  grid-auto-rows: 64px;
  grid-auto-flow: dense;
  padding-bottom: 2rem;
}

.bento-item {
  position: relative;
  border-radius: var(--radius);
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
  display: block;
  text-decoration: none;
  color: inherit;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.04), 0 2px 4px -1px rgba(0, 0, 0, 0.02), 0 0 0 1px rgba(0, 0, 0, 0.03);
  opacity: 0;
  transform: translateY(20px);
  animation: slideUpFade 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
}

@keyframes slideUpFade {
  to { opacity: 1; transform: translateY(0); }
}

/* Stagger Animations via nth-child logic handled roughly by pure css or via js delay injection if needed. 
   Here we use a simple generic delay sequence for up to 12 items */
.bento-item:nth-child(1) { animation-delay: 0.1s; }
.bento-item:nth-child(2) { animation-delay: 0.15s; }
.bento-item:nth-child(3) { animation-delay: 0.2s; }
.bento-item:nth-child(4) { animation-delay: 0.25s; }
.bento-item:nth-child(5) { animation-delay: 0.3s; }
.bento-item:nth-child(6) { animation-delay: 0.35s; }
.bento-item:nth-child(7) { animation-delay: 0.4s; }
.bento-item:nth-child(8) { animation-delay: 0.45s; }

/* Apple TV 3D tilt effect */
.bento-item {
  transform-style: preserve-3d;
  will-change: transform;
}

.bento-item::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: radial-gradient(circle at var(--glare-x, 50%) var(--glare-y, 50%), rgba(255,255,255,0.25) 0%, transparent 60%);
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
  z-index: 20;
}

.bento-item:hover::before {
  opacity: 1;
}

.bento-item:active {
  transform: perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(0.95, 0.95, 0.95) !important;
}

.bento-item.no-hover:hover {
  transform: none;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  cursor: default;
}

.social-icon-block {
  display: flex;
  align-items: center;
  justify-content: center;
}

.social-icon-block .social-icon {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.social-icon-block .social-icon img {
  width: 100%;
  height: 100%;
  display: block;
}

.social-icon-block .social-fallback {
  font-size: 0.9rem;
  font-weight: 700;
  color: currentColor;
}

/* Inner Content Layouts */
.content-wrapper {
  padding: 0.75rem;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
  z-index: 10;
}

@media (min-width: 640px) {
  .content-wrapper { padding: 1rem; }
}

@media (min-width: 1024px) {
  .content-wrapper { padding: 1.75rem; }
}

.content-wrapper.link-only {
  justify-content: flex-end;
}

.icon-box {
  width: 2rem;
  height: 2rem;
  border-radius: 0.5rem;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
}

.icon-box img {
  width: 1rem;
  height: 1rem;
  display: block;
}

.icon-box .icon-fallback {
  font-size: 0.65rem;
  font-weight: 700;
}

@media (min-width: 640px) {
  .icon-box { width: 2.5rem; height: 2.5rem; border-radius: 0.75rem; }
  .icon-box img { width: 1.2rem; height: 1.2rem; }
  .icon-box .icon-fallback { font-size: 0.75rem; }
}

@media (min-width: 1024px) {
  .icon-box { width: 3rem; height: 3rem; border-radius: 1rem; }
  .icon-box img { width: 1.4rem; height: 1.4rem; }
  .icon-box .icon-fallback { font-size: 0.85rem; }
}

.block-title {
  font-weight: 800;
  font-size: 0.85rem;
  line-height: 1.1;
  letter-spacing: -0.02em;
}

.block-sub {
  opacity: 0.8;
  font-size: 0.7rem;
  margin-top: 0.25rem;
  font-weight: 500;
}

@media (min-width: 640px) {
  .block-title { font-size: 1rem; }
  .block-sub { font-size: 0.8rem; margin-top: 0.3rem; }
}

@media (min-width: 1024px) {
  .block-title { font-size: 1.25rem; }
  .block-sub { font-size: 0.9rem; margin-top: 0.35rem; }
}

/* Specific Types */
.type-text { justify-content: center; }
.type-text .block-title { font-size: 1rem; margin-bottom: 0.35rem; letter-spacing: -0.03em; }
.type-text .block-body { opacity: 0.8; line-height: 1.5; font-size: 0.75rem; }

@media (min-width: 640px) {
  .type-text .block-title { font-size: 1.35rem; margin-bottom: 0.4rem; }
  .type-text .block-body { font-size: 0.9rem; }
}

@media (min-width: 1024px) {
  .type-text .block-title { font-size: 1.75rem; margin-bottom: 0.5rem; }
  .type-text .block-body { font-size: 1.1rem; line-height: 1.6; }
}

/* Smaller blocks: reduce text sizes */
.bento-item.size-xs .block-title { font-size: 0.7rem; }
.bento-item.size-xs .block-sub { font-size: 0.55rem; }
.bento-item.size-xs .block-body { font-size: 0.65rem; }
.bento-item.size-xs .type-text .block-title { font-size: 0.8rem; }

.bento-item.size-sm .block-title { font-size: 0.8rem; }
.bento-item.size-sm .block-sub { font-size: 0.65rem; }
.bento-item.size-sm .block-body { font-size: 0.75rem; }
.bento-item.size-sm .type-text .block-title { font-size: 1rem; }

@media (min-width: 640px) {
  .bento-item.size-xs .block-title { font-size: 0.85rem; }
  .bento-item.size-xs .block-sub { font-size: 0.65rem; }
  .bento-item.size-xs .type-text .block-title { font-size: 1rem; }
  .bento-item.size-sm .block-title { font-size: 0.95rem; }
  .bento-item.size-sm .block-sub { font-size: 0.75rem; }
  .bento-item.size-sm .type-text .block-title { font-size: 1.2rem; }
}

@media (min-width: 1024px) {
  .bento-item.size-xs .block-title { font-size: 0.95rem; }
  .bento-item.size-xs .block-sub { font-size: 0.7rem; }
  .bento-item.size-xs .block-body { font-size: 0.85rem; }
  .bento-item.size-xs .type-text .block-title { font-size: 1.1rem; }
  .bento-item.size-sm .block-title { font-size: 1.05rem; }
  .bento-item.size-sm .block-sub { font-size: 0.8rem; }
  .bento-item.size-sm .block-body { font-size: 0.95rem; }
  .bento-item.size-sm .type-text .block-title { font-size: 1.35rem; }
}

.full-img {
  position: absolute;
  top: 0; left: 0;
}

/* YouTube Adaptive Styles */
.yt-container {
  background: white;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 1rem;
}

.yt-container.size-large { padding: 1.25rem; }
.yt-container.size-small { padding: 0.75rem; }

.yt-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding-bottom: 0.75rem;
  margin-bottom: 0.75rem;
  border-bottom: 1px solid #f3f4f6;
}

.yt-icon {
  width: 2rem;
  height: 2rem;
  border-radius: 0.5rem;
  background: #dc2626;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(220, 38, 38, 0.2);
  flex-shrink: 0;
}

.size-large .yt-icon { width: 2.25rem; height: 2.25rem; border-radius: 0.75rem; }
.size-small .yt-icon { width: 1.75rem; height: 1.75rem; }

.yt-header-text h3 {
  font-size: 0.875rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.size-small .yt-header-text h3 { font-size: 0.75rem; }
.size-small .yt-header-text span { display: none; }

.yt-header-text span {
  font-size: 0.65rem;
  color: #9ca3af;
  font-weight: 500;
  display: block;
}

.yt-videos {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  flex: 1;
  overflow: hidden;
}

.size-small .yt-videos { gap: 0.375rem; }
.size-tall .yt-videos { grid-template-columns: 1fr; gap: 0.5rem; }

.yt-thumb-card {
  position: relative;
  background: #f3f4f6;
  border-radius: 0.5rem;
  overflow: hidden;
  text-decoration: none;
  transition: all 0.2s ease;
  aspect-ratio: 16/9;
}

.size-small .yt-thumb-card { aspect-ratio: 16/10; border-radius: 0.375rem; }

.yt-thumb-card:hover { 
  transform: scale(1.02);
  box-shadow: 0 8px 12px -3px rgba(0, 0, 0, 0.1);
}

.yt-thumb-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Tall block - horizontal list style */
.size-tall .yt-thumb-card {
  aspect-ratio: auto;
  display: flex;
  gap: 0.5rem;
  height: auto;
  min-height: 3rem;
}

.size-tall .yt-thumb-card .thumb-wrapper {
  width: 5rem;
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
  border-radius: 0.375rem;
}

.size-tall .yt-thumb-card .thumb-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.size-tall .yt-thumb-card .meta {
  flex: 1;
  display: flex;
  align-items: center;
  padding-right: 0.5rem;
}

.size-tall .yt-thumb-card .title {
  font-size: 0.7rem;
  font-weight: 600;
  color: #374151;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.3;
}

.yt-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.yt-thumb-card:hover .yt-overlay { opacity: 1; }

.yt-play-btn {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background: #ef4444;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 8px rgba(239, 68, 68, 0.3);
  transform: scale(0.9);
  transition: transform 0.2s ease;
}

.size-small .yt-play-btn { width: 1.5rem; height: 1.5rem; }
.yt-thumb-card:hover .yt-play-btn { transform: scale(1); }

.yt-caption {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  padding: 0.375rem;
  color: white;
  font-size: 0.6rem;
  font-weight: 600;
  line-height: 1.2;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.size-large .yt-caption { font-size: 0.65rem; -webkit-line-clamp: 2; padding: 0.5rem; }
.size-small .yt-caption { display: none; }
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* YouTube Single Video Style */
.yt-single {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.yt-single-bg {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  transition: transform 0.5s ease;
}

.bento-item:hover .yt-single-bg {
  transform: scale(1.05);
}

.yt-single-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.55);
}

.yt-single-content {
  position: relative;
  z-index: 10;
  padding: 1.5rem;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  color: white;
}

.yt-single-icon {
  width: 3rem;
  height: 3rem;
  border-radius: 1rem;
  background: rgba(255,255,255,0.2);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.yt-single-play {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 4rem;
  height: 4rem;
  border-radius: 50%;
  background: #ef4444;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(239, 68, 68, 0.4);
  transition: transform 0.3s ease;
  z-index: 15;
}

.bento-item:hover .yt-single-play {
  transform: translate(-50%, -50%) scale(1.1);
}

.yt-single-info {
  background: rgba(0,0,0,0.4);
  backdrop-filter: blur(4px);
  margin: -1.5rem;
  margin-top: auto;
  padding: 1.25rem;
}

.yt-single-info h3 {
  font-size: 1.125rem;
  font-weight: 700;
  margin: 0;
  line-height: 1.3;
}

.yt-single-info p {
  font-size: 0.875rem;
  opacity: 0.7;
  margin: 0.25rem 0 0;
  font-weight: 500;
}

/* YouTube Grid New Design - Responsive based on aspect ratio */
.yt-grid-new {
  display: flex;
  height: 100%;
  padding: 0.5rem;
  gap: 0.5rem;
}

/* Default: landscape (wider than tall) - horizontal layout */
.yt-grid-new {
  flex-direction: row;
}
.yt-grid-new .yt-header {
  width: 28%;
  flex-direction: column;
  justify-content: center;
}
.yt-grid-new .yt-subscribe-btn {
  align-self: flex-start;
}

/* Portrait (taller than wide) - vertical layout */
.yt-grid-new.yt-portrait {
  flex-direction: column;
}
.yt-grid-new.yt-portrait .yt-header {
  width: 100%;
  flex-direction: row;
  align-items: center;
}
.yt-grid-new.yt-portrait .yt-channel-name {
  flex: 1;
}
.yt-grid-new.yt-portrait .yt-subscribe-btn {
  align-self: center;
}

.yt-header {
  display: flex;
  gap: 0.375rem;
  flex-shrink: 0;
}

.yt-logo {
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 0.375rem;
  background: #ef4444;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(239, 68, 68, 0.3);
  flex-shrink: 0;
}

.yt-logo svg {
  width: 0.875rem;
  height: 0.875rem;
}

.yt-channel-name {
  font-size: 0.5625rem;
  font-weight: 700;
  color: #111827;
  line-height: 1.2;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.yt-subscribe-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.125rem;
  background: #ef4444;
  color: white;
  font-weight: 600;
  font-size: 0.5rem;
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  text-decoration: none;
  box-shadow: 0 2px 4px rgba(239, 68, 68, 0.25);
  transition: all 0.2s ease;
}

.yt-subscribe-btn:hover {
  background: #dc2626;
}

.yt-sub-count {
  opacity: 0.9;
}

.yt-grid-area {
  flex: 1;
  min-width: 0;
  min-height: 0;
}

.yt-video-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: 0.25rem;
  height: 100%;
}

.yt-loading {
  grid-column: span 2;
  grid-row: span 2;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  font-size: 0.5rem;
}

.yt-video-grid .yt-thumb-card {
  border-radius: 0.375rem;
  overflow: hidden;
}

@media (min-width: 768px) {
  .yt-grid-new { padding: 0.75rem; gap: 0.5rem; }
  .yt-header { gap: 0.5rem; }
  .yt-logo { width: 2rem; height: 2rem; }
  .yt-logo svg { width: 1rem; height: 1rem; }
  .yt-channel-name { font-size: 0.75rem; }
  .yt-subscribe-btn { font-size: 0.625rem; padding: 0.25rem 0.625rem; }
  .yt-video-grid { gap: 0.375rem; }
  .yt-video-grid .yt-thumb-card { border-radius: 0.5rem; }
}

/* Footer */
footer {
  width: 100%;
  padding: 3rem 0 2rem;
  text-align: center;
  font-size: 0.875rem;
  color: var(--text-muted);
  font-weight: 500;
}

footer p {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

footer .heart {
  color: #f87171;
  animation: heartbeat 1.5s ease-in-out infinite;
}

footer a {
  color: var(--text-muted);
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s ease;
}

footer a:hover {
  color: #8b5cf6;
}

@keyframes heartbeat {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.15); }
}

/* Responsive */
/* Mobile: Reset grid positioning to stack blocks naturally */
@media (max-width: 639px) {
  .bento-item {
    grid-column: auto !important;
    grid-row: auto !important;
  }
}

@media (min-width: 640px) {
  .bento-grid { grid-template-columns: repeat(9, 1fr); }
  .col-span-1 { grid-column: span 1; }
  .col-span-2 { grid-column: span 2; }
  .col-span-3 { grid-column: span 3; }
  .col-span-4 { grid-column: span 4; }
  .col-span-5 { grid-column: span 5; }
  .col-span-6 { grid-column: span 6; }
  .col-span-7 { grid-column: span 7; }
  .col-span-8 { grid-column: span 8; }
  .col-span-9 { grid-column: span 9; }
  .row-span-2 { grid-row: span 2; }
}

@media (min-width: 1024px) {
  .container { flex-direction: row; }
  .profile-section {
    width: 450px;
    height: 100vh;
    position: sticky;
    top: 0;
    align-items: flex-start;
    text-align: left;
    padding: 6rem 4rem;
  }
  .grid-section { padding: 6rem 4rem 4rem; }
  .avatar { width: 12rem; height: 12rem; }
  .profile-name { font-size: 3rem; }
  .profile-socials { justify-content: flex-start; }
}

`;
};

// SECURITY: Escape HTML special characters to prevent XSS
const escapeHtml = (value: string | undefined | null): string => {
  if (!value) return '';
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
};

const escapeAttr = (value: string) => escapeHtml(value);

const generateJS = (opts: { analytics?: { enabled: boolean; supabaseUrl: string; anonKey: string; siteId: string } }) => `
document.addEventListener('DOMContentLoaded', () => {
    // --- Apple TV 3D Tilt Effect ---
    const bentoItems = document.querySelectorAll('.bento-item:not(.no-hover)');

    bentoItems.forEach(item => {
        item.addEventListener('mousemove', (e) => {
            const rect = item.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            // Calculate rotation (max 10 degrees for subtle Apple TV effect)
            const rotateX = ((y - centerY) / centerY) * -10;
            const rotateY = ((x - centerX) / centerX) * 10;

            // Calculate glare position
            const glareX = (x / rect.width) * 100;
            const glareY = (y / rect.height) * 100;

            // Dynamic shadow based on tilt direction
            const shadowX = rotateY * 1.5;
            const shadowY = rotateX * -1.5;

            item.style.transform = \`perspective(800px) rotateX(\${rotateX}deg) rotateY(\${rotateY}deg) scale3d(1.02, 1.02, 1.02)\`;
            item.style.boxShadow = \`\${shadowX}px \${shadowY}px 25px rgba(0,0,0,0.15), 0 8px 30px rgba(0,0,0,0.1)\`;
            item.style.transition = 'transform 0.1s ease-out, box-shadow 0.1s ease-out';
            item.style.setProperty('--glare-x', glareX + '%');
            item.style.setProperty('--glare-y', glareY + '%');
        });

        item.addEventListener('mouseleave', () => {
            item.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
            item.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
            item.style.transition = 'transform 0.5s ease-out, box-shadow 0.5s ease-out';
        });

        item.addEventListener('mouseenter', () => {
            item.style.transition = 'transform 0.1s ease-out, box-shadow 0.1s ease-out';
        });
    });

    // --- Analytics (page views + outbound clicks via Supabase REST API) ---
    const analytics = ${opts.analytics ? JSON.stringify(opts.analytics) : 'null'};

    // Generate unique visitor ID (persisted in localStorage)
    const getVisitorId = () => {
        let id = localStorage.getItem('_ob_vid');
        if (!id) {
            id = 'v_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
            localStorage.setItem('_ob_vid', id);
        }
        return id;
    };

    // Session tracking
    const sessionStart = Date.now();
    let maxScroll = 0;
    let lastActivity = Date.now();

    // Track scroll depth
    window.addEventListener('scroll', () => {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = docHeight > 0 ? Math.round((scrollTop / docHeight) * 100) : 0;
        maxScroll = Math.max(maxScroll, scrollPercent);
        lastActivity = Date.now();
    }, { passive: true });

    const track = async (eventType, extra = {}) => {
        if (!analytics || !analytics.supabaseUrl || !analytics.anonKey) return;
        try {
            const utm = new URLSearchParams(window.location.search);
            const payload = {
                site_id: analytics.siteId,
                event_type: eventType,
                visitor_id: getVisitorId(),
                session_id: sessionStart.toString(36),
                page_url: window.location.href,
                referrer: document.referrer || null,
                utm_source: utm.get('utm_source') || null,
                utm_medium: utm.get('utm_medium') || null,
                utm_campaign: utm.get('utm_campaign') || null,
                utm_term: utm.get('utm_term') || null,
                utm_content: utm.get('utm_content') || null,
                user_agent: navigator.userAgent,
                language: navigator.language,
                screen_w: window.screen?.width || null,
                screen_h: window.screen?.height || null,
                viewport_w: window.innerWidth || null,
                viewport_h: window.innerHeight || null,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || null,
                ...extra
            };
            const endpoint = analytics.supabaseUrl + '/rest/v1/openbento_analytics_events';
            const headers = {
                'Content-Type': 'application/json',
                'apikey': analytics.anonKey,
                'Authorization': 'Bearer ' + analytics.anonKey,
                'Prefer': 'return=minimal'
            };
            fetch(endpoint, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
                keepalive: true
            }).catch(() => {});
        } catch (_) {}
    };

    // Track page view
    track('page_view');

    // Track clicks on bento items
    document.addEventListener('click', (ev) => {
        const target = ev.target;
        if (!(target instanceof Element)) return;
        const link = target.closest('a.bento-item');
        if (!link) return;
        track('click', {
            block_id: link.getAttribute('data-block-id') || null,
            destination_url: link.getAttribute('href') || null,
            block_title: link.querySelector('.block-title')?.textContent || null
        });
    }, { capture: true });

    // Track session end (time on page, scroll depth)
    const trackSessionEnd = () => {
        const duration = Math.round((Date.now() - sessionStart) / 1000);
        track('session_end', {
            duration_seconds: duration,
            scroll_depth: maxScroll,
            engaged: duration > 10 && maxScroll > 25
        });
    };

    // Send session_end on page unload
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') trackSessionEnd();
    });
    window.addEventListener('pagehide', trackSessionEnd);

    // YouTube Grid Responsive Layout (aspect ratio based)
    const ytGrids = document.querySelectorAll('.yt-grid-new');
    const ytResizeObserver = new ResizeObserver(entries => {
        entries.forEach(entry => {
            const { width, height } = entry.contentRect;
            if (height > width) {
                entry.target.classList.add('yt-portrait');
            } else {
                entry.target.classList.remove('yt-portrait');
            }
        });
    });
    ytGrids.forEach(grid => ytResizeObserver.observe(grid));

    // YouTube Fetcher
    const fetchers = document.querySelectorAll('.youtube-fetcher');
    fetchers.forEach(async (el) => {
        const channelId = el.getAttribute('data-channel-id');
        const mode = el.getAttribute('data-mode');
        const sizeClass = el.getAttribute('data-size') || '';
        if(!channelId) return;

        try {
            const proxyUrl = 'https://api.allorigins.win/raw?url=' + encodeURIComponent('https://www.youtube.com/feeds/videos.xml?channel_id=' + channelId);
            const res = await fetch(proxyUrl);
            if(!res.ok) return;
            const text = await res.text();
            const parser = new DOMParser();
            const xml = parser.parseFromString(text, 'text/xml');
            const entries = Array.from(xml.querySelectorAll('entry'));
            const author = xml.querySelector('author > name')?.textContent;

            const titleEl = el.querySelector('[data-role="channel-title"]');
            if(titleEl && author) titleEl.textContent = author;

            // Adaptive video count based on size
            const container = el.querySelector('[data-role="video-container"]');
            const maxVideos = container?.getAttribute('data-max-videos') || 4;
            const isSmall = sizeClass === 'size-small';
            const isTall = sizeClass === 'size-tall';
            
            const videos = entries.slice(0, parseInt(maxVideos)).map(e => ({
                id: e.getElementsByTagName('yt:videoId')[0]?.textContent,
                title: e.getElementsByTagName('title')[0]?.textContent,
                thumb: 'https://img.youtube.com/vi/' + e.getElementsByTagName('yt:videoId')[0]?.textContent + '/mqdefault.jpg'
            }));

            if(videos.length === 0) return;

            if(mode === 'grid' || mode === 'list') {
                if(container) {
                    // New grid design with rounded thumbnails
                    container.innerHTML = videos.slice(0, 4).map(v => {
                        return \`<a href="https://www.youtube.com/watch?v=\${v.id}" target="_blank" class="yt-thumb-card">
                            <img src="\${v.thumb}" loading="lazy"/>
                            <div class="yt-overlay">
                                <div class="yt-play-btn">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><polygon points="10 8 16 12 10 16 10 8"/></svg>
                                </div>
                            </div>
                        </a>\`;
                    }).join('');
                }
            } else {
                const first = videos[0];
                const bg = el.querySelector('[data-role="bg-image"]');
                const title = el.querySelector('[data-role="video-title"]');
                const link = el.querySelector('[data-role="play-link"]');
                
                if(bg) bg.style.backgroundImage = 'url(https://img.youtube.com/vi/'+first.id+'/maxresdefault.jpg)';
                if(title) title.textContent = first.title;
                if(link) link.href = 'https://www.youtube.com/watch?v=' + first.id;
            }

        } catch(err) {
            console.error('Failed to fetch YouTube data', err);
        }
    });
});
`;

const generateHtml = (data: SiteData, imageMap: Record<string, string>): string => {
  const { profile, blocks } = data;
  const avatarSrc = imageMap['profile_avatar'] || profile.avatarUrl;
  const showBranding = profile.showBranding !== false;

  const resolvedAvatarStyle = profile.avatarStyle || {
    shape: 'rounded',
    shadow: true,
    border: true,
    borderColor: '#ffffff',
    borderWidth: 4,
  };
  const avatarRadius =
    resolvedAvatarStyle.shape === 'circle'
      ? '9999px'
      : resolvedAvatarStyle.shape === 'square'
        ? '0'
        : '1.5rem';
  const avatarShadow = resolvedAvatarStyle.shadow === false
    ? 'none'
    : '0 25px 50px -12px rgba(0,0,0,0.15)';
  const avatarBorder = resolvedAvatarStyle.border === false
    ? 'none'
    : `${resolvedAvatarStyle.borderWidth || 4}px solid ${resolvedAvatarStyle.borderColor || '#ffffff'}`;
  const avatarInlineStyle = `border-radius:${avatarRadius}; box-shadow:${avatarShadow}; border:${avatarBorder};`;

  const socialHeaderHtml = (() => {
    const accounts = profile.socialAccounts || [];
    if (!profile.showSocialInHeader || accounts.length === 0) return '';

    const items = accounts.map(account => {
      const option = getSocialPlatformOption(account.platform);
      const label = option?.label || account.platform;
      const url = buildSocialUrl(account.platform, account.handle);
      const count = profile.showFollowerCount ? formatFollowerCount(account.followerCount) : '';
      const hasCount = Boolean(count);
      const iconColor = option?.brandColor;
      const iconSrc = getSimpleIconSrc(account.platform, iconColor);
      const fallbackLetter = label.slice(0, 1).toUpperCase();
      const iconHtml = iconSrc
        ? `<span class="social-icon"><span class="social-fallback">${escapeHtml(fallbackLetter)}</span><img src="${escapeAttr(iconSrc)}" alt="${escapeAttr(label)}" onerror="this.style.display='none';" /></span>`
        : `<span class="social-icon"><span class="social-fallback">${escapeHtml(fallbackLetter)}</span></span>`;
      const countHtml = hasCount ? `<span class="social-count">${escapeHtml(count)}</span>` : '';
      const cls = hasCount ? 'profile-social' : 'profile-social icon-only';
      const tag = url ? 'a' : 'div';
      const href = url ? `href="${escapeAttr(url)}" target="_blank" rel="noopener noreferrer"` : '';
      return `<${tag} class="${cls}" ${href}>${iconHtml}${countHtml}</${tag}>`;
    });

    return `<div class="profile-socials">${items.join('')}</div>`;
  })();
  
  // Sort blocks by grid position (row first, then column) for correct visual order
  const sortedBlocks = [...blocks].sort((a, b) => {
    const aRow = a.gridRow ?? 999;
    const bRow = b.gridRow ?? 999;
    const aCol = a.gridColumn ?? 999;
    const bCol = b.gridColumn ?? 999;
    if (aRow !== bRow) return aRow - bRow;
    return aCol - bCol;
  });

  const renderBlock = (block: BlockData) => {
    let contentHtml = '';
    const blockImageSrc = block.imageUrl ? (imageMap[`block_${block.id}`] || block.imageUrl) : '';
    let explicitHref: string | null = null;
    let extraClass = '';

    let bgStyle = '';
    if (block.customBackground) {
        bgStyle = block.customBackground;
    } else {
        bgStyle = getStyleFromClass(block.color, 'bg');
    }

    const textStyle = getStyleFromClass(block.textColor, 'text');
    
    const colSpan = Math.min(block.colSpan, 9);
    const colClass = `col-span-${colSpan}`;
    const rowClass = block.rowSpan === 2 ? 'row-span-2' : '';
    const sizeTier = (() => {
      const minDim = Math.min(block.colSpan, block.rowSpan);
      const area = block.colSpan * block.rowSpan;
      if (minDim <= 1 || area <= 4) return 'xs';
      if (minDim <= 2 || area <= 8) return 'sm';
      if (minDim <= 3 || area <= 12) return 'md';
      return 'lg';
    })();
    const sizeClass = `size-${sizeTier}`;
    const isSpacer = block.type === BlockType.SPACER;
    const isInteractive = !isSpacer;

    // YOUTUBE
    if (block.type === BlockType.SOCIAL && block.channelId) {
        const mode = block.youtubeMode || 'single';
        const isMulti = mode === 'grid' || mode === 'list';
        
        // Determine size class for adaptive styling
        const isLarge = block.colSpan >= 2 && block.rowSpan >= 2;
        const isSmall = block.colSpan === 1 && block.rowSpan === 1;
        const isTall = block.colSpan === 1 && block.rowSpan >= 2;
        const sizeClass = isLarge ? 'size-large' : (isSmall ? 'size-small' : (isTall ? 'size-tall' : ''));

        // SECURITY: Validate channel ID format (UC followed by 22 alphanumeric chars)
        const safeChannelId = /^UC[a-zA-Z0-9_-]{22}$/.test(block.channelId) ? block.channelId : '';
        const fetcherAttrs = `data-channel-id="${escapeAttr(safeChannelId)}" data-mode="${escapeAttr(mode)}" data-size="${escapeAttr(sizeClass)}"`;

        if (isMulti) {
             const subscriberCount = block.subscriberCount ? escapeHtml(block.subscriberCount) : '';
             const subscribeUrl = safeChannelId ? `https://youtube.com/channel/${safeChannelId}?sub_confirmation=1` : '#';
             const subCountHtml = subscriberCount ? `<span class="yt-sub-count">${subscriberCount}</span>` : '';
             contentHtml = `
             <div class="youtube-fetcher yt-grid-new" ${fetcherAttrs}>
                <div class="yt-header">
                    <div class="yt-logo">
                        <svg viewBox="0 0 24 24" fill="white"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0C.488 3.45.029 5.804 0 12c.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0C23.512 20.55 23.971 18.196 24 12c-.029-6.185-.484-8.549-4.385-8.816zM9 16V8l8 3.993L9 16z"/></svg>
                    </div>
                    <h3 class="yt-channel-name" data-role="channel-title">${escapeHtml(block.channelTitle) || 'YouTube'}</h3>
                    <a href="${escapeAttr(subscribeUrl)}" target="_blank" rel="noopener noreferrer" class="yt-subscribe-btn">
                        <span>Subscribe</span>
                        ${subCountHtml}
                    </a>
                </div>
                <div class="yt-grid-area">
                    <div data-role="video-container" data-max-videos="4" class="yt-video-grid">
                        <div class="yt-loading">Loading...</div>
                    </div>
                </div>
             </div>`;
        } else {
             const vidId = block.youtubeVideoId || '';
             // SECURITY: Validate video ID format (alphanumeric, dash, underscore only)
             const safeVidId = /^[a-zA-Z0-9_-]+$/.test(vidId) ? vidId : '';
             const bgUrl = safeVidId ? `https://img.youtube.com/vi/${safeVidId}/maxresdefault.jpg` : '';
             contentHtml = `
             <div ${fetcherAttrs} class="yt-single">
                <div class="yt-single-bg" style="background-image:url('${escapeAttr(bgUrl)}');" data-role="bg-image"></div>
                <div class="yt-single-overlay"></div>
                <div class="yt-single-content">
                    <div class="yt-single-icon">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/><path d="m10 15 5-3-5-3z"/></svg>
                    </div>
                    <a href="#" target="_blank" data-role="play-link" class="yt-single-play">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><polygon points="10 8 16 12 10 16 10 8"/></svg>
                    </a>
                    <div class="yt-single-info">
                        <h3 data-role="channel-title">${escapeHtml(block.channelTitle || block.title)}</h3>
                        <p data-role="video-title">${escapeHtml(block.subtext)}</p>
                    </div>
                </div>
             </div>`;
        }
    }
    // STANDARD TYPES
    else {
        switch (block.type) {
            case BlockType.MEDIA:
                const mediaPos = block.mediaPosition || { x: 50, y: 50 };
                const mediaPosStyle = `object-position: ${mediaPos.x}% ${mediaPos.y}%;`;
                contentHtml = `<img src="${escapeAttr(blockImageSrc)}" class="full-img" style="${mediaPosStyle}" alt="${escapeAttr(block.title || '')}" />`;
                if (block.title) {
                  contentHtml += `
                  <div class="media-overlay">
                    <div class="media-title">${escapeHtml(block.title)}</div>
                    ${block.subtext ? `<div class="media-subtext">${escapeHtml(block.subtext)}</div>` : ''}
                  </div>`;
                }
                break;
            case BlockType.MAP:
                // SECURITY: Validate location string and add sandbox
                const location = block.content || 'Paris';
                const dangerousPatterns = [/^javascript:/i, /^data:/i, /^vbscript:/i, /^file:/i, /^about:/i, /^blob:/i];
                const isSafeLocation = !dangerousPatterns.some(p => p.test(location.trim()));
                contentHtml = isSafeLocation
                  ? `<iframe width="100%" height="100%" frameborder="0" sandbox="allow-scripts allow-same-origin" style="position:absolute; inset:0; filter:grayscale(0.5) contrast(1.1); pointer-events:none;" src="https://maps.google.com/maps?q=${encodeURIComponent(location)}&t=&z=13&ie=UTF8&iwloc=&output=embed"></iframe>`
                  : `<div style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; color:#9ca3af;">Invalid location</div>`;
                break;
            case BlockType.TEXT:
                contentHtml = `
                <div class="content-wrapper type-text">
                    <h3 class="block-title">${escapeHtml(block.title)}</h3>
                    <p class="block-body">${escapeHtml(block.content)}</p>
                </div>`;
                break;
            case BlockType.SOCIAL:
            case BlockType.LINK:
                const isLinkWithImage = block.type === BlockType.LINK && blockImageSrc;
                if (isLinkWithImage) {
                     const linkMediaPos = block.mediaPosition || { x: 50, y: 50 };
                     contentHtml = `
                     <div style="position:absolute; inset:0; background-image:url('${escapeAttr(blockImageSrc)}'); background-size:cover; background-position:${linkMediaPos.x}% ${linkMediaPos.y}%;" class="full-img"></div>
                     <div class="media-overlay">
                       <div class="media-title">${escapeHtml(block.title) || 'Link'}</div>
                       ${block.subtext ? `<div class="media-subtext">${escapeHtml(block.subtext)}</div>` : ''}
                     </div>`;
                } else {
                     if (block.type === BlockType.SOCIAL) {
                       const option = getSocialPlatformOption(block.socialPlatform);
                       const label = option?.label || 'Social';
                       const iconColor = resolveIconColor(block.textColor, option?.brandColor);
                       const iconSrc = getSimpleIconSrc(block.socialPlatform, iconColor);
                       const fallbackLetter = label.slice(0, 1).toUpperCase();
                       const iconHtml = iconSrc
                         ? `<img src="${escapeAttr(iconSrc)}" alt="${escapeAttr(label)}" onerror="this.style.display='none';" />`
                         : `<span class="icon-fallback">${escapeHtml(fallbackLetter)}</span>`;
                       contentHtml = `
                        <div class="content-wrapper">
                          <div class="icon-box">${iconHtml}</div>
                          <div>
                            <div class="block-title">${escapeHtml(block.title) || 'Link'}</div>
                            <div class="block-sub">${escapeHtml(block.subtext)}</div>
                          </div>
                        </div>`;
                       break;
                     }
                     contentHtml = `
                     <div class="content-wrapper link-only">
                         <div>
                             <div class="block-title">${escapeHtml(block.title) || 'Link'}</div>
                             <div class="block-sub">${escapeHtml(block.subtext)}</div>
                         </div>
                     </div>`;
                }
                break;
            case BlockType.SOCIAL_ICON: {
                const option = getSocialPlatformOption(block.socialPlatform);
                const label = option?.label || 'Social';
                const iconColor = resolveIconColor(block.textColor, option?.brandColor);
                const iconSrc = getSimpleIconSrc(block.socialPlatform, iconColor);
                const fallbackLetter = label.slice(0, 1).toUpperCase();
                const iconHtml = iconSrc
                  ? `<div class="social-icon"><span class="social-fallback">${escapeHtml(fallbackLetter)}</span><img src="${escapeAttr(iconSrc)}" alt="${escapeAttr(label)}" onerror="this.style.display='none';" /></div>`
                  : `<div class="social-icon"><span class="social-fallback">${escapeHtml(fallbackLetter)}</span></div>`;
                contentHtml = iconHtml;
                explicitHref = buildSocialUrl(block.socialPlatform, block.socialHandle) || null;
                extraClass = 'social-icon-block';
                break;
            }
            case BlockType.SPACER:
                contentHtml = ''; 
                break;
        }
    }

    const inferredHref =
      explicitHref ||
      (block.content && !block.channelId && block.type !== BlockType.TEXT ? block.content : '');
    const tag = inferredHref ? 'a' : 'div';
    const href = inferredHref ? `href="${escapeAttr(inferredHref)}" target="_blank" rel="noopener noreferrer"` : '';
    const analyticsAttrs = [
      `data-block-id="${escapeAttr(block.id)}"`,
      `data-block-type="${escapeAttr(block.type)}"`,
      block.type === BlockType.SOCIAL && block.socialPlatform ? `data-social-platform="${escapeAttr(block.socialPlatform)}"` : '',
      block.type === BlockType.SOCIAL && block.socialHandle ? `data-social-handle="${escapeAttr(block.socialHandle)}"` : '',
    ].filter(Boolean).join(' ');
    
    // Add explicit grid positioning for correct order
    let gridPosition = '';
    if (block.gridColumn !== undefined && block.gridRow !== undefined) {
      gridPosition = `grid-column: ${block.gridColumn} / span ${colSpan}; grid-row: ${block.gridRow} / span ${block.rowSpan};`;
    } else if (block.gridColumn !== undefined) {
      gridPosition = `grid-column: ${block.gridColumn} / span ${colSpan}; grid-row: span ${block.rowSpan};`;
    } else if (block.gridRow !== undefined) {
      gridPosition = `grid-column: span ${colSpan}; grid-row: ${block.gridRow} / span ${block.rowSpan};`;
    } else {
      gridPosition = `grid-column: span ${colSpan}; grid-row: span ${block.rowSpan};`;
    }
    const style = `background: ${bgStyle}; color: ${textStyle}; ${gridPosition}`;
    const noHover = !isInteractive ? 'no-hover' : '';

    return `<${tag} ${href} ${analyticsAttrs} class="bento-item ${colClass} ${rowClass} ${noHover} ${extraClass} ${sizeClass}" style="${style}">${contentHtml}</${tag}>`;
  };

  // Background blur overlay div
  const blurOverlayHtml = profile.backgroundImage && profile.backgroundBlur && profile.backgroundBlur > 0
    ? '<div class="bg-blur-overlay"></div>'
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(profile.name)}</title>
    <meta name="description" content="${escapeAttr(profile.bio.replace(/\n/g, ' '))}">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="styles.css">
    <script src="app.js" defer></script>
</head>
<body>
    ${blurOverlayHtml}
    <div class="container">
        <!-- Profile -->
        <div class="profile-section">
            <div class="avatar" style="${avatarInlineStyle}"><img src="${escapeAttr(avatarSrc)}" alt="${escapeAttr(profile.name)}"></div>
            <h1 class="profile-name">${escapeHtml(profile.name)}</h1>
            <p class="profile-bio">${escapeHtml(profile.bio)}</p>
            ${socialHeaderHtml}
        </div>

        <!-- Grid -->
        <div class="grid-section">
            <main class="bento-grid">
                ${sortedBlocks.map(renderBlock).join('')}
            </main>
        </div>
    </div>
    ${showBranding ? `
    <footer>
        <p>Made with <span class="heart">♥</span> using <a href="https://github.com/yoanbernabeu/openbento" target="_blank" rel="noopener noreferrer">OpenBento</a></p>
    </footer>` : ''}
</body>
</html>`;
};

export const generatePreviewSrcDoc = (data: SiteData, opts?: { siteId?: string }) => {
  const bgConfig: BackgroundConfig = {
    backgroundColor: data.profile.backgroundColor,
    backgroundImage: data.profile.backgroundImage,
    backgroundBlur: data.profile.backgroundBlur,
  };
  const css = generateCSS(data.profile.name, bgConfig);

  const analyticsSupabaseUrl = data.profile.analytics?.supabaseUrl?.trim().replace(/\/+$/, '') || '';
  const analyticsAnonKey = data.profile.analytics?.anonKey?.trim() || '';
  const analyticsEnabled = !!(data.profile.analytics?.enabled && analyticsSupabaseUrl && analyticsAnonKey && opts?.siteId);
  const analytics = analyticsEnabled
    ? {
        enabled: true,
        supabaseUrl: analyticsSupabaseUrl,
        anonKey: analyticsAnonKey,
        siteId: opts!.siteId!,
      }
    : undefined;

  const js = generateJS({ analytics });

  return generateHtml(data, {})
    .replace('<link rel="stylesheet" href="styles.css">', `<style>${css}</style>`)
    .replace('<script src="app.js" defer></script>', `<script>${js}</script>`);
};

export type ExportDeploymentTarget =
  | 'vercel'
  | 'netlify'
  | 'github-pages'
  | 'docker'
  | 'vps'
  | 'heroku';

const VERCEL_JSON = `{
  "routes": [
    { "handle": "filesystem" },
    { "src": "/(.*)", "dest": "/index.html" }
  ]
}
`;

const NETLIFY_TOML = `[build]
  publish = "."
  command = "echo \\"no build\\""

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
`;

const NGINX_CONF = `server {
  listen 80;
  server_name _;

  root /usr/share/nginx/html;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }
}
`;

const DOCKERFILE_NGINX = `FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY . /usr/share/nginx/html
`;

const DOCKERIGNORE = `.git
node_modules
dist
`;

const HEROKU_PACKAGE_JSON = (name: string) => `{
  "name": "${name.replaceAll('"', '')}",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "engines": { "node": "20.x" },
  "scripts": {
    "start": "node server.js"
  }
}
`;

const HEROKU_SERVER_JS = `import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
};

const safeJoin = (base: string, target: string) => {
  const targetPath = path.normalize(path.join(base, target));
  if (!targetPath.startsWith(base)) return base;
  return targetPath;
};

const server = http.createServer(async (req, res) => {
  try {
    const reqUrl = new URL(req.url || '/', 'http://localhost');
    const pathname = decodeURIComponent(reqUrl.pathname);

    let filePath = pathname === '/' ? '/index.html' : pathname;
    filePath = safeJoin(__dirname, filePath);

    try {
      const stat = await fs.stat(filePath);
      if (stat.isDirectory()) filePath = path.join(filePath, 'index.html');
      const ext = path.extname(filePath);
      const data = await fs.readFile(filePath);
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
      res.end(data);
      return;
    } catch {
      // Fallback to index.html (static single-page)
      const data = await fs.readFile(path.join(__dirname, 'index.html'));
      res.writeHead(200, { 'Content-Type': MIME['.html'] });
      res.end(data);
      return;
    }
  } catch {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Server error');
  }
});

server.listen(process.env.PORT || 3000);
`;

const HEROKU_PROCFILE = `web: npm start
`;

const generateDeployDocs = (params: {
  title: string;
  deploymentTarget: ExportDeploymentTarget;
  analyticsEnabled: boolean;
  siteId?: string;
  analyticsEndpoint?: string;
}) => {
  const { title, deploymentTarget, analyticsEnabled, siteId, analyticsEndpoint } = params;
  return `# Deploy your Bento page

This export contains a static website:

- \`index.html\`
- \`styles.css\`
- \`app.js\`
- \`assets/\` (optional)

Selected deployment target: **${deploymentTarget}**

## Analytics

- Enabled: **${analyticsEnabled ? 'yes' : 'no'}**
${analyticsEnabled ? `- Site ID: \`${siteId}\`\n- Track endpoint: \`${analyticsEndpoint}\`` : ''}

## Deploy options

### Vercel

- Import the unzipped folder as a Vercel project (Framework: Other / No build)
- This package includes \`vercel.json\`

### Netlify

- Drag & drop the unzipped folder into Netlify “Deploy manually”
- This package includes \`netlify.toml\`

### GitHub Pages (GitHub Actions)

- Create a repository, push the unzipped files to \`main\`
- In GitHub: Settings → Pages → Source: GitHub Actions
- This package includes \`.github/workflows/deploy.yml\`

### Docker (nginx)

- Build: \`docker build -t my-bento .\`
- Run: \`docker run --rm -p 8080:80 my-bento\`
- This package includes \`Dockerfile\` + \`nginx.conf\`

### VPS (nginx)

- Copy files to your server (example: \`/var/www/bento\`)
- Use the provided \`nginx.conf\` as a starting point (adjust the \`root\` path)

### Heroku

- This package includes \`server.js\` + \`Procfile\` + \`package.json\`
- Deploy as a simple Node web app serving static files.
`;
};

export const exportSite = async (
  data: SiteData,
  opts?: { siteId?: string; deploymentTarget?: ExportDeploymentTarget },
) => {
  const zip = new JSZip();
  const folderAssets = zip.folder("assets");
  const imageMap: Record<string, string> = {};

  if (data.profile.avatarUrl.startsWith('data:image')) {
      const blob = base64ToBlob(data.profile.avatarUrl);
      if (blob && folderAssets) {
          folderAssets.file("avatar.png", blob);
          imageMap['profile_avatar'] = "assets/avatar.png";
      }
  }
  for (const block of data.blocks) {
      if (block.imageUrl && block.imageUrl.startsWith('data:image')) {
          const blob = base64ToBlob(block.imageUrl);
          if (blob && folderAssets) {
              const filename = `block-${block.id}.png`;
              folderAssets.file(filename, blob);
              imageMap[`block_${block.id}`] = `assets/${filename}`;
          }
      }
  }

  const bgConfig: BackgroundConfig = {
    backgroundColor: data.profile.backgroundColor,
    backgroundImage: data.profile.backgroundImage,
    backgroundBlur: data.profile.backgroundBlur,
  };
  zip.file("styles.css", generateCSS(data.profile.name, bgConfig));

  const analyticsSupabaseUrl = data.profile.analytics?.supabaseUrl?.trim().replace(/\/+$/, '') || '';
  const analyticsAnonKey = data.profile.analytics?.anonKey?.trim() || '';
  const analyticsEnabled = !!(data.profile.analytics?.enabled && analyticsSupabaseUrl && analyticsAnonKey && opts?.siteId);
  const analytics = analyticsEnabled
    ? {
        enabled: true,
        supabaseUrl: analyticsSupabaseUrl,
        anonKey: analyticsAnonKey,
        siteId: opts!.siteId!,
      }
    : undefined;

  zip.file("app.js", generateJS({ analytics }));
  zip.file("index.html", generateHtml(data, imageMap));
  zip.file("data.json", JSON.stringify(data, null, 2));

  const deploymentTarget: ExportDeploymentTarget = opts?.deploymentTarget ?? 'vercel';

  zip.file(
    "DEPLOY.md",
    generateDeployDocs({
      title: data.profile.name,
      deploymentTarget,
      analyticsEnabled,
      siteId: opts?.siteId,
      analyticsEndpoint: analyticsSupabaseUrl ? `${analyticsSupabaseUrl}/rest/v1/openbento_analytics_events` : undefined,
    }),
  );

  switch (deploymentTarget) {
    case 'github-pages':
      zip.file(".github/workflows/deploy.yml", GITHUB_WORKFLOW_YAML);
      break;
    case 'vercel':
      zip.file("vercel.json", VERCEL_JSON);
      break;
    case 'netlify':
      zip.file("netlify.toml", NETLIFY_TOML);
      break;
    case 'docker':
      zip.file("Dockerfile", DOCKERFILE_NGINX);
      zip.file("nginx.conf", NGINX_CONF);
      zip.file(".dockerignore", DOCKERIGNORE);
      break;
    case 'vps':
      zip.file("nginx.conf", NGINX_CONF.replaceAll('/usr/share/nginx/html', '/var/www/bento'));
      break;
    case 'heroku':
      zip.file("Procfile", HEROKU_PROCFILE);
      zip.file("package.json", HEROKU_PACKAGE_JSON(`${data.profile.name.replace(/\s+/g, '-').toLowerCase()}-bento`));
      zip.file("server.js", HEROKU_SERVER_JS);
      break;
  }

  const content = await zip.generateAsync({ type: "blob" });
  saveAs(content, `${data.profile.name.replace(/\s+/g, '-').toLowerCase()}-bento-${deploymentTarget}.zip`);
};
