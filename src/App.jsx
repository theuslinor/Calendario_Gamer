// ==========================================
// PARTE 1: IMPORTS E CONFIGURAÇÕES
// ==========================================
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { 
  format, addMonths, subMonths, startOfMonth, endOfMonth, 
  startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, 
  isToday, parseISO, isSameMonth, isAfter, subDays
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Gamepad2, Clapperboard, 
  Tv, Heart, Flame, X, Share2, CalendarPlus, Clock, Zap, TrendingUp, Star, CheckCircle2, ChevronRightCircle, Search
} from 'lucide-react';

import dataReleases from './data/releases.json';

// ASSETS: ÍCONES DE PLATAFORMA
import psIco from './assets/ico/playstation-ico.png';
import xboxIco from './assets/ico/xbox_ico.png';
import switchIco from './assets/ico/switch_ico.png';
import pcIco from './assets/ico/pc_ico.png';
import iosIco from './assets/ico/ios_ico.png';
import androidIco from './assets/ico/android_ico.png';

const HYPE_WEIGHT = { altissimo: 3, alto: 2, normal: 1 };

const PLATFORM_ICONS = {
  "PS5": psIco, "PlayStation 5": psIco, "PS4": psIco,
  "Xbox Series X|S": xboxIco, "Xbox Series": xboxIco, "Xbox": xboxIco, "Xbox One": xboxIco,
  "Nintendo Switch 2": switchIco, "Switch 2": switchIco, "Nintendo Switch": switchIco, "Switch": switchIco,
  "PC": pcIco, "Steam": pcIco, "Windows": pcIco,
  "iOS": iosIco, "Android": androidIco
};

// --- HOOK: CONTAGEM REGRESSIVA ---
function useCountdown(targetDate) {
  const calculateTimeLeft = () => {
    if (!targetDate) return null;
    const difference = +new Date(targetDate) - +new Date();
    if (difference > 0) {
      return {
        anos: Math.floor(difference / (1000 * 60 * 60 * 24 * 365.25)),
        dias: Math.floor((difference / (1000 * 60 * 60 * 24)) % 365.25),
        horas: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutos: Math.floor((difference / 1000 / 60) % 60),
        segundos: Math.floor((difference / 1000) % 60),
      };
    }
    return null;
  };
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());
  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, [targetDate]);
  return timeLeft;
}

// ==========================================
// PARTE 2: COMPONENTE PRINCIPAL
// ==========================================

const calendarVariants = {
  enter: (direction) => ({ x: direction > 0 ? 300 : -300, opacity: 0, scale: 0.95 }),
  center: { zIndex: 1, x: 0, opacity: 1, scale: 1 },
  exit: (direction) => ({ zIndex: 0, x: direction < 0 ? 300 : -300, opacity: 0, scale: 0.95 })
};

