
'use client';

import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { Toaster } from "@/components/ui/toaster"
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider } from '@/contexts/auth-context';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// Metadata can be defined as a static object if not dynamic
export const metadata: Metadata = {
  title: 'BidExpert - Leilões Online',
  description: 'Seu parceiro especialista em leilões online.',
};

function AppContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSetupComplete, setIsSetupComplete] = useState<boolean | null>(null);

  useEffect(() => {
    // This check only runs on the client-side after hydration
    const setupFlag = localStorage.getItem('bidexpert_setup_complete');
    setIsSetupComplete(setupFlag === 'true');
  }, []);

  useEffect(() => {
    if (isSetupComplete === false && pathname !== '/setup') {
      router.replace('/setup');
    }
  }, [isSetupComplete, pathname, router]);
  
  // Render a loading state or nothing while checking setup status
  if (isSetupComplete === null) {
      return null; // Or a loading spinner
  }

  // If on the setup page, render it without the main layout
  if (pathname === '/setup') {
    return <>{children}</>;
  }

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,300..800;1,300..800&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-background text-foreground">
        <AuthProvider>
          <TooltipProvider delayDuration={0}>
            <AppContent>{children}</AppContent>
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </body>
    </html>
  );
}