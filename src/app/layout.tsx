
import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { Toaster } from "@/components/ui/toaster"
import { TooltipProvider } from '@radix-ui/react-tooltip';
import { AuthProvider } from '@/contexts/auth-context';

export const metadata: Metadata = {
  title: 'BidExpert - Leilões Online',
  description: 'Seu parceiro especialista em leilões online.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const activeDatabaseSystem = process.env.ACTIVE_DATABASE_SYSTEM || 'FIRESTORE';
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,300..800;1,300..800&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased flex flex-col min-h-screen bg-background dark:bg-background">
        <AuthProvider>
          <TooltipProvider>
            <Header />
            <main className="flex-grow container mx-auto px-4 py-8">
              {children}
            </main>
          </TooltipProvider>
          <Footer activeDatabaseSystem={activeDatabaseSystem} />
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}

