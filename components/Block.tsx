import React, { useEffect, useState, useRef, useCallback } from 'react';
import { BlockData, BlockType } from '../types';
import { Youtube, MoveVertical, Play, Loader2, Pencil, Move, Check, X, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { getSocialPlatformOption, inferSocialPlatformFromUrl } from '../socialPlatforms';
import { openSafeUrl, isValidYouTubeChannelId, isValidLocationString, sanitizeUrl } from '../utils/security';

// Apple TV style 3D tilt effect hook
const useTiltEffect = (isEnabled: boolean = true) => {
  const [tiltStyle, setTiltStyle] = useState<React.CSSProperties>({});
  const elementRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isEnabled || !elementRef.current) return;

    const rect = elementRef.current.getBoundingClientRect();
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

    setTiltStyle({
      transform: `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`,
      boxShadow: `${shadowX}px ${shadowY}px 25px rgba(0,0,0,0.15), 0 8px 30px rgba(0,0,0,0.1)`,
      transition: 'transform 0.1s ease-out, box-shadow 0.1s ease-out',
      '--glare-x': `${glareX}%`,
      '--glare-y': `${glareY}%`,
    } as React.CSSProperties);
  }, [isEnabled]);

  const handleMouseLeave = useCallback(() => {
    if (!isEnabled) return;
    setTiltStyle({
      transform: 'perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      transition: 'transform 0.5s ease-out, box-shadow 0.5s ease-out',
    });
  }, [isEnabled]);

  const handleMouseEnter = useCallback(() => {
    if (!isEnabled) return;
    setTiltStyle({
      transition: 'transform 0.1s ease-out',
    });
  }, [isEnabled]);

  return { elementRef, tiltStyle, handleMouseMove, handleMouseLeave, handleMouseEnter };
};

interface BlockProps {
  block: BlockData;
  isSelected: boolean;
  isDragTarget?: boolean;
  isDragging?: boolean;
  onEdit: (block: BlockData) => void;
  onDelete: (id: string) => void;
  onDragStart: (id: string, event: React.DragEvent) => void;
  onDragEnter: (id: string) => void;
  onDragEnd: () => void;
  onDrop: (id: string, event: React.DragEvent) => void;
  onDragOver?: (event: React.DragEvent) => void;
  enableResize?: boolean;
  isResizing?: boolean;
  onResizeStart?: (block: BlockData, e: React.PointerEvent<HTMLButtonElement>) => void;
  onInlineUpdate?: (block: BlockData) => void;
  enableTiltEffect?: boolean; // Apple TV style 3D tilt on hover
  previewMode?: boolean; // In preview mode, clicks navigate to URLs instead of editing
}

