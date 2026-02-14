"use client";
import React, { useState, useMemo, useEffect } from 'react';
import { 
  TrendingUp, 
  Clock, 
  ArrowUpRight, 
  ShieldCheck, 
  Plane,
  AlertCircle,
  RefreshCcw
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { AwardEngine, Card, AwardOption, TransferResult } from '../lib/engine';
import TrendChart from '../lib/TrendChart';

export default function Dashboard() {
  const [portfolio] = useState<Card[]>([
    { name: 'Amex Gold', points: 175000 },
    { name: 'Venture X', points: 60000 },
    { name: 'Bilt', points: 22000 },
    { name: 'Chase UR', points: 13000 }
  ]);

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

  if (!targetAward) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
      <AlertCircle className="text-amber-500 w-12 h-12 mb-4" />
      <h2 className="text-xl font-bold text-white">Database Connection Empty</h2>
      <p className="text-slate-400 mt-2 max-w-xs">Please add a row to your Supabase "award_snapshots" table to see the dashboard.</p>
    </div>
  );

  const cpp = ((targetAward.cash_equivalent_usd - targetAward.tax_usd) / targetAward.miles_required) * 100;

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
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-400">
              <Plane size={20} />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase">Target Airline</p>
              <p className="font-bold text-lg">{targetAward.airline}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-8 shadow-2xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                <div>
                  <p className="text-slate-400 font-medium mb-1">Business Class Award</p>
                  <div className="text-7xl font-black tracking-tighter flex items-start">
                    {targetAward.miles_required.toLocaleString()}
                    <span className="text-xl text-blue-500 ml-2 mt-4 font-bold uppercase">Miles</span>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1 bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl text-center">
                    <p className="text-[10px] text-blue-400 font-black uppercase mb-1">VALUATION</p>
                    <p className="text-xl font-bold text-blue-400">{cpp.toFixed(1)}¢ <span className="text-xs">/ mile</span></p>
                  </div>
                </div>
              </div>
            </div>

            {/* STRATEGY LIST */}
            <div className="bg-slate-900/30 border border-slate-800/50 rounded-3xl p-8">
              <h2 className="text-xl font-bold flex items-center gap-2 mb-8">
                <TrendingUp className="text-blue-500" /> Optimal Transfer Strategy
              </h2>
              
              <div className="grid gap-4">
                {strategy?.transfers.map((t, idx) => (
                  <div key={idx} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between group hover:border-blue-500/50 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center font-black text-slate-400">
                        {t.from[0]}
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Source Card</p>
                        <p className="font-bold">{t.from}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-blue-500 font-bold uppercase">Transfer Amount</p>
                      <p className="text-xl font-black">{t.amount.toLocaleString()} <span className="text-xs font-normal text-slate-500 italic">pts</span></p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <TrendChart data={history} />
            <button className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl transition-all shadow-lg shadow-blue-900/20">
              BOOK VIA {targetAward.program.toUpperCase()}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}