
'use client';

import Link from 'next/link';
import { Coins, Search, Menu, ShoppingCart, Heart, ChevronDown, Eye, UserCircle, LayoutList, Tag, Home as HomeIcon } from 'lucide-react';
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { sampleLots, getUniqueLotCategories, slugify } from '@/lib/sample-data';
import type { RecentlyViewedLotInfo } from '@/types';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { getRecentlyViewedIds } from '@/lib/recently-viewed-store';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


export default function Header() {
  const [recentlyViewedItems, setRecentlyViewedItems] = useState<RecentlyViewedLotInfo[]>([]);
  const [topNavCategories, setTopNavCategories] = useState<{label: string, href: string}[]>([]);
  const [searchCategories, setSearchCategories] = useState<string[]>([]);
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

    const allCategories = getUniqueLotCategories();
    setSearchCategories(allCategories); // For search dropdown
    setTopNavCategories( // For second nav bar
      allCategories.slice(0, 3).map(cat => ({ // Show top 3 in nav
        label: cat,
        href: `/category/${slugify(cat)}`
      }))
    );

  }, []);


  return (
    <header className="sticky top-0 z-50 w-full shadow-md">
      {/* Top Bar - Orange Background */}
      <div className="bg-primary text-primary-foreground">
        <div className="container flex h-20 items-center">
          <div className="flex items-center">
            <div className="md:hidden mr-2">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="hover:bg-primary/80 focus-visible:ring-primary-foreground">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Abrir Menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] sm:w-[400px] p-0 bg-background text-foreground">
                  <Link href="/" className="flex items-center space-x-2 text-lg font-semibold mb-4 p-6 border-b">
                    <Avatar className="h-8 w-8 bg-primary text-primary-foreground">
                      <AvatarFallback>B</AvatarFallback>
                    </Avatar>
                    <span className="text-primary">Besa</span>
                  </Link>
                  <nav className="flex flex-col gap-1 px-4">
                    <MainNav className="flex-col items-start space-x-0 space-y-0" />
                    <div className="mt-auto pt-4 border-t">
                      <UserNav />
                    </div>
                  </nav>
                </SheetContent>
              </Sheet>
            </div>

            <Link href="/" className="mr-4 flex items-center space-x-2">
              <Avatar className="h-10 w-10 bg-primary-foreground text-primary">
                <AvatarFallback className="font-bold text-xl">B</AvatarFallback>
              </Avatar>
              <span className="font-bold text-3xl hidden sm:inline-block">
                Besa
              </span>
            </Link>
          </div>

          {/* Search Bar with Category Dropdown */}
          {isClient && (
            <div className="flex-1 flex justify-center items-center px-2 sm:px-4">
              <div className="relative flex w-full max-w-xl bg-background rounded-md shadow-sm">
                <Select defaultValue={searchCategories.length > 0 ? slugify(searchCategories[0]) : undefined}>
                  <SelectTrigger className="w-[150px] sm:w-[180px] h-10 text-xs sm:text-sm text-muted-foreground border-r border-input rounded-l-md rounded-r-none focus:ring-0 focus:ring-offset-0 bg-secondary/20">
                    <SelectValue placeholder="Categorias" />
                  </SelectTrigger>
                  <SelectContent>
                    {searchCategories.map(cat => (
                      <SelectItem key={slugify(cat)} value={slugify(cat)} className="text-xs sm:text-sm">
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="search"
                  placeholder="Buscar em 20,000+ produtos..."
                  className="h-10 pl-3 pr-10 flex-1 rounded-l-none rounded-r-md border-l-0 focus:ring-0 focus:ring-offset-0 text-foreground placeholder:text-muted-foreground"
                />
                <Button type="submit" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Search className="h-4 w-4" />
                  <span className="sr-only">Buscar</span>
                </Button>
              </div>
            </div>
          )}


          <div className="ml-auto flex items-center space-x-1 sm:space-x-2">
            <UserNav /> {/* UserNav now includes Login/Register or Profile Dropdown */}
            <Button variant="ghost" size="icon" className="relative hover:bg-primary/80 focus-visible:ring-primary-foreground">
              <Heart className="h-5 w-5 sm:h-6 sm:w-6" />
              <Badge variant="destructive" className="absolute -top-1 -right-1 px-1.5 py-0.5 text-xs bg-primary-foreground text-primary border-primary">0</Badge>
              <span className="sr-only">Favoritos</span>
            </Button>
            <Button variant="ghost" size="icon" className="relative hover:bg-primary/80 focus-visible:ring-primary-foreground">
              <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6" />
              <Badge variant="destructive" className="absolute -top-1 -right-1 px-1.5 py-0.5 text-xs bg-primary-foreground text-primary border-primary">0</Badge>
              <span className="sr-only">Carrinho</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Second Bar - Navigation Links - White Background */}
      <div className="border-b bg-background text-foreground hidden md:block">
        <div className="container flex h-12 items-center">
          <nav className="flex items-center space-x-4 lg:space-x-5 text-sm font-medium">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <Link href="/search" className="hover:text-primary transition-colors">Shop</Link> {/* Placeholder for "Shop" */}
            <Link href="#" className="hover:text-primary transition-colors">Pages</Link> {/* Placeholder */}
            {isClient && topNavCategories.map(cat => (
              <Link key={cat.href} href={cat.href} className="hover:text-primary transition-colors">
                {cat.label}
              </Link>
            ))}
            <Link href="#" className="hover:text-primary transition-colors">Blog</Link> {/* Placeholder */}
            <Link href="/sell-with-us" className="hover:text-primary transition-colors">Become A Vendor</Link>
            <Link href="#" className="hover:text-primary transition-colors">Flash Deals</Link> {/* Placeholder */}
          </nav>
          <div className="ml-auto">
            {isClient && recentlyViewedItems.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-sm font-medium hover:bg-accent hover:text-accent-foreground">
                    Recently Viewed <ChevronDown className="ml-1 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 bg-card text-card-foreground">
                  <DropdownMenuLabel>Itens Vistos Recentemente</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {recentlyViewedItems.map(item => (
                    <DropdownMenuItem key={item.id} asChild className="cursor-pointer">
                      <Link href={`/auctions/${item.auctionId}/lots/${item.id}`} className="flex items-center gap-2 py-1.5">
                        <div className="relative h-12 w-12 flex-shrink-0 bg-muted rounded-sm overflow-hidden">
                          <Image src={item.imageUrl} alt={item.title} fill className="object-cover" data-ai-hint={item.dataAiHint || "item visto recentemente"} />
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
