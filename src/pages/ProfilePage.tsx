import { useLanguage } from '../contexts/LanguageContext';
import { Link } from 'react-router-dom';

export default function ProfilePage() {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background-dark p-4 text-center">
      <div className="w-full max-w-md p-8 bg-primary/5 border border-primary/10 rounded-2xl shadow-xl backdrop-blur-sm">
        <h2 className="text-2xl font-bold text-slate-100 mb-4">{t('profile.title')}</h2>
        <p className="text-slate-400 mb-8">{t('profile.description')}</p>
        <Link to="/auth" className="inline-flex items-center justify-center px-6 py-3 bg-primary text-background-dark font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
          {t('profile.go_to_login')}
        </Link>
      </div>
    </div>
  );
}
