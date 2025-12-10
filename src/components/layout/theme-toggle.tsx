// src/components/layout/theme-toggle.tsx
'use client'

import * as React from 'react'
import { Moon, Sun, Palette, Check, Monitor, RotateCcw } from 'lucide-react'
import { useTheme } from 'next-themes'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from '@/components/ui/dropdown-menu'
import { themePresets, getStoredColorTheme, setStoredColorTheme, resetToDefaultTheme, getDefaultPreset } from '@/lib/theme-presets'
import { cn } from '@/lib/utils'

export function ThemeToggle({ variant = 'icon' }: { variant?: 'icon' | 'full' }) {
  const { setTheme, theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  const [colorTheme, setColorTheme] = React.useState('default')

  // Evita hydration mismatch
  React.useEffect(() => {
    setMounted(true)
    setColorTheme(getStoredColorTheme())
  }, [])

  const handleColorThemeChange = React.useCallback((presetId: string) => {
    setColorTheme(presetId)
    setStoredColorTheme(presetId)
    // Remove todas as classes de tema de cor anteriores
    document.documentElement.classList.forEach(cls => {
      if (cls.startsWith('theme-')) {
        document.documentElement.classList.remove(cls)
      }
    })
    // Adiciona a nova classe de tema de cor (exceto para default)
    if (presetId !== 'default') {
      document.documentElement.classList.add(`theme-${presetId}`)
    }
  }, [])

  const handleResetTheme = React.useCallback(() => {
    resetToDefaultTheme()
    setColorTheme('default')
    setTheme('system')
  }, [setTheme])

  // Aplica o tema de cor ao carregar
  React.useEffect(() => {
    if (mounted && colorTheme !== 'default') {
      document.documentElement.classList.add(`theme-${colorTheme}`)
    }
  }, [mounted, colorTheme])

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-9 w-9" disabled>
        <Sun className="h-[1.2rem] w-[1.2rem]" />
      </Button>
    )
  }

  const currentPreset = themePresets.find(p => p.id === colorTheme) || getDefaultPreset()
  const isDark = resolvedTheme === 'dark'

  if (variant === 'full') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full justify-start">
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="ml-2">Alternar Tema</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56 z-[9999]">
          <DropdownMenuLabel>Modo</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => setTheme('light')}>
            <Sun className="h-4 w-4 mr-2" />
            Claro
            {theme === 'light' && <Check className="h-4 w-4 ml-auto" />}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme('dark')}>
            <Moon className="h-4 w-4 mr-2" />
            Escuro
            {theme === 'dark' && <Check className="h-4 w-4 ml-auto" />}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme('system')}>
            <Monitor className="h-4 w-4 mr-2" />
            Tema do Sistema
            {theme === 'system' && <Check className="h-4 w-4 ml-auto" />}
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Cores</DropdownMenuLabel>
          {themePresets.map((preset) => (
            <DropdownMenuItem 
              key={preset.id} 
              onClick={() => handleColorThemeChange(preset.id)}
              className="flex items-center gap-2"
            >
              <div 
                className={cn(
                  "h-4 w-4 rounded-full border",
                  preset.isDefault ? "border-primary border-2" : "border-border"
                )}
                style={{ 
                  background: isDark 
                    ? preset.previewColors.dark.primary 
                    : preset.previewColors.light.primary 
                }}
              />
              <span className="flex-1">
                {preset.name}
                {preset.isDefault && <span className="text-xs text-muted-foreground ml-1">(Base)</span>}
              </span>
              {colorTheme === preset.id && <Check className="h-4 w-4 ml-auto" />}
            </DropdownMenuItem>
          ))}
          
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleResetTheme} className="text-muted-foreground">
            <RotateCcw className="h-4 w-4 mr-2" />
            Restaurar Padrão
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-9 w-9 text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          aria-label="Alternar tema de cores"
        >
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Alternar tema</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 z-[9999]">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Sun className="h-4 w-4" />
          Modo
        </DropdownMenuLabel>
        <DropdownMenuItem onClick={() => setTheme('light')}>
          <Sun className="h-4 w-4 mr-2" />
          Claro
          {theme === 'light' && <Check className="h-4 w-4 ml-auto text-primary" />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}>
          <Moon className="h-4 w-4 mr-2" />
          Escuro
          {theme === 'dark' && <Check className="h-4 w-4 ml-auto text-primary" />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')}>
          <Monitor className="h-4 w-4 mr-2" />
          Tema do Sistema
          {theme === 'system' && <Check className="h-4 w-4 ml-auto text-primary" />}
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuLabel className="flex items-center gap-2">
          <Palette className="h-4 w-4" />
          Cores
        </DropdownMenuLabel>
        {themePresets.map((preset) => (
          <DropdownMenuItem 
            key={preset.id} 
            onClick={() => handleColorThemeChange(preset.id)}
            className="flex items-center gap-2 cursor-pointer"
          >
            <div 
              className={cn(
                "h-5 w-5 rounded-full border-2 transition-all",
                colorTheme === preset.id 
                  ? "border-primary ring-2 ring-primary/30" 
                  : preset.isDefault 
                    ? "border-primary/50" 
                    : "border-border"
              )}
              style={{ 
                background: isDark 
                  ? preset.previewColors.dark.primary 
                  : preset.previewColors.light.primary 
              }}
            />
            <span className="flex-1">
              {preset.name}
              {preset.isDefault && <span className="text-xs text-muted-foreground ml-1">(Base)</span>}
            </span>
            {colorTheme === preset.id && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleResetTheme} className="text-muted-foreground cursor-pointer">
          <RotateCcw className="h-4 w-4 mr-2" />
          Restaurar Padrão
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
