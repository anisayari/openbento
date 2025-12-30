import JSZip from 'jszip';
import saveAs from 'file-saver';
import { SiteData, BlockData, BlockType } from '../types';
import { GITHUB_WORKFLOW_YAML, BASE_COLORS } from '../constants';

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

// --- CONTENT GENERATORS ---

const generateCSS = (profileName: string) => `
:root {
  --font-family: 'Inter', system-ui, -apple-system, sans-serif;
  --bg-color: #f8fafc;
  --text-main: #111827;
  --text-muted: #6b7280;
  --radius: 1.75rem;
  --gap: 1.25rem;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: var(--font-family);
  background: var(--bg-color);
  color: var(--text-main);
  min-height: 100vh;
  opacity: 0; 
  animation: fadeInBody 0.8s ease-out forwards;
  position: relative;
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
  padding: 4rem 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  position: relative;
  z-index: 20;
}

.avatar {
  width: 9rem;
  height: 9rem;
  border-radius: 1.5rem;
  overflow: hidden;
  margin-bottom: 1.5rem;
  box-shadow: 0 25px 50px -12px rgba(0,0,0,0.15);
  border: 4px solid white;
  background: #f3f4f6;
  transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
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
  font-size: 2.5rem;
  font-weight: 800;
  letter-spacing: -0.04em;
  margin-bottom: 0.75rem;
  line-height: 1;
  color: var(--text-main);
}

.profile-bio {
  font-size: 1rem;
  color: var(--text-muted);
  white-space: pre-wrap;
  max-width: 20rem;
  line-height: 1.7;
  font-weight: 500;
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
  grid-auto-rows: 180px;
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

.bento-item:hover {
  transform: translateY(-6px) scale(1.01);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  z-index: 10;
}

.bento-item:active {
  transform: scale(0.98);
}

.bento-item.no-hover:hover {
  transform: none;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  cursor: default;
}

/* Inner Content Layouts */
.content-wrapper {
  padding: 1.75rem;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
  z-index: 10;
}

.icon-box {
  width: 3rem;
  height: 3rem;
  border-radius: 1rem;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
}

.block-title {
  font-weight: 800;
  font-size: 1.25rem;
  line-height: 1.1;
  letter-spacing: -0.02em;
}

.block-sub {
  opacity: 0.8;
  font-size: 0.9rem;
  margin-top: 0.35rem;
  font-weight: 500;
}

/* Specific Types */
.type-text { justify-content: center; }
.type-text h3 { font-size: 1.75rem; margin-bottom: 0.5rem; letter-spacing: -0.03em; }

.full-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  position: absolute;
  top: 0; left: 0;
  transition: transform 0.6s cubic-bezier(0.25, 0.8, 0.25, 1);
}
.bento-item:hover .full-img { transform: scale(1.08); }

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
  .bento-grid { grid-template-columns: repeat(2, 1fr); }
  .col-span-2 { grid-column: span 2; }
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
}

@media (min-width: 1280px) {
  .bento-grid { grid-template-columns: repeat(3, 1fr); }
  .col-span-3 { grid-column: span 3; }
}
`;

const escapeAttr = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');