export default function App() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewDate, setViewDate] = useState(new Date()); 
  const [[page, direction], setPage] = useState([0, 0]);
  
  const [headerVisible, setHeaderVisible] = useState(true);
  const [diaSelecionado, setDiaSelecionado] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { scrollY } = useScroll();
  const searchRef = useRef(null);

  const [isDragging, setIsDragging] = useState(false);
  const hypeCarouselRef = useRef(null);
  const [hypeConstraints, setHypeConstraints] = useState(0);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setIsSearchOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious();
    if (latest > previous && latest > 50) setHeaderVisible(false);
    else setHeaderVisible(true);
  });

  const releases = useMemo(() => Array.isArray(dataReleases) ? dataReleases : [], []);
  const idSelecionado = searchParams.get('id');

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const agora = new Date();
    return releases
      .filter(item => item.titulo?.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => {
        const hA = HYPE_WEIGHT[a.hype] || 0;
        const hB = HYPE_WEIGHT[b.hype] || 0;
        if (hB !== hA) return hB - hA;
        const dA = a.data ? parseISO(a.data) : null;
        const dB = b.data ? parseISO(b.data) : null;
        const isFuturoA = dA && (isAfter(dA, agora) || isSameDay(dA, agora)) ? 1 : 0;
        const isFuturoB = dB && (isAfter(dB, agora) || isSameDay(dB, agora)) ? 1 : 0;
        if (isFuturoB !== isFuturoA) return isFuturoB - isFuturoA;
        if (isFuturoA && isFuturoB) return dA - dB;
        return 0;
      })
      .slice(0, 10);
  }, [searchQuery, releases]);

  const paginate = (newDirection) => {
    setPage([page + newDirection, newDirection]);
    if (newDirection === 1) setViewDate(addMonths(viewDate, 1));
    else setViewDate(subMonths(viewDate, 1));
  };

  const handleSelectGame = (item) => {
    if (isDragging) return;
    if (item.data) {
        const itemDate = parseISO(item.data);
        const dir = isAfter(itemDate, viewDate) ? 1 : -1;
        setPage([page + dir, dir]);
        setViewDate(itemDate);
    }
    setSearchParams({ id: item.id });
    setSearchQuery('');
    setIsSearchOpen(false);
    setDiaSelecionado(null);
  };

  const diasDoCalendario = useMemo(() => {
    const inicioMes = startOfMonth(viewDate);
    const dias = eachDayOfInterval({ 
      start: startOfWeek(inicioMes, { weekStartsOn: 0 }), 
      end: endOfWeek(endOfMonth(inicioMes), { weekStartsOn: 0 }) 
    });
    return isMobile ? dias.filter(d => d.getDay() !== 0 && d.getDay() !== 6) : dias;
  }, [viewDate, isMobile]);

  const proximosLancamentos = useMemo(() => {
    const hoje = new Date();
    return releases
      .filter(i => i.data && i.titulo && isAfter(parseISO(i.data), hoje))
      .sort((a, b) => new Date(a.data) - new Date(b.data))
      .slice(0, 12);
  }, [releases]);

  const maisHypadosFuturos = useMemo(() => {
    const hoje = subDays(new Date(), 1);
    return releases
      .filter(i => i.hype === 'altissimo' && i.data && i.titulo && isAfter(parseISO(i.data), hoje))
      .sort((a, b) => new Date(a.data) - new Date(b.data));
  }, [releases]);

  useEffect(() => {
    if (hypeCarouselRef.current) {
      setHypeConstraints(hypeCarouselRef.current.scrollWidth - hypeCarouselRef.current.offsetWidth);
    }
  }, [maisHypadosFuturos, isMobile]);

  const jogosSemDataSorted = useMemo(() => {
    return releases
      .filter(i => !i.data && i.titulo)
      .sort((a, b) => (HYPE_WEIGHT[b.hype] || 0) - (HYPE_WEIGHT[a.hype] || 0));
  }, [releases]);

  const itemParaModal = useMemo(() => releases.find(i => i.id === idSelecionado), [idSelecionado, releases]);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-50 font-sans selection:bg-cyan-500/30 overflow-x-hidden">
      
      {/* HEADER CENTRALIZADO (SEM SETAS) */}
      <motion.header 
        variants={{ visible: { y: 0 }, hidden: { y: "-100%" } }}
        animate={headerVisible ? "visible" : "hidden"}
        className="fixed top-0 w-full z-50 p-4 md:p-6 border-b border-white/5 bg-slate-900/80 backdrop-blur-xl h-20 md:h-24 flex items-center"
      >
        <div className="max-w-[1800px] mx-auto w-full flex flex-row items-center justify-center gap-4 md:gap-12 lg:gap-16">
          <h1 className="hidden md:block text-[10px] md:text-xs font-black italic tracking-tighter text-cyan-500 uppercase shrink-0">Radar</h1>
          
          <div className="flex items-center gap-1 md:gap-4 bg-black/20 px-6 py-2 rounded-xl border border-white/5 shrink-0 shadow-inner">
             <h2 className="text-[10px] md:text-lg font-black uppercase italic tracking-tighter text-center whitespace-nowrap">{format(viewDate, 'MMMM yyyy', { locale: ptBR })}</h2>
          </div>

          <div className="relative flex-[0.8] max-w-md" ref={searchRef}>
            <div className="relative flex items-center bg-black/40 rounded-xl border border-white/10 px-3 md:px-4 py-1.5 group focus-within:border-cyan-500/50 transition-all shadow-inner">
              <Search size={14} className="text-slate-500 group-focus-within:text-cyan-400 shrink-0" />
              <input type="text" placeholder="Buscar..." className="bg-transparent border-none outline-none w-full ml-2 md:ml-3 text-[10px] md:text-sm font-bold placeholder:text-slate-700 py-0" value={searchQuery} onFocus={() => setIsSearchOpen(true)} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <AnimatePresence>
              {isSearchOpen && searchResults.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute top-full left-0 w-full mt-2 bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[100] backdrop-blur-2xl">
                  {searchResults.map(item => {
                    const hSearchStyles = { altissimo: "border-orange-500/20 bg-orange-500/5 text-orange-400 hover:bg-orange-500/10", alto: "border-cyan-500/20 bg-cyan-500/5 text-cyan-400 hover:bg-cyan-500/10", normal: "border-white/5 bg-transparent text-slate-300 hover:bg-white/5" };
                    return (
                      <button key={item.id} onClick={() => handleSelectGame(item)} className={`w-full flex items-center justify-between p-4 transition-all border-b last:border-0 ${hSearchStyles[item.hype] || hSearchStyles.normal}`}>
                        <div className="flex flex-col items-start gap-1 text-left">
                          <span className="font-black text-xs uppercase italic tracking-tight flex items-center gap-2">{item.titulo} {item.hype === 'altissimo' && <Flame size={10} className="text-orange-500 animate-pulse" />}</span>
                          <div className="flex gap-1">{item.plataformas?.map(p => PLATFORM_ICONS[p] && <img key={p} src={PLATFORM_ICONS[p]} alt={p} className="h-2.5 w-2.5 opacity-40" />)}<span className="text-[7px] font-black text-slate-500 uppercase tracking-widest ml-1 self-center">{item.data ? format(parseISO(item.data), "dd MMM yyyy") : "TBA"}</span></div>
                        </div>
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button onClick={() => { setPage([0, isAfter(new Date(), viewDate) ? 1 : -1]); setViewDate(new Date()); }} className="text-[8px] md:text-[9px] font-black bg-cyan-500/10 text-cyan-400 px-3 md:px-5 py-2 md:py-2.5 rounded-xl border border-cyan-500/20 active:bg-cyan-500 transition-colors uppercase tracking-widest shrink-0 shadow-lg text-center whitespace-nowrap">Hoje</button>
        </div>
      </motion.header>

      {/* DASHBOARD PRINCIPAL */}
      <div className="pt-24 md:pt-32 max-w-[1800px] mx-auto p-3 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] xl:grid-cols-[1fr_400px] gap-6 md:gap-12 items-start relative">
          
          <section className="flex flex-col w-full max-w-5xl mx-auto overflow-visible relative">
            <div className={`grid ${isMobile ? 'grid-cols-5' : 'grid-cols-7'} mb-3 shrink-0`}>
              {(isMobile ? ['SEG', 'TER', 'QUA', 'QUI', 'SEX'] : ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB']).map(dia => (
                <div key={dia} className="text-center text-[8px] md:text-[10px] font-black text-slate-600 tracking-widest">{dia}</div>
              ))}
            </div>

            <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900/40 shadow-2xl border-l border-t border-white/5 w-full">
              <AnimatePresence initial={false} custom={direction} mode="popLayout">
                <motion.div 
                  key={viewDate.getMonth() + "-" + viewDate.getFullYear()}
                  custom={direction}
                  variants={isMobile ? calendarVariants : { center: { x: 0, opacity: 1, scale: 1 } }}
                  initial={isMobile ? "enter" : "center"}
                  animate="center"
                  exit={isMobile ? "exit" : "center"}
                  transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.1 } }}
                  drag={isMobile ? "x" : false}
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={1}
                  onDragEnd={(e, { offset }) => {
                      const swipe = Math.abs(offset.x) > 50;
                      if (swipe && offset.x > 0) paginate(-1);
                      else if (swipe && offset.x < 0) paginate(1);
                  }}
                  className={`grid ${isMobile ? 'grid-cols-5' : 'grid-cols-7'} w-full touch-none`}
                >
                  {diasDoCalendario.map((dia, index) => {
                    const itensDoDia = releases.filter(item => item.data && isSameDay(parseISO(item.data), dia)).sort((a, b) => (HYPE_WEIGHT[b.hype] || 0) - (HYPE_WEIGHT[a.hype] || 0));
                    const foraDoMes = !isSameMonth(dia, viewDate);
                    const hoje = isToday(dia);
                    return (
                      <div key={index} onClick={() => itensDoDia.length > 0 && setDiaSelecionado(dia)} className={`min-h-[95px] md:min-h-[105px] p-1.5 md:p-3 border-r border-b border-white/5 relative cursor-pointer transition-all ${foraDoMes ? 'opacity-10' : ''} ${hoje ? 'bg-cyan-500/5 ring-1 ring-inset ring-cyan-500/50 z-10' : ''}`}>
                        <span className={`text-[10px] md:text-[14px] font-black mb-1 block ${hoje ? 'text-cyan-400' : 'text-slate-700'}`}>{format(dia, 'd')}</span>
                        <div className="space-y-1">
                          {itensDoDia.slice(0, 3).map(item => {
                             const hStyles = { altissimo: "bg-orange-600 text-white border-orange-400", alto: "bg-cyan-500/20 text-cyan-400 border-cyan-500/40", normal: "bg-white/5 text-slate-400 border-transparent" };
                             return <div key={item.id} className={`px-1.5 py-0.5 rounded-[4px] text-[8px] md:text-[11px] font-black truncate border ${hStyles[item.hype] || hStyles.normal}`}>{item.titulo}</div>
                          })}
                          {itensDoDia.length > 3 && <div className="text-[7px] md:text-[10px] font-black text-cyan-500 ml-1 mt-1 flex items-center gap-1"><ChevronRightCircle size={10} /> {itensDoDia.length - 3} mais</div>}
                        </div>
                      </div>
                    );
                  })}
                </motion.div>
              </AnimatePresence>
            </div>
          </section>

          <aside className="lg:sticky lg:top-32 flex flex-col w-full lg:max-h-[550px]">
             <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] flex items-center gap-2 px-1 mb-6"><TrendingUp size={14} className="text-cyan-500" /> Em Breve</h3>
             <div className="flex md:flex-col overflow-x-auto md:overflow-y-auto gap-2 pb-4 no-scrollbar lg:pr-2 snap-x">
                {proximosLancamentos.map(item => {
                  const hSideStyles = { altissimo: "border-orange-500/40 bg-orange-500/5 hover:border-orange-500 shadow-xl", alto: "border-cyan-500/40 bg-cyan-500/5 hover:border-cyan-500 shadow-xl", normal: "border-white/5 bg-white/5 hover:border-white/20" };
                  return (
                    <button key={item.id} onClick={() => handleSelectGame(item)} className={`min-w-[220px] md:min-w-0 w-full text-left p-4 md:p-5 rounded-[1.2rem] md:rounded-[1.8rem] border transition-all group shrink-0 snap-center ${hSideStyles[item.hype] || hSideStyles.normal}`}>
                       <div className="flex justify-between items-start mb-1"><span className={`text-[8px] md:text-[10px] font-black tracking-widest ${item.hype === 'normal' ? 'text-slate-500' : 'text-cyan-500'}`}>{format(parseISO(item.data), "dd MMM")}</span>{item.hype === 'altissimo' && <Flame size={12} className="text-orange-500 animate-pulse" />}</div>
                       <h4 className={`text-[12px] md:text-sm font-black uppercase italic tracking-tighter group-hover:text-cyan-400 truncate leading-tight mb-3`}>{item.titulo}</h4>
                       <div className="flex gap-1.5 flex-wrap">{item.plataformas?.map(p => PLATFORM_ICONS[p] && <img key={p} src={PLATFORM_ICONS[p]} alt={p} className="h-3 w-3 opacity-40 grayscale group-hover:grayscale-0 transition-all" />)}</div>
                    </button>
                  );
                })}
             </div>
          </aside>
        </div>
      </div>

      {/* RODAPÉ */}
      <div className="max-w-[1800px] mx-auto px-4 md:px-8 mt-12 space-y-24 pb-20 text-center">
        <section className="overflow-hidden">
          <h3 className="text-[10px] font-black text-orange-500 uppercase tracking-[0.6em] mb-8 flex items-center justify-center gap-3 px-1"><Zap size={16} fill="currentColor" /> Radar de Hype Futurista</h3>
          <div ref={hypeCarouselRef} className="cursor-grab active:cursor-grabbing overflow-hidden px-1">
            <motion.div 
              drag="x"
              dragConstraints={{ right: 0, left: -hypeConstraints }}
              onDragStart={() => setIsDragging(true)}
              onDragEnd={() => setTimeout(() => setIsDragging(false), 50)}
              className="flex gap-4 md:gap-6 w-max"
            >
               {maisHypadosFuturos.map(item => (
                 <button key={item.id} onClick={() => handleSelectGame(item)} className="min-w-[280px] md:min-w-[350px] p-8 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] bg-gradient-to-br from-orange-600/20 via-orange-950/10 to-transparent border border-orange-500/20 text-left shadow-2xl group transition-all">
                    <div className="bg-orange-500/20 p-3 rounded-2xl w-fit mb-6 text-orange-500"><Star size={24} fill="currentColor" /></div>
                    <h4 className="text-xl md:text-3xl font-black uppercase italic tracking-tighter mb-4 group-hover:text-orange-400">{item.titulo}</h4>
                    <div className="flex gap-2 mb-4">{item.plataformas?.map(p => PLATFORM_ICONS[p] && <img key={p} src={PLATFORM_ICONS[p]} alt={p} className="h-4 w-4 opacity-60" />)}</div>
                    <p className="text-[10px] font-black text-orange-500/60 uppercase tracking-[0.2em]">{format(parseISO(item.data), "yyyy")} • {item.tipo}</p>
                 </button>
               ))}
            </motion.div>
          </div>
        </section>
        
        <section>
          <div className="flex items-center gap-4 mb-8 px-1">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.6em] flex items-center gap-3 shrink-0"><Clock size={16} /> Sai quando estiver pronto</h3>
            <div className="h-px w-full bg-white/5"></div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-3 md:gap-6">
            {jogosSemDataSorted.map(item => {
              const hTbaStyles = { altissimo: "bg-orange-600/10 border-orange-500/30 text-orange-400 hover:bg-orange-600/20 hover:border-orange-500", alto: "bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 hover:border-cyan-500", normal: "bg-white/5 border-white/10 text-slate-500 hover:bg-white/10 hover:text-white" };
              return (
                <button key={item.id} onClick={() => setSearchParams({ id: item.id })} className={`group border p-5 rounded-[1.5rem] md:rounded-[2.5rem] transition-all uppercase text-center leading-tight hover:scale-[1.03] ${hTbaStyles[item.hype] || hTbaStyles.normal}`}>
                  <div className="font-black text-[12px] md:text-[14px] mb-3">{item.titulo}</div>
                  <div className="flex justify-center gap-1.5 opacity-30 group-hover:opacity-100 transition-opacity">{item.plataformas?.map(p => PLATFORM_ICONS[p] && <img key={p} src={PLATFORM_ICONS[p]} alt={p} className="h-3.5 w-3.5 grayscale group-hover:grayscale-0 transition-all" />)}</div>
                </button>
              );
            })}
          </div>
        </section>
      </div>

      <AnimatePresence>
        {diaSelecionado && <DayGamesModal dia={diaSelecionado} jogos={releases.filter(item => item.data && isSameDay(parseISO(item.data), diaSelecionado)).sort((a,b) => (HYPE_WEIGHT[b.hype] || 0) - (HYPE_WEIGHT[a.hype] || 0))} onClose={() => setDiaSelecionado(null)} onSelectGame={(item) => handleSelectGame(item)} />}
      </AnimatePresence>
      <AnimatePresence>
        {itemParaModal && <LaunchModal item={itemParaModal} onClose={() => setSearchParams({})} />}
      </AnimatePresence>
    </div>
  );
}

