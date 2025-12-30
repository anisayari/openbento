import React, { useRef, useState } from 'react';
import { BlockData, BlockType, UserProfile } from '../types';
import { BASE_COLORS } from '../constants';
import { X, Link, MapPin, Image as ImageIcon, Type, Github, Upload, Trash2, LayoutGrid, Type as TypeIcon, MoveVertical, ArrowLeftRight, Youtube, ExternalLink, RefreshCw, Loader2, Grid3X3, Square, List, Palette, CheckCircle2 } from 'lucide-react';

interface EditorSidebarProps {
  profile: UserProfile;
  setProfile: (p: UserProfile) => void;
  addBlock: (type: BlockType) => void;
  editingBlock: BlockData | null;
  updateBlock: (b: BlockData) => void;
  onDelete: (id: string) => void;
  closeEdit: () => void;
  isOpen: boolean;
}

const EditorSidebar: React.FC<EditorSidebarProps> = ({
  profile,
  setProfile,
  addBlock,
  editingBlock,
  updateBlock,
  onDelete,
  closeEdit,
  isOpen
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile({ ...profile, avatarUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBlockImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editingBlock) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateBlock({ ...editingBlock, imageUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const isYouTubeActive = editingBlock?.channelId && editingBlock.channelId.length > 0;

  const fetchLatestFromRSS = async () => {
      const cId = editingBlock?.channelId;
      if (!cId) return;

      setIsFetching(true);
      setFetchError(null);

      try {
          const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${cId}`;
          const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(rssUrl)}`;
          
          const response = await fetch(proxyUrl);
          if (!response.ok) throw new Error("Network error");
          
          const text = await response.text();
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(text, "text/xml");
          
          const entries = Array.from(xmlDoc.querySelectorAll("entry"));
          const authorName = xmlDoc.querySelector("author > name")?.textContent;

          if (entries.length > 0 && editingBlock) {
              const videos = entries.slice(0, 4).map(entry => {
                  const vidId = entry.getElementsByTagName("yt:videoId")[0]?.textContent || "";
                  const vidTitle = entry.getElementsByTagName("title")[0]?.textContent || "";
                  return {
                      id: vidId,
                      title: vidTitle,
                      thumbnail: `https://img.youtube.com/vi/${vidId}/mqdefault.jpg`
                  };
              });

              const latestVideo = videos[0];
              
              updateBlock({
                  ...editingBlock,
                  youtubeVideoId: latestVideo.id,
                  youtubeVideos: videos,
                  content: `https://www.youtube.com/watch?v=${latestVideo.id}`,
                  title: authorName || editingBlock.title, 
                  subtext: latestVideo.title,
                  channelTitle: authorName || ''
              });

          } else {
              setFetchError("No videos found.");
          }
      } catch (error) {
          console.error(error);
          setFetchError("Failed to fetch. Check ID.");
      } finally {
          setIsFetching(false);
      }
  };

  const isSelectedColor = (c: any) => {
      if(!editingBlock) return false;
      if (editingBlock.customBackground) return editingBlock.customBackground === c.hex;
      return editingBlock.color === c.bg;
  };

  return (
    <div 
        className={`fixed right-0 top-0 h-screen w-full md:w-[400px] bg-white/95 backdrop-blur-xl z-50 shadow-2xl shadow-black/10 transform transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] flex flex-col border-l border-gray-200/50
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
    >
      
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-white to-gray-50/80 sticky top-0 z-20">
        <div>
          <h2 className="font-bold text-lg text-gray-900 tracking-tight">
            {editingBlock ? 'Edit Block' : 'Builder'}
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">{editingBlock ? 'Customize your block' : 'Create your identity'}</p>
        </div>
        <button onClick={closeEdit} className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-600"><X size={18} /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-10 no-scrollbar pb-20">
        
        {/* EDITING A SPECIFIC BLOCK */}
        {editingBlock ? (
          <div className="space-y-8 animate-fade-in">
            
            {/* Input Group */}
            <div className="space-y-5">
                
                {/* 1. Title (Not for spacers) */}
                {editingBlock.type !== BlockType.SPACER && (
                  <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Title</label>
                      <input 
                          type="text" 
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3.5 focus:ring-2 focus:ring-black/5 focus:border-black focus:outline-none transition-all font-medium"
                          value={editingBlock.title || ''}
                          onChange={(e) => updateBlock({...editingBlock, title: e.target.value})}
                          placeholder="Label your block"
                      />
                  </div>
                )}

                {/* 2. SOCIAL BLOCK: Platform Selector */}
                {editingBlock.type === BlockType.SOCIAL && (
                    <div className="p-1 bg-gray-100 rounded-xl flex mb-4">
                        <button 
                            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${!isYouTubeActive ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                            onClick={() => updateBlock({...editingBlock, channelId: undefined, youtubeVideoId: undefined})}
                        >
                            Generic Link
                        </button>
                        <button 
                            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${isYouTubeActive ? 'bg-red-500 shadow text-white' : 'text-gray-500 hover:text-red-600'}`}
                            onClick={() => updateBlock({...editingBlock, channelId: 'UCRlsJWh1XwmNGxZPFgJ0Zlw', youtubeMode: 'single'})} 
                        >
                            <Youtube size={14} /> YouTube
                        </button>
                    </div>
                )}

                {/* 3. YOUTUBE SPECIFIC INPUTS */}
                {isYouTubeActive && (
                     <div className="p-5 bg-red-50 rounded-2xl border border-red-100 space-y-5">
                        
                        {/* A. Channel Config */}
                        <div>
                             <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex justify-between">
                                Channel ID
                                <a href="https://commentpicker.com/youtube-channel-id.php" target="_blank" rel="noreferrer" className="text-[10px] text-red-500 underline flex items-center">Find ID <ExternalLink size={8} className="ml-1"/></a>
                             </label>
                             <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    className="w-full bg-white border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-red-500/20 focus:outline-none text-sm placeholder-gray-400 font-mono"
                                    value={editingBlock.channelId || ''}
                                    onChange={(e) => updateBlock({...editingBlock, channelId: e.target.value})}
                                    placeholder="UC..."
                                />
                                <button 
                                    onClick={fetchLatestFromRSS}
                                    disabled={isFetching || !editingBlock.channelId}
                                    className="bg-red-500 text-white px-4 rounded-xl font-bold text-xs hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[44px]"
                                    title="Fetch latest videos"
                                >
                                    {isFetching ? <Loader2 size={18} className="animate-spin"/> : <RefreshCw size={18} />}
                                </button>
                             </div>
                             {fetchError && <p className="text-red-500 text-xs mt-2 font-medium">{fetchError}</p>}
                        </div>

                        {/* B. Display Mode Toggle (Always Visible) */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Video Layout</label>
                            <div className="grid grid-cols-3 gap-2">
                                <button 
                                    onClick={() => updateBlock({...editingBlock, youtubeMode: 'single', colSpan: 1, rowSpan: 1})}
                                    className={`p-2 rounded-xl text-xs font-medium border flex flex-col items-center justify-center gap-2 h-20 transition-all ${editingBlock.youtubeMode === 'single' || !editingBlock.youtubeMode ? 'bg-red-500 text-white border-red-500 shadow-md ring-2 ring-red-200' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}
                                >
                                    <Square size={20}/> Single
                                </button>
                                <button 
                                    onClick={() => updateBlock({...editingBlock, youtubeMode: 'grid', colSpan: 2, rowSpan: 2})}
                                    className={`p-2 rounded-xl text-xs font-medium border flex flex-col items-center justify-center gap-2 h-20 transition-all ${editingBlock.youtubeMode === 'grid' ? 'bg-red-500 text-white border-red-500 shadow-md ring-2 ring-red-200' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}
                                >
                                    <Grid3X3 size={20}/> Grid
                                </button>
                                <button 
                                    onClick={() => updateBlock({...editingBlock, youtubeMode: 'list', colSpan: 2, rowSpan: 2})}
                                    className={`p-2 rounded-xl text-xs font-medium border flex flex-col items-center justify-center gap-2 h-20 transition-all ${editingBlock.youtubeMode === 'list' ? 'bg-red-500 text-white border-red-500 shadow-md ring-2 ring-red-200' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}
                                >
                                    <List size={20}/> List
                                </button>
                            </div>
                        </div>
                     </div>
                )}

                {/* 4. CONTENT FIELDS (Standard) */}
                {(!isYouTubeActive && (editingBlock.type === BlockType.LINK || editingBlock.type === BlockType.SOCIAL || editingBlock.type === BlockType.IMAGE || editingBlock.type === BlockType.MAP)) && (
                    <div>
                         {/* Image Upload for Block */}
                         {(editingBlock.type === BlockType.IMAGE || editingBlock.type === BlockType.LINK) && (
                             <div className="mb-4">
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Upload Image {editingBlock.type === BlockType.LINK ? '(Optional Background)' : ''}</label>
                                <div className="relative group cursor-pointer border-2 border-dashed border-gray-300 rounded-xl p-4 hover:border-black transition-colors" onClick={() => document.getElementById('block-img-upload')?.click()}>
                                    <input id="block-img-upload" type="file" className="hidden" accept="image/*" onChange={handleBlockImageUpload} />
                                    <div className="flex flex-col items-center gap-2 text-gray-500">
                                        <Upload size={20} />
                                        <span className="text-xs">Click to upload</span>
                                    </div>
                                    {editingBlock.imageUrl && (
                                        <div className="mt-2 text-[10px] text-green-600 font-medium text-center">Image Selected</div>
                                    )}
                                </div>
                             </div>
                         )}

                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                            {editingBlock.type === BlockType.IMAGE ? 'Or Image URL' : 
                            editingBlock.type === BlockType.MAP ? 'Address / City' : 'Destination URL'}
                        </label>
                        <input 
                            type="text" 
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3.5 focus:ring-2 focus:ring-black/5 focus:border-black focus:outline-none transition-all font-medium text-gray-600"
                            value={editingBlock.type === BlockType.IMAGE ? (editingBlock.imageUrl || '') : (editingBlock.content || '')}
                            onChange={(e) => {
                                if (editingBlock.type === BlockType.IMAGE) updateBlock({...editingBlock, imageUrl: e.target.value});
                                else updateBlock({...editingBlock, content: e.target.value});
                            }}
                            placeholder="https://..."
                        />
                    </div>
                )}

                {(editingBlock.type === BlockType.TEXT || editingBlock.type === BlockType.LINK || editingBlock.type === BlockType.SOCIAL) && (
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                            {editingBlock.type === BlockType.TEXT ? 'Description' : 'Subtitle / Details'}
                        </label>
                        <textarea 
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3.5 focus:ring-2 focus:ring-black/5 focus:border-black focus:outline-none transition-all font-medium text-gray-600 h-28 resize-none"
                            value={editingBlock.type === BlockType.TEXT ? (editingBlock.content || '') : (editingBlock.subtext || '')}
                            onChange={(e) => {
                                if (editingBlock.type === BlockType.TEXT) updateBlock({...editingBlock, content: e.target.value});
                                else updateBlock({...editingBlock, subtext: e.target.value});
                            }}
                        />
                    </div>
                )}
            </div>

            {/* Layout Controls */}
            <div className="space-y-4">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Dimensions</label>
                <div className="grid grid-cols-2 gap-3">
                    <button 
                        onClick={() => updateBlock({...editingBlock, colSpan: editingBlock.colSpan >= 2 ? 1 : 2})}
                        className={`p-3 border rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${editingBlock.colSpan === 2 ? 'bg-black text-white border-black shadow-md' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                    >
                        <ArrowLeftRight size={16}/> {editingBlock.colSpan === 2 ? 'Wide' : editingBlock.colSpan === 3 ? 'Full' : 'Regular'}
                    </button>
                    <button 
                         onClick={() => updateBlock({...editingBlock, colSpan: 3})}
                         className={`p-3 border rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${editingBlock.colSpan === 3 ? 'bg-black text-white border-black shadow-md' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                    >
                        <LayoutGrid size={16} /> Full Width
                    </button>
                    <button 
                        onClick={() => updateBlock({...editingBlock, rowSpan: editingBlock.rowSpan === 1 ? 2 : 1})}
                        className={`p-3 border rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${editingBlock.rowSpan === 2 ? 'bg-black text-white border-black shadow-md' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                    >
                        <MoveVertical size={16}/> {editingBlock.rowSpan === 2 ? 'Tall' : 'Short'}
                    </button>
                </div>
            </div>

            {/* Appearance (Colors & Gradients) */}
            {editingBlock.type !== BlockType.SPACER && (
                <div className="space-y-4">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                        <Palette size={14}/> Background Style
                    </label>
                    
                    {/* Solid Colors */}
                    <div className="space-y-2">
                        <span className="text-[10px] font-semibold text-gray-400 uppercase">Solid Colors</span>
                        <div className="grid grid-cols-5 gap-3">
                            {BASE_COLORS.filter(c => c.type === 'solid').map(c => {
                                const active = isSelectedColor(c);
                                return (
                                    <button
                                        key={c.name}
                                        onClick={() => updateBlock({...editingBlock, color: c.bg, textColor: c.text, customBackground: undefined})}
                                        className={`h-10 rounded-full border shadow-sm transition-all transform active:scale-95 ${c.bg} ${active ? 'ring-2 ring-offset-2 ring-gray-900 scale-110' : 'hover:scale-105'} flex items-center justify-center`}
                                        title={c.name}
                                    >
                                        {active && <CheckCircle2 size={16} className={c.text === 'text-white' ? 'text-white' : 'text-black'}/>}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Gradients */}
                    <div className="space-y-2 mt-4">
                        <span className="text-[10px] font-semibold text-gray-400 uppercase">Gradients</span>
                        <div className="grid grid-cols-2 gap-3">
                            {BASE_COLORS.filter(c => c.type === 'gradient').map(c => {
                                const active = isSelectedColor(c);
                                return (
                                    <button
                                        key={c.name}
                                        onClick={() => updateBlock({...editingBlock, color: c.bg, textColor: c.text, customBackground: c.hex})}
                                        style={{ background: c.hex }}
                                        className={`h-12 rounded-xl border border-black/5 shadow-sm transition-all transform active:scale-95 ${active ? 'ring-2 ring-offset-2 ring-gray-900 scale-105' : 'hover:scale-105'} flex items-center justify-center relative overflow-hidden`}
                                        title={c.name}
                                    >
                                        <span className="relative z-10 text-xs font-bold text-white drop-shadow-md">{c.name}</span>
                                        {active && <div className="absolute top-1 right-1 text-white drop-shadow-md"><CheckCircle2 size={14}/></div>}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                </div>
            )}

            <div className="pt-6 border-t border-gray-100">
                 <button 
                    onClick={() => onDelete(editingBlock.id)}
                    className="w-full py-3 text-red-500 font-medium hover:bg-red-50 rounded-xl transition-colors flex items-center justify-center gap-2"
                 >
                    <Trash2 size={18}/> Remove Block
                 </button>
            </div>

          </div>
        ) : (
          /* MAIN PROFILE & ADD BLOCKS (Unchanged) */
          <div className="space-y-12 animate-fade-in">
             {/* ... Profile ... */}
             <section className="space-y-5">
                <div className="flex items-center gap-2">
                    <div className="w-1 h-5 bg-gradient-to-b from-violet-500 to-purple-600 rounded-full"></div>
                    <h3 className="text-base font-bold text-gray-900">Profile Identity</h3>
                </div>
                
                <div className="flex gap-5 items-start">
                    <div className="relative group">
                        <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 ring-2 ring-white shadow-lg group-hover:ring-violet-200 transition-all cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                            <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                                <Upload className="text-white w-5 h-5" />
                            </div>
                        </div>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                    </div>
                    <div className="flex-1">
                        <input 
                            type="text" value={profile.name} onChange={(e) => setProfile({...profile, name: e.target.value})}
                            className="w-full bg-transparent border-b-2 border-gray-200 pb-2 text-xl font-bold focus:border-violet-500 focus:outline-none placeholder-gray-300 transition-colors"
                            placeholder="Your Name"
                        />
                        <p className="text-xs text-gray-400 mt-2">Click avatar to change</p>
                    </div>
                </div>

                <div>
                   <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Bio</label>
                   <textarea 
                      value={profile.bio} onChange={(e) => setProfile({...profile, bio: e.target.value})}
                      className="w-full bg-gray-50/80 border border-gray-200 rounded-xl p-3.5 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 focus:outline-none h-24 resize-none text-sm leading-relaxed transition-all"
                      placeholder="Tell your story..."
                   />
                </div>
             </section>

             <section className="space-y-5">
                <div className="flex items-center gap-2">
                    <div className="w-1 h-5 bg-gradient-to-b from-amber-400 to-orange-500 rounded-full"></div>
                    <h3 className="text-base font-bold text-gray-900">Add Content</h3>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { type: BlockType.LINK, label: 'Link', icon: Link, gradient: 'from-blue-500 to-cyan-500' },
                        { type: BlockType.SOCIAL, label: 'Social', icon: Github, gradient: 'from-violet-500 to-purple-600' },
                        { type: BlockType.IMAGE, label: 'Image', icon: ImageIcon, gradient: 'from-pink-500 to-rose-500' },
                        { type: BlockType.TEXT, label: 'Note', icon: TypeIcon, gradient: 'from-emerald-500 to-teal-500' },
                        { type: BlockType.MAP, label: 'Map', icon: MapPin, gradient: 'from-orange-500 to-amber-500' },
                        { type: BlockType.SPACER, label: 'Spacer', icon: MoveVertical, gradient: 'from-gray-400 to-gray-500' },
                    ].map((btn) => (
                        <button 
                            key={btn.type} onClick={() => addBlock(btn.type)} 
                            className="flex flex-col items-center gap-2 p-4 bg-white border border-gray-100 rounded-2xl hover:border-gray-200 hover:shadow-lg transition-all group"
                        >
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${btn.gradient} text-white flex items-center justify-center group-hover:scale-110 group-hover:shadow-md transition-all`}>
                                <btn.icon size={18}/>
                            </div>
                            <span className="text-xs font-semibold text-gray-600">{btn.label}</span>
                        </button>
                    ))}
                </div>
             </section>
          </div>
        )}
      </div>

      <div className="p-4 bg-gradient-to-r from-gray-50 to-white border-t border-gray-100">
         <p className="text-xs text-center text-gray-400 font-medium">OpenBento &bull; Open Source</p>
      </div>
    </div>
  );
};

export default EditorSidebar;