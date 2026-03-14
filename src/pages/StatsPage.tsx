import { useLanguage } from '../contexts/LanguageContext';

export default function StatsPage() {
  const { t } = useLanguage();
  return (
    <div className="p-4 text-center mt-20 text-slate-100">
      {t('stats.coming_soon')}
    </div>
  );
}
