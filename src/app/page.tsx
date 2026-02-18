"use client";
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, Trash2, TrendingUp, ShieldCheck, Plane, 
  RefreshCcw, Wallet, Coins, Zap, ArrowUpRight, 
  Calendar, Filter, X, CheckCircle2 
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { AwardEngine, Card, AwardOption } from '../lib/engine';
import TrendChart from '../lib/TrendChart';

export default function Dashboard() {
  // --- STATE ---
  const [portfolio, setPortfolio] = useState<Card[]>([]);
  const [origin, setOrigin] = useState('BOM');
  const [destination, setDestination] = useState('JFK');
  const [month, setMonth] = useState('May');
  const [tripType, setTripType] = useState('Round Trip');
  const [cabin, setCabin] = useState('Business');
  
  const [newCardName, setNewCardName] = useState('');
  const [newCardPoints, setNewCardPoints] = useState('');
  const [history, setHistory] = useState<any[]>([]);
  const [targetAward, setTargetAward] = useState<AwardOption | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // --- INITIALIZE DATA ---
  useEffect(() => {
    async function initDashboard() {
      try {
        setLoading(true);
        
        // 1. Fetch Global App Settings
        const { data: settings } = await supabase.from('app_settings').select('*').eq('id', 1).single();
        if (settings) {
          setOrigin(settings.origin_code);
          setDestination(settings.destination_code);
          setMonth(settings.month_to_fly || 'May');
          setTripType(settings.trip_type || 'Round Trip');
          setCabin(settings.cabin_class || 'Business');
        }

        // 2. Fetch User Portfolio
        const { data: pointsData } = await supabase.from('user_points').select('*').order('created_at', { ascending: true });
        if (pointsData) {
          setPortfolio(pointsData.map(p => ({ id: p.id, name: p.card_name, points: p.points_balance })));
        }

        // 3. Fetch Market History (Chart)
        const { data: flightData } = await supabase.from('award_snapshots').select('*').order('captured_at', { ascending: true }).limit(15);
        if (flightData && flightData.length > 0) {
          setHistory(flightData);
          const latest = flightData[flightData.length - 1];
          setTargetAward({
            airline: latest.airline,
            program: latest.program as any,
            miles_required: latest.miles_required,
            tax_usd: Number(latest.tax_usd),
            cash_equivalent_usd: 4200
          });
        }
      } catch (e) {
        console.error("Init Error:", e);
      } finally {
        setLoading(false);
      }
    }
    initDashboard();
  }, []);

  // --- ACTIONS: SETTINGS & FILTERS ---
  const updateSetting = async (field: string, val: string) => {
    const upperVal = (field.includes('code')) ? val.toUpperCase().slice(0, 3) : val;
    
    if (field === 'origin_code') setOrigin(upperVal);
    if (field === 'destination_code') setDestination(upperVal);
    if (field === 'month_to_fly') setMonth(upperVal);
    if (field === 'trip_type') setTripType(upperVal);
    if (field === 'cabin_class') setCabin(upperVal);

    await supabase.from('app_settings').upsert({ id: 1, [field]: upperVal });
  };

  // --- ACTIONS: PORTFOLIO ---
  const updateCardPoints = async (id: any, newVal: string) => {
    const numericVal = parseInt(newVal) || 0;
    setPortfolio(prev => prev.map(card => card.id === id ? { ...card, points: numericVal } : card));
    await supabase.from('user_points').update({ points_balance: numericVal }).eq('id', id);
  };

  const addCard = async () => {
    if (!newCardName || !newCardPoints) return;
    const pts = parseInt(newCardPoints);
    const { data, error } = await supabase.from('user_points').insert([{ card_name: newCardName, points_balance: pts }]).select();
    if (!error && data) {
      setPortfolio([...portfolio, { id: data[0].id, name: newCardName, points: pts }]);
      setNewCardName(''); setNewCardPoints('');
    }
  };

  const removeCard = async (id: any, index: number) => {
    if (!id) return;
    const { error } = await supabase.from('user_points').delete().eq('id', id);
    if (!error) setPortfolio(portfolio.filter((_, i) => i !== index));
  };

  // --- CALCULATIONS ---
  const totalPoints = useMemo(() => portfolio.reduce((sum, card) => sum + card.points, 0), [portfolio]);
  const engine = useMemo(() => new AwardEngine(), []);
  const strategy = useMemo(() => targetAward ? engine.optimize(portfolio, targetAward) : null, [portfolio, targetAward, engine]);

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center text-blue-500">
      <RefreshCcw className="animate-spin w-10 h-10" />
    </div>
  );

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans relative">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HEADER & FILTERS */}
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-blue-400 font-bold text-sm uppercase tracking-widest">
              <ShieldCheck size={16} /> Award Intelligence Engine
            </div>
            <h1 className="text-4xl font-black tracking-tight flex flex-wrap items-center gap-3">
              Route: 
              <input 
                key={`origin-${origin}`}
                defaultValue={origin} 
                onBlur={(e) => updateSetting('origin_code', e.target.value)}
                className="bg-slate-900 border border-slate-800 w-28 px-2 py-1 rounded-lg text-blue-500 underline underline-offset-8 outline-none focus:ring-1 focus:ring-blue-500 text-center"
              />
              <span className="text-slate-700">⇄</span>
              <input 
                key={`dest-${destination}`}
                defaultValue={destination} 
                onBlur={(e) => updateSetting('destination_code', e.target.value)}
                className="bg-slate-900 border border-slate-800 w-28 px-2 py-1 rounded-lg text-blue-500 underline underline-offset-8 outline-none focus:ring-1 focus:ring-blue-500 text-center"
              />
            </h1>
          </div>

          <div className="flex flex-wrap gap-3 bg-slate-900/50 p-2 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-950 rounded-xl border border-slate-800">
              <Calendar size={14} className="text-slate-500" />
              <select value={month} onChange={(e) => updateSetting('month_to_fly', e.target.value)} className="bg-transparent text-sm font-bold outline-none cursor-pointer">
                {['May', 'June', 'July', 'August', 'September'].map(m => <option key={m} value={m} className="bg-slate-900">{m}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-950 rounded-xl border border-slate-800">
              <Filter size={14} className="text-slate-500" />
              <select value={tripType} onChange={(e) => updateSetting('trip_type', e.target.value)} className="bg-transparent text-sm font-bold outline-none cursor-pointer">
                <option value="Round Trip" className="bg-slate-900">Round Trip</option>
                <option value="One Way" className="bg-slate-900">One Way</option>
              </select>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 rounded-xl border border-blue-500/20 text-blue-400">
              <Zap size={14} />
              <select value={cabin} onChange={(e) => updateSetting('cabin_class', e.target.value)} className="bg-transparent text-sm font-black outline-none cursor-pointer uppercase">
                <option value="Business" className="bg-slate-900">Business</option>
                <option value="First" className="bg-slate-900">First</option>
                <option value="Economy" className="bg-slate-900">Economy</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT: PORTFOLIO & STRATEGY */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* PORTFOLIO SECTION */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2"><Wallet className="text-blue-500" /> Points Portfolio</h2>
                <div className="text-sm font-black text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20 uppercase tracking-tighter">
                  {totalPoints.toLocaleString()} Total Pts
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 pb-8 border-b border-slate-800">
                <input type="text" placeholder="Card Name" value={newCardName} onChange={(e) => setNewCardName(e.target.value)} className="bg-slate-950 border border-slate-700 p-4 rounded-xl text-white outline-none focus:ring-1 focus:ring-blue-500" />
                <input type="number" placeholder="Balance" value={newCardPoints} onChange={(e) => setNewCardPoints(e.target.value)} className="bg-slate-950 border border-slate-700 p-4 rounded-xl text-white outline-none focus:ring-1 focus:ring-blue-500" />
                <button onClick={addCard} className="bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl transition-all flex items-center justify-center gap-2"><Plus size={20}/> Add Account</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {portfolio.map((card, idx) => (
                  <div key={card.id || idx} className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex items-center justify-between group hover:border-blue-500/50 transition-all">
                    <div className="flex-1 mr-4">
                      <p className="text-[10px] text-slate-500 font-black uppercase mb-1">{card.name}</p>
                      <input type="number" value={card.points} onChange={(e) => updateCardPoints(card.id, e.target.value)} className="bg-transparent text-xl font-bold text-white w-full outline-none focus:text-blue-400" />
                    </div>
                    <button onClick={() => removeCard(card.id, idx)} className="text-slate-800 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                  </div>
                ))}
              </div>
            </div>

            {/* STRATEGY DISPLAY */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-inner">
              <h2 className="text-xl font-bold flex items-center gap-2 mb-8"><TrendingUp className="text-blue-500" /> Optimal Booking Strategy</h2>
              <div className="grid gap-4">
                {strategy?.transfers.length === 0 ? (
                  <div className="p-10 border border-dashed border-slate-800 rounded-2xl text-center text-slate-500">
                    <Coins className="mx-auto mb-2 opacity-20" size={32} />
                    Add card balances to calculate the transfer path.
                  </div>
                ) : (
                  strategy?.transfers.map((t, idx) => (
                    <div key={idx} className="bg-slate-950 border border-slate-800 p-5 rounded-2xl flex items-center justify-between border-l-4 border-l-blue-500">
                      <div><p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Transfer From</p><p className="font-bold text-lg">{t.from} → {targetAward?.program}</p></div>
                      <div className="text-right"><p className="text-xs text-blue-500 font-bold uppercase mb-1">Required</p><p className="text-2xl font-black">{t.amount.toLocaleString()}</p></div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: CHART & SIDEBAR */}
          <div className="space-y-6">
            <TrendChart data={history} />
            <div className="p-8 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-3xl text-white shadow-xl shadow-blue-900/40">
              <div className="flex items-center gap-2 mb-4"><Zap size={20} className="text-yellow-300 fill-yellow-300" /><h3 className="font-black text-sm uppercase tracking-widest">Efficiency Maximizer</h3></div>
              <div className="space-y-4">
                <div><p className="text-xs opacity-70 font-bold uppercase">Estimated Savings</p><p className="text-4xl font-black tracking-tighter">${targetAward ? (targetAward.cash_equivalent_usd - targetAward.tax_usd).toLocaleString() : '0'}</p></div>
                <div className="pt-4 border-t border-white/10">
                  <p className="text-xs opacity-70 font-bold uppercase mb-2">Deal Coverage</p>
                  <div className="h-2 w-full bg-black/20 rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-300 transition-all duration-1000" style={{ width: `${Math.min((totalPoints / (targetAward?.miles_required || 1)) * 100, 100)}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
            <button onClick={() => setIsModalOpen(true)} className="w-full py-5 bg-white text-blue-600 font-black rounded-2xl flex items-center justify-center gap-2 hover:bg-blue-50 transition-all shadow-lg group">
              EXECUTE BOOKING <ArrowUpRight className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* BOOKING MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <div><h2 className="text-2xl font-black flex items-center gap-2"><CheckCircle2 className="text-green-500" /> Booking Blueprint</h2><p className="text-slate-500 text-sm">Step-by-step to {destination} in {cabin}</p></div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-800 rounded-full transition-colors"><X size={24} /></button>
            </div>
            <div className="p-8 space-y-6">
              <div className="bg-blue-600 p-6 rounded-2xl text-white flex justify-between items-center">
                <div><p className="text-xs font-black uppercase opacity-80 tracking-widest">Target Deal</p><p className="text-2xl font-bold">{origin} → {destination}</p><p className="text-sm opacity-90">{month} | {tripType} | {cabin}</p></div>
                <div className="text-right"><p className="text-3xl font-black">{targetAward?.miles_required.toLocaleString()}</p><p className="text-xs font-bold uppercase opacity-80">Points Needed</p></div>
              </div>
              <div className="space-y-6">
                <div className="flex gap-4"><div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center font-black text-blue-400">1</div><div><p className="font-bold uppercase text-sm">Transfer Points</p><p className="text-slate-400 text-sm">Move points from {strategy?.transfers[0]?.from || 'Bank'} to {targetAward?.program}.</p></div></div>
                <div className="flex gap-4"><div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center font-black text-blue-400">2</div><div><p className="font-bold uppercase text-sm">Search Program</p><p className="text-slate-400 text-sm">Login to {targetAward?.program} and find {origin}-{destination} for {month}.</p></div></div>
                <div className="flex gap-4"><div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center font-black text-blue-400">3</div><div><p className="font-bold uppercase text-sm">Complete Booking</p><p className="text-slate-400 text-sm">Pay the ${targetAward?.tax_usd} tax and receive your ticket.</p></div></div>
              </div>
              <button onClick={() => window.open(`https://www.google.com/search?q=${targetAward?.program}+award+search`, '_blank')} className="w-full py-4 bg-white text-black font-black rounded-xl hover:bg-blue-50 transition-all uppercase">Open {targetAward?.program}</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}