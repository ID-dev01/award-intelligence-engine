"use client";
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, Trash2, TrendingUp, ShieldCheck, Plane, 
  RefreshCcw, Wallet, Coins, Zap, ArrowUpRight, 
  Calendar, Filter, X, CheckCircle2, ChevronRight, Star
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
  const [returnMonth, setReturnMonth] = useState('June');
  const [tripType, setTripType] = useState('Round Trip');
  const [cabin, setCabin] = useState('Business');
  
  const [newCardName, setNewCardName] = useState('');
  const [newCardPoints, setNewCardPoints] = useState('');
  const [history, setHistory] = useState<any[]>([]);
  const [targetAward, setTargetAward] = useState<AwardOption | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Mock data for "Multiple Dates" result
  const availabilityResults = useMemo(() => [
    { date: `${month} 12`, points: 85000, tax: 150, airline: 'Qatar', optimal: true },
    { date: `${month} 14`, points: 92000, tax: 200, airline: 'Emirates', optimal: false },
    { date: `${month} 19`, points: 85000, tax: 180, airline: 'Qatar', optimal: false },
    { date: `${month} 22`, points: 110000, tax: 450, airline: 'Air India', optimal: false },
  ], [month]);

  // --- INITIALIZE ---
  useEffect(() => {
    async function initDashboard() {
      try {
        setLoading(true);
        const { data: settings } = await supabase.from('app_settings').select('*').eq('id', 1).single();
        if (settings) {
          setOrigin(settings.origin_code);
          setDestination(settings.destination_code);
          setMonth(settings.month_to_fly || 'May');
          setReturnMonth(settings.return_month || 'June');
          setTripType(settings.trip_type || 'Round Trip');
          setCabin(settings.cabin_class || 'Business');
        }
        const { data: pointsData } = await supabase.from('user_points').select('*').order('created_at', { ascending: true });
        if (pointsData) setPortfolio(pointsData.map(p => ({ id: p.id, name: p.card_name, points: p.points_balance })));
        
        const { data: flightData } = await supabase.from('award_snapshots').select('*').order('captured_at', { ascending: true }).limit(15);
        if (flightData?.length) {
          setHistory(flightData);
          const latest = flightData[flightData.length - 1];
          setTargetAward({
            airline: latest.airline,
            program: latest.program as any,
            miles_required: 85000, // Matching our 'optimal' mock
            tax_usd: 150,
            cash_equivalent_usd: 4200
          });
        }
      } catch (e) { console.error(e); } finally { setLoading(false); }
    }
    initDashboard();
  }, []);

  const updateSetting = async (field: string, val: string) => {
    if (field === 'origin_code') setOrigin(val.toUpperCase());
    if (field === 'destination_code') setDestination(val.toUpperCase());
    if (field === 'month_to_fly') setMonth(val);
    if (field === 'return_month') setReturnMonth(val);
    if (field === 'trip_type') setTripType(val);
    if (field === 'cabin_class') setCabin(val);
    await supabase.from('app_settings').upsert({ id: 1, [field]: val });
  };

  const totalPoints = useMemo(() => portfolio.reduce((sum, card) => sum + card.points, 0), [portfolio]);
  const engine = useMemo(() => new AwardEngine(), []);
  const strategy = useMemo(() => targetAward ? engine.optimize(portfolio, targetAward) : null, [portfolio, targetAward]);

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-blue-500"><RefreshCcw className="animate-spin" /></div>;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HEADER & EXTENDED FILTERS */}
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-black tracking-tight flex flex-wrap items-center gap-3">
              <input defaultValue={origin} onBlur={(e) => updateSetting('origin_code', e.target.value)} className="bg-slate-900 border-none w-28 text-blue-500 underline text-center outline-none" />
              <span className="text-slate-700">⇄</span>
              <input defaultValue={destination} onBlur={(e) => updateSetting('destination_code', e.target.value)} className="bg-slate-900 border-none w-28 text-blue-500 underline text-center outline-none" />
            </h1>
          </div>

          <div className="flex flex-wrap gap-2 bg-slate-900/50 p-2 rounded-2xl border border-slate-800">
            <div className="flex flex-col px-3 border-r border-slate-800">
              <label className="text-[10px] font-black text-slate-500 uppercase">Depart</label>
              <select value={month} onChange={(e) => updateSetting('month_to_fly', e.target.value)} className="bg-transparent text-sm font-bold outline-none">
                {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(m => <option key={m} value={m} className="bg-slate-900">{m}</option>)}
              </select>
            </div>
            {tripType === 'Round Trip' && (
              <div className="flex flex-col px-3 border-r border-slate-800">
                <label className="text-[10px] font-black text-slate-500 uppercase">Return</label>
                <select value={returnMonth} onChange={(e) => updateSetting('return_month', e.target.value)} className="bg-transparent text-sm font-bold outline-none">
                  {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(m => <option key={m} value={m} className="bg-slate-900">{m}</option>)}
                </select>
              </div>
            )}
            <div className="flex flex-col px-3 border-r border-slate-800">
              <label className="text-[10px] font-black text-slate-500 uppercase">Type</label>
              <select value={tripType} onChange={(e) => updateSetting('trip_type', e.target.value)} className="bg-transparent text-sm font-bold outline-none">
                <option value="Round Trip">Round Trip</option>
                <option value="One Way">One Way</option>
              </select>
            </div>
            <div className="flex flex-col px-3">
              <label className="text-[10px] font-black text-blue-400 uppercase">Cabin</label>
              <select value={cabin} onChange={(e) => updateSetting('cabin_class', e.target.value)} className="bg-transparent text-sm font-black text-blue-400 outline-none uppercase">
                <option value="Business">Business</option>
                <option value="First">First</option>
                <option value="Economy">Economy</option>
              </select>
            </div>
          </div>
        </div>

        {/* RESULTS GRID: MULTIPLE DATES */}
        <section className="bg-slate-900/30 border border-slate-800 rounded-3xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2"><Calendar className="text-blue-500"/> Availability for {month}</h2>
            <span className="text-xs text-slate-500 font-bold uppercase">Sorted by Lowest Points</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {availabilityResults.map((res, i) => (
              <div key={i} className={`p-4 rounded-2xl border transition-all cursor-pointer ${res.optimal ? 'bg-blue-600/20 border-blue-500 shadow-lg shadow-blue-500/10' : 'bg-slate-950 border-slate-800 hover:border-slate-600'}`}>
                <div className="flex justify-between items-start mb-2">
                  <p className="text-sm font-black uppercase text-slate-400">{res.date}</p>
                  {res.optimal && <Star size={14} className="text-yellow-400 fill-yellow-400"/>}
                </div>
                <p className="text-2xl font-black">{res.points.toLocaleString()}</p>
                <p className="text-xs font-bold text-slate-500 uppercase">{res.airline} • ${res.tax} Tax</p>
                {res.optimal && <div className="mt-3 text-[10px] font-black bg-blue-500 text-white px-2 py-1 rounded inline-block uppercase">Best Deal</div>}
              </div>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* PORTFOLIO SECTION (Same as before) */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2"><Wallet className="text-blue-500" /> Points Portfolio</h2>
                <div className="text-sm font-black text-blue-400">{totalPoints.toLocaleString()} TOTAL</div>
              </div>
              {/* Insert Card Add Form & Mapping here... */}
            </div>

            {/* STRATEGY DISPLAY (Same as before) */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8">
               {/* Strategy transfers map... */}
            </div>
          </div>

          <div className="space-y-6">
            <TrendChart data={history} />
            {/* EFFICIENCY WIDGET */}
            <button onClick={() => setIsModalOpen(true)} className="w-full py-5 bg-white text-blue-600 font-black rounded-2xl flex items-center justify-center gap-2">
              EXECUTE OPTIMAL BOOKING <ArrowUpRight />
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}