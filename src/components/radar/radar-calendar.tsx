// src/components/radar/radar-calendar.tsx
/**
 * @fileoverview Calendário estilo Outlook para exibição de leilões.
 * Suporta visualizações de semana, mês e ano.
 */
'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Auction } from '@/types';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, addWeeks, subWeeks, isToday, addYears, subYears, startOfYear, endOfYear, eachMonthOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MapPin } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

type ViewMode = 'week' | 'month' | 'year';

interface RadarCalendarProps {
  auctions: Auction[];
  className?: string;
}

export default function RadarCalendar({ auctions, className }: RadarCalendarProps) {
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [viewMode, setViewMode] = React.useState<ViewMode>('week');

  const navigatePrevious = () => {
    if (viewMode === 'week') setCurrentDate(subWeeks(currentDate, 1));
    else if (viewMode === 'month') setCurrentDate(subMonths(currentDate, 1));
    else setCurrentDate(subYears(currentDate, 1));
  };

  const navigateNext = () => {
    if (viewMode === 'week') setCurrentDate(addWeeks(currentDate, 1));
    else if (viewMode === 'month') setCurrentDate(addMonths(currentDate, 1));
    else setCurrentDate(addYears(currentDate, 1));
  };

  const navigateToday = () => setCurrentDate(new Date());

  const getAuctionsForDate = (date: Date) => {
    return auctions.filter(auction => 
      auction.auctionDate && isSameDay(new Date(auction.auctionDate), date)
    );
  };

  const getAuctionsForMonth = (date: Date) => {
    return auctions.filter(auction => 
      auction.auctionDate && isSameMonth(new Date(auction.auctionDate), date)
    );
  };

  const headerLabel = React.useMemo(() => {
    if (viewMode === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 0 });
      const end = endOfWeek(currentDate, { weekStartsOn: 0 });
      return `${format(start, 'd', { locale: ptBR })} - ${format(end, 'd MMM yyyy', { locale: ptBR })}`;
    }
    if (viewMode === 'month') {
      return format(currentDate, 'MMMM yyyy', { locale: ptBR });
    }
    return format(currentDate, 'yyyy', { locale: ptBR });
  }, [currentDate, viewMode]);

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            Agenda de Leilões
          </CardTitle>
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="week">Semana</TabsTrigger>
              <TabsTrigger value="month">Mês</TabsTrigger>
              <TabsTrigger value="year">Ano</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" onClick={navigatePrevious}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={navigateNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={navigateToday} className="ml-2">
              Hoje
            </Button>
          </div>
          <h3 className="text-lg font-semibold capitalize">{headerLabel}</h3>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {viewMode === 'week' && <WeekView currentDate={currentDate} auctions={auctions} getAuctionsForDate={getAuctionsForDate} />}
        {viewMode === 'month' && <MonthView currentDate={currentDate} auctions={auctions} getAuctionsForDate={getAuctionsForDate} />}
        {viewMode === 'year' && <YearView currentDate={currentDate} auctions={auctions} getAuctionsForMonth={getAuctionsForMonth} setCurrentDate={setCurrentDate} setViewMode={setViewMode} />}
      </CardContent>
    </Card>
  );
}

interface WeekViewProps {
  currentDate: Date;
  auctions: Auction[];
  getAuctionsForDate: (date: Date) => Auction[];
}

function WeekView({ currentDate, getAuctionsForDate }: WeekViewProps) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  return (
    <div className="grid grid-cols-7 border-t">
      {days.map((day, idx) => {
        const dayAuctions = getAuctionsForDate(day);
        const dayIsToday = isToday(day);
        return (
          <div key={idx} className={cn('border-r last:border-r-0 min-h-[200px]', dayIsToday && 'bg-primary/5')}>
            <div className={cn(
              'p-2 text-center border-b',
              dayIsToday && 'bg-primary text-primary-foreground'
            )}>
              <div className="text-xs uppercase">{format(day, 'EEE', { locale: ptBR })}</div>
              <div className="text-lg font-bold">{format(day, 'd')}</div>
            </div>
            <ScrollArea className="h-[160px] p-1">
              <div className="space-y-1">
                {dayAuctions.map(auction => (
                  <AuctionEventCard key={auction.id} auction={auction} compact />
                ))}
                {dayAuctions.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">-</p>
                )}
              </div>
            </ScrollArea>
          </div>
        );
      })}
    </div>
  );
}

