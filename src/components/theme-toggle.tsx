'use client';

import { useTheme } from 'next-themes';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/50">
        <div className="h-7 w-7 rounded-md" />
        <div className="h-7 w-7 rounded-md" />
        <div className="h-7 w-7 rounded-md" />
      </div>
    );
  }

  const themes = [
    { value: 'light', icon: Sun, label: 'Clair' },
    { value: 'dark', icon: Moon, label: 'Sombre' },
    { value: 'system', icon: Monitor, label: 'Système' },
  ] as const;

  return (
    <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/50 border border-border/50">
      {themes.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          className={cn(
            'flex items-center justify-center h-7 w-7 rounded-md transition-all duration-200',
            theme === value
              ? 'bg-primary/15 text-primary shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
          )}
          title={label}
          aria-label={`Thème ${label}`}
        >
          <Icon className="h-3.5 w-3.5" />
        </button>
      ))}
    </div>
  );
}