const generateJS = (opts: { analytics?: { enabled: boolean; endpoint: string; siteId: string } }) => `
document.addEventListener('DOMContentLoaded', () => {
    // --- Analytics (page views + outbound clicks) ---
    const analytics = ${opts.analytics ? JSON.stringify(opts.analytics) : 'null'};

    const track = async (payload) => {
        if (!analytics) return;
        try {
            const body = JSON.stringify(payload);
            if (navigator.sendBeacon) {
                const blob = new Blob([body], { type: 'application/json' });
                navigator.sendBeacon(analytics.endpoint, blob);
                return;
            }
            fetch(analytics.endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body,
                keepalive: true
            }).catch(() => {});
        } catch (_) {}
    };

    const getUtm = () => {
        const params = new URLSearchParams(window.location.search);
        return {
            source: params.get('utm_source') || undefined,
            medium: params.get('utm_medium') || undefined,
            campaign: params.get('utm_campaign') || undefined,
            term: params.get('utm_term') || undefined,
            content: params.get('utm_content') || undefined,
        };
    };

    track({
        siteId: analytics?.siteId,
        event: 'page_view',
        pageUrl: window.location.href,
        referrer: document.referrer || undefined,
        utm: getUtm(),
        language: navigator.language,
        screenW: window.screen?.width,
        screenH: window.screen?.height
    });

    document.addEventListener('click', (ev) => {
        const target = ev.target;
        if (!(target instanceof Element)) return;
        const link = target.closest('a.bento-item');
        if (!link) return;
        const blockId = link.getAttribute('data-block-id') || undefined;
        const destinationUrl = link.getAttribute('href') || undefined;
        track({
            siteId: analytics?.siteId,
            event: 'click',
            blockId,
            destinationUrl,
            pageUrl: window.location.href,
            referrer: document.referrer || undefined,
            utm: getUtm(),
            language: navigator.language,
            screenW: window.screen?.width,
            screenH: window.screen?.height
        });
    }, { capture: true });

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
                    container.innerHTML = videos.map(v => {
                        if(isTall) {
                            // Tall block - horizontal list items
                            return \`<a href="https://www.youtube.com/watch?v=\${v.id}" target="_blank" class="yt-thumb-card">
                                <div class="thumb-wrapper">
                                    <img src="\${v.thumb}" loading="lazy"/>
                                    <div class="yt-overlay">
                                        <div class="yt-play-btn">
                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><polygon points="10 8 16 12 10 16 10 8"/></svg>
                                        </div>
                                    </div>
                                </div>
                                <div class="meta"><div class="title">\${v.title}</div></div>
                            </a>\`;
                        } else {
                            // Grid mode (default)
                            const playSize = isSmall ? 12 : 16;
                            return \`<a href="https://www.youtube.com/watch?v=\${v.id}" target="_blank" class="yt-thumb-card">
                                <img src="\${v.thumb}" loading="lazy"/>
                                <div class="yt-overlay">
                                    <div class="yt-play-btn">
                                        <svg width="\${playSize}" height="\${playSize}" viewBox="0 0 24 24" fill="white"><polygon points="10 8 16 12 10 16 10 8"/></svg>
                                    </div>
                                </div>
                                <div class="yt-caption">\${v.title}</div>
                            </a>\`;
                        }
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

    let bgStyle = '';
    if (block.customBackground) {
        bgStyle = block.customBackground;
    } else {
        bgStyle = getStyleFromClass(block.color, 'bg');
    }

    const textStyle = getStyleFromClass(block.textColor, 'text');
    
    const colClass = block.colSpan === 3 ? 'col-span-3' : block.colSpan === 2 ? 'col-span-2' : '';
    const rowClass = block.rowSpan === 2 ? 'row-span-2' : '';
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
        
        const fetcherAttrs = `data-channel-id="${block.channelId}" data-mode="${mode}" data-size="${sizeClass}"`;

        if (isMulti) {
             const videosToShow = isSmall ? 2 : 4;
             contentHtml = `
             <div class="youtube-fetcher yt-container ${sizeClass}" ${fetcherAttrs}>
                <div class="yt-header">
                    <div class="yt-icon">
                        <svg width="${isSmall ? 14 : 18}" height="${isSmall ? 14 : 18}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/><path d="m10 15 5-3-5-3z"/></svg>
                    </div>
                    <div class="yt-header-text">
                        <h3 data-role="channel-title">${block.channelTitle || 'YouTube'}</h3>
                        <span>Latest Videos</span>
                    </div>
                </div>
                <div data-role="video-container" data-max-videos="${videosToShow}" class="yt-videos">
                    <div style="grid-column: span 2; text-align:center; padding:1rem; color:#9ca3af; font-size:0.75rem;">Loading...</div>
                </div>
             </div>`;
        } else {
             const vidId = block.youtubeVideoId || '';
             const bgUrl = vidId ? `https://img.youtube.com/vi/${vidId}/maxresdefault.jpg` : '';
             contentHtml = `
             <div ${fetcherAttrs} class="yt-single">
                <div class="yt-single-bg" style="background-image:url('${bgUrl}');" data-role="bg-image"></div>
                <div class="yt-single-overlay"></div>
                <div class="yt-single-content">
                    <div class="yt-single-icon">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/><path d="m10 15 5-3-5-3z"/></svg>
                    </div>
                    <a href="#" target="_blank" data-role="play-link" class="yt-single-play">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><polygon points="10 8 16 12 10 16 10 8"/></svg>
                    </a>
                    <div class="yt-single-info">
                        <h3 data-role="channel-title">${block.channelTitle || block.title}</h3>
                        <p data-role="video-title">${block.subtext || ''}</p>
                    </div>
                </div>
             </div>`;
        }
    }
    // STANDARD TYPES
    else {
        switch (block.type) {
            case BlockType.IMAGE:
                contentHtml = `<img src="${blockImageSrc}" class="full-img" alt="${block.title || ''}" />`;
                break;
            case BlockType.MAP:
                contentHtml = `<iframe width="100%" height="100%" frameborder="0" style="position:absolute; inset:0; filter:grayscale(0.5) contrast(1.1); pointer-events:none;" src="https://maps.google.com/maps?q=${encodeURIComponent(block.content || 'Paris')}&t=&z=13&ie=UTF8&iwloc=&output=embed"></iframe>`;
                break;
            case BlockType.TEXT:
                contentHtml = `
                <div class="content-wrapper type-text">
                    <h3>${block.title || ''}</h3>
                    <p style="opacity:0.8; line-height:1.6; font-size:1.1rem;">${block.content || ''}</p>
                </div>`;
                break;
            case BlockType.SOCIAL:
            case BlockType.LINK:
                const isLinkWithImage = block.type === BlockType.LINK && blockImageSrc;
                if (isLinkWithImage) {
                     contentHtml = `
                     <div style="position:absolute; inset:0; background-image:url('${blockImageSrc}'); background-size:cover; background-position:center;" class="full-img"></div>
	                     <div style="position:absolute; inset:0; background:rgba(0,0,0,0.5);"></div>
                     <div class="content-wrapper" style="color:white; z-index:2;">
                         <div class="icon-box" style="background:rgba(255,255,255,0.25); color:white; backdrop-filter:blur(5px); border:1px solid rgba(255,255,255,0.3);">
                              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7"/><path d="M7 7h10v10"/></svg>
                         </div>
                         <div>
                             <div class="block-title" style="text-shadow:0 2px 4px rgba(0,0,0,0.2);">${block.title || 'Link'}</div>
                             <div class="block-sub" style="opacity:0.9;">${block.subtext || ''}</div>
                         </div>
                     </div>`;
                } else {
                     contentHtml = `
                     <div class="content-wrapper">
                         <div class="icon-box" style="background:${block.textColor === 'text-white' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.9)'}; color: ${block.textColor === 'text-white' ? 'white' : 'black'}; backdrop-filter:blur(4px);">
                              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7"/><path d="M7 7h10v10"/></svg>
                         </div>
                         <div>
                             <div class="block-title">${block.title || 'Link'}</div>
                             <div class="block-sub">${block.subtext || ''}</div>
                         </div>
                     </div>`;
                }
                break;
            case BlockType.SPACER:
                contentHtml = ''; 
                break;
        }
    }

    const tag = (block.content && !block.channelId && block.type !== BlockType.TEXT) ? 'a' : 'div';
    const href = tag === 'a' ? `href="${escapeAttr(block.content!)}" target="_blank" rel="noopener noreferrer"` : '';
    const analyticsAttrs = [
      `data-block-id="${escapeAttr(block.id)}"`,
      `data-block-type="${escapeAttr(block.type)}"`,
      block.type === BlockType.SOCIAL && block.socialPlatform ? `data-social-platform="${escapeAttr(block.socialPlatform)}"` : '',
      block.type === BlockType.SOCIAL && block.socialHandle ? `data-social-handle="${escapeAttr(block.socialHandle)}"` : '',
    ].filter(Boolean).join(' ');
    
    // Add explicit grid positioning for correct order
    const gridPosition = block.gridColumn !== undefined && block.gridRow !== undefined 
      ? `grid-column: ${block.gridColumn} / span ${Math.min(block.colSpan, 3)}; grid-row: ${block.gridRow} / span ${block.rowSpan};`
      : '';
    const style = `background: ${bgStyle}; color: ${textStyle}; ${gridPosition}`;
    const noHover = !isInteractive ? 'no-hover' : '';

    return `<${tag} ${href} ${analyticsAttrs} class="bento-item ${colClass} ${rowClass} ${noHover}" style="${style}">${contentHtml}</${tag}>`;
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${profile.name}</title>
    <meta name="description" content="${profile.bio.replace(/\n/g, ' ')}">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="styles.css">
    <script src="app.js" defer></script>
