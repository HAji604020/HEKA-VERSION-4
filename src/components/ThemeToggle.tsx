import React from 'react';
import { Sun, Moon, Laptop } from 'lucide-react';
import { useTheme, ThemeMode } from '../context/ThemeContext';
import { Language } from '../types';
import { translations } from '../translations';

interface ThemeToggleProps {
  currentLang: Language;
  variant?: 'compact' | 'segmented' | 'icon-only';
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  currentLang,
  variant = 'compact',
  className = ''
}) => {
  const { theme, effectiveTheme, setTheme } = useTheme();
  const t = translations[currentLang] || translations.en;
  const isRtl = currentLang === 'fa' || currentLang === 'ps';

  const themeOptions: { id: ThemeMode; label: string; icon: typeof Sun }[] = [
    {
      id: 'light',
      label: t.themeLight || (isRtl ? 'روشن' : 'Light'),
      icon: Sun
    },
    {
      id: 'dark',
      label: t.themeDark || (isRtl ? 'تاریک' : 'Dark'),
      icon: Moon
    },
    {
      id: 'system',
      label: t.themeSystem || (isRtl ? 'سیستم' : 'System'),
      icon: Laptop
    }
  ];

  if (variant === 'icon-only') {
    return (
      <button
        type="button"
        onClick={() => setTheme(effectiveTheme === 'dark' ? 'light' : 'dark')}
        className={`p-2 rounded-xl text-[#687386] dark:text-slate-300 hover:text-[#101C35] dark:hover:text-[#C9A96E] hover:bg-white/60 dark:hover:bg-white/10 border border-slate-200/50 dark:border-white/10 backdrop-blur-md transition-all cursor-pointer shadow-2xs ${className}`}
        title={`${t.themeLabel || 'Theme'}: ${theme.toUpperCase()} (${effectiveTheme === 'dark' ? 'Dark Mode' : 'Light Mode'})`}
        aria-label={t.themeLabel || 'Toggle Theme'}
      >
        {effectiveTheme === 'dark' ? (
          <Sun className="w-4 h-4 text-[#C9A96E]" />
        ) : (
          <Moon className="w-4 h-4 text-[#101C35]" />
        )}
      </button>
    );
  }

  return (
    <div
      className={`inline-flex items-center p-0.5 rounded-xl bg-white/60 dark:bg-black/30 backdrop-blur-md border border-slate-200/60 dark:border-white/10 shadow-2xs transition-all ${className}`}
      role="radiogroup"
      aria-label={t.themeLabel || 'Theme Selection'}
    >
      {themeOptions.map((opt) => {
        const Icon = opt.icon;
        const isSelected = theme === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => setTheme(opt.id)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              isSelected
                ? 'bg-[#101C35] dark:bg-[#C9A96E] text-white dark:text-[#0B1220] shadow-xs'
                : 'text-[#687386] dark:text-slate-400 hover:text-[#101C35] dark:hover:text-slate-200 hover:bg-white/40 dark:hover:bg-white/5'
            }`}
            title={`${opt.label} (${opt.id})`}
          >
            <Icon className={`w-3.5 h-3.5 ${isSelected ? (effectiveTheme === 'dark' && theme !== 'system' ? 'text-[#0B1220]' : 'text-[#C9A96E] dark:text-[#0B1220]') : ''}`} />
            {variant === 'segmented' && <span>{opt.label}</span>}
          </button>
        );
      })}
    </div>
  );
};