// ==========================================
// PARTE 3: SUB-COMPONENTES
// ==========================================

function DayGamesModal({ dia, jogos, onClose, onSelectGame }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/95 backdrop-blur-xl" />
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-md bg-[#0f172a] border border-white/10 rounded-[3rem] p-8 shadow-3xl">
        <div className="flex justify-between items-center mb-8 text-cyan-500 font-black text-[10px] uppercase tracking-[0.3em]">{format(dia, "dd 'de' MMMM", { locale: ptBR })}<button onClick={onClose} className="p-2 bg-white/5 rounded-xl text-slate-500 hover:text-white transition-all"><X size={22} /></button></div>
        <div className="space-y-3 max-h-[60vh] overflow-y-auto no-scrollbar">{jogos.map(item => (
          <button key={item.id} onClick={() => onSelectGame(item)} className={`w-full flex items-center justify-between p-5 rounded-2xl border border-white/5 bg-white/5 transition-all hover:border-cyan-500/30 group`}><div className="flex flex-col items-start gap-1 text-left"><span className="font-black uppercase italic text-sm tracking-tight">{item.titulo}</span><div className="flex gap-1">{item.plataformas?.map(p => PLATFORM_ICONS[p] && <img key={p} src={PLATFORM_ICONS[p]} alt={p} className="h-2.5 w-2.5 opacity-50" />)}</div></div><ChevronRightCircle size={18} className="text-cyan-500" /></button>
        ))}</div>
      </motion.div>
    </div>
  );
}

