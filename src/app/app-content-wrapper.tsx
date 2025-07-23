// src/app/app-content-wrapper.tsx
'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { Loader2 } from 'lucide-react';

export function AppContentWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSetupComplete, setIsSetupComplete] = useState<boolean | null>(null);

  useEffect(() => {
    // Lógica de verificação que roda SOMENTE no navegador.
    if (typeof window !== 'undefined') {
        console.log('[AppContentWrapper] Verificando status do setup no cliente...');
        const setupFlag = localStorage.getItem('bidexpert_setup_complete');
        console.log(`[AppContentWrapper] Valor encontrado no localStorage para 'bidexpert_setup_complete': "${setupFlag}"`);
        
        const setupComplete = setupFlag === 'true';
        setIsSetupComplete(setupComplete);
        console.log(`[AppContentWrapper] Definindo isSetupComplete para: ${setupComplete}`);
    }
  }, []);

  useEffect(() => {
    // Lógica de redirecionamento
    console.log(`[AppContentWrapper] Verificando redirecionamento. Pathname: ${pathname}, isSetupComplete: ${isSetupComplete}`);
    if (isSetupComplete === false && pathname !== '/setup') {
      console.log(`[AppContentWrapper] REDIRECIONANDO para /setup porque isSetupComplete é false e pathname não é /setup.`);
      router.replace('/setup');
    }
  }, [isSetupComplete, pathname, router]);
  
  // Enquanto o status do setup está sendo determinado (estado inicial `null`), mostramos um loader.
  if (isSetupComplete === null && pathname !== '/setup') {
      console.log('[AppContentWrapper] Renderizando loader porque isSetupComplete ainda é null.');
      return (
        <div className="flex h-screen w-screen items-center justify-center bg-background">
            <Loader2 className="h-8 w-8 animate-spin text-primary"/>
            <p className="ml-3 text-muted-foreground">Verificando configuração da aplicação...</p>
        </div>
      );
  }

  const isAdminOrConsignor = pathname.startsWith('/admin') || pathname.startsWith('/consignor-dashboard');

  // Se estivermos na página de setup, renderizamos apenas o seu conteúdo.
  if (pathname === '/setup') {
    console.log('[AppContentWrapper] Renderizando a página de setup.');
    return <>{children}</>;
  }

  // Se o setup estiver incompleto, a lógica de redirecionamento acima cuidará disso.
  // Evitamos renderizar o layout principal para evitar um "flash" de conteúdo.
  if (isSetupComplete === false) {
      console.log('[AppContentWrapper] Retornando null para aguardar o redirecionamento do setup.');
      return null;
  }
  
  // Para as áreas de admin e comitente, seus próprios layouts cuidam da estrutura.
  if (isAdminOrConsignor) {
    console.log('[AppContentWrapper] Renderizando conteúdo dentro do layout de admin/consignor.');
    return <>{children}</>;
  }

  // Layout padrão para as páginas públicas.
  console.log('[AppContentWrapper] Renderizando layout público padrão.');
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        {children}
      </main>
      <Footer />
    </div>
  );
}
