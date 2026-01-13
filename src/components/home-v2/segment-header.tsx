/**
 * @file SegmentHeader Component
 * @description Main header component for segment pages with logo, search,
 * navigation menu, and user actions. Responsive with mobile drawer.
 */
'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { 
  Search, Menu, X, ChevronDown, User, Heart, Bell, 
  HelpCircle, Phone, FileText, Info, ShoppingCart,
  Car, Home, Cog, Laptop, Gavel, LogIn
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuLink,
} from '@/components/ui/navigation-menu';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { SEGMENT_CONFIGS, SEGMENT_ORDER, type SegmentType } from './segment-config';
import type { SegmentConfig } from './types';

const SEGMENT_ICONS: Record<SegmentType, React.ElementType> = {
  veiculos: Car,
  imoveis: Home,
  maquinas: Cog,
  tecnologia: Laptop,
};

interface SegmentHeaderProps {
  activeSegment?: SegmentType;
  platformSettings?: {
    siteTitle?: string;
    logoUrl?: string;
  } | null;
}

export default function SegmentHeader({ 
  activeSegment,
  platformSettings 
}: SegmentHeaderProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchRef = useRef<HTMLInputElement>(null);
  const { userProfileWithPermissions } = useAuth();

  const siteTitle = platformSettings?.siteTitle || 'BidExpert';
  const logoUrl = platformSettings?.logoUrl;

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      const segment = activeSegment ? `&segment=${activeSegment}` : '';
      router.push(`/search?q=${encodeURIComponent(searchTerm.trim())}${segment}`);
    }
  }, [searchTerm, activeSegment, router]);

  const topLinks = [
    { href: '/faq#como-comprar', label: 'Como Comprar', icon: HelpCircle },
    { href: '/sell-with-us', label: 'Como Vender', icon: ShoppingCart },
    { href: '/about', label: 'Quem Somos', icon: Info },
    { href: '/faq', label: 'FAQ', icon: FileText },
    { href: '/contact', label: 'Fale Conosco', icon: Phone },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Top bar */}
      <div className="hidden md:block border-b bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex h-9 items-center justify-between text-xs">
            <div className="flex items-center gap-4">
              {topLinks.slice(0, 3).map((link) => (
                <Link 
                  key={link.href}
                  href={link.href}
                  className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                >
                  <link.icon className="h-3 w-3" />
                  {link.label}
                </Link>
              ))}
            </div>
            <div className="flex items-center gap-4">
              {topLinks.slice(3).map((link) => (
                <Link 
                  key={link.href}
                  href={link.href}
                  className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                >
                  <link.icon className="h-3 w-3" />
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            {logoUrl ? (
              <Image 
                src={logoUrl} 
                alt={siteTitle} 
                width={140} 
                height={40} 
                className="h-8 w-auto"
              />
            ) : (
              <>
                <Gavel className="h-7 w-7 text-primary" />
                <span className="font-bold text-xl hidden sm:inline">{siteTitle}</span>
              </>
            )}
          </Link>

          {/* Search bar - desktop */}
          <form 
            onSubmit={handleSearch}
            className="hidden md:flex flex-1 max-w-xl mx-4"
          >
            <div className={cn(
              "relative flex w-full rounded-lg border transition-all duration-200",
              isSearchFocused ? "ring-2 ring-primary/30 border-primary" : "border-input"
            )}>
              <Input
                ref={searchRef}
                type="text"
                placeholder="Busque por evento, lote ou produto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                className="flex-1 border-0 focus-visible:ring-0 rounded-r-none"
              />
              <Button 
                type="submit" 
                size="sm"
                className="rounded-l-none px-4"
              >
                <Search className="h-4 w-4" />
                <span className="sr-only">Buscar</span>
              </Button>
            </div>
          </form>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="hidden sm:flex" asChild>
              <Link href="/favorites">
                <Heart className="h-5 w-5" />
                <span className="sr-only">Favoritos</span>
              </Link>
            </Button>

            {userProfileWithPermissions ? (
              <>
                <Button variant="ghost" size="icon" className="relative" asChild>
                  <Link href="/profile/notifications">
                    <Bell className="h-5 w-5" />
                    <span className="sr-only">Notificações</span>
                  </Link>
                </Button>
                <Button variant="outline" size="sm" className="hidden sm:flex" asChild>
                  <Link href="/profile">
                    <User className="h-4 w-4 mr-2" />
                    Minha Conta
                  </Link>
                </Button>
              </>
            ) : (
              <Button size="sm" className="hidden sm:flex" asChild>
                <Link href="/auth/login">
                  <LogIn className="h-4 w-4 mr-2" />
                  Entrar / Criar conta
                </Link>
              </Button>
            )}

            {/* Mobile menu trigger */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] p-0">
                <SheetHeader className="p-4 border-b">
                  <SheetTitle className="flex items-center gap-2">
                    <Gavel className="h-5 w-5 text-primary" />
                    {siteTitle}
                  </SheetTitle>
                </SheetHeader>
                <ScrollArea className="h-[calc(100vh-60px)]">
                  <div className="p-4 space-y-4">
                    {/* Mobile search */}
                    <form onSubmit={handleSearch}>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="text"
                          placeholder="Buscar..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                    </form>

                    {/* Segments */}
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase px-2">Segmentos</p>
                      {SEGMENT_ORDER.map((segmentId) => {
                        const config = SEGMENT_CONFIGS[segmentId];
                        const Icon = SEGMENT_ICONS[segmentId];
                        const isActive = activeSegment === segmentId;
                        return (
                          <Link
                            key={segmentId}
                            href={`/${segmentId}`}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={cn(
                              "flex items-center gap-3 px-2 py-2 rounded-md transition-colors",
                              isActive 
                                ? "bg-primary/10 text-primary" 
                                : "hover:bg-muted"
                            )}
                          >
                            <Icon className="h-4 w-4" />
                            <span className="font-medium">{config.name}</span>
                          </Link>
                        );
                      })}
                    </div>

                    {/* Quick links */}
                    <div className="space-y-1 pt-4 border-t">
                      <p className="text-xs font-medium text-muted-foreground uppercase px-2">Links Rápidos</p>
                      {topLinks.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-muted transition-colors"
                        >
                          <link.icon className="h-4 w-4 text-muted-foreground" />
                          <span>{link.label}</span>
                        </Link>
                      ))}
                    </div>

                    {/* Auth */}
                    <div className="pt-4 border-t">
                      {userProfileWithPermissions ? (
                        <Button variant="outline" className="w-full" asChild>
                          <Link href="/profile">
                            <User className="h-4 w-4 mr-2" />
                            Minha Conta
                          </Link>
                        </Button>
                      ) : (
                        <Button className="w-full" asChild>
                          <Link href="/auth/login">
                            <LogIn className="h-4 w-4 mr-2" />
                            Entrar / Criar conta
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Segment navigation */}
      <div className="hidden md:block border-t bg-muted/20">
        <div className="container mx-auto px-4">
          <NavigationMenu className="max-w-none justify-start">
            <NavigationMenuList className="gap-0">
              {SEGMENT_ORDER.map((segmentId) => {
                const config = SEGMENT_CONFIGS[segmentId];
                const Icon = SEGMENT_ICONS[segmentId];
                const isActive = activeSegment === segmentId;

                return (
                  <NavigationMenuItem key={segmentId}>
                    <NavigationMenuTrigger 
                      className={cn(
                        "h-11 rounded-none border-b-2 border-transparent data-[state=open]:border-primary",
                        isActive && "border-primary bg-muted/50"
                      )}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {config.name}
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <div className="grid gap-3 p-4 w-[500px] lg:w-[600px] lg:grid-cols-2">
                        <div className="space-y-3">
                          <h4 className="font-medium text-sm text-muted-foreground uppercase">
                            Categorias
                          </h4>
                          {config.categories.map((category) => (
                            <NavigationMenuLink asChild key={category.id}>
                              <Link
                                href={`/${segmentId}?category=${category.slug}`}
                                className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium">{category.name}</span>
                                  <Badge variant="secondary" className="text-xs">
                                    {category.count}
                                  </Badge>
                                </div>
                                <p className="line-clamp-1 text-xs text-muted-foreground">
                                  {category.description}
                                </p>
                              </Link>
                            </NavigationMenuLink>
                          ))}
                        </div>
                        <div className="space-y-3">
                          <h4 className="font-medium text-sm text-muted-foreground uppercase">
                            Acesso Rápido
                          </h4>
                          {config.menuItems.map((item) => (
                            <NavigationMenuLink asChild key={item.href}>
                              <Link
                                href={item.href}
                                className="flex items-center gap-2 select-none rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                              >
                                <span className="text-sm font-medium">{item.label}</span>
                                {item.badge && (
                                  <Badge variant="default" className="text-xs">
                                    {item.badge}
                                  </Badge>
                                )}
                              </Link>
                            </NavigationMenuLink>
                          ))}
                          <NavigationMenuLink asChild>
                            <Link
                              href={`/${segmentId}`}
                              className="flex items-center justify-center gap-2 select-none rounded-md p-3 bg-primary text-primary-foreground leading-none no-underline outline-none transition-colors hover:bg-primary/90"
                            >
                              <span className="text-sm font-medium">Ver todos em {config.name}</span>
                            </Link>
                          </NavigationMenuLink>
                        </div>
                      </div>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                );
              })}
            </NavigationMenuList>
          </NavigationMenu>
        </div>
      </div>
    </header>
  );
}