interface MonthViewProps {
  currentDate: Date;
  auctions: Auction[];
  getAuctionsForDate: (date: Date) => Auction[];
}

function MonthView({ currentDate, getAuctionsForDate }: MonthViewProps) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const weekStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return (
    <div className="border-t">
      {/* Header dos dias da semana */}
      <div className="grid grid-cols-7 border-b">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, idx) => (
          <div key={idx} className="p-2 text-center text-xs font-medium text-muted-foreground border-r last:border-r-0">
            {day}
          </div>
        ))}
      </div>
      
      {/* Semanas */}
      {weeks.map((week, weekIdx) => (
        <div key={weekIdx} className="grid grid-cols-7">
          {week.map((day, dayIdx) => {
            const dayAuctions = getAuctionsForDate(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const dayIsToday = isToday(day);
            return (
              <div 
                key={dayIdx} 
                className={cn(
                  'border-r border-b last:border-r-0 min-h-[100px] p-1',
                  !isCurrentMonth && 'bg-muted/30',
                  dayIsToday && 'bg-primary/5'
                )}
              >
                <div className={cn(
                  'text-sm font-medium mb-1 h-6 w-6 flex items-center justify-center rounded-full',
                  dayIsToday && 'bg-primary text-primary-foreground',
                  !isCurrentMonth && 'text-muted-foreground'
                )}>
                  {format(day, 'd')}
                </div>
                <div className="space-y-0.5">
                  {dayAuctions.slice(0, 2).map(auction => (
                    <AuctionEventCard key={auction.id} auction={auction} compact />
                  ))}
                  {dayAuctions.length > 2 && (
                    <Badge variant="outline" className="w-full justify-center text-xs">
                      +{dayAuctions.length - 2} mais
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

interface YearViewProps {
  currentDate: Date;
  auctions: Auction[];
  getAuctionsForMonth: (date: Date) => Auction[];
  setCurrentDate: (date: Date) => void;
  setViewMode: (mode: ViewMode) => void;
}

function YearView({ currentDate, getAuctionsForMonth, setCurrentDate, setViewMode }: YearViewProps) {
  const yearStart = startOfYear(currentDate);
  const yearEnd = endOfYear(currentDate);
  const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 p-4">
      {months.map((month, idx) => {
        const monthAuctions = getAuctionsForMonth(month);
        const isCurrentMonth = isSameMonth(month, new Date());
        return (
          <button
            key={idx}
            onClick={() => {
              setCurrentDate(month);
              setViewMode('month');
            }}
            className={cn(
              'p-3 rounded-lg border text-left hover:bg-accent transition-colors',
              isCurrentMonth && 'border-primary bg-primary/5'
            )}
          >
            <div className="font-medium capitalize text-sm">
              {format(month, 'MMMM', { locale: ptBR })}
            </div>
            {monthAuctions.length > 0 ? (
              <Badge variant="secondary" className="mt-1">
                {monthAuctions.length} leilão(ões)
              </Badge>
            ) : (
              <span className="text-xs text-muted-foreground">Sem eventos</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

interface AuctionEventCardProps {
  auction: Auction;
  compact?: boolean;
}

function AuctionEventCard({ auction, compact }: AuctionEventCardProps) {
  if (compact) {
    return (
      <Link href={`/auctions/${auction.id}`}>
        <div className="bg-primary/10 hover:bg-primary/20 rounded px-1.5 py-0.5 text-xs truncate cursor-pointer transition-colors">
          <span className="font-medium">{format(new Date(auction.auctionDate!), 'HH:mm')}</span>
          <span className="ml-1 text-muted-foreground truncate">{auction.title}</span>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/auctions/${auction.id}`}>
      <div className="p-2 rounded-lg border bg-card hover:bg-accent transition-colors">
        <p className="font-medium text-sm line-clamp-1">{auction.title}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
          <Clock className="h-3 w-3" />
          {format(new Date(auction.auctionDate!), 'HH:mm')}
          {auction.address && (
            <>
              <MapPin className="h-3 w-3 ml-1" />
              {auction.address}
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
