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
  const [viewDate, setViewDate] = useState(new Date(2026, 0, 1));
  const [headerVisible, setHeaderVisible] = useState(true);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious();
    if (latest > previous && latest > 100) setHeaderVisible(false);
    else setHeaderVisible(true);
  });

  const releases = useMemo(() => Array.isArray(dataReleases) ? dataReleases : [], []);
  const idSelecionado = searchParams.get('id');

  const diasDoCalendario = useMemo(() => {
    const inicioMes = startOfMonth(viewDate);
    const fimMes = endOfMonth(inicioMes);
    return eachDayOfInterval({ start: startOfWeek(inicioMes), end: endOfWeek(fimMes) });
  }, [viewDate]);

  const proximosLancamentos = useMemo(() => {
    const hoje = new Date();
    return releases
      .filter(i => i.data && isAfter(parseISO(i.data), hoje))
      .sort((a, b) => new Date(a.data) - new Date(b.data))
      .slice(0, 8);
  }, [releases]);

  const maisHypados = useMemo(() => 
    releases.filter(i => i.hype === 'altissimo' && i.data).slice(0, 8), 
  [releases]);

  const jogosSemData = useMemo(() => releases.filter(i => !i.data), [releases]);
  const itemParaModal = useMemo(() => releases.find(i => i.id === idSelecionado), [idSelecionado, releases]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-cyan-500/30 overflow-x-hidden">
      
      {/* 1. HEADER CENTRALIZADO */}
      <motion.header 
        variants={{ visible: { y: 0 }, hidden: { y: "-100%" } }}
        animate={headerVisible ? "visible" : "hidden"}
        className="p-4 md:p-6 border-b border-white/5 bg-slate-900/80 backdrop-blur-xl sticky top-0 z-40"
      >
        <div className="max-w-[1400px] mx-auto flex items-center justify-center gap-4 md:gap-12 relative">
          
          <h1 className="text-xs font-black italic tracking-tighter text-cyan-500 uppercase shrink-0">
            Release Radar
          </h1>
          
          <div className="flex items-center gap-2 md:gap-6 bg-white/5 p-1 rounded-2xl border border-white/5">
             <button onClick={() => setViewDate(subMonths(viewDate, 1))} className="p-2 hover:bg-white/10 rounded-xl transition-all"><ChevronLeft size={18} /></button>
             <h2 className="text-sm md:text-lg font-black uppercase italic tracking-tighter w-32 md:w-48 text-center">{format(viewDate, 'MMMM yyyy', { locale: ptBR })}</h2>
             <button onClick={() => setViewDate(addMonths(viewDate, 1))} className="p-2 hover:bg-white/10 rounded-xl transition-all"><ChevronRight size={18} /></button>
          </div>

          <button 
            onClick={() => setViewDate(new Date())} 
            className="text-[9px] font-black bg-cyan-500/10 text-cyan-400 px-4 py-2 rounded-xl border border-cyan-500/20 uppercase hover:bg-cyan-500 hover:text-white transition-all shrink-0"
          >
            Hoje
          </button>
        </div>
      </motion.header>

      {/* 2. ÁREA PRINCIPAL (PRIMEIRA DOBRA) */}
      <div className="lg:h-[calc(100vh-90px)] flex flex-col">
        <main className="flex-1 max-w-[1600px] mx-auto w-full p-4 md:p-8 grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8 overflow-hidden">
          
          {/* CALENDÁRIO */}
          <section className="flex flex-col h-full overflow-hidden items-center">
            <div className="w-full max-w-4xl flex flex-col h-full overflow-hidden">
              <div className="grid grid-cols-7 mb-2 shrink-0">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(dia => (
                  <div key={dia} className="text-center text-[9px] font-black text-slate-600 uppercase tracking-widest">{dia}</div>
                ))}
              </div>

              <div className="flex-1 grid grid-cols-7 border-l border-t border-white/5 rounded-3xl overflow-hidden bg-slate-900/20 shadow-2xl">
                {diasDoCalendario.map((dia, index) => {
                  const itensDoDia = releases.filter(item => item.data && isSameDay(parseISO(item.data), dia));
                  const foraDoMes = !isSameMonth(dia, viewDate);
                  const hoje = isToday(dia);

                  return (
                    <div key={index} className={`flex flex-col p-2 border-r border-b border-white/5 transition-all relative ${foraDoMes ? 'bg-slate-950/60 opacity-10' : 'bg-slate-900/20 hover:bg-white/[0.03]'} ${hoje ? 'ring-2 ring-inset ring-cyan-500 bg-cyan-500/5 z-10' : ''}`}>
                      <span className={`text-[10px] font-black mb-1 ${hoje ? 'text-cyan-400' : 'text-slate-700'}`}>{format(dia, 'd')}</span>
                      <div className="flex-1 overflow-y-auto no-scrollbar space-y-1">
                        {itensDoDia.map(item => (
                          <button key={item.id} onClick={() => setSearchParams({ id: item.id })} className={`w-full text-left px-2 py-1 rounded text-[8px] font-black truncate border transition-all ${item.hype === 'altissimo' ? 'bg-orange-600 text-white border-orange-400' : 'bg-white/5 text-slate-400 border-transparent hover:border-white/10'}`}>
                            {item.titulo}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* SIDEBAR PRÓXIMOS */}
          <aside className="hidden lg:flex flex-col h-full overflow-hidden border-l border-white/5 pl-8">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-6 flex items-center gap-2 shrink-0">
              <TrendingUp size={14} className="text-cyan-500" /> Em Breve
            </h3>
            <div className="flex-1 overflow-y-auto pr-2 no-scrollbar space-y-4 pb-8">
                {proximosLancamentos.map(item => (
                  <button key={item.id} onClick={() => setSearchParams({ id: item.id })} className="w-full text-left p-4 rounded-[2rem] bg-white/5 border border-white/5 hover:border-cyan-500/40 transition-all group">
                    <div className="flex justify-between items-start mb-1">
                        <span className="text-[9px] font-black text-cyan-500 uppercase tracking-widest">{format(parseISO(item.data), "dd MMM")}</span>
                        {item.hype === 'altissimo' && <Flame size={14} className="text-orange-500 animate-pulse" />}
                    </div>
                    <h4 className="text-sm font-black uppercase italic tracking-tighter group-hover:text-cyan-400 transition-colors leading-tight">{item.titulo}</h4>
                  </button>
                ))}
            </div>
          </aside>
        </main>
      </div>

      {/* 3. CONTEÚDO SCROLLABLE (SEGUNDA DOBRA) */}
      <div className="max-w-7xl mx-auto px-6 py-20 space-y-32">
        
        {/* LISTA DE ESPERA */}
        <section>
          <div className="flex items-center gap-4 mb-10">
            <div className="h-px flex-1 bg-white/5"></div>
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.6em] flex items-center gap-3">
              <Clock size={16} /> Sai quando estiver pronto
            </h3>
            <div className="h-px flex-1 bg-white/5"></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {jogosSemData.map(item => (
              <button key={item.id} onClick={() => setSearchParams({ id: item.id })} className="bg-white/5 border border-white/5 p-4 rounded-2xl text-[10px] font-black text-slate-500 hover:text-cyan-400 hover:border-cyan-500/30 transition-all uppercase tracking-tighter text-center">
                {item.titulo}
              </button>
            ))}
          </div>
        </section>

        {/* MAIS HYPADOS (CARROSSEL/GRID) */}
        <section className="pb-20">
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-[10px] font-black text-orange-500 uppercase tracking-[0.6em] flex items-center gap-3">
              <Zap size={16} fill="currentColor" /> Radar de Hype
            </h3>
            <span className="text-[9px] text-slate-600 font-bold uppercase">Elite Collection</span>
          </div>
          <div className="flex gap-6 overflow-x-auto no-scrollbar pb-10 snap-x">
             {maisHypados.map(item => (
               <button key={item.id} onClick={() => setSearchParams({ id: item.id })} className="min-w-[280px] snap-start p-8 rounded-[3rem] bg-gradient-to-br from-orange-600/20 to-orange-950/40 border border-orange-500/20 text-left hover:border-orange-500/50 transition-all group shadow-2xl">
                  <div className="bg-orange-500/20 p-3 rounded-2xl w-fit mb-6 text-orange-500"><Star size={20} fill="currentColor" /></div>
                  <h4 className="text-xl font-black uppercase italic leading-tight mb-2 group-hover:text-orange-400 transition-colors">{item.titulo}</h4>
                  <p className="text-[9px] font-black text-orange-500/60 uppercase tracking-widest italic">{new Date(item.data).getFullYear()} • {item.tipo}</p>
               </button>
             ))}
          </div>
        </section>
      </div>

      {/* 4. MODAL */}
      <AnimatePresence mode="wait">
        {itemParaModal && <LaunchModal item={itemParaModal} onClose={() => setSearchParams({})} />}
      </AnimatePresence>
    </div>
  );
}

// --- SUB-COMPONENTES (LaunchModal e DetailTime permanecem iguais) ---
function LaunchModal({ item, onClose }) {
  const tempo = useCountdown(item.data);
  useEffect(() => { document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = 'unset'; }; }, []);
  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center p-0 md:p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-950/95 backdrop-blur-md" />
      <motion.div initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="relative w-full max-w-sm bg-slate-900 border border-white/10 rounded-t-[3rem] md:rounded-[3rem] p-8 shadow-2xl">
        <div className="flex justify-between items-center mb-8">
           <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${item.hype === 'altissimo' ? 'bg-orange-500 text-white' : 'bg-white/10 text-slate-500'}`}>{item.hype} Hype</div>
           <button onClick={onClose} className="p-2 bg-white/5 rounded-xl text-slate-400"><X size={18} /></button>
        </div>
        <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-2 leading-none">{item.titulo}</h2>
        <p className="text-cyan-500 font-black tracking-[0.2em] uppercase text-[10px] mb-8">{item.data ? format(parseISO(item.data), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : "TBA"}</p>
        <div className="grid grid-cols-5 gap-1.5 mb-10">
           <DetailTime label="Anos" val={tempo?.anos} />
           <DetailTime label="Dias" val={tempo?.dias} />
           <DetailTime label="Hrs" val={tempo?.horas} />
           <DetailTime label="Min" val={tempo?.minutos} />
           <DetailTime label="Seg" val={tempo?.segundos} />
        </div>
        <button onClick={onClose} className="w-full py-4 rounded-xl bg-white text-black font-black text-[9px] uppercase tracking-widest hover:bg-cyan-500 hover:text-white transition-all shadow-xl">Fechar Radar</button>
      </motion.div>
    </div>
  );
}

function DetailTime({ label, val }) {
  return (
    <div className="bg-white/5 rounded-xl p-3 text-center border border-white/5 shadow-inner">
      <div className="text-xl font-black leading-none mb-1 text-white">{val !== undefined ? String(val).padStart(2, '0') : '--'}</div>
      <div className="text-[6px] font-black uppercase text-slate-600 tracking-tighter">{label}</div>
    </div>
  );
}