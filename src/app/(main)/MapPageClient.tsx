"use client";
import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { Menu, Bell, Navigation, Camera, Radio, TrafficCone, Search, Mic, PlusCircle, ShieldAlert, Award, Globe, X, User, BarChart2 } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import { getAllReports, getUserProfile, getHazardTypes, HazardType, syncReportsDownFromCloud, reverseGeocode, updateReport, voteReport, getUserVote as dbGetUserVote, getNotifications, markAllNotificationsAsRead, addNotification } from '@/lib/db';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

// Custom Icons
const cameraSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>`;
const radioSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"/><path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"/><circle cx="12" cy="12" r="2"/><path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"/><path d="M19.1 4.9C23 8.8 23 15.2 19.1 19.1"/></svg>`;
const coneSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9.3 6.2-.4-1.6c-.3-1.1-.4-1.6-1-1.6s-.7.5-1 1.6l-.4 1.6"/><path d="m14.7 6.2.4-1.6c.3-1.1.4-1.6 1-1.6s.7.5 1 1.6l.4 1.6"/><path d="M2 22h20"/><path d="M12 2v20"/><path d="m4.5 14 3-12"/><path d="m19.5 14-3-12"/><path d="M6 10h12"/><path d="M7.5 14h9"/></svg>`;
const shieldSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>`;

const getIconForHazard = (hazard?: HazardType) => {
  let svg = cameraSvg;
  let color = '#f49d25'; // Default primary
  
  if (hazard) {
    color = hazard.color;
    if (hazard.icon_name === 'radio') svg = radioSvg;
    if (hazard.icon_name === 'traffic-cone') svg = coneSvg;
    if (hazard.icon_name === 'shield-alert') svg = shieldSvg;
  }
  
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

function MapController({ center, zoom }: { center: [number, number] | null, zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom || map.getZoom(), { animate: true, duration: 1.5 });
    }
  }, [center, zoom, map]);
  return null;
}

// Utility to calculate distance in meters (Haversine formula)
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3; // metres
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // in metres
};

const formatTimeAgo = (timestamp: number, language: 'en' | 'fr') => {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  
  if (mins < 1) return language === 'en' ? 'Just now' : 'À l\'instant';
  if (mins < 60) return language === 'en' ? `${mins}m ago` : `Il y a ${mins}m`;
  
  const hours = Math.floor(mins / 60);
  if (hours < 24) return language === 'en' ? `${hours}h ago` : `Il y a ${hours}h`;
  
  return language === 'en' ? 'Old' : 'Ancien';
};

export default function MapPage() {
  const router = useRouter();
  const { t, language, setLanguage } = useLanguage();
  const { isDark } = useTheme();
  const [reports, setReports] = useState<any[]>([]);
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([4.0511, 9.7679]); // Douala
  const [mapZoom, setMapZoom] = useState(14);
  const [speed, setSpeed] = useState<number>(0);
  const [userScore, setUserScore] = useState<{score: number, level: string} | null>(null);
  const [authUser, setAuthUser] = useState<any>(null);
  
  // Dynamic Hazards & Filtering
  const [hazardTypes, setHazardTypes] = useState<HazardType[]>([]);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [userVotes, setUserVotes] = useState<Record<string, 'up' | 'down'>>({});
  const [shakeId, setShakeId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const spokenReports = useRef<Set<string>>(new Set());

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Interrupt current speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'en' ? 'en-US' : 'fr-FR';
      utterance.rate = 1.1; // Slightly faster for clarity in car
      window.speechSynthesis.speak(utterance);
    }
  };

  const vibrate = (pattern: number | number[]) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  };

  // Drag to scroll refs and state
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftPos, setScrollLeftPos] = useState(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthUser(session?.user ?? null);
      fetchUserScoreData();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user ?? null);
      fetchUserScoreData();
    });

    const fetchUserScoreData = async () => {
      try {
        const profile = await getUserProfile();
        setUserScore({ score: profile.score, level: profile.level });
        
        // Fetch user's local votes to show in UI
        const allReports = await getAllReports();
        const votes: Record<string, 'up' | 'down'> = {};
        for (const r of allReports) {
          const v = await dbGetUserVote(r.id);
          if (v) votes[r.id] = v.vote_type;
        }
        setUserVotes(votes);
      } catch (err) {
        console.error("Failed to fetch profile/votes:", err);
        setUserScore({ score: 0, level: 'Novice' });
      }
    };

    const loadData = async () => {
      // 1. Initial fetch from local cache for speed
      let data = await getAllReports();
      setReports(data);
      
      // 2. Perform background reconciliation
      try {
        await syncReportsDownFromCloud();
        const freshData = await getAllReports();
        setReports(freshData);
      } catch (err) {
        console.error("Background sync failed:", err);
      }
      
      const dynTypes = await getHazardTypes();
      setHazardTypes(dynTypes);
    };

    const loadNotifications = async () => {
      const data = await getNotifications();
      setNotifications(data);
    };

    loadData();
    loadNotifications();
    
    // 3. Set up periodic background refresh (e.g. every 30 seconds)
    const refreshInterval = setInterval(() => {
      console.log('Auto-refreshing hazard data...');
      loadData();
      loadNotifications();
    }, 30000);

    let watchId: number | null = null;
    if ('geolocation' in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const newPos: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setUserPos(newPos);
          if (pos.coords.speed !== null) {
            setSpeed(Math.round(pos.coords.speed * 3.6));
          }
          // Only center on first load or if explicitly requested
          if (!userPos) setMapCenter(newPos);

          let nearestHazardDist = Infinity;

          // Accessibility: Proximity Alerts
          reports.forEach(report => {
            const dist = getDistance(newPos[0], newPos[1], report.latitude, report.longitude);
            if (dist < nearestHazardDist) nearestHazardDist = dist;

            if (dist < 500 && !spokenReports.current.has(report.id)) {
              const hazType = hazardTypes.find(h => h.id === report.type);
              const name = language === 'en' ? (hazType?.label_en || 'Hazard') : (hazType?.label_fr || 'Danger');
              speak(`${language === 'en' ? 'Warning,' : 'Attention,'} ${name} ${language === 'en' ? 'ahead' : 'devant'}`);
              vibrate([200, 100, 200]);
              spokenReports.current.add(report.id);
              
              // Add persistent notification
              addNotification({
                type: 'proximity',
                title: language === 'en' ? 'Hazard Alert' : 'Alerte Danger',
                message: `${name} ${language === 'en' ? 'detected ahead' : 'détecté devant'}${report.customLocation ? ` ("${report.customLocation}")` : ''}.`,
                hazardId: report.id
              }).then(() => loadNotifications());
            } else if (dist > 1000 && spokenReports.current.has(report.id)) {
              spokenReports.current.delete(report.id); // Reset for re-entry
            }
          });

          // Smart Zoom Logic
          if (nearestHazardDist < 300) {
            setMapZoom(17);
          } else if (nearestHazardDist > 1000) {
            setMapZoom(14);
          }
        },
        (err) => {
          console.error("Geolocation error:", err);
          if (err.code === 1) { // Permission Denied
            alert(language === 'en' 
              ? "Location permission blocked. Please click the 'tune' or 'lock' icon in your browser's address bar to reset permissions and see your position on the map."
              : "La permission de localisation est bloquée. Veuillez cliquer sur l'icône de réglages (ou cadenas) à gauche de l'URL pour réinitialiser les permissions et voir votre position."
            );
          }
        },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      );
    }

    return () => {
      clearInterval(refreshInterval);
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  const [isLocating, setIsLocating] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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

  const handleVote = async (id: string, type: 'up' | 'down') => {
    if (!authUser) {
      setShakeId(id);
      vibrate([100, 50, 100]); // Alarm pattern
      setTimeout(() => {
        setShakeId(null);
        router.push('/auth');
      }, 500);
      return;
    }

    const updated = await voteReport(id, type, authUser.id);
    if (updated) {
      setReports(prev => prev.map(r => r.id === id ? updated : r));
      setUserVotes(prev => ({ ...prev, [id]: type }));
      vibrate(50); // Feedback
    }
  };

  const toggleFilter = (hazardId: string) => {
    setActiveFilters(prev => 
      prev.includes(hazardId) 
        ? prev.filter(id => id !== hazardId)
        : [...prev, hazardId]
    );
  };

  const getHazardIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'radio': return <Radio size={18} />;
      case 'traffic-cone': return <TrafficCone size={18} />;
      case 'shield-alert': return <ShieldAlert size={18} />;
      default: return <Camera size={18} />;
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeftPos(scrollRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2; // scroll-fast modifier
    scrollRef.current.scrollLeft = scrollLeftPos - walk;
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

  const handleMarkAllRead = async () => {
    await markAllNotificationsAsRead();
    const data = await getNotifications();
    setNotifications(data);
    vibrate(50);
  };

  // 4. Overlapping Markers Logic ("Spiderfy")
  const distributedReports = useMemo(() => {
    const filtered = reports.filter(r => activeFilters.length === 0 || activeFilters.includes(r.type));
    
    // Group by high-precision coordinates (approx 1.1m precision)
    const groups = new Map<string, any[]>();
    filtered.forEach(r => {
      const key = `${r.latitude.toFixed(5)},${r.longitude.toFixed(5)}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(r);
    });

    const result: any[] = [];
    groups.forEach((items) => {
      if (items.length === 1) {
        result.push(items[0]);
      } else {
        // Spread in a circle
        const radius = 0.00015; // ~15-20 meters
        items.forEach((item, index) => {
          const angle = (index / items.length) * Math.PI * 2;
          result.push({
            ...item,
            displayLat: item.latitude + (radius * Math.cos(angle)),
            displayLon: item.longitude + (radius * Math.sin(angle))
          });
        });
      }
    });
    return result;
  }, [reports, activeFilters]);

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden">
      {/* Top Header Overlay */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl z-[1000] flex items-center bg-[var(--color-app-surface)]/90 backdrop-blur-md p-4 justify-between border-b border-primary/10 md:rounded-b-2xl shadow-sm">
        
        <div className="flex items-center gap-3">
          {/* Mobile Hamburger (Hidden on Desktop) */}
          <div 
            onClick={() => setIsMenuOpen(true)}
            className="text-primary flex size-10 items-center justify-center rounded-lg hover:bg-primary/10 transition-colors cursor-pointer md:hidden"
          >
            <Menu size={24} />
          </div>

          {authUser && userScore && userScore.score > 0 && (
            <div className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20 cursor-default">
              <Award size={16} className="text-primary" />
              <span className="text-sm font-bold text-primary">{userScore.score}</span>
              <span className="text-xs text-[var(--color-app-text-muted)] border-l border-primary/20 pl-2">{getTranslatedLevel(userScore.level)}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={toggleLanguage}
            className="flex items-center justify-center gap-1 rounded-lg h-10 px-2 bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-xs font-bold uppercase"
          >
            <Globe size={16} />
            {language}
          </button>
          <button 
            onClick={() => setIsNotificationPanelOpen(true)}
            className="relative flex items-center justify-center rounded-lg h-10 w-10 bg-transparent text-primary hover:bg-primary/10 transition-colors"
          >
            <Bell size={24} />
            {notifications.filter(n => !n.isRead).length > 0 && (
              <span className="absolute top-1 right-1 flex size-4 items-center justify-center bg-red-500 text-[10px] font-bold text-white rounded-full border border-white animate-pulse">
                {notifications.filter(n => !n.isRead).length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Map Area */}
      <div className="relative flex-1 w-full bg-[var(--color-app-bg)] overflow-hidden">
        <MapContainer 
          center={mapCenter} 
          zoom={mapZoom} 
          zoomControl={false}
          className="w-full h-full z-0"
        >
          <TileLayer
            url={isDark 
              ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            }
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
            detectRetina={true}
            maxZoom={19}
            className="map-tiles-filter"
          />
          <MapController center={mapCenter} zoom={mapZoom} />
          
          {userPos && (
            <Marker position={userPos} icon={userIcon}>
              <Popup className="bg-[var(--color-app-surface)] text-[var(--color-app-text)] border-primary/20">
                {t('map.you_are_here')}
              </Popup>
            </Marker>
          )}

          {distributedReports.map((report) => {
              const hazType = hazardTypes.find(h => h.id === report.type);
              
              const markerPos: [number, number] = [
                report.displayLat || report.latitude,
                report.displayLon || report.longitude
              ];

              // Lazy fetch location name if missing
              if (!report.locationName) {
                reverseGeocode(report.latitude, report.longitude).then(name => {
                  updateReport(report.id, { locationName: name || 'ZoneInconnue' });
                });
              }

              const timeStr = formatTimeAgo(report.timestamp, language);
              const isVeryRecent = Date.now() - report.timestamp < 15 * 60000;
              return (
              <Marker key={report.id} position={markerPos} icon={getIconForHazard(hazType)}>
                <Tooltip permanent direction="top" offset={[0, -20]} className="custom-driver-tooltip">
                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-black uppercase tracking-tighter text-primary">
                        {hazType ? (language === 'en' ? hazType.label_en : hazType.label_fr) : t(`report.${report.type}`)}
                      </span>
                      {isVeryRecent && <span className="flex size-2 rounded-full bg-green-500 animate-pulse"></span>}
                    </div>
                    {(report.locationName || report.customLocation) && (
                      <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-1.5 rounded-sm border border-amber-200/50 mb-0.5 animate-bounce-subtle">
                        "{report.locationName || report.customLocation}"
                      </span>
                    )}
                    <span className="text-[9px] font-black text-gray-500 bg-gray-100/50 px-1 rounded">
                      {timeStr} • <span className="text-primary italic">{report.reporterName || 'GST'}</span>
                    </span>
                    {report.customLocation && report.locationName && (
                      <span className="text-[10px] font-bold text-gray-600 truncate max-w-[120px] mt-0.5">
                        {report.customLocation}
                      </span>
                    )}
                  </div>
                </Tooltip>
                <Popup className="premium-glass-popup">
                  <div className="font-bold text-[var(--color-app-text)] capitalize text-base">
                    {hazType ? (language === 'en' ? hazType.label_en : hazType.label_fr) : t(`report.${report.type}`)}
                  </div>
                  <div className="flex items-center gap-2 mt-1 mb-3">
                    <div className="text-sm font-bold text-primary">{timeStr}</div>
                    <div className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold uppercase">
                      {report.reporterName || 'GST'} • {report.reporterLevel || 'Novice'}
                    </div>
                  </div>
                  
                  <div className="text-xs text-[var(--color-app-text-muted)] border-b border-primary/10 pb-3 mb-3">
                    {report.locationName || t('map.reported_locally')}
                  </div>

                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-app-text-muted)] text-center">
                      {language === 'en' ? 'IS IT STILL THERE?' : 'EST-CE TOUJOURS LÀ ?'}
                    </p>
                    {authUser ? (
                      <div className={`flex gap-2 ${shakeId === report.id ? 'animate-shake' : ''}`}>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleVote(report.id, 'up');
                          }}
                          className={`flex-1 font-bold py-2 rounded-lg text-xs transition-all flex items-center justify-center gap-1 border ${
                            userVotes[report.id] === 'up'
                              ? 'bg-green-500 text-white border-green-600 shadow-md active-vote-pulse'
                              : 'bg-green-500/10 hover:bg-green-500/20 text-green-600 border-green-500/20'
                          }`}
                        >
                          👍 {language === 'en' ? 'YES' : 'OUI'} ({report.upvotes})
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleVote(report.id, 'down');
                          }}
                          className={`flex-1 font-bold py-2 rounded-lg text-xs transition-all flex items-center justify-center gap-1 border ${
                            userVotes[report.id] === 'down'
                              ? 'bg-red-500 text-white border-red-600 shadow-md active-vote-pulse'
                              : 'bg-red-500/10 hover:bg-red-500/20 text-red-600 border-red-500/20'
                          }`}
                        >
                          👎 {language === 'en' ? 'NO' : 'NON'} ({report.downvotes})
                        </button>
                      </div>
                    ) : (
                      <div 
                        onClick={() => handleVote(report.id, 'up')} // Trigger redirect/shake
                        className={`text-center py-2 px-3 rounded-lg bg-primary/5 border border-primary/10 cursor-pointer hover:bg-primary/10 transition-colors ${shakeId === report.id ? 'animate-shake' : ''}`}
                      >
                        <p className="text-[10px] text-primary font-bold">
                          {language === 'en' ? 'LOG IN TO VOTE' : 'CONNECTEZ-VOUS POUR VOTER'}
                        </p>
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
              );
            })
          }
        </MapContainer>

        {/* Floating Map Controls - Increased tap targets for drivers */}
        <div className="absolute right-4 md:right-6 top-24 z-[1000] flex flex-col gap-3">
          <button 
            onClick={handleRecenter}
            disabled={isLocating}
            className="flex size-14 items-center justify-center rounded-2xl bg-[var(--color-app-surface)]/90 backdrop-blur-md border border-[var(--color-app-border)] text-primary shadow-xl hover:bg-primary/10 transition-colors disabled:opacity-50"
          >
            {isLocating ? <div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div> : <Navigation size={28} />}
          </button>
        </div>

        {/* Speed Indicator - Enlarged for driving */}
        <div className="absolute left-4 md:left-6 top-24 z-[1000]">
          <div className="flex flex-col items-center justify-center size-20 rounded-full bg-[var(--color-app-surface)]/90 backdrop-blur-md border-4 border-primary shadow-xl">
            <span className="text-3xl font-black text-[var(--color-app-text)] leading-none">{speed}</span>
            <span className="text-[11px] font-bold text-[var(--color-app-text-muted)] uppercase mt-1">km/h</span>
          </div>
        </div>

        {/* Bottom Sheet / Search Overlay */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-2xl z-[1000] px-4 pb-6 space-y-4 pointer-events-none">
          {/* Filter Pills */}
          <div 
            ref={scrollRef}
            className={`flex gap-2 overflow-x-auto pb-2 pointer-events-auto select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
          >
            <style jsx>{`
              div::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            {hazardTypes.map(ht => {
              const isActive = activeFilters.includes(ht.id);
              return (
                <div 
                  key={ht.id}
                  onClick={() => toggleFilter(ht.id)}
                  style={{ 
                    backgroundColor: isActive ? ht.color : undefined,
                    borderColor: isActive ? ht.color : `${ht.color}40`, // 40 is ~25% opacity hex
                  }}
                  className={`flex h-12 shrink-0 items-center justify-center gap-x-2 rounded-full px-5 shadow-lg font-medium text-base transition-all cursor-pointer ${
                    isActive 
                      ? 'text-white scale-[1.03] shadow-black/30 border-2' 
                      : 'bg-[var(--color-app-surface)] text-[var(--color-app-text)] border-2 border-[var(--color-app-border)] opacity-90'
                  }`}
                >
                  {getHazardIconComponent(ht.icon_name)}
                  <span>{language === 'en' ? ht.label_en : ht.label_fr}</span>
                </div>
              );
            })}
          </div>

          {/* Search Bar - Larger and themed */}
          <div className="bg-[var(--color-app-surface)]/95 backdrop-blur-lg rounded-2xl border border-[var(--color-app-border)] p-2 shadow-2xl pointer-events-auto">
            <Link href="/plan" className="flex items-center h-14 px-4 gap-3 cursor-text">
              <Search size={24} className="text-primary" />
              <div className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-[var(--color-app-text-muted)] font-display text-left text-lg">{t('map.search')}</div>
              <Mic size={24} className="text-[var(--color-app-text-muted)]" />
            </Link>
          </div>

          {/* Floating Action Button - Driver Optimized Size */}
          <div className="flex justify-center pointer-events-auto mt-2">
            <Link href={authUser ? "/report" : "/auth"} className="flex h-16 items-center justify-center gap-3 rounded-full bg-primary px-10 text-white shadow-2xl shadow-primary/40 hover:scale-105 transition-transform">
              <PlusCircle size={28} className="font-extrabold" />
              <span className="font-extrabold tracking-wide uppercase text-base">{t('map.report_btn')}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMenuOpen && (
        <div className="absolute inset-0 z-[2000] flex md:hidden">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsMenuOpen(false)}
          />
          <div className="relative w-80 h-full bg-[var(--color-app-bg)] border-r border-[var(--color-app-border)] flex flex-col p-6 shadow-2xl animate-in slide-in-from-left duration-300">
            <div className="flex items-center justify-between mb-10">
              <span className="text-3xl font-black text-primary tracking-tight">Mboa Radar</span>
              <button onClick={() => setIsMenuOpen(false)} className="text-[var(--color-app-text-muted)] hover:text-primary transition-colors bg-[var(--color-app-surface)] p-3 rounded-full">
                <X size={24} />
              </button>
            </div>
            
            <div className="flex flex-col gap-3">
              {authUser && (
                <Link href="/profile" className="flex items-center gap-4 text-[var(--color-app-text)] hover:text-primary p-4 rounded-xl hover:bg-primary/10 transition-colors font-medium text-lg">
                  <User size={26} className="text-primary" />
                  <span>{t('nav.profile')}</span>
                </Link>
              )}
              <div 
                onClick={() => { setIsNotificationPanelOpen(true); setIsMenuOpen(false); }}
                className="flex items-center gap-4 text-[var(--color-app-text)] hover:text-primary p-4 rounded-xl hover:bg-primary/10 transition-colors cursor-pointer font-medium text-lg"
              >
                <Bell size={26} className="text-primary" />
                <span>{t('nav.alerts') || 'Alerts'}</span>
              </div>
              {authUser && (
                <Link href="/stats" className="flex items-center gap-4 text-[var(--color-app-text)] hover:text-primary p-4 rounded-xl hover:bg-primary/10 transition-colors font-medium text-lg">
                  <BarChart2 size={26} className="text-primary" />
                  <span>{t('nav.stats')}</span>
                </Link>
              )}
              
              <div className="h-px bg-[var(--color-app-border)] my-4 mx-2"></div>

              <div 
                onClick={() => { toggleLanguage(); setIsMenuOpen(false); }}
                className="flex items-center gap-4 text-[var(--color-app-text-muted)] hover:text-primary p-4 rounded-xl hover:bg-[var(--color-app-surface)] cursor-pointer transition-colors font-medium text-lg"
              >
                <Globe size={26} className="text-[var(--color-app-text-muted)]" />
                <span>{language === 'en' ? 'Passer en Français' : 'Switch to English'}</span>
              </div>
            </div>
            
            <div className="mt-auto flex flex-col items-center">
              <p className="text-xs font-medium text-[var(--color-app-text-muted)] text-center">CamRoute - Mboa Radar v1.0.0</p>
              <p className="text-[10px] text-[var(--color-app-text-muted)] mt-1">&copy; {new Date().getFullYear()} Mboa Technologies</p>
            </div>
          </div>
        </div>
      )}

      {/* Safety Hub / Notification Panel */}
      {isNotificationPanelOpen && (
        <div className="absolute inset-0 z-[3000] flex justify-end">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity" 
            onClick={() => setIsNotificationPanelOpen(false)}
          />
          <div className="relative w-full max-w-md h-full bg-[var(--color-app-surface)] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 pointer-events-auto">
            <div className="flex items-center justify-between p-6 border-b border-primary/10">
              <div className="flex items-center gap-2">
                <Bell size={24} className="text-primary" />
                <h2 className="text-xl font-black text-primary">Safety Hub</h2>
              </div>
              <button 
                onClick={() => setIsNotificationPanelOpen(false)}
                className="text-[var(--color-app-text-muted)] hover:text-primary transition-colors bg-[var(--color-app-bg)] p-2 rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-[var(--color-app-text-muted)] space-y-2 opacity-60">
                  <ShieldAlert size={48} className="text-gray-300" />
                  <p className="font-bold text-sm uppercase tracking-widest">{t('map.all_clear') || 'Route Clear'}</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div 
                    key={notif.id}
                    className={`p-4 rounded-xl border transition-all ${
                      notif.isRead 
                        ? 'bg-[var(--color-app-bg)]/50 border-[var(--color-app-border)] opacity-70' 
                        : 'bg-primary/5 border-primary/20 shadow-sm'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-black text-xs uppercase tracking-tighter text-primary">{notif.title}</span>
                      <span className="text-[10px] text-[var(--color-app-text-muted)] font-bold">{formatTimeAgo(notif.timestamp, language)}</span>
                    </div>
                    <p className="text-sm font-medium text-[var(--color-app-text)]">{notif.message}</p>
                  </div>
                ))
              )}
            </div>

            {notifications.some(n => !n.isRead) && (
              <div className="p-4 bg-[var(--color-app-bg)]/50 border-t border-primary/10">
                <button 
                  onClick={handleMarkAllRead}
                  className="w-full py-3 rounded-xl bg-primary text-white font-black uppercase text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform active:scale-95"
                >
                  {language === 'en' ? 'Clear All Alerts' : 'Tout marquer comme lu'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
