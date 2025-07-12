// src/components/setup/settings-step.tsx
'use client';

import { useState } from 'react';
import { CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface SettingsStepProps {
  onNext: () => void;
  onPrev: () => void;
}

export default function SettingsStep({ onNext, onPrev }: SettingsStepProps) {
  // Placeholder for settings form
  return (
    <>
      <CardHeader>
        <CardTitle>Configurações da Plataforma</CardTitle>
        <CardDescription>Defina as configurações iniciais do seu site. Você poderá alterá-las depois no painel de administração.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-center py-10">
            Formulário de configurações será implementado aqui.
        </p>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onPrev}>Voltar</Button>
        <Button onClick={onNext}>Avançar</Button>
      </CardFooter>
    </>
  );
}