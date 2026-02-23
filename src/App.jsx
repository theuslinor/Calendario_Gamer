// ==========================================
// PARTE 1: IMPORTS E CONFIGURAÇÕES
// ==========================================
import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { 
  format, addMonths, subMonths, startOfMonth, endOfMonth, 
  startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, 
  isToday, parseISO, isSameMonth, isAfter
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  ChevronLeft, ChevronRight, Gamepad2, Clapperboard, 
  Tv, Heart, Flame, X, Share2, CalendarPlus, Clock, Zap, TrendingUp, Star
} from 'lucide-react';

import dataReleases from './data/releases.json';

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
export default function App() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewDate, setViewDate] = useState(new Date()); 
  const [headerVisible, setHeaderVisible] = useState(true);
  const { scrollY } = useScroll();

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious();
    if (latest > previous && latest > 50) setHeaderVisible(false);
    else setHeaderVisible(true);
  });

  const releases = useMemo(() => Array.isArray(dataReleases) ? dataReleases : [], []);
  const idSelecionado = searchParams.get('id');

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
      .filter(i => i.data && isAfter(parseISO(i.data), hoje))
      .sort((a, b) => new Date(a.data) - new Date(b.data))
      .slice(0, 10);
  }, [releases]);

  const maisHypados = useMemo(() => releases.filter(i => i.hype === 'altissimo'), [releases]);
  const jogosSemData = useMemo(() => releases.filter(i => !i.data), [releases]);
  const itemParaModal = useMemo(() => releases.find(i => i.id === idSelecionado), [idSelecionado, releases]);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-50 font-sans selection:bg-cyan-500/30 overflow-x-hidden">
      
      {/* 🟢 HEADER CENTRALIZADO (MODIFICADO) */}
      <motion.header 
        variants={{ visible: { y: 0 }, hidden: { y: "-100%" } }}
        animate={headerVisible ? "visible" : "hidden"}
        className="fixed top-0 w-full z-50 p-3 md:p-6 border-b border-white/5 bg-slate-900/80 backdrop-blur-xl h-16 md:h-24 flex items-center"
      >
        {/* Usando justify-center e gap responsivo para aproximar os elementos do centro */}
        <div className="max-w-[1400px] mx-auto w-full flex items-center justify-center gap-4 md:gap-16">
          
          <h1 className="text-[10px] md:text-xs font-black italic tracking-tighter text-cyan-500 uppercase shrink-0">
            Radar
          </h1>
          
          <div className="flex items-center gap-1 md:gap-6 bg-black/20 p-1 rounded-xl border border-white/5">
             <button onClick={() => setViewDate(subMonths(viewDate, 1))} className="p-2 hover:bg-white/10 rounded-lg active:scale-90 transition-all"><ChevronLeft size={18} /></button>
             <h2 className="text-[11px] md:text-lg font-black uppercase italic tracking-tighter w-28 md:w-56 text-center">{format(viewDate, 'MMMM yyyy', { locale: ptBR })}</h2>
             <button onClick={() => setViewDate(addMonths(viewDate, 1))} className="p-2 hover:bg-white/10 rounded-lg active:scale-90 transition-all"><ChevronRight size={18} /></button>
          </div>

          <button 
            onClick={() => setViewDate(new Date())} 
            className="text-[9px] font-black bg-cyan-500/10 text-cyan-400 px-4 py-2 rounded-lg border border-cyan-500/20 active:bg-cyan-500 transition-colors uppercase tracking-widest shrink-0"
          >
            Hoje
          </button>
        </div>
      </motion.header>

      {/* DASHBOARD PRINCIPAL */}
      <div className="pt-20 md:pt-32 max-w-[1600px] mx-auto p-3 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-6 md:gap-12 items-start">
          
          {/* COLUNA ESQUERDA: CALENDÁRIO */}
          <section className="flex flex-col w-full">
            <div className={`grid ${isMobile ? 'grid-cols-5' : 'grid-cols-7'} mb-3`}>
              {(isMobile ? ['SEG', 'TER', 'QUA', 'QUI', 'SEX'] : ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB']).map(dia => (
                <div key={dia} className="text-center text-[8px] md:text-[10px] font-black text-slate-600 tracking-widest">{dia}</div>
              ))}
            </div>

            <div className={`grid ${isMobile ? 'grid-cols-5' : 'grid-cols-7'} border-l border-t border-white/5 rounded-[2rem] overflow-hidden bg-slate-900/40 shadow-2xl`}>
              {diasDoCalendario.map((dia, index) => {
                const itensDoDia = releases.filter(item => item.data && isSameDay(parseISO(item.data), dia));
                const foraDoMes = !isSameMonth(dia, viewDate);
                const hoje = isToday(dia);
                return (
                  <div key={index} className={`min-h-[75px] md:min-h-[95px] p-1.5 md:p-3 border-r border-b border-white/5 relative ${foraDoMes ? 'opacity-10' : ''} ${hoje ? 'bg-cyan-500/5 ring-1 ring-inset ring-cyan-500/50' : ''}`}>
                    <span className={`text-[10px] md:text-[12px] font-black mb-1 block ${hoje ? 'text-cyan-400' : 'text-slate-700'}`}>{format(dia, 'd')}</span>
                    <div className="space-y-1">
                      {itensDoDia.map(item => (
                        <button key={item.id} onClick={() => setSearchParams({ id: item.id })} className={`w-full text-left px-1.5 py-0.5 rounded-[4px] text-[7px] md:text-[9px] font-black truncate border transition-all ${item.hype === 'altissimo' ? 'bg-orange-600 text-white border-orange-400 shadow-lg shadow-orange-900/20' : 'bg-white/5 text-slate-400 border-transparent hover:border-white/10'}`}>
                          {item.titulo}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* COLUNA DIREITA: SIDEBAR */}
          <aside className="lg:sticky lg:top-32 flex flex-col w-full lg:max-h-[480px]">
             <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] flex items-center gap-2 px-1 mb-6">
               <TrendingUp size={14} className="text-cyan-500" /> Próximos
             </h3>
             
             <div className="flex md:flex-col overflow-x-auto md:overflow-y-auto gap-2 pb-4 no-scrollbar snap-x lg:pr-2">
                {proximosLancamentos.map(item => (
                  <button key={item.id} onClick={() => setSearchParams({ id: item.id })} className="min-w-[200px] md:min-w-0 w-full text-left p-3 md:p-4 rounded-[1.2rem] md:rounded-[1.8rem] bg-white/5 border border-white/5 hover:border-cyan-500/30 transition-all group shrink-0">
                     <div className="flex justify-between items-start mb-1">
                        <span className="text-[8px] md:text-[9px] font-black text-cyan-500 tracking-widest">{format(parseISO(item.data), "dd MMM")}</span>
                        {item.hype === 'altissimo' && <Flame size={12} className="text-orange-500 animate-pulse" />}
                     </div>
                     <h4 className="text-[10px] md:text-xs font-black uppercase italic tracking-tighter group-hover:text-cyan-400 truncate leading-tight">{item.titulo}</h4>
                  </button>
                ))}
             </div>
          </aside>
        </div>
      </div>

      {/* SEÇÕES DE RODAPÉ */}
      <div className="max-w-[1600px] mx-auto px-4 md:px-8 mt-12 space-y-24 pb-20">
        <section>
          <div className="flex items-center gap-4 mb-8">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.6em] flex items-center gap-3 shrink-0"><Clock size={16} /> Sai quando estiver pronto</h3>
            <div className="h-px w-full bg-white/5"></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 md:gap-4">
            {jogosSemData.map(item => (
              <button key={item.id} onClick={() => setSearchParams({ id: item.id })} className="bg-white/5 border border-white/5 p-4 rounded-2xl text-[9px] md:text-[10px] font-black text-slate-500 active:text-cyan-400 uppercase tracking-tighter text-center truncate">{item.titulo}</button>
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-[10px] font-black text-orange-500 uppercase tracking-[0.6em] mb-8 flex items-center gap-3 px-1"><Zap size={16} fill="currentColor" /> Radar de Hype</h3>
          <div className="flex gap-4 md:gap-6 overflow-x-auto no-scrollbar pb-10 snap-x">
             {maisHypados.map(item => (
               <button key={item.id} onClick={() => setSearchParams({ id: item.id })} className="min-w-[260px] md:min-w-[320px] snap-start p-7 md:p-10 rounded-[2.5rem] md:rounded-[3.5rem] bg-gradient-to-br from-orange-600/20 to-transparent border border-orange-500/20 text-left active:border-orange-500/50 shadow-2xl">
                  <div className="bg-orange-500/20 p-3 rounded-2xl w-fit mb-6 text-orange-500"><Star size={20} fill="currentColor" /></div>
                  <h4 className="text-xl md:text-2xl font-black uppercase italic tracking-tighter leading-tight mb-2 group-hover:text-orange-400">{item.titulo}</h4>
                  <p className="text-[9px] font-black text-orange-500/60 uppercase tracking-[0.2em]">{new Date(item.data).getFullYear()} • {item.tipo}</p>
               </button>
             ))}
          </div>
        </section>
      </div>

      <AnimatePresence>
        {itemParaModal && <LaunchModal item={itemParaModal} onClose={() => setSearchParams({})} />}
      </AnimatePresence>
    </div>
  );
}

// --- MODAL DE DETALHES ---
function LaunchModal({ item, onClose }) {
  const tempo = useCountdown(item.data);
  useEffect(() => { document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = 'unset'; }; }, []);
  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center p-0 md:p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/90 backdrop-blur-md" />
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }} className="relative w-full max-w-sm bg-slate-900 border-t md:border border-white/10 rounded-t-[2.5rem] md:rounded-[3rem] p-7 md:p-10 shadow-2xl overflow-y-auto max-h-[85vh]">
        <div className="w-12 h-1 bg-white/10 rounded-full mx-auto mb-6 md:hidden" />
        <div className="flex justify-between items-center mb-8">
           <div className="px-3 py-1 rounded-full text-[9px] font-black uppercase bg-white/5 text-slate-500 tracking-widest">{item.hype} Hype</div>
           <button onClick={onClose} className="p-3 bg-white/5 rounded-2xl text-slate-400 active:bg-white/10"><X size={20} /></button>
        </div>
        <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter mb-2 leading-none">{item.titulo}</h2>
        <p className="text-cyan-500 font-black tracking-[0.3em] uppercase text-[10px] mb-8">{item.data ? format(parseISO(item.data), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : "TBA"}</p>
        <div className="grid grid-cols-5 gap-1.5 md:gap-2 mb-10">
          <DetailTime label="Anos" val={tempo?.anos} />
          <DetailTime label="Dias" val={tempo?.dias} />
          <DetailTime label="Hrs" val={tempo?.horas} />
          <DetailTime label="Min" val={tempo?.minutos} />
          <DetailTime label="Seg" val={tempo?.segundos} />
        </div>
        <div className="flex flex-col gap-2">
          <button onClick={() => { const dateStr = item.data?.replace(/[-:]/g, '').split('.')[0] + "Z"; window.open(`https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(item.titulo)}&dates=${dateStr}`, '_blank'); }} className="w-full py-5 rounded-[1.5rem] bg-white text-black font-black tracking-widest text-[10px] uppercase shadow-2xl active:bg-cyan-500 active:text-white transition-all">Lembrar na Agenda</button>
          <button onClick={() => navigator.share({ title: item.titulo, url: window.location.href })} className="w-full py-5 rounded-[1.5rem] bg-white/5 border border-white/10 text-white font-black text-[10px] tracking-widest uppercase">Compartilhar</button>
        </div>
      </motion.div>
    </div>
  );
}

function DetailTime({ label, val }) {
  return (
    <div className="bg-white/5 rounded-2xl p-3 md:p-4 text-center border border-white/5 shadow-inner">
      <div className="text-xl md:text-3xl font-black leading-none mb-1 text-white">{val !== undefined ? String(val).padStart(2, '0') : '--'}</div>
      <div className="text-[6px] md:text-[8px] font-black uppercase text-slate-600 tracking-tighter">{label}</div>
    </div>
  );
}