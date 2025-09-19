import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck } from 'lucide-react';
import { nowInSaoPaulo, formatInSaoPaulo } from '@/lib/timezone'; // Import timezone functions

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <section className="text-center py-12">
        <ShieldCheck className="mx-auto h-12 w-12 text-primary mb-4" />
        <h1 className="text-4xl font-bold mb-4 font-headline">Privacy Policy</h1>
        <p className="text-lg text-muted-foreground">
          Your privacy is important to us. This policy explains how we handle your personal information.
        </p>
        <p className="text-sm text-muted-foreground mt-2">Last Updated: {formatInSaoPaulo(nowInSaoPaulo(), 'dd/MM/yyyy')}</p>
      </section>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">1. Information We Collect</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground space-y-2 text-sm">
          <p>We collect information you provide directly to us, such as when you create an account, list an item, place a bid, or communicate with us. This may include your name, email address, postal address, phone number, and payment information.</p>
          <p>We also collect information automatically when you use our Service, such as your IP address, device information, browsing history, and interactions with our platform.</p>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">2. How We Use Your Information</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground space-y-2 text-sm">
          <p>We use your information to:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Provide, maintain, and improve our Service.</li>
            <li>Process transactions and send you related information, including confirmations and invoices.</li>
            <li>Communicate with you about products, services, offers, promotions, and events.</li>
            <li>Monitor and analyze trends, usage, and activities in connection with our Service.</li>
            <li>Personalize the Service and provide advertisements, content, or features that match user profiles or interests.</li>
            <li>Detect, investigate, and prevent fraudulent transactions and other illegal activities and protect the rights and property of BidExpert and others.</li>
          </ul>
        </CardContent>
      </Card>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">3. Sharing of Information</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground space-y-2 text-sm">
          <p>We may share your information with third-party vendors and service providers that perform services on our behalf, such as payment processing and data analytics.</p>
          <p>We may also share information between buyers and sellers as necessary to facilitate transactions (e.g., shipping information).</p>
          <p>We will not sell your personal information to third parties.</p>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">4. Data Security</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground space-y-2 text-sm">
          <p>We take reasonable measures to help protect information about you from loss, theft, misuse, and unauthorized access, disclosure, alteration, and destruction.</p>
        </CardContent>
      </Card>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">5. Your Choices</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground space-y-2 text-sm">
          <p>You may update, correct, or delete information about you at any time by logging into your account or contacting us. If you wish to delete your account, please contact us, but note that we may retain certain information as required by law or for legitimate business purposes.</p>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">6. Changes to This Policy</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground space-y-2 text-sm">
          <p>We may change this Privacy Policy from time to time. If we make changes, we will notify you by revising the date at the top of the policy and, in some cases, we may provide you with additional notice (such as adding a statement to our homepage or sending you a notification).</p>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">7. Contact Us</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground space-y-2 text-sm">
          <p>If you have any questions about this Privacy Policy, please contact us at privacy@bidexpert.com.</p>
        </CardContent>
      </Card>
    </div>
  );
}
