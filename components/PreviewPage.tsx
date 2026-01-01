import React, { useEffect, useMemo, useState } from 'react';
import type { AvatarStyle, BlockData, SavedBento } from '../types';
import { generatePreviewSrcDoc } from '../services/exportService';
import { getBento, getOrCreateActiveBento, setActiveBentoId } from '../services/storageService';
import Block from './Block';
import { buildSocialUrl, formatFollowerCount, getSocialPlatformOption } from '../socialPlatforms';

const PreviewPage: React.FC = () => {
  const [bento, setBento] = useState<SavedBento | null>(null);
  const [mode, setMode] = useState<'builder' | 'export'>('builder');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedId = params.get('id')?.trim();
    const requestedMode = params.get('mode');
    setMode(requestedMode === 'export' ? 'export' : 'builder');
    const requested = requestedId ? getBento(requestedId) : null;

    const resolved = requested || getOrCreateActiveBento();
    if (requested) setActiveBentoId(requested.id);
    setBento(resolved);
  }, []);

  const srcDoc = useMemo(() => {
    if (!bento || mode !== 'export') return '';
    return generatePreviewSrcDoc(bento.data, { siteId: bento.id });
  }, [bento, mode]);

  const getAvatarClasses = (style?: AvatarStyle) => {
    const s = style || { shape: 'rounded', shadow: true, border: true };
    const classes: string[] = ['w-full', 'h-full', 'object-cover', 'transition-transform', 'duration-500', 'group-hover:scale-110'];
    return classes.join(' ');
  };

  const getAvatarContainerClasses = (style?: AvatarStyle) => {
    const s = style || { shape: 'rounded', shadow: true, border: true };
    const classes: string[] = ['w-40', 'h-40', 'overflow-hidden', 'relative', 'z-10', 'bg-gray-100'];

    if (s.shape === 'circle') classes.push('rounded-full');
    else if (s.shape === 'square') classes.push('rounded-none');
    else classes.push('rounded-3xl');

    if (s.shadow) classes.push('shadow-2xl');

    return classes.join(' ');
  };

  const getAvatarContainerStyle = (style?: AvatarStyle): React.CSSProperties => {
    const s = style || { shape: 'rounded', shadow: true, border: true, borderColor: '#ffffff', borderWidth: 4 };
    const styles: React.CSSProperties = {};

    if (s.border) {
      styles.border = `${s.borderWidth || 4}px solid ${s.borderColor || '#ffffff'}`;
    }

    return styles;
  };

  if (!bento) {
    return (
      <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center text-gray-400">
        Loading...
      </div>
    );
  }

  if (mode === 'export') {
    return (
      <div className="min-h-screen bg-gray-100">
        <iframe title="Preview" srcDoc={srcDoc} className="w-full h-screen border-0" />
      </div>
    );
  }

  const profile = bento.data.profile;
  const blocks = bento.data.blocks;
  const noop = () => {};
  const noopId = (_id: string) => {};
  const noopDrag = (_id: string, _event: React.DragEvent) => {};
  const noopDrop = (_id: string, _event: React.DragEvent) => {};
  const noopBlock = (_block: BlockData) => {};

  // Render social icons for header
  const renderSocialIcons = () => {
    if (!profile.showSocialInHeader || !profile.socialAccounts || profile.socialAccounts.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-2 sm:gap-3 mt-4">
        {profile.socialAccounts.map((account) => {
          const option = getSocialPlatformOption(account.platform);
          if (!option) return null;
          const BrandIcon = option.brandIcon;
          const FallbackIcon = option.icon;
          const url = buildSocialUrl(account.platform, account.handle);
          const showCount = profile.showFollowerCount && account.followerCount;
          return (
            <a
              key={account.platform}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className={`${showCount ? 'px-2 sm:px-3 py-1.5 sm:py-2 rounded-full' : 'w-8 h-8 sm:w-10 sm:h-10 rounded-full'} bg-white shadow-md flex items-center justify-center gap-1.5 sm:gap-2 hover:scale-105 hover:shadow-lg transition-all`}
              title={option.label}
            >
              {BrandIcon ? (
                <BrandIcon size={18} className="sm:w-5 sm:h-5" style={{ color: option.brandColor }} />
              ) : (
                <FallbackIcon size={18} className="sm:w-5 sm:h-5 text-gray-600" />
              )}
              {showCount && (
                <span className="text-xs sm:text-sm font-semibold text-gray-700">{formatFollowerCount(account.followerCount)}</span>
              )}
            </a>
          );
        })}
      </div>
    );
  };

  // Background style from profile settings
  const backgroundStyle: React.CSSProperties = profile.backgroundImage
    ? {
        backgroundImage: `url(${profile.backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }
    : profile.backgroundColor
      ? { backgroundColor: profile.backgroundColor }
      : { backgroundColor: '#f9fafb' }; // default gray-50

  return (
    <div className="min-h-screen flex flex-col lg:flex-row font-sans overflow-x-hidden relative" style={backgroundStyle}>
      {/* Background blur overlay */}
      {profile.backgroundImage && profile.backgroundBlur && profile.backgroundBlur > 0 && (
        <div
          className="absolute inset-0 z-0"
          style={{
            backdropFilter: `blur(${profile.backgroundBlur}px)`,
            WebkitBackdropFilter: `blur(${profile.backgroundBlur}px)`,
          }}
        />
      )}
      {/* Mobile Header */}
      <div className="lg:hidden w-full bg-white shadow-sm sticky top-0 z-20 relative">
        <div className="flex items-center gap-4 p-4">
          <div className={`w-14 h-14 shrink-0 overflow-hidden ${
            profile.avatarStyle?.shape === 'circle' ? 'rounded-full' :
            profile.avatarStyle?.shape === 'square' ? 'rounded-none' : 'rounded-xl'
          } ${profile.avatarStyle?.shadow ? 'shadow-lg' : ''}`}
            style={profile.avatarStyle?.border ? { border: `${profile.avatarStyle.borderWidth || 3}px solid ${profile.avatarStyle.borderColor || '#ffffff'}` } : undefined}
          >
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500 text-lg font-bold">
                {profile.name.charAt(0)}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold text-gray-900 truncate">{profile.name}</h1>
            <p className="text-sm text-gray-500 line-clamp-2">{profile.bio || '—'}</p>
          </div>
        </div>
        {profile.showSocialInHeader && profile.socialAccounts && profile.socialAccounts.length > 0 && (
          <div className="px-4 pb-3 -mt-1">
            {renderSocialIcons()}
          </div>
        )}
      </div>

      <div className="flex-1 relative min-h-screen">
        {/* Desktop Sidebar */}
        <div className="hidden lg:flex fixed left-0 top-0 w-[420px] h-screen flex-col justify-center items-start px-12 z-10">
          <div className="flex flex-col items-start text-left">
            <div className="relative group mb-8">
              <div className={getAvatarContainerClasses(profile.avatarStyle)} style={getAvatarContainerStyle(profile.avatarStyle)}>
                {profile.avatarUrl ? (
                  <img src={profile.avatarUrl} alt={profile.name} className={getAvatarClasses(profile.avatarStyle)} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl font-bold">
                    {profile.name.charAt(0)}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3 w-full max-w-xs">
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 leading-[1.1]">{profile.name}</h1>
              <p className="text-base text-gray-500 font-medium leading-relaxed whitespace-pre-wrap">
                {profile.bio || '—'}
              </p>
              {renderSocialIcons()}
            </div>
          </div>
        </div>

        {/* Bento Grid */}
        <div className="w-full min-h-screen">
          <div className="max-w-[1600px] mx-auto">
            <div className="p-3 sm:p-4 lg:p-12 pt-4 lg:pt-24 transition-all duration-300 lg:ml-[420px]">
              <style>{`
                .preview-bento-grid {
                  display: grid;
                  gap: 6px;
                  grid-template-columns: repeat(4, 1fr);
                  grid-auto-rows: 44px;
                }
                @media (min-width: 480px) {
                  .preview-bento-grid {
                    gap: 8px;
                    grid-template-columns: repeat(6, 1fr);
                    grid-auto-rows: 52px;
                  }
                }
                @media (min-width: 768px) {
                  .preview-bento-grid {
                    grid-template-columns: repeat(9, 1fr);
                    grid-auto-rows: 58px;
                  }
                }
                @media (min-width: 1024px) {
                  .preview-bento-grid {
                    grid-auto-rows: 64px;
                  }
                }
              `}</style>
              <div className="preview-bento-grid">
                {blocks.map((block, index) => {
                  // Build responsive grid placement
                  // Mobile: large blocks (3+ cols or 3+ rows) take full width
                  const isLargeBlock = block.colSpan >= 3 || block.rowSpan >= 3;
                  const mobileCol = isLargeBlock ? 4 : Math.min(block.colSpan, 4);
                  // Mobile rows: cap at 2 for small blocks, 3 for large
                  const mobileRow = isLargeBlock ? Math.min(block.rowSpan, 3) : Math.min(block.rowSpan, 2);
                  const tabletCol = Math.min(block.colSpan, 6);
                  const tabletRow = Math.min(block.rowSpan, 4);
                  const desktopCol = block.gridColumn
                    ? `${block.gridColumn} / span ${block.colSpan}`
                    : `span ${block.colSpan}`;
                  const desktopRow = block.gridRow
                    ? `${block.gridRow} / span ${block.rowSpan}`
                    : `span ${block.rowSpan}`;

                  return (
                    <div
                      key={block.id}
                      className={`block-${block.id} h-full`}
                      style={{
                        gridColumn: `span ${mobileCol}`,
                        gridRow: `span ${mobileRow}`,
                      }}
                    >
                      <style>{`
                        @media (min-width: 480px) {
                          .block-${block.id} {
                            grid-column: span ${tabletCol} !important;
                            grid-row: span ${tabletRow} !important;
                          }
                        }
                        @media (min-width: 768px) {
                          .block-${block.id} {
                            grid-column: ${desktopCol} !important;
                            grid-row: ${desktopRow} !important;
                          }
                        }
                      `}</style>
                      <Block
                        block={{ ...block, zIndex: index + 1 }}
                        isSelected={false}
                        isDragTarget={false}
                        isDragging={false}
                        enableResize={false}
                        isResizing={false}
                        onResizeStart={undefined}
                        onEdit={noopBlock}
                        onDelete={noopId}
                        onDragStart={noopDrag}
                        onDragEnter={noopId}
                        onDragEnd={noop}
                        onDrop={noopDrop}
                        enableTiltEffect={true}
                        previewMode={true}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {profile.showBranding !== false && (
          <footer className="w-full py-10 text-center">
            <p className="text-sm text-gray-400 font-medium">
              Made with <span className="text-red-400">♥</span> using{' '}
              <a
                href="https://github.com/yoanbernabeu/openbento"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 font-semibold hover:text-violet-500 transition-colors"
              >
                OpenBento
              </a>
            </p>
          </footer>
        )}
      </div>
    </div>
  );
};

export default PreviewPage;
