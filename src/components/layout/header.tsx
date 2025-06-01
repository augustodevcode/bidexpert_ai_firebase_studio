
'use client';

import Link from 'next/link';
import { Coins, Search, Menu, ShoppingCart, Heart, ChevronDown } from 'lucide-react';
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
} from "@/components/ui/dropdown-menu";
import { getUniqueLotCategories, slugify } from '@/lib/sample-data'; // Importar slugify
import { useEffect, useState } from 'react';

export default function Header() {
  const [lotCategories, setLotCategories] = useState<string[]>([]);

  useEffect(() => {
    setLotCategories(getUniqueLotCategories());
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-20 items-center">
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
                <Link href="/" className="flex items-center space-x-2 text-lg font-semibold">
                  <Coins className="h-6 w-6 text-primary" />
                  <span>BidExpert</span>
                </Link>
                <MainNav className="flex-col items-start space-x-0 space-y-2" />
                 <div className="mt-4">
                  <UserNav />
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>

        <Link href="/" className="mr-6 flex items-center space-x-2">
          <Coins className="h-8 w-8 text-primary" />
          <span className="font-bold sm:inline-block text-2xl">
            BidExpert
          </span>
        </Link>
        
        <div className="hidden md:flex flex-1 justify-center items-center">
          <MainNav className="mx-auto" />
        </div>


        <div className="ml-auto flex items-center space-x-2 md:space-x-4">
          <form className="relative hidden lg:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar em 20,000+ produtos..."
              className="h-10 pl-10 w-full md:w-[250px] lg:w-[350px] rounded-full"
            />
             <Button type="submit" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full">
              <Search className="h-4 w-4" />
               <span className="sr-only">Buscar</span>
            </Button>
          </form>
          <Button variant="ghost" size="icon" className="relative hidden md:inline-flex">
            <Heart className="h-6 w-6" />
            <Badge variant="destructive" className="absolute -top-1 -right-1 px-1.5 py-0.5 text-xs">0</Badge>
            <span className="sr-only">Favoritos</span>
          </Button>
           <Button variant="ghost" size="icon" className="relative hidden md:inline-flex">
            <ShoppingCart className="h-6 w-6" />
             <Badge variant="destructive" className="absolute -top-1 -right-1 px-1.5 py-0.5 text-xs">0</Badge>
            <span className="sr-only">Carrinho</span>
          </Button>
          <div className="hidden md:block">
             <UserNav />
          </div>
        </div>
      </div>
      <div className="border-t bg-primary/90 text-primary-foreground hidden md:block">
        <div className="container flex h-12 items-center">
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="text-sm font-medium hover:bg-primary/80">
                    <Menu className="mr-2 h-5 w-5" /> Categorias <ChevronDown className="ml-1 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="bg-primary text-primary-foreground">
                  {lotCategories.map((category) => (
                    <DropdownMenuItem key={category} asChild className="hover:bg-primary/80 focus:bg-primary/70 cursor-pointer">
                      <Link href={`/search?category=${slugify(category)}`}>{category}</Link>
                    </DropdownMenuItem>
                  ))}
                   {lotCategories.length === 0 && <DropdownMenuItem disabled>Nenhuma categoria</DropdownMenuItem>}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <nav className="flex items-center space-x-6 text-sm font-medium ml-auto">
                <Link href="/sell-with-us" className="hover:underline">Venda Conosco</Link>
                <Link href="/sellers" className="hover:underline">Comitentes</Link>
                <Link href="/contact" className="hover:underline">Fale Conosco</Link>
            </nav>
        </div>
      </div>
    </header>
  );
}
