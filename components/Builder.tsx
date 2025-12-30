import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SiteData, UserProfile, BlockData, BlockType, SavedBento } from '../types';
import Block from './Block';
import EditorSidebar from './EditorSidebar';
import ProfileDropdown from './ProfileDropdown';
import { exportSite } from '../services/exportService';
import { getOrCreateActiveBento, updateBentoData, setActiveBentoId, getBento } from '../services/storageService';
import { Download, Layout, Share2, X, Check, Plus, Eye, Smartphone, Monitor, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BuilderProps {
  onBack: () => void;
}

const Builder: React.FC<BuilderProps> = ({ onBack }) => {
  // Load initial data from localStorage
  const [activeBento, setActiveBento] = useState<SavedBento | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [blocks, setBlocks] = useState<BlockData[]>([]);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [isLoading, setIsLoading] = useState(true);
  
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);
  const [dragOverBlockId, setDragOverBlockId] = useState<string | null>(null);
  const [dragOverSlotIndex, setDragOverSlotIndex] = useState<number | null>(null);

  // Auto-save debounce ref
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load bento on mount
  useEffect(() => {
    const bento = getOrCreateActiveBento();
    setActiveBento(bento);
    setProfile(bento.data.profile);
    setBlocks(bento.data.blocks);
    setIsLoading(false);
  }, []);

  // Auto-save function
  const autoSave = useCallback((newProfile: UserProfile, newBlocks: BlockData[]) => {
    if (!activeBento) return;
    
    // Clear previous timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Debounce save by 500ms
    saveTimeoutRef.current = setTimeout(() => {
      updateBentoData(activeBento.id, {
        profile: newProfile,
        blocks: newBlocks
      });
    }, 500);
  }, [activeBento]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Handle profile changes with auto-save
  const handleSetProfile = useCallback((newProfile: UserProfile | ((prev: UserProfile) => UserProfile)) => {
    setProfile(prev => {
      const updated = typeof newProfile === 'function' ? newProfile(prev!) : newProfile;
      autoSave(updated, blocks);
      return updated;
    });
  }, [blocks, autoSave]);

  // Handle blocks changes with auto-save
  const handleSetBlocks = useCallback((newBlocks: BlockData[] | ((prev: BlockData[]) => BlockData[])) => {
    setBlocks(prev => {
      const updated = typeof newBlocks === 'function' ? newBlocks(prev) : newBlocks;
      if (profile) autoSave(profile, updated);
      return updated;
    });
  }, [profile, autoSave]);

  // Handle bento change from dropdown
  const handleBentoChange = useCallback((bento: SavedBento) => {
    // Save current before switching
    if (activeBento && profile) {
      updateBentoData(activeBento.id, { profile, blocks });
    }
    
    setActiveBentoId(bento.id);
    setActiveBento(bento);
    setProfile(bento.data.profile);
    setBlocks(bento.data.blocks);
    setEditingBlockId(null);
  }, [activeBento, profile, blocks]);

  const addBlock = (type: BlockType) => {
    // Check for pending position from grid cell click
    let gridPosition: { col?: number; row?: number } = {};
    const pendingPosition = sessionStorage.getItem('pendingBlockPosition');
    if (pendingPosition) {
      try {
        const { col, row } = JSON.parse(pendingPosition);
        gridPosition = { col, row };
      } catch (e) {
        // ignore
      }
      sessionStorage.removeItem('pendingBlockPosition');
    }

    const newBlock: BlockData = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      title: type === BlockType.SOCIAL ? 'Social' : type === BlockType.MAP ? 'Location' : type === BlockType.SPACER ? 'Spacer' : 'New Block',
      content: '',
      colSpan: type === BlockType.SPACER ? 3 : 1,
      rowSpan: 1,
      color: type === BlockType.SPACER ? 'bg-transparent' : 'bg-white',
      textColor: 'text-gray-900',
      gridColumn: gridPosition.col,
      gridRow: gridPosition.row,
    };
    handleSetBlocks([...blocks, newBlock]);
    setEditingBlockId(newBlock.id);
    if (!isSidebarOpen) setIsSidebarOpen(true);
  };

  const updateBlock = (updatedBlock: BlockData) => {
    handleSetBlocks(blocks.map(b => b.id === updatedBlock.id ? updatedBlock : b));
  };

  const deleteBlock = (id: string) => {
    handleSetBlocks(blocks.filter(b => b.id !== id));
    if (editingBlockId === id) setEditingBlockId(null);
  };

  const handleExport = () => {
    if (!profile) return;
    exportSite({ profile, blocks });
    setShowDeployModal(true);
  };

  const closeSidebar = () => {
      setEditingBlockId(null);
      setIsSidebarOpen(false);
  };

  const handleDragStart = (id: string) => {
    setDraggedBlockId(id);
  };

  const handleDragEnter = (targetId: string) => {
    if (draggedBlockId && draggedBlockId !== targetId) {
      setDragOverBlockId(targetId);
      setDragOverSlotIndex(null);
    }
  };

  const handleDragEnterSlot = (slotIndex: number) => {
    if (draggedBlockId) {
      setDragOverSlotIndex(slotIndex);
      setDragOverBlockId(null);
    }
  };

  const handleDragEnd = () => {
    setDraggedBlockId(null);
    setDragOverBlockId(null);
    setDragOverSlotIndex(null);
  };

  const handleDrop = (targetId: string) => {
    if (!draggedBlockId || draggedBlockId === targetId) {
        handleDragEnd();
        return;
    }
    const sourceIndex = blocks.findIndex(b => b.id === draggedBlockId);
    const targetIndex = blocks.findIndex(b => b.id === targetId);

    if (sourceIndex === -1 || targetIndex === -1) {
        handleDragEnd();
        return;
    }
    
    const sourceBlock = blocks[sourceIndex];
    const targetBlock = blocks[targetIndex];
    const GRID_COLS = 3;
    
    // Helper to check if two blocks overlap
    const blocksOverlap = (a: BlockData, b: BlockData) => {
      if (a.gridColumn === undefined || a.gridRow === undefined || 
          b.gridColumn === undefined || b.gridRow === undefined) return false;
      
      const aRight = a.gridColumn + Math.min(a.colSpan, GRID_COLS);
      const aBottom = a.gridRow + a.rowSpan;
      const bRight = b.gridColumn + Math.min(b.colSpan, GRID_COLS);
      const bBottom = b.gridRow + b.rowSpan;
      
      return !(aRight <= b.gridColumn || a.gridColumn >= bRight || 
               aBottom <= b.gridRow || a.gridRow >= bBottom);
    };
    
    // Helper to find next available position for a block
    const findNextAvailablePosition = (block: BlockData, occupiedCells: Set<string>, excludeId?: string): { col: number, row: number } => {
      const neededCols = Math.min(block.colSpan, GRID_COLS);
      
      for (let row = 1; row <= 20; row++) {
        for (let col = 1; col <= GRID_COLS - neededCols + 1; col++) {
          let canPlace = true;
          
          for (let c = col; c < col + neededCols && canPlace; c++) {
            for (let r = row; r < row + block.rowSpan && canPlace; r++) {
              if (occupiedCells.has(`${c}-${r}`)) {
                canPlace = false;
              }
            }
          }
          
          if (canPlace) {
            return { col, row };
          }
        }
      }
      return { col: 1, row: 1 };
    };
    
    // Move source block to target's position
    let newBlocks = blocks.map(b => {
      if (b.id === sourceBlock.id) {
        return {
          ...b,
          gridColumn: targetBlock.gridColumn,
          gridRow: targetBlock.gridRow,
        };
      }
      return b;
    });
    
    // Find all blocks that now conflict with the moved source block
    const movedSource = newBlocks.find(b => b.id === sourceBlock.id)!;
    
    // Build occupied cells set (excluding conflicting blocks initially)
    const getOccupiedCells = (blocksToCheck: BlockData[], excludeIds: string[] = []) => {
      const cells = new Set<string>();
      blocksToCheck.forEach(block => {
        if (excludeIds.includes(block.id)) return;
        if (block.gridColumn === undefined || block.gridRow === undefined) return;
        
        const cols = Math.min(block.colSpan, GRID_COLS);
        for (let c = block.gridColumn; c < block.gridColumn + cols; c++) {
          for (let r = block.gridRow; r < block.gridRow + block.rowSpan; r++) {
            cells.add(`${c}-${r}`);
          }
        }
      });
      return cells;
    };
    
    // Find conflicting blocks and relocate them
    const conflictingBlocks = newBlocks.filter(b => 
      b.id !== movedSource.id && blocksOverlap(movedSource, b)
    );
    
    if (conflictingBlocks.length > 0) {
      // Relocate each conflicting block one by one
      conflictingBlocks.forEach(conflictBlock => {
        const occupiedCells = getOccupiedCells(newBlocks, [conflictBlock.id]);
        const newPos = findNextAvailablePosition(conflictBlock, occupiedCells, conflictBlock.id);
        
        newBlocks = newBlocks.map(b => {
          if (b.id === conflictBlock.id) {
            return { ...b, gridColumn: newPos.col, gridRow: newPos.row };
          }
          return b;
        });
      });
    }
    
    handleSetBlocks(newBlocks);
    handleDragEnd();
  };

  const handleDropAtSlot = (slotIndex: number) => {
    if (!draggedBlockId) {
      handleDragEnd();
      return;
    }
    const sourceIndex = blocks.findIndex(b => b.id === draggedBlockId);
    if (sourceIndex === -1) {
      handleDragEnd();
      return;
    }
    
    const newBlocks = [...blocks];
    const [movedBlock] = newBlocks.splice(sourceIndex, 1);
    
    // Adjust target index if source was before target
    const adjustedIndex = sourceIndex < slotIndex ? slotIndex - 1 : slotIndex;
    newBlocks.splice(adjustedIndex, 0, movedBlock);
    
    handleSetBlocks(newBlocks);
    handleDragEnd();
  };

  const editingBlock = blocks.find(b => b.id === editingBlockId) || null;

  // Loading state
  if (isLoading || !profile) {
    return (
      <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-stone-100 flex font-sans overflow-x-hidden">
      
      {/* Background Pattern */}
      <div className="fixed inset-0 pointer-events-none opacity-30">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-violet-200/40 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-amber-200/30 to-transparent rounded-full blur-3xl" />
      </div>
      
      {/* 1. MAIN PREVIEW CANVAS */}
      <div className="flex-1 relative min-h-screen">
        
        {/* Floating Navbar */}
        <nav className="fixed top-4 left-4 right-4 z-40 pointer-events-none">
           <div className="max-w-[1800px] mx-auto flex justify-between items-center">
              
              {/* Logo Pill */}
              <div className="bg-white/90 backdrop-blur-xl px-2 py-2 rounded-2xl shadow-lg shadow-black/5 border border-white/50 flex gap-2 items-center pointer-events-auto select-none">
                 <button onClick={onBack} className="w-9 h-9 bg-gradient-to-br from-gray-900 to-gray-700 text-white rounded-xl flex items-center justify-center hover:from-black hover:to-gray-800 transition-all shadow-md" title="Back to Home">
                    <Home size={16} />
                 </button>
                 <span className="font-bold text-gray-800 tracking-tight px-1">OpenBento</span>
                 <div className="h-6 w-px bg-gray-200 mx-1"></div>
                 {/* Profile Dropdown */}
                 {activeBento && (
                   <ProfileDropdown
                     activeBentoId={activeBento.id}
                     activeBentoName={activeBento.name}
                     onBentoChange={handleBentoChange}
                   />
                 )}
                 <div className="h-6 w-px bg-gray-200 mx-1"></div>
                 <div className="flex bg-gray-100/80 p-1 rounded-xl gap-0.5">
                     <button 
                        onClick={() => setViewMode('desktop')}
                        className={`p-2 rounded-lg transition-all ${viewMode === 'desktop' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                     >
                         <Monitor size={16}/>
                     </button>
                     <button 
                        onClick={() => setViewMode('mobile')}
                        className={`p-2 rounded-lg transition-all ${viewMode === 'mobile' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                     >
                         <Smartphone size={16}/>
                     </button>
                 </div>
              </div>

              {/* Actions Pill */}
              <div className="flex gap-2 pointer-events-auto">
                 <button 
                   onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                   className="bg-white/90 backdrop-blur-xl px-5 py-2.5 rounded-xl shadow-lg shadow-black/5 border border-white/50 text-sm font-semibold text-gray-700 hover:bg-white transition-all flex items-center gap-2"
                 >
                    {isSidebarOpen ? <Eye size={18}/> : <Layout size={18}/>}
                    <span className="hidden sm:inline">{isSidebarOpen ? 'Preview' : 'Edit'}</span>
                 </button>
                 
                 <button 
                   onClick={handleExport}
                   className="bg-gradient-to-r from-gray-900 to-gray-800 text-white px-6 py-2.5 rounded-xl shadow-lg shadow-black/20 hover:from-black hover:to-gray-900 hover:shadow-xl transition-all text-sm font-semibold flex items-center gap-2"
                 >
                    <Download size={18} /> 
                    <span className="hidden sm:inline">Deploy</span>
                 </button>
              </div>
           </div>
        </nav>

        {/* LEFT: Profile Header (Fixed on Desktop) */}
        {viewMode === 'desktop' && (
          <div className="hidden lg:flex fixed left-0 top-0 w-[420px] h-screen flex-col justify-center items-start px-12 z-10">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-start text-left"
            >
              <motion.div 
                whileHover={{ scale: 1.02, rotate: 2 }}
                whileTap={{ scale: 0.98 }}
                className="relative group cursor-pointer mb-8" 
                onClick={() => { setEditingBlockId(null); setIsSidebarOpen(true); }}
              >
                <div className="w-40 h-40 rounded-3xl overflow-hidden ring-4 ring-white shadow-2xl relative z-10 bg-gradient-to-br from-gray-100 to-gray-200">
                  {profile.avatarUrl ? (
                    <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl font-bold">{profile.name.charAt(0)}</div>
                  )}
                </div>
                <div className="absolute -bottom-2 -right-2 bg-white rounded-xl px-3 py-1.5 shadow-lg border border-gray-100 opacity-0 group-hover:opacity-100 transition-all z-20 flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-xs font-semibold text-gray-700">Click to edit</span>
                </div>
              </motion.div>

              <div className="space-y-3">
                <div 
                  className="group cursor-pointer"
                  onClick={() => { setEditingBlockId(null); setIsSidebarOpen(true); }}
                >
                  <h1 className="text-4xl font-bold tracking-tight text-gray-900 group-hover:text-violet-600 transition-colors leading-[1.1]">
                    {profile.name}
                  </h1>
                </div>
                <p 
                  className="text-base text-gray-500 font-medium leading-relaxed whitespace-pre-wrap cursor-pointer hover:text-gray-700 transition-colors max-w-xs"
                  onClick={() => { setEditingBlockId(null); setIsSidebarOpen(true); }}
                >
                  {profile.bio}
                </p>
              </div>
            </motion.div>
          </div>
        )}

        {/* Content Area */}
        <div className="w-full min-h-screen">
            
            <div className={`max-w-[1600px] mx-auto`}>

                {/* RIGHT: Grid (Scrollable or Mobile Frame) */}
                <div className={`p-4 lg:p-12 pt-24 lg:pt-24 transition-all duration-300 ${viewMode === 'desktop' ? 'lg:ml-[420px]' : ''} ${viewMode === 'mobile' ? 'flex justify-center items-start min-h-screen bg-gray-100/50' : ''}`}>
                    
                    {viewMode === 'mobile' ? (
                        /* MOBILE FRAME */
                        <div className="mockup-phone border-gray-800 border-[14px] rounded-[3rem] h-[800px] w-[375px] shadow-2xl bg-white overflow-hidden relative">
                             <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-800 rounded-b-xl z-20"></div>
                             <div className="h-full w-full overflow-y-auto no-scrollbar pb-20 bg-[#F7F7F7]">
                                <div className="p-6 flex flex-col items-center text-center mt-8">
                                    <img src={profile.avatarUrl} alt="Avatar" className="w-24 h-24 rounded-full mb-4 object-cover ring-2 ring-white shadow-lg"/>
                                    <h1 className="text-2xl font-bold text-gray-900 leading-tight">{profile.name}</h1>
                                    <p className="text-sm text-gray-500 mt-2">{profile.bio}</p>
                                </div>
                                <div className="p-4 grid grid-cols-1 gap-4">
                                    {blocks.map(block => (
                                        <div className="pointer-events-none transform scale-100 origin-top" key={block.id}>
                                            <Block 
                                                block={{...block, colSpan: 1, rowSpan: 1}} 
                                                isSelected={false}
                                                onEdit={() => {}}
                                                onDelete={() => {}}
                                                onDragStart={() => {}}
                                                onDragEnter={() => {}}
                                                onDragEnd={() => {}}
                                                onDrop={() => {}}
                                            />
                                        </div>
                                    ))}
                                </div>
                             </div>
                        </div>
                    ) : (
                        /* DESKTOP GRID - Fixed grid with explicit positioning */
                        <>
                            {(() => {
                                const GRID_COLS = 3;
                                
                                // Auto-assign positions to blocks without explicit positions
                                const occupiedCells = new Set<string>();
                                const blocksWithPositions = blocks.map((block) => {
                                    if (block.gridColumn !== undefined && block.gridRow !== undefined) {
                                        // Mark cells as occupied
                                        for (let c = block.gridColumn; c < block.gridColumn + Math.min(block.colSpan, GRID_COLS - block.gridColumn + 1); c++) {
                                            for (let r = block.gridRow; r < block.gridRow + block.rowSpan; r++) {
                                                occupiedCells.add(`${c}-${r}`);
                                            }
                                        }
                                        return block;
                                    }
                                    return block;
                                });

                                // For blocks without positions, find next available spot
                                let autoRow = 1;
                                let autoCol = 1;
                                const finalBlocks = blocksWithPositions.map((block) => {
                                    if (block.gridColumn === undefined || block.gridRow === undefined) {
                                        // Find next available position
                                        while (true) {
                                            let canPlace = true;
                                            const neededCols = Math.min(block.colSpan, GRID_COLS);
                                            
                                            // Check if block fits at current position
                                            for (let c = autoCol; c < autoCol + neededCols && canPlace; c++) {
                                                for (let r = autoRow; r < autoRow + block.rowSpan && canPlace; r++) {
                                                    if (c > GRID_COLS || occupiedCells.has(`${c}-${r}`)) {
                                                        canPlace = false;
                                                    }
                                                }
                                            }

                                            if (canPlace) {
                                                // Place block here
                                                for (let c = autoCol; c < autoCol + neededCols; c++) {
                                                    for (let r = autoRow; r < autoRow + block.rowSpan; r++) {
                                                        occupiedCells.add(`${c}-${r}`);
                                                    }
                                                }
                                                const placedBlock = { ...block, gridColumn: autoCol, gridRow: autoRow };
                                                
                                                // Move to next column
                                                autoCol += neededCols;
                                                if (autoCol > GRID_COLS) {
                                                    autoCol = 1;
                                                    autoRow++;
                                                }
                                                return placedBlock;
                                            } else {
                                                // Try next position
                                                autoCol++;
                                                if (autoCol > GRID_COLS) {
                                                    autoCol = 1;
                                                    autoRow++;
                                                }
                                            }
                                        }
                                    }
                                    return block;
                                });

                                // Calculate grid rows needed
                                let maxRow = 1;
                                finalBlocks.forEach(b => {
                                    if (b.gridRow !== undefined) {
                                        maxRow = Math.max(maxRow, b.gridRow + b.rowSpan - 1);
                                    }
                                });
                                const GRID_ROWS = maxRow + 2; // Add 2 extra rows for new blocks

                                // Generate empty cell placeholders
                                const emptyCells: Array<{col: number, row: number}> = [];
                                for (let row = 1; row <= GRID_ROWS; row++) {
                                    for (let col = 1; col <= GRID_COLS; col++) {
                                        if (!occupiedCells.has(`${col}-${row}`)) {
                                            emptyCells.push({ col, row });
                                        }
                                    }
                                }

                                const handleDropOnCell = (col: number, row: number) => {
                                    if (!draggedBlockId) return;
                                    const blockIndex = blocks.findIndex(b => b.id === draggedBlockId);
                                    if (blockIndex === -1) return;
                                    
                                    const sourceBlock = blocks[blockIndex];
                                    
                                    // Helper to check if two blocks overlap
                                    const blocksOverlap = (a: { gridColumn?: number, gridRow?: number, colSpan: number, rowSpan: number }, 
                                                          b: { gridColumn?: number, gridRow?: number, colSpan: number, rowSpan: number }) => {
                                      if (a.gridColumn === undefined || a.gridRow === undefined || 
                                          b.gridColumn === undefined || b.gridRow === undefined) return false;
                                      
                                      const aRight = a.gridColumn + Math.min(a.colSpan, GRID_COLS);
                                      const aBottom = a.gridRow + a.rowSpan;
                                      const bRight = b.gridColumn + Math.min(b.colSpan, GRID_COLS);
                                      const bBottom = b.gridRow + b.rowSpan;
                                      
                                      return !(aRight <= b.gridColumn || a.gridColumn >= bRight || 
                                               aBottom <= b.gridRow || a.gridRow >= bBottom);
                                    };
                                    
                                    // Helper to find next available position
                                    const findNextPosition = (block: BlockData, occupied: Set<string>): { col: number, row: number } => {
                                      const neededCols = Math.min(block.colSpan, GRID_COLS);
                                      for (let r = 1; r <= 20; r++) {
                                        for (let c = 1; c <= GRID_COLS - neededCols + 1; c++) {
                                          let canPlace = true;
                                          for (let cc = c; cc < c + neededCols && canPlace; cc++) {
                                            for (let rr = r; rr < r + block.rowSpan && canPlace; rr++) {
                                              if (occupied.has(`${cc}-${rr}`)) canPlace = false;
                                            }
                                          }
                                          if (canPlace) return { col: c, row: r };
                                        }
                                      }
                                      return { col: 1, row: 1 };
                                    };
                                    
                                    // Move source block to new position
                                    const movedBlock = { ...sourceBlock, gridColumn: col, gridRow: row };
                                    let newBlocks = blocks.map(b => b.id === sourceBlock.id ? movedBlock : b);
                                    
                                    // Find and relocate conflicting blocks
                                    const conflicting = newBlocks.filter(b => b.id !== movedBlock.id && blocksOverlap(movedBlock, b));
                                    
                                    conflicting.forEach(conflict => {
                                      const occupied = new Set<string>();
                                      newBlocks.forEach(b => {
                                        if (b.id === conflict.id || b.gridColumn === undefined || b.gridRow === undefined) return;
                                        const cols = Math.min(b.colSpan, GRID_COLS);
                                        for (let c = b.gridColumn; c < b.gridColumn + cols; c++) {
                                          for (let r = b.gridRow; r < b.gridRow + b.rowSpan; r++) {
                                            occupied.add(`${c}-${r}`);
                                          }
                                        }
                                      });
                                      
                                      const newPos = findNextPosition(conflict, occupied);
                                      newBlocks = newBlocks.map(b => b.id === conflict.id ? { ...b, gridColumn: newPos.col, gridRow: newPos.row } : b);
                                    });
                                    
                                    handleSetBlocks(newBlocks);
                                    handleDragEnd();
                                };

                                const handleClickEmptyCell = (col: number, row: number) => {
                                    if (draggedBlockId) return;
                                    setEditingBlockId(null);
                                    setIsSidebarOpen(true);
                                    sessionStorage.setItem('pendingBlockPosition', JSON.stringify({ col, row }));
                                };

                                return (
                                    <motion.main 
                                        layout
                                        className="grid gap-5"
                                        style={{ 
                                            gridTemplateColumns: 'repeat(3, 1fr)',
                                            gridAutoRows: '200px',
                                        }}
                                    >
                                        {/* Render blocks with positions */}
                                        <AnimatePresence>
                                        {finalBlocks.map((block) => (
                                            <Block 
                                                key={block.id}
                                                block={block} 
                                                isSelected={editingBlockId === block.id}
                                                isDragTarget={dragOverBlockId === block.id}
                                                isDragging={draggedBlockId === block.id}
                                                onEdit={(b) => { setEditingBlockId(b.id); setIsSidebarOpen(true); }}
                                                onDelete={deleteBlock}
                                                onDragStart={handleDragStart}
                                                onDragEnter={handleDragEnter}
                                                onDragEnd={handleDragEnd}
                                                onDrop={handleDrop}
                                            />
                                        ))}
                                        </AnimatePresence>

                                        {/* Empty cell drop zones */}
                                        {emptyCells.map(({ col, row }) => (
                                            <motion.div
                                                key={`empty-${col}-${row}`}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: draggedBlockId ? 1 : 0.6 }}
                                                style={{
                                                    gridColumnStart: col,
                                                    gridRowStart: row,
                                                }}
                                                onDragEnter={() => setDragOverSlotIndex(col * 100 + row)}
                                                onDragOver={(e) => e.preventDefault()}
                                                onDrop={(e) => { e.preventDefault(); handleDropOnCell(col, row); }}
                                                onClick={() => handleClickEmptyCell(col, row)}
                                                className={`border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center transition-all duration-300 group cursor-pointer min-h-[180px] ${
                                                    draggedBlockId 
                                                        ? dragOverSlotIndex === col * 100 + row
                                                            ? 'border-violet-500 bg-violet-100/80 scale-[1.02] shadow-lg shadow-violet-200/50'
                                                            : 'border-gray-300/50 bg-white/30 hover:border-violet-300 hover:bg-violet-50/50'
                                                        : 'border-gray-200/40 bg-white/20 hover:border-gray-300/60 hover:bg-white/40'
                                                }`}
                                            >
                                                {draggedBlockId ? (
                                                    <div className="flex flex-col items-center gap-2">
                                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${dragOverSlotIndex === col * 100 + row ? 'bg-violet-200 scale-110' : 'bg-gray-100/60'}`}>
                                                            <Plus size={22} className={dragOverSlotIndex === col * 100 + row ? 'text-violet-600' : 'text-gray-300'}/>
                                                        </div>
                                                        <span className={`text-xs font-medium ${dragOverSlotIndex === col * 100 + row ? 'text-violet-600' : 'text-gray-300'}`}>
                                                            Drop here
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <div className="opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center gap-2">
                                                        <div className="w-12 h-12 rounded-xl bg-gray-100/80 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                            <Plus size={20} className="text-gray-400"/>
                                                        </div>
                                                        <span className="text-xs font-medium text-gray-400">Add block</span>
                                                    </div>
                                                )}
                                            </motion.div>
                                        ))}
                                    </motion.main>
                                );
                            })()}
                        </>
                    )}
                </div>

            </div>
        </div>
        
        {/* Footer - Centered on full width */}
        {viewMode === 'desktop' && (
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

      {/* 2. SIDEBAR EDITOR */}
      <EditorSidebar 
         isOpen={isSidebarOpen}
         profile={profile}
         setProfile={handleSetProfile}
         addBlock={addBlock}
         editingBlock={editingBlock}
         updateBlock={updateBlock}
         onDelete={deleteBlock}
         closeEdit={closeSidebar}
      />

      {/* 3. DEPLOY MODAL */}
      <AnimatePresence>
      {showDeployModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
             <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden ring-1 ring-gray-900/5"
             >
                <div className="p-8 pb-6 flex justify-between items-start">
                   <div>
                       <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-4">
                           <Share2 size={24}/>
                       </div>
                       <h2 className="text-2xl font-bold text-gray-900">Ready to Deploy</h2>
                       <p className="text-gray-500 mt-1">Your bento page has been packaged.</p>
                   </div>
                   <button onClick={() => setShowDeployModal(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"><X size={24}/></button>
                </div>

                <div className="px-8 space-y-6">
                   <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex gap-4 items-center">
                      <div className="bg-white p-2 rounded-full shadow-sm text-green-600 border border-gray-100"><Check size={20}/></div>
                      <div>
                          <p className="font-semibold text-gray-900 text-sm">Download Started</p>
                          <p className="text-gray-500 text-xs">Check your downloads folder for <code>bento.zip</code></p>
                      </div>
                   </div>

                   <div className="space-y-3">
                      <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wider">Next Steps</h3>
                      <div className="space-y-3">
                        {[
                            "Unzip the downloaded file",
                            "Create a new public GitHub Repository",
                            "Push the files to the 'main' branch",
                            "Go to Repo Settings > Pages > Source: GitHub Actions"
                        ].map((step, i) => (
                            <div key={i} className="flex items-center gap-3 text-sm text-gray-600">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center font-bold text-xs">{i + 1}</span>
                                {step}
                            </div>
                        ))}
                      </div>
                   </div>
                </div>
                
                <div className="p-8 pt-6">
                    <button onClick={() => setShowDeployModal(false)} className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                        Close
                    </button>
                </div>
             </motion.div>
          </motion.div>
      )}
      </AnimatePresence>

    </div>
  );
};

export default Builder;