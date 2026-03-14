import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, HelpCircle, Camera, Gauge, TrafficCone, ShieldAlert, MapPin } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { addReport } from '../lib/db';
import { useLanguage } from '../contexts/LanguageContext';

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
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [hazardType, setHazardType] = useState<'fixed' | 'mobile' | 'traffic_light' | 'checkpoint'>('fixed');
  const [locationType, setLocationType] = useState<'current' | 'map'>('current');
  const [manualPos, setManualPos] = useState<[number, number]>([4.0511, 9.7679]); // Default Douala
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
  }, []);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReport = async () => {
    setIsSubmitting(true);
    try {
      if (locationType === 'current' && 'geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(async (pos) => {
          await addReport({
            type: hazardType,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
          setIsSubmitting(false);
          navigate('/');
        }, (err) => {
          console.error('Failed to get location', err);
          let errorMsg = t('plan.loc_error');
          if (err.code === 1) errorMsg = t('errors.location_denied');
          else if (err.code === 2) errorMsg = t('errors.location_unavailable');
          else if (err.code === 3) errorMsg = t('errors.location_timeout');
          
          alert(errorMsg);
          
          // Fallback to manualPos if location fails
          addReport({ type: hazardType, latitude: manualPos[0], longitude: manualPos[1] }).then(() => {
            setIsSubmitting(false);
            navigate('/');
          });
        }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
      } else {
        // Use manually selected map position
        await addReport({
          type: hazardType,
          latitude: manualPos[0],
          longitude: manualPos[1],
        });
        setIsSubmitting(false);
        navigate('/');
      }
    } catch (error) {
      console.error('Failed to save report', error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center bg-background-dark overflow-hidden">
      <div className="flex flex-col w-full max-w-2xl h-full md:h-auto md:min-h-screen md:border-x border-primary/10 bg-background-dark shadow-2xl relative">
        {/* Top Navigation Bar */}
        <div className="flex items-center px-4 py-4 justify-between border-b border-primary/10 sticky top-0 bg-background-dark/90 backdrop-blur-md z-50">
          <div 
            onClick={() => navigate(-1)}
            className="flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-primary/10 cursor-pointer"
          >
            <X size={24} className="text-slate-300" />
          </div>
          <h2 className="text-slate-100 text-lg font-bold leading-tight tracking-tight flex-1 text-center">{t('report.title')}</h2>
          <div className="flex size-10 items-center justify-center rounded-full hover:bg-primary/10 cursor-pointer">
            <HelpCircle size={24} className="text-slate-300" />
          </div>
        </div>

        <main className="flex-1 overflow-y-auto p-4 space-y-6 pb-32">
          {/* Hazard Selection Grid */}
          <div>
            <h3 className="text-slate-300 text-sm font-semibold uppercase tracking-wider mb-4 px-1">{t('report.select_type')}</h3>
            <div className="grid grid-cols-2 gap-4">
              {/* Fixed Radar */}
              <label className="relative cursor-pointer group">
                <input 
                  type="radio" 
                  name="hazard_type" 
                  className="peer sr-only" 
                  checked={hazardType === 'fixed'}
                  onChange={() => setHazardType('fixed')}
                />
                <div className="flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 border-transparent bg-primary/5 peer-checked:border-primary peer-checked:bg-primary/10 transition-all">
                  <div className="size-14 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                    <Camera size={32} />
                  </div>
                  <p className="text-sm font-bold text-center text-slate-100">{t('report.fixed_radar')}</p>
                </div>
              </label>

              {/* Mobile Radar */}
              <label className="relative cursor-pointer group">
                <input 
                  type="radio" 
                  name="hazard_type" 
                  className="peer sr-only"
                  checked={hazardType === 'mobile'}
                  onChange={() => setHazardType('mobile')}
                />
                <div className="flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 border-transparent bg-primary/5 peer-checked:border-primary peer-checked:bg-primary/10 transition-all">
                  <div className="size-14 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                    <Gauge size={32} />
                  </div>
                  <p className="text-sm font-bold text-center text-slate-100">{t('report.mobile_radar')}</p>
                </div>
              </label>

              {/* Traffic Light Camera */}
              <label className="relative cursor-pointer group">
                <input 
                  type="radio" 
                  name="hazard_type" 
                  className="peer sr-only"
                  checked={hazardType === 'traffic_light'}
                  onChange={() => setHazardType('traffic_light')}
                />
                <div className="flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 border-transparent bg-primary/5 peer-checked:border-primary peer-checked:bg-primary/10 transition-all">
                  <div className="size-14 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                    <TrafficCone size={32} />
                  </div>
                  <p className="text-sm font-bold text-center text-slate-100">{t('report.traffic_camera')}</p>
                </div>
              </label>

              {/* Police Checkpoint */}
              <label className="relative cursor-pointer group">
                <input 
                  type="radio" 
                  name="hazard_type" 
                  className="peer sr-only"
                  checked={hazardType === 'checkpoint'}
                  onChange={() => setHazardType('checkpoint')}
                />
                <div className="flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 border-transparent bg-primary/5 peer-checked:border-primary peer-checked:bg-primary/10 transition-all">
                  <div className="size-14 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                    <ShieldAlert size={32} />
                  </div>
                  <p className="text-sm font-bold text-center text-slate-100">{t('report.checkpoint')}</p>
                </div>
              </label>
            </div>
          </div>

          {/* Location Selection */}
          <div>
            <h3 className="text-slate-300 text-sm font-semibold uppercase tracking-wider mb-4 px-1">{t('report.location')}</h3>
            <div className="flex p-1 rounded-xl bg-primary/5">
              <label className="flex-1">
                <input 
                  type="radio" 
                  name="location_type" 
                  className="peer sr-only"
                  checked={locationType === 'current'}
                  onChange={() => setLocationType('current')}
                />
                <div className="py-3 px-4 rounded-lg text-center text-sm font-medium cursor-pointer peer-checked:bg-primary peer-checked:text-background-dark text-slate-400 transition-all">
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
                <div className="py-3 px-4 rounded-lg text-center text-sm font-medium cursor-pointer peer-checked:bg-primary peer-checked:text-background-dark text-slate-400 transition-all">
                  {t('report.select_map')}
                </div>
              </label>
            </div>

            {/* Map Preview Container */}
            {locationType === 'map' ? (
              <div className="mt-4 relative rounded-xl overflow-hidden aspect-video border border-primary/10 bg-slate-800 z-0">
                <MapContainer 
                  center={manualPos} 
                  zoom={15} 
                  zoomControl={false}
                  className="w-full h-full z-0"
                >
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                  />
                  <MapController center={manualPos} />
                  <LocationPicker position={manualPos} setPosition={setManualPos} />
                </MapContainer>
                <div className="absolute bottom-3 left-3 bg-background-dark/80 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-medium text-white/90 z-[1000] border border-primary/20 shadow-lg flex items-center gap-2">
                  <MapPin size={14} className="text-primary" />
                  {t('report.tap_map')}
                </div>
              </div>
            ) : (
              <div className="mt-4 relative rounded-xl overflow-hidden aspect-video border border-primary/10 bg-slate-800 flex flex-col items-center justify-center gap-3">
                <div className="relative flex items-center justify-center">
                  <div className="absolute size-12 bg-primary/20 rounded-full animate-ping"></div>
                  <div className="size-6 bg-primary rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                    <div className="size-2 bg-white rounded-full"></div>
                  </div>
                </div>
                <p className="text-slate-300 text-sm font-medium">
                  {hasUserLocation ? t('report.using_gps') : t('report.locating')}
                </p>
              </div>
            )}
          </div>

          {/* Additional Options */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-sm font-medium text-slate-100">{t('report.add_photo')}</span>
              <button className="flex items-center gap-2 text-primary text-sm font-bold">
                <Camera size={20} />
                {t('report.take_photo')}
              </button>
            </div>
          </div>
        </main>

        {/* Fixed Action Button at Bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-background-dark border-t border-primary/10 z-50">
          <button 
            onClick={handleReport}
            disabled={isSubmitting}
            className="w-full bg-primary hover:bg-primary/90 text-background-dark font-bold py-4 rounded-xl text-lg shadow-lg shadow-primary/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {isSubmitting ? <div className="size-6 border-2 border-background-dark border-t-transparent rounded-full animate-spin"></div> : null}
            {t('report.confirm')}
          </button>
          <p className="text-center text-slate-400 text-xs mt-3 px-8 leading-relaxed">
            {t('report.disclaimer')}
          </p>
        </div>
      </div>
    </div>
  );
}
