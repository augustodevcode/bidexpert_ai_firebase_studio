// src/components/admin/analysis/auction-gantt-chart.tsx
'use client';

import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { AuctionPerformanceData } from '@/app/admin/auctions/analysis/actions';
import { format, differenceInDays, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';

interface GanttChartData {
  name: string;
  range: [number, number];
  stages?: { name: string; range: [number, number] }[];
}

const CustomTooltip = ({ active, payload, label }: any) => {  
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const startDate = new Date(data.range[0]);
    const endDate = new Date(data.range[1]);

    return (
      <Card className="p-3 shadow-lg">
        <p className="font-bold text-primary">{`${label}`}</p>
        <p className="text-sm">
          {`Início: ${format(startDate, 'dd/MM/yyyy')}`}
        </p>
        <p className="text-sm">
          {`Fim: ${format(endDate, 'dd/MM/yyyy')}`}
        </p>
        {data.stages && (
            <div className="mt-2 border-t pt-2">
                {data.stages.map((stage: any, index: number) => {
                    const stageStart = new Date(stage.range[0]);
                    const stageEnd = new Date(stage.range[1]);
                    return <p key={index} className="text-xs">{stage.name}: {format(stageStart, 'dd/MM')} - {format(stageEnd, 'dd/MM')}</p>
                })}
            </div>
        )}
      </Card>
    );
  }

  return null;
};


export default function AuctionGanttChart({ auctions }: { auctions: AuctionPerformanceData[] }) {
  const { chartData, domain } = useMemo(() => {
    if (!auctions || auctions.length === 0) {
      return { chartData: [], domain: [0,0] };
    }

    const allDates = auctions.flatMap(a => [
        new Date(a.auctionDate),
        ...(a.auctionStages || []).map(s => new Date(s.endDate))
    ]);

    const minDate = Math.min(...allDates.map(d => d.getTime()));
    const maxDate = Math.max(...allDates.map(d => d.getTime()));

    const ganttData: GanttChartData[] = auctions
        .filter(a => a.auctionDate)
        .map(auction => {
            const start = new Date(auction.auctionDate);
            const end = auction.auctionStages && auction.auctionStages.length > 0 
                ? new Date(Math.max(...auction.auctionStages.map(s => new Date(s.endDate).getTime())))
                : start;
            
            const startDay = differenceInDays(start, minDate);
            const endDay = differenceInDays(end, minDate);

            const stages = auction.auctionStages?.map((stage, index) => {
                const stageStart = index > 0 ? new Date(auction.auctionStages![index-1].endDate) : start;
                const stageEnd = new Date(stage.endDate);
                return {
                    name: stage.name,
                    range: [stageStart.getTime(), stageEnd.getTime()]
                }
            })

            return {
                name: auction.title,
                range: [start.getTime(), end.getTime()],
                stages
            };
        })
        .sort((a, b) => a.range[0] - b.range[0]);

    return { 
        chartData: ganttData, 
        domain: [minDate, maxDate]
    };
  }, [auctions]);

  if (chartData.length === 0) {
    return <div className="flex items-center justify-center h-full text-muted-foreground">Nenhum leilão com data para exibir.</div>;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 5, right: 30, left: 100, bottom: 20 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
            type="number" 
            domain={['dataMin', 'dataMax']}
            tickFormatter={(unixTime) => format(new Date(unixTime), 'dd/MM/yy', { locale: ptBR })}
            angle={-30}
            textAnchor="end"
            height={50}
            scale="time"
        />
        <YAxis 
            dataKey="name" 
            type="category" 
            width={150} 
            tick={{ fontSize: 10 }}
            tickFormatter={(value) => value.length > 25 ? `${value.substring(0, 25)}...` : value}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <ReferenceLine x={startOfDay(new Date()).getTime()} stroke="hsl(var(--destructive))" strokeDasharray="3 3" label={{ value: 'Hoje', position: 'insideTop', fill: 'hsl(var(--destructive))' }}/>
        <Bar dataKey="range" name="Duração do Leilão" fill="hsl(var(--primary))" barSize={10} />
      </BarChart>
    </ResponsiveContainer>
  );
}
