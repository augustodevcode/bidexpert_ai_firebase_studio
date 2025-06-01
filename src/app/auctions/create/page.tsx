
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';
import { Loader2, Sparkles, Lightbulb, ListChecks, BarChart2, ImagePlus, DollarSign } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from '@/components/ui/separator';
import {
  fetchListingDetailsSuggestions,
  fetchOpeningValuePrediction,
  fetchSimilarListingsSuggestions,
  type AISuggestionState,
} from './actions';
import type { SuggestListingDetailsOutput, PredictOpeningValueOutput, SuggestSimilarListingsOutput } from './actions';


const auctionFormSchema = z.object({
  auctionTitle: z.string().min(5, { message: 'Title must be at least 5 characters.' }),
  auctionDescription: z.string().min(20, { message: 'Description must be at least 20 characters.' }),
  auctionCategory: z.string().min(1, { message: 'Please select a category.' }),
  startingBid: z.coerce.number().positive({ message: "Starting bid must be positive."}).optional(),
  auctionKeywords: z.string().min(3, { message: 'Keywords must be at least 3 characters.' }),
  condition: z.enum(['New', 'Used - Like New', 'Used - Good', 'Used - Fair', 'Parts Only'], { required_error: "Please select item condition." }),
  desiredAuctionLengthDays: z.coerce.number().min(1).max(30),
  // Placeholder for image uploads, actual validation would be more complex
  itemImages: z.any().optional(),
  recentAuctionData: z.string().optional().describe('JSON array of recent, similar successful auctions'),
  pastAuctionData: z.string().optional().describe('Summary of past auction data for similar items'),
});

type AuctionFormValues = z.infer<typeof auctionFormSchema>;

const initialAISuggestionsState: AISuggestionState = {
  listingDetails: null,
  openingValue: null,
  similarListings: null,
};

