import React, { useState, useRef, useEffect } from 'react';
import { SavedBento } from '../types';
import { getAllBentos, createBento } from '../services/storageService';
import { ChevronDown, Plus, FolderOpen, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProfileDropdownProps {
  activeBentoId: string;
  activeBentoName: string;
  onBentoChange: (bento: SavedBento) => void;
}

const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ 
  activeBentoId, 
  activeBentoName,
  onBentoChange 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [bentos, setBentos] = useState<SavedBento[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load bentos when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setBentos(getAllBentos());
    }
  }, [isOpen]);

  // Focus input when creating
  useEffect(() => {
    if (isCreating && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isCreating]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsCreating(false);
        setNewName('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCreateBento = () => {
    if (newName.trim()) {
      const newBento = createBento(newName.trim());
      onBentoChange(newBento);
      setIsCreating(false);
      setNewName('');
      setIsOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateBento();
    } else if (e.key === 'Escape') {
      setIsCreating(false);
      setNewName('');
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'short'
    });
  };

  return (
    <div ref={dropdownRef} className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-sm font-medium text-gray-700"
      >
        <FolderOpen size={16} className="text-gray-500" />
        <span className="max-w-[120px] truncate">{activeBentoName}</span>
        <ChevronDown 
          size={16} 
          className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">My Bentos</h3>
            </div>

            {/* Bentos List */}
            <div className="max-h-[240px] overflow-y-auto">
              {bentos.length === 0 ? (
                <div className="px-4 py-6 text-center text-gray-400 text-sm">
                  No bentos yet
                </div>
              ) : (
                bentos.map((bento) => (
                  <button
                    key={bento.id}
                    onClick={() => {
                      onBentoChange(bento);
                      setIsOpen(false);
                    }}
                    className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left ${
                      bento.id === activeBentoId ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                      bento.id === activeBentoId 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {bento.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${
                        bento.id === activeBentoId ? 'text-blue-600' : 'text-gray-900'
                      }`}>
                        {bento.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        Updated {formatDate(bento.updatedAt)}
                      </p>
                    </div>
                    {bento.id === activeBentoId && (
                      <Check size={16} className="text-blue-500 shrink-0" />
                    )}
                  </button>
                ))
              )}
            </div>

            {/* Create New */}
            <div className="border-t border-gray-100">
              {isCreating ? (
                <div className="p-3">
                  <input
                    ref={inputRef}
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Bento name..."
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={handleCreateBento}
                      disabled={!newName.trim()}
                      className="flex-1 px-3 py-1.5 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Create
                    </button>
                    <button
                      onClick={() => {
                        setIsCreating(false);
                        setNewName('');
                      }}
                      className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setIsCreating(true)}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                    <Plus size={16} className="text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">New Bento</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfileDropdown;

