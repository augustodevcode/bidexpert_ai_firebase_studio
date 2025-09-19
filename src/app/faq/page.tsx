import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { HelpCircle } from 'lucide-react';

const faqItems = [
  {
    question: 'How do I create an account?',
    answer: 'To create an account, click on the "Register" button in the top right corner of the page. Fill in your details, and you\'ll be ready to start bidding and selling.',
  },
  {
    question: 'How do I place a bid?',
    answer: 'Navigate to the auction item you are interested in. Enter your bid amount in the designated field and click "Place Bid". Ensure your bid is higher than the current bid or meets the minimum increment.',
  },
  {
    question: 'What payment methods are accepted?',
    answer: 'We accept various payment methods including major credit cards (Visa, MasterCard, American Express) and PayPal. Specific payment options may vary by seller.',
  },
  {
    question: 'How does shipping work?',
    answer: 'Shipping terms are set by the seller for each item. Please check the item description for shipping costs, locations, and estimated delivery times. You can also contact the seller for more details.',
  },
  {
    question: 'What are the auction fees?',
    answer: 'BidExpert charges a small commission fee for sellers on successful sales. Buyers may incur taxes or shipping fees as specified by the seller. Please review our terms for detailed fee structures.',
  },
  {
    question: 'How can I sell an item?',
    answer: 'To sell an item, click on "Create Auction" after logging in. You will be guided through the process of describing your item, uploading photos, setting a starting bid, and auction duration. Our AI tools can help you optimize your listing!',
  },
];

export default function FAQPage() {
  return (
    <div className="max-w-3xl mx-auto" data-ai-id="faq-page-container">
      <section className="text-center py-12" data-ai-id="faq-page-hero-section">
         <HelpCircle className="mx-auto h-12 w-12 text-primary mb-4" />
        <h1 className="text-4xl font-bold mb-4 font-headline">Frequently Asked Questions</h1>
        <p className="text-lg text-muted-foreground">
          Find answers to common questions about using BidExpert.
        </p>
      </section>

      <Accordion type="single" collapsible className="w-full space-y-4" data-ai-id="faq-page-accordion">
        {faqItems.map((item, index) => (
          <AccordionItem value={`item-${index}`} key={index} className="bg-secondary/30 rounded-lg px-4 shadow-md">
            <AccordionTrigger className="text-left font-semibold hover:no-underline">
              {item.question}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              {item.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
