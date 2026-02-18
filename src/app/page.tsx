"use client";
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, Trash2, TrendingUp, ShieldCheck, Plane, 
  RefreshCcw, Wallet, Coins, Zap, ArrowUpRight, Calendar, Filter,
  X, CheckCircle2 // Add these
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { AwardEngine, Card, AwardOption } from '../lib/engine';
import TrendChart from '../lib/TrendChart';

export default function Dashboard() {
  const [portfolio, setPortfolio] = useState<Card[]>([]);
  const [origin, setOrigin] = useState('BOM');
  const [destination, setDestination] = useState('JFK');
  const [month, setMonth] = useState('May');
  const [tripType, setTripType] = useState('Round Trip');
  const [cabin, setCabin] = useState('Business');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [newCardName, setNewCardName] = useState('');
  const [newCardPoints, setNewCardPoints] = useState('');
  const [history, setHistory] = useState<any[]>([]);
  const [targetAward, setTargetAward] = useState<AwardOption | null>(null);
  const [loading, setLoading] = useState(true);

  // --- INITIALIZE ALL DATA ---
  useEffect(() => {
    async function initDashboard() {
      try {
        setLoading(true);
        const { data: settings } = await supabase.from('app_settings').select('*').eq('id', 1).single();
        if (settings) {
          setOrigin(settings.origin_code);
          setDestination(settings.destination_code);
          setMonth(settings.month_to_fly || 'May');
          setTripType(settings.trip_type || 'Round Trip');
          setCabin(settings.cabin_class || 'Business');
        }

        const { data: pointsData } = await supabase.from('user_points').select('*').order('created_at', { ascending: true });
        if (pointsData) {
          setPortfolio(pointsData.map(p => ({ id: p.id, name: p.card_name, points: p.points_balance })));
        }

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
        console.error("Initialization failed:", e);
      } finally {
        setLoading(false);
      }
    }
    initDashboard();
  }, []);

  // --- PERSISTENT SETTINGS UPDATE ---
  const updateSetting = async (field: string, val: string) => {
    // 1. Update UI immediately
    if (field === 'origin_code') setOrigin(val.toUpperCase());
    if (field === 'destination_code') setDestination(val.toUpperCase());
    if (field === 'month_to_fly') setMonth(val);
    if (field === 'trip_type') setTripType(val);
    if (field === 'cabin_class') setCabin(val);

    // 2. Persist to DB
    await supabase.from('app_settings').upsert({ id: 1, [field]: val });
    
    // 3. Optional: Trigger a fresh API search here for the "Exact Deal"
  };

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

  const totalPoints = useMemo(() => portfolio.reduce((sum, card) => sum + card.points, 0), [portfolio]);
  const engine = useMemo(() => new AwardEngine(), []);
  const strategy = useMemo(() => targetAward ? engine.optimize(portfolio, targetAward) : null, [portfolio, targetAward, engine]);

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <RefreshCcw className="text-blue-500 animate-spin w-10 h-10" />
    </div>
  );

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HEADER: EDITABLE ROUTE & FILTERS */}
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-blue-400 font-bold text-sm uppercase mb-1">
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

            {/* FILTER BAR */}
            <div className="flex flex-wrap gap-3 bg-slate-900/50 p-2 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-950 rounded-xl border border-slate-800">
                <Calendar size={14} className="text-slate-500" />
                <select 
                  value={month} 
                  onChange={(e) => updateSetting('month_to_fly', e.target.value)}
                  className="bg-transparent text-sm font-bold outline-none cursor-pointer"
                >
                  {['May', 'June', 'July', 'August', 'September'].map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              <div className="flex items-center gap-2 px-3 py-2 bg-slate-950 rounded-xl border border-slate-800">
                <Filter size={14} className="text-slate-500" />
                <select 
                  value={tripType} 
                  onChange={(e) => updateSetting('trip_type', e.target.value)}
                  className="bg-transparent text-sm font-bold outline-none cursor-pointer"
                >
                  <option value="Round Trip">Round Trip</option>
                  <option value="One Way">One Way</option>
                </select>
              </div>

              <div className="flex items-center gap-2 px-3 py-2 bg-blue-500/10 rounded-xl border border-blue-500/20 text-blue-400">
                <Zap size={14} />
                <select 
                  value={cabin} 
                  onChange={(e) => updateSetting('cabin_class', e.target.value)}
                  className="bg-transparent text-sm font-black outline-none cursor-pointer uppercase"
                >
                  <option value="Business">Business</option>
                  <option value="First">First</option>
                  <option value="Economy">Economy</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* ... (Keep the rest of your Portfolio and Strategy grid code here) ... */}
        {/* Ensure the "Execute Booking" section displays the details: */}
        {/* example: {month} Round Trip in {cabin} */}
      </div>
      {/* BOOKING BLUEPRINT MODAL */}
{isModalOpen && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
    <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden">
      {/* Modal Header */}
      <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
        <div>
          <h2 className="text-2xl font-black flex items-center gap-2">
            <CheckCircle2 className="text-green-500" /> Booking Blueprint
          </h2>
          <p className="text-slate-500 text-sm font-medium">Follow these steps to lock in your {cabin} deal.</p>
        </div>
        <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
          <X size={24} />
        </button>
      </div>

      {/* Modal Content */}
      <div className="p-8 space-y-8">
        {/* Deal Summary Card */}
        <div className="bg-blue-600 p-6 rounded-2xl text-white flex justify-between items-center">
          <div>
            <p className="text-xs font-black uppercase opacity-80 tracking-widest">Confirmed Deal</p>
            <p className="text-2xl font-bold">{origin} → {destination}</p>
            <p className="text-sm opacity-90">{month} | {tripType} | {cabin}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-black">{targetAward?.miles_required.toLocaleString()}</p>
            <p className="text-xs font-bold uppercase opacity-80">Total Points + ${targetAward?.tax_usd} Tax</p>
          </div>
        </div>

        {/* Step-by-Step Checklist */}
        <div className="space-y-6">
          <div className="flex gap-4">
            <div className="flex-none w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center font-black text-blue-400">1</div>
            <div>
              <p className="font-bold text-slate-100 uppercase text-sm tracking-wide">Initiate Transfer</p>
              <p className="text-slate-400 text-sm">
                Log into your {strategy?.transfers[0]?.from || 'Bank'} portal. Transfer 
                <span className="text-white font-bold"> {strategy?.transfers[0]?.amount.toLocaleString()} points</span> to 
                <span className="text-blue-400 font-bold"> {targetAward?.program}</span>. 
                (Usually instant, may take up to 24hrs).
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-none w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center font-black text-blue-400">2</div>
            <div>
              <p className="font-bold text-slate-100 uppercase text-sm tracking-wide">Search on {targetAward?.program}</p>
              <p className="text-slate-400 text-sm">
                Visit the official <span className="text-white underline underline-offset-4">{targetAward?.program} website</span>. 
                Search for {origin} to {destination} in {month} selecting <strong>"Book with Points"</strong> and <strong>"{cabin}"</strong>.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-none w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center font-black text-blue-400">3</div>
            <div>
              <p className="font-bold text-slate-100 uppercase text-sm tracking-wide">Confirm & Pay Tax</p>
              <p className="text-slate-400 text-sm">
                Select the {targetAward?.airline} flight. Use your credit card to pay the remaining 
                <span className="text-white font-bold"> ${targetAward?.tax_usd}</span> in taxes and fees.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 bg-slate-950/50 border-t border-slate-800">
        <button 
          onClick={() => window.open(`https://www.google.com/search?q=${targetAward?.program}+award+search`, '_blank')}
          className="w-full py-4 bg-white text-black font-black rounded-xl hover:bg-blue-50 transition-all uppercase tracking-widest"
        >
          Take Me to {targetAward?.program}
        </button>
      </div>
    </div>
  </div>
)}
<button 
  onClick={() => setIsModalOpen(true)}
  className="w-full py-5 bg-white text-blue-600 font-black rounded-2xl flex items-center justify-center gap-2 hover:bg-blue-50 transition-all shadow-lg group"
>
  EXECUTE BOOKING <ArrowUpRight className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
</button>
    </main>
  );
}