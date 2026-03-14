import { useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, Radar, MapPin, CheckCircle, XCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export default function AlertPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center bg-background-dark overflow-hidden">
      <div className="flex flex-col w-full max-w-2xl h-full md:h-auto md:min-h-screen md:border-x border-primary/10 bg-background-dark shadow-2xl relative">
        {/* Header / Navigation */}
        <header className="flex items-center justify-between p-4 border-b border-primary/10 sticky top-0 bg-background-dark/90 backdrop-blur-md z-50">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center justify-center size-10 rounded-full hover:bg-primary/10 transition-colors"
          >
            <ArrowLeft size={24} className="text-slate-100" />
          </button>
          <h2 className="text-lg font-bold tracking-tight">{t('alerts.radar_alert')}</h2>
          <div className="flex items-center justify-center size-10">
            <AlertTriangle size={24} className="text-primary" />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 space-y-6 pb-32 flex flex-col items-center w-full">
          {/* Urgency Indicator / Icon */}
          <div className="relative mb-6 mt-4">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse"></div>
            <div className="relative bg-primary/10 border-4 border-primary rounded-full p-8">
              <Radar size={64} className="text-primary" />
            </div>
          </div>

          {/* Radar Type & Status */}
          <div className="text-center mb-8">
            <span className="inline-block px-3 py-1 rounded-full bg-primary text-background-dark text-xs font-bold uppercase tracking-widest mb-2">{t('alerts.high_urgency')}</span>
            <h1 className="text-4xl font-bold tracking-tight mb-1">{t('alerts.mobile_radar')}</h1>
            <p className="text-primary font-medium text-lg">{t('alerts.detected_by')}</p>
          </div>

          {/* Distance & Limit Cards */}
          <div className="grid grid-cols-2 gap-4 w-full mb-10 max-w-sm mx-auto">
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 flex flex-col items-center justify-center text-center">
              <span className="text-slate-400 text-sm font-medium mb-1">{t('alerts.distance')}</span>
              <span className="text-3xl font-bold text-slate-100">500<span className="text-lg ml-1">m</span></span>
            </div>
            <div className="bg-primary border-4 border-slate-100 rounded-full w-24 h-24 mx-auto flex flex-col items-center justify-center shadow-xl">
              <span className="text-background-dark text-[10px] font-bold uppercase">{t('alerts.limit')}</span>
              <span className="text-background-dark text-3xl font-black leading-none">80</span>
              <span className="text-background-dark text-[10px] font-bold">km/h</span>
            </div>
          </div>

          {/* Map Visualization Placeholder */}
          <div className="w-full h-40 rounded-xl overflow-hidden mb-10 border border-primary/10 relative max-w-md mx-auto">
            <div className="absolute inset-0 bg-slate-800 flex items-center justify-center">
              <img 
                className="w-full h-full object-cover opacity-60 grayscale hover:grayscale-0 transition-all" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAqxLeGwTHWffK0Se_TgPMWwxY-Z0iC0Pzw6z9_uVM4QkRLqD23TTHfE9Wx3hOk-2mQ-a9QFiOEAKDWCqgVhWzZarrcLG7Ab5YNYTRFuiFzKHfBM3SPiyw9CdZeoo0VM7uot-3WudwNdRr9-iQR_D-3QgMzebrpISQOcEZoNPyAtPKSTjj3YD9KjUyC-6v_7v8Hx96hqvErSpCnWJFl49so1hpM_gSGQ4VHi_z_yotNct8N38VoMQy4FcAXKXoL_4m78kQ6BVbbXfo" 
                alt="Map view"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  <MapPin size={40} className="text-primary" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-12 border-2 border-primary rounded-full animate-ping"></div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Confirmation Actions */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-background-dark border-t border-primary/10 z-50">
          <p className="text-center text-sm font-medium text-slate-400 mb-2 uppercase tracking-widest">{t('alerts.still_there')}</p>
          <div className="flex gap-4 max-w-md mx-auto">
            <button 
              onClick={() => navigate('/')}
              className="flex-1 bg-primary text-background-dark font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all"
            >
              <CheckCircle size={24} />
              {t('alerts.yes_still_there')}
            </button>
            <button 
              onClick={() => navigate('/')}
              className="flex-1 bg-slate-800 text-slate-100 font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-700 active:scale-[0.98] transition-all"
            >
              <XCircle size={24} />
              {t('alerts.gone')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
