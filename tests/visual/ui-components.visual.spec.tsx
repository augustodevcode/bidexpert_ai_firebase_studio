/**
 * Visual Regression Tests - UI Components
 * 
 * Demonstrates Vitest Browser Mode Visual Regression Testing pattern
 * per https://vitest.dev/guide/browser/visual-regression-testing.html
 * 
 * Uses simple UI components without Next.js server dependencies.
 */
import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, Star, Clock, Users } from 'lucide-react';
import ConsignorLogoBadge from '@/components/consignor-logo-badge';

describe('UI Components Visual Regression Tests', () => {
  beforeEach(async () => {
    // Set consistent viewport for all tests
    await page.viewport(1280, 720);
  });

  describe('Button Component', () => {
    it('should render default button', async () => {
      await render(
        <Button data-testid="btn-default">Click me</Button>
      );
      
      const button = page.getByTestId('btn-default');
      await expect.element(button).toBeVisible();
      await expect(button).toMatchScreenshot('button-default');
    });

    it('should render button variants', async () => {
      await render(
        <div className="flex gap-4 p-4" data-testid="button-variants">
          <Button variant="default">Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
        </div>
      );
      
      await expect.element(page.getByTestId('button-variants')).toBeVisible();
      await expect(page.getByTestId('button-variants')).toMatchScreenshot('button-variants');
    });

    it('should render button sizes', async () => {
      await render(
        <div className="flex items-center gap-4 p-4" data-testid="button-sizes">
          <Button size="sm">Small</Button>
          <Button size="default">Default</Button>
          <Button size="lg">Large</Button>
          <Button size="icon"><Star className="h-4 w-4" /></Button>
        </div>
      );
      
      await expect.element(page.getByTestId('button-sizes')).toBeVisible();
      await expect(page.getByTestId('button-sizes')).toMatchScreenshot('button-sizes');
    });

    it('should render disabled button', async () => {
      await render(
        <Button disabled data-testid="btn-disabled">Disabled</Button>
      );
      
      const button = page.getByTestId('btn-disabled');
      await expect.element(button).toBeVisible();
      await expect(button).toMatchScreenshot('button-disabled');
    });
  });

  describe('Badge Component', () => {
    it('should render badge variants', async () => {
      await render(
        <div className="flex gap-4 p-4" data-testid="badge-variants">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="destructive">Destructive</Badge>
          <Badge variant="outline">Outline</Badge>
        </div>
      );
      
      await expect.element(page.getByTestId('badge-variants')).toBeVisible();
      await expect(page.getByTestId('badge-variants')).toMatchScreenshot('badge-variants');
    });

    it('should render badges with icons', async () => {
      await render(
        <div className="flex gap-4 p-4" data-testid="badge-icons">
          <Badge className="flex items-center gap-1">
            <Clock className="h-3 w-3" /> Urgente
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Users className="h-3 w-3" /> 48 Habilitados
          </Badge>
          <Badge className="bg-green-600 text-white flex items-center gap-1">
            <Star className="h-3 w-3" /> Destaque
          </Badge>
        </div>
      );
      
      await expect.element(page.getByTestId('badge-icons')).toBeVisible();
      await expect(page.getByTestId('badge-icons')).toMatchScreenshot('badge-icons');
    });
  });

  describe('Card Component', () => {
    it('should render basic card', async () => {
      await render(
        <Card className="w-80" data-testid="card-basic">
          <CardHeader>
            <CardTitle>Auction Title</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This is a sample auction card for visual testing.
            </p>
          </CardContent>
          <CardFooter>
            <Button className="w-full">Ver Detalhes</Button>
          </CardFooter>
        </Card>
      );
      
      await expect.element(page.getByTestId('card-basic')).toBeVisible();
      await expect(page.getByTestId('card-basic')).toMatchScreenshot('card-basic');
    });

    it('should render auction-style card', async () => {
      await render(
        <Card className="w-80 overflow-hidden" data-testid="card-auction">
          <div className="relative">
            <div className="aspect-video bg-gradient-to-br from-blue-400 to-blue-600" />
            <div className="absolute top-2 left-2">
              <Badge className="bg-green-600 text-white">Aberto</Badge>
            </div>
            <div className="absolute top-2 right-2 flex flex-col gap-1">
              <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                <Clock className="h-3 w-3 mr-1" /> Encerra Hoje
              </Badge>
            </div>
          </div>
          <CardContent className="p-4 space-y-3">
            <p className="text-xs text-muted-foreground">ID: LEI-2024-001</p>
            <h3 className="font-bold text-lg leading-tight">
              Leilão de Imóveis Residenciais - Centro SP
            </h3>
            <div className="grid grid-cols-3 gap-2 text-center text-xs text-muted-foreground">
              <div><span className="font-semibold text-foreground">15</span> Lotes</div>
              <div><span className="font-semibold text-foreground">1.250</span> Visitas</div>
              <div><span className="font-semibold text-foreground">48</span> Habilitados</div>
            </div>
            <div className="flex gap-1.5">
              <Badge variant="outline" className="rounded-full text-xs">
                1ª Praça: 15/01 10:00
              </Badge>
              <Badge variant="outline" className="rounded-full text-xs">
                2ª Praça: 22/01 10:00
              </Badge>
            </div>
          </CardContent>
          <CardFooter className="p-4 border-t flex justify-between items-end">
            <div>
              <p className="text-xs text-muted-foreground">A partir de</p>
              <p className="text-lg font-bold text-primary">R$ 250.000,00</p>
            </div>
            <Button size="sm">Ver Lotes (15)</Button>
          </CardFooter>
        </Card>
      );
      
      await expect.element(page.getByTestId('card-auction')).toBeVisible();
      await expect(page.getByTestId('card-auction')).toMatchScreenshot('card-auction-style');
    });

    it('should render card with consignor logo overlay', async () => {
      await render(
        <Card className="w-80 overflow-hidden" data-testid="card-consignor-logo">
          <div className="relative">
            <div className="aspect-video bg-gradient-to-br from-emerald-500 to-teal-600" />
            <ConsignorLogoBadge
              logoUrl="https://placehold.co/160x160.png?text=Logo"
              name="Comitente Visual"
              anchorClassName="absolute top-2 left-2"
            />
          </div>
          <CardContent className="p-4 space-y-2">
            <p className="text-xs text-muted-foreground">ID: VIS-001</p>
            <h3 className="font-bold text-lg leading-tight">Card com logo do comitente</h3>
            <p className="text-sm text-muted-foreground">Demonstração visual do overlay do logotipo sobre a imagem.</p>
          </CardContent>
        </Card>
      );

      await expect.element(page.getByTestId('card-consignor-logo')).toBeVisible();
      await expect(page.getByTestId('card-consignor-logo')).toMatchScreenshot('card-consignor-logo-overlay');
    });
  });

  describe('Interactive States', () => {
    it('should capture button hover state', async () => {
      await render(
        <Button data-testid="btn-hover">Hover me</Button>
      );
      
      const button = page.getByTestId('btn-hover');
      await expect.element(button).toBeVisible();
      
      // Hover over the button
      await userEvent.hover(button);
      
      // Wait a moment for hover styles to apply
      await new Promise(resolve => setTimeout(resolve, 100));
      
      await expect(button).toMatchScreenshot('button-hover-state');
    });

    it('should capture favorite toggle interaction', async () => {
      const FavoriteButton = () => {
        const [isFavorite, setIsFavorite] = React.useState(false);
        return (
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => setIsFavorite(!isFavorite)}
            data-testid="favorite-button"
          >
            <Heart className={`h-4 w-4 ${isFavorite ? 'text-red-500 fill-red-500' : ''}`} />
          </Button>
        );
      };
      
      await render(<FavoriteButton />);
      
      const button = page.getByTestId('favorite-button');
      await expect.element(button).toBeVisible();
      
      // Capture initial state
      await expect(button).toMatchScreenshot('favorite-button-initial');
      
      // Click to toggle
      await button.click();
      
      // Capture toggled state
      await expect(button).toMatchScreenshot('favorite-button-toggled');
    });
  });

  describe('Grid Layouts', () => {
    it('should render card grid layout', async () => {
      const cards = [
        { id: 1, title: 'Leilão A', status: 'Aberto', price: 150000 },
        { id: 2, title: 'Leilão B', status: 'Em Breve', price: 250000 },
        { id: 3, title: 'Leilão C', status: 'Finalizado', price: 350000 },
      ];
      
      await render(
        <div className="grid grid-cols-3 gap-4 p-4" data-testid="card-grid">
          {cards.map(card => (
            <Card key={card.id} className="overflow-hidden">
              <div className="aspect-video bg-gradient-to-br from-slate-300 to-slate-500" />
              <CardContent className="p-3">
                <Badge className={
                  card.status === 'Aberto' ? 'bg-green-600 text-white' :
                  card.status === 'Em Breve' ? 'bg-blue-500 text-white' :
                  'bg-gray-500 text-white'
                }>
                  {card.status}
                </Badge>
                <h3 className="font-bold mt-2">{card.title}</h3>
                <p className="text-lg font-bold text-primary mt-1">
                  R$ {card.price.toLocaleString('pt-BR')}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      );
      
      await expect.element(page.getByTestId('card-grid')).toBeVisible();
      await expect(page.getByTestId('card-grid')).toMatchScreenshot('card-grid-layout');
    });
  });
});
