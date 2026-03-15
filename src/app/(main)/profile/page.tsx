"use client";
import { useLanguage } from '@/contexts/LanguageContext';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User, LogOut, Mail, Award, CheckCircle2, TrendingUp } from 'lucide-react';
import { getUserProfile } from '@/lib/db';

export default function ProfilePage() {
  const { t } = useLanguage();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSessionData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      
      const userProfile = await getUserProfile();
      setProfile(userProfile);
      
      setLoading(false);
    };
    getSessionData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        const userProfile = await getUserProfile();
        setProfile(userProfile);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--color-app-bg)] p-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--color-app-bg)] p-6 text-center">
      <div className="w-full max-w-md p-10 bg-[var(--color-app-surface)] border border-[var(--color-app-border)] rounded-3xl shadow-2xl backdrop-blur-md relative overflow-hidden">
        
        {user ? (
          <div className="flex flex-col items-center gap-4">
            <div className="absolute top-4 right-4 flex items-center gap-1 text-green-500 font-bold text-xs bg-green-500/10 px-2 py-1 rounded-full">
              <CheckCircle2 size={14} /> En ligne
            </div>
            
            <div className="w-28 h-28 bg-primary/20 rounded-full flex items-center justify-center text-primary mb-4 shadow-inner border-2 border-primary/30">
              <User size={56} />
            </div>
            <h2 className="text-3xl font-black text-[var(--color-app-text)]">{user.user_metadata?.full_name || user.user_metadata?.username || 'Conducteur'}</h2>
            
            {profile && (
              <div className="grid grid-cols-2 gap-4 w-full mb-6">
                <div className="bg-[var(--color-app-bg)]/50 border border-[var(--color-app-border)] p-4 rounded-2xl flex flex-col items-center">
                  <Award className="text-primary mb-1" size={20} />
                  <span className="text-2xl font-black text-[var(--color-app-text)]">{profile.score}</span>
                  <span className="text-[10px] font-bold uppercase text-[var(--color-app-text-muted)]">Points</span>
                </div>
                <div className="bg-[var(--color-app-bg)]/50 border border-[var(--color-app-border)] p-4 rounded-2xl flex flex-col items-center">
                  <TrendingUp className="text-primary mb-1" size={20} />
                  <span className="text-lg font-black text-[var(--color-app-text)] truncate w-full text-center">{profile.level}</span>
                  <span className="text-[10px] font-bold uppercase text-[var(--color-app-text-muted)]">Niveau</span>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 text-[var(--color-app-text-muted)] bg-[var(--color-app-bg)]/50 px-5 py-3 rounded-xl w-full mb-4 border border-[var(--color-app-border)]">
              <Mail size={22} className="text-primary/70" />
              <span className="text-base truncate font-medium">{user.email}</span>
            </div>

            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-red-500/10 text-red-500 font-black rounded-2xl hover:bg-red-500/20 transition-all border-2 border-red-500/20 mt-6 active:scale-95 shadow-lg"
            >
              <LogOut size={24} />
              Déconnexion
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 bg-[var(--color-app-bg)] rounded-full flex items-center justify-center text-[var(--color-app-text-muted)] mb-8 border border-[var(--color-app-border)]">
              <User size={48} />
            </div>
            <h2 className="text-3xl font-black text-[var(--color-app-text)] mb-6 tracking-tight">{t('profile.title')}</h2>
            <p className="text-[var(--color-app-text-muted)] text-lg mb-10 leading-relaxed font-medium">{t('profile.description')}</p>
            <Link href="/auth" className="inline-flex items-center justify-center px-10 py-5 bg-primary text-white text-xl font-black rounded-2xl hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 w-full active:scale-95">
              {t('profile.go_to_login')}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
