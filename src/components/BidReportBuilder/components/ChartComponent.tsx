// src/components/BidReportBuilder/components/ChartComponent.tsx
'use client';
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const sampleData = [
  { name: 'Veículos', total: 45000 },
  { name: 'Imóveis', total: 125000 },
  { name: 'Eletrônicos', total: 22000 },
  { name: 'Arte', total: 80000 },
];

export default function ChartComponent() {
  return (
    <div className="w-full h-full text-xs">
        <ResponsiveContainer>
            <BarChart data={sampleData} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" hide />
                <Tooltip 
                    cursor={{ fill: 'rgba(200,200,200,0.1)' }} 
                    contentStyle={{ fontSize: '10px', padding: '2px 5px' }}
                />
                <Bar dataKey="total" fill="hsl(var(--primary))" barSize={10} />
            </BarChart>
        </ResponsiveContainer>
    </div>
  );
}
