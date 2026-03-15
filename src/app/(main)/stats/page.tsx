"use client";
import { useLanguage } from '@/contexts/LanguageContext';

export default function StatsPage() {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--color-app-bg)] p-6 text-center">
      <div className="w-full max-w-md p-10 bg-[var(--color-app-surface)] border border-[var(--color-app-border)] rounded-3xl shadow-2xl backdrop-blur-md">
        <h2 className="text-3xl font-black text-[var(--color-app-text)] mb-6 tracking-tight">{t('stats.title')}</h2>
        <p className="text-[var(--color-app-text-muted)] text-lg mb-10 leading-relaxed font-medium">{t('stats.description')}</p>
        <div className="inline-flex items-center justify-center px-10 py-5 bg-primary/10 text-primary text-xl font-black rounded-2xl border-2 border-primary/30 uppercase tracking-widest shadow-lg shadow-primary/10">
          {t('stats.coming_soon')}
        </div>
      </div>
    </div>
  );
}
