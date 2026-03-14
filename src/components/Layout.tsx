import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Map, Bell, BarChart2, User, Plus } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { t } = useLanguage();

  return (
    <div className="flex flex-col md:flex-row h-screen w-full overflow-hidden bg-background-dark">
      {/* Desktop Sidebar */}
      <nav className="hidden md:flex flex-col w-64 border-r border-primary/10 bg-background-dark/90 p-6 z-50">
        <div className="text-primary font-black text-2xl mb-10 tracking-tight">CamRoute</div>
        
        <div className="flex flex-col gap-4 flex-1">
          <Link to="/" className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-colors ${location.pathname === '/' ? 'bg-primary/10 text-primary' : 'text-slate-400 hover:bg-primary/5 hover:text-primary'}`}>
            <Map size={24} />
            <span className="font-bold uppercase tracking-wider text-sm">{t('nav.home')}</span>
          </Link>
          
          <Link to="/alerts" className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-colors ${location.pathname === '/alerts' ? 'bg-primary/10 text-primary' : 'text-slate-400 hover:bg-primary/5 hover:text-primary'}`}>
            <Bell size={24} />
            <span className="font-bold uppercase tracking-wider text-sm">{t('nav.alerts')}</span>
          </Link>
          
          <Link to="/stats" className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-colors ${location.pathname === '/stats' ? 'bg-primary/10 text-primary' : 'text-slate-400 hover:bg-primary/5 hover:text-primary'}`}>
            <BarChart2 size={24} />
            <span className="font-bold uppercase tracking-wider text-sm">{t('nav.stats')}</span>
          </Link>
          
          <Link to="/profile" className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-colors ${location.pathname === '/profile' ? 'bg-primary/10 text-primary' : 'text-slate-400 hover:bg-primary/5 hover:text-primary'}`}>
            <User size={24} />
            <span className="font-bold uppercase tracking-wider text-sm">{t('nav.profile')}</span>
          </Link>
        </div>

        <div className="mt-auto pt-6 border-t border-primary/10">
          <Link to="/report" className="flex items-center justify-center gap-3 w-full bg-primary text-background-dark py-4 rounded-xl font-bold uppercase tracking-wider hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
            <Plus size={24} strokeWidth={3} />
            {t('map.report_btn')}
          </Link>
        </div>
      </nav>

      <main className="flex-1 overflow-y-auto relative flex flex-col w-full">
        {children}
      </main>
      
      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden sticky bottom-0 border-t border-primary/10 bg-background-dark/90 backdrop-blur-md px-4 pb-6 pt-2 z-50">
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
