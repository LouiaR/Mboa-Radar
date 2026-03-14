import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Bell, Navigation, Camera, Radio, TrafficCone, Search, Mic, PlusCircle, ShieldAlert, Award, Globe } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { getAllReports, getUserProfile } from '../lib/db';
import { useLanguage } from '../contexts/LanguageContext';

// Custom Icons
const cameraSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>`;
const radioSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"/><path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"/><circle cx="12" cy="12" r="2"/><path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"/><path d="M19.1 4.9C23 8.8 23 15.2 19.1 19.1"/></svg>`;
const coneSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9.3 6.2-.4-1.6c-.3-1.1-.4-1.6-1-1.6s-.7.5-1 1.6l-.4 1.6"/><path d="m14.7 6.2.4-1.6c.3-1.1.4-1.6 1-1.6s.7.5 1 1.6l.4 1.6"/><path d="M2 22h20"/><path d="M12 2v20"/><path d="m4.5 14 3-12"/><path d="m19.5 14-3-12"/><path d="M6 10h12"/><path d="M7.5 14h9"/></svg>`;
const shieldSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>`;

const getIconForType = (type: string) => {
  let svg = cameraSvg;
  let color = '#f49d25'; // primary
  if (type === 'mobile') { svg = radioSvg; color = '#3b82f6'; }
  if (type === 'traffic_light') { svg = coneSvg; color = '#ef4444'; }
  if (type === 'checkpoint') { svg = shieldSvg; color = '#8b5cf6'; }
  
  return L.divIcon({
    className: 'custom-leaflet-icon',
    html: `<div class="flex items-center justify-center w-8 h-8 rounded-full shadow-lg text-white" style="background-color: ${color}; border: 2px solid white;">${svg}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  });
};

