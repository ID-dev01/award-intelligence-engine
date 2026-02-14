"use client";
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  TrendingUp, 
  Clock, 
  ShieldCheck, 
  Plane,
  AlertCircle,
  RefreshCcw,
  Wallet
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { AwardEngine, Card, AwardOption } from '../lib/engine';
import TrendChart from '../lib/TrendChart';

export default function Dashboard() {
  // --- DYNAMIC STATE FOR USER POINTS ---
  const [portfolio, setPortfolio] = useState<Card[]>([
    { name: 'Amex Gold', points: 175000 },
    { name: 'Venture X', points: 60000 }
  ]);
  
  const [newCardName, setNewCardName] = useState('');
  const [newCardPoints, setNewCardPoints] = useState('');

  // --- EXISTING DATA FETCHING ---
  const [history, setHistory] = useState<any[]>([]);
  const [targetAward, setTargetAward] = useState<AwardOption | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const { data, error } = await supabase
        .from('award_snapshots')
        .select('*')
        .order('captured_at', { ascending: true })
        .limit(15);

      if (data && data.length > 0 && !error) {
        setHistory(data);
        const latest = data[data.length - 1];
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
    fetchData();
  }, []);

  // --- POINT MANAGEMENT FUNCTIONS ---
  const addCard = () => {
    if (!newCardName || !newCardPoints) return;
    setPortfolio([...portfolio, { name: newCardName, points: parseInt(newCardPoints) }]);
    setNewCardName('');
    setNewCardPoints('');
  };

  const removeCard = (index: number) => {
    setPortfolio(portfolio.filter((_, i) => i !== index));
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
            <div className="flex items-center gap-2 text-blue-400 font-bold tracking-tighter text-sm uppercase mb-1">
              <ShieldCheck size={16} /> Verified Route: BOM ⇄ JFK
            </div>
            <h1 className="text-4xl font-black tracking-tight tracking-tight">Award Intelligence <span className="text-blue-500">Engine</span></h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-8">
            
            {/* 1. MANAGE POINTS SECTION */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6">
              <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
                <Wallet className="text-blue-500" /> My Points Portfolio
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <input 
                  type="text" 
                  placeholder="Card Name (e.g. Chase Sapphire)" 
                  value={newCardName}
                  onChange={(e) => setNewCardName(e.target.value)}
                  className="bg-slate-950 border border-slate-700 p-3 rounded-xl focus:outline-none focus:border-blue-500 transition-all text-sm"
                />
                <input 
                  type="number" 
                  placeholder="Points Balance" 
                  value={newCardPoints}
                  onChange={(e) => setNewCardPoints(e.target.value)}
                  className="bg-slate-950 border border-slate-700 p-3 rounded-xl focus:outline-none focus:border-blue-500 transition-all text-sm"
                />
                <button 
                  onClick={addCard}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <Plus size={18} /> Add Account
                </button>
              </div>

              <div className="flex flex-wrap gap-3">
                {portfolio.map((card, idx) => (
                  <div key={idx} className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-2xl flex items-center gap-4 group">
                    <div>
                      <p className="text-[10px] text-slate-500 font-black uppercase">{card.name}</p>
                      <p className="font-bold">{card.points.toLocaleString()}</p>
                    </div>
                    <button 
                      onClick={() => removeCard(idx)}
                      className="text-slate-600 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. OPTIMAL STRATEGY (This updates automatically as you edit points!) */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8">
              <h2 className="text-xl font-bold flex items-center gap-2 mb-8 text-blue-400">
                <TrendingUp /> Target Strategy: {targetAward?.miles_required.toLocaleString()} Miles Needed
              </h2>
              
              <div className="grid gap-4">
                {strategy?.transfers.length === 0 ? (
                  <p className="text-slate-500 italic">Not enough points to cover this flight. Add more accounts above!</p>
                ) : (
                  strategy?.transfers.map((t, idx) => (
                    <div key={idx} className="bg-slate-950 border border-slate-800 p-5 rounded-2xl flex items-center justify-between border-l-4 border-l-blue-500">
                      <div>
                        <p className="text-xs text-slate-500 font-bold uppercase">Source Card</p>
                        <p className="font-bold text-lg">{t.from}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-blue-500 font-bold uppercase tracking-widest">Transfer</p>
                        <p className="text-2xl font-black">{t.amount.toLocaleString()}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* SIDEBAR */}
          <div className="space-y-6">
            <TrendChart data={history} />
            <div className="p-6 bg-gradient-to-b from-blue-600 to-blue-700 rounded-3xl text-white shadow-xl shadow-blue-900/20">
              <h3 className="font-black text-xs uppercase mb-2">Total Points Pool</h3>
              <p className="text-4xl font-black tracking-tighter">
                {portfolio.reduce((acc, card) => acc + card.points, 0).toLocaleString()}
              </p>
              <p className="text-blue-100 text-sm mt-2 opacity-80 italic">Adjust your accounts to see the logic update live.</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}