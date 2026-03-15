"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, HelpCircle, Camera, Gauge, TrafficCone, ShieldAlert, MapPin, ArrowLeft, Radio } from 'lucide-react';
import Link from 'next/link';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { addReport, getHazardTypes, HazardType } from '@/lib/db';
import { syncReportsToCloud } from '@/lib/syncService';
import { useLanguage } from '@/contexts/LanguageContext';

const targetIcon = L.divIcon({
  className: 'custom-leaflet-icon',
  html: `<div class="flex items-center justify-center w-8 h-8 rounded-full shadow-lg text-white bg-primary border-2 border-white"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

function LocationPicker({ position, setPosition }: { position: [number, number], setPosition: (pos: [number, number]) => void }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });
  return position ? <Marker position={position} icon={targetIcon} /> : null;
}

function MapController({ center }: { center: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, map.getZoom(), { animate: true });
    }
  }, [center, map]);
  return null;
}

export default function ReportPage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [hazardType, setHazardType] = useState<string>('fixed');
  const [hazardTypesList, setHazardTypesList] = useState<HazardType[]>([]);
  const [locationType, setLocationType] = useState<'current' | 'map'>('current');
  const [manualPos, setManualPos] = useState<[number, number]>([4.0511, 9.7679]); // Default Douala
  const [customLocation, setCustomLocation] = useState('');
  const [hasUserLocation, setHasUserLocation] = useState(false);

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setManualPos([pos.coords.latitude, pos.coords.longitude]);
        setHasUserLocation(true);
      }, () => {
        console.warn("Could not get initial location");
      }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
    }

    const loadTypes = async () => {
      const types = await getHazardTypes();
      setHazardTypesList(types);
      if (types.length > 0) {
        setHazardType(types[0].id);
      }
    };
    loadTypes();
  }, []);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'radio': return <Radio size={32} />;
      case 'traffic-cone': return <TrafficCone size={32} />;
      case 'shield-alert': return <ShieldAlert size={32} />;
      default: return <Camera size={32} />;
    }
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReport = async () => {
    setIsSubmitting(true);
    try {
      if (locationType === 'current' && 'geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(async (pos) => {
          console.log('[GPS] Current Position:', pos.coords);
          await addReport({
            type: hazardType as any,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            customLocation: customLocation.trim() || undefined
          });
          try {
            await syncReportsToCloud();
          } catch (syncErr) {
            console.error('Sync failed but report saved locally', syncErr);
          }
            if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
            setIsSubmitting(false);
            router.push('/');
        }, (err) => {
          console.error('Failed to get location', err);
          let errorMsg = t('plan.loc_error');
          if (err.code === 1) errorMsg = t('errors.location_denied');
          else if (err.code === 2) errorMsg = t('errors.location_unavailable');
          else if (err.code === 3) errorMsg = t('errors.location_timeout');
          
          alert(errorMsg);
          
          // Fallback to manualPos if location fails
          addReport({ 
            type: hazardType as any, 
            latitude: manualPos[0], 
            longitude: manualPos[1],
            customLocation: customLocation.trim() || undefined
          }).then(async () => {
            try {
              await syncReportsToCloud();
            } catch (syncErr) {
              console.error('Sync failed but report saved locally', syncErr);
            }
            if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
            setIsSubmitting(false);
            router.push('/');
          });
        }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
      } else {
        // Use manually selected map position
        await addReport({
          type: hazardType as any,
          latitude: manualPos[0],
          longitude: manualPos[1],
          customLocation: customLocation.trim() || undefined
        });
        try {
          await syncReportsToCloud();
        } catch (syncErr) {
          console.error('Sync failed but report saved locally', syncErr);
        }
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
        setIsSubmitting(false);
        router.push('/');
      }
    } catch (error) {
      console.error('Failed to save report', error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center bg-[var(--color-app-bg)] overflow-hidden">
      <div className="flex flex-col w-full max-w-2xl h-full md:h-auto md:min-h-screen md:border-x border-primary/10 bg-[var(--color-app-bg)] shadow-2xl relative">
        {/* Header Overlay */}
        <header className="relative z-10 flex items-center justify-between p-4 bg-[var(--color-app-surface)]/80 backdrop-blur-md border-b border-[var(--color-app-border)]">
          <Link href="/" className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
            <ArrowLeft size={28} />
          </Link>
          <span className="text-xl font-bold text-[var(--color-app-text)]">{t('report.title')}</span>
          <div className="w-14" /> {/* Spacer */}
        </header>

        <main className="flex-1 overflow-y-auto p-4 space-y-6 pb-36">
          {/* Hazard Selection Grid */}
          <div>
            <h3 className="text-[var(--color-app-text-muted)] text-sm font-semibold uppercase tracking-wider mb-4 px-1">{t('report.select_type')}</h3>
            <div className="grid grid-cols-2 gap-4">
              {hazardTypesList.length === 0 ? (
                <div className="col-span-2 text-center text-slate-500 py-4 animate-pulse">
                  Chargement des types de signalement...
                </div>
              ) : (
                hazardTypesList.map(ht => {
                  const isChecked = hazardType === ht.id;
                  return (
                    <div 
                      key={ht.id}
                      onClick={() => setHazardType(ht.id)}
                      className={`relative cursor-pointer flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 transition-all group ${
                        isChecked 
                          ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20 scale-[1.02]' 
                          : 'border-transparent bg-primary/5 hover:bg-primary/10'
                      }`}
                      style={{ borderColor: isChecked ? ht.color : 'transparent' }}
                    >
                      <div 
                        className="size-16 rounded-full flex items-center justify-center shadow-lg transition-colors"
                        style={{ 
                          backgroundColor: isChecked ? ht.color : `${ht.color}30`,
                          color: isChecked ? '#fff' : ht.color,
                        }}
                      >
                        {getIcon(ht.icon_name)}
                      </div>
                      <p className="text-base font-bold text-center text-[var(--color-app-text)]">
                        {language === 'en' ? ht.label_en : ht.label_fr}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Location Selection */}
          <div>
            <h3 className="text-[var(--color-app-text-muted)] text-sm font-semibold uppercase tracking-wider mb-4 px-1">{t('report.location')}</h3>
            <div className="flex p-1.5 rounded-2xl bg-[var(--color-app-surface)] border border-[var(--color-app-border)]">
              <label className="flex-1">
                <input 
                  type="radio" 
                  name="location_type" 
                  className="peer sr-only"
                  checked={locationType === 'current'}
                  onChange={() => setLocationType('current')}
                />
                <div className="py-4 px-4 rounded-xl text-center text-base font-bold cursor-pointer peer-checked:bg-primary peer-checked:text-white text-[var(--color-app-text-muted)] transition-all">
                  {t('report.current_loc')}
                </div>
              </label>
              <label className="flex-1">
                <input 
                  type="radio" 
                  name="location_type" 
                  className="peer sr-only"
                  checked={locationType === 'map'}
                  onChange={() => setLocationType('map')}
                />
                <div className="py-4 px-4 rounded-xl text-center text-base font-bold cursor-pointer peer-checked:bg-primary peer-checked:text-white text-[var(--color-app-text-muted)] transition-all">
                  {t('report.select_map')}
                </div>
              </label>
            </div>

            {/* Map Preview Container */}
            {locationType === 'map' ? (
              <div className="mt-6 relative rounded-2xl overflow-hidden aspect-video border border-[var(--color-app-border)] bg-[var(--color-app-surface)] z-0 shadow-sm">
                <MapContainer 
                  center={manualPos} 
                  zoom={15} 
                  zoomControl={false}
                  className="w-full h-full z-0"
                >
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                    detectRetina={true}
                    maxZoom={19}
                    className="map-tiles-filter"
                  />
                  <MapController center={manualPos} />
                  <LocationPicker position={manualPos} setPosition={setManualPos} />
                </MapContainer>
                <div className="absolute bottom-3 left-3 bg-[var(--color-app-surface)]/90 backdrop-blur-md px-4 py-2 rounded-full text-xs font-bold text-[var(--color-app-text)] z-[1000] border border-[var(--color-app-border)] shadow-lg flex items-center gap-2">
                  <MapPin size={16} className="text-primary" />
                  {t('report.tap_map')}
                </div>
              </div>
            ) : (
              <div className="mt-6 relative rounded-2xl overflow-hidden aspect-video border border-[var(--color-app-border)] bg-[var(--color-app-surface)] flex flex-col items-center justify-center gap-3 shadow-sm">
                <div className="relative flex items-center justify-center">
                  <div className="absolute size-12 bg-primary/20 rounded-full animate-ping"></div>
                  <div className="size-6 bg-primary rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                    <div className="size-3 bg-white rounded-full"></div>
                  </div>
                </div>
                <p className="text-[var(--color-app-text-muted)] text-base font-bold">
                  {hasUserLocation ? t('report.using_gps') : t('report.locating')}
                </p>
              </div>
            )}
          </div>

          {/* Additional Options */}
          <div className="space-y-4 pt-4">
            <div className="bg-[var(--color-app-surface)] p-6 rounded-2xl border border-[var(--color-app-border)] space-y-3">
              <label className="text-sm font-bold text-[var(--color-app-text-muted)] uppercase tracking-wider px-1">
                {language === 'en' ? 'LOCAL ZONE NAME (CARREFOUR, ETC.)' : 'NOM DE LA ZONE LOCALE (CARREFOUR, ETC.)'}
              </label>
              <input 
                type="text"
                maxLength={50}
                value={customLocation}
                onChange={(e) => setCustomLocation(e.target.value)}
                placeholder={language === 'en' ? 'e.g. Carrefour J\'aime mon pays' : 'ex: Carrefour J\'aime mon pays'}
                className="w-full bg-[var(--color-app-bg)] border border-[var(--color-app-border)] rounded-xl px-4 py-3 text-base font-bold text-[var(--color-app-text)] focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-[var(--color-app-text-muted)]/50"
              />
              <p className="text-[10px] text-[var(--color-app-text-muted)] px-1">
                {customLocation.length}/50 {language === 'en' ? 'characters' : 'caractères'}
              </p>
            </div>

            <div className="flex items-center justify-between px-2 bg-[var(--color-app-surface)] p-4 rounded-2xl border border-[var(--color-app-border)] cursor-pointer hover:bg-[var(--color-app-surface)]/80 transition-colors">
              <span className="text-base font-bold text-[var(--color-app-text)]">{t('report.add_photo')}</span>
              <button className="flex items-center gap-2 text-primary text-base font-extrabold">
                <Camera size={24} />
                {t('report.take_photo')}
              </button>
            </div>
          </div>
        </main>

        {/* Fixed Action Button at Bottom - Massively oversized for driving accessibility */}
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 bg-[var(--color-app-bg)] border-t border-[var(--color-app-border)] z-50">
          <button 
            onClick={handleReport}
            disabled={isSubmitting}
            className="w-full bg-primary hover:bg-primary/90 text-white font-extrabold py-5 rounded-2xl text-xl shadow-2xl shadow-primary/30 transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-70"
          >
            {isSubmitting ? <div className="size-7 border-4 border-white border-t-transparent rounded-full animate-spin"></div> : null}
            {t('report.confirm')}
          </button>
          <p className="text-center text-[var(--color-app-text-muted)] text-sm mt-4 px-8 leading-relaxed font-medium">
            {t('report.disclaimer')}
          </p>
        </div>
      </div>
    </div>
  );
}
