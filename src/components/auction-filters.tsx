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
    <div className="wrapper-auction-filters-legacy" data-ai-id="auction-filters-legacy">
      <div className="grid-auction-filters-legacy" data-ai-id="auction-filters-grid">
        <div className="wrapper-filter-field-legacy" data-ai-id="filter-search-legacy">
          <label htmlFor="search" className="label-filter-field-legacy">Search</label>
          <div className="wrapper-input-icon-legacy">
            <Search className="icon-filter-field-legacy" />
            <Input id="search" placeholder="Search by keyword..." className="input-filter-field-legacy" data-ai-id="filter-search-input-legacy" />
          </div>
        </div>
        
        <div className="wrapper-filter-field-legacy" data-ai-id="filter-category-legacy">
          <label htmlFor="category" className="label-filter-field-legacy">Category</label>
          <Select>
            <SelectTrigger id="category" className="trigger-filter-select-legacy" data-ai-id="filter-category-select-legacy">
              <SelectValue placeholder="Select Category" />
            </SelectTrigger>
            <SelectContent className="content-filter-select-legacy">
              {categories.map((category) => (
                <SelectItem key={category} value={category.toLowerCase()} className="item-filter-select-legacy">
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="wrapper-filter-field-legacy" data-ai-id="filter-sort-legacy">
          <label htmlFor="sort" className="label-filter-field-legacy">Sort By</label>
          <Select>
            <SelectTrigger id="sort" className="trigger-filter-select-legacy" data-ai-id="filter-sort-select-legacy">
              <SelectValue placeholder="Sort Auctions" />
            </SelectTrigger>
            <SelectContent className="content-filter-select-legacy">
              {sortOptions.map((option) => (
                <SelectItem key={option} value={option.toLowerCase().replace(' ', '-')} className="item-filter-select-legacy">
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Button className="btn-filter-apply-legacy" data-ai-id="filter-apply-button-legacy">
          <Filter className="icon-filter-apply-legacy" /> Apply Filters
        </Button>
      </div>
    </div>
  );
}