function LaunchModal({ item, onClose }) {
  const tempo = useCountdown(item.data);
  const agora = new Date();
  const gameDate = item.data ? parseISO(item.data) : null;
  const isLancado = gameDate && (isAfter(agora, gameDate) || isSameDay(agora, gameDate));
  const temData = !!item.data;
  const hColor = item.hype === 'altissimo' ? 'rgba(249, 115, 22, 0.15)' : item.hype === 'alto' ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255, 255, 255, 0.05)';
  const aColor = item.hype === 'altissimo' ? 'text-orange-500' : item.hype === 'alto' ? 'text-cyan-400' : 'text-slate-400';
  useEffect(() => { document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = 'unset'; }; }, []);
  return (
    <div className="fixed inset-0 z-[80] flex items-end md:items-center justify-center p-0 md:p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/95 backdrop-blur-md" />
      <motion.div initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }} transition={{ type: "spring", damping: 30, stiffness: 300 }} className="relative w-full max-w-sm bg-[#0f172a]/95 border border-white/10 rounded-t-[2.5rem] md:rounded-[3rem] p-6 md:p-8 shadow-2xl overflow-hidden backdrop-blur-3xl" style={{ boxShadow: `0 0 60px ${hColor}` }}>
        <div className="absolute -top-24 -left-24 w-48 h-48 blur-[80px] rounded-full pointer-events-none opacity-50" style={{ backgroundColor: hColor }} />
        <div className="w-10 h-1 bg-white/10 rounded-full mx-auto mb-6 md:hidden" />
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-6"><div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.2em] border border-white/5 bg-white/5 ${aColor}`}>{item.hype === 'altissimo' && <Flame size={10} fill="currentColor" />} {item.hype} Hype</div><button onClick={onClose} className="p-2 bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all"><X size={20} /></button></div>
          <h2 className="text-2xl md:text-4xl font-black uppercase italic tracking-tighter mb-2 leading-tight bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent">{item.titulo}</h2>
          <p className="text-cyan-500 font-black tracking-[0.4em] uppercase text-[9px] mb-6 flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />{temData ? format(gameDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : "Sai quando estiver pronto"}</p>
          <div className="flex flex-wrap gap-2 mb-8">{item.plataformas?.map(p => ( <div key={p} className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-xl border border-white/5"> {PLATFORM_ICONS[p] && <img src={PLATFORM_ICONS[p]} alt={p} className="h-3.5 w-3.5" />} <span className="text-[9px] font-black text-slate-300 uppercase">{p}</span> </div> ))}</div>
          <div className="mb-8">{temData && !isLancado ? ( <div className="grid grid-cols-5 gap-2"> <DetailTime label="Anos" val={tempo?.anos} /> <DetailTime label="Dias" val={tempo?.dias} /> <DetailTime label="Hrs" val={tempo?.horas} /> <DetailTime label="Min" val={tempo?.minutos} /> <DetailTime label="Seg" val={tempo?.segundos} /> </div> ) : isLancado ? ( <div className="py-8 text-center bg-green-500/10 rounded-[2rem] border border-green-500/20 shadow-inner flex flex-col items-center gap-2"> <CheckCircle2 size={32} className="text-green-500" /> <div className="font-black text-green-500 uppercase tracking-[0.4em] text-[10px]">Já Disponível</div> </div> ) : ( <div className="py-10 text-center border border-dashed border-white/5 rounded-[2rem] opacity-30 flex flex-col items-center gap-2"> <Clock size={24} /> <div className="font-black uppercase tracking-[0.4em] text-[9px]">Aguardando Data</div> </div> )}</div>
          <div className="flex flex-col gap-2">{!isLancado && temData && ( <button onClick={() => { const dateStr = item.data?.replace(/[-:]/g, '').split('.')[0] + "Z"; window.open(`https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(item.titulo)}&dates=${dateStr}`, '_blank'); }} className={`w-full py-4 rounded-[1.5rem] font-black tracking-[0.2em] text-[10px] uppercase shadow-2xl flex items-center justify-center gap-3 active:scale-95 ${item.hype === 'altissimo' ? 'bg-orange-500 text-white shadow-orange-500/20' : 'bg-white text-black'}`}><CalendarPlus size={18} /> Agenda</button> )} <button onClick={() => navigator.share({ title: item.titulo, url: window.location.href })} className="w-full py-4 rounded-[1.5rem] bg-white/5 border border-white/10 text-white font-black text-[10px] tracking-[0.2em] uppercase flex items-center justify-center gap-3 active:scale-95"><Share2 size={18} /> Compartilhar</button></div>
        </div>
      </motion.div>
    </div>
  );
}

function DetailTime({ label, val }) {
  return (
    <div className="bg-black/30 rounded-2xl p-2.5 md:p-3.5 text-center border border-white/5 shadow-inner backdrop-blur-sm flex flex-col items-center justify-center min-w-0 flex-1 h-full">
      <div className="text-lg md:text-2xl font-black leading-none mb-1.5 text-white tabular-nums w-full text-center flex items-center justify-center">
        {val !== undefined ? String(val).padStart(2, '0') : '--'}
      </div>
      <div className="text-[6px] md:text-[8px] font-black uppercase text-slate-500 tracking-[0.1em] mt-1 w-full text-center">
        {label}
      </div>
    </div>
  );
}