
'use client';

import Link from 'next/link';
import { Coins, Search, Menu, ShoppingCart, Heart, ChevronDown, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import MainNav from './main-nav';
import UserNav from './user-nav';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { sampleLots } from '@/lib/sample-data'; 
import type { RecentlyViewedLotInfo } from '@/types';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { getRecentlyViewedIds } from '@/lib/recently-viewed-store';

export default function Header() {
  const [recentlyViewedItems, setRecentlyViewedItems] = useState<RecentlyViewedLotInfo[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    const viewedIds = getRecentlyViewedIds();
    const items: RecentlyViewedLotInfo[] = viewedIds.map(id => {
      const lot = sampleLots.find(l => l.id === id);
      return lot ? { 
        id: lot.id, 
        title: lot.title, 
        imageUrl: lot.imageUrl, 
        auctionId: lot.auctionId,
        dataAiHint: lot.dataAiHint 
      } : null;
    }).filter(item => item !== null) as RecentlyViewedLotInfo[];
    setRecentlyViewedItems(items);
  }, []);


  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Top Bar */}
      <div className="container flex h-20 items-center">
        <div className="flex items-center">
          <div className="md:hidden mr-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Abrir Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                <nav className="flex flex-col gap-4 mt-8">
                  <Link href="/" className="flex items-center space-x-2 text-lg font-semibold mb-4">
                    <Coins className="h-6 w-6 text-primary" />
                    <span>BidExpert</span>
                  </Link>
                  {/* MainNav for mobile drawer */}
                  <MainNav className="flex-col items-start space-x-0 space-y-2" />
                  <div className="mt-auto pt-4 border-t">
                    <UserNav />
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>

          <Link href="/" className="mr-4 flex items-center space-x-2">
            <Coins className="h-8 w-8 text-primary" />
            <span className="font-bold sm:inline-block text-2xl">
              BidExpert
            </span>
          </Link>
        </div>
        
        {/* Search bar - more central */}
        <div className="flex-1 flex justify-center px-2 sm:px-4">
          <form className="relative w-full max-w-md lg:max-w-xl">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar em 20,000+ produtos..."
              className="h-10 pl-10 w-full rounded-full bg-secondary/50 dark:bg-secondary/30"
            />
             <Button type="submit" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full">
              <Search className="h-4 w-4" />
               <span className="sr-only">Buscar</span>
            </Button>
          </form>
        </div>

        {/* Right side icons and UserNav */}
        <div className="ml-auto flex items-center space-x-1 sm:space-x-2">
          <Button variant="ghost" size="icon" className="relative">
            <Heart className="h-5 w-5 sm:h-6 sm:w-6" />
            <Badge variant="destructive" className="absolute -top-1 -right-1 px-1.5 py-0.5 text-xs">0</Badge>
            <span className="sr-only">Favoritos</span>
          </Button>
           <Button variant="ghost" size="icon" className="relative">
            <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6" />
             <Badge variant="destructive" className="absolute -top-1 -right-1 px-1.5 py-0.5 text-xs">0</Badge>
            <span className="sr-only">Carrinho</span>
          </Button>
          <UserNav />
        </div>
      </div>

      {/* Second Bar - Navigation Links */}
      <div className="border-t bg-primary/90 text-primary-foreground hidden md:block">
        <div className="container flex h-12 items-center">
            {/* Categorias Dropdown Removido */}
            <nav className="flex items-center space-x-4 lg:space-x-6 text-sm font-medium mx-auto">
                <Link href="/sell-with-us" className="hover:underline">Venda Conosco</Link>
                <Link href="/sellers" className="hover:underline">Comitentes</Link>
                <Link href="/contact" className="hover:underline">Fale Conosco</Link>
            </nav>
            <div className="ml-auto"> {/* ml-auto para empurrar o dropdown para a direita */}
              {isClient && recentlyViewedItems.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-xs hover:bg-primary/80">
                      <Eye className="mr-1 h-4 w-4" /> Vistos Recentemente <ChevronDown className="ml-1 h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80 bg-card text-card-foreground">
                    <DropdownMenuLabel>Itens Vistos Recentemente</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {recentlyViewedItems.map(item => (
                      <DropdownMenuItem key={item.id} asChild className="cursor-pointer">
                        <Link href={`/auctions/${item.auctionId}/lots/${item.id}`} className="flex items-center gap-2 py-1.5">
                          <div className="relative h-10 w-10 flex-shrink-0 bg-muted rounded-sm overflow-hidden">
                            <Image src={item.imageUrl} alt={item.title} fill className="object-cover" data-ai-hint={item.dataAiHint || "item visto recentemente"}/>
                          </div>
                          <span className="text-xs truncate flex-grow">{item.title}</span>
                        </Link>
                      </DropdownMenuItem>
                    ))}
                    {recentlyViewedItems.length === 0 && (
                        <DropdownMenuItem disabled>Nenhum item visto recentemente.</DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
        </div>
      </div>
    </header>
  );
}
