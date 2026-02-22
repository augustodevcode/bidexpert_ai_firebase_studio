/**
 * @file currency-flag.tsx
 * @description Componente de bandeiras SVG inline para seleção de moeda (BRL, USD, EUR).
 * Renderiza bandeiras do Brasil, EUA e União Europeia como SVGs otimizados,
 * evitando dependência de emojis que podem não renderizar corretamente em todos os sistemas.
 */
'use client';

import { cn } from '@/lib/utils';

interface CurrencyFlagProps {
  /** Código da moeda ISO 4217 */
  code: 'BRL' | 'USD' | 'EUR';
  /** Tamanho da bandeira em pixels (largura). Altura ajustada proporcionalmente. */
  size?: number;
  /** Classes CSS adicionais */
  className?: string;
}

/** Bandeira do Brasil (proporção 7:10) */
function BrazilFlag({ size = 24, className }: { size?: number; className?: string }) {
  const h = Math.round(size * 0.7);
  return (
    <svg
      viewBox="0 0 120 84"
      width={size}
      height={h}
      className={cn('inline-block shrink-0 rounded-sm shadow-sm', className)}
      aria-label="Bandeira do Brasil"
      data-ai-id="currency-flag-brl"
    >
      <rect width="120" height="84" rx="4" fill="#009B3A" />
      <polygon points="60,6 114,42 60,78 6,42" fill="#FEDF00" />
      <circle cx="60" cy="42" r="22" fill="#002776" />
      <path
        d="M38,42 C44,34 56,30 72,34 C62,30 48,30 38,42z"
        fill="#FFFFFF"
        opacity="0.7"
      />
    </svg>
  );
}

/** Bandeira dos Estados Unidos (proporção 10:19) */
function USAFlag({ size = 24, className }: { size?: number; className?: string }) {
  const h = Math.round(size * 0.7);
  return (
    <svg
      viewBox="0 0 120 84"
      width={size}
      height={h}
      className={cn('inline-block shrink-0 rounded-sm shadow-sm', className)}
      aria-label="Bandeira dos Estados Unidos"
      data-ai-id="currency-flag-usd"
    >
      {/* Listras vermelhas e brancas */}
      <rect width="120" height="84" fill="#B22234" rx="4" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <rect key={i} y={i * 12.92 + 6.46} width="120" height="6.46" fill="#FFFFFF" />
      ))}
      {/* Cantão azul */}
      <rect width="48" height="45.24" fill="#3C3B6E" rx="4" />
      {/* Estrelas simplificadas (grid 3x3) */}
      {[
        [10, 8], [24, 8], [38, 8],
        [10, 20], [24, 20], [38, 20],
        [10, 32], [24, 32], [38, 32],
      ].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="2.5" fill="#FFFFFF" />
      ))}
    </svg>
  );
}

/** Bandeira da União Europeia */
function EUFlag({ size = 24, className }: { size?: number; className?: string }) {
  const h = Math.round(size * 0.7);
  return (
    <svg
      viewBox="0 0 120 84"
      width={size}
      height={h}
      className={cn('inline-block shrink-0 rounded-sm shadow-sm', className)}
      aria-label="Bandeira da União Europeia"
      data-ai-id="currency-flag-eur"
    >
      <rect width="120" height="84" rx="4" fill="#003399" />
      {/* 12 estrelas em círculo */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i * 30 - 90) * (Math.PI / 180);
        const cx = 60 + 26 * Math.cos(angle);
        const cy = 42 + 26 * Math.sin(angle);
        return (
          <polygon
            key={i}
            points={starPoints(cx, cy, 4, 2)}
            fill="#FFCC00"
          />
        );
      })}
    </svg>
  );
}

/** Gera pontos de uma estrela de 5 pontas */
function starPoints(cx: number, cy: number, outerR: number, innerR: number): string {
  const points: string[] = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (i * 36 - 90) * (Math.PI / 180);
    points.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
  }
  return points.join(' ');
}

/** Mapa de bandeiras por código de moeda */
const FLAG_COMPONENTS: Record<'BRL' | 'USD' | 'EUR', React.FC<{ size?: number; className?: string }>> = {
  BRL: BrazilFlag,
  USD: USAFlag,
  EUR: EUFlag,
};

/**
 * Renderiza a bandeira SVG correspondente ao código de moeda.
 *
 * @example
 * <CurrencyFlag code="BRL" size={20} />
 * <CurrencyFlag code="USD" size={24} />
 * <CurrencyFlag code="EUR" />
 */
export default function CurrencyFlag({ code, size = 24, className }: CurrencyFlagProps) {
  const FlagComponent = FLAG_COMPONENTS[code];
  if (!FlagComponent) return null;
  return <FlagComponent size={size} className={className} />;
}

export { BrazilFlag, USAFlag, EUFlag, CurrencyFlag };
