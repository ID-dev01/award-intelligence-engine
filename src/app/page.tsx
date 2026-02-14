"use client";
import React, { useState, useMemo } from 'react';
import { PlaneTakeoff, Wallet, TrendingUp, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { AwardEngine, Card, AwardOption } from '@/lib/engine';

export default function Dashboard() {
  // 1. Setup Mock User Data (In a real app, this comes from Supabase)
  const [portfolio] = useState<Card[]>([
    { name: 'Amex Gold', points: 175000 },
    { name: 'Capital One Venture X', points: 60000 },
    { name: 'Bilt', points: 22000 },
    { name: 'Chase UR', points: 13000 }
  ]);

  const [targetAward] = useState<AwardOption>({
    airline: 'Air India',
    program: 'Aeroplan',
    miles_required: 90000,
    tax_usd: 60,
    cash_equivalent_usd: 4200
  });

  // 2. Initialize the Engine and Calculate Strategy
  const engine = useMemo(() => new AwardEngine(), []);
  const strategy = useMemo(() => engine.optimize(portfolio, targetAward), [portfolio, targetAward]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-4 md:p-8 font-sans">
      {/* --- HEADER --- */}
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Award Intelligence Engine</h1>
          <p className="text-slate-400 mt-1 flex items-center gap-2">
            Route: <span className="text-blue-400 font-mono">BOM ⇄ JFK</span> (Non-stop Business)
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          {portfolio.map(card => (
            <div key={card.name} className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-lg">
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{card.name}</p>
              <p className="font-mono font-bold text-blue-400">{card.points.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* --- MAIN PANEL: OPTIMIZATION --- */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-600/10 blur-[100px] rounded-full"></div>
            
            <div className="flex justify-between items-center mb-8 relative">
              <h2 className="text-xl font-semibold flex items-center gap-3">
                <PlaneTakeoff className="text-blue-400" size={24} /> 
                Best Bookable Redemption
              </h2>
              <div className="flex gap-2">
                <span className="bg-green-500/10 text-green-400 text-[10px] font-black px-3 py-1 rounded-full border border-green-500/20 uppercase tracking-tighter">
                  Saver Level
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10 relative">
              <div className="space-y-1">
                <p className="text-5xl font-extrabold tracking-tighter">
                  {targetAward.miles_required.toLocaleString()} 
                  <span className="text-lg font-medium text-slate-500 ml-2 italic">miles</span>
                </p>
                <p className="text-slate-400 flex items-center gap-1 italic">
                  + ${targetAward.tax_usd.toFixed(2)} carrier fees
                </p>
              </div>
              
              <div className="md:text-right flex flex-col justify-end">
                <p className="text-3xl font-bold text-blue-400">{strategy.cpp}¢</p>
                <p className="text-slate-500 text-sm uppercase font-bold tracking-widest leading-none">Net Value Per Point</p>
                <p className="text-green-400 text-xs mt-2 font-medium italic">Target: {">"} 2.0¢</p>
              </div>
            </div>

            {/* Transfer Logic Visualizer */}
            <div className="space-y-6 bg-slate-950/50 p-6 rounded-2xl border border-slate-800/50 relative">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Optimal Transfer Strategy</h3>
              
              <div className="space-y-4">
                {strategy.transfers.map((step, idx) => (
                  <div key={idx} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-xs font-bold">
                        {idx + 1}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-200">{step.bank}</p>
                        <p className="text-[10px] text-slate-500 uppercase">1:1 Transfer Ratio</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-bold text-slate-200">-{step.transfer_amount.toLocaleString()}</p>
                      <p className="text-[10px] text-green-500 font-bold uppercase tracking-tighter">
                        Bal: {step.remaining_balance.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-slate-800 mt-4">
                <div className="flex justify-between items-center italic text-sm">
                  <span className="text-slate-400">Verdict:</span>
                  <span className="text-blue-400 font-bold tracking-tight uppercase underline decoration-blue-500/30 underline-offset-4">
                    {strategy.verdict}
                  </span>
                </div>
              </div>
            </div>
            
            <button className="w-full mt-8 bg-white hover:bg-slate-200 text-slate-950 font-black py-4 rounded-xl transition-all flex items-center justify-center gap-2 group">
              Transfer & Book Now <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* --- SIDEBAR --- */}
        <div className="space-y-6">
          {/* Price Trends */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
              <TrendingUp size={16} className="text-purple-400" /> Historical Analysis
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <span className="text-xs text-slate-400 uppercase font-bold">30-Day Low</span>
                <span className="text-lg font-mono font-bold">88,000</span>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-xs text-slate-400 uppercase font-bold">Frequency</span>
                <span className="text-sm text-slate-200 italic font-medium tracking-tight">Rare (4% of flights)</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="w-[85%] h-full bg-gradient-to-r from-purple-500 to-blue-500"></div>
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed italic">
                Current price is within 2.2% of the all-time historical low for this route.
              </p>
            </div>
          </div>

          {/* New Card Strategy */}
          <div className="bg-blue-600/5 border border-blue-500/20 rounded-2xl p-6 relative overflow-hidden group hover:border-blue-500/40 transition-colors">
            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
              <CheckCircle2 size={60} />
            </div>
            <h2 className="text-sm font-black text-blue-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <AlertCircle size={16} /> Expansion Strategy
            </h2>
            <p className="text-sm text-blue-100 font-medium mb-4 italic leading-snug">
              Boost your United MileagePlus balance by 60,000 miles.
            </p>
            <div className="bg-slate-950/80 p-4 rounded-xl border border-blue-500/10">
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.1em] mb-1">Recommended Card</p>
              <p className="text-sm font-bold text-white uppercase tracking-tight">Chase Sapphire Preferred</p>
              <div className="mt-3 flex justify-between items-center">
                <span className="text-green-400 font-bold text-lg">+$1,145</span>
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Est. Net ROI</span>
              </div>
            </div>
            <button className="w-full mt-4 py-2 text-[10px] font-black text-blue-400 uppercase tracking-widest border border-blue-500/20 rounded-lg hover:bg-blue-500/10 transition-colors">
              View Eligibility →
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}