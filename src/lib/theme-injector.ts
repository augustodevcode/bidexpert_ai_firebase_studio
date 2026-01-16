// src/lib/theme-injector.ts
/**
 * @fileoverview Utilitário para injeção dinâmica de CSS variables baseado nas
 * configurações de branding do tenant (PlatformSettings).
 * 
 * Este módulo gera o CSS necessário para sobrescrever as variáveis CSS do
 * design system (Tailwind/ShadCN) com as cores personalizadas de cada tenant.
 * 
 * FORMATO DAS CORES:
 * As cores são armazenadas no formato HSL sem o prefixo "hsl()" e sem os parênteses.
 * Exemplo: "210 40% 98%" (não "hsl(210, 40%, 98%)")
 * 
 * Isso permite usar diretamente nas variáveis CSS do Tailwind:
 * --primary: 210 40% 98%;
 * background: hsl(var(--primary));
 */

import type { PlatformSettings } from '@prisma/client';

export interface ThemeBrandingConfig {
  primaryColorHsl?: string | null;
  primaryForegroundHsl?: string | null;
  secondaryColorHsl?: string | null;
  secondaryForegroundHsl?: string | null;
  accentColorHsl?: string | null;
  accentForegroundHsl?: string | null;
  destructiveColorHsl?: string | null;
  mutedColorHsl?: string | null;
  backgroundColorHsl?: string | null;
  foregroundColorHsl?: string | null;
  borderColorHsl?: string | null;
  radiusValue?: string | null;
  customCss?: string | null;
  customFontUrl?: string | null;
}

/**
 * Gera o CSS de variáveis customizadas para o tenant.
 * 
 * @param config Configurações de branding do tenant
 * @returns String CSS para ser injetada no <style> tag
 */
export function generateTenantThemeCss(config: ThemeBrandingConfig): string {
  const cssVariables: string[] = [];

  // Cores principais
  if (config.primaryColorHsl) {
    cssVariables.push(`--primary: ${config.primaryColorHsl};`);
  }
  if (config.primaryForegroundHsl) {
    cssVariables.push(`--primary-foreground: ${config.primaryForegroundHsl};`);
  }
  
  // Cores secundárias
  if (config.secondaryColorHsl) {
    cssVariables.push(`--secondary: ${config.secondaryColorHsl};`);
  }
  if (config.secondaryForegroundHsl) {
    cssVariables.push(`--secondary-foreground: ${config.secondaryForegroundHsl};`);
  }
  
  // Cores de acento
  if (config.accentColorHsl) {
    cssVariables.push(`--accent: ${config.accentColorHsl};`);
  }
  if (config.accentForegroundHsl) {
    cssVariables.push(`--accent-foreground: ${config.accentForegroundHsl};`);
  }
  
  // Cores de estado
  if (config.destructiveColorHsl) {
    cssVariables.push(`--destructive: ${config.destructiveColorHsl};`);
  }
  if (config.mutedColorHsl) {
    cssVariables.push(`--muted: ${config.mutedColorHsl};`);
  }
  
  // Cores de fundo
  if (config.backgroundColorHsl) {
    cssVariables.push(`--background: ${config.backgroundColorHsl};`);
  }
  if (config.foregroundColorHsl) {
    cssVariables.push(`--foreground: ${config.foregroundColorHsl};`);
  }
  
  // Border
  if (config.borderColorHsl) {
    cssVariables.push(`--border: ${config.borderColorHsl};`);
    cssVariables.push(`--input: ${config.borderColorHsl};`);
  }
  
  // Radius
  if (config.radiusValue) {
    cssVariables.push(`--radius: ${config.radiusValue};`);
  }

  // Gera o CSS completo
  let css = '';
  
  // Font customizada
  if (config.customFontUrl) {
    css += `@import url('${config.customFontUrl}');\n`;
  }
  
  // Variáveis CSS
  if (cssVariables.length > 0) {
    css += `:root {\n  ${cssVariables.join('\n  ')}\n}\n`;
  }
  
  // CSS customizado adicional
  if (config.customCss) {
    css += `\n/* Custom CSS */\n${config.customCss}\n`;
  }

  return css;
}

/**
 * Gera o CSS a partir de PlatformSettings do Prisma.
 */
export function generateThemeCssFromSettings(settings: PlatformSettings | null): string {
  if (!settings) return '';
  
  return generateTenantThemeCss({
    primaryColorHsl: settings.primaryColorHsl,
    primaryForegroundHsl: settings.primaryForegroundHsl,
    secondaryColorHsl: settings.secondaryColorHsl,
    secondaryForegroundHsl: settings.secondaryForegroundHsl,
    accentColorHsl: settings.accentColorHsl,
    accentForegroundHsl: settings.accentForegroundHsl,
    destructiveColorHsl: settings.destructiveColorHsl,
    mutedColorHsl: settings.mutedColorHsl,
    backgroundColorHsl: settings.backgroundColorHsl,
    foregroundColorHsl: settings.foregroundColorHsl,
    borderColorHsl: settings.borderColorHsl,
    radiusValue: settings.radiusValue,
    customCss: settings.customCss,
    customFontUrl: settings.customFontUrl,
  });
}

/**
 * Gera o HTML para injeção no <head> (scripts customizados do tenant).
 * 
 * IMPORTANTE: Sanitize o conteúdo antes de usar em produção!
 * Considere usar uma whitelist de scripts permitidos.
 */
export function generateCustomHeadScripts(scripts: string | null): string {
  if (!scripts) return '';
  
  // Em produção, você deve validar/sanitizar esses scripts
  // ou usar uma abordagem mais segura como um CDN com scripts aprovados
  return scripts;
}

/**
 * Converte uma cor HEX para formato HSL (sem prefixo).
 * 
 * @param hex Cor em formato hexadecimal (ex: "#3b82f6")
 * @returns Cor em formato HSL (ex: "217 91% 60%")
 */
export function hexToHsl(hex: string): string {
  // Remove o # se presente
  hex = hex.replace(/^#/, '');
  
  // Parse RGB
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }
  
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

/**
 * Preset de temas para facilitar a configuração.
 */
export const THEME_PRESETS = {
  blue: {
    primaryColorHsl: '221 83% 53%',
    primaryForegroundHsl: '210 40% 98%',
    secondaryColorHsl: '210 40% 96%',
    accentColorHsl: '210 40% 96%',
  },
  green: {
    primaryColorHsl: '142 76% 36%',
    primaryForegroundHsl: '356 100% 97%',
    secondaryColorHsl: '240 5% 96%',
    accentColorHsl: '240 5% 96%',
  },
  orange: {
    primaryColorHsl: '25 95% 53%',
    primaryForegroundHsl: '60 9% 98%',
    secondaryColorHsl: '60 5% 96%',
    accentColorHsl: '60 5% 96%',
  },
  purple: {
    primaryColorHsl: '262 83% 58%',
    primaryForegroundHsl: '210 40% 98%',
    secondaryColorHsl: '220 14% 96%',
    accentColorHsl: '220 14% 96%',
  },
  red: {
    primaryColorHsl: '0 84% 60%',
    primaryForegroundHsl: '0 0% 98%',
    secondaryColorHsl: '0 0% 96%',
    accentColorHsl: '0 0% 96%',
  },
} as const;
