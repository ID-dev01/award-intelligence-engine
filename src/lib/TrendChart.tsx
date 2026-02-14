"use client";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function TrendChart({ data }: { data: any[] }) {
  return (
    <div className="h-[250px] w-full bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
      <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">7-Day Price History</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis 
            dataKey="captured_at" 
            hide 
          />
          <YAxis 
            domain={['dataMin - 5000', 'dataMax + 5000']} 
            hide 
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
            itemStyle={{ color: '#60a5fa', fontWeight: 'bold' }}
          />
          <Line 
            type="monotone" 
            dataKey="miles_required" 
            stroke="#3b82f6" 
            strokeWidth={3} 
            dot={{ r: 4, fill: '#3b82f6' }} 
            activeDot={{ r: 8 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}