const Block: React.FC<BlockProps> = ({
  block,
  isSelected,
  isDragTarget,
  isDragging,
  onEdit,
  onDelete,
  onDragStart,
  onDragEnter,
  onDragEnd,
  onDrop,
  onDragOver,
  enableResize,
  isResizing,
  onResizeStart,
  onInlineUpdate,
  enableTiltEffect,
  previewMode,
}) => {
  // Apple TV tilt effect
  const { elementRef: tiltRef, tiltStyle, handleMouseMove: onTiltMove, handleMouseLeave: onTiltLeave, handleMouseEnter: onTiltEnter } = useTiltEffect(enableTiltEffect);
  const [fetchedVideos, setFetchedVideos] = useState<Array<{ id: string; title: string; thumbnail: string }>>(block.youtubeVideos || []);
  const [isLoading, setIsLoading] = useState(false);

  // Inline editing state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingSubtext, setIsEditingSubtext] = useState(false);
  const [editTitleValue, setEditTitleValue] = useState(block.title || '');
  const [editSubtextValue, setEditSubtextValue] = useState(block.subtext || '');
  const titleInputRef = useRef<HTMLInputElement>(null);
  const subtextInputRef = useRef<HTMLInputElement>(null);

  // Media repositioning state
  const [isRepositioning, setIsRepositioning] = useState(false);
  const [mediaPosition, setMediaPosition] = useState<{ x: number; y: number }>(
    block.mediaPosition || { x: 50, y: 50 }
  );
  const [dragStart, setDragStart] = useState<{ x: number; y: number; posX: number; posY: number } | null>(null);
  const mediaContainerRef = useRef<HTMLDivElement>(null);

  // Update media position when block changes
  useEffect(() => {
    setMediaPosition(block.mediaPosition || { x: 50, y: 50 });
  }, [block.mediaPosition]);

  const handleMediaRepositionStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setDragStart({ x: clientX, y: clientY, posX: mediaPosition.x, posY: mediaPosition.y });
  };

  const handleMediaRepositionMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!dragStart || !mediaContainerRef.current) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const rect = mediaContainerRef.current.getBoundingClientRect();

    // Calculate movement as percentage of container size
    const deltaX = ((clientX - dragStart.x) / rect.width) * 100;
    const deltaY = ((clientY - dragStart.y) / rect.height) * 100;

    // Invert because object-position works opposite to drag direction
    const newX = Math.max(0, Math.min(100, dragStart.posX - deltaX));
    const newY = Math.max(0, Math.min(100, dragStart.posY - deltaY));

    setMediaPosition({ x: newX, y: newY });
  }, [dragStart]);

  const handleMediaRepositionEnd = useCallback(() => {
    setDragStart(null);
  }, []);

  // Add/remove global event listeners for drag
  useEffect(() => {
    if (dragStart) {
      window.addEventListener('mousemove', handleMediaRepositionMove);
      window.addEventListener('mouseup', handleMediaRepositionEnd);
      window.addEventListener('touchmove', handleMediaRepositionMove);
      window.addEventListener('touchend', handleMediaRepositionEnd);
      return () => {
        window.removeEventListener('mousemove', handleMediaRepositionMove);
        window.removeEventListener('mouseup', handleMediaRepositionEnd);
        window.removeEventListener('touchmove', handleMediaRepositionMove);
        window.removeEventListener('touchend', handleMediaRepositionEnd);
      };
    }
  }, [dragStart, handleMediaRepositionMove, handleMediaRepositionEnd]);

  const handleSaveMediaPosition = () => {
    if (onInlineUpdate) {
      onInlineUpdate({ ...block, mediaPosition });
    }
    setIsRepositioning(false);
  };

  const handleCancelMediaPosition = () => {
    setMediaPosition(block.mediaPosition || { x: 50, y: 50 });
    setIsRepositioning(false);
  };

  // Update local state when block changes
  useEffect(() => {
    setEditTitleValue(block.title || '');
    setEditSubtextValue(block.subtext || '');
  }, [block.title, block.subtext]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  useEffect(() => {
    if (isEditingSubtext && subtextInputRef.current) {
      subtextInputRef.current.focus();
      subtextInputRef.current.select();
    }
  }, [isEditingSubtext]);

  const handleTitleSave = () => {
    if (onInlineUpdate && editTitleValue !== block.title) {
      onInlineUpdate({ ...block, title: editTitleValue });
    }
    setIsEditingTitle(false);
  };

  const handleSubtextSave = () => {
    if (onInlineUpdate && editSubtextValue !== block.subtext) {
      onInlineUpdate({ ...block, subtext: editSubtextValue });
    }
    setIsEditingSubtext(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTitleSave();
    } else if (e.key === 'Escape') {
      setEditTitleValue(block.title || '');
      setIsEditingTitle(false);
    }
  };

  const handleSubtextKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubtextSave();
    } else if (e.key === 'Escape') {
      setEditSubtextValue(block.subtext || '');
      setIsEditingSubtext(false);
    }
  };

  useEffect(() => {
    if (block.type === BlockType.SOCIAL && block.channelId && (!block.youtubeVideos || block.youtubeVideos.length === 0)) {
        let isMounted = true;
        const fetchFeed = async () => {
            setIsLoading(true);
            try {
                const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${block.channelId}`;
                const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(rssUrl)}`;
                const response = await fetch(proxyUrl);
                if (response.ok && isMounted) {
                    const text = await response.text();
                    const parser = new DOMParser();
                    const xmlDoc = parser.parseFromString(text, "text/xml");
                    const entries = Array.from(xmlDoc.querySelectorAll("entry"));
                    const vids = entries.slice(0, 4).map(entry => {
                        const vidId = entry.getElementsByTagName("yt:videoId")[0]?.textContent || "";
                        const vidTitle = entry.getElementsByTagName("title")[0]?.textContent || "";
                        return {
                            id: vidId,
                            title: vidTitle,
                            thumbnail: `https://img.youtube.com/vi/${vidId}/mqdefault.jpg`
                        };
                    });
                    if (vids.length > 0) setFetchedVideos(vids);
                }
            } catch (e) {
                console.warn("Auto-fetch warning:", e);
            } finally {
                if(isMounted) setIsLoading(false);
            }
        };
        fetchFeed();
        return () => { isMounted = false; };
    } else {
        setFetchedVideos(block.youtubeVideos || []);
    }
  }, [block.channelId, block.youtubeVideos, block.type]);


  const colClass = block.colSpan === 3 ? 'md:col-span-3 lg:col-span-3' : block.colSpan === 2 ? 'md:col-span-2 lg:col-span-2' : 'md:col-span-1 lg:col-span-1';
  const rowClass = block.rowSpan === 2 ? 'md:row-span-2' : 'md:row-span-1';

  // Calculate border-radius based on block size (smaller = more rectangular)
  const getBorderRadius = () => {
    const minDim = Math.min(block.colSpan, block.rowSpan);
    if (minDim <= 1) return '0.5rem'; // 8px for tiny blocks
    if (minDim <= 2) return '0.625rem'; // 10px for small blocks
    if (minDim <= 3) return '0.75rem'; // 12px for medium blocks
    return '0.875rem'; // 14px for large blocks
  };
  const borderRadius = getBorderRadius();
  const sizeTier = (() => {
    const minDim = Math.min(block.colSpan, block.rowSpan);
    const area = block.colSpan * block.rowSpan;
    if (minDim <= 1 || area <= 4) return 'xs';
    if (minDim <= 2 || area <= 8) return 'sm';
    if (minDim <= 3 || area <= 12) return 'md';
    return 'lg';
  })();
  // Responsive text sizes: smaller across the board
  const textScale = {
    titleText: {
      xs: 'text-[9px] md:text-xs',
      sm: 'text-[10px] md:text-sm',
      md: 'text-xs md:text-base',
      lg: 'text-sm md:text-lg',
    },
    titleDefault: {
      xs: 'text-[8px] md:text-[10px]',
      sm: 'text-[9px] md:text-xs',
      md: 'text-[10px] md:text-sm',
      lg: 'text-xs md:text-base',
    },
    subtext: {
      xs: 'text-[6px] md:text-[8px]',
      sm: 'text-[7px] md:text-[9px]',
      md: 'text-[8px] md:text-[10px]',
      lg: 'text-[9px] md:text-xs',
    },
    body: {
      xs: 'text-[7px] md:text-[9px]',
      sm: 'text-[8px] md:text-[10px]',
      md: 'text-[9px] md:text-xs',
      lg: 'text-[10px] md:text-sm',
    },
    overlayTitle: {
      xs: 'text-[7px] md:text-[9px]',
      sm: 'text-[8px] md:text-[10px]',
      md: 'text-[9px] md:text-xs',
      lg: 'text-[10px] md:text-sm',
    },
    overlaySubtext: {
      xs: 'text-[5px] md:text-[7px]',
      sm: 'text-[6px] md:text-[8px]',
      md: 'text-[7px] md:text-[9px]',
      lg: 'text-[8px] md:text-[10px]',
    },
  };
  const textSizes = {
    titleText: textScale.titleText[sizeTier],
    titleDefault: textScale.titleDefault[sizeTier],
    subtext: textScale.subtext[sizeTier],
    body: textScale.body[sizeTier],
    overlayTitle: textScale.overlayTitle[sizeTier],
    overlaySubtext: textScale.overlaySubtext[sizeTier],
  };

  const resizeHandle =
    enableResize && onResizeStart ? (
      <button
        type="button"
        aria-label="Resize block"
        data-resize-handle="true"
        className={`absolute bottom-2 right-2 z-30 transition-opacity pointer-events-auto ${
          isResizing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}
        onPointerDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onResizeStart(block, e);
        }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDragStart={(e) => e.preventDefault()}
      >
        <div className="w-6 h-6 rounded-lg bg-white/90 border border-white shadow-md flex items-end justify-end p-1 cursor-nwse-resize touch-none">
          <div className="w-3 h-3 border-b-2 border-r-2 border-gray-900/70" />
        </div>
      </button>
    ) : null;
  
  // Explicit grid positioning (if defined)
  const gridPositionStyle: React.CSSProperties = {};
  if (block.gridColumn !== undefined) {
    gridPositionStyle.gridColumnStart = block.gridColumn;
    gridPositionStyle.gridColumnEnd = block.gridColumn + block.colSpan;
  }
  if (block.gridRow !== undefined) {
    gridPositionStyle.gridRowStart = block.gridRow;
    gridPositionStyle.gridRowEnd = block.gridRow + block.rowSpan;
  }
  // Z-index for overlapping blocks
  if (block.zIndex !== undefined) {
    gridPositionStyle.zIndex = block.zIndex;
  }

	  // Spacer Block
	  if (block.type === BlockType.SPACER) {
	      return (
        <motion.div
            layoutId={block.id}
            layout
            draggable={!isResizing}
            onDragStart={(e) => {
              if (isResizing) {
                e.preventDefault();
                return;
              }
              if ((e.target as HTMLElement)?.closest('[data-resize-handle="true"]')) {
                e.preventDefault();
                return;
              }
              onDragStart(block.id, e);
            }}
            onDragEnter={() => onDragEnter(block.id)}
            onDragOver={(e) => {
              e.preventDefault();
              onDragOver?.(e);
            }}
            onDragEnd={onDragEnd}
            onDrop={(e) => {
              e.preventDefault();
              onDrop(block.id, e);
            }}
            onClick={() => onEdit(block)}
            data-block-id={block.id}
            className={`
                relative ${colClass} ${rowClass} cursor-pointer h-full
                ${isSelected ? 'ring-2 ring-blue-500/50 bg-blue-50/50' : 'hover:bg-gray-100/50'}
                ${isDragTarget ? 'ring-2 ring-violet-500 bg-violet-50/50 scale-[1.02]' : ''}
                ${isDragging ? 'opacity-40 scale-95' : ''}
	                transition-all duration-200 group
	                flex items-center justify-center
	            `}
	            style={{ borderRadius, ...gridPositionStyle }}
	        >
	             <div className={`text-gray-300 flex flex-col items-center gap-1 ${isSelected || isDragTarget ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
	                 <MoveVertical size={20} />
	                 <span className="text-xs font-medium uppercase tracking-wider">Spacer</span>
	             </div>
	             {resizeHandle}
	        </motion.div>
	      );
	  }

  // Social Icon Block (small, icon-only)
  if (block.type === BlockType.SOCIAL_ICON) {
    const platform = block.socialPlatform;
    const handle = block.socialHandle || '';
    const option = platform ? getSocialPlatformOption(platform) : undefined;
    const BrandIcon = option?.brandIcon;
    const FallbackIcon = option?.icon;
    const brandColor = option?.brandColor;
    const url = option && handle ? option.buildUrl(handle) : '';

    // Determine if we should show colored or grey/black icon
    // Use brand color by default, but respect textColor if explicitly set
    const useColor = !block.textColor || block.textColor === 'text-brand';
    const iconColor = useColor
      ? brandColor
      : block.textColor === 'text-black'
        ? '#000000'
        : block.textColor === 'text-gray-700'
          ? '#374151'
          : undefined;

    return (
      <motion.a
        layoutId={block.id}
        layout
        href={url || undefined}
        target="_blank"
        rel="noopener noreferrer"
        draggable={!isResizing}
        onDragStart={(e) => {
          if (isResizing) {
            e.preventDefault();
            return;
          }
          if ((e.target as HTMLElement)?.closest('[data-resize-handle="true"]')) {
            e.preventDefault();
            return;
          }
          onDragStart(block.id, e);
        }}
        onDragEnter={() => onDragEnter(block.id)}
        onDragOver={(e) => {
          e.preventDefault();
          onDragOver?.(e);
        }}
        onDragEnd={onDragEnd}
        onDrop={(e) => {
          e.preventDefault();
          onDrop(block.id, e);
        }}
        onClick={(e) => {
          if (e.ctrlKey || e.metaKey) return; // Allow link click
          e.preventDefault();
          onEdit(block);
        }}
        data-block-id={block.id}
        className={`
          bento-item relative cursor-pointer overflow-hidden h-full
          ${block.color || 'bg-white'}
          ${isSelected ? 'ring-2 ring-violet-500 shadow-lg' : 'hover:ring-2 hover:ring-gray-300 hover:shadow-md'}
          ${isDragTarget ? 'ring-2 ring-violet-500 bg-violet-50/50 scale-105' : ''}
          ${isDragging ? 'opacity-40 scale-95' : ''}
          transition-all duration-200 group
          flex items-center justify-center
          shadow-sm border border-gray-100
        `}
        style={{
          ...gridPositionStyle,
          borderRadius,
          ...(block.customBackground ? { background: block.customBackground } : {}),
        }}
      >
        {BrandIcon ? (
          <BrandIcon
            size={24}
            style={{ color: iconColor }}
            className="group-hover:scale-110 transition-transform"
          />
        ) : FallbackIcon ? (
          <FallbackIcon
            size={24}
            style={{ color: iconColor || '#374151' }}
            className="group-hover:scale-110 transition-transform"
          />
        ) : null}

        {/* Delete button - appears on hover (not in preview mode) */}
        {!previewMode && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete(block.id);
            }}
            className="absolute top-1 left-1 p-1 bg-red-500/80 hover:bg-red-600 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity z-20"
            title="Delete"
          >
            <Trash2 size={12} />
          </button>
        )}

        {resizeHandle}
      </motion.a>
    );
  }

  // YouTube Block Detection
  const activeVideos = fetchedVideos.length > 0 ? fetchedVideos : [];
  const activeVideoId = block.youtubeVideoId || (activeVideos.length > 0 ? activeVideos[0].id : undefined);
  const isYoutube = (block.type === BlockType.SOCIAL && (!!block.channelId || block.title?.toLowerCase().includes('youtube')));
  const isRichYoutube = isYoutube && activeVideoId && block.youtubeMode !== 'grid' && block.youtubeMode !== 'list';
  const isYoutubeGrid = isYoutube && block.youtubeMode === 'grid';
  const isYoutubeList = isYoutube && block.youtubeMode === 'list';
  
  const isLinkWithImage = block.type === BlockType.LINK && block.imageUrl;

  const backgroundStyle: React.CSSProperties = block.customBackground 
    ? { background: block.customBackground } 
    : {};
  
  let finalStyle: React.CSSProperties = backgroundStyle;
  
  if (isRichYoutube) {
      finalStyle = { 
        backgroundImage: `url(https://img.youtube.com/vi/${activeVideoId}/maxresdefault.jpg)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      };
  } else if (isLinkWithImage && block.imageUrl) {
      const pos = mediaPosition;
      finalStyle = {
        backgroundImage: `url(${block.imageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: `${pos.x}% ${pos.y}%`
      };
  }

  // ===== YOUTUBE GRID/LIST LAYOUT =====
  if (isYoutubeGrid || isYoutubeList) {
    const displayVideos = activeVideos.slice(0, 4);
    const subscriberCount = block.subscriberCount; // Only show if defined

    // Responsive layout based on grid units (colSpan vs rowSpan)
    // If wider than tall in grid units → landscape (text left, grid right)
    // If taller than wide in grid units → portrait (text top, grid bottom)
    const isLandscape = block.colSpan > block.rowSpan;

    const YouTubeGridContent = () => {
      return (
        <div
          className={`w-full h-full p-2 md:p-3 flex gap-2 md:gap-3 ${isLandscape ? 'flex-row' : 'flex-col'}`}
        >
          {/* Header: YouTube icon, channel name, subscribe button */}
          <div className={`flex gap-1.5 md:gap-2 shrink-0 ${
            isLandscape
              ? 'w-[28%] flex-col justify-center'
              : 'w-full flex-row items-center'
          }`}>
            {/* YouTube Icon */}
            <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-red-500 flex items-center justify-center shadow shrink-0">
              <svg viewBox="0 0 24 24" fill="white" className="w-3.5 h-3.5 md:w-4 md:h-4">
                <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0C.488 3.45.029 5.804 0 12c.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0C23.512 20.55 23.971 18.196 24 12c-.029-6.185-.484-8.549-4.385-8.816zM9 16V8l8 3.993L9 16z"/>
              </svg>
            </div>

            {/* Channel Name */}
            <h3 className={`font-bold text-gray-900 text-[9px] md:text-xs leading-tight line-clamp-2 ${!isLandscape ? 'flex-1' : ''}`}>
              {block.channelTitle || 'YouTube'}
            </h3>

            {/* Subscribe Button */}
            <a
              href={block.channelId && isValidYouTubeChannelId(block.channelId) ? `https://youtube.com/channel/${block.channelId}?sub_confirmation=1` : '#'}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className={`inline-flex items-center gap-0.5 md:gap-1 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-full shadow hover:shadow-md transition-all px-2 py-1 md:px-2.5 md:py-1 text-[8px] md:text-[10px] shrink-0 ${
                isLandscape ? 'self-start' : 'self-center'
              }`}
            >
              <span>Subscribe</span>
              {subscriberCount && <span className="opacity-90">{subscriberCount}</span>}
            </a>
          </div>

          {/* Video Grid 2x2 */}
          <div className="flex-1 min-w-0 min-h-0">
            {isLoading ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="animate-spin text-gray-300" size={16}/>
              </div>
            ) : (
              <div className="h-full grid grid-cols-2 grid-rows-2 gap-1 md:gap-1.5">
                {displayVideos.length > 0 ? displayVideos.map((vid, idx) => (
                  <a
                    key={idx}
                    href={`https://youtube.com/watch?v=${vid.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="relative overflow-hidden group/vid rounded-md md:rounded-lg bg-gray-100 block"
                  >
                    <img src={vid.thumbnail} alt={vid.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover/vid:bg-black/30 transition-colors" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/vid:opacity-100 transition-all">
                      <div className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-red-500 flex items-center justify-center shadow-lg">
                        <Play size={10} className="md:w-3 md:h-3 text-white ml-0.5" fill="white" />
                      </div>
                    </div>
                  </a>
                )) : (
                  <div className="col-span-2 row-span-2 flex items-center justify-center text-[8px] text-gray-400">
                    <span>No videos</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      );
    };

    return (
      <motion.div
        layoutId={block.id}
        layout
        draggable={!isResizing}
        onDragStart={(e) => {
          if (isResizing) {
            e.preventDefault();
            return;
          }
          if ((e.target as HTMLElement)?.closest('[data-resize-handle="true"]')) {
            e.preventDefault();
            return;
          }
          onDragStart(block.id, e);
        }}
        onDragEnter={() => onDragEnter(block.id)}
        onDragOver={(e) => {
          e.preventDefault();
          onDragOver?.(e);
        }}
        onDragEnd={onDragEnd}
        onDrop={(e) => {
          e.preventDefault();
          onDrop(block.id, e);
        }}
        onClick={() => {
          if (!previewMode) {
            onEdit(block);
          }
        }}
        data-block-id={block.id}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ y: -4, transition: { duration: 0.2 } }}
        style={{
          ...gridPositionStyle,
          borderRadius,
          ...(block.customBackground ? { background: block.customBackground } : {}),
        }}
        className={`bento-item group relative overflow-hidden ${block.color || 'bg-white'} ${colClass} ${rowClass} cursor-pointer h-full
          ${isSelected ? 'ring-4 ring-blue-500 shadow-xl z-20' : 'ring-1 ring-black/5'}
          ${!isSelected ? 'shadow-sm hover:shadow-xl' : ''}
          ${isDragTarget ? 'ring-2 ring-violet-500 z-20 scale-[1.02]' : ''}
          ${isDragging ? 'opacity-40 scale-95' : ''}
          transition-all duration-300 select-none
        `}
      >
        {/* Drop indicator */}
        {isDragTarget && (
          <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-1.5 h-16 bg-violet-500 rounded-full shadow-md shadow-violet-500/30 animate-pulse z-30" />
        )}
        {resizeHandle}

        {/* Delete button - appears on hover (not in preview mode) */}
        {!previewMode && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete(block.id);
            }}
            className="absolute top-2 left-2 p-1.5 bg-red-500/80 hover:bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-20 backdrop-blur-sm"
            title="Delete block"
          >
            <Trash2 size={14} />
          </button>
        )}

        <YouTubeGridContent />
      </motion.div>
    );
  }

  // ===== STANDARD BLOCKS =====

  // Tilt wrapper for Apple TV effect
  const tiltWrapperStyle: React.CSSProperties = enableTiltEffect ? {
    ...tiltStyle,
    width: '100%',
    height: '100%',
    transformStyle: 'preserve-3d',
  } : {};

  return (
    <motion.div
      layoutId={block.id}
      layout
      draggable={!isResizing}
      onDragStart={(e) => {
        if (isResizing) {
          e.preventDefault();
          return;
        }
        if ((e.target as HTMLElement)?.closest('[data-resize-handle="true"]')) {
          e.preventDefault();
          return;
        }
        onDragStart(block.id, e);
      }}
      onDragEnter={() => onDragEnter(block.id)}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver?.(e);
      }}
      onDragEnd={onDragEnd}
      onDrop={(e) => {
        e.preventDefault();
        onDrop(block.id, e);
      }}
      onClick={() => {
        if (previewMode) {
          // In preview mode, navigate to block URL with security validation
          let url = block.content;
          if (block.type === BlockType.SOCIAL && block.socialPlatform && block.socialHandle) {
            const option = getSocialPlatformOption(block.socialPlatform);
            url = option?.buildUrl(block.socialHandle);
          }
          // SECURITY: Only open safe URLs (http/https)
          openSafeUrl(url);
        } else {
          onEdit(block);
        }
      }}
      data-block-id={block.id}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={enableTiltEffect ? undefined : { y: -4, transition: { duration: 0.2 } }}
      style={{ ...gridPositionStyle }}
      className={`${colClass} ${rowClass} cursor-pointer select-none h-full
        ${isDragTarget ? 'z-20 scale-[1.02]' : ''}
        ${isDragging ? 'opacity-40 scale-95' : ''}
        ${enableTiltEffect ? 'transform-gpu' : ''}
      `}
    >
      <div
        ref={enableTiltEffect ? tiltRef : undefined}
        onMouseMove={enableTiltEffect ? onTiltMove : undefined}
        onMouseLeave={enableTiltEffect ? onTiltLeave : undefined}
        onMouseEnter={enableTiltEffect ? onTiltEnter : undefined}
        style={{ ...finalStyle, borderRadius, ...tiltWrapperStyle }}
        className={`bento-item group relative overflow-hidden w-full h-full ${!block.customBackground && !isLinkWithImage && !isRichYoutube ? (block.color || 'bg-white') : ''} ${block.textColor || 'text-gray-900'}
          ${isSelected ? 'ring-4 ring-blue-500 shadow-xl' : 'ring-1 ring-black/5'}
          ${!isSelected && !enableTiltEffect ? 'shadow-sm hover:shadow-xl' : 'shadow-sm'}
          ${isDragTarget ? 'ring-2 ring-violet-500' : ''}
          transition-all duration-300
        `}
      >
      {/* Drop indicator */}
      {isDragTarget && (
        <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-1.5 h-16 bg-violet-500 rounded-full shadow-md shadow-violet-500/30 animate-pulse z-30" />
      )}
      {/* Glare effect for Apple TV tilt */}
      {enableTiltEffect && (
        <div
          className="absolute inset-0 pointer-events-none z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle at var(--glare-x, 50%) var(--glare-y, 50%), rgba(255,255,255,0.25) 0%, transparent 60%)`,
          }}
        />
      )}
      {/* Delete button - appears on hover (not in preview mode) */}
      {!previewMode && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete(block.id);
          }}
          className="absolute top-2 left-2 p-1.5 bg-red-500/80 hover:bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-20 backdrop-blur-sm"
          title="Delete block"
        >
          <Trash2 size={14} />
        </button>
      )}

      {resizeHandle}

      {/* Gradient overlay for image backgrounds - only when there's text */}
      {(isRichYoutube || isLinkWithImage) && (block.title || block.subtext || block.channelTitle) && !isRepositioning && (
         <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/70 via-black/30 to-transparent z-0 pointer-events-none" />
      )}

      {/* Reposition UI for LINK blocks with images */}
      {isLinkWithImage && (
        <>
          {/* Reposition button - appears on hover */}
          {!isRepositioning && onInlineUpdate && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsRepositioning(true);
              }}
              className="absolute top-2 right-2 p-2 bg-black/60 hover:bg-black/80 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-20 backdrop-blur-sm"
              title="Reposition image"
            >
              <Move size={16} />
            </button>
          )}

          {/* Repositioning mode overlay */}
          {isRepositioning && (
            <div
              ref={mediaContainerRef}
              className="absolute inset-0 z-30 cursor-move"
              onMouseDown={handleMediaRepositionStart}
              onTouchStart={handleMediaRepositionStart}
            >
              <div className="absolute inset-0 bg-black/20" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/70 text-white px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap backdrop-blur-sm">
                Drag to reposition
              </div>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleCancelMediaPosition();
                  }}
                  className="p-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
                  title="Cancel"
                >
                  <X size={16} />
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSaveMediaPosition();
                  }}
                  className="p-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors"
                  title="Save position"
                >
                  <Check size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <div className="w-full h-full pointer-events-none relative z-10">
        
        {/* MEDIA BLOCK (Image/Video/GIF) */}
        {block.type === BlockType.MEDIA && block.imageUrl && !isLinkWithImage ? (
          <div
            ref={mediaContainerRef}
            className={`w-full h-full relative overflow-hidden ${isRepositioning ? 'cursor-move' : ''}`}
            onMouseDown={isRepositioning ? handleMediaRepositionStart : undefined}
            onTouchStart={isRepositioning ? handleMediaRepositionStart : undefined}
          >
              {/* Check if it's a video or gif */}
              {/\.(mp4|webm|ogg|mov)$/i.test(block.imageUrl) ? (
                <video
                  src={block.imageUrl}
                  className="full-img"
                  style={{ objectPosition: `${mediaPosition.x}% ${mediaPosition.y}%` }}
                  autoPlay
                  loop
                  muted
                  playsInline
                />
              ) : (
                <img
                  src={block.imageUrl}
                  alt={block.title || ''}
                  className="full-img"
                  style={{ objectPosition: `${mediaPosition.x}% ${mediaPosition.y}%` }}
                  draggable={false}
                />
              )}

              {/* Reposition button - appears on hover */}
              {!isRepositioning && onInlineUpdate && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsRepositioning(true);
                  }}
                  className="absolute top-2 right-2 p-2 bg-black/60 hover:bg-black/80 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto z-20 backdrop-blur-sm"
                  title="Reposition media"
                >
                  <Move size={16} />
                </button>
              )}

              {/* Repositioning mode UI */}
              {isRepositioning && (
                <>
                  {/* Overlay with instructions */}
                  <div className="absolute inset-0 bg-black/20 pointer-events-none z-10" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/70 text-white px-4 py-2 rounded-lg text-sm font-medium pointer-events-none z-20 whitespace-nowrap backdrop-blur-sm">
                    Drag to reposition
                  </div>

                  {/* Save/Cancel buttons */}
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2 pointer-events-auto z-20">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleCancelMediaPosition();
                      }}
                      className="p-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
                      title="Cancel"
                    >
                      <X size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleSaveMediaPosition();
                      }}
                      className="p-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors"
                      title="Save position"
                    >
                      <Check size={16} />
                    </button>
                  </div>
                </>
              )}

              {/* Subtle gradient from bottom for optional text */}
              {block.title && !isRepositioning && (
                <div className="media-overlay">
                  <p className={`media-title ${textSizes.overlayTitle}`}>{block.title}</p>
                  {block.subtext && <p className={`media-subtext ${textSizes.overlaySubtext}`}>{block.subtext}</p>}
                </div>
              )}
          </div>
        ) : block.type === BlockType.MAP ? (
          /* MAP BLOCK - Clean minimal */
          <div className="w-full h-full relative bg-gray-100 overflow-hidden">
              {/* SECURITY: Only render iframe if location is valid (not a URL/script) */}
              {isValidLocationString(block.content) ? (
                <iframe
                    width="100%"
                    height="100%"
                    className="opacity-95 grayscale-[20%] group-hover:grayscale-0 transition-all duration-500"
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(block.content || 'Paris')}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
                    loading="lazy"
                    sandbox="allow-scripts allow-same-origin"
                ></iframe>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                  Invalid location
                </div>
              )}
              {block.title && (
                <div className="absolute bottom-0 left-0 right-0 p-2 md:p-3 bg-gradient-to-t from-black/60 to-transparent">
                  <p className={`font-semibold text-white drop-shadow ${textSizes.overlayTitle}`}>{block.title}</p>
                </div>
              )}
          </div>
        ) : isRichYoutube ? (
          /* YOUTUBE SINGLE VIDEO - Clean design with just play button */
          <div className="w-full h-full relative">
            {/* Center: Play Button */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 rounded-full bg-red-500 flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                <Play size={12} className="md:w-4 md:h-4 lg:w-5 lg:h-5 text-white ml-0.5" fill="white" />
              </div>
            </div>

            {/* Bottom: Title only */}
            {(block.channelTitle || block.title) && (
              <div className="absolute bottom-0 left-0 right-0 p-2 md:p-3">
                <h3 className={`font-semibold text-white leading-tight drop-shadow-lg line-clamp-1 ${textSizes.overlayTitle}`}>{block.channelTitle || block.title}</h3>
              </div>
            )}
          </div>
        ) : (
          /* DEFAULT BLOCK (Link, Social, Text) - Clean minimal design */
          <div className="p-2 md:p-3 lg:p-4 h-full flex flex-col justify-between relative">
            {/* Icon for SOCIAL blocks only */}
            {block.type === BlockType.SOCIAL && (() => {
              const platform = block.socialPlatform ?? inferSocialPlatformFromUrl(block.content);
              const option = platform ? getSocialPlatformOption(platform) : undefined;
              const BrandIcon = option?.brandIcon;
              const FallbackIcon = option?.icon;
              const brandColor = option?.brandColor;
              const useColor = block.textColor === 'text-brand';
              const iconColor = useColor ? brandColor : undefined;

              return (
                <div className={`w-6 h-6 md:w-7 md:h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  block.textColor === 'text-white' || isLinkWithImage
                    ? 'bg-white/20 text-white backdrop-blur-sm'
                    : 'bg-gray-100'
                }`}>
                  {BrandIcon ? (
                    <BrandIcon size={14} className="md:w-4 md:h-4" style={iconColor ? { color: iconColor } : undefined} />
                  ) : FallbackIcon ? (
                    <FallbackIcon size={14} className="md:w-4 md:h-4" style={iconColor ? { color: iconColor } : undefined} />
                  ) : null}
                </div>
              );
            })()}

            <div className={`${block.type === BlockType.TEXT ? 'flex flex-col justify-center h-full' : 'mt-auto'}`}>
              {/* Editable Title */}
              <div className="group/title relative">
                {isEditingTitle ? (
                  <input
                    ref={titleInputRef}
                    type="text"
                    value={editTitleValue}
                    onChange={(e) => setEditTitleValue(e.target.value)}
                    onBlur={handleTitleSave}
                    onKeyDown={handleTitleKeyDown}
                    onClick={(e) => e.stopPropagation()}
                    className={`font-bold leading-tight tracking-tight bg-transparent border-b-2 border-violet-500 outline-none w-full pointer-events-auto ${block.type === BlockType.TEXT ? `${textSizes.titleText} mb-2` : textSizes.titleDefault} ${isLinkWithImage ? 'text-white' : ''}`}
                    placeholder="Title..."
                  />
                ) : (
                  <h3
                    className={`font-bold leading-tight tracking-tight cursor-text ${block.type === BlockType.TEXT ? `${textSizes.titleText} mb-2` : textSizes.titleDefault} ${isLinkWithImage ? 'text-white drop-shadow-lg' : ''}`}
                    onClick={(e) => {
                      if (onInlineUpdate) {
                        e.stopPropagation();
                        setIsEditingTitle(true);
                      }
                    }}
                  >
                    {block.channelTitle || block.title || <span className="opacity-40 italic">Add title...</span>}
                    {onInlineUpdate && !block.channelTitle && (
                      <Pencil size={12} className="inline-block ml-2 opacity-0 group-hover/title:opacity-50 transition-opacity" />
                    )}
                  </h3>
                )}
              </div>

              {/* Editable Subtext */}
              <div className="group/subtext relative">
                {isEditingSubtext ? (
                  <input
                    ref={subtextInputRef}
                    type="text"
                    value={editSubtextValue}
                    onChange={(e) => setEditSubtextValue(e.target.value)}
                    onBlur={handleSubtextSave}
                    onKeyDown={handleSubtextKeyDown}
                    onClick={(e) => e.stopPropagation()}
                    className={`${textSizes.subtext} font-medium bg-transparent border-b-2 border-violet-500 outline-none w-full pointer-events-auto mt-1 ${isLinkWithImage ? 'text-white/70' : 'opacity-60'}`}
                    placeholder="Subtitle..."
                  />
                ) : (
                  (block.subtext || onInlineUpdate) && (
                    <p
                      className={`${textSizes.subtext} mt-1 font-medium cursor-text ${isLinkWithImage ? 'text-white/80 drop-shadow' : 'opacity-60'}`}
                      onClick={(e) => {
                        if (onInlineUpdate) {
                          e.stopPropagation();
                          setIsEditingSubtext(true);
                        }
                      }}
                    >
                      {block.subtext || <span className="opacity-40 italic text-xs">Add subtitle...</span>}
                      {onInlineUpdate && (
                        <Pencil size={10} className="inline-block ml-1.5 opacity-0 group-hover/subtext:opacity-50 transition-opacity" />
                      )}
                    </p>
                  )
                )}
              </div>

              {block.type === BlockType.TEXT && block.content && (
                  <p className={`opacity-70 mt-2 whitespace-pre-wrap leading-relaxed ${textSizes.body}`}>{block.content}</p>
              )}
            </div>
          </div>
        )}
      </div>
      </div>
    </motion.div>
  );
};

export default Block;
