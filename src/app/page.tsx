"use client";
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  TrendingUp, 
  ShieldCheck, 
  Plane,
  RefreshCcw,
  Wallet,
  Coins
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { AwardEngine, Card, AwardOption } from '../lib/engine';
import TrendChart from '../lib/TrendChart';

export default function Dashboard() {
  const [portfolio, setPortfolio] = useState<Card[]>([]);
  const [newCardName, setNewCardName] = useState('');
  const [newCardPoints, setNewCardPoints] = useState('');
  const [history, setHistory] = useState<any[]>([]);
  const [targetAward, setTargetAward] = useState<AwardOption | null>(null);
  const [loading, setLoading] = useState(true);

  // --- INITIALIZE DATA ---
  useEffect(() => {
    async function initDashboard() {
      setLoading(true);
      
      // 1. Fetch saved points from user_points table
      const { data: pointsData } = await supabase
        .from('user_points')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (pointsData) {
        // Mapping database fields to the Card interface
        setPortfolio(pointsData.map(p => ({ 
          id: p.id, 
          name: p.card_name, 
          points: p.points_balance 
        })));
      }

      // 2. Fetch flight award history
      const { data: flightData } = await supabase
        .from('award_snapshots')
        .select('*')
        .order('captured_at', { ascending: true })
        .limit(15);

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
      setLoading(false);
    }
    initDashboard();
  }, []);

  // --- ADD POINT TO DATABASE ---
  const addCard = async () => {
    if (!newCardName || !newCardPoints) return;
    const pts = parseInt(newCardPoints);

    // Save to Supabase
    const { data, error } = await supabase
      .from('user_points')
      .insert([{ card_name: newCardName, points_balance: pts }])
      .select();

    if (!error && data) {
      // Update local state with the new card and its DB-generated ID
      setPortfolio([...portfolio, { id: data[0].id, name: newCardName, points: pts }]);
      setNewCardName('');
      setNewCardPoints('');
    }
  };

  // --- REMOVE POINT FROM DATABASE ---
  const removeCard = async (id: any, index: number) => {
    if (!id) return; // Prevent errors if ID is missing

    const { error } = await supabase
      .from('user_points')
      .delete()
      .eq('id', id);

    if (!error) {
      setPortfolio(portfolio.filter((_, i) => i !== index));
    }
  };

  const engine = useMemo(() => new AwardEngine(), []);
  const strategy = useMemo(() => 
    targetAward ? engine.optimize(portfolio, targetAward) : null, 
    [portfolio, targetAward, engine]
  );

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <RefreshCcw className="text-blue-500 animate-spin w-10 h-10" />
    </div>
  );

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-400 font-bold text-sm uppercase mb-1">
              <ShieldCheck size={16} /> Real-Time Intelligence
            </div>
            <h1 className="text-4xl font-black tracking-tight">Route: <span className="text-blue-500 underline underline-offset-8">BOM ⇄ JFK</span></h1>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center gap-4">
            <Plane className="text-blue-400" size={24} />
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase">Target Program</p>
              <p className="font-bold text-lg">{targetAward?.program}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            
            {/* PORTFOLIO ENTRY */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 shadow-2xl">
              <h2 className="text-xl font-bold flex items-center gap-2 mb-6"><Wallet className="text-blue-500" /> Points Portfolio</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <input 
                  type="text" placeholder="Card Name" value={newCardName}
                  onChange={(e) => setNewCardName(e.target.value)}
                  className="bg-slate-950 border border-slate-700 p-4 rounded-xl text-white outline-none focus:ring-1 focus:ring-blue-500"
                />
                <input 
                  type="number" placeholder="Balance" value={newCardPoints}
                  onChange={(e) => setNewCardPoints(e.target.value)}
                  className="bg-slate-950 border border-slate-700 p-4 rounded-xl text-white outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button onClick={addCard} className="bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl active:scale-95 transition-all">
                  Save Points
                </button>
              </div>

              <div className="flex flex-wrap gap-3">
                {portfolio.map((card, idx) => (
                  <div key={card.id || idx} className="bg-slate-800/50 border border-slate-700 px-4 py-3 rounded-2xl flex items-center gap-4 group hover:border-blue-500/50 transition-colors">
                    <div>
                      <p className="text-[10px] text-slate-500 font-black uppercase">{card.name}</p>
                      <p className="text-lg font-bold tracking-tight">{card.points.toLocaleString()}</p>
                    </div>
                    <button onClick={() => removeCard(card.id, idx)} className="text-slate-600 hover:text-red-500 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* STRATEGY DISPLAY */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-inner">
              <h2 className="text-xl font-bold flex items-center gap-2 mb-8"><TrendingUp className="text-blue-500" /> Optimal Booking Logic</h2>
              <div className="grid gap-4">
                {strategy?.transfers.length === 0 ? (
                  <div className="p-10 border border-dashed border-slate-800 rounded-2xl text-center text-slate-500">
                    <Coins className="mx-auto mb-2 opacity-20" size={32} />
                    Enter your points above to see which cards to transfer.
                  </div>
                ) : (
                  strategy?.transfers.map((t, idx) => (
                    <div key={idx} className="bg-slate-950 border border-slate-800 p-5 rounded-2xl flex items-center justify-between border-l-4 border-l-blue-500">
                      <div><p className="text-xs text-slate-500 font-bold uppercase tracking-widest">From</p><p className="font-bold text-lg">{t.from}</p></div>
                      <div className="text-right"><p className="text-xs text-blue-500 font-bold uppercase mb-1">Transfer Amount</p><p className="text-2xl font-black">{t.amount.toLocaleString()}</p></div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <TrendChart data={history} />
            <div className="p-8 bg-blue-600 rounded-3xl text-white shadow-xl shadow-blue-900/40">
              <p className="text-xs font-black uppercase mb-1">Total Valuation</p>
              <div className="text-5xl font-black mb-4">
                {targetAward ? ((targetAward.cash_equivalent_usd - targetAward.tax_usd) / targetAward.miles_required * 100).toFixed(1) : '0'}¢
                <span className="text-lg font-bold opacity-70 ml-1">/ mile</span>
              </div>
              <p className="text-sm opacity-90 border-t border-white/20 pt-4 italic">
                Current miles required: {targetAward?.miles_required.toLocaleString()}
              </p>
            </div>
            <button className="w-full py-4 bg-white text-blue-600 font-black rounded-2xl hover:bg-blue-50 transition-colors shadow-lg">
              BOOK ON {targetAward?.program.toUpperCase()}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}