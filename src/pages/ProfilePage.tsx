import { useLanguage } from '../contexts/LanguageContext';
import { Link } from 'react-router-dom';

export default function ProfilePage() {
  const { t } = useLanguage();
  return (
    <div className="p-4 text-center mt-20">
      <Link to="/auth" className="text-primary underline">
        {t('profile.go_to_login')}
      </Link>
    </div>
  );
}
