// src/contexts/widget-preferences-context.tsx
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { DollarSign, Gavel, Package, Users } from 'lucide-react';
import { useLocalStorage } from '@/hooks/use-local-storage';

const WIDGET_PREFERENCES_KEY = 'bidexpert-widget-preferences';

// Define the shape of a widget for consistency
export const availableWidgets = [
  { id: 'totalRevenue', label: 'Faturamento Total', description: 'Soma de todos os lotes vendidos.', icon: DollarSign },
  { id: 'activeAuctions', label: 'Leilões Ativos', description: 'Leilões abertos para lances.', icon: Gavel },
  { id: 'lotsSoldCount', label: 'Lotes Vendidos', description: 'Total de lotes arrematados.', icon: Package },
  { id: 'newUsers', label: 'Novos Usuários (30d)', description: 'Novos registros no último mês.', icon: Users },
];

interface WidgetPreferencesContextType {
  selectedWidgets: string[];
  setSelectedWidgets: (widgetIds: string[]) => void;
  isWidgetVisible: (widgetId: string) => boolean;
}

// Create the context with a default value
const WidgetPreferencesContext = createContext<WidgetPreferencesContextType | undefined>(undefined);

// Create a provider component
export function WidgetPreferencesProvider({ children }: { children: ReactNode }) {
  const defaultWidgets = availableWidgets.map(w => w.id);
  
  // Use the useLocalStorage hook to persist state
  const [selectedWidgets, setSelectedWidgets] = useLocalStorage<string[]>(
    WIDGET_PREFERENCES_KEY,
    defaultWidgets
  );

  const isWidgetVisible = (widgetId: string) => selectedWidgets.includes(widgetId);

  const value = { selectedWidgets, setSelectedWidgets, isWidgetVisible };

  return (
    <WidgetPreferencesContext.Provider value={value}>
      {children}
    </WidgetPreferencesContext.Provider>
  );
}

// Create a custom hook to use the context
export function useWidgetPreferences() {
  const context = useContext(WidgetPreferencesContext);
  if (context === undefined) {
    throw new Error('useWidgetPreferences must be used within a WidgetPreferencesProvider');
  }
  return context;
}
