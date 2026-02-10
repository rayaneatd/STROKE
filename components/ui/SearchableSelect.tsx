
import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface SearchableSelectProps {
    options: string[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    icon?: React.ReactNode;
    isLight?: boolean; // Kept for backward compat, but preference given to hook
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({ 
    options, 
    value, 
    onChange, 
    placeholder = "Select option...", 
    className = "",
    icon,
    isLight: propIsLight
}) => {
    const { isLight: contextIsLight, accent } = useTheme();
    // Prefer context if available, fallback to prop if strictly necessary (though context is global)
    const isLight = contextIsLight ?? propIsLight;

    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Styles matching global inputs
    const bgClass = isLight ? 'bg-white border-slate-200' : 'bg-black/20 border-white/10';
    const textPrimary = isLight ? 'text-slate-800' : 'text-white';
    const textSecondary = isLight ? 'text-slate-500' : 'text-zinc-400';
    
    // Active/Focus states
    const focusClass = isOpen 
        ? (isLight ? `ring-2 ring-${accent}-500/10 border-${accent}-500` : `ring-2 ring-${accent}-500/20 border-${accent}-500`) 
        : (isLight ? 'hover:border-slate-300' : 'hover:border-white/20');

    const dropdownBg = isLight 
        ? 'bg-white border-slate-100 shadow-xl shadow-slate-200/50' 
        : 'bg-[#18181b] border-white/10 shadow-2xl shadow-black/50';

    const optionActive = isLight ? `bg-${accent}-50 text-${accent}-700` : `bg-${accent}-500/10 text-${accent}-400`;
    const optionHover = isLight ? 'hover:bg-slate-50' : 'hover:bg-white/5';

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
        if (!isOpen) {
            setSearchTerm('');
        }
    }, [isOpen]);

    const filteredOptions = options.filter(option => 
        option.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelect = (option: string) => {
        onChange(option);
        setIsOpen(false);
        setSearchTerm('');
    };

    return (
        <div className={`relative ${className}`} ref={wrapperRef}>
            <div 
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer shadow-sm ${bgClass} ${focusClass}`}
            >
                {/* Icon wrapper */}
                {icon && <div className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${textSecondary}`}>{icon}</div>}
                
                <span className={`truncate font-medium text-sm ${value ? textPrimary : textSecondary}`}>
                    {value || placeholder}
                </span>
                <ChevronDown size={16} className={`${textSecondary} transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {isOpen && (
                <div className={`absolute z-50 w-full mt-2 rounded-xl border overflow-hidden animate-fade-in-up ${dropdownBg}`}>
                    <div className={`p-2 border-b relative ${isLight ? 'border-slate-100' : 'border-white/5'}`}>
                        <Search size={14} className={`absolute left-4 top-1/2 -translate-y-1/2 ${textSecondary}`} />
                        <input
                            ref={inputRef}
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search..."
                            className={`w-full pl-9 pr-8 py-2 text-xs font-medium rounded-lg border-none outline-none transition-colors ${isLight ? 'bg-slate-50 text-slate-800 placeholder:text-slate-400 focus:bg-slate-100' : 'bg-white/5 text-zinc-200 placeholder:text-zinc-600 focus:bg-white/10'}`}
                            onClick={(e) => e.stopPropagation()}
                        />
                        {searchTerm && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); setSearchTerm(''); inputRef.current?.focus(); }}
                                className={`absolute right-3 top-1/2 -translate-y-1/2 ${isLight ? 'text-slate-400 hover:text-slate-600' : 'text-zinc-500 hover:text-zinc-300'}`}
                            >
                                <X size={12} />
                            </button>
                        )}
                    </div>
                    <div className="max-h-60 overflow-y-auto custom-scrollbar p-1.5 space-y-0.5">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((option) => (
                                <button
                                    key={option}
                                    onClick={(e) => { e.stopPropagation(); handleSelect(option); }}
                                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium flex items-center justify-between transition-colors ${
                                        value === option 
                                        ? optionActive
                                        : `${isLight ? 'text-slate-600' : 'text-zinc-400'} ${optionHover}`
                                    }`}
                                >
                                    {option}
                                    {value === option && <Check size={14} className={`shrink-0 ${isLight ? `text-${accent}-600` : `text-${accent}-400`}`} />}
                                </button>
                            ))
                        ) : (
                            <div className={`px-4 py-8 text-center text-xs ${textSecondary}`}>
                                No results found.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchableSelect;
