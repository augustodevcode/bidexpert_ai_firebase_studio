import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <section className="text-center py-12">
        <FileText className="mx-auto h-12 w-12 text-primary mb-4" />
        <h1 className="text-4xl font-bold mb-4 font-headline">Terms of Service</h1>
        <p className="text-lg text-muted-foreground">
          Please read these terms carefully before using BidExpert.
        </p>
        <p className="text-sm text-muted-foreground mt-2">Last Updated: {new Date().toLocaleDateString()}</p>
      </section>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">1. Acceptance of Terms</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground space-y-2 text-sm">
          <p>By accessing or using the BidExpert platform ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of the terms, then you may not access the Service.</p>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">2. User Accounts</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground space-y-2 text-sm">
          <p>When you create an account with us, you must provide information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.</p>
          <p>You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password, whether your password is with our Service or a third-party service.</p>
        </CardContent>
      </Card>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">3. Auctions and Bidding</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground space-y-2 text-sm">
          <p>Sellers are responsible for the accuracy of their listings. Buyers are responsible for reviewing item descriptions and placing bids carefully. All bids are binding.</p>
          <p>BidExpert reserves the right to cancel auctions or bids at its discretion if fraudulent activity is suspected or if there is a violation of these Terms.</p>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">4. AI-Powered Guidance</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground space-y-2 text-sm">
          <p>The AI-powered auction guidance tools are provided for informational purposes only. BidExpert makes no guarantees regarding the accuracy or effectiveness of these suggestions. Sellers are ultimately responsible for their listing details and auction strategies.</p>
        </CardContent>
      </Card>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">5. Limitation of Liability</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground space-y-2 text-sm">
          <p>In no event shall BidExpert, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.</p>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">6. Changes to Terms</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground space-y-2 text-sm">
          <p>We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will try to provide at least 30 days notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.</p>
        </CardContent>
      </Card>

       <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">7. Contact Us</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground space-y-2 text-sm">
          <p>If you have any questions about these Terms, please contact us at support@bidexpert.com.</p>
        </CardContent>
      </Card>
    </div>
  );
}
