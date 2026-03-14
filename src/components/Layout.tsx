import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Map, Bell, BarChart2, User, Plus } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { t } = useLanguage();

  return (
    <div className="flex flex-col h-screen w-full max-w-md mx-auto overflow-hidden bg-background-dark shadow-2xl border-x border-primary/10">
      <main className="flex-1 overflow-y-auto relative">
        {children}
      </main>
      
      {/* Bottom Navigation */}
      <nav className="sticky bottom-0 border-t border-primary/10 bg-background-dark/90 backdrop-blur-md px-4 pb-6 pt-2 z-50">
        <div className="flex gap-2 max-w-md mx-auto relative">
          <Link to="/" className={`flex flex-1 flex-col items-center justify-center gap-1 transition-colors ${location.pathname === '/' ? 'text-primary' : 'text-slate-500 hover:text-primary'}`}>
            <Map size={24} />
            <p className="text-[10px] font-bold uppercase tracking-wider">{t('nav.home')}</p>
          </Link>
          
          <Link to="/alerts" className={`flex flex-1 flex-col items-center justify-center gap-1 transition-colors ${location.pathname === '/alerts' ? 'text-primary' : 'text-slate-500 hover:text-primary'}`}>
            <Bell size={24} />
            <p className="text-[10px] font-bold uppercase tracking-wider">{t('nav.alerts')}</p>
          </Link>
          
          <div className="flex-1 flex justify-center -mt-6">
            <Link to="/report" className="bg-primary text-background-dark size-14 rounded-full shadow-lg shadow-primary/30 flex items-center justify-center border-4 border-background-dark active:scale-95 transition-transform">
              <Plus size={32} strokeWidth={3} />
            </Link>
          </div>
          
          <Link to="/stats" className={`flex flex-1 flex-col items-center justify-center gap-1 transition-colors ${location.pathname === '/stats' ? 'text-primary' : 'text-slate-500 hover:text-primary'}`}>
            <BarChart2 size={24} />
            <p className="text-[10px] font-bold uppercase tracking-wider">{t('nav.stats')}</p>
          </Link>
          
          <Link to="/profile" className={`flex flex-1 flex-col items-center justify-center gap-1 transition-colors ${location.pathname === '/profile' ? 'text-primary' : 'text-slate-500 hover:text-primary'}`}>
            <User size={24} />
            <p className="text-[10px] font-bold uppercase tracking-wider">{t('nav.profile')}</p>
          </Link>
        </div>
      </nav>
    </div>
  );
}