export default function CreateAuctionPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestionState>(initialAISuggestionsState);

  const form = useForm<AuctionFormValues>({
    resolver: zodResolver(auctionFormSchema),
    defaultValues: {
      auctionTitle: '',
      auctionDescription: '',
      auctionCategory: '',
      startingBid: undefined,
      auctionKeywords: '',
      condition: undefined,
      desiredAuctionLengthDays: 7,
      itemImages: undefined,
      recentAuctionData: '[]',
      pastAuctionData: '',
    },
  });

  async function onSubmit(data: AuctionFormValues) {
    setIsLoading(true);
    setError(null);
    setAiSuggestions(initialAISuggestionsState);

    try {
      const [listingDetailsRes, openingValueRes, similarListingsRes] = await Promise.allSettled([
        fetchListingDetailsSuggestions({
          auctionTitle: data.auctionTitle,
          auctionDescription: data.auctionDescription,
          auctionCategory: data.auctionCategory,
          auctionKeywords: data.auctionKeywords,
          recentAuctionData: data.recentAuctionData || '[]',
        }),
        fetchOpeningValuePrediction({
          itemDescription: data.auctionDescription,
          category: data.auctionCategory,
          condition: data.condition,
          pastAuctionData: data.pastAuctionData || 'No past auction data provided.',
        }),
        fetchSimilarListingsSuggestions({
          itemCategory: data.auctionCategory,
          itemDescription: data.auctionDescription,
          sellerId: 'current_user_placeholder', // Replace with actual seller ID
          desiredAuctionLengthDays: data.desiredAuctionLengthDays,
        })
      ]);
      
      const newSuggestions: AISuggestionState = {};
      if (listingDetailsRes.status === 'fulfilled') newSuggestions.listingDetails = listingDetailsRes.value;
      if (openingValueRes.status === 'fulfilled') newSuggestions.openingValue = openingValueRes.value;
      if (similarListingsRes.status === 'fulfilled') newSuggestions.similarListings = similarListingsRes.value;
      setAiSuggestions(newSuggestions);

      let combinedError = "";
      if (listingDetailsRes.status === 'rejected') combinedError += `Listing Details Error: ${listingDetailsRes.reason?.message || 'Unknown error'}. `;
      if (openingValueRes.status === 'rejected') combinedError += `Opening Value Error: ${openingValueRes.reason?.message || 'Unknown error'}. `;
      if (similarListingsRes.status === 'rejected') combinedError += `Similar Listings Error: ${similarListingsRes.reason?.message || 'Unknown error'}. `;
      if (combinedError) setError(combinedError);

    } catch (e: any) {
      setError(e.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  }

  const itemConditions: AuctionFormValues['condition'][] = ['New', 'Used - Like New', 'Used - Good', 'Used - Fair', 'Parts Only'];
  const categories = ['Watches', 'Antiques', 'Collectibles', 'Art', 'Electronics', 'Fashion', 'Books', 'Home Goods', 'Sporting Goods', 'Other'];


  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold flex items-center font-headline">
            <Sparkles className="h-8 w-8 mr-3 text-primary" /> Create New Auction
          </CardTitle>
          <CardDescription>
            Fill in the details for your auction item. Use our AI tools to get suggestions for optimizing your listing!
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="auctionTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Auction Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Vintage Rolex Submariner Watch" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="auctionDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Detailed description of your item, including features, history, and any imperfections." {...field} rows={5} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="itemImages"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item Images</FormLabel>
                    <FormControl>
                      <div className="flex items-center justify-center w-full">
                        <label
                          htmlFor="dropzone-file"
                          className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-secondary/30 hover:bg-secondary/50 border-muted-foreground/50"
                        >
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <ImagePlus className="w-10 h-10 mb-3 text-muted-foreground" />
                            <p className="mb-2 text-sm text-muted-foreground">
                              <span className="font-semibold">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-xs text-muted-foreground">SVG, PNG, JPG or GIF (MAX. 800x400px)</p>
                          </div>
                          <input id="dropzone-file" type="file" className="hidden" multiple onChange={(e) => field.onChange(e.target.files)} />
                        </label>
                      </div>
                    </FormControl>
                    <FormDescription>Upload at least one image for your item. The first image will be the main image.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="auctionCategory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="condition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Condition</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select item condition" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                           {itemConditions.map(cond => <SelectItem key={cond} value={cond}>{cond}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                 <FormField
                  control={form.control}
                  name="startingBid"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Starting Bid (Optional)</FormLabel>
                      <FormControl>
                        <div className="relative">
                           <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                           <Input type="number" placeholder="e.g., 50.00" {...field} className="pl-8" onChange={e => field.onChange(parseFloat(e.target.value))} />
                        </div>
                      </FormControl>
                      <FormDescription>Leave blank to use AI suggested opening value.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="desiredAuctionLengthDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Desired Auction Length (Days)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="auctionKeywords"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Keywords</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., luxury watch, vintage, collectible, automatic" {...field} />
                    </FormControl>
                    <FormDescription>Comma-separated keywords to help buyers find your item.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />
              <h3 className="text-lg font-semibold text-muted-foreground flex items-center"><Lightbulb className="h-5 w-5 mr-2 text-amber-500" /> AI Input Data (Optional)</h3>
              <FormDescription>
                Providing data about similar past auctions can help our AI generate more accurate suggestions for your listing details and opening bid.
              </FormDescription>
              
              <FormField
                control={form.control}
                name="recentAuctionData"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recent Similar Auction Data (JSON Format)</FormLabel>
                    <FormControl>
                      <Textarea placeholder='e.g., [{"title": "Similar Item 1", "finalPrice": 500}, {"title": "Another Item", "finalPrice": 650}]' {...field} rows={3} />
                    </FormControl>
                    <FormDescription>Provide JSON data of recent successful auctions for similar items to improve AI suggestions for listing details.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="pastAuctionData"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Past Auction Data Summary (Text)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g., Similar items in this category usually sell between $400-$700. Auctions lasting 7 days with good photos get more bids." {...field} rows={3} />
                    </FormControl>
                    <FormDescription>A brief summary of past performance for similar items, if available, to help predict an optimal opening value.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex flex-col items-stretch space-y-4">
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                Get AI Suggestions & Review
              </Button>
              <div className="grid grid-cols-2 gap-4">
                <Button type="button" variant="outline" disabled={isLoading} className="w-full">
                  Save Draft (Prototype)
                </Button>
                 <Button type="button" variant="secondary" disabled={isLoading} className="w-full">
                  List Without AI (Prototype)
                </Button>
              </div>
            </CardFooter>
          </form>
        </Form>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {(aiSuggestions.listingDetails || aiSuggestions.openingValue || aiSuggestions.similarListings) && !isLoading && (
        <Card className="shadow-xl mt-8">
          <CardHeader>
            <CardTitle className="text-2xl font-bold flex items-center font-headline">
              <Lightbulb className="h-7 w-7 mr-3 text-amber-500" /> AI-Powered Suggestions
            </CardTitle>
            <CardDescription>
              Review these suggestions to optimize your auction listing. You can accept them or use your own values.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {aiSuggestions.listingDetails && (
              <section>
                <h3 className="text-xl font-semibold mb-2 flex items-center"><ListChecks className="h-5 w-5 mr-2 text-primary" /> Listing Details Optimization</h3>
                <div className="space-y-3 p-4 bg-secondary/30 rounded-lg">
                  <p><strong>Suggested Title:</strong> {aiSuggestions.listingDetails.suggestedTitle}</p>
                  <p><strong>Suggested Description:</strong> {aiSuggestions.listingDetails.suggestedDescription}</p>
                  <p><strong>Suggested Category:</strong> {aiSuggestions.listingDetails.suggestedCategory}</p>
                  <p><strong>Suggested Keywords:</strong> {aiSuggestions.listingDetails.suggestedKeywords}</p>
                  <p><strong>AI Predicted Opening Value:</strong> ${aiSuggestions.listingDetails.predictedOpeningValue.toLocaleString()}</p>
                  {aiSuggestions.listingDetails.similarListings.length > 0 && (
                    <div>
                      <strong>Similar Listing Titles (Inspiration):</strong>
                      <ul className="list-disc list-inside ml-4 text-sm">
                        {aiSuggestions.listingDetails.similarListings.map((title, idx) => <li key={idx}>{title}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              </section>
            )}

            {aiSuggestions.openingValue && (
              <section>
                <h3 className="text-xl font-semibold mb-2 flex items-center"><BarChart2 className="h-5 w-5 mr-2 text-primary" /> AI Optimal Opening Bid</h3>
                 <div className="space-y-3 p-4 bg-secondary/30 rounded-lg">
                  <p><strong>AI Suggested Opening Value:</strong> ${aiSuggestions.openingValue.suggestedOpeningValue.toLocaleString()}</p>
                  <p><strong>Reasoning:</strong> {aiSuggestions.openingValue.reasoning}</p>
                </div>
              </section>
            )}

            {aiSuggestions.similarListings && aiSuggestions.similarListings.listings.length > 0 && (
              <section>
                <h3 className="text-xl font-semibold mb-2 flex items-center"><ListChecks className="h-5 w-5 mr-2 text-primary" /> Detailed Similar Listings (AI Insight)</h3>
                <div className="space-y-4">
                  {aiSuggestions.similarListings.listings.map((listing, idx) => (
                    <Card key={idx} className="bg-secondary/30">
                      <CardHeader>
                        <CardTitle className="text-md">{listing.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm space-y-1">
                        <p><strong>Description Snippet:</strong> {listing.description.substring(0,150)}...</p>
                        <p><strong>Winning Bid:</strong> ${listing.winningBid.toLocaleString()}</p>
                        <p><strong>Auction Length:</strong> {listing.auctionLengthDays} days</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}
            <Button className="w-full mt-6" disabled>Proceed to List Auction (Prototype)</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


    