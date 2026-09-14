import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Option {
  id: string;
  label: string;
  subLabel?: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
}

export default function SearchableSelect({ 
  options, 
  value, 
  onChange, 
  placeholder = "Search...",
  label = "Select Option"
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.id === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => {
    const sLabel = String(opt.label || '').toLowerCase();
    const sSub = String(opt.subLabel || '').toLowerCase();
    const search = searchTerm.toLowerCase();
    return sLabel.includes(search) || sSub.includes(search);
  });

  return (
    <div className="relative space-y-3" ref={containerRef}>
      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">{label}</label>
      
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`input-glass w-full py-4 px-6 rounded-2xl flex items-center justify-between cursor-pointer transition-all ${isOpen ? 'ring-2 ring-indigo-500 border-transparent' : 'border-white/5'}`}
      >
        <span className={selectedOption ? "text-white font-bold" : "text-slate-500"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div className="flex items-center gap-2">
          {value && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
              className="p-1 hover:bg-white/10 rounded-lg text-slate-500"
            >
              <X size={14} />
            </button>
          )}
          <ChevronDown size={16} className={`text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute left-0 right-0 top-full mt-2 bg-[#0c162d] border border-indigo-500/30 rounded-3xl shadow-2xl z-50 overflow-hidden"
          >
            <div className="p-4 border-b border-white/10 bg-[#0a1226]">
              <div className="relative">
                <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  autoFocus
                  type="text"
                  placeholder="Type to filter..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#111c38] border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
            
            <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-2 bg-[#0c162d]">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      onChange(opt.id);
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                    className={`w-full text-left p-3 rounded-xl transition-all flex flex-col hover:bg-indigo-600 group ${value === opt.id ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/30' : 'text-slate-200'}`}
                  >
                    <span className={`font-bold transition-colors ${value === opt.id ? 'text-indigo-300' : 'group-hover:text-white'}`}>
                      {opt.label}
                    </span>
                    {opt.subLabel && (
                      <span className={`text-[10px] uppercase tracking-widest font-black transition-colors ${value === opt.id ? 'text-indigo-300/70' : 'text-slate-400 group-hover:text-white/80'}`}>
                        {opt.subLabel}
                      </span>
                    )}
                  </button>
                ))
              ) : (
                <div className="py-8 text-center text-slate-500 text-[10px] font-black uppercase tracking-widest">
                  No matches found
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
