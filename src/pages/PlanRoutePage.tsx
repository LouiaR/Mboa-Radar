import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Navigation, MapPin, Search, LocateFixed, Route } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useLanguage } from '../contexts/LanguageContext';

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
  const navigate = useNavigate();
  const { t } = useLanguage();
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
    <div className="relative flex min-h-screen w-full flex-col md:flex-row bg-background-dark shadow-2xl overflow-hidden">
      {/* Sidebar / Top Panel */}
      <div className="flex flex-col w-full md:w-96 md:border-r border-primary/10 bg-background-dark z-[1000] shadow-lg md:h-screen shrink-0">
        <header className="flex items-center p-4 justify-between bg-background-dark/80 backdrop-blur-md border-b border-primary/10">
          <button 
            onClick={() => navigate(-1)}
            className="flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-primary/10 transition-colors"
          >
            <ArrowLeft size={24} className="text-slate-100" />
          </button>
          <h2 className="text-slate-100 text-lg font-bold leading-tight tracking-tight flex-1 text-center pr-10">{t('plan.title')}</h2>
        </header>

        <section className="p-4 space-y-4 flex-1 overflow-y-auto">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col w-full relative">
              <p className="text-slate-300 text-xs font-semibold uppercase tracking-wider pb-1.5 ml-1">{t('plan.start_placeholder')}</p>
              <div className="flex w-full items-stretch">
                <input 
                  type="text" 
                  value={startQuery}
                  onChange={(e) => setStartQuery(e.target.value)}
                  placeholder={t('plan.start_placeholder')} 
                  className="flex w-full min-w-0 flex-1 rounded-lg text-slate-100 border-primary/20 bg-primary/5 focus:border-primary focus:ring-1 focus:ring-primary h-12 px-4 text-base font-normal leading-normal rounded-r-none border-r-0" 
                />
                <button 
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={isLocating}
                  className="flex border border-primary/20 bg-primary/10 hover:bg-primary/20 items-center justify-center px-3 rounded-r-lg border-l-0 text-primary transition-colors disabled:opacity-50"
                  title={t('plan.use_current')}
                >
                  {isLocating ? <div className="size-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div> : <LocateFixed size={20} />}
                </button>
              </div>
            </div>

            <div className="flex flex-col w-full relative">
              <p className="text-slate-300 text-xs font-semibold uppercase tracking-wider pb-1.5 ml-1">{t('plan.dest_placeholder')}</p>
              <div className="flex w-full items-stretch">
                <input 
                  type="text" 
                  value={endQuery}
                  onChange={(e) => setEndQuery(e.target.value)}
                  placeholder={t('plan.dest_placeholder')} 
                  className="flex w-full min-w-0 flex-1 rounded-lg text-slate-100 border-primary/20 bg-primary/5 focus:border-primary focus:ring-1 focus:ring-primary h-12 px-4 text-base font-normal leading-normal" 
                />
              </div>
            </div>

            <button 
              onClick={handleSearch}
              disabled={loading || (!startQuery && !endQuery)}
              className="w-full h-12 mt-2 bg-primary text-background-dark font-bold rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
            >
              {loading ? <div className="size-5 border-2 border-background-dark border-t-transparent rounded-full animate-spin"></div> : <Search size={20} />}
              {loading ? t('plan.searching') : t('plan.search_btn')}
            </button>
          </div>
        </section>
      </div>

      {/* Map Area */}
      <main className="flex-1 relative min-h-[50vh] md:min-h-screen bg-slate-800 z-0">
        <MapContainer 
          center={startCoords || [4.0511, 9.7679]} 
          zoom={13} 
          zoomControl={false}
          className="w-full h-full z-0 absolute inset-0"
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
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
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-background-dark/90 backdrop-blur-md border border-primary/20 px-6 py-3 rounded-full shadow-2xl z-[1000] flex items-center gap-3">
            <Route size={20} className="text-primary" />
            <span className="text-slate-100 font-bold text-sm whitespace-nowrap">{t('plan.route_planned')}</span>
          </div>
        )}
      </main>
    </div>
  );
}
