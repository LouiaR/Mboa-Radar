import { useLanguage } from '../contexts/LanguageContext';

export default function StatsPage() {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background-dark p-4 text-center">
      <div className="w-full max-w-md p-8 bg-primary/5 border border-primary/10 rounded-2xl shadow-xl backdrop-blur-sm">
        <h2 className="text-2xl font-bold text-slate-100 mb-4">{t('stats.title')}</h2>
        <p className="text-slate-400 mb-8">{t('stats.description')}</p>
        <div className="inline-flex items-center justify-center px-6 py-3 bg-primary/10 text-primary font-bold rounded-xl border border-primary/20">
          {t('stats.coming_soon')}
        </div>
      </div>
    </div>
  );
}
