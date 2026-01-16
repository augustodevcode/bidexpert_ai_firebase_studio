// src/components/tenant-theme-provider.tsx
/**
 * @fileoverview Componente para injeção dinâmica de tema do tenant.
 * 
 * Este componente deve ser usado no layout raiz para aplicar as cores
 * personalizadas do tenant baseadas nas PlatformSettings.
 * 
 * COMO FUNCIONA:
 * 1. Recebe as settings do tenant (server-side)
 * 2. Gera o CSS com as variáveis customizadas
 * 3. Injeta o CSS via <style> tag no head
 * 4. O Tailwind/ShadCN usa automaticamente as variáveis sobrescritas
 */

'use client';

import { useEffect, useState } from 'react';
import { generateTenantThemeCss, type ThemeBrandingConfig } from '@/lib/theme-injector';

interface TenantThemeProviderProps {
  config: ThemeBrandingConfig | null;
  children: React.ReactNode;
}

/**
 * Provider de tema do tenant para componentes cliente.
 * Injeta CSS customizado baseado nas configurações do tenant.
 */
export function TenantThemeProvider({ config, children }: TenantThemeProviderProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Gera o CSS apenas se houver configurações
  const themeCss = config ? generateTenantThemeCss(config) : '';

  return (
    <>
      {/* Injeta o CSS customizado do tenant */}
      {mounted && themeCss && (
        <style 
          id="tenant-theme-css"
          dangerouslySetInnerHTML={{ __html: themeCss }}
        />
      )}
      {children}
    </>
  );
}

/**
 * Componente server-side para injeção de tema.
 * Usado diretamente no layout.tsx
 */
export function TenantThemeStyle({ config }: { config: ThemeBrandingConfig | null }) {
  if (!config) return null;
  
  const themeCss = generateTenantThemeCss(config);
  if (!themeCss) return null;

  return (
    <style 
      id="tenant-theme-css"
      dangerouslySetInnerHTML={{ __html: themeCss }}
    />
  );
}

/**
 * Componente para scripts customizados do tenant.
 * 
 * CUIDADO: Scripts customizados podem ser um risco de segurança.
 * Em produção, considere usar uma whitelist ou CSP.
 */
export function TenantHeadScripts({ scripts }: { scripts: string | null }) {
  if (!scripts) return null;

  return (
    <script 
      id="tenant-custom-scripts"
      dangerouslySetInnerHTML={{ __html: scripts }}
    />
  );
}
