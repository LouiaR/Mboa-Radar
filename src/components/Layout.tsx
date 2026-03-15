"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Map, Bell, BarChart2, User, Plus, Sun, Moon, Monitor } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabase';
import { useState, useEffect } from 'react';

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t } = useLanguage();
  const { theme, setTheme, isDark } = useTheme();
  const [user, setUser] = useState<any>(null);

  const toggleTheme = () => {
    if (theme === 'system') setTheme('dark');
    else if (theme === 'dark') setTheme('light');
    else setTheme('system');
  };

  const getThemeIcon = () => {
    if (theme === 'system') return <Monitor size={24} />;
    if (theme === 'dark') return <Moon size={24} />;
    return <Sun size={24} />;
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="flex flex-col md:flex-row h-screen w-full overflow-hidden bg-[var(--color-app-bg)]">
      {/* Desktop Sidebar */}
      <nav className="hidden md:flex flex-col w-64 border-r border-primary/10 bg-[var(--color-app-surface)] p-6 z-50">
        <div className="text-primary font-black text-2xl mb-10 tracking-tight">CamRoute</div>
        
        <div className="flex flex-col gap-4 flex-1">
          <Link href="/" className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-colors ${pathname === '/' ? 'bg-primary/10 text-primary' : 'text-slate-400 hover:bg-primary/5 hover:text-primary'}`}>
            <Map size={24} />
            <span className="font-bold uppercase tracking-wider text-sm">{t('nav.home')}</span>
          </Link>
          
          <Link href="/alerts" className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-colors ${pathname === '/alerts' ? 'bg-primary/10 text-primary' : 'text-slate-400 hover:bg-primary/5 hover:text-primary'}`}>
            <Bell size={24} />
            <span className="font-bold uppercase tracking-wider text-sm">{t('nav.alerts')}</span>
          </Link>
          
          {user && (
            <Link href="/stats" className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-colors ${pathname === '/stats' ? 'bg-primary/10 text-primary' : 'text-slate-400 hover:bg-primary/5 hover:text-primary'}`}>
              <BarChart2 size={24} />
              <span className="font-bold uppercase tracking-wider text-sm">{t('nav.stats')}</span>
            </Link>
          )}
          
          {user && (
            <Link href="/profile" className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-colors ${pathname === '/profile' ? 'bg-primary/10 text-primary' : 'text-slate-400 hover:bg-primary/5 hover:text-primary'}`}>
              <User size={24} />
              <span className="font-bold uppercase tracking-wider text-sm">{t('nav.profile')}</span>
            </Link>
          )}

          <div className="flex-1" />

          {/* Theme Toggle Button Desktop */}
          <button 
            onClick={toggleTheme}
            className="flex items-center gap-4 px-4 py-3 rounded-xl transition-colors text-slate-400 hover:bg-primary/5 hover:text-primary w-full text-left"
          >
            {getThemeIcon()}
            <span className="font-bold uppercase tracking-wider text-sm flex-1">
              {theme === 'system' ? 'Auto' : theme === 'dark' ? 'Nuit' : 'Jour'}
            </span>
          </button>
        </div>
      </nav>

      <main className="flex-1 overflow-y-auto relative flex flex-col w-full">
        {children}
      </main>
      
          {/* Mobile Bottom Navigation */}
      <nav className="md:hidden sticky bottom-0 border-t border-primary/10 bg-[var(--color-app-surface)] backdrop-blur-md px-4 pb-6 pt-2 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
        <div className="flex gap-2 max-w-md mx-auto relative">
          <Link href="/" className={`flex flex-1 flex-col items-center justify-center gap-1 transition-colors ${pathname === '/' ? 'text-primary' : 'text-[var(--color-app-text-muted)] hover:text-primary'}`}>
            <Map size={24} />
            <p className="text-[10px] font-bold uppercase tracking-wider">{t('nav.home')}</p>
          </Link>
          
          <Link href="/alerts" className={`flex flex-1 flex-col items-center justify-center gap-1 transition-colors ${pathname === '/alerts' ? 'text-primary' : 'text-[var(--color-app-text-muted)] hover:text-primary'}`}>
            <Bell size={24} />
            <p className="text-[10px] font-bold uppercase tracking-wider">{t('nav.alerts')}</p>
          </Link>
          
          <div className="flex-1 flex justify-center -mt-6">
            <Link href={user ? "/report" : "/auth"} className="bg-primary text-[var(--color-app-bg)] size-14 rounded-full shadow-lg shadow-primary/30 flex items-center justify-center border-4 border-[var(--color-app-bg)] active:scale-95 transition-transform">
              <Plus size={32} strokeWidth={3} />
            </Link>
          </div>
          
          {user && (
            <Link href="/stats" className={`flex flex-1 flex-col items-center justify-center gap-1 transition-colors ${pathname === '/stats' ? 'text-primary' : 'text-[var(--color-app-text-muted)] hover:text-primary'}`}>
              <BarChart2 size={24} />
              <p className="text-[10px] font-bold uppercase tracking-wider">{t('nav.stats')}</p>
            </Link>
          )}
          
          {user && (
            <Link href="/profile" className={`flex flex-1 flex-col items-center justify-center gap-1 transition-colors ${pathname === '/profile' ? 'text-primary' : 'text-[var(--color-app-text-muted)] hover:text-primary'}`}>
              <User size={24} />
              <p className="text-[10px] font-bold uppercase tracking-wider">{t('nav.profile')}</p>
            </Link>
          )}

          <button 
            onClick={toggleTheme}
            className="flex flex-1 flex-col items-center justify-center gap-1 transition-colors text-[var(--color-app-text-muted)] hover:text-primary"
          >
            {getThemeIcon()}
          </button>
        </div>
      </nav>
    </div>
  );
}
