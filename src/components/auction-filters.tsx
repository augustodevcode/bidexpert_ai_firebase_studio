'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter, ArrowUpDown, Search } from 'lucide-react';

export default function AuctionFilters() {
  // Placeholder categories and sort options
  const categories = ['All', 'Watches', 'Antiques', 'Collectibles', 'Art', 'Electronics', 'Fashion'];
  const sortOptions = ['Ending Soonest', 'Newly Listed', 'Highest Bid', 'Lowest Bid'];

  return (
    <div className="mb-8 p-6 bg-secondary/50 rounded-lg shadow">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
        <div className="space-y-1">
          <label htmlFor="search" className="text-sm font-medium text-muted-foreground">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="search" placeholder="Search by keyword..." className="pl-10" />
          </div>
        </div>
        
        <div className="space-y-1">
          <label htmlFor="category" className="text-sm font-medium text-muted-foreground">Category</label>
          <Select>
            <SelectTrigger id="category">
              <SelectValue placeholder="Select Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category.toLowerCase()}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label htmlFor="sort" className="text-sm font-medium text-muted-foreground">Sort By</label>
          <Select>
            <SelectTrigger id="sort">
              <SelectValue placeholder="Sort Auctions" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option} value={option.toLowerCase().replace(' ', '-')}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Button className="w-full md:w-auto lg:mt-0 mt-4">
          <Filter className="mr-2 h-4 w-4" /> Apply Filters
        </Button>
      </div>
    </div>
  );
}
