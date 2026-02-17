"use client";
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, Trash2, TrendingUp, ShieldCheck, Plane, 
  RefreshCcw, Wallet, Coins, Zap, ArrowUpRight 
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { AwardEngine, Card, AwardOption } from '../lib/engine';
import TrendChart from '../lib/TrendChart';

export default function Dashboard() {
  const [portfolio, setPortfolio] = useState<Card[]>([]);
  const [origin, setOrigin] = useState('BOM');
  const [destination, setDestination] = useState('JFK');
  const [newCardName, setNewCardName] = useState('');
  const [newCardPoints, setNewCardPoints] = useState('');
  const [history, setHistory] = useState<any[]>([]);
  const [targetAward, setTargetAward] = useState<AwardOption | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initDashboard() {
      setLoading(true);
      
      // 1. Fetch Route Settings
      const { data: settings } = await supabase
        .from('app_settings')
        .select('*')
        .single();
      if (settings) {
        setOrigin(settings.origin_code);
        setDestination(settings.destination_code);
      }

      // 2. Fetch Portfolio
      const { data: pointsData } = await supabase.from('user_points').select('*').order('created_at', { ascending: true });
      if (pointsData) {
        setPortfolio(pointsData.map(p => ({ id: p.id, name: p.card_name, points: p.points_balance })));
      }

      // 3. Fetch History
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
      setLoading(false);
    }
    initDashboard();
  }, []);

  // SAVE ROUTE TO DATABASE
  const updateRoute = async (type: 'origin' | 'dest', val: string) => {
    const upperVal = val.toUpperCase().slice(0, 3);
    if (type === 'origin') setOrigin(upperVal);
    else setDestination(upperVal);

    await supabase
      .from('app_settings')
      .update({ [type === 'origin' ? 'origin_code' : 'destination_code']: upperVal })
      .eq('id', 1);
  };

  // ... (keep addCard, removeCard, updateCardPoints from previous version) ...
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

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><RefreshCcw className="text-blue-500 animate-spin w-10 h-10" /></div>;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* EDITABLE HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-400 font-bold text-sm uppercase mb-1">
              <ShieldCheck size={16} /> Award Intelligence Engine
            </div>
            <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
              Route: 
              <input 
                value={origin} 
                onChange={(e) => updateRoute('origin', e.target.value)}
                className="bg-slate-900 border border-slate-800 w-24 px-2 py-1 rounded-lg text-blue-500 underline underline-offset-8 outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-slate-700">⇄</span>
              <input 
                value={destination} 
                onChange={(e) => updateRoute('dest', e.target.value)}
                className="bg-slate-900 border border-slate-800 w-24 px-2 py-1 rounded-lg text-blue-500 underline underline-offset-8 outline-none focus:ring-1 focus:ring-blue-500"
              />
            </h1>
          </div>
          {/* ... (rest of sidebar and cards remain same as previous version) ... */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center gap-4">
            <Plane className="text-blue-400" size={24} />
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Active Target</p>
              <p className="font-bold text-lg">{targetAward?.airline} ({targetAward?.program})</p>
            </div>
          </div>
        </div>

        {/* ... (Include Portfolio, Strategy, and Sidebar from the previous code block here) ... */}
        {/* (I've truncated the repetitive UI parts for brevity, use the full body from the previous message) */}
      </div>
    </main>
  );
}