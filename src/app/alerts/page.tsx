"use client";
import { useRouter } from 'next/navigation';
import { ArrowLeft, AlertTriangle, Radar, MapPin, CheckCircle, XCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function AlertPage() {
  const router = useRouter();
  const { t } = useLanguage();

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center bg-[var(--color-app-bg)] overflow-hidden">
      <div className="flex flex-col w-full max-w-2xl h-full md:h-auto md:min-h-screen md:border-x border-[var(--color-app-border)] bg-[var(--color-app-bg)] shadow-2xl relative">
        {/* Header / Navigation */}
        <header className="flex items-center justify-between p-4 border-b border-[var(--color-app-border)] sticky top-0 bg-[var(--color-app-surface)]/90 backdrop-blur-md z-50">
          <button 
            onClick={() => router.back()}
            className="flex items-center justify-center size-10 rounded-full hover:bg-primary/10 transition-colors"
          >
            <ArrowLeft size={28} className="text-[var(--color-app-text)]" />
          </button>
          <h2 className="text-xl font-black tracking-tight text-[var(--color-app-text)]">{t('alerts.radar_alert')}</h2>
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
          <div className="text-center mb-10">
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary text-white text-sm font-black uppercase tracking-widest mb-4">{t('alerts.high_urgency')}</span>
            <h1 className="text-5xl font-black tracking-tight mb-2 text-[var(--color-app-text)]">{t('alerts.mobile_radar')}</h1>
            <p className="text-primary font-bold text-xl">{t('alerts.detected_by')}</p>
          </div>

          {/* Distance & Limit Cards */}
          <div className="grid grid-cols-2 gap-6 w-full mb-12 max-w-sm mx-auto">
            <div className="bg-[var(--color-app-surface)] border border-[var(--color-app-border)] rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-lg">
              <span className="text-[var(--color-app-text-muted)] text-sm font-bold uppercase mb-2">{t('alerts.distance')}</span>
              <span className="text-4xl font-black text-[var(--color-app-text)]">500<span className="text-xl ml-1">m</span></span>
            </div>
            <div className="bg-primary border-8 border-[var(--color-app-bg)] rounded-full w-28 h-28 mx-auto flex flex-col items-center justify-center shadow-2xl outline outline-4 outline-primary">
              <span className="text-white text-[10px] font-black uppercase">{t('alerts.limit')}</span>
              <span className="text-white text-4xl font-black leading-none">80</span>
              <span className="text-white text-[10px] font-black">km/h</span>
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
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-[var(--color-app-bg)] border-t border-[var(--color-app-border)] z-50">
          <p className="text-center text-sm font-black text-[var(--color-app-text-muted)] mb-4 uppercase tracking-widest">{t('alerts.still_there')}</p>
          <div className="flex gap-4 max-w-md mx-auto">
            <button 
              onClick={() => router.push('/')}
              className="flex-1 bg-primary text-white font-black py-5 rounded-2xl flex items-center justify-center gap-2 hover:bg-primary/90 active:scale-[0.98] transition-all shadow-xl shadow-primary/20"
            >
              <CheckCircle size={28} />
              {t('alerts.yes_still_there')}
            </button>
            <button 
              onClick={() => router.push('/')}
              className="flex-1 bg-[var(--color-app-surface)] text-[var(--color-app-text)] font-black py-5 rounded-2xl flex items-center justify-center gap-2 hover:bg-[var(--color-app-surface)]/80 active:scale-[0.98] transition-all border border-[var(--color-app-border)] shadow-lg"
            >
              <XCircle size={28} />
              {t('alerts.gone')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
