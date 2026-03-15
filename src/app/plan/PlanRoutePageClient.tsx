"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Navigation, MapPin, Search, LocateFixed, Route, ArrowRight } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';

// Custom Icons
const startIcon = L.divIcon({
  className: 'custom-leaflet-icon',
  html: `<div class="flex items-center justify-center w-8 h-8 rounded-full shadow-lg text-white bg-blue-500 border-2 border-white font-bold">A</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const endIcon = L.divIcon({
  className: 'custom-leaflet-icon',
  html: `<div class="flex items-center justify-center w-8 h-8 rounded-full shadow-lg text-white bg-green-500 border-2 border-white font-bold">B</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

function MapController({ start, end }: { start: [number, number] | null, end: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (start && end) {
      const bounds = L.latLngBounds(start, end);
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (start) {
      map.flyTo(start, 14);
    } else if (end) {
      map.flyTo(end, 14);
    }
  }, [start, end, map]);
  return null;
}

export default function PlanRoutePage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { isDark } = useTheme();
  const [startQuery, setStartQuery] = useState('');
  const [endQuery, setEndQuery] = useState('');
  const [startCoords, setStartCoords] = useState<[number, number] | null>(null);
  const [endCoords, setEndCoords] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const handleUseCurrentLocation = () => {
    if ('geolocation' in navigator) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition((pos) => {
        setStartCoords([pos.coords.latitude, pos.coords.longitude]);
        setStartQuery(t('plan.current_loc'));
        setIsLocating(false);
      }, (err) => {
        console.error("Failed to get location", err);
        let errorMsg = t('plan.loc_error');
        if (err.code === 1) errorMsg = t('errors.location_denied');
        else if (err.code === 2) errorMsg = t('errors.location_unavailable');
        else if (err.code === 3) errorMsg = t('errors.location_timeout');
        
        alert(errorMsg);
        setIsLocating(false);
      }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
    } else {
      alert(t('plan.loc_error'));
    }
  };

  const geocode = async (query: string) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        return [parseFloat(data[0].lat), parseFloat(data[0].lon)] as [number, number];
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  };

  const handleSearch = async () => {
    setLoading(true);
    if (startQuery && startQuery !== t('plan.current_loc')) {
      const coords = await geocode(startQuery);
      if (coords) setStartCoords(coords);
      else alert(`${t('plan.route_error')}: ${startQuery}`);
    } else if (startQuery === t('plan.current_loc') && !startCoords) {
      alert(t('plan.loc_error'));
    }
    
    if (endQuery) {
      const coords = await geocode(endQuery);
      if (coords) setEndCoords(coords);
      else alert(`${t('plan.route_error')}: ${endQuery}`);
    }
    setLoading(false);
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col md:flex-row bg-[var(--color-app-bg)] shadow-2xl overflow-hidden">
      {/* Sidebar / Top Panel */}
      <div className="flex flex-col w-full md:w-[400px] md:border-r border-[var(--color-app-border)] bg-[var(--color-app-bg)] z-[1000] shadow-2xl md:h-screen shrink-0">
        <header className="flex items-center p-6 justify-between bg-[var(--color-app-surface)]/80 backdrop-blur-md border-b border-[var(--color-app-border)]">
          <button 
            onClick={() => router.back()}
            className="flex size-14 shrink-0 items-center justify-center rounded-full hover:bg-primary/10 transition-all active:scale-95"
          >
            <ArrowLeft size={32} className="text-[var(--color-app-text)]" />
          </button>
          <h2 className="text-[var(--color-app-text)] text-2xl font-black leading-tight tracking-tight flex-1 text-center pr-10">{t('plan.title')}</h2>
        </header>

        <section className="p-6 space-y-8 flex-1 overflow-y-auto pb-32">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col w-full relative">
              <p className="text-[var(--color-app-text-muted)] text-sm font-black uppercase tracking-widest pb-3 ml-1">{t('plan.start_placeholder')}</p>
              <div className="flex w-full items-stretch shadow-lg rounded-2xl">
                <input 
                  type="text" 
                  value={startQuery}
                  onChange={(e) => setStartQuery(e.target.value)}
                  placeholder={t('plan.start_placeholder')} 
                  className="flex w-full min-w-0 flex-1 rounded-l-2xl text-[var(--color-app-text)] border-2 border-[var(--color-app-border)] bg-[var(--color-app-surface)] focus:border-primary focus:ring-4 focus:ring-primary/10 h-16 px-5 text-lg font-bold leading-normal border-r-0 transition-all" 
                />
                <button 
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={isLocating}
                  className="flex border-2 border-[var(--color-app-border)] bg-[var(--color-app-surface)] hover:bg-primary/10 items-center justify-center px-5 rounded-r-2xl border-l-0 text-primary transition-all disabled:opacity-50 active:scale-95"
                  title={t('plan.use_current')}
                >
                  {isLocating ? <div className="size-6 border-4 border-primary border-t-transparent rounded-full animate-spin"></div> : <LocateFixed size={28} />}
                </button>
              </div>
            </div>

            <div className="flex flex-col w-full relative">
              <p className="text-[var(--color-app-text-muted)] text-sm font-black uppercase tracking-widest pb-3 ml-1">{t('plan.dest_placeholder')}</p>
              <div className="flex w-full items-stretch shadow-lg rounded-2xl">
                <input 
                  type="text" 
                  value={endQuery}
                  onChange={(e) => setEndQuery(e.target.value)}
                  placeholder={t('plan.dest_placeholder')} 
                  className="flex w-full min-w-0 flex-1 rounded-2xl text-[var(--color-app-text)] border-2 border-[var(--color-app-border)] bg-[var(--color-app-surface)] focus:border-primary focus:ring-4 focus:ring-primary/10 h-16 px-5 text-lg font-bold leading-normal transition-all" 
                />
              </div>
            </div>

            <button 
              onClick={handleSearch}
              disabled={loading || (!startQuery && !endQuery)}
              className="w-full h-16 mt-4 bg-primary text-white text-xl font-black rounded-2xl flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-all active:scale-[0.98] shadow-2xl shadow-primary/30"
            >
              {loading ? <div className="size-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div> : <Search size={28} />}
              {loading ? t('plan.searching') : t('plan.search_btn')}
            </button>
          </div>
        </section>
      </div>

      {/* Map Area */}
      <main className="flex-1 relative min-h-[50vh] md:min-h-screen bg-[var(--color-app-surface)] z-0">
        <MapContainer 
          center={startCoords || [4.0511, 9.7679]} 
          zoom={13} 
          zoomControl={false}
          className="w-full h-full z-0 absolute inset-0"
        >
          <TileLayer
            url={isDark 
              ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            }
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            detectRetina={true}
          />
          <MapController start={startCoords} end={endCoords} />
          
          {startCoords && <Marker position={startCoords} icon={startIcon} />}
          {endCoords && <Marker position={endCoords} icon={endIcon} />}
          {startCoords && endCoords && (
            <Polyline 
              positions={[startCoords, endCoords]} 
              color="#f49d25" 
              weight={4} 
              dashArray="10, 10"
            />
          )}
        </MapContainer>
        
        {startCoords && endCoords && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-[var(--color-app-surface)]/95 backdrop-blur-xl border-2 border-primary/30 px-10 py-5 rounded-full shadow-[0_20px_60px_rgba(0,0,0,0.4)] z-[1000] flex items-center gap-5 transition-all animate-in fade-in slide-in-from-bottom-5">
            <div className="bg-primary/20 p-3 rounded-full">
              <Route size={32} className="text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="text-[var(--color-app-text-muted)] text-xs font-black uppercase tracking-widest">{t('plan.status')}</span>
              <span className="text-[var(--color-app-text)] font-black text-xl whitespace-nowrap">{t('plan.route_planned')}</span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