</head>
<body>
    <div class="container">
        <!-- Profile -->
        <div class="profile-section">
            <div class="avatar"><img src="${avatarSrc}" alt="${profile.name}"></div>
            <h1 class="profile-name">${profile.name}</h1>
            <p class="profile-bio">${profile.bio}</p>
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
  const css = generateCSS(data.profile.name);

  const analyticsSupabaseUrl = data.profile.analytics?.supabaseUrl?.trim().replace(/\/+$/, '') || '';
  const analyticsEnabled = !!(data.profile.analytics?.enabled && analyticsSupabaseUrl && opts?.siteId);
  const analytics = analyticsEnabled
    ? {
        enabled: true,
        endpoint: `${analyticsSupabaseUrl}/functions/v1/openbento-analytics-track`,
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

  zip.file("styles.css", generateCSS(data.profile.name));

  const analyticsSupabaseUrl = data.profile.analytics?.supabaseUrl?.trim().replace(/\/+$/, '') || '';
  const analyticsEnabled = !!(data.profile.analytics?.enabled && analyticsSupabaseUrl && opts?.siteId);
  const analytics = analyticsEnabled
    ? {
        enabled: true,
        endpoint: `${analyticsSupabaseUrl}/functions/v1/openbento-analytics-track`,
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
      analyticsEndpoint: analytics?.endpoint,
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
