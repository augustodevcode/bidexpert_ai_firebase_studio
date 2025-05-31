import Link from 'next/link';
import { Coins, Search, UserCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import MainNav from './main-nav';
import UserNav from './user-nav';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <Coins className="h-6 w-6 text-primary" />
          <span className="font-bold sm:inline-block text-lg">
            BidExpert
          </span>
        </Link>
        
        <MainNav className="mx-6" />

        <div className="ml-auto flex items-center space-x-4">
          <form className="relative hidden md:block">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search auctions..."
              className="h-9 pl-8 w-full md:w-[200px] lg:w-[300px]"
            />
          </form>
          <UserNav />
        </div>
      </div>
    </header>
  );
}
