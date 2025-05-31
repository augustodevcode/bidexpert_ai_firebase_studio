import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Mail, MapPin, CalendarDays, Edit3 } from 'lucide-react';

// Placeholder user data
const user = {
  name: 'Alex Johnson',
  email: 'alex.johnson@example.com',
  avatarUrl: 'https://placehold.co/128x128.png',
  bio: 'Enthusiast of rare collectibles and vintage items. Active bidder and occasional seller.',
  location: 'New York, USA',
  memberSince: new Date('2022-08-15'),
  activeBids: 5,
  auctionsWon: 12,
  itemsSold: 3,
};

export default function ProfilePage() {
  return (
    <div className="max-w-3xl mx-auto">
      <Card className="shadow-xl">
        <CardHeader className="relative pb-0">
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-primary to-accent rounded-t-lg" />
          <div className="relative flex flex-col items-center pt-8 sm:flex-row sm:items-end sm:space-x-6">
            <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
              <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint="profile avatar" />
              <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            <div className="text-center sm:text-left mt-4 sm:mt-0 pb-2">
              <CardTitle className="text-3xl font-bold font-headline">{user.name}</CardTitle>
              <CardDescription className="text-muted-foreground">{user.email}</CardDescription>
            </div>
            <Button variant="outline" size="sm" className="absolute top-4 right-4 sm:static sm:ml-auto">
              <Edit3 className="h-4 w-4 mr-2" /> Edit Profile
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">About Me</h3>
            <p className="text-muted-foreground text-sm">{user.bio}</p>
          </div>

          <Separator className="my-6" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-6">
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-2 text-primary" />
              <span className="text-muted-foreground">Location:</span>
              <span className="ml-1 font-medium">{user.location}</span>
            </div>
            <div className="flex items-center">
              <CalendarDays className="h-4 w-4 mr-2 text-primary" />
              <span className="text-muted-foreground">Member Since:</span>
              <span className="ml-1 font-medium">{user.memberSince.toLocaleDateString()}</span>
            </div>
          </div>
          
          <Separator className="my-6" />

          <div>
            <h3 className="text-lg font-semibold mb-4">Auction Activity</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-secondary/50 rounded-lg">
                <p className="text-2xl font-bold text-primary">{user.activeBids}</p>
                <p className="text-xs text-muted-foreground">Active Bids</p>
              </div>
              <div className="p-4 bg-secondary/50 rounded-lg">
                <p className="text-2xl font-bold text-primary">{user.auctionsWon}</p>
                <p className="text-xs text-muted-foreground">Auctions Won</p>
              </div>
              <div className="p-4 bg-secondary/50 rounded-lg">
                <p className="text-2xl font-bold text-primary">{user.itemsSold}</p>
                <p className="text-xs text-muted-foreground">Items Sold</p>
              </div>
            </div>
          </div>

          <Separator className="my-6" />
          
          <div>
            <h3 className="text-lg font-semibold mb-2">My Listings</h3>
            <p className="text-muted-foreground text-sm">Your active and past listings will appear here.</p>
            {/* Placeholder for listings */}
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