const userIcon = L.divIcon({
  className: 'user-location-icon',
  html: `<div class="relative flex items-center justify-center w-6 h-6"><div class="absolute w-full h-full bg-blue-400 rounded-full opacity-40 animate-ping"></div><div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg"></div></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

function MapController({ center }: { center: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, map.getZoom(), { animate: true });
    }
  }, [center, map]);
  return null;
}

export default function MapPage() {
  const { t, language, setLanguage } = useLanguage();
  const [reports, setReports] = useState<any[]>([]);
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([4.0511, 9.7679]); // Default Douala
  const [speed, setSpeed] = useState<number>(0);
  const [userScore, setUserScore] = useState<{score: number, level: string} | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const data = await getAllReports();
      setReports(data);
      const profile = await getUserProfile();
      setUserScore({ score: profile.score, level: profile.level });
    };
    loadData();

    if ('geolocation' in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const newPos: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setUserPos(newPos);
          if (pos.coords.speed !== null) {
            setSpeed(Math.round(pos.coords.speed * 3.6));
          }
          // Only center on first load or if explicitly requested
          if (!userPos) setMapCenter(newPos);
        },
        (err) => console.error("Geolocation error:", err),
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  const [isLocating, setIsLocating] = useState(false);

  const handleRecenter = () => {
    if (userPos) {
      setMapCenter(userPos);
    } else if ('geolocation' in navigator) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newPos: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setUserPos(newPos);
          setMapCenter(newPos);
          setIsLocating(false);
        },
        (err) => {
          console.error("Geolocation error:", err);
          let errorMsg = t('plan.loc_error');
          if (err.code === 1) errorMsg = t('errors.location_denied');
          else if (err.code === 2) errorMsg = t('errors.location_unavailable');
          else if (err.code === 3) errorMsg = t('errors.location_timeout');
          
          alert(errorMsg);
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      alert(t('plan.loc_error'));
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'fr' : 'en');
  };

  const getTranslatedLevel = (level: string) => {
    if (level === 'Novice') return t('map.level_novice');
    if (level === 'Scout') return t('map.level_scout');
    if (level === 'Veteran') return t('map.level_veteran');
    return level;
  };

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden">
      {/* Top Header Overlay */}
      <div className="absolute top-0 left-0 right-0 z-[1000] flex items-center bg-background-dark/80 backdrop-blur-md p-4 justify-between border-b border-primary/10">
        <div className="text-primary flex size-10 items-center justify-center rounded-lg hover:bg-primary/10 transition-colors cursor-pointer">
          <Menu size={24} />
        </div>
        
        {userScore && (
          <div className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20">
            <Award size={16} className="text-primary" />
            <span className="text-sm font-bold text-primary">{userScore.score}</span>
            <span className="text-xs text-slate-400 border-l border-primary/20 pl-2">{getTranslatedLevel(userScore.level)}</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <button 
            onClick={toggleLanguage}
            className="flex items-center justify-center gap-1 rounded-lg h-10 px-2 bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-xs font-bold uppercase"
          >
            <Globe size={16} />
            {language}
          </button>
          <button className="flex items-center justify-center rounded-lg h-10 w-10 bg-transparent text-primary hover:bg-primary/10 transition-colors">
            <Bell size={24} />
          </button>
        </div>
      </div>

      {/* Main Map Area */}
      <div className="relative flex-1 w-full bg-background-dark overflow-hidden">
        <MapContainer 
          center={mapCenter} 
          zoom={14} 
          zoomControl={false}
          className="w-full h-full z-0"
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
          <MapController center={mapCenter} />
          
          {userPos && (
            <Marker position={userPos} icon={userIcon}>
              <Popup className="bg-background-dark text-slate-100 border-primary/20">
                {t('map.you_are_here')}
              </Popup>
            </Marker>
          )}

          {reports.map((report) => (
            <Marker key={report.id} position={[report.latitude, report.longitude]} icon={getIconForType(report.type)}>
              <Popup>
                <div className="font-bold text-slate-800 capitalize">{t(`report.${report.type}`)}</div>
                <div className="text-xs text-slate-500">{t('map.reported_locally')}</div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Floating Map Controls */}
        <div className="absolute right-4 top-24 z-[1000] flex flex-col gap-3">
          <button 
            onClick={handleRecenter}
            disabled={isLocating}
            className="flex size-12 items-center justify-center rounded-xl bg-background-dark/90 backdrop-blur-md border border-primary/20 text-primary shadow-xl hover:bg-primary/10 transition-colors disabled:opacity-50"
          >
            {isLocating ? <div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div> : <Navigation size={24} />}
          </button>
        </div>

        {/* Speed Indicator */}
        <div className="absolute left-4 top-24 z-[1000]">
          <div className="flex flex-col items-center justify-center size-16 rounded-full bg-background-dark/90 backdrop-blur-md border-4 border-primary shadow-xl">
            <span className="text-xl font-black text-slate-100 leading-none">{speed}</span>
            <span className="text-[10px] font-bold text-primary uppercase">km/h</span>
          </div>
        </div>

        {/* Bottom Sheet / Search Overlay */}
        <div className="absolute bottom-0 left-0 right-0 z-[1000] px-4 pb-6 space-y-4 pointer-events-none">
          {/* Filter Pills */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide pointer-events-auto">
            <div className="flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full bg-primary text-background-dark px-4 shadow-lg font-medium text-sm">
              <Camera size={18} />
              <span>{t('report.fixed_radar')}</span>
            </div>
            <div className="flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full bg-background-dark/90 border border-primary/30 backdrop-blur-md text-slate-100 px-4 shadow-lg font-medium text-sm">
              <Radio size={18} />
              <span>{t('report.mobile_radar')}</span>
            </div>
            <div className="flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full bg-background-dark/90 border border-primary/30 backdrop-blur-md text-slate-100 px-4 shadow-lg font-medium text-sm">
              <TrafficCone size={18} />
              <span>{t('report.traffic_camera')}</span>
            </div>
          </div>

          {/* Search Bar */}
          <div className="bg-background-dark/90 backdrop-blur-lg rounded-2xl border border-primary/20 p-2 shadow-2xl pointer-events-auto">
            <Link to="/plan" className="flex items-center h-12 px-4 gap-3 cursor-text">
              <Search size={20} className="text-primary" />
              <div className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-slate-400 font-display text-left">{t('map.search')}</div>
              <Mic size={20} className="text-slate-400" />
            </Link>
          </div>

          {/* Floating Action Button */}
          <div className="flex justify-center pointer-events-auto">
            <Link to="/report" className="flex h-14 items-center justify-center gap-3 rounded-full bg-primary px-8 text-background-dark shadow-2xl shadow-primary/30 hover:scale-105 transition-transform">
              <PlusCircle size={24} className="font-bold" />
              <span className="font-bold tracking-wide uppercase text-sm">{t('map.report_btn')}</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
